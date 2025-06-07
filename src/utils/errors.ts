/**
 * Custom Error Classes
 */

export class TickTickMCPError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TickTickMCPError';
  }
}

export class AuthenticationError extends TickTickMCPError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = 'Access token has expired') {
    super(message);
    this.name = 'TokenExpiredError';
    this.code = 'TOKEN_EXPIRED';
  }
}

export class APIError extends TickTickMCPError {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
  }
}

export class RateLimitError extends APIError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.code = 'RATE_LIMIT';
  }
}

export class ValidationError extends TickTickMCPError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends TickTickMCPError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigurationError';
  }
}

export function isRetryableError(error: any): boolean {
  return (
    error instanceof RateLimitError ||
    (error instanceof APIError && 
     typeof error.statusCode === 'number' && 
     [408, 429, 500, 502, 503, 504].includes(error.statusCode)
    )
  );
}

export function getRetryDelay(error: any, attempt: number): number {
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000; // Convert to milliseconds
  }

  // Exponential backoff: 1s, 2s, 4s, 8s, ...
  return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
}