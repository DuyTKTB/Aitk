
export const HOC_LY = [
  {
    id: 'ly-01',
    cat: 'ly',
    title: 'Giải thích khái niệm Vật lý dễ hiểu',
    desc: 'Gia sư giải thích khái niệm kèm ví dụ đời sống, bài tập mẫu và lỗi hay mắc.',
    tags: ['lý thuyết', 'gia sư', 'chi tiết'],
    prompt: `Bạn là gia sư Vật lý kiên nhẫn, đang dạy cho học sinh {{lớp}}.

NHIỆM VỤ: Giải thích khái niệm "{{khái niệm}}" một cách dễ hiểu.

YÊU CẦU:

1. ĐỊNH NGHĨA NGẮN (dưới 50 từ)
2. VÍ DỤ ĐỜI SỐNG (1 ví dụ, 2-3 câu)
3. BÀI TẬP MẪU CÓ LỜI GIẢI
   - Công thức, thay số, kết quả + đơn vị.
4. BA LỖI HỌC SINH HAY MẮC
5. TỰ KIỂM TRA (2 câu hỏi)

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết m/s², 10⁻³, Δt.
- Độ dài: 400-600 từ.`,
    sample: 'Gia tốc giống như "tốc độ thay đổi tốc độ": nếu bạn đang đi xe đạp và bắt đầu tăng tốc, gia tốc cho biết tốc độ tăng nhanh hay chậm…',
    long: true,
  },
  {
    id: 'ly-02',
    cat: 'ly',
    title: 'Giải bài tập Vật lý từng bước',
    desc: 'Lời giải có công thức, thay số, kiểm tra đơn vị. Có tóm tắt đề trước khi giải.',
    tags: ['bài tập', 'chi tiết'],
    prompt: `Giải bài tập Vật lý cho học sinh {{lớp}}:

{{đề bài}}

YÊU CẦU:

BƯỚC 1 — TÓM TẮT ĐỀ
- Liệt kê dữ kiện (có đơn vị).
- Xác định đại lượng cần tìm.
- Đổi đơn vị về hệ SI.

BƯỚC 2 — CÔNG THỨC
- Nêu công thức/định luật dùng.
- Giải thích từng ký hiệu.

BƯỚC 3 — GIẢI CHI TIẾT
- Thay số vào công thức.
- Tính kết quả + đơn vị.

BƯỚC 4 — KIỂM TRA
- Kiểm tra đơn vị.
- Kết quả có hợp lý không?

BƯỚC 5 — MỞ RỘNG
- Nếu đổi dữ kiện thì kết quả thay đổi thế nào?

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Công thức viết Unicode: v = s/t, F = ma.`,
    long: true,
  },
  {
    id: 'ly-03',
    cat: 'ly',
    title: 'Tạo đề trắc nghiệm Vật lý',
    desc: 'Đề có đáp án và giải thích, phân bố 3 mức độ.',
    tags: ['quiz', 'chi tiết'],
    prompt: `Tạo đề trắc nghiệm Vật lý cho học sinh {{lớp}}.

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
    id: 'ly-04',
    cat: 'ly',
    title: 'Tìm lỗi sai trong bài giải Vật lý',
    desc: 'Chỉ ra bước sai, phân tích nguyên nhân gốc và bài tương tự.',
    tags: ['sửa bài', 'chi tiết'],
    prompt: `Chấm bài Vật lý cho học sinh {{lớp}}.

ĐỀ BÀI: {{đề bài}}
BÀI LÀM: {{bài làm}}

YÊU CẦU:
1. Xác định bước sai đầu tiên.
2. Giải thích nguyên nhân (nhầm công thức / sai đơn vị / sai bản chất).
3. Lời giải đúng.
4. Bài tương tự để luyện.
5. Lời khuyên.

ĐỊNH DẠNG:
- Không dùng LaTeX. Phần "Bước sai" in đậm.`,
    long: true,
  },
  {
    id: 'ly-05',
    cat: 'ly',
    title: 'Tóm tắt chương Vật lý thành sơ đồ',
    desc: 'Sơ đồ cây kiến thức + 10 công thức quan trọng.',
    tags: ['tóm tắt', 'chi tiết'],
    prompt: `Tóm tắt chương "{{chương}}" Vật lý {{lớp}}.

YÊU CẦU:
1. Sơ đồ cây kiến thức (dạng text tree).
2. Bảng công thức | Khi nào dùng | Đơn vị.
3. 10 công thức quan trọng nhất.
4. Mẹo ghi nhớ.
5. Bài tập tự kiểm tra.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-06',
    cat: 'ly',
    title: 'Giải bài toán động học chất điểm',
    desc: 'Chuyển động thẳng đều, biến đổi đều, rơi tự do.',
    tags: ['cơ học', 'chi tiết'],
    prompt: `Giải bài toán động học:

{{đề bài}}

YÊU CẦU:
1. Xác định dạng chuyển động (đều, biến đổi đều, rơi tự do).
2. Công thức áp dụng:
   - Đều: v = s/t
   - Biến đổi đều: v = v₀ + at; s = v₀t + ½at²
   - Rơi tự do: v = gt; h = ½gt²
3. Giải chi tiết.
4. Kiểm tra đơn vị.
5. Bài tương tự.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-07',
    cat: 'ly',
    title: 'Giải bài toán động lực học',
    desc: 'Định luật Newton, lực, khối lượng, gia tốc.',
    tags: ['cơ học', 'chi tiết'],
    prompt: `Giải bài toán động lực học:

{{đề bài}}

YÊU CẦU:
1. Vẽ hình và biểu diễn lực.
2. Áp dụng định luật II Newton: ΣF = ma
3. Chiếu lực lên trục tọa độ.
4. Giải hệ phương trình.
5. Kiểm tra lại.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết ΣF, ·.`,
    long: true,
  },
  {
    id: 'ly-08',
    cat: 'ly',
    title: 'Giải bài toán về công và năng lượng',
    desc: 'Định lý động năng, thế năng, cơ năng.',
    tags: ['cơ học', 'chi tiết'],
    prompt: `Giải bài toán công — năng lượng:

{{đề bài}}

YÊU CẦU:
1. Công thức:
   - Công: A = F·s·cosα
   - Động năng: Wđ = ½mv²
   - Thế năng trọng trường: Wt = mgh
   - Cơ năng: W = Wđ + Wt
2. Định luật bảo toàn cơ năng (nếu áp dụng).
3. Giải chi tiết.
4. Kiểm tra đơn vị (J).

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-09',
    cat: 'ly',
    title: 'Giải bài toán va chạm',
    desc: 'Va chạm đàn hồi, mềm. Bảo toàn động lượng.',
    tags: ['cơ học', 'chi tiết'],
    prompt: `Giải bài toán va chạm:

{{đề bài}}

YÊU CẦU:
1. Xác định loại va chạm (đàn hồi / mềm).
2. Định luật bảo toàn động lượng: m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'
3. Nếu đàn hồi: thêm bảo toàn động năng.
4. Giải hệ phương trình.
5. Nhận xét kết quả.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-10',
    cat: 'ly',
    title: 'Giải bài toán chất khí lý tưởng',
    desc: 'Định luật Boyle, Charles, Gay-Lussac, phương trình Clapeyron.',
    tags: ['nhiệt học', 'chi tiết'],
    prompt: `Giải bài toán chất khí:

{{đề bài}}

YÊU CẦU:
1. Xác định quá trình (đẳng nhiệt / đẳng tích / đẳng áp).
2. Công thức:
   - Đẳng nhiệt: p₁V₁ = p₂V₂
   - Đẳng tích: p₁/T₁ = p₂/T₂
   - Đẳng áp: V₁/T₁ = V₂/T₂
   - Clapeyron: pV = nRT
3. Đổi nhiệt độ về Kelvin: T(K) = t(°C) + 273
4. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-11',
    cat: 'ly',
    title: 'Giải bài toán điện tích và điện trường',
    desc: 'Định luật Coulomb, cường độ điện trường, nguyên lý chồng chất.',
    tags: ['điện học', 'chi tiết'],
    prompt: `Giải bài toán điện trường:

{{đề bài}}

YÊU CẦU:
1. Định luật Coulomb: F = k·|q₁q₂|/r²
   - k = 9×10⁹ N·m²/C²
2. Cường độ điện trường: E = F/q = k·|Q|/r²
3. Nguyên lý chồng chất: E = E₁ + E₂ + …
4. Giải chi tiết (vector).
5. Kiểm tra đơn vị.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-12',
    cat: 'ly',
    title: 'Giải bài toán mạch điện',
    desc: 'Định luật Ohm, mắc nối tiếp, song song, định luật Kirchhoff.',
    tags: ['điện học', 'chi tiết'],
    prompt: `Giải bài toán mạch điện:

{{đề bài}}

YÊU CẦU:
1. Phân tích mạch: nối tiếp, song song, hỗn hợp.
2. Công thức:
   - Ohm: I = U/R
   - Nối tiếp: R = R₁ + R₂; I = I₁ = I₂
   - Song song: 1/R = 1/R₁ + 1/R₂; U = U₁ = U₂
3. Giải từng bước.
4. Tính công suất tiêu thụ (nếu cần): P = UI = I²R.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-13',
    cat: 'ly',
    title: 'Giải bài toán từ trường',
    desc: 'Lực từ, cảm ứng từ, từ thông, cảm ứng điện từ.',
    tags: ['từ học', 'chi tiết'],
    prompt: `Giải bài toán từ trường:

{{đề bài}}

YÊU CẦU:
1. Xác định loại bài:
   - Lực từ: F = B·I·L·sinα
   - Cảm ứng từ của dây dẫn thẳng: B = 2×10⁻⁷·I/r
   - Từ thông: Φ = B·S·cosα
   - Suất điện động cảm ứng: e = −ΔΦ/Δt
2. Giải chi tiết.
3. Áp dụng quy tắc bàn tay phải / trái.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-14',
    cat: 'ly',
    title: 'Giải bài toán dao động điều hòa',
    desc: 'Con lắc lò xo, con lắc đơn, phương trình dao động.',
    tags: ['dao động', 'chi tiết'],
    prompt: `Giải bài toán dao động điều hòa:

{{đề bài}}

YÊU CẦU:
1. Xác định dạng:
   - Con lắc lò xo: T = 2π√(m/k)
   - Con lắc đơn: T = 2π√(l/g)
2. Phương trình dao động:
   x = A·cos(ωt + φ)
3. Công thức:
   - ω = 2π/T = 2πf
   - v_max = Aω
   - a_max = Aω²
4. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết π, √, ω.`,
    long: true,
  },
  {
    id: 'ly-15',
    cat: 'ly',
    title: 'Giải bài toán sóng cơ',
    desc: 'Sóng cơ, giao thoa, sóng dừng.',
    tags: ['sóng', 'chi tiết'],
    prompt: `Giải bài toán sóng cơ:

{{đề bài}}

YÊU CẦU:
1. Công thức:
   - Bước sóng: λ = v/f = vT
   - Phương trình sóng: u = A·cos(ωt − 2πx/λ)
2. Giao thoa:
   - Cực đại: d₂ − d₁ = kλ
   - Cực tiểu: d₂ − d₁ = (k + 0,5)λ
3. Sóng dừng:
   - 2 đầu cố định: l = kλ/2
   - 1 đầu tự do: l = (2k+1)λ/4
4. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-16',
    cat: 'ly',
    title: 'Giải bài toán dòng điện xoay chiều',
    desc: 'Mạch RLC, cộng hưởng, công suất, hệ số công suất.',
    tags: ['điện xoay chiều', 'chi tiết'],
    prompt: `Giải bài toán điện xoay chiều:

{{đề bài}}

YÊU CẦU:
1. Công thức:
   - Cảm kháng: Z_L = ωL
   - Dung kháng: Z_C = 1/(ωC)
   - Tổng trở: Z = √(R² + (Z_L − Z_C)²)
   - I = U/Z
   - Hệ số công suất: cosφ = R/Z
2. Cộng hưởng: Z_L = Z_C → Z_min = R
3. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết ω, φ, √.`,
    long: true,
  },
  {
    id: 'ly-17',
    cat: 'ly',
    title: 'Giải bài toán sóng điện từ',
    desc: 'Mạch LC, sóng điện từ, thu phát sóng.',
    tags: ['điện từ', 'chi tiết'],
    prompt: `Giải bài toán sóng điện từ:

{{đề bài}}

YÊU CẦU:
1. Mạch dao động LC:
   - Tần số góc: ω = 1/√(LC)
   - Chu kỳ: T = 2π√(LC)
2. Bước sóng điện từ: λ = c/f = cT
   - c = 3×10⁸ m/s
3. Giải chi tiết.
4. Ứng dụng thực tế.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-18',
    cat: 'ly',
    title: 'Giải bài toán quang hình học',
    desc: 'Thấu kính, gương cầu, hệ quang học.',
    tags: ['quang học', 'chi tiết'],
    prompt: `Giải bài toán quang hình học:

{{đề bài}}

YÊU CẦU:
1. Công thức thấu kính:
   - 1/f = 1/d + 1/d'
   - k = −d'/d = A'B'/AB
2. Quy ước dấu:
   - Thấu kính hội tụ: f > 0
   - Thấu kính phân kỳ: f < 0
   - Vật thật: d > 0; ảnh thật: d' > 0
3. Vẽ hình (mô tả bằng lời).
4. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-19',
    cat: 'ly',
    title: 'Giải bài toán lượng tử ánh sáng',
    desc: 'Hiện tượng quang điện, thuyết photon, năng lượng photon.',
    tags: ['lượng tử', 'chi tiết'],
    prompt: `Giải bài toán lượng tử ánh sáng:

{{đề bài}}

YÊU CẦU:
1. Năng lượng photon: ε = hf = hc/λ
   - h = 6,625×10⁻³⁴ J·s
   - c = 3×10⁸ m/s
2. Công thức Einstein:
   hf = A + Wđ_max
   - A = công thoát
   - Wđ_max = ½mv²_max
3. Điều kiện xảy ra quang điện: λ ≤ λ₀
4. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết λ, ε.`,
    long: true,
  },
  {
    id: 'ly-20',
    cat: 'ly',
    title: 'Giải bài toán vật lý hạt nhân',
    desc: 'Phóng xạ, phản ứng hạt nhân, năng lượng liên kết.',
    tags: ['hạt nhân', 'chi tiết'],
    prompt: `Giải bài toán vật lý hạt nhân:

{{đề bài}}

YÊU CẦU:
1. Định luật phóng xạ:
   N = N₀·2^(−t/T) = N₀·e^(−λt)
   - T = chu kỳ bán rã
   - λ = ln2/T
2. Phản ứng hạt nhân:
   - Bảo toàn số khối A và điện tích Z.
3. Năng lượng:
   E = Δm·c²
4. Giải chi tiết.

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết Δ, λ.`,
    long: true,
  },
  {
    id: 'ly-21',
    cat: 'ly',
    title: 'Tổng hợp công thức Vật lý 10',
    desc: 'Công thức trọng tâm lớp 10: động học, động lực học, công-năng lượng.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp công thức Vật lý 10.

YÊU CẦU:
1. Động học chất điểm
2. Động lực học chất điểm (3 định luật Newton)
3. Cân bằng và chuyển động của vật rắn
4. Công — Năng lượng
5. Chất khí
6. Cơ sở nhiệt động lực học

Mỗi phần có:
- Công thức chính.
- Đơn vị.
- Khi nào dùng.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-22',
    cat: 'ly',
    title: 'Tổng hợp công thức Vật lý 11',
    desc: 'Công thức trọng tâm lớp 11: điện trường, dòng điện, từ trường, quang học.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp công thức Vật lý 11.

YÊU CẦU:
1. Điện tích — Điện trường
2. Dòng điện không đổi
3. Dòng điện trong các môi trường
4. Từ trường
5. Cảm ứng điện từ
6. Khúc xạ ánh sáng — Thấu kính

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-23',
    cat: 'ly',
    title: 'Tổng hợp công thức Vật lý 12',
    desc: 'Công thức trọng tâm lớp 12: dao động, sóng, điện xoay chiều, lượng tử.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp công thức Vật lý 12.

YÊU CẦU:
1. Dao động cơ
2. Sóng cơ và sóng âm
3. Dòng điện xoay chiều
4. Dao động và sóng điện từ
5. Sóng ánh sáng
6. Lượng tử ánh sáng
7. Hạt nhân nguyên tử

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'ly-24',
    cat: 'ly',
    title: 'Hướng dẫn giải đề thi THPT Vật lý',
    desc: 'Chiến lược làm bài, phân bổ thời gian, giải mẫu.',
    tags: ['luyện thi', 'chi tiết'],
    prompt: `Hướng dẫn giải đề thi THPT Quốc gia môn Vật lý.

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
    id: 'ly-25',
    cat: 'ly',
    title: 'Sinh đề tự luyện Vật lý theo dạng',
    desc: 'AI sinh đề tự luyện theo dạng bài bạn chọn, có đáp án và lời giải.',
    tags: ['tự luyện', 'chi tiết'],
    prompt: `Sinh đề tự luyện Vật lý cho học sinh {{lớp}}.

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