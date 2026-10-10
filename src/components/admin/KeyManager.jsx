/* ============================================================
   KeyManager.jsx — Quản lý Key PRO cho giáo viên
   ------------------------------------------------------------
   • Tạo key đơn / hàng loạt
   • Danh sách key: mã, hạn, người dùng, trạng thái
   • Filter: tất cả / chưa dùng / đang dùng / thu hồi
   • Search theo mã
   • Actions: copy, revoke, delete, copy nhiều
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  adminCreateProKey,
  adminCreateProKeyBatch,
  adminGetKeys,
  adminDeleteKey,
  adminRevokeKey,
} from '../../lib/proKeyApi.js';
import AdminShell, {
  Topbar, Modal, ConfirmDialog, Avatar, Donut,
  tsMs, downloadCsv,
} from './AdminShell.jsx';
import {
  IconKey, IconCrown, IconPlus, IconTrash, IconCopy, IconCheck,
  IconCalendar, IconSearch, IconRefresh, IconRevoke, IconUserCheck,
} from './AdminIcons.jsx';

const DURATION_PRESETS = [7, 30, 90, 180, 365];

const STATUS_TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'unused',   label: 'Chưa dùng' },
  { key: 'active',   label: 'Đang dùng' },
  { key: 'revoked',  label: 'Đã thu hồi' },
];

/* ---------- HELPERS ---------- */
const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fallback */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

export default function KeyManager() {
  const { user } = useAuth();
  const [section, setSection] = useState('keys');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);

  const say = useCallback((text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ---------- LOAD ---------- */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminGetKeys({ status: tab, search });
      setKeys(list);
    } catch (e) {
      say('Lỗi tải danh sách: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, search, say]);

  useEffect(() => { load(); }, [load]);

  /* ---------- DERIVED ---------- */
  const stats = useMemo(() => {
    const now = Date.now();
    const total = keys.length;
    const unused = keys.filter((k) => !k.used_by && !k.revoked).length;
    const active = keys.filter((k) => k.used_by && !k.revoked).length;
    const revoked = keys.filter((k) => k.revoked).length;
    return { total, unused, active, revoked };
  }, [keys]);

  const tabCounts = useMemo(() => ({
    all: stats.total,
    unused: stats.unused,
    active: stats.active,
    revoked: stats.revoked,
  }), [stats]);

  /* ---------- ACTIONS ---------- */
  const handleCopy = async (code, id) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedId(id);
      say('Đã chép ' + code);
      setTimeout(() => setCopiedId(null), 1500);
    } else {
      say('Không chép được, hãy copy thủ công.');
    }
  };

  const handleRevoke = (key) => {
    setConfirm({
      title: 'Thu hồi key?',
      body: `Key "${key.code}" sẽ bị vô hiệu hoá. Người đang dùng vẫn giữ quyền PRO đến khi hết hạn, nhưng key không thể kích hoạt thêm.`,
      okLabel: 'Thu hồi',
      danger: true,
      onOk: async () => {
        try {
          await adminRevokeKey(key.id, 'Thu hồi bởi admin');
          say('Đã thu hồi key');
          await load();
        } catch (e) {
          say('Lỗi: ' + e.message);
        }
      },
    });
  };

  const handleDelete = (key) => {
    setConfirm({
      title: 'Xóa key?',
      body: `Xóa vĩnh viễn key "${key.code}". Người đã dùng sẽ KHÔNG bị ảnh hưởng (quyền PRO giữ nguyên), nhưng key không còn trong danh sách.`,
      okLabel: 'Xóa',
      danger: true,
      onOk: async () => {
        try {
          await adminDeleteKey(key.id);
          say('Đã xóa key');
          await load();
        } catch (e) {
          say('Lỗi: ' + e.message);
        }
      },
    });
  };

  const handleExport = () => {
    if (!keys.length) {
      say('Chưa có key để xuất');
      return;
    }
    const rows = [['Mã key', 'Số ngày', 'Ghi chú', 'Ngày tạo', 'Đã dùng', 'Ngày dùng', 'Trạng thái']];
    keys.forEach((k) => {
      rows.push([
        k.code,
        k.duration_days,
        k.note || '',
        fmtDate(k.created_at),
        k.used_by || '',
        fmtDate(k.used_at),
        k.revoked ? 'Đã thu hồi' : k.used_by ? 'Đang dùng' : 'Chưa dùng',
      ]);
    });
    downloadCsv(`key-pro-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    say('Đã xuất ' + keys.length + ' key');
  };

  /* ---------- RENDER ---------- */
  const tabs = STATUS_TABS.map((t) => ({ ...t, count: tabCounts[t.key] || 0 }));

  const topProps = {
    tabs,
    active: tab,
    onTab: setTab,
    search,
    onSearch: setSearch,
    placeholder: 'Tìm mã key…',
  };

  const badges = {
    key: stats.total > 0 ? stats.total : null,
  };

  return (
    <AdminShell active="keys" onChange={(k) => { window.location.hash = `admin/${k}`; }} badges={badges}>
      <Topbar {...topProps} />

      {/* ===== HERO ===== */}
      <div className="vt-row-hero">
        <div className="vt-hero">
          <div className="vt-hero-left">
            <span className="vt-hero-label">Key PRO đã phát hành</span>
            <div className="vt-hero-num">
              <b>{stats.total}</b>
              <span>key</span>
            </div>
            <dl className="vt-hero-facts">
              <div><dt>Chưa dùng</dt><dd>{stats.unused}</dd></div>
              <div><dt>Đang dùng</dt><dd>{stats.active}</dd></div>
            </dl>
            <div className="vt-hero-btns">
              <button type="button" className="vt-hero-btn" onClick={() => setShowCreate(true)}>
                <IconPlus size={14} /> Tạo 1 key
              </button>
              <button type="button" className="vt-hero-btn ghost" onClick={() => setShowBatch(true)}>
                <IconKey size={14} /> Tạo hàng loạt
              </button>
            </div>
          </div>
          <div className="vt-hero-right">
            <div className="vt-hero-chart-head">
              <b>Phân bổ trạng thái</b>
              <button type="button" className="vt-btn sm" onClick={handleExport}>
                Xuất CSV
              </button>
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginTop: '.5rem' }}>
              <Donut value={stats.total} max={Math.max(stats.total, 1)} size={130} stroke={12}>
                <strong>{stats.total}</strong>
                <small>tổng key</small>
              </Donut>
              <ul className="vt-rank" style={{ flex: 1, minWidth: 0 }}>
                <li>
                  <span className="vt-rank-n">–</span>
                  <b>Chưa dùng</b>
                  <span className="vt-rank-score">{stats.unused}</span>
                </li>
                <li>
                  <span className="vt-rank-n r1">✓</span>
                  <b>Đang dùng</b>
                  <span className="vt-rank-score">{stats.active}</span>
                </li>
                <li>
                  <span className="vt-rank-n">×</span>
                  <b>Đã thu hồi</b>
                  <span className="vt-rank-score">{stats.revoked}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LIST ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">Danh sách key ({keys.length})</h3>
          <div className="vt-pills">
            <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
              <IconRefresh size={13} /> {loading ? 'Đang tải…' : 'Làm mới'}
            </button>
          </div>
        </header>

        {keys.length === 0 ? (
          <div className="vt-empty">
            <span><IconKey size={30} /></span>
            <h3>{loading ? 'Đang tải…' : 'Chưa có key nào'}</h3>
            <p>{loading ? '' : 'Bấm "Tạo 1 key" hoặc "Tạo hàng loạt" để bắt đầu.'}</p>
          </div>
        ) : (
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Mã key</th>
                  <th>Hạn</th>
                  <th>Người dùng</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 120 }} />
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => {
                  const status = k.revoked
                    ? { label: 'Đã thu hồi', cls: 'kicked' }
                    : k.used_by
                      ? { label: 'Đang dùng', cls: 'ready' }
                      : { label: 'Chưa dùng', cls: 'soon' };
                  return (
                    <tr key={k.id}>
                      <td>
                        <code style={{ fontSize: '.92rem', fontWeight: 700 }}>{k.code}</code>
                        <div style={{ fontSize: '.7rem', color: 'var(--mut)', marginTop: 2 }}>
                          {k.duration_days} ngày
                          {k.note ? ` · ${k.note}` : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '.8rem' }}>{fmtDate(k.created_at)}</div>
                        {k.used_at && (
                          <div style={{ fontSize: '.7rem', color: 'var(--mut)' }}>
                            dùng: {fmtDate(k.used_at)}
                          </div>
                        )}
                      </td>
                      <td>
                        {k.used_by ? (
                          <span style={{ fontSize: '.75rem', fontFamily: 'var(--mono)' }}>
                            {String(k.used_by).slice(0, 12)}…
                          </span>
                        ) : (
                          <span className="vt-muted" style={{ fontSize: '.78rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={'vt-chip ' + status.cls}>{status.label}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="vt-icon-btn"
                            onClick={() => handleCopy(k.code, k.id)}
                            title="Sao chép key"
                          >
                            {copiedId === k.id ? <IconCheck size={14} /> : <IconCopy size={14} />}
                          </button>
                          {!k.revoked && (
                            <button
                              type="button"
                              className="vt-icon-btn"
                              onClick={() => handleRevoke(k)}
                              title="Thu hồi"
                            >
                              <IconRevoke size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="vt-icon-btn danger"
                            onClick={() => handleDelete(k)}
                            title="Xóa"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== MODAL TẠO ĐƠN ===== */}
      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onDone={(key) => {
            setShowCreate(false);
            say('Đã tạo key ' + key.code);
            load();
          }}
        />
      )}

      {/* ===== MODAL TẠO HÀNG LOẠT ===== */}
      {showBatch && (
        <CreateBatchModal
          onClose={() => setShowBatch(false)}
          onDone={(list) => {
            setShowBatch(false);
            say(`Đã tạo ${list.length} key`);
            load();
          }}
        />
      )}

      {/* ===== CONFIRM ===== */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        okLabel={confirm?.okLabel}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const fn = confirm?.onOk;
          setConfirm(null);
          fn?.();
        }}
      />

      {toast && <div className="vt-toast" role="status">{toast}</div>}
    </AdminShell>
  );
}

/* ============================================================
   MODAL TẠO 1 KEY
   ============================================================ */
function CreateKeyModal({ onClose, onDone }) {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [customDays, setCustomDays] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const finalDays = customDays ? Math.max(1, Math.min(3650, Number(customDays) || 0)) : days;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!finalDays || finalDays < 1) {
      setErr('Số ngày không hợp lệ.');
      return;
    }
    setSaving(true);
    try {
      const key = await adminCreateProKey({
        durationDays: finalDays,
        note,
        createdBy: user?.uid || null,
      });
      onDone(key);
    } catch (e2) {
      setErr(e2.message || 'Lỗi tạo key.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Tạo key PRO"
      size="sm"
      onClose={onClose}
      foot={
        <>
          <button type="button" className="vt-btn" onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="vt-btn primary"
            onClick={submit}
            disabled={saving}
          >
            <IconKey size={14} /> {saving ? 'Đang tạo…' : 'Tạo key'}
          </button>
        </>
      }
    >
      <p className="vt-muted" style={{ marginTop: 0 }}>
        Chọn số ngày sử dụng. Key sinh ra dạng <code>PRO-XXXX-XXXX</code>.
      </p>

      <label className="vt-field">
        <span>Thời hạn</span>
        <div className="vt-pills" style={{ marginTop: '.4rem' }}>
          {DURATION_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              className={'vt-pill sm' + (!customDays && days === d ? ' on' : '')}
              onClick={() => { setDays(d); setCustomDays(''); }}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </label>

      <label className="vt-field">
        <span>Số ngày tuỳ chỉnh (bỏ trống nếu chọn ở trên)</span>
        <input
          type="number"
          min={1}
          max={3650}
          value={customDays}
          onChange={(e) => setCustomDays(e.target.value)}
          placeholder="VD: 500"
        />
      </label>

      <label className="vt-field">
        <span>Ghi chú (tuỳ chọn)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: Tặng cô Lan - tổ Hóa"
          maxLength={120}
        />
      </label>

      {err && <p className="vt-muted" style={{ color: 'var(--vt-red)' }}>{err}</p>}

      <p className="vt-muted" style={{ fontSize: '.78rem' }}>
        Key sẽ có hiệu lực <b>{finalDays} ngày</b> kể từ khi giáo viên kích hoạt.
      </p>
    </Modal>
  );
}

/* ============================================================
   MODAL TẠO HÀNG LOẠT
   ============================================================ */
function CreateBatchModal({ onClose, onDone }) {
  const { user } = useAuth();
  const [count, setCount] = useState(5);
  const [days, setDays] = useState(30);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const n = Math.max(1, Math.min(100, Number(count) || 0));
    const d = Math.max(1, Math.min(3650, Number(days) || 0));
    if (!n || !d) {
      setErr('Số lượng và số ngày phải > 0.');
      return;
    }
    setSaving(true);
    try {
      const list = await adminCreateProKeyBatch({
        count: n,
        durationDays: d,
        note,
        createdBy: user?.uid || null,
      });
      onDone(list);
    } catch (e2) {
      setErr(e2.message || 'Lỗi tạo key.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Tạo hàng loạt key PRO"
      size="sm"
      onClose={onClose}
      foot={
        <>
          <button type="button" className="vt-btn" onClick={onClose}>Hủy</button>
          <button
            type="button"
            className="vt-btn primary"
            onClick={submit}
            disabled={saving}
          >
            <IconKey size={14} /> {saving ? 'Đang tạo…' : `Tạo ${count} key`}
          </button>
        </>
      }
    >
      <p className="vt-muted" style={{ marginTop: 0 }}>
        Tối đa 100 key mỗi lần. Sau khi tạo, bạn có thể xuất CSV để phát cho giáo viên.
      </p>

      <label className="vt-field">
        <span>Số lượng key</span>
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />
      </label>

      <label className="vt-field">
        <span>Thời hạn mỗi key (ngày)</span>
        <div className="vt-pills" style={{ marginTop: '.4rem' }}>
          {DURATION_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              className={'vt-pill sm' + (days === d ? ' on' : '')}
              onClick={() => setDays(d)}
            >
              {d}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={3650}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            style={{ width: 80, marginLeft: '.3rem' }}
          />
        </div>
      </label>

      <label className="vt-field">
        <span>Ghi chú chung (tuỳ chọn)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: Đợt 1 - Tháng 1/2026"
          maxLength={120}
        />
      </label>

      {err && <p className="vt-muted" style={{ color: 'var(--vt-red)' }}>{err}</p>}
    </Modal>
  );
}