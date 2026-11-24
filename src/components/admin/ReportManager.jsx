/* ============================================================
   ReportManager.jsx — Hộp thư Báo lỗi & Góp ý từ người dùng (Admin)
   ------------------------------------------------------------
   • Nhận realtime mọi báo lỗi / góp ý từ Firestore `user_reports`
   • Lọc theo trạng thái, loại (Báo lỗi / Góp ý), tìm kiếm toàn văn
   • Cập nhật trạng thái & gửi phản hồi ngược về trang Hồ sơ của người dùng
   • Xuất CSV & xóa báo cáo rác/spam
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import AdminShell, { Topbar, downloadCsv, setGlobalAdminBadges } from './AdminShell.jsx';
import {
  IconBell, IconRefresh, IconDownload, IconSearch,
  IconCheck, IconCheckCircle, IconTrash, IconWarning, IconClock, IconMail, IconStar,
} from './AdminIcons.jsx';
import {
  REPORT_STATUSES,
  countOpenReports,
  fetchAllReportsForAdmin,
  subscribeAdminReports,
  syncPendingLocalReports,
  updateReportByAdmin,
  deleteReportByAdmin,
} from '../../lib/userReportsService.js';
import { logAdminAction } from '../../lib/adminAuditService.js';
import { friendlyError } from './adminUtils.js';

const STATUS_COLORS = {
  'Đã tiếp nhận': { bg: 'rgba(245,158,11,0.14)', fg: '#d97706' },
  'Đang xử lý':   { bg: 'rgba(37,99,235,0.14)',  fg: '#2563eb' },
  'Đã giải quyết':{ bg: 'rgba(16,185,129,0.14)', fg: '#059669' },
  'Từ chối':      { bg: 'rgba(239,68,68,0.14)',  fg: '#dc2626' },
};

const QUICK_REPLIES = [
  'Cảm ơn bạn đã báo lỗi! Admin đã tiếp nhận và đang kiểm tra xử lý ngay.',
  'Lỗi này đã được Admin khắc phục xong. Bạn tải lại trang (F5) để kiểm tra nhé!',
  'Cảm ơn góp ý rất giá trị của bạn! Đội ngũ ELEC AI đã ghi nhận vào bản nâng cấp tới.',
];

export default function ReportManager() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState({}); // { [id]: { status, adminReply } }
  const [savingId, setSavingId] = useState(null);
  const [delArmId, setDelArmId] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const say = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const applyList = useCallback((list) => {
    setReports(list);
    setLoading(false);
    setError('');
    const open = countOpenReports(list);
    setGlobalAdminBadges({ reports: open > 0 ? open : null });
  }, []);

  // Tự động đẩy các báo lỗi cũ còn nằm trong localStorage của trình duyệt hiện tại lên Firestore
  useEffect(() => {
    const myUid = user?.uid || user?.id;
    if (myUid) {
      syncPendingLocalReports(myUid, user).catch(() => {});
    }
  }, [user]);

  // Lắng nghe realtime Firestore `user_reports`
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAdminReports(
      (list) => applyList(list),
      (err) => {
        setLoading(false);
        const msg = err?.code === 'permission-denied'
          ? 'Firestore Rules cho bộ sưu tập "user_reports" chưa được deploy hoặc tài khoản chưa có quyền admin trên Firebase.'
          : friendlyError(err);
        setError(msg);
      }
    );
    return () => unsub?.();
  }, [applyList]);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchAllReportsForAdmin();
      applyList(list);
      say(`Đã làm mới (${list.length} báo lỗi/góp ý)`);
    } catch (err) {
      setLoading(false);
      setError(friendlyError(err));
    }
  };

  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => !r.status || r.status === 'Đã tiếp nhận').length;
    const inProgress = reports.filter((r) => r.status === 'Đang xử lý').length;
    const resolved = reports.filter((r) => r.status === 'Đã giải quyết').length;
    return { total, pending, inProgress, resolved };
  }, [reports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter !== 'all' && (r.status || 'Đã tiếp nhận') !== statusFilter) return false;
      if (kindFilter !== 'all' && r.kind !== kindFilter) return false;
      if (!q) return true;
      return [r.content, r.category, r.userEmail, r.userName, r.page, r.adminReply, r.id]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [reports, statusFilter, kindFilter, search]);

  const getDraft = (r) => drafts[r.id] || {
    status: r.status || 'Đã tiếp nhận',
    adminReply: r.adminReply || '',
  };

  const patchDraft = (r, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [r.id]: { ...getDraft(r), ...patch },
    }));
  };

  const handleSave = async (r) => {
    const d = getDraft(r);
    setSavingId(r.id);
    try {
      await updateReportByAdmin(r.id, {
        status: d.status,
        adminReply: d.adminReply,
        adminName: user?.displayName || user?.email || 'Admin ELEC AI',
      });
      setReports((prev) => prev.map((x) => (x.id === r.id ? {
        ...x,
        status: d.status,
        adminReply: d.adminReply,
        adminReplyAt: d.adminReply.trim() ? Date.now() : 0,
      } : x)));
      logAdminAction({
        actor: user,
        action: 'update_report',
        target: r.id,
        targetLabel: r.userEmail || r.uid,
        summary: `Cập nhật báo lỗi #${r.id} → ${d.status}${d.adminReply.trim() ? ' (có phản hồi)' : ''}`,
      });
      say(`Đã cập nhật #${r.id} → ${d.status}`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (delArmId !== id) {
      setDelArmId(id);
      setTimeout(() => setDelArmId((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    setSavingId(id);
    try {
      await deleteReportByAdmin(id);
      setReports((prev) => prev.filter((x) => x.id !== id));
      setDelArmId(null);
      logAdminAction({
        actor: user,
        action: 'delete_report',
        target: id,
        targetLabel: `#${id}`,
        summary: `Xóa báo lỗi #${id}`,
      });
      say(`Đã xóa báo lỗi #${id}`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleExportCsv = () => {
    const header = ['ID', 'Thời gian', 'Loại', 'Danh mục', 'Trạng thái', 'Người gửi', 'Email', 'Trang', 'Sao', 'Nội dung', 'Phản hồi Admin'];
    const rows = filtered.map((r) => [
      r.id,
      r.at,
      r.kind === 'report' ? 'Báo lỗi' : 'Góp ý',
      r.category,
      r.status,
      r.userName || r.userEmail || r.uid,
      r.userEmail || '',
      r.page || '',
      r.rating || '',
      r.content || '',
      r.adminReply || '',
    ]);
    downloadCsv(`elec-ai-bao-loi-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
    say('Đã xuất file CSV báo lỗi & góp ý');
  };

  return (
    <AdminShell
      active="reports"
      onChange={(k) => { window.location.hash = k === 'dashboard' ? 'admin' : `admin/${k}`; }}
    >
      <Topbar
        title="Báo lỗi & Góp ý người dùng"
        subtitle="Tiếp nhận realtime từ học sinh & giáo viên, cập nhật trạng thái và gửi phản hồi trực tiếp"
        right={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="vt-btn" onClick={handleExportCsv} disabled={!filtered.length}>
              <IconDownload size={14} /> Xuất CSV
            </button>
            <button type="button" className="vt-btn primary" onClick={reload} disabled={loading}>
              <IconRefresh size={14} /> Làm mới
            </button>
          </div>
        )}
      />

      {toast && (
        <div className="vt-card" style={{ padding: '10px 16px', marginBottom: 14, borderLeft: '4px solid #16a34a', fontWeight: 700, color: '#15803d' }}>
          {toast}
        </div>
      )}

      {error && (
        <div className="vt-card" style={{ padding: '12px 16px', marginBottom: 14, borderLeft: '4px solid #dc2626', color: '#dc2626', fontSize: '0.88rem' }}>
          <b><IconWarning size={15} /> Lưu ý đồng bộ Firestore:</b> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Tổng báo lỗi / góp ý', val: stats.total, color: '#2563eb', Icon: IconBell },
          { label: 'Chờ tiếp nhận xử lý', val: stats.pending, color: '#d97706', Icon: IconClock },
          { label: 'Đang kiểm tra / sửa', val: stats.inProgress, color: '#6366f1', Icon: IconWarning },
          { label: 'Đã giải quyết xong', val: stats.resolved, color: '#16a34a', Icon: IconCheckCircle },
        ].map((k) => (
          <div key={k.label} className="vt-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center',
              background: `${k.color}18`, color: k.color, flex: 'none',
            }}>
              <k.Icon size={19} />
            </span>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1 }}>{k.val}</div>
              <div className="vt-muted" style={{ fontSize: '0.76rem', marginTop: 2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="vt-card" style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', ...REPORT_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              className={`vt-btn ${statusFilter === st ? 'primary' : ''}`}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'all' ? `Tất cả (${reports.length})` : st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid var(--line, #cbd5e1)', background: 'var(--panel, #fff)', color: 'inherit', fontSize: '0.82rem' }}
          >
            <option value="all">Mọi phân loại</option>
            <option value="report">Chỉ Báo lỗi</option>
            <option value="feedback">Chỉ Góp ý / Đánh giá</option>
          </select>

          <div style={{ position: 'relative', minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'grid' }}>
              <IconSearch size={14} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nội dung, email, trang…"
              style={{
                width: '100%', padding: '7px 10px 7px 30px', borderRadius: 10,
                border: '1px solid var(--line, #cbd5e1)', background: 'var(--panel, #fff)', color: 'inherit', fontSize: '0.82rem',
              }}
            />
          </div>
        </div>
      </div>

      {/* Report List */}
      {loading && reports.length === 0 ? (
        <div className="vt-card" style={{ padding: 36, textAlign: 'center' }}>
          <p className="vt-muted">Đang tải danh sách báo lỗi &amp; góp ý…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="vt-card" style={{ padding: 40, textAlign: 'center' }}>
          <IconCheckCircle size={32} style={{ color: '#16a34a', marginBottom: 8 }} />
          <h3 style={{ margin: '0 0 6px' }}>Không có báo lỗi nào trong mục này</h3>
          <p className="vt-muted" style={{ margin: 0 }}>
            Mọi báo lỗi &amp; góp ý do học sinh/giáo viên gửi sẽ hiển thị realtime ngay tại đây.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((r) => {
            const d = getDraft(r);
            const stStyle = STATUS_COLORS[r.status] || STATUS_COLORS['Đã tiếp nhận'];
            const dirty = d.status !== (r.status || 'Đã tiếp nhận') || d.adminReply !== (r.adminReply || '');

            return (
              <article key={r.id} className="vt-card" style={{ padding: '16px 18px', display: 'grid', gap: 10 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 800,
                      background: r.kind === 'report' ? 'rgba(239,68,68,0.12)' : 'rgba(37,99,235,0.12)',
                      color: r.kind === 'report' ? '#dc2626' : '#2563eb',
                    }}>
                      {r.category || (r.kind === 'report' ? 'Báo lỗi' : 'Góp ý')}
                    </span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700,
                      background: stStyle.bg, color: stStyle.fg,
                    }}>
                      {r.status || 'Đã tiếp nhận'}
                    </span>
                    {r.rating > 0 && r.kind !== 'report' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.76rem', fontWeight: 700, color: '#f59e0b' }}>
                        <IconStar size={13} filled /> {r.rating}/5
                      </span>
                    )}
                    <code style={{ fontSize: '0.72rem', opacity: 0.65 }}>{r.id}</code>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem' }} className="vt-muted">
                    <span><IconMail size={13} /> {r.userName ? `${r.userName} (${r.userEmail || r.uid})` : (r.userEmail || r.uid)}</span>
                    {r.page && <span>· Trang: <b>{r.page}</b></span>}
                    <span>· {r.at}</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{
                  padding: '11px 14px', borderRadius: 12,
                  background: 'var(--soft, rgba(15,23,42,0.04))',
                  fontSize: '0.92rem', lineHeight: 1.55, whiteSpace: 'pre-wrap',
                }}>
                  {r.content}
                </div>

                {/* Admin Response Controls */}
                <div style={{ display: 'grid', gap: 8, paddingTop: 4 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="vt-muted" style={{ fontSize: '0.74rem', fontWeight: 700 }}>Mẫu phản hồi nhanh:</span>
                    {QUICK_REPLIES.map((qr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="vt-btn"
                        style={{ padding: '4px 9px', fontSize: '0.72rem' }}
                        onClick={() => patchDraft(r, {
                          adminReply: qr,
                          status: idx === 1 ? 'Đã giải quyết' : 'Đang xử lý',
                        })}
                      >
                        Mẫu #{idx + 1}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={d.adminReply}
                    onChange={(e) => patchDraft(r, { adminReply: e.target.value })}
                    placeholder="Viết phản hồi gửi về trang Hồ sơ của học sinh / giáo viên…"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 11,
                      border: '1px solid var(--line, #cbd5e1)', background: 'var(--panel, #fff)',
                      color: 'inherit', fontSize: '0.84rem', fontFamily: 'inherit', resize: 'vertical',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Trạng thái:</label>
                      <select
                        value={d.status}
                        onChange={(e) => patchDraft(r, { status: e.target.value })}
                        style={{
                          padding: '6px 10px', borderRadius: 10, border: '1px solid var(--line, #cbd5e1)',
                          background: 'var(--panel, #fff)', color: 'inherit', fontSize: '0.82rem', fontWeight: 600,
                        }}
                      >
                        {REPORT_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>

                      <button
                        type="button"
                        className="vt-btn primary"
                        disabled={savingId === r.id || (!dirty && Boolean(r.adminReply))}
                        onClick={() => handleSave(r)}
                      >
                        <IconCheck size={14} /> {savingId === r.id ? 'Đang lưu…' : 'Lưu & Gửi phản hồi'}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="vt-btn"
                      style={{ color: delArmId === r.id ? '#fff' : '#dc2626', background: delArmId === r.id ? '#dc2626' : undefined }}
                      disabled={savingId === r.id}
                      onClick={() => handleDelete(r.id)}
                    >
                      <IconTrash size={14} /> {delArmId === r.id ? 'Bấm lại để xóa hẳn' : 'Xóa'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
