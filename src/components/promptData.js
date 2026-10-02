// ============================================================
// THƯ VIỆN PROMPT — phiên bản chi tiết
// - Biến điền được viết dạng {{tên biến}}
// - img (tuỳ chọn): đường dẫn ảnh mẫu thật
// - sample (tuỳ chọn): đoạn kết quả mẫu
// - long (tuỳ chọn): true nếu prompt dài > 500 ký tự
// ============================================================

export const PROMPT_CATS = [
  { id: 'huong-dan', name: 'Hướng dẫn dùng', hue: 200, kind: 'guide', guide: true },
  { id: 'hoc', name: 'Học Hóa', hue: 165, kind: 'molecule', chat: true },
  { id: 'viet', name: 'Viết & học thuật', hue: 265, kind: 'lines', chat: true },
  { id: 'anh', name: 'Tạo ảnh', hue: 330, kind: 'scene', open: [['Bing Image Creator', 'https://www.bing.com/images/create'], ['ImageFX', 'https://labs.google/fx/tools/image-fx']] },
  { id: 'video', name: 'Tạo video', hue: 215, kind: 'scene', open: [['Google Flow', 'https://labs.google/fx/tools/flow'], ['Kling AI', 'https://klingai.com']] },
  { id: 'code', name: 'Lập trình', hue: 195, kind: 'code', chat: true },
  { id: 'mkt', name: 'Marketing & Maps', hue: 22, kind: 'chart', chat: true },
  { id: 'dich', name: 'Dịch & ngoại ngữ', hue: 48, kind: 'bubbles', chat: true },
];

// ============================================================
// HƯỚNG DẪN SỬ DỤNG — hiển thị dạng step-by-step
// ============================================================
export const GUIDE_STEPS = [
  {
    num: '01',
    title: 'Chọn đúng nhóm prompt',
    body: 'Mỗi nhóm (Học Hóa, Viết, Tạo ảnh, Lập trình…) có phong cách viết khác nhau. Chọn nhóm khớp với việc bạn đang làm để AI trả lời đúng ngữ cảnh.',
    tips: [
      'Học Hóa → dùng cho bài tập, lý thuyết, ôn thi',
      'Tạo ảnh/video → prompt viết bằng tiếng Anh, dán vào công cụ AI',
      'Marketing → dùng cho Google Maps, Facebook, TikTok',
    ],
  },
  {
    num: '02',
    title: 'Điền các ô có dấu {{…}}',
    body: 'Prompt có các biến dạng {{lớp}}, {{chủ đề}}, {{đề bài}}… Bạn điền càng chi tiết, AI trả lời càng sát. Ô nào bỏ trống sẽ giữ nguyên dạng [tên biến] trong prompt — không sao, AI vẫn hiểu.',
    tips: [
      'Ví dụ: {{lớp}} → "Lớp 11", {{chủ đề}} → "Ancol – Phenol"',
      'Ô dài (đề bài, code, văn bản) có thể dán nhiều dòng',
      'Bấm "Đặt lại" nếu muốn quay về bản gốc sau khi sửa',
    ],
  },
  {
    num: '03',
    title: 'Xem trước — chỉnh trực tiếp',
    body: 'Khung "Prompt hoàn chỉnh" hiển thị bản đã điền. Bạn có thể sửa trực tiếp trong khung này để thêm yêu cầu riêng (ví dụ: "viết ngắn hơn", "cho 3 ví dụ").',
    tips: [
      'Số ô chưa điền hiển thị ngay phía trên — nhắc bạn đừng bỏ sót',
      'Sửa trực tiếp sẽ ghi đè lên bản điền tự động',
    ],
  },
  {
    num: '04',
    title: 'Chọn nơi gửi',
    body: 'Bạn có 4 lựa chọn: Hỏi AI của web (miễn phí, có quota), ChatGPT, Claude, hoặc sao chép để dán vào công cụ khác.',
    tips: [
      'Hỏi AI của web → tự chuyển sang trang chat, giữ nguyên prompt',
      'Sao chép → dán vào bất kỳ AI nào bạn muốn',
      'Prompt quá dài (> 7000 ký tự) sẽ không gửi qua URL được — phải sao chép',
    ],
  },
  {
    num: '05',
    title: 'Lưu prompt hay dùng lại',
    body: 'Bấm ngôi sao trên thẻ để lưu vào mục "Đã lưu". Lần sau vào tab "Đã lưu" là thấy ngay, không cần tìm lại.',
    tips: [
      'Lưu được lưu trong localStorage — chỉ trên máy bạn',
      'Bấm sao lần 2 để bỏ lưu',
      'Sao chép nhanh: bấm icon copy trên thẻ, không cần mở chi tiết',
    ],
  },
  {
    num: '06',
    title: 'Mẹo viết prompt hiệu quả',
    body: 'AI trả lời tốt khi prompt có: vai trò (bạn là…), nhiệm vụ (hãy…), ràng buộc (không quá… từ), định dạng (trình bày dạng bảng).',
    tips: [
      'Càng cụ thể càng tốt: "viết 200 từ" > "viết ngắn"',
      'Cho ví dụ mẫu nếu muốn AI bắt chước giọng văn',
      'Yêu cầu AI tự kiểm tra lại kết quả trước khi trả lời',
      'Nếu AI trả lời lan man, thêm: "chỉ trả lời đúng câu hỏi, không giải thích thêm"',
    ],
  },
];

// ============================================================
// PROMPTS — chi tiết, dài, có cấu trúc rõ
// ============================================================
export const PROMPTS = [
  // ================= HỌC HÓA =================
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
   - Chứng minh / quan sát điều gì?
   - Liên quan đến bài học nào?

2. DỤNG CỤ VÀ HÓA CHẤT
   - Liệt kê dụng cụ (kèm số lượng).
   - Liệt kê hóa chất (kèm nồng độ, khối lượng).
   - Ghi rõ hóa chất nào nguy hiểm.

3. CÁC BƯỚC TIẾN HÀNH
   - Đánh số từng bước.
   - Mỗi bước ghi rõ thao tác và lưu ý.
   - Ghi chú thời gian chờ (nếu có).

4. HIỆN TƯỢNG QUAN SÁT
   - Màu sắc, mùi, kết tủa, bọt khí…
   - Thứ tự xuất hiện hiện tượng.

5. PHƯƠNG TRÌNH PHẢN ỨNG
   - Viết và cân bằng.
   - Ghi rõ điều kiện (nhiệt độ, xúc tác).
   - Nếu có nhiều phản ứng, đánh số.

6. GIẢI THÍCH HIỆN TƯỢNG
   - Vì sao có hiện tượng đó?
   - Liên hệ với lý thuyết đã học.

7. LƯU Ý AN TOÀN
   - Cách đeo kính, găng tay, áo bảo hộ.
   - Cách xử lý khi hóa chất dính da/mắt.
   - Cách dập tắt đám cháy nhỏ.
   - Cách xử lý khi tràn hóa chất.

8. XỬ LÝ SỰ CỐ
   - Nếu hiện tượng không như mong đợi, kiểm tra gì?
   - Khi nào cần dừng thí nghiệm ngay?

9. CÂU HỎI SAU THÍ NGHIỆM
   - 3 câu hỏi để học sinh suy luận.

ĐỊNH DẠNG:
- Không dùng LaTeX.
- Công thức Unicode.`,
    long: true,
  },

  // ================= VIẾT & HỌC THUẬT =================
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
   - Không thêm thông tin ngoài văn bản.

3. 3 ĐIỀU CẦN GHI NHỚ / CẦN LÀM
   - Ghi dạng gạch đầu dòng.
   - Ưu tiên thông tin có thể áp dụng ngay.

4. BẢN TÓM TẮT 1 ĐOẠN
   - Viết lại thành 1 đoạn văn liền mạch 100-150 từ.
   - Giữ giọng trung tính, khách quan.

5. CÂU HỎI MỞ
   - 2-3 câu hỏi gợi mở để đọc sâu hơn.

ĐỊNH DẠNG:
- Không thêm nhận xét cá nhân.
- Không dùng LaTeX nếu có công thức.`,
    long: true,
  },
  {
    id: 'viet-dan-y',
    cat: 'viet',
    title: 'Lập dàn ý bài luận',
    desc: 'Luận điểm, ý chính kèm dẫn chứng gợi ý, mở bài và kết bài nháp. Có phản biện.',
    tags: ['dàn ý', 'bài luận', 'chi tiết'],
    prompt: `Bạn là giáo viên Ngữ văn hướng dẫn học sinh {{lớp}} lập dàn ý bài luận.

THÔNG TIN:
- Loại bài: {{loại bài}}
- Chủ đề: "{{chủ đề}}"
- Độ dài dự kiến: {{số từ}} từ

YÊU CẦU:

1. LUẬN ĐIỂM TRUNG TÂM
   - 1 câu nêu rõ quan điểm.
   - Có thể gây tranh luận (không quá an toàn).

2. 3-4 Ý CHÍNH
   Với mỗi ý:
   - Tên ý (1 câu).
   - Giải thích ngắn (2-3 câu).
   - Dẫn chứng gợi ý (1-2 ví dụ).
   - Kết nối với luận điểm trung tâm.

3. MỞ BÀI (viết nháp 3-4 câu)
   - Dẫn dắt tự nhiên.
   - Nêu vấn đề và quan điểm.

4. KẾT BÀI (viết nháp 3-4 câu)
   - Khẳng định lại quan điểm.
   - Mở rộng hoặc gợi mở.

5. PHẢN BIỆN
   - 1 quan điểm trái chiều có thể gặp.
   - Cách phản hồi lại quan điểm đó (2-3 câu).

6. GỢI Ý TỪ NGỮ
   - 5-7 từ/cụm từ nên dùng.
   - 3 từ/cụm từ nên tránh.

ĐỊNH DẠNG:
- Đánh số rõ ràng.
- Dàn ý dạng bullet, dễ đọc.`,
    long: true,
  },
  {
    id: 'viet-viet-lai',
    cat: 'viet',
    title: 'Viết lại cho tự nhiên',
    desc: 'Hai phương án, giữ nguyên ý, nói rõ khác biệt giữa chúng. Có phân tích điểm yếu câu gốc.',
    tags: ['biên tập', 'chi tiết'],
    prompt: `Bạn là biên tập viên chuyên nghiệp. Hãy viết lại đoạn văn sau cho tự nhiên và rõ ràng hơn.

ĐOẠN VĂN GỐC:
{{đoạn văn}}

YÊU CẦU:

1. PHÂN TÍCH ĐOẠN GỐC
   - 3 điểm yếu: câu dài, lặp từ, ý rối…
   - 1-2 điểm mạnh cần giữ.

2. PHƯƠNG ÁN 1 — GIỮ NGUYÊN Ý, SỬA NHẸ
   - Chỉ sửa câu, không đổi cấu trúc.
   - Giữ giọng {{giọng văn}}.

3. PHƯƠNG ÁN 2 — VIẾT LẠI THOÁNG
   - Có thể đổi cấu trúc đoạn.
   - Vẫn giữ đủ ý.

4. SO SÁNH 2 PHƯƠNG ÁN
   - Phương án nào phù hợp với mục đích gì?
   - Khi nào nên chọn phương án 1, khi nào chọn 2.

5. GHI CHÚ BIÊN TẬP
   - Liệt kê từng thay đổi lớn và lý do.
   - Chỉ ra lỗi ngữ pháp nếu có.

ĐỊNH DẠNG:
- Đánh số phương án rõ ràng.
- Không thay đổi ý nghĩa gốc.`,
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

1. TIÊU ĐỀ EMAIL
   - Rõ ràng, ngắn (dưới 10 từ).
   - Nêu đúng mục đích.

2. NỘI DUNG EMAIL (dưới 120 từ)
   - Lời chào phù hợp (kính gửi, thưa…).
   - Tự giới thiệu ngắn (nếu cần).
   - Trình bày mục đích rõ ràng.
   - Đề xuất / hỏi ý kiến (nếu có).
   - Lời cảm ơn và kết.
   - Chữ ký (họ tên, lớp).

3. GIỌNG VĂN
   - Lịch sự, không rườm rà.
   - Không dùng từ quá thân mật.
   - Không dùng emoji.

4. PHƯƠNG ÁN DỰ PHÒNG
   - Nếu thầy cô chưa trả lời sau 3 ngày, viết email nhắc lại (ngắn hơn 50 từ).

5. LƯU Ý
   - 3 điều nên tránh khi viết email cho thầy cô.

ĐỊNH DẠNG:
- Đánh dấu rõ Tiêu đề / Nội dung / Chữ ký.`,
    long: true,
  },

  // ================= TẠO ẢNH =================
  {
    id: 'anh-san-pham',
    cat: 'anh',
    title: 'Ảnh sản phẩm đồ uống',
    desc: 'Ảnh quảng cáo kiểu studio cho ly trà sữa, cà phê, nước ép. Prompt tiếng Anh chi tiết.',
    tags: ['sản phẩm', 'F&B', 'chi tiết'],
    prompt: `Professional commercial product photograph of {{product}} placed on a {{surface}}. 

LIGHTING: soft diffused window light from the left, subtle rim light on the right edge, warm color temperature around 4500K.

COMPOSITION: shallow depth of field (f/2.8), focus on the product's front label, slight top-down angle (15 degrees), rule of thirds.

DETAILS: condensation droplets on the glass, fresh ice cubes, a few drops of liquid on the surface, subtle steam rising if hot drink.

BACKGROUND: clean {{color}} seamless backdrop, soft gradient from top to bottom, no distracting elements.

CAMERA: 85mm prime lens, full-frame sensor, eye-level perspective, high detail, sharp focus on product.

STYLE: commercial food photography, editorial magazine quality, minimalist, premium feel.

TECHNICAL: 4:5 aspect ratio, high resolution, no text overlay, no watermark, no people visible.

NEGATIVE: no blurry product, no oversaturated colors, no cluttered background, no plastic-looking textures.`,
    long: true,
  },
  {
    id: 'anh-poster-hoa',
    cat: 'anh',
    title: 'Poster khoa học isometric',
    desc: 'Phòng lab 3D với đồ thủy tinh phát sáng và phân tử bay lơ lửng. Có palette màu và chi tiết.',
    tags: ['poster', 'hóa học', 'chi tiết'],
    prompt: `Isometric 3D illustration of a {{science topic}} laboratory scene.

MAIN ELEMENTS: glowing glassware (beakers, flasks, test tubes), floating molecules connected by thin lines, a microscope in the corner, a periodic table poster on the wall, small plants in glass containers.

COLOR PALETTE: deep navy background (#0a1230), electric blue glow (#2f6bff), cyan accents (#7db3ff), warm orange highlights (#ff8c42) for contrast.

LIGHTING: soft studio lighting from top-left, glowing elements emit their own light, subtle shadows on the floor.

STYLE: clean vector-like illustration, isometric perspective (30-degree angle), minimal background, no people, no text.

COMPOSITION: centered laboratory bench, elements balanced across the frame, negative space at the top for potential title.

TECHNICAL: 16:9 aspect ratio, high resolution, suitable for poster or presentation cover.

NEGATIVE: no realistic photo textures, no cluttered background, no dark unreadable areas.`,
    long: true,
  },
  {
    id: 'anh-logo',
    cat: 'anh',
    title: 'Logo tối giản',
    desc: 'Biểu tượng hình học phẳng, dễ thu phóng, nền trơn. Có hướng dẫn về negative space.',
    tags: ['logo', 'thương hiệu', 'chi tiết'],
    prompt: `Minimal flat vector logo design for "{{brand name}}", a {{business type}}.

DESIGN PRINCIPLES:
- Simple geometric icon, maximum 3 shapes.
- Balanced negative space.
- Recognizable at 16x16 px (favicon) and scalable to billboard size.

COLOR: {{color}} and white, maximum 2 colors, no gradients, no shadows.

COMPOSITION: icon centered on plain background, generous padding around the icon (at least 20% of canvas).

STYLE: modern, timeless, professional, no trendy effects that age quickly.

TECHNICAL: vector format, clean edges, no anti-aliasing artifacts, suitable for print and digital.

NEGATIVE: no text in the logo (unless it's a single letter), no 3D effects, no photorealism, no clip-art style, no busy details.`,
    long: true,
  },
  {
    id: 'anh-bia',
    cat: 'anh',
    title: 'Ảnh bìa Facebook',
    desc: 'Banner ngang chừa chỗ bên trái để chèn chữ. Có hướng dẫn bố cục.',
    tags: ['banner', 'social', 'chi tiết'],
    prompt: `Wide cover banner for a {{business type}}.

ATMOSPHERE: warm inviting atmosphere, {{theme}} color palette, natural light, welcoming feel.

COMPOSITION:
- Empty space on the LEFT third for text overlay (logo, tagline).
- Main subject on the RIGHT two-thirds.
- Rule of thirds applied horizontally.

LIGHTING: soft cinematic lighting, golden hour if outdoor, warm interior if indoor, subtle lens flare acceptable.

STYLE: cinematic, editorial, aspirational but achievable, no excessive filters.

TECHNICAL: 16:9 aspect ratio (1920x1080 or larger), high resolution, sharp focus on main subject.

NEGATIVE: no text baked into image, no cluttered foreground, no watermark, no low-resolution artifacts.`,
    long: true,
  },
  {
    id: 'anh-nhan-vat',
    cat: 'anh',
    title: 'Nhân vật nhà khoa học hoạt hình',
    desc: 'Linh vật 3D dễ thương dùng cho bài giảng, sticker, avatar. Có hướng dẫn biểu cảm.',
    tags: ['nhân vật', '3D', 'chi tiết'],
    prompt: `Cute 3D cartoon scientist character holding a {{object}}.

CHARACTER DESIGN:
- Pixar-style proportions (large head, expressive eyes, small body).
- Friendly, approachable expression with a warm smile.
- Simple clothing: white lab coat, safety goggles pushed up on forehead.
- Holding {{object}} in one hand, other hand giving a thumbs up.

STYLE: Pixar/Disney animation style, soft rounded shapes, subtle subsurface scattering on skin, soft rim light.

LIGHTING: soft key light from front-left, fill light from right, subtle rim light from behind, warm color temperature.

BACKGROUND: pastel {{color}} seamless backdrop, soft gradient, no distracting elements.

COMPOSITION: character centered, full body or 3/4 body visible, eye contact with viewer.

TECHNICAL: high quality render, 1:1 aspect ratio (avatar-friendly), transparent background option.

NEGATIVE: no realistic human proportions, no scary expressions, no cluttered background, no visible text.`,
    long: true,
  },
  {
    id: 'anh-phong-canh',
    cat: 'anh',
    title: 'Phong cảnh điện ảnh',
    desc: 'Cảnh rộng có ánh sáng khối, sương mỏng và màu phim. Có hướng dẫn color grading.',
    tags: ['phong cảnh', 'chi tiết'],
    prompt: `Cinematic wide shot of {{place}} at {{time of day}}.

ATMOSPHERE: volumetric light rays, atmospheric haze in the distance, subtle fog near the ground, dust particles floating in the air.

COLOR GRADING: rich cinematic color palette, teal and orange if applicable, deep shadows with lifted blacks, warm highlights.

COMPOSITION: wide establishing shot, rule of thirds, foreground element for depth, midground subject, background receding into haze.

LIGHTING: natural light (golden hour / blue hour / dramatic overcast), strong directional light, long shadows.

STYLE: 35mm film look, subtle grain, cinematic aspect ratio (2.39:1 or 16:9), Ansel Adams meets Roger Deakins.

TECHNICAL: ultra detailed, high dynamic range, sharp focus on foreground and midground, soft focus in background.

NEGATIVE: no HDR over-processing, no oversaturated colors, no people in frame (unless specified), no text, no watermark.`,
    long: true,
  },

  // ================= TẠO VIDEO =================
  {
    id: 'vd-san-pham',
    cat: 'video',
    title: 'Quay sản phẩm điện ảnh',
    desc: 'Cảnh máy lia chậm vào sản phẩm với hạt bụi sáng lơ lửng. Có thông số camera.',
    tags: ['sản phẩm', '5 giây', 'chi tiết'],
    prompt: `Slow dolly-in on {{product}} placed on {{surface}}.

CAMERA MOVEMENT: smooth slow dolly-in from medium shot to close-up, 5 seconds duration, gimbal-stabilized, no shake.

LIGHTING: soft backlight creating a rim around the product, warm key light from the left, subtle fill from the right, floating dust particles catching the light.

DEPTH OF FIELD: shallow (f/2.8), focus racking from front to back slowly.

ATMOSPHERE: minimal, clean, premium, subtle steam or smoke if applicable.

STYLE: commercial product video, Apple/Nike aesthetic, high-end advertising quality.

TECHNICAL:
- 5 seconds duration
- 16:9 aspect ratio
- 24fps for cinematic feel
- 4K resolution minimum
- smooth motion, no abrupt cuts

NEGATIVE: no shaky camera, no zoom, no quick cuts, no text overlay, no people, no cluttered background.`,
    long: true,
  },
  {
    id: 'vd-phan-ung',
    cat: 'video',
    title: 'Cận cảnh phản ứng hóa học',
    desc: 'Đổi màu, sủi bọt trong cốc thủy tinh, quay chậm. Có mô tả hiện tượng.',
    tags: ['hóa học', 'macro', 'chi tiết'],
    prompt: `Macro shot of {{reaction}} in a glass beaker.

ACTION:
- Vivid color change from {{color 1}} to {{color 2}}
- Bubbles rising continuously
- Subtle temperature change visible (steam or condensation)
- Precipitate forming if applicable

CAMERA: macro lens, 100mm, very shallow depth of field (f/4), slow motion (120fps slowed to 24fps), slight push-in.

LIGHTING: dark laboratory background, dramatic side lighting, soft reflections on the glass, subtle backlight for bubbles.

STYLE: scientific documentary, BBC Earth quality, educational but cinematic.

TECHNICAL:
- 8 seconds duration
- 16:9 aspect ratio
- Slow motion
- 4K resolution
- no text, no people visible

NEGATIVE: no fake CGI bubbles, no unnatural colors, no shaky camera, no cluttered lab background.`,
    long: true,
  },
  {
    id: 'vd-quang-cao',
    cat: 'video',
    title: 'Kịch bản quảng cáo 15 giây',
    desc: '3 cảnh có góc máy, chữ trên màn hình và prompt cho từng cảnh. Có CTA.',
    tags: ['kịch bản', 'quảng cáo', 'chi tiết'],
    prompt: `Viết kịch bản quảng cáo 15 giây cho {{loại quán}} tại {{địa điểm}}.

SẢN PHẨM/DỊCH VỤ CHÍNH: {{sản phẩm chính}}
ĐỐI TƯỢNG KHÁCH: {{đối tượng khách}}
THÔNG ĐIỆP CHÍNH: {{thông điệp}}

CẤU TRÚC 3 CẢNH (mỗi cảnh 5 giây):

CẢNH 1 — HOOK (0-5s)
- Góc máy: [mô tả cụ thể]
- Hành động: [mô tả]
- Chữ trên màn hình: [nội dung, tối đa 6 từ]
- Âm thanh: [nhạc, giọng nói, tiếng động]
- Prompt tiếng Anh cho AI video: [viết đầy đủ]

CẢNH 2 — VẤN ĐỀ + GIẢI PHÁP (5-10s)
- Góc máy: [...]
- Hành động: [...]
- Chữ trên màn hình: [...]
- Âm thanh: [...]
- Prompt tiếng Anh: [...]

CẢNH 3 — CTA (10-15s)
- Góc máy: [...]
- Hành động: [...]
- Chữ trên màn hình: [bao gồm địa chỉ, SĐT, hoặc website]
- Âm thanh: [...]
- Prompt tiếng Anh: [...]

GHI CHÚ THÊM:
- Nhạc nền gợi ý: [thể loại, nhịp độ]
- Màu sắc chủ đạo: [mã màu hoặc tên màu]
- Phong cách tổng thể: [vui tươi / sang trọng / gần gũi…]
- 3 lỗi cần tránh khi làm video 15 giây.`,
    long: true,
  },

  // ================= LẬP TRÌNH =================
  {
    id: 'code-giai-thich',
    cat: 'code',
    title: 'Giải thích đoạn code',
    desc: 'Mục đích, luồng chạy từng bước và các chỗ dễ gây lỗi. Có gợi ý cải thiện.',
    tags: ['học code', 'chi tiết'],
    prompt: `Bạn là senior developer đang hướng dẫn junior đọc hiểu code.

NGÔN NGỮ: {{ngôn ngữ}}
TRÌNH ĐỘ NGƯỜI ĐỌC: {{trình độ}}

CODE:
\`\`\`{{ngôn ngữ}}
{{code}}
\`\`\`

YÊU CẦU:

1. MỤC ĐÍCH TỔNG QUAN
   - Đoạn code này làm gì? (1-2 câu)
   - Dùng trong ngữ cảnh nào?

2. LUỒNG CHẠY TỪNG BƯỚC
   - Đánh số từng bước chính.
   - Giải thích biến, hàm được dùng.
   - Nếu có vòng lặp/điều kiện, giải thích logic.

3. ĐIỂM DỄ GÂY LỖI
   - 2-3 chỗ dễ sai hoặc khó hiểu.
   - Vì sao dễ sai.
   - Cách tránh.

4. GỢI Ý CẢI THIỆN
   - Có thể viết gọn hơn không?
   - Có thể dùng cấu trúc dữ liệu/thuật toán tốt hơn không?
   - Đặt tên biến/hàm có rõ ràng không?

5. PHIÊN BẢN CẢI TIẾN (nếu có)
   - Viết lại đoạn code với cải tiến.
   - Chú thích các thay đổi.

ĐỊNH DẠNG:
- Dùng code block với syntax highlighting.
- Giải thích bằng tiếng Việt, giữ thuật ngữ tiếng Anh.`,
    long: true,
  },
  {
    id: 'code-sua-loi',
    cat: 'code',
    title: 'Tìm và sửa lỗi',
    desc: 'Nguyên nhân, bản sửa tối thiểu và cách tránh lặp lại. Có phân tích root cause.',
    tags: ['debug', 'chi tiết'],
    prompt: `Bạn là senior developer chuyên debug. Hãy giúp tìm và sửa lỗi.

NGÔN NGỮ: {{ngôn ngữ}}
MÔ TẢ LỖI: {{mô tả lỗi}}
THÔNG BÁO LỖI (nếu có): {{thông báo lỗi}}

CODE:
\`\`\`{{ngôn ngữ}}
{{code}}
\`\`\`

YÊU CẦU:

1. XÁC ĐỊNH NGUYÊN NHÂN GỐC (ROOT CAUSE)
   - Lỗi nằm ở dòng nào?
   - Vì sao lỗi xảy ra? (logic, cú pháp, môi trường, dependency…)
   - Nếu có nhiều nguyên nhân, xếp theo khả năng.

2. BẢN SỬA TỐI THIỂU
   - Chỉ sửa phần cần thiết, không refactor toàn bộ.
   - Giải thích từng thay đổi.
   - Đưa code đã sửa hoàn chỉnh.

3. KIỂM TRA LẠI
   - Cách test để xác nhận đã sửa đúng.
   - Edge case cần chú ý.

4. CÁCH TRÁNH LẶP LẠI
   - Lỗi này thuộc loại gì? (off-by-one, null check, race condition…)
   - Cách phòng tránh trong tương lai (linting, testing, code review…)

5. BẢN CẢI TIẾN (tuỳ chọn)
   - Nếu code có thể viết tốt hơn, gợi ý phiên bản cải tiến.

ĐỊNH DẠNG:
- Diff rõ ràng giữa code cũ và code mới.
- Code block có syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-react',
    cat: 'code',
    title: 'Viết component React',
    desc: 'Truy cập được bằng bàn phím, hỗ trợ sáng/tối, không phụ thuộc thư viện. Có test case.',
    tags: ['React', 'giao diện', 'chi tiết'],
    prompt: `Bạn là React developer có kinh nghiệm về accessibility và performance.

YÊU CẦU COMPONENT: {{mô tả}}

RÀNG BUỘC KỸ THUẬT:
- Function component + hooks (không dùng class).
- Không dùng thư viện ngoài (không Material UI, không Tailwind).
- Hỗ trợ light/dark theme qua CSS variables.
- Responsive (mobile-first).
- Truy cập được bằng bàn phím (tab, enter, escape).
- Có ARIA labels đầy đủ.

YÊU CẦU ĐẦU RA:

1. COMPONENT CODE
   - Đầy đủ, có thể copy-paste chạy được.
   - Chú thích các phần quan trọng.
   - Tách logic phức tạp thành custom hook nếu cần.

2. CSS
   - Dùng CSS variables cho theme.
   - Không dùng !important.
   - Có transition mượt.

3. VÍ DỤ SỬ DỤNG
   - Code demo component trong App.
   - Giải thích props.

4. TEST CASE GỢI Ý
   - 5 test case với React Testing Library.
   - Bao gồm: render, click, keyboard, edge case.

5. GHI CHÚ VỀ ACCESSIBILITY
   - Các điểm đã xử lý.
   - Các điểm cần lưu ý khi tích hợp.

ĐỊNH DẠNG:
- Code block có syntax highlighting (jsx, css, js).
- Giải thích bằng tiếng Việt.`,
    long: true,
  },
  {
    id: 'code-css',
    cat: 'code',
    title: 'Dọn và tối ưu CSS',
    desc: 'Tìm selector xung đột, giá trị lặp thành biến, phần không dùng. Có diff chi tiết.',
    tags: ['CSS', 'chi tiết'],
    prompt: `Bạn là CSS architect chuyên refactor codebase lớn.

CSS CẦN RÀ SOÁT:
\`\`\`css
{{css}}
\`\`\`

YÊU CẦU:

1. PHÂN TÍCH HIỆN TRẠNG
   - Tổng số selector, số dòng.
   - Các vấn đề chính: specificity war, duplicate, unused, magic numbers…

2. SELECTOR BỊ TRÙNG / XUNG ĐỘT
   - Liệt kê từng cặp selector xung đột.
   - Giải thích vì sao xung đột.
   - Đề xuất cách gộp hoặc tách.

3. GIÁ TRỊ LẶP → BIẾN
   - Liệt kê màu, spacing, font-size lặp lại.
   - Đề xuất tên biến CSS.
   - Ví dụ: --color-primary, --space-md.

4. PHẦN CÓ VẺ KHÔNG DÙNG
   - Liệt kê selector có thể không dùng.
   - Cách kiểm tra trước khi xóa (grep, DevTools).

5. BẢN CSS GỌN HƠN
   - Viết lại CSS đã tối ưu.
   - Giữ nguyên giao diện hiển thị.
   - So sánh trước/sau (số dòng, số selector).

6. GHI CHÚ TỪNG THAY ĐỔI
   - Bảng: Thay đổi | Lý do | Rủi ro.

ĐỊNH DẠNG:
- Diff rõ ràng.
- Code block có syntax highlighting.`,
    long: true,
  },

  // ================= MARKETING =================
  {
    id: 'mkt-review-tot',
    cat: 'mkt',
    title: 'Trả lời đánh giá tốt trên Google Maps',
    desc: 'Ba phản hồi thân thiện, nhắc đúng chi tiết khách khen. Có phân tích tâm lý khách.',
    tags: ['Google Maps', 'review', 'chi tiết'],
    prompt: `Bạn là chủ quán {{tên quán}} ({{loại hình}}), đang trả lời đánh giá Google Maps.

ĐÁNH GIÁ CỦA KHÁCH:
{{nội dung đánh giá}}

SỐ SAO: {{số sao}}/5

YÊU CẦU:

1. PHÂN TÍCH ĐÁNH GIÁ
   - Khách khen điểm gì cụ thể?
   - Khách có nhắc tên nhân viên/món ăn không?
   - Giọng điệu khách: vui vẻ, khách quan, hay nhiệt tình?

2. VIẾT 3 PHƯƠNG ÁN PHẢN HỒI
   Mỗi phương án có phong cách khác nhau:
   
   Phương án 1 — Thân thiện, gần gũi
   - Giọng như nói chuyện với bạn bè.
   - Nhắc đúng chi tiết khách khen.
   
   Phương án 2 — Chuyên nghiệp, lịch sự
   - Giọng trang trọng hơn.
   - Vẫn ấm áp, không cứng nhắc.
   
   Phương án 3 — Ngắn gọn, súc tích
   - Dưới 30 từ.
   - Vẫn đủ ý cảm ơn và mời quay lại.

3. YÊU CẦU CHUNG
   - Nhắc đúng chi tiết khách đã khen (không chung chung).
   - Mời khách quay lại (không rập khuôn).
   - Không quá 50 từ mỗi bản.
   - Không dùng emoji quá nhiều (tối đa 1).

4. GỢI Ý MỞ RỘNG
   - Có nên tặng voucher nhỏ cho khách quay lại không?
   - Cách biến khách tốt thành khách trung thành.

ĐỊNH DẠNG:
- Đánh số phương án rõ ràng.
- Mỗi phương án trong block riêng.`,
    long: true,
  },
  {
    id: 'mkt-review-xau',
    cat: 'mkt',
    title: 'Trả lời đánh giá tiêu cực',
    desc: 'Xin lỗi cụ thể, không đổ lỗi, nêu hướng xử lý, mời liên hệ riêng. Có phân tích rủi ro.',
    tags: ['Google Maps', 'khủng hoảng', 'chi tiết'],
    prompt: `Bạn là chủ quán {{tên quán}}, đang xử lý đánh giá tiêu cực trên Google Maps.

ĐÁNH GIÁ CỦA KHÁCH:
{{nội dung đánh giá}}

SỐ SAO: {{số sao}}/5
KÊNH LIÊN HỆ RIÊNG: {{kênh liên hệ}}

YÊU CẦU:

1. PHÂN TÍCH VẤN ĐỀ
   - Khách phàn nàn về điều gì cụ thể?
   - Đây là vấn đề: dịch vụ, chất lượng, thái độ, hay hiểu nhầm?
   - Mức độ nghiêm trọng: nhẹ / trung bình / nghiêm trọng?

2. PHẢN HỒI CÔNG KHAI
   Cấu trúc bắt buộc:
   - Cảm ơn khách đã phản hồi.
   - Xin lỗi đúng vấn đề khách nêu (KHÔNG đổ lỗi, KHÔNG giải thích dài dòng).
   - Nói rõ hướng xử lý (đã làm gì / sẽ làm gì).
   - Mời liên hệ qua {{kênh liên hệ}} để giải quyết riêng.
   - Dưới 80 từ.

3. NGUYÊN TẮC
   - Bình tĩnh, không phòng thủ.
   - Không tranh cãi công khai.
   - Không hứa những gì không làm được.
   - Không dùng từ ngữ tiêu cực.

4. PHƯƠNG ÁN DỰ PHÒNG
   - Nếu khách tiếp tục phàn nàn sau phản hồi, xử lý thế nào?
   - Khi nào nên mời khách đến trực tiếp?

5. BÀI HỌC NỘI BỘ
   - 3 hành động cần làm ngay để tránh lặp lại.
   - Cách đào tạo nhân viên.

6. RỦI RO CẦN LƯU Ý
   - Đánh giá này có thể ảnh hưởng xếp hạng Google Maps không?
   - Có nên báo cáo đánh giá (nếu là spam) không?

ĐỊNH DẠNG:
- Phản hồi công khai trong block riêng để dễ copy.
- Các phần khác là ghi chú nội bộ.`,
    long: true,
  },
  {
    id: 'mkt-gbp',
    cat: 'mkt',
    title: 'Mô tả Google Business Profile',
    desc: 'Tối đa 750 ký tự, chèn từ khóa tự nhiên, không khoa trương. Có kiểm tra SEO.',
    tags: ['Google Maps', 'SEO local', 'chi tiết'],
    prompt: `Viết phần mô tả cho Google Business Profile (GBP) của doanh nghiệp.

THÔNG TIN:
- Tên: {{tên}}
- Loại hình: {{loại hình}}
- Khu vực: {{khu vực}}
- Điểm mạnh: {{điểm mạnh}}
- Từ khóa chính: {{từ khóa}}

YÊU CẦU:

1. MÔ TẢ CHÍNH (tối đa 750 ký tự)
   - Mở đầu: giới thiệu ngắn về doanh nghiệp.
   - Giữa: điểm mạnh, dịch vụ chính.
   - Cuối: lời mời ghé thăm.
   - Chèn từ khóa tự nhiên (không nhồi nhét).

2. NGUYÊN TẮC VIẾT
   - Không viết hoa toàn bộ.
   - Không khoa trương ("tốt nhất", "số 1").
   - Không đưa SĐT, đường link, email vào mô tả.
   - Không dùng emoji quá nhiều (tối đa 2).
   - Viết cho người đọc, không chỉ cho SEO.

3. PHÂN TÍCH SEO
   - Đếm số lần xuất hiện từ khóa chính.
   - Có tự nhiên không? (tỷ lệ 1-2% là tốt)
   - Có từ khóa nào bị bỏ sót không?

4. PHƯƠNG ÁN DỰ PHÒNG
   - Viết thêm 1 phiên bản 500 ký tự (ngắn hơn).
   - Viết thêm 1 phiên bản tập trung vào 1 dịch vụ cụ thể.

5. GỢI Ý MỞ RỘNG
   - Nên thêm mô tả cho từng dịch vụ (GBP có mục "Dịch vụ") không?
   - Cách dùng bài đăng (Post) trên GBP để tăng tương tác.

ĐỊNH DẠNG:
- Mô tả chính trong block riêng để dễ copy.
- Có đếm ký tự.`,
    long: true,
  },
  {
    id: 'mkt-caption',
    cat: 'mkt',
    title: '5 caption Facebook cho quán',
    desc: 'Năm góc khác nhau: câu chuyện, ưu đãi, hậu trường, khách hàng, câu hỏi. Có CTA và hashtag.',
    tags: ['Facebook', 'caption', 'chi tiết'],
    prompt: `Viết 5 caption Facebook cho {{tên quán}} giới thiệu {{món hoặc dịch vụ}}.

THÔNG TIN:
- Đối tượng khách: {{đối tượng khách}}
- Điểm đặc biệt: {{điểm đặc biệt}}
- Khuyến mãi (nếu có): {{khuyến mãi}}

5 GÓC TIẾP CẬN (mỗi caption 1 góc):

1. CÂU CHUYỆN (Storytelling)
   - Kể câu chuyện ngắn về món/dịch vụ.
   - Có cảm xúc, có nhân vật.
   - Kết bằng câu hỏi mở.

2. ƯU ĐÃI (Promotion)
   - Nêu rõ khuyến mãi.
   - Tạo cảm giác khan hiếm (số lượng, thời gian).
   - CTA rõ ràng.

3. HẬU TRƯỜNG (Behind the scenes)
   - Khoe quy trình làm, nguyên liệu, nhân viên.
   - Tạo cảm giác tin cậy.
   - Giọng thân mật.

4. KHÁCH HÀNG (Testimonial)
   - Trích đánh giá thật của khách.
   - Kể lại câu chuyện khách đến quán.
   - Có sự đồng cảm.

5. CÂU HỎI TƯƠNG TÁC (Engagement)
   - Đặt câu hỏi cho khách.
   - Có thể là mini-game, vote, hoặc hỏi ý kiến.
   - Khuyến khích comment.

YÊU CẦU CHUNG:
- Mỗi caption tối đa 80 từ.
- Có lời kêu gọi hành động rõ ràng.
- 2-3 hashtag liên quan (không quá nhiều).
- Giọng văn: {{giọng văn}}.

GHI CHÚ THÊM:
- Gợi ý thời điểm đăng từng caption.
- Gợi ý loại ảnh/video đi kèm.

ĐỊNH DẠNG:
- Mỗi caption trong block riêng, có tiêu đề góc tiếp cận.
- Hashtag ở cuối mỗi caption.`,
    long: true,
  },
  {
    id: 'mkt-tiktok',
    cat: 'mkt',
    title: 'Kịch bản TikTok 30 giây',
    desc: 'Hook 3 giây, vấn đề, giải pháp, bằng chứng, lời kêu gọi. Có gợi ý nhạc và hashtag.',
    tags: ['TikTok', 'kịch bản', 'chi tiết'],
    prompt: `Viết kịch bản TikTok 30 giây cho {{sản phẩm hoặc dịch vụ}}.

THÔNG TIN:
- Đối tượng: {{đối tượng}}
- Vấn đề đối tượng gặp: {{vấn đề}}
- Giải pháp bạn cung cấp: {{giải pháp}}
- Bằng chứng (số liệu, review): {{bằng chứng}}

CẤU TRÚC 5 PHẦN:

1. HOOK (0-3 giây)
   - Câu nói gây tò mò hoặc gây sốc nhẹ.
   - Hình ảnh bắt mắt.
   - Ghi rõ: lời thoại + hình ảnh + chữ trên màn hình.

2. VẤN ĐỀ (3-8 giây)
   - Nêu vấn đề đối tượng gặp.
   - Đồng cảm với khó khăn của họ.
   - Ghi rõ: lời thoại + hình ảnh + chữ trên màn hình.

3. GIẢI PHÁP (8-18 giây)
   - Giới thiệu sản phẩm/dịch vụ.
   - Nêu 2-3 lợi ích chính.
   - Ghi rõ: lời thoại + hình ảnh + chữ trên màn hình.

4. BẰNG CHỨNG (18-25 giây)
   - Đưa số liệu, review, before/after.
   - Tạo niềm tin.
   - Ghi rõ: lời thoại + hình ảnh + chữ trên màn hình.

5. CTA (25-30 giây)
   - Lời kêu gọi hành động rõ ràng.
   - Ví dụ: "Bấm link ở bio", "Comment 'QUAN TÂM'".
   - Ghi rõ: lời thoại + hình ảnh + chữ trên màn hình.

GHI CHÚ THÊM:
- Nhạc nền gợi ý: thể loại, nhịp độ, có đang trending không.
- 5-7 hashtag phù hợp (kết hợp trending + niche).
- Giọng điệu: {{giọng điệu}}.
- 3 lỗi cần tránh khi làm TikTok 30 giây.

ĐỊNH DẠNG:
- Trình bày dạng bảng: Thời gian | Lời thoại | Hình ảnh | Chữ trên màn hình.
- Ghi chú ở cuối.`,
    long: true,
  },
  {
    id: 'mkt-lich-30',
    cat: 'mkt',
    title: 'Lịch nội dung 30 ngày',
    desc: 'Bốn trụ cột nội dung, định dạng và chủ đề từng ngày dạng bảng. Có KPI.',
    tags: ['kế hoạch', 'content', 'chi tiết'],
    prompt: `Lập lịch nội dung 30 ngày cho ngành {{ngành}} trên nền tảng {{nền tảng}}.

THÔNG TIN:
- Mục tiêu: {{mục tiêu}}
- Đối tượng: {{đối tượng}}
- Ngân sách: {{ngân sách}}
- Tần suất đăng: {{tần suất}}

YÊU CẦU:

1. XÁC ĐỊNH 4 TRỤ CỘT NỘI DUNG
   Với mỗi trụ cột, ghi rõ:
   - Tên trụ cột.
   - Mục đích (giáo dục, giải trí, bán hàng, xây dựng cộng đồng).
   - Tỷ lệ % trong tổng 30 ngày.
   - Định dạng chính (ảnh, video ngắn, bài dài, story…).

2. LỊCH 30 NGÀY
   Trình bày dạng bảng theo 4 tuần, mỗi tuần 7-8 dòng:
   
   | Ngày | Trụ cột | Chủ đề cụ thể | Định dạng | Mục tiêu | CTA |
   
   Yêu cầu:
   - Chủ đề cụ thể, không chung chung.
   - Xen kẽ các trụ cột, không dồn 1 loại.
   - Có 1-2 bài viral tiềm năng mỗi tuần.

3. KPI THEO DÕI
   - Chỉ số chính: reach, engagement, follower mới, click.
   - Mục tiêu cụ thể cho 30 ngày.
   - Cách đo lường.

4. NỘI DUNG TÁI SỬ DỤNG
   - 5 bài có thể tái sử dụng ở nền tảng khác.
   - Cách biến 1 video thành 3-5 bài đăng.

5. GHI CHÚ THỰC HIỆN
   - Ngày nào cần chuẩn bị trước?
   - Công cụ gợi ý (Canva, CapCut, ChatGPT…).
   - Cách đối phó khi hết ý tưởng.

ĐỊNH DẠNG:
- Bảng rõ ràng, dễ đọc.
- Chia theo tuần để không quá dài.`,
    long: true,
  },

  // ================= DỊCH & NGOẠI NGỮ =================
  {
    id: 'dich-nhat',
    cat: 'dich',
    title: 'Dịch tiếng Nhật lịch sự cho khách',
    desc: 'Kính ngữ phù hợp, có furigana và bản dịch ngược để tự kiểm tra. Có ghi chú văn hóa.',
    tags: ['tiếng Nhật', 'khách hàng', 'chi tiết'],
    prompt: `Bạn là phiên dịch viên tiếng Nhật chuyên nghiệp, đang dịch tin nhắn cho khách hàng Nhật.

TIN NHẮN CẦN DỊCH:
{{tin nhắn}}

NGỮ CẢNH:
- Người gửi: {{người gửi}}
- Người nhận: {{người nhận}}
- Mối quan hệ: {{mối quan hệ}}

YÊU CẦU:

1. BẢN DỊCH TIẾNG NHẬT
   - Dùng kính ngữ phù hợp (keigo) khi nói với khách hàng.
   - Phân biệt: sonkeigo (tôn kính ngữ), kenjougo (khiêm nhường ngữ), teineigo (lịch sự thông thường).
   - Ghi rõ mức độ lịch sự đang dùng.

2. FURIGANA
   - Với kanji khó (N2 trở lên), ghi furigana trong ngoặc.
   - Định dạng: 漢字(かんじ)

3. BẢN DỊCH NGƯỢC SANG TIẾNG VIỆT
   - Dịch lại bản tiếng Nhật sang tiếng Việt.
   - Để người gửi kiểm tra xem ý có bị lệch không.

4. GHI CHÚ VĂN HÓA
   - 2-3 điểm văn hóa cần lưu ý khi giao tiếp với người Nhật.
   - Ví dụ: cách xin lỗi, cách cảm ơn, cách từ chối.

5. PHƯƠNG ÁN THAY THẾ
   - Nếu bản dịch có thể hiểu theo nhiều cách, đưa 1-2 phương án khác.
   - Giải thích khác biệt về sắc thái.

ĐỊNH DẠNG:
- Bản dịch chính trong block riêng.
- Furigana rõ ràng.
- Ghi chú văn hóa dạng bullet.`,
    long: true,
  },
  {
    id: 'dich-sac-thai',
    cat: 'dich',
    title: 'Dịch và giải thích sắc thái',
    desc: 'Chỉ ra 3 chỗ có nhiều cách dịch và khác biệt giữa chúng. Có phân tích ngữ cảnh.',
    tags: ['dịch thuật', 'chi tiết'],
    prompt: `Bạn là dịch giả chuyên nghiệp, đang dịch văn bản từ {{ngôn ngữ nguồn}} sang {{ngôn ngữ đích}}.

VĂN BẢN GỐC:
{{đoạn văn}}

NGỮ CẢNH:
- Loại văn bản: {{loại văn bản}}
- Đối tượng độc giả: {{đối tượng}}
- Mục đích: {{mục đích}}

YÊU CẦU:

1. BẢN DỊCH CHÍNH
   - Dịch sát nghĩa, giữ giọng điệu gốc.
   - Đánh dấu những chỗ đã chọn cách dịch này thay vì cách khác.

2. 3 CHỖ CÓ NHIỀU CÁCH DỊCH
   Với mỗi chỗ, ghi rõ:
   - Câu gốc.
   - Cách dịch 1 + sắc thái.
   - Cách dịch 2 + sắc thái.
   - Cách dịch 3 (nếu có) + sắc thái.
   - Khuyến nghị chọn cách nào, vì sao.

3. PHÂN TÍCH NGỮ CẢNH
   - Văn bản này thuộc thể loại gì?
   - Có yếu tố văn hóa nào cần chú ý không?
   - Có từ chơi chữ, thành ngữ, tục ngữ không?

4. GHI CHÚ DỊCH THUẬT
   - Khó khăn chính khi dịch văn bản này.
   - Những chỗ dịch giả dễ mắc lỗi.
   - Cách xử lý khi không có từ tương đương.

5. BẢN DỊCH THAY THẾ (nếu có)
   - Nếu văn bản có thể dịch theo phong cách khác (trang trọng hơn, thân mật hơn), đưa 1 phiên bản.

ĐỊNH DẠNG:
- Bản dịch chính trong block riêng.
- Phân tích sắc thái dạng bảng hoặc bullet.`,
    long: true,
  },
  {
    id: 'dich-hoi-thoai',
    cat: 'dich',
    title: 'Luyện hội thoại có sửa lỗi',
    desc: 'AI đóng vai, nói ngắn và sửa lỗi sau mỗi lượt. Có gợi ý chủ đề.',
    tags: ['luyện nói', 'chi tiết'],
    prompt: `Bạn là giáo viên dạy {{ngôn ngữ}} cho học sinh trình độ {{trình độ}}. Hãy đóng vai để luyện hội thoại.

VAI BẠN ĐÓNG: {{vai}}
CHỦ ĐỀ: {{chủ đề}}
MỤC TIÊU BUỔI HỌC: {{mục tiêu}}

QUY TẮC HỘI THOẠI:

1. MỖI LƯỢT BẠN CHỈ NÓI 1-2 CÂU
   - Ngắn gọn, tự nhiên.
   - Phù hợp với trình độ học sinh.
   - Có thể hỏi lại để học sinh nói tiếp.

2. SAU MỖI LƯỢT CỦA HỌC SINH
   - Sửa lỗi theo dạng:
     ❌ Câu sai của bạn: [...]
     ✅ Câu đúng: [...]
     💡 Lý do: [...]
   - Chỉ sửa lỗi quan trọng, không sửa mọi lỗi nhỏ.
   - Khen ngợi điểm tốt (nếu có).

3. DUY TRÌ HỘI THOẠI
   - Sau khi sửa, tiếp tục hội thoại.
   - Đặt câu hỏi mở để học sinh nói nhiều hơn.
   - Không giảng lý thuyết dài dòng.

4. GHI CHÚ TỪ VỰNG MỚI
   - Khi dùng từ mới, ghi chú ngắn: từ — nghĩa — cách dùng.
   - Không quá 3 từ mới mỗi lượt.

5. KẾT THÚC
   - Khi học sinh muốn dừng, tóm tắt:
     • 3 điểm mạnh của học sinh.
     • 3 điểm cần cải thiện.
     • 3 từ/cấu trúc mới đã học.
     • Bài tập về nhà (nếu cần).

BẮT ĐẦU:
- Chào hỏi ngắn.
- Đặt câu hỏi đầu tiên để mở đầu hội thoại.`,
    long: true,
  },
  {
    id: 'dich-tu-vung',
    cat: 'dich',
    title: 'Từ vựng theo chủ đề',
    desc: 'Bảng từ, phiên âm, nghĩa và câu ví dụ ngắn. Có phân loại độ khó.',
    tags: ['từ vựng', 'chi tiết'],
    prompt: `Bạn là giáo viên dạy từ vựng {{ngôn ngữ}} cho học sinh trình độ {{trình độ}}.

CHỦ ĐỀ: "{{chủ đề}}"
SỐ LƯỢNG: 20 từ

YÊU CẦU:

1. BẢNG TỪ VỰNG
   Trình bày dạng bảng với các cột:
   | STT | Từ | Phiên âm | Loại từ | Nghĩa tiếng Việt | Ví dụ | Dịch ví dụ |
   
   Yêu cầu:
   - Từ phù hợp trình độ {{trình độ}}.
   - Có cả từ cơ bản và từ nâng cao.
   - Ví dụ ngắn (dưới 10 từ), tự nhiên.

2. PHÂN LOẠI ĐỘ KHÓ
   - Đánh dấu ★ cho từ cơ bản.
   - Đánh dấu ★★ cho từ trung bình.
   - Đánh dấu ★★★ cho từ nâng cao.

3. NHÓM TỪ THEO CHỦ ĐỀ CON
   - Chia 20 từ thành 3-4 nhóm nhỏ.
   - Ví dụ chủ đề "du lịch": phương tiện, khách sạn, ăn uống, tham quan.

4. CỤM TỪ THƯỜNG ĐI KÈM
   - Với 5 từ quan trọng nhất, liệt kê 2-3 collocation (cụm từ thường dùng).
   - Ví dụ: "make a decision", "take a photo".

5. BÀI TẬP TỰ KIỂM TRA
   - 5 câu điền từ vào chỗ trống (chưa đáp án).
   - 3 câu viết lại câu dùng từ mới.

6. MẸO GHI NHỚ
   - 3-5 mẹo nhớ từ (liên tưởng, hình ảnh, âm thanh).

ĐỊNH DẠNG:
- Bảng rõ ràng, dễ đọc.
- Phiên âm IPA (nếu là tiếng Anh) hoặc romaji (nếu tiếng Nhật).`,
    long: true,
  },
];