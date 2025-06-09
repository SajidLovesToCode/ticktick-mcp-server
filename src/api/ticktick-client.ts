/**
 * Main TickTick Client Integration
 */

import { TickTickAPIClient } from './common/api-client.js';
import { TasksAPI } from './tasks/tasks-api.js';
import { ProjectsAPI } from './projects/projects-api.js';
import { OAuthManager } from '../auth/oauth-manager.js';
import { AuthConfig, DEFAULT_OAUTH_URLS, DEFAULT_SCOPES, DEFAULT_REDIRECT_URI } from '../auth/config.js';
import { ConfigurationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class TickTickClient {
  private apiClient: TickTickAPIClient;
  private oauthManager: OAuthManager;
  public tasks: TasksAPI;
  public projects: ProjectsAPI;

  constructor(config?: Partial<AuthConfig>) {
    // Try to load from ticktick-oauth.keys.json first
    let fileConfig: Partial<AuthConfig> = {};
    const configFilePath = join(process.cwd(), 'ticktick-oauth.keys.json');
    
    if (existsSync(configFilePath)) {
      try {
        const fileContent = readFileSync(configFilePath, 'utf-8');
        const jsonConfig = JSON.parse(fileContent);
        fileConfig = {
          clientId: jsonConfig.client_id,
          clientSecret: jsonConfig.client_secret,
          redirectUri: jsonConfig.redirect_uri || DEFAULT_REDIRECT_URI,
        };
        logger.info('Loaded configuration from ticktick-oauth.keys.json');
      } catch (error) {
        logger.warn('Failed to read ticktick-oauth.keys.json:', error);
      }
    }

    // Load configuration with priority: constructor config > file config > environment variables
    const authConfig: AuthConfig = {
      clientId: config?.clientId || fileConfig.clientId || process.env.TICKTICK_CLIENT_ID || '',
      clientSecret: config?.clientSecret || fileConfig.clientSecret || process.env.TICKTICK_CLIENT_SECRET || '',
      redirectUri: config?.redirectUri || fileConfig.redirectUri || process.env.TICKTICK_REDIRECT_URI || DEFAULT_REDIRECT_URI,
      scopes: config?.scopes || DEFAULT_SCOPES,
    };

    if (!authConfig.clientId || !authConfig.clientSecret) {
      throw new ConfigurationError(
        'TickTick Client ID and Secret are required. Please provide them via ticktick-oauth.keys.json file, environment variables (TICKTICK_CLIENT_ID and TICKTICK_CLIENT_SECRET), or in the constructor.'
      );
    }

    this.oauthManager = new OAuthManager(authConfig, DEFAULT_OAUTH_URLS);
    this.apiClient = new TickTickAPIClient(this.oauthManager);
    
    // Initialize API modules
    this.tasks = new TasksAPI(this.apiClient);
    this.projects = new ProjectsAPI(this.apiClient);

    logger.info('TickTick client initialized');
  }

  async initialize(): Promise<void> {
    logger.info('Initializing TickTick client...');
    
    try {
      // Try to get existing token
      const token = await this.oauthManager.getValidToken();
      logger.info('Using existing valid token');
    } catch (error) {
      logger.warn('No valid token found, authorization required');
      throw new ConfigurationError(
        'No valid authentication token found. Please run the authorization flow first.'
      );
    }
  }

  async authorize(): Promise<void> {
    logger.info('Starting OAuth authorization flow...');
    
    try {
      const tokenInfo = await this.oauthManager.authorize();
      logger.info('Authorization completed successfully');
      logger.debug('Token info:', {
        tokenType: tokenInfo.tokenType,
        expiresAt: tokenInfo.expiresAt,
        hasRefreshToken: !!tokenInfo.refreshToken,
      });
    } catch (error) {
      logger.error('Authorization failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    logger.info('Logging out...');
    await this.oauthManager.clearToken();
    logger.info('Logout completed');
  }

  async getAuthenticationStatus(): Promise<{
    isAuthenticated: boolean;
    tokenExists: boolean;
    tokenValid?: boolean;
    expiresAt?: Date;
  }> {
    try {
      const token = await this.oauthManager.getValidToken();
      return {
        isAuthenticated: true,
        tokenExists: true,
        tokenValid: true,
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        tokenExists: false,
        tokenValid: false,
      };
    }
  }

  getRateLimiterStats(): { queueLength: number } {
    return this.apiClient.getRateLimiterStats();
  }

  // Convenience methods for quick access
  async getProfile(): Promise<any> {
    logger.info('Fetching user profile');
    return this.apiClient.get('/user/profile');
  }

  async getAccountInfo(): Promise<any> {
    logger.info('Fetching account information');
    return this.apiClient.get('/user');
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      // Use project list endpoint for health check as it's confirmed to work
      await this.apiClient.get('/project');
      return { status: 'ok', message: 'TickTick API connection is healthy' };
    } catch (error) {
      return { 
        status: 'error', 
        message: `TickTick API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}