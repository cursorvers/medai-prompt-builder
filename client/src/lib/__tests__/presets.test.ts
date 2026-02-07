import { describe, it, expect } from 'vitest';
import { createDefaultConfig, normalizeConfig } from '../presets';

describe('normalizeConfig', () => {
  it('forces Standard to clinical-operation profile while keeping user inputs', () => {
    const cfg = createDefaultConfig('medical-device');
    cfg.difficultyLevel = 'standard';
    cfg.activeTab = 'medical-device';
    cfg.audiences = ['開発企業', '研究者'];
    cfg.scope = ['生成AI', '研究倫理'];
    cfg.query = 'テスト';
    cfg.vendorDocText = '契約書テキスト';

    const normalized = normalizeConfig(cfg);
    expect(normalized.difficultyLevel).toBe('standard');
    expect(normalized.activeTab).toBe('clinical-operation');
    expect(normalized.audiences).toEqual(['医療機関']);
    expect(normalized.scope).toEqual(['医療AI', '医療情報セキュリティ', '医療データ利活用']);
    expect(normalized.query).toBe('テスト');
    expect(normalized.vendorDocText).toBe('契約書テキスト');
  });

  it('repairs mismatched category/keyword arrays for Professional', () => {
    const cfg = createDefaultConfig('clinical-operation');
    cfg.difficultyLevel = 'professional';
    cfg.activeTab = 'clinical-operation';
    cfg.categories = []; // break it
    cfg.keywordChips = []; // break it

    const normalized = normalizeConfig(cfg);
    expect(normalized.difficultyLevel).toBe('professional');
    expect(normalized.categories.length).toBeGreaterThan(0);
    expect(normalized.keywordChips.length).toBeGreaterThan(0);
  });
});

