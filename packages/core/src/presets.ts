/**
 * GuideScope Core - Presets
 * Japanese medical guideline search prompt generator
 */

import type { DifficultyPreset, TabPreset, DifficultyLevel } from './types';

// ============================================================================
// Difficulty Presets
// ============================================================================

export const DIFFICULTY_PRESETS: DifficultyPreset[] = [
  {
    id: 'standard',
    name: 'スタンダード',
    description: '基本的な情報収集に最適',
    features: [
      '詳細サマリー',
      '引用文献リスト',
      '基本的な検索（10件まで）',
    ],
    settings: {
      // Keep it light: summary + references + short guideline list
      detailLevel: 'concise',
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
    description: '詳細な分析と法令参照',
    features: [
      '冒頭サマリー',
      'e-Gov法令クロスリファレンス',
      '関連文書の再帰的取得（2階層）',
      '詳細な条文抜粋',
      '拡張検索（20件まで）',
      '実証モード',
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
      '個人情報保護（APPI）',
    ],
    keywordChips: [
      '医療情報システムの安全管理に関するガイドライン',
      '医療情報システムの安全管理に関するガイドライン Q&A 生成AI',
      '医療情報を取り扱う情報システム・サービスの提供事業者における安全管理ガイドライン',
      '医療・介護関係事業者における個人情報の適切な取扱いのためのガイダンス',
      '個人情報の保護に関する法律についてのガイドライン（通則編）',
      '個人情報の保護に関する法律についてのガイドライン（外国にある第三者への提供編）',
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

export function getTabPreset(id: string): TabPreset {
  return TAB_PRESETS.find(p => p.id === id) || TAB_PRESETS[0];
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_PRIORITY_DOMAINS = [
  'mhlw.go.jp',
  'ppc.go.jp',
  'cao.go.jp',
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
  '個人情報保護（APPI）',
  '匿名加工情報',
  '仮名加工情報',
  '次世代医療基盤法',
  '研究倫理',
];

export const DEFAULT_AUDIENCE_OPTIONS = [
  '医療機関',
  '提供事業者',
  '開発企業',
  '研究者',
  '審査対応',
];
