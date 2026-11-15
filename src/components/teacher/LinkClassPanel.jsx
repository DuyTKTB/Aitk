/* ============================================================
   LinkClassPanel.jsx — Giáo viên bộ môn nhập key liên kết lớp
   ------------------------------------------------------------
   • Chuẩn hóa key tự động (vd "GV - AB1234" → "GV-AB1234").
   • Phát hiện thông minh nếu giáo viên nhập nhầm Mã lớp học sinh.
   • Đọc trước thông tin lớp & phân môn từ key (previewTeacherKey)
     và chỉ hiện ô nhập môn nếu key cũ (v1) chưa gán sẵn môn.
   • Hỗ trợ hideList=true khi nhúng vào Hub hợp nhất để tránh
     lặp danh sách lớp đã liên kết.
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  classifyKeyInput,
  linkTeacherWithKey,
  listMyLinkedClasses,
  normalizeTeacherKey,
  previewTeacherKey,
  unlinkTeacher,
} from '../../lib/classTeachers.js';
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

const daysLeft = (expMs) => {
  if (!expMs) return null;
  const diff = expMs - Date.now();
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / 86400000));
};

export default function LinkClassPanel({
  onLinked,
  hideList = false,
  knownClasses = [],
  onJumpToClass,
  highlighted = false,
}) {
  const { user } = useAuth();
  const [key, setKey] = useState('');
  const [subject, setSubject] = useState('');
  const [needManualSubject, setNeedManualSubject] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'err', text }
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(!hideList);
  const [loadErr, setLoadErr] = useState('');
  const [search, setSearch] = useState('');
  const [confirmUnlink, setConfirmUnlink] = useState(null);

  const load = useCallback(async () => {
    if (hideList || !user?.uid) return;
    setLoading(true);
    setLoadErr('');
    try {
      setRows(await listMyLinkedClasses(user.uid));
    } catch (e) {
      setLoadErr(e?.message || 'Không tải được danh sách lớp đã liên kết. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  }, [hideList, user?.uid]);

  useEffect(() => {
    if (!hideList) load();
  }, [hideList, load]);

  const classification = useMemo(
    () => classifyKeyInput(key, knownClasses),
    [key, knownClasses],
  );

  /* Kiểm tra xem trước key GV-... (read-only) khi giáo viên nhập đủ định dạng */
  useEffect(() => {
    if (classification.kind !== 'gv-key' || !user?.uid) {
      setPreview(null);
      setPreviewBusy(false);
      return undefined;
    }

    let cancelled = false;
    setPreviewBusy(true);
    const timer = setTimeout(async () => {
      try {
        const res = await previewTeacherKey(classification.normalized, user);
        if (!cancelled) {
          setPreview(res);
          setNeedManualSubject(Boolean(res?.ok && res?.needsSubject));
        }
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewBusy(false);
      }
    }, 240);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [classification.kind, classification.normalized, user]);

  const submit = async () => {
    const normalized = normalizeTeacherKey(key);
    if (!normalized) return;

    if (classification.kind === 'known-class' && classification.matchedClass) {
      onJumpToClass?.(classification.matchedClass);
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await linkTeacherWithKey(normalized, user, subject);
      setMsg({
        type: 'ok',
        text: `Đã liên kết lớp ${res.className || res.classId}${res.subject ? ` (Môn ${res.subject})` : ''}. Lớp đã sẵn sàng để giao đề và giám sát.`,
      });
      setKey('');
      setSubject('');
      setPreview(null);
      setNeedManualSubject(false);
      if (!hideList) await load();
      onLinked?.(res);
    } catch (e) {
      const errText = e?.message || 'Liên kết thất bại. Hãy kiểm tra lại mã key hoặc hạn dùng.';
      if (errText.toLowerCase().includes('chưa gán môn')) {
        setNeedManualSubject(true);
      }
      setMsg({ type: 'err', text: errText });
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
      onLinked?.();
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

  const showSubjectInput = needManualSubject || Boolean(preview?.ok && preview?.needsSubject);
  const expDays = daysLeft(preview?.expiresAtMs);

  const canSubmit = Boolean(classification.normalized)
    && !busy
    && classification.kind !== 'student-code'
    && !(preview && !preview.ok && preview.code !== 'missing');

  return (
    <div className={hideList ? 'gvbm-connect-wrap' : 'st gvbm-connect-standalone'}>
      <section className={`gvbm-connect-card${highlighted ? ' is-highlighted' : ''}`} aria-label="Nhận lớp mới bằng Key GVBM">
        <div className="gvbm-connect-head">
          <div>
            <span className="gvbm-pill-tag">Liên kết bộ môn</span>
            <h3>Nhận lớp bằng Key GVBM</h3>
          </div>
        </div>

        <p className="gvbm-connect-desc">
          Nhập mã liên kết dạng <code>GV-XXXXXX</code> do Giáo viên Chủ nhiệm cấp trong mục <b>GV bộ môn</b>.
          Hệ thống tự gắn đúng lớp &amp; phân môn, không làm thay đổi quyền chủ nhiệm gốc.
        </p>

        <div className="gvbm-input-stack">
          <label className="gvbm-field">
            <span>Key liên kết từ GVCN</span>
            <div className="gvbm-key-row">
              <input
                type="text"
                data-gvbm-key-input="true"
                className="gvbm-key-input"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value.toUpperCase());
                  setMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit) submit();
                }}
                placeholder="GV-XXXXXX"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="vt-btn sm primary"
                onClick={submit}
                disabled={!canSubmit}
              >
                {busy
                  ? 'Đang xử lý…'
                  : preview?.ok
                    ? `Nhận lớp ${preview.className || ''}`.trim()
                    : 'Liên kết ngay'}
              </button>
            </div>
          </label>

          {showSubjectInput && (
            <label className="gvbm-field">
              <span>Môn học bạn giảng dạy <em className="st-req">*</em></span>
              <input
                type="text"
                className="gvbm-text-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="VD: Toán học, Vật lý, Ngữ văn…"
                maxLength={40}
              />
            </label>
          )}
        </div>

        {/* Kiểm tra nhanh thông tin key hoặc phát hiện nhập nhầm mã lớp học sinh */}
        {classification.kind === 'known-class' && classification.matchedClass && (
          <div className="gvbm-hint-box is-ok">
            <div>
              <strong>Lớp {classification.matchedClass.name} đã có trong tài khoản của bạn</strong>
              <small>Bạn nhập mã tham gia học sinh của lớp đã liên kết/sở hữu — bấm để soạn đề ngay.</small>
            </div>
            {onJumpToClass && (
              <button
                type="button"
                className="vt-btn sm primary"
                onClick={() => onJumpToClass(classification.matchedClass)}
              >
                Giao đề ngay →
              </button>
            )}
          </div>
        )}

        {classification.kind === 'student-code' && (
          <div className="gvbm-hint-box is-warn" role="status">
            <div>
              <strong>Đây giống mã lớp học sinh ({classification.normalized})</strong>
              <small>
                Mã lớp học sinh không dùng để liên kết GVBM. Hãy nhờ GV chủ nhiệm vào{' '}
                <b>Chi tiết lớp → GV bộ môn</b> để tạo key dạng <code>GV-XXXXXX</code>.
              </small>
            </div>
          </div>
        )}

        {previewBusy && classification.kind === 'gv-key' && (
          <div className="gvbm-preview-loading">Đang xác thực mã key…</div>
        )}

        {!previewBusy && preview && (
          preview.ok ? (
            <div className="gvbm-preview-card is-valid" role="status">
              <div className="gvbm-preview-top">
                <span className="gvbm-preview-check" aria-hidden="true">✓</span>
                <div>
                  <strong>Lớp {preview.className || preview.classId}</strong>
                  <small>
                    {preview.subject ? `Môn: ${preview.subject}` : 'Key chưa gán sẵn môn'}
                    {preview.teacherName ? ` · GVCN: ${preview.teacherName}` : ''}
                  </small>
                </div>
              </div>
              <div className="gvbm-preview-meta">
                {expDays !== null && <span>Còn hạn {expDays} ngày</span>}
                <span>Còn {preview.remainingUses} lượt</span>
              </div>
            </div>
          ) : (
            <div className="gvbm-hint-box is-err" role="status">
              <div>
                <strong>Không thể dùng key này</strong>
                <small>{preview.message}</small>
              </div>
            </div>
          )
        )}

        {msg && (
          <div
            className={`gvbm-hint-box ${msg.type === 'err' ? 'is-err' : 'is-ok'}`}
            role="status"
          >
            <div>
              <strong>{msg.type === 'err' ? 'Liên kết chưa thành công' : 'Liên kết thành công'}</strong>
              <small>{msg.text}</small>
            </div>
          </div>
        )}

        <div className="gvbm-rule-footnote">
          <span>Mỗi key gắn cố định 1 lớp &amp; 1 phân môn, mặc định dùng 1 lần.</span>
          <span>Dạy nhiều lớp cần key riêng cho từng lớp.</span>
        </div>
      </section>

      {!hideList && (
        <div className="st-card" style={{ marginTop: '0.85rem' }}>
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
      )}

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
