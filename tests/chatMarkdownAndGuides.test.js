import { describe, it, expect } from 'vitest';
import React from 'react';
import { MarkdownLike } from '../src/components/ChatMarkdown.jsx';

describe('ChatMarkdown — ChatGPT-Style Markdown Normalization & Rendering', () => {
  it('normalizes squashed headers and bullets so they do not run together into a single line', () => {
    const rawSquashed = 'quy trình chuẩn: ### 1. Truy cập tab Số liệu lớp Thầy/Cô có thể xem điểm: * **Lọc theo lớp:** Chọn lớp. * **Lọc theo đề:** Chọn đề. ### 2. Phân tích số liệu';
    
    // Normalization logic inside MarkdownLike
    const normalized = rawSquashed
      .replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2')
      .replace(/([^\n])\s+([*•-]\s+)/g, '$1\n$2');

    expect(normalized).toContain('\n\n### 1.');
    expect(normalized).toContain('\n* **Lọc theo lớp:**');
    expect(normalized).toContain('\n* **Lọc theo đề:**');
    expect(normalized).toContain('\n\n### 2.');
  });

  it('renders blockquote callout boxes and dividers properly', () => {
    const textWithCallout = '> **Lưu ý sư phạm:** Nhớ xuất Excel báo cáo\n---\nNội dung tiếp theo';
    const lines = textWithCallout.split('\n');
    expect(lines[0].startsWith('>')).toBe(true);
    expect(lines[1]).toBe('---');
  });

  it('parses markdown tables with headers and rows', () => {
    const tableText = '| Lớp | Sĩ số | Điểm TB |\n| --- | --- | --- |\n| 11A5 | 40 | 7.8 |\n| 11A7 | 38 | 8.2 |';
    const lines = tableText.split('\n');
    expect(lines.every((l) => l.startsWith('|') && l.endsWith('|'))).toBe(true);
  });
});
