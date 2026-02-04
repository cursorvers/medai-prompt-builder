/**
 * Medical AI Prompt Builder - Header Component (Desktop)
 * Design: Medical Precision 2.0 - Heavy yet Light
 * 
 * Features:
 * - Premium app branding with icon
 * - Disclaimer display with elegant styling
 * - Template base date indicator
 * - Settings navigation
 * - Desktop-optimized layout
 */

import { useLocation } from 'wouter';
import { AlertTriangle, Calendar, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DISCLAIMER_LINES, TEMPLATE_BASE_DATE } from '@/lib/presets';

const ICON_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031602391/cUYiFGjZlajscqpc.png';

export function Header() {
  const [, setLocation] = useLocation();
  
  return (
    <header className="hidden lg:block sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
      {/* Main header row */}
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={ICON_URL} 
                alt="Medical AI Icon" 
                className="w-12 h-12 rounded-xl shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                医療AI 国内ガイドライン探索
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gemini貼り付け用プロンプトビルダー
              </p>
            </div>
          </div>
          
          {/* Right side: Date Badge + Settings */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/80 px-4 py-2 rounded-lg border border-border">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium">テンプレート基準日:</span>
              <span className="font-mono text-foreground">{TEMPLATE_BASE_DATE}</span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation('/settings')}
              className="h-10 w-10 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Disclaimer bar - Elegant warning style */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200/60">
        <div className="container py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 flex flex-wrap gap-x-6 gap-y-1 text-xs text-amber-800">
              {DISCLAIMER_LINES.map((line, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  {line}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
