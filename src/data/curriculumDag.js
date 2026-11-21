/* ============================================================
   curriculumDag.js — ĐỒ THỊ KIẾN THỨC CHUẨN GDPT 2018 (THPT 2025–2026)
   ------------------------------------------------------------
   Nguồn chân lý duy nhất cho Lộ trình Siêu VIP (ELEC Roadmap Studio Pro):
     • Hóa học  (22 chuyên đề · 5 chặng · đúng toàn bộ ID CHEM_TOPICS)
     • Vật lí   (14 chuyên đề · 5 chặng · sửa Từ trường → Lớp 12, tách
                 Vật lí nhiệt & Khí lí tưởng, đủ 6 chương nền Lớp 10)
     • Sinh học (13 chuyên đề · 5 chặng · xóa trùng lặp 10/12, đặt
                 Di truyền Quần thể trước Tiến hóa, tách Sinh thái học)

   Mỗi node lưu:
     - prereq: danh sách ID tiên quyết khoa học (Đồ thị DAG không chu trình)
     - dedicatedChapterId: ánh xạ chắc chắn tới bài học thật trong DEDICATED_LESSONS
     - examWeight & examParts: trọng số thật trong đề thi THPT 2025–2026
       (Phần I: 18 câu / 4.5đ · Phần II Đúng/Sai: 4 câu / 4.0đ · Phần III: 6 câu / 1.5đ)
     - useCasio: gợi ý mở nhanh Casio fx-580VN X Studio Pro cho chuyên đề tính toán
   ============================================================ */

export const SUBJECT_META = {
  hoa: {
    key: 'hoa',
    name: 'Hóa học',
    shortName: 'Hóa',
    examMinutes: 50,
    totalQuestions: 28,
    structureLabel: '18 Phần I · 4 Đúng/Sai · 6 Trả lời ngắn',
    accent: '#2f6bff',
    tagline: 'Chuẩn danh pháp IUPAC · Phổ IR/MS · Pin điện & Phức chất GDPT 2018',
  },
  ly: {
    key: 'ly',
    name: 'Vật lí',
    shortName: 'Lý',
    examMinutes: 50,
    totalQuestions: 28,
    structureLabel: '18 Phần I · 4 Đúng/Sai · 6 Trả lời ngắn',
    accent: '#0ea5e9',
    tagline: 'Chuẩn GDPT 2018 · Vật lí nhiệt · Khí lí tưởng · Từ trường 12 & Hạt nhân',
  },
  sinh: {
    key: 'sinh',
    name: 'Sinh học',
    shortName: 'Sinh',
    examMinutes: 50,
    totalQuestions: 28,
    structureLabel: '18 Phần I · 4 Đúng/Sai · 6 Trả lời ngắn',
    accent: '#10b981',
    tagline: 'Chuẩn GDPT 2018 · Di truyền phân tử · Quy luật · Quần thể · Tiến hóa & Sinh thái',
  },
};

export const SUBJECT_ORDER = ['hoa', 'ly', 'sinh'];

/* Ánh xạ Tổ hợp xét tuyển → Môn KHTN ưu tiên trong Lộ trình */
export const TRACK_SUBJECTS = {
  A00: ['ly', 'hoa'],
  A01: ['ly'],
  A02: ['ly', 'sinh'],
  B00: ['hoa', 'sinh'],
  B08: ['sinh'],
  C01: ['ly'],
  C02: ['hoa'],
  D07: ['hoa'],
  D08: ['sinh'],
  D90: ['hoa', 'ly', 'sinh'],
};

export function getSubjectsForBlock(block) {
  if (!block) return ['hoa', 'ly', 'sinh'];
  const code = String(block).trim().toUpperCase().split(/[\s(]/)[0];
  return TRACK_SUBJECTS[code] || ['hoa', 'ly', 'sinh'];
}

/* ============================================================
   1. CHẶNG SƯ PHẠM RIÊNG CHO TỪNG MÔN (5 CHẶNG LIỀN MẠCH)
   ============================================================ */
export const SUBJECT_STAGES = {
  hoa: [
    {
      id: 'hoa-s1',
      code: 'C1',
      subject: 'hoa',
      stageLabel: 'CHẶNG 1 · GỐC VI MÔ & PHẢN ỨNG (LỚP 10)',
      title: 'Nguyên tử, Bảng tuần hoàn, Liên kết & Oxi hóa – Khử',
      targetBand: '5.0 → 6.0đ',
      examFocus: 'Khóa gốc cấu hình e, bảo toàn electron & biến thiên Enthalpy',
      tone: 'cobalt',
    },
    {
      id: 'hoa-s2',
      code: 'C2',
      subject: 'hoa',
      stageLabel: 'CHẶNG 2 · CÂN BẰNG & VÔ CƠ THỰC TIỄN (LỚP 11)',
      title: 'Cân bằng hóa học, pH, Chuẩn độ & Nitrogen – Sulfur',
      targetBand: '6.25 → 7.0đ',
      examFocus: 'Đòn bẩy cho Phần II Đúng/Sai thí nghiệm & quy trình Haber/Tiếp xúc',
      tone: 'sky',
    },
    {
      id: 'hoa-s3',
      code: 'C3',
      subject: 'hoa',
      stageLabel: 'CHẶNG 3 · XƯƠNG SỐNG HỮU CƠ & PHỔ IR/MS (LỚP 11)',
      title: 'Đại cương Hữu cơ, Hydrocarbon, Alcohol & Carbonyl',
      targetBand: '7.25 → 8.0đ',
      examFocus: 'Đọc phổ hồng ngoại IR/MS & nắm chắc phản ứng nhóm chức dẫn vào Lớp 12',
      tone: 'royal',
    },
    {
      id: 'hoa-s4',
      code: 'C4',
      subject: 'hoa',
      stageLabel: 'CHẶNG 4 · HỮU CƠ 12 TRỌNG TÂM ĐỀ THI (PHẦN II & III)',
      title: 'Ester – Lipid, Carbohydrate, Amine – Peptide & Polymer',
      targetBand: '8.25 → 9.0đ',
      examFocus: 'Chiếm ~40% điểm đề THPT 2025–2026: Xà phòng hóa, Điện di pI & Trùng ngưng',
      tone: 'gold',
    },
    {
      id: 'hoa-s5',
      code: 'C5',
      subject: 'hoa',
      stageLabel: 'CHẶNG 5 · ĐIỆN HÓA, KIM LOẠI & PHỨC CHẤT 9.5+',
      title: 'Pin điện – Điện phân, Đại cương Kim loại, IA/IIA & Phức chất',
      targetBand: '9.25 → 10đ',
      examFocus: 'Phân loại Thủ khoa A00/B00: Điện phân Faraday, Phức chất bát diện & Chuẩn độ',
      tone: 'super',
    },
  ],

  ly: [
    {
      id: 'ly-s1',
      code: 'C1',
      subject: 'ly',
      stageLabel: 'CHẶNG 1 · CƠ HỌC & CÁC ĐỊNH LUẬT BẢO TOÀN (LỚP 10)',
      title: 'Động học, Newton, Năng lượng, Động lượng & Chuyển động tròn',
      targetBand: '5.0 → 6.0đ',
      examFocus: 'Gốc phân tích lực, đồ thị v–t và bảo toàn cơ năng – động lượng',
      tone: 'cobalt',
    },
    {
      id: 'ly-s2',
      code: 'C2',
      subject: 'ly',
      stageLabel: 'CHẶNG 2 · DAO ĐỘNG & SÓNG (LỚP 11)',
      title: 'Dao động điều hòa, Sóng cơ, Sóng điện từ, Giao thoa & Sóng dừng',
      targetBand: '6.25 → 7.25đ',
      examFocus: 'Nền tảng hàm điều hòa cos, pha dao động và giao thoa sóng',
      tone: 'sky',
    },
    {
      id: 'ly-s3',
      code: 'C3',
      subject: 'ly',
      stageLabel: 'CHẶNG 3 · ĐIỆN TRƯỜNG & MẠCH ĐIỆN (LỚP 11)',
      title: 'Điện trường, Tụ điện, Dòng điện không đổi & Nguồn điện',
      targetBand: '7.5 → 8.0đ',
      examFocus: 'Xương sống mạch điện & công suất chuẩn bị thẳng cho Từ trường 12',
      tone: 'royal',
    },
    {
      id: 'ly-s4',
      code: 'C4',
      subject: 'ly',
      stageLabel: 'CHẶNG 4 · VẬT LÍ NHIỆT & KHÍ LÍ TƯỞNG (LỚP 12 · MỚI)',
      title: 'Định luật I Nhiệt động lực học, Nhiệt chuyển thể & Khí lí tưởng',
      targetBand: '8.25 → 9.0đ',
      examFocus: 'Trọng tâm lớn nhất đề mới 2025–2026: Thí nghiệm nhiệt & đồ thị p–V–T',
      tone: 'gold',
    },
    {
      id: 'ly-s5',
      code: 'C5',
      subject: 'ly',
      stageLabel: 'CHẶNG 5 · TỪ TRƯỜNG 12 & VẬT LÍ HẠT NHÂN (9.5+)',
      title: 'Từ trường, Cảm ứng Faraday, Máy phát xoay chiều & Phóng xạ',
      targetBand: '9.25 → 10đ',
      examFocus: 'Khóa trọn Phần III điền số: Cảm ứng điện từ, Suất điện động & Phóng xạ',
      tone: 'super',
    },
  ],

  sinh: [
    {
      id: 'sinh-s1',
      code: 'C1',
      subject: 'sinh',
      stageLabel: 'CHẶNG 1 · TẾ BÀO HỌC & VI SINH VẬT (LỚP 10)',
      title: 'Cấu trúc tế bào, Chuyển hóa năng lượng, Phân bào & Virus',
      targetBand: '5.0 → 6.0đ',
      examFocus: 'Nền tảng bào quan, Quang hợp – Hô hấp tế bào & Nguyên phân – Giảm phân',
      tone: 'cobalt',
    },
    {
      id: 'sinh-s2',
      code: 'C2',
      subject: 'sinh',
      stageLabel: 'CHẶNG 2 · SINH LÍ CƠ THỂ & NỘI MÔI (LỚP 11)',
      title: 'Sinh lí Thực vật C3/C4/CAM & Sinh lí Động vật – Miễn dịch',
      targetBand: '6.25 → 7.0đ',
      examFocus: 'Chuyên khai thác câu hỏi thực tiễn y sinh & Phần II Đúng/Sai đồ thị',
      tone: 'sky',
    },
    {
      id: 'sinh-s3',
      code: 'C3',
      subject: 'sinh',
      stageLabel: 'CHẶNG 3 · DI TRUYỀN PHÂN TỬ & TẾ BÀO (LỚP 12)',
      title: 'DNA – Phiên mã – Dịch mã, Operon Lac & Đột biến NST',
      targetBand: '7.25 → 8.25đ',
      examFocus: 'Mạch lõi cấp phân tử & tế bào dẫn thẳng vào mọi quy luật di truyền',
      tone: 'royal',
    },
    {
      id: 'sinh-s4',
      code: 'C4',
      subject: 'sinh',
      stageLabel: 'CHẶNG 4 · QUY LUẬT DI TRUYỀN & QUẦN THỂ (LỚP 12)',
      title: 'Mendel – Tương tác gene, Hoán vị Morgan & Hardy–Weinberg',
      targetBand: '8.5 → 9.25đ',
      examFocus: 'Cụm bài toán định lượng trọng tâm Phần II & Phần III đề B00',
      tone: 'gold',
    },
    {
      id: 'sinh-s5',
      code: 'C5',
      subject: 'sinh',
      stageLabel: 'CHẶNG 5 · PHẢ HỆ, TIẾN HÓA & SINH THÁI HỌC (9.5+)',
      title: 'Di truyền Người – Phả hệ, Tiến hóa hiện đại & Hệ sinh thái',
      targetBand: '9.5 → 10đ',
      examFocus: 'Khóa bài toán xác suất Phả hệ Y Dược & câu thực địa Sinh thái học',
      tone: 'super',
    },
  ],
};

/* ============================================================
   2. DANH MỤC 49 CHUYÊN ĐỀ KHTN VỚI ĐỒ THỊ DAG CHUẨN GDPT 2018
   ============================================================ */
export const CURRICULUM_NODES = [
  /* ===================== HÓA HỌC (22 CHUYÊN ĐỀ) ===================== */
  {
    id: 'c10-atom',
    subject: 'hoa',
    grade: 10,
    stageId: 'hoa-s1',
    order: 1,
    code: '10.1',
    name: 'Cấu tạo nguyên tử',
    desc: 'Thành phần nguyên tử, đồng vị, orbital và cấu hình electron theo phân lớp năng lượng.',
    prereq: [],
    dedicatedChapterId: 'c10-atom',
    examWeight: 4,
    questionsInExam: '1 câu',
    weightLabel: 'Gốc cấu hình electron',
    examParts: { part1: 70, part2: 15, part3: 15 },
    formulas: ['A = Z + N', 'A_tb = Σ(Aᵢ · xᵢ) / 100', '1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s²'],
    keyTrap: 'Bẫy cấu hình bán bão hòa Cr (3d⁵4s¹) & bão hòa Cu (3d¹⁰4s¹); nhầm 2Z với Z.',
    bridge: 'Khởi đầu Hóa học THPT → mở thẳng sang Bảng tuần hoàn & Liên kết hóa học.',
    useCasio: true,
  },
  {
    id: 'c10-periodic',
    subject: 'hoa',
    grade: 10,
    stageId: 'hoa-s1',
    order: 2,
    code: '10.2',
    name: 'Bảng tuần hoàn & Định luật tuần hoàn',
    desc: 'Cấu trúc bảng tuần hoàn, xu hướng biến đổi bán kính, độ âm điện và tính kim loại – phi kim.',
    prereq: ['c10-atom'],
    dedicatedChapterId: 'c10-periodic',
    examWeight: 4,
    questionsInExam: '1 câu',
    weightLabel: 'Quy luật tuần hoàn',
    examParts: { part1: 75, part2: 20, part3: 5 },
    formulas: ['STT = Z · Chu kì = Số lớp e', 'Trong chu kì: R ↓ · χ ↑ · Phi kim ↑'],
    keyTrap: 'So sánh bán kính ion đẳng electron (O²⁻ > F⁻ > Na⁺ > Mg²⁺ > Al³⁺).',
    bridge: 'Từ cấu hình electron suy ra vị trí, hóa trị và quy luật nhóm IA, IIA, VIIA.',
    useCasio: false,
  },
  {
    id: 'c10-bonding',
    subject: 'hoa',
    grade: 10,
    stageId: 'hoa-s1',
    order: 3,
    code: '10.3',
    name: 'Liên kết hóa học',
    desc: 'Quy tắc octet, liên kết ion, cộng hóa trị, liên kết hydrogen và tương tác van der Waals.',
    prereq: ['c10-periodic'],
    dedicatedChapterId: 'c10-bonding',
    examWeight: 4,
    questionsInExam: '1 câu',
    weightLabel: 'Giải thích nhiệt độ sôi & độ tan',
    examParts: { part1: 65, part2: 30, part3: 5 },
    formulas: ['Δχ ≥ 1,7 → Liên kết ion', 'Liên kết H: O–H···O, N–H···O'],
    keyTrap: 'Nhiệt độ sôi cùng M: Carboxylic acid > Alcohol > Aldehyde/Ester.',
    bridge: 'Nền tảng giải thích tính chất vật lí xuyên suốt toàn bộ Hóa học hữu cơ 11–12.',
    useCasio: false,
  },
  {
    id: 'c10-redox',
    subject: 'hoa',
    grade: 10,
    stageId: 'hoa-s1',
    order: 4,
    code: '10.4',
    name: 'Phản ứng oxi hóa – khử',
    desc: 'Số oxi hóa, chất khử – chất oxi hóa và cân bằng nhanh theo phương pháp thăng bằng electron.',
    prereq: ['c10-bonding'],
    dedicatedChapterId: 'c10-redox',
    examWeight: 7,
    questionsInExam: '1–2 câu',
    weightLabel: 'Công cụ Bảo toàn e cốt lõi',
    examParts: { part1: 45, part2: 25, part3: 30 },
    formulas: ['∑n_e nhường = ∑n_e nhận', 'Khử tăng – Oxi hóa giảm'],
    keyTrap: 'Bỏ quên môi trường tạo muối khi cân bằng phản ứng với HNO₃, H₂SO₄ đặc.',
    bridge: 'Công cụ định lượng xương sống nối trực tiếp lên Nitrogen–Sulfur & Pin điện – Điện phân 12.',
    useCasio: true,
  },
  {
    id: 'c10-energy',
    subject: 'hoa',
    grade: 10,
    stageId: 'hoa-s1',
    order: 5,
    code: '10.5',
    name: 'Năng lượng hóa học (Enthalpy)',
    desc: 'Biến thiên enthalpy chuẩn, phản ứng tỏa nhiệt – thu nhiệt và tính theo ΔfH° hoặc năng lượng liên kết Eb.',
    prereq: ['c10-bonding'],
    dedicatedChapterId: 'c10-energy',
    examWeight: 6,
    questionsInExam: '1–2 câu',
    weightLabel: 'Mới GDPT 2018 · Hay ra Phần III',
    examParts: { part1: 35, part2: 25, part3: 40 },
    formulas: ['ΔrH° = ∑ΔfH°(sp) − ∑ΔfH°(cđ)', 'ΔrH° = ∑Eb(cđ) − ∑Eb(sp)'],
    keyTrap: 'Đảo ngược dấu giữa công thức nhiệt tạo thành (Sau − Trước) và năng lượng liên kết (Trước − Sau).',
    bridge: 'Xác định chiều tỏa/thu nhiệt để biện luận chuyển dịch cân bằng Le Chatelier ở Lớp 11.',
    useCasio: true,
  },
  {
    id: 'c10-rate',
    subject: 'hoa',
    grade: 10,
    stageId: 'hoa-s1',
    order: 6,
    code: '10.6',
    name: 'Tốc độ phản ứng',
    desc: 'Tốc độ trung bình, định luật tác dụng khối lượng, quy tắc Van’t Hoff và vai trò chất xúc tác.',
    prereq: ['c10-energy'],
    dedicatedChapterId: 'c10-rate',
    examWeight: 4,
    questionsInExam: '1 câu',
    weightLabel: 'Động hóa học & Xúc tác',
    examParts: { part1: 55, part2: 30, part3: 15 },
    formulas: ['v = k · C_A^a · C_B^b', 'v₂ / v₁ = γ^((T₂ − T₁)/10)'],
    keyTrap: 'Xúc tác giảm năng lượng hoạt hóa Ea nhưng KHÔNG làm chuyển dịch cân bằng.',
    bridge: 'Tiền đề trực tiếp dẫn sang trạng thái cân bằng động (v_thuận = v_nghịch) ở Lớp 11.',
    useCasio: true,
  },
  {
    id: 'c10-halogen',
    subject: 'hoa',
    grade: 10,
    stageId: 'hoa-s1',
    order: 7,
    code: '10.7',
    name: 'Nhóm Halogen',
    desc: 'Tính chất đơn chất F₂, Cl₂, Br₂, I₂, hydrogen halide, tính khử ion halide và ứng dụng khử trùng.',
    prereq: ['c10-periodic', 'c10-redox'],
    dedicatedChapterId: 'c10-halogen',
    examWeight: 5,
    questionsInExam: '1–2 câu',
    weightLabel: 'Phi kim điển hình',
    examParts: { part1: 60, part2: 30, part3: 10 },
    formulas: ['Tính OXH: F₂ > Cl₂ > Br₂ > I₂', 'Tính acid: HF < HCl < HBr < HI'],
    keyTrap: 'HF là acid yếu nhưng ăn mòn thủy tinh (SiO₂ + 4HF → SiF₄ + 2H₂O); AgF tan.',
    bridge: 'Ứng dụng trực tiếp Bảng tuần hoàn & Oxi hóa – khử vào họ nguyên tố đầu tiên.',
    useCasio: false,
  },

  /* Lớp 11 */
  {
    id: 'c11-equilibrium',
    subject: 'hoa',
    grade: 11,
    stageId: 'hoa-s2',
    order: 1,
    code: '11.1',
    name: 'Cân bằng hóa học & pH',
    desc: 'Phản ứng thuận nghịch, hằng số KC, nguyên lí Le Chatelier, thuyết Brønsted–Lowry và chuẩn độ acid – base.',
    prereq: ['c10-energy', 'c10-rate'],
    dedicatedChapterId: 'c11-equilibrium',
    examWeight: 8,
    questionsInExam: '2 câu',
    weightLabel: 'Trọng tâm pH & Chuẩn độ',
    examParts: { part1: 35, part2: 35, part3: 30 },
    formulas: ['KC = [C]^c[D]^d / ([A]^a[B]^b)', 'pH = −lg[H⁺] · pH + pOH = 14'],
    keyTrap: 'Tuyệt đối không đưa chất rắn (s) hoặc dung môi lỏng nguyên chất vào biểu thức KC.',
    bridge: 'Nối từ Tốc độ & Enthalpy 10 → nền tảng cho Haber, điện di pI và Pin điện hóa 12.',
    useCasio: true,
  },
  {
    id: 'c11-nitrogen',
    subject: 'hoa',
    grade: 11,
    stageId: 'hoa-s2',
    order: 2,
    code: '11.2',
    name: 'Nitrogen & Sulfur',
    desc: 'Chu trình Nitrogen, quy trình Haber tổng hợp NH₃, mưa acid, phú dưỡng và quy trình tiếp xúc H₂SO₄.',
    prereq: ['c10-redox', 'c11-equilibrium'],
    dedicatedChapterId: 'c11-nitrogen',
    examWeight: 6,
    questionsInExam: '1–2 câu',
    weightLabel: 'Vô cơ gắn thực tiễn & Môi trường',
    examParts: { part1: 50, part2: 40, part3: 10 },
    formulas: ['N₂ + 3H₂ ⇌ 2NH₃ (ΔH < 0)', 'SO₂ → SO₃ → H₂SO₄ (Oleum)'],
    keyTrap: 'Phú dưỡng (Eutrophication) do dư thừa hợp chất N, P trong nước; H₂SO₄ đặc hút nước tỏa nhiệt mạnh.',
    bridge: 'Ứng dụng thực chiến Cân bằng hóa học & Oxi hóa – Khử vào công nghiệp hóa chất.',
    useCasio: true,
  },
  {
    id: 'c11-organic-gen',
    subject: 'hoa',
    grade: 11,
    stageId: 'hoa-s3',
    order: 1,
    code: '11.3',
    name: 'Đại cương Hữu cơ & Phổ IR/MS',
    desc: 'Phương pháp tách biệt – tinh chế, phổ hồng ngoại IR, phổ khối lượng MS, đồng đẳng và đồng phân.',
    prereq: ['c10-bonding'],
    dedicatedChapterId: 'c11-organic-gen',
    examWeight: 8,
    questionsInExam: '1–2 câu',
    weightLabel: 'Phổ IR/MS mới GDPT 2018',
    examParts: { part1: 45, part2: 40, part3: 15 },
    formulas: ['k = (2C + 2 + N − H − X)/2', 'IR: C=O (~1700 cm⁻¹) · O–H (~3300 cm⁻¹)'],
    keyTrap: 'Đỉnh [M⁺] lớn nhất bên phải phổ MS cho biết phân tử khối M của hợp chất.',
    bridge: 'Cánh cửa vào toàn bộ Hữu cơ 11–12: tìm CTPT và nhóm chức bằng phổ học hiện đại.',
    useCasio: true,
  },
  {
    id: 'c11-hydrocarbon',
    subject: 'hoa',
    grade: 11,
    stageId: 'hoa-s3',
    order: 2,
    code: '11.4',
    name: 'Hydrocarbon',
    desc: 'Alkane, alkene, alkyne và arene: cấu trúc mạch carbon, đồng phân hình học cis–trans và phản ứng đặc trưng.',
    prereq: ['c11-organic-gen'],
    dedicatedChapterId: 'c11-hydrocarbon',
    examWeight: 7,
    questionsInExam: '2 câu',
    weightLabel: 'Khung mạch Carbon nền tảng',
    examParts: { part1: 50, part2: 30, part3: 20 },
    formulas: ['Alkane: CnH2n+2 · Alkene: CnH2n', 'Alk-1-yne + AgNO₃/NH₃ → ↓ vàng'],
    keyTrap: 'Chỉ alk-1-yne có H linh động ở C≡CH mới kết tủa với AgNO₃/NH₃; quy tắc cộng Markovnikov.',
    bridge: 'Chuẩn bị khung mạch carbon cho Alcohol, Carbonyl và phản ứng trùng hợp Polymer 12.',
    useCasio: true,
  },
  {
    id: 'c11-alcohol',
    subject: 'hoa',
    grade: 11,
    stageId: 'hoa-s3',
    order: 3,
    code: '11.5',
    name: 'Dẫn xuất Halogen · Alcohol · Phenol',
    desc: 'Phản ứng thế – tách của dẫn xuất halogen, tính chất nhóm –OH alcohol, polyalcohol với Cu(OH)₂ và phenol.',
    prereq: ['c11-hydrocarbon'],
    dedicatedChapterId: 'c11-alcohol',
    examWeight: 7,
    questionsInExam: '2 câu',
    weightLabel: 'Nửa nguyên liệu tạo Ester',
    examParts: { part1: 45, part2: 35, part3: 20 },
    formulas: ['ROH + Na → RONa + ½H₂', 'Phenol + 3Br₂ → 2,4,6-tribromophenol↓'],
    keyTrap: 'Phenol tan trong NaOH nhưng KHÔNG tác dụng với NaHCO₃ (acid yếu hơn H₂CO₃).',
    bridge: 'Nối trực tiếp sang phản ứng ester hóa và bài toán phân biệt ester của phenol lớp 12.',
    useCasio: true,
  },
  {
    id: 'c11-carbonyl',
    subject: 'hoa',
    grade: 11,
    stageId: 'hoa-s3',
    order: 4,
    code: '11.6',
    name: 'Hợp chất Carbonyl & Carboxylic acid',
    desc: 'Aldehyde, ketone, phản ứng tráng bạc Tollens, phản ứng iodoform và tính acid của carboxylic acid.',
    prereq: ['c11-alcohol'],
    dedicatedChapterId: 'c11-carbonyl',
    examWeight: 8,
    questionsInExam: '2 câu',
    weightLabel: 'Tráng bạc & Nhóm –COOH',
    examParts: { part1: 40, part2: 35, part3: 25 },
    formulas: ['RCHO → 2Ag↓ · HCHO → 4Ag↓', 'RCOCH₃ + I₂/NaOH → CHI₃↓ vàng'],
    keyTrap: 'Cả HCHO và HCOOH khi tráng bạc đều cho tỉ lệ 1 mol → 2 hoặc 4 mol Ag (HCHO cho 4Ag).',
    bridge: 'Dẫn trực tiếp vào Ester – Lipid, tráng bạc Carbohydrate và nhóm –COOH của Amino acid 12.',
    useCasio: true,
  },

  /* Lớp 12 */
  {
    id: 'c12-ester',
    subject: 'hoa',
    grade: 12,
    stageId: 'hoa-s4',
    order: 1,
    code: '12.1',
    name: 'Ester – Lipid',
    desc: 'Danh pháp IUPAC, phản ứng xà phòng hóa, chất béo (triglyceride), chỉ số acid/xà phòng hóa và chất giặt rửa.',
    prereq: ['c11-alcohol', 'c11-carbonyl'],
    dedicatedChapterId: 'c12-ester',
    examWeight: 13,
    questionsInExam: '3–4 câu',
    weightLabel: 'Trọng tâm số 1 Hữu cơ 12',
    examParts: { part1: 35, part2: 35, part3: 30 },
    formulas: ['RCOOR’ + NaOH → RCOONa + R’OH', 'm_ester + m_kiềm = m_rắn + m_alcohol + m_H₂O'],
    keyTrap: 'Ester của phenol (RCOOC₆H₄R’) phản ứng NaOH theo tỉ lệ 1:2 sinh 2 muối + H₂O.',
    bridge: 'Kết tinh từ Alcohol & Carboxylic acid 11 → trụ cột Phần II thí nghiệm & Phần III điền số.',
    useCasio: true,
  },
  {
    id: 'c12-carbohydrate',
    subject: 'hoa',
    grade: 12,
    stageId: 'hoa-s4',
    order: 2,
    code: '12.2',
    name: 'Carbohydrate',
    desc: 'Cấu trúc mạch vòng/hở của glucose, fructose, saccharose, maltose, tinh bột và cellulose.',
    prereq: ['c11-carbonyl'],
    dedicatedChapterId: 'c12-carbohydrate',
    examWeight: 11,
    questionsInExam: '2–3 câu',
    weightLabel: 'Trọng tâm sinh – hóa thực tiễn',
    examParts: { part1: 45, part2: 35, part3: 20 },
    formulas: ['(C₆H₁₀O₅)_n + nH₂O → nC₆H₁₂O₆', 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂'],
    keyTrap: 'Fructose không có nhóm –CHO nhưng vẫn tráng bạc vì đồng phân hóa thành Glucose trong kiềm.',
    bridge: 'Nối từ Polyalcohol & Aldehyde → mở sang cellulose bán tổng hợp trong chương Polymer.',
    useCasio: true,
  },
  {
    id: 'c12-amine',
    subject: 'hoa',
    grade: 12,
    stageId: 'hoa-s4',
    order: 3,
    code: '12.3',
    name: 'Amine, Amino acid, Peptide & Protein',
    desc: 'Tính base của amine, tính lưỡng tính và điện di theo điểm đẳng điện pI của amino acid, phản ứng biuret.',
    prereq: ['c11-equilibrium', 'c11-carbonyl'],
    dedicatedChapterId: 'c12-amine',
    examWeight: 13,
    questionsInExam: '3–4 câu',
    weightLabel: 'Phân loại Điện di pI & Peptide',
    examParts: { part1: 35, part2: 35, part3: 30 },
    formulas: ['pH < pI → Cation (về cực âm)', 'pH > pI → Anion (về cực dương)'],
    keyTrap: 'Dipeptide (1 liên kết peptide) KHÔNG cho phản ứng màu biuret tím với Cu(OH)₂/OH⁻.',
    bridge: 'Kết hợp Cân bằng pH (11) & nhóm chức –COOH → nền tảng sinh hóa & tơ polyamide (Nylon).',
    useCasio: true,
  },
  {
    id: 'c12-polymer',
    subject: 'hoa',
    grade: 12,
    stageId: 'hoa-s4',
    order: 4,
    code: '12.4',
    name: 'Polymer & Vật liệu Polymer',
    desc: 'Phản ứng trùng hợp – trùng ngưng, chất dẻo, tơ tự nhiên/bán tổng hợp/tổng hợp, cao su và vật liệu composite.',
    prereq: ['c11-hydrocarbon', 'c12-carbohydrate', 'c12-amine'],
    dedicatedChapterId: 'c12-polymer',
    examWeight: 8,
    questionsInExam: '2–3 câu',
    weightLabel: 'Dễ tối đa điểm Phần I & II',
    examParts: { part1: 60, part2: 30, part3: 10 },
    formulas: ['n = M_polymer / M_mắt xích', 'Lưu hóa cao su: tạo cầu nối –S–S–'],
    keyTrap: 'Tơ visco & tơ cellulose acetate là tơ BÁN TỔNG HỢP (nhân tạo), không phải tơ tổng hợp.',
    bridge: 'Tổng hợp toàn bộ monomer từ Hydrocarbon, Cellulose và Amino acid trước khi sang Vô cơ 12.',
    useCasio: true,
  },
  {
    id: 'c12-electro',
    subject: 'hoa',
    grade: 12,
    stageId: 'hoa-s5',
    order: 1,
    code: '12.5',
    name: 'Pin điện hóa & Điện phân',
    desc: 'Thế điện cực chuẩn E°, suất điện động pin Galvani, quy tắc alpha và định lượng điện phân Faraday.',
    prereq: ['c10-redox', 'c11-equilibrium'],
    dedicatedChapterId: 'c12-electro',
    examWeight: 13,
    questionsInExam: '3–4 câu',
    weightLabel: 'Trọng tâm mới & Phân loại Phần III',
    examParts: { part1: 30, part2: 35, part3: 35 },
    formulas: ['E°_pin = E°_cathode(+) − E°_anode(−)', 'm = A·I·t / (n·F) · F = 96500'],
    keyTrap: 'Pin Galvani: Anode là cực ÂM; Bình điện phân: Anode là cực DƯƠNG (cả hai đều xảy ra oxi hóa ở Anode).',
    bridge: 'Đỉnh cao Oxi hóa – Khử → nền tảng giải thích dãy điện hóa và ăn mòn ở Đại cương Kim loại.',
    useCasio: true,
  },
  {
    id: 'c12-metal',
    subject: 'hoa',
    grade: 12,
    stageId: 'hoa-s5',
    order: 2,
    code: '12.6',
    name: 'Đại cương về Kim loại',
    desc: 'Cấu tạo tinh thể, tính chất vật lí – hóa học chung, phương pháp tách kim loại, hợp kim và ăn mòn điện hóa.',
    prereq: ['c12-electro'],
    dedicatedChapterId: 'c12-metal',
    examWeight: 11,
    questionsInExam: '3–4 câu',
    weightLabel: 'Trọng tâm Vô cơ 12',
    examParts: { part1: 45, part2: 35, part3: 20 },
    formulas: ['Thủy luyện · Nhiệt luyện · Điện phân', 'Ăn mòn điện hóa: KL mạnh hơn bị ăn mòn (Anode)'],
    keyTrap: 'Fe + Fe³⁺ dư hoặc Cu²⁺ chỉ lên Fe²⁺; Fe + AgNO₃ dư mới lên Fe³⁺.',
    bridge: 'Nối từ Pin điện hóa → làm nền bắt buộc cho Kim loại nhóm IA, IIA và Kim loại chuyển tiếp.',
    useCasio: true,
  },
  {
    id: 'c12-metal-main',
    subject: 'hoa',
    grade: 12,
    stageId: 'hoa-s5',
    order: 3,
    code: '12.7',
    name: 'Kim loại nhóm IA, IIA & Aluminium',
    desc: 'Quy trình Solvay (NaHCO₃/Na₂CO₃), nước cứng và cách làm mềm, hợp chất calcium và tính lưỡng tính của Al.',
    prereq: ['c10-periodic', 'c12-metal'],
    dedicatedChapterId: 'c12-metal-main',
    examWeight: 9,
    questionsInExam: '2–3 câu',
    weightLabel: 'Thực tiễn Solvay & Nước cứng',
    examParts: { part1: 45, part2: 40, part3: 15 },
    formulas: ['Nước cứng tạm thời: Ca(HCO₃)₂, Mg(HCO₃)₂', 'Na₂CO₃ / Na₃PO₄ làm mềm mọi nước cứng'],
    keyTrap: 'Cho Na vào dung dịch CuSO₄: Na phản ứng với H₂O trước, sau đó NaOH mới tạo kết tủa Cu(OH)₂.',
    bridge: 'Vận dụng trực tiếp Đại cương Kim loại & Bảng tuần hoàn vào hóa học đời sống.',
    useCasio: true,
  },
  {
    id: 'c12-transition',
    subject: 'hoa',
    grade: 12,
    stageId: 'hoa-s5',
    order: 4,
    code: '12.8',
    name: 'Kim loại chuyển tiếp & Phức chất',
    desc: 'Đặc điểm kim loại chuyển tiếp dãy thứ nhất (Fe, Cu, Cr), phức chất bát diện – tứ diện và chuẩn độ KMnO₄.',
    prereq: ['c12-metal'],
    dedicatedChapterId: 'c12-transition',
    examWeight: 9,
    questionsInExam: '2 câu',
    weightLabel: 'Điểm 9.0–10 · Mới GDPT 2018',
    examParts: { part1: 30, part2: 35, part3: 35 },
    formulas: ['Phức chất: [M(L)_n]^(q±)', '5Fe²⁺ + MnO₄⁻ + 8H⁺ → 5Fe³⁺ + Mn²⁺ + 4H₂O'],
    keyTrap: 'Phân biệt số phối trí của nguyên tử trung tâm với số phối tử khi gặp phối tử đa càng (như en, EDTA).',
    bridge: 'Chuyên đề phân loại Thủ khoa 9.5–10đ kết hợp chuẩn độ oxi hóa – khử và hình học phức chất.',
    useCasio: true,
  },
  {
    id: 'c12-sustain',
    subject: 'hoa',
    grade: 12,
    stageId: 'hoa-s5',
    order: 5,
    code: '12.9',
    name: 'Hóa học xanh & Phát triển bền vững',
    desc: '12 nguyên tắc Hóa học xanh, hiệu suất nguyên tử (Atom Economy), năng lượng sạch và tái chế vật liệu.',
    prereq: ['c12-polymer', 'c12-metal-main'],
    dedicatedChapterId: 'c12-sustain',
    examWeight: 4,
    questionsInExam: '1 câu',
    weightLabel: 'Tổng kết Thực tiễn & Bền vững',
    examParts: { part1: 60, part2: 30, part3: 10 },
    formulas: ['AE% = (M_sản phẩm mong muốn / ∑M_sản phẩm) × 100%'],
    keyTrap: 'Phân biệt Hiệu suất phản ứng H% với Hiệu suất nguyên tử (Atom Economy – AE%).',
    bridge: 'Mảnh ghép tổng kết toàn chương trình Hóa THPT gắn với kinh tế tuần hoàn.',
    useCasio: true,
  },

  /* ===================== VẬT LÍ (14 CHUYÊN ĐỀ CHUẨN GDPT 2018) ===================== */
  {
    id: 'ly-c1-donghoc',
    subject: 'ly',
    grade: 10,
    stageId: 'ly-s1',
    order: 1,
    code: '10.1',
    name: 'Động học & Đồ thị chuyển động',
    desc: 'Độ dịch chuyển, tốc độ – vận tốc, đồ thị d–t & v–t, chuyển động biến đổi đều, rơi tự do và chuyển động ném.',
    prereq: [],
    dedicatedChapterId: 'ly-c1-donghoc',
    examWeight: 5,
    questionsInExam: '1–2 câu',
    weightLabel: 'Gốc phân tích đồ thị v–t',
    examParts: { part1: 65, part2: 25, part3: 10 },
    formulas: ['v = v₀ + a·t', 'v² − v₀² = 2a·d'],
    keyTrap: 'Phân biệt quãng đường s (luôn ≥ 0) với độ dịch chuyển d (có dấu); diện tích dưới đồ thị v–t là d.',
    bridge: 'Khởi đầu Vật lí THPT → mở sang Định luật Newton và đọc đồ thị xuyên suốt 3 năm.',
    useCasio: true,
  },
  {
    id: 'ly-c2-dongluchoc',
    subject: 'ly',
    grade: 10,
    stageId: 'ly-s1',
    order: 2,
    code: '10.2',
    name: 'Động lực học Newton & Lực',
    desc: 'Ba định luật Newton, tổng hợp – phân tích lực, lực ma sát, lực căng dây và moment cân bằng vật rắn.',
    prereq: ['ly-c1-donghoc'],
    dedicatedChapterId: 'ly-c2-dongluchoc',
    examWeight: 6,
    questionsInExam: '1–2 câu',
    weightLabel: 'Nền tảng phân tích lực',
    examParts: { part1: 60, part2: 25, part3: 15 },
    formulas: ['F_hl = m·a', 'F_ms = μ·N · M = F·d'],
    keyTrap: 'Trên mặt phẳng nghiêng góc α, phản lực N = m·g·cosα chứ không phải m·g.',
    bridge: 'Bắt buộc để thiết lập phương trình lực hồi phục của Dao động 11 và lực điện – lực từ.',
    useCasio: true,
  },
  {
    id: 'ly-c3-nangluong',
    subject: 'ly',
    grade: 10,
    stageId: 'ly-s1',
    order: 3,
    code: '10.3',
    name: 'Công, Năng lượng & Bảo toàn cơ năng',
    desc: 'Công cơ học, công suất, động năng, thế năng, định luật bảo toàn cơ năng và hiệu suất động cơ.',
    prereq: ['ly-c2-dongluchoc'],
    dedicatedChapterId: 'ly-c3-nangluong',
    examWeight: 5,
    questionsInExam: '1 câu',
    weightLabel: 'Nền tảng cho Nhiệt học & Dao động',
    examParts: { part1: 60, part2: 25, part3: 15 },
    formulas: ['A = F·s·cosα · P = A/t = F·v', 'W = W_đ + W_t = const'],
    keyTrap: 'Cơ năng chỉ bảo toàn khi bỏ qua ma sát và lực cản không khí; nếu có ma sát: ΔW = A_cản.',
    bridge: 'Cầu nối trực tiếp lên Định luật I Nhiệt động lực học (ΔU = A + Q) và năng lượng Dao động.',
    useCasio: true,
  },
  {
    id: 'ly-c4-dongluong',
    subject: 'ly',
    grade: 10,
    stageId: 'ly-s1',
    order: 4,
    code: '10.4',
    name: 'Động lượng & Va chạm',
    desc: 'Vectơ động lượng, xung lượng của lực, định luật bảo toàn động lượng trong hệ kín và bài toán va chạm.',
    prereq: ['ly-c2-dongluchoc'],
    dedicatedChapterId: 'ly-c4-dongluong',
    examWeight: 4,
    questionsInExam: '1 câu',
    weightLabel: 'Tiền đề Phản ứng hạt nhân 12',
    examParts: { part1: 60, part2: 20, part3: 20 },
    formulas: ['p⃗ = m·v⃗ · F⃗·Δt = Δp⃗', '∑p⃗_trước = ∑p⃗_sau'],
    keyTrap: 'Động lượng là đại lượng VECTƠ — tuyệt đối không cộng đại số khi hai vật chuyển động tạo góc.',
    bridge: 'Tiền đề trực tiếp để giải bài toán phân rã phóng xạ & phản ứng hạt nhân Vật lí 12.',
    useCasio: true,
  },
  {
    id: 'ly-c5-chuyendongtron',
    subject: 'ly',
    grade: 10,
    stageId: 'ly-s1',
    order: 5,
    code: '10.5',
    name: 'Chuyển động tròn đều',
    desc: 'Tốc độ góc ω, chu kì T, tần số f, gia tốc hướng tâm và lực hướng tâm.',
    prereq: ['ly-c2-dongluchoc'],
    dedicatedChapterId: 'ly-c5-chuyendongtron',
    examWeight: 4,
    questionsInExam: '1 câu',
    weightLabel: 'Cầu nối Vòng tròn lượng giác',
    examParts: { part1: 70, part2: 20, part3: 10 },
    formulas: ['ω = 2π/T = 2πf · v = ω·r', 'a_ht = v²/r = ω²·r'],
    keyTrap: 'Hình chiếu của chuyển động tròn đều lên đường kính chính là dao động điều hòa.',
    bridge: 'Chìa khóa trực tiếp mở khóa Vòng tròn pha cho toàn bộ Dao động & Sóng Lớp 11.',
    useCasio: true,
  },
  {
    id: 'ly-c6-biendang',
    subject: 'ly',
    grade: 10,
    stageId: 'ly-s1',
    order: 6,
    code: '10.6',
    name: 'Biến dạng vật rắn & Áp suất chất lỏng',
    desc: 'Định luật Hooke lực đàn hồi, khối lượng riêng và áp suất chất lỏng – khí quyển.',
    prereq: ['ly-c3-nangluong'],
    dedicatedChapterId: 'ly-c6-biendang',
    examWeight: 4,
    questionsInExam: '1 câu',
    weightLabel: 'Tiền đề Khí lí tưởng 12',
    examParts: { part1: 65, part2: 25, part3: 10 },
    formulas: ['F_đh = k·|Δl|', 'p = p₀ + ρ·g·h'],
    keyTrap: 'Đổi chuẩn đơn vị áp suất: 1 atm ≈ 1,013·10⁵ Pa · 1 bar = 10⁵ Pa · 760 mmHg = 1 atm.',
    bridge: 'Chuẩn bị kiến thức áp suất cột thủy ngân/nước cho các bài ống khí lí tưởng Vật lí 12.',
    useCasio: true,
  },

  /* Lớp 11 */
  {
    id: 'ly-c1-daodong',
    subject: 'ly',
    grade: 11,
    stageId: 'ly-s2',
    order: 1,
    code: '11.1',
    name: 'Dao động điều hòa',
    desc: 'Phương trình li độ – vận tốc – gia tốc, năng lượng dao động, con lắc lò xo/đơn và hiện tượng cộng hưởng.',
    prereq: ['ly-c3-nangluong', 'ly-c5-chuyendongtron'],
    dedicatedChapterId: 'ly-c1-daodong',
    examWeight: 10,
    questionsInExam: '2–3 câu',
    weightLabel: 'Xương sống Vật lí 11',
    examParts: { part1: 45, part2: 30, part3: 25 },
    formulas: ['x = A·cos(ωt + φ)', 'A² = x² + (v/ω)² · T = 2π√(m/k)'],
    keyTrap: 'Động năng và thế năng biến thiên tuần hoàn với chu kì T’ = T/2 (tần số f’ = 2f).',
    bridge: 'Nối từ Chuyển động tròn 10 → nền tảng hàm điều hòa cho Sóng 11 & Dòng xoay chiều 12.',
    useCasio: true,
  },
  {
    id: 'ly-c2-song',
    subject: 'ly',
    grade: 11,
    stageId: 'ly-s2',
    order: 2,
    code: '11.2',
    name: 'Sóng cơ, Sóng điện từ & Giao thoa',
    desc: 'Đặc trưng sóng ngang/dọc, thang sóng điện từ, giao thoa sóng cơ – ánh sáng Young và sóng dừng trên dây.',
    prereq: ['ly-c1-daodong'],
    dedicatedChapterId: 'ly-c2-song',
    examWeight: 10,
    questionsInExam: '2–3 câu',
    weightLabel: 'Giao thoa Young & Sóng dừng',
    examParts: { part1: 45, part2: 30, part3: 25 },
    formulas: ['λ = v·T = v/f · i = λD/a', 'Sóng dừng 2 đầu cố định: l = k·λ/2'],
    keyTrap: 'Khoảng cách giữa 2 nút (hoặc 2 bụng) liên tiếp là λ/2; giữa 1 nút và 1 bụng kề nhau là λ/4.',
    bridge: 'Mở rộng từ Dao động điều hòa sang truyền sóng và điện từ trường ở Vật lí 12.',
    useCasio: true,
  },
  {
    id: 'ly-c3-dientruong',
    subject: 'ly',
    grade: 11,
    stageId: 'ly-s3',
    order: 1,
    code: '11.3',
    name: 'Điện trường & Tụ điện',
    desc: 'Định luật Coulomb, cường độ điện trường, công lực điện, hiệu điện thế và năng lượng tích trữ trong tụ điện.',
    prereq: ['ly-c2-dongluchoc', 'ly-c3-nangluong'],
    dedicatedChapterId: 'ly-c3-dientruong',
    examWeight: 8,
    questionsInExam: '2 câu',
    weightLabel: 'Trường tĩnh điện & Tụ điện',
    examParts: { part1: 50, part2: 30, part3: 20 },
    formulas: ['F = k|q₁q₂|/(εr²) · U = E·d', 'Q = C·U · W = ½CU²'],
    keyTrap: 'Công lực điện A = q·E·d phụ thuộc hình chiếu d dọc theo đường sức, không phụ thuộc hình dạng quỹ đạo.',
    bridge: 'Dẫn thẳng sang Dòng điện không đổi và đối xứng với Từ trường ở Vật lí 12.',
    useCasio: true,
  },
  {
    id: 'ly-c4-dongdien',
    subject: 'ly',
    grade: 11,
    stageId: 'ly-s3',
    order: 2,
    code: '11.4',
    name: 'Dòng điện không đổi & Mạch điện',
    desc: 'Định luật Ohm cho toàn mạch, suất điện động và điện trở trong của nguồn điện, công suất và nhiệt lượng Joule.',
    prereq: ['ly-c3-dientruong'],
    dedicatedChapterId: 'ly-c4-dongdien',
    examWeight: 8,
    questionsInExam: '2 câu',
    weightLabel: 'Mạch điện & Thực hành nguồn',
    examParts: { part1: 45, part2: 35, part3: 20 },
    formulas: ['I = E / (R_N + r)', 'P = U·I · H = R_N / (R_N + r)'],
    keyTrap: 'Hiệu điện thế hai đầu nguồn U_N = E − I·r nhỏ hơn suất điện động E khi mạch kín.',
    bridge: 'Cơ sở bắt buộc để tính lực từ lên dây dẫn và cảm ứng điện từ trong Vật lí 12.',
    useCasio: true,
  },

  /* Lớp 12 — CHUẨN 4 CHƯƠNG GDPT 2018 */
  {
    id: 'ly-c1-nhiet',
    subject: 'ly',
    grade: 12,
    stageId: 'ly-s4',
    order: 1,
    code: '12.1',
    name: 'Vật lí nhiệt (Định luật I NĐLH)',
    desc: 'Mô hình động học phân tử, thang Kelvin, nội năng ΔU = A + Q, nhiệt dung riêng, nhiệt nóng chảy và hóa hơi riêng.',
    prereq: ['ly-c3-nangluong'],
    dedicatedChapterId: 'ly-c1-nhiet',
    examWeight: 18,
    questionsInExam: '5–6 câu',
    weightLabel: 'Trọng tâm mới GDPT 2018',
    examParts: { part1: 35, part2: 40, part3: 25 },
    formulas: ['ΔU = A + Q · T(K) = t(°C) + 273', 'Q = m·c·ΔT + m·λ + m·L'],
    keyTrap: 'Quy ước dấu: Hệ NHẬN công A > 0, NHẬN nhiệt Q > 0; hệ THỰC HIỆN công A < 0, TỎA nhiệt Q < 0.',
    bridge: 'Mở đầu Vật lí 12 — cực nhiều câu Phần II Đúng/Sai thí nghiệm đo nhiệt nóng chảy/hóa hơi.',
    useCasio: true,
  },
  {
    id: 'ly-c2-khi',
    subject: 'ly',
    grade: 12,
    stageId: 'ly-s4',
    order: 2,
    code: '12.2',
    name: 'Khí lí tưởng & Động học phân tử',
    desc: 'Định luật Boyle – Charles, phương trình Clapeyron pV = nRT, đồ thị đẳng quá trình và áp suất động học phân tử.',
    prereq: ['ly-c6-biendang', 'ly-c1-nhiet'],
    dedicatedChapterId: 'ly-c2-khi',
    examWeight: 18,
    questionsInExam: '5–6 câu',
    weightLabel: 'Trọng tâm Đồ thị & Điền số',
    examParts: { part1: 30, part2: 35, part3: 35 },
    formulas: ['p·V / T = n·R (R = 8,31 J/mol·K)', 'p = ⅓·μ·m·v̄² · E_đ = (3/2)k_B·T'],
    keyTrap: 'Quên đổi nhiệt độ °C sang Kelvin T(K) = t + 273 là lỗi sai phổ biến nhất khi tính pV/T.',
    bridge: 'Kết hợp Áp suất (10) & Vật lí nhiệt (12.1) → chiếm trọn 1/4 tổng điểm đề Vật lí THPT.',
    useCasio: true,
  },
  {
    id: 'ly-c4-tutruong',
    subject: 'ly',
    grade: 12,
    stageId: 'ly-s5',
    order: 1,
    code: '12.3',
    name: 'Từ trường, Cảm ứng điện từ & Máy phát XC',
    desc: 'Cảm ứng từ B, lực từ F = BILsinα, từ thông Φ, định luật Faraday – Lenz, dòng điện xoay chiều và sóng điện từ.',
    prereq: ['ly-c1-daodong', 'ly-c2-song', 'ly-c4-dongdien'],
    dedicatedChapterId: 'ly-c4-tutruong',
    examWeight: 20,
    questionsInExam: '6–7 câu',
    weightLabel: 'Trọng tâm số 1 Vật lí 12',
    examParts: { part1: 30, part2: 35, part3: 35 },
    formulas: ['F = B·I·L·sinα · Φ = N·B·S·cosα', 'e_c = −ΔΦ/Δt · U = U₀/√2'],
    keyTrap: 'Góc α trong Φ = B·S·cosα là góc giữa vectơ pháp tuyến n⃗ của khung dây và vectơ cảm ứng từ B⃗.',
    bridge: 'Hội tụ toàn bộ Dao động, Sóng & Mạch điện 11 vào chương phân loại cao nhất Vật lí 12.',
    useCasio: true,
  },
  {
    id: 'ly-c5-hatnhan',
    subject: 'ly',
    grade: 12,
    stageId: 'ly-s5',
    order: 2,
    code: '12.4',
    name: 'Vật lí hạt nhân & Phóng xạ',
    desc: 'Cấu trúc hạt nhân, độ hụt khối Δm, năng lượng liên kết riêng, phản ứng phân hạch – nhiệt hạch và định luật phóng xạ.',
    prereq: ['ly-c3-nangluong', 'ly-c4-dongluong'],
    dedicatedChapterId: 'ly-c5-hatnhan',
    examWeight: 16,
    questionsInExam: '4–5 câu',
    weightLabel: 'Phân loại 9.0–10 · Phần III',
    examParts: { part1: 35, part2: 30, part3: 35 },
    formulas: ['W_lk = Δm·c² (1 amu ≈ 931,5 MeV/c²)', 'N(t) = N₀·2^(−t/T) · H = λ·N'],
    keyTrap: 'Phân biệt số hạt CÒN LẠI N = N₀·2^(−t/T) với số hạt ĐÃ PHÂN RÃ ΔN = N₀(1 − 2^(−t/T)).',
    bridge: 'Chốt hạ Vật lí 12 bằng bài toán định tuổi carbon C-14, y học hạt nhân và độ phóng xạ.',
    useCasio: true,
  },

  /* ===================== SINH HỌC (13 CHUYÊN ĐỀ — HẾT TRÙNG LẶP) ===================== */
  {
    id: 'sinh-c1-tebao',
    subject: 'sinh',
    grade: 10,
    stageId: 'sinh-s1',
    order: 1,
    code: '10.1',
    name: 'Tế bào học & Chuyển hóa năng lượng',
    desc: 'Đại phân tử sinh học, cấu trúc bào quan nhân sơ – nhân thực, vận chuyển qua màng, enzyme, hô hấp & quang hợp.',
    prereq: [],
    dedicatedChapterId: 'sinh-c1-tebao',
    examWeight: 6,
    questionsInExam: '1–2 câu',
    weightLabel: 'Gốc Sinh học tế bào',
    examParts: { part1: 65, part2: 25, part3: 10 },
    formulas: ['Hô hấp hiếu khí: ~30–32 ATP', 'Chu trình Krebs ở chất nền ti thể'],
    keyTrap: 'Pha sáng diễn ra trên màng Thylakoid; pha tối (Calvin) ở chất nền Stroma và cần ATP + NADPH.',
    bridge: 'Khởi đầu Sinh học THPT → làm gốc cho Phân bào, Sinh lí thực vật và Di truyền phân tử.',
    useCasio: false,
  },
  {
    id: 'sinh-c2-phanbao',
    subject: 'sinh',
    grade: 10,
    stageId: 'sinh-s1',
    order: 2,
    code: '10.2',
    name: 'Chu kì tế bào, Nguyên phân & Giảm phân',
    desc: 'Pha G1–S–G2, kiểm soát chu kì tế bào – ung thư, diễn biến NST trong nguyên phân, giảm phân và trao đổi chéo.',
    prereq: ['sinh-c1-tebao'],
    dedicatedChapterId: 'sinh-c2-phanbao',
    examWeight: 7,
    questionsInExam: '1–2 câu',
    weightLabel: 'Nền tảng Hoán vị & Đột biến NST',
    examParts: { part1: 50, part2: 30, part3: 20 },
    formulas: ['N_TB = 2^k · NST mt = 2n·(2^k − 1)', '1 tế bào sinh tinh → 4 tinh trùng'],
    keyTrap: 'DNA nhân đôi ở pha S của kì trung gian; tiếp hợp và trao đổi chéo xảy ra ở Kì đầu I giảm phân.',
    bridge: 'Chìa khóa hiểu bản chất cơ chế Hoán vị gene và Đột biến lệch bội/đa bội ở Lớp 12.',
    useCasio: true,
  },
  {
    id: 'sinh-c8-sinh10-tebao-virus',
    subject: 'sinh',
    grade: 10,
    stageId: 'sinh-s1',
    order: 3,
    code: '10.3',
    name: 'Vi sinh vật & Virus',
    desc: 'Kiểu dinh dưỡng, 4 pha sinh trưởng quần thể vi khuẩn, chu trình nhân lên của virus và ứng dụng vaccine – lên men.',
    prereq: ['sinh-c1-tebao'],
    dedicatedChapterId: 'sinh-c8-sinh10-tebao-virus',
    examWeight: 5,
    questionsInExam: '1–2 câu',
    weightLabel: 'Ứng dụng Công nghệ sinh học',
    examParts: { part1: 60, part2: 30, part3: 10 },
    formulas: ['N(t) = N₀ · 2^(t/g)', '4 pha: Tiềm phát → Lũy thừa → Cân bằng → Suy vong'],
    keyTrap: 'Virus chưa có cấu tạo tế bào, bắt buộc kí sinh nội bào; hệ gene virus là DNA HOẶC RNA.',
    bridge: 'Kết nối trực tiếp với mô hình điều hòa Operon Lac ở E. coli và công nghệ DNA tái tổ hợp.',
    useCasio: true,
  },

  /* Lớp 11 */
  {
    id: 'sinh-c7-sinh11-cothe',
    subject: 'sinh',
    grade: 11,
    stageId: 'sinh-s2',
    order: 1,
    code: '11.1',
    name: 'Sinh lí Thực vật (Nước · Khoáng · Quang hợp)',
    desc: 'Trao đổi nước – thoát hơi nước, dinh dưỡng khoáng Nitrogen, quang hợp ở thực vật C3 – C4 – CAM và hô hấp thực vật.',
    prereq: ['sinh-c1-tebao'],
    dedicatedChapterId: 'sinh-c7-sinh11-cothe',
    examWeight: 9,
    questionsInExam: '2–3 câu',
    weightLabel: 'Trọng tâm Đồ thị Quang hợp',
    examParts: { part1: 45, part2: 45, part3: 10 },
    formulas: ['Năng suất: C4 > C3 > CAM', 'CAM mở khí khổng ban đêm'],
    keyTrap: 'Thực vật C4 cố định CO₂ sơ cấp ở tế bào mô giậu và chu trình Calvin ở tế bào bao bó mạch.',
    bridge: 'Nền tảng cho hiệu suất quang hợp và dòng năng lượng bậc 1 trong Sinh thái học 12.',
    useCasio: false,
  },
  {
    id: 'sinh-c7b-dongvat',
    subject: 'sinh',
    grade: 11,
    stageId: 'sinh-s2',
    order: 2,
    code: '11.2',
    name: 'Sinh lí Động vật, Miễn dịch & Cân bằng nội môi',
    desc: 'Tiêu hóa, hô hấp, tuần hoàn máu – chu kì tim, miễn dịch không đặc hiệu/đặc hiệu, bài tiết thận và cảm ứng thần kinh.',
    prereq: ['sinh-c1-tebao'],
    dedicatedChapterId: 'sinh-c7b-dongvat',
    examWeight: 9,
    questionsInExam: '2–3 câu',
    weightLabel: 'Thực tiễn Y sinh · Phần II Đúng/Sai',
    examParts: { part1: 45, part2: 45, part3: 10 },
    formulas: ['Huyết áp: ĐM chủ > ĐM > Mao mạch > TM', 'Vận tốc máu nhỏ nhất ở Mao mạch'],
    keyTrap: 'Vận tốc máu nhỏ nhất ở MAO MẠCH (tổng tiết diện lớn nhất), còn huyết áp nhỏ nhất ở TĨNH MẠCH chủ.',
    bridge: 'Rất thường xuất hiện ở Phần II Đúng/Sai bối cảnh y khoa và sinh lí người.',
    useCasio: false,
  },

  /* Lớp 12 */
  {
    id: 'sinh-c1-phantu',
    subject: 'sinh',
    grade: 12,
    stageId: 'sinh-s3',
    order: 1,
    code: '12.1',
    name: 'Di truyền phân tử & Operon Lac',
    desc: 'Cấu trúc DNA, tái bản, phiên mã – dịch mã, điều hòa biểu hiện gene Operon Lac, đột biến gene và công nghệ gene.',
    prereq: ['sinh-c2-phanbao', 'sinh-c8-sinh10-tebao-virus'],
    dedicatedChapterId: 'sinh-c1-phantu',
    examWeight: 16,
    questionsInExam: '4–5 câu',
    weightLabel: 'Trọng tâm số 1 Sinh 12',
    examParts: { part1: 40, part2: 35, part3: 25 },
    formulas: ['N = 2A + 2G · H = 2A + 3G', 'L = (N/2) · 3,4 Å · Operon: P–O–Z–Y–A'],
    keyTrap: 'Gene điều hòa lacI KHÔNG nằm trong cụm Operon Lac và luôn phiên mã tạo protein ức chế.',
    bridge: 'Nền tảng cấp độ phân tử giải thích mọi cơ chế biến dị và quy luật di truyền.',
    useCasio: true,
  },
  {
    id: 'sinh-c1b-nst',
    subject: 'sinh',
    grade: 12,
    stageId: 'sinh-s3',
    order: 2,
    code: '12.2',
    name: 'Nhiễm sắc thể & Đột biến NST',
    desc: 'Cấu trúc siêu hiển vi NST, đột biến cấu trúc (mất, lặp, đảo, chuyển đoạn) và đột biến số lượng (lệch bội, đa bội).',
    prereq: ['sinh-c2-phanbao', 'sinh-c1-phantu'],
    dedicatedChapterId: 'sinh-c1b-nst',
    examWeight: 10,
    questionsInExam: '2–3 câu',
    weightLabel: 'Cơ chế Lệch bội & Đa bội',
    examParts: { part1: 45, part2: 35, part3: 20 },
    formulas: ['Thể ba: 2n + 1 · Thể một: 2n − 1', 'Giao tử 4n (AAaa): 1AA : 4Aa : 1aa'],
    keyTrap: 'Đột biến đảo đoạn NST không làm thay đổi số lượng gene trên NST nhưng có thể thay đổi mức độ biểu hiện.',
    bridge: 'Nối từ Phân bào & DNA sang Quy luật di truyền NST và Bệnh di truyền NST ở người.',
    useCasio: true,
  },
  {
    id: 'sinh-c2-ditruyen',
    subject: 'sinh',
    grade: 12,
    stageId: 'sinh-s4',
    order: 1,
    code: '12.3',
    name: 'Quy luật Mendel & Tương tác gene',
    desc: 'Quy luật phân li, phân li độc lập, mở rộng học thuyết Mendel (trội không hoàn toàn, đa allele, tương tác gene).',
    prereq: ['sinh-c1b-nst'],
    dedicatedChapterId: 'sinh-c2-ditruyen',
    examWeight: 14,
    questionsInExam: '3–4 câu',
    weightLabel: 'Nền tảng toán Di truyền',
    examParts: { part1: 35, part2: 35, part3: 30 },
    formulas: ['AaBb × AaBb → 9:3:3:1', 'Tương tác bổ sung: 9:7 · 9:6:1 · 9:3:4'],
    keyTrap: 'Lai phân tích cá thể dị hợp 2 cặp gene phân li độc lập cho tỉ lệ kiểu hình 1:1:1:1.',
    bridge: 'Nền toán xác suất bắt buộc trước khi bước vào Hoán vị gene Morgan và Phả hệ.',
    useCasio: true,
  },
  {
    id: 'sinh-c3-lienket',
    subject: 'sinh',
    grade: 12,
    stageId: 'sinh-s4',
    order: 2,
    code: '12.4',
    name: 'Liên kết, Hoán vị gene & Di truyền giới tính',
    desc: 'Thí nghiệm Morgan, bản đồ di truyền (cM), công thức hoán vị 2 bên, liên kết giới tính XX/XY và di truyền ngoài nhân.',
    prereq: ['sinh-c2-ditruyen'],
    dedicatedChapterId: 'sinh-c3-lienket',
    examWeight: 14,
    questionsInExam: '3–4 câu',
    weightLabel: 'Phân loại Hoán vị Morgan (Phần III)',
    examParts: { part1: 30, part2: 35, part3: 35 },
    formulas: ['A-B- = 0,5 + aabb', 'A-bb = aaB- = 0,25 − aabb · f ≤ 50%'],
    keyTrap: 'Tần số hoán vị gene f = tổng tỉ lệ 2 loại giao tử hoán vị (2 × % 1 giao tử hoán vị), luôn f ≤ 50%.',
    bridge: 'Bài toán trụ cột khối B00 → kết hợp chặt với Di truyền Quần thể và Phả hệ.',
    useCasio: true,
  },
  {
    id: 'sinh-c4-quanthe',
    subject: 'sinh',
    grade: 12,
    stageId: 'sinh-s4',
    order: 3,
    code: '12.5',
    name: 'Di truyền học Quần thể (Hardy–Weinberg)',
    desc: 'Tần số allele và thành phần kiểu gene, quần thể tự thụ phấn – giao phối gần và trạng thái cân bằng Hardy–Weinberg.',
    prereq: ['sinh-c3-lienket'],
    dedicatedChapterId: 'sinh-c4-quanthe',
    examWeight: 11,
    questionsInExam: '2–3 câu',
    weightLabel: 'Cầu nối sang Tiến hóa & Phả hệ',
    examParts: { part1: 35, part2: 30, part3: 35 },
    formulas: ['Tự thụ n đời: Aa_n = Aa₀ / 2^n', 'p²AA + 2pqAa + q²aa = 1 (p + q = 1)'],
    keyTrap: 'Quần thể chưa cân bằng (gene trên NST thường) chỉ cần ĐÚNG 1 thế hệ ngẫu phối là đạt cân bằng.',
    bridge: 'Điều kiện tiên quyết khoa học của cả Tiến hóa hiện đại lẫn tính xác suất Phả hệ người.',
    useCasio: true,
  },
  {
    id: 'sinh-c6-ditruyen-nguoi',
    subject: 'sinh',
    grade: 12,
    stageId: 'sinh-s5',
    order: 1,
    code: '12.6',
    name: 'Di truyền học Người, Phả hệ & Tư vấn',
    desc: 'Phân tích phả hệ đa thế hệ, phân biệt quy luật di truyền NST thường/X, tính xác suất sinh con khỏe mạnh và liệu pháp gene.',
    prereq: ['sinh-c4-quanthe'],
    dedicatedChapterId: 'sinh-c6-ditruyen-nguoi',
    examWeight: 12,
    questionsInExam: '2–3 câu',
    weightLabel: 'Phân loại 9.5–10 Y Dược (Phần III)',
    examParts: { part1: 20, part2: 35, part3: 45 },
    formulas: ['Bố mẹ BT sinh con gái bệnh → Lặn NST thường', 'P(con) = P(Bố) × P(Mẹ) × P(sinh)'],
    keyTrap: 'Người bình thường có anh/em ruột mắc bệnh lặn aa (từ bố mẹ bình thường) có xác suất mang Aa là 2/3.',
    bridge: 'Đỉnh cao tổng hợp Quy luật di truyền + Hardy–Weinberg dành riêng cho mục tiêu Y Dược.',
    useCasio: true,
  },
  {
    id: 'sinh-c5-tienhoa',
    subject: 'sinh',
    grade: 12,
    stageId: 'sinh-s5',
    order: 2,
    code: '12.7',
    name: 'Tiến hóa tổng hợp hiện đại',
    desc: 'Bằng chứng tiến hóa, học thuyết Darwin, 5 nhân tố tiến hóa tác động lên tần số allele và cơ chế hình thành loài mới.',
    prereq: ['sinh-c4-quanthe'],
    dedicatedChapterId: 'sinh-c5-tienhoa',
    examWeight: 10,
    questionsInExam: '2–3 câu',
    weightLabel: '5 Nhân tố tiến hóa & Hình thành loài',
    examParts: { part1: 50, part2: 40, part3: 10 },
    formulas: ['Đột biến (Nguyên liệu sơ cấp)', 'CLTN (Nhân tố định hướng duy nhất)'],
    keyTrap: 'Phiêu bạt di truyền (yếu tố ngẫu nhiên) có thể loại bỏ cả allele có lợi khỏi quần thể nhỏ.',
    bridge: 'Học ngay sau Di truyền Quần thể vì tiến hóa nhỏ là quá trình biến đổi cấu trúc di truyền quần thể.',
    useCasio: false,
  },
  {
    id: 'sinh-c9-sinhthai',
    subject: 'sinh',
    grade: 12,
    stageId: 'sinh-s5',
    order: 3,
    code: '12.8',
    name: 'Sinh thái học (Quần thể · Quần xã · Hệ sinh thái)',
    desc: 'Ổ sinh thái, mối quan hệ hỗ trợ – đối kháng, diễn thế sinh thái, lưới thức ăn, hiệu suất sinh thái và bảo tồn đa dạng sinh học.',
    prereq: ['sinh-c7-sinh11-cothe', 'sinh-c5-tienhoa'],
    dedicatedChapterId: 'sinh-c9-sinhthai',
    examWeight: 13,
    questionsInExam: '3–4 câu',
    weightLabel: 'Trọng tâm Đúng/Sai thực địa',
    examParts: { part1: 45, part2: 45, part3: 10 },
    formulas: ['Hiệu suất sinh thái H ≈ 10%', 'Năng lượng giảm ~90% mỗi bậc dinh dưỡng'],
    keyTrap: 'Dòng năng lượng trong hệ sinh thái đi theo 1 CHIỀU (không tuần hoàn), còn vật chất tuần hoàn theo chu trình.',
    bridge: 'Mảnh ghép cuối hoàn thiện bức tranh Sinh học từ phân tử → tế bào → cơ thể → sinh quyển.',
    useCasio: true,
  },
];

/* ============================================================
   3. BỘ HÀM TRA CỨU & ĐỒ THỊ DAG (THUẦN — TEST ĐƯỢC BẰNG VITEST)
   ============================================================ */
const NODE_BY_ID = Object.fromEntries(CURRICULUM_NODES.map((n) => [n.id, n]));

export function getChapterMeta(id) {
  return id ? NODE_BY_ID[id] || null : null;
}

export function getCurriculumStages(subjectKey = 'hoa') {
  return SUBJECT_STAGES[subjectKey] || SUBJECT_STAGES.hoa;
}

export function getCurriculumChapters(subjectKey = 'hoa', gradeFilter = 'all') {
  const list = CURRICULUM_NODES.filter((n) => n.subject === subjectKey);
  if (!gradeFilter || gradeFilter === 'all') return list;
  const g = typeof gradeFilter === 'number'
    ? gradeFilter
    : Number(String(gradeFilter).match(/\d+/)?.[0] || 0);
  if (!g) return list;
  return list.filter((n) => n.grade === g);
}

/** Toàn bộ tổ tiên tiên quyết (Upstream) của một chương trong DAG */
export function getUpstreamIds(chapterId) {
  const visited = new Set();
  const stack = [...(NODE_BY_ID[chapterId]?.prereq || [])];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (!cur || visited.has(cur) || cur === chapterId) continue;
    visited.add(cur);
    const node = NODE_BY_ID[cur];
    if (node?.prereq) {
      node.prereq.forEach((p) => {
        if (!visited.has(p)) stack.push(p);
      });
    }
  }
  return [...visited];
}

/** Các chương phụ thuộc trực tiếp vào chapterId */
export function getDirectDependents(chapterId) {
  return CURRICULUM_NODES
    .filter((n) => (n.prereq || []).includes(chapterId))
    .map((n) => n.id);
}

/** Toàn bộ nhánh mở khóa phía sau (Downstream) của một chương trong DAG */
export function getDownstreamIds(chapterId) {
  const visited = new Set();
  const queue = getDirectDependents(chapterId);
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur || visited.has(cur) || cur === chapterId) continue;
    visited.add(cur);
    getDirectDependents(cur).forEach((d) => {
      if (!visited.has(d)) queue.push(d);
    });
  }
  return [...visited];
}

/**
 * Adaptive Detour: Phát hiện lỗ hổng kiến thức gốc (Upstream)
 * Khi học sinh làm yếu hoặc chuẩn bị học chương nâng cao nhưng gốc tiên quyết < 60%
 */
export function detectAdaptiveDetour(chapterId, chapterViewById = {}) {
  const node = NODE_BY_ID[chapterId];
  if (!node || !node.prereq || node.prereq.length === 0) return null;

  const upstreamIds = getUpstreamIds(chapterId);
  const directSet = new Set(node.prereq);

  const weakRoots = upstreamIds
    .map((uid) => {
      const meta = NODE_BY_ID[uid];
      const view = chapterViewById[uid] || null;
      const answers = view?.summary?.answers || view?.answers || 0;
      const score = view?.mastery?.score ?? view?.masteryPct ?? null;
      const isDirect = directSet.has(uid);
      return { id: uid, meta, answers, score, isDirect };
    })
    .filter((item) => {
      if (!item.meta) return false;
      if (item.answers === 0) return item.isDirect;
      return item.score !== null && item.score < 60;
    })
    .sort((a, b) => {
      // Ưu tiên gốc đã làm nhưng điểm yếu (<60%) trước, sau đó tới gốc trực tiếp chưa học
      const aTested = a.answers > 0 ? 1 : 0;
      const bTested = b.answers > 0 ? 1 : 0;
      if (aTested !== bTested) return bTested - aTested;
      if (a.isDirect !== b.isDirect) return a.isDirect ? -1 : 1;
      return (a.score ?? 50) - (b.score ?? 50);
    });

  if (weakRoots.length === 0) return null;
  const top = weakRoots[0];
  return {
    rootId: top.id,
    rootName: top.meta.name,
    rootGrade: top.meta.grade,
    rootCode: top.meta.code,
    rootScore: top.score,
    tested: top.answers > 0,
    reason: top.answers > 0
      ? `Kiến thức gốc "${top.meta.name}" (Lớp ${top.meta.grade}) hiện mới đạt ${top.score}%. Củng cố nhanh 5 câu gốc giúp học mượt "${node.name}".`
      : `Nên nắm nhanh gốc "${top.meta.name}" (Lớp ${top.meta.grade}) trước khi đi sâu vào "${node.name}".`,
  };
}

/**
 * Dự đoán điểm thi THPT 2025–2026 (thang 10) có trọng số thực
 * Tách rõ 3 phần: Phần I (tối đa 4.5đ) · Phần II Đúng/Sai (4.0đ) · Phần III Điền số (1.5đ)
 */
export function computeWeightedExamScore(chapterViews = [], subjectKey = 'hoa') {
  const nodes = getCurriculumChapters(subjectKey, 'all');
  const viewById = Object.fromEntries(
    (chapterViews || []).map((c) => [c.chapter?.id || c.id, c]),
  );

  let totalWeight = 0;
  let weightedMastery = 0;
  let p1Weight = 0;
  let p1Sum = 0;
  let p2Weight = 0;
  let p2Sum = 0;
  let p3Weight = 0;
  let p3Sum = 0;
  let testedChapters = 0;

  nodes.forEach((node) => {
    const view = viewById[node.id];
    const answers = view?.summary?.answers || view?.answers || 0;
    const rawScore = view?.mastery?.score ?? view?.masteryPct ?? null;
    const hasData = answers > 0 && rawScore !== null && Number.isFinite(rawScore);
    if (hasData) testedChapters += 1;

    // Chương chưa làm dùng điểm nền thận trọng 35% (khi đã có ít nhất 1 chương làm) để không thổi phồng điểm
    const effectivePct = hasData ? Math.max(0, Math.min(100, rawScore)) : 35;
    const w = node.examWeight || 5;
    totalWeight += w;
    weightedMastery += w * effectivePct;

    const parts = node.examParts || { part1: 50, part2: 30, part3: 20 };
    const w1 = w * (parts.part1 / 100);
    const w2 = w * (parts.part2 / 100);
    const w3 = w * (parts.part3 / 100);

    // Phần II & Phần III đòi hỏi độ chắc chắn cao hơn Phần I (hệ số phân hóa thực tế đề 2025–2026)
    const p1Ratio = Math.min(1, (effectivePct / 100) * 1.08);
    const p2Ratio = Math.min(1, Math.pow(effectivePct / 100, 1.15));
    const p3Ratio = Math.min(1, Math.pow(effectivePct / 100, 1.32));

    p1Weight += w1;
    p1Sum += w1 * p1Ratio;
    p2Weight += w2;
    p2Sum += w2 * p2Ratio;
    p3Weight += w3;
    p3Sum += w3 * p3Ratio;
  });

  if (testedChapters === 0 || totalWeight === 0) {
    return {
      hasEvidence: false,
      testedChapters: 0,
      totalChapters: nodes.length,
      total10: 5.5,
      part1: 2.75,
      part2: 2.0,
      part3: 0.75,
    };
  }

  const round2 = (x) => Math.round(x * 100) / 100;
  const part1 = Math.min(4.5, round2(4.5 * (p1Weight ? p1Sum / p1Weight : 0)));
  const part2 = Math.min(4.0, round2(4.0 * (p2Weight ? p2Sum / p2Weight : 0)));
  const part3 = Math.min(1.5, round2(1.5 * (p3Weight ? p3Sum / p3Weight : 0)));
  const rawTotal = round2(Math.min(10, part1 + part2 + part3));

  return {
    hasEvidence: true,
    testedChapters,
    totalChapters: nodes.length,
    total10: rawTotal,
    weightedAvgPct: Math.round(weightedMastery / totalWeight),
    part1,
    part2,
    part3,
  };
}

/** Kiểm tra tính không chu trình (DAG hợp lệ) và toàn vẹn tham chiếu prereq */
export function validateDagAcyclic(subjectKey) {
  const nodes = subjectKey
    ? CURRICULUM_NODES.filter((n) => n.subject === subjectKey)
    : CURRICULUM_NODES;
  const idSet = new Set(nodes.map((n) => n.id));
  const missingRefs = [];

  nodes.forEach((n) => {
    (n.prereq || []).forEach((p) => {
      if (!idSet.has(p)) missingRefs.push({ nodeId: n.id, missingPrereq: p });
    });
  });

  const state = {}; // 0: unvisited, 1: visiting, 2: done
  let hasCycle = false;

  const dfs = (id) => {
    state[id] = 1;
    const node = NODE_BY_ID[id];
    for (const p of (node?.prereq || [])) {
      if (!idSet.has(p)) continue;
      if (state[p] === 1) {
        hasCycle = true;
        return;
      }
      if (!state[p]) dfs(p);
    }
    state[id] = 2;
  };

  for (const n of nodes) {
    if (!state[n.id]) dfs(n.id);
    if (hasCycle) break;
  }

  return {
    valid: !hasCycle && missingRefs.length === 0,
    hasCycle,
    missingRefs,
    nodeCount: nodes.length,
  };
}
