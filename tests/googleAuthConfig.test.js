import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  FacebookAuthProvider: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  getFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
}));
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

import { translateAuthError } from '../src/lib/firebase.js';

function parseCspDirectives(cspValue) {
  const map = new Map();
  for (const raw of String(cspValue || '').split(';')) {
    const part = raw.trim();
    if (!part) continue;
    const [directive, ...sources] = part.split(/\s+/);
    map.set(directive, sources);
  }
  return map;
}

describe('Google Auth CSP, Service Worker và thông báo lỗi', () => {
  it('vercel.json cho phép đầy đủ domain Google/Firebase Auth trong Content-Security-Policy', () => {
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8');
    const cfg = JSON.parse(raw);

    const authRewrite = cfg.rewrites?.find((r) => r.source === '/__/auth/(.*)');
    expect(authRewrite?.destination).toBe('https://duyheheh-2a269.firebaseapp.com/__/auth/$1');

    const rootHeaders = cfg.headers?.find((h) => h.source === '/(.*)')?.headers || [];
    const cspHeader = rootHeaders.find((h) => h.key === 'Content-Security-Policy')?.value;
    expect(cspHeader).toBeTruthy();

    const directives = parseCspDirectives(cspHeader);
    const scriptSrc = directives.get('script-src') || [];
    const frameSrc = directives.get('frame-src') || [];
    const connectSrc = directives.get('connect-src') || [];

    expect(scriptSrc).toContain('https://apis.google.com');
    expect(scriptSrc).toContain('https://www.gstatic.com');
    expect(scriptSrc).toContain('https://www.google.com');
    expect(scriptSrc).toContain('https://accounts.google.com');
    expect(scriptSrc).toContain('https://static.cloudflareinsights.com');

    expect(frameSrc).toContain("'self'");
    expect(frameSrc).toContain('https://duyheheh-2a269.firebaseapp.com');
    expect(frameSrc).toContain('https://accounts.google.com');
    expect(frameSrc).toContain('https://apis.google.com');

    expect(connectSrc).toContain('https:');
  });

  it('public/sw.js bỏ qua các route /__/auth/* và /__/firebase/*', () => {
    const sw = fs.readFileSync(path.resolve(process.cwd(), 'public/sw.js'), 'utf8');
    expect(sw).toMatch(/url\.pathname\.startsWith\(['"]\/__\/['"]\)/);
  });

  it('translateAuthError dịch đầy đủ các mã lỗi đăng nhập Google', () => {
    expect(translateAuthError('auth/internal-error')).toBe('Lỗi hệ thống, vui lòng thử lại sau.');
    expect(translateAuthError('auth/popup-blocked')).toMatch(/popup/i);
    expect(translateAuthError('auth/unauthorized-domain')).toMatch(/quyền/i);
    expect(translateAuthError('auth/web-storage-unsupported')).toMatch(/cookie|bộ nhớ/i);
    expect(translateAuthError('auth/operation-not-supported-in-this-environment')).toMatch(/môi trường|trình duyệt/i);
  });
});
