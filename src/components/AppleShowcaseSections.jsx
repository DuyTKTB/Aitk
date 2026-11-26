import { useRef, useState } from 'react';
import './apple-ui.css';

/* ==========================================================================
   ICON HELPERS (Apple SF-Symbols style crisp 1.8px stroke)
   ========================================================================== */
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const IcoX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const IcoArrowUpRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

/* ==========================================================================
   1. APPLE COMPARISON SECTION (Cách học cũ vs ELEC Science AI)
   ========================================================================== */
const OLD_POINTS = [
  ['AI thông thường hay sai số học', 'Tự bịa hệ số phản ứng oxi hóa – khử, sai đơn vị Vật lí hoặc nhầm công thức pH.'],
  ['Chỉ chép đáp án cuối cùng', 'Không phân tích bản chất hiện tượng khiến học sinh gặp dạng tương tự vẫn bí.'],
  ['Tài liệu & công cụ nằm rải rác', 'Phải mở 5–6 tab khác nhau: tra bảng tuần hoàn một nơi, làm đề một nơi, ghi chú một nơi.'],
  ['Làm sai rồi lại quên ngay', 'Không có cơ chế gom câu sai tự động và nhắc ôn lại đúng thời điểm sắp quên.'],
  ['Đề thi thử lỗi thời', 'Thiếu cấu trúc 3 phần mới Bộ GD&ĐT 2026 (Đúng/Sai lũy tiến 4 ý, Trả lời ngắn).'],
  ['Giáo viên chấm bài thủ công tốn giờ', 'Phải tự gõ đề từ PDF/Word, khó giám sát lớp làm bài online và chấm phiếu giấy chậm.'],
];

const ELEC_POINTS = [
  ['AI đa phương thức + Máy tính khoa học xác định', 'Kết hợp khử Gauss ma trận đại số tuyến tính & công cụ tính chuẩn KaTeX — triệt tiêu ảo giác số học.'],
  ['6 chế độ sư phạm (có Socratic gợi ý từng bước)', 'Không lộ đáp án ngay; dẫn dắt tư duy từng bước và kiểm tra ngược bài làm từ ảnh chụp.'],
  ['17 phân hệ KHTN hợp nhất trong 1 tài khoản', 'Trợ lý AI, Phòng thi ảo, 7 Lab Vật lí, Lab Hóa 3D, Bảng tuần hoàn 118 IUPAC, Doc Studio & Cộng đồng.'],
  ['Sổ tay lỗi sai + Thuật toán FSRS / SM-2 & Elo', 'Mọi câu sai tự vào sổ ôn riêng và lên lịch nhắc ngay trước khi đường cong trí nhớ đi xuống.'],
  ['Phòng thi ảo bấm giờ chuẩn 2026 & ĐGNL', 'Chấm điểm lũy tiến Phần II (0,1 – 0,25 – 0,5 – 1,0đ), hỗ trợ HSA, TSA Bách Khoa & V-ACT.'],
  ['Bộ công cụ Giáo viên chuẩn khảo thí số', 'Tách đề từ PDF/Word/Ảnh, giám sát MediaPipe chạy cục bộ tại trình duyệt & quét chấm OMR A4 qua camera.'],
];

export function AppleComparisonSection() {
  return (
    <section className="ap-sec" id="lp-compare" aria-label="So sánh ELEC Science AI với cách học truyền thống">
      <div className="ap-head">
        <span className="ap-eyebrow">SO SÁNH TRỰC DIỆN</span>
        <h2>Khác biệt ngay từ buổi tự học đầu tiên.</h2>
        <p>Được thiết kế chuyên sâu cho Khoa học Tự nhiên GDPT 2018 — thay vì ghép vá nhiều công cụ rời rạc.</p>
      </div>

      <div className="ap-cmp-grid">
        <article className="ap-cmp-card">
          <div className="ap-cmp-top">
            <div>
              <h3>Cách học cũ &amp; AI phổ thông</h3>
              <p>Rời rạc, dễ sai tính toán, nhanh quên kiến thức</p>
            </div>
            <span className="ap-cmp-badge old">Truyền thống</span>
          </div>
          <ul className="ap-cmp-list">
            {OLD_POINTS.map(([title, desc]) => (
              <li key={title}>
                <span className="ap-cmp-ic bad"><IcoX /></span>
                <div>
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="ap-cmp-card is-elec">
          <div className="ap-cmp-top">
            <div>
              <h3>ELEC Science AI</h3>
              <p>Khép kín Hỏi — Hiểu — Thực hành — Khảo thí — Ghi nhớ</p>
            </div>
            <img src="/img/elec/elec-wink.png" alt="Bé Elec" className="ap-cmp-mascot" loading="lazy" />
          </div>
          <ul className="ap-cmp-list">
            {ELEC_POINTS.map(([title, desc]) => (
              <li key={title}>
                <span className="ap-cmp-ic good"><IcoCheck /></span>
                <div>
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

/* ==========================================================================
   2. VISIONOS HOVER PREVIEW TOOL GRID (Rê chuột xem thông số nhanh + link SEO)
   ========================================================================== */
const TOOL_PREVIEWS = [
  {
    href: '/tro-ly-ai-giai-hoa',
    tag: 'AI Gia Sư',
    title: 'Trợ lý AI giải KHTN 6 chế độ',
    desc: 'Chụp tới 10 ảnh đề Lý – Hóa – Sinh, giải từng bước chuẩn KaTeX hoặc bật chế độ Socratic gợi ý.',
    k1: 'Độ chính xác công thức', v1: 'KaTeX + Gauss',
    k2: 'Chế độ sư phạm', v2: '6 chế độ',
  },
  {
    href: '/phong-thi-ao',
    tag: 'Khảo thí 2026',
    title: 'Phòng thi ảo THPTQG & ĐGNL',
    desc: 'Bấm giờ thực 50 phút theo cấu trúc 3 phần Bộ GD&ĐT (18 + 4 + 6 câu) và HSA, TSA, V-ACT.',
    k1: 'Chấm điểm Phần II', v1: 'Lũy tiến 4 ý',
    k2: 'Phân tích bẫy', v2: 'Tự động lưu SRS',
  },
  {
    href: '/phong-thi-nghiem-vat-li',
    tag: 'Mô phỏng RK4',
    title: 'Phòng Lab Vật lí ảo 7 mô phỏng',
    desc: 'Ném xiên, Mạch điện DC, Thấu kính Snell, Giao thoa sóng 2D, Con lắc kép RK4 & xử lý số liệu OLS.',
    k1: 'Độ mượt Canvas', v1: '60fps Web',
    k2: 'Cấp học', v2: 'Lớp 8–12 & HSG',
  },
  {
    href: '/bang-tuan-hoan',
    tag: 'Chuẩn IUPAC',
    title: 'Bảng tuần hoàn 118 nguyên tố',
    desc: 'Tra cứu cấu hình electron, độ âm điện Pauling, số oxi hóa, mô phỏng lớp vỏ và so sánh 2 nguyên tố.',
    k1: 'Danh pháp', v1: 'IUPAC + Việt',
    k2: 'Chi phí', v2: 'Miễn phí 100%',
  },
  {
    href: '/can-bang-phuong-trinh-hoa-hoc',
    tag: 'Đại số tuyến tính',
    title: 'Máy cân bằng PTHH Gauss',
    desc: 'Giải hệ ma trận hữu tỉ cho mọi phản ứng vô cơ, hữu cơ và oxi hóa – khử nhiều ẩn trong tích tắc.',
    k1: 'Thuật toán', v1: 'Khử Gauss',
    k2: 'Kiểm chứng', v2: 'Bảo toàn 2 vế',
  },
  {
    href: '/ai-doc-studio',
    tag: 'NotebookLM Engine',
    title: 'AI Doc Studio — PDF sang Flashcard',
    desc: 'Nạp PDF, Word, Slide hoặc ảnh → AI sinh Cẩm nang, Mindmap SVG, Podcast 2 giọng & Flashcard FSRS.',
    k1: 'Định dạng', v1: 'PDF · DOCX · PPTX',
    k2: 'Ôn tập', v2: 'Vuốt FSRS v4.5',
  },
];

export function AppleToolHoverGrid() {
  return (
    <section className="ap-sec" aria-label="Xem trước nhanh các công cụ KHTN">
      <div className="ap-head">
        <span className="ap-eyebrow">HỆ SINH THÁI TOÀN DIỆN</span>
        <h2>Mọi công cụ tinh gọn. Chạm là mở ngay.</h2>
        <p>Rê chuột lên từng thẻ để xem nhanh thông số kỹ thuật hoặc nhấn để truy cập trực tiếp không cần cài đặt.</p>
      </div>

      <div className="ap-tool-grid">
        {TOOL_PREVIEWS.map((t) => (
          <a key={t.href} href={t.href} className="ap-tool-card">
            <div>
              <div className="ap-tool-top">
                <span className="ap-tool-tag">{t.tag}</span>
                <span className="ap-tool-arrow"><IcoArrowUpRight /></span>
              </div>
              <h3 style={{ marginTop: 14 }}>{t.title}</h3>
              <p>{t.desc}</p>
            </div>
            <div className="ap-tool-preview">
              <div className="ap-tool-preview-line">
                <b>{t.k1}</b>
                <em>{t.v1}</em>
              </div>
              <div className="ap-tool-preview-line">
                <b>{t.k2}</b>
                <em>{t.v2}</em>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ==========================================================================
   3. APPLE BENTO PRICING (Segmented Control Học sinh / Giáo viên)
   ========================================================================== */
export function ApplePricingSection() {
  const [audience, setAudience] = useState('student'); // student | teacher

  const plans = audience === 'student'
    ? [
        {
          name: 'Học sinh Miễn phí',
          sub: 'Đủ toàn bộ công cụ KHTN cốt lõi mỗi ngày',
          price: '0đ',
          unit: '/ mãi mãi',
          cta: 'Bắt đầu miễn phí',
          href: '#register',
          featured: false,
          feats: [
            'Bảng tuần hoàn 118 nguyên tố IUPAC & So sánh',
            'Máy cân bằng PTHH đại số tuyến tính không giới hạn',
            'Phòng Lab Vật lí ảo 7 mô phỏng & Lab Hóa 3D',
            'Luyện Quiz SRS, Sổ tay câu sai & Lộ trình Elo',
            'Tính điểm Đại học, Tra cứu điểm chuẩn & Cộng đồng',
          ],
        },
        {
          name: 'ELEC VIP Pro',
          sub: 'Bứt tốc 8.5–9.5+ THPTQG & ĐGNL với AI tốc độ cao',
          price: 'Linh hoạt',
          unit: '· gói học sinh',
          pill: 'Phổ biến nhất',
          cta: 'Mở khóa ELEC VIP',
          href: '#register',
          featured: true,
          feats: [
            'Trợ lý AI giải đề từ ảnh không lo hết lượt',
            'AI Doc Studio: Nạp PDF/Word → Mindmap, Podcast & FSRS',
            'Mở khóa toàn bộ đề thi thử VIP THPTQG & HSA/TSA',
            'Phân tích lỗ hổng chuyên sâu & gợi ý đề cá nhân hóa',
            'Tùy biến tủ đồ Bé Elec & huy hiệu VIP nổi bật',
          ],
        },
        {
          name: 'Nhóm bạn & Lớp học',
          sub: 'Học chung Pomodoro, đua Streak & vào lớp thầy cô',
          price: '0đ',
          unit: '/ tham gia bằng mã lớp',
          cta: 'Nhập mã lớp ngay',
          href: '#register',
          featured: false,
          feats: [
            'Tham gia lớp học của giáo viên bằng mã 6 ký tự',
            'Làm đề kiểm tra bấm giờ thực, xem đáp án chi tiết',
            'Bảng xếp hạng thi đua riêng theo từng lớp học',
            'Phòng học chung Focus Studio & chia sẻ ghi chú',
            'Đồng bộ tiến độ tự động trên điện thoại và máy tính',
          ],
        },
      ]
    : [
        {
          name: 'Giáo viên Khởi đầu',
          sub: 'Trải nghiệm giao đề & chấm bài trực tuyến miễn phí',
          price: '0đ',
          unit: '/ trải nghiệm',
          cta: 'Đăng ký tài khoản GV',
          href: '#register',
          featured: false,
          feats: [
            'Tạo lớp học, duyệt học sinh qua mã lớp hoặc link',
            'Soạn đề chuẩn 3 phần mới của Bộ GD&ĐT 2026',
            'Giao bài có đếm giờ, xáo trộn câu hỏi & đáp án',
            'Xem phổ điểm và thống kê tỷ lệ đúng/sai từng câu',
          ],
        },
        {
          name: 'Giáo viên Pro Studio',
          sub: 'Tự động hóa 90% công việc soạn đề & chấm thi',
          price: 'Pro GV',
          unit: '· toàn bộ công cụ',
          pill: 'Khuyên dùng',
          cta: 'Kích hoạt Teacher Pro',
          href: '#login',
          featured: true,
          feats: [
            'AI tách đề tự động từ file PDF, Word (.docx OMML) & ảnh',
            'Giám sát phòng thi trực tiếp bằng MediaPipe cục bộ',
            'Chấm phiếu trắc nghiệm giấy A4 qua camera (OMR Pro Studio)',
            'Xuất báo cáo điểm Excel/Word & chẩn đoán học lực từng em',
            'Không giới hạn số lượng lớp và kho câu hỏi cá nhân',
          ],
        },
        {
          name: 'Tổ bộ môn & Nhà trường',
          sub: 'Triển khai đồng bộ khối Lý – Hóa – Sinh cấp trường',
          price: 'Tùy chỉnh',
          unit: '/ năm học',
          cta: 'Liên hệ nhà sáng lập',
          href: '/nha-sang-lap',
          featured: false,
          feats: [
            'Hỗ trợ thiết lập ngân hàng đề chung cho tổ KHTN',
            'Đào tạo nhanh giáo viên dùng OMR & MediaPipe trong 30 phút',
            'Báo cáo tiến độ ôn thi THPTQG toàn khối lớp 12',
            'Hỗ trợ kỹ thuật ưu tiên trực tiếp từ đội ngũ phát triển',
          ],
        },
      ];

  return (
    <section className="ap-sec" id="lp-pricing" aria-label="Các gói sử dụng ELEC Science AI">
      <div className="ap-head">
        <span className="ap-eyebrow">MINH BẠCH &amp; TỐI ƯU</span>
        <h2>Miễn phí để bắt đầu. Nâng cấp khi cần bứt tốc.</h2>
        <p>Học sinh luôn dùng miễn phí toàn bộ bộ công cụ KHTN cốt lõi — không quảng cáo làm phiền, không cần thẻ tín dụng.</p>
      </div>

      <div className="ap-seg-wrap">
        <div className="ap-seg" role="tablist" aria-label="Chọn đối tượng">
          <button type="button" role="tab" aria-selected={audience === 'student'} className={audience === 'student' ? 'on' : ''} onClick={() => setAudience('student')}>
            Dành cho Học sinh
          </button>
          <button type="button" role="tab" aria-selected={audience === 'teacher'} className={audience === 'teacher' ? 'on' : ''} onClick={() => setAudience('teacher')}>
            Dành cho Giáo viên
          </button>
        </div>
      </div>

      <div className="ap-price-grid">
        {plans.map((p) => (
          <article key={p.name} className={`ap-price-card ${p.featured ? 'featured' : ''}`}>
            {p.pill && <span className="ap-price-pill">{p.pill}</span>}
            <div>
              <h3 className="ap-price-name">{p.name}</h3>
              <p className="ap-price-sub">{p.sub}</p>
            </div>
            <div className="ap-price-val">
              <b>{p.price}</b>
              <span>{p.unit}</span>
            </div>
            <ul className="ap-price-feats">
              {p.feats.map((f) => (
                <li key={f}>
                  <IcoCheck />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a href={p.href} className={`ap-btn ${p.featured ? 'primary' : ''}`}>
              {p.cta}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ==========================================================================
   4. APPLE DUAL-TRACK SOCIAL PROOF WALL (Học sinh & Giáo viên)
   ========================================================================== */
const REVIEWS_ROW_1 = [
  { name: 'Minh Khang', role: 'Lớp 12A1 · Ôn khối A00', badge: '+1.75đ Hóa', text: 'Bật chế độ Gợi ý từng bước giúp mình tự làm được mấy bài Ester – Pin điện chứ không chép thụ động như dùng chatbot thường.' },
  { name: 'Thảo Vy', role: 'Lớp 12 · Mục tiêu Y Hà Nội', badge: 'Elo 1740', text: 'Phòng thi ảo chấm Phần II Đúng/Sai lũy tiến chuẩn y hệt cấu trúc Bộ GD&ĐT. Làm sai câu nào tự bay vào sổ SRS để hôm sau ôn lại.' },
  { name: 'Cô Thu Hương', role: 'GV Hóa học THPT · Thái Bình', badge: 'OMR Studio', text: 'Tính năng tách đề từ file Word có công thức và chấm phiếu trắc nghiệm A4 bằng camera điện thoại giúp tôi tiết kiệm cả buổi tối.' },
  { name: 'Gia Bảo', role: 'Lớp 11 · Đội tuyển Vật lí', badge: 'Lab Vật lí', text: 'Mê nhất phòng Lab Vật lí ảo có giao thoa sóng 2D với con lắc kép RK4, kéo thanh trượt là thấy ngay quỹ đạo và đồ thị.' },
];

const REVIEWS_ROW_2 = [
  { name: 'Ngọc Linh', role: 'Lớp 10 · GDPT 2018', badge: 'IUPAC 118', text: 'Mới lên cấp 3 bị choáng tên tiếng Anh IUPAC nhưng tra Bảng tuần hoàn song ngữ trên ELEC AI vài hôm là thuộc sạch.' },
  { name: 'Đức Anh', role: 'Lớp 12 · Luyện thi TSA', badge: 'Doc Studio', text: 'Ném cả file PDF đề cương Sinh 12 vào AI Doc Studio, 1 phút sau có luôn sơ đồ tư duy với bộ Flashcard vuốt trên điện thoại.' },
  { name: 'Thầy Hoàng Nam', role: 'GV Vật lí · Hà Nội', badge: 'MediaPipe', text: 'Giám sát phòng thi xử lý trực tiếp trên máy học sinh nên rất nhẹ và yên tâm về quyền riêng tư, giao bài kiểm tra 15 phút rất gọn.' },
  { name: 'Phương Anh', role: 'Lớp 12D7 · Khối D07', badge: 'Streak 42 ngày', text: 'Có Bé Elec nhắc học và chuỗi Streak nên tối nào cũng làm ít nhất 10 câu Quiz SRS trước khi đi ngủ, nhớ lý thuyết cực lâu.' },
];

export function AppleTestimonialsSection() {
  return (
    <section className="ap-sec" aria-label="Cảm nhận từ học sinh và giáo viên">
      <div className="ap-head">
        <span className="ap-eyebrow">ĐƯỢC TIN DÙNG MỖI NGÀY</span>
        <h2>Từ lớp học đến kỳ thi thật.</h2>
        <p>Những phản hồi thực tế từ học sinh lớp 10–12 và giáo viên Khoa học Tự nhiên trên cả nước.</p>
      </div>

      <div className="ap-wall-wrap">
        {[REVIEWS_ROW_1, REVIEWS_ROW_2].map((row, rIdx) => (
          <div key={rIdx} className={`ap-wall-track ${rIdx === 1 ? 'reverse' : ''}`}>
            {[...row, ...row].map((item, i) => (
              <article key={`${rIdx}-${i}`} className="ap-review">
                <div className="ap-review-top">
                  <div className="ap-review-user">
                    <span className="ap-review-av">{item.name.split(' ').pop().charAt(0)}</span>
                    <div>
                      <b>{item.name}</b>
                      <small>{item.role}</small>
                    </div>
                  </div>
                  <span className="ap-review-chip">{item.badge}</span>
                </div>
                <p>“{item.text}”</p>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ==========================================================================
   5. APPLE WALLET PHYSICAL SWIPE FLASHCARD STACK (Dùng thật trong DocStudio & Landing)
   ========================================================================== */
const DEMO_SWIPE_CARDS = [
  { tag: 'Hóa học 12 · IUPAC', q: 'Phản ứng thủy phân Ester trong môi trường kiềm (NaOH) gọi là gì và có thuận nghịch không?', a: 'Phản ứng xà phòng hóa — là phản ứng MỘT CHIỀU (không thuận nghịch), tạo muối carboxylate và alcohol (hoặc aldehyde/ketone).' },
  { tag: 'Vật lí 11 · Dao động', q: 'Trong dao động điều hòa x = Acos(ωt + φ), tốc độ cực đại và gia tốc cực đại đạt được ở đâu?', a: 'v_max = ωA tại vị trí cân bằng (x = 0); |a_max| = ω²A tại hai vị trí biên (x = ±A).' },
  { tag: 'Sinh học 12 · Di truyền', q: 'Theo nguyên tắc bổ sung trong phân tử DNA mạch kép, tỉ lệ (A + G) / (T + C) luôn bằng bao nhiêu?', a: 'Luôn bằng 1 (vì A = T và G = C theo định luật Chargaff).' },
  { tag: 'Hóa học 10 · Oxi hóa – Khử', q: 'Mẹo nhớ nhanh chất khử và chất oxi hóa trong phản ứng oxi hóa – khử?', a: '“Khử cho – O nhận”: Chất khử NHƯỜNG electron (số oxi hóa tăng); Chất oxi hóa NHẬN electron (số oxi hóa giảm).' },
];

export function AppleSwipeFlashcardStack({
  cards = DEMO_SWIPE_CARDS,
  onSwipeRight,
  onSwipeLeft,
  demoMode = false,
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exitDir, setExitDir] = useState(null); // 'left' | 'right' | null
  const [feedback, setFeedback] = useState(null); // { dir, text, sprite }
  const startRef = useRef({ x: 0, y: 0, moved: false });

  const total = cards.length;
  const safeIdx = total ? idx % total : 0;
  const current = cards[safeIdx];

  const commitSwipe = (dir) => {
    if (!current || exitDir) return;
    setExitDir(dir);
    setFeedback(
      dir === 'right'
        ? { dir, text: 'Tuyệt vời! Đã đánh dấu Nhớ tốt', sprite: '/img/elec/elec-happy.png' }
        : { dir, text: 'Đã lưu vào hàng đợi Ôn lại sớm', sprite: '/img/elec/elec-think.png' }
    );
    setTimeout(() => {
      if (dir === 'right') onSwipeRight?.(current, safeIdx);
      else onSwipeLeft?.(current, safeIdx);
      setFlipped(false);
      setDrag({ x: 0, y: 0, active: false });
      setExitDir(null);
      setIdx((n) => (demoMode ? (n + 1) % total : Math.min(total - 1, n + 1)));
    }, 240);
  };

  const onPointerDown = (e) => {
    if (exitDir) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, moved: false };
    setDrag({ x: 0, y: 0, active: true });
  };

  const onPointerMove = (e) => {
    if (!drag.active || exitDir) return;
    const dx = e.clientX - startRef.current.x;
    const dy = (e.clientY - startRef.current.y) * 0.25;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) startRef.current.moved = true;
    setDrag({ x: dx, y: dy, active: true });
  };

  const onPointerUp = () => {
    if (!drag.active || exitDir) return;
    const dx = drag.x;
    if (dx > 92) {
      commitSwipe('right');
    } else if (dx < -92) {
      commitSwipe('left');
    } else {
      setDrag({ x: 0, y: 0, active: false });
      if (!startRef.current.moved) setFlipped((f) => !f);
    }
  };

  if (!current) return null;

  const tx = exitDir === 'right' ? 420 : exitDir === 'left' ? -420 : drag.x;
  const ty = exitDir ? -20 : drag.y;
  const rot = exitDir === 'right' ? 18 : exitDir === 'left' ? -18 : drag.x * 0.055;
  const rightAlpha = Math.min(1, Math.max(0, (tx - 24) / 80));
  const leftAlpha = Math.min(1, Math.max(0, (-tx - 24) / 80));

  return (
    <div className="ap-swipe-root">
      <div className="ap-swipe-meta">
        <span>Thẻ <b>{safeIdx + 1}/{total}</b> · Kéo trái (Ôn lại) / Kéo phải (Đã thuộc)</span>
        {feedback && (
          <span className="ap-swipe-feedback">
            <img src={feedback.sprite} alt="" />
            {feedback.text}
          </span>
        )}
      </div>

      <div className="ap-swipe-deck">
        {total > 2 && <div className="ap-swipe-ghost g2" aria-hidden="true" />}
        {total > 1 && <div className="ap-swipe-ghost g1" aria-hidden="true" />}

        <div
          className="ap-swipe-card"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
            if (e.key === 'ArrowRight') commitSwipe('right');
            if (e.key === 'ArrowLeft') commitSwipe('left');
          }}
          style={{
            transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${rot.toFixed(1)}deg)`,
            opacity: exitDir ? 0 : 1,
            transition: drag.active ? 'none' : 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease',
          }}
        >
          <span className="ap-swipe-stamp right" style={{ opacity: rightAlpha }}>ĐÃ THUỘC</span>
          <span className="ap-swipe-stamp left" style={{ opacity: leftAlpha }}>ÔN LẠI</span>

          <div className="ap-swipe-top">
            <span>{current.tag || (flipped ? 'Đáp án · FSRS v4.5' : 'Câu hỏi · FSRS v4.5')}</span>
            <span>{flipped ? 'MẶT SAU' : 'MẶT TRƯỚC'}</span>
          </div>

          <div className="ap-swipe-content">
            {flipped ? current.a : current.q}
          </div>

          <div className="ap-swipe-hint">
            {flipped ? 'Kéo sang phải nếu đã nhớ · Kéo sang trái để ôn lại' : 'Chạm thẻ để lật đáp án — hoặc kéo trái / phải'}
          </div>
        </div>
      </div>

      <div className="ap-swipe-actions">
        <button type="button" className="ap-swipe-btn again" onClick={() => commitSwipe('left')}>
          ← Ôn lại sớm
        </button>
        <button type="button" className="ap-swipe-btn" onClick={() => setFlipped((f) => !f)}>
          {flipped ? 'Xem câu hỏi' : 'Lật đáp án'}
        </button>
        <button type="button" className="ap-swipe-btn good" onClick={() => commitSwipe('right')}>
          Đã thuộc →
        </button>
      </div>
    </div>
  );
}
