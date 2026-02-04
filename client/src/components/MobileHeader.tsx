/**
 * GuideScope - Mobile Header Component
 *
 * Features:
 * - Compact mobile-optimized header
 * - Collapsible disclaimer
 * - Settings navigation
 * - Touch-friendly interactions
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Info, Settings, Shield } from 'lucide-react';
import { TEMPLATE_BASE_DATE } from '@/lib/presets';
import { cn } from '@/lib/utils';
import { DisclaimerBar } from './DisclaimerBar';

export function MobileHeader() {
  const [, setLocation] = useLocation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm lg:hidden">
      {/* Main header row */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg shadow-sm bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">
              GuideScope
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                医療AI ガイドライン探索
              </span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                {TEMPLATE_BASE_DATE}
              </span>
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setLocation('/settings')}
            aria-label="設定"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Info Button */}
          <button
            onClick={() => setShowDisclaimer(!showDisclaimer)}
            aria-label="免責事項を表示"
            aria-expanded={showDisclaimer}
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
          <DisclaimerBar variant="mobile" />
        </div>
      </div>
    </header>
  );
}
