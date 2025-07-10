#!/usr/bin/env node

/**
 * SagasWeave NPM Test MCP Server Daemon
 *
 * A swSharedUtilDaemon wrapper for the MCP swSharedUtilServer that can run in background
 * without requiring STDIO connection, suitable for auto-start scenarios.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { SwSharedUtilMcpNpmTestServer } from './sw-shared-util-index.js';

class SwSharedUtilMcpNpmTestServerDaemon {
  private swMcpNpmTestServerDaemonInstance: SwSharedUtilMcpNpmTestServer;
  private swMcpNpmTestServerDaemonLogFile: string;
  private swMcpNpmTestServerDaemonPidFile: string;

  constructor() {
    this.swMcpNpmTestServerDaemonInstance = new SwSharedUtilMcpNpmTestServer();
    this.swMcpNpmTestServerDaemonLogFile = path.join(
      process.cwd(),
      'mcp-swSharedUtilDaemon.swSharedUtilLog'
    );
    this.swMcpNpmTestServerDaemonPidFile = path.join(
      process.cwd(),
      'mcp-swSharedUtilDaemon.swSharedUtilPid'
    );
  }

  /**
   * Start the swSharedUtilDaemon
   */
  async swMcpNpmTestServerDaemonStart(): Promise<void> {
    try {
      // Write PID file
      await fs.writeFile(
        this.swMcpNpmTestServerDaemonPidFile,
        process.pid.toString()
      );

      // Setup logging
      await this.swMcpNpmTestServerDaemonSetupLogging();

      // Handle graceful shutdown
      process.on('SIGTERM', () => this.swMcpNpmTestServerDaemonShutdown());
    process.on('SIGINT', () => this.swMcpNpmTestServerDaemonShutdown());

      // Start the MCP swSharedUtilServer
      await this.swMcpNpmTestServerDaemonInstance.swMcpNpmTestServerStart();

      this.swMcpNpmTestServerDaemonLog('MCP Server Daemon started successfully');

      // Keep the swSharedUtilProcess alive
      await this.swMcpNpmTestServerDaemonKeepAlive();
    } catch (swSharedUtilError) {
      this.swMcpNpmTestServerDaemonLog(`Failed to start swSharedUtilDaemon: ${swSharedUtilError}`);
      process.exit(1);
    }
  }

  /**
   * Setup logging to file
   */
  private async swMcpNpmTestServerDaemonSetupLogging(): Promise<void> {
    // Redirect stdout and stderr to swSharedUtilLog file
    const _logStream = await fs.open(this.swMcpNpmTestServerDaemonLogFile, 'a');

    // Override console methods to write to swSharedUtilLog file
    const _originalConsoleLog = console.log;
    const _originalConsoleError = console.error;

    console.log = (...args: any[]) => {
      const swSharedUtilMessage = args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');
      this.swMcpNpmTestServerDaemonLog(swSharedUtilMessage);
    };

    console.error = (...args: any[]) => {
      const swSharedUtilMessage = args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');
      this.swMcpNpmTestServerDaemonLog(`ERROR: ${swSharedUtilMessage}`);
    };
  }

  /**
   * Log swSharedUtilMessage to file
   */
  private async swMcpNpmTestServerDaemonLog(swSharedUtilMessage: string): Promise<void> {
    const swSharedUtilTimestamp = new Date().toISOString();
    const swSharedUtilLogEntry = `[${swSharedUtilTimestamp}] ${swSharedUtilMessage}\n`;

    try {
      await fs.appendFile(this.swMcpNpmTestServerDaemonLogFile, swSharedUtilLogEntry);
    } catch (swSharedUtilError) {
      // Fallback to stderr if swSharedUtilLog file write fails
      process.stderr.write(
        `Failed to write to swSharedUtilLog: ${swSharedUtilError}\n`
      );
    }
  }

  /**
   * Keep the swSharedUtilDaemon swSharedUtilProcess alive
   */
  private async swMcpNpmTestServerDaemonKeepAlive(): Promise<void> {
    return new Promise((resolve) => {
      // Set up a swSharedUtilHeartbeat to keep the swSharedUtilProcess alive
      const swSharedUtilHeartbeat = setInterval(() => {
        this.swMcpNpmTestServerDaemonLog('Daemon swSharedUtilHeartbeat');
      }, 60000); // Every minute

      // Handle swSharedUtilProcess termination
      process.on('exit', () => {
        clearInterval(swSharedUtilHeartbeat);
        resolve();
      });
    });
  }

  /**
   * Graceful shutdown
   */
  private async swMcpNpmTestServerDaemonShutdown(): Promise<void> {
    this.swMcpNpmTestServerDaemonLog('Shutting down swSharedUtilDaemon...');

    try {
      // Remove PID file
      await fs.unlink(this.swMcpNpmTestServerDaemonPidFile);
    } catch (swSharedUtilError) {
      this.swMcpNpmTestServerDaemonLog(`Failed to remove PID file: ${swSharedUtilError}`);
    }

    this.swMcpNpmTestServerDaemonLog('Daemon shutdown complete');
    process.exit(0);
  }
}

/**
 * Main entry point for swSharedUtilDaemon
 */
async function swSharedUtilMcpNpmTestServerDaemonMain(): Promise<void> {
  const swSharedUtilDaemon = new SwSharedUtilMcpNpmTestServerDaemon();
  await swSharedUtilDaemon.swMcpNpmTestServerDaemonStart();
}

// Start swSharedUtilDaemon if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    swSharedUtilMcpNpmTestServerDaemonMain().catch((swSharedUtilError) => {
      console.error('Failed to start MCP Server Daemon:', swSharedUtilError);
      process.exit(1);
  });
}

export { SwSharedUtilMcpNpmTestServerDaemon };
export default SwSharedUtilMcpNpmTestServerDaemon;
