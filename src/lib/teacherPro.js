/* ============================================================
   TEACHER PRO — Firestore version
   ============================================================ */
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

/* ============ GENERATE KEY ============ */
export function generateProKey() {
  const p1 = Math.random().toString(36).slice(2, 6).toUpperCase();
  const p2 = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PRO-${p1}-${p2}`;
}

/* ============ ADMIN ============ */
export async function adminCreateProKey({ durationDays = 30, note = '' }) {
  const data = {
    code: generateProKey(),
    durationDays,
    note,
    createdAt: serverTimestamp(),
    usedBy: null,
    usedAt: null,
  };
  const ref = await addDoc(collection(db, 'proKeys'), data);
  return { id: ref.id, ...data };
}

export async function adminGetAllKeys() {
  const snap = await getDocs(collection(db, 'proKeys'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function adminDeleteKey(keyId) {
  await deleteDoc(doc(db, 'proKeys', keyId));
}

/* ============ USER KÍCH HOẠT ============ */
export async function activateProKey(userId, keyCode) {
  const code = String(keyCode).trim().toUpperCase();

  const q = query(collection(db, 'proKeys'), where('code', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) {
    return { ok: false, error: 'Key không tồn tại.' };
  }

  const keyDoc = snap.docs[0];
  const key = { id: keyDoc.id, ...keyDoc.data() };

  if (key.usedBy && key.usedBy !== userId) {
    return { ok: false, error: 'Key đã được sử dụng bởi tài khoản khác.' };
  }

  await updateDoc(doc(db, 'proKeys', key.id), {
    usedBy: userId,
    usedAt: serverTimestamp(),
  });

  const now = new Date();
  const expiry = new Date(now.getTime() + key.durationDays * 864e5);

  const existingSnap = await getDoc(doc(db, 'proUsers', userId));
  let newExpiry = expiry;

  if (existingSnap.exists()) {
    const existing = existingSnap.data();
    if (existing.expiry && new Date(existing.expiry) > now) {
      newExpiry = new Date(new Date(existing.expiry).getTime() + key.durationDays * 864e5);
    }
    await updateDoc(doc(db, 'proUsers', userId), {
      key: key.code,
      expiry: newExpiry.toISOString(),
      durationDays: key.durationDays,
    });
  } else {
    await setDoc(doc(db, 'proUsers', userId), {
      key: key.code,
      expiry: newExpiry.toISOString(),
      durationDays: key.durationDays,
      activatedAt: now.toISOString(),
    });
  }

  return {
    ok: true,
    pro: { key: key.code, expiry: newExpiry.toISOString() },
    expiry: newExpiry.toISOString(),
  };
}

/* ============ LẤY TRẠNG THÁI ============ */
export async function getProStatus(userId) {
  try {
    const snap = await getDoc(doc(db, 'proUsers', userId));
    if (!snap.exists()) return { isPro: false };

    const pro = snap.data();
    const expiry = new Date(pro.expiry);
    const now = new Date();
    const isPro = expiry > now;
    const daysLeft = Math.ceil((expiry - now) / 864e5);

    return {
      isPro,
      pro,
      expiry: pro.expiry,
      daysLeft: isPro ? daysLeft : 0,
      expired: !isPro,
    };
  } catch {
    return { isPro: false };
  }
}

export async function revokePro(userId) {
  await deleteDoc(doc(db, 'proUsers', userId));
}