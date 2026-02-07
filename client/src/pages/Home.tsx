/**
 * Medical AI Prompt Builder - Home Page
 * X反応確認用ミニマル版対応
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Code,
  Terminal,
  ShieldAlert,
  FileJson,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { TAB_PRESETS, DIFFICULTY_PRESETS, type AppConfig, type DifficultyLevel } from '@/lib/presets';
import { generatePrompt, generateSearchQueries, configToJSON, parseConfigJSON, encodeConfigToURL } from '@/lib/template';
import { extractAuditRelevantSnippets, extractTextFromPdfFile } from '@/lib/pdf';
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
import { detectPrivacyIssues, getPrivacyWarningMessage } from '@/lib/privacy';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useReturnBanner } from '@/hooks/useReturnBanner';

const MOBILE_MEDIA_QUERY = '(max-width: 1023px)';
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'number', 'tel', 'url', 'password']);

/**
 * Full Version オーバーレイコンポーネント
 * プレビュー版では機能をマスクし、通常版で利用可能であることを示す
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
    toast.info(`「${featureName}」は通常版でご利用いただけます`, {
      description: 'プレビュー版では基本機能のみお試しいただけます',
    });
  };

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <button
        onClick={handleClick}
        className="absolute inset-0 flex flex-col items-center justify-center bg-muted/40 backdrop-blur-[0.5px] rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-background/90 px-2 py-1 rounded-full shadow-sm border border-border/50">
          <Lock className="w-2.5 h-2.5" />
          Unlock with Pro
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
  const { addEntry: addAuditEntry, downloadJSON: downloadAuditLog, entryCount: auditEntryCount } = useAuditLog();
  const { showBanner: showReturnBanner, lastSearchQuery, dismissBanner, markSearchStarted } = useReturnBanner();

  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [vendorDocRelevantOnly, setVendorDocRelevantOnly] = useState(true);
  const [vendorDocLoading, setVendorDocLoading] = useState(false);
  const [vendorDocProgress, setVendorDocProgress] = useState<{ page: number; totalPagesToRead: number } | null>(null);
  const [sectionsOpen, setSectionsOpen] = useState({
    scope: true,
    audience: true,
    options: false,
    categories: false,
    keywords: false,
    domains: false,
    api: false,
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

  const importVendorDocFromFile = useCallback(async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';
    const isText = lowerName.endsWith('.txt') || file.type.startsWith('text/');

    if (!isPdf && !isText) {
      toast.error('対応していないファイル形式です', {
        description: '.pdf または .txt を選択してください',
      });
      return;
    }

    if (isText) {
      const text = await file.text();
      updateField('vendorDocText', text);
      toast.success('添付資料を読み込みました', {
        description: `${file.name} を取り込みました`,
      });
      return;
    }

    // PDF: extract text locally (no upload).
    setVendorDocLoading(true);
    setVendorDocProgress({ page: 0, totalPagesToRead: 0 });
    try {
      const extracted = await extractTextFromPdfFile(file, {
        maxPages: 40,
        maxChars: 200_000,
        onProgress: (p) => setVendorDocProgress(p),
      });

      const baseText = extracted.text.trim();
      if (!baseText || baseText.length < 200) {
        toast.warning('PDFから十分なテキストを抽出できませんでした', {
          description: '画像PDFの可能性があります。契約書からコピーするか、OCR後のテキストを貼り付けてください。',
        });
        return;
      }

      const finalText = vendorDocRelevantOnly
        ? extractAuditRelevantSnippets(baseText).text
        : baseText;

      // Keep it reasonably small to avoid localStorage quota issues.
      const capped = finalText.length > 60_000 ? `${finalText.slice(0, 60_000)}\n\n...(省略)...` : finalText;
      updateField('vendorDocText', capped);

      toast.success('PDFからテキストを抽出しました', {
        description: `${Math.min(extracted.readPages, extracted.totalPages)}ページ分を解析しました${vendorDocRelevantOnly ? '（関連条項のみ抽出）' : ''}`,
      });
    } catch (err) {
      toast.error('PDFの読み込みに失敗しました', {
        description: err instanceof Error ? err.message : '不明なエラー',
      });
    } finally {
      setVendorDocLoading(false);
      setVendorDocProgress(null);
    }
  }, [updateField, vendorDocRelevantOnly]);

  // プライバシー警告の検出
  const privacyWarnings = useMemo(() => {
    return detectPrivacyIssues(config.query);
  }, [config.query]);

  const hasPrivacyWarning = privacyWarnings.length > 0;

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

    // プライバシー警告がある場合は確認
    if (hasPrivacyWarning) {
      const warningMsg = getPrivacyWarningMessage(privacyWarnings);
      toast.warning(warningMsg, {
        duration: 5000,
        description: '検索クエリに機微情報が含まれないか確認してください',
      });
    }

    // 監査ログに記録
    addAuditEntry({
      preset: config.activeTab,
      presetName: currentPreset.name,
      theme: config.query,
      difficulty: config.difficultyLevel,
      searchQueries,
    });

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
  }, [config.query, config.activeTab, config.customKeywords, config.difficultyLevel, hasExecutedBefore, hasPrivacyWarning, privacyWarnings, currentPreset, searchQueries, addAuditEntry]);

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
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-5">
            {/* Product Name - Primary */}
            <Link href="/">
              <a
                className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:opacity-90 transition-opacity"
                aria-label="トップページへ戻る"
                onClick={() => {
                  // If already on the top page, still make it feel responsive.
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <Sparkles className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">GuideScope</h1>
                  <p className="text-xs text-muted-foreground leading-tight">生成AI 国内ガイドライン検索</p>
                </div>
              </a>
            </Link>

            {/* Cursorvers Branding - Secondary */}
            <a
              href="https://cursorvers.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 pl-5 border-l border-border/50 hover:opacity-80 transition-opacity"
            >
              <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="50" cy="50" rx="40" ry="20" stroke="currentColor" strokeWidth="4" fill="none" transform="rotate(-30 50 50)" className="text-primary"/>
                <path d="M45 30 L45 70 L55 60 L65 65 L45 30" fill="currentColor" className="text-primary"/>
                <circle cx="38" cy="32" r="4" fill="currentColor" className="text-primary"/>
              </svg>
              <span className="text-xs text-muted-foreground font-medium">Cursorvers Inc.</span>
            </a>
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

            {/* 監査ログダウンロード */}
            {auditEntryCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={downloadAuditLog}
                    className="relative"
                  >
                    <FileJson className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                      {auditEntryCount > 99 ? '99+' : auditEntryCount}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>監査ログをダウンロード（{auditEntryCount}件）</p>
                </TooltipContent>
              </Tooltip>
            )}

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
        {/* リターンバナー（検索から戻ってきた時） */}
        {showReturnBanner && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 dark:text-green-500" />
              <span className="text-green-700 dark:text-green-400">
                検索から戻りました。
                {lastSearchQuery && (
                  <span className="text-green-600 dark:text-green-500 ml-1">
                    「{lastSearchQuery.slice(0, 30)}{lastSearchQuery.length > 30 ? '...' : ''}」
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={dismissBanner}
              className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
            >
              <X className="w-4 h-4 text-green-600 dark:text-green-500" />
            </button>
          </div>
        )}

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
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* 左カラム: 設定 */}
          <div className="space-y-2">
            {/* Phase 6: 設定完了度インジケーター */}
            <div className="simple-card p-2 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">設定完了度</span>
                <span className="text-xs font-bold text-primary">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-1.5 mb-1" />
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {config.query && (
                  <span className="flex items-center gap-0.5 text-green-600">
                    <Check className="w-2.5 h-2.5" />
                    テーマ入力済み
                  </span>
                )}
                {config.activeTab && (
                  <span className="flex items-center gap-0.5 text-green-600">
                    <Check className="w-2.5 h-2.5" />
                    プリセット選択済み
                  </span>
                )}
              </div>
            </div>

            {/* 1. 探索テーマ - 常に有効 */}
            <div className="simple-card p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="query" className="text-sm font-medium">
                  探索テーマ
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      プロンプト生成の中心となる質問やテーマです。具体的な状況や目的を入力すると、より的確な検索結果が得られます。
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  必須
                </span>
              </div>
              <Textarea
                id="query"
                value={config.query}
                onChange={(e) => updateField('query', e.target.value)}
                placeholder="例: 医療AIの臨床導入における安全管理"
                className={cn(
                  "min-h-12 text-sm leading-relaxed",
                  !config.query && "border-amber-300/50"
                )}
              />

              {/* プライバシー警告 */}
              {hasPrivacyWarning && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-amber-700 dark:text-amber-400">
                    <p className="font-medium mb-0.5">機微情報の可能性を検出</p>
                    <p className="text-amber-600 dark:text-amber-500">
                      {getPrivacyWarningMessage(privacyWarnings)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 1.2 添付資料（契約書/仕様書の抜粋など） */}
            <div className="simple-card p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="vendorDoc" className="text-sm font-medium">
                  添付資料（契約書/仕様書の抜粋）
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      ベンダー契約書や仕様書を取り込むと、ガイドライン要求との突合（監査観点）をプロンプトに含めます。PDFは端末内でテキスト抽出します（サーバ送信なし）。画像PDFは抽出できないことがあるため、その場合は条項をコピーするかOCR後のテキストを貼ってください。
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  任意
                </span>
              </div>

              <Textarea
                id="vendorDoc"
                value={config.vendorDocText}
                onChange={(e) => updateField('vendorDocText', e.target.value)}
                placeholder="例: 第X条（データの取扱い）... / 保存期間... / 学習利用の有無... / 再委託... / 監査権限..."
                className="min-h-24 text-sm leading-relaxed"
              />

              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  onClick={() => updateField('vendorDocText', '')}
                >
                  クリア
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={vendorDocRelevantOnly}
                      onCheckedChange={setVendorDocRelevantOnly}
                      aria-label="関連条項のみ抽出"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      関連条項だけ抽出（推奨）
                    </span>
                  </div>

                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,application/pdf,.txt,text/plain';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        await importVendorDocFromFile(file);
                      };
                      input.click();
                    }}
                    disabled={vendorDocLoading}
                  >
                    PDF/.txtを読み込む
                  </button>
                </div>
              </div>

              {vendorDocLoading && vendorDocProgress && (
                <div className="mt-2">
                  <Progress
                    value={
                      vendorDocProgress.totalPagesToRead > 0
                        ? Math.round((vendorDocProgress.page / vendorDocProgress.totalPagesToRead) * 100)
                        : 0
                    }
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    PDFを解析中: {vendorDocProgress.page}/{vendorDocProgress.totalPagesToRead || '?'}ページ
                  </p>
                </div>
              )}

              <p className="mt-2 text-[11px] text-muted-foreground">
                監査観点の例: 保存/学習利用/再委託/監査権/越境移転/削除/ログ/事故対応
              </p>
            </div>

            {/* 1.5. 難易度選択（Phase 5） */}
            <div className="simple-card p-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Label className="text-xs font-medium">難易度</Label>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  基本設定
                </span>
              </div>

              {/* 使い分けガイド（折りたたみ） */}
              <Collapsible className="mb-2">
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
                      'p-2 rounded-lg border-2 transition-all text-left',
                      config.difficultyLevel === preset.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {preset.icon === 'star' ? <Star className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                      <span className="font-semibold text-xs">{preset.name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {preset.description}
                    </p>
                    <ul className="text-[10px] text-muted-foreground space-y-0.5 mt-1.5 pt-1.5 border-t border-border">
                      {preset.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Check className={cn("w-2.5 h-2.5 mt-0.5 shrink-0", config.difficultyLevel === preset.id ? "text-primary" : "text-muted-foreground/50")} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 目的プリセット - 常に有効 */}
            <div className="simple-card p-2 border-2 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Settings className="w-3.5 h-3.5 text-primary" />
                <Label className="text-xs font-semibold">目的プリセット</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      探索の目的に応じて、カテゴリと検索語を自動設定します。
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  他の設定に影響
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground mb-2">
                プリセットを選択すると、カテゴリ例と追加検索語が自動的に設定されます
              </p>

              <div className="flex flex-wrap gap-1.5">
                {allPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-all',
                      config.activeTab === preset.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {config.activeTab && (
                <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-2.5 h-2.5 text-primary" />
                    <span>カテゴリ: {currentPreset.categories.length}件が設定されます</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-2.5 h-2.5 text-primary" />
                    <span>検索語: {currentPreset.keywordChips.length}件が設定されます</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. 対象者 */}
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

            {/* 4. 対象範囲 */}
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

            {/* 5. カテゴリ */}
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

            {/* 7. 優先ドメイン */}
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
                          disabled={config.difficultyLevel === 'standard'}
                          onCheckedChange={(checked) => updateField('officialDomainPriority', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="egov" className="text-sm">e-Gov法令参照</Label>
                        <Switch
                          id="egov"
                          checked={config.eGovCrossReference}
                          disabled={config.difficultyLevel === 'standard'}
                          onCheckedChange={(checked) => updateField('eGovCrossReference', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="proof" className="text-sm">実証モード</Label>
                        <Switch
                          id="proof"
                          checked={config.proofMode}
                          disabled={config.difficultyLevel === 'standard'}
                          onCheckedChange={(checked) => updateField('proofMode', checked)}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </ComingSoonOverlay>

            {/* 9. API / プログラムから使う - グレーアウト対象 */}
            <ComingSoonOverlay featureName="API / プログラムから使う">
              <Collapsible
                open={sectionsOpen.api}
                onOpenChange={(open) => setSectionsOpen({ ...sectionsOpen, api: open })}
              >
                <div className="simple-card">
                <CollapsibleTrigger className="collapsible-header">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">API / プログラムから使う</span>
                  </div>
                  {sectionsOpen.api ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="collapsible-content">
                  <div className="space-y-4 text-xs">
                    {/* GitHub からインストール */}
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-1 mb-2">
                        <Terminal className="w-3 h-3" />
                        npm パッケージ（GitHub）
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg font-mono space-y-2">
                        <p className="text-muted-foreground"># インストール</p>
                        <code className="block text-xs break-all">npm install github:cursorvers/guidescope#main</code>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg font-mono mt-2">
                        <p className="text-muted-foreground mb-1"># 使用例</p>
                        <pre className="text-xs whitespace-pre-wrap">{`// ESM
import { generate } from 'guidescope/packages/core';

// CommonJS
const { generate } = require('guidescope/packages/core');

const result = generate({
  query: '医療AIの臨床導入',
  preset: 'medical-device',
  difficulty: 'professional',
});

console.log(result.prompt);`}</pre>
                      </div>
                    </div>

                    {/* MCP サーバー */}
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-1 mb-2">
                        <Sparkles className="w-3 h-3" />
                        MCP サーバー（Claude Desktop / Cursor）
                      </h4>
                      <p className="text-muted-foreground mb-2">
                        設定ファイルに追加:
                      </p>
                      <div className="bg-muted/50 p-3 rounded-lg font-mono">
                        <pre className="text-xs whitespace-pre-wrap">{`{
  "mcpServers": {
    "guidescope": {
      "command": "npx",
      "args": ["@cursorversinc/guidescope-mcp"]
    }
  }
}`}</pre>
                      </div>
                      <p className="text-muted-foreground mt-2">
                        利用可能なツール: <code className="bg-muted px-1 rounded">generate</code>, <code className="bg-muted px-1 rounded">generatePrompt</code>, <code className="bg-muted px-1 rounded">generateSearchQueries</code>, <code className="bg-muted px-1 rounded">listPresets</code>
                      </p>
                    </div>

                    {/* GitHub リンク */}
                    <div className="pt-2 border-t border-border">
                      <a
                        href="https://github.com/cursorvers/guidescope"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        GitHub で詳細を見る
                      </a>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </ComingSoonOverlay>

            {/* 10. 実行ボタン（Phase 4） */}
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
                          onClick={() => markSearchStarted(query)}
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
