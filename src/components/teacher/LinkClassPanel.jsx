/* ============================================================
   LinkClassPanel.jsx — giáo viên bộ môn tự liên kết với lớp (v2)
   ------------------------------------------------------------
   Nhập key do giáo viên chủ nhiệm gửi → tạo liên kết
   class_teachers/{classId}_{uid}. Có tìm kiếm lớp đã liên kết,
   hộp xác nhận khi gỡ liên kết, và nút Thử lại khi lỗi mạng.
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { linkTeacherWithKey, listMyLinkedClasses, unlinkTeacher } from '../../lib/classTeachers.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import '../../styles/subject-teachers.css';

const fmt = (ms) => {
  if (!ms) return '—';
  try { return new Date(ms).toLocaleDateString('vi-VN'); } catch { return '—'; }
};
const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
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
  const [loadErr, setLoadErr] = useState('');
  const [search, setSearch] = useState('');
  const [confirmUnlink, setConfirmUnlink] = useState(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setLoadErr('');
    try {
      setRows(await listMyLinkedClasses(user.uid));
    } catch (e) {
      setLoadErr(e?.message || 'Không tải được danh sách lớp đã liên kết. Vui lòng kiểm tra kết nối mạng.');
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
      setMsg({ type: 'err', text: e?.message || 'Liên kết thất bại. Hãy kiểm tra lại mã key hoặc hạn dùng.' });
    } finally {
      setBusy(false);
    }
  };

  const executeUnlink = async () => {
    const row = confirmUnlink;
    if (!row) return;
    setConfirmUnlink(null);
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

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.className || ''} ${r.classId || ''} ${r.subject || ''}`.toLowerCase().includes(q));
  }, [rows, search]);

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
            {busy ? 'Đang liên kết…' : 'Liên kết ngay'}
          </button>
        </div>

        {msg && (
          <p
            className={msg.type === 'err' ? 'st-error' : 'st-badge tone-ex'}
            role="status"
            style={{ marginTop: '0.7rem', display: 'block', lineHeight: 1.5 }}
          >
            {msg.text}
          </p>
        )}
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <h3>Lớp đã liên kết</h3>
            <span className="st-sub">{rows.length} lớp đang kết nối</span>
          </div>
          {rows.length > 1 && (
            <input
              type="search"
              className="st-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm lớp hoặc môn…"
              aria-label="Tìm lớp đã liên kết"
            />
          )}
        </div>

        {loadErr ? (
          <div style={{ padding: '0.75rem 0' }}>
            <p className="st-error">{loadErr}</p>
            <button type="button" className="st-btn primary" style={{ marginTop: '0.5rem' }} onClick={load}>
              Thử lại
            </button>
          </div>
        ) : loading ? (
          <p className="st-empty">Đang tải danh sách lớp liên kết…</p>
        ) : rows.length === 0 ? (
          <p className="st-empty">Chưa liên kết lớp nào. Nhập key ở trên để bắt đầu.</p>
        ) : filteredRows.length === 0 ? (
          <p className="st-empty">Không có lớp nào khớp từ khóa “{search}”.</p>
        ) : (
          <ul className="st-keys">
            {filteredRows.map((r) => (
              <li key={r.id} style={{ gridTemplateColumns: '1fr auto auto auto' }}>
                <span>
                  <b>{r.className || r.classId}</b>
                  <small style={{ display: 'block' }}>
                    {r.subject ? `${r.subject} · ` : ''}liên kết ngày {fmt(toMs(r.linkedAt))}
                  </small>
                </span>
                <span className="st-badge tone-ex">Đang liên kết</span>
                <span />
                <button type="button" className="st-btn ghost" onClick={() => setConfirmUnlink(r)}>
                  Gỡ liên kết
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmUnlink && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={() => setConfirmUnlink(null)}
        >
          <div
            className="st-card"
            style={{ maxWidth: 420, width: '100%', margin: 0, padding: '1.1rem 1.25rem' }}
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận gỡ liên kết lớp"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Gỡ liên kết lớp {confirmUnlink.className || confirmUnlink.classId}?</h3>
            <p className="st-empty" style={{ margin: '0.5rem 0 1rem' }}>
              Sau khi gỡ, bạn sẽ cần key mới từ giáo viên chủ nhiệm nếu muốn liên kết lại với lớp này.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="st-btn" onClick={() => setConfirmUnlink(null)}>Hủy</button>
              <button type="button" className="st-btn primary" onClick={executeUnlink}>Xác nhận gỡ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
