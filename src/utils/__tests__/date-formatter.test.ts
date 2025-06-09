import { jest } from '@jest/globals';
import { formatTickTickDate, parseTickTickDate } from '../date-formatter.js';

describe('Date Formatter', () => {
  describe('formatTickTickDate', () => {
    it('should format Date object to TickTick format', () => {
      const date = new Date('2023-11-13T15:30:45Z');
      const result = formatTickTickDate(date);
      
      expect(result).toBe('2023-11-13T15:30:45+0000');
    });

    it('should format ISO string to TickTick format', () => {
      const isoString = '2023-11-13T15:30:45.123Z';
      const result = formatTickTickDate(isoString);
      
      expect(result).toBe('2023-11-13T15:30:45+0000');
    });

    it('should format date string to TickTick format', () => {
      const dateString = '2023-11-13 15:30:45 UTC';
      const result = formatTickTickDate(dateString);
      
      expect(result).toBe('2023-11-13T15:30:45+0000');
    });

    it('should handle timezone offsets correctly', () => {
      const date = new Date('2023-11-13T15:30:45+05:00');
      const result = formatTickTickDate(date);
      
      // Should convert to UTC
      expect(result).toBe('2023-11-13T10:30:45+0000');
    });

    it('should pad single digit values', () => {
      const date = new Date('2023-01-05T08:05:09Z');
      const result = formatTickTickDate(date);
      
      expect(result).toBe('2023-01-05T08:05:09+0000');
    });

    it('should return undefined for undefined input', () => {
      const result = formatTickTickDate(undefined);
      
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid date string', () => {
      const result = formatTickTickDate('invalid-date');
      
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid Date object', () => {
      const invalidDate = new Date('invalid');
      const result = formatTickTickDate(invalidDate);
      
      expect(result).toBeUndefined();
    });

    it('should handle empty string', () => {
      const result = formatTickTickDate('');
      
      expect(result).toBeUndefined();
    });

    it('should handle edge case dates', () => {
      // Leap year
      const leapDate = new Date('2024-02-29T23:59:59Z');
      expect(formatTickTickDate(leapDate)).toBe('2024-02-29T23:59:59+0000');
      
      // Year boundary
      const newYear = new Date('2024-01-01T00:00:00Z');
      expect(formatTickTickDate(newYear)).toBe('2024-01-01T00:00:00+0000');
      
      // End of year
      const endYear = new Date('2023-12-31T23:59:59Z');
      expect(formatTickTickDate(endYear)).toBe('2023-12-31T23:59:59+0000');
    });
  });

  describe('parseTickTickDate', () => {
    it('should parse TickTick format to Date object', () => {
      const tickTickDate = '2023-11-13T15:30:45+0000';
      const result = parseTickTickDate(tickTickDate);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2023-11-13T15:30:45.000Z');
    });

    it('should parse with positive timezone offset', () => {
      const tickTickDate = '2023-11-13T15:30:45+0500';
      const result = parseTickTickDate(tickTickDate);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2023-11-13T10:30:45.000Z');
    });

    it('should parse with negative timezone offset', () => {
      const tickTickDate = '2023-11-13T15:30:45-0800';
      const result = parseTickTickDate(tickTickDate);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2023-11-13T23:30:45.000Z');
    });

    it('should parse ISO format as fallback', () => {
      const isoDate = '2023-11-13T15:30:45.123Z';
      const result = parseTickTickDate(isoDate);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2023-11-13T15:30:45.123Z');
    });

    it('should return undefined for undefined input', () => {
      const result = parseTickTickDate(undefined);
      
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid date string', () => {
      const result = parseTickTickDate('invalid-date');
      
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = parseTickTickDate('');
      
      expect(result).toBeUndefined();
    });

    it('should handle malformed TickTick format', () => {
      const malformed = '2023-11-13T15:30:45+00:00'; // Has colon in timezone
      const result = parseTickTickDate(malformed);
      
      // Should still parse via fallback
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2023-11-13T15:30:45.000Z');
    });

    it('should be reversible with formatTickTickDate', () => {
      const originalDate = new Date('2023-11-13T15:30:45Z');
      const formatted = formatTickTickDate(originalDate);
      const parsed = parseTickTickDate(formatted!);
      
      expect(parsed?.toISOString()).toBe(originalDate.toISOString());
    });

    it('should handle edge case dates', () => {
      // Leap year
      const leapDate = parseTickTickDate('2024-02-29T23:59:59+0000');
      expect(leapDate?.toISOString()).toBe('2024-02-29T23:59:59.000Z');
      
      // Year boundary
      const newYear = parseTickTickDate('2024-01-01T00:00:00+0000');
      expect(newYear?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });
});