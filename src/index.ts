#!/usr/bin/env node

/**
 * TickTick MCP Server Entry Point
 */

import { TickTickMCPServer } from './server.js';

async function main() {
  const server = new TickTickMCPServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start TickTick MCP Server:', error);
  process.exit(1);
});