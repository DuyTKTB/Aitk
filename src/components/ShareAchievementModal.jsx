import { useEffect, useRef, useState } from 'react';

/**
 * ShareAchievementModal.jsx — Tạo & Tải Thẻ Thành Tích (Shareable Achievement Card PNG)
 * Hỗ trợ học sinh chia sẻ điểm thi Phòng thi ảo / Điểm Elo / Top % lên Facebook, Zalo, TikTok.
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

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#070d1e');
    grad.addColorStop(0.55, '#0f2350');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative Glow Circles
    const glow1 = ctx.createRadialGradient(900, 120, 20, 900, 120, 320);
    glow1.addColorStop(0, 'rgba(59, 130, 246, 0.32)');
    glow1.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    // Card Frame
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    // Header Badge
    ctx.fillStyle = 'rgba(59, 130, 246, 0.22)';
    ctx.fillRect(68, 68, 390, 42);
    ctx.fillStyle = '#93c5fd';
    ctx.font = '700 18px system-ui, -apple-system, sans-serif';
    ctx.fillText('⚡ ELEC SCIENCE AI · CHỨNG NHẬN THÀNH TÍCH', 84, 95);

    // Student Name
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 44px system-ui, -apple-system, sans-serif';
    ctx.fillText(String(studentName || 'Học sinh ELEC AI').slice(0, 32), 68, 175);

    // Exam Title & Subject
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(String(examTitle || 'Đề Thi Thử Chuẩn Bộ GD&ĐT 2026').slice(0, 52), 68, 222);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Phân môn: ${subjectLabel}`, 68, 260);

    // Score Box on Right
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.fillRect(700, 110, 300, 260);
    ctx.strokeRect(700, 110, 300, 260);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '700 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ĐIỂM SỐ ĐẠT ĐƯỢC', 850, 158);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '800 78px system-ui, -apple-system, sans-serif';
    ctx.fillText(Number(score || 0).toFixed(2), 850, 255);

    ctx.fillStyle = '#34d399';
    ctx.font = '700 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(percentileText, 850, 315);

    ctx.textAlign = 'left';

    // Metrics Row
    const metrics = [
      ['Độ chính xác', `${correctCount}/${totalQuestions} câu`],
      ['Xếp hạng toàn quốc', percentileText],
      ['Chuẩn cấu trúc', 'THPT 2026 (3 Phần)'],
    ];

    metrics.forEach(([label, val], idx) => {
      const x = 68 + idx * 205;
      const y = 320;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(x, y, 190, 96);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(label, x + 16, y + 34);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(val, x + 16, y + 72);
    });

    // Footer Signature
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.fillRect(68, 530, W - 136, 1.5);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('🌐 Luyện thi KHTN miễn phí tại: https://www.elecai.id.vn', 68, 580);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 17px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Nhà sáng lập: Nguyễn Thế Duy (Duy TK) · Ngày cấp: ${new Date().toLocaleDateString('vi-VN')}`, 68, 612);

    try {
      setDataUrl(canvas.toDataURL('image/png'));
    } catch { /* ignore */ }
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
        background: 'rgba(2, 6, 23, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        style={{
          maxWidth: 680,
          width: '100%',
          background: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.28)',
          borderRadius: 18,
          padding: 20,
          color: '#f8fafc',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🏆 Thẻ Thành Tích ELEC Science AI (PNG)</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 'auto', borderRadius: 12, border: '1px solid rgba(59,130,246,0.35)', display: 'block' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'transparent', color: '#cbd5e1', fontWeight: 600, cursor: 'pointer' }}
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleDownload}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            ⬇ Tải Ảnh Thành Tích (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}
