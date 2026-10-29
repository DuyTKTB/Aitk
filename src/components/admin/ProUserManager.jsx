/* ============================================================
   ProUserManager.jsx — Danh sách giáo viên PRO (Compact + Cấp PRO trực tiếp + Gia hạn hàng loạt)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  adminGetProUsers,
  adminExtendProUser,
  adminRevokeProUser,
  adminGrantProDirect,
  isProActive,
  daysLeft,
} from '../../lib/proKeyApi.js';
import AdminShell, { Topbar, Avatar, downloadCsv, setGlobalAdminBadges } from './AdminShell.jsx';
import { Modal, ConfirmDialog } from './AdminUI.jsx';
import {
  IconCrown, IconTrash, IconRefresh, IconExtend, IconHourglass, IconUserCheck,
  IconPlus, IconDownload, IconClose,
} from './AdminIcons.jsx';

const EXTEND_OPTIONS = [7, 30, 90, 180, 365];

const STATUS_TABS = [
  { key: 'all',     label: 'Tất cả' },
  { key: 'active',  label: 'Còn hạn' },
  { key: 'soon',    label: 'Sắp hết ≤7d' },
  { key: 'expired', label: 'Đã hết hạn' },
];

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
};

export default function ProUserManager() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [toast, setToast] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);

  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminGetProUsers();
      setRows(list);
      setSelected(new Set());

      const ids = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
      if (ids.length) {
        const chunks = [];
        for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
        const allProfiles = {};
        for (const part of chunks) {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, email, role')
            .in('id', part);
          if (!error && data) {
            data.forEach((p) => { allProfiles[p.id] = p; });
          }
        }
        setProfiles(allProfiles);
      }
    } catch (e) {
      say('Lỗi tải danh sách: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [say]);

  useEffect(() => { load(); }, [load]);

  const enriched = useMemo(() => {
    return rows.map((r) => {
      const p = profiles[r.user_id] || {};
      return {
        ...r,
        name: p.display_name || 'Chưa đặt tên',
        email: p.email || '—',
        avatar: p.avatar_url || null,
        active: isProActive(r.expiry),
        left: daysLeft(r.expiry),
        soon: isProActive(r.expiry) && daysLeft(r.expiry) <= 7,
      };
    });
  }, [rows, profiles]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (tab === 'active') list = list.filter((r) => r.active);
    else if (tab === 'expired') list = list.filter((r) => !r.active);
    else if (tab === 'soon') list = list.filter((r) => r.soon);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          String(r.user_id).toLowerCase().includes(q) ||
          String(r.key_code || '').toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return new Date(a.expiry) - new Date(b.expiry);
    });
  }, [enriched, tab, search]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const active = enriched.filter((r) => r.active).length;
    const soon = enriched.filter((r) => r.soon).length;
    const expired = enriched.filter((r) => !r.active).length;
    return { total, active, soon, expired };
  }, [enriched]);

  useEffect(() => {
    setGlobalAdminBadges({ pro: stats.soon > 0 ? stats.soon : null });
  }, [stats.soon]);

  const tabCounts = useMemo(() => ({
    all: stats.total,
    active: stats.active,
    soon: stats.soon,
    expired: stats.expired,
  }), [stats]);

  const handleExtend = (row, days) => {
    setExtendTarget({ row, days });
  };

  const doExtend = async () => {
    if (!extendTarget) return;
    const { row, days } = extendTarget;
    try {
      await adminExtendProUser(row.user_id, days);
      say(`Đã gia hạn +${days} ngày cho ${row.name}`);
      setExtendTarget(null);
      await load();
    } catch (e) {
      say('Lỗi gia hạn: ' + e.message);
    }
  };

  const handleBulkExtend = async (days = 30) => {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      for (const uid of ids) {
        // eslint-disable-next-line no-await-in-loop
        await adminExtendProUser(uid, days);
      }
      say(`Đã gia hạn +${days} ngày cho ${ids.length} giáo viên`);
      await load();
    } catch (e) {
      say('Lỗi gia hạn hàng loạt: ' + e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleRevoke = (row) => {
    setConfirm({
      title: 'Thu hồi PRO?',
      body: `Thu hồi quyền PRO của "${row.name}" (${row.email}). Họ sẽ mất quyền giáo viên PRO ngay lập tức. Key vẫn giữ nguyên trong danh sách.`,
      okLabel: 'Thu hồi',
      danger: true,
      onOk: async () => {
        try {
          await adminRevokeProUser(row.user_id);
          say('Đã thu hồi PRO');
          await load();
        } catch (e) {
          say('Lỗi: ' + e.message);
        }
      },
    });
  };

  const handleExport = () => {
    if (!filtered.length) {
      say('Chưa có dữ liệu');
      return;
    }
    const rowsCsv = [['Tên', 'Email', 'UID', 'Key', 'Ngày hết hạn', 'Số ngày còn lại', 'Trạng thái']];
    filtered.forEach((r) => {
      rowsCsv.push([
        r.name,
        r.email,
        r.user_id,
        r.key_code || '',
        fmtDate(r.expiry),
        r.left,
        r.active ? 'Còn hạn' : 'Hết hạn',
      ]);
    });
    downloadCsv(`giao-vien-pro-${new Date().toISOString().slice(0, 10)}.csv`, rowsCsv);
    say('Đã xuất ' + filtered.length + ' dòng');
  };

  const toggleSelect = (uid) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(uid)) n.delete(uid);
      else n.add(uid);
      return n;
    });

  const tabs = STATUS_TABS.map((t) => ({ ...t, count: tabCounts[t.key] || 0 }));
  const badges = { pro: stats.soon > 0 ? stats.soon : null };

  return (
    <AdminShell
      active="pro-users"
      onChange={(k) => { window.location.hash = `admin/${k}`; }}
      badges={badges}
    >
      <Topbar
        title="Giáo viên PRO"
        subtitle={`${stats.active} giáo viên đang hoạt động · ${stats.soon} sắp hết hạn`}
        tabs={tabs}
        active={tab}
        onTab={setTab}
        search={search}
        onSearch={setSearch}
        placeholder="Tìm tên / email / key…"
      />

      {/* ===== COMPACT KPI STRIP ===== */}
      <div className="ad-kpi-strip ad-kpi-strip--4">
        <div className="vt-card ad-mini-kpi">
          <span>Đang hoạt động</span>
          <b style={{ color: '#16a34a' }}>{stats.active}</b>
          <small>Trên tổng số {stats.total} tài khoản PRO</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span>Sắp hết hạn (≤7 ngày)</span>
          <b style={{ color: stats.soon > 0 ? 'var(--vt-amber)' : undefined }}>{stats.soon}</b>
          <small>{stats.soon > 0 ? 'Cần nhắc gia hạn sớm' : 'Tất cả còn hạn dài'}</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span>Đã hết hạn</span>
          <b>{stats.expired}</b>
          <small>Có thể gia hạn lại bất kỳ lúc nào</small>
        </div>
        <div className="vt-card ad-mini-kpi ad-mini-kpi--actions">
          <button type="button" className="vt-btn sm primary" onClick={() => setShowGrantModal(true)}>
            <IconPlus size={13} /> Cấp PRO trực tiếp
          </button>
          <button type="button" className="vt-btn sm" onClick={handleExport}>
            <IconDownload size={13} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* ===== LIST ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconCrown size={16} className="vt-title-ico" />
            Danh sách giáo viên PRO ({filtered.length})
          </h3>
          <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
            <IconRefresh size={13} /> {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
        </header>

        {selected.size > 0 && (
          <div className="vt-bulk-bar" style={{ marginTop: 0, marginBottom: '.8rem' }}>
            <span>Đã chọn <b>{selected.size}</b> giáo viên</span>
            <button type="button" className="vt-btn sm primary" disabled={bulkBusy} onClick={() => handleBulkExtend(30)}>
              <IconExtend size={13} /> Gia hạn +30 ngày
            </button>
            <button type="button" className="vt-btn sm" disabled={bulkBusy} onClick={() => handleBulkExtend(90)}>
              +90 ngày
            </button>
            <button type="button" className="vt-btn sm" onClick={() => setSelected(new Set())}>
              <IconClose size={12} /> Bỏ chọn
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="vt-empty">
            <span><IconUserCheck size={30} /></span>
            <h3>{loading ? 'Đang tải…' : 'Chưa có giáo viên PRO nào'}</h3>
            <p>{loading ? '' : 'Bấm "Cấp PRO trực tiếp" hoặc gửi mã Key PRO để giáo viên kích hoạt.'}</p>
          </div>
        ) : (
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every((r) => selected.has(r.user_id))}
                      onChange={() => {
                        const all = filtered.every((r) => selected.has(r.user_id));
                        setSelected(all ? new Set() : new Set(filtered.map((r) => r.user_id)));
                      }}
                    />
                  </th>
                  <th>Giáo viên</th>
                  <th>Key đang dùng</th>
                  <th>Ngày hết hạn</th>
                  <th>Còn lại</th>
                  <th style={{ width: 180 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.user_id} className={selected.has(r.user_id) ? 'vt-row-selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(r.user_id)}
                        onChange={() => toggleSelect(r.user_id)}
                      />
                    </td>
                    <td>
                      <div className="vt-user-cell">
                        <Avatar name={r.name} size={34} />
                        <div style={{ minWidth: 0 }}>
                          <b style={{ display: 'block', fontSize: '.9rem' }}>{r.name}</b>
                          <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>{r.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="vt-key-code">{r.key_code || '—'}</code>
                    </td>
                    <td>
                      <div style={{ fontSize: '.85rem' }}>{fmtDate(r.expiry)}</div>
                    </td>
                    <td>
                      {r.active ? (
                        <span className={'vt-chip ' + (r.soon ? 'soon' : 'ready')}>
                          <IconHourglass size={12} />
                          {r.left} ngày
                        </span>
                      ) : (
                        <span className="vt-chip kicked">Đã hết</span>
                      )}
                    </td>
                    <td>
                      <div className="vt-row-actions">
                        <button
                          type="button"
                          className="vt-btn sm"
                          onClick={() => handleExtend(r, 30)}
                          title="Gia hạn thêm ngày"
                        >
                          <IconExtend size={13} /> Gia hạn
                        </button>
                        <button
                          type="button"
                          className="vt-icon-btn danger"
                          onClick={() => handleRevoke(r)}
                          title="Thu hồi PRO"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {extendTarget && (
        <Modal
          title={`Gia hạn cho ${extendTarget.row.name}`}
          size="sm"
          onClose={() => setExtendTarget(null)}
          foot={
            <>
              <button type="button" className="vt-btn" onClick={() => setExtendTarget(null)}>Hủy</button>
              <button type="button" className="vt-btn primary" onClick={doExtend}>
                <IconExtend size={14} /> Gia hạn {extendTarget.days} ngày
              </button>
            </>
          }
        >
          <p className="vt-muted" style={{ marginTop: 0 }}>
            Chọn số ngày muốn cộng thêm. Hạn mới = max(hiện tại, hôm nay) + số ngày.
          </p>
          <label className="vt-field">
            <span>Số ngày cộng thêm</span>
            <div className="vt-pills" style={{ marginTop: '.4rem' }}>
              {EXTEND_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={'vt-pill sm' + (extendTarget.days === d ? ' on' : '')}
                  onClick={() => setExtendTarget({ ...extendTarget, days: d })}
                >
                  +{d} ngày
                </button>
              ))}
            </div>
          </label>
          <label className="vt-field">
            <span>Hoặc nhập số ngày tuỳ chỉnh</span>
            <input
              type="number"
              min={1}
              max={3650}
              value={extendTarget.days}
              onChange={(e) => setExtendTarget({ ...extendTarget, days: Math.max(1, Number(e.target.value) || 1) })}
            />
          </label>
        </Modal>
      )}

      {showGrantModal && (
        <GrantProDirectModal
          onClose={() => setShowGrantModal(false)}
          onDone={(msg) => {
            setShowGrantModal(false);
            say(msg);
            load();
          }}
        />
      )}

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
   MODAL CẤP PRO TRỰC TIẾP CHO NGƯỜI DÙNG
   ============================================================ */
function GrantProDirectModal({ onClose, onDone }) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [pickedUser, setPickedUser] = useState(null);
  const [days, setDays] = useState(30);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    supabase
      .from('profiles')
      .select('id, display_name, email, role')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (alive && data) setCandidates(data);
      });
    return () => { alive = false; };
  }, []);

  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates.slice(0, 6);
    return candidates
      .filter(
        (u) =>
          (u.display_name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          String(u.id).toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [candidates, query]);

  const submit = async () => {
    setErr('');
    const uid = pickedUser?.id || query.trim();
    if (!uid) {
      setErr('Hãy chọn một tài khoản hoặc dán UID người dùng.');
      return;
    }
    setSaving(true);
    try {
      await adminGrantProDirect({ userId: uid, durationDays: days, note });
      onDone(`Đã cấp PRO +${days} ngày cho ${pickedUser?.display_name || uid}`);
    } catch (e) {
      setErr(e.message || 'Không cấp được PRO.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Cấp quyền Giáo viên PRO trực tiếp"
      size="sm"
      onClose={onClose}
      foot={
        <>
          <button type="button" className="vt-btn" onClick={onClose}>Hủy</button>
          <button type="button" className="vt-btn primary" onClick={submit} disabled={saving}>
            <IconCrown size={14} /> {saving ? 'Đang cấp…' : `Cấp PRO +${days} ngày`}
          </button>
        </>
      }
    >
      <label className="vt-field">
        <span>Tìm người dùng (theo tên, email hoặc dán UID)</span>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPickedUser(null); }}
          placeholder="Nhập tên giáo viên, email hoặc UID…"
        />
      </label>

      {matched.length > 0 && (
        <div style={{ display: 'grid', gap: '.3rem', maxHeight: 170, overflowY: 'auto', padding: '.35rem', background: 'var(--vt-tint)', borderRadius: 12 }}>
          {matched.map((u) => {
            const isPicked = pickedUser?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => { setPickedUser(u); setQuery(u.display_name || u.email || u.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '.45rem .65rem',
                  borderRadius: 9,
                  border: isPicked ? '1.5px solid var(--acc)' : '1px solid transparent',
                  background: isPicked ? 'color-mix(in srgb, var(--acc) 12%, var(--panel))' : 'var(--panel)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--ink)',
                }}
              >
                <div>
                  <b style={{ fontSize: '.84rem', display: 'block' }}>{u.display_name || 'Chưa đặt tên'}</b>
                  <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>{u.email || String(u.id).slice(0, 14)}</small>
                </div>
                <span className="vt-chip closed">{u.role || 'user'}</span>
              </button>
            );
          })}
        </div>
      )}

      <label className="vt-field">
        <span>Thời hạn cấp PRO</span>
        <div className="vt-pills" style={{ marginTop: '.35rem' }}>
          {EXTEND_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={'vt-pill sm' + (days === d ? ' on' : '')}
              onClick={() => setDays(d)}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </label>

      <label className="vt-field">
        <span>Ghi chú (tuỳ chọn)</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: Cấp trực tiếp cho GV tổ Hóa"
        />
      </label>

      {err && <p className="vt-muted" style={{ color: 'var(--vt-red)' }}>{err}</p>}
    </Modal>
  );
}
