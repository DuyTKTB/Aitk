import './site-footer.css';

/* ============================================================
   SiteFooter — Footer dùng chung cho TẤT CẢ trang
   Banner dùng file RIÊNG: /img/banner.png (không phải logo.png)
   ============================================================ */
export default function SiteFooter() {
  return (
    <footer className="sf">
      {/* Info */}
      <div className="sf-top">
        <div className="sf-brand">
          <b>A7 K60 DTA</b>
          <small>Trợ lý AI Hóa học cho học sinh 10–12. Học chủ động, hiểu tận gốc.</small>
        </div>

        <div className="sf-links">
          <div>
            <b>Sản phẩm</b>
            <a href="#home">Trang chủ</a>
            <a href="#tools">Công cụ</a>
            <a href="#quiz">Ôn tập</a>
            <a href="#games">Trò chơi</a>
          </div>
          <div>
            <b>Hỗ trợ</b>
            <a href="#table">Bảng tuần hoàn</a>
            <a href="#formulas">Công thức nhanh</a>
            <a href="#balance">Cân bằng PTHH</a>
            <a href="#stats">Thống kê</a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="sf-bot">
        <small>© 2026 · bycode Duy TK</small>
        <small>Made with ⚗ in Vietnam</small>
      </div>

      {/* ✅ BANNER LỚN — dùng file banner.png riêng */}
      <div className="sf-banner" aria-hidden="true">
        <img
          src="/img/banner.png"
          alt="A7 K60 DTA"
          className="sf-banner-img"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    </footer>
  );
}