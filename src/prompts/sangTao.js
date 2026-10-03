
export const SANG_TAO = [
  {
    id: 'st-01',
    cat: 'sangtao',
    title: 'Viết truyện ngắn 500 chữ',
    desc: 'Truyện ngắn có mở – thân – kết, nhân vật và thông điệp.',
    tags: ['truyện', 'chi tiết'],
    prompt: `Viết truyện ngắn 500 chữ theo chủ đề:

"{{chủ đề}}"

THỂ LOẠI: {{thể loại}}
GIỌNG VĂN: {{giọng văn}}
NHÂN VẬT CHÍNH: {{nhân vật}}

YÊU CẦU:

1. CẤU TRÚC
   - Mở: giới thiệu nhân vật, bối cảnh (100 chữ).
   - Thân: biến cố, xung đột (250 chữ).
   - Kết: giải quyết, thông điệp (150 chữ).

2. NHÂN VẬT
   - Ngoại hình, tính cách.
   - Động cơ hành động.

3. KHÔNG KHÍ
   - Miêu tả cảm xúc, không gian.

4. THÔNG ĐIỆP
   - Bài học hoặc suy ngẫm.

ĐỊNH DẠNG:
- Chia đoạn rõ ràng.
- Có đối thoại (nếu cần).`,
    sample: 'Cô bé nhặt được chiếc kính cũ bên vệ đường. Khi đeo vào, cô nhìn thấy những điều người khác không thấy: nỗi buồn sau nụ cười, vết thương sau lớp áo…',
    long: true,
  },
  {
    id: 'st-02',
    cat: 'sangtao',
    title: 'Viết thơ 4 câu theo chủ đề',
    desc: 'Thơ 4 câu vần điệu, có hình ảnh và cảm xúc. Có 3 phiên bản.',
    tags: ['thơ', 'chi tiết'],
    prompt: `Viết thơ 4 câu theo chủ đề:

"{{chủ đề}}"

THỂ THƠ: {{lục bát / 4 chữ / 5 chữ / tự do}}

YÊU CẦU: 3 phiên bản.

1. BÀI THƠ 1 — TẢ CẢNH
   - 4 câu.
   - 2-3 hình ảnh thiên nhiên.
   - Không dùng từ hoa mỹ.

2. BÀI THƠ 2 — TẢ CẢM XÚC
   - 4 câu.
   - Cảm xúc cá nhân.
   - 1-2 câu hỏi tu từ.

3. BÀI THƠ 3 — TRIẾT LÝ
   - 4 câu.
   - Suy ngẫm cuộc sống.
   - Câu kết gây ấn tượng.

PHÂN TÍCH:
- Vần điệu từng bài.
- Hình ảnh đặc sắc.
- Cảm xúc chủ đạo.

ĐỊNH DẠNG:
- Mỗi bài cách nhau 1 dòng.`,
    long: true,
  },
  {
    id: 'st-03',
    cat: 'sangtao',
    title: 'Brainstorm 20 ý tưởng',
    desc: '20 ý tưởng cho dự án, có đánh giá và chọn lọc.',
    tags: ['brainstorm', 'chi tiết'],
    prompt: `Brainstorm 20 ý tưởng cho:

DỰ ÁN: {{dự án}}
MỤC TIÊU: {{mục tiêu}}
GIỚI HẠN: {{giới hạn}}

YÊU CẦU:

1. 20 Ý TƯỞNG
   - Mỗi ý tưởng 1-2 câu.
   - Đa dạng: táo bạo, thực tế, kỳ quặc.

2. PHÂN LOẠI
   - Nhóm theo chủ đề.
   - Đánh dấu độ khả thi (1-5).

3. TOP 5 Ý TƯỞNG
   - Chi tiết hơn.
   - Lý do chọn.

4. Ý TƯỞNG ĐIÊN RỒ NHẤT
   - Có thể là đột phá.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'st-04',
    cat: 'sangtao',
    title: 'Viết kịch bản phim ngắn',
    desc: 'Kịch bản phim ngắn 5-10 phút có phân cảnh.',
    tags: ['kịch bản', 'chi tiết'],
    prompt: `Viết kịch bản phim ngắn:

CHỦ ĐỀ: {{chủ đề}}
THỜI LƯỢNG: 5-10 phút
THỂ LOẠI: {{thể loại}}

YÊU CẦU:

1. LOGLINE (1 câu)
2. NHÂN VẬT
3. BỐI CẢNH
4. CẤU TRÚC PHÂN CẢNH
   - Cảnh 1: thiết lập.
   - Cảnh 2: biến cố.
   - Cảnh 3: cao trào.
   - Cảnh 4: giải quyết.

MỖI CẢNH:
- Địa điểm, thời gian.
- Hành động.
- Lời thoại.
- Góc máy gợi ý.

ĐỊNH DẠNG:
- Chuẩn kịch bản phim.`,
    long: true,
  },
  {
    id: 'st-05',
    cat: 'sangtao',
    title: 'Viết slogan sáng tạo',
    desc: '10 slogan sáng tạo, có phân tích.',
    tags: ['slogan', 'chi tiết'],
    prompt: `Viết 10 slogan sáng tạo cho:

THƯƠNG HIỆU: {{tên}}
NGÀNH: {{ngành}}
GIÁ TRỊ: {{giá trị}}

YÊU CẦU: 10 slogan theo phong cách khác nhau.

1-3. NGẮN GỌN, DỄ NHỚ
4-6. CẢM XÚC
7-9. LÝ TRÍ
10. GÂY SỐC

PHÂN TÍCH:
- Slogan nào hiệu quả nhất?
- Đối tượng phù hợp.
- Rủi ro (nếu có).

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'st-06',
    cat: 'sangtao',
    title: 'Viết caption Instagram sáng tạo',
    desc: '5 caption sáng tạo, có câu chuyện và cảm xúc.',
    tags: ['Instagram', 'chi tiết'],
    prompt: `Viết 5 caption Instagram sáng tạo cho:

CHỦ ĐỀ: {{chủ đề}}
ĐỐI TƯỢNG: {{đối tượng}}
PHONG CÁCH: {{sáng tạo}}

YÊU CẦU: 5 góc tiếp cận.

1. STORYTELLING
2. HÀI HƯỚC
3. CẢM HỨNG
4. TƯƠNG TÁC
5. TỐI GIẢN

MỖI CAPTION:
- 100-150 chữ.
- 10-15 hashtag.
- Emoji hợp lý.

ĐỊNH DẠNG:
- Mỗi caption trong block riêng.`,
    long: true,
  },
  {
    id: 'st-07',
    cat: 'sangtao',
    title: 'Viết kịch bản hài',
    desc: 'Kịch bản hài 2 phút, có twist.',
    tags: ['hài', 'chi tiết'],
    prompt: `Viết kịch bản hài 2 phút về:

"{{chủ đề}}"

PHONG CÁCH: {{nhẹ nhàng / châm biếm / slapstick}}

YÊU CẦU:

1. SETUP (30s)
   - Nhân vật, tình huống.
2. BUILD UP (45s)
   - Xây dựng kỳ vọng.
3. TWIST (30s)
   - Bất ngờ.
4. PAYOFF (15s)
   - Kết thúc hài.

GHI CHÚ:
- Nhân vật.
- Cử chỉ.
- Sound effect.
- Timing.

ĐỊNH DẠNG:
- Bảng: Thời gian | Hành động | Lời thoại.`,
    long: true,
  },
  {
    id: 'st-08',
    cat: 'sangtao',
    title: 'Thiết kế nhân vật',
    desc: 'Thiết kế nhân vật sáng tạo có backstory.',
    tags: ['nhân vật', 'chi tiết'],
    prompt: `Thiết kế nhân vật cho:

DỰ ÁN: {{dự án}}
THỂ LOẠI: {{thể loại}}
VAI TRÒ: {{vai trò}}

YÊU CẦU:

1. TÊN VÀ DANH TÍNH
   - Tên, biệt danh.
   - Tuổi, giới tính.
2. NGOẠI HÌNH
   - Chiều cao, cân nặng.
   - Trang phục, phụ kiện.
3. TÍNH CÁCH
   - 3-5 điểm mạnh.
   - 2-3 điểm yếu.
   - Sở thích, thói quen.
4. BACKSTORY
   - Xuất thân.
   - Biến cố tuổi thơ.
   - Động cơ hiện tại.
5. MỐI QUAN HỆ
6. CHARACTER ARC
7. CÂU NÓI ĐẶC TRƯNG

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'st-09',
    cat: 'sangtao',
    title: 'Viết mô tả thế giới giả tưởng',
    desc: 'Xây dựng thế giới giả tưởng có luật lệ riêng.',
    tags: ['worldbuilding', 'chi tiết'],
    prompt: `Xây dựng thế giới giả tưởng:

LOẠI: {{fantasy / sci-fi / dystopia}}
ĐẶC ĐIỂM CHÍNH: {{đặc điểm}}

YÊU CẦU:

1. ĐỊA LÝ
   - Lục địa, đại dương.
   - Khí hậu.
2. LỊCH SỬ
   - Sự kiện quan trọng.
   - Các triều đại / thời kỳ.
3. XÃ HỘI
   - Các tầng lớp.
   - Văn hóa, tôn giáo.
4. CÔNG NGHỆ / MA THUẬT
   - Hệ thống.
   - Luật lệ.
5. XUNG ĐỘT CHÍNH
6. NHÂN VẬT TIÊU BIỂU

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'st-10',
    cat: 'sangtao',
    title: 'Viết bài thơ tự do',
    desc: 'Thơ tự do có hình ảnh, ẩn dụ sâu sắc.',
    tags: ['thơ', 'chi tiết'],
    prompt: `Viết bài thơ tự do theo chủ đề:

"{{chủ đề}}"

CẢM XÚC: {{cảm xúc}}
ĐỘ DÀI: {{số câu}} câu

YÊU CẦU:

1. HÌNH ẢNH
   - 3-5 hình ảnh gợi cảm.
   - Không sáo rỗng.

2. ẨN DỤ
   - Sâu sắc, không quá khó hiểu.

3. NHỊP ĐIỆU
   - Tự nhiên, không gò bó.
   - Có thể phá cách.

4. CẢM XÚC
   - Chân thành, không giả tạo.

PHÂN TÍCH:
- Hình ảnh đặc sắc.
- Thông điệp.
- Cảm xúc chủ đạo.

ĐỊNH DẠNG:
- Chia khổ thơ (nếu cần).`,
    long: true,
  },
  {
    id: 'st-11',
    cat: 'sangtao',
    title: 'Viết truyện cười',
    desc: 'Truyện cười ngắn 200-300 chữ.',
    tags: ['truyện cười', 'chi tiết'],
    prompt: `Viết truyện cười 200-300 chữ về:

"{{chủ đề}}"

ĐỐI TƯỢNG: {{đối tượng}}
PHONG CÁCH: {{nhẹ nhàng / châm biếm / bất ngờ}}

YÊU CẦU:

1. SETUP
   - Tình huống bình thường.
2. BUILD UP
   - Xây dựng kỳ vọng.
3. PUNCHLINE
   - Bất ngờ, hài hước.

GHI CHÚ:
- Cường điệu.
- Chơi chữ.
- Twist bất ngờ.

ĐỊNH DẠNG:
- Đoạn văn ngắn gọn.`,
    long: true,
  },
  {
    id: 'st-12',
    cat: 'sangtao',
    title: 'Viết tiểu sử nhân vật giả tưởng',
    desc: 'Tiểu sử 300 chữ cho nhân vật giả tưởng.',
    tags: ['tiểu sử', 'chi tiết'],
    prompt: `Viết tiểu sử cho nhân vật giả tưởng:

TÊN: {{tên}}
VAI TRÒ: {{vai trò}}
BỐI CẢNH: {{bối cảnh}}

YÊU CẦU:

1. THÔNG TIN CƠ BẢN
   - Năm sinh, nơi sinh.
   - Gia đình.
2. SỰ KIỆN QUAN TRỌNG
   - 5-7 mốc theo timeline.
3. THÀNH TỰU
   - 3-5 thành tựu nổi bật.
4. TÍNH CÁCH
   - 3 điểm mạnh, 2 điểm yếu.
5. CÂU NÓI ĐẶC TRƯNG
6. DI SẢN

ĐỘ DÀI: 300-400 chữ.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'st-13',
    cat: 'sangtao',
    title: 'Viết kịch bản quảng cáo sáng tạo',
    desc: 'Quảng cáo 30 giây, có twist sáng tạo.',
    tags: ['quảng cáo', 'chi tiết'],
    prompt: `Viết kịch bản quảng cáo 30 giây sáng tạo cho:

SẢN PHẨM: {{sản phẩm}}
ĐỐI TƯỢNG: {{đối tượng}}
THÔNG ĐIỆP: {{thông điệp}}

YÊU CẦU:

1. Ý TƯỞNG SÁNG TẠO
   - Không theo lối mòn.
2. CẤU TRÚC
   - 0-5s: hook gây sốc.
   - 5-20s: câu chuyện.
   - 20-25s: twist.
   - 25-30s: CTA.

GHI CHÚ:
- Yếu tố bất ngờ.
- Cảm xúc.

ĐỊNH DẠNG:
- Bảng: Thời gian | Hình ảnh | Lời thoại.`,
    long: true,
  },
  {
    id: 'st-14',
    cat: 'sangtao',
    title: 'Viết truyện thiếu nhi',
    desc: 'Truyện thiếu nhi 500 chữ, có bài học.',
    tags: ['thiếu nhi', 'chi tiết'],
    prompt: `Viết truyện thiếu nhi:

CHỦ ĐỀ: {{chủ đề}}
NHÂN VẬT CHÍNH: {{nhân vật}}
BÀI HỌC: {{bài học}}

YÊU CẦU:

1. MỞ ĐẦU (100 chữ)
   - Giới thiệu nhân vật.
2. DIỄN BIẾN (300 chữ)
   - Biến cố.
   - Hành trình.
3. KẾT (100 chữ)
   - Bài học.

ĐẶC ĐIỂM:
- Ngôn ngữ đơn giản, dễ hiểu.
- Có hình ảnh sinh động.
- Có đối thoại.
- Có bài học rõ ràng.

ĐỘ DÀI: 500 chữ.

ĐỊNH DẠNG:
- Chia đoạn rõ ràng.`,
    long: true,
  },
  {
    id: 'st-15',
    cat: 'sangtao',
    title: 'Viết lời bài hát',
    desc: 'Lời bài hát có verse, chorus, bridge.',
    tags: ['lyrics', 'chi tiết'],
    prompt: `Viết lời bài hát về:

"{{chủ đề}}"

THỂ LOẠI: {{pop / ballad / rap}}
CẢM XÚC: {{cảm xúc}}

YÊU CẦU:

1. VERSE 1 (4-6 câu)
2. CHORUS (4 câu, dễ nhớ)
3. VERSE 2 (4-6 câu)
4. CHORUS (lặp lại)
5. BRIDGE (2-4 câu)
6. CHORUS (lặp lại)

GHI CHÚ:
- Vần điệu.
- Nhịp điệu.
- Hook ấn tượng.

ĐỊNH DẠNG:
- Ghi rõ [Verse], [Chorus], [Bridge].`,
    long: true,
  },
  {
    id: 'st-16',
    cat: 'sangtao',
    title: 'Viết kịch bản trò chơi',
    desc: 'Kịch bản game có cốt truyện, nhiệm vụ.',
    tags: ['game', 'chi tiết'],
    prompt: `Viết kịch bản game cho:

THỂ LOẠI: {{thể loại}}
CHỦ ĐỀ: {{chủ đề}}
ĐỐI TƯỢNG: {{đối tượng}}

YÊU CẦU:

1. CỐT TRUYỆN CHÍNH
2. NHÂN VẬT CHÍNH
3. THẾ GIỚI
4. NHIỆM VỤ CHÍNH
   - 5-7 quest.
5. KẾT THÚC
   - 3 ending khác nhau.
6. HỆ THỐNG GAME
   - Level, skill, item.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'st-17',
    cat: 'sangtao',
    title: 'Viết truyện kinh dị',
    desc: 'Truyện kinh dị ngắn 500 chữ, tạo không khí.',
    tags: ['kinh dị', 'chi tiết'],
    prompt: `Viết truyện kinh dị 500 chữ theo chủ đề:

"{{chủ đề}}"

KHÔNG KHÍ: {{u ám / máu me / tâm lý}}

YÊU CẦU:

1. MỞ ĐẦU
   - Tạo không khí.
   - Giới thiệu nhân vật.
2. DIỄN BIẾN
   - Tình huống bất thường.
   - Tăng dần căng thẳng.
3. CAO TRÀO
   - Twist bất ngờ.
4. KẾT
   - Gây ám ảnh.

GHI CHÚ:
- Miêu tả âm thanh, mùi.
- Cảm giác của nhân vật.

ĐỊNH DẠNG:
- Chia đoạn rõ ràng.`,
    long: true,
  },
  {
    id: 'st-18',
    cat: 'sangtao',
    title: 'Viết mô tả concept nghệ thuật',
    desc: 'Mô tả concept cho tranh, tác phẩm nghệ thuật.',
    tags: ['nghệ thuật', 'chi tiết'],
    prompt: `Viết mô tả concept nghệ thuật cho:

CHỦ ĐỀ: {{chủ đề}}
PHONG CÁCH: {{phong cách}}
PHƯƠNG TIỆN: {{digital / sơn dầu / sketch}}

YÊU CẦU:

1. Ý TƯỞNG CHÍNH
2. MÔ TẢ HÌNH ẢNH
   - Bố cục.
   - Màu sắc.
   - Ánh sáng.
3. CẢM XÚC MUỐN TRUYỀN TẢI
4. BIỂU TƯỢNG
5. THAM KHẢO NGHỆ THUẬT
6. GHI CHÚ KỸ THUẬT

ĐỊNH DẠNG:
- Rõ ràng, chi tiết.`,
    long: true,
  },
  {
    id: 'st-19',
    cat: 'sangtao',
    title: 'Viết truyện ngắn twist ending',
    desc: 'Truyện ngắn có kết bất ngờ, đảo ngược.',
    tags: ['twist', 'chi tiết'],
    prompt: `Viết truyện ngắn 400 chữ có twist ending.

CHỦ ĐỀ: {{chủ đề}}
KHÔNG KHÍ: {{không khí}}

YÊU CẦU:

1. SETUP (150 chữ)
   - Tình huống bình thường.
   - Có chi tiết cài cắm.
2. BUILD UP (150 chữ)
   - Diễn biến chính.
   - Tăng dần hồi hộp.
3. TWIST (100 chữ)
   - Bất ngờ, đảo ngược.
   - Vẫn logic với chi tiết cài cắm.

GHI CHÚ:
- Twist phải hợp lý.
- Không quá lộ liễu.

ĐỊNH DẠNG:
- Chia đoạn rõ ràng.`,
    long: true,
  },
  {
    id: 'st-20',
    cat: 'sangtao',
    title: 'Sinh 10 ý tưởng content sáng tạo',
    desc: '10 ý tưởng content cho social media.',
    tags: ['content', 'chi tiết'],
    prompt: `Sinh 10 ý tưởng content sáng tạo cho:

NỀN TẢNG: {{nền tảng}}
CHỦ ĐỀ: {{chủ đề}}
ĐỐI TƯỢNG: {{đối tượng}}

YÊU CẦU: 10 ý tưởng.

1-3. VIDEO NGẮN
4-5. CAROUSEL
6-7. STORY
8. REEL
9. LIVESTREAM
10. BÀI VIẾT DÀI

MỖI Ý TƯỞNG:
- Tiêu đề.
- Nội dung chính.
- Format.
- Hook.
- CTA.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
];