/* ============================================================
   AuditLogPage.jsx — Nhật ký Kiểm toán Admin (Enterprise Audit Trail)
   ------------------------------------------------------------
   Ghi nhận bất biến mọi thao tác quản trị (cấp PRO/VIP, cộng/trừ Credit,
   đổi quyền, tạo/thu hồi Key, xử lý báo lỗi, bật/tắt bảo trì) từ Firestore
   `admin_audit_logs`, hỗ trợ lọc, tìm kiếm & xuất CSV.
   ============================================================ */
import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminShell, { Topbar, downloadCsv } from './AdminShell.jsx';
import {
  IconShield, IconRefresh, IconDownload, IconSearch, IconWarning, IconClock,
} from './AdminIcons.jsx';
import {
  AUDIT_ACTION_META,
  fetchAdminAuditLogs,
  subscribeAdminAuditLogs,
} from '../../lib/adminAuditService.js';
import { friendlyError } from './adminUtils.js';

const TONE_STYLE = {
  ok:   { bg: 'rgba(22,163,74,0.13)',  fg: '#15803d' },
  info: { bg: 'rgba(37,99,235,0.13)',  fg: '#2563eb' },
  warn: { bg: 'rgba(245,158,11,0.14)', fg: '#d97706' },
  bad:  { bg: 'rgba(220,38,38,0.13)',  fg: '#dc2626' },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAdminAuditLogs(
      (list) => {
        setLogs(list);
        setLoading(false);
        setError('');
      },
      (err) => {
        setLoading(false);
        setError(
          err?.code === 'permission-denied'
            ? 'Firestore Rules cho "admin_audit_logs" chưa được deploy hoặc tài khoản chưa có quyền Admin Claim trên Firebase.'
            : friendlyError(err)
        );
      },
      250
    );
    return () => unsub?.();
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchAdminAuditLogs(250);
      setLogs(list);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((item) => {
      if (actionFilter !== 'all' && item.action !== actionFilter) return false;
      if (!q) return true;
      return [item.actorName, item.actorEmail, item.summary, item.targetLabel, item.target, item.action]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [logs, actionFilter, search]);

  const handleExportCsv = () => {
    const header = ['Thời gian', 'Quản trị viên', 'Email', 'Hành động', 'Đối tượng', 'Chi tiết'];
    const rows = filtered.map((l) => [
      l.at,
      l.actorName,
      l.actorEmail,
      AUDIT_ACTION_META[l.action]?.label || l.action,
      l.targetLabel || l.target,
      l.summary,
    ]);
    downloadCsv(`elec-ai-audit-log-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };

  return (
    <AdminShell
      active="audit"
      onChange={(k) => { window.location.hash = k === 'dashboard' ? 'admin' : `admin/${k}`; }}
    >
      <Topbar
        title="Nhật ký Kiểm toán Admin (Audit Log)"
        subtitle="Lưu vết bất biến mọi thao tác cấp gói, điều chỉnh Credit, phân quyền và thay đổi cấu hình hệ thống"
        right={(
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="vt-btn" onClick={handleExportCsv} disabled={!filtered.length}>
              <IconDownload size={14} /> Xuất CSV
            </button>
            <button type="button" className="vt-btn primary" onClick={reload} disabled={loading}>
              <IconRefresh size={14} /> Làm mới
            </button>
          </div>
        )}
      />

      {error && (
        <div className="vt-card" style={{ padding: '12px 16px', marginBottom: 14, borderLeft: '4px solid #dc2626', color: '#dc2626' }}>
          <IconWarning size={15} /> {error}
        </div>
      )}

      <div className="vt-card" style={{ padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid var(--line,#cbd5e1)', background: 'var(--panel,#fff)', color: 'inherit', fontSize: '0.82rem' }}
          >
            <option value="all">Tất cả hành động ({logs.length})</option>
            {Object.entries(AUDIT_ACTION_META).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative', minWidth: 250 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'grid' }}>
            <IconSearch size={14} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm admin, đối tượng, nội dung…"
            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 10, border: '1px solid var(--line,#cbd5e1)', background: 'var(--panel,#fff)', color: 'inherit', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      <div className="vt-card" style={{ padding: '14px 16px' }}>
        {loading && logs.length === 0 ? (
          <p className="vt-muted" style={{ textAlign: 'center', padding: 24 }}>Đang tải nhật ký kiểm toán…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 36 }}>
            <IconShield size={32} style={{ opacity: 0.45, marginBottom: 8 }} />
            <h3 style={{ margin: '0 0 6px' }}>Chưa có bản ghi kiểm toán nào</h3>
            <p className="vt-muted" style={{ margin: 0 }}>
              Từ bây giờ, mọi thao tác nhạy cảm của Admin (cấp PRO/VIP, cộng Credit, đổi cài đặt, xử lý báo lỗi…) sẽ tự động lưu tại đây.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {filtered.map((item) => {
              const meta = AUDIT_ACTION_META[item.action] || { label: item.action, tone: 'info' };
              const st = TONE_STYLE[meta.tone] || TONE_STYLE.info;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '11px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--line,#e2e8f0)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'grid', gap: 4, flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: '0.73rem', fontWeight: 800, background: st.bg, color: st.fg }}>
                        {meta.label}
                      </span>
                      <b style={{ fontSize: '0.86rem' }}>{item.summary}</b>
                    </div>
                    <div className="vt-muted" style={{ fontSize: '0.76rem' }}>
                      Thực hiện bởi: <b>{item.actorName || item.actorEmail}</b>
                      {item.targetLabel ? ` · Đối tượng: ${item.targetLabel}` : ''}
                    </div>
                  </div>
                  <div className="vt-muted" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                    <IconClock size={12} /> {item.at}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
