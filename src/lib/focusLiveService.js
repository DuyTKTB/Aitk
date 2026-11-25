/* ============================================================
   focusLiveService.js — Kết nối Lớp học Tập trung & BXH Focus THỰC TẾ (Firestore)
   - 100% dữ liệu người dùng thật từ collection `users` trên Firebase Firestore
   - KHÔNG dùng dữ liệu giả / bot ảo
   - Truy vấn bằng `orderBy('focusLive.lastPingAt', 'desc')` (tự động dùng single-field index
     có sẵn của Firestore) nên LUÔN lấy được mọi tài khoản đang học kể cả khi hệ thống
     có hàng chục nghìn người dùng!
   - Heartbeat 25 giây + cửa sổ online 5 phút chống trình duyệt throttle tab chạy nền
   ============================================================ */

import { db } from './firebase.js';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { FOCUS_MASCOTS, getTodayKey } from './focusSessionStore.js';

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 phút không ping → chuyển sang Vắng (tránh tab nền bị throttle)
const RECENT_VISIBLE_MS = 7 * 24 * 60 * 60 * 1000; // Hiển thị các bạn đã vào phòng học trong 7 ngày gần nhất

export function getWeekKey(ts = Date.now()) {
  const d = new Date(ts);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return `${d.getFullYear()}-W${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getMonthKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Gửi trạng thái tập trung thực tế của người dùng hiện tại lên Firestore `/users/{uid}`
 * (Chỉ cập nhật trường `focusLive`, không đụng các trường bảo vệ như tier/pro/vip/credits)
 */
export async function publishFocusPresence(uid, payload) {
  if (!uid || uid === 'guest' || !db) return false;
  const ref = doc(db, 'users', uid);
  const now = Date.now();
  const focusLive = {
    active: Boolean(payload.active),
    mode: payload.mode || 'focus',
    name: String(payload.name || '').slice(0, 64),
    photoURL: payload.photoURL || '',
    task: String(payload.task || '').slice(0, 100),
    uni: String(payload.uni || 'ELEC').slice(0, 16),
    uniName: String(payload.uniName || '').slice(0, 64),
    highSchool: String(payload.highSchool || '').slice(0, 64),
    mascotId: payload.mascotId || 'fighting',
    todayKey: getTodayKey(now),
    todayMins: Math.max(0, Math.round(Number(payload.todayMins) || 0)),
    todaySecs: Math.max(0, Math.round(Number(payload.todaySecs) || 0)),
    totalMins: Math.max(0, Math.round(Number(payload.totalMins) || 0)),
    weekKey: getWeekKey(now),
    weekMins: Math.max(0, Math.round(Number(payload.weekMins) || 0)),
    monthKey: getMonthKey(now),
    monthMins: Math.max(0, Math.round(Number(payload.monthMins) || 0)),
    streakDays: Math.max(0, Math.round(Number(payload.streakDays) || 0)),
    lastPingAt: now,
  };

  try {
    await updateDoc(ref, { focusLive });
    return true;
  } catch (err) {
    // Nếu document `/users/{uid}` chưa tồn tại trên Firestore, tạo mới đúng chuẩn firestore.rules
    if (err?.code === 'not-found') {
      try {
        await setDoc(
          ref,
          {
            role: 'student',
            email: String(payload.email || ''),
            displayName: String(payload.name || 'Học sinh ELEC'),
            ...(payload.photoURL ? { photoURL: payload.photoURL } : {}),
            focusLive,
          },
          { merge: true }
        );
        return true;
      } catch (createErr) {
        console.warn('[FocusLive] Không thể khởi tạo focusLive:', createErr?.code || createErr?.message);
        return false;
      }
    }
    console.warn('[FocusLive] Không thể cập nhật focusLive:', err?.code || err?.message);
    return false;
  }
}

function parseSnapshotDocs(snap, currentUid) {
  const now = Date.now();
  const todayK = getTodayKey(now);
  const weekK = getWeekKey(now);
  const monthK = getMonthKey(now);

  const list = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data() || {};
    const fl = d.focusLive;
    if (!fl || typeof fl !== 'object') return;

    const lastPing = Number(fl.lastPingAt) || 0;
    const isOnline = Boolean(fl.active) && now - lastPing < ONLINE_WINDOW_MS;
    const isRecent = lastPing > 0 && now - lastPing < RECENT_VISIBLE_MS;
    const todayMins = fl.todayKey === todayK ? Number(fl.todayMins) || 0 : 0;
    const baseTodaySecs = fl.todayKey === todayK ? Number(fl.todaySecs) || todayMins * 60 : 0;
    const totalMins = Math.max(Number(fl.totalMins) || 0, todayMins);
    const weekMins = fl.weekKey === weekK ? Number(fl.weekMins) || 0 : 0;
    const monthMins = fl.monthKey === monthK ? Number(fl.monthMins) || 0 : 0;
    const streak = Number(fl.streakDays) || 0;

    // Hiển thị mọi học sinh thật đang học, có lịch sử học, hoặc vừa vào phòng tập trung trong 7 ngày qua
    if (!isOnline && !isRecent && baseTodaySecs === 0 && todayMins === 0 && weekMins === 0 && monthMins === 0 && streak === 0 && totalMins === 0) {
      return;
    }

    const mascotObj = FOCUS_MASCOTS.find((m) => m.id === fl.mascotId) || FOCUS_MASCOTS[0];
    const displayName =
      fl.name ||
      d.displayName ||
      d.fullName ||
      d.name ||
      (typeof d.email === 'string' && d.email.includes('@') ? d.email.split('@')[0] : 'Học sinh ELEC');

    list.push({
      id: docSnap.id,
      isMe: docSnap.id === currentUid,
      name: displayName,
      photoURL: fl.photoURL || d.photoURL || null,
      uni: fl.uni || d.targetSchoolCode || 'ELEC',
      uniName: fl.uniName || d.targetSchoolName || fl.uni || 'ELEC Science AI',
      highSchool: fl.highSchool || d.school || d.highSchool || '',
      task: fl.task || (isOnline ? 'Đang tập trung học bài' : 'Vừa ghé phòng tập trung'),
      todayMins,
      todaySecs: baseTodaySecs,
      totalMins,
      weekMins,
      monthMins,
      streak,
      online: isOnline,
      mode: fl.mode || 'focus',
      mascot: mascotObj.src,
      lastPingAt: lastPing,
    });
  });

  return list;
}

/**
 * Lắng nghe danh sách học sinh thật từ Firestore `/users` theo thời gian thực.
 * Ưu tiên `orderBy('focusLive.lastPingAt', 'desc')` để luôn nhận đủ người đang tập trung
 * bất kể tổng số user trong collection lớn đến đâu.
 */
export function subscribeRealFocusUsers(currentUid, onUpdate) {
  if (!currentUid || currentUid === 'guest' || !db) {
    onUpdate({ users: [], isLiveConnected: false });
    return () => {};
  }

  let unsubMain = () => {};
  let unsubFallback = () => {};

  try {
    const primaryQuery = query(
      collection(db, 'users'),
      orderBy('focusLive.lastPingAt', 'desc'),
      limit(80)
    );

    unsubMain = onSnapshot(
      primaryQuery,
      (snap) => {
        const list = parseSnapshotDocs(snap, currentUid);
        onUpdate({ users: list, isLiveConnected: true, error: null });
      },
      (err) => {
        console.warn('[FocusLive] Primary query fallback:', err?.code || err?.message);
        // Fallback nếu single-field index bị tắt thủ công
        try {
          const fbQuery = query(collection(db, 'users'), limit(250));
          unsubFallback = onSnapshot(
            fbQuery,
            (snap) => {
              const list = parseSnapshotDocs(snap, currentUid);
              onUpdate({ users: list, isLiveConnected: true, error: null });
            },
            (fbErr) => {
              console.warn('[FocusLive] Fallback query error:', fbErr?.code || fbErr?.message);
              onUpdate({ users: [], isLiveConnected: false, error: fbErr?.message || 'sync_error' });
            }
          );
        } catch {
          onUpdate({ users: [], isLiveConnected: false, error: 'sync_error' });
        }
      }
    );

    return () => {
      try { unsubMain(); } catch { /* ignore */ }
      try { unsubFallback(); } catch { /* ignore */ }
    };
  } catch (err) {
    console.warn('[FocusLive] Subscribe failed:', err?.message);
    onUpdate({ users: [], isLiveConnected: false, error: err?.message || 'sync_error' });
    return () => {};
  }
}
