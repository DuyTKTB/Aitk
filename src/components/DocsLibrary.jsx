import { useEffect, useMemo, useRef, useState } from 'react';
// 🎨 Import CSS để giao diện lưới tài liệu hiển thị đúng
import './tools-neo.css';
import { GRADES, SUBJECTS, SUBJ, KINDS, DOCS } from './docsData.js';
import { IcoStar, IcoClose, norm, useStored } from './ToolsKit.jsx';
import { IconArrowUpRight } from './AIIcons.jsx';
import { SubjectIcon, subjectColor } from './SubjectIcons.jsx';

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

/* ============================================================
   MODAL XEM PDF NÂNG CAO (SMART PDF READER)
   ============================================================ */
function PdfViewerModal({ doc, onClose }) {
  const ref = useRef(null);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      ref.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <dialog ref={ref} className={`tn-pdf ${isFullscreen ? 'is-fullscreen' : ''}`} onClose={onClose}>
      <header className="tn-pdf-header">
        <div className="tn-pdf-title-info">
          <span className="tn-pdf-badge">{doc.grade ? `Lớp ${doc.grade}` : 'Tài liệu'}</span>
          <b title={doc.title}>{doc.title}</b>
          {doc.source && <small className="tn-pdf-source">({doc.source})</small>}
        </div>

        <div className="tn-pdf-actions">
          <div className="tn-zoom-ctrl" title="Thu phóng tài liệu">
            <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 15))} title="Thu nhỏ">
              −
            </button>
            <span>{zoom}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(200, z + 15))} title="Phóng to">
              +
            </button>
          </div>

          {doc.file && (
            <a className="tn-btn" href={doc.file} download={`${doc.title}.pdf`} title="Tải file PDF về máy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>Tải về</span>
            </a>
          )}

          {doc.file && (
            <a className="tn-btn" href={doc.file} target="_blank" rel="noopener noreferrer" title="Mở trong tab trình duyệt mới">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              <span>Mở tab mới</span>
            </a>
          )}

          <button type="button" className="tn-btn tn-btn-icon" onClick={handlePrint} title="In tài liệu này">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </button>

          <button type="button" className="tn-btn tn-btn-icon" onClick={toggleFullscreen} title="Toàn màn hình">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>

          <button type="button" className="tn-ib tn-close-btn" onClick={() => ref.current?.close()} aria-label="Đóng cửa sổ">
            <IcoClose size={16} />
          </button>
        </div>
      </header>

      <div className="tn-pdf-body">
        <iframe
          title={doc.title}
          src={doc.file ? `${doc.file}#view=FitH&zoom=${zoom}` : doc.url}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        />
      </div>
    </dialog>
  );
}

/* ============================================================
   MODAL XEM DANH SÁCH BỘ SÁCH
   ============================================================ */
function BookList({ doc, onClose }) {
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
        <span style={{ font: '600 .75rem var(--mono)', color: '#111', opacity: 0.75 }}>
          {books.length} sách
        </span>
        <button
          type="button"
          className="tn-ib"
          onClick={() => ref.current?.close()}
          aria-label="Đóng"
          style={{ background: 'rgba(0,0,0,.1)' }}
        >
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
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
}

/* ============================================================
   MODAL THÊM TÀI LIỆU PDF CỦA BẠN (LOCAL STORAGE / UPLOAD)
   ============================================================ */
function UploadDocModal({ open, onClose, onSave }) {
  const ref = useRef(null);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState(12);
  const [subject, setSubject] = useState('hoa');
  const [kind, setKind] = useState('de');
  const [note, setNote] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMsg('Vui lòng chọn file định dạng .pdf');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Dung lượng file vượt quá 15MB. Vui lòng dán liên kết URL trực tuyến thay thế.');
      return;
    }
    setErrorMsg('');
    setFileName(file.name);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.pdf$/i, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên tài liệu.');
      return;
    }
    if (!fileUrl.trim()) {
      setErrorMsg('Vui lòng chọn file PDF hoặc nhập liên kết PDF.');
      return;
    }

    onSave({
      title: title.trim(),
      grade: Number(grade) || 12,
      subject,
      kind,
      note: note.trim() || 'Tài liệu cá nhân của bạn',
      file: fileUrl.startsWith('data:') ? fileUrl : null,
      url: fileUrl,
    });

    setTitle('');
    setNote('');
    setFileUrl('');
    setFileName('');
    setErrorMsg('');
    onClose();
  };

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className="tn-upload-modal"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <form onSubmit={handleSubmit} className="tn-upload-form">
        <header className="tn-upload-head">
          <div className="tn-upload-head-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <b>Thêm tài liệu PDF của bạn</b>
          </div>
          <button type="button" className="tn-ib" onClick={onClose} aria-label="Đóng">
            <IcoClose size={16} />
          </button>
        </header>

        <div className="tn-upload-body">
          {errorMsg && <div className="tn-upload-err">{errorMsg}</div>}

          <label className="tn-form-field">
            <span>Tên tài liệu / Tiêu đề: *</span>
            <input
              type="text"
              required
              placeholder="VD: Đề thi thử THPT Quốc Gia môn Hóa 2026 - Đề số 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div className="tn-form-row">
            <label className="tn-form-field">
              <span>Khối lớp:</span>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value={12}>Lớp 12</option>
                <option value={11}>Lớp 11</option>
                <option value={10}>Lớp 10</option>
              </select>
            </label>

            <label className="tn-form-field">
              <span>Môn học:</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECTS.map(([s, name]) => (
                  <option key={s} value={s}>{name}</option>
                ))}
              </select>
            </label>

            <label className="tn-form-field">
              <span>Loại tài liệu:</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {Object.entries(KINDS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="tn-upload-dropzone">
            <input
              type="file"
              id="tn-pdf-file-input"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="tn-file-input-hidden"
            />
            <label htmlFor="tn-pdf-file-input" className="tn-dropzone-label">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <strong>{fileName ? `Đã chọn: ${fileName}` : 'Bấm để tải file PDF từ máy tính (tối đa 15MB)'}</strong>
              <small>Hỗ trợ tài liệu học tập, chuyên đề, đề thi, tóm tắt công thức</small>
            </label>
          </div>

          <div className="tn-or-divider"><span>HOẶC DÁN LIÊN KẾT PDF</span></div>

          <label className="tn-form-field">
            <span>Link URL file PDF (Google Drive / Web):</span>
            <input
              type="url"
              placeholder="https://example.com/tai-lieu-hoa-hoc.pdf"
              value={fileUrl.startsWith('data:') ? '' : fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </label>

          <label className="tn-form-field">
            <span>Ghi chú nguồn / Tác giả (tùy chọn):</span>
            <input
              type="text"
              placeholder="VD: Thầy cô biên soạn, Trường THPT Chuyên..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        <footer className="tn-upload-foot">
          <button type="button" className="tn-btn" onClick={onClose}>
            Hủy bỏ
          </button>
          <button type="submit" className="tn-primary-btn">
            Lưu vào kho tài liệu
          </button>
        </footer>
      </form>
    </dialog>
  );
}

const PAGE_SIZE = 16;

/* ============================================================
   DOCS LIBRARY — GIAO DIỆN KHO TÀI LIỆU RÚT GỌN BENTO HIỆN ĐẠI
   ============================================================ */
export default function DocsLibrary({ query = '', grade: gProp, onGrade }) {
  const [gLocal, setGLocal] = useState('all');
  const grade = gProp ?? gLocal;
  const setGrade = onGrade || setGLocal;
  const [subject, setSubject] = useState('all');
  const [kind, setKind] = useState('all');
  const [view, setView] = useState('all'); // 'all' | 'fav' | 'recent' | 'mine'
  const [viewMode, setViewMode] = useStored('tools-doc-view-mode', 'grid'); // 'grid' | 'list'
  const [favs, setFavs] = useStored('tools-doc-fav', []);
  const [recent, setRecent] = useStored('tools-doc-recent', []);
  const [customDocs, setCustomDocs] = useStored('elec_custom_docs', []);
  const [pdf, setPdf] = useState(null);
  const [bookList, setBookList] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Gộp tài liệu hệ thống + tài liệu cá nhân
  const allDocs = useMemo(() => {
    return [...customDocs, ...DOCS];
  }, [customDocs]);

  const base = useMemo(() => {
    const q = norm(query.trim());
    return allDocs.filter((d) =>
      (grade === 'all' || d.grade === grade) &&
      (kind === 'all' || d.kind === kind) &&
      (view !== 'fav' || favs.includes(d.id)) &&
      (view !== 'recent' || recent.includes(d.id)) &&
      (view !== 'mine' || d.isCustom || d.source === 'Tài liệu của bạn') &&
      (!q || norm(`${d.title} ${SUBJ[d.subject] || ''} ${d.series || ''} ${d.source || ''}`).includes(q))
    );
  }, [allDocs, grade, kind, view, query, favs, recent]);

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
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const handleSaveCustomDoc = (newDocData) => {
    const item = {
      ...newDocData,
      id: `custom-doc-${Date.now()}`,
      isCustom: true,
      source: 'Tài liệu của bạn',
      addedAt: new Date().toISOString(),
    };
    setCustomDocs((prev) => [item, ...prev]);
    setView('mine');
  };

  const handleDeleteCustomDoc = (id, e) => {
    e?.stopPropagation?.();
    if (window.confirm('Bạn có chắc muốn xóa tài liệu này khỏi kho cá nhân của bạn?')) {
      setCustomDocs((prev) => prev.filter((d) => d.id !== id));
      setFavs((f) => f.filter((x) => x !== id));
      setRecent((r) => r.filter((x) => x !== id));
    }
  };

  const openDoc = (d) => {
    setRecent((r) => [d.id, ...r.filter((x) => x !== d.id)].slice(0, 16));
    if (d.file) {
      setPdf(d);
    } else if (d.books && d.books.length > 0) {
      setBookList(d);
    } else if (d.url) {
      if (d.url.endsWith('.pdf') || d.url.includes('/drive.google.com/')) {
        setPdf(d);
      } else {
        window.open(d.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const clearFilters = () => {
    setGrade('all');
    setSubject('all');
    setKind('all');
    setView('all');
  };

  return (
    <div className="tn tn-compact">
      {/* ── BENTO ACTION BAR: GỘP GỌN 1 HÀNG DUY NHẤT ── */}
      <div className="tn-action-bar">
        {/* Nhóm chọn Khối lớp dạng Segmented Control */}
        <div className="tn-seg-group" role="group" aria-label="Chọn khối lớp">
          <button
            type="button"
            className={`tn-seg-btn ${grade === 'all' ? 'active' : ''}`}
            onClick={() => setGrade('all')}
          >
            Tất cả lớp
          </button>
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              className={`tn-seg-btn ${grade === g ? 'active' : ''}`}
              onClick={() => setGrade(g)}
            >
              Lớp {g}
            </button>
          ))}
        </div>

        {/* Dropdown chọn Loại tài liệu */}
        <div className="tn-select-wrap">
          <select
            className="tn-select"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            aria-label="Chọn loại tài liệu"
          >
            <option value="all">📚 Mọi loại tài liệu</option>
            {Object.entries(KINDS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>

        {/* Nút lọc nhanh: Đã lưu, Gần đây, Của tôi */}
        <div className="tn-quick-filters">
          <button
            type="button"
            className={`tn-filter-pill ${view === 'fav' ? 'active' : ''}`}
            onClick={() => setView((v) => (v === 'fav' ? 'all' : 'fav'))}
            title="Tài liệu đã lưu"
          >
            <IcoStar size={13} on={view === 'fav'} />
            <span>Đã lưu ({favs.length})</span>
          </button>

          <button
            type="button"
            className={`tn-filter-pill ${view === 'recent' ? 'active' : ''}`}
            onClick={() => setView((v) => (v === 'recent' ? 'all' : 'recent'))}
            title="Tài liệu vừa mở gần đây"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Gần đây ({recent.length})</span>
          </button>

          <button
            type="button"
            className={`tn-filter-pill ${view === 'mine' ? 'active' : ''}`}
            onClick={() => setView((v) => (v === 'mine' ? 'all' : 'mine'))}
            title="Tài liệu PDF cá nhân của bạn"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Của tôi ({customDocs.length})</span>
          </button>
        </div>

        {/* Nhóm chuyển đổi View Mode (Lưới / Danh sách) + Nút Thêm PDF */}
        <div className="tn-action-right">
          <div className="tn-view-toggle" role="group" aria-label="Chế độ hiển thị">
            <button
              type="button"
              className={`tn-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Hiển thị dạng lưới thẻ"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              className={`tn-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Hiển thị dạng danh sách rút gọn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className="tn-upload-btn"
            onClick={() => setUploadOpen(true)}
            title="Thêm tài liệu PDF cá nhân vào kho"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Thêm PDF</span>
          </button>
        </div>
      </div>

      {/* ── THANH CHỌN MÔN HỌC DẠNG CUỘN NGANG NHẸ NHÀNG ── */}
      <div className="tn-subject-slider-wrap">
        <div className="tn-subject-slider" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={subject === 'all'}
            className={`tn-subj-chip ${subject === 'all' ? 'active' : ''}`}
            onClick={() => setSubject('all')}
          >
            <span>Tất cả môn</span>
            <span className="tn-chip-badge">{base.length}</span>
          </button>
          {SUBJECTS.map(([s, n]) => {
            const cnt = count(s);
            if (cnt === 0 && subject !== s) return null;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={subject === s}
                className={`tn-subj-chip ${subject === s ? 'active' : ''}`}
                onClick={() => setSubject(s)}
              >
                <span className="tn-subj-icon" style={{ color: subjectColor(s) }}>
                  <SubjectIcon subject={s} size={15} />
                </span>
                <span>{n}</span>
                <span className="tn-chip-badge">{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TRẠNG THÁI HIỂN THỊ KHOẢN MỤC ── */}
      <div className="tn-summary-bar">
        <span>
          Đang hiển thị <b>{visibleList.length}</b> / <b>{list.length}</b> tài liệu
          {grade !== 'all' && <i> · Lớp {grade}</i>}
          {subject !== 'all' && <i> · {SUBJ[subject]}</i>}
          {kind !== 'all' && <i> · {KINDS[kind]}</i>}
        </span>
        {(grade !== 'all' || subject !== 'all' || kind !== 'all' || view !== 'all') && (
          <button type="button" className="tn-clear-filter-btn" onClick={clearFilters}>
            ✕ Xóa bộ lọc
          </button>
        )}
      </div>

      {/* ── CHẾ ĐỘ 1: DẠNG LƯỚI (GRID VIEW) ── */}
      {viewMode === 'grid' && (
        <div className="tn-grid">
          {visibleList.map((d) => {
            const fav = favs.includes(d.id);
            const bookCount = d.books?.length || 0;
            const fallback = (
              <span className="tn-ico" style={{ background: subjectColor(d.subject) }}>
                <SubjectIcon subject={d.subject} grade={d.grade} size={28} />
              </span>
            );
            return (
              <article key={d.id} className="tn-card">
                <button
                  type="button"
                  className={`tn-ib tn-star ${fav ? 'on' : ''}`}
                  aria-pressed={fav}
                  aria-label={(fav ? 'Bỏ lưu ' : 'Lưu ') + d.title}
                  onClick={() => toggleFav(d.id)}
                >
                  <IcoStar size={15} on={fav} />
                </button>

                {d.isCustom && (
                  <button
                    type="button"
                    className="tn-ib tn-delete-custom-btn"
                    title="Xóa tài liệu này khỏi kho cá nhân"
                    onClick={(e) => handleDeleteCustomDoc(d.id, e)}
                  >
                    ✕
                  </button>
                )}

                <LazyCover src={d.img} alt={d.title} fallbackIcon={fallback} />

                <div className="tn-card-content">
                  <h3>
                    <span>{d.title}</span>
                    {d.isCustom && <span className="tn-badge mine">Của bạn</span>}
                    {d.hot && <span className="tn-badge hot">Hot</span>}
                    {bookCount > 1 && <span className="tn-badge new">{bookCount} sách</span>}
                    {(d.file || d.url?.endsWith('.pdf')) && <span className="tn-badge pdf">PDF</span>}
                  </h3>

                  <div className="tn-meta">
                    {d.grade && <span>Lớp {d.grade}</span>}
                    {d.subject && <span>{SUBJ[d.subject] || d.subject}</span>}
                    {d.kind && <span>{KINDS[d.kind] || d.kind}</span>}
                  </div>

                  <button type="button" className="tn-foot" onClick={() => openDoc(d)}>
                    <span>
                      <small>Nguồn</small>
                      {d.source}{d.sub ? ` · ${d.sub}` : ''}
                    </span>
                    <span className="tn-go">
                      <IconArrowUpRight size={14} />
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── CHẾ ĐỘ 2: DẠNG DANH SÁCH RÚT GỌN (LIST VIEW) ── */}
      {viewMode === 'list' && (
        <div className="tn-list-view">
          {visibleList.map((d) => {
            const fav = favs.includes(d.id);
            const bookCount = d.books?.length || 0;
            return (
              <div key={d.id} className="tn-list-row" onClick={() => openDoc(d)}>
                <div className="tn-list-left">
                  <span className="tn-list-ico" style={{ background: subjectColor(d.subject) }}>
                    <SubjectIcon subject={d.subject} grade={d.grade} size={18} />
                  </span>
                  <div className="tn-list-info">
                    <div className="tn-list-title-row">
                      <strong>{d.title}</strong>
                      {d.isCustom && <span className="tn-badge mine">Của bạn</span>}
                      {d.hot && <span className="tn-badge hot">Hot</span>}
                      {bookCount > 1 && <span className="tn-badge new">{bookCount} sách</span>}
                      {(d.file || d.url?.endsWith('.pdf')) && <span className="tn-badge pdf">PDF</span>}
                    </div>
                    <small className="tn-list-meta-text">
                      Lớp {d.grade} · {SUBJ[d.subject]} · {KINDS[d.kind]} · {d.source}
                    </small>
                  </div>
                </div>

                <div className="tn-list-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`tn-ib ${fav ? 'on' : ''}`}
                    aria-label={(fav ? 'Bỏ lưu ' : 'Lưu ') + d.title}
                    onClick={() => toggleFav(d.id)}
                  >
                    <IcoStar size={14} on={fav} />
                  </button>

                  {d.isCustom && (
                    <button
                      type="button"
                      className="tn-ib tn-delete-custom-btn"
                      title="Xóa tài liệu"
                      onClick={(e) => handleDeleteCustomDoc(d.id, e)}
                    >
                      ✕
                    </button>
                  )}

                  <button type="button" className="tn-list-read-btn" onClick={() => openDoc(d)}>
                    <span>{bookCount > 1 ? 'Xem bộ sách' : 'Mở xem'}</span>
                    <IconArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── NÚT TẢI THÊM ── */}
      {hasMore && (
        <div className="tn-more">
          <button type="button" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Xem thêm {Math.min(PAGE_SIZE, list.length - limit)} mục ({limit}/{list.length})
          </button>
        </div>
      )}

      {/* ── TRẠNG THÁI RỖNG ── */}
      {list.length === 0 && (
        <div className="tn-empty-box">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <p>
            {view === 'fav'
              ? 'Bạn chưa lưu tài liệu nào. Bấm vào icon ⭐ trên thẻ để lưu lại.'
              : view === 'recent'
              ? 'Chưa có tài liệu mở gần đây.'
              : view === 'mine'
              ? 'Bạn chưa tải lên tài liệu nào. Bấm nút "+ Thêm PDF" để lưu tài liệu cá nhân.'
              : 'Không tìm thấy tài liệu phù hợp với bộ lọc hiện tại.'}
          </p>
          <button type="button" className="tn-btn" onClick={clearFilters}>
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* ── CÁC MODAL HỆ THỐNG ── */}
      {pdf && <PdfViewerModal doc={pdf} onClose={() => setPdf(null)} />}
      {bookList && <BookList doc={bookList} onClose={() => setBookList(null)} />}
      <UploadDocModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={handleSaveCustomDoc}
      />
    </div>
  );
}
