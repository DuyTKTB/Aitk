// ====== API SERVICE — VIP từ Firestore (field tier) + Fallback localStorage ======

import { auth, db } from '../lib/firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { askAI as callModel, compressImage } from '../lib/ai.js';

export const UPGRADE_URL = '/vip';

const ELEMENT_SYSTEM =
  'Bạn là "ELEC AI Assistant", trợ lý Khoa học Tự nhiên THPT Việt Nam (3 môn Vật lí, Hóa học, Sinh học lớp 10-12) của ELEC AI. ' +
  'Giải thích rõ ràng, đúng bản chất, có ví dụ, tối đa khoảng 150 từ, mỗi ý một dòng. ' +
  'Không dùng LaTeX; viết công thức bằng Unicode (H₂O, Fe³⁺, 3d⁶). Khi được yêu cầu trả JSON thì chỉ trả JSON thuần.';

export class VipRequiredError extends Error {
  constructor(message = 'Cần nâng cấp VIP') {
    super(message);
    this.name = 'VipRequiredError';
  }
}

/* ============================================================
   Check VIP từ 1 Firestore doc — hỗ trợ nhiều field name
   ============================================================ */
export function checkVipFromDoc(data) {
  if (!data) return false;

  // Các field name có thể có (theo thứ tự ưu tiên)
  const vipFields = ['vip', 'isVip', 'is_vip', 'premium'];
  const tierFields = ['tier', 'plan', 'subscription', 'package'];
  const roleFields = ['role'];

  // 1. Check boolean fields
  for (const f of vipFields) {
    if (data[f] === true) return true;
  }

  // 2. Check tier/plan string
  for (const f of tierFields) {
    const val = String(data[f] || '').toLowerCase().trim();
    if (val === 'vip' || val === 'premium' || val === 'pro' || val === 'pro_max' || val === 'admin') {
      return true;
    }
  }

  // 3. Check role
  for (const f of roleFields) {
    const val = String(data[f] || '').toLowerCase().trim();
    if (val === 'vip' || val === 'admin') return true;
  }

  // 4. Check expiry — nếu có vipUntil mà chưa hết hạn thì vẫn coi là VIP
  const until = data.vipUntil || data.until || data.expiresAt || data.expiredAt;
  if (until) {
    const expTime = new Date(until).getTime();
    if (!isNaN(expTime) && expTime > Date.now()) {
      // Có hạn dùng còn hiệu lực + có field tier/premium
      const hasTier = tierFields.some((f) => data[f]);
      if (hasTier) return true;
    }
  }

  return false;
}

/* Đọc VIP từ localStorage — Khóa chặt bảo mật, chặn can thiệp console */
function readLocalVip() {
  try {
    const raw = localStorage.getItem('cs-vip-status');
    if (!raw) return { vip: false, plan: 'free' };

    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      return { vip: false, plan: 'free' };
    }

    if (data && typeof data === 'object' && (data.isPro || data.vip)) {
      if (data.expiry) {
        const expMs = new Date(data.expiry).getTime();
        if (Number.isNaN(expMs) || expMs <= Date.now()) {
          localStorage.removeItem('cs-vip-status');
          return { vip: false, plan: 'free' };
        }
      }
      return {
        vip: true,
        plan: data.plan || 'VIP',
        until: data.expiry || null,
        isAdmin: false, // Tuyệt đối không cấp Admin qua localStorage
        source: 'verified_cache',
      };
    }

    return { vip: false, plan: 'free' };
  } catch {
    return { vip: false, plan: 'free' };
  }
}

/* ============================================================
   fetchPlan — Firestore ưu tiên, fallback localStorage
   ============================================================ */
export async function fetchPlan() {
  const user = auth?.currentUser;

  if (!user) {
    return readLocalVip();
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() || {};
      const isVip = checkVipFromDoc(data);

      if (isVip) {
        return {
          vip: true,
          plan: data.tier || data.plan || 'vip',
          until: data.vipUntil || data.until || null,
          isAdmin: data.role === 'admin',
          displayName: data.displayName || user.displayName || user.email,
          source: 'firestore',
        };
      }

      // Firestore nói KHÔNG VIP → fallback localStorage (admin/dev)
      const local = readLocalVip();
      if (local.vip) return local;

      return {
        vip: false,
        plan: 'free',
        displayName: data.displayName || user.displayName || user.email,
        source: 'firestore',
      };
    }

    // Chưa có doc → fallback
    const local = readLocalVip();
    if (local.vip) return local;
    return { vip: false, plan: 'free', source: 'no-doc' };
  } catch (e) {
    console.warn('[fetchPlan] Firestore lỗi, fallback localStorage:', e);
    return readLocalVip();
  }
}

/* ============================================================
   Helper set VIP local
   ============================================================ */
export function setVipStorage(vipData) {
  try {
    const value = typeof vipData === 'string' ? vipData : JSON.stringify(vipData);
    localStorage.setItem('cs-vip', value);
    window.dispatchEvent(new Event('cs-vip-update'));
    return true;
  } catch (e) {
    console.error('[setVipStorage] lỗi:', e);
    return false;
  }
}

export function clearVipStorage() {
  try {
    localStorage.removeItem('cs-vip');
    window.dispatchEvent(new Event('cs-vip-update'));
  } catch { /* */ }
}

/* ============================================================
   AI
   ============================================================ */
export function askAI(historyOrPrompt, options = {}) {
  if (Array.isArray(historyOrPrompt)) {
    const [history, onChunk, onReasoning, system] = arguments;
    return callModel(history, onChunk, onReasoning, system);
  }
  const { onChunk = () => {}, system = ELEMENT_SYSTEM } = options;
  const history = [{ role: 'user', parts: [{ text: String(historyOrPrompt) }] }];
  return callModel(history, onChunk, null, system);
}

export { compressImage };

export default {
  askAI,
  fetchPlan,
  setVipStorage,
  clearVipStorage,
  compressImage,
  UPGRADE_URL,
  VipRequiredError,
};