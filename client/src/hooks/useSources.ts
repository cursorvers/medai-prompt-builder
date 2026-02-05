/**
 * useSources - 一次資料コーパス読み込みフック
 * sources.json から医療AI国内ガイドラインの起点URLを取得
 */

import { useState, useEffect, useCallback } from 'react';

export interface Source {
  id: string;
  name: string;
  url: string;
  domain: string;
  category: 'regulatory' | 'guideline' | 'legal' | 'ethics' | 'other';
  description?: string;
  tags?: string[];
}

export interface SourcesData {
  version: string;
  lastUpdated: string;
  nextReviewDate?: string;
  maintainer?: string;
  sources: Source[];
  priorityDomains: string[];
}

interface UseSourcesReturn {
  sources: Source[];
  priorityDomains: string[];
  version: string;
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
  getSourcesByCategory: (category: Source['category']) => Source[];
  getSourcesByDomain: (domain: string) => Source[];
}

const SOURCES_URL = '/sources.json';

// デフォルトのフォールバックデータ
const FALLBACK_SOURCES: SourcesData = {
  version: '0.0.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  sources: [],
  priorityDomains: [
    'pmda.go.jp',
    'mhlw.go.jp',
    'meti.go.jp',
    'e-gov.go.jp',
  ],
};

export function useSources(): UseSourcesReturn {
  const [data, setData] = useState<SourcesData>(FALLBACK_SOURCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSources() {
      try {
        const response = await fetch(SOURCES_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch sources: ${response.status}`);
        }
        const json: SourcesData = await response.json();

        if (isMounted) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        console.warn('Failed to load sources.json, using fallback:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          // フォールバックデータを使用
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSources();

    return () => {
      isMounted = false;
    };
  }, []);

  const getSourcesByCategory = useCallback(
    (category: Source['category']) => {
      return data.sources.filter((s) => s.category === category);
    },
    [data.sources]
  );

  const getSourcesByDomain = useCallback(
    (domain: string) => {
      return data.sources.filter((s) => s.domain === domain);
    },
    [data.sources]
  );

  return {
    sources: data.sources,
    priorityDomains: data.priorityDomains,
    version: data.version,
    lastUpdated: data.lastUpdated,
    isLoading,
    error,
    getSourcesByCategory,
    getSourcesByDomain,
  };
}
