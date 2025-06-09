import { jest } from '@jest/globals';
import {
  TickTickMCPError,
  AuthenticationError,
  TokenExpiredError,
  APIError,
  RateLimitError,
  ValidationError,
  ConfigurationError,
  isRetryableError,
  getRetryDelay,
} from '../errors.js';

describe('Error Classes', () => {
  describe('TickTickMCPError', () => {
    it('should create base error with message and code', () => {
      const error = new TickTickMCPError('Test error', 'TEST_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TickTickMCPError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('TickTickMCPError');
    });

    it('should capture stack trace', () => {
      const error = new TickTickMCPError('Test error', 'TEST_ERROR');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TickTickMCPError');
    });

    it('should handle undefined code', () => {
      const error = new TickTickMCPError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBeUndefined();
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Auth failed');
      
      expect(error).toBeInstanceOf(TickTickMCPError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Auth failed');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should use default message if not provided', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('Authentication failed');
    });
  });

  describe('TokenExpiredError', () => {
    it('should create token expired error', () => {
      const error = new TokenExpiredError('Token expired');
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error).toBeInstanceOf(TokenExpiredError);
      expect(error.message).toBe('Token expired');
      expect(error.code).toBe('TOKEN_EXPIRED');
      expect(error.name).toBe('TokenExpiredError');
    });

    it('should use default message if not provided', () => {
      const error = new TokenExpiredError();
      
      expect(error.message).toBe('Access token has expired');
    });
  });

  describe('APIError', () => {
    it('should create API error with status code and response', () => {
      const response = { error: 'Not found' };
      const error = new APIError('API request failed', 404, response);
      
      expect(error).toBeInstanceOf(TickTickMCPError);
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toBe('API request failed');
      expect(error.code).toBe('API_ERROR');
      expect(error.statusCode).toBe(404);
      expect(error.response).toEqual(response);
      expect(error.name).toBe('APIError');
    });

    it('should handle missing optional parameters', () => {
      const error = new APIError('API error');
      
      expect(error.message).toBe('API error');
      expect(error.statusCode).toBeUndefined();
      expect(error.response).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid email', 'email');
      
      expect(error).toBeInstanceOf(TickTickMCPError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid email');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('email');
      expect(error.name).toBe('ValidationError');
    });

    it('should handle missing field', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBeUndefined();
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Missing API key');
      
      expect(error).toBeInstanceOf(TickTickMCPError);
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.message).toBe('Missing API key');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.name).toBe('ConfigurationError');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry after', () => {
      const error = new RateLimitError('Too many requests', 60);
      
      expect(error).toBeInstanceOf(APIError);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.message).toBe('Too many requests');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(error.name).toBe('RateLimitError');
    });

    it('should use default message if not provided', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.retryAfter).toBeUndefined();
    });
  });

  describe('Helper Functions', () => {
    describe('isRetryableError', () => {
      it('should identify rate limit errors as retryable', () => {
        const error = new RateLimitError();
        expect(isRetryableError(error)).toBe(true);
      });

      it('should identify specific API errors as retryable', () => {
        const retryableCodes = [408, 429, 500, 502, 503, 504];
        
        retryableCodes.forEach(code => {
          const error = new APIError('Error', code);
          expect(isRetryableError(error)).toBe(true);
        });
      });

      it('should not identify client errors as retryable', () => {
        const nonRetryableCodes = [400, 401, 403, 404, 422];
        
        nonRetryableCodes.forEach(code => {
          const error = new APIError('Error', code);
          expect(isRetryableError(error)).toBe(false);
        });
      });

      it('should not identify other errors as retryable', () => {
        expect(isRetryableError(new Error('Generic'))).toBe(false);
        expect(isRetryableError(new ValidationError('Invalid'))).toBe(false);
        expect(isRetryableError(new AuthenticationError())).toBe(false);
      });
    });

    describe('getRetryDelay', () => {
      it('should use retryAfter for rate limit errors', () => {
        const error = new RateLimitError('Limited', 5);
        expect(getRetryDelay(error, 0)).toBe(5000); // 5s in ms
        expect(getRetryDelay(error, 10)).toBe(5000); // Always use retryAfter
      });

      it('should use exponential backoff for other errors', () => {
        const error = new APIError('Error', 503);
        
        expect(getRetryDelay(error, 0)).toBe(1000);  // 1s
        expect(getRetryDelay(error, 1)).toBe(2000);  // 2s
        expect(getRetryDelay(error, 2)).toBe(4000);  // 4s
        expect(getRetryDelay(error, 3)).toBe(8000);  // 8s
        expect(getRetryDelay(error, 4)).toBe(16000); // 16s
      });

      it('should cap delay at 30 seconds', () => {
        const error = new APIError('Error', 503);
        
        expect(getRetryDelay(error, 10)).toBe(30000); // Max 30s
        expect(getRetryDelay(error, 20)).toBe(30000); // Max 30s
      });
    });
  });

  describe('Error inheritance', () => {
    it('should maintain proper instanceof checks', () => {
      const authError = new AuthenticationError();
      const apiError = new APIError('Error');
      const tokenError = new TokenExpiredError();
      const rateLimitError = new RateLimitError();
      
      expect(authError instanceof Error).toBe(true);
      expect(authError instanceof TickTickMCPError).toBe(true);
      expect(authError instanceof AuthenticationError).toBe(true);
      expect(authError instanceof APIError).toBe(false);
      
      expect(apiError instanceof Error).toBe(true);
      expect(apiError instanceof TickTickMCPError).toBe(true);
      expect(apiError instanceof APIError).toBe(true);
      expect(apiError instanceof AuthenticationError).toBe(false);
      
      expect(tokenError instanceof AuthenticationError).toBe(true);
      expect(tokenError instanceof TickTickMCPError).toBe(true);
      
      expect(rateLimitError instanceof APIError).toBe(true);
      expect(rateLimitError instanceof RateLimitError).toBe(true);
    });
  });
});