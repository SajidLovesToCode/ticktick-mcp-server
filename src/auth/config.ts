/**
 * Authentication Configuration
 */

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthUrls {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint?: string;
}

export const DEFAULT_OAUTH_URLS: OAuthUrls = {
  authorizationEndpoint: 'https://ticktick.com/oauth/authorize',
  tokenEndpoint: 'https://ticktick.com/oauth/token',
  registrationEndpoint: 'https://ticktick.com/oauth/register'
};

export const DEFAULT_SCOPES = [
  'tasks:read',
  'tasks:write',
  'projects:read',
  'projects:write'
];

export const DEFAULT_REDIRECT_URI = 'http://localhost:8080/callback';