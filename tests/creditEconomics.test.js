import { describe, it, expect, vi } from 'vitest';
import {
  CREDIT_PACKAGES,
  CREDIT_TARIFF,
  CREDIT_TARIFF_LIST,
  DB_ALLOWED_SPEND_TYPES,
  calcChatCreditCost,
  calcExamGenCreditCost,
  formatCredits,
  resolveDbCreditType,
  spendCredit,
} from '../src/lib/creditService.js';
import { supabase } from '../src/lib/supabase.js';
import { calcExamCreditCost } from '../src/lib/examAiUtils.js';
import { STREAK_MILESTONES, getStreakMascot } from '../src/components/StreakModal.jsx';

describe('ELEC AI Credit Economy (Chuẩn 1 VNĐ = 1 Credit)', () => {
  it('đồng bộ tuyệt đối thang nạp 1 VNĐ = 1 Credit với các gói PRO/PREMIUM', () => {
    const pro2 = CREDIT_PACKAGES.find((p) => p.amount === 30000);
    const pro3 = CREDIT_PACKAGES.find((p) => p.amount === 60000);
    const premium = CREDIT_PACKAGES.find((p) => p.amount === 100000);
    expect(pro2?.total).toBe(30000);
    expect(pro3?.total).toBe(60000);
    expect(premium?.total).toBe(100000);
    expect(CREDIT_TARIFF.SIGNUP_BONUS).toBe(1000);
  });

  it('tính chính xác chi phí Chat nhanh, DeepThink, Ảnh OCR & Tài liệu', () => {
    expect(calcChatCreditCost()).toBe(100);
    expect(calcChatCreditCost({ imageCount: 1 })).toBe(300);
    expect(calcChatCreditCost({ imageCount: 2 })).toBe(500);
    expect(calcChatCreditCost({ deepThink: true })).toBe(500);
    expect(calcChatCreditCost({ deepThink: true, imageCount: 1 })).toBe(700);
    expect(calcChatCreditCost({ deepThink: false, imageCount: 1, docCount: 1 })).toBe(400);
  });

  it('tính chính xác chi phí tạo đề AI theo số câu (1.000 – 3.000 Credit)', () => {
    expect(calcExamGenCreditCost(10)).toBe(1000);
    expect(calcExamGenCreditCost(20)).toBe(1500);
    expect(calcExamGenCreditCost(40)).toBe(2500);
    expect(calcExamGenCreditCost(50)).toBe(3000);
    expect(calcExamCreditCost(28)).toBe(2500);
  });

  it('bảo vệ biên lợi nhuận: mọi mức trừ >= 100 Credit và hiển thị đầy đủ bảng giá minh bạch', () => {
    expect(CREDIT_TARIFF_LIST.length).toBeGreaterThanOrEqual(7);
    CREDIT_TARIFF_LIST.forEach((item) => {
      expect(item.cost).toBeGreaterThanOrEqual(100);
    });
    expect(formatCredits(30000)).toBe('30.000');
  });

  it('map chặt p_type về danh sách CHECK constraint của Postgres (ai_text | ai_image)', () => {
    const customTypes = [
      undefined,
      null,
      'ai_deep',
      'exam_gen',
      'pdf_scan',
      'career_report',
      'word_copilot',
      'streak_freeze',
      'ai_tutor',
      'ai_hint',
    ];
    for (const actionType of customTypes) {
      const mapped = resolveDbCreditType({ imageCount: 0, actionType });
      expect(DB_ALLOWED_SPEND_TYPES).toContain(mapped);
      expect(mapped).toBe('ai_text');
    }
    expect(resolveDbCreditType({ imageCount: 1, actionType: 'pdf_scan' })).toBe('ai_image');
    expect(resolveDbCreditType({ imageCount: 0, actionType: 'ai_image' })).toBe('ai_image');
  });

  it('không bao giờ bật popup hết credit khi số dư đủ nhưng RPC lỗi hệ thống', async () => {
    const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { user_id: 'u-rich', balance: 99998637, total_earned: 100000000, total_spent: 1363 },
            error: null,
          }),
        }),
      }),
    });
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: null,
      error: { message: 'transient network timeout' },
    });

    const dispatched = [];
    const origWindow = globalThis.window;
    globalThis.window = {
      dispatchEvent: (ev) => dispatched.push(ev.type),
      localStorage: { getItem: () => null, setItem: () => {} },
    };

    try {
      const res = await spendCredit('u-rich', 0, null, { deepThink: true });
      expect(res.ok).toBe(false);
      expect(res.isSystemError).toBe(true);
      expect(res.balance).toBe(99998637);
      expect(rpcSpy).toHaveBeenCalledWith(
        'add_credits',
        expect.objectContaining({ p_type: 'ai_text', p_amount: -500 })
      );
      expect(dispatched).not.toContain('elec-out-of-credits');
    } finally {
      globalThis.window = origWindow;
      fromSpy.mockRestore();
      rpcSpy.mockRestore();
    }
  });

  it('đồng bộ mốc thưởng chuỗi học & linh vật ELEC theo thang Credit 2.0', () => {
    expect(CREDIT_TARIFF.STREAK_FREEZE).toBe(500);
    expect(STREAK_MILESTONES.map((m) => m.days)).toEqual([3, 7, 14, 30]);
    expect(STREAK_MILESTONES.map((m) => m.credits)).toEqual([300, 700, 1000, 2000]);

    expect(getStreakMascot(0, false).src).toBe('/img/elec/elec-plead.png');
    expect(getStreakMascot(2, true).src).toBe('/img/elec/elec-fighting.png');
    expect(getStreakMascot(10, true).src).toBe('/img/elec/elec-super-saiyan.png');
  });
});
