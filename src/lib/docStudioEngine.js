/* ============================================================
   docStudioEngine.js — Động cơ xử lý Tài liệu chuẩn NotebookLM / Open-Notebook
   ------------------------------------------------------------
   Lấy cảm hứng từ các dự án mã nguồn mở GitHub hàng đầu:
     • lfnovo/open-notebook (Podcast Audio Overview 2 giọng)
     • better-vault / InsightsLM (RAG Trích dẫn từng đoạn [Đoạn N])
     • smallnest/notex (Sơ đồ tư duy SVG tương tác + xuất ảnh)
     • ankitects/anki + Moodle XML + Kahoot! (Xuất đa nền tảng)
   Thuần hàm, an toàn, không thêm package mới (tái sử dụng jszip, lmsQuizFormats,
   studentStudyStudio).
   ============================================================ */

import JSZip from 'jszip';
import {
  exportToMoodleXml,
  buildKahootSpreadsheetRows,
} from './lmsQuizFormats.js';
import {
  autoGenerateCloze,
  parseClozeText,
} from './studentStudyStudio.js';

const STOP_WORDS = new Set([
  'la', 'cua', 'va', 'cac', 'nhung', 'trong', 'voi', 'cho', 'khi', 'neu', 'thi',
  'duoc', 'mot', 'hai', 'ba', 'khong', 'co', 'de', 'tai', 'tu', 'den', 'theo',
  'bang', 'nhu', 'nay', 'do', 'se', 'da', 'dang', 'rat', 'nhieu', 'moi', 'hay',
  've', 'gi', 'nao', 'sao', 'bao', 'nhieu', 'hay', 'hay', 'cung', 'nhung', 'ma',
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were',
]);

function decodeXmlEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n) || 32))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16) || 32));
}

function normSearch(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractXmlSlideParagraphs(xml) {
  const paras = [];
  const pMatches = String(xml || '').match(/<a:p\b[\s\S]*?<\/a:p>/gi) || [];
  for (const p of pMatches) {
    const texts = [];
    const tRegex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/gi;
    let m;
    while ((m = tRegex.exec(p)) !== null) {
      const cleaned = decodeXmlEntities(m[1]).trim();
      if (cleaned) texts.push(cleaned);
    }
    if (texts.length) paras.push(texts.join(' '));
  }
  return paras;
}

/* ============================================================
   1. GIẢI MÃ POWERPOINT (.PPTX) — Slide + Ghi chú diễn giả
   ============================================================ */
export async function extractPptxText(arrayBuffer) {
  if (!arrayBuffer) return { text: '', slides: 0 };
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideEntries = [];
  zip.forEach((relativePath, file) => {
    const m = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (m && !file.dir) {
      slideEntries.push({ num: Number(m[1]), path: relativePath, file });
    }
  });
  slideEntries.sort((a, b) => a.num - b.num);

  const sections = [];
  for (const entry of slideEntries) {
    const xml = await entry.file.async('string');
    const paras = extractXmlSlideParagraphs(xml);

    // Đọc thêm speaker notes nếu có
    const noteFile = zip.file(`ppt/notesSlides/notesSlide${entry.num}.xml`);
    let noteLines = [];
    if (noteFile) {
      try {
        const noteXml = await noteFile.async('string');
        noteLines = extractXmlSlideParagraphs(noteXml).filter((l) => !/^\d+$/.test(l.trim()));
      } catch { /* ignore */ }
    }

    if (paras.length || noteLines.length) {
      let block = `[Slide ${entry.num}]\n${paras.join('\n')}`;
      if (noteLines.length) {
        block += `\n(Ghi chú: ${noteLines.join(' ')})`;
      }
      sections.push(block.trim());
    }
  }

  return {
    text: sections.join('\n\n'),
    slides: slideEntries.length,
  };
}

/* ============================================================
   2. RAG TRÍCH DẪN TỪNG ĐOẠN ([Đoạn 1], [Đoạn 2]...)
   ============================================================ */
export function chunkDocumentForCitations(text, { chunkSize = 720, maxChunks = 24 } = {}) {
  const src = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!src) return [];

  const rawBlocks = src
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length >= 12);

  const chunks = [];
  let buf = '';
  let pageHint = '';

  const flush = () => {
    const clean = buf.trim();
    if (!clean) return;
    const id = chunks.length + 1;
    chunks.push({
      id,
      label: `Đoạn ${id}`,
      pageHint,
      text: clean,
    });
    buf = '';
  };

  for (const block of rawBlocks) {
    const marker = block.match(/^\[(Trang\s+\d+|Slide\s+\d+|Tài liệu[^\]]*)\]/i);

    if (buf && (buf.length + block.length + 2 > chunkSize || (marker && pageHint && marker[1] !== pageHint))) {
      flush();
      if (chunks.length >= maxChunks) break;
    }

    if (marker) pageHint = marker[1];

    if (block.length > chunkSize * 1.4) {
      // Cắt đoạn quá dài theo ranh giới câu
      const sentences = block.split(/(?<=[.!?。])\s+/);
      for (const s of sentences) {
        if (buf && buf.length + s.length + 1 > chunkSize) {
          flush();
          if (chunks.length >= maxChunks) break;
        }
        buf = buf ? `${buf} ${s}` : s;
      }
    } else {
      buf = buf ? `${buf}\n${block}` : block;
    }
  }
  if (chunks.length < maxChunks) flush();

  return chunks.slice(0, maxChunks);
}

export function retrieveRelevantChunks(chunks = [], query = '', topK = 4) {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];
  const qNorm = normSearch(query);
  const terms = qNorm
    .split(' ')
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  if (!terms.length) {
    return chunks.slice(0, topK);
  }

  // Tính IDF nhẹ trên tập chunks
  const N = chunks.length;
  const chunkNorms = chunks.map((c) => normSearch(c.text));
  const df = new Map();
  for (const t of new Set(terms)) {
    let count = 0;
    for (const cn of chunkNorms) {
      if (cn.includes(t)) count++;
    }
    df.set(t, count);
  }

  // Tạo bigram từ câu hỏi để tăng điểm khớp cụm từ chính xác
  const bigrams = [];
  for (let i = 0; i < terms.length - 1; i++) {
    bigrams.push(`${terms[i]} ${terms[i + 1]}`);
  }

  const scored = chunks.map((chunk, idx) => {
    const cn = chunkNorms[idx];
    let score = 0;
    for (const t of terms) {
      const freq = cn.split(t).length - 1;
      if (freq > 0) {
        const idf = Math.log(1 + (N + 0.5) / ((df.get(t) || 0) + 0.5));
        score += Math.min(freq, 4) * idf;
      }
    }
    for (const bg of bigrams) {
      if (cn.includes(bg)) score += 2.5;
    }
    return { chunk, score, idx };
  });

  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
  const picked = scored.filter((s) => s.score > 0).slice(0, topK).map((s) => s.chunk);
  if (picked.length > 0) return picked;
  return chunks.slice(0, topK);
}

export function parseCitationIds(answerText, maxId = 99) {
  const s = String(answerText || '');
  const found = new Set();
  const re = /\[(?:Đoạn|Doan)\s*([0-9,\s]+)\]/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    const nums = m[1].split(/[,\s]+/).map((n) => parseInt(n, 10)).filter((n) => n >= 1 && n <= maxId);
    nums.forEach((n) => found.add(n));
  }
  return Array.from(found).sort((a, b) => a - b);
}

/* ============================================================
   3. SƠ ĐỒ TƯ DUY SVG TƯƠNG TÁC (MIND MAP ENGINE)
   ============================================================ */
const BRANCH_PALETTE = [
  '#2563eb', // Blue
  '#7c3aed', // Violet
  '#059669', // Emerald
  '#ea580c', // Orange
  '#db2777', // Pink
  '#0891b2', // Cyan
];

function cleanLabel(s, maxLen = 68) {
  const txt = String(s || '').replace(/\s+/g, ' ').trim();
  if (txt.length <= maxLen) return txt;
  return txt.slice(0, maxLen - 1).trim() + '…';
}

export function buildMindMapTree(doc) {
  const rootTitle = cleanLabel(
    String(doc?.name || 'Tài liệu ôn tập').replace(/\.[^.]+$/, ''),
    42
  );

  // 1. Dùng sơ đồ AI trả về nếu có cấu trúc hợp lệ
  const aiMap = doc?.mindmap;
  if (aiMap && typeof aiMap === 'object' && Array.isArray(aiMap.children) && aiMap.children.length >= 2) {
    const normNode = (node, depth = 0) => {
      if (!node) return null;
      const label = typeof node === 'string'
        ? cleanLabel(node, depth >= 2 ? 56 : 44)
        : cleanLabel(node.label || node.title || node.name || '', depth >= 2 ? 56 : 44);
      if (!label) return null;
      const rawChildren = Array.isArray(node.children) ? node.children : [];
      const children = depth >= 2
        ? []
        : rawChildren.map((ch) => normNode(ch, depth + 1)).filter(Boolean).slice(0, depth === 0 ? 6 : 4);
      return { label, children };
    };
    const root = normNode({ label: aiMap.label || rootTitle, children: aiMap.children }, 0);
    if (root && root.children.length >= 2) return root;
  }

  // 2. Dự phòng xác định (deterministic) cho tài liệu cũ hoặc AI chưa sinh mindmap
  const branches = [];
  const kps = Array.isArray(doc?.keyPoints) ? doc.keyPoints.filter(Boolean) : [];
  if (kps.length) {
    const mid = Math.ceil(kps.length / 2);
    branches.push({
      label: 'Trọng tâm chính',
      children: kps.slice(0, Math.min(4, mid)).map((k) => ({ label: cleanLabel(k, 54), children: [] })),
    });
    if (kps.length > mid) {
      branches.push({
        label: 'Kiến thức mở rộng',
        children: kps.slice(mid, mid + 4).map((k) => ({ label: cleanLabel(k, 54), children: [] })),
      });
    }
  }

  const glossary = Array.isArray(doc?.glossary) ? doc.glossary.filter((g) => g?.term) : [];
  if (glossary.length) {
    branches.push({
      label: 'Thuật ngữ & Công thức',
      children: glossary.slice(0, 4).map((g) => ({
        label: cleanLabel(`${g.term}: ${g.def || ''}`, 54),
        children: [],
      })),
    });
  }

  const cards = Array.isArray(doc?.flashcards) ? doc.flashcards.filter((c) => c?.q) : [];
  if (cards.length) {
    branches.push({
      label: 'Câu hỏi cốt lõi',
      children: cards.slice(0, 4).map((c) => ({ label: cleanLabel(c.q, 54), children: [] })),
    });
  }

  if (!branches.length && doc?.summary) {
    branches.push({
      label: 'Tóm tắt nội dung',
      children: [{ label: cleanLabel(doc.summary, 58), children: [] }],
    });
  }

  return { label: rootTitle, children: branches.slice(0, 6) };
}

export function layoutMindMapSvg(tree, collapsedIds = new Set()) {
  const nodes = [];
  const edges = [];

  const rootX = 28;
  const colX = [rootX, 275, 555];
  const nodeW = [205, 225, 300];
  const nodeH = [52, 42, 36];
  const leafGapY = 14;
  const branchGapY = 24;

  const branches = Array.isArray(tree?.children) ? tree.children : [];
  let cursorY = 30;
  const branchCenters = [];

  branches.forEach((br, bi) => {
    const color = BRANCH_PALETTE[bi % BRANCH_PALETTE.length];
    const brId = `b-${bi}`;
    const rawLeaves = Array.isArray(br.children) ? br.children : [];
    const isCollapsed = collapsedIds?.has?.(brId);
    const leaves = isCollapsed ? [] : rawLeaves;

    const blockStart = cursorY;
    const leafNodes = [];

    if (leaves.length === 0) {
      cursorY += nodeH[1];
    } else {
      leaves.forEach((lf, li) => {
        const ly = cursorY;
        const lfId = `b-${bi}-l-${li}`;
        leafNodes.push({
          id: lfId,
          depth: 2,
          label: lf.label,
          x: colX[2],
          y: ly,
          w: nodeW[2],
          h: nodeH[2],
          color,
          parentId: brId,
        });
        cursorY += nodeH[2] + leafGapY;
      });
      cursorY -= leafGapY;
    }

    const blockEnd = cursorY;
    const brY = Math.round((blockStart + blockEnd) / 2 - nodeH[1] / 2);
    branchCenters.push(brY + nodeH[1] / 2);

    nodes.push({
      id: brId,
      depth: 1,
      label: br.label,
      x: colX[1],
      y: brY,
      w: nodeW[1],
      h: nodeH[1],
      color,
      hasChildren: rawLeaves.length > 0,
      collapsed: Boolean(isCollapsed),
      childCount: rawLeaves.length,
    });

    leafNodes.forEach((ln) => {
      nodes.push(ln);
      edges.push({
        id: `e-${brId}-${ln.id}`,
        x1: colX[1] + nodeW[1],
        y1: brY + nodeH[1] / 2,
        x2: ln.x,
        y2: ln.y + ln.h / 2,
        color,
      });
    });

    cursorY += branchGapY;
  });

  const totalH = Math.max(240, cursorY + 12);
  const rootCenterY = branchCenters.length
    ? Math.round((branchCenters[0] + branchCenters[branchCenters.length - 1]) / 2)
    : Math.round(totalH / 2);
  const rootY = Math.max(20, rootCenterY - nodeH[0] / 2);

  nodes.unshift({
    id: 'root',
    depth: 0,
    label: tree?.label || 'Tài liệu',
    x: colX[0],
    y: rootY,
    w: nodeW[0],
    h: nodeH[0],
    color: '#2563eb',
  });

  branches.forEach((_, bi) => {
    const brNode = nodes.find((n) => n.id === `b-${bi}`);
    if (!brNode) return;
    edges.push({
      id: `e-root-b-${bi}`,
      x1: colX[0] + nodeW[0],
      y1: rootY + nodeH[0] / 2,
      x2: brNode.x,
      y2: brNode.y + brNode.h / 2,
      color: brNode.color,
    });
  });

  return {
    nodes,
    edges,
    width: colX[2] + nodeW[2] + 32,
    height: totalH,
  };
}

/* ============================================================
   4. PODCAST AUDIO OVERVIEW (2 GIỌNG ĐỐI THOẠI KIỂU NOTEBOOKLM)
   ============================================================ */
export function normalizePodcastScript(rawScript, doc) {
  if (Array.isArray(rawScript) && rawScript.length >= 2) {
    const cleaned = rawScript
      .map((line, i) => {
        if (!line || !line.text) return null;
        const spkRaw = String(line.speaker || '').trim();
        const isFemale = /lan|cô|co|học sinh|ban|host 2/i.test(spkRaw) || (!spkRaw && i % 2 === 1);
        return {
          speaker: spkRaw || (isFemale ? 'Bạn Lan' : 'Thầy Minh'),
          role: isFemale ? 'student' : 'host',
          text: String(line.text).replace(/\s+/g, ' ').trim(),
        };
      })
      .filter((l) => l && l.text.length >= 6)
      .slice(0, 16);
    if (cleaned.length >= 2) return cleaned;
  }
  return buildFallbackPodcastScript(doc);
}

export function buildFallbackPodcastScript(doc) {
  const title = String(doc?.name || 'tài liệu này').replace(/\.[^.]+$/, '');
  const summary = String(doc?.summary || '').trim();
  const kps = Array.isArray(doc?.keyPoints) ? doc.keyPoints.filter(Boolean) : [];
  const glossary = Array.isArray(doc?.glossary) ? doc.glossary.filter((g) => g?.term && g?.def) : [];

  const lines = [
    {
      speaker: 'Thầy Minh',
      role: 'host',
      text: `Chào mừng các bạn đến với Podcast Ôn bài nhanh ELEC AI! Hôm nay chúng ta cùng mổ xẻ tài liệu "${title}".`,
    },
    {
      speaker: 'Bạn Lan',
      role: 'student',
      text: summary
        ? `Nghe hấp dẫn quá thầy ơi! Em thấy ý cốt lõi của bài này là: ${summary}`
        : `Tài liệu này nhìn khá nhiều chữ, thầy giúp em tóm gọn những ý quan trọng nhất dễ nhớ đi ạ!`,
    },
  ];

  kps.slice(0, 4).forEach((kp, idx) => {
    if (idx % 2 === 0) {
      lines.push({
        speaker: 'Thầy Minh',
        role: 'host',
        text: `Điểm mấu chốt thứ ${idx + 1} cần nắm chắc là: ${kp}`,
      });
    } else {
      lines.push({
        speaker: 'Bạn Lan',
        role: 'student',
        text: `À em hiểu rồi! Ngoài ra ý thứ ${idx + 1} cũng rất hay ra trong đề thi: ${kp}`,
      });
    }
  });

  if (glossary.length > 0) {
    const g = glossary[0];
    lines.push({
      speaker: 'Thầy Minh',
      role: 'host',
      text: `Đừng quên thuật ngữ quan trọng "${g.term}" nhé — hiểu ngắn gọn thì đây là ${g.def}`,
    });
  }

  lines.push({
    speaker: 'Bạn Lan',
    role: 'student',
    text: 'Tuyệt vời luôn! Nghe xong một lượt là em đã hình dung được bức tranh tổng thể. Giờ chuyển qua lật Flashcard và làm Quiz để chốt điểm 10 thôi!',
  });

  return lines;
}

/* ============================================================
   5. BÀI TẬP ĐIỀN KHUYẾT CLOZE TỪ TÀI LIỆU
   ============================================================ */
export function buildDocClozeItems(doc, maxItems = 6) {
  const sources = [];
  const kps = Array.isArray(doc?.keyPoints) ? doc.keyPoints.filter(Boolean) : [];
  kps.forEach((k, i) => sources.push({ title: `Ý chính #${i + 1}`, raw: k }));

  const glossary = Array.isArray(doc?.glossary) ? doc.glossary.filter((g) => g?.term && g?.def) : [];
  glossary.forEach((g) => sources.push({ title: `Khái niệm: ${g.term}`, raw: `${g.term} là ${g.def}` }));

  if (sources.length < 2 && doc?.summary) {
    sources.push({ title: 'Tóm tắt trọng tâm', raw: doc.summary });
  }

  const items = [];
  for (const src of sources) {
    if (items.length >= maxItems) break;
    const clozeText = autoGenerateCloze(src.raw, 3);
    const parsed = parseClozeText(clozeText);
    if (parsed.blanks.length > 0) {
      items.push({
        title: src.title,
        clozeText,
        segments: parsed.segments,
        blanks: parsed.blanks,
      });
    }
  }
  return items;
}

/* ============================================================
   6. XUẤT ĐA NỀN TẢNG (ANKI · MOODLE XML · KAHOOT · A4 STUDY GUIDE)
   ============================================================ */
export function exportDocFlashcardsAnki(doc) {
  const slug = String(doc?.name || 'DocStudio')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9_-]+/g, '_');

  const clean = (s) => String(s || '').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>').trim();
  const lines = ['#separator:tab', '#html:true', '#tags column:3'];
  (doc?.flashcards || []).forEach((c) => {
    lines.push(`${clean(c.q)}\t${clean(c.a)}\tELEC_AI DocStudio ${slug}`);
  });
  return lines.join('\n');
}

export function exportDocQuizMoodleXml(doc) {
  const questions = (doc?.quiz || []).map((q, idx) => ({
    num: idx + 1,
    type: 'single_choice',
    q: q.q,
    options: q.opts || [],
    correct: q.correct,
    explain: q.explain || '',
    points: 1,
  }));
  return exportToMoodleXml({
    title: String(doc?.name || 'DocStudio Quiz').replace(/\.[^.]+$/, ''),
    subject: 'Doc Studio',
    questions,
  });
}

export function exportDocQuizKahootRows(doc, timeSec = 30) {
  const questions = (doc?.quiz || []).map((q) => ({
    type: 'single_choice',
    q: q.q,
    options: q.opts || [],
    correct: q.correct,
  }));
  return buildKahootSpreadsheetRows(questions, timeSec);
}

export function exportDocMarkdown(doc) {
  const title = String(doc?.name || 'Tài liệu ôn tập');
  const sections = [`# ${title}\n`];
  if (doc?.summary) sections.push(`## Tóm tắt\n${doc.summary}\n`);
  if (doc?.keyPoints?.length) {
    sections.push(`## Ý chính cần nhớ\n${doc.keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n`);
  }
  if (doc?.glossary?.length) {
    sections.push(`## Thuật ngữ & Công thức\n${doc.glossary.map((g) => `- **${g.term}**: ${g.def}`).join('\n')}\n`);
  }
  if (doc?.flashcards?.length) {
    sections.push(`## Flashcards (${doc.flashcards.length})\n${doc.flashcards.map((c, i) => `${i + 1}. **${c.q}**\n   - ${c.a}`).join('\n')}\n`);
  }
  if (doc?.quiz?.length) {
    const L = 'ABCD';
    sections.push(
      `## Trắc nghiệm (${doc.quiz.length} câu)\n` +
      doc.quiz.map((q, i) =>
        `### Câu ${i + 1}: ${q.q}\n` +
        (q.opts || []).map((o, j) => `- ${L[j]}. ${o}`).join('\n') +
        `\n- **Đáp án đúng:** ${L[q.correct] || 'A'}${q.explain ? ` — ${q.explain}` : ''}`
      ).join('\n\n')
    );
  }
  return sections.join('\n');
}

export function buildStudyGuideHtml(doc) {
  const title = escapeHtml(String(doc?.name || 'Cẩm nang ôn tập'));
  const dateStr = new Date(doc?.at || Date.now()).toLocaleDateString('vi-VN');
  const LETTERS = 'ABCD';

  const kpHtml = (doc?.keyPoints || [])
    .map((k) => `<li>${escapeHtml(k)}</li>`)
    .join('');

  const glossaryHtml = (doc?.glossary || [])
    .map((g) => `<tr><td><b>${escapeHtml(g.term)}</b></td><td>${escapeHtml(g.def)}</td></tr>`)
    .join('');

  const cardsHtml = (doc?.flashcards || [])
    .map((c, i) => `<div class="card"><b>${i + 1}. ${escapeHtml(c.q)}</b><p>${escapeHtml(c.a)}</p></div>`)
    .join('');

  const quizHtml = (doc?.quiz || [])
    .map((q, i) => {
      const opts = (q.opts || [])
        .map((o, j) => `<li class="${j === q.correct ? 'ans' : ''}"><b>${LETTERS[j]}.</b> ${escapeHtml(o)}</li>`)
        .join('');
      return `<div class="q"><b>Câu ${i + 1}: ${escapeHtml(q.q)}</b><ul>${opts}</ul>${q.explain ? `<div class="exp">Giải thích: ${escapeHtml(q.explain)}</div>` : ''}</div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Cẩm nang ôn tập — ${title}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; line-height: 1.55; max-width: 794px; margin: 0 auto; padding: 12px; }
  header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  h1 { margin: 0; font-size: 20px; color: #1e3a8a; }
  .meta { font-size: 12px; color: #64748b; }
  h2 { font-size: 15px; color: #1d4ed8; margin: 18px 0 8px; border-left: 4px solid #2563eb; padding-left: 8px; }
  .sum { background: #eff6ff; padding: 12px 14px; border-radius: 10px; border: 1px solid #bfdbfe; }
  ol { padding-left: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 13px; }
  td, th { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
  th { background: #f1f5f9; }
  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 11px; font-size: 13px; break-inside: avoid; }
  .card p { margin: 4px 0 0; color: #334155; }
  .q { margin-bottom: 12px; padding: 9px 11px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; break-inside: avoid; }
  .q ul { list-style: none; padding: 0; margin: 6px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
  .q li.ans { color: #15803d; font-weight: 700; }
  .exp { margin-top: 6px; font-size: 12px; color: #475569; background: #f8fafc; padding: 5px 8px; border-radius: 6px; }
</style>
</head>
<body>
  <header>
    <div><h1>${title}</h1><div class="meta">ELEC AI Doc Studio · Cẩm nang ôn tập A4 · ${dateStr}</div></div>
    <div class="meta">${(doc?.flashcards || []).length} Flashcard · ${(doc?.quiz || []).length} Câu Quiz</div>
  </header>
  ${doc?.summary ? `<h2>Tóm tắt cốt lõi</h2><div class="sum">${escapeHtml(doc.summary)}</div>` : ''}
  ${kpHtml ? `<h2>Ý chính cần nhớ</h2><ol>${kpHtml}</ol>` : ''}
  ${glossaryHtml ? `<h2>Thuật ngữ & Công thức</h2><table><thead><tr><th style="width:30%">Thuật ngữ</th><th>Giải nghĩa / Công thức</th></tr></thead><tbody>${glossaryHtml}</tbody></table>` : ''}
  ${cardsHtml ? `<h2>Bộ Flashcard ôn tập</h2><div class="cards">${cardsHtml}</div>` : ''}
  ${quizHtml ? `<h2>Bài kiểm tra Trắc nghiệm & Đáp án</h2>${quizHtml}` : ''}
</body>
</html>`;
}
