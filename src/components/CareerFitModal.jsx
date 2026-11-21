/* ============================================================
   CareerFitModal.jsx — Định Hướng Ngành & Trường AI (Holland RIASEC)
   - Giao diện Dark Cosmos chuẩn Editorial Design (sang và khoa học hơn Thần số học)
   - 6 câu trắc nghiệm nhanh 1 chạm (30 giây) -> mã Holland 3 ký tự (VD: I-R-C)
   - Kết hợp điểm năng lực thật (/30) để tính % Độ hợp ngành trên CUTOFF_DATA
   - 1 chạm "Ghim làm NV1" hoặc "Nhờ AI lập lộ trình vào ngành này"
   ============================================================ */
import React, { useMemo, useState } from 'react';
import { CUTOFF_DATA } from '../data/uniCutoffs.js';
import { computeRiasecCareerMatches } from '../lib/studentAnalytics.js';
import { askAI as openAiTutor } from './HomePlus.jsx';
import '../styles/student-v9-upgrades.css';

const RIASEC_META = {
  R: { name: 'Kỹ thuật – Thực tế', desc: 'Thích máy móc, thí nghiệm thực hành, chế tạo và hệ thống kỹ thuật.' },
  I: { name: 'Nghiên cứu – Phân tích', desc: 'Tư duy logic sâu, yêu khoa học tự nhiên, dữ liệu, y sinh và giải mã bản chất.' },
  A: { name: 'Sáng tạo – Thiết kế', desc: 'Giàu trực giác thẩm mỹ, thích đổi mới cách biểu đạt và giải pháp khác biệt.' },
  S: { name: 'Xã hội – Chăm sóc', desc: 'Thích kết nối, giảng dạy, chăm sóc sức khỏe và tạo ảnh hưởng tích cực cho cộng đồng.' },
  E: { name: 'Quản trị – Kinh doanh', desc: 'Tố chất dẫn dắt, thuyết phục, chiến lược thị trường và ra quyết định nhanh.' },
  C: { name: 'Nghiệp vụ – Hệ thống', desc: 'Cẩn trọng, chuẩn xác với con số, quy trình tài chính – kế toán – dữ liệu.' },
};

const QUESTIONS = [
  {
    q: 'Khi đứng trước một bài toán hoặc dự án mới, điều gì khiến bạn hứng thú nhất?',
    options: [
      { label: 'Tìm hiểu bản chất khoa học, chứng minh công thức và phân tích dữ liệu', weights: { I: 3, R: 1 } },
      { label: 'Lắp ráp, lập trình hoặc tạo ra một sản phẩm chạy được ngay', weights: { R: 3, I: 1 } },
      { label: 'Lập kế hoạch kinh doanh, dẫn dắt nhóm và tối ưu hiệu quả', weights: { E: 3, C: 1 } },
      { label: 'Hướng dẫn bạn bè, chăm sóc sức khỏe hoặc giải quyết vấn đề con người', weights: { S: 3, A: 1 } },
    ],
  },
  {
    q: 'Môi trường làm việc trong mơ sau khi tốt nghiệp của bạn là gì?',
    options: [
      { label: 'Phòng Lab công nghệ cao, bệnh viện tuyến đầu hoặc viện nghiên cứu', weights: { I: 3, S: 2 } },
      { label: 'Tập đoàn công nghệ, xưởng kỹ thuật tự động hóa hoặc trung tâm AI', weights: { R: 3, I: 2 } },
      { label: 'Tổ chức tài chính, doanh nghiệp đa quốc gia hoặc startup năng động', weights: { E: 3, C: 2 } },
      { label: 'Trường học, cơ quan ngoại giao, luật hoặc studio sáng tạo nội dung', weights: { S: 2, A: 2, E: 1 } },
    ],
  },
  {
    q: 'Trong các môn học ở trường, nhóm môn nào bạn cảm thấy tự tin nhất?',
    options: [
      { label: 'Toán – Vật lí – Tin học (tư duy mô hình và kỹ thuật)', weights: { R: 2, I: 3 } },
      { label: 'Hóa học – Sinh học (thí nghiệm, phản ứng và khoa học sự sống)', weights: { I: 3, S: 2 } },
      { label: 'Toán – Tiếng Anh – Kinh tế pháp luật', weights: { E: 3, C: 2 } },
      { label: 'Ngữ văn – Ngoại ngữ – Tranh biện & thuyết trình', weights: { A: 2, S: 2, E: 2 } },
    ],
  },
  {
    q: 'Điểm mạnh nổi bật nhất của bạn khi ôn thi là gì?',
    options: [
      { label: 'Cẩn thận từng chi tiết, tính toán chính xác, ít sai sót quy trình', weights: { C: 3, I: 1 } },
      { label: 'Nhạy bén suy luận câu khó, thích đào sâu bản chất vấn đề', weights: { I: 3, R: 1 } },
      { label: 'Truyền đạt dễ hiểu, hay giảng lại bài cho bạn cùng lớp', weights: { S: 3, A: 1 } },
      { label: 'Quyết đoán, biết chọn chiến lược ôn thi tối ưu điểm số', weights: { E: 3, R: 1 } },
    ],
  },
  {
    q: 'Bạn muốn công việc tương lai tạo ra giá trị nào lớn nhất?',
    options: [
      { label: 'Cứu chữa bệnh nhân, bảo vệ sức khỏe và nâng cao chất lượng sống', weights: { S: 3, I: 2 } },
      { label: 'Phát minh công nghệ, tối ưu năng lượng, vật liệu hoặc phần mềm', weights: { R: 3, I: 2 } },
      { label: 'Tạo dựng doanh nghiệp, quản lý dòng vốn và phát triển kinh tế', weights: { E: 3, C: 2 } },
      { label: 'Xây dựng luật pháp công bằng, kết nối quốc tế và giáo dục thế hệ mới', weights: { S: 2, E: 2, A: 2 } },
    ],
  },
  {
    q: 'Khi có thời gian rảnh, bạn thường thích đọc hoặc xem nội dung gì?',
    options: [
      { label: 'Khoa học khám phá, y học, hóa sinh hoặc giải thích hiện tượng tự nhiên', weights: { I: 3, S: 1 } },
      { label: 'Đồ công nghệ, lập trình, kỹ thuật cơ khí hoặc xe điện/AI', weights: { R: 3, C: 1 } },
      { label: 'Khởi nghiệp, đầu tư tài chính, kinh tế thế giới', weights: { E: 3, C: 2 } },
      { label: 'Tâm lý học, kỹ năng giao tiếp, nghệ thuật hoặc ngôn ngữ', weights: { A: 3, S: 2 } },
    ],
  },
];

export default function CareerFitModal({
  open,
  onClose,
  predictedScore30 = null,
  onPinTarget,
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);

  const result = useMemo(() => {
    if (answers.length < QUESTIONS.length) return null;
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    answers.forEach((optIdx, qIdx) => {
      const weights = QUESTIONS[qIdx]?.options?.[optIdx]?.weights || {};
      Object.entries(weights).forEach(([k, v]) => {
        scores[k] = (scores[k] || 0) + v;
      });
    });
    return {
      scores,
      ...computeRiasecCareerMatches({
        riasecScores: scores,
        cutoffData: CUTOFF_DATA,
        predictedScore30,
      }),
    };
  }, [answers, predictedScore30]);

  if (!open) return null;

  const pickOption = (optIdx) => {
    const next = [...answers];
    next[step] = optIdx;
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
    }
  };

  const restart = () => {
    setAnswers([]);
    setStep(0);
  };

  const progressPct = Math.round(((result ? QUESTIONS.length : step) / QUESTIONS.length) * 100);

  return (
    <div className="s9-cf-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="s9-cf-modal" role="dialog" aria-label="Định hướng ngành và trường AI chuẩn Holland RIASEC">
        <header className="s9-cf-head">
          <div>
            <span className="s9-cf-eyebrow">ĐỊNH HƯỚNG NGÀNH NGHỀ KHOA HỌC · HOLLAND RIASEC × AI</span>
            <h3>Khám phá Ngành &amp; Trường Đại học hợp nhất với bạn</h3>
          </div>
          <button type="button" className="s9-cf-close" onClick={onClose} aria-label="Đóng">✕</button>
        </header>

        <div className="s9-cf-progress">
          <i style={{ width: `${progressPct}%` }} />
        </div>

        {!result ? (
          <div className="s9-cf-body">
            <div className="s9-cf-step-meta">
              <span>Câu hỏi {step + 1} / {QUESTIONS.length}</span>
              {predictedScore30 != null && (
                <span>Đang đối chiếu với điểm dự đoán <b>{predictedScore30}/30</b></span>
              )}
            </div>
            <h4 className="s9-cf-q">{QUESTIONS[step].q}</h4>
            <div className="s9-cf-opts">
              {QUESTIONS[step].options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="s9-cf-opt"
                  onClick={() => pickOption(idx)}
                >
                  <span className="s9-cf-opt-key">{String.fromCharCode(65 + idx)}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {step > 0 && (
              <button type="button" className="s9-cf-back" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                ← Quay lại câu trước
              </button>
            )}
          </div>
        ) : (
          <div className="s9-cf-result">
            <div className="s9-cf-code-banner">
              <div className="s9-cf-code-pill">{result.hollandCode}</div>
              <div>
                <strong>Nhóm tố chất nổi bật: {RIASEC_META[result.topCodes[0]]?.name}</strong>
                <p>{RIASEC_META[result.topCodes[0]]?.desc}</p>
              </div>
            </div>

            <div className="s9-cf-matches">
              {result.matches.slice(0, 4).map((m, idx) => (
                <article key={m.id} className="s9-cf-match-row">
                  <div className="s9-cf-fit-ring">
                    <b>{m.fitPct}%</b>
                    <span>Hợp</span>
                  </div>
                  <div className="s9-cf-match-info">
                    <div className="s9-cf-match-top">
                      <strong>#{idx + 1} {m.major}</strong>
                      <span className="s9-cf-uni-code">{m.code}</span>
                    </div>
                    <p>{m.uni} · Khối {m.combo} · Chuẩn tham khảo {m.s2025 ?? m.s2024 ?? '--'}</p>
                  </div>
                  <div className="s9-cf-match-actions">
                    {onPinTarget && (
                      <button
                        type="button"
                        className="s9-cf-pin-btn"
                        onClick={() => {
                          onPinTarget(m);
                          onClose?.();
                        }}
                      >
                        Ghim NV1
                      </button>
                    )}
                    <button
                      type="button"
                      className="s9-cf-ai-btn"
                      onClick={() => {
                        onClose?.();
                        openAiTutor(
                          `Mình vừa làm trắc nghiệm định hướng Holland RIASEC (mã ${result.hollandCode}), độ hợp ${m.fitPct}% với ngành ${m.major} — ${m.uni} (khối ${m.combo}, điểm chuẩn tham khảo ${m.s2025 ?? m.s2024 ?? ''}). Hãy tư vấn chi tiết: triển vọng nghề nghiệp 5 năm tới, điểm mạnh cần có và lộ trình ôn thi THPTQG để đỗ ngành này.`
                        );
                      }}
                    >
                      Hỏi AI →
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="s9-cf-foot">
              <button type="button" className="s9-cf-back" onClick={restart}>Làm lại bài trắc nghiệm</button>
              <button type="button" className="s9-cf-done" onClick={onClose}>Hoàn tất</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
