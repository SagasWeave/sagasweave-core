# SagasWeave Naming Tools

Dette projekt bruger automatiserede værktøjer til at håndhæve navngivningskonventioner baseret på `sw-naming-book.json`.

## 🚀 Hurtig Start

### Installation
```bash
npm install
```

### Tjek navngivning
```bash
npm run naming:check-all
```

### Auto-fix navngivningsfejl
```bash
npm run naming:fix-all
```

## 📋 Tilgængelige Kommandoer

### Validation
- `npm run test:naming` - Validér med intern validator
- `npm run lint:biome` - Lint med Biome
- `npm run refactor:ast-grep` - Scan med AST-grep
- `npm run naming:check-all` - Kør alle valideringsværktøjer

### Auto-fixing
- `npm run fix:naming:dry` - Vis forslag uden at anvende
- `npm run fix:naming:interactive` - Interaktiv auto-fix
- `npm run lint:biome:fix` - Auto-fix med Biome
- `npm run refactor:ast-grep:fix` - Auto-fix med AST-grep
- `npm run naming:fix-all` - Kør alle auto-fix værktøjer

### Formatering
- `npm run format:biome` - Formatér kode med Biome

### Avancerede Transformationer
- `npm run refactor:jscodeshift` - Kør JSCodeshift codemods
- `npm run refactor:comby` - Kør Comby transformationer (kræver installation)
- `npm run refactor:naming` - Manuel fil-omdøbning

## 🔧 Konfigurationsfiler

- **`sw-naming-book.json`** - Hovedkonfiguration for navngivningsregler
- **`biome.json`** - Biome linter og formatter konfiguration
- **`.ast-grep.yml`** - AST-grep regler for navngivningskonventioner
- **`.comby.toml`** - Comby mønstre for transformationer
- **`codemods/sw-naming-transform.js`** - JSCodeshift transformation

## 🔄 Anbefalede Workflows

### Før Commit
```bash
npm run naming:check-all
```

### Fix Navngivningsfejl
```bash
# Se hvad der skal rettes
npm run fix:naming:dry

# Anvend rettelser automatisk
npm run naming:fix-all

# Verificer resultatet
npm run naming:check-all
```

### Stor Refaktorering
```bash
# 1. Kør avancerede transformationer
npm run refactor:jscodeshift

# 2. Auto-fix resterende problemer
npm run naming:fix-all

# 3. Formatér kode
npm run format:biome

# 4. Verificer alt er korrekt
npm run naming:check-all
```

## 📖 Navngivningskonventioner

Se `sw-naming-book.json` for detaljerede regler, men hovedprincipperne er:

### Variabler og Funktioner
```typescript
// ✅ Korrekt
const swSharedUtilFormatDate = (date: Date) => string;
function swMBeApiGetUser(id: string) { ... }

// ❌ Forkert
const formatDate = (date: Date) => string;
function getUser(id: string) { ... }
```

### Klasser og Interfaces
```typescript
// ✅ Korrekt
class SwSharedTypesUser { ... }
interface SwMBeApiUserResponse { ... }

// ❌ Forkert
class User { ... }
interface UserResponse { ... }
```

### React Komponenter
```typescript
// ✅ Korrekt
const SwMFeUiButton = () => { ... };
const SwMFeUiUserProfile = ({ user }: Props) => { ... };

// ❌ Forkert
const Button = () => { ... };
const UserProfile = ({ user }: Props) => { ... };
```

### Filnavne
```
✅ Korrekt:
sw-m-fe-ui-button.tsx
sw-shared-types-user.ts
sw-m-be-api-user-service.ts

❌ Forkert:
button.tsx
user.ts
user-service.ts
```

## 🛠️ Fejlfinding

### Biome fejl
Hvis Biome klager over navngivning, kør:
```bash
npm run lint:biome:fix
```

### AST-grep fejl
Hvis AST-grep finder problemer, kør:
```bash
npm run refactor:ast-grep:fix
```

### Komplekse transformationer
For komplekse refaktoreringer, brug JSCodeshift:
```bash
npm run refactor:jscodeshift
```

## 📚 Yderligere Dokumentation

Se `docs/project/naming-automation.md` for detaljeret dokumentation om værktøjerne og deres integration.