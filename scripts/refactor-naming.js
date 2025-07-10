const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Load naming book for validation
const namingBookPath = path.join(__dirname, '..', 'docs', 'project', 'sw-naming-book.json');
const namingBook = JSON.parse(fs.readFileSync(namingBookPath, 'utf8'));

class SwRefactorTool {
  constructor() {
    this.namingBook = namingBook;
    this.dryRun = false;
    this.verbose = false;
  }

  // Main refactor function - can handle both files and identifiers
  async refactor(oldName, newName, options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;

    console.log(`🔄 Starting refactor: ${oldName} → ${newName}`);

    if (this.dryRun) {
      console.log('📋 DRY RUN MODE - No changes will be made');
    }

    // Determine if this is a file rename or identifier rename
    if (oldName.includes('.') || oldName.includes('/')) {
      await this.refactorFile(oldName, newName);
    } else {
      await this.refactorIdentifier(oldName, newName);
    }
  }

  // Simple search and replace across all project files
  async searchAndReplace(searchText, replaceText, options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;

    console.log(`🔍 Search and replace: "${searchText}" → "${replaceText}"`);

    if (this.dryRun) {
      console.log('📋 DRY RUN MODE - No changes will be made');
    }

    const filesToSearch = this.getAllProjectFiles();
    let totalReplacements = 0;
    let filesModified = 0;

    for (const file of filesToSearch) {
      const replacements = await this.replaceInFile(file, searchText, replaceText);
      if (replacements > 0) {
        totalReplacements += replacements;
        filesModified++;
      }
    }

    console.log(`\n✅ Search and replace completed!`);
    console.log(`📊 Files modified: ${filesModified}`);
    console.log(`📊 Total replacements: ${totalReplacements}`);

    return { filesModified, totalReplacements };
  }

  // Replace text in a single file
  async replaceInFile(filePath, searchText, replaceText) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const newContent = content.replace(regex, replaceText);
      
      const matches = (content.match(regex) || []).length;
      
      if (matches > 0) {
        console.log(`📝 ${filePath}: ${matches} replacement(s)`);
        
        if (!this.dryRun) {
          fs.writeFileSync(filePath, newContent, 'utf8');
        }
      }
      
      return matches;
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️  Could not process ${filePath}: ${error.message}`);
      }
      return 0;
    }
  }

  // Refactor file names and update all references
  async refactorFile(oldFilePath, newFileName) {
    const oldFileName = path.basename(oldFilePath);
    const newFilePath = path.join(path.dirname(oldFilePath), newFileName);

    // Validate new filename against naming conventions
    if (!this.validateFileName(newFileName)) {
      console.error(`❌ New filename '${newFileName}' doesn't follow naming conventions`);
      return false;
    }

    console.log(`📁 Renaming file: ${oldFilePath} → ${newFilePath}`);

    if (!this.dryRun) {
      try {
        fs.renameSync(oldFilePath, newFilePath);
        console.log('✅ File renamed successfully');
      } catch (error) {
        console.error(`❌ Error renaming file: ${error.message}`);
        return false;
      }
    }

    // Update all import/require references to this file
    await this.updateFileReferences(oldFileName, newFileName);

    return true;
  }

  // Refactor identifiers (variables, functions, classes) across codebase
  async refactorIdentifier(oldName, newName) {
    console.log(`🔤 Refactoring identifier: ${oldName} → ${newName}`);

    // Validate new identifier against naming conventions
    if (!this.validateIdentifier(newName)) {
      console.error(`❌ New identifier '${newName}' doesn't follow naming conventions`);
      return false;
    }

    // Find all occurrences of the identifier
    const occurrences = await this.findIdentifierOccurrences(oldName);

    if (occurrences.length === 0) {
      console.log(`ℹ️  No occurrences of '${oldName}' found`);
      return true;
    }

    console.log(`📍 Found ${occurrences.length} occurrences`);

    // Update each occurrence
    for (const occurrence of occurrences) {
      await this.updateIdentifierInFile(occurrence.file, oldName, newName);
    }

    return true;
  }

  // Find all references to a file in import/require statements
  async updateFileReferences(oldFileName, newFileName) {
    const searchPatterns = [
      `import.*from.*['"].*${oldFileName.replace('.ts', '').replace('.tsx', '')}['"]`,
      `require\(['"].*${oldFileName.replace('.ts', '').replace('.tsx', '')}['"]\)`,
      `import.*['"].*${oldFileName}['"]`,
      `require\(['"].*${oldFileName}['"]\)`,
    ];

    const _projectRoot = path.join(__dirname, '..');
    const filesToSearch = this.getProjectFiles();

    for (const pattern of searchPatterns) {
      for (const file of filesToSearch) {
        await this.searchAndReplaceInFile(file, pattern, oldFileName, newFileName);
      }
    }
  }

  // Find all occurrences of an identifier
  async findIdentifierOccurrences(identifier) {
    const occurrences = [];
    const filesToSearch = this.getProjectFiles();

    // Pattern to match identifier as whole word (not part of another word)
    const pattern = `\\b${identifier}\\b`;

    for (const file of filesToSearch) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const regex = new RegExp(pattern, 'g');
        let match;

        while ((match = regex.exec(content)) !== null) {
          const lines = content.substring(0, match.index).split('\n');
          occurrences.push({
            file,
            line: lines.length,
            column: lines[lines.length - 1].length + 1,
            match: match[0],
          });
        }
      } catch (error) {
        if (this.verbose) {
          console.warn(`⚠️  Could not read file ${file}: ${error.message}`);
        }
      }
    }

    return occurrences;
  }

  // Update identifier in a specific file
  async updateIdentifierInFile(filePath, oldName, newName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const regex = new RegExp(`\\b${oldName}\\b`, 'g');
      const newContent = content.replace(regex, newName);

      if (content !== newContent) {
        console.log(`📝 Updating ${filePath}`);

        if (!this.dryRun) {
          fs.writeFileSync(filePath, newContent, 'utf8');
        }
      }
    } catch (error) {
      console.error(`❌ Error updating ${filePath}: ${error.message}`);
    }
  }

  // Search and replace in file with pattern
  async searchAndReplaceInFile(filePath, pattern, oldName, newName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const regex = new RegExp(pattern, 'g');

      if (regex.test(content)) {
        const newContent = content.replace(
          new RegExp(oldName.replace('.ts', '').replace('.tsx', ''), 'g'),
          newName.replace('.ts', '').replace('.tsx', '')
        );

        if (content !== newContent) {
          console.log(`📝 Updating import references in ${filePath}`);

          if (!this.dryRun) {
            fs.writeFileSync(filePath, newContent, 'utf8');
          }
        }
      }
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️  Could not process ${filePath}: ${error.message}`);
      }
    }
  }

  // Get all project files to search (code files only)
  getProjectFiles() {
    const projectRoot = path.join(__dirname, '..');
    const files = [];

    const searchDirs = [path.join(projectRoot, 'apps'), path.join(projectRoot, 'packages')];

    const traverseDir = (dir) => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry)) {
            traverseDir(fullPath);
          }
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
          files.push(fullPath);
        }
      }
    };

    searchDirs.forEach(traverseDir);
    return files;
  }

  // Get all project files including docs, configs, etc.
  getAllProjectFiles() {
    const projectRoot = path.join(__dirname, '..');
    const files = [];

    const searchDirs = [
      path.join(projectRoot, 'apps'),
      path.join(projectRoot, 'packages'),
      path.join(projectRoot, 'docs'),
      path.join(projectRoot, 'scripts')
    ];

    const traverseDir = (dir) => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', '.vscode', '.idea', 'coverage'].includes(entry)) {
            traverseDir(fullPath);
          }
        } else {
          // Include text files but exclude binary and log files
          const textExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.yml', '.yaml', '.toml'];
          const excludeExtensions = ['.log', '.pid', '.map', '.lock'];
          
          const hasTextExtension = textExtensions.some(ext => entry.endsWith(ext));
          const hasExcludeExtension = excludeExtensions.some(ext => entry.endsWith(ext));
          
          if (hasTextExtension && !hasExcludeExtension) {
            files.push(fullPath);
          }
        }
      }
    };

    searchDirs.forEach(traverseDir);
    
    // Also include root level config files
    const rootFiles = ['package.json', 'tsconfig.base.json', 'biome.json', '.gitignore'];
    rootFiles.forEach(file => {
      const fullPath = path.join(projectRoot, file);
      if (fs.existsSync(fullPath)) {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  // Validate filename against naming conventions
  validateFileName(fileName) {
    const { scopes, functionalities, rules } = this.namingBook;

    const scopeKeysKebab = Object.keys(scopes)
      .map((s) => s.replace(/_/g, '-'))
      .join('|');
    const functionalityKeysKebab = Object.keys(functionalities)
      .map((f) => f.replace(/_/g, '-'))
      .join('|');

    const filePatternString = rules.files.pattern
      .replace('(${scopes})', `(${scopeKeysKebab})`)
      .replace('(${functionalities})', `(${functionalityKeysKebab})`);

    const fileNameRegex = new RegExp(filePatternString);
    return fileNameRegex.test(fileName);
  }

  // Validate identifier against naming conventions
  validateIdentifier(identifier) {
    const { scopes, functionalities, rules } = this.namingBook;

    // Build regex patterns for different identifier types
    const buildPattern = (rule) => {
      const transformedScopes = Object.keys(scopes)
        .map((s) =>
          s
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join('')
        )
        .join('|');
      const transformedFunctionalities = Object.keys(functionalities)
        .map((f) =>
          f
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join('')
        )
        .join('|');

      return rule.pattern
        .replace('<Scope>', `(${transformedScopes})`)
        .replace('<Functionality>', `(${transformedFunctionalities})`)
        .replace('<Name>', '[A-Z][a-zA-Z0-9]*');
    };

    // Check against all identifier patterns
    const patterns = [
      buildPattern(rules.variables),
      buildPattern(rules.functions),
      buildPattern(rules.classes),
      buildPattern(rules.react_components),
    ];

    return patterns.some((pattern) => new RegExp(`^${pattern}$`).test(identifier));
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
🔧 SagasWeave Refactor Tool

Usage:
  node refactor-naming.js <old-name> <new-name> [options]
  node refactor-naming.js --search <search-text> --replace <replace-text> [options]

Options:
  --dry-run    Show what would be changed without making changes
  --verbose    Show detailed output
  --search     Search text for simple text replacement
  --replace    Replace text for simple text replacement

Examples:
  # Rename a file
  node refactor-naming.js "src/old-file.ts" "sw-m-fe-ui-new-file.ts"
  
  # Rename an identifier
  node refactor-naming.js "oldFunctionName" "swFeApiNewFunction"
  
  # Simple search and replace
  node refactor-naming.js --search "scripts/mcp-services/mcp-npm" --replace "scripts/mcp-services/mcp-npm"
  
  # Dry run to see what would change
  node refactor-naming.js "oldName" "newName" --dry-run
`);
    process.exit(1);
  }

  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  };

  const refactor = new SwRefactorTool();

  // Check if this is a search and replace operation
  const searchIndex = args.indexOf('--search');
  const replaceIndex = args.indexOf('--replace');

  if (searchIndex !== -1 && replaceIndex !== -1) {
    const searchText = args[searchIndex + 1];
    const replaceText = args[replaceIndex + 1];

    if (!searchText || !replaceText) {
      console.error('❌ Both --search and --replace values are required');
      process.exit(1);
    }

    refactor
      .searchAndReplace(searchText, replaceText, options)
      .then((result) => {
        console.log('\n✅ Search and replace completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error(`\n💥 Unexpected error: ${error.message}`);
        process.exit(1);
      });
  } else {
    // Traditional refactoring
    const [oldName, newName] = args;
    refactor
      .refactor(oldName, newName, options)
      .then((success) => {
        if (success) {
          console.log('\n✅ Refactoring completed successfully!');
          process.exit(0);
        } else {
          console.log('\n❌ Refactoring failed!');
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error(`\n💥 Unexpected error: ${error.message}`);
        process.exit(1);
      });
  }
}

module.exports = SwRefactorTool;
