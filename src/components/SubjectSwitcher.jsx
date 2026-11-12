import { useState, useEffect, useCallback } from 'react';
import '../styles/subject-switcher.css';

/* ============================================================
   SubjectSwitcher.jsx — BỘ CHỌN MÔN KHOA HỌC TỰ NHIÊN TOÀN CỤC
   100% SVG thuần, KHÔNG EMOJI, thiết kế Apple HIG / visionOS.
   Bao gồm đúng 3 môn trụ cột và chế độ KHTN tổng hợp:
     • 'all'   — Tất cả KHTN (Tổng hợp 3 môn)
     • 'ly'    — Môn Vật lí
     • 'hoa'   — Môn Hóa học
     • 'sinh'  — Môn Sinh học
   ============================================================ */

export const SUBJECT_OPTIONS = [
  {
    id: 'all',
    label: 'KHTN',
    fullLabel: 'Khoa học Tự nhiên (Tổng hợp 3 môn Vật lí — Hóa học — Sinh học)',
    color: '#2563eb',
    glow: 'rgba(37, 99, 235, 0.45)',
    mascot: '/img/elec/elec-cool.png',
    // SVG: 3 tầng khối liên kết (Đại diện cho 3 phân môn KHTN tích hợp)
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 12 12 17 22 12" />
        <polyline points="2 17 12 22 22 17" />
      </svg>
    ),
  },
  {
    id: 'ly',
    label: 'Vật lí',
    fullLabel: 'Môn Vật lí (Cơ học, Sóng, Điện xoay chiều, Quang học, Hạt nhân)',
    color: '#7c3aed',
    glow: 'rgba(124, 58, 237, 0.45)',
    mascot: '/img/elec/elec-fighting.png',
    // SVG: Quỹ đạo nguyên tử & hạt nhân (Biểu tượng Vật lí học)
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(30 12 12)" />
        <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(-30 12 12)" />
      </svg>
    ),
  },
  {
    id: 'hoa',
    label: 'Hóa học',
    fullLabel: 'Môn Hóa học (Bảng tuần hoàn, Cân bằng PTHH, Vô cơ, Hữu cơ)',
    color: '#0891b2',
    glow: 'rgba(8, 145, 178, 0.45)',
    mascot: '/img/elec/elec-think.png',
    // SVG: Bình tam giác phản ứng thí nghiệm (Biểu tượng Hóa học)
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 2v6L4.5 18A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 8V2" />
        <path d="M8.5 2h7" />
        <line x1="7" y1="16" x2="17" y2="16" strokeDasharray="1.5 2" />
      </svg>
    ),
  },
  {
    id: 'sinh',
    label: 'Sinh học',
    fullLabel: 'Môn Sinh học (Cấu trúc ADN, Di truyền Menđen, Tế bào, Sinh thái)',
    color: '#059669',
    glow: 'rgba(5, 150, 105, 0.45)',
    mascot: '/img/elec/elec-happy.png',
    // SVG: Chuỗi xoắn kép ADN với các liên kết hydro (Biểu tượng Sinh học)
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3c0 6 12 12 12 18" />
        <path d="M18 3c0 6-12 12-12 18" />
        <line x1="7.2" y1="7.5" x2="16.8" y2="7.5" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="7.2" y1="16.5" x2="16.8" y2="16.5" />
      </svg>
    ),
  },
];

const STORAGE_KEY = 'elec-current-subject';

/**
 * Hook dùng ở mọi component để lấy môn học đang chọn
 * và lắng nghe thay đổi tự động
 */
export function useCurrentSubject() {
  const [subject, setSubjectState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'all';
    } catch {
      return 'all';
    }
  });

  useEffect(() => {
    const handleSubjectChange = (e) => {
      const nextSub = e.detail?.subject;
      if (nextSub && nextSub !== subject) {
        setSubjectState(nextSub);
      }
    };
    window.addEventListener('elec-subject-change', handleSubjectChange);
    return () => window.removeEventListener('elec-subject-change', handleSubjectChange);
  }, [subject]);

  const setSubject = useCallback((nextSub) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextSub);
    } catch {}
    setSubjectState(nextSub);
    window.dispatchEvent(new CustomEvent('elec-subject-change', { detail: { subject: nextSub } }));
  }, []);

  return { subject, setSubject };
}

/**
 * Component thanh chuyển đổi môn KHTN dạng Segmented Control
 */
export default function SubjectSwitcher({ compact = false, className = '' }) {
  const { subject, setSubject } = useCurrentSubject();

  return (
    <div
      className={`subject-switcher-wrap ${compact ? 'is-compact' : ''} ${className}`}
      role="radiogroup"
      aria-label="Chọn phân môn Khoa học Tự nhiên"
    >
      {SUBJECT_OPTIONS.map((opt) => {
        const isActive = subject === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`subject-switcher-item ${isActive ? 'is-active' : ''}`}
            onClick={() => setSubject(opt.id)}
            title={opt.fullLabel}
            style={{
              '--sub-color': opt.color,
              '--sub-glow': opt.glow,
            }}
          >
            {opt.mascot ? (
              <img src={opt.mascot} alt="" className="sub-switcher-mascot" />
            ) : (
              <span className="sub-switcher-ico" aria-hidden="true">
                {opt.icon}
              </span>
            )}
            <span className="sub-switcher-label">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
