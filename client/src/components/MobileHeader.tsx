/**
 * Medical AI Prompt Builder - Mobile Header Component
 * Design: Medical Precision 2.0 - Heavy yet Light
 * 
 * Features:
 * - Compact mobile-optimized header
 * - Collapsible disclaimer
 * - Settings navigation
 * - Touch-friendly interactions
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { AlertTriangle, Info, Settings } from 'lucide-react';
import { DISCLAIMER_LINES, TEMPLATE_BASE_DATE } from '@/lib/presets';
import { cn } from '@/lib/utils';

const ICON_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031602391/cUYiFGjZlajscqpc.png';

export function MobileHeader() {
  const [, setLocation] = useLocation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm lg:hidden">
      {/* Main header row */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img 
            src={ICON_URL} 
            alt="Medical AI Icon" 
            className="w-9 h-9 rounded-lg shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">
              医療AI ガイドライン探索
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                プロンプトビルダー
              </span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                {TEMPLATE_BASE_DATE}
              </span>
            </div>
          </div>
          
          {/* Settings Button */}
          <button
            onClick={() => setLocation('/settings')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          {/* Info Button */}
          <button
            onClick={() => setShowDisclaimer(!showDisclaimer)}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
              showDisclaimer 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Collapsible Disclaimer */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          showDisclaimer ? 'max-h-40' : 'max-h-0'
        )}
      >
        <div className="px-4 pb-3 bg-amber-50 border-t border-amber-200">
          <div className="flex items-start gap-2 pt-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 space-y-1">
              {DISCLAIMER_LINES.map((line, index) => (
                <p key={index} className="leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
