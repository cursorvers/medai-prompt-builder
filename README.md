# GuideScope - 医療AI 国内ガイドライン探索

医療AI関連の国内ガイドラインを一次資料から探索するためのプロンプトを生成するWebアプリです。

## デモ

**https://cursorvers.github.io/guidescope/**

## 特徴

- **一次資料優先**: 官公庁の公式サイト（mhlw.go.jp, pmda.go.jp等）を優先検索
- **個別ケース対応**: 具体的な質問に対して該当箇所を引用して直接回答
- **製品/サービス検索**: 製品名が含まれる場合、提供企業の公式HPも検索対象に追加
- **目的別プリセット**: 医療機器開発、臨床運用、研究倫理、生成AI の4パターン

## 使い方

1. **目的プリセットを選択**: 医療機器開発寄り / 臨床運用寄り / 研究倫理寄り / 生成AI寄り
2. **探索テーマを入力**: 例「AI問診システムの責任分界点の決め方」
3. **プロンプトを生成**: Gemini等のLLMに貼り付けて実行

## 出力されるプロンプトの構成

| セクション | 内容 |
|-----------|------|
| Role | ゼロ知識のガイドライン探索エージェント |
| Rules | 公式優先、個別ケース対応、回答の具体性 等 |
| Task | Phase 1-5（探索計画〜個別ケース分析） |
| Output | 免責、検索条件、個別ケースへの回答、ガイドライン一覧 |

## 技術スタック

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Hosting**: GitHub Pages
- **Packages**: Monorepo (pnpm workspaces)

## パッケージ構成

```
guidescope/
├── client/           # Web UI (GitHub Pages)
├── packages/
│   ├── core/         # @cursorversinc/guidescope - コアライブラリ
│   └── mcp/          # @cursorversinc/guidescope-mcp - MCP サーバー
```

### npm パッケージ

```bash
npm install @cursorversinc/guidescope
```

```typescript
import { generate, generatePrompt, generateSearchQueries } from '@cursorversinc/guidescope';

// プロンプトと検索クエリを生成
const result = generate({
  query: '医療AIの臨床導入における安全管理',
  preset: 'medical-device',      // optional
  difficulty: 'professional',    // optional
});

console.log(result.prompt);        // 生成されたプロンプト
console.log(result.searchQueries); // 検索クエリ一覧
```

### MCP サーバー（Claude Desktop / Cursor）

```json
{
  "mcpServers": {
    "guidescope": {
      "command": "npx",
      "args": ["@cursorversinc/guidescope-mcp"]
    }
  }
}
```

利用可能なツール:
- `generate` - プロンプトと検索クエリを生成
- `generatePrompt` - プロンプトのみ生成
- `generateSearchQueries` - 検索クエリのみ生成
- `listPresets` - 利用可能なプリセット一覧

## ローカル開発

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動（Web UI）
pnpm dev

# Web UI ビルド
pnpm build

# パッケージビルド（npm + MCP）
pnpm build:packages
```

## 免責事項

**本ツールは情報整理支援を目的としています。**

- 本ツールは医療行為、法的助言、規制判断を行いません
- 出力されるプロンプトの利用結果について、開発者は一切の責任を負いません
- 個別ケースについては医師、弁護士、薬事専門家等の有資格者にご相談ください
- ガイドラインの解釈や適用は必ず一次資料で確認してください

## 商標について

本プロジェクトで言及されるサービス名は各社の商標または登録商標です：

- Gemini, Google は Google LLC の商標です
- ChatGPT, GPT-4, OpenAI は OpenAI, Inc. の商標です
- Claude は Anthropic, PBC の商標です
- Perplexity は Perplexity AI, Inc. の商標です
- Microsoft Copilot は Microsoft Corporation の商標です

本プロジェクトはこれらの企業と提携・承認関係にありません。

## ライセンス

MIT

## 作成者

Built with [Claude Code](https://claude.ai/code)
