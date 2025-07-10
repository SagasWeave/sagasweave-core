const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');
const { execSync } = require('node:child_process');

const namingBookPath = path.join(__dirname, '..', 'docs', 'project', 'sw-naming-book.json');
const namingBook = JSON.parse(fs.readFileSync(namingBookPath, 'utf8'));

const { scopes, functionalities, rules, dependency_rules, exceptions } = namingBook;

// Helper function to check if a file is exempt from naming conventions
function isFileExempt(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  // Debug logging for test files


  // Check exact file names
  if (exceptions?.files?.includes(fileName)) {

    return true;
  }

  // Check patterns
  if (exceptions?.patterns) {
    for (const pattern of exceptions.patterns) {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\./g, '\\.') // Escape dots first
        .replace(/\*\*\//g, '(?:[^/]+/)*') // Replace **/ with zero or more directory levels
        .replace(/\*\*/g, '.*')  // Then replace ** with .*
        .replace(/\*/g, '[^/]*'); // Finally replace * with [^/]*
      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(relativePath) || regex.test(fileName)) {
        return true;
      }
    }
  }

  return false;
}

// Helper to convert snake_case to kebab-case
function toKebabCase(str) {
  return str.replace(/_/g, '-');
}

const scopeKeysKebab = Object.keys(scopes).map(toKebabCase).join('|');
const functionalityKeysKebab = Object.keys(functionalities).map(toKebabCase).join('|');

// Regex for filenames
const filePatternString = rules.files.pattern
  .replace('(${scopes})', `(${scopeKeysKebab})`)
  .replace('(${functionalities})', `(${functionalityKeysKebab})`);
const fileNameRegex = new RegExp(filePatternString);

// Regex for identifiers (variables, functions, classes)
// Helper to convert snake_case to PascalCase
function toPascalCase(str) {
  return str
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const buildIdentifierRegex = (rule) => {
  const transformedScopes = Object.keys(scopes)
    .map((s) => toPascalCase(s))
    .join('|');
  const transformedFunctionalities = Object.keys(functionalities)
    .map((f) => toPascalCase(f))
    .join('|');

  const pattern = rule.pattern
    .replace('<Scope>', `(${transformedScopes})`)
    .replace('<Functionality>', `(${transformedFunctionalities})`)
    .replace('<Name>', '[A-Z][a-zA-Z0-9]*');
  return new RegExp(`^${pattern}$`);
};

const variableRegex = buildIdentifierRegex(rules.variables);
const functionRegex = buildIdentifierRegex(rules.functions);
const classRegex = buildIdentifierRegex(rules.classes);
const reactComponentRegex = buildIdentifierRegex(rules.react_components);

let hasError = false;
const dependencyGraph = {};
const crossModuleUsage = {};
const functionDefinitions = {}; // Track where functions are defined
const duplicateFunctionalities = {}; // Track duplicate functionalities
const _crossModuleDependencies = {}; // Track cross-module dependencies

function validateNode(node, sourceFile) {
  const currentModule = getModuleFromPath(sourceFile.fileName);

  if (ts.isVariableDeclaration(node) && node.name.text) {
    if (!variableRegex.test(node.name.text)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      console.error(
        `Naming violation (variable): '${node.name.text}' in ${sourceFile.fileName} at line ${line + 1}`
      );
      hasError = true;
    }
    // Track function definitions for duplicate detection
    trackFunctionDefinition(node.name.text, sourceFile.fileName, currentModule);
  } else if (ts.isFunctionDeclaration(node) && node.name) {
    if (!functionRegex.test(node.name.text)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      console.error(
        `Naming violation (function): '${node.name.text}' in ${sourceFile.fileName} at line ${line + 1}`
      );
      hasError = true;
    }
    // Track function definitions for duplicate detection
    trackFunctionDefinition(node.name.text, sourceFile.fileName, currentModule);
  } else if (ts.isClassDeclaration(node) && node.name) {
    const isReactComponent = sourceFile.fileName.endsWith('.tsx');
    const regex = isReactComponent ? reactComponentRegex : classRegex;
    if (!regex.test(node.name.text)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      console.error(
        `Naming violation (${isReactComponent ? 'React component' : 'class'}): '${node.name.text}' in ${sourceFile.fileName} at line ${line + 1}`
      );
      hasError = true;
    }
    // Track class definitions for duplicate detection
    trackFunctionDefinition(node.name.text, sourceFile.fileName, currentModule);
  }

  ts.forEachChild(node, (child) => validateNode(child, sourceFile));
}

function trackFunctionDefinition(name, filePath, module) {
  // Extract functionality type from the naming convention
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

function validateFileContent(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return; // Only parse TS/TSX files
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
  buildDependencyGraph(sourceFile, filePath);
  validateNode(sourceFile, sourceFile);
}

function buildDependencyGraph(sourceFile, filePath) {
  const currentModule = getModuleFromPath(filePath);
  if (!currentModule) return;

  if (!dependencyGraph[currentModule]) {
    dependencyGraph[currentModule] = new Set();
  }

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const importPath = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
      const resolvedPath = path.resolve(path.dirname(filePath), importPath);
      const importedModule = getModuleFromPath(resolvedPath);

      if (importedModule && importedModule !== currentModule) {
        dependencyGraph[currentModule].add(importedModule);

        // Track specific cross-module function/variable usage
        if (node.importClause?.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            node.importClause.namedBindings.elements.forEach((element) => {
              const importName = element.name.text;
              if (!crossModuleUsage[importName]) {
                crossModuleUsage[importName] = new Set();
              }
              crossModuleUsage[importName].add(currentModule);
            });
          }
        }
      }
    }
  });
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
      // Skip exempt files
      if (!isFileExempt(fullPath)) {
        // Validate filename
        const fileName = path.basename(fullPath);
        if (!fileNameRegex.test(fileName)) {
          console.error(`Naming convention violation in file: ${fullPath}`);
          hasError = true;
        }
        // Validate content
        validateFileContent(fullPath);
      }
    }
  }
}

const directoriesToScan = [
  path.join(__dirname, '..', 'apps'),
  path.join(__dirname, '..', 'packages'),
];

function analyzeDependencies() {
  console.log('\nAnalyzing module dependencies...');

  // Check for cross-module usage
  for (const importName in crossModuleUsage) {
    const modules = crossModuleUsage[importName];
    if (modules.size > 1) {
      console.warn(
        `Warning: '${importName}' is used in multiple modules (${[...modules].join(', ')}). Consider moving it to a shared package.`
      );
      hasError = true;
    }
  }

  // Check for duplicate functionalities across modules
  console.log('\nAnalyzing duplicate functionalities...');
  let foundDuplicates = false;
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
      foundDuplicates = true;
      console.error(
        `\nDependency rule violation: ${functionalityType} functionality found in modules: ${moduleNames.join(', ')}`
      );
      console.error(
        `According to dependency rules, this functionality should be moved to ${dependency_rules.target_directory}`
      );
      console.error('Files involved:');
      definitions.forEach((def) => {
        if (!def.module.includes('shared')) {
          console.error(`  - ${def.name} in ${def.filePath}`);
        }
      });
      hasError = true;
    }
  }

  if (!foundDuplicates) {
    console.log('No duplicate functionalities detected across modules.');
  }
}

console.log('Validating naming conventions for files and identifiers...');
directoriesToScan.forEach((dir) => traverseDir(dir));

analyzeDependencies();

if (hasError) {
  console.error('\nNaming and dependency convention check failed.');
  process.exit(1);
} else {
  console.log('\nAll checked files, identifiers, and dependencies adhere to the conventions.');
  process.exit(0);
}
