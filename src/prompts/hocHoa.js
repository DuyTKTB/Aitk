
export const HOC_HOA = [
  {
    id: 'hoc-giai-thich',
    cat: 'hoc',
    title: 'Giải thích khái niệm dễ hiểu',
    desc: 'Gia sư giải thích kèm ví dụ đời sống, bài tập mẫu và lỗi hay mắc. Prompt có cấu trúc 5 phần, AI trả lời có hệ thống.',
    tags: ['lý thuyết', 'gia sư', 'chi tiết'],
    prompt: `Bạn là một gia sư Hóa học kiên nhẫn, đang dạy cho học sinh {{lớp}}. Học sinh này có thể chưa nắm vững kiến thức nền, nên cần giải thích chậm rãi, có ví dụ cụ thể.

NHIỆM VỤ: Giải thích khái niệm "{{khái niệm}}" một cách dễ hiểu nhất.

YÊU CẦU CHI TIẾT:

1. ĐỊNH NGHĨA NGẮN (không quá 50 từ)
   - Nêu khái niệm bằng ngôn ngữ đời thường, tránh thuật ngữ nặng.
   - Nếu buộc phải dùng thuật ngữ, giải thích ngay trong ngoặc.

2. VÍ DỤ ĐỜI SỐNG (1 ví dụ, 2-3 câu)
   - Chọn ví dụ gần gũi với học sinh Việt Nam (nấu ăn, đồ uống, thiên nhiên…).
   - Chỉ rõ điểm tương đồng với khái niệm.

3. BÀI TẬP MẪU CÓ LỜI GIẢI
   - Đưa 1 bài tập đơn giản áp dụng khái niệm.
   - Giải từng bước, mỗi bước ghi rõ:
     • Công thức/định luật dùng
     • Thay số
     • Kết quả + đơn vị

4. BA LỖI HỌC SINH HAY MẮC
   - Liệt kê 3 lỗi phổ biến khi học khái niệm này.
   - Với mỗi lỗi: nêu nguyên nhân + cách tránh.

5. TỰ KIỂM TRA
   - Đặt 2 câu hỏi ngắn để học sinh tự kiểm tra (chưa đưa đáp án).
   - Câu hỏi 1: kiểm tra hiểu định nghĩa.
   - Câu hỏi 2: kiểm tra áp dụng vào bài tập nhỏ.

ĐỊNH DẠNG:
- Không dùng LaTeX, viết công thức bằng Unicode (H₂O, SO₄²⁻, 10⁻³).
- Mỗi phần có tiêu đề rõ ràng.
- Tổng độ dài: 400-600 từ.`,
    sample: 'Mol giống như "một tá" của thế giới hạt: thay vì đếm từng nguyên tử, ta đếm theo nhóm 6,022×10²³ hạt. Vì vậy 1 mol nước (18 g) và 1 mol đường (342 g) có cùng số phân tử dù khối lượng khác xa nhau…',
    long: true,
  },
  {
    id: 'hoc-trac-nghiem',
    cat: 'hoc',
    title: 'Tạo đề trắc nghiệm 3 mức độ',
    desc: 'Đề có đáp án và giải thích, chia nhận biết – thông hiểu – vận dụng. Có ma trận độ khó và phân bố đáp án.',
    tags: ['quiz', 'ôn tập', 'chi tiết'],
    prompt: `Bạn là giáo viên Hóa học có kinh nghiệm ra đề thi THPT. Hãy tạo đề trắc nghiệm cho học sinh {{lớp}}.

THÔNG TIN ĐỀ:
- Chuyên đề: {{chuyên đề}}
- Số câu: {{số câu}} câu
- Thời gian làm bài gợi ý: {{số câu}} × 1,5 phút

CẤU TRÚC ĐỀ (bắt buộc):

1. MA TRẬN ĐỘ KHÓ
   - 40% nhận biết (nhớ công thức, định nghĩa)
   - 40% thông hiểu (giải thích, so sánh)
   - 20% vận dụng (tính toán, bài tập)

2. NỘI DUNG TỪNG CÂU
   Với mỗi câu, ghi rõ:
   - Câu hỏi
   - 4 đáp án A, B, C, D
   - Đáp án nhiễu phải là lỗi sai thường gặp (không vô lý)
   - Đáp án đúng phân bố đều (không dồn vào A)

3. ĐÁP ÁN VÀ GIẢI THÍCH
   - Bảng đáp án cuối đề.
   - Giải thích ngắn cho từng câu (1-2 dòng):
     • Vì sao đáp án đúng
     • Vì sao các đáp án khác sai

4. GHI CHÚ CHO GIÁO VIÊN
   - Câu nào học sinh yếu hay sai nhất.
   - Câu nào có thể mở rộng thành bài tự luận.

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Công thức viết Unicode: H₂SO₄, Fe³⁺, 10⁻³.
- Đánh số câu rõ ràng: Câu 1, Câu 2…`,
    long: true,
  },
  {
    id: 'hoc-giai-bai',
    cat: 'hoc',
    title: 'Giải bài tập từng bước',
    desc: 'Lời giải có công thức, đơn vị và bước kiểm tra lại kết quả. Có phân tích dữ kiện trước khi giải.',
    tags: ['bài tập', 'tính toán', 'chi tiết'],
    prompt: `Bạn là giáo viên Hóa học đang hướng dẫn học sinh {{lớp}} giải bài tập. Học sinh cần thấy rõ từng bước, không chỉ đáp án.

ĐỀ BÀI:
{{đề bài}}

YÊU CẦU GIẢI (theo đúng thứ tự):

BƯỚC 1 — PHÂN TÍCH ĐỀ
- Liệt kê dữ kiện đã cho (có đơn vị).
- Xác định đại lượng cần tìm.
- Nêu công thức/định luật sẽ dùng.
- Cảnh báo: dữ kiện nào dễ gây nhầm lẫn.

BƯỚC 2 — GIẢI CHI TIẾT
Với mỗi bước tính:
- Ghi công thức tổng quát.
- Thay số vào công thức.
- Tính kết quả + đơn vị.
- Nếu có nhiều bước, đánh số Bước 2.1, 2.2…

BƯỚC 3 — KIỂM TRA LẠI
- Kiểm tra kết quả bằng cách khác (ví dụ: bảo toàn khối lượng, ước lượng).
- Kiểm tra đơn vị có nhất quán không.
- Kết quả có hợp lý không (không âm, hiệu suất ≤ 100%).

BƯỚC 4 — ĐÁP ÁN CUỐI
- Ghi đáp án rõ ràng, in đậm.
- Nêu đơn vị đầy đủ.

BƯỚC 5 — MỞ RỘNG (nếu có)
- Nếu đổi dữ kiện X thành Y thì kết quả thay đổi thế nào?
- Bài này thuộc dạng nào, gặp lại thì nhận biết ra sao?

ĐỊNH DẠNG:
- Không dùng LaTeX. Viết H₂O, Fe³⁺, SO₄²⁻.
- Mỗi bước có tiêu đề rõ ràng.`,
    long: true,
  },
  {
    id: 'hoc-tim-loi',
    cat: 'hoc',
    title: 'Tìm lỗi sai trong bài làm',
    desc: 'AI chỉ ra bước sai, giải thích vì sao và cho bài tương tự để luyện. Có phân tích nguyên nhân gốc.',
    tags: ['sửa bài', 'luyện tập', 'chi tiết'],
    prompt: `Bạn là giáo viên Hóa học đang chấm bài cho học sinh {{lớp}}. Học sinh đã làm sai và cần hiểu rõ lỗi của mình, không chỉ nhận đáp án đúng.

ĐỀ BÀI:
{{đề bài}}

BÀI LÀM CỦA HỌC SINH:
{{bài làm}}

YÊU CẦU PHÂN TÍCH:

1. XÁC ĐỊNH BƯỚC SAI ĐẦU TIÊN
   - Chỉ ra chính xác bước nào sai (đánh số bước).
   - Trích dẫn phần sai trong bài làm.

2. GIẢI THÍCH NGUYÊN NHÂN GỐC
   - Học sinh đang hiểu nhầm khái niệm nào?
   - Lỗi này thuộc dạng: nhớ nhầm công thức / hiểu sai bản chất / tính toán sai / đọc sai đề?
   - Vì sao lỗi này dễ mắc?

3. LỜI GIẢI ĐÚNG
   - Viết lại toàn bộ lời giải từ đầu.
   - Giải thích từng bước ngắn gọn.
   - So sánh với bài làm sai để thấy khác biệt.

4. BÀI TƯƠNG TỰ ĐỂ LUYỆN
   - Cho 1 bài tập cùng dạng, độ khó tương đương.
   - Chỉ đưa đề, KHÔNG đưa đáp án.
   - Gợi ý: nên chú ý điều gì khi làm bài này.

5. LỜI KHUYÊN
   - 2-3 câu động viên + cách tránh lỗi tương tự lần sau.

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Phần "Bước sai" in đậm để dễ thấy.`,
    long: true,
  },
  {
    id: 'hoc-so-do',
    cat: 'hoc',
    title: 'Tóm tắt chương thành sơ đồ',
    desc: 'Khung kiến thức dạng cây và 10 phương trình quan trọng nhất. Có liên kết giữa các phần.',
    tags: ['tóm tắt', 'sơ đồ', 'chi tiết'],
    prompt: `Bạn là giáo viên Hóa học tổng hợp kiến thức cho học sinh {{lớp}} ôn tập.

CHƯƠNG CẦN TÓM TẮT: "{{chương}}"

YÊU CẦU:

1. SƠ ĐỒ CÂY KIẾN THỨC
   Trình bày dạng text tree (dùng ký tự ├── │ └──), cấu trúc:
   - Khái niệm trung tâm
     ├── Định nghĩa / đặc điểm
     ├── Phân loại (nếu có)
     ├── Tính chất vật lý
     ├── Tính chất hóa học
     │   ├── Phản ứng đặc trưng 1
     │   └── Phản ứng đặc trưng 2
     ├── Điều chế / ứng dụng
     └── Bài tập thường gặp

2. BẢNG SO SÁNH (nếu chương có nhiều chất/khái niệm tương tự)
   - Cột 1: Tên chất/khái niệm
   - Cột 2: Đặc điểm riêng
   - Cột 3: Phản ứng đặc trưng
   - Cột 4: Cách nhận biết

3. 10 CÔNG THỨC / PHƯƠNG TRÌNH QUAN TRỌNG NHẤT
   - Liệt kê theo thứ tự quan trọng.
   - Mỗi công thức có ghi chú khi nào dùng.

4. MẸO GHI NHỚ
   - 3-5 mẹo dễ nhớ (vần, câu chuyện, liên tưởng).

5. BÀI TẬP TỰ KIỂM TRA
   - 5 câu hỏi ngắn kiểm tra kiến thức chương (chưa đáp án).

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Sơ đồ cây dùng ký tự Unicode (├ │ └).`,
    long: true,
  },
  {
    id: 'hoc-ke-hoach',
    cat: 'hoc',
    title: 'Lịch ôn thi theo tuần',
    desc: 'Chia mục tiêu từng ngày, có 15 phút ôn lại bài hôm trước. Có đánh giá tiến độ hàng tuần.',
    tags: ['kế hoạch', 'ôn thi', 'chi tiết'],
    prompt: `Bạn là cố vấn học tập cho học sinh {{lớp}} đang chuẩn bị cho kỳ thi {{tên kỳ thi}}.

THÔNG TIN:
- Thời gian còn lại: {{số tuần}} tuần
- Thời gian học mỗi ngày: {{số giờ}} giờ
- Phần học sinh yếu: {{phần yếu}}
- Phần học sinh đã khá: {{phần khá}}

YÊU CẦU LẬP KẾ HOẠCH:

1. MỤC TIÊU TỔNG THỂ
   - Điểm mục tiêu (nếu có).
   - Phần nào cần cải thiện nhiều nhất.
   - Nguyên tắc: ưu tiên phần yếu, duy trì phần khá.

2. PHÂN BỔ THEO TUẦN
   Với mỗi tuần, ghi rõ:
   - Trọng tâm tuần (1-2 chuyên đề)
   - Mục tiêu cụ thể (ví dụ: "làm được 20 bài tập ancol")
   - Bài kiểm tra cuối tuần

3. LỊCH CHI TIẾT TỪNG NGÀY
   Trình bày dạng bảng:
   | Ngày | Buổi | Nội dung | Bài tập | Ghi chú |
   - Mỗi ngày có 15 phút ôn lại nội dung hôm trước (lặp lại ngắt quãng).
   - Xen kẽ ngày học lý thuyết và ngày làm bài tập.
   - Chủ nhật: nghỉ hoặc ôn nhẹ.

4. ĐÁNH GIÁ TIẾN ĐỘ
   - Cuối mỗi tuần tự đánh giá: đã đạt mục tiêu chưa?
   - Nếu chưa đạt: điều chỉnh thế nào cho tuần sau?

5. LỜI KHUYÊN
   - Cách tránh học quá sức, mất tập trung.
   - Cách ôn hiệu quả (Pomodoro, flashcard, làm đề).

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Bảng dùng ký tự | và -.`,
    long: true,
  },
  {
    id: 'hoc-flashcard',
    cat: 'hoc',
    title: 'Biến ghi chú thành flashcard',
    desc: '15 thẻ hỏi – đáp ngắn, sẵn dán vào Quizlet hoặc Knowt. Có gợi ý cách ôn.',
    tags: ['flashcard', 'ghi nhớ', 'chi tiết'],
    prompt: `Bạn là chuyên gia về phương pháp học tập. Hãy biến ghi chú của học sinh thành flashcard để ôn tập hiệu quả.

GHI CHÚ:
{{ghi chú}}

YÊU CẦU:

1. TẠO 15 FLASHCARD
   - Định dạng: "Câu hỏi | Đáp án"
   - Mỗi dòng 1 thẻ.
   - Đáp án tối đa 20 từ.
   - Ưu tiên: khái niệm dễ nhầm, công thức, định nghĩa.

2. PHÂN LOẠI THẺ
   - Đánh dấu [C] cho thẻ công thức.
   - Đánh dấu [Đ] cho thẻ định nghĩa.
   - Đánh dấu [N] cho thẻ nhận biết / so sánh.

3. THẺ KHÓ
   - Đánh dấu * cho 3-5 thẻ khó nhất.
   - Gợi ý cách nhớ riêng cho các thẻ này.

4. GỢI Ý ÔN TẬP
   - Thứ tự ôn: thẻ khó trước hay dễ trước?
   - Bao lâu ôn lại 1 lần (lặp lại ngắt quãng)?
   - Cách tự kiểm tra đã nhớ chưa.

5. ĐỊNH DẠNG XUẤT
   - Bản 1: dạng "Câu hỏi | Đáp án" để dán vào Quizlet/Knowt.
   - Bản 2: dạng "Câu hỏi" xuống dòng "Đáp án" để tự đọc.

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Công thức Unicode: H₂SO₄, Fe³⁺.`,
    long: true,
  },
  {
    id: 'hoc-thi-nghiem',
    cat: 'hoc',
    title: 'Mô tả thí nghiệm an toàn',
    desc: 'Dụng cụ, hóa chất, hiện tượng, phương trình và lưu ý an toàn. Có xử lý sự cố.',
    tags: ['thí nghiệm', 'an toàn', 'chi tiết'],
    prompt: `Bạn là giáo viên Hóa học hướng dẫn thí nghiệm cho học sinh {{lớp}}. An toàn là ưu tiên số 1.

THÍ NGHIỆM: {{thí nghiệm}}

YÊU CẦU MÔ TẢ:

1. MỤC ĐÍCH THÍ NGHIỆM
2. DỤNG CỤ VÀ HÓA CHẤT
3. CÁC BƯỚC TIẾN HÀNH
4. HIỆN TƯỢNG QUAN SÁT
5. PHƯƠNG TRÌNH PHẢN ỨNG
6. GIẢI THÍCH HIỆN TƯỢNG
7. LƯU Ý AN TOÀN
8. XỬ LÝ SỰ CỐ
9. CÂU HỎI SAU THÍ NGHIỆM

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Công thức Unicode.`,
    long: true,
  },
  {
    id: 'hoc-09',
    cat: 'hoc',
    title: 'Giải thích bảng tuần hoàn theo nhóm',
    desc: 'Học từng nhóm nguyên tố có quy luật, dễ nhớ. Có bảng tóm tắt và mẹo nhớ.',
    tags: ['bảng tuần hoàn', 'ghi nhớ', 'chi tiết'],
    prompt: `Bạn là giáo viên Hóa học hướng dẫn học sinh {{lớp}} học bảng tuần hoàn.

NHÓM NGUYÊN TỐ: "{{nhóm}}"

YÊU CẦU:

1. VỊ TRÍ TRONG BẢNG
2. CẤU HÌNH ELECTRON ĐẶC TRƯNG
3. TÍNH CHẤT HÓA HỌC CHUNG
4. BẢNG TÓM TẮT TỪNG NGUYÊN TỐ
5. MẸO NHỚ
6. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Bảng dùng | và -.`,
    long: true,
  },
  {
    id: 'hoc-10',
    cat: 'hoc',
    title: 'So sánh 2 khái niệm dễ nhầm',
    desc: 'Bảng so sánh chi tiết, chỉ ra điểm khác biệt mấu chốt và mẹo phân biệt.',
    tags: ['so sánh', 'chi tiết'],
    prompt: `Bạn là giáo viên Hóa học giúp học sinh {{lớp}} phân biệt 2 khái niệm dễ nhầm.

KHÁI NIỆM A: {{khái niệm A}}
KHÁI NIỆM B: {{khái niệm B}}

YÊU CẦU:

1. BẢNG SO SÁNH (định nghĩa, đặc điểm, ví dụ, ứng dụng, lỗi hay nhầm)
2. ĐIỂM KHÁC BIỆT MẤU CHỐT (3-5 điểm)
3. VÍ DỤ MINH HOẠ (2+2+1 "dễ nhầm")
4. MẸO PHÂN BIỆT (3-5 mẹo)
5. BÀI TẬP PHÂN BIỆT (5 câu)

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Bảng dùng | và -.`,
    long: true,
  },
  {
    id: 'hoc-11',
    cat: 'hoc',
    title: 'Chuyển hóa chất A → B → C',
    desc: 'Sơ đồ chuyển hóa, phương trình từng bước, điều kiện. Có bài tập điền chất còn thiếu.',
    tags: ['chuỗi phản ứng', 'chi tiết'],
    prompt: `Bạn là giáo viên Hóa học hướng dẫn chuỗi chuyển hóa cho học sinh {{lớp}}.

CHUỖI: {{chuỗi}}
(ví dụ: Fe → FeCl₂ → Fe(OH)₂ → FeO)

YÊU CẦU:

1. SƠ ĐỒ CHUỖI (vẽ bằng chữ)
2. PHƯƠNG TRÌNH TỪNG BƯỚC (cân bằng, điều kiện)
3. ĐIỀU KIỆN PHẢN ỨNG (vì sao dùng hóa chất này?)
4. BÀI TẬP ĐIỀN KHUYẾT
5. BIẾN THỂ (chuỗi có nhiều đường đi)

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-12',
    cat: 'hoc',
    title: 'Nhận biết các chất bằng thuốc thử',
    desc: 'Sơ đồ nhận biết từng chất, thuốc thử, hiện tượng đặc trưng.',
    tags: ['nhận biết', 'chi tiết'],
    prompt: `Hướng dẫn nhận biết các chất cho học sinh {{lớp}}.

DANH SÁCH CHẤT: {{danh sách chất}}

YÊU CẦU:

1. BẢNG NHẬN BIẾT
   | Chất | Thuốc thử | Hiện tượng | Phương trình |
2. SƠ ĐỒ NHẬN BIẾT (cây)
3. GIẢI THÍCH HIỆN TƯỢNG
4. BÀI TẬP THỰC HÀNH
5. LƯU Ý AN TOÀN

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-13',
    cat: 'hoc',
    title: 'Giải đề thi theo thời gian thực',
    desc: 'Phân bổ thời gian làm bài, chiến lược chọn câu dễ trước.',
    tags: ['đề thi', 'chi tiết'],
    prompt: `Hướng dẫn làm bài thi Hóa học cho học sinh {{lớp}}.

THÔNG TIN ĐỀ:
- Số câu: {{số câu}}
- Thời gian: {{thời gian}} phút

YÊU CẦU:

1. PHÂN BỔ THỜI GIAN (đọc đề, làm, kiểm tra)
2. CHIẾN LƯỢC (câu dễ trước, khó sau)
3. KỸ NĂNG ĐỌC ĐỀ (gạch chân, nhận dạng)
4. 5 LỖI PHỔ BIẾN TRONG PHÒNG THI
5. BÀI TẬP THỰC HÀNH

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-14',
    cat: 'hoc',
    title: 'Giải thích cơ chế phản ứng hữu cơ',
    desc: 'Cơ chế từng bước, mũi tên electron, giải thích vì sao.',
    tags: ['hữu cơ', 'chi tiết'],
    prompt: `Giải thích cơ chế phản ứng hữu cơ cho học sinh {{lớp}}.

PHẢN ỨNG: "{{phản ứng}}"

YÊU CẦU:

1. TỔNG QUAN (loại phản ứng, điều kiện)
2. CƠ CHẾ TỪNG BƯỚC (mũi tên electron, ion)
3. GIẢI THÍCH VÌ SAO (quy tắc Markovnikov, Zaitsev)
4. SƠ ĐỒ NĂNG LƯỢNG (mô tả bằng chữ)
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-15',
    cat: 'hoc',
    title: 'Giải thích oxi hóa khử',
    desc: 'Xác định số oxi hóa, chất oxi hóa/khử, cân bằng electron.',
    tags: ['oxi hóa khử', 'chi tiết'],
    prompt: `Hướng dẫn oxi hóa khử cho học sinh {{lớp}}.

PHẢN ỨNG: "{{phản ứng}}"

YÊU CẦU:

1. XÁC ĐỊNH SỐ OXI HÓA
2. XÁC ĐỊNH CHẤT OXI HÓA / KHỬ
3. CÂN BẰNG ELECTRON (bán phản ứng)
4. CÂN BẰNG PHƯƠNG TRÌNH
5. BÀI TẬP TƯƠNG TỰ

ĐỊNH DẠNG:
- Không dùng LaTeX. Số oxi hóa: Fe⁺³ hoặc Fe(+3).`,
    long: true,
  },
  {
    id: 'hoc-16',
    cat: 'hoc',
    title: 'Chuẩn độ axit–bazơ',
    desc: 'Nguyên lý chuẩn độ, tính nồng độ, chọn chất chỉ thị.',
    tags: ['chuẩn độ', 'chi tiết'],
    prompt: `Hướng dẫn chuẩn độ axit–bazơ cho học sinh {{lớp}}.

BÀI CHUẨN ĐỘ: "{{mô tả}}"

YÊU CẦU:

1. NGUYÊN LÝ (điểm tương đương, chất chỉ thị)
2. DỤNG CỤ VÀ HÓA CHẤT
3. CÁC BƯỚC TIẾN HÀNH
4. TÍNH TOÁN (C₁V₁ = C₂V₂)
5. CHỌN CHẤT CHỈ THỊ
6. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-17',
    cat: 'hoc',
    title: 'Giải thích pin điện hóa',
    desc: 'Cấu tạo pin, phản ứng ở mỗi điện cực, sức điện động.',
    tags: ['điện hóa', 'chi tiết'],
    prompt: `Hướng dẫn pin điện hóa cho học sinh {{lớp}}.

LOẠI PIN: "{{tên pin}}"

YÊU CẦU:

1. CẤU TẠO PIN
2. PHẢN ỨNG Ở ĐIỆN CỰC (anot, catot)
3. PHƯƠNG TRÌNH TỔNG
4. TÍNH E°pin = E°catot − E°anot
5. ỨNG DỤNG
6. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-18',
    cat: 'hoc',
    title: 'Giải thích điện phân dung dịch',
    desc: 'Điện phân nóng chảy, dung dịch, tính khối lượng chất thu được.',
    tags: ['điện phân', 'chi tiết'],
    prompt: `Hướng dẫn điện phân cho học sinh {{lớp}}.

BÀI ĐIỆN PHÂN: "{{mô tả}}"

YÊU CẦU:

1. NGUYÊN LÝ (nóng chảy, dung dịch)
2. SẢN PHẨM Ở CATOT (−)
3. SẢN PHẨM Ở ANOT (+)
4. ĐỊNH LUẬT FARADAY: m = A·I·t / (n·F)
5. ỨNG DỤNG THỰC TẾ
6. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-19',
    cat: 'hoc',
    title: 'Tính pH dung dịch đệm',
    desc: 'Công thức Henderson–Hasselbalch, cách chuẩn bị dung dịch đệm.',
    tags: ['pH', 'chi tiết'],
    prompt: `Hướng dẫn dung dịch đệm cho học sinh {{lớp}}.

BÀI TOÁN: "{{mô tả}}"

YÊU CẦU:

1. KHÁI NIỆM DUNG DỊCH ĐỆM
2. CÔNG THỨC pH = pKa + log([A⁻]/[HA])
3. VÍ DỤ CỤ THỂ
4. PHA CHẾ DUNG DỊCH ĐỆM
5. ỨNG DỤNG
6. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-20',
    cat: 'hoc',
    title: 'Cân bằng hóa học và Le Chatelier',
    desc: 'Yếu tố ảnh hưởng cân bằng, dự đoán chiều dịch chuyển.',
    tags: ['cân bằng', 'chi tiết'],
    prompt: `Hướng dẫn cân bằng hóa học cho học sinh {{lớp}}.

PHẢN ỨNG: "{{phản ứng thuận nghịch}}"

YÊU CẦU:

1. KHÁI NIỆM CÂN BẰNG (K)
2. NGUYÊN LÝ LE CHATELIER (4 yếu tố)
3. PHÂN TÍCH TỪNG YẾU TỐ
4. VÍ DỤ: phản ứng Haber
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-21',
    cat: 'hoc',
    title: 'Tính hiệu suất phản ứng',
    desc: 'Xác định chất hết/dư, tính hiệu suất lý thuyết, thực tế.',
    tags: ['hiệu suất', 'chi tiết'],
    prompt: `Hướng dẫn tính hiệu suất phản ứng cho học sinh {{lớp}}.

BÀI TOÁN: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH CHẤT HẾT – CHẤT DƯ
2. TÍNH KHỐI LƯỢNG LÝ THUYẾT
3. TÍNH HIỆU SUẤT: H = (m_tt / m_lt) × 100
4. BÀI TẬP MINH HOẠ (2 ví dụ)
5. BÀI TẬP TỰ LUYỆN

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-22',
    cat: 'hoc',
    title: 'Tính nồng độ dung dịch sau pha trộn',
    desc: 'Pha loãng, trộn 2 dung dịch, tính C%, CM.',
    tags: ['dung dịch', 'chi tiết'],
    prompt: `Hướng dẫn tính nồng độ dung dịch cho học sinh {{lớp}}.

BÀI TOÁN: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH DẠNG BÀI
2. CÔNG THỨC (CM, C%, C₁V₁=C₂V₂)
3. GIẢI CHI TIẾT
4. VÍ DỤ CỤ THỂ
5. LƯU Ý (thể tích không cộng được)
6. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-23',
    cat: 'hoc',
    title: 'Este – Lipid',
    desc: 'Tổng hợp kiến thức este, phản ứng thủy phân, xà phòng hóa.',
    tags: ['este', 'chi tiết'],
    prompt: `Hướng dẫn Este – Lipid cho học sinh {{lớp}}.

YÊU CẦU:

1. KHÁI NIỆM ESTE (định nghĩa, danh pháp)
2. TÍNH CHẤT VẬT LÝ
3. TÍNH CHẤT HÓA HỌC (thủy phân, xà phòng hóa, cháy)
4. ĐIỀU CHẾ (este hóa)
5. LIPID (chất béo, chỉ số)
6. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-24',
    cat: 'hoc',
    title: 'Amin – Amino axit – Protein',
    desc: 'Tính bazơ của amin, tính lưỡng tính, phản ứng biure.',
    tags: ['amin', 'chi tiết'],
    prompt: `Hướng dẫn Amin – Amino axit – Protein cho học sinh {{lớp}}.

YÊU CẦU:

1. AMIN (định nghĩa, bậc, bazơ)
2. AMINO AXIT (lưỡng tính, este hóa)
3. PEPTIT – PROTEIN (liên kết, biure)
4. BÀI TẬP
5. ỨNG DỤNG

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-25',
    cat: 'hoc',
    title: 'Kim loại kiềm, kiềm thổ, nhôm',
    desc: 'Tính chất, phản ứng đặc trưng, ứng dụng.',
    tags: ['kim loại', 'chi tiết'],
    prompt: `Hướng dẫn Kim loại IA, IIA, Al cho học sinh {{lớp}}.

YÊU CẦU:

1. KIM LOẠI KIỀM (Li, Na, K…)
2. KIM LOẠI KIỀM THỔ (Mg, Ca, Ba…)
3. NHÔM (Al) - tính lưỡng tính
4. BÀI TẬP
5. NƯỚC CỨNG

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-26',
    cat: 'hoc',
    title: 'Sắt – Crom – Đồng',
    desc: 'Tính chất, hợp chất quan trọng, phản ứng đặc trưng.',
    tags: ['kim loại chuyển tiếp', 'chi tiết'],
    prompt: `Hướng dẫn Fe – Cr – Cu cho học sinh {{lớp}}.

YÊU CẦU:

1. SẮT (Fe): số oxi hóa +2, +3; hợp chất
2. CROM (Cr): +2, +3, +6
3. ĐỒNG (Cu): +1, +2
4. BÀI TẬP
5. SO SÁNH TÍNH CHẤT

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-27',
    cat: 'hoc',
    title: 'Phân biệt hóa vô cơ và hữu cơ',
    desc: 'So sánh đặc điểm, phản ứng đặc trưng, ứng dụng.',
    tags: ['lý thuyết', 'chi tiết'],
    prompt: `Phân biệt hóa vô cơ và hữu cơ cho học sinh {{lớp}}.

YÊU CẦU:

1. ĐỊNH NGHĨA
2. BẢNG SO SÁNH (thành phần, liên kết, tính chất)
3. PHẢN ỨNG ĐẶC TRƯNG
4. NGOẠI LỆ (CO, CO₂, muối cacbonat)
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-28',
    cat: 'hoc',
    title: 'Giải thích đồng phân',
    desc: 'Các loại đồng phân, cách viết, cách đếm.',
    tags: ['đồng phân', 'chi tiết'],
    prompt: `Hướng dẫn đồng phân cho học sinh {{lớp}}.

CHẤT: {{chất}}

YÊU CẦU:

1. KHÁI NIỆM ĐỒNG PHÂN
2. CÁC LOẠI (mạch, vị trí, nhóm chức, hình học, quang học)
3. CÁCH VIẾT ĐỒNG PHÂN
4. CÔNG THỨC ĐẾM NHANH
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-29',
    cat: 'hoc',
    title: 'Xác định công thức phân tử',
    desc: 'Từ % khối lượng, từ sản phẩm cháy, từ M.',
    tags: ['CTPT', 'chi tiết'],
    prompt: `Hướng dẫn xác định CTPT cho học sinh {{lớp}}.

DỮ KIỆN: "{{dữ kiện}}"

YÊU CẦU:

1. XÁC ĐỊNH DẠNG BÀI
2. TÍNH % CÁC NGUYÊN TỐ
3. LẬP TỈ LỆ → CTĐGN
4. TÍNH M → CTPT
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-30',
    cat: 'hoc',
    title: 'Bài toán CO₂ + dung dịch kiềm',
    desc: 'Tạo muối cacbonat, hidrocacbonat, kết tủa.',
    tags: ['CO₂', 'chi tiết'],
    prompt: `Hướng dẫn bài toán CO₂ + kiềm cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH TỈ LỆ T = nOH⁻ / nCO₂
2. TRƯỜNG HỢP T ≤ 1: muối HCO₃⁻
3. TRƯỜNG HỢP 1 < T < 2: 2 muối
4. TRƯỜNG HỢP T ≥ 2: muối CO₃²⁻
5. KẾT TỦA (CaCO₃, BaCO₃)
6. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-31',
    cat: 'hoc',
    title: 'Bài toán kim loại + HNO₃',
    desc: 'Sản phẩm khử NO, NO₂, N₂O, N₂, NH₄NO₃.',
    tags: ['HNO₃', 'chi tiết'],
    prompt: `Hướng dẫn bài toán kim loại + HNO₃ cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH SẢN PHẨM KHỬ
2. BẢO TOÀN ELECTRON
3. CÔNG THỨC: nHNO₃ = 4nNO + 2nNO₂ + 10nN₂O + 12nN₂ + 10nNH₄NO₃
4. TÍNH m MUỐI
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-32',
    cat: 'hoc',
    title: 'Bài toán kim loại + H₂SO₄ đặc nóng',
    desc: 'Sản phẩm khử SO₂, S, H₂S.',
    tags: ['H₂SO₄', 'chi tiết'],
    prompt: `Hướng dẫn kim loại + H₂SO₄ đặc nóng cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH SẢN PHẨM KHỬ
2. BẢO TOÀN ELECTRON
3. CÔNG THỨC: nH₂SO₄ = 2nSO₂ + 4nS + 5nH₂S
4. TÍNH m MUỐI
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-33',
    cat: 'hoc',
    title: 'Bài toán hỗn hợp kim loại',
    desc: 'Giải hệ phương trình từ dữ kiện.',
    tags: ['hỗn hợp', 'chi tiết'],
    prompt: `Hướng dẫn bài toán hỗn hợp kim loại cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. PHÂN TÍCH DỮ KIỆN
2. ĐẶT ẨN
3. LẬP HỆ PHƯƠNG TRÌNH
4. GIẢI HỆ
5. KIỂM TRA
6. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-34',
    cat: 'hoc',
    title: 'Bài toán ancol + Na',
    desc: 'Tính số nhóm OH, thể tích H₂.',
    tags: ['ancol', 'chi tiết'],
    prompt: `Hướng dẫn ancol + Na cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH SỐ NHÓM OH: nOH = 2nH₂
2. PHƯƠNG TRÌNH PHẢN ỨNG
3. GIẢI CHI TIẾT
4. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-35',
    cat: 'hoc',
    title: 'Bài toán este + NaOH',
    desc: 'Xà phòng hóa, tính m muối, m ancol.',
    tags: ['este', 'chi tiết'],
    prompt: `Hướng dẫn este + NaOH cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. PHÂN TÍCH ĐỀ
2. PHƯƠNG TRÌNH: RCOOR' + NaOH → RCOONa + R'OH
3. BẢO TOÀN KHỐI LƯỢNG
4. GIẢI CHI TIẾT
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-36',
    cat: 'hoc',
    title: 'Bài toán tráng bạc',
    desc: 'Phản ứng tráng bạc của andehit, glucozơ.',
    tags: ['tráng bạc', 'chi tiết'],
    prompt: `Hướng dẫn bài toán tráng bạc cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH CHẤT TRÁNG BẠC
2. TỈ LỆ: HCHO → 4Ag; RCHO → 2Ag
3. TÍNH m Ag
4. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-37',
    cat: 'hoc',
    title: 'Bài toán đốt cháy hợp chất hữu cơ',
    desc: 'Tính C, H, O từ sản phẩm cháy.',
    tags: ['đốt cháy', 'chi tiết'],
    prompt: `Hướng dẫn đốt cháy hợp chất hữu cơ cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. PHƯƠNG TRÌNH ĐỐT CHÁY TỔNG QUÁT
2. BẢO TOÀN NGUYÊN TỐ
3. TÍNH m C, m H, m O
4. LẬP TỈ LỆ → CTPT
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-38',
    cat: 'hoc',
    title: 'Bài toán thủy phân peptit',
    desc: 'Tính số mắt xích, m amino axit.',
    tags: ['peptit', 'chi tiết'],
    prompt: `Hướng dẫn thủy phân peptit cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH SỐ MẮT XÍCH
2. PHẢN ỨNG THỦY PHÂN
3. CÔNG THỨC: m peptit = m aa − 18·(k−1)·n
4. GIẢI CHI TIẾT
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-39',
    cat: 'hoc',
    title: 'Bài toán sắt và hợp chất',
    desc: 'Fe, FeO, Fe₂O₃, Fe₃O₄ tác dụng axit.',
    tags: ['sắt', 'chi tiết'],
    prompt: `Hướng dẫn bài toán sắt và hợp chất cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH SỐ OXI HÓA FE
2. PHƯƠNG TRÌNH PHẢN ỨNG
3. BẢO TOÀN ELECTRON
4. TÍNH TOÁN
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-40',
    cat: 'hoc',
    title: 'Bài toán nhiệt nhôm',
    desc: 'Phản ứng nhiệt nhôm Al + oxit kim loại.',
    tags: ['nhiệt nhôm', 'chi tiết'],
    prompt: `Hướng dẫn nhiệt nhôm cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. PHƯƠNG TRÌNH: 2Al + Fe₂O₃ → Al₂O₃ + 2Fe
2. ĐIỀU KIỆN (nhiệt độ cao)
3. TÍNH HIỆU SUẤT
4. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-41',
    cat: 'hoc',
    title: 'Bài toán lên men glucozơ',
    desc: 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂.',
    tags: ['glucozơ', 'chi tiết'],
    prompt: `Hướng dẫn lên men glucozơ cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. PHƯƠNG TRÌNH LÊN MEN
2. TÍNH n C₂H₅OH, n CO₂
3. HIỆU SUẤT
4. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-42',
    cat: 'hoc',
    title: 'Bài toán thủy phân tinh bột',
    desc: '(C₆H₁₀O₅)ₙ → n C₆H₁₂O₆ (162 → 180).',
    tags: ['tinh bột', 'chi tiết'],
    prompt: `Hướng dẫn thủy phân tinh bột cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. PHƯƠNG TRÌNH THỦY PHÂN
2. TÍNH m GLUCOZƠ
3. HIỆU SUẤT
4. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-43',
    cat: 'hoc',
    title: 'Bài toán phản ứng cộng H₂',
    desc: 'Hiđro hóa anken, ankin, andehit.',
    tags: ['cộng H₂', 'chi tiết'],
    prompt: `Hướng dẫn phản ứng cộng H₂ cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. XÁC ĐỊNH CHẤT CỘNG H₂
2. nH₂ = n trước − n sau
3. TÍNH TOÁN
4. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-44',
    cat: 'hoc',
    title: 'Bài toán độ rượu',
    desc: 'Độ rượu = V(C₂H₅OH) / V(dd) × 100.',
    tags: ['độ rượu', 'chi tiết'],
    prompt: `Hướng dẫn bài toán độ rượu cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. CÔNG THỨC ĐỘ RƯỢU
2. TÍNH V NGUYÊN CHẤT
3. m = D × V (D = 0,8 g/ml)
4. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-45',
    cat: 'hoc',
    title: 'Bài toán hệ số trùng hợp',
    desc: 'Hệ số polime hóa, tính M polime.',
    tags: ['polime', 'chi tiết'],
    prompt: `Hướng dẫn bài toán polime cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. CÔNG THỨC: n = M polime / M mắt xích
2. VÍ DỤ: PE, PVC, nilon-6
3. GIẢI CHI TIẾT
4. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-46',
    cat: 'hoc',
    title: 'Bài toán nhận biết hữu cơ',
    desc: 'Nhận biết ancol, andehit, axit, este.',
    tags: ['nhận biết hữu cơ', 'chi tiết'],
    prompt: `Hướng dẫn nhận biết hợp chất hữu cơ cho học sinh {{lớp}}.

DANH SÁCH CHẤT: {{danh sách}}

YÊU CẦU:

1. THUỐC THỬ ĐẶC TRƯNG
2. HIỆN TƯỢNG
3. PHƯƠNG TRÌNH
4. SƠ ĐỒ NHẬN BIẾT
5. BÀI TẬP

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-47',
    cat: 'hoc',
    title: 'Sinh đề tự luyện Hóa theo dạng',
    desc: 'AI sinh đề tự luyện theo dạng bài, có đáp án.',
    tags: ['tự luyện', 'chi tiết'],
    prompt: `Sinh đề tự luyện Hóa cho học sinh {{lớp}}.

DẠNG BÀI: {{dạng bài}}
SỐ BÀI: {{số bài}}
ĐỘ KHÓ: {{độ khó}}

YÊU CẦU:
1. Chia độ khó (40% dễ, 40% TB, 20% khó).
2. Bảng đáp án + lời giải ngắn.
3. Đa dạng, không trùng.
4. Lời khuyên luyện tập.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-48',
    cat: 'hoc',
    title: 'Hướng dẫn giải đề thi THPT Hóa',
    desc: 'Chiến lược làm bài, phân bổ thời gian, giải mẫu.',
    tags: ['luyện thi', 'chi tiết'],
    prompt: `Hướng dẫn giải đề thi THPT Quốc gia môn Hóa học.

ĐỀ THI:
{{đề thi}}

YÊU CẦU:
1. Phân tích cấu trúc đề.
2. Phân bổ thời gian.
3. Chiến lược làm bài.
4. Giải chi tiết 10 câu đại diện.
5. Lời khuyên phòng thi.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-49',
    cat: 'hoc',
    title: 'Tổng hợp công thức Hóa 10',
    desc: 'Công thức trọng tâm lớp 10.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp công thức Hóa học 10.

YÊU CẦU:
1. Cấu tạo nguyên tử
2. Bảng tuần hoàn
3. Liên kết hóa học
4. Phản ứng oxi hóa khử
5. Nhóm halogen

Mỗi phần: công thức, đơn vị, khi nào dùng.

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
  {
    id: 'hoc-50',
    cat: 'hoc',
    title: 'Tổng hợp công thức Hóa 11',
    desc: 'Công thức trọng tâm lớp 11.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp công thức Hóa học 11.

YÊU CẦU:
1. Sự điện li
2. Nitơ - Photpho
3. Cacbon - Silic
4. Đại cương hữu cơ
5. Hiđrocacbon
6. Ancol - Phenol
7. Andehit - Axit cacboxylic

ĐỊNH DẠNG:
- Không dùng LaTeX.`,
    long: true,
  },
];