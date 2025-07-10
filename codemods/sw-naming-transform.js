/**
 * JSCodeshift transformation for SagasWeave naming conventions
 * Based on sw-naming-book.json
 */

const fs = require('fs');
const path = require('path');

// Load naming book configuration
let namingBook;
try {
  const namingBookPath = path.join(__dirname, '..', 'sw-naming-book.json');
  namingBook = JSON.parse(fs.readFileSync(namingBookPath, 'utf8'));
} catch (error) {
  console.error('Failed to load sw-naming-book.json:', error.message);
  process.exit(1);
}

// Helper functions
function shouldSkipIdentifier(name) {
  const skipPatterns = [
    /^sw[A-Z]/, // Already follows convention
    /^Sw[A-Z]/, // Already follows convention
    /^(React|useState|useEffect|useCallback|useMemo|useRef|useContext|FC|Component)$/, // React built-ins
    /^(console|window|document|process|require|module|exports|__dirname|__filename)$/, // Global objects
    /^[A-Z_]+$/, // Constants
    /^_/, // Private identifiers
  ];
  
  return skipPatterns.some(pattern => pattern.test(name));
}

function generateScopedName(originalName, scope = 'Shared', functionality = 'Util') {
  if (shouldSkipIdentifier(originalName)) {
    return originalName;
  }
  
  // For classes and React components (PascalCase)
  if (/^[A-Z]/.test(originalName)) {
    return `Sw${scope}${functionality}${originalName}`;
  }
  
  // For variables and functions (camelCase)
  return `sw${scope}${functionality}${originalName.charAt(0).toUpperCase() + originalName.slice(1)}`;
}

function inferScopeFromPath(filePath) {
  if (filePath.includes('/backend/') || filePath.includes('/be/')) return 'MBe';
  if (filePath.includes('/frontend/') || filePath.includes('/fe/')) return 'MFe';
  if (filePath.includes('/shared/')) return 'Shared';
  if (filePath.includes('/utils/')) return 'Shared';
  if (filePath.includes('/types/')) return 'Shared';
  return 'Shared';
}

function inferFunctionalityFromPath(filePath) {
  if (filePath.includes('/api/')) return 'Api';
  if (filePath.includes('/ui/')) return 'Ui';
  if (filePath.includes('/util/')) return 'Util';
  if (filePath.includes('/types/')) return 'Types';
  if (filePath.includes('/config/')) return 'Config';
  if (filePath.includes('/service/')) return 'Service';
  if (filePath.includes('/component/')) return 'Component';
  return 'Util';
}

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  const scope = inferScopeFromPath(fileInfo.path);
  const functionality = inferFunctionalityFromPath(fileInfo.path);
  
  let hasChanges = false;

  // Transform variable declarations
  root.find(j.VariableDeclarator)
    .filter(path => {
      const name = path.value.id.name;
      return name && !shouldSkipIdentifier(name);
    })
    .forEach(path => {
      const oldName = path.value.id.name;
      const newName = generateScopedName(oldName, scope, functionality);
      
      if (oldName !== newName) {
        // Rename all references to this variable
        root.find(j.Identifier, { name: oldName })
          .forEach(identifierPath => {
            identifierPath.value.name = newName;
          });
        hasChanges = true;
      }
    });

  // Transform function declarations
  root.find(j.FunctionDeclaration)
    .filter(path => {
      const name = path.value.id?.name;
      return name && !shouldSkipIdentifier(name);
    })
    .forEach(path => {
      const oldName = path.value.id.name;
      const newName = generateScopedName(oldName, scope, functionality);
      
      if (oldName !== newName) {
        // Rename all references to this function
        root.find(j.Identifier, { name: oldName })
          .forEach(identifierPath => {
            identifierPath.value.name = newName;
          });
        hasChanges = true;
      }
    });

  // Transform class declarations
  root.find(j.ClassDeclaration)
    .filter(path => {
      const name = path.value.id?.name;
      return name && !shouldSkipIdentifier(name);
    })
    .forEach(path => {
      const oldName = path.value.id.name;
      const newName = generateScopedName(oldName, scope, functionality);
      
      if (oldName !== newName) {
        // Rename all references to this class
        root.find(j.Identifier, { name: oldName })
          .forEach(identifierPath => {
            identifierPath.value.name = newName;
          });
        hasChanges = true;
      }
    });

  // Transform interface declarations (TypeScript)
  root.find(j.TSInterfaceDeclaration)
    .filter(path => {
      const name = path.value.id?.name;
      return name && !shouldSkipIdentifier(name);
    })
    .forEach(path => {
      const oldName = path.value.id.name;
      const newName = generateScopedName(oldName, scope, 'Types');
      
      if (oldName !== newName) {
        // Rename all references to this interface
        root.find(j.Identifier, { name: oldName })
          .forEach(identifierPath => {
            identifierPath.value.name = newName;
          });
        hasChanges = true;
      }
    });

  // Transform type alias declarations (TypeScript)
  root.find(j.TSTypeAliasDeclaration)
    .filter(path => {
      const name = path.value.id?.name;
      return name && !shouldSkipIdentifier(name);
    })
    .forEach(path => {
      const oldName = path.value.id.name;
      const newName = generateScopedName(oldName, scope, 'Types');
      
      if (oldName !== newName) {
        // Rename all references to this type
        root.find(j.Identifier, { name: oldName })
          .forEach(identifierPath => {
            identifierPath.value.name = newName;
          });
        hasChanges = true;
      }
    });

  // Transform React components (arrow functions assigned to const)
  root.find(j.VariableDeclarator)
    .filter(path => {
      const name = path.value.id?.name;
      const isArrowFunction = j.ArrowFunctionExpression.check(path.value.init);
      const isPascalCase = name && /^[A-Z]/.test(name);
      return name && isArrowFunction && isPascalCase && !shouldSkipIdentifier(name);
    })
    .forEach(path => {
      const oldName = path.value.id.name;
      const newName = generateScopedName(oldName, 'MFe', 'Ui');
      
      if (oldName !== newName) {
        // Rename all references to this component
        root.find(j.Identifier, { name: oldName })
          .forEach(identifierPath => {
            identifierPath.value.name = newName;
          });
        hasChanges = true;
      }
    });

  return hasChanges ? root.toSource({ quote: 'single' }) : null;
};

module.exports.parser = 'tsx';