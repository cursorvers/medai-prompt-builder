/**
 * Medical AI Prompt Builder - Mobile Purpose Tabs Component
 * Design: Medical Precision 2.0 - Heavy yet Light
 * 
 * Features:
 * - Compact pill-style tabs for mobile
 * - Horizontal scroll with snap
 * - Touch-optimized
 * - Custom preset support
 */

import { useState, useEffect } from 'react';
import { TAB_PRESETS, type TabPreset } from '@/lib/presets';
import { cn } from '@/lib/utils';
import { 
  Cpu, 
  Stethoscope, 
  BookOpen, 
  Sparkles,
  Star
} from 'lucide-react';

interface MobilePurposeTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
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

const TAB_ICONS: Record<string, React.ReactNode> = {
  'medical-device': <Cpu className="w-3.5 h-3.5" />,
  'clinical-operation': <Stethoscope className="w-3.5 h-3.5" />,
  'research-ethics': <BookOpen className="w-3.5 h-3.5" />,
  'generative-ai': <Sparkles className="w-3.5 h-3.5" />,
};

const TAB_SHORT_NAMES: Record<string, string> = {
  'medical-device': '機器開発',
  'clinical-operation': '臨床運用',
  'research-ethics': '研究倫理',
  'generative-ai': '生成AI',
};

export function MobilePurposeTabs({ activeTab, onTabChange }: MobilePurposeTabsProps) {
  const [customPresets, setCustomPresets] = useState<TabPreset[]>([]);
  
  // Load custom presets on mount and listen for storage changes
  useEffect(() => {
    setCustomPresets(loadCustomPresets());
    
    // Listen for storage changes (from Settings page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CUSTOM_PRESETS_KEY) {
        setCustomPresets(loadCustomPresets());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for same-tab updates
    const interval = setInterval(() => {
      setCustomPresets(loadCustomPresets());
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  // Combine built-in and custom presets
  const allPresets = [...TAB_PRESETS, ...customPresets];
  
  return (
    <div className="bg-card border-b border-border lg:hidden">
      <div className="px-3 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1">
          {allPresets.map((preset) => {
            const isActive = activeTab === preset.id;
            const isCustom = preset.id.startsWith('custom-');
            const icon = TAB_ICONS[preset.id] || <Star className="w-3.5 h-3.5" />;
            const shortName = TAB_SHORT_NAMES[preset.id] || preset.name.slice(0, 6);
            
            return (
              <button
                key={preset.id}
                onClick={() => onTabChange(preset.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap snap-start',
                  'transition-all duration-150 active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? isCustom
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-primary text-primary-foreground shadow-sm'
                    : isCustom
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-secondary text-muted-foreground'
                )}
              >
                {icon}
                <span>{shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
