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
import TeacherVipLock from './TeacherVipLock.jsx';
import TeacherPedagogyWorkbench from './TeacherPedagogyWorkbench.jsx';
import EssayRubricGrader from './EssayRubricGrader.jsx';
import { createExam } from '../../lib/classroom.js';
import { clearDraft } from '../../lib/examAiUtils.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTeacherPro } from '../../hooks/useTeacherPro.js';
import {
  resolveEntitlements,
  FREE_TEACHER_LIMITS,
  TEACHER_VIP_PRICE_TEXT,
  TEACHER_TRIAL_QUOTA_EVENT,
  getWordImportTrialUsed,
  getWordImportTrialRemaining,
  incrementWordImportTrialUsed,
  getManualEntryTrialUsed,
  getManualEntryTrialRemaining,
  incrementManualEntryTrialUsed,
} from '../../lib/entitlements.js';
import { useToast } from '../admin/AdminUI.jsx';
import { ElecFlaskBrandSvg } from './ElecBrandMark.jsx';
import './create-exam-page.css';
import '../../styles/teacher-quantum-polish.css';

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
  <ElecFlaskBrandSvg size={size} variant="gradient" />
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
  try {
    const k = draftKey(classId);
    localStorage.setItem(k, JSON.stringify({ ...d, savedAt: Date.now() }));
    window.dispatchEvent(new CustomEvent('cs-ls', { detail: k }));
  } catch { /* đầy bộ nhớ */ }
};
const clearManualDraft = (classId) => {
  try {
    const k = draftKey(classId);
    localStorage.removeItem(k);
    window.dispatchEvent(new CustomEvent('cs-ls', { detail: k }));
  } catch { /* */ }
};
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
  existingExamCount = 0,
  isTeacherVip = undefined,
  onRequestUpgrade = null,
  onDone,
  onCancel,
}) {
  const { user, tier } = useAuth();
  const pro = useTeacherPro();
  const toast = useToast();
  const vipUnlocked = typeof isTeacherVip === 'boolean'
    ? isTeacherVip
    : resolveEntitlements({ user, pro, tier, userRole: 'teacher' }).isTeacherVip;
  const [trialTick, setTrialTick] = useState(0);
  useEffect(() => {
    const onChange = () => setTrialTick((n) => n + 1);
    window.addEventListener(TEACHER_TRIAL_QUOTA_EVENT, onChange);
    return () => window.removeEventListener(TEACHER_TRIAL_QUOTA_EVENT, onChange);
  }, []);
  const wordTrialLeft = getWordImportTrialRemaining(user?.uid, vipUnlocked);
  const wordTrialUsed = getWordImportTrialUsed(user?.uid);
  const manualTrialLeft = getManualEntryTrialRemaining(user?.uid, vipUnlocked);
  const manualTrialUsed = getManualEntryTrialUsed(user?.uid);
  void trialTick;

  const examQuotaReached = !vipUnlocked && (existingExamCount >= FREE_TEACHER_LIMITS.maxExams || manualTrialLeft <= 0);
  const wordQuotaReached = !vipUnlocked && wordTrialLeft <= 0;

  const [tab, setTab] = useState(() => {
    const t = initialPreset?.initialTab;
    if (t === 'ai' || t === 'manual' || t === 'file') return t;
    return vipUnlocked ? 'ai' : 'manual';
  });
  const [initialData, setInitialData] = useState(null);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);
  const [pendingDraft, setPendingDraft] = useState(() => readManualDraft(classInfo?.id));
  const [confirmOverwritePayload, setConfirmOverwritePayload] = useState(null);

  useEffect(() => {
    const nextTab = initialPreset?.initialTab;
    if (nextTab === 'ai' || nextTab === 'manual' || nextTab === 'file') {
      setTab(nextTab);
    }
  }, [initialPreset]);

  useEffect(() => {
    setPendingDraft(readManualDraft(classInfo?.id));
  }, [classInfo?.id]);

  /* FIX #3: Ref tới form instance để gọi replaceContent() thay vì remount */
  const formRef = useRef(null);
  const aiMetaRef = useRef(null);

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

    aiMetaRef.current = {
      classId: meta.classId,
      subject: meta.subject || '',
      grade: meta.grade ? String(meta.grade) : '',
      gradeType: meta.gradeType || '',
    };

    // Truyền dữ liệu vào form qua ref thay vì remount
    if (formRef.current?.replaceContent) {
      formRef.current.replaceContent({
        title: meta.title || `Đề AI tạo ${new Date().toLocaleDateString('vi-VN')}`,
        description: meta.description || '',
        duration: meta.duration || 45,
        gradeType: meta.gradeType || '',
        classId: meta.classId !== undefined ? meta.classId : (classInfo?.id || ''),
        showAnswerAfter: meta.showAnswerAfter,
        shuffle: meta.shuffle,
        allowRetry: meta.allowRetry,
        proctor: meta.proctor,
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
            ...(q.image ? { image: q.image } : {}),
            ...(Array.isArray(q.images) && q.images.length ? { images: q.images } : {}),
            ...(q.optionImages ? { optionImages: q.optionImages } : {}),
            ...(q.passage ? { passage: q.passage } : {}),
            ...(q.instruction ? { instruction: q.instruction } : {}),
            ...(q.passageId != null ? { passageId: q.passageId } : {}),
            ...((q.groupId || q.pg) ? { groupId: q.groupId || q.pg } : {}),
            ...(q.lockGroupQuestionOrder ? { lockGroupQuestionOrder: true } : {}),
          };
          /* Giữ đủ dữ liệu cho câu Đúng/Sai, Trả lời ngắn và Tự luận (không làm mất passage/image/answer) */
          if (type === 'true_false') return { ...base, statements: q.statements || [] };
          if (type === 'short_answer') return { ...base, answer: q.answer ?? '', accepted: q.accepted || [] };
          if (type === 'essay') return { ...base, options: [], correct: -1, answer: q.answer ?? '' };
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
    const isFileSource = data?.source === 'file-import';
    if (!vipUnlocked && !isFileSource && getManualEntryTrialRemaining(user?.uid, false) <= 0) {
      const msg = `Bạn đã dùng hết ${FREE_TEACHER_LIMITS.maxManualEntries}/${FREE_TEACHER_LIMITS.maxManualEntries} lượt tạo/nhập thủ công miễn phí. Nâng cấp Giáo viên VIP (${TEACHER_VIP_PRICE_TEXT}/năm) để sử dụng không giới hạn.`;
      toast.error(msg);
      onRequestUpgrade?.(msg);
      throw new Error(msg);
    }
    const aiMeta = aiMetaRef.current || {};
    const targetClassId = data.isDraft
      ? ''
      : (data.classId !== undefined ? (data.classId || '') : (aiMeta.classId || classInfo?.id || classes[0]?.id || ''));
    const isDraft = Boolean(data.isDraft || !targetClassId);
    const targetClassObj = (classes || []).find((c) => c.id === targetClassId) || (!isDraft ? classInfo : null);
    setSaving(true);
    try {
      const exam = await createExam({
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        classId: targetClassId,
        isDraft,
        title: data.title,
        description: data.description,
        duration: data.duration,
        questions: data.questions,
        subject: data.subject || aiMeta.subject || targetClassObj?.subject || '',
        grade: data.grade || aiMeta.grade || (targetClassObj?.grade ? String(targetClassObj.grade) : ''),
        showAnswerAfter: data.showAnswerAfter,
        allowRetry: data.allowRetry,
        shuffle: data.shuffle,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
        proctor: data.proctor,
        gradeType: data.gradeType || aiMeta.gradeType || '',
        source: data.source || '',
        kind: data.kind || '',
      });
      if (!vipUnlocked && !isFileSource) {
        incrementManualEntryTrialUsed(user?.uid, 1);
      }
      toast.success(isDraft
        ? `Đã lưu bản nháp cá nhân "${data.title}" (${data.questions.length} câu)`
        : `Đã tạo đề "${data.title}" với ${data.questions.length} câu cho ${targetClassObj?.name || 'lớp'}`);
      clearDraft();
      clearManualDraft(classInfo?.id);
      if (targetClassId) clearManualDraft(targetClassId);
      aiMetaRef.current = null;
      dirtyRef.current = false;
      onDone?.(exam);
      return exam;
    } catch (e) {
      console.error(e);
      toast.error('Không lưu được đề: ' + (e.message || 'Lỗi không xác định'));
      throw e;
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
          <IcoSparkle size={15} /> Tạo bằng AI (AutoExam Studio) {!vipUnlocked && <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800, background: 'rgba(245,158,11,0.18)', color: '#b45309' }}>VIP</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'manual'}
          className={'cep-tab' + (tab === 'manual' ? ' on' : '')}
          onClick={() => setTab('manual')}
        >
          <IcoDoc size={15} /> Soạn thủ công {!vipUnlocked ? `(Còn ${manualTrialLeft}/${FREE_TEACHER_LIMITS.maxManualEntries})` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'file'}
          className={'cep-tab' + (tab === 'file' ? ' on' : '')}
          onClick={() => setTab('file')}
        >
          <IcoUpload size={15} /> Nhập file Word {!vipUnlocked ? (
            <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800, background: wordTrialLeft > 0 ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)', color: wordTrialLeft > 0 ? '#10b981' : '#f59e0b' }}>
              {wordTrialLeft > 0 ? `Thử ${wordTrialLeft}/${FREE_TEACHER_LIMITS.maxWordImports}` : 'VIP'}
            </span>
          ) : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pedagogy'}
          className={'cep-tab' + (tab === 'pedagogy' ? ' on' : '')}
          onClick={() => setTab('pedagogy')}
        >
          <IcoDoc size={15} /> Giáo án CV 5512 &amp; Ma trận 7991
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'rubric'}
          className={'cep-tab' + (tab === 'rubric' ? ' on' : '')}
          onClick={() => setTab('rubric')}
        >
          <IcoSparkle size={15} /> Chấm Tự luận Rubric AI
        </button>
      </div>

      {/* ===== BẢN NHÁP CHƯA LƯU ===== */}
      {pendingDraft && tab === 'manual' && !examQuotaReached && (
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

      {/* ===== NỘI DUNG — cả 3 tab luôn mounted khi VIP, khóa rõ ràng khi Free ===== */}
      <div hidden={tab !== 'ai'}>
        {vipUnlocked ? (
          <AutoExamStudio
            classes={classes.length ? classes : classInfo ? [classInfo] : []}
            initialClass={classInfo}
            classInsights={classInsights}
            initialPreset={initialPreset}
            onGenerated={handleAIGenerated}
            onDone={onDone}
            onCancel={onCancel}
          />
        ) : (
          <TeacherVipLock
            title="AI Tạo Đề (AutoExam Studio) dành riêng cho Giáo viên VIP"
            description="Tự động lập ma trận chuẩn GDPT 2018, đọc lỗ hổng kiến thức của lớp và sinh trọn bộ câu hỏi kèm đáp án + lời giải trong vài giây."
            onUpgrade={onRequestUpgrade}
          />
        )}
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
        {examQuotaReached ? (
          <TeacherVipLock
            title={`Đã dùng hết ${FREE_TEACHER_LIMITS.maxManualEntries} lượt tạo/nhập thủ công của gói Giáo viên Free`}
            quotaText={`Đã dùng ${manualTrialUsed}/${FREE_TEACHER_LIMITS.maxManualEntries} lượt thủ công · ${existingExamCount}/${FREE_TEACHER_LIMITS.maxExams} đề`}
            description={`Tài khoản Giáo viên miễn phí hỗ trợ dùng thử tối đa ${FREE_TEACHER_LIMITS.maxManualEntries} lần nhập thủ công. Nâng cấp Giáo viên VIP (${TEACHER_VIP_PRICE_TEXT}/năm) để tạo và giao không giới hạn đề kiểm tra.`}
            onUpgrade={onRequestUpgrade}
          />
        ) : (
          /* FIX #3: KHÔNG dùng key để tránh remount. Dùng ref để expose API. */
          <ExamCreateForm
            ref={formRef}
            initial={initialData}
            onDirty={(d) => { dirtyRef.current = d; }}
            onSnapshot={handleSnapshot}
            classInfo={classInfo}
            classes={classes.length ? classes : classInfo ? [classInfo] : []}
            isTeacherVip={vipUnlocked}
            onRequestUpgrade={onRequestUpgrade}
            onSave={handleSave}
            onCancel={onCancel}
            saving={saving}
          />
        )}
      </div>

      <div hidden={tab !== 'file'}>
        {vipUnlocked || !wordQuotaReached ? (
          <ExamImporter
            variant="page"
            classInfo={classInfo}
            classes={classes.length ? classes : classInfo ? [classInfo] : []}
            allowBank={false}
            allowSoftExam
            isTeacherVip={vipUnlocked}
            onRequestUpgrade={onRequestUpgrade}
            onCreateSoftExam={async ({ title, duration, classId, subject, grade, gradeType, antiCheat, shuffleVariants, questions, sourceFile }) => {
              const targetCid = classId !== undefined ? classId : (classInfo?.id || '');
              await handleSave({
                title,
                description: sourceFile ? `Nhập từ file ${sourceFile}` : 'Đề mềm nhập từ file',
                duration,
                subject: subject || classInfo?.subject || '',
                grade: grade || classInfo?.grade || '',
                gradeType: gradeType || '',
                questions: questions.map((q) => ({ ...q, subject, grade })),
                showAnswerAfter: true,
                allowRetry: false,
                shuffle: Boolean(shuffleVariants),
                proctor: antiCheat === false ? { camera: 'off', fullscreenLock: false, tabSwitchLimit: 0, blockCopyPaste: false, strictMode: false } : undefined,
                source: 'file-import',
                kind: 'soft',
                classId: targetCid,
                isDraft: !targetCid,
              });
            }}
          />
        ) : (
          <TeacherVipLock
            title={`Đã hết ${FREE_TEACHER_LIMITS.maxWordImports}/${FREE_TEACHER_LIMITS.maxWordImports} lượt dùng thử nhập file Word miễn phí`}
            quotaText={`Đã dùng ${wordTrialUsed}/${FREE_TEACHER_LIMITS.maxWordImports} lượt nhập Word`}
            description={`Tài khoản Giáo viên miễn phí được dùng thử ${FREE_TEACHER_LIMITS.maxWordImports} lần nhập trực tiếp file Word (.docx). Nâng cấp Giáo viên VIP (${TEACHER_VIP_PRICE_TEXT}/năm) để nhập Word, tách đề PDF/Ảnh và Quét AI không giới hạn.`}
            onUpgrade={onRequestUpgrade}
          />
        )}
      </div>

      <div hidden={tab !== 'pedagogy'}>
        <TeacherPedagogyWorkbench />
      </div>

      <div hidden={tab !== 'rubric'}>
        <EssayRubricGrader />
      </div>
    </div>
  );
}