/**
 * privacy.ts - 軽量プライバシー警告ユーティリティ
 * 機微情報の簡易検出（正規表現ベース、警告のみ）
 */

export interface PrivacyWarning {
  type: 'facility' | 'patient_id' | 'phone' | 'email' | 'name' | 'date';
  message: string;
  match: string;
}

// 検出パターン（日本語対応）
const PATTERNS: Array<{
  type: PrivacyWarning['type'];
  pattern: RegExp;
  message: string;
}> = [
  {
    type: 'facility',
    // 病院、クリニック、医院、センター、大学病院など
    pattern: /(?:[\u4e00-\u9faf]+(?:病院|クリニック|医院|センター|診療所|医療センター)|[A-Z][a-z]+\s*Hospital)/gi,
    message: '施設名が含まれている可能性があります',
  },
  {
    type: 'patient_id',
    // 患者ID風のパターン（数字8桁以上、またはID+数字）
    pattern: /(?:患者ID|ID|番号)[：:\s]*[A-Z0-9]{6,}|\b[0-9]{8,}\b/gi,
    message: '患者IDまたは識別番号が含まれている可能性があります',
  },
  {
    type: 'phone',
    // 電話番号パターン
    pattern: /(?:0[0-9]{1,4}-?[0-9]{1,4}-?[0-9]{4}|(?:090|080|070)-?[0-9]{4}-?[0-9]{4})/g,
    message: '電話番号が含まれている可能性があります',
  },
  {
    type: 'email',
    // メールアドレス
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    message: 'メールアドレスが含まれている可能性があります',
  },
  {
    type: 'name',
    // 日本人名パターン（姓+名、または「〇〇さん」「〇〇様」）
    pattern: /(?:[\u4e00-\u9faf]{1,4}[\s　][\u4e00-\u9faf]{1,4}(?:さん|様|先生|氏))|(?:[\u4e00-\u9faf]{2,4}(?:さん|様|先生|氏))/g,
    message: '個人名が含まれている可能性があります',
  },
  {
    type: 'date',
    // 具体的な日付（生年月日、受診日など）
    pattern: /(?:19|20)[0-9]{2}[年/.-](?:0?[1-9]|1[0-2])[月/.-](?:0?[1-9]|[12][0-9]|3[01])[日]?/g,
    message: '具体的な日付が含まれている可能性があります',
  },
];

/**
 * 入力テキストから機微情報を検出
 * @param text 検査対象のテキスト
 * @returns 検出された警告の配列
 */
export function detectPrivacyIssues(text: string): PrivacyWarning[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const warnings: PrivacyWarning[] = [];

  for (const { type, pattern, message } of PATTERNS) {
    // パターンをリセット（グローバルフラグ対応）
    pattern.lastIndex = 0;
    const matches = text.match(pattern);

    if (matches) {
      // 重複を除去
      const uniqueMatches = [...new Set(matches)];
      for (const match of uniqueMatches) {
        warnings.push({
          type,
          message,
          match,
        });
      }
    }
  }

  return warnings;
}

/**
 * 警告があるかどうかを判定
 */
export function hasPrivacyIssues(text: string): boolean {
  return detectPrivacyIssues(text).length > 0;
}

/**
 * 警告メッセージを生成
 */
export function getPrivacyWarningMessage(warnings: PrivacyWarning[]): string {
  if (warnings.length === 0) return '';

  const types = Array.from(
    new Set<PrivacyWarning['type']>(warnings.map((w) => w.type))
  );
  const typeMessages: Record<PrivacyWarning['type'], string> = {
    facility: '施設名',
    patient_id: '患者ID',
    phone: '電話番号',
    email: 'メールアドレス',
    name: '個人名',
    date: '具体的な日付',
  };

  const detected = types.map((t) => typeMessages[t]).join('、');
  return `入力内容に ${detected} が含まれている可能性があります。検索クエリに送信される前にご確認ください。`;
}
