import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Validate input against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = formatZodErrors(error);
      throw new ValidationError(messages.join('; '), error.errors[0]?.path?.join('.'));
    }
    throw error;
  }
}

/**
 * Safely validate input against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result object with either data or error
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = formatZodErrors(error);
      return {
        success: false,
        error: new ValidationError(messages.join('; '), error.errors[0]?.path?.join('.')),
      };
    }
    return {
      success: false,
      error: new ValidationError('Unknown validation error'),
    };
  }
}

/**
 * Format Zod errors into readable messages
 * @param error - ZodError to format
 * @returns Array of formatted error messages
 */
export function formatZodErrors(error: ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.join('.');
    const message = err.message;
    
    if (path) {
      return `${path}: ${message}`;
    }
    return message;
  });
}

/**
 * Create a validation middleware for MCP tools
 * @param schema - Zod schema to validate against
 * @returns Validation function
 */
export function createValidator<T>(schema: ZodSchema<T>) {
  return (data: unknown): T => validate(schema, data);
}

/**
 * Validate and transform date strings to TickTick format
 * @param dateString - ISO date string
 * @returns TickTick formatted date or undefined
 */
export function validateAndFormatDate(dateString: string | undefined): string | undefined {
  if (!dateString) return undefined;

  try {
    // Validate it's a proper ISO date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid date format', 'date');
    }

    // Format to TickTick format (handled by date-formatter utility)
    return dateString; // Will be formatted by the API layer
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('Invalid date format', 'date');
  }
}

/**
 * Validate UUID format
 * @param uuid - String to validate as UUID
 * @returns true if valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Create error message for missing required fields
 * @param fields - Array of missing field names
 * @returns Formatted error message
 */
export function createMissingFieldsError(fields: string[]): string {
  if (fields.length === 0) return '';
  if (fields.length === 1) return `Missing required field: ${fields[0]}`;
  
  const lastField = fields[fields.length - 1];
  const otherFields = fields.slice(0, -1).join(', ');
  return `Missing required fields: ${otherFields} and ${lastField}`;
}

/**
 * Create helpful error message with examples
 * @param field - Field name
 * @param expected - Expected format/value
 * @param actual - Actual value received
 * @returns Formatted error message
 */
export function createHelpfulError(
  field: string,
  expected: string,
  actual?: unknown
): string {
  let message = `Invalid ${field}. Expected ${expected}`;
  
  if (actual !== undefined) {
    message += `, received: ${JSON.stringify(actual)}`;
  }
  
  return message;
}