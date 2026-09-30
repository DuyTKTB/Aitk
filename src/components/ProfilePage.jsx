import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { translateAuthError } from '../lib/firebase.js';
import { TIERS } from '../lib/tier.js';
import VerifiedBadge from './VerifiedBadge.jsx';
import Glyph, { pwStrength, STRENGTH_LABELS } from './AuthKit.jsx';
import './ProfileFB.css';

/* ---------- Bảng màu avatar ---------- */
const AVATAR_COLORS = [
  '#ff4d1a', '#a7c4f2', '#b7dc9a', '#ffc46b',
  '#f2b6c6', '#c1b4f0', '#8fd6c4', '#ff9b85',
];
function colorFromName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/* Chức danh tự động theo tier */
function rankFor(tier) {
  if (tier?.key === 'vip') return 'Nhà Hóa học cấp cao';
  return 'Nhà Hóa học tập sự';
}

/* ============================================================
   AVATAR — vòng tròn, có viền con dấu VIP chạy quanh
   ============================================================ */
function AvatarRing({ photoURL, initial, color, isVip, size = 168 }) {
  return (
    <div
      className={'fb-avatar-wrap' + (isVip ? ' vip' : '')}
      style={{ '--av-color': color, '--av-size': `${size}px` }}
    >
      {isVip && (
        <svg className="fb-avatar-ring" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <path
              id="fb-avatar-circle"
              d="M100,100 m-88,0 a88,88 0 1,1 176,0 a88,88 0 1,1 -176,0"
            />
          </defs>
          <text
            fontFamily="var(--mono)"
            fontSize="11"
            fontWeight="700"
            fill="#ffb020"
            letterSpacing="2"
          >
            <textPath href="#fb-avatar-circle" startOffset="0">
              VIP · CUAI · VIP · CUAI · VIP · CUAI · VIP · CUAI · VIP · CUAI ·
            </textPath>
          </text>
        </svg>
      )}

      <div className="fb-avatar-inner">
        {photoURL ? (
          <img src={photoURL} alt="Avatar" />
        ) : (
          <span className="fb-avatar-initial" style={{ background: color }}>
            {initial}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   COVER — gradient theo tier + hoa văn hóa học mờ
   ============================================================ */
function TierCover({ tier }) {
  const color = tier?.color || '#6b675e';
  return (
    <div
      className="fb-cover"
      style={{
        '--tier-color': color,
      }}
    >
      <svg className="fb-cover-mol" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="fb-hex" width="56" height="97" patternUnits="userSpaceOnUse">
            <path d="M28 0v16M28 16L0 32M28 16l28 16M0 32v32M56 32v32M0 64l28 16M56 64L28 80M28 80v17"
              fill="none" stroke="currentColor" strokeWidth="1.4" />
          </pattern>
        </defs>
        <rect width="800" height="300" fill="url(#fb-hex)" />
        <circle className="node pulse" cx="140" cy="80" r="4" />
        <circle className="node pulse" cx="364" cy="128" r="4" />
        <circle className="node pulse" cx="588" cy="64" r="4" />
        <circle className="node pulse" cx="672" cy="176" r="4" />
      </svg>
      <div className="fb-cover-symbols" aria-hidden="true">
        <span style={{ top: '12%', left: '8%' }}>H₂O</span>
        <span style={{ top: '68%', left: '22%' }}>NaCl</span>
        <span style={{ top: '22%', right: '18%' }}>C₆H₁₂O₆</span>
        <span style={{ bottom: '14%', right: '8%' }}>CO₂</span>
        <span style={{ top: '34%', left: '44%' }}><Glyph name="atom" size={56} strokeWidth={1.4} /></span>
      </div>
      <div className="fb-cover-fallback">
        <span>{tier?.name || 'Free'}</span>
        <small>{rankFor(tier)}</small>
      </div>
    </div>
  );
}

/* ============================================================
   FIELD — input đơn giản kiểu FB
   ============================================================ */
function FBField({ id, label, hint, right, locked, children }) {
  return (
    <div className="fb-field">
      {label && <label htmlFor={id}>{label}</label>}
      <div className={'fb-field-input' + (locked ? ' locked' : '')}>
        {children}
        {right && <div className="fb-field-right">{right}</div>}
      </div>
      {hint && <span className="fb-field-hint">{hint}</span>}
    </div>
  );
}

/* ============================================================
   PROFILE PAGE
   ============================================================ */
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
  const [secTab, setSecTab] = useState('password'); // password | devices | verify

  const [name, setName] = useState(user?.displayName || '');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [caps, setCaps] = useState(false);

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
  const daysJoined = user?.metadata?.creationTime
    ? Math.max(1, Math.ceil((Date.now() - new Date(user.metadata.creationTime).getTime()) / 864e5))
    : 0;
  const isGoogle = user?.providerData?.some((p) => p.providerId === 'google.com');
  const isVip = tier?.key === 'vip';

  const identCode = useMemo(() => {
    let h = 0;
    for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
    return 'A7-' + h.toString(16).slice(0, 6).toUpperCase();
  }, [email]);

  const symbol = useMemo(() => {
    const n = (user?.displayName || email || '?').trim();
    return n.charAt(0).toUpperCase() + (n.charAt(1) || '').toLowerCase();
  }, [user?.displayName, email]);

  const newPwStrength = pwStrength(newPw);

  const clearMessages = () => { setMsg(''); setErr(''); };
  const fail = (m) => { setMsg(''); setErr(m); };
  const ok = (m) => { setErr(''); setMsg(m); };

  const handleSaveName = async (e) => {
    e.preventDefault();
    clearMessages();
    const trimmed = name.trim();
    if (!trimmed) return fail('Vui lòng nhập tên hiển thị.');
    if (trimmed.length < 2) return fail('Tên phải từ 2 ký tự.');
    if (trimmed === user?.displayName) return fail('Tên chưa thay đổi.');
    setLoading(true);
    try {
      await updateDisplayName(trimmed);
      await refreshUser();
      ok('Đã cập nhật tên hiển thị.');
    } catch (e) {
      fail(e.code ? translateAuthError(e.code) : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (isGoogle) return fail('Tài khoản Google không cần đổi mật khẩu.');
    if (!oldPw) return fail('Vui lòng nhập mật khẩu hiện tại.');
    if (newPw.length < 6) return fail('Mật khẩu mới phải từ 6 ký tự.');
    if (newPw !== confirmPw) return fail('Mật khẩu xác nhận không khớp.');
    if (newPw === oldPw) return fail('Mật khẩu mới phải khác mật khẩu cũ.');
    setLoading(true);
    try {
      await changePassword(oldPw, newPw);
      setOldPw(''); setNewPw(''); setConfirmPw('');
      ok('Đã đổi mật khẩu thành công.');
    } catch (e) {
      const code = e.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        fail('Mật khẩu hiện tại không đúng.');
      } else {
        fail(code ? translateAuthError(code) : e.message);
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
      ok('Đã gửi email xác thực. Kiểm tra hộp thư của bạn.');
    } catch (e) {
      fail(e.code ? translateAuthError(e.code) : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshVerify = async () => {
    clearMessages();
    setLoading(true);
    try {
      const u = await refreshUser();
      if (u?.emailVerified) ok('Email đã được xác thực.');
      else fail('Email vẫn chưa được xác thực. Hãy kiểm tra hộp thư.');
    } catch (e) {
      fail(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTier = async () => {
    clearMessages();
    setLoading(true);
    try {
      const t = await refreshTier();
      ok(`Đã cập nhật gói: ${t.name}`);
    } catch (e) {
      fail(e.message);
    } finally {
      setLoading(false);
    }
  };

  const capsCheck = (e) => setCaps(!!e.getModifierState?.('CapsLock'));

  const TABS = [
    { id: 'info', label: 'Hồ sơ', icon: 'user' },
    { id: 'security', label: 'Bảo mật', icon: 'shield' },
    { id: 'upgrade', label: 'Nâng cấp', icon: 'crown' },
  ];

  const SEC_TABS = [
    { id: 'password', label: 'Đổi mật khẩu', icon: 'lock' },
    { id: 'devices', label: 'Thiết bị', icon: 'fingerprint' },
    { id: 'verify', label: 'Xác thực', icon: 'mail' },
  ];

  return (
    <section className="fb-page">
      {/* ============ COVER ============ */}
      <TierCover tier={tier} />

      {/* ============ AVATAR + INFO ============ */}
      <div className="fb-avatar-row">
        <AvatarRing
          photoURL={user?.photoURL}
          initial={initial}
          color={avatarColor}
          isVip={isVip}
          size={168}
        />

        <div className="fb-info">
          <h1 className="fb-name">
            {user?.displayName || 'Ẩn danh'}
            {isVip && <VerifiedBadge isVip size={22} />}
          </h1>

          <span className="fb-title">
            <Glyph name="sparkles" size={13} />
            {rankFor(tier)}
          </span>

          <ul className="fb-meta">
            <li>
              <Glyph name="mail" size={14} />
              <b>{email}</b>
              {user?.emailVerified && (
                <span className="fb-verified" title="Email đã xác thực"><Glyph name="check" size={10} strokeWidth={3.5} /></span>
              )}
            </li>
            <li>
              <Glyph name="target" size={14} />
              <b>{identCode}</b>
            </li>
            <li>
              <Glyph name="calendar" size={14} />
              Tham gia <b>{createdAt}</b>
            </li>
            <li>
              <Glyph name="clock" size={14} />
              Lần cuối <b>{lastLogin}</b>
            </li>
          </ul>
        </div>

        <div className="fb-element" style={{ '--tier-color': tier?.color || '#6b675e' }} aria-hidden="true">
          <span className="z">{daysJoined}</span>
          <Glyph name={isVip ? 'crown' : 'flask'} size={16} className="ic" />
          <b className="sym">{symbol}</b>
          <span className="nm">{(user?.displayName || 'Ẩn danh').split(' ').pop()}</span>
          <span className="wt">{identCode}</span>
        </div>
      </div>

      {/* ============ THỐNG KÊ NHANH ============ */}
      <div className="fb-stats">
        <div className="fb-stat">
          <small>Gói hiện tại</small>
          <strong style={{ color: tier?.color }}>{tier?.name || 'Free'}</strong>
        </div>
        <div className="fb-stat">
          <small>Đã đồng hành</small>
          <strong>{daysJoined}<i>ngày</i></strong>
        </div>
        <div className="fb-stat">
          <small>Email</small>
          <strong>{user?.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</strong>
        </div>
      </div>

      {/* ============ TABS NGANG ============ */}
      <nav className="fb-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={'fb-tab' + (tab === t.id ? ' on' : '')}
            onClick={() => { setTab(t.id); clearMessages(); }}
          >
            <Glyph name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </nav>

      {/* ============ PANEL ============ */}
      <div className="fb-panel">
        {msg && (
          <div className="fb-msg success">
            <Glyph name="check" size={15} /> {msg}
          </div>
        )}
        {err && (
          <div className="fb-msg error">
            <Glyph name="alert" size={15} /> {err}
          </div>
        )}

        {/* ---------- TAB HỒ SƠ ---------- */}
        {tab === 'info' && (
          <form onSubmit={handleSaveName}>
            <div className="fb-section">
              <h2 className="fb-section-title">Thông tin cá nhân</h2>
              <p className="fb-section-sub">Chỉnh sửa tên hiển thị của bạn. Các thông tin khác không thể thay đổi.</p>

              <FBField
                id="fb-name"
                label="Tên hiển thị"
                hint="Tên này hiển thị trong app và chat cộng đồng."
                right={name.trim().length >= 2 ? <Glyph name="check" size={16} /> : null}
              >
                <input
                  id="fb-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  maxLength={30}
                  autoComplete="name"
                />
              </FBField>

              <FBField
                id="fb-email"
                label="Email"
                hint="Email không thể thay đổi."
                locked
              >
                <input id="fb-email" type="email" value={email} disabled readOnly />
              </FBField>
            </div>

            <div className="fb-actions">
              <button
                type="submit"
                className="fb-btn primary"
                disabled={loading || name.trim() === (user?.displayName || '')}
              >
                <Glyph name={loading ? 'spinner' : 'check'} size={15} className={loading ? 'spin' : ''} />
                {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                className="fb-btn"
                onClick={() => { setName(user?.displayName || ''); clearMessages(); }}
              >
                <Glyph name="refresh" size={15} />
                Hoàn tác
              </button>
            </div>
          </form>
        )}

        {/* ---------- TAB BẢO MẬT (sub-tabs) ---------- */}
        {tab === 'security' && (
          <>
            <nav className="fb-subtabs" role="tablist">
              {SEC_TABS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={secTab === s.id}
                  className={'fb-subtab' + (secTab === s.id ? ' on' : '')}
                  onClick={() => { setSecTab(s.id); clearMessages(); }}
                >
                  <Glyph name={s.icon} size={14} />
                  {s.label}
                </button>
              ))}
            </nav>

            {/* Sub-tab: Đổi mật khẩu */}
            {secTab === 'password' && (
              <form onSubmit={handleChangePassword}>
                <div className="fb-section">
                  <h2 className="fb-section-title">Đổi mật khẩu</h2>
                  {isGoogle ? (
                    <div className="fb-notice">
                      <Glyph name="info" size={20} />
                      <div>
                        <b>Tài khoản Google</b>
                        <p>Bạn đăng nhập bằng Google nên không cần đổi mật khẩu tại đây.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FBField id="fb-old" label="Mật khẩu hiện tại">
                        <input
                          id="fb-old"
                          type={showOld ? 'text' : 'password'}
                          value={oldPw}
                          onChange={(e) => setOldPw(e.target.value)}
                          autoComplete="current-password"
                          placeholder="••••••••"
                        />
                        <div className="fb-field-right">
                          <button type="button" className="fb-eye" aria-label={showOld ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowOld((s) => !s)}>
                            <Glyph name={showOld ? 'eyeOff' : 'eye'} size={18} />
                          </button>
                        </div>
                      </FBField>

                      <FBField id="fb-new" label="Mật khẩu mới" hint="Tối thiểu 6 ký tự.">
                        <input
                          id="fb-new"
                          type={showNew ? 'text' : 'password'}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          onKeyUp={capsCheck}
                          onKeyDown={capsCheck}
                          onBlur={() => setCaps(false)}
                          autoComplete="new-password"
                          placeholder="••••••••"
                        />
                        <div className="fb-field-right">
                          <button type="button" className="fb-eye" aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowNew((s) => !s)}>
                            <Glyph name={showNew ? 'eyeOff' : 'eye'} size={18} />
                          </button>
                        </div>
                      </FBField>

                      {caps && (
                        <p className="fb-hint">
                          <Glyph name="alert" size={14} /> Caps Lock đang bật
                        </p>
                      )}

                      {newPw && (
                        <div className="fb-strength" data-s={newPwStrength}>
                          <div className="fb-strength-bar">
                            {[0, 1, 2, 3].map((i) => (
                              <i key={i} className={i < newPwStrength ? 'on' : ''} />
                            ))}
                          </div>
                          <span>{STRENGTH_LABELS[newPwStrength]}</span>
                        </div>
                      )}

                      <FBField id="fb-confirm" label="Xác nhận mật khẩu">
                        <input
                          id="fb-confirm"
                          type="password"
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          autoComplete="new-password"
                          placeholder="••••••••"
                        />
                      </FBField>
                    </>
                  )}
                </div>

                {!isGoogle && (
                  <div className="fb-actions">
                    <button
                      type="submit"
                      className="fb-btn primary"
                      disabled={loading || !oldPw || !newPw || !confirmPw}
                    >
                      <Glyph name={loading ? 'spinner' : 'key'} size={15} className={loading ? 'spin' : ''} />
                      {loading ? 'Đang đổi…' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Sub-tab: Thiết bị */}
            {secTab === 'devices' && (
              <div className="fb-section">
                <h2 className="fb-section-title">Thiết bị & đăng nhập</h2>
                <div className="fb-notice">
                  <Glyph name="fingerprint" size={20} />
                  <div>
                    <b>Phương thức đăng nhập</b>
                    <p>{isGoogle ? 'Google — an toàn, không cần mật khẩu.' : 'Email + Mật khẩu.'}</p>
                  </div>
                </div>
                <div className="fb-notice danger">
                  <Glyph name="logout" size={20} />
                  <div>
                    <b>Đăng xuất khỏi thiết bị này</b>
                    <p>Bạn sẽ được đưa về trang đăng nhập và cần đăng nhập lại.</p>
                    <button
                      type="button"
                      className="fb-btn danger"
                      onClick={() => { if (confirm('Đăng xuất?')) logout(); }}
                      style={{ marginTop: '.6rem' }}
                    >
                      <Glyph name="logout" size={15} /> Đăng xuất ngay
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab: Xác thực */}
            {secTab === 'verify' && (
              <div className="fb-section">
                <h2 className="fb-section-title">Xác thực email</h2>
                <div className={'fb-notice' + (user?.emailVerified ? '' : ' warn')}>
                  <Glyph name={user?.emailVerified ? 'check' : 'alert'} size={20} />
                  <div>
                    <b>{user?.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}</b>
                    <p>
                      {user?.emailVerified
                        ? 'Tài khoản của bạn đã được bảo vệ bằng xác thực email.'
                        : 'Xác thực email để bảo vệ tài khoản và có thể khôi phục mật khẩu khi quên.'}
                    </p>
                    {!user?.emailVerified && (
                      <div className="fb-actions" style={{ marginTop: '.6rem' }}>
                        <button
                          type="button"
                          className="fb-btn primary"
                          onClick={handleSendVerify}
                          disabled={loading}
                        >
                          <Glyph name="mail" size={15} /> Gửi email xác thực
                        </button>
                        <button
                          type="button"
                          className="fb-btn"
                          onClick={handleRefreshVerify}
                          disabled={loading}
                        >
                          <Glyph name="refresh" size={15} /> Đã xác thực?
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ---------- TAB NÂNG CẤP ---------- */}
        {tab === 'upgrade' && (
          <div className="fb-section">
            <h2 className="fb-section-title">Gói sử dụng</h2>
            <p className="fb-section-sub">
              Gói hiện tại: <b style={{ color: tier?.color }}>{tier?.name}</b> — {tier?.desc}
            </p>

            <div className="fb-tier-grid">
              {Object.values(TIERS).map((t) => {
                const isCurrent = t.key === tier.key;
                return (
                  <div
                    key={t.key}
                    className={'fb-tier' + (isCurrent ? ' current' : '')}
                    style={{ '--tier-color': t.color }}
                  >
                    <div className="fb-tier-head">
                      <span className="fb-tier-icon" style={{ background: t.color }}><Glyph name={t.key === 'vip' ? 'crown' : 'flask'} size={24} strokeWidth={1.8} /></span>
                      <div>
                        <h3 className="fb-tier-name">{t.name}</h3>
                        <p className="fb-tier-desc">{t.desc}</p>
                      </div>
                    </div>
                    <ul className="fb-tier-feats">
                      <li><Glyph name="sparkles" size={13} /> {t.unlimitedText ? 'Chat không giới hạn' : `${t.quotaText} tin nhắn / ngày`}</li>
                      <li><Glyph name="camera" size={13} /> {t.quotaImage} ảnh / ngày</li>
                      <li><Glyph name="robot" size={13} /> Trợ lý AI Hóa học</li>
                      <li><Glyph name="beaker" size={13} /> Phân tích bài tập</li>
                      {t.key === 'vip' && <li><Glyph name="bolt" size={13} /> Ưu tiên phản hồi</li>}
                    </ul>
                    <div className="fb-tier-action">
                      {isCurrent ? (
                        <button className="fb-btn current" disabled type="button">Đang sử dụng</button>
                      ) : t.key === 'free' ? (
                        <button className="fb-btn" disabled type="button">Miễn phí</button>
                      ) : (
                        <a
                          className="fb-btn primary"
                          href="https://www.facebook.com/nguyentheduytk"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Glyph name="facebook" size={15} /> Liên hệ nâng cấp
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="fb-notice" style={{ marginTop: '1.5rem' }}>
              <Glyph name="info" size={20} />
              <div>
                <b>Cách nâng cấp lên CUAI VIP</b>
                <p>Bấm nút <b>Liên hệ nâng cấp</b> để nhắn tin qua Facebook Admin. Sau khi xác nhận thanh toán, tài khoản sẽ được nâng lên VIP trong 24 giờ.</p>
                <button
                  type="button"
                  className="fb-btn"
                  onClick={handleRefreshTier}
                  disabled={loading}
                  style={{ marginTop: '.6rem' }}
                >
                  <Glyph name="refresh" size={15} /> Làm mới trạng thái gói
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}