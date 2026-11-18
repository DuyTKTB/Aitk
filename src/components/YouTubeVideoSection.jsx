import React, { useEffect, useState } from 'react';
import {
  OFFICIAL_TUTORIAL_VIDEOS,
  OFFICIAL_YOUTUBE_CHANNEL_URL,
  OFFICIAL_TEACHER_ZALO_GROUP_URL,
} from '../lib/youtubeService.js';
import '../styles/youtube-video.css';

/* ================= ICON SVG CHUẨN VECTOR ================= */
const IconPlay = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconZaloChat = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconYouTube = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: '#ff0000' }}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const IconClose = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const IconExternalLink = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconVerified = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: '#38bdf8' }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

/**
 * Thẻ hiển thị một Video bài giảng YouTube
 */
export function YouTubeVideoCard({ video, onPlay }) {
  if (!video) return null;

  const directUrl = video.youtubeUrl || (video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : video.searchUrl);

  const handleCardClick = () => {
    // Mặc định click vào thẻ sẽ mở ngay trang YouTube chính thức để 100% không bị lỗi nhúng
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="ds-yt-card" onClick={handleCardClick} role="button" tabIndex={0} title="Bấm để xem bài giảng trên YouTube">
      {/* Thumbnail với nút Play đỏ */}
      <div className="ds-yt-thumb-wrap">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="ds-yt-thumb-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';
          }}
        />
        <div className="ds-yt-play-overlay">
          <div className="ds-yt-play-btn">
            <IconPlay size={16} />
          </div>
        </div>
        {video.duration && (
          <span className="ds-yt-duration-badge">{video.duration}</span>
        )}
      </div>

      {/* Thông tin video */}
      <div className="ds-yt-info">
        <h4 className="ds-yt-title">{video.title}</h4>
        
        <div className="ds-yt-channel-row">
          <span className="ds-yt-channel-name">{video.channel}</span>
          <IconVerified size={13} />
        </div>

        {video.desc && (
          <p className="ds-yt-desc">{video.desc}</p>
        )}

        {/* 2 nút hành động: Xem trên YouTube (100% hoạt động) & Xem nhanh */}
        <div className="ds-yt-actions" onClick={(e) => e.stopPropagation()}>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ds-yt-btn-primary"
            title="Mở xem 100% Full HD trên YouTube (không bị lỗi bản quyền nhúng)"
          >
            <IconYouTube size={15} />
            <span>Xem trên YouTube</span>
          </a>

          {video.videoId && onPlay && (
            <button
              type="button"
              className="ds-yt-btn-secondary"
              onClick={() => onPlay(video)}
              title="Mở xem nhanh trong cửa sổ ứng dụng"
            >
              <IconPlay size={12} />
              <span>Xem nhanh</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Popup xem video YouTube trực tiếp không bị xao nhãng
 */
export function YouTubeVideoModal({ video, onClose }) {
  const [selectedVideo, setSelectedVideo] = useState(video);

  useEffect(() => {
    setSelectedVideo(video);
  }, [video]);

  useEffect(() => {
    if (!video) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [video, onClose]);

  if (!selectedVideo) return null;

  const directUrl =
    selectedVideo.youtubeUrl ||
    (selectedVideo.videoId ? `https://www.youtube.com/watch?v=${selectedVideo.videoId}` : selectedVideo.searchUrl);

  const isOfficialElecVideo = Boolean(
    selectedVideo?.channel?.includes('ELEC AI') ||
      OFFICIAL_TUTORIAL_VIDEOS.some((v) => v.videoId === selectedVideo?.videoId)
  );

  return (
    <div className="ds-yt-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={selectedVideo.title}>
      <div className="ds-yt-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <div className="ds-yt-modal-header">
          <div className="ds-yt-modal-header-left">
            <div className="ds-yt-modal-mascot-wrap" aria-hidden="true">
              <img src="/img/elec/elec-happy.png" alt="" className="ds-yt-modal-mascot" draggable={false} />
            </div>
            <div className="ds-yt-modal-title-group">
              <span className="ds-yt-modal-eyebrow">
                <IconYouTube size={14} />
                <span>ELEC AI ACADEMY · @ELECAI-idvn</span>
              </span>
              <h3 className="ds-yt-modal-title">{selectedVideo.title}</h3>
              <span className="ds-yt-modal-sub">
                {selectedVideo.channel} · {selectedVideo.topic || 'Hướng dẫn thực chiến 1 phút'}
              </span>
            </div>
          </div>

          <div className="ds-yt-modal-actions">
            <a
              href={OFFICIAL_TEACHER_ZALO_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ds-yt-btn-zalo"
              title="Tham gia Nhóm Zalo Hỗ trợ Giáo viên"
            >
              <IconZaloChat size={14} />
              <span>Nhóm Zalo GV</span>
            </a>
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ds-yt-btn-primary ds-yt-btn-open"
              title="Mở trên YouTube"
            >
              <IconExternalLink size={13} />
              <span>Mở YouTube</span>
            </a>
            <button
              type="button"
              className="ds-yt-modal-close"
              onClick={onClose}
              aria-label="Đóng video"
              title="Đóng (Esc)"
            >
              <IconClose size={20} />
            </button>
          </div>
        </div>

        {/* Chỉ hiện thanh giải cứu cho video bên ngoài không phải kênh ELEC AI */}
        {!isOfficialElecVideo && (
          <div className="ds-yt-modal-alert">
            <span className="ds-yt-alert-text">
              Nếu video báo <strong>"Video không khả dụng"</strong> (do kênh tác giả hạn chế quyền nhúng web), bạn hãy:
            </span>
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ds-yt-alert-link"
            >
              <IconYouTube size={14} />
              <span>Mở xem trực tiếp 100% trên YouTube ↗</span>
            </a>
          </div>
        )}

        {/* Khung phát video 16:9 YouTube Embed */}
        <div className="ds-yt-player-frame">
          {selectedVideo.videoId ? (
            <iframe
              key={selectedVideo.videoId}
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="ds-yt-iframe"
            />
          ) : (
            <div className="ds-yt-search-fallback">
              <p>Mở danh sách bài giảng YouTube đầy đủ cho chủ đề:</p>
              <h4>"{selectedVideo.query || selectedVideo.title}"</h4>
              <a
                href={selectedVideo.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ds-yt-search-cta"
              >
                <IconYouTube size={18} />
                <span>Xem trên YouTube</span>
              </a>
            </div>
          )}
        </div>

        {/* Bộ chuyển video + Biệt đội linh vật hỗ trợ 24/7 */}
        <div className="ds-yt-modal-studio-bar">
          <div className="ds-yt-modal-switch-grid">
            {OFFICIAL_TUTORIAL_VIDEOS.map((vid, idx) => {
              const isCurrent = selectedVideo?.videoId === vid.videoId;
              const mascotSrc = idx === 0 ? '/img/elec/elec-cool.png' : '/img/elec/elec-heart-eyes.png';
              return (
                <button
                  key={vid.videoId}
                  type="button"
                  className={`ds-yt-modal-switch-item ${isCurrent ? 'is-active' : ''}`}
                  onClick={() => setSelectedVideo(vid)}
                >
                  <img src={mascotSrc} alt="" className="ds-yt-switch-mascot" draggable={false} />
                  <div className="ds-yt-switch-body">
                    <div className="ds-yt-switch-top">
                      <span className="ds-yt-switch-dur">{vid.duration}</span>
                      <span className={`ds-yt-switch-state ${isCurrent ? 'is-playing' : ''}`}>
                        {isCurrent ? 'Đang phát' : 'Bấm để xem'}
                      </span>
                    </div>
                    <strong className="ds-yt-switch-title">{vid.shortTitle || vid.title}</strong>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="ds-yt-modal-community">
            <div className="ds-yt-modal-community-left">
              <div className="ds-yt-mascot-trio" aria-hidden="true">
                <img src="/img/elec/elec-love.png" alt="" draggable={false} />
                <img src="/img/elec/elec-happy.png" alt="" draggable={false} />
                <img src="/img/elec/elec-cool.png" alt="" draggable={false} />
              </div>
              <span className="ds-yt-modal-community-text">
                Biệt đội ELEC AI hỗ trợ Thầy/Cô chuẩn hóa file Word &amp; tạo đề 24/7
              </span>
            </div>
            <div className="ds-yt-modal-community-links">
              <a
                href={OFFICIAL_TEACHER_ZALO_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ds-yt-ext-link is-zalo"
              >
                Tham gia Nhóm Zalo ↗
              </a>
              <a
                href={OFFICIAL_YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ds-yt-ext-link"
              >
                Kênh @ELECAI-idvn ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section Danh sách Video Đề xuất liên quan đến bài học
 */
export function YouTubeVideoSection({ videos = [], title = 'Video bài giảng YouTube liên quan' }) {
  const [activeVideo, setActiveVideo] = useState(null);

  if (!videos || videos.length === 0) return null;

  return (
    <div className="ds-yt-section">
      <div className="ds-yt-section-header">
        <div className="ds-yt-section-badge">
          <IconYouTube size={16} />
          <span>BÀI GIẢNG VIDEO NỔI BẬT</span>
        </div>
        <h3 className="ds-yt-section-title">{title}</h3>
      </div>

      <div className="ds-yt-grid">
        {videos.map((v, idx) => (
          <YouTubeVideoCard
            key={v.id || idx}
            video={v}
            onPlay={(vid) => setActiveVideo(vid)}
          />
        ))}
      </div>

      {/* Modal Popup Player */}
      {activeVideo && (
        <YouTubeVideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}

export default YouTubeVideoSection;
