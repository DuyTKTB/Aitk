
export const ANH = [
  {
    id: 'en-01',
    cat: 'anh',
    title: 'Giải thích ngữ pháp dễ hiểu',
    desc: 'Giải thích cấu trúc ngữ pháp kèm ví dụ, so sánh với tiếng Việt và lỗi hay mắc.',
    tags: ['ngữ pháp', 'cơ bản', 'chi tiết'],
    prompt: `Bạn là giáo viên tiếng Anh kiên nhẫn, đang dạy cho học sinh {{trình độ}}.

NHIỆM VỤ: Giải thích cấu trúc ngữ pháp "{{cấu trúc}}" một cách dễ hiểu nhất.

YÊU CẦU:

1. ĐỊNH NGHĨA NGẮN (dưới 50 từ)
   - Nêu cấu trúc bằng tiếng Việt đơn giản.
   - Công thức tổng quát: S + V + ...

2. CÁCH DÙNG
   - Khi nào dùng cấu trúc này?
   - 3 tình huống cụ thể.

3. VÍ DỤ MINH HOẠ (5 câu)
   - Câu khẳng định, phủ định, nghi vấn.
   - Có dịch tiếng Việt.

4. SO SÁNH VỚI TIẾNG VIỆT
   - Điểm giống và khác.
   - Vì sao người Việt hay nhầm?

5. 5 LỖI HỌC SINH VIỆT HAY MẮC
   - Mỗi lỗi: ví dụ sai + cách sửa.

6. BÀI TẬP TỰ KIỂM TRA
   - 5 câu điền khuyết + đáp án.

ĐỊNH DẠNG:
- Tiếng Anh in đậm, tiếng Việt in thường.`,
    sample: 'Thì hiện tại hoàn thành: S + have/has + V3/ed. Dùng khi hành động bắt đầu trong quá khứ và còn liên quan đến hiện tại. Ví dụ: I have lived here for 5 years = Tôi đã sống ở đây 5 năm (và vẫn đang sống)…',
    long: true,
  },
  {
    id: 'en-02',
    cat: 'anh',
    title: 'Học từ vựng theo chủ đề',
    desc: '15 từ vựng chủ đề, phiên âm IPA, ví dụ, từ đồng nghĩa và trái nghĩa.',
    tags: ['từ vựng', 'chi tiết'],
    prompt: `Bạn là giáo viên tiếng Anh dạy từ vựng cho học sinh {{trình độ}}.

CHỦ ĐỀ: "{{chủ đề}}"

YÊU CẦU: Chọn 15 từ vựng quan trọng nhất.

VỚI MỖI TỪ:
1. Từ + phiên âm IPA
2. Từ loại (noun/verb/adj…)
3. Nghĩa tiếng Việt
4. Ví dụ + dịch
5. Từ đồng nghĩa (nếu có)
6. Từ trái nghĩa (nếu có)
7. Collocations

SẮP XẾP: Từ dễ → từ khó.
- 5 từ A2, 5 từ B1, 5 từ B2-C1.

CUỐI BÀI:
- 5 câu hỏi ôn tập + đáp án.

ĐỊNH DẠNG:
- Bảng 3 cột: Từ | Nghĩa | Ví dụ.`,
    long: true,
  },
  {
    id: 'en-03',
    cat: 'anh',
    title: 'Phân tích transcript nghe',
    desc: 'Từ khó, ngữ pháp, hiện tượng phát âm, câu hỏi kiểm tra.',
    tags: ['nghe', 'chi tiết'],
    prompt: `Bạn là giáo viên luyện nghe tiếng Anh cho học sinh {{trình độ}}.

TRANSCRIPT:
{{transcript}}

YÊU CẦU:

1. TÓM TẮT NỘI DUNG (2-3 câu)
2. TỪ VỰNG KHÓ (8-10 từ)
   | Từ | Phiên âm | Nghĩa | Ví dụ |
3. CẤU TRÚC NGỮ PHÁP NỔI BẬT
4. HIỆN TƯỢNG PHÁT ÂM
   - Nối âm, nuốt âm, biến âm, trọng âm.
5. 5 CÂU HỎI KIỂM TRA NGHE HIỂU + đáp án
6. LUYỆN NÓI (3 câu trong transcript)

ĐỊNH DẠNG:
- IPA rõ ràng, có dịch.`,
    long: true,
  },
  {
    id: 'en-04',
    cat: 'anh',
    title: 'Viết đoạn văn tiếng Anh theo chủ đề',
    desc: 'Đoạn văn 150-200 từ có mở – thân – kết, từ vựng phong phú.',
    tags: ['writing', 'chi tiết'],
    prompt: `Viết đoạn văn tiếng Anh 150-200 từ về chủ đề:

"{{chủ đề}}"

TRÌNH ĐỘ: {{trình độ}}

YÊU CẦU:

1. CẤU TRÚC
   - Mở đoạn: giới thiệu chủ đề.
   - Thân đoạn: 2-3 ý chính + ví dụ.
   - Kết đoạn: tóm tắt + quan điểm.

2. TỪ VỰNG
   - 5-7 từ vựng nâng cao (highlight đậm).
   - Có collocation tự nhiên.

3. CẤU TRÚC CÂU
   - Đa dạng: đơn, ghép, phức.
   - Có linking words: however, moreover, therefore.

4. BẢN DỊCH TIẾNG VIỆT (để hiểu rõ)

5. PHÂN TÍCH
   - Từ vựng đáng học.
   - Cấu trúc hay.

ĐỊNH DẠNG:
- Đoạn văn liền mạch.
- Từ vựng khó in đậm.`,
    long: true,
  },
  {
    id: 'en-05',
    cat: 'anh',
    title: 'Sửa lỗi ngữ pháp trong bài viết',
    desc: 'Chỉ ra lỗi, giải thích và viết lại đúng. Có bảng lỗi thường gặp.',
    tags: ['sửa bài', 'chi tiết'],
    prompt: `Sửa lỗi ngữ pháp trong bài viết tiếng Anh:

{{bài viết}}

YÊU CẦU:

1. LIỆT KÊ LỖI
   | STT | Lỗi | Loại lỗi | Sửa lại | Giải thích |

2. PHÂN TÍCH
   - Vì sao sai?
   - Quy tắc ngữ pháp bị vi phạm.

3. BẢN ĐÃ SỬA
   - Viết lại toàn bộ, đánh dấu chỗ sửa.

4. LỖI PHỔ BIẾN
   - 5 lỗi người Việt hay mắc khi viết tiếng Anh.

5. GỢI Ý CẢI THIỆN
   - Cách viết tự nhiên hơn.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'en-06',
    cat: 'anh',
    title: 'Luyện hội thoại tiếng Anh',
    desc: 'AI đóng vai, nói ngắn và sửa lỗi sau mỗi lượt. Có gợi ý chủ đề.',
    tags: ['speaking', 'chi tiết'],
    prompt: `Bạn là giáo viên dạy tiếng Anh cho học sinh trình độ {{trình độ}}. Hãy đóng vai để luyện hội thoại.

VAI BẠN ĐÓNG: {{vai}}
CHỦ ĐỀ: {{chủ đề}}
MỤC TIÊU: {{mục tiêu}}

QUY TẮC:

1. MỖI LƯỢT BẠN CHỈ NÓI 1-2 CÂU
2. SAU MỖI LƯỢT CỦA HỌC SINH
   - Sửa lỗi theo dạng:
     ❌ Câu sai: [...]
     ✅ Câu đúng: [...]
     💡 Lý do: [...]
3. DUY TRÌ HỘI THOẠI
4. GHI CHÚ TỪ VỰNG MỚI (tối đa 3 từ/lượt)
5. KẾT THÚC: tóm tắt điểm mạnh, điểm yếu, bài tập.

BẮT ĐẦU: Chào hỏi ngắn và đặt câu hỏi đầu tiên.`,
    long: true,
  },
  {
    id: 'en-07',
    cat: 'anh',
    title: 'Dịch Việt → Anh tự nhiên',
    desc: 'Dịch sát nghĩa, giữ giọng điệu, có phân tích sắc thái.',
    tags: ['dịch', 'chi tiết'],
    prompt: `Dịch đoạn văn tiếng Việt sau sang tiếng Anh:

{{đoạn văn}}

NGỮ CẢNH: {{ngữ cảnh}}
GIỌNG ĐIỆU: {{giọng điệu}}

YÊU CẦU:

1. BẢN DỊCH CHÍNH
   - Tự nhiên, không word-by-word.
2. 3 CHỖ CÓ NHIỀU CÁCH DỊCH
   - Cách 1 + sắc thái.
   - Cách 2 + sắc thái.
   - Khuyến nghị.
3. GHI CHÚ TỪ VỰNG
   - 5-7 từ vựng đáng học.
4. NGỮ PHÁP
   - Cấu trúc đặc biệt.
5. BẢN DỊCH NGƯỢC (nếu cần)

ĐỊNH DẠNG:
- Bản dịch trong block riêng.`,
    long: true,
  },
  {
    id: 'en-08',
    cat: 'anh',
    title: 'Luyện phát âm theo IPA',
    desc: 'Phân tích phiên âm IPA, trọng âm, âm khó với người Việt.',
    tags: ['phát âm', 'chi tiết'],
    prompt: `Hướng dẫn phát âm cho từ/câu tiếng Anh sau:

"{{từ hoặc câu}}"

YÊU CẦU:

1. PHIÊN ÂM IPA
   - Viết phiên âm đầy đủ.
2. PHÂN TÍCH ÂM
   - Nguyên âm, phụ âm.
   - Âm nào khó với người Việt?
3. TRỌNG ÂM
   - Trọng âm chính, phụ.
   - Quy tắc trọng âm (nếu có).
4. LUYỆN TẬP
   - 5 từ tương tự để luyện.
5. LỖI THƯỜNG MẮC
   - Người Việt hay phát âm sai như thế nào?

ĐỊNH DẠNG:
- IPA rõ ràng, có ví dụ.`,
    long: true,
  },
  {
    id: 'en-09',
    cat: 'anh',
    title: 'Tạo đề trắc nghiệm tiếng Anh',
    desc: 'Đề có đáp án và giải thích, chia 3 mức độ.',
    tags: ['quiz', 'chi tiết'],
    prompt: `Tạo đề trắc nghiệm tiếng Anh cho học sinh {{trình độ}}.

CHUYÊN ĐỀ: {{chuyên đề}}
SỐ CÂU: {{số câu}}

CẤU TRÚC:
- 40% nhận biết (ngữ pháp cơ bản)
- 40% thông hiểu (đọc hiểu, từ vựng)
- 20% vận dụng (viết lại câu)

YÊU CẦU:
1. Mỗi câu có 4 đáp án A, B, C, D.
2. Đáp án nhiễu hợp lý.
3. Bảng đáp án + giải thích.

ĐỊNH DẠNG:
- Tiếng Anh in đậm, giải thích tiếng Việt.`,
    long: true,
  },
  {
    id: 'en-10',
    cat: 'anh',
    title: 'Đọc hiểu đoạn văn tiếng Anh',
    desc: 'Phân tích đoạn đọc, từ vựng, câu hỏi và đáp án.',
    tags: ['reading', 'chi tiết'],
    prompt: `Hướng dẫn đọc hiểu đoạn văn tiếng Anh:

{{đoạn văn}}

YÊU CẦU:

1. TÓM TẮT NỘI DUNG (2-3 câu tiếng Việt)
2. TỪ VỰNG KHÓ (8-10 từ)
3. CẤU TRÚC NGỮ PHÁP
4. CÂU HỎI ĐỌC HIỂU (5 câu)
   - 2 câu hỏi chi tiết.
   - 2 câu hỏi suy luận.
   - 1 câu hỏi về ý chính.
5. ĐÁP ÁN + GIẢI THÍCH
6. KỸ NĂNG
   - Cách skim, scan.
   - Cách đoán từ từ ngữ cảnh.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'en-11',
    cat: 'anh',
    title: 'Viết email tiếng Anh',
    desc: 'Email tiếng Anh theo mục đích: xin lỗi, cảm ơn, thương lượng.',
    tags: ['email', 'chi tiết'],
    prompt: `Viết email tiếng Anh cho mục đích:

{{mục đích}}

NGỮ CẢNH: {{ngữ cảnh}}
NGƯỜI NHẬN: {{người nhận}}

YÊU CẦU:

1. TIÊU ĐỀ EMAIL (subject line)
2. LỜI CHÀO
   - Formal: Dear Mr/Ms…
   - Semi-formal: Dear [Name]
3. NỘI DUNG
   - Mục đích rõ ràng.
   - 2-3 ý chính.
   - Lời đề nghị / đề xuất.
4. KẾT EMAIL
   - Best regards / Yours sincerely.
   - Chữ ký.
5. GHI CHÚ
   - Từ vựng formal.
   - Lỗi cần tránh.

ĐỘ DÀI: 100-150 từ.

ĐỊNH DẠNG:
- Đánh dấu rõ từng phần.`,
    long: true,
  },
  {
    id: 'en-12',
    cat: 'anh',
    title: 'So sánh các thì tiếng Anh',
    desc: 'So sánh 2 thì dễ nhầm: hiện tại hoàn thành vs quá khứ đơn, v.v.',
    tags: ['ngữ pháp', 'chi tiết'],
    prompt: `So sánh 2 thì tiếng Anh:

THÌ A: {{thì A}}
THÌ B: {{thì B}}

YÊU CẦU:

1. BẢNG SO SÁNH
   | Tiêu chí | Thì A | Thì B |
   - Công thức.
   - Cách dùng.
   - Dấu hiệu nhận biết.
   - Ví dụ.

2. KHI NÀO DÙNG A, KHI NÀO DÙNG B
3. VÍ DỤ ĐỐI CHIẾU
   - 3 cặp câu cùng ngữ cảnh.
4. LỖI HAY NHẦM
5. BÀI TẬP PHÂN BIỆT (5 câu) + đáp án

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'en-13',
    cat: 'anh',
    title: 'Học thành ngữ tiếng Anh',
    desc: '15 thành ngữ theo chủ đề, có nghĩa và ví dụ.',
    tags: ['idioms', 'chi tiết'],
    prompt: `Dạy 15 thành ngữ tiếng Anh theo chủ đề:

"{{chủ đề}}"

YÊU CẦU:

VỚI MỖI THÀNH NGỮ:
1. Thành ngữ
2. Nghĩa tiếng Việt
3. Nghĩa đen (literal meaning)
4. Ví dụ + dịch
5. Tình huống sử dụng
6. Thành ngữ tương đương trong tiếng Việt (nếu có)

SẮP XẾP: Từ phổ biến → ít phổ biến.

CUỐI BÀI:
- 5 câu hỏi + đáp án.
- Mẹo ghi nhớ.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'en-14',
    cat: 'anh',
    title: 'Luyện viết lại câu (transformation)',
    desc: 'Viết lại câu giữ nguyên nghĩa, có 5 dạng phổ biến.',
    tags: ['writing', 'chi tiết'],
    prompt: `Luyện viết lại câu tiếng Anh.

CÂU GỐC: "{{câu gốc}}"

YÊU CẦU:

1. 5 CÁCH VIẾT LẠI
   - Đảo ngữ (inversion).
   - Bị động (passive voice).
   - Mệnh đề quan hệ (relative clause).
   - Điều kiện (conditional).
   - Danh động từ (gerund).

2. GIẢI THÍCH
   - Vì sao cách viết này tương đương?
   - Khác biệt sắc thái (nếu có).

3. BÀI TẬP TƯƠNG TỰ
   - 5 câu viết lại + đáp án.

ĐỊNH DẠNG:
- Tiếng Anh in đậm.`,
    long: true,
  },
  {
    id: 'en-15',
    cat: 'anh',
    title: 'Ôn tập từ vựng theo chủ đề lớn',
    desc: 'Tổng hợp 50 từ vựng theo chủ đề lớn, có phân loại.',
    tags: ['từ vựng', 'chi tiết'],
    prompt: `Tổng hợp 50 từ vựng tiếng Anh chủ đề "{{chủ đề lớn}}".

YÊU CẦU:

1. CHIA 5 NHÓM NHỎ
   - Mỗi nhóm 10 từ.
2. VỚI MỖI TỪ
   - Từ + IPA + từ loại + nghĩa.
   - Ví dụ ngắn.
3. PHÂN LOẠI ĐỘ KHÓ
   - ★ A2, ★★ B1, ★★★ B2-C1.
4. BÀI TẬP TỔNG HỢP (10 câu) + đáp án
5. MẸO GHI NHỚ

ĐỊNH DẠNG:
- Bảng rõ ràng, nhóm rõ.`,
    long: true,
  },
  {
    id: 'en-16',
    cat: 'anh',
    title: 'Phân biệt từ dễ nhầm',
    desc: 'Phân biệt cặp từ dễ nhầm: affect/effect, lay/lie, since/for…',
    tags: ['từ vựng', 'chi tiết'],
    prompt: `Phân biệt 2 từ tiếng Anh dễ nhầm:

TỪ A: "{{từ A}}"
TỪ B: "{{từ B}}"

YÊU CẦU:

1. ĐỊNH NGHĨA
   - Nghĩa của A.
   - Nghĩa của B.
2. TỪ LOẠI
3. CÁCH DÙNG
   - Khi nào dùng A, khi nào dùng B?
4. VÍ DỤ ĐỐI CHIẾU
   - 5 cặp câu.
5. LỖI HAY NHẦM
6. BÀI TẬP PHÂN BIỆT (5 câu) + đáp án

ĐỊNH DẠNG:
- Bảng so sánh.`,
    long: true,
  },
  {
    id: 'en-17',
    cat: 'anh',
    title: 'Viết luận IELTS Task 2',
    desc: 'Viết bài luận 250 từ theo cấu trúc IELTS, có band descriptor.',
    tags: ['IELTS', 'writing', 'chi tiết'],
    prompt: `Viết bài luận IELTS Task 2 cho đề bài:

"{{đề bài}}"

YÊU CẦU:

1. PHÂN TÍCH ĐỀ
   - Dạng: opinion, discussion, problem-solution?
   - Từ khóa.
2. DÀN Ý
   - Introduction: paraphrase + thesis.
   - Body 1: main idea 1 + example.
   - Body 2: main idea 2 + example.
   - Conclusion: summary + opinion.
3. BÀI LUẬN HOÀN CHỈNH (250-300 từ)
4. PHÂN TÍCH BAND
   - Task Achievement.
   - Coherence & Cohesion.
   - Lexical Resource.
   - Grammatical Range.
5. TỪ VỰNG HỌC ĐƯỢC (10-15 từ)

ĐỊNH DẠNG:
- Từ vựng nâng cao in đậm.`,
    long: true,
  },
  {
    id: 'en-18',
    cat: 'anh',
    title: 'Luyện nghe chép chính tả (dictation)',
    desc: 'Nghe và chép chính tả, có transcript và phân tích lỗi.',
    tags: ['nghe', 'chi tiết'],
    prompt: `Luyện nghe chép chính tả tiếng Anh.

NỘI DUNG (transcript gốc):
{{transcript}}

YÊU CẦU:

1. HƯỚNG DẪN NGHE
   - Nghe lần 1: nắm ý chính.
   - Nghe lần 2: chép từng câu.
   - Nghe lần 3: kiểm tra.
2. TRANSCRIPT CHÍNH XÁC
3. PHÂN TÍCH
   - Từ khó nghe.
   - Hiện tượng phát âm.
   - Lỗi dễ mắc.
4. BÀI TẬP TỰ KIỂM TRA
   - Điền từ vào chỗ trống.
5. MẸO LUYỆN NGHE

ĐỊNH DẠNG:
- Transcript trong block riêng.`,
    long: true,
  },
  {
    id: 'en-19',
    cat: 'anh',
    title: 'Viết CV tiếng Anh',
    desc: 'CV tiếng Anh theo chuẩn quốc tế, có gợi ý từng phần.',
    tags: ['CV', 'chi tiết'],
    prompt: `Viết CV tiếng Anh cho vị trí:

"{{vị trí}}"

THÔNG TIN:
- Tên: {{tên}}
- Kinh nghiệm: {{kinh nghiệm}}
- Kỹ năng: {{kỹ năng}}

YÊU CẦU:

1. HEADER
   - Name, contact info, LinkedIn.
2. PROFESSIONAL SUMMARY (2-3 câu)
3. WORK EXPERIENCE
   - Company, position, dates.
   - 3-5 bullet points với thành tựu (số liệu cụ thể).
4. EDUCATION
5. SKILLS
6. CERTIFICATIONS (nếu có)
7. LỜI KHUYÊN
   - Từ vựng action verbs.
   - Lỗi cần tránh.

ĐỘ DÀI: 1 trang A4.

ĐỊNH DẠNG:
- Cấu trúc CV rõ ràng.`,
    long: true,
  },
  {
    id: 'en-20',
    cat: 'anh',
    title: 'Học cụm động từ (phrasal verbs)',
    desc: '15 phrasal verbs theo chủ đề, có nghĩa và ví dụ.',
    tags: ['phrasal verbs', 'chi tiết'],
    prompt: `Dạy 15 phrasal verbs tiếng Anh theo chủ đề:

"{{chủ đề}}"

YÊU CẦU:

VỚI MỖI PHRASAL VERB:
1. Phrasal verb + IPA
2. Nghĩa tiếng Việt (có thể có nhiều nghĩa)
3. Loại (transitive/intransitive, separable/inseparable)
4. Ví dụ + dịch
5. Tình huống sử dụng
6. Từ đồng nghĩa

SẮP XẾP: Từ phổ biến → ít phổ biến.

CUỐI BÀI:
- 5 câu hỏi + đáp án.
- Mẹo ghi nhớ.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'en-21',
    cat: 'anh',
    title: 'Luyện đọc hiểu nâng cao',
    desc: 'Đọc hiểu văn bản dài, câu hỏi suy luận và từ vựng học thuật.',
    tags: ['reading', 'chi tiết'],
    prompt: `Luyện đọc hiểu tiếng Anh nâng cao:

{{đoạn văn}}

YÊU CẦU:

1. SKIMMING (2 phút)
   - Ý chính đoạn văn.
2. SCANNING
   - Tìm thông tin cụ thể.
3. TỪ VỰNG HỌC THUẬT (10-15 từ)
4. CÂU HỎI ĐỌC HIỂU (7 câu)
   - 3 câu hỏi chi tiết.
   - 2 câu hỏi suy luận.
   - 1 câu hỏi về thái độ tác giả.
   - 1 câu hỏi về ý chính.
5. ĐÁP ÁN + GIẢI THÍCH
6. KỸ NĂNG
   - Cách đọc nhanh.
   - Cách đoán từ.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'en-22',
    cat: 'anh',
    title: 'Học cấu trúc câu nâng cao',
    desc: 'Cấu trúc câu phức: đảo ngữ, câu chẻ, mệnh đề quan hệ rút gọn.',
    tags: ['ngữ pháp', 'chi tiết'],
    prompt: `Dạy cấu trúc câu nâng cao tiếng Anh.

CẤU TRÚC: "{{cấu trúc}}"

YÊU CẦU:

1. ĐỊNH NGHĨA
2. CÔNG THỨC
3. CÁCH DÙNG
   - Khi nào dùng?
   - Trong văn viết hay nói?
4. VÍ DỤ (5 câu)
   - Có dịch tiếng Việt.
5. SO SÁNH VỚI CÁCH VIẾT THÔNG THƯỜNG
6. LỖI HAY MẮC
7. BÀI TẬP (5 câu) + đáp án

ĐỊNH DẠNG:
- Công thức rõ ràng.`,
    long: true,
  },
  {
    id: 'en-23',
    cat: 'anh',
    title: 'Luyện nói theo chủ đề',
    desc: 'Luyện nói theo chủ đề với câu hỏi và câu trả lời mẫu.',
    tags: ['speaking', 'chi tiết'],
    prompt: `Luyện nói tiếng Anh theo chủ đề:

"{{chủ đề}}"

TRÌNH ĐỘ: {{trình độ}}

YÊU CẦU:

1. TỪ VỰNG CHỦ ĐỀ (10-15 từ)
2. 10 CÂU HỎI THƯỜNG GẶP
3. CÂU TRẢ LỜI MẪU (cho 3-5 câu)
   - Cấu trúc: Answer + Reason + Example.
4. CỤM TỪ HỮU ÍCH
5. BÀI TẬP TỰ LUYỆN
   - 5 câu hỏi để tự trả lời.
6. MẸO NÓI TỰ NHIÊN

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'en-24',
    cat: 'anh',
    title: 'Ôn tập ngữ pháp trọng tâm lớp 10',
    desc: 'Tổng hợp ngữ pháp lớp 10: thì, câu điều kiện, câu bị động.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp ngữ pháp tiếng Anh lớp 10.

YÊU CẦU:

1. CÁC THÌ CƠ BẢN
2. CÂU BỊ ĐỘNG
3. CÂU ĐIỀU KIỆN (loại 1, 2, 3)
4. CÂU TƯỜNG THUẬT
5. MỆNH ĐỀ QUAN HỆ
6. SO SÁNH

MỖI PHẦN:
- Công thức.
- Cách dùng.
- Ví dụ.
- Lỗi hay mắc.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'en-25',
    cat: 'anh',
    title: 'Ôn tập ngữ pháp trọng tâm lớp 11',
    desc: 'Tổng hợp ngữ pháp lớp 11.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp ngữ pháp tiếng Anh lớp 11.

YÊU CẦU:

1. CÁC THÌ NÂNG CAO
2. CÂU CHẺ (cleft sentence)
3. ĐẢO NGỮ (inversion)
4. RÚT GỌN MỆNH ĐỀ
5. CẤU TRÚC ĐẶC BIỆT

MỖI PHẦN: công thức, cách dùng, ví dụ, lỗi.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'en-26',
    cat: 'anh',
    title: 'Ôn tập ngữ pháp trọng tâm lớp 12',
    desc: 'Tổng hợp ngữ pháp lớp 12.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp ngữ pháp tiếng Anh lớp 12.

YÊU CẦU:

1. CÁC THÌ VÀ SỰ PHỐI HỢP THÌ
2. CÂU ĐIỀU KIỆN HỖN HỢP
3. CÂU ƯỚC
4. ĐẢO NGỮ NÂNG CAO
5. CẤU TRÚC CÂU PHỨC

MỖI PHẦN: công thức, ví dụ, lỗi.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'en-27',
    cat: 'anh',
    title: 'Hướng dẫn giải đề thi THPT tiếng Anh',
    desc: 'Chiến lược làm bài, phân bổ thời gian, giải mẫu.',
    tags: ['luyện thi', 'chi tiết'],
    prompt: `Hướng dẫn giải đề thi THPT Quốc gia môn tiếng Anh.

ĐỀ THI:
{{đề thi}}

YÊU CẦU:
1. Phân tích cấu trúc đề (phát âm, ngữ pháp, đọc hiểu, viết).
2. Phân bổ thời gian.
3. Chiến lược làm từng phần.
4. Giải mẫu 10 câu đại diện.
5. Nhận xét đề.
6. Lời khuyên phòng thi.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'en-28',
    cat: 'anh',
    title: 'Học cụm từ cố định (collocations)',
    desc: '20 collocations theo chủ đề, có ví dụ và phân loại.',
    tags: ['collocations', 'chi tiết'],
    prompt: `Dạy 20 collocations tiếng Anh theo chủ đề:

"{{chủ đề}}"

YÊU CẦU:

VỚI MỖI COLLOCATION:
1. Cụm từ + IPA
2. Nghĩa tiếng Việt
3. Ví dụ + dịch
4. Từ kết hợp (verb + noun, adj + noun…)
5. Lỗi hay mắc

SẮP XẾP: Theo tần suất.

CUỐI BÀI:
- 5 câu hỏi + đáp án.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'en-29',
    cat: 'anh',
    title: 'Luyện dịch Anh → Việt tự nhiên',
    desc: 'Dịch đoạn văn tiếng Anh sang tiếng Việt tự nhiên.',
    tags: ['dịch', 'chi tiết'],
    prompt: `Dịch đoạn văn tiếng Anh sau sang tiếng Việt:

{{đoạn văn}}

YÊU CẦU:

1. BẢN DỊCH CHÍNH
   - Tự nhiên, không word-by-word.
2. 3 CHỖ CÓ NHIỀU CÁCH DỊCH
   - Cách 1 + sắc thái.
   - Cách 2 + sắc thái.
   - Khuyến nghị.
3. GHI CHÚ TỪ VỰNG
4. GHI CHÚ NGỮ PHÁP
5. BẢN DỊCH THAY THẾ (nếu có)

ĐỊNH DẠNG:
- Bản dịch trong block riêng.`,
    long: true,
  },
  {
    id: 'en-30',
    cat: 'anh',
    title: 'Sinh đề tự luyện tiếng Anh theo dạng',
    desc: 'AI sinh đề tự luyện theo dạng bài bạn chọn, có đáp án và lời giải.',
    tags: ['tự luyện', 'chi tiết'],
    prompt: `Sinh đề tự luyện tiếng Anh cho học sinh {{trình độ}}.

DẠNG BÀI: {{dạng bài}}
SỐ BÀI: {{số bài}}
ĐỘ KHÓ: {{độ khó}}

YÊU CẦU:
1. Chia độ khó (40% dễ, 40% trung bình, 20% nâng cao).
2. Mỗi bài có đề rõ ràng.
3. Bảng đáp án + lời giải ngắn.
4. Đa dạng, không trùng.
5. Lời khuyên luyện tập.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
];