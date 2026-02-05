/**
 * GuideScope Core - Type Definitions
 * Japanese medical guideline search prompt generator
 */
type DifficultyLevel = 'standard' | 'professional';
interface DifficultyPreset {
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
interface TabPreset {
    id: string;
    name: string;
    categories: string[];
    keywordChips: string[];
}
interface CategoryItem {
    name: string;
    enabled: boolean;
}
interface KeywordChipItem {
    name: string;
    enabled: boolean;
}
interface AppConfig {
    dateToday: string;
    query: string;
    scope: string[];
    audiences: string[];
    difficultyLevel: DifficultyLevel;
    threeMinistryGuidelines: boolean;
    officialDomainPriority: boolean;
    siteOperator: boolean;
    latestVersionPriority: boolean;
    pdfDirectLink: boolean;
    includeSearchLog: boolean;
    eGovCrossReference: boolean;
    proofMode: boolean;
    categories: CategoryItem[];
    keywordChips: KeywordChipItem[];
    customKeywords: string[];
    excludeKeywords: string[];
    priorityDomains: string[];
    activeTab: string;
}
interface OutputSection {
    id: string;
    name: string;
    enabled: boolean;
    order: number;
}
interface TemplateSettings {
    roleTitle: string;
    roleDescription: string;
    disclaimers: string[];
    outputSections: OutputSection[];
    customInstructions: string;
}
interface SearchSettings {
    useSiteOperator: boolean;
    useFiletypeOperator: boolean;
    filetypes: string[];
    priorityRule: 'published_date' | 'revised_date' | 'relevance';
    excludedDomains: string[];
    maxResults: number;
    recursiveDepth: number;
}
interface OutputSettings {
    languageMode: 'japanese_only' | 'mixed' | 'english_priority';
    includeEnglishTerms: boolean;
    detailLevel: 'concise' | 'standard' | 'detailed';
    eGovCrossReference: boolean;
    includeLawExcerpts: boolean;
    outputFormat: 'markdown' | 'plain_text';
    includeSearchLog: boolean;
}
interface ExtendedSettings {
    template: TemplateSettings;
    search: SearchSettings;
    output: OutputSettings;
}
interface GeneratePromptOptions {
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
interface GenerateResult {
    /** Generated prompt text */
    prompt: string;
    /** Generated search queries */
    searchQueries: string[];
    /** Configuration used */
    config: AppConfig;
}

/**
 * GuideScope Core - Presets
 * Japanese medical guideline search prompt generator
 */

declare const DIFFICULTY_PRESETS: DifficultyPreset[];
declare function getDifficultyPreset(level: DifficultyLevel): DifficultyPreset;
declare const TAB_PRESETS: TabPreset[];
declare function getTabPreset(id: string): TabPreset;
declare const DEFAULT_PRIORITY_DOMAINS: string[];
declare const DEFAULT_SCOPE_OPTIONS: string[];
declare const DEFAULT_AUDIENCE_OPTIONS: string[];

/**
 * GuideScope Core - Template Generation
 * Japanese medical guideline search prompt generator
 */

declare function createConfig(options: GeneratePromptOptions): AppConfig;
/**
 * Generate a prompt from AppConfig
 */
declare function generatePromptFromConfig(config: AppConfig, extSettings?: ExtendedSettings): string;
/**
 * Generate search queries from AppConfig
 */
declare function generateSearchQueriesFromConfig(config: AppConfig, extSettings?: ExtendedSettings): string[];
/**
 * Generate prompt and search queries from simple options
 *
 * @example
 * ```typescript
 * const result = generate({
 *   query: '医療AIの臨床導入における安全管理',
 *   preset: 'clinical-operation',
 *   difficulty: 'professional',
 * });
 *
 * console.log(result.prompt);
 * console.log(result.searchQueries);
 * ```
 */
declare function generate(options: GeneratePromptOptions): GenerateResult;
/**
 * Generate prompt only
 */
declare function generatePrompt(options: GeneratePromptOptions): string;
/**
 * Generate search queries only
 */
declare function generateSearchQueries(options: GeneratePromptOptions): string[];

export { type AppConfig, type CategoryItem, DEFAULT_AUDIENCE_OPTIONS, DEFAULT_PRIORITY_DOMAINS, DEFAULT_SCOPE_OPTIONS, DIFFICULTY_PRESETS, type DifficultyLevel, type DifficultyPreset, type ExtendedSettings, type GeneratePromptOptions, type GenerateResult, type KeywordChipItem, type OutputSection, type OutputSettings, type SearchSettings, TAB_PRESETS, type TabPreset, type TemplateSettings, createConfig, generate, generatePrompt, generatePromptFromConfig, generateSearchQueries, generateSearchQueriesFromConfig, getDifficultyPreset, getTabPreset };
