import { describe, it, expect } from 'vitest';
import {
  validateEmail, validateName, validatePassword, validateRegisterForm,
  passwordChecks, passwordScore, passwordStrengthLabel, mapAuthError,
  nextFailure, lockRemaining, formatDuration, emptyLockState,
  MAX_FAILS, LOCK_MS, MIN_PASSWORD, normalizeEmail, deaccent,
} from '../src/lib/authValidation.js';

describe('email', () => {
  it('chuẩn hoá và chấp nhận email hợp lệ', () => {
    expect(normalizeEmail('  A@Example.COM ')).toBe('a@example.com');
    expect(validateEmail('hoc.sinh@truong.edu.vn').ok).toBe(true);
  });

  it('chặn email sai định dạng', () => {
    expect(validateEmail('').ok).toBe(false);
    expect(validateEmail('abc').ok).toBe(false);
    expect(validateEmail('a@b').ok).toBe(false);
    expect(validateEmail('a b@c.com').ok).toBe(false);
  });

  it('chặn email tạm thời', () => {
    const r = validateEmail('test@mailinator.com');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/tạm thời/);
  });
});

describe('họ tên', () => {
  it('nhận tên tiếng Việt và gộp khoảng trắng', () => {
    const r = validateName('  Nguyễn   Văn  An ');
    expect(r.ok).toBe(true);
    expect(r.value).toBe('Nguyễn Văn An');
  });

  it('chặn tên rỗng, quá ngắn, toàn số', () => {
    expect(validateName('').ok).toBe(false);
    expect(validateName('A').ok).toBe(false);
    expect(validateName('12345').ok).toBe(false);
  });
});

describe('mật khẩu', () => {
  it('liệt kê đúng tiêu chí', () => {
    expect(passwordChecks('Abc12345!')).toEqual({
      length: true, lower: true, upper: true, digit: true, special: true,
    });
  });

  it('điểm tăng theo độ phức tạp', () => {
    expect(passwordScore('abc')).toBe(0);
    expect(passwordScore('abcdefgh')).toBe(0);
    const strong = passwordScore('Hoa@2026Elec');
    expect(strong).toBeGreaterThanOrEqual(3);
    expect(passwordStrengthLabel(4).label).toBe('Rất mạnh');
    expect(passwordStrengthLabel(0).tone).toBe('bad');
  });

  it(`yêu cầu tối thiểu ${MIN_PASSWORD} ký tự`, () => {
    const r = validatePassword('Abc123!');
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(new RegExp(`${MIN_PASSWORD}`));
  });

  it('yêu cầu ≥3 nhóm ký tự', () => {
    expect(validatePassword('abcdefgh').ok).toBe(false);
    /* thường + hoa + số = 3 nhóm → đạt */
    expect(validatePassword('Abcdefg1').ok).toBe(true);
    /* chỉ thường + số = 2 nhóm → không đạt */
    expect(validatePassword('abcdefg1').ok).toBe(false);
  });

  it('chặn mật khẩu phổ biến và chuỗi liên tiếp', () => {
    expect(validatePassword('Password1').errors.join(' ')).toMatch(/phổ biến/);
    expect(validatePassword('Abcd1234').ok).toBe(true);
    expect(validatePassword('A1b2C3d4').ok).toBe(true);
    expect(validatePassword('qwertyuiop1!').ok).toBe(true);
    expect(validatePassword('abcdefgh').errors.join(' ')).toMatch(/liên tiếp/);
  });

  it('chặn lặp ký tự quá nhiều', () => {
    expect(validatePassword('Aaaa1111!b').errors.join(' ')).toMatch(/lặp lại/);
  });

  it('không cho chứa email hoặc tên của chính mình', () => {
    const r1 = validatePassword('Nguyenvanan1!', { name: 'Nguyễn Văn An' });
    expect(r1.ok).toBe(false);
    expect(r1.errors.join(' ')).toMatch(/tên của bạn/);

    const r2 = validatePassword('Hocsinh2026!', { email: 'hocsinh2026@x.com' });
    expect(r2.ok).toBe(false);
    expect(r2.errors.join(' ')).toMatch(/email của bạn/);
  });
});

describe('validateRegisterForm', () => {
  const good = {
    name: 'Trần Bình',
    email: 'binh.tran@truong.edu.vn',
    password: 'Binh@2026hoc',
    confirm: 'Binh@2026hoc',
    role: 'student',
    terms: true,
  };

  it('form hợp lệ', () => {
    const r = validateRegisterForm(good);
    expect(r.ok).toBe(true);
    expect(r.normalized.email).toBe('binh.tran@truong.edu.vn');
  });

  it('bắt lỗi từng trường', () => {
    const r = validateRegisterForm({ ...good, confirm: 'khac', terms: false, role: '' });
    expect(r.ok).toBe(false);
    expect(r.errors.confirm).toBeTruthy();
    expect(r.errors.terms).toBeTruthy();
    expect(r.errors.role).toBeTruthy();
  });

  it('giáo viên phải nhập tên trường', () => {
    const r = validateRegisterForm({ ...good, role: 'teacher' });
    expect(r.errors.school).toBeTruthy();
    expect(validateRegisterForm({ ...good, role: 'teacher', school: 'THPT Lê Quý Đôn' }).ok).toBe(true);
  });
});

describe('thông báo lỗi & khoá thử', () => {
  it('dịch mã lỗi Firebase', () => {
    expect(mapAuthError('auth/email-already-in-use')).toMatch(/đã được đăng ký/);
    expect(mapAuthError('auth/too-many-requests')).toMatch(/nhiều lần/);
    /* không phân biệt email tồn tại hay không khi đăng nhập */
    expect(mapAuthError('auth/user-not-found')).toBe(mapAuthError('auth/wrong-password'));
  });

  it(`khoá ${MAX_FAILS} phút sau ${MAX_FAILS} lần sai`, () => {
    let st = emptyLockState();
    const now = 1_000_000;
    for (let i = 0; i < MAX_FAILS - 1; i += 1) st = nextFailure(st, now);
    expect(lockRemaining(st, now)).toBe(0);
    st = nextFailure(st, now);
    expect(lockRemaining(st, now)).toBe(LOCK_MS);
    expect(lockRemaining(st, now + LOCK_MS)).toBe(0);
  });

  it('định dạng thời gian chờ', () => {
    expect(formatDuration(65_000)).toBe('1 phút 05 giây');
    expect(formatDuration(9_000)).toBe('9 giây');
  });

  it('deaccent bỏ dấu tiếng Việt', () => {
    expect(deaccent('Nguyễn Văn Ánh')).toBe('nguyen van anh');
  });
});
