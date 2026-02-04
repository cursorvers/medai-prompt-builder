/**
 * Google Analytics 4 イベントトラッキング
 * X反応確認用ミニマル版
 */

// GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-TX3Y6G4XWJ';

// gtag関数の型定義
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * GA4イベントを送信
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

/**
 * プリセット選択イベント
 */
export function trackPresetSelect(presetId: string, presetName: string) {
  trackEvent('preset_select', {
    preset_id: presetId,
    preset_name: presetName,
  });
}

/**
 * プロンプトコピーイベント
 */
export function trackPromptCopy(presetId: string) {
  trackEvent('prompt_copy', {
    preset_id: presetId,
  });
}

/**
 * プロンプトダウンロードイベント
 */
export function trackPromptDownload(presetId: string) {
  trackEvent('prompt_download', {
    preset_id: presetId,
  });
}

/**
 * Coming Soon機能クリックイベント（グレーアウト機能への関心を計測）
 */
export function trackComingSoonClick(featureName: string) {
  trackEvent('coming_soon_click', {
    feature_name: featureName,
  });
}

/**
 * 設定ページへのアクセス試行（グレーアウト時）
 */
export function trackSettingsAttempt() {
  trackEvent('settings_attempt', {
    status: 'coming_soon',
  });
}

/**
 * GA4の初期化（index.htmlで読み込むスクリプト用）
 */
export function initGA4() {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
}

export { GA_MEASUREMENT_ID };
