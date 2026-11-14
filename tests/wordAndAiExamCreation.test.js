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
import { preprocessDocxBuffer, parseLines, extractImgTokens } from '../src/lib/examDocxParser.js';
import { readFile } from '../src/lib/fileReader.js';

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
});
