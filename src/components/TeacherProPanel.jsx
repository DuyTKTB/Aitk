import { useState } from 'react';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { useAuth } from '../hooks/useAuth.jsx';
import '../styles/teacher-pro.css';

/* ============ SVG ICONS ============ */
const IcoCrown = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8l4 4 5-8 5 8 4-4v11H3z" />
    <circle cx="12" cy="20" r="1" fill="currentColor" />
  </svg>
);

const IcoKey = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
  </svg>
);

const IcoCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IcoWarning = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IcoClock = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/* ============ MAIN ============ */
export default function TeacherProPanel() {
  const { user } = useAuth();
  const pro = useTeacherPro();
  const [keyInput, setKeyInput] = useState('');
  const [msg, setMsg] = useState(null);

  const handleActivate = async () => {
    if (!keyInput.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng nhập key.' });
      return;
    }
    const res = await pro.activate(keyInput.trim());
    if (res.ok) {
      setMsg({
        type: 'success',
        text: `Kích hoạt thành công! Hạn đến ${new Date(res.expiry).toLocaleDateString('vi-VN')}`,
      });
      setKeyInput('');
    } else {
      setMsg({ type: 'error', text: res.error });
    }
  };

  /* ============ ĐANG LÀ PRO ============ */
  if (pro.isPro) {
    const expiryDate = new Date(pro.expiry);
    const isExpiringSoon = pro.daysLeft <= 7;

    return (
      <div className="tpp">
        <div className="tpp-hero active">
          <div className="tpp-hero-ico"><IcoCrown size={44} /></div>
          <div>
            <span className="tpp-label">TÀI KHOẢN GIÁO VIÊN</span>
            <h2 className="tpp-title">PRO đang hoạt động</h2>
            <p className="tpp-sub">
              Bạn có thể tạo lớp, giao đề, quản lý học sinh.
            </p>
          </div>
        </div>

        <div className="tpp-info-grid">
          <div className="tpp-info">
            <IcoClock size={18} />
            <div>
              <span>Hạn sử dụng</span>
              <b>{expiryDate.toLocaleDateString('vi-VN')}</b>
            </div>
          </div>
          <div className={'tpp-info' + (isExpiringSoon ? ' warn' : '')}>
            <IcoWarning size={18} />
            <div>
              <span>Còn lại</span>
              <b>{pro.daysLeft} ngày</b>
            </div>
          </div>
          <div className="tpp-info">
            <IcoKey size={18} />
            <div>
              <span>Key đang dùng</span>
              <b className="tpp-key-mono">{pro.pro?.key || '—'}</b>
            </div>
          </div>
        </div>

        {isExpiringSoon && (
          <div className="tpp-warn-box">
            <IcoWarning size={20} />
            <span>
              Key sắp hết hạn trong <b>{pro.daysLeft} ngày</b>. Liên hệ Admin để gia hạn.
            </span>
          </div>
        )}

        <div className="tpp-actions">
          <button
            className="tpp-btn primary"
            onClick={() => { window.location.hash = 'classroom'; }}
          >
            Vào quản lý lớp học
          </button>
        </div>

        <p className="tpp-note">
          Sau khi hết hạn, tài khoản sẽ tự động chuyển về <b>Free</b> và mất các chức năng giáo viên.
        </p>
      </div>
    );
  }

  /* ============ CHƯA LÀ PRO ============ */
  return (
    <div className="tpp">
      <div className="tpp-hero">
        <div className="tpp-hero-ico"><IcoCrown size={44} /></div>
        <div>
          <span className="tpp-label">NÂNG CẤP TÀI KHOẢN</span>
          <h2 className="tpp-title">Trở thành Giáo viên PRO</h2>
          <p className="tpp-sub">
            Mở khóa chức năng quản lý lớp, giao đề, chấm điểm tự động.
          </p>
        </div>
      </div>

      <ul className="tpp-features">
        <li><IcoCheck /> Tạo lớp, sinh key lớp cho học sinh</li>
        <li><IcoCheck /> Tạo đề thi, sinh link gửi nhóm lớp</li>
        <li><IcoCheck /> Tự động chấm điểm, xem thống kê</li>
        <li><IcoCheck /> Quản lý thành viên, gán chức vụ</li>
        <li><IcoCheck /> Bảng xếp hạng học sinh theo lớp</li>
      </ul>

      <div className="tpp-activate">
        <label className="tpp-label-input">Nhập KEY PRO</label>
        <div className="tpp-input-row">
          <div className="tpp-input-wrap">
            <IcoKey size={18} />
            <input
              type="text"
              value={keyInput}
              onChange={(e) => { setKeyInput(e.target.value.toUpperCase()); setMsg(null); }}
              placeholder="PRO-XXXX-XXXX"
              onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
              maxLength={20}
              disabled={pro.loading}
            />
          </div>
          <button
            className="tpp-btn primary"
            onClick={handleActivate}
            disabled={pro.loading || !keyInput.trim()}
          >
            {pro.loading ? 'Đang kích hoạt…' : 'Kích hoạt'}
          </button>
        </div>

        {msg && (
          <div className={'tpp-msg ' + msg.type}>
            {msg.type === 'success' ? <IcoCheck size={16} /> : <IcoWarning size={16} />}
            <span>{msg.text}</span>
          </div>
        )}
      </div>

      <div className="tpp-contact">
        <b>Chưa có key?</b>
        <p>
          Liên hệ Admin qua Facebook để được cấp key PRO.
          Thời hạn: 1 tháng / 6 tháng / 1 năm.
        </p>
        <a
          className="tpp-btn primary"
          href="https://www.facebook.com/nguyentheduytk"
          target="_blank"
          rel="noopener noreferrer"
        >
          Liên hệ Admin
        </a>
      </div>
    </div>
  );
}