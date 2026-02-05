# @cursorvers/guidescope-mcp

MCP server for GuideScope - Japanese medical guideline search prompt generator.

## Installation

```bash
npm install -g @cursorvers/guidescope-mcp
```

## Usage with Claude Desktop / Cursor

Add to your Claude Desktop or Cursor settings:

```json
{
  "mcpServers": {
    "guidescope": {
      "command": "npx",
      "args": ["@cursorvers/guidescope-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "guidescope": {
      "command": "guidescope-mcp"
    }
  }
}
```

## Available Tools

### `generate`

Generate both prompt and search queries.

**Parameters:**
- `query` (required): Search theme
- `preset`: Preset ID (`medical-device`, `clinical-operation`, `research-ethics`, `generative-ai`)
- `difficulty`: Difficulty level (`standard`, `professional`)
- `customKeywords`: Additional keywords array

**Example:**
```
generate({ query: "医療AIの臨床導入における安全管理", preset: "clinical-operation", difficulty: "professional" })
```

### `generatePrompt`

Generate prompt text only.

**Parameters:**
- `query` (required): Search theme
- `preset`: Preset ID
- `difficulty`: Difficulty level

### `generateSearchQueries`

Generate search queries only.

**Parameters:**
- `query` (required): Search theme
- `preset`: Preset ID

### `listPresets`

List all available presets and difficulty levels.

## Presets

| Preset ID | Name | Description |
|-----------|------|-------------|
| `medical-device` | 医療機器開発寄り | SaMD, AI医療機器, PMDA |
| `clinical-operation` | 臨床運用寄り | 3省2ガイドライン, セキュリティ |
| `research-ethics` | 研究倫理寄り | 研究倫理, データ利活用 |
| `generative-ai` | 生成AI寄り | 生成AI, 情報漏えい対策 |

## Difficulty Levels

| Level | Description |
|-------|-------------|
| `standard` | Basic search (10 results) |
| `professional` | Detailed analysis (20 results, e-Gov, proof mode) |

## License

MIT
