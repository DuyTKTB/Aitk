import { useEffect, useMemo, useRef, useState } from 'react';
import { PROMPTS, PROMPT_CATS, GUIDE_STEPS } from './promptData.js';
import {
  Art, IcoCheck, IcoClose, IcoCopy, IcoSpark, IcoStar,
  copyText, norm, useStored, useToast,
} from './ToolsKit.jsx';
import { IconArrowUpRight } from './AIIcons.jsx';

const VAR_RE = /\{\{([^}]+)\}\}/g;
const LONG_VAR = /code|css|văn bản|đoạn|đề bài|nội dung|ghi chú|tin nhắn|bài làm|bối cảnh|thông báo lỗi/i;
const CATS = Object.fromEntries(PROMPT_CATS.map((c) => [c.id, c]));

const varsOf = (text) => [...new Set([...text.matchAll(VAR_RE)].map((m) => m[1].trim()))];
const fill = (text, vals) =>
  text.replace(VAR_RE, (_, n) => (vals[n.trim()] || '').trim() || `[${n.trim()}]`);

// Đếm số từ / ký tự để hiển thị badge độ dài
const statsOf = (text) => {
  const chars = text.length;
  const words = text.trim().split(/\s+/).length;
  return { chars, words };
};

// ============================================================
// TAB HƯỚNG DẪN SỬ DỤNG
// ============================================================
function GuideTab() {
  return (
    <div className="pl-guide">
      <header className="pl-guide-head">
        <h2>Cách dùng thư viện prompt</h2>
        <p>
          Thư viện có <b>{PROMPTS.length}</b> prompt chia theo <b>{PROMPT_CATS.length - 1}</b> nhóm.
          Mỗi prompt là một "công thức" sẵn — bạn chỉ cần điền vài chỗ trống rồi gửi cho AI.
          Dưới đây là 6 bước để dùng hiệu quả.
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
        <h3>Ví dụ minh hoạ</h3>
        <div className="pl-guide-example-grid">
          <div>
            <b>Prompt gốc</b>
            <pre>{`Bạn là gia sư Hóa học kiên nhẫn, đang dạy học sinh {{lớp}}.
Hãy giải thích: {{khái niệm}}.`}</pre>
          </div>
          <div>
            <b>Sau khi điền</b>
            <pre>{`Bạn là gia sư Hóa học kiên nhẫn, đang dạy học sinh Lớp 11.
Hãy giải thích: Ancol – Phenol.`}</pre>
          </div>
        </div>
      </section>

      <section className="pl-guide-faq">
        <h3>Câu hỏi thường gặp</h3>
        <details>
          <summary>Prompt dài có làm AI trả lời chậm không?</summary>
          <p>
            Không đáng kể. Prompt dài giúp AI hiểu rõ yêu cầu hơn, đổi lại tốn thêm vài token đầu vào.
            Với Gemini/Claude/ChatGPT, prompt 2000-3000 ký tự vẫn rất nhanh.
          </p>
        </details>
        <details>
          <summary>Tôi có thể sửa prompt không?</summary>
          <p>
            Có. Sau khi điền biến, bạn có thể sửa trực tiếp trong khung "Prompt hoàn chỉnh".
            Bấm "Đặt lại theo các ô đã điền" nếu muốn quay về bản gốc.
          </p>
        </details>
        <details>
          <summary>Prompt có dấu [tên biến] thì sao?</summary>
          <p>
            Đó là ô bạn chưa điền. AI vẫn hiểu và sẽ hỏi lại hoặc tự đoán. Tốt nhất là điền đầy đủ
            để có kết quả chính xác nhất.
          </p>
        </details>
        <details>
          <summary>Gửi prompt dài qua URL được không?</summary>
          <p>
            Chỉ khi prompt dưới ~7000 ký tự (giới hạn của trình duyệt). Prompt dài hơn thì phải
            sao chép rồi dán thủ công.
          </p>
        </details>
        <details>
          <summary>Prompt lưu ở đâu?</summary>
          <p>
            Trong localStorage của trình duyệt — chỉ trên máy bạn. Xoá cache trình duyệt sẽ mất.
            Nếu muốn giữ lâu, hãy sao chép ra ngoài.
          </p>
        </details>
      </section>

      <section className="pl-guide-tips-final">
        <h3>5 mẹo dùng prompt hiệu quả</h3>
        <ul>
          <li><b>Càng cụ thể càng tốt:</b> "viết 200 từ" tốt hơn "viết ngắn".</li>
          <li><b>Cho ví dụ mẫu:</b> AI sẽ bắt chước giọng văn của ví dụ.</li>
          <li><b>Yêu cầu AI tự kiểm tra:</b> thêm "kiểm tra lại kết quả trước khi trả lời".</li>
          <li><b>Chia nhỏ task:</b> thay vì "viết bài luận 1000 từ", chia thành dàn ý → viết từng phần.</li>
          <li><b>Lặp lại ngữ cảnh:</b> nếu chat dài, nhắc lại yêu cầu ở cuối để AI không quên.</li>
        </ul>
      </section>
    </div>
  );
}

// ============================================================
// CỬA SỔ CHI TIẾT
// ============================================================
function PromptModal({ p, fav, onFav, onClose }) {
  const ref = useRef(null);
  const [toast, toastNode] = useToast();
  const cat = CATS[p.cat];
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
    toast(ok ? 'Đã sao chép prompt' : 'Không sao chép được, hãy bôi đen và sao chép thủ công');
    if (ok) setTimeout(() => setCopied(false), 1600);
  };

  const needFilled = () => {
    if (missing === 0 || edited !== null) return true;
    toast(`Còn ${missing} ô chưa điền`);
    return false;
  };

  const askHere = () => {
    if (!needFilled()) return;
    try {
      localStorage.setItem('cs-ai-pending', JSON.stringify({ text, grade: 'Lớp 11', t: Date.now() }));
    } catch { /* localStorage bị chặn */ }
    location.hash = 'ai';
  };

  const openExternal = (base) => {
    if (!needFilled()) return;
    const url = base + encodeURIComponent(text);
    if (url.length > 7000) { toast('Prompt quá dài để gửi qua đường dẫn, hãy sao chép rồi dán'); return; }
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
        <button type="button" className="pl-x" onClick={() => ref.current.close()} aria-label="Đóng">
          <IcoClose size={18} />
        </button>

        <aside className="pl-side">
          <Art seed={p.id} hue={cat.hue} kind={cat.kind} src={p.img} ratio="16 / 10">
            <span className="pl-chip">{cat.name}</span>
          </Art>
          <div className="pl-tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
          {p.sample && (
            <figure className="pl-sample">
              <figcaption>Ví dụ kết quả</figcaption>
              <blockquote>{p.sample}</blockquote>
            </figure>
          )}
          <div className="pl-stats">
            <span>📝 {words} từ</span>
            <span>🔤 {chars} ký tự</span>
            <span>🕳️ {vars.length} ô cần điền</span>
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
                    <textarea rows={3} value={vals[v] || ''} onChange={(e) => setVar(v, e.target.value)} placeholder={`Nhập ${v}…`} />
                  ) : (
                    <input value={vals[v] || ''} onChange={(e) => setVar(v, e.target.value)} placeholder={`Nhập ${v}…`} />
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="pl-preview-head">
            <b>Prompt hoàn chỉnh</b>
            <span className={'pl-miss' + (missing ? ' warn' : '')}>
              {vars.length === 0 ? 'Không cần điền gì' : missing ? `Còn ${missing} ô chưa điền` : 'Đã điền đủ'}
            </span>
          </div>
          <textarea
            className="pl-preview"
            rows={12}
            value={text}
            onChange={(e) => setEdited(e.target.value)}
            aria-label="Prompt hoàn chỉnh, có thể chỉnh trực tiếp"
          />
          {edited !== null && (
            <button type="button" className="pl-link" onClick={() => setEdited(null)}>Đặt lại theo các ô đã điền</button>
          )}

          <div className="pl-actions">
            <button type="button" className="pl-btn primary" onClick={copy}>
              {copied ? <IcoCheck size={16} /> : <IcoCopy size={16} />}
              {copied ? 'Đã sao chép' : 'Sao chép'}
            </button>

            {cat.chat && (
              <>
                <button type="button" className="pl-btn" onClick={askHere}><IcoSpark size={16} />Hỏi AI của web</button>
                <button type="button" className="pl-btn" onClick={() => openExternal('https://chatgpt.com/?q=')}>ChatGPT <IconArrowUpRight size={13} /></button>
                <button type="button" className="pl-btn" onClick={() => openExternal('https://claude.ai/new?q=')}>Claude <IconArrowUpRight size={13} /></button>
              </>
            )}
            {cat.open && cat.open.map(([name, url]) => (
              <a key={name} className="pl-btn" href={url} target="_blank" rel="noopener noreferrer">
                Mở {name} <IconArrowUpRight size={13} />
              </a>
            ))}

            <button type="button" className={'pl-btn ghost' + (fav ? ' on' : '')} onClick={onFav} aria-pressed={fav}>
              <IcoStar size={16} on={fav} />{fav ? 'Đã lưu' : 'Lưu'}
            </button>
          </div>
          {cat.open && <p className="pl-note">Dán prompt vào công cụ vừa mở. Mỗi nền tảng có giới hạn miễn phí riêng.</p>}
        </div>
      </div>
      {toastNode}
    </dialog>
  );
}

// ============================================================
// DANH SÁCH
// ============================================================
export default function PromptLibrary({ query }) {
  const [cat, setCat] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [favs, setFavs] = useStored('tools-prompt-fav', []);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, toastNode] = useToast();

  const toggleFav = (id) =>
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const list = useMemo(() => {
    const q = norm(query.trim());
    return PROMPTS.filter((p) => {
      if (cat === 'fav') return favs.includes(p.id) && (!q || norm(`${p.title} ${p.desc} ${p.tags.join(' ')} ${p.prompt}`).includes(q));
      if (cat === 'all') return !q || norm(`${p.title} ${p.desc} ${p.tags.join(' ')} ${p.prompt}`).includes(q);
      return p.cat === cat && (!q || norm(`${p.title} ${p.desc} ${p.tags.join(' ')} ${p.prompt}`).includes(q));
    });
  }, [query, cat, favs]);

  const counts = useMemo(() => {
    const m = {};
    PROMPTS.forEach((p) => { m[p.cat] = (m[p.cat] || 0) + 1; });
    return m;
  }, []);

  const quickCopy = async (p) => {
    const ok = await copyText(p.prompt);
    toast(ok ? 'Đã sao chép bản gốc (còn các ô {{…}} để điền)' : 'Không sao chép được');
    if (ok) { setCopiedId(p.id); setTimeout(() => setCopiedId(null), 1400); }
  };

  const open = PROMPTS.find((p) => p.id === openId);
  const isGuide = cat === 'huong-dan';

  return (
    <>
      <div className="tools-cats" role="group" aria-label="Nhóm prompt">
        <button className={'tools-cat' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>
          Tất cả ({PROMPTS.length})
        </button>
        <button className={'tools-cat' + (cat === 'fav' ? ' on' : '')} onClick={() => setCat('fav')}>
          <IcoStar size={13} on={cat === 'fav'} />Đã lưu ({favs.length})
        </button>
        <button className={'tools-cat' + (isGuide ? ' on' : '')} onClick={() => setCat('huong-dan')}>
          📖 Hướng dẫn dùng
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
            Hiển thị <b>{list.length}</b> prompt · bấm vào thẻ để điền biến và dùng ngay
          </p>

          <div className="tk-grid pl-grid">
            {list.map((p) => {
              const c = CATS[p.cat];
              const isFav = favs.includes(p.id);
              const { chars } = statsOf(p.prompt);
              return (
                <article key={p.id} className="tk-card pl-card">
                  <button type="button" className="pl-open" onClick={() => setOpenId(p.id)} aria-label={`Mở prompt ${p.title}`}>
                    <Art seed={p.id} hue={c.hue} kind={c.kind} src={p.img}>
                      <span className="pl-chip">{c.name}</span>
                      {chars > 800 && <span className="pl-long">CHI TIẾT</span>}
                    </Art>
                    <span className="tk-body">
                      <h3>{p.title}</h3>
                      <span className="tk-desc">{p.desc}</span>
                    </span>
                  </button>
                  <div className="tk-foot">
                    <span className="pl-tagline">{p.tags.join(' · ')}</span>
                    <span className="pl-mini">
                      <button type="button" className={'tk-ib' + (isFav ? ' on' : '')} onClick={() => toggleFav(p.id)} aria-pressed={isFav} aria-label={isFav ? 'Bỏ lưu' : 'Lưu prompt'}>
                        <IcoStar size={16} on={isFav} />
                      </button>
                      <button type="button" className="tk-ib" onClick={() => quickCopy(p)} aria-label="Sao chép nhanh">
                        {copiedId === p.id ? <IcoCheck size={16} /> : <IcoCopy size={16} />}
                      </button>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {list.length === 0 && (
            <div className="tools-empty">
              <p>{cat === 'fav' && !query.trim() ? 'Bạn chưa lưu prompt nào. Bấm ngôi sao trên thẻ để lưu.' : 'Không có prompt nào khớp với bộ lọc.'}</p>
              {cat !== 'all' && <button onClick={() => setCat('all')}>Xem tất cả prompt</button>}
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