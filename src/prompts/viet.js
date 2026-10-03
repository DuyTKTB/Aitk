
export const VIET = [
  {
    id: 'viet-tom-tat',
    cat: 'viet',
    title: 'Tóm tắt văn bản dài',
    desc: 'Một câu cốt lõi, 5 ý chính và việc cần ghi nhớ, giữ nguyên số liệu. Có bản tóm tắt 1 đoạn.',
    tags: ['tóm tắt', 'chi tiết'],
    prompt: `Bạn là biên tập viên chuyên tóm tắt tài liệu học thuật. Hãy tóm tắt văn bản dưới đây cho học sinh {{lớp}}.

VĂN BẢN:
{{văn bản}}

YÊU CẦU:

1. TÓM TẮT 1 CÂU
   - Nêu ý cốt lõi trong 1 câu (dưới 30 từ).
   - Không dùng từ ngữ mơ hồ.

2. 5 Ý CHÍNH
   - Mỗi ý 1 dòng, đánh số 1-5.
   - Giữ nguyên số liệu, tên riêng, thuật ngữ.

3. 3 ĐIỀU CẦN GHI NHỚ
   - Ghi dạng gạch đầu dòng.

4. BẢN TÓM TẮT 1 ĐOẠN
   - Viết lại thành 1 đoạn văn liền mạch 100-150 từ.

5. CÂU HỎI MỞ
   - 2-3 câu hỏi gợi mở.

ĐỊNH DẠNG:
- Không thêm nhận xét cá nhân.
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'viet-dan-y',
    cat: 'viet',
    title: 'Lập dàn ý bài luận',
    desc: 'Luận điểm, ý chính kèm dẫn chứng gợi ý, mở bài và kết bài nháp. Có phản biện.',
    tags: ['dàn ý', 'chi tiết'],
    prompt: `Bạn là giáo viên Ngữ văn hướng dẫn học sinh {{lớp}} lập dàn ý bài luận.

THÔNG TIN:
- Loại bài: {{loại bài}}
- Chủ đề: "{{chủ đề}}"
- Độ dài: {{số từ}} từ

YÊU CẦU:

1. LUẬN ĐIỂM TRUNG TÂM
2. 3-4 Ý CHÍNH (tên ý, giải thích, dẫn chứng)
3. MỞ BÀI (nháp 3-4 câu)
4. KẾT BÀI (nháp 3-4 câu)
5. PHẢN BIỆN
6. GỢI Ý TỪ NGỮ

ĐỊNH DẠNG:
- Đánh số rõ ràng.
- Dàn ý dạng bullet.`,
    long: true,
  },
  {
    id: 'viet-viet-lai',
    cat: 'viet',
    title: 'Viết lại cho tự nhiên',
    desc: 'Hai phương án, giữ nguyên ý, nói rõ khác biệt giữa chúng. Có phân tích điểm yếu câu gốc.',
    tags: ['biên tập', 'chi tiết'],
    prompt: `Bạn là biên tập viên chuyên nghiệp. Viết lại đoạn văn sau cho tự nhiên hơn.

ĐOẠN VĂN GỐC:
{{đoạn văn}}

YÊU CẦU:

1. PHÂN TÍCH ĐOẠN GỐC
2. PHƯƠNG ÁN 1 — SỬA NHẸ
3. PHƯƠNG ÁN 2 — VIẾT LẠI THOÁNG
4. SO SÁNH 2 PHƯƠNG ÁN
5. GHI CHÚ BIÊN TẬP

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'viet-email',
    cat: 'viet',
    title: 'Email lịch sự gửi thầy cô',
    desc: 'Có tiêu đề, dưới 120 từ, lịch sự mà không rườm rà. Có gợi ý xử lý tình huống.',
    tags: ['email', 'chi tiết'],
    prompt: `Bạn là học sinh {{lớp}} viết email cho {{người nhận}}.

MỤC ĐÍCH: {{mục đích}}
BỐI CẢNH: {{bối cảnh}}

YÊU CẦU:

1. TIÊU ĐỀ EMAIL (dưới 10 từ)
2. NỘI DUNG (dưới 120 từ)
   - Lời chào, tự giới thiệu, mục đích, đề xuất, cảm ơn, chữ ký.
3. GIỌNG VĂN lịch sự
4. PHƯƠNG ÁN DỰ PHÒNG (email nhắc lại sau 3 ngày)
5. LƯU Ý (3 điều nên tránh)

ĐỊNH DẠNG:
- Đánh dấu Tiêu đề / Nội dung / Chữ ký.`,
    long: true,
  },
  {
    id: 'viet-05',
    cat: 'viet',
    title: 'Viết mở bài theo 5 cách',
    desc: '5 kiểu mở bài: trực tiếp, gián tiếp, phản đề, so sánh, đặt câu hỏi.',
    tags: ['mở bài', 'chi tiết'],
    prompt: `Viết 5 mở bài cho đề:

"{{đề bài}}"

YÊU CẦU: 5 cách khác nhau.

1. TRỰC TIẾP
2. GIÁN TIẾP
3. PHẢN ĐỀ
4. SO SÁNH
5. ĐẶT CÂU HỎI

ĐÁNH GIÁ:
- Ưu, nhược điểm mỗi cách.
- Cách nào phù hợp nhất.

ĐỊNH DẠNG:
- Mỗi mở bài 3-5 câu.`,
    long: true,
  },
  {
    id: 'viet-06',
    cat: 'viet',
    title: 'Viết kết bài theo 3 cách',
    desc: '3 kiểu kết bài: tóm tắt, mở rộng, liên hệ bản thân.',
    tags: ['kết bài', 'chi tiết'],
    prompt: `Viết 3 kết bài cho đề:

"{{đề bài}}"

YÊU CẦU:

1. KẾT BÀI TÓM TẮT (2-3 câu)
2. KẾT BÀI MỞ RỘNG
3. KẾT BÀI LIÊN HỆ BẢN THÂN

ĐÁNH GIÁ:
- Mỗi kết bài 3-5 câu.
- Cách nào phù hợp nhất.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'viet-07',
    cat: 'viet',
    title: 'Viết đoạn nghị luận 200 chữ',
    desc: 'Nghị luận xã hội có mở – thân – kết trong 200 chữ.',
    tags: ['nghị luận', 'chi tiết'],
    prompt: `Viết đoạn nghị luận xã hội 200 chữ về:

"{{chủ đề}}"

YÊU CẦU:

1. MỞ ĐOẠN (30-40 chữ)
2. THÂN ĐOẠN (120-140 chữ)
   - Giải thích, biểu hiện, dẫn chứng, phản biện.
3. KẾT ĐOẠN (30-40 chữ)

ĐỘ DÀI: đúng 200 chữ.

ĐỊNH DẠNG:
- Viết liền mạch.
- Đếm số chữ cuối bài.`,
    long: true,
  },
  {
    id: 'viet-08',
    cat: 'viet',
    title: 'Phân tích nhân vật văn học',
    desc: 'Phân tích nhân vật theo 5 khía cạnh, có dẫn chứng.',
    tags: ['phân tích', 'chi tiết'],
    prompt: `Phân tích nhân vật văn học:

NHÂN VẬT: {{nhân vật}}
TÁC PHẨM: {{tác phẩm}}

YÊU CẦU:

1. GIỚI THIỆU CHUNG
2. NGOẠI HÌNH VÀ LAI LỊCH
3. TÍNH CÁCH VÀ PHẨM CHẤT (3-5 nét + dẫn chứng)
4. SỐ PHẬN VÀ BI KỊCH
5. NGHỆ THUẬT XÂY DỰNG
6. ĐÁNH GIÁ CHUNG

ĐỊNH DẠNG:
- Trích dẫn cụ thể.
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'viet-09',
    cat: 'viet',
    title: 'Phân tích bài thơ',
    desc: 'Phân tích nội dung, nghệ thuật, cảm xúc chủ đạo.',
    tags: ['thơ', 'chi tiết'],
    prompt: `Phân tích bài thơ:

"{{bài thơ}}"
TÁC GIẢ: {{tác giả}}

YÊU CẦU:

1. GIỚI THIỆU (tác giả, hoàn cảnh)
2. NỘI DUNG (từng câu, khổ)
3. NGHỆ THUẬT (thể thơ, tu từ, ngôn ngữ)
4. ĐÁNH GIÁ CHUNG

ĐỊNH DẠNG:
- Trích dẫn thơ.`,
    long: true,
  },
  {
    id: 'viet-10',
    cat: 'viet',
    title: 'So sánh 2 tác phẩm',
    desc: 'So sánh điểm giống và khác giữa 2 tác phẩm.',
    tags: ['so sánh', 'chi tiết'],
    prompt: `So sánh 2 tác phẩm:

A: "{{tác phẩm A}}" — {{tác giả A}}
B: "{{tác phẩm B}}" — {{tác giả B}}

YÊU CẦU:

1. ĐIỂM GIỐNG
2. ĐIỂM KHÁC
3. BẢNG SO SÁNH
4. NHẬN XÉT
5. KẾT LUẬN

ĐỊNH DẠNG:
- Bảng dùng | và -.`,
    long: true,
  },
  {
    id: 'viet-11',
    cat: 'viet',
    title: 'Viết đoạn văn cảm nhận',
    desc: 'Đoạn văn cảm nhận về nhân vật, chi tiết, hoặc câu thơ.',
    tags: ['cảm nhận', 'chi tiết'],
    prompt: `Viết đoạn văn cảm nhận về:

{{đối tượng}} trong tác phẩm "{{tác phẩm}}"

YÊU CẦU:

1. MỞ ĐOẠN (1-2 câu)
2. THÂN ĐOẠN (8-12 câu)
   - Cảm nhận chi tiết.
   - Trích dẫn.
   - Cảm xúc cá nhân.
3. KẾT ĐOẠN (1-2 câu)

ĐỘ DÀI: 150-200 từ.

ĐỊNH DẠNG:
- Viết liền mạch.`,
    long: true,
  },
  {
    id: 'viet-12',
    cat: 'viet',
    title: 'Viết bài luận về một vấn đề',
    desc: 'Bài luận có luận điểm, dẫn chứng, phản biện.',
    tags: ['luận', 'chi tiết'],
    prompt: `Viết bài luận về:

"{{vấn đề}}"

ĐỘ DÀI: {{số từ}} từ
LOẠI: {{nghị luận xã hội / văn học}}

YÊU CẦU:

1. MỞ BÀI (dẫn dắt, nêu vấn đề)
2. THÂN BÀI (3-4 luận điểm + dẫn chứng)
3. PHẢN BIỆN
4. KẾT BÀI (tóm tắt, liên hệ)

ĐỊNH DẠNG:
- Chia đoạn rõ ràng.`,
    long: true,
  },
  {
    id: 'viet-13',
    cat: 'viet',
    title: 'Viết tiểu sử ngắn gọn',
    desc: 'Tiểu sử 200 chữ theo timeline.',
    tags: ['tiểu sử', 'chi tiết'],
    prompt: `Viết tiểu sử cho:

NHÂN VẬT: {{tên}}
LĨNH VỰC: {{lĩnh vực}}

YÊU CẦU:

1. THÔNG TIN CƠ BẢN
2. TIMELINE (5-7 mốc)
3. THÀNH TỰU NỔI BẬT (3-5)
4. CÂU NÓI ĐỂ LẠI
5. ẢNH HƯỞNG

ĐỘ DÀI: 200 chữ.

ĐỊNH DẠNG:
- Viết liền mạch.`,
    long: true,
  },
  {
    id: 'viet-14',
    cat: 'viet',
    title: 'Viết review sách / phim',
    desc: 'Review có tóm tắt, phân tích và đánh giá.',
    tags: ['review', 'chi tiết'],
    prompt: `Viết review cho:

TÁC PHẨM: "{{tên}}"
LOẠI: {{sách / phim / game}}

YÊU CẦU:

1. GIỚI THIỆU
2. TÓM TẮT NGẮN (không spoil)
3. ĐIỂM NỔI BẬT (3-5)
4. HẠN CHẾ (2-3)
5. ĐÁNH GIÁ (điểm 1-10)
6. CÂU KẾT

ĐỘ DÀI: 300-400 chữ.

ĐỊNH DẠNG:
- Tiêu đề rõ ràng.`,
    long: true,
  },
  {
    id: 'viet-15',
    cat: 'viet',
    title: 'Viết caption Facebook',
    desc: '5 caption cho 5 góc khác nhau.',
    tags: ['caption', 'chi tiết'],
    prompt: `Viết 5 caption Facebook về:

"{{chủ đề}}"

ĐỐI TƯỢNG: {{đối tượng}}

5 GÓC:
1. CÂU CHUYỆN
2. CHIA SẺ KIẾN THỨC
3. KHUYẾN KHÍCH
4. TƯƠNG TÁC
5. KHUYẾN MÃI

MỖI CAPTION: 50-80 từ + CTA + 2-3 hashtag.

ĐỊNH DẠNG:
- Mỗi caption cách 1 dòng.`,
    long: true,
  },
  {
    id: 'viet-16',
    cat: 'viet',
    title: 'Viết kịch bản video 60 giây',
    desc: 'Kịch bản video có hook, vấn đề, giải pháp, CTA.',
    tags: ['video', 'chi tiết'],
    prompt: `Viết kịch bản video 60 giây về:

"{{chủ đề}}"

NỀN TẢNG: {{TikTok / Reels / Shorts}}

YÊU CẦU:

1. HOOK (0-3s)
2. VẤN ĐỀ (3-15s)
3. GIẢI PHÁP (15-45s)
4. KẾT + CTA (45-60s)

GHI CHÚ:
- Nhạc nền.
- Chuyển cảnh.
- Text overlay.

ĐỊNH DẠNG:
- Bảng: Thời gian | Lời thoại | Hình ảnh | Chữ.`,
    long: true,
  },
  {
    id: 'viet-17',
    cat: 'viet',
    title: 'Viết content cho landing page',
    desc: 'Landing page có hero, features, testimonials, CTA.',
    tags: ['landing page', 'chi tiết'],
    prompt: `Viết content landing page cho:

SẢN PHẨM: {{sản phẩm}}
ĐỐI TƯỢNG: {{đối tượng}}

YÊU CẦU:

1. HERO SECTION
2. PAIN POINTS
3. SOLUTION
4. FEATURES
5. SOCIAL PROOF
6. PRICING
7. FAQ
8. FINAL CTA

ĐỊNH DẠNG:
- Tiêu đề rõ ràng.
- Ngắn gọn.`,
    long: true,
  },
  {
    id: 'viet-18',
    cat: 'viet',
    title: 'Sửa lỗi chính tả và ngữ pháp',
    desc: 'Chỉ ra lỗi, giải thích và sửa.',
    tags: ['biên tập', 'chi tiết'],
    prompt: `Sửa lỗi chính tả và ngữ pháp:

{{văn bản}}

YÊU CẦU:

1. LIỆT KÊ LỖI
   | STT | Lỗi | Loại | Sửa lại | Giải thích |
2. PHÂN TÍCH TỪNG LỖI
3. BẢN ĐÃ SỬA
4. LỖI PHỔ BIẾN

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'viet-19',
    cat: 'viet',
    title: 'Viết thơ 4 câu theo chủ đề',
    desc: 'Thơ 4 câu vần điệu, có 3 phiên bản.',
    tags: ['thơ', 'chi tiết'],
    prompt: `Viết thơ 4 câu về:

"{{chủ đề}}"

THỂ THƠ: {{lục bát / 4 chữ / tự do}}

YÊU CẦU: 3 phiên bản.

1. TẢ CẢNH
2. TẢ CẢM XÚC
3. TRIẾT LÝ

PHÂN TÍCH:
- Vần điệu.
- Hình ảnh.
- Cảm xúc.

ĐỊNH DẠNG:
- Mỗi bài cách 1 dòng.`,
    long: true,
  },
  {
    id: 'viet-20',
    cat: 'viet',
    title: 'Viết báo cáo khoa học',
    desc: 'Báo cáo khoa học có abstract, intro, method, result, discussion.',
    tags: ['báo cáo', 'chi tiết'],
    prompt: `Viết báo cáo khoa học:

CHỦ ĐỀ: "{{chủ đề}}"
LĨNH VỰC: {{lĩnh vực}}

YÊU CẦU:

1. ABSTRACT (100-150 từ)
2. INTRODUCTION (200-250 từ)
3. METHOD (150-200 từ)
4. RESULT (150-200 từ)
5. DISCUSSION (200-250 từ)
6. CONCLUSION (50-80 từ)
7. REFERENCES

ĐỊNH DẠNG:
- Văn phong khoa học.`,
    long: true,
  },
  {
    id: 'viet-21',
    cat: 'viet',
    title: 'Tóm tắt video YouTube',
    desc: 'Tóm tắt video 15 phút thành 200 chữ + timestamp.',
    tags: ['tóm tắt', 'chi tiết'],
    prompt: `Tóm tắt video YouTube:

TIÊU ĐỀ: "{{tiêu đề}}"
THỜI LƯỢNG: {{phút}} phút
NỘI DUNG: {{nội dung}}

YÊU CẦU:

1. TÓM TẮT 1 ĐOẠN (200 chữ)
2. 5 ĐIỂM CHÍNH
3. TIMESTAMPS (5-7 mốc)
4. TRÍCH DẪN HAY (2-3)
5. ĐÁNH GIÁ

ĐỊNH DẠNG:
- Timestamp mm:ss.`,
    long: true,
  },
  {
    id: 'viet-22',
    cat: 'viet',
    title: 'Viết content quảng cáo',
    desc: '5 mẫu quảng cáo đa nền tảng.',
    tags: ['quảng cáo', 'chi tiết'],
    prompt: `Viết content quảng cáo cho:

SẢN PHẨM: "{{sản phẩm}}"
ĐỐI TƯỢNG: "{{đối tượng}}"

YÊU CẦU:

1. FACEBOOK ADS
2. GOOGLE ADS
3. TIKTOK ADS
4. EMAIL MARKETING
5. SMS

MỖI MẪU:
- CTA rõ ràng.
- Có yếu tố khan hiếm.
- Có bằng chứng.

ĐỊNH DẠNG:
- Mỗi mẫu 1 section.`,
    long: true,
  },
  {
    id: 'viet-23',
    cat: 'viet',
    title: 'Viết bio LinkedIn',
    desc: 'Bio LinkedIn 3 phiên bản: ngắn, chuyên nghiệp, sáng tạo.',
    tags: ['bio', 'chi tiết'],
    prompt: `Viết bio LinkedIn cho:

TÊN: {{tên}}
VAI TRÒ: {{vai trò}}
KINH NGHIỆM: {{năm}} năm
CHUYÊN MÔN: {{chuyên môn}}

YÊU CẦU: 3 phiên bản.

1. NGẮN GỌN (150 ký tự)
2. CHUYÊN NGHIỆP (500 ký tự)
3. SÁNG TẠO (400 ký tự)

ĐỊNH DẠNG:
- Có số liệu cụ thể.`,
    long: true,
  },
  {
    id: 'viet-24',
    cat: 'viet',
    title: 'Viết kế hoạch kinh doanh',
    desc: 'Kế hoạch kinh doanh có executive summary, financials.',
    tags: ['kinh doanh', 'chi tiết'],
    prompt: `Viết kế hoạch kinh doanh:

Ý TƯỞNG: "{{ý tưởng}}"
VỐN: {{vốn}} triệu
THỊ TRƯỜNG: "{{thị trường}}"

YÊU CẦU:

1. EXECUTIVE SUMMARY
2. PHÂN TÍCH THỊ TRƯỜNG
3. SẢN PHẨM
4. CHIẾN LƯỢC MARKETING
5. KẾ HOẠCH TÀI CHÍNH
6. RỦI RO
7. LỘ TRÌNH

ĐỊNH DẠNG:
- Có bảng tài chính.`,
    long: true,
  },
  {
    id: 'viet-25',
    cat: 'viet',
    title: 'Viết cover letter xin việc',
    desc: 'Cover letter theo vị trí, có ví dụ thành tựu.',
    tags: ['xin việc', 'chi tiết'],
    prompt: `Viết cover letter cho:

VỊ TRÍ: "{{vị trí}}"
CÔNG TY: "{{công ty}}"
KINH NGHIỆM: {{kinh nghiệm}}
ĐIỂM MẠNH: {{điểm mạnh}}

YÊU CẦU:

1. MỞ ĐẦU (50-70 từ)
2. GIỚI THIỆU BẢN THÂN (80-100 từ)
3. VÌ SAO PHÙ HỢP (100-120 từ)
4. VÌ SAO CÔNG TY (50-70 từ)
5. KẾT (40-60 từ)

ĐỘ DÀI: dưới 400 từ.

ĐỊNH DẠNG:
- Chuẩn business letter.`,
    long: true,
  },
  {
    id: 'viet-26',
    cat: 'viet',
    title: 'Viết email marketing chuỗi 5',
    desc: 'Chuỗi 5 email từ chào mừng đến chốt đơn.',
    tags: ['email', 'chi tiết'],
    prompt: `Viết chuỗi 5 email marketing cho:

SẢN PHẨM: "{{sản phẩm}}"
ĐỐI TƯỢNG: "{{đối tượng}}"

YÊU CẦU:

1. EMAIL CHÀO MỪNG
2. EMAIL GIÁ TRỊ
3. EMAIL CASE STUDY
4. EMAIL XỬ LÝ PHẢN ĐỐI
5. EMAIL CHỐT ĐƠN

MỖI EMAIL:
- Subject line.
- Preview text.
- Body 150-200 chữ.
- 1 CTA.

ĐỊNH DẠNG:
- Subject line ghi đầu.`,
    long: true,
  },
  {
    id: 'viet-27',
    cat: 'viet',
    title: 'Tóm tắt sách 500 chữ',
    desc: 'Tóm tắt sách theo 5 phần.',
    tags: ['sách', 'chi tiết'],
    prompt: `Tóm tắt sách:

SÁCH: "{{tên sách}}"
TÁC GIẢ: "{{tác giả}}"

YÊU CẦU:

1. BỐI CẢNH (80 chữ)
2. 5 Ý CHÍNH (250 chữ)
3. TRÍCH DẪN HAY (50 chữ)
4. ĐÁNH GIÁ (80 chữ)
5. AI NÊN ĐỌC (40 chữ)

ĐỘ DÀI: 500 chữ.

ĐỊNH DẠNG:
- Có tiêu đề từng phần.`,
    long: true,
  },
  {
    id: 'viet-28',
    cat: 'viet',
    title: 'Viết script podcast 10 phút',
    desc: 'Script podcast có intro, 3 segment, outro.',
    tags: ['podcast', 'chi tiết'],
    prompt: `Viết script podcast 10 phút.

CHỦ ĐỀ: "{{chủ đề}}"
PHONG CÁCH: {{storytelling / phỏng vấn / độc thoại}}

YÊU CẦU:

1. INTRO (30s)
2. SEGMENT 1 (3 phút)
3. SEGMENT 2 (3 phút)
4. SEGMENT 3 (3 phút)
5. OUTRO (30s)

CHUNG:
- Câu chuyển tiếp.
- Không dùng từ học thuật.

ĐỊNH DẠNG:
- Ghi [Host], [Guest], [SFX].`,
    long: true,
  },
  {
    id: 'viet-29',
    cat: 'viet',
    title: 'Viết content cho khóa học',
    desc: 'Nội dung khóa học có module, bài học, bài tập.',
    tags: ['khóa học', 'chi tiết'],
    prompt: `Thiết kế content khóa học:

KHÓA HỌC: "{{tên khóa học}}"
ĐỐI TƯỢNG: "{{đối tượng}}"
THỜI LƯỢNG: {{số giờ}} giờ

YÊU CẦU:

1. MỤC TIÊU (5-7 kết quả)
2. MODULE STRUCTURE (4-6 module)
3. BÀI HỌC CHI TIẾT
4. BÀI TẬP CUỐI KHÓA
5. TÀI LIỆU BỔ SUNG

ĐỊNH DẠNG:
- Bảng nếu có thể.`,
    long: true,
  },
  {
    id: 'viet-30',
    cat: 'viet',
    title: 'Viết content cho brochure',
    desc: 'Content cho brochure, catalogue.',
    tags: ['brochure', 'chi tiết'],
    prompt: `Viết content brochure/catalogue cho:

CÔNG TY: {{tên}}
SẢN PHẨM: {{danh sách}}
SỐ TRANG: {{số trang}}

YÊU CẦU:

1. TRANG BÌA
2. TRANG GIỚI THIỆU (200 chữ)
3. TRANG SẢN PHẨM (mỗi SP 1 trang)
4. TRANG LIÊN HỆ

ĐỊNH DẠNG:
- Đánh số trang.`,
    long: true,
  },
];