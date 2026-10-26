/* ============================================================
   SubjectTeacherPanel.jsx — GVCN quản lý giáo viên bộ môn (v2)
   ------------------------------------------------------------
   v2:
     • Tạo key BẮT BUỘC gán môn (chọn từ danh mục môn của AITK),
       tuỳ chọn gửi tới email người nhận, chọn số lượt dùng (mặc định 1).
     • Danh sách key hiển thị môn + người nhận + lượt dùng + hạn.
     • Bảng GVBM: tìm kiếm, lọc môn, trạng thái tài khoản, tỷ lệ tham gia,
       điểm TB, mở chi tiết đề đã giao.
     • Cảnh báo trùng môn (2 GVBM cùng 1 môn trong lớp).
     • Nhật ký thao tác (tạo/thu hồi key, liên kết, gỡ liên kết).
     • Chỉ tính đề có classId === lớp hiện tại.
   ============================================================ */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createTeacherKey, revokeTeacherKey, listClassKeys, listClassTeachers,
  unlinkTeacher, buildTeacherActivity, keyStatus, listClassAudit,
  getTeacherAccountStatus, AUDIT_LABEL, toMs,
} from '../../lib/classTeachers.js';
import { SUBJECTS } from '../../lib/subjects.js';
import '../../styles/subject-teachers.css';

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

  const revoke = async (key) => {
    try {
      await revokeTeacherKey(key, { by: teacherId, byName: classInfo?.teacherName || '', classId });
      await load();
    } catch (e) {
      setErr(e?.message || 'Không thu hồi được key.');
    }
  };

  const remove = async (row) => {
    try {
      await unlinkTeacher(classId, row.teacherId, {
        by: teacherId, byName: classInfo?.teacherName || '', teacherName: row.teacherName,
      });
      await load();
      if (onChanged) onChanged();
    } catch (e) {
      setErr(e?.message || 'Không gỡ liên kết được.');
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
      {err && <div className="st-error">{err}</div>}

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
                    <button type="button" className="st-btn ghost" onClick={() => revoke(k.id)}>Thu hồi</button>
                  )}
                  <button type="button" className="st-btn ghost" onClick={() => copy(k.id, k.id)}>
                    {copied === k.id ? '✓' : 'Copy'}
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
                          <button type="button" className="st-btn ghost" onClick={() => remove(r)}>Gỡ</button>
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
