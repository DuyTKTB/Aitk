
export const MKT = [
  {
    id: 'mkt-01',
    cat: 'mkt',
    title: 'Trả lời đánh giá tốt trên Google Maps',
    desc: 'Ba phản hồi thân thiện, nhắc đúng chi tiết khách khen. Có phân tích tâm lý khách.',
    tags: ['Google Maps', 'review', 'chi tiết'],
    prompt: `Bạn là chủ quán {{tên quán}} ({{loại hình}}), đang trả lời đánh giá Google Maps.

ĐÁNH GIÁ CỦA KHÁCH:
{{nội dung đánh giá}}

SỐ SAO: {{số sao}}/5

YÊU CẦU:

1. PHÂN TÍCH ĐÁNH GIÁ
   - Khách khen điểm gì cụ thể?
   - Giọng điệu khách?

2. VIẾT 3 PHƯƠNG ÁN PHẢN HỒI
   - PA 1: Thân thiện, gần gũi.
   - PA 2: Chuyên nghiệp, lịch sự.
   - PA 3: Ngắn gọn, súc tích (dưới 30 từ).

3. YÊU CẦU CHUNG
   - Nhắc đúng chi tiết khách khen.
   - Mời khách quay lại.
   - Không quá 50 từ mỗi bản.
   - Tối đa 1 emoji.

4. GỢI Ý MỞ RỘNG
   - Có nên tặng voucher nhỏ?
   - Cách biến khách tốt thành khách trung thành.

ĐỊNH DẠNG:
- Đánh số phương án rõ ràng.`,
    sample: 'Cảm ơn anh Minh đã ghé quán và dành thời gian đánh giá! Rất vui vì anh hài lòng với món trà sữa trân châu đường đen. Hẹn gặp lại anh lần sau nhé!…',
    long: true,
  },
  {
    id: 'mkt-02',
    cat: 'mkt',
    title: 'Trả lời đánh giá tiêu cực',
    desc: 'Xin lỗi cụ thể, không đổ lỗi, nêu hướng xử lý, mời liên hệ riêng.',
    tags: ['Google Maps', 'khủng hoảng', 'chi tiết'],
    prompt: `Bạn là chủ quán {{tên quán}}, xử lý đánh giá tiêu cực trên Google Maps.

ĐÁNH GIÁ CỦA KHÁCH:
{{nội dung đánh giá}}

SỐ SAO: {{số sao}}/5
KÊNH LIÊN HỆ RIÊNG: {{kênh liên hệ}}

YÊU CẦU:

1. PHÂN TÍCH VẤN ĐỀ
   - Khách phàn nàn về gì?
   - Mức độ nghiêm trọng: nhẹ / trung bình / nghiêm trọng?

2. PHẢN HỒI CÔNG KHAI (dưới 80 từ)
   - Cảm ơn phản hồi.
   - Xin lỗi đúng vấn đề (KHÔNG đổ lỗi).
   - Nói rõ hướng xử lý.
   - Mời liên hệ qua {{kênh liên hệ}}.

3. NGUYÊN TẮC
   - Bình tĩnh, không phòng thủ.
   - Không tranh cãi công khai.
   - Không hứa những gì không làm được.

4. PHƯƠNG ÁN DỰ PHÒNG
   - Nếu khách tiếp tục phàn nàn, xử lý thế nào?

5. BÀI HỌC NỘI BỘ
   - 3 hành động cần làm ngay.
   - Cách đào tạo nhân viên.

6. RỦI RO CẦN LƯU Ý
   - Ảnh hưởng xếp hạng Google Maps không?
   - Có nên báo cáo đánh giá (nếu spam)?

ĐỊNH DẠNG:
- Phản hồi công khai trong block riêng.`,
    long: true,
  },
  {
    id: 'mkt-03',
    cat: 'mkt',
    title: 'Mô tả Google Business Profile',
    desc: 'Tối đa 750 ký tự, chèn từ khóa tự nhiên, không khoa trương.',
    tags: ['Google Maps', 'SEO local', 'chi tiết'],
    prompt: `Viết mô tả cho Google Business Profile (GBP).

THÔNG TIN:
- Tên: {{tên}}
- Loại hình: {{loại hình}}
- Khu vực: {{khu vực}}
- Điểm mạnh: {{điểm mạnh}}
- Từ khóa chính: {{từ khóa}}

YÊU CẦU:

1. MÔ TẢ CHÍNH (tối đa 750 ký tự)
   - Mở đầu: giới thiệu ngắn.
   - Giữa: điểm mạnh, dịch vụ.
   - Cuối: lời mời ghé thăm.
   - Chèn từ khóa tự nhiên.

2. NGUYÊN TẮC
   - Không viết hoa toàn bộ.
   - Không khoa trương.
   - Không SĐT, link, email.
   - Tối đa 2 emoji.

3. PHÂN TÍCH SEO
   - Đếm từ khóa.
   - Tỷ lệ có tự nhiên không (1-2%)?

4. PHƯƠNG ÁN DỰ PHÒNG
   - Bản 500 ký tự.
   - Bản tập trung 1 dịch vụ.

5. GỢI Ý MỞ RỘNG
   - Mô tả cho từng dịch vụ.
   - Dùng bài đăng (Post) trên GBP.

ĐỊNH DẠNG:
- Mô tả chính trong block riêng.
- Có đếm ký tự.`,
    long: true,
  },
  {
    id: 'mkt-04',
    cat: 'mkt',
    title: '5 caption Facebook cho quán',
    desc: 'Năm góc khác nhau: câu chuyện, ưu đãi, hậu trường, khách hàng, câu hỏi.',
    tags: ['Facebook', 'caption', 'chi tiết'],
    prompt: `Viết 5 caption Facebook cho {{tên quán}} giới thiệu {{món hoặc dịch vụ}}.

THÔNG TIN:
- Đối tượng khách: {{đối tượng khách}}
- Điểm đặc biệt: {{điểm đặc biệt}}
- Khuyến mãi: {{khuyến mãi}}

5 GÓC:

1. CÂU CHUYỆN (Storytelling)
2. ƯU ĐÃI (Promotion)
3. HẬU TRƯỜNG (Behind the scenes)
4. KHÁCH HÀNG (Testimonial)
5. CÂU HỎI TƯƠNG TÁC (Engagement)

YÊU CẦU CHUNG:
- Mỗi caption tối đa 80 từ.
- CTA rõ ràng.
- 2-3 hashtag.
- Giọng văn: {{giọng văn}}.

GHI CHÚ:
- Thời điểm đăng.
- Loại ảnh/video đi kèm.

ĐỊNH DẠNG:
- Mỗi caption trong block riêng.`,
    long: true,
  },
  {
    id: 'mkt-05',
    cat: 'mkt',
    title: 'Kịch bản TikTok 30 giây',
    desc: 'Hook 3 giây, vấn đề, giải pháp, bằng chứng, CTA.',
    tags: ['TikTok', 'chi tiết'],
    prompt: `Viết kịch bản TikTok 30 giây cho {{sản phẩm / dịch vụ}}.

THÔNG TIN:
- Đối tượng: {{đối tượng}}
- Vấn đề: {{vấn đề}}
- Giải pháp: {{giải pháp}}
- Bằng chứng: {{bằng chứng}}

CẤU TRÚC 5 PHẦN:
1. HOOK (0-3s)
2. VẤN ĐỀ (3-8s)
3. GIẢI PHÁP (8-18s)
4. BẰNG CHỨNG (18-25s)
5. CTA (25-30s)

GHI CHÚ:
- Nhạc nền.
- 5-7 hashtag.
- 3 lỗi cần tránh.

ĐỊNH DẠNG:
- Bảng: Thời gian | Lời thoại | Hình ảnh | Chữ.`,
    long: true,
  },
  {
    id: 'mkt-06',
    cat: 'mkt',
    title: 'Lịch nội dung 30 ngày',
    desc: 'Bốn trụ cột nội dung, định dạng và chủ đề từng ngày dạng bảng.',
    tags: ['kế hoạch', 'content', 'chi tiết'],
    prompt: `Lập lịch nội dung 30 ngày cho ngành {{ngành}}, nền tảng {{nền tảng}}.

THÔNG TIN:
- Mục tiêu: {{mục tiêu}}
- Đối tượng: {{đối tượng}}
- Tần suất: {{tần suất}}

YÊU CẦU:

1. 4 TRỤ CỘT NỘI DUNG
   - Tên, mục đích, tỷ lệ %.
2. LỊCH 30 NGÀY (dạng bảng)
   | Ngày | Trụ cột | Chủ đề | Định dạng | Mục tiêu | CTA |
3. KPI THEO DÕI
4. NỘI DUNG TÁI SỬ DỤNG
5. GHI CHÚ THỰC HIỆN

ĐỊNH DẠNG:
- Bảng rõ ràng, chia theo tuần.`,
    long: true,
  },
  {
    id: 'mkt-07',
    cat: 'mkt',
    title: 'Viết content quảng cáo Facebook Ads',
    desc: 'Headline, primary text, description, CTA cho Facebook Ads.',
    tags: ['Facebook Ads', 'chi tiết'],
    prompt: `Viết content Facebook Ads cho:

SẢN PHẨM: {{sản phẩm}}
ĐỐI TƯỢNG: {{đối tượng}}
MỤC TIÊU: {{mục tiêu}}

YÊU CẦU:

1. HEADLINE (5 từ)
2. PRIMARY TEXT (100 chữ)
   - Hook.
   - Vấn đề + giải pháp.
   - Bằng chứng.
   - CTA.
3. DESCRIPTION (30 chữ)
4. CTA BUTTON
5. 3 BIẾN THỂ ĐỂ A/B TEST
6. GHI CHÚ
   - Target audience.
   - Ngân sách gợi ý.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'mkt-08',
    cat: 'mkt',
    title: 'Viết Google Ads',
    desc: 'Headlines, descriptions cho Google Ads.',
    tags: ['Google Ads', 'chi tiết'],
    prompt: `Viết Google Ads cho:

SẢN PHẨM: {{sản phẩm}}
TỪ KHÓA: {{từ khóa}}
MỤC TIÊU: {{mục tiêu}}

YÊU CẦU:

1. HEADLINES (3 câu, mỗi câu dưới 30 ký tự)
2. DESCRIPTIONS (2 câu, mỗi câu dưới 90 ký tự)
3. SITELINK EXTENSIONS (4 links)
4. CALLOUT EXTENSIONS
5. STRUCTURED SNIPPETS
6. GHI CHÚ
   - Quality Score.
   - Cách tối ưu CPC.

ĐỊNH DẠNG:
- Đếm ký tự mỗi dòng.`,
    long: true,
  },
  {
    id: 'mkt-09',
    cat: 'mkt',
    title: 'Viết email marketing chuỗi 5 email',
    desc: 'Chuỗi 5 email nuôi dưỡng từ chào mừng đến chốt đơn.',
    tags: ['email', 'chi tiết'],
    prompt: `Viết chuỗi 5 email marketing cho:

SẢN PHẨM: {{sản phẩm}}
ĐỐI TƯỢNG: {{đối tượng}}

YÊU CẦU:

1. EMAIL CHÀO MỪNG
2. EMAIL GIÁ TRỊ (không bán hàng)
3. EMAIL CASE STUDY
4. EMAIL XỬ LÝ PHẢN ĐỐI
5. EMAIL CHỐT ĐƠN

MỖI EMAIL:
- Subject line.
- Preview text.
- Body 150-200 chữ.
- 1 CTA duy nhất.

ĐỊNH DẠNG:
- Mỗi email trong block riêng.`,
    long: true,
  },
  {
    id: 'mkt-10',
    cat: 'mkt',
    title: 'Viết content cho landing page',
    desc: 'Landing page có hero, features, testimonials, CTA.',
    tags: ['landing page', 'chi tiết'],
    prompt: `Viết content landing page cho:

SẢN PHẨM: {{sản phẩm}}
ĐỐI TƯỢNG: {{đối tượng}}
MỤC TIÊU: {{mục tiêu}}

YÊU CẦU:

1. HERO SECTION
   - Headline (10-15 từ).
   - Sub-headline (20-30 từ).
   - CTA button.
2. PAIN POINTS (3 vấn đề)
3. SOLUTION
4. FEATURES (5-7 tính năng)
5. SOCIAL PROOF
6. PRICING (3 gói)
7. FAQ (5 câu hỏi)
8. FINAL CTA

ĐỊNH DẠNG:
- Tiêu đề từng section.
- Ngắn gọn, súc tích.`,
    long: true,
  },
  {
    id: 'mkt-11',
    cat: 'mkt',
    title: 'Viết caption Instagram',
    desc: 'Caption Instagram có hook, story, CTA, hashtag.',
    tags: ['Instagram', 'chi tiết'],
    prompt: `Viết 3 caption Instagram cho:

CHỦ ĐỀ: {{chủ đề}}
PHONG CÁCH: {{phong cách}}

YÊU CẦU:

1. CAPTION 1: STORYTELLING
   - Kể câu chuyện ngắn.
   - Cảm xúc.
   - CTA.

2. CAPTION 2: EDUCATIONAL
   - Chia sẻ tips/kiến thức.
   - Bullet points.
   - CTA lưu bài.

3. CAPTION 3: ENGAGEMENT
   - Đặt câu hỏi.
   - Khuyến khích comment.

CHUNG:
- Mỗi caption 100-150 chữ.
- 15-20 hashtag phù hợp.
- Emoji hợp lý.

ĐỊNH DẠNG:
- Mỗi caption trong block riêng.`,
    long: true,
  },
  {
    id: 'mkt-12',
    cat: 'mkt',
    title: 'Viết script video bán hàng',
    desc: 'Script video bán hàng 3 phút có hook, vấn đề, giải pháp, CTA.',
    tags: ['video', 'bán hàng', 'chi tiết'],
    prompt: `Viết script video bán hàng 3 phút cho:

SẢN PHẨM: {{sản phẩm}}
ĐỐI TƯỢNG: {{đối tượng}}
GIÁ: {{giá}}

CẤU TRÚC:

1. HOOK (0-10s)
   - Câu nói gây sốc.
   - Hình ảnh bắt mắt.

2. VẤN ĐỀ (10-40s)
   - Nêu pain point.
   - Đồng cảm.

3. GIẢI PHÁP (40-90s)
   - Giới thiệu sản phẩm.
   - 3 lợi ích chính.
   - Demo sử dụng.

4. BẰNG CHỨNG (90-120s)
   - Testimonial.
   - Số liệu.

5. ƯU ĐÃI (120-150s)
   - Giá gốc vs giá sale.
   - Quà tặng kèm.
   - Khan hiếm.

6. CTA (150-180s)
   - Hướng dẫn mua.
   - Link, SĐT.

ĐỊNH DẠNG:
- Bảng: Thời gian | Lời thoại | Hình ảnh.`,
    long: true,
  },
  {
    id: 'mkt-13',
    cat: 'mkt',
    title: 'Phân tích đối thủ cạnh tranh',
    desc: 'Phân tích SWOT của đối thủ, đề xuất chiến lược.',
    tags: ['phân tích', 'chi tiết'],
    prompt: `Phân tích đối thủ cạnh tranh:

ĐỐI THỦ: {{tên đối thủ}}
NGÀNH: {{ngành}}
CỦA BẠN: {{tên của bạn}}

YÊU CẦU:

1. SWOT ĐỐI THỦ
   - Strengths.
   - Weaknesses.
   - Opportunities.
   - Threats.

2. ĐIỂM MẠNH CỦA HỌ
   - Sản phẩm.
   - Marketing.
   - Giá.

3. ĐIỂM YẾU CỦA HỌ
   - Cơ hội để bạn khai thác.

4. SO SÁNH VỚI BẠN
   - Bảng so sánh.

5. CHIẾN LƯỢC ĐỀ XUẤT
   - Định vị.
   - USP.
   - Kênh tiếp cận.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'mkt-14',
    cat: 'mkt',
    title: 'Viết mô tả sản phẩm thương mại điện tử',
    desc: 'Mô tả sản phẩm cho Shopee, Lazada, Tiki.',
    tags: ['ecommerce', 'chi tiết'],
    prompt: `Viết mô tả sản phẩm cho:

SẢN PHẨM: {{sản phẩm}}
NỀN TẢNG: {{Shopee / Lazada / Tiki}}
ĐỐI TƯỢNG: {{đối tượng}}

YÊU CẦU:

1. TIÊU ĐỀ SẢN PHẨM (dưới 120 ký tự)
   - Có từ khóa chính.
   - Có USP.

2. MÔ TẢ NGẮN (100 chữ)
3. MÔ TẢ CHI TIẾT (300-500 chữ)
   - Đặc điểm nổi bật (bullet).
   - Thông số kỹ thuật.
   - Hướng dẫn sử dụng.
   - Bảo quản.
4. TỪ KHÓA SEO
5. CTA

ĐỊNH DẠNG:
- Bullet points rõ ràng.
- Emoji hợp lý.`,
    long: true,
  },
  {
    id: 'mkt-15',
    cat: 'mkt',
    title: 'Viết thông cáo báo chí',
    desc: 'Thông cáo báo chí chuẩn, có quote từ CEO.',
    tags: ['PR', 'chi tiết'],
    prompt: `Viết thông cáo báo chí cho:

SỰ KIỆN: {{sự kiện}}
CÔNG TY: {{công ty}}
NGÀY: {{ngày}}

YÊU CẦU:

1. TIÊU ĐỀ (dưới 100 ký tự)
2. SUBTITLE (dưới 150 ký tự)
3. DATELINE
4. ĐOẠN 1: LEAD (5W1H)
5. ĐOẠN 2: CHI TIẾT
6. QUOTE TỪ CEO
7. ĐOẠN 3: BỐI CẢNH
8. BOILERPLATE (giới thiệu công ty)
9. CONTACT INFO

ĐỘ DÀI: 400-600 từ.

ĐỊNH DẠNG:
- Chuẩn báo chí.`,
    long: true,
  },
  {
    id: 'mkt-16',
    cat: 'mkt',
    title: 'Viết content SEO blog',
    desc: 'Bài blog chuẩn SEO có từ khóa, headings, internal links.',
    tags: ['SEO', 'chi tiết'],
    prompt: `Viết bài blog chuẩn SEO về:

CHỦ ĐỀ: {{chủ đề}}
TỪ KHÓA CHÍNH: {{từ khóa}}
TỪ KHÓA PHỤ: {{từ khóa phụ}}
ĐỘ DÀI: {{số từ}} từ

YÊU CẦU:

1. TIÊU ĐỀ (dưới 60 ký tự)
2. META DESCRIPTION (dưới 160 ký tự)
3. BÀI VIẾT
   - H1, H2, H3 rõ ràng.
   - Từ khóa tự nhiên.
   - Internal links gợi ý.
   - External links.
   - Ảnh gợi ý (alt text).
4. FAQ SECTION
5. CTA
6. GHI CHÚ SEO
   - Keyword density.
   - Readability.

ĐỊNH DẠNG:
- Markdown rõ ràng.`,
    long: true,
  },
  {
    id: 'mkt-17',
    cat: 'mkt',
    title: 'Kế hoạch marketing 3 tháng',
    desc: 'Kế hoạch marketing tổng thể cho 3 tháng.',
    tags: ['kế hoạch', 'chi tiết'],
    prompt: `Lập kế hoạch marketing 3 tháng cho:

DOANH NGHIỆP: {{tên}}
SẢN PHẨM: {{sản phẩm}}
NGÂN SÁCH: {{ngân sách}}

YÊU CẦU:

1. MỤC TIÊU SMART
2. PHÂN TÍCH THỊ TRƯỜNG
   - Target audience.
   - Đối thủ.
3. CHIẾN LƯỢC TỔNG THỂ
   - Định vị.
   - USP.
4. KÊNH TIẾP CẬN
   - Facebook, TikTok, Google, Email...
5. LỊCH TRÌNH CHI TIẾT
   - Tháng 1, 2, 3.
   - Hoạt động từng tuần.
6. NGÂN SÁCH PHÂN BỔ
7. KPI & ĐO LƯỜNG

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'mkt-18',
    cat: 'mkt',
    title: 'Viết script bán hàng qua điện thoại',
    desc: 'Script gọi điện bán hàng, xử lý từ chối.',
    tags: ['sales', 'chi tiết'],
    prompt: `Viết script gọi điện bán hàng cho:

SẢN PHẨM: {{sản phẩm}}
ĐỐI TƯỢNG: {{đối tượng}}
MỤC TIÊU: {{mục tiêu}}

CẤU TRÚC:

1. MỞ ĐẦU (15s)
   - Chào hỏi.
   - Tự giới thiệu.
   - Lý do gọi.

2. XÁC ĐỊNH NHU CẦU (1 phút)
   - Câu hỏi khảo sát.
   - Lắng nghe.

3. GIỚI THIỆU SẢN PHẨM (2 phút)
   - 3 lợi ích chính.
   - Bằng chứng.

4. XỬ LÝ TỪ CHỐI (1-2 phút)
   - "Tôi đang bận" → ...
   - "Giá cao quá" → ...
   - "Để tôi suy nghĩ" → ...

5. CHỐT ĐƠN (1 phút)
   - CTA rõ ràng.
   - Xác nhận.

ĐỊNH DẠNG:
- Hội thoại mẫu.`,
    long: true,
  },
  {
    id: 'mkt-19',
    cat: 'mkt',
    title: 'Viết nội dung cho brochure / catalogue',
    desc: 'Content cho brochure, catalogue sản phẩm.',
    tags: ['brochure', 'chi tiết'],
    prompt: `Viết content cho brochure/catalogue của:

CÔNG TY: {{tên}}
SẢN PHẨM/DỊCH VỤ: {{danh sách}}
SỐ TRANG: {{số trang}}

YÊU CẦU:

1. TRANG BÌA
   - Tiêu đề.
   - Slogan.

2. TRANG GIỚI THIỆU
   - Về công ty (200 chữ).
   - Tầm nhìn, sứ mệnh.

3. TRANG SẢN PHẨM (mỗi SP 1 trang)
   - Tên.
   - Hình ảnh mô tả.
   - Đặc điểm (bullet).
   - Thông số.
   - Giá.

4. TRANG LIÊN HỆ
   - Địa chỉ.
   - SĐT, email.
   - Website, social.

ĐỊNH DẠNG:
- Đánh số trang.`,
    long: true,
  },
  {
    id: 'mkt-20',
    cat: 'mkt',
    title: 'Viết slogan / tagline',
    desc: '10 slogan cho thương hiệu, có phân tích.',
    tags: ['slogan', 'chi tiết'],
    prompt: `Viết 10 slogan/tagline cho:

THƯƠNG HIỆU: {{tên}}
NGÀNH: {{ngành}}
GIÁ TRỊ CỐT LÕI: {{giá trị}}

YÊU CẦU: 10 slogan theo các phong cách khác nhau.

1-3. NGẮN GỌN, DỄ NHỚ
4-6. CẢM XÚC, TRUYỀN CẢM HỨNG
7-9. LỢI ÍCH, CHỨC NĂNG
10. SÁNG TẠO, BẤT NGỜ

PHÂN TÍCH:
- Vì sao slogan này hiệu quả?
- Đối tượng phù hợp.
- Khuyến nghị chọn cái nào.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'mkt-21',
    cat: 'mkt',
    title: 'Viết content cho standee / poster',
    desc: 'Content standee, poster quảng cáo.',
    tags: ['poster', 'chi tiết'],
    prompt: `Viết content cho standee/poster quảng cáo:

SẢN PHẨM: {{sản phẩm}}
MỤC ĐÍCH: {{mục đích}}
KÍCH THƯỚC: {{kích thước}}

YÊU CẦU:

1. HEADLINE (dưới 10 từ)
   - Gây chú ý.
2. SUB-HEADLINE (dưới 20 từ)
3. 3 LỢI ÍCH CHÍNH (bullet, dưới 8 từ/ý)
4. HÌNH ẢNH MÔ TẢ
5. CTA (dưới 5 từ)
6. THÔNG TIN LIÊN HỆ
7. GHI CHÚ
   - Font chữ gợi ý.
   - Màu sắc.
   - Bố cục.

ĐỊNH DẠNG:
- Cấu trúc rõ ràng.`,
    long: true,
  },
  {
    id: 'mkt-22',
    cat: 'mkt',
    title: 'Kịch bản livestream bán hàng',
    desc: 'Kịch bản livestream 1 tiếng, có các block nội dung.',
    tags: ['livestream', 'chi tiết'],
    prompt: `Viết kịch bản livestream bán hàng 1 tiếng cho:

SẢN PHẨM: {{sản phẩm}}
NỀN TẢNG: {{Facebook / TikTok / Shopee Live}}
KHUYẾN MÃI: {{khuyến mãi}}

CẤU TRÚC:

1. WARM-UP (0-10 phút)
   - Chào hỏi.
   - Giới thiệu sản phẩm.
   - Tương tác.

2. GIỚI THIỆU SẢN PHẨM 1 (10-25 phút)
   - Demo.
   - Lợi ích.
   - Giá.
   - Chốt đơn.

3. GIỚI THIỆU SẢN PHẨM 2 (25-40 phút)
   - Tương tự.

4. FLASH SALE (40-55 phút)
   - Ưu đãi đặc biệt.
   - Countdown.
   - Chốt nhanh.

5. WRAP-UP (55-60 phút)
   - Cảm ơn.
   - Preview lần sau.

GHI CHÚ:
- Người dẫn, kịch bản.
- Tương tác mẫu.
- Câu chốt đơn.

ĐỊNH DẠNG:
- Bảng: Thời gian | Nội dung | Lời thoại mẫu.`,
    long: true,
  },
  {
    id: 'mkt-23',
    cat: 'mkt',
    title: 'Phân tích khách hàng mục tiêu',
    desc: 'Chân dung khách hàng, insight, hành vi.',
    tags: ['insight', 'chi tiết'],
    prompt: `Phân tích khách hàng mục tiêu cho:

SẢN PHẨM: {{sản phẩm}}
NGÀNH: {{ngành}}

YÊU CẦU:

1. CHÂN DUNG KHÁCH HÀNG
   - Nhân khẩu học (tuổi, giới tính, thu nhập, địa lý).
   - Tâm lý (sở thích, giá trị, lối sống).

2. INSIGHT
   - Pain point.
   - Mong muốn.
   - Nỗi sợ.

3. HÀNH VI MUA HÀNG
   - Khi nào mua?
   - Mua ở đâu?
   - Yếu tố quyết định?

4. HÀNH TRÌNH KHÁCH HÀNG
   - Awareness.
   - Consideration.
   - Decision.
   - Loyalty.

5. ĐỀ XUẤT
   - Cách tiếp cận.
   - Thông điệp.

ĐỊNH DẠNG:
- Bảng chân dung.`,
    long: true,
  },
  {
    id: 'mkt-24',
    cat: 'mkt',
    title: 'Viết FAQ cho website',
    desc: 'FAQ 10 câu hỏi thường gặp, có câu trả lời.',
    tags: ['FAQ', 'chi tiết'],
    prompt: `Viết FAQ cho website:

SẢN PHẨM/DỊCH VỤ: {{sản phẩm}}
ĐỐI TƯỢNG: {{đối tượng}}

YÊU CẦU: 10 câu hỏi thường gặp nhất.

PHÂN LOẠI:
1. Về sản phẩm (3 câu)
2. Về giá cả (2 câu)
3. Về giao hàng (2 câu)
4. Về thanh toán (1 câu)
5. Về bảo hành/đổi trả (2 câu)

VỚI MỖI FAQ:
- Câu hỏi rõ ràng.
- Câu trả lời ngắn gọn (50-100 chữ).
- Có ví dụ nếu cần.

ĐỊNH DẠNG:
- Câu hỏi in đậm.
- Câu trả lời bên dưới.`,
    long: true,
  },
  {
    id: 'mkt-25',
    cat: 'mkt',
    title: 'Content cho Google Maps post',
    desc: 'Bài đăng Google Maps (Post) hằng tuần.',
    tags: ['Google Maps', 'chi tiết'],
    prompt: `Viết 5 bài đăng Google Maps Post cho:

DOANH NGHIỆP: {{tên}}
LOẠI HÌNH: {{loại hình}}

YÊU CẦU: 5 bài theo các loại khác nhau.

1. BÀI KHUYẾN MÃI
   - Ưu đãi trong tuần.
   - CTA.

2. BÀI SẢN PHẨM MỚI
   - Giới thiệu sản phẩm.
   - Đặc điểm.

3. BÀI SỰ KIỆN
   - Sự kiện sắp diễn ra.
   - Thời gian, địa điểm.

4. BÀI HẬU TRƯỜNG
   - Hình ảnh quán.
   - Cảm xúc.

5. BÀI CẢM ƠN KHÁCH
   - Trích đánh giá.
   - Cảm ơn.

MỖI BÀI:
- Dưới 1500 ký tự.
- Có 1 hình ảnh mô tả.
- CTA rõ ràng.

ĐỊNH DẠNG:
- Mỗi bài trong block riêng.`,
    long: true,
  },
];