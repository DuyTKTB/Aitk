import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveStreak, getStreakData } from '../hooks.js';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  getCredits,
  spendCredit,
  grantActivationCredits,
  CREDIT_TARIFF,
  formatCredits,
} from '../lib/creditService.js';
import '../styles/streak-modal.css';

/* ============================================================
   StreakModal.jsx — BẢO VỆ CHUỖI STREAK & THƯỞNG MỐC NGÀY (VIP MASCOT)
   100% Thuần SVG + Linh vật ELEC AI — Chuẩn Credit 2.0 (1 VNĐ = 1 Credit)
   ============================================================ */

export const FREEZE_KEY = 'cs-streak-freeze-count';
export const CLAIMED_KEY = 'cs-streak-claimed-milestones';

export const STREAK_MILESTONES = [
  { days: 3,  label: '+300 ELEC Credit thưởng kiên trì',            reward: '300 ELEC Credit',             credits: 300 },
  { days: 7,  label: '+700 ELEC Credit & Huy hiệu Lửa Kiên Trì',    reward: '700 Credit & Huy hiệu',       credits: 700 },
  { days: 14, label: '+1.000 Credit & mở khóa 1 đề thi PRO miễn phí', reward: '1.000 Credit + 1 Đề PRO',  credits: 1000, passTier: 'PRO' },
  { days: 30, label: '+2.000 Credit & mở khóa 1 đề thi VIP Độc Quyền', reward: '2.000 Credit + 1 Đề VIP', credits: 2000, passTier: 'VIP' },
];

export function readFreezeCount() {
  try {
    const saved = localStorage.getItem(FREEZE_KEY);
    if (saved !== null) return Math.max(0, Number(saved));
    localStorage.setItem(FREEZE_KEY, '1');
    return 1;
  } catch {
    return 1;
  }
}

export function readClaimedMilestones() {
  try {
    const arr = JSON.parse(localStorage.getItem(CLAIMED_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function getWeekStreakCells(streakDays) {
  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const nowDate = new Date();
  const todayIndex = (nowDate.getDay() + 6) % 7;
  const todayMidnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const streakInfo = getStreakData();
  const lastParts = String(streakInfo?.last || '').split('-').map(Number);
  const lastStudyMs = lastParts.length === 3 && lastParts.every(Number.isFinite)
    ? new Date(lastParts[0], lastParts[1] - 1, lastParts[2]).getTime()
    : NaN;

  return daysOfWeek.map((dayLabel, idx) => {
    const isToday = idx === todayIndex;
    const dayMs = todayMidnight + (idx - todayIndex) * 864e5;
    const diffFromLast = Number.isFinite(lastStudyMs)
      ? Math.round((lastStudyMs - dayMs) / 864e5)
      : -1;
    const isDone = streakDays > 0 && diffFromLast >= 0 && diffFromLast < streakDays;
    return { dayLabel, isToday, isDone };
  });
}

export function getStreakMascot(streakDays, hasStreakToday) {
  if (hasStreakToday && streakDays >= 7) {
    return {
      src: '/img/elec/elec-super-saiyan.png',
      alt: 'Linh vật ELEC siêu năng lượng',
      badge: 'SIÊU CHUỖI ĐANG CHÁY',
    };
  }
  if (hasStreakToday) {
    return {
      src: '/img/elec/elec-fighting.png',
      alt: 'Linh vật ELEC giữ vững chuỗi học',
      badge: 'ĐÃ GIỮ CHUỖI HÔM NAY',
    };
  }
  return {
    src: '/img/elec/elec-plead.png',
    alt: 'Linh vật ELEC nhắc học giữ chuỗi',
    badge: 'CHƯA HỌC HÔM NAY',
  };
}

/* ── Icon SVG sắc nét ── */
export const SvgFlame = ({ size = 24, active = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? '#f97316' : '#94a3b8'} stroke={active ? '#ea580c' : 'none'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
  </svg>
);

const SvgShield = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SvgCheck = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgClose = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgGift = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const SvgTrophy = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default function StreakModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const [isOpen, setIsOpen] = useState(Boolean(propIsOpen ?? false));
  const { user } = useAuth();
  const uid = user?.uid || user?.id || 'guest';
  const { count: streakDays, isToday: hasStreakToday } = useLiveStreak();

  const [freezeCount, setFreezeCount] = useState(readFreezeCount);
  const [claimedList, setClaimedList] = useState(readClaimedMilestones);
  const [noticeMsg, setNoticeMsg] = useState(null);
  const [buyingFreeze, setBuyingFreeze] = useState(false);

  const freezeCost = CREDIT_TARIFF.STREAK_FREEZE;

  useEffect(() => {
    if (propIsOpen !== undefined) setIsOpen(Boolean(propIsOpen));
  }, [propIsOpen]);

  useEffect(() => {
    const handleOpen = () => {
      setFreezeCount(readFreezeCount());
      setClaimedList(readClaimedMilestones());
      setNoticeMsg(null);
      setIsOpen(true);
    };
    const handleClose = () => {
      setIsOpen(false);
      propOnClose?.();
    };
    const handleSync = () => {
      setFreezeCount(readFreezeCount());
      setClaimedList(readClaimedMilestones());
    };
    window.addEventListener('elec-open-streak-modal', handleOpen);
    window.addEventListener('elec-close-streak-modal', handleClose);
    window.addEventListener('cs-streak-ui-sync', handleSync);
    return () => {
      window.removeEventListener('elec-open-streak-modal', handleOpen);
      window.removeEventListener('elec-close-streak-modal', handleClose);
      window.removeEventListener('cs-streak-ui-sync', handleSync);
    };
  }, [propOnClose]);

  const handleCloseModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
    propOnClose?.();
    window.dispatchEvent(new CustomEvent('elec-close-streak-modal'));
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseModal(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleBuyFreeze = async () => {
    if (buyingFreeze) return;
    if (!uid || uid === 'guest') {
      setNoticeMsg({ ok: false, text: `Vui lòng đăng nhập để dùng ${formatCredits(freezeCost)} Credit mua Khiên Đóng Băng.` });
      return;
    }
    setBuyingFreeze(true);
    try {
      const cr = await getCredits(uid);
      if ((Number(cr?.balance) || 0) < freezeCost) {
        setNoticeMsg({ ok: false, text: `Bạn cần tối thiểu ${formatCredits(freezeCost)} ELEC Credit để trang bị thêm Khiên Đóng Băng.` });
        return;
      }
      const spent = await spendCredit(uid, 0, freezeCost, { actionType: 'streak_freeze', reason: 'Mua Khiên giữ chuỗi' });
      if (!spent?.ok) {
        setNoticeMsg({
          ok: false,
          text: spent?.isSystemError
            ? `Lỗi kết nối ví Credit tạm thời: ${spent.error || 'vui lòng thử lại'}`
            : `Không đủ ${formatCredits(freezeCost)} ELEC Credit để trang bị Khiên Đóng Băng.`,
        });
        return;
      }
      const nextCount = freezeCount + 1;
      setFreezeCount(nextCount);
      localStorage.setItem(FREEZE_KEY, String(nextCount));
      window.dispatchEvent(new CustomEvent('cs-streak-ui-sync'));
      setNoticeMsg({
        ok: true,
        text: `Trang bị Khiên Đóng Băng thành công (-${formatCredits(freezeCost)} Credit)! Chuỗi học của bạn đã được bảo vệ.`,
      });
    } catch {
      setNoticeMsg({ ok: false, text: 'Không thể kết nối ví Credit lúc này. Vui lòng thử lại sau.' });
    } finally {
      setBuyingFreeze(false);
    }
  };

  const handleClaimMilestone = async (milestoneDays, rewardLabel, rewardCredits = 0, passTier = null) => {
    if (streakDays < milestoneDays || claimedList.includes(milestoneDays)) return;
    if (!uid || uid === 'guest') {
      setNoticeMsg({ ok: false, text: 'Vui lòng đăng nhập để nhận thưởng cột mốc vào tài khoản.' });
      return;
    }

    if (rewardCredits > 0) {
      await grantActivationCredits(uid, rewardCredits, `STREAK_${milestoneDays}`).catch(() => {});
    }
    if (passTier) {
      try {
        const passes = JSON.parse(localStorage.getItem('cs-streak-passes') || '{}');
        passes[passTier] = (Number(passes[passTier]) || 0) + 1;
        localStorage.setItem('cs-streak-passes', JSON.stringify(passes));
      } catch { /* ignore */ }
    }

    const next = [...claimedList, milestoneDays];
    setClaimedList(next);
    try {
      localStorage.setItem(CLAIMED_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('cs-streak-ui-sync'));
    } catch { /* ignore */ }
    setNoticeMsg({ ok: true, text: `Chúc mừng bạn đã nhận thưởng cột mốc ${milestoneDays} ngày: ${rewardLabel}!` });
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const weekCells = getWeekStreakCells(streakDays);
  const mascot = getStreakMascot(streakDays, hasStreakToday);

  const modalNode = (
    <div
      className="sm-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal(e);
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sm-modal-title"
    >
      <div className="sm-card" onClick={(e) => e.stopPropagation()}>
        {/* HERO SOLAR-FLAME + LINH VẬT ELEC */}
        <div className="sm-hero">
          <button
            type="button"
            className="sm-close"
            onClick={handleCloseModal}
            aria-label="Đóng bảng chuỗi học tập"
          >
            <SvgClose size={17} />
          </button>

          <div className="sm-hero-top">
            <div className="sm-mascot-stage">
              <div className="sm-mascot-halo" aria-hidden="true" />
              <img
                src={mascot.src}
                alt={mascot.alt}
                className="sm-mascot-img"
                width="86"
                height="86"
              />
            </div>

            <div className="sm-hero-copy">
              <span className="sm-kicker">
                <SvgFlame size={12} active />
                {mascot.badge}
              </span>
              <h2 id="sm-modal-title" className="sm-title">
                Chuỗi {streakDays} Ngày Liên Tiếp
              </h2>
              <p className="sm-desc">
                {hasStreakToday
                  ? 'Tuyệt vời! Bạn đã thắp sáng ngọn lửa học tập hôm nay. Hẹn gặp lại ngày mai nhé!'
                  : 'Bạn chưa học hôm nay. Hoàn thành 1 bài luyện hoặc 5 câu hỏi để giữ chuỗi không bị tắt!'}
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="sm-body">
          {noticeMsg && (
            <div className={`sm-notice ${noticeMsg.ok ? 'is-ok' : 'is-err'}`}>
              {noticeMsg.text}
            </div>
          )}

          {/* Lịch 7 ngày trong tuần */}
          <div className="sm-week">
            {weekCells.map(({ dayLabel, isToday, isDone }) => (
              <div
                key={dayLabel}
                className={`sm-day ${isToday ? 'is-today' : ''} ${isDone ? 'is-done' : ''}`}
              >
                <span className="sm-day-lbl">{dayLabel}</span>
                <div className="sm-day-circle">
                  <SvgFlame size={19} active={isDone} />
                </div>
              </div>
            ))}
          </div>

          {/* Khiên Đóng Băng Bảo Vệ Chuỗi */}
          <div className="sm-freeze-card">
            <div className="sm-freeze-left">
              <div className="sm-freeze-ico">
                <SvgShield size={21} color="#ffffff" />
              </div>
              <div>
                <strong>Khiên Đóng Băng Chuỗi ({freezeCount} khiên)</strong>
                <span>Tự động bảo vệ chuỗi khi bạn bận quên học 1 ngày</span>
              </div>
            </div>
            <button
              type="button"
              className="sm-freeze-btn"
              onClick={handleBuyFreeze}
              disabled={buyingFreeze}
            >
              {buyingFreeze ? 'Đang mua…' : `+ Mua (${formatCredits(freezeCost)})`}
            </button>
          </div>

          {/* Cột mốc nhận thưởng */}
          <div>
            <div className="sm-section-head">
              <div className="sm-section-title">
                <SvgTrophy size={16} />
                <span>Cột mốc nhận thưởng chuỗi ngày</span>
              </div>
            </div>

            <div className="sm-milestones">
              {STREAK_MILESTONES.map((m) => {
                const canClaim = streakDays >= m.days;
                const isClaimed = claimedList.includes(m.days);
                return (
                  <div
                    key={m.days}
                    className={`sm-ms-row ${isClaimed ? 'is-claimed' : canClaim ? 'is-ready' : ''}`}
                  >
                    <div className="sm-ms-left">
                      <span className="sm-ms-badge">{m.days}N</span>
                      <div className="sm-ms-info">
                        <b>Chuỗi {m.days} ngày liên tiếp</b>
                        <small>{m.label}</small>
                      </div>
                    </div>

                    {isClaimed ? (
                      <span className="sm-claimed-pill">
                        <SvgCheck size={12} /> Đã nhận
                      </span>
                    ) : canClaim ? (
                      <button
                        type="button"
                        className="sm-claim-btn"
                        onClick={() => handleClaimMilestone(m.days, m.reward, m.credits, m.passTier)}
                      >
                        <SvgGift size={12} /> Nhận thưởng
                      </button>
                    ) : (
                      <span className="sm-remain-pill">Còn {m.days - streakDays} ngày</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="sm-footer">
            <div className="sm-footer-tip">
              <img src="/img/elec/elec-wink.png" alt="" aria-hidden="true" width="28" height="28" />
              <span>Học đều 10 phút mỗi ngày để giữ chuỗi &amp; tích thưởng Credit!</span>
            </div>
            <button type="button" className="sm-close-btn" onClick={handleCloseModal}>
              Đóng lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
