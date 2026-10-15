import { describe, it, expect } from 'vitest';
import {
  retrieve, formatContext, citationsOf, tokenize, canonFormula, knowledgeStats,
} from '../src/lib/aiKnowledge.js';
import { ELEMENTS } from '../src/data/elements.js';

describe('tokenize', () => {
  it('bỏ dấu tiếng Việt và stopword', () => {
    const t = tokenize('Tính số mol của chất');
    expect(t).toContain('mol');
    expect(t).toContain('chat');
    expect(t).not.toContain('cua');
  });

  it('tách cả dạng dính số', () => {
    expect(tokenize('nồng độ pH')).toContain('ph');
  });
});

describe('canonFormula', () => {
  it('chuẩn hóa chỉ số Unicode và dấu chấm', () => {
    expect(canonFormula('H₂SO₄')).toBe('h2so4');
    expect(canonFormula('CuSO4·5H2O')).toBe('cuso4.5h2o');
  });
});

describe('knowledge index', () => {
  it('có dữ liệu', () => {
    const stats = knowledgeStats();
    expect(stats.docs).toBeGreaterThan(200);
    expect(stats.byKind.element).toBeGreaterThan(100);
    expect(stats.byKind.formula).toBeGreaterThan(5);
    expect(stats.byKind.reaction).toBeGreaterThanOrEqual(20);
  });

  it('tìm công thức theo mô tả tiếng Việt', () => {
    const hits = retrieve('số mol theo khối lượng');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].kind).toBe('formula');
    expect(hits.map((h) => h.id)).toContain('formula:n-m');
  });

  it('tìm hợp chất theo công thức chính xác', () => {
    const hits = retrieve('H2SO4');
    expect(hits[0].id).toBe('compound:H2SO4');
  });

  it('tìm hợp chất theo tên tiếng Việt', () => {
    const hits = retrieve('axit sunfuric');
    expect(hits.map((h) => h.id)).toContain('compound:H2SO4');
  });

  it('tìm nguyên tố theo ký hiệu', () => {
    const hits = retrieve('nguyên tố Fe');
    expect(hits.map((h) => h.id)).toContain('element:Fe');
  });

  it('tìm nguyên tố theo TÊN TIẾNG ANH (app đã bỏ tên tiếng Việt)', () => {
    const hits = retrieve('cho mình hỏi về iron');
    expect(hits.map((h) => h.id)).toContain('element:Fe');
  });

  it('dữ liệu nguyên tố không còn tên tiếng Việt', () => {
    const fe = ELEMENTS.find((e) => e.symbol === 'Fe');
    expect(fe.name).toBe('Iron');
    expect(fe.vietnameseName).toBeUndefined();
    expect(fe.s.vn).toBeUndefined();
  });

  it('trả mảng rỗng với câu quá ngắn', () => {
    expect(retrieve('hi')).toEqual([]);
  });
});

describe('formatContext / citationsOf', () => {
  it('sinh ngữ cảnh có đánh số và trích dẫn', () => {
    const hits = retrieve('số mol theo khối lượng');
    const ctx = formatContext(hits);
    expect(ctx).toContain('[1]');
    const cites = citationsOf(hits);
    expect(cites[0].n).toBe(1);
    expect(cites[0].label.length).toBeGreaterThan(3);
  });
});
