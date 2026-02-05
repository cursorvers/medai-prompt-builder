/**
 * useReturnBanner - 検索リンクから戻った時のバナー表示フック
 * Page Visibility API を使用して、ユーザーが検索結果から戻ってきたことを検出
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseReturnBannerReturn {
  showBanner: boolean;
  lastSearchQuery: string | null;
  dismissBanner: () => void;
  markSearchStarted: (query: string) => void;
}

const BANNER_DISMISS_KEY = 'guidescope_banner_dismissed';
const LAST_SEARCH_KEY = 'guidescope_last_search';
const SEARCH_TIMESTAMP_KEY = 'guidescope_search_timestamp';
const BANNER_TIMEOUT_MS = 30 * 60 * 1000; // 30分以内に戻ってきた場合のみ表示

export function useReturnBanner(): UseReturnBannerReturn {
  const [showBanner, setShowBanner] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const wasHiddenRef = useRef(false);

  // 検索開始をマーク（リンククリック時に呼ぶ）
  const markSearchStarted = useCallback((query: string) => {
    sessionStorage.setItem(LAST_SEARCH_KEY, query);
    sessionStorage.setItem(SEARCH_TIMESTAMP_KEY, Date.now().toString());
    sessionStorage.removeItem(BANNER_DISMISS_KEY);
  }, []);

  // バナーを閉じる
  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    sessionStorage.setItem(BANNER_DISMISS_KEY, 'true');
  }, []);

  // Page Visibility API でタブが再表示されたことを検出
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // タブが非表示になった
        wasHiddenRef.current = true;
      } else if (wasHiddenRef.current) {
        // タブが再表示された
        wasHiddenRef.current = false;

        // バナーが既に閉じられていたらスキップ
        if (sessionStorage.getItem(BANNER_DISMISS_KEY) === 'true') {
          return;
        }

        // 検索が開始されていたかチェック
        const savedQuery = sessionStorage.getItem(LAST_SEARCH_KEY);
        const timestampStr = sessionStorage.getItem(SEARCH_TIMESTAMP_KEY);

        if (savedQuery && timestampStr) {
          const timestamp = parseInt(timestampStr, 10);
          const elapsed = Date.now() - timestamp;

          // タイムアウト内であればバナーを表示
          if (elapsed < BANNER_TIMEOUT_MS) {
            setLastSearchQuery(savedQuery);
            setShowBanner(true);
          } else {
            // タイムアウト後はクリア
            sessionStorage.removeItem(LAST_SEARCH_KEY);
            sessionStorage.removeItem(SEARCH_TIMESTAMP_KEY);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    showBanner,
    lastSearchQuery,
    dismissBanner,
    markSearchStarted,
  };
}
