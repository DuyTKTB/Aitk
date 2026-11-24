/* ============================================================
   aiducationKnowledgeLibrary.js — THƯ VIỆN GIÁO TRÌNH KHOA HỌC TỰ NHIÊN ELEC AI
   ------------------------------------------------------------
   Bản quyền biên soạn học thuật thuộc hệ thống ELEC AI — Nền tảng KHTN Việt Nam.
   Tập trung 100% vào 3 trụ cột Khoa học Tự nhiên: HOÁ HỌC · VẬT LÍ · SINH HỌC
   từ THPT chuẩn GDPT 2018 (Lớp 10 · 11 · 12) tới Đại học & Bồi dưỡng HSG/ĐGNL.

   Cấu trúc 5 Tầng Kệ Chuyên Biệt (18 Giáo trình Tương tác):
     1. Tầng 1 · Hoá học THPT (GDPT 2018) — Hoá 10, Hoá 11, Hoá 12 (đồng bộ 100% với Dedicated Lessons & DAG)
     2. Tầng 2 · Vật lí THPT (GDPT 2018) — Vật lí 10, Vật lí 11, Vật lí 12 (đồng bộ 100% với Dedicated Lessons & DAG)
     3. Tầng 3 · Sinh học THPT (GDPT 2018) — Sinh 10, Sinh 11, Sinh 12 (đồng bộ 100% với Dedicated Lessons & DAG)
     4. Tầng 4 · Hoá học Đại học & Chuyên sâu — Hoá Đại Cương Vô Cơ (10 chương), Hoá Học Vô Cơ (17 chương), Hoá Hữu Cơ Toàn Tập (40 chương)
     5. Tầng 5 · Vật lí & Sinh học Đại học — Vật lí Đại cương (10 chương), Sinh học Đại cương (21 chương), Thực vật & Dược liệu (13 chương), Giải phẫu & Sinh lý Người (11 chương), Sinh học Phân tử & Di truyền (10 chương), Luyện thi ĐGNL / HSG KHTN (12 chương)
   ============================================================ */

import { getCurriculumChapters } from './curriculumDag.js';
import { findLessonsByChapter } from './dedicatedLessonsData.js';

export const KNOWLEDGE_PROGRAMMES = [
  {
    id: 'hoa-thpt',
    number: '01',
    title: 'Hoá học THPT (GDPT 2018)',
    tierId: 'hoa-thpt',
    subjectKey: 'hoa',
    desc: 'Trọn bộ Hoá 10, 11, 12 theo danh pháp IUPAC mới, cơ chế phản ứng, bảng tuần hoàn, nhiệt động & điện hoá học.',
    tags: 'Hoá 10 · Hoá 11 · Hoá 12 · THPTQG 2026',
    accent: '#2563EB',
  },
  {
    id: 'ly-thpt',
    number: '02',
    title: 'Vật lí THPT (GDPT 2018)',
    tierId: 'ly-thpt',
    subjectKey: 'ly',
    desc: 'Cơ học, Dao động – Sóng, Điện trường, Vật lí Nhiệt, Khí lí tưởng, Từ trường & Hạt nhân nguyên tử.',
    tags: 'Vật lí 10 · Vật lí 11 · Vật lí 12 · ĐGNL',
    accent: '#0284C7',
  },
  {
    id: 'sinh-thpt',
    number: '03',
    title: 'Sinh học THPT (GDPT 2018)',
    tierId: 'sinh-thpt',
    subjectKey: 'sinh',
    desc: 'Sinh học tế bào, Chuyển hoá năng lượng, Sinh lý thực–động vật, Di truyền phân tử, Tiến hoá & Sinh thái học.',
    tags: 'Sinh 10 · Sinh 11 · Sinh 12 · Khối B00',
    accent: '#059669',
  },
  {
    id: 'hoa-dai-hoc',
    number: '04',
    title: 'Hoá học Đại học & Chuyên sâu',
    tierId: 'hoa-dai-hoc',
    subjectKey: 'hoa',
    desc: 'Hệ thống 3 bộ giáo trình chuẩn đại học: Hoá Đại cương — Vô cơ (10 chương), Hoá học Vô cơ (17 chương) và Hoá Hữu cơ Toàn tập (40 chương).',
    tags: 'Vô cơ · Hữu cơ · Phức chất · Cơ chế · Y Dược',
    accent: '#4F46E5',
  },
  {
    id: 'sinh-ly-dai-hoc',
    number: '05',
    title: 'Sinh học & Vật lí Đại học — Y Sinh',
    tierId: 'sinh-ly-dai-hoc',
    subjectKey: 'sinh',
    desc: 'Sinh học Đại cương (21 chương), Thực vật Dược (13 chương), Giải phẫu & Sinh lý Người (11 chương) và Vật lí Đại cương (10 chương).',
    tags: 'Sinh Đại cương · Y Sinh · Thực vật Dược · Cơ-Nhiệt-Điện',
    accent: '#0F766E',
  },
];

export const KNOWLEDGE_SHELF_TIERS = [
  {
    id: 'hoa-thpt',
    kicker: 'HOÁ HỌC THPT · GDPT 2018',
    label: 'Hoá học THPT (10–12)',
    subjectKey: 'hoa',
    accent: '#2563EB',
    volumes: [
      {
        id: 'hoa-hoc-10',
        number: '01',
        title: 'Hoá học 10',
        desc: 'Cấu tạo nguyên tử, Bảng tuần hoàn, Liên kết hoá học, Oxi hoá–khử, Năng lượng hoá học (Enthalpy), Tốc độ phản ứng & Nhóm Halogen.',
        tags: 'Nguyên tử · Orbital · Bảng tuần hoàn · Liên kết · Enthalpy · Halogen',
        accent: '#2563EB',
        chapters: 7,
        subjectKey: 'hoa',
        grade: 10,
      },
      {
        id: 'hoa-hoc-11',
        number: '02',
        title: 'Hoá học 11',
        desc: 'Cân bằng hoá học, pH & chuẩn độ, Nitrogen–Sulfur, Đại cương Hoá học Hữu cơ, Hydrocarbon, Dẫn xuất Halogen, Alcohol–Phenol & Hợp chất Carbonyl–Carboxylic.',
        tags: 'Cân bằng · pH · Nitrogen · Sulfur · Hydrocarbon · Alcohol · Aldehyde',
        accent: '#1D4ED8',
        chapters: 6,
        subjectKey: 'hoa',
        grade: 11,
      },
      {
        id: 'hoa-hoc-12',
        number: '03',
        title: 'Hoá học 12',
        desc: 'Ester–Lipid, Carbohydrate, Amine–Amino Acid–Peptide–Protein, Polymer, Pin điện & Điện phân, Đại cương Kim loại, Nhóm IA–IIA & Kim loại chuyển tiếp – Phức chất.',
        tags: 'Ester · Carbohydrate · Protein · Polymer · Điện hoá · Kim loại · Phức chất',
        accent: '#1E40AF',
        chapters: 8,
        subjectKey: 'hoa',
        grade: 12,
      },
    ],
  },
  {
    id: 'ly-thpt',
    kicker: 'VẬT LÍ THPT · GDPT 2018',
    label: 'Vật lí THPT (10–12)',
    subjectKey: 'ly',
    accent: '#0284C7',
    volumes: [
      {
        id: 'vat-ly-10',
        number: '01',
        title: 'Vật lí 10',
        desc: 'Động học chất điểm, Chuyển động ném, Ba định luật Newton, Công – Công suất – Cơ năng, Động lượng, Chuyển động tròn đều & Biến dạng vật rắn.',
        tags: 'Động học · Định luật Newton · Cơ năng · Động lượng · Tròn đều',
        accent: '#0284C7',
        chapters: 7,
        subjectKey: 'ly',
        grade: 10,
      },
      {
        id: 'vat-ly-11',
        number: '02',
        title: 'Vật lí 11',
        desc: 'Dao động điều hoà, Con lắc lò xo & đơn, Sóng cơ – Sóng dừng – Giao thoa ánh sáng, Trường tĩnh điện, Tụ điện & Dòng điện không đổi.',
        tags: 'Dao động · Sóng · Giao thoa · Điện trường · Tụ điện · Mạch điện',
        accent: '#0369A1',
        chapters: 4,
        subjectKey: 'ly',
        grade: 11,
      },
      {
        id: 'vat-ly-12',
        number: '03',
        title: 'Vật lí 12',
        desc: 'Vật lí nhiệt (Nội năng, Nhiệt dung riêng, Chuyển thể), Khí lí tưởng & Động học phân tử, Từ trường & Cảm ứng điện từ, Dòng xoay chiều & Vật lí hạt nhân.',
        tags: 'Vật lí nhiệt · Khí lí tưởng · Từ trường · Cảm ứng điện từ · Hạt nhân',
        accent: '#075985',
        chapters: 4,
        subjectKey: 'ly',
        grade: 12,
      },
    ],
  },
  {
    id: 'sinh-thpt',
    kicker: 'SINH HỌC THPT · GDPT 2018',
    label: 'Sinh học THPT (10–12)',
    subjectKey: 'sinh',
    accent: '#059669',
    volumes: [
      {
        id: 'sinh-hoc-10',
        number: '01',
        title: 'Sinh học 10',
        desc: 'Thành phần hoá học tế bào, Cấu trúc tế bào nhân sơ & nhân thực, Vận chuyển qua màng, Enzyme – Hô hấp – Quang hợp, Chu kì tế bào – Phân bào & Vi sinh vật – Virus.',
        tags: 'Tế bào · Màng sinh chất · Enzyme · Phân bào · Vi sinh · Virus',
        accent: '#059669',
        chapters: 5,
        subjectKey: 'sinh',
        grade: 10,
      },
      {
        id: 'sinh-hoc-11',
        number: '02',
        title: 'Sinh học 11',
        desc: 'Trao đổi nước–khoáng & Quang hợp C3/C4/CAM ở thực vật, Tiêu hoá–Hô hấp–Tuần hoàn–Miễn dịch ở động vật, Cảm ứng, Sinh trưởng phát triển & Sinh sản.',
        tags: 'Quang hợp · Tuần hoàn · Miễn dịch · Cảm ứng · Nội tiết · Sinh sản',
        accent: '#047857',
        chapters: 4,
        subjectKey: 'sinh',
        grade: 11,
      },
      {
        id: 'sinh-hoc-12',
        number: '03',
        title: 'Sinh học 12',
        desc: 'Di truyền phân tử (ADN, Phiên mã, Dịch mã, Operon Lac), Đột biến gen & NST, Quy luật Mendel–Morgan–Hoán vị gen, Di truyền quần thể, Tiến hoá & Sinh thái học.',
        tags: 'Di truyền phân tử · Operon Lac · Mendel · Hoán vị · Tiến hoá · Sinh thái',
        accent: '#065F46',
        chapters: 6,
        subjectKey: 'sinh',
        grade: 12,
      },
    ],
  },
  {
    id: 'hoa-dai-hoc',
    kicker: 'HOÁ HỌC ĐẠI HỌC & BỒI DƯỠNG HSG',
    label: 'Hoá Đại học (Vô cơ & Hữu cơ)',
    subjectKey: 'hoa',
    accent: '#4F46E5',
    volumes: [
      {
        id: 'hoa-dai-cuong-vo-co',
        number: '01',
        title: 'Hoá Đại Cương — Vô Cơ',
        desc: '10 chương nền tảng từ Cơ học lượng tử nguyên tử, Thuyết VB/MO, Phức chất trường tinh thể đến Nhiệt động học, Động hoá học, Cân bằng & Điện hoá học.',
        tags: 'Nguyên tử · Phân tử · Phức chất · Nhiệt động · Động học · Điện hoá',
        accent: '#4F46E5',
        chapters: 10,
        subjectKey: 'hoa',
      },
      {
        id: 'hoa-huu-co',
        number: '02',
        title: 'Hoá Hữu Cơ Toàn Tập',
        desc: 'Bộ đại giáo trình 40 chương bao phủ toàn diện từ Hiệu ứng điện tử, Đồng phân lập thể, Cơ chế SN1/SN2/E1/E2, Hydrocarbon, Dẫn xuất chức, Carbohydrat–Peptid tới Dị vòng, Terpen & Steroid.',
        tags: '40 chương · Hiệu ứng điện tử · Cơ chế phản ứng · Dị vòng · Steroid',
        accent: '#7C3AED',
        chapters: 40,
        subjectKey: 'hoa',
      },
      {
        id: 'hoa-hoc-vo-co',
        number: '03',
        title: 'Hoá Học Vô Cơ Hệ Thống',
        desc: '17 chương chuyên khảo về hoá học các nguyên tố nhóm s, p, d, f: Hydrogen, Halogen, Chalcogen, Pnictogen, Carbon–Silic, Kim loại kiềm–kiềm thổ & Nguyên tố chuyển tiếp d.',
        tags: '17 chương · Nguyên tố s, p, d · Quặng & Luyện kim · Phức chuyển tiếp',
        accent: '#4338CA',
        chapters: 17,
        subjectKey: 'hoa',
      },
    ],
  },
  {
    id: 'sinh-ly-dai-hoc',
    kicker: 'SINH HỌC & VẬT LÍ ĐẠI HỌC — Y SINH',
    label: 'Sinh & Lí Đại học',
    subjectKey: 'sinh',
    accent: '#0F766E',
    volumes: [
      {
        id: 'sinh-hoc-dai-cuong',
        number: '01',
        title: 'Sinh học Đại cương',
        desc: '21 chương chuẩn Campbell từ cấu trúc siêu hiển vi tế bào, hệ nội màng, năng lượng sinh học, enzym, sao chép ADN, di truyền Mendel–ngoài nhân tới tiến hoá đa dạng sinh giới.',
        tags: '21 chương · Tế bào · Enzym · Hô hấp · Quang hợp · Di truyền · Tiến hoá',
        accent: '#0F766E',
        chapters: 21,
        subjectKey: 'sinh',
      },
      {
        id: 'giai-phau-sinh-ly',
        number: '02',
        title: 'Giải phẫu & Sinh lý Người',
        desc: '11 chương nền tảng Y khoa: Hệ vận động, Hệ thần kinh – Điện thế hoạt động, Hệ tuần hoàn & Tim mạch, Hệ hô hấp, Tiêu hoá, Thận – Bài tiết, Nội tiết & Miễn dịch học.',
        tags: '11 chương · Y Sinh · Thần kinh · Tim mạch · Nội tiết · Miễn dịch',
        accent: '#0D9488',
        chapters: 11,
        subjectKey: 'sinh',
      },
      {
        id: 'thuc-vat-duoc',
        number: '03',
        title: 'Thực vật Học & Dược liệu',
        desc: '13 chương giải phẫu mô thực vật, hình thái rễ–thân–lá–hoa–quả–hạt, phân loại thực vật bậc cao và các họ cây thuốc trọng điểm trong ngành Dược.',
        tags: '13 chương · Mô thực vật · Hình thái · Phân loại · Cây thuốc Dược',
        accent: '#15803D',
        chapters: 13,
        subjectKey: 'sinh',
      },
      {
        id: 'vat-ly-dai-cuong',
        number: '04',
        title: 'Vật lí Đại cương (Cơ – Nhiệt – Điện – Quang)',
        desc: '10 chương Vật lí Đại học khối Kỹ thuật (Bách Khoa, Công nghệ): Cơ học vật rắn, Cơ học chất lưu, Nhiệt động học thống kê, Trường điện từ Maxwell, Giao thoa–Nhiễu xạ & Cơ học lượng tử.',
        tags: '10 chương · Cơ vật rắn · Nhiệt động · Phương trình Maxwell · Lượng tử',
        accent: '#0284C7',
        chapters: 10,
        subjectKey: 'ly',
      },
    ],
  },
];

/* ============================================================
   BỘ GIÁO TRÌNH CHI TIẾT BIÊN SOẠN ĐỘC QUYỀN ELEC AI
   (Hoá Đại cương — Vô cơ 10 chương, Hoá Hữu cơ 40 chương,
    Sinh học Đại cương 21 chương, Hoá Vô cơ 17 chương, Vật lí ĐC 10 chương,
    Giải phẫu Sinh lý 11 chương, Thực vật Dược 13 chương)
   ============================================================ */

function buildOrganicChemistryBook() {
  const rawChapters = [
    // PHẦN I: CƠ SỞ LÝ THUYẾT HOÁ HỮU CƠ (00–06)
    { part: 0, num: '00', slug: 'mo-dau', title: 'Mở đầu Hoá học Hữu cơ', en: 'INTRODUCTION TO ORGANIC CHEMISTRY', desc: 'Lịch sử hình thành, đặc điểm hợp chất hữu cơ, phân loại theo mạch carbon và nhóm chức cùng hệ thống danh pháp IUPAC.', formula: 'C_xH_yO_zN_t \\quad (\\text{Liên kết cộng hoá trị là chủ yếu})' },
    { part: 0, num: '01', slug: 'cau-truc-carbon-lien-ket', title: 'Carbon và các liên kết', en: 'CARBON & COVALENT BONDING', desc: 'Thuyết lai hoá orbital sp³, sp², sp của nguyên tử carbon; cấu trúc liên kết σ, π; độ dài, góc liên kết và năng lượng liên kết.', formula: 'sp^3 \\ (109{,}5^\\circ) \\;\\cdot\\; sp^2 \\ (120^\\circ) \\;\\cdot\\; sp \\ (180^\\circ)' },
    { part: 0, num: '02', slug: 'hieu-ung-dien-tu', title: 'Các hiệu ứng điện tử', en: 'ELECTRONIC EFFECTS', desc: 'Hiệu ứng cảm ứng (±I), hiệu ứng liên hợp (±C), siêu liên hợp (+H) và hiệu ứng không gian quyết định mật độ electron và tâm phản ứng.', formula: '\\text{Mật độ } e^-: \\quad +I,+C \\text{ (đẩy } e\\text{)} \\;\\longleftrightarrow\\; -I,-C \\text{ (hút } e\\text{)}' },
    { part: 0, num: '03', slug: 'dong-phan-cau-dang', title: 'Đồng phân và cấu dạng', en: 'ISOMERISM & CONFORMATION', desc: 'Đồng phân cấu tạo, đồng phân hình học cis–trans / E–Z, đồng phân quang học (carbon bất đối C*, cấu hình R/S, cặp đối quang, đồng phân meso) và cấu dạng ghế–thuyền của cyclohexan.', formula: '\\text{Số đồng phân quang học tối đa} = 2^n \\quad (n: \\text{ số } C^*)' },
    { part: 0, num: '04', slug: 'acid-base-huu-co', title: 'Acid – base trong hoá hữu cơ', en: 'ORGANIC ACIDS & BASES', desc: 'Thuyết Brønsted–Lowry và Lewis; thang pKa của các nhóm chức hữu cơ; dự đoán chiều cân bằng acid–base dựa trên độ bền base liên hợp.', formula: 'pK_a = -\\lg K_a \\quad (pK_a \\text{ càng nhỏ } \\Rightarrow \\text{ acid càng mạnh})' },
    { part: 0, num: '05', slug: 'phan-ung-co-che', title: 'Phản ứng và cơ chế', en: 'REACTIONS & MECHANISMS', desc: 'Phân cắt đồng ly và dị ly; các tiểu phân trung gian (carbocation, carbanion, gốc tự do); phân loại phản ứng thế, cộng, tách, chuyển vị và giản đồ năng lượng chuyển tiếp.', formula: '\\text{Độ bền carbocation: } 3^\\circ > 2^\\circ > 1^\\circ > CH_3^+' },
    { part: 0, num: '06', slug: 'xac-dinh-cau-tao', title: 'Xác định cấu tạo phân tử', en: 'STRUCTURE ELUCIDATION (IR, MS, NMR)', desc: 'Ứng dụng phổ hồng ngoại (IR nhận diện nhóm chức), phổ khối lượng (MS tìm M+ và mảnh ion), phổ tử ngoại (UV-Vis) và cộng hưởng từ hạt nhân (¹H-NMR, ¹³C-NMR).', formula: 'IHD = \\frac{2C + 2 + N - H - X}{2}' },

    // PHẦN II: HYDROCARBON & DẪN XUẤT HALOGEN – CƠ KIM (07–15)
    { part: 1, num: '07', slug: 'alkan', title: 'Alkan', en: 'ALKANES', desc: 'Cấu tạo tứ diện, danh pháp IUPAC, tính chất vật lý theo mạch nhánh, cơ chế thế gốc tự do (SR) halogen hoá và độ chọn lọc của Cl₂ so với Br₂.', formula: 'C_nH_{2n+2} + X_2 \\xrightarrow{h\\nu} C_nH_{2n+1}X + HX \\quad (S_R)' },
    { part: 1, num: '08', slug: 'cycloalkan', title: 'Cycloalkan', en: 'CYCLOALKANES', desc: 'Sức căng vòng Baeyer và Pitzer; độ bền vượt trội của vòng 6 cạnh dạng ghế; phân biệt liên kết trục (axial) và xích đạo (equatorial).', formula: '\\Delta G^\\circ = -RT \\ln K \\quad (\\text{Nhóm lớn ưu tiên vị trí equatorial})' },
    { part: 1, num: '09', slug: 'alken', title: 'Alken', en: 'ALKENES', desc: 'Liên kết đôi C=C, cơ chế cộng electrophin (AE), quy tắc Markovnikov, cộng anti-Markovnikov với HBr/peroxid, phản ứng oxy hoá tạo diol và ozon phân.', formula: 'R-CH=CH_2 + HX \\longrightarrow R-CHX-CH_3 \\quad (\\text{Markovnikov})' },
    { part: 1, num: '10', slug: 'alkyn', title: 'Alkyn', en: 'ALKYNES', desc: 'Liên kết ba C≡C (carbon lai hoá sp), tính acid của alk-1-yn (tạo kết tủa với AgNO₃/NH₃), phản ứng cộng nước Kucherov tạo aldehyd/ceton và khử chọn lọc tạo cis/trans-alken.', formula: 'R-C\\equiv CH + H_2O \\xrightarrow{HgSO_4/H^+} [R-C(OH)=CH_2] \\longrightarrow R-CO-CH_3' },
    { part: 1, num: '11', slug: 'aren', title: 'Aren (Hydrocarbon thơm)', en: 'ARENES & AROMATICITY', desc: 'Quy tắc thơm Hückel (4n + 2 electron π), cơ chế thế electrophin vào nhân thơm (SEAr): halogen hoá, nitro hoá, sulfo hoá, Friedel–Crafts và quy luật định hướng thế ortho/para – meta.', formula: '\\text{Điều kiện thơm Hückel: } 4n + 2 \\text{ electron } \\pi \\ (n = 0,1,2...)' },
    { part: 1, num: '12', slug: 'da-nhan-thom', title: 'Hydrocarbon đa nhân thơm', en: 'POLYCYCLIC AROMATIC HYDROCARBONS', desc: 'Cấu trúc và khả năng phản ứng của Naphthalen (vị trí α vs β), Anthracen, Phenanthren và tính chất cộng/oxy hoá đặc trưng.', formula: 'C_{10}H_8 \\text{ (Naphthalen): kiểm soát động học } \\alpha \\text{ vs nhiệt động } \\beta' },
    { part: 1, num: '13', slug: 'lien-hop-alkadien', title: 'Hệ liên hợp và alkadien', en: 'CONJUGATED DIENES & DIELS-ALDER', desc: 'Hệ π liên hợp, phản ứng cộng 1,2 (kiểm soát động học) và cộng 1,4 (kiểm soát nhiệt động), phản ứng đóng vòng Diels–Alder [4+2].', formula: '\\text{Dien liên hợp } (4\\pi) + \\text{Dienophil } (2\\pi) \\xrightarrow{\\Delta} \\text{Vòng 6 cạnh}' },
    { part: 1, num: '14', slug: 'dan-xuat-halogen', title: 'Dẫn xuất halogen', en: 'ALKYL HALIDES (SN1, SN2, E1, E2)', desc: 'Bốn cơ chế kinh điển SN2 (nghịch đảo cấu hình Walden), SN1 (qua carbocation, racemic hoá), E2 (tách anti-periplanar, quy tắc Zaitsev/Hofmann) và E1.', formula: 'v(S_N2) = k[RX][Nu^-] \\quad ; \\quad v(S_N1) = k[RX]' },
    { part: 1, num: '15', slug: 'hop-chat-co-kim', title: 'Hợp chất cơ kim', en: 'ORGANOMETALLIC COMPOUNDS', desc: 'Điều chế và ứng dụng tổng hợp mạch carbon của thuốc thử Grignard (R–MgX), hợp chất cơ lithi (R–Li) và cơ đồng (R₂CuLi).', formula: 'R-X + Mg \\xrightarrow{\\text{ete khan}} R^{\\delta-}-Mg^{\\delta+}X' },

    // PHẦN III: HỢP CHẤT CHỨC OXY – NITƠ – LƯU HUỲNH – TẠP CHỨC (16–29)
    { part: 2, num: '16', slug: 'alcol', title: 'Alcol', en: 'ALCOHOLS', desc: 'Liên kết hydro và nhiệt độ sôi, tính chất lưỡng tính yếu, phản ứng thế nhóm –OH, tách nước tạo alken/ether và oxy hoá chọn lọc bằng PCC, K₂Cr₂O₇.', formula: 'R-CH_2OH \\xrightarrow{PCC} R-CHO \\xrightarrow{[O]} R-COOH' },
    { part: 2, num: '17', slug: 'phenol', title: 'Phenol', en: 'PHENOLS', desc: 'Hệ liên hợp p–π làm tăng tính acid của nhóm –OH (pKa ≈ 10) và hoạt hoá mạnh vòng benzen cho phản ứng thế Br₂/H₂O, Kolbe–Schmitt và Reimer–Tiemann.', formula: 'C_6H_5OH + 3Br_2 \\longrightarrow 2,4,6\\text{-tribromophenol}\\downarrow + 3HBr' },
    { part: 2, num: '18', slug: 'ether', title: 'Ether & Epoxid', en: 'ETHERS & EPOXIDES', desc: 'Tổng hợp ether Williamson, tính trơ hoá học làm dung môi hữu cơ, phân cắt ether bằng HI đặc và phản ứng mở vòng epoxid trong môi trường acid/base.', formula: 'R-ONa + R\'-X \\xrightarrow{S_N2} R-O-R\' + NaX' },
    { part: 2, num: '19', slug: 'aldehyd-ceton-quinon', title: 'Aldehyd, ceton và quinon', en: 'ALDEHYDES, KETONES & QUINONES', desc: 'Cơ chế cộng nucleophin (AN) vào nhóm carbonyl C=O, tạo hemiacetal/acetal, phản ứng Wittig, ngưng tụ aldol, Cannizzaro và thuốc thử Tollens/Fehling.', formula: 'R-CHO + 2[Ag(NH_3)_2]OH \\xrightarrow{\\Delta} R-COONH_4 + 2Ag\\downarrow + 3NH_3 + H_2O' },
    { part: 2, num: '20', slug: 'acid-carboxylic', title: 'Acid carboxylic', en: 'CARBOXYLIC ACIDS', desc: 'Ảnh hưởng của nhóm thế đến pKa của acid carboxylic, phản ứng ester hoá Fischer thuận nghịch, khử bằng LiAlH₄ và decacboxyl hoá.', formula: 'R-COOH + R\'-OH \\xrightleftharpoons{H^+, \\Delta} R-COOR\' + H_2O' },
    { part: 2, num: '21', slug: 'dan-xuat-acid-carboxylic', title: 'Dẫn xuất của acid carboxylic', en: 'CARBOXYLIC ACID DERIVATIVES', desc: 'Thứ tự khả năng phản ứng thế nucleophin acyl (SNAr/Acyl): Clorid acid > Anhydrid > Ester > Amid; phản ứng xà phòng hoá và ngưng tụ Claisen.', formula: 'RCOCl > (RCO)_2O > RCOOR\' > RCONH_2' },
    { part: 2, num: '22', slug: 'amin', title: 'Amin', en: 'AMINES', desc: 'Phân loại amin bậc I, II, III; so sánh lực base trong pha khí và dung dịch nước; phản ứng với HNO₂ tạo muối diazoni và tổng hợp Gabriel.', formula: 'Ar-NH_2 + NaNO_2 + 2HCl \\xrightarrow{0-5^\\circ C} Ar-N_2^+Cl^- + NaCl + 2H_2O' },
    { part: 2, num: '23', slug: 'hop-chat-nito-khac', title: 'Các hợp chất chứa nitơ khác', en: 'NITRO, NITRILES & DIAZONIUM COMPOUNDS', desc: 'Hợp chất nitro thơm và phản ứng khử, nitril (–C≡N), phản ứng Sandmeyer và ghép đôi azo từ muối diazoni tạo phẩm nhuộm.', formula: 'Ar-N_2^+Cl^- + CuX \\longrightarrow Ar-X + N_2\\uparrow + CuCl' },
    { part: 2, num: '24', slug: 'luu-huynh-phosphor', title: 'Hợp chất lưu huỳnh và phosphor', en: 'ORGANOSULFUR & ORGANOPHOSPHORUS', desc: 'Thiol (R–SH), cầu nối disulfid (–S–S–) trong cấu trúc protein, sulfoxid (DMSO), acid sulfonic và hợp chất cơ phosphor (ylid Wittig, ester phosphat ATP).', formula: '2R-SH \\xrightleftharpoons{[O] / [H]} R-S-S-R' },
    { part: 2, num: '25', slug: 'halogenoacid', title: 'Halogenoacid', en: 'HALOGENOACIDS', desc: 'Phản ứng Hell–Volhard–Zelinsky (HVZ) halogen hoá vị trí α, ảnh hưởng hút electron làm tăng mạnh lực acid và ứng dụng tổng hợp α-amino acid.', formula: 'R-CH_2-COOH + Br_2 \\xrightarrow{P} R-CH(Br)-COOH + HBr' },
    { part: 2, num: '26', slug: 'hydroxyacid', title: 'Hydroxyacid', en: 'HYDROXY ACIDS', desc: 'Acid lactic, acid citric, acid salicylic và phản ứng tách nước đặc trưng theo vị trí α (tạo lactid), β (tạo acid không no) và γ, δ (tạo lacton vòng).', formula: '\\gamma,\\delta\\text{-hydroxyacid} \\xrightarrow{H^+, \\Delta} \\text{Lacton vòng 5, 6 cạnh} + H_2O' },
    { part: 2, num: '27', slug: 'hai-chuc-carbonyl', title: 'Hợp chất hai chức có nhóm carbonyl', en: 'DICARBONYL & KETO-ACID COMPOUNDS', desc: 'Cân bằng hỗ biến ceto–enol, tính acid mạnh của nhóm –CH₂– hoạt động trong ester malonic và ethyl acetoacetat ứng dụng tổng hợp hữu cơ.', formula: 'CH_2(COOC_2H_5)_2 \\xrightarrow{1.\\ C_2H_5ONa \\; 2.\\ RX} R-CH(COOC_2H_5)_2' },
    { part: 2, num: '28', slug: 'carbohydrat', title: 'Carbohydrat', en: 'CARBOHYDRATES', desc: 'Công thức chiếu Fischer và Haworth của D-glucose, D-fructose; hiện tượng chuyển quay α ⇌ β; liên kết glycosid trong saccarose, maltose, tinh bột và cellulose.', formula: '(C_6H_{10}O_5)_n + nH_2O \\xrightarrow{H^+ / \\text{enzym}} nC_6H_{12}O_6' },
    { part: 2, num: '29', slug: 'acid-amin-peptid-protid', title: 'Acid amin, peptid và protid', en: 'AMINO ACIDS, PEPTIDES & PROTEINS', desc: 'Ion lưỡng cực (zwitterion), điểm đẳng điện pI, liên kết peptid, 4 bậc cấu trúc protein, phản ứng màu biure và giải trình tự Edman.', formula: 'pI = \\frac{pK_{a1} + pK_{a2}}{2}' },

    // PHẦN IV: HỢP CHẤT DỊ VÒNG & HỢP CHẤT THIÊN NHIÊN (30–39)
    { part: 3, num: '30', slug: 'di-vong-dai-cuong', title: 'Hợp chất dị vòng: đại cương', en: 'HETEROCYCLIC CHEMISTRY OVERVIEW', desc: 'Danh pháp Hantzsch–Widman, phân loại dị vòng thơm giàu electron π (5 cạnh) và nghèo electron π (6 cạnh), vai trò cốt lõi trong hoá dược.', formula: '\\text{Dị tố thường gặp: } N, O, S \\text{ tham gia hệ liên hợp vòng}' },
    { part: 3, num: '31', slug: 'di-vong-5-canh-1-di-to', title: 'Dị vòng 5 cạnh một dị tố', en: 'FIVE-MEMBERED HETEROCYCLES (FURAN, PYRROLE, THIOPHENE)', desc: 'So sánh độ thơm (Thiophen > Pyrrol > Furan), ưu tiên thế electrophin vào vị trí α (C2) và vai trò nhân pyrrol trong cấu trúc Hem và Chlorophyll.', formula: '\\text{Độ thơm: Benzen} > \\text{Thiophen} > \\text{Pyrrol} > \\text{Furan}' },
    { part: 3, num: '32', slug: 'di-vong-6-canh-1-di-to', title: 'Dị vòng 6 cạnh một dị tố', en: 'SIX-MEMBERED HETEROCYCLES (PYRIDINE, PYRAN)', desc: 'Cấu trúc Pyridin (nguyên tử N hút electron giống nhóm nitro), khó tham gia SEAr (vào vị trí β), dễ tham gia thế nucleophin Chichibabin ở vị trí α.', formula: 'C_5H_5N + NaNH_2 \\xrightarrow{\\Delta} 2\\text{-aminopyridin} + H_2\\uparrow' },
    { part: 3, num: '33', slug: 'di-vong-5-canh-nhieu-di-to', title: 'Dị vòng 5 cạnh nhiều dị tố', en: 'AZOLES (IMIDAZOLE, PYRAZOLE, THIAZOLE, OXAZOLE)', desc: 'Imidazol (có mặt trong histidin và histamin), pyrazol, thiazol (vitamin B1) và tính chất lưỡng tính của vòng 1,3-diazol.', formula: '\\text{Imidazol: } N_1\\text{ (kiểu pyrrol)} \\;+\\; N_3\\text{ (kiểu pyridin)}' },
    { part: 3, num: '34', slug: 'di-vong-6-canh-2-di-to', title: 'Dị vòng 6 cạnh hai dị tố', en: 'DIAZINES (PYRIMIDINE, PYRAZINE, PYRIDAZINE)', desc: 'Nhân Pyrimidin là khung cấu trúc của các base nitơ Cytosin (C), Thymin (T), Uracil (U) và các thuốc kháng khuẩn sulfamid.', formula: '\\text{Pyrimidin } (1,3\\text{-diazin}) \\longrightarrow \\text{C, T, U trong ADN/ARN}' },
    { part: 3, num: '35', slug: 'di-vong-7-canh', title: 'Dị vòng 7 cạnh', en: 'SEVEN-MEMBERED HETEROCYCLES (AZEPINE, DIAZEPINE)', desc: 'Cấu trúc không phẳng của azepin, oxepin và nhân benzodiazepin ứng dụng rộng rãi trong nhóm thuốc an thần – thần kinh trung ương.', formula: '\\text{Hệ vòng 7 cạnh } 1,4\\text{-benzodiazepin}' },
    { part: 3, num: '36', slug: 'di-vong-ngung-tu', title: 'Dị vòng ngưng tụ', en: 'FUSED HETEROCYCLES (INDOLE, QUINOLINE, PURINE)', desc: 'Indol (tryptophan, serotonin), Quinolin (thuốc sốt rét quinin), Isoquinolin và nhân Purin (Adenin, Guanin, Cafein, Acid uric).', formula: '\\text{Purin} = \\text{Pyrimidin ngưng tụ với Imidazol}' },
    { part: 3, num: '37', slug: 'acid-nucleic', title: 'Acid nucleic', en: 'NUCLEIC ACIDS (DNA & RNA)', desc: 'Cấu tạo nucleosid, nucleotid, liên kết 3\',5\'-phosphodiester, xoắn kép Watson–Crick (A=T, G≡C) và cơ chế lưu trữ – truyền đạt thông tin di truyền.', formula: '\\text{Nucleotid} = \\text{Base nitơ} + \\text{Đường pentose} + \\text{Nhóm phosphat}' },
    { part: 3, num: '38', slug: 'terpen', title: 'Terpen & Terpenoid', en: 'TERPENES & ISOPRENE RULE', desc: 'Quy tắc isopren (đầu nối đuôi của đơn vị C₅H₈), phân loại monoterpen (menthol, camphor), sesquiterpen (artemisinin) và carotenoid (β-caroten).', formula: '(C_5H_8)_n \\quad (n = 2: \\text{ monoterpen};\\ n = 8: \\text{ carotenoid})' },
    { part: 3, num: '39', slug: 'steroid', title: 'Steroid', en: 'STEROIDS & CHOLESTEROL', desc: 'Khung 4 vòng đặc trưng cyclopentanoperhydrophenanthren; cấu trúc và vai trò sinh học của cholesterol, acid mật, vitamin D và hormone sinh dục – vỏ thượng thận.', formula: '\\text{Khung Steran: 3 vòng 6 cạnh (A, B, C) + 1 vòng 5 cạnh (D)}' },
  ];

  const partMeta = [
    { partNum: 'PHẦN I', title: 'Cơ sở Lý thuyết & Cấu trúc Hữu cơ (Chương 00–06)', desc: 'Lai hoá carbon, hiệu ứng điện tử, đồng phân lập thể, acid–base, cơ chế phản ứng và phổ xác định cấu trúc.' },
    { partNum: 'PHẦN II', title: 'Hydrocarbon, Dẫn xuất Halogen & Cơ kim (Chương 07–15)', desc: 'Từ Alkan, Alken, Alkyn, Aren thơm tới bộ tứ cơ chế SN1/SN2/E1/E2 và thuốc thử Grignard.' },
    { partNum: 'PHẦN III', title: 'Hợp chất Chức Oxy – Nitơ – Tạp chức Sinh học (Chương 16–29)', desc: 'Alcol, Phenol, Carbonyl, Acid carboxylic, Amin, Carbohydrat và Amino acid – Protein.' },
    { partNum: 'PHẦN IV', title: 'Dị vòng Hoá dược & Hợp chất Thiên nhiên (Chương 30–39)', desc: 'Hệ thống dị vòng 5–6–7 cạnh, dị vòng ngưng tụ, Acid nucleic, Terpen và Steroid.' },
  ];

  return {
    id: 'hoa-huu-co',
    categoryLabel: 'Hoá học Đại học',
    title: 'Hoá Hữu Cơ Toàn Tập (40 Chương)',
    metaLine: '40 chương · 4 phần · Tiếng Việt · Giáo trình KHTN ELEC AI',
    authorCard: {
      kicker: 'GIÁO TRÌNH ĐỘC QUYỀN ELEC AI',
      author: 'Ban Biên soạn Hoá học — ELEC AI Science',
      role: 'Giáo trình Hoá Hữu Cơ Chuẩn Đại học & Bồi dưỡng HSG Quốc gia',
      note: '40 chương bao phủ trọn vẹn từ bản chất liên kết carbon, hiệu ứng điện tử, cơ chế phản ứng tới dị vòng hoá dược và hợp chất thiên nhiên. Phù hợp sinh viên Y Dược, Bách Khoa, Sư phạm và học sinh ôn HSG.',
    },
    parts: partMeta.map((pm, idx) => ({
      ...pm,
      chapters: rawChapters
        .filter((c) => c.part === idx)
        .map((c) => ({
          num: c.num,
          slug: c.slug,
          title: c.title,
          enTitle: c.en,
          desc: c.desc,
          objectives: [
            `Hiểu bản chất cấu trúc điện tử và tâm phản ứng của chuyên đề ${c.title}.`,
            `Viết đúng sơ đồ cơ chế, quy luật chọn lọc lập thể và điều kiện phản ứng trong ${c.title}.`,
            `Vận dụng ${c.title} để thiết kế chuỗi chuyển hoá tổng hợp hữu cơ và giải bài tập định tính/định lượng.`,
            `Liên hệ ứng dụng thực tiễn của ${c.title} trong Hoá dược, Vật liệu và Sinh hoá học.`,
          ],
          mentorQuote: `“Hoá hữu cơ không phải là môn học thuộc phương trình — chỉ cần nhìn rõ trung tâm giàu electron (nucleophin) và nghèo electron (electrophin) trong ${c.title}, bạn sẽ tự suy ra được 90% phản ứng.”`,
          sections: [
            {
              heading: `1. Cấu trúc phân tử & Bản chất liên kết trong ${c.title}`,
              slideRef: `Chương ${c.num} · Mục 1`,
              body: `${c.desc} Trong chuyên đề này, việc xác định trạng thái lai hoá của nguyên tử trung tâm, độ phân cực liên kết và sự phân bố mật độ electron (±I, ±C) là chìa khoá quyết định tính chất vật lý (nhiệt độ sôi, độ tan, tính quang hoạt) cũng như khả năng phản ứng hoá học của toàn dãy đồng đẳng.`,
              formula: c.formula,
            },
            {
              heading: `2. Cơ chế phản ứng trọng tâm & Quy luật chọn lọc`,
              slideRef: `Chương ${c.num} · Mục 2`,
              body: `Khi phân tích các phản ứng đặc trưng của ${c.title}, luôn đối chiếu 3 yếu tố: (1) Độ bền của tiểu phân trung gian (carbocation, gốc tự do hay trạng thái chuyển tiếp vòng), (2) Yếu tố dung môi phân cực protic/aprotic và nhiệt độ để phân biệt sản phẩm kiểm soát động học với sản phẩm kiểm soát nhiệt động, (3) Hiệu ứng lập thể (tấn công mặt sau, cộng syn/anti).`,
              formula: '',
            },
            {
              heading: `3. Chiến lược tổng hợp & Bẫy thường gặp khi thi`,
              slideRef: `Chương ${c.num} · Mục 3`,
              body: `Trong đề thi Đại học, Y Dược và HSG Hoá học, ${c.title} thường xuất hiện dưới dạng bài tập sơ đồ chuyển hoá nhiều bước hoặc nhận biết bằng phổ IR/NMR. Hãy chú ý kiểm tra hiện tượng chuyển vị carbocation (chuyển vị hydrid/methyl) và sự cạnh tranh giữa phản ứng thế và phản ứng tách để không chọn nhầm sản phẩm chính.`,
              formula: '',
            },
          ],
        })),
    })),
  };
}

function buildGeneralBiologyBook() {
  const rawChapters = [
    // PHẦN I: SINH HỌC TẾ BÀO (01–07)
    { part: 0, num: '01', slug: 'te-bao-don-vi-song', title: 'Tế bào: đơn vị của sự sống', en: 'CELL: THE UNIT OF LIFE', desc: 'Học thuyết tế bào, giới hạn kích thước tế bào (tỉ lệ S/V), kính hiển vi quang học–điện tử và các đặc trưng chung của mọi tế bào sống.', formula: '\\frac{S}{V} = \\frac{3}{r} \\quad (r \\text{ càng nhỏ } \\Rightarrow \\text{ trao đổi chất càng nhanh})' },
    { part: 0, num: '02', slug: 'te-bao-nhan-so', title: 'Tế bào nhân sơ', en: 'PROKARYOTIC CELLS', desc: 'Cấu trúc vi khuẩn và cổ khuẩn: thành tế bào peptidoglycan (Gram dương vs Gram âm), vùng nhân chứa ADN vòng trần, plasmid, ribosom 70S và lông–roi.', formula: '\\text{Gram } (+): \\text{ thành peptidoglycan dày} \\;\\cdot\\; \\text{Gram } (-): \\text{ mỏng + màng ngoài LPS}' },
    { part: 0, num: '03', slug: 'mang-sinh-chat', title: 'Màng sinh chất', en: 'PLASMA MEMBRANE', desc: 'Mô hình khảm động Singer–Nicolson: lớp kép phospholipid lưỡng cực, protein xuyên màng – bám màng, cholesterol điều hoà tính lỏng và lớp glycocalyx nhận diện tế bào.', formula: '\\text{Màng sinh chất} = \\text{Lớp kép Phospholipid} + \\text{Protein} + \\text{Cholesterol}' },
    { part: 0, num: '04', slug: 'he-noi-mang', title: 'Hệ thống nội màng và ribosom', en: 'ENDOMEMBRANE SYSTEM & RIBOSOMES', desc: 'Mạng lưới nội chất hạt (RER tổng hợp protein xuất bào), nội chất trơn (SER tổng hợp lipid, khử độc), bộ máy Golgi (đóng gói, gắn nhãn), lysosom và không bào.', formula: '\\text{Lộ trình tiết: } \\text{Ribosom} \\rightarrow \\text{RER} \\rightarrow \\text{Golgi} \\rightarrow \\text{Túi tiết} \\rightarrow \\text{Xuất bào}' },
    { part: 0, num: '05', slug: 'ty-the-luc-lap', title: 'Ty thể và lục lạp', en: 'MITOCHONDRIA & CHLOROPLASTS', desc: 'Thuyết nội cộng sinh (ADN vòng riêng, ribosom 70S, màng kép); cấu trúc mào cristae của ty thể và hệ thylakoid–stroma của lục lạp.', formula: '\\text{Ty thể: } O_2 + \\text{Chất hữu cơ} \\rightarrow ATP \\;\\cdot\\; \\text{Lục lạp: } h\\nu + CO_2 + H_2O \\rightarrow C_6H_{12}O_6' },
    { part: 0, num: '06', slug: 'nhan-va-khung-te-bao', title: 'Nhân và bộ khung tế bào', en: 'NUCLEUS & CYTOSKELETON', desc: 'Màng nhân kép có lỗ nhân, chất nhiễm sắc (euchromatin & heterochromatin), nhân con tổng hợp rARN; 3 sợi khung tế bào: vi ống (tubulin), vi sợi (actin) và sợi trung gian.', formula: '\\text{Vi ống (25 nm)} > \\text{Sợi trung gian (10 nm)} > \\text{Vi sợi Actin (7 nm)}' },
    { part: 0, num: '07', slug: 'van-chuyen-qua-mang', title: 'Vận chuyển qua màng', en: 'MEMBRANE TRANSPORT', desc: 'Khuếch tán đơn giản, khuếch tán tăng cường qua kênh protein, thẩm thấu (ưu trương–đẳng trương–nhược trương), bơm chủ động Na⁺/K⁺-ATPase và nhập–xuất bào.', formula: '\\text{Bơm } Na^+/K^+\\text{-ATPase: } 3Na^+ \\text{ ra ngoài} \\;\\leftrightarrow\\; 2K^+ \\text{ vào trong (tốn 1 ATP)}' },

    // PHẦN II: NĂNG LƯỢNG & CHUYỂN HOÁ SINH HỌC (08–11)
    { part: 1, num: '08', slug: 'nang-luong-sinh-hoc', title: 'Năng lượng và trao đổi chất', en: 'METABOLISM & BIOENERGETICS', desc: 'Nguyên lý nhiệt động học trong hệ sống, phản ứng toả năng (ΔG < 0) ghép cặp với phản ứng thu năng (ΔG > 0) nhờ đồng tiền năng lượng ATP.', formula: 'ATP + H_2O \\longrightarrow ADP + P_i \\quad (\\Delta G^{\\circ\'} = -30{,}5\\text{ kJ/mol})' },
    { part: 1, num: '09', slug: 'enzym', title: 'Enzym', en: 'ENZYMES & KINETICS', desc: 'Cơ chế hạ năng lượng hoạt hoá Ea, mô hình khớp cảm ứng, động học Michaelis–Menten (Km, Vmax), ức chế cạnh tranh – không cạnh tranh và điều hoà dị lập thể.', formula: 'v = \\frac{V_{\\max}[S]}{K_m + [S]}' },
    { part: 1, num: '10', slug: 'ho-hap-te-bao', title: 'Hô hấp tế bào', en: 'CELLULAR RESPIRATION', desc: 'Đường phân ở bào tương, oxy hoá pyruvat, chu trình Krebs ở chất nền ty thể, chuỗi truyền electron & hoá thẩm tạo ~30–32 ATP và lên men kỵ khí.', formula: 'C_6H_{12}O_6 + 6O_2 \\longrightarrow 6CO_2 + 6H_2O + 30\\text{–}32\\text{ ATP}' },
    { part: 1, num: '11', slug: 'quang-hop', title: 'Quang hợp', en: 'PHOTOSYNTHESIS', desc: 'Pha sáng trên màng thylakoid (quang hệ II & I, quang phân li nước, tạo ATP & NADPH); pha tối chu trình Calvin và thích nghi thực vật C3, C4, CAM.', formula: '6CO_2 + 12H_2O \\xrightarrow{\\text{Ánh sáng, Diệp lục}} C_6H_{12}O_6 + 6O_2 + 6H_2O' },

    // PHẦN III: DI TRUYỀN HỌC PHÂN TỬ & TẾ BÀO (12–18)
    { part: 2, num: '12', slug: 'vat-chat-di-truyen', title: 'Vật chất di truyền', en: 'GENETIC MATERIAL (DNA & RNA)', desc: 'Thí nghiệm kinh điển Griffith, Avery–MacLeod–McCarty và Hershey–Chase; cấu trúc xoắn kép ADN, quy tắc Chargaff (A=T, G=C) và phân biệt ADN với ARN.', formula: 'A = T,\\ G = C \\;\\implies\\; \\frac{A + G}{T + C} = 1' },
    { part: 2, num: '13', slug: 'nhiem-sac-the-va-gen', title: 'Nhiễm sắc thể và gen', en: 'CHROMOSOMES & GENES', desc: 'Cấu trúc nucleosom (ADN quấn quanh lõi 8 phân tử histon), các mức xoắn siêu hiển vi của NST, cấu trúc vùng điều hoà–mã hoá (exon/intron) và biểu hiện gen.', formula: '\\text{Nucleosom} \\rightarrow \\text{Sợi nhiễm sắc (30 nm)} \\rightarrow \\text{Siêu xoắn (300 nm)} \\rightarrow \\text{Chromatid (700 nm)}' },
    { part: 2, num: '14', slug: 'sao-chep-adn', title: 'Sao chép ADN', en: 'DNA REPLICATION', desc: 'Nguyên tắc bán bảo toàn (Meselson–Stahl), phức hệ enzym helicase, primase, ADN polymerase III (tổng hợp 5\'→3\' trên mạch liên tục và đoạn Okazaki), ligase và telomerase.', formula: '\\text{Chiều tổng hợp luôn là } 5\' \\longrightarrow 3\' \\text{ (mạch khuôn đọc } 3\' \\rightarrow 5\'\\text{)}' },
    { part: 2, num: '15', slug: 'chu-trinh-te-bao-phan-bao', title: 'Chu trình tế bào và phân bào', en: 'CELL CYCLE, MITOSIS & MEIOSIS', desc: 'Kỳ trung gian (G1, S, G2), điểm kiểm soát Cyclin–CDK, nguyên phân duy trì bộ NST 2n và giảm phân (trao đổi chéo kỳ đầu I, phân li độc lập) tạo giao tử n.', formula: '1\\text{ tế bào } (2n) \\xrightarrow{\\text{Nguyên phân } k \\text{ lần}} 2^k\\text{ tế bào } (2n)' },
    { part: 2, num: '16', slug: 'quy-luat-mendel', title: 'Các quy luật Mendel', en: 'MENDELIAN GENETICS', desc: 'Quy luật phân li (3:1), phân li độc lập (9:3:3:1), phép lai phân tích, tương tác gen (trội không hoàn toàn, đồng trội, bổ sung, át chế) và liên kết – hoán vị gen.', formula: 'F_2 \\text{ dị hợp } n \\text{ cặp phân li độc lập: } (3:1)^n' },
    { part: 2, num: '17', slug: 'bo-gen-nguoi-di-truyen-ngoai-nhan', title: 'Bộ gen người và di truyền ngoài nhân', en: 'HUMAN GENOME & EXTRANUCLEAR INHERITANCE', desc: 'Phân tích phả hệ bệnh di truyền trên NST thường và NST giới tính X/Y, di truyền theo dòng mẹ của ADN ty thể (mtDNA) và kỹ thuật giải trình tự hệ gen.', formula: '\\text{Di truyền ty thể: 100\\% con nhận mtDNA từ trứng của mẹ}' },
    { part: 2, num: '18', slug: 'dot-bien-bien-di', title: 'Đột biến và biến dị', en: 'MUTATIONS & GENETIC VARIATION', desc: 'Đột biến điểm (thay thế, thêm, mất cặp nucleotid gây dịch khung), đột biến cấu trúc NST (mất, lặp, đảo, chuyển đoạn) và đột biến số lượng NST (lệch bội 2n±1, đa bội).', formula: '\\text{Lệch bội: } 2n+1 \\text{ (Thể ba, VD: Down 21)} \\;\\cdot\\; 2n-1 \\text{ (Thể một, VD: Turner XO)}' },

    // PHẦN IV: TIẾN HOÁ & ĐA DẠNG SINH GIỚI (19–21)
    { part: 3, num: '19', slug: 'nguon-goc-su-song', title: 'Nguồn gốc sự sống & Tiến hoá', en: 'ORIGIN OF LIFE & EVOLUTION', desc: 'Tiến hoá hoá học (thí nghiệm Miller–Urey), thế giới ARN, thuyết tiến hoá tổng hợp hiện đại (5 nhân tố tiến hoá) và phương trình cân bằng Hardy–Weinberg.', formula: 'p^2 + 2pq + q^2 = 1 \\quad (p + q = 1)' },
    { part: 3, num: '20', slug: 'vi-khuan-virus-nguyen-sinh', title: 'Vi khuẩn, virus và nguyên sinh vật', en: 'BACTERIA, VIRUSES & PROTISTS', desc: 'Cấu tạo và chu trình nhân lên của virus (chu trình tan & tiềm tan, retrovirus HIV), đa dạng vi khuẩn – cổ khuẩn và giới Nguyên sinh vật (Protista).', formula: '\\text{Retrovirus: } ARN \\xrightarrow{\\text{Phiên mã ngược}} cADN \\longrightarrow \\text{Tích hợp hệ gen chủ}' },
    { part: 3, num: '21', slug: 'thuc-vat-nam-dong-vat', title: 'Thực vật, nấm và động vật', en: 'PLANTS, FUNGI & ANIMALS DIVERSITY', desc: 'Tiến hoá chinh phục cạn của thực vật (Rêu → Dương xỉ → Hạt trần → Hạt kín), vai trò phân giải của Nấm và các ngành Động vật từ thân lỗ tới có dây sống.', formula: '\\text{Cây phát sinh: } \\text{Nhân sơ} \\rightarrow \\text{Nguyên sinh} \\rightarrow \\text{Thực vật · Nấm · Động vật}' },
  ];

  const partMeta = [
    { partNum: 'PHẦN I', title: 'Sinh học Tế bào (Chương 01–07)', desc: 'Cấu trúc siêu hiển vi, màng sinh chất, hệ thống nội màng, ty thể – lục lạp và cơ chế vận chuyển qua màng.' },
    { partNum: 'PHẦN II', title: 'Năng lượng & Chuyển hoá Sinh học (Chương 08–11)', desc: 'Nhiệt động học sống, động học enzym, hô hấp tế bào và quang hợp.' },
    { partNum: 'PHẦN III', title: 'Di truyền Học Phân tử & Tế bào (Chương 12–18)', desc: 'ADN, NST, sao chép, phân bào, quy luật Mendel, di truyền người và đột biến.' },
    { partNum: 'PHẦN IV', title: 'Tiến hoá & Đa dạng Sinh giới (Chương 19–21)', desc: 'Nguồn gốc sự sống, vi sinh vật – virus và tiến hoá các giới sinh vật.' },
  ];

  return {
    id: 'sinh-hoc-dai-cuong',
    categoryLabel: 'Sinh học Đại học',
    title: 'Sinh học Đại cương (21 Chương)',
    metaLine: '21 chương · 4 phần · Tiếng Việt · Giáo trình KHTN ELEC AI',
    authorCard: {
      kicker: 'GIÁO TRÌNH ĐỘC QUYỀN ELEC AI',
      author: 'Ban Biên soạn Sinh học — ELEC AI Science',
      role: 'Giáo trình Sinh học Đại cương chuẩn Y Sinh & Campbell',
      note: '21 chương hệ thống hoá toàn diện từ cấp độ phân tử – tế bào tới di truyền học hiện đại và đa dạng sinh giới, tích hợp công thức động học và sơ đồ cơ chế.',
    },
    parts: partMeta.map((pm, idx) => ({
      ...pm,
      chapters: rawChapters
        .filter((c) => c.part === idx)
        .map((c) => ({
          num: c.num,
          slug: c.slug,
          title: c.title,
          enTitle: c.en,
          desc: c.desc,
          objectives: [
            `Phân tích chính xác cấu trúc giải phẫu/phân tử và chức năng sinh học trong chuyên đề ${c.title}.`,
            `Giải thích cơ chế điều hoà và mối liên hệ nhân quả giữa cấu trúc với chức năng ở ${c.title}.`,
            `Vận dụng công thức định lượng và dữ kiện thực nghiệm để giải bài tập ${c.title}.`,
            `Liên hệ kiến thức ${c.title} với bệnh học Y Sinh và ứng dụng Công nghệ Sinh học.`,
          ],
          mentorQuote: `“Trong Sinh học, mọi cấu trúc đều sinh ra để phục vụ một chức năng cụ thể. Khi đọc ${c.title}, hãy luôn tự hỏi: nếu thành phần này bị đột biến hoặc ức chế thì dòng vật chất/năng lượng sẽ tắc ở đâu?”`,
          sections: [
            {
              heading: `1. Cấu trúc cốt lõi & Nguyên lý hoạt động của ${c.title}`,
              slideRef: `Chương ${c.num} · Mục 1`,
              body: `${c.desc} Đây là mắt xích quan trọng giúp duy trì cân bằng nội môi và dòng thông tin – năng lượng của sinh vật sống.`,
              formula: c.formula,
            },
            {
              heading: `2. Cơ chế điều hoà & Phân tích tình huống thực nghiệm`,
              slideRef: `Chương ${c.num} · Mục 2`,
              body: `Trong các bài thi Sinh học Đại học, ĐGNL và HSG, đề bài thường cho đồ thị tốc độ phản ứng, nồng độ cơ chất hoặc phả hệ/bảng số liệu để kiểm tra khả năng suy luận cơ chế của ${c.title}. Hãy luôn đọc kỹ trục toạ độ, điều kiện đối chứng và dấu hiệu nhận diện điểm bão hoà hoặc đột biến.`,
              formula: '',
            },
          ],
        })),
    })),
  };
}

export const DETAILED_TEXTBOOK_CURRICULA = {
  'hoa-dai-cuong-vo-co': {
    id: 'hoa-dai-cuong-vo-co',
    categoryLabel: 'Hoá học Đại học',
    title: 'Hoá Đại Cương — Vô Cơ',
    metaLine: '10 chương · 3 phần · Tiếng Việt · Giáo trình KHTN ELEC AI',
    authorCard: {
      kicker: 'GIÁO TRÌNH ĐỘC QUYỀN ELEC AI',
      author: 'Ban Biên soạn Hoá học — ELEC AI Science',
      role: 'Giáo trình Hoá Đại Cương Chuẩn Y Dược & Bách Khoa',
      note: '10 chương cốt lõi từ cơ học lượng tử nguyên tử, thuyết liên kết VB/MO, thuyết trường tinh thể phức chất tới nhiệt động lực học, động hoá học và điện hoá học.',
    },
    parts: [
      {
        partNum: 'PHẦN I',
        title: 'Cấu trúc Vật chất (Chương 01–04)',
        desc: 'Từ hàm sóng nguyên tử và 4 số lượng tử tới lai hoá phân tử, thuyết phức chất trường tinh thể và lực tương tác liên phân tử.',
        chapters: [
          {
            num: '01',
            slug: 'cau-tao-nguyen-tu',
            title: 'Cấu tạo nguyên tử',
            enTitle: 'ATOMIC STRUCTURE',
            desc: 'Từ mẫu Bohr tới phương trình Schrödinger, 4 số lượng tử (n, l, ml, ms), hình dạng orbital s–p–d–f, quy tắc Klechkowski–Pauli–Hund và quy luật biến đổi tuần hoàn.',
            objectives: [
              'Giải thích vì sao cơ học cổ điển không giải thích được sự bền vững của nguyên tử và quang phổ vạch nguyên tử hydro.',
              'Xác định chính xác ý nghĩa vật lý và tập giá trị hợp lệ của 4 số lượng tử (n, l, m_l, m_s).',
              'Viết cấu hình electron của nguyên tử và ion kim loại chuyển tiếp (nhớ quy tắc tách 4s trước 3d).',
              'Giải thích quy luật biến thiên bán kính nguyên tử, năng lượng ion hoá I₁ và độ âm điện theo điện tích hạt nhân hiệu dụng Z*.',
            ],
            mentorQuote: '“Electron không quay quanh hạt nhân theo quỹ đạo tròn như hành tinh — nó tồn tại dưới dạng đám mây xác suất (orbital) được xác định bởi hàm sóng ψ.”',
            sections: [
              {
                heading: '1. Hệ thức de Broglie, Nguyên lý bất định Heisenberg & Hàm sóng Schrödinger',
                slideRef: 'Chương 01 · Mục 1',
                body: 'Mọi vi hạt chuyển động đều mang đồng thời tính chất sóng và hạt (λ = h / mv). Theo nguyên lý bất định Heisenberg, không thể đồng thời xác định chính xác vị trí và động lượng của electron. Vì vậy, trạng thái electron trong nguyên tử được mô tả bằng hàm sóng ψ(x,y,z) nghiệm của phương trình Schrödinger, trong đó |ψ|² biểu thị mật độ xác suất tìm thấy electron tại một điểm trong không gian.',
                formula: '\\lambda = \\frac{h}{m v} \\quad ; \\quad \\Delta x \\cdot \\Delta p_x \\ge \\frac{h}{4\\pi}',
              },
              {
                heading: '2. Bốn số lượng tử & Quy tắc điền electron',
                slideRef: 'Chương 01 · Mục 2',
                body: 'Số lượng tử chính n (1,2,3...) xác định năng lượng và kích thước lớp; số lượng tử phụ l (0 đến n−1 tương ứng s, p, d, f) xác định hình dạng orbital; số lượng tử từ ml (−l đến +l) xác định sự định hướng trong không gian; số lượng tử spin ms (±1/2) xác định chiều tự quay. Khi viết cấu hình tuân thủ 3 nguyên lý: Vững bền (Klechkowski n+l), Loại trừ Pauli và Quy tắc Hund.',
                formula: 'E_n = -13{,}6 \\cdot \\frac{Z^2}{n^2} \\text{ (eV)}',
              },
              {
                heading: '3. Hiệu ứng chắn & Điện tích hạt nhân hiệu dụng Z*',
                slideRef: 'Chương 01 · Mục 3',
                body: 'Các electron lớp trong chắn lực hút của hạt nhân đối với electron lớp ngoài, làm giảm điện tích hạt nhân thực xuống còn Z* = Z − σ (quy tắc Slater). Đây là nguyên nhân trực tiếp giải thích vì sao bán kính nguyên tử giảm dần từ trái sang phải trong cùng chu kỳ nhưng tăng đột ngột khi xuống chu kỳ dưới.',
                formula: 'Z^* = Z - \\sigma',
              },
            ],
          },
          {
            num: '02',
            slug: 'cau-tao-phan-tu',
            title: 'Cấu tạo phân tử',
            enTitle: 'MOLECULAR STRUCTURE',
            desc: 'Thuyết liên kết hoá trị (VB), lai hoá orbital, mô hình VSEPR dự đoán hình học phân tử và thuyết Orbital phân tử (MO) giải thích tính thuận từ của O₂.',
            objectives: [
              'Phân biệt liên kết σ (xen phủ trục) và liên kết π (xen phủ bên) trong thuyết VB.',
              'Xác định trạng thái lai hoá và hình học phân tử (góc, tháp tam giác, tứ diện, bát diện) theo mô hình VSEPR.',
              'Tính bậc liên kết và dự đoán từ tính (thuận từ / nghịch từ) của phân tử hai nguyên tử bằng giản đồ năng lượng MO.',
              'Đánh giá độ phân cực phân tử dựa trên tổng vectơ momen lưỡng cực.',
            ],
            mentorQuote: '“Thuyết Lewis vẽ ra O=O có đủ cặp electron ghép đôi, nhưng thí nghiệm cho thấy O₂ lỏng bị nam châm hút mạnh! Chỉ thuyết Orbital phân tử (MO) mới giải thích trọn vẹn 2 electron độc thân trên π* của O₂.”',
            sections: [
              {
                heading: '1. Mô hình VSEPR & Thuyết lai hoá Orbital',
                slideRef: 'Chương 02 · Mục 1',
                body: 'Các cặp electron hoá trị quanh nguyên tử trung tâm (cả cặp liên kết và cặp tự do) đẩy nhau sao cho khoảng cách giữa chúng lớn nhất. Vì cặp electron tự do (LP) chiếm không gian rộng hơn cặp liên kết (BP), lực đẩy giảm theo thứ tự LP–LP > LP–BP > BP–BP, làm ép nhỏ góc liên kết: CH₄ (109,5°) > NH₃ (107°) > H₂O (104,5°).',
                formula: '\\text{Số steric } = \\text{Số liên kết } \\sigma + \\text{Số cặp } e^- \\text{ tự do}',
              },
              {
                heading: '2. Thuyết Orbital Phân tử (MO) & Bậc liên kết',
                slideRef: 'Chương 02 · Mục 2',
                body: 'Sự tổ hợp tuyến tính hai orbital nguyên tử (LCAO) tạo ra một MO liên kết có năng lượng thấp hơn và một MO phản liên kết (*) có năng lượng cao hơn. Bậc liên kết bằng một nửa hiệu số electron liên kết và phản liên kết; bậc liên kết càng lớn thì năng lượng liên kết càng lớn và độ dài liên kết càng ngắn.',
                formula: 'N = \\frac{n_{\\text{lk}} - n^*_{\\text{phản lk}}}{2}',
              },
            ],
          },
          {
            num: '03',
            slug: 'phuc-chat',
            title: 'Phức chất',
            enTitle: 'COORDINATION COMPOUNDS',
            desc: 'Cấu tạo cầu nội–cầu ngoại, danh pháp phức chất IUPAC, đồng phân hình học–quang học và Thuyết trường tinh thể (CFT) giải thích màu sắc và từ tính phức d.',
            objectives: [
              'Xác định ion trung tâm, phối tử (đơn càng, đa càng/chelat), số phối trí và gọi tên phức chất chuẩn IUPAC.',
              'Vẽ sơ đồ tách mức năng lượng orbital d (t₂g và e_g) trong trường bát diện và tứ diện.',
              'Phân biệt phức spin cao (trường yếu, Δo < P) và phức spin thấp (trường mạnh, Δo > P) dựa theo dãy phổ hoá học.',
              'Tính năng lượng ổn định trường tinh thể (CFSE) và giải thích nguồn gốc màu sắc phức kim loại chuyển tiếp.',
            ],
            mentorQuote: '“Màu xanh lam rực rỡ của dung dịch CuSO₄ chính là kết quả của bước nhảy electron d–d giữa hai mức năng lượng bị tách trong trường bát diện của 6 phối tử H₂O.”',
            sections: [
              {
                heading: '1. Cấu trúc cầu nội & Dãy phổ hoá học',
                slideRef: 'Chương 03 · Mục 1',
                body: 'Phức chất gồm ion/nguyên tử trung tâm (acid Lewis nhận cặp e) liên kết cho–nhận với các phối tử (base Lewis cho cặp e). Cường độ tách trường tinh thể Δo của phối tử tăng dần theo dãy phổ hoá học: I⁻ < Br⁻ < Cl⁻ < F⁻ < OH⁻ < H₂O < NH₃ < en < NO₂⁻ < CN⁻ < CO.',
                formula: 'CFSE = (-0{,}4 \\cdot n_{t_{2g}} + 0{,}6 \\cdot n_{e_g})\\Delta_o + mP',
              },
              {
                heading: '2. Hiệu ứng Chelat & Ứng dụng Y Sinh',
                slideRef: 'Chương 03 · Mục 2',
                body: 'Phối tử đa càng như EDTA⁴⁻ tạo phức vòng càng (chelat) bền vượt trội nhờ tăng mạnh entropy ΔS > 0 khi giải phóng nhiều phân tử nước khỏi cầu phối trí. Trong y sinh, nhân Hem (phức Fe²⁺–porphyrin) vận chuyển O₂ và phức Cisplatin [Pt(NH₃)₂Cl₂] là thuốc hoá trị ung thư kinh điển.',
                formula: '\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ \\ll 0 \\quad (\\text{Hiệu ứng Chelat})',
              },
            ],
          },
          {
            num: '04',
            slug: 'lien-ket-giua-cac-phan-tu',
            title: 'Liên kết giữa các phân tử',
            enTitle: 'INTERMOLECULAR FORCES',
            desc: 'Tương tác Van der Waals (lưỡng cực–lưỡng cực, cảm ứng, khuếch tán London), liên kết hydro liên phân tử & nội phân tử và ảnh hưởng tới nhiệt độ sôi, độ tan.',
            objectives: [
              'So sánh bản chất và độ lớn năng lượng giữa liên kết cộng hoá trị/ion với tương tác liên phân tử.',
              'Giải thích bất thường nhiệt độ sôi của H₂O, NH₃, HF so với các hydrid cùng nhóm nhờ liên kết hydro.',
              'Phân biệt liên kết hydro liên phân tử (làm tăng nhiệt độ sôi) và nội phân tử (làm giảm nhiệt độ sôi, VD: o-nitrophenol).',
            ],
            mentorQuote: '“Nếu không có liên kết hydro, nước sẽ sôi ở −80°C thay vì +100°C và sự sống trên Trái Đất sẽ không bao giờ tồn tại dưới dạng lỏng.”',
            sections: [
              {
                heading: '1. Lực Van der Waals & Liên kết Hydro',
                slideRef: 'Chương 04 · Mục 1',
                body: 'Lực khuếch tán London tồn tại ở mọi phân tử và tăng theo khối lượng phân tử cùng diện tích tiếp xúc bề mặt. Liên kết hydro hình thành khi nguyên tử H gắn với nguyên tử có độ âm điện rất lớn và bán kính nhỏ (F, O, N) tương tác tĩnh điện với cặp e tự do của F, O, N khác.',
                formula: 'E_{\\text{London}} \\propto \\frac{\\alpha^2}{r^6} \\quad ; \\quad E_{\\text{H-bond}} \\approx 10\\text{–}40\\text{ kJ/mol}',
              },
            ],
          },
        ],
      },
      {
        partNum: 'PHẦN II',
        title: 'Nhiệt động, Động học & Cân bằng (Chương 05–07)',
        desc: 'Trả lời ba câu hỏi cốt lõi của mọi phản ứng hoá học: Phản ứng có tự diễn biến không? Xảy ra nhanh hay chậm? Và dừng lại ở đâu?',
        chapters: [
          {
            num: '05',
            slug: 'nhiet-dong-hoa-hoc',
            title: 'Nhiệt động hoá học',
            enTitle: 'CHEMICAL THERMODYNAMICS',
            desc: 'Định luật Hess, Enthalpy ΔH, Entropy ΔS và Năng lượng tự do Gibbs ΔG = ΔH − TΔS quyết định chiều tự diễn biến của quá trình hoá học.',
            objectives: [
              'Tính hiệu ứng nhiệt ΔH° của phản ứng từ sinh nhiệt chuẩn ΔfH° hoặc năng lượng liên kết theo định luật Hess.',
              'Dự đoán dấu của biến thiên entropy ΔS dựa trên trạng thái tập hợp và số mol khí.',
              'Sử dụng ΔG = ΔH − TΔS để xác định khoảng nhiệt độ mà phản ứng tự diễn biến.',
            ],
            mentorQuote: '“ΔH cho biết phản ứng toả hay thu nhiệt, ΔS cho biết mức độ hỗn loạn tăng hay giảm, nhưng chính ΔG mới là vị thẩm phán cuối cùng phán quyết phản ứng có tự xảy ra hay không.”',
            sections: [
              {
                heading: '1. Nguyên lý I & Định luật Hess',
                slideRef: 'Chương 05 · Mục 1',
                body: 'Enthalpy H là hàm trạng thái, do đó hiệu ứng nhiệt đẳng áp của phản ứng chỉ phụ thuộc trạng thái đầu và cuối, không phụ thuộc các giai đoạn trung gian.',
                formula: '\\Delta_r H^\\circ = \\sum \\nu_i \\Delta_f H^\\circ (\\text{sản phẩm}) - \\sum \\nu_j \\Delta_f H^\\circ (\\text{chất đầu})',
              },
              {
                heading: '2. Năng lượng tự do Gibbs ΔG & Chiều tự diễn biến',
                slideRef: 'Chương 05 · Mục 2',
                body: 'Ở nhiệt độ và áp suất không đổi: ΔG < 0 quá trình tự diễn biến theo chiều thuận; ΔG > 0 không tự diễn biến; ΔG = 0 hệ đạt trạng thái cân bằng nhiệt động.',
                formula: '\\Delta G = \\Delta H - T\\Delta S \\quad ; \\quad \\Delta G^\\circ = -RT \\ln K',
              },
            ],
          },
          {
            num: '06',
            slug: 'dong-hoa-hoc',
            title: 'Động hoá học',
            enTitle: 'CHEMICAL KINETICS',
            desc: 'Phương trình động học bậc 0, 1, 2; chu kỳ bán huỷ t₁/₂; thuyết va chạm hiệu quả, phương trình Arrhenius và cơ chế hạ năng lượng hoạt hoá của chất xúc tác.',
            objectives: [
              'Phân biệt bậc phản ứng (xác định từ thực nghiệm) với hệ số tỉ lượng trong phương trình hoá học.',
              'Sử dụng phương trình tích phân bậc 1 và tính chu kỳ bán huỷ t₁/₂ = ln2 / k.',
              'Vận dụng phương trình Arrhenius để tính năng lượng hoạt hoá Ea từ hằng số tốc độ ở hai nhiệt độ.',
            ],
            mentorQuote: '“Kim cương biến thành than chì có ΔG < 0 (tự diễn biến về mặt nhiệt động), nhưng năng lượng hoạt hoá Ea khổng lồ khiến quá trình đó mất hàng tỷ năm — đó là sức mạnh của Động hoá học.”',
            sections: [
              {
                heading: '1. Động học bậc 1 & Phương trình Arrhenius',
                slideRef: 'Chương 06 · Mục 1',
                body: 'Với phản ứng bậc 1, tốc độ tỉ lệ bậc nhất với nồng độ chất phản ứng và chu kỳ bán huỷ không phụ thuộc nồng độ ban đầu. Hằng số tốc độ k tăng theo hàm mũ khi tăng nhiệt độ T hoặc giảm năng lượng hoạt hoá Ea nhờ xúc tác.',
                formula: 't_{1/2} = \\frac{\\ln 2}{k} \\quad ; \\quad k = A \\cdot e^{-E_a / RT}',
              },
            ],
          },
          {
            num: '07',
            slug: 'can-bang-hoa-hoc',
            title: 'Cân bằng hoá học',
            enTitle: 'CHEMICAL EQUILIBRIUM',
            desc: 'Hằng số cân bằng Kc, Kp, thương số phản ứng Q, phương trình đẳng nhiệt Van’t Hoff và nguyên lý chuyển dịch cân bằng Le Chatelier.',
            objectives: [
              'Thiết lập biểu thức Kc, Kp và quy đổi Kp = Kc(RT)^Δn.',
              'So sánh Q với K để dự đoán chiều phản ứng tiến về cân bằng.',
              'Vận dụng nguyên lý Le Chatelier phân tích tác động của nồng độ, áp suất và nhiệt độ.',
            ],
            mentorQuote: '“Chất xúc tác tăng tốc độ chiều thuận và chiều nghịch như nhau — nó chỉ giúp hệ về đích cân bằng nhanh hơn chứ không bao giờ làm dịch chuyển vị trí cân bằng.”',
            sections: [
              {
                heading: '1. Quan hệ Kp, Kc & Phương trình Van’t Hoff',
                slideRef: 'Chương 07 · Mục 1',
                body: 'Hằng số cân bằng K chỉ phụ thuộc bản chất phản ứng và nhiệt độ. Khi tăng nhiệt độ, cân bằng chuyển dịch theo chiều thu nhiệt (ΔH > 0) và hằng số K thay đổi theo phương trình Van’t Hoff.',
                formula: 'K_p = K_c (RT)^{\\Delta n} \\quad ; \\quad \\ln \\frac{K_2}{K_1} = -\\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)',
              },
            ],
          },
        ],
      },
      {
        partNum: 'PHẦN III',
        title: 'Dung dịch, Điện ly & Điện hoá học (Chương 08–10)',
        desc: 'Tính chất tập hợp của dung dịch, cân bằng acid–base, dung dịch đệm, tích số tan và pin điện – phương trình Nernst.',
        chapters: [
          {
            num: '08',
            slug: 'dung-dich',
            title: 'Dung dịch & Tính chất tập hợp',
            enTitle: 'SOLUTIONS & COLLIGATIVE PROPERTIES',
            desc: 'Định luật Raoult về độ giảm áp suất hơi, độ tăng điểm sôi ΔTs, độ hạ điểm đông đặc ΔTđ và áp suất thẩm thấu π = iCMRT trong sinh học tế bào.',
            objectives: [
              'Chuyển đổi thành thạo nồng độ mol (CM), nồng độ molan (Cm) và phần mol (x).',
              'Tính độ tăng nhiệt độ sôi, độ hạ nhiệt độ đông đặc và áp suất thẩm thấu có xét hệ số Van’t Hoff (i).',
            ],
            mentorQuote: '“Truyền dung dịch NaCl 0,9% (đẳng trương với huyết tương) là ứng dụng sinh tử của định luật áp suất thẩm thấu π = iCMRT.”',
            sections: [
              {
                heading: '1. Bốn tính chất tập hợp của dung dịch loãng',
                slideRef: 'Chương 08 · Mục 1',
                body: 'Các tính chất tập hợp chỉ phụ thuộc số lượng hạt chất tan trong dung môi, không phụ thuộc bản chất hoá học của chất tan.',
                formula: '\\Delta T_s = i K_s C_m \\; ; \\; \\Delta T_{\\text{đ}} = i K_{\\text{đ}} C_m \\; ; \\; \\pi = i C_M R T',
              },
            ],
          },
          {
            num: '09',
            slug: 'dung-dich-dien-ly',
            title: 'Dung dịch điện ly, pH & Tích số tan',
            enTitle: 'ELECTROLYTES, BUFFERS & SOLUBILITY',
            desc: 'Độ điện ly α, hằng số Ka/Kb, phương trình Henderson–Hasselbalch cho dung dịch đệm sinh học (hệ đệm bicarbonat máu) và cân bằng kết tủa Ksp.',
            objectives: [
              'Tính pH của acid mạnh, acid yếu, muối thuỷ phân và dung dịch đệm.',
              'Sử dụng tích số tan Ksp để dự đoán điều kiện xuất hiện hoặc hoà tan kết tủa.',
            ],
            mentorQuote: '“Máu người giữ pH cực kỳ ổn định trong khoảng 7,35–7,45 nhờ hệ đệm H₂CO₃/HCO₃⁻ tuân theo chính xác phương trình Henderson–Hasselbalch.”',
            sections: [
              {
                heading: '1. Phương trình Henderson–Hasselbalch & Tích số tan Ksp',
                slideRef: 'Chương 09 · Mục 1',
                body: 'Dung dịch đệm chứa cặp acid yếu và base liên hợp với nồng độ xấp xỉ nhau có khả năng chống lại sự biến đổi pH khi thêm lượng nhỏ acid hoặc base mạnh.',
                formula: 'pH = pK_a + \\lg \\frac{[A^-]}{[HA]} \\quad ; \\quad Q_{sp} > K_{sp} \\Rightarrow \\text{Có kết tủa}',
              },
            ],
          },
          {
            num: '10',
            slug: 'dien-hoa-hoc',
            title: 'Điện hoá học',
            enTitle: 'ELECTROCHEMISTRY & NERNST EQUATION',
            desc: 'Cấu tạo pin Galvanic, thế điện cực chuẩn E°, phương trình Nernst tính thế ở điều kiện bất kỳ, mối liên hệ ΔG° = −nFE° và định luật điện phân Faraday.',
            objectives: [
              'Viết sơ đồ pin Galvanic (Anode bị oxi hoá ở trái, Cathode bị khử ở phải) và tính sức điện động E°pin.',
              'Áp dụng phương trình Nernst ở 25°C và tính hằng số cân bằng phản ứng oxi hoá–khử từ E°pin.',
              'Tính khối lượng chất thoát ra ở điện cực bằng định luật Faraday.',
            ],
            mentorQuote: '“Nhớ mẹo bất bại: Anode — Oxi hoá (cùng nguyên âm), Cathode — Khử (cùng phụ âm). Dòng electron ngoài mạch luôn chảy từ Anode sang Cathode.”',
            sections: [
              {
                heading: '1. Phương trình Nernst & Định luật Faraday',
                slideRef: 'Chương 10 · Mục 1',
                body: 'Thế điện cực phụ thuộc nồng độ dạng oxi hoá và dạng khử theo phương trình Nernst. Sức điện động pin liên hệ trực tiếp với công điện cực đại và năng lượng tự do Gibbs.',
                formula: 'E = E^\\circ + \\frac{0{,}0592}{n}\\lg\\frac{[\\text{Ox}]}{[\\text{Kh}]} \\quad ; \\quad \\Delta G^\\circ = -n F E^\\circ_{\\text{pin}}',
              },
            ],
          },
        ],
      },
    ],
  },
  'hoa-huu-co': buildOrganicChemistryBook(),
  'sinh-hoc-dai-cuong': buildGeneralBiologyBook(),
};

/**
 * Tự động xây dựng giáo trình KHTN THPT 10–12 từ dữ liệu thực tế của
 * `curriculumDag.js` + `dedicatedLessonsData.js` (concepts, formulas, algorithms, traps)
 * hoặc giáo trình Đại học chi tiết khi người dùng mở sách.
 */
export function getDetailedBookCurriculum(volume) {
  if (!volume) return null;
  if (DETAILED_TEXTBOOK_CURRICULA[volume.id]) {
    return DETAILED_TEXTBOOK_CURRICULA[volume.id];
  }

  // Nếu là sách KHTN THPT (có subjectKey & grade), lấy 100% kiến thức chuyên sâu từ Dedicated Lessons + DAG
  if (volume.subjectKey && volume.grade) {
    const dagChapters = getCurriculumChapters(volume.subjectKey, String(volume.grade));
    if (dagChapters.length > 0) {
      const half = Math.ceil(dagChapters.length / 2);
      const partGroups = [
        {
          partNum: 'PHẦN I',
          title: `Nền tảng & Chuyên đề Trọng tâm — ${volume.title}`,
          desc: `Hệ thống lý thuyết cốt lõi, công thức giải nhanh và bẫy đề thi chuẩn GDPT 2018 cho ${volume.title}.`,
          items: dagChapters.slice(0, half),
        },
        {
          partNum: 'PHẦN II',
          title: `Vận dụng cao & Tổng ôn thi — ${volume.title}`,
          desc: `Các chuyên đề phân loại điểm 8–10, kết hợp bài tập định lượng và câu hỏi Đúng/Sai – Trả lời ngắn.`,
          items: dagChapters.slice(half),
        },
      ].filter((g) => g.items.length > 0);

      let counter = 1;
      return {
        id: volume.id,
        categoryLabel: volume.subjectKey === 'hoa' ? 'Hoá học THPT' : volume.subjectKey === 'ly' ? 'Vật lí THPT' : 'Sinh học THPT',
        title: `${volume.title} (Chuẩn GDPT 2018)`,
        metaLine: `${dagChapters.length} chương · ${partGroups.length} phần · Tiếng Việt · Giáo trình ELEC AI`,
        authorCard: {
          kicker: 'GIÁO TRÌNH ĐỘC QUYỀN ELEC AI',
          author: `Ban Biên soạn ${volume.subjectKey === 'hoa' ? 'Hoá học' : volume.subjectKey === 'ly' ? 'Vật lí' : 'Sinh học'} — ELEC AI`,
          role: `Chương trình GDPT 2018 · Ma trận THPTQG & ĐGNL 2026`,
          note: `Tích hợp toàn bộ lý thuyết chuyên sâu, thẻ công thức KaTeX, quy trình giải mẫu và cảnh báo bẫy đề thi cho ${volume.title}.`,
        },
        parts: partGroups.map((pg) => ({
          partNum: pg.partNum,
          title: pg.title,
          desc: pg.desc,
          chapters: pg.items.map((node) => {
            const numStr = String(counter++).padStart(2, '0');
            const dedicatedLessons = findLessonsByChapter(node.dedicatedChapterId || node.id);

            // Gom toàn bộ concepts, formulas, traps thực tế từ dedicatedLessonsData.js
            const sections = [];
            const objectives = [];

            if (dedicatedLessons.length > 0) {
              dedicatedLessons.slice(0, 4).forEach((les, lIdx) => {
                objectives.push(`Làm chủ chuyên đề "${les.title}" (${les.questionsCount || 25} câu luyện tập chuẩn 2026).`);

                const conceptBody = (les.concepts || [])
                  .map((c) => `• ${c.title}: ${c.desc}`)
                  .join('\n');
                const algoBody = (les.algorithms || [])
                  .map((a) => `Bước ${a.step} — ${a.title}: ${a.instruction}`)
                  .join('\n');
                const trapBody = (les.traps || [])
                  .map((t) => `⚠ Bẫy: ${t.trap} → Cách né: ${t.avoid}`)
                  .join('\n');
                const mainFormula = (les.formulas || [])
                  .map((f) => f.displayLatex || f.formula)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(' \\quad ; \\quad ');

                const combinedBody = [
                  conceptBody,
                  algoBody ? `\nQuy trình giải chuẩn:\n${algoBody}` : '',
                  trapBody ? `\nCảnh báo bẫy đề thi:\n${trapBody}` : '',
                ].filter(Boolean).join('\n');

                sections.push({
                  heading: `${lIdx + 1}. ${les.title}`,
                  slideRef: `Bài ${lIdx + 1} · ${les.durationMinutes || 25} phút`,
                  body: combinedBody || node.desc || `Chuyên đề ${les.title} trong chương trình ${volume.title}.`,
                  formula: mainFormula,
                });
              });
            }

            if (sections.length === 0) {
              sections.push(
                {
                  heading: `1. Khái niệm cốt lõi — ${node.name}`,
                  slideRef: `Chương ${numStr} · Lý thuyết`,
                  body: node.desc || `Hệ thống kiến thức nền tảng và bản chất hiện tượng của chương ${node.name} trong chương trình ${volume.title} GDPT 2018.`,
                  formula: '',
                },
                {
                  heading: `2. Phương pháp giải & Ứng dụng ma trận đề 2026`,
                  slideRef: `Chương ${numStr} · Vận dụng`,
                  body: `Phân tích các dạng câu hỏi trắc nghiệm nhiều lựa chọn, câu hỏi Đúng/Sai 4 ý và bài toán Trả lời ngắn thường xuất hiện ở chương ${node.name}.`,
                  formula: '',
                },
              );
            }

            if (objectives.length === 0) {
              objectives.push(
                `Nắm vững toàn bộ định nghĩa, định luật và công thức của chương ${node.name}.`,
                `Nhận diện và tránh các bẫy định tính thường gặp trong câu hỏi Đúng/Sai.`,
                `Giải nhanh bài tập định lượng theo cấu trúc đề thi THPTQG 2026.`,
              );
            }

            return {
              num: numStr,
              slug: node.id,
              chapterId: node.id,
              subjectKey: node.subject,
              title: node.name,
              enTitle: `${volume.title.toUpperCase()} · CHƯƠNG ${numStr}`,
              desc: node.desc || `Chuyên đề trọng tâm ${node.name} trong chương trình ${volume.title}.`,
              objectives: objectives.slice(0, 4),
              mentorQuote: `“Hoàn thành vững chắc chương ${node.name} giúp bạn ghi trọn điểm phần Thông hiểu và tự tin chinh phục câu phân loại 8.5+ của môn ${volume.subjectKey === 'hoa' ? 'Hoá học' : volume.subjectKey === 'ly' ? 'Vật lí' : 'Sinh học'}.”`,
              sections,
            };
          }),
        })),
      };
    }
  }

  // Fallback chuyên sâu cho các giáo trình Đại học còn lại (Hoá Vô cơ 17ch, Vật lí ĐC 10ch, Giải phẫu 11ch, Thực vật Dược 13ch)
  const tags = String(volume.tags || '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const totalChapters = Math.max(4, Number(volume.chapters) || 10);
  const partDefinitions = [
    {
      partNum: 'PHẦN I',
      title: 'Cơ sở Lý thuyết & Hệ thống Khái niệm',
      desc: `Nền tảng nguyên lý, mô hình cấu trúc và các định luật cốt lõi của ${volume.title}.`,
    },
    {
      partNum: 'PHẦN II',
      title: 'Cơ chế Chuyên sâu & Phân tích Định lượng',
      desc: `Đi sâu vào từng nhóm đối tượng, cơ chế vận hành và bài toán tính toán trong ${volume.title}.`,
    },
    {
      partNum: 'PHẦN III',
      title: 'Ứng dụng Thực tiễn & Tổng hợp Liên ngành',
      desc: `Kết nối kiến thức ${volume.title} với nghiên cứu khoa học, y sinh và kỹ thuật hiện đại.`,
    },
  ];

  let chapterCounter = 1;
  const displayCount = Math.min(totalChapters, 15);
  const perPart = Math.ceil(displayCount / 3);

  const parts = partDefinitions
    .map((p) => {
      const chList = [];
      for (let i = 0; i < perPart; i++) {
        if (chapterCounter > displayCount) break;
        const numStr = String(chapterCounter).padStart(2, '0');
        const tagTopic = tags[(chapterCounter - 1) % tags.length] || volume.title;
        const nextTag = tags[chapterCounter % tags.length] || 'Chuyên sâu';
        chList.push({
          num: numStr,
          slug: `${volume.id}-ch-${numStr}`,
          title: `Chương ${numStr}: ${tagTopic} & Cơ chế ${nextTag}`,
          enTitle: `CHAPTER ${numStr} · ${tagTopic.toUpperCase()}`,
          desc: `${volume.desc} Phân tích chi tiết chuyên đề ${tagTopic.toLowerCase()}, hệ thống định luật và ứng dụng.`,
          objectives: [
            `Hiểu sâu bản chất khoa học và mô hình giải thích của chuyên đề ${tagTopic}.`,
            `Phân tích chính xác điều kiện áp dụng, giới hạn biên và các ngoại lệ trong ${tagTopic}.`,
            `Vận dụng giải quyết bài tập định lượng và tình huống thực nghiệm của ${volume.title}.`,
          ],
          mentorQuote: `“Đừng học vẹt từng dữ kiện rời rạc của ${tagTopic} — hãy nắm nguyên lý bảo toàn và mối quan hệ cấu trúc–tính chất ở mục đầu tiên.”`,
          sections: [
            {
              heading: `1. Nguyên lý cốt lõi của ${tagTopic}`,
              slideRef: `Chương ${numStr} · Mục 1`,
              body: `Trong giáo trình ${volume.title}, chuyên đề "${tagTopic}" đóng vai trò nền tảng giải thích bản chất hiện tượng. Khi nắm chắc cơ chế ở cấp độ vi mô, người học có thể tự suy luận được quy luật biến đổi ở cấp độ vĩ mô mà không cần ghi nhớ máy móc.`,
              formula: '',
            },
            {
              heading: `2. Hệ thống Quy luật, Bài toán định lượng & Ứng dụng ${nextTag}`,
              slideRef: `Chương ${numStr} · Mục 2`,
              body: `Phân tích quy trình 3 bước tiếp cận bài toán ${tagTopic}: (1) Xác định hệ quy chiếu và điều kiện chuẩn, (2) Viết phương trình bảo toàn hoặc cân bằng đặc trưng, (3) Kiểm tra tính hợp lý về mặt vật lý/hoá học/sinh học của kết quả.`,
              formula: '',
            },
          ],
        });
        chapterCounter++;
      }
      return { ...p, chapters: chList };
    })
    .filter((p) => p.chapters.length > 0);

  return {
    id: volume.id,
    categoryLabel: volume.subjectKey === 'hoa' ? 'Hoá học Đại học' : volume.subjectKey === 'ly' ? 'Vật lí Đại học' : 'Sinh học Đại học',
    title: volume.title,
    metaLine: `${volume.chapters} chương · ${parts.length} phần · Tiếng Việt · Giáo trình KHTN ELEC AI`,
    authorCard: {
      kicker: 'GIÁO TRÌNH ĐỘC QUYỀN ELEC AI',
      author: 'Ban Biên soạn KHTN — ELEC AI Science',
      role: `Chuyên khảo ${volume.title}`,
      note: `Giáo trình tương tác gồm ${volume.chapters} chương. ${volume.desc}`,
    },
    parts,
  };
}

/**
 * Lấy phẳng toàn bộ danh sách đầu sách KHTN từ 5 tầng kệ
 */
export function getAllKnowledgeVolumes() {
  const map = new Map();
  KNOWLEDGE_SHELF_TIERS.forEach((tier) => {
    (tier.volumes || []).forEach((v) => {
      if (!map.has(v.id)) {
        map.set(v.id, { ...v, slug: v.id, tierId: tier.id, tierLabel: tier.label });
      }
    });
  });
  return Array.from(map.values());
}
