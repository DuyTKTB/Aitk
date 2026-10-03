import { createContext, useContext, useEffect, useState, useRef } from 'react';

const KEY = 'app-settings-v1';
const BASE_TITLE = 'A7 K60 DTA';

const DEFAULT = {
  siteName: BASE_TITLE,
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

  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : BASE_TITLE);
  useEffect(() => {
    const newName = settings.siteName || BASE_TITLE;
    const currentTitle = document.title || '';
    if (currentTitle.includes(BASE_TITLE)) {
      document.title = currentTitle.replace(BASE_TITLE, newName);
    } else if (currentTitle.includes(settings.siteName) && settings.siteName !== newName) {
      document.title = currentTitle.replace(settings.siteName, newName);
    } else if (originalTitle.current.includes(BASE_TITLE)) {
      document.title = originalTitle.current.replace(BASE_TITLE, newName);
    }
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = settings.siteDesc || '';
    document.body.classList.toggle('hide-ai', !settings.enableAI);
    document.body.classList.toggle('hide-chat', !settings.enableChat);
    document.body.classList.toggle('hide-pet', !settings.enablePet);
    document.body.classList.toggle('hide-games', !settings.enableGames);
    document.body.classList.toggle('hide-quiz', !settings.enableQuiz);
    document.body.classList.toggle('maintenance-mode', settings.maintenanceMode);
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