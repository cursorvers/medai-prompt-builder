/**
 * GuideScope Core
 * Japanese medical guideline search prompt generator
 *
 * @packageDocumentation
 * @module @cursorvers/guidescope
 *
 * @example
 * ```typescript
 * import { generate, generatePrompt, generateSearchQueries } from '@cursorvers/guidescope';
 *
 * // Simple usage
 * const result = generate({
 *   query: '医療AIの臨床導入における安全管理',
 * });
 * console.log(result.prompt);
 * console.log(result.searchQueries);
 *
 * // With options
 * const result = generate({
 *   query: '医療AIの臨床導入における安全管理',
 *   preset: 'clinical-operation',
 *   difficulty: 'professional',
 *   customKeywords: ['透析患者', '在宅医療'],
 * });
 *
 * // Prompt only
 * const prompt = generatePrompt({
 *   query: 'SaMD承認申請',
 *   preset: 'medical-device',
 * });
 *
 * // Search queries only
 * const queries = generateSearchQueries({
 *   query: '生成AI 医療',
 *   preset: 'generative-ai',
 * });
 * ```
 */

// Types
export type {
  DifficultyLevel,
  DifficultyPreset,
  TabPreset,
  CategoryItem,
  KeywordChipItem,
  AppConfig,
  OutputSection,
  TemplateSettings,
  SearchSettings,
  OutputSettings,
  ExtendedSettings,
  GeneratePromptOptions,
  GenerateResult,
} from './types';

// Presets
export {
  DIFFICULTY_PRESETS,
  getDifficultyPreset,
  TAB_PRESETS,
  getTabPreset,
  DEFAULT_PRIORITY_DOMAINS,
  DEFAULT_SCOPE_OPTIONS,
  DEFAULT_AUDIENCE_OPTIONS,
} from './presets';

// Template generation
export {
  generate,
  generatePrompt,
  generateSearchQueries,
  createConfig,
  generatePromptFromConfig,
  generateSearchQueriesFromConfig,
} from './template';
