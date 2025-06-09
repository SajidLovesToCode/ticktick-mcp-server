# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TickTick MCP (Model Context Protocol) Server that enables Claude to interact with TickTick's task management platform. The server implements OAuth 2.1 authentication with PKCE support and provides comprehensive task and project management capabilities.

**Recent Updates:**
- ✅ **Comprehensive Test Suite**: Added Jest tests with 80% coverage target
- ✅ **Input Validation with Zod**: Type-safe schema validation for all tool inputs
- ✅ **Unified Error Handling**: Consistent error response format across all tools
- ✅ **ESLint Configuration**: Strict TypeScript linting rules
- ✅ **Enhanced Documentation**: Added API spec, CHANGELOG, and CONTRIBUTING guide
- ✅ **Type Safety Improvements**: Removed `any` types and added proper type annotations
- ✅ **Task Update Improvement**: `projectId` parameter is required per API specification
- ✅ **Full Project CRUD Support**: Complete create, read, update, delete, and archive operations
- ✅ **Date Format Handling**: Automatic conversion between ISO and TickTick API formats

## Commands

### Build and Development
- `npm run build`: Build the TypeScript project
- `npm run typecheck`: Run TypeScript type checking  
- `npm run dev`: Build and start the development server
- `npm run watch`: Watch TypeScript files for changes
- `npm run start`: Start the compiled server
- `npm run start:auth`: Run authentication flow (same as `npm run start auth`)
- `npm run clean`: Remove build artifacts

### Authentication
- `npm run start auth`: Start OAuth authentication flow
- `npm run start:auth`: Alternative command for authentication

### Testing and Quality
- `npm run lint`: Run ESLint on source files
- `npm run test`: Run Jest tests
- `npm run test:coverage`: Run tests with coverage report
- `npm run test:watch`: Run tests in watch mode

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
│   ├── token-storage.ts  # Simple JSON file token storage
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
├── validation/           # Input validation schemas
│   ├── task-schemas.ts   # Task validation schemas
│   ├── project-schemas.ts# Project validation schemas
│   ├── auth-schemas.ts   # Auth validation schemas
│   └── validators.ts     # Validation utilities
├── utils/                # Utilities
│   ├── logger.ts         # Structured logging
│   ├── errors.ts         # Custom error classes
│   ├── error-handler.ts  # Unified error handling
│   ├── date-formatter.ts # Date format conversion
│   └── rate-limiter.ts   # API rate limiting with retry logic
├── __tests__/            # Test files
└── resources/            # MCP resources (for future expansion)
```

### Key Components

1. **Authentication Layer**: OAuth 2.1 with PKCE for secure authentication
2. **API Layer**: Rate-limited HTTP client with automatic token refresh
3. **MCP Layer**: Standards-compliant MCP server with tool definitions
4. **Validation Layer**: Zod schemas for type-safe input validation
5. **Error Handling**: Unified error handling with consistent response format
6. **Testing**: Comprehensive test suite with Jest and high coverage

## Environment Setup

### Required Environment Variables
```bash
TICKTICK_CLIENT_ID=your_client_id
TICKTICK_CLIENT_SECRET=your_client_secret
TICKTICK_REDIRECT_URI=http://localhost:8080/callback
TICKTICK_CREDENTIALS_PATH=/path/to/.ticktick-mcp-server-credentials.json  # Optional but recommended
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

### Task Management Tools (Based on Official TickTick OpenAPI)
- `ticktick_list_tasks`: List tasks from all projects with filtering and sorting
- `ticktick_get_task`: Get specific task details (requires searching through projects)
- `ticktick_create_task`: Create new tasks (✅ Supported by API)
- `ticktick_update_task`: Update existing tasks (✅ Compliant with TickTick API specification)
  - **Important**: `projectId` is required as per TickTick API specification
  - Supports all task fields: title, content, dueDate, priority, status, tags, checklist items, etc.
  - Automatic date format conversion from ISO to TickTick API format
- `ticktick_delete_task`: Delete tasks (✅ Supported by API, requires projectId)
- `ticktick_complete_task`: Mark tasks as completed (✅ Supported by API, requires projectId)
- `ticktick_uncomplete_task`: Mark tasks as incomplete (✅ Implemented via task update)
- `ticktick_search_tasks`: Search tasks by query
- `ticktick_get_overdue_tasks`: Get overdue tasks

### Project Management Tools (Based on Official TickTick OpenAPI)
- `ticktick_list_projects`: List all projects (✅ Supported by API)
- `ticktick_get_project`: Get specific project details (✅ Supported by API)
- `ticktick_create_project`: Create new projects (✅ Supported by API)
- `ticktick_update_project`: Update existing projects (✅ Supported by API)
- `ticktick_delete_project`: Delete projects (✅ Supported by API)
- `ticktick_get_project_tasks`: Get tasks in a project (✅ Supported via project data endpoint)
- `ticktick_get_project_stats`: Get project statistics (calculated from project data)
- `ticktick_archive_project`: Archive projects (✅ Supported via project update)
- `ticktick_unarchive_project`: Unarchive projects (✅ Supported via project update)

## API Features

Based on the official TickTick OpenAPI specification, the following operations are supported:

### Supported Operations:
- ✅ **List Projects**: `GET /open/v1/project`
- ✅ **Get Project Details**: `GET /open/v1/project/{projectId}`
- ✅ **Get Project Data**: `GET /open/v1/project/{projectId}/data` (includes tasks)
- ✅ **Create Project**: `POST /open/v1/project`
- ✅ **Update Project**: `POST /open/v1/project/{projectId}`
- ✅ **Delete Project**: `DELETE /open/v1/project/{projectId}`
- ✅ **Create Task**: `POST /open/v1/task`
- ✅ **Update Task**: `POST /open/v1/task/{taskId}`
- ✅ **Get Task**: `GET /open/v1/project/{projectId}/task/{taskId}`
- ✅ **Complete Task**: `POST /open/v1/project/{projectId}/task/{taskId}/complete`
- ✅ **Delete Task**: `DELETE /open/v1/project/{projectId}/task/{taskId}`

### API Implementation Details:
- **Task Uncomplete**: Implemented via task update with status: 0
- **Task Listing**: Tasks retrieved through project data endpoints for comprehensive filtering
- **Task Search**: Client-side filtering after retrieving all tasks for flexible search capabilities
- **Project Archiving**: Implemented via project update (closed: true/false)
- **Date Formatting**: Automatic conversion between ISO format and TickTick API format
- **Parameter Validation**: Zod schema validation for all inputs:
  - Type checking at runtime
  - Clear validation error messages
  - Required field validation
  - Format validation (UUIDs, dates, enums)
- **Input Validation**: All tool inputs validated before processing

## Development Notes

### Code Style
- Use ES modules (import/export) syntax, not CommonJS
- Destructure imports when possible
- Follow TypeScript strict mode
- Use async/await for asynchronous operations

### Error Handling
- Unified error response format across all tools
- Custom error classes for different failure scenarios:
  - `ValidationError`: Input validation failures
  - `AuthenticationError`: OAuth and token issues
  - `APIError`: TickTick API errors with status codes
  - `RateLimitError`: Rate limiting with retry information
  - `ConfigurationError`: Setup and config issues
- All API calls wrapped with rate limiting and automatic retry
- Enhanced error messages with troubleshooting hints
- Structured logging with log levels (error, warn, info, debug)
- Circular reference handling in error serialization

### Security
- OAuth tokens stored in `.ticktick-mcp-server-credentials.json` file
- Token storage location priority:
  1. `TICKTICK_CREDENTIALS_PATH` environment variable (recommended for Claude Desktop)
  2. User's home directory (`~/.ticktick-mcp-server-credentials.json`)
  3. Current working directory (fallback)
- PKCE implementation for OAuth security
- No sensitive data in logs
- Credentials file should be added to .gitignore

### Testing
- **Unit Tests**: Comprehensive test coverage for all modules
- **Test Commands**:
  - `npm test` - Run all tests
  - `npm run test:coverage` - Generate coverage report (target: 80%)
  - `npm run test:watch` - Run tests in watch mode
- **Test Structure**:
  - Tests located in `__tests__` directories
  - Mock implementations for external dependencies
  - ESM support with experimental VM modules
- **Before Testing**:
  - Run `npm run typecheck` to ensure type safety
  - Run `npm run lint` to check code quality
  - Verify authentication flow before testing tools
- **Integration Testing**:
  - Use `npm run inspector` to test MCP tools interactively
  - Test error scenarios to verify error handling

### MCP Tool Usage Notes
- **Task Updates**: `projectId` is required for `ticktick_update_task` as per TickTick API specification
- **Date Fields**: All date parameters accept ISO format and are automatically converted to TickTick API format
- **Error Recovery**: If a task update fails due to missing projectId, the error message will provide helpful hints for resolution
- **Validation**: Required parameters are validated with clear error messages indicating what's missing or invalid
- **API Compliance**: Implementation now strictly follows TickTick OpenAPI specification requirements

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
        "TICKTICK_CREDENTIALS_PATH": "{ABSOLUTE_PATH}/Documents/.ticktick-mcp-server-credentials.json",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Related Documentation

- [API Specification](docs/api-spec.yaml) - OpenAPI specification
- [Changelog](docs/CHANGELOG.md) - Detailed version history
- [Contributing Guide](docs/CONTRIBUTING.md) - Guidelines for contributors
- [README](README.md) - User-facing documentation