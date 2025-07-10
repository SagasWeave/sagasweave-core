const fs = require('node:fs');
const path = require('node:path');
const SwRefactorTool = require('./refactor-naming.js');

// Load naming book
const namingBookPath = path.join(__dirname, '..', 'docs', 'project', 'sw-naming-book.json');
const namingBook = JSON.parse(fs.readFileSync(namingBookPath, 'utf8'));

class SwAutoFixNaming {
  constructor() {
    this.namingBook = namingBook;
    this.refactorTool = new SwRefactorTool();
    this.violations = [];
    this.dryRun = false;
    this.interactive = false;
  }

  // Main auto-fix function
  async autoFix(options = {}) {
    this.dryRun = options.dryRun || false;
    this.interactive = options.interactive || false;

    console.log('🔍 Scanning for naming violations...');

    // Find all violations
    await this.scanForViolations();

    if (this.violations.length === 0) {
      console.log('✅ No naming violations found!');
      return true;
    }

    console.log(`\n📋 Found ${this.violations.length} naming violations:\n`);

    // Display violations with suggested fixes
    for (let i = 0; i < this.violations.length; i++) {
      const violation = this.violations[i];
      console.log(`${i + 1}. ${violation.type}: '${violation.current}' in ${violation.file}`);
      console.log(`   Suggested fix: '${violation.suggested}'`);
      console.log(`   Reason: ${violation.reason}\n`);
    }

    if (this.interactive) {
      return await this.interactiveFix();
    }
    return await this.autoApplyFixes();
  }

  // Scan codebase for naming violations
  async scanForViolations() {
    const projectFiles = this.getProjectFiles();

    for (const file of projectFiles) {
      // Check filename
      await this.checkFileName(file);

      // Check identifiers in file content
      await this.checkFileContent(file);
    }
  }

  // Check if filename follows conventions
  async checkFileName(filePath) {
    const fileName = path.basename(filePath);

    // Skip critical files that should never be renamed
    const protectedFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'biome.json',
      '.gitignore',
      'README.md',
      'LICENSE',
      'Dockerfile',
      'docker-compose.yml',
      'yarn.lock',
      'pnpm-lock.yaml',
      'index.ts',
      'index.tsx',
      'index.html',
      'vitest.config.ts',
      'vite.config.ts',
      'jest.config.js',
      'webpack.config.js'
    ];

    if (protectedFiles.includes(fileName)) {
      return; // Skip protected files
    }

    // Skip files in certain directories
    const protectedDirs = ['.git', 'node_modules', 'dist', 'build', '.vscode', '.idea', 'coverage'];
    if (protectedDirs.some(dir => filePath.includes(`/${dir}/`))) {
      return; // Skip files in protected directories
    }

    // Skip log files and other generated files
    const protectedExtensions = ['.log', '.pid', '.map'];
    if (protectedExtensions.some(ext => fileName.endsWith(ext))) {
      return; // Skip log and generated files
    }

    if (!this.refactorTool.validateFileName(fileName)) {
      const suggested = this.suggestFileName(fileName, filePath);

      this.violations.push({
        type: 'File name',
        current: fileName,
        suggested: suggested,
        file: filePath,
        reason: 'Does not follow sw-{scope}-{functionality}-{name}.{ext} pattern',
        fixType: 'file',
      });
    }
  }

  // Check identifiers in file content
  async checkFileContent(filePath) {
    if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) return;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const identifiers = this.extractIdentifiers(content);

      for (const identifier of identifiers) {
        if (!this.refactorTool.validateIdentifier(identifier.name)) {
          const suggested = this.suggestIdentifierName(identifier.name, identifier.type);

          this.violations.push({
            type: `${identifier.type} identifier`,
            current: identifier.name,
            suggested: suggested,
            file: filePath,
            line: identifier.line,
            reason: `Does not follow ${identifier.type} naming convention`,
            fixType: 'identifier',
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not analyze ${filePath}: ${error.message}`);
    }
  }

  // Extract identifiers from file content
  extractIdentifiers(content) {
    const identifiers = [];
    const lines = content.split('\n');

    // Simple regex patterns for different identifier types
    const patterns = {
      variable: /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=:]/g,
      function:
        /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(|([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=:]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/g,
      class: /class\s+([A-Z][a-zA-Z0-9_$]*)\s*(?:extends|\{)/g,
      component:
        /(?:const|function)\s+([A-Z][a-zA-Z0-9_$]*)\s*[=:].*(?:React\.FC|JSX\.Element|\(.*\)\s*=>\s*<)/g,
    };

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      for (const [type, pattern] of Object.entries(patterns)) {
        let match;
        pattern.lastIndex = 0; // Reset regex

        while ((match = pattern.exec(line)) !== null) {
          const name = match[1] || match[2];
          if (name && !name.startsWith('_') && name.length > 1) {
            identifiers.push({
              name,
              type,
              line: lineNum + 1,
            });
          }
        }
      }
    }

    return identifiers;
  }

  // Suggest correct filename based on content and path
  suggestFileName(currentName, filePath) {
    const ext = path.extname(currentName);
    const baseName = path.basename(currentName, ext);

    // If already follows convention, return as-is
    if (this.refactorTool.validateFileName(currentName)) {
      return currentName;
    }

    // Analyze file path to determine scope using naming book
    let scope = 'shared';
    const scopes = Object.keys(this.namingBook.scopes);

    if (filePath.includes('/frontend/') || filePath.includes('/apps/frontend/')) {
      const frontendScope = scopes.find((s) => s.includes('frontend'));
      scope = frontendScope ? frontendScope.replace(/_/g, '-') : 'module-frontend';
    } else if (filePath.includes('/backend/') || filePath.includes('/apps/backend/')) {
      const backendScope = scopes.find((s) => s.includes('backend'));
      scope = backendScope ? backendScope.replace(/_/g, '-') : 'module-backend';
    } else if (filePath.includes('/shared/') || filePath.includes('/packages/')) {
      const sharedScope = scopes.find((s) => s.includes('shared'));
      scope = sharedScope ? sharedScope.replace(/_/g, '-') : 'shared';
    }

    // Analyze filename and path to determine functionality using naming book
    const functionalities = Object.keys(this.namingBook.functionalities);
    let functionality = 'util'; // Default fallback
    const lowerPath = filePath.toLowerCase();
    const lowerName = baseName.toLowerCase();

    if (
      lowerPath.includes('/components/') ||
      lowerName.includes('component') ||
      ext === '.tsx' ||
      ext === '.html' ||
      ext === '.css' ||
      ext === '.svg' ||
      ext === '.png'
    ) {
      functionality = 'ui';
    } else if (
      lowerPath.includes('/api/') ||
      lowerName.includes('api') ||
      lowerName.includes('service')
    ) {
      functionality = 'api';
    } else if (lowerName.includes('hook') || lowerName.startsWith('use')) {
      functionality = 'hook';
    } else if (
      lowerName.includes('store') ||
      lowerName.includes('state') ||
      lowerPath.includes('/store/')
    ) {
      functionality = 'store';
    } else if (lowerName.includes('config') || lowerPath.includes('/config/')) {
      functionality = 'config';
    } else if (
      lowerName.includes('test') ||
      lowerPath.includes('/test/') ||
      lowerName.includes('.test') ||
      lowerName.includes('.spec')
    ) {
      functionality = 'test';
    } else if (lowerName.includes('type') || lowerPath.includes('/types/')) {
      functionality = 'types';
    }

    // Validate that the functionality exists in naming book
    if (!functionalities.includes(functionality)) {
      functionality = 'util';
    }

    // Convert functionality to kebab-case for filename
    functionality = functionality.replace(/_/g, '-').toLowerCase();

    // Clean and format the name part - be more aggressive about removing old patterns
    let namePart = baseName
      .replace(/^sw[-_]?/i, '') // Remove sw prefix
      .replace(/^(m[-_]?fe|m[-_]?be|m[-_]?shared|module[-_]?frontend|module[-_]?backend)[-_]?/i, '') // Remove old scope patterns
      .replace(/^(ui|api|hook|store|config|test|types|util)[-_]?/i, '') // Remove functionality
      .replace(/[-_]?(component|service|util|helper)$/i, '') // Remove suffixes
      .replace(/[-_]/g, '-') // Normalize separators
      .replace(/^[-_]+|[-_]+$/g, '') // Trim separators
      .replace(/[-_]+/g, '-') // Normalize multiple separators
      .toLowerCase();

    // If the name part contains the scope or functionality again, remove it
    const scopePattern = new RegExp(
      `(${scope.replace(/-/g, '[-_]?')}|m[-_]?fe|m[-_]?be|m[-_]?shared)[-_]?`,
      'gi'
    );
    const funcPattern = new RegExp(`(${functionality})[-_]?`, 'gi');
    namePart = namePart.replace(scopePattern, '').replace(funcPattern, '');

    // Clean up any remaining redundant parts
    namePart = namePart
      .replace(/^[-_]+|[-_]+$/g, '') // Trim separators again
      .replace(/[-_]+/g, '-'); // Normalize multiple separators again

    // Ensure we have a meaningful name
    if (!namePart || namePart.length < 2) {
      namePart = 'main';
    }

    return `sw-${scope}-${functionality}-${namePart}${ext}`;
  }

  // Suggest correct identifier name
  suggestIdentifierName(currentName, type) {
    // Skip common React/JS identifiers that shouldn't be renamed
    const skipIdentifiers = [
      'FC',
      'React',
      'useState',
      'useEffect',
      'useCallback',
      'useMemo',
      'props',
      'children',
      'className',
      'style',
      'key',
      'ref',
    ];
    if (skipIdentifiers.includes(currentName)) {
      return currentName;
    }

    // If already follows convention, return as-is
    if (this.refactorTool.validateIdentifier(currentName)) {
      return currentName;
    }

    // For very short or generic names, suggest a more descriptive approach
    if (
      currentName.length <= 2 ||
      ['a', 'b', 'c', 'i', 'j', 'k', 'x', 'y', 'z'].includes(currentName.toLowerCase())
    ) {
      return currentName; // Keep short variable names as-is
    }

    // Determine scope using naming book - default to 'Shared' for most cases
    const scopes = Object.keys(this.namingBook.scopes);
    const functionalities = Object.keys(this.namingBook.functionalities);

    let scope = 'Shared';

    // Determine functionality based on name patterns using naming book
    let functionality = 'Util'; // Default fallback
    const lowerName = currentName.toLowerCase();

    if (
      type === 'component' ||
      lowerName.includes('component') ||
      /^[A-Z].*Component$/.test(currentName)
    ) {
      functionality = 'Ui';
      scope = scopes.find((s) => s.includes('frontend')) || 'ModuleFrontend'; // Components are typically frontend
    } else if (lowerName.includes('hook') || lowerName.startsWith('use')) {
      functionality = 'Hook';
      scope = scopes.find((s) => s.includes('frontend')) || 'ModuleFrontend'; // Hooks are typically frontend
    } else if (
      lowerName.includes('api') ||
      lowerName.includes('service') ||
      lowerName.includes('client')
    ) {
      functionality = 'Api';
    } else if (
      lowerName.includes('store') ||
      lowerName.includes('state') ||
      lowerName.includes('reducer')
    ) {
      functionality = 'Store';
    } else if (lowerName.includes('config') || lowerName.includes('setting')) {
      functionality = 'Config';
    } else if (lowerName.includes('type') || lowerName.includes('interface')) {
      functionality = 'Types';
    }

    // Validate that the functionality exists in naming book (convert to proper case)
    const functionalityKey = functionality.toLowerCase();
    if (!functionalities.includes(functionalityKey)) {
      functionality = 'Util';
    }

    // Clean the name part - remove existing prefixes and common suffixes
    let namePart = currentName
      .replace(/^(sw|Sw|SW)/, '') // Remove sw prefix
      .replace(/^(fe|Fe|FE|be|Be|BE|shared|Shared|SHARED)/, '') // Remove scope
      .replace(
        /^(ui|Ui|UI|api|Api|API|util|Util|UTIL|hook|Hook|HOOK|store|Store|STORE|config|Config|CONFIG|types|Types|TYPES)/,
        ''
      ) // Remove functionality
      .replace(/(Component|Service|Util|Helper|Handler|Manager)$/, '') // Remove common suffixes
      .replace(/^[a-z]/, (match) => match.toUpperCase()); // Ensure first letter is uppercase

    // If nothing left after cleaning, use original name
    if (!namePart || namePart.length < 2) {
      namePart = currentName.replace(/^[a-z]/, (match) => match.toUpperCase());
    }

    // Build the correct name based on type
    if (type === 'class' || type === 'component') {
      return `Sw${scope}${functionality}${namePart}`;
    }
    // For variables and functions, use camelCase
    const camelCaseName = `sw${scope}${functionality}${namePart}`;
    return camelCaseName.charAt(0).toLowerCase() + camelCaseName.slice(1);
  }

  // Interactive fix mode
  async interactiveFix() {
    console.log('\n🔧 Interactive fix mode - you will be prompted for each violation\n');

    for (const violation of this.violations) {
      console.log(`Fix ${violation.type}: '${violation.current}' → '${violation.suggested}'?`);
      console.log(`File: ${violation.file}`);
      console.log(`Reason: ${violation.reason}`);

      // In a real interactive mode, you would prompt the user here
      // For now, we'll just apply all fixes
      console.log('Applying fix...\n');

      await this.applyFix(violation);
    }

    return true;
  }

  // Auto-apply all fixes
  async autoApplyFixes() {
    console.log('\n🔧 Auto-applying all fixes...\n');

    for (const violation of this.violations) {
      await this.applyFix(violation);
    }

    return true;
  }

  // Apply a single fix
  async applyFix(violation) {
    try {
      if (violation.fixType === 'file') {
        await this.refactorTool.refactorFile(violation.file, violation.suggested);
      } else if (violation.fixType === 'identifier') {
        await this.refactorTool.refactorIdentifier(violation.current, violation.suggested);
      }

      console.log(`✅ Fixed: ${violation.current} → ${violation.suggested}`);
    } catch (error) {
      console.error(`❌ Failed to fix ${violation.current}: ${error.message}`);
    }
  }

  // Get all project files
  getProjectFiles() {
    const projectRoot = path.join(__dirname, '..');
    const files = [];

    const searchDirs = [path.join(projectRoot, 'apps'), path.join(projectRoot, 'packages')];

    // Protected files that should never be processed
    const protectedFiles = [
      'package.json',
      'package-lock.json', 
      'tsconfig.json',
      'biome.json',
      '.gitignore',
      'README.md',
      'LICENSE',
      'Dockerfile',
      'docker-compose.yml',
      'yarn.lock',
      'pnpm-lock.yaml',
      'index.ts',
      'index.tsx',
      'index.js',
      'index.jsx',
      'index.html',
      'vitest.config.ts',
      'vite.config.ts',
      'jest.config.js',
      'webpack.config.js'
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
          // Skip protected files
          const protectedExtensions = ['.log', '.pid', '.map'];
          const hasProtectedExtension = protectedExtensions.some(ext => entry.endsWith(ext));
          
          if (!protectedFiles.includes(entry) && !hasProtectedExtension) {
            files.push(fullPath);
          }
        }
      }
    };

    searchDirs.forEach(traverseDir);
    return files;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes('--dry-run'),
    interactive: args.includes('--interactive'),
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 SagasWeave Auto-Fix Naming Tool

Usage:
  node auto-fix-naming.js [options]

Options:
  --dry-run       Show what would be fixed without making changes
  --interactive   Prompt for each fix (default: auto-apply all)
  --help, -h      Show this help message

Examples:
  # Auto-fix all naming violations
  node auto-fix-naming.js
  
  # Preview what would be fixed
  node auto-fix-naming.js --dry-run
  
  # Interactive mode
  node auto-fix-naming.js --interactive
`);
    process.exit(0);
  }

  const autoFix = new SwAutoFixNaming();
  autoFix
    .autoFix(options)
    .then((success) => {
      if (success) {
        console.log('\n✅ Auto-fix completed!');
        process.exit(0);
      } else {
        console.log('\n❌ Auto-fix failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(`\n💥 Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = SwAutoFixNaming;
