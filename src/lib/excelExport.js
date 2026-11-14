/**
 * Branded Excel Workbook Engine (.xlsx) — ELEC AI Science Studio
 * Generates executive-grade multi-sheet OOXML (.xlsx) workbooks via ExcelJS (lazy-loaded)
 * with embedded ELEC mascot branding, copyright metadata, frozen headers,
 * auto-fitted Vietnamese column widths, semantic score styling, and live Excel formulas.
 */

const COPYRIGHT_TEXT = '© ELEC AI Science Studio · Hệ thống Khảo thí & Sư phạm GDPT 2025 · Bản quyền được bảo lưu';

const MASCOT_FILES = {
  celebrate: 'img/elec/elec-celebrate.png',
  cool: 'img/elec/elec-cool.png',
  happy: 'img/elec/elec-happy.png',
  think: 'img/elec/elec-think.png',
  hello: 'img/elec/elec-hello.png',
  default: 'img/elec/elec-default.png',
};

const PALETTE = {
  navy: 'FF1E3A8A',
  indigo: 'FF1D4ED8',
  royalSoft: 'FFEFF6FF',
  slateDark: 'FF0F172A',
  slateMuted: 'FF475569',
  slateLight: 'FFF8FAFC',
  border: 'FFCBD5E1',
  borderSoft: 'FFE2E8F0',
  white: 'FFFFFFFF',
  goldBg: 'FFFEF3C7',
  goldText: 'FF92400E',
  emeraldBg: 'FFDCFCE7',
  emeraldText: 'FF166534',
  skyBg: 'FFDBEAFE',
  skyText: 'FF1E40AF',
  roseBg: 'FFFEE2E2',
  roseText: 'FF991B1B',
  neutralBg: 'FFF1F5F9',
  neutralText: 'FF64748B',
};

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: PALETTE.border } },
  left: { style: 'thin', color: { argb: PALETTE.border } },
  bottom: { style: 'thin', color: { argb: PALETTE.border } },
  right: { style: 'thin', color: { argb: PALETTE.border } },
};

const HEADER_BORDER = {
  top: { style: 'thin', color: { argb: PALETTE.indigo } },
  left: { style: 'thin', color: { argb: 'FF3B82F6' } },
  bottom: { style: 'medium', color: { argb: PALETTE.navy } },
  right: { style: 'thin', color: { argb: 'FF3B82F6' } },
};

const mascotCache = new Map();

/**
 * Resolve stored teacher profile & school header metadata from localStorage (graceful in SSR/Node).
 */
export function readTeacherBrandMeta(uid = '') {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const ls = window.localStorage;
    let profile = null;
    let prefs = null;

    if (uid) {
      const pRaw = ls.getItem(`cs-teacher-profile-v1:${uid}`);
      const hRaw = ls.getItem(`cs-teacher-exam-prefs-v1:${uid}`);
      if (pRaw) profile = JSON.parse(pRaw);
      if (hRaw) prefs = JSON.parse(hRaw);
    }

    if (!profile || !prefs) {
      for (let i = 0; i < ls.length; i += 1) {
        const k = ls.key(i) || '';
        if (!profile && k.startsWith('cs-teacher-profile-v1:')) {
          try { profile = JSON.parse(ls.getItem(k) || 'null'); } catch {}
        }
        if (!prefs && k.startsWith('cs-teacher-exam-prefs-v1:')) {
          try { prefs = JSON.parse(ls.getItem(k) || 'null'); } catch {}
        }
      }
    }

    return {
      teacherName: profile?.displayName || profile?.fullName || '',
      subject: profile?.subject || prefs?.headerSubjectGroup || '',
      schoolName: profile?.school || prefs?.headerSchoolName || '',
      deptName: prefs?.headerDeptName || '',
    };
  } catch {
    return {};
  }
}

/**
 * Sanitize worksheet name to meet Excel's 31-char limit and forbidden-char rules.
 */
export function sanitizeSheetName(raw, fallback = 'Sheet1') {
  const cleaned = String(raw || fallback)
    .replace(/[\\/?*[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || fallback).slice(0, 31);
}

/**
 * Convert 1-based column index to Excel column letter (1 -> A, 27 -> AA).
 */
export function colIndexToLetter(index) {
  let n = Math.max(1, Number(index) || 1);
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/**
 * Classify an exam into Vietnamese Circular 22 grade columns: 'tx' | 'dgk' | 'ckk'.
 */
export function classifyExamGradeColumn(exam = {}) {
  const explicit = String(exam.gradeType || exam.examType || exam.category || '').trim().toLowerCase();
  if (explicit === 'ckk' || explicit === 'cuối kỳ' || explicit === 'cuối học kỳ') return 'ckk';
  if (explicit === 'dgk' || explicit === 'đgk' || explicit === 'giữa kỳ' || explicit === 'giữa học kỳ') return 'dgk';
  if (explicit === 'tx' || explicit === 'thường xuyên') return 'tx';

  const title = String(exam.title || '').toLowerCase();
  const hay = `${explicit} ${title}`;
  const dur = Number(exam.duration) || 0;

  if (/\bckk\b|cuối\s*kỳ|cuối\s*học\s*kỳ|học\s*kỳ|\bhk\s*[12]\b|thi\s*thử\s*thpt|tốt\s*nghiệp/.test(hay) || dur >= 60) {
    return 'ckk';
  }
  if (/\bđgk\b|\bdgk\b|giữa\s*kỳ|giữa\s*học\s*kỳ|45\s*phút|\b45p\b|1\s*tiết|một\s*tiết/.test(hay) || (dur >= 35 && dur < 60)) {
    return 'dgk';
  }
  return 'tx';
}

const round1 = (n) => Math.round(Number(n) * 10) / 10;

/**
 * Compute per-student TX / ĐGK / CKK averages (scale 10) and weighted TB without cloning scores.
 * Empty buckets stay null so missing exams remain blank rather than duplicated.
 */
export function computeStudentPeriodGrades(student = {}, exams = [], submissionsMap = {}) {
  const buckets = { tx: [], dgk: [], ckk: [] };
  const examById = new Map((exams || []).map((ex) => [ex.id, ex]));

  let subs = Array.isArray(student.subs) ? student.subs : [];
  if (!subs.length && student.id && exams?.length) {
    const collected = [];
    exams.forEach((ex) => {
      (submissionsMap[ex.id] || []).forEach((s) => {
        if (s.studentId === student.id) {
          collected.push({ ...s, examId: ex.id, examTitle: ex.title });
        }
      });
    });
    subs = collected;
  }

  subs.forEach((sub) => {
    const exam = examById.get(sub.examId) || { title: sub.examTitle };
    const col = classifyExamGradeColumn(exam);
    const totalPts = Math.max(1, Number(sub.totalPoints) || 10);
    const sc10 = (Math.max(0, Number(sub.score) || 0) / totalPts) * 10;
    buckets[col].push(sc10);
  });

  const avgBucket = (arr) => (arr.length ? round1(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
  const tx = avgBucket(buckets.tx);
  const dgk = avgBucket(buckets.dgk);
  const ckk = avgBucket(buckets.ckk);

  let weightedSum = 0;
  let weightTotal = 0;
  if (tx !== null) { weightedSum += tx * 1; weightTotal += 1; }
  if (dgk !== null) { weightedSum += dgk * 2; weightTotal += 2; }
  if (ckk !== null) { weightedSum += ckk * 3; weightTotal += 3; }

  const tb = weightTotal > 0 ? round1(weightedSum / weightTotal) : null;
  let status = 'Chưa thi';
  if (tb !== null) {
    if (tb >= 8.0) status = 'Giỏi';
    else if (tb >= 6.5) status = 'Khá';
    else if (tb >= 5.0) status = 'Đạt';
    else status = 'Chưa đạt';
  }

  return {
    tx,
    dgk,
    ckk,
    tb,
    status,
    subCount: subs.length,
    txCount: buckets.tx.length,
    dgkCount: buckets.dgk.length,
    ckkCount: buckets.ckk.length,
  };
}

/**
 * Fetch mascot PNG ArrayBuffer (cached). Gracefully returns null outside browser or on fetch failure.
 */
async function loadMascotBuffer(variant = 'celebrate') {
  const key = MASCOT_FILES[variant] ? variant : 'celebrate';
  if (mascotCache.has(key)) return mascotCache.get(key);
  if (typeof fetch !== 'function' || typeof window === 'undefined') return null;

  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const res = await fetch(`${cleanBase}${MASCOT_FILES[key]}`);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    mascotCache.set(key, buf);
    return buf;
  } catch {
    return null;
  }
}

function bandStyle(value) {
  const s = String(value || '').toLowerCase().trim();
  if (!s || s === 'chưa thi' || s === 'chưa có dữ liệu' || s === '0 vi phạm' || s === 'bình thường') {
    if (s === 'bình thường') return { fill: PALETTE.emeraldBg, font: PALETTE.emeraldText };
    return { fill: PALETTE.neutralBg, font: PALETTE.neutralText };
  }
  if (/giỏi|tốt|đã nộp|vững|liêm chính cao|ổn định|hoàn thành/.test(s)) {
    return { fill: PALETTE.emeraldBg, font: PALETTE.emeraldText };
  }
  if (/^khá|đang làm/.test(s)) {
    return { fill: PALETTE.skyBg, font: PALETTE.skyText };
  }
  if (/^đạt|trung bình|cần ôn|nhẹ|cần xem lại|tạm dừng/.test(s)) {
    return { fill: PALETTE.goldBg, font: PALETTE.goldText };
  }
  if (/chưa đạt|yếu|kém|nặng|cần kèm|vi phạm|lỗi|thoát/.test(s)) {
    return { fill: PALETTE.roseBg, font: PALETTE.roseText };
  }
  return null;
}

function score10Style(num) {
  if (typeof num !== 'number' || Number.isNaN(num)) return null;
  if (num >= 8.0) return { fill: PALETTE.emeraldBg, font: PALETTE.emeraldText };
  if (num >= 6.5) return { fill: PALETTE.skyBg, font: PALETTE.skyText };
  if (num >= 5.0) return { fill: PALETTE.goldBg, font: PALETTE.goldText };
  return { fill: PALETTE.roseBg, font: PALETTE.roseText };
}

function estimateColumnWidth(header, values = [], minW = 10, maxW = 48) {
  let longest = String(header || '').length + 4;
  for (let i = 0; i < Math.min(values.length, 250); i += 1) {
    const raw = values[i];
    const str = (raw && typeof raw === 'object' && 'result' in raw)
      ? String(raw.result ?? '')
      : String(raw ?? '');
    const lineLen = str.split('\n').reduce((m, line) => Math.max(m, line.length), 0);
    if (lineLen + 3 > longest) longest = lineLen + 3;
  }
  return Math.max(minW, Math.min(maxW, longest));
}

/**
 * Build an ExcelJS Workbook instance cleanly (testable without browser DOM or network).
 */
export function buildStyledWorkbook(ExcelJS, config = {}) {
  const {
    creator = 'ELEC AI Science Studio',
    sheets = [],
    brandMeta = {},
    mascotBuffers = {},
  } = config;

  const wb = new ExcelJS.Workbook();
  wb.creator = creator;
  wb.lastModifiedBy = brandMeta.teacherName || creator;
  wb.created = new Date();
  wb.modified = new Date();
  wb.company = 'ELEC AI Science Studio';

  const usedNames = new Set();

  sheets.forEach((sheetCfg, sIdx) => {
    let baseName = sanitizeSheetName(sheetCfg.name, `Trang ${sIdx + 1}`);
    if (usedNames.has(baseName)) {
      baseName = sanitizeSheetName(`${baseName.slice(0, 27)}_${sIdx + 1}`);
    }
    usedNames.add(baseName);

    const cols = sheetCfg.columns || [];
    const colCount = Math.max(4, cols.length);
    const lastColLetter = colIndexToLetter(colCount);

    const ws = wb.addWorksheet(baseName, {
      views: [{ showGridLines: true }],
      properties: { defaultRowHeight: 22 },
      pageSetup: {
        orientation: colCount >= 7 ? 'landscape' : 'portrait',
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    const mascotKey = sheetCfg.mascot === false ? null : (sheetCfg.mascot || 'celebrate');
    const mascotBuf = mascotKey ? (mascotBuffers[mascotKey] || mascotBuffers.default || null) : null;
    const hasBannerLogo = colCount >= 3;

    // 1. BRANDED HERO HEADER (Rows 1..3)
    const bannerStartCol = hasBannerLogo ? 2 : 1;
    const bannerStartLetter = colIndexToLetter(bannerStartCol);

    if (hasBannerLogo) {
      ws.mergeCells('A1:A3');
      const logoCell = ws.getCell('A1');
      logoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.royalSoft } };
      logoCell.alignment = { vertical: 'middle', horizontal: 'center' };
      logoCell.border = {
        top: { style: 'medium', color: { argb: PALETTE.navy } },
        left: { style: 'medium', color: { argb: PALETTE.navy } },
        bottom: { style: 'medium', color: { argb: PALETTE.navy } },
        right: { style: 'thin', color: { argb: PALETTE.border } },
      };
      if (!mascotBuf) {
        logoCell.value = 'ELEC AI';
        logoCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: PALETTE.navy } };
      } else {
        const imgId = wb.addImage({ buffer: mascotBuf, extension: 'png' });
        ws.addImage(imgId, {
          tl: { col: 0.14, row: 0.15 },
          ext: { width: 64, height: 64 },
          editAs: 'oneCell',
        });
      }
    }

    ws.mergeCells(`${bannerStartLetter}1:${lastColLetter}1`);
    const titleCell = ws.getCell(`${bannerStartLetter}1`);
    titleCell.value = sheetCfg.title || 'BÁO CÁO ĐIỂM & PHÂN TÍCH SƯ PHẠM ELEC AI';
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: PALETTE.white } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navy } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(1).height = 30;

    ws.mergeCells(`${bannerStartLetter}2:${lastColLetter}2`);
    const subCell = ws.getCell(`${bannerStartLetter}2`);
    const schoolStr = brandMeta.schoolName || sheetCfg.schoolName || 'Trường THPT · Hệ thống ELEC AI';
    const teacherStr = brandMeta.teacherName || sheetCfg.teacherName || 'Giáo viên bộ môn';
    subCell.value = sheetCfg.subtitle || `${schoolStr}  ·  GV: ${teacherStr}`;
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FFE0E7FF' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.indigo } };
    subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(2).height = 22;

    ws.mergeCells(`${bannerStartLetter}3:${lastColLetter}3`);
    const copyCell = ws.getCell(`${bannerStartLetter}3`);
    copyCell.value = `${COPYRIGHT_TEXT} · Xuất lúc ${new Date().toLocaleString('vi-VN')}`;
    copyCell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: PALETTE.navy } };
    copyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.royalSoft } };
    copyCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    copyCell.border = { bottom: { style: 'medium', color: { argb: PALETTE.navy } } };
    ws.getRow(3).height = 20;

    let curRow = 4;

    // 2. OPTIONAL METADATA / SUMMARY STATS STRIP
    const metaItems = sheetCfg.meta || [];
    if (metaItems.length > 0) {
      ws.mergeCells(`A${curRow}:${lastColLetter}${curRow}`);
      const mCell = ws.getCell(`A${curRow}`);
      mCell.value = metaItems.map((m) => `${m.label}: ${m.value}`).join('   |   ');
      mCell.font = { name: 'Segoe UI', size: 9.5, color: { argb: PALETTE.slateDark } };
      mCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.slateLight } };
      mCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
      mCell.border = THIN_BORDER;
      ws.getRow(curRow).height = 24;
      curRow += 1;
    }

    // Optional live stats bar (e.g., formula KPI tiles before data table)
    const statsRowReserved = typeof sheetCfg.statsStrip === 'function'
      || (Array.isArray(sheetCfg.statsStrip) && sheetCfg.statsStrip.length > 0);
    const statsRowIndex = statsRowReserved ? curRow : null;
    if (statsRowReserved) {
      curRow += 1;
    }

    // Blank separator row before table
    ws.getRow(curRow).height = 10;
    curRow += 1;

    // 3. TABLE HEADER ROW
    const headerRowIndex = curRow;
    const headerRow = ws.getRow(headerRowIndex);
    headerRow.height = 30;
    cols.forEach((col, cIdx) => {
      const cell = headerRow.getCell(cIdx + 1);
      cell.value = col.header;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: PALETTE.white } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navy } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: col.align || 'center',
        wrapText: true,
      };
      cell.border = HEADER_BORDER;
    });
    curRow += 1;

    // 4. DATA ROWS
    const dataStartRow = curRow;
    const rawRows = sheetCfg.rows || [];
    rawRows.forEach((r, rIdx) => {
      const excelRow = ws.getRow(curRow);
      excelRow.height = sheetCfg.rowHeight || 23;
      const zebraFill = rIdx % 2 === 1 ? PALETTE.slateLight : PALETTE.white;

      cols.forEach((col, cIdx) => {
        const cell = excelRow.getCell(cIdx + 1);
        let rawVal = Array.isArray(r) ? r[cIdx] : (typeof col.getValue === 'function' ? col.getValue(r, rIdx, curRow) : r[col.key]);
        if (typeof rawVal === 'function') {
          rawVal = rawVal(curRow, rIdx, r);
        }

        cell.value = rawVal === undefined || rawVal === null ? '' : rawVal;
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: PALETTE.slateDark } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraFill } };
        cell.border = THIN_BORDER;
        cell.alignment = {
          vertical: 'middle',
          horizontal: col.align || (typeof rawVal === 'number' ? 'center' : 'left'),
          wrapText: Boolean(col.wrapText),
        };
        if (col.numFmt) {
          cell.numFmt = col.numFmt;
        }

        // Semantic coloring
        const semanticTarget = (rawVal && typeof rawVal === 'object' && 'result' in rawVal) ? rawVal.result : rawVal;
        if (col.isScoreBand) {
          const st = bandStyle(semanticTarget);
          if (st) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: st.fill } };
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: st.font } };
          }
        } else if (col.isScore10 && typeof semanticTarget === 'number') {
          const st = score10Style(semanticTarget);
          if (st) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: st.fill } };
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: st.font } };
          }
        }
      });

      curRow += 1;
    });
    const dataEndRow = Math.max(dataStartRow, curRow - 1);

    // 5. OPTIONAL AGGREGATE FORMULA SUMMARY ROW
    if (sheetCfg.summaryRow && rawRows.length > 0) {
      const sRow = ws.getRow(curRow);
      sRow.height = 26;
      const spec = typeof sheetCfg.summaryRow === 'function'
        ? sheetCfg.summaryRow({ dataStartRow, dataEndRow, colCount })
        : sheetCfg.summaryRow;

      cols.forEach((col, cIdx) => {
        const cell = sRow.getCell(cIdx + 1);
        const colLetter = colIndexToLetter(cIdx + 1);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.royalSoft } };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: PALETTE.navy } };
        cell.border = {
          top: { style: 'medium', color: { argb: PALETTE.navy } },
          bottom: { style: 'medium', color: { argb: PALETTE.navy } },
          left: { style: 'thin', color: { argb: PALETTE.border } },
          right: { style: 'thin', color: { argb: PALETTE.border } },
        };
        cell.alignment = { vertical: 'middle', horizontal: col.align || 'center' };
        if (col.numFmt) cell.numFmt = col.numFmt;

        const override = spec.cells?.[col.key] ?? spec.cells?.[cIdx];
        if (override !== undefined) {
          cell.value = typeof override === 'function' ? override({ dataStartRow, dataEndRow, colLetter }) : override;
        } else if (cIdx === (spec.labelCol ?? 1)) {
          cell.value = spec.label || `TỔNG HỢP (${rawRows.length} dòng)`;
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
      curRow += 1;
    }

    // 6. POPULATE STATS STRIP NOW THAT dataStartRow & dataEndRow ARE KNOWN
    if (statsRowReserved) {
      const sStripRow = ws.getRow(statsRowIndex);
      sStripRow.height = 24;
      const statsItems = typeof sheetCfg.statsStrip === 'function'
        ? sheetCfg.statsStrip({ dataStartRow, dataEndRow, rowCount: rawRows.length })
        : sheetCfg.statsStrip;
      (statsItems || []).slice(0, colCount).forEach((item, idx) => {
        const c = sStripRow.getCell(idx + 1);
        c.value = item.value;
        c.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: item.color || PALETTE.navy } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.fill || PALETTE.royalSoft } };
        c.alignment = { vertical: 'middle', horizontal: item.align || 'center', wrapText: true };
        c.border = THIN_BORDER;
        if (item.numFmt) c.numFmt = item.numFmt;
      });
    }

    // 7. COPYRIGHT WATERMARK FOOTER ROW
    ws.getRow(curRow).height = 8;
    curRow += 1;
    ws.mergeCells(`A${curRow}:${lastColLetter}${curRow}`);
    const footerCell = ws.getCell(`A${curRow}`);
    footerCell.value = sheetCfg.footerNote || `${COPYRIGHT_TEXT} · Tài liệu xuất tự động, giữ nguyên định dạng & công thức Excel.`;
    footerCell.font = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: PALETTE.slateMuted } };
    footerCell.alignment = { vertical: 'middle', horizontal: 'right' };
    ws.getRow(curRow).height = 20;

    // 8. AUTO-WIDTH COLUMNS + FREEZE HEADER + AUTOFILTER
    cols.forEach((col, cIdx) => {
      const vals = rawRows.map((r) => (Array.isArray(r) ? r[cIdx] : (typeof col.getValue === 'function' ? '' : r[col.key])));
      const autoW = col.width || estimateColumnWidth(col.header, vals, col.minWidth || 10, col.maxWidth || 48);
      ws.getColumn(cIdx + 1).width = Math.max(cIdx === 0 && hasBannerLogo ? 12 : 8, autoW);
    });

    ws.views = [{ state: 'frozen', ySplit: headerRowIndex, showGridLines: true }];
    if (rawRows.length > 0) {
      ws.autoFilter = {
        from: { row: headerRowIndex, column: 1 },
        to: { row: dataEndRow, column: cols.length },
      };
    }
  });

  return wb;
}

/**
 * Trigger browser file download for an ArrayBuffer/Uint8Array `.xlsx`.
 */
function triggerBrowserXlsxDownload(buffer, filename) {
  const safeName = filename.endsWith('.xlsx') ? filename : `${filename.replace(/\.csv$/i, '')}.xlsx`;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * High-level async helper called from Teacher components on Export click.
 * Dynamically imports ExcelJS, embeds requested ELEC mascots + teacher profile copyright, and downloads `.xlsx`.
 */
export async function exportStyledWorkbook({
  filename = 'bao-cao-elec-ai.xlsx',
  uid = '',
  sheets = [],
  mascot = 'celebrate',
  brandMeta: explicitBrandMeta = {},
} = {}) {
  const ExcelJSMod = await import('exceljs');
  const ExcelJS = ExcelJSMod.default || ExcelJSMod;

  const brandMeta = { ...readTeacherBrandMeta(uid), ...explicitBrandMeta };
  const mascotSet = new Set([mascot]);
  sheets.forEach((s) => {
    if (s.mascot && s.mascot !== false) mascotSet.add(s.mascot);
  });

  const mascotBuffers = {};
  await Promise.all(
    [...mascotSet].map(async (variant) => {
      const buf = await loadMascotBuffer(variant);
      if (buf) mascotBuffers[variant] = buf;
    }),
  );

  const wb = buildStyledWorkbook(ExcelJS, {
    creator: brandMeta.teacherName || 'ELEC AI Science Studio',
    sheets: sheets.map((s) => ({ mascot, ...s })),
    brandMeta,
    mascotBuffers,
  });

  const outBuf = await wb.xlsx.writeBuffer();
  triggerBrowserXlsxDownload(outBuf, filename);
  return { filename, sheetCount: wb.worksheets.length };
}
