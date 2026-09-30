import { useEffect, useState } from 'react';
import AIMark from './AIMark.jsx';

const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
const ADMIN_FB = 'https://www.facebook.com/nguyentheduytk';

/* ============================================================
   MAINTENANCE — Trang bảo trì toàn app
   Đọc config từ Firebase: /config/maintenance
   ============================================================ */
export default function Maintenance({ info }) {
  const [dots, setDots] = useState('');
  const [now, setNow] = useState(Date.now());

  // Animation dấu chấm
  useEffect(() => {
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(t);
  }, []);

  // Đồng hồ cập nhật mỗi giây
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const title = info?.title || 'CUAI đang bảo trì';
  const message =
    info?.message ||
    'Hệ thống đang được nâng cấp để phục vụ bạn tốt hơn. Vui lòng quay lại sau ít phút.';
  const etaAt = info?.eta ? Number(info.eta) : null;

  // Đếm ngược (nếu có ETA)
  let countdown = null;
  if (etaAt && etaAt > now) {
    const s = Math.floor((etaAt - now) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    countdown = { h, m, s: sec };
  }

  return (
    <div className="mt-page">
      {/* Nền động */}
      <div className="mt-bg">
        <div className="mt-blob b1" />
        <div className="mt-blob b2" />
        <div className="mt-blob b3" />
        <div className="mt-grid" />
      </div>

      <div className="mt-card">
        {/* Biểu tượng AI đang "sửa chữa" */}
        <div className="mt-icon-wrap">
          <AIMark size={140} look mode="think" />
          <div className="mt-wrench">🛠️</div>
          <div className="mt-gear g1">⚙️</div>
          <div className="mt-gear g2">⚙️</div>
        </div>

        {/* Tag */}
        <div className="mt-tag">
          <span className="mt-dot-pulse" />
          <span>BẢO TRÌ HỆ THỐNG</span>
        </div>

        {/* Tiêu đề */}
        <h1 className="mt-title">{title}</h1>

        {/* Mô tả */}
        <p className="mt-desc">{message}</p>

        {/* Đếm ngược */}
        {countdown ? (
          <div className="mt-countdown">
            <span className="mt-cd-label">Dự kiến hoàn thành sau</span>
            <div className="mt-cd-row">
              <div className="mt-cd-cell">
                <b>{String(countdown.h).padStart(2, '0')}</b>
                <small>Giờ</small>
              </div>
              <span className="mt-cd-colon">:</span>
              <div className="mt-cd-cell">
                <b>{String(countdown.m).padStart(2, '0')}</b>
                <small>Phút</small>
              </div>
              <span className="mt-cd-colon">:</span>
              <div className="mt-cd-cell">
                <b>{String(countdown.s).padStart(2, '0')}</b>
                <small>Giây</small>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-loading">
            <span>Đang nâng cấp hệ thống</span>
            <span className="mt-dots">{dots}</span>
          </div>
        )}

        {/* Progress bar chạy qua lại */}
        <div className="mt-progress">
          <div className="mt-progress-bar" />
        </div>

        {/* Ghi chú */}
        <div className="mt-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Trong lúc chờ, các tính năng khác sẽ tạm không truy cập được.</span>
        </div>

        {/* Nút liên hệ */}
        <a
          className="mt-btn"
          href={ADMIN_FB}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
          </svg>
          <span>Liên hệ Admin</span>
        </a>

        {/* Footer */}
        <p className="mt-footer">
          © 2026 A7 K60 DTA — bycode Duy TK
        </p>
      </div>
    </div>
  );
}