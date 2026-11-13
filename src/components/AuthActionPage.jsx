/* ============================================================
   AuthActionPage.jsx — Trang Đặt lại mật khẩu & Xác thực Email
   thương hiệu riêng ELEC AI (thay thế trang mặc định của Firebase)
   ============================================================ */

import { useEffect, useState } from 'react';
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth, translateAuthError } from '../lib/firebase.js';
import { validatePassword, MIN_PASSWORD } from '../lib/authValidation.js';
import '../styles/verify-email-gate.css';

function readActionParams() {
  if (typeof window === 'undefined') return { mode: '', oobCode: '' };
  const hash = window.location.hash || '';
  const qIdx = hash.indexOf('?');
  const hashParams = qIdx >= 0 ? new URLSearchParams(hash.slice(qIdx + 1)) : new URLSearchParams();
  const searchParams = new URLSearchParams(window.location.search || '');
  return {
    mode: hashParams.get('mode') || searchParams.get('mode') || '',
    oobCode: hashParams.get('oobCode') || searchParams.get('oobCode') || '',
  };
}

export default function AuthActionPage() {
  const [{ mode, oobCode }] = useState(readActionParams);
  const [stage, setStage] = useState('loading'); // loading | reset_form | done | error
  const [email, setEmail] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [doneMsg, setDoneMsg] = useState('');

  useEffect(() => {
    let alive = true;
    async function init() {
      if (!oobCode || !mode) {
        if (alive) {
          setErr('Liên kết không hợp lệ hoặc bị thiếu mã xác thực.');
          setStage('error');
        }
        return;
      }
      try {
        if (mode === 'resetPassword') {
          const targetEmail = await verifyPasswordResetCode(auth, oobCode);
          if (!alive) return;
          setEmail(targetEmail);
          setStage('reset_form');
        } else if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          if (!alive) return;
          setDoneMsg('Email của bạn đã được xác thực thành công! Bạn có thể quay lại ứng dụng để học ngay.');
          setStage('done');
        } else {
          if (alive) {
            setErr('Thao tác xác thực không được hỗ trợ.');
            setStage('error');
          }
        }
      } catch (e) {
        if (!alive) return;
        const code = String(e?.code || '');
        setErr(
          code === 'auth/expired-action-code'
            ? 'Liên kết đã hết hạn. Vui lòng yêu cầu gửi lại email mới.'
            : code === 'auth/invalid-action-code'
              ? 'Liên kết không hợp lệ hoặc đã được sử dụng trước đó.'
              : translateAuthError(code)
        );
        setStage('error');
      }
    }
    init();
    return () => { alive = false; };
  }, [mode, oobCode]);

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setErr('');
    const check = validatePassword(newPw, { email });
    if (!check.ok) {
      setErr(check.errors[0]);
      return;
    }
    if (newPw !== confirmPw) {
      setErr('Mật khẩu nhập lại không khớp.');
      return;
    }
    setBusy(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPw);
      setDoneMsg('Mật khẩu mới đã được cập nhật thành công! Hãy đăng nhập lại bằng mật khẩu mới.');
      setStage('done');
    } catch (e2) {
      setErr(translateAuthError(e2?.code) || 'Không đặt lại được mật khẩu.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="veg-wrap">
      <div className="veg-card">
        <div className="veg-top">
          <div className="veg-brand">
            <img src="/img/logo.png" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span>ELEC AI</span>
          </div>
          <span className="veg-badge">Bảo mật tài khoản</span>
        </div>

        {stage === 'loading' && (
          <header className="veg-head">
            <h1>Đang kiểm tra liên kết…</h1>
            <p>Vui lòng đợi trong giây lát.</p>
          </header>
        )}

        {stage === 'reset_form' && (
          <>
            <header className="veg-head">
              <h1>Đặt lại mật khẩu mới</h1>
              <p>
                Tài khoản: <span className="veg-email-pill">{email}</span>.
                Mật khẩu mới tối thiểu {MIN_PASSWORD} ký tự, gồm chữ hoa, chữ thường, số hoặc ký tự đặc biệt.
              </p>
            </header>

            <form onSubmit={handleConfirmReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Mật khẩu mới"
                autoComplete="new-password"
                required
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid var(--veg-line)',
                  background: 'var(--veg-input-bg)',
                  color: 'var(--veg-ink)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                required
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid var(--veg-line)',
                  background: 'var(--veg-input-bg)',
                  color: 'var(--veg-ink)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--veg-mut)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
                <span>Hiện mật khẩu</span>
              </label>

              {err && <div className="veg-msg err">{err}</div>}

              <button type="submit" disabled={busy} className="veg-primary-btn">
                {busy ? 'Đang lưu mật khẩu…' : 'Cập nhật mật khẩu mới'}
              </button>
            </form>
          </>
        )}

        {stage === 'done' && (
          <>
            <header className="veg-head">
              <h1>Hoàn tất!</h1>
              <p>{doneMsg}</p>
            </header>
            <button
              type="button"
              className="veg-primary-btn"
              onClick={() => { window.location.hash = 'login'; }}
            >
              Về trang đăng nhập ELEC AI
            </button>
          </>
        )}

        {stage === 'error' && (
          <>
            <header className="veg-head">
              <h1>Liên kết không hợp lệ</h1>
              <p>{err}</p>
            </header>
            <button
              type="button"
              className="veg-primary-btn"
              onClick={() => { window.location.hash = 'login'; }}
            >
              Quay lại đăng nhập
            </button>
          </>
        )}
      </div>
    </div>
  );
}
