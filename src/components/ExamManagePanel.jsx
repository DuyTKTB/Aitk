/* ============================================================
   ExamManagePanel.jsx — Bảng quản lý 1 đề cho giáo viên
   ------------------------------------------------------------
   • Gia hạn / Đóng–Mở lại / Nhân bản / Sửa nhanh thông tin
   • CHẤM LẠI khi đổi đáp án đúng (AI đôi khi ra sai đáp án)
   • Phân tích đáp án nhiễu: mỗi câu bao nhiêu % chọn từng phương án,
     gắn cờ câu đa số chọn sai (có thể đáp án đúng bị sai)
   Props: exam, submissions (đã tải), onChanged(), toast {success,error}
   Dùng: <ExamManagePanel exam={exam} submissions={subs} onChanged={refresh} toast={toast} />
   ============================================================ */
import { useMemo, useState } from 'react';
import { Modal } from './DashShell.jsx';
import MathText, { stripMath } from './MathText.jsx';
import {
  updateExam, duplicateExam, setExamActive, extendExam, regradeExam, analyzeSubmissions,
} from '../lib/classroom.js';
import '../styles/exam-manage.css';

const letter = (i) => String.fromCharCode(65 + i);
const pctOf = (n, d) => (d ? Math.round((n / d) * 100) : 0);

export default function ExamManagePanel({ exam, submissions = [], onChanged, toast }) {
  const [busy, setBusy] = useState('');
  const [modal, setModal] = useState(null); // 'edit' | 'regrade' | 'analysis'
  const [edit, setEdit] = useState({ title: exam.title || '', description: exam.description || '', duration: exam.duration || 15 });
  const [changes, setChanges] = useState({});

  const stats = useMemo(() => analyzeSubmissions(exam, submissions), [exam, submissions]);
  const closed = exam.active === false;
  const suspicious = stats.questions.filter((q) => q.suspicious);

  const run = async (key, fn, okMsg) => {
    setBusy(key);
    try {
      const r = await fn();
      if (okMsg) toast?.success(typeof okMsg === 'function' ? okMsg(r) : okMsg);
      onChanged?.(r);
      setModal(null);
    } catch (e) {
      toast?.error(e.message || 'Có lỗi xảy ra');
    } finally { setBusy(''); }
  };

  const nChanges = Object.keys(changes).length;

  return (
    <section className="emp" aria-label="Quản lý đề">
      <div className="emp-row">
        <span className={'emp-state ' + (closed ? 'off' : 'on')}>{closed ? 'Đã đóng' : 'Đang mở'}</span>

        <div className="emp-group" role="group" aria-label="Gia hạn">
          {[15, 30, 60].map((m) => (
            <button key={m} type="button" className="emp-btn" disabled={!!busy}
              onClick={() => run('ext', () => extendExam(exam.id, m), `Đã gia hạn thêm ${m} phút`)}>
              +{m}′
            </button>
          ))}
        </div>

        <button type="button" className="emp-btn" disabled={!!busy}
          onClick={() => run('act', () => setExamActive(exam.id, closed), closed ? 'Đã mở lại đề' : 'Đã đóng đề')}>
          {closed ? 'Mở lại' : 'Đóng đề'}
        </button>
        <button type="button" className="emp-btn" disabled={!!busy}
          onClick={() => run('dup', () => duplicateExam(exam.id), 'Đã nhân bản đề')}>Nhân bản</button>
        <button type="button" className="emp-btn" onClick={() => setModal('edit')}>Sửa</button>
        <button type="button" className="emp-btn" onClick={() => setModal('analysis')} disabled={!submissions.length}>Phân tích</button>
        <button type="button" className="emp-btn primary" onClick={() => setModal('regrade')}>
          Chấm lại{suspicious.length ? <i className="emp-dot" title={`${suspicious.length} câu đáng ngờ`} /> : null}
        </button>
      </div>

      {suspicious.length > 0 && (
        <p className="emp-alert" role="status">
          ⚠ Câu {suspicious.map((q) => q.index + 1).join(', ')}: đa số học sinh chọn sai — hãy kiểm tra lại đáp án đúng.
        </p>
      )}

      {/* ---------- SỬA NHANH ---------- */}
      {modal === 'edit' && (
        <Modal title="Sửa thông tin đề" onClose={() => setModal(null)} size="sm"
          foot={<>
            <button type="button" className="vt-btn" onClick={() => setModal(null)}>Hủy</button>
            <button type="button" className="vt-btn primary" disabled={!!busy || !edit.title.trim()}
              onClick={() => run('edit', () => updateExam(exam.id, edit), 'Đã lưu thay đổi')}>Lưu</button>
          </>}>
          <label className="emp-field"><span>Tên đề</span>
            <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} maxLength={120} />
          </label>
          <label className="emp-field"><span>Mô tả</span>
            <textarea rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} maxLength={500} />
          </label>
          <label className="emp-field"><span>Thời gian làm bài (phút)</span>
            <input type="number" min={1} max={300} value={edit.duration} onChange={(e) => setEdit({ ...edit, duration: e.target.value })} />
          </label>
        </Modal>
      )}

      {/* ---------- CHẤM LẠI ---------- */}
      {modal === 'regrade' && (
        <Modal title="Chấm lại — đổi đáp án đúng" onClose={() => { setModal(null); setChanges({}); }} size="lg"
          foot={<>
            <button type="button" className="vt-btn" onClick={() => { setModal(null); setChanges({}); }}>Hủy</button>
            <button type="button" className="vt-btn primary" disabled={!!busy || nChanges === 0}
              onClick={() => run('regrade', () => regradeExam(exam.id, changes),
                (r) => `Đã chấm lại ${r.total} bài (${r.changed} bài đổi điểm)`)}>
              {busy === 'regrade' ? 'Đang chấm lại…' : `Áp dụng ${nChanges} thay đổi`}
            </button>
          </>}>
          <p className="emp-hint">Chọn đáp án đúng mới cho câu cần sửa. Điểm của <b>tất cả bài đã nộp</b> sẽ được tính lại.</p>
          <ol className="emp-qs">
            {exam.questions.map((q, i) => {
              const cur = changes[i] ?? q.correct;
              const st = stats.questions[i];
              return (
                <li key={i} className={'emp-q' + (st?.suspicious ? ' flag' : '') + (changes[i] != null ? ' changed' : '')}>
                  <div className="emp-q-head">
                    <b>Câu {i + 1}</b>
                    {st && submissions.length > 0 && <span className="emp-rate">{pctOf(st.counts[q.correct] || 0, submissions.length)}% đúng</span>}
                    {st?.suspicious && <span className="emp-flag">đáng ngờ</span>}
                  </div>
                  <MathText as="p" className="emp-q-text">{q.q}</MathText>
                  <div className="emp-opts">
                    {q.options.map((o, oi) => (
                      <button key={oi} type="button"
                        className={'emp-opt' + (cur === oi ? ' sel' : '') + (q.correct === oi ? ' orig' : '')}
                        onClick={() => setChanges((c) => {
                          const n = { ...c };
                          if (oi === q.correct) delete n[i]; else n[i] = oi;
                          return n;
                        })}>
                        <span className="emp-key">{letter(oi)}</span>
                        <MathText>{o}</MathText>
                        {st && submissions.length > 0 && <em>{pctOf(st.counts[oi], submissions.length)}%</em>}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>
        </Modal>
      )}

      {/* ---------- PHÂN TÍCH ---------- */}
      {modal === 'analysis' && (
        <Modal title="Phân tích đáp án" onClose={() => setModal(null)} size="lg">
          <ul className="emp-sum">
            <li><b>{stats.submitted}</b><span>Bài nộp</span></li>
            <li><b>{stats.avg.toFixed(1)}</b><span>Điểm TB</span></li>
            <li><b>{stats.max}</b><span>Cao nhất</span></li>
            <li><b>{stats.min}</b><span>Thấp nhất</span></li>
          </ul>
          <ol className="emp-qs">
            {exam.questions.map((q, i) => {
              const st = stats.questions[i];
              return (
                <li key={i} className={'emp-q' + (st.suspicious ? ' flag' : '')}>
                  <div className="emp-q-head">
                    <b>Câu {i + 1}</b>
                    <span className={'emp-diff ' + st.difficulty}>{st.difficulty}</span>
                    <span className="emp-rate">{Math.round(st.correctRate * 100)}% đúng</span>
                    {st.skipped > 0 && <span className="emp-rate">{st.skipped} bỏ qua</span>}
                  </div>
                  <p className="emp-q-text">{stripMath(q.q).slice(0, 140)}</p>
                  <div className="emp-bars">
                    {q.options.map((o, oi) => (
                      <div key={oi} className={'emp-bar' + (oi === q.correct ? ' right' : '')}>
                        <span className="emp-key">{letter(oi)}</span>
                        <div className="emp-track"><div style={{ width: `${pctOf(st.counts[oi], stats.submitted)}%` }} /></div>
                        <em>{pctOf(st.counts[oi], stats.submitted)}%</em>
                      </div>
                    ))}
                  </div>
                  {st.topDistractor && (
                    <p className="emp-note">Đáp án nhiễu hấp dẫn nhất: <b>{letter(st.topDistractor.oi)}</b> ({st.topDistractor.c} học sinh)</p>
                  )}
                </li>
              );
            })}
          </ol>
        </Modal>
      )}
    </section>
  );
}
