#!/usr/bin/env node

/**
 * SagasWeave NPM Services MCP Server
 *
 * A Model Context Protocol swSharedUtilServer that provides AI agents with the ability to
 * execute and monitor npm swSharedUtilScripts, automatically discovering all available swSharedUtilScripts
 * except test-related ones.
 *
 * This swSharedUtilServer enables real-time script execution, monitoring, and swSharedUtilResult parsing
 * for AI-assisted development workflows.
 */

import { type ChildProcess, spawn } from 'node:child_process';
import * as fsSync from 'node:fs';
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Configuration for the MCP swSharedUtilServer
 */
interface SwMcpNpmServicesServerConfig {
  swMcpNpmServicesServerProjectRoot: string;
  swMcpNpmServicesServerMaxConcurrentProcesses: number;
  swMcpNpmServicesServerDefaultTimeout: number;
}

/**
 * Script execution swSharedUtilResult interface
 */
interface SwMcpNpmServicesExecutionResult {
  swMcpNpmServicesExecutionSuccess: boolean;
  swMcpNpmServicesExecutionExitCode: number;
  swMcpNpmServicesExecutionOutput: string;
  swMcpNpmServicesExecutionError?: string;
  swMcpNpmServicesExecutionDuration: number;
  swMcpNpmServicesExecutionTimestamp: string;
}

/**
 * Active swSharedUtilProcess tracking
 */
interface SwMcpNpmServicesActiveProcess {
  swMcpNpmServicesActiveProcessId: string;
  swMcpNpmServicesActiveProcessChild: ChildProcess;
  swMcpNpmServicesActiveProcessStartTime: number;
  swMcpNpmServicesActiveProcessCommand: string;
}

/**
 * Dynamic tool discovery for npm swSharedUtilScripts
 */
function swSharedApiMcpNpmServicesServerDiscoverNpmScripts(
  projectRoot: string
): Array<{ name: string; description: string; script: string }> {
  const swSharedApiMcpNpmServicesServerPackageJsonPath = path.join(projectRoot, 'package.json');

  if (!fsSync.existsSync(swSharedApiMcpNpmServicesServerPackageJsonPath)) {
    return [];
  }

  try {
    const swSharedApiMcpNpmServicesServerPackageJson = JSON.parse(
      fsSync.readFileSync(swSharedApiMcpNpmServicesServerPackageJsonPath, 'utf8')
    );
    const swSharedApiMcpNpmServicesServerScripts =
      swSharedApiMcpNpmServicesServerPackageJson.scripts || {};

    return Object.entries(swSharedApiMcpNpmServicesServerScripts)
      .filter(
        ([name]) => !name.includes('test') && !name.includes('Test') && !name.includes('TEST')
      )
      .map(([name, script]) => ({
        name: `sw_mcp_npm_services_run_${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
        description: `Run npm script: ${name} (${script})`,
        script: name,
      }));
  } catch (error) {
    console.error('Error reading package.json:', error);
    return [];
  }
}

/**
 * Main MCP Server class for npm services integration
 */
class SwSharedApiMcpNpmServicesServer {
  private swMcpNpmServicesServerInstance: Server;
  private swSharedApiMcpNpmServicesServerConfig: SwMcpNpmServicesServerConfig;
  private swMcpNpmServicesServerActiveProcesses: Map<string, SwMcpNpmServicesActiveProcess>;
  private swMcpNpmServicesServerProcessCounter: number;

  constructor(swMcpNpmServicesServerConfigParam: Partial<SwMcpNpmServicesServerConfig> = {}) {
    this.swSharedApiMcpNpmServicesServerConfig = {
      swMcpNpmServicesServerProjectRoot:
        swMcpNpmServicesServerConfigParam.swMcpNpmServicesServerProjectRoot ||
        process.cwd(),
      swMcpNpmServicesServerMaxConcurrentProcesses:
        swMcpNpmServicesServerConfigParam.swMcpNpmServicesServerMaxConcurrentProcesses || 5,
      swMcpNpmServicesServerDefaultTimeout:
        swMcpNpmServicesServerConfigParam.swMcpNpmServicesServerDefaultTimeout || 60000,
    };

    this.swMcpNpmServicesServerActiveProcesses = new Map();
    this.swMcpNpmServicesServerProcessCounter = 0;

    this.swMcpNpmServicesServerInstance = new Server({
      name: '@sagasweave/mcp-npm-services-swSharedUtilServer',
      version: '0.1.0',
      capabilities: {
        tools: {},
      },
    });

    this.swMcpNpmServicesServerSetupHandlers();
  }

  /**
   * Setup MCP swSharedUtilServer request handlers
   */
  private swMcpNpmServicesServerSetupHandlers(): void {
    // List available tools
    this.swMcpNpmServicesServerInstance.setRequestHandler(ListToolsRequestSchema, async () => {
      const swSharedUtilDynamicTools = swSharedApiMcpNpmServicesServerDiscoverNpmScripts(
        this.swSharedApiMcpNpmServicesServerConfig.swMcpNpmServicesServerProjectRoot
      );

      const swSharedUtilStaticTools = [
        {
          name: 'sw_mcp_npm_services_get_status',
          description: 'Get status of running or completed npm script processes',
          inputSchema: {
            type: 'object',
            properties: {
              swMcpNpmServicesStatusProcessId: {
                type: 'string',
                description:
                  'Process ID to check status for (optional, returns all if not specified)',
              },
            },
          },
        },
        {
          name: 'sw_mcp_npm_services_stop_processes',
          description: 'Stop running npm script processes',
          inputSchema: {
            type: 'object',
            properties: {
              swMcpNpmServicesStopProcessId: {
                type: 'string',
                description: 'Process ID to stop (optional, stops all if not specified)',
              },
            },
          },
        },
        {
          name: 'sw_mcp_npm_services_list_scripts',
          description: 'List all available npm swSharedUtilScripts (excluding tests)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ];

      // Convert dynamic tools to proper tool format
      const swSharedUtilDynamicToolsFormatted = swSharedUtilDynamicTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object',
          properties: {
            swMcpNpmServicesWorkspace: {
              type: 'string',
              description:
                'Workspace to run script in (optional, e.g., apps/backend, apps/frontend)',
            },
            swMcpNpmServicesArgs: {
              type: 'string',
              description: 'Additional arguments to pass to the script (optional)',
            },
          },
        },
      }));

      return {
        tools: [...swSharedUtilStaticTools, ...swSharedUtilDynamicToolsFormatted],
      };
    });

    // Handle tool calls
    this.swMcpNpmServicesServerInstance.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        const { name, arguments: args } = request.params;

        try {
          switch (name) {
            case 'sw_mcp_npm_services_get_status':
              return await this.swMcpNpmServicesServerGetStatus(args);
            case 'sw_mcp_npm_services_stop_processes':
              return await this.swMcpNpmServicesServerStopProcesses(args);
            case 'sw_mcp_npm_services_list_scripts':
              return await this.swMcpNpmServicesServerListScripts();
            default:
              // Handle dynamic script execution
              if (name.startsWith('sw_mcp_npm_services_run_')) {
                return await this.swMcpNpmServicesServerExecuteScript(name, args);
              }
              throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
          }
        } catch (error) {
          if (error instanceof McpError) {
            throw error;
          }
          throw new McpError(
            ErrorCode.InternalError,
            `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    );
  }

  /**
   * Execute a dynamic npm script
   */
  private async swMcpNpmServicesServerExecuteScript(toolName: string, args: any): Promise<any> {
    const swSharedUtilScriptName = toolName
      .replace('sw_mcp_npm_services_run_', '')
      .replace(/_/g, ':');
    const swSharedUtilWorkspace = args?.swMcpNpmServicesWorkspace;
    const swSharedUtilAdditionalArgs = args?.swMcpNpmServicesArgs;

    if (
      this.swMcpNpmServicesServerActiveProcesses.size >=
      this.swSharedApiMcpNpmServicesServerConfig.swMcpNpmServicesServerMaxConcurrentProcesses
    ) {
      throw new McpError(
        ErrorCode.InternalError,
        `Maximum concurrent processes (${this.swSharedApiMcpNpmServicesServerConfig.swMcpNpmServicesServerMaxConcurrentProcesses}) reached`
      );
    }

    const swSharedUtilProcessId = `npm-services-${++this.swMcpNpmServicesServerProcessCounter}`;
    const swSharedUtilStartTime = Date.now();

    const swSharedUtilCommand = 'npm';
    const swSharedUtilCommandArgs = ['run', swSharedUtilScriptName];

    if (swSharedUtilWorkspace) {
      swSharedUtilCommandArgs.push('--workspace', swSharedUtilWorkspace);
    }

    if (swSharedUtilAdditionalArgs) {
      swSharedUtilCommandArgs.push(...swSharedUtilAdditionalArgs.split(' '));
    }

    const swSharedUtilFullCommand = `${swSharedUtilCommand} ${swSharedUtilCommandArgs.join(' ')}`;

    return new Promise((resolve, reject) => {
      const swSharedUtilChild = spawn(swSharedUtilCommand, swSharedUtilCommandArgs, {
        cwd: this.swSharedApiMcpNpmServicesServerConfig.swMcpNpmServicesServerProjectRoot,
        stdio: 'pipe',
      });

      let swSharedUtilOutput = '';
      let swSharedUtilErrorOutput = '';

      swSharedUtilChild.stdout?.on('data', (data) => {
        swSharedUtilOutput += data.toString();
      });

      swSharedUtilChild.stderr?.on('data', (data) => {
        swSharedUtilErrorOutput += data.toString();
      });

      const swSharedUtilActiveProcess: SwMcpNpmServicesActiveProcess = {
        swMcpNpmServicesActiveProcessId: swSharedUtilProcessId,
        swMcpNpmServicesActiveProcessChild: swSharedUtilChild,
        swMcpNpmServicesActiveProcessStartTime: swSharedUtilStartTime,
        swMcpNpmServicesActiveProcessCommand: swSharedUtilFullCommand,
      };

      this.swMcpNpmServicesServerActiveProcesses.set(
        swSharedUtilProcessId,
        swSharedUtilActiveProcess
      );

      const swSharedUtilTimeout = setTimeout(() => {
        swSharedUtilChild.kill('SIGTERM');
        this.swMcpNpmServicesServerActiveProcesses.delete(swSharedUtilProcessId);
        reject(
          new McpError(
            ErrorCode.InternalError,
            `Script execution timed out after ${this.swSharedApiMcpNpmServicesServerConfig.swMcpNpmServicesServerDefaultTimeout}ms`
          )
        );
      }, this.swSharedApiMcpNpmServicesServerConfig.swMcpNpmServicesServerDefaultTimeout);

      swSharedUtilChild.on('close', (code) => {
        clearTimeout(swSharedUtilTimeout);
        this.swMcpNpmServicesServerActiveProcesses.delete(swSharedUtilProcessId);

        const swSharedUtilDuration = Date.now() - swSharedUtilStartTime;
        const swSharedUtilResult: SwMcpNpmServicesExecutionResult = {
          swMcpNpmServicesExecutionSuccess: code === 0,
          swMcpNpmServicesExecutionExitCode: code || 0,
          swMcpNpmServicesExecutionOutput: swSharedUtilOutput,
          swMcpNpmServicesExecutionError: swSharedUtilErrorOutput || undefined,
          swMcpNpmServicesExecutionDuration: swSharedUtilDuration,
          swMcpNpmServicesExecutionTimestamp: new Date().toISOString(),
        };

        resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify(swSharedUtilResult, null, 2),
            },
          ],
        });
      });

      swSharedUtilChild.on('error', (error) => {
        clearTimeout(swSharedUtilTimeout);
        this.swMcpNpmServicesServerActiveProcesses.delete(swSharedUtilProcessId);
        reject(
          new McpError(
            ErrorCode.InternalError,
            `Failed to execute script: ${error.message}`
          )
        );
      });
    });
  }

  /**
   * Get status of running processes
   */
  private async swMcpNpmServicesServerGetStatus(args: any): Promise<any> {
    const swSharedUtilProcessId = args?.swMcpNpmServicesStatusProcessId;

    if (swSharedUtilProcessId) {
      const swSharedUtilProcess =
        this.swMcpNpmServicesServerActiveProcesses.get(swSharedUtilProcessId);
      if (!swSharedUtilProcess) {
        throw new McpError(ErrorCode.InvalidParams, `Process ${swSharedUtilProcessId} not found`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                swSharedUtilProcessId: swSharedUtilProcess.swMcpNpmServicesActiveProcessId,
                swSharedUtilCommand: swSharedUtilProcess.swMcpNpmServicesActiveProcessCommand,
                swSharedUtilStartTime: new Date(
                  swSharedUtilProcess.swMcpNpmServicesActiveProcessStartTime
                ).toISOString(),
                swSharedUtilDuration:
                  Date.now() - swSharedUtilProcess.swMcpNpmServicesActiveProcessStartTime,
                status: 'running',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const swSharedUtilAllProcesses = Array.from(
      this.swMcpNpmServicesServerActiveProcesses.values()
    ).map((swSharedUtilProcess) => ({
      swSharedUtilProcessId: swSharedUtilProcess.swMcpNpmServicesActiveProcessId,
      swSharedUtilCommand: swSharedUtilProcess.swMcpNpmServicesActiveProcessCommand,
      swSharedUtilStartTime: new Date(
        swSharedUtilProcess.swMcpNpmServicesActiveProcessStartTime
      ).toISOString(),
      swSharedUtilDuration: Date.now() - swSharedUtilProcess.swMcpNpmServicesActiveProcessStartTime,
      status: 'running',
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ activeProcesses: swSharedUtilAllProcesses }, null, 2),
        },
      ],
    };
  }

  /**
   * Stop running processes
   */
  private async swMcpNpmServicesServerStopProcesses(args: any): Promise<any> {
    const swSharedUtilProcessId = args?.swMcpNpmServicesStopProcessId;

    if (swSharedUtilProcessId) {
      const swSharedUtilProcess =
        this.swMcpNpmServicesServerActiveProcesses.get(swSharedUtilProcessId);
      if (!swSharedUtilProcess) {
        throw new McpError(ErrorCode.InvalidParams, `Process ${swSharedUtilProcessId} not found`);
      }

      swSharedUtilProcess.swMcpNpmServicesActiveProcessChild.kill('SIGTERM');
      this.swMcpNpmServicesServerActiveProcesses.delete(swSharedUtilProcessId);

      return {
        content: [
          {
            type: 'text',
            text: `Process ${swSharedUtilProcessId} stopped successfully`,
          },
        ],
      };
    }

    // Stop all processes
    const swSharedUtilStoppedProcesses: string[] = [];
    for (const [id, swSharedUtilProcess] of this.swMcpNpmServicesServerActiveProcesses) {
      swSharedUtilProcess.swMcpNpmServicesActiveProcessChild.kill('SIGTERM');
      swSharedUtilStoppedProcesses.push(id);
    }
    this.swMcpNpmServicesServerActiveProcesses.clear();

    return {
      content: [
        {
          type: 'text',
          text: `Stopped ${swSharedUtilStoppedProcesses.length} processes: ${swSharedUtilStoppedProcesses.join(', ')}`,
        },
      ],
    };
  }

  /**
   * List all available npm swSharedUtilScripts
   */
  private async swMcpNpmServicesServerListScripts(): Promise<any> {
    const swSharedUtilScripts = swSharedApiMcpNpmServicesServerDiscoverNpmScripts(
      this.swSharedApiMcpNpmServicesServerConfig.swMcpNpmServicesServerProjectRoot
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ availableScripts: swSharedUtilScripts }, null, 2),
        },
      ],
    };
  }

  /**
   * Start the MCP swSharedUtilServer
   */
  async swMcpNpmServicesServerStart(): Promise<void> {
    const swSharedUtilTransport = new StdioServerTransport();
    await this.swMcpNpmServicesServerInstance.connect(swSharedUtilTransport);
    console.error('SagasWeave NPM Services MCP Server running on stdio');
  }
}

/**
 * Main execution
 */
async function swSharedApiMcpNpmServicesServerMain(): Promise<void> {
  const swSharedApiMcpNpmServicesServerConfig: Partial<SwMcpNpmServicesServerConfig> = {
    swMcpNpmServicesServerProjectRoot:
      process.env.SW_MCP_NPM_SERVICES_PROJECT_ROOT || process.cwd(),
    swMcpNpmServicesServerMaxConcurrentProcesses: Number.parseInt(
      process.env.SW_MCP_NPM_SERVICES_MAX_CONCURRENT || '5'
    ),
    swMcpNpmServicesServerDefaultTimeout: Number.parseInt(
      process.env.SW_MCP_NPM_SERVICES_TIMEOUT || '60000'
    ),
  };

  const swSharedUtilServer = new SwSharedApiMcpNpmServicesServer(
    swSharedApiMcpNpmServicesServerConfig
  );
  await swSharedUtilServer.swMcpNpmServicesServerStart();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  swSharedApiMcpNpmServicesServerMain().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

export { SwSharedApiMcpNpmServicesServer };
export type { SwMcpNpmServicesExecutionResult, SwMcpNpmServicesServerConfig };
