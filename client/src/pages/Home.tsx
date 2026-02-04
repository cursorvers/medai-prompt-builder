/**
 * Medical AI Prompt Builder - Home Page
 * X反応確認用ミニマル版対応
 */

import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
} from 'lucide-react';

import { TAB_PRESETS, type AppConfig } from '@/lib/presets';
import { generatePrompt, generateSearchQueries, configToJSON, parseConfigJSON, encodeConfigToURL } from '@/lib/template';
import { useConfig } from '@/hooks/useConfig';
import { useMinimalMode } from '@/contexts/MinimalModeContext';
import {
  trackPresetSelect,
  trackPromptCopy,
  trackPromptDownload,
  trackComingSoonClick,
  trackSettingsAttempt,
} from '@/lib/analytics';

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

  // プリセット選択（トラッキング付き）
  const handlePresetSelect = (presetId: string) => {
    const preset = allPresets.find(p => p.id === presetId);
    if (preset) {
      trackPresetSelect(presetId, preset.name);
      switchTab(presetId);
    }
  };

  // コピー（トラッキング付き）
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      trackPromptCopy(config.activeTab);
      toast.success('プロンプトをコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  // ダウンロード（トラッキング付き）
  const handleDownload = () => {
    const blob = new Blob([generatedPrompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${config.dateToday}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    trackPromptDownload(config.activeTab);
    toast.success('ダウンロードしました');
  };

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
  const handleShare = async () => {
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
  };

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
              <h1 className="text-base font-semibold leading-tight">医療AIガイドライン探索</h1>
              <p className="text-xs text-muted-foreground">プロンプトビルダー</p>
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

      <main className="container py-4">
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
              <li><span className="font-medium text-foreground">1.</span> 目的プリセットを選択（医療機器開発、臨床運用、研究倫理、生成AI）</li>
              <li><span className="font-medium text-foreground">2.</span> 探索テーマを入力（例：医療AIの臨床導入における安全管理）</li>
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
            {/* 目的プリセット - 常に有効 */}
            <div className="simple-card p-3">
              <Label className="text-sm font-medium mb-2 block">目的プリセット</Label>
              <div className="flex flex-wrap gap-1">
                {allPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      config.activeTab === preset.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 探索テーマ - 常に有効 */}
            <div className="simple-card p-3">
              <Label htmlFor="query" className="text-sm font-medium">
                探索テーマ（必須）
              </Label>
              <Input
                id="query"
                value={config.query}
                onChange={(e) => updateField('query', e.target.value)}
                placeholder="例: 医療AIの臨床導入における安全管理"
                className="mt-1"
              />
            </div>

            {/* 対象範囲 - グレーアウト対象 */}
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

            {/* 対象者 - グレーアウト対象 */}
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

            {/* オプション - グレーアウト対象 */}
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

            {/* カテゴリ - グレーアウト対象 */}
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

            {/* 追加検索語 - グレーアウト対象 */}
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

            {/* 優先ドメイン - グレーアウト対象 */}
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
          </div>

          {/* 右カラム: 出力 */}
          <div className="simple-card p-0 overflow-hidden">
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
                        <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                          <li>各クエリ右側のコピーボタンをクリック</li>
                          <li>Google検索またはLLMのブラウジング機能に貼り付け</li>
                          <li>検索結果から公式ガイドラインを確認</li>
                        </ol>
                        <p className="font-medium text-foreground mt-2">活用シーン</p>
                        <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                          <li>LLMが自動検索しない場合の手動検索ガイド</li>
                          <li>特定ドメイン（厚労省、経産省等）に絞った検索</li>
                          <li>プロンプト全体を使わず部分的に検索したい場合</li>
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-2">
                    {searchQueries.map((query, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <code className="flex-1 break-all">{query}</code>
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

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-4">
        <div className="container text-center text-xs text-muted-foreground">
          本アプリは情報整理支援ツールです。個別ケースは専門家にご相談ください。
        </div>
      </footer>
    </div>
  );
}
