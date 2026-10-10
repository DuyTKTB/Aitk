/* ============================================================
   ProUserManager.jsx — Danh sách giáo viên PRO
   ------------------------------------------------------------
   • Hiển thị: tên, email, key, ngày hết hạn, số ngày còn lại
   • Filter: tất cả / còn hạn / sắp hết (≤7 ngày) / đã hết
   • Actions: gia hạn (+7/+30/+90/+180), thu hồi, export CSV
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  adminGetProUsers,
  adminExtendProUser,
  adminRevokeProUser,
  isProActive,
  daysLeft,
} from '../../lib/proKeyApi.js';
import AdminShell, {
  Topbar, Modal, ConfirmDialog, Avatar, Donut,
  downloadCsv,
} from './AdminShell.jsx';
import {
  IconCrown, IconTrash, IconRefresh, IconExtend, IconCalendar,
  IconHourglass, IconUserCheck, IconSearch,
} from './AdminIcons.jsx';

const EXTEND_OPTIONS = [7, 30, 90, 180, 365];

const STATUS_TABS = [
  { key: 'all',     label: 'Tất cả' },
  { key: 'active',  label: 'Còn hạn' },
  { key: 'soon',    label: 'Sắp hết' },
  { key: 'expired', label: 'Đã hết' },
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
  const [profiles, setProfiles] = useState({}); // uid → profile
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);

  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ---------- LOAD ---------- */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminGetProUsers();
      setRows(list);

      // load profiles cho các user
      const ids = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
      if (ids.length) {
        // chia batch 100 để tránh giới hạn
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

  /* ---------- DERIVED ---------- */
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

  const tabCounts = useMemo(() => ({
    all: stats.total,
    active: stats.active,
    soon: stats.soon,
    expired: stats.expired,
  }), [stats]);

  /* ---------- ACTIONS ---------- */
  const handleExtend = (row, days) => {
    setExtendTarget({ row, days });
  };

  const doExtend = async () => {
    if (!extendTarget) return;
    const { row, days } = extendTarget;
    try {
      await adminExtendProUser(row.user_id, days);
      say(`Đã gia hạn ${days} ngày cho ${row.name}`);
      setExtendTarget(null);
      await load();
    } catch (e) {
      say('Lỗi gia hạn: ' + e.message);
    }
  };

  const handleRevoke = (row) => {
    setConfirm({
      title: 'Thu hồi PRO?',
      body: `Thu hồi quyền PRO của "${row.name}" (${row.email}). Họ sẽ mất quyền giáo viên ngay lập tức. Key vẫn giữ nguyên trong danh sách.`,
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
    const rows = [['Tên', 'Email', 'UID', 'Key', 'Ngày hết hạn', 'Số ngày còn lại', 'Trạng thái']];
    filtered.forEach((r) => {
      rows.push([
        r.name,
        r.email,
        r.user_id,
        r.key_code || '',
        fmtDate(r.expiry),
        r.left,
        r.active ? 'Còn hạn' : 'Hết hạn',
      ]);
    });
    downloadCsv(`giao-vien-pro-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    say('Đã xuất ' + filtered.length + ' dòng');
  };

  /* ---------- RENDER ---------- */
  const tabs = STATUS_TABS.map((t) => ({ ...t, count: tabCounts[t.key] || 0 }));

  const badges = {
    pro: stats.soon > 0 ? stats.soon : (stats.active > 0 ? stats.active : null),
  };

  return (
    <AdminShell
      active="pro-users"
      onChange={(k) => { window.location.hash = `admin/${k}`; }}
      badges={badges}
    >
      <Topbar
        tabs={tabs}
        active={tab}
        onTab={setTab}
        search={search}
        onSearch={setSearch}
        placeholder="Tìm tên / email / key…"
      />

      {/* ===== HERO ===== */}
      <div className="vt-row-hero">
        <div className="vt-hero">
          <div className="vt-hero-left">
            <span className="vt-hero-label">Giáo viên PRO</span>
            <div className="vt-hero-num">
              <b>{stats.active}</b>
              <span>đang hoạt động</span>
            </div>
            <dl className="vt-hero-facts">
              <div><dt>Sắp hết hạn</dt><dd>{stats.soon}</dd></div>
              <div><dt>Đã hết hạn</dt><dd>{stats.expired}</dd></div>
            </dl>
            <div className="vt-hero-btns">
              <button type="button" className="vt-hero-btn" onClick={handleExport}>
                <IconCrown size={14} /> Xuất CSV
              </button>
            </div>
          </div>
          <div className="vt-hero-right">
            <div className="vt-hero-chart-head">
              <b>Tổng quan</b>
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginTop: '.5rem' }}>
              <Donut value={stats.active} max={Math.max(stats.total, 1)} size={130} stroke={12}>
                <strong>{stats.total ? Math.round((stats.active / stats.total) * 100) : 0}<sup>%</sup></strong>
                <small>còn hạn</small>
              </Donut>
              <ul className="vt-rank" style={{ flex: 1 }}>
                <li><span className="vt-rank-n r1">✓</span><b>Còn hạn</b><span className="vt-rank-score">{stats.active}</span></li>
                <li><span className="vt-rank-n r2">!</span><b>Sắp hết ≤7d</b><span className="vt-rank-score">{stats.soon}</span></li>
                <li><span className="vt-rank-n">×</span><b>Đã hết</b><span className="vt-rank-score">{stats.expired}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== LIST ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">Danh sách ({filtered.length})</h3>
          <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
            <IconRefresh size={13} /> {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
        </header>

        {filtered.length === 0 ? (
          <div className="vt-empty">
            <span><IconUserCheck size={30} /></span>
            <h3>{loading ? 'Đang tải…' : 'Chưa có giáo viên PRO nào'}</h3>
            <p>{loading ? '' : 'Khi giáo viên kích hoạt key PRO, họ sẽ xuất hiện ở đây.'}</p>
          </div>
        ) : (
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Giáo viên</th>
                  <th>Key đang dùng</th>
                  <th>Ngày hết hạn</th>
                  <th>Còn lại</th>
                  <th style={{ width: 180 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.user_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        <Avatar name={r.name} size={34} />
                        <div style={{ minWidth: 0 }}>
                          <b style={{ display: 'block', fontSize: '.9rem' }}>{r.name}</b>
                          <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>{r.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '.82rem' }}>{r.key_code || '—'}</code>
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
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="vt-icon-btn"
                          onClick={() => handleExtend(r, 30)}
                          title="Gia hạn 30 ngày"
                        >
                          <IconExtend size={14} />
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

      {/* ===== MODAL GIA HẠN ===== */}
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