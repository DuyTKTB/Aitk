import { useEffect, useRef, useState } from 'react';

const SvgAward = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const SvgDownload = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SvgClose = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawVectorBolt(ctx, cx, cy, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(2, -10);
  ctx.lineTo(-8, 2);
  ctx.lineTo(-1, 2);
  ctx.lineTo(-3, 10);
  ctx.lineTo(8, -2);
  ctx.lineTo(1, -2);
  ctx.closePath();
  ctx.fillStyle = '#38bdf8';
  ctx.fill();
  ctx.restore();
}

/**
 * ShareAchievementModal.jsx — Tạo & Tải Thẻ Thành Tích (Shareable Achievement Card PNG)
 * Thiết kế chuẩn ELEC Science AI: 100% Vector SVG + Linh vật Bé Elec trên thẻ PNG xuất ra.
 */
export default function ShareAchievementModal({
  open,
  onClose,
  studentName = 'Học sinh ELEC AI',
  examTitle = 'Ca Thi Thử Thực Chiến THPT Quốc Gia 2026',
  score = 9.0,
  totalQuestions = 28,
  correctCount = 25,
  percentileText = 'Top 5% Thí Sinh Toàn Quốc',
  subjectLabel = 'Khoa học Tự nhiên (Lý · Hóa · Sinh)',
}) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 1080;
    const H = 680;
    canvas.width = W;
    canvas.height = H;

    const renderCard = (mascotImg = null) => {
      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#070d1e');
      grad.addColorStop(0.55, '#0f2350');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Decorative Glow Circles
      const glow1 = ctx.createRadialGradient(880, 140, 20, 880, 140, 340);
      glow1.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
      glow1.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, W, H);

      const glow2 = ctx.createRadialGradient(200, 560, 20, 200, 560, 280);
      glow2.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
      glow2.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, W, H);

      // Card Frame
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, 36, 36, W - 72, H - 72, 24);
      ctx.stroke();

      // Header Badge (Vector Bolt + Text)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.22)';
      drawRoundedRect(ctx, 68, 68, 415, 44, 22);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      drawVectorBolt(ctx, 94, 90, 1.05);

      ctx.fillStyle = '#bae6fd';
      ctx.font = '800 17px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ELEC SCIENCE AI · CHỨNG NHẬN THÀNH TÍCH', 114, 96);

      // Student Name
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 44px system-ui, -apple-system, sans-serif';
      ctx.fillText(String(studentName || 'Học sinh ELEC AI').slice(0, 30), 68, 174);

      // Exam Title & Subject
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 23px system-ui, -apple-system, sans-serif';
      ctx.fillText(String(examTitle || 'Đề Thi Thử Chuẩn Bộ GD&ĐT 2026').slice(0, 48), 68, 220);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 19px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Phân môn: ${subjectLabel}`, 68, 258);

      // Score Box on Right
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.75)';
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, 710, 96, 300, 270, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#93c5fd';
      ctx.font = '800 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐIỂM SỐ ĐẠT ĐƯỢC', 860, 142);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '800 78px system-ui, -apple-system, sans-serif';
      ctx.fillText(Number(score || 0).toFixed(2), 860, 236);

      ctx.fillStyle = '#34d399';
      ctx.font = '700 20px system-ui, -apple-system, sans-serif';
      ctx.fillText(percentileText, 860, 294);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 15px system-ui, -apple-system, sans-serif';
      ctx.fillText('Thang điểm 10 chuẩn Bộ GD&ĐT', 860, 334);

      ctx.textAlign = 'left';

      // Metrics Row
      const metrics = [
        ['Độ chính xác', `${correctCount}/${totalQuestions} câu`],
        ['Xếp hạng toàn quốc', percentileText],
        ['Chuẩn cấu trúc', 'THPT 2026 (3 Phần)'],
      ];

      metrics.forEach(([label, val], idx) => {
        const x = 68 + idx * 208;
        const y = 310;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, x, y, 194, 98, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(label, x + 16, y + 34);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '800 20px system-ui, -apple-system, sans-serif';
        ctx.fillText(String(val).slice(0, 18), x + 16, y + 72);
      });

      // Mascot Companion Strip on Card
      ctx.fillStyle = 'rgba(37, 99, 235, 0.16)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, 68, 432, 620, 74, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#60a5fa';
      ctx.font = '800 15px system-ui, -apple-system, sans-serif';
      ctx.fillText('LỜI NHẮN TỪ LINH VẬT BÉ ELEC:', 88, 460);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        Number(score || 0) >= 8.5
          ? 'Phong độ đỉnh cao! Giữ vững nhịp độ này cho kỳ thi THPT Quốc gia nhé!'
          : 'Mỗi đề thi là một bước tiến! Cùng Elec ôn kỹ Sổ tay lỗi sai để bứt phá 9+ nhé!',
        88,
        488
      );

      // Draw Mascot Image on Bottom Right of Card
      if (mascotImg) {
        ctx.save();
        ctx.shadowColor = 'rgba(37, 99, 235, 0.55)';
        ctx.shadowBlur = 24;
        ctx.drawImage(mascotImg, 790, 385, 210, 210);
        ctx.restore();
      }

      // Footer Signature
      ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.fillRect(68, 532, 680, 1.5);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 19px system-ui, -apple-system, sans-serif';
      ctx.fillText('Hệ sinh thái KHTN AI: https://www.elecai.id.vn', 68, 574);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Nhà sáng lập: Nguyễn Thế Duy (Duy TK) · Ngày cấp: ${new Date().toLocaleDateString('vi-VN')}`, 68, 606);

      try {
        setDataUrl(canvas.toDataURL('image/png'));
      } catch {
        /* ignore */
      }
    };

    renderCard(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => renderCard(img);
    img.src = Number(score || 0) >= 8 ? '/img/elec/elec-celebrate.png' : '/img/elec/elec-fighting.png';
  }, [open, studentName, examTitle, score, totalQuestions, correctCount, percentileText, subjectLabel]);

  if (!open) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `elec-ai-thanh-tich-${Date.now()}.png`;
    a.click();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        style={{
          maxWidth: 700,
          width: '100%',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: 20,
          padding: 22,
          color: '#f8fafc',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/img/elec/elec-celebrate.png"
              alt="Bé Elec Vinh Danh"
              style={{ width: 46, height: 46, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(59,130,246,0.4))' }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: 17.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc' }}>
                <span style={{ color: '#fbbf24', display: 'inline-flex' }}><SvgAward size={20} /></span>
                <span>Thẻ Thành Tích ELEC Science AI (PNG)</span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#94a3b8' }}>
                Lưu thẻ vinh danh độ phân giải cao cùng linh vật Bé Elec để chia sẻ lên mạng xã hội
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(148, 163, 184, 0.12)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#cbd5e1',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <SvgClose size={17} />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: 14,
            border: '1px solid rgba(59, 130, 246, 0.4)',
            display: 'block',
            boxShadow: '0 12px 32px rgba(2, 6, 23, 0.5)',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: 11,
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'transparent',
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: 13.5,
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleDownload}
            style={{
              padding: '9px 20px',
              borderRadius: 11,
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
            }}
          >
            <SvgDownload size={16} />
            <span>Tải Ảnh Thành Tích (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
