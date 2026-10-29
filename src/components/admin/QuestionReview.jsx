import { useMemo, useState } from 'react';
import {
  IconTrash, IconPlus, IconSave, IconBack, IconWarning, IconCheckCircle, IconAlert, IconInfo,
} from './AdminIcons.jsx';
import { InlineAlert, Spinner, useConfirm, useToast } from './AdminUI.jsx';
import { ANSWER_LABELS, DIFFICULTIES, EXAM_TYPES, QUESTION_TYPES } from './adminConstants.js';
import { questionProblems, resolveByName } from './adminUtils.js';

/* Màn hình duyệt câu hỏi do AI sinh / import trước khi lưu thành đề.
   Hỗ trợ đầy đủ 3 dạng câu chuẩn THPT 2025: single_choice, true_false, short_answer. */
export default function QuestionReview({ questions, meta = {}, grades = [], subjects = [], saving = false, onSave, onBack }) {
  const confirm = useConfirm();
  const toast = useToast();

  const [items, setItems] = useState(() =>
    questions.map((q) => ({
      ...q,
      type: q.type || q.question_type || 'single_choice',
      options: (q.options || []).map((o) => ({ ...o })),
    })),
  );
  const [form, setForm] = useState(() => ({
    title: meta.title || `Đề AI tạo ${new Date().toLocaleDateString('vi-VN')}`,
    description: meta.description || '',
    grade_id: meta.grade_id || resolveByName(grades, meta.grade_name)?.id || grades[0]?.id || '',
    subject_id: meta.subject_id || resolveByName(subjects, meta.subject_name)?.id || subjects[0]?.id || '',
    exam_type: meta.exam_type || 'giua_ky',
    duration: meta.duration || 45,
    difficulty: meta.difficulty || 'medium',
    is_published: false,
  }));

  const problems = useMemo(() => items.map(questionProblems), [items]);
  const badCount = problems.filter((p) => p.length).length;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const update = (i, patch) => setItems((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const changeType = (qi, nextType) => {
    setItems((qs) =>
      qs.map((q, idx) => {
        if (idx !== qi) return q;
        if (nextType === 'short_answer') {
          return {
            ...q,
            type: 'short_answer',
            shortAnswer: q.shortAnswer || '',
            correctAnswer: q.shortAnswer || 'ĐS',
            options: [{ label: 'ĐS', content: q.shortAnswer || '', is_correct: true }],
          };
        }
        if (nextType === 'true_false') {
          const opts = [0, 1, 2, 3].map((k) => ({
            label: ANSWER_LABELS[k],
            content: q.options?.[k]?.content || '',
            is_correct: k % 2 === 0,
          }));
          return {
            ...q,
            type: 'true_false',
            options: opts,
            correctAnswer: opts.map((o) => (o.is_correct ? 'Đ' : 'S')).join('-'),
          };
        }
        const opts = [0, 1, 2, 3].map((k) => ({
          label: ANSWER_LABELS[k],
          content: q.options?.[k]?.content || '',
        }));
        return {
          ...q,
          type: 'single_choice',
          options: opts,
          correctAnswer: 'A',
        };
      }),
    );
  };

  const updateOption = (qi, oi, content) =>
    setItems((qs) => qs.map((q, i) => (i !== qi ? q : { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, content } : o)) })));

  const toggleTfOption = (qi, oi, isRight) =>
    setItems((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q;
        const options = q.options.map((o, j) => (j === oi ? { ...o, is_correct: isRight } : o));
        return {
          ...q,
          options,
          correctAnswer: options.map((o) => (o.is_correct ? 'Đ' : 'S')).join('-'),
        };
      }),
    );

  const addOption = (qi) =>
    setItems((qs) => qs.map((q, i) => (i !== qi || q.options.length >= ANSWER_LABELS.length ? q : {
      ...q, options: [...q.options, { label: ANSWER_LABELS[q.options.length], content: '' }],
    })));

  const removeOption = (qi, oi) =>
    setItems((qs) => qs.map((q, i) => {
      if (i !== qi || q.options.length <= 2) return q;
      const removed = q.options[oi];
      const options = q.options.filter((_, j) => j !== oi).map((o, j) => ({ ...o, label: ANSWER_LABELS[j] }));
      let correct = q.correctAnswer;
      if (removed.label === q.correctAnswer) correct = '';
      else if (correct) {
        const idx = q.options.findIndex((o) => o.label === correct);
        correct = ANSWER_LABELS[idx > oi ? idx - 1 : idx];
      }
      return { ...q, options, correctAnswer: correct };
    }));

  const removeQuestion = async (i) => {
    const ok = await confirm({ title: `Xóa câu ${i + 1}`, message: 'Câu này sẽ bị loại khỏi đề sẽ lưu.', confirmText: 'Xóa câu', danger: true });
    if (ok) setItems((qs) => qs.filter((_, idx) => idx !== i));
  };

  const removeInvalid = async () => {
    const ok = await confirm({ title: `Loại ${badCount} câu lỗi`, message: 'Các câu đang có vấn đề sẽ bị xóa khỏi danh sách.', confirmText: 'Loại bỏ', danger: true });
    if (ok) setItems((qs) => qs.filter((_, i) => !problems[i].length));
  };

  const submit = () => {
    if (!form.title.trim()) return toast.error('Hãy nhập tiêu đề đề thi.');
    if (!form.grade_id || !form.subject_id) return toast.error('Hãy chọn lớp và môn.');
    const dur = Number(form.duration);
    if (!Number.isInteger(dur) || dur < 1 || dur > 300) return toast.error('Thời gian làm bài phải từ 1 đến 300 phút.');
    if (items.length === 0) return toast.error('Đề chưa có câu hỏi nào.');
    if (badCount > 0) return toast.error(`Còn ${badCount} câu chưa hợp lệ — sửa hoặc loại bỏ trước khi lưu.`);
    onSave({ ...form, duration: dur }, items);
  };

  return (
    <div className="adl-review">
      <header className="adl-review-head">
        <div>
          <h2>Duyệt {items.length} câu hỏi</h2>
          <p>Kiểm tra từng câu, sửa nếu cần, rồi lưu thành đề mới.</p>
        </div>
        <div className="adl-review-actions">
          <button type="button" className="adl-btn-outline" onClick={onBack} disabled={saving}><IconBack size={14} /> Quay lại</button>
          <button type="button" className="adl-btn-primary" onClick={submit} disabled={saving || items.length === 0}>
            {saving ? <Spinner size={14} /> : <IconSave size={14} />} Lưu {items.length} câu thành đề
          </button>
        </div>
      </header>

      <section className="adl-panel">
        <header className="adl-panel-head"><h3><span>Thông tin đề</span></h3></header>
        <div className="adl-form">
          <label className="adl-field">
            <span>Tiêu đề</span>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={200} />
          </label>
          <label className="adl-field">
            <span>Mô tả</span>
            <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <div className="adl-form-row">
            <label className="adl-field">
              <span>Lớp</span>
              <select value={form.grade_id} onChange={(e) => set('grade_id', e.target.value)}>
                {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label className="adl-field">
              <span>Môn</span>
              <select value={form.subject_id} onChange={(e) => set('subject_id', e.target.value)}>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="adl-field">
              <span>Loại đề</span>
              <select value={form.exam_type} onChange={(e) => set('exam_type', e.target.value)}>
                {EXAM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="adl-field">
              <span>Thời gian (phút)</span>
              <input type="number" min={1} max={300} value={form.duration} onChange={(e) => set('duration', e.target.value)} />
            </label>
          </div>
          <label className="adl-checkbox">
            <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
            <span>Hiển thị cho học sinh ngay (bỏ chọn để lưu nháp và kiểm tra lại sau)</span>
          </label>
        </div>
      </section>

      {badCount > 0 ? (
        <InlineAlert type="warn">
          <b>{badCount} câu cần xử lý</b> trước khi lưu (viền đỏ bên dưới).{' '}
          <button type="button" className="adl-link-btn" onClick={removeInvalid}>Loại bỏ tất cả câu lỗi</button>
        </InlineAlert>
      ) : items.length > 0 && (
        <InlineAlert type="success">Tất cả {items.length} câu đều hợp lệ. Hãy đọc lướt lại đáp án đúng trước khi lưu — AI vẫn có thể sai.</InlineAlert>
      )}

      {items.map((q, qi) => {
        const errs = problems[qi];
        const qType = q.type || 'single_choice';
        return (
          <article key={qi} className={'adl-review-card' + (errs.length ? ' invalid' : '')}>
            <div className="adl-review-card-head" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
              <b>Câu {qi + 1}</b>
              <select
                value={qType}
                onChange={(e) => changeType(qi, e.target.value)}
                className="vt-select-pill"
                style={{ padding: '.2rem 1.6rem .2rem .6rem', fontSize: '.74rem' }}
              >
                {QUESTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errs.length > 0 && <span className="adl-tag warn"><IconWarning size={12} /> {errs.join(' · ')}</span>}
              <button type="button" className="adl-icon-btn-sm danger" onClick={() => removeQuestion(qi)} title="Xóa câu" aria-label={`Xóa câu ${qi + 1}`} style={{ marginLeft: 'auto' }}>
                <IconTrash size={14} />
              </button>
            </div>

            {q.note && <div className="adl-review-note"><IconInfo size={14} /><span>AI ghi chú: {q.note}</span></div>}

            <label className="adl-field">
              <span>Nội dung câu hỏi</span>
              <textarea value={q.content} onChange={(e) => update(qi, { content: e.target.value })} rows={2} />
            </label>

            {qType === 'short_answer' ? (
              <label className="adl-field" style={{ marginTop: '.5rem' }}>
                <span>Đáp số trả lời ngắn (Phần III)</span>
                <input
                  type="text"
                  value={q.shortAnswer ?? q.options?.[0]?.content ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    update(qi, {
                      shortAnswer: val,
                      correctAnswer: val || 'ĐS',
                      options: [{ label: 'ĐS', content: val, is_correct: true }],
                    });
                  }}
                  placeholder="VD: 12,5 hoặc -4"
                  style={{ maxWidth: 260, fontFamily: 'var(--mono)', fontWeight: 700 }}
                />
              </label>
            ) : qType === 'true_false' ? (
              <fieldset className="adl-qedit-opts">
                <legend>Phần II — Đúng / Sai (4 mệnh đề a, b, c, d)</legend>
                {q.options.map((o, oi) => (
                  <div key={oi} className="adl-qedit-opt">
                    <b>{String.fromCharCode(97 + oi)})</b>
                    <input type="text" value={o.content} onChange={(e) => updateOption(qi, oi, e.target.value)} aria-label={`Mệnh đề ${o.label}`} />
                    <div className="vt-seg" role="group">
                      <button
                        type="button"
                        className={o.is_correct ? 'on' : ''}
                        onClick={() => toggleTfOption(qi, oi, true)}
                        style={o.is_correct ? { background: '#16a34a', color: '#fff' } : undefined}
                      >
                        Đúng
                      </button>
                      <button
                        type="button"
                        className={!o.is_correct ? 'on' : ''}
                        onClick={() => toggleTfOption(qi, oi, false)}
                        style={!o.is_correct ? { background: '#ef4444', color: '#fff' } : undefined}
                      >
                        Sai
                      </button>
                    </div>
                  </div>
                ))}
              </fieldset>
            ) : (
              <fieldset className="adl-qedit-opts">
                <legend>Đáp án — chọn nút tròn ở đáp án đúng</legend>
                {q.options.map((o, oi) => (
                  <div key={oi} className={'adl-qedit-opt' + (q.correctAnswer === o.label ? ' correct' : '')}>
                    <input type="radio" name={`rv-correct-${qi}`} checked={q.correctAnswer === o.label} onChange={() => update(qi, { correctAnswer: o.label })} aria-label={`Đáp án ${o.label} là đáp án đúng`} />
                    <b>{o.label}</b>
                    <input type="text" value={o.content} onChange={(e) => updateOption(qi, oi, e.target.value)} aria-label={`Nội dung đáp án ${o.label}`} />
                    <button type="button" className="adl-icon-btn-sm" onClick={() => removeOption(qi, oi)} disabled={q.options.length <= 2} title="Xóa đáp án" aria-label={`Xóa đáp án ${o.label}`}>
                      <IconTrash size={13} />
                    </button>
                  </div>
                ))}
                {q.options.length < ANSWER_LABELS.length && (
                  <button type="button" className="adl-btn-sm" onClick={() => addOption(qi)}><IconPlus size={12} /> Thêm đáp án</button>
                )}
              </fieldset>
            )}

            <label className="adl-field">
              <span>Lời giải</span>
              <textarea value={q.explanation || ''} onChange={(e) => update(qi, { explanation: e.target.value })} rows={2} />
            </label>

            <div className="adl-qedit-meta">
              <label className="adl-field adl-field-inline">
                <span>Độ khó</span>
                <select value={q.difficulty} onChange={(e) => update(qi, { difficulty: e.target.value })}>
                  {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              {q.topic && <span className="adl-tag">Chủ đề: {q.topic}</span>}
              {!errs.length && <span className="adl-ok-text"><IconCheckCircle size={14} /> Hợp lệ</span>}
            </div>
          </article>
        );
      })}

      {items.length === 0 && (
        <InlineAlert type="error"><IconAlert size={14} /> Không còn câu hỏi nào. Quay lại để dán lại JSON.</InlineAlert>
      )}

      <div className="adl-form-actions">
        <button type="button" className="adl-btn-outline" onClick={onBack} disabled={saving}><IconBack size={14} /> Quay lại</button>
        <button type="button" className="adl-btn-primary" onClick={submit} disabled={saving || items.length === 0}>
          {saving ? <Spinner size={14} /> : <IconSave size={14} />} Lưu {items.length} câu thành đề
        </button>
      </div>
    </div>
  );
}
