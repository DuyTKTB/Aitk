import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/firebase.js', () => ({
  db: {},
}));
vi.mock('../src/lib/supabase.js', () => ({
  supabase: {
    from: () => ({
      upsert: vi.fn(async () => ({ error: null })),
    }),
  },
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  setDoc: vi.fn(async () => {}),
}));

import {
  normalizeUserProfile,
  normalizeProvinceName,
  validateProfileFields,
  getUserProfile,
  saveUserProfile,
  VIETNAM_PROVINCES,
} from '../src/lib/userProfileService.js';

describe('userProfileService — chuẩn hóa & bảo vệ dữ liệu người dùng', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.window = {
      dispatchEvent: vi.fn(),
    };
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  it('không bao giờ điền sẵn thông tin giả (ngày sinh, SĐT, trường) khi user mới đăng nhập Google', () => {
    const prof = normalizeUserProfile(null, {
      displayName: 'Hợp Nguyễn',
      email: 'nguyenthihopdta@gmail.com',
    });

    expect(prof.fullName).toBe('Hợp Nguyễn');
    expect(prof.lastName).toBe('Hợp');
    expect(prof.firstName).toBe('Nguyễn');
    expect(prof.invoice.invoiceEmail).toBe('nguyenthihopdta@gmail.com');
    expect(prof.birthDate).toBe('');
    expect(prof.phone).toBe('');
    expect(prof.province).toBe('');
    expect(prof.ward).toBe('');
    expect(prof.addressDetail).toBe('');
    expect(prof.grade).toBe('');
    expect(prof.highSchool).toBe('');
    expect(prof.survey.completed).toBe(false);
  });

  it('cập nhật đủ 34 tỉnh/thành sau sáp nhập 2025 (bỏ cấp huyện) và tự quy đổi tỉnh cũ', () => {
    expect(VIETNAM_PROVINCES).toHaveLength(34);
    expect(normalizeProvinceName('Bình Dương')).toBe('TP. Hồ Chí Minh');
    expect(normalizeProvinceName('Hải Dương')).toBe('Hải Phòng');
    expect(normalizeProvinceName('Thái Bình')).toBe('Hưng Yên');
    expect(normalizeProvinceName('Thừa Thiên Huế')).toBe('Huế');

    saveUserProfile('uid-full', {
      lastName: 'Trần Minh',
      firstName: 'Khoa',
      province: 'Nam Định',
      ward: 'Phường Vị Xuyên',
      addressDetail: 'Số 12',
      highSchool: 'THPT Chuyên Lê Hồng Phong',
    });

    const p = getUserProfile('uid-full');
    expect(p.fullName).toBe('Trần Minh Khoa');
    expect(p.lastName).toBe('Trần Minh');
    expect(p.firstName).toBe('Khoa');
    expect(p.province).toBe('Ninh Bình');
    expect(p.ward).toBe('Phường Vị Xuyên');
    expect(p.addressDetail).toBe('Số 12');
    expect(p.highSchool).toBe('THPT Chuyên Lê Hồng Phong');
  });

  it('kiểm tra hợp lệ họ tên, SĐT Việt Nam và ngày sinh', () => {
    expect(validateProfileFields({ fullName: 'A' }).ok).toBe(false);
    expect(validateProfileFields({ fullName: 'Hợp Nguyễn', phone: '123' }).ok).toBe(false);
    expect(validateProfileFields({ fullName: 'Hợp Nguyễn', birthDate: '1800-01-01' }).ok).toBe(false);

    const okRes = validateProfileFields({
      fullName: '  Hợp   Nguyễn ',
      phone: '0912.345.678',
      birthDate: '1985-05-12',
    });
    expect(okRes.ok).toBe(true);
    expect(okRes.cleaned.fullName).toBe('Hợp Nguyễn');
    expect(okRes.cleaned.phone).toBe('0912345678');
  });

  it('lưu hồ sơ & khảo sát tách biệt theo từng uid', () => {
    saveUserProfile('uid-hop', {
      fullName: 'Hợp Nguyễn',
      province: 'Hà Nội',
      survey: {
        completed: true,
        goal: 'giang_day',
        aiStyle: 'socratic',
        subjects: ['hoa_hoc'],
      },
    });

    const pHop = getUserProfile('uid-hop');
    const pOther = getUserProfile('uid-other', { displayName: 'Minh Trần', email: 'minh@gmail.com' });

    expect(pHop.fullName).toBe('Hợp Nguyễn');
    expect(pHop.survey.completed).toBe(true);
    expect(pHop.survey.aiStyle).toBe('socratic');

    expect(pOther.fullName).toBe('Minh Trần');
    expect(pOther.province).toBe('');
    expect(pOther.survey.completed).toBe(false);
  });
});
