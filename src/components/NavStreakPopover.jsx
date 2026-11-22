/* ============================================================
   NavStreakPopover.jsx — POPOVER CHUỖI NGÀY HỌC VIP TRÊN NAVBAR
   ------------------------------------------------------------
   Đồng bộ 100% với NavCreditPopover & StreakModal:
     • Hero Solar-Flame + Linh vật ELEC theo trạng thái chuỗi hôm nay
     • Lịch 7 ngày trong tuần trực quan (T2 → CN)
     • Khiên Đóng Băng giữ chuỗi + Mua nhanh bằng Credit 2.0 (500 Credit)
     • Thanh tiến độ mốc thưởng tiếp theo + Nút mở full StreakModal
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import {
  CREDIT_TARIFF,
  formatCredits,
  getCredits,
  spendCredit,
} from '../lib/creditService.js';
import {
  FREEZE_KEY,
  STREAK_MILESTONES,
  SvgFlame,
  getStreakMascot,
  getWeekStreakCells,
  readClaimedMilestones,
  readFreezeCount,
} from './StreakModal.jsx';
import '../styles/nav-credit-popover.css';

const SvgShield = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SvgTrophy = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default function NavStreakPopover({ userId, streakCount = 0, hasStreakToday = false }) {
  const [open, setOpen] = useState(false);
  const [freezeCount, setFreezeCount] = useState(readFreezeCount);
  const [claimedList, setClaimedList] = useState(readClaimedMilestones);
  const [buyingFreeze, setBuyingFreeze] = useState(false);
  const [notice, setNotice] = useState(null);
  const wrapRef = useRef(null);

  const freezeCost = CREDIT_TARIFF.STREAK_FREEZE;

  useEffect(() => {
    const onCloseOthers = (e) => {
      if (e?.detail?.except !== 'streak') setOpen(false);
    };
    const onSync = () => {
      setFreezeCount(readFreezeCount());
      setClaimedList(readClaimedMilestones());
    };
    window.addEventListener('elec-close-nav-dropdowns', onCloseOthers);
    window.addEventListener('cs-streak-ui-sync', onSync);
    return () => {
      window.removeEventListener('elec-close-nav-dropdowns', onCloseOthers);
      window.removeEventListener('cs-streak-ui-sync', onSync);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setNotice(null);
    setFreezeCount(readFreezeCount());
    setClaimedList(readClaimedMilestones());
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        try {
          window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns', { detail: { except: 'streak' } }));
        } catch { /* ignore */ }
      }
      return next;
    });
  };

  const handleQuickBuyFreeze = async () => {
    if (buyingFreeze) return;
    if (!userId) {
      setNotice({ ok: false, text: `Đăng nhập để mua Khiên giữ chuỗi (${formatCredits(freezeCost)} Credit).` });
      return;
    }
    setBuyingFreeze(true);
    setNotice(null);
    try {
      const cr = await getCredits(userId);
      if ((Number(cr?.balance) || 0) < freezeCost) {
        setNotice({ ok: false, text: `Cần ${formatCredits(freezeCost)} ELEC Credit để mua thêm khiên.` });
        return;
      }
      const spent = await spendCredit(userId, 0, freezeCost, { actionType: 'streak_freeze', reason: 'Mua Khiên giữ chuỗi' });
      if (!spent?.ok) {
        setNotice({ ok: false, text: spent?.error || `Không đủ ${formatCredits(freezeCost)} Credit.` });
        return;
      }
      const next = freezeCount + 1;
      setFreezeCount(next);
      try {
        localStorage.setItem(FREEZE_KEY, String(next));
        window.dispatchEvent(new CustomEvent('cs-streak-ui-sync'));
      } catch { /* ignore */ }
      setNotice({ ok: true, text: `Đã trang bị +1 Khiên Đóng Băng (-${formatCredits(freezeCost)} Credit)!` });
    } catch {
      setNotice({ ok: false, text: 'Lỗi kết nối ví Credit, vui lòng thử lại.' });
    } finally {
      setBuyingFreeze(false);
    }
  };

  const openFullModal = () => {
    setOpen(false);
    try {
      window.dispatchEvent(new CustomEvent('elec-open-streak-modal'));
    } catch { /* ignore */ }
  };

  const weekCells = getWeekStreakCells(streakCount);
  const mascot = getStreakMascot(streakCount, hasStreakToday);

  // Tìm mốc thưởng chưa nhận gần nhất
  const nextMilestone =
    STREAK_MILESTONES.find((m) => !claimedList.includes(m.days)) ||
    STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const progressPct = Math.min(100, Math.round((streakCount / nextMilestone.days) * 100));
  const claimableCount = STREAK_MILESTONES.filter(
    (m) => streakCount >= m.days && !claimedList.includes(m.days)
  ).length;

  return (
    <div className="elec-sp-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`ns9-nav-streak-pill ${hasStreakToday ? 'is-active' : 'is-idle'} ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={
          hasStreakToday
            ? `Chuỗi ${streakCount} ngày (Đã giữ chuỗi hôm nay) — Bấm xem Bảo vệ chuỗi & Nhận thưởng`
            : `Chuỗi ${streakCount} ngày (Chưa học hôm nay) — Bấm xem Bảo vệ chuỗi & Nhận thưởng`
        }
        onClick={toggleOpen}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={hasStreakToday ? '#ea580c' : '#f97316'}
          style={{ opacity: hasStreakToday ? 1 : 0.75, pointerEvents: 'none' }}
          className={`ns9-streak-svg anim-ico-svg anim-ico-flame ${hasStreakToday ? 'active' : 'idle'}`}
          aria-hidden="true"
        >
          <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
        </svg>
        <span style={{ pointerEvents: 'none' }}>{streakCount}</span>
      </button>

      {open && (
        <div className="elec-sp-popover" role="dialog" aria-label="Chuỗi ngày học ELEC AI">
          {/* HERO SOLAR-FLAME + LINH VẬT ELEC */}
          <div className="elec-sp-hero">
            <div className="elec-sp-hero-main">
              <div className="elec-sp-mascot-ring">
                <img
                  src={mascot.src}
                  alt={mascot.alt}
                  className="elec-sp-mascot"
                  width="60"
                  height="60"
                />
              </div>

              <div className="elec-sp-hero-info">
                <div className="elec-sp-kicker-row">
                  <span className="elec-sp-kicker">CHUỖI HỌC TẬP ELEC</span>
                  <span className={`elec-sp-state-pill ${hasStreakToday ? 'is-done' : 'is-todo'}`}>
                    {hasStreakToday ? 'Đã điểm danh' : 'Chưa học hôm nay'}
                  </span>
                </div>

                <div className="elec-sp-count-row">
                  <strong>{streakCount}</strong>
                  <span>ngày liên tiếp</span>
                </div>

                <p className="elec-sp-subtitle">
                  {hasStreakToday
                    ? 'Phong độ đỉnh cao! Quay lại ngày mai để nhân chuỗi thưởng nhé.'
                    : 'Làm 1 bài luyện hoặc 5 câu hỏi hôm nay để giữ ngọn lửa cháy sáng!'}
                </p>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="elec-sp-body">
            {/* Lịch 7 ngày trong tuần */}
            <div className="elec-sp-week">
              {weekCells.map(({ dayLabel, isToday, isDone }) => (
                <div
                  key={dayLabel}
                  className={`elec-sp-day ${isToday ? 'is-today' : ''} ${isDone ? 'is-done' : ''}`}
                >
                  <span>{dayLabel}</span>
                  <div className="elec-sp-day-dot">
                    <SvgFlame size={17} active={isDone} />
                  </div>
                </div>
              ))}
            </div>

            {notice && (
              <div className={`elec-sp-notice ${notice.ok ? 'is-ok' : 'is-err'}`}>
                {notice.text}
              </div>
            )}

            {/* Khiên Đóng Băng giữ chuỗi */}
            <div className="elec-sp-shield-card">
              <div className="elec-sp-shield-left">
                <div className="elec-sp-shield-ico">
                  <SvgShield size={17} />
                </div>
                <div>
                  <b>Khiên Đóng Băng ({freezeCount} khiên)</b>
                  <small>Tự động cứu chuỗi nếu quên học 1 ngày</small>
                </div>
              </div>
              <button
                type="button"
                className="elec-sp-shield-btn"
                onClick={handleQuickBuyFreeze}
                disabled={buyingFreeze}
              >
                {buyingFreeze ? 'Đang mua…' : `+ Mua (${formatCredits(freezeCost)})`}
              </button>
            </div>

            {/* Mốc thưởng tiếp theo */}
            <div className="elec-sp-milestone-box">
              <div className="elec-sp-ms-head">
                <b>Mốc {nextMilestone.days} ngày · {nextMilestone.reward}</b>
                <span>{Math.min(streakCount, nextMilestone.days)}/{nextMilestone.days}N</span>
              </div>
              <div className="elec-sp-progress-track">
                <div className="elec-sp-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="elec-sp-ms-foot">
                <span>
                  {claimableCount > 0
                    ? `Bạn có ${claimableCount} phần thưởng mốc sẵn sàng nhận!`
                    : `Còn ${Math.max(0, nextMilestone.days - streakCount)} ngày nữa để mở khóa`}
                </span>
                <b>{progressPct}%</b>
              </div>
            </div>

            {/* CTA mở bảng đầy đủ */}
            <button type="button" className="elec-sp-cta" onClick={openFullModal}>
              <SvgTrophy size={14} />
              <span>
                {claimableCount > 0
                  ? `Nhận ${claimableCount} quà mốc chuỗi ngay`
                  : 'Xem toàn bộ mốc thưởng & bảo vệ chuỗi →'}
              </span>
            </button>
            <div className="elec-pop-copy">© 2026 ELEC Science AI · Nguyễn Thế Duy (Duy TK)</div>
          </div>
        </div>
      )}
    </div>
  );
}
