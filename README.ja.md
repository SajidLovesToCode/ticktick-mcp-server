# ticktick-mcp-server

[English version](README.md)

TickTick MCP (Model Context Protocol) Server - ClaudeからTickTickのタスク管理機能を利用するためのMCPサーバー

## 概要

このMCPサーバーは、Claude DesktopからTickTickのタスク管理プラットフォームと連携できるようにします。OAuth 2.1 with PKCE（Proof Key for Code Exchange）を使用した安全な認証を実装し、包括的なタスクとプロジェクト管理機能を提供します。

## 認証認可の仕組み

### OAuth 2.1 with PKCE

このサーバーでは、セキュアな認証のためにOAuth 2.1 with PKCEプロトコルを採用しています：

1. **PKCEによる認証フロー**
   - 認証開始時にcode_verifierとcode_challengeを生成
   - ブラウザでTickTickの認証画面を表示
   - ユーザーの承認後、認証コードを取得
   - 認証コードとcode_verifierを使用してトークンを交換

2. **トークンの保管**
   - アクセストークンを`.ticktick-mcp-server-credentials.json`ファイルに保存
   - **⚠️ セキュリティ警告**: 現在、トークンは平文で保存されます。本番環境での使用を検討している場合は、暗号化の実装を推奨します
   - アクセストークンは絶対に公開しないでください

3. **自動トークン更新**
   - MCPサーバーがトークンの有効期限を自動的に確認
   - 期限切れの場合、リフレッシュトークンで新しいアクセストークンを取得

## セットアップ手順

### 1. 認証情報の設定

TickTick開発者コンソールから取得した認証情報を設定します。以下の3つの方法から選択できます：

#### 方法1: ticktick-oauth.keys.json (推奨)
プロジェクトルートに `ticktick-oauth.keys.json` ファイルを作成：

```json
{
  "client_id": "your_ticktick_client_id",
  "client_secret": "your_ticktick_client_secret",
  "redirect_uri": "http://localhost:8080/callback"
}
```

#### 方法2: 環境変数 (.env)
プロジェクトルートに `.env` ファイルを作成：

```env
TICKTICK_CLIENT_ID=your_ticktick_client_id
TICKTICK_CLIENT_SECRET=your_ticktick_client_secret
TICKTICK_REDIRECT_URI=http://localhost:8080/callback
```

#### 方法3: システム環境変数
シェルで直接設定：

```bash
export TICKTICK_CLIENT_ID=your_ticktick_client_id
export TICKTICK_CLIENT_SECRET=your_ticktick_client_secret
export TICKTICK_REDIRECT_URI=http://localhost:8080/callback
```

**設定の優先順位**:
1. コンストラクタに直接渡された設定（プログラム内で指定）
2. `ticktick-oauth.keys.json` ファイル
3. 環境変数（`.env` ファイルまたはシステム環境変数）

**注意**: 
- 複数の方法で設定されている場合、上記の優先順位に従って読み込まれます
- セキュリティのため、これらのファイルは`.gitignore`に追加されており、リポジトリにはコミットされません
- `your_ticktick_client_id` と `your_ticktick_client_secret` は実際の値に置き換えてください

### トークン保存場所の設定（重要）

認証トークンは以下の優先順位で保存されます：

1. **環境変数 `TICKTICK_CREDENTIALS_PATH`** で指定されたパス（推奨）
2. **ユーザーのホームディレクトリ** (`~/.ticktick-mcp-server-credentials.json`)
3. **現在の作業ディレクトリ** (fallback)

Claude Desktop環境では、`TICKTICK_CREDENTIALS_PATH` 環境変数を設定することを強く推奨します：

```bash
export TICKTICK_CREDENTIALS_PATH=/Users/yourusername/Documents/.ticktick-mcp-server-credentials.json
```

### 2. プロジェクトのビルド

```bash
npm install
npm run build
```

### 開発者向け: テストとコード品質

```bash
# TypeScript型チェック
npm run typecheck

# ESLintでコード品質チェック
npm run lint

# テストの実行
npm test

# テストカバレッジの確認（80%以上を目標）
npm run test:coverage

# テストをウォッチモードで実行
npm run test:watch
```

### 3. 認証の実行

初回利用時は以下のコマンドで認証を行います：

```bash
# 認証フローの開始
npm run start auth
# または
npm run start:auth
```

#### 認証手順
1. 上記コマンドを実行すると、ブラウザが自動的に開きます
2. TickTickのログイン画面でアカウントにログインします
3. アプリケーションへのアクセス許可を承認します
4. 認証が完了すると、トークンが`.ticktick-mcp-server-credentials.json`に保存されます
5. 「Authentication completed successfully!」メッセージが表示されます

### 4. 認証状態の確認

認証が正常に完了しているか確認するには：

```bash
# MCP Inspectorを起動して確認
npm run inspector
```

1. ブラウザで http://localhost:5173 にアクセス
2. MCP Inspectorで「Connect」をクリック
3. `ticktick_auth_status`ツールを実行して認証状態を確認

### 5. 通常起動

認証完了後は以下のコマンドで起動：

```bash
npm run start
```

## 利用可能なMCPツール

### 認証管理
- `ticktick_auth_status`: 認証状態の確認
- `ticktick_authorize`: OAuth認証フローの開始
- `ticktick_logout`: 保存されたトークンのクリア
- `ticktick_health_check`: API接続性のテスト

### タスク管理
- `ticktick_list_tasks`: タスク一覧の取得（フィルタリング・ソート対応）
- `ticktick_get_task`: 特定タスクの詳細取得
- `ticktick_create_task`: 新規タスクの作成
- `ticktick_update_task`: タスクの更新（タイトル、内容、期限、優先度、チェックリスト等）
  - **注意**: `projectId`, `taskId`パラメータは必須です（TickTick API仕様に準拠）
- `ticktick_delete_task`: タスクの削除
- `ticktick_complete_task`: タスクの完了マーク
- `ticktick_uncomplete_task`: タスクの未完了マーク
- `ticktick_search_tasks`: タスクの検索
- `ticktick_get_overdue_tasks`: 期限切れタスクの取得

### プロジェクト管理
- `ticktick_list_projects`: プロジェクト一覧の取得
- `ticktick_get_project`: 特定プロジェクトの詳細取得
- `ticktick_create_project`: 新規プロジェクトの作成
- `ticktick_update_project`: プロジェクトの更新
- `ticktick_delete_project`: プロジェクトの削除
- `ticktick_get_project_tasks`: プロジェクト内のタスク取得
- `ticktick_get_project_stats`: プロジェクト統計の取得
- `ticktick_archive_project`: プロジェクトのアーカイブ
- `ticktick_unarchive_project`: プロジェクトのアーカイブ解除

## API機能について

このMCPサーバーは、TickTick公式OpenAPIに基づいて実装されています：

### サポートされている操作
- ✅ **タスクの作成・更新・削除・完了**
- ✅ **プロジェクトの作成・更新・削除**
- ✅ **プロジェクトのアーカイブ機能**
- ✅ **タスクの検索・フィルタリング**

### 実装の特徴
- **日付フォーマット自動変換**: ISO形式からTickTick API形式への自動変換
- **エラーハンドリング強化**: 詳細なエラーメッセージとトラブルシューティングヒント
- **レート制限対応**: 自動リトライ機能付きAPIクライアント
- **PKCE対応OAuth**: セキュアな認証フロー

## Claude Desktopへの統合

Claude Desktopの設定ファイルに以下を追加：

```json
{
  "mcpServers": {
    "ticktick": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/ticktick-mcp-server/dist/index.js"],
      "env": {
        "TICKTICK_CLIENT_ID": "your_client_id",
        "TICKTICK_CLIENT_SECRET": "your_client_secret",
        "TICKTICK_REDIRECT_URI": "http://localhost:8080/callback",
        "TICKTICK_CREDENTIALS_PATH": "/absolute/path/to/.ticktick-mcp-server-credentials.json",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## トラブルシューティング

### 認証エラーが発生する場合

#### "invalid_request" エラーの場合
```
OAuth Error
error="invalid_request", error_description="At least one redirect_uri must be registered with the client."
```

**原因**: TickTick OAuth アプリケーションにredirect URIが登録されていません。

**解決方法**:
1. [TickTick Developer Portal](https://developer.ticktick.com/manage) にアクセス
2. アプリケーション設定で以下のredirect URIを追加:
   ```
   http://localhost:8080/callback
   ```
3. 設定を保存

**重要**: redirect URIは完全に一致する必要があります（プロトコル、ホスト、ポート、パスすべて）。

#### その他の認証エラー
1. `ticktick-oauth.keys.json`の内容が正しいか確認
2. `redirect_uri`が`http://localhost:8080/callback`に設定されているか確認
3. TickTick開発者コンソールでアプリケーションが有効になっているか確認

### トークンが保存されない場合
1. プロジェクトディレクトリへの書き込み権限を確認
2. `.ticktick-mcp-server-credentials.json`ファイルが作成されているか確認
3. ファイルの内容が正しいJSON形式か確認

### 認証をやり直したい場合
1. `.ticktick-mcp-server-credentials.json`ファイルを削除
2. `npm run start auth`コマンドを再実行

## 最新の更新内容

詳細な変更履歴は[CHANGELOG.md](docs/CHANGELOG.md)をご覧ください。

### v0.2.0 (最新) - 2025-06-08
- ✅ **包括的なテストスイート追加**: Jest設定とユニットテスト（80%カバレッジ目標）
- ✅ **入力検証の実装**: Zodスキーマによる厳密な型チェックと検証
- ✅ **エラーハンドリングの統一**: 一貫性のあるエラーレスポンス形式
- ✅ **ESLint設定追加**: TypeScript向けの厳格なコード品質ルール
- ✅ **ドキュメント拡充**: API仕様書、CHANGELOG、貢献ガイドライン追加
- ✅ **型安全性の向上**: `any`型の排除と適切な型注釈

## セキュリティ

### 重要なセキュリティ上の注意

1. **認証情報の保護**
   - `.ticktick-mcp-server-credentials.json` - 認証トークンを含む
   - `ticktick-oauth.keys.json` - OAuthクライアント秘密情報を含む
   - これらのファイルは**絶対にGitにコミットしないでください**

2. **推奨されるセキュリティ対策**
   - 認証情報ファイルに適切なパーミッションを設定: `chmod 600 .ticktick-mcp-server-credentials.json`
   - 定期的にトークンをローテーション
   - 不要になったトークンは削除
   - 本番環境ではトークンの暗号化を実装

詳細は[セキュリティポリシー](docs/SECURITY.md)を参照してください。

## ドキュメント

- [API仕様書](docs/api-spec.yaml)
- [変更履歴](docs/CHANGELOG.md)
- [開発者向けガイドライン](docs/CONTRIBUTING.md)
- [セキュリティポリシー](docs/SECURITY.md)