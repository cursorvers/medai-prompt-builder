/**
 * Medical AI Prompt Builder - Extended Settings Management
 * Design: Medical Precision 2.0
 *
 * Features:
 * - Template customization (Role, disclaimers, output format)
 * - Search settings (operators, priority rules, excluded domains)
 * - Output settings (language, detail level, e-Gov cross-reference)
 * - UI/UX settings (theme, font size, default tab)
 */

import { parseExtendedSettings } from './schemas';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TemplateSettings {
  // Role definition
  roleTitle: string;
  roleDescription: string;
  
  // Disclaimers
  disclaimers: string[];
  
  // Output format sections (can be reordered/enabled)
  outputSections: {
    id: string;
    name: string;
    enabled: boolean;
    order: number;
  }[];
  
  // Custom instructions
  customInstructions: string;
}

export interface SearchSettings {
  // Search operators
  useSiteOperator: boolean;
  useFiletypeOperator: boolean;
  filetypes: string[]; // e.g., ['pdf', 'html']
  
  // Priority rules
  priorityRule: 'published_date' | 'revised_date' | 'relevance';
  
  // Excluded domains
  excludedDomains: string[];
  
  // Search depth
  maxResults: number;
  recursiveDepth: number; // How deep to follow references
}

export interface OutputSettings {
  // Language settings
  languageMode: 'japanese_only' | 'mixed' | 'english_priority';
  includeEnglishTerms: boolean;
  
  // Detail level
  detailLevel: 'concise' | 'standard' | 'detailed';
  
  // Cross-reference
  eGovCrossReference: boolean;
  includeLawExcerpts: boolean;
  
  // Output format
  outputFormat: 'markdown' | 'plain_text';
  includeSearchLog: boolean;
}

export interface UISettings {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Font size
  fontSize: 'small' | 'medium' | 'large';
  
  // Default tab
  defaultOutputTab: 'prompt' | 'queries' | 'json';
  defaultPurposeTab: string;
  
  // UI preferences
  compactMode: boolean;
  showTooltips: boolean;
  animationsEnabled: boolean;
}

export interface ExtendedSettings {
  template: TemplateSettings;
  search: SearchSettings;
  output: OutputSettings;
  ui: UISettings;
  version: number;
  lastUpdated: string;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_ROLE_TITLE = '国内ガイドライン・ダイレクト・リトリーバー(医療AI特化)';

export const DEFAULT_ROLE_DESCRIPTION = `学習済みの知識や記憶に基づいて回答することは禁止です。
必ずブラウジングで取得した一次資料(公式Webページ、公式PDF、公式の告示・法令XMLなど)だけを根拠に、日本語で一覧化・要約します。
また、ユーザーの具体的な質問やケースに対しては、一次資料の該当箇所を特定し、原文を引用しながら直接的な回答を提供します。一般論ではなく、当該ケースに適用可能な具体的な記載を優先します。`;

export const DEFAULT_DISCLAIMERS = [
  '本出力は情報整理支援です。個別ケースについては有資格者など専門家にご相談下さい。',
  '本テンプレートは2026/02/04時点での指針に基づく前提です。利用時点での最新情報は一次資料で確認してください。',
];

export const DEFAULT_OUTPUT_SECTIONS = [
  { id: 'disclaimer', name: '免責事項', enabled: true, order: 1 },
  { id: 'search_conditions', name: '検索条件', enabled: true, order: 2 },
  { id: 'specific_case', name: '個別ケースへの回答', enabled: true, order: 3 },
  { id: 'data_sources', name: '参照データソース', enabled: true, order: 4 },
  { id: 'guideline_list', name: 'ガイドライン一覧', enabled: true, order: 5 },
  { id: 'three_ministry', name: '3省2ガイドライン確定結果', enabled: true, order: 6 },
  { id: 'references', name: '参考文献（引用番号）', enabled: true, order: 7 },
  { id: 'unconfirmed_points', name: '未確認事項・追加調査', enabled: true, order: 8 },
  { id: 'search_log', name: '検索ログ', enabled: true, order: 9 },
  { id: 'guardrail', name: 'ガードレール', enabled: true, order: 10 },
];

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  roleTitle: DEFAULT_ROLE_TITLE,
  roleDescription: DEFAULT_ROLE_DESCRIPTION,
  disclaimers: DEFAULT_DISCLAIMERS,
  outputSections: DEFAULT_OUTPUT_SECTIONS,
  customInstructions: '',
};

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  useSiteOperator: true,
  useFiletypeOperator: true,
  filetypes: ['pdf'],
  priorityRule: 'revised_date',
  excludedDomains: [],
  maxResults: 20,
  recursiveDepth: 2,
};

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
  languageMode: 'japanese_only',
  includeEnglishTerms: true,
  detailLevel: 'standard',
  eGovCrossReference: false,
  includeLawExcerpts: true,
  outputFormat: 'markdown',
  includeSearchLog: true,
};

export const DEFAULT_UI_SETTINGS: UISettings = {
  theme: 'light',
  fontSize: 'medium',
  defaultOutputTab: 'prompt',
  defaultPurposeTab: 'medical-device',
  compactMode: false,
  showTooltips: true,
  animationsEnabled: true,
};

export function createDefaultExtendedSettings(): ExtendedSettings {
  return {
    template: { ...DEFAULT_TEMPLATE_SETTINGS },
    search: { ...DEFAULT_SEARCH_SETTINGS },
    output: { ...DEFAULT_OUTPUT_SETTINGS },
    ui: { ...DEFAULT_UI_SETTINGS },
    version: 1,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// Storage Management
// ============================================================================

const EXTENDED_SETTINGS_KEY = 'medai_extended_settings_v1';

export function loadExtendedSettings(): ExtendedSettings {
  try {
    const stored = localStorage.getItem(EXTENDED_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Merge with defaults to ensure all fields exist
      const merged = {
        template: { ...DEFAULT_TEMPLATE_SETTINGS, ...parsed.template },
        search: { ...DEFAULT_SEARCH_SETTINGS, ...parsed.search },
        output: { ...DEFAULT_OUTPUT_SETTINGS, ...parsed.output },
        ui: { ...DEFAULT_UI_SETTINGS, ...parsed.ui },
        version: parsed.version || 1,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };

      // Validate with Zod schema
      const validated = parseExtendedSettings(merged);
      if (validated) {
        return validated;
      }

      // If validation fails, log and return defaults
      console.warn('ExtendedSettings validation failed, using defaults');
    }
  } catch (e) {
    console.error('Failed to load extended settings:', e);
  }
  return createDefaultExtendedSettings();
}

export function saveExtendedSettings(settings: ExtendedSettings): void {
  try {
    settings.lastUpdated = new Date().toISOString();
    localStorage.setItem(EXTENDED_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save extended settings:', e);
  }
}

export function resetExtendedSettings(): ExtendedSettings {
  const defaults = createDefaultExtendedSettings();
  saveExtendedSettings(defaults);
  return defaults;
}

// ============================================================================
// Font Size Utilities
// ============================================================================

export function getFontSizeClass(size: UISettings['fontSize']): string {
  switch (size) {
    case 'small':
      return 'text-sm';
    case 'large':
      return 'text-lg';
    default:
      return 'text-base';
  }
}

export function getFontSizeScale(size: UISettings['fontSize']): number {
  switch (size) {
    case 'small':
      return 0.875;
    case 'large':
      return 1.125;
    default:
      return 1;
  }
}
