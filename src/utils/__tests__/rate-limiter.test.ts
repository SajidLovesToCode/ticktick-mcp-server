import { jest } from '@jest/globals';
import { RateLimiter } from '../rate-limiter.js';
import { RateLimitError, APIError } from '../errors.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    jest.useFakeTimers();
    rateLimiter = new RateLimiter(2, {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    rateLimiter.clear();
  });

  describe('Rate limiting', () => {
    it('should enforce rate limit between requests', async () => {
      const operation1 = jest.fn().mockResolvedValue('result1');
      const operation2 = jest.fn().mockResolvedValue('result2');

      const promise1 = rateLimiter.execute(operation1);
      const promise2 = rateLimiter.execute(operation2);

      // First request should execute immediately
      expect(operation1).toHaveBeenCalled();
      expect(operation2).not.toHaveBeenCalled();

      // Advance time to allow second request
      jest.advanceTimersByTime(500); // 2 req/s = 500ms interval

      expect(operation2).toHaveBeenCalled();

      const results = await Promise.all([promise1, promise2]);
      expect(results).toEqual(['result1', 'result2']);
    });

    it('should queue multiple requests', async () => {
      const operations = Array(5).fill(null).map((_, i) => 
        jest.fn().mockResolvedValue(`result${i}`)
      );

      const promises = operations.map(op => rateLimiter.execute(op));

      // Process all requests with proper timing
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(500);
      }

      const results = await Promise.all(promises);
      expect(results).toEqual(['result0', 'result1', 'result2', 'result3', 'result4']);
      operations.forEach(op => expect(op).toHaveBeenCalledTimes(1));
    });

    it('should handle different rate limits', async () => {
      rateLimiter = new RateLimiter(10); // 10 req/s = 100ms interval
      
      const operation1 = jest.fn().mockResolvedValue('result1');
      const operation2 = jest.fn().mockResolvedValue('result2');

      rateLimiter.execute(operation1);
      rateLimiter.execute(operation2);

      expect(operation1).toHaveBeenCalled();
      expect(operation2).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(operation2).toHaveBeenCalled();
    });
  });

  describe('Retry logic', () => {
    it('should retry on rate limit error', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new RateLimitError())
        .mockRejectedValueOnce(new RateLimitError())
        .mockResolvedValue('success');

      const promise = rateLimiter.execute(operation);

      // Advance through retries
      jest.advanceTimersByTime(1000); // First retry
      jest.advanceTimersByTime(2000); // Second retry (exponential backoff)

      const result = await promise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should respect retryAfter header', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new RateLimitError('Rate limited', 5)) // 5 seconds
        .mockResolvedValue('success');

      const promise = rateLimiter.execute(operation);

      jest.advanceTimersByTime(4999);
      expect(operation).toHaveBeenCalledTimes(1); // No retry yet

      jest.advanceTimersByTime(1);
      expect(operation).toHaveBeenCalledTimes(2); // Retry after 5 seconds

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should retry on retryable API errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new APIError('Server error', 503))
        .mockRejectedValueOnce(new APIError('Gateway timeout', 504))
        .mockResolvedValue('success');

      const promise = rateLimiter.execute(operation);

      jest.advanceTimersByTime(1000); // First retry
      jest.advanceTimersByTime(2000); // Second retry

      const result = await promise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new APIError('Bad request', 400));

      const promise = rateLimiter.execute(operation);
      
      await expect(promise).rejects.toThrow('Bad request');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const operation = jest.fn()
        .mockRejectedValue(new RateLimitError());

      const promise = rateLimiter.execute(operation);

      // Advance through all retries
      for (let i = 0; i <= 3; i++) {
        jest.advanceTimersByTime(30000); // Max delay
      }

      await expect(promise).rejects.toThrow(RateLimitError);
      expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should apply exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new APIError('Error', 503))
        .mockRejectedValueOnce(new APIError('Error', 503))
        .mockRejectedValueOnce(new APIError('Error', 503))
        .mockResolvedValue('success');

      const promise = rateLimiter.execute(operation);

      // Check exponential delays
      jest.advanceTimersByTime(999);
      expect(operation).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(1); // 1000ms total
      expect(operation).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(1999);
      expect(operation).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(1); // 2000ms more = 3000ms total
      expect(operation).toHaveBeenCalledTimes(3);
      
      jest.advanceTimersByTime(3999);
      expect(operation).toHaveBeenCalledTimes(3);
      
      jest.advanceTimersByTime(1); // 4000ms more = 7000ms total
      expect(operation).toHaveBeenCalledTimes(4);

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('Queue management', () => {
    it('should report queue length', () => {
      expect(rateLimiter.getQueueLength()).toBe(0);

      rateLimiter.execute(() => Promise.resolve());
      rateLimiter.execute(() => Promise.resolve());
      rateLimiter.execute(() => Promise.resolve());

      expect(rateLimiter.getQueueLength()).toBe(2); // First one is being processed
    });

    it('should clear queue and reject pending requests', async () => {
      const operations = Array(3).fill(null).map(() => 
        jest.fn().mockResolvedValue('result')
      );

      const promises = operations.map(op => rateLimiter.execute(op));

      expect(rateLimiter.getQueueLength()).toBe(2);

      rateLimiter.clear();

      expect(rateLimiter.getQueueLength()).toBe(0);

      // First request might succeed, others should be rejected
      const results = await Promise.allSettled(promises);
      const rejected = results.filter(r => r.status === 'rejected');
      expect(rejected.length).toBeGreaterThanOrEqual(2);
      rejected.forEach(r => {
        if (r.status === 'rejected') {
          expect(r.reason.message).toBe('Rate limiter cleared');
        }
      });
    });
  });

  describe('Error propagation', () => {
    it('should propagate non-retryable errors', async () => {
      const error = new Error('Custom error');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(rateLimiter.execute(operation)).rejects.toThrow('Custom error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle operation that throws synchronously', async () => {
      const operation = jest.fn(() => {
        throw new Error('Sync error');
      });

      await expect(rateLimiter.execute(operation)).rejects.toThrow('Sync error');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle mixed success and failure operations', async () => {
      const operations = [
        jest.fn().mockResolvedValue('success1'),
        jest.fn().mockRejectedValue(new Error('failure1')),
        jest.fn().mockResolvedValue('success2'),
        jest.fn().mockRejectedValue(new Error('failure2')),
      ];

      const promises = operations.map(op => rateLimiter.execute(op));

      // Process all requests
      for (let i = 0; i < 4; i++) {
        jest.advanceTimersByTime(500);
      }

      const results = await Promise.allSettled(promises);

      expect(results[0]).toEqual({ status: 'fulfilled', value: 'success1' });
      expect(results[1]).toEqual({ status: 'rejected', reason: expect.any(Error) });
      expect(results[2]).toEqual({ status: 'fulfilled', value: 'success2' });
      expect(results[3]).toEqual({ status: 'rejected', reason: expect.any(Error) });
    });
  });
});