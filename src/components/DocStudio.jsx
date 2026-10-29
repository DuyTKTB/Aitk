/* ============================================================
   DocStudio.jsx — v2 (VIP only)
   Tải PDF/TXT/MD hoặc dán văn bản → AI sinh tóm tắt, ý chính,
   flashcard, quiz → học, ôn lại, hỏi đáp ngay trên tài liệu.
   Màu sắc dùng token của theme (--acc, --ink, --panel...) nên
   tự khớp sáng/tối. Không phụ thuộc biến --t-* nữa.
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { askAI } from '../lib/ai.js';
import { useLocalStorage } from '../hooks.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { getTier } from '../lib/tier.js';
import { db } from '../lib/firebase.js';
import { doc as fsDoc, setDoc as fsSetDoc, getDoc as fsGetDoc } from 'firebase/firestore';

/* ---------- Giới hạn ---------- */
const MAX_PAGES = 30;
const MAX_CHARS = 60000;
const PROMPT_CHARS = 14000;
const KEEP_CHARS = 12000;   // phần văn bản lưu lại để hỏi đáp
const MAX_DOCS = 15;

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
};
const Ico = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>
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

/* Lấy mẫu đều toàn bài để không chỉ bám phần đầu tài liệu dài */
function sampleText(text, max) {
  if (text.length <= max) return text;
  const parts = 4;
  const size = Math.floor(max / parts);
  const step = Math.floor((text.length - size) / (parts - 1));
  return Array.from({ length: parts }, (_, i) => text.slice(i * step, i * step + size)).join('\n[...]\n');
}

/* Đọc file → { text, pages } */
async function extractText(file, onProgress) {
  if (/\.(txt|md)$/i.test(file.name)) {
    return { text: (await file.text()).slice(0, MAX_CHARS), pages: 0 };
  }
  if (/\.pdf$/i.test(file.name)) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const total = Math.min(MAX_PAGES, pdf.numPages);
    let text = '';
    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(' ') + '\n';
      onProgress?.(i, total);
      if (text.length > MAX_CHARS) break;
    }
    return { text: text.slice(0, MAX_CHARS), pages: pdf.numPages };
  }
  return { text: null, pages: 0 };
}

/* Gọi AI — chịu được cả chunk dạng "tích lũy" lẫn "delta" */
async function callAI(prompt, system, onText) {
  let raw = '';
  const msg = { role: 'user', parts: [{ text: prompt }], text: prompt };
  const res = await askAI([msg], (c) => {
    if (typeof c !== 'string' || !c) return;
    const head = raw.slice(0, 30);
    raw = c.length >= raw.length && c.startsWith(head) ? c : raw + c;
    onText?.(raw);
  }, null, system);
  const t = (res && typeof res === 'object' ? res.text : typeof res === 'string' ? res : '') || raw;
  return String(t || '');
}

/* Bóc JSON từ câu trả lời (bỏ ```json, rác thừa, dấu phẩy cuối) */
function parseJSON(raw) {
  const s = String(raw || '').replace(/```(?:json)?/gi, '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  const body = s.slice(a, b + 1);
  try { return JSON.parse(body); } catch { /* thử sửa */ }
  try { return JSON.parse(body.replace(/,\s*([}\]])/g, '$1')); } catch { return null; }
}

/* Chuẩn hóa dữ liệu AI trả về + xáo đáp án để không dồn vào A */
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
  return {
    summary: String(data?.summary || '').trim(),
    keyPoints: (data?.keyPoints || []).map((k) => String(k).trim()).filter(Boolean).slice(0, 10),
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
   FLASHCARD
   ============================================================ */
function Flashcards({ doc, onKnown }) {
  const [filter, setFilter] = useState('all');
  const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const known = doc.progress?.known || {};
  const knownCount = doc.flashcards.filter((_, k) => known[k]).length;

  const list = useMemo(() => {
    let arr = doc.flashcards.map((c, k) => ({ ...c, k }));
    if (filter === 'unknown') arr = arr.filter((c) => !known[c.k]);
    return seed ? shuffle(arr) : arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id, filter, seed]);

  const card = list[i];
  const go = useCallback((d) => { setOpen(false); setI((x) => Math.min(list.length - 1, Math.max(0, x + d))); }, [list.length]);
  const mark = useCallback((v) => {
    if (!list[i]) return;
    onKnown(list[i].k, v);
    setOpen(false);
    if (i < list.length - 1) setI(i + 1);
  }, [i, list, onKnown]);

  useEffect(() => {
    const onKey = (e) => {
      if (typingTarget(e)) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === '1') mark(false);
      else if (e.key === '2') mark(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, mark]);

  const reset = (f) => { setFilter(f); setI(0); setOpen(false); };

  return (
    <div>
      <div className="dst-bar">
        <div className="dst-seg">
          <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => reset('all')}>Tất cả ({doc.flashcards.length})</button>
          <button type="button" className={filter === 'unknown' ? 'on' : ''} onClick={() => reset('unknown')}>Chưa thuộc ({doc.flashcards.length - knownCount})</button>
        </div>
        <button type="button" className="dst-ghost" onClick={() => { setSeed((x) => x + 1); setI(0); setOpen(false); }}><Ico n="shuffle" s={15} /> Xáo trộn</button>
        <button type="button" className="dst-ghost" onClick={() => {
          const tsv = doc.flashcards.map((c) => `${c.q.replace(/\t|\n/g, ' ')}\t${c.a.replace(/\t|\n/g, ' ')}`).join('\n');
          download(`${doc.name.replace(/\.[^.]+$/, '')}-anki.txt`, tsv);
        }} title="File TSV nhập thẳng vào Anki"><Ico n="down" s={15} /> Anki</button>
      </div>

      {!card ? (
        <div className="dst-empty"><Ico n="check" s={30} /><b>Bạn đã thuộc hết thẻ!</b><span>Chuyển sang "Tất cả" để ôn lại hoặc làm quiz.</span></div>
      ) : (
        <>
          <div className="dst-prog"><i style={{ width: `${((i + 1) / list.length) * 100}%` }} /></div>
          <small className="dst-cnt">Thẻ {i + 1}/{list.length} · đã thuộc {knownCount}/{doc.flashcards.length}</small>
          <button type="button" className={`dst-flip ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label="Lật thẻ">
            <span className="face front"><em>Câu hỏi</em><b>{card.q}</b><small>Bấm hoặc nhấn Space để lật</small></span>
            <span className="face back"><em>Đáp án</em><b>{card.a}</b></span>
          </button>
          <div className="dst-rate">
            <button type="button" className="dst-ghost" onClick={() => go(-1)} disabled={i === 0} aria-label="Thẻ trước"><Ico n="left" /></button>
            <button type="button" className="dst-no" onClick={() => mark(false)}><Ico n="repeat" s={16} /> Chưa thuộc <kbd>1</kbd></button>
            <button type="button" className="dst-yes" onClick={() => mark(true)}><Ico n="check" s={16} /> Đã thuộc <kbd>2</kbd></button>
            <button type="button" className="dst-ghost" onClick={() => go(1)} disabled={i >= list.length - 1} aria-label="Thẻ sau"><Ico n="right" /></button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   QUIZ
   ============================================================ */
function Quiz({ doc, onFinish }) {
  const total = doc.quiz.length;
  const [order, setOrder] = useState(() => shuffle(doc.quiz.map((_, k) => k)));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);   // { k, pick }
  const [done, setDone] = useState(false);
  const [sec, setSec] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (done) return undefined;
    const t = setInterval(() => setSec(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [done]);

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

  if (done) {
    const pct = score / order.length;
    const wrong = answers.filter((a) => a.pick !== doc.quiz[a.k].correct);
    return (
      <div className="dst-result">
        <Ring value={pct} size={120} label={`${score}/${order.length}`} />
        <h3>{pct === 1 ? 'Tuyệt đối! Bạn nắm chắc tài liệu này.' : pct >= 0.7 ? 'Rất tốt, sắp thành thạo rồi!' : pct >= 0.4 ? 'Khá ổn, ôn lại chỗ sai nhé.' : 'Cần ôn thêm — xem lại flashcard rồi làm lại.'}</h3>
        <small><Ico n="clock" s={13} /> {fmtTime(sec)} · {Math.round(pct * 100)}% chính xác</small>
        <div className="dst-actions">
          {wrong.length > 0 && <button type="button" className="dst-btn" onClick={() => restart(wrong.map((a) => a.k))}><Ico n="repeat" s={16} /> Làm lại {wrong.length} câu sai</button>}
          <button type="button" className="dst-ghost" onClick={() => restart(doc.quiz.map((_, k) => k))}>Làm lại toàn bộ</button>
        </div>
        {wrong.length > 0 && (
          <div className="dst-review">
            <h4>Xem lại câu sai</h4>
            {wrong.map((a) => {
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
    );
  }

  return (
    <div>
      <div className="dst-bar">
        <small className="dst-cnt">Câu {idx + 1}/{order.length}</small>
        <small className="dst-ok">Đúng {score}</small>
        <small className="dst-cnt"><Ico n="clock" s={13} /> {fmtTime(sec)}</small>
      </div>
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
          <div className="dst-actions"><button type="button" className="dst-btn" onClick={next}>{idx + 1 >= order.length ? 'Xem kết quả' : 'Câu tiếp theo'} <Ico n="right" s={16} /></button></div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   HỎI ĐÁP TÀI LIỆU
   ============================================================ */
function AskDoc({ doc }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { setMsgs([]); }, [doc.id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs]);

  const send = async (q) => {
    const question = String(q ?? text).trim();
    if (!question || busy) return;
    setText(''); setBusy(true);
    const history = msgs.slice(-6).map((m) => `${m.role === 'user' ? 'Người học' : 'Trợ lý'}: ${m.text}`).join('\n');
    setMsgs((m) => [...m, { role: 'user', text: question }, { role: 'ai', text: '' }]);
    const prompt =
      `TÀI LIỆU:\n${doc.text || doc.summary}\n\n${history ? `HỘI THOẠI TRƯỚC:\n${history}\n\n` : ''}` +
      `CÂU HỎI: ${question}\n\nTrả lời tiếng Việt, ngắn gọn, chỉ dựa vào tài liệu. Nếu tài liệu không đề cập, nói rõ "Tài liệu không nhắc tới điều này".`;
    try {
      const out = await callAI(prompt, 'Bạn là trợ lý học tập, trả lời chính xác dựa trên tài liệu được cung cấp. Không dùng LaTeX.',
        (t) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, text: t } : x))));
      setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, text: out || 'Mình chưa trả lời được, thử hỏi lại nhé.' } : x)));
    } catch (e) {
      setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, text: e?.isQuota ? 'Bạn đã hết lượt AI hôm nay.' : (e?.message || 'Có lỗi khi gọi AI.') } : x)));
    } finally { setBusy(false); }
  };

  const chips = ['Tóm tắt ý chính trong 5 dòng', 'Những thuật ngữ quan trọng nhất?', 'Ra cho mình 3 câu hỏi tự luận'];
  return (
    <div className="dst-ask">
      <div className="dst-chat">
        {!msgs.length && (
          <div className="dst-empty"><Ico n="chat" s={28} /><b>Hỏi bất kỳ điều gì về tài liệu này</b>
            <div className="dst-chips">{chips.map((c) => <button key={c} type="button" onClick={() => send(c)}>{c}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`dst-msg ${m.role}`}>{m.text || <span className="dst-dots"><i /><i /><i /></span>}</div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="dst-askbar" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Đặt câu hỏi về tài liệu…" disabled={busy} />
        <button type="submit" className="dst-btn" disabled={busy || !text.trim()} aria-label="Gửi"><Ico n="send" s={16} /></button>
      </form>
    </div>
  );
}

/* ============================================================
   TRANG CHÍNH
   ============================================================ */
export default function DocStudio() {
  const { user, tier: ctxTier } = useAuth();
  const uid = user?.uid || user?.id;
  const [localTier, setLocalTier] = useState('loading');
  const [docs, setDocs] = useLocalStorage('cs-doc-study', []);
  /* CLOUD SYNC — Firestore users/{uid}/docStudioDocs/library */
  const [cloud, setCloud] = useState('idle');
  useEffect(() => {
    if (!uid || ctxTier !== 'vip') return undefined;
    (async () => {
      try {
        const snap = await fsGetDoc(fsDoc(db, 'users', uid, 'docStudioDocs', 'library'));
        if (snap.exists() && Array.isArray(snap.data().docs) && snap.data().docs.length) {
          setDocs(snap.data().docs);
        }
      } catch { /* giữ bản local */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);
  useEffect(() => {
    if (!uid || ctxTier !== 'vip' || !docs.length) return undefined;
    setCloud('syncing');
    const t = setTimeout(() => {
      fsSetDoc(fsDoc(db, 'users', uid, 'docStudioDocs', 'library'), { docs, at: Date.now() })
        .then(() => setCloud('saved'))
        .catch(() => setCloud('error'));
    }, 800);
    return () => clearTimeout(t);
  }, [docs, uid, ctxTier]); // eslint-disable-line
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState('summary');
  const [busy, setBusy] = useState(null);       // { step, label }
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);
  const [paste, setPaste] = useState(false);
  const [pasted, setPasted] = useState('');
  const [nCards, setNCards] = useState(10);
  const [nQuiz, setNQuiz] = useState(8);
  const [level, setLevel] = useState('mix');
  const [search, setSearch] = useState('');
  const [delId, setDelId] = useState(null);
  const cancelRef = useRef(0);

  useEffect(() => {
    if (!uid) { setLocalTier('anon'); return; }
    let off = false;
    getTier(uid).then((t) => { if (!off) setLocalTier(t?.key === 'vip' ? 'vip' : 'free'); }).catch(() => { if (!off) setLocalTier('free'); });
    return () => { off = true; };
  }, [uid]);

  const isVip = ctxTier?.key === 'vip' || localTier === 'vip';
  const checking = !isVip && (localTier === 'loading' || (uid && ctxTier == null && localTier === 'loading'));
  const active = docs.find((d) => d.id === activeId) || null;

  const patchDoc = useCallback((id, fn) => {
    setDocs((all) => all.map((d) => (d.id === id ? { ...d, ...fn(d) } : d)));
  }, [setDocs]);

  /* ---------- Sinh nội dung ---------- */
  const generate = async (name, text, pages) => {
    const run = ++cancelRef.current;
    const stale = () => run !== cancelRef.current;
    setBusy({ step: 1, label: 'AI đang soạn tóm tắt, flashcard và quiz (30–60 giây)…' });
    const prompt =
      `Dựa trên tài liệu sau, soạn nội dung ôn tập. Mức độ: ${LEVELS[level]}.\n` +
      'Trả về DUY NHẤT một JSON hợp lệ theo mẫu: ' +
      '{"summary":"tóm tắt 3-4 câu","keyPoints":["ý chính 1","ý chính 2"],' +
      '"flashcards":[{"q":"câu hỏi ngắn","a":"đáp án ngắn gọn"}],' +
      '"quiz":[{"q":"câu hỏi trắc nghiệm","opts":["đáp án 1","đáp án 2","đáp án 3","đáp án 4"],"correct":0,"explain":"giải thích ngắn"}]}\n' +
      `Yêu cầu: ${nCards} flashcard, ${nQuiz} câu quiz (4 đáp án, "correct" là chỉ số 0-3, không ghi A/B/C/D trong opts), 5-7 ý chính, ` +
      'tiếng Việt, bám sát tài liệu, không bịa thêm, không dùng LaTeX (viết công thức bằng Unicode).\n\nTÀI LIỆU:\n' +
      sampleText(text, PROMPT_CHARS);
    let raw = '';
    try {
      raw = await callAI(prompt, 'Bạn là giáo viên soạn nội dung ôn tập. Chỉ trả về JSON hợp lệ, không thêm chữ nào ngoài JSON.');
    } catch (e) {
      if (stale()) return;
      setBusy(null);
      setErr(e?.isQuota ? 'Bạn đã hết lượt AI hôm nay — thử lại vào ngày mai.' : (e?.message || 'Không gọi được AI, kiểm tra mạng rồi thử lại.'));
      return;
    }
    if (stale()) return;
    const data = normalize(parseJSON(raw), nCards, nQuiz);
    if (!data.flashcards.length || !data.quiz.length) {
      setBusy(null);
      setErr('AI trả về nội dung chưa đúng định dạng — bấm tạo lại, hoặc dùng tài liệu ngắn/rõ chữ hơn.');
      return;
    }
    const doc = {
      id: 'D' + Date.now().toString(36), name, at: Date.now(), pages,
      chars: text.length, text: text.slice(0, KEEP_CHARS), ...data,
      progress: { known: {}, best: null, attempts: 0 },
    };
    setDocs((d) => [doc, ...d].slice(0, MAX_DOCS));
    setActiveId(doc.id); setTab('summary'); setBusy(null);
  };

  const prepare = async (file) => {
    if (!file || !isVip || busy) return;
    setErr('');
    setBusy({ step: 0, label: 'Đang đọc tài liệu…' });
    let out = { text: null, pages: 0 };
    try {
      out = await extractText(file, (i, n) => setBusy({ step: 0, label: `Đang đọc trang ${i}/${n}…` }));
    } catch { /* báo lỗi bên dưới */ }
    if (!out.text || out.text.trim().length < 200) {
      setBusy(null);
      setErr('Không đọc được nội dung. Hỗ trợ PDF có chữ (không phải ảnh scan), TXT, MD. Với DOCX/PPTX hãy copy nội dung vào "Dán văn bản".');
      return;
    }
    await generate(file.name, out.text, out.pages);
  };

  const onPick = (e) => { const f = e.target.files?.[0]; e.target.value = ''; prepare(f); };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); prepare(e.dataTransfer.files?.[0]); };

  const fromPaste = async () => {
    if (pasted.trim().length < 200) { setErr('Văn bản quá ngắn — dán ít nhất vài đoạn (200 ký tự trở lên).'); return; }
    setErr('');
    await generate('Văn bản dán ' + new Date().toLocaleDateString('vi-VN'), pasted.trim().slice(0, MAX_CHARS), 0);
    setPasted(''); setPaste(false);
  };

  const onKnown = useCallback((k, v) => {
    if (!active) return;
    patchDoc(active.id, (d) => ({ progress: { ...d.progress, known: { ...(d.progress?.known || {}), [k]: v } } }));
  }, [active, patchDoc]);

  const onQuizFinish = useCallback((score, total, full) => {
    if (!active) return;
    patchDoc(active.id, (d) => {
      const pct = Math.round((score / total) * 100);
      const best = full ? Math.max(d.progress?.best ?? 0, pct) : d.progress?.best ?? null;
      return { progress: { ...d.progress, best, attempts: (d.progress?.attempts || 0) + 1 } };
    });
  }, [active, patchDoc]);

  const del = (id) => {
    if (delId !== id) { setDelId(id); setTimeout(() => setDelId((x) => (x === id ? null : x)), 3000); return; }
    setDocs((d) => d.filter((x) => x.id !== id));
    if (activeId === id) setActiveId(null);
    setDelId(null);
  };

  const filtered = docs.filter((d) => !search.trim() || d.name.toLowerCase().includes(search.trim().toLowerCase()));
  const stats = useMemo(() => {
    const cards = docs.reduce((s, d) => s + d.flashcards.length, 0);
    const known = docs.reduce((s, d) => s + d.flashcards.filter((_, k) => d.progress?.known?.[k]).length, 0);
    return { cards, known, docs: docs.length };
  }, [docs]);

  /* ========== PAYWALL ========== */
  if (!isVip) {
    return (
      <div className="dst"><style>{CSS}</style>
        <div className="dst-wrap">
          <div className="dst-paywall">
            <div className="dst-crown"><Ico n="crown" s={32} /></div>
            <h1>Doc Studio</h1>
            <p>Tính năng độc quyền của <b>ELEC AI VIP</b></p>
            <ul>
              {[['upload', 'Tải PDF, TXT hoặc dán văn bản bất kỳ'], ['cards', 'AI soạn flashcard, lật thẻ + đánh dấu đã thuộc'], ['quiz', 'Quiz có giải thích, làm lại câu sai'], ['chat', 'Hỏi đáp trực tiếp trên tài liệu của bạn']].map(([i, t]) => (
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
  const knownN = active ? active.flashcards.filter((_, k) => active.progress?.known?.[k]).length : 0;
  const TABS = [['summary', 'list', 'Tổng quan'], ['flash', 'cards', 'Flashcard'], ['quiz', 'quiz', 'Quiz'], ['ask', 'chat', 'Hỏi đáp']];

  return (
    <div className="dst"><style>{CSS}</style>
      <div className="dst-wrap">
        <header className="dst-hero">
          <div>
            <span className="dst-tag"><Ico n="crown" s={12} /> TÍNH NĂNG VIP</span>
            <h1>Doc Studio</h1>
            <p>Biến tài liệu thành bộ nhớ kiêm bài luyện tập chỉ trong một phút.</p>
          </div>
          <div className="dst-stats">
            <div><b>{stats.docs}</b><span>tài liệu</span></div>
            <div><b>{stats.cards}</b><span>thẻ</span></div>
            <div><b>{stats.cards ? Math.round((stats.known / stats.cards) * 100) : 0}%</b><span>đã thuộc</span></div>
          </div>
        </header>

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
            <div className="dst-busy" role="status">
              <div className="dst-spin" />
              <div className="dst-steps">
                {['Đọc tài liệu', 'AI soạn nội dung', 'Hoàn tất'].map((s, i) => <span key={s} className={i < busy.step ? 'done' : i === busy.step ? 'now' : ''}>{i + 1}. {s}</span>)}
              </div>
              <b>{busy.label}</b>
              <button type="button" className="dst-ghost" onClick={() => { cancelRef.current++; setBusy(null); }}>Hủy</button>
            </div>
          ) : (
            <>
              <label className={`dst-drop ${drag ? 'drag' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
                <input type="file" accept=".pdf,.txt,.md" hidden onChange={onPick} />
                <span className="dst-dico"><Ico n="upload" s={26} /></span>
                <b>Kéo thả hoặc bấm để chọn tài liệu</b>
                <small>PDF · TXT · MD — đọc tối đa {MAX_PAGES} trang đầu</small>
              </label>
              <div className="dst-or"><span>hoặc</span></div>
              <button type="button" className="dst-ghost wide" onClick={() => setPaste((p) => !p)}><Ico n="text" s={15} /> {paste ? 'Ẩn ô dán văn bản' : 'Dán văn bản trực tiếp'}</button>
              {paste && (
                <div className="dst-paste">
                  <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Dán nội dung bài giảng, ghi chú, đề cương… (tối thiểu 200 ký tự)" rows={7} />
                  <div className="dst-pasterow"><small>{pasted.length.toLocaleString('vi-VN')} ký tự</small>
                    <button type="button" className="dst-btn" onClick={fromPaste} disabled={pasted.trim().length < 200}><Ico n="spark" s={16} /> Tạo bộ ôn tập</button></div>
                </div>
              )}
            </>
          )}
          {err && <p className="dst-err" role="alert">{err}</p>}
        </section>

        {/* ----- Tài liệu đang mở ----- */}
        {active && (
          <section className="dst-card">
            <div className="dst-dochead">
              <div className="dst-docname"><span><Ico n="file" s={18} /></span><b title={active.name}>{active.name}</b>
                <small>{active.pages ? `${active.pages} trang · ` : ''}{active.flashcards.length} thẻ · {active.quiz.length} câu{active.progress?.best != null ? ` · quiz tốt nhất ${active.progress.best}%` : ''}</small>
              </div>
              <button type="button" className="dst-ghost" onClick={() => setActiveId(null)} aria-label="Đóng"><Ico n="x" s={15} /> Đóng</button>
            </div>
            <div className="dst-tabs" role="tablist">
              {TABS.map(([k, i, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Ico n={i} s={16} /><span>{l}</span></button>
              ))}
            </div>

            {tab === 'summary' && (
              <div className="dst-sum">
                <div className="dst-sumtop">
                  <Ring value={active.flashcards.length ? knownN / active.flashcards.length : 0} label={`${knownN}/${active.flashcards.length}`} />
                  <div><h3>Tiến độ ghi nhớ</h3><small>{knownN === active.flashcards.length ? 'Bạn đã thuộc toàn bộ thẻ' : `Còn ${active.flashcards.length - knownN} thẻ chưa thuộc`}</small>
                    <div className="dst-actions left">
                      <button type="button" className="dst-btn" onClick={() => setTab('flash')}><Ico n="cards" s={16} /> Học thẻ</button>
                      <button type="button" className="dst-ghost" onClick={() => setTab('quiz')}><Ico n="quiz" s={16} /> Làm quiz</button>
                    </div></div>
                </div>
                {active.summary && <p className="dst-summary">{active.summary}</p>}
                {active.keyPoints?.length > 0 && (<><h4>Ý chính cần nhớ</h4><ol className="dst-points">{active.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ol></>)}
                <div className="dst-actions left">
                  <button type="button" className="dst-ghost" onClick={() => {
                    const t = `${active.name}\n\nTÓM TẮT\n${active.summary}\n\nÝ CHÍNH\n${(active.keyPoints || []).map((k, i) => `${i + 1}. ${k}`).join('\n')}\n\nFLASHCARD\n${active.flashcards.map((c, i) => `${i + 1}. ${c.q}\n   → ${c.a}`).join('\n')}`;
                    download(`${active.name.replace(/\.[^.]+$/, '')}-on-tap.txt`, t);
                  }}><Ico n="down" s={15} /> Tải bản ôn tập (.txt)</button>
                  <button type="button" className="dst-ghost" onClick={() => navigator.clipboard?.writeText(`${active.summary}\n\n${(active.keyPoints || []).map((k, i) => `${i + 1}. ${k}`).join('\n')}`)}><Ico n="copy" s={15} /> Sao chép tóm tắt</button>
                </div>
              </div>
            )}
            {tab === 'flash' && <Flashcards key={active.id} doc={active} onKnown={onKnown} />}
            {tab === 'quiz' && <Quiz key={active.id} doc={active} onFinish={onQuizFinish} />}
            {tab === 'ask' && <AskDoc doc={active} />}
          </section>
        )}

        {/* ----- Thư viện ----- */}
        {docs.length > 0 && (
          <section className="dst-card">
            <div className="dst-libhead">
              <h2>Thư viện của bạn <small>({docs.length}/{MAX_DOCS})</small></h2>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tài liệu…" />
            </div>
            <div className="dst-lib">
              {filtered.map((d) => {
                const k = d.flashcards.filter((_, i) => d.progress?.known?.[i]).length;
                const pct = d.flashcards.length ? Math.round((k / d.flashcards.length) * 100) : 0;
                return (
                  <article key={d.id} className={`dst-doc ${d.id === activeId ? 'on' : ''}`}>
                    <button type="button" className="dst-docbtn" onClick={() => { setActiveId(d.id); setTab('summary'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <span className="ico"><Ico n="file" s={18} /></span>
                      <b>{d.name}</b>
                      <small>{d.flashcards.length} thẻ · {d.quiz.length} câu · {new Date(d.at).toLocaleDateString('vi-VN')}</small>
                      <div className="dst-prog sm"><i style={{ width: `${pct}%` }} /></div>
                      <small>Đã thuộc {pct}%{d.progress?.best != null ? ` · quiz ${d.progress.best}%` : ''}</small>
                    </button>
                    <button type="button" className={`dst-del ${delId === d.id ? 'arm' : ''}`} onClick={() => del(d.id)} aria-label={`Xóa ${d.name}`}>
                      {delId === d.id ? 'Xác nhận?' : <Ico n="trash" s={15} />}
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
   CSS — dùng token của theme (có giá trị dự phòng)
   ============================================================ */
const CSS = `
.dst{--c-acc:var(--acc,#2f6bff);--c-ink:var(--ink,#0a1230);--c-mut:var(--mut,#5d6a94);--c-soft:var(--soft,rgba(47,107,255,.1));
  --c-line:var(--line,rgba(10,18,48,.14));--c-panel:var(--panel,#fff);--c-bg:var(--bg,#f3f6ff);
  --c-ok:#16a34a;--c-bad:#dc2626;min-height:100dvh;color:var(--c-ink);font-family:var(--sans,'DM Sans',system-ui,sans-serif);-webkit-font-smoothing:antialiased}
.dst *{box-sizing:border-box}
.dst button{font-family:inherit;cursor:pointer}
.dst button:disabled{opacity:.45;cursor:not-allowed}
.dst-wrap{max-width:900px;margin:0 auto;padding:1.2rem 1rem 3rem;display:grid;gap:1rem}
.dst-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;flex-wrap:wrap;padding:1.4rem 1.5rem;border-radius:26px;
  background:radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--c-acc) 22%,transparent),transparent 60%),var(--glass,var(--c-panel));
  border:1px solid var(--c-line)}
.dst-hero h1{margin:.3rem 0 .2rem;font-size:clamp(1.6rem,5vw,2.3rem);font-weight:800;letter-spacing:-.03em;background:none;-webkit-text-fill-color:var(--c-ink);color:var(--c-ink)}
.dst-hero p{margin:0;color:var(--c-mut);font-size:.9rem}
.dst-tag{display:inline-flex;align-items:center;gap:.35rem;font-size:.64rem;font-weight:800;letter-spacing:.1em;color:#f59e0b}
.dst-stats{display:flex;gap:.6rem}
.dst-stats div{display:grid;justify-items:center;min-width:76px;padding:.55rem .8rem;border-radius:16px;background:var(--c-soft)}
.dst-stats b{font-size:1.25rem;font-weight:800}
.dst-stats span{font-size:.64rem;color:var(--c-mut)}
.dst-card{padding:1.2rem 1.3rem;border-radius:24px;background:var(--glass,var(--c-panel));border:1px solid var(--c-line);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.dst-card h2{margin:0;font-size:1.05rem;font-weight:800;background:none;-webkit-text-fill-color:var(--c-ink);color:var(--c-ink)}
.dst-card h3,.dst-card h4{margin:0;background:none;-webkit-text-fill-color:currentColor}
.dst-btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:.65rem 1.3rem;border:0;border-radius:999px;color:#fff;font-weight:700;font-size:.85rem;
  background:linear-gradient(180deg,#4d86ff,#1f4fe6);box-shadow:0 6px 18px color-mix(in srgb,var(--c-acc) 38%,transparent);transition:transform .15s,box-shadow .15s}
.dst-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 24px color-mix(in srgb,var(--c-acc) 48%,transparent)}
.dst-btn.wide,.dst-ghost.wide{width:100%}
.dst-ghost{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.5rem 1rem;border-radius:999px;border:1px solid var(--c-line);background:transparent;color:var(--c-ink);font-weight:600;font-size:.78rem;transition:background .15s,border-color .15s}
.dst-ghost:hover:not(:disabled){background:var(--c-soft);border-color:var(--c-acc)}
.dst-seg{display:inline-flex;padding:.2rem;gap:.15rem;border-radius:999px;background:var(--c-soft)}
.dst-seg button{border:0;background:none;padding:.35rem .8rem;border-radius:999px;font-size:.76rem;font-weight:600;color:var(--c-mut);transition:all .15s}
.dst-seg button.on{background:var(--c-acc);color:#fff;box-shadow:0 2px 8px color-mix(in srgb,var(--c-acc) 40%,transparent)}
.dst-opt-row{display:flex;flex-wrap:wrap;gap:.9rem 1.4rem;margin-bottom:1rem}
.dst-opt-row label{display:grid;gap:.35rem;font-size:.64rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--c-mut)}
.dst-drop{display:grid;justify-items:center;gap:.3rem;text-align:center;padding:2rem 1rem;border-radius:22px;cursor:pointer;
  border:2px dashed color-mix(in srgb,var(--c-acc) 50%,transparent);background:color-mix(in srgb,var(--c-acc) 5%,transparent);transition:background .2s,transform .2s,border-color .2s}
.dst-drop:hover,.dst-drop.drag{background:color-mix(in srgb,var(--c-acc) 12%,transparent);border-color:var(--c-acc);transform:scale(1.01)}
.dst-dico{display:grid;place-items:center;width:54px;height:54px;border-radius:17px;color:#fff;background:linear-gradient(135deg,#4d86ff,#7c5cff);box-shadow:0 8px 20px color-mix(in srgb,var(--c-acc) 35%,transparent);margin-bottom:.3rem}
.dst-drop b{font-size:.95rem}.dst-drop small{color:var(--c-mut);font-size:.72rem}
.dst-or{display:flex;align-items:center;gap:.8rem;margin:.9rem 0;color:var(--c-mut);font-size:.72rem}
.dst-or:before,.dst-or:after{content:'';flex:1;height:1px;background:var(--c-line)}
.dst-paste{margin-top:.8rem;display:grid;gap:.5rem}
.dst-paste textarea,.dst-libhead input,.dst-askbar input{width:100%;padding:.7rem .9rem;border-radius:16px;border:1px solid var(--c-line);background:var(--c-soft);color:var(--c-ink);font:500 .88rem var(--sans,system-ui);outline:none;box-shadow:none}
.dst-paste textarea{resize:vertical}
.dst-paste textarea:focus,.dst-libhead input:focus,.dst-askbar input:focus{border-color:var(--c-acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--c-acc) 22%,transparent)}
.dst-pasterow{display:flex;justify-content:space-between;align-items:center;gap:.6rem}.dst-pasterow small{color:var(--c-mut)}
.dst-err{margin:.9rem 0 0;padding:.65rem .9rem;border-radius:14px;background:color-mix(in srgb,var(--c-bad) 10%,transparent);color:var(--c-bad);font-size:.8rem;font-weight:600}
.dst-busy{display:grid;justify-items:center;gap:.7rem;padding:1.4rem .5rem;text-align:center}
.dst-spin{width:42px;height:42px;border-radius:50%;border:3px solid var(--c-soft);border-top-color:var(--c-acc);animation:dst-r .85s linear infinite}
.dst-steps{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center}
.dst-steps span{padding:.25rem .7rem;border-radius:999px;font-size:.72rem;font-weight:600;background:var(--c-soft);color:var(--c-mut)}
.dst-steps .now{background:var(--c-acc);color:#fff}.dst-steps .done{color:var(--c-ok)}
@keyframes dst-r{to{transform:rotate(360deg)}}
.dst-dochead{display:flex;justify-content:space-between;align-items:flex-start;gap:.6rem;margin-bottom:.9rem}
.dst-docname{display:grid;grid-template-columns:auto 1fr;gap:0 .6rem;align-items:center;min-width:0}
.dst-docname span{grid-row:span 2;display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--c-soft);color:var(--c-acc)}
.dst-docname b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.95rem}
.dst-docname small{color:var(--c-mut);font-size:.72rem}
.dst-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:.2rem;padding:.25rem;border-radius:999px;background:var(--c-soft);margin-bottom:1.1rem}
.dst-tabs button{display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.55rem .3rem;border:0;border-radius:999px;background:none;color:var(--c-mut);font-size:.78rem;font-weight:700;transition:all .18s}
.dst-tabs button.on{background:var(--c-acc);color:#fff;box-shadow:0 3px 10px color-mix(in srgb,var(--c-acc) 40%,transparent)}
.dst-bar{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.8rem}
.dst-bar .dst-seg{margin-right:auto}
.dst-cnt{display:inline-flex;align-items:center;gap:.3rem;color:var(--c-mut);font-size:.74rem;font-weight:700}
.dst-ok{color:var(--c-ok);font-size:.74rem;font-weight:800;margin-right:auto}
.dst-prog{height:7px;border-radius:99px;background:var(--c-soft);overflow:hidden;margin-bottom:.4rem}
.dst-prog.sm{height:5px;margin:.5rem 0 .3rem}
.dst-prog i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#4d86ff,#6cc4ff);transition:width .35s}
.dst-flip{position:relative;display:block;width:100%;min-height:260px;margin:.8rem 0;padding:0;border:0;background:none;perspective:1200px;text-align:center;color:inherit}
.dst-flip .face{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:.6rem;padding:1.5rem;border-radius:24px;border:1px solid var(--c-line);
  background:var(--c-panel);box-shadow:0 14px 40px -18px color-mix(in srgb,var(--c-acc) 45%,transparent);backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .55s cubic-bezier(.2,.7,.2,1)}
.dst-flip .face b{font-size:clamp(1.05rem,3.4vw,1.4rem);line-height:1.4;font-weight:700}
.dst-flip .face em{font-style:normal;font-size:.64rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--c-acc)}
.dst-flip .face small{color:var(--c-mut);font-size:.7rem}
.dst-flip .back{transform:rotateY(180deg);background:color-mix(in srgb,var(--c-acc) 8%,var(--c-panel))}
.dst-flip.open .front{transform:rotateY(-180deg)}.dst-flip.open .back{transform:rotateY(0)}
.dst-rate{display:flex;gap:.5rem;align-items:center;justify-content:center;flex-wrap:wrap}
.dst-rate kbd,.dst-opt kbd{display:inline-grid;place-items:center;min-width:1.4rem;height:1.4rem;padding:0 .3rem;border-radius:6px;font:700 .68rem var(--sans,system-ui);background:rgba(127,127,127,.18);color:inherit;border:0}
.dst-no,.dst-yes{display:inline-flex;align-items:center;gap:.4rem;padding:.65rem 1.1rem;border-radius:999px;font-weight:700;font-size:.82rem;background:transparent;transition:background .15s}
.dst-no{border:1.5px solid var(--c-bad);color:var(--c-bad)}.dst-no:hover{background:color-mix(in srgb,var(--c-bad) 12%,transparent)}
.dst-yes{border:1.5px solid var(--c-ok);color:var(--c-ok)}.dst-yes:hover{background:color-mix(in srgb,var(--c-ok) 12%,transparent)}
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
.dst-explain{display:flex;gap:.5rem;align-items:flex-start;margin:.8rem 0 0;padding:.7rem .9rem;border-radius:14px;background:var(--c-soft);font-size:.82rem;line-height:1.55}
.dst-explain svg{flex:none;margin-top:2px;color:var(--c-acc)}
.dst-actions{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:1rem}.dst-actions.left{justify-content:flex-start}
.dst-result{display:grid;justify-items:center;gap:.5rem;text-align:center;padding:.5rem 0}
.dst-result h3{font-size:1.05rem}.dst-result small{display:inline-flex;align-items:center;gap:.3rem;color:var(--c-mut)}
.dst-review{width:100%;text-align:left;margin-top:1rem;display:grid;gap:.6rem}.dst-review h4{font-size:.85rem}
.dst-rv{display:grid;gap:.25rem;padding:.8rem .9rem;border-radius:16px;border:1px solid var(--c-line);font-size:.82rem}
.dst-rv span{display:flex;gap:.35rem;align-items:center}.dst-rv .bad{color:var(--c-bad)}.dst-rv .ok{color:var(--c-ok);font-weight:700}
.dst-rv p{margin:.2rem 0 0;color:var(--c-mut);line-height:1.5}
.dst-ring{position:relative;display:grid;place-items:center;flex:none}
.dst-ring svg{transform:rotate(-90deg)}.dst-ring circle{fill:none;stroke-width:8}
.dst-ring .bg{stroke:var(--c-soft)}.dst-ring .fg{stroke:var(--c-acc);stroke-linecap:round;transition:stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)}
.dst-ring b{position:absolute;font-size:1rem;font-weight:800}
.dst-sum{display:grid;gap:1rem}
.dst-sumtop{display:flex;align-items:center;gap:1.1rem;flex-wrap:wrap}
.dst-sumtop h3{font-size:1rem}.dst-sumtop small{color:var(--c-mut);font-size:.78rem}
.dst-summary{margin:0;padding:.9rem 1rem;border-radius:16px;background:var(--c-soft);font-size:.88rem;line-height:1.65}
.dst-sum h4{font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:var(--c-mut)}
.dst-points{margin:0;padding-left:1.2rem;display:grid;gap:.4rem;font-size:.88rem;line-height:1.55}
.dst-points li::marker{color:var(--c-acc);font-weight:800}
.dst-ask{display:grid;gap:.7rem}
.dst-chat{display:flex;flex-direction:column;gap:.55rem;min-height:260px;max-height:55vh;overflow-y:auto;padding:.3rem}
.dst-msg{max-width:88%;padding:.65rem .9rem;border-radius:18px;font-size:.88rem;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.dst-msg.user{align-self:flex-end;color:#fff;border-bottom-right-radius:6px;background:linear-gradient(180deg,#4d86ff,#1f4fe6)}
.dst-msg.ai{align-self:flex-start;background:var(--c-soft);border-bottom-left-radius:6px}
.dst-chips{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;margin-top:.5rem}
.dst-chips button{padding:.4rem .8rem;border-radius:999px;border:1px solid var(--c-line);background:transparent;color:var(--c-ink);font-size:.74rem;font-weight:600}
.dst-chips button:hover{border-color:var(--c-acc);color:var(--c-acc)}
.dst-askbar{display:flex;gap:.5rem}.dst-askbar .dst-btn{padding:.6rem .9rem}
.dst-dots{display:inline-flex;gap:4px}.dst-dots i{width:6px;height:6px;border-radius:50%;background:var(--c-mut);animation:dst-b 1s infinite}
.dst-dots i:nth-child(2){animation-delay:.15s}.dst-dots i:nth-child(3){animation-delay:.3s}
@keyframes dst-b{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
.dst-libhead{display:flex;justify-content:space-between;align-items:center;gap:.8rem;margin-bottom:.9rem;flex-wrap:wrap}
.dst-libhead small{color:var(--c-mut);font-weight:600}.dst-libhead input{max-width:220px;padding:.45rem .9rem;border-radius:999px}
.dst-lib{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:.7rem}
.dst-doc{position:relative;border-radius:20px;border:1px solid var(--c-line);background:var(--c-panel);transition:border-color .18s,transform .18s,box-shadow .18s}
.dst-doc:hover{transform:translateY(-2px);border-color:var(--c-acc);box-shadow:0 12px 28px -14px color-mix(in srgb,var(--c-acc) 50%,transparent)}
.dst-doc.on{border-color:var(--c-acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--c-acc) 20%,transparent)}
.dst-docbtn{display:grid;gap:.15rem;width:100%;padding:.9rem 2.6rem .8rem .9rem;text-align:left;border:0;background:none;color:inherit}
.dst-docbtn .ico{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:var(--c-soft);color:var(--c-acc);margin-bottom:.3rem}
.dst-docbtn b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.86rem}
.dst-docbtn small{color:var(--c-mut);font-size:.7rem}
.dst-del{position:absolute;top:.6rem;right:.6rem;display:grid;place-items:center;min-width:30px;height:30px;padding:0 .45rem;border:0;border-radius:99px;background:transparent;color:var(--c-mut);font-size:.68rem;font-weight:800;transition:all .15s}
.dst-del:hover{background:color-mix(in srgb,var(--c-bad) 12%,transparent);color:var(--c-bad)}
.dst-del.arm{background:var(--c-bad);color:#fff}
.dst-none{grid-column:1/-1;margin:0;text-align:center;color:var(--c-mut);font-size:.82rem}
.dst-paywall{display:grid;justify-items:center;gap:.7rem;max-width:440px;margin:2rem auto 0;padding:2.2rem 1.6rem;text-align:center;border-radius:28px;background:var(--glass,var(--c-panel));border:1px solid var(--c-line)}
.dst-paywall h1{margin:0;font-size:1.5rem;font-weight:800;background:none;-webkit-text-fill-color:var(--c-ink);color:var(--c-ink)}
.dst-paywall p{margin:0;color:var(--c-mut);font-size:.9rem}.dst-paywall p b{color:#f59e0b}
.dst-paywall ul{list-style:none;margin:.4rem 0 .6rem;padding:0;display:grid;gap:.55rem;text-align:left;width:100%;max-width:340px}
.dst-paywall li{display:flex;align-items:center;gap:.6rem;font-size:.84rem;font-weight:500}.dst-paywall li svg{color:#f59e0b;flex:none}
.dst-paywall small{color:var(--c-mut);font-size:.72rem}
.dst-crown{display:grid;place-items:center;width:66px;height:66px;border-radius:21px;color:#fff;background:linear-gradient(135deg,#f59e0b,#f97316);box-shadow:0 10px 26px rgba(245,158,11,.38)}
@media (max-width:620px){
  .dst-wrap{padding:.8rem .7rem 2rem}.dst-card{padding:1rem}.dst-hero{padding:1.1rem}
  .dst-tabs button span{display:none}.dst-tabs button{padding:.65rem}
  .dst-stats div{min-width:64px;padding:.45rem .55rem}.dst-flip{min-height:230px}
  .dst-rate .dst-no,.dst-rate .dst-yes{flex:1;justify-content:center;padding:.6rem .5rem}
  .dst-rate kbd{display:none}.dst-lib{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.dst *{animation:none!important;transition:none!important}}
`;