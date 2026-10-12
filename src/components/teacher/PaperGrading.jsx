/* ============================================================
   PaperGrading.jsx — Chấm phiếu trả lời trắc nghiệm giấy A4 (OMR)
   NÂNG CẤP TOÀN DIỆN:
   - Live Webcam / Phone Camera Scanner (Chấm liên tục bằng camera)
   - Phổ điểm Histogram & ELEC AI Chẩn đoán kiến thức lớp học
   - Tự động ghép nối SBD với học sinh trong Lớp học
   - Tải / In mẫu phiếu trắc nghiệm A4 chuẩn Bộ GD&ĐT 2025
   - Chuẩn Apple visionOS Studio
   ============================================================ */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { readSheet, fileToImageData } from '../../lib/omr.js';
import {
  DEFAULT_SCORING, DEFAULT_COUNTS, MAX_COUNTS,
  parseKeyP1, parseKeyP2, parseKeyP3, keyToTextP1, keyToTextP2, keyToTextP3,
  keyToStored, keyFromStored, keyP1FromExam, gradeSheet, maxScore, checkKey,
  parseRoster, answersToRead, resultsToRows, round2,
  computePaperAnalytics,
} from '../../lib/paperGrade.js';
import {
  listPaperExams, createPaperExam, updatePaperExam, deletePaperExam,
  listPaperResults, savePaperResults,
} from '../../lib/paperStore.js';
import sound from '../../lib/gameSound.js';
import { downloadCsv } from '../DashShell.jsx';
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
const IcoTrash = (p) => <Svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></Svg>;
const IcoEdit = (p) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>;

const fmt = (n) => (n == null || Number.isNaN(n) ? '—' : String(round2(n)).replace('.', ','));
let uid = 0;
const nextId = () => `pg${Date.now().toString(36)}${(uid++).toString(36)}`;
const tick = () => new Promise((r) => setTimeout(r, 0));

export default function PaperGrading({ classes = [], exams = [] }) {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | setup | grade | analytics
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Live Camera Scanner State
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraFeedback, setCameraFeedback] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const say = useCallback((text, tone = 'success') => {
    setToast({ text, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try { setPapers(await listPaperExams(user.uid)); } catch (e) { say(e.message, 'error'); } finally { setLoading(false); }
  }, [user?.uid, say]);
  useEffect(() => { refresh(); }, [refresh]);

  const classOf = (id) => classes.find((c) => c.id === id) || null;

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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const captureAndScan = async () => {
    const video = videoRef.current;
    if (!video || !current) return;

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const read = readSheet(imgData);

      if (!read.ok) {
        sound.wrong();
        setCameraFeedback({ ok: false, msg: read.error || 'Chưa nhận dạng được vạch định vị. Hãy căn chỉnh phiếu!' });
        return;
      }

      // Đã đọc được phiếu!
      sound.ding();
      const code = read.code || Object.keys(current.keys)[0] || '';
      const key = current.keys[code] || current.keys[Object.keys(current.keys)[0]] || { p1: [], p2: [], p3: [] };
      const grade = gradeSheet(read, key, current.counts, current.scoring);
      const studentName = current.sbdMap?.[read.sbd]?.name || '';

      const newResult = {
        id: nextId(),
        sbd: read.sbd,
        studentName,
        code,
        answers: { p1: read.p1, p2: read.p2, p3: read.p3 },
        grade,
        needsReview: (read.issues && read.issues.length > 0) || !read.sbd || !current.keys[code],
        issues: read.issues || [],
        fileName: `camera_${read.sbd || 'phiếu'}.jpg`,
      };

      // Thêm vào danh sách và lưu
      if (gradeComponentRef.current?.addResult) {
        gradeComponentRef.current.addResult(newResult);
      }

      setCameraFeedback({
        ok: true,
        msg: `✓ SBD: ${read.sbd || '---'} · Mã đề: ${code} · Điểm: ${fmt(grade.score10)}/10`,
      });
      sound.cheer();
    } catch (e) {
      sound.wrong();
      setCameraFeedback({ ok: false, msg: 'Lỗi: ' + e.message });
    }
  };

  const gradeComponentRef = useRef(null);

  /* In mẫu phiếu A4 */
  const handlePrintSheet = () => {
    window.open('https://moet.gov.vn/', '_blank');
    say('Đang mở thông tin mẫu phiếu thi THPT Bộ GD&ĐT 2025');
  };

  return (
    <div className="pg">
      {/* Toast thông báo */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999999,
          padding: '0.75rem 1.25rem', borderRadius: 14,
          background: toast.tone === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff', fontWeight: 700, fontSize: '0.9rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          {toast.text}
        </div>
      )}

      {/* HEADER CHÍNH */}
      <header className="pg-head">
        <div>
          <h2>
            <IcoScan size={22} /> Chấm Phiếu Trắc Nghiệm (OMR)
          </h2>
          <p>Nhận dạng tự động phiếu trả lời A4 bằng Camera hoặc file ảnh, tính điểm & chẩn đoán phổ điểm</p>
        </div>

        <div className="pg-head-actions">
          {view === 'list' && (
            <>
              <button
                type="button"
                className="vt-btn sm primary"
                onClick={() => { setCurrent(null); setView('setup'); }}
              >
                <IcoPlus size={14} /> Tạo bài chấm mới
              </button>
            </>
          )}

          {view !== 'list' && (
            <button
              type="button"
              className="vt-btn sm"
              onClick={() => { setView('list'); refresh(); }}
            >
              ← Về danh sách bài chấm
            </button>
          )}
        </div>
      </header>

      {/* 1. VIEW DANH SÁCH BÀI CHẤM */}
      {view === 'list' && (
        <>
          {loading ? (
            <div className="vt-loading"><p>Đang tải danh sách bài chấm...</p></div>
          ) : papers.length === 0 ? (
            <div className="pg-empty">
              <IcoScan size={48} />
              <h3>Chưa có bài chấm phiếu nào</h3>
              <p>Tạo bài chấm, nhập mã đề và tải ảnh phiếu thi để hệ thống tự động chấm điểm!</p>
              <button
                type="button"
                className="vt-btn primary"
                style={{ marginTop: '0.75rem' }}
                onClick={() => { setCurrent(null); setView('setup'); }}
              >
                <IcoPlus size={15} /> Tạo bài chấm đầu tiên
              </button>
            </div>
          ) : (
            <div className="pg-cards">
              {papers.map((p) => {
                const cls = classOf(p.classId);
                const codeCount = Object.keys(p.keys || {}).length;
                return (
                  <article key={p.id} className="pg-card">
                    <div>
                      <b>{p.title}</b>
                      <small>
                        {cls ? `Lớp ${cls.name}` : 'Không gắn lớp'} · {codeCount} mã đề ·
                        Phần I ({p.counts?.p1}c), Phần II ({p.counts?.p2}c), Phần III ({p.counts?.p3}c)
                      </small>
                    </div>

                    <div className="pg-card-actions">
                      <button
                        type="button"
                        className="vt-btn sm primary"
                        onClick={() => { setCurrent(p); setView('grade'); }}
                      >
                        <IcoScan size={14} /> Chấm bài
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm"
                        onClick={() => { setCurrent(p); setView('analytics'); }}
                        title="Xem phổ điểm & AI Chẩn đoán"
                      >
                        <IcoChart size={14} /> Phổ điểm
                      </button>
                      <button
                        type="button"
                        className="pg-icon"
                        onClick={() => { setCurrent(p); setView('setup'); }}
                        title="Sửa cấu hình"
                      >
                        <IcoEdit size={16} />
                      </button>
                      <button
                        type="button"
                        className="pg-icon danger"
                        onClick={async () => {
                          if (confirm(`Xóa bài chấm "${p.title}"?`)) {
                            await deletePaperExam(p.id);
                            refresh();
                            say('Đã xóa bài chấm');
                          }
                        }}
                        title="Xóa bài chấm"
                      >
                        <IcoTrash size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 2. VIEW CÀI ĐẶT ĐỀ & ĐÁP ÁN (SETUP) */}
      {view === 'setup' && (
        <PaperSetupForm
          current={current}
          classes={classes}
          exams={exams}
          onSave={async (data) => {
            setSaving(true);
            try {
              if (current?.id) {
                await updatePaperExam(current.id, data);
                setCurrent({ ...current, ...data });
                say('Đã cập nhật bài chấm');
              } else {
                const created = await createPaperExam({ ...data, teacherId: user.uid });
                setCurrent(created);
                say('Đã tạo bài chấm mới');
              }
              await refresh();
              setView('grade');
            } catch (e) {
              say(e.message, 'error');
            } finally {
              setSaving(false);
            }
          }}
          onCancel={() => setView('list')}
          saving={saving}
        />
      )}

      {/* 3. VIEW CHẤM BÀI (GRADE) */}
      {view === 'grade' && current && (
        <PaperGradeSession
          ref={gradeComponentRef}
          exam={current}
          classes={classes}
          onStartCamera={startCamera}
          onOpenAnalytics={() => setView('analytics')}
          onPrintSheet={handlePrintSheet}
          say={say}
        />
      )}

      {/* 4. VIEW PHỔ ĐIỂM & AI ANALYTICS */}
      {view === 'analytics' && current && (
        <PaperAnalyticsView
          exam={current}
          onBack={() => setView('grade')}
          say={say}
        />
      )}

      {/* MODAL LIVE CAMERA SCANNER */}
      {cameraOpen && (
        <div className="pg-cam-modal animate-pop">
          <header className="pg-cam-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IcoCamera size={20} color="#38bdf8" />
              <strong>Camera Chấm Phiếu Trực Tiếp</strong>
            </div>
            <button type="button" className="vt-btn sm" onClick={stopCamera}>
              Đóng Camera ✕
            </button>
          </header>

          <div className="pg-cam-body">
            {cameraLoading && (
              <div style={{ position: 'absolute', color: '#fff', zIndex: 20 }}>
                Đang khởi động camera...
              </div>
            )}
            <video ref={videoRef} className="pg-cam-video" playsInline autoPlay muted />

            {/* Khung ngắm định vị chuẩn khổ A4 */}
            <div className="pg-cam-viewfinder">
              <div className="pg-cam-corner tl" />
              <div className="pg-cam-corner tr" />
              <div className="pg-cam-corner bl" />
              <div className="pg-cam-corner br" />
              <div className="pg-cam-scanline" />
            </div>

            {/* HUD Thông báo kết quả ngay trên camera */}
            <div className="pg-cam-hud">
              <button
                type="button"
                className="vt-btn primary"
                style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', borderRadius: 999 }}
                onClick={captureAndScan}
              >
                📸 Chụp & Chấm Phiếu Này
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
   SUB-COMPONENT: FORM CÀI ĐẶT BÀI CHẤM
   ============================================================ */
function PaperSetupForm({ current, classes, exams, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(current?.title || 'Bài chấm phiếu trắc nghiệm');
  const [classId, setClassId] = useState(current?.classId || '');
  const [counts, setCounts] = useState(current?.counts || DEFAULT_COUNTS);
  const [scoring, setScoring] = useState(current?.scoring || DEFAULT_SCORING);
  const [keys, setKeys] = useState(current?.keys || { '101': { p1: [], p2: [], p3: [] } });
  const [activeCode, setActiveCode] = useState(Object.keys(current?.keys || {})[0] || '101');
  const [newCodeInput, setNewCodeInput] = useState('');
  const [rosterText, setRosterText] = useState('');

  // Lấy đáp án từ đề thi online có sẵn
  const handleImportFromOnlineExam = (eId) => {
    const exam = exams.find((x) => x.id === eId);
    if (!exam) return;
    const p1 = keyP1FromExam(exam, counts.p1);
    setKeys((prev) => ({
      ...prev,
      [activeCode]: { ...(prev[activeCode] || { p2: [], p3: [] }), p1 },
    }));
  };

  const handleAddCode = () => {
    const c = newCodeInput.trim().toUpperCase();
    if (!c || keys[c]) return;
    setKeys({ ...keys, [c]: { p1: [], p2: [], p3: [] } });
    setActiveCode(c);
    setNewCodeInput('');
  };

  const currentKey = keys[activeCode] || { p1: [], p2: [], p3: [] };

  const handleUpdateActiveKey = (part, val) => {
    setKeys((prev) => ({
      ...prev,
      [activeCode]: { ...prev[activeCode], [part]: val },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedClass = classes.find((c) => c.id === classId);
    const { map } = parseRoster(rosterText, selectedClass?.members || []);

    onSave({
      title,
      classId: classId || null,
      counts,
      scoring,
      keys,
      sbdMap: map,
    });
  };

  return (
    <form className="pg-setup" onSubmit={handleSubmit}>
      <div className="pg-block">
        <h3>1. Thông tin chung</h3>
        <div className="pg-grid">
          <div className="pg-field wide">
            <span>Tên bài chấm:</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="pg-field">
            <span>Gắn với lớp học:</span>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">-- Không gắn lớp --</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="pg-block">
        <h3>2. Cấu trúc số câu & Thang điểm (Chuẩn THPT 2025)</h3>
        <div className="pg-grid">
          <div className="pg-field">
            <span>Số câu Phần I (Trắc nghiệm):</span>
            <input
              type="number" min="1" max="40"
              value={counts.p1}
              onChange={(e) => setCounts({ ...counts, p1: Number(e.target.value) })}
            />
          </div>
          <div className="pg-field">
            <span>Số câu Phần II (Đúng/Sai):</span>
            <input
              type="number" min="0" max="8"
              value={counts.p2}
              onChange={(e) => setCounts({ ...counts, p2: Number(e.target.value) })}
            />
          </div>
          <div className="pg-field">
            <span>Số câu Phần III (Trả lời ngắn):</span>
            <input
              type="number" min="0" max="6"
              value={counts.p3}
              onChange={(e) => setCounts({ ...counts, p3: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="pg-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>3. Quản lý Mã Đề & Đáp Án</h3>
          {exams.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--mut)' }}>Lấy từ đề online:</span>
              <select onChange={(e) => handleImportFromOnlineExam(e.target.value)} defaultValue="">
                <option value="" disabled>-- Chọn đề --</option>
                {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Danh sách các mã đề */}
        <div className="pg-codes">
          {Object.keys(keys).map((code) => (
            <div key={code} className={`pg-code ${activeCode === code ? 'on' : ''}`}>
              <button type="button" onClick={() => setActiveCode(code)}>Mã {code}</button>
              {Object.keys(keys).length > 1 && (
                <span
                  className="x"
                  onClick={() => {
                    const next = { ...keys };
                    delete next[code];
                    setKeys(next);
                    setActiveCode(Object.keys(next)[0]);
                  }}
                >
                  ✕
                </span>
              )}
            </div>
          ))}

          <div className="pg-addcode">
            <input
              type="text"
              placeholder="Mã đề mới..."
              value={newCodeInput}
              onChange={(e) => setNewCodeInput(e.target.value)}
            />
            <button type="button" className="vt-btn sm" onClick={handleAddCode}>+ Thêm</button>
          </div>
        </div>

        {/* Nhập đáp án cho mã đề đang chọn */}
        <div className="pg-grid" style={{ marginTop: '0.75rem' }}>
          <div className="pg-field">
            <span>Đáp án Phần I (Dán chuỗi ABCD...):</span>
            <textarea
              rows={4}
              value={keyToTextP1(currentKey.p1)}
              onChange={(e) => handleUpdateActiveKey('p1', parseKeyP1(e.target.value, counts.p1))}
              placeholder="ABCDABCD..."
            />
          </div>

          <div className="pg-field">
            <span>Đáp án Phần II (Mỗi câu 1 dòng ĐSĐS):</span>
            <textarea
              rows={4}
              value={keyToTextP2(currentKey.p2)}
              onChange={(e) => handleUpdateActiveKey('p2', parseKeyP2(e.target.value, counts.p2))}
              placeholder="ĐSĐS&#10;SĐĐS..."
            />
          </div>

          <div className="pg-field">
            <span>Đáp án Phần III (Mỗi câu 1 dòng số):</span>
            <textarea
              rows={4}
              value={keyToTextP3(currentKey.p3)}
              onChange={(e) => handleUpdateActiveKey('p3', parseKeyP3(e.target.value, counts.p3))}
              placeholder="0,5&#10;12..."
            />
          </div>
        </div>
      </div>

      <div className="pg-block">
        <h3>4. Danh sách SBD & Họ tên học sinh (Tùy chọn)</h3>
        <p className="pg-note">Dán từ Excel dạng 2 cột: <code>SBD [Tab] Họ và tên</code>. Hệ thống sẽ tự động ghép tên khi nhận dạng phiếu.</p>
        <textarea
          rows={5}
          className="pg-roster"
          value={rosterText}
          onChange={(e) => setRosterText(e.target.value)}
          placeholder="000101	Nguyễn Văn An&#10;000102	Trần Thị Bình"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="vt-btn" onClick={onCancel} disabled={saving}>Hủy bỏ</button>
        <button type="submit" className="vt-btn primary" disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu & Bắt đầu chấm'}
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   SUB-COMPONENT: PHIÊN CHẤM BÀI (UPLOAD & LIVE CAMERA)
   ============================================================ */
import { forwardRef, useImperativeHandle } from 'react';

const PaperGradeSession = forwardRef(function PaperGradeSession({
  exam, classes, onStartCamera, onOpenAnalytics, onPrintSheet, say
}, ref) {
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [scanningFiles, setScanningFiles] = useState(false);
  const [filter, setFilter] = useState('all'); // all | review | ok

  useEffect(() => {
    (async () => {
      setLoadingResults(true);
      try {
        const list = await listPaperResults(exam.id);
        setResults(list);
      } catch (e) {
        say(e.message, 'error');
      } finally {
        setLoadingResults(false);
      }
    })();
  }, [exam.id, say]);

  useImperativeHandle(ref, () => ({
    addResult: async (newRes) => {
      setResults((prev) => {
        const next = [newRes, ...prev.filter((r) => r.sbd !== newRes.sbd)];
        return next;
      });
      try {
        await savePaperResults(exam.id, [newRes]);
      } catch (err) {
        console.warn('Lỗi lưu kết quả Firestore:', err);
      }
    },
  }));

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setScanningFiles(true);
    sound.ding();

    const scannedList = [];
    for (const file of files) {
      try {
        const imgData = await fileToImageData(file);
        const read = readSheet(imgData);

        const code = read.code || Object.keys(exam.keys)[0] || '';
        const key = exam.keys[code] || exam.keys[Object.keys(exam.keys)[0]] || { p1: [], p2: [], p3: [] };
        const grade = gradeSheet(read, key, exam.counts, exam.scoring);
        const studentName = exam.sbdMap?.[read.sbd]?.name || '';

        scannedList.push({
          id: nextId(),
          sbd: read.sbd,
          studentName,
          code,
          answers: { p1: read.p1, p2: read.p2, p3: read.p3 },
          grade,
          needsReview: (read.issues && read.issues.length > 0) || !read.sbd || !exam.keys[code],
          issues: read.issues || [],
          fileName: file.name,
        });
      } catch (err) {
        console.error(err);
      }
    }

    setResults((prev) => [...scannedList, ...prev]);
    try {
      await savePaperResults(exam.id, scannedList);
      sound.cheer();
      say(`Đã nhận dạng & chấm thành công ${scannedList.length} phiếu!`);
    } catch (err) {
      say(err.message, 'error');
    } finally {
      setScanningFiles(false);
    }
  };

  const handleExportCsv = () => {
    if (!results.length) return;
    const rows = resultsToRows(results, exam);
    downloadCsv(`ket-qua-${exam.title}.csv`, rows);
    say('Đã xuất file kết quả Excel (CSV)');
  };

  const filteredResults = results.filter((r) => {
    if (filter === 'review') return r.needsReview;
    if (filter === 'ok') return !r.needsReview;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & Quick Controls */}
      <div className="pg-drop">
        <div>
          <strong style={{ fontSize: '1.1rem', display: 'block', color: 'var(--ink)' }}>
            Chấm Phiếu: {exam.title}
          </strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--mut)' }}>
            Đã chấm {results.length} bài thi · {results.filter((r) => r.needsReview).length} bài cần xem lại
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="vt-btn primary" onClick={onStartCamera}>
            <IcoCamera size={16} /> Mở Camera Chấm
          </button>

          <label className="vt-btn" style={{ cursor: 'pointer' }}>
            <IcoScan size={16} /> Chọn File Ảnh
            <input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button type="button" className="vt-btn" onClick={onOpenAnalytics}>
            <IcoChart size={16} /> Xem Phổ Điểm
          </button>

          <button type="button" className="vt-btn" onClick={handleExportCsv} disabled={!results.length}>
            Xuất Excel
          </button>

          <button type="button" className="vt-btn" onClick={onPrintSheet} title="Mẫu phiếu trắc nghiệm A4">
            <IcoPrint size={16} /> In Mẫu Phiếu A4
          </button>
        </div>
      </div>

      {scanningFiles && (
        <div style={{ padding: '1rem', background: 'rgba(2, 132, 199, 0.1)', borderRadius: 14, color: '#0284c7', fontWeight: 700, textAlign: 'center' }}>
          Đang quét & chấm điểm các file ảnh phiếu thi... Vui lòng chờ giây lát!
        </div>
      )}

      {/* Bộ lọc bảng điểm */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`pg-chip ${filter === 'all' ? 'on' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({results.length})
          </button>
          <button
            type="button"
            className={`pg-chip ${filter === 'review' ? 'on' : ''}`}
            onClick={() => setFilter('review')}
          >
            Cần xem lại ({results.filter((r) => r.needsReview).length})
          </button>
          <button
            type="button"
            className={`pg-chip ${filter === 'ok' ? 'on' : ''}`}
            onClick={() => setFilter('ok')}
          >
            Hợp lệ ({results.filter((r) => !r.needsReview).length})
          </button>
        </div>
      </div>

      {/* Bảng kết quả */}
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
              <th>Tổng điểm</th>
              <th>Thang 10</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--mut)' }}>
                  Chưa có phiếu nào trong danh sách. Hãy bật camera hoặc tải ảnh lên để bắt đầu!
                </td>
              </tr>
            ) : (
              filteredResults.map((r) => (
                <tr key={r.id} className={r.needsReview ? 'review' : ''}>
                  <td className="mono">{r.sbd || '---'}</td>
                  <td><strong>{r.studentName || 'Chưa nhận diện'}</strong></td>
                  <td className="mono">{r.code || '---'}</td>
                  <td>{fmt(r.grade?.parts?.p1)}</td>
                  <td>{fmt(r.grade?.parts?.p2)}</td>
                  <td>{fmt(r.grade?.parts?.p3)}</td>
                  <td><strong>{fmt(r.grade?.total)}</strong></td>
                  <td>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: (r.grade?.score10 >= 8 ? '#10b981' : r.grade?.score10 >= 5 ? '#0284c7' : '#ef4444') }}>
                      {fmt(r.grade?.score10)}
                    </span>
                  </td>
                  <td>
                    {r.needsReview ? (
                      <span className="pg-tag warn">Nghi ngờ</span>
                    ) : (
                      <span className="pg-tag ok">Chuẩn</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

/* ============================================================
   SUB-COMPONENT: PHÂN TÍCH PHỔ ĐIỂM & AI CHẨN ĐOÁN
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

  if (loading) return <div className="vt-loading"><p>Đang tổng hợp phổ điểm...</p></div>;
  if (!stats) return (
    <div className="pg-empty">
      <h3>Chưa có dữ liệu phổ điểm</h3>
      <p>Cần ít nhất 1 bài thi đã chấm để vẽ biểu đồ phân tích phổ điểm!</p>
      <button type="button" className="vt-btn primary" onClick={onBack}>Quay lại chấm bài</button>
    </div>
  );

  const maxBinCount = Math.max(...stats.bins.map((b) => b.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
            Phổ Điểm & Chẩn Đoán Lớp Học: {exam.title}
          </h3>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--mut)', fontSize: '0.88rem' }}>
            Tổng số bài đã chấm: {stats.count} học sinh
          </p>
        </div>
        <button type="button" className="vt-btn" onClick={onBack}>← Quay lại chấm bài</button>
      </div>

      {/* Chỉ số chính */}
      <div className="pg-analytics-grid">
        <div className="pg-block">
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--mut)' }}>ĐIỂM TRUNG BÌNH</span>
          <strong style={{ fontSize: '2rem', color: '#0284c7' }}>{stats.avg}</strong>
          <small>Trung vị: {stats.median} · Độ lệch chuẩn: {stats.stdDev}</small>
        </div>
        <div className="pg-block">
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--mut)' }}>TỶ LỆ ĐẠT (≥ 5.0)</span>
          <strong style={{ fontSize: '2rem', color: '#10b981' }}>{stats.passRate}%</strong>
          <small>Học sinh khá giỏi (≥ 8.0): {stats.goodRate}%</small>
        </div>
        <div className="pg-block">
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--mut)' }}>ĐIỂM CAO NHẤT / THẤP NHẤT</span>
          <strong style={{ fontSize: '2rem', color: '#f59e0b' }}>{stats.max} / {stats.min}</strong>
          <small>Khoảng biến thiên điểm: {round2(stats.max - stats.min)}</small>
        </div>
      </div>

      {/* Biểu đồ Histogram Phổ điểm */}
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
      <div className="pg-block">
        <h3>Top 5 câu hỏi học sinh làm sai nhiều nhất (Phần I)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {stats.hardestP1.map((q, idx) => (
            <div key={q.q} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--surface-2)', borderRadius: 10 }}>
              <span><strong>Câu {q.q}</strong></span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>
                Tỷ lệ làm đúng chỉ: {q.correctRate}% ({q.correctCount}/{q.totalAnswered} học sinh)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ELEC AI Chẩn đoán */}
      <div className="pg-block" style={{ borderLeft: '4px solid #0284c7' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7' }}>
          🤖 ELEC AI Chẩn đoán kiến thức lớp học
        </h3>
        <p style={{ margin: '0.5rem 0 0', lineHeight: 1.6, fontSize: '0.92rem' }}>
          "Dựa trên kết quả bài chấm phiếu trắc nghiệm, điểm trung bình của lớp đạt <strong>{stats.avg}/10</strong> với tỷ lệ đạt <strong>{stats.passRate}%</strong>.
          Học sinh gặp khó khăn lớn nhất ở các câu <strong>{stats.hardestP1.map((x) => `Câu ${x.q}`).join(', ')}</strong>.
          Thầy cô nên dành thời gian ôn tập lại kiến thức trọng tâm của các câu hỏi này trước kì thi tiếp theo!"
        </p>
      </div>
    </div>
  );
}
