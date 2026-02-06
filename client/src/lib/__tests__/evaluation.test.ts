/**
 * Evaluation Test Cases - Regression Testing for Prompt Quality
 *
 * Purpose: Ensure prompt modifications don't degrade output quality
 * Covers:
 * - Medical query scenarios
 * - Safety guardrails
 * - Output section validation
 * - Privacy detection
 * - Citation format (future)
 */

import { describe, it, expect } from 'vitest';
import { generatePrompt, generateSearchQueries } from '../template';
import { createDefaultConfig, type AppConfig } from '../presets';
import {
  createDefaultExtendedSettings,
  type ExtendedSettings,
} from '../settings';

// Helper: Create test config using proper defaults
function createTestConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    ...createDefaultConfig('medical-device'),
    query: 'AI問診システムの医療機器該当性',
    dateToday: '2024-06-15',
    ...overrides,
  };
}

// Helper: Create extended settings using proper defaults
function createTestSettings(overrides: Partial<ExtendedSettings> = {}): ExtendedSettings {
  const defaults = createDefaultExtendedSettings();
  return {
    ...defaults,
    ...overrides,
    template: { ...defaults.template, ...(overrides.template || {}) },
    search: { ...defaults.search, ...(overrides.search || {}) },
    output: { ...defaults.output, ...(overrides.output || {}) },
    ui: { ...defaults.ui, ...(overrides.ui || {}) },
  };
}

describe('Evaluation Test Cases', () => {
  describe('Medical Query Scenarios', () => {
    it('should generate valid prompt for medical device AI scenario', () => {
      const config = createTestConfig({
        query: 'AI診断支援ソフトウェアの医療機器該当性',
        scope: ['医療機器', 'AI診断支援', 'SaMD'],
      });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      // Core requirements
      expect(prompt).toContain('一次資料');
      expect(prompt).toContain('ブラウジング');
      expect(prompt).toContain('サマリー');

      // Medical context
      expect(prompt).toContain('医療機器');
    });

    it('should generate valid prompt for pharmaceutical scenario', () => {
      const config = createTestConfig({
        query: '新薬の添付文書記載事項',
        scope: ['医薬品', '添付文書', '副作用'],
      });
      config.scope = ['医薬品', '添付文書'];
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      expect(prompt).toContain('一次資料');
    });

    it('should generate valid prompt for clinical research scenario', () => {
      const config = createTestConfig({
        query: '臨床研究の倫理指針',
        scope: ['臨床研究', '倫理指針', 'IRB'],
      });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      expect(prompt).toContain('一次資料');
    });
  });

  describe('Safety Guardrails', () => {
    it('should always include guardrail section', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      expect(prompt).toContain('Guardrail');
      expect(prompt).toContain('推測しない');
    });

    it('should include disclaimer in all outputs', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      expect(prompt).toContain('免責事項');
      expect(prompt).toContain('情報整理支援');
    });

    it('should warn about learning-based answers prohibition', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      expect(prompt).toContain('学習済みの知識');
      expect(prompt).toContain('禁止');
    });
  });

  describe('Output Section Validation', () => {
    it('should include all required sections in standard mode', () => {
      const config = createTestConfig({ difficultyLevel: 'standard' });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      // Required sections
      const requiredSections = [
        'サマリー',
        '引用文献',
      ];

      requiredSections.forEach(section => {
        expect(prompt).toContain(section);
      });
    });

    it('should include Phase 6 verification section', () => {
      const config = createTestConfig();
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      // Phase 6: 反証・検証
      expect(prompt).toContain('反証');
      expect(prompt).toContain('検証');
    });

    it('should include unconfirmed points section', () => {
      const config = createTestConfig();
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      expect(prompt).toContain('未確認事項');
    });

    it('should include search log section when enabled', () => {
      const config = createTestConfig({ difficultyLevel: 'professional', includeSearchLog: true });
      const extSettings = createTestSettings({
        output: {
          ...createDefaultExtendedSettings().output,
          includeSearchLog: true,
        },
      });

      const prompt = generatePrompt(config, extSettings);

      expect(prompt).toContain('検索ログ');
    });

    it('should include references section with citation format', () => {
      const config = createTestConfig();
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      // Should contain citation format instructions
      expect(prompt).toContain('引用番号');
      expect(prompt).toContain('[n]');
    });

    it('should include 3省2ガイドライン structured format', () => {
      const config = createTestConfig({ difficultyLevel: 'professional', threeMinistryGuidelines: true });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      // Should contain 3省2ガイドライン section
      expect(prompt).toContain('3省2ガイドライン');
      expect(prompt).toContain('厚生労働省');
      expect(prompt).toContain('経済産業省');
      expect(prompt).toContain('責任分界');
    });
  });

  describe('Search Query Generation', () => {
    it('should generate queries with proper site operators', () => {
      const config = createTestConfig({
        scope: ['医療機器', 'AI'],
        siteOperator: true,
      });
      const extSettings = createTestSettings({
        search: {
          ...createDefaultExtendedSettings().search,
          useSiteOperator: true,
        },
      });

      const queries = generateSearchQueries(config, extSettings);

      expect(queries.length).toBeGreaterThan(0);
      // Should include government sites
      const hasSiteOperator = queries.some(q => q.includes('site:'));
      expect(hasSiteOperator).toBe(true);
    });

    it('should generate queries with filetype operators when enabled', () => {
      // Minimal config to ensure filetype query is included within limits
      const config = createTestConfig({
        keywordChips: [], // Reduce query count
        priorityDomains: [], // Reduce query count
        officialDomainPriority: false,
      });
      const extSettings = createTestSettings();
      extSettings.search.useFiletypeOperator = true;
      extSettings.search.filetypes = ['pdf'];
      extSettings.search.maxResults = 20; // Ensure enough room

      const queries = generateSearchQueries(config, extSettings);

      const hasFiletypeOperator = queries.some(q => q.includes('filetype:'));
      expect(hasFiletypeOperator).toBe(true);
    });

    it('should respect excluded domains', () => {
      const config = createTestConfig({
        scope: ['医療'],
      });
      const extSettings = createTestSettings({
        search: {
          ...createDefaultExtendedSettings().search,
          excludedDomains: ['example.com'],
        },
      });

      const queries = generateSearchQueries(config, extSettings);

      // Queries should not contain excluded domains
      queries.forEach(q => {
        expect(q).not.toContain('site:example.com');
      });
    });
  });

  describe('Difficulty Levels', () => {
    it('should adjust output for standard difficulty', () => {
      const config = createTestConfig({ difficultyLevel: 'standard' });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      // Standard mode should have core elements
      expect(prompt).toContain('サマリー');
      expect(prompt).toContain('引用文献');
    });

    it('should include detailed sections for professional difficulty', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      // Professional mode should have comprehensive sections
      expect(prompt).toContain('サマリー');
      expect(prompt).toContain('免責事項');
      expect(prompt).toContain('検索条件');
      expect(prompt).toContain('ガイドライン一覧');
    });
  });

  describe('e-Gov Cross Reference', () => {
    it('should include e-Gov section when enabled', () => {
      const config = createTestConfig({
        difficultyLevel: 'professional',
        eGovCrossReference: true,
      });
      const extSettings = createTestSettings({
        output: {
          ...createDefaultExtendedSettings().output,
          eGovCrossReference: true,
        },
      });

      const prompt = generatePrompt(config, extSettings);

      expect(prompt).toContain('e-Gov');
    });

    it('should respect explicit eGovCrossReference setting', () => {
      const config = createTestConfig({
        difficultyLevel: 'professional',
        eGovCrossReference: false,
      });
      const extSettings = createTestSettings({
        output: {
          ...createDefaultExtendedSettings().output,
          eGovCrossReference: true, // Explicit setting should be respected
        },
      });

      const prompt = generatePrompt(config, extSettings);

      // With explicit extSettings, eGovCrossReference should be respected
      expect(prompt).toContain('e-Gov');
    });
  });

  describe('Regression: Known Issues', () => {
    it('should not have empty output sections', () => {
      const config = createTestConfig();
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      // Check for common regression: empty numbered sections
      expect(prompt).not.toMatch(/\n\d+\.\s*\n/);
    });

    it('should maintain proper section ordering', () => {
      const config = createTestConfig({ difficultyLevel: 'professional' });
      const extSettings = createTestSettings();

      const prompt = generatePrompt(config, extSettings);

      // Disclaimer should appear before other content sections
      const disclaimerIndex = prompt.indexOf('免責事項');
      const guidelineIndex = prompt.indexOf('ガイドライン一覧');

      if (disclaimerIndex !== -1 && guidelineIndex !== -1) {
        expect(disclaimerIndex).toBeLessThan(guidelineIndex);
      }
    });

    it('should handle empty scope gracefully', () => {
      const config = createTestConfig({
        scope: [],
      });
      const extSettings = createTestSettings();

      // Should not throw
      expect(() => generatePrompt(config, extSettings)).not.toThrow();
      expect(() => generateSearchQueries(config, extSettings)).not.toThrow();
    });

    it('should handle special characters in query', () => {
      const config = createTestConfig({
        query: 'AI（人工知能）を用いた医療機器＆診断支援システム',
      });
      const extSettings = createTestSettings();

      // Should not throw
      expect(() => generatePrompt(config, extSettings)).not.toThrow();

      const queries = generateSearchQueries(config, extSettings);
      expect(queries.length).toBeGreaterThan(0);
    });
  });
});
