// Jest test setup
import { jest } from '@jest/globals';

// Mock environment variables
process.env.TICKTICK_CLIENT_ID = 'test-client-id';
process.env.TICKTICK_CLIENT_SECRET = 'test-client-secret';
process.env.TICKTICK_REDIRECT_URI = 'http://localhost:8080/callback';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

// Mock console to avoid noise
globalThis.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
} as any;