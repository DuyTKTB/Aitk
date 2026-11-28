/**
 * src/data/seoPillarRoutes.js
 * -------------------------------------------------------------------
 * Single Source of Truth cho toàn bộ 31 Pillar & Tool SEO Routes của
 * ELEC Science AI (https://www.elecai.id.vn/), phủ trọn 7 nhóm từ khóa:
 *   1. Thị trường học trực tuyến (học online, học trực tuyến miễn phí, nền tảng học trực tuyến)
 *   2. AI giáo dục (AI trong giáo dục, ứng dụng AI trong học tập, chatbot giáo dục)
 *   3. Luyện thi & đề thi trực tuyến (luyện thi THPTQG, tạo đề thi online, ngân hàng câu hỏi)
 *   4. Giải bài tập & gia sư AI (giải bài tập bằng hình ảnh, gia sư AI, giải toán online)
 *   5. Giáo dục THPT (lớp 10, 11, 12; học Hóa, Lý, Sinh online; tài liệu THPT)
 *   6. Giáo viên & nhà trường (LMS, quản lý lớp học, phần mềm tạo đề, chấm OMR tự động)
 *   7. Thương hiệu (ELEC AI, ELEC Science AI, elecai.id.vn)
 *
 * File thuần ESM (không phụ thuộc DOM/React) để dùng chung giữa:
 *   - scripts/prerender-seo-routes.mjs (build-time static HTML + JSON-LD + sitemap)
 *   - src/hooks/useSeoHead.js (client-side head sync)
 *   - src/components/SeoPillarLanding.jsx (rendered DOM sync chống lệch nội dung SPA)
 */

export const SITE_ORIGIN = 'https://www.elecai.id.vn';

export const SEO_PILLAR_ROUTES = [
  /* =====================================================================
     NHÓM 1: THỊ TRƯỜNG HỌC TRỰC TUYẾN (Học online, nền tảng học trực tuyến)
     ===================================================================== */
  {
    slug: 'hoc-online-mien-phi',
    appPage: 'pillar-hoc-online',
    targetAppHash: '#tools',
    kind: 'pillar',
    group: 1,
    label: 'Học online & Nền tảng học trực tuyến miễn phí',
    title: 'Học Online Miễn Phí — Nền Tảng Học Trực Tuyến AI Cho Học Sinh · ELEC AI',
    description:
      'ELEC Science AI (elecai.id.vn) là website học online & nền tảng học trực tuyến miễn phí cho học sinh THCS, THPT: trợ lý AI giải bài tập, lộ trình học cá nhân hóa, luyện đề thi thử và 50+ công cụ học tập.',
    keywords:
      'học online, học trực tuyến, học online miễn phí, học trực tuyến miễn phí, website học online, trang web học tập, nền tảng học trực tuyến, hệ thống học trực tuyến, học tập trực tuyến, khóa học online, học từ xa, giáo dục trực tuyến, học online cho học sinh, website giáo dục, ứng dụng học tập, ELEC AI học online',
    h1: 'ELEC AI — Nền Tảng Học Online & Học Trực Tuyến Miễn Phí Cho Học Sinh',
    intro:
      'ELEC Science AI (ELEC AI tại elecai.id.vn) là hệ thống học trực tuyến và trang web học tập miễn phí thế hệ mới cho học sinh phổ thông Việt Nam. Kết hợp Gia sư AI giải bài từng bước, Phòng thi ảo chuẩn Bộ GD&ĐT, Phòng thí nghiệm mô phỏng 3D và lộ trình ôn luyện thích ứng Elo – SRS, giúp học sinh tự học từ xa hiệu quả trên mọi thiết bị.',
    ctaLabel: 'Vào học online miễn phí ngay',
    specs: {
      subject: 'Toàn bộ chương trình GDPT 2018 (Trọng tâm KHTN: Vật lí, Hóa học, Sinh học & Toán THPT)',
      method: 'Học tập trực tuyến tích hợp Gia sư AI + Lộ trình Elo + Ôn tập ngắt quãng SRS SM-2',
      audience: 'Học sinh THCS, THPT lớp 10–12, thí sinh luyện thi đại học và giáo viên giảng dạy trực tuyến',
    },
    highlights: [
      'Website học online miễn phí 100% các công cụ cốt lõi: Bảng tuần hoàn 118 nguyên tố, Cân bằng PTHH, Sổ tay công thức, Quiz SRS, Phòng thí nghiệm ảo và Tính điểm đại học.',
      'Ứng dụng học tập đa nền tảng (Web & PWA trên điện thoại, máy tính bảng, laptop) không cần cài đặt nặng, lưu đồng bộ tiến độ học từ xa theo tài khoản.',
      'Hệ sinh thái học tập trực tuyến khép kín: Hỏi bài bằng AI → Tra cứu kiến thức chuẩn SGK → Luyện đề thi thử bấm giờ → Tự động ôn lại câu sai.',
      'Kho chuyên đề, khóa học tự luyện theo từng lớp (Lớp 10, 11, 12) và Cộng đồng hỏi đáp học sinh toàn quốc.',
    ],
    steps: [
      'Mở website học tập ELEC AI (elecai.id.vn) trên trình duyệt điện thoại hoặc máy tính và tạo tài khoản học sinh miễn phí trong 30 giây.',
      'Chọn khối lớp (10, 11, 12) và mục tiêu học tập (tự học trên lớp, nâng điểm kiểm tra hoặc luyện thi THPT Quốc gia / ĐGNL).',
      'Sử dụng Trợ lý AI giải bài tập, Lộ trình Elo, Phòng thi ảo và Sổ tay lỗi sai mỗi ngày để duy trì chuỗi học tập (Streak) và tăng điểm rõ rệt.',
    ],
    faqs: [
      {
        q: 'ELEC AI có phải là website học online miễn phí cho học sinh không?',
        a: 'Có. Học sinh được sử dụng miễn phí toàn bộ công cụ học tập cốt lõi trên ELEC Science AI (elecai.id.vn) gồm lộ trình kiến thức GDPT 2018, bảng tuần hoàn, cân bằng PTHH, công thức 3 môn, phòng lab mô phỏng, quiz SRS, đề thi thử và sổ tay lỗi sai.',
      },
      {
        q: 'Nền tảng học trực tuyến ELEC AI khác gì với các trang web học tập truyền thống?',
        a: 'Thay vì chỉ đọc bài giảng thụ động một chiều, ELEC AI tích hợp trực tiếp Gia sư AI giải bài từ ảnh chụp theo 6 chế độ sư phạm, hệ thống chấm điểm năng lực Elo từng chương và thuật toán SuperMemo SM-2 tự nhắc ôn lại đúng câu học sinh hay sai.',
      },
      {
        q: 'Có thể học trực tuyến trên điện thoại mà không cần tải app không?',
        a: 'Có. ELEC Science AI hỗ trợ chuẩn PWA (Progressive Web App), chạy mượt trực tiếp trên Safari/Chrome của điện thoại Android, iOS và máy tính.',
      },
    ],
    relatedSlugs: ['ai-giao-duc', 'gia-su-ai', 'luyen-thi-thpt-quoc-gia', 'cho-giao-vien', 'hoc-tap-lop-12'],
  },

  /* =====================================================================
     NHÓM 2: AI GIÁO DỤC (AI trong giáo dục, ứng dụng AI trong học tập)
     ===================================================================== */
  {
    slug: 'ai-giao-duc',
    appPage: 'pillar-ai-giao-duc',
    targetAppHash: '#ai',
    kind: 'pillar',
    group: 2,
    label: 'AI Giáo Dục & Ứng Dụng AI Trong Học Tập',
    title: 'AI Giáo Dục — Nền Tảng Ứng Dụng Trí Tuệ Nhân Tạo Trong Học Tập · ELEC AI',
    description:
      'Khám phá nền tảng AI giáo dục ELEC Science AI: ứng dụng trí tuệ nhân tạo trong giáo dục Việt Nam với gia sư AI, chatbot giáo dục chuẩn GDPT 2018, AI tóm tắt PDF, AI tạo đề và chấm thi tự động.',
    keywords:
      'AI giáo dục, AI trong giáo dục, trí tuệ nhân tạo trong giáo dục, AI học tập, AI hỗ trợ học tập, ứng dụng AI trong học tập, chatbot giáo dục, nền tảng học tập AI, công nghệ giáo dục, học tập với AI, ELEC AI giáo dục',
    h1: 'AI Giáo Dục — Ứng Dụng Trí Tuệ Nhân Tạo Trong Học Tập & Giảng Dạy',
    intro:
      'ELEC Science AI tiên phong ứng dụng trí tuệ nhân tạo trong giáo dục phổ thông Việt Nam (EdTech). Không chỉ là một chatbot giáo dục thông thường, nền tảng kết hợp AI đa phương thức với công cụ tính toán khoa học xác định, cá nhân hóa lộ trình học tập với AI cho học sinh và tự động hóa soạn đề – giám sát – chấm bài cho giáo viên.',
    ctaLabel: 'Trải nghiệm AI hỗ trợ học tập',
    specs: {
      subject: 'Ứng dụng AI trong học tập, luyện thi THPT & quản trị giảng dạy phổ thông',
      method: 'AI đa phương thức (Text/Vision) + Deterministic Scientific Tools + MediaPipe Vision + OMR',
      audience: 'Học sinh tự học cùng AI, Giáo viên đổi mới phương pháp dạy học và Nhà trường chuyển đổi số',
    },
    highlights: [
      'Chatbot giáo dục chuyên biệt chuẩn GDPT 2018: không đưa đáp án máy móc mà hỗ trợ chế độ Socratic (gợi ý từng bước) giúp học sinh hiểu bản chất.',
      'AI hỗ trợ học tập toàn diện qua AI Doc Studio: tự động đọc file PDF bài giảng để tóm tắt ý chính, trích xuất công thức KaTeX, sinh thẻ Flashcard và đề Quiz ôn tập.',
      'Công nghệ giáo dục kết hợp kiểm chứng toán học: cân bằng PTHH bằng đại số tuyến tính và máy tính khoa học giúp hạn chế tối đa ảo giác (hallucination) của AI.',
      'Ứng dụng AI cho giáo viên: tách câu hỏi từ Word/PDF/Ảnh bằng AI, sinh đề theo ma trận đặc tả và giám sát phòng thi trực tuyến cục bộ bằng MediaPipe.',
    ],
    steps: [
      'Chọn vai trò sử dụng (Học sinh học tập với AI hoặc Giáo viên soạn đề & quản lý lớp bằng AI).',
      'Gửi bài tập bằng văn bản/ảnh chụp cho Gia sư AI, hoặc tải file PDF giáo trình vào AI Doc Studio để AI tạo bộ tài liệu ôn tập tự động.',
      'Theo dõi năng lực cải thiện theo từng chuyên đề qua bảng phân tích AI, điểm Elo và lịch ôn tập thông minh SRS.',
    ],
    faqs: [
      {
        q: 'Ứng dụng AI trong học tập trên ELEC AI có làm học sinh bị phụ thuộc không?',
        a: 'Không. ELEC Science AI được thiết kế theo triết lý sư phạm chủ động với chế độ Gợi ý từng bước (Socratic), yêu cầu học sinh tư duy theo từng gợi ý thay vì chép đáp án thụ động, đồng thời buộc học sinh luyện lại các câu sai qua hệ thống SRS.',
      },
      {
        q: 'Nền tảng học tập AI của ELEC AI hỗ trợ những tính năng trí tuệ nhân tạo nào?',
        a: 'Gồm 5 trụ cột AI: (1) Gia sư AI giải bài từng bước từ ảnh & chữ; (2) AI Doc Studio tóm tắt PDF, sinh Flashcard & Quiz; (3) AI tách và sinh đề thi cho giáo viên; (4) AI thị giác máy tính MediaPipe giám sát thi cục bộ; (5) AI phân tích hướng nghiệp RIASEC và điểm chuẩn đại học.',
      },
      {
        q: 'ELEC AI có phải là sản phẩm công nghệ giáo dục Việt Nam không?',
        a: 'Có. ELEC Science AI do Nguyễn Thế Duy sáng lập và phát triển tại Việt Nam, đoạt Giải Ba Cuộc thi Học sinh phổ thông với ý tưởng khởi nghiệp tỉnh Hưng Yên năm 2026 do Sở GD&ĐT Hưng Yên tổ chức.',
      },
    ],
    relatedSlugs: ['gia-su-ai', 'giai-bai-tap-bang-ai', 'ai-doc-studio', 'cho-giao-vien', 'hoc-online-mien-phi'],
  },

  /* =====================================================================
     NHÓM 4: GIA SƯ AI & GIẢI BÀI TẬP BẰNG AI
     ===================================================================== */
  {
    slug: 'gia-su-ai',
    appPage: 'pillar-gia-su-ai',
    targetAppHash: '#ai',
    kind: 'pillar',
    group: 4,
    label: 'Gia Sư AI & Trợ Lý Học Tập Trực Tuyến',
    title: 'Gia Sư AI Online 24/7 — Trợ Lý Học Tập Trí Tuệ Nhân Tạo · ELEC AI',
    description:
      'Gia sư AI & gia sư trực tuyến thông minh 24/7 của ELEC Science AI: kèm học cùng AI từng bước theo phương pháp Socratic, giải thích dễ hiểu, cá nhân hóa theo lớp 10–12 và hoàn toàn miễn phí bắt đầu.',
    keywords:
      'gia sư AI, gia sư trí tuệ nhân tạo, gia sư online, gia sư trực tuyến, học cùng AI, trợ lý học tập AI, ELEC AI gia sư AI',
    h1: 'Gia Sư AI & Gia Sư Trực Tuyến 24/7 — Trợ Lý Học Tập Thông Minh',
    intro:
      'Gia sư AI của ELEC Science AI đồng hành 1-kèm-1 cùng học sinh 24/7 như một gia sư trực tuyến tận tâm. Chỉ cần gõ câu hỏi hoặc gửi ảnh đề bài, trợ lý học tập AI sẽ phân tích lỗi sai, giảng giải bản chất theo đúng khối lớp (10, 11, 12 hoặc Đại học) và tạo thêm bài tập tương tự để học sinh thực sự nắm chắc kiến thức.',
    ctaLabel: 'Học cùng Gia sư AI ngay',
    specs: {
      subject: 'Gia sư AI đa môn phổ thông (chuyên sâu Vật lí, Hóa học, Sinh học, Toán học)',
      method: '6 chế độ sư phạm AI (Socratic, Giải chi tiết, Kiểm tra bài làm, Ôn lý thuyết, Tạo bài tương tự)',
      audience: 'Học sinh tự học tại nhà cần gia sư online kèm cặp chi tiết, tiết kiệm chi phí',
    },
    highlights: [
      'Hoạt động 24/7 không giới hạn khung giờ: hỏi bài lúc nửa đêm hay trước giờ kiểm tra đều nhận hướng dẫn ngay lập tức trong vài giây.',
      'Chế độ "Kiểm tra bài làm": chụp ảnh vở bài tập tự giải để Gia sư AI chấm, chỉ rõ dòng tính toán bị nhầm và hướng dẫn sửa.',
      'Chế độ "Gợi ý từng bước (Socratic)": dẫn dắt học sinh tự tìm công thức và tự giải ra đáp án để hiểu sâu, nhớ lâu.',
      'Tích hợp Bảng phấn tương tác và Sổ tay công thức KaTeX giúp trình bày lời giải trực quan như gia sư viết bảng.',
    ],
    steps: [
      'Mở Trợ lý học tập AI trên ELEC Science AI và chọn trình độ hiện tại (Lớp 10, 11, 12 hoặc Đại học).',
      'Chọn chế độ kèm học phù hợp: "Gợi ý từng bước" nếu muốn tự tư duy, hoặc "Kiểm tra đáp án" để AI rà soát bài bạn vừa làm.',
      'Đặt câu hỏi tiếp theo ngay trong đoạn chat cho đến khi hiểu hoàn toàn bản chất, sau đó yêu cầu Gia sư AI tạo thêm 3 bài tập tương tự để củng cố.',
    ],
    faqs: [
      {
        q: 'Gia sư AI có thể thay thế hoàn toàn việc học thêm truyền thống không?',
        a: 'Gia sư trí tuệ nhân tạo hỗ trợ cực tốt cho việc tự học hàng ngày, giải đáp bài tập tức thì 24/7 và lấp lỗ hổng kiến thức với chi phí gần như bằng 0, giúp bổ trợ hiệu quả cho bài giảng của thầy cô trên lớp.',
      },
      {
        q: 'Học sinh có thể hỏi lại nhiều lần nếu chưa hiểu bước giải không?',
        a: 'Có. Gia sư AI ghi nhớ ngữ cảnh cuộc trò chuyện nên bạn có thể hỏi tiếp bất kỳ dòng nào (ví dụ "Tại sao bước 2 lại dùng bảo toàn electron?") để AI giải thích lại theo cách đơn giản hơn.',
      },
    ],
    relatedSlugs: ['giai-bai-tap-bang-ai', 'tro-ly-ai-giai-hoa', 'ai-giao-duc', 'bang-phan-tuong-tac', 'lo-trinh-on-thi-thpt-quoc-gia'],
  },
  {
    slug: 'giai-bai-tap-bang-ai',
    appPage: 'pillar-giai-bai-tap',
    targetAppHash: '#ai',
    kind: 'pillar',
    group: 4,
    label: 'Giải Bài Tập Bằng AI & Hình Ảnh Miễn Phí',
    title: 'Giải Bài Tập Bằng AI & Hình Ảnh Online Miễn Phí Các Môn · ELEC AI',
    description:
      'Website & ứng dụng giải bài tập online miễn phí bằng AI của ELEC AI: chụp ảnh giải bài tập các môn Toán, Vật lí, Hóa học, Sinh học từng bước rõ ràng, hiển thị công thức KaTeX chuẩn xác.',
    keywords:
      'giải bài tập online, giải bài tập bằng AI, giải bài tập miễn phí, giải bài tập bằng hình ảnh, AI giải bài tập, AI giải bài tập miễn phí, AI giải toán, giải toán online, giải bài tập toán, AI giải bài tập các môn, hỏi đáp bài tập online, ứng dụng giải bài tập, website giải bài tập, ELEC AI giải bài tập',
    h1: 'Giải Bài Tập Bằng AI & Chụp Ảnh Giải Bài Tập Online Miễn Phí',
    intro:
      'ELEC Science AI là website giải bài tập bằng AI và ứng dụng giải bài tập bằng hình ảnh miễn phí dành cho học sinh phổ thông. Tải lên cùng lúc tối đa 10 ảnh chụp đề thi hoặc gõ trực tiếp bài tập các môn Hóa học, Vật lí, Sinh học, Toán học để nhận lời giải từng bước trình bày công thức chuẩn KaTeX cùng phần giải thích cặn kẽ.',
    ctaLabel: 'Chụp ảnh & Giải bài tập ngay',
    specs: {
      subject: 'Hóa học, Vật lí, Sinh học, Toán học và các môn phổ thông (Lớp 6–12 & Đại học)',
      method: 'Nhận diện hình ảnh OCR đa phương thức (tối đa 10 ảnh/lần) + Kiểm chứng máy tính khoa học',
      audience: 'Học sinh cần giải bài tập online nhanh, chính xác và hiểu rõ phương pháp giải',
    },
    highlights: [
      'Giải bài tập bằng hình ảnh siêu nhanh: chụp ảnh trực tiếp từ sách giáo khoa, vở bài tập, đề kiểm tra giấy hoặc tải ảnh chụp màn hình lên để AI đọc tự động.',
      'Giải bài tập các môn có lời giải chi tiết: Hóa học (cân bằng PTHH, tính mol, pH, hữu cơ), Vật lí (cơ, nhiệt, điện, sóng, hạt nhân), Sinh học (ADN, di truyền) và Toán học (hàm số, tích phân, xác suất, hình học).',
      'Trình bày công thức Toán – Lý – Hóa sắc nét bằng KaTeX, đi kèm lưu ý các bẫy sai thường gặp trong đề thi.',
      'Kết nối trực tiếp với Cộng đồng hỏi đáp bài tập online (/cong-dong) để trao đổi thêm cùng bạn học và giáo viên.',
    ],
    steps: [
      'Mở khung Trợ lý giải bài tập AI trên ELEC Science AI.',
      'Bấm biểu tượng máy ảnh/tải ảnh để chọn ảnh chụp đề bài (hỗ trợ tối đa 10 ảnh) hoặc nhập đề bài trực tiếp bằng bàn phím.',
      'Nhận lời giải chi tiết từng bước trong vài giây, kiểm chứng lại bằng máy tính khoa học tích hợp và lưu câu hay vào ghi chú.',
    ],
    faqs: [
      {
        q: 'Website giải bài tập ELEC AI có đọc được chữ viết tay hoặc ảnh chụp đề thi không?',
        a: 'Có. Hệ thống sử dụng mô hình AI thị giác đa phương thức nhận diện tốt cả đề in sách giáo khoa, file ảnh chụp màn hình lẫn chữ viết tay rõ nét, hỗ trợ tải lên tới 10 ảnh trong một lượt hỏi.',
      },
      {
        q: 'AI giải bài tập trên ELEC AI có giải được bài tập Toán, Lý, Hóa, Sinh không?',
        a: 'Có. Trợ lý AI hỗ trợ giải bài tập các môn phổ thông, đặc biệt tối ưu sâu cho Khoa học Tự nhiên (Hóa học, Vật lí, Sinh học) và Toán học THPT với hiển thị công thức KaTeX chuẩn xác.',
      },
      {
        q: 'Giải bài tập online trên ELEC AI có mất phí không?',
        a: 'Bạn có thể tạo tài khoản và trải nghiệm miễn phí ngay, đồng thời sử dụng hoàn toàn miễn phí không giới hạn bộ công cụ hỗ trợ giải bài như Cân bằng PTHH, Bảng tuần hoàn, Công thức và Máy tính Casio fx-580VN X.',
      },
    ],
    relatedSlugs: ['tro-ly-ai-giai-hoa', 'gia-su-ai', 'can-bang-phuong-trinh-hoa-hoc', 'cong-thuc-hoa-hoc', 'hoc-hoa-hoc-online'],
  },

  /* =====================================================================
     NHÓM 3: LUYỆN THI & ĐỀ THI TRỰC TUYẾN
     ===================================================================== */
  {
    slug: 'luyen-thi-thpt-quoc-gia',
    appPage: 'pillar-luyen-thi',
    targetAppHash: '#virtual-exams',
    kind: 'pillar',
    group: 3,
    label: 'Luyện Thi THPT Quốc Gia & Thi Thử Online',
    title: 'Luyện Thi THPT Quốc Gia & Ôn Thi Tốt Nghiệp THPT Online 2026 · ELEC AI',
    description:
      'Luyện thi THPT Quốc gia, ôn thi tốt nghiệp THPT & luyện thi đại học online miễn phí trên ELEC AI: ngân hàng 66+ đề thi thử 3 phần mới, bấm giờ 50 phút, chấm điểm tự động và lời giải chi tiết.',
    keywords:
      'luyện thi THPT Quốc gia, ôn thi tốt nghiệp THPT, luyện thi đại học online, thi thử THPT online, đề thi online, đề thi trắc nghiệm online, ngân hàng câu hỏi trắc nghiệm, hệ thống thi online, kiểm tra trực tuyến, ELEC AI luyện thi',
    h1: 'Luyện Thi THPT Quốc Gia, Ôn Thi Tốt Nghiệp & Thi Thử Đại Học Online',
    intro:
      'Hệ thống luyện thi đại học online của ELEC Science AI quy tụ kho đề thi thử THPT Quốc gia 2026–2027 và đề Đánh giá năng lực (HSA, TSA, V-ACT) bám sát 100% cấu trúc 3 phần mới của Bộ GD&ĐT. Học sinh làm đề thi trắc nghiệm online có bấm giờ thật, chấm điểm tự động ngay khi nộp và ôn lại toàn bộ câu sai theo thuật toán SRS.',
    ctaLabel: 'Vào thi thử THPT online ngay',
    specs: {
      subject: 'Ôn thi Tốt nghiệp THPT & ĐGNL (Vật lí, Hóa học, Sinh học, Tích hợp KHTN)',
      method: 'Cấu trúc 3 phần (18 TN 4 lựa chọn + 4 Đúng/Sai lũy tiến + 6 Trả lời ngắn) trong 50 phút',
      audience: 'Học sinh lớp 12, thí sinh tự do luyện thi đại học khối A00, A01, B00, D07 & ĐGNL',
    },
    highlights: [
      '66+ đề thi thử THPT Quốc gia & ĐGNL tuyển chọn từ các trường chuyên, Sở GD&ĐT và hội đồng chuyên môn, cập nhật liên tục.',
      'Chấm điểm lũy tiến Phần II (Đúng/Sai 4 ý: 0,1 – 0,25 – 0,5 – 1,0 điểm) chính xác tuyệt đối theo quy chế mới nhất của Bộ GD&ĐT.',
      'Mỗi đề thi online đều có lời giải chi tiết từng câu, thống kê độ chính xác theo chuyên đề và tự đẩy câu sai vào Sổ tay lỗi sai SRS.',
      'Kết nối đồng bộ với Công cụ tính điểm tốt nghiệp & Tra cứu điểm chuẩn để theo dõi sát mục tiêu đỗ đại học.',
    ],
    steps: [
      'Truy cập Kho đề thi (/de-thi) hoặc Phòng thi ảo (/phong-thi-ao) và lọc theo môn học (Hóa học, Vật lí, Sinh học, KHTN) và kỳ thi (THPTQG, HSA, TSA, V-ACT).',
      'Bấm bắt đầu để làm bài thi trắc nghiệm online bấm giờ thực 50 phút trên giao diện chống xao nhãng.',
      'Nộp bài để nhận ngay điểm số, xem lời giải chi tiết từng câu, lưu câu sai vào Sổ tay SRS và đối chiếu điểm chuẩn đại học mục tiêu.',
    ],
    faqs: [
      {
        q: 'Đề thi thử THPT online trên ELEC AI có bám sát cấu trúc đề thi mới của Bộ GD&ĐT không?',
        a: 'Có. Toàn bộ đề thi thử trên ELEC Science AI tuân thủ chuẩn cấu trúc 3 phần mới gồm 18 câu trắc nghiệm 4 lựa chọn (4,5đ), 4 câu Đúng/Sai tính điểm lũy tiến (4,0đ) và 6 câu trả lời ngắn (1,5đ) trong 50 phút.',
      },
      {
        q: 'Làm sao để luyện thi đại học online đạt 8.5+ hiệu quả nhất trên ELEC AI?',
        a: 'Bạn nên kết hợp 3 bước: kiểm tra đầu vào để lấy điểm Elo từng chương trên Lộ trình ôn thi, làm 2–3 đề thi thử bấm giờ mỗi tuần trên Phòng thi ảo, và dành 15 phút mỗi tối ôn lại câu sai trong Sổ tay SRS.',
      },
    ],
    relatedSlugs: ['phong-thi-ao', 'lo-trinh-on-thi-thpt-quoc-gia', 'tinh-diem-xet-tuyen-dai-hoc', 'tra-cuu-diem-chuan', 'hoc-tap-lop-12'],
  },

  /* =====================================================================
     NHÓM 6: GIÁO VIÊN & NHÀ TRƯỜNG (LMS, Tạo đề thi, Chấm trắc nghiệm OMR)
     ===================================================================== */
  {
    slug: 'cho-giao-vien',
    appPage: 'pillar-giao-vien',
    targetAppHash: '#classroom',
    kind: 'pillar',
    group: 6,
    label: 'ELEC AI Cho Giáo Viên & Hệ Thống LMS Giáo Dục',
    title: 'Phần Mềm Quản Lý Lớp Học, Dạy Học Trực Tuyến & LMS Giáo Dục · ELEC AI',
    description:
      'ELEC AI cho giáo viên & nhà trường: hệ thống quản lý học tập LMS giáo dục, phần mềm quản lý lớp học, quản lý học sinh, giao bài kiểm tra trực tuyến, giám sát thi AI MediaPipe và chấm phiếu OMR tự động.',
    keywords:
      'phần mềm quản lý lớp học, phần mềm quản lý học sinh, phần mềm dạy học trực tuyến, nền tảng dạy học trực tuyến, hệ thống quản lý học tập LMS, LMS giáo dục, chuyển đổi số giáo dục, công nghệ giáo dục Việt Nam, công cụ hỗ trợ giáo viên, quản lý lớp học online, ELEC AI cho giáo viên',
    h1: 'ELEC AI Cho Giáo Viên — Hệ Thống Quản Lý Lớp Học & LMS Giáo Dục Toàn Diện',
    intro:
      'Phân hệ Giáo viên & Nhà trường của ELEC Science AI là nền tảng dạy học trực tuyến và hệ thống quản lý học tập (LMS giáo dục) được xây dựng riêng cho thực tế chuyển đổi số giáo dục Việt Nam. Giáo viên dễ dàng quản lý lớp học online, quản lý học sinh, soạn & giao đề kiểm tra bằng AI, chống gian lận thi trực tuyến và chấm bài thi giấy A4 chỉ trong vài phút.',
    ctaLabel: 'Mở Không gian Giáo viên (LMS)',
    specs: {
      subject: 'Quản lý lớp học, Giao bài, Khảo thí trực tuyến & Chấm phiếu giấy cho mọi bộ môn',
      method: 'LMS Cloud + AutoExam AI (Word/PDF/Ảnh) + MediaPipe Proctoring + Camera OMR',
      audience: 'Giáo viên THCS, THPT, Trung tâm luyện thi và Ban giám hiệu nhà trường chuyển đổi số',
    },
    highlights: [
      'Quản lý lớp học online & quản lý học sinh trực quan: tạo lớp theo khối/môn, cấp mã tham gia 1 chạm, theo dõi chuyên cần, điểm số và bảng xếp hạng lớp.',
      'AutoExam Studio: phần mềm tạo đề thi trắc nghiệm thông minh từ file Word/PDF/ảnh chụp hoặc ngân hàng câu hỏi theo ma trận GDPT 2018.',
      'Phần mềm kiểm tra trực tuyến an toàn: chế độ toàn màn hình, phát hiện chuyển tab, khóa sao chép và giám sát camera cục bộ bằng MediaPipe Vision (bảo vệ quyền riêng tư học sinh).',
      'Phân tích phổ điểm & năng lực tự động: thống kê ngay câu hỏi nhiều học sinh sai nhất để giáo viên điều chỉnh bài giảng kịp thời.',
    ],
    steps: [
      'Đăng ký tài khoản với vai trò Giáo viên trên ELEC Science AI để mở Teacher Studio & LMS.',
      'Tạo lớp học mới, gửi mã lớp cho học sinh tham gia và tải đề kiểm tra (từ Word/PDF/Ảnh hoặc ngân hàng đề) vào hệ thống.',
      'Cấu hình thời gian mở đề, bật giám sát thi MediaPipe (nếu cần), theo dõi tiến độ làm bài thời gian thực và xuất bảng điểm Excel chỉ bằng 1 click.',
    ],
    faqs: [
      {
        q: 'Giáo viên có cần cài đặt phần mềm phức tạp để quản lý lớp học trên ELEC AI không?',
        a: 'Không. Hệ thống LMS giáo dục ELEC AI chạy hoàn toàn trên trình duyệt web của máy tính, máy tính bảng và điện thoại; học sinh chỉ cần nhập mã lớp hoặc mở link để vào làm bài.',
      },
      {
        q: 'Tính năng giám sát phòng thi MediaPipe có lưu video quay học sinh lên máy chủ không?',
        a: 'Không. Toàn bộ mô hình thị giác máy tính MediaPipe chạy cục bộ ngay trên trình duyệt thiết bị của thí sinh để phát hiện rời màn hình, vắng mặt hoặc nhiều người, đảm bảo tuân thủ tuyệt đối quyền riêng tư dữ liệu học đường.',
      },
      {
        q: 'Giáo viên có thể xuất bảng điểm lớp học ra file Excel để nhập sổ điểm không?',
        a: 'Có. Hệ thống hỗ trợ xuất báo cáo điểm, thống kê phổ điểm và chi tiết bài làm của từng học sinh ra định dạng Excel (.xlsx) chuẩn mực.',
      },
    ],
    relatedSlugs: ['phan-mem-tao-de-thi', 'cham-bai-trac-nghiem-tu-dong', 'ai-giao-duc', 'phong-thi-ao', 'bang-phan-tuong-tac'],
  },
  {
    slug: 'phan-mem-tao-de-thi',
    appPage: 'pillar-tao-de-thi',
    targetAppHash: '#classroom',
    kind: 'pillar',
    group: 6,
    label: 'Phần Mềm Tạo Đề Thi Trắc Nghiệm Online',
    title: 'Phần Mềm Tạo Đề Thi Trắc Nghiệm & Kiểm Tra Trực Tuyến AI · ELEC AI',
    description:
      'Phần mềm tạo đề thi online & phần mềm thi trực tuyến thông minh của ELEC AI: tự động tách đề từ Word/PDF/Ảnh, trộn mã đề, hỗ trợ 3 dạng câu hỏi GDPT 2018, tạo bài kiểm tra online và giao cho lớp trong 60 giây.',
    keywords:
      'tạo đề thi online, tạo đề kiểm tra online, phần mềm tạo đề thi, phần mềm tạo bài kiểm tra, phần mềm tạo đề thi trắc nghiệm, phần mềm thi trực tuyến, phần mềm kiểm tra trực tuyến, hệ thống thi online, ngân hàng đề thi THPT, ngân hàng câu hỏi trắc nghiệm, ELEC AI tạo đề thi',
    h1: 'Phần Mềm Tạo Đề Thi Trắc Nghiệm & Kiểm Tra Trực Tuyến Bằng AI',
    intro:
      'AutoExam Studio trên ELEC Science AI là phần mềm tạo đề thi online và phần mềm kiểm tra trực tuyến thế hệ mới giúp giáo viên rút ngắn 80% thời gian ra đề. Chỉ cần tải lên file Word (.docx), PDF hoặc ảnh đề thi sẵn có, AI tự động bóc tách câu hỏi, công thức KaTeX, đáp án và khởi tạo phòng thi trực tuyến chuẩn 3 phần Bộ GD&ĐT trong vòng 1 phút.',
    ctaLabel: 'Tạo đề thi online ngay',
    specs: {
      subject: 'Hỗ trợ tạo đề thi trắc nghiệm 12 môn phổ thông (Toán, Lý, Hóa, Sinh, Văn, Anh, Sử, Địa...)',
      method: 'Import Word/PDF/Ảnh bằng AI + Trộn mã đề tự động + Hỗ trợ 3 dạng câu hỏi GDPT 2018',
      audience: 'Giáo viên phổ thông, tổ trưởng chuyên môn và trung tâm khảo thí',
    },
    highlights: [
      'Nhập đề siêu tốc từ Word (.docx), PDF hoặc ảnh chụp: tự động nhận diện công thức toán/hóa, bảng biểu, câu hỏi 4 lựa chọn, câu Đúng/Sai 4 ý và câu trả lời ngắn.',
      'Trộn mã đề & đảo đáp án tự động cho từng thí sinh giúp chống quay cóp tuyệt đối khi kiểm tra trực tuyến.',
      'Ngân hàng câu hỏi trắc nghiệm phân loại rõ theo Môn học, Khối lớp, Chuyên đề và Mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng).',
      'Xuất bản đồng thời 2 chế độ: tổ chức thi trực tuyến có giám sát AI hoặc xuất file đề in giấy kèm phiếu OMR chấm tự động.',
    ],
    steps: [
      'Mở AutoExam Studio trong Không gian Giáo viên ELEC AI và chọn "Tạo đề mới".',
      'Tải lên file Word/PDF đề thi có sẵn, chọn câu hỏi từ Ngân hàng đề thi THPT hoặc yêu cầu AI sinh đề theo ma trận chuyên đề.',
      'Thiết lập thời gian làm bài, thang điểm, đảo câu hỏi/đáp án rồi xuất bản link/mã phòng thi để gửi cho lớp.',
    ],
    faqs: [
      {
        q: 'Phần mềm tạo đề thi ELEC AI có hỗ trợ định dạng câu hỏi Đúng/Sai và Trả lời ngắn mới 2026 không?',
        a: 'Có. Hệ thống hỗ trợ đầy đủ cả 3 dạng câu hỏi chuẩn Bộ GD&ĐT (Nhiều lựa chọn A/B/C/D, Đúng/Sai 4 lệnh hỏi tính điểm lũy tiến, và Trả lời ngắn điền số) kèm chấm điểm tự động.',
      },
      {
        q: 'Giáo viên có thể tạo bài kiểm tra online từ file Word có công thức Toán – Lý – Hóa không?',
        a: 'Có. Bộ nhập đề thông minh của ELEC AI đọc trực tiếp file Word (.docx) và PDF, chuyển đổi công thức sang chuẩn hiển thị KaTeX sắc nét và cho phép xem trước giao diện giống hệt màn hình thí sinh.',
      },
    ],
    relatedSlugs: ['cho-giao-vien', 'cham-bai-trac-nghiem-tu-dong', 'phong-thi-ao', 'luyen-thi-thpt-quoc-gia', 'ai-doc-studio'],
  },
  {
    slug: 'cham-bai-trac-nghiem-tu-dong',
    appPage: 'pillar-cham-omr',
    targetAppHash: '#classroom',
    kind: 'pillar',
    group: 6,
    label: 'Phần Mềm Chấm Bài Trắc Nghiệm Tự Động OMR',
    title: 'Phần Mềm Chấm Bài Trắc Nghiệm Tự Động Bằng Camera OMR · ELEC AI',
    description:
      'Chấm bài trắc nghiệm tự động siêu tốc bằng camera điện thoại/máy tính trên ELEC AI: hỗ trợ phiếu tô chuẩn Bộ GD&ĐT 2026 (3 phần), nhận diện chính xác, thống kê phổ điểm và xuất Excel ngay lập tức.',
    keywords:
      'chấm bài trắc nghiệm tự động, phần mềm chấm thi trắc nghiệm, phần mềm chấm bài tự động, chấm phiếu trắc nghiệm OMR, chấm thi bằng điện thoại, công cụ hỗ trợ giáo viên',
    h1: 'Phần Mềm Chấm Bài Trắc Nghiệm Tự Động Qua Camera (OMR) Chuẩn 2026',
    intro:
      'Động cơ quét chấm phiếu trắc nghiệm OMR tích hợp ngay trên trình duyệt của ELEC Science AI giúp giáo viên chấm bài thi giấy A4 chỉ trong 1–2 giây/bài bằng camera điện thoại hoặc webcam máy tính — không cần mua máy scan đắt tiền, hỗ trợ chuẩn phiếu trả lời 3 phần mới của Bộ GD&ĐT.',
    ctaLabel: 'Mở Công cụ chấm phiếu OMR',
    specs: {
      subject: 'Chấm phiếu trả lời trắc nghiệm giấy A4 cho mọi môn thi kiểm tra & thi thử THPT',
      method: 'Nhận diện quang học OMR trên trình duyệt + Tự căn chỉnh góc nghiêng + Xuất báo cáo Excel',
      audience: 'Giáo viên bộ môn, Hội đồng coi – chấm thi trường THCS, THPT và Trung tâm luyện thi',
    },
    highlights: [
      'Hỗ trợ đầy đủ 3 phần của phiếu thi tốt nghiệp THPT mới: Phần I (ABCD), Phần II (Đúng/Sai lũy tiến 4 ý) và Phần III (Tô số trả lời ngắn).',
      'Quét trực tiếp bằng camera điện thoại hoặc tải ảnh chụp phiếu bài làm lên; tự động nhận diện số báo danh, mã đề và ô tô đậm.',
      'Hiển thị trực quan ô đúng (xanh) / ô sai (đỏ) ngay trên ảnh phiếu đã chấm để giáo viên dễ kiểm tra đối chiếu và trả bài minh bạch cho học sinh.',
      'Tự động tổng hợp bảng điểm lớp, phân tích câu nào nhiều học sinh làm sai nhất và xuất file Excel chuẩn.',
    ],
    steps: [
      'Tải mẫu phiếu trả lời trắc nghiệm chuẩn của ELEC AI để in phát cho học sinh và nhập đáp án các mã đề vào hệ thống.',
      'Mở tính năng Chấm phiếu giấy (OMR) trong Teacher Studio và đưa camera vào phiếu bài làm của học sinh.',
      'Hệ thống tự nhận diện, tính điểm chuẩn xác trong tích tắc, lưu vào sổ điểm lớp và xuất bảng thống kê Excel.',
    ],
    faqs: [
      {
        q: 'Phần mềm chấm thi trắc nghiệm ELEC AI có cần tải app riêng trên điện thoại không?',
        a: 'Không cần. Công cụ chấm OMR chạy trực tiếp trên trình duyệt web (Safari/Chrome) của điện thoại và máy tính nhờ công nghệ xử lý ảnh cục bộ tốc độ cao.',
      },
      {
        q: 'Chấm bài tự động OMR có xử lý được câu hỏi Đúng/Sai tính điểm lũy tiến không?',
        a: 'Có. Hệ thống tự động áp dụng quy tắc lũy tiến Bộ GD&ĐT (0,1 – 0,25 – 0,5 – 1,0 điểm/câu) mà giáo viên không cần phải cộng tay lại.',
      },
    ],
    relatedSlugs: ['phan-mem-tao-de-thi', 'cho-giao-vien', 'phong-thi-ao', 'ai-giao-duc'],
  },

  /* =====================================================================
     NHÓM 5: GIÁO DỤC THPT (Lớp 10, 11, 12 & Học Hóa, Vật lý, Sinh học online)
     ===================================================================== */
  {
    slug: 'hoc-tap-lop-10',
    appPage: 'pillar-lop-10',
    targetAppHash: '#roadmap',
    kind: 'pillar',
    group: 5,
    label: 'Học Tập Lớp 10 Trực Tuyến (GDPT 2018)',
    title: 'Học Tập Lớp 10 Online — Kiến Thức, Tài Liệu & Đề Kiểm Tra THPT · ELEC AI',
    description:
      'Học tập lớp 10 trực tuyến chuẩn chương trình GDPT 2018 trên ELEC AI: trọn bộ kiến thức, tài liệu học tập THPT, bài tập trắc nghiệm có lời giải và đề kiểm tra lớp 10 các môn Hóa học, Vật lí, Sinh học, Toán.',
    keywords:
      'học tập lớp 10, kiến thức THPT, tài liệu học tập THPT, bài tập trắc nghiệm THPT, đề kiểm tra THPT, công cụ học tập cho học sinh, website học tập cho học sinh',
    h1: 'Học Tập Lớp 10 Trực Tuyến — Nền Tảng Kiến Thức THPT Chuẩn GDPT 2018',
    intro:
      'Chuyên mục Học tập lớp 10 của ELEC Science AI hệ thống hóa toàn bộ kiến thức nền tảng năm đầu cấp THPT theo 3 bộ sách giáo khoa (Kết nối tri thức, Chân trời sáng tạo, Cánh diều): từ Động học – Động lực học (Vật lí 10), Cấu tạo nguyên tử – Bảng tuần hoàn IUPAC – Liên kết – Enthalpy – Halogen (Hóa học 10) đến Tế bào học & Vi sinh vật (Sinh học 10).',
    ctaLabel: 'Mở Lộ trình học tập Lớp 10',
    specs: {
      subject: 'Lớp 10 THPT — Hóa học 10, Vật lí 10, Sinh học 10 & Toán 10 (GDPT 2018)',
      method: 'Cây lộ trình chuyên đề + Mô phỏng trực quan + Quiz trắc nghiệm SRS + Trợ lý AI',
      audience: 'Học sinh lớp 10 mới chuyển cấp cần xây nền tảng vững chắc cho kỳ thi THPTQG',
    },
    highlights: [
      'Hóa học 10 chuẩn danh pháp quốc tế IUPAC: Cấu tạo nguyên tử, Bảng tuần hoàn 118 nguyên tố, Liên kết hóa học, Phản ứng oxi hóa – khử, Biến thiên Enthalpy, Tốc độ phản ứng và Nhóm Halogen.',
      'Vật lí 10 gắn với Phòng thí nghiệm Vật lí ảo: Chuyển động ném xiên, Định luật Newton, Công – Năng lượng và Bảo toàn động lượng.',
      'Sinh học 10 kết hợp Lab Sinh học 3D: Cấu trúc tế bào nhân thực/nhân sơ, Enzyme, Quang hợp – Hô hấp tế bào, Nguyên phân – Giảm phân và Vi sinh vật.',
      'Ngân hàng đề kiểm tra 15 phút, giữa kì, cuối kì lớp 10 định dạng mới kèm lời giải chi tiết.',
    ],
    steps: [
      'Mở Lộ trình KHTN và chọn khối Lớp 10 theo chương trình GDPT 2018.',
      'Học từng chương bài kèm công thức chuẩn KaTeX, thí nghiệm mô phỏng và làm bài tập trắc nghiệm củng cố.',
      'Bất cứ bài tập nào khó hiểu, chụp ảnh gửi ngay cho Trợ lý AI chế độ Lớp 10 để được hướng dẫn từng bước.',
    ],
    faqs: [
      {
        q: 'Kiến thức lớp 10 trên ELEC AI có bám sát 3 bộ sách giáo khoa mới không?',
        a: 'Có. Nội dung lý thuyết, công thức, danh pháp IUPAC và ngân hàng câu hỏi lớp 10 bám sát khung chương trình GDPT 2018 chung cho cả Kết nối tri thức, Chân trời sáng tạo và Cánh diều.',
      },
      {
        q: 'Học sinh lớp 10 chưa biết chọn tổ hợp môn có dùng công cụ hướng nghiệp trên ELEC AI được không?',
        a: 'Có. Bạn có thể làm bài trắc nghiệm hướng nghiệp RIASEC miễn phí tại /dinh-huong-nghe-nghiep để hiểu thế mạnh bản thân và chọn đúng tổ hợp môn KHTN phù hợp.',
      },
    ],
    relatedSlugs: ['hoc-tap-lop-11', 'hoc-tap-lop-12', 'hoc-hoa-hoc-online', 'hoc-vat-ly-online', 'hoc-sinh-hoc-online'],
  },
  {
    slug: 'hoc-tap-lop-11',
    appPage: 'pillar-lop-11',
    targetAppHash: '#roadmap',
    kind: 'pillar',
    group: 5,
    label: 'Học Tập Lớp 11 Trực Tuyến (GDPT 2018)',
    title: 'Học Tập Lớp 11 Online — Kiến Thức, Công Thức & Trắc Nghiệm THPT · ELEC AI',
    description:
      'Học tập lớp 11 trực tuyến trên ELEC AI: trọn bộ lý thuyết, tài liệu học tập THPT, bài tập trắc nghiệm và đề kiểm tra lớp 11 các môn Hóa hữu cơ, Cân bằng hóa học, Dao động – Sóng – Điện trường và Sinh học cơ thể.',
    keywords:
      'học tập lớp 11, kiến thức THPT, tài liệu học tập THPT, bài tập trắc nghiệm THPT, đề kiểm tra THPT, học online cho học sinh',
    h1: 'Học Tập Lớp 11 Trực Tuyến — Làm Chủ Kiến Thức Trọng Tâm Thi THPT',
    intro:
      'Lớp 11 chiếm tỷ trọng quan trọng trong đề thi Tốt nghiệp THPT và Đánh giá năng lực. Chuyên mục Học tập lớp 11 trên ELEC Science AI giúp học sinh nắm chắc từ Cân bằng hóa học – Nitrogen – Sulfur – Hóa hữu cơ (Hóa 11), Dao động – Sóng – Điện trường – Mạch điện (Vật lí 11) đến Sinh học cơ thể thực vật & động vật (Sinh học 11).',
    ctaLabel: 'Mở Lộ trình học tập Lớp 11',
    specs: {
      subject: 'Lớp 11 THPT — Hóa học 11, Vật lí 11, Sinh học 11 & Toán 11 (GDPT 2018)',
      method: 'Chuyên đề lý thuyết + Máy tính công thức nhanh + Quiz thích ứng Elo & SRS',
      audience: 'Học sinh lớp 11 chuẩn bị bứt phá điểm số trên lớp và tạo đà sớm cho kỳ thi lớp 12',
    },
    highlights: [
      'Hóa học 11: Cân bằng hóa học, pH, Nitrogen & Sulfur, Đại cương hữu cơ, Hydrocarbon, Dẫn xuất Halogen, Alcohol – Phenol, Aldehyde – Ketone – Carboxylic acid.',
      'Vật lí 11: Dao động điều hòa, Sóng cơ & Giao thoa sóng (kèm mô phỏng Sóng 2D), Điện trường và Dòng điện không đổi (kèm Lab mạch điện DC).',
      'Sinh học 11: Trao đổi nước – khoáng, Quang hợp C3/C4/CAM, Tuần hoàn – Hô hấp – Miễn dịch và Cảm ứng ở sinh vật.',
      'Kho bài tập trắc nghiệm THPT lớp 11 có lời giải chi tiết, phân tích câu hỏi Đúng/Sai thực nghiệm.',
    ],
    steps: [
      'Chọn khối Lớp 11 trên Lộ trình ôn tập ELEC AI và chọn môn học trọng tâm của tổ hợp xét tuyển.',
      'Thực hành mô phỏng thí nghiệm trực quan kết hợp tra cứu Sổ tay công thức lớp 11.',
      'Làm bộ đề kiểm tra giữa kì/cuối kì lớp 11 và ôn tập định kỳ những câu sai trong Sổ tay SRS.',
    ],
    faqs: [
      {
        q: 'Kiến thức lớp 11 có xuất hiện trong đề thi tốt nghiệp THPT Quốc gia 2026 không?',
        a: 'Có. Theo cấu trúc đề thi GDPT 2018, kiến thức lớp 10 và lớp 11 chiếm khoảng 20–30% câu hỏi trong đề thi tốt nghiệp THPT và tỷ trọng rất cao trong các kỳ thi ĐGNL (HSA, TSA, V-ACT).',
      },
    ],
    relatedSlugs: ['hoc-tap-lop-10', 'hoc-tap-lop-12', 'hoc-hoa-hoc-online', 'hoc-vat-ly-online', 'cong-thuc-hoa-hoc'],
  },
  {
    slug: 'hoc-tap-lop-12',
    appPage: 'pillar-lop-12',
    targetAppHash: '#roadmap',
    kind: 'pillar',
    group: 5,
    label: 'Học Tập Lớp 12 & Tài Liệu Ôn Thi THPT',
    title: 'Học Tập Lớp 12 & Tài Liệu Ôn Thi THPT Quốc Gia 2026 · ELEC AI',
    description:
      'Học tập lớp 12 & tài liệu ôn thi THPT Quốc gia 2026 trên ELEC AI: tổng hợp kiến thức trọng tâm Lý 12, Hóa 12, Sinh 12 theo GDPT 2018, đề thi thử 3 phần, lộ trình Elo và tính điểm xét tuyển đại học.',
    keywords:
      'học tập lớp 12, tài liệu ôn thi THPT, kiến thức THPT, bài tập trắc nghiệm THPT, đề kiểm tra THPT, ôn thi tốt nghiệp THPT, website học tập cho học sinh',
    h1: 'Học Tập Lớp 12 & Tài Liệu Ôn Thi Tốt Nghiệp THPT Quốc Gia 2026',
    intro:
      'Chuyên mục Học tập lớp 12 của ELEC Science AI được thiết kế chuyên sâu cho năm cuối cấp: phủ trọn 100% chuyên đề lớp 12 chương trình mới GDPT 2018, hệ thống công thức giải nhanh 2026, 66+ đề thi thử THPTQG & ĐGNL bấm giờ thật cùng bộ công cụ tính điểm tốt nghiệp và tra cứu điểm chuẩn đại học.',
    ctaLabel: 'Vào Lộ trình Lớp 12 & Ôn thi',
    specs: {
      subject: 'Lớp 12 THPT — Vật lí 12, Hóa học 12, Sinh học 12 & Ôn thi Đại học (A00, A01, B00, D07)',
      method: 'Lộ trình 3 giai đoạn (Nền tảng → Chuyên sâu → Luyện đề) theo điểm Elo + SRS SM-2',
      audience: 'Học sinh lớp 12 ôn thi tốt nghiệp THPT Quốc gia và Đánh giá năng lực HSA, TSA, V-ACT',
    },
    highlights: [
      'Hóa học 12 GDPT 2018: Ester – Lipid, Carbohydrate, Amine – Amino acid – Peptide – Protein, Polymer, Pin điện & Điện phân, Đại cương Kim loại, Kim loại IA/IIA & Phức chất.',
      'Vật lí 12 GDPT 2018: Vật lí nhiệt, Khí lí tưởng, Từ trường – Cảm ứng điện từ và Vật lí hạt nhân – Phóng xạ.',
      'Sinh học 12 GDPT 2018: Di truyền phân tử ADN/RNA, Đột biến & Công nghệ gene, Quy luật Mendel – Hoán vị gene, Di truyền quần thể Hardy-Weinberg, Tiến hóa & Sinh thái học.',
      'Tích hợp trọn bộ công cụ cuối cấp: Tính điểm tốt nghiệp 2026, Tra cứu điểm chuẩn đại học và Luyện đề phòng thi ảo.',
    ],
    steps: [
      'Đặt mục tiêu trường đại học & tổ hợp xét tuyển (A00, A01, B00, D07) trên ELEC AI.',
      'Học chắc từng chuyên đề lớp 12 theo cây lộ trình Elo và luyện Quiz trắc nghiệm sau mỗi bài.',
      'Thực chiến đều đặn trên Phòng thi ảo chuẩn 3 phần (50 phút) và rà soát toàn bộ lỗi sai trước ngày thi.',
    ],
    faqs: [
      {
        q: 'Tài liệu ôn thi THPT lớp 12 trên ELEC AI đã cập nhật chương trình mới 2025–2026 chưa?',
        a: 'Đã cập nhật 100%. Toàn bộ chuyên đề Vật lí nhiệt, Khí lí tưởng, Phức chất, danh pháp IUPAC, thể tích mol đkc 24,79 L/mol và cấu trúc đề 3 phần mới đều đã được chuẩn hóa.',
      },
    ],
    relatedSlugs: ['luyen-thi-thpt-quoc-gia', 'phong-thi-ao', 'tinh-diem-xet-tuyen-dai-hoc', 'tra-cuu-diem-chuan', 'hoc-hoa-hoc-online'],
  },
  {
    slug: 'hoc-hoa-hoc-online',
    appPage: 'pillar-hoc-hoa',
    targetAppHash: '#roadmap',
    kind: 'pillar',
    group: 5,
    label: 'Học Hóa Học Online & Tài Liệu Hóa THPT',
    title: 'Học Hóa Học Online THPT — Tài Liệu & Bài Tập Hóa Có Lời Giải · ELEC AI',
    description:
      'Học Hóa học online lớp 10, 11, 12 chuẩn IUPAC trên ELEC AI: tài liệu Hóa học THPT, bài tập Hóa học có lời giải chi tiết, bảng tuần hoàn 118 nguyên tố, cân bằng PTHH tự động và phòng thí nghiệm Hóa 3D.',
    keywords:
      'học Hóa học online, tài liệu Hóa học THPT, bài tập Hóa học có lời giải, giải Hóa bằng AI, học Hóa lớp 10 11 12, hóa học GDPT 2018 IUPAC',
    h1: 'Học Hóa Học Online THPT — Tài Liệu, Công Cụ & Bài Tập Có Lời Giải',
    intro:
      'ELEC Science AI là hệ sinh thái học Hóa học online chuyên sâu hàng đầu theo chuẩn danh pháp quốc tế IUPAC và chương trình GDPT 2018. Tích hợp từ Bảng tuần hoàn 118 nguyên tố chi tiết, Máy cân bằng phương trình hóa học bằng đại số tuyến tính, Phòng thí nghiệm Hóa 3D cho đến Trợ lý AI giải bài tập Hóa từng bước.',
    ctaLabel: 'Bắt đầu học Hóa học online',
    specs: {
      subject: 'Hóa học THCS & THPT Lớp 10, 11, 12 chuẩn danh pháp IUPAC & đkc 24,79 L/mol',
      method: 'Bảng tuần hoàn 118 nguyên tố + Cân bằng PTHH Gauss + Lab Hóa 3D + AI giải Hóa từng bước',
      audience: 'Học sinh mất gốc Hóa, học sinh lớp 10–12 khối A00/B00/D07 và giáo viên Hóa học',
    },
    highlights: [
      'Kho 118 trang tra cứu chuyên sâu từng nguyên tố hóa học (/nguyen-to) và thư viện 65+ phương trình hóa học trọng tâm THPT (/phuong-trinh).',
      'Trọn bộ công thức Hóa học 2026: đkc 24,79 L/mol, Enthalpy ΔrH°298, Van’t Hoff, pH, Pin điện hóa E°pin, Điện phân Faraday và Ester hóa.',
      'Giải bài tập Hóa học có lời giải chi tiết bằng AI kèm kiểm tra bảo toàn khối lượng, bảo toàn nguyên tố và bảo toàn electron.',
      'Học phản ứng trực quan, an toàn tuyệt đối qua Phòng thí nghiệm Hóa học 3D và các game Đấu nguyên tố, Sudoku Hóa học.',
    ],
    steps: [
      'Tra cứu nhanh tính chất nguyên tố trên Bảng tuần hoàn (/bang-tuan-hoan) hoặc cân bằng phản ứng trên Máy cân bằng PTHH (/can-bang-phuong-trinh-hoa-hoc).',
      'Học từng chuyên đề Hóa 10, 11, 12 trong Lộ trình và làm bài tập trắc nghiệm có lời giải chi tiết.',
      'Chụp ảnh bài toán Hóa khó gửi Trợ lý AI để xem phân tích phương pháp bảo toàn và làm đề thi thử Hóa THPTQG trên Phòng thi ảo.',
    ],
    faqs: [
      {
        q: 'Học sinh mất gốc Hóa có tự học Hóa học online trên ELEC AI được không?',
        a: 'Rất phù hợp. Bạn có thể bắt đầu từ cấp độ Nền tảng lớp 10 (Cấu tạo nguyên tử, Bảng tuần hoàn, viết & cân bằng PTHH) với Trợ lý AI giải thích chậm từng bước và bộ game ôn nguyên tố trực quan.',
      },
      {
        q: 'Tài liệu Hóa học THPT trên ELEC AI có dùng tên tiếng Anh chuẩn IUPAC không?',
        a: 'Có. Toàn bộ tài liệu và bảng tuần hoàn đều dùng danh pháp chuẩn IUPAC theo sách giáo khoa GDPT 2018 (Sodium, Potassium, Iron, Copper, Ester, Alcohol...) kèm chú thích tiếng Việt giúp dễ tra cứu.',
      },
    ],
    relatedSlugs: ['bang-tuan-hoan', 'can-bang-phuong-trinh-hoa-hoc', 'tro-ly-ai-giai-hoa', 'cong-thuc-hoa-hoc', 'tro-choi-khoa-hoc'],
  },
  {
    slug: 'hoc-vat-ly-online',
    appPage: 'pillar-hoc-ly',
    targetAppHash: '#physics-lab',
    kind: 'pillar',
    group: 5,
    label: 'Học Vật Lý Online & Phòng Lab Vật Lí Ảo',
    title: 'Học Vật Lý Online THPT — Công Thức, Mô Phỏng & Đề Thi Vật Lí · ELEC AI',
    description:
      'Học Vật lý online lớp 10, 11, 12 chuẩn GDPT 2018 trên ELEC AI: Phòng thí nghiệm Vật lí ảo 7 mô phỏng thời gian thực, sổ tay công thức giải nhanh, trợ lý AI giải Lý từng bước và đề thi thử THPTQG.',
    keywords:
      'học Vật lý online, học Vật lí THPT, tài liệu Vật lí THPT, bài tập Vật lí có lời giải, phòng thí nghiệm vật lí ảo, công thức Vật lí 10 11 12',
    h1: 'Học Vật Lý Online THPT — Mô Phỏng Trực Quan, Công Thức & Luyện Đề',
    intro:
      'Chuyên mục Học Vật lý online trên ELEC Science AI giúp biến những khái niệm trừu tượng thành mô phỏng trực quan sinh động. Học sinh vừa thao tác trên 7 phòng thí nghiệm Vật lí ảo (Ném xiên, Mạch điện DC, Quang hình, Sóng 2D, Cơ học 2D, Con lắc kép RK4, Xử lý số liệu OLS), vừa tra cứu sổ tay công thức 2026 và luyện đề thi thử Vật lí chuẩn Bộ GD&ĐT.',
    ctaLabel: 'Mở Phòng thí nghiệm & Học Vật lí',
    specs: {
      subject: 'Vật lí THCS, THPT Lớp 10, 11, 12 (GDPT 2018) & Bồi dưỡng HSG / Olympiad',
      method: '7 Mô phỏng Vật lí thời gian thực + Sổ tay công thức KaTeX + Giải bài tập AI',
      audience: 'Học sinh THPT khối A00, A01, thí sinh thi ĐGNL và giáo viên Vật lí trình chiếu bài giảng',
    },
    highlights: [
      'Phủ trọn 4 chương Vật lí 12 mới: Vật lí nhiệt, Khí lí tưởng, Từ trường – Cảm ứng điện từ và Vật lí hạt nhân – Phóng xạ.',
      'Trực quan hóa hiện tượng vật lí ngay trên trình duyệt với Phòng Lab Vật lí ảo 7 mô phỏng chuyên sâu và đồ thị thời gian thực.',
      'Bộ máy tính công thức Vật lí nhập số ra ngay đáp án kèm đơn vị SI chuẩn xác.',
      'Ngân hàng đề thi thử Vật lí THPTQG & ĐGNL bấm giờ thực kèm lời giải phân tích chi tiết từng câu.',
    ],
    steps: [
      'Mở Phòng thí nghiệm Vật lí ảo (/phong-thi-nghiem-vat-li) để quan sát trực tiếp hiện tượng và quy luật vật lí.',
      'Tra cứu công thức trọng tâm và luyện tính nhanh trong Sổ tay công thức (/cong-thuc-hoa-hoc).',
      'Làm Quiz chuyên đề Vật lí 10–12 và đề thi thử Vật lí 50 phút trong Phòng thi ảo (/phong-thi-ao).',
    ],
    faqs: [
      {
        q: 'Học Vật lý online trên ELEC AI có phần Vật lí nhiệt và Khí lí tưởng lớp 12 mới không?',
        a: 'Có. Toàn bộ công thức nội năng ΔU = A + Q, nóng chảy/hóa hơi, phương trình trạng thái khí lí tưởng, lực từ F = BILsinα và độ hụt khối hạt nhân đều có máy tính giải nhanh và ngân hàng câu hỏi mới.',
      },
    ],
    relatedSlugs: ['phong-thi-nghiem-vat-li', 'cong-thuc-hoa-hoc', 'phong-thi-ao', 'giai-bai-tap-bang-ai', 'hoc-tap-lop-12'],
  },
  {
    slug: 'hoc-sinh-hoc-online',
    appPage: 'pillar-hoc-sinh',
    targetAppHash: '#biology-lab',
    kind: 'pillar',
    group: 5,
    label: 'Học Sinh Học Online & Lab Sinh Học 3D',
    title: 'Học Sinh Học Online THPT — Lab 3D, Công Thức Di Truyền & Luyện Đề · ELEC AI',
    description:
      'Học Sinh học online lớp 10, 11, 12 chuẩn GDPT 2018 trên ELEC AI: Phòng thí nghiệm Sinh học ảo 20 mô phỏng 2D/3D (Tế bào, DNA, Tim, Giải phẫu người), công thức di truyền Mendel và đề thi thử THPTQG.',
    keywords:
      'học Sinh học online, tài liệu Sinh học THPT, bài tập Sinh học có lời giải, phòng thí nghiệm sinh học ảo, công thức Sinh học 12 di truyền',
    h1: 'Học Sinh Học Online THPT — 20 Mô Phỏng 3D, Di Truyền & Luyện Thi Khối B00',
    intro:
      'ELEC Science AI mang đến trải nghiệm học Sinh học online sinh động bậc nhất với 20 phòng thí nghiệm Sinh học ảo 2D/3D (Tế bào 3D, DNA xoắn kép 3D, Giải phẫu người, Kính hiển vi ảo, Lai Mendel, Điện di gel), kết hợp trọn bộ công thức tính ADN – Phiên mã – Dịch mã – Di truyền quần thể và đề thi thử Sinh học khối B00.',
    ctaLabel: 'Mở Phòng thí nghiệm Sinh học 3D',
    specs: {
      subject: 'Sinh học THPT Lớp 10, 11, 12 (Tế bào, Cơ thể, Di truyền học, Tiến hóa & Sinh thái)',
      method: '20 Mô phỏng Sinh học 2D/3D + Máy tính di truyền + Đề thi thử khối B00 & Y Dược',
      audience: 'Học sinh THPT định hướng khối B00 (Y – Dược – Công nghệ Sinh học) và giáo viên Sinh học',
    },
    highlights: [
      '20 phòng thí nghiệm Sinh học ảo chia 4 nhóm: Tế bào & Chuyển hóa, Di truyền phân tử, Giải phẫu & Sinh lý người 3D, Sinh thái học & Kính hiển vi.',
      'Bộ công thức Sinh học 12 giải nhanh: chiều dài/liên kết hydrogen ADN, phiên mã – dịch mã, lai Mendel, hoán vị gene, tự thụ phấn và cân bằng Hardy-Weinberg.',
      'Ngân hàng đề thi thử tốt nghiệp THPT môn Sinh học bám sát đề minh họa mới nhất của Bộ GD&ĐT.',
      'Trợ lý AI giải bài tập phả hệ, di truyền quần thể và bài tập thực nghiệm Sinh học rõ ràng từng bước.',
    ],
    steps: [
      'Khám phá cấu trúc tế bào, phân tử DNA và cơ chế sinh học trên Phòng Lab Sinh học 3D (/phong-thi-nghiem-sinh-hoc).',
      'Ôn công thức tính nhanh Sinh học 10–12 trên Sổ tay công thức (/cong-thuc-hoa-hoc).',
      'Luyện đề thi thử Sinh học chuẩn 3 phần trong Phòng thi ảo (/phong-thi-ao) để chinh phục mục tiêu khối B00.',
    ],
    faqs: [
      {
        q: 'Phòng thí nghiệm Sinh học 3D trên ELEC AI có chạy được trên máy tính cấu hình thường không?',
        a: 'Có. Các mô phỏng 2D và 3D được tối ưu hóa WebGL mượt mà trực tiếp trên trình duyệt web của máy tính và điện thoại mà không cần cài phần mềm rời.',
      },
    ],
    relatedSlugs: ['phong-thi-nghiem-sinh-hoc', 'cong-thuc-hoa-hoc', 'phong-thi-ao', 'luyen-thi-thpt-quoc-gia', 'hoc-tap-lop-12'],
  },

  /* =====================================================================
     CÁC PHÂN HỆ CÔNG CỤ CHÍNH (17 ROUTES ĐÃ CÓ + BỔ SUNG SINH HỌC LAB)
     ===================================================================== */
  {
    slug: 'tro-ly-ai-giai-hoa',
    appPage: 'ai',
    targetAppHash: '#ai',
    kind: 'tool',
    group: 4,
    label: 'Trợ lý AI giải KHTN',
    title: 'Trợ Lý AI Giải Lý Hóa Sinh Từng Bước Từ Ảnh · ELEC AI',
    description:
      'Gia sư AI KHTN thông minh của ELEC Science AI: giải bài từ ảnh chụp đề Vật lí, Hóa học, Sinh học theo 6 chế độ học, giải thích bản chất và công thức từng bước.',
    keywords:
      'trợ lý AI giải bài tập, giải Hóa bằng AI, giải Lý bằng AI, giải Sinh bằng AI, chụp ảnh giải bài KHTN, AI giải bài tập, ELEC Science AI, GDPT 2018',
    h1: 'Trợ Lý AI Giải Bài Tập Vật Lí — Hóa Học — Sinh Học Từng Bước',
    intro:
      'Trợ lý AI KHTN của ELEC Science AI (sáng lập bởi Nguyễn Thế Duy) giúp học sinh giải bài tập Vật lí, Hóa học, Sinh học lớp 10, 11, 12 từ văn bản hoặc ảnh chụp đề thi (tối đa 10 ảnh/lần) theo 6 chế độ sư phạm, kết hợp công cụ tính toán khoa học xác định và trình bày công thức KaTeX chuẩn GDPT 2018.',
    specs: {
      subject: 'Vật lí, Hóa học, Sinh học (THCS, THPT Lớp 10–12 & Đại học)',
      method: 'Mô hình AI đa phương thức + Máy tính khoa học xác định + Hiển thị KaTeX',
      audience: 'Học sinh tự học, thí sinh ôn thi THPT Quốc gia / ĐGNL và Giáo viên',
    },
    highlights: [
      '6 chế độ sư phạm chuyên sâu: Tự động, Giải chi tiết từng bước, Gợi ý từng bước (Socratic — không lộ đáp án ngay), Kiểm tra đáp án, Ôn lý thuyết, Tạo bài tương tự.',
      'Hỗ trợ đầy đủ 3 môn Khoa học Tự nhiên lớp 10, 11, 12 và Đại học theo chương trình GDPT 2018 và danh pháp IUPAC.',
      'Kết hợp công cụ tính khối lượng mol, cân bằng PTHH đại số tuyến tính và máy tính khoa học để triệt tiêu sai số tính toán.',
    ],
    steps: [
      'Chọn khối lớp (Lớp 10, 11, 12 hoặc Đại học) và chế độ sư phạm mong muốn (ví dụ: Giải chi tiết hoặc Gợi ý từng bước).',
      'Nhập câu hỏi bằng văn bản hoặc tải lên từ 1 đến 10 ảnh chụp đề bài Vật lí, Hóa học, Sinh học.',
      'Đọc lời giải từng bước kèm giải thích bản chất, công thức KaTeX và bảng kiểm tra bảo toàn; hỏi tiếp ngay trong cùng hội thoại nếu cần làm rõ.',
    ],
    faqs: [
      {
        q: 'Trợ lý AI của ELEC Science AI giải được những môn nào?',
        a: 'Trợ lý AI hỗ trợ giải bài tập từng bước từ văn bản hoặc ảnh chụp cho cả 3 môn Vật lí, Hóa học và Sinh học theo chương trình GDPT 2018, đồng thời hỗ trợ mở rộng cho Toán và các môn học phổ thông khác.',
      },
      {
        q: 'Chế độ Gợi ý từng bước khác gì với Giải chi tiết?',
        a: 'Chế độ Giải chi tiết trình bày trọn vẹn các bước biến đổi và đáp số cuối cùng; trong khi chế độ Gợi ý từng bước (Socratic) chỉ đưa ra định hướng công thức và bước đầu tiên để học sinh tự tư duy tìm đáp án.',
      },
      {
        q: 'Làm sao để Trợ lý AI hạn chế tính toán sai số học?',
        a: 'ELEC Science AI tích hợp các công cụ tính toán khoa học xác định (cân bằng PTHH đại số tuyến tính, tính khối lượng mol, nồng độ, pH, mạch RLC) song song với mô hình ngôn ngữ để kiểm chứng kết quả.',
      },
    ],
    relatedSlugs: ['giai-bai-tap-bang-ai', 'gia-su-ai', 'can-bang-phuong-trinh-hoa-hoc', 'hoc-hoa-hoc-online'],
  },
  {
    slug: 'phong-thi-ao',
    appPage: 'virtual-exams',
    targetAppHash: '#virtual-exams',
    kind: 'tool',
    group: 3,
    label: 'Phòng thi ảo THPTQG & ĐGNL',
    title: 'Phòng Thi Ảo THPTQG & ĐGNL Lý Hóa Sinh 2026 · ELEC AI',
    description:
      'Luyện đề thi thử tốt nghiệp THPT và ĐGNL (HSA, TSA, V-ACT) các môn Vật lí, Hóa học, Sinh học bấm giờ thật, cấu trúc 3 phần mới kèm lời giải chi tiết.',
    keywords:
      'phòng thi ảo THPT Quốc gia 2026, thi thử THPT online, hệ thống thi online, đề thi trắc nghiệm online, thi thử Lý Hóa Sinh, đề thi ĐGNL HSA TSA V-ACT, ELEC AI',
    h1: 'Phòng Thi Ảo THPT Quốc Gia & Đánh Giá Năng Lực (HSA, TSA, V-ACT)',
    intro:
      'Phòng thi ảo ELEC Science AI mô phỏng chính xác áp lực phòng thi thật với cấu trúc đề chuẩn 3 phần mới của Bộ GD&ĐT (18 câu trắc nghiệm 4 lựa chọn, 4 câu Đúng/Sai lũy tiến, 6 câu trả lời ngắn trong 50 phút), phiếu OMR số hóa và tự động lưu câu làm sai vào sổ ôn tập SRS.',
    specs: {
      subject: 'Đề thi Tốt nghiệp THPT (Lý, Hóa, Sinh) & ĐGNL (HSA, TSA, V-ACT)',
      method: 'Chấm điểm lũy tiến chuẩn Bộ GD&ĐT 2026 + Giám sát MediaPipe + Tự động lưu câu sai SRS',
      audience: 'Thí sinh lớp 12 luyện thi Đại học và Giáo viên tổ chức kiểm tra trực tuyến',
    },
    highlights: [
      'Đồng hồ bấm giờ thực 50 phút, chấm điểm lũy tiến Phần II (0,1 – 0,25 – 0,5 – 1,0 điểm/câu) và thống kê độ chính xác theo từng chuyên đề.',
      'Phân khu đề thi miễn phí và chuyên sâu cho Vật lí, Hóa học, Sinh học và bài thi KHTN tổng hợp ĐGNL (HSA, TSA Bách Khoa, V-ACT).',
      'Hỗ trợ giám sát phòng thi trực tuyến bằng thị giác máy tính MediaPipe khi giáo viên giao đề kiểm tra cho lớp.',
    ],
    steps: [
      'Chọn kỳ thi mục tiêu (Tốt nghiệp THPT 2026 môn Vật lí, Hóa học, Sinh học hoặc ĐGNL HSA, TSA, V-ACT).',
      'Làm bài trong thời gian bấm giờ thực trên giao diện phiếu trả lời 3 phần (Nhiều lựa chọn, Đúng/Sai, Trả lời ngắn).',
      'Nộp bài để xem ngay điểm số, lời giải chi tiết từng câu, phân tích bẫy đề thi và lưu các câu sai vào Sổ tay SRS.',
    ],
    faqs: [
      {
        q: 'Phòng thi ảo ELEC AI có bám sát cấu trúc đề thi mới 2026 không?',
        a: 'Có. Đề thi trong Phòng thi ảo được thiết kế chuẩn theo cấu trúc 3 phần mới của Bộ GD&ĐT (Quyết định 4068/QĐ-BGDĐT) và format các kỳ thi ĐGNL HSA, TSA, V-ACT.',
      },
      {
        q: 'Điểm câu hỏi Đúng/Sai (Phần II) trong Phòng thi ảo được tính như thế nào?',
        a: 'Mỗi câu Đúng/Sai có 4 ý nhỏ (a, b, c, d). Hệ thống chấm lũy tiến đúng quy chế Bộ GD&ĐT: trả lời đúng 1 ý được 0,1 điểm; đúng 2 ý được 0,25 điểm; đúng 3 ý được 0,5 điểm; đúng cả 4 ý được trọn vẹn 1,0 điểm.',
      },
      {
        q: 'Các câu làm sai trong Phòng thi ảo có được lưu lại để ôn tập không?',
        a: 'Có. Mọi câu trả lời sai khi luyện đề đều tự động được đưa vào Sổ tay lỗi sai và lên lịch nhắc ôn lại theo thuật toán lặp lại ngắt quãng SRS (SuperMemo SM-2).',
      },
    ],
    relatedSlugs: ['luyen-thi-thpt-quoc-gia', 'phan-mem-tao-de-thi', 'lo-trinh-on-thi-thpt-quoc-gia', 'tinh-diem-xet-tuyen-dai-hoc'],
  },
  {
    slug: 'bang-tuan-hoan',
    appPage: 'table',
    targetAppHash: '#table',
    kind: 'tool',
    group: 5,
    label: 'Bảng tuần hoàn 118 nguyên tố',
    title: 'Bảng Tuần Hoàn Hóa Học 118 Nguyên Tố IUPAC · ELEC AI',
    description:
      'Bảng tuần hoàn hóa học trực tuyến 118 nguyên tố chuẩn IUPAC: tra cứu cấu hình electron, độ âm điện, khối lượng nguyên tử, bán kính và so sánh tính chất.',
    keywords:
      'bảng tuần hoàn hóa học 118 nguyên tố, bảng tuần hoàn IUPAC, cấu hình electron, độ âm điện, số oxi hóa, tài liệu Hóa học THPT, ELEC Science AI',
    h1: 'Bảng Tuần Hoàn 118 Nguyên Tố Hóa Học Tương Tác Chuẩn IUPAC',
    intro:
      'Bảng tuần hoàn tương tác trên ELEC Science AI cung cấp dữ liệu chuẩn quốc tế IUPAC cho toàn bộ 118 nguyên tố hóa học (từ Hydrogen Z=1 đến Oganesson Z=118): số hiệu nguyên tử, nguyên tử khối, cấu hình electron, độ âm điện Pauling, số oxi hóa, mô phỏng lớp vỏ electron và so sánh song song các nguyên tố.',
    specs: {
      subject: 'Hóa học THCS & THPT (Chương trình GDPT 2018 chuẩn danh pháp IUPAC)',
      method: 'Tra cứu tương tác thời gian thực + Lọc theo nhóm/chu kì + So sánh đối chiếu nguyên tố',
      audience: 'Học sinh THCS, THPT, Sinh viên và Giáo viên Hóa học',
    },
    highlights: [
      'Lọc nhanh theo nhóm kim loại kiềm, kiềm thổ, halogen, khí hiếm, kim loại chuyển tiếp, phi kim, lanthanide và actinide.',
      'Hiển thị song ngữ danh pháp quốc tế IUPAC (Sodium, Potassium, Iron, Copper...) và tên tiếng Việt truyền thống.',
      'So sánh trực quan tính chất giữa hai nguyên tố, xem mô phỏng lớp vỏ electron và sử dụng miễn phí 100% trên mọi thiết bị.',
    ],
    steps: [
      'Tìm nguyên tố theo kí hiệu hóa học (ví dụ: Fe, Cu, Na), số hiệu nguyên tử Z hoặc tên gọi IUPAC / tiếng Việt trên thanh tìm kiếm.',
      'Nhấp vào ô nguyên tố để mở thẻ chi tiết gồm cấu hình electron, độ âm điện, bán kính nguyên tử, số oxi hóa, ứng dụng và mẹo ghi nhớ.',
      'Chọn tính năng So sánh để đặt hai nguyên tố cạnh nhau và đối chiếu sự biến đổi tính chất tuần hoàn.',
    ],
    faqs: [
      {
        q: 'Bảng tuần hoàn trên ELEC AI có đủ 118 nguyên tố chuẩn IUPAC mới nhất không?',
        a: 'Có. Bảng tuần hoàn cập nhật đầy đủ 118 nguyên tố (từ Z=1 đến Z=118) theo danh pháp và dữ liệu chuẩn IUPAC mới nhất áp dụng trong chương trình GDPT 2018.',
      },
      {
        q: 'Có thể tra cứu cấu hình electron và độ âm điện trên bảng tuần hoàn này không?',
        a: 'Có. Mỗi nguyên tố đều hiển thị rõ cấu hình electron đầy đủ và thu gọn, độ âm điện theo thang Pauling, năng lượng ion hóa, các số oxi hóa phổ biến và trạng thái vật lí.',
      },
      {
        q: 'Bảng tuần hoàn ELEC Science AI có miễn phí trên điện thoại không?',
        a: 'Hoàn toàn miễn phí 100%, không cần cài đặt phức tạp và tương thích mượt mà trên cả màn hình điện thoại lẫn máy tính.',
      },
    ],
    relatedSlugs: ['hoc-hoa-hoc-online', 'can-bang-phuong-trinh-hoa-hoc', 'cong-thuc-hoa-hoc', 'tro-choi-khoa-hoc'],
  },
  {
    slug: 'can-bang-phuong-trinh-hoa-hoc',
    appPage: 'balance',
    targetAppHash: '#balance',
    kind: 'tool',
    group: 5,
    label: 'Cân bằng phương trình Hóa học',
    title: 'Cân Bằng Phương Trình Hóa Học Tự Động Online · ELEC AI',
    description:
      'Máy cân bằng phương trình hóa học (PTHH) bằng đại số tuyến tính chính xác cao, chỉ rõ chất oxi hóa, chất khử và quá trình oxi hóa khử.',
    keywords:
      'cân bằng phương trình hóa học online, cân bằng PTHH tự động, cân bằng phản ứng oxi hóa khử, chất khử chất oxi hóa, bài tập Hóa học có lời giải, ELEC AI',
    h1: 'Máy Cân Bằng Phương Trình Hóa Học (PTHH) Bằng Đại Số Tuyến Tính',
    intro:
      'Máy cân bằng phương trình hóa học của ELEC Science AI sử dụng thuật toán khử Gauss trên ma trận đại số tuyến tính để tìm bộ hệ số nguyên dương tối giản chính xác tuyệt đối cho cả phản ứng vô cơ, hữu cơ và phản ứng oxi hóa – khử phức tạp chỉ trong tích tắc.',
    specs: {
      subject: 'Hóa học THCS, THPT & Đại học (Phản ứng trao đổi, hữu cơ, oxi hóa – khử)',
      method: 'Thuật toán khử Gauss ma trận đại số tuyến tính trên trường số hữu tỉ',
      audience: 'Học sinh lớp 8–12 và Giáo viên Hóa học',
    },
    highlights: [
      'Xác định rõ hệ số nguyên tối giản, chất khử, chất oxi hóa và quá trình nhường – nhận electron.',
      'Hiển thị bảng kiểm tra bảo toàn số nguyên tử của từng nguyên tố ở vế trái và vế phải.',
      'Hỗ trợ các phương trình oxi hóa – khử nhiều chất thay đổi số oxi hóa trong chương trình THPT nâng cao, miễn phí không giới hạn.',
    ],
    steps: [
      'Nhập phương trình hóa học chưa cân bằng vào ô nhập liệu (ví dụ: Fe + HNO3 -> Fe(NO3)3 + NO + H2O).',
      'Bấm nút Cân bằng để thuật toán đại số tuyến tính giải hệ phương trình bảo toàn nguyên tố.',
      'Xem phương trình đã cân bằng với hệ số nguyên tối giản kèm bảng kiểm tra số nguyên tử hai vế và vai trò chất khử / chất oxi hóa.',
    ],
    faqs: [
      {
        q: 'Máy cân bằng PTHH của ELEC AI xử lý được phản ứng oxi hóa – khử khó không?',
        a: 'Có. Công cụ dùng thuật toán ma trận đại số tuyến tính (Gaussian Elimination) nên cân bằng chính xác cả các phản ứng oxi hóa – khử nhiều ẩn và môi trường acid/base.',
      },
      {
        q: 'Cách nhập công thức hóa học vào máy cân bằng như thế nào?',
        a: 'Bạn chỉ cần gõ kí hiệu nguyên tố đúng chữ hoa/thường và số chỉ số liền sau (ví dụ H2SO4, KMnO4, Fe3O4), dùng dấu "+" giữa các chất và dấu "->" hoặc "=" giữa chất tham gia và sản phẩm.',
      },
      {
        q: 'Công cụ có kiểm tra lỗi nhập sai nguyên tố không?',
        a: 'Có. Nếu một nguyên tố xuất hiện ở vế trái mà không có ở vế phải (hoặc ngược lại), hệ thống sẽ cảnh báo ngay lập tức để bạn kiểm tra lại công thức.',
      },
    ],
    relatedSlugs: ['hoc-hoa-hoc-online', 'bang-tuan-hoan', 'giai-bai-tap-bang-ai', 'cong-thuc-hoa-hoc'],
  },
  {
    slug: 'lo-trinh-on-thi-thpt-quoc-gia',
    appPage: 'roadmap',
    targetAppHash: '#roadmap',
    kind: 'tool',
    group: 3,
    label: 'Lộ trình ôn thi KHTN',
    title: 'Lộ Trình Ôn Thi KHTN Lý Hóa Sinh GDPT 2018 · ELEC AI',
    description:
      'Lộ trình kiến thức cá nhân hóa theo điểm Elo và nguyện vọng đại học khối A00, B00, A01, D07 (Bách Khoa, Kinh Tế Quốc Dân, Y Hà Nội, Ngoại Thương).',
    keywords:
      'lộ trình ôn thi THPT Quốc gia 2026, ôn thi tốt nghiệp THPT, lộ trình học KHTN Elo, ôn thi khối A00 A01 B00 D07, GDPT 2018, ELEC Science AI',
    h1: 'Lộ Trình Ôn Thi KHTN & THPT Quốc Gia Cá Nhân Hóa Theo Điểm Elo',
    intro:
      'Hệ thống Lộ trình ôn thi của ELEC Science AI xây dựng kế hoạch học tập Vật lí, Hóa học, Sinh học theo 3 giai đoạn (Nền tảng — Chuyên sâu — Thực chiến đề thi) dựa trên điểm năng lực Elo từng chuyên đề và trường đại học nguyện vọng khối A00, A01, B00, D07.',
    specs: {
      subject: 'Lộ trình toàn diện Vật lí, Hóa học, Sinh học Lớp 10, 11, 12 (GDPT 2018)',
      method: 'Xếp hạng năng lực Elo động + Phân tích khoảng cách điểm chuẩn + Ôn tập SRS SM-2',
      audience: 'Học sinh THPT lớp 10, 11, 12 và thí sinh ôn thi Đại học / ĐGNL',
    },
    highlights: [
      'Theo dõi mức độ thành thạo từng chương bài lớp 10, 11, 12 theo chuẩn GDPT 2018 qua chỉ số Elo trực quan.',
      'Tự động phát hiện chuyên đề yếu và gợi ý bài học, bài tập rèn luyện tiếp theo sát với mục tiêu điểm chuẩn đại học.',
      'Kết nối trực tiếp với Sổ tay lỗi sai SRS để giữ vững kiến thức lâu dài đến ngày thi.',
    ],
    steps: [
      'Chọn trường đại học, ngành học nguyện vọng và tổ hợp xét tuyển mục tiêu (A00, A01, B00, D07) hoặc mức điểm mong muốn.',
      'Thực hiện bài đánh giá năng lực đầu vào hoặc làm bài tập chuyên đề để hệ thống xác lập điểm Elo ban đầu cho từng môn.',
      'Học theo danh sách chuyên đề ưu tiên mỗi tuần và hoàn thành các phiên ôn tập ngắt quãng SRS để nâng Elo đạt ngưỡng đỗ nguyện vọng.',
    ],
    faqs: [
      {
        q: 'Lộ trình ôn thi trên ELEC AI được cá nhân hóa theo tiêu chí nào?',
        a: 'Lộ trình được cá nhân hóa dựa trên năng lực thực tế qua điểm Elo từng chuyên đề, kết hợp với tổ hợp xét tuyển, điểm chuẩn trường đại học mục tiêu và quỹ thời gian còn lại đến kỳ thi.',
      },
      {
        q: 'Điểm Elo trên ELEC Science AI có ý nghĩa gì?',
        a: 'Điểm Elo phản ánh mức độ làm chủ kiến thức của học sinh ở từng chuyên đề (tương tự hệ số Elo trong cờ vua): tăng lên khi giải đúng câu hỏi khó và giảm xuống khi sai câu cơ bản, giúp nhận diện chính xác chuyên đề cần ưu tiên.',
      },
      {
        q: 'Lộ trình có bao gồm cả học sinh lớp 10 và lớp 11 không?',
        a: 'Có. Hệ thống thiết kế cây kiến thức đầy đủ cho cả 3 khối lớp 10, 11 và 12 theo chương trình GDPT 2018.',
      },
    ],
    relatedSlugs: ['luyen-thi-thpt-quoc-gia', 'hoc-tap-lop-10', 'hoc-tap-lop-11', 'hoc-tap-lop-12'],
  },
  {
    slug: 'cong-thuc-hoa-hoc',
    appPage: 'formulas',
    targetAppHash: '#formulas',
    kind: 'tool',
    group: 5,
    label: 'Sổ tay công thức KHTN',
    title: 'Sổ Tay Công Thức Lý Hóa Sinh Đầy Đủ Nhất · ELEC AI',
    description:
      'Tổng hợp công thức KHTN trọng tâm: dao động, sóng, điện xoay chiều (Vật lí); tính mol, pH, dung dịch (Hóa học); ADN, gen, di truyền (Sinh học).',
    keywords:
      'sổ tay công thức Vật lí Hóa học Sinh học, công thức tính mol pH, công thức dao động điều hòa mạch RLC, công thức ADN Menđen, kiến thức THPT, ELEC AI',
    h1: 'Sổ Tay Công Thức Khoa Học Tự Nhiên (Vật Lí — Hóa Học — Sinh Học)',
    intro:
      'Sổ tay công thức KHTN của ELEC Science AI tổng hợp hệ thống công thức trọng tâm lớp 10, 11, 12 cho cả 3 môn Vật lí, Hóa học và Sinh học trình bày chuẩn LaTeX/KaTeX, kèm giải thích đại lượng, đơn vị SI và máy tính khoa học nhập số tính kết quả ngay lập tức.',
    specs: {
      subject: 'Công thức Vật lí, Hóa học, Sinh học Lớp 10, 11, 12 (GDPT 2018)',
      method: 'Thư viện công thức chuẩn KaTeX + Máy tính chuyên đề giải nhanh trực tiếp',
      audience: 'Học sinh THCS, THPT và thí sinh ôn thi Tốt nghiệp THPT / ĐGNL',
    },
    highlights: [
      'Vật lí: Động học, Động lực học, Dao động điều hòa, Sóng cơ, Điện trường, Mạch RLC, Vật lí nhiệt, Khí lí tưởng, Hạt nhân.',
      'Hóa học: Số mol, tỉ khối, nồng độ C% và CM, độ pH, enthalpy, định luật Faraday điện phân, hiệu suất phản ứng.',
      'Sinh học: Chiều dài và số liên kết hydrogen của ADN, phiên mã, dịch mã, nguyên phân – giảm phân, quy luật Menđen và cân bằng Hardy-Weinberg.',
    ],
    steps: [
      'Chọn phân môn (Vật lí, Hóa học hoặc Sinh học) và chuyên đề cần tra cứu.',
      'Xem công thức chuẩn KaTeX cùng chú thích tên gọi, ý nghĩa và đơn vị chuẩn của từng đại lượng.',
      'Nhập các đại lượng đã biết vào khung Máy tính nhanh bên cạnh để hệ thống tự động giải đại lượng còn thiếu.',
    ],
    faqs: [
      {
        q: 'Sổ tay công thức trên ELEC AI có kèm máy tính giải nhanh không?',
        a: 'Có. Bên cạnh bảng công thức chuẩn LaTeX/KaTeX, người học có thể nhập trực tiếp các số liệu đã biết vào máy tính chuyên đề để tính nhanh đại lượng cần tìm.',
      },
      {
        q: 'Sổ tay công thức hỗ trợ những môn nào?',
        a: 'Hỗ trợ trọn vẹn cả 3 môn Khoa học Tự nhiên cấp THPT là Vật lí, Hóa học và Sinh học theo chương trình GDPT 2018.',
      },
    ],
    relatedSlugs: ['hoc-hoa-hoc-online', 'hoc-vat-ly-online', 'hoc-sinh-hoc-online', 'tai-lieu-hoa-hoc'],
  },
  {
    slug: 'tai-lieu-hoa-hoc',
    appPage: 'tools',
    targetAppHash: '#tools',
    kind: 'tool',
    group: 5,
    label: 'Kho tài liệu & Công cụ KHTN',
    title: 'Kho Tài Liệu & 50+ Công Cụ KHTN Lý Hóa Sinh · ELEC AI',
    description:
      'Khám phá hơn 50 công cụ học tập, máy tính khoa học, sách giáo khoa, chuyên đề và công cụ AI tuyển chọn cho học sinh THCS và THPT.',
    keywords:
      'tài liệu Khoa học Tự nhiên lớp 10 11 12, tài liệu học tập THPT, tài liệu Hóa học THPT, công cụ học tập cho học sinh, website học tập cho học sinh, ELEC Science AI',
    h1: 'Kho Tài Liệu & Bộ Công Cụ Học Tập Khoa Học Tự Nhiên Toàn Diện',
    intro:
      'Kho tài liệu và Công cụ KHTN trên ELEC Science AI quy tụ hơn 50 máy tính khoa học Lý – Hóa – Sinh, công cụ phân tích hợp chất, thư viện chuyên đề sách giáo khoa GDPT 2018 và danh mục hơn 350 công cụ AI / mẫu câu lệnh (prompt) hỗ trợ học tập miễn phí.',
    specs: {
      subject: 'Tài liệu & Máy tính chuyên đề Vật lí, Hóa học, Sinh học',
      method: 'Phân loại theo môn học & khối lớp + Công cụ tính toán tương tác trực tuyến',
      audience: 'Học sinh THCS, THPT và Giáo viên bộ môn KHTN',
    },
    highlights: [
      'Phân nhóm rõ ràng theo Vật lí, Hóa học, Sinh học, tiện ích quản lý học tập và công cụ AI đa năng.',
      'Truy cập nhanh Phân tích hợp chất, Tính khối lượng mol, Định luật khí lí tưởng, Phả hệ di truyền, Clock Hub Pomodoro.',
      'Đồng bộ với tài khoản học tập để lưu ghi chú và tài liệu yêu thích trên mọi thiết bị.',
    ],
    steps: [
      'Duyệt danh mục theo bộ môn (Vật lí, Hóa học, Sinh học) hoặc gõ tên công cụ/tài liệu vào ô tìm kiếm.',
      'Mở trực tiếp máy tính chuyên đề hoặc tài liệu lý thuyết ngay trên trình duyệt mà không cần tải phần mềm.',
      'Kết hợp cùng Trợ lý AI hoặc Sổ tay ghi chú để lưu lại các kiến thức quan trọng.',
    ],
    faqs: [
      {
        q: 'Kho tài liệu ELEC AI gồm những nội dung gì?',
        a: 'Bao gồm hơn 50 công cụ tính toán KHTN chuyên sâu, tài liệu tổng hợp chuyên đề lớp 10–12 theo GDPT 2018, đề ôn tập, thư viện 346 mẫu prompt học tập và danh mục 351 công cụ AI miễn phí.',
      },
      {
        q: 'Học sinh có cần cài đặt phần mềm để dùng bộ công cụ này không?',
        a: 'Không. Toàn bộ công cụ và tài liệu hoạt động trực tiếp trên trình duyệt web của máy tính, máy tính bảng và điện thoại.',
      },
    ],
    relatedSlugs: ['hoc-online-mien-phi', 'cong-thuc-hoa-hoc', 'hoc-hoa-hoc-online', 'ai-doc-studio'],
  },
  {
    slug: 'tinh-diem-xet-tuyen-dai-hoc',
    appPage: 'grade',
    targetAppHash: '#grade',
    kind: 'tool',
    group: 3,
    label: 'Tính điểm xét tuyển Đại học',
    title: 'Tính Điểm Xét Tuyển Đại Học A00 A01 B00 D07 · ELEC AI',
    description:
      'Công cụ tính điểm thi tốt nghiệp THPT và quy đổi điểm xét tuyển đại học chuẩn xác theo quy chế tuyển sinh mới nhất của Bộ GD&ĐT.',
    keywords:
      'tính điểm xét tuyển đại học 2026, tính điểm tốt nghiệp THPT, giảm trừ điểm ưu tiên 22.5, tổ hợp A00 A01 B00 D07, ELEC AI',
    h1: 'Công Cụ Tính Điểm Tốt Nghiệp & Xét Tuyển Đại Học (A00, A01, B00, D07)',
    intro:
      'Công cụ tính điểm xét tuyển Đại học của ELEC Science AI giúp học sinh lớp 12 tính chính xác điểm xét tốt nghiệp THPT, mức điểm ưu tiên khu vực/đối tượng (áp dụng công thức giảm trừ tuyến tính từ mốc 22,5 điểm) và tổng điểm các tổ hợp A00, A01, B00, D07 theo quy chế mới nhất của Bộ GD&ĐT.',
    specs: {
      subject: 'Tuyển sinh Đại học & Xét công nhận Tốt nghiệp THPT',
      method: 'Công thức quy chế Bộ GD&ĐT + Giảm trừ điểm ưu tiên tuyến tính từ 22,5 điểm',
      audience: 'Học sinh THPT Lớp 12 và Phụ huynh, Giáo viên tư vấn tuyển sinh',
    },
    highlights: [
      'Hỗ trợ đầy đủ các tổ hợp KHTN phổ biến: A00 (Toán-Lý-Hóa), A01 (Toán-Lý-Anh), B00 (Toán-Hóa-Sinh), D07 (Toán-Hóa-Anh) và tổ hợp mới.',
      'Tự động tính mức điểm ưu tiên thực nhận theo công thức: [(30 - Tổng điểm 3 môn) / 7,5] × Mức điểm ưu tiên quy định khi tổng điểm từ 22,5 trở lên.',
      'Kết nối trực tiếp sang công cụ Tra cứu điểm chuẩn để đối chiếu khả năng trúng tuyển vào các trường đại học.',
    ],
    steps: [
      'Nhập điểm thi dự kiến hoặc điểm thực tế của các môn học và điểm trung bình học bạ các năm THPT.',
      'Chọn khu vực ưu tiên (KV1, KV2-NT, KV2, KV3) và đối tượng ưu tiên (nếu có).',
      'Xem ngay kết quả điểm xét tốt nghiệp THPT, tổng điểm từng tổ hợp xét tuyển đại học sau khi cộng điểm ưu tiên và đối chiếu điểm chuẩn.',
    ],
    faqs: [
      {
        q: 'Công cụ tính điểm trên ELEC AI có áp dụng quy chế giảm trừ điểm ưu tiên từ 22,5 điểm không?',
        a: 'Có. Khi tổng điểm 3 môn trong tổ hợp đạt từ 22,5 điểm trở lên (theo thang điểm 10), hệ thống tự động tính điểm ưu tiên theo công thức: Điểm ưu tiên = [(30 - Tổng điểm đạt được) / 7,5] × Mức điểm ưu tiên quy định.',
      },
      {
        q: 'Có thể tính cùng lúc nhiều tổ hợp xét tuyển A00, A01, B00, D07 không?',
        a: 'Có. Chỉ cần nhập điểm các môn Toán, Vật lí, Hóa học, Sinh học, Tiếng Anh, hệ thống sẽ tự động tổng hợp điểm cho tất cả các tổ hợp để bạn chọn phương án tối ưu nhất.',
      },
    ],
    relatedSlugs: ['tra-cuu-diem-chuan', 'dinh-huong-nghe-nghiep', 'luyen-thi-thpt-quoc-gia', 'hoc-tap-lop-12'],
  },
  {
    slug: 'tra-cuu-diem-chuan',
    appPage: 'admission',
    targetAppHash: '#admission',
    kind: 'tool',
    group: 3,
    label: 'Tra cứu điểm chuẩn Đại học',
    title: 'Tra Cứu Điểm Chuẩn Đại Học & ĐGNL Mới Nhất · ELEC AI',
    description:
      'Tra cứu điểm chuẩn các trường đại học hàng đầu, đối chiếu ngưỡng điểm xét tuyển THPTQG và Đánh giá năng lực phù hợp mục tiêu cá nhân.',
    keywords:
      'tra cứu điểm chuẩn đại học 2026, điểm chuẩn ĐGNL HSA TSA V-ACT, tư vấn nguyện vọng đại học, ELEC Science AI',
    h1: 'Tra Cứu Điểm Chuẩn Đại Học & Đánh Giá Năng Lực Trên Toàn Quốc',
    intro:
      'Hệ thống Tra cứu điểm chuẩn Đại học trên ELEC Science AI cho phép tìm kiếm, so sánh điểm chuẩn qua các năm của các trường đại học hàng đầu Việt Nam theo cả phương thức điểm thi Tốt nghiệp THPT (A00, A01, B00, D07) và phương thức Đánh giá năng lực / Đánh giá tư duy (HSA, TSA, V-ACT).',
    specs: {
      subject: 'Dữ liệu Điểm chuẩn & Đề án tuyển sinh các trường Đại học Việt Nam',
      method: 'Tìm kiếm theo trường/ngành/tổ hợp + Phân tích độ an toàn nguyện vọng bằng AI',
      audience: 'Học sinh THPT và Thí sinh xét tuyển Đại học',
    },
    highlights: [
      'So sánh xu hướng điểm chuẩn giữa các năm và các phương thức xét tuyển của từng ngành, từng trường.',
      'Phân loại nguyện vọng theo 3 mức: An toàn, Vừa sức và Thử thách dựa trên năng lực KHTN hiện tại của học sinh.',
      'Liên kết trực tiếp với Lộ trình ôn thi Elo để lập kế hoạch bù đắp số điểm còn thiếu.',
    ],
    steps: [
      'Nhập tên trường đại học, mã trường, tên ngành học hoặc chọn tổ hợp xét tuyển (A00, A01, B00, D07...).',
      'Nhập mức điểm hiện tại hoặc điểm mục tiêu của bạn để hệ thống lọc danh sách ngành phù hợp.',
      'Lưu ngành/trường vào danh sách Nguyện vọng mục tiêu để hệ thống tự động đồng bộ với Lộ trình ôn thi KHTN.',
    ],
    faqs: [
      {
        q: 'Có thể tra cứu điểm chuẩn theo cả phương thức THPT và ĐGNL trên ELEC AI không?',
        a: 'Có. Công cụ hỗ trợ đối chiếu cả điểm thi tốt nghiệp THPT theo tổ hợp lẫn ngưỡng điểm Đánh giá năng lực (HSA, V-ACT) và Đánh giá tư duy (TSA) của nhiều trường đại học lớn.',
      },
      {
        q: 'Làm sao biết mức điểm hiện tại của mình có an toàn với ngành học mong muốn không?',
        a: 'Hệ thống đối chiếu điểm năng lực dự kiến của bạn với lịch sử điểm chuẩn ngành đó để đánh giá xác suất và phân nhóm Nguyện vọng An toàn, Vừa sức hoặc Thử thách.',
      },
    ],
    relatedSlugs: ['tinh-diem-xet-tuyen-dai-hoc', 'dinh-huong-nghe-nghiep', 'luyen-thi-thpt-quoc-gia', 'lo-trinh-on-thi-thpt-quoc-gia'],
  },
  {
    slug: 'dinh-huong-nghe-nghiep',
    appPage: 'career',
    targetAppHash: '#career',
    kind: 'tool',
    group: 2,
    label: 'Định hướng nghề nghiệp RIASEC',
    title: 'Định Hướng Nghề Nghiệp AI & Test RIASEC · ELEC AI',
    description:
      'Khám phá ngành học và nghề nghiệp phù hợp với năng lực KHTN qua bài trắc nghiệm hướng nghiệp RIASEC kết hợp phân tích AI.',
    keywords:
      'trắc nghiệm hướng nghiệp RIASEC, test mật mã Holland, chọn ngành đại học khối KHTN, định hướng nghề nghiệp AI, ELEC AI',
    h1: 'Định Hướng Nghề Nghiệp & Chọn Ngành Đại Học Với Mô Hình RIASEC + AI',
    intro:
      'Phân hệ Định hướng nghề nghiệp của ELEC Science AI kết hợp bài trắc nghiệm mật mã Holland (RIASEC — 6 nhóm tính cách nghề nghiệp) với phân tích năng lực học tập thực tế các môn Lý – Hóa – Sinh để gợi ý chính xác nhóm ngành STEM, Y Dược, Kỹ thuật, Công nghệ thông tin và Kinh tế phù hợp nhất.',
    specs: {
      subject: 'Hướng nghiệp THPT & Tư vấn chọn ngành Đại học',
      method: 'Mô hình trắc nghiệm tâm lý Holland (RIASEC) + Phân tích năng lực KHTN bằng AI',
      audience: 'Học sinh THCS (chọn tổ hợp lớp 10) và Học sinh THPT (chọn ngành Đại học)',
    },
    highlights: [
      'Đánh giá toàn diện 6 nhóm tính cách nghề nghiệp: Kỹ thuật (R), Nghiên cứu (I), Nghệ thuật (A), Xã hội (S), Quản lý (E), Nghiệp vụ (C).',
      'Gợi ý danh sách ngành học, tổ hợp môn xét tuyển và các trường đại học đào tạo uy tín tại Việt Nam.',
      'Liên kết trực tiếp kết quả hướng nghiệp RIASEC với lộ trình ôn thi KHTN cá nhân hóa.',
    ],
    steps: [
      'Hoàn thành bộ câu hỏi trắc nghiệm sở thích và xu hướng hành động theo chuẩn mô hình Holland (RIASEC).',
      'Xem biểu đồ radar phân tích 6 nhóm tính cách nghề nghiệp và mã Holland nổi trội của bản thân.',
      'Nhận danh sách ngành đại học, nghề nghiệp tương lai và tổ hợp môn KHTN phù hợp để bắt đầu lộ trình ôn luyện.',
    ],
    faqs: [
      {
        q: 'Bài test RIASEC trên ELEC AI giúp ích gì cho học sinh THPT?',
        a: 'Giúp học sinh hiểu rõ thế mạnh và xu hướng nghề nghiệp của bản thân theo 6 nhóm Holland, từ đó thu hẹp danh sách ngành học phù hợp và chọn đúng tổ hợp môn KHTN để ôn thi đại học.',
      },
      {
        q: 'Mô hình RIASEC gồm những nhóm tính cách nào?',
        a: 'Gồm 6 nhóm: Realistic (Kỹ thuật/Thực tế), Investigative (Nghiên cứu/Phân tích), Artistic (Nghệ thuật/Sáng tạo), Social (Xã hội/Giáo dục/Y tế), Enterprising (Quản lý/Kinh doanh) và Conventional (Nghiệp vụ/Quy trình).',
      },
    ],
    relatedSlugs: ['tra-cuu-diem-chuan', 'tinh-diem-xet-tuyen-dai-hoc', 'ai-giao-duc', 'hoc-tap-lop-10'],
  },
  {
    slug: 'tro-choi-khoa-hoc',
    appPage: 'games',
    targetAppHash: '#games',
    kind: 'tool',
    group: 5,
    label: 'Trò chơi Khoa học & Lab 3D',
    title: 'Trò Chơi Khoa Học & Phòng Thí Nghiệm Hóa 3D · ELEC AI',
    description:
      'Học Vật lí, Hóa học, Sinh học qua phòng thí nghiệm ảo 3D tương tác, Đấu nguyên tố, Sudoku Hóa học, Jeopardy và Quiz tốc độ.',
    keywords:
      'phòng thí nghiệm hóa học 3D, trò chơi khoa học KHTN, đấu nguyên tố, sudoku hóa học, học Lý Hóa Sinh qua game, ELEC AI',
    h1: 'Phòng Thí Nghiệm Hóa Học 3D & Trò Chơi Ôn Tập Khoa Học Tự Nhiên',
    intro:
      'Phân hệ Trò chơi Khoa học & Lab 3D của ELEC Science AI biến việc học Vật lí, Hóa học, Sinh học thành trải nghiệm tương tác trực quan qua Phòng thí nghiệm Hóa học 3D (Three.js) và hơn 10 trò chơi giáo dục gắn liền với ngân hàng câu hỏi chương trình GDPT 2018.',
    specs: {
      subject: 'Mô phỏng thí nghiệm Hóa học 3D & Trò chơi ôn tập Vật lí – Hóa học – Sinh học',
      method: 'Đồ họa WebGL / Three.js + Gamification kết nối Sổ tay lỗi sai SRS',
      audience: 'Học sinh THCS, THPT và Giáo viên tổ chức hoạt động khởi động trên lớp',
    },
    highlights: [
      'Phòng thí nghiệm Hóa học 3D trực quan hóa dụng cụ, hóa chất, hiện tượng phản ứng và mô hình phân tử ngay trên trình duyệt.',
      'Hệ thống trò chơi ôn tập phong phú: Đấu nguyên tố, Sudoku Hóa học, Jeopardy, Bắt gà 2D, Ná cao su, Kéo co, Đua xe trắc nghiệm, Dò mìn KHTN.',
      'Mọi câu trả lời sai trong trò chơi đều tự động được đồng bộ sang Sổ tay lỗi sai SRS để học sinh ôn lại.',
    ],
    steps: [
      'Chọn Phòng thí nghiệm Hóa học 3D hoặc một trò chơi ôn tập yêu thích trong Game Hub.',
      'Chọn môn học (Vật lí, Hóa học, Sinh học), khối lớp và chuyên đề câu hỏi muốn luyện tập.',
      'Tham gia thử thách, tích lũy điểm kinh nghiệm (XP) lên Bảng xếp hạng và xem lại lời giải các câu trả lời sai.',
    ],
    faqs: [
      {
        q: 'Chơi trò chơi khoa học trên ELEC AI có giúp ôn thi thật không?',
        a: 'Có. Toàn bộ câu hỏi trong trò chơi được lấy trực tiếp từ ngân hàng câu hỏi chuyên đề Vật lí, Hóa học, Sinh học THPT; điểm số được lưu lại và câu trả lời sai tự động đi vào Sổ tay lỗi sai SRS.',
      },
      {
        q: 'Phòng thí nghiệm Hóa học 3D có an toàn và miễn phí không?',
        a: 'Hoàn toàn miễn phí và an toàn tuyệt đối trên trình duyệt web, giúp học sinh quan sát màu sắc kết tủa, khí thoát ra và hiện tượng hóa học mà không lo rủi ro hóa chất.',
      },
    ],
    relatedSlugs: ['hoc-hoa-hoc-online', 'phong-thi-nghiem-vat-li', 'phong-thi-nghiem-sinh-hoc', 'bang-xep-hang'],
  },
  {
    slug: 'ai-doc-studio',
    appPage: 'doc-studio',
    targetAppHash: '#doc-studio',
    kind: 'tool',
    group: 2,
    label: 'AI Doc Studio',
    title: 'AI Doc Studio — Tóm Tắt PDF, Tạo Flashcard & Quiz · ELEC AI',
    description:
      'Tải lên PDF hoặc tài liệu học tập để AI tự động tóm tắt ý chính, trích xuất công thức và tạo bộ flashcard, câu hỏi trắc nghiệm ôn tập.',
    keywords:
      'AI tóm tắt PDF, tạo flashcard từ PDF, tạo câu hỏi trắc nghiệm từ tài liệu, AI hỗ trợ học tập, AI Doc Studio, ELEC Science AI',
    h1: 'AI Doc Studio — Tóm Tắt Tài Liệu PDF, Tạo Flashcard & Quiz Tự Động',
    intro:
      'AI Doc Studio trên ELEC Science AI giúp học sinh và giáo viên chuyển đổi bất kỳ file PDF giáo trình, đề cương ôn tập hoặc văn bản bài giảng dài hàng chục trang thành bản tóm tắt có cấu trúc, bảng tổng hợp công thức, bộ thẻ ghi nhớ Flashcard và đề trắc nghiệm kiểm tra chỉ trong vài giây.',
    specs: {
      subject: 'Tài liệu học tập đa môn (Vật lí, Hóa học, Sinh học, Toán, Văn, Anh...)',
      method: 'Trích xuất văn bản PDF/OCR + Tóm tắt cấu trúc AI + Sinh Flashcard & Quiz tự động',
      audience: 'Học sinh THPT, Sinh viên và Giáo viên biên soạn học liệu',
    },
    highlights: [
      'Trích xuất chính xác trọng tâm kiến thức, định nghĩa, công thức KaTeX và khái niệm cốt lõi từ tài liệu PDF hoặc văn bản.',
      'Tự động sinh bộ thẻ ghi nhớ Flashcard (mặt trước / mặt sau) và bộ câu hỏi trắc nghiệm kèm giải thích để tự kiểm tra ngay.',
      'Cho phép hỏi đáp trực tiếp với nội dung tài liệu vừa tải lên để làm rõ các đoạn khó hiểu.',
    ],
    steps: [
      'Tải lên file tài liệu PDF hoặc dán trực tiếp nội dung văn bản bài học vào AI Doc Studio.',
      'Chọn tác vụ mong muốn: Tóm tắt trọng tâm, Trích xuất bảng công thức, Tạo bộ Flashcard hoặc Tạo đề Quiz trắc nghiệm.',
      'Ôn tập ngay trên thẻ Flashcard hoặc làm bài Quiz vừa tạo và lưu kết quả vào hồ sơ học tập.',
    ],
    faqs: [
      {
        q: 'AI Doc Studio hỗ trợ những định dạng tài liệu nào?',
        a: 'Hệ thống hỗ trợ tải lên trực tiếp file PDF (giáo trình, chuyên đề, đề cương) hoặc dán văn bản bài học để AI phân tích và tạo bộ học liệu ôn tập.',
      },
      {
        q: 'Có thể tạo câu hỏi trắc nghiệm tự động từ file đề cương PDF không?',
        a: 'Có. Chỉ sau vài giây xử lý tài liệu PDF, AI Doc Studio sẽ tự động sinh bộ câu hỏi trắc nghiệm bám sát nội dung file kèm đáp án và giải thích chi tiết.',
      },
    ],
    relatedSlugs: ['ai-giao-duc', 'phan-mem-tao-de-thi', 'tai-lieu-hoa-hoc', 'quiz'],
  },
  {
    slug: 'bang-phan-tuong-tac',
    appPage: 'chalkboard',
    targetAppHash: '#chalkboard',
    kind: 'tool',
    group: 6,
    label: 'Bảng phấn tương tác',
    title: 'Bảng Phấn Tương Tác KHTN Trực Tuyến · ELEC AI',
    description:
      'Bảng phấn tương tác trực tuyến hỗ trợ vẽ sơ đồ tư duy, mô phỏng bài giảng và giải thích trực quan các bài tập Vật lí, Hóa học, Sinh học.',
    keywords:
      'bảng phấn tương tác trực tuyến, vẽ sơ đồ mạch điện, trình bày lời giải KHTN bằng AI, công cụ hỗ trợ giáo viên, ELEC Science AI',
    h1: 'Bảng Phấn Tương Tác KHTN Trực Tuyến Cho Học Sinh & Giáo Viên',
    intro:
      'Bảng phấn tương tác (Interactive Chalkboard) của ELEC Science AI là không gian trình bày trực quan kết hợp AI, hỗ trợ vẽ sơ đồ mạch điện, hình học không gian, biểu đồ lực cơ học, chuỗi phản ứng hóa học và trình diễn lời giải từng bước sống động như trên bảng lớp học.',
    specs: {
      subject: 'Trực quan hóa bài giảng & bài tập Vật lí, Hóa học, Sinh học, Toán học',
      method: 'Canvas tương tác thời gian thực + Trình diễn lời giải từng bước bằng AI',
      audience: 'Học sinh tự học trực quan và Giáo viên giảng dạy trực tuyến / trên lớp',
    },
    highlights: [
      'Trực quan hóa lời giải từng bước cùng trợ lý AI trên khung bảng phấn với công thức KaTeX và hình vẽ minh họa.',
      'Hỗ trợ phác thảo sơ đồ tư duy, hình không gian, phân tích lực cơ học và cơ chế phản ứng.',
      'Phù hợp cho cả việc tự học tại nhà và trình chiếu giảng dạy trực tiếp trên lớp học.',
    ],
    steps: [
      'Mở Bảng phấn tương tác và nhập bài toán hoặc chủ đề KHTN cần minh họa.',
      'Sử dụng bộ công cụ vẽ trực quan hoặc yêu cầu AI trình bày từng bước lời giải lên mặt bảng.',
      'Tương tác, ghi chú bổ sung trực tiếp trên bảng để nắm bắt trọn vẹn bản chất hình học và hiện tượng khoa học.',
    ],
    faqs: [
      {
        q: 'Bảng phấn tương tác trên ELEC AI dùng để làm gì?',
        a: 'Dùng để trình bày lời giải từng bước một cách trực quan, phác thảo sơ đồ mạch điện, biểu đồ lực Vật lí, sơ đồ phản ứng Hóa học, cơ chế Sinh học và hỗ trợ giáo viên giảng dạy.',
      },
      {
        q: 'Bảng phấn có hiển thị được công thức toán – lý – hóa không?',
        a: 'Có. Bảng phấn tích hợp bộ dựng công thức chuẩn KaTeX cùng hình vẽ minh họa trực quan theo từng bước giải.',
      },
    ],
    relatedSlugs: ['cho-giao-vien', 'gia-su-ai', 'phong-thi-nghiem-vat-li', 'tro-choi-khoa-hoc'],
  },
  {
    slug: 'quiz',
    appPage: 'quiz',
    targetAppHash: '#quiz',
    kind: 'tool',
    group: 3,
    label: 'Luyện tập Quiz SRS',
    title: 'Luyện Tập Quiz KHTN & Ôn Tập Ngắt Quãng SRS · ELEC AI',
    description:
      'Hệ thống câu hỏi trắc nghiệm thông minh đa môn thích ứng điểm mạnh yếu, tự động lưu câu sai để củng cố kiến thức đúng thời điểm.',
    keywords:
      'luyện tập quiz KHTN, bài tập trắc nghiệm THPT, ngân hàng câu hỏi trắc nghiệm, ôn tập ngắt quãng SRS SuperMemo SM-2, sổ tay lỗi sai, ELEC AI',
    h1: 'Luyện Tập Quiz KHTN Thông Minh & Ôn Tập Ngắt Quãng (SRS)',
    intro:
      'Hệ thống Quiz KHTN của ELEC Science AI cung cấp ngân hàng câu hỏi trắc nghiệm thích ứng cho 3 môn Vật lí, Hóa học, Sinh học lớp 10, 11, 12, kết hợp thuật toán ghi nhớ ngắt quãng SuperMemo SM-2 (SRS) để tự động lưu câu trả lời sai và nhắc học sinh ôn lại đúng thời điểm sắp quên.',
    specs: {
      subject: 'Trắc nghiệm Vật lí, Hóa học, Sinh học Lớp 10, 11, 12 (GDPT 2018)',
      method: 'Thuật toán lặp lại ngắt quãng SuperMemo SM-2 + Thích ứng năng lực Elo',
      audience: 'Học sinh THCS, THPT rèn luyện phản xạ trắc nghiệm hàng ngày',
    },
    highlights: [
      'Nhiều chế độ luyện tập: Theo chuyên đề, Thử thách hôm nay, Time Attack (đấu tốc độ), Thẻ ghi nhớ (Flashcards) và Luyện riêng câu sai.',
      'Chấm điểm tức thì sau mỗi câu, hiển thị giải thích bản chất chi tiết cho từng phương án đúng/sai.',
      'Tự động lập lịch nhắc ôn lại những câu hay nhầm lẫn bằng thuật toán SuperMemo SM-2 trước khi đường cong quên lãng đi xuống.',
    ],
    steps: [
      'Chọn môn học (Vật lí, Hóa học, Sinh học), khối lớp và chuyên đề hoặc chọn chế độ Ôn tập câu sai SRS.',
      'Trả lời các câu hỏi trắc nghiệm và đọc kỹ phần giải thích chi tiết ngay sau khi chọn đáp án.',
      'Quay lại mục Luyện câu sai theo lịch nhắc hàng ngày để củng cố trí nhớ dài hạn và duy trì chuỗi Streak.',
    ],
    faqs: [
      {
        q: 'Thuật toán SRS trong Quiz ELEC AI hoạt động ra sao?',
        a: 'Hệ thống áp dụng thuật toán SuperMemo SM-2 để tính toán khoảng cách ngày ôn lại (Interval) dựa trên độ chính xác và mức độ vững vàng của bạn: câu trả lời sai sẽ quay lại sớm, câu trả lời đúng liên tiếp sẽ giãn cách dài dần.',
      },
      {
        q: 'Làm sao để chỉ ôn lại những câu mình từng làm sai?',
        a: 'Mọi câu làm sai trong Quiz, Phòng thi ảo hoặc Trò chơi đều tự động vào Sổ tay lỗi sai. Bạn chỉ cần bấm chọn chế độ "Luyện câu sai" để ôn riêng các câu đó mà không phải làm lại cả đề.',
      },
    ],
    relatedSlugs: ['phong-thi-ao', 'luyen-thi-thpt-quoc-gia', 'lo-trinh-on-thi-thpt-quoc-gia', 'bang-xep-hang'],
  },
  {
    slug: 'bang-xep-hang',
    appPage: 'leaderboard',
    targetAppHash: '#leaderboard',
    kind: 'tool',
    group: 1,
    label: 'Bảng xếp hạng KHTN',
    title: 'Bảng Xếp Hạng Chuỗi Học & Thành Tích KHTN · ELEC AI',
    description:
      'Vinh danh học sinh và lớp học có chuỗi ôn tập bền bỉ và thành tích luyện thi KHTN nổi bật trên ELEC Science AI.',
    keywords:
      'bảng xếp hạng học tập KHTN, chuỗi ngày học Streak, điểm Elo KHTN, thi đua lớp học ELEC Science AI',
    h1: 'Bảng Xếp Hạng Chuỗi Ngày Học & Thành Tích Luyện Thi KHTN',
    intro:
      'Bảng xếp hạng ELEC Science AI theo dõi và vinh danh những học sinh cùng tập thể lớp học có chuỗi ngày học liên tục (Streak), điểm kinh nghiệm (XP) và điểm năng lực Elo KHTN cao nhất trên toàn hệ thống, tạo động lực học tập bền bỉ mỗi ngày.',
    specs: {
      subject: 'Thi đua học tập Vật lí, Hóa học, Sinh học toàn hệ thống & theo lớp học',
      method: 'Tích lũy điểm kinh nghiệm (XP) + Chuỗi ngày học liên tục (Streak) + Điểm Elo',
      audience: 'Học sinh và các Lớp học trên nền tảng ELEC Science AI',
    },
    highlights: [
      'Cập nhật liên tục theo tiến độ hoàn thành bài tập, quiz SRS, phòng thi ảo và trò chơi khoa học.',
      'Bảng xếp hạng riêng cho từng lớp học và bảng vinh danh toàn hệ thống theo tuần / tháng.',
      'Tạo động lực duy trì thói quen tự học Khoa học Tự nhiên đều đặn mỗi ngày.',
    ],
    steps: [
      'Đăng nhập tài khoản học sinh và tham gia lớp học của bạn trên ELEC Science AI.',
      'Hoàn thành ít nhất một hoạt động học tập mỗi ngày (hỏi bài AI, làm Quiz SRS, luyện đề Phòng thi ảo) để giữ lửa chuỗi Streak.',
      'Theo dõi thứ hạng cá nhân và tập thể lớp trên Bảng xếp hạng để chinh phục các huy hiệu thành tích.',
    ],
    faqs: [
      {
        q: 'Làm sao để tăng hạng trên Bảng xếp hạng ELEC AI?',
        a: 'Học sinh tích lũy điểm kinh nghiệm (XP), nâng điểm Elo và duy trì chuỗi ngày học liên tục (Streak) bằng cách hoàn thành bài quiz, luyện đề phòng thi ảo và ôn tập Sổ tay lỗi sai mỗi ngày.',
      },
      {
        q: 'Bảng xếp hạng có phân theo từng lớp học không?',
        a: 'Có. Bên cạnh bảng xếp hạng chung toàn hệ thống, mỗi lớp học do giáo viên tạo đều có bảng xếp hạng thi đua riêng cho các thành viên trong lớp.',
      },
    ],
    relatedSlugs: ['hoc-online-mien-phi', 'quiz', 'tro-choi-khoa-hoc', 'cho-giao-vien'],
  },
  {
    slug: 'phong-thi-nghiem-vat-li',
    appPage: 'physics-lab',
    targetAppHash: '#physics-lab',
    kind: 'tool',
    group: 5,
    label: 'Phòng thí nghiệm Vật lí ảo',
    title: 'Phòng Thí Nghiệm Vật Lí Ảo Lớp 8–12 & Olympiad · ELEC AI',
    description:
      '7 mô phỏng Vật lí tương tác thời gian thực: Chuyển động ném xiên, Mạch điện DC, Quang hình học & Thấu kính, Sóng 2D giao thoa, Cơ học 2D, Con lắc kép RK4 và Phân tích số liệu Olympiad.',
    keywords:
      'phòng thí nghiệm vật lí ảo, mô phỏng vật lí trực tuyến, học Vật lý online, ném xiên, mạch điện DC, thấu kính quang hình, giao thoa sóng 2D, con lắc kép RK4, ELEC AI',
    h1: 'Phòng Thí Nghiệm Vật Lí Ảo Tương Tác Lớp 8–12 & Olympiad',
    intro:
      'Phòng thí nghiệm Vật lí ảo trên ELEC Science AI tích hợp 7 mô phỏng vật lí thời gian thực ngay trên trình duyệt: Chuyển động ném xiên, Mạch điện một chiều DC, Quang hình học (Thấu kính hội tụ/phân kì & Khúc xạ Snell), Giao thoa sóng 2D, Cơ học 2D bảo toàn động lượng, Con lắc kép hỗn loạn RK4 và Phân tích số liệu thực nghiệm OLS chuẩn Olympiad.',
    specs: {
      subject: 'Vật lí THCS, THPT (Lớp 8–12 theo GDPT 2018) & Bồi dưỡng Học sinh giỏi / Olympiad',
      method: 'Mô phỏng phương trình vi phân RK4 thời gian thực + Đồ thị tương tác + Hồi quy tuyến tính OLS',
      audience: 'Học sinh THCS, THPT, Đội tuyển HSG Vật lí và Giáo viên trình chiếu minh họa trên lớp',
    },
    highlights: [
      '7 phòng lab chuyên sâu: Ném xiên có lực cản, Mạch điện DC tương tác, Quang hình học & Thấu kính, Giao thoa sóng 2D, Cơ học 2D, Con lắc kép RK4 và Xử lý số liệu thí nghiệm OLS.',
      'Điều chỉnh trực tiếp mọi tham số (góc ném, vận tốc, chiết suất, tiêu cự, điện trở, tần số sóng) và quan sát quỹ đạo, véc-tơ, đồ thị biến thiên tức thì.',
      'Chạy mượt 100% trên trình duyệt web, hoàn toàn miễn phí, không cần cài phần mềm mô phỏng nặng.',
    ],
    steps: [
      'Chọn một trong 7 thí nghiệm Vật lí ảo tương ứng với chuyên đề đang học (Cơ học, Quang học, Sóng, Điện học hoặc Thực nghiệm Olympiad).',
      'Kéo các thanh trượt để thay đổi thông số vật lí (vận tốc, góc, tiêu cự, điện trở, biên độ...) và bấm Chạy mô phỏng.',
      'Quan sát đồ thị, số liệu đo trực tiếp và xuất kết quả phân tích sai số / hồi quy tuyến tính OLS để đối chiếu với lý thuyết SGK.',
    ],
    faqs: [
      {
        q: 'Phòng thí nghiệm Vật lí ảo trên ELEC AI có những mô phỏng nào?',
        a: 'Gồm 7 mô phỏng trực quan: Chuyển động ném xiên, Mạch điện DC, Quang hình học (Thấu kính & Khúc xạ Snell), Giao thoa sóng 2D, Cơ học 2D bảo toàn động lượng, Con lắc kép hỗn loạn RK4 và Thí nghiệm đo g / Ôm / Archimedes phân tích số liệu OLS.',
      },
      {
        q: 'Phòng thí nghiệm Vật lí ảo có dùng cho giảng dạy trên lớp và luyện thi HSG không?',
        a: 'Có. Giáo viên có thể trình chiếu trực tiếp trên màn hình lớp học để minh họa hiện tượng Vật lí trực quan, còn học sinh đội tuyển HSG/Olympiad có thể thực hành xử lý số liệu sai số và hồi quy tuyến tính OLS.',
      },
    ],
    relatedSlugs: ['hoc-vat-ly-online', 'cong-thuc-hoa-hoc', 'phong-thi-nghiem-sinh-hoc', 'tro-choi-khoa-hoc'],
  },
  {
    slug: 'phong-thi-nghiem-sinh-hoc',
    appPage: 'biology-lab',
    targetAppHash: '#biology-lab',
    kind: 'tool',
    group: 5,
    label: 'Phòng thí nghiệm Sinh học ảo',
    title: 'Phòng Thí Nghiệm Sinh Học Ảo 2D/3D (20 Mô Phỏng) · ELEC AI',
    description:
      '20 mô phỏng Sinh học trực quan chuẩn GDPT 2018: Tế bào 3D, Nguyên phân/Giảm phân, Quang hợp, Hô hấp tế bào, DNA xoắn kép 3D, Phiên mã–Dịch mã, Di truyền Mendel, Giải phẫu người 3D, Tim 3D và Kính hiển vi ảo.',
    keywords:
      'phòng thí nghiệm sinh học ảo, học Sinh học online, mô phỏng tế bào 3D, mô phỏng DNA 3D, giải phẫu người 3D, kính hiển vi ảo, sinh học THPT GDPT 2018, ELEC AI',
    h1: 'Phòng Thí Nghiệm Sinh Học Ảo 2D/3D — 20 Mô Phỏng Chuẩn GDPT 2018',
    intro:
      'Phòng thí nghiệm Sinh học ảo trên ELEC Science AI quy tụ 20 mô phỏng 2D/3D tương tác chia 4 nhóm chuyên sâu (Tế bào & Chuyển hóa, Di truyền phân tử, Giải phẫu & Sinh lý người 3D, Sinh thái học & Kính hiển vi ảo), hỗ trợ thực hành và xuất bảng số liệu Excel/PDF cho học sinh và giáo viên.',
    specs: {
      subject: 'Sinh học THCS & THPT Lớp 10, 11, 12 theo chương trình GDPT 2018',
      method: '20 Mô phỏng WebGL 3D / Canvas 2D tương tác thời gian thực + Xuất báo cáo thí nghiệm',
      audience: 'Học sinh khối B00, học sinh THPT và Giáo viên Sinh học trình chiếu trực quan',
    },
    highlights: [
      'Nhóm Tế bào & Chuyển hóa: Tế bào 3D, Nguyên phân – Giảm phân, Vận chuyển qua màng, Quang hợp và Hô hấp tế bào.',
      'Nhóm Di truyền & Sinh học phân tử: DNA xoắn kép 3D, Phiên mã – Dịch mã, Lai Mendel, Điện di gel và Đột biến gene.',
      'Nhóm Giải phẫu người 3D & Sinh thái: Tim 3D, Hệ tuần hoàn/hô hấp/thần kinh, Lưới thức ăn, Mô hình dịch tễ SIR và Kính hiển vi quang học ảo.',
    ],
    steps: [
      'Chọn 1 trong 4 phân nhóm thí nghiệm Sinh học phù hợp với bài học lớp 10, 11 hoặc 12.',
      'Xoay mô hình 3D, điều chỉnh các tham số sinh học (cường độ ánh sáng, kiểu gene bố mẹ, độ phóng đại kính hiển vi...) để quan sát biến đổi.',
      'Ghi nhận kết quả thí nghiệm và kết hợp ôn tập công thức di truyền trong Sổ tay công thức.',
    ],
    faqs: [
      {
        q: 'Phòng thí nghiệm Sinh học ảo trên ELEC AI gồm bao nhiêu mô phỏng?',
        a: 'Gồm 20 mô phỏng tương tác 2D và 3D bao phủ toàn diện kiến thức Sinh học lớp 10, 11, 12 theo chương trình GDPT 2018.',
      },
      {
        q: 'Giáo viên Sinh học có thể dùng Phòng thí nghiệm ảo để dạy trên lớp không?',
        a: 'Có. Giáo viên có thể mở trực tiếp trên máy chiếu hoặc bảng tương tác lớp học hoàn toàn miễn phí để minh họa cấu trúc tế bào, DNA và cơ quan cơ thể người 3D.',
      },
    ],
    relatedSlugs: ['hoc-sinh-hoc-online', 'phong-thi-nghiem-vat-li', 'cong-thuc-hoa-hoc', 'tro-choi-khoa-hoc'],
  },
];

export const SEO_ROUTE_BY_SLUG = Object.fromEntries(
  SEO_PILLAR_ROUTES.map((r) => [r.slug, r])
);

export const SEO_ROUTE_BY_APP_PAGE = Object.fromEntries(
  SEO_PILLAR_ROUTES.map((r) => [r.appPage, r])
);

export const PSEO_HUB_LINKS = [
  { href: '/de-thi', label: 'Kho 66+ Đề thi thử THPTQG & ĐGNL', desc: 'Luyện đề cấu trúc 3 phần Bộ GD&ĐT kèm câu hỏi mẫu & lời giải' },
  { href: '/nguyen-to', label: 'Thư viện 118 Nguyên tố Hóa học IUPAC', desc: 'Cấu hình electron, nguyên tử khối, hóa trị và phản ứng từng nguyên tố' },
  { href: '/phuong-trinh', label: 'Thư viện 65+ Phương trình Hóa học THPT', desc: 'Cân bằng, điều kiện, hiện tượng và phân loại phản ứng vô cơ – hữu cơ' },
  { href: '/kien-thuc', label: 'Kho 125 Chuyên đề Kiến thức THPT', desc: 'Tổng hợp chuyên đề trọng tâm 12 môn THPT chuẩn GDPT 2018' },
  { href: '/cong-dong', label: 'Cộng đồng Hỏi đáp Bài tập & Ôn thi', desc: 'Trao đổi câu hỏi KHTN, mẹo làm bài và học chung Pomodoro' },
];
