import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { TokenStorage } from '../token-storage.js';
import { TokenInfo } from '../oauth-manager.js';

// We need to use manual mocks for ESM

describe('TokenStorage', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockHomedir = homedir as jest.MockedFunction<typeof homedir>;
  
  const testToken: TokenInfo = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    expiresAt: new Date('2024-01-01T12:00:00Z'),
    scope: 'read write',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.TICKTICK_CREDENTIALS_PATH;
    mockHomedir.mockReturnValue('/home/user');
  });

  describe('constructor', () => {
    it('should use TICKTICK_CREDENTIALS_PATH when set', () => {
      process.env.TICKTICK_CREDENTIALS_PATH = '/custom/path/credentials.json';
      const storage = new TokenStorage();
      
      expect(storage['credentialsPath']).toBe('/custom/path/credentials.json');
    });

    it('should use home directory when env var not set', () => {
      const storage = new TokenStorage();
      
      expect(mockHomedir).toHaveBeenCalled();
      expect(storage['credentialsPath']).toBe('/home/user/.ticktick-mcp-server-credentials.json');
    });

    it('should fall back to current directory when homedir fails', () => {
      mockHomedir.mockImplementation(() => {
        throw new Error('No home directory');
      });
      
      const storage = new TokenStorage();
      
      expect(storage['credentialsPath']).toBe(join(process.cwd(), '.ticktick-mcp-server-credentials.json'));
    });
  });

  describe('saveToken', () => {
    it('should save token to file', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      const storage = new TokenStorage();
      
      await storage.saveToken(testToken);
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"accessToken": "test-access-token"'),
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"expiresAt": "2024-01-01T12:00:00.000Z"'),
      );
    });

    it('should handle token without expiresAt', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      const storage = new TokenStorage();
      const tokenWithoutExpiry = { ...testToken, expiresAt: undefined };
      
      await storage.saveToken(tokenWithoutExpiry);
      
      expect(mockFs.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(mockFs.writeFile.mock.calls[0][1] as string);
      expect(savedData.expiresAt).toBeUndefined();
    });

    it('should throw error when write fails', async () => {
      const writeError = new Error('Write failed');
      mockFs.writeFile.mockRejectedValue(writeError);
      const storage = new TokenStorage();
      
      await expect(storage.saveToken(testToken)).rejects.toThrow('Write failed');
    });
  });

  describe('getToken', () => {
    it('should read token from file', async () => {
      const tokenData = {
        ...testToken,
        expiresAt: testToken.expiresAt?.toISOString(),
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(tokenData));
      const storage = new TokenStorage();
      
      const result = await storage.getToken();
      
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.any(String),
        'utf-8',
      );
      expect(result).toEqual(testToken);
    });

    it('should handle token without expiresAt', async () => {
      const tokenData = {
        ...testToken,
        expiresAt: undefined,
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(tokenData));
      const storage = new TokenStorage();
      
      const result = await storage.getToken();
      
      expect(result?.expiresAt).toBeUndefined();
    });

    it('should return null when file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      const storage = new TokenStorage();
      
      const result = await storage.getToken();
      
      expect(result).toBeNull();
    });

    it('should return null when read fails', async () => {
      const error = new Error('Read failed');
      mockFs.readFile.mockRejectedValue(error);
      const storage = new TokenStorage();
      
      const result = await storage.getToken();
      
      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', async () => {
      mockFs.readFile.mockResolvedValue('invalid json');
      const storage = new TokenStorage();
      
      const result = await storage.getToken();
      
      expect(result).toBeNull();
    });
  });

  describe('clearToken', () => {
    it('should delete the credentials file', async () => {
      mockFs.unlink.mockResolvedValue(undefined);
      const storage = new TokenStorage();
      
      await storage.clearToken();
      
      expect(mockFs.unlink).toHaveBeenCalledWith(expect.any(String));
    });

    it('should not throw when file does not exist', async () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.unlink.mockRejectedValue(error);
      const storage = new TokenStorage();
      
      await expect(storage.clearToken()).resolves.not.toThrow();
    });

    it('should log error when deletion fails', async () => {
      const error = new Error('Permission denied');
      mockFs.unlink.mockRejectedValue(error);
      const storage = new TokenStorage();
      
      // Should not throw, just log
      await expect(storage.clearToken()).resolves.not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle save and retrieve cycle', async () => {
      const storage = new TokenStorage();
      
      // Save
      mockFs.writeFile.mockResolvedValue(undefined);
      await storage.saveToken(testToken);
      
      // Retrieve
      const savedData = mockFs.writeFile.mock.calls[0][1] as string;
      mockFs.readFile.mockResolvedValue(savedData);
      const retrieved = await storage.getToken();
      
      expect(retrieved).toEqual(testToken);
    });

    it('should handle clear after save', async () => {
      const storage = new TokenStorage();
      
      // Save
      mockFs.writeFile.mockResolvedValue(undefined);
      await storage.saveToken(testToken);
      
      // Clear
      mockFs.unlink.mockResolvedValue(undefined);
      await storage.clearToken();
      
      // Try to retrieve
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      const result = await storage.getToken();
      
      expect(result).toBeNull();
    });
  });
});