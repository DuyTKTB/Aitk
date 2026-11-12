/**
 * chalkboardEngine.js
 * 
 * Bộ máy nạp và tương tác với WebAssembly Engine (ve.wasm) và Trình vẽ Bảng phấn tương tác
 * Hỗ trợ hình học không gian 3D, thiết diện, đồ thị giải tích và kiểm định cơ học
 */

let wasmPromise = null;
let activeEngine = null;
const deadInstances = new WeakSet();
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class ChalkboardEngineError extends Error {}

/**
 * Tải và khởi tạo ve.wasm
 */
export async function loadChalkboardWasm(wasmUrl = '/ve.wasm') {
  if (activeEngine && !deadInstances.has(activeEngine)) {
    return activeEngine;
  }
  if (wasmPromise) return wasmPromise;

  wasmPromise = (async () => {
    try {
      const res = await fetch(wasmUrl, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(`Không tải được bộ vẽ ve.wasm (Status: ${res.status})`);
      }
      const buffer = await res.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(buffer, {});
      activeEngine = instance.exports;
      return activeEngine;
    } catch (err) {
      wasmPromise = null;
      activeEngine = null;
      throw err;
    }
  })();

  return wasmPromise;
}

function safeExecute(engine, fn) {
  if (deadInstances.has(engine)) {
    throw new ChalkboardEngineError('Bộ vẽ WebAssembly đã gặp sự cố và đang khởi động lại.');
  }
  try {
    return fn();
  } catch (err) {
    if (err instanceof WebAssembly.RuntimeError) {
      let panicMsg = '';
      try {
        const ptr = engine.mv_loi();
        const len = engine.mv_loi_dai();
        panicMsg = decoder.decode(new Uint8Array(engine.memory.buffer, ptr, len));
      } catch (_) {}
      console.error('[Chalkboard WASM Panic]:', panicMsg || err.message);
      deadInstances.add(engine);
      activeEngine = null;
      wasmPromise = null;
      throw new ChalkboardEngineError(`Sự cố bộ vẽ: ${panicMsg.split(/\r?\n/)[0] || err.message}`);
    }
    throw err;
  }
}

function passString(engine, fn, str) {
  const bytes = encoder.encode(str);
  const ptr = engine.mv_cap(bytes.length);
  new Uint8Array(engine.memory.buffer, ptr, bytes.length).set(bytes);
  const resPtr = fn(ptr, bytes.length);
  engine.mv_tra(ptr, bytes.length);
  return readJson(engine, resPtr);
}

function readJson(engine, resPtr) {
  const len = engine.mv_do_dai();
  const jsonStr = decoder.decode(new Uint8Array(engine.memory.buffer, resPtr, len));
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Lỗi phân tích JSON từ WASM:', jsonStr);
    return null;
  }
}

const normalizeStatements = (stmts) => {
  if (Array.isArray(stmts)) {
    return stmts.map((s) => s.replace(/[\r\n]+/g, ' ')).join('\n');
  }
  return String(stmts || '');
};

/**
 * Phiên làm việc với bảng vẽ (Chalkboard Session)
 */
export class ChalkboardSession {
  constructor(engine, baChieu = true, heTruc = false) {
    this.engine = engine;
    this.baChieu = baChieu;
    this.heTruc = heTruc;
    this.lines = [];
    this.id = safeExecute(engine, () => engine.mv_moi(+!!baChieu, +!!heTruc));
  }

  them(statements) {
    const text = normalizeStatements(statements);
    const res = safeExecute(this.engine, () =>
      passString(this.engine, (ptr, len) => this.engine.mv_them(this.id, ptr, len), text)
    );
    this.lines.push(...text.split('\n').filter(Boolean));
    return res || { loi: [], ten: [] };
  }

  dat(statements) {
    const text = normalizeStatements(statements);
    safeExecute(this.engine, () =>
      passString(this.engine, (ptr, len) => this.engine.mv_dat(this.id, ptr, len), text)
    );
    this.lines = text ? text.split('\n').filter(Boolean) : [];
  }

  ve(w, h, yaw = -1.22, pitch = 0.36, zoom = 1.0, animTime = 1e6) {
    return safeExecute(this.engine, () => {
      const resPtr = this.engine.mv_ve(this.id, w, h, yaw, pitch, zoom, animTime);
      return readJson(this.engine, resPtr);
    });
  }

  nhin(viewConfig) {
    safeExecute(this.engine, () => {
      if (Array.isArray(viewConfig)) {
        this.engine.mv_nhin(this.id, ...viewConfig);
      } else {
        this.engine.mv_nhin(this.id, 0, 0, 0, 0);
      }
    });
  }

  do(expression) {
    return safeExecute(this.engine, () =>
      passString(this.engine, (ptr, len) => this.engine.mv_do(this.id, ptr, len), expression)
    );
  }

  ds() {
    return safeExecute(this.engine, () => {
      const resPtr = this.engine.mv_ds(this.id);
      return readJson(this.engine, resPtr);
    });
  }

  huy() {
    if (!deadInstances.has(this.engine)) {
      try {
        this.engine.mv_xoa(this.id);
      } catch (_) {}
    }
  }
}

/* ================= CHALKBOARD PALETTE & RENDERER ================= */

export const CHALK_COLORS = {
  trang: '#f2f3ea', // Phấn trắng
  vang: '#ffe58a',  // Phấn vàng
  hong: '#ffb8cf',  // Phấn hồng
  xanh: '#a8d8ff',  // Phấn xanh dương
  la: '#c9f0a8',    // Phấn xanh lá
  cam: '#ffd199',   // Phấn cam
};

export const PAPER_COLORS = {
  trang: '#1e293b', // Nét mực slate đậm
  vang: '#b45309',  // Nét cam vàng đậm
  hong: '#e11d48',  // Nét đỏ hồng
  xanh: '#2563eb',  // Nét xanh lam đậm
  la: '#059669',    // Nét xanh lục đậm
  cam: '#ea580c',   // Nét cam đậm
};

/**
 * Ánh xạ màu hệ thống sang gam màu phấn pastel hoặc nét mực giấy trắng
 */
export function mapToChalkColor(color, isPaper = false) {
  const palette = isPaper ? PAPER_COLORS : CHALK_COLORS;
  if (!color) return palette.trang;
  if (color in palette) return palette[color];

  const hexMatch = /^#?([0-9a-f]{6})/i.exec(color) ?? /^#?([0-9a-f]{3})$/i.exec(color);
  let r = 0, g = 0, b = 0;
  if (hexMatch && hexMatch[1].length === 6) {
    [r, g, b] = [0, 2, 4].map((i) => parseInt(hexMatch[1].slice(i, i + 2), 16));
  } else if (hexMatch) {
    [r, g, b] = [0, 1, 2].map((i) => parseInt(hexMatch[1][i] + hexMatch[1][i], 16));
  } else {
    const rgbMatch = /rgba?\(([^)]+)\)/.exec(color);
    if (!rgbMatch) return palette.trang;
    [r, g, b] = rgbMatch[1].split(',').map(Number);
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 40) return palette.trang; // gần xám/trắng

  let h = 0;
  if (max === r) h = ((g - b) / (max - min)) * 60;
  else if (max === g) h = (2 + (b - r) / (max - min)) * 60;
  else h = (4 + (r - g) / (max - min)) * 60;

  h = (h + 360) % 360;
  if (h < 25 || h >= 310) return palette.hong;
  if (h < 75) return palette.vang;
  if (h < 170) return palette.la;
  return palette.xanh;
}

const chalkJitter = (index, pass) => Math.sin(index * 12.9898 + pass * 78.233) * 0.65;

/**
 * Phân tích nhãn toán học/vật lí: tách kí hiệu véc-tơ, chữ cái Hy Lạp, chỉ số dưới (Subscript)
 */
export function parseLabelParts(raw) {
  let s = String(raw || '').replace(/\\?\$/g, '').trim();
  let isVector = false;

  // 1. Nhận diện véc-tơ: \vec{F}, \vec{v}, vec(UR), v.v.
  const vecMatch = s.match(/^\\vec\{([a-zA-Z0-9_]+)\}|^vec\(([a-zA-Z0-9_]+)\)/i);
  if (vecMatch) {
    isVector = true;
    s = vecMatch[1] || vecMatch[2];
  }

  // 2. Chuyển đổi kí hiệu toán học & chữ cái Hy Lạp phổ biến
  s = s
    .replace(/\\alpha/gi, 'α')
    .replace(/\\beta/gi, 'β')
    .replace(/\\gamma/gi, 'γ')
    .replace(/\\delta/gi, 'δ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\theta/gi, 'θ')
    .replace(/\\lambda/gi, 'λ')
    .replace(/\\mu/gi, 'μ')
    .replace(/\\pi/gi, 'π')
    .replace(/\\sigma/gi, 'σ')
    .replace(/\\varphi|\\phi/gi, 'φ')
    .replace(/\\omega/gi, 'ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\circ|\^0/g, '°')
    .replace(/\\sqrt\{([^}]*)\}/g, '√$1')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/[{}]/g, '');

  // 3. Tách chỉ số dưới (Subscript): U_R, Z_L, F_ms, A_1
  const subMatch = s.match(/^([^_]+)_([a-zA-Z0-9]+)$/);
  if (subMatch) {
    return { isVector, base: subMatch[1], sub: subMatch[2] };
  }
  return { isVector, base: s, sub: '' };
}

/**
 * Vẽ nhãn kí hiệu toán học chuẩn xác với chỉ số dưới và mũi tên véc-tơ
 */
function drawMathLabel(ctx, item, drawColor, isPaper) {
  const parsed = parseLabelParts(item.s);
  const baseSize = Math.max(13, Math.round((item.z || 15) * 1.15));
  const fontFamily = isPaper
    ? '-apple-system, BlinkMacSystemFont, "Google Sans", "Be Vietnam Pro", Roboto, sans-serif'
    : '"Patrick Hand", "Baloo 2", cursive, sans-serif';

  ctx.fillStyle = drawColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Đo chiều rộng chữ chính
  ctx.font = `600 ${baseSize}px ${fontFamily}`;
  const baseMetrics = ctx.measureText(parsed.base);
  const baseWidth = baseMetrics.width;

  let totalWidth = baseWidth;
  let subMetrics = null;
  const subSize = Math.max(9, Math.round(baseSize * 0.72));

  if (parsed.sub) {
    ctx.font = `600 ${subSize}px ${fontFamily}`;
    subMetrics = ctx.measureText(parsed.sub);
    totalWidth += subMetrics.width + 1.5;
  }

  // Căn lề theo item.n (0: trái, 1: giữa, 2: phải)
  let startX = item.x;
  if (item.n === 1) startX -= totalWidth / 2;
  else if (item.n === 2) startX -= totalWidth;

  const baselineY = item.y + baseSize * 0.35;

  // Giữ nhãn nằm an toàn trong khung nhìn Canvas, không bị bay mất hoặc tràn mép
  const margin = 14;
  const canvasW = ctx.canvas?.clientWidth || (ctx.canvas?.width ? ctx.canvas.width / (window.devicePixelRatio || 1) : 600);
  const canvasH = ctx.canvas?.clientHeight || (ctx.canvas?.height ? ctx.canvas.height / (window.devicePixelRatio || 1) : 400);
  const safeX = Math.max(margin, Math.min(canvasW - totalWidth - margin, startX));
  const safeY = Math.max(margin + baseSize, Math.min(canvasH - margin, baselineY));

  // 1. Vẽ mũi tên véc-tơ nếu là véc-tơ (\vec{F}, \vec{v}, \vec{U})
  if (parsed.isVector) {
    const arrowY = safeY - baseSize * 0.9;
    ctx.save();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = Math.max(1.2, baseSize * 0.08);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(safeX, arrowY);
    ctx.lineTo(safeX + baseWidth, arrowY);
    ctx.stroke();
    // Đầu mũi tên
    ctx.beginPath();
    ctx.moveTo(safeX + baseWidth - 3.5, arrowY - 2.8);
    ctx.lineTo(safeX + baseWidth, arrowY);
    ctx.lineTo(safeX + baseWidth - 3.5, arrowY + 2.8);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Vẽ chữ cái cơ sở (Base)
  ctx.font = `600 ${baseSize}px ${fontFamily}`;
  ctx.fillText(parsed.base, safeX, safeY);

  // 3. Vẽ chỉ số dưới (Subscript)
  if (parsed.sub) {
    ctx.font = `600 ${subSize}px ${fontFamily}`;
    ctx.fillText(parsed.sub, safeX + baseWidth + 1.5, safeY + subSize * 0.32);
  }
}

/**
 * Vẽ lưới tọa độ toán học tinh tế (Mathematical Grid)
 */
export function drawMathematicalGrid(ctx, width, height, isPaper) {
  ctx.save();
  const step = 28;

  if (isPaper) {
    // Chấm tọa độ mờ tinh tế kiểu giấy tập kĩ thuật / Desmos
    ctx.fillStyle = 'rgba(15, 23, 42, 0.09)';
    for (let x = step / 2; x < width; x += step) {
      for (let y = step / 2; y < height; y += step) {
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }
  } else {
    // Kẻ lưới phấn mờ trên bảng xanh
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let x = 0; x < width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Tính toán tọa độ phân đoạn cho diễn hoạt vẽ mượt mà (Progressive Stroke Interpolation)
 */
export function getPartialPoints(points, progress) {
  if (progress >= 1) return points;
  if (progress <= 0 || !points || points.length < 4) return points ? points.slice(0, 2) : [];

  let totalLen = 0;
  const segLens = [];
  for (let i = 2; i < points.length; i += 2) {
    const dx = points[i] - points[i - 2];
    const dy = points[i + 1] - points[i - 1];
    const len = Math.hypot(dx, dy);
    segLens.push(len);
    totalLen += len;
  }

  const targetLen = totalLen * Math.max(0, Math.min(1, progress));
  let curLen = 0;
  const result = [points[0], points[1]];

  for (let s = 0; s < segLens.length; s++) {
    const slen = segLens[s];
    const p1x = points[s * 2];
    const p1y = points[s * 2 + 1];
    const p2x = points[(s + 1) * 2];
    const p2y = points[(s + 1) * 2 + 1];

    if (curLen + slen <= targetLen) {
      result.push(p2x, p2y);
      curLen += slen;
    } else {
      const rem = targetLen - curLen;
      const t = rem / (slen || 1);
      result.push(p1x + (p2x - p1x) * t, p1y + (p2y - p1y) * t);
      break;
    }
  }
  return result;
}

/**
 * Xuất ảnh Canvas hình vẽ chuẩn HD tải về máy
 */
export function exportCanvasImage(canvas, filename = 'elec-ai-hinh-ve.png', isDark = false) {
  if (!canvas) return;
  try {
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    
    // Nền trắng hoặc đen sạch sẽ
    ctx.fillStyle = isDark ? '#141517' : '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);

    const a = document.createElement('a');
    a.href = offscreen.toDataURL('image/png');
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.warn('[exportCanvasImage] Lỗi xuất ảnh:', err);
  }
}

/**
 * Vẽ các đối tượng của ve.wasm lên canvas với phong cách Bảng Phấn hoặc Nền Giấy Tối Giản
 * Hỗ trợ diễn hoạt vẽ luỹ tiến từng nét mượt mà (progress: 0.0 -> 1.0)
 */
export function renderChalkboard(ctx, elements, options = {}) {
  if (!ctx || !Array.isArray(elements)) return;

  const {
    chalkStyle = true,
    paperTheme = false,
    showLabels = true,
    showGrid = true,
    progress = 1.0, // Diễn hoạt vẽ mượt mà từ 0 -> 1
  } = options;
  const isPaper = paperTheme || !chalkStyle;
  const width = ctx.canvas?.clientWidth || (ctx.canvas?.width ? ctx.canvas.width / (window.devicePixelRatio || 1) : 600);
  const height = ctx.canvas?.clientHeight || (ctx.canvas?.height ? ctx.canvas.height / (window.devicePixelRatio || 1) : 400);

  // 0. VẼ LƯỚI TỌA ĐỘ TOÁN HỌC NẾU ĐƯỢC BẬT
  if (showGrid) {
    drawMathematicalGrid(ctx, width, height, isPaper);
  }

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const totalEl = elements.length;
  // Bảng lưu trữ nhãn đã vẽ để khử trùng lặp và chồng lấn chữ (P/P, G/G, E/E)
  const drawnLabels = [];

  elements.forEach((item, idx) => {
    // Tính toán tiến trình diễn hoạt riêng cho đối tượng này
    let elProgress = 1.0;
    if (progress < 1.0) {
      const stepSlice = 1.0 / Math.max(1, totalEl);
      const elStart = idx * stepSlice;
      if (progress < elStart) return; // Chưa tới lượt vẽ đối tượng này
      elProgress = Math.min(1.0, (progress - elStart) / stepSlice);
    }

    const alpha = Math.max(0, Math.min(1, (item.a ?? 1) * (item.t === 'c' ? elProgress : 1)));
    const drawColor = mapToChalkColor(item.c, isPaper);

    // 1. ĐƯỜNG THẲNG / ĐOẠN THẲNG / ĐƯỜNG CONG (t === 'd')
    if (item.t === 'd') {
      if (!item.p || item.p.length < 4) return;
      const pts = elProgress < 1.0 ? getPartialPoints(item.p, elProgress) : item.p;
      if (pts.length < 4) return;

      const strokeWidth = Math.max(1.6, (item.w || 2) * 0.95);
      const isDashed = !!item.s;
      ctx.setLineDash(isDashed ? [Math.max(5, strokeWidth * 3.2), Math.max(4, strokeWidth * 2.4)] : []);
      ctx.strokeStyle = drawColor;

      if (chalkStyle && !isPaper) {
        // Mô phỏng 2 lượt vẽ phấn để tạo độ xước tự nhiên
        for (const [pass, passAlpha, widthScale] of [[0, 0.92, 1], [1, 0.35, 0.6]]) {
          ctx.globalAlpha = alpha * passAlpha;
          ctx.lineWidth = strokeWidth * widthScale;
          ctx.beginPath();
          ctx.moveTo(pts[0] + chalkJitter(idx, pass), pts[1] + chalkJitter(idx + 7, pass));
          for (let i = 2; i < pts.length; i += 2) {
            const jx = chalkJitter(i + idx, pass) * (pass ? 1.3 : 0.6);
            const jy = chalkJitter(i + idx + 3, pass) * (pass ? 1.3 : 0.6);
            ctx.lineTo(pts[i] + jx, pts[i + 1] + jy);
          }
          ctx.stroke();
        }
      } else {
        ctx.globalAlpha = alpha;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) {
          ctx.lineTo(pts[i], pts[i + 1]);
        }
        ctx.stroke();
      }
    }

    // 2. DIỆN TÍCH / MẶT PHẲNG / ĐA GIÁC (t === 'v')
    else if (item.t === 'v') {
      if (!item.p || item.p.length < 6) return;
      if (elProgress < 0.4) return;
      ctx.globalAlpha = alpha * (isPaper ? 0.16 : 0.22) * Math.min(1, (elProgress - 0.4) / 0.6);
      ctx.fillStyle = drawColor;
      ctx.beginPath();
      ctx.moveTo(item.p[0], item.p[1]);
      for (let i = 2; i < item.p.length; i += 2) {
        ctx.lineTo(item.p[i], item.p[i + 1]);
      }
      ctx.closePath();
      ctx.fill();
    }

    // 3. ĐIỂM (t === 'p')
    else if (item.t === 'p') {
      ctx.setLineDash([]);
      ctx.globalAlpha = alpha;
      const pointScale = elProgress < 1.0 ? Math.min(1.0, elProgress * 1.3) : 1.0;
      const radius = Math.max(1.8, (item.r || 3.2) * pointScale);
      ctx.beginPath();
      ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = item.h ? '#ffffff' : drawColor;
      ctx.fill();
      if (item.h) {
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }

    // 4. NHÃN CHỮ TOÁN HỌC & CHỈ SỐ DƯỚI (t === 'c')
    else if (item.t === 'c' && showLabels) {
      if (elProgress < 0.3) return;
      const cleanText = String(item.s || '').trim();
      if (!cleanText) return;

      // 1. Không vẽ các nhãn đoạn thẳng thừa thãi 2-3 chữ cái (như "EP", "AB", "BC", "SA") gây đè chữ lên điểm
      if (/^[A-Z]{2,4}$/.test(cleanText)) {
        return;
      }

      // 2. Khử tuyệt đối nhãn trùng tên (mỗi tên điểm A, B, C, S, G, H, P, E, I, M, K... chỉ vẽ duy nhất 1 lần trên toàn Canvas)
      // Đồng thời ngăn ngừa 2 nhãn khác nhau đè sát lên nhau (dist < 18px)
      const isDuplicate = drawnLabels.some((lbl) => {
        const dist = Math.hypot(lbl.x - item.x, lbl.y - item.y);
        return lbl.text === cleanText || dist < 18;
      });
      if (isDuplicate) return;
      drawnLabels.push({ text: cleanText, x: item.x, y: item.y });

      ctx.setLineDash([]);
      ctx.globalAlpha = alpha * Math.min(1, (elProgress - 0.3) / 0.7);
      drawMathLabel(ctx, item, drawColor, isPaper);
    }
  });

  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
}

/* ================= THƯ VIỆN BÀI GIẢNG HÌNH HỌC MẪU ================= */

export const SAMPLE_CHALKBOARD_LESSONS = [
  {
    id: 'bai-5-hinh-chop-sabc-thiet-dien',
    mon: 'toan',
    lop: 11,
    chuDe: 'Hình không gian - Thiết diện & Menelaus',
    tieuDe: 'Bài 5: Hình chóp S.ABC & Thiết diện (IEG)',
    deBai: 'Cho hình chóp S.ABC, E, F lần lượt là trung điểm AC và BC. 1. Tìm giao tuyến của (SAB) và (SEF). 2. Gọi M là trung điểm của SB và I là điểm trên SA thỏa mãn AI = 3IS. Tìm giao điểm K của IM và (ABC) và giao điểm H của BC và (EIM). Tính tỉ số BH/BC. 3. Gọi G là trọng tâm của ΔSBC. Tìm thiết diện của hình chóp S.ABC cắt bởi (IEG).',
    baChieu: true,
    heTruc: false,
    gocNhin: [-1.22, 0.36, 1.0],
    buoc: [
      {
        tieuDe: 'Tìm giao tuyến của (SAB) và (SEF)',
        giaiThich: 'Ta có điểm chung $S \\in (SAB) \\cap (SEF)$. Trong tam giác đáy $ABC$, $E$ và $F$ là trung điểm của $AC$ và $BC$ nên $EF$ là đường trung bình $\\implies EF \\parallel AB$. Mặt khác $AB \\subset (SAB)$ và $EF \\subset (SEF)$. Theo định lý giao tuyến của hai mặt phẳng chứa hai đường song song, giao tuyến của $(SAB)$ và $(SEF)$ là đường thẳng $d$ đi qua $S$ và song song với $AB$ (đồng thời song song với $EF$).',
        lenh: [
          'A = (-3.2, 0, 0)',
          'C = (3.5, 0, 0)',
          'B = (-0.6, -2.6, 0)',
          'S = (0.2, 0.4, 5.0)',
          'Segment(A, C) | style=dashed | color=white',
          'Segment(A, B) | color=yellow',
          'Segment(B, C) | color=yellow',
          'Segment(S, A)',
          'Segment(S, B)',
          'Segment(S, C)',
          'E = (0.15, 0, 0)',
          'F = (1.45, -1.3, 0)',
          'Segment(E, F) | style=dashed | color=white',
          'Segment(S, E) | style=dashed | color=white',
          'Segment(S, F) | color=white',
          'd1 = (-1.2, 1.6, 5.0)',
          'd2 = (1.6, -0.8, 5.0)',
          'Segment(d1, d2) | color=pink',
        ],
      },
      {
        tieuDe: 'Xác định giao điểm K, H và Tính tỉ số BH/BC bằng Menelaus',
        giaiThich: 'Trong $(SAB)$: Do $AI = 3IS \\implies \\frac{SI}{SA} = \\frac{1}{4} \\neq \\frac{SM}{SB} = \\frac{1}{2}$ nên $IM$ cắt $AB$ kéo dài tại $K = IM \\cap (ABC)$. Áp dụng định lý Menelaus cho $\\Delta SAB$ với cát tuyến $K-M-I$: $\\frac{KA}{KB} \\cdot \\frac{MB}{MS} \\cdot \\frac{SI}{IA} = 1 \\implies \\frac{KA}{KB} = 3 \\implies KA = 3KB \\implies AB = 2KB \\implies \\frac{KB}{KA} = \\frac{1}{3}$. Trong mặt đáy $(ABC)$: Nối $EK$ cắt cạnh $BC$ tại $H = BC \\cap (EIM)$. Áp dụng định lý Menelaus cho $\\Delta ABC$ với cát tuyến $K-H-E$: $\\frac{KB}{KA} \\cdot \\frac{EA}{EC} \\cdot \\frac{CH}{HB} = 1 \\implies \\frac{1}{3} \\cdot 1 \\cdot \\frac{CH}{HB} = 1 \\implies CH = 3HB \\implies \\frac{BH}{BC} = \\frac{1}{4}$.',
        lenh: [
          'I = (-0.65, 0.3, 3.75)',
          'M = (-0.2, -1.1, 2.5)',
          'K = (0.7, -3.9, 0)',
          'Segment(S, I) | color=yellow',
          'Segment(I, A) | color=yellow',
          'Segment(I, M) | color=pink',
          'Segment(B, K) | color=blue',
          'Segment(M, K) | color=blue',
          'H = (0.425, -1.95, 0)',
          'Segment(K, H) | color=blue',
          'Segment(E, H) | style=dashed | color=green',
          'Segment(I, E) | style=dashed | color=pink',
        ],
      },
      {
        tieuDe: 'Tìm thiết diện của hình chóp S.ABC cắt bởi (IEG)',
        giaiThich: 'Trọng tâm $G$ nằm trên trung tuyến $SF$ của $\\Delta SBC$. Trong mặt phẳng $(SAC)$, đoạn $IE$ cắt $SC$ tại điểm $T$ (phía trên đỉnh $S$, thỏa mãn $S$ là trung điểm $CT$). Trong mặt phẳng $(SBC)$, đường thẳng $TG$ cắt cạnh $SB$ tại điểm $Q$ và cắt cạnh $BC$ tại điểm $P$. Khi đó thiết diện là tứ giác khép kín $IQPE$ với hai cạnh nhìn thấy $IQ, QP$ (nét liền) và hai cạnh bị khuất bên trong $PE, EI$ (nét đứt), hoàn toàn khớp với hình vẽ gốc SGK.',
        lenh: [
          'G = (1.033, -0.733, 1.667)',
          'Q = (-0.35, -0.65, 3.25)',
          'P = (0.75, -1.8, 0)',
          'Segment(I, Q) | color=pink',
          'Segment(Q, P) | color=pink',
          'Segment(P, E) | style=dashed | color=pink',
          'Segment(E, I) | style=dashed | color=pink',
          'Polygon(I, Q, P, E) | color=pink',
        ],
      },
    ],
    dapSo: '1. Giao tuyến d // AB // EF qua S. 2. K = IM ∩ AB, H = EK ∩ BC, tỉ số BH/BC = 1/4. 3. Thiết diện là tứ giác IQPE.',
    meoNho: 'Để tìm giao điểm và tỉ số đoạn thẳng trong hình không gian, luôn xét trong cùng một mặt phẳng (đồng phẳng) rồi dùng Định lý Menelaus!',
  },
  {
    id: 'thiet-dien-sabc-chuan-sgk',
    mon: 'toan',
    lop: 11,
    chuDe: 'Hình không gian - Thiết diện',
    tieuDe: 'Tìm thiết diện của hình chóp S.ABC cắt bởi mặt phẳng (IME)',
    deBai: 'Cho hình chóp $S.ABC$. Lấy điểm $I$ trên cạnh $SA$, điểm $M$ trên cạnh $SB$, và điểm $E$ trên cạnh $AC$. Xác định thiết diện của hình chóp khi cắt bởi mặt phẳng $(IME)$.',
    baChieu: true,
    heTruc: false,
    gocNhin: [-1.22, 0.36, 1.0],
    buoc: [
      {
        tieuDe: 'Dựng hình chóp S.ABC và xác định giao tuyến ban đầu IE, IM',
        giaiThich: 'Trong mặt phẳng $(SAC)$, đoạn thẳng $IE$ là một đoạn giao tuyến của thiết diện vì $I, E \\in (IME) \\cap (SAC)$. Tương tự, trong mặt phẳng $(SAB)$, đoạn thẳng $IM$ là giao tuyến của $(IME)$ với $(SAB)$. Do $AC$ bị khuất phía sau nên $AC$ và $IE$ được vẽ bằng nét đứt.',
        lenh: [
          'A = (-3.2, 0, 0)',
          'C = (3.5, 0, 0)',
          'B = (-0.6, -2.6, 0)',
          'S = (0.2, 0.4, 5.0)',
          'Segment(A, C) | style=dashed | color=white',
          'Segment(A, B) | color=yellow',
          'Segment(B, C) | color=yellow',
          'Segment(S, A)',
          'Segment(S, B)',
          'Segment(S, C)',
          'I = (-1.16, 0.24, 3.0)',
          'M = (-0.16, -0.95, 2.75)',
          'E = (0.15, 0, 0)',
          'Segment(I, M) | color=pink',
          'Segment(I, E) | style=dashed | color=pink',
          'Segment(M, E) | style=dashed | color=pink',
        ],
      },
      {
        tieuDe: 'Kéo dài IM cắt AB tại K, nối KE cắt BC tại F',
        giaiThich: 'Trong $(SAB)$: Kéo dài $IM$ cắt đường thẳng $AB$ tại điểm $K$. Do $K \\in AB \\subset (ABC)$ nên $K \\in (IME) \\cap (ABC)$. Trong mặt phẳng đáy $(ABC)$: Nối $K$ với $E$, đường thẳng $KE$ cắt cạnh $BC$ tại điểm $F$. Khi đó đoạn $MF$ thuộc mặt phẳng $(SBC)$ và đoạn $FE$ thuộc mặt phẳng đáy $(ABC)$.',
        lenh: [
          'K = (-1.35, -4.25, -0.8)',
          'Segment(B, K) | color=blue',
          'Segment(M, K) | color=blue',
          'F = (0.85, -1.75, 0)',
          'Segment(K, F) | color=blue',
          'Segment(E, F) | style=dashed | color=green',
          'Segment(M, F) | color=green',
        ],
      },
      {
        tieuDe: 'Kết luận thiết diện tứ giác IMFE',
        giaiThich: 'Mặt phẳng $(IME)$ lần lượt cắt các mặt của hình chóp $S.ABC$ theo 4 đoạn giao tuyến: $(SAB)$ theo $IM$, $(SBC)$ theo $MF$, $(ABC)$ theo $FE$, và $(SAC)$ theo $EI$. Vậy thiết diện của hình chóp $S.ABC$ cắt bởi mặt phẳng $(IME)$ là tứ giác $IMFE$ với hai cạnh nhìn thấy ($IM, MF$) và hai cạnh bị khuất bên trong ($FE, EI$).',
        lenh: [
          'Polygon(I, M, F, E) | color=pink',
        ],
      },
    ],
    kiemDinh: [
      { bieuThuc: 'Distance(A, C)', kyVong: '6.70', ghiChu: 'Độ dài cạnh đáy AC' },
      { bieuThuc: 'Distance(I, M)', kyVong: '1.57', ghiChu: 'Đoạn thiết diện IM' },
      { bieuThuc: 'Distance(M, F)', kyVong: '3.08', ghiChu: 'Đoạn thiết diện MF' },
    ],
    dapSo: 'Thiết diện là tứ giác IMFE',
  },
  {
    id: 'chop-tam-giac-deu',
    mon: 'toan',
    lop: 11,
    chuDe: 'Hình không gian',
    tieuDe: 'Hình chóp tam giác đều S.ABC & Khoảng cách từ đỉnh tới đáy',
    deBai: 'Cho hình chóp tam giác đều $S.ABC$ có cạnh đáy bằng $4$, cạnh bên bằng $5$. Gọi $H$ là trọng tâm tam giác đáy $ABC$. Hãy dựng hình, tính chiều cao $SH$ và kiểm định kết quả đo đạc.',
    baChieu: true,
    heTruc: false,
    gocNhin: [-1.22, 0.36, 1.0],
    buoc: [
      {
        tieuDe: 'Bước 1: Dựng tam giác đều đáy ABC & Trọng tâm H',
        giaiThich: 'Đặt tam giác đáy $ABC$ trên mặt phẳng nằm ngang. $A(0, 0, 0)$, $B(4, 0, 0)$, $C(2, 2\\sqrt{3}, 0)$. $H$ là trọng tâm tam giác đều nên $H$ cũng là tâm đường tròn ngoại tiếp.',
        lenh: [
          'A = (0, 0, 0)',
          'B = (4, 0, 0)',
          'C = (2, 3.4641, 0)',
          'Segment(A, B) | color=yellow',
          'Segment(B, C) | color=yellow',
          'Segment(C, A) | color=yellow',
          'H = Centroid(A, B, C)',
        ],
      },
      {
        tieuDe: 'Bước 2: Dựng trục SH vuông góc với đáy',
        giaiThich: 'Vì $S.ABC$ đều nên $SH \\perp (ABC)$. Đáy có bán kính ngoại tiếp $R = AH = \\frac{4\\sqrt{3}}{3} \\approx 2,309$. Áp dụng Pitago trong $\\Delta SHA$: $SH = \\sqrt{SA^2 - AH^2} = \\sqrt{25 - \\frac{16}{3}} = \\sqrt{\\frac{59}{3}} \\approx 4,435$.',
        lenh: [
          'S = (2, 1.1547, 4.4347)',
          'Segment(S, H) | style=dashed | color=pink',
          'Segment(S, A)',
          'Segment(S, B)',
          'Segment(S, C)',
          'Pyramid(S, A, B, C)',
        ],
      },
      {
        tieuDe: 'Bước 3: Xác định thiết diện & Đo đạc kiểm định',
        giaiThich: 'Bộ máy kiểm định cơ học tự động đo lại chiều dài cạnh đáy, cạnh bên $SA$ và khoảng cách $SH$ từ đỉnh tới mặt phẳng $(ABC)$.',
        lenh: [
          'M = Midpoint(B, C)',
          'Segment(A, M) | style=dashed | color=green',
          'Segment(S, M) | color=green',
        ],
      },
    ],
    kiemDinh: [
      { bieuThuc: 'Distance(A, B)', kyVong: '4', ghiChu: 'Độ dài cạnh đáy AB' },
      { bieuThuc: 'Distance(S, A)', kyVong: '5', ghiChu: 'Độ dài cạnh bên SA' },
      { bieuThuc: 'Distance(S, H)', kyVong: '4.4347', ghiChu: 'Chiều cao hình chóp SH = √(59/3)' },
      { bieuThuc: 'Angle(Line(S, H), Plane(A, B, C))', kyVong: '90°', ghiChu: 'SH vuông góc với đáy (ABC)' },
    ],
    dapSo: 'SH = \\sqrt{\\frac{59}{3}} \\approx 4,435',
  },
  {
    id: 'chop-day-vuong-goc',
    mon: 'toan',
    lop: 11,
    chuDe: 'Khoảng cách & Góc',
    tieuDe: 'Hình chóp S.ABCD đáy vuông, SA ⊥ (ABCD)',
    deBai: 'Cho hình chóp $S.ABCD$ có đáy là hình vuông cạnh $a = 3$, $SA \\perp (ABCD)$ và $SA = 4$. Tính góc giữa đường thẳng $SC$ và mặt phẳng đáy $(ABCD)$.',
    baChieu: true,
    heTruc: false,
    gocNhin: [-1.15, 0.4, 0.95],
    buoc: [
      {
        tieuDe: 'Bước 1: Dựng đáy ABCD & Cột SA',
        giaiThich: 'Chọn hệ tọa độ với $A(0, 0, 0)$ làm gốc. $B(3, 0, 0)$, $D(0, 3, 0)$, $C(3, 3, 0)$. Do $SA \\perp (ABCD)$ nên $S(0, 0, 4)$.',
        lenh: [
          'A = (0, 0, 0)',
          'B = (3, 0, 0)',
          'C = (3, 3, 0)',
          'D = (0, 3, 0)',
          'S = (0, 0, 4)',
          'Segment(A, B) | color=yellow',
          'Segment(B, C) | color=yellow',
          'Segment(C, D) | color=yellow',
          'Segment(D, A) | color=yellow',
          'Segment(S, A) | style=dashed | color=pink',
        ],
      },
      {
        tieuDe: 'Bước 2: Nối các cạnh bên và đường chéo AC',
        giaiThich: 'Hình chiếu vuông góc của $SC$ lên mặt đáy $(ABCD)$ chính là đoạn thẳng $AC$. Do đó góc giữa $SC$ và $(ABCD)$ chính là góc $\\widehat{SCA}$.',
        lenh: [
          'Segment(S, B)',
          'Segment(S, C) | color=blue',
          'Segment(S, D)',
          'Segment(A, C) | style=dashed | color=green',
        ],
      },
      {
        tieuDe: 'Bước 3: Tính góc SCA',
        giaiThich: 'Tam giác $SAC$ vuông tại $A$ với $AC = 3\\sqrt{2} \\approx 4,243$ và $SA = 4$. Khi đó $\\tan \\widehat{SCA} = \\frac{SA}{AC} = \\frac{4}{3\\sqrt{2}} = \\frac{2\\sqrt{2}}{3} \\approx 0,9428 \\implies \\widehat{SCA} \\approx 43,31^\\circ$.',
        lenh: [],
      },
    ],
    kiemDinh: [
      { bieuThuc: 'Distance(A, C)', kyVong: '4.2426', ghiChu: 'Đường chéo AC = 3√2' },
      { bieuThuc: 'Distance(S, C)', kyVong: '5.8310', ghiChu: 'Độ dài cạnh bên SC = √(16+18) = √34' },
      { bieuThuc: 'Angle(Line(S, C), Line(A, C))', kyVong: '43.31°', ghiChu: 'Góc ∠SCA' },
    ],
    dapSo: '\\widehat{SCA} = \\arctan\\left(\\frac{2\\sqrt{2}}{3}\\right) \\approx 43,31^\\circ',
  },
  {
    id: 'do-thi-bac-ba',
    mon: 'toan',
    lop: 12,
    chuDe: 'Khảo sát hàm số',
    tieuDe: 'Khảo sát đồ thị hàm số bậc ba y = x³ - 3x & Tiếp tuyến',
    deBai: 'Khảo sát đồ thị hàm số $f(x) = x^3 - 3x$ trên đoạn $[-2,2; 2,2]$. Xác định các điểm cực trị và tiếp tuyến tại các điểm đó.',
    baChieu: false,
    heTruc: true,
    gocNhin: [0, 0, 1.0],
    buoc: [
      {
        tieuDe: 'Bước 1: Vẽ đồ thị f(x) và đạo hàm f\'(x)',
        giaiThich: 'Tập xác định $D = \\mathbb{R}$. Đạo hàm $f\'(x) = 3x^2 - 3 = 3(x-1)(x+1)$. Cho $f\'(x) = 0 \\iff x = \\pm 1$.',
        lenh: [
          'f(x) = x^3 - 3x | domain=[-2.2, 2.2] | color=yellow',
          'g(x) = 3x^2 - 3 | domain=[-2, 2] | color=pink | style=dashed',
        ],
      },
      {
        tieuDe: 'Bước 2: Xác định điểm cực đại và cực tiểu',
        giaiThich: 'Điểm cực đại $A(-1; 2)$ và điểm cực tiểu $B(1; -2)$. Tiếp tuyến tại hai điểm cực trị song song với trục hoành $Ox$.',
        lenh: [
          'A = (-1, 2) | color=green',
          'B = (1, -2) | color=green',
          'd1 = Line(A, (1, 2)) | color=blue | style=dashed',
          'd2 = Line(B, (-1, -2)) | color=blue | style=dashed',
        ],
      },
    ],
    kiemDinh: [
      { bieuThuc: 'Slope(f, 1)', kyVong: '0', ghiChu: 'Hệ số góc tiếp tuyến tại x = 1' },
      { bieuThuc: 'Slope(f, -1)', kyVong: '0', ghiChu: 'Hệ số góc tiếp tuyến tại x = -1' },
    ],
    dapSo: 'Cực đại (-1; 2), Cực tiểu (1; -2)',
  },
  {
    id: 'oxyz-mat-cau',
    mon: 'toan',
    lop: 12,
    chuDe: 'Tọa độ Oxyz',
    tieuDe: 'Mặt cầu Oxyz ngoại tiếp tứ diện O.ABC',
    deBai: 'Trong không gian $Oxyz$, cho $A(3, 0, 0)$, $B(0, 4, 0)$, $C(0, 0, 5)$. Viết phương trình mặt cầu $(S)$ ngoại tiếp tứ diện $OABC$ và xác định tâm, bán kính.',
    baChieu: true,
    heTruc: true,
    gocNhin: [-1.2, 0.4, 0.9],
    buoc: [
      {
        tieuDe: 'Bước 1: Biểu diễn các điểm trên các trục tọa độ',
        giaiThich: '$O(0,0,0)$ là gốc tọa độ. $A \\in Ox$, $B \\in Oy$, $C \\in Oz$. Tam diện $OABC$ vuông tại $O$.',
        lenh: [
          'O = (0, 0, 0)',
          'A = (3, 0, 0)',
          'B = (0, 4, 0)',
          'C = (0, 0, 5)',
          'Segment(O, A)',
          'Segment(O, B)',
          'Segment(O, C)',
          'Segment(A, B) | color=yellow',
          'Segment(B, C) | color=yellow',
          'Segment(C, A) | color=yellow',
        ],
      },
      {
        tieuDe: 'Bước 2: Tìm tâm I và Bán kính R',
        giaiThich: 'Tâm $I$ là trung điểm đường chéo hình hộp chữ nhật: $I(1,5; 2; 2,5)$. Bán kính $R = OI = \\frac{\\sqrt{3^2 + 4^2 + 5^2}}{2} = \\frac{\\sqrt{50}}{2} = \\frac{5\\sqrt{2}}{2} \\approx 3,5355$.',
        lenh: [
          'I = (1.5, 2, 2.5) | color=pink',
          'Sphere(I, 3.5355) | color=blue',
          'Segment(O, I) | style=dashed | color=pink',
        ],
      },
    ],
    kiemDinh: [
      { bieuThuc: 'Distance(O, I)', kyVong: '3.5355', ghiChu: 'Khoảng cách OI = 5√2/2' },
      { bieuThuc: 'Distance(A, I)', kyVong: '3.5355', ghiChu: 'Khoảng cách AI' },
      { bieuThuc: 'Distance(B, I)', kyVong: '3.5355', ghiChu: 'Khoảng cách BI' },
      { bieuThuc: 'Distance(C, I)', kyVong: '3.5355', ghiChu: 'Khoảng cách CI' },
    ],
    dapSo: 'I(1,5; 2; 2,5), R = \\frac{5\\sqrt{2}}{2}',
  },
];
