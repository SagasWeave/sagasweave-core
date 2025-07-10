#!/bin/bash

# SagasWeave MCP Server Auto-Start Script
# This script automatically starts the MCP server in background if it's not running

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/mcp-server.pid"
LOG_FILE="$PROJECT_ROOT/mcp-server.log"

cd "$PROJECT_ROOT"

# Function to check if MCP server is running
check_mcp_status() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        return 0  # Running
    else
        return 1  # Not running
    fi
}

# Function to start MCP server in background
start_mcp_bg() {
    echo "Starting MCP server in background..."
    
    # Build first if needed
    if [ ! -f "scripts/mcp-services/mcp-npm-test-server/dist/index.js" ]; then
        echo "Building MCP server first..."
        npm run mcp:build
    fi
    
    # Start daemon in background
    nohup npm run mcp:start:bg > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    echo "MCP server started in background (PID: $!)."
    echo "Log file: $LOG_FILE"
    echo "Use 'npm run mcp:stop' to stop the server."
}

# Main logic
if check_mcp_status; then
    PID=$(cat "$PID_FILE")
    echo "MCP server is already running (PID: $PID)."
    echo "Use 'npm run mcp:status' to check status or 'npm run mcp:logs' to view logs."
else
    echo "MCP server is not running. Starting automatically..."
    start_mcp_bg
fi