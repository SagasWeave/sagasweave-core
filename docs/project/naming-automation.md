# SagasWeave Naming Automation

Dette dokument beskriver hvordan du kan automatisere navngivningskonventioner i SagasWeave projektet ved hjælp af både interne scripts og eksterne CLI-værktøjer.

## 🔧 Interne Scripts

### Tilgængelige npm kommandoer

```bash
# Valider navngivning (eksisterende)
npm run test:naming

# Manuel refaktorering (eksisterende)
npm run refactor:naming <old-file-path> <new-file-name>

# Auto-fix alle navngivningsfejl (NYT)
npm run fix:naming

# Preview hvad der ville blive rettet (NYT)
npm run fix:naming:dry

# Interaktiv fix mode (NYT)
npm run fix:naming:interactive
```

## 📋 NPM Scripts

### Validation & Testing
- `npm run test:naming` - Validér navngivningskonventioner
- `npm run naming:check-all` - Kør alle valideringsværktøjer

### Auto-fixing
- `npm run fix:naming` - Auto-fix navngivningsfejl
- `npm run fix:naming:dry` - Vis foreslåede rettelser uden at anvende
- `npm run fix:naming:interactive` - Interaktiv auto-fix med brugerbekræftelse
- `npm run naming:fix-all` - Kør alle auto-fix værktøjer

### Manual Refactoring
- `npm run refactor:naming` - Omdøb filer og referencer
- `npm run refactor:ast-grep` - Scan med AST-grep
- `npm run refactor:ast-grep:fix` - Auto-fix med AST-grep
- `npm run refactor:jscodeshift` - Kør JSCodeshift transformationer
- `npm run refactor:comby` - Kør Comby transformationer (kræver Comby installation)

### Linting & Formatting
- `npm run lint:biome` - Lint med Biome
- `npm run lint:biome:fix` - Auto-fix linting fejl med Biome
- `npm run format:biome` - Formatér kode med Biome

### Auto-Fix Workflow

1. **Scan for fejl**: `npm run fix:naming:dry`
2. **Ret automatisk**: `npm run fix:naming`
3. **Valider resultatet**: `npm run test:naming`

## Installation & Setup

### Internal Dependencies
All required tools are now included as devDependencies in package.json:

```bash
npm install
```

This will install:
- `@biomejs/biome` - Fast linter and formatter
- `@ast-grep/cli` - AST-based search and replace
- `jscodeshift` - JavaScript/TypeScript codemod runner

### External CLI Tools (Optional)

#### Comby (for advanced pattern matching)
```bash
# macOS
brew install comby

# Linux
wget https://github.com/comby-tools/comby/releases/download/1.8.1/comby-1.8.1-x86_64-linux.tar.gz
tar -xzf comby-1.8.1-x86_64-linux.tar.gz
sudo mv comby /usr/local/bin/
```

### Configuration Files
The following configuration files have been created:
- `.ast-grep.yml` - AST-grep rules for naming conventions
- `.comby.toml` - Comby patterns for transformations
- `biome.json` - Biome linter and formatter configuration
- `codemods/sw-naming-transform.js` - JSCodeshift transformation

## 🚀 Eksterne CLI-Værktøjer

### 1. Comby - Strukturel søg/erstat

**Eksempel - Ret prefiks fejl:**
```bash
# Ret forkerte præfikser i hele kodebasen
comby 'oldPrefix_:[name]' 'sw_shared_util_:[name]' -extension ts,tsx -directory src

# Ret import statements
comby 'import { :[name] } from ":[path]/oldName"' 'import { :[name] } from ":[path]/sw-shared-util-newName"' -extension ts,tsx
```

### 2. ast-grep - AST-baseret refaktorering

**Installation:**
```bash
# macOS
brew install ast-grep

# Eller via npm
npm install -g @ast-grep/cli
```

**Konfiguration - `.ast-grep.yml`:**
```yaml
rules:
  - id: fix-component-naming
    message: Component should follow SwMFeUi naming convention
    language: tsx
    rule:
      pattern: |
        const $NAME = () => {
          $$$
        }
    fix: |
      const SwMFeUi$NAME = () => {
        $$$
      }
    constraints:
      NAME:
        not:
          regex: '^SwMFeUi'

  - id: fix-hook-naming
    message: Hook should follow swMFeHook naming convention
    language: ts
    rule:
      pattern: |
        const $NAME = () => {
          $$$
        }
    fix: |
      const swMFeHook$NAME = () => {
        $$$
      }
    constraints:
      NAME:
        regex: '^use[A-Z]'
        not:
          regex: '^swMFeHook'
```

**Brug:**
```bash
# Scan for problemer
ast-grep scan

# Auto-fix
ast-grep scan --fix
```

### 3. jscodeshift - Facebook's codemod toolkit

**Installation:**
```bash
npm install -g jscodeshift
```

**Eksempel transform - `transforms/fix-naming.js`:**
```javascript
const { namingBook } = require('../docs/project/sw-naming-book.json');

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Fix variable declarations
  root.find(j.VariableDeclarator)
    .filter(path => {
      const name = path.value.id.name;
      return name && !name.startsWith('sw');
    })
    .forEach(path => {
      const oldName = path.value.id.name;
      const newName = `swSharedUtil${oldName.charAt(0).toUpperCase() + oldName.slice(1)}`;
      
      // Rename all references
      root.find(j.Identifier, { name: oldName })
        .replaceWith(j.identifier(newName));
    });

  return root.toSource();
};
```

**Brug:**
```bash
# Kør transform på alle TypeScript filer
jscodeshift -t transforms/fix-naming.js src/**/*.ts --parser=tsx
```

### 4. Biome - Alt-i-én værktøj

**Installation:**
```bash
npm install -D @biomejs/biome
```

**Konfiguration - `biome.json`:**
```json
{
  "$schema": "https://biomejs.dev/schemas/1.4.1/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "style": {
        "useNamingConvention": {
          "level": "error",
          "options": {
            "strictCase": false,
            "conventions": [
              {
                "selector": {
                  "kind": "function"
                },
                "match": "^sw[A-Z][a-zA-Z]*"
              },
              {
                "selector": {
                  "kind": "class"
                },
                "match": "^Sw[A-Z][a-zA-Z]*"
              }
            ]
          }
        }
      }
    }
  },
  "formatter": {
    "enabled": true
  }
}
```

**Brug:**
```bash
# Lint og fix
npx biome check --apply src/

# Format
npx biome format --write src/
```

## 📋 Foreslået Workflow

### Daglig Udvikling
1. **Før commit**: `npm run naming:check-all`
2. **Ved navngivningsfejl**: `npm run fix:naming:interactive`
3. **Formatér kode**: `npm run format:biome`
4. **Valider resultatet**: `npm run naming:check-all`

### Hurtig Auto-fix
1. **Se forslag**: `npm run fix:naming:dry`
2. **Anvend rettelser**: `npm run naming:fix-all`
3. **Verificer**: `npm run naming:check-all`

### Avancerede Checks
```bash
# 1. Valider navngivning
npm run test:naming

# 2. Auto-fix simple fejl
npm run fix:naming

# 3. Kør Biome for avancerede checks
npx biome check --apply src/
```

### Store refaktoreringer
```bash
# 1. Preview ændringer
npm run fix:naming:dry

# 2. Kør strukturelle ændringer med Comby
comby 'oldPattern' 'newPattern' -extension ts,tsx -directory src

# 3. Kør AST-baserede fixes
ast-grep scan --fix

# 4. Kør jscodeshift for komplekse transforms
jscodeshift -t transforms/fix-naming.js src/**/*.ts

# 5. Final cleanup med Biome
npx biome check --apply src/

# 6. Valider resultatet
npm run test:naming
```

### CI/CD Integration

**GitHub Actions - `.github/workflows/naming.yml`:**
```yaml
name: Naming Convention Check

on: [push, pull_request]

jobs:
  naming:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check naming conventions
        run: npm run test:naming
      
      - name: Install Biome
        run: npm install -D @biomejs/biome
      
      - name: Run Biome checks
        run: npx biome check src/
```

## 🎯 Værktøjsvalg Guide

| Brug for... | Anbefalet værktøj | Kommando |
|-------------|-------------------|----------|
| Hurtig tekstuel søg/erstat | **Comby** | `comby 'pattern' 'replacement' -extension ts,tsx` |
| Præcise JS/TS identifier changes | **ast-grep** | `ast-grep scan --fix` |
| Komplekse migrations | **jscodeshift** | `jscodeshift -t transform.js src/` |
| Alt-i-én løsning | **Biome** | `npx biome check --apply src/` |
| Simple auto-fixes | **Interne scripts** | `npm run fix:naming` |

## 🔄 Integration med naming-book.json

Alle værktøjer kan konfigureres til at læse fra `sw-naming-book.json`:

1. **Interne scripts**: Læser direkte fra JSON-filen
2. **Comby**: Generer patterns fra JSON-regler
3. **ast-grep**: Konverter JSON-regler til YAML-konfiguration
4. **jscodeshift**: Import naming-book i transforms
5. **Biome**: Konverter til Biome's naming convention format

## 📚 Eksempler

### Ret en specifik fil
```bash
# Manuel refaktorering
npm run refactor:naming src/utils/helper.ts sw-shared-util-helper.ts

# Med Comby
comby 'helper' 'sw-shared-util-helper' -extension ts -in-place src/utils/helper.ts
```

### Ret alle komponenter
```bash
# Med ast-grep
ast-grep --pattern 'const $NAME = () => { $$$ }' --rewrite 'const SwMFeUi$NAME = () => { $$$ }' src/components/

# Med jscodeshift
jscodeshift -t transforms/fix-components.js src/components/
```

### Batch omdøbning af filer
```bash
# Med renamer CLI
npm install -g renamer
renamer --find '/^(?!sw-)(.+)\.ts$/' --replace 'sw-shared-util-$1.ts' src/utils/*.ts
```

Dette setup giver dig både hurtige auto-fixes til daglig brug og kraftfulde værktøjer til store refaktoreringer, alt sammen baseret på din `sw-naming-book.json` konfiguration.