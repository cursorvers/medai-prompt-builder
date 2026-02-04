/**
 * Medical AI Prompt Builder - Settings Page
 * Design: Medical Precision 2.0
 * 
 * Features:
 * - Preset management (view, edit, create, delete)
 * - Priority domain management
 * - Template customization
 * - Data export/import
 * - Reset to defaults
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Layers,
  Globe,
  FileText,
  Database,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronRight,
  Download,
  Upload,
  AlertTriangle,
  Check,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  TAB_PRESETS,
  DEFAULT_PRIORITY_DOMAINS,
  DEFAULT_SCOPE_OPTIONS,
  DEFAULT_AUDIENCE_OPTIONS,
  DISCLAIMER_LINES,
  TEMPLATE_BASE_DATE,
  type TabPreset,
} from '@/lib/presets';

// Storage keys for custom settings
const CUSTOM_PRESETS_KEY = 'medai_custom_presets_v1';
const CUSTOM_DOMAINS_KEY = 'medai_custom_domains_v1';
const CUSTOM_SCOPES_KEY = 'medai_custom_scopes_v1';
const CUSTOM_AUDIENCES_KEY = 'medai_custom_audiences_v1';
const CUSTOM_DISCLAIMERS_KEY = 'medai_custom_disclaimers_v1';

// Load custom data from localStorage
function loadCustomData<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
  }
  return defaultValue;
}

// Save custom data to localStorage
function saveCustomData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('presets');
  
  // Custom data states
  const [customPresets, setCustomPresets] = useState<TabPreset[]>(() => 
    loadCustomData(CUSTOM_PRESETS_KEY, [])
  );
  const [customDomains, setCustomDomains] = useState<string[]>(() => 
    loadCustomData(CUSTOM_DOMAINS_KEY, [])
  );
  const [customScopes, setCustomScopes] = useState<string[]>(() => 
    loadCustomData(CUSTOM_SCOPES_KEY, [])
  );
  const [customAudiences, setCustomAudiences] = useState<string[]>(() => 
    loadCustomData(CUSTOM_AUDIENCES_KEY, [])
  );
  const [customDisclaimers, setCustomDisclaimers] = useState<string[]>(() => 
    loadCustomData(CUSTOM_DISCLAIMERS_KEY, DISCLAIMER_LINES)
  );
  
  // Dialog states
  const [editingPreset, setEditingPreset] = useState<TabPreset | null>(null);
  const [isNewPreset, setIsNewPreset] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  
  // Form states for preset editing
  const [presetForm, setPresetForm] = useState({
    id: '',
    name: '',
    categories: '',
    keywordChips: '',
  });
  
  // New item input states
  const [newDomain, setNewDomain] = useState('');
  const [newScope, setNewScope] = useState('');
  const [newAudience, setNewAudience] = useState('');
  
  // Save custom data when changed
  useEffect(() => {
    saveCustomData(CUSTOM_PRESETS_KEY, customPresets);
  }, [customPresets]);
  
  useEffect(() => {
    saveCustomData(CUSTOM_DOMAINS_KEY, customDomains);
  }, [customDomains]);
  
  useEffect(() => {
    saveCustomData(CUSTOM_SCOPES_KEY, customScopes);
  }, [customScopes]);
  
  useEffect(() => {
    saveCustomData(CUSTOM_AUDIENCES_KEY, customAudiences);
  }, [customAudiences]);
  
  useEffect(() => {
    saveCustomData(CUSTOM_DISCLAIMERS_KEY, customDisclaimers);
  }, [customDisclaimers]);
  
  // All presets (built-in + custom)
  const allPresets = [...TAB_PRESETS, ...customPresets];
  
  // All domains (default + custom)
  const allDomains = [...DEFAULT_PRIORITY_DOMAINS, ...customDomains];
  
  // All scopes (default + custom)
  const allScopes = [...DEFAULT_SCOPE_OPTIONS, ...customScopes];
  
  // All audiences (default + custom)
  const allAudiences = [...DEFAULT_AUDIENCE_OPTIONS, ...customAudiences];
  
  // Preset editing handlers
  const handleEditPreset = (preset: TabPreset) => {
    setEditingPreset(preset);
    setIsNewPreset(false);
    setPresetForm({
      id: preset.id,
      name: preset.name,
      categories: preset.categories.join('\n'),
      keywordChips: preset.keywordChips.join('\n'),
    });
  };
  
  const handleNewPreset = () => {
    setEditingPreset({
      id: `custom-${Date.now()}`,
      name: '',
      categories: [],
      keywordChips: [],
    });
    setIsNewPreset(true);
    setPresetForm({
      id: `custom-${Date.now()}`,
      name: '',
      categories: '',
      keywordChips: '',
    });
  };
  
  const handleSavePreset = () => {
    if (!presetForm.name.trim()) {
      toast.error('プリセット名を入力してください');
      return;
    }
    
    const newPreset: TabPreset = {
      id: presetForm.id,
      name: presetForm.name.trim(),
      categories: presetForm.categories.split('\n').map(s => s.trim()).filter(Boolean),
      keywordChips: presetForm.keywordChips.split('\n').map(s => s.trim()).filter(Boolean),
    };
    
    if (isNewPreset) {
      setCustomPresets(prev => [...prev, newPreset]);
      toast.success('プリセットを追加しました');
    } else {
      // Check if it's a custom preset
      const isCustom = customPresets.some(p => p.id === presetForm.id);
      if (isCustom) {
        setCustomPresets(prev => prev.map(p => p.id === presetForm.id ? newPreset : p));
        toast.success('プリセットを更新しました');
      } else {
        // Create a custom copy of built-in preset
        const customCopy = { ...newPreset, id: `custom-${Date.now()}` };
        setCustomPresets(prev => [...prev, customCopy]);
        toast.success('カスタムプリセットとして保存しました');
      }
    }
    
    setEditingPreset(null);
  };
  
  const handleDeletePreset = (presetId: string) => {
    setPresetToDelete(presetId);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDeletePreset = () => {
    if (presetToDelete) {
      setCustomPresets(prev => prev.filter(p => p.id !== presetToDelete));
      toast.success('プリセットを削除しました');
    }
    setDeleteConfirmOpen(false);
    setPresetToDelete(null);
  };
  
  // Domain handlers
  const handleAddDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    if (allDomains.includes(domain)) {
      toast.error('このドメインは既に登録されています');
      return;
    }
    setCustomDomains(prev => [...prev, domain]);
    setNewDomain('');
    toast.success('ドメインを追加しました');
  };
  
  const handleRemoveDomain = (domain: string) => {
    if (DEFAULT_PRIORITY_DOMAINS.includes(domain)) {
      toast.error('デフォルトドメインは削除できません');
      return;
    }
    setCustomDomains(prev => prev.filter(d => d !== domain));
    toast.success('ドメインを削除しました');
  };
  
  // Scope handlers
  const handleAddScope = () => {
    const scope = newScope.trim();
    if (!scope) return;
    if (allScopes.includes(scope)) {
      toast.error('この範囲は既に登録されています');
      return;
    }
    setCustomScopes(prev => [...prev, scope]);
    setNewScope('');
    toast.success('対象範囲を追加しました');
  };
  
  const handleRemoveScope = (scope: string) => {
    if (DEFAULT_SCOPE_OPTIONS.includes(scope)) {
      toast.error('デフォルト範囲は削除できません');
      return;
    }
    setCustomScopes(prev => prev.filter(s => s !== scope));
    toast.success('対象範囲を削除しました');
  };
  
  // Audience handlers
  const handleAddAudience = () => {
    const audience = newAudience.trim();
    if (!audience) return;
    if (allAudiences.includes(audience)) {
      toast.error('この対象者は既に登録されています');
      return;
    }
    setCustomAudiences(prev => [...prev, audience]);
    setNewAudience('');
    toast.success('対象者を追加しました');
  };
  
  const handleRemoveAudience = (audience: string) => {
    if (DEFAULT_AUDIENCE_OPTIONS.includes(audience)) {
      toast.error('デフォルト対象者は削除できません');
      return;
    }
    setCustomAudiences(prev => prev.filter(a => a !== audience));
    toast.success('対象者を削除しました');
  };
  
  // Export all settings
  const handleExportSettings = () => {
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      customPresets,
      customDomains,
      customScopes,
      customAudiences,
      customDisclaimers,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medai-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('設定をエクスポートしました');
  };
  
  // Import settings
  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.version !== 1) {
          toast.error('サポートされていない設定ファイル形式です');
          return;
        }
        
        if (data.customPresets) setCustomPresets(data.customPresets);
        if (data.customDomains) setCustomDomains(data.customDomains);
        if (data.customScopes) setCustomScopes(data.customScopes);
        if (data.customAudiences) setCustomAudiences(data.customAudiences);
        if (data.customDisclaimers) setCustomDisclaimers(data.customDisclaimers);
        
        toast.success('設定をインポートしました');
      } catch {
        toast.error('設定ファイルの読み込みに失敗しました');
      }
    };
    input.click();
  };
  
  // Reset all settings
  const handleResetAll = () => {
    setCustomPresets([]);
    setCustomDomains([]);
    setCustomScopes([]);
    setCustomAudiences([]);
    setCustomDisclaimers(DISCLAIMER_LINES);
    setResetConfirmOpen(false);
    toast.success('すべての設定をリセットしました');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center gap-4 h-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">設定</h1>
              <p className="text-xs text-muted-foreground">プリセット・ドメイン・テンプレートの管理</p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full mb-6">
            <TabsTrigger value="presets" className="gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">プリセット</span>
            </TabsTrigger>
            <TabsTrigger value="domains" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">ドメイン</span>
            </TabsTrigger>
            <TabsTrigger value="options" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">オプション</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">データ管理</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">目的プリセット</h2>
                <p className="text-sm text-muted-foreground">
                  探索目的に応じたカテゴリと検索語のプリセットを管理します
                </p>
              </div>
              <Button onClick={handleNewPreset} className="gap-2">
                <Plus className="w-4 h-4" />
                新規作成
              </Button>
            </div>
            
            <div className="grid gap-4">
              {/* Built-in Presets */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">デフォルトプリセット</h3>
                {TAB_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{preset.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {preset.categories.length}カテゴリ / {preset.keywordChips.length}検索語
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPreset(preset)}
                      className="gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      複製して編集
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Custom Presets */}
              {customPresets.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">カスタムプリセット</h3>
                  {customPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{preset.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {preset.categories.length}カテゴリ / {preset.keywordChips.length}検索語
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPreset(preset)}
                          className="gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePreset(preset.id)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Domains Tab */}
          <TabsContent value="domains" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">優先ドメイン</h2>
              <p className="text-sm text-muted-foreground">
                検索時に優先するドメインを管理します
              </p>
            </div>
            
            {/* Add new domain */}
            <div className="flex gap-2">
              <Input
                placeholder="例: example.go.jp"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                className="flex-1"
              />
              <Button onClick={handleAddDomain} className="gap-2">
                <Plus className="w-4 h-4" />
                追加
              </Button>
            </div>
            
            {/* Domain list */}
            <div className="grid gap-2">
              {allDomains.map((domain) => {
                const isDefault = DEFAULT_PRIORITY_DOMAINS.includes(domain);
                return (
                  <div
                    key={domain}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      isDefault ? 'bg-muted/30 border-border' : 'bg-primary/5 border-primary/30'
                    )}
                  >
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 font-mono text-sm">{domain}</span>
                    {isDefault ? (
                      <span className="text-xs text-muted-foreground">デフォルト</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDomain(domain)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          {/* Options Tab */}
          <TabsContent value="options" className="space-y-8">
            {/* Scope Options */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">対象範囲オプション</h2>
                <p className="text-sm text-muted-foreground">
                  探索条件で選択できる対象範囲を管理します
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="例: 遠隔医療"
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddScope()}
                  className="flex-1"
                />
                <Button onClick={handleAddScope} className="gap-2">
                  <Plus className="w-4 h-4" />
                  追加
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {allScopes.map((scope) => {
                  const isDefault = DEFAULT_SCOPE_OPTIONS.includes(scope);
                  return (
                    <div
                      key={scope}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                        isDefault ? 'bg-muted' : 'bg-primary/10 text-primary'
                      )}
                    >
                      <span>{scope}</span>
                      {!isDefault && (
                        <button
                          onClick={() => handleRemoveScope(scope)}
                          className="hover:text-destructive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Audience Options */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">対象者オプション</h2>
                <p className="text-sm text-muted-foreground">
                  探索条件で選択できる対象者を管理します
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="例: 患者"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAudience()}
                  className="flex-1"
                />
                <Button onClick={handleAddAudience} className="gap-2">
                  <Plus className="w-4 h-4" />
                  追加
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {allAudiences.map((audience) => {
                  const isDefault = DEFAULT_AUDIENCE_OPTIONS.includes(audience);
                  return (
                    <div
                      key={audience}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                        isDefault ? 'bg-muted' : 'bg-primary/10 text-primary'
                      )}
                    >
                      <span>{audience}</span>
                      {!isDefault && (
                        <button
                          onClick={() => handleRemoveAudience(audience)}
                          className="hover:text-destructive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Disclaimers */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">免責事項</h2>
                <p className="text-sm text-muted-foreground">
                  アプリ上部に表示される免責事項を編集します
                </p>
              </div>
              
              <Textarea
                value={customDisclaimers.join('\n')}
                onChange={(e) => setCustomDisclaimers(e.target.value.split('\n').filter(Boolean))}
                rows={5}
                placeholder="免責事項を1行ずつ入力"
                className="font-mono text-sm"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomDisclaimers(DISCLAIMER_LINES)}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                デフォルトに戻す
              </Button>
            </div>
          </TabsContent>
          
          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">データ管理</h2>
              <p className="text-sm text-muted-foreground">
                設定のエクスポート・インポート・リセットを行います
              </p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">エクスポート</h3>
                    <p className="text-sm text-muted-foreground">設定をJSONファイルに保存</p>
                  </div>
                </div>
                <Button onClick={handleExportSettings} className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  設定をエクスポート
                </Button>
              </div>
              
              <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">インポート</h3>
                    <p className="text-sm text-muted-foreground">JSONファイルから設定を復元</p>
                  </div>
                </div>
                <Button onClick={handleImportSettings} variant="outline" className="w-full gap-2">
                  <Upload className="w-4 h-4" />
                  設定をインポート
                </Button>
              </div>
            </div>
            
            {/* Reset Section */}
            <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-destructive">すべての設定をリセット</h3>
                  <p className="text-sm text-muted-foreground">
                    カスタムプリセット、ドメイン、オプションをすべて削除し、デフォルト状態に戻します。この操作は取り消せません。
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setResetConfirmOpen(true)}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                すべてリセット
              </Button>
            </div>
            
            {/* Info Section */}
            <div className="p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground">
              <p><strong>テンプレート基準日:</strong> {TEMPLATE_BASE_DATE}</p>
              <p className="mt-1">
                カスタムプリセット: {customPresets.length}件 / 
                カスタムドメイン: {customDomains.length}件 / 
                カスタム範囲: {customScopes.length}件 / 
                カスタム対象者: {customAudiences.length}件
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Preset Edit Dialog */}
      <Dialog open={!!editingPreset} onOpenChange={(open) => !open && setEditingPreset(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewPreset ? '新規プリセット作成' : 'プリセット編集'}
            </DialogTitle>
            <DialogDescription>
              カテゴリと検索語は1行に1つずつ入力してください
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">プリセット名</Label>
              <Input
                id="preset-name"
                value={presetForm.name}
                onChange={(e) => setPresetForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例: カスタム探索"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preset-categories">カテゴリ例（1行1項目）</Label>
              <Textarea
                id="preset-categories"
                value={presetForm.categories}
                onChange={(e) => setPresetForm(prev => ({ ...prev, categories: e.target.value }))}
                rows={5}
                placeholder="医療情報セキュリティ&#10;クラウド利用と委託管理&#10;アクセス制御と監査ログ"
                className="font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preset-keywords">追加検索語候補（1行1項目）</Label>
              <Textarea
                id="preset-keywords"
                value={presetForm.keywordChips}
                onChange={(e) => setPresetForm(prev => ({ ...prev, keywordChips: e.target.value }))}
                rows={5}
                placeholder="医療情報システムの安全管理に関するガイドライン&#10;医療AI ガイドライン 国内"
                className="font-mono text-sm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPreset(null)}>
              キャンセル
            </Button>
            <Button onClick={handleSavePreset} className="gap-2">
              <Save className="w-4 h-4" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>プリセットを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。プリセットは完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePreset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>すべての設定をリセットしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              カスタムプリセット、ドメイン、対象範囲、対象者、免責事項がすべて削除され、デフォルト状態に戻ります。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              リセット
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
