/* ============================================================
   omrQuality.js — kiểm tra chất lượng ảnh phiếu A4 TRƯỚC khi chấm
   ------------------------------------------------------------
   Vì sao cần: bộ đọc OMR có thể vẫn "đọc ra" một phiếu mờ/nghiêng
   nhưng tô sai ô → điểm sai mà không ai biết. Ở đây đo trực tiếp
   trên pixel: độ phân giải, độ sáng, độ tương phản, độ nét
   (năng lượng gradient). Thuần JS, không phụ thuộc DOM → test được.

   Ngưỡng đặt theo ảnh chụp điện thoại thường (≥1000px chiều ngang,
   nền giấy sáng, chữ đen rõ). Có thể chỉnh qua IMG_LIMITS.
   ============================================================ */

export const IMG_LIMITS = {
  minWidth: 1000,
  minHeight: 700,
  /* 0..255 */
  minBrightness: 55,
  maxBrightness: 240,
  /* độ lệch chuẩn độ sáng — thấp = ảnh bệt, thiếu tương phản */
  minContrast: 18,
  /* trung bình chênh lệch điểm ảnh kề nhau — thấp = ảnh mờ/nhòe */
  minSharpness: 9,
};

const SAMPLE_MAX = 220; // lấy mẫu tối đa 220×220 điểm để chạy nhanh

function luma(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Đo chất lượng từ ImageData (hoặc object cùng hình dạng {width,height,data}).
 * Trả về số liệu + danh sách vấn đề bằng tiếng Việt để hiện cho người dùng.
 */
export function measureImageQuality(imageData, limits = IMG_LIMITS) {
  const width = Number(imageData?.width) || 0;
  const height = Number(imageData?.height) || 0;
  const data = imageData?.data;

  if (!width || !height || !data || data.length < width * height * 4) {
    return {
      width, height, brightness: 0, contrast: 0, sharpness: 0,
      issues: ['Không đọc được dữ liệu ảnh.'], ok: false,
    };
  }

  const stepX = Math.max(1, Math.ceil(width / SAMPLE_MAX));
  const stepY = Math.max(1, Math.ceil(height / SAMPLE_MAX));

  const cols = Math.floor((width - 1) / stepX) + 1;
  const rows = Math.floor((height - 1) / stepY) + 1;
  const grid = new Float32Array(cols * rows);

  let sum = 0;
  let sumSq = 0;
  let n = 0;

  for (let gy = 0; gy < rows; gy += 1) {
    const y = gy * stepY;
    for (let gx = 0; gx < cols; gx += 1) {
      const x = gx * stepX;
      const i = (y * width + x) * 4;
      const v = luma(data[i], data[i + 1], data[i + 2]);
      grid[gy * cols + gx] = v;
      sum += v;
      sumSq += v * v;
      n += 1;
    }
  }

  const mean = n ? sum / n : 0;
  const variance = n ? Math.max(0, sumSq / n - mean * mean) : 0;
  const contrast = Math.sqrt(variance);

  /* Năng lượng gradient: trung bình |khác biệt| giữa điểm kề nhau */
  let grad = 0;
  let gcount = 0;
  for (let gy = 0; gy < rows; gy += 1) {
    for (let gx = 0; gx < cols; gx += 1) {
      const v = grid[gy * cols + gx];
      if (gx + 1 < cols) { grad += Math.abs(v - grid[gy * cols + gx + 1]); gcount += 1; }
      if (gy + 1 < rows) { grad += Math.abs(v - grid[(gy + 1) * cols + gx]); gcount += 1; }
    }
  }
  const sharpness = gcount ? grad / gcount : 0;

  const issues = [];
  if (width < limits.minWidth || height < limits.minHeight) {
    issues.push(`Ảnh nhỏ (${width}×${height}) — nên chụp ở độ phân giải cao hơn để đọc đúng các ô tô.`);
  }
  if (mean < limits.minBrightness) issues.push('Ảnh quá tối — bật thêm đèn hoặc chụp lại.');
  if (mean > limits.maxBrightness) issues.push('Ảnh quá chói/lóa — tránh đèn flash chiếu thẳng vào phiếu.');
  if (contrast < limits.minContrast) issues.push('Tương phản thấp — phiếu và nền gần như cùng màu, khó tách ô.');
  if (sharpness < limits.minSharpness) issues.push('Ảnh mờ hoặc rung tay — giữ máy chắc và lấy nét lại.');

  return {
    width,
    height,
    brightness: Math.round(mean),
    contrast: Math.round(contrast * 10) / 10,
    sharpness: Math.round(sharpness * 10) / 10,
    issues,
    ok: issues.length === 0,
  };
}

/** Điểm 0..100 để hiển thị nhanh mức "ảnh tốt". */
export function qualityScore(q) {
  if (!q) return 0;
  let score = 100;
  if (q.width < IMG_LIMITS.minWidth) score -= 20;
  if (q.contrast < IMG_LIMITS.minContrast) score -= 25;
  if (q.sharpness < IMG_LIMITS.minSharpness) score -= 30;
  if (q.brightness < IMG_LIMITS.minBrightness || q.brightness > IMG_LIMITS.maxBrightness) score -= 20;
  return Math.max(0, Math.min(100, score));
}

/** Gom số báo danh trùng: { sbd: [id, id] } — bỏ qua SBD không đọc được. */
export function groupBySbd(items = []) {
  const map = {};
  items.forEach((it) => {
    const sbd = String(it?.sbd || '').trim();
    if (!sbd || sbd.includes('?')) return;
    if (!map[sbd]) map[sbd] = [];
    map[sbd].push(it.id);
  });
  return map;
}

/** Tập id của các phiếu có SBD trùng với phiếu khác (để tô cảnh báo). */
export function duplicateSbdIds(items = []) {
  const map = groupBySbd(items);
  const out = new Set();
  Object.values(map).forEach((ids) => {
    if (ids.length > 1) ids.forEach((id) => out.add(id));
  });
  return out;
}

/** Thông điệp tổng hợp cho người dùng. */
export function duplicateSbdMessage(items = []) {
  const map = groupBySbd(items);
  const dups = Object.entries(map).filter(([, ids]) => ids.length > 1);
  if (!dups.length) return '';
  const list = dups.map(([sbd, ids]) => `${sbd} (${ids.length} phiếu)`).join(', ');
  return `Trùng số báo danh: ${list}. Kiểm tra lại trước khi lưu — nếu lưu cả hai, phiếu sau sẽ ghi đè phiếu trước.`;
}
