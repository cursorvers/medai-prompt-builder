/**
 * Medical AI Prompt Builder - Presets and Type Definitions
 * Design: Medical Precision (Swiss Design × Medical Device UI)
 */

import { parseAppConfig } from './schemas';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TabPreset {
  id: string;
  name: string;
  categories: string[];
  keywordChips: string[];
}

export type DifficultyLevel = 'standard' | 'professional';

// ============================================================================
// Difficulty Presets
// ============================================================================

export interface DifficultyPreset {
  id: DifficultyLevel;
  name: string;
  description: string;
  icon: 'star' | 'zap';
  features: string[];
  settings: {
    detailLevel: 'concise' | 'standard' | 'detailed';
    eGovCrossReference: boolean;
    includeLawExcerpts: boolean;
    recursiveDepth: number;
    maxResults: number;
    proofMode: boolean;
  };
}

export const DIFFICULTY_PRESETS: DifficultyPreset[] = [
  {
    id: 'standard',
    name: 'スタンダード',
    description: '基本的な情報収集に最適',
    icon: 'star',
    features: [
      '詳細サマリー',
      '引用文献リスト',
      '基本的な検索（10件まで）',
    ],
    settings: {
      detailLevel: 'standard',
      eGovCrossReference: false,
      includeLawExcerpts: false,
      recursiveDepth: 0,
      maxResults: 10,
      proofMode: false,
    },
  },
  {
    id: 'professional',
    name: 'プロフェッショナル',
    description: '詳細な分析と法令参照に最適',
    icon: 'zap',
    features: [
      '冒頭サマリー',
      'e-Gov法令参照の自動取得',
      '関連文書の再帰的探索',
      '詳細な条文抜粋',
      '詳細検索（20件まで）',
    ],
    settings: {
      detailLevel: 'detailed',
      eGovCrossReference: true,
      includeLawExcerpts: true,
      recursiveDepth: 2,
      maxResults: 20,
      proofMode: true,
    },
  },
];

export function getDifficultyPreset(level: DifficultyLevel): DifficultyPreset {
  return DIFFICULTY_PRESETS.find(p => p.id === level) || DIFFICULTY_PRESETS[0];
}

export interface AppConfig {
  // Basic settings
  dateToday: string;
  query: string;
  scope: string[];
  audiences: string[];
  difficultyLevel: DifficultyLevel;

  // Switches
  threeMinistryGuidelines: boolean;
  officialDomainPriority: boolean;
  siteOperator: boolean;
  latestVersionPriority: boolean;
  pdfDirectLink: boolean;
  includeSearchLog: boolean;
  eGovCrossReference: boolean;
  proofMode: boolean;
  
  // Categories (with order and enabled state)
  categories: { name: string; enabled: boolean }[];
  
  // Keywords
  keywordChips: { name: string; enabled: boolean }[];
  customKeywords: string[];
  excludeKeywords: string[];
  
  // Priority domains
  priorityDomains: string[];
  
  // Active tab
  activeTab: string;
}

export interface OutputTab {
  id: string;
  name: string;
}

// ============================================================================
// Constants
// ============================================================================

export const STORAGE_KEY = 'medai_prompt_builder_config_v1';
export const TEMPLATE_BASE_DATE = '2026/02/04';

export const DISCLAIMER_LINES = [
  '本アプリは情報整理支援ツールです。個別ケースについては有資格者など専門家にご相談下さい。',
  '本アプリのテンプレート設計は2026/02/04時点での指針に基づく前提です。利用時点での最新情報は一次資料で確認してください。',
  '本アプリは医療行為、法的助言、規制判断を行いません。',
];

export const DEFAULT_PRIORITY_DOMAINS = [
  'mhlw.go.jp',
  'meti.go.jp',
  'soumu.go.jp',
  'pmda.go.jp',
  'ipa.go.jp',
  'cas.go.jp',
  'e-gov.go.jp',
  'mext.go.jp',
  'nii.ac.jp',
];

export const DEFAULT_SCOPE_OPTIONS = [
  '医療AI',
  '生成AI',
  'SaMD',
  '医療情報セキュリティ',
  '医療データ利活用',
  '研究倫理',
];

export const DEFAULT_AUDIENCE_OPTIONS = [
  '医療機関',
  '提供事業者',
  '開発企業',
  '研究者',
  '審査対応',
];

export const OUTPUT_TABS: OutputTab[] = [
  { id: 'prompt', name: 'Gemini貼り付け用プロンプト' },
  { id: 'queries', name: '検索クエリ一覧' },
  { id: 'json', name: '設定JSON' },
];

// ============================================================================
// Tab Presets
// ============================================================================

export const TAB_PRESETS: TabPreset[] = [
  {
    id: 'medical-device',
    name: '医療機器開発寄り',
    categories: [
      '医療機器規制とSaMD、AI医療機器',
      '臨床評価と性能評価',
      '品質マネジメントとリスク管理',
      '市販後と変更管理',
      '横断的AIガバナンス',
    ],
    keywordChips: [
      '医療AI ガイドライン 国内',
      'AI 医療機器 ガイドライン',
      'プログラムの医療機器該当性に関するガイドライン',
      'SaMD 承認申請 手引き',
      'PMDA プログラム医療機器 審査 手引き',
    ],
  },
  {
    id: 'clinical-operation',
    name: '臨床運用寄り',
    categories: [
      '医療情報セキュリティ(3省2ガイドライン等)',
      'クラウド利用と委託管理',
      'アクセス制御と監査ログ',
      '事故対応と継続運用',
      '横断的AIガバナンス',
    ],
    keywordChips: [
      '医療情報システムの安全管理に関するガイドライン',
      '医療情報を取り扱う情報システム・サービスの提供事業者における安全管理ガイドライン',
      '医療 生成AI 利用 ガイドライン',
      '医療AI ガイドライン 国内',
    ],
  },
  {
    id: 'research-ethics',
    name: '研究倫理寄り',
    categories: [
      '研究倫理',
      '医療データ利活用と個人情報保護',
      '同意と二次利用',
      'データ管理と匿名化',
      '横断的AIガバナンス',
    ],
    keywordChips: [
      '医療デジタルデータ AI 研究開発 利活用 ガイドライン',
      '医療AI 倫理 指針',
      '人を対象とする生命科学・医学系研究に関する倫理指針',
      '個人情報保護 医療 AI 仮名加工',
    ],
  },
  {
    id: 'generative-ai',
    name: '生成AI寄り',
    categories: [
      '生成AIの利用',
      '情報漏えいとデータ持ち出し',
      '誤情報と説明責任',
      '出力物の取扱い',
      '横断的AIガバナンス',
    ],
    keywordChips: [
      '医療 生成AI 利用 ガイドライン',
      '生成AI 医療 文書 作成 支援 指針',
      '医療 生成AI 個人情報 漏えい 対策',
      '医療AI ガイドライン 国内',
    ],
  },
];

// ============================================================================
// Default Config Factory
// ============================================================================

export function createDefaultConfig(tabId: string = 'medical-device'): AppConfig {
  const preset = TAB_PRESETS.find(t => t.id === tabId) || TAB_PRESETS[0];
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  return {
    dateToday: dateStr,
    query: '',
    scope: ['医療AI'],
    audiences: ['医療機関', '開発企業'],
    difficultyLevel: 'standard',

    threeMinistryGuidelines: true,
    officialDomainPriority: true,
    siteOperator: true,
    latestVersionPriority: true,
    pdfDirectLink: true,
    includeSearchLog: true,
    eGovCrossReference: false,
    proofMode: true,
    
    categories: preset.categories.map(name => ({ name, enabled: true })),
    keywordChips: preset.keywordChips.map(name => ({ name, enabled: true })),
    customKeywords: [],
    excludeKeywords: [],
    
    priorityDomains: [...DEFAULT_PRIORITY_DOMAINS],
    activeTab: tabId,
  };
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfig(config: AppConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Query is required
  if (!config.query.trim()) {
    errors.push('探索テーマを入力してください');
  }

  // Warnings
  if (!config.officialDomainPriority) {
    warnings.push('公式ドメイン優先がオフです。非公式情報が混入する可能性があります。');
  }

  if (!config.latestVersionPriority) {
    warnings.push('最新版優先がオフです。旧版のガイドラインが含まれる可能性があります。');
  }

  if (config.eGovCrossReference && !config.dateToday) {
    warnings.push('e-Gov法令クロスリファレンスがオンですが、日付が未入力です。');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// JSON Parsing with Zod Validation
// ============================================================================

/**
 * Parse and validate AppConfig from JSON string
 * Returns validated AppConfig or null if invalid
 */
export function parseConfigJSON(json: string): AppConfig | null {
  try {
    const parsed = JSON.parse(json);
    const validated = parseAppConfig(parsed);
    return validated;
  } catch (e) {
    console.error('Failed to parse config JSON:', e);
    return null;
  }
}
