# @sagasweave/mcp-npm-services-server

En MCP (Model Context Protocol) server der giver AI assistenter adgang til alle npm scripts i dit projekt (undtagen test scripts). Serveren opdager automatisk alle tilgængelige npm scripts og gør dem tilgængelige som MCP tools.

## Funktioner

### Automatisk Script Discovery

Serveren scanner automatisk `package.json` for scripts og ekskluderer kun:

- Scripts der indeholder `test`, `Test` eller `TEST`

Alle andre scripts bliver automatisk tilgængelige som MCP tools uden manuel konfiguration.

### Dynamiske NPM Script Tools

Alle npm scripts der ikke er test-relaterede bliver automatisk tilgængelige som MCP tools med navngivning:
`sw_mcp_npm_services_run_{script_name}`

For eksempel:

- `npm run dev:frontend` → `sw_mcp_npm_services_run_dev_frontend`
- `npm run build:backend` → `sw_mcp_npm_services_run_build_backend`
- `npm run lint:biome:fix` → `sw_mcp_npm_services_run_lint_biome_fix`

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

## Configuration

### Environment Variables

| Variable                             | Default         | Description                                         |
| ------------------------------------ | --------------- | --------------------------------------------------- |
| `SW_MCP_NPM_SERVICES_PROJECT_ROOT`   | `process.cwd()` | Root directory of your project                      |
| `SW_MCP_NPM_SERVICES_MAX_CONCURRENT` | `5`             | Maximum concurrent processes                        |
| `SW_MCP_NPM_SERVICES_TIMEOUT`        | `60000`         | Default timeout for script execution (ms)           |
| `DEBUG`                              | -               | Enable debug logging (set to `sw-mcp-npm-services`) |

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "sagasweave-npm-services": {
      "command": "node",
      "args": [
        "/absolute/path/to/scripts/mcp-services/mcp-npm-services-server/dist/index.js"
      ],
      "env": {
        "SW_MCP_NPM_SERVICES_PROJECT_ROOT": "/absolute/path/to/your/project",
        "SW_MCP_NPM_SERVICES_MAX_CONCURRENT": "5",
        "SW_MCP_NPM_SERVICES_TIMEOUT": "60000",
        "DEBUG": "sw-mcp-npm-services"
      }
    }
  }
}
```

## Available Tools

### Static Tools

#### `sw_mcp_npm_services_get_status`

Get status of running or completed npm script processes.

**Parameters:**

- `swMcpNpmServicesStatusProcessId` (optional): Specific process ID to check

#### `sw_mcp_npm_services_stop_processes`

Stop running npm script processes.

**Parameters:**

- `swMcpNpmServicesStopProcessId` (optional): Specific process ID to stop (stops all if not specified)

#### `sw_mcp_npm_services_list_scripts`

List all available npm scripts (excluding tests).

### Dynamic Tools

All non-test npm scripts are automatically available as tools with the naming pattern:
`sw_mcp_npm_services_run_{script_name}`

**Common Parameters for Dynamic Tools:**

- `swMcpNpmServicesWorkspace` (optional): Workspace to run script in (e.g., `apps/backend`, `apps/frontend`)
- `swMcpNpmServicesArgs` (optional): Additional arguments to pass to the script

## Usage Examples

### Start Development Server

```typescript
// AI can call:
sw_mcp_npm_services_run_dev_frontend({
  swMcpNpmServicesWorkspace: "apps/frontend",
});
```

### Build Project

```typescript
// AI can call:
sw_mcp_npm_services_run_build({
  swMcpNpmServicesArgs: "--production",
});
```

### Run Linting with Auto-fix

```typescript
// AI can call:
sw_mcp_npm_services_run_lint_biome_fix();
```

## Background Operation

### Auto-Start Scripts

For AI assistants that need to start the MCP server automatically without occupying a terminal:

```bash
# Start server in background
npm run start:daemon

# Check server status
node dist/daemon.js status

# Stop background server
node dist/daemon.js stop

# Restart server
node dist/daemon.js restart
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

- **Single Responsibility**: Each tool handles a specific npm script execution
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Process Management**: Proper tracking and cleanup of child processes
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Workspace Support**: Integrated with the monorepo structure
- **Auto-Discovery**: Dynamic discovery of npm scripts without manual configuration

## Dependencies

- `@modelcontextprotocol/sdk`: Core MCP SDK for server implementation
- `zod`: Runtime type validation and parsing
- `typescript`: Type-safe development

## Integration with SagasWeave

This MCP server is designed to work seamlessly with the SagasWeave development workflow:

- Automatically discovers all development, build, and utility scripts
- Excludes test scripts to avoid conflicts with the dedicated test MCP server
- Supports workspace-specific script execution
- Provides real-time process monitoring and management
- Follows SagasWeave naming conventions for consistency

## Security Considerations

- Only npm scripts defined in `package.json` can be executed
- Process execution is sandboxed to the project directory
- Configurable timeout prevents runaway processes
- Proper process cleanup on server shutdown
- No arbitrary command execution - only predefined npm scripts
