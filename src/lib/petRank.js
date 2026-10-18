/* ============================================================
   petRank.js — NỐI LINH VẬT ELEC AI VỚI BẢNG XẾP HẠNG
   ------------------------------------------------------------
   Đọc điểm game lưu trong localStorage (cs-game:*:leaderboard,
   cs-game:sudoku:best), tính thứ hạng của người dùng theo tên
   và tạo câu trả lời tiếng Việt cho khung chat của pet.
   ============================================================ */

const GAME_LABELS = {
  chicken: 'Bắt gà trả lời',
  slingshot: 'Bắn slingshot',
  mines: 'Dò mìn quiz',
};

const labelFor = (game) => GAME_LABELS[game] || game.charAt(0).toUpperCase() + game.slice(1);

/* Quét localStorage, trả về [{ game, label, entries }] — entries đã sắp điểm giảm dần */
export function getAllLeaderboards() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const m = key.match(/^cs-game:([a-z0-9-]+):(leaderboard|best)$/);
      if (!m) continue;
      let arr;
      try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch { continue; }
      if (!Array.isArray(arr) || !arr.length) continue;
      const entries = arr
        .filter((e) => e && typeof e === 'object')
        .map((e) => ({ name: String(e.name || '').trim(), score: Number(e.score ?? e.time ?? 0) }))
        .filter((e) => e.name && Number.isFinite(e.score))
        .sort((a, b) => b.score - a.score);
      if (entries.length) out.push({ game: m[1], label: labelFor(m[1]), entries });
    }
  } catch { /* localStorage không khả dụng */ }
  return out;
}

/* Tìm thứ hạng tốt nhất của người dùng trong 1 bảng (theo tên, không phân biệt hoa thường) */
function findRank(entries, name) {
  const target = String(name || '').trim().toLowerCase();
  if (!target) return null;
  const idx = entries.findIndex((e) => e.name.toLowerCase() === target);
  if (idx === -1) return null;
  return { rank: idx + 1, score: entries[idx].score, total: entries.length };
}

/* Top 3 của bảng xếp hạng "đẹp" nhất (nhiều người chơi nhất) */
export function topSummary() {
  const boards = getAllLeaderboards();
  if (!boards.length) return null;
  const best = boards.slice().sort((a, b) => b.entries.length - a.entries.length)[0];
  return {
    label: best.label,
    top3: best.entries.slice(0, 3).map((e, i) => `${i + 1}. ${e.name} — ${e.score}`),
  };
}

/* Câu trả lời của ELEC AI khi được hỏi về bảng xếp hạng */
export function rankReply(displayName) {
  const boards = getAllLeaderboards();
  if (!boards.length) {
    return 'Chưa có điểm nào trên bảng xếp hạng cả! Chơi 1 ván Bắt gà hoặc Bắn slingshot đi, mình ghi danh cho bạn ngay!';
  }
  const mine = [];
  for (const b of boards) {
    const r = findRank(b.entries, displayName);
    if (r) mine.push({ ...r, label: b.label, top: b.entries[0] });
  }
  if (mine.length) {
    mine.sort((a, b) => a.rank - b.rank);
    const best = mine[0];
    const parts = mine.map((m) => `${m.label}: hạng ${m.rank}/${m.total} (${m.score} điểm)`);
    const crown = best.rank === 1 ? ' Bạn đang dẫn đầu bảng, đỉnh thật!' : '';
    const chase = best.rank > 1 && best.top ? ` Đang đuổi theo ${best.top.name} (${best.top.score} điểm) — cố lên!` : '';
    return `Thành tích của bạn nè:${crown} ${parts.join(' · ')}.${chase}`;
  }
  const t = topSummary();
  if (t) {
    return `Mình chưa thấy tên "${displayName}" trên bảng xếp hạng — nhớ nhập đúng tên này khi chơi nhé! TOP 3 ${t.label} hiện tại: ${t.top3.join(', ')}.`;
  }
  return 'Bảng xếp hạng đang trống — bạn lên hàng đầu luôn đi!';
}

/* ============================================================
   HÀM MỚI: myBestRank 
   Lấy thứ hạng cao nhất của người dùng (dùng cho PetWidget.jsx)
   ============================================================ */
export function myBestRank(displayName) {
  const boards = getAllLeaderboards();
  const mine = [];
  
  for (const b of boards) {
    const r = findRank(b.entries, displayName);
    if (r) mine.push({ ...r, label: b.label });
  }
  
  // Nếu không có tên trong bảng xếp hạng nào
  if (mine.length === 0) return null;
  
  // Sắp xếp để lấy thứ hạng tốt nhất (số rank nhỏ nhất)
  mine.sort((a, b) => a.rank - b.rank);
  
  // Trả về object chứa thông tin hạng cao nhất
  return mine[0]; 
}