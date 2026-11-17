import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserRole,
  setUserRole,
  getUserMeta,
  setPostAuthRedirect,
  peekPostAuthRedirect,
  consumePostAuthRedirect,
  clearPostAuthRedirect,
} from '../src/lib/userRole.js';

function makeStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe('userRole & post-auth redirect helpers', () => {
  beforeEach(() => {
    globalThis.localStorage = makeStorage();
    globalThis.sessionStorage = makeStorage();
    clearPostAuthRedirect();
  });

  it('lưu và đọc vai trò giáo viên / học sinh theo uid', () => {
    expect(getUserRole(null)).toBe('student');
    expect(getUserRole({ uid: 'u-1' })).toBe('student');

    setUserRole('u-1', 'teacher');
    expect(getUserRole({ uid: 'u-1' })).toBe('teacher');
    expect(getUserMeta('u-1')).toEqual({ role: 'teacher' });
    expect(getUserRole({ uid: 'u-2' })).toBe('student');
  });

  it('lưu, xem trước và tiêu thụ đích chuyển hướng sau đăng ký giáo viên', () => {
    setPostAuthRedirect('#/classroom');
    expect(peekPostAuthRedirect()).toBe('classroom');
    expect(peekPostAuthRedirect()).toBe('classroom');

    expect(consumePostAuthRedirect()).toBe('classroom');
    expect(peekPostAuthRedirect()).toBe('');
  });

  it('tự hết hạn đích chuyển hướng sau 30 phút và xoá được thủ công', () => {
    const t0 = Date.now();
    setPostAuthRedirect('classroom');
    expect(peekPostAuthRedirect(t0 + 10 * 60 * 1000)).toBe('classroom');
    expect(peekPostAuthRedirect(t0 + 31 * 60 * 1000)).toBe('');

    setPostAuthRedirect('classroom');
    clearPostAuthRedirect();
    expect(peekPostAuthRedirect()).toBe('');

    setPostAuthRedirect('');
    expect(peekPostAuthRedirect()).toBe('');
  });

  it('hoạt động an toàn ngay cả khi sessionStorage bị chặn', () => {
    globalThis.sessionStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };

    setPostAuthRedirect('classroom');
    expect(peekPostAuthRedirect()).toBe('classroom');
    expect(consumePostAuthRedirect()).toBe('classroom');
    expect(peekPostAuthRedirect()).toBe('');
  });

  it('chia sẻ đích chuyển hướng qua localStorage khi người dùng mở link xác thực ở tab khác', () => {
    setPostAuthRedirect('classroom');
    // Giả lập tab mới với sessionStorage trống nhưng cùng localStorage
    globalThis.sessionStorage = makeStorage();
    expect(peekPostAuthRedirect()).toBe('classroom');
    expect(consumePostAuthRedirect()).toBe('classroom');
    expect(peekPostAuthRedirect()).toBe('');
  });
});
