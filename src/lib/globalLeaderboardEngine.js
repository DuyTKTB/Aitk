/* ============================================================================
   globalLeaderboardEngine.js — Động cơ Xếp Hạng Chuẩn Thực Tế ELEC AI
   ----------------------------------------------------------------------------
   Nguyên tắc công bằng & minh bạch:
   1. 100% dữ liệu thật từ Firestore (không hash ảo, không tạo học sinh giả).
   2. Chuỗi lớp kiểm tra hạn ngày theo giờ Việt Nam (UTC+7) qua getClassStreakStatus
      + cộng hưởng hoạt động thực tế của các thành viên trong lớp (tổng chuỗi, XP,
      phút tập trung, sĩ số thật) để lớp 40 học sinh không bao giờ thua lớp test 1 người.
   3. Chuẩn xếp hạng đồng hạng Olympic / Standard Competition (1, 2, 2, 4) khi
      chỉ số bằng nhau tuyệt đối; không trao "Quán Quân" cho tài khoản/lớp 0 điểm.
   4. Bảng "Học Sinh Xuất Sắc" lọc chuẩn học sinh thật (có tùy chọn hiện thêm GV/Admin)
      và tính Điểm Thành Tích tổng hợp từ XP + Phút Focus + Chuỗi + Độ chính xác.
   5. Bảng "Quân đoàn NV1" chỉ tổng hợp từ người dùng THẬT đã chọn nguyện vọng ĐH.
   ============================================================================ */
import { getClassStreakStatus, getVietnamDateKey } from './chatStreak.js';
import { checkVipFromDoc } from '../services/api.js';

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Chuẩn hóa 1 bản ghi người dùng từ Firestore `users/{uid}`
 */
export function normalizeUserForLeaderboard(raw = {}, { currentUid = '', currentLiveStreak = 0 } = {}) {
  const uid = raw.uid || raw.id || '';
  const pub = raw.public && typeof raw.public === 'object' ? raw.public : {};
  const focus = raw.focusLive && typeof raw.focusLive === 'object' ? raw.focusLive : {};
  const sp = raw.socialProfile && typeof raw.socialProfile === 'object' ? raw.socialProfile : {};

  const xp = Math.max(0, Math.round(toNum(pub.xp ?? raw.xp, 0)));
  const derivedLevel = xp > 0 ? Math.floor(xp / 100) + 1 : 1;
  const level = Math.max(1, Math.round(toNum(pub.level ?? raw.level, derivedLevel)));

  const rawStreakNum =
    typeof raw.streak === 'number'
      ? raw.streak
      : typeof raw.streak === 'object' && raw.streak !== null
        ? toNum(raw.streak.count, 0)
        : 0;
  let streak = Math.max(
    0,
    Math.round(toNum(pub.streak, 0)),
    Math.round(rawStreakNum),
    Math.round(toNum(focus.streakDays, 0))
  );

  // Đồng bộ trực tiếp ngọn lửa hiện tại của chính người dùng đang xem
  if (currentUid && uid === currentUid) {
    streak = Math.max(streak, Math.round(toNum(currentLiveStreak, 0)));
  }

  const focusMins = Math.max(0, Math.round(toNum(focus.totalMins, 0)));
  const rawAcc = pub.accuracy ?? raw.accuracy;
  const accuracy =
    rawAcc !== null && rawAcc !== undefined && Number.isFinite(Number(rawAcc))
      ? Math.min(100, Math.max(0, Math.round(Number(rawAcc))))
      : null;
  const totalAnswers = Math.max(0, Math.round(toNum(pub.totalAnswers ?? raw.totalAnswers, 0)));

  // Điểm thành tích thực tế minh bạch:
  // XP + 5 * Phút tập trung + 25 * Chuỗi ngày + thưởng độ chính xác (nếu đã làm >= 5 câu)
  const accBonus = accuracy !== null && totalAnswers >= 5 ? Math.round(accuracy * 2) : 0;
  const meritScore = xp + focusMins * 5 + streak * 25 + accBonus;

  const role = String(raw.role || 'student').toLowerCase();
  const isStaff = role === 'teacher' || role === 'admin';
  const vip = checkVipFromDoc(raw) || raw.tier === 'vip' || pub.tier === 'vip';
  const name = String(raw.displayName || pub.name || raw.name || 'Học sinh ELEC').trim();

  // Trích xuất mã/tên trường NV1 THẬT (nếu học sinh đã khai báo)
  const rawUniCode = String(
    raw.targetUniCode || pub.targetUniCode || raw.nv1SchoolCode || focus.uni || ''
  ).trim().toUpperCase();
  const rawUniName = String(
    sp.targetUni || raw.targetUniversity || raw.nv1SchoolName || focus.uniName || ''
  ).trim();

  return {
    uid,
    name,
    photoURL: raw.photoURL || null,
    role,
    isStaff,
    vip,
    xp,
    level,
    streak,
    focusMins,
    accuracy,
    totalAnswers,
    meritScore,
    hasActivity: meritScore > 0 || xp > 0 || streak > 0 || focusMins > 0 || totalAnswers > 0,
    targetUniCode: rawUniCode && rawUniCode !== 'ELEC' ? rawUniCode : '',
    targetUniName: rawUniName,
    focusLastPingAt: toNum(focus.lastPingAt, 0),
    focusTodayKey: String(focus.todayKey || ''),
  };
}

/**
 * Gán hạng chuẩn đồng hạng (Standard Competition Ranking: 1, 2, 2, 4)
 * Các mục có `eligible === false` (0 hoạt động) được gán rank = null ("Chưa xếp hạng").
 */
export function assignCompetitionRanks(sortedItems, keyFn, eligibleFn = () => true) {
  let lastKey = null;
  let lastRank = 0;
  let rankedPos = 0;

  return sortedItems.map((item) => {
    if (!eligibleFn(item)) {
      return { ...item, rank: null, isTied: false };
    }
    rankedPos += 1;
    const key = keyFn(item);
    const sameAsPrev = lastKey !== null && key === lastKey;
    const rank = sameAsPrev ? lastRank : rankedPos;
    lastKey = key;
    lastRank = rank;
    return { ...item, rank, isTied: sameAsPrev };
  });
}

/**
 * Tạo viết tắt biểu tượng lớp (VD: "Lớp 11A5" -> "11A5", "Lớp Duy Tk" -> "DT")
 */
export function getClassMonogram(name = '') {
  const clean = String(name || '').replace(/^\s*lớp\s+/i, '').trim();
  if (!clean) return 'LH';
  // Nếu ngắn gọn như "11A5", "12A1", "10C2" -> giữ nguyên
  if (clean.length <= 4 && /^[a-z0-9]+$/i.test(clean)) return clean.toUpperCase();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 3).toUpperCase();
}

/**
 * Xếp hạng Lớp học chuẩn thực tế:
 * - Kiểm tra chuỗi lớp còn hiệu lực theo giờ Việt Nam (UTC+7)
 * - Tổng hợp thành tích thật của thành viên trong lớp (tổng chuỗi thành viên, XP, phút Focus, hoạt động hôm nay)
 * - Ưu tiên: Chuỗi lớp hiệu lực -> Kỷ lục chuỗi -> Điểm thi đua thực tế của lớp -> Sĩ số thật
 */
export function rankClassesRealistic(classesList = [], normalizedUsers = [], nowMs = Date.now()) {
  const userById = new Map();
  for (const u of normalizedUsers) {
    if (u?.uid) userById.set(u.uid, u);
  }
  const todayKey = getVietnamDateKey(nowMs);

  const enriched = classesList.map((c) => {
    const memberIdSet = new Set();
    if (Array.isArray(c.memberIds)) {
      c.memberIds.forEach((id) => { if (id) memberIdSet.add(String(id)); });
    }
    if (Array.isArray(c.members)) {
      c.members.forEach((m) => {
        const id = typeof m === 'string' ? m : (m?.id || m?.uid);
        if (id) memberIdSet.add(String(id));
      });
    }
    if (c.teacherId) memberIdSet.add(String(c.teacherId));

    const realMemberCount = Math.max(
      memberIdSet.size,
      toNum(c.memberCount, 0),
      Array.isArray(c.members) ? c.members.length : 0,
      1
    );

    const status = getClassStreakStatus(
      { ...c, memberCount: realMemberCount },
      ''
    );

    let sumMemberStreaks = 0;
    let classTotalXp = 0;
    let classFocusMins = 0;
    let activeMembersToday = status.activeCount;

    const countedToday = new Set(status.activeMembers || []);
    memberIdSet.forEach((mid) => {
      const u = userById.get(mid);
      if (!u) return;
      sumMemberStreaks += u.streak;
      classTotalXp += u.xp;
      classFocusMins += u.focusMins;
      if (u.focusTodayKey === todayKey && !countedToday.has(mid)) {
        countedToday.add(mid);
        activeMembersToday += 1;
      }
    });

    const activeStreak = status.count;
    const record = status.record;
    const avgStreak = realMemberCount > 0 ? Math.round((sumMemberStreaks / realMemberCount) * 10) / 10 : 0;

    // Điểm thi đua thực tế của lớp (công bằng giữa chuỗi tập thể & hoạt động thành viên)
    const classScore =
      activeStreak * 500 +
      record * 120 +
      activeMembersToday * 40 +
      sumMemberStreaks * 15 +
      Math.round(classTotalXp * 0.1) +
      classFocusMins * 2;

    return {
      id: c.id,
      name: String(c.name || 'Lớp học').trim(),
      monogram: getClassMonogram(c.name || 'Lớp học'),
      teacherName: String(c.teacherName || 'Giáo viên bộ môn').trim(),
      teacherId: c.teacherId || '',
      memberIds: [...memberIdSet],
      memberCount: realMemberCount,
      streak: activeStreak,
      record,
      target: status.target,
      activeToday: activeMembersToday,
      completedToday: status.completedToday,
      sumMemberStreaks,
      avgStreak,
      classTotalXp,
      classFocusMins,
      classScore,
      hasActivity: classScore > 0,
    };
  });

  enriched.sort(
    (a, b) =>
      b.streak - a.streak ||
      b.record - a.record ||
      b.classScore - a.classScore ||
      b.memberCount - a.memberCount ||
      a.name.localeCompare(b.name, 'vi')
  );

  return assignCompetitionRanks(
    enriched,
    (c) => `${c.streak}|${c.record}|${c.classScore}|${c.memberCount}`,
    (c) => c.hasActivity || c.memberCount >= 2
  );
}

/**
 * Xếp hạng Học Sinh Xuất Sắc (chuẩn điểm thành tích thực tế)
 */
export function rankStudentsRealistic(normalizedUsers = [], { includeStaff = false } = {}) {
  const pool = includeStaff
    ? [...normalizedUsers]
    : normalizedUsers.filter((u) => !u.isStaff);

  pool.sort(
    (a, b) =>
      b.meritScore - a.meritScore ||
      b.xp - a.xp ||
      b.focusMins - a.focusMins ||
      b.streak - a.streak ||
      (b.accuracy ?? -1) - (a.accuracy ?? -1) ||
      b.level - a.level ||
      a.name.localeCompare(b.name, 'vi')
  );

  return assignCompetitionRanks(
    pool,
    (u) => `${u.meritScore}|${u.xp}|${u.focusMins}|${u.streak}`,
    (u) => u.hasActivity
  );
}

/**
 * Xếp hạng Kỷ Lục Chuỗi Cá Nhân (chỉ vinh danh chuỗi thực >= 1 ngày lên Top)
 */
export function rankPersonalStreaksRealistic(normalizedUsers = [], { includeStaff = false } = {}) {
  const pool = includeStaff
    ? [...normalizedUsers]
    : normalizedUsers.filter((u) => !u.isStaff);

  pool.sort(
    (a, b) =>
      b.streak - a.streak ||
      b.focusMins - a.focusMins ||
      b.xp - a.xp ||
      b.level - a.level ||
      a.name.localeCompare(b.name, 'vi')
  );

  return assignCompetitionRanks(
    pool,
    (u) => `${u.streak}|${u.focusMins}|${u.xp}`,
    (u) => u.streak > 0
  );
}

function normStr(s = '') {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Xếp hạng Quân đoàn NV1 — 100% TỔNG HỢP TỪ SĨ TỬ THẬT (KHÔNG HASH ẢO)
 */
export function rankSquadsRealistic(
  normalizedUsers = [],
  cutoffData = [],
  { currentUid = '', mySquadMetrics = null, myStreak = 0 } = {}
) {
  const catalogByCode = new Map();
  const codeByNormName = [];

  for (const row of cutoffData) {
    const code = String(row.code || '').trim().toUpperCase();
    if (!code || catalogByCode.has(code)) continue;
    catalogByCode.set(code, {
      code,
      uni: row.uni,
      group: row.group || 'Đại học',
      city: row.city || 'Toàn quốc',
      topMajor: row.major || '',
      cutoff: row.s2025 || row.s2024 || null,
      members: 0,
      totalXp: 0,
      totalFocusMins: 0,
      totalStreak: 0,
      totalPower: 0,
      isMine: false,
    });
    if (row.uni) codeByNormName.push([normStr(row.uni), code]);
  }

  const resolveRealCode = (u) => {
    if (u.targetUniCode && catalogByCode.has(u.targetUniCode)) return u.targetUniCode;
    if (u.targetUniName) {
      const targetNorm = normStr(u.targetUniName);
      if (targetNorm.length >= 3) {
        const hit = codeByNormName.find(
          ([uniNorm]) => uniNorm.includes(targetNorm) || targetNorm.includes(uniNorm)
        );
        if (hit) return hit[1];
      }
    }
    return null;
  };

  for (const u of normalizedUsers) {
    if (currentUid && u.uid === currentUid) continue; // tính chính xác bằng dữ liệu live bên dưới
    const code = resolveRealCode(u);
    if (!code) continue; // KHÔNG bịa/hash ngẫu nhiên người chưa chọn NV1!
    const sq = catalogByCode.get(code);
    if (!sq) continue;
    sq.members += 1;
    sq.totalXp += u.xp;
    sq.totalFocusMins += u.focusMins;
    sq.totalStreak += u.streak;
    sq.totalPower += 1000 + u.meritScore;
  }

  // Luôn ghi nhận chính xác Quân đoàn NV1 thật của người dùng hiện tại (nếu đã ghim)
  if (mySquadMetrics?.code) {
    const myCode = String(mySquadMetrics.code).toUpperCase();
    if (!catalogByCode.has(myCode)) {
      catalogByCode.set(myCode, {
        code: myCode,
        uni: mySquadMetrics.uni || myCode,
        group: 'Mục tiêu cá nhân',
        city: 'Toàn quốc',
        topMajor: mySquadMetrics.major || '',
        cutoff: mySquadMetrics.cutoff || null,
        members: 0,
        totalXp: 0,
        totalFocusMins: 0,
        totalStreak: 0,
        totalPower: 0,
        isMine: false,
      });
    }
    const mine = catalogByCode.get(myCode);
    if (mine) {
      const meUser = normalizedUsers.find((u) => currentUid && u.uid === currentUid);
      mine.members += 1;
      mine.totalXp += meUser?.xp || 0;
      mine.totalFocusMins += meUser?.focusMins || 0;
      mine.totalStreak += Math.max(meUser?.streak || 0, toNum(myStreak, 0));
      mine.totalPower += Math.max(toNum(mySquadMetrics.power, 1000), 1000 + (meUser?.meritScore || 0));
      mine.isMine = true;
    }
  }

  // Chỉ đưa vào BXH những quân đoàn có thành viên thật (> 0)
  const activeSquads = Array.from(catalogByCode.values())
    .filter((sq) => sq.members > 0)
    .map((sq) => {
      const avgPower = sq.members > 0 ? Math.round(sq.totalPower / sq.members) : 0;
      const campaignGoal = Math.max(5000, Math.ceil((sq.totalPower + 1200) / 5000) * 5000);
      const campaignPct = Math.min(100, Math.round((sq.totalPower / campaignGoal) * 100));
      return { ...sq, avgPower, campaignGoal, campaignPct };
    });

  activeSquads.sort(
    (a, b) =>
      b.totalPower - a.totalPower ||
      b.members - a.members ||
      b.totalStreak - a.totalStreak ||
      a.uni.localeCompare(b.uni, 'vi')
  );

  return assignCompetitionRanks(
    activeSquads,
    (sq) => `${sq.totalPower}|${sq.members}|${sq.totalStreak}`,
    (sq) => sq.members > 0
  );
}
