import { useEffect, useMemo, useRef, useState } from 'react';
import { GRADES, SUBJECTS, SUBJ, KINDS, DOCS } from './docsData.js';
import { IcoStar, IcoClose, norm, useStored } from './ToolsKit.jsx';
import { IconArrowUpRight } from './AIIcons.jsx';
import { SubjectIcon, subjectColor } from './SubjectIcons.jsx';

// ============================================================
// LAZY IMAGE — chỉ load khi thẻ vào viewport, load trực tiếp
// ============================================================
function LazyCover({ src, alt, fallbackIcon }) {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span className="tn-ico-wrap" ref={ref}>
      {visible && src && !error && (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          className={'tn-cover' + (loaded ? ' loaded' : '')}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      {(error || !src) && fallbackIcon}
      {!loaded && !error && src && <span className="tn-cover-skeleton" />}
    </span>
  );
}

// ============================================================
// PDF Modal
// ============================================================
const Pdf = ({ doc, onClose }) => {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="tn-pdf" onClose={onClose}>
      <header>
        <b>{doc.title}</b>
        <a className="tn-btn" href={doc.file} download>Tải về</a>
        <a className="tn-btn" href={doc.file} target="_blank" rel="noopener noreferrer">Mở tab mới</a>
        <button type="button" className="tn-ib" onClick={() => ref.current.close()} aria-label="Đóng">
          <IcoClose size={16} />
        </button>
      </header>
      <iframe title={doc.title} src={doc.file + '#view=FitH'} />
    </dialog>
  );
};

// ============================================================
// Book List Modal
// ============================================================
const BookList = ({ doc, onClose }) => {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const books = doc.books || [];
  const cat = subjectColor(doc.subject);

  return (
    <dialog
      ref={ref}
      className="tn-pdf tn-books-modal"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <header style={{ background: cat }}>
        <b style={{ color: '#111' }}>{doc.title}</b>
        <span style={{ font: '600 .75rem var(--mono)', color: '#111', opacity: .7 }}>
          {books.length} sách
        </span>
        <button type="button" className="tn-ib" onClick={() => ref.current.close()} aria-label="Đóng"
          style={{ background: 'rgba(0,0,0,.1)' }}>
          <IcoClose size={16} />
        </button>
      </header>
      <div className="tn-books-list">
        {books.map((b, i) => (
          <a key={i} className="tn-book-item" href={b.url} target="_blank" rel="noopener noreferrer">
            {b.img && (
              <img
                src={b.img}
                alt={b.title}
                className="tn-book-thumb"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="tn-book-info">
              <b>{b.title}</b>
              <small>NXB Giáo dục VN</small>
            </div>
            <span className="tn-book-go"><IconArrowUpRight size={16} /></span>
          </a>
        ))}
        {books.length === 0 && (
          <p style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--mut)' }}>
            Chưa có thông tin sách cho môn này.
          </p>
        )}
      </div>
    </dialog>
  );
};

// ============================================================
// MAIN
// ============================================================
const PAGE_SIZE = 12;

export default function DocsLibrary({ query = '', grade: gProp, onGrade }) {
  const [gLocal, setGLocal] = useState('all');
  const grade = gProp ?? gLocal;
  const setGrade = onGrade || setGLocal;
  const [subject, setSubject] = useState('all');
  const [kind, setKind] = useState('all');
  const [view, setView] = useState('all');
  const [favs, setFavs] = useStored('tools-doc-fav', []);
  const [recent, setRecent] = useStored('tools-doc-recent', []);
  const [pdf, setPdf] = useState(null);
  const [bookList, setBookList] = useState(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const base = useMemo(() => {
    const q = norm(query.trim());
    return DOCS.filter((d) =>
      (grade === 'all' || d.grade === grade) &&
      (kind === 'all' || d.kind === kind) &&
      (view !== 'fav' || favs.includes(d.id)) &&
      (view !== 'recent' || recent.includes(d.id)) &&
      (!q || norm(`${d.title} ${SUBJ[d.subject]} ${d.series || ''}`).includes(q))
    );
  }, [grade, kind, view, query, favs, recent]);

  const list = useMemo(() => {
    const arr = subject === 'all' ? base : base.filter((d) => d.subject === subject);
    return view === 'recent'
      ? [...arr].sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id))
      : arr;
  }, [base, subject, view, recent]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [grade, subject, kind, view, query]);

  const visibleList = list.slice(0, limit);
  const hasMore = limit < list.length;

  const count = (s) => base.filter((d) => d.subject === s).length;
  const mine = DOCS.filter((d) => d.file).length;
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const open = (d) => {
    setRecent((r) => [d.id, ...r.filter((x) => x !== d.id)].slice(0, 12));
    if (d.file) setPdf(d);
    else if (d.books && d.books.length > 0) setBookList(d);
    else if (d.url) window.open(d.url, '_blank', 'noopener,noreferrer');
  };

  const Seg = ({ items, val, set }) => (
    <div className="tn-chips" role="group">
      {items.map(([v, l]) => (
        <button key={v} type="button" className={'tn-chip' + (val === v ? ' on' : '')}
          aria-pressed={val === v} onClick={() => set(v)}>{l}</button>
      ))}
    </div>
  );

  return (
    <div className="tn">
      <div className="tn-stats">
        <span><b>{GRADES.length}</b> khối</span>
        <span><b>{SUBJECTS.length}</b> môn</span>
        <span><b>{DOCS.length}</b> mục</span>
        <span><b>{mine}</b> PDF của bạn</span>
      </div>

      <Seg val={grade} set={setGrade} items={[['all', 'Tất cả lớp'], ...GRADES.map((g) => [g, 'Lớp ' + g])]} />
      <Seg val={kind} set={setKind} items={[['all', 'Mọi loại'], ...Object.entries(KINDS)]} />
      <Seg val={view} set={setView} items={[['all', 'Tất cả'], ['fav', `Đã lưu (${favs.length})`], ['recent', `Mở gần đây (${recent.length})`]]} />

      <div className="tn-head">
        <h2>{grade === 'all' ? 'Tài liệu 10, 11, 12' : 'Tài liệu lớp ' + grade}</h2>
        <em>{list.length} mục</em>
      </div>

      <div className="tn-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={subject === 'all'}
          className={subject === 'all' ? 'on' : ''} onClick={() => setSubject('all')}>Tất cả môn</button>
        {SUBJECTS.map(([s, n]) => (
          <button key={s} type="button" role="tab" aria-selected={subject === s}
            className={subject === s ? 'on' : ''} onClick={() => setSubject(s)}>
            {n}<i>{count(s)}</i>
          </button>
        ))}
      </div>

      <div className="tn-grid">
        {visibleList.map((d) => {
          const fav = favs.includes(d.id);
          const bookCount = d.books?.length || 0;
          const fallback = (
            <span
              className="tn-ico"
              style={{ background: subjectColor(d.subject) }}
            >
              <SubjectIcon subject={d.subject} grade={d.grade} size={26} />
            </span>
          );
          return (
            <article key={d.id} className="tn-card">
              <button type="button" className={'tn-ib tn-star' + (fav ? ' on' : '')}
                aria-pressed={fav}
                aria-label={(fav ? 'Bỏ lưu ' : 'Lưu ') + d.title}
                onClick={() => toggleFav(d.id)}>
                <IcoStar size={15} on={fav} />
              </button>

              <LazyCover src={d.img} alt={d.title} fallbackIcon={fallback} />

              <h3>
                {d.title}
                {d.hot && <span className="tn-badge hot">Hot</span>}
                {bookCount > 1 && <span className="tn-badge new">{bookCount} sách</span>}
                {d.file && <span className="tn-badge new">PDF</span>}
              </h3>

              <div className="tn-meta">
                <span>Lớp {d.grade}</span>
                <span>{SUBJ[d.subject]}</span>
                <span>{KINDS[d.kind]}</span>
              </div>

              <button type="button" className="tn-foot" onClick={() => open(d)}>
                <span><small>Nguồn</small>{d.source}{d.sub ? ' · ' + d.sub : ''}</span>
                <span className="tn-go"><IconArrowUpRight size={14} /></span>
              </button>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="tn-more">
          <button type="button" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Xem thêm {Math.min(PAGE_SIZE, list.length - limit)} mục ({limit}/{list.length})
          </button>
        </div>
      )}

      {list.length === 0 && (
        <p className="tn-empty">
          {view === 'all'
            ? 'Chưa có tài liệu khớp bộ lọc.'
            : 'Chưa có mục nào ở đây. Bấm ngôi sao hoặc mở một tài liệu trước.'}
        </p>
      )}

      {pdf && <Pdf doc={pdf} onClose={() => setPdf(null)} />}
      {bookList && <BookList doc={bookList} onClose={() => setBookList(null)} />}
    </div>
  );
}