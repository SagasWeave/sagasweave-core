# @sagasweave/mcp-npm-test-server

En MCP (Model Context Protocol) server der giver AI assistenter adgang til npm test kommandoer og scripts. Serveren opdager automatisk alle test-relaterede npm scripts i dit projekt og gør dem tilgængelige som MCP tools.

## Funktioner

### Automatisk Script Discovery
Serveren scanner automatisk `package.json` for scripts der indeholder:
- `test` - Test scripts
- `lint` - Linting scripts  
- `format` - Formatering scripts
- `naming` - Naming convention scripts
- `refactor` - Refactoring scripts
- `fix` - Auto-fix scripts

Alle disse scripts bliver automatisk tilgængelige som MCP tools uden manuel konfiguration.

### Core Test Tools
- **Unit Tests**: Kør Vitest unit tests med workspace, watch og coverage support
- **E2E Tests**: Kør Puppeteer E2E tests med headed mode og pattern filtering
- **Test Status**: Få status på kørende eller afsluttede test processer
- **Stop Tests**: Stop kørende test processer
- **Coverage Parsing**: Parse og returner coverage rapport data

### Dynamiske NPM Script Tools
Alle npm scripts der matcher filterkriterierne bliver automatisk tilgængelige som MCP tools med navngivning:
`sw_mcp_npm_test_run_{script_name}`

For eksempel:
- `npm run test:naming` → `sw_mcp_npm_test_run_test_naming`
- `npm run lint:fix` → `sw_mcp_npm_test_run_lint_fix`
- `npm run format` → `sw_mcp_npm_test_run_format`

A Model Context Protocol (MCP) server that provides AI agents with the ability to execute and monitor npm test commands, specifically integrated with Vitest for the SagasWeave project.

## Features

- **Unit Test Execution**: Run Vitest unit tests with coverage support
- **E2E Test Execution**: Execute Puppeteer-based end-to-end tests
- **Process Management**: Monitor and control running test processes
- **Coverage Reporting**: Parse and return coverage data
- **Watch Mode Support**: Run tests in watch mode for continuous development
- **Workspace Support**: Execute tests in specific workspaces (frontend/backend)

## Installation

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Start the server (foreground)
npm start

# Start the server as daemon (background)
npm run start:daemon
```

## Available Tools

### `sw_mcp_npm_test_run_unit_tests`

Run unit tests using npm test command with Vitest.

**Parameters:**
- `swMcpNpmTestRunWorkspace` (string, optional): Workspace to run tests in (e.g., "apps/backend", "apps/frontend")
- `swMcpNpmTestRunPattern` (string, optional): Test file pattern to match
- `swMcpNpmTestRunWatch` (boolean, default: false): Run tests in watch mode
- `swMcpNpmTestRunCoverage` (boolean, default: false): Generate coverage report

**Example:**
```json
{
  "swMcpNpmTestRunWorkspace": "apps/backend",
  "swMcpNpmTestRunCoverage": true
}
```

### `sw_mcp_npm_test_run_e2e_tests`

Run end-to-end tests using Puppeteer and Vitest.

**Parameters:**
- `swMcpNpmTestE2eHeaded` (boolean, default: false): Run tests in headed mode (visible browser)
- `swMcpNpmTestE2ePattern` (string, optional): E2E test file pattern to match

**Example:**
```json
{
  "swMcpNpmTestE2eHeaded": true,
  "swMcpNpmTestE2ePattern": "login.e2e.test.ts"
}
```

### `sw_mcp_npm_test_get_test_status`

Get status of running or completed tests.

**Parameters:**
- `swMcpNpmTestStatusProcessId` (string, optional): Process ID to check status for (returns all if not specified)

**Example:**
```json
{
  "swMcpNpmTestStatusProcessId": "sw-test-1234567890-1"
}
```

### `sw_mcp_npm_test_stop_tests`

Stop running test processes.

**Parameters:**
- `swMcpNpmTestStopProcessId` (string, optional): Process ID to stop (stops all if not specified)

**Example:**
```json
{
  "swMcpNpmTestStopProcessId": "sw-test-1234567890-1"
}
```

### `sw_mcp_npm_test_parse_coverage`

Parse and return coverage report data.

**Parameters:**
- `swMcpNpmTestCoverageWorkspace` (string, required): Workspace to get coverage for (e.g., "apps/backend")

**Example:**
```json
{
  "swMcpNpmTestCoverageWorkspace": "apps/backend"
}
```

## Background Operation

### Auto-Start Scripts
For AI assistants that need to start the MCP server automatically without occupying a terminal:

```bash
# Auto-start server in background (from project root)
npm run mcp:auto-start

# Start server in background manually
npm run mcp:start:bg

# Check server status
npm run mcp:status

# Stop background server
npm run mcp:stop

# View server logs
npm run mcp:logs
```

### Daemon Mode
The server includes a daemon wrapper that:
- Runs in background without requiring STDIO connection
- Logs to file instead of console
- Handles graceful shutdown
- Maintains PID file for process management

## Configuration

The server can be configured through environment variables or constructor parameters:

- `SW_MCP_NPM_TEST_PROJECT_ROOT`: Project root directory (default: current working directory)
- `SW_MCP_NPM_TEST_MAX_CONCURRENT`: Maximum concurrent test processes (default: 3)
- `SW_MCP_NPM_TEST_TIMEOUT`: Default timeout for test execution in milliseconds (default: 30000)

## Integration with Claude Desktop

To use this MCP server with Claude Desktop, add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "sagasweave-npm-test": {
      "command": "node",
      "args": ["/path/to/scripts/mcp-services/mcp-npm-test-server/dist/index.js"],
      "env": {
        "SW_MCP_NPM_TEST_PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

## Testing the Server

You can test the MCP server using the `mcp-test-client` package:

```bash
# Install test client
npm install -g mcp-test-client

# Test the server
mcp-test-client --server "node dist/index.js"
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Architecture

The server follows the SagasWeave naming conventions and architectural patterns:

- **Single Responsibility**: Each tool handles a specific testing concern
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Process Management**: Proper tracking and cleanup of child processes
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Workspace Support**: Integrated with the monorepo structure

## Dependencies

- `@modelcontextprotocol/sdk`: Core MCP SDK for server implementation
- `zod`: Runtime type validation and parsing
- `typescript`: Type-safe development

## License

Part of the SagasWeave project. See project root for license information.

## Contributing

This MCP server is part of the SagasWeave monorepo. Follow the project's contribution guidelines and naming conventions when making changes.

## Troubleshooting

### Common Issues

1. **Tests not found**: Ensure the workspace path is correct and tests exist
2. **Permission errors**: Check that the server has permission to execute npm commands
3. **Timeout errors**: Increase the timeout configuration for long-running tests
4. **Coverage not found**: Ensure tests have been run with coverage enabled

### Debug Mode

Set the `DEBUG` environment variable to enable verbose logging:

```bash
DEBUG=sw-mcp-npm-test npm start
```