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
  detectMaxDim: 1600,    // giữ độ phân giải sắc nét khi tách 4 ô góc & vạch mép từ webcam/camera
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
export function fitHomography(src, dst) {
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
      bin[y * w + x] = chan[y * w + x] < bg * 0.74 && chan[y * w + x] < 185 ? 1 : 0;
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
  const refDim = Math.min(maxDim, Math.round(Math.min(w, h) * 1.45));
  let bars = comps.filter(
    (m) => m.ratio >= 1.65 && m.ratio <= 5.2 && m.fill > 0.68 && m.fill < 1.26
      && m.W >= 0.0012 * refDim && m.L >= 0.0052 * refDim && m.L <= 0.052 * maxDim && m.n >= 12,
  );
  if (bars.length >= 4) {
    // Các vạch định vị có kích thước gần như giống hệt nhau → lấy nhóm đông nhất
    let bestSet = [];
    for (const c of bars) {
      const set = bars.filter((o) => Math.abs(o.L - c.L) < 0.24 * c.L && Math.abs(o.W - c.W) < 0.35 * c.W);
      if (set.length > bestSet.length) bestSet = set;
    }
    // Phối cảnh làm vạch xa nhỏ hơn vạch gần → nới dần kích thước quanh nhóm chính
    const Lm = bestSet.map((m) => m.L).sort((p, q) => p - q)[Math.floor(bestSet.length / 2)];
    bars = bars.filter((m) => m.L > 0.55 * Lm && m.L < 1.8 * Lm);
  }

  // 4 ô vuông đen ở 4 góc chuẩn Bộ GD&ĐT / TNMaker (lớn hơn ô tô tròn, tỷ lệ gần vuông 1:1)
  let squares = comps.filter(
    (m) => m.ratio >= 0.80 && m.ratio <= 1.68 && m.fill > 0.72 && m.fill < 1.20
      && m.W >= 0.0078 * refDim && m.L >= 0.0085 * refDim && m.L <= 0.06 * maxDim && m.n >= 18,
  );
  if (squares.length > 4) {
    const largest4 = [...squares].sort((a, b) => b.n - a.n).slice(0, 4);
    const medL = largest4.map((m) => m.L).sort((a, b) => a - b)[1];
    squares = squares.filter((m) => m.L >= 0.62 * medL);
  }

  const barSet = new Set(bars);
  const all = [...squares.filter((s) => !barSet.has(s)), ...bars];
  return { all, bars, squares };
}

/* Thử nhiều cách chọn 4 góc (ưu tiên 4 ô vuông đen ở 4 góc, kết hợp thêm vạch ngoài cùng),
   chọn cách khiến nhiều dấu định vị trùng với mẫu nhất và tạo thành tứ giác A4 hợp lệ. */
function findBestAlignment(marksInfo, sc, tol, imgW, imgH) {
  const { all, squares } = marksInfo;
  const pickExtremal = (arr, fn, dir, limit) => [...arr].sort((p, q) => dir * (fn(q) - fn(p))).slice(0, limit);
  const mergeCorner = (fn, dir) => {
    const out = [];
    const seen = new Set();
    const pushList = (list) => list.forEach((m) => { if (!seen.has(m)) { seen.add(m); out.push(m); } });
    if (squares.length >= 4) pushList(pickExtremal(squares, fn, dir, 3));
    pushList(pickExtremal(all, fn, dir, 4));
    return out.slice(0, 5);
  };

  const cTL = mergeCorner((m) => m.x + m.y, -1);
  const cTR = mergeCorner((m) => m.x - m.y, 1);
  const cBR = mergeCorner((m) => m.x + m.y, 1);
  const cBL = mergeCorner((m) => m.x - m.y, -1);
  const sqSet = new Set(squares);

  const tc = TEMPLATE.corners;
  const src4 = [tc.TL, tc.TR, tc.BR, tc.BL];
  let best = null;
  for (const a of cTL) for (const b of cTR) for (const c of cBR) for (const d of cBL) {
    const P = [a, b, c, d];
    if (new Set(P).size < 4) continue;
    const sqCount = P.filter((p) => sqSet.has(p)).length;
    for (let sh = 0; sh < 4; sh++) {
      const ord = [P[sh], P[(sh + 1) % 4], P[(sh + 2) % 4], P[(sh + 3) % 4]];
      const dst = ord.map((p) => [p.x * sc, p.y * sc]);
      if (!isConvexQuad(dst, true)) continue;
      const wQuad = (Math.hypot(dst[1][0] - dst[0][0], dst[1][1] - dst[0][1]) + Math.hypot(dst[2][0] - dst[3][0], dst[2][1] - dst[3][1])) / 2;
      const hQuad = (Math.hypot(dst[3][0] - dst[0][0], dst[3][1] - dst[0][1]) + Math.hypot(dst[2][0] - dst[1][0], dst[2][1] - dst[1][1])) / 2;
      const quadRatio = wQuad / Math.max(1, hQuad);
      if (quadRatio < 0.48 || quadRatio > 0.98) continue;
      const area = quadArea(dst);
      if (imgW && imgH && area < 0.08 * imgW * imgH) continue;
      const H = fitHomography(src4, dst);
      if (!H) continue;
      let hit = 0;
      let dsum = 0;
      for (const t of TEMPLATE.marks) {
        const [pu, pv] = H(t[0], t[1]);
        let bd = tol;
        for (const mk of all) {
          const dd = Math.hypot(mk.x * sc - pu, mk.y * sc - pv);
          if (dd < bd) bd = dd;
        }
        if (bd < tol) { hit++; dsum += bd; }
      }
      // Ưu tiên thêm nhỏ nếu cả 4 góc đều là ô vuông đen TNMaker/BGD
      const score = hit + (sqCount === 4 ? 1.5 : sqCount * 0.15) - (hit ? (dsum / hit / tol) * 0.5 : 0);
      if (!best || score > best.score) best = { score, hit, sqCount, H };
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

/* Căn chỉnh tọa độ phiếu A4 chung cho readSheet & probeSheetAlignment */
function alignSheet(img, detectMaxDim = DEFAULTS.detectMaxDim) {
  const { width: w, height: h } = img;
  const chanR = extractChannel(img, 0);
  const chanG = extractChannel(img, 1);
  const small = downscale(chanR, w, h, detectMaxDim);

  const marksInfo = findMarks(small);
  const { all: marks, squares } = marksInfo;
  if (marks.length < 4) {
    return {
      ok: false, stage: 'few_marks', marksCount: marks.length, squaresCount: squares.length,
      bestHit: 0, H: null, small, chanR, chanG, cornerMatched: { TL: false, TR: false, BR: false, BL: false },
    };
  }
  const sc = 1 / small.s;
  const toFull = (p) => [p.x * sc, p.y * sc];
  // Dung sai khớp vạch = 45% chiều dài mẫu (nới hợp lý cho cả 4 ô vuông góc 56px và vạch mép 44px)
  const Ls = marks.map((m) => m.L).sort((p, q) => p - q);
  const matchTol = 0.45 * Ls[Math.floor(Ls.length / 2)] * sc;
  const best = findBestAlignment(marksInfo, sc, matchTol, w, h);

  // Cho phép nhận khi đủ >= 20 vạch khớp HOẶC bắt chuẩn cả 4 ô vuông đen TNMaker ở 4 góc
  const fourSquareReady = Boolean(best && best.sqCount === 4 && best.hit >= 4);
  if (!best || (best.hit < 20 && !fourSquareReady)) {
    return {
      ok: false,
      stage: 'bad_fit',
      marksCount: marks.length,
      squaresCount: squares.length,
      bestHit: best?.hit || 0,
      H: best?.H || null,
      small,
      chanR,
      chanG,
      cornerMatched: { TL: false, TR: false, BR: false, BL: false },
    };
  }
  let H = best.H;

  // Tinh chỉnh: ghép mọi vạch + ô vuông góc tìm được với mẫu gần nhất, giải lại H
  const refineOnce = (Hcur) => {
    const S = [];
    const D = [];
    for (const t of TEMPLATE.marks) {
      const [pu, pv] = Hcur(t[0], t[1]);
      let found = null;
      let bd = matchTol;
      for (const mk of marks) {
        const d = Math.hypot(mk.x * sc - pu, mk.y * sc - pv);
        if (d < bd) { bd = d; found = mk; }
      }
      if (found) { S.push(t); D.push(toFull(found)); }
    }
    return { S, D };
  };
  let matched = 0;
  for (let it = 0; it < 2; it++) {
    const { S, D } = refineOnce(H);
    matched = S.length;
    if (S.length >= 4) {
      const H2 = fitHomography(S, D);
      if (H2) H = H2;
    }
  }

  // Nếu chỉ có 4 ô vuông đen ở 4 góc (thiếu vạch mép phân biệt chiều trên/dưới),
  // dùng độ khớp viền ô tròn SBD/Mã đề để tự động loại chiều ngược 180°.
  if (matched < 10) {
    const tc = TEMPLATE.corners;
    const hFlip = fitHomography(
      [tc.TL, tc.TR, tc.BR, tc.BL],
      [H(...tc.BR), H(...tc.BL), H(...tc.TL), H(...tc.TR)],
    );
    if (hFlip) {
      // Kiểm tra các cụm ô đặc trưng chỉ có ở nửa dưới (PHẦN III giữa phiếu) vs nửa trên trống (họ tên thí sinh)
      const probePts = [
        [TEMPLATE.p3X[1][1], TEMPLATE.p3DigitY[2]],
        [TEMPLATE.p3X[2][0], TEMPLATE.p3DigitY[1]],
        [TEMPLATE.p3X[2][2], TEMPLATE.p3DigitY[4]],
        [TEMPLATE.p3X[2][3], TEMPLATE.p3DigitY[7]],
        [TEMPLATE.p3X[3][1], TEMPLATE.p3DigitY[3]],
        [TEMPLATE.p3X[3][2], TEMPLATE.p3DigitY[6]],
        [TEMPLATE.p3X[4][1], TEMPLATE.p3DigitY[5]],
        [TEMPLATE.p1X[1][1], TEMPLATE.p1Y[2]],
        [TEMPLATE.p1X[2][2], TEMPLATE.p1Y[5]],
      ];
      const evalFit = (Hcand) => {
        const sp = makeSampler(chanR, chanG, w, h, Hcand);
        return probePts.reduce((acc, [px, py]) => acc + sp.ringScore(px, py), 0);
      };
      if (evalFit(hFlip) > evalFit(H) + 0.02) H = hFlip;
    }
  }

  // Kiểm tra từng ô vuông đen tại 4 góc có khớp thực tế trên ảnh hay không
  const cornerMatched = {};
  Object.entries(TEMPLATE.corners).forEach(([key, pt]) => {
    const [pu, pv] = H(pt[0], pt[1]);
    cornerMatched[key] = marks.some((mk) => Math.hypot(mk.x * sc - pu, mk.y * sc - pv) < matchTol * 1.45);
  });

  return {
    ok: true,
    H,
    matched,
    markFit: matched / TEMPLATE.marks.length,
    marksCount: marks.length,
    squaresCount: squares.length,
    cornerMatched,
    small,
    chanR,
    chanG,
  };
}

function quadArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) * 0.5;
}

function isConvexQuad(pts, requireClockwise = false) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % 4];
    const [x2, y2] = pts[(i + 2) % 4];
    const cross = (x1 - x0) * (y2 - y1) - (y1 - y0) * (x2 - x1);
    if (Math.abs(cross) < 1e-3) return false;
    if (requireClockwise && cross <= 0) return false;
    const s = cross > 0 ? 1 : -1;
    if (!sign) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/**
 * Thăm dò nhanh căn chỉnh phiếu A4 theo thời gian thực cho live camera viewfinder.
 * Trả về 4 góc định vị, tỷ lệ khớp vạch, tình trạng ánh sáng và gợi ý căn khung.
 */
export function probeSheetAlignment(img, options = {}) {
  const { width: w, height: h } = img || {};
  if (!img?.data || !w || !h) {
    return {
      detected: false, ready: false, markFit: 0, hits: 0, totalMarks: TEMPLATE.marks.length,
      marksCount: 0, brightness: 0, lightState: 'dark', cornersPx: null, paperQuadPx: null,
      hint: 'Đang chờ tín hiệu camera…',
    };
  }

  const detectMaxDim = options.detectMaxDim || 680;
  const aligned = alignSheet(img, detectMaxDim);
  const { small } = aligned;

  let sumLuma = 0;
  for (let i = 0; i < small.chan.length; i++) sumLuma += small.chan[i];
  const brightness = small.chan.length ? Math.round(sumLuma / small.chan.length) : 0;
  const lightState = brightness < 55
    ? 'dark'
    : (brightness > 252 && !aligned.ok && aligned.marksCount < 4)
      ? 'bright'
      : 'ok';

  const hits = aligned.ok ? aligned.matched : aligned.bestHit;
  const markFit = hits / TEMPLATE.marks.length;
  const H = aligned.H;

  let cornersPx = null;
  let paperQuadPx = null;
  let validQuad = false;

  if (H && (hits >= 10 || (aligned.ok && hits >= 4))) {
    const tl = H(...TEMPLATE.corners.TL);
    const tr = H(...TEMPLATE.corners.TR);
    const br = H(...TEMPLATE.corners.BR);
    const bl = H(...TEMPLATE.corners.BL);
    const cornerPts = [tl, tr, br, bl];
    const area = quadArea(cornerPts);
    const inBounds = cornerPts.every(([x, y]) => (
      Number.isFinite(x) && Number.isFinite(y)
      && x >= -0.18 * w && x <= 1.18 * w
      && y >= -0.18 * h && y <= 1.18 * h
    ));
    if (inBounds && isConvexQuad(cornerPts) && area >= 0.1 * w * h) {
      validQuad = true;
      cornersPx = { TL: tl, TR: tr, BR: br, BL: bl };
      paperQuadPx = [
        H(0, 0),
        H(TEMPLATE.width, 0),
        H(TEMPLATE.width, TEMPLATE.height),
        H(0, TEMPLATE.height),
      ];
    }
  }

  const detected = validQuad && (hits >= 12 || (aligned.squaresCount >= 4 && hits >= 4));
  const cornersCount = Object.values(aligned.cornerMatched || {}).filter(Boolean).length;
  const ready = aligned.ok && validQuad && (markFit >= 0.42 || cornersCount === 4) && lightState === 'ok';

  let hint;
  if (lightState === 'dark') {
    hint = 'Ánh sáng hơi tối — hãy bật đèn Flash hoặc tăng sáng bàn thi.';
  } else if (lightState === 'bright') {
    hint = 'Phiếu bị lóa sáng — điều chỉnh góc nghiêng nhẹ tránh phản đèn.';
  } else if (ready) {
    hint = `Chuẩn 4/4 ô góc (${hits}/${TEMPLATE.marks.length} điểm định vị) — Giữ yên để tự chụp!`;
  } else if (detected) {
    hint = `Đã bắt ${cornersCount}/4 ô góc — Đưa 4 ô vuông đen vào khít 4 ô ở góc khung ngắm.`;
  } else if (aligned.marksCount >= 2) {
    hint = `Đã thấy ${aligned.squaresCount || 0} ô đen — Căn đủ 4 ô vuông đen trên giấy vào 4 ô góc.`;
  } else {
    hint = 'Đưa 4 ô vuông đen ở 4 góc phiếu khít vào 4 ô định vị màu xanh trên màn hình.';
  }

  return {
    detected,
    ready,
    markFit: +markFit.toFixed(2),
    hits,
    totalMarks: TEMPLATE.marks.length,
    marksCount: aligned.marksCount,
    squaresCount: aligned.squaresCount || 0,
    cornersCount,
    cornerMatched: aligned.cornerMatched || { TL: false, TR: false, BR: false, BL: false },
    brightness,
    lightState,
    cornersPx,
    paperQuadPx,
    hint,
  };
}

/* ============ HÀM CHÍNH ============ */
export function readSheet(img, options = {}) {
  const opt = { ...DEFAULTS, ...options };
  const { width: w, height: h } = img;
  if (!img?.data || !w || !h) return { ok: false, error: 'Ảnh không hợp lệ.' };

  const aligned = alignSheet(img, opt.detectMaxDim);
  if (!aligned.ok) {
    if (aligned.stage === 'few_marks') {
      return { ok: false, error: 'Không thấy các vạch đen định vị. Chụp thẳng, đủ sáng, thấy rõ cả 4 góc phiếu.' };
    }
    return { ok: false, error: 'Không nhận ra khung phiếu (thiếu vạch ở mép phải/dưới). Chụp lại đủ cả phiếu, đủ sáng, không bị che.' };
  }
  const { H, markFit, chanR, chanG } = aligned;

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

  const toNorm = ([ptx, pty]) => {
    const [u, v] = H(ptx, pty);
    return [+(u / w).toFixed(4), +(v / h).toFixed(4)];
  };
  const cornersNorm = {
    TL: toNorm(T.corners.TL),
    TR: toNorm(T.corners.TR),
    BR: toNorm(T.corners.BR),
    BL: toNorm(T.corners.BL),
  };

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
      cornersNorm,
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
