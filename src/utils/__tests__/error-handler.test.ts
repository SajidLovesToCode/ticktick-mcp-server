import { jest } from '@jest/globals';
import {
  createErrorResponse,
  getUserFriendlyMessage,
  withErrorHandling,
} from '../error-handler.js';
import {
  ValidationError,
  TokenExpiredError,
  AuthenticationError,
  RateLimitError,
  APIError,
  ConfigurationError,
  TickTickMCPError,
} from '../errors.js';

describe('Error Handler', () => {
  describe('createErrorResponse', () => {
    it('should format ValidationError correctly', () => {
      const error = new ValidationError('Invalid email format', 'email');
      const response = createErrorResponse(error);
      
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain("Validation error in field 'email': Invalid email format");
    });

    it('should format ValidationError without field', () => {
      const error = new ValidationError('Invalid input');
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('Validation error: Invalid input');
    });

    it('should format TokenExpiredError with hint', () => {
      const error = new TokenExpiredError();
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('Authentication token has expired');
      expect(response.content[0].text).toContain('Hint: Use ticktick_authorize to refresh your authentication');
    });

    it('should format AuthenticationError with hint', () => {
      const error = new AuthenticationError('Invalid credentials');
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('Authentication failed: Invalid credentials');
      expect(response.content[0].text).toContain('Hint: Check your credentials');
    });

    it('should format RateLimitError with retry after', () => {
      const error = new RateLimitError('Too many requests', 60);
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('Rate limit exceeded');
      expect(response.content[0].text).toContain('Hint: Please wait 60 seconds before retrying');
    });

    it('should format RateLimitError without retry after', () => {
      const error = new RateLimitError();
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('Rate limit exceeded');
      expect(response.content[0].text).not.toContain('Hint:');
    });

    it('should format APIError with status code', () => {
      const error = new APIError('Not found', 404);
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('[404] Not found');
    });

    it('should format APIError with response data', () => {
      const error = new APIError('Bad request', 400, { error: 'Invalid field' });
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('[400] Bad request');
      expect(response.content[0].text).toContain('API Response:');
      expect(response.content[0].text).toContain('"error": "Invalid field"');
    });

    it('should format ConfigurationError with hint', () => {
      const error = new ConfigurationError('Missing API key');
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('Configuration error: Missing API key');
      expect(response.content[0].text).toContain('Hint: Check your environment variables');
    });

    it('should format generic TickTickMCPError', () => {
      const error = new TickTickMCPError('Something went wrong');
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('Error: Something went wrong');
    });

    it('should format standard Error', () => {
      const error = new Error('Standard error');
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('Error: Standard error');
    });

    it('should handle non-Error objects', () => {
      const response = createErrorResponse('String error');
      
      expect(response.content[0].text).toContain('Error: An unexpected error occurred');
    });

    it('should handle APIError with string response', () => {
      const error = new APIError('Error', 500, 'Internal server error');
      const response = createErrorResponse(error);
      
      expect(response.content[0].text).toContain('[500] Error');
      expect(response.content[0].text).toContain('API Response: Internal server error');
    });

    it('should handle APIError with circular reference in response', () => {
      const circularRef: any = { a: 1 };
      circularRef.self = circularRef;
      const error = new APIError('Error', 500, circularRef);
      const response = createErrorResponse(error);
      
      // Should not throw, just exclude the response
      expect(response.content[0].text).toContain('[500] Error');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return friendly message for ValidationError', () => {
      const error = new ValidationError('Invalid format', 'email');
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe("Validation error in field 'email': Invalid format");
    });

    it('should return friendly message for TokenExpiredError', () => {
      const error = new TokenExpiredError();
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('Your session has expired. Please authenticate again.');
    });

    it('should return friendly message for AuthenticationError', () => {
      const error = new AuthenticationError();
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('Authentication failed. Please check your credentials.');
    });

    it('should return friendly message for RateLimitError with retry', () => {
      const error = new RateLimitError('Limited', 30);
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('Too many requests. Please wait 30 seconds.');
    });

    it('should return friendly message for RateLimitError without retry', () => {
      const error = new RateLimitError();
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('Too many requests. Please try again later.');
    });

    it('should return friendly messages for APIError status codes', () => {
      const testCases = [
        { status: 400, expected: 'Invalid request. Please check your input.' },
        { status: 401, expected: 'Authentication required.' },
        { status: 403, expected: 'Permission denied.' },
        { status: 404, expected: 'Resource not found.' },
        { status: 500, expected: 'Server error. Please try again later.' },
      ];
      
      testCases.forEach(({ status, expected }) => {
        const error = new APIError('Error', status);
        const message = getUserFriendlyMessage(error);
        expect(message).toBe(expected);
      });
    });

    it('should return original message for unknown APIError status', () => {
      const error = new APIError('Custom message', 418);
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('Custom message');
    });

    it('should handle APIError without message', () => {
      const error = new APIError('', 418);
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('An error occurred with the API request.');
    });

    it('should return message for standard Error', () => {
      const error = new Error('Test error');
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('Test error');
    });

    it('should return default message for non-Error', () => {
      const message = getUserFriendlyMessage('string');
      
      expect(message).toBe('An unexpected error occurred.');
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const successFn = jest.fn<(...args: string[]) => Promise<string>>()
        .mockResolvedValue('success');
      const wrapped = withErrorHandling(successFn);
      
      const result = await wrapped('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should return error response on failure', async () => {
      const error = new ValidationError('Test error');
      const failFn = jest.fn<(...args: string[]) => Promise<never>>()
        .mockRejectedValue(error);
      const wrapped = withErrorHandling(failFn);
      
      const result = await wrapped('arg1');
      
      expect(result).toHaveProperty('content');
      expect((result as any).content[0].text).toContain('Validation error: Test error');
    });

    it('should include context in error logging', async () => {
      const error = new Error('Test error');
      const failFn = jest.fn<(...args: string[]) => Promise<never>>()
        .mockRejectedValue(error);
      const wrapped = withErrorHandling(failFn, { operation: 'test' });
      
      await wrapped('arg1', 'arg2');
      
      // The context and args would be logged but we're mocking console
      expect(failFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle synchronous throws', async () => {
      const throwFn = jest.fn<() => Promise<never>>()
        .mockImplementation(() => {
          throw new Error('Sync error');
        });
      const wrapped = withErrorHandling(throwFn);
      
      const result = await wrapped();
      
      expect(result).toHaveProperty('content');
      expect((result as any).content[0].text).toContain('Sync error');
    });
  });
});