/**
 * GuideScope - Shared Disclaimer Bar Component
 * Extracted from Header and MobileHeader to reduce code duplication
 */

import { AlertTriangle } from 'lucide-react';
import { DISCLAIMER_LINES } from '@/lib/presets';

interface DisclaimerBarProps {
  variant?: 'desktop' | 'mobile';
}

export function DisclaimerBar({ variant = 'desktop' }: DisclaimerBarProps) {
  if (variant === 'mobile') {
    return (
      <div className="flex items-start gap-2 pt-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
          {DISCLAIMER_LINES.map((line, index) => (
            <p key={index} className="leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 flex flex-wrap gap-x-6 gap-y-1 text-xs text-amber-800 dark:text-amber-200">
        {DISCLAIMER_LINES.map((line, index) => (
          <span key={index} className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-500" />
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
