import { useEffect, useMemo, useRef, useState } from 'react';
import { PROMPTS, PROMPT_CATS, GUIDE_STEPS } from '../prompts/index.js';
import {
  Art, IcoCheck, IcoClose, IcoCopy, IcoSpark, IcoStar,
  copyText, norm, useStored, useToast,
} from './ToolsKit.jsx';
import { IconArrowUpRight } from './AIIcons.jsx';

const VAR_RE = /\{\{([^}]+)\}\}/g;
const LONG_VAR = /code|css|van ban|doan|de bai|noi dung|ghi chu|tin nhan|bai lam|boi canh|thong bao loi/i;
const CATS = Object.fromEntries(PROMPT_CATS.map((c) => [c.id, c]));
const PAGE_SIZE = 24;

const varsOf = (text) => [...new Set([...text.matchAll(VAR_RE)].map((m) => m[1].trim()))];
const fill = (text, vals) =>
  text.replace(VAR_RE, (_, n) => (vals[n.trim()] || '').trim() || `[${n.trim()}]`);

const statsOf = (text) => {
  const chars = text.length;
  const words = text.trim().split(/\s+/).length;
  return { chars, words };
};

/* ============================================================
   CARD IMAGE — Luôn dùng ảnh thật /img/prom.png
   Cache-busting bằng ?v= để tránh CDN cache ảnh cũ.
   Khi bạn đổi ảnh mới, tăng số version (v=2 → v=3 → v=4...).
   ============================================================ */
const PROM_IMG_VERSION = 2;

function CardCover({ prompt, cat }) {
  return (
    <div className="pl-cover">
      <img
        src={`/img/prom.png?v=${PROM_IMG_VERSION}`}
        alt={prompt.title}
        className="pl-cover-img"
        loading="lazy"
        decoding="async"
      />
      <span className="pl-chip">{cat.name}</span>
      {statsOf(prompt.prompt).chars > 800 && <span className="pl-long">CHI TIẾT</span>}
    </div>
  );
}

/* ============================================================
   TAB HUONG DAN SU DUNG
   ============================================================ */
function GuideTab() {
  return (
    <div className="pl-guide">
      <header className="pl-guide-head">
        <h2>Cach dung thu vien prompt</h2>
        <p>
          Thu vien co <b>{PROMPTS.length}</b> prompt chia theo <b>{PROMPT_CATS.length - 1}</b> nhom.
          Moi prompt la mot "cong thuc" san - ban chi can dien vai cho trong roi gui cho AI.
          Duoi day la 6 buoc de dung hieu qua.
        </p>
      </header>

      <ol className="pl-guide-steps">
        {GUIDE_STEPS.map((s) => (
          <li key={s.num} className="pl-guide-step">
            <div className="pl-guide-num">{s.num}</div>
            <div className="pl-guide-body">
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {s.tips?.length > 0 && (
                <ul className="pl-guide-tips">
                  {s.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>

      <section className="pl-guide-example">
        <h3>Vi du minh hoa</h3>
        <div className="pl-guide-example-grid">
          <div>
            <b>Prompt goc</b>
            <pre>{`Ban la gia su Hoa hoc kien nhan, dang day hoc sinh {{lop}}.
Hay giai thich: {{khai niem}}.`}</pre>
          </div>
          <div>
            <b>Sau khi dien</b>
            <pre>{`Ban la gia su Hoa hoc kien nhan, dang day hoc sinh Lop 11.
Hay giai thich: Ancol - Phenol.`}</pre>
          </div>
        </div>
      </section>

      <section className="pl-guide-faq">
        <h3>Cau hoi thuong gap</h3>
        <details>
          <summary>Prompt dai co lam AI tra loi cham khong?</summary>
          <p>
            Khong dang ke. Prompt dai giup AI hieu ro yeu cau hon, doi lai ton them vai token dau vao.
            Voi Gemini/Claude/ChatGPT, prompt 2000-3000 ky tu van rat nhanh.
          </p>
        </details>
        <details>
          <summary>Toi co the sua prompt khong?</summary>
          <p>
            Co. Sau khi dien bien, ban co the sua truc tiep trong khung "Prompt hoan chinh".
            Bam "Dat lai theo cac o da dien" neu muon quay ve ban goc.
          </p>
        </details>
        <details>
          <summary>Prompt co dau [ten bien] thi sao?</summary>
          <p>
            Do la o ban chua dien. AI van hieu va se hoi lai hoac tu doan. Tot nhat la dien day du
            de co ket qua chinh xac nhat.
          </p>
        </details>
        <details>
          <summary>Gui prompt dai qua URL duoc khong?</summary>
          <p>
            Chi khi prompt duoi ~7000 ky tu (gioi han cua trinh duyet). Prompt dai hon thi phai
            sao chep roi dan thu cong.
          </p>
        </details>
        <details>
          <summary>Prompt luu o dau?</summary>
          <p>
            Trong localStorage cua trinh duyet - chi tren may ban. Xoa cache trinh duyet se mat.
            Neu muon giu lau, hay sao chep ra ngoai.
          </p>
        </details>
      </section>

      <section className="pl-guide-tips-final">
        <h3>5 meo dung prompt hieu qua</h3>
        <ul>
          <li><b>Cang cu the cang tot:</b> "viet 200 tu" tot hon "viet ngan".</li>
          <li><b>Cho vi du mau:</b> AI se bat chuoc giong van cua vi du.</li>
          <li><b>Yeu cau AI tu kiem tra:</b> them "kiem tra lai ket qua truoc khi tra loi".</li>
          <li><b>Chia nho task:</b> thay vi "viet bai luan 1000 tu", chia thanh dan y roi viet tung phan.</li>
          <li><b>Lap lai ngu canh:</b> neu chat dai, nhac lai yeu cau o cuoi de AI khong quen.</li>
        </ul>
      </section>
    </div>
  );
}

/* ============================================================
   CUA SO CHI TIET
   ============================================================ */
function PromptModal({ p, fav, onFav, onClose }) {
  const ref = useRef(null);
  const [toast, toastNode] = useToast();
  const cat = CATS[p.cat] || { name: p.cat, hue: 200, kind: 'blobs' };
  const vars = useMemo(() => varsOf(p.prompt), [p]);
  const [vals, setVals] = useState({});
  const [edited, setEdited] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const filled = useMemo(() => fill(p.prompt, vals), [p, vals]);
  const text = edited ?? filled;
  const missing = vars.filter((v) => !(vals[v] || '').trim()).length;
  const { chars, words } = statsOf(text);

  const setVar = (name, value) => {
    setVals((o) => ({ ...o, [name]: value }));
    setEdited(null);
  };

  const copy = async () => {
    const ok = await copyText(text);
    setCopied(ok);
    toast(ok ? 'Da sao chep prompt' : 'Khong sao chep duoc, hay boi den va sao chep thu cong');
    if (ok) setTimeout(() => setCopied(false), 1600);
  };

  const needFilled = () => {
    if (missing === 0 || edited !== null) return true;
    toast(`Con ${missing} o chua dien`);
    return false;
  };

  const askHere = () => {
    if (!needFilled()) return;
    try {
      localStorage.setItem('cs-ai-pending', JSON.stringify({ text, grade: 'Lop 11', t: Date.now() }));
    } catch (e) { /* localStorage bi chan */ }
    location.hash = 'ai';
  };

  const openExternal = (base) => {
    if (!needFilled()) return;
    const url = base + encodeURIComponent(text);
    if (url.length > 7000) { toast('Prompt qua dai de gui qua duong dan, hay sao chep roi dan'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <dialog
      ref={ref}
      className="pl-dialog"
      aria-label={p.title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="pl-modal">
        <button type="button" className="pl-x" onClick={() => ref.current.close()} aria-label="Dong">
          <IcoClose size={18} />
        </button>

        <aside className="pl-side">
          <Art seed={p.id} hue={cat.hue} kind={cat.kind} src={p.img} ratio="16 / 10">
            <span className="pl-chip">{cat.name}</span>
          </Art>
          <div className="pl-tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
          {p.sample && (
            <figure className="pl-sample">
              <figcaption>Vi du ket qua</figcaption>
              <blockquote>{p.sample}</blockquote>
            </figure>
          )}
          <div className="pl-stats">
            <span>Tu: {words}</span>
            <span>Ky tu: {chars}</span>
            <span>O can dien: {vars.length}</span>
          </div>
        </aside>

        <div className="pl-main">
          <h2>{p.title}</h2>
          <p className="pl-lead">{p.desc}</p>

          {vars.length > 0 && (
            <div className="pl-fields">
              {vars.map((v) => (
                <label key={v} className="pl-field">
                  <span>{v}</span>
                  {LONG_VAR.test(v) ? (
                    <textarea rows={3} value={vals[v] || ''} onChange={(e) => setVar(v, e.target.value)} placeholder={`Nhap ${v}...`} />
                  ) : (
                    <input value={vals[v] || ''} onChange={(e) => setVar(v, e.target.value)} placeholder={`Nhap ${v}...`} />
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="pl-preview-head">
            <b>Prompt hoan chinh</b>
            <span className={'pl-miss' + (missing ? ' warn' : '')}>
              {vars.length === 0 ? 'Khong can dien gi' : missing ? `Con ${missing} o chua dien` : 'Da dien du'}
            </span>
          </div>
          <textarea
            className="pl-preview"
            rows={12}
            value={text}
            onChange={(e) => setEdited(e.target.value)}
            aria-label="Prompt hoan chinh, co the chinh truc tiep"
          />
          {edited !== null && (
            <button type="button" className="pl-link" onClick={() => setEdited(null)}>Dat lai theo cac o da dien</button>
          )}

          <div className="pl-actions">
            <button type="button" className="pl-btn primary" onClick={copy}>
              {copied ? <IcoCheck size={16} /> : <IcoCopy size={16} />}
              {copied ? 'Da sao chep' : 'Sao chep'}
            </button>

            {cat.chat && (
              <>
                <button type="button" className="pl-btn" onClick={askHere}><IcoSpark size={16} />Hoi AI cua web</button>
                <button type="button" className="pl-btn" onClick={() => openExternal('https://chatgpt.com/?q=')}>ChatGPT <IconArrowUpRight size={13} /></button>
                <button type="button" className="pl-btn" onClick={() => openExternal('https://claude.ai/new?q=')}>Claude <IconArrowUpRight size={13} /></button>
              </>
            )}
            {cat.open && cat.open.map(([name, url]) => (
              <a key={name} className="pl-btn" href={url} target="_blank" rel="noopener noreferrer">
                Mo {name} <IconArrowUpRight size={13} />
              </a>
            ))}

            <button type="button" className={'pl-btn ghost' + (fav ? ' on' : '')} onClick={onFav} aria-pressed={fav}>
              <IcoStar size={16} on={fav} />{fav ? 'Da luu' : 'Luu'}
            </button>
          </div>
          {cat.open && <p className="pl-note">Dan prompt vao cong cu vua mo. Moi nen tang co gioi han mien phi rieng.</p>}
        </div>
      </div>
      {toastNode}
    </dialog>
  );
}

/* ============================================================
   DANH SACH - co pagination
   ============================================================ */
export default function PromptLibrary({ query }) {
  const [cat, setCat] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [favs, setFavs] = useStored('tools-prompt-fav', []);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, toastNode] = useToast();
  const [page, setPage] = useState(1);

  const toggleFav = (id) =>
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  useEffect(() => { setPage(1); }, [query, cat]);

  const list = useMemo(() => {
    const q = norm(query.trim());
    return PROMPTS.filter((p) => {
      if (cat === 'fav') return favs.includes(p.id) && (!q || norm(`${p.title} ${p.desc} ${p.tags.join(' ')} ${p.prompt}`).includes(q));
      if (cat === 'all') return !q || norm(`${p.title} ${p.desc} ${p.tags.join(' ')} ${p.prompt}`).includes(q);
      return p.cat === cat && (!q || norm(`${p.title} ${p.desc} ${p.tags.join(' ')} ${p.prompt}`).includes(q));
    });
  }, [query, cat, favs]);
  const visible = useMemo(() => list.slice(0, page * PAGE_SIZE), [list, page]);
  const hasMore = visible.length < list.length;

  const counts = useMemo(() => {
    const m = {};
    PROMPTS.forEach((p) => { m[p.cat] = (m[p.cat] || 0) + 1; });
    return m;
  }, []);

  const quickCopy = async (p) => {
    const ok = await copyText(p.prompt);
    toast(ok ? 'Da sao chep ban goc (con cac o {{...}} de dien)' : 'Khong sao chep duoc');
    if (ok) { setCopiedId(p.id); setTimeout(() => setCopiedId(null), 1400); }
  };

  const open = PROMPTS.find((p) => p.id === openId);
  const isGuide = cat === 'huong-dan';

  return (
    <>
      <div className="tools-cats" role="group" aria-label="Nhom prompt">
        <button className={'tools-cat' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>
          Tat ca ({PROMPTS.length})
        </button>
        <button className={'tools-cat' + (cat === 'fav' ? ' on' : '')} onClick={() => setCat('fav')}>
          <IcoStar size={13} on={cat === 'fav'} />Da luu ({favs.length})
        </button>
        <button className={'tools-cat' + (isGuide ? ' on' : '')} onClick={() => setCat('huong-dan')}>
          Huong dan dung
        </button>
        {PROMPT_CATS.filter((c) => c.id !== 'huong-dan').map((c) => (
          <button key={c.id} className={'tools-cat' + (cat === c.id ? ' on' : '')} onClick={() => setCat(c.id)}>
            {c.name} ({counts[c.id] || 0})
          </button>
        ))}
      </div>

      {isGuide ? (
        <GuideTab />
      ) : (
        <>
          <p className="tools-count">
            Hien thi <b>{visible.length}</b> / <b>{list.length}</b> prompt - bam vao the de dien bien va dung ngay
          </p>

          <div className="tk-grid pl-grid">
            {visible.map((p) => {
              const c = CATS[p.cat] || { name: p.cat, hue: 200, kind: 'blobs' };
              const isFav = favs.includes(p.id);
              return (
                <article key={p.id} className="tk-card pl-card">
                  <button type="button" className="pl-open" onClick={() => setOpenId(p.id)} aria-label={`Mo prompt ${p.title}`}>
                    <CardCover prompt={p} cat={c} />
                    <span className="tk-body">
                      <h3>{p.title}</h3>
                      <span className="tk-desc">{p.desc}</span>
                    </span>
                  </button>
                  <div className="tk-foot">
                    <span className="pl-tagline">{p.tags.join(' - ')}</span>
                    <span className="pl-mini">
                      <button type="button" className={'tk-ib' + (isFav ? ' on' : '')} onClick={() => toggleFav(p.id)} aria-pressed={isFav} aria-label={isFav ? 'Bo luu' : 'Luu prompt'}>
                        <IcoStar size={16} on={isFav} />
                      </button>
                      <button type="button" className="tk-ib" onClick={() => quickCopy(p)} aria-label="Sao chep nhanh">
                        {copiedId === p.id ? <IcoCheck size={16} /> : <IcoCopy size={16} />}
                      </button>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Nut "Xem them" */}
          {hasMore && (
            <div className="tc-more">
              <button
                type="button"
                className="tc-btn"
                onClick={() => setPage((p) => p + 1)}
              >
                Xem them {Math.min(PAGE_SIZE, list.length - visible.length)} prompt
              </button>
            </div>
          )}

          {list.length === 0 && (
            <div className="tools-empty">
              <p>{cat === 'fav' && !query.trim() ? 'Ban chua luu prompt nao. Bam ngoi sao tren the de luu.' : 'Khong co prompt nao khop voi bo loc.'}</p>
              {cat !== 'all' && <button onClick={() => setCat('all')}>Xem tat ca prompt</button>}
            </div>
          )}
        </>
      )}

      {open && (
        <PromptModal key={open.id} p={open} fav={favs.includes(open.id)} onFav={() => toggleFav(open.id)} onClose={() => setOpenId(null)} />
      )}
      {toastNode}
    </>
  );
}