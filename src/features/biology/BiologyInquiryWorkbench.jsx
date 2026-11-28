import React, { useMemo, useState } from 'react';
import { BIOLOGY_MODULES } from './biologyCatalog.js';

const BIO_MISSIONS = {
  'cell-3d': [
    { id: 'c1', tier: 'Cơ bản', q: 'Bào quan nào chỉ có ở tế bào Thực vật giúp tổng hợp chất hữu cơ nhờ năng lượng ánh sáng?', options: ['Ti thể', 'Lục lạp', 'Bộ máy Golgi', 'Lysosome'], answer: 1 },
    { id: 'c2', tier: 'Vận dụng', q: 'Trong tế bào cơ tim hoạt động liên tục, bào quan nào phát triển rất mạnh để cung cấp ATP?', options: ['Ti thể', 'Không bào', 'Lục lạp', 'Thành tế bào'], answer: 0 },
  ],
  photosynthesis: [
    { id: 'p1', tier: 'Cơ bản', q: 'Bước sóng ánh sáng nào cho hiệu suất quang hợp THẤP NHẤT ở thực vật xanh?', options: ['Ánh sáng đỏ', 'Ánh sáng xanh tím', 'Ánh sáng lục', 'Ánh sáng trắng'], answer: 2 },
    { id: 'p2', tier: 'Vận dụng', q: 'Ở 35°C và cường độ sáng cao, nhóm thực vật nào đạt tốc độ tạo O₂ cao hơn rõ rệt?', options: ['Thực vật C3', 'Thực vật C4', 'Bằng nhau hoàn toàn', 'Cả hai đều ngừng quang hợp'], answer: 1 },
  ],
  respiration: [
    { id: 'r1', tier: 'Cơ bản', q: 'Khi không có O₂ (lên men), 1 phân tử Glucose chỉ thu được bao nhiêu ATP ròng?', options: ['2 ATP', '4 ATP', '28 ATP', '32 ATP'], answer: 0 },
    { id: 'r2', tier: 'Vận dụng', q: 'Giai đoạn nào tạo ra lượng ATP lớn nhất (~28 ATP) trong hô hấp hiếu khí?', options: ['Đường phân', 'Oxi hóa Pyruvate', 'Chu trình Krebs', 'Chuỗi truyền electron & hóa thẩm'], answer: 3 },
  ],
  'dna-3d': [
    { id: 'd1', tier: 'Cơ bản', q: 'Trong phân tử DNA mạch kép, cặp nucleotide G–C liên kết với nhau bằng bao nhiêu liên kết hydrogen?', options: ['1 liên kết H', '2 liên kết H', '3 liên kết H', '4 liên kết H'], answer: 2 },
    { id: 'd2', tier: 'Vận dụng', q: 'Từ 1 phân tử DNA ban đầu nhân đôi liên tiếp 3 lần tạo ra bao nhiêu phân tử DNA con có 2 mạch hoàn toàn mới?', options: ['2', '6', '8', '4'], answer: 1 },
  ],
  mendel: [
    { id: 'm1', tier: 'Cơ bản', q: 'Phép lai AaBb × AaBb (phân li độc lập, trội hoàn toàn) cho bao nhiêu tổ hợp giao tử ở F₂?', options: ['4', '8', '9', '16'], answer: 3 },
    { id: 'm2', tier: 'Vận dụng', q: 'Tỉ lệ kiểu hình lặn về cả hai tính trạng (aabb) trong phép lai AaBb × AaBb là:', options: ['9/16', '3/16', '1/16', '1/4'], answer: 2 },
  ],
  'gel-dna': [
    { id: 'g1', tier: 'Cơ bản', q: 'Trong điện di gel agarose, các đoạn DNA di chuyển về cực nào?', options: ['Cực âm (−)', 'Cực dương (+)', 'Đứng yên ở giếng', 'Chạy luân phiên 2 cực'], answer: 1 },
    { id: 'g2', tier: 'Vận dụng', q: 'Đoạn DNA 500 bp và đoạn 4000 bp cùng chạy trong 1 giếng gel — băng nào nằm gần cực dương (+) hơn?', options: ['Đoạn 500 bp', 'Đoạn 4000 bp', 'Nằm trùng nhau', 'Không xác định được'], answer: 0 },
  ],
  'epidemic-sir': [
    { id: 's1', tier: 'Cơ bản', q: 'Nếu hệ số lây nhiễm cơ bản R₀ = 4, ngưỡng miễn dịch cộng đồng cần đạt tối thiểu là bao nhiêu?', options: ['25%', '50%', '75%', '90%'], answer: 2 },
  ],
};

/**
 * BiologyInquiryWorkbench — Trạm Thực nghiệm & Báo cáo Khoa học CER (Bio-Studio 2.0)
 */
export default function BiologyInquiryWorkbench({ simId, onAskAI }) {
  const mod = useMemo(() => BIOLOGY_MODULES.find((m) => m.id === simId) || BIOLOGY_MODULES[0], [simId]);
  const missions = BIO_MISSIONS[simId] || [
    {
      id: `${simId}_m1`,
      tier: 'Thực hành',
      q: `Khi thay đổi thông số chính trong mô phỏng "${mod.label}", nguyên tắc thực nghiệm chuẩn (Fair Test) yêu cầu điều gì?`,
      options: [
        'Thay đổi đồng thời tất cả thông số cùng lúc',
        'Chỉ thay đổi 1 biến độc lập và giữ cố định các biến kiểm soát còn lại',
        'Không cần ghi chép số liệu đối chứng',
        'Chỉ chạy duy nhất 1 lần đo',
      ],
      answer: 1,
    },
  ];

  const [picked, setPicked] = useState({});
  const [claim, setClaim] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [cerScore, setCerScore] = useState(null);

  const correctCount = missions.filter((m) => picked[m.id] === m.answer).length;
  const answeredCount = missions.filter((m) => picked[m.id] !== undefined).length;

  const claimReady = claim.trim().length >= 25;
  const evidenceReady = evidence.trim().length >= 25;
  const reasoningReady = reasoning.trim().length >= 30;

  const gradeCer = () => {
    let score = 0;
    const feedback = [];
    if (claimReady) score += 3.5;
    else feedback.push('Khẳng định (Claim) cần nêu rõ kết luận khoa học (≥ 25 ký tự).');
    if (evidenceReady) score += 3.5;
    else feedback.push('Bằng chứng (Evidence) cần dẫn số liệu/hiện tượng quan sát trực tiếp từ mô phỏng.');
    if (reasoningReady) score += 3.0;
    else feedback.push('Lập luận (Reasoning) cần giải thích cơ chế Sinh học chuẩn GDPT 2018.');
    const finalScore = Math.round(score * 10) / 10;
    const rank = finalScore >= 9 ? 'Xuất sắc' : finalScore >= 6.5 ? 'Đạt chuẩn' : 'Cần bổ sung';
    setCerScore({ score: finalScore, rank, feedback });
  };

  const fillTemplate = () => {
    setClaim(`Qua mô phỏng ${mod.label}, khi thay đổi yếu tố điều khiển chính thì kết quả sinh học biến thiên rõ rệt theo quy luật.`);
    setEvidence('Quan sát trực tiếp trên biểu đồ/mô hình 3D, số liệu đo thay đổi rõ rệt giữa trạng thái chuẩn và trạng thái thay đổi biến độc lập.');
    setReasoning(`Theo kiến thức ${mod.grade} (GDPT 2018), cơ chế sinh học bên trong quyết định chiều hướng đáp ứng của hệ thống sống.`);
  };

  return (
    <section className="bl-workbench">
      <div className="bl-wb-col">
        <div className="bl-wb-head">
          <div>
            <h3>Nhiệm vụ Kiểm chứng Thực nghiệm</h3>
            <small className="bl-wb-sub">
              Đúng {correctCount}/{missions.length} câu · Đã trả lời {answeredCount}/{missions.length}
            </small>
          </div>
          <span className="bl-pill-soft">{mod.grade}</span>
        </div>

        <div className="bl-mission-list">
          {missions.map((ms, idx) => {
            const chosen = picked[ms.id];
            const isCorrect = chosen === ms.answer;
            return (
              <div key={ms.id} className="bl-mission-card">
                <div className="bl-mission-top">
                  <span className="bl-tier">{ms.tier}</span>
                  <strong>Câu {idx + 1}: {ms.q}</strong>
                </div>
                <div className="bl-mission-opts">
                  {ms.options.map((opt, oi) => {
                    const cls =
                      chosen === undefined
                        ? ''
                        : oi === ms.answer
                          ? 'is-ok'
                          : chosen === oi
                            ? 'is-bad'
                            : '';
                    return (
                      <button
                        key={oi}
                        type="button"
                        className={`bl-mission-opt ${cls}`}
                        onClick={() => setPicked((p) => ({ ...p, [ms.id]: oi }))}
                      >
                        <span className="bl-opt-letter">{'ABCD'[oi]}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {chosen !== undefined && (
                  <p className={`bl-mission-res ${isCorrect ? 'ok' : 'bad'}`}>
                    {isCorrect
                      ? '✓ Chính xác! Bạn đã nắm vững bản chất thí nghiệm.'
                      : `✕ Chưa đúng — đáp án chuẩn là ${'ABCD'[ms.answer]}. Hãy thử kéo lại tham số trên mô phỏng để kiểm chứng!`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bl-wb-col">
        <div className="bl-wb-head">
          <div>
            <h3>Báo cáo Khoa học CER</h3>
            <small className="bl-wb-sub">Claim (3.5đ) · Evidence (3.5đ) · Reasoning (3.0đ)</small>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="bl-mini-btn" onClick={fillTemplate}>
              Gợi ý khung viết
            </button>
            {onAskAI && (
              <button
                type="button"
                className="bl-mini-btn primary"
                onClick={() =>
                  onAskAI(
                    `Hãy giải thích sâu bản chất khoa học và các câu hỏi trắc nghiệm hay ra thi THPT về chủ đề "${mod.label}" (${mod.grade}). Gợi ý thêm 1 thí nghiệm kiểm chứng bằng mô phỏng.`
                  )
                }
              >
                Hỏi Bé ELEC AI
              </button>
            )}
          </div>
        </div>

        {/* 3 thanh chỉ báo đạt chuẩn trực tiếp */}
        <div className="bl-cer-meters">
          <span className={`bl-cer-meter${claimReady ? ' ok' : ''}`}>
            {claimReady ? '✓' : '○'} Claim ({claim.trim().length}/25)
          </span>
          <span className={`bl-cer-meter${evidenceReady ? ' ok' : ''}`}>
            {evidenceReady ? '✓' : '○'} Evidence ({evidence.trim().length}/25)
          </span>
          <span className={`bl-cer-meter${reasoningReady ? ' ok' : ''}`}>
            {reasoningReady ? '✓' : '○'} Reasoning ({reasoning.trim().length}/30)
          </span>
        </div>

        <div className="bl-cer-form">
          <label>
            <span>1. Khẳng định (Claim)</span>
            <textarea
              rows={2}
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder={`Nêu quy luật rút ra từ mô phỏng ${mod.label}...`}
            />
          </label>
          <label>
            <span>2. Bằng chứng số liệu (Evidence)</span>
            <textarea
              rows={2}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Ghi lại số liệu, tỉ lệ hoặc hình ảnh bạn quan sát được khi thay đổi biến..."
            />
          </label>
          <label>
            <span>3. Lập luận Sinh học (Reasoning)</span>
            <textarea
              rows={2}
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Liên hệ kiến thức SGK GDPT 2018 để giải thích vì sao hiện tượng xảy ra..."
            />
          </label>
          <div className="bl-cer-actions">
            <button type="button" className="bl-btn primary" onClick={gradeCer}>
              Chấm điểm Báo cáo CER (Thang 10)
            </button>
            {cerScore && (
              <div className="bl-cer-score-pill">
                <span>Điểm CER:</span>
                <strong>{cerScore.score}/10</strong>
                <em>{cerScore.rank}</em>
              </div>
            )}
          </div>
          {cerScore?.feedback?.length > 0 && (
            <ul className="bl-cer-tips">
              {cerScore.feedback.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
