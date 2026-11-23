/* ============================================================
   omrSheetGenerator.js — Bộ Tạo & In Phiếu Trả Lời Trắc Nghiệm A4
   Chuẩn Bộ GD&ĐT (GDPT 2018 / Kỳ thi THPT 2025+) · Bản quyền ELEC Science AI
   ------------------------------------------------------------
   Đặc điểm kỹ thuật:
   - Vector SVG chuẩn tỷ lệ A4 (2480 x 3508 @ 300 DPI) đồng bộ 1:1 với
     tọa độ TEMPLATE của omr.js (4 góc + 55 vạch định vị quang học).
   - Luôn khớp đúng 1 trang A4 khi in (không tràn sang trang 2, không mất màu).
   - Hỗ trợ chế độ mực Đỏ-Hồng OMR (khuyên dùng) & Đen trắng Photocopy.
   - Hỗ trợ in hàng loạt nhiều mã đề trong 1 lệnh in duy nhất qua iframe
     (không bị trình duyệt chặn popup).
   ============================================================ */

import { TEMPLATE } from './omr.js';
import { classifyExamQuestionPart, DEFAULT_COUNTS, MAX_COUNTS } from './paperGrade.js';

export const ELEC_OMR_VERSION = 'ELC-OMR-2025.2';

export const OMR_THEMES = {
  rose: {
    id: 'rose',
    label: 'Chuẩn OMR Đỏ-Hồng',
    frameStroke: '#9f1239',
    innerStroke: '#e11d48',
    bubbleStroke: '#e11d48',
    titleInk: '#881337',
    textInk: '#1e293b',
    mutedInk: '#64748b',
    softFill: '#fff1f2',
    badgeBg: '#ffe4e6',
    brandPrimary: '#0284c7',
    brandDark: '#0f172a',
    markInk: '#000000',
  },
  bw: {
    id: 'bw',
    label: 'Đen trắng (Photocopy)',
    frameStroke: '#0f172a',
    innerStroke: '#475569',
    bubbleStroke: '#334155',
    titleInk: '#0f172a',
    textInk: '#0f172a',
    mutedInk: '#475569',
    softFill: '#f1f5f9',
    badgeBg: '#e2e8f0',
    brandPrimary: '#0f172a',
    brandDark: '#0f172a',
    markInk: '#000000',
  },
};

const CIRCLED_DIGITS = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
const FONT_SERIF = "'Times New Roman', 'Noto Serif', Georgia, serif";
const FONT_SANS = "'Be Vietnam Pro', 'Inter', 'Segoe UI', Arial, sans-serif";

function escapeXml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clampCount(v, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return max;
  return Math.max(0, Math.min(max, Math.round(n)));
}

/** Tạo mã kiểm tra bản quyền ngắn gọn mang dấu ấn ELEC Science AI. */
export function buildSheetSerial({ code = '', examTitle = '', subject = '' } = {}) {
  const seed = `${code}|${examTitle}|${subject}|${ELEC_OMR_VERSION}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const tag = (h >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  const codePart = String(code || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 4);
  return codePart ? `ELC-${codePart}-${tag}` : `ELC-25-${tag}`;
}

/** Phân loại mảng câu hỏi thành 3 phần theo chuẩn GDPT 2025 (giữ tương thích caller cũ). */
export function categorizeQuestions(questions = []) {
  const singleChoice = [];
  const trueFalse = [];
  const shortAnswer = [];

  (Array.isArray(questions) ? questions : []).forEach((q) => {
    const part = classifyExamQuestionPart(q);
    if (part === 2) trueFalse.push(q);
    else if (part === 3) shortAnswer.push(q);
    else if (part === 1) singleChoice.push(q);
  });

  return { singleChoice, trueFalse, shortAnswer };
}

/** Chuẩn hóa số câu hiệu lực của 3 phần từ `counts` hoặc `questions` (mặc định mẫu A4 đầy đủ 40-8-6). */
export function resolveOmrActiveCounts({ questions = [], counts = null } = {}) {
  if (counts && (counts.p1 != null || counts.p2 != null || counts.p3 != null)) {
    return {
      p1: clampCount(counts.p1 ?? DEFAULT_COUNTS.p1, MAX_COUNTS.p1),
      p2: clampCount(counts.p2 ?? DEFAULT_COUNTS.p2, MAX_COUNTS.p2),
      p3: clampCount(counts.p3 ?? DEFAULT_COUNTS.p3, MAX_COUNTS.p3),
    };
  }
  if (Array.isArray(questions) && questions.length > 0) {
    const { singleChoice, trueFalse, shortAnswer } = categorizeQuestions(questions);
    return {
      p1: clampCount(singleChoice.length, MAX_COUNTS.p1),
      p2: clampCount(trueFalse.length, MAX_COUNTS.p2),
      p3: clampCount(shortAnswer.length, MAX_COUNTS.p3),
    };
  }
  return { ...MAX_COUNTS };
}

/** Biểu tượng bình thí nghiệm + nguyên tử đặc trưng của ELEC Science AI (vector SVG thuần). */
function renderElecFlaskPaths(x, y, size, colorPrimary, colorAccent) {
  const scale = size / 36;
  return `
    <g transform="translate(${x}, ${y}) scale(${scale.toFixed(4)})" aria-hidden="true">
      <circle cx="18" cy="18" r="17" fill="#ffffff" stroke="${colorPrimary}" stroke-width="1.5" />
      <ellipse cx="18" cy="14.5" rx="13" ry="4.6" transform="rotate(-28 18 14.5)" fill="none" stroke="${colorAccent}" stroke-width="1.25" />
      <ellipse cx="18" cy="14.5" rx="13" ry="4.6" transform="rotate(28 18 14.5)" fill="none" stroke="${colorAccent}" stroke-width="1.25" />
      <path d="M14.2 5.2H21.8M15.6 5.2V11.8L10.3 22.1C9.7 23.4 10.4 24.7 12.1 24.8H23.9C25.6 24.7 26.3 23.4 25.7 22.1L20.4 11.8V5.2"
        fill="none" stroke="${colorPrimary}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M12.5 21.8H23.5L22.2 19.2H13.8Z" fill="${colorPrimary}" fill-opacity="0.22" />
      <circle cx="18" cy="14.5" r="1.7" fill="${colorPrimary}" />
    </g>
  `;
}

function renderDottedLine(x1, y, x2, color) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="1.4" stroke-dasharray="3 6" />`;
}

function renderBubble(cx, cy, r, theme, { filled = false } = {}) {
  if (filled) {
    return `<circle cx="${cx}" cy="${cy}" r="${(r - 0.5).toFixed(1)}" fill="${theme.markInk}" stroke="${theme.markInk}" stroke-width="1.5" />`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="${theme.bubbleStroke}" stroke-width="2.3" />`;
}

/** Dựng toàn bộ markup SVG chuẩn 2480 x 3508 cho 1 phiếu A4. */
export function buildOmrSvgMarkup(rawOptions = {}) {
  const {
    questions = [],
    counts = null,
    title = 'PHIẾU TRẢ LỜI TRẮC NGHIỆM',
    code = '',
    examTitle = '',
    subject = '',
    duration = 45,
    schoolName = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
    year = 'KỲ THI TỐT NGHIỆP THPT',
    council = '',
    examSite = '',
    examDate = '',
    colorMode = 'rose',
    prefillCodeBubbles = false,
  } = rawOptions;

  const theme = OMR_THEMES[colorMode] || OMR_THEMES.rose;
  const active = resolveOmrActiveCounts({ questions, counts });
  const R = TEMPLATE.bubbleR; // 17px trên nền 2480x3508
  const codeClean = String(code || '').trim();
  const codeDigits = codeClean.replace(/\D/g, '').slice(0, 3);
  const serial = buildSheetSerial({ code: codeClean, examTitle, subject });
  const durationNum = Number(duration) || 0;

  /* 1. 4 ô vuông đen lớn ở 4 góc chuẩn TNMaker/Bộ GD&ĐT (56x56) + 51 vạch định vị mép (44x18) */
  const cornerPts = Object.values(TEMPLATE.corners);
  const isCornerPt = (mx, my) => cornerPts.some(([cx, cy]) => cx === mx && cy === my);
  const timingMarks = TEMPLATE.marks
    .map(([mx, my]) => {
      if (isCornerPt(mx, my)) {
        return `<rect class="omr-fiducial omr-corner-square" x="${(mx - 28).toFixed(1)}" y="${(my - 28).toFixed(1)}" width="56" height="56" fill="${theme.markInk}" shape-rendering="crispEdges" />`;
      }
      return `<rect class="omr-fiducial omr-timing-tick" x="${(mx - 22).toFixed(1)}" y="${(my - 9).toFixed(1)}" width="44" height="18" fill="${theme.markInk}" shape-rendering="crispEdges" />`;
    })
    .join('');

  /* 2. Băng rôn đầu trang (nằm phía trên TL/TR tại y = 16..84, hoàn toàn ngoài vùng đánh dấu góc) */
  const masthead = `
    <g class="omr-masthead">
      <rect x="135" y="18" width="465" height="64" rx="14" fill="${theme.softFill}" stroke="${theme.frameStroke}" stroke-width="1.6" />
      ${renderElecFlaskPaths(150, 25, 50, theme.brandPrimary, theme.frameStroke)}
      <text x="212" y="45" font-family="${FONT_SANS}" font-size="22" font-weight="800" fill="${theme.brandDark}" letter-spacing="0.8">ELEC SCIENCE AI</text>
      <text x="212" y="70" font-family="${FONT_SANS}" font-size="14" font-weight="700" fill="${theme.titleInk}" letter-spacing="0.4">PHIẾU OMR CHUẨN BỘ GD&amp;ĐT</text>

      <text x="1245" y="45" text-anchor="middle" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">${escapeXml(String(schoolName || '').toUpperCase())}</text>
      <text x="1245" y="73" text-anchor="middle" font-family="${FONT_SERIF}" font-size="19" font-weight="700" fill="${theme.mutedInk}">${escapeXml(String(year || '').toUpperCase())}</text>

      <rect x="1875" y="18" width="462" height="64" rx="14" fill="${codeClean ? theme.softFill : '#ffffff'}" stroke="${theme.frameStroke}" stroke-width="1.6" />
      <text x="1900" y="46" font-family="${FONT_SANS}" font-size="18" font-weight="800" fill="${theme.titleInk}">MÃ ĐỀ: ${escapeXml(codeClean || '......')}</text>
      <text x="1900" y="71" font-family="${FONT_SANS}" font-size="15" font-weight="600" fill="${theme.mutedInk}">Thời gian: ${durationNum > 0 ? `${durationNum} phút` : '...... phút'}</text>
      <rect x="2165" y="29" width="154" height="42" rx="9" fill="${theme.badgeBg}" />
      <text x="2242" y="55" text-anchor="middle" font-family="${FONT_SANS}" font-size="15" font-weight="800" fill="${theme.titleInk}">${active.p1}·${active.p2}·${active.p3}</text>
    </g>
  `;

  /* 3. Tiêu đề chính & thông tin thí sinh bên trái + giữa */
  const cleanExamTitle = String(examTitle || '').trim();
  const cleanSubject = String(subject || '').trim();
  const cleanCouncil = String(council || '').trim();
  const cleanSite = String(examSite || '').trim();
  const cleanDate = String(examDate || '').trim();

  const headerInfo = `
    <g class="omr-header-title">
      <text x="935" y="152" text-anchor="middle" font-family="${FONT_SERIF}" font-size="45" font-weight="700" fill="${theme.titleInk}" letter-spacing="0.8">${escapeXml(String(title || '').toUpperCase())}</text>
      ${cleanExamTitle
        ? `<text x="935" y="200" text-anchor="middle" font-family="${FONT_SERIF}" font-size="24" font-weight="700" fill="${theme.textInk}">Kỳ thi: ${escapeXml(cleanExamTitle)}</text>`
        : `<text x="530" y="200" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">Kỳ thi:</text>${renderDottedLine(622, 202, 1690, theme.mutedInk)}`
      }

      <text x="148" y="244" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">Bài thi / Môn: ${cleanSubject ? escapeXml(cleanSubject) : ''}</text>
      ${cleanSubject ? '' : renderDottedLine(312, 246, 1185, theme.mutedInk)}
      <text x="1215" y="244" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">Ngày thi: ${cleanDate ? escapeXml(cleanDate) : '....... / ....... / 20......'}</text>
    </g>

    <!-- Khung cán bộ coi thi 1 & 2 (x = 135..606, y = 268..1040) -->
    <g class="omr-proctor-box">
      <rect x="135" y="268" width="471" height="772" rx="6" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="2.2" />
      <line x1="135" y1="654" x2="606" y2="654" stroke="${theme.frameStroke}" stroke-width="1.8" />
      <g opacity="0.06">
        ${renderElecFlaskPaths(295, 395, 150, theme.brandPrimary, theme.frameStroke)}
        ${renderElecFlaskPaths(295, 785, 150, theme.brandPrimary, theme.frameStroke)}
      </g>
      <text x="370" y="314" text-anchor="middle" font-family="${FONT_SERIF}" font-size="22" font-weight="700" fill="${theme.textInk}">Họ tên, chữ ký của</text>
      <text x="370" y="346" text-anchor="middle" font-family="${FONT_SERIF}" font-size="22" font-weight="700" fill="${theme.textInk}">cán bộ coi thi 1</text>
      ${renderDottedLine(185, 598, 556, theme.mutedInk)}

      <text x="370" y="700" text-anchor="middle" font-family="${FONT_SERIF}" font-size="22" font-weight="700" fill="${theme.textInk}">Họ tên, chữ ký của</text>
      <text x="370" y="732" text-anchor="middle" font-family="${FONT_SERIF}" font-size="22" font-weight="700" fill="${theme.textInk}">cán bộ coi thi 2</text>
      ${renderDottedLine(185, 984, 556, theme.mutedInk)}
    </g>

    <!-- Khung thông tin thí sinh mục 1..6 (x = 626..1734, y = 268..1040) -->
    <g class="omr-candidate-box">
      <rect x="626" y="268" width="1108" height="772" rx="6" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="2.2" />

      <text x="652" y="340" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">1. Hội đồng thi: ${cleanCouncil ? escapeXml(cleanCouncil) : ''}</text>
      ${cleanCouncil ? '' : renderDottedLine(835, 342, 1706, theme.mutedInk)}

      <text x="652" y="458" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">2. Điểm thi: ${cleanSite ? escapeXml(cleanSite) : ''}</text>
      ${cleanSite ? '' : renderDottedLine(790, 460, 1706, theme.mutedInk)}

      <text x="652" y="576" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">3. Phòng thi số:</text>
      ${renderDottedLine(832, 578, 1706, theme.mutedInk)}

      <text x="652" y="694" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">4. Họ và tên thí sinh:</text>
      ${renderDottedLine(890, 696, 1706, theme.mutedInk)}

      <text x="652" y="812" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">5. Ngày sinh: ........ / ........ / ..............   (Nam / Nữ)</text>

      <text x="652" y="930" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">6. Chữ ký của thí sinh:</text>
      ${renderDottedLine(904, 932, 1706, theme.mutedInk)}

      <rect x="646" y="968" width="1068" height="54" rx="8" fill="${theme.softFill}" />
      <text x="1180" y="1002" text-anchor="middle" font-family="${FONT_SANS}" font-size="16" font-weight="600" fill="${theme.titleInk}">
        Hướng dẫn: Dùng bút chì 2B tô đen kín ô tròn · Không tô nhiều hơn 1 ô trên 1 câu · Không gập phiếu
      </text>
    </g>

    <text x="935" y="1080" text-anchor="middle" font-family="${FONT_SERIF}" font-size="21" font-style="italic" font-weight="700" fill="${theme.textInk}">
      Chú ý: Thí sinh cần đọc kỹ hướng dẫn, không làm bẩn hoặc che khuất các vạch đen định vị ở mép phiếu.
    </text>
  `;

  /* 4. Mục 7 (Số báo danh 6 cột) & Mục 8 (Mã đề thi 3 cột) dùng đúng TEMPLATE.idX, codeX, digitY */
  const sbdLeft = 1798;
  const sbdRight = 2088;
  const codeLeft = 2174;
  const codeRight = 2318;
  const gridTopY = 266;
  const boxTopY = 266;
  const boxBottomY = 338;
  const bubbleBoxTopY = 352;
  const bubbleBoxBottomY = 1040;

  let sbdCodeSvg = `
    <g class="omr-id-section">
      <text x="${(sbdLeft + sbdRight) / 2}" y="244" text-anchor="middle" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">7. Số báo danh</text>
      <text x="${(codeLeft + codeRight) / 2}" y="244" text-anchor="middle" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}">8. Mã đề thi</text>

      <!-- Ô viết tay SBD -->
      <rect x="${sbdLeft}" y="${boxTopY}" width="${sbdRight - sbdLeft}" height="${boxBottomY - boxTopY}" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="2.2" />
      <!-- Khung tô SBD -->
      <rect x="${sbdLeft}" y="${bubbleBoxTopY}" width="${sbdRight - sbdLeft}" height="${bubbleBoxBottomY - bubbleBoxTopY}" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="2.2" />

      <!-- Ô viết tay Mã đề -->
      <rect x="${codeLeft}" y="${boxTopY}" width="${codeRight - codeLeft}" height="${boxBottomY - boxTopY}" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="2.2" />
      <!-- Khung tô Mã đề -->
      <rect x="${codeLeft}" y="${bubbleBoxTopY}" width="${codeRight - codeLeft}" height="${bubbleBoxBottomY - bubbleBoxTopY}" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="2.2" />
  `;

  for (let c = 1; c < TEMPLATE.idX.length; c++) {
    const xLine = ((TEMPLATE.idX[c - 1] + TEMPLATE.idX[c]) / 2).toFixed(1);
    sbdCodeSvg += `<line x1="${xLine}" y1="${gridTopY}" x2="${xLine}" y2="${boxBottomY}" stroke="${theme.frameStroke}" stroke-width="1.6" />`;
    sbdCodeSvg += `<line x1="${xLine}" y1="${bubbleBoxTopY}" x2="${xLine}" y2="${bubbleBoxBottomY}" stroke="${theme.innerStroke}" stroke-width="1" stroke-opacity="0.35" />`;
  }
  for (let c = 1; c < TEMPLATE.codeX.length; c++) {
    const xLine = ((TEMPLATE.codeX[c - 1] + TEMPLATE.codeX[c]) / 2).toFixed(1);
    sbdCodeSvg += `<line x1="${xLine}" y1="${gridTopY}" x2="${xLine}" y2="${boxBottomY}" stroke="${theme.frameStroke}" stroke-width="1.6" />`;
    sbdCodeSvg += `<line x1="${xLine}" y1="${bubbleBoxTopY}" x2="${xLine}" y2="${bubbleBoxBottomY}" stroke="${theme.innerStroke}" stroke-width="1" stroke-opacity="0.35" />`;
  }

  TEMPLATE.codeX.forEach((cx, c) => {
    if (codeDigits[c]) {
      sbdCodeSvg += `<text x="${cx}" y="${boxTopY + 52}" text-anchor="middle" font-family="${FONT_SANS}" font-size="38" font-weight="800" fill="${theme.titleInk}">${escapeXml(codeDigits[c])}</text>`;
    }
  });

  TEMPLATE.digitY.forEach((dy, d) => {
    sbdCodeSvg += `<text x="1772" y="${(dy + 8).toFixed(1)}" text-anchor="middle" font-family="${FONT_SANS}" font-size="24" font-weight="700" fill="${theme.textInk}">${CIRCLED_DIGITS[d]}</text>`;
    TEMPLATE.idX.forEach((cx) => {
      sbdCodeSvg += renderBubble(cx, dy, R, theme);
    });
    TEMPLATE.codeX.forEach((cx, c) => {
      const shouldFill = Boolean(prefillCodeBubbles && codeDigits.length === 3 && Number(codeDigits[c]) === d);
      sbdCodeSvg += renderBubble(cx, dy, R, theme, { filled: shouldFill });
    });
  });

  sbdCodeSvg += '</g>';

  /* 5. PHẦN I (4 khối x 10 câu x A B C D) theo đúng TEMPLATE.p1X & TEMPLATE.p1Y */
  const p1Frames = [148, 708, 1268, 1828];
  const p1BlockW = 470;
  const p1ScopeText = active.p1 === 0
    ? 'Phần này không có trong đề'
    : active.p1 < MAX_COUNTS.p1
      ? `Thí sinh tô từ Câu 1 đến Câu ${active.p1}`
      : 'Thí sinh trả lời từ Câu 1 đến Câu 40';

  let p1Svg = `
    <g class="omr-part1">
      <text x="148" y="1148" font-family="${FONT_SERIF}" font-size="26" font-weight="700" fill="${theme.titleInk}">PHẦN I.</text>
      <text x="272" y="1148" font-family="${FONT_SERIF}" font-size="22" font-weight="700" fill="${theme.textInk}">Câu trắc nghiệm nhiều phương án lựa chọn</text>
      <rect x="1800" y="1118" width="498" height="38" rx="9" fill="${theme.softFill}" stroke="${theme.innerStroke}" stroke-width="1.2" />
      <text x="2049" y="1144" text-anchor="middle" font-family="${FONT_SANS}" font-size="16" font-weight="700" fill="${theme.titleInk}">${escapeXml(p1ScopeText)}</text>
  `;

  for (let b = 0; b < 4; b++) {
    const fx = p1Frames[b];
    const numX = fx + 46;
    p1Svg += `
      <rect x="${fx}" y="1170" width="${p1BlockW}" height="676" rx="5" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="2" />
      <rect x="${fx}" y="1170" width="${p1BlockW}" height="52" rx="4" fill="${theme.softFill}" />
      <line x1="${fx}" y1="1222" x2="${fx + p1BlockW}" y2="1222" stroke="${theme.frameStroke}" stroke-width="1.6" />
      <line x1="${fx + 74}" y1="1170" x2="${fx + 74}" y2="1846" stroke="${theme.innerStroke}" stroke-width="1" stroke-opacity="0.3" />
      <line x1="${fx + 10}" y1="1540.8" x2="${fx + p1BlockW - 10}" y2="1540.8" stroke="${theme.innerStroke}" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.45" />
    `;
    ['A', 'B', 'C', 'D'].forEach((opt, ci) => {
      p1Svg += `<text x="${TEMPLATE.p1X[b][ci]}" y="1205" text-anchor="middle" font-family="${FONT_SANS}" font-size="24" font-weight="800" fill="${theme.titleInk}">${opt}</text>`;
    });
    for (let r = 0; r < 10; r++) {
      const qNum = b * 10 + r + 1;
      const qActive = qNum <= active.p1;
      const py = TEMPLATE.p1Y[r];
      p1Svg += `<text x="${numX}" y="${(py + 8).toFixed(1)}" text-anchor="end" font-family="${FONT_SANS}" font-size="22" font-weight="700" fill="${theme.textInk}" opacity="${qActive ? '1' : '0.32'}">${qNum}</text>`;
      for (let c = 0; c < 4; c++) {
        p1Svg += renderBubble(TEMPLATE.p1X[b][c], py, R, theme);
      }
    }
  }
  p1Svg += '</g>';

  /* 6. PHẦN II (4 khối x 2 câu x 4 ý a,b,c,d x Đúng/Sai) theo đúng TEMPLATE.p2X & TEMPLATE.p2Y */
  const p2ScopeText = active.p2 === 0
    ? 'Phần này không có trong đề'
    : active.p2 < MAX_COUNTS.p2
      ? `Thí sinh tô từ Câu 1 đến Câu ${active.p2}`
      : 'Mỗi ý chọn Đúng hoặc Sai (Câu 1 – Câu 8)';

  let p2Svg = `
    <g class="omr-part2">
      <text x="148" y="1914" font-family="${FONT_SERIF}" font-size="26" font-weight="700" fill="${theme.titleInk}">PHẦN II.</text>
      <text x="282" y="1914" font-family="${FONT_SERIF}" font-size="22" font-weight="700" fill="${theme.textInk}">Câu trắc nghiệm đúng sai</text>
      <rect x="1800" y="1884" width="498" height="38" rx="9" fill="${theme.softFill}" stroke="${theme.innerStroke}" stroke-width="1.2" />
      <text x="2049" y="1910" text-anchor="middle" font-family="${FONT_SANS}" font-size="16" font-weight="700" fill="${theme.titleInk}">${escapeXml(p2ScopeText)}</text>
  `;

  for (let b = 0; b < 4; b++) {
    const fx = p1Frames[b];
    const q1Num = b * 2 + 1;
    const q2Num = b * 2 + 2;
    const midX = ((TEMPLATE.p2X[b][1] + TEMPLATE.p2X[b][2]) / 2).toFixed(1);
    const q1Cx = ((TEMPLATE.p2X[b][0] + TEMPLATE.p2X[b][1]) / 2).toFixed(1);
    const q2Cx = ((TEMPLATE.p2X[b][2] + TEMPLATE.p2X[b][3]) / 2).toFixed(1);

    p2Svg += `
      <rect x="${fx}" y="1940" width="${p1BlockW}" height="385" rx="5" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="2" />
      <rect x="${fx}" y="1940" width="${p1BlockW}" height="106" rx="4" fill="${theme.softFill}" />
      <line x1="${fx}" y1="2046" x2="${fx + p1BlockW}" y2="2046" stroke="${theme.frameStroke}" stroke-width="1.6" />
      <line x1="${fx + 74}" y1="1940" x2="${fx + 74}" y2="2325" stroke="${theme.innerStroke}" stroke-width="1" stroke-opacity="0.3" />
      <line x1="${midX}" y1="1940" x2="${midX}" y2="2325" stroke="${theme.frameStroke}" stroke-width="1.5" />

      <text x="${q1Cx}" y="1982" text-anchor="middle" font-family="${FONT_SERIF}" font-size="24" font-weight="700" fill="${theme.titleInk}" opacity="${q1Num <= active.p2 ? '1' : '0.36'}">Câu ${q1Num}</text>
      <text x="${q2Cx}" y="1982" text-anchor="middle" font-family="${FONT_SERIF}" font-size="24" font-weight="700" fill="${theme.titleInk}" opacity="${q2Num <= active.p2 ? '1' : '0.36'}">Câu ${q2Num}</text>

      <text x="${TEMPLATE.p2X[b][0]}" y="2030" text-anchor="middle" font-family="${FONT_SANS}" font-size="19" font-weight="800" fill="${theme.textInk}">Đúng</text>
      <text x="${TEMPLATE.p2X[b][1]}" y="2030" text-anchor="middle" font-family="${FONT_SANS}" font-size="19" font-weight="800" fill="${theme.textInk}">Sai</text>
      <text x="${TEMPLATE.p2X[b][2]}" y="2030" text-anchor="middle" font-family="${FONT_SANS}" font-size="19" font-weight="800" fill="${theme.textInk}">Đúng</text>
      <text x="${TEMPLATE.p2X[b][3]}" y="2030" text-anchor="middle" font-family="${FONT_SANS}" font-size="19" font-weight="800" fill="${theme.textInk}">Sai</text>
    `;

    ['a.', 'b.', 'c.', 'd.'].forEach((lbl, r) => {
      const py = TEMPLATE.p2Y[r];
      p2Svg += `<text x="${fx + 44}" y="${(py + 7).toFixed(1)}" text-anchor="end" font-family="${FONT_SERIF}" font-size="23" font-weight="700" fill="${theme.textInk}" opacity="${q1Num <= active.p2 || q2Num <= active.p2 ? '1' : '0.36'}">${lbl}</text>`;
      for (let c = 0; c < 4; c++) {
        p2Svg += renderBubble(TEMPLATE.p2X[b][c], py, R, theme);
      }
    });
  }
  p2Svg += '</g>';

  /* 7. PHẦN III (6 câu trả lời ngắn: ô viết tay + '-', ',', 0..9) theo đúng TEMPLATE.p3X/Y */
  const p3Borders = [148, 506, 866, 1226, 1584, 1942, 2298];
  const p3ScopeText = active.p3 === 0
    ? 'Phần này không có trong đề'
    : active.p3 < MAX_COUNTS.p3
      ? `Thí sinh tô từ Câu 1 đến Câu ${active.p3}`
      : 'Tô từ trái sang phải, kể cả dấu (-) và dấu (,)';

  let p3Svg = `
    <g class="omr-part3">
      <text x="148" y="2394" font-family="${FONT_SERIF}" font-size="26" font-weight="700" fill="${theme.titleInk}">PHẦN III.</text>
      <text x="292" y="2394" font-family="${FONT_SERIF}" font-size="22" font-weight="700" fill="${theme.textInk}">Câu trắc nghiệm trả lời ngắn</text>
      <rect x="1800" y="2364" width="498" height="38" rx="9" fill="${theme.softFill}" stroke="${theme.innerStroke}" stroke-width="1.2" />
      <text x="2049" y="2390" text-anchor="middle" font-family="${FONT_SANS}" font-size="16" font-weight="700" fill="${theme.titleInk}">${escapeXml(p3ScopeText)}</text>

      <rect x="148" y="2424" width="${2298 - 148}" height="900" rx="5" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="2.2" />
      <rect x="148" y="2424" width="${2298 - 148}" height="58" rx="4" fill="${theme.softFill}" />
      <line x1="148" y1="2482" x2="2298" y2="2482" stroke="${theme.frameStroke}" stroke-width="1.6" />
      <line x1="148" y1="2582" x2="2298" y2="2582" stroke="${theme.frameStroke}" stroke-width="1.6" />
  `;

  for (let k = 0; k < 6; k++) {
    const leftX = p3Borders[k];
    const lblX = leftX + 42;
    const cols = TEMPLATE.p3X[k];
    const qActive = k + 1 <= active.p3;

    if (k > 0) {
      p3Svg += `<line x1="${leftX}" y1="2424" x2="${leftX}" y2="3324" stroke="${theme.frameStroke}" stroke-width="1.8" />`;
    }

    p3Svg += `<text x="${((cols[0] + cols[3]) / 2).toFixed(1)}" y="2462" text-anchor="middle" font-family="${FONT_SERIF}" font-size="24" font-weight="700" fill="${theme.titleInk}" opacity="${qActive ? '1' : '0.35'}">Câu ${k + 1}</text>`;

    // 4 ô vuông ghi số câu trả lời ngắn trên đầu mỗi cột
    const boxLeft = cols[0] - 29;
    const boxW = cols[3] + 29 - boxLeft;
    p3Svg += `<rect x="${boxLeft.toFixed(1)}" y="2496" width="${boxW.toFixed(1)}" height="66" fill="#ffffff" stroke="${theme.frameStroke}" stroke-width="1.8" />`;
    for (let c = 1; c < 4; c++) {
      const vx = ((cols[c - 1] + cols[c]) / 2).toFixed(1);
      p3Svg += `<line x1="${vx}" y1="2496" x2="${vx}" y2="2562" stroke="${theme.frameStroke}" stroke-width="1.5" />`;
    }

    // Dòng dấu trừ (-) ở cột 0
    p3Svg += `<text x="${lblX}" y="${(TEMPLATE.p3MinusY + 7).toFixed(1)}" text-anchor="middle" font-family="${FONT_SANS}" font-size="26" font-weight="800" fill="${theme.textInk}">-</text>`;
    p3Svg += renderBubble(cols[0], TEMPLATE.p3MinusY, R, theme);

    // Dòng dấu phẩy (,) ở cột 1 & 2
    p3Svg += `<text x="${lblX}" y="${(TEMPLATE.p3CommaY + 5).toFixed(1)}" text-anchor="middle" font-family="${FONT_SANS}" font-size="28" font-weight="800" fill="${theme.textInk}">,</text>`;
    p3Svg += renderBubble(cols[1], TEMPLATE.p3CommaY, R, theme);
    p3Svg += renderBubble(cols[2], TEMPLATE.p3CommaY, R, theme);

    // 10 dòng chữ số 0..9
    TEMPLATE.p3DigitY.forEach((dy, d) => {
      p3Svg += `<text x="${lblX}" y="${(dy + 8).toFixed(1)}" text-anchor="middle" font-family="${FONT_SANS}" font-size="22" font-weight="700" fill="${theme.textInk}">${d}</text>`;
      cols.forEach((cx) => {
        p3Svg += renderBubble(cx, dy, R, theme);
      });
    });
  }
  p3Svg += '</g>';

  /* 8. Chân trang bản quyền ELEC Science AI (nằm ở y = 3428..3496, tách biệt an toàn bên dưới hàng vạch y = 3399) */
  const footerSvg = `
    <g class="omr-footer">
      <line x1="135" y1="3428" x2="2338" y2="3428" stroke="${theme.innerStroke}" stroke-width="1.2" stroke-opacity="0.45" />
      ${renderElecFlaskPaths(138, 3440, 34, theme.brandPrimary, theme.frameStroke)}
      <text x="184" y="3464" font-family="${FONT_SANS}" font-size="17" font-weight="800" fill="${theme.brandDark}">© ${new Date().getFullYear()} ELEC Science AI</text>
      <text x="415" y="3464" font-family="${FONT_SANS}" font-size="16" font-weight="500" fill="${theme.mutedInk}">· Hệ thống tạo &amp; chấm phiếu OMR chuẩn Bộ GD&amp;ĐT (elecai.id.vn)</text>
      <text x="2336" y="3464" text-anchor="end" font-family="${FONT_SANS}" font-size="16" font-weight="700" fill="${theme.titleInk}">
        Mã bản quyền: ${escapeXml(serial)} · ${escapeXml(theme.label)}
      </text>
    </g>
  `;

  return `<svg class="omr-svg" viewBox="0 0 ${TEMPLATE.width} ${TEMPLATE.height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Phiếu trả lời trắc nghiệm A4 chuẩn Bộ GD&amp;ĐT — ELEC Science AI">
    <rect x="0" y="0" width="${TEMPLATE.width}" height="${TEMPLATE.height}" fill="#ffffff" />
    ${masthead}
    ${headerInfo}
    ${sbdCodeSvg}
    ${p1Svg}
    ${p2Svg}
    ${p3Svg}
    ${timingMarks}
    ${footerSvg}
  </svg>`;
}

/**
 * Tạo 1 tài liệu HTML hoàn chỉnh gồm 1 hoặc nhiều trang A4 chuẩn in không tràn trang.
 * Có thanh hướng dẫn trên màn hình (tự động ẩn khi @media print).
 */
export function buildOmrPrintDocumentHtml(sheetOptionsList = [], { autoPrint = true } = {}) {
  const list = Array.isArray(sheetOptionsList) && sheetOptionsList.length > 0
    ? sheetOptionsList
    : [{}];

  const first = list[0] || {};
  const docTitle = list.length > 1
    ? `${first.examTitle || 'Phiếu Trả Lời Trắc Nghiệm'} (${list.length} mã đề) — ELEC Science AI`
    : `${first.code ? `Mã đề ${first.code} — ` : ''}${first.examTitle || 'Phiếu Trả Lời Trắc Nghiệm A4'} — ELEC Science AI`;

  const pagesHtml = list
    .map((opts) => `<section class="omr-page">${buildOmrSvgMarkup(opts)}</section>`)
    .join('\n');

  const autoPrintScript = autoPrint
    ? `<script>
        (function () {
          function trigger() {
            try { window.focus(); window.print(); } catch (e) {}
          }
          if (document.readyState === 'complete') {
            setTimeout(trigger, 180);
          } else {
            window.addEventListener('load', function () { setTimeout(trigger, 180); });
          }
        })();
      </script>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeXml(docTitle)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      font-family: ${FONT_SANS};
    }
    .omr-screen-bar {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 18px;
      background: #0f172a;
      color: #f8fafc;
      font-size: 13px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.25);
    }
    .omr-screen-bar button {
      border: 0;
      border-radius: 10px;
      padding: 8px 16px;
      background: #0284c7;
      color: #ffffff;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    .omr-screen-bar button:hover { background: #0369a1; }
    .omr-sheet-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 16px 0 32px;
    }
    .omr-page {
      width: 210mm;
      height: 296.5mm;
      padding: 3.5mm 3mm;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .omr-page:not(:last-child) {
      break-after: page;
      page-break-after: always;
    }
    .omr-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }
    .omr-svg {
      width: 204mm;
      height: 288.56mm;
      max-width: 100%;
      max-height: 100%;
      display: block;
    }
    @media print {
      html, body {
        width: 210mm;
        background: #ffffff !important;
      }
      .omr-screen-bar { display: none !important; }
      .omr-sheet-stack {
        display: block;
        padding: 0 !important;
        gap: 0 !important;
      }
      .omr-page {
        box-shadow: none !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="omr-screen-bar">
    <div>
      <strong>ELEC Science AI · Phiếu OMR Chuẩn Bộ GD&amp;ĐT (${list.length} trang A4)</strong>
      <span style="opacity:0.8;margin-left:8px;">Mẹo: Chọn Khổ giấy A4, Lề = Mặc định / Không có, Tỷ lệ 100%.</span>
    </div>
    <button type="button" onclick="window.print()">In Phiếu A4 (Ctrl + P)</button>
  </div>
  <main class="omr-sheet-stack">
    ${pagesHtml}
  </main>
  ${autoPrintScript}
</body>
</html>`;
}

/**
 * Thực thi in HTML an toàn qua iframe ẩn (không bị trình duyệt chặn popup),
 * tự fallback sang window.open nếu môi trường không cho in trong iframe.
 */
export function dispatchPrintDocument(html) {
  if (typeof document === 'undefined') {
    throw new Error('Môi trường hiện tại không hỗ trợ hộp thoại in.');
  }

  let printedViaIframe = false;
  try {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    const win = iframe.contentWindow;
    if (doc && win) {
      doc.open();
      doc.write(html);
      doc.close();

      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        try { iframe.remove(); } catch {}
      };
      win.addEventListener?.('afterprint', () => setTimeout(cleanup, 300));
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch {}
      }, 160);
      setTimeout(cleanup, 120000);
      printedViaIframe = true;
    } else {
      iframe.remove();
    }
  } catch {
    printedViaIframe = false;
  }

  if (printedViaIframe) return { ok: true, method: 'iframe' };

  const win = typeof window !== 'undefined' ? window.open('', '_blank', 'width=940,height=1150') : null;
  if (!win) {
    throw new Error('Trình duyệt đang chặn cửa sổ in. Hãy thử nút "Tải file A4 (.html)" hoặc bật cho phép in.');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {}
  }, 220);
  return { ok: true, method: 'popup' };
}

/** Tải trực tiếp file HTML A4 vector về máy để in ở máy khác / tiệm photocopy. */
export function downloadOmrSheetHtml(sheetOptionsList = [], filename = 'phieu-omr-chuan-bgd-elecai.html') {
  const list = Array.isArray(sheetOptionsList) ? sheetOptionsList : [sheetOptionsList];
  const html = buildOmrPrintDocumentHtml(list, { autoPrint: false });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * In 1 phiếu trả lời trắc nghiệm A4 chuẩn Bộ GD&ĐT (tương thích 100% caller cũ).
 */
export function printOmrSheetA4(options = {}) {
  // Khi mở bằng auto-script trong iframe/popup, print sẽ tự kích hoạt từ dispatchPrintDocument
  const html = buildOmrPrintDocumentHtml([options], { autoPrint: false });
  return dispatchPrintDocument(html);
}

/**
 * In hàng loạt nhiều mã đề vào CÙNG 1 tài liệu in nhiều trang A4 (không còn mở N popup).
 */
export function printMultipleOmrSheets(variants = [], commonOptions = {}) {
  const normalized = (Array.isArray(variants) ? variants : []).map((v) => (
    typeof v === 'string' || typeof v === 'number'
      ? { ...commonOptions, code: String(v) }
      : { ...commonOptions, ...v }
  ));
  if (!normalized.length) return null;
  const html = buildOmrPrintDocumentHtml(normalized, { autoPrint: false });
  return dispatchPrintDocument(html);
}
