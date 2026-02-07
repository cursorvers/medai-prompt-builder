/**
 * Medical AI Prompt Builder - Home Page
 * X反応確認用ミニマル版対応
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

type QueryTemplateId = 'free' | 'compliance_check' | 'responsibility_split';

function extractSubjectFromQuery(raw: string) {
  const q = raw.trim();
  if (!q) return '';

  const m1 = q.match(/^(.+?)について、ガイドラインや関連法規・法令に抵触する部分がないか精査せよ。?$/s);
  if (m1?.[1]) return m1[1].trim();

  const m2 = q.match(/^(.+?)について、医療機関とベンダーの責任分界点はどこに設定されているか明らかにせよ。?$/s);
  if (m2?.[1]) return m2[1].trim();

  return q;
}

function buildQueryFromTemplate(templateId: QueryTemplateId, subject: string) {
  const s = subject.trim() || '（対象を記入）';
  if (templateId === 'compliance_check') {
    return `${s}について、ガイドラインや関連法規・法令に抵触する部分がないか精査せよ。`;
  }
  if (templateId === 'responsibility_split') {
    return `${s}について、医療機関とベンダーの責任分界点はどこに設定されているか明らかにせよ。`;
  }
  return subject;
}

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
  disabledReason?: string;
  isLoading?: boolean;
};

function ExecuteButtonBar({ onExecute, disabled, disabledReason, isLoading }: ExecuteButtonBarProps) {
  return (
    <>
      <Button
        size="lg"
        className="w-full text-base font-semibold"
        onClick={onExecute}
        disabled={disabled || !!isLoading}
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {isLoading ? '読み込み中…' : 'プロンプトを生成'}
      </Button>

      {(disabled || !!disabledReason) && (
        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {disabledReason || '入力内容を確認してください'}
        </p>
      )}
    </>
  );
}

export default function Home() {
  const {
    config,
    validation,
    resetConfig,
    switchTab,
    updateField,
    toggleScope,
    toggleAudience,
    importConfig,
  } = useConfig();

  const { isMinimalMode } = useMinimalMode();
  const { addEntry: addAuditEntry, downloadJSON: downloadAuditLog, entryCount: auditEntryCount } = useAuditLog();
  const { showBanner: showReturnBanner, lastSearchQuery, dismissBanner, markSearchStarted } = useReturnBanner();

  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [vendorDocRelevantOnly, setVendorDocRelevantOnly] = useState(true);
  const [vendorDocLoading, setVendorDocLoading] = useState(false);
  const [vendorDocProgress, setVendorDocProgress] = useState<{ page: number; totalPagesToRead: number } | null>(null);
  const [vendorDocNotice, setVendorDocNotice] = useState<null | {
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    planB: string[];
  }>(null);
  const [isVendorDocDragActive, setIsVendorDocDragActive] = useState(false);
  const vendorDocDragCounterRef = useRef(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [queryTemplateId, setQueryTemplateId] = useState<QueryTemplateId>('free');
  const [generated, setGenerated] = useState<null | {
    configSnapshot: AppConfig;
    prompt: string;
    searchQueries: string[];
    generatedAt: string;
  }>(null);
  const [hasAttemptedGenerate, setHasAttemptedGenerate] = useState(false);
  const [vendorDocImport, setVendorDocImport] = useState<null | {
    kind: 'pdf' | 'txt';
    fileName: string;
    totalPages?: number;
    readPages?: number;
    partialByPages?: boolean;
    truncated?: boolean;
    relevantOnly?: boolean;
    snippetHitCount?: number;
    snippetTruncated?: boolean;
    capped?: boolean;
  }>(null);
  const [vendorDocCoverageAck, setVendorDocCoverageAck] = useState(false);
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
  const shouldShowValidation = hasAttemptedGenerate;
  const disabledReason = shouldShowValidation ? (validation.errors[0] || '') : '';
  const isExecuteDisabled = vendorDocLoading;

  const importVendorDocFromFile = useCallback(async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';
    const isText = lowerName.endsWith('.txt') || file.type.startsWith('text/');

    const planB = [
      'PDF内の文字を選択できる場合: そのままコピーして貼り付け',
      '画像PDFの場合: 端末のOCR（macOS プレビュー/写真のテキスト認識等）で抽出して貼り付け',
      'ベンダーに「テキスト版（.txt）」または該当条項のテキスト提供を依頼',
    ];

    if (!isPdf && !isText) {
      toast.error('対応していないファイル形式です', {
        description: `Plan B: ${planB.join(' / ')}`,
      });
      setVendorDocNotice({
        type: 'error',
        title: '対応していないファイル形式です',
        message: 'この欄は .pdf または .txt のみ対応しています。',
        planB,
      });
      return;
    }

    if (isText) {
      const text = await file.text();
      updateField('vendorDocText', text);
      setVendorDocImport({ kind: 'txt', fileName: file.name });
      setVendorDocCoverageAck(false);
      toast.success('添付資料を読み込みました', {
        description: `${file.name} を取り込みました`,
      });
      setVendorDocNotice({
        type: 'info',
        title: '添付資料を読み込みました',
        message: `${file.name} を取り込みました。`,
        planB: [],
      });
      return;
    }

    // PDF: extract text locally (no upload).
    setVendorDocLoading(true);
    setVendorDocProgress({ page: 0, totalPagesToRead: 0 });
    setVendorDocNotice(null);
    try {
      const extracted = await extractTextFromPdfFile(file, {
        maxPages: 40,
        maxChars: 200_000,
        onProgress: (p) => setVendorDocProgress(p),
      });

      const baseText = extracted.text.trim();
      if (!baseText || baseText.length < 200) {
        toast.warning('PDFから十分なテキストを抽出できませんでした', {
          description: `画像PDFの可能性があります。Plan B: ${planB.join(' / ')}`,
        });
        setVendorDocImport({
          kind: 'pdf',
          fileName: file.name,
          totalPages: extracted.totalPages,
          readPages: extracted.readPages,
          partialByPages: extracted.totalPages > extracted.readPages,
          truncated: extracted.truncated,
          relevantOnly: vendorDocRelevantOnly,
        });
        setVendorDocCoverageAck(false);
        setVendorDocNotice({
          type: 'warning',
          title: 'PDFから十分なテキストを抽出できませんでした',
          message: '画像スキャンPDFなど、PDF内に文字情報が含まれていない可能性があります。',
          planB,
        });
        return;
      }

      const snippet = vendorDocRelevantOnly
        ? extractAuditRelevantSnippets(baseText)
        : { text: baseText, hitCount: undefined as number | undefined, truncated: false };
      const finalText = snippet.text;

      // Keep it reasonably small to avoid localStorage quota issues.
      const wasCapped = finalText.length > 60_000;
      const cappedText = wasCapped ? `${finalText.slice(0, 60_000)}\n\n...(省略)...` : finalText;
      updateField('vendorDocText', cappedText);
      setVendorDocImport({
        kind: 'pdf',
        fileName: file.name,
        totalPages: extracted.totalPages,
        readPages: extracted.readPages,
        partialByPages: extracted.totalPages > extracted.readPages,
        truncated: extracted.truncated,
        relevantOnly: vendorDocRelevantOnly,
        snippetHitCount: snippet.hitCount,
        snippetTruncated: snippet.truncated,
        capped: wasCapped,
      });
      setVendorDocCoverageAck(false);

      toast.success('PDFからテキストを抽出しました', {
        description: `${Math.min(extracted.readPages, extracted.totalPages)}ページ分を解析しました${vendorDocRelevantOnly ? '（関連条項のみ抽出）' : ''}`,
      });
      setVendorDocNotice({
        type: 'info',
        title: 'PDFからテキストを抽出しました',
        message: `${Math.min(extracted.readPages, extracted.totalPages)}ページ分を解析しました${vendorDocRelevantOnly ? '（関連条項のみ抽出）' : ''}。`,
        planB: [],
      });
    } catch (err) {
      toast.error('PDFの読み込みに失敗しました', {
        description: `Plan B: ${planB.join(' / ')}`,
      });
      setVendorDocImport({
        kind: 'pdf',
        fileName: file.name,
        relevantOnly: vendorDocRelevantOnly,
      });
      setVendorDocCoverageAck(false);
      setVendorDocNotice({
        type: 'error',
        title: 'PDFの読み込みに失敗しました',
        message: err instanceof Error ? err.message : '不明なエラー',
        planB,
      });
    } finally {
      setVendorDocLoading(false);
      setVendorDocProgress(null);
    }
  }, [updateField, vendorDocRelevantOnly]);

  const handleVendorDocDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    vendorDocDragCounterRef.current += 1;
    setIsVendorDocDragActive(true);
  }, []);

  const handleVendorDocDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    vendorDocDragCounterRef.current = Math.max(0, vendorDocDragCounterRef.current - 1);
    if (vendorDocDragCounterRef.current === 0) {
      setIsVendorDocDragActive(false);
    }
  }, []);

  const handleVendorDocDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleVendorDocDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    vendorDocDragCounterRef.current = 0;
    setIsVendorDocDragActive(false);

    if (vendorDocLoading) return;
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      toast.info('複数ファイルが検出されました', {
        description: '最初の1ファイルのみ読み込みます',
      });
    }

    await importVendorDocFromFile(files[0]);
  }, [importVendorDocFromFile, vendorDocLoading]);

  // プライバシー警告の検出
  const privacyWarnings = useMemo(() => {
    return detectPrivacyIssues(config.query);
  }, [config.query]);

  const hasPrivacyWarning = privacyWarnings.length > 0;

  const hasVendorDocAIKeywords = useMemo(() => {
    const text = config.vendorDocText || '';
    if (!text.trim()) return false;
    return /(LLM|生成AI|機械学習|\\bAI\\b|AI\\s*モデル|大規模言語モデル)/i.test(text);
  }, [config.vendorDocText]);

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

  const isStandardDifficulty = config.difficultyLevel === 'standard';

  // 全プリセット（スタンダードは臨床運用寄りに固定して迷いを減らす）
  const allPresets = useMemo(() => {
    if (isStandardDifficulty) {
      return TAB_PRESETS.filter(p => p.id === 'clinical-operation');
    }
    return TAB_PRESETS;
  }, [isStandardDifficulty]);

  // 現在のプリセット
  const currentPreset = useMemo(() => {
    const fallback = TAB_PRESETS.find(p => p.id === 'clinical-operation') || TAB_PRESETS[0];
    return allPresets.find(p => p.id === config.activeTab) || fallback;
  }, [allPresets, config.activeTab]);

  const hasGenerated = !!generated;
  const hasUnappliedChanges = hasGenerated && generated?.configSnapshot !== config;

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
    if (!generated) {
      toast.error('先に「プロンプトを生成」を押してください');
      return;
    }
    try {
      await navigator.clipboard.writeText(generated.prompt);
      trackPromptCopy(generated.configSnapshot.activeTab);
      toast.success('プロンプトをコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  }, [generated]);

  // ダウンロード（トラッキング付き）
  const handleDownload = useCallback(() => {
    if (!generated) {
      toast.error('先に「プロンプトを生成」を押してください');
      return;
    }
    const blob = new Blob([generated.prompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${generated.configSnapshot.dateToday}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    trackPromptDownload(generated.configSnapshot.activeTab);
    toast.success('ダウンロードしました');
  }, [generated]);

  // 実行ボタン（Phase 4）
  const handleExecute = useCallback(() => {
    setHasAttemptedGenerate(true);

    if (vendorDocLoading) {
      toast.info('添付資料を読み込み中です', {
        description: '読み込みが終わってから生成してください',
      });
      return;
    }

    const vendorDocNeedsAck =
      !!config.vendorDocText.trim() &&
      vendorDocImport?.kind === 'pdf' &&
      ((vendorDocImport.partialByPages ?? false) ||
        (vendorDocImport.truncated ?? false) ||
        (vendorDocImport.snippetTruncated ?? false) ||
        (vendorDocImport.capped ?? false));

    if (vendorDocNeedsAck && !vendorDocCoverageAck) {
      toast.error('添付資料は一部のみ読み込まれている可能性があります', {
        description: '下の「部分読み込みでも生成する」にチェックするか、条項を追加してから生成してください',
      });
      return;
    }

    if (!validation.isValid) {
      toast.error(validation.errors[0] || '入力内容を確認してください');
      return;
    }

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
    const prompt = generatePrompt(config);
    const queries = generateSearchQueries(config);

    setGenerated({
      configSnapshot: config,
      prompt,
      searchQueries: queries,
      generatedAt: new Date().toISOString(),
    });

    addAuditEntry({
      preset: config.activeTab,
      presetName: currentPreset.name,
      theme: config.query,
      difficulty: config.difficultyLevel,
      searchQueries: queries,
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
  }, [config, hasExecutedBefore, hasPrivacyWarning, privacyWarnings, currentPreset, addAuditEntry, validation, vendorDocLoading]);

  const handleReset = useCallback(() => {
    setGenerated(null);
    resetConfig();
  }, [resetConfig]);

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

  const applyQueryTemplate = useCallback((templateId: QueryTemplateId) => {
    setQueryTemplateId(templateId);
    if (templateId === 'free') return;

    const subject = extractSubjectFromQuery(config.query);
    updateField('query', buildQueryFromTemplate(templateId, subject));
  }, [config.query, updateField]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center h-20 gap-3">
          <div className="flex items-center gap-5 shrink-0">
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
                  <p className="text-xs text-muted-foreground leading-tight">医療AI/医療情報 国内ガイドライン検索</p>
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

          {/* Value Proposition (Desktop) */}
          <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center px-3">
            <p className="text-sm text-muted-foreground text-center truncate">
              一次資料ベースで「抵触チェック」と「責任分界」を最短で整理
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              size="default"
              onClick={() => setShowUsageGuide(!showUsageGuide)}
              className={cn(
                "h-11 px-4 text-sm font-semibold shadow-sm",
                "hover:shadow-md transition-shadow",
                "ring-1 ring-primary/20",
              )}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              <span>使い方・できること</span>
              <span className="ml-2 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-bold tracking-wide">
                はじめに
              </span>
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
          <div className="mb-4 p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/25 rounded-xl relative shadow-sm">
            <button
              onClick={() => setShowUsageGuide(false)}
              className="absolute top-3 right-3 p-2 hover:bg-primary/10 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-foreground">使い方・できること</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  「抵触チェック」と「責任分界」を一次資料ベースで最短整理。契約書/仕様書の監査にも使えます。
                </p>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground space-y-4">
              <div>
                <p className="font-medium text-foreground">何に使える？</p>
                <ul className="mt-1 space-y-1.5">
                  <li><span className="font-medium text-foreground">・抵触チェック:</span> ガイドライン/通知/法令に抵触しうる論点を一次資料で洗い出す</li>
                  <li><span className="font-medium text-foreground">・責任分界:</span> 医療機関とベンダーの役割分担を契約/SLA/仕様書の条項から明確化</li>
                  <li><span className="font-medium text-foreground">・契約監査:</span> 保存/学習利用/再委託/監査権/越境移転/削除/ログ/事故対応の記載を確認</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-primary/20">
                <p className="font-medium text-foreground">使い方（最短）</p>
                <ol className="mt-1 space-y-1.5">
                  <li><span className="font-medium text-foreground">1.</span> 探索テーマを入力（上のテンプレ選択も便利）</li>
                  <li><span className="font-medium text-foreground">2.</span> 必要なら「添付資料」に契約書/仕様書の該当条項を貼る（PDF/.txtの読み込みも可）</li>
                  <li><span className="font-medium text-foreground">3.</span> 「コピー」して、お好みのLLM（Gemini/ChatGPT/Claude等）で実行</li>
                </ol>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-primary/20">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">対応LLM:</span> Google Gemini、ChatGPT、Claude、Perplexity、Microsoft Copilot など、Web検索機能を持つLLMで使用できます。
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">品質の目安:</span> モデル性能や検索機能の有無で、引用の正確さや見落としが変わります。可能なら高性能モデル（有料プラン）を推奨します。無料版でも利用できますが、一次資料のリンクと引用を必ず確認してください。
              </p>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* 右カラム(Desktop): 設定サイドバー */}
          <div className="space-y-2 order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7.5rem)] lg:overflow-auto lg:pr-1">
            {/* Status (keep it quiet, no progress meter) */}
            <div className="simple-card p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">ステータス</span>
                <span className="text-[10px] text-muted-foreground">
                  {isStandardDifficulty ? 'スタンダード' : 'プロフェッショナル'}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                <span className={cn('flex items-center gap-1', config.query.trim() ? 'text-green-700' : 'text-muted-foreground')}>
                  <Check className={cn('w-3 h-3', config.query.trim() ? 'opacity-100' : 'opacity-30')} />
                  テーマ
                </span>
                <span className={cn('flex items-center gap-1', config.activeTab ? 'text-green-700' : 'text-muted-foreground')}>
                  <Check className={cn('w-3 h-3', config.activeTab ? 'opacity-100' : 'opacity-30')} />
                  プリセット
                </span>
              </div>
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
                {isStandardDifficulty
                  ? 'スタンダードは「臨床運用寄り」に固定（迷いを減らすため）'
                  : 'プリセットを選択すると、カテゴリ例と追加検索語が自動的に設定されます'}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {allPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => !isStandardDifficulty && handlePresetSelect(preset.id)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-all',
                      config.activeTab === preset.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
                    , isStandardDifficulty && 'cursor-default opacity-90')}
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

            {/* Advanced Settings (collapsed by default) */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <div className="simple-card">
                <CollapsibleTrigger className="collapsible-header">
                  <span className="text-sm font-medium">詳細設定</span>
                  {advancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="collapsible-content">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">対象者</p>
                      {isStandardDifficulty ? (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="chip active text-xs">医療機関</span>
                          <span className="text-[11px] text-muted-foreground ml-1">（スタンダードは固定）</span>
                        </div>
                      ) : (
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
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">対象範囲</p>
                      {isStandardDifficulty ? (
                        <div className="flex flex-wrap gap-1.5">
                          {config.scope.map((s) => (
                            <span key={s} className="chip active text-xs">
                              {s}
                            </span>
                          ))}
                          <span className="text-[11px] text-muted-foreground ml-1">（推奨）</span>
                        </div>
                      ) : (
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
                      )}
                    </div>

                    <div className="rounded-lg border border-border/60 bg-muted/20 p-2 text-xs text-muted-foreground">
                      <p>
                        カテゴリ: {config.categories.filter(c => c.enabled).length}/{config.categories.length}
                      </p>
                      <p>
                        追加検索語: {config.keywordChips.filter(k => k.enabled).length}/{config.keywordChips.length}
                      </p>
                      <p>
                        優先ドメイン: {config.priorityDomains.length}件
                      </p>
                      <p className="mt-1">
                        細かい編集は設定画面で行えます。
                      </p>
                    </div>

                    <ComingSoonOverlay featureName="オプション">
                      <div className="rounded-lg border border-border/60 p-2">
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
                          <p className="text-[11px] text-muted-foreground">
                            目安: 法令の条文まで当たりたい時だけON（通常はOFFで十分）。
                          </p>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="proof" className="text-sm">実証モード</Label>
                            <Switch
                              id="proof"
                              checked={config.proofMode}
                              disabled={config.difficultyLevel === 'standard'}
                              onCheckedChange={(checked) => updateField('proofMode', checked)}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            ONにすると、最後に「実証結果（達成事項/制約事項）」を必ず出させて、未確認点を明確にします。
                          </p>
                        </div>
                      </div>
                    </ComingSoonOverlay>

                    <Link href="/settings" onClick={handleSettingsClick}>
                      <button
                        type="button"
                        className="w-full text-xs text-primary hover:underline text-left"
                      >
                        設定画面で詳細を編集する
                      </button>
                    </Link>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

          </div>

          {/* 右カラム: 出力 */}
          <div className="simple-card p-0 overflow-hidden order-1 lg:order-none lg:col-start-1 lg:row-start-1" data-output-panel>
            {/* Primary Inputs (Desktop-first): make the core workflow obvious */}
            <div className="p-3 lg:p-4 border-b border-border bg-muted/20">
              <div className="grid gap-3">
                {/* 探索テーマ */}
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="query" className="text-base font-semibold">
                      探索テーマ
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">
                          プロンプト生成の中心となる質問やテーマです。医療AIに限らず、電子カルテなど医療情報システムの契約監査にも使えます（契約書/仕様書の抜粋を添付すると精度が上がります）。
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      必須
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-muted-foreground shrink-0">テンプレ</span>
                    <Select
                      value={queryTemplateId}
                      onValueChange={(v) => applyQueryTemplate(v as QueryTemplateId)}
                    >
                      <SelectTrigger className="w-full justify-between" size="sm" aria-label="探索テーマテンプレート">
                        <SelectValue placeholder="テンプレートを選択" />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectItem value="compliance_check">1. 抵触チェック（ガイドライン/法令）</SelectItem>
                        <SelectItem value="responsibility_split">2. 責任分界の明確化（契約/SLA）</SelectItem>
                        <SelectItem value="free">3. その他（自由入力）</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="hidden sm:inline text-[11px] text-muted-foreground">
                      選択後も自由に編集できます
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-muted-foreground shrink-0">AI/LLM要素</span>
                    <Select
                      value={config.aiInScope || 'unknown'}
                      onValueChange={(v) => updateField('aiInScope', v as AppConfig['aiInScope'])}
                    >
                      <SelectTrigger className="w-full justify-between" size="sm" aria-label="AI/LLM要素の有無">
                        <SelectValue placeholder="不明" />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectItem value="unknown">不明（確認したい）</SelectItem>
                        <SelectItem value="no">なし（AIなしの電子カルテ契約など）</SelectItem>
                        <SelectItem value="yes">あり（AI/LLMが機能に含まれる）</SelectItem>
                      </SelectContent>
                    </Select>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">
                          混同防止用です。AI要素がない契約書を「医療AI契約」と誤認して出力しないよう、前提として使います。
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <Textarea
                    id="query"
                    value={config.query}
                    onChange={(e) => updateField('query', e.target.value)}
                    placeholder="例: 医療AIの臨床導入における安全管理"
                    className={cn(
                      'min-h-24 lg:min-h-40 text-base leading-relaxed',
                      shouldShowValidation && (!config.query.trim() || /（対象を記入）/.test(config.query)) && 'border-amber-300/50'
                    )}
                  />

                  {hasPrivacyWarning && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs flex items-start gap-2">
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

                {/* 添付資料（契約書/仕様書） */}
                <div
                  className={cn(
                    'rounded-lg border border-border bg-card p-3 transition-colors',
                    isVendorDocDragActive && 'ring-2 ring-primary/35 bg-primary/5'
                  )}
                  onDragEnter={handleVendorDocDragEnter}
                  onDragLeave={handleVendorDocDragLeave}
                  onDragOver={handleVendorDocDragOver}
                  onDrop={handleVendorDocDrop}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="vendorDoc" className="text-base font-semibold">
                      添付資料（契約書/仕様書の抜粋）
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">
                          ベンダー契約書や仕様書を取り込むと、ガイドライン要求との突合（監査観点）をプロンプトに含めます。PDFは端末内でテキスト抽出します（サーバ送信なし）。画像PDFは抽出できないことがあるため、その場合は条項をコピーするかOCR後のテキストを貼ってください。
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      任意
                    </span>
                  </div>

                  <Textarea
                    id="vendorDoc"
                    value={config.vendorDocText}
                    onChange={(e) => {
                      updateField('vendorDocText', e.target.value);
                      // If user edits manually, treat it as a conscious excerpt (coverage ack not needed).
                      setVendorDocImport(null);
                      setVendorDocCoverageAck(false);
                    }}
                    placeholder="例: 第X条（データの取扱い）... / 保存期間... / 学習利用の有無... / 再委託... / 監査権限..."
                    className="min-h-32 lg:min-h-56 text-base leading-relaxed"
                  />

                  {vendorDocImport?.kind === 'pdf' && (
                    <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 p-2 text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">読み込み状況</p>
                      <p>
                        ソース: PDF（{vendorDocImport.fileName}）
                        {typeof vendorDocImport.readPages === 'number' && typeof vendorDocImport.totalPages === 'number' && (
                          <span className="ml-1">
                            / {vendorDocImport.totalPages}ページ中 {vendorDocImport.readPages}ページを解析
                          </span>
                        )}
                      </p>
                      {vendorDocImport.partialByPages && (
                        <p className="text-amber-700">
                          注意: 全ページを読めていません（上限ページ数で途中までの可能性）。
                        </p>
                      )}
                      {(vendorDocImport.truncated || vendorDocImport.snippetTruncated || vendorDocImport.capped) && (
                        <p className="text-amber-700">
                          注意: 抽出テキストが途中で省略されている可能性があります（容量上限）。
                        </p>
                      )}
                      {vendorDocImport.relevantOnly && (
                        <p>
                          モード: 関連条項のみ抽出（抜粋）
                          {typeof vendorDocImport.snippetHitCount === 'number' && (
                            <span className="ml-1">/ ヒット: {vendorDocImport.snippetHitCount}箇所</span>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {(() => {
                    const vendorDocNeedsAck =
                      !!config.vendorDocText.trim() &&
                      vendorDocImport?.kind === 'pdf' &&
                      ((vendorDocImport.partialByPages ?? false) ||
                        (vendorDocImport.truncated ?? false) ||
                        (vendorDocImport.snippetTruncated ?? false) ||
                        (vendorDocImport.capped ?? false));
                    if (!vendorDocNeedsAck) return null;
                    return (
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        <Checkbox
                          checked={vendorDocCoverageAck}
                          onCheckedChange={(v) => setVendorDocCoverageAck(Boolean(v))}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="font-medium">部分読み込みの可能性を理解した上で生成する</p>
                          <p className="mt-0.5 opacity-90">
                            このまま生成すると、契約書の見落としが起こり得ます。重要条項はテキストで追記するか、必要ページの抜粋を貼り付けてください。
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {config.aiInScope === 'no' && hasVendorDocAIKeywords && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-amber-700 dark:text-amber-400">
                        <p className="font-medium mb-0.5">前提と資料の不一致の可能性</p>
                        <p className="text-amber-600 dark:text-amber-500">
                          「AI/LLM要素=なし」ですが、添付資料にAI関連語が含まれているようです。必要なら「AI/LLM要素」を見直してください。
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                      onClick={() => {
                        updateField('vendorDocText', '');
                        setVendorDocImport(null);
                        setVendorDocCoverageAck(false);
                      }}
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

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    PDF/.txtはドラッグ&ドロップにも対応しています（この枠内にドロップ）。
                  </p>

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

                  {vendorDocNotice && (
                    <div
                      className={cn(
                        'mt-2 rounded-lg border p-2 text-xs',
                        vendorDocNotice.type === 'info' && 'bg-slate-50 border-slate-200 text-slate-700',
                        vendorDocNotice.type === 'warning' && 'bg-amber-50 border-amber-200 text-amber-800',
                        vendorDocNotice.type === 'error' && 'bg-red-50 border-red-200 text-red-800',
                      )}
                    >
                      <p className="font-medium">{vendorDocNotice.title}</p>
                      <p className="mt-1 opacity-90">{vendorDocNotice.message}</p>
                      {vendorDocNotice.planB.length > 0 && (
                        <>
                          <p className="mt-2 font-medium">Plan B（代替手段）</p>
                          <ol className="mt-1 list-decimal list-inside space-y-0.5">
                            {vendorDocNotice.planB.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ol>
                        </>
                      )}
                    </div>
                  )}

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    監査観点の例: 保存/学習利用/再委託/監査権/越境移転/削除/ログ/事故対応
                  </p>
                </div>

                <div className="hidden lg:block">
                  <ExecuteButtonBar
                    onExecute={handleExecute}
                    disabled={isExecuteDisabled}
                    disabledReason={disabledReason}
                    isLoading={vendorDocLoading}
                  />
                </div>
              </div>
            </div>

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
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs" disabled={!hasGenerated}>
                    <Copy className="w-3 h-3 mr-1" />
                    コピー
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 text-xs" disabled={!hasGenerated}>
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
                  <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs text-destructive hover:text-destructive">
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
                      上の探索テーマを入力してください（右側で設定を調整できます）
                    </div>
                  ) : !generated ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-6 text-center">
                      <p className="font-medium text-foreground mb-1">まだプロンプトは生成されていません</p>
                      <p className="max-w-md">
                        上の入力と右側の設定を整えたら、<span className="font-medium text-foreground">「プロンプトを生成」</span>を押してください。
                        生成後は、設定を変えても自動更新されません（再生成すると反映されます）。
                      </p>
                    </div>
                  ) : (
                    <div className="p-4">
                      {(hasUnappliedChanges) && (
                        <div className="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">設定が変更されています</p>
                            <p className="opacity-90">現在の表示は「最後に生成した内容」です。反映するにはもう一度「プロンプトを生成」を押してください。</p>
                          </div>
                        </div>
                      )}
                      <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                        {generated.prompt}
                      </pre>
                    </div>
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
                    {!generated ? (
                      <div className="text-sm text-muted-foreground">
                        先に「プロンプトを生成」を押してください（生成時点のクエリを固定表示します）。
                      </div>
                    ) : generated.searchQueries.map((query, i) => (
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
          <ExecuteButtonBar
            onExecute={handleExecute}
            disabled={isExecuteDisabled}
            disabledReason={disabledReason}
            isLoading={vendorDocLoading}
          />
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
