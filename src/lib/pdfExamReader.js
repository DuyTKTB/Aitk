/* ============================================================
   pdfExamReader.js — Bộ đọc & tái cấu trúc PDF đề thi chuẩn GDPT 2025
   ------------------------------------------------------------
   Giải quyết triệt để các lỗi đọc PDF phổ biến:
     1. Khôi phục dòng theo toạ độ Y + thứ tự X (tránh rớt dòng, đảo từ).
     2. Ghép chỉ số trên / chỉ số dưới (x², 10⁻³, H₂O, SO₄²⁻) đúng vị trí.
     3. Xử lý khoảng cách ghép từ thông minh (tránh "C âu 1 .", "12 , 5", "a )").
     4. Tự nhận diện bố cục 2 cột báo/thi vs bảng phương án 2x2 (fromTable: true).
     5. Đọc gạch chân, tô nền, chữ đỏ đáp án từ OperatorList (getOperatorList).
     6. Loại bỏ watermark xoay chéo & header/footer lặp lại giữa các trang.
     7. Phát hiện PDF scan / lỗi font TCVN3-ToUnicode → tự động chuyển OCR.
   ============================================================ */

import { fold, mkLine, toUnicodeSup, toUnicodeSub } from './examDocxParser.js';
import { ocrImages } from './aiOcr.js';

const TCVN3_PAIRS = [
  ['µ', 'à'], ['¸', 'á'], ['¶', 'ả'], ['·', 'ã'], ['¹', 'ạ'],
  ['¨', 'ă'], ['»', 'ằ'], ['¾', 'ắ'], ['¼', 'ẳ'], ['½', 'ẵ'], ['Æ', 'ặ'],
  ['©', 'â'], ['Ç', 'ầ'], ['Ê', 'ấ'], ['È', 'ẩ'], ['É', 'ẫ'], ['Ë', 'ậ'],
  ['Ì', 'è'], ['Ð', 'é'], ['Î', 'ẻ'], ['Ï', 'ẽ'], ['Ñ', 'ẹ'],
  ['ª', 'ê'], ['Ò', 'ề'], ['Õ', 'ế'], ['Ó', 'ể'], ['Ô', 'ễ'], ['Ö', 'ệ'],
  ['×', 'ì'], ['Ý', 'í'], ['Ø', 'ỉ'], ['Ü', 'ĩ'], ['Þ', 'ị'],
  ['ß', 'ò'], ['ã', 'ó'], ['á', 'ỏ'], ['â', 'õ'], ['ä', 'ọ'],
  ['«', 'ô'], ['å', 'ồ'], ['è', 'ố'], ['æ', 'ổ'], ['ç', 'ỗ'], ['é', 'ộ'],
  ['¬', 'ơ'], ['ê', 'ờ'], ['í', 'ớ'], ['ë', 'ở'], ['ì', 'ỡ'], ['î', 'ợ'],
  ['ï', 'ù'], ['ó', 'ú'], ['ñ', 'ủ'], ['ò', 'ũ'], ['ô', 'ụ'],
  ['­', 'ư'], ['õ', 'ừ'], ['ø', 'ứ'], ['ö', 'ử'], ['÷', 'ữ'], ['ù', 'ự'],
  ['ú', 'ỳ'], ['ý', 'ý'], ['û', 'ỷ'], ['ü', 'ỹ'], ['þ', 'ỵ'],
  ['®', 'đ'], ['¡', 'Ă'], ['¢', 'Â'], ['£', 'Ê'], ['¤', 'Ô'],
  ['¥', 'Ơ'], ['¦', 'Ư'], ['§', 'Đ'],
];
const TCVN3_MAP = new Map(TCVN3_PAIRS);
const TCVN3_STRONG_RE = /[µ¸¶·¹®ª¬¨©¡¢£¤¥¦§÷]/;
const VI_EXTENDED_UNICODE_RE = /[\u0102-\u01B0\u1EA0-\u1EF9]/i;

export function maybeFixVietnameseEncoding(text, fontFamily = '') {
  const s = String(text || '');
  if (!s) return s;
  const isLegacyFont = /^\.?vn/i.test(String(fontFamily || '').trim());
  const hasViExtended = VI_EXTENDED_UNICODE_RE.test(s);
  if (isLegacyFont || (!hasViExtended && TCVN3_STRONG_RE.test(s))) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      out += TCVN3_MAP.get(s[i]) || s[i];
    }
    return out;
  }
  return s;
}

export function detectMojibakeOrScanned(text, { itemCount = 0 } = {}) {
  const raw = String(text || '');
  const compact = raw.replace(/\s+/g, '');
  let badChars = 0;
  let normalChars = 0;
  for (let i = 0; i < compact.length; i++) {
    const code = compact.charCodeAt(i);
    if (
      code === 0xfffd ||
      (code >= 0xe000 && code <= 0xf8ff) ||
      (code < 32 && code !== 9 && code !== 10 && code !== 13)
    ) {
      badChars++;
    } else if (/[\p{L}\p{N}]/u.test(compact[i])) {
      normalChars++;
    }
  }
  if (compact.length > 0 && badChars >= 3 && (badChars / compact.length) > 0.15) {
    return { isScanned: false, isGarbled: true, reason: 'broken_font_cmap' };
  }
  if (compact.length < 25 || itemCount < 4) {
    return { isScanned: true, isGarbled: false, reason: 'empty_text_layer' };
  }
  const badRatio = badChars / compact.length;
  const alphaRatio = normalChars / compact.length;
  const isGarbled = badRatio > 0.06 || (compact.length > 40 && alphaRatio < 0.25);
  return {
    isScanned: false,
    isGarbled,
    reason: isGarbled ? 'broken_font_cmap' : 'ok',
  };
}

function mulMat(m1, m2) {
  return [
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5],
  ];
}

function applyMat(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function isAnswerHighlightColor(rgb) {
  if (!rgb) return false;
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // Bỏ qua nền trắng/đen/xám nhạt (hộp tiêu đề/bảng trung tính)
  if (max > 0.94 && min > 0.94) return false;
  if (max < 0.12) return false;
  // Nền màu rõ rệt (vàng, xanh, đỏ, hồng...) thường dùng highlight đáp án
  return (max - min) >= 0.18;
}

function isAnswerRedTextColor(rgb) {
  if (!rgb) return false;
  const [r, g, b] = rgb;
  return r >= 0.5 && r > g * 1.65 && r > b * 1.65;
}

function normalizeRgbArg(args) {
  if (!args || args.length < 3) return null;
  let [r, g, b] = args;
  if (typeof r === 'string' && r.startsWith('#')) {
    const hex = r.slice(1);
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      ];
    }
    return null;
  }
  r = Number(r); g = Number(g); b = Number(b);
  if ([r, g, b].some(Number.isNaN)) return null;
  if (r > 1 || g > 1 || b > 1) return [r / 255, g / 255, b / 255];
  return [r, g, b];
}

export function extractPdfPageVisualMarks(opList, OPS) {
  const empty = { underlines: [], highlights: [], redTextPoints: [], imageCount: 0 };
  if (!opList?.fnArray || !opList?.argsArray || !OPS) return empty;

  const underlines = [];
  const highlights = [];
  const redTextPoints = [];
  let imageCount = 0;

  try {
    const stack = [];
    let ctm = [1, 0, 0, 1, 0, 0];
    let fillRgb = [0, 0, 0];
    let tm = [1, 0, 0, 1, 0, 0];
    let tlm = [1, 0, 0, 1, 0, 0];
    let leading = 14;
    let pathRects = [];
    let pathSegments = [];
    let curPt = null;

    const recordMinMax = (minMax, mode) => {
      if (!minMax || minMax.length < 4) return;
      const [px1, py1] = applyMat(ctm, minMax[0], minMax[1]);
      const [px2, py2] = applyMat(ctm, minMax[2], minMax[3]);
      const x1 = Math.min(px1, px2);
      const x2 = Math.max(px1, px2);
      const y1 = Math.min(py1, py2);
      const y2 = Math.max(py1, py2);
      const w = x2 - x1;
      const h = y2 - y1;
      if (w >= 6 && h <= 3.5) {
        underlines.push({ x1, x2, y: (y1 + y2) / 2 });
      } else if (mode === 'fill' && w >= 8 && h >= 7 && h <= 34 && isAnswerHighlightColor(fillRgb)) {
        highlights.push({ x1, x2, y1, y2 });
      }
    };

    const flushPath = (mode) => {
      if (pathRects.length) {
        for (const rc of pathRects) {
          recordMinMax([rc.x, rc.y, rc.x + rc.w, rc.y + rc.h], mode);
        }
      }
      if (pathSegments.length && mode === 'stroke') {
        for (const seg of pathSegments) {
          const [px1, py1] = applyMat(ctm, seg.x1, seg.y1);
          const [px2, py2] = applyMat(ctm, seg.x2, seg.y2);
          if (Math.abs(py1 - py2) <= 1.8 && Math.abs(px2 - px1) >= 6) {
            underlines.push({
              x1: Math.min(px1, px2),
              x2: Math.max(px1, px2),
              y: (py1 + py2) / 2,
            });
          }
        }
      }
      pathRects = [];
      pathSegments = [];
      curPt = null;
    };

    const { fnArray, argsArray } = opList;
    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      const args = argsArray[i] || [];

      if (fn === OPS.save) {
        stack.push({ ctm: [...ctm], fillRgb: [...fillRgb] });
      } else if (fn === OPS.restore) {
        const prev = stack.pop();
        if (prev) { ctm = prev.ctm; fillRgb = prev.fillRgb; }
      } else if (fn === OPS.transform && args.length >= 6) {
        ctm = mulMat(args.slice(0, 6), ctm);
      } else if (fn === OPS.setFillRGBColor) {
        const rgb = normalizeRgbArg(args);
        if (rgb) fillRgb = rgb;
      } else if (fn === OPS.setFillGray && args.length >= 1) {
        const g = Number(args[0]) > 1 ? Number(args[0]) / 255 : Number(args[0]);
        if (!Number.isNaN(g)) fillRgb = [g, g, g];
      } else if (fn === OPS.setFillCMYKColor && args.length >= 4) {
        const [c, m, y, k] = args.map(Number);
        fillRgb = [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)];
      } else if (fn === OPS.beginText) {
        tm = [1, 0, 0, 1, 0, 0];
        tlm = [1, 0, 0, 1, 0, 0];
      } else if (fn === OPS.setTextMatrix && args.length >= 6) {
        tm = args.slice(0, 6);
        tlm = args.slice(0, 6);
      } else if (fn === OPS.setLeading && args.length >= 1) {
        leading = Number(args[0]) || leading;
      } else if (fn === OPS.setLeadingMoveText && args.length >= 2) {
        leading = -(Number(args[1]) || 0);
        tlm = mulMat([1, 0, 0, 1, Number(args[0]) || 0, Number(args[1]) || 0], tlm);
        tm = [...tlm];
      } else if (fn === OPS.moveText && args.length >= 2) {
        tlm = mulMat([1, 0, 0, 1, Number(args[0]) || 0, Number(args[1]) || 0], tlm);
        tm = [...tlm];
      } else if (fn === OPS.nextLine) {
        tlm = mulMat([1, 0, 0, 1, 0, -leading], tlm);
        tm = [...tlm];
      } else if (fn === OPS.showText || fn === OPS.showSpacedText) {
        if (isAnswerRedTextColor(fillRgb)) {
          const [px, py] = applyMat(ctm, tm[4], tm[5]);
          redTextPoints.push({ x: px, y: py });
        }
      } else if (fn === OPS.rectangle && args.length >= 4) {
        pathRects.push({ x: args[0], y: args[1], w: args[2], h: args[3] });
      } else if (fn === OPS.moveTo && args.length >= 2) {
        curPt = [args[0], args[1]];
      } else if (fn === OPS.lineTo && args.length >= 2) {
        if (curPt) pathSegments.push({ x1: curPt[0], y1: curPt[1], x2: args[0], y2: args[1] });
        curPt = [args[0], args[1]];
      } else if (fn === OPS.constructPath) {
        // pdfjs-dist v5/v6: constructPath(op, data, minMax)
        if (typeof args[0] === 'number' && args[2] && args[2].length >= 4) {
          const pathOp = args[0];
          const isStrokeOnly = pathOp === OPS.stroke || pathOp === OPS.closeStroke;
          const isFill =
            pathOp === OPS.fill || pathOp === OPS.eoFill ||
            pathOp === OPS.fillStroke || pathOp === OPS.eoFillStroke ||
            pathOp === OPS.closeFillStroke || pathOp === OPS.closeEOFillStroke;
          if (isStrokeOnly) recordMinMax(args[2], 'stroke');
          else if (isFill) recordMinMax(args[2], 'fill');
        } else if (Array.isArray(args[0]) && Array.isArray(args[1])) {
          // Legacy pdfjs: constructPath([ops], [coords])
          const ops = args[0];
          const coords = args[1];
          let ci = 0;
          let subPt = null;
          for (let oi = 0; oi < ops.length; oi++) {
            const subFn = ops[oi];
            if (subFn === OPS.moveTo) {
              subPt = [coords[ci], coords[ci + 1]];
              ci += 2;
            } else if (subFn === OPS.lineTo) {
              const nx = coords[ci];
              const ny = coords[ci + 1];
              if (subPt) pathSegments.push({ x1: subPt[0], y1: subPt[1], x2: nx, y2: ny });
              subPt = [nx, ny];
              ci += 2;
            } else if (subFn === OPS.rectangle) {
              pathRects.push({ x: coords[ci], y: coords[ci + 1], w: coords[ci + 2], h: coords[ci + 3] });
              ci += 4;
            } else if (subFn === OPS.curveTo) {
              subPt = [coords[ci + 4], coords[ci + 5]];
              ci += 6;
            } else if (subFn === OPS.curveTo2 || subFn === OPS.curveTo3) {
              subPt = [coords[ci + 2], coords[ci + 3]];
              ci += 4;
            }
          }
        }
      } else if (fn === OPS.stroke || fn === OPS.closeStroke) {
        flushPath('stroke');
      } else if (fn === OPS.fill || fn === OPS.eoFill) {
        flushPath('fill');
      } else if (fn === OPS.fillStroke || fn === OPS.eoFillStroke || fn === OPS.closeFillStroke || fn === OPS.closeEOFillStroke) {
        flushPath('fill');
      } else if (fn === OPS.endPath) {
        flushPath('none');
      } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject) {
        imageCount++;
      }
    }
  } catch {
    return empty;
  }

  return { underlines, highlights, redTextPoints, imageCount };
}

function estimateWidth(str, h) {
  return String(str || '').length * (h || 11) * 0.48;
}

function computeItemMarkMask(item, marks) {
  const L = String(item.str || '').length;
  if (!L) return '';
  const bits = new Array(L).fill('0');
  if (!marks) return bits.join('');

  const x1 = item.x;
  const x2 = item.x + item.w;
  const w = Math.max(1, item.w);
  const y = item.y;
  const h = item.h || 11;

  const paintSpan = (sx1, sx2) => {
    const overlap = Math.min(x2, sx2) - Math.max(x1, sx1);
    if (overlap < 3) return;
    const c1 = Math.max(0, Math.floor(((sx1 - x1) / w) * L));
    const c2 = Math.min(L, Math.ceil(((sx2 - x1) / w) * L));
    for (let k = c1; k < c2; k++) bits[k] = '1';
  };

  if (marks.underlines?.length) {
    for (const u of marks.underlines) {
      // Bỏ qua đường kẻ ngang bảng/chân trang quá dài (> 320pt) nếu text ngắn hơn nhiều
      if ((u.x2 - u.x1) > 320 && w < 120) continue;
      if (u.y >= y - h * 0.34 && u.y <= y + h * 0.18) {
        paintSpan(u.x1, u.x2);
      }
    }
  }
  if (marks.highlights?.length) {
    for (const hl of marks.highlights) {
      if (y >= hl.y1 - h * 0.3 && y <= hl.y2 + h * 0.4) {
        paintSpan(hl.x1, hl.x2);
      }
    }
  }
  if (marks.redTextPoints?.length) {
    for (const pt of marks.redTextPoints) {
      if (Math.abs(pt.y - y) <= h * 0.45 && pt.x >= x1 - 4 && pt.x <= x2 + 4) {
        bits.fill('1');
        break;
      }
    }
  }
  return bits.join('');
}

const SUP_BASE_END_RE = /[A-Za-zÀ-ỹ0-9)\]}°]$/;
const SUP_TOKEN_RE = /^[0-9+\-=()n]+$/;
const SUB_TOKEN_RE = /^[0-9+\-=()]+$/;
const NO_SPACE_BEFORE_RE = /^[.,;:!?)\]}°%]/;
const NO_SPACE_AFTER_RE = /[([{$/\-]$/;

function clusterRowsWithScripts(items) {
  if (!items.length) return [];
  const heights = items.map((it) => it.h).filter((h) => h >= 6).sort((a, b) => a - b);
  const medianH = heights.length ? heights[Math.floor(heights.length / 2)] : 11;

  const primary = [];
  const small = [];
  for (const it of items) {
    if (it.h < medianH * 0.78) small.push(it);
    else primary.push(it);
  }
  const anchors = primary.length ? primary : items;
  if (!primary.length) small.length = 0;

  anchors.sort((a, b) => b.y - a.y || a.x - b.x);
  const yTol = Math.max(3.8, medianH * 0.42);
  const rows = [];
  for (const it of anchors) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(it.y - last.y) <= yTol) {
      last.items.push(it);
      last.y = (last.y * (last.items.length - 1) + it.y) / last.items.length;
    } else {
      rows.push({ y: it.y, items: [it] });
    }
  }

  for (const s of small) {
    let bestRow = null;
    let bestDist = Infinity;
    for (const row of rows) {
      const dist = Math.abs(s.y - row.y);
      if (dist <= medianH * 0.9 && dist < bestDist) {
        const hasAdjacentX = row.items.some((p) => {
          const endX = p.x + p.w;
          return (s.x >= p.x - 2 && s.x <= endX + medianH * 0.9) ||
            (s.x + s.w >= p.x - medianH * 0.6 && s.x + s.w <= endX + 2);
        });
        if (hasAdjacentX) {
          bestDist = dist;
          bestRow = row;
        }
      }
    }
    if (bestRow) {
      const dy = s.y - bestRow.y;
      const script = dy > Math.max(1.2, medianH * 0.12)
        ? 'sup'
        : dy < -Math.max(1.2, medianH * 0.12)
          ? 'sub'
          : 'normal';
      bestRow.items.push({ ...s, script });
    } else {
      rows.push({ y: s.y, items: [s] });
    }
  }

  rows.sort((a, b) => b.y - a.y);
  return rows.map((row) => assembleRowLine(row.items, medianH)).filter((ln) => ln.t.trim());
}

function assembleRowLine(rowItems, medianH) {
  rowItems.sort((a, b) => a.x - b.x);
  let t = '';
  let u = '';
  let prevEndX = null;
  let hasColumnGap = false;

  for (let i = 0; i < rowItems.length; i++) {
    const it = rowItems[i];
    let chunk = it.str;
    if (!chunk) continue;
    let chunkMask = it.markMask && it.markMask.length === chunk.length
      ? it.markMask
      : '0'.repeat(chunk.length);

    if (prevEndX !== null) {
      const dx = it.x - prevEndX;
      if (it.script === 'sup' && dx < medianH * 0.55 && SUP_BASE_END_RE.test(t) && SUP_TOKEN_RE.test(chunk.trim())) {
        const anyMark = chunkMask.includes('1') ? '1' : '0';
        chunk = toUnicodeSup(chunk.trim());
        chunkMask = anyMark.repeat(chunk.length);
      } else if (it.script === 'sub' && dx < medianH * 0.55 && SUP_BASE_END_RE.test(t) && SUB_TOKEN_RE.test(chunk.trim())) {
        const anyMark = chunkMask.includes('1') ? '1' : '0';
        chunk = toUnicodeSub(chunk.trim());
        chunkMask = anyMark.repeat(chunk.length);
      } else {
        const leadSpaces = chunk.length - chunk.trimStart().length;
        const trimmedStart = chunk.slice(leadSpaces);
        const prevEndSpace = /\s$/.test(t);
        const curStartSpace = /^\s/.test(chunk);
        const colGapThreshold = Math.max(medianH * 1.35, 14);
        if (dx >= colGapThreshold) {
          hasColumnGap = true;
          t = t.replace(/\s+$/, '');
          u = u.slice(0, t.length);
          chunk = '  ' + trimmedStart;
          chunkMask = '00' + chunkMask.slice(leadSpaces);
        } else if (!prevEndSpace && !curStartSpace) {
          const skipSpace =
            dx < medianH * 0.16 ||
            (NO_SPACE_BEFORE_RE.test(trimmedStart) && dx < medianH * 0.45) ||
            (NO_SPACE_AFTER_RE.test(t) && dx < medianH * 0.42);
          if (!skipSpace) {
            t += ' ';
            u += '0';
          }
        }
      }
    }

    t += chunk;
    u += chunkMask.length === chunk.length ? chunkMask : (chunkMask.includes('1') ? '1' : '0').repeat(chunk.length);
    prevEndX = Math.max(prevEndX ?? -Infinity, it.x + it.w);
  }

  // Giữ khoảng trắng đôi phân tách cột nhưng cắt 2 đầu
  const start = t.length - t.trimStart().length;
  const end = t.trimEnd().length;
  const cleanT = t.slice(start, end);
  const cleanU = u.slice(start, end);
  const zeros = '0'.repeat(cleanT.length);
  const looksLikeMultiCell =
    hasColumnGap &&
    (/(?:^|\s)\(?[A-Da-d]\)?[.)]\s*\S/.test(cleanT) || /\d+\s+[A-Da-d]\b/.test(cleanT));

  return {
    t: cleanT,
    m: cleanU,
    u: cleanU,
    b: zeros,
    ...(looksLikeMultiCell ? { fromTable: true } : {}),
  };
}

function detectTwoColumnSplitX(items, pageWidth) {
  if (items.length < 4 || pageWidth < 300) return null;
  const mid = pageWidth * 0.5;
  const bandMin = pageWidth * 0.42;
  const bandMax = pageWidth * 0.58;

  const rowSample = clusterRowsWithScripts(items);
  if (rowSample.length < 2) return null;

  let crossingItems = 0;
  let leftQ = 0;
  let rightQ = 0;
  const qPrefix = /^(?:cau|bai|question|\d{1,3}[.)])\s*/i;

  for (const it of items) {
    if (!it.str.trim()) continue;
    const x1 = it.x;
    const x2 = it.x + it.w;
    if (x1 < bandMin && x2 > bandMax) crossingItems++;
  }
  if (crossingItems > Math.max(2, rowSample.length * 0.12)) return null;

  const leftItems = items.filter((it) => it.x + it.w <= mid + 8);
  const rightItems = items.filter((it) => it.x >= mid - 8);
  const leftRows = clusterRowsWithScripts(leftItems);
  const rightRows = clusterRowsWithScripts(rightItems);

  for (const r of leftRows) if (qPrefix.test(fold(r.t))) leftQ++;
  for (const r of rightRows) if (qPrefix.test(fold(r.t))) rightQ++;

  if (leftQ >= 2 && rightQ >= 2) return mid;
  return null;
}

export function reconstructPdfPageLines(items, marks = {}, opts = {}) {
  const { pageWidth = 595, styles = {}, detectColumns = true } = opts;
  if (!Array.isArray(items) || !items.length) return [];

  const normItems = [];
  for (const it of items) {
    const rawStr = typeof it?.str === 'string' ? it.str : '';
    if (!rawStr) continue;
    const tr = Array.isArray(it.transform) ? it.transform : [11, 0, 0, 11, it.x ?? 0, it.y ?? 0];
    // Lọc chữ xoay chéo kiểu watermark (góc nghiêng > ~18°)
    if (Math.abs(tr[0]) > 0.1 && Math.abs(tr[1]) > Math.abs(tr[0]) * 0.35) continue;

    const h = Math.hypot(tr[2], tr[3]) || Math.hypot(tr[0], tr[1]) || Number(it.height) || 11;
    const x = Number(tr[4]) || 0;
    const y = Number(tr[5]) || 0;
    const w = Number(it.width) > 0 ? Number(it.width) : estimateWidth(rawStr, h);
    const fontFamily = it.fontName && styles[it.fontName] ? styles[it.fontName].fontFamily : '';
    const str = maybeFixVietnameseEncoding(rawStr, fontFamily).normalize('NFC');

    const obj = { str, x, y, w, h, script: 'normal', markMask: '' };
    obj.markMask = computeItemMarkMask(obj, marks);
    normItems.push(obj);
  }
  if (!normItems.length) return [];

  const splitX = detectColumns ? detectTwoColumnSplitX(normItems, pageWidth) : null;
  if (splitX !== null) {
    const left = normItems.filter((it) => it.x + it.w * 0.5 < splitX);
    const right = normItems.filter((it) => it.x + it.w * 0.5 >= splitX);
    return [...clusterRowsWithScripts(left), ...clusterRowsWithScripts(right)];
  }
  return clusterRowsWithScripts(normItems);
}

const STANDALONE_PAGE_NUM_RE = /^(?:trang|page|tr\.?)\s*\d+(?:\s*\/\s*\d+)?$|^-?\s*\d{1,3}\s*-?$/i;
const PROTECTED_CONTENT_RE = /^(?:cau\s*\d|phan\s+[ivx1-3]|dap\s*an|[a-f][.)])/i;

function normalizeHeaderFooterSig(text) {
  return fold(String(text || ''))
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripRepeatedPageHeadersFooters(pagesLineArrays) {
  if (!Array.isArray(pagesLineArrays) || pagesLineArrays.length === 0) return [];
  if (pagesLineArrays.length === 1) {
    return pagesLineArrays[0].filter((ln) => !STANDALONE_PAGE_NUM_RE.test(fold(ln.t)));
  }

  const sigCounts = new Map();
  for (const pageLines of pagesLineArrays) {
    if (!pageLines?.length) continue;
    const edgeIndices = new Set([0, 1, pageLines.length - 2, pageLines.length - 1]);
    const seenOnPage = new Set();
    for (const idx of edgeIndices) {
      if (idx < 0 || idx >= pageLines.length) continue;
      const t = pageLines[idx]?.t || '';
      const f = fold(t);
      if (!t || t.length > 140 || PROTECTED_CONTENT_RE.test(f)) continue;
      const sig = normalizeHeaderFooterSig(t);
      if (sig && !seenOnPage.has(sig)) {
        seenOnPage.add(sig);
        sigCounts.set(sig, (sigCounts.get(sig) || 0) + 1);
      }
    }
  }

  const minPages = Math.max(2, Math.ceil(pagesLineArrays.length * 0.5));
  const repeated = new Set(
    [...sigCounts.entries()].filter(([, cnt]) => cnt >= minPages).map(([sig]) => sig)
  );

  const out = [];
  for (const pageLines of pagesLineArrays) {
    if (!pageLines?.length) continue;
    pageLines.forEach((ln, idx) => {
      const isEdge = idx <= 1 || idx >= pageLines.length - 2;
      const f = fold(ln.t);
      if (STANDALONE_PAGE_NUM_RE.test(f)) return;
      if (isEdge && repeated.has(normalizeHeaderFooterSig(ln.t))) return;
      out.push(ln);
    });
  }
  return out;
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  } catch {
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url').catch(() => null);
    if (worker?.default) pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  }
  return pdfjs;
}

async function renderPdfPageDataUrl(page, scale = 2) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Đọc file PDF đề thi bằng tái cấu trúc hình học + OperatorList (gạch chân/chữ đỏ)
 * Tự động chuyển OCR (Tesseract) cho trang scan/lỗi font ToUnicode.
 */
export async function readExamPdfFile(
  file,
  {
    maxPages = 60,
    ocrFallback = true,
    ocrPageCap = 20,
    renderScale = 2,
    onProgress,
    signal,
  } = {}
) {
  const pdfjs = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const total = Math.min(maxPages, pdf.numPages);

  const pageLinesList = new Array(total);
  const needsOcr = [];
  const scannedPages = [];
  const garbledPages = [];
  let previewImages = [];

  for (let p = 1; p <= total; p++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    onProgress?.({ stage: 'reading', percent: Math.round((p / total) * 55), page: p, total });

    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    let opList = null;
    try {
      opList = await page.getOperatorList();
    } catch { /* ignore */ }

    const marks = extractPdfPageVisualMarks(opList, pdfjs.OPS);
    const lines = reconstructPdfPageLines(content.items || [], marks, {
      pageWidth: viewport.width || 595,
      styles: content.styles || {},
    });

    const joined = lines.map((l) => l.t).join('\n');
    const health = detectMojibakeOrScanned(joined, { itemCount: (content.items || []).length });
    if (health.isScanned || health.isGarbled) {
      if (health.isScanned) scannedPages.push(p);
      if (health.isGarbled) garbledPages.push(p);
      needsOcr.push({ p, page, fallbackLines: lines });
    }
    pageLinesList[p - 1] = lines;
  }

  let usedOcr = false;
  const canCanvasOcr = ocrFallback && typeof document !== 'undefined';
  if (needsOcr.length > 0 && canCanvasOcr) {
    const queue = needsOcr.slice(0, ocrPageCap);
    const dataUrls = [];
    for (let i = 0; i < queue.length; i++) {
      onProgress?.({ stage: 'rendering', percent: 55 + Math.round(((i + 1) / queue.length) * 15), page: queue[i].p, total });
      try {
        dataUrls.push(await renderPdfPageDataUrl(queue[i].page, renderScale));
      } catch {
        dataUrls.push('');
      }
    }
    previewImages = dataUrls.filter(Boolean).slice(0, 4);

    if (dataUrls.some(Boolean)) {
      const ocrRes = await ocrImages(dataUrls, {
        onProgress: (pct) => onProgress?.({ stage: 'ocr', percent: 70 + Math.round(pct * 0.25) }),
      });
      if (ocrRes.ok && Array.isArray(ocrRes.perImage)) {
        usedOcr = true;
        queue.forEach((item, idx) => {
          const ocrText = String(ocrRes.perImage[idx] || '').trim();
          if (ocrText.length >= 20) {
            pageLinesList[item.p - 1] = ocrText
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => mkLine(s));
          }
        });
      }
    }
  }

  const lines = stripRepeatedPageHeadersFooters(pageLinesList);
  const text = lines.map((l) => l.t).join('\n');

  onProgress?.({ stage: 'done', percent: 100 });
  return {
    lines,
    text,
    pages: total,
    totalPdfPages: pdf.numPages,
    truncated: pdf.numPages > total,
    scannedPages,
    garbledPages,
    usedOcr,
    previewImages,
  };
}

/** Render vài trang PDF sang ảnh JPEG để gửi AI Vision khi file có công thức/hình phức tạp */
export async function renderPdfPagesForVision(file, maxPages = 6, scale = 1.8) {
  if (typeof document === 'undefined') return [];
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const total = Math.min(maxPages, pdf.numPages);
  const out = [];
  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p);
    out.push(await renderPdfPageDataUrl(page, scale));
  }
  return out;
}
