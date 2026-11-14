import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveStreak, getStreakData } from '../hooks.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { getCredits, spendCredit, grantActivationCredits } from '../lib/creditService.js';

/* ============================================================
   StreakModal.jsx — BẢO VỆ CHUỖI STREAK & THƯỞNG MỐC NGÀY
   100% Thuần SVG — Tuyệt đối không dùng ký tự emoji
   Lắng nghe sự kiện toàn cục 'elec-open-streak-modal'
   Mount trực tiếp bằng createPortal để không bị cản bởi nav.
   ============================================================ */

/* ── Icon SVG sắc nét ── */
export const SvgFlame = ({ size = 24, active = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? '#f97316' : '#94a3b8'} stroke={active ? '#ea580c' : 'none'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
  </svg>
);

const SvgShield = ({ size = 16, color = '#0284c7' }) => (
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

const SvgGift = ({ size = 16 }) => (
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

const FREEZE_KEY = 'cs-streak-freeze-count';
const CLAIMED_KEY = 'cs-streak-claimed-milestones';

export default function StreakModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const [isOpen, setIsOpen] = useState(Boolean(propIsOpen ?? false));
  const { user } = useAuth();
  const uid = user?.uid || user?.id || 'guest';
  const { count: streakDays, isToday: hasStreakToday } = useLiveStreak();

  // Đồng bộ prop isOpen từ bên ngoài nếu có truyền vào
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(Boolean(propIsOpen));
    }
  }, [propIsOpen]);

  // Lắng nghe sự kiện toàn cục elec-open-streak-modal & elec-close-streak-modal
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
      setIsOpen(false);
      propOnClose?.();
    };
    window.addEventListener('elec-open-streak-modal', handleOpen);
    window.addEventListener('elec-close-streak-modal', handleClose);
    return () => {
      window.removeEventListener('elec-open-streak-modal', handleOpen);
      window.removeEventListener('elec-close-streak-modal', handleClose);
    };
  }, [propOnClose]);

  // Hàm đóng an toàn
  const handleCloseModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
    propOnClose?.();
    window.dispatchEvent(new CustomEvent('elec-close-streak-modal'));
  };

  // Đóng bằng phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Số lượng khiên đóng băng (Mặc định tặng 1 khiên chào mừng)
  const [freezeCount, setFreezeCount] = useState(() => {
    try {
      const saved = localStorage.getItem(FREEZE_KEY);
      if (saved !== null) return Math.max(0, Number(saved));
      localStorage.setItem(FREEZE_KEY, '1'); // Tặng 1 khiên ban đầu
      return 1;
    } catch {
      return 1;
    }
  });

  // Danh sách mốc đã nhận thưởng
  const [claimedList, setClaimedList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CLAIMED_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [noticeMsg, setNoticeMsg] = useState(null);
  const [buyingFreeze, setBuyingFreeze] = useState(false);

  // Mua thêm khiên bảo vệ bằng 50 Điểm AI (trừ thật từ ví Credit)
  const handleBuyFreeze = async () => {
    if (buyingFreeze) return;
    if (!uid || uid === 'guest') {
      setNoticeMsg({ ok: false, text: 'Vui lòng đăng nhập để dùng 50 Điểm AI Credit mua Khiên Đóng Băng.' });
      return;
    }
    setBuyingFreeze(true);
    try {
      const cr = await getCredits(uid);
      if ((Number(cr?.balance) || 0) < 50) {
        setNoticeMsg({ ok: false, text: 'Bạn cần tối thiểu 50 Điểm AI Credit để trang bị thêm Khiên Đóng Băng.' });
        return;
      }
      const spent = await spendCredit(uid, 0, 50);
      if (!spent?.ok) {
        setNoticeMsg({ ok: false, text: 'Không đủ 50 Điểm AI Credit để trang bị Khiên Đóng Băng.' });
        return;
      }
      const nextCount = freezeCount + 1;
      setFreezeCount(nextCount);
      localStorage.setItem(FREEZE_KEY, String(nextCount));
      setNoticeMsg({ ok: true, text: 'Trang bị Khiên Đóng Băng thành công (-50 Điểm AI)! Chuỗi ngày của bạn được bảo vệ an toàn.' });
    } catch {
      setNoticeMsg({ ok: false, text: 'Không thể kết nối ví Credit lúc này. Vui lòng thử lại sau.' });
    } finally {
      setBuyingFreeze(false);
    }
  };

  // Nhận phần thưởng cột mốc
  const handleClaimMilestone = async (milestoneDays, rewardLabel, rewardCredits = 0, passTier = null) => {
    if (streakDays < milestoneDays) return;
    if (claimedList.includes(milestoneDays)) return;

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
    } catch { /* ignore */ }
    setNoticeMsg({ ok: true, text: `Chúc mừng bạn đã nhận thưởng cột mốc ${milestoneDays} ngày: ${rewardLabel}!` });
  };

  if (!isOpen || typeof document === 'undefined') return null;

  // Lịch 7 ngày trong tuần dựa trên lastDay & streakDays thực tế
  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const nowDate = new Date();
  const todayIndex = (nowDate.getDay() + 6) % 7; // T2 là 0, CN là 6
  const todayMidnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const streakInfo = getStreakData();
  const lastParts = String(streakInfo?.last || '').split('-').map(Number);
  const lastStudyMs = lastParts.length === 3 && lastParts.every(Number.isFinite)
    ? new Date(lastParts[0], lastParts[1] - 1, lastParts[2]).getTime()
    : NaN;

  const modalNode = (
    <div
      className="ns9-upg-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseModal(e);
        }
      }}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
    >
      <div
        className="ns9-upg-dialog-card"
        style={{
          maxWidth: 520,
          width: '100%',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 24,
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          pointerEvents: 'auto',
          cursor: 'default',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header với dải màu ngọn lửa cam */}
        <div style={{
          background: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
          padding: '24px 24px 20px',
          color: '#ffffff',
          position: 'relative',
        }}>
          {/* Nút X Đóng Modal */}
          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="Đóng"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              color: '#ffffff',
              background: 'rgba(0, 0, 0, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 30,
              pointerEvents: 'auto',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.45)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.22)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <SvgClose size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              flexShrink: 0,
            }}>
              <SvgFlame size={36} active />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                Hệ Thống Duy Trì Học Tập
              </span>
              <h2 style={{ margin: '2px 0 0', fontSize: '1.6rem', fontWeight: 900, lineHeight: 1.1 }}>
                Chuỗi {streakDays} Ngày
              </h2>
            </div>
          </div>

          <p style={{ margin: '12px 0 0', fontSize: '0.85rem', lineHeight: 1.4, opacity: 0.95 }}>
            {hasStreakToday
              ? 'Tuyệt vời! Bạn đã duy trì ngọn lửa học tập hôm nay. Hãy tiếp tục vào ngày mai nhé.'
              : 'Bạn chưa học hôm nay. Hãy hoàn thành 1 đề thi hoặc 5 câu hỏi để giữ chuỗi không bị dập tắt!'}
          </p>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {noticeMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: 16,
              background: noticeMsg.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: noticeMsg.ok ? '#10b981' : '#ef4444',
            }}>
              {noticeMsg.text}
            </div>
          )}

          {/* Vòng lặp 7 ngày trong tuần */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: 'var(--card-sub, #f8fafc)',
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px solid var(--border, #e2e8f0)',
            marginBottom: 20,
          }}>
            {daysOfWeek.map((dayLabel, idx) => {
              const isToday = idx === todayIndex;
              const dayMs = todayMidnight + (idx - todayIndex) * 864e5;
              const diffFromLast = Number.isFinite(lastStudyMs)
                ? Math.round((lastStudyMs - dayMs) / 864e5)
                : -1;
              const isDone = streakDays > 0 && diffFromLast >= 0 && diffFromLast < streakDays;
              return (
                <div key={dayLabel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isToday ? '#ea580c' : 'var(--mut, #64748b)' }}>
                    {dayLabel}
                  </span>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isDone ? 'rgba(234, 88, 12, 0.15)' : 'var(--border, #e2e8f0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isToday ? '2px solid #ea580c' : 'none',
                  }}>
                    <SvgFlame size={18} active={isDone} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Khối Khiên Đóng Băng Bảo Vệ Chuỗi (Streak Freeze) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderRadius: 14,
            background: 'rgba(2, 132, 199, 0.06)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <SvgShield size={22} color="#ffffff" />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--ink, #0f172a)', display: 'block' }}>
                  Khiên Đóng Băng Chuỗi ({freezeCount} khiên)
                </strong>
                <span style={{ fontSize: '0.76rem', color: 'var(--mut, #64748b)' }}>
                  Tự động bảo vệ chuỗi nếu bạn lỡ quên học 1 ngày
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBuyFreeze}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                pointerEvents: 'auto',
                flexShrink: 0,
              }}
            >
              + Trang bị khiên
            </button>
          </div>

          {/* Cột mốc nhận thưởng */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <SvgTrophy size={16} />
              <strong style={{ fontSize: '0.9rem', color: 'var(--ink, #0f172a)' }}>
                Cột mốc nhận thưởng chuỗi ngày
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { days: 3, label: '+30 Điểm AI Credit', reward: '30 Điểm AI', credits: 30 },
                { days: 7, label: '+70 Điểm AI & Huy hiệu Lửa Kiên Trì', reward: '70 Điểm AI & Huy hiệu', credits: 70 },
                { days: 14, label: 'Mở khóa 1 đề thi PRO miễn phí', reward: '1 Đề thi PRO', credits: 100, passTier: 'PRO' },
                { days: 30, label: 'Mở khóa 1 đề thi VIP Độc Quyền', reward: '1 Đề thi VIP', credits: 200, passTier: 'VIP' },
              ].map((m) => {
                const canClaim = streakDays >= m.days;
                const isClaimed = claimedList.includes(m.days);
                return (
                  <div
                    key={m.days}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border, #e2e8f0)',
                      background: isClaimed ? 'var(--card-sub, #f8fafc)' : (canClaim ? 'rgba(234, 88, 12, 0.05)' : '#ffffff'),
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: canClaim ? 'rgba(234, 88, 12, 0.15)' : 'var(--border, #e2e8f0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: canClaim ? '#ea580c' : '#64748b',
                        flexShrink: 0,
                      }}>
                        {m.days}N
                      </span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
                          Chuỗi {m.days} ngày liên tiếp
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--mut, #64748b)' }}>
                          {m.label}
                        </div>
                      </div>
                    </div>

                    {isClaimed ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                        <SvgCheck size={12} /> Đã nhận
                      </span>
                    ) : canClaim ? (
                      <button
                        type="button"
                        onClick={() => handleClaimMilestone(m.days, m.reward, m.credits, m.passTier)}
                        style={{
                          background: 'linear-gradient(135deg, #ea580c, #f97316)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: 8,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          pointerEvents: 'auto',
                        }}
                      >
                        <SvgGift size={12} /> Nhận thưởng
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--mut, #64748b)', fontWeight: 600 }}>
                        Còn {m.days - streakDays} ngày
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nút Đóng lại dưới chân Modal */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                padding: '9px 24px',
                borderRadius: 10,
                background: 'var(--card-sub, #f1f5f9)',
                border: '1px solid var(--border, #cbd5e1)',
                color: 'var(--ink, #0f172a)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                pointerEvents: 'auto',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-sub, #f1f5f9)'; }}
            >
              Đóng lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
