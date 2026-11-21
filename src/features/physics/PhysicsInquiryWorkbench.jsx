import { useEffect, useMemo, useState } from 'react';

/* ============================================================
   PhysicsInquiryWorkbench.jsx — INQ-ITS LAB COACH & GIZMOS CER STUDIO
   ------------------------------------------------------------
   Vượt trội PhET, ExploreLearning Gizmos & Inq-ITS:
     1. Nhiệm vụ Thực nghiệm 3 cấp độ (Cơ bản · Vận dụng · Olympiad)
        chấm sai số tự động (±3%).
     2. Inq-ITS Rex Telemetry: Kiểm định phương pháp "Kiểm soát biến"
        (Fair Test Validator) phát hiện lỗi đổi 2 biến độc lập cùng lúc.
     3. Báo cáo Khoa học CER (Claim - Evidence - Reasoning) chấm điểm
        Rubric 10đ tức thì + kết nối trực tiếp Bé Elec AI.
   ============================================================ */

const IcoTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

const IcoShieldCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IcoClipboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IcoWarn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IcoSpark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7L12 2z" />
  </svg>
);

/* ── Kho Nhiệm Vụ Thực Nghiệm & Cấu Hình Kiểm Soát Biến cho 7 Mô Phỏng ── */
export const INQUIRY_LAB_CONFIGS = {
  projectile: {
    title: 'Khảo sát Chuyển động Ném xiên',
    indepVar: { key: 'alpha', label: 'Góc ném α (°)', unit: '°' },
    ctrlVar: { key: 'v0', label: 'Vận tốc đầu v₀ (m/s)', unit: 'm/s' },
    depVar: { key: 'range', label: 'Tầm xa L (m)', unit: 'm' },
    defaultTrials: [
      { id: 1, indep: 30, ctrl: 20, dep: 35.35 },
      { id: 2, indep: 45, ctrl: 20, dep: 40.82 },
      { id: 3, indep: 60, ctrl: 20, dep: 35.35 },
    ],
    flawedTrials: [
      { id: 1, indep: 30, ctrl: 15, dep: 19.88 },
      { id: 2, indep: 45, ctrl: 25, dep: 63.78 },
      { id: 3, indep: 60, ctrl: 30, dep: 79.53 },
    ],
    missions: [
      {
        id: 'proj-m1',
        tier: 'Cơ bản',
        title: 'Đo tầm xa cực đại khi không có sức cản',
        prompt: 'Đặt v₀ = 20 m/s, h₀ = 0 m, g = 9,8 m/s², hệ số cản k = 0 và góc bắn α = 45°. Tầm xa cực đại L đo được trên mô phỏng bằng bao nhiêu mét?',
        target: 40.82,
        tolerance: 0.8,
        unit: 'm',
        formulaHint: 'L_max = v₀² / g = 20² / 9,8 ≈ 40,82 m',
      },
      {
        id: 'proj-m2',
        tier: 'Vận dụng',
        title: 'Kiểm chứng hai góc bắn phụ nhau',
        prompt: 'Giữ v₀ = 24 m/s, h₀ = 0 m, g = 9,8 m/s². Đo tầm xa L khi bắn ở góc α₁ = 30° (hoặc α₂ = 60°). Nhập giá trị tầm xa L đo được:',
        target: 50.9,
        tolerance: 1.0,
        unit: 'm',
        formulaHint: 'L = (v₀² · sin 60°) / g = (576 · 0,866) / 9,8 ≈ 50,90 m',
      },
      {
        id: 'proj-m3',
        tier: 'Olympiad',
        title: 'Độ cao cực đại tại góc bắn 60°',
        prompt: 'Với v₀ = 20 m/s, h₀ = 0 m, α = 60°, g = 9,8 m/s², bỏ qua cản không khí. Đỉnh parabol H_max đạt giá trị bao nhiêu mét?',
        target: 15.31,
        tolerance: 0.4,
        unit: 'm',
        formulaHint: 'H_max = (v₀² · sin²60°) / (2g) = (400 · 0,75) / 19,6 ≈ 15,31 m',
      },
    ],
    cerPresets: {
      claim: 'Khi giữ nguyên vận tốc đầu v₀ và bỏ qua sức cản không khí (h₀ = 0), tầm xa L đạt cực đại tại góc ném α = 45° và bằng nhau ở các cặp góc phụ nhau (α và 90° − α).',
      reasoning: 'Theo công thức tầm xa L = (v₀² · sin 2α) / g, vì sin 2α đạt cực đại bằng 1 khi 2α = 90° (tức α = 45°) và sin(2α) = sin(180° − 2α) nên góc 30° và 60° cho cùng tầm xa.',
      keywords: ['45', 'sin', 'v0', 'g', 'cực đại', 'phụ nhau'],
    },
  },
  circuit: {
    title: 'Định luật Ohm toàn mạch & Công suất cực đại',
    indepVar: { key: 'R', label: 'Biến trở ngoài R (Ω)', unit: 'Ω' },
    ctrlVar: { key: 'E', label: 'Suất điện động E (V)', unit: 'V' },
    depVar: { key: 'P', label: 'Công suất mạch ngoài P (W)', unit: 'W' },
    defaultTrials: [
      { id: 1, indep: 2, ctrl: 12, dep: 18.0 },
      { id: 2, indep: 4, ctrl: 12, dep: 16.0 },
      { id: 3, indep: 6, ctrl: 12, dep: 13.5 },
    ],
    flawedTrials: [
      { id: 1, indep: 2, ctrl: 9, dep: 10.13 },
      { id: 2, indep: 4, ctrl: 12, dep: 16.0 },
      { id: 3, indep: 6, ctrl: 18, dep: 30.38 },
    ],
    missions: [
      {
        id: 'cir-m1',
        tier: 'Cơ bản',
        title: 'Đo cường độ dòng điện mạch chính',
        prompt: 'Đặt nguồn E = 12 V, điện trở trong r = 1 Ω, mạch nối tiếp R₁ = 5 Ω và R₂ = 6 Ω (R_N = 11 Ω). Đóng khóa K, ampe kế chỉ bao nhiêu Ampe?',
        target: 1.0,
        tolerance: 0.08,
        unit: 'A',
        formulaHint: 'I = E / (R_N + r) = 12 / (11 + 1) = 1,00 A',
      },
      {
        id: 'cir-m2',
        tier: 'Vận dụng',
        title: 'Độ sụt thế trên điện trở trong',
        prompt: 'Với nguồn E = 12 V, r = 2 Ω và dòng điện mạch chính I = 1,5 A. Hiệu điện thế hai đầu mạch ngoài U_N đo trên vôn kế bằng bao nhiêu Vôn?',
        target: 9.0,
        tolerance: 0.2,
        unit: 'V',
        formulaHint: 'U_N = E − I·r = 12 − 1,5 × 2 = 9,00 V',
      },
      {
        id: 'cir-m3',
        tier: 'Olympiad',
        title: 'Định lý Phối hợp trở kháng (Công suất cực đại)',
        prompt: 'Nguồn E = 12 V, r = 2 Ω. Điều chỉnh điện trở tương đương mạch ngoài R_N = r = 2 Ω. Công suất tiêu thụ cực đại P_max ở mạch ngoài bằng bao nhiêu Oát (W)?',
        target: 18.0,
        tolerance: 0.4,
        unit: 'W',
        formulaHint: 'P_max = E² / (4r) = 144 / (4 × 2) = 18,0 W',
      },
    ],
    cerPresets: {
      claim: 'Khi suất điện động E và điện trở trong r không đổi, hiệu điện thế mạch ngoài U_N giảm tuyến tính theo cường độ dòng điện I, và công suất mạch ngoài đạt cực đại khi R_N = r.',
      reasoning: 'Theo định luật Ohm toàn mạch I = E / (R_N + r), suy ra U_N = E − I·r. Áp dụng bất đẳng thức Cauchy cho P_N = I²·R_N = E² / (√R_N + r/√R_N)², P_N đạt cực đại E²/(4r) khi R_N = r.',
      keywords: ['ohm', 'E', 'r', 'cực đại', 'U', 'I'],
    },
  },
  optics: {
    title: 'Thấu kính mỏng & Khúc xạ ánh sáng',
    indepVar: { key: 'd', label: 'Khoảng cách vật d (cm)', unit: 'cm' },
    ctrlVar: { key: 'f', label: 'Tiêu cự thấu kính f (cm)', unit: 'cm' },
    depVar: { key: 'dPrime', label: 'Khoảng cách ảnh d\' (cm)', unit: 'cm' },
    defaultTrials: [
      { id: 1, indep: 30, ctrl: 15, dep: 30.0 },
      { id: 2, indep: 45, ctrl: 15, dep: 22.5 },
      { id: 3, indep: 60, ctrl: 15, dep: 20.0 },
    ],
    flawedTrials: [
      { id: 1, indep: 30, ctrl: 10, dep: 15.0 },
      { id: 2, indep: 45, ctrl: 15, dep: 22.5 },
      { id: 3, indep: 60, ctrl: 20, dep: 30.0 },
    ],
    missions: [
      {
        id: 'opt-m1',
        tier: 'Cơ bản',
        title: 'Ảnh thật cao bằng vật qua thấu kính hội tụ',
        prompt: 'Chọn thấu kính hội tụ có tiêu cự f = 15 cm. Đặt vật tại vị trí d = 2f = 30 cm. Khoảng cách ảnh d\' thu được bằng bao nhiêu cm?',
        target: 30.0,
        tolerance: 0.6,
        unit: 'cm',
        formulaHint: 'd\' = (d · f) / (d − f) = (30 × 15) / (30 − 15) = 30,0 cm',
      },
      {
        id: 'opt-m2',
        tier: 'Vận dụng',
        title: 'Kính lúp — Tạo ảnh ảo lớn gấp 2 lần vật',
        prompt: 'Với thấu kính hội tụ f = 20 cm, đặt vật trong khoảng tiêu cự tại d = 10 cm. Giá trị đại số vị trí ảnh ảo d\' bằng bao nhiêu cm (nhập số âm)?',
        target: -20.0,
        tolerance: 0.6,
        unit: 'cm',
        formulaHint: 'd\' = (10 × 20) / (10 − 20) = −20,0 cm (Ảnh ảo, k = −d\'/d = +2)',
      },
      {
        id: 'opt-m3',
        tier: 'Olympiad',
        title: 'Khoảng cách ngắn nhất giữa vật thật và ảnh thật',
        prompt: 'Với thấu kính hội tụ f = 12 cm, khi dịch chuyển vật (d > f) để thu được ảnh thật trên màn, khoảng cách ngắn nhất L_min = (d + d\')_min giữa vật và ảnh thật là bao nhiêu cm?',
        target: 48.0,
        tolerance: 0.8,
        unit: 'cm',
        formulaHint: 'Theo bất đẳng thức Cauchy, khi vật và ảnh đều thật: L_min = d + d\' = 4f = 4 × 12 = 48,0 cm (đạt tại d = d\' = 2f).',
      },
    ],
    cerPresets: {
      claim: 'Với thấu kính hội tụ có tiêu cự f cố định, khi vật thật dịch lại gần tiêu điểm chính F (d giảm về f), ảnh thật dịch ra xa thấu kính (d\' tăng) và độ phóng đại |k| tăng.',
      reasoning: 'Từ công thức thấu kính 1/f = 1/d + 1/d\' suy ra d\' = d·f / (d − f). Khi f không đổi và d giảm tiến dần tới f (d > f), mẫu số (d − f) giảm làm d\' tăng mạnh.',
      keywords: ['1/f', 'tiêu cự', 'ảnh thật', 'phóng đại', 'd\''],
    },
  },
  wave: {
    title: 'Giao thoa sóng mặt nước hai nguồn kết hợp',
    indepVar: { key: 'f', label: 'Tần số sóng f (Hz)', unit: 'Hz' },
    ctrlVar: { key: 'v', label: 'Tốc độ truyền sóng v (cm/s)', unit: 'cm/s' },
    depVar: { key: 'lambda', label: 'Bước sóng λ (cm)', unit: 'cm' },
    defaultTrials: [
      { id: 1, indep: 10, ctrl: 40, dep: 4.0 },
      { id: 2, indep: 20, ctrl: 40, dep: 2.0 },
      { id: 3, indep: 25, ctrl: 40, dep: 1.6 },
    ],
    flawedTrials: [
      { id: 1, indep: 10, ctrl: 30, dep: 3.0 },
      { id: 2, indep: 20, ctrl: 40, dep: 2.0 },
      { id: 3, indep: 25, ctrl: 50, dep: 2.0 },
    ],
    missions: [
      {
        id: 'wav-m1',
        tier: 'Cơ bản',
        title: 'Xác định bước sóng trên mặt nước',
        prompt: 'Hai nguồn phát sóng với tần số f = 20 Hz, tốc độ truyền sóng v = 40 cm/s. Bước sóng λ đo được bằng bao nhiêu cm?',
        target: 2.0,
        tolerance: 0.1,
        unit: 'cm',
        formulaHint: 'λ = v / f = 40 / 20 = 2,0 cm',
      },
      {
        id: 'wav-m2',
        tier: 'Vận dụng',
        title: 'Đếm số đường cực đại giao thoa',
        prompt: 'Hai nguồn cùng pha đặt cách nhau S₁S₂ = 11 cm với bước sóng λ = 2 cm. Trên đoạn thẳng nối S₁S₂ có tổng cộng bao nhiêu điểm dao động với biên độ cực đại?',
        target: 11,
        tolerance: 0.2,
        unit: 'cực đại',
        formulaHint: '−S₁S₂/λ < k < S₁S₂/λ ⇔ −5,5 < k < 5,5 ⇒ k ∈ {−5, ..., 5} có 11 cực đại.',
      },
      {
        id: 'wav-m3',
        tier: 'Olympiad',
        title: 'Khoảng cách giữa hai cực đại liên tiếp trên S₁S₂',
        prompt: 'Với bước sóng λ = 3,6 cm, khoảng cách ngắn nhất giữa hai điểm dao động với biên độ cực đại liên tiếp nằm trên đoạn thẳng nối hai nguồn S₁S₂ là bao nhiêu cm?',
        target: 1.8,
        tolerance: 0.1,
        unit: 'cm',
        formulaHint: 'Trên đoạn nối hai nguồn S₁S₂, hai cực đại liên tiếp cách nhau Δd = λ / 2 = 3,6 / 2 = 1,8 cm.',
      },
    ],
    cerPresets: {
      claim: 'Trong cùng một môi trường truyền sóng (v không đổi), bước sóng λ tỉ lệ nghịch với tần số f, và số vân cực đại trên đoạn S₁S₂ tăng khi tăng tần số nguồn phát.',
      reasoning: 'Vì λ = v / f nên khi v cố định và f tăng thì bước sóng λ giảm. Số cực đại phụ thuộc tỉ số S₁S₂ / λ, do đó λ càng nhỏ thì mật độ vân giao thoa càng dày.',
      keywords: ['bước sóng', 'tần số', 'cực đại', 'v/f', 'cùng pha'],
    },
  },
  mechanics: {
    title: 'Định luật Bảo toàn Động lượng & Va chạm 2D',
    indepVar: { key: 'e', label: 'Hệ số phục hồi e', unit: '' },
    ctrlVar: { key: 'pTotal', label: 'Tổng động lượng trước va chạm (kg·m/s)', unit: 'kg·m/s' },
    depVar: { key: 'kRatio', label: 'Hiệu suất bảo toàn động năng (%)', unit: '%' },
    defaultTrials: [
      { id: 1, indep: 1.0, ctrl: 12.0, dep: 100.0 },
      { id: 2, indep: 0.5, ctrl: 12.0, dep: 62.5 },
      { id: 3, indep: 0.0, ctrl: 12.0, dep: 50.0 },
    ],
    flawedTrials: [
      { id: 1, indep: 1.0, ctrl: 10.0, dep: 100.0 },
      { id: 2, indep: 0.5, ctrl: 16.0, dep: 68.0 },
      { id: 3, indep: 0.0, ctrl: 22.0, dep: 54.0 },
    ],
    missions: [
      {
        id: 'mec-m1',
        tier: 'Cơ bản',
        title: 'Va chạm mềm xuyên tâm',
        prompt: 'Quả cầu m₁ = 2 kg chuyển động với v₁ = 6 m/s đến va chạm mềm hoàn toàn (e = 0) vào quả cầu m₂ = 4 kg đang đứng yên. Vận tốc chung V của hai quả cầu ngay sau va chạm là bao nhiêu m/s?',
        target: 2.0,
        tolerance: 0.1,
        unit: 'm/s',
        formulaHint: 'V = (m₁·v₁) / (m₁ + m₂) = (2 × 6) / (2 + 4) = 2,0 m/s',
      },
      {
        id: 'mec-m2',
        tier: 'Vận dụng',
        title: 'Trao đổi vận tốc trong va chạm đàn hồi',
        prompt: 'Hai quả cầu cùng khối lượng m₁ = m₂ = 2 kg va chạm hoàn toàn đàn hồi xuyên tâm (e = 1). Trước va chạm v₁ = 5 m/s, v₂ = 0 m/s. Sau va chạm vận tốc v₂\' của quả cầu thứ hai là bao nhiêu m/s?',
        target: 5.0,
        tolerance: 0.15,
        unit: 'm/s',
        formulaHint: 'Khi m₁ = m₂ và e = 1, hai vật trao đổi vận tốc cho nhau: v₁\' = 0 m/s và v₂\' = v₁ = 5,0 m/s.',
      },
      {
        id: 'mec-m3',
        tier: 'Olympiad',
        title: 'Nhiệt lượng tỏa ra trong va chạm mềm',
        prompt: 'Quả cầu m₁ = 2 kg (v₁ = 6 m/s) va chạm mềm (e = 0) vào m₂ = 4 kg đứng yên. Phần cơ năng chuyển hóa thành nhiệt ΔE = W_đ(trước) − W_đ(sau) bằng bao nhiêu Jun (J)?',
        target: 24.0,
        tolerance: 0.5,
        unit: 'J',
        formulaHint: 'W_đ1 = ½·2·6² = 36 J; W_đ2 = ½·(2+4)·2² = 12 J ⇒ ΔE = 36 − 12 = 24,0 J.',
      },
    ],
    cerPresets: {
      claim: 'Trong hệ kín không có ma sát ngoài, tổng động lượng vectơ luôn bảo toàn với mọi giá trị hệ số phục hồi e, nhưng tổng động năng chỉ bảo toàn 100% khi va chạm hoàn toàn đàn hồi (e = 1).',
      reasoning: 'Nội lực tương tác trong va chạm tuân theo định luật III Newton (F₁₂ = −F₂₁) nên độ biến thiên tổng động lượng bằng 0. Khi e < 1, một phần động năng biến thành nội năng (nhiệt) khi biến dạng.',
      keywords: ['động lượng', 'đàn hồi', 'bảo toàn', 'e = 1', 'động năng'],
    },
  },
  pendulum: {
    title: 'Động lực học Phi tuyến & Con lắc kép (Chaos RK4)',
    indepVar: { key: 'theta0', label: 'Góc lệch ban đầu θ₁ (°)', unit: '°' },
    ctrlVar: { key: 'L1', label: 'Chiều dài thanh L₁ (m)', unit: 'm' },
    depVar: { key: 'T', label: 'Chu kì dao động nhỏ T (s)', unit: 's' },
    defaultTrials: [
      { id: 1, indep: 5, ctrl: 1.0, dep: 2.01 },
      { id: 2, indep: 10, ctrl: 1.0, dep: 2.01 },
      { id: 3, indep: 60, ctrl: 1.0, dep: 2.15 },
    ],
    flawedTrials: [
      { id: 1, indep: 5, ctrl: 0.5, dep: 1.42 },
      { id: 2, indep: 30, ctrl: 1.0, dep: 2.04 },
      { id: 3, indep: 60, ctrl: 1.5, dep: 2.63 },
    ],
    missions: [
      {
        id: 'pen-m1',
        tier: 'Cơ bản',
        title: 'Chu kì dao động nhỏ của con lắc đơn tương đương',
        prompt: 'Khi khóa khớp dưới và chỉ cho thanh L = 1,0 m dao động góc nhỏ tại nơi có g = 9,8 m/s², chu kì dao động T = 2π√(L/g) bằng bao nhiêu giây?',
        target: 2.01,
        tolerance: 0.05,
        unit: 's',
        formulaHint: 'T = 2π · √(1,0 / 9,8) ≈ 2,007 s ≈ 2,01 s',
      },
      {
        id: 'pen-m2',
        tier: 'Vận dụng',
        title: 'Bảo toàn cơ năng trong tích phân RK4',
        prompt: 'Một hệ con lắc kép không tắt dần có thế năng cực đại ở vị trí thả ban đầu (v = 0) là E_p = 14,5 J. Khi đi qua vị trí có thế năng 4,5 J, tổng động năng của hai quả nặng là bao nhiêu Jun?',
        target: 10.0,
        tolerance: 0.2,
        unit: 'J',
        formulaHint: 'W_đ = E_cơ − W_t = 14,5 − 4,5 = 10,0 J',
      },
      {
        id: 'pen-m3',
        tier: 'Olympiad',
        title: 'Tần số góc riêng chế độ đồng pha',
        prompt: 'Với con lắc đơn chiều dài L = 2,45 m tại nơi có g = 9,8 m/s², tần số góc dao động nhỏ ω = √(g/L) bằng bao nhiêu rad/s?',
        target: 2.0,
        tolerance: 0.05,
        unit: 'rad/s',
        formulaHint: 'ω = √(9,8 / 2,45) = √4 = 2,0 rad/s',
      },
    ],
    cerPresets: {
      claim: 'Ở biên độ góc nhỏ (θ < 10°), con lắc kép dao động tuần hoàn gần điều hòa; nhưng ở biên độ góc lớn, hệ trở nên hỗn loạn (Chaos) và cực kỳ nhạy cảm với sai lệch điều kiện đầu (Hiệu ứng cánh bướm).',
      reasoning: 'Hệ phương trình vi phân Euler-Lagrange của con lắc kép chứa các số hạng phi tuyến sin(θ₁ − θ₂) và tích vận tốc góc. Khi góc lớn, xấp xỉ sin θ ≈ θ không còn đúng làm khoảng cách pha phân kì theo hàm mũ.',
      keywords: ['phi tuyến', 'hỗn loạn', 'cánh bướm', 'điều kiện đầu', 'cơ năng'],
    },
  },
  olympiad: {
    title: 'Xử lý Số liệu Thực nghiệm & Hồi quy Tuyến tính OLS',
    indepVar: { key: 'L', label: 'Chiều dài dây treo l (m)', unit: 'm' },
    ctrlVar: { key: 'theta', label: 'Biên độ góc nhỏ α₀ (°)', unit: '°' },
    depVar: { key: 'T2', label: 'Bình phương chu kì T² (s²)', unit: 's²' },
    defaultTrials: [
      { id: 1, indep: 0.4, ctrl: 5, dep: 1.61 },
      { id: 2, indep: 0.6, ctrl: 5, dep: 2.42 },
      { id: 3, indep: 0.8, ctrl: 5, dep: 3.23 },
    ],
    flawedTrials: [
      { id: 1, indep: 0.4, ctrl: 5, dep: 1.61 },
      { id: 2, indep: 0.6, ctrl: 25, dep: 2.52 },
      { id: 3, indep: 0.8, ctrl: 45, dep: 3.51 },
    ],
    missions: [
      {
        id: 'oly-m1',
        tier: 'Cơ bản',
        title: 'Xác định gia tốc trọng trường g từ hệ số góc OLS',
        prompt: 'Trong thí nghiệm đo g bằng con lắc đơn, đường thẳng hồi quy T² theo l có hệ số góc a = 4,03 s²/m. Gia tốc trọng trường g = 4π² / a tính được bằng bao nhiêu m/s²?',
        target: 9.8,
        tolerance: 0.15,
        unit: 'm/s²',
        formulaHint: 'g = 4π² / a = 39,4784 / 4,03 ≈ 9,80 m/s²',
      },
      {
        id: 'oly-m2',
        tier: 'Vận dụng',
        title: 'Tính điện trở trong từ đồ thị U theo I',
        prompt: 'Đường hồi quy hiệu điện thế U (V) theo dòng điện I (A) của một pin có phương trình U = −1,85·I + 8,96. Điện trở trong r của nguồn điện bằng bao nhiêu Ω (nhập số dương)?',
        target: 1.85,
        tolerance: 0.08,
        unit: 'Ω',
        formulaHint: 'Từ U = E − r·I = (−r)·I + E ⇒ r = −a = 1,85 Ω và E = 8,96 V.',
      },
      {
        id: 'oly-m3',
        tier: 'Olympiad',
        title: 'Tuyến tính hóa định luật Boyle (P theo 1/V)',
        prompt: 'Khảo sát đẳng nhiệt một lượng khí: khi 1/V = 0,04 cm⁻³ thì áp suất P = 120 kPa. Tích số hằng số đẳng nhiệt C = P·V của lượng khí này bằng bao nhiêu kPa·cm³?',
        target: 3000,
        tolerance: 50,
        unit: 'kPa·cm³',
        formulaHint: 'C = P / (1/V) = 120 / 0,04 = 3000 kPa·cm³.',
      },
    ],
    cerPresets: {
      claim: 'Tuyến tính hóa phương trình Vật lí về dạng Y = a·X + b và dùng bình phương tối thiểu (OLS) giúp khử sai số ngẫu nhiên và xác định hằng số Vật lí từ hệ số góc a với hệ số tương quan R² ≈ 1.',
      reasoning: 'Ví dụ với T = 2π√(l/g), nếu vẽ T theo l sẽ ra đường cong căn bậc hai khó tìm độ dốc; khi đặt Y = T² và X = l thì Y = (4π²/g)·X là đường thẳng qua gốc tọa độ có hệ số góc a = 4π²/g.',
      keywords: ['tuyến tính hóa', 'hệ số góc', 'OLS', 'sai số', '4π²'],
    },
  },
  rlc: {
    title: 'Mạch điện xoay chiều RLC nối tiếp & Cộng hưởng điện',
    indepVar: { key: 'f', label: 'Tần số dòng điện f (Hz)', unit: 'Hz' },
    ctrlVar: { key: 'U', label: 'Điện áp hiệu dụng U (V)', unit: 'V' },
    depVar: { key: 'I', label: 'Cường độ hiệu dụng I (A)', unit: 'A' },
    defaultTrials: [
      { id: 1, indep: 40, ctrl: 200, dep: 1.41 },
      { id: 2, indep: 50, ctrl: 200, dep: 2.0 },
      { id: 3, indep: 60, ctrl: 200, dep: 1.56 },
    ],
    flawedTrials: [
      { id: 1, indep: 40, ctrl: 100, dep: 0.71 },
      { id: 2, indep: 50, ctrl: 200, dep: 2.0 },
      { id: 3, indep: 60, ctrl: 250, dep: 1.95 },
    ],
    missions: [
      {
        id: 'rlc-m1',
        tier: 'Cơ bản',
        title: 'Tổng trở mạch RLC nối tiếp',
        prompt: 'Cho mạch RLC có R = 60 Ω, cảm kháng Z_L = 120 Ω và dung kháng Z_C = 40 Ω. Tổng trở Z của toàn mạch bằng bao nhiêu Ω?',
        target: 100,
        tolerance: 1,
        unit: 'Ω',
        formulaHint: 'Z = √[R² + (Z_L − Z_C)²] = √[60² + 80²] = 100 Ω',
      },
      {
        id: 'rlc-m2',
        tier: 'Vận dụng',
        title: 'Hệ số công suất cos φ',
        prompt: 'Với R = 60 Ω và tổng trở Z = 100 Ω, hệ số công suất cos φ của mạch bằng bao nhiêu?',
        target: 0.6,
        tolerance: 0.03,
        unit: '',
        formulaHint: 'cos φ = R / Z = 60 / 100 = 0,60',
      },
      {
        id: 'rlc-m3',
        tier: 'Olympiad',
        title: 'Công suất cực đại khi cộng hưởng điện',
        prompt: 'Đặt điện áp hiệu dụng U = 200 V vào mạch RLC có R = 100 Ω. Thay đổi tần số f để xảy ra cộng hưởng điện (Z_L = Z_C). Công suất tiêu thụ cực đại P_max bằng bao nhiêu W?',
        target: 400,
        tolerance: 5,
        unit: 'W',
        formulaHint: 'Khi cộng hưởng Z_min = R ⇒ P_max = U² / R = 200² / 100 = 400 W',
      },
    ],
    cerPresets: {
      claim: 'Khi giữ nguyên U, R, L, C và thay đổi tần số f, cường độ dòng điện hiệu dụng I và công suất tiêu thụ P đạt cực đại tại tần số cộng hưởng f₀ = 1 / (2π√LC) khi Z_L = Z_C.',
      reasoning: 'Vì Z = √[R² + (2πfL − 1/(2πfC))²] nên khi Z_L = Z_C thì tổng trở đạt cực tiểu Z_min = R, kéo theo I_max = U/R và cos φ = 1.',
      keywords: ['cộng hưởng', 'Z_L = Z_C', 'tổng trở', 'cos', 'U/R'],
    },
  },
  spring: {
    title: 'Giao thoa ánh sáng Khe Y-âng & Dao động Lò xo',
    indepVar: { key: 'lambda', label: 'Bước sóng ánh sáng λ (nm)', unit: 'nm' },
    ctrlVar: { key: 'a', label: 'Khoảng cách hai khe a (mm)', unit: 'mm' },
    depVar: { key: 'i', label: 'Khoảng vân giao thoa i (mm)', unit: 'mm' },
    defaultTrials: [
      { id: 1, indep: 400, ctrl: 1.0, dep: 0.8 },
      { id: 2, indep: 550, ctrl: 1.0, dep: 1.1 },
      { id: 3, indep: 700, ctrl: 1.0, dep: 1.4 },
    ],
    flawedTrials: [
      { id: 1, indep: 400, ctrl: 0.5, dep: 1.6 },
      { id: 2, indep: 550, ctrl: 1.0, dep: 1.1 },
      { id: 3, indep: 700, ctrl: 2.0, dep: 0.7 },
    ],
    missions: [
      {
        id: 'spr-m1',
        tier: 'Cơ bản',
        title: 'Tính khoảng vân giao thoa Y-âng',
        prompt: 'Trong thí nghiệm Y-âng với bước sóng λ = 600 nm (0,6 µm), khoảng cách hai khe a = 1,2 mm, khoảng cách tới màn D = 2,0 m. Khoảng vân i bằng bao nhiêu mm?',
        target: 1.0,
        tolerance: 0.05,
        unit: 'mm',
        formulaHint: 'i = (λ · D) / a = (0,6 × 2,0) / 1,2 = 1,0 mm',
      },
      {
        id: 'spr-m2',
        tier: 'Vận dụng',
        title: 'Vị trí vân tối thứ 3',
        prompt: 'Với khoảng vân i = 1,2 mm, vân tối thứ 3 (kể từ vân sáng trung tâm) nằm cách vân trung tâm bao nhiêu mm?',
        target: 3.0,
        tolerance: 0.08,
        unit: 'mm',
        formulaHint: 'x_t3 = (2 + 0,5) · i = 2,5 × 1,2 = 3,0 mm',
      },
      {
        id: 'spr-m3',
        tier: 'Olympiad',
        title: 'Chu kì con lắc lò xo treo thẳng đứng',
        prompt: 'Một con lắc lò xo có độ cứng k = 100 N/m gắn vật nặng m = 0,25 kg. Lấy π ≈ 3,1416. Chu kì dao động riêng T = 2π√(m/k) bằng bao nhiêu giây?',
        target: 0.314,
        tolerance: 0.015,
        unit: 's',
        formulaHint: 'ω = √(100 / 0,25) = 20 rad/s ⇒ T = 2π / 20 = π / 10 ≈ 0,314 s',
      },
    ],
    cerPresets: {
      claim: 'Khi giữ cố định khoảng cách hai khe a và khoảng cách màn D, khoảng vân giao thoa i tỉ lệ thuận với bước sóng ánh sáng đơn sắc λ.',
      reasoning: 'Theo công thức giao thoa Y-âng i = λD / a, vì D và a không đổi nên ánh sáng đỏ (λ lớn) luôn cho hệ vân thưa hơn ánh sáng tím (λ nhỏ).',
      keywords: ['khoảng vân', 'λD/a', 'bước sóng', 'tỉ lệ thuận', 'vân sáng'],
    },
  },
  dna: {
    title: 'Phiên mã, Dịch mã & Đột biến điểm phân tử DNA',
    indepVar: { key: 'N', label: 'Tổng số nucleotide của đoạn gene N', unit: 'nu' },
    ctrlVar: { key: 'pctG', label: 'Tỉ lệ % nucleotide loại G (%)', unit: '%' },
    depVar: { key: 'H', label: 'Tổng số liên kết Hydrogen H', unit: 'LK' },
    defaultTrials: [
      { id: 1, indep: 1200, ctrl: 30, dep: 1560 },
      { id: 2, indep: 2400, ctrl: 30, dep: 3120 },
      { id: 3, indep: 3000, ctrl: 30, dep: 3900 },
    ],
    flawedTrials: [
      { id: 1, indep: 1200, ctrl: 20, dep: 1440 },
      { id: 2, indep: 2400, ctrl: 30, dep: 3120 },
      { id: 3, indep: 3000, ctrl: 40, dep: 4200 },
    ],
    missions: [
      {
        id: 'dna-m1',
        tier: 'Cơ bản',
        title: 'Tính số bộ ba (codon) trên mRNA',
        prompt: 'Một đoạn mạch khuôn DNA có 36 nucleotide tham gia phiên mã tạo mRNA. Phân tử mRNA tạo thành có bao nhiêu bộ ba (codon)?',
        target: 12,
        tolerance: 0.1,
        unit: 'codon',
        formulaHint: 'Số codon = Số ribonucleotide trên mRNA / 3 = 36 / 3 = 12 codon.',
      },
      {
        id: 'dna-m2',
        tier: 'Vận dụng',
        title: 'Biến thiên liên kết Hydrogen khi đột biến thay thế',
        prompt: 'Một đoạn gene bình thường có H = 3900 liên kết hydrogen. Đột biến điểm thay thế 1 cặp A-T bằng 1 cặp G-C làm tổng số liên kết hydrogen sau đột biến bằng bao nhiêu?',
        target: 3901,
        tolerance: 0.1,
        unit: 'LK',
        formulaHint: 'Cặp A-T có 2 liên kết H, cặp G-C có 3 liên kết H ⇒ Thay 1 cặp A-T bằng G-C làm tăng thêm 1 liên kết H (3901).',
      },
      {
        id: 'dna-m3',
        tier: 'Olympiad',
        title: 'Chiều dài đoạn gene theo đơn vị Ångström',
        prompt: 'Một gene mạch kép có tổng cộng N = 2400 nucleotide. Chiều dài L của gene (với mỗi cặp nu dài 3,4 Å) bằng bao nhiêu Å?',
        target: 4080,
        tolerance: 5,
        unit: 'Å',
        formulaHint: 'L = (N / 2) × 3,4 = 1200 × 3,4 = 4080 Å.',
      },
    ],
    cerPresets: {
      claim: 'Đột biến điểm thay thế cặp nucleotide chỉ làm thay đổi tối đa 1 bộ ba (codon) tại vị trí đột biến, nhưng nếu biến bộ ba mã hóa thành bộ ba kết thúc (UAA, UAG, UGA) sẽ làm chuỗi polypeptide ngắn lại.',
      reasoning: 'Do mã di truyền được đọc theo từng bộ ba không gối lên nhau từ bộ ba mở đầu AUG, đột biến thay thế không làm lệch khung đọc nhưng có thể tạo codon vô nghĩa (nonsense mutation).',
      keywords: ['codon', 'phiên mã', 'dịch mã', 'kết thúc', 'hydrogen'],
    },
  },
  punnett: {
    title: 'Quy luật Phân li Độc lập Menđen & Khung Punnett',
    indepVar: { key: 'nPairs', label: 'Số cặp gene dị hợp phân li độc lập n', unit: 'cặp' },
    ctrlVar: { key: 'domMode', label: 'Chế độ trội hoàn toàn (1 = Cố định)', unit: '' },
    depVar: { key: 'nGeno', label: 'Số dòng kiểu gene tối đa ở F₂ (3ⁿ)', unit: 'KG' },
    defaultTrials: [
      { id: 1, indep: 1, ctrl: 1, dep: 3 },
      { id: 2, indep: 2, ctrl: 1, dep: 9 },
      { id: 3, indep: 3, ctrl: 1, dep: 27 },
    ],
    flawedTrials: [
      { id: 1, indep: 1, ctrl: 1, dep: 3 },
      { id: 2, indep: 2, ctrl: 2, dep: 4 },
      { id: 3, indep: 3, ctrl: 3, dep: 8 },
    ],
    missions: [
      {
        id: 'pun-m1',
        tier: 'Cơ bản',
        title: 'Phép lai một cặp tính trạng Aa × Aa',
        prompt: 'Ở phép lai P: Aa × Aa (A trội hoàn toàn so với a), tỉ lệ kiểu hình trội (A-) ở đời con F₁ chiếm bao nhiêu phần trăm (%)?',
        target: 75,
        tolerance: 0.5,
        unit: '%',
        formulaHint: 'F₁: 1/4 AA : 2/4 Aa : 1/4 aa ⇒ Kiểu hình trội A- chiếm 3/4 = 75%.',
      },
      {
        id: 'pun-m2',
        tier: 'Vận dụng',
        title: 'Phép lai hai cặp tính trạng AaBb × AaBb',
        prompt: 'Trong phép lai phân li độc lập P: AaBb × AaBb (16 tổ hợp giao tử), kiểu hình mang 2 tính trạng trội (A-B-) chiếm bao nhiêu phần trăm (%)?',
        target: 56.25,
        tolerance: 0.5,
        unit: '%',
        formulaHint: 'P(A-B-) = 3/4 × 3/4 = 9/16 = 56,25%.',
      },
      {
        id: 'pun-m3',
        tier: 'Olympiad',
        title: 'Xác suất cá thể thuần chủng trong phép lai 2 cặp gene',
        prompt: 'Ở phép lai P: AaBb × AaBb, tổng tỉ lệ các cá thể có kiểu gene đồng hợp tử về cả 2 cặp gene (AABB, AAbb, aaBB, aabb) chiếm bao nhiêu phần trăm (%)?',
        target: 25,
        tolerance: 0.5,
        unit: '%',
        formulaHint: 'Mỗi cặp dị hợp cho 1/2 đồng hợp ⇒ 2 cặp độc lập cho (1/2) × (1/2) = 1/4 = 25% (4/16 tổ hợp).',
      },
    ],
    cerPresets: {
      claim: 'Khi các cặp allele nằm trên các cặp nhiễm sắc thể tương đồng khác nhau và trội hoàn toàn, tỉ lệ phân li kiểu hình chung ở đời con bằng tích tỉ lệ phân li kiểu hình của từng cặp tính trạng riêng rẽ.',
      reasoning: 'Do sự phân li độc lập và tổ hợp tự do của các cặp NST trong giảm phân, xác suất xuất hiện đồng thời hai biến cố độc lập A- và B- tuân theo quy tắc nhân xác suất: (3:1) × (3:1) = 9:3:3:1.',
      keywords: ['phân li độc lập', '9:3:3:1', 'xác suất', 'giao tử', 'Punnett'],
    },
  },
};

/* ── Thuật toán Inq-ITS Rex: Kiểm định phương pháp Kiểm soát biến (Fair Test) ── */
export function evaluateInquiryTrials(trials = []) {
  if (!Array.isArray(trials) || trials.length < 2) {
    return {
      status: 'insufficient',
      score: 35,
      badge: 'Chưa đủ mẫu đo',
      message: 'Cần ít nhất 3 lần đo với biến độc lập thay đổi để kiểm chứng quy luật thực nghiệm.',
    };
  }

  let indepChanges = 0;
  let ctrlChanges = 0;
  for (let i = 1; i < trials.length; i += 1) {
    if (Number(trials[i].indep) !== Number(trials[i - 1].indep)) indepChanges += 1;
    if (Number(trials[i].ctrl) !== Number(trials[i - 1].ctrl)) ctrlChanges += 1;
  }

  if (ctrlChanges > 0 && indepChanges > 0) {
    return {
      status: 'confounded',
      score: 45,
      badge: 'Lỗi Kiểm soát biến (Inq-ITS Alert)',
      message:
        'Phát hiện lỗi phương pháp thực nghiệm: Em đã thay đổi cả Biến độc lập lẫn Biến kiểm soát cùng lúc giữa các lần đo! Hãy giữ cố định Biến kiểm soát ở một giá trị duy nhất để kết luận không bị nhiễu.',
    };
  }

  if (indepChanges === 0) {
    return {
      status: 'stagnant',
      score: 50,
      badge: 'Chưa biến thiên biến khảo sát',
      message: 'Các lần đo đang có cùng giá trị Biến độc lập. Hãy thay đổi Biến độc lập qua ít nhất 3 mốc khác nhau.',
    };
  }

  return {
    status: 'verified',
    score: 100,
    badge: 'Đạt chuẩn Kiểm soát biến (Fair Test 100%)',
    message:
      'Thao tác thực nghiệm chuẩn khoa học! Biến kiểm soát được giữ cố định tuyệt đối, chỉ biến thiên duy nhất đại lượng khảo sát.',
  };
}

/* ── Thuật toán chấm báo cáo CER theo Rubric 10 điểm ── */
export function gradeCerReport({ claim = '', evidence = '', reasoning = '', config }) {
  const cText = claim.trim();
  const eText = evidence.trim();
  const rText = reasoning.trim();

  // 1. Claim (3.0 điểm)
  let claimScore = 0;
  if (cText.length >= 20) claimScore += 1.5;
  if (cText.length >= 45) claimScore += 0.75;
  const matchedKeywords = (config?.cerPresets?.keywords || []).filter((kw) =>
    cText.toLowerCase().includes(kw.toLowerCase()) || rText.toLowerCase().includes(kw.toLowerCase())
  );
  if (matchedKeywords.length >= 2) claimScore += 0.75;
  claimScore = Math.min(3, Number(claimScore.toFixed(2)));

  // 2. Evidence (4.0 điểm) — phải có số liệu thực đo
  let evidenceScore = 0;
  const numbersFound = eText.match(/\d+([.,]\d+)?/g) || [];
  if (eText.length >= 20) evidenceScore += 1.25;
  if (numbersFound.length >= 2) evidenceScore += 1.5;
  if (numbersFound.length >= 4) evidenceScore += 1.25;
  evidenceScore = Math.min(4, Number(evidenceScore.toFixed(2)));

  // 3. Reasoning (3.0 điểm) — liên hệ công thức / định luật
  let reasoningScore = 0;
  if (rText.length >= 25) reasoningScore += 1.25;
  if (/[=*/+-]|sin|cos|định luật|công thức|tỉ lệ/i.test(rText)) reasoningScore += 1.0;
  if (matchedKeywords.length >= 3) reasoningScore += 0.75;
  reasoningScore = Math.min(3, Number(reasoningScore.toFixed(2)));

  const total = Number((claimScore + evidenceScore + reasoningScore).toFixed(2));

  const feedback = [];
  if (claimScore < 2.5) {
    feedback.push('Luận điểm (Claim) cần nêu rõ mối quan hệ định lượng giữa biến độc lập và biến phụ thuộc.');
  } else {
    feedback.push('Luận điểm (Claim) rõ ràng, bám sát quy luật Vật lí.');
  }

  if (evidenceScore < 3.0) {
    feedback.push('Bằng chứng (Evidence) cần trích dẫn ít nhất 2–3 cặp số liệu cụ thể kèm đơn vị từ bảng đo.');
  } else {
    feedback.push(`Bằng chứng (Evidence) xuất sắc: đã dẫn chứng ${numbersFound.length} mốc số liệu thực đo.`);
  }

  if (reasoningScore < 2.5) {
    feedback.push('Giải thích (Reasoning) nên trích dẫn rõ công thức hoặc định luật Vật lí giải thích tại sao số liệu biến thiên như vậy.');
  } else {
    feedback.push('Lập luận (Reasoning) chặt chẽ, kết nối tốt giữa mô hình toán học và thực nghiệm.');
  }

  return {
    total,
    claimScore,
    evidenceScore,
    reasoningScore,
    feedback,
  };
}

export default function PhysicsInquiryWorkbench({ simId = 'projectile', onAskAI }) {
  const config = INQUIRY_LAB_CONFIGS[simId] || INQUIRY_LAB_CONFIGS.projectile;

  const [activeTab, setActiveTab] = useState('missions'); // missions | inqits | cer
  const [missionInputs, setMissionInputs] = useState({});
  const [missionResults, setMissionResults] = useState({});
  const [openHints, setOpenHints] = useState({});
  const [trials, setTrials] = useState(config.defaultTrials);
  const [claim, setClaim] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [cerGrade, setCerGrade] = useState(null);

  useEffect(() => {
    const nextCfg = INQUIRY_LAB_CONFIGS[simId] || INQUIRY_LAB_CONFIGS.projectile;
    setTrials(nextCfg.defaultTrials);
    setOpenHints({});
    setClaim('');
    setEvidence('');
    setReasoning('');
    setCerGrade(null);
  }, [simId]);

  const inquiryEval = useMemo(() => evaluateInquiryTrials(trials), [trials]);

  const completedMissionCount = useMemo(
    () => config.missions.filter((m) => missionResults[m.id]?.passed).length,
    [config.missions, missionResults]
  );

  // Tính tọa độ đồ thị SVG thực nghiệm Y theo X từ bảng trials
  const svgPlot = useMemo(() => {
    const valid = trials.filter(
      (t) => Number.isFinite(Number(t.indep)) && Number.isFinite(Number(t.dep))
    );
    if (valid.length < 2) return null;
    const xs = valid.map((t) => Number(t.indep));
    const ys = valid.map((t) => Number(t.dep));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(1e-6, maxX - minX);
    const spanY = Math.max(1e-6, maxY - minY);
    const baseCtrl = Number(valid[0].ctrl);

    const pts = valid.map((t, idx) => {
      const px = 36 + ((Number(t.indep) - minX) / spanX) * 204;
      const py = 104 - ((Number(t.dep) - minY) / spanY) * 74;
      const ctrlViolated = Number(t.ctrl) !== baseCtrl;
      return {
        idx: idx + 1,
        px: Number(px.toFixed(1)),
        py: Number(py.toFixed(1)),
        xVal: t.indep,
        yVal: t.dep,
        ctrlVal: t.ctrl,
        ctrlViolated,
      };
    });
    const polyline = pts.map((p) => `${p.px},${p.py}`).join(' ');
    return { pts, polyline, minX, maxX, minY, maxY };
  }, [trials]);

  const checkMission = (mission, overrideValue) => {
    const raw = String(overrideValue ?? missionInputs[mission.id] ?? '')
      .replace(',', '.')
      .trim();
    const val = Number(raw);
    if (!raw || Number.isNaN(val)) {
      setMissionResults((prev) => ({
        ...prev,
        [mission.id]: {
          passed: false,
          msg: 'Vui lòng nhập số liệu đo được trước khi kiểm tra.',
        },
      }));
      return;
    }
    const diff = Math.abs(val - mission.target);
    const relErrPct =
      Math.abs(mission.target) > 1e-9
        ? ((diff / Math.abs(mission.target)) * 100).toFixed(2)
        : '0.00';
    const passed = diff <= mission.tolerance;
    setMissionResults((prev) => ({
      ...prev,
      [mission.id]: {
        passed,
        measured: val,
        diff: diff.toFixed(2),
        relErrPct,
        msg: passed
          ? `Đạt chuẩn thực nghiệm! Giá trị chuẩn: ${mission.target} ${mission.unit} (Sai số tuyệt đối Δ = ${diff.toFixed(2)} ${mission.unit} · Sai số tỉ đối δ = ${relErrPct}%).`
          : `Sai số vượt ngưỡng cho phép (±${mission.tolerance} ${mission.unit}): lệch Δ = ${diff.toFixed(2)} ${mission.unit} (${relErrPct}%). Xem công thức gợi ý để đo lại!`,
      },
    }));
  };

  const updateTrialCell = (idx, field, value) => {
    setTrials((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value === '' ? '' : Number(value) } : row))
    );
  };

  const addTrialRow = () => {
    setTrials((prev) => {
      const last = prev[prev.length - 1] || { indep: 1, ctrl: 1, dep: 1 };
      return [
        ...prev,
        {
          id: Date.now(),
          indep: Number((Number(last.indep) + 10).toFixed(2)),
          ctrl: last.ctrl,
          dep: last.dep,
        },
      ];
    });
  };

  const fillEvidenceFromTrials = () => {
    const lines = trials
      .map(
        (t, idx) =>
          `Lần ${idx + 1}: ${config.indepVar.label} = ${t.indep}, ${config.ctrlVar.label} = ${t.ctrl} → ${config.depVar.label} = ${t.dep}`
      )
      .join('; ');
    setEvidence(`Số liệu thực nghiệm đo được trên hệ thống: ${lines}.`);
  };

  const fillSampleCer = () => {
    setClaim(config.cerPresets.claim);
    fillEvidenceFromTrials();
    setReasoning(config.cerPresets.reasoning);
    const sampleEvidence = `Số liệu thực nghiệm đo được trên hệ thống: ${trials
      .map(
        (t, idx) =>
          `Lần ${idx + 1}: ${config.indepVar.label} = ${t.indep}, ${config.ctrlVar.label} = ${t.ctrl} → ${config.depVar.label} = ${t.dep}`
      )
      .join('; ')}.`;
    setCerGrade(
      gradeCerReport({
        claim: config.cerPresets.claim,
        evidence: sampleEvidence,
        reasoning: config.cerPresets.reasoning,
        config,
      })
    );
  };

  const handleGradeCer = () => {
    const res = gradeCerReport({ claim, evidence, reasoning, config });
    setCerGrade(res);
  };

  return (
    <section className="pl-inquiry-deck" aria-label="Phòng Đánh giá Năng lực Thực hành Khoa học Inq-ITS & CER">
      <div className="pl-inq-header">
        <div className="pl-inq-brand">
          <span className="pl-inq-kicker">QUY TRÌNH THỰC NGHIỆM 3 BƯỚC · INQ-ITS TELEMETRY · GIZMOS · CER RUBRIC</span>
          <h3>Đánh Giá Năng Lực Thực Hành: {config.title}</h3>
        </div>

        <div className="pl-inq-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'missions'}
            className={`pl-inq-tab${activeTab === 'missions' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('missions')}
          >
            <IcoTarget />
            <span>Bước 1 · Nhiệm vụ Đo đạc ({completedMissionCount}/3)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inqits'}
            className={`pl-inq-tab${activeTab === 'inqits' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('inqits')}
          >
            <IcoShieldCheck />
            <span>Bước 2 · Kiểm soát biến &amp; Đồ thị</span>
            <em className={`pl-inq-dot is-${inquiryEval.status}`} />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cer'}
            className={`pl-inq-tab${activeTab === 'cer' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('cer')}
          >
            <IcoClipboard />
            <span>Bước 3 · Báo cáo CER (10đ)</span>
            {cerGrade && <strong className="pl-inq-score-pill">{cerGrade.total}/10đ</strong>}
          </button>
        </div>
      </div>

      {/* TAB 1: NHIỆM VỤ THỰC NGHIỆM (GIZMOS EXPLORATION SHEET) */}
      {activeTab === 'missions' && (
        <div className="pl-inq-missions-grid">
          {config.missions.map((m, idx) => {
            const res = missionResults[m.id];
            const hintOpen = Boolean(openHints[m.id]);
            return (
              <article
                key={m.id}
                className={`pl-mission-card${res?.passed ? ' is-passed' : ''}`}
              >
                <div className="pl-mission-top">
                  <span className="pl-mission-step">NHIỆM VỤ 0{idx + 1}</span>
                  <span className={`pl-mission-tier tier-${idx + 1}`}>{m.tier}</span>
                </div>
                <h4>{m.title}</h4>
                <p>{m.prompt}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="pl-btn-ghost"
                    style={{ fontSize: '11.2px', padding: '3px 8px' }}
                    onClick={() => setOpenHints((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                  >
                    {hintOpen ? 'Ẩn công thức gốc' : 'Xem công thức & ngưỡng sai số'}
                  </button>
                  <button
                    type="button"
                    className="pl-btn-ghost"
                    style={{ fontSize: '11.2px', padding: '3px 8px' }}
                    onClick={() => {
                      setMissionInputs((prev) => ({ ...prev, [m.id]: String(m.target) }));
                      checkMission(m, m.target);
                    }}
                    title="Điền nhanh kết quả đo chuẩn để kiểm thử"
                  >
                    Điền số đo chuẩn ({m.target})
                  </button>
                </div>

                {hintOpen && (
                  <div
                    style={{
                      padding: '7px 10px',
                      borderRadius: 9,
                      background: 'rgba(47, 107, 255, 0.08)',
                      borderLeft: '3px solid #2f6bff',
                      fontSize: '11.6px',
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Cơ sở tính:</strong> {m.formulaHint} (Ngưỡng sai số cho phép: ±{m.tolerance} {m.unit}).
                  </div>
                )}

                <div className="pl-mission-input-row">
                  <div className="pl-mission-field">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={`Nhập số đo (${m.unit})...`}
                      value={missionInputs[m.id] ?? ''}
                      onChange={(e) =>
                        setMissionInputs((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') checkMission(m);
                      }}
                    />
                    <span>{m.unit}</span>
                  </div>
                  <button
                    type="button"
                    className="pl-mission-check-btn"
                    onClick={() => checkMission(m)}
                  >
                    <IcoCheck />
                    <span>Chấm sai số</span>
                  </button>
                </div>

                {res && (
                  <div className={`pl-mission-feedback ${res.passed ? 'is-ok' : 'is-err'}`}>
                    {res.msg}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* TAB 2: INQ-ITS REX TELEMETRY — KIỂM ĐỊNH PHƯƠNG PHÁP KIỂM SOÁT BIẾN & ĐỒ THỊ XU HƯỚNG */}
      {activeTab === 'inqits' && (
        <div className="pl-inq-telemetry-layout">
          <div className="pl-inq-table-card">
            <div className="pl-inq-card-head">
              <div>
                <h4>Bảng Kiểm Định Biến Số Thực Nghiệm (Fair Test Matrix)</h4>
                <p>Nguyên tắc Khoa học: Chỉ biến thiên <strong>1 Biến độc lập (X)</strong> và giữ cố định tuyệt đối <strong>Biến kiểm soát (C)</strong> qua các lần đo.</p>
              </div>
              <div className="pl-inq-preset-btns">
                <button
                  type="button"
                  className="pl-btn-ghost"
                  onClick={() => setTrials(config.defaultTrials)}
                >
                  Nạp mẫu Chuẩn (Cố định biến)
                </button>
                <button
                  type="button"
                  className="pl-btn-ghost"
                  onClick={() => setTrials(config.flawedTrials)}
                >
                  Thử mẫu Lỗi (Đổi 2 biến cùng lúc)
                </button>
                <button
                  type="button"
                  className="pl-btn-ghost"
                  onClick={addTrialRow}
                >
                  + Thêm lần đo
                </button>
              </div>
            </div>

            <div className="pl-table-wrap">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>Lần đo</th>
                    <th>Biến độc lập (X): {config.indepVar.label}</th>
                    <th>Biến kiểm soát (C): {config.ctrlVar.label}</th>
                    <th>Kết quả đo (Y): {config.depVar.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((row, idx) => {
                    const ctrlChanged = idx > 0 && Number(row.ctrl) !== Number(trials[0].ctrl);
                    return (
                      <tr key={row.id || idx}>
                        <td><strong>#{idx + 1}</strong></td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            className="pl-trial-input"
                            value={row.indep}
                            onChange={(e) => updateTrialCell(idx, 'indep', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            className="pl-trial-input"
                            style={
                              ctrlChanged
                                ? { borderColor: '#ef4444', background: 'rgba(239,68,68,0.08)', color: '#b91c1c' }
                                : undefined
                            }
                            value={row.ctrl}
                            onChange={(e) => updateTrialCell(idx, 'ctrl', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            className="pl-trial-input"
                            value={row.dep}
                            onChange={(e) => updateTrialCell(idx, 'dep', e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`pl-inq-coach-card status-${inquiryEval.status}`}>
            <div className="pl-inq-coach-top">
              <span className="pl-inq-coach-badge">
                {inquiryEval.status === 'verified' ? <IcoCheck /> : <IcoWarn />}
                <span>{inquiryEval.badge}</span>
              </span>
              <strong className="pl-inq-coach-score">{inquiryEval.score}/100</strong>
            </div>

            <p className="pl-inq-coach-msg">{inquiryEval.message}</p>

            {/* Đồ thị SVG trực quan hóa dữ liệu đo Y theo X ngay trong thẻ Inq-ITS */}
            {svgPlot && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'var(--pl-surface, #fff)',
                  border: '1px solid var(--pl-border, rgba(47,107,255,0.2))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#2f6bff', marginBottom: 4 }}>
                  <span>Đồ thị thực nghiệm Y theo X ({trials.length} điểm đo)</span>
                  <span>{inquiryEval.status === 'verified' ? 'Đường cong chuẩn' : 'Dữ liệu bị nhiễu biến'}</span>
                </div>
                <svg viewBox="0 0 260 122" style={{ width: '100%', height: 108, display: 'block' }}>
                  <line x1="32" y1="18" x2="32" y2="108" stroke="#94a3b8" strokeWidth="1.2" />
                  <line x1="32" y1="108" x2="248" y2="108" stroke="#94a3b8" strokeWidth="1.2" />
                  <polyline
                    fill="none"
                    stroke={inquiryEval.status === 'confounded' ? '#ef4444' : '#2f6bff'}
                    strokeWidth="2.4"
                    points={svgPlot.polyline}
                  />
                  {svgPlot.pts.map((p) => (
                    <g key={p.idx}>
                      <circle
                        cx={p.px}
                        cy={p.py}
                        r="4.5"
                        fill={p.ctrlViolated ? '#ef4444' : '#2f6bff'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <text
                        x={p.px}
                        y={Math.max(14, p.py - 7)}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="800"
                        fill={p.ctrlViolated ? '#dc2626' : '#1d4ed8'}
                      >
                        #{p.idx} ({p.yVal})
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}

            <div className="pl-inq-coach-actions">
              <button
                type="button"
                className="pl-btn-primary"
                onClick={() => {
                  fillEvidenceFromTrials();
                  setActiveTab('cer');
                }}
              >
                Chuyển số liệu sang Bước 3 (Báo cáo CER) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BÁO CÁO KHOA HỌC CER (CLAIM - EVIDENCE - REASONING) */}
      {activeTab === 'cer' && (
        <div className="pl-cer-layout">
          <div className="pl-cer-form">
            <div className="pl-cer-toolbar">
              <span>Khung báo cáo thực hành chuẩn NGSS / GDPT 2018 (Thang 10 điểm)</span>
              <div className="pl-cer-toolbar-btns">
                <button type="button" className="pl-btn-ghost" onClick={fillEvidenceFromTrials}>
                  1. Chèn số liệu từ Bảng đo
                </button>
                <button type="button" className="pl-btn-ghost" onClick={fillSampleCer}>
                  2. Điền mẫu CER chuẩn &amp; Chấm thử
                </button>
              </div>
            </div>

            <label className="pl-cer-field">
              <span><strong>C — Claim (Luận điểm · 3,0đ):</strong> Kết luận quy luật định lượng giữa biến độc lập và biến phụ thuộc.</span>
              <textarea
                rows={2}
                placeholder="VD: Khi giữ cố định vận tốc đầu v₀, tầm xa L đạt cực đại tại góc bắn 45°..."
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
              />
            </label>

            <label className="pl-cer-field">
              <span><strong>E — Evidence (Bằng chứng số liệu · 4,0đ):</strong> Trích dẫn ít nhất 3 cặp số liệu thực đo có đơn vị từ Bước 2.</span>
              <textarea
                rows={2}
                placeholder="Bấm 'Chèn số liệu từ Bảng đo' hoặc nhập các mốc số liệu thực tế..."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </label>

            <label className="pl-cer-field">
              <span><strong>R — Reasoning (Lập luận định luật · 3,0đ):</strong> Trích dẫn công thức hoặc định luật giải thích tại sao số liệu tuân theo quy luật đó.</span>
              <textarea
                rows={2}
                placeholder="VD: Theo công thức L = (v₀² · sin 2α)/g..."
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
              />
            </label>

            <div className="pl-cer-submit-row">
              <button type="button" className="pl-btn-primary" onClick={handleGradeCer}>
                <IcoCheck />
                <span>Chấm điểm Báo cáo CER (Rubric 10đ)</span>
              </button>
              {onAskAI && (
                <button
                  type="button"
                  className="pl-btn-ai"
                  onClick={() =>
                    onAskAI(
                      `Chấm điểm và nhận xét báo cáo thí nghiệm CER (${config.title}):\n- Claim: ${claim || '(chưa nhập)'}\n- Evidence: ${evidence || '(chưa nhập)'}\n- Reasoning: ${reasoning || '(chưa nhập)'}`
                    )
                  }
                >
                  <IcoSpark />
                  <span>Nhờ Bé Elec AI Nhận Xét Sâu</span>
                </button>
              )}
            </div>
          </div>

          <div className="pl-cer-result-card">
            <h4>Bảng Điểm Thành Phần Rubric CER</h4>
            {cerGrade ? (
              <>
                <div className="pl-cer-total-box">
                  <strong>{cerGrade.total}<span>/10</span></strong>
                  <small>
                    {cerGrade.total >= 8.5
                      ? 'Đạt chuẩn Thực nghiệm Xuất sắc'
                      : cerGrade.total >= 6.5
                        ? 'Đạt yêu cầu — Cần bổ sung dẫn chứng'
                        : 'Cần hoàn thiện thêm số liệu & công thức'}
                  </small>
                </div>

                <div className="pl-cer-bars">
                  <div className="pl-cer-bar-row">
                    <span>C · Claim (Luận điểm khoa học)</span>
                    <b>{cerGrade.claimScore} / 3,0đ</b>
                  </div>
                  <div className="pl-cer-bar-row">
                    <span>E · Evidence (Dẫn chứng số liệu đo)</span>
                    <b>{cerGrade.evidenceScore} / 4,0đ</b>
                  </div>
                  <div className="pl-cer-bar-row">
                    <span>R · Reasoning (Giải thích bằng định luật)</span>
                    <b>{cerGrade.reasoningScore} / 3,0đ</b>
                  </div>
                </div>

                <ul className="pl-cer-feedback-list">
                  {cerGrade.feedback.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="pl-cer-empty">
                Hoàn thành 3 mục <strong>Claim · Evidence · Reasoning</strong> bên trái (hoặc bấm <strong>Điền mẫu CER chuẩn &amp; Chấm thử</strong>) để nhận bảng chấm điểm thành phần ngay lập tức.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
