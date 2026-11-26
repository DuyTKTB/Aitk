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
import { useTeacherPro } from '../../hooks/useTeacherPro.js';
import {
  resolveEntitlements,
  FREE_TEACHER_LIMITS,
  TEACHER_VIP_PRICE_TEXT,
  getOmrTrialUsed,
  incrementOmrTrialUsed,
  getOmrTrialRemaining,
} from '../../lib/entitlements.js';
import TeacherVipLock from './TeacherVipLock.jsx';
import { readSheet, fileToImageData } from '../../lib/omr.js';
import {
  measureImageQuality, paperRegionFromCorners, IMG_LIMITS, duplicateSbdIds, duplicateSbdMessage,
} from '../../lib/omrQuality.js';
import {
  DEFAULT_SCORING, DEFAULT_COUNTS, MAX_COUNTS,
  MOET_EXAM_PRESETS, matchMoetPreset,
  parseKeyP1, parseKeyP2, parseKeyP3, keyToTextP1, keyToTextP2, keyToTextP3,
  keyToStored, keyFromStored, keyP1FromExam, keyP2FromExam, keyP3FromExam,
  classifyExamQuestionPart, gradeSheet, maxScore, checkKey,
  parseRoster, answersToRead, resultsToRows, round2,
  computePaperAnalytics, answerKeyFromSheetRead, parseBulkMatrixKeys,
  autoGenerateSbdRoster, buildScoreReportPrintHtml,
} from '../../lib/paperGrade.js';
import {
  listPaperExams, createPaperExam, updatePaperExam, deletePaperExam,
  listPaperResults, savePaperResults, deletePaperResult, syncPaperResultsToSubmissions,
} from '../../lib/paperStore.js';
import sound from '../../lib/gameSound.js';
import { exportStyledWorkbook } from '../../lib/excelExport.js';
import { ElecFlaskBrandSvg } from './ElecBrandMark.jsx';
import OmrPrintStudioModal from './OmrPrintStudioModal.jsx';
import OmrCameraModal from './OmrCameraModal.jsx';
import SheetAnswerOverlay from './SheetAnswerOverlay.jsx';
import { dispatchPrintDocument } from '../../lib/omrSheetGenerator.js';
import EssayRubricGrader from './EssayRubricGrader.jsx';
import TeacherPedagogyWorkbench from './TeacherPedagogyWorkbench.jsx';
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
const IcoSpark = ({ size = 16, className = '', style }) => (
  <ElecFlaskBrandSvg size={size} variant="gradient" className={className} style={style} />
);
const IcoZoomIn = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></Svg>;
const IcoRotate = (p) => <Svg {...p}><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 4 21 10 15 10" /></Svg>;

const fmt = (n) => (n == null || Number.isNaN(n) ? '—' : String(round2(n)).replace('.', ','));
let uid = 0;
const nextId = () => `pg${Date.now().toString(36)}${(uid++).toString(36)}`;
const tick = () => new Promise((r) => setTimeout(r, 0));

/* ============================================================
   MAIN COMPONENT: PaperGrading
   ============================================================ */
export default function PaperGrading({ classes = [], exams = [], isTeacherVip = undefined, onRequestUpgrade = null }) {
  const { user } = useAuth();
  const pro = useTeacherPro();
  const vipUnlocked = typeof isTeacherVip === 'boolean'
    ? isTeacherVip
    : resolveEntitlements({ user, pro, userRole: 'teacher' }).isTeacherVip;
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | setup | grade | analytics | rubric | pedagogy
  const [analyticsOrigin, setAnalyticsOrigin] = useState('list'); // list | grade
  const [liveAnalyticsItems, setLiveAnalyticsItems] = useState(null);
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [paperSearch, setPaperSearch] = useState('');
  const [paperClassFilter, setPaperClassFilter] = useState('all');
  const [confirmDeletePaper, setConfirmDeletePaper] = useState(null);
  const [printStudio, setPrintStudio] = useState({ open: false, paper: null });
  const toastTimer = useRef(null);

  const papersGradedFloor = useMemo(
    () => papers.reduce((sum, p) => sum + Number(p.stats?.count || p.results?.length || 0), 0),
    [papers]
  );
  const [omrUsed, setOmrUsed] = useState(() => getOmrTrialUsed(user?.uid, 0));
  useEffect(() => {
    setOmrUsed(getOmrTrialUsed(user?.uid, papersGradedFloor));
  }, [user?.uid, papersGradedFloor]);
  const omrRemaining = vipUnlocked
    ? Infinity
    : getOmrTrialRemaining(user?.uid, false, papersGradedFloor);
  const handleOmrUsed = useCallback((delta = 1) => {
    const next = incrementOmrTrialUsed(user?.uid, delta, papersGradedFloor);
    setOmrUsed(next);
    return next;
  }, [user?.uid, papersGradedFloor]);

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
    let savedResultsSnapshot = [];
    try {
      savedResultsSnapshot = await listPaperResults(p.id).catch(() => []);
      await deletePaperExam(p.id);
      await refresh();
      say(`Đã xóa bài chấm "${p.title}"`, 'success', {
        undoLabel: 'Hoàn tác',
        onUndo: async () => {
          try {
            const { id: _id, ...rest } = snapshot;
            const restored = await createPaperExam({ ...rest, teacherId: user.uid });
            if (savedResultsSnapshot.length > 0 && restored?.id) {
              const restoredItems = savedResultsSnapshot.map((r) => {
                const read = answersToRead(r.answers);
                return {
                  id: r.id,
                  sbd: r.sbd || '',
                  code: r.code || '',
                  studentId: r.studentId || null,
                  studentName: r.studentName || '',
                  p1: read.p1,
                  p2: read.p2,
                  p3: read.p3,
                  grade: r.grade,
                  needsReview: !!r.needsReview,
                  fileName: r.fileName || '',
                };
              });
              await savePaperResults(restored.id, restoredItems);
              if (snapshot.stats) {
                await updatePaperExam(restored.id, { stats: snapshot.stats }).catch(() => {});
              }
            }
            await refresh();
            say(`Đã khôi phục bài chấm "${snapshot.title}"${savedResultsSnapshot.length ? ` (${savedResultsSnapshot.length} phiếu)` : ''}`);
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

  const handlePrintSheet = (targetPaper = null) => {
    sound.pop?.();
    setPrintStudio({ open: true, paper: targetPaper || null });
  };

  return (
    <div className="pg">
      <OmrPrintStudioModal
        open={printStudio.open}
        paper={printStudio.paper}
        onClose={() => setPrintStudio({ open: false, paper: null })}
        onPrinted={({ count, method }) => {
          say(
            method === 'download'
              ? `Đã tải file A4 vector (${count} trang) chuẩn Bộ GD&ĐT!`
              : `Đã mở lệnh in ${count} trang phiếu OMR A4 chuẩn Bộ GD&ĐT!`
          );
        }}
      />
      {/* Toast thông báo góc màn hình kèm nút Hoàn tác */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 999999,
            display: 'inline-flex', alignItems: 'center', gap: '0.65rem',
            padding: '0.75rem 1.25rem', borderRadius: 14,
            background: toast.tone === 'error'
              ? '#ef4444'
              : (toast.tone === 'warn' || toast.tone === 'warning')
                ? '#f59e0b'
                : toast.tone === 'info'
                  ? '#0284c7'
                  : '#10b981',
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
          <header className="pg-head pg-head-hero">
            <div className="pg-head-main">
              <div className="pg-head-icon-wrap" aria-hidden="true">
                <IcoScan size={22} />
              </div>
              <div className="pg-head-copy">
                <div className="pg-head-title-row">
                  <h2>Chấm Phiếu Trắc Nghiệm A4 (OMR)</h2>
                  <span className="pg-moet-pill">Chuẩn Bộ GD&amp;ĐT 2025+</span>
                </div>
                <p>Chấm tự động phiếu A4 3 phần bằng Camera trực tiếp hoặc ảnh chụp, xuất Excel &amp; phân tích phổ điểm.</p>
              </div>
            </div>
            <div className="pg-head-actions">
              <button
                type="button"
                className="vt-btn sm"
                onClick={() => handlePrintSheet(null)}
                title="Mở Studio Thiết kế & In mẫu phiếu A4 chuẩn Bộ GD&ĐT 2025"
              >
                <IcoPrint size={14} /> In mẫu phiếu A4
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

          {/* Thanh công cụ chuyên môn bổ trợ gọn gàng */}
          <div className="pg-tools-strip">
            <span className="pg-tools-label">Công cụ mở rộng:</span>
            <button
              type="button"
              className="pg-tool-pill"
              onClick={() => setView('rubric')}
              title="AI Chấm tự luận & bài giải viết tay theo Rubric thành phần"
            >
              <IcoEdit size={13} /> Chấm Tự luận Rubric AI
            </button>
            <button
              type="button"
              className="pg-tool-pill"
              onClick={() => setView('pedagogy')}
              title="Soạn Giáo án CV 5512, Ma trận Đặc tả CV 7991 & Nhận xét Thông tư 22 xuất Word"
            >
              <IcoSpark size={13} /> Giáo án CV 5512 &amp; Ma trận CV 7991
            </button>
          </div>

          {papers.length > 0 && (
            <div className="pg-toolbar pg-list-toolbar">
              <input
                type="search"
                className="pg-search-input"
                value={paperSearch}
                onChange={(e) => setPaperSearch(e.target.value)}
                placeholder="Tìm tên bài chấm phiếu…"
                aria-label="Tìm bài chấm phiếu"
              />
              {classes.length > 0 && (
                <select
                  className="pg-select-input"
                  value={paperClassFilter}
                  onChange={(e) => setPaperClassFilter(e.target.value)}
                  aria-label="Lọc bài chấm theo lớp"
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
              <div className="pg-empty-ico"><IcoScan size={32} /></div>
              <h3>Chưa có bài chấm phiếu nào</h3>
              <p>Tạo bài chấm mới, nhập bảng đáp án theo mã đề (hoặc nạp từ đề đã soạn) rồi quét phiếu A4 bằng Camera hoặc tải ảnh lên.</p>
              <div className="pg-empty-actions">
                <button
                  type="button"
                  className="vt-btn primary"
                  onClick={() => { setCurrent(null); setView('setup'); }}
                >
                  <IcoPlus size={14} /> Tạo bài chấm đầu tiên
                </button>
                <button
                  type="button"
                  className="vt-btn"
                  onClick={() => handlePrintSheet(null)}
                >
                  <IcoPrint size={14} /> Tải / In mẫu phiếu A4
                </button>
              </div>
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
                const p1c = p.counts?.p1 || 0;
                const p2c = p.counts?.p2 || 0;
                const p3c = p.counts?.p3 || 0;
                return (
                  <article key={p.id} className="pg-card">
                    <div className="pg-card-info">
                      <div className="pg-card-badge" aria-hidden="true">
                        <IcoScan size={18} />
                      </div>
                      <div className="pg-card-copy">
                        <b>{p.title}</b>
                        <div className="pg-card-meta">
                          <span className={`pg-meta-tag${cls ? ' is-class' : ''}`}>
                            {cls ? `Lớp ${cls.name}` : 'Chưa gắn lớp'}
                          </span>
                          <span className="pg-meta-tag">{codeCount} mã đề</span>
                          {Number(p.stats?.count) > 0 && (
                            <span className="pg-meta-tag is-graded">
                              Đã chấm {p.stats.count} phiếu{p.stats.avg != null ? ` · TB ${fmt(p.stats.avg)}` : ''}
                            </span>
                          )}
                          <span className="pg-meta-struct">
                            {p1c > 0 && `P.I ${p1c}c`}
                            {p2c > 0 && `${p1c > 0 ? ' · ' : ''}P.II ${p2c}c`}
                            {p3c > 0 && `${(p1c > 0 || p2c > 0) ? ' · ' : ''}P.III ${p3c}c`}
                          </span>
                        </div>
                      </div>
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
                        onClick={() => handlePrintSheet(p)}
                        title="In phiếu trả lời A4 theo cấu trúc & mã đề của bài chấm này"
                      >
                        <IcoPrint size={13} /> In phiếu
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm"
                        onClick={() => {
                          setCurrent(p);
                          setLiveAnalyticsItems(null);
                          setAnalyticsOrigin('list');
                          setView('analytics');
                        }}
                        title="Xem phổ điểm & chẩn đoán lớp học"
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

      {/* 2B. VIEW CHẤM TỰ LUẬN & NHÁP VIẾT TAY THEO RUBRIC */}
      {view === 'rubric' && (
        <EssayRubricGrader
          onBack={() => setView('list')}
          say={say}
        />
      )}

      {/* 2C. VIEW HỒ SƠ CHUYÊN MÔN GIÁO VIÊN (CV 5512 · CV 7991 · TT 22) */}
      {view === 'pedagogy' && (
        <TeacherPedagogyWorkbench
          onClose={() => setView('list')}
        />
      )}

      {/* 3. VIEW PHIÊN CHẤM BÀI (GRADE) */}
      {view === 'grade' && current && (
        <PaperGrade
          paper={current}
          classInfo={classOf(current.classId)}
          onBack={() => { setLiveAnalyticsItems(null); setView('list'); refresh(); }}
          onEditSetup={() => setView('setup')}
          onOpenAnalytics={(liveGraded = null) => {
            setLiveAnalyticsItems(Array.isArray(liveGraded) ? liveGraded : null);
            setAnalyticsOrigin('grade');
            setView('analytics');
          }}
          onPrintSheet={() => handlePrintSheet(current)}
          onPaperChange={(patch) => setCurrent((c) => (c ? { ...c, ...patch } : c))}
          say={say}
          vipUnlocked={vipUnlocked}
          omrUsed={omrUsed}
          omrRemaining={omrRemaining}
          maxOmrTrial={FREE_TEACHER_LIMITS.maxOmrTrialSheets}
          onOmrUsed={handleOmrUsed}
          onRequestUpgrade={onRequestUpgrade}
        />
      )}

      {/* 4. VIEW PHỔ ĐIỂM & CHẨN ĐOÁN LỚP HỌC (ANALYTICS) */}
      {view === 'analytics' && current && (
        vipUnlocked ? (
          <PaperAnalyticsView
            exam={current}
            liveResults={liveAnalyticsItems}
            backLabel={analyticsOrigin === 'list' ? '← Quay lại danh sách' : '← Quay lại phiên chấm'}
            onBack={() => setView(analyticsOrigin === 'list' ? 'list' : 'grade')}
            say={say}
          />
        ) : (
          <div style={{ padding: '0.5rem 0' }}>
            <button
              type="button"
              className="vt-btn sm"
              onClick={() => setView(analyticsOrigin === 'list' ? 'list' : 'grade')}
              style={{ marginBottom: '0.75rem' }}
            >
              {analyticsOrigin === 'list' ? '← Quay lại danh sách' : '← Quay lại phiên chấm'}
            </button>
            <TeacherVipLock
              title="Phổ điểm & Chẩn đoán bài chấm phiếu OMR"
              description="Phân tích phân bố điểm tự động, chỉ số độ khó p & độ phân cách D theo từng câu và gợi ý ôn tập cho lớp."
              onUpgrade={onRequestUpgrade}
            />
          </div>
        )
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
  const [linkedExamId, setLinkedExamId] = useState(initial?.linkedExamId || '');
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
  const [keyEntryMode, setKeyEntryMode] = useState('text'); // 'text' | 'grid'
  const [showMatrixPaste, setShowMatrixPaste] = useState(false);
  const [matrixText, setMatrixText] = useState('');
  const [keyScanOpen, setKeyScanOpen] = useState(false);
  const keyFileRef = useRef(null);
  const [rosterText, setRosterText] = useState(() =>
    Object.entries(initial?.sbdMap || {}).map(([sbd, s]) => `${sbd}\t${s.name}`).join('\n')
  );
  const [error, setError] = useState('');

  const cls = classes.find((c) => c.id === classId);
  const cur = texts[active] || { p1: '', p2: '', p3: '' };
  const setCur = (patch) => setTexts((t) => ({ ...t, [active]: { ...(t[active] || { p1: '', p2: '', p3: '' }), ...patch } }));
  const setCount = (k, v) => setCounts((c) => ({ ...c, [k]: Math.max(0, Math.min(MAX_COUNTS[k], Number(v) || 0)) }));

  const applyScannedKeyResult = (res) => {
    const targetCode = res?.code && /^\d{3}$/.test(res.code) ? res.code : active;
    if (!codes.includes(targetCode)) {
      setCodes((a) => [...a, targetCode].sort());
    }
    setTexts((t) => ({ ...t, [targetCode]: res.texts }));
    setActive(targetCode);
    setKeyScanOpen(false);
    say?.(
      `Đã nạp đáp án Mã ${targetCode} từ phiếu tô chuẩn: P.I (${res.filledCount.p1}c), P.II (${res.filledCount.p2}c), P.III (${res.filledCount.p3}c)`
    );
  };

  const handleUploadKeySheet = async (file) => {
    if (!file) return;
    try {
      const imgData = await fileToImageData(file);
      const read = readSheet(imgData);
      if (!read.ok) {
        say?.(read.error || 'Chưa nhận diện được 4 góc phiếu đáp án mẫu.', 'error');
        return;
      }
      const keyRes = answerKeyFromSheetRead(read, counts);
      applyScannedKeyResult(keyRes);
    } catch (e) {
      say?.(e?.message || 'Không đọc được ảnh phiếu đáp án.', 'error');
    } finally {
      if (keyFileRef.current) keyFileRef.current.value = '';
    }
  };

  const handleImportMatrix = () => {
    const res = parseBulkMatrixKeys(matrixText, MAX_COUNTS);
    if (!res.parsedCount) {
      say?.('Không tìm thấy mã đề hợp lệ (VD bảng Excel có hàng tiêu đề Câu | 101 | 102 | 103 | 104).', 'error');
      return;
    }
    const det = res.detectedCounts || { p1: 0, p2: 0, p3: 0 };
    const nextCounts = {
      p1: Math.max(counts.p1, det.p1),
      p2: Math.max(counts.p2, det.p2),
      p3: Math.max(counts.p3, det.p3),
    };
    const expanded = nextCounts.p1 !== counts.p1 || nextCounts.p2 !== counts.p2 || nextCounts.p3 !== counts.p3;
    if (expanded) setCounts(nextCounts);

    setCodes((prev) => [...new Set([...prev, ...res.codes])].sort());
    setTexts((prev) => {
      const next = { ...prev };
      res.codes.forEach((c) => {
        const k = res.byCode[c];
        next[c] = {
          p1: keyToTextP1(k.p1.slice(0, nextCounts.p1 || MAX_COUNTS.p1)),
          p2: keyToTextP2(k.p2.slice(0, nextCounts.p2 || MAX_COUNTS.p2)),
          p3: keyToTextP3(k.p3.slice(0, nextCounts.p3 || MAX_COUNTS.p3)),
        };
      });
      return next;
    });
    setActive(res.codes[0]);
    setMatrixText('');
    setShowMatrixPaste(false);
    say?.(
      `Đã nhập nhanh đáp án cho ${res.parsedCount} mã đề: ${res.codes.join(', ')}`
      + (expanded ? ` (đã tự mở rộng cấu trúc lên ${nextCounts.p1}·${nextCounts.p2}·${nextCounts.p3})` : '')
    );
  };

  const add4CodesBatch = () => {
    const base = codes.includes('101') && codes.includes('104') ? ['201', '202', '203', '204'] : ['101', '102', '103', '104'];
    const merged = [...new Set([...codes, ...base])].sort();
    setCodes(merged);
    if (!codes.includes(base[0])) setActive(base[0]);
    say?.(`Đã chuẩn bị các tab mã đề: ${merged.join(', ')}`);
  };

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
    const qs = ex.questions || [];
    let p1N = 0;
    let p2N = 0;
    let p3N = 0;
    qs.forEach((q) => {
      const part = classifyExamQuestionPart(q);
      if (part === 2) p2N += 1;
      else if (part === 3) p3N += 1;
      else p1N += 1;
    });
    const k1 = keyP1FromExam(ex, MAX_COUNTS.p1);
    const k2 = keyP2FromExam(ex, MAX_COUNTS.p2);
    const k3 = keyP3FromExam(ex, MAX_COUNTS.p3);
    const filled1 = k1.filter(Boolean).length;
    const filled2 = k2.filter((arr) => arr.some(Boolean)).length;
    const filled3 = k3.filter((arr) => arr.length > 0).length;
    setCur({
      p1: keyToTextP1(k1),
      p2: keyToTextP2(k2),
      p3: keyToTextP3(k3),
    });
    setCounts((c) => ({
      p1: p1N > 0 ? Math.min(MAX_COUNTS.p1, p1N) : c.p1,
      p2: p2N > 0 ? Math.min(MAX_COUNTS.p2, p2N) : (p1N + p3N > 0 ? 0 : c.p2),
      p3: p3N > 0 ? Math.min(MAX_COUNTS.p3, p3N) : (p1N + p2N > 0 ? 0 : c.p3),
    }));
    setLinkedExamId(ex.id);
    if (!classId && ex.classId) setClassId(ex.classId);
    say(`Đã lấy đáp án từ đề "${ex.title}": P.I (${filled1}c), P.II (${filled2}c), P.III (${filled3}c)`);
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
      linkedExamId: linkedExamId || null,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3>2. Cấu trúc số câu &amp; Thang điểm (Chuẩn Bộ GD&amp;ĐT 2025+)</h3>
          <span className={'pg-tag ' + (Math.abs(max - 10) < 0.01 ? 'ok' : 'warn')}>
            {Math.abs(max - 10) < 0.01
              ? '✓ Chuẩn thang 10,0đ BGD'
              : `Tổng ${fmt(max)}đ (tự quy đổi thang 10)`}
          </span>
        </div>

        <div className="pg-moet-presets" role="group" aria-label="Mẫu cấu trúc Bộ GD&ĐT 2025">
          <span className="pg-moet-presets-lbl">Mẫu chuẩn nhanh:</span>
          {MOET_EXAM_PRESETS.map((preset) => {
            const activePreset = matchMoetPreset(counts, scoring)?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={'pg-preset-chip' + (activePreset ? ' on' : '')}
                onClick={() => {
                  setCounts({ ...preset.counts });
                  setScoring({ ...preset.scoring });
                  say?.(`Đã áp dụng mẫu ${preset.label}: ${preset.note}`);
                }}
                title={preset.note}
              >
                <b>{preset.shortLabel}</b>
              </button>
            );
          })}
        </div>
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
          <h3>3. Quản lý Mã Đề &amp; Đáp Án</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
            <input
              ref={keyFileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleUploadKeySheet(e.target.files?.[0])}
            />
            <button
              type="button"
              className="vt-btn sm"
              onClick={() => setKeyScanOpen(true)}
              title="Đưa phiếu đáp án đã tô sẵn qua Camera để tự động điền toàn bộ đáp án (giống TNMaker)"
            >
              <IcoCamera size={13} /> Quét Phiếu Đáp Án
            </button>
            <button
              type="button"
              className="vt-btn sm"
              onClick={() => keyFileRef.current?.click()}
              title="Tải ảnh chụp tờ phiếu tô sẵn đáp án chuẩn"
            >
              <IcoScan size={13} /> Ảnh Đáp Án
            </button>
            <button
              type="button"
              className={'vt-btn sm' + (showMatrixPaste ? ' primary' : '')}
              onClick={() => setShowMatrixPaste((v) => !v)}
              title="Dán bảng đáp án nhiều mã đề từ Excel / McMix / TNMix"
            >
              Dán Bảng Excel
            </button>
            {exams.length > 0 && (
              <select
                className="pg-select-input pg-select-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    importFromExam(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                aria-label="Lấy đáp án từ đề online đã soạn"
              >
                <option value="" disabled>Lấy từ đề online…</option>
                {exams.filter((x) => (x.questions || []).length).map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.title} ({ex.questions.length} câu)</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {showMatrixPaste && (
          <div className="pg-matrix-drawer">
            <p className="pg-note">
              Dán trực tiếp bảng đáp án copy từ Excel / McMix / TNMix (dòng đầu chứa các mã đề 3 chữ số, VD: <code>Câu | 101 | 102 | 103 | 104</code>):
            </p>
            <textarea
              rows={5}
              value={matrixText}
              onChange={(e) => setMatrixText(e.target.value)}
              placeholder={'Câu\t101\t102\t103\t104\n1\tA\tC\tB\tD\n2\tB\tD\tA\tC'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem' }}>
              <button type="button" className="vt-btn sm" onClick={() => setShowMatrixPaste(false)}>Đóng</button>
              <button type="button" className="vt-btn sm primary" onClick={handleImportMatrix}>Nhập Tất Cả Mã Đề</button>
            </div>
          </div>
        )}

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
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCode())}
              inputMode="numeric"
            />
            <button type="button" className="vt-btn sm" onClick={addCode} disabled={!newCode}>
              <IcoPlus size={12} />
            </button>
          </span>
          <button
            type="button"
            className="vt-btn sm"
            onClick={add4CodesBatch}
            title="Thêm nhanh 4 mã đề chuẩn (101–104 hoặc 201–204)"
          >
            + 4 Mã Đề
          </button>

          <div className="pg-mode-switch" style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className={'pg-chip' + (keyEntryMode === 'text' ? ' on' : '')}
              onClick={() => setKeyEntryMode('text')}
            >
              Nhập chuỗi
            </button>
            <button
              type="button"
              className={'pg-chip' + (keyEntryMode === 'grid' ? ' on' : '')}
              onClick={() => setKeyEntryMode('grid')}
            >
              Bảng bấm ô
            </button>
          </div>
        </div>

        {keyEntryMode === 'grid' ? (
          <div className="pg-touch-keygrid">
            {counts.p1 > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.45rem' }}>Phần I ({counts.p1} câu — chạm để chọn)</h4>
                <div className="pg-touch-p1">
                  {Array.from({ length: counts.p1 }, (_, i) => {
                    const val = parsed.p1[i] || '';
                    return (
                      <div key={i} className="pg-touch-row">
                        <b>{i + 1}</b>
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={'pg-touch-opt' + (val === opt ? ' on' : '')}
                            onClick={() => {
                              const next = [...parsed.p1];
                              next[i] = val === opt ? '' : opt;
                              setCur({ p1: keyToTextP1(next.slice(0, counts.p1)) });
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {counts.p2 > 0 && (
              <div>
                <h4 style={{ margin: '0.6rem 0 0.45rem' }}>Phần II ({counts.p2} câu Đúng / Sai)</h4>
                <div className="pg-p2grid">
                  {Array.from({ length: counts.p2 }, (_, q) => (
                    <div key={q} className="pg-p2cell">
                      <b>Câu {q + 1}</b>
                      {[0, 1, 2, 3].map((yi) => {
                        const val = parsed.p2[q]?.[yi] || '';
                        return (
                          <div key={yi} className="pg-touch-p2item">
                            <span>{'abcd'[yi]}</span>
                            {[['D', 'Đ'], ['S', 'S']].map(([codeCh, lbl]) => (
                              <button
                                key={codeCh}
                                type="button"
                                className={'pg-touch-opt sm' + (val === codeCh ? ' on' : '')}
                                onClick={() => {
                                  const next = parsed.p2.map((r) => [...r]);
                                  if (!next[q]) next[q] = ['', '', '', ''];
                                  next[q][yi] = val === codeCh ? '' : codeCh;
                                  setCur({ p2: keyToTextP2(next.slice(0, counts.p2)) });
                                }}
                              >
                                {lbl}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {counts.p3 > 0 && (
              <div>
                <h4 style={{ margin: '0.6rem 0 0.45rem' }}>Phần III ({counts.p3} câu trả lời ngắn — dùng dấu <code>|</code> cho nhiều đáp án)</h4>
                <div className="pg-p3grid">
                  {Array.from({ length: counts.p3 }, (_, q) => {
                    const rawP3Lines = String(cur.p3 || '').split(/\r?\n/);
                    const lineVal = rawP3Lines[q] ?? '';
                    return (
                      <label key={q} className="pg-field">
                        <span>Câu {q + 1}</span>
                        <input
                          value={lineVal}
                          placeholder="VD: -1,5|-1.5"
                          onChange={(e) => {
                            const nextLines = Array.from(
                              { length: Math.max(counts.p3, rawP3Lines.length) },
                              (_v, idx) => rawP3Lines[idx] ?? ''
                            );
                            nextLines[q] = e.target.value.replace(/[\r\n]/g, '');
                            setCur({ p3: nextLines.slice(0, counts.p3).join('\n') });
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}

        {missing.length > 0 && (
          <p className="pg-warn">
            <IcoWarn size={14} /> Mã {active}: {missing.join('; ')}. Câu chưa có đáp án sẽ không được tính điểm.
          </p>
        )}
      </section>

      <OmrCameraModal
        open={keyScanOpen}
        mode="key"
        onClose={() => setKeyScanOpen(false)}
        paper={{ title: title || 'Quét phiếu đáp án chuẩn' }}
        codeList={codes}
        counts={counts}
        scoring={scoring}
        vipUnlocked
        omrRemaining={Infinity}
        onKeyCaptured={applyScannedKeyResult}
      />

      <section className="pg-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3>4. Danh sách SBD &amp; Họ tên học sinh (Tùy chọn)</h3>
          {cls?.members?.length > 0 && (
            <button
              type="button"
              className="vt-btn sm"
              onClick={() => {
                const gen = autoGenerateSbdRoster(cls.members);
                setRosterText(gen.text);
                say?.(`Đã tự động cấp SBD cho ${gen.count} học sinh lớp ${cls.name}!`);
              }}
            >
              Tự đánh SBD cả lớp ({cls.members.length} HS)
            </button>
          )}
        </div>
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
  paper, classInfo, onBack, onEditSetup, onOpenAnalytics, onPrintSheet, onPaperChange = null, say,
  vipUnlocked = true, omrUsed = 0, omrRemaining = Infinity, maxOmrTrial = FREE_TEACHER_LIMITS.maxOmrTrialSheets,
  onOmrUsed = null, onRequestUpgrade = null,
}) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all'); // all | review | nomatch
  const [gradeSearch, setGradeSearch] = useState('');
  const [gradeSort, setGradeSort] = useState('sbd'); // sbd | score_desc | score_asc
  const fileRef = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Live Camera Scanner State
  const [cameraOpen, setCameraOpen] = useState(false);

  const keys = useMemo(() => {
    const out = {};
    Object.entries(paper.keys || {}).forEach(([c, k]) => { out[c] = keyFromStored(k); });
    return out;
  }, [paper.keys]);
  const codeList = useMemo(() => Object.keys(keys), [keys]);
  const members = useMemo(() => classInfo?.members || [], [classInfo?.members]);
  const counts = useMemo(() => ({ ...DEFAULT_COUNTS, ...(paper.counts || {}) }), [paper.counts]);
  const scoring = useMemo(() => ({ ...DEFAULT_SCORING, ...(paper.scoring || {}) }), [paper.scoring]);

  const regrade = useCallback((it) => {
    const key = keys[it.code];
    const grade = key ? gradeSheet(it.read, key, counts, scoring) : null;
    return { ...it, grade };
  }, [keys, counts, scoring]);

  /* Tôn trọng studentManual; chỉ tự ghép khi chưa gán thủ công */
  const matchStudent = useCallback((it) => {
    if (it.studentManual) return it;
    const s = paper.sbdMap?.[it.sbd];
    if (s) return { ...it, studentId: s.id || null, studentName: s.name || '' };
    if (it.studentId) return it;
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

  const triggerOmrVipUpgrade = useCallback((customMsg) => {
    const msg = customMsg || `Bạn đã dùng hết ${maxOmrTrial} phiếu chấm OMR thử nghiệm miễn phí. Nâng cấp Giáo viên VIP (${TEACHER_VIP_PRICE_TEXT}/năm) để chấm không giới hạn!`;
    say(msg, 'error');
    onRequestUpgrade?.(msg);
  }, [maxOmrTrial, onRequestUpgrade, say]);

  // Xử lý nạp nhiều file ảnh
  const processFiles = async (files) => {
    let list = [...files].filter((f) => f.type.startsWith('image/'));
    if (!list.length) { say('Chỉ nhận file ảnh (JPG, PNG…).', 'error'); return; }
    if (!codeList.length) { say('Bài chấm chưa có đáp án.', 'error'); return; }
    if (!vipUnlocked) {
      if (omrRemaining <= 0) {
        if (fileRef.current) fileRef.current.value = '';
        triggerOmrVipUpgrade();
        return;
      }
      if (list.length > omrRemaining) {
        list = list.slice(0, omrRemaining);
        say(`Gói Free chỉ còn ${omrRemaining}/${maxOmrTrial} phiếu OMR miễn phí — chỉ quét ${omrRemaining} ảnh đầu.`, 'warning');
      }
    }
    setBusy(true);
    setProgress({ done: 0, total: list.length });
    sound.ding();
    let successReads = 0;

    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const id = nextId();
      const url = URL.createObjectURL(f);
      let item;
      try {
         const img = await fileToImageData(f);
         await tick();
         const r = readSheet(img);
         /* Đo chất lượng trực tiếp trên vùng tờ giấy A4 đã định vị (bỏ lề bàn tối làm sai lệch độ nét/sáng) */
         const paperBox = r.ok ? paperRegionFromCorners(img.width, img.height, r.quality?.cornersNorm) : null;
         const imgQ = measureImageQuality(img, IMG_LIMITS, paperBox);
        if (!r.ok) {
          item = { id, fileName: f.name, url, status: 'error', error: r.error, sbd: '', code: '', read: null, issues: [], needsReview: true };
        } else {
          successReads += 1;
          let code = r.code;
          if (!keys[code] && codeList.length === 1) code = codeList[0];
          const codeKnown = !!keys[code];
          const warnMsg = r.quality?.warn || (!imgQ.ok ? imgQ.issues[0] || 'Chất lượng ảnh chưa đạt chuẩn.' : null);
          item = {
             id, fileName: f.name, url, status: 'done', sbd: r.sbd, code, readCode: r.code,
             read: { p1: r.p1, p2: r.p2, p3: r.p3 },
             issues: [...(r.issues || []), ...imgQ.issues],
             quality: { ...(r.quality || {}), image: imgQ, warn: warnMsg },
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
    if (!vipUnlocked && successReads > 0) {
      onOmrUsed?.(successReads);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
    sound.cheer();
    say(`Đã xử lý xong ${list.length} ảnh!`);
  };

  /* ============ CAMERA LIVE SCANNER ============ */
  const startCamera = () => {
    if (!vipUnlocked && omrRemaining <= 0) {
      triggerOmrVipUpgrade();
      return;
    }
    sound.ding?.();
    setCameraOpen(true);
  };

  const stopCamera = useCallback(() => {
    setCameraOpen(false);
  }, []);

  const handleCameraScanned = useCallback(({ item, codeKnown }) => {
    setItems((cur) => [...cur, item]);
    if (codeKnown) sound.cheer?.();
    else sound.wrong?.();

    if (!vipUnlocked) {
      const leftAfter = Math.max(0, omrRemaining - 1);
      onOmrUsed?.(1);
      if (leftAfter === 0) {
        setTimeout(() => setCameraOpen(false), 950);
      }
    }
  }, [vipUnlocked, omrRemaining, onOmrUsed]);

  /* Đánh dấu studentManual khi sửa tên HS; khi sửa SBD thì cho phép tự khớp lại sbdMap */
  const updateItem = useCallback((id, patch) => {
    setItems((cur) => cur.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, ...patch };
      if ('studentId' in patch || 'studentName' in patch) {
        next.studentManual = true;
      } else if ('sbd' in patch) {
        const matched = paper.sbdMap?.[patch.sbd];
        if (matched) {
          next.studentId = matched.id || null;
          next.studentName = matched.name || '';
          next.studentManual = false;
        }
      }
      if ('read' in patch || 'code' in patch || 'sbd' in patch || 'studentId' in patch || 'studentName' in patch) {
        next.edited = true;
      }
      return next;
    }));
  }, [paper.sbdMap]);

  const removeItem = (id) => {
    const removed = itemsRef.current.find((c) => c.id === id);
    if (!removed) return;
    setItems((cur) => cur.filter((c) => c.id !== id));
    if (editId === id) setEditId(null);
    if (removed.saved && paper?.id && removed.id) {
      deletePaperResult(paper.id, removed.id).catch((e) => say(`Lỗi xóa khỏi đám mây: ${e.message}`, 'error'));
    }
    say(`Đã bỏ phiếu SBD ${removed.sbd || removed.fileName}`, 'warn', {
      undoLabel: 'Hoàn tác',
      onUndo: () => {
        setItems((cur) => [...cur, removed]);
        if (removed.saved && paper?.id && removed.read) {
          savePaperResults(paper.id, [{
            id: removed.id,
            sbd: removed.sbd,
            code: removed.code,
            studentId: removed.studentId,
            studentName: removed.studentName,
            p1: removed.read.p1,
            p2: removed.read.p2,
            p3: removed.read.p3,
            grade: removed.grade,
            needsReview: removed.needsReview,
            fileName: removed.fileName,
          }]).catch(() => {});
        }
        say('Đã khôi phục phiếu vào danh sách');
      },
    });
  };

  const visible = graded.filter((it) => {
    if (filter === 'review' && !it.needsReview) return false;
    if (filter === 'nomatch' && it.studentName) return false;
    const q = gradeSearch.trim().toLowerCase();
    if (!q) return true;
    return String(it.sbd || '').toLowerCase().includes(q)
      || String(it.studentName || '').toLowerCase().includes(q)
      || String(it.code || '').toLowerCase().includes(q);
  });

  const shownRows = useMemo(() => {
    const arr = visible.slice();
    if (gradeSort === 'score_desc') {
      arr.sort((a, b) => (b.grade?.score10 ?? -1) - (a.grade?.score10 ?? -1));
    } else if (gradeSort === 'score_asc') {
      arr.sort((a, b) => (a.grade?.score10 ?? 99) - (b.grade?.score10 ?? 99));
    } else {
      arr.sort((a, b) => String(a.sbd || '').localeCompare(String(b.sbd || '')));
    }
    return arr;
  }, [visible, gradeSort]);

  const handlePrintReport = () => {
    if (!okRows.length) return;
    try {
      dispatchPrintDocument(buildScoreReportPrintHtml({ paper, results: graded, classInfo }));
      say('Đã mở cửa sổ In / Lưu PDF Bảng Điểm A4!');
    } catch (e) {
      say(e?.message || 'Không mở được bản in bảng điểm.', 'error');
    }
  };

  const okRows = useMemo(() => graded.filter((it) => it.status === 'done' && it.grade), [graded]);
  const errorRowsCount = useMemo(() => graded.filter((it) => it.status === 'error').length, [graded]);
  const unsavedCount = useMemo(() => okRows.filter((r) => !r.saved || r.edited).length, [okRows]);

  // Cảnh báo nếu giáo viên đóng tab / reload khi còn phiếu chưa lưu lên Cloud
  useEffect(() => {
    if (unsavedCount <= 0) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [unsavedCount]);

  const handleSafeBack = () => {
    if (unsavedCount > 0 && !window.confirm(`Bạn còn ${unsavedCount} phiếu chưa lưu lên Cloud. Rời trang sẽ mất các phiếu này — vẫn quay lại danh sách?`)) {
      return;
    }
    onBack();
  };

  const handleClearErrors = () => {
    setItems((cur) => cur.filter((c) => c.status !== 'error'));
    say(`Đã xóa ${errorRowsCount} phiếu lỗi khỏi danh sách.`, 'info');
  };

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
      clientId: r.id,
      id: r.saved ? r.id : null,
      sbd: r.sbd, code: r.code, studentId: r.studentId, studentName: r.studentName,
      p1: r.read.p1, p2: r.read.p2, p3: r.read.p3, grade: r.grade, needsReview: r.needsReview, fileName: r.fileName,
    }));
    const res = await savePaperResults(paper.id, mappedItems);

    // Tự động đồng bộ điểm vào Lớp học (Firestore submissions) nếu bài đã gán lớp
    let syncError = null;
    if (res.ok && paper.classId) {
      const syncRes = await syncPaperResultsToSubmissions(paper, mappedItems).catch((err) => ({
        ok: false,
        error: err?.message || 'Lỗi đồng bộ lớp học',
      }));
      if (syncRes && !syncRes.ok) {
        syncError = syncRes.error;
        console.warn('[PaperGrading] syncPaperResultsToSubmissions warning:', syncError);
      }
    }

    // Cập nhật thống kê tóm tắt trên document bài chấm (hiển thị ở Danh sách & tính lượt dùng thử)
    if (res.ok) {
      const idMap = res.idMap || {};
      const nextStats = {
        count: okRows.length,
        avg: stats.avg != null ? round2(stats.avg) : null,
      };
      updatePaperExam(paper.id, { stats: nextStats }).catch(() => {});
      onPaperChange?.({ stats: nextStats });
      setItems((cur) => cur.map((c) => {
        if (!toSave.some((s) => s.id === c.id)) return c;
        const realId = idMap[c.id] || c.id;
        return { ...c, id: realId, saved: true, edited: false };
      }));
      if (editId && idMap[editId]) setEditId(idMap[editId]);
    }

    setSaving(false);
    if (res.ok) {
      if (syncError) {
        say(`Đã lưu ${res.saved} bài chấm, nhưng đồng bộ Lớp học thất bại: ${syncError}`, 'warning');
      } else {
        say(`Đã lưu thành công ${res.saved} bài chấm${paper.classId ? ' và đồng bộ vào Lớp học' : ''}!`);
      }
    } else {
      say(res.error, 'error');
    }
  };

  const handleExport = async () => {
    if (!vipUnlocked) {
      triggerOmrVipUpgrade(`Xuất bảng điểm chấm phiếu OMR ra Excel (.xlsx) thuộc gói Giáo viên VIP (${TEACHER_VIP_PRICE_TEXT}/năm).`);
      return;
    }
    if (!okRows.length) return;
    try {
      const sortedOk = okRows.slice().sort((a, b) => String(a.sbd).localeCompare(String(b.sbd)));
      const rawRows = resultsToRows(sortedOk, paper);
      const headers = rawRows[0] || ['SBD', 'Họ và tên', 'Mã đề', 'Thang 10'];
      const body = rawRows.slice(1);
      const cols = headers.map((h, idx) => {
        const lower = String(h || '').toLowerCase();
        const isTen = lower.includes('thang 10') || lower.includes('điểm') || lower.includes('diem');
        return {
          header: String(h || `Cột ${idx + 1}`),
          key: `c${idx}`,
          align: lower.includes('tên') || lower.includes('ghi chú') ? 'left' : 'center',
          isScore10: isTen && !lower.includes('tổng'),
          numFmt: isTen ? '0.0' : undefined,
        };
      });
      const mappedRows = body.map((r) => {
        const obj = {};
        headers.forEach((_h, idx) => {
          const val = r[idx];
          const num = Number(val);
          obj[`c${idx}`] = cols[idx].numFmt && val !== '' && !Number.isNaN(num) ? num : val;
        });
        return obj;
      });
      const safe = (paper.title || 'cham-phieu').replace(/[^\p{L}\p{N}]+/gu, '-');
      await exportStyledWorkbook({
        filename: `ket-qua-cham-phieu-${safe}.xlsx`,
        mascot: 'celebrate',
        sheets: [{
          name: 'Kết quả Chấm phiếu',
          mascot: 'celebrate',
          title: `KẾT QUẢ CHẤM PHIẾU TRẮC NGHIỆM A4 — ${(paper.title || '').toUpperCase()}`,
          subtitle: `Đã chấm ${sortedOk.length} phiếu · Điểm TB: ${fmt(stats.avg)}/10 · Cao nhất: ${fmt(stats.max)} · Thấp nhất: ${fmt(stats.min)}`,
          columns: cols,
          rows: mappedRows,
        }],
      });
      say('Đã xuất bảng điểm chấm phiếu Excel (.xlsx)');
    } catch (e) {
      say(e?.message || 'Không xuất được file Excel', 'error');
    }
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
          <button type="button" className="vt-btn sm" onClick={handleSafeBack}>Danh sách</button>
          <button type="button" className="vt-btn sm" onClick={() => onOpenAnalytics(okRows)}>
            <IcoChart size={13} /> Phổ điểm &amp; Phân tích
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
      {!vipUnlocked && omrRemaining <= 0 ? (
        <div style={{ margin: '0.75rem 0' }}>
          <TeacherVipLock
            compact
            title={`Đã dùng hết ${omrUsed}/${maxOmrTrial} phiếu chấm OMR miễn phí`}
            quotaText="Hết lượt dùng thử Free"
            description="Nâng cấp Giáo viên VIP để quét Camera & tải ảnh chấm OMR không giới hạn, kèm xuất Excel và Phổ điểm AI."
            onUpgrade={onRequestUpgrade}
          />
        </div>
      ) : null}

      <div
        className={'pg-drop' + (dragging ? ' dragging' : '')}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget)) return;
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          if (e.dataTransfer?.files?.length) {
            processFiles(e.dataTransfer.files);
          }
        }}
      >
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => processFiles(e.target.files)} />
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="vt-btn primary"
            onClick={startCamera}
            disabled={!vipUnlocked && omrRemaining <= 0}
          >
            <IcoCamera size={15} /> Mở Camera Chấm Trực Tiếp
          </button>
          <button
            type="button"
            className="vt-btn"
            onClick={() => {
              if (!vipUnlocked && omrRemaining <= 0) { triggerOmrVipUpgrade(); return; }
              fileRef.current?.click();
            }}
            disabled={busy || (!vipUnlocked && omrRemaining <= 0)}
          >
            <IcoScan size={15} /> {busy ? `Đang đọc ${progress.done}/${progress.total}…` : 'Tải / Chụp Ảnh Phiếu'}
          </button>
          {!vipUnlocked && (
            <span className={'pg-quota-pill' + (omrRemaining > 0 ? '' : ' exhausted')}>
              {omrRemaining > 0
                ? `Dùng thử Free: còn ${omrRemaining}/${maxOmrTrial} phiếu`
                : `Đã dùng hết ${omrUsed}/${maxOmrTrial} phiếu Free`}
            </span>
          )}
        </div>
        <span className="pg-note">
          {dragging
            ? 'Thả ảnh phiếu vào đây để tự động nhận dạng & chấm ngay…'
            : 'Kéo thả nhiều ảnh phiếu vào đây, chọn file ảnh hoặc dùng Camera trực tiếp. Xử lý 100% trên thiết bị.'}
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
              <input
                type="search"
                className="pg-mini-input"
                value={gradeSearch}
                onChange={(e) => setGradeSearch(e.target.value)}
                placeholder="Tìm SBD, họ tên, mã…"
                aria-label="Tìm học sinh theo SBD, họ tên hoặc mã đề"
              />
              <select
                className="pg-mini-input"
                value={gradeSort}
                onChange={(e) => setGradeSort(e.target.value)}
                aria-label="Sắp xếp bảng điểm"
              >
                <option value="sbd">Xếp theo SBD</option>
                <option value="score_desc">Điểm cao → thấp</option>
                <option value="score_asc">Điểm thấp → cao</option>
              </select>
            </div>
            <div className="pg-head-actions">
              {errorRowsCount > 0 && (
                <button type="button" className="vt-btn sm danger" onClick={handleClearErrors}>
                  <IcoTrash size={13} /> Xóa {errorRowsCount} phiếu lỗi
                </button>
              )}
              <button type="button" className="vt-btn sm" onClick={handlePrintReport} disabled={!okRows.length}>
                <IcoPrint size={13} /> In / PDF Bảng điểm
              </button>
              <button type="button" className="vt-btn sm" onClick={handleExport} disabled={!okRows.length}>
                <IcoDownload size={13} /> Xuất Excel (.xlsx)
              </button>
              <button type="button" className="vt-btn sm primary" onClick={handleSave} disabled={saving || !okRows.length}>
                <IcoCheck size={13} /> {saving ? 'Đang lưu…' : unsavedCount > 0 ? `Lưu Cloud (${unsavedCount})` : 'Đã lưu Cloud'}
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
                {shownRows.map((it) => (
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

      {/* MODAL SHEET EDITOR: ĐỐI CHIẾU ẢNH THẬT + LỚP PHỦ XANH/ĐỎ KIỂU TNMAKER */}
      {editing && (() => {
        const navPool = shownRows.filter((r) => r.status !== 'error');
        const curIdx = navPool.findIndex((r) => r.id === editing.id);
        return (
          <SheetEditor
            item={editing}
            codes={codeList}
            members={members}
            counts={counts}
            navInfo={curIdx >= 0 ? { index: curIdx, total: navPool.length } : null}
            onNavigate={(delta) => {
              if (curIdx < 0 || !navPool.length) return;
              const nextIdx = (curIdx + delta + navPool.length) % navPool.length;
              setEditId(navPool[nextIdx].id);
            }}
            onChange={(patch) => updateItem(editing.id, patch)}
            onApprove={() => updateItem(editing.id, { needsReview: false, edited: true })}
            onClose={() => setEditId(null)}
          />
        );
      })()}

      {/* MODAL CAMERA CHẤM PHIẾU A4 THEO ĐỀ */}
      <OmrCameraModal
        open={cameraOpen}
        onClose={stopCamera}
        paper={paper}
        keys={keys}
        codeList={codeList}
        counts={counts}
        scoring={scoring}
        vipUnlocked={vipUnlocked}
        omrRemaining={omrRemaining}
        scannedCount={items.length}
        onScanned={handleCameraScanned}
        onRemoveItem={removeItem}
        onEditItem={(id) => setEditId(id)}
        onQuotaExhausted={() => {
          stopCamera();
          triggerOmrVipUpgrade();
        }}
      />
    </div>
  );
}

/* ============================================================
   SUB-COMPONENT: TRÌNH SỬA PHIẾU CHI TIẾT (SHEET EDITOR)
   ============================================================ */
function SheetEditor({ item, codes, members, counts, navInfo = null, onNavigate = null, onChange, onApprove, onClose }) {
  const [imgZoom, setImgZoom] = useState(1);
  const [imgRotate, setImgRotate] = useState(0);
  const [imgSize, setImgSize] = useState(() => (
    item.quality?.image?.width && item.quality?.image?.height
      ? { width: item.quality.image.width, height: item.quality.image.height }
      : null
  ));
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    setImgZoom(1);
    setImgRotate(0);
    setImgSize(
      item.quality?.image?.width && item.quality?.image?.height
        ? { width: item.quality.image.width, height: item.quality.image.height }
        : null
    );
  }, [item.id, item.quality?.image?.width, item.quality?.image?.height]);

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

  const hasP1Sus = useMemo(
    () => Array.from({ length: counts.p1 }, (_, q) => issueAt((x) => x.part === 'p1' && x.q === q + 1)).some(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counts.p1, item.issues]
  );
  const hasP2Sus = useMemo(
    () => Array.from({ length: counts.p2 }, (_, q) => [0, 1, 2, 3].some((y) => issueAt((x) => x.part === 'p2' && x.q === q + 1 && x.y === 'abcd'[y]))).some(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counts.p2, item.issues]
  );
  const hasP3Sus = useMemo(
    () => Array.from({ length: counts.p3 }, (_, q) => issueAt((x) => x.part === 'p3' && x.q === q + 1)).some(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counts.p3, item.issues]
  );

  const warnText = typeof item.quality?.warn === 'string' && item.quality.warn.trim()
    ? item.quality.warn
    : (item.quality?.warn ? (item.quality?.image?.issues?.[0] || 'Chất lượng ảnh hoặc căn chỉnh phiếu có thể chưa chuẩn — hãy đối chiếu kỹ.') : '');

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

        <div className={'pg-ed-body' + (!item.url ? ' no-img' : '')}>
          {item.url && (
            <div className="pg-ed-img">
              <div className="pg-ed-img-bar">
                {item.quality?.cornersNorm && item.grade && (
                  <button
                    type="button"
                    className={'vt-btn sm' + (showOverlay ? ' primary' : '')}
                    onClick={() => setShowOverlay((v) => !v)}
                    title="Hiện / ẩn vòng tròn xanh-đỏ đối chiếu đáp án trên ảnh phiếu"
                  >
                    {showOverlay ? 'Đang phủ Đúng/Sai' : 'Hiện Đúng/Sai'}
                  </button>
                )}
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
              <div className="pg-ed-img-viewport">
                <div
                  className="pg-ed-img-stage"
                  style={{
                    width: `${Math.round(imgZoom * 100)}%`,
                    transform: imgRotate ? `rotate(${imgRotate}deg)` : undefined,
                  }}
                >
                  <img
                    src={item.url}
                    alt={`Ảnh phiếu ${item.fileName}`}
                    onLoad={(e) => {
                      const nw = e.currentTarget.naturalWidth;
                      const nh = e.currentTarget.naturalHeight;
                      if (nw > 0 && nh > 0) setImgSize({ width: nw, height: nh });
                    }}
                  />
                  {showOverlay && item.quality?.cornersNorm && item.grade && (
                    <SheetAnswerOverlay
                      grade={item.grade}
                      cornersNorm={item.quality.cornersNorm}
                      counts={counts}
                      imgSize={imgSize}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="pg-ed-form">
            {warnText && <p className="pg-warn"><IcoWarn size={14} /> {warnText}</p>}
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

              {members.length > 0 && (
                <label className="pg-field">
                  <span>Ghép học sinh của lớp</span>
                  <select
                    value={item.studentId || ''}
                    onChange={(e) => {
                      const m = members.find((x) => x.id === e.target.value);
                      onChange({ studentId: m?.id || null, studentName: m?.name || '' });
                    }}
                  >
                    <option value="">-- Nhập tay / Chưa ghép lớp --</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </label>
              )}

              <label className="pg-field">
                <span>Họ và tên thí sinh</span>
                <input
                  value={item.studentName || ''}
                  onChange={(e) => onChange({ studentName: e.target.value, studentId: item.studentId || null })}
                  placeholder="Gõ tên học sinh nếu chưa có trong lớp…"
                />
              </label>
            </div>

            {counts.p1 > 0 && (!onlySuspicious || hasP1Sus) && (
              <>
                <h4>Phần I: Trắc nghiệm ({counts.p1} câu)</h4>
                <div className="pg-p1grid">
                  {Array.from({ length: counts.p1 }, (_, q) => {
                    const sus = issueAt((x) => x.part === 'p1' && x.q === q + 1);
                    if (onlySuspicious && !sus) return null;
                    const detail = item.grade?.detail?.p1?.[q];
                    const tone = sus ? 'sus' : detail?.ok === true ? 'ok' : detail?.ok === false ? 'bad' : '';
                    return (
                      <label
                        key={q}
                        className={'pg-p1cell' + (tone ? ` ${tone}` : '')}
                        title={detail?.key ? `Đáp án chuẩn: ${detail.key}` : undefined}
                      >
                        <span>{q + 1}</span>
                        <select value={read.p1?.[q] || ''} onChange={(e) => setP1(q, e.target.value)}>
                          <option value="">—</option>
                          {['A', 'B', 'C', 'D'].map((c) => <option key={c} value={c}>{c}</option>)}
                          {read.p1?.[q] === '*' && <option value="*">* (Tô đúp)</option>}
                        </select>
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            {counts.p2 > 0 && (!onlySuspicious || hasP2Sus) && (
              <>
                <h4>Phần II: Đúng / Sai ({counts.p2} câu)</h4>
                <div className="pg-p2grid">
                  {Array.from({ length: counts.p2 }, (_, q) => {
                    const p2Sus = [0, 1, 2, 3].some((y) => issueAt((x) => x.part === 'p2' && x.q === q + 1 && x.y === 'abcd'[y]));
                    if (onlySuspicious && !p2Sus) return null;
                    return (
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
                              {read.p2?.[q]?.[y] === '*' && <option value="*">* (Tô đúp)</option>}
                            </select>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {counts.p3 > 0 && (!onlySuspicious || hasP3Sus) && (
              <>
                <h4>Phần III: Trả lời ngắn ({counts.p3} câu)</h4>
                <div className="pg-p3grid">
                  {Array.from({ length: counts.p3 }, (_, q) => {
                    const p3Sus = issueAt((x) => x.part === 'p3' && x.q === q + 1);
                    if (onlySuspicious && !p3Sus) return null;
                    return (
                      <label key={q} className={'pg-field' + (p3Sus ? ' sus' : '')}>
                        <span>Câu {q + 1}</span>
                        <input
                          value={read.p3?.[q] || ''}
                          maxLength={6}
                          onChange={(e) => setP3(q, e.target.value.replace(/[^\d,.\-?]/g, ''))}
                        />
                      </label>
                    );
                  })}
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

        <footer className="pg-foot" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            {navInfo && navInfo.total > 1 && onNavigate && (
              <>
                <button type="button" className="vt-btn sm" onClick={() => onNavigate(-1)}>← Trước</button>
                <span className="pg-note" style={{ fontWeight: 700 }}>{navInfo.index + 1} / {navInfo.total}</span>
                <button type="button" className="vt-btn sm" onClick={() => onNavigate(1)}>Sau →</button>
              </>
            )}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {item.needsReview && (
              <button type="button" className="vt-btn" onClick={onApprove}>
                <IcoCheck size={14} /> Xác nhận không còn nghi ngờ
              </button>
            )}
            <button type="button" className="vt-btn primary" onClick={onClose}>
              Xong &amp; Đóng
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENT: PHÂN TÍCH PHỔ ĐIỂM & CHẨN ĐOÁN LỚP HỌC
   ============================================================ */
function PaperAnalyticsView({ exam, liveResults = null, backLabel = '← Quay lại chấm bài', onBack, say }) {
  const [cloudResults, setCloudResults] = useState([]);
  const [loading, setLoading] = useState(!liveResults?.length);

  const hasLive = Array.isArray(liveResults) && liveResults.length > 0;
  const unsavedInLive = useMemo(
    () => (hasLive ? liveResults.filter((r) => !r.saved || r.edited).length : 0),
    [hasLive, liveResults]
  );

  useEffect(() => {
    if (hasLive) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await listPaperResults(exam.id);
        if (alive) setCloudResults(list);
      } catch (e) {
        if (alive) say(e.message, 'error');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [exam.id, hasLive, say]);

  const effectiveResults = hasLive ? liveResults : cloudResults;
  const stats = useMemo(
    () => computePaperAnalytics(effectiveResults, exam.counts),
    [effectiveResults, exam.counts]
  );

  if (loading) return <div className="vt-loading"><p>Đang tổng hợp dữ liệu phổ điểm...</p></div>;
  if (!stats) return (
    <div className="pg-empty">
      <h3>Chưa có dữ liệu phổ điểm</h3>
      <p>Cần ít nhất 1 bài thi đã chấm (và lưu lên Cloud nếu mở từ Danh sách) để phân tích phổ điểm!</p>
      <button type="button" className="vt-btn primary" onClick={onBack}>{backLabel}</button>
    </div>
  );

  const maxBinCount = Math.max(...stats.bins.map((b) => b.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header className="pg-head">
        <div>
          <h2><IcoChart size={22} /> Phổ Điểm &amp; Chẩn Đoán Lớp Học</h2>
          <p>
            {exam.title} · Tổng số bài phân tích: <b>{stats.count}</b> học sinh
            {unsavedInLive > 0 && (
              <span className="pg-tag warn" style={{ marginLeft: '0.5rem' }}>
                Đang gồm {unsavedInLive} phiếu chưa lưu Cloud
              </span>
            )}
          </p>
        </div>
        <button type="button" className="vt-btn sm" onClick={onBack}>
          {backLabel}
        </button>
      </header>

      {/* Grid chỉ số then chốt */}
      <div className="pg-analytics-grid">
        <div className="pg-block">
          <span className="pg-kpi-lbl">ĐIỂM TRUNG BÌNH</span>
          <strong className="pg-kpi-val primary">{fmt(stats.avg)}</strong>
          <small className="pg-note">Trung vị: {fmt(stats.median)} · Độ lệch chuẩn: {fmt(stats.stdDev)}</small>
        </div>
        <div className="pg-block">
          <span className="pg-kpi-lbl">TỶ LỆ ĐẠT (≥ 5,0)</span>
          <strong className="pg-kpi-val ok">{stats.passRate}%</strong>
          <small className="pg-note">Học sinh khá giỏi (≥ 8,0): {stats.goodRate}%</small>
        </div>
        <div className="pg-block">
          <span className="pg-kpi-lbl">CAO NHẤT / THẤP NHẤT</span>
          <strong className="pg-kpi-val warn">{fmt(stats.max)} / {fmt(stats.min)}</strong>
          <small className="pg-note">Khoảng biến thiên: {fmt(round2(stats.max - stats.min))} điểm</small>
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
          <div className="pg-hard-list">
            {stats.hardestP1.map((q) => (
              <div key={q.q} className="pg-hard-row">
                <span><strong>Câu {q.q}</strong></span>
                <span className="pg-hard-rate">
                  Tỷ lệ làm đúng: {q.correctRate}% ({q.correctCount}/{q.totalAnswered} học sinh)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phân tích Phần II & Phần III (GDPT 2025) */}
      {(stats.p2Questions?.length > 0 || stats.p3Questions?.length > 0) && (
        <div className="pg-analytics-grid">
          {stats.p2Questions?.length > 0 && (
            <div className="pg-block">
              <h3>Phần II — Đúng / Sai ({stats.p2Questions.length} câu)</h3>
              <div className="pg-hard-list">
                {stats.p2Questions.map((q) => (
                  <div key={q.q} className="pg-hard-row">
                    <span><strong>Câu {q.q}</strong></span>
                    <span className="pg-note">
                      TB <b>{fmt(q.avgRight)}/4</b> ý · Đạt tối đa 4/4: <b>{q.fullRate}%</b> ({q.fullCount}/{q.totalAnswered})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.p3Questions?.length > 0 && (
            <div className="pg-block">
              <h3>Phần III — Trả lời ngắn ({stats.p3Questions.length} câu)</h3>
              <div className="pg-hard-list">
                {stats.p3Questions.map((q) => (
                  <div key={q.q} className="pg-hard-row">
                    <span><strong>Câu {q.q}</strong></span>
                    <span className={q.correctRate < 50 ? 'pg-hard-rate' : 'pg-ok-rate'}>
                      Đúng {q.correctRate}% ({q.correctCount}/{q.totalAnswered} HS)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bảng Phân Tích Chất Lượng Câu Hỏi Chuẩn IRT / CTT (Độ khó p · Độ phân cách D) */}
      {stats.itemQualityList && stats.itemQualityList.length > 0 && (
        <div className="pg-block">
          <h3>Phân Tích Chất Lượng Câu Hỏi Phần I (Độ khó p &amp; Độ phân cách D)</h3>
          <p className="pg-note">
            Độ khó <strong>p ∈ [0; 1]</strong> (tỷ lệ làm đúng) · Độ phân cách <strong>D = P_nhóm_cao(27%) − P_nhóm_thấp(27%)</strong>
            {stats.count < 2
              ? ' (cần tối thiểu 2 bài chấm để tính chính xác độ phân cách D).'
              : ' (D ≥ 0,30 là câu phân hóa tốt; D < 0,15 cần rà soát lại mồi nhử hoặc đáp án).'}
          </p>
          <div className="pg-q-grid">
            {stats.itemQualityList.map((item) => (
              <div key={item.q} className={`pg-q-card tone-${item.qualityTone}`}>
                <div className="pg-q-card-top">
                  <strong>Câu {item.q}</strong>
                  <span className={`pg-q-badge tone-${item.qualityTone}`}>
                    {item.qualityLabel}
                  </span>
                </div>
                <div className="pg-q-card-metrics">
                  <span>Độ khó p = {fmt(item.pIndex)}</span>
                  <span className="pg-q-disc">
                    {stats.count >= 2 ? `Phân cách D = ${fmt(item.dIndex)}` : 'D: cần ≥ 2 bài'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chẩn đoán & Gợi ý sư phạm tự động theo số liệu */}
      <div className="pg-block pg-diag-box">
        <h3 className="pg-diag-title">
          <IcoSpark size={18} /> Chẩn đoán &amp; Gợi ý ôn tập theo phổ điểm
        </h3>
        <p className="pg-diag-copy">
          Điểm trung bình của <strong>{stats.count}</strong> bài đạt <strong>{fmt(stats.avg)}/10</strong> (trung vị <strong>{fmt(stats.median)}</strong>, độ lệch chuẩn <strong>{fmt(stats.stdDev)}</strong>), tỷ lệ đạt từ 5,0 là <strong>{stats.passRate}%</strong> và mức khá giỏi (≥ 8,0) đạt <strong>{stats.goodRate}%</strong>.
          {stats.hardestP1?.length > 0 && (
            <> Ở Phần I, học sinh mất điểm nhiều nhất tại <strong>{stats.hardestP1.slice(0, 3).map((x) => `Câu ${x.q} (${x.correctRate}%)`).join(', ')}</strong>.</>
          )}
          {stats.lowDiscP1?.length > 0 && (
            <> Phát hiện <strong>{stats.lowDiscP1.length}</strong> câu có độ phân cách thấp (D &lt; 0,15): <strong>{stats.lowDiscP1.slice(0, 6).map((x) => `Câu ${x.q}`).join(', ')}</strong> — giáo viên nên rà soát lại phương án nhiễu hoặc bảng đáp án.</>
          )}
          {stats.stdDev >= 2.0
            ? ' Phân hóa điểm trong lớp khá rộng — nên tách nhóm phụ đạo cho nhóm dưới 5,0 và giao bài vận dụng cao cho nhóm trên 8,0.'
            : ' Phân bố điểm tương đối đồng đều — có thể ưu tiên chữa nhanh các câu sai trọng tâm chung cho cả lớp.'}
        </p>
      </div>
    </div>
  );
}