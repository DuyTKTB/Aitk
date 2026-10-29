/* ============================================================
   CreateExamPage.jsx — Trang tạo đề cho giáo viên
   v3 (fix):
     • FIX #3: Không remount form khi AI tạo đề. Dùng `ref`
       để merge dữ liệu AI vào form mà không mất state.
     • FIX: Cảnh báo nếu đang có dữ liệu chưa lưu trước khi
       ghi đè.
     • FIX: Bỏ `key={'form-' + formVersion}` (nguyên nhân chính
       gây warning và remount).
   ============================================================ */
import { useState, useCallback, useRef, useEffect } from 'react';
import ExamCreateForm from './ExamCreateForm.jsx';
import AutoExamStudio from './AutoExamStudio.jsx';
import ExamImporter from './ExamImporter.jsx';
import { createExam } from '../../lib/classroom.js';
import { clearDraft } from '../../lib/examAiUtils.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useToast } from '../admin/AdminUI.jsx';
import './create-exam-page.css';

const IcoDoc = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const IcoUpload = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IcoSparkle = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </svg>
);

/* ---------- Nháp tạo thủ công (autosave, theo lớp) ---------- */
const draftKey = (classId) => `cs-exam-manual-draft:${classId || 'none'}`;
const readManualDraft = (classId) => {
  try {
    const d = JSON.parse(localStorage.getItem(draftKey(classId)) || 'null');
    const has = d && (d.title?.trim() || d.questions?.some((q) => q.q?.trim()));
    return has ? d : null;
  } catch { return null; }
};
const writeManualDraft = (classId, d) => {
  try { localStorage.setItem(draftKey(classId), JSON.stringify({ ...d, savedAt: Date.now() })); } catch { /* đầy bộ nhớ */ }
};
const clearManualDraft = (classId) => { try { localStorage.removeItem(draftKey(classId)); } catch { /* */ } };
const fmtAgo = (t) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} giờ trước` : `${Math.round(h / 24)} ngày trước`;
};

/* ============================================================
   MAIN
   ============================================================ */
export default function CreateExamPage({
  classInfo,
  classes = [],
  classInsights,
  initialPreset = null,
  grades = [],
  subjects = [],
  onDone,
  onCancel,
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('ai');
  const [initialData, setInitialData] = useState(null);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);
  const [pendingDraft, setPendingDraft] = useState(() => readManualDraft(classInfo?.id));
  const [confirmOverwritePayload, setConfirmOverwritePayload] = useState(null);

  /* FIX #3: Ref tới form instance để gọi replaceContent() thay vì remount */
  const formRef = useRef(null);

  /* Cảnh báo khi đóng/tải lại tab lúc còn nội dung chưa lưu */
  useEffect(() => {
    const h = (e) => {
      if (dirtyRef.current && !saving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [saving]);

  const restoreDraft = () => {
    if (!pendingDraft) return;
    setInitialData(pendingDraft);
    setPendingDraft(null);
    setTab('manual');
    toast.success('Đã khôi phục bản nháp');
  };

  const discardDraft = () => {
    clearManualDraft(classInfo?.id);
    setPendingDraft(null);
  };

  /* Form báo bản chụp → lưu nháp */
  const handleSnapshot = useCallback((snap) => {
    const has = snap.title?.trim() || snap.questions?.some((q) => q.q?.trim());
    if (has) writeManualDraft(classInfo?.id, snap);
  }, [classInfo?.id]);

  const applyAiPayloadToForm = useCallback((payload) => {
    const { questions, meta, warnings = [] } = payload;

    // Truyền dữ liệu vào form qua ref thay vì remount
    if (formRef.current?.replaceContent) {
      formRef.current.replaceContent({
        title: meta.title || `Đề AI tạo ${new Date().toLocaleDateString('vi-VN')}`,
        description: meta.description || '',
        duration: meta.duration || 45,
        questions: questions.map((q) => {
          const type = q.type || 'single_choice';
          const base = {
            q: q.q ?? q.content ?? '',
            type,
            points: q.points || 1,
            explain: q.explain || '',
            topic: q.topic || '',
            level: q.level || '',
            levelKey: q.levelKey,
            warns: q.warns || [],
          };
          /* Giữ đủ dữ liệu cho câu Đúng/Sai và Trả lời ngắn (trước đây bị cắt mất) */
          if (type === 'true_false') return { ...base, statements: q.statements || [] };
          if (type === 'short_answer') return { ...base, answer: q.answer ?? '', accepted: q.accepted || [] };
          return {
            ...base,
            options: q.options || [],
            correct: typeof q.correct === 'number' ? q.correct : -1,
          };
        }),
      });
    }

    setTab('manual');

    const needReview = warnings.length;
    toast.success(
      needReview
        ? `AI đã tạo ${questions.length} câu — ${needReview} câu cần xem lại trước khi lưu`
        : `AI đã tạo ${questions.length} câu — bấm "Lưu đề" để hoàn tất`
    );
  }, [toast]);

  /* FIX #3: AI sinh đề xong → gọi form API để thay thế nội dung,
     KHÔNG remount (giữ state khác như proctor settings, opensAt...) */
  const handleAIGenerated = useCallback((payload) => {
    // Cảnh báo qua hộp thoại nội bộ nếu đang có dữ liệu chưa lưu
    if (dirtyRef.current) {
      setConfirmOverwritePayload(payload);
      return;
    }
    applyAiPayloadToForm(payload);
  }, [applyAiPayloadToForm]);

  /* Lưu đề */
  const handleSave = async (data) => {
    if (!classInfo?.id) {
      toast.error('Thiếu thông tin lớp.');
      return;
    }
    setSaving(true);
    try {
      const exam = await createExam({
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        classId: data.classId || classInfo.id,
        title: data.title,
        description: data.description,
        duration: data.duration,
        questions: data.questions,
        showAnswerAfter: data.showAnswerAfter,
        allowRetry: data.allowRetry,
        shuffle: data.shuffle,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
        proctor: data.proctor,
        source: data.source || '',
        kind: data.kind || '',
      });
      toast.success(`Đã tạo đề "${data.title}" với ${data.questions.length} câu`);
      clearDraft();
      clearManualDraft(classInfo.id);
      dirtyRef.current = false;
      onDone?.(exam);
    } catch (e) {
      console.error(e);
      toast.error('Không lưu được đề: ' + (e.message || 'Lỗi không xác định'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cep">
      {/* ===== TABS ===== */}
      <div className="cep-tabs" role="tablist" aria-label="Cách tạo đề">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'ai'}
          className={'cep-tab' + (tab === 'ai' ? ' on' : '')}
          onClick={() => setTab('ai')}
        >
          <IcoSparkle size={15} /> Tạo bằng AI (AutoExam Studio)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'manual'}
          className={'cep-tab' + (tab === 'manual' ? ' on' : '')}
          onClick={() => setTab('manual')}
        >
          <IcoDoc size={15} /> Soạn thủ công
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'file'}
          className={'cep-tab' + (tab === 'file' ? ' on' : '')}
          onClick={() => setTab('file')}
        >
          <IcoUpload size={15} /> Nhập từ file
        </button>
      </div>

      {/* ===== BẢN NHÁP CHƯA LƯU ===== */}
      {pendingDraft && tab === 'manual' && (
        <div className="cep-draft-banner" role="status">
          <div>
            <b>Có bản nháp chưa lưu</b>
            <span>
              "{pendingDraft.title?.trim() || 'Đề chưa đặt tên'}" · {pendingDraft.questions?.length || 0} câu · {fmtAgo(pendingDraft.savedAt)}
            </span>
          </div>
          <div className="cep-draft-actions">
            <button type="button" className="cep-draft-btn primary" onClick={restoreDraft}>Khôi phục</button>
            <button type="button" className="cep-draft-btn" onClick={discardDraft}>Bỏ</button>
          </div>
        </div>
      )}

      {/* ===== NỘI DUNG — cả 3 tab luôn mounted ===== */}
      <div hidden={tab !== 'ai'}>
        <AutoExamStudio
          classes={classes.length ? classes : classInfo ? [classInfo] : []}
          initialClass={classInfo}
          classInsights={classInsights}
          initialPreset={initialPreset}
          onGenerated={handleAIGenerated}
          onDone={onDone}
          onCancel={onCancel}
        />
      </div>

      {/* Hộp xác nhận nội bộ khi ghi đè form Soạn thủ công */}
      {confirmOverwritePayload && (
        <div
          className="vt-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmOverwritePayload(null); }}
          role="presentation"
        >
          <div className="vt-modal sm" role="dialog" aria-modal="true" aria-label="Xác nhận thay thế nội dung">
            <header className="vt-modal-head">
              <h3>Thay thế nội dung đang soạn?</h3>
            </header>
            <div className="vt-modal-body">
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
                Tab <b>“Soạn thủ công”</b> đang có nội dung chưa lưu. Bạn có chắc muốn thay thế bằng bộ câu hỏi vừa tạo từ AI không?
              </p>
            </div>
            <footer className="vt-modal-foot">
              <button type="button" className="vt-btn" onClick={() => setConfirmOverwritePayload(null)}>
                Giữ lại bản đang soạn
              </button>
              <button
                type="button"
                className="vt-btn primary"
                onClick={() => {
                  const p = confirmOverwritePayload;
                  setConfirmOverwritePayload(null);
                  applyAiPayloadToForm(p);
                }}
              >
                Thay bằng đề AI
              </button>
            </footer>
          </div>
        </div>
      )}

      <div hidden={tab !== 'manual'}>
        {/* FIX #3: KHÔNG dùng key để tránh remount. Dùng ref để expose API. */}
        <ExamCreateForm
          ref={formRef}
          initial={initialData}
          onDirty={(d) => { dirtyRef.current = d; }}
          onSnapshot={handleSnapshot}
          classInfo={classInfo}
          onSave={handleSave}
          onCancel={onCancel}
          saving={saving}
        />
      </div>

      <div hidden={tab !== 'file'}>
        <ExamImporter
          variant="page"
          classInfo={classInfo}
          classes={classes.length ? classes : classInfo ? [classInfo] : []}
          allowBank={false}
          allowSoftExam
          onCreateSoftExam={async ({ title, duration, classId, subject, grade, questions, sourceFile }) => {
            await handleSave({
              title,
              description: sourceFile ? `Nhập từ file ${sourceFile}` : 'Đề mềm nhập từ file',
              duration,
              questions: questions.map((q) => ({ ...q, subject, grade })),
              showAnswerAfter: true,
              allowRetry: false,
              shuffle: false,
              source: 'file-import',
              kind: 'soft',
              classId: classId || classInfo?.id,
            });
          }}
        />
      </div>
    </div>
  );
}