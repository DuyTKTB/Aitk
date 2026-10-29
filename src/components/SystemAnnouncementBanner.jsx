import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext.jsx';
import './system-announcement-banner.css';

export default function SystemAnnouncementBanner() {
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  const isEnabled = settings.announcementEnabled && settings.announcementText?.trim();

  // Reset dismiss state if announcement text changes
  useEffect(() => {
    if (!isEnabled) return;
    try {
      const stored = localStorage.getItem('elec_dismissed_announcement');
      if (stored === settings.announcementText) {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, [settings.announcementText, isEnabled]);

  if (!isEnabled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('elec_dismissed_announcement', settings.announcementText);
    } catch { /* noop */ }
  };

  return (
    <div className="sys-ann-bar" role="alert">
      <div className="sys-ann-inner">
        <span className="sys-ann-badge">{settings.announcementBadge || '📢 Thông báo'}</span>
        <span className="sys-ann-text">{settings.announcementText}</span>
        {settings.announcementLink && (
          <a
            href={settings.announcementLink}
            className="sys-ann-link"
            onClick={() => {
              if (settings.announcementLink.startsWith('#')) {
                window.location.hash = settings.announcementLink.replace('#', '');
              }
            }}
          >
            Khám phá ngay →
          </a>
        )}
      </div>
      <button
        type="button"
        className="sys-ann-close"
        onClick={handleDismiss}
        aria-label="Đóng thông báo"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
