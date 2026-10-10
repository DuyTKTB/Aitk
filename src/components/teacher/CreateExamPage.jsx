/* ============================================================
   CreateExamPage.jsx — Trang tạo đề cho giáo viên
   ------------------------------------------------------------
   2 tab: Thủ công | AI
   Sau khi AI sinh → tự chuyển sang tab Thủ công với dữ liệu
   ------------------------------------------------------------
   v2: AI trả câu hỏi đã chuẩn hóa (q, options, correct, explain…) nên
       không cần đoán đáp án ở đây nữa. Sửa 2 lỗi cũ:
         • key={'ai-result-' + Date.now()} làm form remount mỗi lần render
           (mất sạch dữ liệu đang nhập khi bấm Lưu / đổi tab)
         • đổi tab làm mất cuộc trò chuyện AI (nay giữ mounted)
   ============================================================ */
import { useState, useCallback, useRef } from 'react';
import ExamCreateForm from './ExamCreateForm.jsx';
import CreateExamAI from './CreateExamAI.jsx';
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
const IcoSparkle = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </svg>
);

/* ============================================================
   MAIN
   ============================================================ */
export default function CreateExamPage({ classInfo, grades = [], subjects = [], onDone, onCancel }) {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('manual');
  const [initialData, setInitialData] = useState(null);
  const [formVersion, setFormVersion] = useState(0); // đổi khi nạp đề mới từ AI
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false); // form thủ công đang có nội dung

  /* AI sinh đề xong → chuyển sang tab thủ công với dữ liệu điền sẵn */
  const handleAIGenerated = useCallback((payload) => {
    const { questions, meta, warnings = [] } = payload;

    // Đã nạp đề AI trước đó → hỏi trước khi ghi đè phần đang sửa
    if ((formVersion > 0 || dirtyRef.current) && !window.confirm('Thay nội dung đang soạn ở tab Thủ công bằng đề AI này?')) {
      return;
    }

    setInitialData({
      title: meta.title || `Đề AI tạo ${new Date().toLocaleDateString('vi-VN')}`,
      description: meta.description || '',
      duration: meta.duration || 45,
      questions: questions.map((q) => ({
        q: q.q ?? q.content ?? '',
        options: q.options || [],
        correct: typeof q.correct === 'number' ? q.correct : -1,
        points: q.points || 1,
        explain: q.explain || '',
        topic: q.topic || '',
        level: q.level || '',
        warns: q.warns || [],
      })),
      showAnswerAfter: true,
      allowRetry: false,
      shuffle: false,
    });
    setFormVersion((v) => v + 1);
    setTab('manual');

    const needReview = warnings.length;
    toast.success(
      needReview
        ? `AI đã tạo ${questions.length} câu — ${needReview} câu cần xem lại trước khi lưu`
        : `AI đã tạo ${questions.length} câu — bấm "Lưu đề" để hoàn tất`
    );
  }, [toast, formVersion]);

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
        classId: classInfo.id,
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
      });
      toast.success(`Đã tạo đề "${data.title}" với ${data.questions.length} câu`);
      clearDraft(); // đề đã lưu → bỏ bản nháp AI cũ
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
          aria-selected={tab === 'manual'}
          className={'cep-tab' + (tab === 'manual' ? ' on' : '')}
          onClick={() => setTab('manual')}
        >
          <IcoDoc size={15} /> Tạo thủ công
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'ai'}
          className={'cep-tab' + (tab === 'ai' ? ' on' : '')}
          onClick={() => setTab('ai')}
        >
          <IcoSparkle size={15} /> Tạo bằng AI
        </button>
      </div>

      {/* ===== NỘI DUNG — cả 2 tab luôn mounted để không mất dữ liệu ===== */}
      <div hidden={tab !== 'manual'}>
        <ExamCreateForm
          key={'form-' + formVersion}
          initial={initialData}
          onDirty={(d) => { dirtyRef.current = d; }}
          classInfo={classInfo}
          onSave={handleSave}
          onCancel={onCancel}
          saving={saving}
        />
      </div>

      <div hidden={tab !== 'ai'}>
        <CreateExamAI
          grades={grades}
          subjects={subjects}
          onGenerated={handleAIGenerated}
        />
      </div>
    </div>
  );
}