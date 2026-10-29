/* ============================================================
   PaperGrading.jsx — Chấm phiếu trả lời trắc nghiệm giấy A4 (OMR)
   v3 (fix + optimize):
     • FIX #2: matchStudent tôn trọng cờ `studentManual` —
       không ghi đè khi giáo viên đã chọn thủ công.
     • FIX: updateItem đánh dấu `studentManual` khi sửa thông tin HS.
     • FIX: Cleanup camera stream khi unmount.
     • FIX: stopCamera reset cameraFeedback.
     • MỚI: A11y cho camera modal.
   ============================================================ */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { readSheet, fileToImageData } from '../../lib/omr.js';
import {
  measureImageQuality, duplicateSbdIds, duplicateSbdMessage,
} from '../../lib/omrQuality.js';
import {
  DEFAULT_SCORING, DEFAULT_COUNTS, MAX_COUNTS,
  parseKeyP1, parseKeyP2, parseKeyP3, keyToTextP1, keyToTextP2, keyToTextP3,
  keyToStored, keyFromStored, keyP1FromExam, gradeSheet, maxScore, checkKey,
  parseRoster, answersToRead, resultsToRows, round2,
  computePaperAnalytics,
} from '../../lib/paperGrade.js';
import {
  listPaperExams, createPaperExam, updatePaperExam, deletePaperExam,
  listPaperResults, savePaperResults, syncPaperResultsToSubmissions,
} from '../../lib/paperStore.js';
import sound from '../../lib/gameSound.js';
import { downloadCsv } from '../DashShell.jsx';
import { printOmrSheetA4 } from '../../lib/omrSheetGenerator.js';
import '../../styles/paper-grading.css';

/* ============ ICONS ============ */
const Svg = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcoScan = (p) => <Svg {...p}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><line x1="4" y1="12" x2="20" y2="12" /></Svg>;
const IcoCamera = (p) => <Svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></Svg>;
const IcoChart = (p) => <Svg {...p}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Svg>;
const IcoPrint = (p) => <Svg {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Svg>;
const IcoPlus = (p) => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>;
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IcoWarn = (p) => <Svg {...p}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Svg>;
const IcoTrash = (p) => <Svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></Svg>;
const IcoEdit = (p) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>;
const IcoX = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
const IcoDownload = (p) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Svg>;
const IcoSpark = (p) => <Svg {...p}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /></Svg>;
const IcoZoomIn = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></Svg>;
const IcoRotate = (p) => <Svg {...p}><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 4 21 10 15 10" /></Svg>;

const fmt = (n) => (n == null || Number.isNaN(n) ? '—' : String(round2(n)).replace('.', ','));
let uid = 0;
const nextId = () => `pg${Date.now().toString(36)}${(uid++).toString(36)}`;
const tick = () => new Promise((r) => setTimeout(r, 0));

/* ============================================================
   MAIN COMPONENT: PaperGrading
   ============================================================ */
export default function PaperGrading({ classes = [], exams = [] }) {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | setup | grade | analytics
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [paperSearch, setPaperSearch] = useState('');
  const [paperClassFilter, setPaperClassFilter] = useState('all');
  const [confirmDeletePaper, setConfirmDeletePaper] = useState(null);
  const toastTimer = useRef(null);

  const say = useCallback((text, tone = 'success', opts = {}) => {
    setToast({ text, tone, onUndo: opts.onUndo || null, undoLabel: opts.undoLabel || 'Hoàn tác' });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), opts.onUndo ? 5500 : 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      setPapers(await listPaperExams(user.uid));
    } catch (e) {
      say(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, say]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const classOf = (id) => classes.find((c) => c.id === id) || null;

  const handleSavePaper = async (data) => {
    setSaving(true);
    try {
      if (current?.id) {
        await updatePaperExam(current.id, data);
        setCurrent({ ...current, ...data });
        say('Đã cập nhật bài chấm thành công');
      } else {
        const created = await createPaperExam({ ...data, teacherId: user.uid });
        setCurrent(created);
        say('Đã tạo bài chấm mới thành công');
      }
      await refresh();
      setView('grade');
    } catch (e) {
      say(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaper = (p) => {
    setConfirmDeletePaper(p);
  };

  const executeDeletePaper = async () => {
    const p = confirmDeletePaper;
    if (!p) return;
    setConfirmDeletePaper(null);
    const snapshot = { ...p };
    try {
      await deletePaperExam(p.id);
      await refresh();
      say(`Đã xóa bài chấm "${p.title}"`, 'success', {
        undoLabel: 'Hoàn tác',
        onUndo: async () => {
          try {
            const { id: _id, ...rest } = snapshot;
            await createPaperExam({ ...rest, teacherId: user.uid });
            await refresh();
            say(`Đã khôi phục bài chấm "${snapshot.title}"`);
          } catch (err) {
            say(err.message || 'Không khôi phục được bài chấm', 'error');
          }
        },
      });
    } catch (e) {
      say(e.message, 'error');
    }
  };

  const filteredPapers = useMemo(() => {
    const q = paperSearch.trim().toLowerCase();
    return papers.filter((p) => {
      if (paperClassFilter !== 'all' && (p.classId || '') !== paperClassFilter) return false;
      if (!q) return true;
      return (p.title || '').toLowerCase().includes(q);
    });
  }, [papers, paperSearch, paperClassFilter]);

  const handlePrintSheet = () => {
    sound.pop?.();
    printOmrSheetA4({ title: 'PHIẾU TRẢ LỜI TRẮC NGHIỆM' });
    say('Đã mở cửa sổ in mẫu phiếu A4 chuẩn Bộ GD&ĐT 2025');
  };

  return (
    <div className="pg">
      {/* Toast thông báo góc màn hình kèm nút Hoàn tác */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 999999,
            display: 'inline-flex', alignItems: 'center', gap: '0.65rem',
            padding: '0.75rem 1.25rem', borderRadius: 14,
            background: toast.tone === 'error' ? '#ef4444' : toast.tone === 'warn' ? '#f59e0b' : '#10b981',
            color: '#ffffff', fontWeight: 700, fontSize: '0.9rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          <span>{toast.text}</span>
          {toast.onUndo && (
            <button
              type="button"
              onClick={() => {
                toast.onUndo();
                setToast(null);
              }}
              style={{
                border: '1px solid rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '0.25rem 0.65rem',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              {toast.undoLabel || 'Hoàn tác'}
            </button>
          )}
        </div>
      )}

      {/* Modal xác nhận xóa bài chấm */}
      {confirmDeletePaper && (
        <div className="vt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setConfirmDeletePaper(null)}>
          <div className="pg-editor" style={{ maxWidth: 440, padding: '1.25rem' }} role="dialog" aria-modal="true" aria-label="Xác nhận xóa bài chấm">
            <h3 style={{ marginTop: 0 }}>Xóa bài chấm phiếu A4?</h3>
            <p style={{ color: 'var(--mut)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Bạn sắp xóa bài chấm <b>“{confirmDeletePaper.title}”</b>. Bạn có thể bấm Hoàn tác trong vài giây sau khi xóa.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="vt-btn sm" onClick={() => setConfirmDeletePaper(null)}>Hủy</button>
              <button type="button" className="vt-btn sm danger" onClick={executeDeletePaper}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* 1. VIEW DANH SÁCH BÀI CHẤM */}
      {view === 'list' && (
        <>
          <header className="pg-head">
            <div>
              <h2><IcoScan size={22} /> Chấm Phiếu Trắc Nghiệm (OMR)</h2>
              <p>Chấm tự động phiếu trả lời A4 bằng Camera thời gian thực hoặc file ảnh, tính điểm & chẩn đoán phổ điểm lớp học.</p>
            </div>
            <div className="pg-head-actions">
              <button
                type="button"
                className="vt-btn sm"
                onClick={handlePrintSheet}
                title="Tải / In mẫu phiếu A4 chuẩn Bộ GD&ĐT 2025"
              >
                <IcoPrint size={14} /> Mẫu phiếu A4
              </button>
              <button
                type="button"
                className="vt-btn sm primary"
                onClick={() => { setCurrent(null); setView('setup'); }}
              >
                <IcoPlus size={14} /> Tạo bài chấm mới
              </button>
            </div>
          </header>

          {papers.length > 0 && (
            <div className="pg-toolbar" style={{ marginBottom: '0.75rem' }}>
              <input
                type="search"
                value={paperSearch}
                onChange={(e) => setPaperSearch(e.target.value)}
                placeholder="Tìm tên bài chấm phiếu…"
                aria-label="Tìm bài chấm phiếu"
                style={{
                  padding: '0.45rem 0.8rem',
                  borderRadius: 10,
                  border: '1px solid var(--t-border, rgba(15,23,42,0.12))',
                  background: 'var(--t-surface, #fff)',
                  color: 'var(--t-ink, #0f172a)',
                  fontSize: '0.85rem',
                  minWidth: 220,
                }}
              />
              {classes.length > 0 && (
                <select
                  value={paperClassFilter}
                  onChange={(e) => setPaperClassFilter(e.target.value)}
                  aria-label="Lọc bài chấm theo lớp"
                  style={{
                    padding: '0.45rem 0.8rem',
                    borderRadius: 10,
                    border: '1px solid var(--t-border, rgba(15,23,42,0.12))',
                    background: 'var(--t-surface, #fff)',
                    color: 'var(--t-ink, #0f172a)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="all">Tất cả lớp ({papers.length})</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>Lớp {c.name}</option>)}
                </select>
              )}
            </div>
          )}

          {loading ? (
            <div className="vt-loading"><p>Đang tải danh sách bài chấm...</p></div>
          ) : papers.length === 0 ? (
            <div className="pg-empty">
              <IcoScan size={44} />
              <h3>Chưa có bài chấm phiếu nào</h3>
              <p>Hãy tạo bài chấm mới, cấu hình đáp án và bắt đầu quét ảnh phiếu thi!</p>
              <button
                type="button"
                className="vt-btn primary"
                style={{ marginTop: '0.5rem' }}
                onClick={() => { setCurrent(null); setView('setup'); }}
              >
                <IcoPlus size={14} /> Tạo bài chấm đầu tiên
              </button>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="pg-empty">
              <h3>Không tìm thấy bài chấm khớp bộ lọc</h3>
              <p>Thử đổi từ khóa tìm kiếm hoặc chọn “Tất cả lớp”.</p>
              <button type="button" className="vt-btn sm" onClick={() => { setPaperSearch(''); setPaperClassFilter('all'); }}>
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="pg-cards">
              {filteredPapers.map((p) => {
                const cls = classOf(p.classId);
                const codeCount = Object.keys(p.keys || {}).length;
                return (
                  <article key={p.id} className="pg-card">
                    <div>
                      <b>{p.title}</b>
                      <small>
                        {cls ? `Lớp ${cls.name}` : 'Không gắn lớp'} · {codeCount} mã đề ·
                        Phần I ({p.counts?.p1 || 0}c), Phần II ({p.counts?.p2 || 0}c), Phần III ({p.counts?.p3 || 0}c)
                      </small>
                    </div>
                    <div className="pg-card-actions">
                      <button
                        type="button"
                        className="vt-btn sm primary"
                        onClick={() => { setCurrent(p); setView('grade'); }}
                      >
                        <IcoScan size={13} /> Chấm bài
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm"
                        onClick={() => { setCurrent(p); setView('analytics'); }}
                        title="Xem phổ điểm & ELEC AI Chẩn đoán"
                      >
                        <IcoChart size={13} /> Phổ điểm
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm"
                        onClick={() => { setCurrent(p); setView('setup'); }}
                        title="Sửa đáp án & cấu hình"
                      >
                        <IcoEdit size={13} /> Đáp án
                      </button>
                      <button
                        type="button"
                        className="pg-icon danger"
                        onClick={() => handleDeletePaper(p)}
                        aria-label="Xóa bài chấm"
                        title="Xóa bài chấm"
                      >
                        <IcoTrash size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 2. VIEW CÀI ĐẶT BÀI CHẤM & ĐÁP ÁN (SETUP) */}
      {view === 'setup' && (
        <PaperSetup
          initial={current}
          classes={classes}
          exams={exams}
          saving={saving}
          onSave={handleSavePaper}
          onCancel={() => setView(current?.id ? 'grade' : 'list')}
          say={say}
        />
      )}

      {/* 3. VIEW PHIÊN CHẤM BÀI (GRADE) */}
      {view === 'grade' && current && (
        <PaperGrade
          paper={current}
          classInfo={classOf(current.classId)}
          onBack={() => { setView('list'); refresh(); }}
          onEditSetup={() => setView('setup')}
          onOpenAnalytics={() => setView('analytics')}
          onPrintSheet={handlePrintSheet}
          onPaperChange={(patch) => setCurrent((c) => ({ ...c, ...patch }))}
          say={say}
        />
      )}

      {/* 4. VIEW PHỔ ĐIỂM & ELEC AI CHẨN ĐOÁN (ANALYTICS) */}
      {view === 'analytics' && current && (
        <PaperAnalyticsView
          exam={current}
          onBack={() => setView('grade')}
          say={say}
        />
      )}
    </div>
  );
}

/* ============================================================
   SUB-COMPONENT: FORM CẤU HÌNH & NHẬP ĐÁP ÁN (SETUP)
   ============================================================ */
function PaperSetup({ initial, classes, exams, saving, onSave, onCancel, say }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [classId, setClassId] = useState(initial?.classId || '');
  const [counts, setCounts] = useState({ ...DEFAULT_COUNTS, ...(initial?.counts || {}) });
  const [scoring, setScoring] = useState({ ...DEFAULT_SCORING, ...(initial?.scoring || {}) });
  const [codes, setCodes] = useState(() => {
    const c = Object.keys(initial?.keys || {}).sort();
    return c.length ? c : ['101'];
  });
  const [texts, setTexts] = useState(() => {
    const t = {};
    Object.entries(initial?.keys || {}).forEach(([c, k]) => {
      const key = keyFromStored(k);
      t[c] = { p1: keyToTextP1(key.p1), p2: keyToTextP2(key.p2), p3: keyToTextP3(key.p3) };
    });
    return t;
  });
  const [active, setActive] = useState(codes[0] || '101');
  const [newCode, setNewCode] = useState('');
  const [rosterText, setRosterText] = useState(() =>
    Object.entries(initial?.sbdMap || {}).map(([sbd, s]) => `${sbd}\t${s.name}`).join('\n')
  );
  const [error, setError] = useState('');

  const cls = classes.find((c) => c.id === classId);
  const cur = texts[active] || { p1: '', p2: '', p3: '' };
  const setCur = (patch) => setTexts((t) => ({ ...t, [active]: { ...(t[active] || { p1: '', p2: '', p3: '' }), ...patch } }));
  const setCount = (k, v) => setCounts((c) => ({ ...c, [k]: Math.max(0, Math.min(MAX_COUNTS[k], Number(v) || 0)) }));

  const parsed = useMemo(() => ({
    p1: parseKeyP1(cur.p1, MAX_COUNTS.p1),
    p2: parseKeyP2(cur.p2, MAX_COUNTS.p2),
    p3: parseKeyP3(cur.p3, MAX_COUNTS.p3),
  }), [cur]);
  const missing = checkKey(parsed, counts);
  const max = maxScore(counts, scoring);

  const addCode = () => {
    const c = newCode.replace(/\D/g, '').padStart(3, '0').slice(-3);
    if (!/^\d{3}$/.test(newCode.replace(/\D/g, '').padStart(3, '0'))) return;
    if (codes.includes(c)) { setActive(c); setNewCode(''); return; }
    setCodes((a) => [...a, c].sort());
    setActive(c);
    setNewCode('');
  };

  const removeCode = (c) => {
    if (codes.length <= 1) return;
    if (!window.confirm(`Xóa đáp án mã đề ${c}?`)) return;
    const rest = codes.filter((x) => x !== c);
    setCodes(rest);
    setTexts((t) => { const n = { ...t }; delete n[c]; return n; });
    if (active === c) setActive(rest[0]);
  };

  const importFromExam = (examId) => {
    const ex = exams.find((e) => e.id === examId);
    if (!ex) return;
    const k = keyP1FromExam(ex, MAX_COUNTS.p1);
    const filled = k.filter(Boolean).length;
    setCur({ p1: keyToTextP1(k) });
    setCount('p1', Math.min(MAX_COUNTS.p1, Math.max(counts.p1, ex.questions?.length || 0)));
    say(`Đã lấy ${filled} đáp án Phần I từ đề "${ex.title}"`);
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim()) { setError('Hãy đặt tên bài chấm.'); return; }
    if (counts.p1 + counts.p2 + counts.p3 === 0) { setError('Cần ít nhất 1 câu.'); return; }

    const keys = {};
    codes.forEach((c) => {
      const t = texts[c] || { p1: '', p2: '', p3: '' };
      keys[c] = keyToStored({
        p1: parseKeyP1(t.p1, MAX_COUNTS.p1),
        p2: parseKeyP2(t.p2, MAX_COUNTS.p2),
        p3: parseKeyP3(t.p3, MAX_COUNTS.p3),
      });
    });

    const roster = parseRoster(rosterText, cls?.members || []);
    setError('');
    onSave({
      title: title.trim(),
      classId: classId || null,
      counts,
      scoring,
      keys,
      sbdMap: roster.map || {},
    });
  };

  return (
    <form className="pg-setup" onSubmit={handleSubmit}>
      <header className="pg-head">
        <h2>{initial?.id ? 'Đáp án & Cấu hình bài chấm' : 'Tạo bài chấm mới'}</h2>
        <div className="pg-head-actions">
          <button type="button" className="vt-btn" onClick={onCancel} disabled={saving}>Hủy</button>
          <button type="submit" className="vt-btn primary" disabled={saving}>
            <IcoCheck size={14} /> {saving ? 'Đang lưu…' : 'Lưu và đi chấm'}
          </button>
        </div>
      </header>

      <section className="pg-block">
        <h3>1. Thông tin chung</h3>
        <div className="pg-grid">
          <label className="pg-field wide">
            <span>Tên bài chấm</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra 1 tiết — Hóa học 12"
              required
            />
          </label>
          <label className="pg-field">
            <span>Lớp học (để tự ghép tên học sinh)</span>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">-- Không gắn lớp --</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="pg-block">
        <h3>2. Cấu trúc số câu & Thang điểm (Chuẩn THPT 2025)</h3>
        <div className="pg-grid">
          <label className="pg-field">
            <span>Số câu Phần I (≤ {MAX_COUNTS.p1})</span>
            <input
              type="number" min="0" max={MAX_COUNTS.p1}
              value={counts.p1}
              onChange={(e) => setCount('p1', e.target.value)}
            />
          </label>
          <label className="pg-field">
            <span>Số câu Phần II (≤ {MAX_COUNTS.p2})</span>
            <input
              type="number" min="0" max={MAX_COUNTS.p2}
              value={counts.p2}
              onChange={(e) => setCount('p2', e.target.value)}
            />
          </label>
          <label className="pg-field">
            <span>Số câu Phần III (≤ {MAX_COUNTS.p3})</span>
            <input
              type="number" min="0" max={MAX_COUNTS.p3}
              value={counts.p3}
              onChange={(e) => setCount('p3', e.target.value)}
            />
          </label>
          <label className="pg-field">
            <span>Điểm / câu Phần I</span>
            <input
              type="number" step="0.05" min="0"
              value={scoring.p1}
              onChange={(e) => setScoring((s) => ({ ...s, p1: Number(e.target.value) || 0 }))}
            />
          </label>
          <label className="pg-field">
            <span>Điểm / câu Phần III</span>
            <input
              type="number" step="0.05" min="0"
              value={scoring.p3}
              onChange={(e) => setScoring((s) => ({ ...s, p3: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>

        <div className="pg-p2score">
          <span>Phần II — Điểm lũy tiến theo số ý đúng:</span>
          {[1, 2, 3, 4].map((n) => (
            <label key={n}>
              {n} ý:
              <input
                type="number" step="0.05" min="0"
                value={scoring.p2[n]}
                onChange={(e) => setScoring((s) => {
                  const p2 = [...s.p2];
                  p2[n] = Number(e.target.value) || 0;
                  return { ...s, p2 };
                })}
              />
            </label>
          ))}
        </div>
        <p className="pg-note">
          Tổng điểm tối đa: <b>{fmt(max)}</b>. Mặc định theo cấu trúc đề thi THPT Bộ GD&ĐT 2025 (0,25đ/câu Phần I và III;
          Phần II: 0,1 – 0,25 – 0,5 – 1,0đ).
        </p>
      </section>

      <section className="pg-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3>3. Quản lý Mã Đề & Đáp Án</h3>
          {exams.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--mut)' }}>Lấy từ đề online:</span>
              <select onChange={(e) => e.target.value && importFromExam(e.target.value)} defaultValue="">
                <option value="" disabled>-- Chọn đề có sẵn --</option>
                {exams.filter((x) => (x.questions || []).length).map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.title} ({ex.questions.length} câu)</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="pg-codes" role="tablist">
          {codes.map((c) => (
            <span key={c} className={'pg-code' + (active === c ? ' on' : '')}>
              <button type="button" role="tab" aria-selected={active === c} onClick={() => setActive(c)}>
                Mã {c}
              </button>
              {codes.length > 1 && (
                <button type="button" className="x" onClick={() => removeCode(c)} aria-label={`Xóa mã ${c}`}>
                  <IcoX size={11} />
                </button>
              )}
            </span>
          ))}
          <span className="pg-addcode">
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="Mã mới"
              onKeyDown={(e) => e.key === 'Enter' && addCode()}
              inputMode="numeric"
            />
            <button type="button" className="vt-btn sm" onClick={addCode} disabled={!newCode}>
              <IcoPlus size={12} />
            </button>
          </span>
        </div>

        <div className="pg-key">
          <label className="pg-field">
            <span>Phần I — {counts.p1} câu (VD: ABCDABCD… hoặc 1A 2B 3C…; <code>*</code> = cho điểm tất cả)</span>
            <textarea
              rows={4}
              value={cur.p1}
              onChange={(e) => setCur({ p1: e.target.value })}
              spellCheck={false}
              placeholder="ABCDABCDAB…"
            />
          </label>

          <label className="pg-field">
            <span>Phần II — {counts.p2} câu, mỗi câu 1 dòng 4 ý a-d (VD: ĐSĐS hoặc DSDS)</span>
            <textarea
              rows={4}
              value={cur.p2}
              onChange={(e) => setCur({ p2: e.target.value })}
              spellCheck={false}
              placeholder={'ĐSĐS\nSSĐĐ'}
            />
          </label>

          <label className="pg-field">
            <span>Phần III — {counts.p3} câu, mỗi câu 1 dòng (chấp nhận số âm, dấu phẩy hoặc chấm: 0,5|0.5)</span>
            <textarea
              rows={4}
              value={cur.p3}
              onChange={(e) => setCur({ p3: e.target.value })}
              spellCheck={false}
              placeholder={'0,5\n12,2|12.2'}
            />
          </label>
        </div>

        {missing.length > 0 && (
          <p className="pg-warn">
            <IcoWarn size={14} /> Mã {active}: {missing.join('; ')}. Câu chưa có đáp án sẽ không được tính điểm.
          </p>
        )}
      </section>

      <section className="pg-block">
        <h3>4. Danh sách SBD & Họ tên học sinh (Tùy chọn)</h3>
        <p className="pg-note">
          Dán trực tiếp từ Excel: mỗi dòng dạng <code>SBD [Tab] Họ và tên</code>. Hệ thống sẽ tự động ghép tên khi nhận dạng phiếu.
        </p>
        <textarea
          className="pg-roster"
          rows={5}
          value={rosterText}
          onChange={(e) => setRosterText(e.target.value)}
          spellCheck={false}
          placeholder={'102001\tNguyễn Văn An\n102002\tTrần Thị Bình'}
        />
      </section>

      {error && <p className="pg-error" role="alert">{error}</p>}

      <footer className="pg-foot">
        <button type="button" className="vt-btn" onClick={onCancel} disabled={saving}>Hủy</button>
        <button type="submit" className="vt-btn primary" disabled={saving}>
          <IcoCheck size={14} /> {saving ? 'Đang lưu…' : 'Lưu và đi chấm'}
        </button>
      </footer>
    </form>
  );
}

/* ============================================================
   SUB-COMPONENT: PHIÊN CHẤM BÀI (UPLOAD & LIVE CAMERA SCANNER)
   ============================================================ */
function PaperGrade({
  paper, classInfo, onBack, onEditSetup, onOpenAnalytics, onPrintSheet, say,
}) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // all | review | nomatch
  const fileRef = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Live Camera Scanner State
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraFeedback, setCameraFeedback] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const keys = useMemo(() => {
    const out = {};
    Object.entries(paper.keys || {}).forEach(([c, k]) => { out[c] = keyFromStored(k); });
    return out;
  }, [paper.keys]);
  const codeList = Object.keys(keys);
  const members = classInfo?.members || [];
  const counts = { ...DEFAULT_COUNTS, ...(paper.counts || {}) };
  const scoring = { ...DEFAULT_SCORING, ...(paper.scoring || {}) };

  const regrade = useCallback((it) => {
    const key = keys[it.code];
    const grade = key ? gradeSheet(it.read, key, counts, scoring) : null;
    return { ...it, grade };
  }, [keys, counts, scoring]);

  /* FIX #2: Tôn trọng studentManual */
  const matchStudent = useCallback((it) => {
    // Nếu giáo viên đã chọn thủ công → KHÔNG ghi đè
    if (it.studentManual) return it;
    // Nếu đã có studentId (đã match) → giữ nguyên
    if (it.studentId) return it;
    // Chỉ match khi có sbdMap
    const s = paper.sbdMap?.[it.sbd];
    if (s) return { ...it, studentId: s.id || null, studentName: s.name || '' };
    return it;
  }, [paper.sbdMap]);

  // Tải kết quả đã lưu từ Firestore
  useEffect(() => {
    let alive = true;
    listPaperResults(paper.id).then((rows) => {
      if (!alive) return;
      const saved = rows.map((r) => ({
        id: r.id,
        saved: true,
        fileName: r.fileName || '',
        url: null,
        status: 'done',
        sbd: r.sbd || '',
        code: r.code || '',
        studentId: r.studentId || null,
        studentName: r.studentName || '',
        read: answersToRead(r.answers),
        issues: [],
        needsReview: !!r.needsReview,
        quality: null,
      }));
      setItems((cur) => {
        const scannedSbd = new Set(cur.filter((c) => !c.saved && c.sbd).map((c) => c.sbd));
        return [...cur.filter((c) => !c.saved), ...saved.filter((s) => !scannedSbd.has(s.sbd))];
      });
    }).catch((e) => say(e.message, 'error'));
    return () => { alive = false; };
  }, [paper.id, say]);

  const graded = useMemo(
    () => items.map((it) => regrade(matchStudent(it))),
    [items, regrade, matchStudent]
  );

  /* Trùng số báo danh: đánh dấu CẢ HAI phiếu để người dùng tự quyết định */
  const dupIds = useMemo(() => duplicateSbdIds(items), [items]);
  const dupMsg = useMemo(() => duplicateSbdMessage(items), [items]);

  useEffect(() => () => {
    itemsRef.current.forEach((it) => it.url && URL.revokeObjectURL(it.url));
  }, []);

  /* FIX: Cleanup camera stream khi unmount */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Xử lý nạp nhiều file ảnh
  const processFiles = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    if (!list.length) { say('Chỉ nhận file ảnh (JPG, PNG…).', 'error'); return; }
    if (!codeList.length) { say('Bài chấm chưa có đáp án.', 'error'); return; }
    setBusy(true);
    setProgress({ done: 0, total: list.length });
    sound.ding();

    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const id = nextId();
      const url = URL.createObjectURL(f);
      let item;
      try {
         const img = await fileToImageData(f);
         await tick();
         /* Đo chất lượng ảnh TRƯỚC khi đọc: ảnh mờ/lóa vẫn "đọc ra" nhưng dễ sai ô */
         const imgQ = measureImageQuality(img);
         const r = readSheet(img);
        if (!r.ok) {
          item = { id, fileName: f.name, url, status: 'error', error: r.error, sbd: '', code: '', read: null, issues: [], needsReview: true };
        } else {
          let code = r.code;
          if (!keys[code] && codeList.length === 1) code = codeList[0];
          const codeKnown = !!keys[code];
          item = {
             id, fileName: f.name, url, status: 'done', sbd: r.sbd, code, readCode: r.code,
             read: { p1: r.p1, p2: r.p2, p3: r.p3 },
             issues: [...(r.issues || []), ...imgQ.issues],
             quality: { ...(r.quality || {}), image: imgQ, warn: r.quality?.warn || !imgQ.ok },
             needsReview: !codeKnown || r.issues.length > 0 || !!r.quality?.warn
               || !imgQ.ok || r.sbd.includes('?'),
          };
        }
      } catch (e) {
        item = { id, fileName: f.name, url, status: 'error', error: 'Không đọc được ảnh: ' + (e.message || e), sbd: '', code: '', read: null, issues: [], needsReview: true };
      }

      /* Không xoá phiếu trùng SBD (trước đây xoá âm thầm → mất kết quả đã chấm).
         Trùng được đánh dấu để giáo viên tự quyết định giữ phiếu nào. */
      setItems((cur) => [...cur, item]);
      setProgress({ done: i + 1, total: list.length });
      await tick();
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
    sound.cheer();
    say(`Đã xử lý xong ${list.length} ảnh!`);
  };

  /* ============ CAMERA LIVE SCANNER ============ */
  const startCamera = async () => {
    setCameraOpen(true);
    setCameraLoading(true);
    setCameraFeedback(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraLoading(false);
      sound.ding();
    } catch (err) {
      say('Không thể mở camera: ' + err.message, 'error');
      setCameraOpen(false);
      setCameraLoading(false);
    }
  };

  /* FIX: stopCamera reset feedback + dọn stream */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraFeedback(null);
  }, []);

  const captureAndScan = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const camQ = measureImageQuality(imgData);
      const read = readSheet(imgData);

      if (!read.ok) {
        sound.wrong?.();
        setCameraFeedback({ ok: false, msg: read.error || 'Chưa nhận diện được 4 góc A4. Hãy căn phiếu ngay ngắn!' });
        return;
      }

      // Tạo canvas nhỏ để lưu preview ảnh
      const thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
      let code = read.code;
      if (!keys[code] && codeList.length === 1) code = codeList[0];
      const codeKnown = !!keys[code];

      const item = {
        id: nextId(),
        fileName: `camera_${read.sbd || Date.now()}.jpg`,
        url: thumbUrl,
        status: 'done',
        sbd: read.sbd,
        code,
        readCode: read.code,
        read: { p1: read.p1, p2: read.p2, p3: read.p3 },
        issues: [...(read.issues || []), ...camQ.issues],
        quality: { ...(read.quality || {}), image: camQ, warn: read.quality?.warn || !camQ.ok },
        needsReview: !codeKnown || (read.issues && read.issues.length > 0)
          || !read.sbd || read.sbd.includes('?') || !camQ.ok,
      };

      /* Giữ cả phiếu trùng SBD, chỉ đánh dấu — xem chú thích ở luồng chấm ảnh hàng loạt */
      setItems((cur) => [...cur, item]);

      const key = keys[code] || { p1: [], p2: [], p3: [] };
      const grade = gradeSheet(read, key, counts, scoring);

      sound.cheer?.();
      setCameraFeedback({
        ok: true,
        msg: `✓ SBD: ${read.sbd || '---'} · Mã đề: ${code || '---'} · Điểm: ${fmt(grade?.score10)}/10`,
      });
    } catch (e) {
      sound.wrong?.();
      setCameraFeedback({ ok: false, msg: 'Lỗi: ' + e.message });
    }
  };

  /* FIX: updateItem đánh dấu studentManual khi sửa thông tin HS */
  const updateItem = useCallback((id, patch) => {
    setItems((cur) => cur.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, ...patch };
      if ('studentId' in patch || 'studentName' in patch) {
        next.studentManual = true;
      }
      if ('read' in patch || 'code' in patch || 'sbd' in patch) {
        next.edited = true;
      }
      return next;
    }));
  }, []);

  const removeItem = (id) => {
    const removed = itemsRef.current.find((c) => c.id === id);
    if (!removed) return;
    setItems((cur) => cur.filter((c) => c.id !== id));
    if (editId === id) setEditId(null);
    say(`Đã bỏ phiếu SBD ${removed.sbd || removed.fileName}`, 'warn', {
      undoLabel: 'Hoàn tác',
      onUndo: () => {
        setItems((cur) => [...cur, removed]);
        say('Đã khôi phục phiếu vào danh sách');
      },
    });
  };

  const visible = graded.filter((it) => {
    if (filter === 'review') return it.needsReview;
    if (filter === 'nomatch') return !it.studentName;
    return true;
  });

  const okRows = graded.filter((it) => it.status === 'done' && it.grade);
  const stats = useMemo(() => {
    const sc = okRows.map((r) => r.grade.score10);
    return {
      n: okRows.length,
      avg: sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null,
      max: sc.length ? Math.max(...sc) : null,
      min: sc.length ? Math.min(...sc) : null,
      review: graded.filter((g) => g.needsReview).length,
    };
  }, [okRows, graded]);

  const handleSave = async () => {
    const toSave = okRows.filter((r) => !r.saved || r.edited);
    if (!toSave.length) { say('Không có thay đổi để lưu.', 'info'); return; }
    const needs = toSave.filter((r) => r.needsReview).length;
    if (needs && !window.confirm(`Còn ${needs} phiếu đánh dấu "cần xem lại". Vẫn lưu?`)) return;
    setSaving(true);
    const mappedItems = toSave.map((r) => ({
      sbd: r.sbd, code: r.code, studentId: r.studentId, studentName: r.studentName,
      p1: r.read.p1, p2: r.read.p2, p3: r.read.p3, grade: r.grade, needsReview: r.needsReview, fileName: r.fileName,
    }));
    const res = await savePaperResults(paper.id, mappedItems);

    // Tự động đồng bộ điểm vào Lớp học (Firestore submissions) nếu bài đã gán lớp
    if (res.ok && paper.classId) {
      syncPaperResultsToSubmissions(paper, mappedItems).catch((err) => {
        console.warn('[PaperGrading] syncPaperResultsToSubmissions error:', err);
      });
    }

    setSaving(false);
    if (res.ok) {
      setItems((cur) => cur.map((c) => (toSave.some((s) => s.id === c.id) ? { ...c, saved: true, edited: false } : c)));
      say(`Đã lưu thành công ${res.saved} bài chấm${paper.classId ? ' và đồng bộ vào Lớp học' : ''}!`);
    } else {
      say(res.error, 'error');
    }
  };

  const handleExport = () => {
    if (!okRows.length) return;
    const rows = resultsToRows(okRows.slice().sort((a, b) => String(a.sbd).localeCompare(String(b.sbd))), paper);
    downloadCsv(`ket-qua-${(paper.title || 'cham-phieu').replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`, rows);
    say('Đã xuất file bảng điểm Excel (CSV UTF-8)');
  };

  const editing = graded.find((g) => g.id === editId) || null;

  return (
    <div className="pg-grade">
      <header className="pg-head">
        <div>
          <h2>{paper.title}</h2>
          <p>
            {classInfo?.name ? `Lớp ${classInfo.name}` : 'Chưa gắn lớp'} · Mã đề: {codeList.join(', ') || '—'} ·
            Tối đa {fmt(maxScore(counts, scoring))} điểm
          </p>
        </div>
        <div className="pg-head-actions">
          <button type="button" className="vt-btn sm" onClick={onBack}>Danh sách</button>
          <button type="button" className="vt-btn sm" onClick={onOpenAnalytics}>
            <IcoChart size={13} /> Phổ điểm & AI
          </button>
          <button type="button" className="vt-btn sm" onClick={onPrintSheet} title="Mẫu phiếu A4">
            <IcoPrint size={13} /> In Mẫu A4
          </button>
          <button type="button" className="vt-btn sm" onClick={onEditSetup}>
            <IcoEdit size={13} /> Đáp án
          </button>
        </div>
      </header>

      {/* KHU VỰC THAO TÁC QUÉT & TẢI ẢNH */}
      <div className="pg-drop">
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => processFiles(e.target.files)} />
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" className="vt-btn primary" onClick={startCamera}>
            <IcoCamera size={15} /> Mở Camera Chấm Trực Tiếp
          </button>
          <button type="button" className="vt-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
            <IcoScan size={15} /> {busy ? `Đang đọc ${progress.done}/${progress.total}…` : 'Tải / Chụp Ảnh Phiếu'}
          </button>
        </div>
        <span className="pg-note">
          Hỗ trợ chụp trực tiếp bằng Camera hoặc chọn nhiều file ảnh. Hệ thống tự động căn chỉnh và xử lý 100% trên thiết bị.
        </span>
      </div>

      {graded.length > 0 && (
        <>
          <div className="pg-stats">
            <span><b>{stats.n}</b> phiếu đã chấm</span>
            <span>TB: <b>{fmt(stats.avg)}</b> (thang 10)</span>
            <span>Cao nhất: <b>{fmt(stats.max)}</b></span>
            <span>Thấp nhất: <b>{fmt(stats.min)}</b></span>
            <span className={stats.review ? 'warn' : ''}>
              <IcoWarn size={13} /> <b>{stats.review}</b> cần xem lại
            </span>
          </div>

          <div className="pg-toolbar">
            <div className="pg-filters">
              {[['all', 'Tất cả'], ['review', 'Cần xem lại'], ['nomatch', 'Chưa có tên']].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  className={'pg-chip' + (filter === k ? ' on' : '')}
                  onClick={() => setFilter(k)}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="pg-head-actions">
              <button type="button" className="vt-btn sm" onClick={handleExport} disabled={!okRows.length}>
                <IcoDownload size={13} /> Xuất Excel (CSV)
              </button>
              <button type="button" className="vt-btn sm primary" onClick={handleSave} disabled={saving || !okRows.length}>
                <IcoCheck size={13} /> {saving ? 'Đang lưu…' : 'Lưu kết quả lên Cloud'}
              </button>
            </div>
          </div>

          {dupMsg && (
            <p className="pg-warn-line">
              <IcoWarn size={14} /> {dupMsg}
            </p>
          )}

          <div className="pg-tablewrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>SBD</th>
                  <th>Họ và tên</th>
                  <th>Mã đề</th>
                  <th>Phần I</th>
                  <th>Phần II</th>
                  <th>Phần III</th>
                  <th>Tổng</th>
                  <th>Thang 10</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.slice().sort((a, b) => String(a.sbd).localeCompare(String(b.sbd))).map((it) => (
                  <tr key={it.id} className={it.needsReview ? 'review' : ''}>
                    {it.status === 'error' ? (
                      <>
                        <td colSpan={8} className="pg-err-cell"><IcoWarn size={13} /> {it.fileName}: {it.error}</td>
                        <td><span className="pg-tag bad">Lỗi</span></td>
                      </>
                    ) : (
                      <>
                        <td className="mono">{it.sbd || '—'}</td>
                        <td>{it.studentName || <i className="pg-muted">chưa có tên</i>}</td>
                        <td className="mono">{it.code || '—'}</td>
                        <td>{fmt(it.grade?.parts.p1)}</td>
                        <td>{fmt(it.grade?.parts.p2)}</td>
                        <td>{fmt(it.grade?.parts.p3)}</td>
                        <td><b>{fmt(it.grade?.total)}</b></td>
                        <td>
                          <b style={{
                            fontSize: '1.05rem',
                            color: it.grade?.score10 >= 8 ? '#10b981' : it.grade?.score10 >= 5 ? '#0284c7' : '#ef4444',
                          }}>
                            {fmt(it.grade?.score10)}
                          </b>
                        </td>
                         <td>
                           {dupIds.has(it.id) ? (
                             <span className="pg-tag bad">Trùng SBD</span>
                           ) : it.needsReview ? (
                             <span className="pg-tag warn">Cần xem lại</span>
                           ) : it.saved && !it.edited ? (
                            <span className="pg-tag ok">Đã lưu</span>
                          ) : (
                            <span className="pg-tag">Mới</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="pg-row-actions">
                      {it.status !== 'error' && (
                        <button
                          type="button"
                          className="pg-icon"
                          onClick={() => setEditId(it.id)}
                          aria-label="Xem và sửa phiếu"
                          title="Xem & sửa chi tiết phiếu"
                        >
                          <IcoEdit size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="pg-icon danger"
                        onClick={() => removeItem(it.id)}
                        aria-label="Bỏ phiếu"
                        title="Bỏ phiếu này"
                      >
                        <IcoTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL SHEET EDITOR: ĐỐI CHIẾU ẢNH THẬT & SỬA TAY */}
      {editing && (
        <SheetEditor
          item={editing}
          codes={codeList}
          members={members}
          counts={counts}
          onChange={(patch) => updateItem(editing.id, patch)}
          onApprove={() => updateItem(editing.id, { needsReview: false, edited: true })}
          onClose={() => setEditId(null)}
        />
      )}

      {/* MODAL LIVE CAMERA SCANNER */}
      {cameraOpen && (
        <div
          className="pg-cam-modal animate-pop"
          role="dialog"
          aria-modal="true"
          aria-label="Camera chấm phiếu A4"
        >
          <header className="pg-cam-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <IcoCamera size={22} color="#38bdf8" />
              <strong>Camera Chấm Phiếu A4 Thời Gian Thực</strong>
            </div>
            <button type="button" className="vt-btn sm" onClick={stopCamera} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              Đóng Camera <IcoX size={13} />
            </button>
          </header>

          <div className="pg-cam-body">
            {cameraLoading && (
              <div style={{ position: 'absolute', color: '#fff', zIndex: 20 }}>
                Đang khởi động camera...
              </div>
            )}
            <video ref={videoRef} className="pg-cam-video" playsInline autoPlay muted />

            {/* Khung ngắm A4 Finder */}
            <div className="pg-cam-viewfinder">
              <div className="pg-cam-corner tl" />
              <div className="pg-cam-corner tr" />
              <div className="pg-cam-corner bl" />
              <div className="pg-cam-corner br" />
              <div className="pg-cam-scanline" />
            </div>

            {/* Nút chụp ngay trên Camera */}
            <div className="pg-cam-hud">
              <button
                type="button"
                className="vt-btn primary"
                style={{ padding: '0.8rem 2rem', fontSize: '1rem', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={captureAndScan}
              >
                <IcoCamera size={18} /> Chụp & Nhận Diện Phiếu Này
              </button>
            </div>
          </div>

          {cameraFeedback && (
            <div style={{
              margin: '0.75rem auto 0',
              padding: '0.75rem 1.5rem',
              borderRadius: 14,
              background: cameraFeedback.ok ? '#10b981' : '#ef4444',
              color: '#ffffff',
              fontWeight: 700,
              textAlign: 'center',
            }}>
              {cameraFeedback.msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUB-COMPONENT: TRÌNH SỬA PHIẾU CHI TIẾT (SHEET EDITOR)
   ============================================================ */
function SheetEditor({ item, codes, members, counts, onChange, onApprove, onClose }) {
  const [imgZoom, setImgZoom] = useState(1);
  const [imgRotate, setImgRotate] = useState(0);
  const [onlySuspicious, setOnlySuspicious] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const read = item.read || { p1: [], p2: [], p3: [] };
  const setP1 = (q, v) => {
    const p1 = [...(read.p1 || [])];
    p1[q] = v || null;
    onChange({ read: { ...read, p1 } });
  };
  const setP2 = (q, y, v) => {
    const p2 = (read.p2 || []).map((r) => [...r]);
    if (!p2[q]) p2[q] = [null, null, null, null];
    p2[q][y] = v || null;
    onChange({ read: { ...read, p2 } });
  };
  const setP3 = (q, v) => {
    const p3 = [...(read.p3 || [])];
    p3[q] = v;
    onChange({ read: { ...read, p3 } });
  };
  const issueAt = (pred) => item.issues?.some(pred);

  const issueLabel = (iss) => {
    if (!iss) return 'Ô nghi ngờ';
    if (typeof iss === 'string') return iss;
    if (iss.part === 'sbd') return 'Số báo danh (SBD)';
    if (iss.part === 'code') return 'Mã đề';
    if (iss.part === 'p1') return `Phần I - Câu ${iss.q}`;
    if (iss.part === 'p2') return `Phần II - Câu ${iss.q}${iss.y ? ` ý ${iss.y}` : ''}`;
    if (iss.part === 'p3') return `Phần III - Câu ${iss.q}`;
    return iss.msg || 'Ô nghi ngờ';
  };

  return (
    <div className="vt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pg-editor" role="dialog" aria-modal="true" aria-label="Xem và sửa phiếu">
        <header className="pg-ed-head">
          <h3>
            Phiếu {item.sbd || '(Chưa rõ SBD)'} <small>{item.fileName}</small>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {item.issues?.length > 0 && (
              <button
                type="button"
                className={'pg-chip' + (onlySuspicious ? ' on' : '')}
                onClick={() => setOnlySuspicious((v) => !v)}
              >
                <IcoWarn size={13} /> {onlySuspicious ? 'Hiện tất cả câu' : `Chỉ hiện ô nghi ngờ (${item.issues.length})`}
              </button>
            )}
            <button type="button" className="pg-icon" onClick={onClose} aria-label="Đóng">
              <IcoX size={16} />
            </button>
          </div>
        </header>

        <div className="pg-ed-body">
          {item.url && (
            <div className="pg-ed-img" style={{ position: 'relative', overflow: 'auto' }}>
              <div style={{
                position: 'sticky', top: 6, zIndex: 3, display: 'flex', gap: '0.35rem',
                justifyContent: 'flex-end', marginBottom: '0.4rem',
              }}>
                <button
                  type="button"
                  className="vt-btn sm"
                  onClick={() => setImgZoom((z) => (z >= 2 ? 1 : Number((z + 0.5).toFixed(1))))}
                  title="Phóng to / Thu nhỏ ảnh phiếu"
                >
                  <IcoZoomIn size={13} /> {Math.round(imgZoom * 100)}%
                </button>
                <button
                  type="button"
                  className="vt-btn sm"
                  onClick={() => setImgRotate((r) => (r + 90) % 360)}
                  title="Xoay ảnh 90 độ"
                >
                  <IcoRotate size={13} /> Xoay
                </button>
              </div>
              <div style={{ overflow: 'auto', textAlign: 'center' }}>
                <img
                  src={item.url}
                  alt={`Ảnh phiếu ${item.fileName}`}
                  style={{
                    transform: ` scale(${imgZoom}) rotate(${imgRotate}deg)`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.18s ease',
                    maxWidth: '100%',
                  }}
                />
              </div>
            </div>
          )}
          <div className="pg-ed-form">
            {item.quality?.warn && <p className="pg-warn"><IcoWarn size={14} /> {item.quality.warn}</p>}
            {item.issues?.length > 0 && (
              <div className="pg-note" style={{ marginBottom: '0.6rem' }}>
                <div>
                  <b>Phát hiện {item.issues.length} ô nghi ngờ</b> (nền vàng bên dưới — do tô đúp, tô mờ hoặc bỏ trống):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
                  {item.issues.slice(0, 16).map((iss, idx) => (
                    <span
                      key={idx}
                      className="pg-tag warn"
                      style={{ fontSize: '0.72rem' }}
                    >
                      {issueLabel(iss)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pg-grid">
              <label className="pg-field">
                <span>Số Báo Danh (SBD)</span>
                <input
                  value={item.sbd || ''}
                  className={issueAt((x) => x.part === 'sbd') ? 'sus' : ''}
                  onChange={(e) => onChange({ sbd: e.target.value.replace(/[^\d?]/g, '').slice(0, 6) })}
                  inputMode="numeric"
                />
              </label>

              <label className="pg-field">
                <span>Mã đề{item.readCode && item.readCode !== item.code ? ` (đọc: ${item.readCode})` : ''}</span>
                <select
                  value={item.code || ''}
                  className={!codes.includes(item.code) || issueAt((x) => x.part === 'code') ? 'sus' : ''}
                  onChange={(e) => onChange({ code: e.target.value })}
                >
                  {!codes.includes(item.code) && (
                    <option value={item.code}>{item.code || 'Chưa rõ'} (chưa có đáp án)</option>
                  )}
                  {codes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="pg-field">
                <span>Ghép học sinh của lớp</span>
                <select
                  value={item.studentId || ''}
                  onChange={(e) => {
                    const m = members.find((x) => x.id === e.target.value);
                    onChange({ studentId: m?.id || null, studentName: m?.name || '' });
                  }}
                >
                  <option value="">{item.studentName && !item.studentId ? item.studentName : '-- Chưa chọn --'}</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
            </div>

            {counts.p1 > 0 && (
              <>
                <h4>Phần I: Trắc nghiệm ({counts.p1} câu)</h4>
                <div className="pg-p1grid">
                  {Array.from({ length: counts.p1 }, (_, q) => {
                    const sus = issueAt((x) => x.part === 'p1' && x.q === q + 1);
                    if (onlySuspicious && !sus) return null;
                    return (
                      <label key={q} className={'pg-p1cell' + (sus ? ' sus' : '')}>
                        <span>{q + 1}</span>
                        <select value={read.p1?.[q] || ''} onChange={(e) => setP1(q, e.target.value)}>
                          <option value="">—</option>
                          {['A', 'B', 'C', 'D'].map((c) => <option key={c} value={c}>{c}</option>)}
                          {read.p1?.[q] === '*' && <option value="*">*</option>}
                        </select>
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            {counts.p2 > 0 && (
              <>
                <h4>Phần II: Đúng / Sai ({counts.p2} câu)</h4>
                <div className="pg-p2grid">
                  {Array.from({ length: counts.p2 }, (_, q) => (
                    <div key={q} className="pg-p2cell">
                      <b>Câu {q + 1}</b>
                      {[0, 1, 2, 3].map((y) => (
                        <label
                          key={y}
                          className={issueAt((x) => x.part === 'p2' && x.q === q + 1 && x.y === 'abcd'[y]) ? 'sus' : ''}
                        >
                          <span>{'abcd'[y]}</span>
                          <select value={read.p2?.[q]?.[y] || ''} onChange={(e) => setP2(q, y, e.target.value)}>
                            <option value="">—</option>
                            <option value="D">Đ</option>
                            <option value="S">S</option>
                            {read.p2?.[q]?.[y] === '*' && <option value="*">*</option>}
                          </select>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

            {counts.p3 > 0 && (
              <>
                <h4>Phần III: Trả lời ngắn ({counts.p3} câu)</h4>
                <div className="pg-p3grid">
                  {Array.from({ length: counts.p3 }, (_, q) => (
                    <label key={q} className={'pg-field' + (issueAt((x) => x.part === 'p3' && x.q === q + 1) ? ' sus' : '')}>
                      <span>Câu {q + 1}</span>
                      <input
                        value={read.p3?.[q] || ''}
                        maxLength={6}
                        onChange={(e) => setP3(q, e.target.value.replace(/[^\d,.\-?]/g, ''))}
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="pg-ed-score">
              Điểm tính toán: <b>{fmt(item.grade?.total)}</b> / {fmt(item.grade?.max)} →{' '}
              <b style={{ color: '#0284c7', fontSize: '1.1rem' }}>{fmt(item.grade?.score10)}</b>/10
              {!item.grade && <span className="pg-warn"> (mã đề chưa có đáp án)</span>}
            </div>
          </div>
        </div>

        <footer className="pg-foot">
          {item.needsReview && (
            <button type="button" className="vt-btn" onClick={onApprove}>
              <IcoCheck size={14} /> Xác nhận không còn nghi ngờ
            </button>
          )}
          <button type="button" className="vt-btn primary" onClick={onClose}>
            Xong & Đóng
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENT: PHÂN TÍCH PHỔ ĐIỂM & ELEC AI CHẨN ĐOÁN
   ============================================================ */
function PaperAnalyticsView({ exam, onBack, say }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await listPaperResults(exam.id);
        setResults(list);
      } catch (e) {
        say(e.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [exam.id, say]);

  const stats = useMemo(() => {
    return computePaperAnalytics(results, exam.counts);
  }, [results, exam.counts]);

  if (loading) return <div className="vt-loading"><p>Đang tổng hợp dữ liệu phổ điểm...</p></div>;
  if (!stats) return (
    <div className="pg-empty">
      <h3>Chưa có dữ liệu phổ điểm</h3>
      <p>Cần ít nhất 1 bài thi đã chấm để phân tích và vẽ biểu đồ phổ điểm!</p>
      <button type="button" className="vt-btn primary" onClick={onBack}>Quay lại chấm bài</button>
    </div>
  );

  const maxBinCount = Math.max(...stats.bins.map((b) => b.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header className="pg-head">
        <div>
          <h2><IcoChart size={22} /> Phổ Điểm & Chẩn Đoán Lớp Học</h2>
          <p>{exam.title} · Tổng số bài đã chấm: <b>{stats.count}</b> học sinh</p>
        </div>
        <button type="button" className="vt-btn sm" onClick={onBack}>
          ← Quay lại chấm bài
        </button>
      </header>

      {/* Grid chỉ số then chốt */}
      <div className="pg-analytics-grid">
        <div className="pg-block">
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--mut)' }}>ĐIỂM TRUNG BÌNH</span>
          <strong style={{ fontSize: '2.1rem', color: '#0284c7' }}>{stats.avg}</strong>
          <small>Trung vị: {stats.median} · Độ lệch chuẩn: {stats.stdDev}</small>
        </div>
        <div className="pg-block">
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--mut)' }}>TỶ LỆ ĐẠT (≥ 5.0)</span>
          <strong style={{ fontSize: '2.1rem', color: '#10b981' }}>{stats.passRate}%</strong>
          <small>Học sinh khá giỏi (≥ 8.0): {stats.goodRate}%</small>
        </div>
        <div className="pg-block">
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--mut)' }}>CAO NHẤT / THẤP NHẤT</span>
          <strong style={{ fontSize: '2.1rem', color: '#f59e0b' }}>{stats.max} / {stats.min}</strong>
          <small>Khoảng biến thiên: {round2(stats.max - stats.min)} điểm</small>
        </div>
      </div>

      {/* Biểu đồ Histogram phổ điểm */}
      <div className="pg-block">
        <h3>Biểu đồ phân phối phổ điểm (Thang điểm 10)</h3>
        <div className="pg-hist-chart">
          {stats.bins.map((bin, i) => {
            const hPct = Math.round((bin.count / maxBinCount) * 100);
            return (
              <div key={i} className="pg-hist-col">
                <span className="pg-hist-val">{bin.count || ''}</span>
                <div className="pg-hist-bar" style={{ height: `${Math.max(hPct, 4)}%` }} />
                <span className="pg-hist-lbl">{bin.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 5 câu học sinh sai nhiều nhất */}
      {stats.hardestP1 && stats.hardestP1.length > 0 && (
        <div className="pg-block">
          <h3>Top 5 câu hỏi học sinh làm sai nhiều nhất (Phần I)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {stats.hardestP1.map((q) => (
              <div
                key={q.q}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.65rem 0.9rem', background: 'var(--surface-2, #f8fafc)', borderRadius: 12,
                }}
              >
                <span><strong>Câu {q.q}</strong></span>
                <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.88rem' }}>
                  Tỷ lệ làm đúng chỉ: {q.correctRate}% ({q.correctCount}/{q.totalAnswered} học sinh)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ELEC AI Chẩn đoán */}
      <div className="pg-block" style={{ borderLeft: '4px solid #0284c7' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7' }}>
          <IcoSpark size={18} /> ELEC AI Chẩn đoán sư phạm
        </h3>
        <p style={{ margin: '0.5rem 0 0', lineHeight: 1.6, fontSize: '0.92rem' }}>
          "Dựa trên kết quả bài chấm phiếu trắc nghiệm, điểm trung bình của lớp đạt <strong>{stats.avg}/10</strong> với tỷ lệ đạt <strong>{stats.passRate}%</strong>.
          {stats.hardestP1 && stats.hardestP1.length > 0 && (
            <> Học sinh gặp thử thách lớn nhất ở các câu <strong>{stats.hardestP1.map((x) => `Câu ${x.q}`).join(', ')}</strong>.</>
          )}
          {' '}Thầy cô nên chú trọng củng cố lại các dạng bài tập tương tự trước khi bước vào các bài kiểm tra định kỳ tiếp theo!"
        </p>
      </div>
    </div>
  );
}