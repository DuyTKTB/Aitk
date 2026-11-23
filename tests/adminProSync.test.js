import { describe, expect, it, vi, beforeEach } from 'vitest';

function makeLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(String(k), String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

vi.stubGlobal('localStorage', makeLocalStorage());
vi.stubGlobal('window', { dispatchEvent: vi.fn() });
vi.stubGlobal('CustomEvent', class CustomEvent {
  constructor(type, opts) {
    this.type = type;
    this.detail = opts?.detail;
  }
});

const mockUpsert = vi.fn(async () => ({ error: null }));
const mockUpdateEq = vi.fn(async () => ({ error: null }));
const mockSetDoc = vi.fn(async () => {});
const mockDoc = vi.fn((_db, col, id) => ({ col, id }));

vi.mock('../src/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'pro_users') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  user_id: 'u-pro-1',
                  key_code: 'PRO-ABCD-1234',
                  expiry: new Date(Date.now() + 5 * 86400000).toISOString(),
                  duration_days: 30,
                  note: 'Giáo viên PRO',
                },
                error: null,
              }),
            }),
          }),
          update: (payload) => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    user_id: 'u-pro-1',
                    key_code: 'PRO-ABCD-1234',
                    expiry: payload.expiry,
                    duration_days: payload.duration_days,
                    note: 'Giáo viên PRO',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {
        upsert: mockUpsert,
        update: () => ({ eq: mockUpdateEq }),
      };
    }),
  },
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  collection: vi.fn(),
  getDocs: vi.fn(async () => ({ forEach: () => {} })),
  query: vi.fn((x) => x),
  limit: vi.fn((n) => n),
}));

vi.mock('../src/lib/firebase.js', () => ({
  db: { __mock: true },
  auth: { currentUser: null },
}));

import {
  isStudentVipRecord,
  adminSyncUserRole,
  adminExtendProUser,
  adminResetTeacherTrialQuota,
} from '../src/lib/proKeyApi.js';
import {
  incrementWordImportTrialUsed,
  getWordImportTrialRemaining,
  incrementManualEntryTrialUsed,
  getManualEntryTrialRemaining,
  incrementOmrTrialUsed,
  getOmrTrialRemaining,
} from '../src/lib/entitlements.js';

describe('Admin VIP/PRO & Firestore/Supabase Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== 'undefined') localStorage.clear();
  });

  it('isStudentVipRecord distinguishes Student VIP (299k/year) from Teacher PRO (999k/year)', () => {
    expect(isStudentVipRecord({ key_code: 'VIP-1111-2222', note: '[STUDENT_VIP:365] HS VIP' })).toBe(true);
    expect(isStudentVipRecord({ key_code: 'DIRECT-9999', note: '[STUDENT_VIP:365]' })).toBe(true);
    expect(isStudentVipRecord({ key_code: 'PRO-AAAA-BBBB', note: 'Giáo viên PRO 999k' })).toBe(false);
    expect(isStudentVipRecord({ key_code: 'DIRECT-1234', note: 'Cấp GV tổ Hóa' })).toBe(false);
    expect(isStudentVipRecord(null)).toBe(false);
  });

  it('adminSyncUserRole updates both Supabase profiles and Firestore users', async () => {
    await adminSyncUserRole('uid-gv-1', 'teacher', { display_name: 'Cô Hoa', email: 'hoa@school.vn' });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'uid-gv-1', role: 'teacher', display_name: 'Cô Hoa', email: 'hoa@school.vn' }),
      { onConflict: 'id' },
    );
    expect(mockSetDoc).toHaveBeenCalledWith(
      { col: 'users', id: 'uid-gv-1' },
      expect.objectContaining({ role: 'teacher', displayName: 'Cô Hoa', email: 'hoa@school.vn', source: 'admin_role_sync' }),
      { merge: true },
    );

    const storedMeta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
    expect(storedMeta['uid-gv-1']?.role).toBe('teacher');
  });

  it('adminExtendProUser extends Supabase expiry and syncs proUntil to Firestore', async () => {
    const res = await adminExtendProUser('u-pro-1', 30);
    expect(res.duration_days).toBe(60);
    expect(mockSetDoc).toHaveBeenCalledWith(
      { col: 'users', id: 'u-pro-1' },
      expect.objectContaining({
        tier: 'pro',
        plan: 'PRO',
        pro: true,
        proUntil: res.expiry,
        vipUntil: res.expiry,
        source: 'admin_extend',
      }),
      { merge: true },
    );
  });

  it('adminResetTeacherTrialQuota restores 10 Word, 30 Manual, and 5 OMR free trials', async () => {
    const uid = 'uid-free-teacher';
    incrementWordImportTrialUsed(uid, 10);
    incrementManualEntryTrialUsed(uid, 30);
    incrementOmrTrialUsed(uid, 5);

    expect(getWordImportTrialRemaining(uid, false)).toBe(0);
    expect(getManualEntryTrialRemaining(uid, false)).toBe(0);
    expect(getOmrTrialRemaining(uid, false)).toBe(0);

    const out = await adminResetTeacherTrialQuota(uid);
    expect(out.ok).toBe(true);
    expect(getWordImportTrialRemaining(uid, false)).toBe(10);
    expect(getManualEntryTrialRemaining(uid, false)).toBe(30);
    expect(getOmrTrialRemaining(uid, false)).toBe(5);
    expect(mockSetDoc).toHaveBeenCalledWith(
      { col: 'users', id: uid },
      expect.objectContaining({
        wordImportsUsed: 0,
        manualExamsUsed: 0,
        omrSheetsUsed: 0,
      }),
      { merge: true },
    );
  });
});
