# @cursorversinc/guidescope

Japanese medical guideline search prompt generator for AI assistants.

## Installation

```bash
npm install @cursorversinc/guidescope
```

## Usage

### Simple Usage

```typescript
import { generate } from '@cursorversinc/guidescope';

const result = generate({
  query: '医療AIの臨床導入における安全管理',
});

console.log(result.prompt);        // Generated prompt
console.log(result.searchQueries); // Search queries
console.log(result.config);        // Full configuration
```

### With Options

```typescript
import { generate } from '@cursorversinc/guidescope';

const result = generate({
  query: '医療AIの臨床導入における安全管理',
  preset: 'clinical-operation',      // 'medical-device' | 'clinical-operation' | 'research-ethics' | 'generative-ai'
  difficulty: 'professional',         // 'standard' | 'professional'
  customKeywords: ['透析患者', '在宅医療'],
  scope: ['医療AI', '生成AI'],
  audiences: ['医療機関', '開発企業'],
});
```

### Generate Only Prompt

```typescript
import { generatePrompt } from '@cursorversinc/guidescope';

const prompt = generatePrompt({
  query: 'SaMD承認申請',
  preset: 'medical-device',
});
```

### Generate Only Search Queries

```typescript
import { generateSearchQueries } from '@cursorversinc/guidescope';

const queries = generateSearchQueries({
  query: '生成AI 医療',
  preset: 'generative-ai',
});
```

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
| `standard` | Basic search (10 results, no e-Gov cross-reference) |
| `professional` | Detailed analysis (20 results, e-Gov cross-reference, proof mode) |

## API Reference

### `generate(options)`

Generate prompt, search queries, and full configuration.

**Parameters:**
- `query` (required): Search theme
- `preset`: Preset ID (default: `'medical-device'`)
- `difficulty`: Difficulty level (default: `'standard'`)
- `scope`: Target scope array
- `audiences`: Target audiences array
- `customKeywords`: Additional keywords
- `priorityDomains`: Priority domains for search
- `date`: Date override (default: today)

**Returns:** `{ prompt, searchQueries, config }`

### `generatePrompt(options)`

Generate prompt text only.

### `generateSearchQueries(options)`

Generate search queries only.

### `createConfig(options)`

Create AppConfig from options.

## License

MIT
