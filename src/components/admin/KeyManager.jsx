/* ============================================================
   KeyManager.jsx — Quản lý Key PRO cho giáo viên (Compact + Bulk + Profile Lookup)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { supabase } from '../../lib/supabase.js';
import {
  adminCreateProKey,
  adminCreateProKeyBatch,
  adminGetKeys,
  adminDeleteKey,
  adminDeleteKeysBatch,
  adminRevokeKey,
  adminRevokeKeysBatch,
} from '../../lib/proKeyApi.js';
import AdminShell, { Topbar, Avatar, downloadCsv, setGlobalAdminBadges } from './AdminShell.jsx';
import { Modal, ConfirmDialog } from './AdminUI.jsx';
import {
  IconKey, IconPlus, IconTrash, IconCopy, IconCheck,
  IconRefresh, IconRevoke, IconClose, IconDownload, IconCrown, IconSparkle,
} from './AdminIcons.jsx';

const DURATION_PRESETS = [7, 30, 90, 180, 365];
const CREDIT_PRESETS = [100, 500, 1000, 2000, 5000];

const STATUS_TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'unused',   label: 'Chưa dùng' },
  { key: 'active',   label: 'Đang dùng' },
  { key: 'revoked',  label: 'Đã thu hồi' },
];

export function getKeyMeta(k) {
  const code = String(k?.code || '').toUpperCase();
  const note = String(k?.note || '');
  const creditMatch = note.match(/\[CREDIT:(\d+)\]/i);
  if (creditMatch || code.startsWith('CREDIT-')) {
    const amount = creditMatch ? Number(creditMatch[1]) : 500;
    return {
      type: 'credit',
      label: `⚡ Nạp +${amount.toLocaleString('vi-VN')} Credit`,
      badgeColor: '#0284c7',
      badgeBg: 'rgba(2, 132, 199, 0.12)',
    };
  }
  if (note.includes('[STUDENT_VIP') || code.startsWith('VIP-')) {
    return {
      type: 'student',
      label: `⭐ VIP Học sinh · ${k?.duration_days}d`,
      badgeColor: '#7c3aed',
      badgeBg: 'rgba(124, 58, 237, 0.12)',
    };
  }
  return {
    type: 'teacher',
    label: `🎓 Giáo viên PRO · ${k?.duration_days}d`,
    badgeColor: '#d97706',
    badgeBg: 'rgba(217, 119, 6, 0.12)',
  };
}

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
  const [tab, setTab] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [allKeys, setAllKeys] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createCategory, setCreateCategory] = useState('teacher');
  const [showBatch, setShowBatch] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);

  const say = useCallback((text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminGetKeys({ status: 'all', limit: 1000 });
      setAllKeys(list);
      setSelected(new Set());

      // Tra cứu tên & email của người đã kích hoạt key
      const uids = [...new Set(list.map((k) => k.used_by).filter(Boolean))];
      if (uids.length) {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url')
          .in('id', uids.slice(0, 200));
        if (data) {
          setProfiles(Object.fromEntries(data.map((p) => [p.id, p])));
        }
      }
    } catch (e) {
      say('Lỗi tải danh sách: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [say]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = allKeys.length;
    const unused = allKeys.filter((k) => !k.used_by && !k.revoked).length;
    const active = allKeys.filter((k) => k.used_by && !k.revoked).length;
    const revoked = allKeys.filter((k) => k.revoked).length;
    return { total, unused, active, revoked };
  }, [allKeys]);

  const categoryCounts = useMemo(() => {
    let teacher = 0;
    let student = 0;
    let credit = 0;
    allKeys.forEach((k) => {
      const t = getKeyMeta(k).type;
      if (t === 'teacher') teacher++;
      else if (t === 'student') student++;
      else if (t === 'credit') credit++;
    });
    return { teacher, student, credit };
  }, [allKeys]);

  useEffect(() => {
    setGlobalAdminBadges({ key: stats.unused > 0 ? stats.unused : null });
  }, [stats.unused]);

  const filtered = useMemo(() => {
    let list = allKeys;
    if (category !== 'all') {
      list = list.filter((k) => getKeyMeta(k).type === category);
    }
    if (tab === 'unused') list = list.filter((k) => !k.used_by && !k.revoked);
    else if (tab === 'active') list = list.filter((k) => k.used_by && !k.revoked);
    else if (tab === 'revoked') list = list.filter((k) => k.revoked);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((k) => {
        const prof = profiles[k.used_by] || {};
        return (
          String(k.code || '').toLowerCase().includes(q) ||
          String(k.note || '').toLowerCase().includes(q) ||
          String(k.used_by || '').toLowerCase().includes(q) ||
          String(prof.display_name || '').toLowerCase().includes(q) ||
          String(prof.email || '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [allKeys, category, tab, search, profiles]);

  const tabCounts = useMemo(() => {
    let subList = allKeys;
    if (category !== 'all') {
      subList = subList.filter((k) => getKeyMeta(k).type === category);
    }
    return {
      all: subList.length,
      unused: subList.filter((k) => !k.used_by && !k.revoked).length,
      active: subList.filter((k) => k.used_by && !k.revoked).length,
      revoked: subList.filter((k) => k.revoked).length,
    };
  }, [allKeys, category]);

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

  const handleCopyUnused = async () => {
    const unusedCodes = allKeys.filter((k) => !k.used_by && !k.revoked).map((k) => k.code);
    if (!unusedCodes.length) {
      say('Không có key nào chưa dùng để chép.');
      return;
    }
    const ok = await copyToClipboard(unusedCodes.join('\n'));
    if (ok) say(`Đã chép ${unusedCodes.length} mã key chưa dùng vào bộ nhớ tạm`);
  };

  const handleCopySelected = async () => {
    const codes = allKeys.filter((k) => selected.has(k.id)).map((k) => k.code);
    if (!codes.length) return;
    if (await copyToClipboard(codes.join('\n'))) {
      say(`Đã chép ${codes.length} mã key đã chọn`);
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

  const handleBulkRevoke = () => {
    const ids = [...selected];
    if (!ids.length) return;
    setConfirm({
      title: `Thu hồi ${ids.length} key đã chọn?`,
      body: 'Các key này sẽ không thể dùng để kích hoạt thêm.',
      okLabel: `Thu hồi ${ids.length} key`,
      danger: true,
      onOk: async () => {
        setBusy(true);
        try {
          await adminRevokeKeysBatch(ids);
          say(`Đã thu hồi ${ids.length} key`);
          await load();
        } catch (e) {
          say('Lỗi: ' + e.message);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (!ids.length) return;
    setConfirm({
      title: `Xóa vĩnh viễn ${ids.length} key đã chọn?`,
      body: 'Hành động này không thể hoàn tác.',
      okLabel: `Xóa ${ids.length} key`,
      danger: true,
      onOk: async () => {
        setBusy(true);
        try {
          await adminDeleteKeysBatch(ids);
          say(`Đã xóa ${ids.length} key`);
          await load();
        } catch (e) {
          say('Lỗi: ' + e.message);
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleExport = () => {
    if (!filtered.length) {
      say('Chưa có key để xuất');
      return;
    }
    const rows = [['Mã key', 'Số ngày', 'Ghi chú', 'Ngày tạo', 'Người dùng', 'Email', 'Ngày dùng', 'Trạng thái']];
    filtered.forEach((k) => {
      const p = profiles[k.used_by] || {};
      rows.push([
        k.code,
        k.duration_days,
        k.note || '',
        fmtDate(k.created_at),
        p.display_name || k.used_by || '',
        p.email || '',
        fmtDate(k.used_at),
        k.revoked ? 'Đã thu hồi' : k.used_by ? 'Đang dùng' : 'Chưa dùng',
      ]);
    });
    downloadCsv(`key-pro-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    say('Đã xuất ' + filtered.length + ' key');
  };

  const toggleSelect = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const tabs = STATUS_TABS.map((t) => ({ ...t, count: tabCounts[t.key] || 0 }));
  const badges = { key: stats.unused > 0 ? stats.unused : null };

  return (
    <AdminShell active="keys" onChange={(k) => { window.location.hash = `admin/${k}`; }} badges={badges}>
      <Topbar
        title="Quản lý Key & Gói Dịch Vụ"
        subtitle={`${filtered.length} key hiển thị · ${stats.unused} mã sẵn sàng · ${categoryCounts.teacher} Giáo viên PRO · ${categoryCounts.student} VIP Học sinh · ${categoryCounts.credit} Thẻ Credit`}
        tabs={tabs}
        active={tab}
        onTab={setTab}
        search={search}
        onSearch={setSearch}
        placeholder="Tìm mã key, ghi chú hoặc email/tên người dùng…"
      />

      {/* ===== COMPACT KPI STRIP ===== */}
      <div className="ad-kpi-strip ad-kpi-strip--4">
        <div className="vt-card ad-mini-kpi">
          <span className="ad-mini-kpi-label">Tổng phát hành</span>
          <b className="ad-mini-kpi-val">{stats.total}</b>
          <small className="ad-mini-kpi-sub">Giáo viên: {categoryCounts.teacher} · VIP: {categoryCounts.student} · Thẻ: {categoryCounts.credit}</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span className="ad-mini-kpi-label">Chưa dùng (Sẵn sàng)</span>
          <b className="ad-mini-kpi-val" style={{ color: '#16a34a' }}>{stats.unused}</b>
          <small className="ad-mini-kpi-sub">Sẵn sàng gửi cấp cho người dùng</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span className="ad-mini-kpi-label">Đang kích hoạt</span>
          <b className="ad-mini-kpi-val">{stats.active}</b>
          <small className="ad-mini-kpi-sub">Người dùng đang sử dụng quyền hạn</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span className="ad-mini-kpi-label">Đã thu hồi / Khóa</span>
          <b className="ad-mini-kpi-val" style={{ color: '#ef4444' }}>{stats.revoked}</b>
          <small className="ad-mini-kpi-sub">Vô hiệu hóa hoặc hết hạn</small>
        </div>
      </div>

      {/* ===== CATEGORY FILTER & ACTION TOOLBAR ===== */}
      <div className="vt-card soft" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          {/* Nhóm lọc loại key */}
          <div className="vt-pills" style={{ margin: 0 }}>
            {[
              { id: 'all',     label: `Tất cả (${stats.total})` },
              { id: 'teacher', label: `🎓 Giáo viên PRO (${categoryCounts.teacher})` },
              { id: 'student', label: `⭐ VIP Học sinh (${categoryCounts.student})` },
              { id: 'credit',  label: `⚡ Thẻ Credit AI (${categoryCounts.credit})` },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                className={'vt-pill' + (category === c.id ? ' on' : '')}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Các nút hành động phát hành key */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="vt-btn sm primary"
              onClick={() => { setCreateCategory('teacher'); setShowCreate(true); }}
              title="Phát hành Key PRO cho Giáo viên"
            >
              <IconCrown size={13} /> + Key Giáo viên
            </button>
            <button
              type="button"
              className="vt-btn sm primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 0 }}
              onClick={() => { setCreateCategory('student'); setShowCreate(true); }}
              title="Phát hành Key VIP/PRO mở khóa Phòng thi ảo cho Học sinh"
            >
              <IconSparkle size={13} /> + Key Học sinh VIP
            </button>
            <button
              type="button"
              className="vt-btn sm primary"
              style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', border: 0 }}
              onClick={() => { setCreateCategory('credit'); setShowCreate(true); }}
              title="Phát hành Mã thẻ nạp Credit AI (100, 500, 1000, 5000 điểm)"
            >
              <IconKey size={13} /> + Thẻ Credit AI
            </button>
            <button type="button" className="vt-btn sm" onClick={() => setShowBatch(true)} title="Tạo hàng loạt nhiều key cùng lúc">
              Tạo hàng loạt
            </button>
            <button type="button" className="vt-btn sm" onClick={handleCopyUnused} disabled={stats.unused === 0} title="Chép toàn bộ mã chưa dùng">
              <IconCopy size={13} /> Chép mã trống
            </button>
            <button type="button" className="vt-btn sm" onClick={handleExport} title="Xuất file CSV danh sách key">
              <IconDownload size={13} /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* ===== LIST ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconKey size={16} className="vt-title-ico" />
            Danh sách mã key ({filtered.length})
          </h3>
          <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
            <IconRefresh size={13} /> {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
        </header>

        {selected.size > 0 && (
          <div className="vt-bulk-bar" style={{ marginTop: 0, marginBottom: '.8rem' }}>
            <span>Đã chọn <b>{selected.size}</b> key</span>
            <button type="button" className="vt-btn sm" onClick={handleCopySelected}>
              <IconCopy size={13} /> Chép mã
            </button>
            <button type="button" className="vt-btn sm" disabled={busy} onClick={handleBulkRevoke}>
              <IconRevoke size={13} /> Thu hồi
            </button>
            <button type="button" className="vt-btn sm danger" disabled={busy} onClick={handleBulkDelete}>
              <IconTrash size={13} /> Xóa
            </button>
            <button type="button" className="vt-btn sm" onClick={() => setSelected(new Set())}>
              <IconClose size={12} /> Bỏ chọn
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="vt-empty">
            <span><IconKey size={30} /></span>
            <h3>{loading ? 'Đang tải…' : 'Chưa có key nào trong danh mục này'}</h3>
            <p>{loading ? '' : 'Bấm vào các nút tạo key ở thanh công cụ phía trên để phát hành mã mới.'}</p>
          </div>
        ) : (
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every((k) => selected.has(k.id))}
                      onChange={() => {
                        const all = filtered.every((k) => selected.has(k.id));
                        setSelected(all ? new Set() : new Set(filtered.map((k) => k.id)));
                      }}
                    />
                  </th>
                  <th>Mã key & Ghi chú</th>
                  <th>Phân loại</th>
                  <th>Thời hạn & Ngày tạo</th>
                  <th>Người kích hoạt</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 120 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => {
                  const meta = getKeyMeta(k);
                  const status = k.revoked
                    ? { label: 'Đã thu hồi', cls: 'kicked' }
                    : k.used_by
                      ? { label: 'Đang dùng', cls: 'ready' }
                      : { label: 'Chưa dùng', cls: 'soon' };
                  const prof = profiles[k.used_by];
                  return (
                    <tr key={k.id} className={selected.has(k.id) ? 'vt-row-selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(k.id)}
                          onChange={() => toggleSelect(k.id)}
                        />
                      </td>
                      <td>
                        <code className="vt-key-code">{k.code}</code>
                        <div className="vt-key-meta">
                          {k.note ? k.note.replace(/\[(CREDIT|STUDENT_VIP)[^\]]*\]/gi, '').trim() || k.note : `Hiệu lực ${k.duration_days} ngày`}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            color: meta.badgeColor,
                            background: meta.badgeBg,
                          }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '.8rem' }}>{fmtDate(k.created_at)}</div>
                        {k.used_at && (
                          <div style={{ fontSize: '.7rem', color: 'var(--mut)' }}>
                            kích hoạt: {fmtDate(k.used_at)}
                          </div>
                        )}
                      </td>
                      <td>
                        {k.used_by ? (
                          prof ? (
                            <div className="vt-user-cell">
                              <Avatar name={prof.display_name || 'G'} size={28} />
                              <div style={{ minWidth: 0 }}>
                                <b style={{ display: 'block', fontSize: '.83rem' }}>{prof.display_name || 'Chưa đặt tên'}</b>
                                <small style={{ color: 'var(--mut)', fontSize: '.7rem' }}>{prof.email || String(k.used_by).slice(0, 12)}</small>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '.75rem', fontFamily: 'var(--mono)' }}>
                              {String(k.used_by).slice(0, 14)}…
                            </span>
                          )
                        ) : (
                          <span className="vt-muted" style={{ fontSize: '.78rem' }}>Chưa kích hoạt</span>
                        )}
                      </td>
                      <td>
                        <span className={'vt-chip ' + status.cls}>{status.label}</span>
                      </td>
                      <td>
                        <div className="vt-row-actions">
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

      {showCreate && (
        <CreateKeyModal
          initialCategory={createCategory}
          onClose={() => setShowCreate(false)}
          onDone={(key) => {
            setShowCreate(false);
            say('Đã tạo key ' + key.code);
            load();
          }}
        />
      )}

      {showBatch && (
        <CreateBatchModal
          initialCategory={createCategory}
          onClose={() => setShowBatch(false)}
          onDone={(list) => {
            setShowBatch(false);
            say(`Đã tạo ${list.length} key`);
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
   MODAL TẠO 1 KEY (Đa năng: Teacher PRO / Student VIP / Credit)
   ============================================================ */
function CreateKeyModal({ initialCategory = 'teacher', onClose, onDone }) {
  const { user } = useAuth();
  const [cat, setCat] = useState(initialCategory);
  const [days, setDays] = useState(30);
  const [customDays, setCustomDays] = useState('');
  const [credits, setCredits] = useState(500);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const finalDays = customDays ? Math.max(1, Math.min(3650, Number(customDays) || 0)) : days;

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      let prefix = 'PRO';
      let payloadDays = finalDays;
      let finalNote = note.trim();

      if (cat === 'credit') {
        prefix = 'CREDIT';
        payloadDays = 365;
        finalNote = `[CREDIT:${credits}] ${finalNote || 'Thẻ nạp điểm AI'}`.trim();
      } else if (cat === 'student') {
        prefix = 'VIP';
        finalNote = `[STUDENT_VIP:${payloadDays}] ${finalNote || 'Gói VIP Học sinh'}`.trim();
      }

      const key = await adminCreateProKey({
        durationDays: payloadDays,
        note: finalNote,
        createdBy: user?.uid || null,
        prefix,
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
      title="Phát hành Mã Key Mới"
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
            style={{
              background: cat === 'student'
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : cat === 'credit'
                  ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                  : undefined,
              border: 0,
            }}
          >
            <IconKey size={14} /> {saving ? 'Đang tạo…' : 'Tạo mã ngay'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Loại Key / Gói dịch vụ</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { id: 'teacher', label: '🎓 Giáo viên PRO', color: '#d97706' },
              { id: 'student', label: '⭐ VIP Học sinh', color: '#7c3aed' },
              { id: 'credit',  label: '⚡ Nạp Credit AI', color: '#0284c7' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={'vt-btn sm' + (cat === item.id ? ' primary' : '')}
                style={{
                  fontSize: 11,
                  padding: '6px 4px',
                  borderColor: cat === item.id ? item.color : undefined,
                  background: cat === item.id ? item.color : undefined,
                  color: cat === item.id ? '#fff' : undefined,
                }}
                onClick={() => setCat(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {cat === 'credit' ? (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Mệnh giá thẻ (Điểm AI)</label>
            <div className="vt-pills">
              {CREDIT_PRESETS.map((cr) => (
                <button
                  key={cr}
                  type="button"
                  className={'vt-pill sm' + (credits === cr ? ' on' : '')}
                  onClick={() => setCredits(cr)}
                >
                  +{cr.toLocaleString('vi-VN')} điểm
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Thời hạn kích hoạt</label>
            <div className="vt-pills">
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
            <div style={{ marginTop: 8 }}>
              <input
                type="number"
                min={1}
                max={3650}
                className="vt-search-input"
                style={{ width: '100%', fontSize: 12 }}
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="Hoặc tự nhập số ngày (VD: 500)"
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Ghi chú mã (tùy chọn)</label>
          <input
            className="vt-search-input"
            style={{ width: '100%' }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Quà tặng kỳ thi HSA, Thưởng thành tích..."
            maxLength={120}
          />
        </div>

        {err && <p className="vt-muted" style={{ color: 'var(--vt-red)', margin: 0 }}>{err}</p>}

        <p className="vt-muted" style={{ fontSize: '.75rem', margin: 0 }}>
          {cat === 'credit'
            ? `Thẻ sinh ra dạng CREDIT-XXXX-XXXX, cộng +${credits} điểm AI khi kích hoạt.`
            : `Key sinh ra dạng ${cat === 'student' ? 'VIP-XXXX-XXXX' : 'PRO-XXXX-XXXX'}, có hiệu lực ${finalDays} ngày.`}
        </p>
      </div>
    </Modal>
  );
}

/* ============================================================
   MODAL TẠO HÀNG LOẠT
   ============================================================ */
function CreateBatchModal({ initialCategory = 'teacher', onClose, onDone }) {
  const { user } = useAuth();
  const [cat, setCat] = useState(initialCategory);
  const [count, setCount] = useState(5);
  const [days, setDays] = useState(30);
  const [credits, setCredits] = useState(500);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErr('');
    const n = Math.max(1, Math.min(100, Number(count) || 0));
    const d = Math.max(1, Math.min(3650, Number(days) || 0));
    if (!n) {
      setErr('Số lượng phải > 0.');
      return;
    }
    setSaving(true);
    try {
      let prefix = 'PRO';
      let payloadDays = d;
      let finalNote = note.trim();

      if (cat === 'credit') {
        prefix = 'CREDIT';
        payloadDays = 365;
        finalNote = `[CREDIT:${credits}] ${finalNote || 'Thẻ nạp điểm AI'}`.trim();
      } else if (cat === 'student') {
        prefix = 'VIP';
        finalNote = `[STUDENT_VIP:${payloadDays}] ${finalNote || 'Gói VIP Học sinh'}`.trim();
      }

      const list = await adminCreateProKeyBatch({
        count: n,
        durationDays: payloadDays,
        note: finalNote,
        createdBy: user?.uid || null,
        prefix,
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
      title="Tạo Hàng Loạt Mã Key"
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
            style={{
              background: cat === 'student'
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : cat === 'credit'
                  ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                  : undefined,
              border: 0,
            }}
          >
            <IconKey size={14} /> {saving ? 'Đang tạo…' : `Tạo ${count} mã ngay`}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="vt-muted" style={{ marginTop: 0, fontSize: '.78rem' }}>
          Tối đa 100 mã mỗi lần. Sau khi tạo, bạn có thể xuất file CSV hoặc chép mã 1 chạm để phát hành.
        </p>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Loại Key / Gói dịch vụ</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { id: 'teacher', label: '🎓 Giáo viên PRO', color: '#d97706' },
              { id: 'student', label: '⭐ VIP Học sinh', color: '#7c3aed' },
              { id: 'credit',  label: '⚡ Nạp Credit AI', color: '#0284c7' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={'vt-btn sm' + (cat === item.id ? ' primary' : '')}
                style={{
                  fontSize: 11,
                  padding: '6px 4px',
                  borderColor: cat === item.id ? item.color : undefined,
                  background: cat === item.id ? item.color : undefined,
                  color: cat === item.id ? '#fff' : undefined,
                }}
                onClick={() => setCat(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Số lượng mã cần tạo</label>
          <input
            type="number"
            min={1}
            max={100}
            className="vt-search-input"
            style={{ width: '100%' }}
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>

        {cat === 'credit' ? (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Mệnh giá mỗi thẻ</label>
            <div className="vt-pills">
              {CREDIT_PRESETS.map((cr) => (
                <button
                  key={cr}
                  type="button"
                  className={'vt-pill sm' + (credits === cr ? ' on' : '')}
                  onClick={() => setCredits(cr)}
                >
                  +{cr} điểm
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Thời hạn mỗi key (ngày)</label>
            <div className="vt-pills">
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
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Ghi chú chung</label>
          <input
            className="vt-search-input"
            style={{ width: '100%' }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Đợt phát hành Tháng 10/2026..."
            maxLength={120}
          />
        </div>

        {err && <p className="vt-muted" style={{ color: 'var(--vt-red)', margin: 0 }}>{err}</p>}
      </div>
    </Modal>
  );
}
