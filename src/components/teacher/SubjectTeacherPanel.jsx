/* ============================================================
   SubjectTeacherPanel.jsx — GVCN quản lý giáo viên bộ môn (v3)
   ------------------------------------------------------------
   v3:
     • Tạo key BẮT BUỘC gán môn (chọn từ danh mục môn của AITK),
       tuỳ chọn gửi tới email người nhận, chọn số lượt dùng (mặc định 1).
     • Danh sách key hiển thị môn + người nhận + lượt dùng + hạn.
     • Bảng GVBM: tìm kiếm, lọc môn, trạng thái tài khoản, tỷ lệ tham gia,
       điểm TB, mở chi tiết đề đã giao.
     • Cảnh báo trùng môn (2 GVBM cùng 1 môn trong lớp).
     • Nhật ký thao tác (tạo/thu hồi key, liên kết, gỡ liên kết).
     • Khối lỗi có nút "Thử lại" ngay tại chỗ.
     • Hộp xác nhận rõ ràng trước khi Thu hồi key hoặc Gỡ giáo viên.
     • Thanh hoàn tác nhanh sau khi thu hồi key.
     • 100% icon SVG nét mảnh, không dùng emoji.
   ============================================================ */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createTeacherKey, revokeTeacherKey, listClassKeys, listClassTeachers,
  unlinkTeacher, buildTeacherActivity, keyStatus, listClassAudit,
  getTeacherAccountStatus, AUDIT_LABEL, toMs,
} from '../../lib/classTeachers.js';
import { SUBJECTS } from '../../lib/subjects.js';
import '../../styles/subject-teachers.css';
import '../../styles/teacher-profile-section.css';

const RANGES = [
  { key: '30', label: '30 ngày' },
  { key: '90', label: '90 ngày' },
  { key: 'all', label: 'Tất cả' },
];

const fmtDate = (ms) => {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return '—';
  }
};

const STATUS_TONE = { open: 'ex', closed: 'na', soon: 'mid', off: 'bad' };

/* ---------- SVG Icons (stroke-width 1.75) ---------- */
const SvgIcon = ({ size = 15, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0, verticalAlign: 'middle' }}
  >
    {children}
  </svg>
);

const IcoRefresh = (p) => (
  <SvgIcon {...p}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </SvgIcon>
);

const IcoCheck = (p) => (
  <SvgIcon {...p}>
    <polyline points="20 6 9 17 4 12" />
  </SvgIcon>
);

const IcoCopy = (p) => (
  <SvgIcon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </SvgIcon>
);

const IcoAlert = (p) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </SvgIcon>
);

const IcoUndo = (p) => (
  <SvgIcon {...p}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </SvgIcon>
);

export default function SubjectTeacherPanel({
  classId, className, exams = [], submissionsMap = {}, teacherId, classInfo = {}, onChanged,
}) {
  const [keys, setKeys] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [accounts, setAccounts] = useState({});
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [days, setDays] = useState(7);
  const [maxUses, setMaxUses] = useState(1);
  const [subject, setSubject] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [copied, setCopied] = useState('');

  const [range, setRange] = useState('all');
  const [fTeacher, setFTeacher] = useState('all');
  const [fSubject, setFSubject] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState('');

  /* Xác nhận trước khi Thu hồi key / Gỡ giáo viên & Hoàn tác */
  const [confirmState, setConfirmState] = useState(null);
  const [busyAction, setBusyAction] = useState(false);
  const [undoToast, setUndoToast] = useState(null);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setErr('');
    try {
      const [ks, ts, log] = await Promise.all([
        listClassKeys(classId),
        listClassTeachers(classId),
        listClassAudit(classId, 25),
      ]);
      setKeys(ks);
      setTeachers(ts);
      setAudit(log);

      if (ts.length) {
        try { setAccounts(await getTeacherAccountStatus(ts.map((t) => t.teacherId))); } catch { /* không chặn UI */ }
      } else {
        setAccounts({});
      }
    } catch (e) {
      setErr(e?.message || 'Không tải được danh sách giáo viên bộ môn.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const students = classInfo?.members?.length || 0;

  const activity = useMemo(() => buildTeacherActivity({
    classId,
    exams,
    submissionsMap,
    linkedTeachers: teachers,
    rangeDays: range,
    students,
    accountStatus: accounts,
    /* Chủ nhiệm lấy từ hồ sơ lớp, không suy ra từ người giao đề */
    ownerId: classInfo?.teacherId || '',
    ownerName: classInfo?.teacherName || '',
    ownerSubject: classInfo?.subject || '',
  }), [classId, exams, submissionsMap, teachers, range, students, accounts, classInfo?.teacherId, classInfo?.teacherName, classInfo?.subject]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activity.rows.filter((r) => {
      if (fTeacher !== 'all' && r.teacherId !== fTeacher) return false;
      if (fSubject !== 'all' && (r.subject || '') !== fSubject) return false;
      if (!q) return true;
      return `${r.teacherName} ${r.email} ${r.subject}`.toLowerCase().includes(q);
    });
  }, [activity.rows, fTeacher, fSubject, search]);

  /* ---------- hành động ---------- */
  const makeKey = async () => {
    setErr('');
    if (!subject.trim()) {
      setErr('Chọn môn học cho giáo viên trước khi tạo key — môn là bắt buộc.');
      return;
    }
    setCreating(true);
    try {
      const { key } = await createTeacherKey({
        classId,
        className,
        createdBy: teacherId,
        createdByName: classInfo?.teacherName || '',
        days,
        subject,
        email,
        maxUses,
      });
      setNewKey(key);
      setCopied('');
      await load();
      if (onChanged) onChanged();
    } catch (e) {
      setErr(e?.message || 'Không tạo được key.');
    } finally {
      setCreating(false);
    }
  };

  const copy = async (text, tag = 'new') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
    }
  };

  const requestRevoke = (keyItem) => {
    setConfirmState({
      type: 'revoke',
      keyItem,
      title: `Xác nhận thu hồi key "${keyItem.id}"?`,
      desc: `Key môn ${keyItem.subject || 'chưa gán'}${keyItem.email ? ` (${keyItem.email})` : ''} sẽ ngừng hiệu lực ngay và không thể dùng để liên kết thêm.`,
    });
  };

  const requestRemove = (row) => {
    setConfirmState({
      type: 'unlink',
      row,
      title: `Xác nhận gỡ liên kết giáo viên "${row.teacherName}"?`,
      desc: `Giáo viên bộ môn ${row.subject || 'này'} sẽ không còn trong danh sách phân công của lớp ${className || ''}. Các đề thi đã giao trước đó vẫn được giữ nguyên.`,
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmState) return;
    setBusyAction(true);
    setErr('');
    try {
      if (confirmState.type === 'revoke') {
        const k = confirmState.keyItem;
        await revokeTeacherKey(k.id, { by: teacherId, byName: classInfo?.teacherName || '', classId });
        setUndoToast({
          type: 'recreate-key',
          message: `Đã thu hồi key ${k.id} (${k.subject || 'Bộ môn'}).`,
          payload: {
            subject: k.subject || subject || 'Toán',
            email: k.email || '',
            days: 7,
            maxUses: Number(k.maxUses) || 1,
          },
        });
        await load();
      } else if (confirmState.type === 'unlink') {
        const r = confirmState.row;
        await unlinkTeacher(classId, r.teacherId, {
          by: teacherId, byName: classInfo?.teacherName || '', teacherName: r.teacherName,
        });
        setUndoToast({
          type: 'recreate-key',
          message: `Đã gỡ liên kết ${r.teacherName} (${r.subject || 'Bộ môn'}). Bạn có thể cấp lại key liên kết mới nếu gỡ nhầm.`,
          payload: {
            subject: r.subject || 'Toán',
            email: r.email || '',
            days: 7,
            maxUses: 1,
          },
        });
        await load();
        if (onChanged) onChanged();
      }
      setConfirmState(null);
    } catch (e) {
      setErr(
        confirmState.type === 'revoke'
          ? e?.message || 'Không thu hồi được key.'
          : e?.message || 'Không gỡ liên kết được.'
      );
    } finally {
      setBusyAction(false);
    }
  };

  const handleUndoRecreateKey = async () => {
    if (!undoToast?.payload) return;
    const { subject: s, email: em, days: d, maxUses: m } = undoToast.payload;
    setUndoToast(null);
    setCreating(true);
    setErr('');
    try {
      const { key } = await createTeacherKey({
        classId,
        className,
        createdBy: teacherId,
        createdByName: classInfo?.teacherName || '',
        days: d || 7,
        subject: s || 'Toán',
        email: em || '',
        maxUses: m || 1,
      });
      setNewKey(key);
      await load();
      if (onChanged) onChanged();
    } catch (e) {
      setErr(e?.message || 'Không thể cấp lại key mới.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="st-state">Đang tải giáo viên bộ môn…</div>;

  const t = activity.total;
  const usableKeys = keys.filter((k) => keyStatus(k).code === 'active').length;
  const subjectList = [...new Set([
    ...SUBJECTS.map((s) => s.label),
    ...teachers.map((x) => x.subject).filter(Boolean),
  ])];
  const linkedSubjects = [...new Set(activity.linked.map((r) => r.subject).filter(Boolean))];

  return (
    <div className="st">
      {err && (
        <div className="st-error st-error-with-retry" role="alert">
          <div className="st-error-msg">
            <IcoAlert size={16} />
            <span>{err}</span>
          </div>
          <button
            type="button"
            className="st-btn st-retry-btn"
            onClick={load}
            disabled={loading}
          >
            <IcoRefresh size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {confirmState && (
        <div className="st-confirm-banner" role="alertdialog" aria-labelledby="st-confirm-title">
          <div className="st-confirm-body">
            <strong id="st-confirm-title">{confirmState.title}</strong>
            <p>{confirmState.desc}</p>
          </div>
          <div className="st-confirm-actions">
            <button
              type="button"
              className="st-btn st-btn-danger"
              onClick={executeConfirmedAction}
              disabled={busyAction}
            >
              {busyAction ? 'Đang xử lý…' : 'Xác nhận thực hiện'}
            </button>
            <button
              type="button"
              className="st-btn ghost"
              onClick={() => setConfirmState(null)}
              disabled={busyAction}
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}

      {undoToast && (
        <div className="st-undo-banner" role="status">
          <span>{undoToast.message}</span>
          <div className="st-undo-actions">
            <button
              type="button"
              className="st-btn primary"
              onClick={handleUndoRecreateKey}
              disabled={creating}
            >
              <IcoUndo size={14} />
              <span>Hoàn tác (Cấp lại key)</span>
            </button>
            <button
              type="button"
              className="st-btn ghost"
              onClick={() => setUndoToast(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <div className="st-kpis">
        <div className="st-kpi">
          <small>Giáo viên bộ môn</small>
          <b>{t.teachers}</b>
          <span>{t.teachersActive} đã giao đề</span>
        </div>
        <div className="st-kpi">
          <small>Tổng đề đã giao</small>
          <b>{t.examsAll}</b>
          <span>gồm cả đề của chủ nhiệm</span>
        </div>
        <div className="st-kpi">
          <small>Đề của GVBM</small>
          <b>{t.examsLinked}</b>
          <span>{t.emptyExams} đề chưa có bài nộp</span>
        </div>
        <div className="st-kpi">
          <small>Key còn hiệu lực</small>
          <b>{usableKeys}</b>
          <span>{keys.length} key đã tạo</span>
        </div>
      </div>

      {activity.duplicateSubjects.length > 0 && (
        <div className="st-warn">
          <b>Cảnh báo trùng môn:</b>{' '}
          {activity.duplicateSubjects.map((d) => `${d.subject} (${d.count} giáo viên)`).join(' · ')}.
          Kiểm tra lại phân công để tránh trùng khi theo dõi kết quả.
        </div>
      )}

      {/* ---------- Tạo key ---------- */}
      <div className="st-card">
        <div className="st-card-head">
          <h3>Key liên kết lớp {className}</h3>
          <span className="st-sub">Mỗi key dùng 1 lần, gắn sẵn môn học, có hạn và thu hồi được</span>
        </div>

        <div className="st-keymaker">
          <label>
            Môn học <em className="st-req">*</em>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} required>
              <option value="">— Chọn môn —</option>
              {subjectList.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Gửi tới email (tuỳ chọn)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gv@truong.edu.vn"
              maxLength={120}
            />
          </label>
          <label>
            Hạn dùng
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={1}>1 ngày</option>
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
            </select>
          </label>
          <label>
            Số lượt dùng
            <select value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))}>
              <option value={1}>1 lượt</option>
              <option value={2}>2 lượt</option>
              <option value={5}>5 lượt</option>
            </select>
          </label>
          <button type="button" className="st-btn primary" onClick={makeKey} disabled={creating || !subject}>
            {creating ? 'Đang tạo…' : 'Tạo key mới'}
          </button>
          {newKey && (
            <div className="st-newkey">
              <code>{newKey}</code>
              <button type="button" className="st-btn" onClick={() => copy(newKey, 'new')}>
                {copied === 'new' ? 'Đã copy' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        <p className="st-empty sm">
          Gửi key này cho giáo viên bộ môn môn <b>{subject || '…'}</b>. Giáo viên nhập key bằng tài khoản riêng
          của họ — hệ thống kiểm tra lại hạn dùng, số lượt và quyền của người tạo key ở phía server.
        </p>

        {keys.length === 0 ? (
          <p className="st-empty">Chưa có key nào. Chọn môn rồi bấm “Tạo key mới”.</p>
        ) : (
          <ul className="st-keys">
            {keys.map((k) => {
              const st = keyStatus(k);
              const uses = Number(k.uses) || 0;
              const max = Number(k.maxUses) || 1;
              return (
                <li key={k.id}>
                  <code>{k.id}</code>
                  <span className={`st-badge tone-${st.tone}`}>{st.label}</span>
                  <span className="st-keymeta">
                    {k.subject ? <b>{k.subject}</b> : <span className="st-muted">chưa gán môn</span>}
                    {k.email ? <small> · {k.email}</small> : null}
                    <small> · {uses}/{max} lượt · hết hạn {fmtDate(toMs(k.expiresAt))}</small>
                  </span>
                  {st.code === 'active' && (
                    <button
                      type="button"
                      className="st-btn ghost"
                      onClick={() => requestRevoke(k)}
                    >
                      Thu hồi
                    </button>
                  )}
                  <button type="button" className="st-btn ghost" onClick={() => copy(k.id, k.id)}>
                    {copied === k.id ? <IcoCheck size={14} /> : <IcoCopy size={14} />}
                    <span style={{ marginLeft: 4 }}>{copied === k.id ? 'Đã copy' : 'Copy'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---------- Bảng giáo viên ---------- */}
      <div className="st-card">
        <div className="st-card-head">
          <h3>Hoạt động ra đề của giáo viên bộ môn</h3>
          <div className="st-filters">
            <input
              type="search"
              className="st-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm giáo viên…"
              aria-label="Tìm giáo viên"
            />
            <select value={fTeacher} onChange={(e) => setFTeacher(e.target.value)} aria-label="Lọc giáo viên">
              <option value="all">Tất cả giáo viên</option>
              {activity.rows.map((r) => (
                <option key={r.teacherId} value={r.teacherId}>{r.teacherName}</option>
              ))}
            </select>
            {linkedSubjects.length > 0 && (
              <select value={fSubject} onChange={(e) => setFSubject(e.target.value)} aria-label="Lọc môn">
                <option value="all">Tất cả môn</option>
                {linkedSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <div className="st-ranges">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`st-range${range === r.key ? ' on' : ''}`}
                  onClick={() => setRange(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="st-empty">
            Chưa có giáo viên bộ môn nào liên kết (hoặc không khớp bộ lọc). Tạo key ở trên và gửi cho giáo viên —
            sau khi họ nhập key, danh sách và số đề sẽ hiện tại đây.
          </p>
        ) : (
          <div className="st-scroll">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Giáo viên</th>
                  <th>Môn</th>
                  <th className="num">Số đề</th>
                  <th className="num">Bài nộp</th>
                  <th className="num">Tham gia</th>
                  <th className="num">Điểm TB</th>
                  <th>Trạng thái</th>
                  <th className="num">Liên kết từ</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Fragment key={r.teacherId}>
                    <tr className={open === r.teacherId ? 'is-open' : ''}>
                      <td>
                        <button type="button" className="st-name" onClick={() => setOpen(open === r.teacherId ? '' : r.teacherId)}>
                          {r.teacherName}
                          {r.isOwner && <em>chủ nhiệm</em>}
                        </button>
                        {r.email && <small className="st-mail">{r.email}</small>}
                      </td>
                      <td>{r.subject || <span className="st-muted">chưa ghi</span>}</td>
                      <td className="num"><b>{r.examCount}</b></td>
                      <td className="num">{r.submissions}</td>
                      <td className="num">{r.participation === null ? '—' : `${r.participation}%`}</td>
                      <td className="num">{r.avgPct === null ? '—' : `${r.avgPct}%`}</td>
                      <td>
                        <span className={`st-badge tone-${r.status.tone}`}>{r.status.label}</span>
                      </td>
                      <td className="num">{r.linkedAt ? fmtDate(r.linkedAt) : '—'}</td>
                      <td className="num">
                        {!r.isOwner && (
                          <button type="button" className="st-btn ghost" onClick={() => requestRemove(r)}>
                            Gỡ
                          </button>
                        )}
                      </td>
                    </tr>
                    {open === r.teacherId && (
                      <tr key={`${r.teacherId}-detail`} className="st-detail">
                        <td colSpan={9}>
                          {r.exams.length === 0 ? (
                            <p className="st-empty sm">Chưa giao đề nào cho lớp trong khoảng này.</p>
                          ) : (
                            <table className="st-exams">
                              <thead>
                                <tr>
                                  <th>Đề</th>
                                  <th>Môn</th>
                                  <th className="num">Câu</th>
                                  <th className="num">Giao lúc</th>
                                  <th>Trạng thái</th>
                                  <th className="num">Bài nộp</th>
                                  <th className="num">TB</th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.exams.map((e) => (
                                  <tr key={e.id}>
                                    <td>{e.title}</td>
                                    <td>{e.subject || '—'}</td>
                                    <td className="num">{e.questions}</td>
                                    <td className="num">{fmtDate(e.createdAt || e.opensAt)}</td>
                                    <td><span className={`st-badge tone-${STATUS_TONE[e.status.code] || 'na'}`}>{e.status.label}</span></td>
                                    <td className="num">{e.submissions}</td>
                                    <td className="num">{e.avgPct === null ? '—' : `${e.avgPct}%`}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Tổng cộng</th>
                  <th />
                  <th className="num">{rows.reduce((a, r) => a + r.examCount, 0)}</th>
                  <th className="num">{rows.reduce((a, r) => a + r.submissions, 0)}</th>
                  <th colSpan={5} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="st-empty sm">
          Trạng thái tài khoản lấy từ hồ sơ người dùng. Số đề chỉ phản ánh hoạt động kiểm tra,
          không dùng để đánh giá năng lực giảng dạy.
        </p>
      </div>

      {/* ---------- Nhật ký ---------- */}
      <details className="st-card st-audit">
        <summary>Nhật ký thao tác ({audit.length})</summary>
        {audit.length === 0 ? (
          <p className="st-empty">Chưa có hoạt động nào.</p>
        ) : (
          <ul className="st-audit-list">
            {audit.map((a) => (
              <li key={a.id}>
                <span className="st-badge tone-na">{AUDIT_LABEL[a.action] || a.action}</span>
                <span>{a.actorName || a.teacherName || '—'}</span>
                <small>{a.detail || a.subject}</small>
                <em>{fmtDate(toMs(a.at) || a.atMs)}</em>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
