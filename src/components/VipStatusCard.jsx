import { useEffect, useState } from 'react';
import {
  getVipStatus,
  onVipChange,
  formatRemaining,
  formatExpiry,
} from '../lib/vipService.js';

/* ============================================================
   ICONS — SVG nét 1.8px
   ============================================================ */
const IcoCrown = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18h18l-1.5-9-4.5 4L12 6l-3 7-4.5-4L3 18z" />
    <path d="M5 21h14" />
  </svg>
);

const IcoCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IcoStar = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
  </svg>
);

const IcoArrowRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const IcoAlertTriangle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IcoSparkles = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M5 12H1M23 12h-4M6.34 6.34 3.51 3.51M20.49 20.49l-2.83-2.83M6.34 17.66l-2.83 2.83M20.49 3.51l-2.83 2.83" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* ============================================================
   COMPONENT
   ============================================================ */
export default function VipStatusCard({ onUpgrade }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let off = false;
    getVipStatus()
      .then((s) => {
        if (!off) {
          setStatus(s);
          setLoading(false);
        }
      });
    return () => { off = true; };
  }, []);

  useEffect(() => {
    const unsub = onVipChange(() => {
      getVipStatus(true).then(setStatus);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="vsc-card vsc-loading">
        <div className="vsc-spinner" />
        <span>Đang kiểm tra…</span>
      </div>
    );
  }

  if (!status) return null;

  /* ---------- VIP đang hoạt động ---------- */
  if (status.vip) {
    const remaining = formatRemaining(status.daysLeft);
    const expiry = formatExpiry(status.until);

    return (
      <div className="vsc-card vsc-active">
        <div className="vsc-glow" aria-hidden="true" />

        <div className="vsc-head">
          <div className="vsc-icon">
            <IcoCrown size={22} />
          </div>
          <div className="vsc-head-text">
            <div className="vsc-title">ELECAI VIP</div>
            <div className="vsc-status">
              {status.isAdmin ? 'Quản trị viên' : 'Đang hoạt động'}
              {remaining && ` · ${remaining}`}
            </div>
          </div>
        </div>

        {/* Highlight — dùng thoải mái mọi chức năng VIP */}
        <div className="vsc-highlight">
          <IcoSparkles size={14} />
          <span>Dùng thoải mái mọi chức năng cần VIP</span>
        </div>

        <div className="vsc-features">
          <div className="vsc-feat">
            <IcoCheck size={14} />
            <span>Chat không giới hạn</span>
          </div>
          <div className="vsc-feat">
            <IcoCheck size={14} />
            <span>30 ảnh mỗi ngày</span>
          </div>
          <div className="vsc-feat">
            <IcoCheck size={14} />
            <span>AI Tạo Đề không giới hạn</span>
          </div>
          <div className="vsc-feat">
            <IcoCheck size={14} />
            <span>AI Quiz ôn tập</span>
          </div>
          <div className="vsc-feat">
            <IcoCheck size={14} />
            <span>Trợ lý AI Hóa học chuyên sâu</span>
          </div>
          <div className="vsc-feat">
            <IcoCheck size={14} />
            <span>Ưu tiên phản hồi</span>
          </div>
        </div>

        <div className="vsc-foot">
          <span className="vsc-expiry">
            {expiry ? `Hết hạn: ${expiry}` : 'Không thời hạn'}
          </span>
          <button
            type="button"
            className="vsc-btn"
            onClick={() => onUpgrade?.()}
          >
            <span>Gia hạn</span>
            <IcoArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  /* ---------- VIP hết hạn ---------- */
  if (status.expired) {
    const expiry = formatExpiry(status.until);

    return (
      <div className="vsc-card vsc-expired">
        <div className="vsc-head">
          <div className="vsc-icon warning">
            <IcoAlertTriangle size={22} />
          </div>
          <div className="vsc-head-text">
            <div className="vsc-title">VIP đã hết hạn</div>
            <div className="vsc-status">
              {expiry ? `Hết hạn ngày ${expiry}` : 'Cần gia hạn để tiếp tục'}
            </div>
          </div>
        </div>

        <p className="vsc-expired-msg">
          Bạn đã quay về gói Free. Chat, gửi ảnh và các chức năng VIP
          (AI Tạo Đề, AI Quiz…) đều bị khoá. Gia hạn để dùng lại.
        </p>

        <button
          type="button"
          className="vsc-btn warning"
          onClick={() => onUpgrade?.()}
        >
          <IcoStar size={14} />
          <span>Gia hạn VIP</span>
          <IcoArrowRight size={14} />
        </button>
      </div>
    );
  }

  /* ---------- Chưa từng VIP (Free) ---------- */
  return (
    <div className="vsc-card vsc-free">
      <div className="vsc-head">
        <div className="vsc-icon muted">
          <IcoStar size={20} />
        </div>
        <div className="vsc-head-text">
          <div className="vsc-title">Gói Free</div>
          <div className="vsc-status">Nâng cấp để mở khoá toàn bộ tính năng</div>
        </div>
      </div>

      <div className="vsc-highlight">
        <IcoSparkles size={14} />
        <span>VIP mở khoá mọi chức năng cần VIP, dùng không giới hạn</span>
      </div>

      <div className="vsc-upgrade-cta">
        <div className="vsc-upgrade-info">
          <b>ELECAI VIP</b>
          <span>Chat + ảnh không giới hạn · AI Tạo Đề · AI Quiz · Từ 50.000đ/tháng</span>
        </div>
        <button
          type="button"
          className="vsc-btn primary"
          onClick={() => onUpgrade?.()}
        >
          <IcoCrown size={14} />
          <span>Nâng cấp</span>
        </button>
      </div>
    </div>
  );
}