import { describe, it, expect } from 'vitest';
import {
  classifyAspirationTier,
  evaluatePortfolioHealth,
  compareMajorsHeadToHead,
} from '../src/lib/aspirationPortfolioOptimizer.js';

describe('aspirationPortfolioOptimizer — Bộ tối ưu hóa rổ nguyện vọng & so sánh trường', () => {
  it('classifyAspirationTier phân loại đúng 3 mức Safety, Target, Reach', () => {
    // Dự đoán 26.0, chuẩn 24.0 -> Safety
    const safety = classifyAspirationTier(24.0, 26.0, 30);
    expect(safety.tierKey).toBe('safety');

    // Dự đoán 25.0, chuẩn 25.2 -> Target
    const target = classifyAspirationTier(25.2, 25.0, 30);
    expect(target.tierKey).toBe('target');

    // Dự đoán 24.0, chuẩn 25.5 -> Reach
    const reach = classifyAspirationTier(25.5, 24.0, 30);
    expect(reach.tierKey).toBe('reach');
  });

  it('evaluatePortfolioHealth phát hiện lỗi nghịch đảo thứ tự và cảnh báo thiếu phao cứu sinh', () => {
    // NV1 điểm thấp hơn NV2 -> Nghịch đảo thứ tự
    const inverted = evaluatePortfolioHealth([
      { school: { code: 'A' }, cutoffScore: 23.0 },
      { school: { code: 'B' }, cutoffScore: 25.5 },
    ], 24.0, 30);

    expect(inverted.hasInversion).toBe(true);
    expect(inverted.warnings.length).toBeGreaterThan(0);
    expect(inverted.healthScore).toBeLessThan(75);
  });

  it('evaluatePortfolioHealth chấm điểm cao khi có đầy đủ 3 tầng Reach - Target - Safety', () => {
    const balanced = evaluatePortfolioHealth([
      { school: { code: 'BKA' }, cutoffScore: 26.0 }, // Reach (+1.0)
      { school: { code: 'QHI' }, cutoffScore: 25.0 }, // Target (0.0)
      { school: { code: 'QHT' }, cutoffScore: 23.0 }, // Safety (-2.0)
    ], 25.0, 30);

    expect(balanced.hasInversion).toBe(false);
    expect(balanced.hasSafetyNet).toBe(true);
    expect(balanced.healthScore).toBeGreaterThanOrEqual(80);
    expect(balanced.statusLabel).toContain('Cân bằng');
  });

  it('compareMajorsHeadToHead trả về dữ liệu so sánh chuẩn xác cho các ngành', () => {
    const comparison = compareMajorsHeadToHead(['bka-kthoa', 'neu-cntt']);
    expect(comparison.length).toBeGreaterThanOrEqual(1);
    expect(comparison[0].majorName).toBeTruthy();
    expect(comparison[0].school.name).toBeTruthy();
  });
});
