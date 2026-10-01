import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { translateAuthError } from '../lib/firebase.js';
import { TIERS } from '../lib/tier.js';
import VerifiedBadge from './VerifiedBadge.jsx';
import Glyph, { pwStrength, STRENGTH_LABELS } from './AuthKit.jsx';
import ProfileStats from './ProfileStats.jsx';
import ProfileAchievements from './ProfileAchievements.jsx';
import { IcoCamera, IcoUpload, IcoSpinner } from './ProfileIcons.jsx';
import './ProfileFB.css';

const AVATAR_COLORS = ['#ff4d1a', '#a7c4f2', '#b7dc9a', '#ffc46b', '#f2b6c6', '#c1b4f0', '#8fd6c4', '#ff9b85'];
const hashStr = (s = '') => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const autoColor = (name) => AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
const rankFor = (tier) => (tier?.key === 'vip' ? 'Nhà Hóa học cấp cao' : 'Nhà Hóa học tập sự');
const ls = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

const PW_RULES = [
  ['Từ 6 ký tự', (p) => p.length >= 6],
  ['Có chữ hoa và chữ thường', (p) => /[a-z]/.test(p) && /[A-Z]/.test(p)],
  ['Có chữ số', (p) => /\d/.test(p)],
  ['Có ký tự đặc biệt', (p) => /[^A-Za-z0-9]/.test(p)],
];

function Avatar({ photoURL, initial, color, isVip, onUpload, uploading }) {
  const fileRef = useRef(null);

  const handleChange = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f && onUpload) await onUpload(f);
  };

  return (
    <div className="pf-avatar-wrap">
      <div className={'pf-avatar' + (isVip ? ' vip' : '')} style={{ '--av': color }}>
        {photoURL ? <img src={photoURL} alt="" /> : <span>{initial}</span>}
        {uploading && (
          <div className="pf-avatar-loading">
            <IcoSpinner size={28} className="pf-spin" />
          </div>
        )}
      </div>

      <button
        type="button"
        className="pf-avatar-edit"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        aria-label="Đổi ảnh đại diện"
        title="Đổi ảnh đại diện"
      >
        <IcoCamera size={16} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleChange}
      />
    </div>
  );
}

function Field({ id, label, hint, locked, right, children }) {
  return (
    <div className="pf-field">
      <label htmlFor={id}>{label}</label>
      <div className={'pf-input' + (locked ? ' locked' : '')}>
        {children}
        {right}
      </div>
      {hint && <span className="pf-hint">{hint}</span>}
    </div>
  );
}

function PwInput({ id, label, value, onChange, show, onToggle, hint, ...rest }) {
  return (
    <Field
      id={id} label={label} hint={hint}
      right={
        <button type="button" className="pf-eye" onClick={onToggle} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
          <Glyph name={show ? 'eyeOff' : 'eye'} size={17} />
        </button>
      }
    >
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" {...rest} />
    </Field>
  );
}

export default function ProfilePage() {
  const {
    user, tier, logout,
    updateDisplayName, changePassword, sendVerifyEmail,
    refreshUser, refreshTier, uploadAvatar,
  } = useAuth();

  const [tab, setTab] = useState(() => ls.get('cs-profile-tab', 'info'));
  const [secTab, setSecTab] = useState('password');
  const [name, setName] = useState(user?.displayName || '');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [caps, setCaps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const [pickedColor, setPickedColor] = useState(() => ls.get('cs-avatar-color', ''));
  const toastTimer = useRef(null);
  const dlg = useRef(null);

  const email = user?.email || '';
  const display = user?.displayName || '';
  const initial = (display || email || '?').trim().charAt(0).toUpperCase();
  const color = pickedColor || autoColor(display || email);
  const isGoogle = user?.providerData?.some((p) => p.providerId === 'google.com');
  const isVip = tier?.key === 'vip';
  const dirty = name.trim() !== display;

  const created = user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
  const createdAt = created ? created.toLocaleDateString('vi-VN') : '—';
  const lastLogin = user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString('vi-VN') : '—';
  const daysJoined = created ? Math.max(1, Math.ceil((Date.now() - created.getTime()) / 864e5)) : 0;
  const identCode = useMemo(() => 'A7-' + hashStr(email).toString(16).slice(0, 6).toUpperCase(), [email]);
  const pwScore = pwStrength(newPw);

  const say = useCallback((type, text) => {
    clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), type === 'error' ? 7000 : 4000);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const ok = (t) => say('ok', t);
  const fail = (t) => say('error', t);
  const err = (e) => fail(e.code ? translateAuthError(e.code) : e.message);

  useEffect(() => { ls.set('cs-profile-tab', tab); }, [tab]);
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  useEffect(() => {
    const d = dlg.current; if (!d) return;
    if (askLogout && !d.open) d.showModal();
    if (!askLogout && d.open) d.close();
  }, [askLogout]);

  const pickColor = (c) => { setPickedColor(c); ls.set('cs-avatar-color', c); };

  const copyId = async () => {
    try { await navigator.clipboard.writeText(identCode); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { fail('Trình duyệt không cho phép sao chép.'); }
  };

  /* ---------- Upload avatar ---------- */
  const handleUpload = async (file) => {
    setUploading(true);
    try {
      await uploadAvatar(file);
      ok('Đã cập nhật ảnh đại diện!');
    } catch (x) {
      err(x);
    } finally {
      setUploading(false);
    }
  };

  /* ---------- Handlers ---------- */
  const saveName = async (e) => {
    e.preventDefault();
    const t = name.trim();
    if (t.length < 2) return fail('Tên phải từ 2 ký tự.');
    if (!dirty) return fail('Tên chưa thay đổi.');
    setLoading(true);
    try { await updateDisplayName(t); await refreshUser(); ok('Đã cập nhật tên hiển thị.'); }
    catch (x) { err(x); } finally { setLoading(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (isGoogle) return fail('Tài khoản Google không cần đổi mật khẩu.');
    if (newPw.length < 6) return fail('Mật khẩu mới phải từ 6 ký tự.');
    if (newPw !== confirmPw) return fail('Mật khẩu xác nhận không khớp.');
    if (newPw === oldPw) return fail('Mật khẩu mới phải khác mật khẩu cũ.');
    setLoading(true);
    try {
      await changePassword(oldPw, newPw);
      setOldPw(''); setNewPw(''); setConfirmPw('');
      ok('Đã đổi mật khẩu.');
    } catch (x) {
      if (x.code === 'auth/wrong-password' || x.code === 'auth/invalid-credential') fail('Mật khẩu hiện tại không đúng.');
      else err(x);
    } finally { setLoading(false); }
  };

  const run = (fn, good) => async () => {
    setLoading(true);
    try { const r = await fn(); good(r); } catch (x) { err(x); } finally { setLoading(false); }
  };
  const sendVerify = run(sendVerifyEmail, () => ok('Đã gửi email xác thực. Kiểm tra hộp thư (cả mục Spam).'));
  const checkVerify = run(refreshUser, (u) => (u?.emailVerified ? ok('Email đã được xác thực.') : fail('Email vẫn chưa xác thực.')));
  const syncTier = run(refreshTier, (t) => ok(`Gói hiện tại: ${t?.name || tier?.name || 'Miễn phí'}`));

  const TABS = [['info', 'Hồ sơ', 'user'], ['security', 'Bảo mật', 'shield'], ['upgrade', 'Gói dùng', 'crown']];
  const SEC = [['password', 'Mật khẩu'], ['verify', 'Xác thực email'], ['devices', 'Phiên đăng nhập']];

  const onTabKey = (e) => {
    const i = TABS.findIndex(([id]) => id === tab);
    if (e.key === 'ArrowRight') setTab(TABS[(i + 1) % TABS.length][0]);
    if (e.key === 'ArrowLeft') setTab(TABS[(i + TABS.length - 1) % TABS.length][0]);
  };

  return (
    <section className="pf">
      <div className={'pf-toast' + (toast ? ' show ' + toast.type : '')} role="status" aria-live="polite">
        {toast && (<><Glyph name={toast.type === 'ok' ? 'check' : 'alert'} size={15} /><span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Đóng">×</button></>)}
      </div>

      <div className="pf-grid">
        {/* ============ THẺ ĐỊNH DANH ============ */}
        <aside className="pf-card" style={{ '--tier': tier?.color || '#6b675e' }}>
          <div className="pf-card-band"><span>{tier?.name || 'Free'}</span><span>№ {identCode}</span></div>
          <div className="pf-card-body">
            <Avatar
              photoURL={user?.photoURL}
              initial={initial}
              color={color}
              isVip={isVip}
              onUpload={handleUpload}
              uploading={uploading}
            />
            <h1 className="pf-name">{display || 'Ẩn danh'}{isVip && <VerifiedBadge isVip size={20} />}</h1>
            <p className="pf-rank">{rankFor(tier)}</p>

            {!user?.photoURL && (
              <div className="pf-swatches" role="radiogroup" aria-label="Màu avatar">
                {AVATAR_COLORS.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={c === color} aria-label={c}
                    className={c === color ? 'on' : ''} style={{ background: c }} onClick={() => pickColor(c)} />
                ))}
              </div>
            )}

            <dl className="pf-facts">
              <div><dt>Email</dt><dd title={email}>{email}{user?.emailVerified && <i className="pf-ok" title="Đã xác thực"><Glyph name="check" size={9} strokeWidth={3.5} /></i>}</dd></div>
              <div><dt>Mã định danh</dt><dd>{identCode}<button type="button" className="pf-copy" onClick={copyId}>{copied ? 'Đã chép' : 'Sao chép'}</button></dd></div>
              <div><dt>Tham gia</dt><dd>{createdAt} · {daysJoined} ngày</dd></div>
              <div><dt>Lần cuối</dt><dd>{lastLogin}</dd></div>
            </dl>
          </div>
        </aside>

        {/* ============ NỘI DUNG ============ */}
        <div className="pf-main">
          <nav className="pf-tabs" role="tablist" onKeyDown={onTabKey}>
            {TABS.map(([id, label, icon]) => (
              <button key={id} type="button" role="tab" id={'pf-t-' + id} aria-selected={tab === id} tabIndex={tab === id ? 0 : -1}
                className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setToast(null); }}>
                <Glyph name={icon} size={15} />{label}
              </button>
            ))}
          </nav>

          <div className="pf-panel" role="tabpanel" aria-labelledby={'pf-t-' + tab}>
            {/* ============ TAB: HỒ SƠ ============ */}
            {tab === 'info' && (
              <>
                <ProfileStats />

                <form onSubmit={saveName} noValidate style={{ marginTop: '1.6rem' }}>
                  <h2>Thông tin cá nhân</h2>
                  <Field id="pf-name" label="Tên hiển thị" hint={`${name.trim().length}/30 — hiện trong app và chat cộng đồng`}>
                    <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoComplete="name" placeholder="Nguyễn Văn A" />
                  </Field>
                  <Field id="pf-email" label="Email" hint="Email gắn với tài khoản nên không đổi được." locked>
                    <input id="pf-email" value={email} disabled readOnly />
                  </Field>
                  <div className="pf-actions">
                    <button type="submit" className="pf-btn primary" disabled={loading || !dirty}>
                      <Glyph name={loading ? 'spinner' : 'check'} size={15} className={loading ? 'spin' : ''} />
                      {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
                    </button>
                    <button type="button" className="pf-btn" disabled={!dirty} onClick={() => setName(display)}>Hoàn tác</button>
                    {dirty && <span className="pf-dirty">Chưa lưu</span>}
                  </div>
                </form>

                <ProfileAchievements />
              </>
            )}

            {/* ============ TAB: BẢO MẬT ============ */}
            {tab === 'security' && (
              <>
                <nav className="pf-sub" role="tablist">
                  {SEC.map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={secTab === id} className={secTab === id ? 'on' : ''}
                      onClick={() => { setSecTab(id); setToast(null); }}>{label}</button>
                  ))}
                </nav>

                {secTab === 'password' && (
                  isGoogle ? (
                    <div className="pf-note"><Glyph name="info" size={18} /><div><b>Đăng nhập bằng Google</b><p>Mật khẩu do Google quản lý, không đổi tại đây.</p></div></div>
                  ) : (
                    <form onSubmit={savePassword} noValidate>
                      <h2>Đổi mật khẩu</h2>
                      <PwInput id="pf-old" label="Mật khẩu hiện tại" value={oldPw} onChange={setOldPw} show={showOld} onToggle={() => setShowOld((s) => !s)} autoComplete="current-password" />
                      <PwInput id="pf-new" label="Mật khẩu mới" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew((s) => !s)}
                        autoComplete="new-password" onKeyUp={(e) => setCaps(!!e.getModifierState?.('CapsLock'))} onBlur={() => setCaps(false)} />
                      {caps && <p className="pf-caps"><Glyph name="alert" size={13} /> Caps Lock đang bật</p>}
                      {newPw && (
                        <div className="pf-meter" data-s={pwScore}>
                          <div>{[0, 1, 2, 3].map((i) => <i key={i} className={i < pwScore ? 'on' : ''} />)}</div>
                          <span>{STRENGTH_LABELS[pwScore]}</span>
                        </div>
                      )}
                      <ul className="pf-rules">
                        {PW_RULES.map(([t, f]) => <li key={t} className={f(newPw) ? 'ok' : ''}>{t}</li>)}
                      </ul>
                      <PwInput id="pf-conf" label="Nhập lại mật khẩu mới" value={confirmPw} onChange={setConfirmPw} show={showNew} onToggle={() => setShowNew((s) => !s)}
                        autoComplete="new-password" hint={confirmPw && confirmPw !== newPw ? 'Chưa khớp với mật khẩu mới.' : undefined} />
                      <div className="pf-actions">
                        <button type="submit" className="pf-btn primary" disabled={loading || !oldPw || !newPw || !confirmPw}>
                          <Glyph name={loading ? 'spinner' : 'key'} size={15} className={loading ? 'spin' : ''} />{loading ? 'Đang đổi…' : 'Đổi mật khẩu'}
                        </button>
                      </div>
                    </form>
                  )
                )}

                {secTab === 'verify' && (
                  <>
                    <h2>Xác thực email</h2>
                    <div className={'pf-note' + (user?.emailVerified ? '' : ' warn')}>
                      <Glyph name={user?.emailVerified ? 'check' : 'alert'} size={18} />
                      <div>
                        <b>{user?.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}</b>
                        <p>{user?.emailVerified ? 'Bạn có thể khôi phục mật khẩu qua email này.' : 'Cần xác thực để khôi phục mật khẩu khi quên.'}</p>
                        {!user?.emailVerified && (
                          <div className="pf-actions flat">
                            <button type="button" className="pf-btn primary" onClick={sendVerify} disabled={loading}><Glyph name="mail" size={15} />Gửi email xác thực</button>
                            <button type="button" className="pf-btn" onClick={checkVerify} disabled={loading}><Glyph name="refresh" size={15} />Tôi đã bấm link</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {secTab === 'devices' && (
                  <>
                    <h2>Phiên đăng nhập</h2>
                    <div className="pf-note"><Glyph name="fingerprint" size={18} /><div><b>Cách đăng nhập</b><p>{isGoogle ? 'Google' : 'Email + mật khẩu'} · lần cuối {lastLogin}</p></div></div>
                    <div className="pf-note danger"><Glyph name="logout" size={18} /><div><b>Đăng xuất khỏi thiết bị này</b><p>Bạn sẽ quay về trang đăng nhập.</p>
                      <div className="pf-actions flat"><button type="button" className="pf-btn danger" onClick={() => setAskLogout(true)}>Đăng xuất</button></div></div></div>
                  </>
                )}
              </>
            )}

            {/* ============ TAB: GÓI DÙNG ============ */}
            {tab === 'upgrade' && (
              <>
                <h2>Gói sử dụng</h2>
                <p className="pf-sub-text">Đang dùng <b style={{ color: tier?.color }}>{tier?.name}</b> — {tier?.desc}</p>
                <div className="pf-tiers">
                  {Object.values(TIERS).map((t) => {
                    const cur = t.key === tier?.key;
                    return (
                      <article key={t.key} className={'pf-tier' + (cur ? ' current' : '') + (t.key === 'vip' ? ' vip' : '')} style={{ '--tier': t.color }}>
                        <header>
                          <span><Glyph name={t.key === 'vip' ? 'crown' : 'flask'} size={20} /></span>
                          <div><h3>{t.name}</h3><p>{t.desc}</p></div>
                          {cur && <em>Đang dùng</em>}
                        </header>
                        <ul>
                          <li>{t.unlimitedText ? 'Chat không giới hạn' : `${t.quotaText} tin nhắn / ngày`}</li>
                          <li>{t.quotaImage} ảnh / ngày</li>
                          <li>Trợ lý AI Hóa học</li>
                          <li>Phân tích bài tập</li>
                          {t.key === 'vip' && <li>Ưu tiên phản hồi</li>}
                        </ul>
                        {cur ? <button className="pf-btn" disabled type="button">Gói hiện tại</button>
                          : t.key === 'free' ? <button className="pf-btn" disabled type="button">Miễn phí</button>
                          : <a className="pf-btn primary" href="https://www.facebook.com/nguyentheduytk" target="_blank" rel="noopener noreferrer">Liên hệ nâng cấp</a>}
                      </article>
                    );
                  })}
                </div>
                <div className="pf-note">
                  <Glyph name="info" size={18} />
                  <div><b>Nâng cấp lên CUAI VIP</b><p>Nhắn Admin qua Facebook, sau khi xác nhận thanh toán tài khoản được nâng trong 24 giờ.</p>
                    <div className="pf-actions flat"><button type="button" className="pf-btn" onClick={syncTier} disabled={loading}><Glyph name="refresh" size={15} />Làm mới trạng thái gói</button></div></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <dialog ref={dlg} className="pf-dialog" onClose={() => setAskLogout(false)} onClick={(e) => e.target === dlg.current && setAskLogout(false)}>
        <h3>Đăng xuất?</h3>
        <p>Tài khoản <b>{display || email}</b> sẽ thoát khỏi thiết bị này.</p>
        <div className="pf-actions flat">
          <button type="button" className="pf-btn" onClick={() => setAskLogout(false)}>Ở lại</button>
          <button type="button" className="pf-btn danger" onClick={logout}>Đăng xuất</button>
        </div>
      </dialog>
    </section>
  );
}