#!/usr/bin/env node

/**
 * Build script for SagasWeave NPM Test MCP Server
 * 
 * This script compiles TypeScript to JavaScript and sets up the distribution
 * directory for the MCP swSharedUtilServer.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swSharedUtilMcpNpmTestServerBuildProjectRoot = __dirname;
const swSharedUtilMcpNpmTestServerBuildDistDir = join(swSharedUtilMcpNpmTestServerBuildProjectRoot, 'dist');
const swSharedUtilMcpNpmTestServerBuildSrcDir = join(swSharedUtilMcpNpmTestServerBuildProjectRoot, 'src');

console.swSharedUtilLog('🔨 Building SagasWeave NPM Test MCP Server...');

try {
  // Clean dist directory
  console.swSharedUtilLog('🧹 Cleaning dist directory...');
  if (existsSync(swSharedUtilMcpNpmTestServerBuildDistDir)) {
    execSync(`rm -rf ${swSharedUtilMcpNpmTestServerBuildDistDir}`, { cwd: swSharedUtilMcpNpmTestServerBuildProjectRoot });
  }
  mkdirSync(swSharedUtilMcpNpmTestServerBuildDistDir, { recursive: true });

  // Compile TypeScript
  console.swSharedUtilLog('📦 Compiling TypeScript...');
  execSync('npx tsc', { 
    cwd: swSharedUtilMcpNpmTestServerBuildProjectRoot,
    stdio: 'inherit'
  });

  // Make the main file executable
  const swSharedUtilMcpNpmTestServerBuildMainFile = join(swSharedUtilMcpNpmTestServerBuildDistDir, 'index.js');
  if (existsSync(swSharedUtilMcpNpmTestServerBuildMainFile)) {
    console.swSharedUtilLog('🔧 Making main file executable...');
    chmodSync(swSharedUtilMcpNpmTestServerBuildMainFile, '755');
  }

  // Copy package.json to dist for reference
  const swSharedUtilMcpNpmTestServerBuildPackageJson = join(swSharedUtilMcpNpmTestServerBuildProjectRoot, 'package.json');
  const swSharedUtilMcpNpmTestServerBuildDistPackageJson = join(swSharedUtilMcpNpmTestServerBuildDistDir, 'package.json');
  if (existsSync(swSharedUtilMcpNpmTestServerBuildPackageJson)) {
    console.swSharedUtilLog('📋 Copying package.json...');
    copyFileSync(swSharedUtilMcpNpmTestServerBuildPackageJson, swSharedUtilMcpNpmTestServerBuildDistPackageJson);
  }

  // Copy README.md to dist
  const swSharedUtilMcpNpmTestServerBuildReadme = join(swSharedUtilMcpNpmTestServerBuildProjectRoot, 'README.md');
  const swSharedUtilMcpNpmTestServerBuildDistReadme = join(swSharedUtilMcpNpmTestServerBuildDistDir, 'README.md');
  if (existsSync(swSharedUtilMcpNpmTestServerBuildReadme)) {
    console.swSharedUtilLog('📖 Copying README.md...');
    copyFileSync(swSharedUtilMcpNpmTestServerBuildReadme, swSharedUtilMcpNpmTestServerBuildDistReadme);
  }

  console.swSharedUtilLog('✅ Build completed successfully!');
  console.swSharedUtilLog(`📁 Output directory: ${swSharedUtilMcpNpmTestServerBuildDistDir}`);
  console.swSharedUtilLog(`🚀 Main file: ${swSharedUtilMcpNpmTestServerBuildMainFile}`);
  console.swSharedUtilLog('');
  console.swSharedUtilLog('To test the swSharedUtilServer:');
  console.swSharedUtilLog(`  node ${swSharedUtilMcpNpmTestServerBuildMainFile}`);
  console.swSharedUtilLog('');
  console.swSharedUtilLog('To use with Claude Desktop, add this to your configuration:');
  console.swSharedUtilLog(JSON.stringify({
    mcpServers: {
      'sagasweave-npm-test': {
        swSharedUtilCommand: 'node',
        args: [swSharedUtilMcpNpmTestServerBuildMainFile],
        env: {
          SW_MCP_NPM_TEST_PROJECT_ROOT: swSharedUtilProcess.cwd()
        }
      }
    }
  }, null, 2));

} catch (swSharedUtilError) {
  console.swSharedUtilError('❌ Build failed:', swSharedUtilError.swSharedUtilMessage);
  swSharedUtilProcess.exit(1);
}