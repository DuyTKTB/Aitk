import { IconFlask } from './Icons.jsx';
import { OFFICIAL_YOUTUBE_CHANNEL_URL, OFFICIAL_TEACHER_ZALO_GROUP_URL } from '../lib/youtubeService.js';
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
          <b>ELEC Science AI (ELEC AI)</b>
          <small>
            Nền tảng học tập, trợ lý AI giải bài từng bước và phòng thi ảo Khoa học Tự nhiên (Vật lí — Hóa học — Sinh học) chuẩn GDPT 2018 tại elecai.id.vn · Sáng lập &amp; phát triển bởi Nguyễn Thế Duy (Duy TK / Tk Media).
          </small>
        </div>

        <div className="sf-links">
          <div>
            <b>Sản phẩm</b>
            <a href="/">Trang chủ</a>
            <a href="/tai-lieu-hoa-hoc">Công cụ KHTN</a>
            <a href="/phong-thi-ao">Phòng thi ảo</a>
            <a href="/tro-choi-khoa-hoc">Trò chơi &amp; Lab 3D</a>
          </div>
          <div>
            <b>Công cụ nổi bật</b>
            <a href="/bang-tuan-hoan">Bảng tuần hoàn</a>
            <a href="/cong-thuc-hoa-hoc">Công thức 3 môn KHTN</a>
            <a href="/can-bang-phuong-trinh-hoa-hoc">Cân bằng PTHH</a>
            <a href="/lo-trinh-on-thi-thpt-quoc-gia">Lộ trình ôn thi</a>
          </div>
          <div>
            <b>Giới thiệu &amp; Cộng đồng</b>
            <a href="/gioi-thieu">Giới thiệu ELEC AI</a>
            <a href={OFFICIAL_YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">Kênh YouTube Hướng dẫn</a>
            <a href={OFFICIAL_TEACHER_ZALO_GROUP_URL} target="_blank" rel="noopener noreferrer">Nhóm Zalo Hỗ trợ Giáo viên</a>
            <a href="/chinh-sach-bao-mat">Chính sách bảo mật</a>
            <a href="/dieu-khoan-su-dung">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="sf-bot">
        <small>
          © 2026 ELEC AI · Nhà sáng lập:{' '}
          <a href="/nha-sang-lap" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
            Nguyễn Thế Duy (Duy TK)
          </a>{' '}
          ·{' '}
          <a
            href={OFFICIAL_YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            YouTube
          </a>{' '}
          ·{' '}
          <a
            href={OFFICIAL_TEACHER_ZALO_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Zalo Giáo viên
          </a>{' '}
          ·{' '}
          <a
            href="https://www.facebook.com/nguyentheduytk"
            target="_blank"
            rel="me noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Facebook
          </a>
        </small>
        <small style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Made with <IconFlask size={13} style={{ color: 'var(--pri, #2563eb)' }} /> in Vietnam
        </small>
      </div>

      {/* ✅ BANNER LỚN — dùng file banner.png riêng */}
      <div className="sf-banner" aria-hidden="true">
        <img
          src="/img/banner.png"
          alt="ELEC AI"
          className="sf-banner-img"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    </footer>
  );
}
