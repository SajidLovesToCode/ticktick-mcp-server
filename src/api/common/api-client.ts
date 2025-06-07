/**
 * Common API Client for TickTick
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { OAuthManager } from '../../auth/oauth-manager.js';
import { RateLimiter } from '../../utils/rate-limiter.js';
import { APIError, RateLimitError, AuthenticationError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { APIRequestConfig, APIResponse } from './types.js';

export class TickTickAPIClient {
  private axios: AxiosInstance;
  private rateLimiter: RateLimiter;
  private oauthManager: OAuthManager;

  constructor(oauthManager: OAuthManager) {
    this.oauthManager = oauthManager;
    this.rateLimiter = new RateLimiter(2); // 2 requests per second for TickTick

    this.axios = axios.create({
      baseURL: 'https://api.ticktick.com/open/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TickTick-MCP-Server/0.1.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth headers
    this.axios.interceptors.request.use(
      async (config) => {
        try {
          const token = await this.oauthManager.getValidToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          logger.error('Failed to get valid token:', error);
          throw new AuthenticationError('Unable to authenticate request');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              throw new AuthenticationError('Unauthorized - invalid or expired token');
            case 403:
              throw new AuthenticationError('Forbidden - insufficient permissions');
            case 429:
              const retryAfter = error.response.headers['retry-after'];
              throw new RateLimitError(
                'Rate limit exceeded',
                retryAfter ? parseInt(retryAfter) : undefined
              );
            default:
              throw new APIError(
                data?.message || `HTTP ${status} error`,
                status,
                data
              );
          }
        } else if (error.request) {
          throw new APIError('Network error - no response received');
        } else {
          throw new APIError('Request configuration error');
        }
      }
    );
  }

  async request<T>(config: APIRequestConfig): Promise<T> {
    return this.rateLimiter.execute(async () => {
      logger.debug(`API Request: ${config.method} ${config.url}`, {
        params: config.params,
        data: config.data,
      });

      const axiosConfig: AxiosRequestConfig = {
        method: config.method,
        url: config.url,
        data: config.data,
        params: config.params,
        headers: config.headers,
      };

      const response: AxiosResponse<T> = await this.axios.request(axiosConfig);
      
      logger.debug(`API Response: ${config.method} ${config.url}`, {
        status: response.status,
        data: response.data,
      });

      return response.data;
    });
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
    });
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
    });
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url,
    });
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
    });
  }

  getRateLimiterStats(): { queueLength: number } {
    return {
      queueLength: this.rateLimiter.getQueueLength(),
    };
  }
}