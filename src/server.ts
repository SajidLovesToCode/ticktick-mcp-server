/**
 * TickTick MCP Server Implementation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TickTickClient } from './api/ticktick-client.js';
import { ToolsManager } from './tools/index.js';
import { logger } from './utils/logger.js';
import { ConfigurationError, AuthenticationError } from './utils/errors.js';
import express from 'express';
import cors from 'cors';
import {SSEServerTransport} from '@modelcontextprotocol/sdk/server/sse.js';
export class TickTickMCPServer {
  private server: Server;
  private ticktickClient?: TickTickClient;
  private toolsManager?: ToolsManager;

  constructor() {
    this.server = new Server(
      {
        name: 'ticktick-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private async initializeTickTickClient(): Promise<void> {
    try {
      this.ticktickClient = new TickTickClient();
      logger.info('TickTick client created successfully');
      
      await this.ticktickClient.initialize();
      this.toolsManager = new ToolsManager(this.ticktickClient);
      logger.info('TickTick client initialized successfully');
    } catch (error) {
      // Always create the client even if initialization fails
      // This allows auth tools to work
      if (!this.ticktickClient) {
        try {
          this.ticktickClient = new TickTickClient();
          logger.info('Created TickTick client without initialization');
        } catch (configError) {
          logger.error('Failed to create TickTick client - configuration error:', configError);
          if (configError instanceof ConfigurationError) {
            logger.error('Configuration Error:', configError.message);
            logger.error('Please check:');
            logger.error('1. Your ticktick-oauth.keys.json file exists');
            logger.error('2. Environment variables TICKTICK_CLIENT_ID and TICKTICK_CLIENT_SECRET are set');
            logger.error('3. Run "npm run start auth" to authenticate first');
          }
          throw configError;
        }
      }
      
      if (error instanceof ConfigurationError) {
        logger.warn('Configuration error - authentication not yet completed');
        logger.warn('No valid authentication token found.');
        logger.warn('Please run "npm run start auth" to authenticate first.');
        // Don't throw - let auth tools handle it
      } else if (error instanceof AuthenticationError) {
        logger.warn('Authentication required - no valid token found');
        logger.warn('Authentication required.');
        logger.warn('Please run "npm run start auth" to authenticate first.');
        // We'll handle this gracefully - tools will guide user to authenticate
      } else {
        logger.error('Failed to initialize TickTick client - unexpected error:', error);
        logger.error('Unexpected error during initialization:', error);
        throw error;
      }
      
      // Always create ToolsManager even if authentication fails
      // This allows tools to return proper error messages
      if (this.ticktickClient && !this.toolsManager) {
        this.toolsManager = new ToolsManager(this.ticktickClient);
        logger.info('Created ToolsManager for non-authenticated client');
      }
    }
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const baseTools = [
        {
          name: 'ticktick_auth_status',
          description: 'Check TickTick authentication status',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'ticktick_authorize',
          description: 'Start TickTick OAuth authorization flow',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'ticktick_logout',
          description: 'Logout from TickTick and clear stored tokens',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'ticktick_health_check',
          description: 'Check TickTick API connection health',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ];

      // Add task and project tools if available
      const additionalTools = this.toolsManager ? this.toolsManager.getAllToolDefinitions() : [];

      return {
        tools: [...baseTools, ...additionalTools],
      };
    });

    // Resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [],
      };
    });


    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ticktick_auth_status':
            return await this.handleAuthStatus();
          
          case 'ticktick_authorize':
            return await this.handleAuthorize();
          
          case 'ticktick_logout':
            return await this.handleLogout();
          
          case 'ticktick_health_check':
            return await this.handleHealthCheck();

          default:
            // Try to handle with ToolsManager
            if (this.toolsManager) {
              try {
                return await this.toolsManager.handleToolCall(name, args);
              } catch (toolError) {
                // If tool manager can't handle it, fall through to unknown tool error
              }
            }
            
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        logger.error(`Tool execution failed for ${name}:`, error);
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleAuthStatus(): Promise<any> {
    if (!this.ticktickClient) {
      return {
        content: [
          {
            type: 'text',
            text: 'TickTick client not initialized. Please check configuration.',
          },
        ],
      };
    }

    const status = await this.ticktickClient.getAuthenticationStatus();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            authenticated: status.isAuthenticated,
            tokenExists: status.tokenExists,
            tokenValid: status.tokenValid,
            expiresAt: status.expiresAt,
          }, null, 2),
        },
      ],
    };
  }

  private async handleAuthorize(): Promise<any> {
    if (!this.ticktickClient) {
      throw new McpError(
        ErrorCode.InternalError,
        'TickTick client not initialized'
      );
    }

    try {
      await this.ticktickClient.authorize();
      
      return {
        content: [
          {
            type: 'text',
            text: 'Authorization completed successfully! You can now use TickTick tools.',
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Authorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async handleLogout(): Promise<any> {
    if (!this.ticktickClient) {
      throw new McpError(
        ErrorCode.InternalError,
        'TickTick client not initialized'
      );
    }

    await this.ticktickClient.logout();
    
    return {
      content: [
        {
          type: 'text',
          text: 'Logged out successfully. All stored tokens have been cleared.',
        },
      ],
    };
  }

  private async handleHealthCheck(): Promise<any> {
    if (!this.ticktickClient) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'TickTick client not initialized'
            }, null, 2),
          },
        ],
      };
    }

    const health = await this.ticktickClient.healthCheck();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(health, null, 2),
        },
      ],
    };
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error('MCP Server error:', error);
    };

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await this.server.close();
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    logger.info('Starting TickTick MCP Server...');

    try {
      await this.initializeTickTickClient();
    } catch (error) {
      logger.warn('TickTick client initialization failed:', error);
    }

    if (process.env.PORT) {
      const app = express();
      app.use(cors());
      app.use(express.json());
      const port = parseInt(process.env.PORT, 10);
      const transports = new Map<string, SSEServerTransport>();

      app.get('/sse', async (req, res) => {
        const transport = new SSEServerTransport('/message', res);
        const sessionId = transport.sessionId;
        transports.set(sessionId, transport);

        await this.server.connect(transport);

        req.on('close', () => {
          transports.delete(sessionId);
        });
      });

      app.post('/message', async (req, res) => {
        const sessionId = req.query.sessionId as string;
        const transport = sessionId
        ? transports.get(sessionId)
        : transports.values().next().value;

        if (transport) {
          await transport.handlePostMessage(req, res);
        } else {
          res.status(400).send('No active SSE connection');
        }
      });

      app.listen(port, () => {
        logger.info('SSE server listening on port ' + port);
      });
    } else {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
    }
  }
}
