/**
 * Medical AI Prompt Builder - Home Page
 * X反応確認用ミニマル版対応
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Settings,
  Copy,
  Download,
  Share2,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  HelpCircle,
  X,
  Lock,
  Check,
  AlertCircle,
  Star,
  Zap,
  ExternalLink,
  MessageCircle,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { TAB_PRESETS, DIFFICULTY_PRESETS, type AppConfig, type DifficultyLevel } from '@/lib/presets';
import { generatePrompt, generateSearchQueries, configToJSON, parseConfigJSON, encodeConfigToURL } from '@/lib/template';
import { useConfig } from '@/hooks/useConfig';
import { useMinimalMode } from '@/contexts/MinimalModeContext';
import {
  trackPresetSelect,
  trackPromptCopy,
  trackPromptDownload,
  trackComingSoonClick,
  trackSettingsAttempt,
  trackExecutePrompt,
  trackContactClick,
  trackOutdatedReportClick,
} from '@/lib/analytics';

const MOBILE_MEDIA_QUERY = '(max-width: 1023px)';
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'number', 'tel', 'url', 'password']);

/**
 * Coming Soon オーバーレイコンポーネント
 */
function ComingSoonOverlay({
  featureName,
  children,
}: {
  featureName: string;
  children: React.ReactNode;
}) {
  const { isMinimalMode } = useMinimalMode();

  if (!isMinimalMode) {
    return <>{children}</>;
  }

  const handleClick = () => {
    trackComingSoonClick(featureName);
    toast.info(`「${featureName}」は近日公開予定です`, {
      description: 'ご興味ありがとうございます！',
    });
  };

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">
        {children}
      </div>
      <button
        onClick={handleClick}
        className="absolute inset-0 flex items-center justify-center bg-muted/60 backdrop-blur-[1px] rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full shadow-sm">
          <Lock className="w-3 h-3" />
          Coming Soon
        </span>
      </button>
    </div>
  );
}

type ExecuteButtonBarProps = {
  onExecute: () => void;
  disabled: boolean;
};

function ExecuteButtonBar({ onExecute, disabled }: ExecuteButtonBarProps) {
  return (
    <>
      <Button
        size="lg"
        className="w-full text-base font-semibold"
        onClick={onExecute}
        disabled={disabled}
      >
        <Sparkles className="w-5 h-5 mr-2" />
        プロンプトを生成
      </Button>

      {disabled && (
        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          探索テーマを入力してください
        </p>
      )}
    </>
  );
}

export default function Home() {
  const {
    config,
    resetConfig,
    switchTab,
    updateField,
    toggleCategory,
    toggleKeywordChip,
    toggleScope,
    toggleAudience,
    setCustomKeywords,
    importConfig,
  } = useConfig();

  const { isMinimalMode } = useMinimalMode();

  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    scope: true,
    audience: true,
    options: false,
    categories: false,
    keywords: false,
    domains: false,
  });
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [hasExecutedBefore, setHasExecutedBefore] = useState(() => {
    return localStorage.getItem('medai_has_executed') === 'true';
  });
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });
  const isExecuteDisabled = !config.query.trim();

  // 初回実行フラグをlocalStorageに保存
  useEffect(() => {
    if (hasExecutedBefore) {
      localStorage.setItem('medai_has_executed', 'true');
    }
  }, [hasExecutedBefore]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsMobile);
    } else {
      mediaQuery.addListener(updateIsMobile);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateIsMobile);
      } else {
        mediaQuery.removeListener(updateIsMobile);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsInputFocused(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (typeof document === 'undefined' || !isMobile) {
      return;
    }

    const updateFocusState = () => {
      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        !!active &&
        (active.tagName === 'TEXTAREA' ||
          active.isContentEditable ||
          (active.tagName === 'INPUT' &&
            TEXT_INPUT_TYPES.has((active as HTMLInputElement).type)));
      setIsInputFocused(isEditable);
    };

    const handleFocus = () => updateFocusState();

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleFocus);
    updateFocusState();

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleFocus);
    };
  }, [isMobile]);

  // 全プリセット
  const allPresets = useMemo(() => TAB_PRESETS, []);

  // 現在のプリセット
  const currentPreset = useMemo(() => {
    return allPresets.find(p => p.id === config.activeTab) || TAB_PRESETS[0];
  }, [allPresets, config.activeTab]);

  // プロンプト生成
  const generatedPrompt = useMemo(() => {
    return generatePrompt(config);
  }, [config]);

  // 検索クエリ生成
  const searchQueries = useMemo(() => generateSearchQueries(config), [config]);

  // Phase 6: 設定完了度の計算
  const completionPercentage = useMemo(() => {
    let completed = 0;
    let total = 2; // 必須項目: テーマ、プリセット

    if (config.query.trim()) completed++;
    if (config.activeTab) completed++;

    // Coming Soon が無効化されている場合のオプション項目
    if (!isMinimalMode) {
      total += 4; // 対象者、範囲、カテゴリ、検索語
      if (config.audiences.length > 0) completed++;
      if (config.scope.length > 0) completed++;
      if (config.categories.filter(c => c.enabled).length > 0) completed++;
      if (config.keywordChips.filter(k => k.enabled).length > 0) completed++;
    }

    return Math.round((completed / total) * 100);
  }, [config.query, config.activeTab, config.audiences, config.scope, config.categories, config.keywordChips, isMinimalMode]);

  // プリセット選択（トラッキング付き）
  const handlePresetSelect = (presetId: string) => {
    const preset = allPresets.find(p => p.id === presetId);
    if (preset) {
      trackPresetSelect(presetId, preset.name);
      switchTab(presetId);
    }
  };

  // コピー（トラッキング付き）
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      trackPromptCopy(config.activeTab);
      toast.success('プロンプトをコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  }, [generatedPrompt, config.activeTab]);

  // ダウンロード（トラッキング付き）
  const handleDownload = useCallback(() => {
    const blob = new Blob([generatedPrompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${config.dateToday}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    trackPromptDownload(config.activeTab);
    toast.success('ダウンロードしました');
  }, [generatedPrompt, config.activeTab, config.dateToday]);

  // 実行ボタン（Phase 4）
  const handleExecute = useCallback(() => {
    if (!config.query.trim()) {
      toast.error('探索テーマを入力してください');
      return;
    }

    // アナリティクス記録
    trackExecutePrompt(config.activeTab, config.customKeywords.length > 0);

    // 成功フィードバック
    toast.success('プロンプトを生成しました', {
      description: '右側の「プロンプト」タブで内容を確認できます',
    });

    // モバイル: プロンプトタブへ自動スクロール
    const outputPanel = document.querySelector('[data-output-panel]');
    if (outputPanel) {
      outputPanel.scrollIntoView({ behavior: 'smooth' });
    }

    // 初回実行時の解説モーダル表示
    if (!hasExecutedBefore) {
      setShowIntroModal(true);
      setHasExecutedBefore(true);
    }
  }, [config.query, config.activeTab, config.customKeywords, hasExecutedBefore]);

  // JSON エクスポート
  const handleExportJSON = () => {
    if (isMinimalMode) {
      trackComingSoonClick('JSONエクスポート');
      toast.info('JSONエクスポートは近日公開予定です');
      return;
    }
    const json = configToJSON(config);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config_${config.dateToday}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('設定をエクスポートしました');
  };

  // JSON インポート
  const handleImportJSON = () => {
    if (isMinimalMode) {
      trackComingSoonClick('JSONインポート');
      toast.info('JSONインポートは近日公開予定です');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          if (importConfig(json)) {
            toast.success('設定をインポートしました');
          } else {
            toast.error('無効なJSONファイルです');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // 共有リンク
  const handleShare = useCallback(async () => {
    if (isMinimalMode) {
      trackComingSoonClick('共有リンク');
      toast.info('共有リンクは近日公開予定です');
      return;
    }
    const url = encodeConfigToURL(config);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('共有リンクをコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  }, [config, isMinimalMode]);

  // 設定ページへのリンククリック
  const handleSettingsClick = (e: React.MouseEvent) => {
    if (isMinimalMode) {
      e.preventDefault();
      trackSettingsAttempt();
      toast.info('詳細設定は近日公開予定です');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">GuideScope</h1>
              <p className="text-xs text-muted-foreground">生成AI 国内ガイドライン検索プロンプト設計</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUsageGuide(!showUsageGuide)}
              className="text-xs"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">使い方</span>
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {config.dateToday}
            </span>
            <Link href="/settings" onClick={handleSettingsClick}>
              <Button
                variant="ghost"
                size="icon"
                className={isMinimalMode ? 'opacity-50' : ''}
              >
                <Settings className="w-4 h-4" />
                {isMinimalMode && <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5" />}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-4 pb-24 lg:pb-4">
        {/* 使い方ガイド */}
        {showUsageGuide && (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg relative">
            <button
              onClick={() => setShowUsageGuide(false)}
              className="absolute top-2 right-2 p-1 hover:bg-primary/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-sm mb-2 text-primary">使い方</h3>
            <ol className="text-sm space-y-1.5 text-muted-foreground">
              <li><span className="font-medium text-foreground">1.</span> 探索テーマを入力（例：医療AIの臨床導入における安全管理）</li>
              <li><span className="font-medium text-foreground">2.</span> 目的プリセットを選択（医療機器開発、臨床運用、研究倫理、生成AI）</li>
              <li><span className="font-medium text-foreground">3.</span> 「コピー」ボタンでプロンプトをコピー</li>
              <li><span className="font-medium text-foreground">4.</span> お好みのLLM（Gemini、ChatGPT、Claude等）に貼り付けて実行</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-primary/20">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">対応LLM:</span> Google Gemini、ChatGPT、Claude、Perplexity、Microsoft Copilot など、Web検索機能を持つLLMで使用できます。
              </p>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
          {/* 左カラム: 設定 */}
          <div className="space-y-3">
            {/* Phase 6: 設定完了度インジケーター */}
            <div className="simple-card p-3 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">設定完了度</span>
                <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
              </div>

              <Progress value={completionPercentage} className="h-2 mb-2" />

              <div className="flex flex-wrap gap-2 text-xs">
                {config.query && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" />
                    テーマ入力済み
                  </span>
                )}
                {config.activeTab && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" />
                    プリセット選択済み
                  </span>
                )}
              </div>
            </div>

            {/* 1. 探索テーマ - 常に有効 */}
            <div className="simple-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="query" className="text-sm font-medium">
                  探索テーマ
                </Label>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      プロンプト生成の中心となる質問やテーマです。具体的な状況や目的を入力すると、より的確な検索結果が得られます。
                    </p>
                  </TooltipContent>
                </Tooltip>

                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  必須
                </span>
              </div>
              <Input
                id="query"
                value={config.query}
                onChange={(e) => updateField('query', e.target.value)}
                placeholder="例: 医療AIの臨床導入における安全管理"
              />
            </div>

            {/* 1.5. 難易度選択（Phase 5） */}
            <div className="simple-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm font-medium">難易度</Label>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  基本設定
                </span>
              </div>

              {/* 使い分けガイド（折りたたみ） */}
              <Collapsible className="mb-3">
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <HelpCircle className="w-3 h-3" />
                  <span>どちらを選ぶべき？</span>
                  <ChevronDown className="w-3 h-3" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-3">
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3" />
                        スタンダードを選ぶケース
                      </p>
                      <ul className="text-muted-foreground space-y-0.5 list-disc list-inside ml-1">
                        <li>関連するガイドラインの全体像を把握したい</li>
                        <li>どのような指針があるか調査段階</li>
                        <li>LLMの処理時間を短くしたい</li>
                        <li>初めてこのツールを使う</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-1 mb-1">
                        <Zap className="w-3 h-3" />
                        プロフェッショナルを選ぶケース
                      </p>
                      <ul className="text-muted-foreground space-y-0.5 list-disc list-inside ml-1">
                        <li>具体的な条文・根拠を特定したい</li>
                        <li>法令との関係を整理したい</li>
                        <li>申請書類・報告書の作成準備</li>
                        <li>監査・コンプライアンス対応</li>
                      </ul>
                    </div>
                    <p className="text-muted-foreground pt-2 border-t border-primary/20">
                      <strong>ヒント:</strong> まずスタンダードで全体像を把握し、詳細が必要な分野をプロフェッショナルで深掘りするのがおすすめです。
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => updateField('difficultyLevel', preset.id as DifficultyLevel)}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all text-left',
                      config.difficultyLevel === preset.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {preset.icon === 'star' ? <Star className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      <span className="font-semibold text-sm">{preset.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {preset.description}
                    </p>
                    {config.difficultyLevel === preset.id && (
                      <ul className="text-xs text-muted-foreground space-y-0.5 mt-2 pt-2 border-t border-border">
                        {preset.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 目的プリセット - 常に有効 */}
            <div className="simple-card p-3 border-2 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold">目的プリセット</Label>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      探索の目的に応じて、カテゴリと検索語を自動設定します。プリセット変更により下記の設定が更新されます。
                    </p>
                  </TooltipContent>
                </Tooltip>

                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  他の設定に影響
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                プリセットを選択すると、カテゴリ例と追加検索語が自動的に設定されます
              </p>

              <div className="flex flex-wrap gap-2">
                {allPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={cn(
                      'px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all',
                      config.activeTab === preset.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                        : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {config.activeTab && (
                <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    <span>カテゴリ: {currentPreset.categories.length}件が設定されます</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    <span>検索語: {currentPreset.keywordChips.length}件が設定されます</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. 対象者 - グレーアウト対象 */}
            <ComingSoonOverlay featureName="対象者">
              <Collapsible
                open={sectionsOpen.audience}
                onOpenChange={(open) => setSectionsOpen({ ...sectionsOpen, audience: open })}
              >
                <div className="simple-card">
                  <CollapsibleTrigger className="collapsible-header">
                    <span className="text-sm font-medium">対象者</span>
                    {sectionsOpen.audience ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content">
                    <div className="flex flex-wrap gap-1.5">
                      {['医療機関', '提供事業者', '開発企業', '研究者', '審査対応'].map(audience => (
                        <button
                          key={audience}
                          onClick={() => toggleAudience(audience)}
                          className={`chip ${config.audiences.includes(audience) ? 'active' : ''}`}
                        >
                          {audience}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </ComingSoonOverlay>

            {/* 4. 対象範囲 - グレーアウト対象 */}
            <ComingSoonOverlay featureName="対象範囲">
              <Collapsible
                open={sectionsOpen.scope}
                onOpenChange={(open) => setSectionsOpen({ ...sectionsOpen, scope: open })}
              >
                <div className="simple-card">
                  <CollapsibleTrigger className="collapsible-header">
                    <span className="text-sm font-medium">対象範囲</span>
                    {sectionsOpen.scope ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content">
                    <div className="flex flex-wrap gap-1.5">
                      {['医療AI', '生成AI', 'SaMD', '医療情報セキュリティ', '医療データ利活用', '研究倫理'].map(scope => (
                        <button
                          key={scope}
                          onClick={() => toggleScope(scope)}
                          className={`chip ${config.scope.includes(scope) ? 'active' : ''}`}
                        >
                          {scope}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </ComingSoonOverlay>

            {/* 5. カテゴリ - グレーアウト対象 */}
            <ComingSoonOverlay featureName="カテゴリ">
              <Collapsible
                open={sectionsOpen.categories}
                onOpenChange={(open) => setSectionsOpen({ ...sectionsOpen, categories: open })}
              >
                <div className="simple-card">
                  <CollapsibleTrigger className="collapsible-header">
                    <span className="text-sm font-medium">カテゴリ例</span>
                    {sectionsOpen.categories ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content">
                    <div className="flex flex-wrap gap-1.5">
                      {currentPreset.categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`chip ${config.categories.find(c => c.name === cat)?.enabled ? 'active' : ''}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </ComingSoonOverlay>

            {/* 6. 追加検索語 - グレーアウト対象 */}
            <ComingSoonOverlay featureName="追加検索語">
              <Collapsible
                open={sectionsOpen.keywords}
                onOpenChange={(open) => setSectionsOpen({ ...sectionsOpen, keywords: open })}
              >
                <div className="simple-card">
                  <CollapsibleTrigger className="collapsible-header">
                    <span className="text-sm font-medium">追加検索語</span>
                    {sectionsOpen.keywords ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {currentPreset.keywordChips.map((kw: string) => (
                        <button
                          key={kw}
                          onClick={() => toggleKeywordChip(kw)}
                          className={`chip text-xs ${config.keywordChips.find(k => k.name === kw)?.enabled ? 'active' : ''}`}
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                    <Input
                      value={config.customKeywords}
                      onChange={(e) => setCustomKeywords(e.target.value)}
                      placeholder="カスタム検索語（カンマ区切り）"
                      className="text-sm"
                    />
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </ComingSoonOverlay>

            {/* 7. 優先ドメイン - グレーアウト対象 */}
            <ComingSoonOverlay featureName="優先ドメイン">
              <Collapsible
                open={sectionsOpen.domains}
                onOpenChange={(open) => setSectionsOpen({ ...sectionsOpen, domains: open })}
              >
                <div className="simple-card">
                  <CollapsibleTrigger className="collapsible-header">
                    <span className="text-sm font-medium">優先ドメイン</span>
                    {sectionsOpen.domains ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content">
                    <div className="flex flex-wrap gap-1.5">
                      {config.priorityDomains.map(domain => (
                        <span key={domain} className="chip active text-xs">
                          {domain}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ※ 設定画面で編集できます
                    </p>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </ComingSoonOverlay>

            {/* 8. オプション - グレーアウト対象 */}
            <ComingSoonOverlay featureName="オプション">
              <Collapsible
                open={sectionsOpen.options}
                onOpenChange={(open) => setSectionsOpen({ ...sectionsOpen, options: open })}
              >
                <div className="simple-card">
                  <CollapsibleTrigger className="collapsible-header">
                    <span className="text-sm font-medium">オプション</span>
                    {sectionsOpen.options ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="official" className="text-sm">公式ドメイン優先</Label>
                        <Switch
                          id="official"
                          checked={config.officialDomainPriority}
                          onCheckedChange={(checked) => updateField('officialDomainPriority', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="egov" className="text-sm">e-Gov法令参照</Label>
                        <Switch
                          id="egov"
                          checked={config.eGovCrossReference}
                          onCheckedChange={(checked) => updateField('eGovCrossReference', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="proof" className="text-sm">実証モード</Label>
                        <Switch
                          id="proof"
                          checked={config.proofMode}
                          onCheckedChange={(checked) => updateField('proofMode', checked)}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </ComingSoonOverlay>

            {/* 9. 実行ボタン（Phase 4） */}
            <div className="simple-card p-4 bg-gradient-to-br from-primary/10 to-primary/5 hidden lg:block">
              <ExecuteButtonBar onExecute={handleExecute} disabled={isExecuteDisabled} />
            </div>
          </div>

          {/* 右カラム: 出力 */}
          <div className="simple-card p-0 overflow-hidden" data-output-panel>
            <Tabs defaultValue="prompt" className="h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <TabsList className="h-8">
                  <TabsTrigger value="prompt" className="text-xs px-3">プロンプト</TabsTrigger>
                  <TabsTrigger
                    value="queries"
                    className="text-xs px-3"
                    disabled={isMinimalMode}
                    onClick={() => isMinimalMode && trackComingSoonClick('検索クエリタブ')}
                  >
                    検索クエリ
                    {isMinimalMode && <Lock className="w-2.5 h-2.5 ml-1 opacity-50" />}
                  </TabsTrigger>
                  <TabsTrigger
                    value="json"
                    className="text-xs px-3"
                    disabled={isMinimalMode}
                    onClick={() => isMinimalMode && trackComingSoonClick('JSONタブ')}
                  >
                    JSON
                    {isMinimalMode && <Lock className="w-2.5 h-2.5 ml-1 opacity-50" />}
                  </TabsTrigger>
                </TabsList>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
                    <Copy className="w-3 h-3 mr-1" />
                    コピー
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 text-xs">
                    <Download className="w-3 h-3 mr-1" />
                    DL
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className={`h-7 text-xs ${isMinimalMode ? 'opacity-50' : ''}`}
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    共有
                    {isMinimalMode && <Lock className="w-2.5 h-2.5 ml-1" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetConfig} className="h-7 text-xs text-destructive hover:text-destructive">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    リセット
                  </Button>
                </div>
              </div>

              <TabsContent value="prompt" className="flex-1 m-0 p-0">
                <div className="h-full min-h-[400px] lg:min-h-[600px] overflow-auto">
                  {!config.query ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      <span className="text-yellow-600 mr-2">⚠</span>
                      探索テーマを入力してください
                    </div>
                  ) : (
                    <pre className="p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {generatedPrompt}
                    </pre>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="queries" className="flex-1 m-0 p-0">
                <div className="h-full min-h-[400px] lg:min-h-[600px] overflow-auto p-4">
                  <h4 className="font-medium text-sm mb-3">検索クエリ一覧</h4>

                  {/* 検索クエリの使い方（折りたたみ） */}
                  <Collapsible className="mb-4">
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline mb-2">
                      <HelpCircle className="w-3 h-3" />
                      <span>検索クエリの使い方</span>
                      <ChevronDown className="w-3 h-3" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-2">
                        <p className="font-medium text-foreground">使い方</p>
                        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                          <li><strong>クエリをクリック</strong> → Google検索が開く</li>
                          <li><strong>コピーボタン</strong> → LLMに貼り付けて使う</li>
                        </ul>
                        <p className="font-medium text-foreground mt-2">活用シーン</p>
                        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                          <li>LLMが自動検索しない場合の手動検索</li>
                          <li>特定ドメイン（厚労省、経産省等）に絞った検索</li>
                          <li>プロンプト全体を使わず部分的に検索したい場合</li>
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-2">
                    {searchQueries.map((query, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm group">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 break-all text-primary hover:underline cursor-pointer flex items-start gap-1"
                        >
                          <code className="flex-1">{query}</code>
                          <ExternalLink className="w-3 h-3 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={async () => {
                                await navigator.clipboard.writeText(query);
                                toast.success('コピーしました');
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="text-xs">LLMに貼り付け用にコピー</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="json" className="flex-1 m-0 p-0">
                <div className="h-full min-h-[400px] lg:min-h-[600px] overflow-auto p-4">
                  <div className="flex gap-2 mb-3">
                    <Button variant="outline" size="sm" onClick={handleExportJSON} className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      エクスポート
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleImportJSON} className="text-xs">
                      インポート
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted/50 p-3 rounded overflow-auto">
                    {configToJSON(config)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur border-t border-border pb-safe',
          isMobile && isInputFocused && 'hidden'
        )}
      >
        <div className="container py-3">
          <ExecuteButtonBar onExecute={handleExecute} disabled={isExecuteDisabled} />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-4 mb-24 lg:mb-0">
        <div className="container">
          <p className="text-center text-xs text-muted-foreground mb-3">
            本アプリは情報整理支援ツールです。個別ケースは専門家にご相談ください。
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a
              href="https://script.google.com/macros/s/AKfycbwDP0d67qtifyms2h67LawjNWJi_Lh44faPC7Z4axfS_Gdmjzcd50rcl_kmTYBTysKirQ/exec"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              onClick={trackContactClick}
            >
              <MessageCircle className="w-3 h-3" />
              お問い合わせ
            </a>
            <span className="text-border">|</span>
            <a
              href="https://script.google.com/macros/s/AKfycbwDP0d67qtifyms2h67LawjNWJi_Lh44faPC7Z4axfS_Gdmjzcd50rcl_kmTYBTysKirQ/exec?type=outdated"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              onClick={trackOutdatedReportClick}
            >
              <Flag className="w-3 h-3" />
              情報が古い？報告する
            </a>
          </div>
        </div>
      </footer>

      {/* 初回実行時の解説モーダル（Phase 4） */}
      <Dialog open={showIntroModal} onOpenChange={setShowIntroModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              プロンプト生成完了！
            </DialogTitle>
            <DialogDescription>
              次のステップでLLMに貼り付けて実行してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* ステップ1: プロンプトをコピー */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">プロンプトをコピー</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  右側の「プロンプト」タブに生成されたプロンプトが表示されています。「コピー」ボタンをクリックしてください。
                </p>
                <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs">
                  <Copy className="w-3 h-3 mr-1" />
                  今すぐコピー
                </Button>
              </div>
            </div>

            {/* ステップ2: LLMに貼り付け */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">LLMに貼り付け</h3>
                <p className="text-xs text-muted-foreground">
                  Google Gemini、ChatGPT、Claude等のLLMチャット画面にプロンプトを貼り付けて実行してください。
                </p>
              </div>
            </div>

            {/* ステップ3: 結果を確認 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">結果を確認</h3>
                <p className="text-xs text-muted-foreground">
                  LLMが国内ガイドラインを検索し、整理した情報を出力します。
                </p>
              </div>
            </div>

            {/* 設定内容の概要 */}
            <div className="pt-4 border-t border-border">
              <h3 className="font-medium text-xs mb-2 text-muted-foreground">現在の設定</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-primary" />
                  <span><strong>プリセット:</strong> {currentPreset.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-primary" />
                  <span><strong>カテゴリ:</strong> {config.categories.filter(c => c.enabled).length}件</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-primary" />
                  <span><strong>検索語:</strong> {config.keywordChips.filter(k => k.enabled).length}件</span>
                </div>
              </div>
            </div>

            {/* 閉じるボタン */}
            <Button onClick={() => setShowIntroModal(false)} className="w-full">
              わかりました
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
