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
            <b>Học online &amp; AI Giáo dục</b>
            <a href="/hoc-online-mien-phi">Học online miễn phí</a>
            <a href="/ai-giao-duc">AI trong giáo dục</a>
            <a href="/gia-su-ai">Gia sư AI 24/7</a>
            <a href="/giai-bai-tap-bang-ai">Giải bài tập bằng AI</a>
            <a href="/luyen-thi-thpt-quoc-gia">Luyện thi THPT Quốc gia</a>
            <a href="/phong-thi-ao">Phòng thi ảo 2026</a>
          </div>
          <div>
            <b>Giáo viên &amp; Học THPT</b>
            <a href="/cho-giao-vien">LMS &amp; Quản lý lớp học</a>
            <a href="/phan-mem-tao-de-thi">Phần mềm tạo đề thi</a>
            <a href="/cham-bai-trac-nghiem-tu-dong">Chấm bài trắc nghiệm OMR</a>
            <a href="/hoc-hoa-hoc-online">Học Hóa học online</a>
            <a href="/hoc-vat-ly-online">Học Vật lý online</a>
            <a href="/hoc-sinh-hoc-online">Học Sinh học online</a>
          </div>
          <div>
            <b>Kho dữ liệu &amp; Công cụ</b>
            <a href="/de-thi">Kho 66+ Đề thi thử THPT</a>
            <a href="/nguyen-to">118 Nguyên tố IUPAC</a>
            <a href="/phuong-trinh">Phương trình Hóa học</a>
            <a href="/kien-thuc">125 Chuyên đề THPT</a>
            <a href="/bang-tuan-hoan">Bảng tuần hoàn tương tác</a>
            <a href="/can-bang-phuong-trinh-hoa-hoc">Cân bằng PTHH tự động</a>
          </div>
          <div>
            <b>Giới thiệu &amp; Cộng đồng</b>
            <a href="/cong-dong">Cộng đồng hỏi đáp</a>
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
          © 2026 ELEC Science AI (All Rights Reserved) · Tác giả &amp; Bản quyền:{' '}
          <a href="/nha-sang-lap" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
            Nguyễn Thế Duy (Duy TK)
          </a>{' '}
          ·{' '}
          <a href="/nha-sang-lap#founder-awards" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Giải Ba Sở GD&amp;ĐT Hưng Yên 2026
          </a>{' '}
          ·{' '}
          <a href="/nha-sang-lap#founder-copyright" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Chứng thực SHA-256
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
