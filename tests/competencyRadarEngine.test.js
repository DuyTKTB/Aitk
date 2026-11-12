import { describe, it, expect } from 'vitest';
import {
  RADAR_AXES,
  computeCompetencyRadar,
  computeGaussianScoreDistribution,
} from '../src/lib/competencyRadarEngine.js';

describe('competencyRadarEngine — Động cơ Radar 6 chiều & Dải điểm Gaussian', () => {
  it('Có đầy đủ 6 trục năng lực KHTN chuẩn hóa', () => {
    expect(RADAR_AXES).toHaveLength(6);
    const keys = RADAR_AXES.map((a) => a.key);
    expect(keys).toContain('speed');
    expect(keys).toContain('theory');
    expect(keys).toContain('advanced');
    expect(keys).toContain('endurance');
    expect(keys).toContain('coverage');
    expect(keys).toContain('balance');
  });

  it('computeCompetencyRadar tính toán điểm 6 trục trong khoảng 0 - 100 và xác định điểm mạnh/yếu', () => {
    const radar = computeCompetencyRadar({
      overview: { totalAnswers: 50, avgMastery: 75 },
      chapters: [
        { summary: { answers: 10 } },
        { summary: { answers: 0 } },
        { summary: { answers: 5 } },
      ],
      events: [
        { at: Date.now() - 86400000, durationMs: 40000 },
        { at: Date.now(), durationMs: 45000 },
      ],
      activeAspiration: { block: 'A00' },
    });

    expect(radar.overallCompetency).toBeGreaterThan(0);
    expect(radar.overallCompetency).toBeLessThanOrEqual(100);

    Object.values(radar.scores).forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    });

    expect(radar.strongest).toBeDefined();
    expect(radar.weakest).toBeDefined();
    expect(radar.advice).toBeTruthy();
  });

  it('computeGaussianScoreDistribution tính đúng 3 mốc P90 (Sàn), P50 (Kỳ vọng), P10 (Thăng hoa)', () => {
    const dist = computeGaussianScoreDistribution({
      predictedScore: 25.0,
      examScale: 30,
      totalAnswers: 80,
      targetScore: 26.5,
    });

    expect(dist.mean).toBe(25.0);
    expect(dist.expected).toBe(25.0);
    expect(dist.safeFloor).toBeLessThan(dist.expected);
    expect(dist.peakPotential).toBeGreaterThan(dist.expected);
    expect(dist.points.length).toBeGreaterThan(20);
    expect(dist.probExceedTargetPct).toBeGreaterThanOrEqual(0);
    expect(dist.probExceedTargetPct).toBeLessThanOrEqual(100);
  });
});
