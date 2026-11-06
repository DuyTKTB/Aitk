/* ============================================================
   examExport.js — Xuất đề thi ra Word (.docx), PDF, ZIP
   ------------------------------------------------------------
   Hỗ trợ:
     • exportToWord()    — Tạo file .docx chuẩn 3 phần GDPT 2025 + Thông tin trang đầu + Hình ảnh + Đáp án
     • exportToPDF()     — Tạo file PDF (qua html2canvas + jsPDF)
     • exportBundleZip() — Gộp bộ mã đề + bảng đáp án vào 1 file ZIP
   ============================================================ */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import fileSaver from 'file-saver';
const saveAs = fileSaver?.saveAs || fileSaver;
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatMathAndChemSymbols } from './chemFormulaFormatter.js';

const fmt = (s) => formatMathAndChemSymbols(String(s ?? ''));

/* ============================================================
   HELPER: Tạo filename an toàn & chuyển DataURL sang Uint8Array
   ============================================================ */
function safeFilename(name) {
  return String(name || 'de-thi')
    .replace(/[^\w\s\u00C0-\u024F\u1EA0-\u1EF9-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function dataUrlToUint8Array(dataUrl) {
  try {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return null;
    const [meta, base64] = dataUrl.split(',');
    if (!base64) return null;
    // docx ImageRun supports png, jpg/jpeg, gif, bmp
    if (meta.includes('svg')) return null;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/* ============================================================
   HELPER: Dựng nội dung Word (.docx) chuẩn 3 phần
   ============================================================ */
export async function buildExamDocBlob({
  examTitle = 'ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ',
  subject = 'Hóa học',
  grade = '12',
  duration = 45,
  code = '101',
  questions = [],
  includeAnswers = true,
  headerInfo = null,
}) {
  const deptName = headerInfo?.deptName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO';
  const schoolName = headerInfo?.schoolName || 'TRƯỜNG THPT';
  const examName = headerInfo?.examName || examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ';
  const subj = headerInfo?.subject || subject || 'Hóa học';
  const finalGrade = headerInfo?.grade || grade || '12';
  const schoolYear = headerInfo?.schoolYear || '2025 - 2026';
  const dur = headerInfo?.duration || duration || 45;

  const children = [];

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '475569' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '475569' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '475569' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '475569' },
  };

  // --- HEADER BỘ GD&ĐT 2 CỘT CHUẨN ---
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 42, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: deptName.toUpperCase(), bold: true, size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: schoolName.toUpperCase(), bold: true, size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: '(Đề thi có hướng dẫn giải chi tiết)', italics: true, size: 18 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 58, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: examName.toUpperCase(), bold: true, size: 22 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `NĂM HỌC ${schoolYear}`, bold: true, size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `MÔN: ${subj.toUpperCase()} — LỚP ${finalGrade}`, bold: true, size: 22 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `Thời gian làm bài: ${dur} phút (không kể thời gian phát đề)`, italics: true, size: 18 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `MÃ ĐỀ THI: ${code}`, bold: true, size: 22 })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Họ và tên thí sinh: ............................................................................ Số báo danh: .............................',
          italics: true,
          size: 22,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  );

  const part1 = questions.filter((q) => (q.type || 'single_choice') === 'single_choice');
  const part2 = questions.filter((q) => q.type === 'true_false');
  const part3 = questions.filter((q) => q.type === 'short_answer');

  const appendQuestionImage = (q) => {
    const imgBytes = dataUrlToUint8Array(q.image);
    if (imgBytes) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: imgBytes,
              transformation: { width: 300, height: 180 },
            }),
          ],
        }),
      );
    }
  };

  // --- PHẦN I ---
  if (part1.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (${part1.length} câu).`,
            bold: true,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Thí sinh trả lời từ câu 1 đến câu ${part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`,
            italics: true,
            size: 22,
          }),
        ],
      }),
      new Paragraph({ text: '' }),
    );

    part1.forEach((q, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Câu ${idx + 1}: `, bold: true, size: 24 }),
            new TextRun({ text: fmt(q.q || ''), size: 24 }),
          ],
        }),
      );
      appendQuestionImage(q);
      if (Array.isArray(q.options)) {
        q.options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx);
          children.push(
            new Paragraph({
              indent: { left: 480 },
              children: [
                new TextRun({ text: `${letter}. `, bold: true, size: 24 }),
                new TextRun({ text: fmt(opt || ''), size: 24 }),
              ],
            }),
          );
        });
      }
      children.push(new Paragraph({ text: '' }));
    });
  }

  // --- PHẦN II ---
  if (part2.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `PHẦN II. Câu trắc nghiệm đúng sai (${part2.length} câu).`,
            bold: true,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Thí sinh trả lời từ câu 1 đến câu ${part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.`,
            italics: true,
            size: 22,
          }),
        ],
      }),
      new Paragraph({ text: '' }),
    );

    part2.forEach((q, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Câu ${idx + 1}: `, bold: true, size: 24 }),
            new TextRun({ text: fmt(q.q || ''), size: 24 }),
          ],
        }),
      );
      appendQuestionImage(q);
      if (Array.isArray(q.statements)) {
        q.statements.forEach((st, sIdx) => {
          const letter = 'abcd'[sIdx] || String(sIdx + 1);
          children.push(
            new Paragraph({
              indent: { left: 480 },
              children: [
                new TextRun({ text: `${letter}) `, bold: true, size: 24 }),
                new TextRun({ text: fmt(st.text || ''), size: 24 }),
              ],
            }),
          );
        });
      }
      children.push(new Paragraph({ text: '' }));
    });
  }

  // --- PHẦN III ---
  if (part3.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `PHẦN III. Câu trắc nghiệm trả lời ngắn (${part3.length} câu).`,
            bold: true,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Thí sinh trả lời từ câu 1 đến câu ${part3.length}. Thí sinh điền kết quả vào ô tương ứng.`,
            italics: true,
            size: 22,
          }),
        ],
      }),
      new Paragraph({ text: '' }),
    );

    part3.forEach((q, idx) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Câu ${idx + 1}: `, bold: true, size: 24 }),
            new TextRun({ text: fmt(q.q || ''), size: 24 }),
          ],
        }),
      );
      appendQuestionImage(q);
      children.push(
        new Paragraph({
          indent: { left: 480 },
          children: [
            new TextRun({ text: 'Đáp số: ............................................................', italics: true, size: 24 }),
          ],
        }),
      );
      children.push(new Paragraph({ text: '' }));
    });
  }

  // --- DÒNG KẾT THÚC ĐỀ THI ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '-------------------------- HẾT --------------------------', bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm)', italics: true, size: 20 }),
      ],
    }),
  );

  // --- ĐÁP ÁN & HƯỚNG DẪN GIẢI CHI TIẾT (NGẮT TRANG SANG TRANG MỚI) ---
  if (includeAnswers) {
    children.push(
      new Paragraph({
        pageBreakBefore: true,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT — MÃ ĐỀ ${code}`, bold: true, size: 28, color: '0f172a' }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `(Môn: ${subj} — Lớp: ${finalGrade} | Thời gian: ${dur} phút)`, italics: true, size: 20 }),
        ],
      }),
      new Paragraph({ text: '' }),
    );

    // 1. BẢNG ĐÁP ÁN TỔNG HỢP
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'I. BẢNG ĐÁP ÁN TỔNG HỢP', bold: true, size: 24, color: '1d4ed8' })],
      }),
      new Paragraph({ text: '' }),
    );

    if (part1.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '1. Phần I — Trắc nghiệm nhiều lựa chọn:', bold: true, size: 22 })],
        }),
      );
      // Tạo bảng đáp án Phần I thành các dòng 10 câu
      const p1Rows = [];
      for (let i = 0; i < part1.length; i += 10) {
        const slice = part1.slice(i, i + 10);
        p1Rows.push(
          new TableRow({
            children: [
              new TableCell({ borders: tableBorder, children: [new Paragraph({ children: [new TextRun({ text: 'Câu', bold: true, size: 20 })] })] }),
              ...slice.map((_, sIdx) => new TableCell({ borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i + sIdx + 1), bold: true, size: 20 })] })] })),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ borders: tableBorder, children: [new Paragraph({ children: [new TextRun({ text: 'Đ/A', bold: true, size: 20, color: '047857' })] })] }),
              ...slice.map((q) => new TableCell({ borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String.fromCharCode(65 + (q.correct || 0)), bold: true, size: 20, color: '047857' })] })] })),
            ],
          }),
        );
      }
      children.push(
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: p1Rows }),
        new Paragraph({ text: '' }),
      );
    }

    if (part2.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '2. Phần II — Trắc nghiệm Đúng / Sai:', bold: true, size: 22 })],
        }),
      );
      const p2Rows = [
        new TableRow({
          children: [
            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Câu', bold: true, size: 20 })] })] }),
            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ý a', bold: true, size: 20 })] })] }),
            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ý b', bold: true, size: 20 })] })] }),
            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ý c', bold: true, size: 20 })] })] }),
            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ý d', bold: true, size: 20 })] })] }),
          ],
        }),
      ];
      part2.forEach((q, i) => {
        const sts = q.statements || [];
        p2Rows.push(
          new TableRow({
            children: [
              new TableCell({ borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Câu ${i + 1}`, bold: true, size: 20 })] })] }),
              ...[0, 1, 2, 3].map((sIdx) => {
                const ans = sts[sIdx]?.answer;
                return new TableCell({
                  borders: tableBorder,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: ans === true ? 'Đ' : ans === false ? 'S' : '—',
                          bold: true,
                          size: 20,
                          color: ans ? '047857' : 'dc2626',
                        }),
                      ],
                    }),
                  ],
                });
              }),
            ],
          }),
        );
      });
      children.push(
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: p2Rows }),
        new Paragraph({ text: '' }),
      );
    }

    if (part3.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '3. Phần III — Trắc nghiệm trả lời ngắn:', bold: true, size: 22 })],
        }),
      );
      const p3Rows = [
        new TableRow({
          children: [
            new TableCell({ borders: tableBorder, children: [new Paragraph({ children: [new TextRun({ text: 'Câu', bold: true, size: 20 })] })] }),
            ...part3.map((_, i) => new TableCell({ borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i + 1), bold: true, size: 20 })] })] })),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ borders: tableBorder, children: [new Paragraph({ children: [new TextRun({ text: 'Đáp số', bold: true, size: 20, color: '047857' })] })] }),
            ...part3.map((q) => new TableCell({ borders: tableBorder, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(q.answer ?? '—'), bold: true, size: 20, color: '047857' })] })] })),
          ],
        }),
      ];
      children.push(
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: p3Rows }),
        new Paragraph({ text: '' }),
      );
    }

    // 2. HƯỚNG DẪN GIẢI CHI TIẾT TỪNG CÂU
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'II. HƯỚNG DẪN GIẢI CHI TIẾT & BIỂU ĐIỂM TỪNG CÂU', bold: true, size: 24, color: '1d4ed8' })],
      }),
      new Paragraph({ text: '' }),
    );

    questions.forEach((q, idx) => {
      const typeLabel = q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Trả lời ngắn' : 'Trắc nghiệm 4 lựa chọn';
      const levelLabel = q.level || 'Thông hiểu';
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Câu ${idx + 1} (${typeLabel} — ${levelLabel}${q.points ? ` — ${q.points}đ` : ''}): `, bold: true, size: 22, color: '0f172a' }),
            new TextRun({ text: fmt(String(q.q || '').slice(0, 160) + (String(q.q || '').length > 160 ? '...' : '')), italics: true, size: 20, color: '475569' }),
          ],
        }),
      );

      // In đáp án
      if (q.type === 'single_choice' || !q.type) {
        const correctLetter = String.fromCharCode(65 + (q.correct || 0));
        const correctOptText = q.options?.[q.correct] ? `: ${fmt(q.options[q.correct])}` : '';
        children.push(
          new Paragraph({
            indent: { left: 240 },
            children: [
              new TextRun({ text: '• Đáp án đúng: ', bold: true, size: 22, color: '047857' }),
              new TextRun({ text: `${correctLetter}${correctOptText}`, bold: true, size: 22, color: '047857' }),
            ],
          }),
        );
      } else if (q.type === 'true_false') {
        const tfText = (q.statements || []).map((st, si) => `${'abcd'[si]}) ${st.answer ? 'Đúng' : 'Sai'}`).join('   |   ');
        children.push(
          new Paragraph({
            indent: { left: 240 },
            children: [
              new TextRun({ text: '• Đáp án: ', bold: true, size: 22, color: '047857' }),
              new TextRun({ text: tfText, bold: true, size: 22, color: '047857' }),
            ],
          }),
        );
      } else if (q.type === 'short_answer') {
        children.push(
          new Paragraph({
            indent: { left: 240 },
            children: [
              new TextRun({ text: '• Đáp số: ', bold: true, size: 22, color: '047857' }),
              new TextRun({ text: fmt(q.answer ?? '—'), bold: true, size: 22, color: '047857' }),
            ],
          }),
        );
      }

      // In lời giải chi tiết
      if (q.explain) {
        children.push(
          new Paragraph({
            indent: { left: 240 },
            children: [
              new TextRun({ text: '• Lời giải chi tiết: ', bold: true, size: 22 }),
              new TextRun({ text: fmt(q.explain), size: 22 }),
            ],
          }),
        );
      }

      // In các bước tính toán / bản giải nháp
      if (q.work) {
        children.push(
          new Paragraph({
            indent: { left: 240 },
            children: [
              new TextRun({ text: '• Bản giải / Các bước tính toán: ', bold: true, size: 20, color: '0369a1' }),
              new TextRun({ text: fmt(q.work), size: 20, color: '334155' }),
            ],
          }),
        );
      }

      children.push(new Paragraph({ text: '' }));
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        },
      },
      children,
    }],
  });

  return await Packer.toBlob(doc);
}

/* ============================================================
   1. EXPORT WORD (.docx)
   ============================================================ */
export async function exportToWord({
  examTitle = 'Đề kiểm tra',
  subject = 'Hóa học',
  grade = '12',
  duration = 45,
  code = '101',
  questions = [],
  includeAnswers = true,
  headerInfo = null,
}) {
  const blob = await buildExamDocBlob({
    examTitle,
    subject,
    grade: headerInfo?.grade || grade || '12',
    duration,
    code,
    questions,
    includeAnswers,
    headerInfo,
  });
  const filename = `${safeFilename(headerInfo?.examName || examTitle)}-Ma${code}.docx`;
  saveAs(blob, filename);
  return filename;
}

/* ============================================================
   2. EXPORT PDF (từ DOM element)
   ============================================================ */
export async function exportToPDF({
  element,
  examTitle = 'Đề kiểm tra',
  code = '101',
}) {
  if (!element) throw new Error('Cần truyền element DOM để chụp');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= (pageHeight - 20);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 20);
  }

  const filename = `${safeFilename(examTitle)}-Ma${code}.pdf`;
  pdf.save(filename);
  return filename;
}

/* ============================================================
   3. EXPORT ZIP (nhiều file gộp)
   ============================================================ */
export async function exportBundleZip({
  examTitle = 'Đề kiểm tra',
  subject = 'Hóa học',
  grade = '12',
  schoolName = 'TRƯỜNG THPT',
  deptName = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
  schoolYear = '2025 - 2026',
  duration = 45,
  versions = [],
  headerInfo = null,
  originalQuestions = [],
  matrixStats = null,
}) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const finalHeader = headerInfo || {
    deptName,
    schoolName,
    examName: examTitle,
    subject,
    grade,
    schoolYear,
    duration,
  };

  for (const version of versions) {
    const blob = await buildExamDocBlob({
      examTitle,
      subject,
      grade: finalHeader.grade || grade,
      duration,
      code: version.code,
      questions: version.questions,
      includeAnswers: false,
      headerInfo: finalHeader,
    });
    zip.file(`De-Thi-Ma${version.code}.docx`, blob);

    const solvedBlob = await buildExamDocBlob({
      examTitle: `${examTitle} - Đáp Án Chi Tiết`,
      subject,
      grade: finalHeader.grade || grade,
      duration,
      code: version.code,
      questions: version.questions,
      includeAnswers: true,
      headerInfo: finalHeader,
    });
    zip.file(`Dap-An-Chi-Tiet-Ma${version.code}.docx`, solvedBlob);
  }

  const matrixContent = `
# KHUNG MA TRẬN ĐỀ THI ĐỊNH KỲ
- Môn: ${subject} - Khối: ${grade}
- Phần I (Trắc nghiệm 4 lựa chọn): ${matrixStats?.p1 ?? 18} câu (${((matrixStats?.p1 ?? 18) * 0.25).toFixed(2)} điểm)
- Phần II (Đúng/Sai 4 ý): ${matrixStats?.p2 ?? 4} câu (${((matrixStats?.p2 ?? 4) * 1.0).toFixed(2)} điểm)
- Phần III (Trả lời ngắn): ${matrixStats?.p3 ?? 6} câu (${((matrixStats?.p3 ?? 6) * 0.5).toFixed(2)} điểm)
- Tổng điểm: ${(matrixStats?.totalScore ?? 10).toFixed(2)} điểm

### Phân bố mức độ Bloom:
- Nhận biết: ${matrixStats?.nb ?? 0} câu (${matrixStats?.nbPct ?? 0}%)
- Thông hiểu: ${matrixStats?.th ?? 0} câu (${matrixStats?.thPct ?? 0}%)
- Vận dụng: ${matrixStats?.vd ?? 0} câu (${matrixStats?.vdPct ?? 0}%)
- Vận dụng cao: ${matrixStats?.vdc ?? 0} câu (${matrixStats?.vdcPct ?? 0}%)

# BẢN ĐẶC TẢ CHI TIẾT CÂU HỎI
${(originalQuestions || []).map((q, idx) => `Câu ${idx + 1} [${(q.level || 'TH').toUpperCase()}]: ${q.q ? q.q.slice(0, 90) : ''}...`).join('\n')}
  `.trim();

  try {
    const matrixBlob = await buildMatrixDocBlob({
      title: `Khung-Ma-Tran-Dac-Ta-${safeFilename(finalHeader?.examName || examTitle)}`,
      content: matrixContent,
      subject,
      grade,
      schoolName,
    });
    zip.file(`Khung-Ma-Tran-Dac-Ta.docx`, matrixBlob);
  } catch (err) {
    console.warn('Lỗi thêm ma trận vào ZIP:', err);
  }

  const omrHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phiếu Trả Lời Trắc Nghiệm OMR A4</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: 'Times New Roman', serif; text-align: center; }
  </style>
</head>
<body>
  <h2>${schoolName.toUpperCase()}</h2>
  <h3>PHIẾU TRẢ LỜI TRẮC NGHIỆM GDPT 2025</h3>
  <p>Môn: ${subject} - Khối: ${grade}</p>
</body>
</html>`;
  zip.file('Mau-Phieu-To-OMR-A4.html', omrHtml);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `Goi-Ky-Thi-GDPT2025-${safeFilename(finalHeader?.examName || examTitle)}.zip`;
  saveAs(zipBlob, filename);
  return filename;
}

/* ============================================================
   4. EXPORT KẾ HOẠCH BÀI DẠY (CÔNG VĂN 5512/BGDĐT) RA WORD
   ============================================================ */
function markdownToDocxParagraphs(text) {
  const lines = String(text || '').split('\n');
  const paragraphs = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      paragraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace('### ', ''),
              bold: true,
              size: 24,
              color: '1E293B',
            }),
          ],
          spacing: { before: 120, after: 60 },
        })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace('## ', ''),
              bold: true,
              size: 26,
              color: '0F172A',
            }),
          ],
          spacing: { before: 160, after: 80 },
        })
      );
    } else if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: line.replace('# ', '').toUpperCase(),
              bold: true,
              size: 28,
              color: '000000',
            }),
          ],
          spacing: { before: 200, after: 120 },
        })
      );
    } else if (/^[I|V|X]+\.\s+/.test(line)) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              size: 25,
              color: '003366',
            }),
          ],
          spacing: { before: 140, after: 60 },
        })
      );
    } else if (/^\d+\.\s+/.test(line) || /^[a-d]\)\s+/.test(line)) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 60, after: 40 },
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletText = line.slice(2);
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: bulletText.replace(/\*\*(.*?)\*\*/g, '$1'),
              size: 24,
            }),
          ],
          spacing: { before: 40, after: 40 },
        })
      );
    } else {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const runs = parts.map((p) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return new TextRun({ text: p.slice(2, -2), bold: true, size: 24 });
        }
        return new TextRun({ text: p, size: 24 });
      });

      paragraphs.push(
        new Paragraph({
          children: runs,
          spacing: { before: 40, after: 40 },
        })
      );
    }
  }

  return paragraphs;
}

export async function exportLessonPlanDocx({
  title = 'KẾ HOẠCH BÀI DẠY (CÔNG VĂN 5512/BGDĐT)',
  content = '',
  teacherName = 'Giáo viên bộ môn',
  schoolName = 'TRƯỜNG THPT',
  subject = '',
  grade = '',
}) {
  const headerPars = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: schoolName.toUpperCase(), bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'TỔ BỘ MÔN CHUYÊN MÔN', italics: true, size: 20 }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'KẾ HOẠCH BÀI DẠY (GIÁO ÁN)', bold: true, size: 28 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '(Chuẩn hóa theo Công văn 5512/BGDĐT-GDTrH - Chương trình GDPT 2025)',
          italics: true,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Tên bài dạy: ${title}`,
          bold: true,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Môn: ${subject || 'Khoa học'} | Khối lớp: ${grade || '12'} | Giáo viên thực hiện: ${teacherName}`,
          italics: true,
          size: 22,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  const bodyPars = markdownToDocxParagraphs(content);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1417 },
          },
        },
        children: [...headerPars, ...bodyPars],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${safeFilename(title || 'Giao-An-5512')}.docx`;
  saveAs(blob, filename);
  return filename;
}

/* ============================================================
   5. EXPORT KHUNG MA TRẬN & BẢN ĐẶC TẢ ĐỀ THI RA WORD
   ============================================================ */
export async function buildMatrixDocBlob({
  content = '',
  subject = '',
  grade = '',
  schoolName = 'TRƯỜNG THPT',
}) {
  const headerPars = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: schoolName.toUpperCase(), bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'KHUNG MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ',
          bold: true,
          size: 26,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '(Định dạng chuẩn 3 phần GDPT 2025: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Trả lời ngắn)',
          italics: true,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Môn: ${subject || 'Bộ môn'} | Khối: ${grade || '12'}`,
          bold: true,
          size: 22,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  const bodyPars = markdownToDocxParagraphs(content);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1417 },
          },
        },
        children: [...headerPars, ...bodyPars],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function exportMatrixDocx({
  title = 'KHUNG MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA',
  content = '',
  subject = '',
  grade = '',
  schoolName = 'TRƯỜNG THPT',
}) {
  const blob = await buildMatrixDocBlob({ content, subject, grade, schoolName });
  const filename = `${safeFilename(title || 'Ma-Tran-Dac-Ta-2025')}.docx`;
  saveAs(blob, filename);
  return filename;
}
