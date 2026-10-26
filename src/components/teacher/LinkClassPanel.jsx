/* ============================================================
   LinkClassPanel.jsx — giáo viên bộ môn tự liên kết với lớp
   ------------------------------------------------------------
   Nhập key do giáo viên chủ nhiệm gửi → tạo liên kết
   class_teachers/{classId}_{uid}. Mọi kiểm tra (key tồn tại,
   chưa thu hồi, chưa hết hạn, đúng lớp, không phải chủ lớp)
   được lặp lại ở firestore.rules khi ghi dữ liệu.
   ============================================================ */

import { useCallback, useEffect, useState } from 'react';
import { linkTeacherWithKey, listMyLinkedClasses, unlinkTeacher } from '../../lib/classTeachers.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import '../../styles/subject-teachers.css';

const fmt = (ms) => {
  if (!ms) return '—';
  try { return new Date(ms).toLocaleDateString('vi-VN'); } catch { return '—'; }
};
const toMs = (v) => {
  if (!v) return 0;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  return 0;
};

export default function LinkClassPanel() {
  const { user } = useAuth();
  const [key, setKey] = useState('');
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text}
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      setRows(await listMyLinkedClasses(user.uid));
    } catch (e) {
      setMsg({ type: 'err', text: e?.message || 'Không tải được danh sách lớp đã liên kết.' });
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await linkTeacherWithKey(key, user, subject);
      setMsg({ type: 'ok', text: `Đã liên kết lớp ${res.className || res.classId}. Từ giờ đề bạn giao cho lớp này sẽ được chủ nhiệm theo dõi.` });
      setKey('');
      await load();
    } catch (e) {
      setMsg({ type: 'err', text: e?.message || 'Liên kết thất bại.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    try {
      await unlinkTeacher(row.classId, user.uid, {
        by: user.uid,
        byName: user.displayName || user.email || 'Giáo viên',
        teacherName: user.displayName || user.email || 'Giáo viên',
        subject: row.subject || '',
      });
      await load();
      setMsg({ type: 'ok', text: `Đã gỡ liên kết lớp ${row.className || row.classId}.` });
    } catch (e) {
      setMsg({ type: 'err', text: e?.message || 'Không gỡ được liên kết.' });
    }
  };

  return (
    <div className="st" style={{ padding: '1.1rem 1.15rem 2rem', maxWidth: 860 }}>
      <div className="st-card">
        <div className="st-card-head">
          <h3>Liên kết lớp học</h3>
          <span className="st-sub">Dùng key do giáo viên chủ nhiệm cấp</span>
        </div>

        <p className="st-empty" style={{ marginTop: 0 }}>
          Nhập key để chủ nhiệm thấy được các đề bạn giao cho lớp. Mỗi key <b>chỉ dùng một lần</b>,
          gắn sẵn môn học và có hạn — dạy 3 lớp thì xin 3 key. Liên kết <b>không</b> cấp quyền quản trị lớp.
        </p>

        <div className="st-keymaker" style={{ marginTop: '0.7rem' }}>
          <label style={{ flex: '1 1 200px' }}>
            Key liên kết
            <input
              value={key}
              onChange={(e) => { setKey(e.target.value.toUpperCase()); setMsg(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder="GV-XXXXXX"
              style={{
                padding: '0.55rem 0.7rem', borderRadius: 10, border: '1px solid var(--st-line)',
                fontFamily: 'ui-monospace, Menlo, Consolas, monospace', letterSpacing: '0.06em',
                background: 'var(--st-card)', color: 'var(--st-ink)', fontSize: '0.95rem',
              }}
              autoFocus
            />
          </label>
          <label style={{ flex: '0 1 190px' }}>
            Môn (chỉ cần với key cũ)
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Chủ nhiệm đã gán môn trong key"
              maxLength={40}
              style={{
                padding: '0.5rem 0.7rem', borderRadius: 10, border: '1px solid var(--st-line)',
                background: 'var(--st-card)', color: 'var(--st-ink)', fontSize: '0.88rem',
              }}
            />
          </label>
          <button type="button" className="st-btn primary" onClick={submit} disabled={busy || !key.trim()}>
            {busy ? 'Đang liên kết…' : 'Liên kết'}
          </button>
        </div>

        {msg && (
          <p
            className={msg.type === 'err' ? 'st-error' : 'st-badge tone-ex'}
            style={{ marginTop: '0.7rem', display: 'block', lineHeight: 1.5 }}
          >
            {msg.text}
          </p>
        )}
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <h3>Lớp đã liên kết</h3>
          <span className="st-sub">{rows.length} lớp</span>
        </div>

        {loading ? (
          <p className="st-empty">Đang tải…</p>
        ) : rows.length === 0 ? (
          <p className="st-empty">Chưa liên kết lớp nào. Nhập key ở trên để bắt đầu.</p>
        ) : (
          <ul className="st-keys">
            {rows.map((r) => (
              <li key={r.id} style={{ gridTemplateColumns: '1fr auto auto auto' }}>
                <span>
                  <b>{r.className || r.classId}</b>
                  <small style={{ display: 'block' }}>
                    {r.subject ? `${r.subject} · ` : ''}liên kết {fmt(toMs(r.linkedAt))}
                  </small>
                </span>
                <span className="st-badge tone-ex">đang liên kết</span>
                <span />
                <button type="button" className="st-btn ghost" onClick={() => remove(r)}>Gỡ</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
