/* ============================================================
   emailOtp.js — Client gọi API xác thực Gmail & Đặt lại mật khẩu OTP
   ============================================================ */

import { auth } from './firebase.js';
import {
  OTP_LENGTH,
  OTP_EXPIRY_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  BRAND_EMAIL,
  sanitizeOtpInput,
  isValidOtpFormat,
  buildOtpEmailHtml,
  buildPasswordResetOtpEmailHtml,
  buildPasswordResetEmailHtml,
} from './emailTemplates.js';

export {
  OTP_LENGTH,
  OTP_EXPIRY_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  BRAND_EMAIL,
  sanitizeOtpInput,
  isValidOtpFormat,
  buildOtpEmailHtml,
  buildPasswordResetOtpEmailHtml,
  buildPasswordResetEmailHtml,
};

async function postEmailOtp(payload, { requireAuth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (requireAuth) {
    const user = auth?.currentUser;
    if (!user) throw new Error('Bạn chưa đăng nhập.');
    const token = await user.getIdToken(true);
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch('/api/email-otp', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || 'Không thể xử lý yêu cầu gửi email.');
    err.code = data?.code || `HTTP_${res.status}`;
    err.retryAfterSec = data?.retryAfterSec;
    throw err;
  }
  return data;
}

export function requestEmailOtp() {
  return postEmailOtp({ action: 'send' });
}

export function verifyEmailOtpCode(code) {
  const clean = sanitizeOtpInput(code);
  if (!isValidOtpFormat(clean)) {
    return Promise.reject(new Error('Vui lòng nhập đủ 6 chữ số.'));
  }
  return postEmailOtp({ action: 'verify', code: clean });
}

export function requestResetPasswordOtp(email) {
  return postEmailOtp({ action: 'send_reset_otp', email }, { requireAuth: false });
}

export function verifyResetPasswordOtp({ email, code, newPassword }) {
  const clean = sanitizeOtpInput(code);
  if (!isValidOtpFormat(clean)) {
    return Promise.reject(new Error('Vui lòng nhập đủ 6 chữ số OTP.'));
  }
  return postEmailOtp(
    { action: 'verify_reset_otp', email, code: clean, newPassword },
    { requireAuth: false }
  );
}

export function requestBrandedPasswordReset(email) {
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
  return postEmailOtp({ action: 'forgot_password', email, origin }, { requireAuth: false });
}
