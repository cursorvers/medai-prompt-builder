/**
 * Medical AI Prompt Builder - Settings Panel Component
 * Design: Medical Precision 2.0 - Heavy yet Light
 * 
 * Features:
 * - Elegant section cards with icons
 * - Premium chip components
 * - Smooth interactions
 * - Responsive for both PC and Mobile
 */

import { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Target, 
  Users, 
  Settings, 
  List, 
  Tag, 
  Globe,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  AlertCircle,
  Check,
  GripVertical
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AppConfig, ValidationResult } from '@/lib/presets';
import { DEFAULT_SCOPE_OPTIONS, DEFAULT_AUDIENCE_OPTIONS } from '@/lib/presets';

interface SettingsPanelProps {
  config: AppConfig;
  validation: ValidationResult;
  onUpdateField: <K extends keyof AppConfig>(field: K, value: AppConfig[K]) => void;
  onToggleCategory: (index: number) => void;
  onMoveCategory: (index: number, direction: 'up' | 'down') => void;
  onToggleKeywordChip: (index: number) => void;
  onToggleScope: (scope: string) => void;
  onAddCustomScope: (scope: string) => void;
  onToggleAudience: (audience: string) => void;
  onAddPriorityDomain: (domain: string) => void;
  onRemovePriorityDomain: (domain: string) => void;
  onSetCustomKeywords: (text: string) => void;
  onSetExcludeKeywords: (text: string) => void;
}

// Section Card component
function SectionCard({ 
  icon: Icon, 
  title, 
  children,
  className
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("medical-card", className)}>
      <div className="medical-card-header">
        <div className="section-header-icon">
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="medical-card-body">
        {children}
      </div>
    </div>
  );
}

// Premium Chip component
function Chip({ 
  label, 
  active, 
  onClick, 
  onRemove 
}: { 
  label: string; 
  active: boolean; 
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'chip group',
        active ? 'chip-active' : 'chip-default'
      )}
    >
      {active && (
        <Check className="w-3 h-3 opacity-70" />
      )}
      <span className="truncate max-w-[180px]">{label}</span>
      {onRemove && (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            'ml-0.5 p-0.5 rounded-full transition-colors',
            'hover:bg-white/20'
          )}
        >
          <X className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}

export function SettingsPanel({
  config,
  validation,
  onUpdateField,
  onToggleCategory,
  onMoveCategory,
  onToggleKeywordChip,
  onToggleScope,
  onAddCustomScope,
  onToggleAudience,
  onAddPriorityDomain,
  onRemovePriorityDomain,
  onSetCustomKeywords,
  onSetExcludeKeywords,
}: SettingsPanelProps) {
  const [newScope, setNewScope] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const isStandard = config.difficultyLevel === 'standard';
  
  const handleAddScope = () => {
    if (newScope.trim()) {
      onAddCustomScope(newScope.trim());
      setNewScope('');
    }
  };
  
  const handleAddDomain = () => {
    if (newDomain.trim()) {
      onAddPriorityDomain(newDomain.trim());
      setNewDomain('');
    }
  };

  return (
    <div className="space-y-4 p-4 lg:p-5">
      {/* Date & Query Section */}
      <SectionCard icon={Search} title="探索条件">
        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              生成日
            </Label>
            <Input
              type="date"
              value={config.dateToday}
              onChange={(e) => onUpdateField('dateToday', e.target.value)}
              className="h-10"
            />
          </div>
          
          {/* Query (Required) */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              探索テーマ <span className="text-destructive">*必須</span>
            </Label>
            <Input
              type="text"
              placeholder="例: 医療AIの臨床導入における安全管理"
              value={config.query}
              onChange={(e) => onUpdateField('query', e.target.value)}
              className={cn(
                'h-10',
                !config.query.trim() && 'border-destructive focus-visible:ring-destructive'
              )}
            />
            {!config.query.trim() && (
              <div className="flex items-center gap-1.5 text-xs text-destructive animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>探索テーマを入力してください</span>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
      
      {/* Scope Section */}
      <SectionCard icon={Target} title="対象範囲">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SCOPE_OPTIONS.map((scope) => (
              <Chip
                key={scope}
                label={scope}
                active={config.scope.includes(scope)}
                onClick={() => onToggleScope(scope)}
              />
            ))}
            {config.scope
              .filter(s => !DEFAULT_SCOPE_OPTIONS.includes(s))
              .map((scope) => (
                <Chip
                  key={scope}
                  label={scope}
                  active={true}
                  onClick={() => onToggleScope(scope)}
                  onRemove={() => onToggleScope(scope)}
                />
              ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="追加する範囲"
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddScope()}
              className="flex-1 h-9 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddScope}
              disabled={!newScope.trim()}
              className="h-9 px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SectionCard>
      
      {/* Audiences Section */}
      <SectionCard icon={Users} title="対象者">
        <div className="flex flex-wrap gap-2">
          {DEFAULT_AUDIENCE_OPTIONS.map((audience) => (
            <Chip
              key={audience}
              label={audience}
              active={config.audiences.includes(audience)}
              onClick={() => onToggleAudience(audience)}
            />
          ))}
        </div>
      </SectionCard>
      
      {/* Options Section */}
      <SectionCard icon={Settings} title="オプション">
        <div className="space-y-3">
          <SwitchRow
            id="threeMinistry"
            label="3省2ガイドライン必須"
            description="必須検索語に強制で含める"
            checked={config.threeMinistryGuidelines}
            onCheckedChange={(v) => onUpdateField('threeMinistryGuidelines', v)}
            locked
          />
          <div className="h-px bg-border" />
          <SwitchRow
            id="officialDomain"
            label="公式ドメイン優先"
            checked={config.officialDomainPriority}
            onCheckedChange={(v) => onUpdateField('officialDomainPriority', v)}
            warning={!config.officialDomainPriority}
            locked={isStandard}
          />
          <SwitchRow
            id="siteOperator"
            label="site: 演算子併用"
            checked={config.siteOperator}
            onCheckedChange={(v) => onUpdateField('siteOperator', v)}
            locked={isStandard}
          />
          <SwitchRow
            id="latestVersion"
            label="最新版優先"
            checked={config.latestVersionPriority}
            onCheckedChange={(v) => onUpdateField('latestVersionPriority', v)}
            warning={!config.latestVersionPriority}
            locked={isStandard}
          />
          <SwitchRow
            id="pdfDirect"
            label="PDF直リンク優先"
            checked={config.pdfDirectLink}
            onCheckedChange={(v) => onUpdateField('pdfDirectLink', v)}
            locked={isStandard}
          />
          <div className="h-px bg-border" />
          <SwitchRow
            id="searchLog"
            label="検索ログを出力に含める"
            checked={config.includeSearchLog}
            onCheckedChange={(v) => onUpdateField('includeSearchLog', v)}
            locked={isStandard}
          />
          <SwitchRow
            id="eGov"
            label="e-Gov法令クロスリファレンス"
            checked={config.eGovCrossReference}
            onCheckedChange={(v) => onUpdateField('eGovCrossReference', v)}
            locked={isStandard}
          />
          <SwitchRow
            id="proofMode"
            label="実証モード"
            description="プロンプトに実証セクションを含める"
            checked={config.proofMode}
            onCheckedChange={(v) => onUpdateField('proofMode', v)}
            locked={isStandard}
          />
        </div>
      </SectionCard>
      
      {/* Categories Section */}
      <SectionCard icon={List} title="カテゴリ例">
        <div className="space-y-1.5">
          {config.categories.map((category, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 p-2.5 rounded-lg border transition-all duration-150',
                category.enabled
                  ? 'bg-card border-border hover:border-primary/30'
                  : 'bg-muted/30 border-transparent opacity-60'
              )}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/50" />
              <input
                type="checkbox"
                checked={category.enabled}
                onChange={() => onToggleCategory(index)}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary"
              />
              <span className={cn(
                'flex-1 text-sm truncate',
                !category.enabled && 'text-muted-foreground'
              )}>
                {category.name}
              </span>
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => onMoveCategory(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveCategory(index, 'down')}
                  disabled={index === config.categories.length - 1}
                  className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      
      {/* Keywords Section */}
      <SectionCard icon={Tag} title="追加検索語候補">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {config.keywordChips.map((chip, index) => (
              <Chip
                key={index}
                label={chip.name}
                active={chip.enabled}
                onClick={() => onToggleKeywordChip(index)}
              />
            ))}
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              自由追加（1行1語）
            </Label>
            <Textarea
              placeholder="追加したいキーワードを入力&#10;1行に1つ"
              value={config.customKeywords.join('\n')}
              onChange={(e) => onSetCustomKeywords(e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              除外キーワード（1行1語）
            </Label>
            <Textarea
              placeholder="除外したいキーワードを入力&#10;1行に1つ"
              value={config.excludeKeywords.join('\n')}
              onChange={(e) => onSetExcludeKeywords(e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </div>
      </SectionCard>
      
      {/* Priority Domains Section */}
      <SectionCard icon={Globe} title="優先ドメイン">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {config.priorityDomains.map((domain) => (
              <Chip
                key={domain}
                label={domain}
                active={true}
                onRemove={() => onRemovePriorityDomain(domain)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="example.go.jp"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              className="flex-1 h-9 text-sm font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDomain}
              disabled={!newDomain.trim()}
              className="h-9 px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// Switch row component
function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  locked,
  warning,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  locked?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex-1 min-w-0">
        <Label
          htmlFor={id}
          className={cn(
            'text-sm font-normal cursor-pointer flex items-center gap-2',
            warning && 'text-amber-600'
          )}
        >
          {label}
          {locked && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              固定
            </span>
          )}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={locked}
      />
    </div>
  );
}
