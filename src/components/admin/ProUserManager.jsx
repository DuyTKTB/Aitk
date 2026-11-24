/* ============================================================
   ProUserManager.jsx — Quản lý Thuê bao VIP & PRO (GV PRO 999k/năm / HS VIP 299k/năm)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  adminGetProUsers,
  adminExtendProUser,
  adminRevokeProUser,
  adminGrantProDirect,
  adminGrantVipDirect,
  adminFetchMergedUsers,
  isStudentVipRecord,
  isProActive,
  daysLeft,
} from '../../lib/proKeyApi.js';
import { preserveRemainingDaysForSwitch } from '../../lib/adminAnalyticsEngine.js';
import { logAdminAction } from '../../lib/adminAuditService.js';
import AdminShell, { Topbar, Avatar, downloadCsv, setGlobalAdminBadges } from './AdminShell.jsx';
import { Modal, ConfirmDialog } from './AdminUI.jsx';
import {
  IconCrown, IconTrash, IconRefresh, IconExtend, IconHourglass, IconUserCheck,
  IconPlus, IconDownload, IconClose, IconSparkle,
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
  const { user: adminUser } = useAuth();
  const [tab, setTab] = useState('all');
  const [planFilter, setPlanFilter] = useState('all'); // all | teacher | student
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
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, mergedUsers] = await Promise.all([
        adminGetProUsers(),
        adminFetchMergedUsers({ limit: 500 }).catch(() => []),
      ]);
      setRows(list);
      setSelected(new Set());

      const allProfiles = {};
      (mergedUsers || []).forEach((p) => {
        if (p?.id) allProfiles[p.id] = p;
      });
      setProfiles(allProfiles);
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
      const isStudentVip = isStudentVipRecord(r);
      return {
        ...r,
        isStudentVip,
        planLabel: isStudentVip ? 'Học sinh VIP (299k/năm)' : 'Giáo viên PRO (999k/năm)',
        name: p.display_name || (p.email ? p.email.split('@')[0] : null) || 'Chưa đặt tên',
        email: p.email || r.user_id?.slice(0, 14) || '—',
        avatar: p.avatar_url || null,
        active: isProActive(r.expiry),
        left: daysLeft(r.expiry),
        soon: isProActive(r.expiry) && daysLeft(r.expiry) <= 7,
      };
    });
  }, [rows, profiles]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (planFilter === 'teacher') list = list.filter((r) => !r.isStudentVip);
    else if (planFilter === 'student') list = list.filter((r) => r.isStudentVip);

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
  }, [enriched, planFilter, tab, search]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const activeRows = enriched.filter((r) => r.active);
    const activeTeacher = activeRows.filter((r) => !r.isStudentVip).length;
    const activeStudent = activeRows.filter((r) => r.isStudentVip).length;
    const soon = enriched.filter((r) => r.soon).length;
    const expired = enriched.filter((r) => !r.active).length;
    return {
      total,
      active: activeRows.length,
      activeTeacher,
      activeStudent,
      soon,
      expired,
    };
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
      say(`Đã gia hạn +${days} ngày (${row.planLabel}) cho ${row.name}`);
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
      say(`Đã gia hạn +${days} ngày cho ${ids.length} tài khoản`);
      await load();
    } catch (e) {
      say('Lỗi gia hạn hàng loạt: ' + e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleRevoke = (row) => {
    setConfirm({
      title: `Thu hồi ${row.isStudentVip ? 'VIP' : 'PRO'}?`,
      body: `Thu hồi gói ${row.planLabel} của "${row.name}" (${row.email}). Tài khoản sẽ về gói Miễn phí ngay lập tức.`,
      okLabel: 'Thu hồi',
      danger: true,
      onOk: async () => {
        try {
          await adminRevokeProUser(row.user_id);
          say(`Đã thu hồi ${row.isStudentVip ? 'VIP' : 'PRO'} của ${row.name}`);
          await load();
        } catch (e) {
          say('Lỗi: ' + e.message);
        }
      },
    });
  };

  const handleSwitchPackage = (row) => {
    const toTeacher = row.isStudentVip;
    const keepDays = preserveRemainingDaysForSwitch(row.left, 30);
    setConfirm({
      title: toTeacher ? 'Chuyển sang Giáo viên PRO (999k/năm)?' : 'Chuyển sang Học sinh VIP (299k/năm)?',
      body: toTeacher
        ? `Chuyển "${row.name}" từ Học sinh VIP sang Giáo viên PRO (giữ nguyên ${keepDays} ngày hạn còn lại, mở toàn bộ tính năng giảng dạy & vai trò Giáo viên)?`
        : `Chuyển "${row.name}" từ Giáo viên PRO sang Học sinh VIP (giữ nguyên ${keepDays} ngày hạn còn lại)? Lưu ý: tài khoản sẽ KHÔNG còn quyền Giáo viên PRO.`,
      okLabel: toTeacher ? 'Chuyển sang GV PRO' : 'Chuyển sang HS VIP',
      danger: !toTeacher,
      onOk: async () => {
        try {
          if (toTeacher) {
            await adminGrantProDirect({ userId: row.user_id, durationDays: keepDays, note: 'Chuyển sang Giáo viên PRO từ Admin' });
            say(`Đã chuyển ${row.name} sang Giáo viên PRO (giữ ${keepDays} ngày)`);
          } else {
            await adminGrantVipDirect({ userId: row.user_id, durationDays: keepDays, note: 'Chuyển sang Học sinh VIP từ Admin' });
            say(`Đã chuyển ${row.name} sang Học sinh VIP (giữ ${keepDays} ngày)`);
          }
          logAdminAction({
            actor: adminUser,
            action: 'switch_plan',
            target: row.user_id,
            targetLabel: `${row.name} (${row.email})`,
            summary: `Đổi gói ${row.name} → ${toTeacher ? 'Giáo viên PRO' : 'Học sinh VIP'} (bảo toàn ${keepDays} ngày)`,
          });
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
    const rowsCsv = [['Tên', 'Email', 'UID', 'Gói dịch vụ', 'Key', 'Ngày hết hạn', 'Số ngày còn lại', 'Trạng thái']];
    filtered.forEach((r) => {
      rowsCsv.push([
        r.name,
        r.email,
        r.user_id,
        r.planLabel,
        r.key_code || '',
        fmtDate(r.expiry),
        r.left,
        r.active ? 'Còn hạn' : 'Hết hạn',
      ]);
    });
    downloadCsv(`thue-bao-vip-pro-${new Date().toISOString().slice(0, 10)}.csv`, rowsCsv);
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
        title="Thuê bao VIP & Giáo viên PRO"
        subtitle={`${stats.activeTeacher} GV PRO (999k/năm) · ${stats.activeStudent} HS VIP (299k/năm) · ${stats.soon} sắp hết hạn`}
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
          <span>👨‍🏫 Giáo viên PRO (999k/năm)</span>
          <b style={{ color: '#16a34a' }}>{stats.activeTeacher}</b>
          <small>Đang hoạt động toàn quyền dạy học</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span>🎓 Học sinh VIP (299k/năm)</span>
          <b style={{ color: '#7c3aed' }}>{stats.activeStudent}</b>
          <small>Mở khóa kho đề & AI Gia sư</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span>Sắp hết / Đã hết hạn</span>
          <b style={{ color: stats.soon > 0 ? 'var(--vt-amber)' : undefined }}>{stats.soon} / {stats.expired}</b>
          <small>{stats.soon > 0 ? `${stats.soon} tài khoản hết trong ≤7 ngày` : 'Không có thuê bao sắp hết'}</small>
        </div>
        <div className="vt-card ad-mini-kpi ad-mini-kpi--actions">
          <button type="button" className="vt-btn sm primary" onClick={() => setShowGrantModal(true)}>
            <IconPlus size={13} /> Cấp gói trực tiếp
          </button>
          <button type="button" className="vt-btn sm" onClick={handleExport}>
            <IconDownload size={13} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* ===== PLAN TYPE FILTER ===== */}
      <div className="vt-card soft" style={{ padding: '0.65rem 1rem' }}>
        <div className="vt-pills" style={{ margin: 0 }}>
          {[
            { id: 'all',     label: `Tất cả gói (${rows.length})` },
            { id: 'teacher', label: `👨‍🏫 Giáo viên PRO · 999k (${enriched.filter((r) => !r.isStudentVip).length})` },
            { id: 'student', label: `🎓 Học sinh VIP · 299k (${enriched.filter((r) => r.isStudentVip).length})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={'vt-pill sm' + (planFilter === f.id ? ' on' : '')}
              onClick={() => setPlanFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== LIST ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconCrown size={16} className="vt-title-ico" />
            Danh sách thuê bao ({filtered.length})
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
            <h3>{loading ? 'Đang tải…' : 'Chưa có thuê bao nào trong mục này'}</h3>
            <p>{loading ? '' : 'Bấm "Cấp gói trực tiếp" hoặc phát hành mã Key PRO / HS VIP.'}</p>
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
                  <th>Tài khoản</th>
                  <th>Gói dịch vụ</th>
                  <th>Key đang dùng</th>
                  <th>Ngày hết hạn</th>
                  <th>Còn lại</th>
                  <th style={{ width: 220 }} />
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
                        <Avatar name={r.name} src={r.avatar} size={34} />
                        <div style={{ minWidth: 0 }}>
                          <b style={{ display: 'block', fontSize: '.9rem' }}>{r.name}</b>
                          <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>{r.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="vt-chip"
                        style={{
                          background: r.isStudentVip ? 'rgba(124, 58, 237, 0.14)' : 'rgba(217, 119, 6, 0.14)',
                          color: r.isStudentVip ? '#a78bfa' : '#f59e0b',
                          border: `1px solid ${r.isStudentVip ? 'rgba(124, 58, 237, 0.35)' : 'rgba(217, 119, 6, 0.35)'}`,
                        }}
                      >
                        {r.isStudentVip ? <IconSparkle size={11} /> : <IconCrown size={11} />}
                        {r.isStudentVip ? 'HS VIP · 299k' : 'GV PRO · 999k'}
                      </span>
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
                          title="Gia hạn thêm ngày (giữ nguyên loại gói)"
                        >
                          <IconExtend size={13} /> Gia hạn
                        </button>
                        <button
                          type="button"
                          className="vt-btn sm"
                          style={{
                            color: r.isStudentVip ? '#d97706' : '#7c3aed',
                            borderColor: r.isStudentVip ? 'rgba(217, 119, 6, 0.4)' : 'rgba(124, 58, 237, 0.4)',
                          }}
                          onClick={() => handleSwitchPackage(r)}
                          title={r.isStudentVip ? 'Chuyển sang Giáo viên PRO (999k/năm)' : 'Chuyển sang Học sinh VIP (299k/năm)'}
                        >
                          {r.isStudentVip ? '→ GV PRO' : '→ HS VIP'}
                        </button>
                        <button
                          type="button"
                          className="vt-icon-btn danger"
                          onClick={() => handleRevoke(r)}
                          title={`Thu hồi ${r.isStudentVip ? 'VIP' : 'PRO'} (Đưa về Thường)`}
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
   MODAL CẤP GÓI TRỰC TIẾP (Giáo viên PRO 999k/năm / Học sinh VIP 299k/năm)
   ============================================================ */
function GrantProDirectModal({ onClose, onDone }) {
  const [planKind, setPlanKind] = useState('teacher'); // teacher | student
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [pickedUser, setPickedUser] = useState(null);
  const [days, setDays] = useState(365);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    adminFetchMergedUsers({ limit: 500 })
      .then((data) => {
        if (alive && Array.isArray(data)) setCandidates(data);
      })
      .catch(() => {});
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
    const rawQuery = query.trim();
    const qLower = rawQuery.toLowerCase();
    const autoPicked =
      pickedUser ||
      candidates.find(
        (u) =>
          String(u.id).toLowerCase() === qLower ||
          (u.email || '').trim().toLowerCase() === qLower
      ) ||
      (matched.length === 1 ? matched[0] : null);

    const uid = autoPicked?.id || rawQuery;
    if (!uid) {
      setErr('Hãy chọn một tài khoản hoặc nhập email / UID người dùng.');
      return;
    }
    setSaving(true);
    try {
      const label = autoPicked?.display_name || autoPicked?.email || uid;
      if (planKind === 'student') {
        await adminGrantVipDirect({ userId: uid, durationDays: days, note: note || 'Cấp Học sinh VIP (299k/năm) từ Admin' });
        onDone(`Đã cấp Học sinh VIP +${days} ngày cho ${label}`);
      } else {
        await adminGrantProDirect({ userId: uid, durationDays: days, note: note || 'Cấp Giáo viên PRO (999k/năm) từ Admin' });
        onDone(`Đã cấp Giáo viên PRO +${days} ngày cho ${label}`);
      }
    } catch (e) {
      setErr(e.message || 'Không cấp được gói.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Cấp gói VIP / PRO trực tiếp"
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
            style={planKind === 'student' ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 0 } : undefined}
          >
            {planKind === 'student' ? <IconSparkle size={14} /> : <IconCrown size={14} />}
            {saving ? 'Đang cấp…' : `Cấp ${planKind === 'student' ? 'HS VIP' : 'GV PRO'} +${days} ngày`}
          </button>
        </>
      }
    >
      <div className="vt-field">
        <span>Chọn loại gói cần cấp</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            type="button"
            className={'vt-btn sm' + (planKind === 'teacher' ? ' primary' : '')}
            onClick={() => setPlanKind('teacher')}
          >
            👨‍🏫 Giáo viên PRO (999k/năm)
          </button>
          <button
            type="button"
            className={'vt-btn sm' + (planKind === 'student' ? ' primary' : '')}
            style={planKind === 'student' ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 0 } : undefined}
            onClick={() => setPlanKind('student')}
          >
            🎓 Học sinh VIP (299k/năm)
          </button>
        </div>
      </div>

      <label className="vt-field">
        <span>Tìm người dùng (theo tên, email hoặc dán UID)</span>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPickedUser(null); }}
          placeholder="Nhập tên, email hoặc UID…"
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
        <span>Thời hạn gói</span>
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
          placeholder={planKind === 'student' ? 'VD: Thanh toán 299k 1 năm' : 'VD: Cấp Giáo viên PRO 999k/năm'}
        />
      </label>

      {err && <p className="vt-muted" style={{ color: 'var(--vt-red)' }}>{err}</p>}
    </Modal>
  );
}
