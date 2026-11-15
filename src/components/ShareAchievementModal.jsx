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

function parsePercentileParts(text = 'Top 20% Thí Sinh Toàn Quốc') {
  const raw = String(text || 'Top 20% Thí Sinh Toàn Quốc').trim();
  const match = raw.match(/^(Top\s*)(\d+%?)\s*(.*)$/i);
  if (match) {
    return {
      prefix: 'Top ',
      percent: match[2].includes('%') ? match[2] : `${match[2]}%`,
      sub: match[3]?.trim() || 'Thí Sinh Toàn Quốc',
    };
  }
  return {
    prefix: 'Top ',
    percent: '20%',
    sub: raw || 'Thí Sinh Toàn Quốc',
  };
}

/**
 * ShareAchievementModal.jsx — Thẻ Thành Tích ACHIEVEMENT COUPON chuẩn mẫu ELEC Science AI
 * Sử dụng trực tiếp phôi vé /img/elec/achievement-coupon-template.png (1024x682) với linh vật Bé Elec.
 */
export default function ShareAchievementModal({
  open,
  onClose,
  score = 9.25,
  percentileText = 'Top 20% Thí Sinh Toàn Quốc',
  validUntil = '20 JUNE, 2026',
}) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 1024;
    const H = 682;
    canvas.width = W;
    canvas.height = H;

    const drawDynamicOverlay = (templateImg) => {
      if (cancelled) return;
      ctx.clearRect(0, 0, W, H);

      if (templateImg) {
        ctx.drawImage(templateImg, 0, 0, W, H);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
      }

      // 1. Vẽ "Top XX%" + "Thí Sinh Toàn Quốc" vào giữa huy hiệu vòng nguyệt quế xanh (xCenter = 524)
      const { prefix, percent, sub } = parsePercentileParts(percentileText);
      const pillCenterX = 524;

      ctx.save();
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';

      const fontPrefix = '900 47px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      const fontPercent = '900 52px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

      ctx.font = fontPrefix;
      const wPrefix = ctx.measureText(prefix).width;
      ctx.font = fontPercent;
      const wPercent = ctx.measureText(percent).width;

      const totalTopW = wPrefix + wPercent;
      const startX = pillCenterX - totalTopW / 2;
      const topBaselineY = 407;

      // Vẽ chữ "Top " màu trắng
      ctx.font = fontPrefix;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(prefix, startX, topBaselineY);

      // Vẽ số "20%" màu vàng kim
      ctx.font = fontPercent;
      ctx.fillStyle = '#f6d02f';
      ctx.fillText(percent, startX + wPrefix, topBaselineY);

      // Vẽ dòng phụ "Thí Sinh Toàn Quốc" màu trắng
      ctx.font = '800 21.5px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(sub, pillCenterX, 439);
      ctx.restore();

      // 2. Vẽ "VALID UNTIL" & Ngày hết hạn vào khung thuốc trắng phía dưới (xCenter = 522)
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#0d1e47';

      ctx.font = '800 18px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('VALID UNTIL', 522, 499);

      ctx.font = '800 19.5px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(String(validUntil || '20 JUNE, 2026').toUpperCase(), 522, 521);
      ctx.restore();

      // 3. Vẽ điểm số xoay dọc 90 độ bên cuống vé phải (giữa mã vạch và chữ ACHIEVEMENT SCORE)
      const formattedScore = Number.isFinite(Number(score))
        ? Number(score).toFixed(2)
        : '9.25';

      ctx.save();
      ctx.translate(888, 298);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0c1e4a';
      ctx.font = '900 88px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(formattedScore, 0, 0);
      ctx.restore();

      try {
        setDataUrl(canvas.toDataURL('image/png'));
      } catch {
        /* ignore */
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawDynamicOverlay(img);
    img.onerror = () => drawDynamicOverlay(null);
    img.src = '/img/elec/achievement-coupon-template.png';

    return () => {
      cancelled = true;
    };
  }, [open, score, percentileText, validUntil]);

  if (!open) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `elec-science-ai-achievement-coupon-${Date.now()}.png`;
    a.click();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 6, 23, 0.78)',
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
          maxWidth: 740,
          width: '100%',
          background: '#ffffff',
          border: '1px solid rgba(37, 99, 235, 0.22)',
          borderRadius: 22,
          padding: 20,
          color: '#0f172a',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.45)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#2563eb', display: 'inline-flex' }}>
              <SvgAward size={22} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: 17.5, fontWeight: 800, color: '#0f172a' }}>
                Thẻ Thành Tích ELEC Science AI (Achievement Coupon)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
                Nhấn tải xuống để lưu thẻ vé thành tích PNG độ phân giải cao
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
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#475569',
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
            border: '1px solid #e2e8f0',
            display: 'block',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: 11,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
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
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 13.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
            }}
          >
            <SvgDownload size={16} />
            <span>Tải Thẻ Thành Tích (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
