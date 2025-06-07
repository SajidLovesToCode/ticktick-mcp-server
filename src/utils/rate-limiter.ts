/**
 * Rate Limiter with Retry Logic
 */

import { RateLimitError, isRetryableError, getRetryDelay } from './errors.js';
import { logger } from './logger.js';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class RateLimiter {
  private requestQueue: Array<{ timestamp: number; resolve: Function; reject: Function }> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minInterval: number; // Minimum interval between requests in milliseconds

  constructor(
    private requestsPerSecond: number = 2, // TickTick API typical limit
    private retryConfig: RetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    }
  ) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        timestamp: Date.now(),
        resolve: async () => {
          try {
            const result = await this.executeWithRetry(operation);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        reject,
      });

      this.processQueue();
    });
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!isRetryableError(error) || attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        const delay = getRetryDelay(error, attempt);
        logger.warn(`Request failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), retrying in ${delay}ms`, error);
        
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      
      // Ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest;
        await this.delay(waitTime);
      }

      this.lastRequestTime = Date.now();
      
      try {
        await request.resolve();
      } catch (error) {
        request.reject(error);
      }
    }

    this.isProcessing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getQueueLength(): number {
    return this.requestQueue.length;
  }

  clear(): void {
    this.requestQueue.forEach(request => {
      request.reject(new Error('Rate limiter cleared'));
    });
    this.requestQueue = [];
    this.isProcessing = false;
  }
}