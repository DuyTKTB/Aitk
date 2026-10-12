/* ============================================================
   omr.js — Nhận dạng phiếu trả lời trắc nghiệm (OMR) ngay trên trình duyệt
   ------------------------------------------------------------
   Mẫu phiếu: "Phiếu trả lời trắc nghiệm" THPT 2025 (40 câu nhiều lựa chọn,
   8 câu Đúng/Sai, 6 câu trả lời ngắn, SBD 6 số, mã đề 3 số).
   Tọa độ mẫu đo từ 1 bản quét A4 300dpi (2480 x 3508). Nếu in phiếu
   khác mẫu, chỉ cần sửa các mảng trong TEMPLATE bên dưới.

   Không phụ thuộc thư viện ngoài. Chạy được cả trên Node (để test).

   Cách dùng:
     const res = readSheet({ data, width, height });   // data: RGBA (ImageData.data)
     res.ok === false  → res.error là lý do (không thấy vạch định vị...)
     res.sbd, res.code, res.p1, res.p2, res.p3, res.issues, res.quality

   Nguyên lý:
     1. Tìm 4 vạch đen ở 4 góc phiếu (và các vạch dọc mép phải) → homography
        đưa ảnh về hệ tọa độ mẫu, chịu được nghiêng/xoay/chụp lệch.
     2. Dùng KÊNH ĐỎ (R): mực in đỏ/hồng của phiếu gần như "biến mất" ở kênh R,
        còn chì/bút đen/xanh thì tối → đo độ đen của ô tô không bị nhiễu bởi
        nền hồng, viền ô, số in trong ô.
     3. Mỗi ô: độ đen = 1 - (R trung bình trong ô) / (R vòng nền quanh ô).
   ============================================================ */

/* ============ TEMPLATE (tọa độ trên bản quét 2480 x 3508) ============ */
export const TEMPLATE = {
  width: 2480,
  height: 3508,
  bubbleR: 17,
  corners: { TL: [69, 104], TR: [2405, 107], BR: [2408, 3398], BL: [67, 3396] },
  // Vạch định vị (tâm). Dùng để tinh chỉnh homography và kiểm tra khớp.
  marks: [
    [67, 3396], [69, 104], [265, 3396], [365, 3396], [464, 3396], [563, 3396], [825, 3397], [924, 3397],
    [1024, 3397], [1126, 3398], [1387, 3397], [1485, 3397], [1585, 3397], [1683, 3397], [1948, 3397],
    [2045, 3397], [2144, 3398], [2243, 3399], [2404, 527], [2404, 596], [2405, 107], [2405, 389],
    [2405, 458], [2405, 665], [2405, 734], [2405, 803], [2405, 872], [2405, 941], [2405, 1010],
    [2405, 1513], [2405, 1631], [2406, 1276], [2406, 1336], [2406, 1394], [2406, 1454], [2406, 1572],
    [2406, 1690], [2406, 1750], [2406, 1808], [2406, 2108], [2406, 2167], [2406, 2226], [2406, 2286],
    [2407, 2623], [2407, 2682], [2407, 2742], [2407, 2801], [2407, 2861], [2407, 3097], [2407, 3156],
    [2407, 3215], [2408, 2920], [2408, 2978], [2408, 3038], [2408, 3398],
  ],
  // SBD (6 cột) và Mã đề (3 cột): mỗi cột có 10 ô, hàng 0..9
  idX: [1822.6, 1870.6, 1918.2, 1966.7, 2014.5, 2063.1],
  codeX: [2198.3, 2244.6, 2293.5],
  digitY: [386.9, 456.5, 526.2, 594.7, 663.7, 732.2, 802.0, 870.5, 940.0, 1009.5],
  // Phần I: 4 khối x 10 hàng x 4 cột (A,B,C,D). Câu = khối*10 + hàng + 1
  p1X: [
    [266.1, 365.3, 466.1, 563.7],
    [824.6, 923.7, 1023.7, 1125.6],
    [1385.9, 1482.8, 1581.5, 1680.4],
    [1943.3, 2044.1, 2142.9, 2239.7],
  ],
  p1Y: [1274.4, 1334.0, 1393.0, 1452.4, 1511.4, 1570.2, 1629.6, 1688.8, 1747.9, 1806.9],
  // Phần II: 4 khối, mỗi khối 2 câu x (Đúng, Sai). Hàng a,b,c,d
  p2X: [
    [265.8, 364.5, 464.5, 562.5],
    [822.0, 923.5, 1022.5, 1125.2],
    [1384.8, 1482.0, 1581.5, 1681.0],
    [1942.8, 2042.2, 2141.2, 2239.8],
  ],
  p2Y: [2106.6, 2165.9, 2224.9, 2284.3],
  // Phần III: 6 câu, mỗi câu 4 cột. Hàng: dấu "-" (chỉ cột 1), dấu "," (cột 2,3), chữ số 0..9
  p3X: [
    [251.3, 312.1, 370.6, 430.5],
    [610.2, 668.1, 727.8, 786.8],
    [966.3, 1026.1, 1088.5, 1149.2],
    [1325.8, 1385.4, 1443.6, 1502.7],
    [1681.9, 1741.0, 1801.3, 1861.1],
    [2040.0, 2099.4, 2157.7, 2217.4],
  ],
  p3MinusY: 2620.7,
  p3CommaY: 2680.5,
  p3DigitY: [2740.5, 2800.0, 2859.0, 2918.1, 2977.4, 3036.5, 3095.7, 3154.8, 3213.8, 3273.0],
};

/* ============ NGƯỠNG ============ */
const DEFAULTS = {
  markThreshold: 0.20,   // độ đen >= ngưỡng → coi là đã tô
  faintBand: 0.07,       // trong vùng ngưỡng ± faintBand → báo "mờ, cần xem lại"
  detectMaxDim: 1400,    // thu nhỏ ảnh về cỡ này để tìm vạch định vị
};

/* ============ TIỆN ÍCH ẢNH ============ */
function extractChannel(img, ch) {
  const { data, width: w, height: h } = img;
  const out = new Uint8Array(w * h);
  for (let i = 0, j = ch; i < out.length; i++, j += 4) out[i] = data[j];
  return out;
}

function downscale(chan, w, h, maxDim) {
  const s = Math.min(1, maxDim / Math.max(w, h));
  if (s >= 1) return { chan, w, h, s: 1 };
  const nw = Math.max(1, Math.round(w * s));
  const nh = Math.max(1, Math.round(h * s));
  const out = new Uint8Array(nw * nh);
  const bx = w / nw;
  const by = h / nh;
  for (let y = 0; y < nh; y++) {
    const y0 = Math.floor(y * by);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * by));
    for (let x = 0; x < nw; x++) {
      const x0 = Math.floor(x * bx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * bx));
      let sum = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        const row = yy * w;
        for (let xx = x0; xx < x1; xx++) { sum += chan[row + xx]; n++; }
      }
      out[y * nw + x] = sum / n;
    }
  }
  return { chan: out, w: nw, h: nh, s: nw / w };
}

function otsu(chan) {
  const hist = new Float64Array(256);
  for (let i = 0; i < chan.length; i++) hist[chan[i]]++;
  const total = chan.length;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let wB = 0;
  let sumB = 0;
  let best = 0;
  let bestT = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; bestT = t; }
  }
  return bestT;
}

function bilinear(chan, w, h, x, y) {
  if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return null;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const a = chan[y0 * w + x0];
  const b = chan[y0 * w + x1];
  const c = chan[y1 * w + x0];
  const d = chan[y1 * w + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

/* ============ HOMOGRAPHY ============ */
// Giải hệ tuyến tính n x n (Gauss, chọn trụ). Trả null nếu suy biến.
function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

// Bình phương tối thiểu: tìm H (3x3, h33 = 1) sao cho dst ≈ H(src). Cần >= 4 cặp điểm.
function fitHomography(src, dst) {
  // chuẩn hóa để ma trận không bị xấu điều kiện
  const sS = 1000;
  const sD = Math.max(...dst.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])))) || 1;
  const AtA = Array.from({ length: 8 }, () => new Array(8).fill(0));
  const Atb = new Array(8).fill(0);
  for (let i = 0; i < src.length; i++) {
    const x = src[i][0] / sS;
    const y = src[i][1] / sS;
    const u = dst[i][0] / sD;
    const v = dst[i][1] / sD;
    const rows = [
      [[x, y, 1, 0, 0, 0, -u * x, -u * y], u],
      [[0, 0, 0, x, y, 1, -v * x, -v * y], v],
    ];
    for (const [r, t] of rows) {
      for (let a = 0; a < 8; a++) {
        Atb[a] += r[a] * t;
        for (let c = 0; c < 8; c++) AtA[a][c] += r[a] * r[c];
      }
    }
  }
  const h = solveLinear(AtA, Atb);
  if (!h) return null;
  // H chuẩn hóa: (u,v) = sD * Hn(x/sS, y/sS)
  const [a, b, c, d, e, f, g, hh] = h;
  return (X, Y) => {
    const x = X / sS;
    const y = Y / sS;
    const w = g * x + hh * y + 1;
    return [((a * x + b * y + c) / w) * sD, ((d * x + e * y + f) / w) * sD];
  };
}

/* ============ TÌM VẠCH ĐỊNH VỊ ============ */
function findMarks(small) {
  const { chan, w, h } = small;
  // Ngưỡng thích ứng cục bộ: điểm tối hơn nền xung quanh ~30% (chịu được bóng đổ / sáng không đều)
  const integ = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += chan[y * w + x];
      integ[(y + 1) * (w + 1) + x + 1] = integ[y * (w + 1) + x + 1] + row;
    }
  }
  const rad = Math.max(12, Math.round(0.04 * Math.max(w, h)));
  const bin = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - rad);
    const y1 = Math.min(h, y + rad + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - rad);
      const x1 = Math.min(w, x + rad + 1);
      const sum = integ[y1 * (w + 1) + x1] - integ[y0 * (w + 1) + x1] - integ[y1 * (w + 1) + x0] + integ[y0 * (w + 1) + x0];
      const bg = sum / ((x1 - x0) * (y1 - y0));
      bin[y * w + x] = chan[y * w + x] < bg * 0.70 && chan[y * w + x] < 170 ? 1 : 0;
    }
  }

  const visited = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const comps = [];
  for (let start = 0; start < bin.length; start++) {
    if (!bin[start] || visited[start]) continue;
    let sp = 0;
    stack[sp++] = start;
    visited[start] = 1;
    let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    while (sp) {
      const p = stack[--sp];
      const y = (p / w) | 0;
      const x = p - y * w;
      n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
      if (x > 0 && bin[p - 1] && !visited[p - 1]) { visited[p - 1] = 1; stack[sp++] = p - 1; }
      if (x < w - 1 && bin[p + 1] && !visited[p + 1]) { visited[p + 1] = 1; stack[sp++] = p + 1; }
      if (y > 0 && bin[p - w] && !visited[p - w]) { visited[p - w] = 1; stack[sp++] = p - w; }
      if (y < h - 1 && bin[p + w] && !visited[p + w]) { visited[p + w] = 1; stack[sp++] = p + w; }
    }
    if (n < 12) continue;
    const mx = sx / n;
    const my = sy / n;
    const a = sxx / n - mx * mx + 1 / 12;
    const c = syy / n - my * my + 1 / 12;
    const b = sxy / n - mx * my;
    const tr = (a + c) / 2;
    const dd = Math.sqrt(((a - c) / 2) ** 2 + b * b);
    const l1 = tr + dd;
    const l2 = Math.max(1e-6, tr - dd);
    const L = Math.sqrt(12 * l1);
    const W = Math.sqrt(12 * l2);
    comps.push({ n, x: mx, y: my, L, W, ratio: L / W, fill: n / (L * W) });
  }

  const maxDim = Math.max(w, h);
  let cand = comps.filter(
    (m) => m.ratio >= 1.9 && m.ratio <= 4.8 && m.fill > 0.75 && m.fill < 1.25
      && m.W >= 0.0014 * maxDim && m.L >= 0.006 * maxDim && m.L <= 0.045 * maxDim && m.n >= 20,
  );
  if (cand.length >= 4) {
    // Các vạch định vị có kích thước gần như giống hệt nhau → lấy nhóm đông nhất
    let bestSet = [];
    for (const c of cand) {
      const set = cand.filter((o) => Math.abs(o.L - c.L) < 0.2 * c.L && Math.abs(o.W - c.W) < 0.3 * c.W);
      if (set.length > bestSet.length) bestSet = set;
    }
    // Phối cảnh làm vạch xa nhỏ hơn vạch gần → nới dần kích thước quanh nhóm chính
    const Lm = bestSet.map((m) => m.L).sort((p, q) => p - q)[Math.floor(bestSet.length / 2)];
    cand = cand.filter((m) => m.L > 0.55 * Lm && m.L < 1.8 * Lm);
  }
  return cand;
}

/* Thử nhiều cách chọn 4 góc (mỗi góc xét 4 ứng viên "ngoài cùng nhất", 4 hướng xoay),
   chọn cách khiến nhiều vạch mẫu trùng với vạch phát hiện nhất. Chịu được vạch giả do nhiễu. */
function findBestAlignment(marks, sc, tol) {
  const top3 = (fn, dir) => [...marks].sort((p, q) => dir * (fn(q) - fn(p))).slice(0, 4);
  const cTL = top3((m) => m.x + m.y, -1);
  const cTR = top3((m) => m.x - m.y, 1);
  const cBR = top3((m) => m.x + m.y, 1);
  const cBL = top3((m) => m.x - m.y, -1);
  const tc = TEMPLATE.corners;
  const src4 = [tc.TL, tc.TR, tc.BR, tc.BL];
  let best = null;
  for (const a of cTL) for (const b of cTR) for (const c of cBR) for (const d of cBL) {
    const P = [a, b, c, d];
    if (new Set(P).size < 4) continue;
    for (let sh = 0; sh < 4; sh++) {
      const dst = [P[sh], P[(sh + 1) % 4], P[(sh + 2) % 4], P[(sh + 3) % 4]].map((p) => [p.x * sc, p.y * sc]);
      const H = fitHomography(src4, dst);
      if (!H) continue;
      let hit = 0;
      let dsum = 0;
      for (const t of TEMPLATE.marks) {
        const [pu, pv] = H(t[0], t[1]);
        let bd = tol;
        for (const mk of marks) {
          const dd = Math.hypot(mk.x * sc - pu, mk.y * sc - pv);
          if (dd < bd) bd = dd;
        }
        if (bd < tol) { hit++; dsum += bd; }
      }
      const score = hit - (hit ? (dsum / hit / tol) * 0.5 : 0);
      if (!best || score > best.score) best = { score, hit, H };
    }
  }
  return best;
}

/* ============ ĐO Ô TÔ ============ */
function makeSampler(chanR, chanG, w, h, H) {
  const R = TEMPLATE.bubbleR;
  const step = 2.4;
  const disc = [];
  const rin = R * 0.62;
  for (let dy = -rin; dy <= rin; dy += step) {
    for (let dx = -rin; dx <= rin; dx += step) if (dx * dx + dy * dy <= rin * rin) disc.push([dx, dy]);
  }
  const ann = [];
  const rA = R * 1.4;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    ann.push([Math.cos(a) * rA, Math.sin(a) * rA]);
  }
  const ringPts = [];
  const rr = R;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    ringPts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  const at = (chan, cx, cy, dx, dy) => {
    const [u, v] = H(cx + dx, cy + dy);
    return bilinear(chan, w, h, u, v);
  };

  function measure(cx, cy) {
    let s = 0;
    let n = 0;
    for (const [dx, dy] of disc) {
      const v = at(chanR, cx, cy, dx, dy);
      if (v !== null) { s += v; n++; }
    }
    const refs = [];
    for (const [dx, dy] of ann) {
      const v = at(chanR, cx, cy, dx, dy);
      if (v !== null) refs.push(v);
    }
    if (n < disc.length * 0.7 || refs.length < 8) return { fill: 0, oob: true };
    refs.sort((p, q) => p - q);
    // trung vị của phần sáng hơn: tránh bị kéo xuống bởi nét bút/chì ngoài ô
    const ref = refs[Math.floor(refs.length * 0.7)];
    const mean = s / n;
    const fill = ref > 40 ? Math.max(0, Math.min(1, 1 - mean / ref)) : 0;
    return { fill, oob: false };
  }

  // Điểm "khớp lưới": viền ô in màu hồng-đỏ → kênh G (xanh lá) tối hơn quanh bán kính R
  function ringScore(cx, cy) {
    let ring = 0, rn = 0, around = 0, an = 0;
    for (const [dx, dy] of ringPts) {
      const v = at(chanG, cx, cy, dx, dy);
      if (v !== null) { ring += v; rn++; }
    }
    for (const [dx, dy] of ann) {
      const v = at(chanG, cx, cy, dx, dy);
      if (v !== null) { around += v; an++; }
    }
    if (!rn || !an) return 0;
    return (around / an - ring / rn) / 255;
  }
  return { measure, ringScore };
}

/* ============ HÀM CHÍNH ============ */
export function readSheet(img, options = {}) {
  const opt = { ...DEFAULTS, ...options };
  const { width: w, height: h } = img;
  if (!img?.data || !w || !h) return { ok: false, error: 'Ảnh không hợp lệ.' };

  const chanR = extractChannel(img, 0);
  const chanG = extractChannel(img, 1);
  const small = downscale(chanR, w, h, opt.detectMaxDim);

  // 1) Vạch định vị
  const marks = findMarks(small);
  if (marks.length < 6) {
    return { ok: false, error: 'Không thấy các vạch đen định vị. Chụp thẳng, đủ sáng, thấy rõ cả 4 góc phiếu.' };
  }
  const sc = 1 / small.s;
  const toFull = (p) => [p.x * sc, p.y * sc];
  // Dung sai khớp vạch = 40% chiều dài vạch (khoảng cách giữa các vạch ≥ 1,3 chiều dài) → không khớp nhầm sang vạch bên cạnh
  const Ls = marks.map((m) => m.L).sort((p, q) => p - q);
  const matchTol = 0.4 * Ls[Math.floor(Ls.length / 2)] * sc;
  const best = findBestAlignment(marks, sc, matchTol);
  if (!best || best.hit < 18) {
    return { ok: false, error: 'Không nhận ra khung phiếu (thiếu vạch ở mép phải/dưới). Chụp lại đủ cả phiếu, đủ sáng, không bị che.' };
  }
  let H = best.H;

  // 2) Tinh chỉnh: ghép mọi vạch tìm được với vạch mẫu gần nhất, giải lại H
  const refineOnce = (Hcur) => {
    const S = [];
    const D = [];
    // Hnghịch bằng cách thử: với mỗi vạch mẫu, dự đoán vị trí trong ảnh rồi tìm vạch phát hiện gần nhất
    const tol = matchTol;
    for (const t of TEMPLATE.marks) {
      const [pu, pv] = Hcur(t[0], t[1]);
      let best = null;
      let bd = tol;
      for (const mk of marks) {
        const d = Math.hypot(mk.x * sc - pu, mk.y * sc - pv);
        if (d < bd) { bd = d; best = mk; }
      }
      if (best) { S.push(t); D.push(toFull(best)); }
    }
    return { S, D };
  };
  let matched = 0;
  for (let it = 0; it < 2; it++) {
    const { S, D } = refineOnce(H);
    matched = S.length;
    if (S.length >= 8) {
      const H2 = fitHomography(S, D);
      if (H2) H = H2;
    }
  }
  const markFit = matched / TEMPLATE.marks.length;

  // 3) Đo mọi ô
  const T = TEMPLATE;
  const sampler = makeSampler(chanR, chanG, w, h, H);
  const grid = (xs, ys) => ys.map((y) => xs.map((x) => sampler.measure(x, y).fill));

  const idFill = T.idX.map((x) => T.digitY.map((y) => sampler.measure(x, y).fill));       // [col][digit]
  const codeFill = T.codeX.map((x) => T.digitY.map((y) => sampler.measure(x, y).fill));
  const p1Fill = []; // [q][4]
  for (let b = 0; b < 4; b++) {
    const g = grid(T.p1X[b], T.p1Y); // [row][col]
    g.forEach((row) => p1Fill.push(row));
  }
  const p2Fill = []; // [q][ý][2]
  for (let b = 0; b < 4; b++) {
    for (let k = 0; k < 2; k++) {
      const q = [];
      for (let r = 0; r < 4; r++) {
        q.push([
          sampler.measure(T.p2X[b][k * 2], T.p2Y[r]).fill,
          sampler.measure(T.p2X[b][k * 2 + 1], T.p2Y[r]).fill,
        ]);
      }
      p2Fill.push(q);
    }
  }
  const p3Fill = T.p3X.map((xs) => xs.map((x, c) => ({
    minus: c === 0 ? sampler.measure(x, T.p3MinusY).fill : 0,
    comma: c === 1 || c === 2 ? sampler.measure(x, T.p3CommaY).fill : 0,
    digits: T.p3DigitY.map((y) => sampler.measure(x, y).fill),
  })));

  // Chất lượng căn chỉnh: viền ô phải rơi đúng chỗ
  let rs = 0;
  let rn = 0;
  for (let b = 0; b < 4; b++) {
    for (let r = 0; r < 10; r += 3) for (let c = 0; c < 4; c++) { rs += sampler.ringScore(T.p1X[b][c], T.p1Y[r]); rn++; }
  }
  const alignment = rn ? rs / rn : 0;

  // 4) Giải mã
  const thr = opt.markThreshold;
  const band = opt.faintBand;
  const issues = [];
  const isOn = (f) => f >= thr;
  const isFaint = (f) => f > thr - band && f < thr + band;

  // chọn 1 trong n ô: trả { idx, state }  state: ok | blank | multi
  const pickOne = (fills) => {
    const on = [];
    fills.forEach((f, i) => { if (isOn(f)) on.push(i); });
    if (!on.length) return { idx: -1, state: 'blank', faint: fills.some(isFaint) };
    if (on.length === 1) return { idx: on[0], state: 'ok', faint: isFaint(fills[on[0]]) };
    on.sort((a, b) => fills[b] - fills[a]);
    // 1 ô đen đậm hơn hẳn ô còn lại → coi ô đó là đáp án (ô kia có thể là tẩy chưa sạch)
    if (fills[on[0]] > fills[on[1]] * 1.7) return { idx: on[0], state: 'ok', faint: true, dominant: true };
    return { idx: on[0], state: 'multi', all: on, faint: true };
  };

  const digitsOf = (cols, label) => cols.map((col, ci) => {
    const r = pickOne(col);
    if (r.state === 'blank') { issues.push({ part: label, pos: ci + 1, type: 'blank' }); return '?'; }
    if (r.state === 'multi') { issues.push({ part: label, pos: ci + 1, type: 'multi' }); return '?'; }
    if (r.faint) issues.push({ part: label, pos: ci + 1, type: 'faint' });
    return String(r.idx);
  }).join('');
  const sbd = digitsOf(idFill, 'sbd');
  const code = digitsOf(codeFill, 'code');

  const letters = ['A', 'B', 'C', 'D'];
  const p1 = p1Fill.map((fills, qi) => {
    const r = pickOne(fills);
    if (r.state === 'multi') { issues.push({ part: 'p1', q: qi + 1, type: 'multi' }); return '*'; }
    if (r.state === 'ok' && r.faint) issues.push({ part: 'p1', q: qi + 1, type: 'faint' });
    return r.idx >= 0 ? letters[r.idx] : null;
  });

  const p2 = p2Fill.map((rows, qi) => rows.map((pair, yi) => {
    const r = pickOne(pair);
    if (r.state === 'multi') { issues.push({ part: 'p2', q: qi + 1, y: 'abcd'[yi], type: 'multi' }); return '*'; }
    if (r.state === 'ok' && r.faint) issues.push({ part: 'p2', q: qi + 1, y: 'abcd'[yi], type: 'faint' });
    return r.idx === 0 ? 'D' : r.idx === 1 ? 'S' : null;
  }));

  const p3 = p3Fill.map((cols, qi) => {
    let s = '';
    cols.forEach((col, ci) => {
      // ứng viên: các chữ số + ("-" cột 1) + ("," cột 2,3)
      const labels = [];
      const fills = [];
      if (ci === 0) { labels.push('-'); fills.push(col.minus); }
      if (ci === 1 || ci === 2) { labels.push(','); fills.push(col.comma); }
      col.digits.forEach((f, d) => { labels.push(String(d)); fills.push(f); });
      const r = pickOne(fills);
      if (r.state === 'multi') {
        issues.push({ part: 'p3', q: qi + 1, pos: ci + 1, type: 'multi' });
        s += '?';
      } else if (r.state === 'ok') {
        if (r.faint) issues.push({ part: 'p3', q: qi + 1, pos: ci + 1, type: 'faint' });
        s += labels[r.idx];
      }
      // blank → cột trống, bỏ qua
    });
    return s;
  });

  // Ngưỡng có hợp lý không: phân bố độ đen toàn phiếu
  const allFills = [
    ...idFill.flat(), ...codeFill.flat(), ...p1Fill.flat(), ...p2Fill.flat(2),
  ];
  const marked = allFills.filter(isOn).length;
  const mid = allFills.filter(isFaint).length;

  return {
    ok: true,
    sbd, code, p1, p2, p3,
    issues,
    quality: {
      markFit: +markFit.toFixed(2),
      alignment: +alignment.toFixed(3),
      marked,
      uncertain: mid,
      threshold: thr,
      warn: markFit < 0.5 || alignment < 0.03
        ? 'Ảnh có thể bị lệch/méo — kiểm tra kỹ kết quả hoặc chụp lại.'
        : null,
    },
    raw: { idFill, codeFill, p1Fill, p2Fill, p3Fill },
  };
}

/* Tiện ích cho UI: đọc File/Blob ảnh → ImageData (thu nhỏ nếu quá lớn) */
export async function fileToImageData(file, maxDim = 3200) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * s);
  const h = Math.round(bmp.height * s);
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return ctx.getImageData(0, 0, w, h);
}
