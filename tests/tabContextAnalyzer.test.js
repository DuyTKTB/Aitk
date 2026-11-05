import { describe, it, expect } from 'vitest';
import { getCurrentTabInfo, buildTabDetailedAnalysis, TAB_DEFINITIONS } from '../src/lib/tabContextAnalyzer.js';

describe('tabContextAnalyzer — Bộ cảm biến và phân tích ngữ cảnh tab', () => {
  it('nhận diện chính xác tab overview với số liệu thực tế', () => {
    const info = getCurrentTabInfo({
      activeSection: 'overview',
      classes: [{ name: '11A5' }, { name: '12A1' }],
      exams: [{ id: 'ex1' }, { id: 'ex2' }],
      submissionsMap: { ex1: [{ id: 's1' }] },
    });

    expect(info.key).toBe('overview');
    expect(info.classCount).toBe(2);
    expect(info.examCount).toBe(2);
    expect(info.totalSubs).toBe(1);
    expect(info.contextBadge).toContain('2 lớp');
  });

  it('nhận diện chính xác tab classes và danh sách quickChips', () => {
    const info = getCurrentTabInfo({
      activeSection: 'classes',
      classes: [{ name: '10A1' }, { name: '10A2' }, { name: '11A5' }],
    });

    expect(info.key).toBe('classes');
    expect(info.classCount).toBe(3);
    expect(info.quickChips.length).toBeGreaterThan(0);
  });

  it('ưu tiên nhận diện word_editor khi wordEditorOpen = true', () => {
    const info = getCurrentTabInfo({
      activeSection: 'exams',
      wordEditorOpen: true,
      wordEditorExam: { title: 'Đề Sinh học 12', questions: [1, 2, 3] },
    });

    expect(info.effectiveKey).toBe('word_editor');
    expect(info.shortName).toBe('Word Office 365');
  });

  it('sinh báo cáo phân tích chi tiết chuẩn sư phạm 4 phần', () => {
    const report = buildTabDetailedAnalysis({
      activeSection: 'classes',
      classes: [{ name: '11A5' }, { name: '12A1' }],
      exams: [{ id: 'e1' }],
    });

    expect(report).toContain('### I. Mục đích cốt lõi');
    expect(report).toContain('### II. Phân tích số liệu thực tế hiện tại');
    expect(report).toContain('### III. Quy trình thao tác chuẩn sư phạm');
    expect(report).toContain('### IV. Các thao tác AI đề xuất thực hiện ngay:');
    expect(report).toContain('11A5, 12A1');
  });
});
