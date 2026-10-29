/* ============================================================
   social.js — Lớp MXH của ELEC AI
   ------------------------------------------------------------
   - Kết bạn: users/{uid}/friends/{other} + friendRequests/{from}
   - Tin nhắn riêng: dms/{id} (id = uidA__uidB đã sort)
     + dms/{id}/messages/{msg}
   - Chat lớp học: classes/{classId}/chat/{msg}
   - Hồ sơ công khai: users/{uid}.public (stats học tập, tier)
   - Giới hạn: TỐI ĐA 20 ĐOẠN CHAT RIÊNG mỗi người dùng
   ============================================================ */
import { db } from './firebase.js';
import {
  isValidStreakMessage,
  processFriendStreakUpdate,
  getFriendStreakStatus,
  calculateClassTarget,
  isStreakMilestone,
  getVietnamDateKey,
} from './chatStreak.js';
import { recordDailyStreak, getStreakData, dayKey } from '../hooks.js';
import { checkVipFromDoc } from '../services/api.js';
import {
  doc, setDoc, getDoc, collection, query, where, getDocs, addDoc,
  updateDoc, deleteDoc, limit, onSnapshot, orderBy,
} from 'firebase/firestore';

export const MAX_DM_CONVERSATIONS = 20;
export const MAX_DM_TEXT = 500;

/* ---------- ID hội thoại 2 người ---------- */
export const dmId = (a, b) => [a, b].sort().join('__');

/* ============================================================
   HỒ SƠ CÔNG KHAI
   ============================================================ */

/* Ghi hồ sơ công khai + thống kê học tập (gọi khi mở chat) */
export async function syncMyPublicStats(uid, { displayName, photoURL, level, xp, streak, accuracy, totalAnswers }) {
  if (!uid) return;
  try {
    await setDoc(doc(db, 'users', uid), {
      /* Cập nhật cả tên/ảnh để bạn bè tìm & xem hồ sơ đúng */
      ...(displayName ? { displayName } : {}),
      ...(photoURL ? { photoURL } : {}),
      public: {
        level: level || 1,
        xp: xp || 0,
        streak: streak || 0,
        accuracy: accuracy ?? null,
        totalAnswers: totalAnswers || 0,
        syncedAt: Date.now(),
      },
    }, { merge: true });
  } catch { /* im lặng — stats chỉ là phụ */ }
}

/* Đọc hồ sơ 1 người dùng: { uid, name, photoURL, vip, tier, public } */
export async function getProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return { uid, name: null, photoURL: null, vip: false, tier: 'free', public: null };
    const d = snap.data();
    const vip = checkVipFromDoc(d);
    return {
      uid,
      name: d?.displayName || d?.name || null,
      photoURL: d?.photoURL || null,
      vip,
      tier: vip ? 'vip' : (d?.tier || 'free').toLowerCase(),
      role: d?.role || 'student',
      public: d?.public || null,
    };
  } catch {
    return null;
  }
}

/* Tìm người dùng theo tên HOẶC email chính xác (dùng để kết bạn) */
export async function findUsersByName(name) {
  const q = String(name || '').trim();
  if (!q) return [];
  const map = (snap) => snap.docs.map((d) => {
    const data = d.data() || {};
    const vip = checkVipFromDoc(data);
    return {
      uid: d.id,
      name: data.displayName || data.name || q,
      photoURL: data.photoURL || null,
      vip,
      tier: vip ? 'vip' : 'free',
    };
  });
  try {
    const byName = await getDocs(query(
      collection(db, 'users'),
      where('displayName', '==', q),
      limit(10),
    ));
    if (byName.docs.length) return map(byName);
    /* Fallback: tìm theo email */
    if (q.includes('@')) {
      const byEmail = await getDocs(query(
        collection(db, 'users'),
        where('email', '==', q.toLowerCase()),
        limit(10),
      ));
      return map(byEmail);
    }
    return [];
  } catch {
    return [];
  }
}

/* ============================================================
   KẾT BẠN
   ============================================================ */
export function listenFriends(uid, cb) {
  if (!uid) { cb([]); return () => {}; }
  return onSnapshot(collection(db, 'users', uid, 'friends'), (snap) => {
    cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  }, () => cb([]));
}

export function listenFriendRequests(uid, cb) {
  if (!uid) { cb([]); return () => {}; }
  return onSnapshot(collection(db, 'users', uid, 'friendRequests'), (snap) => {
    cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  }, () => cb([]));
}

/* Gửi lời mời kết bạn → ghi vào hộp của người nhận */
export async function sendFriendRequest(me, targetUid, targetName) {
  if (!me?.uid || !targetUid || me.uid === targetUid) throw new Error('Không thể kết bạn');
  const myName = me.displayName || 'Bạn học';
  const reqRef = doc(db, 'users', targetUid, 'friendRequests', me.uid);
  const myReqRef = doc(db, 'users', me.uid, 'friendRequests', targetUid);
  const [targetSnap, myReqSnap] = await Promise.all([getDoc(doc(db, 'users', targetUid)), getDoc(myReqRef)]);

  /* Nếu NGƯỜI TA đã gửi lời mời cho mình → tự động kết bạn luôn */
  if (myReqSnap.exists()) {
    await acceptFriendRequest(me, { uid: targetUid, name: targetName || myReqSnap.data()?.name });
    return 'accepted';
  }
  await setDoc(reqRef, { uid: me.uid, name: myName, at: Date.now() });
  return 'sent';
}

export async function acceptFriendRequest(me, req) {
  if (!me?.uid || !req?.uid) return;
  const now = Date.now();
  await Promise.all([
    setDoc(doc(db, 'users', me.uid, 'friends', req.uid), { name: req.name || '', since: now }),
    setDoc(doc(db, 'users', req.uid, 'friends', me.uid), { name: me.displayName || '', since: now }),
    deleteDoc(doc(db, 'users', me.uid, 'friendRequests', req.uid)),
  ]);
}

export async function declineFriendRequest(me, fromUid) {
  if (!me?.uid || !fromUid) return;
  await deleteDoc(doc(db, 'users', me.uid, 'friendRequests', fromUid));
}

export async function removeFriend(me, friendUid) {
  if (!me?.uid || !friendUid) return;
  await Promise.all([
    deleteDoc(doc(db, 'users', me.uid, 'friends', friendUid)),
    deleteDoc(doc(db, 'users', friendUid, 'friends', me.uid)),
  ]);
}

/* Kiểm tra quan hệ bạn bè: self | none | friends | requested | incoming
   Mỗi getDoc đều tự bắt lỗi permission — lỗi 1 bước không làm sập cả hàm */
export async function friendStatus(meUid, otherUid) {
  if (!meUid || !otherUid || meUid === otherUid) return 'self';
  const safeGet = async (ref) => {
    try { return await getDoc(ref); } catch { return null; }
  };
  const [fr, rq, out] = await Promise.all([
    safeGet(doc(db, 'users', meUid, 'friends', otherUid)),
    safeGet(doc(db, 'users', otherUid, 'friendRequests', meUid)),
    safeGet(doc(db, 'users', meUid, 'friendRequests', otherUid)),
  ]);
  if (fr?.exists()) return 'friends';
  if (rq?.exists()) return 'incoming';
  if (out?.exists()) return 'requested';
  return 'none';
}

/* ============================================================
   TIN NHẮN RIÊNG — tối đa 20 đoạn chat
   ============================================================ */
export function listenMyDms(uid, cb) {
  if (!uid) { cb([]); return () => {}; }
  const q = query(collection(db, 'dms'), where('members', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => {
      const otherA = (a.members || []).find((u) => u !== uid) || '';
      const otherB = (b.members || []).find((u) => u !== uid) || '';
      const stA = getFriendStreakStatus(a.streak, uid, otherA);
      const stB = getFriendStreakStatus(b.streak, uid, otherB);

      const urgentA = stA.urgent && !stA.bothDone;
      const urgentB = stB.urgent && !stB.bothDone;
      if (urgentA && !urgentB) return -1;
      if (!urgentA && urgentB) return 1;

      if ((stB.count || 0) !== (stA.count || 0)) {
        return (stB.count || 0) - (stA.count || 0);
      }
      return (b.lastAt || 0) - (a.lastAt || 0);
    });
    cb(rows);
  }, () => cb([]));
}

export function listenDmMessages(dmIdStr, cb) {
  if (!dmIdStr) { cb([]); return () => {}; }
  const q = query(collection(db, 'dms', dmIdStr, 'messages'), orderBy('createdAt', 'asc'), limit(100));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, () => cb([]));
}

/* Mở (hoặc tạo) hội thoại với 1 người — chặn nếu đã đủ 20 đoạn chat */
export async function openDm(me, otherUid, otherName) {
  if (!me?.uid || !otherUid || me.uid === otherUid) throw new Error('Không mở được hội thoại');
  const id = dmId(me.uid, otherUid);
  const ref = doc(db, 'dms', id);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id, created: false };

  /* Giới hạn 20 đoạn chat: đếm số dm hiện có của mình */
  const mine = await getDocs(query(collection(db, 'dms'), where('members', 'array-contains', me.uid)));
  const existingIds = new Set(mine.docs.map((d) => d.id));
  if (!existingIds.has(id) && existingIds.size >= MAX_DM_CONVERSATIONS) {
    throw new Error(`Tối đa ${MAX_DM_CONVERSATIONS} đoạn chat — hãy xóa bớt cuộc trò chuyện cũ.`);
  }

  const members = [me.uid, otherUid];
  await setDoc(ref, {
    members,
    names: { [me.uid]: me.displayName || 'Bạn', [otherUid]: otherName || '' },
    lastText: '',
    lastAt: Date.now(),
    createdAt: Date.now(),
  }, { merge: true });
  return { id, created: !snap.exists() };
}

export async function sendDmMessage(dmIdStr, me, text) {
  const t = String(text || '').trim().slice(0, MAX_DM_TEXT);
  if (!dmIdStr || !me?.uid || !t) return;
  try {
    await addDoc(collection(db, 'dms', dmIdStr, 'messages'), {
      uid: me.uid,
      name: me.displayName || 'Bạn',
      text: t,
      createdAt: Date.now(),
    });
    const dmRef = doc(db, 'dms', dmIdStr);
    const dmSnap = await getDoc(dmRef);
    const dmData = dmSnap.exists() ? dmSnap.data() : {};
    const members = Array.isArray(dmData.members) ? dmData.members : [];
    const otherUid = members.find((u) => u !== me.uid) || '';
    const isValid = isValidStreakMessage(t, dmData.lastText || '');
    let streakUpdate = dmData.streak || null;
    if (isValid && otherUid) {
      streakUpdate = processFriendStreakUpdate(dmData.streak, me.uid, otherUid);
      try {
        const cur = getStreakData();
        if (cur.last !== dayKey()) {
          recordDailyStreak();
        }
      } catch { /* ignore */ }
    }
    await updateDoc(dmRef, {
      lastText: t.slice(0, 60),
      lastAt: Date.now(),
      lastUid: me.uid,
      ...(streakUpdate ? { streak: streakUpdate } : {}),
    });
    return;
  } catch (err) {
    console.error('Error sending DM message:', err);
    throw err;
  }
}
async function _legacySendDmMessage(dmIdStr, me, text) {
  const t = String(text || '').trim().slice(0, MAX_DM_TEXT);
  if (!dmIdStr || !me?.uid || !t) return;
  await addDoc(collection(db, 'dms', dmIdStr, 'messages'), {
    uid: me.uid,
    name: me.displayName || 'Bạn',
    text: t,
    createdAt: Date.now(),
  });
  await updateDoc(doc(db, 'dms', dmIdStr), {
    lastText: t.slice(0, 60),
    lastAt: Date.now(),
    lastUid: me.uid,
  });
}

/* Rời/xóa hội thoại (chỉ mình thôi — người kia vẫn thấy) */
export async function deleteDmForMe(dmIdStr) {
  if (!dmIdStr) return;
  await deleteDoc(doc(db, 'dms', dmIdStr));
}

/* ============================================================
   CHAT LỚP HỌC — classes/{classId}/chat
   ============================================================ */
export const MAX_CLASS_TEXT = 500;

export function listenClassChat(classId, cb) {
  if (!classId) { cb([]); return () => {}; }
  const q = query(collection(db, 'classes', classId, 'chat'), orderBy('createdAt', 'asc'), limit(100));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, () => cb([]));
}

export async function sendClassMessage(classId, me, text) {
  const t = String(text || '').trim().slice(0, MAX_CLASS_TEXT);
  if (!classId || !me?.uid || !t) return;
  try {
    await addDoc(collection(db, 'classes', classId, 'chat'), {
      uid: me.uid,
      name: me.displayName || 'Bạn',
      text: t,
      createdAt: Date.now(),
    });

    const isValid = isValidStreakMessage(t);
    if (!isValid) return;

    try {
      const curStreak = getStreakData();
      if (curStreak.last !== dayKey()) {
        recordDailyStreak();
      }
    } catch { /* ignore */ }

    const classRef = doc(db, 'classes', classId);
    const snap = await getDoc(classRef);
    if (!snap.exists()) return;
    const cls = snap.data();

    const today = getVietnamDateKey();
    const yesterday = getVietnamDateKey(Date.now() - 864e5);
    const prevStreak = cls.streak || { count: 0, record: 0, lastDate: '', todayActive: [], completedDate: '' };

    let count = Number(prevStreak.count) || 0;
    let record = Number(prevStreak.record) || count;
    let todayActive = Array.isArray(prevStreak.todayActive) ? [...prevStreak.todayActive] : [];
    let completedDate = prevStreak.completedDate || '';

    if (prevStreak.lastDate !== today) {
      if (prevStreak.lastDate && prevStreak.lastDate !== yesterday) {
        count = 0;
      }
      todayActive = [];
    }

    if (!todayActive.includes(me.uid)) {
      todayActive.push(me.uid);
    }

    const memberCount = Number(cls.memberCount) || (cls.members?.length) || 1;
    const target = calculateClassTarget(memberCount);
    let justReachedThreshold = false;
    let milestoneHit = 0;

    if (todayActive.length >= target && completedDate !== today) {
      count = count + 1;
      completedDate = today;
      if (count > record) record = count;
      justReachedThreshold = true;
      if (isStreakMilestone(count)) {
        milestoneHit = count;
      }
    }

    const updatedStreak = {
      count,
      record,
      lastDate: today,
      completedDate,
      todayActive,
    };

    await updateDoc(classRef, { streak: updatedStreak });

    if (justReachedThreshold) {
      await addDoc(collection(db, 'classes', classId, 'chat'), {
        uid: 'system',
        name: 'Hệ thống',
        isSystem: true,
        text: `🔥 Lớp ${cls.name || ''} đã hoàn thành chỉ tiêu giữ chuỗi ngày thứ ${count}!`,
        createdAt: Date.now(),
      });

      if (milestoneHit) {
        await addDoc(collection(db, 'classes', classId, 'chat'), {
          uid: 'system',
          name: 'Hệ thống',
          isSystem: true,
          isMilestone: true,
          text: `🎉 XUẤT SẮC! Cả lớp đạt mốc chuỗi kỷ lục ${milestoneHit} ngày học tập liên tục! Thưởng +${milestoneHit * 10} XP cho tất cả thành viên!`,
          createdAt: Date.now() + 50,
        });
      }
    }
  } catch (err) {
    console.error('Error in sendClassMessage:', err);
    throw err;
  }
}
async function _legacySendClassMessage(classId, me, text) {
  const t = String(text || '').trim().slice(0, MAX_CLASS_TEXT);
  if (!classId || !me?.uid || !t) return;
  await addDoc(collection(db, 'classes', classId, 'chat'), {
    uid: me.uid,
    name: me.displayName || 'Bạn',
    text: t,
    createdAt: Date.now(),
  });
}
