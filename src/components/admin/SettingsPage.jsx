import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { IconSettings, IconTrash, IconPlus } from './AdminIcons.jsx';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [siteName, setSiteName] = useState(settings.siteName);
  const [siteDesc, setSiteDesc] = useState(settings.siteDesc);
  const [enableAI, setEnableAI] = useState(settings.enableAI);
  const [enableChat, setEnableChat] = useState(settings.enableChat);
  const [enablePet, setEnablePet] = useState(settings.enablePet);
  const [enableGames, setEnableGames] = useState(settings.enableGames);
  const [enableQuiz, setEnableQuiz] = useState(settings.enableQuiz);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode);

  const handleSave = () => {
    updateSettings({
      siteName,
      siteDesc,
      enableAI,
      enableChat,
      enablePet,
      enableGames,
      enableQuiz,
      maintenanceMode,
    });
    setMsg('✅ Đã lưu và áp dụng ngay');
    setTimeout(() => setMsg(null), 2500);
  };

  const handleReset = () => {
    if (!confirm('Khôi phục cài đặt mặc định?')) return;
    resetSettings();
    window.location.reload();
  };

  const handleBackup = async () => {
    try {
      setSaving(true);
      const tables = ['exams', 'questions', 'answers', 'profiles', 'topics'];
      const backup = {};

      for (const t of tables) {
        const { data } = await supabase.from(t).select('*');
        backup[t] = data || [];
      }

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMsg('✅ Đã tải backup');
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      alert('Lỗi backup: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (file) => {
    if (!file) return;
    if (!confirm('⚠ Restore sẽ GHI ĐÈ dữ liệu hiện tại. Tiếp tục?')) return;

    try {
      setSaving(true);
      const text = await file.text();
      const backup = JSON.parse(text);

      const deleteOrder = ['answers', 'questions', 'exams', 'topics', 'profiles'];
      for (const t of deleteOrder) {
        await supabase
          .from(t)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const insertOrder = ['profiles', 'topics', 'exams', 'questions', 'answers'];
      for (const t of insertOrder) {
        if (backup[t]?.length) {
          await supabase.from(t).insert(backup[t]);
        }
      }

      setMsg('✅ Đã restore thành công');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      alert('Lỗi restore: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adl-settings">
      {msg && <div className="adl-toast">{msg}</div>}

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3>
            <IconSettings size={16} />
            <span>Cấu hình chung</span>
          </h3>
        </header>

        <div className="adl-form">
          <label className="adl-field">
            <span>Tên website</span>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </label>

          <label className="adl-field">
            <span>Mô tả ngắn</span>
            <input
              type="text"
              value={siteDesc}
              onChange={(e) => setSiteDesc(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3>
            <IconSettings size={16} />
            <span>Bật / tắt tính năng</span>
          </h3>
        </header>

        <div className="adl-toggles">
          <Toggle
            label="AI Chat (CU AI)"
            desc="Trợ lý AI Hóa học trong web"
            checked={enableAI}
            onChange={setEnableAI}
          />
          <Toggle
            label="Chat cộng đồng"
            desc="Chat nhóm giữa học sinh"
            checked={enableChat}
            onChange={setEnableChat}
          />
          <Toggle
            label="Pet Widget"
            desc="Linh vật pha lê ở góc phải"
            checked={enablePet}
            onChange={setEnablePet}
          />
          <Toggle
            label="Trò chơi"
            desc="GameHub và các game nhỏ"
            checked={enableGames}
            onChange={setEnableGames}
          />
          <Toggle
            label="Ôn tập (Quiz)"
            desc="Trang quiz và SRS"
            checked={enableQuiz}
            onChange={setEnableQuiz}
          />
          <Toggle
            label="Bảo trì"
            desc="Tạm khoá toàn bộ web (chỉ admin vào được)"
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
          />
        </div>

        <div className="adl-form-actions">
          <button className="adl-btn-primary" onClick={handleSave}>
            💾 Lưu cấu hình
          </button>
          <button className="adl-btn-outline" onClick={handleReset}>
            ↺ Khôi phục mặc định
          </button>
        </div>

        <p className="adl-hint" style={{ marginTop: '1rem' }}>
          💡 Cài đặt sẽ <b>áp dụng ngay</b> khi nhấn Lưu. Không cần reload trang.
        </p>
      </section>

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3>
            <IconSettings size={16} />
            <span>Sao lưu / Phục hồi</span>
          </h3>
        </header>

        <p className="adl-hint">
          Tải toàn bộ đề thi, câu hỏi, đáp án, người dùng về file JSON.
          Restore sẽ <b>GHI ĐÈ</b> toàn bộ dữ liệu hiện tại.
        </p>

        <div className="adl-form-actions">
          <button className="adl-btn-primary" onClick={handleBackup} disabled={saving}>
            📥 Tải backup
          </button>

          <label className="adl-btn-outline" style={{ cursor: 'pointer' }}>
            📤 Restore từ file
            <input
              type="file"
              accept=".json"
              hidden
              onChange={(e) => handleRestore(e.target.files[0])}
            />
          </label>
        </div>
      </section>

      <section className="adl-panel adl-danger">
        <header className="adl-panel-head">
          <h3>
            <IconTrash size={16} />
            <span>Vùng nguy hiểm</span>
          </h3>
        </header>

        <p className="adl-hint">
          Các thao tác dưới đây <b>KHÔNG THỂ HOÀN TÁC</b>. Cẩn thận!
        </p>

        <div className="adl-form-actions">
          <button
            className="adl-btn-danger"
            onClick={async () => {
              if (!confirm('Xóa TẤT CẢ lượt làm bài? Không hoàn tác được!')) return;
              try {
                await supabase
                  .from('exam_attempts')
                  .delete()
                  .neq('id', '00000000-0000-0000-0000-000000000000');
                alert('✅ Đã xóa toàn bộ lượt làm bài');
              } catch (e) {
                alert('Lỗi: ' + e.message);
              }
            }}
          >
            🗑 Xóa tất cả lượt làm bài
          </button>

          <button
            className="adl-btn-danger"
            onClick={async () => {
              if (!confirm('Xóa TẤT CẢ đề thi và câu hỏi? Không hoàn tác được!')) return;
              if (!confirm('Chắc chắn chứ? Lần cuối!')) return;
              try {
                await supabase
                  .from('exams')
                  .delete()
                  .neq('id', '00000000-0000-0000-0000-000000000000');
                alert('✅ Đã xóa toàn bộ đề thi');
                window.location.reload();
              } catch (e) {
                alert('Lỗi: ' + e.message);
              }
            }}
          >
            🗑 Xóa tất cả đề thi
          </button>
        </div>
      </section>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="adl-toggle">
      <div>
        <b>{label}</b>
        <small>{desc}</small>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="adl-toggle-slider" />
    </label>
  );
}