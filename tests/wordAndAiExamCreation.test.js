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

import { createExam, estimateFirestoreDocBytes, MAX_FIRESTORE_EXAM_BYTES } from '../src/lib/classroom.js';
import { compressImageDataUrl, estimateDataUrlBytes, isUnsupportedVectorDataUrl } from '../src/lib/imageUtils.js';
import {
  preprocessDocxBuffer,
  parseLines,
  extractImgTokens,
  textToLines,
  readTf,
  htmlToLines,
  parsePastedAnswerKey,
} from '../src/lib/examDocxParser.js';
import { readFile } from '../src/lib/fileReader.js';
import {
  reconstructPdfPageLines,
  stripRepeatedPageHeadersFooters,
  maybeFixVietnameseEncoding,
  detectMojibakeOrScanned,
} from '../src/lib/pdfExamReader.js';
import { findSafeCanvasCutY } from '../src/lib/examExport.js';

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
    expect(setDocMock).toHaveBeenCalledTimes(1);
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
});
