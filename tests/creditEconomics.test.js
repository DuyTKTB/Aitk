import { describe, it, expect, vi } from 'vitest';
import {
  CREDIT_PACKAGES,
  CREDIT_TARIFF,
  CREDIT_TARIFF_LIST,
  DB_ALLOWED_SPEND_TYPES,
  MIN_CREDIT_TOPUP_VND,
  calcChatCreditCost,
  calcExamGenCreditCost,
  createPaymentOrder,
  formatCredits,
  resolveCreditOrderAmount,
  resolveDbCreditType,
  spendCredit,
} from '../src/lib/creditService.js';
import { supabase } from '../src/lib/supabase.js';
import { calcExamCreditCost } from '../src/lib/examAiUtils.js';
import { STREAK_MILESTONES, getStreakMascot } from '../src/components/StreakModal.jsx';

describe('ELEC AI Credit Economy (Chuẩn 1 VNĐ = 1 Credit)', () => {
  it('đồng bộ tuyệt đối thang nạp 1 VNĐ = 1 Credit và cho phép nạp từ 10.000đ trở lên', () => {
    expect(MIN_CREDIT_TOPUP_VND).toBe(10000);
    const pro1 = CREDIT_PACKAGES.find((p) => p.amount === 10000);
    const pro2 = CREDIT_PACKAGES.find((p) => p.amount === 30000);
    const pro3 = CREDIT_PACKAGES.find((p) => p.amount === 60000);
    const premium = CREDIT_PACKAGES.find((p) => p.amount === 100000);
    expect(pro1?.total).toBe(10000);
    expect(pro2?.total).toBe(30000);
    expect(pro3?.total).toBe(60000);
    expect(premium?.total).toBe(100000);
    expect(CREDIT_TARIFF.SIGNUP_BONUS).toBe(1000);

    // Chặn dưới 10k, cho phép mọi mức từ 10k trở lên
    expect(resolveCreditOrderAmount(0).ok).toBe(false);
    expect(resolveCreditOrderAmount(9999).ok).toBe(false);
    expect(resolveCreditOrderAmount('abc').ok).toBe(false);
    expect(resolveCreditOrderAmount(10000)).toMatchObject({ ok: true, amount: 10000, total: 10000 });
    expect(resolveCreditOrderAmount(15000)).toMatchObject({ ok: true, amount: 15000, total: 15000 });
    expect(resolveCreditOrderAmount(250000)).toMatchObject({ ok: true, amount: 250000, total: 250000 });
    expect(resolveCreditOrderAmount(200000)).toMatchObject({ ok: true, amount: 200000, total: 220000 });
  });

  it('createPaymentOrder chấp nhận đơn nạp từ 10.000đ trở lên (gồm số tiền tùy chọn) và từ chối dưới 10.000đ', async () => {
    await expect(createPaymentOrder('u-topup', 5000)).rejects.toThrow(/10\.000/);

    const insertSpy = vi.fn((row) => ({
      select: () => ({
        single: async () => ({ data: { id: 'ord-1', ...row }, error: null }),
      }),
    }));
    const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ insert: insertSpy });

    try {
      const res10k = await createPaymentOrder('u-topup', 10000);
      expect(res10k.amount).toBe(10000);
      expect(res10k.credits).toBe(10000);
      expect(res10k.qrUrl).toContain('amount=10000');

      const resCustom = await createPaymentOrder('u-topup', 15000);
      expect(resCustom.amount).toBe(15000);
      expect(resCustom.credits).toBe(15000);
      expect(resCustom.qrUrl).toContain('amount=15000');
    } finally {
      fromSpy.mockRestore();
    }
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
