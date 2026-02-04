/**
 * ミニマルモード（X反応確認用）コンテキスト
 *
 * 有効時にグレーアウトする機能:
 * - 対象範囲
 * - 対象者
 * - オプション
 * - カテゴリ
 * - 追加検索語
 * - 優先ドメイン
 * - 検索クエリタブ
 * - JSONタブ
 * - 共有ボタン
 * - 設定ページへのリンク
 */

import { createContext, useContext, type ReactNode } from 'react';

interface MinimalModeContextType {
  isMinimalMode: boolean;
}

const MinimalModeContext = createContext<MinimalModeContextType>({
  isMinimalMode: false,
});

export function MinimalModeProvider({ children }: { children: ReactNode }) {
  // 環境変数でミニマルモードを制御
  // VITE_MINIMAL_MODE=true でミニマルモード有効
  const isMinimalMode = import.meta.env.VITE_MINIMAL_MODE === 'true';

  return (
    <MinimalModeContext.Provider value={{ isMinimalMode }}>
      {children}
    </MinimalModeContext.Provider>
  );
}

export function useMinimalMode() {
  return useContext(MinimalModeContext);
}
