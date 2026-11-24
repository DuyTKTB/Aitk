import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { adminResetTeacherTrialQuota } from '../../lib/proKeyApi.js';
import { logAdminAction } from '../../lib/adminAuditService.js';
import {
  ANNOUNCEMENT_THEMES,
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_QUICK_LINKS,
  ANNOUNCEMENT_PRESETS,
  ANNOUNCEMENT_MASCOT_IMAGES,
  resolveAnnouncementTheme,
  formatCountdownLabel,
  isWithinAnnouncementSchedule,
  sanitizeAnnouncementImage,
} from '../../lib/announcementEngine.js';
import { fileToCompressedDataUrl } from '../../lib/imageUtils.js';
import {
  FREE_TEACHER_LIMITS,
  STUDENT_VIP_ANNUAL_PRICE,
  TEACHER_VIP_ANNUAL_PRICE,
  formatVnd,
} from '../../lib/entitlements.js';
import AdminShell, { Topbar } from './AdminShell.jsx';
import { ConfirmDialog } from './AdminUI.jsx';
import SystemAnnouncementBanner from '../SystemAnnouncementBanner.jsx';
import {
  IconSettings, IconTrash, IconSave, IconRefresh, IconDownload, IconUpload,
  IconDatabase, IconShield, IconWarning, IconInfo, IconCheck, IconCrown, IconKey,
} from './AdminIcons.jsx';
import { chunk, downloadFile, fetchAllRows, friendlyError } from './adminUtils.js';

const BACKUP_TABLES = ['grades', 'subjects', 'topics', 'exams', 'questions', 'answers', 'profiles', 'pro_keys', 'pro_users'];
const RESTORE_TABLES = ['grades', 'subjects', 'topics', 'exams', 'questions', 'answers', 'pro_keys', 'pro_users'];
const DELETE_ORDER = ['answers', 'questions', 'exams', 'topics'];
const pkOf = (table) => (table === 'pro_users' ? 'user_id' : 'id');
const ALL_ROWS = (q, pk = 'id') => q.not(pk, 'is', null);

const TOGGLES = [
  { key: 'enableAI', label: 'AI Chat (ELEC AI)', desc: 'Trợ lý AI Khoa học Tự nhiên trong web' },
  { key: 'enableChat', label: 'Chat cộng đồng', desc: 'Chat nhóm giữa học sinh' },
  { key: 'enablePet', label: 'Pet Widget', desc: 'Linh vật pha lê ở góc phải' },
  { key: 'enableGames', label: 'Trò chơi', desc: 'GameHub và các game nhỏ' },
  { key: 'enableQuiz', label: 'Ôn tập (Quiz)', desc: 'Trang quiz và SRS' },
  { key: 'maintenanceMode', label: 'Chế độ bảo trì', desc: 'Khóa toàn bộ web, chỉ admin vào được', danger: true },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, updateSettings, resetSettings } = useSettings();

  const initial = useMemo(() => ({
    siteName: settings.siteName ?? '',
    siteDesc: settings.siteDesc ?? '',
    enableAI: !!settings.enableAI,
    enableChat: !!settings.enableChat,
    enablePet: !!settings.enablePet,
    enableGames: !!settings.enableGames,
    enableQuiz: !!settings.enableQuiz,
    maintenanceMode: !!settings.maintenanceMode,
    announcementEnabled: !!settings.announcementEnabled,
    announcementText: settings.announcementText ?? '',
    announcementLink: settings.announcementLink ?? '',
    announcementBadge: settings.announcementBadge ?? '🔥 Nổi bật',
    announcementTheme: settings.announcementTheme ?? 'cobalt',
    announcementDisplay: settings.announcementDisplay ?? 'banner',
    announcementAudience: settings.announcementAudience ?? 'all',
    announcementCtaText: settings.announcementCtaText ?? 'Khám phá ngay',
    announcementStartAt: settings.announcementStartAt ?? '',
    announcementEndAt: settings.announcementEndAt ?? '',
    announcementShowCountdown: !!settings.announcementShowCountdown,
    announcementDismissible: settings.announcementDismissible !== false,
    announcementVersion: Number(settings.announcementVersion) || 1,
    announcementImage: settings.announcementImage ?? '',
    announcementImageFit: settings.announcementImageFit ?? 'cover',
  }), [settings]);

  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(initial); }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState('');
  const [restoreMode, setRestoreMode] = useState('merge');
  const [livePreviewAnn, setLivePreviewAnn] = useState(false);
  const fileRef = useRef(null);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);

  const say = (text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const handleSave = async () => {
    if (!form.siteName.trim()) return say('Tên website không được để trống.');
    const commitSave = async () => {
      const payload = { ...form, siteName: form.siteName.trim(), siteDesc: form.siteDesc.trim() };
      try {
        await updateSettings(payload);
        logAdminAction({
          actor: user,
          action: payload.maintenanceMode !== initial.maintenanceMode ? 'toggle_maintenance' : 'update_settings',
          target: 'siteConfig/global',
          targetLabel: 'Cấu hình hệ thống',
          summary: payload.maintenanceMode !== initial.maintenanceMode
            ? `${payload.maintenanceMode ? 'BẬT' : 'TẮT'} Chế độ bảo trì toàn hệ thống`
            : `Cập nhật cấu hình website & thông báo (${payload.siteName})`,
        });
        say('Đã lưu lên Cloud và áp dụng toàn hệ thống!');
      } catch (e) {
        say('Không lưu được lên Cloud: ' + friendlyError(e));
      }
    };

    if (form.maintenanceMode && !initial.maintenanceMode) {
      setConfirm({
        title: 'Bật chế độ bảo trì',
        body: 'Toàn bộ học sinh & giáo viên sẽ thấy màn hình bảo trì cho đến khi bạn tắt chế độ này (Admin vẫn truy cập bình thường).',
        okLabel: 'Bật bảo trì',
        danger: true,
        onOk: commitSave,
      });
      return;
    }
    await commitSave();
  };

  const handleReset = () => {
    setConfirm({
      title: 'Khôi phục mặc định',
      body: 'Đặt lại toàn bộ cài đặt giao diện/tính năng về mặc định và tải lại trang?',
      okLabel: 'Khôi phục',
      onOk: () => { resetSettings(); window.location.reload(); },
    });
  };

  const buildBackup = async () => {
    const tables = {};
    const warnings = [];
    for (const t of BACKUP_TABLES) {
      setProgress(`Đang đọc bảng ${t}…`);
      const pk = pkOf(t);
      try {
        // eslint-disable-next-line no-await-in-loop
        tables[t] = await fetchAllRows(() => supabase.from(t).select('*').order(pk, { ascending: true }));
      } catch (e) {
        warnings.push(`${t}: ${friendlyError(e)}`);
      }
    }
    const counts = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length]));
    return {
      backup: { meta: { app: 'elec-ai', version: 2, createdAt: new Date().toISOString(), counts }, tables },
      warnings,
    };
  };

  const handleBackup = async () => {
    setBusy('backup');
    try {
      const { backup, warnings } = await buildBackup();
      if (Object.keys(backup.tables).length === 0) throw new Error('Không đọc được bảng nào. Kiểm tra quyền truy cập Supabase.');
      downloadFile(`backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`, JSON.stringify(backup, null, 2));
      if (warnings.length) say(`Đã tải backup, bỏ qua ${warnings.length} bảng lỗi`);
      else say('Đã tải file sao lưu');
    } catch (e) {
      say('Lỗi sao lưu: ' + friendlyError(e));
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  const readBackupFile = async (file) => {
    if (file.size > 100 * 1024 * 1024) throw new Error('File quá lớn (tối đa 100 MB).');
    let json;
    try {
      json = JSON.parse(await file.text());
    } catch {
      throw new Error('File không phải JSON hợp lệ.');
    }
    const tables = json?.tables && typeof json.tables === 'object' ? json.tables : json;
    const found = RESTORE_TABLES.filter((t) => Array.isArray(tables?.[t]));
    if (found.length === 0) throw new Error('File không chứa dữ liệu hợp lệ (cần các bảng exams, questions, answers…).');
    for (const t of found) {
      const pk = pkOf(t);
      if (tables[t].some((r) => r == null || typeof r !== 'object' || r[pk] == null)) {
        throw new Error(`Bảng "${t}" có dòng thiếu cột khóa chính (${pk}) — file bị hỏng hoặc không đúng định dạng.`);
      }
    }
    return { tables, found };
  };

  const handleRestore = async (file) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    let parsed;
    try {
      parsed = await readBackupFile(file);
    } catch (e) {
      return say(e.message);
    }
    const { tables, found } = parsed;
    const summary = found.map((t) => `${t}: ${tables[t].length}`).join(' · ');

    setConfirm({
      title: restoreMode === 'replace' ? 'Khôi phục — THAY THẾ toàn bộ' : 'Khôi phục — Gộp dữ liệu',
      body: restoreMode === 'replace'
        ? `Sẽ XÓA toàn bộ đề, câu hỏi, đáp án hiện có rồi nạp lại từ file (${summary}). Hệ thống tự tải bản sao lưu an toàn trước khi xóa. Tài khoản người dùng không bị đụng tới.`
        : `Sẽ thêm mới và cập nhật theo id từ file (${summary}). Dữ liệu hiện có không bị xóa. Tài khoản người dùng không bị đụng tới.`,
      okLabel: restoreMode === 'replace' ? 'Thay thế dữ liệu' : 'Khôi phục',
      danger: restoreMode === 'replace',
      onOk: () => doRestore(tables, found),
    });
  };

  const doRestore = async (tables, found) => {
    setBusy('restore');
    try {
      if (restoreMode === 'replace') {
        setProgress('Đang tạo bản sao lưu an toàn…');
        const { backup } = await buildBackup();
        downloadFile(`truoc-khi-khoi-phuc-${Date.now()}.json`, JSON.stringify(backup, null, 2));
        for (const t of DELETE_ORDER) {
          if (!found.includes(t)) continue;
          setProgress(`Đang xóa bảng ${t}…`);
          // eslint-disable-next-line no-await-in-loop
          const { error } = await ALL_ROWS(supabase.from(t).delete());
          if (error) throw new Error(`Xóa bảng ${t} thất bại: ${friendlyError(error)}`);
        }
      }
      let written = 0;
      for (const t of RESTORE_TABLES) {
        if (!found.includes(t)) continue;
        const pk = pkOf(t);
        for (const part of chunk(tables[t], 500)) {
          setProgress(`Đang ghi ${t} (${written.toLocaleString('vi-VN')} dòng)…`);
          // eslint-disable-next-line no-await-in-loop
          const { error } = await supabase.from(t).upsert(part, { onConflict: pk });
          if (error) throw new Error(`Ghi bảng ${t} thất bại: ${friendlyError(error)}`);
          written += part.length;
        }
      }
      say(`Khôi phục xong ${written.toLocaleString('vi-VN')} dòng`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      say(e.message);
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  const deleteAttempts = () => {
    setConfirm({
      title: 'Xóa tất cả lượt làm bài',
      body: 'Toàn bộ lịch sử làm bài và chi tiết đáp án của học sinh sẽ bị xóa vĩnh viễn.',
      okLabel: 'Xóa lượt làm bài',
      danger: true,
      requireText: 'XOA TAT CA',
      onOk: async () => {
        setBusy('attempts');
        try {
          const r1 = await ALL_ROWS(supabase.from('user_answers').delete());
          if (r1.error) throw r1.error;
          const r2 = await ALL_ROWS(supabase.from('exam_attempts').delete());
          if (r2.error) throw r2.error;
          await ALL_ROWS(supabase.from('exams').update({ attempt_count: 0 }));
          logAdminAction({
            actor: user,
            action: 'wipe_data',
            target: 'exam_attempts',
            targetLabel: 'Toàn bộ lượt làm bài',
            summary: 'Đã xóa vĩnh viễn toàn bộ exam_attempts & user_answers',
          });
          say('Đã xóa toàn bộ lượt làm bài');
        } catch (e) {
          say('Không xóa được: ' + friendlyError(e));
        } finally {
          setBusy(null);
        }
      },
    });
  };

  const deleteExams = () => {
    setConfirm({
      title: 'Xóa tất cả đề thi',
      body: 'Toàn bộ đề, câu hỏi và đáp án sẽ bị xóa vĩnh viễn. Hãy tải bản sao lưu trước.',
      okLabel: 'Xóa tất cả đề',
      danger: true,
      requireText: 'XOA TAT CA',
      onOk: async () => {
        setBusy('exams');
        try {
          const { error } = await ALL_ROWS(supabase.from('exams').delete());
          if (error) throw error;
          logAdminAction({
            actor: user,
            action: 'wipe_data',
            target: 'exams',
            targetLabel: 'Toàn bộ kho đề thi',
            summary: 'Đã xóa vĩnh viễn toàn bộ bảng exams',
          });
          say('Đã xóa toàn bộ đề thi');
          setTimeout(() => window.location.reload(), 1200);
        } catch (e) {
          say('Không xóa được: ' + friendlyError(e));
        } finally {
          setBusy(null);
        }
      },
    });
  };

  const working = busy !== null;

  return (
    <AdminShell active="settings" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Cài đặt"
        subtitle="Tên website, bật/tắt tính năng, sao lưu và khôi phục"
      />

      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconSettings size={16} className="vt-title-ico" />
            Thông tin website
          </h3>
        </header>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <label className="vt-field">
            <span>Tên website</span>
            <input
              type="text"
              value={form.siteName}
              onChange={(e) => set('siteName', e.target.value)}
              maxLength={80}
            />
          </label>
          <label className="vt-field">
            <span>Mô tả ngắn</span>
            <input
              type="text"
              value={form.siteDesc}
              onChange={(e) => set('siteDesc', e.target.value)}
              maxLength={200}
            />
          </label>
        </div>
      </div>

      {/* ===== TRUNG TÂM PHÁT SÓNG THÔNG BÁO TOÀN HỆ THỐNG PRO ===== */}
      {(() => {
        const activeTheme = resolveAnnouncementTheme(form.announcementTheme);
        const schedStatus = isWithinAnnouncementSchedule({
          startAt: form.announcementStartAt,
          endAt: form.announcementEndAt,
        });
        const previewTimer = form.announcementShowCountdown && schedStatus.remainingMs > 0
          ? formatCountdownLabel(schedStatus.remainingMs)
          : form.announcementShowCountdown
            ? '02:15:30'
            : '';

        const applyPreset = (p) => {
          setForm((f) => ({
            ...f,
            announcementEnabled: true,
            announcementBadge: p.badge,
            announcementTheme: p.theme,
            announcementDisplay: p.display,
            announcementAudience: p.audience,
            announcementText: p.text,
            announcementCtaText: p.ctaText || 'Khám phá ngay',
            announcementLink: p.link,
            announcementShowCountdown: p.showCountdown,
            announcementDismissible: p.dismissible,
          }));
          say(`Đã áp dụng mẫu "${p.label}" — bấm Phát sóng ngay để gửi!`);
        };

        const publishAnnouncementNow = async ({ bumpVersion = false } = {}) => {
          const nextVer = bumpVersion ? (Number(form.announcementVersion) || 1) + 1 : (Number(form.announcementVersion) || 1);
          const payload = {
            ...form,
            siteName: (form.siteName || 'ELEC AI').trim(),
            siteDesc: (form.siteDesc || '').trim(),
            announcementImage: sanitizeAnnouncementImage(form.announcementImage),
            announcementVersion: nextVer,
          };
          setBusy('announce');
          try {
            await updateSettings(payload);
            setForm(payload);
            logAdminAction({
              actor: user,
              action: 'update_settings',
              target: 'siteConfig/global',
              targetLabel: 'Phát sóng Thông báo',
              summary: payload.announcementEnabled
                ? `${bumpVersion ? 'Phát lại (v' + nextVer + ')' : 'Phát sóng'} thông báo [${payload.announcementAudience}/${payload.announcementDisplay}]: "${payload.announcementText.slice(0, 80)}"`
                : 'Tắt Banner Thông báo toàn hệ thống',
            });
            say(bumpVersion
              ? `Đã phát lại thông báo phiên bản v${nextVer} tới toàn bộ thiết bị!`
              : payload.announcementEnabled
                ? 'Đã phát sóng thông báo lên toàn hệ thống!'
                : 'Đã tắt thông báo toàn hệ thống.');
          } catch (e) {
            say('Lỗi phát sóng lên Cloud: ' + friendlyError(e));
          } finally {
            setBusy(null);
          }
        };

        return (
          <div className="vt-card">
            <header className="vt-card-head">
              <h3 className="vt-card-title">
                <IconInfo size={16} className="vt-title-ico" />
                Trung tâm Phát sóng Thông báo Toàn hệ thống
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {form.announcementEnabled && schedStatus.reason === 'scheduled' && (
                  <span className="vt-chip" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>Hẹn giờ phát</span>
                )}
                {form.announcementEnabled && schedStatus.reason === 'expired' && (
                  <span className="vt-chip" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626' }}>Đã hết lịch</span>
                )}
                <span className="vt-chip" style={{ background: form.announcementEnabled ? 'rgba(34, 197, 94, 0.14)' : 'rgba(148, 163, 184, 0.15)', color: form.announcementEnabled ? '#16a34a' : 'var(--mut)' }}>
                  {form.announcementEnabled ? `Đang phát · v${form.announcementVersion}` : 'Đang tắt'}
                </span>
              </div>
            </header>
            <p className="vt-muted" style={{ fontSize: '.84rem', marginTop: '-.3rem', marginBottom: '1rem' }}>
              Phát dải băng thông báo hoặc Popup nổi bật realtime tới đúng nhóm người dùng, hỗ trợ 6 chủ đề màu, lịch tự động &amp; đồng hồ đếm ngược.
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <ToggleRow
                label="Bật phát sóng thông báo trên web"
                desc="Đồng bộ realtime qua Firestore tới mọi học sinh & giáo viên thuộc đối tượng đã chọn"
                checked={form.announcementEnabled}
                onChange={(v) => set('announcementEnabled', v)}
              />

              {/* 5 Mẫu thông báo 1 chạm */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span className="vt-muted" style={{ fontSize: '.74rem', fontWeight: 700 }}>Mẫu nhanh:</span>
                {ANNOUNCEMENT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="vt-btn"
                    style={{ padding: '5px 11px', fontSize: '.75rem' }}
                    onClick={() => applyPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {form.announcementEnabled && (
                <>
                  {/* 6 Chủ đề màu sắc */}
                  <div>
                    <span style={{ display: 'block', fontSize: '.76rem', fontWeight: 700, color: 'var(--mut)', marginBottom: 6 }}>
                      Chủ đề giao diện Banner
                    </span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.values(ANNOUNCEMENT_THEMES).map((th) => {
                        const on = form.announcementTheme === th.id;
                        return (
                          <button
                            key={th.id}
                            type="button"
                            onClick={() => set('announcementTheme', th.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 7,
                              padding: '6px 12px',
                              borderRadius: 999,
                              border: on ? '2px solid var(--acc, #2563eb)' : '1px solid var(--line, #cbd5e1)',
                              background: 'var(--panel, #fff)',
                              color: 'var(--ink)',
                              fontSize: '.76rem',
                              fontWeight: on ? 800 : 600,
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ width: 16, height: 16, borderRadius: '50%', background: th.bg, flex: 'none' }} />
                            {th.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kiểu hiển thị + Đối tượng nhận + Huy hiệu */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '.85rem' }}>
                    <label className="vt-field">
                      <span>Kiểu hiển thị</span>
                      <select
                        value={form.announcementDisplay}
                        onChange={(e) => set('announcementDisplay', e.target.value)}
                        className="vt-select-pill"
                        style={{ width: '100%', height: 42 }}
                      >
                        <option value="poster">Popup Poster Ảnh Full Bo Tròn (Sự kiện / Kỳ thi)</option>
                        <option value="banner">Dải băng cố định đầu trang (Banner)</option>
                        <option value="floating">Thẻ Banner nổi góc dưới trái (kèm Poster)</option>
                        <option value="modal">Dải băng + Popup có hộp chữ (Spotlight)</option>
                      </select>
                    </label>

                    <label className="vt-field">
                      <span>Đối tượng nhận thông báo</span>
                      <select
                        value={form.announcementAudience}
                        onChange={(e) => set('announcementAudience', e.target.value)}
                        className="vt-select-pill"
                        style={{ width: '100%', height: 42 }}
                      >
                        {ANNOUNCEMENT_AUDIENCES.map((a) => (
                          <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="vt-field">
                      <span>Huy hiệu nổi bật</span>
                      <input
                        type="text"
                        value={form.announcementBadge}
                        onChange={(e) => set('announcementBadge', e.target.value)}
                        placeholder="VD: 🔥 Ưu đãi giới hạn"
                        maxLength={32}
                      />
                    </label>
                  </div>

                  {/* Nội dung thông báo */}
                  <label className="vt-field">
                    <span>Nội dung thông báo ({form.announcementText.length}/220 ký tự)</span>
                    <input
                      type="text"
                      value={form.announcementText}
                      onChange={(e) => set('announcementText', e.target.value)}
                      placeholder="VD: Phòng thi ảo đã cập nhật 10 đề thi thử THPTQG & HSA mới nhất 2026!"
                      maxLength={220}
                    />
                  </label>

                  {/* Nút CTA & Liên kết nhanh */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '.85rem' }}>
                    <label className="vt-field">
                      <span>Chữ trên nút hành động (CTA)</span>
                      <input
                        type="text"
                        value={form.announcementCtaText}
                        onChange={(e) => set('announcementCtaText', e.target.value)}
                        placeholder="VD: Vào thi ngay"
                        maxLength={32}
                      />
                    </label>

                    <label className="vt-field">
                      <span>Đường dẫn đích (tùy chọn)</span>
                      <input
                        type="text"
                        value={form.announcementLink}
                        onChange={(e) => set('announcementLink', e.target.value)}
                        placeholder="VD: #virtual-exams, #doc-studio hoặc https://..."
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: '-.35rem' }}>
                    <span className="vt-muted" style={{ fontSize: '.72rem', fontWeight: 700 }}>Chọn nhanh trang:</span>
                    {ANNOUNCEMENT_QUICK_LINKS.map((ql) => (
                      <button
                        key={ql.href}
                        type="button"
                        className="vt-btn"
                        style={{ padding: '3px 9px', fontSize: '.72rem' }}
                        onClick={() => set('announcementLink', ql.href)}
                      >
                        {ql.label}
                      </button>
                    ))}
                    {form.announcementLink && (
                      <button type="button" className="vt-btn" style={{ padding: '3px 9px', fontSize: '.72rem' }} onClick={() => set('announcementLink', '')}>
                        Xóa link
                      </button>
                    )}
                  </div>

                  {/* Hẹn lịch phát tự động & Tùy chọn nâng cao */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '.85rem' }}>
                    <label className="vt-field">
                      <span>Tự động bật từ (để trống = ngay lập tức)</span>
                      <input
                        type="datetime-local"
                        value={form.announcementStartAt}
                        onChange={(e) => set('announcementStartAt', e.target.value)}
                      />
                    </label>
                    <label className="vt-field">
                      <span>Tự động tắt lúc (dùng cho đồng hồ đếm ngược)</span>
                      <input
                        type="datetime-local"
                        value={form.announcementEndAt}
                        onChange={(e) => set('announcementEndAt', e.target.value)}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '.75rem' }}>
                    <ToggleRow
                      label="Hiện đồng hồ đếm ngược live"
                      desc="Hiển thị số ngày/giờ/phút còn lại (cần chọn mốc Tự động tắt)"
                      checked={form.announcementShowCountdown}
                      onChange={(v) => set('announcementShowCountdown', v)}
                    />
                    <ToggleRow
                      label="Cho phép người dùng bấm đóng (X)"
                      desc="Tắt công tắc này nếu là thông báo khẩn bắt buộc giữ trên đầu trang"
                      checked={form.announcementDismissible}
                      onChange={(v) => set('announcementDismissible', v)}
                    />
                  </div>

                  {/* HÌNH ẢNH / POSTER THÔNG BÁO */}
                  <div style={{ padding: '14px 16px', borderRadius: 16, border: '1px solid var(--line, #e2e8f0)', background: 'var(--vt-tint, rgba(15,23,42,0.03))', display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <b style={{ fontSize: '.86rem' }}>Hình ảnh / Poster thông báo (tùy chọn)</b>
                        <div className="vt-muted" style={{ fontSize: '.74rem' }}>
                          Hiển thị ảnh đại diện trên Banner và Poster lớn sắc nét trên Popup nổi bật (tự động nén nhẹ chuẩn Cloud).
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <label className="vt-btn primary" style={{ padding: '6px 12px', fontSize: '.76rem', cursor: 'pointer' }}>
                          <IconUpload size={13} /> Tải ảnh từ máy
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            hidden
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              if (!f) return;
                              try {
                                const dataUrl = await fileToCompressedDataUrl(f, { maxW: 1280, quality: 0.82 });
                                const safe = sanitizeAnnouncementImage(dataUrl);
                                if (!safe) {
                                  say('Ảnh sau khi nén vẫn quá lớn (>450KB), hãy chọn ảnh nhỏ hơn nhé.');
                                  return;
                                }
                                setForm((prev) => ({ ...prev, announcementImage: safe, announcementImageFit: 'cover' }));
                                say(`Đã nạp ảnh "${f.name}" — bấm Xem thử thực tế hoặc Lưu & Phát sóng ngay!`);
                              } catch (err) {
                                say('Lỗi đọc ảnh: ' + friendlyError(err));
                              }
                            }}
                          />
                        </label>
                        {form.announcementImage && (
                          <button
                            type="button"
                            className="vt-btn"
                            style={{ padding: '6px 11px', fontSize: '.76rem', color: '#dc2626' }}
                            onClick={() => set('announcementImage', '')}
                          >
                            <IconTrash size={13} /> Gỡ ảnh
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
                      <label className="vt-field" style={{ margin: 0 }}>
                        <span>Hoặc dán link ảnh (https://… hoặc /img/…)</span>
                        <input
                          type="text"
                          value={form.announcementImage.startsWith('data:image/') ? '[Ảnh đã tải lên từ máy]' : form.announcementImage}
                          readOnly={form.announcementImage.startsWith('data:image/')}
                          onChange={(e) => set('announcementImage', e.target.value)}
                          placeholder="https://example.com/poster-su-kien.jpg"
                        />
                      </label>
                      <label className="vt-field" style={{ margin: 0 }}>
                        <span>Khung ảnh</span>
                        <select
                          value={form.announcementImageFit}
                          onChange={(e) => set('announcementImageFit', e.target.value)}
                          className="vt-select-pill"
                          style={{ height: 42 }}
                        >
                          <option value="cover">Phủ kín (Poster)</option>
                          <option value="contain">Nguyên ảnh (Icon/Mascot)</option>
                        </select>
                      </label>
                    </div>

                    {/* Chọn nhanh Mascot ELEC AI */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="vt-muted" style={{ fontSize: '.72rem', fontWeight: 700 }}>Chọn nhanh Mascot:</span>
                      {ANNOUNCEMENT_MASCOT_IMAGES.map((m) => {
                        const on = form.announcementImage === m.src;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, announcementImage: m.src, announcementImageFit: 'contain' }))}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '3px 9px 3px 4px',
                              borderRadius: 999,
                              border: on ? '1.8px solid var(--acc, #2563eb)' : '1px solid var(--line, #cbd5e1)',
                              background: 'var(--panel, #fff)',
                              color: 'var(--ink)',
                              fontSize: '.72rem',
                              fontWeight: on ? 800 : 600,
                              cursor: 'pointer',
                            }}
                          >
                            <img src={m.src} alt="" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 6 }} />
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* XEM TRƯỚC TRỰC TIẾP (LIVE PREVIEW) */}
                  {(() => {
                    const previewImg = sanitizeAnnouncementImage(form.announcementImage);
                    const previewContain = form.announcementImageFit === 'contain' || previewImg.startsWith('/img/elec/');
                    const displayLabel =
                      form.announcementDisplay === 'poster' ? 'Popup Poster Ảnh Full Bo Tròn 28px'
                      : form.announcementDisplay === 'modal' ? 'Dải băng + Popup nổi bật'
                      : form.announcementDisplay === 'floating' ? 'Thẻ Banner nổi góc dưới trái'
                      : 'Dải băng cố định đầu trang';
                    return (
                      <div style={{ display: 'grid', gap: 10 }}>
                        <span style={{ fontSize: '.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--mut)' }}>
                          Xem trước trực tiếp trên máy người dùng ({displayLabel})
                        </span>

                        {form.announcementDisplay === 'poster' ? (
                          <div style={{
                            position: 'relative',
                            maxWidth: 460,
                            borderRadius: 24,
                            overflow: 'hidden',
                            border: '1.5px solid rgba(255,255,255,0.34)',
                            boxShadow: '0 22px 48px -16px rgba(15,23,42,0.42)',
                            background: '#0f172a',
                          }}>
                            {form.announcementDismissible && (
                              <span style={{
                                position: 'absolute', top: 10, right: 10, zIndex: 2,
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.9)', color: '#0f172a',
                                display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '.85rem',
                              }}>×</span>
                            )}
                            {previewTimer && (
                              <span style={{
                                position: 'absolute', top: 10, left: 10, zIndex: 2,
                                padding: '3px 10px', borderRadius: 99,
                                background: 'rgba(15,23,42,0.72)', color: '#fff',
                                fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 800,
                              }}>⏱ Còn {previewTimer}</span>
                            )}
                            {previewImg ? (
                              <img src={previewImg} alt="Xem trước Poster" style={{ display: 'block', width: '100%', maxHeight: 280, objectFit: 'contain' }} />
                            ) : (
                              <div style={{ padding: '32px 24px', background: activeTheme.bg, color: '#fff', textAlign: 'center', display: 'grid', gap: 10, justifyItems: 'center' }}>
                                <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.22)', fontSize: '.74rem', fontWeight: 800 }}>{form.announcementBadge || '🔥 Sự kiện'}</span>
                                <b style={{ fontSize: '1rem' }}>{form.announcementText || 'Tải ảnh Poster ở ô trên để hiển thị full bo tròn đẹp mắt!'}</b>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '10px 14px',
                              borderRadius: 14,
                              background: activeTheme.bg,
                              color: '#fff',
                              fontSize: '.84rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 10,
                              flexWrap: 'wrap',
                              boxShadow: '0 8px 22px -10px rgba(15,23,42,0.4)',
                            }}
                          >
                            {previewImg && (
                              <img
                                src={previewImg}
                                alt=""
                                style={{
                                  width: 28, height: 28, borderRadius: 8,
                                  objectFit: previewContain ? 'contain' : 'cover',
                                  background: 'rgba(255,255,255,0.16)',
                                  border: '1px solid rgba(255,255,255,0.35)',
                                  padding: previewContain ? 2 : 0,
                                }}
                              />
                            )}
                            <span style={{ padding: '2px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '.72rem', fontWeight: 800 }}>
                              {form.announcementBadge || '📢 Thông báo'}
                            </span>
                            <span style={{ fontWeight: 600 }}>
                              {form.announcementText || 'Nhập nội dung thông báo của bạn ở ô phía trên để xem trước…'}
                            </span>
                            {previewTimer && (
                              <span style={{ padding: '2px 9px', borderRadius: 99, background: 'rgba(15,23,42,0.34)', fontFamily: 'var(--mono)', fontSize: '.73rem', fontWeight: 800 }}>
                                ⏱ {previewTimer}
                              </span>
                            )}
                            {form.announcementLink && (
                              <span style={{ padding: '4px 12px', borderRadius: 99, background: '#fff', color: '#0f172a', fontWeight: 800, fontSize: '.75rem' }}>
                                {form.announcementCtaText || 'Khám phá ngay'} →
                              </span>
                            )}
                          </div>
                        )}

                        {form.announcementDisplay === 'modal' && (
                          <div style={{
                            maxWidth: 420,
                            borderRadius: 20,
                            overflow: 'hidden',
                            border: '1px solid var(--line, #cbd5e1)',
                            background: 'var(--panel, #fff)',
                            boxShadow: '0 14px 32px -14px rgba(15,23,42,0.35)',
                          }}>
                            <div style={{ padding: '14px 16px', background: activeTheme.bg, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.22)', fontSize: '.74rem', fontWeight: 800 }}>
                                {form.announcementBadge || '🔥 Nổi bật'}
                              </span>
                              {previewTimer && (
                                <span style={{ padding: '2px 9px', borderRadius: 99, background: 'rgba(15,23,42,0.34)', fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 800 }}>
                                  Còn {previewTimer}
                                </span>
                              )}
                            </div>
                            {previewImg && (
                              <div style={{ width: '100%', maxHeight: 170, overflow: 'hidden', background: 'var(--vt-tint, rgba(15,23,42,0.05))', display: 'grid', placeItems: 'center' }}>
                                <img
                                  src={previewImg}
                                  alt="Xem trước poster"
                                  style={{ width: '100%', maxHeight: 170, objectFit: previewContain ? 'contain' : 'cover', padding: previewContain ? 10 : 0 }}
                                />
                              </div>
                            )}
                            <div style={{ padding: '14px 16px', display: 'grid', gap: 10 }}>
                              <p style={{ margin: 0, fontSize: '.86rem', fontWeight: 600, lineHeight: 1.5 }}>
                                {form.announcementText || 'Nội dung Popup nổi bật sẽ hiển thị tại đây…'}
                              </p>
                              <div style={{ display: 'flex', gap: 8 }}>
                                {form.announcementLink && (
                                  <span style={{ padding: '7px 14px', borderRadius: 99, background: activeTheme.bg, color: '#fff', fontSize: '.76rem', fontWeight: 700 }}>
                                    {form.announcementCtaText || 'Khám phá ngay'} →
                                  </span>
                                )}
                                <span style={{ padding: '7px 14px', borderRadius: 99, background: 'var(--vt-tint, rgba(15,23,42,0.08))', fontSize: '.76rem', fontWeight: 700 }}>
                                  Đã hiểu
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Thanh nút Phát sóng trực tiếp */}
              {(() => {
                const hasAnyPayload = Boolean(form.announcementText.trim() || sanitizeAnnouncementImage(form.announcementImage));
                return (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                    <button
                      type="button"
                      className="vt-btn primary"
                      disabled={working || (form.announcementEnabled && !hasAnyPayload)}
                      onClick={() => publishAnnouncementNow({ bumpVersion: false })}
                    >
                      <IconSave size={14} /> {busy === 'announce' ? 'Đang phát sóng…' : form.announcementEnabled ? 'Lưu & Phát sóng ngay' : 'Lưu trạng thái tắt'}
                    </button>
                    {form.announcementEnabled && hasAnyPayload && (
                      <>
                        <button
                          type="button"
                          className="vt-btn"
                          onClick={() => setLivePreviewAnn((v) => !v)}
                        >
                          {livePreviewAnn ? 'Đóng xem thử thực tế' : 'Xem thử thực tế toàn màn hình'}
                        </button>
                        <button
                          type="button"
                          className="vt-btn"
                          disabled={working}
                          onClick={() => publishAnnouncementNow({ bumpVersion: true })}
                          title="Tăng phiên bản phát sóng để hiện lại cả trên các máy đã bấm nút X đóng trước đó"
                        >
                          <IconRefresh size={14} /> Phát lại cho cả người đã tắt (→ v{(Number(form.announcementVersion) || 1) + 1})
                        </button>
                      </>
                    )}
                  </div>
                );
              })()}
              {livePreviewAnn && (
                <SystemAnnouncementBanner
                  previewOverride={form}
                  onPreviewClose={() => setLivePreviewAnn(false)}
                />
              )}
            </div>
          </div>
        );
      })()}

      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">Bật / tắt tính năng</h3>
        </header>

        <div style={{ display: 'grid', gap: '.5rem' }}>
          {TOGGLES.map((t) => (
            <ToggleRow
              key={t.key}
              label={t.label}
              desc={t.desc}
              checked={form[t.key]}
              onChange={(v) => set(t.key, v)}
              danger={t.danger}
            />
          ))}
        </div>

        {form.maintenanceMode && (
          <div className="vt-card soft" style={{ marginTop: '1rem', borderLeft: '4px solid var(--vt-amber)' }}>
            <p className="vt-muted" style={{ margin: 0 }}>
              Chế độ bảo trì đang được bật: học sinh sẽ thấy trang bảo trì thay vì web.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
          <button type="button" className="vt-btn primary" onClick={handleSave} disabled={!dirty}>
            <IconSave size={14} /> Lưu cấu hình
          </button>
          <button type="button" className="vt-btn" onClick={() => setForm(initial)} disabled={!dirty}>
            Hoàn tác thay đổi
          </button>
          <button type="button" className="vt-btn" onClick={handleReset}>
            <IconRefresh size={14} /> Khôi phục mặc định
          </button>
        </div>
        <p className="vt-muted" style={{ marginTop: '.8rem', fontSize: '.8rem' }}>
          <IconInfo size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Cài đặt áp dụng ngay khi bấm Lưu, không cần tải lại trang.
        </p>
      </div>

      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconDatabase size={16} className="vt-title-ico" />
            Sao lưu và khôi phục
          </h3>
        </header>

        <p className="vt-muted" style={{ marginTop: 0 }}>
          <IconShield size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          File sao lưu gồm lớp, môn, chủ đề, đề thi, câu hỏi, đáp án và hồ sơ người dùng.
          Khi khôi phục, <b>tài khoản người dùng không bao giờ bị xóa hay ghi đè</b>.
        </p>

        <div style={{ display: 'grid', gap: '.6rem', marginTop: '1rem' }}>
          <RestoreModeCard
            active={restoreMode === 'merge'}
            onSelect={() => setRestoreMode('merge')}
            title="Gộp (khuyên dùng)"
            desc="Thêm mới và cập nhật theo id, không xóa gì."
          />
          <RestoreModeCard
            active={restoreMode === 'replace'}
            onSelect={() => setRestoreMode('replace')}
            title="Thay thế"
            desc="Xóa đề/câu hỏi hiện có rồi nạp lại từ file. Tự tải bản an toàn trước."
            danger
          />
        </div>

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
          <button type="button" className="vt-btn primary" onClick={handleBackup} disabled={working}>
            {busy === 'backup' ? 'Đang tạo…' : <><IconDownload size={14} /> Tải bản sao lưu</>}
          </button>
          <button type="button" className="vt-btn" onClick={() => fileRef.current?.click()} disabled={working}>
            {busy === 'restore' ? 'Đang khôi phục…' : <><IconUpload size={14} /> Khôi phục từ file</>}
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => handleRestore(e.target.files?.[0])} />
        </div>

          {progress && (
          <p className="vt-muted" style={{ marginTop: '.8rem', fontSize: '.82rem' }}>
            <span className="page-loader-spinner" style={{ display: 'inline-block', width: 12, height: 12, marginRight: 6, verticalAlign: '-2px' }} />
            {progress}
          </p>
        )}
      </div>

      {/* ===== BẢNG GIÁ VIP/PRO & HẠN MỨC DÙNG THỬ ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconCrown size={16} className="vt-title-ico" />
            Bảng giá VIP/PRO & Hạn mức Dùng thử Giáo viên Free
          </h3>
          <span className="vt-chip ready">Đang áp dụng</span>
        </header>
        <div className="ad-kpi-strip" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: '1rem' }}>
          <div className="vt-card ad-mini-kpi">
            <span>🎓 Học sinh VIP / năm</span>
            <b style={{ color: '#7c3aed' }}>{formatVnd(STUDENT_VIP_ANNUAL_PRICE)}</b>
            <small>Trọn 1 năm (365 ngày) · ≈24.900đ/tháng</small>
          </div>
          <div className="vt-card ad-mini-kpi">
            <span>👨‍🏫 Giáo viên PRO / năm</span>
            <b style={{ color: '#d97706' }}>{formatVnd(TEACHER_VIP_ANNUAL_PRICE)}</b>
            <small>Trọn 1 năm (365 ngày) · ≈83.250đ/tháng</small>
          </div>
          <div className="vt-card ad-mini-kpi">
            <span>📄 Nhập đề Word Free</span>
            <b>{FREE_TEACHER_LIMITS.maxWordImports} lần</b>
            <small>Dùng thử cho tài khoản GV Free</small>
          </div>
          <div className="vt-card ad-mini-kpi">
            <span>✏️ Tạo đề thủ công Free</span>
            <b>{FREE_TEACHER_LIMITS.maxManualEntries} lần</b>
            <small>Chấm OMR Free: {FREE_TEACHER_LIMITS.maxOmrTrialSheets} phiếu · {FREE_TEACHER_LIMITS.maxClasses} lớp</small>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="vt-btn sm"
            onClick={async () => {
              await adminResetTeacherTrialQuota(user?.uid || 'guest');
              say('Đã reset lượt dùng thử (10 Word / 30 Thủ công / 5 OMR) trên phiên hiện tại.');
            }}
          >
            <IconRefresh size={13} /> Reset lượt dùng thử thiết bị này
          </button>
          <button
            type="button"
            className="vt-btn sm primary"
            onClick={() => { window.location.hash = 'admin/keys'; }}
          >
            <IconKey size={13} /> Mở Quản lý Key & Voucher
          </button>
        </div>
      </div>

      <div className="vt-card" style={{ borderLeft: '4px solid var(--vt-red)' }}>
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconWarning size={16} className="vt-title-ico" style={{ color: 'var(--vt-red)' }} />
            Vùng nguy hiểm
          </h3>
        </header>
        <p className="vt-muted">
          Các thao tác dưới đây <b>không thể hoàn tác</b>. Hãy tải bản sao lưu trước khi thực hiện.
        </p>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="vt-btn danger" onClick={deleteAttempts} disabled={working}>
            {busy === 'attempts' ? 'Đang xóa…' : <><IconTrash size={14} /> Xóa tất cả lượt làm bài</>}
          </button>
          <button type="button" className="vt-btn danger" onClick={deleteExams} disabled={working}>
            {busy === 'exams' ? 'Đang xóa…' : <><IconTrash size={14} /> Xóa tất cả đề thi</>}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        okLabel={confirm?.okLabel}
        danger={confirm?.danger}
        requireText={confirm?.requireText}
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
   SUB-COMPONENTS
   ============================================================ */
function ToggleRow({ label, desc, checked, onChange, danger }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '.7rem .9rem',
        borderRadius: 14,
        background: checked ? 'color-mix(in srgb, var(--acc) 8%, var(--vt-tint))' : 'var(--vt-tint)',
        border: danger && checked ? '1.5px solid var(--vt-red)' : '1.5px solid transparent',
        cursor: 'pointer',
        transition: 'all .2s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', font: '700 .95rem var(--sans)', color: 'var(--ink)' }}>
          {label}
        </b>
        <small style={{ color: 'var(--mut)', fontSize: '.8rem' }}>{desc}</small>
      </div>

      <span
        style={{
          position: 'relative',
          width: 44,
          height: 26,
          flexShrink: 0,
          borderRadius: 999,
          background: checked ? (danger ? 'var(--vt-red)' : 'var(--acc)') : 'color-mix(in srgb, var(--ink) 20%, transparent)',
          transition: 'background .2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            transition: 'left .2s',
          }}
        />
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', margin: 0 }}
        />
      </span>
    </label>
  );
}

function RestoreModeCard({ active, onSelect, title, desc, danger }) {
  return (
    <label
      onClick={onSelect}
      style={{
        display: 'flex',
        gap: '.8rem',
        alignItems: 'flex-start',
        padding: '.9rem 1rem',
        borderRadius: 14,
        border: active ? `2px solid ${danger ? 'var(--vt-red)' : 'var(--acc)'}` : '2px solid transparent',
        background: active
          ? `color-mix(in srgb, ${danger ? 'var(--vt-red)' : 'var(--acc)'} 8%, var(--vt-tint))`
          : 'var(--vt-tint)',
        cursor: 'pointer',
        transition: 'all .2s',
      }}
    >
      <input
        type="radio"
        checked={active}
        onChange={onSelect}
        style={{ marginTop: 4, accentColor: danger ? 'var(--vt-red)' : 'var(--acc)' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', font: '700 .92rem var(--sans)', color: 'var(--ink)' }}>{title}</b>
        <small style={{ color: 'var(--mut)', fontSize: '.78rem', lineHeight: 1.4 }}>{desc}</small>
      </div>
    </label>
  );
}