# Instruktion til Generering af AI-Sprint-Kontrakt (JSON)

**Formål:** At generere en præcis, maskinlæsbar og tvingende **JSON-kontrakt** for et givent sprint. Denne kontrakt er den _eneste_ kilde til sandhed for AI-assistenten under udviklingen.

**Output:** En enkelt JSON-fil ved navn `ai-contract-sprint<X>.json` (f.eks. `ai-contract-sprint3.json`), som **skal** valideres mod den definerede struktur.

---

### Trin 1: Indsamling af grundlæggende information

Brug følgende inputfiler til at indsamle den nødvendige information:

| Fil                                      | Formål                                                                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sprint<X>.md`                           | Indeholder alle opgaver for sprintet – udgør kernen af kontrakten.                                                                                                      |
| `projectstructuredefinition.md`          | Beskriver mappe- og fil­struktur, der **skal** overholdes.                                                                                                              |
| `code-quality-rules.md`                  | Obligatoriske kodestandarder og navngivning.                                                                                                                            |
| `sw-naming-book.json`                    | **OBLIGATORISK:** Definerer specifikke navngivningskonventioner for alle filer, funktioner, klasser og variabler. SKAL følges strengt i alle `restrictiveInstructions`. |
| `naming-automation.md`                   | **OBLIGATORISK:** Definerer automatiserede værktøjer og workflows for navngivning og kodekvalitet.                                                                      |
| `README-naming-tools.md`                 | **OBLIGATORISK:** Beskriver tilgængelige npm scripts og værktøjer til navngivning og test.                                                                              |
| `SagasWeave-Project-Overview.md`         | Giver den overordnede vision og arkitektoniske principper.                                                                                                              |
| `scripts/mcp-services/mcp-npm-test-server/README.md` | **MCP TEST SERVER:** Dokumentation for automatiseret test-server der kan køre alle npm scripts i baggrunden.                                                            |

---

### Trin 2: Udarbejdelse af JSON-kontrakten

Generér JSON-objektet med følgende obligatoriske nøgler og struktur. Se `sprints/2/ai-contract-sprint2.json` som et referenceeksempel.

#### 2.1 Rod-niveau

- `sprintId`: (Number) Sprintets nummer.
- `sprintName`: (String) Beskrivende navn for sprintet.
- `status`: (String) Sættes til `"Pending"`.
- `objective`: (String) Kortfattet formål med sprintet.
- `relatedPRDs`: (Array of Strings) Stier til relevante PRD-dokumenter.

#### 2.2 `scopeBoundaries` (Objekt)

Definerer, hvad der er inden for og uden for scope.

- `inScope`: (Array of Strings) En liste over konkrete leverancer.
- `outOfScope`: (Array of Strings) En liste over ting, der eksplicit _ikke_ skal laves.

#### 2.2.1 MCP Server Opstart Instruktioner

**KRITISK:** Før enhver sprint-udførelse SKAL følgende MCP servere startes som daemon processer:

##### MCP Test Server (Automatiseret Testing)

```bash
# Start MCP test server som daemon
cd scripts/mcp-services/mcp-npm-test-server
npm run start:daemon

# Verificer status
node dist/daemon.js status
```

##### MCP Services Server (NPM Script Management)

```bash
# Start MCP services server som daemon
cd scripts/mcp-services/mcp-npm-services-server
npm run start:daemon

# Verificer status
node dist/daemon.js status
```

**Obligatoriske MCP Server Checks i alle AI-kontrakter:**

- `"MUST start MCP test server daemon before sprint execution: cd scripts/mcp-services/mcp-npm-test-server && npm run start:daemon"`
- `"MUST start MCP services server daemon before sprint execution: cd scripts/mcp-services/mcp-npm-services-server && npm run start:daemon"`
- `"MUST verify both MCP servers are running before task execution"`
- `"MUST stop MCP servers cleanly after sprint completion"`

#### 2.3 `restrictiveInstructions` (Array of Strings)

**KRITISK:** En liste af tvingende regler, som AI'en **SKAL** adlyde. Disse skal være utvetydige og starte med `"NEVER"` eller `"MUST"`.

**OBLIGATORISKE navngivnings- og kvalitetsregler:** SKAL altid inkludere:

- `"MUST follow ALL naming conventions defined in sw-naming-book.json for files, functions, classes, and variables"`
- `"MUST run 'sw_mcp_npm_services_run_naming_check_all' before any commit or task completion"`
- `"MUST use 'sw_mcp_npm_services_run_naming_fix_all' to auto-fix naming violations"`
- `"MUST achieve 100% test coverage via MCP test server before marking tasks as complete"`
- `"MUST validate with Puppeteer tests until all UI components work correctly"`
- `"NEVER use inline styling - ALWAYS use CSS files in src/styles/"`
- `"MUST use Biome for linting and formatting: 'sw_mcp_npm_services_run_lint_biome_fix'"`

**OBLIGATORISKE MCP Server regler:** SKAL altid inkludere:

- `"MUST start MCP test server daemon before sprint execution: cd scripts/mcp-services/mcp-npm-test-server && npm run start:daemon"`
- `"MUST start MCP services server daemon before sprint execution: cd scripts/mcp-services/mcp-npm-services-server && npm run start:daemon"`
- `"MUST verify both MCP servers are running before executing any tasks by using 'node dist/daemon.js status' commands in their respective directories"`
- `"MUST ensure MCP test server is running before executing any test-related tasks"`
- `"MUST stop MCP servers cleanly after sprint completion using 'node dist/daemon.js stop' commands"`

#### 2.4 `tasks` (Array of Objects)

Hver opgave fra `sprint<X>.md` oversættes til et opgaveobjekt:

- `taskId`: (String) Unikt ID (f.eks. `"3.1"`).
- `taskName`: (String) Kort, beskrivende titel.
- `description`: (String) Detaljeret beskrivelse af, hvad der skal implementeres, inklusiv filstier.
- `verification`: (String) **Bevis-drevet:** En konkret, målbar påstand, der kan verificeres. Hvordan ved vi, at opgaven er løst korrekt? _Eksempel: `"The component renders a static list of mock projects correctly."`_
- `tests`: (Array of Strings) **Test-drevet:** En liste af specifikke tests, der **SKAL** implementeres og bestås for denne opgave. _Eksempel: `"Component renders without TypeScript errors"`_
- `namingValidation`: (Array of Strings) **Navngivnings-validering:** Specifikke npm scripts der SKAL køres og bestås. _Eksempel: `"sw_mcp_npm_services_run_naming_check_all passes without errors"`_
- `qualityChecks`: (Array of Strings) **Kvalitetssikring:** Værktøjer der SKAL køres før task completion. _Eksempel: `"sw_mcp_npm_services_run_lint_biome_fix completes successfully"`_
- `prerequisite`: (String/null) `taskId` for den opgave, der skal være fuldført før denne. `null` for den første opgave.
- `status`: (String) Sættes til `"Pending"`.

#### 2.5 `deliverables` (Array of Strings)

En liste over de endelige, forretningsvendte resultater af sprintet.

#### 2.6 `completionDefinition` (Objekt)

Definerer, hvornår hele sprintet er fuldført.

- `criteria`: (Array of Strings) En tjekliste af absolutte krav. _Eksempel: `"ALL tasks completed in sequential order"`_
- `verification`: (String) Metoden til endelig godkendelse. _Eksempel: `"Binary pass/fail - sprint is complete ONLY when all criteria are met"`_

#### 2.7 `errorHandling` (Objekt)

Instruktioner for, hvordan AI'en skal reagere på fejl.

- `onFailure`: (Objekt) Hvad der skal ske ved fejl.
  - `action`: (String) _Eksempel: `"STOP execution immediately"`_
  - `reporting`: (Array of Strings) Hvad der skal rapporteres.
- `recovery`: (String) Hvordan man kommer videre efter en fejl.

#### 2.8 `executionOrder` (String)

Definerer rækkefølgen for opgaveudførelse. Typisk `"SEQUENTIAL"`.

---

### Trin 3: Validering og Levering

1. **Valider JSON:** Sørg for, at den genererede fil er valid JSON.
2. **Gem filen:** Gem kontrakten på den korrekte sti: `docs/project/sprints/<X>/ai-contract-sprint<X>.json`.
3. **AI-anerkendelse:** Kontrakten er nu den eneste sandhed. AI'en må ikke afvige fra den, stille spørgsmål til dens indhold eller forsøge at omfortolke den. Den er en **eksekveringsplan**, ikke et diskussionsoplæg.
4. Alle `Pending` statuser i kontrakten erstattes af `Done` ved afslutning af sprintet.

### Trin 4: Obligatoriske Kvalitetssikrings-Workflows

**KRITISK:** Alle ai-contract-sprintX.json filer SKAL inkludere følgende workflows i `completionDefinition.criteria`:

#### 4.1 Navngivnings-Validation

```
"ALL naming conventions validated with: sw_mcp_npm_services_run_naming_check_all"
"ALL naming violations auto-fixed with: sw_mcp_npm_services_run_naming_fix_all"
"ALL files follow sw-naming-book.json conventions"
```

#### 4.2 Kodekvalitet og Formatering

```
"ALL code linted and formatted with: sw_mcp_npm_services_run_lint_biome_fix"
"ALL AST-grep rules pass: sw_mcp_npm_services_run_refactor_ast_grep"
"ALL code follows project structure from projectstructuredefinition.md"
```

#### 4.3 Test og Validering

```
"MCP test server started and running: cd scripts/mcp-services/mcp-npm-test-server && npm run start:daemon && node dist/daemon.js status"
"MCP services server started and running: cd scripts/mcp-services/mcp-npm-services-server && npm run start:daemon && node dist/daemon.js status"
"ALL unit tests pass with 100% coverage via MCP test server"
"ALL Puppeteer UI tests pass completely"
"ALL TypeScript compilation succeeds without errors"
"MCP test server properly stopped after testing: node dist/daemon.js stop"
"MCP services server properly stopped after testing: node dist/daemon.js stop"
```

#### 4.4 Før Task Completion Checklist

Hver task SKAL inkludere følgende i `verification`:

1. `"MCP test server is running: cd scripts/mcp-services/mcp-npm-test-server && node dist/daemon.js status"`
2. `"MCP services server is running: cd scripts/mcp-services/mcp-npm-services-server && node dist/daemon.js status"`
3. `"sw_mcp_npm_services_run_naming_check_all passes without errors"`
4. `"sw_mcp_npm_services_run_lint_biome_fix completes successfully"`
5. `"100% test coverage achieved via MCP test server"`
6. `"Puppeteer tests validate all UI functionality"`

#### 4.5 Sprint Completion Workflow

```
"MCP test server final validation: cd scripts/mcp-services/mcp-npm-test-server && npm run start:daemon && node dist/daemon.js status"
"MCP services server final validation: cd scripts/mcp-services/mcp-npm-services-server && npm run start:daemon && node dist/daemon.js status"
"Final validation: sw_mcp_npm_services_run_naming_check_all && cd scripts/mcp-services/mcp-npm-test-server && node dist/daemon.js status && cd ../../.. && sw_mcp_npm_services_run_lint_biome"
"All Puppeteer tests pass for complete user journey"
"All deliverables meet acceptance criteria"
"MCP test server cleanup: cd scripts/mcp-services/mcp-npm-test-server && node dist/daemon.js stop"
"MCP services server cleanup: cd scripts/mcp-services/mcp-npm-services-server && node dist/daemon.js stop"
```
