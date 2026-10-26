/* ============================================================
   LinkedClassesPanel.jsx — lớp mà giáo viên bộ môn đã liên kết
   ------------------------------------------------------------
   Chỉ hiện những lớp có liên kết thật trong `class_teachers`
   (docId = {classId}_{uid}). Với mỗi lớp:
     • đề do CHÍNH giáo viên này giao cho lớp (exams.teacherId == uid)
     • giao đề mới (mở ExamCreate với classInfo của lớp đó)
     • giám sát trực tiếp: dùng phòng thi đang mở, hoặc tạo phòng mới
     • xem kết quả từng đề (điểm, %, thời điểm nộp)
   Không có dữ liệu mẫu: mọi con số đọc từ Firestore.
   ============================================================ */

import { useCallback, useEffect, useState } from 'react';
import {
  listMyLinkedClasses, examStatus, toMs,
} from '../../lib/classTeachers.js';
import {
  getClassById, getExamsByClass, getSubmissionsByExam, deleteExam,
} from '../../lib/classroom.js';
import { createExamSession, getSessionByExam } from '../../lib/examSession.js';
import { Modal } from '../DashShell.jsx';
import ExamEditModal from './ExamEditModal.jsx';
import ExamManagePanel from '../ExamManagePanel.jsx';
import '../../styles/subject-teachers.css';

const fmtDate = (ms) => {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
};

const fmtDateTime = (ms) => {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const pct = (sub) => {
  const total = Number(sub?.totalPoints) || 0;
  const score = Number(sub?.score);
  if (!total || !Number.isFinite(score)) return null;
  return Math.round((score / total) * 100);
};

const STATUS_TONE = { open: 'good', soon: 'mid', closed: 'na', off: 'bad', live: 'ex' };

export default function LinkedClassesPanel({ user, onAssign, onMonitor, onSay }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [openClass, setOpenClass] = useState('');
  const [detail, setDetail] = useState({}); // classId → { loading, subs, sessions }
  const [resultsOf, setResultsOf] = useState(''); // examId đang xem kết quả
  const [confirmId, setConfirmId] = useState(''); // examId chờ xác nhận mở phòng
  const [busy, setBusy] = useState('');
  const [editCtx, setEditCtx] = useState(null); // { exam, item } — mở Chỉnh sửa chi tiết
  const [manageCtx, setManageCtx] = useState(null); // { exam, item } — gia hạn/đóng–mở/nhân bản/chấm lại

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setErr('');
    try {
      const links = await listMyLinkedClasses(user.uid);
      const built = await Promise.all(links.map(async (l) => {
        try {
          const [cls, exs] = await Promise.all([
            getClassById(l.classId),
            getExamsByClass(l.classId),
          ]);
          const mine = (exs || []).filter((e) => e.teacherId === user.uid);
          return { ...l, cls, mine, classError: '' };
        } catch (e) {
          return {
            ...l,
            cls: null,
            mine: [],
            classError: e?.code === 'permission-denied'
              ? 'Không đọc được dữ liệu lớp (kiểm tra firestore rules đã deploy).'
              : (e?.message || 'Không tải được lớp.'),
          };
        }
      }));
      setItems(built);
    } catch (e) {
      setErr(
        e?.code === 'permission-denied'
          ? 'Chưa có quyền đọc danh sách liên kết. Cần deploy firestore.rules (phần class_teachers) trước khi dùng.'
          : (e?.message || 'Không tải được danh sách lớp đã liên kết.'),
      );
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { load(); }, [load]);

  const openClassDetail = async (item) => {
    if (openClass === item.classId) {
      setOpenClass('');
      return;
    }
    setOpenClass(item.classId);
    setResultsOf('');
    setConfirmId('');
    if (detail[item.classId]) return;

    setDetail((d) => ({ ...d, [item.classId]: { loading: true, subs: {}, sessions: {} } }));
    const data = await fetchClassDetail(item);
    setDetail((d) => ({ ...d, [item.classId]: data }));
  };

  /* Lượt nộp + phòng thi của các đề mình đã giao trong một lớp */
  const fetchClassDetail = async (item) => {
    const subs = {};
    const sessions = {};
    await Promise.all(item.mine.map(async (ex) => {
      try { subs[ex.id] = await getSubmissionsByExam(ex.id); } catch { subs[ex.id] = []; }
      try { sessions[ex.id] = await getSessionByExam(ex.id); } catch { sessions[ex.id] = null; }
    }));
    return { loading: false, subs, sessions };
  };

  /* Xoá đề khỏi lớp — không thể hoàn tác, nên luôn hỏi xác nhận */
  const removeExam = async (item, exam) => {
    const label = item.cls?.name || item.className || item.classId;
    const ok = window.confirm(
      `Xoá đề “${exam.title || 'Đề'}” khỏi lớp ${label}?\n`
      + 'Bài nộp của đề này sẽ không còn trong thống kê. Thao tác không thể hoàn tác.',
    );
    if (!ok) return;
    setBusy(exam.id);
    try {
      await deleteExam(exam.id);
      onSay?.('Đã xoá đề', 'success');
      await load();
      setDetail((d) => {
        const next = { ...d };
        delete next[item.classId];
        return next;
      });
    } catch (e) {
      onSay?.(`Không xoá được: ${e?.message || e}`, 'error');
    } finally {
      setBusy('');
    }
  };

  const monitor = async (item, exam) => {
    setBusy(exam.id);
    try {
      const current = detail[item.classId]?.sessions?.[exam.id];
      if (current && current.status === 'live') {
        onMonitor?.(current);
        return;
      }
      const session = await createExamSession({
        examId: exam.id,
        examToken: exam.token,
        classId: exam.classId,
        teacherId: user.uid,
        teacherName: user.displayName || user.email || 'Giáo viên',
        title: exam.title,
        duration: exam.duration,
      });
      setDetail((d) => ({
        ...d,
        [item.classId]: {
          ...(d[item.classId] || { subs: {}, sessions: {} }),
          sessions: { ...(d[item.classId]?.sessions || {}), [exam.id]: session },
        },
      }));
      setConfirmId('');
      onMonitor?.(session);
    } catch (e) {
      onSay?.(`Không mở được phòng giám sát: ${e?.message || e}`, 'error');
    } finally {
      setBusy('');
    }
  };

  /* ---------- trạng thái tải / lỗi ---------- */
  if (loading) {
    return <p className="st-empty" style={{ padding: '1rem 0' }}>Đang tải danh sách lớp đã liên kết…</p>;
  }

  if (err) {
    return (
      <div>
        <p className="st-error">{err}</p>
        <button type="button" className="st-btn" style={{ marginTop: '0.6rem' }} onClick={load}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="st-empty" style={{ padding: '0.4rem 0' }}>
        Chưa liên kết lớp nào. Vào mục <b>Liên kết lớp</b> để nhập key chủ nhiệm gửi,
        sau đó lớp sẽ xuất hiện tại đây để bạn giao đề và giám sát.
      </p>
    );
  }

  return (
    <div className="st" style={{ gap: '0.6rem' }}>
      {items.map((item) => {
        const d = detail[item.classId];
        const isOpen = openClass === item.classId;
        const studentCount = item.cls?.members?.length || 0;
        return (
          <div key={item.classId} className="st-card" style={{ padding: '0.75rem 0.85rem' }}>
            <div className="st-card-head" style={{ marginBottom: '0.35rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem' }}>{item.cls?.name || item.className || item.classId}</h3>
                <span className="st-sub">
                  {item.subject ? <b>{item.subject}</b> : 'chưa rõ môn'}
                  {' · '}chủ nhiệm {item.cls?.teacherName || '—'}
                  {' · '}{studentCount} học sinh
                  {' · '}liên kết {fmtDate(toMs(item.linkedAt) || item.linkedAtMs)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="st-btn primary"
                  onClick={() => onAssign?.({
                    id: item.classId,
                    name: item.cls?.name || item.className || item.classId,
                    teacherId: item.cls?.teacherId || '',
                    teacherName: item.cls?.teacherName || '',
                    subject: item.subject || '',
                    members: item.cls?.members || [],
                  })}
                >
                  Giao đề
                </button>
                <button type="button" className="st-btn" onClick={() => openClassDetail(item)}>
                  {isOpen ? 'Thu gọn' : `Đề đã giao (${item.mine.length})`}
                </button>
              </div>
            </div>

            {item.classError && <p className="st-error">{item.classError}</p>}

            {isOpen && (
              d?.loading ? (
                <p className="st-empty sm">Đang tải đề và lượt nộp…</p>
              ) : item.mine.length === 0 ? (
                <p className="st-empty sm">
                  Bạn chưa giao đề nào cho lớp này. Bấm <b>Giao đề</b> để tạo đề — đề sẽ được ghi tên bạn
                  và chủ nhiệm theo dõi được trong mục Phân tích AI.
                </p>
              ) : (
                <div className="st-scroll">
                   <table className="st-table mobile-cards">
                     <thead>
                       <tr>
                         <th>Đề</th>
                         <th className="num">Trạng thái</th>
                         <th className="num">Bài nộp</th>
                         <th className="num">Điểm TB</th>
                         <th />
                       </tr>
                     </thead>
                    <tbody>
                      {item.mine.map((ex) => {
                        const subs = d?.subs?.[ex.id] || [];
                        const session = d?.sessions?.[ex.id];
                        const isLive = !!session && session.status === 'live';
                        const st = examStatus(ex);
                        const statusKey = isLive ? 'live' : st.code;
                        const statusLabel = isLive ? 'Đang thi' : st.label;
                        const scored = subs.map((s) => {
                          const p = pct(s);
                          return p === null ? null : { p, score: Number(s.score), total: Number(s.totalPoints) };
                        }).filter(Boolean);
                        const avg = scored.length
                          ? Math.round(scored.reduce((a, s) => a + s.p, 0) / scored.length)
                          : null;

                        return (
                          <tr key={ex.id}>
                             <td data-label="Đề">
                               <b>{ex.title || 'Đề'}</b>
                               <small className="st-mail">{ex.subject || item.subject || '—'}</small>
                             </td>
                             <td className="num" data-label="Trạng thái">
                               <span className={`st-badge tone-${STATUS_TONE[statusKey] || 'na'}`}>
                                 {statusLabel}
                               </span>
                             </td>
                             <td className="num" data-label="Bài nộp">{subs.length}</td>
                             <td className="num" data-label="Điểm TB">{avg === null ? '—' : `${avg}%`}</td>
                             <td>
                              <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                {session && session.status === 'live' ? (
                                  <button type="button" className="st-btn primary" onClick={() => onMonitor?.(session)}>
                                    Giám sát
                                  </button>
                                ) : confirmId === ex.id ? (
                                  <>
                                    <span className="st-keymeta" style={{ alignSelf: 'center' }}>
                                      Mở phòng thi trực tiếp?
                                    </span>
                                    <button
                                      type="button"
                                      className="st-btn primary"
                                      disabled={busy === ex.id}
                                      onClick={() => monitor(item, ex)}
                                    >
                                      {busy === ex.id ? 'Đang mở…' : 'Đồng ý'}
                                    </button>
                                    <button type="button" className="st-btn ghost" onClick={() => setConfirmId('')}>
                                      Hủy
                                    </button>
                                  </>
                                ) : (
                                  <button type="button" className="st-btn" onClick={() => setConfirmId(ex.id)}>
                                    Bắt đầu giám sát
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="st-btn"
                                  onClick={() => setEditCtx({ exam: ex, item })}
                                  title="Sửa thông tin, câu hỏi, thời gian, cấu hình camera & chống gian lận"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className="st-btn"
                                  onClick={() => setManageCtx({ exam: ex, item })}
                                  title="Gia hạn, đóng/mở đề, nhân bản, phân tích, chấm lại"
                                >
                                  Quản lý
                                </button>
                                <button
                                  type="button"
                                  className="st-btn ghost"
                                  onClick={() => setResultsOf(resultsOf === ex.id ? '' : ex.id)}
                                >
                                  {resultsOf === ex.id ? 'Ẩn kết quả' : 'Kết quả'}
                                </button>
                                <button
                                  type="button"
                                  className="st-btn ghost"
                                  style={{ color: '#b91c1c' }}
                                  title="Xoá đề khỏi lớp (không thể hoàn tác)"
                                  onClick={() => removeExam(item, ex)}
                                >
                                  Xoá
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {resultsOf && (() => {
                    const subs = (d?.subs?.[resultsOf] || []).slice().sort((a, b) => {
                      const pa = pct(a); const pb = pct(b);
                      if (pa === null && pb === null) return 0;
                      if (pa === null) return 1;
                      if (pb === null) return -1;
                      return pb - pa;
                    });
                    return (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div className="st-sub" style={{ marginBottom: '0.3rem' }}>
                          Kết quả đề “{item.mine.find((e) => e.id === resultsOf)?.title || 'Đề'}”
                          {' · '}{subs.length} bài nộp
                        </div>
                        {subs.length === 0 ? (
                          <p className="st-empty sm">Chưa có học sinh nào nộp bài.</p>
                        ) : (
                          <table className="st-exams">
                            <thead>
                              <tr>
                                <th>Học sinh</th>
                                <th className="num">Điểm</th>
                                <th className="num">%</th>
                                <th className="num">Nộp lúc</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subs.map((s) => (
                                <tr key={s.id}>
                                  <td>{s.studentName || s.studentEmail || s.studentId}</td>
                                  <td className="num">{Number(s.score)}/{Number(s.totalPoints)}</td>
                                  <td className="num">{pct(s) === null ? '—' : `${pct(s)}%`}</td>
                                  <td className="num">{fmtDateTime(toMs(s.submittedAt))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )
            )}
          </div>
        );
      })}

      <p className="st-empty sm">
        Đề giao từ đây có <b>classId</b> của lớp đã liên kết nên chủ nhiệm thấy ngay trong bảng giáo viên bộ môn
        và phần Phân tích AI. Phòng giám sát chỉ dành cho đề của chính bạn.
      </p>

      {/* Quản lý đề: gia hạn, đóng/mở, nhân bản, sửa nhanh, phân tích đáp án, chấm lại */}
      {manageCtx && (
        <Modal
          title={`Quản lý đề — ${manageCtx.exam.title || 'Đề'}`}
          size="lg"
          onClose={() => setManageCtx(null)}
        >
          <p className="st-empty sm" style={{ marginTop: 0 }}>
            Các thao tác dưới đây áp dụng cho đề <b>{manageCtx.exam.title || 'Đề'}</b> trong lớp{' '}
            <b>{manageCtx.item.cls?.name || manageCtx.item.className || manageCtx.item.classId}</b>.
          </p>
          <ExamManagePanel
            exam={manageCtx.exam}
            submissions={detail[manageCtx.item.classId]?.subs?.[manageCtx.exam.id] || []}
            toast={{
              success: (m) => onSay?.(m, 'success'),
              error: (m) => onSay?.(m, 'error'),
            }}
            onChanged={async () => {
              const item = manageCtx.item;
              await load();
              const data = await fetchClassDetail(item);
              setDetail((d) => ({ ...d, [item.classId]: data }));
            }}
          />
        </Modal>
      )}

      {/* Chỉnh sửa chi tiết đề đã giao: thông tin, câu hỏi, thời gian, camera & chống gian lận.
          Dùng lại ExamEditModal của dashboard; lớp bị khoá vào đúng lớp đã liên kết. */}
      {editCtx && (
        <ExamEditModal
          exam={editCtx.exam}
          classes={[{
            id: editCtx.item.classId,
            name: editCtx.item.cls?.name || editCtx.item.className || editCtx.item.classId,
          }]}
          onClose={() => setEditCtx(null)}
          onSaved={async () => {
            const item = editCtx.item;
            setEditCtx(null);
            await load();
            const data = await fetchClassDetail(item);
            setDetail((d) => ({ ...d, [item.classId]: data }));
          }}
        />
      )}
    </div>
  );
}
