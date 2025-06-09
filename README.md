# ticktick-mcp-server

[日本語版はこちら](README.ja.md)

TickTick MCP (Model Context Protocol) Server - An MCP server for using TickTick task management features from Claude

## Overview

This MCP server enables integration with the TickTick task management platform from Claude Desktop. It implements secure authentication using OAuth 2.1 with PKCE (Proof Key for Code Exchange) and provides comprehensive task and project management capabilities.

## Authentication and Authorization

### OAuth 2.1 with PKCE

This server adopts the OAuth 2.1 with PKCE protocol for secure authentication:

1. **PKCE Authentication Flow**
   - Generates code_verifier and code_challenge at the start of authentication
   - Displays TickTick authentication screen in browser
   - Obtains authorization code after user approval
   - Exchanges tokens using authorization code and code_verifier

2. **Token Storage**
   - Stores access tokens in `.ticktick-mcp-server-credentials.json` file
   - **⚠️ Security Warning**: Tokens are currently stored in plaintext. For production use, implementing encryption is recommended
   - Never expose access tokens publicly

3. **Automatic Token Refresh**
   - MCP server automatically checks token expiration
   - Obtains new access token using refresh token when expired

## Setup Instructions

### 1. Configure Authentication Credentials

Configure credentials obtained from the TickTick Developer Console. Choose from one of three methods:

#### Method 1: ticktick-oauth.keys.json (Recommended)
Create a `ticktick-oauth.keys.json` file in the project root:

```json
{
  "client_id": "your_ticktick_client_id",
  "client_secret": "your_ticktick_client_secret",
  "redirect_uri": "http://localhost:8080/callback"
}
```

#### Method 2: Environment Variables (.env)
Create a `.env` file in the project root:

```env
TICKTICK_CLIENT_ID=your_ticktick_client_id
TICKTICK_CLIENT_SECRET=your_ticktick_client_secret
TICKTICK_REDIRECT_URI=http://localhost:8080/callback
```

#### Method 3: System Environment Variables
Set directly in your shell:

```bash
export TICKTICK_CLIENT_ID=your_ticktick_client_id
export TICKTICK_CLIENT_SECRET=your_ticktick_client_secret
export TICKTICK_REDIRECT_URI=http://localhost:8080/callback
```

**Configuration Priority**:
1. Settings passed directly to the constructor (specified in code)
2. `ticktick-oauth.keys.json` file
3. Environment variables (`.env` file or system environment variables)

**Note**: 
- When configured through multiple methods, loading follows the priority order above
- For security, these files are added to `.gitignore` and will not be committed to the repository
- Replace `your_ticktick_client_id` and `your_ticktick_client_secret` with actual values

### Token Storage Location Configuration (Important)

Authentication tokens are saved according to the following priority:

1. **Path specified by `TICKTICK_CREDENTIALS_PATH` environment variable** (recommended)
2. **User home directory** (`~/.ticktick-mcp-server-credentials.json`)
3. **Current working directory** (fallback)

For Claude Desktop environment, setting the `TICKTICK_CREDENTIALS_PATH` environment variable is strongly recommended:

```bash
export TICKTICK_CREDENTIALS_PATH=/Users/yourusername/Documents/.ticktick-mcp-server-credentials.json
```

### 2. Build the Project

```bash
npm install
npm run build
```

### For Developers: Testing and Code Quality

```bash
# TypeScript type checking
npm run typecheck

# Code quality check with ESLint
npm run lint

# Run tests
npm test

# Check test coverage (target: 80% or higher)
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### 3. Execute Authentication

For first-time use, authenticate with the following command:

```bash
# Start authentication flow
npm run start auth
# or
npm run start:auth
```

#### Authentication Steps
1. Running the above command will automatically open a browser
2. Log in to your account on the TickTick login screen
3. Approve application access permissions
4. Upon completion, tokens are saved to `.ticktick-mcp-server-credentials.json`
5. "Authentication completed successfully!" message will be displayed

### 4. Verify Authentication Status

To verify authentication has completed successfully:

```bash
# Launch MCP Inspector to verify
npm run inspector
```

1. Access http://localhost:5173 in your browser
2. Click "Connect" in MCP Inspector
3. Execute the `ticktick_auth_status` tool to check authentication status

### 5. Normal Startup

After authentication is complete, start with:

```bash
npm run start
```

## Available MCP Tools

### Authentication Management
- `ticktick_auth_status`: Check authentication status
- `ticktick_authorize`: Start OAuth authentication flow
- `ticktick_logout`: Clear saved tokens
- `ticktick_health_check`: Test API connectivity

### Task Management
- `ticktick_list_tasks`: Get task list (with filtering and sorting)
- `ticktick_get_task`: Get specific task details
- `ticktick_create_task`: Create new task
- `ticktick_update_task`: Update task (title, content, due date, priority, checklist, etc.)
  - **Note**: `projectId` and `taskId` parameters are required (per TickTick API specification)
- `ticktick_delete_task`: Delete task
- `ticktick_complete_task`: Mark task as completed
- `ticktick_uncomplete_task`: Mark task as incomplete
- `ticktick_search_tasks`: Search tasks
- `ticktick_get_overdue_tasks`: Get overdue tasks

### Project Management
- `ticktick_list_projects`: Get project list
- `ticktick_get_project`: Get specific project details
- `ticktick_create_project`: Create new project
- `ticktick_update_project`: Update project
- `ticktick_delete_project`: Delete project
- `ticktick_get_project_tasks`: Get tasks in a project
- `ticktick_get_project_stats`: Get project statistics
- `ticktick_archive_project`: Archive project
- `ticktick_unarchive_project`: Unarchive project

## API Features

This MCP server is implemented based on the official TickTick OpenAPI:

### Supported Operations
- ✅ **Create, update, delete, and complete tasks**
- ✅ **Create, update, and delete projects**
- ✅ **Project archive functionality**
- ✅ **Task search and filtering**

### Implementation Features
- **Automatic date format conversion**: Auto-conversion from ISO format to TickTick API format
- **Enhanced error handling**: Detailed error messages and troubleshooting hints
- **Rate limiting support**: API client with automatic retry functionality
- **PKCE-enabled OAuth**: Secure authentication flow

## Integration with Claude Desktop

Add the following to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "ticktick": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/ticktick-mcp-server/dist/index.js"],
      "env": {
        "TICKTICK_CLIENT_ID": "your_client_id",
        "TICKTICK_CLIENT_SECRET": "your_client_secret",
        "TICKTICK_REDIRECT_URI": "http://localhost:8080/callback",
        "TICKTICK_CREDENTIALS_PATH": "/absolute/path/to/.ticktick-mcp-server-credentials.json",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Troubleshooting

### Authentication Errors

#### "invalid_request" Error
```
OAuth Error
error="invalid_request", error_description="At least one redirect_uri must be registered with the client."
```

**Cause**: No redirect URI is registered in the TickTick OAuth application.

**Solution**:
1. Access [TickTick Developer Portal](https://developer.ticktick.com/manage)
2. Add the following redirect URI in application settings:
   ```
   http://localhost:8080/callback
   ```
3. Save settings

**Important**: The redirect URI must match exactly (protocol, host, port, and path).

#### Other Authentication Errors
1. Verify the contents of `ticktick-oauth.keys.json` are correct
2. Confirm `redirect_uri` is set to `http://localhost:8080/callback`
3. Check that the application is enabled in the TickTick Developer Console

### Token Not Being Saved
1. Check write permissions for the project directory
2. Verify `.ticktick-mcp-server-credentials.json` file is created
3. Confirm file contents are valid JSON format

### Re-authenticating
1. Delete `.ticktick-mcp-server-credentials.json` file
2. Run `npm run start auth` command again

## Latest Updates

See [CHANGELOG.md](docs/CHANGELOG.md) for detailed change history.

### v0.2.0 (Latest) - 2025-06-08
- ✅ **Comprehensive test suite added**: Jest configuration and unit tests (80% coverage target)
- ✅ **Input validation implemented**: Strict type checking and validation with Zod schemas
- ✅ **Unified error handling**: Consistent error response format
- ✅ **ESLint configuration added**: Strict code quality rules for TypeScript
- ✅ **Expanded documentation**: API specification, CHANGELOG, and contribution guidelines added
- ✅ **Improved type safety**: Eliminated `any` types with proper type annotations

## Security

### Important Security Notes

1. **Protecting Credentials**
   - `.ticktick-mcp-server-credentials.json` - Contains authentication tokens
   - `ticktick-oauth.keys.json` - Contains OAuth client secrets
   - **Never commit these files to Git**

2. **Recommended Security Measures**
   - Set appropriate permissions for credential files: `chmod 600 .ticktick-mcp-server-credentials.json`
   - Rotate tokens regularly
   - Delete unused tokens
   - Implement token encryption for production environments

See [Security Policy](docs/SECURITY.md) for details.

## Documentation

- [API Specification](docs/api-spec.yaml)
- [Change Log](docs/CHANGELOG.md)
- [Developer Guidelines](docs/CONTRIBUTING.md)
- [Security Policy](docs/SECURITY.md)