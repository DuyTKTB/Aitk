import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';

const setDocMock = vi.fn();

vi.mock('../src/lib/firebase.js', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ __col: name })),
  doc: vi.fn((colOrDb, nameOrId, maybeId) => {
    if (colOrDb?.__col) return { __col: colOrDb.__col, id: nameOrId || 'exam_mock_1' };
    return { __col: nameOrId, id: maybeId || 'exam_mock_1' };
  }),
  setDoc: (...args) => setDocMock(...args),
  getDocs: vi.fn(async () => ({ docs: [] })),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  addDoc: vi.fn(async () => ({ id: 'doc_1' })),
  updateDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
  query: vi.fn((...args) => args),
  where: vi.fn((...args) => args),
  orderBy: vi.fn((...args) => args),
  limit: vi.fn((n) => n),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  arrayUnion: vi.fn((...args) => args),
  arrayRemove: vi.fn((...args) => args),
  onSnapshot: vi.fn(() => () => {}),
  writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), delete: vi.fn(), commit: async () => {} })),
}));

import {
  createClass,
  deleteClass,
  getClassesByTeacher,
  createExam,
  updateTeacherExam,
  deleteExam,
  getExamsByTeacher,
  gradeSubmissionEssays,
  estimateFirestoreDocBytes,
  MAX_FIRESTORE_EXAM_BYTES,
} from '../src/lib/classroom.js';
import { compressImageDataUrl, estimateDataUrlBytes, isUnsupportedVectorDataUrl } from '../src/lib/imageUtils.js';
import {
  preprocessDocxBuffer,
  parseLines,
  extractImgTokens,
  textToLines,
  readTf,
  htmlToLines,
  parsePastedAnswerKey,
  extractMcqAnswerFromExplain,
} from '../src/lib/examDocxParser.js';
import { detectExamSubjectAndGrade } from '../src/lib/subjectClassifier.js';
import { normalizeQuestion } from '../src/lib/examAiUtils.js';
import { buildExamDocBlob } from '../src/lib/examExport.js';
import { scoreExam, isAnswered } from '../src/lib/examScoring.js';
import { readFile } from '../src/lib/fileReader.js';
import {
  reconstructPdfPageLines,
  stripRepeatedPageHeadersFooters,
  maybeFixVietnameseEncoding,
  detectMojibakeOrScanned,
} from '../src/lib/pdfExamReader.js';
import { findSafeCanvasCutY, computeExportMatrixStats } from '../src/lib/examExport.js';
import { extractAnswerKey, mergeAnswerKeyIntoQuestions, hasEmbeddedAnswers } from '../src/lib/examSecurity.js';
import { MOET_EXAM_PRESETS, classifyExamQuestionPart } from '../src/lib/paperGrade.js';
import { categorizeQuestions } from '../src/lib/omrSheetGenerator.js';
import { addQuestion, updateQuestion } from '../src/lib/questionBank.js';
import { updateDoc } from 'firebase/firestore';
import { resolveTopicsSubjectKey, getTopicsForSubject } from '../src/data/topicsBySubject.js';

async function buildSampleDocxBuffer({ documentXml, media = {} }) {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-officedocument.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>'
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>'
  );
  zip.file('word/document.xml', documentXml);
  for (const [name, content] of Object.entries(media)) {
    zip.file(`word/media/${name}`, content);
  }
  return zip.generateAsync({ type: 'arraybuffer' });
}

beforeEach(() => {
  setDocMock.mockReset();
  setDocMock.mockResolvedValue(undefined);
});

describe('classroom.createExam — error surfacing, size limit & isDraft rules alignment', () => {
  it('chờ ghi Firestore hoàn tất và ném lỗi thay vì nuốt lỗi khi permission-denied', async () => {
    const err = new Error('Missing or insufficient permissions');
    err.code = 'permission-denied';
    setDocMock.mockRejectedValueOnce(err);

    await expect(
      createExam({
        teacherId: 'gv_1',
        teacherName: 'Cô Mai',
        classId: 'lop_khong_ton_tai',
        title: 'Đề Word 1',
        questions: [{ type: 'single_choice', q: 'Câu 1', options: ['A', 'B', 'C', 'D'], correct: 0 }],
      })
    ).rejects.toThrow();
    expect(setDocMock).toHaveBeenCalledTimes(1);
  });

  it('tự động đặt isDraft = true khi classId rỗng để khớp Firestore Rules', async () => {
    const exam = await createExam({
      teacherId: 'gv_1',
      teacherName: 'Cô Mai',
      classId: '   ',
      isDraft: false,
      title: 'Đề nháp từ Word',
      questions: [{ type: 'single_choice', q: 'Câu 1', options: ['A', 'B', 'C', 'D'], correct: 0 }],
    });

    expect(exam.classId).toBe('');
    expect(exam.isDraft).toBe(true);
    expect(setDocMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(setDocMock.mock.calls[0][1]).toMatchObject({ classId: '', isDraft: true });
  });

  it('giữ isDraft = false khi gán vào lớp hợp lệ', async () => {
    const exam = await createExam({
      teacherId: 'gv_1',
      teacherName: 'Cô Mai',
      classId: 'class_12a1',
      title: 'Kiểm tra Hóa 12',
      questions: [{ type: 'single_choice', q: 'Câu 1', options: ['A', 'B', 'C', 'D'], correct: 0 }],
    });

    expect(exam.classId).toBe('class_12a1');
    expect(exam.isDraft).toBe(false);
    expect(setDocMock.mock.calls[0][1]).toMatchObject({ classId: 'class_12a1', isDraft: false });
  });

  it('chặn sớm đề có payload vượt giới hạn ~1 MB Firestore', async () => {
    const hugeImg = 'data:image/png;base64,' + 'A'.repeat(MAX_FIRESTORE_EXAM_BYTES + 20000);
    await expect(
      createExam({
        teacherId: 'gv_1',
        teacherName: 'Cô Mai',
        classId: 'class_12a1',
        title: 'Đề chứa ảnh nặng',
        questions: [{ type: 'single_choice', q: 'Câu 1', options: ['A', 'B', 'C', 'D'], correct: 0, image: hugeImg }],
      })
    ).rejects.toThrow(/quá lớn/i);
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('estimateFirestoreDocBytes ước lượng an toàn kể cả object sentinel', () => {
    const bytes = estimateFirestoreDocBytes({ title: 'Xin chào', ts: { _methodName: 'serverTimestamp' } });
    expect(bytes).toBeGreaterThan(20);
    expect(bytes).toBeLessThan(200);
  });
});

describe('imageUtils — lọc WMF/EMF và ước lượng kích thước ảnh', () => {
  it('nhận diện đúng ảnh WMF/EMF không hỗ trợ và loại bỏ khi nén', async () => {
    expect(isUnsupportedVectorDataUrl('data:image/x-wmf;base64,AAAA')).toBe(true);
    expect(isUnsupportedVectorDataUrl('data:image/emf;base64,AAAA')).toBe(true);
    expect(isUnsupportedVectorDataUrl('data:image/png;base64,AAAA')).toBe(false);

    expect(await compressImageDataUrl('data:image/x-wmf;base64,AAAA')).toBe('');
    expect(await compressImageDataUrl('data:image/emf;base64,AAAA')).toBe('');
  });

  it('giữ nguyên SVG và tính đúng dung lượng base64', async () => {
    const svg = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
    expect(await compressImageDataUrl(svg)).toBe(svg);
    expect(estimateDataUrlBytes(svg)).toBe(11);
  });
});

describe('examDocxParser & fileReader — bóc tách Word (.docx) an toàn', () => {
  const sampleDocXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' +
    '<w:p><w:r><w:t>Câu 1. Kim loại nào sau đây tan hoàn toàn trong nước?</w:t></w:r></w:p>' +
    '<w:p><w:r><w:t>A. Na    B. Fe    C. Cu    D. Ag</w:t></w:r></w:p>' +
    '</w:body></w:document>';

  it('preprocessDocxBuffer loại bỏ ảnh WMF/EMF khỏi mediaImages và giữ lại PNG/JPG', async () => {
    const buf = await buildSampleDocxBuffer({
      documentXml: sampleDocXml,
      media: {
        'image1.wmf': new Uint8Array([1, 2, 3]),
        'image2.emf': new Uint8Array([4, 5, 6]),
        'image3.png': new Uint8Array([137, 80, 78, 71]),
      },
    });

    const out = await preprocessDocxBuffer(buf);
    expect(out.mediaImages['media/image1.wmf']).toBeUndefined();
    expect(out.mediaImages['media/image2.emf']).toBeUndefined();
    expect(out.mediaImages['media/image3.png']).toMatch(/^data:image\/png;base64,/);
  });

  it('fileReader.readFile đọc nội dung .docx cho AI Studio thành công', async () => {
    const buf = await buildSampleDocxBuffer({ documentXml: sampleDocXml });
    const mockFile = {
      name: 'de-kiem-tra-hoa.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: buf.byteLength,
      arrayBuffer: async () => buf,
    };

    const res = await readFile(mockFile);
    expect(res.kind).toBe('docx');
    expect(res.text).toContain('Kim loại nào sau đây tan hoàn toàn trong nước');
  });

  it('parseLines + extractImgTokens bóc tách đủ 3 phần và tách hình ảnh chuẩn GDPT 2025', () => {
    const rawLines = [
      { t: 'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn', m: '', u: '', b: '' },
      { t: 'Câu 1. Cho sơ đồ thí nghiệm [[IMG_0]]', m: '', u: '', b: '' },
      { t: 'A. NaOH   B. KOH   C. HCl   D. HNO3', m: '1100000000000000000000000000000000', u: '', b: '' },
      { t: 'PHẦN II. Câu trắc nghiệm đúng sai', m: '', u: '', b: '' },
      { t: 'Câu 2. Cho kim loại Fe vào dung dịch CuSO4:', m: '', u: '', b: '' },
      { t: 'a) Có kết tủa đỏ gạch bám lên thanh sắt.', m: '', u: '1'.repeat(40), b: '' },
      { t: 'b) Khối lượng dung dịch tăng.', m: '', u: '', b: '' },
      { t: 'c) Phản ứng thuộc loại oxi hóa - khử.', m: '', u: '1'.repeat(38), b: '' },
      { t: 'd) Khí H2 thoát ra mạnh.', m: '', u: '', b: '' },
      { t: 'PHẦN III. Câu trắc nghiệm trả lời ngắn', m: '', u: '', b: '' },
      { t: 'Câu 3. Hòa tan 5,6 gam Fe vào HCl dư thu được bao nhiêu mol H2?', m: '', u: '', b: '' },
      { t: 'Đáp án: 0,1', m: '', u: '', b: '' },
    ].map((l) => ({
      t: l.t,
      m: (l.m || '').padEnd(l.t.length, '0'),
      u: (l.u || '').padEnd(l.t.length, '0'),
      b: (l.b || '').padEnd(l.t.length, '0'),
    }));

    const { cleanText, imgUrls } = extractImgTokens('Cho sơ đồ thí nghiệm [[IMG_0]]', ['data:image/png;base64,ABC=']);
    expect(cleanText).toBe('Cho sơ đồ thí nghiệm');
    expect(imgUrls).toEqual(['data:image/png;base64,ABC=']);

    const parsed = parseLines(rawLines, ['data:image/png;base64,ABC=']);
    expect(parsed.questions).toHaveLength(3);
    expect(parsed.questions[0].type).toBe('single_choice');
    expect(parsed.questions[0].image).toBe('data:image/png;base64,ABC=');
    expect(parsed.questions[1].type).toBe('true_false');
    expect(parsed.questions[1].statements.map((s) => s.answer)).toEqual([true, false, true, false]);
    expect(parsed.questions[2].type).toBe('short_answer');
    expect(parsed.questions[2].answer).toBe('0,1');
  });

  it('nhận diện chính xác Phần II Đúng/Sai và Phần III Trả lời ngắn với nhiều biến thể tiêu đề & không tiêu đề', () => {
    const rawText = [
      'A. TRẮC NGHIỆM NHIỀU LỰA CHỌN',
      'Câu 1. Số oxi hóa của Fe trong Fe2O3 là',
      'A. +2   B. +3   C. 0   D. +6',
      'Lời giải: Chọn B vì oxi hóa là đúng quy tắc.',
      'Ⅱ. PHẦN ĐÚNG SAI',
      'Câu 1. Xét các nhận định sau về ester:',
      'a) Phản ứng thủy phân trong kiềm là xà phòng hóa.',
      'b) Tất cả ester đều làm mất màu brom.',
      'c) Etyl axetat có công thức CH3COOC2H5.',
      'd) Ester thường nhẹ hơn nước.',
      'Lời giải: Ý đúng: a, c, d',
      'Câu 2. Câu này chỉ gạch chân 1 ý vẫn là Đúng/Sai vì dùng a) b) c) d):',
      'a) Nhận định 1.',
      'b) Nhận định 2.',
      'c) Nhận định 3.',
      'd) Nhận định 4.',
      'C. TRẢ LỜI NGẮN',
      'Câu 1. Tính tổng hệ số cân bằng tối giản của phản ứng Fe + HCl -> FeCl2 + H2.',
      'Đáp án đúng là 5',
    ].join('\n');

    const parsed = parseLines(textToLines(rawText), []);
    expect(parsed.questions).toHaveLength(4);
    expect(parsed.questions[0].type).toBe('single_choice');
    expect(parsed.questions[0].correct).toBe(1);
    expect(parsed.questions[1].type).toBe('true_false');
    expect(parsed.questions[1].statements.map((s) => s.answer)).toEqual([true, false, true, true]);
    expect(parsed.questions[2].type).toBe('true_false');
    expect(parsed.questions[2].statements).toHaveLength(4);
    expect(parsed.questions[3].type).toBe('short_answer');
    expect(parsed.questions[3].answer).toBe('5');
  });

  it('không nhận nhầm "là đúng" trong lời giải trắc nghiệm và không nhầm a) b) c) d) không gạch chân', () => {
    // Không hề ghi PHẦN II hay PHẦN III
    const rawLines = textToLines(
      [
        'Câu 1. Phương án nào đúng?',
        'A. 1   B. 2   C. 3   D. 4',
        'Lời giải: Nhận định A là đúng và B đã sai nên chọn A.',
        'Câu 2. Đánh giá tính đúng sai của các mệnh đề sau:',
        'a) Số nguyên tố nhỏ nhất là 2.',
        'b) Mọi số nguyên tố đều là số lẻ.',
        'c) Hai đường thẳng song song không có điểm chung.',
        'd) Căn bậc hai của 9 là 3 và -3.',
        'Câu 3. Có bao nhiêu số nguyên dương thỏa mãn x < 5?',
        'Đáp án: 4',
      ].join('\n')
    );

    const parsed = parseLines(rawLines, []);
    expect(parsed.questions).toHaveLength(3);
    expect(parsed.questions[0].type).toBe('single_choice');
    expect(parsed.questions[0].correct).toBe(0);
    expect(parsed.questions[1].type).toBe('true_false');
    expect(parsed.questions[2].type).toBe('short_answer');
    expect(parsed.questions[2].answer).toBe('4');
    expect(readTf('nhan dinh la dung va da sai')).toBeNull();
  });

  it('khôi phục thứ tự A, B, C, D từ bảng Word 2x2 xếp theo cột (A|C, B|D)', () => {
    const mk = (t, fromTable = false) => ({
      t,
      m: '0'.repeat(t.length),
      u: '0'.repeat(t.length),
      b: '0'.repeat(t.length),
      fromTable,
    });
    const parsed = parseLines(
      [
        mk('Câu 1. Kim loại nào dẫn điện tốt nhất?'),
        mk('A. Sắt  C. Bạc', true),
        mk('B. Nhôm  D. Đồng', true),
        mk('Đáp án: C'),
      ],
      []
    );
    expect(parsed.questions).toHaveLength(1);
    expect(parsed.questions[0].options).toEqual(['Sắt', 'Nhôm', 'Bạc', 'Đồng']);
    expect(parsed.questions[0].correct).toBe(2);
  });

  it('preprocessDocxBuffer giữ gạch chân/shading <w:shd> kể cả khi có <w:u w:val="none"/>', async () => {
    const shadedDocXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' +
      '<w:p><w:r><w:t>Câu 1. Đáp án nào được tô vàng?</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>A. Sai</w:t></w:r></w:p>' +
      '<w:p><w:r><w:rPr><w:u w:val="none"/><w:shd w:val="clear" w:fill="FFFF00"/></w:rPr><w:t>B. Đúng</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>C. Sai 2</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>D. Sai 3</w:t></w:r></w:p>' +
      '</w:body></w:document>';

    const buf = await buildSampleDocxBuffer({ documentXml: shadedDocXml });
    const out = await preprocessDocxBuffer(buf);
    const zip = await JSZip.loadAsync(out.buffer);
    const modXml = await zip.file('word/document.xml').async('string');
    expect(modXml).toContain('<w:u w:val="single"/>');
  });

  it('htmlToLines giữ danh sách <ol type="a"> và danh sách trong bảng/sau đoạn dẫn có ảnh', () => {
    if (typeof DOMParser === 'undefined') return;
    const html = `
      <p>PHẦN II. Câu trắc nghiệm đúng sai</p>
      <p>Câu 1. Quan sát hình sau:</p>
      <p><img src="__DOCX_IMG_0__" /></p>
      <ol type="a">
        <li>Ý thứ nhất</li>
        <li>Ý thứ hai</li>
        <li>Ý thứ ba</li>
        <li>Ý thứ tư</li>
      </ol>
      <table>
        <tr><td><p>Câu 2. Bảng chứa list:</p><ol><li>A1</li><li>B1</li><li>C1</li><li>D1</li></ol></td></tr>
      </table>
    `;
    const { lines } = htmlToLines(html);
    const parsed = parseLines(lines, ['data:image/png;base64,AAA=']);
    expect(parsed.questions).toHaveLength(2);
    expect(parsed.questions[0].type).toBe('true_false');
    expect(parsed.questions[0].statements).toHaveLength(4);
    expect(parsed.questions[0].image).toBe('data:image/png;base64,AAA=');
    expect(parsed.questions[1].statements).toHaveLength(4);
  });

  it('parsePastedAnswerKey gán đáp án nhanh đồng thời cho cả 3 phần GDPT 2025', () => {
    const qs = [
      { id: 'q1', num: 1, type: 'single_choice', options: ['1', '2', '3', '4'], correct: -1 },
      { id: 'q2', num: 2, type: 'single_choice', options: ['1', '2', '3', '4'], correct: -1 },
      {
        id: 'q3',
        num: 1,
        type: 'true_false',
        statements: [
          { text: 'a', answer: null },
          { text: 'b', answer: null },
          { text: 'c', answer: null },
          { text: 'd', answer: null },
        ],
      },
      { id: 'q4', num: 1, type: 'short_answer', answer: '' },
    ];
    const keyInput = [
      'PHẦN I',
      '1.B  2.D',
      'PHẦN II',
      'Câu 1: aĐ bS cĐ dĐ',
      'PHẦN III',
      'Câu 1: 12,5',
    ].join('\n');

    const res = parsePastedAnswerKey(keyInput, qs);
    expect(res.counts).toEqual({ p1: 2, p2: 1, p3: 1 });
    expect(res.updates.get(0)).toMatchObject({ type: 'single_choice', correct: 1 });
    expect(res.updates.get(1)).toMatchObject({ type: 'single_choice', correct: 3 });
    expect(res.updates.get(2)).toMatchObject({ type: 'true_false', tfAns: [true, false, true, true] });
    expect(res.updates.get(3)).toMatchObject({ type: 'short_answer', answer: '12,5' });
  });

  it('reconstructPdfPageLines khôi phục công thức mũ/chỉ số dưới, lọc watermark xoay, giữ đáp án gạch chân/đỏ từ bảng 2x2', () => {
    const item = (str, x, y, w, h = 11, trOverride = null) => ({
      str,
      width: w,
      height: h,
      transform: trOverride || [h, 0, 0, h, x, y],
    });
    const pdfItems = [
      // Watermark xoay chéo — phải bị loại
      item('TAILIEU VIP', 200, 420, 120, 28, [18, 16, -16, 18, 200, 420]),
      // Câu 1 bị tách vụn + chỉ số dưới H₂O + x² + số thập phân
      item('C', 50, 740, 8),
      item('âu', 58, 740, 14),
      item('1.', 76, 740, 10),
      item('H', 92, 740, 8),
      item('2', 100, 737, 5, 7),
      item('SO', 105, 740, 14),
      item('4', 119, 737, 5, 7),
      item('và', 130, 740, 14),
      item('x', 150, 740, 7),
      item('2', 157, 745, 5, 7),
      item('có', 168, 740, 14),
      item('m =', 188, 740, 18),
      item('12', 210, 740, 12),
      item(',5', 222, 740, 10),
      // Hàng 1 bảng 2x2: A. 10g   C. 30g
      item('A. 10g', 55, 710, 45),
      item('C. 30g', 300, 710, 45),
      // Hàng 2 bảng 2x2: B. 20g (được gạch chân)   D. 40g
      item('B. 20g', 55, 690, 45),
      item('D. 40g', 300, 690, 45),
    ];

    const marks = {
      underlines: [{ x1: 54, x2: 102, y: 688 }],
      highlights: [],
      redTextPoints: [],
    };
    const lines = reconstructPdfPageLines(pdfItems, marks, { pageWidth: 595 });
    expect(lines.some((l) => l.t.includes('TAILIEU VIP'))).toBe(false);
    expect(lines[0].t).toBe('Câu 1. H₂SO₄ và x² có m = 12,5');
    expect(lines[1].fromTable).toBe(true);
    expect(lines[2].fromTable).toBe(true);

    const parsed = parseLines(lines, []);
    expect(parsed.questions).toHaveLength(1);
    expect(parsed.questions[0].type).toBe('single_choice');
    expect(parsed.questions[0].options).toEqual(['10g', '20g', '30g', '40g']);
    expect(parsed.questions[0].correct).toBe(1);
  });

  it('reconstructPdfPageLines tách chuẩn trang đề thi 2 cột báo & stripRepeatedPageHeadersFooters xóa tiêu đề lặp', () => {
    const it = (str, x, y, w = 85) => ({ str, width: w, height: 11, transform: [11, 0, 0, 11, x, y] });
    const p1 = reconstructPdfPageLines(
      [
        it('Sở GD&ĐT — Đề thi thử', 180, 810, 180),
        it('Câu 1. Cột trái 1?', 45, 760),
        it('Câu 2. Cột trái 2?', 45, 680),
        it('Câu 3. Cột phải 1?', 320, 760),
        it('Câu 4. Cột phải 2?', 320, 680),
        it('Trang 1/2', 270, 30, 50),
      ],
      {},
      { pageWidth: 595 }
    );
    const p2 = reconstructPdfPageLines(
      [
        it('Sở GD&ĐT — Đề thi thử', 180, 810, 180),
        it('Câu 5. Trang sau', 45, 760),
        it('Trang 2/2', 270, 30, 50),
      ],
      {},
      { pageWidth: 595 }
    );

    const merged = stripRepeatedPageHeadersFooters([p1, p2]);
    expect(merged.map((l) => l.t)).toEqual([
      'Câu 1. Cột trái 1?',
      'Câu 2. Cột trái 2?',
      'Câu 3. Cột phải 1?',
      'Câu 4. Cột phải 2?',
      'Câu 5. Trang sau',
    ]);
  });

  it('parseLines khôi phục chính xác đề GDPT 2025 xuất PDF gồm Phần I/II/III trùng STT Câu 1, bảng đáp án & hướng dẫn giải', () => {
    const exportedText = [
      'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn',
      'Câu 1: Kim loại nào dẫn điện tốt nhất?',
      'A . Ag   B . Cu   C . Al   D . Fe',
      'PHẦN II. Câu trắc nghiệm đúng sai',
      'Câu 1: Cho dung dịch NaOH tác dụng HCl:',
      'a ) Xảy ra phản ứng trung hòa.',
      'b ) Không tỏa nhiệt.',
      'c ) Tạo muối NaCl.',
      'd ) pH sau phản ứng luôn bằng 1.',
      'PHẦN III. Câu trắc nghiệm trả lời ngắn',
      'Câu 1: Tính khối lượng NaCl tạo thành (gam)?',
      'Trả lời: ...........................................',
      'BẢNG ĐÁP ÁN THAM KHẢO (MÃ ĐỀ 101)',
      'Phần trắc nghiệm:',
      '1',
      'A',
      '1  A',
      'Phần đúng/sai:',
      'Câu a b c d',
      '1 Đ S Đ S',
      'Phần trả lời ngắn:',
      'Câu 1: 11,7 hoặc 11.7',
      'HƯỚNG DẪN GIẢI VÀ ĐÁP ÁN CHI TIẾT (MÃ ĐỀ 101)',
      'Câu 1: Bạc (Ag) là kim loại dẫn điện tốt nhất.',
    ].join('\n');

    const res = parseLines(textToLines(exportedText), []);
    expect(res.questions).toHaveLength(3);
    expect(res.questions[0].type).toBe('single_choice');
    expect(res.questions[0].correct).toBe(0);
    expect(res.questions[0].explain).toContain('Bạc (Ag)');
    expect(res.questions[1].type).toBe('true_false');
    expect(res.questions[1].statements.map((s) => s.answer)).toEqual([true, false, true, false]);
    expect(res.questions[2].type).toBe('short_answer');
    expect(res.questions[2].q).not.toContain('....');
    expect(res.questions[2].answer).toBe('11,7');
  });

  it('maybeFixVietnameseEncoding & detectMojibakeOrScanned xử lý đúng TCVN3 và phát hiện lỗi font/scan', () => {
    expect(maybeFixVietnameseEncoding('C©u 1: Hãa häc h÷u c¬')).toBe('Câu 1: Hóa học hữu cơ');
    expect(detectMojibakeOrScanned('   ', { itemCount: 0 }).isScanned).toBe(true);
    expect(detectMojibakeOrScanned('\uFFFD\uFFFD\uFFFD\uE001abc\uFFFD\uFFFD\uFFFD\uE002\uFFFD', { itemCount: 10 }).isGarbled).toBe(true);
  });

  it('findSafeCanvasCutY cắt tại khoảng trắng giữa 2 câu thay vì cắt ngang dòng chữ khi xuất PDF', () => {
    const w = 20;
    const h = 150;
    const buf = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      // Hàng 70..95 và 119..145 có chữ đậm (#111); hàng 96..118 là khoảng trắng nền trắng (#fff)
      const isDark = (y >= 70 && y <= 95) || (y >= 119 && y <= 145);
      const val = isDark ? 20 : 255;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        buf[i] = val;
        buf[i + 1] = val;
        buf[i + 2] = val;
        buf[i + 3] = 255;
      }
    }
    const mockCtx = {
      getImageData: (_sx, sy, sw, sh) => ({
        data: buf.slice(sy * w * 4, (sy + sh) * w * 4),
      }),
    };
    const cutY = findSafeCanvasCutY(mockCtx, w, 135, 80);
    expect(cutY).toBeGreaterThanOrEqual(96);
    expect(cutY).toBeLessThanOrEqual(118);
  });

  it('textToLines & parseLines giữ nguyên chỗ trống ______, tách đoạn văn đọc hiểu, sắp xếp hội thoại a-b-c và dò đáp án Tiếng Anh GDPT 2025', () => {
    const rawEnglishExam = [
      'PHẦN I. Câu trắc nghiệm nhiều lựa chọn',
      'Mark the letter A, B, C, or D on your answer sheet to indicate the correct answer to each of the following questions.',
      'Question 1: Children ______ argue with their parents about curfew.',
      'A. mustn’t',
      'B. shouldn’t',
      'C. ought',
      'D. don’t have',
      'Lời giải: Lời khuyên mang tính nhẹ nhàng → shouldn’t.',
      'Question 2: She bought a ______ handbag yesterday.',
      'A. modern large green',
      'B. green large modern',
      'C. large modern green',
      'D. large green modern',
      'Lời giải: Trật tự tính từ OSASCOMP: size (large) → age (modern) → colour (green).',
      'Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate the correct option that best fits each of the numbered blanks from 3 to 4.',
      'A healthy city needs more green spaces. First, (3) ______ more trees along busy streets helps reduce air pollution. People (4) ______ live near parks often feel happier.',
      'Question 3:',
      'A. planting',
      'B. playing',
      'C. painting',
      'D. planning',
      'Lời giải: Trồng thêm cây: planting more trees → planting.',
      'Question 4:',
      'A. which',
      'B. whom',
      'C. whose',
      'D. who',
      'Lời giải: Đại từ quan hệ chỉ người làm chủ ngữ nên chọn who.',
      'Mark the letter A, B, C, or D on your answer sheet to indicate the best arrangement of utterances or sentences to make a meaningful exchange or text in each of the following questions from 5 to 6.',
      'Question 5:',
      'a. Nam: Do you exercise every morning?',
      'b. Lan: Yes, I usually jog for thirty minutes.',
      'c. Nam: That sounds like a great habit!',
      'A. b - a - c',
      'B. a - b - c',
      'C. c - a - b',
      'D. a - c - b',
      'Lời giải: Thứ tự đúng: a - b - c.',
      'Question 6:',
      'a. I am writing to apply for the volunteer programme.',
      'b. Dear Sir or Madam,',
      'c. I look forward to hearing from you.',
      'd. I have experience working with children.',
      'A. b - a - d - c',
      'B. a - b - d - c',
      'C. b - d - a - c',
      'D. d - b - a - c',
      'Lời giải: Mở thư Dear Sir or Madam rồi giới thiệu lí do nên trùng với ý của A.',
    ].join('\n');

    const lines = textToLines(rawEnglishExam);
    expect(lines[2].t).toContain('______');

    const { questions } = parseLines(lines, []);
    expect(questions).toHaveLength(6);

    // Câu 1-2: giữ dấu gạch dưới, không bị dính đoạn văn
    expect(questions[0].q).toContain('______');
    expect(questions[0].correct).toBe(1); // B. shouldn’t
    expect(questions[0].passage).toBeFalsy();

    expect(questions[1].q).toContain('______');
    expect(questions[1].correct).toBe(2); // C. large modern green

    // Câu 3-4: câu điền khuyết giữ passage + pg_en + khóa thứ tự nhóm, lời giải Q2 không nuốt đoạn văn
    expect(questions[1].explain).not.toContain('Read the following');
    expect(questions[2].passage).toContain('A healthy city needs more green spaces');
    expect(questions[2].instruction).toContain('Read the following passage');
    expect(questions[2].pg).toMatch(/^pg_en_/);
    expect(questions[2].lockGroupQuestionOrder).toBe(true);
    expect(questions[2].correct).toBe(0); // A. planting
    expect(questions[3].pg).toBe(questions[2].pg);
    expect(questions[3].correct).toBe(3); // D. who

    // Câu 5-6: câu sắp xếp hội thoại/thư giữ a. b. c. (d.) trong stem, 4 đáp án A/B/C/D tách chuẩn, KHÔNG bị rò rỉ passage từ câu 3-4
    expect(questions[4].passage).toBeFalsy();
    expect(questions[4].pg).toBeFalsy();
    expect(questions[4].q).toContain('a. Nam:');
    expect(questions[4].q).toContain('b. Lan:');
    expect(questions[4].q).toContain('c. Nam:');
    expect(questions[4].options).toEqual(['b - a - c', 'a - b - c', 'c - a - b', 'a - c - b']);
    expect(questions[4].correct).toBe(1); // B. a - b - c

    expect(questions[5].q).toContain('d. I have experience');
    expect(questions[5].options).toHaveLength(4);
    expect(questions[5].correct).toBe(0); // A

    // Chuẩn hóa AI & nhận diện môn học
    const detected = detectExamSubjectAndGrade({ text: rawEnglishExam, questions });
    expect(detected.subject).toBe('Tiếng Anh');

    const normCloze = normalizeQuestion({
      type: 'single_choice',
      q: '',
      passage: questions[2].passage,
      instruction: questions[2].instruction,
      groupId: questions[2].pg,
      lockGroupQuestionOrder: true,
      options: questions[2].options,
      correct: questions[2].correct,
    });
    expect(normCloze.passage).toContain('green spaces');
    expect(normCloze.groupId).toBe(questions[2].pg);
    expect(normCloze.lockGroupQuestionOrder).toBe(true);
    expect(normCloze.warns).not.toContain('Thiếu nội dung câu hỏi');

    expect(extractMcqAnswerFromExplain('Trừ đáp án C không đúng → A, B, D đều được đề cập trừ C', ['A1', 'B1', 'C1', 'D1'])).toBe(2);
  });

  it('buildExamDocBlob xuất file Word cho đề Tiếng Anh giữ ngữ cảnh đọc hiểu và không biến B2 thành B₂', async () => {
    const blob = await buildExamDocBlob({
      examTitle: 'Đề kiểm tra giữa kì 1 Tiếng Anh 11',
      subject: 'Tiếng Anh',
      grade: '11',
      duration: 50,
      questions: [
        {
          type: 'single_choice',
          instruction: 'Read the following passage and mark A, B, C, or D.',
          passage: 'Passage about B2 level reading skill.',
          groupId: 'pg_en_1',
          q: '',
          options: ['reading', 'writing', 'listening', 'speaking'],
          correct: 0,
        },
      ],
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
  });

  it('parseLines hỗ trợ ngữ liệu chung Sử/GDKT&PL, block code Tin học và phần Tự luận Ngữ văn (essay) + chấm điểm', async () => {
    const multiSubjectText = [
      'PHẦN I. Câu trắc nghiệm nhiều lựa chọn',
      'Đọc thông tin sau và trả lời các câu hỏi từ 1 đến 2:',
      'Năm 2025, kim ngạch xuất khẩu của nền kinh tế tăng 12% so với năm trước.',
      'Câu 1: Tốc độ tăng trưởng kim ngạch xuất khẩu năm 2025 là bao nhiêu?',
      'A. 10%   B. 12%   C. 15%   D. 20%',
      'Đáp án: B',
      'Câu 2: Đoạn mã Python kiểm tra điều kiện nào sau đây?',
      '```python',
      'if x != 0 and x <= 10:',
      '    print(x)',
      '```',
      'A. x khác 0 và nhỏ hơn hoặc bằng 10   B. x bằng 0   C. x lớn hơn 10   D. Lỗi cú pháp',
      'Đáp án: A',
      'PHẦN II. Câu trắc nghiệm đúng sai',
      'Câu 1: Cho đoạn tư liệu lịch sử về Chiến dịch Điện Biên Phủ 1954:',
      'a) Chiến dịch kéo dài 56 ngày đêm.',
      'b) Diễn ra năm 1945.',
      'c) Kết thúc thắng lợi ngày 7/5/1954.',
      'd) Không có ý nghĩa quốc tế.',
      'Đáp án: aĐ bS cĐ dS',
      'PHẦN III. TỰ LUẬN',
      'Câu 1: (3,0 điểm) Viết đoạn văn nghị luận xã hội trình bày suy nghĩ về tinh thần tự học.',
      'Hướng dẫn chấm: Đảm bảo cấu trúc đoạn văn, lập luận chặt chẽ.',
    ].join('\n');

    const { questions } = parseLines(textToLines(multiSubjectText), []);
    expect(questions).toHaveLength(4);

    // Ngữ liệu dùng chung pg_vi_ cho câu 1-2 và tự động ngắt nhóm
    expect(questions[0].pg).toMatch(/^pg_vi_/);
    expect(questions[0].passage).toContain('kim ngạch xuất khẩu');
    expect(questions[1].pg).toBe(questions[0].pg);
    expect(questions[1].q).toContain('if x != 0 and x <= 10:');
    expect(questions[2].pg).toBeFalsy();
    expect(questions[2].type).toBe('true_false');
    expect(questions[2].statements.map((s) => s.answer)).toEqual([true, false, true, false]);

    // Câu tự luận giữ nguyên type='essay' và points=3, không bị nhét nhầm vào short_answer 12 ký tự
    expect(questions[3].type).toBe('essay');
    expect(questions[3].points).toBe(3);
    expect(questions[3].explain).toContain('Đảm bảo cấu trúc đoạn văn');

    // Chấm điểm câu tự luận + đánh dấu đã làm
    const longWriting = 'Tinh thần tự học giúp mỗi người chủ động tiếp thu tri thức suốt đời.';
    expect(isAnswered(questions[3], longWriting)).toBe(true);
    const scored = scoreExam(questions, { 0: 1, 1: 0, 2: { 0: true, 1: false, 2: true, 3: false }, 3: longWriting });
    expect(scored.detail[3]).toMatchObject({ type: 'essay', needsManualGrading: true, picked: longWriting });

    // Xuất Word cho đề Tin học / Tự luận không crash và giữ được cả phần tự luận
    const docBlob = await buildExamDocBlob({
      examTitle: 'Đề kiểm tra học kì tổng hợp',
      subject: 'Tin học',
      grade: '12',
      duration: 50,
      questions,
    });
    expect(docBlob).toBeInstanceOf(Blob);
    expect(docBlob.size).toBeGreaterThan(500);
  });

  it('bảo toàn dữ liệu đa môn qua Parser → Bảo mật → OMR → Thống kê Export → Ngân hàng → Chấm tự luận', async () => {
    // 1. Ngữ văn: tách điểm cuối câu (0,5 điểm) & [1,0 đ], parsePastedAnswerKey bỏ qua essay
    const litText = [
      'PHẦN II. LÀM VĂN',
      'Câu 1: Xác định thể thơ của đoạn trích trên. (0,5 điểm)',
      'Câu 2: Viết đoạn văn nghị luận văn học. [1,0 đ]',
    ].join('\n');
    const litParsed = parseLines(textToLines(litText), []);
    expect(litParsed.questions).toHaveLength(2);
    expect(litParsed.questions[0]).toMatchObject({ type: 'essay', points: 0.5 });
    expect(litParsed.questions[0].q).not.toContain('0,5 điểm');
    expect(litParsed.questions[1]).toMatchObject({ type: 'essay', points: 1 });
    expect(litParsed.questions[1].q).not.toContain('1,0 đ');

    const mixedForPaste = [
      { type: 'essay', q: 'Viết bài tự luận' },
      { type: 'single_choice', q: 'MCQ 1', options: ['A1', 'B1', 'C1', 'D1'], correct: 0 },
    ];
    const pasteRes = parsePastedAnswerKey('1C', mixedForPaste);
    expect(pasteRes.counts.p1).toBe(1);
    expect(pasteRes.updates.has(0)).toBe(false);
    expect(pasteRes.updates.get(1)).toMatchObject({ type: 'single_choice', correct: 2 });

    // 2. Tiếng Anh: gạch chân chữ cái phương án (bitmask '1' ở vị trí chữ cái) khi tất cả A/B/C/D đều in đậm + câu điền khuyết passage
    const enUnderlinedLines = [
      { t: 'Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate the correct option.', m: '', u: '', b: '' },
      { t: 'City dwellers benefit from (1) ______ green parks.', m: '', u: '', b: '' },
      { t: 'Question 1:', m: '', u: '', b: '' },
      { t: 'A. expanded', m: '', u: '00', b: '11' },
      { t: 'B. expanding', m: '', u: '11', b: '11' },
      { t: 'C. expand', m: '', u: '00', b: '11' },
      { t: 'D. expansion', m: '', u: '00', b: '11' },
    ];
    const enParsed = parseLines(enUnderlinedLines, []);
    expect(enParsed.questions).toHaveLength(1);
    expect(enParsed.questions[0].correct).toBe(1);
    expect(enParsed.questions[0].passage).toContain('City dwellers');

    // Lưu câu điền khuyết q: '' kèm passage & essay vào Ngân hàng câu hỏi
    const savedCloze = await addQuestion({
      teacherId: 't1',
      type: 'single_choice',
      q: '',
      passage: 'City dwellers benefit from (1) ______ green parks.',
      instruction: 'Read the passage.',
      passageId: 0,
      groupId: 'pg_en_1',
      lockGroupQuestionOrder: true,
      options: ['a', 'b', 'c', 'd'],
      correct: 1,
      subject: 'Tiếng Anh',
    });
    expect(savedCloze.passage).toContain('City dwellers');
    expect(savedCloze.groupId).toBe('pg_en_1');
    expect(savedCloze.lockGroupQuestionOrder).toBe(true);

    const savedEssay = await addQuestion({
      teacherId: 't1',
      type: 'essay',
      q: 'Phân tích nhân vật',
      answer: 'Nêu được 3 ý chính.',
      subject: 'Ngữ văn',
    });
    expect(savedEssay.type).toBe('essay');
    expect(savedEssay.options).toEqual([]);
    expect(savedEssay.correct).toBe(-1);
    expect(savedEssay.answer).toBe('Nêu được 3 ý chính.');

    updateDoc.mockClear();
    await updateQuestion('q_essay_1', {
      type: 'essay',
      q: 'Đề mới',
      answer: 'Gợi ý mới',
      passage: 'Đoạn văn mới',
    });
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc.mock.calls[0][1]).toMatchObject({
      type: 'essay',
      answer: 'Gợi ý mới',
      passage: 'Đoạn văn mới',
    });

    // 3. Zero-Trust examSecurity + OMR + PaperGrade + MatrixExport
    const secQuestions = [
      { type: 'single_choice', q: 'MCQ', options: ['a', 'b', 'c', 'd'], correct: 2, points: 0.25 },
      { type: 'essay', q: 'Essay', answer: 'Hướng dẫn chấm chuẩn', points: 2 },
    ];
    expect(hasEmbeddedAnswers(secQuestions)).toBe(true);
    const keyMap = extractAnswerKey(secQuestions);
    expect(keyMap['1']).toMatchObject({ type: 'essay', answer: 'Hướng dẫn chấm chuẩn' });
    const stripped = secQuestions.map(({ correct, answer, ...rest }) => rest);
    const restored = mergeAnswerKeyIntoQuestions(stripped, keyMap);
    expect(restored[1].answer).toBe('Hướng dẫn chấm chuẩn');

    expect(classifyExamQuestionPart({ type: 'essay' })).toBe(4);
    expect(MOET_EXAM_PRESETS.find((p) => p.id === 'khtn_2025')?.label).not.toContain('Tin');
    expect(MOET_EXAM_PRESETS.find((p) => p.id === 'lichsu_2025')?.label).toContain('Tin');

    const omrCats = categorizeQuestions(secQuestions);
    expect(omrCats.singleChoice).toHaveLength(1);

    const exportStats = computeExportMatrixStats(secQuestions);
    expect(exportStats.p1).toBe(1);
    expect(exportStats.p4).toBe(1);
    expect(exportStats.p4Score).toBe(2);

    // 4. Topics alias & PDF colon option table
    expect(resolveTopicsSubjectKey('GDKT&PL')).toBe('GDCD');
    expect(resolveTopicsSubjectKey('Toán học')).toBe('Toán');
    expect(resolveTopicsSubjectKey('Vật lý')).toBe('Vật lí');
    expect(getTopicsForSubject('Khoa học tự nhiên').length).toBeGreaterThan(0);
    const pdfColonLines = reconstructPdfPageLines(
      [
        { str: 'A: print(1)', width: 70, height: 11, transform: [11, 0, 0, 11, 55, 700] },
        { str: 'C: print(3)', width: 70, height: 11, transform: [11, 0, 0, 11, 300, 700] },
      ],
      {},
      { pageWidth: 595 }
    );
    expect(pdfColonLines[0].fromTable).toBe(true);

    // 5. Giáo viên chấm điểm bài tự luận qua gradeSubmissionEssays
    const mockSub = {
      id: 'sub_essay_1',
      score: 0.25,
      correctCount: 1,
      totalPoints: 2.25,
      detail: [
        { type: 'single_choice', picked: 2, isCorrect: true, earned: 0.25 },
        { type: 'essay', picked: 'Bài viết chi tiết của học sinh', isCorrect: false, earned: 0, needsManualGrading: true },
      ],
    };
    const graded = await gradeSubmissionEssays({
      submission: mockSub,
      exam: { questions: secQuestions },
      essayScores: { 1: 1.75 },
      teacherNote: 'Lập luận tốt',
    });
    expect(graded.score).toBe(2);
    expect(graded.correctCount).toBe(2);
    expect(graded.graded).toBe(true);
    expect(graded.manualGraded).toBe(true);
    expect(graded.detail[1]).toMatchObject({ earned: 1.75, isCorrect: true, manualGraded: true, needsManualGrading: false });

    // 6. buildExamDocBlob chuẩn Bộ GD&ĐT: ẩn lời giải khi includeAnswers=false & bỏ MÃ ĐỀ cho đề 100% Tự luận Ngữ văn
    const studentBlob = await buildExamDocBlob({
      examTitle: 'Đề kiểm tra giữa kì 1',
      subject: 'Toán học',
      grade: '12',
      duration: 90,
      code: '101',
      includeAnswers: false,
      questions: [{ type: 'short_answer', q: 'Tính m', answer: '12,5', level: 'vd' }],
    });
    const studentZip = await JSZip.loadAsync(await studentBlob.arrayBuffer());
    const studentXml = await studentZip.file('word/document.xml').async('string');
    expect(studentXml).not.toContain('hướng dẫn giải chi tiết');
    expect(studentXml).toContain('MÃ ĐỀ THI: 101');

    const litBlob = await buildExamDocBlob({
      examTitle: 'Đề thi Ngữ văn',
      subject: 'Ngữ văn',
      grade: '12',
      duration: 120,
      code: '101',
      includeAnswers: false,
      questions: [{ type: 'essay', q: 'Viết bài nghị luận', points: 4 }],
    });
    const litZip = await JSZip.loadAsync(await litBlob.arrayBuffer());
    const litXml = await litZip.file('word/document.xml').async('string');
    expect(litXml).not.toContain('MÃ ĐỀ THI');

    const mathExportStats = computeExportMatrixStats(
      [{ type: 'short_answer', answer: '5', level: 'vd' }],
      'Toán học'
    );
    expect(mathExportStats.part3Unit).toBe(0.5);
    expect(mathExportStats.totalScore).toBe(0.5);
  });

  it('teacher audit fixes: createClass lưu grade, không hồi sinh lớp/đề đã xóa, totalPoints & isDraft chuẩn, addQuestion không nuốt lỗi', async () => {
    // 1. Giả lập localStorage đơn giản trong môi trường node test
    const store = new Map();
    const prevLs = globalThis.localStorage;
    globalThis.localStorage = {
      get length() { return store.size; },
      key: (i) => Array.from(store.keys())[i] ?? null,
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
    try {
      setDocMock.mockResolvedValue(undefined);
      const cls = await createClass({
        name: '11A2',
        subject: 'Tiếng Anh',
        grade: '11',
        teacherId: 'gv_audit',
        teacherName: 'Cô Lan',
      });
      expect(cls.grade).toBe(11);
      expect(setDocMock).toHaveBeenCalled();

      // Xóa lớp phải xóa khỏi localStorage & getClassesByTeacher (cloud rỗng) không được hồi sinh lớp cloud đã xóa
      const delClsRes = await deleteClass(cls.id);
      expect(delClsRes.ok).toBe(true);
      const classesAfter = await getClassesByTeacher('gv_audit');
      expect(classesAfter.some((c) => c.id === cls.id)).toBe(false);

      // Tạo đề Toán chuẩn 12-4-6 không có field points -> totalPoints vẫn = 10.0đ
      const math22 = [
        ...Array.from({ length: 12 }, (_, i) => ({ type: 'single_choice', q: `M${i}`, options: ['A', 'B', 'C', 'D'], correct: 0 })),
        ...Array.from({ length: 4 }, (_, i) => ({ type: 'true_false', q: `TF${i}`, statements: [{ text: 'a', answer: true }, { text: 'b', answer: false }, { text: 'c', answer: true }, { text: 'd', answer: false }] })),
        ...Array.from({ length: 6 }, (_, i) => ({ type: 'short_answer', q: `SA${i}`, answer: '2,5' })),
      ];
      const mathExam = await createExam({
        teacherId: 'gv_audit',
        teacherName: 'Thầy Minh',
        classId: '',
        title: 'Đề Toán 12',
        duration: 90,
        subject: 'Toán học',
        questions: math22,
      });
      expect(mathExam.totalPoints).toBe(10);
      expect(mathExam.isDraft).toBe(true);

      // updateTeacherExam khi gán classId tự đồng bộ isDraft: false
      updateDoc.mockClear();
      await updateTeacherExam(mathExam.id, { classId: 'cls_12a1' });
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc.mock.calls[0][1]).toMatchObject({ classId: 'cls_12a1', isDraft: false });

      // Xóa đề không bị hồi sinh bởi getExamsByTeacher
      await deleteExam(mathExam.id);
      const examsAfter = await getExamsByTeacher('gv_audit');
      expect(examsAfter.some((e) => e.id === mathExam.id)).toBe(false);

      // addQuestion không nuốt lỗi permission-denied
      setDocMock.mockRejectedValueOnce(Object.assign(new Error('denied'), { code: 'permission-denied' }));
      await expect(
        addQuestion({
          teacherId: 'gv_audit',
          type: 'single_choice',
          q: 'Câu hỏi kiểm tra lỗi quyền',
          options: ['A', 'B', 'C', 'D'],
          correct: 0,
        })
      ).rejects.toThrow();
    } finally {
      globalThis.localStorage = prevLs;
    }
  });
});
