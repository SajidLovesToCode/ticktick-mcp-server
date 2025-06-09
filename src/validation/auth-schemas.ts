import { z } from 'zod';

// OAuth configuration schema
export const OAuthConfigSchema = z.object({
  client_id: z.string().min(1).describe('OAuth client ID'),
  client_secret: z.string().min(1).describe('OAuth client secret'),
  redirect_uri: z.string().url().describe('OAuth redirect URI'),
});

// Environment configuration schema
export const EnvConfigSchema = z.object({
  TICKTICK_CLIENT_ID: z.string().min(1).describe('TickTick OAuth client ID'),
  TICKTICK_CLIENT_SECRET: z.string().min(1).describe('TickTick OAuth client secret'),
  TICKTICK_REDIRECT_URI: z.string().url().default('http://localhost:8080/callback'),
  TICKTICK_CREDENTIALS_PATH: z.string().optional().describe('Path to credentials file'),
  ENCRYPTION_KEY: z.string().length(32).optional().describe('32-character encryption key'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
});

// Token schema
export const TokenSchema = z.object({
  access_token: z.string().describe('OAuth access token'),
  refresh_token: z.string().optional().describe('OAuth refresh token'),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().optional().describe('Token expiry in seconds'),
  expires_at: z.number().optional().describe('Token expiry timestamp'),
  scope: z.string().optional().describe('OAuth scopes'),
});

// Stored credentials schema
export const StoredCredentialsSchema = z.object({
  tokens: TokenSchema,
  createdAt: z.string().datetime().describe('When credentials were created'),
  updatedAt: z.string().datetime().describe('When credentials were last updated'),
  clientId: z.string().describe('Associated client ID'),
});

// Type exports
export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;
export type EnvConfig = z.infer<typeof EnvConfigSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type StoredCredentials = z.infer<typeof StoredCredentialsSchema>;