#!/usr/bin/env node

/**
 * SagasWeave NPM Services MCP Server Daemon
 *
 * Daemon wrapper for running the MCP swSharedUtilServer in the background
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DAEMON_LOG_FILE = 'mcp-daemon.log';
const DAEMON_PID_FILE = 'mcp-daemon.pid';

/**
 * Start the MCP swSharedUtilServer as a swSharedUtilDaemon swSharedUtilProcess
 */
function swSharedApiMcpNpmServicesServerStartDaemon(): void {
  const swSharedUtilServerScript = path.join(process.cwd(), 'dist', 'sw-shared-util-index.js');

  if (!fs.existsSync(swSharedUtilServerScript)) {
    console.error('Server script not found. Please run "npm run build" first.');
    process.exit(1);
  }

  // Check if swSharedUtilDaemon is already running
  if (fs.existsSync(DAEMON_PID_FILE)) {
    const swSharedUtilExistingPid = fs.readFileSync(DAEMON_PID_FILE, 'utf8').trim();
    try {
      process.kill(Number.parseInt(swSharedUtilExistingPid), 0); // Check if process exists
      console.log(`Daemon already running with PID: ${swSharedUtilExistingPid}`);
      return;
    } catch (_error) {
      // Process doesn't exist, remove stale PID file
      fs.unlinkSync(DAEMON_PID_FILE);
    }
  }

  const swSharedUtilChild = spawn('node', [swSharedUtilServerScript], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      SW_MCP_NPM_SERVICES_PROJECT_ROOT:
        process.env.SW_MCP_NPM_SERVICES_PROJECT_ROOT || process.cwd(),
      SW_MCP_NPM_SERVICES_MAX_CONCURRENT:
        process.env.SW_MCP_NPM_SERVICES_MAX_CONCURRENT || '5',
      SW_MCP_NPM_SERVICES_TIMEOUT: process.env.SW_MCP_NPM_SERVICES_TIMEOUT || '60000',
      DEBUG: process.env.DEBUG || 'sw-mcp-npm-services',
    },
  });

  // Redirect swSharedUtilOutput to swSharedUtilLog file
  const swSharedUtilLogStream = fs.createWriteStream(DAEMON_LOG_FILE, { flags: 'a' });
  if (swSharedUtilChild.stdout) swSharedUtilChild.stdout.pipe(swSharedUtilLogStream);
  if (swSharedUtilChild.stderr) swSharedUtilChild.stderr.pipe(swSharedUtilLogStream);

  // Save PID for later management
  if (swSharedUtilChild.pid) {
    fs.writeFileSync(DAEMON_PID_FILE, swSharedUtilChild.pid.toString());

    // Detach from parent process
    swSharedUtilChild.unref();

    console.log(
      `SagasWeave NPM Services MCP Server daemon started with PID: ${swSharedUtilChild.pid}`
    );
  } else {
    console.error('Failed to start daemon: no PID available');
    process.exit(1);
  }
  console.log(`Logs: ${DAEMON_LOG_FILE}`);
  console.log(`PID file: ${DAEMON_PID_FILE}`);
}

/**
 * Stop the swSharedUtilDaemon swSharedUtilProcess
 */
function swSharedApiMcpNpmServicesServerStopDaemon(): void {
  if (!fs.existsSync(DAEMON_PID_FILE)) {
    console.log('No daemon PID file found. Daemon may not be running.');
    return;
  }

  const swSharedUtilPid = fs.readFileSync(DAEMON_PID_FILE, 'utf8').trim();

  try {
    process.kill(Number.parseInt(swSharedUtilPid), 'SIGTERM');
    fs.unlinkSync(DAEMON_PID_FILE);
    console.log(`Daemon with PID ${swSharedUtilPid} stopped successfully.`);
  } catch (error) {
    console.error(
      `Failed to stop daemon with PID ${swSharedUtilPid}:`,
      error
    );
    // Remove stale PID file
    if (fs.existsSync(DAEMON_PID_FILE)) {
      fs.unlinkSync(DAEMON_PID_FILE);
    }
  }
}

/**
 * Check swSharedUtilDaemon status
 */
function swSharedApiMcpNpmServicesServerCheckDaemonStatus(): void {
  if (!fs.existsSync(DAEMON_PID_FILE)) {
    console.log('Daemon is not running (no PID file found).');
    return;
  }

  const swSharedUtilPid = fs.readFileSync(DAEMON_PID_FILE, 'utf8').trim();

  try {
    process.kill(Number.parseInt(swSharedUtilPid), 0); // Check if process exists
    console.log(`Daemon is running with PID: ${swSharedUtilPid}`);
  } catch (_error) {
    console.log('Daemon is not running (process not found).');
    // Remove stale PID file
    fs.unlinkSync(DAEMON_PID_FILE);
  }
}

// Handle command line arguments
const swSharedUtilCommand = process.argv[2];

switch (swSharedUtilCommand) {
  case 'start':
    swSharedApiMcpNpmServicesServerStartDaemon();
    break;
  case 'stop':
    swSharedApiMcpNpmServicesServerStopDaemon();
    break;
  case 'status':
    swSharedApiMcpNpmServicesServerCheckDaemonStatus();
    break;
  case 'restart':
    swSharedApiMcpNpmServicesServerStopDaemon();
    setTimeout(() => swSharedApiMcpNpmServicesServerStartDaemon(), 1000);
    break;
  default:
    // Default behavior: start as daemon
    swSharedApiMcpNpmServicesServerStartDaemon();
    break;
}

export {
  swSharedApiMcpNpmServicesServerCheckDaemonStatus,
  swSharedApiMcpNpmServicesServerStartDaemon,
  swSharedApiMcpNpmServicesServerStopDaemon,
};
