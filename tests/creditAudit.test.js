import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  CREDIT_TARIFF,
  runWithCredit,
  grantActivationCredits,
} from '../src/lib/creditService.js';
import { supabase } from '../src/lib/supabase.js';
import { executeWithSchemaRetry, localTargetSuggestion, Schemas } from '../src/lib/aiTutorService.js';
import { callModel, setExamAiUserId } from '../src/lib/examAiUtils.js';
import { generatePedagogicalInsights } from '../src/lib/insightAi.js';
import { generateLearningReport } from '../src/lib/learningAnalyticsAi.js';
import { buildLearningAnalytics, resolveRange } from '../src/lib/learningAnalytics.js';

describe('ELEC AI Whole-Repo Credit Audit & Refunds', () => {
  let rpcSpy;
  let fromSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    setExamAiUserId(null);
  });

  afterEach(() => {
    setExamAiUserId(null);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function mockCreditWallet({ balance = 5000, failSpend = false, failRefund = false } = {}) {
    let current = balance;
    const txLog = [];

    fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table) => {
      if (table === 'user_credits') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { user_id: 'u-audit', balance: current, total_earned: balance, total_spent: Math.max(0, balance - current) },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      };
    });

    rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fn, args) => {
      if (fn !== 'add_credits') return { data: null, error: null };
      const delta = Number(args?.p_amount || 0);
      txLog.push({ type: args?.p_type, amount: delta, desc: args?.p_description });
      if (delta < 0 && failSpend) {
        return { data: null, error: { message: 'rpc timeout' } };
      }
      if (delta > 0 && failRefund) {
        return { data: null, error: { message: 'refund error' } };
      }
      current += delta;
      return { data: current, error: null };
    });

    return { getBalance: () => current, txLog };
  }

  it('chặn gọi AI miễn phí qua runWithCredit khi chưa đăng nhập (userId = null)', async () => {
    const taskFn = vi.fn(async () => 'free-ai-output');
    const dispatched = [];
    const origWindow = globalThis.window;
    globalThis.window = {
      dispatchEvent: (ev) => dispatched.push(ev),
      localStorage: { getItem: () => null, setItem: () => {} },
    };

    try {
      await expect(
        runWithCredit({ userId: null, cost: CREDIT_TARIFF.TUTOR_CONTEXT, reason: 'Test guest block' }, taskFn)
      ).rejects.toMatchObject({ code: 'LOGIN_REQUIRED', needLogin: true });
      expect(taskFn).not.toHaveBeenCalled();
      expect(dispatched.some((e) => e.type === 'elec-out-of-credits' && e.detail?.needLogin)).toBe(true);
    } finally {
      globalThis.window = origWindow;
    }
  });

  it('runWithCredit tự động hoàn 100% Credit khi AI lỗi hoặc JSON validate thất bại', async () => {
    const wallet = mockCreditWallet({ balance: 3000 });
    await expect(
      runWithCredit({ userId: 'u-audit', cost: CREDIT_TARIFF.ERROR_ANALYSIS, reason: 'Phân tích lỗi' }, async () => {
        throw new Error('JSON không hợp lệ');
      })
    ).rejects.toThrow('JSON không hợp lệ');

    expect(wallet.getBalance()).toBe(3000);
    expect(wallet.txLog.map((t) => [t.type, t.amount])).toEqual([
      ['ai_text', -1000],
      ['refund', 1000],
    ]);
  });

  it('grantActivationCredits KHÔNG trả ok=true ảo khi RPC lỗi hoặc thiếu userId', async () => {
    const missingRes = await grantActivationCredits(null, 500, 'ELEC');
    expect(missingRes.ok).toBe(false);

    mockCreditWallet({ balance: 1000, failRefund: true });
    const rpcErrRes = await grantActivationCredits('u-audit', 500, 'TEST500');
    expect(rpcErrRes.ok).toBe(false);
    expect(rpcErrRes.added).toBe(0);
  });

  it('aiTutorService.executeWithSchemaRetry hoàn 100% Credit khi cả 2 lần gọi AI đều sai schema và rơi về fallback', async () => {
    const wallet = mockCreditWallet({ balance: 1500 });
    const origFetch = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'not json at all' }] } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    try {
      const res = await executeWithSchemaRetry({
        prompt: 'Gợi ý điểm',
        validator: Schemas.targetSuggestion,
        fallbackFn: () => localTargetSuggestion({ cutoffScore: 25, scale: 30, schoolCode: 'BKA' }),
        userId: 'u-audit',
        reason: 'Test schema refund',
      });
      expect(res.source).toBe('local-fallback');
      expect(res.refunded).toBe(true);
      expect(wallet.getBalance()).toBe(1500);
      expect(wallet.txLog.map((t) => [t.type, t.amount])).toEqual([
        ['ai_text', -100],
        ['refund', 100],
      ]);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('examAiUtils.callModel tôn trọng skipCredit=true để tránh trừ kép & báo CREDIT_SYSTEM_ERROR chuẩn', async () => {
    const wallet = mockCreditWallet({ balance: 2000 });
    setExamAiUserId('u-audit');

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    const out = await callModel({
      system: 'test',
      parts: [{ text: 'hello' }],
      skipCredit: true,
    });
    expect(out).toBe('{"ok":true}');
    expect(wallet.getBalance()).toBe(2000);
    expect(wallet.txLog).toHaveLength(0);

    // System error branch must throw CREDIT_SYSTEM_ERROR instead of false "Hết điểm"
    wallet.txLog.length = 0;
    rpcSpy.mockResolvedValueOnce({ data: null, error: { message: 'db connection reset' } });
    await expect(
      callModel({ system: 'test', parts: [{ text: 'hello' }] })
    ).rejects.toMatchObject({ code: 'CREDIT_SYSTEM_ERROR' });
  });

  it('insightAi & learningAnalyticsAi chỉ trừ 1 lần qua runWithCredit và hoàn 100% khi AI trả dữ liệu sai rơi về fallback', async () => {
    const wallet = mockCreditWallet({ balance: 5000 });
    setExamAiUserId('u-audit');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"incomplete":true}' }] } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    const insight = await generatePedagogicalInsights({
      insightsData: {
        submissionCount: 5,
        avgPct: 60,
        passRate: 60,
        weakestTopics: [{ topic: 'Este', rate: 40 }],
        hardest: [],
        atRisk: [],
      },
      className: '12A',
      subject: 'Hóa học',
      forceRefresh: true,
      useAi: true,
      userId: 'u-audit',
    });
    expect(insight.isAiGenerated).toBe(false);
    expect(wallet.getBalance()).toBe(5000);

    const NOW = new Date('2026-10-20T10:00:00Z').getTime();
    const analytics = buildLearningAnalytics({
      classInfo: { id: 'c1', name: '12A', subject: 'Hóa học', members: [{ id: 's1', name: 'A' }] },
      exams: [{
        id: 'e1',
        classId: 'c1',
        teacherId: 't1',
        title: 'KT1',
        subject: 'Hóa học',
        createdAt: NOW - 86400000,
        opensAt: NOW - 86400000,
        questions: [{ q: 'C1', topic: 'Este', correct: 0 }],
        totalPoints: 1,
      }],
      submissionsMap: {
        e1: [{ studentId: 's1', studentName: 'A', score: 0, totalPoints: 1, submittedAt: NOW - 1000, detail: [{ picked: 1, isCorrect: false }] }],
      },
      teachers: [{ teacherId: 't1', teacherName: 'Thầy B', subject: 'Hóa học' }],
      range: resolveRange('30', { now: NOW }),
      now: NOW,
    });
    const analyticsRes = await generateLearningReport({
      analytics,
      userId: 'u-audit',
    });
    expect(analyticsRes.engine).toBe('rule');
    expect(wallet.getBalance()).toBe(5000);
    // insightAi (-300, +300) + learningAnalytics (-1000, +1000) across retries (skipCredit prevents callModel double-charge!)
    expect(wallet.txLog.map((t) => [t.type, t.amount])).toEqual([
      ['ai_text', -300],
      ['refund', 300],
      ['ai_text', -1000],
      ['refund', 1000],
    ]);
  });

  it('đảm bảo 100% các component AI đã bỏ giá cũ 1-2 credit và bọc trừ Credit chuẩn', () => {
    const read = (rel) => fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');

    const tfc = read('src/components/teacher/TeacherFloatingChat.jsx');
    expect(tfc).not.toMatch(/callCopilotAI\([^;]*,\s*(?:1|2)\s*,/s);

    const ds = read('src/components/DocStudio.jsx');
    expect(ds).not.toMatch(/callAI\([^;]*,\s*uid\s*,\s*(?:1|2)\s*,/s);

    const qb = read('src/components/teacher/QuestionBank.jsx');
    expect(qb).toContain('calcExamGenCreditCost');
    expect(qb).not.toContain("(Number(aiGenCount) || 3) > 5 ? 2 : 1");
    expect(qb).not.toContain('cost = 1');

    const aes = read('src/components/teacher/AutoExamStudio.jsx');
    expect(aes).toContain('runWithCredit');
    expect(aes).toContain('calcExamGenCreditCost');
    expect(aes).toContain('skipCredit: true');

    const diag = read('src/components/ExamAiDiagnostic.jsx');
    expect(diag).toContain('CREDIT_TARIFF.ERROR_ANALYSIS');
    expect(diag).toContain('runWithCredit');

    const cmp = read('src/components/CompareModal.jsx');
    expect(cmp).toContain('runWithCredit');
    expect(cmp).not.toContain('useCredit(');

    const cb = read('src/components/ChalkboardView.jsx');
    expect(cb).toContain('runWithCredit');
  });
});
