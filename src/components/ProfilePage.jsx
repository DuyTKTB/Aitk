import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { translateAuthError } from '../lib/firebase.js';
import { TIERS } from '../lib/tier.js';
import AIMark from './AIMark.jsx';
import VerifiedBadge from './VerifiedBadge.jsx';
const AVATAR_COLORS = [
  '#ff4d1a', '#a7c4f2', '#b7dc9a', '#ffc46b',
  '#f2b6c6', '#c1b4f0', '#8fd6c4', '#ff9b85',
];
function colorFromName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function ProfilePage() {
  const {
    user,
    tier,
    logout,
    updateDisplayName,
    changePassword,
    sendVerifyEmail,
    refreshUser,
    refreshTier,
  } = useAuth();

  const [tab, setTab] = useState('info');
  const [name, setName] = useState(user?.displayName || '');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const email = user?.email || '';
  const initial = useMemo(
    () => (user?.displayName || email || '?').trim().charAt(0).toUpperCase(),
    [user?.displayName, email]
  );
  const avatarColor = useMemo(
    () => colorFromName(user?.displayName || email),
    [user?.displayName, email]
  );
  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN')
    : '—';
  const lastLogin = user?.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleString('vi-VN')
    : '—';
  const isGoogle = user?.providerData?.some((p) => p.providerId === 'google.com');

  const clearMessages = () => {
    setMsg('');
    setErr('');
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    clearMessages();
    const trimmed = name.trim();
    if (!trimmed) return setErr('Vui lòng nhập tên hiển thị.');
    if (trimmed.length < 2) return setErr('Tên phải từ 2 ký tự.');
    if (trimmed === user?.displayName) return setErr('Tên chưa thay đổi.');

    setLoading(true);
    try {
      await updateDisplayName(trimmed);
      await refreshUser();
      setMsg('✅ Đã cập nhật tên hiển thị.');
    } catch (e) {
      setErr(e.code ? translateAuthError(e.code) : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (isGoogle) return setErr('Tài khoản Google không cần đổi mật khẩu.');
    if (!oldPw) return setErr('Vui lòng nhập mật khẩu hiện tại.');
    if (newPw.length < 6) return setErr('Mật khẩu mới phải từ 6 ký tự.');
    if (newPw !== confirmPw) return setErr('Mật khẩu xác nhận không khớp.');
    if (newPw === oldPw) return setErr('Mật khẩu mới phải khác mật khẩu cũ.');

    setLoading(true);
    try {
      await changePassword(oldPw, newPw);
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
      setMsg('✅ Đã đổi mật khẩu thành công.');
    } catch (e) {
      const code = e.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErr('Mật khẩu hiện tại không đúng.');
      } else {
        setErr(code ? translateAuthError(code) : e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerify = async () => {
    clearMessages();
    setLoading(true);
    try {
      await sendVerifyEmail();
      setMsg('✅ Đã gửi email xác thực. Kiểm tra hộp thư của bạn.');
    } catch (e) {
      setErr(e.code ? translateAuthError(e.code) : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshVerify = async () => {
    clearMessages();
    setLoading(true);
    try {
      const u = await refreshUser();
      if (u?.emailVerified) setMsg('✅ Email đã được xác thực.');
      else setErr('Email vẫn chưa được xác thực. Hãy kiểm tra hộp thư.');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTier = async () => {
    clearMessages();
    setLoading(true);
    try {
      const t = await refreshTier();
      setMsg(`✅ Đã cập nhật gói: ${t.name}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="profile-page">
      <div className="profile-head">
        <AIMark size={80} look />
        <div className="profile-head-text">
          <h1 className="profile-title">
            Trang <em>cá nhân</em>
          </h1>
          <p className="profile-sub">Quản lý thông tin và bảo mật tài khoản</p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-side">
          <div className="profile-avatar-card">
            <div className="profile-avatar" style={{ background: avatarColor }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <h2 className="profile-name">
  {user?.displayName || 'Ẩn danh'}
  {tier.key === 'vip' && <VerifiedBadge isVip={true} size={16} />}
</h2>
            <p className="profile-email">
              {email}
              {user?.emailVerified ? (
                <span className="profile-verified" title="Email đã xác thực">✓</span>
              ) : (
                <span className="profile-unverified" title="Email chưa xác thực">!</span>
              )}
            </p>
            <div className="profile-badges">
              {isGoogle && <span className="profile-provider">Google</span>}
              {tier.key === 'vip' && (
                <span
                  className="profile-provider vip"
                  style={{ background: tier.color, color: '#111' }}
                >
                  👑 CUAI VIP
                </span>
              )}
            </div>
          </div>

          <nav className="profile-nav">
            <button
              className={'profile-nav-btn' + (tab === 'info' ? ' on' : '')}
              onClick={() => { setTab('info'); clearMessages(); }}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Thông tin</span>
            </button>

            <button
              className={'profile-nav-btn' + (tab === 'password' ? ' on' : '')}
              onClick={() => { setTab('password'); clearMessages(); }}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Mật khẩu</span>
            </button>

            <button
              className={'profile-nav-btn' + (tab === 'security' ? ' on' : '')}
              onClick={() => { setTab('security'); clearMessages(); }}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Bảo mật</span>
            </button>

            <button
              className={'profile-nav-btn' + (tab === 'upgrade' ? ' on' : '')}
              onClick={() => { setTab('upgrade'); clearMessages(); }}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2" />
              </svg>
              <span>Nâng cấp</span>
            </button>
          </nav>

          <button
            className="profile-logout"
            onClick={() => {
              if (confirm('Đăng xuất khỏi tài khoản?')) logout();
            }}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </aside>

        <main className="profile-main">
          {msg && <div className="profile-msg success">{msg}</div>}
          {err && <div className="profile-msg error">⚠️ {err}</div>}

          {tab === 'info' && (
            <form className="profile-form" onSubmit={handleSaveName}>
              <h2 className="profile-form-title">Thông tin cá nhân</h2>

              <label className="profile-field">
                <span className="profile-label">Tên hiển thị</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  maxLength={30}
                />
                <small className="profile-hint">Tên này hiển thị trong app và chat cộng đồng.</small>
              </label>

              <label className="profile-field">
                <span className="profile-label">Email</span>
                <input type="email" value={email} disabled style={{ opacity: 0.6 }} />
                <small className="profile-hint">Email không thể thay đổi.</small>
              </label>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span>Ngày tạo tài khoản</span>
                  <b>{createdAt}</b>
                </div>
                <div className="profile-info-item">
                  <span>Lần đăng nhập cuối</span>
                  <b>{lastLogin}</b>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  type="submit"
                  className="profile-btn primary"
                  disabled={loading || name.trim() === (user?.displayName || '')}
                >
                  {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  className="profile-btn"
                  onClick={() => {
                    setName(user?.displayName || '');
                    clearMessages();
                  }}
                >
                  Hoàn tác
                </button>
              </div>
            </form>
          )}

          {tab === 'password' && (
            <form className="profile-form" onSubmit={handleChangePassword}>
              <h2 className="profile-form-title">Đổi mật khẩu</h2>

              {isGoogle ? (
                <div className="profile-notice">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <div>
                    <b>Tài khoản Google</b>
                    <p>Bạn đăng nhập bằng Google nên không cần đổi mật khẩu tại đây.</p>
                  </div>
                </div>
              ) : (
                <>
                  <label className="profile-field">
                    <span className="profile-label">Mật khẩu hiện tại</span>
                    <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                  </label>
                  <label className="profile-field">
                    <span className="profile-label">Mật khẩu mới</span>
                    <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
                  </label>
                  <label className="profile-field">
                    <span className="profile-label">Xác nhận mật khẩu</span>
                    <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
                  </label>

                  <div className="profile-actions">
                    <button
                      type="submit"
                      className="profile-btn primary"
                      disabled={loading || !oldPw || !newPw || !confirmPw}
                    >
                      {loading ? 'Đang đổi…' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {tab === 'security' && (
            <div className="profile-form">
              <h2 className="profile-form-title">Bảo mật</h2>

              <div className="profile-sec-item">
                <div className="profile-sec-head">
                  <div>
                    <b>Xác thực email</b>
                    <p>
                      {user?.emailVerified
                        ? '✅ Email của bạn đã được xác thực.'
                        : '⚠️ Email chưa được xác thực.'}
                    </p>
                  </div>
                  {!user?.emailVerified && (
                    <button className="profile-btn primary sm" onClick={handleSendVerify} disabled={loading} type="button">
                      Gửi email
                    </button>
                  )}
                </div>
                {!user?.emailVerified && (
                  <button className="profile-link" onClick={handleRefreshVerify} disabled={loading} type="button">
                    Đã xác thực? Bấm để làm mới
                  </button>
                )}
              </div>

              <div className="profile-sec-item">
                <div className="profile-sec-head">
                  <div>
                    <b>Phương thức đăng nhập</b>
                    <p>{isGoogle ? 'Đăng nhập bằng Google' : 'Đăng nhập bằng Email + Mật khẩu'}</p>
                  </div>
                  <span className="profile-badge">{isGoogle ? 'Google' : 'Email'}</span>
                </div>
              </div>

              <div className="profile-sec-item danger">
                <div className="profile-sec-head">
                  <div>
                    <b>Đăng xuất khỏi thiết bị này</b>
                    <p>Bạn sẽ được đưa về trang đăng nhập.</p>
                  </div>
                  <button className="profile-btn danger" onClick={() => { if (confirm('Đăng xuất?')) logout(); }} type="button">
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'upgrade' && (
            <div className="profile-form">
              <h2 className="profile-form-title">Gói sử dụng</h2>

              <div className="tier-current" style={{ borderColor: tier.color }}>
                <div className="tier-current-icon" style={{ background: tier.color }}>
                  {tier.icon}
                </div>
                <div className="tier-current-info">
                  <span className="tier-current-label">Gói hiện tại</span>
                  <b className="tier-current-name">{tier.name}</b>
                  <p className="tier-current-desc">{tier.desc}</p>
                </div>
              </div>

              <div className="tier-grid">
                {Object.values(TIERS).map((t) => {
                  const isCurrent = t.key === tier.key;
                  return (
                    <div
                      key={t.key}
                      className={'tier-card' + (isCurrent ? ' current' : '')}
                      style={{ '--tier-color': t.color }}
                    >
                      <div className="tier-card-icon">{t.icon}</div>
                      <h3 className="tier-card-name">{t.name}</h3>
                      <ul className="tier-card-feats">
                        <li>{t.unlimitedText ? '♾️ Chat không giới hạn' : `💬 ${t.quotaText} tin nhắn / ngày`}</li>
                        <li>🖼️ {t.quotaImage} ảnh / ngày</li>
                        <li>🤖 Trợ lý AI Hóa học</li>
                        <li>🔬 Phân tích bài tập</li>
                        {t.key === 'vip' && <li>⚡ Ưu tiên phản hồi</li>}
                      </ul>
                      {isCurrent ? (
                        <button className="tier-btn current" disabled type="button">Đang sử dụng</button>
                      ) : t.key === 'free' ? (
                        <button className="tier-btn" disabled type="button">Miễn phí</button>
                      ) : (
                        <a
                          className="tier-btn primary"
                          href="https://www.facebook.com/nguyentheduytk"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Liên hệ nâng cấp
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="profile-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  <b>Cách nâng cấp lên CUAI VIP</b>
                  <p>Bấm nút <b>Liên hệ nâng cấp</b> để nhắn tin qua Facebook Admin. Sau khi xác nhận thanh toán, tài khoản sẽ được nâng lên VIP trong 24 giờ.</p>
                  <button className="profile-link" onClick={handleRefreshTier} disabled={loading} type="button" style={{ marginTop: '.4rem' }}>
                    🔄 Làm mới trạng thái gói
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}