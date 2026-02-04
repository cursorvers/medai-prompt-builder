/**
 * Medical AI Prompt Builder - Purpose Tabs Component (Desktop)
 * Design: Medical Precision 2.0 - Heavy yet Light
 * 
 * Features:
 * - Premium tab design with icons
 * - Smooth transitions and hover effects
 * - Visual indicator for active state
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
  ChevronRight,
  Star
} from 'lucide-react';

interface PurposeTabsProps {
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
  'medical-device': <Cpu className="w-4 h-4" />,
  'clinical-operation': <Stethoscope className="w-4 h-4" />,
  'research-ethics': <BookOpen className="w-4 h-4" />,
  'generative-ai': <Sparkles className="w-4 h-4" />,
};

const TAB_DESCRIPTIONS: Record<string, string> = {
  'medical-device': 'SaMD・AI医療機器の開発・申請',
  'clinical-operation': '医療機関でのAI導入・運用',
  'research-ethics': '臨床研究・倫理審査対応',
  'generative-ai': '生成AI活用・ガバナンス',
};

export function PurposeTabs({ activeTab, onTabChange }: PurposeTabsProps) {
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
    <div className="hidden lg:block bg-card border-b border-border">
      <div className="container">
        <div className="flex items-center gap-1 py-2 overflow-x-auto">
          <span className="text-xs font-medium text-muted-foreground mr-3 uppercase tracking-wider shrink-0">
            目的
          </span>
          {allPresets.map((preset, index) => {
            const isActive = activeTab === preset.id;
            const isCustom = preset.id.startsWith('custom-');
            const icon = TAB_ICONS[preset.id] || <Star className="w-4 h-4" />;
            const description = TAB_DESCRIPTIONS[preset.id] || `${preset.categories.length}カテゴリ`;
            
            return (
              <button
                key={preset.id}
                onClick={() => onTabChange(preset.id)}
                className={cn(
                  'group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shrink-0',
                  'transition-all duration-200 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? isCustom
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                )}
              >
                {/* Number badge */}
                <span className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-white/20 text-inherit'
                    : isCustom
                      ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-200'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                )}>
                  {index + 1}
                </span>
                
                {/* Icon */}
                <span className={cn(
                  'transition-transform duration-200',
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                )}>
                  {icon}
                </span>
                
                {/* Text */}
                <div className="text-left">
                  <div className="font-semibold flex items-center gap-1.5">
                    {preset.name}
                    {isCustom && (
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full font-normal',
                        isActive ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                      )}>
                        カスタム
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    'text-[10px] font-normal opacity-80 hidden xl:block',
                    isActive ? 'opacity-80' : 'text-muted-foreground'
                  )}>
                    {description}
                  </div>
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
