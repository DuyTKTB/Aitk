import { describe, it, expect } from 'vitest';
import {
  buildOmrSvgMarkup,
  buildOmrPrintDocumentHtml,
  resolveOmrActiveCounts,
  buildSheetSerial,
  categorizeQuestions,
} from '../src/lib/omrSheetGenerator.js';
import { TEMPLATE, readSheet, probeSheetAlignment } from '../src/lib/omr.js';
import {
  MOET_EXAM_PRESETS,
  matchMoetPreset,
  answerKeyFromSheetRead,
  parseBulkMatrixKeys,
  autoGenerateSbdRoster,
  buildScoreReportPrintHtml,
} from '../src/lib/paperGrade.js';

/** Bộ rasterizer thuần JS nhỏ gọn để kiểm tra khả năng đọc thực tế của omr.js trên phiếu vừa sinh. */
function rasterizeSvgFiducialsAndBubbles({
  width = 1653,
  height = 2338,
  svg,
  colorMode = 'rose',
  filledCoords = [],
}) {
  const data = new Uint8ClampedArray(width * height * 4);
  data.fill(255); // nền giấy trắng

  const sx = width / TEMPLATE.width;
  const sy = height / TEMPLATE.height;

  const paintRect = (x, y, w, h, rgb) => {
    const x0 = Math.max(0, Math.floor(x * sx));
    const y0 = Math.max(0, Math.floor(y * sy));
    const x1 = Math.min(width - 1, Math.ceil((x + w) * sx));
    const y1 = Math.min(height - 1, Math.ceil((y + h) * sy));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const idx = (py * width + px) * 4;
        data[idx] = rgb[0];
        data[idx + 1] = rgb[1];
        data[idx + 2] = rgb[2];
      }
    }
  };

  const paintRing = (cx, cy, r, rgb) => {
    const cxp = cx * sx;
    const cyp = cy * sy;
    const rp = r * sx;
    const x0 = Math.max(0, Math.floor(cxp - rp - 3));
    const x1 = Math.min(width - 1, Math.ceil(cxp + rp + 3));
    const y0 = Math.max(0, Math.floor(cyp - rp - 3));
    const y1 = Math.min(height - 1, Math.ceil(cyp + rp + 3));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const dist = Math.hypot(px - cxp, py - cyp);
        if (Math.abs(dist - rp) <= 1.35) {
          const idx = (py * width + px) * 4;
          data[idx] = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
        }
      }
    }
  };

  const paintDisc = (cx, cy, r, rgb) => {
    const cxp = cx * sx;
    const cyp = cy * sy;
    const rp = r * sx;
    const x0 = Math.max(0, Math.floor(cxp - rp));
    const x1 = Math.min(width - 1, Math.ceil(cxp + rp));
    const y0 = Math.max(0, Math.floor(cyp - rp));
    const y1 = Math.min(height - 1, Math.ceil(cyp + rp));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        if (Math.hypot(px - cxp, py - cyp) <= rp) {
          const idx = (py * width + px) * 4;
          data[idx] = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
        }
      }
    }
  };

  // Trích toàn bộ vạch định vị + 4 ô vuông đen góc .omr-fiducial từ SVG vừa sinh
  const fiducials = [...svg.matchAll(/<rect class="omr-fiducial[^"]*" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)];
  fiducials.forEach((m) => {
    paintRect(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), [0, 0, 0]);
  });

  // Trích toàn bộ ô tròn từ SVG vừa sinh
  const ringRgb = colorMode === 'bw' ? [51, 65, 85] : [225, 29, 72];
  const circles = [...svg.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)" fill="([^"]+)"/g)];
  circles.forEach((m) => {
    const cx = Number(m[1]);
    const cy = Number(m[2]);
    const r = Number(m[3]);
    const fill = m[4];
    if (fill === '#000000') paintDisc(cx, cy, r, [18, 18, 18]);
    else paintRing(cx, cy, r, ringRgb);
  });

  // Mô phỏng thí sinh tô bút chì 2B tại các ô chỉ định
  filledCoords.forEach(([cx, cy]) => paintDisc(cx, cy, TEMPLATE.bubbleR * 0.9, [25, 25, 25]));

  return { data, width, height };
}

describe('omrSheetGenerator & MOET presets', () => {
  it('luôn tạo đủ khung chuẩn Bộ GD&ĐT (40·8·6) khi không truyền câu hỏi (fix lỗi phiếu trống)', () => {
    const svg = buildOmrSvgMarkup({ title: 'PHIẾU TRẢ LỜI TRẮC NGHIỆM' });
    expect(svg).not.toContain('Chưa có câu hỏi nào');
    expect(svg).toContain('PHIẾU TRẢ LỜI TRẮC NGHIỆM');
    expect(svg).toContain('PHẦN I.');
    expect(svg).toContain('PHẦN II.');
    expect(svg).toContain('PHẦN III.');
    expect(svg).toContain('7. Số báo danh');
    expect(svg).toContain('8. Mã đề thi');
    expect(svg).toContain('1. Hội đồng thi');
    expect(svg).toContain('Họ tên, chữ ký của');
    expect(svg).toContain('ELEC Science AI');
    expect(svg).toContain('elecai.id.vn');
  });

  it('nhúng đủ 4 ô vuông đen ở 4 góc chuẩn TNMaker/BGD và 51 vạch định vị khớp TEMPLATE.marks', () => {
    const svg = buildOmrSvgMarkup({ counts: { p1: 18, p2: 4, p3: 6 } });
    const corners = [...svg.matchAll(/<rect class="omr-fiducial omr-corner-square" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)];
    const fiducials = [...svg.matchAll(/<rect class="omr-fiducial[^"]*" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)];
    expect(corners).toHaveLength(4);
    corners.forEach((m) => {
      expect(Number(m[3])).toBe(56);
      expect(Number(m[4])).toBe(56);
    });
    expect(fiducials).toHaveLength(TEMPLATE.marks.length);
    fiducials.forEach((m, i) => {
      const cx = Number(m[1]) + Number(m[3]) / 2;
      const cy = Number(m[2]) + Number(m[4]) / 2;
      expect(cx).toBeCloseTo(TEMPLATE.marks[i][0], 0);
      expect(cy).toBeCloseTo(TEMPLATE.marks[i][1], 0);
    });
  });

  it('thoát XML an toàn với ký tự đặc biệt &, <, > trong tên trường / kỳ thi', () => {
    const svg = buildOmrSvgMarkup({
      schoolName: 'SỞ GD & ĐT HÀ NỘI <THPT>',
      examTitle: 'Kiểm tra Lý & Hóa',
      subject: 'KHTN <2025>',
    });
    expect(svg).toContain('SỞ GD &amp; ĐT HÀ NỘI &lt;THPT&gt;');
    expect(svg).toContain('Kiểm tra Lý &amp; Hóa');
    expect(svg).toContain('KHTN &lt;2025&gt;');
  });

  it('tạo tài liệu HTML 1 trang/mã đề với @page A4 và print-color-adjust: exact (in nhiều mã trong 1 file)', () => {
    const html = buildOmrPrintDocumentHtml([
      { code: '101', examTitle: 'Thi thử THPT 2025', counts: { p1: 12, p2: 4, p3: 6 } },
      { code: '102', examTitle: 'Thi thử THPT 2025', counts: { p1: 12, p2: 4, p3: 6 } },
    ]);
    expect(html).toContain('@page');
    expect(html).toContain('size: A4 portrait;');
    expect(html).toContain('print-color-adjust: exact');
    expect((html.match(/<section class="omr-page">/g) || [])).toHaveLength(2);
    expect(html).toContain('MÃ ĐỀ: 101');
    expect(html).toContain('MÃ ĐỀ: 102');
  });

  it('tương thích categorizeQuestions & resolveOmrActiveCounts', () => {
    const qs = [
      { type: 'multiple_choice', options: ['A', 'B', 'C', 'D'], correct: 0 },
      { type: 'true_false', statements: [{ answer: true }] },
      { type: 'short_answer', answer: '42' },
    ];
    const cat = categorizeQuestions(qs);
    expect(cat.singleChoice).toHaveLength(1);
    expect(cat.trueFalse).toHaveLength(1);
    expect(cat.shortAnswer).toHaveLength(1);
    expect(resolveOmrActiveCounts({ questions: qs })).toEqual({ p1: 1, p2: 1, p3: 1 });
    expect(resolveOmrActiveCounts({ questions: [] })).toEqual({ p1: 40, p2: 8, p3: 6 });
    expect(buildSheetSerial({ code: '101', examTitle: 'A' })).toMatch(/^ELC-101-[A-Z0-9]+$/);
  });

  it('quét trực tiếp qua omr.js (readSheet) với độ chính xác 100% ở cả chế độ Đỏ-Hồng & Đen trắng', () => {
    // Kịch bản tô: SBD = 012345, Mã đề = 268 (tô sẵn bởi prefillCodeBubbles),
    // P.I: Câu 1 = B, Câu 18 = D, P.II: Câu 1 = Đ S Đ S, P.III: Câu 1 = -1,5
    const sbdDigits = [0, 1, 2, 3, 4, 5];
    const filled = [
      ...sbdDigits.map((d, col) => [TEMPLATE.idX[col], TEMPLATE.digitY[d]]),
      [TEMPLATE.p1X[0][1], TEMPLATE.p1Y[0]], // Câu 1 = B
      [TEMPLATE.p1X[1][3], TEMPLATE.p1Y[7]], // Câu 18 = D
      [TEMPLATE.p2X[0][0], TEMPLATE.p2Y[0]], // Câu 1a = Đ
      [TEMPLATE.p2X[0][1], TEMPLATE.p2Y[1]], // Câu 1b = S
      [TEMPLATE.p2X[0][0], TEMPLATE.p2Y[2]], // Câu 1c = Đ
      [TEMPLATE.p2X[0][1], TEMPLATE.p2Y[3]], // Câu 1d = S
      [TEMPLATE.p3X[0][0], TEMPLATE.p3MinusY], // P3 C1: '-'
      [TEMPLATE.p3X[0][1], TEMPLATE.p3DigitY[1]], // '1'
      [TEMPLATE.p3X[0][2], TEMPLATE.p3CommaY], // ','
      [TEMPLATE.p3X[0][3], TEMPLATE.p3DigitY[5]], // '5'
    ];

    ['rose', 'bw'].forEach((colorMode) => {
      const svg = buildOmrSvgMarkup({
        code: '268',
        prefillCodeBubbles: true,
        colorMode,
        counts: { p1: 18, p2: 4, p3: 6 },
      });
      const img = rasterizeSvgFiducialsAndBubbles({ svg, colorMode, filledCoords: filled });
      const res = readSheet(img);

      expect(res.ok).toBe(true);
      expect(res.quality.markFit).toBeGreaterThanOrEqual(0.95);
      expect(res.quality.warn).toBeNull();
      expect(res.sbd).toBe('012345');
      expect(res.code).toBe('268');
      expect(res.p1[0]).toBe('B');
      expect(res.p1[17]).toBe('D');
      expect(res.p2[0]).toEqual(['D', 'S', 'D', 'S']);
      expect(res.p3[0]).toBe('-1,5');
    });
  });

  it('nhận diện đúng các bộ mẫu cấu trúc Bộ GD&ĐT 2025+', () => {
    const toan = MOET_EXAM_PRESETS.find((p) => p.id === 'toan_2025');
    expect(toan.counts).toEqual({ p1: 12, p2: 4, p3: 6 });
    expect(toan.scoring.p3).toBe(0.5);
    expect(matchMoetPreset(toan.counts, toan.scoring)?.id).toBe('toan_2025');
  });

  it('probeSheetAlignment phát hiện nhanh 4 góc A4 khi chụp thẳng, thiếu sáng hoặc xoay ngang 90 độ', () => {
    // 1) Khung hình tối
    const darkData = new Uint8ClampedArray(640 * 480 * 4);
    for (let i = 3; i < darkData.length; i += 4) darkData[i] = 255;
    const darkProbe = probeSheetAlignment({ data: darkData, width: 640, height: 480 });
    expect(darkProbe.detected).toBe(false);
    expect(darkProbe.ready).toBe(false);
    expect(darkProbe.lightState).toBe('dark');

    // 2) Phiếu A4 đứng chuẩn
    const svg = buildOmrSvgMarkup({ code: '101', prefillCodeBubbles: true, counts: { p1: 12, p2: 4, p3: 6 } });
    const img = rasterizeSvgFiducialsAndBubbles({
      svg,
      filledCoords: [[TEMPLATE.p1X[0][2], TEMPLATE.p1Y[0]]],
    });
    const upright = probeSheetAlignment(img);
    expect(upright.detected).toBe(true);
    expect(upright.ready).toBe(true);
    expect(upright.markFit).toBeGreaterThanOrEqual(0.9);
    expect(upright.cornersPx).not.toBeNull();

    // 3) Xoay ngang 90 độ theo chiều kim đồng hồ (giả lập đặt phiếu ngang dưới webcam)
    const wRot = img.height;
    const hRot = img.width;
    const rotData = new Uint8ClampedArray(wRot * hRot * 4);
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const nx = img.height - 1 - y;
        const ny = x;
        const srcIdx = (y * img.width + x) * 4;
        const dstIdx = (ny * wRot + nx) * 4;
        rotData[dstIdx] = img.data[srcIdx];
        rotData[dstIdx + 1] = img.data[srcIdx + 1];
        rotData[dstIdx + 2] = img.data[srcIdx + 2];
        rotData[dstIdx + 3] = 255;
      }
    }
    const rotProbe = probeSheetAlignment({ data: rotData, width: wRot, height: hRot });
    expect(rotProbe.detected).toBe(true);
    expect(rotProbe.ready).toBe(true);
    const rotRead = readSheet({ data: rotData, width: wRot, height: hRot });
    expect(rotRead.ok).toBe(true);
    expect(rotRead.code).toBe('101');
    expect(rotRead.p1[0]).toBe('C');
  });

  it('nhận diện thành công phiếu chỉ có 4 ô vuông đen ở 4 góc (kiểu TNMaker) qua probeSheetAlignment & readSheet', () => {
    const svgFull = buildOmrSvgMarkup({ code: '204', prefillCodeBubbles: true, counts: { p1: 18, p2: 4, p3: 6 } });
    // Loại bỏ toàn bộ 51 vạch mép nhỏ, chỉ giữ duy nhất 4 ô vuông đen 56x56 ở 4 góc
    const svg4SquaresOnly = svgFull.replace(/<rect class="omr-fiducial omr-timing-tick"[^>]*\/>/g, '');
    const img = rasterizeSvgFiducialsAndBubbles({
      svg: svg4SquaresOnly,
      filledCoords: [
        [TEMPLATE.p1X[0][0], TEMPLATE.p1Y[0]], // Câu 1 = A
        [TEMPLATE.p2X[0][1], TEMPLATE.p2Y[0]], // P.II Câu 1a = S
      ],
    });
    const probe = probeSheetAlignment(img);
    expect(probe.detected).toBe(true);
    expect(probe.ready).toBe(true);
    expect(probe.cornersCount).toBe(4);
    expect(probe.cornerMatched).toEqual({ TL: true, TR: true, BR: true, BL: true });

    const decoded = readSheet(img);
    expect(decoded.ok).toBe(true);
    expect(decoded.code).toBe('204');
    expect(decoded.p1[0]).toBe('A');
    expect(decoded.p2[0][0]).toBe('S');
    expect(decoded.quality.cornersNorm?.TL?.[0]).toBeGreaterThan(0);
    expect(decoded.quality.cornersNorm?.BR?.[1]).toBeLessThan(1);
  });

  it('answerKeyFromSheetRead trích đáp án gốc từ phiếu tô mẫu chuẩn 3 phần', () => {
    const res = answerKeyFromSheetRead(
      {
        code: '305',
        p1: ['A', 'C', '*'],
        p2: [['D', 'S', 'D', 'S']],
        p3: ['-1,5', '?'],
      },
      { p1: 3, p2: 1, p3: 2 },
    );
    expect(res.code).toBe('305');
    expect(res.filledCount).toEqual({ p1: 2, p2: 1, p3: 1 });
    expect(res.key.p1.slice(0, 3)).toEqual(['A', 'C', '']);
    expect(res.key.p2[0]).toEqual(['D', 'S', 'D', 'S']);
    expect(res.key.p3[0]).toEqual(['-1,5']);
    expect(res.texts.p2).toBe('ĐSĐS');
  });

  it('parseBulkMatrixKeys phân tích đúng ma trận Excel McMix/TNMix nhiều mã đề', () => {
    const raw = [
      'Câu\t101\t102\t103',
      '1\tA\tC\tD',
      '2\tB\tD\tA',
      'Phần II',
      '1\tĐSĐS\tSĐSĐ\tĐĐSS',
      'Phần III',
      '1\t-1,5\t42\t0,25',
    ].join('\n');
    const parsed = parseBulkMatrixKeys(raw, { p1: 18, p2: 4, p3: 6 });
    expect(parsed.codes).toEqual(['101', '102', '103']);
    expect(parsed.byCode['101'].p1.slice(0, 2)).toEqual(['A', 'B']);
    expect(parsed.byCode['102'].p2[0]).toEqual(['S', 'D', 'S', 'D']);
    expect(parsed.byCode['103'].p3[0]).toEqual(['0,25']);
  });

  it('autoGenerateSbdRoster & buildScoreReportPrintHtml tạo SBD 6 số theo thứ tự tên Việt và xuất bảng điểm A4', () => {
    const roster = autoGenerateSbdRoster([
      { id: 'u2', name: 'Trần Văn Bình' },
      { id: 'u1', name: 'Nguyễn Thị An', code: '45' },
    ]);
    expect(roster.count).toBe(2);
    expect(roster.map['000045'].name).toBe('Nguyễn Thị An');
    expect(roster.map['000002'].name).toBe('Trần Văn Bình');

    const html = buildScoreReportPrintHtml({
      paper: { title: 'Thi thử THPT', counts: { p1: 18, p2: 4, p3: 6 } },
      classInfo: { name: '12A1' },
      results: [
        {
          status: 'done',
          sbd: '000045',
          studentName: 'Nguyễn Thị An',
          code: '101',
          grade: { parts: { p1: 4.5, p2: 4, p3: 1.5 }, total: 10, score10: 10 },
        },
      ],
    });
    expect(html).toContain('BẢNG TỔNG HỢP ĐIỂM CHẤM PHIẾU OMR');
    expect(html).toContain('Nguyễn Thị An');
    expect(html).toContain('12A1');
    expect(html).toContain('000045');
  });
});
