/* ============================================================
   RewardShopModal.jsx — Cửa Hàng Học Bá (Reward Shop)
   - Đổi Xu Học Bá (tích lũy tự động từ Lực chiến & Đấu 1v1) lấy:
     1. Khung Avatar phát sáng (Cực Quang, Hoàng Kim, Hồng Ngọc, Tinh Vân)
     2. Danh hiệu hiển thị trên Hồ sơ
     3. +1 Băng Giữ Chuỗi (cộng thẳng vào cs-streak-freeze-count)
   - Thiết kế chuẩn Apple Glassmorphism, 0 emoji, Light/Dark mode mượt
   ============================================================ */
import React, { useEffect, useState } from 'react';
import {
  SHOP_CATALOG,
  getRewardShopState,
  buyOrEquipShopItem,
} from '../lib/studentAnalytics.js';
import '../styles/student-v9-upgrades.css';

const TABS = [
  { id: 'frame', label: 'Khung Avatar' },
  { id: 'title', label: 'Danh hiệu' },
  { id: 'item', label: 'Vật phẩm' },
];

export default function RewardShopModal({ open, onClose, uid = 'guest', displayName = 'Học sinh ELEC AI' }) {
  const [cat, setCat] = useState('frame');
  const [shop, setShop] = useState(() => getRewardShopState(uid));
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (open) {
      setShop(getRewardShopState(uid));
      setFeedback(null);
    }
  }, [open, uid]);

  if (!open) return null;

  const activeFrameItem = SHOP_CATALOG.find((x) => x.id === shop.equippedFrame) || SHOP_CATALOG[0];
  const items = SHOP_CATALOG.filter((x) => x.category === cat);
  const initials = String(displayName || 'E').trim().slice(0, 1).toUpperCase();

  const handleAction = (item) => {
    const res = buyOrEquipShopItem(uid, item.id);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.state) setShop(res.state);
  };

  return (
    <div className="s9-shop-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="s9-shop-modal" role="dialog" aria-label="Cửa hàng Học Bá">
        <header className="s9-shop-head">
          <div>
            <span className="s9-shop-eyebrow">CỬA HÀNG HỌC BÁ · ELEC REWARDS</span>
            <h3>Đổi Xu Học Bá lấy Khung Avatar &amp; Vật phẩm</h3>
          </div>
          <div className="s9-shop-head-r">
            <div className="s9-shop-wallet" title="Xu tích lũy tự động từ điểm Lực chiến của bạn">
              <span>Số dư</span>
              <b>{shop.coins.toLocaleString('vi-VN')} Xu</b>
            </div>
            <button type="button" className="s9-shop-close" onClick={onClose} aria-label="Đóng">
              ✕
            </button>
          </div>
        </header>

        {/* Live Avatar & Title Showcase */}
        <div className="s9-shop-preview">
          <div className={`s9-avatar-ring ${activeFrameItem.previewClass || 's9-frame-minimal'}`}>
            <div className="s9-avatar-core">{initials}</div>
          </div>
          <div className="s9-shop-preview-meta">
            <strong>{displayName}</strong>
            <div className="s9-shop-preview-badges">
              <span className="s9-shop-chip">Khung: {activeFrameItem.name}</span>
              {shop.equippedTitle && (
                <span className="s9-shop-chip is-title">{shop.equippedTitle}</span>
              )}
            </div>
            <small>Luyện đề Phòng thi ảo hoặc thắng Đấu 1v1 để tự động nhận thêm Xu Học Bá.</small>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="s9-shop-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={cat === t.id}
              className={`s9-shop-tab ${cat === t.id ? 'active' : ''}`}
              onClick={() => setCat(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {feedback && (
          <div className={`s9-shop-toast ${feedback.ok ? 'ok' : 'err'}`}>
            {feedback.text}
          </div>
        )}

        {/* Item Grid */}
        <div className="s9-shop-grid">
          {items.map((item) => {
            const owned = !item.consumable && shop.owned.includes(item.id);
            const equipped =
              (item.category === 'frame' && shop.equippedFrame === item.id) ||
              (item.category === 'title' && shop.equippedTitle === item.name);
            const canAfford = shop.coins >= item.cost;

            return (
              <article key={item.id} className={`s9-shop-card ${equipped ? 'is-equipped' : ''}`}>
                <div className="s9-shop-card-top">
                  {item.category === 'frame' ? (
                    <div className={`s9-avatar-ring sm ${item.previewClass}`}>
                      <div className="s9-avatar-core sm">{initials}</div>
                    </div>
                  ) : (
                    <div className="s9-shop-swatch" style={{ background: item.accent }}>
                      {item.category === 'title' ? 'H' : 'B'}
                    </div>
                  )}
                  <div className="s9-shop-card-info">
                    <h4>{item.name}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
                <div className="s9-shop-card-foot">
                  <span className="s9-shop-price">
                    {item.cost === 0 ? 'Miễn phí' : `${item.cost} Xu`}
                  </span>
                  <button
                    type="button"
                    className={`s9-shop-buy-btn ${equipped ? 'is-equipped' : owned ? 'is-owned' : ''}`}
                    disabled={equipped || (!owned && !canAfford)}
                    onClick={() => handleAction(item)}
                  >
                    {equipped ? 'Đang dùng' : owned ? 'Trang bị' : item.consumable ? 'Đổi ngay' : 'Mở khóa'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
