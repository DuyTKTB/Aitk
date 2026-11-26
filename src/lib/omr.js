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

/* ============ NGƯỠNG & CẤU HÌNH ĐỘ NHẠY ============ */
const DEFAULTS = {
  markThreshold: 0.20,   // ngưỡng cơ sở khi người dùng chỉ định thủ công
  faintBand: 0.065,      // trong vùng ngưỡng ± faintBand → báo "mờ, cần xem lại"
  detectMaxDim: 1600,    // giữ độ phân giải sắc nét khi tách 4 ô góc & vạch mép từ webcam/camera
  adaptive: true,        // tự cân chỉnh ngưỡng theo độ sáng nền giấy & độ đậm bút chì/bút bi
  sensitivity: 'normal', // 'light' (chì 2B nhạt) | 'normal' (chuẩn) | 'strict' (giấy photo nhiễu)
  localRefine: true,     // tinh chỉnh lệch vi mô từng vùng (chống cong giấy / co giãn máy in)
};

const SENSITIVITY_BIAS = {
  light: -0.032,
  normal: 0,
  strict: 0.038,
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
  // Ước lượng độ sáng nền giấy trắng A4 (phân vị 96% — chịu được phiếu ở xa chỉ chiếm 15% khung hình)
  const hist = new Uint32Array(256);
  for (let i = 0; i < chan.length; i++) hist[chan[i]]++;
  let acc = 0;
  let paperRef = 240;
  const targetTop = Math.max(1, Math.floor(chan.length * 0.04));
  for (let v = 255; v >= 0; v--) {
    acc += hist[v];
    if (acc >= targetTop) { paperRef = v; break; }
  }

  // Ngưỡng thích ứng cục bộ: điểm tối hơn nền xung quanh ~26% (chịu được bóng đổ / sáng không đều)
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

  const maxDim = Math.max(w, h);
  const minCompPx = maxDim <= 720 ? 7 : 10;
  // Vạch/ô đen định vị thật phải nằm trên nền giấy A4 sáng (loại bỏ đồ vật đen trên bàn tối)
  const haloMin = Math.max(76, paperRef * 0.44);
  const contrastMin = Math.max(30, paperRef * 0.19);
  const haloBuf = new Float64Array(8);

  const visited = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const comps = [];
  for (let start = 0; start < bin.length; start++) {
    if (!bin[start] || visited[start]) continue;
    let sp = 0;
    stack[sp++] = start;
    visited[start] = 1;
    let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sumVal = 0;
    while (sp) {
      const p = stack[--sp];
      const y = (p / w) | 0;
      const x = p - y * w;
      n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
      sumVal += chan[p];
      if (x > 0 && bin[p - 1] && !visited[p - 1]) { visited[p - 1] = 1; stack[sp++] = p - 1; }
      if (x < w - 1 && bin[p + 1] && !visited[p + 1]) { visited[p + 1] = 1; stack[sp++] = p + 1; }
      if (y > 0 && bin[p - w] && !visited[p - w]) { visited[p - w] = 1; stack[sp++] = p - w; }
      if (y < h - 1 && bin[p + w] && !visited[p + w]) { visited[p + w] = 1; stack[sp++] = p + w; }
    }
    if (n < minCompPx) continue;
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

    // Kiểm tra quầng giấy sáng bao quanh dấu định vị để loại nhiễu bàn tối
    const rHalo = Math.max(3, 0.85 * L + 2);
    let hn = 0;
    for (let k = 0; k < 8; k++) {
      const ang = (k * Math.PI) / 4;
      const hx = Math.round(mx + Math.cos(ang) * rHalo);
      const hy = Math.round(my + Math.sin(ang) * rHalo);
      if (hx >= 0 && hx < w && hy >= 0 && hy < h) {
        haloBuf[hn++] = chan[hy * w + hx];
      }
    }
    if (hn >= 3) {
      const slice = Array.from(haloBuf.subarray(0, hn)).sort((p, q) => p - q);
      const halo = slice[Math.floor(hn * 0.65)];
      const core = sumVal / n;
      if (halo < haloMin || halo - core < contrastMin) continue;
    }

    comps.push({ n, x: mx, y: my, L, W, ratio: L / W, fill: n / (L * W) });
  }

  const refDim = Math.min(maxDim, Math.round(Math.min(w, h) * 1.45));
  const minBarN = maxDim <= 720 ? 7 : 12;
  let bars = comps.filter(
    (m) => m.ratio >= 1.65 && m.ratio <= 5.2 && m.fill > 0.68 && m.fill < 1.26
      && m.W >= 0.0010 * refDim && m.L >= 0.0046 * refDim && m.L <= 0.052 * maxDim && m.n >= minBarN,
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

  // 4 ô vuông đen ở 4 góc chuẩn Bộ GD&ĐT / TNMaker (fill >= 0.84 loại ô tròn tô chì có fill ≈ π/4 = 0.785)
  const isProbeScale = maxDim <= 860;
  const minSqN = isProbeScale ? 9 : 18;
  const minSqW = (isProbeScale ? 0.0056 : 0.0072) * refDim;
  const minSqL = (isProbeScale ? 0.0062 : 0.0080) * refDim;
  let squares = comps.filter(
    (m) => m.ratio >= 0.80 && m.ratio <= 1.55 && m.fill >= 0.84 && m.fill < 1.18
      && m.W >= minSqW && m.L >= minSqL && m.L <= 0.06 * maxDim && m.n >= minSqN,
  );
  if (squares.length > 20) {
    // Ưu tiên cụm 4 ô vuông cùng kích thước có độ đặc gần 1.00 (ô vuông thật luôn đặc hơn ô tròn/chữ)
    const scored = squares.map((m) => {
      const peers = squares.filter((o) => Math.abs(o.L - m.L) < 0.26 * m.L).length;
      const clusterBonus = peers >= 4 && peers <= 8 ? 14 : (peers >= 4 ? 8 : peers);
      const shapeScore = clusterBonus - Math.abs(1 - m.fill) * 12 - Math.abs(1 - m.ratio) * 3;
      return { m, shapeScore };
    });
    scored.sort((a, b) => b.shapeScore - a.shapeScore);
    squares = scored.slice(0, 20).map((s) => s.m);
  }

  const barSet = new Set(bars);
  const all = [...squares.filter((s) => !barSet.has(s)), ...bars];
  return { all, bars, squares };
}

/** Kiểm tra tứ giác 4 góc có hình học hợp lý với tờ giấy A4 thực tế (chống suy biến phối cảnh). */
function isReasonableQuad(dst, imgW, imgH, minAreaRatio = 0.06) {
  if (!isConvexQuad(dst, true)) return false;
  const e0 = Math.hypot(dst[1][0] - dst[0][0], dst[1][1] - dst[0][1]);
  const e1 = Math.hypot(dst[2][0] - dst[1][0], dst[2][1] - dst[1][1]);
  const e2 = Math.hypot(dst[3][0] - dst[2][0], dst[3][1] - dst[2][1]);
  const e3 = Math.hypot(dst[0][0] - dst[3][0], dst[0][1] - dst[3][1]);
  const minH = Math.min(e0, e2);
  const minV = Math.min(e1, e3);
  if (minH < 8 || minV < 8) return false;
  if (Math.max(e0, e2) / minH > 2.25) return false;
  if (Math.max(e1, e3) / minV > 2.25) return false;

  // Chặn các góc quá nhọn/tù (< 28° hoặc > 152°) của tứ giác méo giả
  for (let i = 0; i < 4; i++) {
    const prev = dst[(i + 3) % 4];
    const curr = dst[i];
    const next = dst[(i + 1) % 4];
    const v1x = prev[0] - curr[0], v1y = prev[1] - curr[1];
    const v2x = next[0] - curr[0], v2y = next[1] - curr[1];
    const den = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
    if (den < 1e-3) return false;
    const cosA = (v1x * v2x + v1y * v2y) / den;
    if (Math.abs(cosA) > 0.88) return false;
  }

  const wQuad = (e0 + e2) / 2;
  const hQuad = (e1 + e3) / 2;
  const quadRatio = wQuad / Math.max(1, hQuad);
  if (quadRatio < 0.46 || quadRatio > 0.98) return false;
  if (imgW && imgH && quadArea(dst) < minAreaRatio * imgW * imgH) return false;
  return true;
}

/** Đo nhanh độ khớp viền ô tròn trên 12 điểm đại diện (cả chiều xuôi lẫn lật 180°) để loại khung giả trên bàn. */
const QUICK_RING_PTS = [
  [TEMPLATE.p1X[0][1], TEMPLATE.p1Y[1]],
  [TEMPLATE.p1X[1][2], TEMPLATE.p1Y[4]],
  [TEMPLATE.p1X[2][1], TEMPLATE.p1Y[7]],
  [TEMPLATE.p1X[3][2], TEMPLATE.p1Y[2]],
  [TEMPLATE.p2X[0][0], TEMPLATE.p2Y[1]],
  [TEMPLATE.p2X[2][2], TEMPLATE.p2Y[2]],
  [TEMPLATE.p3X[1][1], TEMPLATE.p3DigitY[2]],
  [TEMPLATE.p3X[2][2], TEMPLATE.p3DigitY[5]],
  [TEMPLATE.p3X[3][1], TEMPLATE.p3DigitY[3]],
  [TEMPLATE.p3X[4][2], TEMPLATE.p3DigitY[6]],
  [TEMPLATE.idX[1], TEMPLATE.digitY[3]],
  [TEMPLATE.codeX[1], TEMPLATE.digitY[5]],
];

function quickRingScore(chanR, chanG, w, h, H) {
  const sp = makeSampler(chanR, chanG, w, h, H);
  let sum = 0;
  for (let i = 0; i < QUICK_RING_PTS.length; i++) {
    sum += sp.ringScore(QUICK_RING_PTS[i][0], QUICK_RING_PTS[i][1]);
  }
  return sum / QUICK_RING_PTS.length;
}

function quickRingScoreAnyOrientation(chanR, chanG, w, h, H) {
  const s1 = quickRingScore(chanR, chanG, w, h, H);
  const tc = TEMPLATE.corners;
  const hFlip = fitHomography(
    [tc.TL, tc.TR, tc.BR, tc.BL],
    [H(...tc.BR), H(...tc.BL), H(...tc.TL), H(...tc.TR)],
  );
  const s2 = hFlip ? quickRingScore(chanR, chanG, w, h, hFlip) : -1;
  return Math.max(s1, s2);
}

/* Thử nhiều cách chọn 4 góc (ưu tiên 4 ô vuông đen ở 4 góc, kết hợp thêm vạch ngoài cùng & cụm ô vuông cùng cỡ),
   đảm bảo khớp 1-1 duy nhất cho mỗi dấu định vị và loại tứ giác méo/suy biến. */
function findBestAlignment(marksInfo, sc, tol, imgW, imgH, chanR, chanG) {
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

  // Xây danh sách bộ 4 ứng viên: tích Đề-các 4 góc + các cụm 4 ô vuông cùng kích thước (tránh nhiễu ô to trên bàn trắng)
  const tuples = [];
  const tupleKeys = new Set();
  const idMap = new Map(all.map((m, idx) => [m, idx]));
  const addTuple = (a, b, c, d) => {
    const P = [a, b, c, d];
    if (new Set(P).size < 4) return;
    const key = P.map((p) => idMap.get(p)).sort((x, y) => x - y).join(',');
    if (tupleKeys.has(key)) return;
    tupleKeys.add(key);
    tuples.push(P);
  };

  for (const a of cTL) for (const b of cTR) for (const c of cBR) for (const d of cBL) {
    addTuple(a, b, c, d);
  }
  if (squares.length > 4) {
    const seenSeeds = [];
    for (const s of squares) {
      if (seenSeeds.some((L0) => Math.abs(s.L - L0) < 0.2 * L0)) continue;
      seenSeeds.push(s.L);
      const grp = squares.filter((o) => Math.abs(o.L - s.L) < 0.30 * s.L);
      if (grp.length >= 4) {
        const gTL = pickExtremal(grp, (m) => m.x + m.y, -1, 1)[0];
        const gTR = pickExtremal(grp, (m) => m.x - m.y, 1, 1)[0];
        const gBR = pickExtremal(grp, (m) => m.x + m.y, 1, 1)[0];
        const gBL = pickExtremal(grp, (m) => m.x - m.y, -1, 1)[0];
        addTuple(gTL, gTR, gBR, gBL);
      }
    }
  }

  const tc = TEMPLATE.corners;
  const src4 = [tc.TL, tc.TR, tc.BR, tc.BL];
  const usedStamp = new Int32Array(all.length);
  let stamp = 0;
  const topCandidates = [];
  const topFourSq = [];
  const pushPool = (pool, maxLen, cand) => {
    if (pool.length < maxLen) {
      pool.push(cand);
      pool.sort((p, q) => q.score - p.score);
    } else if (cand.score > pool[pool.length - 1].score) {
      pool[pool.length - 1] = cand;
      pool.sort((p, q) => q.score - p.score);
    }
  };
  const pushTop = (cand, isUniform4Sq) => {
    pushPool(topCandidates, 8, cand);
    // Luôn giữ riêng các ứng viên 4 ô vuông đen cùng kích thước ở 4 góc (ưu tiên diện tích lớn)
    if (isUniform4Sq) {
      const sqCand = { ...cand, score: cand.score + cand.areaRatio * 6 };
      pushPool(topFourSq, 6, sqCand);
    }
  };

  for (let ti = 0; ti < tuples.length; ti++) {
    const P = tuples[ti];
    const sqCount = P.filter((p) => sqSet.has(p)).length;
    let isUniform4Sq = false;
    if (sqCount === 4) {
      let minL = Infinity, maxL = 0;
      for (let k = 0; k < 4; k++) {
        if (P[k].L < minL) minL = P[k].L;
        if (P[k].L > maxL) maxL = P[k].L;
      }
      isUniform4Sq = maxL <= minL * 1.65;
    }
    for (let sh = 0; sh < 4; sh++) {
      const ord = [P[sh], P[(sh + 1) % 4], P[(sh + 2) % 4], P[(sh + 3) % 4]];
      const dst = ord.map((p) => [p.x * sc, p.y * sc]);
      if (!isReasonableQuad(dst, imgW, imgH, 0.06)) continue;
      const H = fitHomography(src4, dst);
      if (!H) continue;

      // Khớp 1-1 duy nhất: mỗi dấu trên ảnh chỉ được ghép với tối đa 1 dấu mẫu
      stamp += 1;
      let hit = 0;
      let dsum = 0;
      for (let mi = 0; mi < TEMPLATE.marks.length; mi++) {
        const t = TEMPLATE.marks[mi];
        const [pu, pv] = H(t[0], t[1]);
        let bd = tol;
        let bestIdx = -1;
        for (let k = 0; k < all.length; k++) {
          if (usedStamp[k] === stamp) continue;
          const mk = all[k];
          const dd = Math.hypot(mk.x * sc - pu, mk.y * sc - pv);
          if (dd < bd) { bd = dd; bestIdx = k; }
        }
        if (bestIdx >= 0) {
          usedStamp[bestIdx] = stamp;
          hit++;
          dsum += bd;
        }
      }
      // Ưu tiên thêm nếu cả 4 góc đều là ô vuông đen TNMaker/BGD cùng kích thước
      const areaRatio = imgW && imgH ? quadArea(dst) / (imgW * imgH) : 0;
      const score = hit + (isUniform4Sq ? 3.5 : sqCount * 0.2) - (hit ? (dsum / hit / tol) * 0.5 : 0);
      pushTop({ score, hit, sqCount, H, areaRatio }, isUniform4Sq);
    }
  }

  if (!topCandidates.length) return null;
  let best = topCandidates[0];

  // Khi số vạch khớp còn thấp (< 25) hoặc có đối thủ cạnh tranh sát nhau, kiểm chứng bằng viền ô tròn thực tế
  if (chanR && chanG && (best.hit < 25 || (topCandidates.length > 1 && topCandidates[1].hit >= best.hit - 4))) {
    const evalList = [...topCandidates];
    topFourSq.forEach((c) => { if (!evalList.includes(c)) evalList.push(c); });
    let bestCombined = -Infinity;
    let bestCand = best;
    for (const c of evalList) {
      const rScore = quickRingScoreAnyOrientation(chanR, chanG, imgW, imgH, c.H);
      const combined = c.score + rScore * 40;
      if (combined > bestCombined) {
        bestCombined = combined;
        bestCand = { ...c, ringScore: rScore };
      }
    }
    best = bestCand;
  }
  return best;
}

/* ============ ĐO Ô TÔ (CHỐNG LÓA + TINH CHỈNH LỆCH VI MÔ) ============ */
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

  // Trimmed-mean: bỏ top 18% điểm chói sáng nhất trong lõi ô tô để chống phản quang bút chì/đèn tuýp
  function measure(cx, cy, ox = 0, oy = 0) {
    const px = cx + ox;
    const py = cy + oy;
    const vals = [];
    for (const [dx, dy] of disc) {
      const v = at(chanR, px, py, dx, dy);
      if (v !== null) vals.push(v);
    }
    const refs = [];
    for (const [dx, dy] of ann) {
      const v = at(chanR, px, py, dx, dy);
      if (v !== null) refs.push(v);
    }
    if (vals.length < disc.length * 0.7 || refs.length < 8) return { fill: 0, oob: true };
    refs.sort((p, q) => p - q);
    // trung vị phần sáng quanh ô (70th percentile): tránh bị kéo xuống bởi nét mực/viền ô kế bên
    const ref = refs[Math.floor(refs.length * 0.7)];

    vals.sort((p, q) => p - q);
    // Nếu có chói cục bộ (chênh giữa top và median > 24), bỏ 18% điểm sáng nhất để không mất nét chì bóng
    const med = vals[Math.floor(vals.length * 0.5)];
    const topV = vals[vals.length - 1];
    const trimEnd = (topV - med > 24 && vals.length >= 10)
      ? Math.max(6, Math.floor(vals.length * 0.82))
      : vals.length;
    let s = 0;
    for (let i = 0; i < trimEnd; i++) s += vals[i];
    const mean = s / trimEnd;
    const fill = ref > 40 ? Math.max(0, Math.min(1, 1 - mean / ref)) : 0;
    return { fill, oob: false };
  }

  // Điểm "khớp lưới": viền ô in màu hồng-đỏ hoặc đen trắng → kênh G tối hơn quanh bán kính R
  function ringScore(cx, cy, ox = 0, oy = 0) {
    const px = cx + ox;
    const py = cy + oy;
    let ring = 0, rn = 0, around = 0, an = 0;
    for (const [dx, dy] of ringPts) {
      const v = at(chanG, px, py, dx, dy);
      if (v !== null) { ring += v; rn++; }
    }
    for (const [dx, dy] of ann) {
      const v = at(chanG, px, py, dx, dy);
      if (v !== null) { around += v; an++; }
    }
    if (!rn || !an) return 0;
    return (around / an - ring / rn) / 255;
  }

  // Tinh chỉnh lệch vi mô (±5px hệ mẫu) cho từng vùng phiếu khi giấy hơi cong hoặc máy in co giãn nhẹ
  function refineSectionOffset(anchorPts) {
    const shifts = [
      [0, 0],
      [-5, 0], [5, 0], [0, -5], [0, 5],
      [-4, -4], [4, -4], [-4, 4], [4, 4],
    ];
    let baseScore = 0;
    for (const [ax, ay] of anchorPts) baseScore += ringScore(ax, ay, 0, 0);
    baseScore /= anchorPts.length;
    let bestScore = baseScore;
    let bestOffset = [0, 0];
    for (let i = 1; i < shifts.length; i++) {
      const [ox, oy] = shifts[i];
      let sc = 0;
      for (const [ax, ay] of anchorPts) sc += ringScore(ax, ay, ox, oy);
      sc /= anchorPts.length;
      if (sc > bestScore) {
        bestScore = sc;
        bestOffset = [ox, oy];
      }
    }
    // Chỉ nhận độ dịch khi độ khớp viền ô cải thiện rõ rệt (tránh dịch sai trên phiếu nền trắng/mờ)
    return bestScore > baseScore + 0.012 ? bestOffset : [0, 0];
  }

  return { measure, ringScore, refineSectionOffset };
}

/**
 * Tính ngưỡng thích ứng theo phân bố độ đen thực tế của từng tờ phiếu:
 * - Tách nền ô trống (blankP50 / blankP90) và cụm ô tô thật (inkP80).
 * - Chịu được cả bút chì 2B tô nhạt lẫn giấy photo nền xám/nhiễu.
 */
export function computeAdaptiveThreshold(allFills, {
  baseThreshold = DEFAULTS.markThreshold,
  sensitivity = 'normal',
} = {}) {
  const bias = SENSITIVITY_BIAS[sensitivity] ?? 0;
  const clean = allFills.filter((v) => Number.isFinite(v) && v >= 0 && v <= 1).sort((a, b) => a - b);
  if (clean.length < 30) {
    return {
      threshold: Math.max(0.12, Math.min(0.36, +(baseThreshold + bias).toFixed(3))),
      blankFloor: 0.04,
      inkLevel: 0.45,
      adapted: false,
    };
  }
  const pct = (p) => clean[Math.min(clean.length - 1, Math.max(0, Math.floor(clean.length * p)))];
  // Tối đa ~25% tổng số ô trên phiếu có thể được tô → 72% thấp nhất đại diện cho nền ô trống
  const blankP50 = pct(0.35);
  const blankP90 = pct(0.68);
  const noiseGuard = blankP90 + 0.075;

  // Các ứng viên ô tô thật: đậm hơn nền trống ít nhất 0.11 và >= 0.14
  const strongMarks = clean.filter((v) => v >= Math.max(0.14, blankP90 + 0.10));
  if (strongMarks.length < 4) {
    const thr = Math.max(0.13, Math.min(0.34, Math.max(baseThreshold, noiseGuard) + bias));
    return {
      threshold: +thr.toFixed(3),
      blankFloor: +blankP50.toFixed(3),
      inkLevel: strongMarks.length ? +strongMarks[strongMarks.length - 1].toFixed(3) : 0,
      adapted: false,
    };
  }

  const inkP25 = strongMarks[Math.floor(strongMarks.length * 0.25)];
  const inkP60 = strongMarks[Math.floor(strongMarks.length * 0.60)];
  // Điểm chia tối ưu giữa đỉnh nền trống (blankP90) và cụm ô đã tô (inkP25..inkP60)
  const midSplit = blankP90 + (inkP25 - blankP90) * 0.42;
  const rawThr = Math.max(noiseGuard, Math.min(midSplit, blankP50 + (inkP60 - blankP50) * 0.45));
  const clamped = Math.max(0.135, Math.min(0.34, rawThr + bias));

  return {
    threshold: +clamped.toFixed(3),
    blankFloor: +blankP50.toFixed(3),
    inkLevel: +inkP60.toFixed(3),
    adapted: true,
  };
}

/** Giải mã đáp án từ ma trận raw fill (dùng chung cho readSheet đơn lẻ và mergeBurstReads đa khung). */
export function decodeSheetFills(raw, options = {}) {
  const { idFill, codeFill, p1Fill, p2Fill, p3Fill } = raw;
  const band = options.faintBand ?? DEFAULTS.faintBand;
  const allFills = [
    ...idFill.flat(),
    ...codeFill.flat(),
    ...p1Fill.flat(),
    ...p2Fill.flat(2),
    ...p3Fill.flatMap((q) => q.flatMap((c) => [c.minus, c.comma, ...c.digits])),
  ];

  const useAdaptive = options.adaptive !== false && options.markThreshold == null;
  const adaptInfo = useAdaptive
    ? computeAdaptiveThreshold(allFills, {
      baseThreshold: DEFAULTS.markThreshold,
      sensitivity: options.sensitivity || 'normal',
    })
    : {
      threshold: +(options.markThreshold ?? DEFAULTS.markThreshold),
      blankFloor: 0.04,
      inkLevel: 0.45,
      adapted: false,
    };

  const thr = adaptInfo.threshold;
  const issues = [];
  const isOn = (f) => f >= thr;
  const isFaint = (f) => f > thr - band && f < thr + band;

  // Chọn 1 trong n ô với bộ phân tách vết tẩy xóa vs tô 2 ô thực sự
  const pickOne = (fills) => {
    const on = [];
    fills.forEach((f, i) => { if (isOn(f)) on.push(i); });
    if (!on.length) return { idx: -1, state: 'blank', faint: fills.some(isFaint) };
    if (on.length === 1) return { idx: on[0], state: 'ok', faint: isFaint(fills[on[0]]) };
    on.sort((a, b) => fills[b] - fills[a]);
    const top1 = fills[on[0]];
    const top2 = fills[on[1]];
    // 1 ô đen đậm hơn hẳn ô còn lại (tỷ lệ >= 1.65 HOẶC chênh >= 0.14 khi ô chính rất đậm) → vết tẩy chưa sạch
    if (top1 > top2 * 1.65 || (top1 >= thr + 0.14 && (top1 - top2) >= 0.14)) {
      return { idx: on[0], state: 'ok', faint: true, dominant: true };
    }
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
    });
    return s;
  });

  const marked = allFills.filter(isOn).length;
  const uncertain = allFills.filter(isFaint).length;

  return {
    sbd,
    code,
    p1,
    p2,
    p3,
    issues,
    threshold: thr,
    blankFloor: adaptInfo.blankFloor,
    inkLevel: adaptInfo.inkLevel,
    adapted: adaptInfo.adapted,
    marked,
    uncertain,
  };
}

/**
 * Hợp nhất kết quả từ nhiều khung hình liên tiếp (Burst Consensus 2–3 frames):
 * - Dùng trung vị / trung bình có trọng số độ nét theo từng ô tô.
 * - Loại bỏ hoàn toàn nhiễu rung tay, chớp sáng hoặc bóng lướt thoáng qua.
 */
export function mergeBurstReads(reads = [], options = {}) {
  const valid = reads.filter((r) => r && r.ok && r.raw);
  if (!valid.length) return reads[0] || { ok: false, error: 'Không có khung hình hợp lệ.' };
  if (valid.length === 1) return valid[0];

  const fuseVal = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    if (sorted.length >= 3) {
      // Trung vị loại hẳn giá trị nhiễu ngoại lai (outlier frame)
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return (sorted[0] + sorted[1]) / 2;
  };

  const base = [...valid].sort((a, b) => (
    ((b.quality?.markFit ?? 0) + (b.quality?.alignment ?? 0))
    - ((a.quality?.markFit ?? 0) + (a.quality?.alignment ?? 0))
  ))[0];

  const fuse2D = (getter) => getter(base.raw).map((row, r) => row.map((_, c) => fuseVal(valid.map((v) => getter(v.raw)[r][c]))));
  const fuse3D = (getter) => getter(base.raw).map((mat, i) => mat.map((row, r) => row.map((_, c) => fuseVal(valid.map((v) => getter(v.raw)[i][r][c])))));

  const fusedRaw = {
    idFill: fuse2D((raw) => raw.idFill),
    codeFill: fuse2D((raw) => raw.codeFill),
    p1Fill: fuse2D((raw) => raw.p1Fill),
    p2Fill: fuse3D((raw) => raw.p2Fill),
    p3Fill: base.raw.p3Fill.map((q, qi) => q.map((col, ci) => ({
      minus: fuseVal(valid.map((v) => v.raw.p3Fill[qi][ci].minus)),
      comma: fuseVal(valid.map((v) => v.raw.p3Fill[qi][ci].comma)),
      digits: col.digits.map((_, di) => fuseVal(valid.map((v) => v.raw.p3Fill[qi][ci].digits[di]))),
    }))),
  };

  const decoded = decodeSheetFills(fusedRaw, options);
  const avgFit = valid.reduce((acc, v) => acc + (v.quality?.markFit || 0), 0) / valid.length;
  const avgAlign = valid.reduce((acc, v) => acc + (v.quality?.alignment || 0), 0) / valid.length;

  return {
    ...base,
    sbd: decoded.sbd,
    code: decoded.code,
    p1: decoded.p1,
    p2: decoded.p2,
    p3: decoded.p3,
    issues: decoded.issues,
    quality: {
      ...base.quality,
      markFit: +Math.max(base.quality?.markFit || 0, avgFit).toFixed(2),
      alignment: +Math.max(base.quality?.alignment || 0, avgAlign).toFixed(3),
      marked: decoded.marked,
      uncertain: decoded.uncertain,
      threshold: decoded.threshold,
      blankFloor: decoded.blankFloor,
      inkLevel: decoded.inkLevel,
      adapted: decoded.adapted,
      burstFrames: valid.length,
    },
    raw: fusedRaw,
  };
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
  const best = findBestAlignment(marksInfo, sc, matchTol, w, h, chanR, chanG);

  // Cho phép nhận khi đủ >= 20 vạch khớp HOẶC bắt chuẩn cả 4 ô vuông đen TNMaker ở 4 góc có lưới ô tròn thật
  const fourSquareReady = Boolean(
    best && best.sqCount === 4 && best.hit >= 4
    && (best.ringScore ?? quickRingScoreAnyOrientation(chanR, chanG, w, h, best.H)) >= 0.02,
  );
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

  // Tinh chỉnh 1-1 duy nhất: ghép tối ưu từng dấu định vị với mẫu gần nhất, giữ tứ giác không suy biến
  const refineOnce = (Hcur) => {
    const pairs = [];
    for (let ti = 0; ti < TEMPLATE.marks.length; ti++) {
      const t = TEMPLATE.marks[ti];
      const [pu, pv] = Hcur(t[0], t[1]);
      for (let mi = 0; mi < marks.length; mi++) {
        const mk = marks[mi];
        const d = Math.hypot(mk.x * sc - pu, mk.y * sc - pv);
        if (d < matchTol) pairs.push({ ti, mi, d });
      }
    }
    pairs.sort((a, b) => a.d - b.d);
    const usedT = new Uint8Array(TEMPLATE.marks.length);
    const usedM = new Uint8Array(marks.length);
    const S = [];
    const D = [];
    for (let i = 0; i < pairs.length; i++) {
      const { ti, mi } = pairs[i];
      if (usedT[ti] || usedM[mi]) continue;
      usedT[ti] = 1;
      usedM[mi] = 1;
      S.push(TEMPLATE.marks[ti]);
      D.push(toFull(marks[mi]));
    }
    return { S, D };
  };
  let matched = 0;
  for (let it = 0; it < 2; it++) {
    const { S, D } = refineOnce(H);
    matched = S.length;
    if (S.length >= 4) {
      const H2 = fitHomography(S, D);
      if (H2) {
        const pts2 = [H2(...TEMPLATE.corners.TL), H2(...TEMPLATE.corners.TR), H2(...TEMPLATE.corners.BR), H2(...TEMPLATE.corners.BL)];
        if (isReasonableQuad(pts2, w, h, 0.05)) H = H2;
      }
    }
  }

  // Nếu chỉ có 4 ô vuông đen ở 4 góc (thiếu vạch mép phân biệt chiều trên/dưới),
  // dùng độ khớp viền ô tròn SBD/Mã đề/PHẦN III để tự động loại chiều ngược 180°.
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
      if (evalFit(hFlip) > evalFit(H) + 0.015) H = hFlip;
    }
  }

  // Kiểm tra cuối cùng: nếu ít vạch định vị thì buộc phải có viền ô tròn thật (chặn khóa nhầm đồ vật bàn)
  if (matched < 20 && quickRingScore(chanR, chanG, w, h, H) < 0.02) {
    return {
      ok: false,
      stage: 'bad_fit',
      marksCount: marks.length,
      squaresCount: squares.length,
      bestHit: matched,
      H: null,
      small,
      chanR,
      chanG,
      cornerMatched: { TL: false, TR: false, BR: false, BL: false },
    };
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

  const detectMaxDim = options.detectMaxDim || 820;
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
    if (inBounds && isConvexQuad(cornerPts) && area >= 0.07 * w * h) {
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

  // Đo nhanh độ sắc nét trên kênh G (giữ nguyên viền ô hồng-đỏ + nét chì) & độ nghiêng / khoảng cách
  let sharpness = 14;
  let areaRatio = 0;
  let skewDeg = 0;
  const gChan = aligned.chanG;
  if (gChan && gChan.length === w * h && w > 16 && h > 16) {
    const x0 = Math.floor(w * 0.12);
    const x1 = Math.floor(w * 0.88);
    const y0 = Math.floor(h * 0.12);
    const y1 = Math.floor(h * 0.88);
    const step = Math.max(2, Math.floor(Math.max(w, h) / 140));
    let gSum = 0;
    let gCnt = 0;
    for (let y = y0; y < y1 - 1; y += step) {
      const row = y * w;
      for (let x = x0; x < x1 - 1; x += step) {
        const v = gChan[row + x];
        gSum += Math.abs(v - gChan[row + x + 1]) + Math.abs(v - gChan[row + w + x]);
        gCnt += 2;
      }
    }
    sharpness = gCnt ? +(gSum / gCnt).toFixed(1) : 0;
  }

  if (validQuad && cornersPx) {
    const pts = [cornersPx.TL, cornersPx.TR, cornersPx.BR, cornersPx.BL];
    areaRatio = +(quadArea(pts) / Math.max(1, w * h)).toFixed(3);
    const topW = Math.hypot(cornersPx.TR[0] - cornersPx.TL[0], cornersPx.TR[1] - cornersPx.TL[1]);
    const botW = Math.hypot(cornersPx.BR[0] - cornersPx.BL[0], cornersPx.BR[1] - cornersPx.BL[1]);
    const leftH = Math.hypot(cornersPx.BL[0] - cornersPx.TL[0], cornersPx.BL[1] - cornersPx.TL[1]);
    const rightH = Math.hypot(cornersPx.BR[0] - cornersPx.TR[0], cornersPx.BR[1] - cornersPx.TR[1]);
    const perspRatio = Math.max(
      Math.max(topW, botW) / Math.max(1, Math.min(topW, botW)),
      Math.max(leftH, rightH) / Math.max(1, Math.min(leftH, rightH)),
    );
    // Ước lượng góc nghiêng phối cảnh (0° = song song phẳng)
    skewDeg = Math.min(45, Math.round(Math.max(0, perspRatio - 1) * 58));
  }

  // Chỉ gắn cờ ảnh mờ khi gradient kênh G rất thấp (< 2.2) để không báo nhầm phiếu in sáng sạch
  const blurry = sharpness < 2.2;
  const distanceState = validQuad && areaRatio < 0.13 ? 'far' : 'ok';
  const skewState = validQuad && skewDeg > 18 ? 'tilted' : 'ok';
  const ready = aligned.ok
    && validQuad
    && (markFit >= 0.42 || cornersCount === 4)
    && lightState === 'ok'
    && !blurry
    && skewState === 'ok';

  let hint;
  if (lightState === 'dark') {
    hint = 'Ánh sáng hơi tối — bật đèn Flash hoặc tăng sáng bàn thi.';
  } else if (lightState === 'bright') {
    hint = 'Phiếu bị lóa sáng — nghiêng nhẹ máy để tránh bóng đèn.';
  } else if (blurry && detected) {
    hint = 'Ảnh đang hơi mờ — giữ chắc tay 1 giây để máy lấy nét.';
  } else if (skewState === 'tilted') {
    hint = 'Đang nghiêng góc — giữ máy song song với mặt phiếu A4.';
  } else if (distanceState === 'far' && detected) {
    hint = 'Phiếu hơi xa — đưa camera lại gần khít khung hơn.';
  } else if (ready) {
    hint = `Khóa chuẩn 4 góc (${hits}/${TEMPLATE.marks.length}) — Giữ yên để tự chấm!`;
  } else if (detected) {
    hint = `Đã bắt ${cornersCount}/4 ô góc — Căn 4 ô vuông đen khít 4 góc khung.`;
  } else if (aligned.marksCount >= 2) {
    hint = `Đã thấy ${aligned.squaresCount || 0} ô đen — Căn đủ 4 ô vuông đen trên giấy vào 4 ô góc.`;
  } else {
    hint = 'Đưa 4 ô vuông đen ở 4 góc phiếu vào đúng 4 ô ngắm trên màn hình.';
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
    sharpness,
    blurry,
    areaRatio,
    distanceState,
    skewDeg,
    skewState,
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

  // 3) Tinh chỉnh vi mô theo vùng (chống cong giấy nhẹ) & đo mọi ô
  const T = TEMPLATE;
  const sampler = makeSampler(chanR, chanG, w, h, H);
  const useLocalRefine = options.localRefine !== false;
  const offTop = useLocalRefine
    ? sampler.refineSectionOffset([[T.idX[1], T.digitY[2]], [T.idX[4], T.digitY[7]], [T.codeX[1], T.digitY[4]]])
    : [0, 0];
  const offP1 = useLocalRefine
    ? sampler.refineSectionOffset([[T.p1X[0][1], T.p1Y[2]], [T.p1X[1][2], T.p1Y[6]], [T.p1X[2][1], T.p1Y[4]], [T.p1X[3][2], T.p1Y[7]]])
    : [0, 0];
  const offP2 = useLocalRefine
    ? sampler.refineSectionOffset([[T.p2X[0][1], T.p2Y[1]], [T.p2X[1][2], T.p2Y[2]], [T.p2X[2][1], T.p2Y[1]], [T.p2X[3][2], T.p2Y[2]]])
    : [0, 0];
  const offP3 = useLocalRefine
    ? sampler.refineSectionOffset([[T.p3X[0][1], T.p3DigitY[2]], [T.p3X[2][2], T.p3DigitY[5]], [T.p3X[4][1], T.p3DigitY[7]]])
    : [0, 0];

  const grid = (xs, ys, [ox, oy]) => ys.map((y) => xs.map((x) => sampler.measure(x, y, ox, oy).fill));

  const idFill = T.idX.map((x) => T.digitY.map((y) => sampler.measure(x, y, offTop[0], offTop[1]).fill));       // [col][digit]
  const codeFill = T.codeX.map((x) => T.digitY.map((y) => sampler.measure(x, y, offTop[0], offTop[1]).fill));
  const p1Fill = []; // [q][4]
  for (let b = 0; b < 4; b++) {
    const g = grid(T.p1X[b], T.p1Y, offP1); // [row][col]
    g.forEach((row) => p1Fill.push(row));
  }
  const p2Fill = []; // [q][ý][2]
  for (let b = 0; b < 4; b++) {
    for (let k = 0; k < 2; k++) {
      const q = [];
      for (let r = 0; r < 4; r++) {
        q.push([
          sampler.measure(T.p2X[b][k * 2], T.p2Y[r], offP2[0], offP2[1]).fill,
          sampler.measure(T.p2X[b][k * 2 + 1], T.p2Y[r], offP2[0], offP2[1]).fill,
        ]);
      }
      p2Fill.push(q);
    }
  }
  const p3Fill = T.p3X.map((xs) => xs.map((x, c) => ({
    minus: c === 0 ? sampler.measure(x, T.p3MinusY, offP3[0], offP3[1]).fill : 0,
    comma: c === 1 || c === 2 ? sampler.measure(x, T.p3CommaY, offP3[0], offP3[1]).fill : 0,
    digits: T.p3DigitY.map((y) => sampler.measure(x, y, offP3[0], offP3[1]).fill),
  })));

  // Chất lượng căn chỉnh: viền ô phải rơi đúng chỗ
  let rs = 0;
  let rn = 0;
  for (let b = 0; b < 4; b++) {
    for (let r = 0; r < 10; r += 3) for (let c = 0; c < 4; c++) { rs += sampler.ringScore(T.p1X[b][c], T.p1Y[r], offP1[0], offP1[1]); rn++; }
  }
  const alignment = rn ? rs / rn : 0;

  // 4) Giải mã với ngưỡng thích ứng theo phiếu
  const raw = { idFill, codeFill, p1Fill, p2Fill, p3Fill };
  const decoded = decodeSheetFills(raw, {
    markThreshold: options.markThreshold,
    faintBand: opt.faintBand,
    adaptive: options.adaptive,
    sensitivity: opt.sensitivity,
  });

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

  const cornersMatchedCount = Object.values(aligned.cornerMatched || {}).filter(Boolean).length;
  const fourCornersExact = cornersMatchedCount === 4 && alignment >= 0.12;

  return {
    ok: true,
    sbd: decoded.sbd,
    code: decoded.code,
    p1: decoded.p1,
    p2: decoded.p2,
    p3: decoded.p3,
    issues: decoded.issues,
    quality: {
      markFit: +markFit.toFixed(2),
      alignment: +alignment.toFixed(3),
      marked: decoded.marked,
      uncertain: decoded.uncertain,
      threshold: decoded.threshold,
      blankFloor: decoded.blankFloor,
      inkLevel: decoded.inkLevel,
      adapted: decoded.adapted,
      cornersNorm,
      warn: (!fourCornersExact && markFit < 0.5) || alignment < 0.03
        ? 'Ảnh có thể bị lệch/méo — kiểm tra kỹ kết quả hoặc chụp lại.'
        : null,
    },
    raw,
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
