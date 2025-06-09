#!/usr/bin/env node

/**
 * TickTick MCP Server Entry Point
 */

import { TickTickMCPServer } from './server.js';
import { TickTickClient } from './api/ticktick-client.js';
import { logger } from './utils/logger.js';

async function runAuth() {
  try {
    logger.info('Starting TickTick authentication...');
    const client = new TickTickClient();
    await client.authorize();
    logger.info('\nAuthentication completed successfully!');
    logger.info('You can now use the TickTick MCP server.');
    process.exit(0);
  } catch (error) {
    logger.error('Authentication failed:', error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('auth')) {
    await runAuth();
  } else {
    const server = new TickTickMCPServer();
    await server.start();
  }
}

main().catch((error) => {
  logger.error('Failed to start TickTick MCP Server:', error);
  process.exit(1);
});