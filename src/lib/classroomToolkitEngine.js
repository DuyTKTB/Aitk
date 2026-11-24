/* ============================================================
   classroomToolkitEngine.js — Thuật toán Dạy học Trên lớp
   Lấy cảm hứng từ SeatWise, RandomGroupGenerator & ClassroomScreen:
     • generateAntiCheatSeating: Sơ đồ phòng thi tô màu mã đề 2D
       (2 HS ngồi cạnh trái/phải/trước/sau KHÔNG BAO GIỜ trùng mã đề!)
     • generateBalancedGroups: Chia nhóm thảo luận Snake-Draft cân bằng lực học
     • pickFairRandomStudent: Gọi tên ngẫu nhiên công bằng không lặp
   ============================================================ */

function fisherYates(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tạo sơ đồ chỗ ngồi phòng thi (rows × cols) + tự động gán mã đề chống nhìn bài.
 * Thuật toán 2D Shift Coloring đảm bảo mã đề (r, c) luôn khác (r, c-1), (r, c+1), (r-1, c), (r+1, c)
 * khi có từ 2 mã đề trở lên (và khác cả 4 hướng chéo gần khi có ≥ 4 mã đề).
 */
export function generateAntiCheatSeating({
  students = [],
  rows = 6,
  cols = 4,
  examCodes = ['101', '102', '103', '104'],
  mode = 'random', // 'random' | 'alpha' | 'mentor'
  rng = Math.random,
} = {}) {
  const rCount = Math.max(1, Math.min(12, Math.floor(Number(rows) || 6)));
  const cCount = Math.max(1, Math.min(10, Math.floor(Number(cols) || 4)));
  const codes = Array.isArray(examCodes) && examCodes.length > 0 ? examCodes : ['101', '102', '103', '104'];

  let ordered = (Array.isArray(students) ? students : []).filter(Boolean).map((s, idx) => ({
    id: s.id || s.uid || `s_${idx}`,
    name: s.name || s.studentName || `Học sinh ${idx + 1}`,
    avgScore: typeof s.avgScore === 'number' ? s.avgScore : null,
  }));

  if (mode === 'alpha') {
    ordered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } else if (mode === 'mentor') {
    // Ghép học sinh điểm cao xen kẽ học sinh cần kèm (top 1 cạnh bottom 1)
    const sorted = [...ordered].sort((a, b) => (b.avgScore ?? 5) - (a.avgScore ?? 5));
    const interleaved = [];
    let lo = 0;
    let hi = sorted.length - 1;
    while (lo <= hi) {
      interleaved.push(sorted[lo++]);
      if (lo <= hi) interleaved.push(sorted[hi--]);
    }
    ordered = interleaved;
  } else {
    ordered = fisherYates(ordered, rng);
  }

  const grid = [];
  let idx = 0;
  const k = codes.length;
  // Bước dịch hàng đảm bảo (r, c) ≠ (r-1, c) và với k >= 4 còn tránh trùng cả đường chéo
  const rowShift = k >= 4 ? 2 : 1;

  for (let r = 0; r < rCount; r++) {
    const rowCells = [];
    for (let c = 0; c < cCount; c++) {
      const student = idx < ordered.length ? ordered[idx++] : null;
      const codeIndex = (c + r * rowShift) % k;
      rowCells.push({
        row: r,
        col: c,
        seatLabel: `${String.fromCharCode(65 + c)}${r + 1}`,
        student,
        examCode: student ? codes[codeIndex] : null,
        codeIndex,
      });
    }
    grid.push(rowCells);
  }

  return {
    rows: rCount,
    cols: cCount,
    grid,
    seatedCount: Math.min(ordered.length, rCount * cCount),
    overflowStudents: ordered.slice(rCount * cCount),
    codes,
  };
}

/**
 * Chia lớp thành K nhóm thảo luận:
 *  - 'snake': xếp theo đường zic-zac (1→K rồi K→1) theo điểm TB để mọi nhóm cân bằng lực học
 *  - 'random': xáo ngẫu nhiên đều sĩ số
 */
export function generateBalancedGroups({
  students = [],
  groupCount = 4,
  mode = 'random', // 'random' | 'snake'
  rng = Math.random,
} = {}) {
  const clean = (Array.isArray(students) ? students : []).filter(Boolean).map((s, idx) => ({
    id: s.id || s.uid || `s_${idx}`,
    name: s.name || s.studentName || `Học sinh ${idx + 1}`,
    avgScore: typeof s.avgScore === 'number' ? s.avgScore : null,
  }));

  const k = Math.max(2, Math.min(12, Math.floor(Number(groupCount) || 4), Math.max(2, clean.length)));
  const groups = Array.from({ length: k }, (_, i) => ({
    index: i + 1,
    name: `Nhóm ${i + 1}`,
    members: [],
    avgScore: null,
  }));

  if (clean.length === 0) return groups;

  if (mode === 'snake') {
    const sorted = [...clean].sort((a, b) => (b.avgScore ?? 5) - (a.avgScore ?? 5));
    sorted.forEach((st, i) => {
      const round = Math.floor(i / k);
      const pos = i % k;
      const targetGroup = round % 2 === 0 ? pos : k - 1 - pos;
      groups[targetGroup].members.push(st);
    });
  } else {
    const shuffled = fisherYates(clean, rng);
    shuffled.forEach((st, i) => {
      groups[i % k].members.push(st);
    });
  }

  groups.forEach((g) => {
    const scored = g.members.filter((m) => typeof m.avgScore === 'number');
    g.avgScore = scored.length
      ? Math.round((scored.reduce((a, b) => a + b.avgScore, 0) / scored.length) * 10) / 10
      : null;
  });

  return groups;
}

/**
 * Xuất danh sách nhóm dạng văn bản sạch đẹp để dán thẳng vào nhóm Zalo lớp.
 */
export function formatGroupsForZalo(groups = [], className = '') {
  const header = className ? `DANH SÁCH CHIA NHÓM — LỚP ${className.toUpperCase()}` : 'DANH SÁCH CHIA NHÓM THẢO LUẬN';
  const body = (groups || [])
    .map((g) => {
      const names = (g.members || []).map((m, i) => `  ${i + 1}. ${m.name}`).join('\n');
      return `${g.name} (${g.members.length} HS):\n${names || '  (Trống)'}`;
    })
    .join('\n\n');
  return `${header}\n${body}`;
}

/**
 * Gọi tên ngẫu nhiên công bằng (không lặp lại cho tới khi gọi hết lớp).
 */
export function pickFairRandomStudent({ students = [], calledIds = [], rng = Math.random } = {}) {
  const list = (Array.isArray(students) ? students : []).filter(Boolean);
  if (!list.length) return { picked: null, resetCycle: false };
  const calledSet = new Set(calledIds || []);
  let pool = list.filter((s) => !calledSet.has(s.id || s.uid || s.name));
  let resetCycle = false;
  if (pool.length === 0) {
    pool = list;
    resetCycle = true;
  }
  const picked = pool[Math.floor(rng() * pool.length)];
  return { picked, resetCycle };
}
