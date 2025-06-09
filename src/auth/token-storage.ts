/**
 * Simple Token Storage using JSON file
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { TokenInfo } from './oauth-manager.js';
import { logger } from '../utils/logger.js';

const CREDENTIALS_FILE = '.ticktick-mcp-server-credentials.json';

export class TokenStorage {
  private credentialsPath: string;

  constructor() {
    // Priority order:
    // 1. Environment variable TICKTICK_CREDENTIALS_PATH
    // 2. User's home directory
    // 3. Current working directory (fallback)
    
    if (process.env.TICKTICK_CREDENTIALS_PATH) {
      this.credentialsPath = process.env.TICKTICK_CREDENTIALS_PATH;
    } else {
      try {
        const home = homedir();
        this.credentialsPath = join(home, CREDENTIALS_FILE);
      } catch (error) {
        logger.warn('Unable to determine home directory, using current directory');
        this.credentialsPath = join(process.cwd(), CREDENTIALS_FILE);
      }
    }
  }

  async saveToken(tokenInfo: TokenInfo): Promise<void> {
    try {
      const tokenData = {
        ...tokenInfo,
        expiresAt: tokenInfo.expiresAt?.toISOString(),
      };

      await fs.writeFile(this.credentialsPath, JSON.stringify(tokenData, null, 2));
      logger.info(`Credentials saved to ${this.credentialsPath}`);
    } catch (error) {
      logger.error('Failed to save credentials:', error);
      throw error;
    }
  }

  async getToken(): Promise<TokenInfo | null> {
    try {
      const data = await fs.readFile(this.credentialsPath, 'utf-8');
      const tokenData = JSON.parse(data);

      return {
        ...tokenData,
        expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt) : undefined,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return null
        return null;
      }
      
      logger.error('Failed to read credentials:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await fs.unlink(this.credentialsPath);
      logger.info(`Credentials cleared from ${this.credentialsPath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, nothing to clear
        return;
      }
      logger.error('Failed to clear credentials:', error);
    }
  }
}