/* ============================================================
   UserManager.jsx — Quản lý người dùng (100% SVG, Cấp PRO 1 chạm & Hồ sơ chi tiết)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  adminGrantProDirect,
  adminRevokeProDirect,
  adminGrantVipDirect,
  adminRevokeVipDirect,
  isProActive,
  daysLeft,
} from '../../lib/proKeyApi.js';
import { getCredits, adminAdjustCredits } from '../../lib/creditService.js';
import AdminShell, { Topbar, Avatar, downloadCsv } from './AdminShell.jsx';
import { Modal, ConfirmDialog } from './AdminUI.jsx';
import {
  IconUsers, IconRefresh, IconCrown, IconCopy, IconCheck, IconEye, IconDownload, IconSparkle,
} from './AdminIcons.jsx';
import { ROLES } from './adminConstants.js';
import { copyText, formatDate, friendlyError } from './adminUtils.js';

const PAGE = 200;

export default function UserManager() {
  const { user } = useAuth();
  const myId = user?.uid || user?.id;

  const [users, setUsers] = useState([]);
  const [proMap, setProMap] = useState({});
  const [creditsMap, setCreditsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [savingId, setSavingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [inspectUser, setInspectUser] = useState(null);
  const [creditModalUser, setCreditModalUser] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);
  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const reqId = useRef(0);

  const fetchPage = useCallback(async (from) => {
    let res = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url, role, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (res.error && /column .*email.* does not exist/i.test(res.error.message || '')) {
      res = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role, created_at')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
    }
    if (res.error) throw res.error;
    return res.data || [];
  }, []);

  const loadProMap = useCallback(async () => {
    try {
      const { data } = await supabase.from('pro_users').select('user_id, expiry, key_code, note');
      if (data) {
        setProMap(Object.fromEntries(data.map((p) => [p.user_id, p])));
      }
    } catch { /* ignore */ }
  }, []);

  const loadCreditsMap = useCallback(async () => {
    try {
      const { data } = await supabase.from('user_credits').select('user_id, balance');
      if (data) {
        setCreditsMap(Object.fromEntries(data.map((c) => [c.user_id, Number(c.balance) || 0])));
      }
    } catch { /* ignore */ }
  }, []);

  const load = useCallback(async () => {
    const my = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const [rows] = await Promise.all([fetchPage(0), loadProMap(), loadCreditsMap()]);
      if (my !== reqId.current) return;
      setUsers(rows);
      setHasMore(rows.length === PAGE);
    } catch (e) {
      if (my !== reqId.current) return;
      setError(friendlyError(e));
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, [fetchPage, loadProMap, loadCreditsMap]);

  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const rows = await fetchPage(users.length);
      setUsers((u) => [...u, ...rows.filter((r) => !u.some((x) => x.id === r.id))]);
      setHasMore(rows.length === PAGE);
    } catch (e) {
      say('Không tải thêm được: ' + friendlyError(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const counts = useMemo(() => {
    const c = { all: users.length };
    users.forEach((u) => { const r = u.role || 'user'; c[r] = (c[r] || 0) + 1; });
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === 'vip') {
        const pro = proMap[u.id];
        const isVip = Boolean((pro?.note || '').includes('[STUDENT_VIP') || String(pro?.key_code || '').startsWith('VIP-') || u.role === 'vip');
        if (!isVip || !pro || !isProActive(pro.expiry)) return false;
      } else if (roleFilter === 'pro') {
        const pro = proMap[u.id];
        const isVip = Boolean((pro?.note || '').includes('[STUDENT_VIP') || String(pro?.key_code || '').startsWith('VIP-') || u.role === 'vip');
        if (!pro || !isProActive(pro.expiry) || isVip) return false;
      } else if (roleFilter === 'zeroCredits') {
        if ((creditsMap[u.id] ?? 0) !== 0) return false;
      } else if (roleFilter !== 'all' && (u.role || 'user') !== roleFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        String(u.id).toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, proMap, creditsMap]);

  const changeRole = (u, role) => {
    if (role === (u.role || 'user')) return;
    if (u.id === myId) {
      say('Bạn không thể tự đổi vai trò của chính mình.');
      return;
    }
    const roleName = ROLES.find((r) => r.id === role)?.name || role;
    setConfirm({
      title: 'Đổi vai trò tài khoản',
      body: `Đổi "${u.display_name || 'Chưa đặt tên'}" thành ${roleName}?${role === 'admin' ? ' Tài khoản này sẽ có toàn quyền quản trị hệ thống.' : ''}`,
      okLabel: 'Đổi vai trò',
      danger: role === 'admin',
      onOk: async () => {
        setSavingId(u.id);
        try {
          const { error: e } = await supabase.from('profiles').update({ role }).eq('id', u.id);
          if (e) throw e;
          setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, role } : x)));
          say('Đã cập nhật vai trò');
        } catch (e) {
          say('Không đổi được: ' + friendlyError(e));
        } finally {
          setSavingId(null);
        }
      },
    });
  };

  const handleQuickGrantPro = async (u, days = 30) => {
    setSavingId(u.id);
    try {
      await adminGrantProDirect({ userId: u.id, durationDays: days, note: 'Cấp từ Quản lý Người dùng' });
      await loadProMap();
      say(`Đã cấp PRO +${days} ngày cho ${u.display_name || u.id}`);
    } catch (e) {
      say('Không cấp được PRO: ' + friendlyError(e));
    } finally {
      setSavingId(null);
    }
  };

  const handleRevokePro = (u) => {
    setConfirm({
      title: 'Hủy gói PRO?',
      body: `Hủy bỏ gói PRO của "${u.display_name || u.id}" và chuyển về tài khoản Thường?`,
      okLabel: 'Hủy gói PRO',
      danger: true,
      onOk: async () => {
        setSavingId(u.id);
        try {
          await adminRevokeProDirect(u.id);
          await loadProMap();
          say(`Đã hủy quyền PRO của ${u.display_name || u.id}`);
        } catch (e) {
          say('Lỗi: ' + friendlyError(e));
        } finally {
          setSavingId(null);
        }
      },
    });
  };

  const handleGrantVip = async (u, days = 365) => {
    setSavingId(u.id);
    try {
      await adminGrantVipDirect({ userId: u.id, durationDays: days, note: 'Nâng lên VIP từ Quản lý Người dùng' });
      await loadProMap();
      say(`Đã nâng cấp ${u.display_name || u.id} lên VIP (+${days} ngày)`);
    } catch (e) {
      say('Không nâng được VIP: ' + friendlyError(e));
    } finally {
      setSavingId(null);
    }
  };

  const handleRevokeVip = (u) => {
    setConfirm({
      title: 'Hạ gói VIP?',
      body: `Hạ tài khoản "${u.display_name || u.id}" khỏi gói VIP và chuyển về tài khoản Thường?`,
      okLabel: 'Hạ khỏi VIP',
      danger: true,
      onOk: async () => {
        setSavingId(u.id);
        try {
          await adminRevokeVipDirect(u.id);
          await loadProMap();
          say(`Đã hạ quyền VIP của ${u.display_name || u.id} về Thường`);
        } catch (e) {
          say('Lỗi: ' + friendlyError(e));
        } finally {
          setSavingId(null);
        }
      },
    });
  };

  const handleCopyId = async (id) => {
    if (await copyText(String(id))) {
      setCopiedId(id);
      say('Đã sao chép ID người dùng');
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleExportCsv = () => {
    if (!filtered.length) return say('Chưa có dữ liệu để xuất.');
    const rows = [['Tên hiển thị', 'Email', 'ID', 'Vai trò', 'Điểm AI (Credit)', 'Trạng thái Gói', 'Ngày tạo']];
    filtered.forEach((u) => {
      const pro = proMap[u.id];
      const activePro = pro && isProActive(pro.expiry);
      const isVip = Boolean((pro?.note || '').includes('[STUDENT_VIP') || String(pro?.key_code || '').startsWith('VIP-') || u.role === 'vip');
      const planStr = activePro && isVip
        ? `VIP còn ${daysLeft(pro.expiry)} ngày`
        : activePro
          ? `PRO còn ${daysLeft(pro.expiry)} ngày`
          : 'Thường';
      rows.push([
        u.display_name || 'Chưa đặt tên',
        u.email || '',
        u.id,
        u.role || 'user',
        creditsMap[u.id] ?? 0,
        planStr,
        formatDate(u.created_at),
      ]);
    });
    downloadCsv(`nguoi-dung-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    say(`Đã xuất ${filtered.length} tài khoản`);
  };

  const activeProCount = useMemo(
    () => users.filter((u) => {
      const p = proMap[u.id];
      const isVip = (p?.note || '').includes('[STUDENT_VIP') || String(p?.key_code || '').startsWith('VIP-') || u.role === 'vip';
      return p && isProActive(p.expiry) && !isVip;
    }).length,
    [users, proMap],
  );

  const activeVipCount = useMemo(
    () => users.filter((u) => {
      const p = proMap[u.id];
      const isVip = (p?.note || '').includes('[STUDENT_VIP') || String(p?.key_code || '').startsWith('VIP-') || u.role === 'vip';
      return p && isProActive(p.expiry) && isVip;
    }).length,
    [users, proMap],
  );

  const roleCounts = useMemo(() => ({
    all: counts.all || 0,
    user: counts.user || 0,
    teacher: counts.teacher || 0,
    admin: counts.admin || 0,
    vip: activeVipCount,
    pro: activeProCount,
    zeroCredits: users.filter((u) => (creditsMap[u.id] ?? 0) === 0).length,
  }), [counts, activeVipCount, activeProCount, users, creditsMap]);

  const tabs = [
    { key: 'all',         label: 'Tất cả',           count: roleCounts.all },
    { key: 'user',        label: 'Học sinh',         count: roleCounts.user },
    { key: 'teacher',     label: 'Giáo viên',        count: roleCounts.teacher },
    { key: 'vip',         label: '⭐ VIP Học sinh',  count: roleCounts.vip },
    { key: 'pro',         label: '👑 Giáo viên PRO', count: roleCounts.pro },
    { key: 'zeroCredits', label: '⚡ Hết Credit (0)', count: roleCounts.zeroCredits },
    { key: 'admin',       label: 'Quản trị',         count: roleCounts.admin },
  ];

  if (loading && users.length === 0) {
    return (
      <AdminShell active="users" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <div className="vt-loading">
          <div className="page-loader-spinner" />
          <p>Đang tải người dùng…</p>
        </div>
      </AdminShell>
    );
  }

  if (error && users.length === 0) {
    return (
      <AdminShell active="users" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <div className="vt-empty">
          <span><IconUsers size={30} /></span>
          <h3>Không tải được dữ liệu</h3>
          <p>{error}</p>
          <button type="button" className="vt-btn primary" onClick={load}>Thử lại</button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="users" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Quản lý Người dùng"
        subtitle={`${filtered.length}${hasMore ? '+' : ''} tài khoản · Đổi vai trò hoặc cấp PRO trực tiếp`}
        tabs={tabs}
        active={roleFilter}
        onTab={setRoleFilter}
        onSearch={setSearch}
        search={search}
        placeholder="Tìm theo tên, email hoặc ID…"
      />

      {/* ===== COMPACT KPI STRIP (100% SVG, không emoji) ===== */}
      <div className="ad-kpi-strip ad-kpi-strip--4">
        <div className="vt-card ad-mini-kpi">
          <span>Tổng tài khoản</span>
          <b>{roleCounts.all}</b>
          <small>Học sinh: {roleCounts.user}</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span>Giáo viên</span>
          <b>{roleCounts.teacher}</b>
          <small>Đang có gói PRO: {roleCounts.pro}</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span>Quản trị viên</span>
          <b>{roleCounts.admin}</b>
          <small>Toàn quyền quản lý hệ thống</small>
        </div>
        <div className="vt-card ad-mini-kpi ad-mini-kpi--actions">
          <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
            <IconRefresh size={13} /> {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
          <button type="button" className="vt-btn sm" onClick={handleExportCsv}>
            <IconDownload size={13} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* ===== LIST ===== */}
      {filtered.length === 0 ? (
        <div className="vt-empty">
          <span><IconUsers size={30} /></span>
          <h3>Không có người dùng nào</h3>
          <p>{search || roleFilter !== 'all' ? 'Thử đổi bộ lọc hoặc từ khóa.' : 'Chưa có tài khoản nào trong hệ thống.'}</p>
        </div>
      ) : (
        <div className="vt-card">
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>ID tài khoản</th>
                  <th>Điểm AI</th>
                  <th>Gói Bản quyền</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th style={{ width: 140 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isMe = u.id === myId;
                  const pro = proMap[u.id];
                  const activePro = pro && isProActive(pro.expiry);
                  const left = activePro ? daysLeft(pro.expiry) : 0;
                  const isVip = Boolean(
                    (pro?.note || '').includes('[STUDENT_VIP') ||
                    String(pro?.key_code || '').startsWith('VIP-') ||
                    u.role === 'vip'
                  );

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="vt-user-cell">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="vt-avatar-img"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <Avatar name={u.display_name || 'U'} size={34} />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <b style={{ display: 'block', fontSize: '.88rem' }}>
                              {u.display_name || 'Chưa đặt tên'}
                              {isMe && <span className="vt-chip" style={{ marginLeft: '.4rem', fontSize: '.62rem' }}>Bạn</span>}
                            </b>
                            {u.email && <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>{u.email}</small>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
                          <code style={{ fontFamily: 'var(--mono)', fontSize: '.76rem', color: 'var(--mut)' }}>
                            {String(u.id).slice(0, 12)}…
                          </code>
                          <button
                            type="button"
                            className="vt-icon-btn"
                            style={{ width: 24, height: 24 }}
                            onClick={() => handleCopyId(u.id)}
                            title="Sao chép toàn bộ UID"
                          >
                            {copiedId === u.id ? <IconCheck size={12} /> : <IconCopy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="vt-chip"
                          style={{
                            fontFamily: 'var(--mono)',
                            fontWeight: 700,
                            background: (creditsMap[u.id] ?? 0) > 0 ? 'rgba(2, 132, 199, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: (creditsMap[u.id] ?? 0) > 0 ? '#0284c7' : '#ef4444',
                            border: `1px solid ${(creditsMap[u.id] ?? 0) > 0 ? 'rgba(2, 132, 199, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            cursor: 'pointer',
                          }}
                          onClick={() => setCreditModalUser(u)}
                          title="Bấm để nạp hoặc trừ điểm AI"
                        >
                          <IconSparkle size={11} /> {(creditsMap[u.id] ?? 0).toLocaleString('vi-VN')}
                        </button>
                      </td>
                      <td>
                        {activePro && isVip ? (
                          <span
                            className="vt-chip"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                              color: '#fff',
                              border: 0,
                              fontWeight: 700,
                            }}
                          >
                            <IconSparkle size={11} /> VIP ({left}d)
                          </span>
                        ) : activePro ? (
                          <span className={'vt-chip ' + (left <= 7 ? 'soon' : 'ready')}>
                            <IconCrown size={11} /> PRO ({left}d)
                          </span>
                        ) : (
                          <span className="vt-chip closed">Thường</span>
                        )}
                      </td>
                      <td>
                        <div className="vt-user-role-cell">
                          <select
                            value={u.role || 'user'}
                            onChange={(e) => changeRole(u, e.target.value)}
                            disabled={isMe || savingId === u.id}
                            className="vt-select-pill"
                          >
                            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                      </td>
                      <td style={{ fontSize: '.8rem', color: 'var(--mut)' }}>{formatDate(u.created_at)}</td>
                      <td>
                        <div className="vt-row-actions">
                          <button
                            type="button"
                            className="vt-btn sm"
                            style={{ color: '#0284c7', borderColor: 'rgba(2, 132, 199, 0.35)', padding: '0.25rem 0.55rem' }}
                            onClick={() => setCreditModalUser(u)}
                            title="Điều chỉnh số dư Credit AI thủ công"
                          >
                            <IconSparkle size={12} /> Credit
                          </button>

                          {/* Nút Ấn PRO / Bỏ PRO */}
                          {activePro && !isVip ? (
                            <button
                              type="button"
                              className="vt-btn sm danger"
                              disabled={savingId === u.id}
                              onClick={() => handleRevokePro(u)}
                              title="Ấn Không PRO: Gỡ bỏ gói PRO và đưa về tài khoản Thường"
                            >
                              Bỏ PRO
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="vt-btn sm"
                              disabled={savingId === u.id}
                              onClick={() => handleQuickGrantPro(u, 30)}
                              title="Ấn PRO: Cấp hoặc gia hạn 30 ngày PRO"
                            >
                              <IconCrown size={12} /> {activePro ? '+30d' : 'Ấn PRO'}
                            </button>
                          )}

                          {/* Nút Lên VIP / Bỏ VIP */}
                          {activePro && isVip ? (
                            <button
                              type="button"
                              className="vt-btn sm danger"
                              disabled={savingId === u.id}
                              onClick={() => handleRevokeVip(u)}
                              title="Hạ quyền VIP và đưa về tài khoản Thường"
                            >
                              Bỏ VIP
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="vt-btn sm"
                              style={{ color: '#7c3aed', borderColor: 'rgba(124, 58, 237, 0.4)' }}
                              disabled={savingId === u.id}
                              onClick={() => handleGrantVip(u, 365)}
                              title="Nâng cấp lên VIP (Trọn gói 1 năm)"
                            >
                              <IconSparkle size={12} /> Lên VIP
                            </button>
                          )}

                          <button
                            type="button"
                            className="vt-icon-btn"
                            onClick={() => setInspectUser(u)}
                            title="Xem hồ sơ & lịch sử làm bài"
                          >
                            <IconEye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="button" className="vt-btn" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Đang tải…' : `Tải thêm ${PAGE} người dùng`}
              </button>
            </div>
          )}
        </div>
      )}

      {inspectUser && (
        <UserDetailModal
          user={inspectUser}
          pro={proMap[inspectUser.id]}
          onClose={() => setInspectUser(null)}
          onGrantPro={async (days) => {
            await handleQuickGrantPro(inspectUser, days);
          }}
          onRevokePro={() => {
            handleRevokePro(inspectUser);
            setInspectUser(null);
          }}
          onGrantVip={async (days) => {
            await handleGrantVip(inspectUser, days);
          }}
          onRevokeVip={() => {
            handleRevokeVip(inspectUser);
            setInspectUser(null);
          }}
          onAdjustCredits={() => {
            setCreditModalUser(inspectUser);
          }}
        />
      )}

      {creditModalUser && (
        <AdjustCreditModal
          user={creditModalUser}
          onClose={() => setCreditModalUser(null)}
          onUpdated={(newBal, delta) => {
            if (creditModalUser) {
              setCreditsMap((prev) => ({ ...prev, [creditModalUser.id]: newBal }));
            }
            setCreditModalUser(null);
            say(`Đã ${delta >= 0 ? 'cộng' : 'trừ'} ${Math.abs(delta)} credit cho ${creditModalUser.display_name || 'tài khoản'}. Số dư mới: ${newBal} điểm`);
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

function UserDetailModal({ user, pro, onClose, onGrantPro, onRevokePro, onGrantVip, onRevokeVip, onAdjustCredits }) {
  const [attempts, setAttempts] = useState([]);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      supabase
        .from('exam_attempts')
        .select('id, score, correct_count, total_questions, started_at, exam:exams(title)')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10),
      getCredits(user.id),
    ]).then(([attRes, cr]) => {
      if (alive) {
        setAttempts(attRes?.data || []);
        setCredits(cr?.balance ?? 0);
        setLoading(false);
      }
    }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user.id]);

  const activePro = pro && isProActive(pro.expiry);
  const isVip = Boolean(
    (pro?.note || '').includes('[STUDENT_VIP') ||
    String(pro?.key_code || '').startsWith('VIP-') ||
    user.role === 'vip'
  );
  const avgScore = attempts.length
    ? (attempts.reduce((s, a) => s + (Number(a.score) || 0), 0) / attempts.length).toFixed(1)
    : '—';

  return (
    <Modal
      title={user.display_name || 'Chi tiết tài khoản'}
      subtitle={user.email || user.id}
      size="md"
      onClose={onClose}
      foot={
        <>
          <button type="button" className="vt-btn" style={{ color: '#0284c7', borderColor: 'rgba(2, 132, 199, 0.35)' }} onClick={onAdjustCredits}>
            <IconSparkle size={13} /> ⚡ Điểm AI
          </button>

          {/* Quản lý PRO */}
          {activePro && !isVip ? (
            <button type="button" className="vt-btn danger" onClick={onRevokePro} title="Ấn không PRO: Gỡ bỏ gói PRO">
              🚫 Hủy PRO (Về Thường)
            </button>
          ) : (
            <button type="button" className="vt-btn" onClick={() => onGrantPro(30)} title="Ấn PRO: Cấp 30 ngày PRO">
              <IconCrown size={13} /> Cấp PRO 30d
            </button>
          )}

          {/* Quản lý VIP */}
          {activePro && isVip ? (
            <button type="button" className="vt-btn danger" onClick={onRevokeVip} title="Hạ khỏi gói VIP">
              🚫 Hủy VIP (Về Thường)
            </button>
          ) : (
            <button
              type="button"
              className="vt-btn"
              style={{ color: '#7c3aed', borderColor: 'rgba(124, 58, 237, 0.4)' }}
              onClick={() => onGrantVip(365)}
              title="Nâng cấp tài khoản lên VIP 1 năm"
            >
              <IconSparkle size={13} /> Nâng lên VIP (1 năm)
            </button>
          )}

          <button type="button" className="vt-btn primary" onClick={onClose}>Đóng</button>
        </>
      }
    >
      <div className="vt-detail-summary" style={{ marginBottom: '1rem', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="vt-detail-stat">
          <small>Vai trò</small>
          <b>{ROLES.find((r) => r.id === (user.role || 'user'))?.name || user.role}</b>
        </div>
        <div className="vt-detail-stat">
          <small>Gói bản quyền</small>
          <b style={{ color: activePro ? (isVip ? '#7c3aed' : '#16a34a') : undefined }}>
            {activePro && isVip
              ? `VIP (${daysLeft(pro.expiry)} ngày)`
              : activePro
                ? `PRO (${daysLeft(pro.expiry)} ngày)`
                : 'Gói Thường'}
          </b>
        </div>
        <div className="vt-detail-stat">
          <small>Credit AI</small>
          <b style={{ color: '#0284c7' }}>
            {credits !== null ? `${credits.toLocaleString('vi-VN')}đ` : '…'}
          </b>
        </div>
        <div className="vt-detail-stat">
          <small>Lượt làm bài</small>
          <b>{attempts.length} lượt</b>
        </div>
        <div className="vt-detail-stat">
          <small>Điểm TB</small>
          <b>{avgScore}</b>
        </div>
      </div>

      <h4 style={{ margin: '0 0 .5rem', fontSize: '.85rem' }}>10 lượt làm bài gần nhất</h4>
      {loading ? (
        <p className="vt-muted">Đang tải lịch sử làm bài…</p>
      ) : attempts.length === 0 ? (
        <p className="vt-muted">Tài khoản này chưa có lượt làm bài nào.</p>
      ) : (
        <ul className="vt-list">
          {attempts.map((a) => (
            <li key={a.id}>
              <div className="vt-list-main">
                <b style={{ fontSize: '.84rem' }}>{a.exam?.title || 'Đề thi'}</b>
                <small>{formatDate(a.started_at)} · Đúng {a.correct_count ?? 0}/{a.total_questions ?? 0} câu</small>
              </div>
              <b style={{ fontFamily: 'var(--mono)', color: Number(a.score) >= 8 ? '#16a34a' : Number(a.score) >= 5 ? '#f59e0b' : '#ef4444' }}>
                {Number(a.score || 0).toFixed(1)}đ
              </b>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/* ============================================================
   MODAL: ĐIỀU CHỈNH CREDIT AI THỦ CÔNG
   ============================================================ */
function AdjustCreditModal({ user, onClose, onUpdated }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delta, setDelta] = useState(500);
  const [reason, setReason] = useState('Thưởng nạp điểm từ Admin');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getCredits(user.id).then((c) => {
      if (alive) {
        setBalance(c.balance ?? 0);
        setLoading(false);
      }
    }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(delta);
    if (!num || Number.isNaN(num)) return;
    setSaving(true);
    try {
      const res = await adminAdjustCredits(user.id, num, reason);
      if (res.ok) {
        onUpdated(res.balance, num);
      }
    } finally {
      setSaving(false);
    }
  };

  const presets = [100, 500, 1000, 2000, 5000, -100, -500];

  return (
    <Modal
      title="⚡ Điều Chỉnh Credit AI Thủ Công"
      subtitle={`${user.display_name || 'Người dùng'} · ${user.email || user.id}`}
      onClose={onClose}
      size="sm"
      foot={
        <>
          <button type="button" className="vt-btn" onClick={onClose}>Đóng</button>
          <button
            type="button"
            className="vt-btn primary"
            onClick={handleSubmit}
            disabled={saving || !Number(delta)}
            style={{ background: Number(delta) >= 0 ? 'linear-gradient(135deg, #0284c7, #2563eb)' : '#ef4444', border: 0 }}
          >
            {saving ? 'Đang cập nhật…' : (Number(delta) >= 0 ? `+ Cộng ${delta} điểm` : `- Trừ ${Math.abs(delta)} điểm`)}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'var(--vt-soft)', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <small style={{ color: 'var(--mut)', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Số dư hiện tại</small>
            <b style={{ fontSize: 20, color: 'var(--ink)' }}>{loading ? '…' : (balance ?? 0).toLocaleString('vi-VN')} điểm</b>
          </div>
          {Number(delta) !== 0 && (
            <div style={{ textAlign: 'right' }}>
              <small style={{ color: 'var(--mut)', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Số dư sau điều chỉnh</small>
              <b style={{ fontSize: 20, color: Number(delta) > 0 ? '#16a34a' : '#ef4444' }}>
                {loading ? '…' : Math.max(0, (balance || 0) + Number(delta)).toLocaleString('vi-VN')} điểm
              </b>
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Chọn nhanh mức điểm</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                className={`vt-chip ${p > 0 ? 'ready' : 'closed'}`}
                style={{
                  cursor: 'pointer',
                  fontWeight: delta === p ? 800 : 600,
                  border: delta === p ? '2px solid currentColor' : '1px solid transparent',
                  padding: '4px 9px',
                }}
                onClick={() => setDelta(p)}
              >
                {p > 0 ? `+${p}` : p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Số điểm cần cộng / trừ (*)</label>
          <input
            type="number"
            className="vt-search-input"
            style={{ width: '100%', fontSize: 15, fontWeight: 700 }}
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
          />
          <small style={{ color: 'var(--mut)', fontSize: 11, marginTop: 2, display: 'block' }}>
            Nhập số dương (+) để cộng điểm, số âm (-) để trừ điểm.
          </small>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Lý do điều chỉnh</label>
          <input
            type="text"
            className="vt-search-input"
            style={{ width: '100%' }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Thưởng thành tích xuất sắc, bù lỗi server..."
          />
        </div>
      </form>
    </Modal>
  );
}
