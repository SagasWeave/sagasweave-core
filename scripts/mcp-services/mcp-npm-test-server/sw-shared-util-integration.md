# SagasWeave NPM Test MCP Server Integration Guide

This guide explains how to integrate the SagasWeave NPM Test MCP Server with your existing development workflow and AI tools.

## Overview

The SagasWeave NPM Test MCP Server bridges the gap between AI agents and your test infrastructure, enabling:

- **AI-Assisted Test Development**: Let AI agents run tests and analyze results
- **Real-time Test Monitoring**: Monitor test execution from AI interfaces
- **Automated Test Workflows**: Create AI-driven test automation pipelines
- **Coverage Analysis**: Get AI insights into test coverage gaps

## Integration with Existing Test Setup

### Current Test Infrastructure

Your project already has:
- ✅ Vitest for unit testing (`vitest.config.ts`)
- ✅ Puppeteer for E2E testing (`vitest.config.e2e.ts`)
- ✅ Coverage reporting with v8 provider
- ✅ Monorepo workspace structure
- ✅ npm scripts for test execution

### MCP Server Enhancement

The MCP server adds:
- 🤖 AI agent access to test commands
- 📊 Structured test result parsing
- 🔄 Process management for long-running tests
- 📈 Coverage report integration
- 🎯 Workspace-specific test execution

## Setup Instructions

### 1. Build the MCP Server

```bash
# From project root
npm run mcp:build

# Or from the MCP server directory
cd scripts/mcp-services/mcp-npm-test-server
npm run build
```

### 2. Test the Server

```bash
# Test that the server starts correctly
node scripts/mcp-services/mcp-npm-test-server/dist/index.js

# Should output: "SagasWeave NPM Test MCP Server started"
```

### 3. Configure Claude Desktop

Copy the example configuration:

```bash
cp scripts/mcp-services/mcp-npm-test-server/claude-desktop-config.example.json ~/claude-config.json
```

Edit the configuration with your actual paths:

```json
{
  "mcpServers": {
    "sagasweave-npm-test": {
      "command": "node",
      "args": ["/your/path/to/scripts/mcp-services/mcp-npm-test-server/dist/index.js"],
      "env": {
        "SW_MCP_NPM_TEST_PROJECT_ROOT": "/your/path/to/sagasweave/project"
      }
    }
  }
}
```

Add this to your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

### 4. Restart Claude Desktop

Restart Claude Desktop to load the new MCP server configuration.

## Usage Examples

### Running Unit Tests

**Prompt**: "Run unit tests for the backend workspace with coverage"

**AI Action**: Uses `sw_mcp_npm_test_run_unit_tests` with:
```json
{
  "swMcpNpmTestRunWorkspace": "apps/backend",
  "swMcpNpmTestRunCoverage": true
}
```

**Result**: Executes `npm run test:coverage --workspace=apps/backend`

### Running E2E Tests

**Prompt**: "Run E2E tests in headed mode for the login flow"

**AI Action**: Uses `sw_mcp_npm_test_run_e2e_tests` with:
```json
{
  "swMcpNpmTestE2eHeaded": true,
  "swMcpNpmTestE2ePattern": "login.e2e.test.ts"
}
```

**Result**: Executes `npm run test:e2e -- --headed login.e2e.test.ts`

### Monitoring Test Status

**Prompt**: "What tests are currently running?"

**AI Action**: Uses `sw_mcp_npm_test_get_test_status`

**Result**: Returns list of active test processes with duration and status

### Analyzing Coverage

**Prompt**: "Show me the test coverage for the backend"

**AI Action**: Uses `sw_mcp_npm_test_parse_coverage` with:
```json
{
  "swMcpNpmTestCoverageWorkspace": "apps/backend"
}
```

**Result**: Returns parsed coverage data from `apps/backend/coverage/coverage-summary.json`

## Advanced Workflows

### AI-Driven Test Development

1. **Test Gap Analysis**: AI can analyze coverage reports and suggest new tests
2. **Regression Testing**: AI can run specific test suites after code changes
3. **Performance Monitoring**: AI can track test execution times and identify slow tests
4. **Flaky Test Detection**: AI can run tests multiple times to identify inconsistencies

### Continuous Integration Integration

The MCP server can be used in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run AI-Assisted Tests
  run: |
    # Start MCP server
    node scripts/mcp-services/mcp-npm-test-server/dist/index.js &
    
    # Use mcp-test-client to run tests
    npx mcp-test-client --server "node scripts/mcp-services/mcp-npm-test-server/dist/index.js" \
      --tool sw_mcp_npm_test_run_unit_tests \
      --args '{"swMcpNpmTestRunCoverage": true}'
```

### Development Workflow Integration

1. **Watch Mode**: Use AI to start tests in watch mode during development
2. **Selective Testing**: Ask AI to run only tests related to changed files
3. **Coverage Monitoring**: Get real-time coverage feedback from AI
4. **Test Debugging**: Use AI to analyze test failures and suggest fixes

## Troubleshooting

### Common Issues

#### Server Not Starting
```bash
# Check if dependencies are installed
npm install --workspace=scripts/mcp-services/mcp-npm-test-server

# Rebuild the server
npm run mcp:build

# Check for TypeScript errors
npx tsc --noEmit --project scripts/mcp-services/mcp-npm-test-server
```

#### Tests Not Found
```bash
# Verify workspace structure
ls apps/backend/src/**/*.test.ts
ls apps/frontend/src/**/*.test.ts

# Check npm scripts
npm run test --workspace=apps/backend
```

#### Permission Errors
```bash
# Make the server executable
chmod +x scripts/mcp-services/mcp-npm-test-server/dist/index.js

# Check project permissions
ls -la scripts/mcp-services/mcp-npm-test-server/dist/
```

#### Coverage Reports Missing
```bash
# Run tests with coverage first
npm run test:coverage --workspace=apps/backend

# Check coverage directory
ls apps/backend/coverage/
```

### Debug Mode

Enable debug logging:

```json
{
  "env": {
    "DEBUG": "sw-mcp-npm-test",
    "SW_MCP_NPM_TEST_PROJECT_ROOT": "/your/project/path"
  }
}
```

### Validation

Test the MCP server manually:

```bash
# Install mcp-test-client globally
npm install -g mcp-test-client

# Test the server
mcp-test-client --server "node scripts/mcp-services/mcp-npm-test-server/dist/index.js"
```

## Next Steps

1. **Custom Tools**: Extend the MCP server with project-specific test tools
2. **AI Prompts**: Create custom AI prompts for common testing workflows
3. **Integration Testing**: Set up integration tests for the MCP server itself
4. **Performance Optimization**: Monitor and optimize test execution performance
5. **Team Training**: Train team members on AI-assisted testing workflows

## Related Documentation

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Puppeteer Documentation](https://pptr.dev/)
- [SagasWeave Test Gap Analysis](../../sw-test-gap-analysis.json)
- [Project Structure](../../projectstructuredefinition.md)

## Support

For issues specific to the MCP server:
1. Check the server logs for error messages
2. Verify the configuration matches your project structure
3. Test individual npm scripts manually
4. Review the MCP server source code for debugging

For general testing issues:
1. Refer to the existing test documentation
2. Check Vitest and Puppeteer configurations
3. Verify workspace setup and dependencies