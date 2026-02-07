/**
 * PDF helpers (client-side only)
 *
 * Goals:
 * - Improve UX for "vendor contract/spec audit" by letting users upload a PDF
 *   and extract text locally (no server upload).
 * - Keep extracted text small by default via keyword-based snippet extraction.
 *
 * Notes:
 * - This is best-effort text extraction. Scanned/image PDFs will often return
 *   little to no text. In that case, ask users to OCR or copy text manually.
 */

export type PdfExtractProgress = {
  page: number;
  totalPagesToRead: number;
};

export type PdfExtractResult = {
  text: string;
  totalPages: number;
  readPages: number;
  truncated: boolean;
};

export const DEFAULT_AUDIT_KEYWORDS = [
  // Data handling
  '保存',
  '保管',
  '保持',
  '保存期間',
  '保管期間',
  '削除',
  '消去',
  '返却',
  '廃棄',
  // ML / AI usage
  '学習',
  '再学習',
  '二次利用',
  '目的外',
  '統計',
  '解析',
  '分析',
  '品質改善',
  'モデル',
  // Subprocessing / outsourcing
  '委託',
  '再委託',
  '第三者',
  '提供',
  '共同利用',
  // Cross-border / location
  '国外',
  '海外',
  '越境',
  '域外',
  '所在地',
  // Security / logging / incidents
  'ログ',
  '監査',
  '監査権',
  'アクセス',
  '権限',
  '暗号',
  '脆弱性',
  'インシデント',
  '事故',
  '漏えい',
  '報告',
  '通知',
  '是正',
  // SLA / continuity
  'SLA',
  '可用性',
  '障害',
  '復旧',
  'バックアップ',
  // Confidentiality
  '秘密保持',
  '機密',
];

function normalizeWhitespace(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractAuditRelevantSnippets(
  text: string,
  keywords: string[] = DEFAULT_AUDIT_KEYWORDS,
  opts?: {
    contextParagraphs?: number;
    maxChars?: number;
  }
): { text: string; hitCount: number; truncated: boolean } {
  const context = Math.max(0, opts?.contextParagraphs ?? 1);
  const maxChars = Math.max(1000, opts?.maxChars ?? 25_000);

  const normalized = normalizeWhitespace(text);
  if (!normalized) return { text: '', hitCount: 0, truncated: false };

  const parts = normalized.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return { text: '', hitCount: 0, truncated: false };

  const loweredKeywords = keywords
    .map(k => k.trim())
    .filter(Boolean);

  const hitIndexes = new Set<number>();
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    for (const k of loweredKeywords) {
      if (p.includes(k)) {
        for (let j = Math.max(0, i - context); j <= Math.min(parts.length - 1, i + context); j++) {
          hitIndexes.add(j);
        }
        break;
      }
    }
  }

  const indexes = Array.from(hitIndexes).sort((a, b) => a - b);
  const snippets: string[] = [];
  let total = 0;
  let truncated = false;

  for (const idx of indexes) {
    const chunk = parts[idx];
    if (!chunk) continue;
    const nextLen = total + chunk.length + 2;
    if (nextLen > maxChars) {
      truncated = true;
      break;
    }
    snippets.push(chunk);
    total = nextLen;
  }

  return { text: snippets.join('\n\n'), hitCount: indexes.length, truncated };
}

export async function extractTextFromPdfFile(
  file: File,
  opts?: {
    maxPages?: number;
    maxChars?: number;
    onProgress?: (p: PdfExtractProgress) => void;
  }
): Promise<PdfExtractResult> {
  const maxPages = Math.max(1, opts?.maxPages ?? 40);
  const maxChars = Math.max(5_000, opts?.maxChars ?? 200_000);

  // Lazy-load pdf.js only when needed (keeps initial bundle small).
  const pdfjs = await import('pdfjs-dist');
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const pagesToRead = Math.min(totalPages, maxPages);

  const chunks: string[] = [];
  let totalLen = 0;
  let truncated = false;

  for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
    opts?.onProgress?.({ page: pageNum, totalPagesToRead: pagesToRead });
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items as Array<{ str?: string }>)
      .map(it => it.str || '')
      .filter(Boolean)
      .join(' ');

    const normalizedPage = normalizeWhitespace(pageText);
    if (!normalizedPage) continue;

    const nextLen = totalLen + normalizedPage.length + 2;
    if (nextLen > maxChars) {
      truncated = true;
      break;
    }

    chunks.push(normalizedPage);
    totalLen = nextLen;
  }

  return {
    text: chunks.join('\n\n'),
    totalPages,
    readPages: pagesToRead,
    truncated,
  };
}
