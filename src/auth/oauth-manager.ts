/**
 * OAuth 2.1 Manager with PKCE Support
 */

import axios from 'axios';
import crypto from 'crypto';
import http from 'http';
import open from 'open';
import { AuthConfig, OAuthUrls, DEFAULT_OAUTH_URLS } from './config.js';
import { TokenStorage } from './token-storage.js';

export interface TokenInfo {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType: string;
}

export class OAuthManager {
  private tokenStorage: TokenStorage;
  private config: AuthConfig;
  private oauthUrls: OAuthUrls;

  constructor(config: AuthConfig, oauthUrls: OAuthUrls = DEFAULT_OAUTH_URLS) {
    this.config = config;
    this.oauthUrls = oauthUrls;
    this.tokenStorage = new TokenStorage();
  }

  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  async authorize(): Promise<TokenInfo> {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    const state = crypto.randomBytes(16).toString('hex');

    const authParams = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authorizationUri = `${this.oauthUrls.authorizationEndpoint}?${authParams.toString()}`;

    return new Promise((resolve, reject) => {
      const server = http.createServer();
      const url = new URL(this.config.redirectUri);
      const port = parseInt(url.port) || 8080;

      server.listen(port, () => {
        // Server is listening - auth URL will open automatically
        open(authorizationUri);
      });

      server.on('request', async (req, res) => {
        if (!req.url) return;

        const reqUrl = new URL(req.url, `http://localhost:${port}`);
        
        if (reqUrl.pathname === url.pathname) {
          const code = reqUrl.searchParams.get('code');
          const returnedState = reqUrl.searchParams.get('state');
          const error = reqUrl.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Authorization Failed</h1><p>' + error + '</p>');
            server.close();
            reject(new Error(`Authorization failed: ${error}`));
            return;
          }

          if (returnedState !== state) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Invalid State</h1>');
            server.close();
            reject(new Error('Invalid state parameter'));
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>Missing Authorization Code</h1>');
            server.close();
            reject(new Error('Missing authorization code'));
            return;
          }

          try {
            const tokenParams = new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: this.config.clientId,
              client_secret: this.config.clientSecret,
              code,
              redirect_uri: this.config.redirectUri,
              code_verifier: codeVerifier,
            });

            const tokenResponse = await axios.post(
              this.oauthUrls.tokenEndpoint, 
              tokenParams.toString(),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              }
            );

            const tokenData = tokenResponse.data;
            const tokenInfo: TokenInfo = {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
              tokenType: tokenData.token_type || 'Bearer',
            };

            await this.tokenStorage.saveToken(tokenInfo);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Authorization Successful!</h1><p>You can now close this window.</p>');
            server.close();
            resolve(tokenInfo);
          } catch (tokenError) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Token Exchange Failed</h1>');
            server.close();
            reject(tokenError);
          }
        }
      });

      server.on('error', (err) => {
        reject(err);
      });
    });
  }

  async getValidToken(): Promise<string> {
    const tokenInfo = await this.tokenStorage.getToken();
    
    if (!tokenInfo) {
      throw new Error('No token available. Please authorize first.');
    }

    if (tokenInfo.expiresAt && tokenInfo.expiresAt <= new Date()) {
      if (tokenInfo.refreshToken) {
        return await this.refreshToken();
      } else {
        throw new Error('Token expired and no refresh token available. Please re-authorize.');
      }
    }

    return tokenInfo.accessToken;
  }

  private async refreshToken(): Promise<string> {
    const tokenInfo = await this.tokenStorage.getToken();
    
    if (!tokenInfo?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const refreshParams = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: tokenInfo.refreshToken,
      });

      const refreshResponse = await axios.post(
        this.oauthUrls.tokenEndpoint,
        refreshParams.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokenData = refreshResponse.data;
      const newTokenInfo: TokenInfo = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || tokenInfo.refreshToken,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
        tokenType: tokenData.token_type || 'Bearer',
      };

      await this.tokenStorage.saveToken(newTokenInfo);
      return newTokenInfo.accessToken;
    } catch (error) {
      throw new Error('Failed to refresh token: ' + error);
    }
  }

  async clearToken(): Promise<void> {
    await this.tokenStorage.clearToken();
  }
}