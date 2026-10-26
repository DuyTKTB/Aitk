/* ============================================================
   authValidation.js — kiểm tra dữ liệu đăng ký (thuần JS, có test)
   ------------------------------------------------------------
   Mục tiêu: chặn dữ liệu xấu NGAY trước khi gọi Firebase, và
   không bao giờ nói dối người dùng về độ mạnh mật khẩu.
   Lưu ý: đây là lớp bảo vệ ở client; Firebase vẫn là nơi quyết định
   (mật khẩu tối thiểu 6 ký tự), nên policy ở đây chặt hơn mức tối thiểu.
   ============================================================ */

export const MIN_PASSWORD = 8;
export const MAX_NAME = 60;

/* Mật khẩu phổ biến / dễ đoán — chặn dù đủ độ dài */
export const COMMON_PASSWORDS = [
  '12345678', '123456789', '1234567890', 'password', 'password1', 'matkhau',
  'matkhau123', 'qwerty123', 'qwertyuiop', 'abc12345', 'iloveyou', '11111111',
  '00000000', 'admin123', 'elecai123', 'hocsinh123', 'giaovien123',
];

/* Domain email dùng một lần — chặn để giảm tài khoản rác */
export const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com',
  '10minutemail.com', 'yopmail.com', 'sharklasers.com', 'trashmail.com',
  'getnada.com', 'dispostable.com',
];

/* Bỏ dấu tiếng Việt để so sánh "nguyễn văn an" với "nguyenvanan" */
export function deaccent(s = '') {
  try {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  } catch {
    return String(s).toLowerCase();
  }
}

export function normalizeEmail(v) {
  return String(v ?? '').trim().toLowerCase();
}

export function validateEmail(email) {
  const e = normalizeEmail(email);
  if (!e) return { ok: false, error: 'Nhập email của bạn.' };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) return { ok: false, error: 'Email không hợp lệ.' };
  const domain = e.split('@')[1] || '';
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return { ok: false, error: 'Không dùng được email tạm thời. Hãy dùng email thật để nhận thông báo lớp.' };
  }
  return { ok: true, error: '', value: e };
}

export function validateName(name) {
  const n = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (!n) return { ok: false, error: 'Nhập họ và tên.' };
  if (n.length < 2) return { ok: false, error: 'Tên quá ngắn.' };
  if (n.length > MAX_NAME) return { ok: false, error: `Tên tối đa ${MAX_NAME} ký tự.` };
  if (!/\p{L}/u.test(n)) return { ok: false, error: 'Tên phải có chữ cái.' };
  return { ok: true, error: '', value: n };
}

/** Từng tiêu chí mật khẩu — dùng để vẽ checklist trong UI. */
export function passwordChecks(pw = '') {
  const s = String(pw);
  return {
    length: s.length >= MIN_PASSWORD,
    lower: /[a-z]/.test(s),
    upper: /[A-Z]/.test(s),
    digit: /\d/.test(s),
    special: /[^A-Za-z0-9]/.test(s),
  };
}

/** 0..4 — số nhóm ký tự đạt + thưởng khi dài ≥ 12. */
export function passwordScore(pw = '') {
  const c = passwordChecks(pw);
  let score = [c.lower, c.upper, c.digit, c.special].filter(Boolean).length - 1;
  if (String(pw).length >= 12) score += 1;
  if (!c.length) score = Math.min(score, 1);
  return Math.max(0, Math.min(4, score));
}

export function passwordStrengthLabel(score) {
  if (score >= 4) return { label: 'Rất mạnh', tone: 'very' };
  if (score === 3) return { label: 'Mạnh', tone: 'good' };
  if (score === 2) return { label: 'Trung bình', tone: 'mid' };
  if (score === 1) return { label: 'Yếu', tone: 'weak' };
  return { label: 'Rất yếu', tone: 'bad' };
}

/* Chuỗi dễ đoán: 12345678, abcdefgh, qwerty… */
function isSequential(s = '') {
  const v = s.toLowerCase();
  if (v.length < 6) return false;
  let asc = true;
  let desc = true;
  for (let i = 1; i < v.length; i += 1) {
    if (v.charCodeAt(i) !== v.charCodeAt(i - 1) + 1) asc = false;
    if (v.charCodeAt(i) !== v.charCodeAt(i - 1) - 1) desc = false;
  }
  return asc || desc;
}

/** Kiểm tra mật khẩu đầy đủ; trả danh sách lỗi cụ thể để hiện cho người dùng. */
export function validatePassword(pw, { email = '', name = '' } = {}) {
  const s = String(pw ?? '');
  const c = passwordChecks(s);
  const errors = [];

  if (!s) errors.push('Nhập mật khẩu.');
  else {
    if (!c.length) errors.push(`Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`);
    if ([c.lower, c.upper, c.digit, c.special].filter(Boolean).length < 3) {
      errors.push('Cần ít nhất 3 trong 4 nhóm: chữ thường, chữ hoa, số, ký tự đặc biệt.');
    }
    if (COMMON_PASSWORDS.includes(deaccent(s))) {
      errors.push('Mật khẩu này quá phổ biến, rất dễ bị đoán.');
    }
    if (isSequential(s)) errors.push('Không dùng chuỗi liên tiếp như 12345678 hay abcdefgh.');
    if (/(.)\1{3,}/.test(s)) errors.push('Không lặp lại một ký tự quá nhiều lần.');
  }

  /* Không cho mật khẩu chứa chính email/tên của mình */
  const local = deaccent(normalizeEmail(email).split('@')[0] || '');
  const nick = deaccent(String(name || '').replace(/\s+/g, ''));
  const plain = deaccent(s);
  if (local.length >= 4 && plain.includes(local)) errors.push('Mật khẩu không nên chứa email của bạn.');
  if (nick.length >= 3 && plain.includes(nick)) errors.push('Mật khẩu không nên chứa tên của bạn.');

  return { ok: errors.length === 0, errors, score: passwordScore(s), checks: c };
}

/** Kiểm tra toàn bộ form đăng ký. */
export function validateRegisterForm(values = {}) {
  const name = validateName(values.name);
  const email = validateEmail(values.email);
  const pw = validatePassword(values.password, { email: values.email, name: values.name });
  const errors = {};

  if (!name.ok) errors.name = name.error;
  if (!email.ok) errors.email = email.error;
  if (!pw.ok) errors.password = pw.errors[0];
  if (String(values.confirm ?? '') !== String(values.password ?? '')) {
    errors.confirm = 'Mật khẩu nhập lại không khớp.';
  }
  if (!['student', 'teacher'].includes(values.role)) {
    errors.role = 'Chọn vai trò của bạn.';
  }
  if (!values.terms) errors.terms = 'Cần đồng ý điều khoản để tạo tài khoản.';
  if (values.role === 'teacher' && String(values.school || '').trim().length < 2) {
    errors.school = 'Giáo viên cần nhập tên trường để chủ nhiệm/lớp xác nhận.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    normalized: {
      name: name.value || '',
      email: email.value || normalizeEmail(values.email),
      role: values.role,
      school: String(values.school || '').trim(),
    },
    passwordErrors: pw.errors,
    score: pw.score,
  };
}

/** Dịch mã lỗi Firebase sang tiếng Việt, không làm lộ tài khoản có tồn tại hay không. */
export function mapAuthError(codeOrMessage = '') {
  const m = String(codeOrMessage);
  if (m.includes('email-already-in-use')) return 'Email này đã được đăng ký. Hãy đăng nhập hoặc đặt lại mật khẩu.';
  if (m.includes('invalid-email')) return 'Email không hợp lệ.';
  if (m.includes('weak-password')) return `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự và đủ phức tạp.`;
  if (m.includes('operation-not-allowed')) return 'Đăng ký bằng email đang bị tắt cho ứng dụng này.';
  if (m.includes('too-many-requests')) return 'Bạn thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.';
  if (m.includes('network')) return 'Mất kết nối mạng. Kiểm tra mạng rồi thử lại.';
  if (m.includes('invalid-credential') || m.includes('wrong-password') || m.includes('user-not-found')) {
    return 'Email hoặc mật khẩu không đúng.';
  }
  return 'Không tạo được tài khoản. Vui lòng thử lại.';
}

/* ============================================================
   Chống thử quá nhiều lần ở client (giảm spam; Firebase vẫn tự chặn)
   ============================================================ */
export const MAX_FAILS = 5;
export const LOCK_MS = 5 * 60 * 1000;

export function emptyLockState() {
  return { fails: 0, lockedUntil: 0 };
}

/** Ghi nhận một lần thất bại; đủ 5 lần thì khoá 5 phút. */
export function nextFailure(state, now = Date.now()) {
  const fails = (Number(state?.fails) || 0) + 1;
  return fails >= MAX_FAILS
    ? { fails: 0, lockedUntil: now + LOCK_MS }
    : { fails, lockedUntil: 0 };
}

export function lockRemaining(state, now = Date.now()) {
  const until = Number(state?.lockedUntil) || 0;
  return until > now ? until - now : 0;
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} phút ${String(s).padStart(2, '0')} giây` : `${s} giây`;
}
