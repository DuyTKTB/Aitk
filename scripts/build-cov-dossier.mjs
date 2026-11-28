#!/usr/bin/env node
/**
 * Copyright (c) 2026 Nguyễn Thế Duy (Duy TK / Tk Media) — ELEC Science AI.
 * All Rights Reserved.
 *
 * Builds the complete statutory submission dossier for Computer Program
 * Copyright Registration at the Copyright Office of Vietnam (Cục Bản quyền tác giả),
 * complying with Thông tư 08/2023/TT-BVHTTDL (Mẫu số 03) and
 * Khoản 9 Điều 43 Nghị định 17/2023/NĐ-CP.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import JSZip from 'jszip';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  PageBreak,
  ShadingType,
} from 'docx';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'ho-so-ban-quyen-cuc-bq');
const ASSETS_DIR = path.join(OUT_DIR, 'assets');
const CD_DIR = path.join(OUT_DIR, '05_DIA_CD_SAN_GHI');

const FONT_NAME = 'Times New Roman';

// Core files prioritized at the start of the source code printout so the first 25 pages
// showcase the most original, high-value algorithms authored by the developer.
const PRIORITY_FILES = [
  'src/App.jsx',
  'src/main.jsx',
  'src/lib/chemBalance.js',
  'src/lib/scientificTools.js',
  'src/lib/omr.js',
  'src/lib/ai.js',
  'src/lib/aiRouter.js',
  'src/lib/aiKnowledge.js',
  'src/lib/aiTools.js',
  'src/lib/aspirationPortfolioOptimizer.js',
  'src/lib/matrixAiService.js',
  'src/lib/examParser.js',
  'src/lib/srs.js',
];

const SECRET_RE = /(^\.env(\.|$)|serviceAccountKey\.json$|credentials\.json$|\.(pem|key|p12|pfx|jks|db|log)$)/i;

function runGit(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).trim();
  } catch {
    return '';
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function p(text, opts = {}) {
  const {
    bold = false,
    italics = false,
    size = 26, // 13pt
    align = AlignmentType.LEFT,
    spaceBefore = 60,
    spaceAfter = 100,
    indentLeft = 0,
    color = '000000',
    underline = undefined,
    pageBreakBefore = false,
  } = opts;

  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, bold, italics, size, font: FONT_NAME, color, underline })];

  return new Paragraph({
    alignment: align,
    spacing: { before: spaceBefore, after: spaceAfter, line: 276 },
    indent: indentLeft ? { left: indentLeft } : undefined,
    pageBreakBefore,
    children: runs,
  });
}

function tr(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT_NAME,
    size: opts.size ?? 26,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    color: opts.color ?? '000000',
    highlight: opts.highlight,
  });
}

function makePlaceholder(label) {
  return tr(`[${label}]`, { bold: true, color: 'B91C1C', highlight: 'yellow' });
}

function makeSimpleTable(rowsData, colWidths = [35, 65]) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: '666666' };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rowsData.map((row, rIdx) => {
      const isHeader = rIdx === 0 && row._header;
      const cells = isHeader ? row.cells : row;
      return new TableRow({
        children: cells.map((cellContent, cIdx) => {
          const children = Array.isArray(cellContent)
            ? [p(cellContent, { spaceBefore: 40, spaceAfter: 40, size: 24 })]
            : [p(String(cellContent), { bold: isHeader || cIdx === 0, spaceBefore: 40, spaceAfter: 40, size: 24 })];
          return new TableCell({
            width: { size: colWidths[cIdx] ?? Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
            borders,
            shading: isHeader
              ? { type: ShadingType.CLEAR, fill: 'E2E8F0', color: 'auto' }
              : undefined,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children,
          });
        }),
      });
    }),
  });
}

function makeVietnamHeader(docTitleLines, formBadge) {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const borders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const out = [];
  if (formBadge) {
    out.push(
      p(formBadge, {
        align: AlignmentType.RIGHT,
        italics: true,
        size: 22,
        spaceBefore: 0,
        spaceAfter: 80,
      })
    );
  }
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders,
              children: [
                p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', {
                  bold: true,
                  size: 26,
                  align: AlignmentType.CENTER,
                  spaceBefore: 0,
                  spaceAfter: 20,
                }),
                p('Độc lập - Tự do - Hạnh phúc', {
                  bold: true,
                  size: 26,
                  align: AlignmentType.CENTER,
                  spaceBefore: 0,
                  spaceAfter: 40,
                  underline: {},
                }),
                p('----------------------------------', {
                  size: 22,
                  align: AlignmentType.CENTER,
                  spaceBefore: 0,
                  spaceAfter: 160,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  for (const line of docTitleLines) {
    out.push(
      p(line.text, {
        bold: line.bold ?? true,
        italics: line.italics ?? false,
        size: line.size ?? 28,
        align: AlignmentType.CENTER,
        spaceBefore: 40,
        spaceAfter: 60,
      })
    );
  }
  return out;
}

function collectCleanSourceFiles() {
  const gitFiles = runGit('git ls-files -z')
    .split('\0')
    .map((s) => s.replace(/\\/g, '/').trim())
    .filter(Boolean);

  const codeExts = /\.(js|jsx|ts|tsx|css|html|sql|rules)$/i;
  const allowedPrefixes = ['src/', 'api/', 'functions/'];

  const set = new Set();
  for (const rel of gitFiles) {
    if (SECRET_RE.test(rel)) continue;
    if (rel.includes('node_modules/')) continue;
    if (allowedPrefixes.some((pref) => rel.startsWith(pref)) && codeExts.test(rel)) {
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
        set.add(rel);
      }
    }
  }
  if (fs.existsSync(path.join(ROOT, 'index.html'))) {
    set.add('index.html');
  }

  const ordered = [];
  for (const pf of PRIORITY_FILES) {
    if (set.has(pf)) {
      ordered.push(pf);
      set.delete(pf);
    }
  }
  const rest = Array.from(set).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return ordered.concat(rest);
}

function wrapCodeLine(line, maxChars = 94) {
  const clean = line.replace(/\t/g, '  ');
  if (clean.length <= maxChars) return [clean];
  const chunks = [];
  for (let i = 0; i < clean.length; i += maxChars) {
    chunks.push(clean.slice(i, i + maxChars));
  }
  return chunks;
}

function buildSourceCodePrintout(sourceFiles, proofSummary) {
  const LINES_PER_PAGE = 52;
  const allDisplayLines = [];

  for (const rel of sourceFiles) {
    const abs = path.join(ROOT, rel);
    const content = fs.readFileSync(abs, 'utf8');
    const rawLines = content.split(/\r?\n/);

    allDisplayLines.push(`// =========================================================================`);
    allDisplayLines.push(`// FILE: ${rel} (${rawLines.length} lines)`);
    allDisplayLines.push(`// =========================================================================`);

    for (let i = 0; i < rawLines.length; i++) {
      const lineNo = String(i + 1).padStart(4, ' ');
      const wrapped = wrapCodeLine(rawLines[i], 88);
      allDisplayLines.push(`${lineNo} | ${wrapped[0]}`);
      for (let w = 1; w < wrapped.length; w++) {
        allDisplayLines.push(`     | ${wrapped[w]}`);
      }
    }
    allDisplayLines.push('');
  }

  const totalPages = Math.ceil(allDisplayLines.length / LINES_PER_PAGE);
  const getPageLines = (pageIdxZeroBased) =>
    allDisplayLines.slice(pageIdxZeroBased * LINES_PER_PAGE, (pageIdxZeroBased + 1) * LINES_PER_PAGE);

  let selectedSegments = [];
  if (totalPages <= 75) {
    selectedSegments = [
      {
        label: `TOÀN BỘ MÃ NGUỒN (Trang 1 - ${totalPages})`,
        pages: Array.from({ length: totalPages }, (_, i) => ({ origPage: i + 1, lines: getPageLines(i) })),
      },
    ];
  } else {
    const midStart = Math.max(25, Math.floor((totalPages - 25) / 2));
    const endStart = totalPages - 25;
    selectedSegments = [
      {
        label: `PHẦN 1/3: 25 TRANG ĐẦU (Trang gốc 1 – 25 / ${totalPages})`,
        pages: Array.from({ length: 25 }, (_, i) => ({ origPage: i + 1, lines: getPageLines(i) })),
      },
      {
        label: `PHẦN 2/3: 25 TRANG GIỮA (Trang gốc ${midStart + 1} – ${midStart + 25} / ${totalPages})`,
        pages: Array.from({ length: 25 }, (_, i) => ({
          origPage: midStart + i + 1,
          lines: getPageLines(midStart + i),
        })),
      },
      {
        label: `PHẦN 3/3: 25 TRANG CUỐI (Trang gốc ${endStart + 1} – ${totalPages} / ${totalPages})`,
        pages: Array.from({ length: 25 }, (_, i) => ({
          origPage: endStart + i + 1,
          lines: getPageLines(endStart + i),
        })),
      },
    ];
  }

  const totalPrintedCodePages = selectedSegments.reduce((sum, s) => sum + s.pages.length, 0);

  // Build plain text version
  const txtOut = [
    `BẢN IN MÃ NGUỒN CHƯƠNG TRÌNH MÁY TÍNH: ELEC SCIENCE AI (elec-science-ai v1.0.0)`,
    `Căn cứ pháp lý: Khoản 9 Điều 43 Nghị định 17/2023/NĐ-CP (25 trang đầu + 25 trang giữa + 25 trang cuối)`,
    `Tác giả & Chủ sở hữu: Nguyễn Thế Duy (Duy TK / Tk Media) — https://www.elecai.id.vn/`,
    `Tổng số tệp mã nguồn sạch: ${sourceFiles.length} tệp | Tổng số trang quy đổi A4: ${totalPages} trang | Số trang trích in: ${totalPrintedCodePages} trang`,
    `Master SHA-256 Manifest: ${proofSummary.manifestSha256}`,
    '================================================================================',
    '',
  ];

  // Build print-ready A4 HTML version
  let printPageNum = 0;
  const htmlPages = [];

  htmlPages.push(`
    <section class="a4-page cover-page">
      <div class="cover-top">
        <p class="vn-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p class="vn-sub">Độc lập - Tự do - Hạnh phúc</p>
        <div class="divider"></div>
      </div>
      <div class="cover-center">
        <p class="doc-badge">BẢN SAO TÁC PHẨM ĐĂNG KÝ QUYỀN TÁC GIẢ (THEO KHOẢN 9 ĐIỀU 43 NGHỊ ĐỊNH 17/2023/NĐ-CP)</p>
        <h1>BẢN IN MÃ NGUỒN<br/>CHƯƠNG TRÌNH MÁY TÍNH</h1>
        <h2>ELEC SCIENCE AI</h2>
        <p class="subtitle">Nền tảng học tập, trợ lý AI và khảo thí trực tuyến Khoa học Tự nhiên (Vật lí – Hóa học – Sinh học)</p>
      </div>
      <table class="meta-table">
        <tr><td><strong>Tên chương trình máy tính</strong></td><td>ELEC SCIENCE AI (gói phần mềm <code>elec-science-ai</code>, phiên bản 1.0.0)</td></tr>
        <tr><td><strong>Tác giả &amp; Chủ sở hữu</strong></td><td>Nguyễn Thế Duy (Duy TK / Tk Media) — duyfamabo@gmail.com</td></tr>
        <tr><td><strong>Địa chỉ công bố trực tuyến</strong></td><td>https://www.elecai.id.vn/ (GitHub: https://github.com/DuyTKTB/Aitk)</td></tr>
        <tr><td><strong>Tổng quy mô mã nguồn sạch</strong></td><td>${sourceFiles.length} tệp nguồn (tương đương ${totalPages.toLocaleString('vi-VN')} trang A4, toàn bộ mã nguồn được lưu trong 02 đĩa CD kèm theo)</td></tr>
        <tr><td><strong>Quy cách bản in giấy A4</strong></td><td>Trích in <strong>${totalPrintedCodePages} trang A4</strong> gồm: 25 trang đầu, 25 trang giữa và 25 trang cuối (do mã nguồn &ge; 100 trang)</td></tr>
        <tr><td><strong>Mốc Git Commit HEAD</strong></td><td><code>${proofSummary.gitCommit}</code> (${proofSummary.gitCommitDate})</td></tr>
        <tr><td><strong>Master SHA-256 (OpenTimestamps)</strong></td><td><code>${proofSummary.manifestSha256}</code></td></tr>
      </table>
      <div class="cover-footer">
        <p><strong>Lưu ý khi in:</strong> Mở tệp này bằng Chrome/Edge &rarr; nhấn <code>Ctrl + P</code> &rarr; chọn khổ giấy <strong>A4</strong>, lề <strong>None / Default</strong>, bật <strong>Background graphics</strong> &rarr; in <strong>02 bản</strong> nộp Cục Bản quyền tác giả.</p>
      </div>
    </section>
  `);

  for (const seg of selectedSegments) {
    txtOut.push(`\n### ${seg.label} ###\n`);
    for (const pg of seg.pages) {
      printPageNum++;
      txtOut.push(`--- [Bản in trang ${printPageNum}/${totalPrintedCodePages} | Trang gốc ${pg.origPage}/${totalPages}] ---`);
      txtOut.push(pg.lines.join('\n'));
      txtOut.push('');

      htmlPages.push(`
        <section class="a4-page code-page">
          <header class="page-header">
            <span><strong>ELEC SCIENCE AI</strong> — Mã nguồn chương trình máy tính (Tác giả: Nguyễn Thế Duy)</span>
            <span>${escapeHtml(seg.label)}</span>
          </header>
          <pre class="code-block">${escapeHtml(pg.lines.join('\n'))}</pre>
          <footer class="page-footer">
            <span>© 2026 Nguyễn Thế Duy — All Rights Reserved · https://www.elecai.id.vn/</span>
            <span>Trang mã nguồn: <strong>${printPageNum} / ${totalPrintedCodePages}</strong> (Trang gốc ${pg.origPage}/${totalPages})</span>
          </footer>
        </section>
      `);
    }
  }

  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Bản in Mã nguồn A4 — ELEC SCIENCE AI (75 trang chuẩn NĐ 17/2023)</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #e5e7eb; font-family: "Times New Roman", serif; color: #111827; }
    .a4-page {
      width: 210mm;
      height: 297mm;
      margin: 8mm auto;
      padding: 12mm 14mm 12mm 16mm;
      background: #ffffff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    @media print {
      body { background: #ffffff; }
      .a4-page { margin: 0; box-shadow: none; }
    }
    .cover-page { justify-content: space-between; text-align: center; padding: 20mm 18mm; }
    .vn-title { font-size: 13pt; font-weight: bold; margin: 0; }
    .vn-sub { font-size: 13pt; font-weight: bold; margin: 4px 0 8px; text-decoration: underline; }
    .divider { width: 120px; height: 2px; background: #1e3a8a; margin: 8px auto 0; }
    .doc-badge { font-size: 10.5pt; font-weight: bold; color: #1e40af; letter-spacing: 0.4px; margin-bottom: 16px; }
    .cover-center h1 { font-size: 24pt; margin: 0 0 10px; color: #0f172a; line-height: 1.25; }
    .cover-center h2 { font-size: 20pt; margin: 0 0 10px; color: #1d4ed8; letter-spacing: 1px; }
    .subtitle { font-size: 12.5pt; color: #334155; max-width: 155mm; margin: 0 auto; }
    .meta-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 10.5pt; margin-top: 10px; }
    .meta-table td { border: 1px solid #94a3b8; padding: 7px 10px; vertical-align: top; word-break: break-word; }
    .meta-table td:first-child { width: 36%; background: #f8fafc; }
    .meta-table code { font-family: Consolas, "Courier New", monospace; font-size: 9pt; }
    .cover-footer { font-size: 10pt; color: #334155; background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 12px; text-align: left; border-radius: 4px; }
    .page-header {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 6px;
      color: #334155;
    }
    .code-block {
      flex: 1;
      margin: 0;
      font-family: Consolas, "Courier New", monospace;
      font-size: 7.7pt;
      line-height: 1.32;
      white-space: pre;
      overflow: hidden;
      color: #0f172a;
    }
    .page-footer {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      margin-top: 6px;
      color: #475569;
    }
  </style>
</head>
<body>
${htmlPages.join('\n')}
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, '03_BAN_IN_MA_NGUON_A4_75_TRANG.html'), html, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, '03_BAN_IN_MA_NGUON_A4_75_TRANG.txt'), txtOut.join('\n'), 'utf8');

  return {
    sourceFileCount: sourceFiles.length,
    totalA4Pages: totalPages,
    printedCodePages: totalPrintedCodePages,
  };
}

function buildUiScreenshotsPrintout(proofSummary) {
  const candidates = [
    {
      src: 'copyright-proofs/evidence/04_elecai_trang_chu.png',
      dest: 'ui_01_trang_chu.png',
      title: 'Hình 1: Giao diện Trang chủ & Trợ lý AI Khoa học Tự nhiên (https://www.elecai.id.vn/)',
      desc: 'Màn hình khởi đầu của nền tảng ELEC Science AI, tích hợp trợ lý AI giải bài tập Lý – Hóa – Sinh từng bước theo cơ chế Suy luận & Tra cứu công cụ tất định.',
    },
    {
      src: 'copyright-proofs/evidence/02_elecai_dieu_khoan_su_dung_ban_quyen.png',
      dest: 'ui_02_dieu_khoan_ban_quyen.png',
      title: 'Hình 2: Trang Điều khoản sử dụng & Tuyên bố Quyền sở hữu trí tuệ',
      desc: 'Xác nhận công khai trên website chính thức quyền sở hữu trí tuệ đối với thương hiệu, giao diện và mã nguồn ELEC Science AI thuộc về Nguyễn Thế Duy.',
    },
    {
      src: 'copyright-proofs/evidence/03_elecai_nha_sang_lap.png',
      dest: 'ui_03_nha_sang_lap.png',
      title: 'Hình 3: Trang định danh Nhà sáng lập & Kỹ sư phát triển chính',
      desc: 'Thông tin tác giả Nguyễn Thế Duy (Duy TK / Tk Media) công bố chính thức tại https://www.elecai.id.vn/nha-sang-lap.',
    },
    {
      src: 'so_do_kien_truc_tong_the_elec_ai.png',
      dest: 'ui_04_kien_truc_he_thong.png',
      title: 'Hình 4: Sơ đồ Kiến trúc tổng thể 4 tầng của phần mềm ELEC Science AI',
      desc: 'Mô tả kiến trúc phần mềm: Tầng giao diện PWA/React, Tầng AI Router & Công cụ Khoa học tất định, Tầng Khảo thí & Edge AI, và Tầng CSDL đám mây.',
    },
    {
      src: 'teacher-analytics-desktop.png',
      dest: 'ui_05_phan_he_giao_vien.png',
      title: 'Hình 5: Phân hệ Quản trị lớp học số & Phân tích học tập cho Giáo viên',
      desc: 'Bảng điều khiển theo dõi tiến độ học tập, thống kê điểm số, ma trận năng lực và tạo đề thi đa môn KHTN.',
    },
    {
      src: 'thiet_ke_khao_thi_online_proctoring.png',
      dest: 'ui_06_khao_thi_proctoring.png',
      title: 'Hình 6: Thiết kế Phân hệ Phòng thi trực tuyến an toàn & Giám sát Edge AI',
      desc: 'Phòng thi bấm giờ thực chuẩn cấu trúc Bộ GD&ĐT 2025, tích hợp nhận diện khuôn mặt Edge AI MediaPipe chống gian lận.',
    },
    {
      src: 'verify_roadmap_desktop.png',
      dest: 'ui_07_lo_trinh_hoc_tap.png',
      title: 'Hình 7: Phân hệ Lộ trình học tập cá nhân hóa theo điểm Elo & SRS',
      desc: 'Tự động xây dựng lộ trình ôn luyện theo năng lực người học và nhắc ôn câu sai bằng thuật toán lặp lại ngắt quãng SuperMemo SM-2.',
    },
    {
      src: 'verified_game_hub_fixed.png',
      dest: 'ui_08_trung_tam_tro_choi_khtn.png',
      title: 'Hình 8: Trung tâm Trò chơi KHTN & Gamification ôn luyện',
      desc: 'Hệ thống trò chơi tương tác và điều khiển cử chỉ qua camera giúp học sinh củng cố kiến thức Vật lí – Hóa học – Sinh học.',
    },
  ];

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  const included = [];

  for (const item of candidates) {
    const absSrc = path.join(ROOT, item.src);
    if (fs.existsSync(absSrc)) {
      fs.copyFileSync(absSrc, path.join(ASSETS_DIR, item.dest));
      included.push(item);
    }
  }

  // Pair 2 screenshots per A4 page
  const pagesHtml = [];
  for (let i = 0; i < included.length; i += 2) {
    const pair = included.slice(i, i + 2);
    const pageNo = Math.floor(i / 2) + 1;
    const totalUiPages = Math.ceil(included.length / 2);
    pagesHtml.push(`
      <section class="a4-page">
        <header class="page-header">
          <span><strong>ELEC SCIENCE AI</strong> — Bản in Giao diện chính (Hồ sơ đăng ký Quyền tác giả)</span>
          <span>Trang giao diện ${pageNo} / ${totalUiPages}</span>
        </header>
        <div class="figures">
          ${pair
            .map(
              (fig) => `
            <figure class="fig-card">
              <div class="img-wrap"><img src="assets/${fig.dest}" alt="${escapeHtml(fig.title)}" /></div>
              <figcaption>
                <strong>${escapeHtml(fig.title)}</strong><br/>
                <span>${escapeHtml(fig.desc)}</span>
              </figcaption>
            </figure>`
            )
            .join('\n')}
        </div>
        <footer class="page-footer">
          <span>Tác giả: Nguyễn Thế Duy — Website: https://www.elecai.id.vn/</span>
          <span>SHA-256 Manifest: ${proofSummary.manifestSha256.slice(0, 16)}...</span>
        </footer>
      </section>
    `);
  }

  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Bản in Giao diện chính A4 — ELEC SCIENCE AI</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e5e7eb; font-family: "Times New Roman", serif; color: #0f172a; }
    .a4-page {
      width: 210mm;
      height: 297mm;
      margin: 8mm auto;
      padding: 12mm 14mm;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
    }
    @media print {
      body { background: #fff; }
      .a4-page { margin: 0; box-shadow: none; }
    }
    .page-header, .page-footer {
      display: flex; justify-content: space-between; font-size: 9.5pt; color: #334155;
    }
    .page-header { border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 8px; }
    .page-footer { border-top: 1px solid #cbd5e1; padding-top: 5px; margin-top: 8px; }
    .figures { flex: 1; display: flex; flex-direction: column; gap: 10mm; justify-content: center; }
    .fig-card { margin: 0; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; }
    .img-wrap { height: 96mm; display: flex; align-items: center; justify-content: center; background: #0f172a; border-radius: 4px; overflow: hidden; }
    .img-wrap img { max-width: 100%; max-height: 100%; object-fit: contain; }
    figcaption { margin-top: 6px; font-size: 10pt; line-height: 1.35; }
    figcaption span { color: #334155; }
  </style>
</head>
<body>
${pagesHtml.join('\n')}
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, '04_BAN_IN_GIAO_DIEN_CHINH_A4.html'), html, 'utf8');
  return included.length;
}

function buildCdLabelHtml(proofSummary) {
  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Mẫu Nhãn Dán Mặt Đĩa CD — ELEC SCIENCE AI (02 bản)</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: "Times New Roman", serif; margin: 0; padding: 20px; background: #f1f5f9; }
    @media print { body { background: #fff; padding: 0; } .note { display: none; } }
    .note { max-width: 170mm; margin: 0 auto 16px; background: #eff6ff; border: 1px solid #93c5fd; padding: 10px 14px; font-size: 11pt; }
    .sheet { display: flex; flex-direction: column; align-items: center; gap: 18mm; }
    .cd-circle {
      width: 118mm;
      height: 118mm;
      border-radius: 50%;
      border: 1.5px dashed #475569;
      background: #ffffff;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 14mm 16mm;
      text-align: center;
      box-sizing: border-box;
    }
    .cd-hole {
      width: 24mm;
      height: 24mm;
      border-radius: 50%;
      border: 1px dashed #94a3b8;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .top h2 { margin: 0; font-size: 14pt; color: #0f172a; }
    .top p { margin: 3px 0 0; font-size: 10pt; color: #1e40af; font-weight: bold; }
    .bottom { font-size: 9.5pt; line-height: 1.35; color: #1e293b; }
    .hash { font-family: Consolas, monospace; font-size: 7.5pt; color: #475569; }
  </style>
</head>
<body>
  <div class="note">
    <strong>Hướng dẫn:</strong> In trang này trên giấy trắng (hoặc giấy decal trắng), cắt theo vòng tròn và dán lên mặt của <strong>02 đĩa CD</strong> chứa mã nguồn sạch theo đúng quy định Khoản 9 Điều 43 Nghị định 17/2023/NĐ-CP.
  </div>
  <div class="sheet">
    ${[1, 2]
      .map(
        (n) => `
      <div class="cd-circle">
        <div class="top">
          <h2>ELEC SCIENCE AI</h2>
          <p>CHƯƠNG TRÌNH MÁY TÍNH (BẢN ĐĨA CD SỐ 0${n}/02)</p>
        </div>
        <div class="cd-hole"></div>
        <div class="bottom">
          <strong>Tác giả &amp; Chủ sở hữu:</strong> Nguyễn Thế Duy<br/>
          <strong>Phiên bản:</strong> 1.0.0 · <strong>Website:</strong> https://www.elecai.id.vn/<br/>
          <strong>Nội dung:</strong> Toàn bộ mã nguồn sạch, giao diện &amp; mô tả<br/>
          <span class="hash">SHA-256: ${proofSummary.manifestSha256.slice(0, 32)}...</span>
        </div>
      </div>`
      )
      .join('\n')}
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT_DIR, '06_NHAN_DAN_MAT_DIA_CD.html'), html, 'utf8');
}

async function buildForm03Docx(sourceStats, proofSummary) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 }, // ~2cm top/right/bottom, 2.5cm left
          },
        },
        children: [
          ...makeVietnamHeader(
            [
              { text: 'TỜ KHAI ĐĂNG KÝ QUYỀN TÁC GIẢ', size: 30, bold: true },
              { text: 'ĐỐI VỚI: CHƯƠNG TRÌNH MÁY TÍNH', size: 28, bold: true },
              { text: '(Kèm theo Thông tư số 08/2023/TT-BVHTTDL của Bộ Văn hóa, Thể thao và Du lịch)', size: 22, bold: false, italics: true },
            ],
            'Mẫu số 03 — Phụ lục I (TT 08/2023/TT-BVHTTDL)'
          ),

          p([tr('Mã hồ sơ trực tuyến (ghi sau khi khai trên dichvucong.bvhttdl.gov.vn): ', { italics: true, size: 24 }), makePlaceholder('GHI MÃ HỒ SƠ ONLINE')], {
            align: AlignmentType.RIGHT,
            spaceAfter: 120,
          }),

          p([tr('Kính gửi: ', { bold: true }), tr('Cục Bản quyền tác giả (Bộ Văn hóa, Thể thao và Du lịch)')], {
            align: AlignmentType.CENTER,
            spaceAfter: 140,
          }),

          p('Tư cách nộp đơn (tích chọn ô tương ứng):', { bold: true, spaceAfter: 60 }),
          p('☑ Tác giả đồng thời là chủ sở hữu quyền tác giả', { indentLeft: 360, spaceAfter: 40 }),
          p('☐ Đồng tác giả đồng thời là đồng chủ sở hữu quyền tác giả (chọn ô này nếu nộp cùng đồng tác giả)', { indentLeft: 360, spaceAfter: 40, italics: true, size: 24 }),
          p('☐ Chủ sở hữu quyền tác giả   ☐ Đại diện được ủy quyền', { indentLeft: 360, spaceAfter: 140, size: 24 }),

          p('1. THÔNG TIN VỀ CHƯƠNG TRÌNH MÁY TÍNH', { bold: true, size: 27, spaceBefore: 120, spaceAfter: 80 }),
          makeSimpleTable(
            [
              ['Tên chương trình máy tính', 'ELEC SCIENCE AI (Nền tảng học tập, trợ lý AI và khảo thí trực tuyến Khoa học Tự nhiên — gói phần mềm: elec-science-ai, phiên bản 1.0.0)'],
              ['Ngày, tháng, năm hoàn thành', 'Ngày 26 tháng 11 năm 2026 (khởi tạo dự án từ 01/06/2026; phát hành thử nghiệm ngày 30/09/2026)'],
              [
                'Tình trạng công bố tác phẩm',
                [
                  tr('☑ Đã công bố   ☐ Chưa công bố\n', { bold: true, size: 24 }),
                  tr('• Ngày công bố lần đầu: 30/09/2026\n', { size: 24 }),
                  tr('• Hình thức công bố: Đăng tải, cung cấp trực tuyến trên mạng Internet (Progressive Web Application)\n', { size: 24 }),
                  tr('• Nơi công bố: Việt Nam — Website chính thức: https://www.elecai.id.vn/ (và https://aitk-ten.vercel.app/)', { size: 24 }),
                ],
              ],
              [
                'Tóm tắt chức năng, thành phần, cấu tạo của chương trình',
                'Chương trình máy tính ELEC Science AI là nền tảng phần mềm web đa nền tảng hỗ trợ tự học, luyện thi và khảo thí trực tuyến 3 môn Khoa học Tự nhiên (Vật lí, Hóa học, Sinh học) theo chương trình GDPT 2018. Hệ thống gồm kiến trúc 4 tầng và các phân hệ chính: (1) Trợ lý AI KHTN lai công cụ tính toán tất định chống ảo giác số liệu; (2) Lõi cân bằng phương trình hóa học chính xác dùng phân số nguyên lớn BigInt & công cụ giải bài Lý–Hóa–Sinh; (3) Bảng tuần hoàn 118 nguyên tố IUPAC & cơ sở tri thức tìm kiếm BM25; (4) Phòng thi trực tuyến bấm giờ thực tích hợp giám sát Edge AI MediaPipe; (5) Thị giác máy tính chấm phiếu trắc nghiệm giấy A4 (OMR) thuần Canvas; (6) Quản lý lớp học số đa môn, Studio sinh đề ma trận 4 mức độ & phân tích học tập; (7) Phòng thí nghiệm ảo 3D, lộ trình Elo, sổ câu sai SRS (SuperMemo SM-2), trò chơi KHTN và tối ưu danh mục nguyện vọng tuyển sinh.',
              ],
              ['Ngôn ngữ lập trình sử dụng', 'JavaScript (ES6+ / React JSX), HTML5, CSS3, SQL (PostgreSQL / Supabase), Firebase Security Rules.'],
              [
                'Sử dụng mã nguồn mở',
                '☑ Có   ☐ Không\nGhi chú: Chương trình sử dụng các thư viện/framework mã nguồn mở phổ biến (React 18, Vite 5, Three.js, KaTeX, MediaPipe, Tesseract.js...) làm nền tảng kỹ thuật; toàn bộ mã nguồn ứng dụng, kiến trúc hệ thống, thuật toán lõi và giao diện (' +
                  sourceStats.sourceFileCount +
                  ' tệp mã nguồn sạch) do tác giả tự nghiên cứu, thiết kế và lập trình.',
              ],
              [
                'Mã băm đối chiếu toàn vẹn (SHA-256)',
                `Master SHA-256: ${proofSummary.manifestSha256} (đã đóng dấu thời gian OpenTimestamps ngày 26/11/2026; Git HEAD: ${proofSummary.gitCommit})`,
              ],
            ],
            [32, 68]
          ),

          p('2. THÔNG TIN VỀ TÁC GIẢ', { bold: true, size: 27, spaceBefore: 160, spaceAfter: 80 }),
          makeSimpleTable(
            [
              ['Họ và tên tác giả', 'Nguyễn Thế Duy'],
              ['Bút danh (nếu có)', 'Duy TK / Tk Media'],
              ['Ngày, tháng, năm sinh', [makePlaceholder('ĐIỀN NGÀY/THÁNG/NĂM SINH — VD: ../../2010')]],
              ['Giới tính / Quốc tịch', 'Nam — Quốc tịch: Việt Nam'],
              [
                'Số CCCD / Số định danh cá nhân',
                [
                  tr('Số: ', { size: 24 }),
                  makePlaceholder('ĐIỀN 12 SỐ CCCD'),
                  tr(' — Ngày cấp: ', { size: 24 }),
                  makePlaceholder('ĐIỀN NGÀY CẤP'),
                  tr(' — Nơi cấp: ', { size: 24 }),
                  makePlaceholder('Cục CSQLHC về TTXH / Bộ Công an'),
                ],
              ],
              ['Địa chỉ thường trú', [makePlaceholder('ĐIỀN ĐỊA CHỈ THƯỜNG TRÚ THEO CCCD')]],
              ['Địa chỉ liên hệ', [makePlaceholder('ĐIỀN ĐỊA CHỈ NHẬN BƯU PHẨM / GIẤY CHỨNG NHẬN')]],
              ['Số điện thoại & Email', [tr('ĐT: ', { size: 24 }), makePlaceholder('ĐIỀN SỐ ĐIỆN THOẠI'), tr(' — Email: duyfamabo@gmail.com', { size: 24 })]],
              ['Vai trò sáng tạo', 'Tác giả trực tiếp thiết kế kiến trúc hệ thống, lập trình toàn bộ mã nguồn, thuật toán và giao diện chương trình máy tính ELEC Science AI.'],
            ],
            [32, 68]
          ),

          p([
            tr('Lưu ý đối với tác giả dưới 18 tuổi (nếu sinh năm 2010): ', { bold: true, italics: true, size: 23 }),
            tr('Theo Điều 21 Bộ luật Dân sự 2015, người từ đủ 15 tuổi đến chưa đủ 18 tuổi có quyền tự mình xác lập, thực hiện giao dịch dân sự. Tuy nhiên, nếu cán bộ tiếp nhận yêu cầu xác nhận của người đại diện theo pháp luật (cha/mẹ), bổ sung bản sao CCCD của cha/mẹ và mục xác nhận người đại diện bên dưới.', { italics: true, size: 23 }),
          ], { spaceBefore: 80, spaceAfter: 100 }),

          p('3. THÔNG TIN VỀ CHỦ SỞ HỮU QUYỀN TÁC GIẢ', { bold: true, size: 27, spaceBefore: 100, spaceAfter: 60 }),
          p('Chủ sở hữu quyền tác giả đồng thời là Tác giả tại Mục 2 (Nguyễn Thế Duy).', { spaceAfter: 100 }),
          p('(Trường hợp đăng ký đồng tác giả với Nguyễn Bùi Nguyệt Minh, bổ sung thông tin đồng tác giả tại Mục 2 & 3 và nộp kèm Văn bản đồng ý của các đồng tác giả tại Mẫu 02C).', { italics: true, size: 23, spaceAfter: 120 }),

          p('4. CAM ĐOAN CỦA NGƯỜI NỘP ĐƠN', { bold: true, size: 27, spaceBefore: 100, spaceAfter: 60 }),
          p('Tôi xin cam đoan những thông tin kê khai trong Tờ khai này là đúng sự thật. Chương trình máy tính "ELEC SCIENCE AI" do tôi trực tiếp sáng tạo bằng lao động trí tuệ của mình, không sao chép bất hợp pháp tác phẩm của bất kỳ cá nhân, tổ chức nào khác; nội dung không vi phạm quy định pháp luật về chủ quyền quốc gia, an ninh, quốc phòng và thuần phong mỹ tục Việt Nam. Tôi xin hoàn toàn chịu trách nhiệm trước pháp luật về lời cam đoan này.', { align: AlignmentType.JUSTIFIED, spaceAfter: 120 }),

          p('5. DANH MỤC TÀI LIỆU GỬI KÈM THEO TỜ KHAI', { bold: true, size: 27, spaceBefore: 80, spaceAfter: 60 }),
          p('1. 02 bản in giấy A4 giao diện chính và mã nguồn chương trình máy tính (25 trang đầu, 25 trang giữa, 25 trang cuối — tổng 75 trang mã nguồn theo Khoản 9 Điều 43 NĐ 17/2023/NĐ-CP);', { indentLeft: 240, spaceAfter: 40, size: 24 }),
          p('2. 02 đĩa CD chứa toàn bộ mã nguồn sạch, giao diện và bản mô tả chương trình (dán giấy trắng ghi rõ tên chương trình máy tính ELEC SCIENCE AI trên mặt đĩa);', { indentLeft: 240, spaceAfter: 40, size: 24 }),
          p('3. 01 Giấy cam đoan của tác giả và Bản mô tả tính năng chương trình máy tính;', { indentLeft: 240, spaceAfter: 40, size: 24 }),
          p('4. 01 Bản sao Căn cước công dân (CCCD) của tác giả/chủ sở hữu;', { indentLeft: 240, spaceAfter: 40, size: 24 }),
          p('5. Chứng từ nộp lệ phí đăng ký quyền tác giả (600.000 VNĐ theo quy định hiện hành) và Văn bản đồng ý của đồng tác giả (nếu đăng ký đồng sở hữu).', { indentLeft: 240, spaceAfter: 160, size: 24 }),

          p([makePlaceholder('ĐỊA DANH — VD: Hưng Yên / Thái Bình'), tr(', ngày ..... tháng ..... năm 2026', { italics: true, size: 25 })], {
            align: AlignmentType.RIGHT,
            spaceBefore: 120,
            spaceAfter: 40,
          }),
          p('TÁC GIẢ ĐỒNG THỜI LÀ CHỦ SỞ HỮU QUYỀN TÁC GIẢ', {
            bold: true,
            align: AlignmentType.RIGHT,
            spaceAfter: 20,
            size: 25,
          }),
          p('(Ký và ghi rõ họ tên — lưu ý ký nháy vào góc dưới mỗi trang tờ khai)', {
            italics: true,
            align: AlignmentType.RIGHT,
            size: 22,
            spaceAfter: 700,
          }),
          p('Nguyễn Thế Duy', {
            bold: true,
            align: AlignmentType.RIGHT,
            size: 26,
          }),
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT_DIR, '01_TO_KHAI_MAU_03_TT08_2023_ELEC_AI.docx'), buf);
}

async function buildCamDoanAndDescriptionDocx(sourceStats, proofSummary) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        children: [
          // PART A: GIẤY CAM ĐOAN CỦA TÁC GIẢ
          ...makeVietnamHeader(
            [
              { text: 'GIẤY CAM ĐOAN CỦA TÁC GIẢ', size: 30, bold: true },
              { text: '(Về việc sáng tạo độc lập chương trình máy tính ELEC SCIENCE AI)', size: 24, bold: false, italics: true },
            ],
            'Tài liệu đính kèm Hồ sơ đăng ký Quyền tác giả'
          ),
          p([tr('Kính gửi: ', { bold: true }), tr('Cục Bản quyền tác giả — Bộ Văn hóa, Thể thao và Du lịch')], {
            align: AlignmentType.CENTER,
            spaceAfter: 140,
          }),
          p([tr('Tôi tên là: ', { bold: true }), tr('Nguyễn Thế Duy (Bút danh: Duy TK / Tk Media)')]),
          p([tr('Ngày sinh: ', { bold: true }), makePlaceholder('ĐIỀN NGÀY/THÁNG/NĂM SINH'), tr('   —   Quốc tịch: Việt Nam')]),
          p([tr('Số CCCD: ', { bold: true }), makePlaceholder('ĐIỀN 12 SỐ CCCD'), tr(' — Ngày cấp: '), makePlaceholder('ĐIỀN NGÀY CẤP'), tr(' — Nơi cấp: '), makePlaceholder('ĐIỀN NƠI CẤP')]),
          p([tr('Địa chỉ thường trú: ', { bold: true }), makePlaceholder('ĐIỀN ĐỊA CHỈ THƯỜNG TRÚ')]),
          p([tr('Số điện thoại: ', { bold: true }), makePlaceholder('ĐIỀN SĐT'), tr(' — Email: duyfamabo@gmail.com')]),

          p('Bằng văn bản này, tôi xin cam đoan trước Cục Bản quyền tác giả và pháp luật như sau:', { bold: true, spaceBefore: 120, spaceAfter: 80 }),
          p('1. Tôi là tác giả trực tiếp sáng tạo và đồng thời là chủ sở hữu hợp pháp đối với chương trình máy tính mang tên "ELEC SCIENCE AI" (gói phần mềm elec-science-ai v1.0.0, công bố tại https://www.elecai.id.vn/).', { align: AlignmentType.JUSTIFIED }),
          p('2. Chương trình máy tính này được sáng tạo bằng công sức, thời gian, trí tuệ và tài chính cá nhân của tôi; không phải là sản phẩm thực hiện theo nhiệm vụ được giao bởi cơ quan, doanh nghiệp hay hợp đồng thuê viết phần mềm với bất kỳ bên thứ ba nào.', { align: AlignmentType.JUSTIFIED }),
          p('3. Toàn bộ mã nguồn ứng dụng, kiến trúc hệ thống, thuật toán xử lý và giao diện của chương trình là sản phẩm sáng tạo nguyên gốc, không sao chép bất hợp pháp từ chương trình máy tính của cá nhân hay tổ chức khác. Các thư viện mã nguồn mở của bên thứ ba được sử dụng tuân thủ đúng giấy phép gốc tương ứng.', { align: AlignmentType.JUSTIFIED }),
          p(`4. Tính toàn vẹn của toàn bộ mã nguồn đăng ký được xác thực bằng danh sách mã băm SHA-256 (Master SHA-256: ${proofSummary.manifestSha256}, đã đóng dấu thời gian Blockchain OpenTimestamps ngày 26/11/2026) và lịch sử quản lý phiên bản Git (204 commits, HEAD: ${proofSummary.gitCommit}).`, { align: AlignmentType.JUSTIFIED }),
          p('5. Tôi cam kết chịu hoàn toàn trách nhiệm trước pháp luật nếu có bất kỳ tranh chấp hoặc khai báo sai sự thật nào liên quan đến quyền tác giả của chương trình nêu trên.', { align: AlignmentType.JUSTIFIED, spaceAfter: 160 }),

          p([makePlaceholder('ĐỊA DANH'), tr(', ngày ..... tháng ..... năm 2026', { italics: true })], { align: AlignmentType.RIGHT }),
          p('NGƯỜI CAM ĐOAN', { bold: true, align: AlignmentType.RIGHT, spaceAfter: 20 }),
          p('(Ký và ghi rõ họ tên)', { italics: true, align: AlignmentType.RIGHT, size: 22, spaceAfter: 600 }),
          p('Nguyễn Thế Duy', { bold: true, align: AlignmentType.RIGHT }),

          // PART B: BẢN MÔ TẢ CHƯƠNG TRÌNH MÁY TÍNH
          new Paragraph({ children: [new PageBreak()] }),
          p('BẢN MÔ TẢ CHƯƠNG TRÌNH MÁY TÍNH', { bold: true, size: 30, align: AlignmentType.CENTER, spaceAfter: 40 }),
          p('ELEC SCIENCE AI (Phiên bản 1.0.0)', { bold: true, size: 26, align: AlignmentType.CENTER, spaceAfter: 160 }),

          p('I. TỔNG QUAN CHƯƠNG TRÌNH', { bold: true, size: 26, spaceBefore: 100 }),
          p('ELEC Science AI là nền tảng phần mềm web tiến trình (Progressive Web Application — PWA) chuyên sâu về học tập, trợ lý AI và khảo thí trực tuyến 3 môn Khoa học Tự nhiên (Vật lí, Hóa học, Sinh học) dành cho học sinh và giáo viên THCS, THPT theo Chương trình Giáo dục phổ thông 2018.', { align: AlignmentType.JUSTIFIED }),

          p('II. KIẾN TRÚC KỸ THUẬT & THÔNG SỐ MÃ NGUỒN', { bold: true, size: 26, spaceBefore: 120 }),
          makeSimpleTable(
            [
              { _header: true, cells: ['Thành phần kỹ thuật', 'Chi tiết triển khai'] },
              ['Mô hình kiến trúc', 'Kiến trúc 4 tầng: (1) Giao diện Client React/Vite PWA; (2) Động cơ định tuyến AI lai & Lõi tính toán khoa học tất định; (3) Phân hệ Khảo thí trực tuyến, Thị giác máy tính OMR & Giám sát Edge AI; (4) Tầng dịch vụ Serverless API & CSDL đám mây (Firebase Firestore / Supabase PostgreSQL).'],
              ['Ngôn ngữ lập trình', 'JavaScript (ES6+ / React JSX), HTML5, CSS3, SQL (PostgreSQL), Firebase Rules.'],
              ['Quy mô mã nguồn chính chủ', `${sourceStats.sourceFileCount} tệp mã nguồn sạch (tương đương ~${sourceStats.totalA4Pages.toLocaleString('vi-VN')} trang in A4) cùng 86 tệp kiểm thử tự động (Vitest).`],
              ['Môi trường vận hành', 'Trình duyệt web hiện đại (Chrome, Edge, Safari, Firefox) trên máy tính và thiết bị di động (hỗ trợ cài đặt PWA).'],
            ],
            [32, 68]
          ),

          p('III. CÁC PHÂN HỆ CHỨC NĂNG & THUẬT TOÁN CỐT LÕI TỰ PHÁT TRIỂN', { bold: true, size: 26, spaceBefore: 140 }),
          p('1. Trợ lý AI Khoa học Tự nhiên lai công cụ tất định (src/lib/ai.js, src/lib/aiRouter.js, src/lib/aiPrompts.js): Tự động phân loại bài toán, định tuyến đa nhà cung cấp mô hình, ép tính toán qua công cụ khoa học nội bộ và hậu kiểm kết quả nhằm loại bỏ sai số học thuật.', { align: AlignmentType.JUSTIFIED, size: 24 }),
          p('2. Lõi tính toán khoa học tất định Lý – Hóa – Sinh (src/lib/chemBalance.js, src/lib/scientificTools.js): Tự triển khai giải thuật khử Gauss-Jordan trên phân số nguyên lớn BigInt để cân bằng phương trình hóa học không sai số dấu phẩy động, tính toán mol/pH/nồng độ, dao động điều hòa, mạch RLC, di truyền Menđen và Hardy-Weinberg.', { align: AlignmentType.JUSTIFIED, size: 24 }),
          p('3. Động cơ chấm phiếu trắc nghiệm A4 OMR thuần trình duyệt (src/lib/omr.js, src/lib/omrSheetGenerator.js): Sử dụng Canvas API, phép biến đổi Homography (DLT) và thuật toán lọc kênh màu đỏ để quét, chấm phiếu trả lời mẫu Bộ GD&ĐT 2025 ngay trên điện thoại không cần máy chủ xử lý ảnh.', { align: AlignmentType.JUSTIFIED, size: 24 }),
          p('4. Hệ thống Lớp học số & Studio tạo đề thi ma trận (src/lib/classroom.js, src/lib/matrixAiService.js, src/lib/examParser.js): Bóc tách đề Word/PDF hai lớp, sinh đề theo ma trận 4 mức độ nhận thức, trộn mã đề, giao bài và phân tích năng lực học sinh cho giáo viên.', { align: AlignmentType.JUSTIFIED, size: 24 }),
          p('5. Phòng thi trực tuyến an toàn Edge AI & Phòng thí nghiệm 3D (src/components/, src/features/lab3d/): Giám sát thi trực tiếp trên thiết bị người dùng (phát hiện chuyển tab, mất mặt/quay mặt), phòng thí nghiệm ảo 3D mô phỏng thí nghiệm KHTN.', { align: AlignmentType.JUSTIFIED, size: 24 }),
          p('6. Cá nhân hóa học tập & Tư vấn tuyển sinh (src/lib/srs.js, src/lib/autoRoadmapEngine.js, src/lib/aspirationPortfolioOptimizer.js): Sổ tay câu sai lặp lại ngắt quãng SuperMemo SM-2, biểu đồ năng lực 6 chiều, lộ trình Elo và tối ưu danh mục nguyện vọng đại học 3 tầng.', { align: AlignmentType.JUSTIFIED, size: 24 }),

          // PART C: MẪU VĂN BẢN ĐỒNG Ý CỦA ĐỒNG TÁC GIẢ (TÙY CHỌN)
          new Paragraph({ children: [new PageBreak()] }),
          ...makeVietnamHeader(
            [
              { text: 'VĂN BẢN ĐỒNG Ý CỦA CÁC ĐỒNG TÁC GIẢ', size: 28, bold: true },
              { text: '(CHỈ SỬ DỤNG TRONG TRƯỜNG HỢP ĐĂNG KÝ ĐỒNG TÁC GIẢ / ĐỒNG CHỦ SỞ HỮU — BỎ QUA NẾU ĐĂNG KÝ 01 TÁC GIẢ)', size: 21, bold: true, italics: true },
            ],
            'Mẫu tùy chọn (02C)'
          ),
          p('Chúng tôi gồm các đồng tác giả dưới đây:', { spaceBefore: 100 }),
          p([tr('1. Ông/Bà: Nguyễn Thế Duy — Số CCCD: ', { bold: true }), makePlaceholder('ĐIỀN SỐ CCCD'), tr(' — Vai trò: Trưởng nhóm, thiết kế kiến trúc & lập trình chính.')]),
          p([tr('2. Ông/Bà: ', { bold: true }), makePlaceholder('Nguyễn Bùi Nguyệt Minh (hoặc tên đồng tác giả)'), tr(' — Số CCCD: '), makePlaceholder('ĐIỀN SỐ CCCD'), tr(' — Vai trò: Nội dung chuyên môn KHTN, khảo sát & thực nghiệm.')]),
          p('Cùng xác nhận và đồng ý tiến hành đăng ký Giấy chứng nhận quyền tác giả tại Cục Bản quyền tác giả đối với chương trình máy tính "ELEC SCIENCE AI" với tư cách đồng tác giả và cử ông Nguyễn Thế Duy là người đại diện thực hiện thủ tục nộp hồ sơ, nhận kết quả đăng ký quyền tác giả.', { align: AlignmentType.JUSTIFIED, spaceBefore: 100, spaceAfter: 160 }),
          p([makePlaceholder('ĐỊA DANH'), tr(', ngày ..... tháng ..... năm 2026', { italics: true })], { align: AlignmentType.RIGHT, spaceAfter: 120 }),
          makeSimpleTable(
            [
              ['ĐỒNG TÁC GIẢ THỨ NHẤT\n(Ký, ghi rõ họ tên)\n\n\n\nNguyễn Thế Duy', 'ĐỒNG TÁC GIẢ THỨ HAI\n(Ký, ghi rõ họ tên)\n\n\n\n[Ghi rõ họ tên]'],
            ],
            [50, 50]
          ),
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT_DIR, '02_GIAY_CAM_DOAN_MO_TA_VA_DONG_TAC_GIA.docx'), buf);
}

async function buildCleanCdPackage(sourceFiles) {
  fs.rmSync(CD_DIR, { recursive: true, force: true });
  fs.mkdirSync(CD_DIR, { recursive: true });

  const zip = new JSZip();

  // Include all clean tracked source + public + tests + configs + legal files
  const gitFiles = runGit('git ls-files -z')
    .split('\0')
    .map((s) => s.replace(/\\/g, '/').trim())
    .filter(Boolean);

  const cdIncludeDirs = ['src/', 'api/', 'functions/', 'public/', 'tests/', 'supabase/'];
  const cdIncludeRoot = new Set([
    'LICENSE',
    'COPYRIGHT.md',
    'README.md',
    'index.html',
    'package.json',
    'vite.config.js',
    'vitest.config.js',
    'vercel.json',
    'firebase.json',
    '.firebaserc',
  ]);

  const filesToPack = new Set();
  for (const rel of gitFiles) {
    if (SECRET_RE.test(rel) || rel.includes('node_modules/')) continue;
    if (cdIncludeDirs.some((d) => rel.startsWith(d)) || cdIncludeRoot.has(rel)) {
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
        filesToPack.add(rel);
      }
    }
  }
  for (const rootFile of cdIncludeRoot) {
    const abs = path.join(ROOT, rootFile);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      filesToPack.add(rootFile);
    }
  }

  let packedCount = 0;
  for (const rel of Array.from(filesToPack).sort()) {
    const abs = path.join(ROOT, rel);
    const dest = path.join(CD_DIR, 'MA_NGUON_SACH', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    zip.file(`MA_NGUON_SACH/${rel}`, fs.readFileSync(abs));
    packedCount++;
  }

  // Add copyright proofs + dossier descriptions + UI screenshots inside CD
  const extraCdItems = [
    ['copyright-proofs/MANIFEST-SHA256.txt', 'CHUNG_THUC_MAT_MA/MANIFEST-SHA256.txt'],
    ['copyright-proofs/MANIFEST-SHA256.txt.ots', 'CHUNG_THUC_MAT_MA/MANIFEST-SHA256.txt.ots'],
    ['copyright-proofs/COPYRIGHT-PROOF-SUMMARY.txt', 'CHUNG_THUC_MAT_MA/COPYRIGHT-PROOF-SUMMARY.txt'],
    ['ho-so-ban-quyen-cuc-bq/02_GIAY_CAM_DOAN_MO_TA_VA_DONG_TAC_GIA.docx', 'MO_TA_VA_GIAO_DIEN/02_GIAY_CAM_DOAN_MO_TA_VA_DONG_TAC_GIA.docx'],
    ['ho-so-ban-quyen-cuc-bq/04_BAN_IN_GIAO_DIEN_CHINH_A4.html', 'MO_TA_VA_GIAO_DIEN/04_BAN_IN_GIAO_DIEN_CHINH_A4.html'],
  ];

  for (const [srcRel, cdRel] of extraCdItems) {
    const abs = path.join(ROOT, srcRel);
    if (fs.existsSync(abs)) {
      const dest = path.join(CD_DIR, cdRel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(abs, dest);
      zip.file(cdRel, fs.readFileSync(abs));
      packedCount++;
    }
  }

  // Copy UI assets into CD/MO_TA_VA_GIAO_DIEN/assets
  if (fs.existsSync(ASSETS_DIR)) {
    for (const f of fs.readdirSync(ASSETS_DIR)) {
      const abs = path.join(ASSETS_DIR, f);
      const dest = path.join(CD_DIR, 'MO_TA_VA_GIAO_DIEN', 'assets', f);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(abs, dest);
      zip.file(`MO_TA_VA_GIAO_DIEN/assets/${f}`, fs.readFileSync(abs));
      packedCount++;
    }
  }

  const zipBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const zipPath = path.join(OUT_DIR, '05_GOI_GHI_DIA_CD_ELEC_SCIENCE_AI.zip');
  fs.writeFileSync(zipPath, zipBuf);

  const zipSha256 = crypto.createHash('sha256').update(zipBuf).digest('hex');
  return { packedCount, zipSize: zipBuf.length, zipSha256 };
}

function buildChecklistGuide(sourceStats, uiCount, cdStats, proofSummary) {
  const md = `# HƯỚNG DẪN NỘP HỒ SƠ ĐĂNG KÝ QUYỀN TÁC GIẢ CHƯƠNG TRÌNH MÁY TÍNH
**Tác phẩm:** ELEC SCIENCE AI (\`elec-science-ai\` v1.0.0)  
**Cơ quan cấp Giấy chứng nhận:** Cục Bản quyền tác giả — Bộ Văn hóa, Thể thao và Du lịch  
**Căn cứ pháp lý:** Luật Sở hữu trí tuệ sửa đổi 2022 · Nghị định 17/2023/NĐ-CP (Khoản 9 Điều 43) · Thông tư 08/2023/TT-BVHTTDL (Mẫu số 03)

---

## 1. Thành phần hồ sơ đã chuẩn bị sẵn trong thư mục \`ho-so-ban-quyen-cuc-bq/\`

| STT | Tệp tin | Vai trò pháp lý | Việc bạn cần làm |
| :---: | :--- | :--- | :--- |
| **1** | \`01_TO_KHAI_MAU_03_TT08_2023_ELEC_AI.docx\` | **Tờ khai Mẫu số 03** (TT 08/2023/TT-BVHTTDL) | Mở Word, điền các ô tô vàng (ngày sinh, số CCCD, địa chỉ, SĐT), in **01 bản gốc**, **ký nháy từng trang** và ký rõ họ tên trang cuối. |
| **2** | \`02_GIAY_CAM_DOAN_MO_TA_VA_DONG_TAC_GIA.docx\` | **Giấy cam đoan tác giả** + **Bản mô tả phần mềm** (+ Mẫu đồng tác giả tùy chọn) | Điền thông tin cá nhân, in **01 bản** (xóa trang Mẫu 02C nếu đăng ký 1 tác giả; giữ và nhờ đồng tác giả ký nếu đăng ký chung). |
| **3** | \`03_BAN_IN_MA_NGUON_A4_75_TRANG.html\` | **Bản in mã nguồn A4 chuẩn luật** (25 trang đầu + 25 trang giữa + 25 trang cuối = **${sourceStats.printedCodePages} trang** từ tổng ${sourceStats.totalA4Pages.toLocaleString('vi-VN')} trang / ${sourceStats.sourceFileCount} tệp sạch) | Mở bằng Chrome/Edge → \`Ctrl + P\` → chọn khổ giấy **A4**, bật *Background graphics* → **in 02 bản** (hoặc lưu PDF để nộp online + in 2 bản giấy). |
| **4** | \`04_BAN_IN_GIAO_DIEN_CHINH_A4.html\` | **Bản in Giao diện chính A4** (${uiCount} màn hình chức năng & sơ đồ kiến trúc) | Mở bằng Chrome/Edge → \`Ctrl + P\` → **in 02 bản A4** (in màu càng đẹp), đóng kẹp cùng 02 bản in mã nguồn. |
| **5** | \`05_DIA_CD_SAN_GHI/\` & \`05_GOI_GHI_DIA_CD_ELEC_SCIENCE_AI.zip\` | **Nội dung ghi 02 đĩa CD** (${cdStats.packedCount} tệp sạch, ${(cdStats.zipSize / 1024 / 1024).toFixed(2)} MB, **0 tệp bí mật**) | Ghi toàn bộ nội dung bên trong thư mục \`05_DIA_CD_SAN_GHI/\` ra **02 đĩa CD-R trắng**. |
| **6** | \`06_NHAN_DAN_MAT_DIA_CD.html\` | **Nhãn giấy trắng dán mặt đĩa CD** (02 nhãn chuẩn quy định) | In trên giấy trắng/decal, cắt tròn dán lên mặt 02 đĩa CD. |

---

## 2. Giấy tờ cá nhân bạn cần chuẩn bị thêm (tự in/photo)
* **01 Bản sao Căn cước công dân (CCCD)** của tác giả/chủ sở hữu (nên mang theo bản gốc nếu nộp trực tiếp, hoặc công chứng nếu gửi bưu điện).
* **Lưu ý đặc biệt nếu tác giả dưới 18 tuổi (sinh năm 2010):**
  * Theo Điều 21 Bộ luật Dân sự 2015, người từ đủ 15 đến chưa đủ 18 tuổi được tự mình xác lập giao dịch dân sự (bao gồm nộp đơn đăng ký quyền tác giả).
  * Tuy nhiên, để hồ sơ đi nhanh không bị yêu cầu bổ sung, bạn nên gọi trước bộ phận một cửa Cục Bản quyền tác giả (Hà Nội) hỏi nhanh xem có cần thêm **bản sao CCCD + chữ ký đồng ý của cha/mẹ (người đại diện theo pháp luật)** hay không trước khi gửi bưu điện.
* **Lệ phí nhà nước:** **600.000 VNĐ / chương trình máy tính** (nộp trực tiếp hoặc chuyển khoản theo thông báo biên lai trên Cổng dịch vụ công).

---

## 3. Quy trình nộp hồ sơ 3 bước (Nhanh & chuẩn nhất)

### Bước 1: Kê khai trực tuyến lấy Mã hồ sơ
1. Truy cập **https://dichvucong.bvhttdl.gov.vn** (đăng nhập bằng tài khoản VNeID / Cổng Dịch vụ công Quốc gia).
2. Chọn lĩnh vực **Bản quyền tác giả** → thủ tục **Cấp giấy chứng nhận đăng ký quyền tác giả**.
3. Chọn loại hình **Chương trình máy tính**, điền thông tin khớp với tệp \`01_TO_KHAI_MAU_03_TT08_2023_ELEC_AI.docx\`, tải lên bản scan PDF các giấy tờ.
4. Hệ thống trả về **Mã hồ sơ trực tuyến** → ghi mã này lên góc trên bên phải trang đầu của **Tờ khai bản giấy**.

### Bước 2: Gửi bộ hồ sơ bản giấy + 02 đĩa CD
Đóng gói cẩn thận (cho 02 đĩa CD vào hộp/túi chống xước) và nộp trực tiếp hoặc chuyển phát nhanh (VNPost/ViettelPost có báo phát) đến trụ sở gần bạn nhất:
* **Trụ sở chính Cục Bản quyền tác giả (Hà Nội — gần Hưng Yên/Thái Bình nhất):**  
  **Số 33, Ngõ 294/2 phố Kim Mã, phường Kim Mã, quận Ba Đình, TP. Hà Nội**  
  *(hoặc Văn phòng đại diện TP.HCM: Số 170 Nguyễn Đình Chiểu, Q.3 | Đà Nẵng: Số 58 Phan Chu Trinh, Q. Hải Châu)*.

### Bước 3: Theo dõi & Nhận Giấy chứng nhận
* Thời gian thẩm định và cấp Giấy chứng nhận theo quy định: **15 – 30 ngày làm việc** kể từ ngày Cục nhận đủ hồ sơ bản giấy hợp lệ.
* Sau khi có Giấy chứng nhận đăng ký quyền tác giả:
  * Số Giấy chứng nhận có giá trị pháp lý tại Việt Nam và được công nhận tại **hơn 180 quốc gia** thuộc Công ước Berne.
  * Bạn có thể ghi thêm số Giấy chứng nhận này trực tiếp lên footer website \`elecai.id.vn\`, \`COPYRIGHT.md\` và hồ sơ thi KHKT!

---

## 4. Thông số đối chiếu toàn vẹn (Chống tranh chấp)
* **Master SHA-256 (\`MANIFEST-SHA256.txt\`):** \`${proofSummary.manifestSha256}\`
* **Chứng chỉ Blockchain OpenTimestamps:** \`copyright-proofs/MANIFEST-SHA256.txt.ots\`
* **SHA-256 gói CD ZIP:** \`${cdStats.zipSha256}\`
* **Git HEAD Commit:** \`${proofSummary.gitCommit}\` (${proofSummary.gitCommitDate})
`;

  fs.writeFileSync(path.join(OUT_DIR, '00_HUONG_DAN_NOP_HO_SO_CUC_BAN_QUYEN.md'), md, 'utf8');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const proofSummaryPath = path.join(ROOT, 'copyright-proofs', 'COPYRIGHT-PROOF-SUMMARY.json');
  if (!fs.existsSync(proofSummaryPath)) {
    throw new Error('Missing copyright-proofs/COPYRIGHT-PROOF-SUMMARY.json. Run `npm run copyright:manifest` first.');
  }
  const proofSummary = JSON.parse(fs.readFileSync(proofSummaryPath, 'utf8'));

  const sourceFiles = collectCleanSourceFiles();
  console.log(`[1/5] Collected ${sourceFiles.length} clean first-party source files.`);

  const sourceStats = buildSourceCodePrintout(sourceFiles, proofSummary);
  console.log(
    `[2/5] Built A4 source code printout: ${sourceStats.printedCodePages} printed code pages (from ${sourceStats.totalA4Pages} total A4 pages).`
  );

  const uiCount = buildUiScreenshotsPrintout(proofSummary);
  buildCdLabelHtml(proofSummary);
  console.log(`[3/5] Built A4 UI screenshots printout (${uiCount} screens) & CD disc labels.`);

  await buildForm03Docx(sourceStats, proofSummary);
  await buildCamDoanAndDescriptionDocx(sourceStats, proofSummary);
  console.log('[4/5] Built statutory DOCX forms (Mẫu số 03 TT 08/2023 & Giấy cam đoan + Mô tả).');

  const cdStats = await buildCleanCdPackage(sourceFiles);
  buildChecklistGuide(sourceStats, uiCount, cdStats, proofSummary);
  console.log(
    `[5/5] Built clean CD package (${cdStats.packedCount} files, ${(cdStats.zipSize / 1024 / 1024).toFixed(2)} MB, SHA-256: ${cdStats.zipSha256}).`
  );
  console.log(`\nDONE! Submission dossier ready at: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
