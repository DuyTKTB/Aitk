
export const VIDEO = [
  {
    id: 'vd-01',
    cat: 'video',
    title: 'Quay sản phẩm điện ảnh (5 giây)',
    desc: 'Cảnh máy lia chậm vào sản phẩm với hạt bụi sáng lơ lửng. Có thông số camera.',
    tags: ['sản phẩm', 'chi tiết'],
    prompt: `Slow dolly-in on {{product}} placed on {{surface}}.

CAMERA MOVEMENT: smooth slow dolly-in from medium shot to close-up, 5 seconds duration, gimbal-stabilized, no shake.

LIGHTING: soft backlight creating a rim around the product, warm key light from the left, subtle fill from the right, floating dust particles catching the light.

DEPTH OF FIELD: shallow (f/2.8), focus racking from front to back slowly.

ATMOSPHERE: minimal, clean, premium.

STYLE: commercial product video, Apple/Nike aesthetic.

TECHNICAL:
- 5 seconds
- 16:9 aspect ratio
- 24fps
- 4K resolution
- smooth motion

NEGATIVE: no shaky camera, no zoom, no quick cuts, no text overlay, no people.`,
    sample: 'Slow dolly-in on a glass of iced coffee on a marble table, soft backlight rimming the condensation drops, floating dust particles catching warm light, shallow depth of field, Apple commercial aesthetic…',
    long: true,
  },
  {
    id: 'vd-02',
    cat: 'video',
    title: 'Cận cảnh phản ứng hóa học (macro)',
    desc: 'Đổi màu, sủi bọt trong cốc thủy tinh, quay chậm.',
    tags: ['hóa học', 'chi tiết'],
    prompt: `Macro shot of {{reaction}} in a glass beaker.

ACTION:
- Vivid color change from {{color 1}} to {{color 2}}
- Bubbles rising continuously
- Subtle temperature change visible
- Precipitate forming if applicable

CAMERA: macro lens 100mm, very shallow depth of field (f/4), slow motion (120fps → 24fps), slight push-in.

LIGHTING: dark laboratory background, dramatic side lighting, soft reflections on glass, backlight for bubbles.

STYLE: scientific documentary, BBC Earth quality.

TECHNICAL: 8 seconds, 16:9, slow motion, 4K.

NEGATIVE: no fake CGI bubbles, no unnatural colors, no shaky camera.`,
    long: true,
  },
  {
    id: 'vd-03',
    cat: 'video',
    title: 'Kịch bản quảng cáo 15 giây',
    desc: '3 cảnh có góc máy, chữ trên màn hình và prompt cho từng cảnh.',
    tags: ['quảng cáo', 'chi tiết'],
    prompt: `Viết kịch bản quảng cáo 15 giây cho {{loại quán}} tại {{địa điểm}}.

SẢN PHẨM: {{sản phẩm chính}}
ĐỐI TƯỢNG: {{đối tượng khách}}
THÔNG ĐIỆP: {{thông điệp}}

CẤU TRÚC 3 CẢNH (mỗi cảnh 5 giây):

CẢNH 1 — HOOK (0-5s)
- Góc máy: [...]
- Hành động: [...]
- Chữ trên màn hình: [tối đa 6 từ]
- Âm thanh: [...]
- Prompt tiếng Anh cho AI video: [...]

CẢNH 2 — VẤN ĐỀ + GIẢI PHÁP (5-10s)
- Tương tự.

CẢNH 3 — CTA (10-15s)
- Tương tự, bao gồm địa chỉ/SĐT.

GHI CHÚ:
- Nhạc nền gợi ý.
- Màu sắc chủ đạo.
- Phong cách tổng thể.
- 3 lỗi cần tránh.

ĐỊNH DẠNG:
- Bảng: Thời gian | Lời thoại | Hình ảnh | Chữ.`,
    long: true,
  },
  {
    id: 'vd-04',
    cat: 'video',
    title: 'Kịch bản TikTok 30 giây',
    desc: 'Hook 3 giây, vấn đề, giải pháp, bằng chứng, CTA.',
    tags: ['TikTok', 'chi tiết'],
    prompt: `Viết kịch bản TikTok 30 giây cho {{sản phẩm hoặc dịch vụ}}.

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
- Nhạc nền gợi ý.
- 5-7 hashtag.
- Giọng điệu.
- 3 lỗi cần tránh.

ĐỊNH DẠNG:
- Bảng: Thời gian | Lời thoại | Hình ảnh | Chữ.`,
    long: true,
  },
  {
    id: 'vd-05',
    cat: 'video',
    title: 'Kịch bản YouTube 10 phút',
    desc: 'Kịch bản YouTube dài có intro, 3 segment, outro.',
    tags: ['YouTube', 'chi tiết'],
    prompt: `Viết kịch bản YouTube 10 phút về chủ đề:

"{{chủ đề}}"

ĐỐI TƯỢNG: {{đối tượng}}
PHONG CÁCH: {{phong cách}}

CẤU TRÚC:

1. INTRO (30 giây)
   - Hook gây tò mò.
   - Giới thiệu nội dung.
   - Teaser các phần.

2. SEGMENT 1 (3 phút)
   - Vấn đề 1.
   - Ví dụ cụ thể.
   - Bài học.

3. SEGMENT 2 (3 phút)
   - Vấn đề 2.
   - 3-5 tips.
   - Ví dụ.

4. SEGMENT 3 (3 phút)
   - Vấn đề 3 (nâng cao).
   - Kinh nghiệm thực tế.

5. OUTRO (30 giây)
   - Tóm tắt.
   - CTA: like, subscribe.
   - Teaser tập sau.

GHI CHÚ:
- Câu chuyển tiếp.
- B-roll gợi ý.
- Text overlay.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'vd-06',
    cat: 'video',
    title: 'Video giới thiệu sản phẩm 30 giây',
    desc: 'Video giới thiệu sản phẩm có vấn đề, giải pháp, tính năng, CTA.',
    tags: ['sản phẩm', 'chi tiết'],
    prompt: `Viết kịch bản video giới thiệu sản phẩm 30 giây.

SẢN PHẨM: {{tên sản phẩm}}
ĐẶC ĐIỂM: {{đặc điểm chính}}
ĐỐI TƯỢNG: {{đối tượng}}

CẤU TRÚC:

1. VẤN ĐỀ (0-5s)
   - Nêu pain point.
2. GIẢI PHÁP (5-10s)
   - Giới thiệu sản phẩm.
3. TÍNH NĂNG (10-22s)
   - 3 tính năng chính.
   - Mỗi tính năng: text + visual.
4. BẰNG CHỨNG (22-26s)
   - Review, số liệu.
5. CTA (26-30s)
   - Mua ngay / tìm hiểu thêm.

ĐỊNH DẠNG:
- Bảng: Thời gian | Lời thoại | Hình ảnh | Chữ.`,
    long: true,
  },
  {
    id: 'vd-07',
    cat: 'video',
    title: 'Video tutorial / hướng dẫn',
    desc: 'Kịch bản video hướng dẫn có bước rõ ràng.',
    tags: ['tutorial', 'chi tiết'],
    prompt: `Viết kịch bản video tutorial về:

"{{chủ đề}}"

THỜI LƯỢNG: {{phút}} phút
TRÌNH ĐỘ NGƯỜI XEM: {{trình độ}}

CẤU TRÚC:

1. INTRO (30s)
   - Giới thiệu chủ đề.
   - Kết quả cuối cùng.
   - Yêu cầu chuẩn bị.

2. BƯỚC 1..N (mỗi bước 1-2 phút)
   - Tiêu đề bước.
   - Hành động cụ thể.
   - Lưu ý.
   - Hình ảnh minh họa.

3. KẾT QUẢ CUỐI
   - Cho xem thành phẩm.

4. TROUBLESHOOTING
   - 3 lỗi thường gặp + cách sửa.

5. OUTRO
   - Tóm tắt.
   - CTA.

ĐỊNH DẠNG:
- Đánh số bước.`,
    long: true,
  },
  {
    id: 'vd-08',
    cat: 'video',
    title: 'Video storytelling cảm xúc',
    desc: 'Kịch bản video kể chuyện cảm xúc, có 3 hồi.',
    tags: ['storytelling', 'chi tiết'],
    prompt: `Viết kịch bản video storytelling cảm xúc về:

"{{câu chuyện}}"

ĐỘ DÀI: {{phút}} phút

CẤU TRÚC 3 HỒI:

1. HỒI 1 — SETUP (30%)
   - Giới thiệu nhân vật, bối cảnh.
   - Tình huống bình thường.
2. HỒI 2 — CONFLICT (40%)
   - Biến cố xảy ra.
   - Nhân vật đối mặt khó khăn.
3. HỒI 3 — RESOLUTION (30%)
   - Nhân vật vượt qua.
   - Bài học, thông điệp.

GHI CHÚ:
- Âm nhạc gợi ý cho từng hồi.
- Cảnh quay chính.
- Lời thoại mẫu.

ĐỊNH DẠNG:
- Đánh số hồi rõ ràng.`,
    long: true,
  },
  {
    id: 'vd-09',
    cat: 'video',
    title: 'Kịch bản podcast',
    desc: 'Script podcast 10 phút có intro, 3 segment, outro.',
    tags: ['podcast', 'chi tiết'],
    prompt: `Viết script podcast 10 phút.

CHỦ ĐỀ: "{{chủ đề}}"
PHONG CÁCH: {{storytelling / phỏng vấn / độc thoại}}

CẤU TRÚC:

1. INTRO (30s)
   - Hook.
   - Giới thiệu host.
   - Nêu chủ đề và lợi ích.

2. SEGMENT 1 (3 phút)
   - Vấn đề 1 + câu chuyện.

3. SEGMENT 2 (3 phút)
   - Vấn đề 2 + 3 tips.

4. SEGMENT 3 (3 phút)
   - Vấn đề 3 + kinh nghiệm.

5. OUTRO (30s)
   - Tóm tắt.
   - CTA: đăng ký, đánh giá.
   - Teaser tập sau.

ĐỊNH DẠNG:
- Ghi rõ [Host], [Guest], [SFX].`,
    long: true,
  },
  {
    id: 'vd-10',
    cat: 'video',
    title: 'Video slideshow từ ảnh',
    desc: 'Video slideshow có hiệu ứng, nhạc nền, chữ.',
    tags: ['slideshow', 'chi tiết'],
    prompt: `Viết kịch bản video slideshow từ ảnh.

MỤC ĐÍCH: {{mục đích}}
SỐ ẢNH: {{số ảnh}}
THỜI LƯỢNG: {{thời lượng}} giây

CẤU TRÚC:

1. ẢNH MỞ ĐẦU (0-3s)
   - Ảnh: [...]
   - Hiệu ứng: [...]
   - Chữ: [...]
   - Nhạc: [...]

2. CÁC ẢNH GIỮA (mỗi ảnh 3-5s)
   - Tương tự.

3. ẢNH KẾT (cuối)
   - CTA.
   - Logo.

GHI CHÚ:
- Nhạc nền.
- Hiệu ứng chuyển cảnh.
- Font chữ.
- Tốc độ chuyển.

ĐỊNH DẠNG:
- Bảng: Thời gian | Ảnh | Hiệu ứng | Chữ.`,
    long: true,
  },
  {
    id: 'vd-11',
    cat: 'video',
    title: 'Video review sản phẩm',
    desc: 'Video review chân thực, có ưu nhược điểm.',
    tags: ['review', 'chi tiết'],
    prompt: `Viết kịch bản video review sản phẩm.

SẢN PHẨM: {{tên}}
THỜI LƯỢNG: {{phút}} phút
PHONG CÁCH: {{chân thực / hài hước / chuyên nghiệp}}

CẤU TRÚC:

1. INTRO (15s)
   - Giới thiệu sản phẩm.
   - Lý do review.

2. UNBOXING (30s-1 phút)
   - Mở hộp.
   - Ấn tượng đầu.

3. TRẢI NGHIỆM (2-4 phút)
   - Sử dụng thực tế.
   - Ưu điểm (3-5).
   - Nhược điểm (2-3).

4. SO SÁNH (1 phút)
   - Với sản phẩm cùng loại.

5. KẾT LUẬN (30s)
   - Có đáng mua không?
   - Đối tượng phù hợp.
   - Điểm số.

ĐỊNH DẠNG:
- Bảng: Phần | Thời gian | Nội dung.`,
    long: true,
  },
  {
    id: 'vd-12',
    cat: 'video',
    title: 'Video dạy học (educational)',
    desc: 'Video dạy học có mục tiêu, nội dung, bài tập.',
    tags: ['giáo dục', 'chi tiết'],
    prompt: `Viết kịch bản video dạy học về:

"{{chủ đề}}"

LỚP: {{lớp}}
THỜI LƯỢNG: {{phút}} phút

CẤU TRÚC:

1. MỤC TIÊU (30s)
   - Sau video, học sinh biết gì?

2. KHỞI ĐỘNG (1 phút)
   - Câu hỏi gợi mở.
   - Ví dụ thực tế.

3. NỘI DUNG CHÍNH (5-8 phút)
   - Chia 3-5 phần.
   - Mỗi phần có ví dụ.
   - Hình ảnh minh họa.

4. BÀI TẬP MẪU (2 phút)
   - Giải 1-2 bài.

5. TÓM TẮT (30s)

6. BÀI TẬP VỀ NHÀ (30s)

ĐỊNH DẠNG:
- Đánh số phần.`,
    long: true,
  },
  {
    id: 'vd-13',
    cat: 'video',
    title: 'Video viral (meme, hài)',
    desc: 'Kịch bản video viral hài hước, có twist bất ngờ.',
    tags: ['viral', 'chi tiết'],
    prompt: `Viết kịch bản video viral (hài) về:

"{{chủ đề}}"

THỜI LƯỢNG: {{giây}} giây
NỀN TẢNG: {{TikTok / Reels / Shorts}}

CẤU TRÚC:

1. SETUP (0-5s)
   - Tình huống bình thường.

2. BUILD UP (5-10s)
   - Xây dựng kỳ vọng.

3. TWIST (10-13s)
   - Bất ngờ, hài hước.

4. PAYOFF (13-15s)
   - Kết thúc bất ngờ.

GHI CHÚ:
- Nhạc trending.
- Text overlay.
- Sound effect.

ĐỊNH DẠNG:
- Bảng: Thời gian | Hình ảnh | Âm thanh.`,
    long: true,
  },
  {
    id: 'vd-14',
    cat: 'video',
    title: 'Video so sánh A vs B',
    desc: 'Video so sánh 2 sản phẩm / khái niệm.',
    tags: ['so sánh', 'chi tiết'],
    prompt: `Viết kịch bản video so sánh:

A: {{đối tượng A}}
B: {{đối tượng B}}

THỜI LƯỢNG: {{phút}} phút

CẤU TRÚC:

1. INTRO (30s)
   - Giới thiệu A và B.
   - Tiêu chí so sánh.

2. TIÊU CHÍ 1 (1-2 phút)
   - A như thế nào?
   - B như thế nào?
   - Kết luận.

3. TIÊU CHÍ 2..N (tương tự)

4. BẢNG SO SÁNH (30s)
   - Tổng hợp.

5. KẾT LUẬN (30s)
   - Cái nào tốt hơn cho ai?
   - Điểm số.

ĐỊNH DẠNG:
- Bảng so sánh rõ ràng.`,
    long: true,
  },
  {
    id: 'vd-15',
    cat: 'video',
    title: 'Video unboxing',
    desc: 'Kịch bản unboxing sản phẩm mới, cảm xúc chân thực.',
    tags: ['unboxing', 'chi tiết'],
    prompt: `Viết kịch bản video unboxing sản phẩm.

SẢN PHẨM: {{tên}}
THỜI LƯỢNG: {{phút}} phút

CẤU TRÚC:

1. INTRO (15s)
   - Sản phẩm gì?
   - Vì sao mua?
   - Mong đợi.

2. MỞ HỘP (1-2 phút)
   - Mở từng lớp.
   - Phản ứng chân thực.
   - Cận cảnh chi tiết.

3. ĐÁNH GIÁ NHANH (1 phút)
   - Ấn tượng đầu tiên.
   - Chất lượng đóng gói.
   - Phụ kiện.

4. TEST NHANH (1 phút)
   - Dùng thử lần đầu.

5. KẾT (30s)
   - Sẽ review chi tiết sau.
   - CTA subscribe.

ĐỊNH DẠNG:
- Bảng: Thời gian | Hành động | Lời thoại.`,
    long: true,
  },
  {
    id: 'vd-16',
    cat: 'video',
    title: 'Video behind the scenes',
    desc: 'Kịch bản video hậu trường, khoe quy trình làm việc.',
    tags: ['behind', 'chi tiết'],
    prompt: `Viết kịch bản video behind the scenes về:

"{{quy trình / sự kiện}}"

THỜI LƯỢNG: {{phút}} phút

CẤU TRÚC:

1. INTRO (15s)
   - Giới thiệu quy trình.
   - Hứa hẹn điều thú vị.

2. CÁC CẢNH HẬU TRƯỜNG (5-8 phút)
   - Cảnh 1: chuẩn bị.
   - Cảnh 2: thực hiện.
   - Cảnh 3: hoàn thiện.
   - Cảnh 4: kết quả.

3. PHỎNG VẤN NGẮN (1 phút)
   - Hỏi người tham gia.

4. OUTRO (15s)
   - Cảm ơn.
   - CTA.

ĐỊNH DẠNG:
- Đánh số cảnh.`,
    long: true,
  },
  {
    id: 'vd-17',
    cat: 'video',
    title: 'Video top N',
    desc: 'Kịch bản video đếm ngược top N.',
    tags: ['top', 'chi tiết'],
    prompt: `Viết kịch bản video Top {{N}}:

CHỦ ĐỀ: "{{chủ đề}}"
THỜI LƯỢNG: {{phút}} phút

CẤU TRÚC:

1. INTRO (30s)
   - Giới thiệu chủ đề.
   - Tiêu chí xếp hạng.
   - Hook: "Số 1 sẽ khiến bạn bất ngờ!"

2. SỐ N → 3 (mỗi số 30-45s)
   - Số N: thông tin cơ bản.
   - Số N-1: ...
   - Lý do xếp hạng.

3. SỐ 2 (1 phút)
   - Chi tiết hơn.
   - Lý do suýt top 1.

4. SỐ 1 (1-2 phút)
   - Phân tích chi tiết.
   - Vì sao top 1.

5. OUTRO (30s)
   - Tóm tắt.
   - CTA comment ý kiến.

ĐỊNH DẠNG:
- Đếm ngược.`,
    long: true,
  },
  {
    id: 'vd-18',
    cat: 'video',
    title: 'Video Q&A',
    desc: 'Kịch bản video trả lời câu hỏi khán giả.',
    tags: ['Q&A', 'chi tiết'],
    prompt: `Viết kịch bản video Q&A.

CHỦ ĐỀ: "{{chủ đề}}"
SỐ CÂU HỎI: {{N}}

CẤU TRÚC:

1. INTRO (30s)
   - Cảm ơn câu hỏi.
   - Giới thiệu.

2. CÂU HỎI 1 (1-2 phút)
   - Câu hỏi: ...
   - Trả lời: ...
   - Ví dụ minh họa.

3. CÂU HỎI 2..N (tương tự)

4. OUTRO (30s)
   - Tóm tắt.
   - CTA gửi câu hỏi tiếp theo.

ĐỊNH DẠNG:
- Đánh số câu hỏi.`,
    long: true,
  },
  {
    id: 'vd-19',
    cat: 'video',
    title: 'Kịch bản video 60 giây',
    desc: 'Kịch bản video 60 giây có hook, vấn đề, giải pháp, CTA.',
    tags: ['60s', 'chi tiết'],
    prompt: `Viết kịch bản video 60 giây về:

"{{chủ đề}}"

NỀN TẢNG: {{TikTok / Reels / Shorts}}

CẤU TRÚC:

1. HOOK (0-3s)
   - Câu nói gây tò mò.
   - Hình ảnh bắt mắt.

2. VẤN ĐỀ (3-15s)
   - Nêu vấn đề.
   - Đồng cảm.

3. GIẢI PHÁP (15-45s)
   - 3-5 bước.
   - Mỗi bước: visual + text.

4. KẾT + CTA (45-60s)
   - Tóm tắt nhanh.
   - CTA theo dõi/comment.

CHI TIẾT:
- Nhạc nền.
- Chuyển cảnh.
- Text overlay.

ĐỊNH DẠNG:
- Bảng: Thời gian | Lời thoại | Hình ảnh | Chữ.`,
    long: true,
  },
  {
    id: 'vd-20',
    cat: 'video',
    title: 'Video giới thiệu kênh',
    desc: 'Video giới thiệu kênh YouTube/TikTok cá nhân.',
    tags: ['kênh', 'chi tiết'],
    prompt: `Viết kịch bản video giới thiệu kênh của tôi.

TÊN KÊNH: {{tên kênh}}
CHỦ ĐỀ KÊNH: {{chủ đề}}
PHONG CÁCH: {{phong cách}}
THỜI LƯỢNG: 60-90 giây

CẤU TRÚC:

1. HOOK (0-5s)
   - Câu nói gây ấn tượng.

2. GIỚI THIỆU BẢN THÂN (5-20s)
   - Tên, tuổi, nghề.
   - Đam mê.

3. NỘI DUNG KÊNH (20-50s)
   - Kênh sẽ chia sẻ về gì?
   - Lợi ích cho người xem.
   - Tần suất đăng bài.

4. CTA (50-70s)
   - Mời subscribe.
   - Bật thông báo.
   - Theo dõi các kênh khác.

5. TEASER (70-90s)
   - Video sắp ra mắt.

GHI CHÚ:
- Nhạc nền.
- B-roll.
- Logo kênh.

ĐỊNH DẠNG:
- Đánh số phần.`,
    long: true,
  },
];