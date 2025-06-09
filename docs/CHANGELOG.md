# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- Add new features, changes, and fixes that will be included in the next release -->
<!-- ### Added -->
<!-- ### Changed -->
<!-- ### Fixed -->
<!-- ### Security -->

## [0.2.0] - 2025-06-08

### Added
- ✅ **包括的なテストスイート追加**: Jest設定とユニットテスト（80%カバレッジ目標）
- ✅ **入力検証の実装**: Zodスキーマによる厳密な型チェックと検証
- ✅ **エラーハンドリングの統一**: 一貫性のあるエラーレスポンス形式
- ✅ **ESLint設定追加**: TypeScript向けの厳格なコード品質ルール
- ✅ **ドキュメント拡充**: API仕様書、CHANGELOG、貢献ガイドライン追加
- ✅ **型安全性の向上**: `any`型の排除と適切な型注釈
- Error handler utility (`utils/error-handler.ts`) for standardized error messages
- OpenAPI specification documentation (`docs/api-spec.yaml`)
- Validation schemas for tasks, projects, and authentication
- Test coverage requirements (80% minimum)
- Date formatter utility for ISO to TickTick format conversion
- Security documentation (SECURITY.md)
- Contributing guidelines (docs/CONTRIBUTING.md)
- Example configuration files (`ticktick-oauth.keys.example.json`, `.env.example`)

### Changed
- Replaced all console.log/error statements with structured logger
- Improved error messages with helpful hints and context
- Enhanced type safety by removing `any` types where possible
- Standardized error responses across all tools
- Updated README with security warnings and developer documentation
- Refactored error classes to use consistent naming (TickTickMCPError base class)

### Fixed
- Input validation for all tool parameters
- Consistent error handling in task and project tools
- Logger usage throughout the codebase
- Circular reference handling in logger
- TypeScript type errors in tool implementations

### Security
- Added `.ticktick-mcp-server-credentials.json` to .gitignore
- Added security warnings for plaintext token storage
- Created SECURITY.md with security best practices
- Added credential file permission recommendations

### Technical Improvements
- OAuth 2.1 with PKCE implementation for secure authentication
- Rate limiting and retry logic for API client
- Structured logging and comprehensive error handling
- TypeScript strict mode compliance
- Zod schema-based input validation
- Unified error response format
- Comprehensive test coverage

## [0.1.0] - 2025-06-07

### Added
- ✅ **タスクアップデート機能の改善**: `projectId`パラメータを必須化（API仕様準拠）
- ✅ **バリデーション強化**: より詳細なエラーメッセージとヒント提供
- ✅ **プロジェクト管理完全対応**: 作成・更新・削除・アーカイブ機能
- ✅ **日付フォーマット改善**: 自動的なTickTick API形式への変換
- ✅ **エラーハンドリング強化**: API失敗時の詳細診断情報
- ✅ **MCP クライアント対応**: Claude Desktopでの安定動作

### Changed
- OAuth 2.1 authentication with PKCE support
- Complete task management tools (create, read, update, delete, complete, search)
- Complete project management tools (create, read, update, delete, archive)
- Rate limiting with exponential backoff
- Automatic token refresh
- Comprehensive error handling with custom error types
- MCP-compliant tool definitions

### Fixed
- Task update projectId requirement
- Date formatting for TickTick API compatibility
- Schema validation issues for MCP clients

## [0.0.1] - 2025-01-01

### Added
- Initial project structure
- Basic OAuth authentication flow
- Core API client implementation
- Initial task and project tools
- Token storage with file-based persistence

[Unreleased]: https://github.com/your-username/ticktick-mcp-server/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-username/ticktick-mcp-server/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-username/ticktick-mcp-server/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/your-username/ticktick-mcp-server/releases/tag/v0.0.1