import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import {
  sanitizeSheetName,
  colIndexToLetter,
  classifyExamGradeColumn,
  computeStudentPeriodGrades,
  buildStyledWorkbook,
} from '../src/lib/excelExport.js';

describe('excelExport helpers & Circular 22 grading', () => {
  it('sanitizes Excel sheet names to <=31 chars without forbidden symbols', () => {
    expect(sanitizeSheetName('Bảng điểm [11A5]: Học kỳ *1?/')).toBe('Bảng điểm 11A5 Học kỳ 1');
    expect(sanitizeSheetName('Một tiêu đề rất dài vượt quá giới hạn ba mươi mốt ký tự').length).toBeLessThanOrEqual(31);
  });

  it('converts column indices to Excel letters accurately', () => {
    expect(colIndexToLetter(1)).toBe('A');
    expect(colIndexToLetter(8)).toBe('H');
    expect(colIndexToLetter(26)).toBe('Z');
    expect(colIndexToLetter(27)).toBe('AA');
  });

  it('classifies exams into tx, dgk, and ckk accurately', () => {
    expect(classifyExamGradeColumn({ title: 'Kiểm tra 20 phút Hóa 11', duration: 20 })).toBe('tx');
    expect(classifyExamGradeColumn({ title: 'Kiểm tra Giữa kỳ I', duration: 45 })).toBe('dgk');
    expect(classifyExamGradeColumn({ title: 'Đề 45 phút Chương 2', duration: 45 })).toBe('dgk');
    expect(classifyExamGradeColumn({ title: 'Đề thi Cuối kỳ II', duration: 60 })).toBe('ckk');
    expect(classifyExamGradeColumn({ title: 'Thi thử THPT 2026', duration: 50 })).toBe('ckk');
  });

  it('prioritizes explicit teacher gradeType override over title/duration heuristics', () => {
    expect(classifyExamGradeColumn({ title: 'Đề ôn tập cuối kỳ II', duration: 90, gradeType: 'tx' })).toBe('tx');
    expect(classifyExamGradeColumn({ title: 'Kiểm tra 15 phút (hệ số 2)', duration: 15, gradeType: 'dgk' })).toBe('dgk');
    expect(classifyExamGradeColumn({ title: 'Khảo sát giữa kỳ', duration: 45, gradeType: 'ckk' })).toBe('ckk');
  });

  it('never clones TX scores into empty ĐGK and CKK columns', () => {
    const exams = [{ id: 'ex-tx', title: 'Đề kiểm tra 20 phút', duration: 20 }];
    const student = {
      id: 'st-1',
      subs: [{ examId: 'ex-tx', score: 4.1, totalPoints: 10 }],
    };

    const grades = computeStudentPeriodGrades(student, exams);
    expect(grades.tx).toBe(4.1);
    expect(grades.dgk).toBeNull();
    expect(grades.ckk).toBeNull();
    expect(grades.tb).toBe(4.1);
    expect(grades.status).toBe('Chưa đạt');
  });

  it('calculates Thông tư 22 weighted TB (1:2:3) when TX, ĐGK, and CKK exist', () => {
    const exams = [
      { id: 'e1', title: 'Kiểm tra TX 15p', duration: 15 },
      { id: 'e2', title: 'Kiểm tra Giữa kỳ', duration: 45 },
      { id: 'e3', title: 'Kiểm tra Cuối kỳ', duration: 90 },
    ];
    const student = {
      id: 'st-2',
      subs: [
        { examId: 'e1', score: 7.0, totalPoints: 10 },
        { examId: 'e2', score: 8.0, totalPoints: 10 },
        { examId: 'e3', score: 9.0, totalPoints: 10 },
      ],
    };

    const grades = computeStudentPeriodGrades(student, exams);
    expect(grades.tx).toBe(7.0);
    expect(grades.dgk).toBe(8.0);
    expect(grades.ckk).toBe(9.0);
    expect(grades.tb).toBe(8.3);
    expect(grades.status).toBe('Giỏi');
  });

  it('keeps unsubmitted students empty with Chưa thi status', () => {
    const grades = computeStudentPeriodGrades({ id: 'st-empty', subs: [] }, []);
    expect(grades.tx).toBeNull();
    expect(grades.dgk).toBeNull();
    expect(grades.ckk).toBeNull();
    expect(grades.tb).toBeNull();
    expect(grades.status).toBe('Chưa thi');
  });
});

describe('buildStyledWorkbook branded .xlsx generation', () => {
  it('embeds ELEC mascot, copyright watermark, semantic colors, and Excel formulas', async () => {
    const mascotPath = path.resolve(process.cwd(), 'public/img/elec/elec-celebrate.png');
    const mascotBuffer = fs.existsSync(mascotPath) ? fs.readFileSync(mascotPath) : null;

    const wb = buildStyledWorkbook(ExcelJS, {
      brandMeta: {
        schoolName: 'THPT Chuyên ELEC',
        teacherName: 'Thầy Duy',
      },
      mascotBuffers: mascotBuffer ? { celebrate: mascotBuffer } : {},
      sheets: [
        {
          name: 'Bảng điểm vnEdu - SMAS',
          mascot: 'celebrate',
          title: 'BẢNG ĐIỂM LỚP 11A5',
          meta: [{ label: 'Sĩ số', value: '2 học sinh' }],
          statsStrip: ({ dataStartRow, dataEndRow }) => [
            { value: 'Giỏi:' },
            { value: { formula: `COUNTIF(F${dataStartRow}:F${dataEndRow},"Giỏi")`, result: 1 } },
          ],
          columns: [
            { header: 'STT', key: 'stt', align: 'center' },
            { header: 'Họ và tên', key: 'name', align: 'left' },
            { header: 'Điểm TX', key: 'tx', align: 'center', numFmt: '0.0', isScore10: true },
            { header: 'Điểm ĐGK', key: 'dgk', align: 'center', numFmt: '0.0', isScore10: true },
            {
              header: 'Điểm TB',
              key: 'tb',
              align: 'center',
              numFmt: '0.0',
              isScore10: true,
              getValue: (r, _i, excelRow) => ({
                formula: `ROUND(AVERAGE(C${excelRow}:D${excelRow}),1)`,
                result: r.tb,
              }),
            },
            { header: 'Xếp loại', key: 'rank', align: 'center', isScoreBand: true },
          ],
          rows: [
            { stt: 1, name: 'Nguyễn An', tx: 8.5, dgk: 9.0, tb: 8.8, rank: 'Giỏi' },
            { stt: 2, name: 'Trần Bình', tx: 4.1, dgk: '', tb: 4.1, rank: 'Chưa đạt' },
          ],
          summaryRow: {
            labelCol: 1,
            label: 'TRUNG BÌNH LỚP',
            cells: {
              tb: ({ dataStartRow, dataEndRow }) => ({ formula: `ROUND(AVERAGE(E${dataStartRow}:E${dataEndRow}),1)` }),
            },
          },
        },
        {
          name: 'Phân tích Chuyên đề',
          columns: [
            { header: 'STT', key: 'stt', align: 'center' },
            { header: 'Chuyên đề', key: 'topic', align: 'left' },
            { header: 'Tỉ lệ đúng', key: 'rate', align: 'center', numFmt: '0%' },
            { header: 'Trạng thái', key: 'state', align: 'center', isScoreBand: true },
          ],
          rows: [{ stt: 1, topic: 'Cân bằng hóa học', rate: 0.42, state: 'Cần kèm ngay' }],
        },
      ],
    });

    expect(wb.worksheets).toHaveLength(2);
    const ws1 = wb.getWorksheet('Bảng điểm vnEdu - SMAS');
    expect(ws1.getCell('B1').value).toBe('BẢNG ĐIỂM LỚP 11A5');
    expect(String(ws1.getCell('B3').value)).toContain('© ELEC AI Science Studio');
    expect(ws1.views[0].state).toBe('frozen');
    expect(ws1.autoFilter).toBeTruthy();

    // Rows 1-3: hero, Row 4: meta, Row 5: statsStrip, Row 6: spacer, Row 7: header -> data starts at Row 8
    expect(ws1.getCell('E8').formula).toContain('AVERAGE(C8:D8)');
    expect(ws1.getCell('F8').fill.fgColor.argb).toBe('FFDCFCE7');
    expect(ws1.getCell('F9').fill.fgColor.argb).toBe('FFFEE2E2');
    expect(ws1.getCell('B5').formula).toBe('COUNTIF(F8:F9,"Giỏi")');

    if (mascotBuffer) {
      expect(ws1.getImages().length).toBeGreaterThan(0);
    }

    const bytes = await wb.xlsx.writeBuffer();
    expect(bytes.byteLength).toBeGreaterThan(4000);
  });
});
