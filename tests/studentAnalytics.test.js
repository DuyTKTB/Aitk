import { describe, it, expect } from 'vitest';
import {
  computeEloUpdate,
  buildPostExamAnalytics,
  buildWrongCauseBreakdown,
  evaluateAdmissionFit,
  computeRealPredictedScore30,
  buildDailyStudyMissions,
  getCombatPowerTier,
  recordCombatPowerOnce,
  buildActivityHeatmap365,
  computeStudentAbilityRadar,
  computeStudyDiagnosis,
  evaluateSafeMathExpr,
  buildScoreDistributionHistogram,
  buildTopicPerformanceBreakdown,
  getRewardShopState,
  buyOrEquipShopItem,
  computeRiasecCareerMatches,
} from '../src/lib/studentAnalytics.js';

describe('studentAnalytics — ELO, Post-Exam Insights, Wrong Causes & Admission Fit', () => {
  it('computes bounded ELO gain/loss and tier rank cleanly', () => {
    const gain = computeEloUpdate({ currentElo: 1200, pct: 90, totalQuestions: 28 });
    expect(gain.delta).toBeGreaterThan(0);
    expect(gain.nextElo).toBeGreaterThan(1200);

    const loss = computeEloUpdate({ currentElo: 1200, pct: 30, totalQuestions: 20 });
    expect(loss.delta).toBeLessThan(0);
    expect(loss.nextElo).toBeGreaterThanOrEqual(800);

    const elite = computeEloUpdate({ currentElo: 1820, pct: 95, totalQuestions: 28 });
    expect(elite.rank.label).toBe('Tinh Anh');
  });

  it('computes 3-part GDPT 2025 accuracy breakdown and pace status accurately', () => {
    const exam = {
      duration: 45,
      questions: [
        { part: 1, type: 'single_choice' },
        { part: 1, type: 'single_choice' },
        { part: 2, type: 'true_false', statements: [{}, {}, {}, {}] },
        { part: 3, type: 'short_answer' },
      ],
    };
    const result = {
      timeSpent: 2000, // 500s/q vs target 675s/q -> optimal pace
      detail: [
        { isCorrect: true },
        { isCorrect: false },
        { isCorrect: true },
        { isCorrect: false },
      ],
    };
    const analytics = buildPostExamAnalytics({ exam, result });
    expect(analytics.partBreakdown).toHaveLength(3);
    expect(analytics.partBreakdown[0].pct).toBe(50);
    expect(analytics.partBreakdown[1].pct).toBe(100);
    expect(analytics.partBreakdown[2].pct).toBe(0);
    expect(analytics.paceStatus.tone).toBe('emerald');
  });

  it('aggregates root-cause mistake breakdown sorted by highest frequency', () => {
    const causes = [
      { id: 'all', label: 'Mọi nguyên nhân' },
      { id: 'concept', label: 'Hổng bản chất', color: '#8b5cf6' },
      { id: 'trap', label: 'Bẫy đọc đề', color: '#e11d48' },
    ];
    const items = [
      { id: '1', question: { id: 'q1', content: 'Phát biểu đúng hay sai' } },
      { id: '2', question: { id: 'q2', content: 'Nhận định không đúng' } },
      { id: '3', question: { id: 'q3', content: 'Khái niệm este' } },
    ];
    const breakdown = buildWrongCauseBreakdown(
      items,
      {},
      (q) => (/đúng|nhận định/i.test(q.content) ? 'trap' : 'concept'),
      causes
    );
    expect(breakdown[0].id).toBe('trap');
    expect(breakdown[0].count).toBe(2);
    expect(breakdown[0].pct).toBe(67);
  });

  it('evaluates university admission fit accurately', () => {
    expect(evaluateAdmissionFit(27.5, 26.8)?.status).toBe('safe');
    expect(evaluateAdmissionFit(25.8, 26.8)?.status).toBe('near');
    expect(evaluateAdmissionFit(22.0, 26.8)?.status).toBe('far');
    expect(evaluateAdmissionFit(null, 26.8)).toBeNull();
  });

  it('computes real predicted /30 score and daily 3-step student missions', () => {
    expect(
      computeRealPredictedScore30({
        virtualHistory: [
          { score: 8, totalPoints: 10 },
          { score: 9, totalPoints: 10 },
        ],
      })
    ).toBe(25.5);
    expect(computeRealPredictedScore30({ overviewAvgPct: 80 })).toBe(24);
    expect(computeRealPredictedScore30({})).toBeNull();

    const now = Date.now();
    const missions = buildDailyStudyMissions({
      wrongCount: 6,
      virtualHistory: [{ completedAt: new Date(now).toISOString() }],
      dueTotal: 0,
      cardsDue: 0,
      targetExamType: 'TSA',
      now,
    });
    expect(missions.completedCount).toBe(2);
    expect(missions.tasks[0].done).toBe(true);
    expect(missions.tasks[0].href).toContain('type=TSA');
    expect(missions.tasks[1].done).toBe(false);
    expect(missions.tasks[2].done).toBe(true);
  });

  it('computes Combat Power tiers, earned points, and waiting mistake recovery hooks', () => {
    expect(getCombatPowerTier(950).label).toBe('Tân Binh');
    expect(getCombatPowerTier(1750).label).toBe('Kiếm Sĩ');
    expect(getCombatPowerTier(4800).label).toBe('Huyền Thoại');

    const res = recordCombatPowerOnce({
      uid: 'test-user',
      attemptKey: 'exam-1',
      correctCount: 18,
      wrongCount: 4,
    });
    expect(res.earned).toBe(216);
    expect(res.waitingFromMistakes).toBe(60);
    expect(res.totalPower).toBe(1216);
    expect(res.tier.label).toBe('Học Sĩ');
  });

  it('builds GitHub-style activity heatmap across virtual exams, roadmap sessions, and pomodoro', () => {
    const now = new Date('2026-11-19T12:00:00Z').getTime();
    const todayKey = '2026-11-19';
    const prevKey = '2026-11-18';
    const hm = buildActivityHeatmap365({
      virtualHistory: [{ completedAt: '2026-11-19T08:00:00Z' }],
      roadmapSessions: [{ at: '2026-11-19T09:00:00Z' }, { at: '2026-11-18T10:00:00Z' }],
      pomodoroHistory: { [todayKey]: 4, [prevKey]: 1 },
      days: 14,
      now,
    });
    expect(hm.cells).toHaveLength(14);
    expect(hm.activeDays).toBe(2);
    expect(hm.totalActions).toBe(9);
    const todayCell = hm.cells.find((c) => c.key === todayKey);
    expect(todayCell?.count).toBe(7);
    expect(todayCell?.level).toBe(4);
  });

  it('computes 6-axis Student Ability Radar, AI Study Diagnosis, and Safe Math Evaluator', () => {
    const radar = computeStudentAbilityRadar({
      virtualHistory: [{ pct: 86, timeSpent: 1500, total: 28 }],
      roadmapSessions: [{ at: Date.now() }, { at: Date.now() - 86400000 }],
      pomodoroHistory: { '2026-11-19': 4 },
      streakDays: 8,
      wrongCount: 2,
      elo: 1450,
    });
    expect(radar.axes).toHaveLength(6);
    expect(radar.overall).toBeGreaterThan(60);
    expect(radar.strongest.score).toBeGreaterThanOrEqual(radar.weakest.score);

    const now = Date.now();
    const diag = computeStudyDiagnosis({
      attempts: [
        { pct: 90, t: now - 1000 },
        { pct: 88, t: now - 86400000 },
        { pct: 86, t: now - 2 * 86400000 },
        { pct: 70, t: now - 3 * 86400000 },
        { pct: 68, t: now - 4 * 86400000 },
        { pct: 65, t: now - 5 * 86400000 },
      ],
      streakDays: 6,
      wrongCount: 1,
      now,
    });
    expect(diag.trendDelta).toBeGreaterThan(10);
    expect(diag.trendTone).toBe('emerald');
    expect(diag.forgettingRisk.level).toBe('low');

    expect(evaluateSafeMathExpr('sqrt(2*9.8*5)').ok).toBe(true);
    expect(evaluateSafeMathExpr('sqrt(2*9.8*5)').value).toBeCloseTo(9.899495, 4);
    expect(evaluateSafeMathExpr('24.79 * 0.1').value).toBeCloseTo(2.479, 4);
    expect(evaluateSafeMathExpr('2^10 - 24').value).toBe(1000);
    expect(evaluateSafeMathExpr('10 / 0').ok).toBe(false);
    expect(evaluateSafeMathExpr('alert(1)').ok).toBe(false);
  });

  it('computes Score Distribution Histogram, Topic Breakdown, Reward Shop, and Holland RIASEC Career Matches', () => {
    const histHigh = buildScoreDistributionHistogram(88);
    expect(histHigh.bins).toHaveLength(10);
    expect(histHigh.userBinIdx).toBe(8);
    expect(histHigh.percentile).toBeGreaterThan(80);
    expect(histHigh.bins[8].isUser).toBe(true);

    const topics = buildTopicPerformanceBreakdown([
      { i: 0, status: 'no', q: { topic: 'Este - Lipit' } },
      { i: 1, status: 'ok', q: { topic: 'Este - Lipit' } },
      { i: 2, status: 'ok', q: { topic: 'Pin điện hóa' } },
    ]);
    expect(topics[0].topic).toBe('Este - Lipit');
    expect(topics[0].pct).toBe(50);

    const shop0 = getRewardShopState('shop-test');
    expect(shop0.coins).toBeGreaterThanOrEqual(100);
    const buy = buyOrEquipShopItem('shop-test', 'frame-aurora');
    expect(buy.ok).toBe(true);

    const riasec = computeRiasecCareerMatches({
      riasecScores: { I: 12, R: 10, C: 6, S: 2, E: 1, A: 1 },
      predictedScore30: 27.5,
      cutoffData: [
        { id: 'bka-khmt', uni: 'ĐH Bách Khoa HN', code: 'BKA', group: 'Kỹ thuật - Công nghệ', major: 'KHMT', s2025: 27.4 },
        { id: 'lha-luat', uni: 'ĐH Luật HN', code: 'LHA', group: 'Luật - Ngoại giao', major: 'Luật', s2025: 25.3 },
      ],
    });
    expect(riasec.hollandCode).toBe('I-R-C');
    expect(riasec.matches[0].id).toBe('bka-khmt');
    expect(riasec.matches[0].fitPct).toBeGreaterThan(riasec.matches[1].fitPct);
  });
});
