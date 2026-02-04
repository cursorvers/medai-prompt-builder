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
  type TabPreset,
  STORAGE_KEY,
  TAB_PRESETS,
  createDefaultConfig,
  validateConfig,
  type ValidationResult,
} from '@/lib/presets';
import { decodeConfigFromURL } from '@/lib/template';

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
      // Clear the URL parameter after loading
      window.history.replaceState({}, '', window.location.pathname);
      return urlConfig;
    }
    
    // Try to restore from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed as AppConfig;
        }
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
    setConfig(prev => ({ ...prev, [field]: value }));
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
  
  // Toggle category
  const toggleCategory = useCallback((index: number) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) =>
        i === index ? { ...cat, enabled: !cat.enabled } : cat
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
  
  // Toggle keyword chip
  const toggleKeywordChip = useCallback((index: number) => {
    setConfig(prev => ({
      ...prev,
      keywordChips: prev.keywordChips.map((chip, i) =>
        i === index ? { ...chip, enabled: !chip.enabled } : chip
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
  
  // Import config from JSON
  const importConfig = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object' && 'activeTab' in parsed) {
        setConfig(parsed as AppConfig);
        return true;
      }
      return false;
    } catch {
      return false;
    }
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
