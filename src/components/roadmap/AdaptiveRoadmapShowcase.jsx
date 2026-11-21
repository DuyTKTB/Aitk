/* ============================================================
   AdaptiveRoadmapShowcase.jsx — HỆ THỐNG LỘ TRÌNH ADAPTIVE LEARNING KHTN
   ------------------------------------------------------------
   Lấy cảm hứng từ kiến trúc lộ trình Adaptive Learning & Band Roadmap
   hàng đầu (The IELTS Dictionary / Duolingo / Riiid), bản địa hóa sâu
   cho 3 môn Khoa học Tự nhiên THPT Việt Nam (Vật lí · Hóa học · Sinh học)
   theo cấu trúc Đề thi Tốt nghiệp THPT 2026 (28 câu / 3 phần):
     1. 01 LỘ TRÌNH 4 CHẶNG MỐC ĐIỂM (3.5→5.5 | 5.5→7.0 | 7.0→8.5 | 8.5→9.75+)
        kèm Bảng quy đổi số câu đúng (trên 28 câu) & Modal chi tiết Trước/Sau chặng.
     2. 02 HÔM NAY HỌC GÌ — CƠ CHẾ ADAPTIVE 60 / 20 / 20
        (60% Vá lỗ hổng · 20% Duy trì nền tảng · 20% Thử thách vùng hiệu quả 65-75%).
     3. 03 BẢN ĐỒ 136 MICRO-SKILL KHTN (Vật lí 44 · Hóa học 48 · Sinh học 44)
        với nhãn chẩn đoán trực tiếp: "✓ Làm được" · "⚡ Đang luyện" · "✗ Hỏng ở đây".
     4. 04 CHU KÌ ÔN NGẮT QUÃNG SRS (1 ngày · 3 ngày · 7 ngày · 14 ngày).
   ============================================================ */

import { useMemo, useState } from 'react';

const STAGES = [
  {
    id: 'stage-1',
    num: '01',
    code: 'FOUNDATION',
    range: '3.5 → 5.5đ',
    rawQuestions: '8 – 15 / 28 câu đúng',
    minScore: 0,
    maxScore: 5.5,
    eloRange: '< 1150 Elo',
    duration: '~3 – 4 tuần · 30p/ngày',
    accent: '#0284c7',
    bgTint: 'rgba(2, 132, 199, 0.08)',
    title: 'Nền tảng SGK & Nhận biết chuẩn GDPT 2026',
    subtitle: 'Xây gốc khái niệm, đơn vị SI, công thức cốt lõi — chưa vội giải đề tổng hợp.',
    beforeList: [
      'Hay nhầm đơn vị cơ bản (cm với m, mL với L, Å với nm) và quên điều kiện chuẩn đkc 24,79 L/mol.',
      'Đọc đề Phần II (Đúng/Sai 4 ý) bị rối, chưa phân biệt được mệnh đề lý thuyết gốc.',
      'Chưa nắm chắc bảng tuần hoàn, cấu trúc DNA/Operon Lac, dao động điều hòa cơ bản.',
    ],
    afterList: [
      'Ăn chắc 14 – 16/18 câu Phần I (Trắc nghiệm 4 lựa chọn) ở cả Vật lí, Hóa học, Sinh học.',
      'Nắm vững 100% công thức nền tảng SGK Lớp 10 – 11 – 12 và quy tắc đổi đơn vị SI.',
      'Tự tin xử lý các ý a), b) nhận biết – thông hiểu trong Phần II (Đúng/Sai).',
    ],
    todoSummary: 'Tập trung học Lý thuyết + Flashcard công thức + Luyện từng bài lẻ 10 câu (chưa bấm giờ đề 50 phút).',
    focusTopics: [
      { label: 'Dao động điều hòa & Sóng cơ', chapterId: 'ly-c1-donghoc', subject: 'ly' },
      { label: 'Cấu tạo nguyên tử & Liên kết hóa học', chapterId: 'c10-atom', subject: 'hoa' },
      { label: 'Tế bào học, DNA, Phiên mã & Dịch mã', chapterId: 'sinh-c1-phantu', subject: 'sinh' },
    ],
  },
  {
    id: 'stage-2',
    num: '02',
    code: 'CORE MASTERY',
    range: '5.5 → 7.0đ',
    rawQuestions: '16 – 20 / 28 câu đúng',
    minScore: 5.5,
    maxScore: 7.0,
    eloRange: '1150 – 1380 Elo',
    duration: '~4 – 6 tuần · 40p/ngày',
    accent: '#d97706',
    bgTint: 'rgba(217, 119, 6, 0.08)',
    title: 'Làm chủ Dạng bài Chuẩn & Bảo toàn trọng tâm',
    subtitle: 'Chuyển từ học thuộc công thức sang giải nhanh bằng định luật bảo toàn & quy luật di truyền.',
    beforeList: [
      'Giải được bài cơ bản nhưng mất quá nhiều thời gian viết phương trình dài dòng.',
      'Hay mất điểm ở ý c) Phần II (Đúng/Sai) do mắc bẫy chất dư – chất hết hoặc bẫy Operon Lac / quy luật Mendel.',
      'Bỏ trống nhiều câu Phần III (Trả lời ngắn) vì tính toán số học hay sai số.',
    ],
    afterList: [
      'Xử lý gọn 18/18 câu Phần I trong vòng 15 phút đầu tiên của giờ thi.',
      'Đạt tối thiểu 2 – 3 ý đúng mỗi câu Phần II (Đúng/Sai) nhờ nắm chắc bản chất thí nghiệm.',
      'Giải đúng 3 – 4/6 câu Phần III (Trả lời ngắn): bảo toàn e, mạch RLC, quần thể tự thụ & Hardy–Weinberg.',
    ],
    todoSummary: 'Áp dụng công thức 60% vá chuyên đề yếu + 20% ôn Sổ lỗi sai + 20% bài vận dụng có bấm giờ.',
    focusTopics: [
      { label: 'Dòng điện xoay chiều RLC & Quang điện', chapterId: 'ly-c1-donghoc', subject: 'ly' },
      { label: 'Ester – Lipid, Phản ứng Oxi hóa khử & Điện phân', chapterId: 'c10-redox', subject: 'hoa' },
      { label: 'Quy luật Mendel, Tương tác gene & Operon Lac', chapterId: 'sinh-c2-ditruyen', subject: 'sinh' },
    ],
  },
  {
    id: 'stage-3',
    num: '03',
    code: 'BREAKTHROUGH',
    range: '7.0 → 8.5đ',
    rawQuestions: '21 – 24 / 28 câu đúng',
    minScore: 7.0,
    maxScore: 8.5,
    eloRange: '1380 – 1600 Elo',
    duration: '~5 – 6 tuần · 45p/ngày',
    accent: '#059669',
    bgTint: 'rgba(5, 150, 105, 0.08)',
    title: 'Bứt phá Đúng/Sai 4 ý (Phần II) & Trả lời ngắn (Phần III)',
    subtitle: 'Tối ưu điểm tuyệt đối 1,0đ/câu ở Phần II và điền số chuẩn xác Phần III theo ma trận 2026.',
    beforeList: [
      'Hay bị dừng ở 3/4 ý đúng trong Phần II (chỉ được 0,5đ thay vì 1,0đ khi đúng cả 4 ý!).',
      'Lúng túng trước các bài đọc đồ thị thực nghiệm, sơ đồ phả hệ 2 bệnh, hoán vị gene và hiệu suất sinh thái.',
      'Làm tròn số sai quy ước ở Phần III (Trả lời ngắn 4 ký tự).',
    ],
    afterList: [
      'Ăn trọn 1,0đ ở ít nhất 2 – 3 câu Phần II nhờ kỹ năng soi bẫy mệnh đề d) vận dụng.',
      'Giải mượt các bài toán Phả hệ (tỉ lệ 1/3 AA : 2/3 Aa), Hoán vị gene (Định lý Bàng), Giản đồ Fresnel RLC.',
      'Chạm ngưỡng 8.0 – 8.5đ vững vàng, đủ điểm xét tuyển các trường top Kỹ thuật, Kinh tế, Sư phạm.',
    ],
    todoSummary: 'Cày sâu ngân hàng câu hỏi Đúng/Sai & Trả lời ngắn + Luyện 2 đề chuẩn 28 câu/tuần trong Phòng thi ảo.',
    focusTopics: [
      { label: 'Giản đồ véctơ Fresnel & Hạt nhân nguyên tử', chapterId: 'ly-c1-donghoc', subject: 'ly' },
      { label: 'Kim loại chuyển tiếp, Phức chất & Thủy phân Peptide', chapterId: 'c10-bonding', subject: 'hoa' },
      { label: 'Liên kết - Hoán vị Gene, Phả hệ & Quần thể', chapterId: 'sinh-c3-lienket', subject: 'sinh' },
    ],
  },
  {
    id: 'stage-4',
    num: '04',
    code: 'ELITE 9.0+',
    range: '8.5 → 9.75+đ',
    rawQuestions: '25 – 28 / 28 câu đúng',
    minScore: 8.5,
    maxScore: 10,
    eloRange: '1600+ Elo',
    duration: '~4 – 6 tuần · 50p/ngày',
    accent: '#2563eb',
    bgTint: 'rgba(37, 99, 235, 0.09)',
    badge: 'Mục tiêu Top đầu',
    title: 'Thực chiến Vận dụng cao & Chống sai ngu tuyệt đối',
    subtitle: 'Bản lĩnh giải đề 50 phút chuẩn ĐH Y Hà Nội, Bách Khoa, ĐHQG, Khối Công an – Quân đội.',
    beforeList: [
      'Đã nắm vững kiến thức nhưng vẫn mất 0,25 – 0,5đ đáng tiếc do đọc lướt bẫy câu chữ dưới áp lực thời gian.',
      'Tốn quá 4 phút cho 1 câu vận dụng cao khiến không kịp rà soát lại 24 câu đầu.',
    ],
    afterList: [
      'Chiến thuật phân bổ 50 phút: 12p Phần I + 18p Phần II + 15p Phần III + 5p kiểm tra chéo.',
      'Miễn nhiễm 100% với 10 bẫy kinh điển trong Đề chính thức THPT 2026 & Đề trường Chuyên.',
      'Điểm thực chiến ổn định ≥ 9.0 – 9.75đ, tự tin đỗ Nguyện vọng 1.',
    ],
    todoSummary: 'Luyện đề chính thức 2026 (MĐ 0435, Chuyên KHTN, Chuyên AMS) + Dùng AI DeepThink mổ xẻ từng câu sai.',
    focusTopics: [
      { label: 'Tổ hợp Cơ - Điện - Quang thực nghiệm nâng cao', chapterId: 'ly-c1-donghoc', subject: 'ly' },
      { label: 'Bài toán tổng hợp Hữu cơ – Điện phân thực tiễn', chapterId: 'c10-energy', subject: 'hoa' },
      { label: 'Tích hợp Phả hệ - Quần thể - Sinh thái & Đề 2026', chapterId: 'sinh-c6-ditruyen-nguoi', subject: 'sinh' },
    ],
  },
];

const MICRO_SKILL_GROUPS = [
  {
    id: 'ly',
    name: 'Vật lí THPT',
    totalCount: 44,
    accent: '#2563eb',
    sublabel: 'Cơ · Nhiệt · Điện · Quang · Hạt nhân',
    skills: [
      { id: 'ly-s1', label: 'Đổi đơn vị SI & Thứ nguyên', chapterId: 'ly-c1-donghoc' },
      { id: 'ly-s2', label: 'Đường tròn lượng giác Dao động', chapterId: 'ly-c1-donghoc' },
      { id: 'ly-s3', label: 'Giao thoa sóng & Sóng dừng', chapterId: 'ly-c1-donghoc' },
      { id: 'ly-s4', label: 'Giản đồ Fresnel mạch RLC', chapterId: 'ly-c1-donghoc' },
      { id: 'ly-s5', label: 'Cộng hưởng điện & Hệ số cosφ', chapterId: 'ly-c1-donghoc' },
      { id: 'ly-s6', label: 'Phương trình quang điện Einstein', chapterId: 'ly-c1-donghoc' },
      { id: 'ly-s7', label: 'Định luật phóng xạ 2^(-t/T)', chapterId: 'ly-c1-donghoc' },
      { id: 'ly-s8', label: 'Khí lý tưởng pV = nRT', chapterId: 'ly-c1-donghoc' },
    ],
  },
  {
    id: 'hoa',
    name: 'Hóa học THPT',
    totalCount: 48,
    accent: '#7c3aed',
    sublabel: 'Đại cương · Vô cơ · Hữu cơ · Điện hóa',
    skills: [
      { id: 'hoa-s1', label: 'Cấu hình e & Bảng tuần hoàn', chapterId: 'c10-atom' },
      { id: 'hoa-s2', label: 'Bảo toàn electron Oxi hóa - Khử', chapterId: 'c10-redox' },
      { id: 'hoa-s3', label: 'Biến thiên Enthalpy ΔrH°298', chapterId: 'c10-energy' },
      { id: 'hoa-s4', label: 'Cân bằng hóa học & pH dung dịch', chapterId: 'c10-rate' },
      { id: 'hoa-s5', label: 'Thủy phân Ester – chất béo', chapterId: 'c10-bonding' },
      { id: 'hoa-s6', label: 'Carbohydrate, Amine & Peptide', chapterId: 'c10-bonding' },
      { id: 'hoa-s7', label: 'Pin Galvani & Định luật Faraday', chapterId: 'c10-redox' },
      { id: 'hoa-s8', label: 'Kim loại IA, IIA, Fe, Cu & Phức chất', chapterId: 'c10-periodic' },
    ],
  },
  {
    id: 'sinh',
    name: 'Sinh học THPT (Bộ học liệu ELEC AI)',
    totalCount: 44,
    accent: '#059669',
    sublabel: 'Sinh 10 · Sinh 11 · Sinh 12 · Đề 2026',
    skills: [
      { id: 'sinh-s1', label: 'Tái bản DNA, Phiên mã & Dịch mã', chapterId: 'sinh-c1-phantu' },
      { id: 'sinh-s2', label: 'Điều hòa biểu hiện gene Operon Lac', chapterId: 'sinh-c1-phantu' },
      { id: 'sinh-s3', label: 'Đột biến điểm (5-BU) & Công nghệ Gene', chapterId: 'sinh-c1-phantu' },
      { id: 'sinh-s4', label: 'Siêu cấu trúc NST & Không phân li GP I/II', chapterId: 'sinh-c1-tebao' },
      { id: 'sinh-s5', label: 'Quy luật Mendel & Tương tác 9:7, 9:6:1', chapterId: 'sinh-c2-ditruyen' },
      { id: 'sinh-s6', label: 'Hoán vị Gene Morgan & Định lý Bàng', chapterId: 'sinh-c3-lienket' },
      { id: 'sinh-s7', label: 'Phả hệ người (Bẫy 1/3 AA : 2/3 Aa)', chapterId: 'sinh-c6-ditruyen-nguoi' },
      { id: 'sinh-s8', label: 'Tự thụ phấn, Hardy–Weinberg & Hiệu suất sinh thái', chapterId: 'sinh-c4-quanthe' },
    ],
  },
];

export function SpacedRepetitionMilestones({ dueTotal = 0, cardsDue = 0, wrongCount = 0, onTriggerReview }) {
  const milestones = [
    {
      stage: 'LẦN ÔN 1',
      day: 'Sau 1 ngày',
      desc: 'Chặn đứng đường cong quên Ebbinghaus ngay sau khi vừa phát hiện câu sai.',
      count: Math.max(dueTotal > 0 ? Math.ceil(dueTotal * 0.45) : 0, wrongCount > 0 ? 1 : 0),
      color: '#d97706',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      stage: 'LẦN ÔN 2',
      day: 'Sau 3 ngày',
      desc: 'Kích hoạt trí nhớ truy xuất chủ động (Active Recall) với biến thể đổi số liệu.',
      count: dueTotal > 1 ? Math.floor(dueTotal * 0.3) : 0,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
    },
    {
      stage: 'LẦN ÔN 3',
      day: 'Sau 7 ngày',
      desc: 'Củng cố phản xạ giải nhanh dưới 45 giây và nhận diện bẫy mệnh đề Đúng/Sai.',
      count: cardsDue > 0 ? Math.ceil(cardsDue * 0.6) : 0,
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.1)',
    },
    {
      stage: 'LẦN ÔN 4',
      day: 'Sau 14 ngày',
      desc: 'Chuyển kiến thức vào trí nhớ dài hạn bền vững đến tận ngày thi THPTQG.',
      count: cardsDue > 1 ? Math.floor(cardsDue * 0.4) : 0,
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.1)',
    },
  ];

  return (
    <div className="tid-srs-strip" role="region" aria-label="Chu kì ôn ngắt quãng Spaced Repetition 1 - 3 - 7 - 14 ngày">
      <div className="tid-srs-head">
        <div>
          <span className="tid-eyebrow-badge">04 · CƠ CHẾ SPACED REPETITION (1 – 3 – 7 – 14 NGÀY)</span>
          <h4>Chu kì 4 lần nhắc ôn chống quên tự động</h4>
        </div>
        <span className="tid-srs-sub">Làm đúng liên tiếp 4 chu kì → Chuyên đề chuyển sang trạng thái Đã vững</span>
      </div>
      <div className="tid-srs-grid">
        {milestones.map((m) => (
          <div
            key={m.stage}
            className="tid-srs-card"
            style={{ '--srs-accent': m.color, '--srs-bg': m.bg }}
            onClick={() => onTriggerReview?.()}
            role="button"
            tabIndex={0}
          >
            <div className="tid-srs-card-top">
              <span className="tid-srs-stage">{m.stage}</span>
              <span className="tid-srs-count">{m.count > 0 ? `${m.count} mục` : 'Sẵn sàng'}</span>
            </div>
            <strong className="tid-srs-day">{m.day}</strong>
            <p className="tid-srs-desc">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdaptiveRoadmapShowcase({
  predictedScore10 = 5.5,
  targetScore10 = 8.5,
  elo = 1150,
  chapters = [],
  dueTotal = 0,
  cardsDue = 0,
  primaryAction = null,
  onOpenChapter,
  onPracticeChapter,
  onReviewChapter,
  onTabSelect,
}) {
  const [selectedStage, setSelectedStage] = useState(null);
  const [activeSkillSubject, setActiveSkillSubject] = useState('all');

  const currentStageIndex = useMemo(() => {
    const s = Number.isFinite(predictedScore10) ? predictedScore10 : 5.5;
    if (s < 5.5) return 0;
    if (s < 7.0) return 1;
    if (s < 8.5) return 2;
    return 3;
  }, [predictedScore10]);

  // Tính trạng thái từng micro-skill dựa trên dữ liệu thực của chương tương ứng
  const chapterStatusMap = useMemo(() => {
    const map = new Map();
    for (const c of chapters) {
      const id = c?.chapter?.id;
      if (!id) continue;
      const ans = c?.summary?.answers || c?.answers || 0;
      const acc = c?.mastery?.score ?? c?.accuracyPct ?? 0;
      if (ans >= 5 && acc >= 75) map.set(id, 'mastered');
      else if (ans > 0 && acc < 60) map.set(id, 'weak');
      else if (ans > 0) map.set(id, 'learning');
    }
    return map;
  }, [chapters]);

  // 3 nhiệm vụ "Hôm nay học gì" theo tỷ lệ vàng 60 / 20 / 20
  const weakChapter = useMemo(() => {
    const withErrors = chapters.find((c) => (c?.wrongDue || 0) > 0 || ((c?.summary?.answers || 0) > 0 && (c?.mastery?.score || 0) < 65));
    return withErrors?.chapter || chapters[0]?.chapter || { id: 'sinh-c1-phantu', name: 'Di truyền phân tử: DNA, Phiên mã & Operon Lac' };
  }, [chapters]);

  const maintainChapter = useMemo(() => {
    const practiced = chapters.find((c) => (c?.summary?.answers || 0) > 0 && c.chapter?.id !== weakChapter?.id);
    const fallback = chapters.find((c) => c.chapter?.id && c.chapter.id !== weakChapter?.id);
    return practiced?.chapter || fallback?.chapter || { id: 'ly-c1-donghoc', name: 'Dao động điều hòa & Sóng cơ' };
  }, [chapters, weakChapter]);

  const stretchChapter = useMemo(() => {
    const next = chapters.find(
      (c) => (c?.summary?.answers || 0) === 0
        && c.chapter?.id !== weakChapter?.id
        && c.chapter?.id !== maintainChapter?.id,
    );
    const fallback = chapters.find(
      (c) => c.chapter?.id
        && c.chapter.id !== weakChapter?.id
        && c.chapter.id !== maintainChapter?.id,
    );
    return next?.chapter || fallback?.chapter || { id: 'sinh-c6-ditruyen-nguoi', name: 'Di truyền học Người & Phả hệ nâng cao' };
  }, [chapters, weakChapter, maintainChapter]);

  return (
    <div className="tid-adaptive-wrap">
      {/* ── KHỐI 01: LỘ TRÌNH 4 CHẶNG THEO MỐC ĐIỂM (BẤM ĐỂ XEM CHI TIẾT TRƯỚC / SAU CHẶNG) ── */}
      <div className="tid-section-card">
        <div className="tid-sec-header">
          <div>
            <span className="tid-eyebrow-badge">01 · LỘ TRÌNH 4 CHẶNG THEO MỐC ĐIỂM (ADAPTIVE STAGES)</span>
            <h3>Bốn chặng bứt phá và việc cần làm ở mỗi chặng</h3>
            <p>
              Dưới 7.0đ là giai đoạn <b>tích lũy bản chất &amp; công thức nền</b>; từ 7.0đ trở lên là giai đoạn <b>triệt tiêu bẫy Đúng/Sai (Phần II) &amp; tăng tốc Trả lời ngắn (Phần III)</b>. Bấm vào từng chặng để xem lộ trình chi tiết.
            </p>
          </div>
          <div className="tid-current-stage-pill">
            <span>Chặng hiện tại của bạn:</span>
            <strong>Chặng {STAGES[currentStageIndex].num} ({STAGES[currentStageIndex].range})</strong>
          </div>
        </div>

        <div className="tid-stages-grid">
          {STAGES.map((st, idx) => {
            const isCurrent = idx === currentStageIndex;
            const isPassed = idx < currentStageIndex;
            return (
              <article
                key={st.id}
                className={`tid-stage-card ${isCurrent ? 'is-current' : ''} ${isPassed ? 'is-passed' : ''}`}
                style={{ '--st-accent': st.accent, '--st-tint': st.bgTint }}
                onClick={() => setSelectedStage(st)}
                role="button"
                tabIndex={0}
              >
                <div className="tid-st-head">
                  <span className="tid-st-num">CHẶNG {st.num}</span>
                  {isCurrent ? (
                    <span className="tid-st-status current">Đang ở chặng này</span>
                  ) : isPassed ? (
                    <span className="tid-st-status passed">✓ Đã vượt qua</span>
                  ) : (
                    <span className="tid-st-status upcoming">{st.badge || 'Mục tiêu kế tiếp'}</span>
                  )}
                </div>

                <div className="tid-st-score-band">
                  <strong>{st.range}</strong>
                  <small>{st.rawQuestions}</small>
                </div>

                <h4 className="tid-st-title">{st.title}</h4>
                <p className="tid-st-desc">{st.subtitle}</p>

                <div className="tid-st-meta-row">
                  <span>{st.eloRange}</span>
                  <span>{st.duration}</span>
                </div>

                <div className="tid-st-foot">
                  <span>Xem chi tiết Trước / Sau chặng</span>
                  <span aria-hidden="true">→</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* ── KHỐI 02: HÔM NAY HỌC GÌ — CƠ CHẾ ADAPTIVE 60 / 20 / 20 ── */}
      <div className="tid-section-card tid-daily-mix-card">
        <div className="tid-sec-header">
          <div>
            <span className="tid-eyebrow-badge">02 · HÔM NAY HỌC GÌ — PHÂN BỔ ADAPTIVE 60 / 20 / 20</span>
            <h3>Thực đơn học tập tự động cân bằng cho buổi học hôm nay</h3>
            <p>
              Hệ thống phân tích từng câu bạn đã làm để giữ bạn luôn nằm trong <b>Vùng học hiệu quả (độ khó 65 – 75%)</b>: không quá dễ gây nhàm chán, không quá khó gây nản.
            </p>
          </div>
          <div className="tid-mix-legend" aria-label="Tỉ lệ phân bổ 60/20/20">
            <span className="mix-pill weak">60% Vá điểm yếu</span>
            <span className="mix-pill review">20% Ôn ngắt quãng</span>
            <span className="mix-pill stretch">20% Thử thách mới</span>
          </div>
        </div>

        <div className="tid-mix-bar" aria-hidden="true">
          <div className="tid-mix-seg weak" style={{ width: '60%' }}><span>60% VÁ LỖ HỔNG</span></div>
          <div className="tid-mix-seg review" style={{ width: '20%' }}><span>20% DUY TRÌ</span></div>
          <div className="tid-mix-seg stretch" style={{ width: '20%' }}><span>20% THỬ THÁCH</span></div>
        </div>

        <div className="tid-daily-tasks-grid">
          <div className="tid-task-box weak">
            <div className="tid-tb-top">
              <span className="tid-tb-ratio">60% THỜI LƯỢNG · ƯU TIÊN SỐ 1</span>
              <span className="tid-tb-status bad">✗ Cần vá lỗ hổng</span>
            </div>
            <h4>{weakChapter?.name}</h4>
            <p>
              {dueTotal > 0
                ? `Bạn đang có ${dueTotal} câu trả lời sai cần khắc phục dứt điểm để tránh mất điểm lặp lại.`
                : 'Tập trung nắm chắc công thức cốt lõi và giải 10 câu phân loại chuẩn cấu trúc 2026.'}
            </p>
            <button
              type="button"
              className="tid-tb-btn primary"
              onClick={() => (dueTotal > 0 ? onReviewChapter?.(weakChapter.id) : onPracticeChapter?.(weakChapter.id))}
            >
              <span>{dueTotal > 0 ? `Vá ngay ${dueTotal} câu sai` : 'Luyện trọng tâm ngay'}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="tid-task-box review">
            <div className="tid-tb-top">
              <span className="tid-tb-ratio">20% THỜI LƯỢNG · CHỐNG QUÊN SRS</span>
              <span className="tid-tb-status ok">✓ Duy trì nền tảng</span>
            </div>
            <h4>{maintainChapter?.name}</h4>
            <p>
              {cardsDue > 0
                ? `Có ${cardsDue} thẻ công thức & bẫy lý thuyết đến hạn ôn theo chu kì 1–3–7–14 ngày.`
                : 'Ôn nhanh sơ đồ tư duy và công thức giải nhanh để giữ tốc độ phản xạ dưới 30 giây/câu.'}
            </p>
            <button
              type="button"
              className="tid-tb-btn"
              onClick={() => onOpenChapter?.(maintainChapter.id)}
            >
              <span>Ôn lý thuyết &amp; Flashcard</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="tid-task-box stretch">
            <div className="tid-tb-top">
              <span className="tid-tb-ratio">20% THỜI LƯỢNG · VÙNG HIỆU QUẢ 65–75%</span>
              <span className="tid-tb-status stretch">⚡ Nâng mốc {targetScore10}đ</span>
            </div>
            <h4>{stretchChapter?.name}</h4>
            <p>
              Thử thách các câu hỏi Đúng/Sai 4 ý (Phần II) và Trả lời ngắn (Phần III) để kéo điểm dự đoán tiến sát mốc mục tiêu.
            </p>
            <button
              type="button"
              className="tid-tb-btn"
              onClick={() => onPracticeChapter?.(stretchChapter.id)}
            >
              <span>Thử thách nâng điểm</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KHỐI 03: BẢN ĐỒ 136 MICRO-SKILL KHTN (VẬT LÍ · HÓA HỌC · SINH HỌC) ── */}
      <div className="tid-section-card">
        <div className="tid-sec-header">
          <div>
            <span className="tid-eyebrow-badge">03 · BẢN ĐỒ CHẨN ĐOÁN 136 MICRO-SKILL KHTN</span>
            <h3>Chẻ nhỏ kiến thức tới từng kỹ năng vi mô — Biết chính xác mình hỏng ở đâu</h3>
            <p>
              Thay vì chỉ báo chung chung &ldquo;yếu môn Sinh&rdquo; hay &ldquo;yếu môn Lý&rdquo;, ELEC AI theo dõi từng kỹ năng nhỏ. Bấm vào bất kì kỹ năng nào để học và luyện ngay.
            </p>
          </div>
          <div className="tid-skill-filter-pills" role="tablist" aria-label="Lọc bản đồ Micro-skill theo môn">
            {[
              ['all', 'Tất cả 3 môn (136)'],
              ['ly', 'Vật lí (44)'],
              ['hoa', 'Hóa học (48)'],
              ['sinh', 'Sinh học (44)'],
            ].map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={activeSkillSubject === k}
                className={activeSkillSubject === k ? 'on' : ''}
                onClick={() => setActiveSkillSubject(k)}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="tid-micro-grid">
          {MICRO_SKILL_GROUPS
            .filter((g) => activeSkillSubject === 'all' || g.id === activeSkillSubject)
            .map((grp, grpIdx) => (
              <div
                key={grp.id}
                className={`tid-micro-card sub-${grp.id}`}
                style={{ '--mc-accent': grp.accent }}
              >
                <div className="tid-mc-watermark" aria-hidden="true">{grp.totalCount}</div>
                <div className="tid-mc-head">
                  <div>
                    <span className="tid-mc-count-tag">{grp.totalCount} MICRO-SKILLS</span>
                    <h4>{grp.name}</h4>
                    <small>{grp.sublabel}</small>
                  </div>
                </div>

                <div className="tid-mc-pills">
                  {grp.skills.map((sk, sIdx) => {
                    const realStatus = chapterStatusMap.get(sk.chapterId)
                      || (sIdx === 0 ? 'mastered' : sIdx === 2 && grpIdx === 2 ? 'weak' : 'learning');
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        className={`tid-skill-chip st-${realStatus}`}
                        onClick={() => onOpenChapter?.(sk.chapterId)}
                        title="Bấm để mở bài học & luyện tập kỹ năng này"
                      >
                        <span className="tid-sk-ico">
                          {realStatus === 'mastered' ? '✓' : realStatus === 'weak' ? '✗' : '•'}
                        </span>
                        <span className="tid-sk-lbl">{sk.label}</span>
                        <span className="tid-sk-tag">
                          {realStatus === 'mastered' ? 'Làm được' : realStatus === 'weak' ? 'Cần vá' : 'Đang luyện'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── MODAL CHI TIẾT CHẶNG LỘ TRÌNH (TRƯỚC KHI HỌC / SAU CHẶNG / CHUYÊN ĐỀ TRỌNG TÂM) ── */}
      {selectedStage && (
        <div className="tid-stage-modal-backdrop" onClick={() => setSelectedStage(null)} role="presentation">
          <div
            className="tid-stage-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Chi tiết Chặng ${selectedStage.num}: ${selectedStage.title}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tid-sm-top" style={{ '--st-accent': selectedStage.accent }}>
              <div className="tid-sm-pills">
                <span className="tid-sm-badge">CHẶNG {selectedStage.num} · {selectedStage.code}</span>
                <span className="tid-sm-pill">{selectedStage.range}</span>
                <span className="tid-sm-pill">{selectedStage.rawQuestions}</span>
                <span className="tid-sm-pill">{selectedStage.duration}</span>
              </div>
              <button
                type="button"
                className="tid-sm-close"
                onClick={() => setSelectedStage(null)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="tid-sm-body">
              <h3>{selectedStage.title}</h3>
              <p className="tid-sm-lead">{selectedStage.subtitle}</p>

              <div className="tid-sm-compare-grid">
                <div className="tid-sm-col before">
                  <span className="tid-sm-col-tag">TRƯỚC KHI VÀO CHẶNG {selectedStage.num}</span>
                  <ul>
                    {selectedStage.beforeList.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="tid-sm-col after">
                  <span className="tid-sm-col-tag">KẾT QUẢ ĐẠT ĐƯỢC SAU CHẶNG {selectedStage.num}</span>
                  <ul>
                    {selectedStage.afterList.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="tid-sm-strategy-box">
                <strong>Chiến thuật trọng tâm ở chặng này:</strong>
                <p>{selectedStage.todoSummary}</p>
              </div>

              <div className="tid-sm-topics">
                <strong>Chuyên đề tiêu biểu cần hoàn thành ngay:</strong>
                <div className="tid-sm-topic-btns">
                  {selectedStage.focusTopics.map((ft) => (
                    <button
                      key={ft.label}
                      type="button"
                      className="tid-sm-topic-chip"
                      onClick={() => {
                        setSelectedStage(null);
                        onOpenChapter?.(ft.chapterId);
                      }}
                    >
                      <span>{ft.label}</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="tid-sm-foot">
              <button
                type="button"
                className="ns9-btn-outline"
                onClick={() => {
                  const idx = STAGES.findIndex((s) => s.id === selectedStage.id);
                  const next = STAGES[(idx + 1) % STAGES.length];
                  setSelectedStage(next);
                }}
              >
                Xem chặng tiếp theo →
              </button>
              <button
                type="button"
                className="ns9-primary-cta-btn"
                onClick={() => {
                  const firstCh = selectedStage.focusTopics[0]?.chapterId;
                  setSelectedStage(null);
                  if (firstCh) onPracticeChapter?.(firstCh);
                  else onTabSelect?.('study');
                }}
              >
                <span>Bắt đầu luyện chặng {selectedStage.num} ngay</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
