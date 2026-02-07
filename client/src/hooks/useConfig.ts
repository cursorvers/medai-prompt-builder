/**
 * Medical AI Prompt Builder - Config State Management Hook
 * Design: Medical Precision 2.0 - Heavy yet Light
 * 
 * Features:
 * - State management for app configuration
 * - LocalStorage persistence
 * - URL parameter import
 * - Custom preset support
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type AppConfig,
  type DifficultyLevel,
  type TabPreset,
  STORAGE_KEY,
  TAB_PRESETS,
  createDefaultConfig,
  getDifficultyPreset,
  normalizeConfig,
  validateConfig,
  parseConfigJSON,
  type ValidationResult,
} from '@/lib/presets';
import { decodeConfigFromURL } from '@/lib/template';
import { parseAppConfig } from '@/lib/schemas';
import { loadExtendedSettings, saveExtendedSettings } from '@/lib/settings';

const MAX_VENDOR_DOC_CHARS = 60_000;

function capVendorDocText(text: string): string {
  const t = text ?? '';
  if (t.length <= MAX_VENDOR_DOC_CHARS) return t;
  // Keep it simple here: localStorage safety > perfect fidelity.
  return `${t.slice(0, MAX_VENDOR_DOC_CHARS)}\n\n...(省略: ${(
    t.length - MAX_VENDOR_DOC_CHARS
  ).toLocaleString()}文字)...\n`;
}

function syncExtendedSettingsForDifficulty(level: DifficultyLevel) {
  // Keep Settings page toggles aligned with the chosen difficulty.
  // generatePrompt still applies its own difficulty clamping, but without this
  // the UI can look inconsistent across pages.
  if (typeof window === 'undefined') return;
  try {
    const preset = getDifficultyPreset(level).settings;
    const current = loadExtendedSettings();

    saveExtendedSettings({
      ...current,
      search: {
        ...current.search,
        maxResults: preset.maxResults,
        recursiveDepth: preset.recursiveDepth,
      },
      output: {
        ...current.output,
        detailLevel: preset.detailLevel,
        eGovCrossReference: preset.eGovCrossReference,
        includeLawExcerpts: preset.includeLawExcerpts,
        // Standard should stay lightweight; Professional defaults to ON.
        includeSearchLog: level === 'professional',
      },
    });
  } catch {
    // Ignore storage errors
  }
}

// Storage key for custom presets
const CUSTOM_PRESETS_KEY = 'medai_custom_presets_v1';

// Load custom presets from localStorage
function loadCustomPresets(): TabPreset[] {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return [];
}

// Get all presets (built-in + custom)
function getAllPresets(): TabPreset[] {
  return [...TAB_PRESETS, ...loadCustomPresets()];
}

// ============================================================================
// Hook
// ============================================================================

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(() => {
    // Try to restore from URL first
    const urlConfig = decodeConfigFromURL(window.location.href);
    if (urlConfig) {
      // Validate URL config with Zod
      const validated = parseAppConfig(urlConfig);
      if (validated) {
        // Clear the URL parameter after loading
        window.history.replaceState({}, '', window.location.pathname);
        const normalized = normalizeConfig(validated);
        return { ...normalized, vendorDocText: capVendorDocText(normalized.vendorDocText || '') };
      }
      console.warn('URL config validation failed, trying localStorage');
    }

    // Try to restore from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate with Zod schema
        const validated = parseAppConfig(parsed);
        if (validated) {
          const normalized = normalizeConfig(validated);
          return { ...normalized, vendorDocText: capVendorDocText(normalized.vendorDocText || '') };
        }
        console.warn('LocalStorage config validation failed, using defaults');
      }
    } catch {
      // Ignore errors
    }

    // Return default config
    return createDefaultConfig();
  });
  
  const [validation, setValidation] = useState<ValidationResult>(() => validateConfig(config));
  
  // Save to localStorage whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage errors
    }
    setValidation(validateConfig(config));
  }, [config]);
  
  // Update a single field
  const updateField = useCallback(<K extends keyof AppConfig>(
    field: K,
    value: AppConfig[K]
  ) => {
    if (field === 'difficultyLevel') {
      syncExtendedSettingsForDifficulty(value as DifficultyLevel);
    }
    setConfig(prev => {
      if (field === 'vendorDocText' && typeof value === 'string') {
        return { ...prev, vendorDocText: capVendorDocText(value) } as AppConfig;
      }
      if (field === 'difficultyLevel' && value === 'standard') {
        // Standard is meant to be "light and safe" for general clinicians.
        // Keep user's inputs, but reset defaults to a clinical-operation profile.
        const defaults = createDefaultConfig('clinical-operation');
        return {
          ...defaults,
          dateToday: prev.dateToday,
          query: prev.query,
          vendorDocText: prev.vendorDocText,
          aiInScope: prev.aiInScope,
          customKeywords: prev.customKeywords,
          excludeKeywords: prev.excludeKeywords,
        };
      }
      if (field === 'difficultyLevel' && value === 'professional') {
        // Professional defaults: thorough, but e-Gov is optional (off by default).
        return {
          ...prev,
          difficultyLevel: value,
          threeMinistryGuidelines: true,
          officialDomainPriority: true,
          siteOperator: true,
          latestVersionPriority: true,
          pdfDirectLink: true,
          includeSearchLog: true,
          eGovCrossReference: false,
          proofMode: true,
        };
      }
      return { ...prev, [field]: value };
    });
  }, []);
  
  // Switch tab and update categories/keywords
  const switchTab = useCallback((tabId: string) => {
    // Get all presets including custom ones
    const allPresets = getAllPresets();
    const preset = allPresets.find(t => t.id === tabId);
    if (!preset) return;
    
    setConfig(prev => ({
      ...prev,
      activeTab: tabId,
      categories: preset.categories.map(name => ({ name, enabled: true })),
      keywordChips: preset.keywordChips.map(name => ({ name, enabled: true })),
    }));
  }, []);
  
  // Toggle category by name
  const toggleCategory = useCallback((name: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.name === name ? { ...cat, enabled: !cat.enabled } : cat
      ),
    }));
  }, []);
  
  // Move category up/down
  const moveCategory = useCallback((index: number, direction: 'up' | 'down') => {
    setConfig(prev => {
      const newCategories = [...prev.categories];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newCategories.length) {
        return prev;
      }
      
      [newCategories[index], newCategories[targetIndex]] = 
        [newCategories[targetIndex], newCategories[index]];
      
      return { ...prev, categories: newCategories };
    });
  }, []);
  
  // Toggle keyword chip by name
  const toggleKeywordChip = useCallback((name: string) => {
    setConfig(prev => ({
      ...prev,
      keywordChips: prev.keywordChips.map(chip =>
        chip.name === name ? { ...chip, enabled: !chip.enabled } : chip
      ),
    }));
  }, []);
  
  // Toggle scope item
  const toggleScope = useCallback((scope: string) => {
    setConfig(prev => {
      const exists = prev.scope.includes(scope);
      return {
        ...prev,
        scope: exists
          ? prev.scope.filter(s => s !== scope)
          : [...prev.scope, scope],
      };
    });
  }, []);
  
  // Add custom scope
  const addCustomScope = useCallback((scope: string) => {
    if (!scope.trim()) return;
    setConfig(prev => ({
      ...prev,
      scope: prev.scope.includes(scope) ? prev.scope : [...prev.scope, scope],
    }));
  }, []);
  
  // Toggle audience
  const toggleAudience = useCallback((audience: string) => {
    setConfig(prev => {
      const exists = prev.audiences.includes(audience);
      return {
        ...prev,
        audiences: exists
          ? prev.audiences.filter(a => a !== audience)
          : [...prev.audiences, audience],
      };
    });
  }, []);
  
  // Add priority domain
  const addPriorityDomain = useCallback((domain: string) => {
    if (!domain.trim()) return;
    setConfig(prev => ({
      ...prev,
      priorityDomains: prev.priorityDomains.includes(domain)
        ? prev.priorityDomains
        : [...prev.priorityDomains, domain],
    }));
  }, []);
  
  // Remove priority domain
  const removePriorityDomain = useCallback((domain: string) => {
    setConfig(prev => ({
      ...prev,
      priorityDomains: prev.priorityDomains.filter(d => d !== domain),
    }));
  }, []);
  
  // Set custom keywords (from textarea, one per line)
  const setCustomKeywords = useCallback((text: string) => {
    const keywords = text.split('\n').map(k => k.trim()).filter(Boolean);
    setConfig(prev => ({ ...prev, customKeywords: keywords }));
  }, []);
  
  // Set exclude keywords (from textarea, one per line)
  const setExcludeKeywords = useCallback((text: string) => {
    const keywords = text.split('\n').map(k => k.trim()).filter(Boolean);
    setConfig(prev => ({ ...prev, excludeKeywords: keywords }));
  }, []);
  
  // Reset to default
  const resetConfig = useCallback(() => {
    const newConfig = createDefaultConfig(config.activeTab);
    setConfig(newConfig);
  }, [config.activeTab]);
  
  // Import config from JSON with Zod validation
  const importConfig = useCallback((json: string): boolean => {
    const validated = parseConfigJSON(json);
    if (validated) {
      const normalized = normalizeConfig(validated);
      setConfig({ ...normalized, vendorDocText: capVendorDocText(normalized.vendorDocText || '') });
      return true;
    }
    return false;
  }, []);
  
  return {
    config,
    validation,
    updateField,
    switchTab,
    toggleCategory,
    moveCategory,
    toggleKeywordChip,
    toggleScope,
    addCustomScope,
    toggleAudience,
    addPriorityDomain,
    removePriorityDomain,
    setCustomKeywords,
    setExcludeKeywords,
    resetConfig,
    importConfig,
  };
}
