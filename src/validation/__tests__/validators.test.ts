import { jest } from '@jest/globals';
import { z } from 'zod';
import {
  validate,
  safeValidate,
  formatZodErrors,
  createValidator,
  validateAndFormatDate,
  isValidUUID,
  createMissingFieldsError,
  createHelpfulError,
} from '../validators.js';
import { ValidationError } from '../../utils/errors.js';

describe('Validators', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0).max(150),
    email: z.string().email().optional(),
  });

  describe('validate', () => {
    it('should validate correct input', () => {
      const input = { name: 'John', age: 30, email: 'john@example.com' };
      const result = validate(testSchema, input);
      
      expect(result).toEqual(input);
    });

    it('should throw ValidationError on invalid input', () => {
      const input = { name: '', age: 200 };
      
      expect(() => validate(testSchema, input)).toThrow(ValidationError);
    });

    it('should include field path in ValidationError', () => {
      const input = { name: '', age: 30 };
      
      try {
        validate(testSchema, input);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('name');
      }
    });

    it('should format multiple errors correctly', () => {
      const input = { name: '', age: -5 };
      
      try {
        validate(testSchema, input);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('name:');
        expect((error as ValidationError).message).toContain('age:');
      }
    });

    it('should handle non-Zod errors', () => {
      const badSchema = {
        parse: () => {
          throw new Error('Non-Zod error');
        },
      } as any;
      
      expect(() => validate(badSchema, {})).toThrow('Non-Zod error');
    });
  });

  describe('safeValidate', () => {
    it('should return success result for valid input', () => {
      const input = { name: 'John', age: 30 };
      const result = safeValidate(testSchema, input);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('should return error result for invalid input', () => {
      const input = { name: '', age: 30 };
      const result = safeValidate(testSchema, input);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.message).toContain('name:');
      }
    });

    it('should handle non-Zod errors', () => {
      const badSchema = {
        parse: () => {
          throw new Error('Non-Zod error');
        },
      } as any;
      
      const result = safeValidate(badSchema, {});
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Unknown validation error');
      }
    });
  });

  describe('formatZodErrors', () => {
    it('should format errors with paths', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
          email: z.string().email(),
        }),
      });
      
      try {
        schema.parse({ user: { name: '', email: 'invalid' } });
      } catch (error) {
        const messages = formatZodErrors(error as z.ZodError);
        
        expect(messages).toHaveLength(2);
        expect(messages).toContain(expect.stringContaining('user.name:'));
        expect(messages).toContain(expect.stringContaining('user.email:'));
      }
    });

    it('should format errors without paths', () => {
      const schema = z.string().min(1);
      
      try {
        schema.parse('');
      } catch (error) {
        const messages = formatZodErrors(error as z.ZodError);
        
        expect(messages).toHaveLength(1);
        expect(messages[0]).not.toContain(':');
      }
    });
  });

  describe('createValidator', () => {
    it('should create a validator function', () => {
      const validator = createValidator(testSchema);
      const input = { name: 'John', age: 30 };
      
      const result = validator(input);
      
      expect(result).toEqual(input);
    });

    it('should throw on invalid input', () => {
      const validator = createValidator(testSchema);
      const input = { name: '', age: 30 };
      
      expect(() => validator(input)).toThrow(ValidationError);
    });
  });

  describe('validateAndFormatDate', () => {
    it('should validate and format valid ISO date', () => {
      const dateString = '2024-01-01T12:00:00Z';
      const result = validateAndFormatDate(dateString);
      
      expect(result).toBe(dateString);
    });

    it('should return undefined for undefined input', () => {
      const result = validateAndFormatDate(undefined);
      
      expect(result).toBeUndefined();
    });

    it('should throw ValidationError for invalid date', () => {
      const invalidDate = 'not-a-date';
      
      expect(() => validateAndFormatDate(invalidDate)).toThrow(ValidationError);
      expect(() => validateAndFormatDate(invalidDate)).toThrow('Invalid date format');
    });

    it('should handle various date formats', () => {
      const dates = [
        '2024-01-01',
        '2024-01-01T12:00:00',
        '2024-01-01T12:00:00.123Z',
        '2024-01-01T12:00:00+05:00',
      ];
      
      dates.forEach(date => {
        expect(() => validateAndFormatDate(date)).not.toThrow();
      });
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
      ];
      
      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        '',
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        '550e8400-e29b-31d4-a716-446655440000', // Wrong version
        'g50e8400-e29b-41d4-a716-446655440000', // Invalid character
        '550e8400e29b41d4a716446655440000', // No hyphens
      ];
      
      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
  });

  describe('createMissingFieldsError', () => {
    it('should handle empty array', () => {
      const result = createMissingFieldsError([]);
      
      expect(result).toBe('');
    });

    it('should handle single field', () => {
      const result = createMissingFieldsError(['email']);
      
      expect(result).toBe('Missing required field: email');
    });

    it('should handle two fields', () => {
      const result = createMissingFieldsError(['email', 'password']);
      
      expect(result).toBe('Missing required fields: email and password');
    });

    it('should handle multiple fields', () => {
      const result = createMissingFieldsError(['name', 'email', 'password']);
      
      expect(result).toBe('Missing required fields: name, email and password');
    });
  });

  describe('createHelpfulError', () => {
    it('should create error message without actual value', () => {
      const result = createHelpfulError('email', 'valid email address');
      
      expect(result).toBe('Invalid email. Expected valid email address');
    });

    it('should create error message with actual value', () => {
      const result = createHelpfulError('priority', '0, 1, 3, or 5', 2);
      
      expect(result).toBe('Invalid priority. Expected 0, 1, 3, or 5, received: 2');
    });

    it('should handle null actual value', () => {
      const result = createHelpfulError('field', 'string', null);
      
      expect(result).toBe('Invalid field. Expected string, received: null');
    });

    it('should handle undefined actual value', () => {
      const result = createHelpfulError('field', 'string', undefined);
      
      expect(result).toBe('Invalid field. Expected string, received: undefined');
    });

    it('should handle object actual value', () => {
      const result = createHelpfulError('field', 'string', { foo: 'bar' });
      
      expect(result).toBe('Invalid field. Expected string, received: {"foo":"bar"}');
    });
  });
});