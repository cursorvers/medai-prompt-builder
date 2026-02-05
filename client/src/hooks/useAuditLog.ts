/**
 * useAuditLog - 軽量監査ログフック
 * 検索条件と実行日時を localStorage に保存
 */

import { useState, useEffect, useCallback } from 'react';

export interface AuditEntry {
  id: string;
  timestamp: string;
  preset: string;
  presetName: string;
  theme: string;
  difficulty: string;
  searchQueries: string[];
}

interface UseAuditLogReturn {
  entries: AuditEntry[];
  addEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  clearAll: () => void;
  downloadJSON: () => void;
  entryCount: number;
}

const STORAGE_KEY = 'guidescope_audit_log';
const MAX_ENTRIES = 100;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAuditLog(): UseAuditLogReturn {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  // 初期読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuditEntry[];
        setEntries(parsed);
      }
    } catch (err) {
      console.warn('Failed to load audit log:', err);
    }
  }, []);

  // localStorage に保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.warn('Failed to save audit log:', err);
    }
  }, [entries]);

  const addEntry = useCallback(
    (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
      const newEntry: AuditEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };

      setEntries((prev) => {
        const updated = [newEntry, ...prev];
        // 最大件数を超えたら古いものを削除
        if (updated.length > MAX_ENTRIES) {
          return updated.slice(0, MAX_ENTRIES);
        }
        return updated;
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const downloadJSON = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      tool: 'GuideScope',
      version: '1.0.0',
      entryCount: entries.length,
      entries,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guidescope_audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  return {
    entries,
    addEntry,
    clearAll,
    downloadJSON,
    entryCount: entries.length,
  };
}
