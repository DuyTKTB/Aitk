import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/firebase.js', () => ({
  auth: { currentUser: null },
}));

import {
  sanitizeOtpInput,
  isValidOtpFormat,
  buildOtpEmailHtml,
  buildOtpEmailText,
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
  buildPasswordResetOtpEmailHtml,
  buildPasswordResetOtpEmailText,
} from '../src/lib/emailTemplates.js';
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpHash,
  buildCustomActionLink,
  getClientIp,
} from '../api/email-otp.js';

describe('emailOtp — Xác thực Gmail bằng mã 6 số', () => {
  it('lọc và chuẩn hóa chuỗi nhập OTP chỉ giữ 6 chữ số', () => {
    expect(sanitizeOtpInput(' 12a3-45b678 ')).toBe('123456');
    expect(sanitizeOtpInput('abc')).toBe('');
    expect(isValidOtpFormat('482910')).toBe(true);
    expect(isValidOtpFormat('12345')).toBe(false);
    expect(isValidOtpFormat('12345a')).toBe(false);
  });

  it('sinh mã OTP 6 chữ số hợp lệ', () => {
    for (let i = 0; i < 20; i += 1) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('băm và đối chiếu mã OTP an toàn theo từng uid', () => {
    const secret = 'test-secret-key';
    const hash = hashOtpCode('uid-123', '654321', secret);

    expect(hash).not.toContain('654321');
    expect(verifyOtpHash('uid-123', '654321', hash, secret)).toBe(true);
    expect(verifyOtpHash('uid-123', '654320', hash, secret)).toBe(false);
    expect(verifyOtpHash('uid-999', '654321', hash, secret)).toBe(false);
  });

  it('tạo HTML email OTP và email Đặt lại mật khẩu chuẩn giao diện đẹp', () => {
    const otpHtml = buildOtpEmailHtml({ code: '908172', email: 'an@gmail.com', name: 'Nguyễn Văn An' });
    expect(otpHtml).toContain('908172');
    expect(otpHtml).toContain('an@gmail.com');
    expect(otpHtml).toContain('Nguyễn Văn An');

    const resetHtml = buildPasswordResetEmailHtml({
      resetLink: 'https://www.elecai.id.vn/#auth-action?mode=resetPassword&oobCode=abc',
      email: 'an@gmail.com',
      name: 'Nguyễn Văn An',
    });
    expect(resetHtml).toContain('Đặt lại mật khẩu mới');
    expect(resetHtml).toContain('elecai@elecai.id.vn');
    expect(resetHtml).toContain('an@gmail.com');

    const resetOtpHtml = buildPasswordResetOtpEmailHtml({
      code: '731904',
      email: 'an@gmail.com',
      name: 'Nguyễn Văn An',
    });
    expect(resetOtpHtml).toContain('731904');
    expect(resetOtpHtml).toContain('Mã OTP đặt lại mật khẩu');

    const otpText = buildOtpEmailText({ code: '908172', email: 'an@gmail.com', name: 'Nguyễn Văn An' });
    expect(otpText).toContain('908172');
    const resetOtpText = buildPasswordResetOtpEmailText({ code: '731904', email: 'an@gmail.com', name: 'Nguyễn Văn An' });
    expect(resetOtpText).toContain('731904');
    const resetText = buildPasswordResetEmailText({ resetLink: 'https://www.elecai.id.vn/#auth-action?mode=resetPassword&oobCode=abc', email: 'an@gmail.com' });
    expect(resetText).toContain('oobCode=abc');

    const customUrl = buildCustomActionLink(
      'https://duyheheh-2a269.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=XYZ123&apiKey=k'
    );
    expect(customUrl).toBe('https://www.elecai.id.vn/#auth-action?mode=resetPassword&oobCode=XYZ123');
  });

  it('bảo vệ IP và trích xuất đúng IP người dùng từ headers', () => {
    const reqWithForwarded = {
      headers: { 'x-forwarded-for': '113.190.23.45, 10.0.0.1' },
    };
    expect(getClientIp(reqWithForwarded)).toBe('113.190.23.45');

    const reqWithRealIp = {
      headers: { 'x-real-ip': '113.190.23.99' },
    };
    expect(getClientIp(reqWithRealIp)).toBe('113.190.23.99');

    const reqDefault = { headers: {} };
    expect(getClientIp(reqDefault)).toBe('127.0.0.1');
  });
});
