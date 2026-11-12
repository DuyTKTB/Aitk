import { describe, it, expect } from 'vitest';
import { getChapterPedagogy, PEDAGOGY_TOPICS } from '../src/lib/roadmapPedagogy.js';

describe('roadmapPedagogy — Hệ thống sư phạm 4 trụ cột', () => {
  it('cung cấp đầy đủ 4 trụ cột cho chuyên đề chuẩn c11-equilibrium', () => {
    const data = getChapterPedagogy('c11-equilibrium', 'Cân bằng hóa học');
    expect(data.hasRichData).toBe(true);
    expect(data.concepts.length).toBeGreaterThanOrEqual(2);
    expect(data.algorithms.length).toBeGreaterThanOrEqual(3);
    expect(data.formulas.length).toBeGreaterThanOrEqual(2);
    expect(data.traps.length).toBeGreaterThanOrEqual(2);

    // Kiểm tra cấu trúc thẻ công thức
    const kc = data.formulas.find((f) => f.id === 'f-equil-kc');
    expect(kc).toBeDefined();
    expect(kc.displayLatex).toContain('K_C');
    expect(kc.symbols.length).toBeGreaterThan(0);
  });

  it('cung cấp đầy đủ cho c10-atom và c12-ester', () => {
    const atom = getChapterPedagogy('c10-atom', 'Cấu tạo nguyên tử');
    expect(atom.hasRichData).toBe(true);
    expect(atom.formulas.some((f) => f.displayLatex.includes('\\bar{A}'))).toBe(true);

    const ester = getChapterPedagogy('c12-ester', 'Este - lipit');
    expect(ester.hasRichData).toBe(true);
    expect(ester.traps.some((t) => t.title.includes('phenol') || t.advice.includes('phenol'))).toBe(true);
  });

  it('cung cấp fallback có cấu trúc cho chuyên đề bất kỳ', () => {
    const fallback = getChapterPedagogy('c10-periodic', 'Bảng tuần hoàn');
    expect(fallback.concepts.length).toBeGreaterThan(0);
    expect(fallback.algorithms.length).toBeGreaterThan(0);
    expect(fallback.traps.length).toBeGreaterThan(0);
  });

  it('tự động tích hợp và nạp infographics chuẩn từ knowledgeManifest', () => {
    const atom = getChapterPedagogy('c10-atom', 'Cấu tạo nguyên tử');
    expect(atom.hasInfographics).toBe(true);
    expect(atom.infographics.length).toBe(3);
    expect(atom.infographics[0].url).toContain('/img/knowledge/hoa/10/');

    const lyNhiet = getChapterPedagogy('ly-c1-nhiet', 'Vật lý nhiệt');
    expect(lyNhiet.hasInfographics).toBe(true);
    expect(lyNhiet.infographics.length).toBe(4);
    expect(lyNhiet.infographics[0].url).toContain('/img/knowledge/ly/12/');
  });
});
