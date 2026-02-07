/**
 * privacy.ts - 軽量プライバシー警告ユーティリティ
 * 機微情報の簡易検出（正規表現ベース、警告のみ）
 */

export interface PrivacyWarning {
  type:
    | 'facility'
    | 'patient_id'
    | 'phone'
    | 'email'
    | 'name'
    | 'date'
    | 'postal'
    | 'address'
    | 'account'
    | 'tax_id';
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
  {
    type: 'postal',
    // 郵便番号（〒123-4567 / 1234567）
    pattern: /〒?\s*\b[0-9]{3}-?[0-9]{4}\b/g,
    message: '郵便番号が含まれている可能性があります',
  },
  {
    type: 'address',
    // 住所っぽい記載（都道府県 + 市区町村 までを軽く検出）
    pattern:
      /(?:北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)[\\u4e00-\\u9faf0-9\\-−ー\\s　]{0,40}(?:市|区|町|村)/g,
    message: '住所が含まれている可能性があります',
  },
  {
    type: 'account',
    // 口座/銀行/登録番号やNo.等（請求書や契約書に混ざりやすい）
    pattern:
      /(?:普通預金|当座預金|口座番号|口座|銀行|支店)[^\\n]{0,30}(?:No\\.?\\s*[0-9]{5,}|[0-9]{5,})|\\bNo\\.?\\s*[0-9]{5,}\\b/g,
    message: '口座番号や請求書番号等が含まれている可能性があります',
  },
  {
    type: 'tax_id',
    // 適格請求書発行事業者登録番号（T + 13桁）
    pattern: /\bT[0-9]{13}\b/g,
    message: '登録番号（T+13桁）が含まれている可能性があります',
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
export function getPrivacyWarningMessage(
  warnings: PrivacyWarning[],
  ctx: 'query' | 'vendor_doc' | 'generic' = 'generic'
): string {
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
    postal: '郵便番号',
    address: '住所',
    account: '口座/番号',
    tax_id: '登録番号',
  };

  const detected = types.map((t) => typeMessages[t]).join('、');
  if (ctx === 'query') {
    return `入力内容に ${detected} が含まれている可能性があります。検索クエリとして送信される前にご確認ください。`;
  }
  if (ctx === 'vendor_doc') {
    return `入力内容に ${detected} が含まれている可能性があります。LLMへ貼り付ける前に伏字を推奨します。`;
  }
  return `入力内容に ${detected} が含まれている可能性があります。`;
}
