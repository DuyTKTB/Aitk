/* ============================================================
   DocStudio.jsx — v3 Pro (NotebookLM-Grade AI Study Studio · VIP)
   ------------------------------------------------------------
   • Đa định dạng & gộp nhiều file: PDF (50 trang + OCR), Word (.docx OMML),
     PowerPoint (.pptx Slide + Notes), Excel/CSV, Ảnh chụp (OCR), TXT/MD, Dán text
   • 6 Không gian học chuyên sâu:
     1. Tổng quan & Cẩm nang (Tóm tắt, Ý chính, Thuật ngữ, Xuất Anki/Moodle/Kahoot/A4/MD)
     2. Sơ đồ tư duy SVG tương tác (thu/mở nhánh, zoom, xuất SVG/PNG)
     3. Podcast Audio Overview 2 giọng Việt (Thầy Minh & Bạn Lan · Web Speech + Gemini TTS)
     4. Flashcard FSRS v4.5 (4 mức đánh giá chuẩn Anki, dự đoán % trí nhớ)
     5. Quiz Trắc nghiệm + Điền khuyết Cloze Active Recall
     6. Hỏi đáp RAG có trích dẫn nguồn [Đoạn N] bấm xem nguyên văn
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { askAI } from '../lib/ai.js';
import { runWithCredit, CREDIT_TARIFF } from '../lib/creditService.js';
import { useLocalStorage } from '../hooks.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { getTier } from '../lib/tier.js';
import { resolveEntitlements } from '../lib/entitlements.js';
import { db } from '../lib/firebase.js';
import { doc as fsDoc, setDoc as fsSetDoc, getDoc as fsGetDoc } from 'firebase/firestore';
import { parseJsonLoose } from '../lib/examAiUtils.js';
import { fsrsSchedule, predictCardRetentionPct } from '../lib/fsrsEngine.js';
import { gradeClozeAnswers } from '../lib/studentStudyStudio.js';
import { speak as speakVi, stop as stopVi, isSupported as isTtsSupported } from '../lib/tts.js';
import { ArcChargeLoader, PdfParseScanner } from './ElecEffectsKit.jsx';
import {
  extractPptxText,
  chunkDocumentForCitations,
  retrieveRelevantChunks,
  parseCitationIds,
  buildMindMapTree,
  layoutMindMapSvg,
  normalizePodcastScript,
  buildDocClozeItems,
  exportDocFlashcardsAnki,
  exportDocQuizMoodleXml,
  exportDocQuizKahootRows,
  exportDocMarkdown,
  buildStudyGuideHtml,
} from '../lib/docStudioEngine.js';

/* ---------- Giới hạn nâng cấp ---------- */
const MAX_PAGES = 50;
const MAX_CHARS = 90000;
const PROMPT_CHARS = 18000;
const KEEP_CHARS = 24000;
const MAX_DOCS = 20;
const ACCEPT_EXTS = '.pdf,.docx,.pptx,.xlsx,.xls,.txt,.md,.csv,.png,.jpg,.jpeg,.webp';

/* ---------- Icon ---------- */
const P = {
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  crown: 'M2 18h20l-2-9-5 4-3-7-3 7-5-4zM4 21h16',
  file: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 13h6M9 17h4',
  cards: 'M3 7h13v11H3zM8 3h13v11',
  quiz: 'M9 12l2 2 4-4M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18',
  spark: 'M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  down: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  shuffle: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6 6 18',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  text: 'M4 6h16M4 12h10M4 18h14',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  mind: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M5 6h4l1.5 3.5M19 6h-4l-1.5 3.5M5 18h4l1.5-3.5M19 18h-4l-1.5-3.5',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8',
  play: 'M6 4l14 8-14 8V4z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  stop: 'M6 6h12v12H6z',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z',
  zoomIn: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35M11 8v6M8 11h6',
  zoomOut: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35M8 11h6',
};
const Ico = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={P[n] || P.file} />
  </svg>
);

/* ---------- Tiện ích ---------- */
const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const download = (name, content, type = 'text/plain') => {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
const typingTarget = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName);
const baseName = (name) => String(name || 'doc-studio').replace(/\.[^.]+$/, '');

function sampleText(text, max) {
  if (text.length <= max) return text;
  const parts = 5;
  const size = Math.floor(max / parts);
  const step = Math.floor((text.length - size) / (parts - 1));
  return Array.from({ length: parts }, (_, i) => text.slice(i * step, i * step + size)).join('\n[...]\n');
}

function detectDocBadge(name) {
  const ext = String(name || '').toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'PDF';
  if (ext === 'docx') return 'WORD';
  if (ext === 'pptx') return 'SLIDE';
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'EXCEL';
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'ẢNH OCR';
  if (ext === 'md' || ext === 'txt') return 'TEXT';
  return 'NOTEBOOK';
}

/* ---------- Trích xuất đa định dạng (PDF / DOCX / PPTX / XLSX / ẢNH OCR / TXT / MD) ---------- */
async function extractSingleFile(file, onProgress) {
  const name = String(file?.name || '');
  if (/\.(txt|md|csv)$/i.test(name)) {
    return { text: (await file.text()).slice(0, MAX_CHARS), pages: 0, kind: 'text' };
  }
  if (/\.pdf$/i.test(name)) {
    const { readExamPdfFile } = await import('../lib/pdfExamReader.js');
    const res = await readExamPdfFile(file, {
      maxPages: MAX_PAGES,
      ocrFallback: true,
      onProgress: (p) => onProgress?.(`Đang đọc PDF trang ${p?.page || 1}/${p?.total || 1}…`),
    });
    return { text: String(res.text || '').slice(0, MAX_CHARS), pages: res.totalPdfPages || res.pages || 0, kind: 'pdf' };
  }
  if (/\.docx$/i.test(name)) {
    onProgress?.(`Đang giải mã Word + công thức OMML (${name})…`);
    try {
      const { readDocx } = await import('../lib/examDocxParser.js');
      const res = await readDocx(file);
      const joined = (res?.lines || []).map((l) => l?.t || '').filter(Boolean).join('\n');
      if (joined.trim().length >= 40) {
        return { text: joined.slice(0, MAX_CHARS), pages: 0, kind: 'docx' };
      }
    } catch { /* fallback sang mammoth fileReader */ }
    const { readFile } = await import('../lib/fileReader.js');
    const parsed = await readFile(file);
    return { text: String(parsed?.text || '').slice(0, MAX_CHARS), pages: 0, kind: 'docx' };
  }
  if (/\.pptx$/i.test(name)) {
    onProgress?.(`Đang trích xuất slide PowerPoint (${name})…`);
    const buf = await file.arrayBuffer();
    const res = await extractPptxText(buf);
    return { text: String(res.text || '').slice(0, MAX_CHARS), pages: res.slides || 0, kind: 'pptx' };
  }
  if (/\.(xlsx|xls)$/i.test(name)) {
    onProgress?.(`Đang đọc bảng tính Excel (${name})…`);
    const { readFile } = await import('../lib/fileReader.js');
    const parsed = await readFile(file);
    return { text: String(parsed?.text || '').slice(0, MAX_CHARS), pages: 0, kind: 'xlsx' };
  }
  if (/\.(png|jpe?g|webp)$/i.test(name) || file?.type?.startsWith('image/')) {
    onProgress?.(`AI Vision đang quét chữ từ ảnh (${name})…`);
    const [{ fileToCompressedDataUrl }, { ocrImages }] = await Promise.all([
      import('../lib/imageUtils.js'),
      import('../lib/aiOcr.js'),
    ]);
    const dataUrl = await fileToCompressedDataUrl(file);
    const ocrText = await ocrImages([dataUrl], {
      onProgress: (p) => onProgress?.(`AI OCR ảnh ${p?.done || 1}/${p?.total || 1}…`),
    });
    return { text: String(ocrText || '').slice(0, MAX_CHARS), pages: 1, kind: 'image' };
  }
  return { text: null, pages: 0, kind: 'unknown' };
}

/* Gọi AI — bọc trừ Credit chuẩn + tự hoàn 100% nếu lỗi/sai JSON */
async function callAI(prompt, system, onText, userId = null, cost = CREDIT_TARIFF.ERROR_ANALYSIS, reason = 'AI Studio Tài liệu', validate = null) {
  return runWithCredit({ userId, cost, reason }, async () => {
    let raw = '';
    const msg = { role: 'user', parts: [{ text: prompt }], text: prompt };
    const res = await askAI([msg], (c) => {
      if (typeof c !== 'string' || !c) return;
      const head = raw.slice(0, 30);
      raw = c.length >= raw.length && c.startsWith(head) ? c : raw + c;
      onText?.(raw);
    }, null, system);
    const t = String((res && typeof res === 'object' ? res.text : typeof res === 'string' ? res : '') || raw || '').trim();
    if (!t) throw new Error('AI không trả về nội dung (ELEC Credit đã được hoàn trả).');
    if (typeof validate === 'function') return validate(t);
    return t;
  });
}

function parseJSON(raw) {
  const parsed = parseJsonLoose(raw);
  if (parsed && typeof parsed === 'object') return parsed;
  const s = String(raw || '').replace(/```(?:json)?/gi, '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1).replace(/,\s*([}\]])/g, '$1')); } catch { return null; }
}

function normalize(data, nCards, nQuiz) {
  const flashcards = (data?.flashcards || [])
    .filter((c) => c && c.q && c.a)
    .map((c) => ({ q: String(c.q).trim(), a: String(c.a).trim() }))
    .slice(0, nCards);

  const quiz = (data?.quiz || [])
    .filter((q) => q && q.q && Array.isArray(q.opts) && q.opts.length >= 2)
    .map((q) => {
      const opts = q.opts.slice(0, 4).map((o) => String(o).replace(/^[A-D][.):]\s*/i, '').trim());
      const c = Math.min(Math.max(parseInt(q.correct, 10) || 0, 0), opts.length - 1);
      const order = shuffle(opts.map((_, i) => i));
      return {
        q: String(q.q).trim(),
        opts: order.map((i) => opts[i]),
        correct: order.indexOf(c),
        explain: q.explain ? String(q.explain).trim() : '',
      };
    })
    .slice(0, nQuiz);

  const glossary = (data?.glossary || [])
    .filter((g) => g && (g.term || g.t) && (g.def || g.d))
    .map((g) => ({
      term: String(g.term || g.t).trim(),
      def: String(g.def || g.d).trim(),
    }))
    .slice(0, 10);

  const mindmap = data?.mindmap && typeof data.mindmap === 'object' && Array.isArray(data.mindmap.children)
    ? data.mindmap
    : null;

  const podcast = Array.isArray(data?.podcast) && data.podcast.length >= 2
    ? data.podcast
        .filter((p) => p && p.text)
        .map((p, i) => ({
          speaker: String(p.speaker || (i % 2 === 0 ? 'Thầy Minh' : 'Bạn Lan')).trim(),
          role: /lan|học sinh|bạn/i.test(String(p.speaker || '')) || i % 2 === 1 ? 'student' : 'host',
          text: String(p.text).trim(),
        }))
        .slice(0, 14)
    : null;

  return {
    summary: String(data?.summary || '').trim(),
    keyPoints: (data?.keyPoints || []).map((k) => String(k).trim()).filter(Boolean).slice(0, 10),
    glossary,
    mindmap,
    podcast,
    flashcards,
    quiz,
  };
}

const LEVELS = {
  easy: 'cơ bản, bám sát định nghĩa và dữ kiện trong tài liệu',
  mix: 'cân bằng giữa nhớ kiến thức và hiểu/vận dụng',
  hard: 'nâng cao, đòi hỏi suy luận, so sánh, vận dụng; đáp án nhiễu phải hợp lý',
};

/* ---------- Vòng tiến độ ---------- */
function Ring({ value, size = 84, label }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="dst-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="bg" />
        <circle cx={size / 2} cy={size / 2} r={r} className="fg" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} />
      </svg>
      <b>{label ?? `${Math.round(value * 100)}%`}</b>
    </div>
  );
}

/* ============================================================
   TAB 2: SƠ ĐỒ TƯ DUY SVG TƯƠNG TÁC (MIND MAP)
   ============================================================ */
function MindMapView({ doc }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(null);
  const svgRef = useRef(null);

  const tree = useMemo(() => buildMindMapTree(doc), [doc]);
  const layout = useMemo(() => layoutMindMapSvg(tree, collapsed), [tree, collapsed]);

  const toggleBranch = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportSvg = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    download(`${baseName(doc.name)}-mindmap.svg`, xml, 'image/svg+xml');
  };

  const exportPng = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = layout.width * scale;
      canvas.height = layout.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${baseName(doc.name)}-mindmap.png`;
        a.click();
      }, 'image/png');
    };
    img.src = url;
  };

  return (
    <div className="dst-mm">
      <div className="dst-bar">
        <span className="dst-cnt"><Ico n="mind" s={15} /> Bấm vào nhánh màu để thu gọn/mở rộng · Bấm thẻ để xem đầy đủ</span>
        <div className="dst-mm-tools">
          <button type="button" className="dst-ghost sm" onClick={() => setZoom((z) => Math.max(0.65, +(z - 0.15).toFixed(2)))} aria-label="Thu nhỏ"><Ico n="zoomOut" s={14} /></button>
          <small className="dst-cnt">{Math.round(zoom * 100)}%</small>
          <button type="button" className="dst-ghost sm" onClick={() => setZoom((z) => Math.min(1.45, +(z + 0.15).toFixed(2)))} aria-label="Phóng to"><Ico n="zoomIn" s={14} /></button>
          <button type="button" className="dst-ghost sm" onClick={() => setCollapsed(new Set())}>Mở hết</button>
          <button type="button" className="dst-ghost sm" onClick={exportSvg}><Ico n="down" s={14} /> SVG</button>
          <button type="button" className="dst-btn sm" onClick={exportPng}><Ico n="down" s={14} /> Tải ảnh PNG</button>
        </div>
      </div>

      {selected && (
        <div className="dst-mm-focus" style={{ borderColor: selected.color }}>
          <span className="dst-dot" style={{ background: selected.color }} />
          <div>
            <small>{selected.depth === 0 ? 'Chủ đề trung tâm' : selected.depth === 1 ? 'Nhánh kiến thức chính' : 'Ý chi tiết'}</small>
            <b>{selected.label}</b>
          </div>
          <button type="button" className="dst-ghost sm" onClick={() => setSelected(null)}><Ico n="x" s={13} /></button>
        </div>
      )}

      <div className="dst-mm-canvas">
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          width={Math.round(layout.width * zoom)}
          height={Math.round(layout.height * zoom)}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="dst-mm-svg"
        >
          <defs>
            <linearGradient id="dstRootGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {layout.edges.map((e) => {
            const mx = (e.x1 + e.x2) / 2;
            return (
              <path
                key={e.id}
                d={`M ${e.x1} ${e.y1} C ${mx} ${e.y1}, ${mx} ${e.y2}, ${e.x2} ${e.y2}`}
                fill="none"
                stroke={e.color}
                strokeWidth="2.2"
                strokeOpacity="0.48"
              />
            );
          })}

          {layout.nodes.map((n) => {
            const isRoot = n.depth === 0;
            const isBranch = n.depth === 1;
            const isSel = selected?.id === n.id;
            return (
              <g
                key={n.id}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelected(n);
                  if (isBranch && n.hasChildren) toggleBranch(n.id);
                }}
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={isRoot ? 16 : isBranch ? 12 : 10}
                  fill={isRoot ? 'url(#dstRootGrad)' : isBranch ? n.color : '#f8fafc'}
                  fillOpacity={isRoot ? 1 : isBranch ? 0.13 : 1}
                  stroke={n.color}
                  strokeWidth={isSel ? 2.6 : isRoot ? 0 : isBranch ? 1.6 : 1.1}
                />
                <text
                  x={n.x + 12}
                  y={n.y + n.h / 2 + 4}
                  fontSize={isRoot ? 13 : isBranch ? 12.2 : 11.4}
                  fontWeight={isRoot || isBranch ? 700 : 500}
                  fill={isRoot ? '#ffffff' : isBranch ? n.color : '#0f172a'}
                  fontFamily="DM Sans, Segoe UI, system-ui, sans-serif"
                >
                  {n.label.length > (isRoot ? 26 : isBranch ? 28 : 40)
                    ? n.label.slice(0, isRoot ? 25 : isBranch ? 27 : 39) + '…'
                    : n.label}
                </text>
                {isBranch && n.hasChildren && (
                  <g transform={`translate(${n.x + n.w - 22}, ${n.y + n.h / 2 - 9})`}>
                    <rect width="18" height="18" rx="9" fill={n.color} fillOpacity="0.9" />
                    <text x="9" y="13" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
                      {n.collapsed ? `+${n.childCount}` : '−'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 3: PODCAST AUDIO OVERVIEW (2 GIỌNG VIỆT KIỂU NOTEBOOKLM)
   ============================================================ */
function PodcastStudio({ doc, onSavePodcast }) {
  const { user } = useAuth();
  const uid = user?.uid || user?.id;
  const script = useMemo(() => normalizePodcastScript(doc.podcast, doc), [doc]);
  const [playing, setPlaying] = useState(false);
  const [curIdx, setCurIdx] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [genBusy, setGenBusy] = useState(false);
  const [status, setStatus] = useState('');
  const runRef = useRef(0);

  const stopAll = useCallback(() => {
    runRef.current += 1;
    stopVi();
    setPlaying(false);
  }, []);

  useEffect(() => () => {
    runRef.current += 1;
    stopVi();
  }, [doc.id]);

  const playFrom = useCallback(async (startIdx) => {
    if (!isTtsSupported()) {
      setStatus('Trình duyệt hiện tại không hỗ trợ phát giọng nói.');
      return;
    }
    const token = ++runRef.current;
    setPlaying(true);
    setStatus('');

    for (let i = startIdx; i < script.length; i++) {
      if (token !== runRef.current) return;
      setCurIdx(i);
      const line = script[i];
      const pitch = line.role === 'student' ? 1.12 : 0.94;
      try {
        const res = await speakVi(line.text, { rate, pitch });
        if (res?.canceled || token !== runRef.current) return;
      } catch (e) {
        if (token !== runRef.current) return;
        setStatus(e?.message || 'Không thể phát âm thanh cho câu này.');
        setPlaying(false);
        return;
      }
    }
    if (token === runRef.current) {
      setPlaying(false);
    }
  }, [script, rate]);

  const regenerateDeepPodcast = async () => {
    if (genBusy) return;
    stopAll();
    setGenBusy(true);
    setStatus('');
    const prompt =
      'Hãy viết một kịch bản Podcast ôn bài sinh động, tự nhiên, dễ nhớ bằng tiếng Việt giữa 2 người:\n' +
      '- "Thầy Minh" (giảng viên vui tính, giải thích bản chất sâu sắc, hay lấy ví dụ đời thực)\n' +
      '- "Bạn Lan" (học sinh thông minh, đặt câu hỏi xoáy đúng chỗ dễ nhầm khi thi)\n' +
      'Trả về DUY NHẤT JSON hợp lệ: {"podcast":[{"speaker":"Thầy Minh","text":"..."},{"speaker":"Bạn Lan","text":"..."}]}\n' +
      'Yêu cầu: 8–10 lượt thoại ngắn gọn (mỗi lượt 1–3 câu), tự nhiên như NotebookLM Audio Overview, không dùng ký hiệu LaTeX.\n\n' +
      `TÀI LIỆU (${doc.name}):\n${sampleText(doc.text || doc.summary || '', 10000)}`;
    try {
      const lines = await callAI(
        prompt,
        'Bạn là biên kịch Podcast giáo dục xuất sắc. Chỉ trả về JSON hợp lệ.',
        null,
        uid,
        CREDIT_TARIFF.CHAT_FAST,
        'AI Tạo kịch bản Podcast Nghe bài',
        (raw) => {
          const parsed = parseJSON(raw);
          const arr = Array.isArray(parsed?.podcast) ? parsed.podcast : Array.isArray(parsed) ? parsed : [];
          const clean = arr.filter((x) => x && x.text).map((x, i) => ({
            speaker: String(x.speaker || (i % 2 === 0 ? 'Thầy Minh' : 'Bạn Lan')).trim(),
            role: /lan|học sinh|bạn/i.test(String(x.speaker || '')) || i % 2 === 1 ? 'student' : 'host',
            text: String(x.text).trim(),
          })).slice(0, 14);
          if (clean.length < 3) throw new Error('Kịch bản Podcast chưa đủ dài (đã hoàn Credit) — thử lại nhé.');
          return clean;
        }
      );
      onSavePodcast?.(lines);
      setCurIdx(0);
      setStatus('Đã tạo kịch bản Podcast chuyên sâu! Bấm Phát để nghe ngay.');
    } catch (e) {
      setStatus(e?.message || 'Không tạo được kịch bản Podcast.');
    } finally {
      setGenBusy(false);
    }
  };

  return (
    <div className="dst-pod">
      <div className="dst-pod-deck">
        <div className="dst-pod-info">
          <div className={`dst-pod-art ${playing ? 'spin' : ''}`}>
            <Ico n="mic" s={24} />
          </div>
          <div>
            <span className="dst-pill-mini">NOTEBOOKLM AUDIO OVERVIEW</span>
            <h3>Podcast 2 giọng: Thầy Minh &amp; Bạn Lan</h3>
            <small>{script.length} lượt thoại · Đang ở câu {curIdx + 1}/{script.length} · Giọng Việt tự nhiên</small>
          </div>
        </div>

        <div className="dst-pod-ctrl">
          <button
            type="button"
            className="dst-btn"
            onClick={() => (playing ? stopAll() : playFrom(curIdx))}
            disabled={genBusy}
          >
            <Ico n={playing ? 'stop' : 'play'} s={16} />
            {playing ? 'Dừng phát' : curIdx > 0 ? `Phát tiếp (Câu ${curIdx + 1})` : 'Nghe Podcast'}
          </button>
          <button type="button" className="dst-ghost" onClick={() => playFrom(0)} disabled={genBusy}>
            <Ico n="repeat" s={15} /> Nghe từ đầu
          </button>
          <div className="dst-seg" title="Tốc độ đọc">
            {[0.85, 1.0, 1.25].map((r) => (
              <button key={r} type="button" className={rate === r ? 'on' : ''} onClick={() => setRate(r)}>
                {r}x
              </button>
            ))}
          </div>
          <button
            type="button"
            className="dst-ghost"
            onClick={regenerateDeepPodcast}
            disabled={genBusy}
          >
            <Ico n="spark" s={15} /> {genBusy ? 'AI đang viết kịch bản…' : 'AI Viết kịch bản chuyên sâu'}
          </button>
        </div>
        {status && <p className="dst-pod-status">{status}</p>}
      </div>

      <div className="dst-pod-list">
        {script.map((line, idx) => {
          const isCur = idx === curIdx;
          const isHost = line.role !== 'student';
          return (
            <button
              key={idx}
              type="button"
              className={`dst-pod-line ${isHost ? 'host' : 'stu'} ${isCur ? 'now' : ''}`}
              onClick={() => playFrom(idx)}
            >
              <span className="dst-pod-av">{isHost ? 'TM' : 'BL'}</span>
              <div className="dst-pod-txt">
                <b>{line.speaker} {isCur && playing && <em className="dst-live">● Đang nói</em>}</b>
                <p>{line.text}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   TAB 4: FLASHCARD FSRS v4.5 (4 MỨC ĐÁNH GIÁ + DỰ ĐOÁN % TRÍ NHỚ)
   ============================================================ */
function Flashcards({ doc, onRateCard }) {
  const [filter, setFilter] = useState('all');
  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const known = doc.progress?.known || {};
  const fsrsMap = doc.progress?.fsrs || {};
  const now = Date.now();
  const knownCount = doc.flashcards.filter((_, k) => known[k]).length;
  const dueCount = doc.flashcards.filter((_, k) => {
    const st = fsrsMap[k];
    return !st || !st.dueAt || st.dueAt <= now;
  }).length;

  const list = useMemo(() => {
    let arr = doc.flashcards.map((c, k) => ({ ...c, k }));
    if (filter === 'unknown') arr = arr.filter((c) => !known[c.k]);
    if (filter === 'due') arr = arr.filter((c) => !fsrsMap[c.k] || !fsrsMap[c.k].dueAt || fsrsMap[c.k].dueAt <= Date.now());
    return seed ? shuffle(arr) : arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id, filter, seed]);

  const card = list[i];
  const cardFsrs = card ? fsrsMap[card.k] : null;
  const retentionPct = cardFsrs ? predictCardRetentionPct(cardFsrs, now) : null;

  const go = useCallback((d) => {
    setOpen(false);
    setI((x) => Math.min(list.length - 1, Math.max(0, x + d)));
  }, [list.length]);

  const rate = useCallback((rating) => {
    if (!list[i]) return;
    onRateCard(list[i].k, rating);
    setOpen(false);
    if (i < list.length - 1) setI(i + 1);
  }, [i, list, onRateCard]);

  useEffect(() => {
    const onKey = (e) => {
      if (typingTarget(e)) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (['1', '2', '3', '4'].includes(e.key)) rate(Number(e.key));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, rate]);

  const reset = (f) => { setFilter(f); setI(0); setOpen(false); };

  return (
    <div>
      <div className="dst-bar">
        <div className="dst-seg">
          <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => reset('all')}>Tất cả ({doc.flashcards.length})</button>
          <button type="button" className={filter === 'due' ? 'on' : ''} onClick={() => reset('due')}>Đến hạn FSRS ({dueCount})</button>
          <button type="button" className={filter === 'unknown' ? 'on' : ''} onClick={() => reset('unknown')}>Chưa thuộc ({doc.flashcards.length - knownCount})</button>
        </div>
        <button type="button" className="dst-ghost" onClick={() => { setSeed((x) => x + 1); setI(0); setOpen(false); }}>
          <Ico n="shuffle" s={15} /> Xáo trộn
        </button>
        <button
          type="button"
          className="dst-ghost"
          onClick={() => download(`${baseName(doc.name)}-anki.txt`, exportDocFlashcardsAnki(doc))}
          title="File TSV có tag nhập thẳng vào Anki / AnkiDroid"
        >
          <Ico n="down" s={15} /> Anki
        </button>
      </div>

      {!card ? (
        <div className="dst-empty">
          <Ico n="check" s={30} />
          <b>Hoàn thành hết thẻ trong mục này!</b>
          <span>Chuyển sang "Tất cả" để ôn lại hoặc sang tab Quiz &amp; Cloze để kiểm tra.</span>
        </div>
      ) : (
        <>
          <div className="dst-prog"><i style={{ width: `${((i + 1) / list.length) * 100}%` }} /></div>
          <div className="dst-fc-meta">
            <small className="dst-cnt">Thẻ {i + 1}/{list.length} · đã thuộc {knownCount}/{doc.flashcards.length}</small>
            <small className="dst-fsrs-pill">
              {cardFsrs
                ? `FSRS v4.5 · Trí nhớ ~${retentionPct}% · Chu kỳ ${cardFsrs.interval} ngày`
                : 'Thẻ mới · FSRS v4.5 sẵn sàng'}
            </small>
          </div>
          <button type="button" className={`dst-flip ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label="Lật thẻ">
            <span className="face front"><em>Câu hỏi</em><b>{card.q}</b><small>Bấm thẻ hoặc nhấn Space để lật đáp án</small></span>
            <span className="face back"><em>Đáp án</em><b>{card.a}</b><small>Chọn mức nhớ bên dưới (phím 1–4) để FSRS lên lịch ôn</small></span>
          </button>
          <div className="dst-rate">
            <button type="button" className="dst-ghost" onClick={() => go(-1)} disabled={i === 0} aria-label="Thẻ trước"><Ico n="left" /></button>
            <button type="button" className="dst-rbtn r1" onClick={() => rate(1)}>Quên <kbd>1</kbd></button>
            <button type="button" className="dst-rbtn r2" onClick={() => rate(2)}>Khó <kbd>2</kbd></button>
            <button type="button" className="dst-rbtn r3" onClick={() => rate(3)}>Nhớ tốt <kbd>3</kbd></button>
            <button type="button" className="dst-rbtn r4" onClick={() => rate(4)}>Rất dễ <kbd>4</kbd></button>
            <button type="button" className="dst-ghost" onClick={() => go(1)} disabled={i >= list.length - 1} aria-label="Thẻ sau"><Ico n="right" /></button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   TAB 5: QUIZ TRẮC NGHIỆM + ĐIỀN KHUYẾT CLOZE ACTIVE RECALL
   ============================================================ */
function ClozePractice({ doc }) {
  const items = useMemo(() => buildDocClozeItems(doc, 6), [doc]);
  const [idx, setIdx] = useState(0);
  const [inputs, setInputs] = useState({});
  const [checked, setChecked] = useState(false);

  const cur = items[idx];
  const grade = useMemo(() => {
    if (!cur || !checked) return null;
    const ansArr = cur.blanks.map((_, bi) => inputs[bi] || '');
    return gradeClozeAnswers(cur.blanks, ansArr);
  }, [cur, checked, inputs]);

  if (!items.length) {
    return (
      <div className="dst-empty">
        <Ico n="book" s={28} />
        <b>Chưa đủ dữ liệu tạo bài điền khuyết Cloze</b>
        <span>Hãy tải tài liệu dài hơn để tạo bài tập Active Recall tự động.</span>
      </div>
    );
  }

  const switchItem = (nextIdx) => {
    setIdx(nextIdx);
    setInputs({});
    setChecked(false);
  };

  return (
    <div className="dst-cloze">
      <div className="dst-bar">
        <span className="dst-cnt">Bài điền khuyết {idx + 1}/{items.length} · <b>{cur.title}</b></span>
        <div className="dst-seg">
          {items.map((_, k) => (
            <button key={k} type="button" className={idx === k ? 'on' : ''} onClick={() => switchItem(k)}>
              #{k + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="dst-cloze-box">
        {cur.segments.map((seg, si) => {
          if (seg.type === 'text') return <span key={si}>{seg.value}</span>;
          const res = grade?.details?.[seg.index];
          const cls = !checked ? '' : res?.ok ? 'ok' : 'bad';
          return (
            <span key={si} className="dst-cloze-slot">
              <input
                className={`dst-cloze-inp ${cls}`}
                value={inputs[seg.index] || ''}
                onChange={(e) => {
                  setInputs((p) => ({ ...p, [seg.index]: e.target.value }));
                  if (checked) setChecked(false);
                }}
                placeholder={`Lỗ #${seg.index + 1}`}
                style={{ width: `${Math.max(8, Math.min(22, seg.answer.length + 3))}ch` }}
              />
              {checked && !res?.ok && <em className="dst-cloze-ans">→ {seg.answer}</em>}
            </span>
          );
        })}
      </div>

      <div className="dst-actions left">
        <button type="button" className="dst-btn" onClick={() => setChecked(true)}>
          <Ico n="check" s={15} /> Chấm điểm
        </button>
        <button
          type="button"
          className="dst-ghost"
          onClick={() => {
            const filled = {};
            cur.blanks.forEach((b, bi) => { filled[bi] = b.answer; });
            setInputs(filled);
            setChecked(true);
          }}
        >
          Hiện đáp án
        </button>
        {idx < items.length - 1 && (
          <button type="button" className="dst-ghost" onClick={() => switchItem(idx + 1)}>
            Bài tiếp theo <Ico n="right" s={15} />
          </button>
        )}
        {grade && (
          <span className={`dst-cloze-score ${grade.pct >= 70 ? 'ok' : 'bad'}`}>
            Đúng {grade.correct}/{cur.blanks.length} ({grade.pct}%)
          </span>
        )}
      </div>
    </div>
  );
}

function QuizAndCloze({ doc, onFinish }) {
  const [mode, setMode] = useState('quiz');
  const total = doc.quiz.length;
  const [order, setOrder] = useState(() => shuffle(doc.quiz.map((_, k) => k)));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);
  const [sec, setSec] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (done || mode !== 'quiz') return undefined;
    const t = setInterval(() => setSec(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [done, mode]);

  const q = doc.quiz[order[idx]];
  const score = answers.filter((a) => a.pick === doc.quiz[a.k].correct).length;

  const pick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    setAnswers((a) => [...a, { k: order[idx], pick: i }]);
  };
  const next = useCallback(() => {
    if (picked === null) return;
    if (idx + 1 >= order.length) {
      setDone(true);
      const s = answers.filter((a) => a.pick === doc.quiz[a.k].correct).length;
      onFinish?.(s, order.length, order.length === total);
      return;
    }
    setIdx(idx + 1); setPicked(null);
  }, [picked, idx, order.length, answers, doc.quiz, onFinish, total]);

  useEffect(() => {
    if (mode !== 'quiz') return undefined;
    const onKey = (e) => {
      if (typingTarget(e) || done) return;
      const n = ['1', '2', '3', '4'].indexOf(e.key);
      if (n >= 0 && n < (q?.opts.length || 0)) pick(n);
      else if (e.key === 'Enter' || e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const restart = (ks) => {
    setOrder(shuffle(ks)); setIdx(0); setPicked(null); setAnswers([]); setDone(false);
    startRef.current = Date.now(); setSec(0);
  };

  return (
    <div>
      <div className="dst-bar">
        <div className="dst-seg">
          <button type="button" className={mode === 'quiz' ? 'on' : ''} onClick={() => setMode('quiz')}>Trắc nghiệm ({total})</button>
          <button type="button" className={mode === 'cloze' ? 'on' : ''} onClick={() => setMode('cloze')}>Điền khuyết Cloze</button>
        </div>
        {mode === 'quiz' && !done && (
          <>
            <small className="dst-cnt">Câu {idx + 1}/{order.length}</small>
            <small className="dst-ok">Đúng {score}</small>
            <small className="dst-cnt"><Ico n="clock" s={13} /> {fmtTime(sec)}</small>
          </>
        )}
      </div>

      {mode === 'cloze' ? (
        <ClozePractice doc={doc} />
      ) : done ? (
        <div className="dst-result">
          <Ring value={score / order.length} size={120} label={`${score}/${order.length}`} />
          <h3>
            {score === order.length
              ? 'Tuyệt đối! Bạn nắm chắc tài liệu này.'
              : score / order.length >= 0.7
                ? 'Rất tốt, sắp thành thạo rồi!'
                : 'Cần ôn thêm — xem lại flashcard & sơ đồ tư duy nhé.'}
          </h3>
          <small><Ico n="clock" s={13} /> {fmtTime(sec)} · {Math.round((score / order.length) * 100)}% chính xác</small>
          <div className="dst-actions">
            {answers.some((a) => a.pick !== doc.quiz[a.k].correct) && (
              <button type="button" className="dst-btn" onClick={() => restart(answers.filter((a) => a.pick !== doc.quiz[a.k].correct).map((a) => a.k))}>
                <Ico n="repeat" s={16} /> Làm lại {answers.filter((a) => a.pick !== doc.quiz[a.k].correct).length} câu sai
              </button>
            )}
            <button type="button" className="dst-ghost" onClick={() => restart(doc.quiz.map((_, k) => k))}>Làm lại toàn bộ</button>
          </div>
          {answers.some((a) => a.pick !== doc.quiz[a.k].correct) && (
            <div className="dst-review">
              <h4>Xem lại câu sai</h4>
              {answers.filter((a) => a.pick !== doc.quiz[a.k].correct).map((a) => {
                const w = doc.quiz[a.k];
                return (
                  <div key={a.k} className="dst-rv">
                    <b>{w.q}</b>
                    <span className="bad"><Ico n="x" s={13} /> Bạn chọn: {w.opts[a.pick]}</span>
                    <span className="ok"><Ico n="check" s={13} /> Đúng: {w.opts[w.correct]}</span>
                    {w.explain && <p>{w.explain}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="dst-prog"><i style={{ width: `${(idx / order.length) * 100}%` }} /></div>
          <h3 className="dst-q">{q.q}</h3>
          <div className="dst-opts">
            {q.opts.map((o, i) => {
              const show = picked !== null;
              const cls = show && i === q.correct ? 'good' : show && i === picked ? 'bad' : show ? 'dim' : '';
              return (
                <button key={i} type="button" disabled={show} className={`dst-opt ${cls}`} onClick={() => pick(i)}>
                  <kbd>{String.fromCharCode(65 + i)}</kbd><span>{o}</span>
                  {show && i === q.correct && <Ico n="check" s={18} />}
                  {show && i === picked && i !== q.correct && <Ico n="x" s={18} />}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <>
              {q.explain && <p className="dst-explain"><Ico n="spark" s={15} /> {q.explain}</p>}
              <div className="dst-actions">
                <button type="button" className="dst-btn" onClick={next}>
                  {idx + 1 >= order.length ? 'Xem kết quả' : 'Câu tiếp theo'} <Ico n="right" s={16} />
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================
   TAB 6: HỎI ĐÁP RAG CÓ TRÍCH DẪN NGUỒN [Đoạn N]
   ============================================================ */
function AskDoc({ doc }) {
  const { user } = useAuth();
  const uid = user?.uid || user?.id;
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeChunkId, setActiveChunkId] = useState(null);
  const [showAllSources, setShowAllSources] = useState(false);
  const endRef = useRef(null);

  const chunks = useMemo(
    () => chunkDocumentForCitations(doc.text || doc.summary || ''),
    [doc.text, doc.summary]
  );

  useEffect(() => {
    setMsgs([]);
    setActiveChunkId(null);
    setShowAllSources(false);
  }, [doc.id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs]);

  const send = async (q) => {
    const question = String(q ?? text).trim();
    if (!question || busy) return;
    setText(''); setBusy(true);
    const relevant = retrieveRelevantChunks(chunks, question, 5);
    const sourceContext = relevant.length
      ? relevant.map((c) => `[Đoạn ${c.id}]${c.pageHint ? ` (${c.pageHint})` : ''}\n${c.text}`).join('\n\n')
      : (doc.text || doc.summary || '');

    const history = msgs.slice(-6).map((m) => `${m.role === 'user' ? 'Người học' : 'Trợ lý'}: ${m.text}`).join('\n');
    setMsgs((m) => [...m, { role: 'user', text: question }, { role: 'ai', text: '', usedIds: relevant.map((c) => c.id) }]);

    const prompt =
      `CÁC ĐOẠN NGUỒN TỪ TÀI LIỆU "${doc.name}":\n${sourceContext}\n\n` +
      `${history ? `HỘI THOẠI TRƯỚC:\n${history}\n\n` : ''}` +
      `CÂU HỎI: ${question}\n\n` +
      'Yêu cầu trả lời tiếng Việt súc tích, chính xác, CHỈ dựa vào các đoạn nguồn trên. ' +
      'Gắn trích dẫn [Đoạn X] ngay sau ý lấy từ đoạn đó. Nếu không có trong nguồn, nói rõ "Tài liệu không nhắc tới điều này". Không dùng LaTeX.';
    try {
      const out = await callAI(
        prompt,
        'Bạn là trợ lý học tập NotebookLM, trả lời có trích dẫn nguồn [Đoạn N] chính xác. Không dùng LaTeX.',
        (t) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, text: t } : x))),
        uid,
        CREDIT_TARIFF.CHAT_FAST,
        'Hỏi đáp RAG AI Studio Tài liệu'
      );
      setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, text: out || 'Mình chưa trả lời được, thử hỏi lại nhé.' } : x)));
    } catch (e) {
      setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, text: e?.isQuota ? 'Bạn đã hết lượt AI hôm nay.' : (e?.message || 'Có lỗi khi gọi AI.') } : x)));
    } finally { setBusy(false); }
  };

  const activeChunk = chunks.find((c) => c.id === activeChunkId) || null;
  const chips = [
    'Tóm tắt công thức & ý cốt lõi nhất',
    'Giải thích nội dung này cực dễ hiểu như cho lớp 6',
    'Lập bảng so sánh các khái niệm chính',
    'Ra 5 câu hỏi bẫy dễ sai khi thi kèm đáp án',
    'Ra 3 câu tự luận trọng tâm + gợi ý dàn ý',
  ];

  return (
    <div className="dst-ask">
      <div className="dst-bar">
        <span className="dst-cnt"><Ico n="book" s={14} /> Đã lập chỉ mục {chunks.length} đoạn nguồn để trích dẫn chính xác</span>
        {chunks.length > 0 && (
          <button type="button" className="dst-ghost sm" onClick={() => setShowAllSources((v) => !v)}>
            {showAllSources ? 'Ẩn kho đoạn nguồn' : `Xem ${chunks.length} đoạn nguồn`}
          </button>
        )}
      </div>

      {activeChunk && (
        <div className="dst-cite-box">
          <div className="dst-cite-head">
            <b>Trích dẫn gốc · [{activeChunk.label}]{activeChunk.pageHint ? ` · ${activeChunk.pageHint}` : ''}</b>
            <button type="button" className="dst-ghost sm" onClick={() => setActiveChunkId(null)}><Ico n="x" s={13} /></button>
          </div>
          <p>{activeChunk.text}</p>
        </div>
      )}

      {showAllSources && chunks.length > 0 && (
        <div className="dst-src-drawer">
          {chunks.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`dst-src-item ${activeChunkId === c.id ? 'on' : ''}`}
              onClick={() => setActiveChunkId(c.id)}
            >
              <b>[{c.label}]</b>
              <span>{c.text.slice(0, 120)}{c.text.length > 120 ? '…' : ''}</span>
            </button>
          ))}
        </div>
      )}

      <div className="dst-chat">
        {!msgs.length && (
          <div className="dst-empty">
            <Ico n="chat" s={28} />
            <b>Hỏi đáp chuyên sâu có trích dẫn [Đoạn N]</b>
            <div className="dst-chips">
              {chips.map((c) => <button key={c} type="button" onClick={() => send(c)}>{c}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => {
          const cited = m.role === 'ai' ? parseCitationIds(m.text, chunks.length) : [];
          const showCites = cited.length ? cited : (m.role === 'ai' && m.text && m.usedIds?.length ? m.usedIds.slice(0, 3) : []);
          return (
            <div key={i} className={`dst-msg ${m.role}`}>
              <div>{m.text || <span className="dst-dots"><i /><i /><i /></span>}</div>
              {showCites.length > 0 && (
                <div className="dst-cite-row">
                  <span>Nguồn:</span>
                  {showCites.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`dst-cite-pill ${activeChunkId === id ? 'on' : ''}`}
                      onClick={() => setActiveChunkId(id)}
                    >
                      Đoạn {id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="dst-askbar" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Hỏi bất kỳ điều gì về tài liệu… (AI tự trích dẫn đoạn gốc)" disabled={busy} />
        <button type="submit" className="dst-btn" disabled={busy || !text.trim()} aria-label="Gửi"><Ico n="send" s={16} /></button>
      </form>
    </div>
  );
}

/* ============================================================
   TRANG CHÍNH — DOC STUDIO PRO
   ============================================================ */
export default function DocStudio() {
  const { user, tier: ctxTier } = useAuth();
  const pro = useTeacherPro();
  const uid = user?.uid || user?.id;
  const [localTier, setLocalTier] = useState('loading');
  const [docs, setDocs] = useLocalStorage('cs-doc-study', []);
  const [cloud, setCloud] = useState('idle');
  const cloudLoadedRef = useRef(false);

  useEffect(() => {
    if (!uid) { setLocalTier('anon'); return; }
    let off = false;
    getTier(uid).then((t) => { if (!off) setLocalTier(t?.key === 'vip' || t?.key === 'pro' ? t.key : 'free'); }).catch(() => { if (!off) setLocalTier('free'); });
    return () => { off = true; };
  }, [uid]);

  const effectiveTier = ctxTier?.key ? ctxTier : (localTier === 'vip' || localTier === 'pro' ? { key: localTier } : null);
  const ent = useMemo(() => resolveEntitlements({ user, pro, tier: effectiveTier }), [user, pro, effectiveTier]);
  const isVip = ent.hasVipAccess;

  useEffect(() => {
    if (!uid || !isVip) return undefined;
    let active = true;
    (async () => {
      try {
        const snap = await fsGetDoc(fsDoc(db, 'users', uid, 'docStudioDocs', 'library'));
        if (active && snap.exists() && Array.isArray(snap.data().docs) && snap.data().docs.length) {
          setDocs(snap.data().docs);
        }
      } catch { /* giữ bản local */ }
      finally {
        if (active) cloudLoadedRef.current = true;
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, isVip]);

  useEffect(() => {
    if (!uid || !isVip || !cloudLoadedRef.current) return undefined;
    setCloud('syncing');
    const t = setTimeout(() => {
      fsSetDoc(fsDoc(db, 'users', uid, 'docStudioDocs', 'library'), { docs, at: Date.now() })
        .then(() => setCloud('saved'))
        .catch(() => setCloud('error'));
    }, 800);
    return () => clearTimeout(t);
  }, [docs, uid, isVip]);

  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState('summary');
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [drag, setDrag] = useState(false);
  const [paste, setPaste] = useState(false);
  const [pasted, setPasted] = useState('');
  const [nCards, setNCards] = useState(10);
  const [nQuiz, setNQuiz] = useState(8);
  const [level, setLevel] = useState('mix');
  const [search, setSearch] = useState('');
  const [delId, setDelId] = useState(null);
  const cancelRef = useRef(0);

  const flashToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? '' : cur)), 2600);
  }, []);

  const checking = !isVip && (localTier === 'loading' || (uid && ctxTier == null && localTier === 'loading'));
  const active = docs.find((d) => d.id === activeId) || null;

  const patchDoc = useCallback((id, fn) => {
    setDocs((all) => all.map((d) => (d.id === id ? { ...d, ...fn(d) } : d)));
  }, [setDocs]);

  /* ---------- AI Sinh trọn bộ Notebook (Tóm tắt + Thuật ngữ + MindMap + Podcast + Flashcard + Quiz) ---------- */
  const generate = async (name, text, pages, sourceCount = 1) => {
    const run = ++cancelRef.current;
    const stale = () => run !== cancelRef.current;
    setBusy({ step: 1, label: 'AI đang biên soạn Cẩm nang, Sơ đồ tư duy, Podcast, Flashcard & Quiz…' });
    const prompt =
      `Dựa trên tài liệu sau, hãy xây dựng một bộ học tập NotebookLM toàn diện. Mức độ: ${LEVELS[level]}.\n` +
      'Trả về DUY NHẤT một JSON hợp lệ theo đúng cấu trúc:\n' +
      '{"summary":"tóm tắt cốt lõi 3-4 câu","keyPoints":["ý chính 1","ý chính 2"],' +
      '"glossary":[{"term":"thuật ngữ hoặc công thức","def":"giải nghĩa ngắn gọn"}],' +
      '"mindmap":{"label":"Chủ đề chính","children":[{"label":"Nhánh lớn 1","children":["Ý con 1","Ý con 2"]},{"label":"Nhánh lớn 2","children":["Ý con 3","Ý con 4"]}]},' +
      '"podcast":[{"speaker":"Thầy Minh","text":"lời thoại mở đầu sinh động"},{"speaker":"Bạn Lan","text":"câu hỏi/phản hồi tự nhiên"}],' +
      '"flashcards":[{"q":"câu hỏi ngắn","a":"đáp án ngắn gọn"}],' +
      '"quiz":[{"q":"câu hỏi trắc nghiệm","opts":["đáp án 1","đáp án 2","đáp án 3","đáp án 4"],"correct":0,"explain":"giải thích ngắn"}]}\n' +
      `Yêu cầu: ${nCards} flashcard, ${nQuiz} câu quiz (4 đáp án, "correct" là chỉ số 0-3, không ghi A/B/C/D trong opts), ` +
      '5-7 ý chính, 4-6 thuật ngữ/công thức, sơ đồ tư duy 3-5 nhánh lớn, 6 lượt thoại podcast 2 giọng tự nhiên. ' +
      'Tiếng Việt, bám sát tài liệu, không bịa thêm, không dùng LaTeX (viết công thức bằng Unicode).\n\nTÀI LIỆU:\n' +
      sampleText(text, PROMPT_CHARS);

    let data = null;
    try {
      data = await callAI(
        prompt,
        'Bạn là chuyên gia sư phạm AI chuẩn NotebookLM. Chỉ trả về JSON hợp lệ, không thêm chữ nào ngoài JSON.',
        null,
        uid,
        CREDIT_TARIFF.ERROR_ANALYSIS,
        'Tạo bộ học tập Pro AI Doc Studio',
        (rawText) => {
          const normalized = normalize(parseJSON(rawText), nCards, nQuiz);
          if (!normalized.flashcards.length || !normalized.quiz.length) {
            throw new Error('AI trả về nội dung chưa đúng định dạng (ELEC Credit đã được hoàn trả) — bấm tạo lại nhé.');
          }
          return normalized;
        }
      );
    } catch (e) {
      if (stale()) return;
      setBusy(null);
      setErr(e?.isQuota ? 'Bạn đã hết lượt AI hôm nay — thử lại vào ngày mai.' : (e?.message || 'Không gọi được AI, kiểm tra mạng rồi thử lại.'));
      return;
    }
    if (stale() || !data) return;
    const doc = {
      id: 'D' + Date.now().toString(36),
      name,
      at: Date.now(),
      pages,
      sourceCount,
      chars: text.length,
      text: text.slice(0, KEEP_CHARS),
      ...data,
      progress: { known: {}, fsrs: {}, best: null, attempts: 0 },
    };
    setDocs((d) => [doc, ...d].slice(0, MAX_DOCS));
    setActiveId(doc.id);
    setTab('summary');
    setBusy(null);
  };

  /* ---------- Xử lý 1 hoặc nhiều file gộp thành 1 Notebook ---------- */
  const prepareFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean).slice(0, 6);
    if (!files.length || !isVip || busy) return;
    setErr('');
    setBusy({ step: 0, label: `Đang phân tích ${files.length > 1 ? `${files.length} tài liệu` : files[0].name}…` });

    const parts = [];
    let totalPages = 0;
    const okNames = [];

    for (let idx = 0; idx < files.length; idx++) {
      const f = files[idx];
      try {
        const res = await extractSingleFile(f, (msg) => setBusy({ step: 0, label: msg }));
        if (res.text && res.text.trim().length >= 30) {
          okNames.push(f.name);
          totalPages += res.pages || 0;
          parts.push(files.length > 1 ? `[Tài liệu: ${f.name}]\n${res.text.trim()}` : res.text.trim());
        }
      } catch { /* bỏ qua file lỗi nếu file khác đọc được */ }
    }

    const merged = parts.join('\n\n').slice(0, MAX_CHARS);
    if (merged.trim().length < 150) {
      setBusy(null);
      setErr('Không đọc đủ nội dung (tối thiểu 150 ký tự). Hỗ trợ PDF, Word (.docx), PowerPoint (.pptx), Excel, Ảnh chụp rõ chữ, TXT/MD.');
      return;
    }

    const notebookName = okNames.length === 1
      ? okNames[0]
      : `${baseName(okNames[0])} + ${okNames.length - 1} file`;
    await generate(notebookName, merged, totalPages, okNames.length);
  };

  const onPick = (e) => { const fs = e.target.files; prepareFiles(fs); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); prepareFiles(e.dataTransfer.files); };

  const fromPaste = async () => {
    if (pasted.trim().length < 150) { setErr('Văn bản quá ngắn — dán ít nhất 150 ký tự trở lên.'); return; }
    setErr('');
    await generate('Ghi chú dán ' + new Date().toLocaleDateString('vi-VN'), pasted.trim().slice(0, MAX_CHARS), 0, 1);
    setPasted(''); setPaste(false);
  };

  const onRateCard = useCallback((k, rating) => {
    if (!active) return;
    patchDoc(active.id, (d) => {
      const prevFsrs = d.progress?.fsrs?.[k] || null;
      const nextFsrs = fsrsSchedule(prevFsrs, rating, Date.now(), 0.9);
      return {
        progress: {
          ...d.progress,
          known: { ...(d.progress?.known || {}), [k]: rating >= 3 },
          fsrs: { ...(d.progress?.fsrs || {}), [k]: nextFsrs },
        },
      };
    });
  }, [active, patchDoc]);

  const onQuizFinish = useCallback((score, total, full) => {
    if (!active) return;
    patchDoc(active.id, (d) => {
      const pct = Math.round((score / total) * 100);
      const best = full ? Math.max(d.progress?.best ?? 0, pct) : d.progress?.best ?? null;
      return { progress: { ...d.progress, best, attempts: (d.progress?.attempts || 0) + 1 } };
    });
  }, [active, patchDoc]);

  const onSavePodcast = useCallback((podcastLines) => {
    if (!active) return;
    patchDoc(active.id, () => ({ podcast: podcastLines }));
  }, [active, patchDoc]);

  const exportKahootXlsx = async (docItem) => {
    try {
      const XLSX = await import('xlsx');
      const rows = exportDocQuizKahootRows(docItem, 30);
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'KahootQuiz');
      XLSX.writeFile(wb, `${baseName(docItem.name)}-kahoot.xlsx`);
      flashToast('Đã tải file Kahoot! (.xlsx)');
    } catch {
      flashToast('Không xuất được file Excel.');
    }
  };

  const openPrintStudyGuide = (docItem) => {
    const html = buildStudyGuideHtml(docItem);
    const w = window.open('', '_blank', 'width=900,height=720');
    if (!w) {
      download(`${baseName(docItem.name)}-cam-nang.html`, html, 'text/html');
      flashToast('Đã tải Cẩm nang A4 (.html)');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print?.(), 350);
  };

  const del = (id) => {
    if (delId !== id) { setDelId(id); setTimeout(() => setDelId((x) => (x === id ? null : x)), 3000); return; }
    setDocs((d) => d.filter((x) => x.id !== id));
    if (activeId === id) setActiveId(null);
    setDelId(null);
  };

  const filtered = docs.filter((d) => !search.trim() || d.name.toLowerCase().includes(search.trim().toLowerCase()));
  const stats = useMemo(() => {
    const cards = docs.reduce((s, d) => s + (d.flashcards?.length || 0), 0);
    const known = docs.reduce((s, d) => s + (d.flashcards || []).filter((_, k) => d.progress?.known?.[k]).length, 0);
    return { cards, known, docs: docs.length };
  }, [docs]);

  /* ========== PAYWALL ========== */
  if (!isVip) {
    return (
      <div className="dst"><style>{CSS}</style>
        <div className="dst-wrap">
          <div className="dst-paywall">
            <div className="dst-crown"><Ico n="crown" s={32} /></div>
            <h1>Doc Studio Pro</h1>
            <p>Phòng nghiên cứu tài liệu AI chuẩn NotebookLM — độc quyền <b>ELEC AI VIP</b></p>
            <ul>
              {[
                ['upload', 'Đọc đa định dạng: PDF, Word (.docx), PowerPoint (.pptx), Excel & Ảnh chụp OCR'],
                ['mind', 'Tự động vẽ Sơ đồ tư duy SVG tương tác + xuất ảnh PNG'],
                ['mic', 'Podcast Nghe bài 2 giọng Việt tự nhiên (Thầy Minh & Bạn Lan)'],
                ['cards', 'Flashcard FSRS v4.5, Quiz giải thích & Điền khuyết Cloze'],
                ['chat', 'Hỏi đáp RAG có trích dẫn chính xác từng đoạn [Đoạn N]'],
              ].map(([i, t]) => (
                <li key={t}><Ico n={i} s={16} />{t}</li>
              ))}
            </ul>
            <button type="button" className="dst-btn wide" onClick={() => { window.location.hash = '#profile'; }}>
              <Ico n="crown" s={16} /> {localTier === 'anon' ? 'Đăng nhập để kiểm tra' : 'Nâng cấp VIP'}
            </button>
            <small>{checking ? 'Đang kiểm tra gói của bạn…' : 'Trang cá nhân → mục nâng cấp gói'}</small>
          </div>
        </div>
      </div>
    );
  }

  /* ========== GIAO DIỆN CHÍNH ========== */
  const knownN = active ? (active.flashcards || []).filter((_, k) => active.progress?.known?.[k]).length : 0;
  const TABS = [
    ['summary', 'list', 'Tổng quan'],
    ['mindmap', 'mind', 'Sơ đồ tư duy'],
    ['podcast', 'mic', 'Podcast'],
    ['flash', 'cards', 'Flashcard'],
    ['quiz', 'quiz', 'Quiz & Cloze'],
    ['ask', 'chat', 'Hỏi đáp RAG'],
  ];

  return (
    <div className="dst"><style>{CSS}</style>
      <div className="dst-wrap">
        <header className="dst-hero">
          <div>
            <div className="dst-hero-tags">
              <span className="dst-tag"><Ico n="crown" s={12} /> ELEC VIP · NOTEBOOKLM ENGINE</span>
              {cloud === 'saved' && <span className="dst-cloud">● Đã đồng bộ Cloud</span>}
            </div>
            <h1>Doc Studio Pro</h1>
            <p>Nạp PDF, Word, PowerPoint, Excel hoặc Ảnh chụp → AI tạo Cẩm nang, Sơ đồ tư duy, Podcast 2 giọng, Flashcard FSRS &amp; Hỏi đáp RAG.</p>
          </div>
          <div className="dst-stats">
            <div><b>{stats.docs}</b><span>notebook</span></div>
            <div><b>{stats.cards}</b><span>thẻ FSRS</span></div>
            <div><b>{stats.cards ? Math.round((stats.known / stats.cards) * 100) : 0}%</b><span>đã thuộc</span></div>
          </div>
        </header>

        {toast && <div className="dst-toast" role="status">{toast}</div>}

        {/* ----- Khu tạo mới ----- */}
        <section className="dst-card">
          <div className="dst-opt-row">
            <label>Flashcard
              <div className="dst-seg">{[5, 10, 15, 20].map((n) => <button key={n} type="button" className={nCards === n ? 'on' : ''} onClick={() => setNCards(n)}>{n}</button>)}</div>
            </label>
            <label>Câu quiz
              <div className="dst-seg">{[5, 8, 12, 15].map((n) => <button key={n} type="button" className={nQuiz === n ? 'on' : ''} onClick={() => setNQuiz(n)}>{n}</button>)}</div>
            </label>
            <label>Mức độ
              <div className="dst-seg">{[['easy', 'Cơ bản'], ['mix', 'Cân bằng'], ['hard', 'Nâng cao']].map(([k, l]) => <button key={k} type="button" className={level === k ? 'on' : ''} onClick={() => setLevel(k)}>{l}</button>)}</div>
            </label>
          </div>

          {busy ? (
            <div className="dst-busy" role="status" style={{ alignItems: 'stretch', gap: 14 }}>
              <ArcChargeLoader
                progress={busy.step === 0 ? 38 : busy.step === 1 ? 74 : 96}
                label={busy.label}
                sublabel="ELEC NotebookLM Engine · Đang phân tích đa định dạng"
              />
              <PdfParseScanner compact />
              <div className="dst-steps" style={{ justifyContent: 'center' }}>
                {['Giải mã tài liệu', 'AI biên soạn Notebook', 'Hoàn tất'].map((s, i) => (
                  <span key={s} className={i < busy.step ? 'done' : i === busy.step ? 'now' : ''}>{i + 1}. {s}</span>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button type="button" className="dst-ghost" onClick={() => { cancelRef.current++; setBusy(null); }}>Hủy</button>
              </div>
            </div>
          ) : (
            <>
              <label
                className={`dst-drop ${drag ? 'drag' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
              >
                <input type="file" accept={ACCEPT_EXTS} multiple hidden onChange={onPick} />
                <span className="dst-dico"><Ico n="upload" s={26} /></span>
                <b>Kéo thả 1 hoặc nhiều tài liệu để gộp thành Notebook</b>
                <small>Đọc tối đa {MAX_PAGES} trang PDF · Tự động nhận diện công thức OMML Word &amp; quét chữ OCR ảnh chụp</small>
                <div className="dst-fmts">
                  {['PDF + OCR', 'Word .docx', 'PowerPoint .pptx', 'Excel .xlsx', 'Ảnh chụp', 'TXT / MD'].map((f) => (
                    <span key={f}>{f}</span>
                  ))}
                </div>
              </label>
              <div className="dst-or"><span>hoặc</span></div>
              <button type="button" className="dst-ghost wide" onClick={() => setPaste((p) => !p)}>
                <Ico n="text" s={15} /> {paste ? 'Ẩn ô dán văn bản' : 'Dán bài giảng / đề cương trực tiếp'}
              </button>
              {paste && (
                <div className="dst-paste">
                  <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Dán nội dung bài giảng, ghi chú, đề cương… (tối thiểu 150 ký tự)" rows={7} />
                  <div className="dst-pasterow">
                    <small>{pasted.length.toLocaleString('vi-VN')} ký tự</small>
                    <button type="button" className="dst-btn" onClick={fromPaste} disabled={pasted.trim().length < 150}>
                      <Ico n="spark" s={16} /> Tạo Notebook Pro
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {err && <p className="dst-err" role="alert">{err}</p>}
        </section>

        {/* ----- Tài liệu đang mở ----- */}
        {active && (
          <section className="dst-card dst-studio">
            <div className="dst-dochead">
              <div className="dst-docname">
                <span><Ico n="file" s={18} /></span>
                <b title={active.name}>{active.name}</b>
                <small>
                  {active.sourceCount > 1 ? `${active.sourceCount} nguồn gộp · ` : ''}
                  {active.pages ? `${active.pages} trang/slide · ` : ''}
                  {active.flashcards.length} thẻ FSRS · {active.quiz.length} câu quiz
                  {active.progress?.best != null ? ` · quiz tốt nhất ${active.progress.best}%` : ''}
                </small>
              </div>
              <button type="button" className="dst-ghost" onClick={() => { stopVi(); setActiveId(null); }} aria-label="Đóng">
                <Ico n="x" s={15} /> Đóng
              </button>
            </div>

            <div className="dst-tabs" role="tablist">
              {TABS.map(([k, i, l]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  className={tab === k ? 'on' : ''}
                  onClick={() => { if (tab === 'podcast' && k !== 'podcast') stopVi(); setTab(k); }}
                >
                  <Ico n={i} s={15} /><span>{l}</span>
                </button>
              ))}
            </div>

            {tab === 'summary' && (
              <div className="dst-sum">
                <div className="dst-sumtop">
                  <Ring value={active.flashcards.length ? knownN / active.flashcards.length : 0} label={`${knownN}/${active.flashcards.length}`} />
                  <div>
                    <h3>Tiến độ làm chủ tài liệu</h3>
                    <small>{knownN === active.flashcards.length ? 'Bạn đã thuộc toàn bộ thẻ!' : `Còn ${active.flashcards.length - knownN} thẻ cần ôn tập theo FSRS v4.5`}</small>
                    <div className="dst-actions left">
                      <button type="button" className="dst-btn" onClick={() => setTab('flash')}><Ico n="cards" s={15} /> Học Flashcard</button>
                      <button type="button" className="dst-ghost" onClick={() => setTab('podcast')}><Ico n="mic" s={15} /> Nghe Podcast</button>
                      <button type="button" className="dst-ghost" onClick={() => setTab('mindmap')}><Ico n="mind" s={15} /> Sơ đồ tư duy</button>
                      <button type="button" className="dst-ghost" onClick={() => setTab('quiz')}><Ico n="quiz" s={15} /> Làm Quiz</button>
                    </div>
                  </div>
                </div>

                {active.summary && <p className="dst-summary">{active.summary}</p>}

                {active.keyPoints?.length > 0 && (
                  <div>
                    <h4>Ý chính cần nhớ</h4>
                    <ol className="dst-points">{active.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ol>
                  </div>
                )}

                {active.glossary?.length > 0 && (
                  <div>
                    <h4>Thuật ngữ &amp; Công thức cốt lõi</h4>
                    <div className="dst-gloss">
                      {active.glossary.map((g, i) => (
                        <div key={i} className="dst-gloss-card">
                          <b>{g.term}</b>
                          <p>{g.def}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="dst-export-bar">
                  <h4>Xuất đa nền tảng (0 Credit)</h4>
                  <div className="dst-actions left">
                    <button type="button" className="dst-ghost" onClick={() => openPrintStudyGuide(active)}>
                      <Ico n="print" s={15} /> In Cẩm nang A4
                    </button>
                    <button type="button" className="dst-ghost" onClick={() => { download(`${baseName(active.name)}-anki.txt`, exportDocFlashcardsAnki(active)); flashToast('Đã xuất bộ thẻ Anki (.txt)'); }}>
                      <Ico n="down" s={15} /> Anki (.txt)
                    </button>
                    <button type="button" className="dst-ghost" onClick={() => { download(`${baseName(active.name)}-moodle.xml`, exportDocQuizMoodleXml(active), 'application/xml'); flashToast('Đã xuất Moodle XML'); }}>
                      <Ico n="down" s={15} /> Moodle XML
                    </button>
                    <button type="button" className="dst-ghost" onClick={() => exportKahootXlsx(active)}>
                      <Ico n="down" s={15} /> Kahoot (.xlsx)
                    </button>
                    <button type="button" className="dst-ghost" onClick={() => { download(`${baseName(active.name)}.md`, exportDocMarkdown(active), 'text/markdown'); flashToast('Đã xuất Markdown (.md)'); }}>
                      <Ico n="down" s={15} /> Markdown (.md)
                    </button>
                    <button type="button" className="dst-ghost" onClick={() => { navigator.clipboard?.writeText(exportDocMarkdown(active)); flashToast('Đã sao chép toàn bộ tóm tắt!'); }}>
                      <Ico n="copy" s={15} /> Sao chép
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'mindmap' && <MindMapView key={active.id} doc={active} />}
            {tab === 'podcast' && <PodcastStudio key={active.id} doc={active} onSavePodcast={onSavePodcast} />}
            {tab === 'flash' && <Flashcards key={active.id} doc={active} onRateCard={onRateCard} />}
            {tab === 'quiz' && <QuizAndCloze key={active.id} doc={active} onFinish={onQuizFinish} />}
            {tab === 'ask' && <AskDoc doc={active} />}
          </section>
        )}

        {/* ----- Thư viện ----- */}
        {docs.length > 0 && (
          <section className="dst-card">
            <div className="dst-libhead">
              <h2>Thư viện Notebook của bạn <small>({docs.length}/{MAX_DOCS})</small></h2>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tài liệu…" />
            </div>
            <div className="dst-lib">
              {filtered.map((d) => {
                const k = (d.flashcards || []).filter((_, i) => d.progress?.known?.[i]).length;
                const pct = d.flashcards?.length ? Math.round((k / d.flashcards.length) * 100) : 0;
                return (
                  <article key={d.id} className={`dst-doc ${d.id === activeId ? 'on' : ''}`}>
                    <button type="button" className="dst-docbtn" onClick={() => { stopVi(); setActiveId(d.id); setTab('summary'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <div className="dst-doc-top">
                        <span className="ico"><Ico n="file" s={17} /></span>
                        <span className="dst-badge">{detectDocBadge(d.name)}</span>
                      </div>
                      <b>{d.name}</b>
                      <small>{d.flashcards?.length || 0} thẻ · {d.quiz?.length || 0} câu · {new Date(d.at).toLocaleDateString('vi-VN')}</small>
                      <div className="dst-prog sm"><i style={{ width: `${pct}%` }} /></div>
                      <small>Đã thuộc {pct}%{d.progress?.best != null ? ` · quiz ${d.progress.best}%` : ''}</small>
                    </button>
                    <button type="button" className={`dst-del ${delId === d.id ? 'arm' : ''}`} onClick={() => del(d.id)} aria-label={`Xóa ${d.name}`}>
                      {delId === d.id ? 'Xóa?' : <Ico n="trash" s={15} />}
                    </button>
                  </article>
                );
              })}
              {!filtered.length && <p className="dst-none">Không có tài liệu nào khớp "{search}".</p>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CSS — Hiện đại, rộng rãi, tương thích hoàn hảo sáng/tối
   ============================================================ */
const CSS = `
.dst{--c-acc:var(--acc,#2f6bff);--c-ink:var(--ink,#0a1230);--c-mut:var(--mut,#5d6a94);--c-soft:var(--soft,rgba(47,107,255,.09));
  --c-line:var(--line,rgba(10,18,48,.13));--c-panel:var(--panel,#fff);--c-bg:var(--bg,#f3f6ff);
  --c-ok:#16a34a;--c-warn:#d97706;--c-bad:#dc2626;min-height:100dvh;color:var(--c-ink);font-family:var(--sans,'DM Sans',system-ui,sans-serif);-webkit-font-smoothing:antialiased}
.dst *{box-sizing:border-box}
.dst button{font-family:inherit;cursor:pointer}
.dst button:disabled{opacity:.45;cursor:not-allowed}
.dst-wrap{max-width:1060px;margin:0 auto;padding:1.25rem 1rem 3.5rem;display:grid;gap:1.1rem}
.dst-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:1.2rem;flex-wrap:wrap;padding:1.5rem 1.7rem;border-radius:26px;
  background:radial-gradient(110% 150% at 0% 0%,color-mix(in srgb,var(--c-acc) 20%,transparent),transparent 62%),var(--glass,var(--c-panel));
  border:1px solid var(--c-line)}
.dst-hero-tags{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap}
.dst-hero h1{margin:.3rem 0 .25rem;font-size:clamp(1.65rem,4.5vw,2.35rem);font-weight:800;letter-spacing:-.03em;background:none;-webkit-text-fill-color:var(--c-ink);color:var(--c-ink)}
.dst-hero p{margin:0;color:var(--c-mut);font-size:.9rem;max-width:640px;line-height:1.5}
.dst-tag{display:inline-flex;align-items:center;gap:.35rem;font-size:.66rem;font-weight:800;letter-spacing:.09em;color:#f59e0b}
.dst-cloud{font-size:.68rem;font-weight:700;color:var(--c-ok)}
.dst-stats{display:flex;gap:.65rem}
.dst-stats div{display:grid;justify-items:center;min-width:82px;padding:.6rem .9rem;border-radius:16px;background:var(--c-soft)}
.dst-stats b{font-size:1.3rem;font-weight:800}
.dst-stats span{font-size:.66rem;color:var(--c-mut)}
.dst-toast{padding:.65rem 1rem;border-radius:14px;background:color-mix(in srgb,var(--c-ok) 14%,var(--c-panel));border:1px solid color-mix(in srgb,var(--c-ok) 35%,transparent);color:var(--c-ok);font-size:.82rem;font-weight:700;text-align:center}
.dst-card{padding:1.3rem 1.45rem;border-radius:24px;background:var(--glass,var(--c-panel));border:1px solid var(--c-line);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.dst-card h2{margin:0;font-size:1.08rem;font-weight:800;background:none;-webkit-text-fill-color:var(--c-ink);color:var(--c-ink)}
.dst-card h3,.dst-card h4{margin:0;background:none;-webkit-text-fill-color:currentColor}
.dst-btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:.62rem 1.25rem;border:0;border-radius:999px;color:#fff;font-weight:700;font-size:.84rem;
  background:linear-gradient(180deg,#4d86ff,#1f4fe6);box-shadow:0 6px 18px color-mix(in srgb,var(--c-acc) 35%,transparent);transition:transform .15s,box-shadow .15s}
.dst-btn.sm,.dst-ghost.sm{padding:.38rem .75rem;font-size:.74rem}
.dst-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 24px color-mix(in srgb,var(--c-acc) 45%,transparent)}
.dst-btn.wide,.dst-ghost.wide{width:100%}
.dst-ghost{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.5rem .95rem;border-radius:999px;border:1px solid var(--c-line);background:transparent;color:var(--c-ink);font-weight:600;font-size:.78rem;transition:background .15s,border-color .15s}
.dst-ghost:hover:not(:disabled){background:var(--c-soft);border-color:var(--c-acc)}
.dst-seg{display:inline-flex;padding:.2rem;gap:.15rem;border-radius:999px;background:var(--c-soft)}
.dst-seg button{border:0;background:none;padding:.34rem .78rem;border-radius:999px;font-size:.76rem;font-weight:600;color:var(--c-mut);transition:all .15s}
.dst-seg button.on{background:var(--c-acc);color:#fff;box-shadow:0 2px 8px color-mix(in srgb,var(--c-acc) 38%,transparent)}
.dst-opt-row{display:flex;flex-wrap:wrap;gap:.9rem 1.5rem;margin-bottom:1rem}
.dst-opt-row label{display:grid;gap:.35rem;font-size:.64rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--c-mut)}
.dst-drop{display:grid;justify-items:center;gap:.35rem;text-align:center;padding:2rem 1.2rem;border-radius:22px;cursor:pointer;
  border:2px dashed color-mix(in srgb,var(--c-acc) 48%,transparent);background:color-mix(in srgb,var(--c-acc) 4%,transparent);transition:background .2s,transform .2s,border-color .2s}
.dst-drop:hover,.dst-drop.drag{background:color-mix(in srgb,var(--c-acc) 11%,transparent);border-color:var(--c-acc);transform:scale(1.005)}
.dst-dico{display:grid;place-items:center;width:54px;height:54px;border-radius:17px;color:#fff;background:linear-gradient(135deg,#3b82f6,#6366f1);box-shadow:0 8px 20px color-mix(in srgb,var(--c-acc) 34%,transparent);margin-bottom:.25rem}
.dst-drop b{font-size:.98rem}.dst-drop small{color:var(--c-mut);font-size:.74rem}
.dst-fmts{display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center;margin-top:.45rem}
.dst-fmts span{padding:.22rem .6rem;border-radius:999px;font-size:.68rem;font-weight:700;background:var(--c-panel);border:1px solid var(--c-line);color:var(--c-mut)}
.dst-or{display:flex;align-items:center;gap:.8rem;margin:.9rem 0;color:var(--c-mut);font-size:.72rem}
.dst-or:before,.dst-or:after{content:'';flex:1;height:1px;background:var(--c-line)}
.dst-paste{margin-top:.8rem;display:grid;gap:.55rem}
.dst-paste textarea,.dst-libhead input,.dst-askbar input{width:100%;padding:.68rem .95rem;border-radius:15px;border:1px solid var(--c-line);background:var(--c-soft);color:var(--c-ink);font:500 .88rem var(--sans,system-ui);outline:none;box-shadow:none}
.dst-paste textarea{resize:vertical}
.dst-paste textarea:focus,.dst-libhead input:focus,.dst-askbar input:focus{border-color:var(--c-acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--c-acc) 20%,transparent)}
.dst-pasterow{display:flex;justify-content:space-between;align-items:center;gap:.6rem}.dst-pasterow small{color:var(--c-mut)}
.dst-err{margin:.9rem 0 0;padding:.65rem .9rem;border-radius:14px;background:color-mix(in srgb,var(--c-bad) 10%,transparent);color:var(--c-bad);font-size:.82rem;font-weight:600}
.dst-busy{display:grid;justify-items:center;gap:.7rem;padding:1.5rem .5rem;text-align:center}
.dst-spin{width:42px;height:42px;border-radius:50%;border:3px solid var(--c-soft);border-top-color:var(--c-acc);animation:dst-r .85s linear infinite}
.dst-steps{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center}
.dst-steps span{padding:.25rem .7rem;border-radius:999px;font-size:.72rem;font-weight:600;background:var(--c-soft);color:var(--c-mut)}
.dst-steps .now{background:var(--c-acc);color:#fff}.dst-steps .done{color:var(--c-ok)}
@keyframes dst-r{to{transform:rotate(360deg)}}
.dst-dochead{display:flex;justify-content:space-between;align-items:flex-start;gap:.6rem;margin-bottom:.95rem}
.dst-docname{display:grid;grid-template-columns:auto 1fr;gap:0 .65rem;align-items:center;min-width:0}
.dst-docname span{grid-row:span 2;display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:var(--c-soft);color:var(--c-acc)}
.dst-docname b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:1rem}
.dst-docname small{color:var(--c-mut);font-size:.74rem}
.dst-tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.22rem;padding:.28rem;border-radius:18px;background:var(--c-soft);margin-bottom:1.15rem}
.dst-tabs button{display:flex;align-items:center;justify-content:center;gap:.38rem;padding:.56rem .35rem;border:0;border-radius:14px;background:none;color:var(--c-mut);font-size:.76rem;font-weight:700;transition:all .18s;white-space:nowrap}
.dst-tabs button.on{background:var(--c-acc);color:#fff;box-shadow:0 3px 10px color-mix(in srgb,var(--c-acc) 38%,transparent)}
.dst-bar{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.85rem}
.dst-bar .dst-seg{margin-right:auto}
.dst-cnt{display:inline-flex;align-items:center;gap:.3rem;color:var(--c-mut);font-size:.75rem;font-weight:700}
.dst-ok{color:var(--c-ok);font-size:.75rem;font-weight:800;margin-right:auto}
.dst-prog{height:7px;border-radius:99px;background:var(--c-soft);overflow:hidden;margin-bottom:.45rem}
.dst-prog.sm{height:5px;margin:.5rem 0 .3rem}
.dst-prog i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#4d86ff,#6cc4ff);transition:width .35s}

/* Summary + Glossary + Export */
.dst-sum{display:grid;gap:1.1rem}
.dst-sumtop{display:flex;align-items:center;gap:1.15rem;flex-wrap:wrap}
.dst-sumtop h3{font-size:1.02rem;margin-bottom:.2rem!important}
.dst-sumtop small{color:var(--c-mut);font-size:.8rem}
.dst-summary{margin:0;padding:1rem 1.15rem;border-radius:16px;background:var(--c-soft);font-size:.92rem;line-height:1.68}
.dst-sum h4{font-size:.84rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--c-mut);margin-bottom:.5rem!important}
.dst-points{margin:0;padding-left:1.35rem;display:grid;gap:.42rem;font-size:.9rem;line-height:1.6}
.dst-gloss{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:.65rem}
.dst-gloss-card{padding:.75rem .9rem;border-radius:15px;border:1px solid var(--c-line);background:var(--c-panel)}
.dst-gloss-card b{display:block;font-size:.86rem;color:var(--c-acc);margin-bottom:.2rem}
.dst-gloss-card p{margin:0;font-size:.8rem;line-height:1.5;color:var(--c-mut)}
.dst-export-bar{padding-top:.8rem;border-top:1px solid var(--c-line)}

/* Mind Map */
.dst-mm{display:grid;gap:.75rem}
.dst-mm-tools{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin-left:auto}
.dst-mm-focus{display:flex;align-items:center;gap:.7rem;padding:.65rem .9rem;border-radius:14px;border:1.5px solid var(--c-acc);background:var(--c-soft)}
.dst-mm-focus div{flex:1;min-width:0}
.dst-mm-focus small{display:block;font-size:.66rem;text-transform:uppercase;font-weight:800;color:var(--c-mut)}
.dst-mm-focus b{font-size:.88rem;line-height:1.4}
.dst-dot{width:10px;height:10px;border-radius:50%;flex:none}
.dst-mm-canvas{overflow:auto;border-radius:18px;border:1px solid var(--c-line);background:#ffffff;padding:.6rem;max-height:540px}
.dst-mm-svg{display:block}

/* Podcast */
.dst-pod{display:grid;gap:.95rem}
.dst-pod-deck{padding:1.1rem 1.2rem;border-radius:18px;background:radial-gradient(100% 140% at 0% 0%,color-mix(in srgb,var(--c-acc) 16%,transparent),transparent 65%),var(--c-soft);border:1px solid var(--c-line);display:grid;gap:.85rem}
.dst-pod-info{display:flex;align-items:center;gap:.9rem}
.dst-pod-art{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#2563eb,#7c3aed);flex:none}
.dst-pod-art.spin{animation:dst-pulse 1.3s ease-in-out infinite}
@keyframes dst-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.dst-pill-mini{display:inline-block;font-size:.62rem;font-weight:800;letter-spacing:.09em;color:var(--c-acc)}
.dst-pod-info h3{font-size:1rem;margin:.1rem 0!important}
.dst-pod-info small{color:var(--c-mut);font-size:.76rem}
.dst-pod-ctrl{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.dst-pod-status{margin:0;font-size:.78rem;font-weight:600;color:var(--c-acc)}
.dst-pod-list{display:grid;gap:.55rem;max-height:430px;overflow:auto;padding-right:.2rem}
.dst-pod-line{display:flex;align-items:flex-start;gap:.75rem;text-align:left;padding:.78rem .95rem;border-radius:16px;border:1px solid var(--c-line);background:var(--c-panel);color:var(--c-ink);transition:border-color .15s,background .15s}
.dst-pod-line:hover{border-color:var(--c-acc)}
.dst-pod-line.now{border-color:var(--c-acc);background:color-mix(in srgb,var(--c-acc) 9%,var(--c-panel))}
.dst-pod-av{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:.72rem;font-weight:800;color:#fff;flex:none;background:#2563eb}
.dst-pod-line.stu .dst-pod-av{background:#7c3aed}
.dst-pod-txt b{display:flex;align-items:center;gap:.5rem;font-size:.8rem;margin-bottom:.2rem}
.dst-pod-txt p{margin:0;font-size:.86rem;line-height:1.55;color:var(--c-mut)}
.dst-pod-line.now .dst-pod-txt p{color:var(--c-ink)}
.dst-live{font-style:normal;font-size:.7rem;color:var(--c-ok)}

/* Flashcards FSRS */
.dst-fc-meta{display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap}
.dst-fsrs-pill{padding:.18rem .6rem;border-radius:999px;background:var(--c-soft);color:var(--c-acc);font-size:.7rem;font-weight:700}
.dst-flip{position:relative;display:block;width:100%;min-height:260px;margin:.8rem 0;padding:0;border:0;background:none;perspective:1200px;text-align:center;color:inherit}
.dst-flip .face{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:.6rem;padding:1.5rem;border-radius:24px;border:1px solid var(--c-line);
  background:var(--c-panel);box-shadow:0 14px 40px -18px color-mix(in srgb,var(--c-acc) 40%,transparent);backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .55s cubic-bezier(.2,.7,.2,1)}
.dst-flip .face b{font-size:clamp(1.05rem,3vw,1.38rem);line-height:1.45;font-weight:700}
.dst-flip .face em{font-style:normal;font-size:.64rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--c-acc)}
.dst-flip .face small{color:var(--c-mut);font-size:.72rem}
.dst-flip .back{transform:rotateY(180deg);background:color-mix(in srgb,var(--c-acc) 8%,var(--c-panel))}
.dst-flip.open .front{transform:rotateY(-180deg)}.dst-flip.open .back{transform:rotateY(0)}
.dst-rate{display:flex;gap:.45rem;align-items:center;justify-content:center;flex-wrap:wrap}
.dst-rate kbd,.dst-opt kbd{display:inline-grid;place-items:center;min-width:1.4rem;height:1.4rem;padding:0 .3rem;border-radius:6px;font:700 .68rem var(--sans,system-ui);background:rgba(127,127,127,.18);color:inherit;border:0}
.dst-rbtn{display:inline-flex;align-items:center;gap:.4rem;padding:.58rem .95rem;border-radius:999px;font-weight:700;font-size:.8rem;background:transparent;transition:background .15s}
.dst-rbtn.r1{border:1.5px solid var(--c-bad);color:var(--c-bad)}.dst-rbtn.r1:hover{background:color-mix(in srgb,var(--c-bad) 12%,transparent)}
.dst-rbtn.r2{border:1.5px solid var(--c-warn);color:var(--c-warn)}.dst-rbtn.r2:hover{background:color-mix(in srgb,var(--c-warn) 12%,transparent)}
.dst-rbtn.r3{border:1.5px solid var(--c-ok);color:var(--c-ok)}.dst-rbtn.r3:hover{background:color-mix(in srgb,var(--c-ok) 12%,transparent)}
.dst-rbtn.r4{border:1.5px solid var(--c-acc);color:var(--c-acc)}.dst-rbtn.r4:hover{background:color-mix(in srgb,var(--c-acc) 12%,transparent)}

/* Quiz & Cloze */
.dst-cloze{display:grid;gap:.9rem}
.dst-cloze-box{padding:1.2rem 1.3rem;border-radius:18px;border:1px solid var(--c-line);background:var(--c-soft);font-size:1rem;line-height:2.1}
.dst-cloze-slot{display:inline-flex;align-items:center;gap:.3rem;margin:0 .2rem}
.dst-cloze-inp{padding:.22rem .55rem;border-radius:9px;border:1.5px solid var(--c-acc);background:var(--c-panel);color:var(--c-ink);font:700 .92rem var(--sans,system-ui);outline:none;text-align:center}
.dst-cloze-inp.ok{border-color:var(--c-ok);background:color-mix(in srgb,var(--c-ok) 12%,var(--c-panel));color:var(--c-ok)}
.dst-cloze-inp.bad{border-color:var(--c-bad);background:color-mix(in srgb,var(--c-bad) 10%,var(--c-panel));color:var(--c-bad)}
.dst-cloze-ans{font-style:normal;font-size:.82rem;font-weight:700;color:var(--c-ok)}
.dst-cloze-score{font-size:.84rem;font-weight:800;margin-left:.4rem}
.dst-cloze-score.ok{color:var(--c-ok)}.dst-cloze-score.bad{color:var(--c-bad)}
.dst-empty{display:grid;justify-items:center;gap:.5rem;padding:2rem 1rem;text-align:center;color:var(--c-mut)}
.dst-empty b{color:var(--c-ink)}
.dst-q{margin:.9rem 0 1rem!important;font-size:1.1rem;line-height:1.5;font-weight:700}
.dst-opts{display:grid;gap:.5rem}
.dst-opt{display:flex;align-items:center;gap:.7rem;text-align:left;padding:.8rem 1rem;border-radius:16px;border:1.5px solid var(--c-line);background:var(--c-panel);color:var(--c-ink);font-size:.9rem;font-weight:600;transition:border-color .15s,transform .15s,background .15s}
.dst-opt span{flex:1}
.dst-opt:hover:not(:disabled){border-color:var(--c-acc);transform:translateX(3px)}
.dst-opt.good{border-color:var(--c-ok);background:color-mix(in srgb,var(--c-ok) 14%,var(--c-panel));color:var(--c-ok)}
.dst-opt.bad{border-color:var(--c-bad);background:color-mix(in srgb,var(--c-bad) 12%,var(--c-panel));color:var(--c-bad);animation:dst-sh .35s}
.dst-opt.dim{opacity:.55}.dst-opt:disabled{cursor:default}
@keyframes dst-sh{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.dst-explain{display:flex;gap:.5rem;align-items:flex-start;margin:.8rem 0 0;padding:.75rem .95rem;border-radius:14px;background:var(--c-soft);font-size:.84rem;line-height:1.55}
.dst-explain svg{flex:none;margin-top:2px;color:var(--c-acc)}
.dst-actions{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:1rem}.dst-actions.left{justify-content:flex-start}
.dst-result{display:grid;justify-items:center;gap:.5rem;text-align:center;padding:.5rem 0}
.dst-result h3{font-size:1.05rem}.dst-result small{display:inline-flex;align-items:center;gap:.3rem;color:var(--c-mut)}
.dst-review{width:100%;text-align:left;margin-top:1rem;display:grid;gap:.6rem}.dst-review h4{font-size:.88rem}
.dst-rv{padding:.85rem 1rem;border-radius:16px;border:1px solid var(--c-line);display:grid;gap:.3rem;font-size:.84rem}
.dst-rv span{display:inline-flex;align-items:center;gap:.35rem;font-weight:700}
.dst-rv .bad{color:var(--c-bad)}.dst-rv .ok{color:var(--c-ok)}.dst-rv p{margin:.2rem 0 0;color:var(--c-mut);line-height:1.5}

/* AskDoc RAG */
.dst-ask{display:grid;gap:.75rem}
.dst-cite-box{padding:.85rem 1rem;border-radius:15px;border:1.5px solid var(--c-acc);background:color-mix(in srgb,var(--c-acc) 7%,var(--c-panel));font-size:.83rem;line-height:1.55}
.dst-cite-head{display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.35rem;color:var(--c-acc)}
.dst-cite-box p{margin:0;white-space:pre-wrap}
.dst-src-drawer{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.45rem;max-height:185px;overflow:auto;padding:.35rem;border-radius:14px;background:var(--c-soft)}
.dst-src-item{text-align:left;padding:.5rem .65rem;border-radius:11px;border:1px solid var(--c-line);background:var(--c-panel);color:var(--c-ink);display:grid;gap:.15rem;font-size:.74rem}
.dst-src-item.on,.dst-src-item:hover{border-color:var(--c-acc)}
.dst-src-item b{color:var(--c-acc)}
.dst-src-item span{color:var(--c-mut);line-height:1.35}
.dst-chat{min-height:260px;max-height:430px;overflow:auto;display:grid;gap:.65rem;align-content:start;padding:.35rem .2rem}
.dst-msg{max-width:86%;padding:.75rem 1rem;border-radius:18px;font-size:.88rem;line-height:1.6;white-space:pre-wrap}
.dst-msg.user{justify-self:end;background:var(--c-acc);color:#fff;border-bottom-right-radius:6px}
.dst-msg.ai{justify-self:start;background:var(--c-soft);border-bottom-left-radius:6px}
.dst-cite-row{display:flex;align-items:center;gap:.35rem;flex-wrap:wrap;margin-top:.55rem;padding-top:.45rem;border-top:1px solid var(--c-line);font-size:.7rem;color:var(--c-mut)}
.dst-cite-pill{padding:.16rem .52rem;border-radius:999px;border:1px solid var(--c-acc);background:var(--c-panel);color:var(--c-acc);font-size:.69rem;font-weight:700}
.dst-cite-pill.on,.dst-cite-pill:hover{background:var(--c-acc);color:#fff}
.dst-chips{display:flex;flex-wrap:wrap;gap:.45rem;justify-content:center;margin-top:.5rem}
.dst-chips button{padding:.42rem .8rem;border-radius:999px;border:1px solid var(--c-line);background:var(--c-panel);color:var(--c-ink);font-size:.76rem;font-weight:600}
.dst-chips button:hover{border-color:var(--c-acc);color:var(--c-acc)}
.dst-askbar{display:flex;gap:.5rem}.dst-askbar input{flex:1}
.dst-dots{display:inline-flex;gap:4px;padding:4px 0}.dst-dots i{width:6px;height:6px;border-radius:50%;background:var(--c-mut);animation:dst-b 1.1s infinite ease-in-out}
.dst-dots i:nth-child(2){animation-delay:.18s}.dst-dots i:nth-child(3){animation-delay:.36s}
@keyframes dst-b{0%,80%,100%{opacity:.25;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}

/* Ring & Library & Paywall */
.dst-ring{position:relative;display:grid;place-items:center;flex:none}
.dst-ring svg{transform:rotate(-90deg)}
.dst-ring circle{fill:none;stroke-width:7}
.dst-ring .bg{stroke:var(--c-soft)}.dst-ring .fg{stroke:var(--c-acc);stroke-linecap:round;transition:stroke-dashoffset .5s}
.dst-ring b{position:absolute;font-size:.92rem;font-weight:800}
.dst-libhead{display:flex;justify-content:space-between;align-items:center;gap:.8rem;flex-wrap:wrap;margin-bottom:.9rem}
.dst-libhead small{color:var(--c-mut);font-weight:600}.dst-libhead input{max-width:240px;padding:.48rem .85rem;font-size:.82rem}
.dst-lib{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:.75rem}
.dst-doc{position:relative;border-radius:18px;border:1px solid var(--c-line);background:var(--c-panel);transition:border-color .18s,transform .18s}
.dst-doc:hover{border-color:var(--c-acc);transform:translateY(-2px)}.dst-doc.on{border-color:var(--c-acc);box-shadow:0 0 0 2px color-mix(in srgb,var(--c-acc) 22%,transparent)}
.dst-docbtn{width:100%;text-align:left;padding:.95rem;border:0;background:none;color:inherit;display:grid;gap:.24rem}
.dst-doc-top{display:flex;align-items:center;gap:.45rem;margin-bottom:.15rem}
.dst-docbtn .ico{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:var(--c-soft);color:var(--c-acc)}
.dst-badge{font-size:.62rem;font-weight:800;letter-spacing:.06em;padding:.18rem .5rem;border-radius:999px;background:var(--c-soft);color:var(--c-acc)}
.dst-docbtn b{font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:1.6rem}
.dst-docbtn small{font-size:.72rem;color:var(--c-mut)}
.dst-del{position:absolute;top:.65rem;right:.65rem;display:grid;place-items:center;min-width:28px;height:28px;padding:0 .45rem;border:0;border-radius:999px;background:transparent;color:var(--c-mut);font-size:.7rem;font-weight:700}
.dst-del:hover{color:var(--c-bad);background:color-mix(in srgb,var(--c-bad) 10%,transparent)}
.dst-del.arm{background:var(--c-bad);color:#fff}
.dst-none{color:var(--c-mut);font-size:.85rem;margin:0}
.dst-paywall{max-width:520px;margin:2rem auto;text-align:center;padding:2.2rem 1.8rem;border-radius:28px;background:var(--glass,var(--c-panel));border:1px solid var(--c-line);display:grid;gap:.85rem;justify-items:center}
.dst-crown{width:66px;height:66px;border-radius:20px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#f59e0b,#ef4444);box-shadow:0 12px 28px rgba(245,158,11,.35)}
.dst-paywall h1{margin:0;font-size:1.8rem;font-weight:800;background:none;-webkit-text-fill-color:var(--c-ink);color:var(--c-ink)}
.dst-paywall p{margin:0;color:var(--c-mut);font-size:.92rem}
.dst-paywall ul{list-style:none;margin:.3rem 0;padding:0;width:100%;display:grid;gap:.55rem;text-align:left}
.dst-paywall li{display:flex;align-items:center;gap:.65rem;padding:.65rem .85rem;border-radius:14px;background:var(--c-soft);font-size:.84rem;font-weight:600}
.dst-paywall li svg{color:var(--c-acc);flex:none}
.dst-paywall small{color:var(--c-mut);font-size:.75rem}

@media (max-width:780px){
  .dst-tabs{grid-template-columns:repeat(3,1fr)}
  .dst-hero{padding:1.2rem}
  .dst-card{padding:1rem}
  .dst-stats div{min-width:68px;padding:.45rem .65rem}
}
@media (max-width:480px){
  .dst-tabs{grid-template-columns:repeat(2,1fr)}
}
`;
