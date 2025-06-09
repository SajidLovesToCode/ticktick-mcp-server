/**
 * Unified error handling utilities
 */

import { logger } from './logger.js';
import { 
  TickTickMCPError, 
  AuthenticationError, 
  TokenExpiredError,
  APIError, 
  ValidationError,
  RateLimitError,
  ConfigurationError 
} from './errors.js';

interface ErrorResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

/**
 * Create a standardized error response for MCP tools
 * @param error - The error to format
 * @param context - Additional context for debugging
 * @returns Formatted error response
 */
export function createErrorResponse(error: any, context?: Record<string, any>): ErrorResponse {
  logger.error('Error in MCP tool', { error, context });

  let message: string;
  let hint: string | undefined;

  if (error instanceof ValidationError) {
    message = formatValidationError(error);
  } else if (error instanceof TokenExpiredError) {
    message = 'Authentication token has expired';
    hint = 'Use ticktick_authorize to refresh your authentication';
  } else if (error instanceof AuthenticationError) {
    message = `Authentication failed: ${error.message}`;
    hint = 'Check your credentials or use ticktick_authorize to authenticate';
  } else if (error instanceof RateLimitError) {
    message = 'Rate limit exceeded';
    if (error.retryAfter) {
      hint = `Please wait ${error.retryAfter} seconds before retrying`;
    }
  } else if (error instanceof APIError) {
    message = formatAPIError(error);
  } else if (error instanceof ConfigurationError) {
    message = `Configuration error: ${error.message}`;
    hint = 'Check your environment variables and configuration files';
  } else if (error instanceof TickTickMCPError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = 'An unexpected error occurred';
  }

  const fullMessage = hint ? `${message}\n\nHint: ${hint}` : message;

  return {
    content: [
      {
        type: 'text',
        text: `Error: ${fullMessage}`,
      },
    ],
  };
}

/**
 * Format validation errors with field details
 */
function formatValidationError(error: ValidationError): string {
  if (error.field) {
    return `Validation error in field '${error.field}': ${error.message}`;
  }
  return `Validation error: ${error.message}`;
}

/**
 * Format API errors with status codes and response data
 */
function formatAPIError(error: APIError): string {
  let message = error.message;
  
  if (error.statusCode) {
    message = `[${error.statusCode}] ${message}`;
  }
  
  if (error.response) {
    try {
      const responseStr = typeof error.response === 'string' 
        ? error.response 
        : JSON.stringify(error.response, null, 2);
      message += `\n\nAPI Response: ${responseStr}`;
    } catch {
      // Ignore JSON stringify errors
    }
  }
  
  return message;
}

/**
 * Wrap an async function with error handling
 * @param fn - Async function to wrap
 * @param context - Context for error logging
 * @returns Wrapped function that returns error response on failure
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) {
  return async (...args: T): Promise<R | ErrorResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      return createErrorResponse(error, { ...context, args });
    }
  };
}

/**
 * Extract user-friendly message from various error types
 * @param error - Error to extract message from
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  if (error instanceof ValidationError) {
    return formatValidationError(error);
  }
  
  if (error instanceof TokenExpiredError) {
    return 'Your session has expired. Please authenticate again.';
  }
  
  if (error instanceof AuthenticationError) {
    return 'Authentication failed. Please check your credentials.';
  }
  
  if (error instanceof RateLimitError) {
    return error.retryAfter 
      ? `Too many requests. Please wait ${error.retryAfter} seconds.`
      : 'Too many requests. Please try again later.';
  }
  
  if (error instanceof APIError) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required.';
      case 403:
        return 'Permission denied.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An error occurred with the API request.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}