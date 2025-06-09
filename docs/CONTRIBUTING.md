# Contributing to TickTick MCP Server

Thank you for your interest in contributing to the TickTick MCP Server! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/ticktick-mcp-server.git
   cd ticktick-mcp-server
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/your-upstream/ticktick-mcp-server.git
   ```

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- TypeScript knowledge
- TickTick developer account for API access

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your TickTick API credentials
   ```

3. Create OAuth configuration:
   ```bash
   cp ticktick-oauth.keys.example.json ticktick-oauth.keys.json
   # Add your client_id and client_secret
   ```

4. Run the development build:
   ```bash
   npm run dev
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/utils/__tests__/logger.test.ts
```

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in the [issue tracker](https://github.com/your-username/ticktick-mcp-server/issues)
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Node version, etc.)
   - Relevant logs or error messages

### Suggesting Features

1. Check existing issues and discussions
2. Create a feature request issue with:
   - Use case description
   - Proposed solution
   - Alternative solutions considered
   - Mockups or examples (if applicable)

### Submitting Code

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Add or update tests as needed

4. Update documentation if required

5. Commit your changes:
   ```bash
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue with X"
   ```

## Pull Request Process

1. Update your fork with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request with:
   - Clear title following conventional commits
   - Description of changes
   - Related issue numbers
   - Screenshots (if UI changes)
   - Test results

4. Address review feedback promptly

5. Ensure all CI checks pass

### PR Title Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Build process or auxiliary tool changes

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types - use proper types or generics
- Use ES modules (`import`/`export`)
- Destructure imports when possible
- Follow existing code patterns

### Code Style

```typescript
// Use explicit types
function processTask(task: Task): ProcessedTask {
  // ...
}

// Use async/await over promises
async function fetchData(): Promise<Data> {
  const result = await api.get('/data');
  return result;
}

// Use const for immutable values
const MAX_RETRIES = 3;

// Use meaningful variable names
const taskCompletionRate = completedTasks / totalTasks;
```

### Error Handling

- Use custom error classes from `utils/errors.ts`
- Always include helpful error messages
- Use the unified error handler (`utils/error-handler.ts`) for consistent responses
- Log errors with appropriate context using the logger utility
- Never expose sensitive information in error messages

### Validation

- Use Zod schemas for input validation
- Validate all external inputs
- Provide clear validation error messages
- Use type inference from schemas

## Testing Guidelines

### Test Structure

```typescript
import { jest } from '@jest/globals';

describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = component.method(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

**Note**: We use ESM modules, so always import jest from '@jest/globals'.

### Test Coverage

- Maintain minimum 80% code coverage
- Test happy paths and error cases
- Test edge cases and boundary conditions
- Mock external dependencies appropriately

### Testing Best Practices

- Keep tests focused and isolated
- Use descriptive test names
- Avoid testing implementation details
- Use test data builders for complex objects
- Clean up resources in afterEach hooks
- Mock external dependencies (fs, http, etc.)
- Test both success and error paths
- Use `jest.useFakeTimers()` for time-dependent tests

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Include parameter descriptions with types
- Add usage examples for complex functions
- Document any assumptions or limitations
- Use TypeScript types instead of JSDoc type annotations

Example:
```typescript
/**
 * Creates a new task in the specified project
 * @param taskData - Task creation parameters
 * @returns The created task object
 * @throws {ValidationError} If input validation fails
 * @throws {APIError} If the API request fails
 */
async function createTask(taskData: CreateTaskInput): Promise<Task> {
  // ...
}
```

### README Updates

Update README.md when:
- Adding new features
- Changing configuration requirements
- Modifying setup instructions
- Adding new MCP tools

### API Documentation

- Update `docs/api-spec.yaml` for API changes
- Keep tool descriptions accurate
- Document all parameters and responses
- Include examples

## Release Process

1. Ensure all tests pass: `npm test`
2. Check TypeScript types: `npm run typecheck`
3. Run linter: `npm run lint`
4. Update version in `package.json`
5. Update `docs/CHANGELOG.md` with release notes following Keep a Changelog format
6. Commit changes: `git commit -m "chore: release v1.0.0"`
7. Create a git tag: `git tag v1.0.0`
8. Push changes and tag: `git push origin main --tags`
9. Create GitHub release with changelog

## Getting Help

- Check existing documentation
- Search closed issues
- Ask in discussions
- Join our community chat (if available)

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes
- Project documentation

Thank you for contributing to TickTick MCP Server!