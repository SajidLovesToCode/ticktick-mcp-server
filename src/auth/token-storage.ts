/**
 * Secure Token Storage using OS Keychain
 */

import keytar from 'keytar';
import CryptoJS from 'crypto-js';
import { TokenInfo } from './oauth-manager.js';

const SERVICE_NAME = 'ticktick-mcp-server';
const ACCOUNT_NAME = 'oauth-tokens';

export class TokenStorage {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  private generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async saveToken(tokenInfo: TokenInfo): Promise<void> {
    try {
      const tokenData = JSON.stringify({
        ...tokenInfo,
        expiresAt: tokenInfo.expiresAt?.toISOString(),
      });

      const encryptedData = this.encrypt(tokenData);
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, encryptedData);
    } catch (error) {
      console.warn('Failed to save token to keychain, using fallback storage');
      // Fallback to environment variable or file storage if keytar fails
      await this.saveTokenFallback(tokenInfo);
    }
  }

  async getToken(): Promise<TokenInfo | null> {
    try {
      const encryptedData = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      
      if (!encryptedData) {
        return await this.getTokenFallback();
      }

      const decryptedData = this.decrypt(encryptedData);
      const tokenData = JSON.parse(decryptedData);

      return {
        ...tokenData,
        expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt) : undefined,
      };
    } catch (error) {
      console.warn('Failed to retrieve token from keychain, using fallback storage');
      return await this.getTokenFallback();
    }
  }

  async clearToken(): Promise<void> {
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    } catch (error) {
      console.warn('Failed to clear token from keychain');
    }

    // Also clear fallback storage
    await this.clearTokenFallback();
  }

  // Fallback storage methods for environments where keytar doesn't work
  private async saveTokenFallback(tokenInfo: TokenInfo): Promise<void> {
    // In a real implementation, you might want to use a secure file storage
    // For now, we'll just store in memory or environment
    const tokenData = JSON.stringify({
      ...tokenInfo,
      expiresAt: tokenInfo.expiresAt?.toISOString(),
    });

    process.env.TICKTICK_FALLBACK_TOKEN = this.encrypt(tokenData);
  }

  private async getTokenFallback(): Promise<TokenInfo | null> {
    const encryptedData = process.env.TICKTICK_ACCESS_TOKEN || process.env.TICKTICK_FALLBACK_TOKEN;
    
    if (!encryptedData) {
      return null;
    }

    try {
      // If it's just a plain access token (from environment)
      if (!encryptedData.includes(':')) {
        return {
          accessToken: encryptedData,
          tokenType: 'Bearer',
        };
      }

      // If it's encrypted token data
      const decryptedData = this.decrypt(encryptedData);
      const tokenData = JSON.parse(decryptedData);

      return {
        ...tokenData,
        expiresAt: tokenData.expiresAt ? new Date(tokenData.expiresAt) : undefined,
      };
    } catch (error) {
      console.warn('Failed to parse fallback token data');
      return null;
    }
  }

  private async clearTokenFallback(): Promise<void> {
    delete process.env.TICKTICK_FALLBACK_TOKEN;
  }
}