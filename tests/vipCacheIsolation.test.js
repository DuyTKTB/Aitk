import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function makeLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(String(k), String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

const { mockMaybeSingle, mockGetDoc, mockAuthState } = vi.hoisted(() => ({
  mockMaybeSingle: vi.fn(),
  mockGetDoc: vi.fn(),
  mockAuthState: { currentUser: null },
}));

vi.mock('../src/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
        ilike: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  },
}));

vi.mock('../src/lib/firebase.js', () => ({
  auth: mockAuthState,
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: vi.fn(async () => {}),
}));

import { getProStatus } from '../src/lib/proKeyApi.js';
import { fetchPlan } from '../src/services/api.js';

describe('VIP / PRO Cross-Account Cache Isolation', () => {
  let prevStorage;
  beforeEach(() => {
    prevStorage = globalThis.localStorage;
    globalThis.localStorage = makeLocalStorage();
    mockMaybeSingle.mockReset();
    mockGetDoc.mockReset();
    mockAuthState.currentUser = null;
  });

  afterEach(() => {
    globalThis.localStorage = prevStorage;
  });

  it('rejects foreign or unscoped cs-vip-status for a Free user in getProStatus', async () => {
    const future = new Date(Date.now() + 30 * 86400000).toISOString();
    localStorage.setItem('cs-vip-status', JSON.stringify({
      isPro: true,
      isVip: true,
      tier: 'vip',
      plan: 'VIP',
      expiry: future,
    }));
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const freeStatus = await getProStatus('free-user-123', 'free@gmail.com');
    expect(freeStatus.isPro).toBe(false);
    expect(localStorage.getItem('cs-vip-status')).toBeNull();

    localStorage.setItem('cs-vip-status', JSON.stringify({
      uid: 'vip-other-user',
      isPro: true,
      isVip: true,
      tier: 'pro',
      plan: 'PRO',
      expiry: future,
    }));
    const freeStatus2 = await getProStatus('free-user-123', 'free@gmail.com');
    expect(freeStatus2.isPro).toBe(false);
    expect(localStorage.getItem('cs-vip-status')).toBeNull();
  });

  it('rejects cs-user-subscription missing expiry so stale cache cannot stay Forever PRO/VIP', async () => {
    localStorage.setItem('cs-user-subscription:free-u1', JSON.stringify({
      planName: 'VIP',
      hearts: 99,
    }));
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const status = await getProStatus('free-u1', 'free@gmail.com');
    expect(status.isPro).toBe(false);
    expect(localStorage.getItem('cs-user-subscription:free-u1')).toBeNull();
  });

  it('never lets stale local cs-vip-status override an explicit Free Firestore doc or logged-out guest in fetchPlan', async () => {
    const future = new Date(Date.now() + 30 * 86400000).toISOString();
    localStorage.setItem('cs-vip-status', JSON.stringify({
      uid: 'other-admin-uid',
      isPro: true,
      vip: true,
      plan: 'VIP',
      expiry: future,
    }));

    const guestPlan = await fetchPlan();
    expect(guestPlan.vip).toBe(false);

    mockAuthState.currentUser = { uid: 'free-student-uid', email: 'student@free.vn' };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ tier: 'free', role: 'student' }),
    });
    const freePlan = await fetchPlan();
    expect(freePlan.vip).toBe(false);
    expect(freePlan.plan).toBe('free');
  });
});
