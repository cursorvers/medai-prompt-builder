import { describe, it, expect } from 'vitest';
import { extractAuditRelevantSnippets } from '../pdf';

describe('extractAuditRelevantSnippets', () => {
  it('returns snippets around keyword hits and keeps context', () => {
    const text = [
      '第1条 総則',
      '',
      '第2条 データの保存期間は30日とする。',
      '',
      '第3条 秘密保持に関する規定。',
      '',
      '第4条 監査権を当社は有する。',
      '',
      '第5条 雑則',
    ].join('\n');

    const res = extractAuditRelevantSnippets(text, ['保存期間', '監査権'], { contextParagraphs: 0, maxChars: 10_000 });
    expect(res.text).toContain('保存期間');
    expect(res.text).toContain('監査権');
    expect(res.text).not.toContain('第1条');
    expect(res.hitCount).toBeGreaterThanOrEqual(2);
  });

  it('truncates when maxChars is small', () => {
    const text = Array.from({ length: 80 }, (_, i) => `段落${i} 保存 ${'x'.repeat(50)}`).join('\n\n');
    const res = extractAuditRelevantSnippets(text, ['保存'], { contextParagraphs: 0, maxChars: 1000 });
    expect(res.truncated).toBe(true);
    expect(res.text.length).toBeLessThanOrEqual(1000);
  });
});
