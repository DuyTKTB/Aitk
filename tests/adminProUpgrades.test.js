import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  toVietnamDateKey,
  bucketAttemptsByVietnamDay,
  computeSaasRevenueMetrics,
  summarizeCreditLedger,
  preserveRemainingDaysForSwitch,
} from '../src/lib/adminAnalyticsEngine.js';
import { normalizeAuditEntry, AUDIT_ACTION_META } from '../src/lib/adminAuditService.js';
import {
  ANNOUNCEMENT_THEMES,
  ANNOUNCEMENT_PRESETS,
  ANNOUNCEMENT_MASCOT_IMAGES,
  resolveAnnouncementTheme,
  matchesAnnouncementAudience,
  isWithinAnnouncementSchedule,
  formatCountdownLabel,
  evaluateAnnouncementVisibility,
  getAnnouncementDismissKey,
  sanitizeAnnouncementImage,
} from '../src/lib/announcementEngine.js';

describe('Admin SaaS Control Plane & Audit Log Upgrades', () => {
  it('1. bucketAttemptsByVietnamDay gom nhóm chuẩn múi giờ Việt Nam (UTC+7)', () => {
    // 2026-11-23T20:30:00Z tương đương 03:30 ngày 24/11/2026 giờ VN
    const nowMs = new Date('2026-11-24T05:00:00Z').getTime(); // 12:00 trưa 24/11 giờ VN
    expect(toVietnamDateKey('2026-11-23T20:30:00Z')).toBe('2026-11-24');

    const attempts = [
      { started_at: '2026-11-23T20:30:00Z' }, // 24/11 VN
      { started_at: '2026-11-24T01:00:00Z' }, // 24/11 VN
      { started_at: '2026-11-23T08:00:00Z' }, // 23/11 VN
    ];
    const buckets = bucketAttemptsByVietnamDay(attempts, 7, nowMs, 'started_at');
    expect(buckets).toHaveLength(7);
    const today = buckets[buckets.length - 1];
    const yesterday = buckets[buckets.length - 2];
    expect(today.key).toBe('2026-11-24');
    expect(today.count).toBe(2);
    expect(yesterday.key).toBe('2026-11-23');
    expect(yesterday.count).toBe(1);
  });

  it('2. computeSaasRevenueMetrics tính chính xác ARR/MRR, GV PRO vs HS VIP và gói sắp hết hạn', () => {
    const nowMs = new Date('2026-11-24T00:00:00Z').getTime();
    const day = 86400000;
    const proUsers = [
      { user_id: 't1', key_code: 'PRO-1', expiry: new Date(nowMs + 200 * day).toISOString(), note: '' },
      { user_id: 't2', key_code: 'PRO-2', expiry: new Date(nowMs + 4 * day).toISOString(), note: '' }, // sắp hết hạn
      { user_id: 's1', key_code: 'VIP-1', expiry: new Date(nowMs + 90 * day).toISOString(), note: '[STUDENT_VIP]' },
      { user_id: 's2', key_code: 'VIP-2', expiry: new Date(nowMs - 5 * day).toISOString(), note: '[STUDENT_VIP]' }, // hết hạn
    ];

    const m = computeSaasRevenueMetrics(proUsers, { teacherPrice: 999000, studentPrice: 299000, nowMs });
    expect(m.teacherActive).toBe(2);
    expect(m.studentActive).toBe(1);
    expect(m.activeTotal).toBe(3);
    expect(m.expiredCount).toBe(1);
    expect(m.expiringSoonCount).toBe(1);
    expect(m.arrVnd).toBe(2 * 999000 + 299000);
    expect(m.mrrVnd).toBe(Math.round(m.arrVnd / 12));
    expect(m.renewalAtRiskVnd).toBe(999000);
    expect(m.retentionRate).toBe(75);
  });

  it('3. summarizeCreditLedger tổng hợp đúng nạp tiền, đốt AI, hoàn tiền và top người tiêu thụ', () => {
    const nowMs = new Date('2026-11-24T05:00:00Z').getTime();
    const txs = [
      { user_id: 'u1', type: 'purchase', amount: 100000, created_at: '2026-11-24T01:00:00Z' },
      { user_id: 'u1', type: 'ai_text', amount: -1000, created_at: '2026-11-24T02:00:00Z' },
      { user_id: 'u1', type: 'ai_image', amount: -500, created_at: '2026-11-24T03:00:00Z' },
      { user_id: 'u2', type: 'ai_text', amount: -2500, created_at: '2026-11-23T10:00:00Z' },
      { user_id: 'u2', type: 'refund', amount: 1000, created_at: '2026-11-23T10:05:00Z' },
    ];
    const sum = summarizeCreditLedger(txs, nowMs);
    expect(sum.totalPurchaseVnd).toBe(100000);
    expect(sum.totalInflow).toBe(101000);
    expect(sum.totalAiBurn).toBe(4000);
    expect(sum.totalRefund).toBe(1000);
    expect(sum.topSpenders[0]).toEqual({ userId: 'u2', spent: 2500 });
    expect(sum.dailyBurn).toHaveLength(7);
  });

  it('4. preserveRemainingDaysForSwitch bảo toàn số ngày còn lại khi đổi gói PRO ↔ VIP', () => {
    expect(preserveRemainingDaysForSwitch(285, 30)).toBe(285);
    expect(preserveRemainingDaysForSwitch(0, 30)).toBe(30);
    expect(preserveRemainingDaysForSwitch(-10, 30)).toBe(30);
  });

  it('5. Audit Log chuẩn hóa bản ghi & firestore.rules khóa bất biến admin_audit_logs', () => {
    const entry = normalizeAuditEntry({
      actorUid: 'admin-1',
      actorEmail: 'admin@elec.ai',
      action: 'adjust_credits',
      target: 'u-99',
      summary: '+500 Credit AI cho học sinh',
    });
    expect(entry.id.startsWith('AUD-')).toBe(true);
    expect(AUDIT_ACTION_META[entry.action]?.label).toBe('Điều chỉnh Credit');

    const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
    expect(rules).toContain('match /admin_audit_logs/{logId}');
    expect(rules).toContain('isValidAdminAuditCreate()');
    expect(rules).toContain('allow update, delete: if false;');
  });

  it('6. announcementEngine phân nhóm đối tượng, lịch phát sóng, đếm ngược và reset phiên bản chuẩn xác', () => {
    expect(Object.keys(ANNOUNCEMENT_THEMES).length).toBe(6);
    expect(ANNOUNCEMENT_PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(resolveAnnouncementTheme('aurora').id).toBe('aurora');
    expect(resolveAnnouncementTheme('unknown').id).toBe('cobalt');

    // Đối tượng nhận thông báo
    expect(matchesAnnouncementAudience('teachers', { role: 'teacher', isVip: false })).toBe(true);
    expect(matchesAnnouncementAudience('teachers', { role: 'student', isVip: true })).toBe(false);
    expect(matchesAnnouncementAudience('free', { role: 'student', isVip: false })).toBe(true);
    expect(matchesAnnouncementAudience('free', { role: 'student', isVip: true })).toBe(false);
    expect(matchesAnnouncementAudience('vip', { role: 'student', isVip: true })).toBe(true);
    expect(matchesAnnouncementAudience('teachers', { role: 'student', isAdmin: true })).toBe(true);

    // Lịch phát sóng + đồng hồ đếm ngược
    const now = new Date('2026-11-24T10:00:00Z').getTime();
    expect(isWithinAnnouncementSchedule({ startAt: '2026-11-24T12:00:00Z' }, now).reason).toBe('scheduled');
    expect(isWithinAnnouncementSchedule({ endAt: '2026-11-24T09:00:00Z' }, now).reason).toBe('expired');
    const live = isWithinAnnouncementSchedule({ startAt: '2026-11-24T09:00:00Z', endAt: '2026-11-25T11:30:05Z' }, now);
    expect(live.active).toBe(true);
    expect(formatCountdownLabel(live.remainingMs)).toBe('1 ngày 01:30:05');

    // Quyết định tổng hợp & khóa phiên bản phát lại
    const vis = evaluateAnnouncementVisibility(
      { announcementEnabled: true, announcementText: 'Ưu đãi VIP', announcementAudience: 'free', announcementEndAt: '2026-11-25T10:00:00Z' },
      { role: 'student', isVip: false },
      now
    );
    expect(vis.visible).toBe(true);
    expect(getAnnouncementDismissKey({ announcementText: 'Ưu đãi VIP', announcementVersion: 2 })).toContain('v2::banner::Ưu đãi VIP');

    // Kiểm tra làm sạch nguồn ảnh (chặn XSS javascript: & chấp nhận ảnh hợp lệ)
    expect(ANNOUNCEMENT_MASCOT_IMAGES.length).toBeGreaterThanOrEqual(6);
    expect(sanitizeAnnouncementImage('/img/elec/elec-celebrate.png')).toBe('/img/elec/elec-celebrate.png');
    expect(sanitizeAnnouncementImage('https://cdn.example.com/banner.webp')).toBe('https://cdn.example.com/banner.webp');
    expect(sanitizeAnnouncementImage('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(sanitizeAnnouncementImage('javascript:alert(1)')).toBe('');

    // Poster ảnh thuần không cần nhập text vẫn hiển thị hợp lệ và có dismissKey riêng
    const posterVis = evaluateAnnouncementVisibility(
      { announcementEnabled: true, announcementDisplay: 'poster', announcementText: '', announcementImage: '/img/elec/achievement-coupon-template.png' },
      { role: 'student', isVip: false },
      now
    );
    expect(posterVis.visible).toBe(true);
    expect(getAnnouncementDismissKey({ announcementText: '', announcementImage: '/img/elec/achievement-coupon-template.png', announcementVersion: 3 })).toContain('v3::');
  });
});
