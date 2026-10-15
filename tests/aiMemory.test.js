import { describe, it, expect, beforeEach } from 'vitest';
import {
  summarizeMessages, compressHistory, buildMemoryBlock, loadProfile, saveProfile, noteWeakTopic,
} from '../src/lib/aiMemory.js';

// Giả lập localStorage cho môi trường node
beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
});

const turns = (n, topic = 'este') => {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ role: 'user', parts: [{ text: `Câu hỏi ${i} về ${topic} và C2H5OH` }] });
    out.push({ role: 'model', parts: [{ text: `Trả lời ${i}: dùng công thức n = m/M` }] });
  }
  return out;
};

describe('summarizeMessages', () => {
  it('trích câu hỏi, công thức và chủ đề', () => {
    const s = summarizeMessages(turns(4));
    expect(s).toContain('Câu hỏi');
    expect(s).toContain('C2H5OH');
    expect(s).toContain('este');
  });

  it('rỗng với mảng rỗng', () => {
    expect(summarizeMessages([])).toBe('');
  });
});

describe('compressHistory', () => {
  it('giữ phần gần và nén phần cũ', () => {
    const { recent, olderSummary } = compressHistory(turns(10), { keep: 6 });
    expect(recent).toHaveLength(6);
    expect(olderSummary.length).toBeGreaterThan(20);
  });

  it('không nén khi hội thoại ngắn', () => {
    const { recent, olderSummary } = compressHistory(turns(2), { keep: 8 });
    expect(recent).toHaveLength(4);
    expect(olderSummary).toBe('');
  });
});

describe('hồ sơ học tập', () => {
  it('lưu và đọc lại khối lớp', () => {
    saveProfile('u1', { grade: 'Lớp 12' });
    expect(loadProfile('u1').grade).toBe('Lớp 12');
  });

  it('ghi nhận chủ đề yếu, tăng dần số lần', () => {
    noteWeakTopic('u1', 'cân bằng hóa học');
    noteWeakTopic('u1', 'cân bằng hóa học');
    const p = loadProfile('u1');
    expect(p.weakTopics[0].topic).toBe('cân bằng hóa học');
    expect(p.weakTopics[0].count).toBe(2);
    expect(p.weakTopics).toHaveLength(1);
  });

  it('bỏ qua chủ đề quá ngắn', () => {
    expect(noteWeakTopic('u1', 'a')).toBeNull();
  });
});

describe('buildMemoryBlock', () => {
  it('ghép hồ sơ + tóm tắt', () => {
    const block = buildMemoryBlock({
      profile: { grade: 'Lớp 11', weakTopics: [{ topic: 'este' }], notes: '' },
      olderSummary: 'đã bàn về C2H5OH',
    });
    expect(block).toContain('Lớp 11');
    expect(block).toContain('este');
    expect(block).toContain('đã bàn về C2H5OH');
  });

  it('rỗng khi không có gì', () => {
    expect(buildMemoryBlock({})).toBe('');
  });
});
