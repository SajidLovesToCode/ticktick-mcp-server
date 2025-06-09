import { jest } from '@jest/globals';
import { logger } from '../logger.js';

describe('Logger', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.LOG_LEVEL;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.LOG_LEVEL = originalEnv;
  });

  describe('Log level filtering', () => {
    it('should log messages at or above the configured level', () => {
      process.env.LOG_LEVEL = 'info';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.error('Error message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });

    it('should respect debug level', () => {
      process.env.LOG_LEVEL = 'debug';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.debug('Debug message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });

    it('should use info level by default', () => {
      delete process.env.LOG_LEVEL;
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });
  });

  describe('Log formatting', () => {
    it('should include timestamp in ISO format', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;

      logger.info('Test message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(isoDateRegex));
    });

    it('should include log level in uppercase', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.error('Error test');
      logger.warn('Warn test');
      logger.info('Info test');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    });

    it('should format message with additional arguments', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const testObj = { key: 'value' };
      const testArray = [1, 2, 3];

      logger.info('Test message', testObj, testArray);

      const call = consoleSpy.mock.calls[0][0];
      expect(call).toContain('Test message');
      expect(call).toContain(JSON.stringify(testObj));
      expect(call).toContain(JSON.stringify(testArray));
    });
  });

  describe('Error handling', () => {
    it('should handle circular references in objects', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const circular: any = { a: 1 };
      circular.self = circular;

      expect(() => logger.info('Circular test', circular)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle undefined and null values', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.info('Test', undefined, null);

      const call = consoleSpy.mock.calls[0][0];
      expect(call).toContain('undefined');
      expect(call).toContain('null');
    });
  });
});