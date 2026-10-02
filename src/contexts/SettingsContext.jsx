// src/contexts/SettingsContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const KEY = 'app-settings-v1';

const DEFAULT = {
  siteName: 'A7 K60 DTA',
  siteDesc: 'Học Hóa học thông minh hơn',
  enableAI: true,
  enableChat: true,
  enablePet: true,
  enableGames: true,
  enableQuiz: true,
  maintenanceMode: false,
};

const SettingsContext = createContext({
  settings: DEFAULT,
  updateSettings: () => {},
  resetSettings: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  // Áp dụng settings lên DOM mỗi khi thay đổi
  useEffect(() => {
    // 1. Cập nhật title
    const baseTitle = 'A7 K60 DTA';
    document.title = document.title.replace(
      new RegExp(baseTitle, 'g'),
      settings.siteName || baseTitle
    );

    // 2. Cập nhật meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = settings.siteDesc || '';

    // 3. Toggle classes lên body để CSS ẩn/hiện
    document.body.classList.toggle('hide-ai', !settings.enableAI);
    document.body.classList.toggle('hide-chat', !settings.enableChat);
    document.body.classList.toggle('hide-pet', !settings.enablePet);
    document.body.classList.toggle('hide-games', !settings.enableGames);
    document.body.classList.toggle('hide-quiz', !settings.enableQuiz);
    document.body.classList.toggle('maintenance-mode', settings.maintenanceMode);

    // 4. Lưu localStorage
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch { /* noop */ }
  }, [settings]);

  const updateSettings = (patch) => {
    setSettings((s) => ({ ...s, ...patch }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings phải dùng trong SettingsProvider');
  return ctx;
}