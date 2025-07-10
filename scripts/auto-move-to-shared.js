const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');

const namingBookPath = path.join(__dirname, '..', 'docs', 'project', 'sw-naming-book.json');
const namingBook = JSON.parse(fs.readFileSync(namingBookPath, 'utf8'));

const { scopes, functionalities, rules, dependency_rules } = namingBook;

const functionDefinitions = {};
const duplicateFunctionalities = {};

function extractFunctionalityType(name) {
  // Extract functionality from naming convention (e.g., swModuleFrontendFileHandler -> file)
  const match = name.match(/^sw(?:Module)?([A-Z][a-z]+)([A-Z][a-z]+)([A-Z][a-zA-Z0-9]*)$/);
  if (match) {
    const _scope = match[1].toLowerCase();
    const functionality = match[2].toLowerCase();
    return functionality;
  }
  return null;
}

function trackFunctionDefinition(name, filePath, module) {
  const functionalityType = extractFunctionalityType(name);
  if (!functionalityType) return;

  if (!functionDefinitions[functionalityType]) {
    functionDefinitions[functionalityType] = [];
  }
  functionDefinitions[functionalityType].push({ name, filePath, module });

  // Check for duplicate functionalities across different modules (excluding shared)
  const nonSharedModules = functionDefinitions[functionalityType]
    .filter((def) => def.module && !def.module.includes('shared'))
    .map((def) => def.module);
  const uniqueNonSharedModules = new Set(nonSharedModules);

  if (uniqueNonSharedModules.size > 1) {
    if (!duplicateFunctionalities[functionalityType]) {
      duplicateFunctionalities[functionalityType] = functionDefinitions[functionalityType];
    }
  }
}

function analyzeNode(node, sourceFile) {
  const currentModule = getModuleFromPath(sourceFile.fileName);

  if (ts.isVariableDeclaration(node) && node.name.text) {
    trackFunctionDefinition(node.name.text, sourceFile.fileName, currentModule);
  } else if (ts.isFunctionDeclaration(node) && node.name) {
    trackFunctionDefinition(node.name.text, sourceFile.fileName, currentModule);
  } else if (ts.isClassDeclaration(node) && node.name) {
    trackFunctionDefinition(node.name.text, sourceFile.fileName, currentModule);
  }

  ts.forEachChild(node, (child) => analyzeNode(child, sourceFile));
}

function analyzeFileContent(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
  analyzeNode(sourceFile, sourceFile);
}

function getModuleFromPath(filePath) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  if (relativePath.startsWith('apps/')) {
    return relativePath.split('/')[1];
  }
  if (relativePath.startsWith('packages/')) {
    return relativePath.split('/')[1];
  }
  return null;
}

function traverseDir(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`Warning: Directory not found, skipping: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (path.basename(fullPath) !== 'node_modules' && path.basename(fullPath) !== '.git') {
        traverseDir(fullPath);
      }
    } else {
      analyzeFileContent(fullPath);
    }
  }
}

function createSharedFile(functionalityType, definitions) {
  const sharedDir = path.join(__dirname, '..', dependency_rules.target_directory);
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  const fileName = `sw-shared-${functionalityType}-handler.ts`;
  const filePath = path.join(sharedDir, fileName);

  // Extract the first definition as template
  const firstDef = definitions.find((def) => !def.module.includes('shared'));
  if (!firstDef) return;

  const originalContent = fs.readFileSync(firstDef.filePath, 'utf8');
  const _sourceFile = ts.createSourceFile(
    firstDef.filePath,
    originalContent,
    ts.ScriptTarget.Latest,
    true
  );

  // Create shared version with proper naming
  const sharedName = `swShared${functionalityType.charAt(0).toUpperCase() + functionalityType.slice(1)}Handler`;
  const newContent = originalContent.replace(new RegExp(firstDef.name, 'g'), sharedName);

  fs.writeFileSync(filePath, newContent);
  console.log(`Created shared file: ${filePath}`);

  return { filePath, sharedName };
}

function findAllReferences(_functionalityType, definitions) {
  const references = [];
  const directoriesToScan = [
    path.join(__dirname, '..', 'apps'),
    path.join(__dirname, '..', 'packages'),
  ];

  function scanFileForReferences(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    definitions.forEach((def) => {
      if (content.includes(def.name)) {
        references.push({
          filePath,
          oldName: def.name,
          originalDefinition: def,
        });
      }
    });
  }

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (path.basename(fullPath) !== 'node_modules' && path.basename(fullPath) !== '.git') {
          scanDirectory(fullPath);
        }
      } else {
        scanFileForReferences(fullPath);
      }
    }
  }

  directoriesToScan.forEach((dir) => scanDirectory(dir));
  return references;
}

function updateImportsInFile(filePath, oldName, newImport, isOriginalFile = false) {
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;

  if (isOriginalFile) {
    // For the original file, remove the old definition and add import
    const lines = content.split('\n');
    const filteredLines = lines.filter((line) => {
      // Remove lines that define the old functionality
      return (
        !line.includes(`const ${oldName}`) &&
        !line.includes(`function ${oldName}`) &&
        !line.includes(`class ${oldName}`) &&
        !line.includes(`export const ${oldName}`) &&
        !line.includes(`export function ${oldName}`) &&
        !line.includes(`export class ${oldName}`)
      );
    });

    // Add import at the top
    const importStatement = `import { ${newImport.sharedName} } from '${newImport.relativePath}';`;
    const hasExistingImports = filteredLines.some((line) => line.trim().startsWith('import'));

    if (hasExistingImports) {
      // Find the last import line and add after it
      let lastImportIndex = -1;
      for (let i = 0; i < filteredLines.length; i++) {
        if (filteredLines[i].trim().startsWith('import')) {
          lastImportIndex = i;
        }
      }
      filteredLines.splice(lastImportIndex + 1, 0, importStatement);
    } else {
      // Add at the beginning
      filteredLines.unshift(importStatement);
    }

    updatedContent = filteredLines.join('\n');
  } else {
    // For files that reference the functionality, add import if not exists
    const hasImport = content.includes(`import { ${newImport.sharedName} }`);
    if (!hasImport) {
      const importStatement = `import { ${newImport.sharedName} } from '${newImport.relativePath}';\n`;
      updatedContent = importStatement + content;
    }
  }

  // Replace all occurrences of the old name with the new name
  updatedContent = updatedContent.replace(new RegExp(oldName, 'g'), newImport.sharedName);

  fs.writeFileSync(filePath, updatedContent);
  console.log(`Updated ${isOriginalFile ? 'original file' : 'references in'}: ${filePath}`);
}

function createBackupFiles(filePaths) {
  const backups = {};
  filePaths.forEach((filePath) => {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    backups[filePath] = backupPath;
  });
  return backups;
}

function restoreFromBackups(backups) {
  Object.keys(backups).forEach((originalPath) => {
    const backupPath = backups[originalPath];
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, originalPath);
      fs.unlinkSync(backupPath);
    }
  });
}

function cleanupBackups(backups) {
  Object.values(backups).forEach((backupPath) => {
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  });
}

function validateRefactoredCode(filePaths) {
  for (const filePath of filePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const _sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

      // Check for basic syntax errors
      const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([filePath], {}));
      if (diagnostics.length > 0) {
        console.error(`Syntax errors found in ${filePath}:`);
        diagnostics.forEach((diagnostic) => {
          console.error(`  ${diagnostic.messageText}`);
        });
        return false;
      }
    } catch (error) {
      console.error(`Failed to validate ${filePath}: ${error.message}`);
      return false;
    }
  }
  return true;
}

function refactorAllDependencies(functionalityType, definitions, sharedFile) {
  console.log(`\nRefactoring all dependencies for ${functionalityType} functionality...`);
  console.log('Using unbroken-code paradigm for safe refactoring.');

  // Find all files that reference this functionality
  const allReferences = findAllReferences(functionalityType, definitions);

  // Group references by file
  const fileReferences = {};
  allReferences.forEach((ref) => {
    if (!fileReferences[ref.filePath]) {
      fileReferences[ref.filePath] = [];
    }
    fileReferences[ref.filePath].push(ref);
  });

  const filesToUpdate = Object.keys(fileReferences);

  // Step 1: Create backups of all files to be modified
  console.log('Creating backups of files to be modified...');
  const backups = createBackupFiles(filesToUpdate);

  try {
    // Step 2: Update each file incrementally
    for (const filePath of filesToUpdate) {
      const refs = fileReferences[filePath];
      const isOriginalFile = definitions.some((def) => def.filePath === filePath);

      // Use the first reference to determine the old name
      const oldName = refs[0].oldName;

      const relativePath = path
        .relative(path.dirname(filePath), sharedFile.filePath)
        .replace(/\.ts$/, '');

      updateImportsInFile(
        filePath,
        oldName,
        {
          sharedName: sharedFile.sharedName,
          relativePath: relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
        },
        isOriginalFile
      );

      // Step 3: Validate the updated file immediately
      if (!validateRefactoredCode([filePath])) {
        console.error(`Validation failed for ${filePath}. Rolling back...`);
        restoreFromBackups({ [filePath]: backups[filePath] });
        throw new Error(`Refactoring failed at ${filePath}`);
      }
    }

    // Step 4: Final validation of all modified files
    console.log('Performing final validation of all modified files...');
    if (!validateRefactoredCode(filesToUpdate)) {
      console.error('Final validation failed. Rolling back all changes...');
      restoreFromBackups(backups);
      throw new Error('Refactoring failed final validation');
    }

    // Step 5: Clean up backups on success
    cleanupBackups(backups);
    console.log(
      `Successfully refactored ${filesToUpdate.length} files with unbroken-code paradigm.`
    );
  } catch (error) {
    console.error(`Refactoring failed: ${error.message}`);
    console.log('Restoring all files from backups...');
    restoreFromBackups(backups);
    throw error;
  }
}

function moveToShared() {
  console.log('Analyzing codebase for duplicate functionalities...');

  const directoriesToScan = [
    path.join(__dirname, '..', 'apps'),
    path.join(__dirname, '..', 'packages'),
  ];

  directoriesToScan.forEach((dir) => traverseDir(dir));

  console.log('\nFound duplicate functionalities:');
  let hasDuplicates = false;

  for (const functionalityType in duplicateFunctionalities) {
    const definitions = duplicateFunctionalities[functionalityType];
    const moduleGroups = {};

    definitions.forEach((def) => {
      if (def.module && !def.module.includes('shared')) {
        if (!moduleGroups[def.module]) {
          moduleGroups[def.module] = [];
        }
        moduleGroups[def.module].push(def);
      }
    });

    const moduleNames = Object.keys(moduleGroups);
    if (moduleNames.length > 1) {
      hasDuplicates = true;
      console.log(
        `\n${functionalityType} functionality found in modules: ${moduleNames.join(', ')}`
      );

      // Create shared version
      const sharedFile = createSharedFile(functionalityType, definitions);

      if (sharedFile) {
        // Refactor all dependencies across the entire codebase
        refactorAllDependencies(functionalityType, definitions, sharedFile);
      }
    }
  }

  if (!hasDuplicates) {
    console.log('No duplicate functionalities found across modules.');
  } else {
    console.log('\nAutomatic refactoring completed. Please review the changes.');
  }
}

if (require.main === module) {
  moveToShared();
}

module.exports = { moveToShared };
