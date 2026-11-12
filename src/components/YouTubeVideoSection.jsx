import React, { useState } from 'react';
import '../styles/youtube-video.css';

/* ================= ICON SVG CHUẨN VECTOR ================= */
const IconPlay = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3" />
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
  if (!video) return null;

  const directUrl = video.youtubeUrl || (video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : video.searchUrl);

  return (
    <div className="ds-yt-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ds-yt-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <div className="ds-yt-modal-header">
          <div className="ds-yt-modal-header-left">
            <IconYouTube size={22} />
            <div>
              <h3 className="ds-yt-modal-title">{video.title}</h3>
              <span className="ds-yt-modal-sub">{video.channel} · {video.topic || 'Bài giảng trọng tâm'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ds-yt-btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
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

        {/* Thanh giải cứu nếu video bị kênh chặn quyền nhúng trên web */}
        <div className="ds-yt-modal-alert">
          <span className="ds-yt-alert-text">
            💡 Nếu video báo <strong>"Video không khả dụng"</strong> (do kênh tác giả hạn chế quyền nhúng web), bạn hãy:
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

        {/* Khung phát video 16:9 YouTube Embed */}
        <div className="ds-yt-player-frame">
          {video.videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="ds-yt-iframe"
            />
          ) : (
            <div className="ds-yt-search-fallback">
              <p>Mở danh sách bài giảng YouTube đầy đủ cho chủ đề:</p>
              <h4>"{video.query || video.title}"</h4>
              <a
                href={video.searchUrl}
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

        {/* Footer Modal */}
        <div className="ds-yt-modal-footer">
          <span>Khuyên dùng: Xem bài giảng kết hợp với mô hình 3D tương tác trên ELEC AI để hiểu sâu bản chất.</span>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ds-yt-ext-link"
          >
            <span>Mở xem Full HD trên trang YouTube</span>
            <IconExternalLink size={12} />
          </a>
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
