/**
 * Medical AI Prompt Builder - Output Panel Component
 * Design: Medical Precision 2.0 - Heavy yet Light
 * 
 * Features:
 * - Tab-based output display (Prompt, Queries, JSON)
 * - Premium action buttons with elegant styling
 * - Copy/Download/Export/Import/Share functionality
 * - Responsive for both PC and Mobile
 */

import { useState, useMemo } from 'react';
import { 
  Copy, 
  Download, 
  Upload, 
  Share2, 
  RotateCcw,
  Check,
  AlertTriangle,
  FileText,
  Search,
  Code,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AppConfig, ValidationResult } from '@/lib/presets';
import { OUTPUT_TABS } from '@/lib/presets';
import { 
  generatePrompt, 
  generateSearchQueries, 
  configToJSON,
  encodeConfigToURL,
  isShareLinkTooLong
} from '@/lib/template';

interface OutputPanelProps {
  config: AppConfig;
  validation: ValidationResult;
  onImportConfig: (json: string) => boolean;
  onResetConfig: () => void;
}

const TAB_ICONS: Record<string, React.ElementType> = {
  prompt: FileText,
  queries: Search,
  json: Code,
};

export function OutputPanel({
  config,
  validation,
  onImportConfig,
  onResetConfig,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState('prompt');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Generate outputs
  const prompt = useMemo(() => generatePrompt(config), [config]);
  const queries = useMemo(() => generateSearchQueries(config), [config]);
  const jsonConfig = useMemo(() => configToJSON(config), [config]);
  
  // Get current content based on active tab
  const getCurrentContent = () => {
    switch (activeTab) {
      case 'prompt':
        return prompt;
      case 'queries':
        return queries.join('\n');
      case 'json':
        return jsonConfig;
      default:
        return '';
    }
  };
  
  // Copy to clipboard
  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('クリップボードにコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  };
  
  // Download as text file
  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} をダウンロードしました`);
  };
  
  // Import JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const success = onImportConfig(text);
        if (success) {
          toast.success('設定をインポートしました');
        } else {
          toast.error('無効な設定ファイルです');
        }
      } catch {
        toast.error('ファイルの読み込みに失敗しました');
      }
    };
    input.click();
  };
  
  // Share link
  const handleShare = async () => {
    if (isShareLinkTooLong(config)) {
      toast.warning('URLが長すぎます。設定JSONをコピーして共有してください。', {
        duration: 5000,
      });
      setActiveTab('json');
      return;
    }
    
    const url = encodeConfigToURL(config);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('共有リンクをコピーしました', {
        description: '個人情報を含まないようご注意ください',
      });
    } catch {
      toast.error('共有リンクの生成に失敗しました');
    }
  };
  
  // Reset
  const handleReset = () => {
    if (confirm('設定をリセットしますか？')) {
      onResetConfig();
      toast.success('設定をリセットしました');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Validation Messages */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="p-4 lg:p-5 space-y-2 border-b border-border bg-gradient-to-r from-amber-50/50 to-orange-50/50">
          {validation.errors.map((error, index) => (
            <div
              key={`error-${index}`}
              className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          ))}
          {validation.warnings.map((warning, index) => (
            <div
              key={`warning-${index}`}
              className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-border px-4 lg:px-5 bg-card">
          <TabsList className="h-14 bg-transparent gap-1 w-full justify-start">
            {OUTPUT_TABS.map((tab) => {
              const Icon = TAB_ICONS[tab.id];
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'relative h-10 px-4 rounded-lg font-medium transition-all',
                    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md',
                    'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-secondary/80'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">
                    {tab.id === 'prompt' ? 'プロンプト' : tab.id === 'queries' ? 'クエリ' : 'JSON'}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 p-4 lg:p-5 border-b border-border bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(getCurrentContent(), 'main')}
            disabled={!validation.isValid && activeTab === 'prompt'}
            className="h-9 gap-2 shadow-sm hover:shadow transition-shadow"
          >
            {copiedId === 'main' ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            コピー
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(
              getCurrentContent(),
              activeTab === 'prompt' 
                ? 'prompt.txt' 
                : activeTab === 'queries' 
                  ? 'queries.txt' 
                  : 'config.json'
            )}
            disabled={!validation.isValid && activeTab === 'prompt'}
            className="h-9 gap-2 shadow-sm hover:shadow transition-shadow"
          >
            <Download className="w-4 h-4" />
            ダウンロード
          </Button>
          
          <div className="hidden sm:block w-px h-6 bg-border self-center mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(jsonConfig, 'config.json')}
            className="h-9 gap-2 text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">JSON</span>エクスポート
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImport}
            className="h-9 gap-2 text-muted-foreground hover:text-foreground"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">JSON</span>インポート
          </Button>
          
          <div className="hidden sm:block w-px h-6 bg-border self-center mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-9 gap-2 text-muted-foreground hover:text-foreground"
          >
            <Share2 className="w-3.5 h-3.5" />
            共有リンク
          </Button>
          
          <div className="flex-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-9 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            リセット
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden bg-muted/10">
          <TabsContent value="prompt" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 lg:p-5">
                {validation.isValid ? (
                  <pre className="prompt-output text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {prompt}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                      <AlertTriangle className="w-8 h-8 text-amber-500" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">プロンプトを生成できません</p>
                    <p className="text-sm mt-2 max-w-xs">
                      左側の設定パネルで必須項目を入力してください
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="queries" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 lg:p-5 space-y-2">
                {queries.map((query, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border group hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <code className="flex-1 text-sm font-mono break-all text-foreground">
                      {query}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8"
                      onClick={() => handleCopy(query, `query-${index}`)}
                      title="コピー"
                      aria-label="コピー"
                    >
                      {copiedId === `query-${index}` ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8"
                      onClick={() => {
                        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      title="Googleで検索"
                      aria-label="Googleで検索"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="json" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 lg:p-5">
                <pre className="prompt-output text-xs leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
                  {jsonConfig}
                </pre>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
