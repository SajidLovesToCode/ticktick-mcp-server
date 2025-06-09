# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability within this project, please send an email to the maintainer. All security vulnerabilities will be promptly addressed.

## Security Best Practices

### For Users

1. **Never commit credentials**
   - `.ticktick-mcp-server-credentials.json` contains sensitive tokens
   - `ticktick-oauth.keys.json` contains OAuth secrets
   - These files must NEVER be committed to version control

2. **Secure credential storage**
   - Store credentials in a secure location
   - Use `TICKTICK_CREDENTIALS_PATH` to specify a safe directory
   - Ensure proper file permissions (e.g., `chmod 600`)

3. **Environment variables**
   - Never hardcode secrets in code
   - Use environment variables or secure configuration files
   - Keep `.env` files out of version control

4. **Token rotation**
   - Regularly refresh OAuth tokens
   - Revoke tokens when no longer needed
   - Monitor for unauthorized access

### For Developers

1. **Input validation**
   - All user inputs are validated using Zod schemas
   - Never trust external input without validation
   - Sanitize data before using in API calls

2. **Error handling**
   - Never expose sensitive information in error messages
   - Log errors securely without credentials
   - Use the unified error handler for consistent responses

3. **Dependencies**
   - Regularly update dependencies
   - Monitor for security advisories
   - Use `npm audit` to check for vulnerabilities

4. **Code review**
   - Review all code for hardcoded secrets
   - Check for proper error handling
   - Ensure validation is applied consistently

## Known Security Considerations

1. **Token Storage**: Currently, tokens are stored in plain text JSON files. While this follows the MCP pattern, consider implementing encryption for production use.

2. **PKCE Implementation**: OAuth 2.1 with PKCE is used for secure authentication flows.

3. **Rate Limiting**: API calls are rate-limited to prevent abuse.

4. **Logging**: Sensitive information is filtered from logs.

## Security Checklist Before Deployment

- [ ] All credential files added to `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly configured
- [ ] File permissions set correctly on credential files
- [ ] Dependencies up to date
- [ ] Security vulnerabilities addressed (`npm audit`)
- [ ] Error messages don't leak sensitive info
- [ ] Input validation implemented for all endpoints