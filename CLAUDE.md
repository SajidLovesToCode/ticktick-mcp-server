# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TickTick MCP (Model Context Protocol) Server that enables Claude to interact with TickTick's task management platform. The server implements OAuth 2.1 authentication with PKCE support and provides comprehensive task and project management capabilities.

## Commands

### Build and Development
- `npm run build`: Build the TypeScript project
- `npm run typecheck`: Run TypeScript type checking  
- `npm run dev`: Build and start the development server
- `npm run watch`: Watch TypeScript files for changes
- `npm run start`: Start the compiled server
- `npm run clean`: Remove build artifacts

### Testing and Quality
- `npm run lint`: Run ESLint on source files
- `npm run test`: Run Jest tests (when implemented)

### MCP Tools
- `npm run inspector`: Launch MCP inspector for debugging

## Architecture

### High-Level Structure
The project follows a modular architecture:

```
src/
├── index.ts              # Entry point
├── server.ts             # MCP Server implementation
├── auth/                 # OAuth 2.1 authentication with PKCE
│   ├── oauth-manager.ts  # OAuth flow management
│   ├── token-storage.ts  # Secure token persistence (OS keychain)
│   └── config.ts         # Authentication configuration
├── api/                  # TickTick API integration
│   ├── ticktick-client.ts # Main API client
│   ├── common/           # Shared API utilities
│   ├── tasks/            # Task management APIs
│   └── projects/         # Project management APIs
├── tools/                # MCP tool implementations
│   ├── task-tools.ts     # Task CRUD operations
│   ├── project-tools.ts  # Project CRUD operations
│   └── index.ts          # Tool integration
├── utils/                # Utilities
│   ├── logger.ts         # Structured logging
│   ├── errors.ts         # Custom error classes
│   └── rate-limiter.ts   # API rate limiting with retry logic
└── resources/            # MCP resources (for future expansion)
```

### Key Components

1. **Authentication Layer**: OAuth 2.1 with PKCE for secure authentication
2. **API Layer**: Rate-limited HTTP client with automatic token refresh
3. **MCP Layer**: Standards-compliant MCP server with tool definitions
4. **Error Handling**: Comprehensive error handling with retry logic

## Environment Setup

### Required Environment Variables
```bash
TICKTICK_CLIENT_ID=your_client_id
TICKTICK_CLIENT_SECRET=your_client_secret
TICKTICK_REDIRECT_URI=http://localhost:8080/callback
ENCRYPTION_KEY=your_32_character_encryption_key
LOG_LEVEL=info
DEBUG_MODE=false
```

### OAuth Configuration File
Create `ticktick-oauth.keys.json` with:
```json
{
  "client_id": "your_ticktick_client_id",
  "client_secret": "your_ticktick_client_secret",
  "redirect_uri": "http://localhost:8080/callback"
}
```

## Available MCP Tools

### Authentication Tools
- `ticktick_auth_status`: Check authentication status
- `ticktick_authorize`: Start OAuth authorization flow
- `ticktick_logout`: Clear stored tokens
- `ticktick_health_check`: Test API connectivity

### Task Management Tools
- `ticktick_list_tasks`: List tasks with filtering and sorting
- `ticktick_get_task`: Get specific task details
- `ticktick_create_task`: Create new tasks
- `ticktick_update_task`: Update existing tasks
- `ticktick_delete_task`: Delete tasks
- `ticktick_complete_task`: Mark tasks as completed
- `ticktick_search_tasks`: Search tasks by query
- `ticktick_get_overdue_tasks`: Get overdue tasks

### Project Management Tools
- `ticktick_list_projects`: List projects with filtering
- `ticktick_get_project`: Get specific project details
- `ticktick_create_project`: Create new projects
- `ticktick_update_project`: Update existing projects
- `ticktick_delete_project`: Delete projects
- `ticktick_get_project_tasks`: Get tasks in a project
- `ticktick_get_project_stats`: Get project statistics
- `ticktick_archive_project`: Archive projects

## Development Notes

### Code Style
- Use ES modules (import/export) syntax, not CommonJS
- Destructure imports when possible
- Follow TypeScript strict mode
- Use async/await for asynchronous operations

### Error Handling
- All API calls are wrapped with rate limiting and retry logic
- Authentication errors are handled gracefully
- Comprehensive error types for different failure scenarios

### Security
- OAuth tokens stored securely in OS keychain
- Fallback to encrypted environment variables
- No sensitive data in logs
- PKCE implementation for OAuth security

### Testing
- Run `npm run typecheck` after code changes
- Use `npm run inspector` to test MCP tools
- Verify authentication flow before testing other tools

## Integration with Claude Desktop

Add to Claude Desktop configuration:
```json
{
  "mcpServers": {
    "ticktick": {
      "command": "node",
      "args": ["{ABSOLUTE_PATH}/ticktick-mcp-server/dist/index.js"],
      "env": {
        "TICKTICK_CLIENT_ID": "your_client_id",
        "TICKTICK_CLIENT_SECRET": "your_client_secret",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```