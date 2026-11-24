import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  extractPptxText,
  chunkDocumentForCitations,
  retrieveRelevantChunks,
  parseCitationIds,
  buildMindMapTree,
  layoutMindMapSvg,
  normalizePodcastScript,
  buildFallbackPodcastScript,
  buildDocClozeItems,
  exportDocFlashcardsAnki,
  exportDocQuizMoodleXml,
  exportDocQuizKahootRows,
  exportDocMarkdown,
  buildStudyGuideHtml,
} from '../src/lib/docStudioEngine.js';

const SAMPLE_DOC = {
  id: 'D1',
  name: 'Chuong-2-Este-Lipit.pdf',
  at: new Date('2026-11-24T00:00:00Z').getTime(),
  summary: 'Este có công thức tổng quát RCOOR\' được tạo từ phản ứng este hóa giữa axit cacboxylic và ancol có xúc tác H2SO4 đặc.',
  keyPoints: [
    'Phản ứng este hóa là phản ứng thuận nghịch, cần xúc tác H2SO4 đặc và đun nóng.',
    'Thủy phân este trong môi trường kiềm NaOH là phản ứng một chiều gọi là xà phòng hóa.',
    'Chất béo là trieste của glixerol với axit béo, không tan trong nước và nhẹ hơn nước.',
    'Nhiệt độ sôi của este thấp hơn axit cacboxylic và ancol có cùng phân tử khối vì không có liên kết hiđro.',
  ],
  glossary: [
    { term: 'Phản ứng xà phòng hóa', def: 'Thủy phân este trong dung dịch kiềm NaOH hoặc KOH tạo muối và ancol.' },
    { term: 'Triolein', def: '(C17H33COO)3C3H5 — chất béo lỏng ở điều kiện thường.' },
  ],
  flashcards: [
    { q: 'Xúc tác của phản ứng este hóa là gì?', a: 'H2SO4 đặc, đun nóng.' },
    { q: 'Thủy phân este trong NaOH gọi là phản ứng gì?', a: 'Phản ứng xà phòng hóa (một chiều).' },
  ],
  quiz: [
    {
      q: 'Phản ứng thủy phân este trong môi trường kiềm có đặc điểm nào?',
      opts: ['Phản ứng một chiều', 'Phản ứng thuận nghịch', 'Cần xúc tác axit', 'Tạo ra khí H2'],
      correct: 0,
      explain: 'Thủy phân este trong kiềm là phản ứng xà phòng hóa, xảy ra một chiều.',
    },
  ],
};

describe('Doc Studio Pro Engine (NotebookLM-Grade Upgrades)', () => {
  it('1. extractPptxText giải mã chuẩn slide PowerPoint (.pptx) kèm ghi chú diễn giả theo đúng thứ tự', async () => {
    const zip = new JSZip();
    zip.file(
      'ppt/slides/slide2.xml',
      '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:p><a:r><a:t>Slide 2: Phản ứng xà phòng hóa</a:t></a:r></a:p></p:sld>'
    );
    zip.file(
      'ppt/slides/slide1.xml',
      '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:p><a:r><a:t>Slide 1: Khái niệm Este &amp; Lipit</a:t></a:r></a:p></p:sld>'
    );
    zip.file(
      'ppt/notesSlides/notesSlide1.xml',
      '<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:p><a:r><a:t>Nhấn mạnh xúc tác H2SO4 đặc</a:t></a:r></a:p></p:notes>'
    );

    const buf = await zip.generateAsync({ type: 'arraybuffer' });
    const res = await extractPptxText(buf);

    expect(res.slides).toBe(2);
    expect(res.text).toContain('[Slide 1]');
    expect(res.text).toContain('Khái niệm Este & Lipit');
    expect(res.text).toContain('Nhấn mạnh xúc tác H2SO4 đặc');
    expect(res.text.indexOf('[Slide 1]')).toBeLessThan(res.text.indexOf('[Slide 2]'));
  });

  it('2. RAG chunkDocumentForCitations + retrieveRelevantChunks + parseCitationIds truy xuất chuẩn tiếng Việt', () => {
    const fullText = [
      '[Trang 1]\nĐịnh luật Ohm cho toàn mạch: cường độ dòng điện tỉ lệ thuận với suất điện động E và tỉ lệ nghịch với điện trở toàn phần R + r.',
      '[Trang 2]\nPhản ứng este hóa giữa axit axetic và etanol tạo etyl axetat có mùi thơm hoa quả đặc trưng, cần H2SO4 đặc.',
      '[Trang 3]\nQuá trình phiên mã tổng hợp mARN diễn ra trong nhân tế bào theo nguyên tắc bổ sung A-U, T-A, G-X, X-G.',
    ].join('\n\n');

    const chunks = chunkDocumentForCitations(fullText, { chunkSize: 180 });
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks[0].pageHint).toBe('Trang 1');

    const top = retrieveRelevantChunks(chunks, 'phan ung este hoa mui thom etanol', 2);
    expect(top.length).toBeGreaterThan(0);
    expect(top[0].text).toContain('etyl axetat');

    expect(parseCitationIds('Theo [Đoạn 2] và [Đoạn 1, 3] thì điều này đúng.', 5)).toEqual([1, 2, 3]);
  });

  it('3. buildMindMapTree & layoutMindMapSvg tạo cây phân nhánh chuẩn và hỗ trợ thu gọn nhánh', () => {
    const fallbackTree = buildMindMapTree(SAMPLE_DOC);
    expect(fallbackTree.label).toBe('Chuong-2-Este-Lipit');
    expect(fallbackTree.children.length).toBeGreaterThanOrEqual(3);

    const fullLayout = layoutMindMapSvg(fallbackTree);
    expect(fullLayout.nodes.length).toBeGreaterThan(5);
    expect(fullLayout.edges.length).toBe(fullLayout.nodes.length - 1);
    expect(fullLayout.width).toBeGreaterThan(700);

    const collapsedLayout = layoutMindMapSvg(fallbackTree, new Set(['b-0']));
    expect(collapsedLayout.nodes.length).toBeLessThan(fullLayout.nodes.length);

    // Kiểm tra chế độ nhận mindmap AI trực tiếp
    const aiTree = buildMindMapTree({
      name: 'Quang học',
      mindmap: {
        label: 'Quang học 11',
        children: [
          { label: 'Khúc xạ', children: ['Định luật Snell', 'Chiết suất tỉ đối'] },
          { label: 'Phản xạ toàn phần', children: ['Điều kiện góc tới hạn'] },
        ],
      },
    });
    expect(aiTree.label).toBe('Quang học 11');
    expect(aiTree.children).toHaveLength(2);
  });

  it('4. Podcast Audio Overview chuẩn hóa kịch bản AI và tự tổng hợp cho tài liệu cũ', () => {
    const fallback = buildFallbackPodcastScript(SAMPLE_DOC);
    expect(fallback.length).toBeGreaterThanOrEqual(6);
    expect(fallback[0].speaker).toBe('Thầy Minh');
    expect(fallback[1].speaker).toBe('Bạn Lan');

    const custom = normalizePodcastScript(
      [
        { speaker: 'Thầy Minh', text: 'Xin chào các bạn học sinh yêu quý!' },
        { speaker: 'Bạn Lan', text: 'Chào thầy, hôm nay mình học bài Este đúng không ạ?' },
      ],
      SAMPLE_DOC
    );
    expect(custom).toHaveLength(2);
    expect(custom[0].role).toBe('host');
    expect(custom[1].role).toBe('student');
  });

  it('5. buildDocClozeItems tạo bài điền khuyết Active Recall có lỗ trống hợp lệ', () => {
    const items = buildDocClozeItems(SAMPLE_DOC, 4);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].blanks.length).toBeGreaterThan(0);
    expect(items[0].segments.some((s) => s.type === 'blank')).toBe(true);
  });

  it('6. Xuất đa nền tảng: Anki TSV, Moodle XML, Kahoot rows, Markdown và Cẩm nang A4 HTML', () => {
    const anki = exportDocFlashcardsAnki(SAMPLE_DOC);
    expect(anki).toContain('#separator:tab');
    expect(anki).toContain('H2SO4 đặc');

    const moodle = exportDocQuizMoodleXml(SAMPLE_DOC);
    expect(moodle).toContain('<quiz>');
    expect(moodle).toContain('fraction="100"');

    const kahoot = exportDocQuizKahootRows(SAMPLE_DOC, 30);
    expect(kahoot).toHaveLength(2); // header + 1 MCQ
    expect(kahoot[1][6]).toBe(1); // correct 1-based

    const md = exportDocMarkdown(SAMPLE_DOC);
    expect(md).toContain('# Chuong-2-Este-Lipit.pdf');
    expect(md).toContain('## Thuật ngữ & Công thức');

    const html = buildStudyGuideHtml(SAMPLE_DOC);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Cẩm nang ôn tập');
    expect(html).toContain('Triolein');
  });
});
