/**
 * Unit Tests for settings.ts
 * Target coverage: 80%+
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadExtendedSettings,
  saveExtendedSettings,
  createDefaultExtendedSettings,
  resetExtendedSettings,
  getFontSizeClass,
  getFontSizeScale,
  DEFAULT_ROLE_TITLE,
  DEFAULT_ROLE_DESCRIPTION,
  DEFAULT_DISCLAIMERS,
  DEFAULT_OUTPUT_SECTIONS,
  DEFAULT_TEMPLATE_SETTINGS,
  DEFAULT_SEARCH_SETTINGS,
  DEFAULT_OUTPUT_SETTINGS,
  DEFAULT_UI_SETTINGS,
  type ExtendedSettings,
} from '../settings';

describe('settings.ts', () => {
  // ============================================================================
  // createDefaultExtendedSettings() Tests
  // ============================================================================
  describe('createDefaultExtendedSettings()', () => {
    it('should return settings with all required properties', () => {
      const settings = createDefaultExtendedSettings();

      expect(settings).toHaveProperty('template');
      expect(settings).toHaveProperty('search');
      expect(settings).toHaveProperty('output');
      expect(settings).toHaveProperty('ui');
      expect(settings).toHaveProperty('version');
      expect(settings).toHaveProperty('lastUpdated');
    });

    it('should return default template settings', () => {
      const settings = createDefaultExtendedSettings();

      expect(settings.template.roleTitle).toBe(DEFAULT_ROLE_TITLE);
      expect(settings.template.roleDescription).toBe(DEFAULT_ROLE_DESCRIPTION);
      expect(settings.template.disclaimers).toEqual(DEFAULT_DISCLAIMERS);
      expect(settings.template.outputSections).toEqual(DEFAULT_OUTPUT_SECTIONS);
      expect(settings.template.customInstructions).toBe('');
    });

    it('should return default search settings', () => {
      const settings = createDefaultExtendedSettings();

      expect(settings.search.useSiteOperator).toBe(true);
      expect(settings.search.useFiletypeOperator).toBe(true);
      expect(settings.search.filetypes).toEqual(['pdf']);
      expect(settings.search.priorityRule).toBe('revised_date');
      expect(settings.search.excludedDomains).toEqual([]);
      expect(settings.search.maxResults).toBe(20);
      expect(settings.search.recursiveDepth).toBe(2);
    });

    it('should return default output settings', () => {
      const settings = createDefaultExtendedSettings();

      expect(settings.output.languageMode).toBe('japanese_only');
      expect(settings.output.includeEnglishTerms).toBe(true);
      expect(settings.output.detailLevel).toBe('standard');
      expect(settings.output.eGovCrossReference).toBe(false);
      expect(settings.output.includeLawExcerpts).toBe(true);
      expect(settings.output.outputFormat).toBe('markdown');
      expect(settings.output.includeSearchLog).toBe(true);
    });

    it('should return default UI settings', () => {
      const settings = createDefaultExtendedSettings();

      expect(settings.ui.theme).toBe('light');
      expect(settings.ui.fontSize).toBe('medium');
      expect(settings.ui.defaultOutputTab).toBe('prompt');
      expect(settings.ui.defaultPurposeTab).toBe('medical-device');
      expect(settings.ui.compactMode).toBe(false);
      expect(settings.ui.showTooltips).toBe(true);
      expect(settings.ui.animationsEnabled).toBe(true);
    });

    it('should return version 1', () => {
      const settings = createDefaultExtendedSettings();
      expect(settings.version).toBe(1);
    });

    it('should set lastUpdated to current ISO string', () => {
      const before = new Date().toISOString();
      const settings = createDefaultExtendedSettings();
      const after = new Date().toISOString();

      expect(settings.lastUpdated >= before).toBe(true);
      expect(settings.lastUpdated <= after).toBe(true);
    });
  });

  // ============================================================================
  // loadExtendedSettings() Tests
  // ============================================================================
  describe('loadExtendedSettings()', () => {
    it('should return default settings when localStorage is empty', () => {
      const settings = loadExtendedSettings();

      expect(settings.template.roleTitle).toBe(DEFAULT_ROLE_TITLE);
      expect(settings.search.useSiteOperator).toBe(true);
      expect(settings.output.languageMode).toBe('japanese_only');
      expect(settings.ui.theme).toBe('light');
    });

    it('should load and merge settings from localStorage', () => {
      const customSettings = {
        template: {
          roleTitle: 'Custom Role Title',
        },
        search: {
          maxResults: 50,
        },
        output: {
          detailLevel: 'detailed',
        },
        ui: {
          theme: 'dark',
        },
        version: 1,
        lastUpdated: '2024-01-01T00:00:00.000Z',
      };

      localStorage.setItem('medai_extended_settings_v1', JSON.stringify(customSettings));

      const settings = loadExtendedSettings();

      // Custom values should be loaded
      expect(settings.template.roleTitle).toBe('Custom Role Title');
      expect(settings.search.maxResults).toBe(50);
      expect(settings.output.detailLevel).toBe('detailed');
      expect(settings.ui.theme).toBe('dark');

      // Missing values should fall back to defaults
      expect(settings.template.roleDescription).toBe(DEFAULT_ROLE_DESCRIPTION);
      expect(settings.search.useSiteOperator).toBe(true);
      expect(settings.output.languageMode).toBe('japanese_only');
      expect(settings.ui.fontSize).toBe('medium');
    });

    it('should handle partial settings gracefully', () => {
      const partialSettings = {
        template: {},
        search: {},
      };

      localStorage.setItem('medai_extended_settings_v1', JSON.stringify(partialSettings));

      const settings = loadExtendedSettings();

      // All defaults should be applied
      expect(settings.template.roleTitle).toBe(DEFAULT_ROLE_TITLE);
      expect(settings.search.useSiteOperator).toBe(true);
      expect(settings.output.languageMode).toBe('japanese_only');
      expect(settings.ui.theme).toBe('light');
    });

    it('should return defaults when localStorage has invalid JSON', () => {
      localStorage.setItem('medai_extended_settings_v1', 'invalid json {');

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const settings = loadExtendedSettings();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(settings.template.roleTitle).toBe(DEFAULT_ROLE_TITLE);

      consoleErrorSpy.mockRestore();
    });

    it('should set default version when version is missing', () => {
      const settingsWithoutVersion = {
        template: {},
        search: {},
        output: {},
        ui: {},
        lastUpdated: '2024-01-01T00:00:00.000Z',
      };

      localStorage.setItem('medai_extended_settings_v1', JSON.stringify(settingsWithoutVersion));

      const settings = loadExtendedSettings();

      expect(settings.version).toBe(1);
    });

    it('should set default lastUpdated when it is missing', () => {
      const settingsWithoutLastUpdated = {
        template: {},
        search: {},
        output: {},
        ui: {},
        version: 1,
      };

      localStorage.setItem('medai_extended_settings_v1', JSON.stringify(settingsWithoutLastUpdated));

      const before = new Date().toISOString();
      const settings = loadExtendedSettings();
      const after = new Date().toISOString();

      expect(settings.lastUpdated >= before).toBe(true);
      expect(settings.lastUpdated <= after).toBe(true);
    });
  });

  // ============================================================================
  // saveExtendedSettings() Tests
  // ============================================================================
  describe('saveExtendedSettings()', () => {
    it('should save settings to localStorage', () => {
      const settings = createDefaultExtendedSettings();
      settings.template.roleTitle = 'Test Role';
      settings.search.maxResults = 100;

      saveExtendedSettings(settings);

      const stored = localStorage.getItem('medai_extended_settings_v1');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.template.roleTitle).toBe('Test Role');
      expect(parsed.search.maxResults).toBe(100);
    });

    it('should update lastUpdated when saving', () => {
      const settings = createDefaultExtendedSettings();
      const originalLastUpdated = settings.lastUpdated;

      // Wait a tiny bit to ensure different timestamp
      const before = new Date().toISOString();
      saveExtendedSettings(settings);
      const after = new Date().toISOString();

      const stored = localStorage.getItem('medai_extended_settings_v1');
      const parsed = JSON.parse(stored!);

      // lastUpdated should be updated
      expect(parsed.lastUpdated >= before).toBe(true);
      expect(parsed.lastUpdated <= after).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      const settings = createDefaultExtendedSettings();

      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      expect(() => saveExtendedSettings(settings)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      setItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  // ============================================================================
  // resetExtendedSettings() Tests
  // ============================================================================
  describe('resetExtendedSettings()', () => {
    it('should reset to default settings and return them', () => {
      // First save some custom settings
      const customSettings = createDefaultExtendedSettings();
      customSettings.template.roleTitle = 'Custom Title';
      customSettings.ui.theme = 'dark';
      saveExtendedSettings(customSettings);

      // Reset
      const resetSettings = resetExtendedSettings();

      // Should return defaults
      expect(resetSettings.template.roleTitle).toBe(DEFAULT_ROLE_TITLE);
      expect(resetSettings.ui.theme).toBe('light');

      // localStorage should also be reset
      const stored = localStorage.getItem('medai_extended_settings_v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.template.roleTitle).toBe(DEFAULT_ROLE_TITLE);
      expect(parsed.ui.theme).toBe('light');
    });
  });

  // ============================================================================
  // getFontSizeClass() Tests
  // ============================================================================
  describe('getFontSizeClass()', () => {
    it('should return "text-sm" for small size', () => {
      expect(getFontSizeClass('small')).toBe('text-sm');
    });

    it('should return "text-base" for medium size', () => {
      expect(getFontSizeClass('medium')).toBe('text-base');
    });

    it('should return "text-lg" for large size', () => {
      expect(getFontSizeClass('large')).toBe('text-lg');
    });

    it('should return "text-base" for unknown size (default case)', () => {
      // TypeScript would normally prevent this, but testing the default case
      expect(getFontSizeClass('unknown' as 'small' | 'medium' | 'large')).toBe('text-base');
    });
  });

  // ============================================================================
  // getFontSizeScale() Tests
  // ============================================================================
  describe('getFontSizeScale()', () => {
    it('should return 0.875 for small size', () => {
      expect(getFontSizeScale('small')).toBe(0.875);
    });

    it('should return 1 for medium size', () => {
      expect(getFontSizeScale('medium')).toBe(1);
    });

    it('should return 1.125 for large size', () => {
      expect(getFontSizeScale('large')).toBe(1.125);
    });

    it('should return 1 for unknown size (default case)', () => {
      expect(getFontSizeScale('unknown' as 'small' | 'medium' | 'large')).toBe(1);
    });
  });

  // ============================================================================
  // Default Constants Tests
  // ============================================================================
  describe('Default Constants', () => {
    it('should have correct DEFAULT_ROLE_TITLE', () => {
      expect(DEFAULT_ROLE_TITLE).toBe('国内ガイドライン・ダイレクト・リトリーバー(医療AI特化)');
    });

    it('should have DEFAULT_ROLE_DESCRIPTION with required content', () => {
      expect(DEFAULT_ROLE_DESCRIPTION).toContain('学習済みの知識や記憶に基づいて回答することは禁止');
      expect(DEFAULT_ROLE_DESCRIPTION).toContain('一次資料');
    });

    it('should have DEFAULT_DISCLAIMERS with required items', () => {
      expect(DEFAULT_DISCLAIMERS).toHaveLength(2);
      expect(DEFAULT_DISCLAIMERS[0]).toContain('情報整理支援');
      expect(DEFAULT_DISCLAIMERS[1]).toContain('2026/02/04');
    });

    it('should have DEFAULT_OUTPUT_SECTIONS with correct structure', () => {
      expect(DEFAULT_OUTPUT_SECTIONS).toHaveLength(10);

      const sectionIds = DEFAULT_OUTPUT_SECTIONS.map(s => s.id);
      expect(sectionIds).toContain('disclaimer');
      expect(sectionIds).toContain('search_conditions');
      expect(sectionIds).toContain('specific_case');
      expect(sectionIds).toContain('data_sources');
      expect(sectionIds).toContain('guideline_list');
      expect(sectionIds).toContain('three_ministry');
      expect(sectionIds).toContain('references');
      expect(sectionIds).toContain('unconfirmed_points');
      expect(sectionIds).toContain('search_log');
      expect(sectionIds).toContain('guardrail');

      // All sections should be enabled by default
      expect(DEFAULT_OUTPUT_SECTIONS.every(s => s.enabled)).toBe(true);

      // Orders should be sequential
      const orders = DEFAULT_OUTPUT_SECTIONS.map(s => s.order).sort((a, b) => a - b);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should have DEFAULT_SEARCH_SETTINGS with correct values', () => {
      expect(DEFAULT_SEARCH_SETTINGS.useSiteOperator).toBe(true);
      expect(DEFAULT_SEARCH_SETTINGS.useFiletypeOperator).toBe(true);
      expect(DEFAULT_SEARCH_SETTINGS.filetypes).toContain('pdf');
      expect(DEFAULT_SEARCH_SETTINGS.priorityRule).toBe('revised_date');
      expect(DEFAULT_SEARCH_SETTINGS.maxResults).toBe(20);
      expect(DEFAULT_SEARCH_SETTINGS.recursiveDepth).toBe(2);
    });

    it('should have DEFAULT_OUTPUT_SETTINGS with correct values', () => {
      expect(DEFAULT_OUTPUT_SETTINGS.languageMode).toBe('japanese_only');
      expect(DEFAULT_OUTPUT_SETTINGS.detailLevel).toBe('standard');
      expect(DEFAULT_OUTPUT_SETTINGS.outputFormat).toBe('markdown');
    });

    it('should have DEFAULT_UI_SETTINGS with correct values', () => {
      expect(DEFAULT_UI_SETTINGS.theme).toBe('light');
      expect(DEFAULT_UI_SETTINGS.fontSize).toBe('medium');
      expect(DEFAULT_UI_SETTINGS.compactMode).toBe(false);
    });
  });
});
