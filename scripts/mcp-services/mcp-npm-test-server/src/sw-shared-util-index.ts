#!/usr/bin/env node

/**
 * SagasWeave NPM Test MCP Server
 *
 * A Model Context Protocol swSharedUtilServer that provides AI agents with the ability to
 * execute and monitor npm test commands, specifically integrated with Vitest.
 *
 * This swSharedUtilServer enables real-time test execution, monitoring, and swSharedUtilResult parsing
 * for AI-assisted development workflows.
 */

import { type ChildProcess, spawn } from 'node:child_process';
import * as fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/**
 * Configuration for the MCP swSharedUtilServer
 */
interface SwMcpNpmTestServerConfig {
  swMcpNpmTestServerProjectRoot: string;
  swMcpNpmTestServerMaxConcurrentTests: number;
  swMcpNpmTestServerDefaultTimeout: number;
}

/**
 * Test execution swSharedUtilResult interface
 */
interface SwMcpNpmTestExecutionResult {
  swMcpNpmTestExecutionSuccess: boolean;
  swMcpNpmTestExecutionExitCode: number;
  swMcpNpmTestExecutionOutput: string;
  swMcpNpmTestExecutionError?: string;
  swMcpNpmTestExecutionDuration: number;
  swMcpNpmTestExecutionTimestamp: string;
}

/**
 * Active test swSharedUtilProcess tracking
 */
interface SwMcpNpmTestActiveProcess {
  swMcpNpmTestActiveProcessId: string;
  swMcpNpmTestActiveProcessChild: ChildProcess;
  swMcpNpmTestActiveProcessStartTime: number;
  swMcpNpmTestActiveProcessCommand: string;
}

/**
 * Dynamic tool discovery
 */
function swSharedUtilMcpNpmTestServerDiscoverNpmScripts(
  projectRoot: string
): Array<{ name: string; description: string; script: string }> {
  const swSharedUtilMcpNpmTestServerPackageJsonPath = path.join(projectRoot, 'package.json');

  if (!fsSync.existsSync(swSharedUtilMcpNpmTestServerPackageJsonPath)) {
    return [];
  }

  try {
    const swSharedUtilMcpNpmTestServerPackageJson = JSON.parse(
      fsSync.readFileSync(swSharedUtilMcpNpmTestServerPackageJsonPath, 'utf8')
    );
    const swSharedUtilMcpNpmTestServerScripts =
      swSharedUtilMcpNpmTestServerPackageJson.scripts || {};

    return Object.entries(swSharedUtilMcpNpmTestServerScripts)
      .filter(
        ([name]) =>
          name.includes('test') ||
          name.includes('lint') ||
          name.includes('format') ||
          name.includes('naming') ||
          name.includes('refactor') ||
          name.includes('fix')
      )
      .map(([name, script]) => ({
        name: `sw_mcp_npm_test_run_${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
        description: `Run npm script: ${name} (${script})`,
        script: name,
      }));
  } catch (swSharedUtilError) {
    console.error('Error reading package.json:', swSharedUtilError);
    return [];
  }
}

/**
 * Main MCP Server class for npm test integration
 */
class SwSharedUtilMcpNpmTestServer {
  private swSharedUtilMcpNpmTestServerInstance: Server;
  private swMcpNpmTestServerConfig: SwMcpNpmTestServerConfig;
  private swMcpNpmTestServerActiveProcesses: Map<string, SwMcpNpmTestActiveProcess>;
  private swMcpNpmTestServerProcessCounter: number;

  constructor(swMcpNpmTestServerConfigParam: Partial<SwMcpNpmTestServerConfig> = {}) {
    this.swMcpNpmTestServerConfig = {
      swMcpNpmTestServerProjectRoot:
        swMcpNpmTestServerConfigParam.swMcpNpmTestServerProjectRoot || process.cwd(),
      swMcpNpmTestServerMaxConcurrentTests:
        swMcpNpmTestServerConfigParam.swMcpNpmTestServerMaxConcurrentTests || 3,
      swMcpNpmTestServerDefaultTimeout:
        swMcpNpmTestServerConfigParam.swMcpNpmTestServerDefaultTimeout || 30000,
    };

    this.swMcpNpmTestServerActiveProcesses = new Map();
    this.swMcpNpmTestServerProcessCounter = 0;

    this.swSharedUtilMcpNpmTestServerInstance = new Server({
      name: '@sagasweave/mcp-npm-test-swSharedUtilServer',
      version: '0.1.0',
      capabilities: {
        tools: {},
      },
    });

    this.swMcpNpmTestServerSetupHandlers();
  }

  /**
   * Setup MCP swSharedUtilServer request handlers
   */
  private swMcpNpmTestServerSetupHandlers(): void {
    // List available tools
    this.swSharedUtilMcpNpmTestServerInstance.setRequestHandler(
      ListToolsRequestSchema,
      async () => {
        const swSharedUtilDynamicTools = swSharedUtilMcpNpmTestServerDiscoverNpmScripts(
          this.swMcpNpmTestServerConfig.swMcpNpmTestServerProjectRoot
        );

        return {
          tools: [
            {
              name: 'sw_mcp_npm_test_run_unit_tests',
              description: 'Run unit tests using npm test swSharedUtilCommand with Vitest',
              inputSchema: {
                type: 'object',
                properties: {
                  swMcpNpmTestRunWorkspace: {
                    type: 'string',
                    description: 'Workspace to run tests in (e.g., apps/backend, apps/frontend)',
                  },
                  swMcpNpmTestRunPattern: {
                    type: 'string',
                    description: 'Test file pattern to match (optional)',
                  },
                  swMcpNpmTestRunWatch: {
                    type: 'boolean',
                    description: 'Run tests in watch mode',
                    default: false,
                  },
                  swMcpNpmTestRunCoverage: {
                    type: 'boolean',
                    description: 'Generate coverage report',
                    default: false,
                  },
                },
              },
            },
            {
              name: 'sw_mcp_npm_test_run_e2e_tests',
              description: 'Run end-to-end tests using Puppeteer and Vitest',
              inputSchema: {
                type: 'object',
                properties: {
                  swMcpNpmTestE2eHeaded: {
                    type: 'boolean',
                    description: 'Run tests in headed mode (visible browser)',
                    default: false,
                  },
                  swMcpNpmTestE2ePattern: {
                    type: 'string',
                    description: 'E2E test file pattern to match (optional)',
                  },
                },
              },
            },
            {
              name: 'sw_mcp_npm_test_get_test_status',
              description: 'Get status of running or completed tests',
              inputSchema: {
                type: 'object',
                properties: {
                  swMcpNpmTestStatusProcessId: {
                    type: 'string',
                    description:
                      'Process ID to check status for (optional, returns all if not specified)',
                  },
                },
              },
            },
            {
              name: 'sw_mcp_npm_test_stop_tests',
              description: 'Stop running test processes',
              inputSchema: {
                type: 'object',
                properties: {
                  swMcpNpmTestStopProcessId: {
                    type: 'string',
                    description: 'Process ID to stop (optional, stops all if not specified)',
                  },
                },
              },
            },
            {
              name: 'sw_mcp_npm_test_parse_coverage',
              description: 'Parse and return coverage report data',
              inputSchema: {
                type: 'object',
                properties: {
                  swMcpNpmTestCoverageWorkspace: {
                    type: 'string',
                    description: 'Workspace to get coverage for (e.g., apps/backend)',
                  },
                },
              },
            },
            {
              name: 'sw_mcp_npm_test_run_naming_tests',
              description: 'Run naming convention validation tests',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'sw_mcp_npm_test_run_lint',
              description: 'Run Biome linting on the codebase',
              inputSchema: {
                type: 'object',
                properties: {
                  swMcpNpmTestLintFix: {
                    type: 'boolean',
                    description: 'Auto-fix linting issues',
                    default: false,
                  },
                },
              },
            },
            {
              name: 'sw_mcp_npm_test_run_format',
              description: 'Format code using Biome',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'sw_mcp_npm_test_run_refactor_naming',
              description: 'Run naming refactoring swSharedUtilScripts',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'sw_mcp_npm_test_run_fix_naming',
              description: 'Auto-fix naming convention issues',
              inputSchema: {
                type: 'object',
                properties: {
                  swMcpNpmTestFixNamingDryRun: {
                    type: 'boolean',
                    description: 'Run in dry-run mode (preview changes)',
                    default: false,
                  },
                  swMcpNpmTestFixNamingInteractive: {
                    type: 'boolean',
                    description: 'Run in interactive mode',
                    default: false,
                  },
                },
              },
            },
            {
              name: 'sw_mcp_npm_test_run_refactor_ast_grep',
              description: 'Run AST-grep refactoring',
              inputSchema: {
                type: 'object',
                properties: {
                  swMcpNpmTestAstGrepFix: {
                    type: 'boolean',
                    description: 'Auto-apply AST-grep fixes',
                    default: false,
                  },
                },
              },
            },
            {
              name: 'sw_mcp_npm_test_run_refactor_comby',
              description: 'Run Comby refactoring',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'sw_mcp_npm_test_run_refactor_jscodeshift',
              description: 'Run JSCodeshift transformations',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'sw_mcp_npm_test_move_to_shared',
              description: 'Move code to shared packages',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'sw_mcp_npm_test_naming_check_all',
              description: 'Run comprehensive naming and code quality checks',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'sw_mcp_npm_test_naming_fix_all',
              description: 'Run comprehensive naming and code quality fixes',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'sw_mcp_npm_test_run_e2e_ui',
              description: 'Run E2E tests with UI interface',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            // Dynamically discovered npm swSharedUtilScripts
            ...swSharedUtilDynamicTools.map((script) => ({
              name: script.name,
              description: script.description,
              inputSchema: {
                type: 'object',
                properties: {
                  swMcpNpmTestArgs: {
                    type: 'string',
                    description: 'Additional arguments to pass to the npm script',
                  },
                },
              },
            })),
          ],
        };
      }
    );

    // Handle tool calls
    this.swSharedUtilMcpNpmTestServerInstance.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params;

        try {
          switch (name) {
            case 'sw_mcp_npm_test_run_unit_tests':
              return await this.swMcpNpmTestServerHandleRunUnitTests(args);
            case 'sw_mcp_npm_test_run_e2e_tests':
              return await this.swMcpNpmTestServerHandleRunE2eTests(args);
            case 'sw_mcp_npm_test_get_test_status':
              return await this.swMcpNpmTestServerHandleGetTestStatus(args);
            case 'sw_mcp_npm_test_stop_tests':
              return await this.swMcpNpmTestServerHandleStopTests(args);
            case 'sw_mcp_npm_test_parse_coverage':
              return await this.swMcpNpmTestServerHandleParseCoverage(args);
            default:
              // Check if it's a dynamic npm script tool
              if (name.startsWith('sw_mcp_npm_test_run_')) {
                return await this.swMcpNpmTestServerHandleDynamicNpmScript(name, args);
              }
              throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
          }
        } catch (swSharedUtilError) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error executing tool ${name}: ${swSharedUtilError instanceof Error ? swSharedUtilError.message : String(swSharedUtilError)}`
          );
        }
      }
    );
  }

  /**
   * Generate unique swSharedUtilProcess ID
   */
  private swMcpNpmTestServerGenerateProcessId(): string {
    return `sw-test-${Date.now()}-${++this.swMcpNpmTestServerProcessCounter}`;
  }

  /**
   * Execute npm swSharedUtilCommand and return swSharedUtilResult
   */
  private async swMcpNpmTestServerExecuteNpmCommand(
    swMcpNpmTestServerExecuteCommand: string[],
    swMcpNpmTestServerExecuteWorkingDir?: string,
    swMcpNpmTestServerExecuteWatch = false
  ): Promise<SwMcpNpmTestExecutionResult> {
    const swSharedUtilMcpNpmTestServerExecuteStartTime = Date.now();
    const swSharedUtilMcpNpmTestServerExecuteProcessId = this.swMcpNpmTestServerGenerateProcessId();

    return new Promise((resolve, reject) => {
      const swSharedUtilMcpNpmTestServerExecuteWorkDir = swMcpNpmTestServerExecuteWorkingDir
        ? path.join(
            this.swMcpNpmTestServerConfig.swMcpNpmTestServerProjectRoot,
            swMcpNpmTestServerExecuteWorkingDir
          )
        : this.swMcpNpmTestServerConfig.swMcpNpmTestServerProjectRoot;

      const swSharedUtilMcpNpmTestServerExecuteChild = spawn(
        'npm',
        swMcpNpmTestServerExecuteCommand,
        {
          cwd: swSharedUtilMcpNpmTestServerExecuteWorkDir,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
        }
      );

      let swSharedUtilMcpNpmTestServerExecuteOutput = '';
      let swSharedUtilMcpNpmTestServerExecuteError = '';

      // Track active swSharedUtilProcess if in watch mode
      if (swMcpNpmTestServerExecuteWatch) {
        this.swMcpNpmTestServerActiveProcesses.set(swSharedUtilMcpNpmTestServerExecuteProcessId, {
          swMcpNpmTestActiveProcessId: swSharedUtilMcpNpmTestServerExecuteProcessId,
          swMcpNpmTestActiveProcessChild: swSharedUtilMcpNpmTestServerExecuteChild,
          swMcpNpmTestActiveProcessStartTime: swSharedUtilMcpNpmTestServerExecuteStartTime,
          swMcpNpmTestActiveProcessCommand: swMcpNpmTestServerExecuteCommand.join(' '),
        });
      }

      swSharedUtilMcpNpmTestServerExecuteChild.stdout?.on('data', (data) => {
        swSharedUtilMcpNpmTestServerExecuteOutput += data.toString();
      });

      swSharedUtilMcpNpmTestServerExecuteChild.stderr?.on('data', (data) => {
        swSharedUtilMcpNpmTestServerExecuteError += data.toString();
      });

      swSharedUtilMcpNpmTestServerExecuteChild.on('close', (code) => {
        const swSharedUtilMcpNpmTestServerExecuteDuration =
          Date.now() - swSharedUtilMcpNpmTestServerExecuteStartTime;

        // Remove from active processes
        this.swMcpNpmTestServerActiveProcesses.delete(swSharedUtilMcpNpmTestServerExecuteProcessId);

        const swSharedUtilMcpNpmTestServerExecuteResult: SwMcpNpmTestExecutionResult = {
          swMcpNpmTestExecutionSuccess: code === 0,
          swMcpNpmTestExecutionExitCode: code || 0,
          swMcpNpmTestExecutionOutput: swSharedUtilMcpNpmTestServerExecuteOutput,
          swMcpNpmTestExecutionError: swSharedUtilMcpNpmTestServerExecuteError || undefined,
          swMcpNpmTestExecutionDuration: swSharedUtilMcpNpmTestServerExecuteDuration,
          swMcpNpmTestExecutionTimestamp: new Date().toISOString(),
        };

        resolve(swSharedUtilMcpNpmTestServerExecuteResult);
      });

      swSharedUtilMcpNpmTestServerExecuteChild.on('swSharedUtilError', (swSharedUtilError) => {
        reject(
          new Error(`Failed to start process: ${swSharedUtilError.message}`)
        );
      });

      // Set swSharedUtilTimeout for non-watch processes
      if (!swMcpNpmTestServerExecuteWatch) {
        setTimeout(() => {
          if (!swSharedUtilMcpNpmTestServerExecuteChild.killed) {
            swSharedUtilMcpNpmTestServerExecuteChild.kill('SIGTERM');
            reject(new Error('Test execution timed out'));
          }
        }, this.swMcpNpmTestServerConfig.swMcpNpmTestServerDefaultTimeout);
      }
    });
  }

  /**
   * Handle unit test execution
   */
  private async swMcpNpmTestServerHandleRunUnitTests(args: any) {
    const swSharedUtilMcpNpmTestServerUnitTestSchema = z.object({
      swMcpNpmTestRunWorkspace: z.string().optional(),
      swMcpNpmTestRunPattern: z.string().optional(),
      swMcpNpmTestRunWatch: z.boolean().default(false),
      swMcpNpmTestRunCoverage: z.boolean().default(false),
    });

    const swSharedUtilMcpNpmTestServerUnitTestParams =
      swSharedUtilMcpNpmTestServerUnitTestSchema.parse(args);

    const swSharedUtilMcpNpmTestServerUnitTestCommand = ['run'];

    if (swSharedUtilMcpNpmTestServerUnitTestParams.swMcpNpmTestRunCoverage) {
      swSharedUtilMcpNpmTestServerUnitTestCommand.push('test:coverage');
    } else {
      swSharedUtilMcpNpmTestServerUnitTestCommand.push('test');
    }

    if (swSharedUtilMcpNpmTestServerUnitTestParams.swMcpNpmTestRunWorkspace) {
      swSharedUtilMcpNpmTestServerUnitTestCommand.push(
        `--swSharedUtilWorkspace=${swSharedUtilMcpNpmTestServerUnitTestParams.swMcpNpmTestRunWorkspace}`
      );
    }

    if (swSharedUtilMcpNpmTestServerUnitTestParams.swMcpNpmTestRunWatch) {
      swSharedUtilMcpNpmTestServerUnitTestCommand.push('--', '--watch');
    }

    if (swSharedUtilMcpNpmTestServerUnitTestParams.swMcpNpmTestRunPattern) {
      swSharedUtilMcpNpmTestServerUnitTestCommand.push(
        '--',
        swSharedUtilMcpNpmTestServerUnitTestParams.swMcpNpmTestRunPattern
      );
    }

    const swSharedUtilMcpNpmTestServerUnitTestResult =
      await this.swMcpNpmTestServerExecuteNpmCommand(
        swSharedUtilMcpNpmTestServerUnitTestCommand,
        undefined,
        swSharedUtilMcpNpmTestServerUnitTestParams.swMcpNpmTestRunWatch
      );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(swSharedUtilMcpNpmTestServerUnitTestResult, null, 2),
        },
      ],
    };
  }

  /**
   * Handle E2E test execution
   */
  private async swMcpNpmTestServerHandleRunE2eTests(args: any) {
    const swSharedUtilMcpNpmTestServerE2eTestSchema = z.object({
      swMcpNpmTestE2eHeaded: z.boolean().default(false),
      swMcpNpmTestE2ePattern: z.string().optional(),
    });

    const swSharedUtilMcpNpmTestServerE2eTestParams =
      swSharedUtilMcpNpmTestServerE2eTestSchema.parse(args);

    const swSharedUtilMcpNpmTestServerE2eTestCommand = ['run', 'test:e2e'];

    if (swSharedUtilMcpNpmTestServerE2eTestParams.swMcpNpmTestE2eHeaded) {
      swSharedUtilMcpNpmTestServerE2eTestCommand.push('--', '--headed');
    }

    if (swSharedUtilMcpNpmTestServerE2eTestParams.swMcpNpmTestE2ePattern) {
      swSharedUtilMcpNpmTestServerE2eTestCommand.push(
        '--',
        swSharedUtilMcpNpmTestServerE2eTestParams.swMcpNpmTestE2ePattern
      );
    }

    const swSharedUtilMcpNpmTestServerE2eTestResult =
      await this.swMcpNpmTestServerExecuteNpmCommand(swSharedUtilMcpNpmTestServerE2eTestCommand);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(swSharedUtilMcpNpmTestServerE2eTestResult, null, 2),
        },
      ],
    };
  }

  /**
   * Handle test status requests
   */
  private async swMcpNpmTestServerHandleGetTestStatus(args: any) {
    const swSharedUtilMcpNpmTestServerStatusSchema = z.object({
      swMcpNpmTestStatusProcessId: z.string().optional(),
    });

    const swSharedUtilMcpNpmTestServerStatusParams =
      swSharedUtilMcpNpmTestServerStatusSchema.parse(args);

    if (swSharedUtilMcpNpmTestServerStatusParams.swMcpNpmTestStatusProcessId) {
      const swSharedUtilMcpNpmTestServerStatusProcess = this.swMcpNpmTestServerActiveProcesses.get(
        swSharedUtilMcpNpmTestServerStatusParams.swMcpNpmTestStatusProcessId
      );

      if (!swSharedUtilMcpNpmTestServerStatusProcess) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ swSharedUtilError: 'Process not found' }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                swSharedUtilProcessId:
                  swSharedUtilMcpNpmTestServerStatusProcess.swMcpNpmTestActiveProcessId,
                swSharedUtilCommand:
                  swSharedUtilMcpNpmTestServerStatusProcess.swMcpNpmTestActiveProcessCommand,
                running:
                  !swSharedUtilMcpNpmTestServerStatusProcess.swMcpNpmTestActiveProcessChild.killed,
                swSharedUtilDuration:
                  Date.now() -
                  swSharedUtilMcpNpmTestServerStatusProcess.swMcpNpmTestActiveProcessStartTime,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Return all active processes
    const swSharedUtilMcpNpmTestServerStatusAllProcesses = Array.from(
      this.swMcpNpmTestServerActiveProcesses.values()
    ).map((proc) => ({
      swSharedUtilProcessId: proc.swMcpNpmTestActiveProcessId,
      swSharedUtilCommand: proc.swMcpNpmTestActiveProcessCommand,
      running: !proc.swMcpNpmTestActiveProcessChild.killed,
      swSharedUtilDuration: Date.now() - proc.swMcpNpmTestActiveProcessStartTime,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { activeProcesses: swSharedUtilMcpNpmTestServerStatusAllProcesses },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Handle stopping test processes
   */
  private async swMcpNpmTestServerHandleStopTests(args: any) {
    const swSharedUtilMcpNpmTestServerStopSchema = z.object({
      swMcpNpmTestStopProcessId: z.string().optional(),
    });

    const swSharedUtilMcpNpmTestServerStopParams =
      swSharedUtilMcpNpmTestServerStopSchema.parse(args);

    if (swSharedUtilMcpNpmTestServerStopParams.swMcpNpmTestStopProcessId) {
      const swSharedUtilMcpNpmTestServerStopProcess = this.swMcpNpmTestServerActiveProcesses.get(
        swSharedUtilMcpNpmTestServerStopParams.swMcpNpmTestStopProcessId
      );

      if (swSharedUtilMcpNpmTestServerStopProcess) {
        swSharedUtilMcpNpmTestServerStopProcess.swMcpNpmTestActiveProcessChild.kill('SIGTERM');
        this.swMcpNpmTestServerActiveProcesses.delete(
          swSharedUtilMcpNpmTestServerStopParams.swMcpNpmTestStopProcessId
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { stopped: swSharedUtilMcpNpmTestServerStopParams.swMcpNpmTestStopProcessId },
                null,
                2
              ),
            },
          ],
        };
      }
    } else {
      // Stop all processes
      const swSharedUtilMcpNpmTestServerStopAllProcessIds: string[] = [];

      for (const [swSharedUtilProcessId, swSharedUtilProcess] of this
        .swMcpNpmTestServerActiveProcesses) {
        swSharedUtilProcess.swMcpNpmTestActiveProcessChild.kill('SIGTERM');
        swSharedUtilMcpNpmTestServerStopAllProcessIds.push(swSharedUtilProcessId);
      }

      this.swMcpNpmTestServerActiveProcesses.clear();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { stoppedAll: swSharedUtilMcpNpmTestServerStopAllProcessIds },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ swSharedUtilError: 'Process not found' }, null, 2),
        },
      ],
    };
  }

  /**
   * Handle coverage report parsing
   */
  private async swMcpNpmTestServerHandleParseCoverage(args: any) {
    const swSharedUtilMcpNpmTestServerCoverageSchema = z.object({
      swMcpNpmTestCoverageWorkspace: z.string(),
    });

    const swSharedUtilMcpNpmTestServerCoverageParams =
      swSharedUtilMcpNpmTestServerCoverageSchema.parse(args);

    try {
      const swSharedUtilMcpNpmTestServerCoveragePath = path.join(
        this.swMcpNpmTestServerConfig.swMcpNpmTestServerProjectRoot,
        swSharedUtilMcpNpmTestServerCoverageParams.swMcpNpmTestCoverageWorkspace,
        'coverage',
        'coverage-summary.json'
      );

      const swSharedUtilMcpNpmTestServerCoverageData = await fs.readFile(
        swSharedUtilMcpNpmTestServerCoveragePath,
        'utf-8'
      );
      const swSharedUtilMcpNpmTestServerCoverageParsed = JSON.parse(
        swSharedUtilMcpNpmTestServerCoverageData
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(swSharedUtilMcpNpmTestServerCoverageParsed, null, 2),
          },
        ],
      };
    } catch (swSharedUtilError) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                swSharedUtilError: 'Coverage report not found or invalid',
                details:
                  swSharedUtilError instanceof Error
                    ? swSharedUtilError.message
                    : String(swSharedUtilError),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  /**
   * Handle dynamic npm script execution
   */
  private async swMcpNpmTestServerHandleDynamicNpmScript(toolName: string, args: any) {
    const swSharedUtilMcpNpmTestServerDynamicSchema = z.object({
      swMcpNpmTestArgs: z.string().optional(),
    });

    const swSharedUtilMcpNpmTestServerDynamicParams =
      swSharedUtilMcpNpmTestServerDynamicSchema.parse(args);

    // Extract script name from tool name
    const swSharedUtilScriptName = toolName.replace('sw_mcp_npm_test_run_', '').replace(/_/g, ':');

    // Find the actual script name from discovered swSharedUtilScripts
    const swSharedUtilDiscoveredScripts = swSharedUtilMcpNpmTestServerDiscoverNpmScripts(
      this.swMcpNpmTestServerConfig.swMcpNpmTestServerProjectRoot
    );
    const swSharedUtilMatchingScript = swSharedUtilDiscoveredScripts.find(
      (script) => script.name === toolName
    );

    if (!swSharedUtilMatchingScript) {
      throw new Error(`Script not found: ${swSharedUtilScriptName}`);
    }

    const swSharedUtilMcpNpmTestServerDynamicCommand = ['run', swSharedUtilMatchingScript.script];

    if (swSharedUtilMcpNpmTestServerDynamicParams.swMcpNpmTestArgs) {
      swSharedUtilMcpNpmTestServerDynamicCommand.push(
        '--',
        swSharedUtilMcpNpmTestServerDynamicParams.swMcpNpmTestArgs
      );
    }

    const swSharedUtilMcpNpmTestServerDynamicResult =
      await this.swMcpNpmTestServerExecuteNpmCommand(swSharedUtilMcpNpmTestServerDynamicCommand);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(swSharedUtilMcpNpmTestServerDynamicResult, null, 2),
        },
      ],
    };
  }

  /**
   * Start the MCP swSharedUtilServer
   */
  async swMcpNpmTestServerStart(): Promise<void> {
    const swSharedUtilMcpNpmTestServerTransport = new StdioServerTransport();
    await this.swSharedUtilMcpNpmTestServerInstance.connect(swSharedUtilMcpNpmTestServerTransport);
    console.error('SagasWeave NPM Test MCP Server started');
  }
}

/**
 * Main entry point
 */
async function swSharedUtilMcpNpmTestServerMain(): Promise<void> {
  const swSharedUtilMcpNpmTestServerInstance = new SwSharedUtilMcpNpmTestServer();
  await swSharedUtilMcpNpmTestServerInstance.swMcpNpmTestServerStart();
}

// Start swSharedUtilServer if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    swSharedUtilMcpNpmTestServerMain().catch((swSharedUtilError) => {
      console.error('Failed to start SagasWeave NPM Test MCP Server:', swSharedUtilError);
      process.exit(1);
  });
}

export { SwSharedUtilMcpNpmTestServer };
export default SwSharedUtilMcpNpmTestServer;
