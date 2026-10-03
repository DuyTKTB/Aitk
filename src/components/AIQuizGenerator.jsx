import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { askAI, fetchPlan } from '../services/api.js';
import { compressImage } from '../services/ai.js';
import VipGate from './VipGate.jsx';
import AIMark from './AIMark.jsx';

/* ============================================================
   AI QUIZ GENERATOR — Tính năng VIP
   Upload tài liệu → AI đọc → Chọn điểm → Sinh đề
   ============================================================ */

const ACCEPT_TYPES = '.jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf,.doc,.docx,.txt,.md,.json';

const STEP = {
  UPLOAD: 'upload',
  TARGET: 'target',
  GENERATING: 'generating',
  QUIZ: 'quiz',
  RESULT: 'result',
};

/* ============================================================
   Đọc file → text hoặc ảnh base64
   ============================================================ */
async function readFile(file) {
  const name = file.name.toLowerCase();
  const type = file.type || '';

  // Ảnh → base64
  if (type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(name)) {
    const compressed = await compressImage(file);
    return { kind: 'image', base64: compressed.base64, mimeType: compressed.mimeType, fileName: file.name };
  }

  // File text thuần
  if (type.startsWith('text/') || /\.(txt|md|json|csv)$/i.test(name)) {
    const text = await file.text();
    return { kind: 'text', text, fileName: file.name };
  }

  // PDF → cố gắng đọc bằng PDF.js (nếu có) hoặc dùng text extractor
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
    try {
      const pdfjs = await import('pdfjs-dist/build/pdf.mjs').catch(() => null);
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((it) => it.str).join(' ') + '\n';
        }
        return { kind: 'text', text: fullText, fileName: file.name };
      }
    } catch (e) {
      console.warn('[AIQuizGen] PDF.js lỗi:', e);
    }
    throw new Error('Không đọc được PDF. Hãy chụp ảnh trang PDF rồi upload lại.');
  }

  // Word .docx → dùng mammoth (nếu có)
  if (/\.docx$/i.test(name)) {
    try {
      const mammoth = await import('mammoth').catch(() => null);
      if (mammoth) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return { kind: 'text', text: result.value, fileName: file.name };
      }
    } catch (e) {
      console.warn('[AIQuizGen] mammoth lỗi:', e);
    }
    throw new Error('Không đọc được Word. Hãy copy nội dung dán vào file .txt rồi upload lại.');
  }

  // .doc cũ không hỗ trợ
  if (/\.doc$/i.test(name)) {
    throw new Error('File .doc cũ không hỗ trợ. Hãy save as .docx hoặc copy text.');
  }

  throw new Error(`Định dạng file chưa hỗ trợ: ${file.name}`);
}

/* ============================================================
   Build prompt cho AI
   ============================================================ */
function buildQuizPrompt({ content, targetScore, questionCount, subject, grade }) {
  const textContent = typeof content === 'string'
    ? `\n\nNỘI DUNG BÀI HỌC:\n"""\n${content.slice(0, 12000)}\n"""`
    : '';

  const imageNote = content?.kind === 'image'
    ? '\n\nẢNH BÀI HỌC ĐÃ ĐƯỢC ĐÍNH KÈM — hãy đọc nội dung ảnh trước khi tạo câu hỏi.'
    : '';

  return `Bạn là giáo viên ${subject || 'Hóa học'} ${grade || 'THPT'} tạo đề kiểm tra.

NHIỆM VỤ: Tạo ${questionCount} câu hỏi trắc nghiệm dựa trên nội dung bài học dưới đây.
${textContent}${imageNote}

YÊU CẦU QUAN TRỌNG:
1. Đáp án đúng phải suy ra từ nội dung bài học, không bịa.
2. Có ĐÚNG 1 đáp án đúng, 4 phương án A, B, C, D.
3. Phương án nhiễu hợp lý, bám sát lỗi sai học sinh hay mắc.
4. Phân bố độ khó để học sinh có thể đạt ~${targetScore}/10 điểm:
   - Nhận biết (easy): ~${Math.round(questionCount * 0.4)} câu
   - Thông hiểu (medium): ~${Math.round(questionCount * 0.4)} câu  
   - Vận dụng (hard): ~${questionCount - Math.round(questionCount * 0.8)} câu
5. Ký hiệu Unicode: H₂O, Fe³⁺, →, ⇌, KHÔNG dùng LaTeX.
6. Lời giải 2-4 câu, rõ ràng.

ĐỊNH DẠNG ĐẦU RA: Chỉ trả về JSON thuần (không markdown, không code fence):
[
  {
    "q": "Nội dung câu hỏi?",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": 0,
    "explain": "Lời giải ngắn",
    "difficulty": "easy|medium|hard",
    "topic": "Chủ đề nhỏ"
  }
]

answer là chỉ số 0-3 của đáp án đúng.`;
}

/* ============================================================
   Component chính
   ============================================================ */
export default function AIQuizGenerator({ onClose }) {
  const { user } = useAuth();
  const [vipState, setVipState] = useState({ loading: true, vip: false });

  // Wizard state
  const [step, setStep] = useState(STEP.UPLOAD);
  const [files, setFiles] = useState([]);           // [{ file, preview, kind, text, base64 }]
  const [reading, setReading] = useState(false);
  const [error, setError] = useState(null);

  // Config
  const [targetScore, setTargetScore] = useState(8);
  const [questionCount, setQuestionCount] = useState(10);
  const [subject, setSubject] = useState('Hóa học');
  const [grade, setGrade] = useState('Lớp 11');

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [picks, setPicks] = useState({});           // { qIndex: selectedOptionIndex }
  const [showExplain, setShowExplain] = useState({});

  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  /* Check VIP */
  useEffect(() => {
    fetchPlan().then((plan) => setVipState({ loading: false, vip: plan.vip }));
  }, []);

  /* ============ File handling ============ */
  const addFiles = async (fileList) => {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;

    setReading(true);
    setError(null);

    const results = [];
    for (const f of arr.slice(0, 5)) {  // Tối đa 5 file
      try {
        const data = await readFile(f);
        results.push({ file: f, ...data });
      } catch (e) {
        setError((prev) => prev ? `${prev}\n${e.message}` : e.message);
      }
    }
    setFiles((prev) => [...prev, ...results].slice(0, 5));
    setReading(false);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  /* ============ Generate ============ */
  const generate = async () => {
    if (!files.length) return;
    setStep(STEP.GENERATING);
    setError(null);

    try {
      // Gộp tất cả nội dung text + ảnh
      const textParts = files.filter((f) => f.kind === 'text').map((f) => f.text).join('\n\n---\n\n');
      const imageFiles = files.filter((f) => f.kind === 'image');

      const prompt = buildQuizPrompt({
        content: imageFiles.length ? null : textParts,
        targetScore,
        questionCount,
        subject,
        grade,
      });

      // Build history với ảnh (nếu có)
      const parts = [{ text: prompt }];
      for (const img of imageFiles) {
        parts.push({
          inlineData: { mimeType: img.mimeType, data: img.base64 },
        });
      }

      const history = [{ role: 'user', parts }];

      // Gọi AI (streaming để user thấy tiến độ)
      let fullText = '';
      await new Promise((resolve, reject) => {
        const p = askAI(history, (chunk) => { fullText = chunk; });
        p.then(resolve).catch(reject);
        p.abort = p.abort || (() => {});
      });

      // Parse JSON từ response
      const cleaned = fullText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const start = cleaned.search(/\[/);
      const end = cleaned.lastIndexOf(']');
      if (start < 0 || end < 0) throw new Error('AI trả về không đúng định dạng. Thử lại.');

      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      const valid = parsed.filter((q) =>
        q.q && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.answer)
      );

      if (!valid.length) throw new Error('AI không tạo được câu hỏi hợp lệ. Thử lại.');

      setQuestions(valid.slice(0, questionCount));
      setQIndex(0);
      setPicks({});
      setShowExplain({});
      setStep(STEP.QUIZ);
    } catch (e) {
      console.error('[AIQuizGen] generate lỗi:', e);
      setError(e.message || 'Không tạo được đề. Thử lại.');
      setStep(STEP.UPLOAD);
    }
  };

  /* ============ Quiz interaction ============ */
  const pickAnswer = (idx) => {
    if (picks[qIndex] !== undefined) return;
    setPicks((p) => ({ ...p, [qIndex]: idx }));
    setShowExplain((s) => ({ ...s, [qIndex]: true }));
  };

  const nextQuestion = () => {
    if (qIndex + 1 >= questions.length) {
      setStep(STEP.RESULT);
    } else {
      setQIndex(qIndex + 1);
    }
  };

  const resetAll = () => {
    setStep(STEP.UPLOAD);
    setFiles([]);
    setQuestions([]);
    setPicks({});
    setQIndex(0);
    setError(null);
  };

  /* ============ Stats ============ */
  const correctCount = Object.entries(picks).filter(
    ([idx, pick]) => questions[idx]?.answer === pick
  ).length;
  const score = questions.length > 0 ? (correctCount / questions.length) * 10 : 0;

  /* ============ Render ============ */
  if (vipState.loading) {
    return (
      <div className="aiq-loading">
        <div className="aiq-spinner" />
        <p>Đang kiểm tra quyền truy cập…</p>
      </div>
    );
  }

  if (!vipState.vip) {
    return (
      <div className="aiq-wrap">
        <VipGate text="Nâng cấp VIP để AI đọc tài liệu và tự động tạo đề kiểm tra riêng cho bạn." />
        {onClose && (
          <button type="button" className="aiq-close" onClick={onClose}>
            Đóng
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="aiq-wrap">
      {/* ===== HEADER ===== */}
      <div className="aiq-head">
        <div className="aiq-head-logo">
          <AIMark size={44} mode={step === STEP.GENERATING ? 'think' : 'idle'} look animate />
        </div>
        <div className="aiq-head-text">
          <h2>
            AI Tạo Đề <span className="vip-badge">VIP</span>
          </h2>
          <p>
            {step === STEP.UPLOAD && 'Upload tài liệu — AI đọc và sinh đề cho bạn'}
            {step === STEP.TARGET && 'Chọn mục tiêu điểm số'}
            {step === STEP.GENERATING && 'AI đang đọc tài liệu và soạn đề…'}
            {step === STEP.QUIZ && `Câu ${qIndex + 1}/${questions.length}`}
            {step === STEP.RESULT && 'Kết quả bài làm'}
          </p>
        </div>
        {onClose && (
          <button type="button" className="aiq-x" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        )}
      </div>

      {/* ===== STEP INDICATOR ===== */}
      <div className="aiq-steps">
        {[
          [STEP.UPLOAD, '1', 'Tài liệu'],
          [STEP.TARGET, '2', 'Mục tiêu'],
          [STEP.QUIZ, '3', 'Làm bài'],
          [STEP.RESULT, '4', 'Kết quả'],
        ].map(([id, num, label], i, arr) => {
          const order = arr.findIndex(([x]) => x === step);
          const currentIdx = arr.findIndex(([x]) => x === id);
          const isDone = currentIdx < order || step === STEP.RESULT;
          const isCurrent = id === step || (step === STEP.GENERATING && id === STEP.TARGET);
          return (
            <div key={id} className={'aiq-step' + (isDone ? ' done' : '') + (isCurrent ? ' cur' : '')}>
              <span className="aiq-step-num">{isDone ? '✓' : num}</span>
              <span className="aiq-step-label">{label}</span>
            </div>
          );
        })}
      </div>

      {/* ===== ERROR ===== */}
      {error && (
        <div className="aiq-error" role="alert">
          <b>⚠️ Lỗi:</b>
          <span>{error}</span>
        </div>
      )}

      {/* ===== STEP 1: UPLOAD ===== */}
      {step === STEP.UPLOAD && (
        <div className="aiq-body">
          <div
            className={'aiq-drop' + (dragging ? ' on' : '')}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_TYPES}
              multiple
              hidden
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            />
            <div className="aiq-drop-icon">📁</div>
            <h3>Kéo thả tài liệu vào đây</h3>
            <p>hoặc</p>
            <button type="button" className="aiq-btn-upload" onClick={() => fileRef.current?.click()}>
              Chọn file từ máy
            </button>
            <small>Hỗ trợ: Ảnh (JPG, PNG), PDF, Word (.docx), TXT, MD · Tối đa 5 file</small>
          </div>

          {reading && (
            <div className="aiq-reading">
              <div className="aiq-spinner small" />
              <span>Đang đọc file…</span>
            </div>
          )}

          {files.length > 0 && (
            <div className="aiq-files">
              <h4>Đã chọn {files.length} file</h4>
              <ul>
                {files.map((f, i) => (
                  <li key={i}>
                    {f.kind === 'image' ? (
                      <img src={`data:${f.mimeType};base64,${f.base64}`} alt={f.fileName} />
                    ) : (
                      <span className="aiq-file-icon">📄</span>
                    )}
                    <div className="aiq-file-info">
                      <b>{f.fileName}</b>
                      <small>
                        {f.kind === 'image' ? 'Ảnh' : `${(f.text || '').length.toLocaleString('vi-VN')} ký tự`}
                        {' · '}
                        {(f.file.size / 1024).toFixed(0)} KB
                      </small>
                    </div>
                    <button type="button" className="aiq-file-x" onClick={() => removeFile(i)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="aiq-actions">
            <button
              type="button"
              className="aiq-btn primary"
              disabled={!files.length || reading}
              onClick={() => setStep(STEP.TARGET)}
            >
              Tiếp tục →
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: TARGET ===== */}
      {step === STEP.TARGET && (
        <div className="aiq-body">
          <div className="aiq-target">
            <label>
              <span>Mục tiêu điểm</span>
              <div className="aiq-target-score">
                <b>{targetScore}</b>
                <small>/10</small>
              </div>
              <input
                type="range"
                min="5"
                max="10"
                step="0.5"
                value={targetScore}
                onChange={(e) => setTargetScore(parseFloat(e.target.value))}
              />
              <div className="aiq-target-marks">
                <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
              </div>
              <small className="aiq-hint">
                {targetScore >= 9.5 && '🏆 Đề rất khó — AI sẽ tập trung câu vận dụng cao'}
                {targetScore >= 8 && targetScore < 9.5 && '🎯 Đề khó vừa — phân bố 40/40/20'}
                {targetScore >= 6.5 && targetScore < 8 && '📚 Đề trung bình — cân bằng lý thuyết và bài tập'}
                {targetScore < 6.5 && '🌱 Đề dễ — tập trung nhận biết và thông hiểu'}
              </small>
            </label>
          </div>

          <div className="aiq-config">
            <label>
              <span>Số câu</span>
              <select value={questionCount} onChange={(e) => setQuestionCount(+e.target.value)}>
                {[5, 10, 15, 20, 25, 30].map((n) => <option key={n} value={n}>{n} câu</option>)}
              </select>
            </label>
            <label>
              <span>Môn</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                {['Hóa học', 'Toán', 'Vật lí', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lí'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Lớp</span>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                {['Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'].map((g) => <option key={g}>{g}</option>)}
              </select>
            </label>
          </div>

          <div className="aiq-actions">
            <button type="button" className="aiq-btn ghost" onClick={() => setStep(STEP.UPLOAD)}>
              ← Quay lại
            </button>
            <button type="button" className="aiq-btn primary" onClick={generate}>
              🤖 Tạo đề bằng AI
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: GENERATING ===== */}
      {step === STEP.GENERATING && (
        <div className="aiq-body aiq-generating">
          <AIMark size={120} mode="think" look animate />
          <h3>AI đang đọc tài liệu và soạn đề…</h3>
          <p>Quá trình này mất 10–30 giây. Vui lòng chờ.</p>
          <div className="aiq-progress">
            <div className="aiq-progress-bar" />
          </div>
        </div>
      )}

      {/* ===== STEP 4: QUIZ ===== */}
      {step === STEP.QUIZ && questions[qIndex] && (
        <div className="aiq-body">
          <div className="aiq-quiz-head">
            <span className="aiq-quiz-num">Câu {qIndex + 1} / {questions.length}</span>
            {questions[qIndex].difficulty && (
              <span className={'aiq-diff ' + questions[qIndex].difficulty}>
                {questions[qIndex].difficulty === 'easy' && 'Nhận biết'}
                {questions[qIndex].difficulty === 'medium' && 'Thông hiểu'}
                {questions[qIndex].difficulty === 'hard' && 'Vận dụng'}
                {questions[qIndex].difficulty === 'extreme' && 'Vận dụng cao'}
              </span>
            )}
          </div>

          <h3 className="aiq-quiz-q">{questions[qIndex].q}</h3>

          <div className="aiq-quiz-opts">
            {questions[qIndex].options.map((opt, i) => {
              const picked = picks[qIndex];
              const isCorrect = i === questions[qIndex].answer;
              let cls = 'aiq-opt';
              if (picked !== undefined) {
                if (isCorrect) cls += ' correct';
                else if (i === picked) cls += ' wrong';
                else cls += ' dim';
              }
              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  onClick={() => pickAnswer(i)}
                  disabled={picked !== undefined}
                >
                  <span className="aiq-opt-label">{String.fromCharCode(65 + i)}</span>
                  <span className="aiq-opt-text">{opt.replace(/^[A-D]\.\s*/, '')}</span>
                </button>
              );
            })}
          </div>

          {showExplain[qIndex] && questions[qIndex].explain && (
            <div className={'aiq-explain ' + (picks[qIndex] === questions[qIndex].answer ? 'ok' : 'bad')}>
              <b>
                {picks[qIndex] === questions[qIndex].answer ? '✓ Chính xác!' : '✗ Chưa đúng'}
              </b>
              <p>{questions[qIndex].explain}</p>
            </div>
          )}

          {picks[qIndex] !== undefined && (
            <div className="aiq-actions">
              {qIndex + 1 < questions.length ? (
                <button type="button" className="aiq-btn primary" onClick={nextQuestion}>
                  Câu tiếp →
                </button>
              ) : (
                <button type="button" className="aiq-btn primary" onClick={() => setStep(STEP.RESULT)}>
                  Xem kết quả
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== STEP 5: RESULT ===== */}
      {step === STEP.RESULT && (
        <div className="aiq-body aiq-result">
          <div className="aiq-result-score">
            <b className={score >= targetScore ? 'ok' : 'bad'}>
              {score.toFixed(1)}
            </b>
            <small>/10 điểm</small>
          </div>

          <div className="aiq-result-summary">
            <div>
              <b>{correctCount}</b>
              <span>Câu đúng</span>
            </div>
            <div>
              <b>{questions.length - correctCount}</b>
              <span>Câu sai</span>
            </div>
            <div>
              <b>{targetScore}</b>
              <span>Mục tiêu</span>
            </div>
          </div>

          <div className={'aiq-result-msg ' + (score >= targetScore ? 'ok' : 'bad')}>
            {score >= targetScore
              ? `🎉 Tuyệt vời! Bạn đã đạt ${score.toFixed(1)}/${10} điểm — vượt mục tiêu ${targetScore}.`
              : `💪 Cố lên! Bạn đạt ${score.toFixed(1)}/10 — cần thêm ${(targetScore - score).toFixed(1)} điểm để đạt mục tiêu.`}
          </div>

          <div className="aiq-actions">
            <button type="button" className="aiq-btn ghost" onClick={resetAll}>
              📚 Upload tài liệu mới
            </button>
            <button
              type="button"
              className="aiq-btn primary"
              onClick={() => { setQIndex(0); setPicks({}); setShowExplain({}); setStep(STEP.QUIZ); }}
            >
              🔄 Làm lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}