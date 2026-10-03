
export const HOC_SINH = [
  {
    id: 'sinh-01',
    cat: 'sinh',
    title: 'Giải thích khái niệm Sinh học dễ hiểu',
    desc: 'Gia sư giải thích khái niệm kèm ví dụ đời sống, sơ đồ minh họa và lỗi hay mắc.',
    tags: ['lý thuyết', 'gia sư', 'chi tiết'],
    prompt: `Bạn là gia sư Sinh học kiên nhẫn, đang dạy cho học sinh {{lớp}}.

NHIỆM VỤ: Giải thích khái niệm "{{khái niệm}}" một cách dễ hiểu.

YÊU CẦU:

1. ĐỊNH NGHĨA NGẮN (dưới 50 từ)
2. VÍ DỤ ĐỜI SỐNG (1 ví dụ, 2-3 câu)
3. SƠ ĐỒ MINH HỌA (mô tả bằng chữ hoặc ký tự Unicode)
4. BA LỖI HỌC SINH HAY MẮC
5. TỰ KIỂM TRA (2 câu hỏi)

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Độ dài: 400-600 từ.`,
    sample: 'ADN giống như "bản thiết kế" của cơ thể: mọi đặc điểm từ màu mắt đến chiều cao đều được mã hóa trong chuỗi xoắn kép này, giống như một cuốn sách hướng dẫn lắp ráp…',
    long: true,
  },
  {
    id: 'sinh-02',
    cat: 'sinh',
    title: 'Giải bài tập Sinh học từng bước',
    desc: 'Lời giải có công thức, phân tích đề, kiểm tra lại. Có tóm tắt dữ kiện.',
    tags: ['bài tập', 'chi tiết'],
    prompt: `Giải bài tập Sinh học cho học sinh {{lớp}}:

{{đề bài}}

YÊU CẦU:

BƯỚC 1 — PHÂN TÍCH ĐỀ
- Liệt kê dữ kiện.
- Xác định dạng bài (di truyền, sinh thái, tế bào…).

BƯỚC 2 — CÔNG THỨC / QUY LUẬT
- Nêu công thức di truyền hoặc quy luật áp dụng.

BƯỚC 3 — GIẢI CHI TIẾT
- Từng bước rõ ràng.

BƯỚC 4 — KIỂM TRA LẠI
- Kiểm tra tỉ lệ, số lượng.

BƯỚC 5 — MỞ RỘNG

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết Aa, ×, →.`,
    long: true,
  },
  {
    id: 'sinh-03',
    cat: 'sinh',
    title: 'Tạo đề trắc nghiệm Sinh học',
    desc: 'Đề có đáp án và giải thích, phân bố 3 mức độ.',
    tags: ['quiz', 'chi tiết'],
    prompt: `Tạo đề trắc nghiệm Sinh học cho học sinh {{lớp}}.

CHUYÊN ĐỀ: {{chuyên đề}}
SỐ CÂU: {{số câu}}

CẤU TRÚC:
- 40% nhận biết
- 40% thông hiểu
- 20% vận dụng

YÊU CẦU:
1. Mỗi câu có 4 đáp án A, B, C, D.
2. Đáp án nhiễu hợp lý.
3. Đáp án đúng phân bố đều.
4. Bảng đáp án + giải thích.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-04',
    cat: 'sinh',
    title: 'Tìm lỗi sai trong bài giải Sinh học',
    desc: 'Chỉ ra bước sai, phân tích nguyên nhân gốc và bài tương tự.',
    tags: ['sửa bài', 'chi tiết'],
    prompt: `Chấm bài Sinh học cho học sinh {{lớp}}.

ĐỀ BÀI: {{đề bài}}
BÀI LÀM: {{bài làm}}

YÊU CẦU:
1. Xác định bước sai đầu tiên.
2. Giải thích nguyên nhân.
3. Lời giải đúng.
4. Bài tương tự.
5. Lời khuyên.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-05',
    cat: 'sinh',
    title: 'Tóm tắt chương Sinh học thành sơ đồ',
    desc: 'Sơ đồ cây kiến thức + 10 khái niệm quan trọng.',
    tags: ['tóm tắt', 'chi tiết'],
    prompt: `Tóm tắt chương "{{chương}}" Sinh học {{lớp}}.

YÊU CẦU:
1. Sơ đồ cây kiến thức (dạng text tree).
2. Bảng so sánh (nếu có).
3. 10 khái niệm quan trọng.
4. Mẹo ghi nhớ.
5. Bài tập tự kiểm tra.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-06',
    cat: 'sinh',
    title: 'Giải bài toán di truyền Mendel',
    desc: 'Lai 1 cặp, 2 cặp tính trạng. Xác định kiểu gen, kiểu hình.',
    tags: ['di truyền', 'chi tiết'],
    prompt: `Giải bài toán di truyền Mendel:

{{đề bài}}

YÊU CẦU:
1. Xác định kiểu gen bố mẹ.
2. Viết sơ đồ lai (P, G, F₁, F₂).
3. Xác định tỉ lệ kiểu gen, kiểu hình.
4. Nếu có tương tác gen, giải thích.
5. Nhận xét.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết Aa × AA.`,
    long: true,
  },
  {
    id: 'sinh-07',
    cat: 'sinh',
    title: 'Giải bài toán di truyền liên kết và hoán vị gen',
    desc: 'Liên kết gen, hoán vị gen, tần số hoán vị.',
    tags: ['di truyền', 'chi tiết'],
    prompt: `Giải bài toán di truyền liên kết / hoán vị:

{{đề bài}}

YÊU CẦU:
1. Xác định gen liên kết hay hoán vị.
2. Công thức tần số hoán vị: f = (số cá thể hoán vị / tổng số) × 100%
3. Viết sơ đồ lai.
4. Xác định tỉ lệ kiểu hình.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-08',
    cat: 'sinh',
    title: 'Giải bài toán ADN, ARN, protein',
    desc: 'Tính số nucleotit, chiều dài gen, số axit amin.',
    tags: ['phân tử', 'chi tiết'],
    prompt: `Giải bài toán ADN — ARN — Protein:

{{đề bài}}

YÊU CẦU:
1. Công thức:
   - N = 2A + 2G (tổng số nu)
   - L = N/2 × 3,4 Å (chiều dài)
   - Số axit amin = N/(2×3) − 1
2. Nguyên tắc bổ sung: A-T, G-X (ADN); A-U, G-X (ARN).
3. Giải chi tiết.
4. Kiểm tra đơn vị.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết Å, →.`,
    long: true,
  },
  {
    id: 'sinh-09',
    cat: 'sinh',
    title: 'Giải bài toán đột biến gen và NST',
    desc: 'Đột biến gen, đột biến cấu trúc NST, đột biến số lượng NST.',
    tags: ['đột biến', 'chi tiết'],
    prompt: `Giải bài toán đột biến:

{{đề bài}}

YÊU CẦU:
1. Xác định dạng đột biến (gen / NST).
2. Nếu đột biến gen:
   - Thay thế, thêm, mất cặp nucleotit.
   - Ảnh hưởng đến protein.
3. Nếu đột biến NST:
   - Mất đoạn, lặp đoạn, đảo đoạn, chuyển đoạn.
   - Đa bội, dị bội (thể 3, thể 1).
4. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-10',
    cat: 'sinh',
    title: 'Giải bài toán quần thể (di truyền học quần thể)',
    desc: 'Định luật Hardy-Weinberg, tính tần số alen, kiểu gen.',
    tags: ['quần thể', 'chi tiết'],
    prompt: `Giải bài toán di truyền quần thể:

{{đề bài}}

YÊU CẦU:
1. Công thức Hardy-Weinberg:
   p² + 2pq + q² = 1
   - p = tần số alen A
   - q = tần số alen a
   - p + q = 1
2. Tính tần số alen và kiểu gen.
3. Kiểm tra quần thể có cân bằng không.
4. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết p², q².`,
    long: true,
  },
  {
    id: 'sinh-11',
    cat: 'sinh',
    title: 'Giải bài toán sinh thái học',
    desc: 'Chuỗi thức ăn, lưới thức ăn, hiệu suất sinh thái.',
    tags: ['sinh thái', 'chi tiết'],
    prompt: `Giải bài toán sinh thái:

{{đề bài}}

YÊU CẦU:
1. Xác định dạng bài:
   - Chuỗi / lưới thức ăn.
   - Hiệu suất sinh thái.
   - Tính năng lượng qua các bậc dinh dưỡng.
2. Công thức:
   - Hiệu suất sinh thái: H = (năng lượng bậc sau / năng lượng bậc trước) × 100%
3. Giải chi tiết.
4. Nhận xét.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-12',
    cat: 'sinh',
    title: 'Giải bài toán tế bào học',
    desc: 'Nguyên phân, giảm phân, số NST, số tế bào con.',
    tags: ['tế bào', 'chi tiết'],
    prompt: `Giải bài toán tế bào học:

{{đề bài}}

YÊU CẦU:
1. Xác định quá trình (nguyên phân / giảm phân).
2. Công thức:
   - Nguyên phân: 1 tế bào → 2ⁿ tế bào con (n là số lần phân chia).
   - Giảm phân: 1 tế bào → 4 tế bào con (n NST đơn bội).
3. Số NST trong mỗi tế bào con.
4. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết 2ⁿ, NST.`,
    long: true,
  },
  {
    id: 'sinh-13',
    cat: 'sinh',
    title: 'Giải bài toán hô hấp và quang hợp',
    desc: 'Phương trình hô hấp, quang hợp, hiệu suất quang hợp.',
    tags: ['sinh lý', 'chi tiết'],
    prompt: `Giải bài toán hô hấp / quang hợp:

{{đề bài}}

YÊU CẦU:
1. Phương trình:
   - Quang hợp: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
   - Hô hấp: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + năng lượng
2. Tính theo khối lượng chất.
3. Giải chi tiết.
4. Nhận xét hiệu suất.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết CO₂, H₂O.`,
    long: true,
  },
  {
    id: 'sinh-14',
    cat: 'sinh',
    title: 'Giải bài toán về hệ sinh thái',
    desc: 'Tính năng lượng, sinh khối, mật độ quần thể.',
    tags: ['sinh thái', 'chi tiết'],
    prompt: `Giải bài toán hệ sinh thái:

{{đề bài}}

YÊU CẦU:
1. Xác định dạng bài.
2. Công thức:
   - Mật độ = số cá thể / diện tích (hoặc thể tích).
   - Sinh khối = khối lượng / diện tích.
3. Giải chi tiết.
4. Vẽ chuỗi / lưới thức ăn (nếu có).

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-15',
    cat: 'sinh',
    title: 'Tổng hợp công thức Sinh học 10',
    desc: 'Công thức trọng tâm lớp 10: tế bào, sinh học phân tử.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp công thức Sinh học 10.

YÊU CẦU:
1. Thành phần hóa học tế bào
2. Cấu trúc tế bào
3. Chuyển hóa vật chất và năng lượng
4. Phân bào (nguyên phân, giảm phân)
5. Vi sinh vật

Mỗi phần có:
- Công thức chính.
- Đơn vị.
- Khi nào dùng.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-16',
    cat: 'sinh',
    title: 'Tổng hợp công thức Sinh học 11',
    desc: 'Công thức trọng tâm lớp 11: sinh lý thực vật và động vật.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp công thức Sinh học 11.

YÊU CẦU:
1. Chuyển hóa vật chất và năng lượng ở thực vật
2. Chuyển hóa vật chất và năng lượng ở động vật
3. Cảm ứng ở thực vật và động vật
4. Sinh trưởng và phát triển
5. Sinh sản

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-17',
    cat: 'sinh',
    title: 'Tổng hợp công thức Sinh học 12',
    desc: 'Công thức trọng tâm lớp 12: di truyền, tiến hóa, sinh thái.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp công thức Sinh học 12.

YÊU CẦU:
1. Cơ chế di truyền và biến dị
2. Tính quy luật của hiện tượng di truyền
3. Di truyền học quần thể
4. Ứng dụng di truyền học
5. Di truyền học người
6. Bằng chứng và cơ chế tiến hóa
7. Sinh thái học

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-18',
    cat: 'sinh',
    title: 'Hướng dẫn giải đề thi THPT Sinh học',
    desc: 'Chiến lược làm bài, phân bổ thời gian, giải mẫu.',
    tags: ['luyện thi', 'chi tiết'],
    prompt: `Hướng dẫn giải đề thi THPT Quốc gia môn Sinh học.

ĐỀ THI:
{{đề thi}}

YÊU CẦU:
1. Phân tích cấu trúc đề.
2. Phân bổ thời gian.
3. Chiến lược làm bài.
4. Giải chi tiết 5-10 câu đại diện.
5. Nhận xét đề.
6. Lời khuyên phòng thi.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-19',
    cat: 'sinh',
    title: 'Vẽ sơ đồ chuỗi / lưới thức ăn',
    desc: 'Xây dựng chuỗi và lưới thức ăn từ danh sách sinh vật.',
    tags: ['sinh thái', 'chi tiết'],
    prompt: `Vẽ sơ đồ chuỗi / lưới thức ăn từ danh sách:

{{danh sách sinh vật}}

YÊU CẦU:
1. Phân loại sinh vật:
   - Sinh vật sản xuất.
   - Sinh vật tiêu thụ bậc 1, 2, 3…
   - Sinh vật phân giải.
2. Vẽ chuỗi thức ăn (dùng ký tự →).
3. Vẽ lưới thức ăn (mô tả bằng chữ).
4. Nhận xét mối quan hệ.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'sinh-20',
    cat: 'sinh',
    title: 'Sinh đề tự luyện Sinh học theo dạng',
    desc: 'AI sinh đề tự luyện theo dạng bài bạn chọn, có đáp án và lời giải.',
    tags: ['tự luyện', 'chi tiết'],
    prompt: `Sinh đề tự luyện Sinh học cho học sinh {{lớp}}.

DẠNG BÀI: {{dạng bài}}
SỐ BÀI: {{số bài}}
ĐỘ KHÓ: {{độ khó}}

YÊU CẦU:
1. Chia độ khó (40% dễ, 40% trung bình, 20% nâng cao).
2. Mỗi bài có đề rõ ràng.
3. Bảng đáp án + lời giải ngắn.
4. Đa dạng, không trùng câu hỏi.
5. Lời khuyên luyện tập.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
];