/* ============================================================
   ExamManagePanel.jsx — Bảng quản lý 1 đề cho giáo viên
   ------------------------------------------------------------
   • Gia hạn / Đóng–Mở lại / Nhân bản / Sửa nhanh thông tin
   • CHẤM LẠI khi đổi đáp án đúng (hỗ trợ cả 3 phần: Trắc nghiệm, Đúng/Sai, Trả lời ngắn)
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
import { IconAlert } from './Icons.jsx';
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
        <p className="emp-alert" role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <IconAlert size={14} /> Câu {suspicious.map((q) => q.index + 1).join(', ')}: đa số học sinh chọn sai — hãy kiểm tra lại đáp án đúng.
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
            {(exam.questions || []).map((q, i) => {
              const qType = q.type || (Array.isArray(q.statements) ? 'true_false' : (!Array.isArray(q.options) || q.options.length === 0) ? 'short_answer' : 'single_choice');
              const st = stats.questions[i];
              const chg = changes[i];
              return (
                <li key={i} className={'emp-q' + (st?.suspicious ? ' flag' : '') + (chg != null ? ' changed' : '')}>
                  <div className="emp-q-head">
                    <b>Câu {i + 1}</b>
                    {qType === 'true_false' && <span className="emp-rate">Đúng/Sai</span>}
                    {qType === 'short_answer' && <span className="emp-rate">Trả lời ngắn</span>}
                    {st && submissions.length > 0 && (
                      <span className="emp-rate">{Math.round((st.correctRate || 0) * 100)}% đúng</span>
                    )}
                    {st?.suspicious && <span className="emp-flag">đáng ngờ</span>}
                  </div>
                  <MathText as="p" className="emp-q-text">{q.q}</MathText>

                  {qType === 'single_choice' && (
                    <div className="emp-opts">
                      {(q.options || []).map((o, oi) => {
                        const cur = typeof chg === 'number' ? chg : q.correct;
                        return (
                          <button key={oi} type="button"
                            className={'emp-opt' + (cur === oi ? ' sel' : '') + (q.correct === oi ? ' orig' : '')}
                            onClick={() => setChanges((c) => {
                              const n = { ...c };
                              if (oi === q.correct) delete n[i]; else n[i] = oi;
                              return n;
                            })}>
                            <span className="emp-key">{letter(oi)}</span>
                            <MathText>{o}</MathText>
                            {st && submissions.length > 0 && <em>{pctOf(st.counts?.[oi] || 0, submissions.length)}%</em>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {qType === 'true_false' && (
                    <div className="emp-opts">
                      {(chg?.statements || q.statements || []).map((stmt, si) => {
                        const curAns = Boolean(stmt.answer ?? stmt.correct);
                        return (
                          <div key={si} className="emp-opt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ flex: 1 }}>
                              <b style={{ marginRight: 6 }}>{'abcd'[si] || si + 1})</b>
                              <MathText>{stmt.text}</MathText>
                            </span>
                            <button
                              type="button"
                              className="emp-btn"
                              style={{
                                background: curAns ? 'rgba(16,185,129,0.16)' : 'rgba(239,68,68,0.14)',
                                color: curAns ? '#059669' : '#dc2626',
                                fontWeight: 700,
                              }}
                              onClick={() => setChanges((c) => {
                                const baseStmts = (c[i]?.statements || q.statements || []).map((s, idx) =>
                                  idx === si ? { ...s, answer: !(s.answer ?? s.correct), correct: !(s.answer ?? s.correct) } : s
                                );
                                return { ...c, [i]: { statements: baseStmts } };
                              })}
                            >
                              {curAns ? 'Đúng' : 'Sai'} (Bấm để đổi)
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {qType === 'short_answer' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Đáp án chuẩn:</span>
                      <input
                        value={chg?.answer ?? q.answer ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setChanges((c) => {
                            const n = { ...c };
                            if (val === String(q.answer ?? '')) delete n[i];
                            else n[i] = { answer: val, accepted: [val, val.replace(',', '.'), val.replace('.', ',')] };
                            return n;
                          });
                        }}
                        style={{ padding: '0.35rem 0.65rem', borderRadius: 8, border: '1px solid var(--line, #cbd5e1)', maxWidth: 160 }}
                      />
                    </div>
                  )}
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
            {(exam.questions || []).map((q, i) => {
              const st = stats.questions[i] || { counts: [], skipped: 0, correctRate: 0, difficulty: 'vừa', suspicious: false };
              const qType = q.type || (Array.isArray(q.statements) ? 'true_false' : (!Array.isArray(q.options) || q.options.length === 0) ? 'short_answer' : 'single_choice');
              return (
                <li key={i} className={'emp-q' + (st.suspicious ? ' flag' : '')}>
                  <div className="emp-q-head">
                    <b>Câu {i + 1}</b>
                    <span className={'emp-diff ' + st.difficulty}>{st.difficulty}</span>
                    <span className="emp-rate">{Math.round((st.correctRate || 0) * 100)}% đúng</span>
                    {st.skipped > 0 && <span className="emp-rate">{st.skipped} bỏ qua</span>}
                  </div>
                  <p className="emp-q-text">{stripMath(q.q).slice(0, 140)}</p>
                  {qType === 'single_choice' && (
                    <div className="emp-bars">
                      {(q.options || []).map((o, oi) => (
                        <div key={oi} className={'emp-bar' + (oi === q.correct ? ' right' : '')}>
                          <span className="emp-key">{letter(oi)}</span>
                          <div className="emp-track"><div style={{ width: `${pctOf(st.counts?.[oi] || 0, stats.submitted)}%` }} /></div>
                          <em>{pctOf(st.counts?.[oi] || 0, stats.submitted)}%</em>
                        </div>
                      ))}
                    </div>
                  )}
                  {qType === 'true_false' && (
                    <div className="emp-bars">
                      {(q.statements || []).map((s, idx) => {
                        const ratePct = Math.round((st.statementRates?.[idx] || 0) * 100);
                        const isTrue = Boolean(s.answer ?? s.correct);
                        return (
                          <div key={idx} className="emp-bar right">
                            <span className="emp-key">{'abcd'[idx]}) {isTrue ? 'Đ' : 'S'}</span>
                            <div className="emp-track"><div style={{ width: `${ratePct}%` }} /></div>
                            <em>{ratePct}% đúng</em>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {qType === 'short_answer' && (
                    <p className="emp-note">
                      Đáp án trả lời ngắn: <b>{q.answer || (q.accepted || [])[0] || '—'}</b>
                      {st.topWrongShort ? ` · Sai phổ biến nhất: "${st.topWrongShort.text}" (${st.topWrongShort.c} HS)` : ''}
                    </p>
                  )}
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
