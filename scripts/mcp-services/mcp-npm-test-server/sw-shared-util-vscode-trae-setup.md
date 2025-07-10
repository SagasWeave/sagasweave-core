# VSCode/Trae MCP Integration Setup

## Opsætning af SagasWeave NPM Test MCP Server i VSCode/Trae

### Forudsætninger

1. **Byg MCP serveren først:**
   ```bash
   cd /Users/lpm/Repo/SagasWeaveCloudProject/SW-core/scripts/mcp-services/mcp-npm-test-server
   npm run build
   ```

2. **Verificer at dist/index.js eksisterer:**
   ```bash
   ls -la dist/index.js
   ```

### Konfiguration til VSCode/Trae

1. **Kopiér konfigurationsfilen:**
   - Brug `vscode-trae-config.json` som din MCP konfiguration
   - Filen indeholder allerede de korrekte stier til dit projekt

2. **Konfigurationsfil placering:**
   - Placér konfigurationen hvor VSCode/Trae forventer MCP konfigurationer
   - Eller brug den direkte i Trae's MCP indstillinger

### Miljøvariabler

| Variabel | Værdi | Beskrivelse |
|----------|-------|-------------|
| `SW_MCP_NPM_TEST_PROJECT_ROOT` | `/Users/lpm/Repo/SagasWeaveCloudProject/SW-core` | Rod-mappen for SagasWeave projektet |
| `SW_MCP_NPM_TEST_MAX_CONCURRENT` | `3` | Maksimalt antal samtidige test processer |
| `SW_MCP_NPM_TEST_TIMEOUT` | `30000` | Standard timeout for test udførelse (ms) |
| `DEBUG` | `sw-mcp-npm-test` | Aktivér debug logging |

### Tilgængelige MCP Værktøjer

1. **`sw_mcp_npm_test_run_unit_tests`** - Kør unit tests
2. **`sw_mcp_npm_test_run_e2e_tests`** - Kør E2E tests
3. **`sw_mcp_npm_test_get_test_status`** - Få test status
4. **`sw_mcp_npm_test_stop_tests`** - Stop kørende tests
5. **`sw_mcp_npm_test_parse_coverage`** - Parse coverage rapporter

### Eksempel Kommandoer til AI

- "Kør unit tests for backend workspace med coverage"
- "Kør E2E tests i headed mode"
- "Hvad er status på kørende tests?"
- "Stop alle kørende tests"
- "Vis mig coverage rapporten for backend"

### Fejlfinding

| Problem | Løsning |
|---------|----------|
| Server ikke fundet | Verificer at stien til `dist/index.js` er korrekt |
| Permission denied | Kør `chmod +x dist/index.js` |
| Projekt ikke fundet | Verificer `SW_MCP_NPM_TEST_PROJECT_ROOT` stien |
| Tests kører ikke | Tjek at npm scripts eksisterer i target workspace |

### Test af Opsætning

```bash
# Test serveren direkte
node dist/index.js --help

# Verificer MCP protokol
npx @modelcontextprotocol/inspector node dist/index.js
```

### Integration med Trae AI

Når MCP serveren er konfigureret korrekt, kan du bruge følgende kommandoer i Trae:

- "Kør alle unit tests"
- "Vis test coverage"
- "Kør E2E tests med browser"
- "Stop alle tests"
- "Hvad er test status?"

Serveren vil automatisk håndtere test udførelse og give strukturerede resultater tilbage til AI'en.