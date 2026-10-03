
export const DOI_SONG = [
  {
    id: 'ds-01',
    cat: 'doisong',
    title: 'Lập kế hoạch tài chính cá nhân',
    desc: 'Kế hoạch tài chính theo thu nhập, có mục tiêu tiết kiệm.',
    tags: ['tài chính', 'chi tiết'],
    prompt: `Lập kế hoạch tài chính cá nhân cho:

THÔNG TIN:
- Thu nhập hàng tháng: {{thu nhập}} triệu
- Chi tiêu cố định: {{chi tiêu cố định}} triệu
- Mục tiêu: {{mục tiêu}}
- Thời gian: {{thời gian}} tháng

YÊU CẦU:

1. PHÂN TÍCH HIỆN TRẠNG
   - Thu nhập vs chi tiêu.
   - Tỷ lệ tiết kiệm hiện tại.

2. NGUYÊN TẮC 50/30/20
   - 50% nhu cầu thiết yếu.
   - 30% mong muốn.
   - 20% tiết kiệm & đầu tư.

3. KẾ HOẠCH CHI TIẾT
   - Bảng chi tiêu hàng tháng.
   - Cắt giảm ở đâu.

4. MỤC TIÊU TIẾT KIỆM
   - Số tiền cần tiết kiệm/tháng.
   - Thời gian đạt mục tiêu.

5. QUỹ khẩn cấp
   - Bao nhiêu tháng chi tiêu.

6. GỢI Ý ĐẦU TƯ (nếu có)
   - An toàn vs rủi ro.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    sample: 'Với thu nhập 15 triệu/tháng, bạn nên dành 7,5 triệu cho nhu cầu thiết yếu, 4,5 triệu cho mong muốn, và 3 triệu cho tiết kiệm. Sau 12 tháng, bạn sẽ có 36 triệu — đủ cho quỹ khẩn cấp 3 tháng…',
    long: true,
  },
  {
    id: 'ds-02',
    cat: 'doisong',
    title: 'Lịch tập thể dục 4 tuần',
    desc: 'Lịch tập 4 tuần cho người mới bắt đầu, có tiến độ.',
    tags: ['sức khỏe', 'chi tiết'],
    prompt: `Lập lịch tập thể dục 4 tuần cho người mới bắt đầu.

THÔNG TIN:
- Mục tiêu: {{mục tiêu}}
- Thời gian mỗi ngày: {{thời gian}} phút
- Dụng cụ: {{dụng cụ}}
- Tình trạng sức khỏe: {{tình trạng}}

YÊU CẦU:

1. MỤC TIÊU 4 TUẦN
   - Tuần 1: làm quen.
   - Tuần 2: tăng cường độ.
   - Tuần 3: ổn định.
   - Tuần 4: thử thách.

2. LỊCH CHI TIẾT TỪNG NGÀY (dạng bảng)
   | Ngày | Buổi | Bài tập | Số lần | Ghi chú |

3. BÀI TẬP CỤ THỂ
   - Tên bài tập.
   - Cách thực hiện.
   - Số lần/set.

4. NGHỈ NGƠI
   - Ngày nghỉ.
   - Giãn cơ.

5. DINH DƯỠNG
   - Ăn gì trước/sau tập.

6. THEO DÕI TIẾN ĐỘ

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-03',
    cat: 'doisong',
    title: 'Thực đơn 7 ngày healthy',
    desc: 'Thực đơn 7 ngày healthy, có công thức đơn giản.',
    tags: ['dinh dưỡng', 'chi tiết'],
    prompt: `Lập thực đơn 7 ngày healthy cho:

THÔNG TIN:
- Mục tiêu: {{giảm cân / tăng cơ / ăn sạch}}
- Dị ứng / kiêng: {{dị ứng}}
- Ngân sách: {{ngân sách}}
- Thời gian nấu: {{thời gian}}

YÊU CẦU:

1. NGUYÊN TẮC DINH DƯỠNG
   - Calo mục tiêu.
   - Macro: protein / carb / fat.

2. THỰC ĐƠN 7 NGÀY
   | Ngày | Sáng | Trưa | Tối | Snack |
   - Đa dạng món.
   - Đủ chất.

3. CÔNG THỨC 3 MÓN ĐƠN GIẢN
   - Nguyên liệu.
   - Cách làm.
   - Thời gian nấu.

4. DANH SÁCH ĐI CHỢ
   - Phân loại.
   - Số lượng cho 7 ngày.

5. MẸO
   - Meal prep.
   - Bảo quản.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-04',
    cat: 'doisong',
    title: 'Lịch sinh hoạt khoa học',
    desc: 'Lịch sinh hoạt hàng ngày có ngủ, ăn, làm việc.',
    tags: ['thói quen', 'chi tiết'],
    prompt: `Lập lịch sinh hoạt khoa học cho:

THÔNG TIN:
- Nghề nghiệp: {{nghề nghiệp}}
- Giờ làm: {{giờ làm}}
- Mục tiêu: {{mục tiêu}}
- Thói quen xấu cần bỏ: {{thói quen}}

YÊU CẦU:

1. NGUYÊN TẮC
   - Ngủ 7-8 tiếng.
   - Ăn đúng giờ.
   - Vận động.
   - Nghỉ ngơi.

2. LỊCH CHI TIẾT 24H
   | Giờ | Hoạt động | Ghi chú |

3. THÓI QUEN CẦN XÂY
   - 3-5 thói quen tốt.
   - Cách duy trì.

4. THÓI QUEN CẦN BỎ
   - Cách cai.

5. MẸO
   - Ngủ ngon.
   - Tập trung.
   - Giảm stress.

ĐỊNH DẠNG:
- Bảng 24h.`,
    long: true,
  },
  {
    id: 'ds-05',
    cat: 'doisong',
    title: 'Kỹ năng quản lý thời gian',
    desc: 'Phương pháp quản lý thời gian, có ví dụ thực tế.',
    tags: ['kỹ năng', 'chi tiết'],
    prompt: `Hướng dẫn quản lý thời gian cho:

THÔNG TIN:
- Công việc: {{công việc}}
- Thời gian rảnh: {{thời gian rảnh}}
- Vấn đề: {{vấn đề}}

YÊU CẦU:

1. PHƯƠNG PHÁP
   - Pomodoro.
   - Eisenhower Matrix.
   - Time blocking.
   - 2-minute rule.

2. ÁP DỤNG CỤ THỂ
   - Ví dụ với công việc của bạn.

3. CÔNG CỤ HỖ TRỢ
   - App, sổ tay.

4. LỊCH MẪU 1 NGÀY
   - Sáng, chiều, tối.

5. TRÁNH XAO NHÃNG
   - Loại bỏ notification.
   - Deep work.

6. ĐÁNH GIÁ
   - Cuối tuần review.

ĐỊNH DẠNG:
- Bảng và bullet.`,
    long: true,
  },
  {
    id: 'ds-06',
    cat: 'doisong',
    title: 'Học kỹ năng mới trong 30 ngày',
    desc: 'Lộ trình 30 ngày học kỹ năng mới.',
    tags: ['học tập', 'chi tiết'],
    prompt: `Lập lộ trình 30 ngày học kỹ năng:

KỸ NĂNG: {{kỹ năng}}
TRÌNH ĐỘ HIỆN TẠI: {{trình độ}}
THỜI GIAN MỖI NGÀY: {{thời gian}} phút
MỤC TIÊU CUỐI: {{mục tiêu}}

YÊU CẦU:

1. CHIA 4 TUẦN
   - Tuần 1: nền tảng.
   - Tuần 2: thực hành cơ bản.
   - Tuần 3: nâng cao.
   - Tuần 4: dự án thực tế.

2. LỊCH TỪNG NGÀY (30 ngày)
   | Ngày | Nội dung | Bài tập | Tài nguyên |

3. TÀI NGUYÊN HỌC
   - Sách, khóa học, YouTube.

4. ĐÁNH GIÁ CUỐI TUẦN
   - Checklist.

5. DỰ ÁN CUỐI KHÓA
   - Đề bài.
   - Tiêu chí đánh giá.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-07',
    cat: 'doisong',
    title: 'Cách nấu ăn cho người mới',
    desc: 'Hướng dẫn nấu ăn cơ bản cho người mới bắt đầu.',
    tags: ['nấu ăn', 'chi tiết'],
    prompt: `Hướng dẫn nấu ăn cho người mới bắt đầu.

MÓN MUỐN NẤU: {{món ăn}}
SỐ NGƯỜI ĂN: {{số người}}
NGUYÊN LIỆU CÓ SẴN: {{nguyên liệu}}

YÊU CẦU:

1. NGUYÊN LIỆU
   - Danh sách đầy đủ.
   - Số lượng chính xác.
   - Nguyên liệu thay thế.

2. DỤNG CỤ
   - Cần gì.

3. CÁC BƯỚC NẤU
   - Sơ chế.
   - Nấu.
   - Trình bày.

4. LƯU Ý
   - Lửa lớn/nhỏ.
   - Thời gian.
   - Nêm nếm.

5. MẸO NGON
   - Bí quyết gia truyền.

6. BẢO QUẢN
   - Để được bao lâu.

ĐỊNH DẠNG:
- Đánh số bước.`,
    long: true,
  },
  {
    id: 'ds-08',
    cat: 'doisong',
    title: 'Kỹ năng giao tiếp',
    desc: 'Cải thiện kỹ năng giao tiếp, có tình huống thực tế.',
    tags: ['giao tiếp', 'chi tiết'],
    prompt: `Hướng dẫn cải thiện kỹ năng giao tiếp.

NGỮ CẢNH: {{ngữ cảnh}}
VẤN ĐỀ: {{vấn đề}}
MỤC TIÊU: {{mục tiêu}}

YÊU CẦU:

1. NGUYÊN TẮC GIAO TIẾP
   - Lắng nghe chủ động.
   - Đặt câu hỏi.
   - Ngôn ngữ cơ thể.
   - Đồng cảm.

2. TÌNH HUỐNG CỤ THỂ
   - 5 tình huống.
   - Cách xử lý.

3. CÁCH NÓI CHUYỆN
   - Mở đầu.
   - Duy trì.
   - Kết thúc.

4. XỬ LÝ XUNG ĐỘT
   - Bình tĩnh.
   - Không phòng thủ.
   - Tìm giải pháp.

5. BÀI TẬP THỰC HÀNH

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-09',
    cat: 'doisong',
    title: 'Cách học từ vựng hiệu quả',
    desc: 'Phương pháp học từ vựng nhớ lâu.',
    tags: ['học tập', 'chi tiết'],
    prompt: `Hướng dẫn học từ vựng hiệu quả.

NGÔN NGỮ: {{ngôn ngữ}}
TRÌNH ĐỘ: {{trình độ}}
MỤC TIÊU: {{mục tiêu}}

YÊU CẦU:

1. PHƯƠNG PHÁP
   - Spaced repetition.
   - Flashcards.
   - Context learning.
   - Mnemonics.

2. LỊCH HỌC
   - Bao nhiêu từ/ngày.
   - Ôn lại khi nào.

3. CÔNG CỤ
   - Anki, Quizlet.

4. CÁCH NHỚ LÂU
   - Liên tưởng.
   - Hình ảnh.
   - Câu chuyện.

5. BÀI TẬP MẪU

ĐỊNH DẠNG:
- Rõ ràng, có ví dụ.`,
    long: true,
  },
  {
    id: 'ds-10',
    cat: 'doisong',
    title: 'Cách giảm stress và lo âu',
    desc: 'Phương pháp giảm stress, có bài tập thực hành.',
    tags: ['tâm lý', 'chi tiết'],
    prompt: `Hướng dẫn giảm stress và lo âu.

TÌNH TRẠNG: {{tình trạng}}
NGUYÊN NHÂN: {{nguyên nhân}}

YÊU CẦU:

1. NHẬN DIỆN STRESS
   - Triệu chứng thể chất.
   - Triệu chứng tinh thần.

2. PHƯƠNG PHÁP NGAY LẬP TỨC
   - Thở 4-7-8.
   - Grounding 5-4-3-2-1.
   - Uống nước.

3. PHƯƠNG PHÁP DÀI HẠN
   - Thiền.
   - Yoga.
   - Viết nhật ký.
   - Tập thể dục.

4. THAY ĐỔI LỐI SỐNG
   - Ngủ đủ giấc.
   - Ăn uống.
   - Giảm caffeine.

5. KHI NÀO CẦN GẶP CHUYÊN GIA

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-11',
    cat: 'doisong',
    title: 'Cách tổ chức nhà cửa gọn gàng',
    desc: 'Phương pháp dọn dẹp, sắp xếp nhà cửa.',
    tags: ['gia đình', 'chi tiết'],
    prompt: `Hướng dẫn tổ chức nhà cửa gọn gàng.

KHÔNG GIAN: {{không gian}}
VẤN ĐỀ: {{vấn đề}}
THỜI GIAN: {{thời gian}}

YÊU CẦU:

1. PHƯƠNG PHÁP KONMARI
   - Bỏ đồ không dùng.
   - Sắp xếp theo loại.

2. KHU VỰC CỤ THỂ
   - Phòng bếp.
   - Phòng ngủ.
   - Phòng khách.
   - Nhà vệ sinh.

3. CÁCH SẮP XẾP
   - Theo tần suất dùng.
   - Theo mùa.
   - Label.

4. DUY TRÌ
   - 15 phút/ngày.
   - 1 giờ/tuần.

5. MẸO NHỎ

ĐỊNH DẠNG:
- Đánh số khu vực.`,
    long: true,
  },
  {
    id: 'ds-12',
    cat: 'doisong',
    title: 'Kỹ năng thuyết trình',
    desc: 'Cải thiện kỹ năng thuyết trình trước đám đông.',
    tags: ['thuyết trình', 'chi tiết'],
    prompt: `Hướng dẫn kỹ năng thuyết trình.

CHỦ ĐỀ: {{chủ đề}}
ĐỐI TƯỢNG: {{đối tượng}}
THỜI LƯỢNG: {{thời lượng}}

YÊU CẦU:

1. CHUẨN BỊ
   - Nghiên cứu.
   - Outline.
   - Visual aids.

2. MỞ ĐẦU
   - Hook 30 giây.
   - Giới thiệu bản thân.
   - Nêu mục tiêu.

3. NỘI DUNG
   - 3-5 điểm chính.
   - Ví dụ, câu chuyện.
   - Tương tác.

4. KẾT
   - Tóm tắt.
   - CTA.

5. KỸ NĂNG NÓI
   - Giọng nói.
   - Ngôn ngữ cơ thể.
   - Eye contact.

6. XỬ LÝ CÂU HỎI

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-13',
    cat: 'doisong',
    title: 'Lịch ngủ ngon',
    desc: 'Cải thiện giấc ngủ, có thói quen khoa học.',
    tags: ['sức khỏe', 'chi tiết'],
    prompt: `Hướng dẫn cải thiện giấc ngủ.

VẤN ĐỀ: {{vấn đề}}
THỜI GIAN NGỦ: {{thời gian}}
THÓI QUEN HIỆN TẠI: {{thói quen}}

YÊU CẦU:

1. VỆ SINH GIẤC NGỦ
   - Phòng ngủ lý tưởng.
   - Nhiệt độ, ánh sáng, tiếng ồn.

2. THÓI QUEN TRƯỚC NGỦ
   - Không dùng điện thoại 1h.
   - Đọc sách.
   - Tắm nước ấm.
   - Thư giãn.

3. THỰC PHẨM
   - Nên ăn gì.
   - Tránh gì (caffeine, rượu).

4. LỊCH NGỦ
   - Giờ đi ngủ.
   - Giờ thức.
   - Cuối tuần.

5. BÀI TẬP THƯ GIÃN

6. KHI NÀO CẦN GẶP BÁC SĨ

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-14',
    cat: 'doisong',
    title: 'Kỹ năng viết CV và phỏng vấn',
    desc: 'Hướng dẫn viết CV và phỏng vấn xin việc.',
    tags: ['nghề nghiệp', 'chi tiết'],
    prompt: `Hướng dẫn viết CV và phỏng vấn cho:

VỊ TRÍ: {{vị trí}}
KINH NGHIỆM: {{kinh nghiệm}}
CÔNG TY: {{công ty}}

YÊU CẦU:

1. CV
   - Cấu trúc.
   - Từ vựng action verbs.
   - Định lượng thành tựu.
   - Lỗi cần tránh.

2. COVER LETTER
   - Template.
   - Cá nhân hóa.

3. PHỎNG VẤN
   - Chuẩn bị.
   - 10 câu hỏi thường gặp + trả lời mẫu.
   - Câu hỏi nên hỏi ngược.
   - Cách xử lý căng thẳng.

4. SAU PHỎNG VẤN
   - Email cảm ơn.
   - Follow up.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-15',
    cat: 'doisong',
    title: 'Cách mua sắm thông minh',
    desc: 'Chiến lược mua sắm tiết kiệm, tránh lãng phí.',
    tags: ['tài chính', 'chi tiết'],
    prompt: `Hướng dẫn mua sắm thông minh.

LOẠI MUA: {{loại mua}}
NGÂN SÁCH: {{ngân sách}}
MỤC TIÊU: {{mục tiêu}}

YÊU CẦU:

1. TRƯỚC KHI MUA
   - Danh sách.
   - Ngân sách.
   - So sánh giá.

2. KHI MUA
   - Không mua bốc đồng.
   - Chờ 24h với món > 1 triệu.
   - Kiểm tra chất lượng.

3. SAU KHI MUA
   - Bảo quản.
   - Bảo hành.
   - Đánh giá.

4. MẸO TIẾT KIỆM
   - Mua sỉ.
   - Săn sale.
   - Cashback.

5. TRÁNH LÃNG PHÍ
   - Không mua vì quảng cáo.
   - Không mua vì FOMO.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-16',
    cat: 'doisong',
    title: 'Kỹ năng sơ cứu cơ bản',
    desc: 'Hướng dẫn sơ cứu cơ bản, có tình huống.',
    tags: ['sức khỏe', 'chi tiết'],
    prompt: `Hướng dẫn sơ cứu cơ bản.

TÌNH HUỐNG: {{tình huống}}

YÊU CẦU:

1. ĐÁNH GIÁ TÌNH HUỐNG
   - Nguy hiểm không?
   - Gọi 115 khi nào?

2. SƠ CỨU
   - CPR (hồi sinh tim phổi).
   - Choking (hóc dị vật).
   - Chảy máu.
   - Bỏng.
   - Gãy xương.
   - Đuối nước.

3. DỤNG CỤ SƠ CỨU
   - Bộ sơ cứu cơ bản.

4. LỖI THƯỜNG MẮC

5. KHI NÀO CẦN ĐI BỆNH VIỆN

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-17',
    cat: 'doisong',
    title: 'Cách tạo thói quen tốt',
    desc: 'Phương pháp xây dựng thói quen theo Atomic Habits.',
    tags: ['thói quen', 'chi tiết'],
    prompt: `Hướng dẫn tạo thói quen tốt.

THÓI QUEN: {{thói quen}}
THỜI GIAN: {{thời gian}}
LÝ DO: {{lý do}}

YÊU CẦU:

1. 4 QUY LUẬT
   - Làm rõ ràng (cue).
   - Hấp dẫn (craving).
   - Dễ dàng (response).
   - Thỏa mãn (reward).

2. ÁP DỤNG CỤ THỂ
   - Habit stacking.
   - 2-minute rule.
   - Environment design.

3. THEO DÕI
   - Habit tracker.
   - Streak.

4. XỬ LÝ KHI BỎ LỠ
   - Never miss twice.
   - Quay lại nhanh.

5. DUY TRÌ DÀI HẠN

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-18',
    cat: 'doisong',
    title: 'Cách học ngoại ngữ tại nhà',
    desc: 'Lộ trình tự học ngoại ngữ tại nhà, không cần thầy.',
    tags: ['học tập', 'chi tiết'],
    prompt: `Lộ trình tự học ngoại ngữ tại nhà.

NGÔN NGỮ: {{ngôn ngữ}}
TRÌNH ĐỘ: {{trình độ}}
MỤC TIÊU: {{mục tiêu}}
THỜI GIAN MỖI NGÀY: {{thời gian}} phút

YÊU CẦU:

1. 4 KỸ NĂNG
   - Nghe: podcast, YouTube.
   - Nói: shadowing, speaking partner.
   - Đọc: sách, báo.
   - Viết: nhật ký.

2. TÀI NGUYÊN MIỄN PHÍ
   - App, web, kênh YouTube.

3. LỊCH HỌC HÀNG NGÀY
   - Sáng, tối.

4. ĐÁNH GIÁ
   - Test online.
   - Tự đánh giá.

5. MẸO
   - Immersion.
   - Không dịch word-by-word.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'ds-19',
    cat: 'doisong',
    title: 'Cách chọn mua điện thoại / laptop',
    desc: 'Hướng dẫn chọn mua thiết bị phù hợp nhu cầu.',
    tags: ['mua sắm', 'chi tiết'],
    prompt: `Hướng dẫn chọn mua {{điện thoại / laptop / máy tính bảng}}.

NHU CẦU: {{nhu cầu}}
NGÂN SÁCH: {{ngân sách}}
THƯƠNG HIỆU ƯA THÍCH: {{thương hiệu}}

YÊU CẦU:

1. XÁC ĐỊNH NHU CẦU
   - Dùng cho việc gì?
   - Tính năng quan trọng.

2. TIÊU CHÍ CHỌN
   - CPU, RAM, bộ nhớ.
   - Pin.
   - Màn hình.
   - Camera.
   - Hệ điều hành.

3. SO SÁNH 3-5 MẪU
   - Bảng so sánh.
   - Ưu nhược điểm.

4. KHUYẾN NGHỊ
   - Mẫu tốt nhất cho nhu cầu.

5. MẸO MUA
   - Khi nào sale?
   - Ở đâu uy tín?

ĐỊNH DẠNG:
- Bảng so sánh.`,
    long: true,
  },
  {
    id: 'ds-20',
    cat: 'doisong',
    title: 'Cách duy trì mối quan hệ',
    desc: 'Cách duy trì mối quan hệ gia đình, bạn bè.',
    tags: ['quan hệ', 'chi tiết'],
    prompt: `Hướng dẫn duy trì mối quan hệ tốt.

LOẠI QUAN HỆ: {{gia đình / bạn bè / đồng nghiệp}}
VẤN ĐỀ: {{vấn đề}}
MỤC TIÊU: {{mục tiêu}}

YÊU CẦU:

1. NGUYÊN TẮC
   - Lắng nghe.
   - Tôn trọng.
   - Đồng cảm.
   - Không phán xét.

2. CÁCH DUY TRÌ
   - Liên lạc định kỳ.
   - Quan tâm thật lòng.
   - Kỷ niệm chung.

3. XỬ LÝ XUNG ĐỘT
   - Bình tĩnh.
   - Không công kích cá nhân.
   - Tìm giải pháp chung.

4. KHI CẦN XA
   - Cắt đứt độc hại.
   - Buông bỏ.

5. BÀI TẬP
   - 5 hành động nhỏ để cải thiện.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
];