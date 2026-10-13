/* ============================================================
   examExport.js — Xuất đề thi ra Word, PDF
   ------------------------------------------------------------
   Hỗ trợ:
     • exportToWord()   — Tạo file .docx
     • exportToPDF()    — Tạo file PDF (qua html2canvas + jsPDF)
     • exportBundleZip() — Gộp 4 mã đề + bảng đáp án vào 1 ZIP
   ============================================================ */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ============================================================
   HELPER: Tạo filename an toàn
   ============================================================ */
function safeFilename(name) {
  return String(name || 'de-thi')
    .replace(/[^\w\s\u00C0-\u024F\u1EA0-\u1EF9-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

/* ============================================================
   1. EXPORT WORD (.docx)
   ============================================================ */
export async function exportToWord({
  examTitle = 'Đề kiểm tra',
  subject = 'Hóa học',
  duration = 45,
  code = '101',
  questions = [],
  includeAnswers = true,
}) {
  const children = [];

  // --- HEADER ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'SỞ GD&ĐT TỈNH / TRƯỜNG THPT', bold: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: examTitle.toUpperCase(), bold: true, size: 26 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Môn: ${subject}`, italics: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Thời gian làm bài: ${duration} phút`, italics: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `MÃ ĐỀ: ${code}`, bold: true, size: 26 }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Họ và tên thí sinh: ............................................................... Số báo danh: ...............',
          italics: true,
          size: 22,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  );

  // --- QUESTIONS ---
  questions.forEach((q, idx) => {
    // Câu hỏi
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Câu ${idx + 1}: `, bold: true, size: 24 }),
          new TextRun({ text: String(q.q || ''), size: 24 }),
        ],
      }),
    );

    // Options (single_choice)
    if ((q.type || 'single_choice') === 'single_choice' && Array.isArray(q.options)) {
      q.options.forEach((opt, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx);
        children.push(
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `${letter}. `, bold: true, size: 24 }),
              new TextRun({ text: String(opt || ''), size: 24 }),
            ],
          }),
        );
      });
    }

    // True/False
    if (q.type === 'true_false' && Array.isArray(q.statements)) {
      q.statements.forEach((st, sIdx) => {
        const letter = 'abcd'[sIdx];
        children.push(
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `${letter}) `, bold: true, size: 24 }),
              new TextRun({ text: String(st.text || ''), size: 24 }),
              new TextRun({ text: '   Đ/S: ____', size: 24 }),
            ],
          }),
        );
      });
    }

    // Short answer
    if (q.type === 'short_answer') {
      children.push(
        new Paragraph({
          indent: { left: 720 },
          children: [
            new TextRun({ text: 'Trả lời: ...................................................', size: 24 }),
          ],
        }),
      );
    }

    children.push(new Paragraph({ text: '' }));
  });

  // --- ANSWER KEY ---
  if (includeAnswers) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'BẢNG ĐÁP ÁN THAM KHẢO', bold: true, size: 26 }),
        ],
      }),
      new Paragraph({ text: '' }),
    );

    // Single choice table
    const scQs = questions.filter((q) => (q.type || 'single_choice') === 'single_choice');
    if (scQs.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Phần trắc nghiệm:', bold: true, size: 22 })],
        }),
      );

      const rows = [];
      // Header row
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 600, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Câu', bold: true })] })],
            }),
            ...scQs.map((_, i) =>
              new TableCell({
                width: { size: 600, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i + 1), bold: true })] })],
              })
            ),
          ],
        })
      );
      // Answer row
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đáp án', bold: true })] })],
            }),
            ...scQs.map((q) =>
              new TableCell({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: String.fromCharCode(65 + (q.correct || 0)), bold: true, color: 'b91c1c' })],
                  }),
                ],
              })
            ),
          ],
        })
      );

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4 },
            bottom: { style: BorderStyle.SINGLE, size: 4 },
            left: { style: BorderStyle.SINGLE, size: 4 },
            right: { style: BorderStyle.SINGLE, size: 4 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2 },
            insideVertical: { style: BorderStyle.SINGLE, size: 2 },
          },
        })
      );
    }
  }

  // --- BUILD DOC ---
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // 2cm
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${safeFilename(examTitle)}-Ma${code}.docx`;
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

  // Chụp DOM thành canvas
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
  const imgWidth = pageWidth - 20; // margin 10mm mỗi bên
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10; // margin top

  // Trang đầu
  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= (pageHeight - 20);

  // Các trang tiếp theo nếu dài
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
  duration = 45,
  versions = [],  // [{ code, questions }]
}) {
  // Dynamic import JSZip chỉ khi cần
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const version of versions) {
    const blob = await createWordBlob({
      examTitle,
      subject,
      duration,
      code: version.code,
      questions: version.questions,
      includeAnswers: true,
    });
    zip.file(`${safeFilename(examTitle)}-Ma${version.code}.docx`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `${safeFilename(examTitle)}-4-Ma-De.zip`;
  saveAs(zipBlob, filename);
  return filename;
}

/* ============================================================
   HELPER: Tạo Word blob (không save)
   ============================================================ */
async function createWordBlob({ examTitle, subject, duration, code, questions, includeAnswers }) {
  const children = [];

  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: examTitle.toUpperCase(), bold: true, size: 26 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Môn: ${subject}`, italics: true, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Thời gian: ${duration} phút`, italics: true, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `MÃ ĐỀ: ${code}`, bold: true, size: 26 })] }),
    new Paragraph({ text: '' }),
  );

  questions.forEach((q, idx) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Câu ${idx + 1}: `, bold: true }),
          new TextRun({ text: String(q.q || '') }),
        ],
      })
    );
    if ((q.type || 'single_choice') === 'single_choice') {
      (q.options || []).forEach((opt, oIdx) => {
        children.push(
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: `${String.fromCharCode(65 + oIdx)}. `, bold: true }),
              new TextRun({ text: String(opt) }),
            ],
          })
        );
      });
    }
    children.push(new Paragraph({ text: '' }));
  });

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBlob(doc);
}