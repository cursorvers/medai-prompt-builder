/**
 * GuideScope Core - Type Definitions
 * Japanese medical guideline search prompt generator
 */

// ============================================================================
// Difficulty Level
// ============================================================================

export type DifficultyLevel = 'standard' | 'professional';

export interface DifficultyPreset {
  id: DifficultyLevel;
  name: string;
  description: string;
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

// ============================================================================
// Tab Preset
// ============================================================================

export interface TabPreset {
  id: string;
  name: string;
  categories: string[];
  keywordChips: string[];
}

// ============================================================================
// App Config (Main Configuration)
// ============================================================================

export interface CategoryItem {
  name: string;
  enabled: boolean;
}

export interface KeywordChipItem {
  name: string;
  enabled: boolean;
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
  categories: CategoryItem[];

  // Keywords
  keywordChips: KeywordChipItem[];
  customKeywords: string[];
  excludeKeywords: string[];

  // Priority domains
  priorityDomains: string[];

  // Active tab (preset ID)
  activeTab: string;
}

// ============================================================================
// Extended Settings
// ============================================================================

export interface OutputSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface TemplateSettings {
  roleTitle: string;
  roleDescription: string;
  disclaimers: string[];
  outputSections: OutputSection[];
  customInstructions: string;
}

export interface SearchSettings {
  useSiteOperator: boolean;
  useFiletypeOperator: boolean;
  filetypes: string[];
  priorityRule: 'published_date' | 'revised_date' | 'relevance';
  excludedDomains: string[];
  maxResults: number;
  recursiveDepth: number;
}

export interface OutputSettings {
  languageMode: 'japanese_only' | 'mixed' | 'english_priority';
  includeEnglishTerms: boolean;
  detailLevel: 'concise' | 'standard' | 'detailed';
  eGovCrossReference: boolean;
  includeLawExcerpts: boolean;
  outputFormat: 'markdown' | 'plain_text';
  includeSearchLog: boolean;
}

export interface ExtendedSettings {
  template: TemplateSettings;
  search: SearchSettings;
  output: OutputSettings;
}

// ============================================================================
// Generation Options (Simplified API)
// ============================================================================

export interface GeneratePromptOptions {
  /** Search theme/query (required) */
  query: string;
  /** Preset ID (default: 'medical-device') */
  preset?: string;
  /** Difficulty level (default: 'standard') */
  difficulty?: DifficultyLevel;
  /** Target scope (default: ['医療AI']) */
  scope?: string[];
  /** Target audiences (default: ['医療機関', '開発企業']) */
  audiences?: string[];
  /** Custom keywords to add */
  customKeywords?: string[];
  /** Priority domains for search */
  priorityDomains?: string[];
  /** Date override (default: today) */
  date?: string;
}

export interface GenerateResult {
  /** Generated prompt text */
  prompt: string;
  /** Generated search queries */
  searchQueries: string[];
  /** Configuration used */
  config: AppConfig;
}
