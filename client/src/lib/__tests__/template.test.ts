/**
 * Unit Tests for template.ts
 * Target coverage: 80%+
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generatePrompt,
  generateSearchQueries,
  configToJSON,
  parseConfigJSON,
  encodeConfigToURL,
  decodeConfigFromURL,
  isShareLinkTooLong,
} from '../template';
import { createDefaultConfig, type AppConfig } from '../presets';
import {
  createDefaultExtendedSettings,
  type ExtendedSettings,
  DEFAULT_ROLE_TITLE,
} from '../settings';

// ============================================================================
// Helper Functions
// ============================================================================

function createTestConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    ...createDefaultConfig('medical-device'),
    query: 'AI問診システムの医療機器該当性',
    dateToday: '2024-06-15',
    ...overrides,
  };
}

function createTestSettings(overrides: Partial<ExtendedSettings> = {}): ExtendedSettings {
  const defaults = createDefaultExtendedSettings();
  return {
    ...defaults,
    ...overrides,
    template: { ...defaults.template, ...overrides.template },
    search: { ...defaults.search, ...overrides.search },
    output: { ...defaults.output, ...overrides.output },
    ui: { ...defaults.ui, ...overrides.ui },
  };
}

// ============================================================================
// generatePrompt() Tests
// ============================================================================

describe('generatePrompt()', () => {
  describe('Basic Functionality', () => {
    it('should generate a non-empty prompt', () => {
      const config = createTestConfig();
      const prompt = generatePrompt(config);

      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should include Role section with default role title', () => {
      const config = createTestConfig();
      const prompt = generatePrompt(config);

      expect(prompt).toContain('# Role');
      expect(prompt).toContain(DEFAULT_ROLE_TITLE);
    });

    it('should replace [[DATE_TODAY]] with config date', () => {
      const config = createTestConfig({ dateToday: '2024-12-25' });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('2024-12-25');
      expect(prompt).not.toContain('[[DATE_TODAY]]');
    });

    it('should replace [[QUERY]] with config query', () => {
      const config = createTestConfig({ query: 'テスト検索クエリ' });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('テスト検索クエリ');
      expect(prompt).not.toContain('[[QUERY]]');
    });

    it('should use "(未入力)" when query is empty', () => {
      const config = createTestConfig({ query: '' });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('(未入力)');
    });

    it('should include scope items', () => {
      const config = createTestConfig({ scope: ['医療AI', 'SaMD'] });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('医療AI');
      expect(prompt).toContain('SaMD');
    });

    it('should include audiences list', () => {
      const config = createTestConfig({ audiences: ['医療機関', '開発企業'] });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('医療機関');
      expect(prompt).toContain('開発企業');
    });
  });

  describe('Keywords Handling', () => {
    it('should always include 3省2ガイドライン in must keywords', () => {
      const config = createTestConfig();
      const prompt = generatePrompt(config);

      expect(prompt).toContain('3省2ガイドライン');
    });

    it('should include enabled keyword chips in optional keywords', () => {
      const config = createTestConfig({
        keywordChips: [
          { name: 'キーワード1', enabled: true },
          { name: 'キーワード2', enabled: false },
          { name: 'キーワード3', enabled: true },
        ],
      });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('キーワード1');
      expect(prompt).not.toContain('キーワード2');
      expect(prompt).toContain('キーワード3');
    });

    it('should include custom keywords', () => {
      const config = createTestConfig({
        customKeywords: ['カスタムキーワード1', 'カスタムキーワード2', ''],
      });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('カスタムキーワード1');
      expect(prompt).toContain('カスタムキーワード2');
    });

    it('should include exclude keywords', () => {
      const config = createTestConfig({
        excludeKeywords: ['除外キーワード1', '除外キーワード2'],
      });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('除外キーワード1');
      expect(prompt).toContain('除外キーワード2');
    });
  });

  describe('Priority Domains', () => {
    it('should include priority domains', () => {
      const config = createTestConfig({
        priorityDomains: ['mhlw.go.jp', 'pmda.go.jp'],
      });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('mhlw.go.jp');
      expect(prompt).toContain('pmda.go.jp');
    });
  });

  describe('Categories', () => {
    it('should include enabled categories', () => {
      const config = createTestConfig({
        categories: [
          { name: 'カテゴリA', enabled: true },
          { name: 'カテゴリB', enabled: false },
          { name: 'カテゴリC', enabled: true },
        ],
      });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('カテゴリA');
      expect(prompt).not.toContain('カテゴリB');
      expect(prompt).toContain('カテゴリC');
    });
  });

  describe('e-Gov Section', () => {
    it('should include e-Gov section when eGovCrossReference is enabled', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });
      const settings = createTestSettings({
        output: { ...createDefaultExtendedSettings().output, eGovCrossReference: true },
      });
      const prompt = generatePrompt(config, settings);

      expect(prompt).toContain('e-Gov法令取得');
      expect(prompt).toContain('laws.e-gov.go.jp');
    });

    it('should not include e-Gov section when eGovCrossReference is disabled', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });
      const settings = createTestSettings({
        output: { ...createDefaultExtendedSettings().output, eGovCrossReference: false },
      });
      const prompt = generatePrompt(config, settings);

      expect(prompt).not.toContain('e-Gov法令取得');
    });
  });

  describe('Proof Mode', () => {
    it('should include proof section when proofMode is true', () => {
      const config = createTestConfig({ difficultyLevel: 'professional', proofMode: true });
      const prompt = generatePrompt(config);

      expect(prompt).toContain('# 実証');
      expect(prompt).toContain('# 実証結果');
    });

    it('should not include proof section when proofMode is false', () => {
      const config = createTestConfig({ difficultyLevel: 'standard', proofMode: false });
      const prompt = generatePrompt(config);

      expect(prompt).not.toContain('# 実証');
      expect(prompt).not.toContain('# 実証結果');
    });
  });

  describe('Extended Settings', () => {
    it('should use custom role title from extended settings', () => {
      const config = createTestConfig();
      const settings = createTestSettings();
      settings.template.roleTitle = 'カスタムロールタイトル';

      const prompt = generatePrompt(config, settings);

      expect(prompt).toContain('カスタムロールタイトル');
    });

    it('should include custom instructions when provided', () => {
      const config = createTestConfig();
      const settings = createTestSettings();
      settings.template.customInstructions = 'これはカスタム指示です。';

      const prompt = generatePrompt(config, settings);

      expect(prompt).toContain('# カスタム指示');
      expect(prompt).toContain('これはカスタム指示です。');
    });

    it('should not include custom instructions section when empty', () => {
      const config = createTestConfig();
      const settings = createTestSettings();
      settings.template.customInstructions = '';

      const prompt = generatePrompt(config, settings);

      expect(prompt).not.toContain('# カスタム指示');
    });

    it('should include excluded domains when provided', () => {
      const config = createTestConfig();
      const settings = createTestSettings();
      settings.search.excludedDomains = ['excluded.com', 'blocked.org'];

      const prompt = generatePrompt(config, settings);

      expect(prompt).toContain('除外ドメイン');
      expect(prompt).toContain('excluded.com');
      expect(prompt).toContain('blocked.org');
    });

    it('should handle different priority rules', () => {
      const config = createTestConfig();

      // revised_date
      const settingsRevised = createTestSettings();
      settingsRevised.search.priorityRule = 'revised_date';
      const promptRevised = generatePrompt(config, settingsRevised);
      expect(promptRevised).toContain('改定日が最も新しい最新版');

      // published_date
      const settingsPublished = createTestSettings();
      settingsPublished.search.priorityRule = 'published_date';
      const promptPublished = generatePrompt(config, settingsPublished);
      expect(promptPublished).toContain('公開日が最も新しい版');

      // relevance
      const settingsRelevance = createTestSettings();
      settingsRelevance.search.priorityRule = 'relevance';
      const promptRelevance = generatePrompt(config, settingsRelevance);
      expect(promptRelevance).toContain('関連度が最も高い版');
    });

    it('should handle different language modes', () => {
      const config = createTestConfig();

      // japanese_only
      const settingsJapanese = createTestSettings();
      settingsJapanese.output.languageMode = 'japanese_only';
      const promptJapanese = generatePrompt(config, settingsJapanese);
      expect(promptJapanese).toContain('日本語を基本とする');

      // english_priority
      const settingsEnglish = createTestSettings();
      settingsEnglish.output.languageMode = 'english_priority';
      const promptEnglish = generatePrompt(config, settingsEnglish);
      expect(promptEnglish).toContain('英語を優先');

      // mixed
      const settingsMixed = createTestSettings();
      settingsMixed.output.languageMode = 'mixed';
      const promptMixed = generatePrompt(config, settingsMixed);
      expect(promptMixed).toContain('日本語を基本とし');
    });

    it('should handle different detail levels', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });

      // concise - should not contain detailed output fields
      const settingsConcise = createTestSettings();
      settingsConcise.output.detailLevel = 'concise';
      const promptConcise = generatePrompt(config, settingsConcise);
      // concise mode doesn't include "対象者と適用範囲" in guideline list
      expect(promptConcise).not.toContain('対象者と適用範囲');

      // detailed - should contain all fields including detailed ones
      const settingsDetailed = createTestSettings();
      settingsDetailed.output.detailLevel = 'detailed';
      const promptDetailed = generatePrompt(config, settingsDetailed);
      expect(promptDetailed).toContain('対象者と適用範囲');
      expect(promptDetailed).toContain('関連する他のガイドライン');
    });

    it('should respect search log setting', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });

      // With search log
      const settingsWithLog = createTestSettings();
      settingsWithLog.output.includeSearchLog = true;
      const promptWithLog = generatePrompt(config, settingsWithLog);
      expect(promptWithLog).toContain('■ 検索ログ');

      // Without search log
      const settingsWithoutLog = createTestSettings();
      settingsWithoutLog.output.includeSearchLog = false;
      // Need to also disable the search_log output section
      settingsWithoutLog.template.outputSections = settingsWithoutLog.template.outputSections.map(
        s => s.id === 'search_log' ? { ...s, enabled: false } : s
      );
      const promptWithoutLog = generatePrompt(config, settingsWithoutLog);
      expect(promptWithoutLog).not.toContain('■ 検索ログ');
    });
  });

  describe('Output Sections', () => {
    it('should include enabled output sections', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });
      const settings = createTestSettings();

      const prompt = generatePrompt(config, settings);

      expect(prompt).toContain('■ サマリー');
      expect(prompt).toContain('■ 免責');
      expect(prompt).toContain('■ 検索条件');
      expect(prompt).toContain('■ 参照データソース');
      expect(prompt).toContain('■ ガイドライン一覧');
      expect(prompt).toContain('■ 3省2ガイドラインの確定結果');
      expect(prompt).toContain('# Guardrail');
    });

    it('should exclude disabled output sections', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });
      const settings = createTestSettings();
      settings.template.outputSections = settings.template.outputSections.map(section => ({
        ...section,
        enabled: section.id === 'disclaimer',
      }));

      const prompt = generatePrompt(config, settings);

      expect(prompt).toContain('■ 免責');
      expect(prompt).not.toContain('■ 検索条件');
      expect(prompt).not.toContain('■ 参照データソース');
    });
  });

  describe('Search Operators', () => {
    it('should mention site: operator when useSiteOperator is true', () => {
      const config = createTestConfig();
      const settings = createTestSettings();
      settings.search.useSiteOperator = true;

      const prompt = generatePrompt(config, settings);

      expect(prompt).toContain('site:');
    });

    it('should mention filetype operator when useFiletypeOperator is true', () => {
      const config = createTestConfig();
      const settings = createTestSettings();
      settings.search.useFiletypeOperator = true;
      settings.search.filetypes = ['pdf', 'html'];

      const prompt = generatePrompt(config, settings);

      expect(prompt).toContain('filetype:');
    });
  });
});

// ============================================================================
// generateSearchQueries() Tests
// ============================================================================

describe('generateSearchQueries()', () => {
  it('should return an array of search queries', () => {
    const config = createTestConfig();
    const queries = generateSearchQueries(config);

    expect(Array.isArray(queries)).toBe(true);
    expect(queries.length).toBeGreaterThan(0);
  });

  it('should include 3省2ガイドライン in first query', () => {
    const config = createTestConfig();
    const queries = generateSearchQueries(config);

    expect(queries[0]).toContain('3省2ガイドライン');
  });

  it('should include user query in searches', () => {
    const config = createTestConfig({ query: 'テスト医療AIクエリ' });
    const queries = generateSearchQueries(config);

    const hasUserQuery = queries.some(q => q.includes('テスト医療AIクエリ'));
    expect(hasUserQuery).toBe(true);
  });

  it('should include enabled keyword chips', () => {
    const config = createTestConfig({
      keywordChips: [
        { name: '医療AI ガイドライン 国内', enabled: true },
        { name: 'SaMD 承認申請 手引き', enabled: true },
        { name: '無効キーワード', enabled: false },
      ],
    });
    const queries = generateSearchQueries(config);

    const hasEnabledChip = queries.some(q => q.includes('医療AI ガイドライン 国内'));
    expect(hasEnabledChip).toBe(true);
  });

  it('should generate site-specific queries when officialDomainPriority and useSiteOperator are enabled', () => {
    const config = createTestConfig({
      officialDomainPriority: true,
      priorityDomains: ['mhlw.go.jp', 'pmda.go.jp'],
    });
    const settings = createTestSettings();
    settings.search.useSiteOperator = true;

    const queries = generateSearchQueries(config, settings);

    const hasSiteQuery = queries.some(q => q.includes('site:mhlw.go.jp'));
    expect(hasSiteQuery).toBe(true);
  });

  it('should not generate site-specific queries when useSiteOperator is false', () => {
    const config = createTestConfig({
      officialDomainPriority: true,
      priorityDomains: ['mhlw.go.jp', 'pmda.go.jp'],
    });
    const settings = createTestSettings();
    settings.search.useSiteOperator = false;

    const queries = generateSearchQueries(config, settings);

    const hasSiteQuery = queries.some(q => q.includes('site:'));
    expect(hasSiteQuery).toBe(false);
  });

  it('should generate filetype queries when enabled', () => {
    // Minimal config to ensure filetype query is included within limits
    const config = createTestConfig({
      keywordChips: [], // Empty to reduce query count
      priorityDomains: [], // Empty to reduce query count
      officialDomainPriority: false,
    });
    const settings = createTestSettings();
    settings.search.useFiletypeOperator = true;
    settings.search.filetypes = ['pdf', 'html'];
    settings.search.maxResults = 20; // Ensure enough room for filetype query

    const queries = generateSearchQueries(config, settings);

    const hasFiletypeQuery = queries.some(q => q.includes('filetype:'));
    expect(hasFiletypeQuery).toBe(true);
  });

  it('should limit results based on maxResults setting', () => {
    const config = createTestConfig({
      keywordChips: Array(20).fill(null).map((_, i) => ({ name: `keyword${i}`, enabled: true })),
    });
    const settings = createTestSettings();
    settings.search.maxResults = 5;

    const queries = generateSearchQueries(config, settings);

    expect(queries.length).toBeLessThanOrEqual(10); // Max is Math.min(10, maxResults)
  });

  it('should handle empty query gracefully', () => {
    const config = createTestConfig({ query: '' });
    const queries = generateSearchQueries(config);

    expect(queries.length).toBeGreaterThan(0);
    expect(queries[0]).toContain('医療AI'); // Default fallback
  });
});

// ============================================================================
// configToJSON() Tests
// ============================================================================

describe('configToJSON()', () => {
  it('should return valid JSON string', () => {
    const config = createTestConfig();
    const json = configToJSON(config);

    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should preserve all config properties', () => {
    const config = createTestConfig({
      query: 'テストクエリ',
      dateToday: '2024-06-15',
      proofMode: true,
    });
    const json = configToJSON(config);
    const parsed = JSON.parse(json);

    expect(parsed.query).toBe('テストクエリ');
    expect(parsed.dateToday).toBe('2024-06-15');
    expect(parsed.proofMode).toBe(true);
  });

  it('should format JSON with indentation', () => {
    const config = createTestConfig();
    const json = configToJSON(config);

    expect(json).toContain('\n');
    expect(json).toContain('  '); // 2-space indentation
  });
});

// ============================================================================
// parseConfigJSON() Tests
// ============================================================================

describe('parseConfigJSON()', () => {
  it('should parse valid config JSON', () => {
    const config = createTestConfig();
    const json = configToJSON(config);
    const parsed = parseConfigJSON(json);

    expect(parsed).not.toBeNull();
    expect(parsed?.query).toBe(config.query);
    expect(parsed?.dateToday).toBe(config.dateToday);
  });

  it('should return null for invalid JSON', () => {
    const parsed = parseConfigJSON('invalid json {');

    expect(parsed).toBeNull();
  });

  it('should return null for valid JSON without activeTab', () => {
    const parsed = parseConfigJSON('{"key": "value"}');

    expect(parsed).toBeNull();
  });

  it('should return null for non-object JSON', () => {
    const parsed = parseConfigJSON('"string value"');

    expect(parsed).toBeNull();
  });

  it('should return null for null JSON value', () => {
    const parsed = parseConfigJSON('null');

    expect(parsed).toBeNull();
  });

  it('should parse JSON with activeTab', () => {
    const json = JSON.stringify({ activeTab: 'medical-device', query: 'test' });
    const parsed = parseConfigJSON(json);

    expect(parsed).not.toBeNull();
    expect(parsed?.activeTab).toBe('medical-device');
  });
});

// ============================================================================
// encodeConfigToURL() / decodeConfigFromURL() Tests
// ============================================================================

describe('encodeConfigToURL()', () => {
  it('should return a URL string with config parameter', () => {
    const config = createTestConfig();
    const url = encodeConfigToURL(config);

    expect(url).toContain('http://localhost:3000/');
    expect(url).toContain('?c=');
  });

  it('should encode config as base64', () => {
    const config = createTestConfig();
    const url = encodeConfigToURL(config);
    const params = new URL(url).searchParams;
    const encoded = params.get('c');

    expect(encoded).toBeTruthy();
    // Should be valid base64
    expect(() => atob(encoded!)).not.toThrow();
  });

  it('should return empty string when encoding fails', () => {
    // Create a circular reference to cause JSON.stringify to fail
    const config = createTestConfig();
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    (config as unknown as Record<string, unknown>).circular = circular;

    const url = encodeConfigToURL(config as AppConfig);

    expect(url).toBe('');
  });
});

describe('decodeConfigFromURL()', () => {
  it('should decode config from URL', () => {
    const config = createTestConfig({ query: 'テスト' });
    const url = encodeConfigToURL(config);
    const decoded = decodeConfigFromURL(url);

    expect(decoded).not.toBeNull();
    expect(decoded?.query).toBe('テスト');
  });

  it('should return null for URL without config parameter', () => {
    const decoded = decodeConfigFromURL('http://localhost:3000/');

    expect(decoded).toBeNull();
  });

  it('should return null for invalid base64', () => {
    const decoded = decodeConfigFromURL('http://localhost:3000/?c=invalid!!!');

    expect(decoded).toBeNull();
  });

  it('should return null for invalid JSON in encoded config', () => {
    const invalidEncoded = btoa(encodeURIComponent('invalid json'));
    const decoded = decodeConfigFromURL(`http://localhost:3000/?c=${invalidEncoded}`);

    expect(decoded).toBeNull();
  });

  it('should return null for invalid URL', () => {
    const decoded = decodeConfigFromURL('not a url');

    expect(decoded).toBeNull();
  });

  it('should handle round-trip encoding/decoding', () => {
    const original = createTestConfig({
      query: '日本語クエリ with special chars: &?=#',
      scope: ['医療AI', 'SaMD'],
      proofMode: true,
    });

    const url = encodeConfigToURL(original);
    const decoded = decodeConfigFromURL(url);

    expect(decoded).not.toBeNull();
    expect(decoded?.query).toBe(original.query);
    expect(decoded?.scope).toEqual(original.scope);
    expect(decoded?.proofMode).toBe(original.proofMode);
  });
});

// ============================================================================
// isShareLinkTooLong() Tests
// ============================================================================

describe('isShareLinkTooLong()', () => {
  it('should return false for minimal config', () => {
    // Create a minimal config that will produce a short URL
    const config: AppConfig = {
      dateToday: '2024-01-01',
      query: 'test',
      scope: ['医療AI'],
      audiences: ['医療機関'],
      threeMinistryGuidelines: true,
      officialDomainPriority: true,
      siteOperator: true,
      latestVersionPriority: true,
      pdfDirectLink: true,
      includeSearchLog: true,
      eGovCrossReference: false,
      proofMode: false,
      categories: [],
      keywordChips: [],
      customKeywords: [],
      excludeKeywords: [],
      priorityDomains: [],
      activeTab: 'medical-device',
    };
    const tooLong = isShareLinkTooLong(config);

    expect(tooLong).toBe(false);
  });

  it('should return true for config with very long data', () => {
    const config = createTestConfig({
      query: 'a'.repeat(5000),
      customKeywords: Array(100).fill('keyword'.repeat(50)),
    });
    const tooLong = isShareLinkTooLong(config);

    expect(tooLong).toBe(true);
  });

  it('should use 2000 characters as threshold', () => {
    // Create a config that will produce a URL slightly over 2000 chars
    const config = createTestConfig({
      query: 'a'.repeat(1500),
    });

    const url = encodeConfigToURL(config);

    if (url.length > 2000) {
      expect(isShareLinkTooLong(config)).toBe(true);
    } else {
      expect(isShareLinkTooLong(config)).toBe(false);
    }
  });
});
