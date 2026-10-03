
export const HOC_TOAN = [
  {
    id: 'toan-01',
    cat: 'toan',
    title: 'Giải thích khái niệm Toán dễ hiểu',
    desc: 'Gia sư giải thích khái niệm kèm ví dụ đời sống, bài tập mẫu và lỗi hay mắc. Cấu trúc 5 phần.',
    tags: ['lý thuyết', 'gia sư', 'chi tiết'],
    prompt: `Bạn là gia sư Toán kiên nhẫn, đang dạy cho học sinh {{lớp}}.

NHIỆM VỤ: Giải thích khái niệm "{{khái niệm}}" một cách dễ hiểu nhất.

YÊU CẦU:

1. ĐỊNH NGHĨA NGẮN (dưới 50 từ)
   - Nêu khái niệm bằng ngôn ngữ đời thường.
   - Tránh thuật ngữ nặng; nếu buộc dùng, giải thích ngay.

2. VÍ DỤ ĐỜI SỐNG (1 ví dụ, 2-3 câu)
   - Chọn ví dụ gần gũi (mua bán, đo đạc, chia bánh…).
   - Chỉ rõ điểm tương đồng với khái niệm.

3. BÀI TẬP MẪU CÓ LỜI GIẢI
   - 1 bài tập đơn giản áp dụng khái niệm.
   - Giải từng bước, mỗi bước ghi rõ:
     • Công thức/định lý dùng
     • Thay số
     • Kết quả

4. BA LỖI HỌC SINH HAY MẮC
   - 3 lỗi phổ biến khi học khái niệm này.
   - Với mỗi lỗi: nguyên nhân + cách tránh.

5. TỰ KIỂM TRA
   - 2 câu hỏi ngắn để học sinh tự kiểm tra (chưa đáp án).

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Công thức viết Unicode: x², √a, ∫, Σ.
- Mỗi phần có tiêu đề rõ ràng.
- Độ dài: 400-600 từ.`,
    sample: 'Đạo hàm giống như tốc độ kim đồng hồ: tại mỗi thời điểm, kim đang chạy nhanh hay chậm. Nếu hàm số là quãng đường, đạo hàm là vận tốc tại đúng thời điểm đó…',
    long: true,
  },
  {
    id: 'toan-02',
    cat: 'toan',
    title: 'Giải bài tập Toán từng bước',
    desc: 'Lời giải có công thức, thay số, kiểm tra lại. Có phân tích dữ kiện trước khi giải.',
    tags: ['bài tập', 'chi tiết'],
    prompt: `Bạn là giáo viên Toán hướng dẫn học sinh {{lớp}} giải bài tập.

ĐỀ BÀI:
{{đề bài}}

YÊU CẦU GIẢI:

BƯỚC 1 — PHÂN TÍCH ĐỀ
- Liệt kê dữ kiện đã cho.
- Xác định đại lượng cần tìm.
- Nêu công thức/định lý sẽ dùng.

BƯỚC 2 — GIẢI CHI TIẾT
- Ghi công thức tổng quát.
- Thay số vào.
- Tính kết quả.
- Đánh số bước 2.1, 2.2…

BƯỚC 3 — KIỂM TRA LẠI
- Kiểm tra kết quả bằng cách khác (thay ngược, ước lượng).
- Kiểm tra điều kiện xác định (mẫu ≠ 0, căn ≥ 0…).

BƯỚC 4 — ĐÁP ÁN CUỐI
- Ghi đáp án rõ ràng, in đậm.

BƯỚC 5 — MỞ RỘNG
- Nếu đổi dữ kiện X thành Y thì kết quả thay đổi thế nào?
- Dạng bài này nhận biết ra sao khi gặp lại?

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết x², √a, Σ.
- Mỗi bước có tiêu đề.`,
    long: true,
  },
  {
    id: 'toan-03',
    cat: 'toan',
    title: 'Tạo đề trắc nghiệm Toán 3 mức độ',
    desc: 'Đề có đáp án và giải thích, chia nhận biết – thông hiểu – vận dụng.',
    tags: ['quiz', 'ôn tập', 'chi tiết'],
    prompt: `Bạn là giáo viên Toán ra đề trắc nghiệm cho học sinh {{lớp}}.

THÔNG TIN ĐỀ:
- Chuyên đề: {{chuyên đề}}
- Số câu: {{số câu}}

CẤU TRÚC:
- 40% nhận biết (nhớ công thức)
- 40% thông hiểu (so sánh, giải thích)
- 20% vận dụng (tính toán, bài toán thực tế)

YÊU CẦU:
1. Mỗi câu có 4 đáp án A, B, C, D.
2. Đáp án nhiễu là lỗi sai thường gặp.
3. Đáp án đúng phân bố đều.
4. Bảng đáp án cuối đề.
5. Giải thích ngắn cho từng câu (1-2 dòng).

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Công thức Unicode.`,
    long: true,
  },
  {
    id: 'toan-04',
    cat: 'toan',
    title: 'Tìm lỗi sai trong bài giải Toán',
    desc: 'AI chỉ ra bước sai, giải thích nguyên nhân gốc và cho bài tương tự.',
    tags: ['sửa bài', 'chi tiết'],
    prompt: `Bạn là giáo viên Toán chấm bài cho học sinh {{lớp}}.

ĐỀ BÀI:
{{đề bài}}

BÀI LÀM:
{{bài làm}}

YÊU CẦU:

1. XÁC ĐỊNH BƯỚC SAI ĐẦU TIÊN
   - Chỉ ra bước sai (đánh số).
   - Trích dẫn phần sai.

2. GIẢI THÍCH NGUYÊN NHÂN
   - Học sinh hiểu nhầm khái niệm gì?
   - Lỗi này thuộc dạng: nhớ nhầm công thức / sai dấu / sai điều kiện / tính toán sai?

3. LỜI GIẢI ĐÚNG
   - Viết lại toàn bộ từ đầu.
   - Giải thích từng bước ngắn gọn.

4. BÀI TƯƠNG TỰ ĐỂ LUYỆN
   - 1 bài cùng dạng, không đáp án.

5. LỜI KHUYÊN
   - Cách tránh lỗi tương tự.

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Phần "Bước sai" in đậm.`,
    long: true,
  },
  {
    id: 'toan-05',
    cat: 'toan',
    title: 'Tóm tắt chương Toán thành sơ đồ',
    desc: 'Khung kiến thức dạng cây và 10 công thức quan trọng nhất.',
    tags: ['tóm tắt', 'sơ đồ', 'chi tiết'],
    prompt: `Tóm tắt chương "{{chương}}" môn Toán cho học sinh {{lớp}}.

YÊU CẦU:

1. SƠ ĐỒ CÂY KIẾN THỨC
   Dạng text tree (├── │ └──):
   - Khái niệm trung tâm
     ├── Định nghĩa
     ├── Công thức chính
     ├── Dạng bài tập 1
     ├── Dạng bài tập 2
     └── Lưu ý hay mắc

2. BẢNG CÔNG THỨC
   | Công thức | Khi nào dùng | Ví dụ |

3. 10 CÔNG THỨC QUAN TRỌNG NHẤT
   - Xếp theo tần suất xuất hiện.

4. MẸO GHI NHỚ
   - 3-5 mẹo.

5. BÀI TẬP TỰ KIỂM TRA
   - 5 câu hỏi ngắn (chưa đáp án).

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Sơ đồ cây dùng Unicode.`,
    long: true,
  },
  {
    id: 'toan-06',
    cat: 'toan',
    title: 'Lịch ôn thi Toán theo tuần',
    desc: 'Chia mục tiêu từng ngày, có đánh giá tiến độ hàng tuần.',
    tags: ['kế hoạch', 'ôn thi', 'chi tiết'],
    prompt: `Lập lịch ôn thi Toán cho học sinh {{lớp}}, kỳ thi {{tên kỳ thi}}.

THÔNG TIN:
- Thời gian còn lại: {{số tuần}} tuần
- Thời gian học mỗi ngày: {{số giờ}} giờ
- Phần yếu: {{phần yếu}}
- Phần khá: {{phần khá}}

YÊU CẦU:

1. MỤC TIÊU TỔNG THỂ
2. PHÂN BỔ THEO TUẦN
   - Trọng tâm, mục tiêu cụ thể, bài kiểm tra cuối tuần.
3. LỊCH TỪNG NGÀY (dạng bảng)
   | Ngày | Buổi | Nội dung | Bài tập | Ghi chú |
   - 15 phút ôn lại hôm trước.
   - Xen kẽ lý thuyết và bài tập.
4. ĐÁNH GIÁ TIẾN ĐỘ CUỐI TUẦN
5. LỜI KHUYÊN

ĐỊNH DẠNG:
- Bảng dùng | và -.`,
    long: true,
  },
  {
    id: 'toan-07',
    cat: 'toan',
    title: 'Giải hệ phương trình',
    desc: 'Giải hệ bằng phương pháp thế, cộng đại số, hoặc đặt ẩn phụ. Có kiểm tra lại.',
    tags: ['đại số', 'chi tiết'],
    prompt: `Giải hệ phương trình sau cho học sinh {{lớp}}:

{{hệ phương trình}}

YÊU CẦU:

1. NHẬN DIỆN DẠNG
   - Hệ bậc nhất 2 ẩn? Bậc cao? Đối xứng?
   - Phương pháp phù hợp: thế, cộng đại số, đặt ẩn phụ, đối xứng.

2. GIẢI CHI TIẾT
   - Từng bước rõ ràng.
   - Ghi rõ phép biến đổi.

3. KIỂM TRA LẠI
   - Thay nghiệm vào hệ ban đầu.
   - Kết luận số nghiệm.

4. MỞ RỘNG
   - Biện luận theo tham số m (nếu có).
   - Dạng bài tương tự.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-08',
    cat: 'toan',
    title: 'Giải phương trình bậc 2 và biện luận',
    desc: 'Tính Δ, biện luận số nghiệm, áp dụng Vi-ét.',
    tags: ['đại số', 'chi tiết'],
    prompt: `Giải và biện luận phương trình bậc 2:

{{phương trình}}

YÊU CẦU:

1. XÁC ĐỊNH HỆ SỐ a, b, c.
2. TÍNH Δ = b² − 4ac
   - Δ > 0: 2 nghiệm phân biệt
   - Δ = 0: nghiệm kép
   - Δ < 0: vô nghiệm
3. CÔNG THỨC NGHIỆM
   - x₁ = (−b + √Δ) / (2a)
   - x₂ = (−b − √Δ) / (2a)
4. ĐỊNH LÝ VI-ÉT (nếu áp dụng)
   - S = x₁ + x₂ = −b/a
   - P = x₁·x₂ = c/a
5. BIỆN LUẬN THEO m (nếu có tham số)
6. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết √Δ, x².`,
    long: true,
  },
  {
    id: 'toan-09',
    cat: 'toan',
    title: 'Tính đạo hàm và ý nghĩa',
    desc: 'Tính đạo hàm, giải thích ý nghĩa hình học và vật lý.',
    tags: ['giải tích', 'chi tiết'],
    prompt: `Tính đạo hàm của hàm số:

y = {{hàm số}}

YÊU CẦU:

1. NHẬN DIỆN DẠNG HÀM
   - Hàm đa thức? Phân thức? Lượng giác? Hợp?

2. ÁP DỤNG CÔNG THỨC
   - Liệt kê công thức đạo hàm dùng.
   - Ví dụ: (xⁿ)' = n·xⁿ⁻¹, (u·v)' = u'v + uv', (u/v)' = (u'v − uv')/v².

3. TÍNH TỪNG BƯỚC
   - Không bỏ qua bước trung gian.

4. Ý NGHĨA
   - Hình học: hệ số góc tiếp tuyến tại điểm x₀.
   - Vật lý: vận tốc tức thời nếu y là quãng đường.

5. BÀI TẬP TƯƠNG TỰ
   - 3 bài cùng dạng.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-10',
    cat: 'toan',
    title: 'Khảo sát và vẽ đồ thị hàm số',
    desc: 'Các bước khảo sát đầy đủ: TXĐ, đạo hàm, cực trị, tiệm cận, bảng biến thiên.',
    tags: ['giải tích', 'chi tiết'],
    prompt: `Khảo sát và vẽ đồ thị hàm số:

y = {{hàm số}}

YÊU CẦU:

1. TẬP XÁC ĐỊNH
2. TÍNH ĐẠO HÀM y'
3. TÌM CỰC TRỊ
   - y' = 0 → nghiệm
   - Lập bảng xét dấu y'
4. TÌM TIỆM CẬN (nếu có)
   - Tiệm cận đứng, ngang, xiên.
5. LẬP BẢNG BIẾN THIÊN
   | x | −∞ | ... | +∞ |
   | y' | | | |
   | y | | | |
6. VẼ ĐỒ THỊ
   - Mô tả hình dạng bằng lời.
   - Chỉ rõ giao điểm với Ox, Oy.
7. NHẬN XÉT
   - Số cực trị, tính đơn điệu.

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Bảng dùng ký tự | và -.`,
    long: true,
  },
  {
    id: 'toan-11',
    cat: 'toan',
    title: 'Giải tích phân và ứng dụng',
    desc: 'Tính tích phân, ứng dụng tính diện tích, thể tích.',
    tags: ['giải tích', 'chi tiết'],
    prompt: `Tính tích phân sau:

∫ {{biểu thức}} dx

YÊU CẦU:

1. NHẬN DIỆN DẠNG
   - Đa thức? Lượng giác? Hàm mũ? Hữu tỷ?
2. CHỌN PHƯƠNG PHÁP
   - Nguyên hàm cơ bản, đổi biến, tích phân từng phần.
3. GIẢI CHI TIẾT
   - Từng bước.
4. ỨNG DỤNG (nếu là tích phân xác định)
   - Diện tích hình phẳng: S = ∫|f(x)| dx
   - Thể tích vật thể tròn xoay: V = π∫f²(x) dx
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết ∫, dx.`,
    long: true,
  },
  {
    id: 'toan-12',
    cat: 'toan',
    title: 'Giải phương trình lượng giác',
    desc: 'Giải phương trình sin, cos, tan, cot, có công thức nghiệm tổng quát.',
    tags: ['lượng giác', 'chi tiết'],
    prompt: `Giải phương trình lượng giác:

{{phương trình}}

YÊU CẦU:

1. ĐIỀU KIỆN XÁC ĐỊNH (nếu có tan, cot)
2. ĐƯA VỀ DẠNG CƠ BẢN
   - sin u = sin v → u = v + k2π hoặc u = π − v + k2π
   - cos u = cos v → u = ±v + k2π
   - tan u = tan v → u = v + kπ
3. GIẢI VÀ TÌM NGHIỆM
   - Liệt kê họ nghiệm tổng quát.
   - Nếu có điều kiện, lọc nghiệm.
4. KIỂM TRA LẠI
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết π, ≠, ≤.`,
    long: true,
  },
  {
    id: 'toan-13',
    cat: 'toan',
    title: 'Chứng minh bất đẳng thức',
    desc: 'Áp dụng Cauchy, Bunhiacopxki, AM-GM. Có phân tích hướng làm.',
    tags: ['bất đẳng thức', 'chi tiết'],
    prompt: `Chứng minh bất đẳng thức sau:

{{bất đẳng thức}}

YÊU CẦU:

1. PHÂN TÍCH ĐỀ
   - Điều kiện của biến.
   - Dạng bất đẳng thức: đối xứng? hoán vị? có điều kiện ràng buộc?
2. CHỌN PHƯƠNG PHÁP
   - AM-GM (Cauchy): a + b ≥ 2√(ab)
   - Bunhiacopxki: (a² + b²)(c² + d²) ≥ (ac + bd)²
   - Cauchy-Schwarz dạng phân thức: a²/x + b²/y ≥ (a+b)²/(x+y)
   - Biến đổi tương đương, phản chứng, quy nạp.
3. CHỨNG MINH CHI TIẾT
   - Từng bước, ghi rõ áp dụng công thức nào.
4. DẤU BẰNG XẢY RA KHI NÀO
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết ≥, ≤, √.`,
    long: true,
  },
  {
    id: 'toan-14',
    cat: 'toan',
    title: 'Giải bài toán hình học không gian',
    desc: 'Tính thể tích, diện tích, khoảng cách, góc. Có vẽ hình bằng mô tả.',
    tags: ['hình học', 'chi tiết'],
    prompt: `Giải bài toán hình học không gian cho học sinh {{lớp}}:

{{đề bài}}

YÊU CẦU:

1. VẼ HÌNH (mô tả bằng lời)
   - Hình dạng: chóp, lăng trụ, nón, cầu?
   - Đáy: tam giác, tứ giác?
   - Chiều cao?
2. XÁC ĐỊNH YẾU TỐ CẦN TÍNH
   - Thể tích V? Diện tích S? Khoảng cách d? Góc?
3. CÔNG THỨC ÁP DỤNG
   - V_chóp = (1/3)·S_đáy·h
   - V_lăng trụ = S_đáy·h
   - V_nón = (1/3)·πr²·h
   - V_cầu = (4/3)·πr³
4. GIẢI CHI TIẾT
5. KIỂM TRA LẠI
6. BÀI TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết π, √, ·.`,
    long: true,
  },
  {
    id: 'toan-15',
    cat: 'toan',
    title: 'Giải bài toán xác suất',
    desc: 'Xác suất cổ điển, xác suất có điều kiện, biến cố độc lập.',
    tags: ['xác suất', 'chi tiết'],
    prompt: `Giải bài toán xác suất:

{{đề bài}}

YÊU CẦU:

1. XÁC ĐỊNH KHÔNG GIAN MẪU Ω
   - Số phần tử n(Ω).
2. XÁC ĐỊNH BIẾN CỐ A
   - Số phần tử n(A).
3. TÍNH XÁC SUẤT
   - P(A) = n(A) / n(Ω)
4. TRƯỜNG HỢP ĐẶC BIỆT
   - Xác suất có điều kiện: P(A|B) = P(A∩B) / P(B)
   - Biến cố độc lập: P(A∩B) = P(A)·P(B)
   - Biến cố đối: P(Ā) = 1 − P(A)
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-16',
    cat: 'toan',
    title: 'Tìm giá trị lớn nhất, nhỏ nhất',
    desc: 'Tìm max/min của hàm số trên đoạn hoặc miền xác định.',
    tags: ['giải tích', 'chi tiết'],
    prompt: `Tìm giá trị lớn nhất (GTLN) và nhỏ nhất (GTNN) của:

y = {{hàm số}} trên {{miền}}

YÊU CẦU:

1. TẬP XÁC ĐỊNH
2. TÍNH ĐẠO HÀM y'
3. TÌM NGHIỆM y' = 0
4. LẬP BẢNG BIẾN THIÊN
5. TÍNH GIÁ TRỊ TẠI CÁC ĐIỂM ĐẶC BIỆT
   - Đầu mút của đoạn.
   - Điểm cực trị.
6. KẾT LUẬN
   - GTLN = ... tại x = ...
   - GTNN = ... tại x = ...

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-17',
    cat: 'toan',
    title: 'Giải bài toán thực tế bằng đạo hàm',
    desc: 'Tối ưu hóa: tìm cực trị trong bài toán thực tế.',
    tags: ['ứng dụng', 'chi tiết'],
    prompt: `Giải bài toán thực tế:

{{đề bài}}

YÊU CẦU:

1. ĐẶT ẨN VÀ ĐIỀU KIỆN
   - Ẩn là gì? Điều kiện của ẩn?
2. LẬP HÀM SỐ MỤC TIÊU
   - Biểu diễn đại lượng cần tối ưu theo ẩn.
3. TÌM CỰC TRỊ
   - Tính đạo hàm.
   - Tìm nghiệm y' = 0.
   - Lập bảng biến thiên.
4. KIỂM TRA ĐIỀU KIỆN
   - Nghiệm có thỏa điều kiện không?
5. KẾT LUẬN
6. NHẬN XÉT
   - Bài toán thuộc dạng tối ưu nào?

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-18',
    cat: 'toan',
    title: 'Giải bài toán dãy số và cấp số',
    desc: 'Cấp số cộng, cấp số nhân, tìm số hạng tổng quát.',
    tags: ['đại số', 'chi tiết'],
    prompt: `Giải bài toán dãy số:

{{đề bài}}

YÊU CẦU:

1. NHẬN DIỆN DẠNG
   - Cấp số cộng (CSC)? Cấp số nhân (CSN)? Dãy số thường?
2. CÔNG THỨC ÁP DỤNG
   - CSC: uₙ = u₁ + (n−1)d; Sₙ = n(u₁+uₙ)/2
   - CSN: uₙ = u₁·qⁿ⁻¹; Sₙ = u₁(qⁿ − 1)/(q − 1)
3. TÌM SỐ HẠNG TỔNG QUÁT (nếu cần)
4. TÍNH TỔNG (nếu cần)
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết u₁, qⁿ, Σ.`,
    long: true,
  },
  {
    id: 'toan-19',
    cat: 'toan',
    title: 'Tìm giới hạn của dãy số / hàm số',
    desc: 'Giới hạn hữu hạn, vô cực, dạng vô định.',
    tags: ['giải tích', 'chi tiết'],
    prompt: `Tính giới hạn:

lim {{biểu thức}}

YÊU CẦU:

1. XÁC ĐỊNH DẠNG
   - Có phải dạng vô định 0/0, ∞/∞, ∞−∞, 0·∞ không?
2. PHƯƠNG PHÁP
   - Nhân liên hợp.
   - Chia tử và mẫu cho bậc cao nhất.
   - Dùng giới hạn cơ bản: lim(sin x / x) = 1 khi x→0.
   - Quy tắc L'Hôpital.
3. GIẢI CHI TIẾT
4. KẾT LUẬN
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết ∞, →.`,
    long: true,
  },
  {
    id: 'toan-20',
    cat: 'toan',
    title: 'Giải bài toán tổ hợp và chỉnh hợp',
    desc: 'Hoán vị, chỉnh hợp, tổ hợp. Có phân biệt và bài tập.',
    tags: ['tổ hợp', 'chi tiết'],
    prompt: `Giải bài toán tổ hợp:

{{đề bài}}

YÊU CẦU:

1. NHẬN DIỆN BÀI TOÁN
   - Có sắp xếp thứ tự? Có chọn lựa?
2. CÔNG THỨC
   - Hoán vị: Pₙ = n!
   - Chỉnh hợp: A(n,k) = n!/(n−k)!
   - Tổ hợp: C(n,k) = n!/(k!(n−k)!)
3. GIẢI CHI TIẾT
4. PHÂN BIỆT
   - Khi nào dùng A, khi nào dùng C?
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-21',
    cat: 'toan',
    title: 'Khai triển nhị thức Newton',
    desc: 'Khai triển (a+b)ⁿ, tìm số hạng tổng quát.',
    tags: ['đại số', 'chi tiết'],
    prompt: `Khai triển nhị thức Newton:

{{biểu thức}}

YÊU CẦU:

1. CÔNG THỨC
   (a + b)ⁿ = Σ C(n,k) · aⁿ⁻ᵏ · bᵏ (k=0 đến n)
2. XÁC ĐỊNH a, b, n
3. KHAI TRIỂN CHI TIẾT
   - Viết từng số hạng.
4. TÌM SỐ HẠNG CỤ THỂ (nếu đề yêu cầu)
   - Ví dụ: số hạng chứa x⁵.
   - Số hạng không chứa x.
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết Σ, C(n,k).`,
    long: true,
  },
  {
    id: 'toan-22',
    cat: 'toan',
    title: 'Giải bài toán tiếp tuyến của đồ thị',
    desc: 'Viết phương trình tiếp tuyến tại điểm hoặc có hệ số góc cho trước.',
    tags: ['giải tích', 'chi tiết'],
    prompt: `Viết phương trình tiếp tuyến của đồ thị hàm số:

y = {{hàm số}} {{điều kiện}}

YÊU CẦU:

1. XÁC ĐỊNH DẠNG BÀI
   - Tiếp tuyến tại điểm M(x₀, y₀)?
   - Tiếp tuyến có hệ số góc k?
   - Tiếp tuyến đi qua điểm A?
2. CÔNG THỨC
   - y = y'(x₀)·(x − x₀) + y₀
   - Hệ số góc k = y'(x₀)
3. GIẢI CHI TIẾT
4. KIỂM TRA LẠI
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-23',
    cat: 'toan',
    title: 'Giải bài toán số phức',
    desc: 'Cộng, trừ, nhân, chia số phức; môđun; biểu diễn hình học.',
    tags: ['số phức', 'chi tiết'],
    prompt: `Giải bài toán số phức:

{{đề bài}}

YÊU CẦU:

1. DẠNG ĐẠI SỐ
   z = a + bi (a là phần thực, b là phần ảo).
2. PHÉP TOÁN
   - Cộng/trừ: (a+bi) ± (c+di) = (a±c) + (b±d)i
   - Nhân: (a+bi)(c+di) = (ac−bd) + (ad+bc)i
   - Chia: nhân tử và mẫu với số phức liên hợp của mẫu.
3. MÔĐUN
   |z| = √(a² + b²)
4. SỐ PHỨC LIÊN HỢP
   z̄ = a − bi
5. BIỂU DIỄN HÌNH HỌC
   - Điểm M(a, b) trên mặt phẳng tọa độ.
6. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết i, √, z̄.`,
    long: true,
  },
  {
    id: 'toan-24',
    cat: 'toan',
    title: 'Giải bài toán hình học tọa độ Oxyz',
    desc: 'Phương trình mặt phẳng, đường thẳng, mặt cầu trong không gian Oxyz.',
    tags: ['hình học', 'chi tiết'],
    prompt: `Giải bài toán hình học Oxyz:

{{đề bài}}

YÊU CẦU:

1. XÁC ĐỊNH DẠNG
   - Mặt phẳng, đường thẳng, hay mặt cầu?
2. CÔNG THỨC
   - Mặt phẳng: Ax + By + Cz + D = 0, vector pháp tuyến n = (A,B,C)
   - Đường thẳng: (x−x₀)/a = (y−y₀)/b = (z−z₀)/c
   - Mặt cầu: (x−a)² + (y−b)² + (z−c)² = R²
3. GIẢI CHI TIẾT
4. KIỂM TRA LẠI
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết vector bằng chữ in đậm hoặc ký hiệu →.`,
    long: true,
  },
  {
    id: 'toan-25',
    cat: 'toan',
    title: 'Giải bài toán cực trị hình học',
    desc: 'Cực trị trong hình học: chu vi, diện tích, khoảng cách nhỏ nhất/lớn nhất.',
    tags: ['hình học', 'chi tiết'],
    prompt: `Giải bài toán cực trị hình học:

{{đề bài}}

YÊU CẦU:

1. VẼ HÌNH (mô tả bằng lời)
2. ĐẶT ẨN VÀ ĐIỀU KIỆN
3. LẬP BIỂU THỨC CẦN TỐI ƯU
4. ÁP DỤNG CÔNG CỤ
   - Bất đẳng thức (Cauchy, Bunhiacopxki).
   - Đạo hàm.
   - Hình học (đối xứng, phản xạ).
5. TÌM CỰC TRỊ
6. KẾT LUẬN

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-26',
    cat: 'toan',
    title: 'Giải đề thi thử THPT Quốc gia môn Toán',
    desc: 'Hướng dẫn giải đề thi, phân bổ thời gian và chiến lược làm bài.',
    tags: ['luyện thi', 'chi tiết'],
    prompt: `Hướng dẫn giải đề thi thử THPT Quốc gia môn Toán.

ĐỀ THI:
{{đề thi}}

YÊU CẦU:

1. PHÂN TÍCH CẤU TRÚC ĐỀ
   - Bao nhiêu câu? Chia theo chủ đề?
2. PHÂN BỔ THỜI GIAN
   - Câu dễ: bao nhiêu phút?
   - Câu khó: bao nhiêu phút?
3. CHIẾN LƯỢC LÀM BÀI
   - Làm câu dễ trước, câu khó sau.
   - Nhận diện câu "ăn điểm" nhanh.
4. GIẢI CHI TIẾT TỪNG CÂU
   - Hoặc giải mẫu 5-10 câu đại diện.
5. NHẬN XÉT ĐỀ
   - Câu nào đánh đố, câu nào cơ bản.
6. LỜI KHUYÊN PHÒNG THI

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-27',
    cat: 'toan',
    title: 'Tổng hợp công thức Toán lớp 10',
    desc: 'Tất cả công thức trọng tâm lớp 10: mệnh đề, tập hợp, hàm số, lượng giác, vector.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp tất cả công thức Toán lớp 10.

YÊU CẦU:

1. MỆNH ĐỀ — TẬP HỢP
   - Giao, hợp, hiệu, phần bù.
   - Các tập con của R.

2. HÀM SỐ BẬC NHẤT — BẬC HAI
   - y = ax + b
   - y = ax² + bx + c
   - Đỉnh parabol, trục đối xứng.

3. PHƯƠNG TRÌNH — HỆ PHƯƠNG TRÌNH
   - Bậc 1, bậc 2.
   - Hệ 2 ẩn, 3 ẩn.
   - Định lý Vi-ét.

4. LƯỢNG GIÁC
   - Giá trị lượng giác của góc đặc biệt.
   - Công thức cộng, nhân đôi, hạ bậc.

5. VECTOR
   - Tọa độ, tích vô hướng.
   - Hệ thức lượng trong tam giác.

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Bảng công thức rõ ràng.`,
    long: true,
  },
  {
    id: 'toan-28',
    cat: 'toan',
    title: 'Tổng hợp công thức Toán lớp 11',
    desc: 'Công thức trọng tâm lớp 11: lượng giác, dãy số, tổ hợp, xác suất, giới hạn.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp tất cả công thức Toán lớp 11.

YÊU CẦU:

1. LƯỢNG GIÁC
   - Phương trình lượng giác cơ bản.
   - Công thức biến đổi.

2. DÃY SỐ — CẤP SỐ
   - Cấp số cộng, cấp số nhân.
   - Số hạng tổng quát, tổng n số hạng.

3. TỔ HỢP — XÁC SUẤT
   - Hoán vị, chỉnh hợp, tổ hợp.
   - Nhị thức Newton.
   - Xác suất cổ điển.

4. GIỚI HẠN
   - Giới hạn dãy số.
   - Giới hạn hàm số.

5. ĐẠO HÀM (nếu có)
   - Đạo hàm cơ bản.
   - Ý nghĩa hình học.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-29',
    cat: 'toan',
    title: 'Tổng hợp công thức Toán lớp 12',
    desc: 'Công thức trọng tâm lớp 12: khảo sát hàm số, mũ-logarit, tích phân, số phức.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp tất cả công thức Toán lớp 12.

YÊU CẦU:

1. ỨNG DỤNG ĐẠO HÀM
   - Khảo sát hàm số.
   - Cực trị, GTLN-GTNN.
   - Tiệm cận.

2. HÀM SỐ MŨ — LOGARIT
   - Công thức mũ: aˣ·aʸ = aˣ⁺ʸ
   - Logarit: log(ab) = log a + log b
   - Đạo hàm: (aˣ)' = aˣ·ln a, (ln x)' = 1/x

3. NGUYÊN HÀM — TÍCH PHÂN
   - Bảng nguyên hàm cơ bản.
   - Phương pháp đổi biến, từng phần.
   - Ứng dụng: diện tích, thể tích.

4. SỐ PHỨC
   - Dạng đại số, môđun, liên hợp.
   - Phương trình bậc 2 với hệ số thực.

5. HÌNH HỌC KHÔNG GIAN OXYZ
   - Mặt phẳng, đường thẳng, mặt cầu.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'toan-30',
    cat: 'toan',
    title: 'Sinh đề tự luyện theo dạng',
    desc: 'AI sinh đề tự luyện theo dạng bài bạn chọn, có đáp án và lời giải.',
    tags: ['tự luyện', 'chi tiết'],
    prompt: `Sinh đề tự luyện Toán cho học sinh {{lớp}}.

DẠNG BÀI: {{dạng bài}}
SỐ LƯỢNG: {{số bài}} bài
ĐỘ KHÓ: {{độ khó}}

YÊU CẦU:

1. CHIA ĐỘ KHÓ
   - 40% cơ bản (dễ).
   - 40% trung bình.
   - 20% nâng cao.

2. NỘI DUNG
   - Mỗi bài có đề rõ ràng.
   - Không cần đáp án ngay sau đề.
   - Cuối cùng có bảng đáp án + lời giải ngắn.

3. ĐA DẠNG
   - Không trùng câu hỏi.
   - Có cả tính toán và lý luận.

4. GỢI Ý
   - Sau mỗi bài khó, có gợi ý cách làm (không đưa đáp án).

5. LỜI KHUYÊN
   - Cách luyện tập hiệu quả dạng bài này.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
];