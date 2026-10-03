
export const DICH = [
  {
    id: 'dich-01',
    cat: 'dich',
    title: 'Dịch Anh → Việt tự nhiên',
    desc: 'Dịch đoạn văn tiếng Anh sang tiếng Việt tự nhiên, có phân tích sắc thái.',
    tags: ['dịch thuật', 'chi tiết'],
    prompt: `Bạn là dịch giả chuyên nghiệp. Dịch đoạn văn tiếng Anh sang tiếng Việt:

{{đoạn văn}}

NGỮ CẢNH: {{ngữ cảnh}}
ĐỐI TƯỢNG ĐỘC GIẢ: {{đối tượng}}

YÊU CẦU:

1. BẢN DỊCH CHÍNH
   - Tự nhiên, không word-by-word.
   - Giữ đúng ý, không thêm bớt.

2. 3 CHỖ CÓ NHIỀU CÁCH DỊCH
   - Cách 1 + sắc thái.
   - Cách 2 + sắc thái.
   - Khuyến nghị chọn cách nào, vì sao.

3. GHI CHÚ TỪ VỰNG
   - 5-7 từ khó.
   - Idiom nếu có.

4. GHI CHÚ NGỮ PHÁP
   - Cấu trúc đặc biệt.

5. BẢN DỊCH THAY THẾ (nếu có phong cách khác)

ĐỊNH DẠNG:
- Bản dịch trong block riêng.`,
    sample: 'Bản gốc: "It\'s raining cats and dogs." Bản dịch tự nhiên: "Trời mưa như trút nước." Không dịch word-by-word thành "mưa mèo và chó"…',
    long: true,
  },
  {
    id: 'dich-02',
    cat: 'dich',
    title: 'Dịch Việt → Anh tự nhiên',
    desc: 'Dịch đoạn văn tiếng Việt sang tiếng Anh, giữ giọng điệu và sắc thái.',
    tags: ['dịch thuật', 'chi tiết'],
    prompt: `Dịch đoạn văn tiếng Việt sau sang tiếng Anh:

{{đoạn văn}}

NGỮ CẢNH: {{ngữ cảnh}}
GIỌNG ĐIỆU: {{formal / casual / academic}}

YÊU CẦU:

1. BẢN DỊCH CHÍNH
2. 3 CHỖ CÓ NHIỀU CÁCH DỊCH
   - Cách 1 + sắc thái.
   - Cách 2 + sắc thái.
   - Khuyến nghị.

3. GHI CHÚ TỪ VỰNG
   - Từ Việt khó dịch (tục ngữ, thành ngữ).
   - Từ tương đương.

4. GHI CHÚ NGỮ PHÁP
   - Cấu trúc tiếng Anh phù hợp.

5. BẢN DỊCH NGƯỢC (kiểm tra)

ĐỊNH DẠNG:
- Bản dịch trong block riêng.`,
    long: true,
  },
  {
    id: 'dich-03',
    cat: 'dich',
    title: 'Dịch tiếng Nhật lịch sự cho khách',
    desc: 'Kính ngữ phù hợp, có furigana và bản dịch ngược.',
    tags: ['tiếng Nhật', 'chi tiết'],
    prompt: `Bạn là phiên dịch viên tiếng Nhật chuyên nghiệp, đang dịch tin nhắn cho khách hàng Nhật.

TIN NHẮN: {{tin nhắn}}

NGỮ CẢNH:
- Người gửi: {{người gửi}}
- Người nhận: {{người nhận}}
- Mối quan hệ: {{mối quan hệ}}

YÊU CẦU:

1. BẢN DỊCH TIẾNG NHẬT
   - Dùng kính ngữ phù hợp (keigo).
   - Phân biệt: sonkeigo, kenjougo, teineigo.
   - Ghi rõ mức độ lịch sự.

2. FURIGANA
   - Kanji khó (N2+): 漢字(かんじ)

3. BẢN DỊCH NGƯỢC SANG TIẾNG VIỆT

4. GHI CHÚ VĂN HÓA
   - 2-3 điểm cần lưu ý.

5. PHƯƠNG ÁN THAY THẾ

ĐỊNH DẠNG:
- Furigana rõ ràng.`,
    long: true,
  },
  {
    id: 'dich-04',
    cat: 'dich',
    title: 'Dịch tiếng Trung cho thương mại',
    desc: 'Dịch tiếng Trung cho email, hợp đồng, tin nhắn khách hàng.',
    tags: ['tiếng Trung', 'chi tiết'],
    prompt: `Dịch tài liệu tiếng Trung cho mục đích thương mại.

VĂN BẢN: {{văn bản}}
LOẠI: {{email / hợp đồng / tin nhắn}}
NGỮ CẢNH: {{ngữ cảnh}}

YÊU CẦU:

1. BẢN DỊCH TIẾNG TRUNG
   - Dùng từ ngữ thương mại.
   - Phù hợp phong cách văn bản.

2. PINYIN + BẢN DỊCH NGƯỢC

3. GHI CHÚ
   - Từ ngữ chuyên ngành.
   - Sắc thái.
   - Văn hóa thương mại Trung Quốc.

4. PHƯƠNG ÁN THAY THẾ
   - Nếu có nhiều cách hiểu.

ĐỊNH DẠNG:
- Bản dịch rõ ràng.`,
    long: true,
  },
  {
    id: 'dich-05',
    cat: 'dich',
    title: 'Dịch tiếng Hàn cho fan K-pop',
    desc: 'Dịch tiếng Hàn có giải thích văn hóa, cho fan.',
    tags: ['tiếng Hàn', 'chi tiết'],
    prompt: `Dịch nội dung tiếng Hàn cho fan K-pop.

VĂN BẢN: {{văn bản}}
LOẠI: {{bài hát / tweet / video / tin nhắn}}

YÊU CẦU:

1. BẢN DỊCH TIẾNG VIỆT
   - Tự nhiên, phù hợp fan.
2. ROMANIZATION (nếu cần)
3. TỪ LÓNG / TIẾNG LÓNG
   - Giải thích.
4. GHI CHÚ VĂN HÓA
   - Điểm cần lưu ý.
5. BẢN DỊCH SÁT NGHĨA (để so sánh)

ĐỊNH DẠNG:
- Rõ ràng, có giải thích.`,
    long: true,
  },
  {
    id: 'dich-06',
    cat: 'dich',
    title: 'Dịch phụ đề phim',
    desc: 'Dịch phụ đề phim, giữ tự nhiên và đúng thời lượng.',
    tags: ['phụ đề', 'chi tiết'],
    prompt: `Dịch phụ đề phim từ tiếng {{ngôn ngữ nguồn}} sang tiếng Việt.

PHỤ ĐỀ GỐC:
{{phụ đề}}

YÊU CẦU:

1. BẢN DỊCH PHỤ ĐỀ
   - Ngắn gọn, dễ đọc (dưới 42 ký tự/dòng).
   - Chia dòng hợp lý.
   - Giữ đúng timing.
2. CÁC CHỖ KHÓ
   - Từ chơi chữ, thành ngữ.
   - Văn hóa đặc thù.
3. GHI CHÚ
   - Lưu ý cho người xem.

ĐỊNH DẠNG:
- Timestamp + nội dung.`,
    long: true,
  },
  {
    id: 'dich-07',
    cat: 'dich',
    title: 'Dịch tài liệu kỹ thuật',
    desc: 'Dịch tài liệu kỹ thuật, giữ thuật ngữ chính xác.',
    tags: ['kỹ thuật', 'chi tiết'],
    prompt: `Dịch tài liệu kỹ thuật từ {{ngôn ngữ nguồn}} sang {{ngôn ngữ đích}}.

TÀI LIỆU:
{{tài liệu}}

LĨNH VỰC: {{lĩnh vực}}

YÊU CẦU:

1. BẢN DỊCH
   - Thuật ngữ chính xác.
   - Giữ format gốc.
2. BẢNG THUẬT NGỮ
   | Gốc | Dịch | Ghi chú |
3. GHI CHÚ
   - Thuật ngữ chưa thống nhất.
   - Chỗ cần chuyên gia xem.

ĐỊNH DẠNG:
- Bảng thuật ngữ.`,
    long: true,
  },
  {
    id: 'dich-08',
    cat: 'dich',
    title: 'Dịch thơ',
    desc: 'Dịch thơ, giữ vần điệu và cảm xúc.',
    tags: ['thơ', 'chi tiết'],
    prompt: `Dịch bài thơ sau từ {{ngôn ngữ nguồn}} sang tiếng Việt:

{{bài thơ}}

YÊU CẦU:

1. BẢN DỊCH SÁT NGHĨA
   - Giữ ý, có thể không giữ vần.

2. BẢN DỊCH THƠ
   - Giữ vần điệu.
   - Giữ nhịp thơ.
   - Có cảm xúc.

3. BẢN DỊCH TỰ DO
   - Thể hiện tinh thần bài thơ.
   - Sáng tạo hơn.

4. PHÂN TÍCH
   - Hình ảnh.
   - Biện pháp tu từ.
   - Khó khăn khi dịch.

ĐỊNH DẠNG:
- Mỗi bản trong block riêng.`,
    long: true,
  },
  {
    id: 'dich-09',
    cat: 'dich',
    title: 'Luyện hội thoại ngoại ngữ',
    desc: 'AI đóng vai, nói ngắn và sửa lỗi sau mỗi lượt.',
    tags: ['luyện nói', 'chi tiết'],
    prompt: `Bạn là giáo viên dạy {{ngôn ngữ}} cho học sinh trình độ {{trình độ}}. Hãy đóng vai để luyện hội thoại.

VAI BẠN ĐÓNG: {{vai}}
CHỦ ĐỀ: {{chủ đề}}
MỤC TIÊU: {{mục tiêu}}

QUY TẮC:

1. MỖI LƯỢT BẠN CHỈ NÓI 1-2 CÂU
2. SAU MỖI LƯỢT CỦA HỌC SINH
   ❌ Câu sai: [...]
   ✅ Câu đúng: [...]
   💡 Lý do: [...]
3. DUY TRÌ HỘI THOẠI
4. GHI CHÚ TỪ VỰNG MỚI (tối đa 3 từ/lượt)
5. KẾT THÚC: tóm tắt điểm mạnh, yếu, bài tập.

BẮT ĐẦU: Chào hỏi ngắn.`,
    long: true,
  },
  {
    id: 'dich-10',
    cat: 'dich',
    title: 'Học từ vựng ngoại ngữ theo chủ đề',
    desc: 'Từ vựng theo chủ đề, có phiên âm, nghĩa, ví dụ.',
    tags: ['từ vựng', 'chi tiết'],
    prompt: `Dạy 20 từ vựng {{ngôn ngữ}} theo chủ đề:

"{{chủ đề}}"

TRÌNH ĐỘ: {{trình độ}}

YÊU CẦU:

VỚI MỖI TỪ:
1. Từ + phiên âm
2. Từ loại
3. Nghĩa tiếng Việt
4. Ví dụ + dịch
5. Từ đồng/trái nghĩa (nếu có)
6. Collocations

PHÂN LOẠI:
- 7 từ cơ bản
- 7 từ trung bình
- 6 từ nâng cao

CUỐI BÀI:
- 5 câu hỏi ôn tập + đáp án.
- Mẹo ghi nhớ.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'dich-11',
    cat: 'dich',
    title: 'Dịch song song 2 ngôn ngữ',
    desc: 'Dịch song song 2 ngôn ngữ để học ngoại ngữ.',
    tags: ['học ngoại ngữ', 'chi tiết'],
    prompt: `Dịch song song văn bản từ {{ngôn ngữ nguồn}} sang {{ngôn ngữ đích}}.

VĂN BẢN:
{{văn bản}}

YÊU CẦU:

1. BẢN DỊCH SONG SONG (từng câu)
   - Câu gốc.
   - Bản dịch.
   - Song song, dễ so sánh.

2. PHÂN TÍCH CẤU TRÚC
   - Cấu trúc ngữ pháp khác biệt.

3. TỪ VỰNG NỔI BẬT
   - 5-10 từ hay.

4. BÀI TẬP
   - 5 câu hỏi ôn tập.

ĐỊNH DẠNG:
- Bảng: Câu gốc | Bản dịch.`,
    long: true,
  },
  {
    id: 'dich-12',
    cat: 'dich',
    title: 'Dịch email công việc',
    desc: 'Dịch email công việc, giữ giọng formal.',
    tags: ['email', 'chi tiết'],
    prompt: `Dịch email công việc từ {{ngôn ngữ nguồn}} sang {{ngôn ngữ đích}}.

EMAIL GỐC:
{{email}}

NGỮ CẢNH: {{ngữ cảnh}}
MỐI QUAN HỆ: {{mối quan hệ}}

YÊU CẦU:

1. BẢN DỊCH CHÍNH
   - Giữ giọng formal.
   - Phù hợp văn hóa doanh nghiệp.

2. GHI CHÚ
   - Từ ngữ chuyên ngành.
   - Sắc thái.
   - Khác biệt văn hóa.

3. PHƯƠNG ÁN THAY THẾ

ĐỊNH DẠNG:
- Bản dịch trong block riêng.`,
    long: true,
  },
  {
    id: 'dich-13',
    cat: 'dich',
    title: 'Dịch tin nhắn chat',
    desc: 'Dịch tin nhắn chat, giữ tone và slang.',
    tags: ['chat', 'chi tiết'],
    prompt: `Dịch tin nhắn chat từ {{ngôn ngữ nguồn}} sang {{ngôn ngữ đích}}.

TIN NHẮN:
{{tin nhắn}}

NGỮ CẢNH:
- Người gửi: {{người gửi}}
- Người nhận: {{người nhận}}
- Mối quan hệ: {{mối quan hệ}}

YÊU CẦU:

1. BẢN DỊCH
   - Giữ tone chat.
   - Giữ slang nếu có.
   - Emoji giữ nguyên.

2. GHI CHÚ
   - Slang khó dịch.
   - Văn hóa chat.

3. PHƯƠNG ÁN THAY THẾ

ĐỊNH DẠNG:
- Bản dịch trong block riêng.`,
    long: true,
  },
  {
    id: 'dich-14',
    cat: 'dich',
    title: 'Dịch quảng cáo',
    desc: 'Dịch quảng cáo, giữ sức hút và CTA.',
    tags: ['quảng cáo', 'chi tiết'],
    prompt: `Dịch quảng cáo từ {{ngôn ngữ nguồn}} sang {{ngôn ngữ đích}}.

QUẢNG CÁO:
{{quảng cáo}}

ĐỐI TƯỢNG: {{đối tượng}}
MỤC TIÊU: {{mục tiêu}}

YÊU CẦU:

1. BẢN DỊCH CHÍNH
   - Giữ sức hút.
   - CTA rõ ràng.

2. PHƯƠNG ÁN SÁNG TẠO
   - Có thể không word-by-word.
   - Phù hợp văn hóa đích.

3. GHI CHÚ
   - Từ ngữ marketing.
   - Văn hóa.

ĐỊNH DẠNG:
- Bản dịch trong block riêng.`,
    long: true,
  },
  {
    id: 'dich-15',
    cat: 'dich',
    title: 'Dịch pháp lý',
    desc: 'Dịch tài liệu pháp lý, giữ chính xác cao.',
    tags: ['pháp lý', 'chi tiết'],
    prompt: `Dịch tài liệu pháp lý từ {{ngôn ngữ nguồn}} sang {{ngôn ngữ đích}}.

TÀI LIỆU:
{{tài liệu}}

LOẠI: {{hợp đồng / điều khoản / luật}}

YÊU CẦU:

1. BẢN DỊCH
   - Chính xác tuyệt đối.
   - Thuật ngữ pháp lý chuẩn.

2. BẢNG THUẬT NGỮ
   | Gốc | Dịch | Ghi chú |

3. GHI CHÚ
   - Chỗ cần luật sư xem.
   - Khác biệt hệ thống pháp luật.

4. LƯU Ý
   - Không dùng từ ngữ mơ hồ.

ĐỊNH DẠNG:
- Bảng thuật ngữ.`,
    long: true,
  },
  {
    id: 'dich-16',
    cat: 'dich',
    title: 'Dịch y tế',
    desc: 'Dịch tài liệu y tế, giữ chính xác chuyên môn.',
    tags: ['y tế', 'chi tiết'],
    prompt: `Dịch tài liệu y tế từ {{ngôn ngữ nguồn}} sang {{ngôn ngữ đích}}.

TÀI LIỆU:
{{tài liệu}}

LOẠI: {{bệnh án / hướng dẫn / nghiên cứu}}

YÊU CẦU:

1. BẢN DỊCH
   - Chính xác chuyên môn.
   - Tên thuốc giữ nguyên tiếng Anh.

2. BẢNG THUẬT NGỮ Y KHOA
3. GHI CHÚ
   - Cảnh báo nếu có.
   - Đơn vị đo lường.

ĐỊNH DẠNG:
- Bảng thuật ngữ.`,
    long: true,
  },
  {
    id: 'dich-17',
    cat: 'dich',
    title: 'Học ngữ pháp ngoại ngữ',
    desc: 'Giải thích ngữ pháp ngoại ngữ, có ví dụ và bài tập.',
    tags: ['ngữ pháp', 'chi tiết'],
    prompt: `Giải thích ngữ pháp {{ngôn ngữ}} cho học sinh {{trình độ}}.

CẤU TRÚC: "{{cấu trúc}}"

YÊU CẦU:

1. ĐỊNH NGHĨA
2. CÔNG THỨC
3. CÁCH DÙNG
4. VÍ DỤ (5 câu)
5. SO SÁNH VỚI TIẾNG VIỆT
6. 5 LỖI HỌC SINH HAY MẮC
7. BÀI TẬP + đáp án

ĐỊNH DẠNG:
- Rõ ràng, có ví dụ.`,
    long: true,
  },
  {
    id: 'dich-18',
    cat: 'dich',
    title: 'Dịch tin tức',
    desc: 'Dịch tin tức báo chí, giữ khách quan.',
    tags: ['tin tức', 'chi tiết'],
    prompt: `Dịch bản tin từ {{ngôn ngữ nguồn}} sang tiếng Việt.

BẢN TIN:
{{bản tin}}

LOẠI: {{thời sự / kinh tế / thể thao / công nghệ}}

YÊU CẦU:

1. BẢN DỊCH
   - Khách quan, không bình luận.
   - Giữ cấu trúc tin.
2. GHI CHÚ
   - Tên riêng giữ nguyên.
   - Số liệu chính xác.
3. TIÊU ĐỀ BẢN DỊCH
   - Ngắn gọn, gây chú ý.

ĐỊNH DẠNG:
- Tiêu đề + nội dung.`,
    long: true,
  },
  {
    id: 'dich-19',
    cat: 'dich',
    title: 'Học phát âm ngoại ngữ',
    desc: 'Luyện phát âm ngoại ngữ, có phiên âm và mẹo.',
    tags: ['phát âm', 'chi tiết'],
    prompt: `Hướng dẫn phát âm {{ngôn ngữ}} cho từ/câu:

"{{từ hoặc câu}}"

YÊU CẦU:

1. PHIÊN ÂM
   - IPA hoặc ký hiệu phù hợp.
2. PHÂN TÍCH ÂM
   - Âm khó với người Việt.
3. TRỌNG ÂM / THANH ĐIỆU
4. LUYỆN TẬP
   - 5 từ tương tự.
5. LỖI THƯỜNG MẮC

ĐỊNH DẠNG:
- Phiên âm rõ ràng.`,
    long: true,
  },
  {
    id: 'dich-20',
    cat: 'dich',
    title: 'So sánh 2 ngôn ngữ',
    desc: 'So sánh ngữ pháp, từ vựng 2 ngôn ngữ.',
    tags: ['so sánh', 'chi tiết'],
    prompt: `So sánh 2 ngôn ngữ:

NGÔN NGỮ A: {{ngôn ngữ A}}
NGÔN NGỮ B: {{ngôn ngữ B}}
KHÍA CẠNH: {{ngữ pháp / từ vựng / phát âm}}

YÊU CẦU:

1. BẢNG SO SÁNH
   | Đặc điểm | Ngôn ngữ A | Ngôn ngữ B |

2. ĐIỂM GIỐNG
3. ĐIỂM KHÁC
4. LỖI NGƯỜI HỌC HAY MẮC
   - Khi học ngôn ngữ B sau A.
5. MẸO HỌC

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
];