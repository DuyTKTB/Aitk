# -*- coding: utf-8 -*-
"""PHẦN II mục 4: module 4.1 – 4.3."""

BLOCKS = []
BLOCKS += [
    ('h2', '4. XÂY DỰNG CÁC MODULE CHỨC NĂNG'),
    ('p', 'Mục này trình bày mười một module theo cùng một cấu trúc: mục tiêu, công nghệ sử dụng, các bước thực hiện, một hoặc hai đoạn mã chính kèm giải thích, hình ảnh minh họa và kết quả kiểm thử riêng. Cách trình bày thống nhất này giúp người đọc so sánh được độ phức tạp giữa các module và thấy rõ module nào đã được kiểm chứng đến đâu.'),
    ('p', 'Các đoạn mã được trích nguyên văn từ mã nguồn, chỉ lược bỏ những dòng không liên quan và thay mọi giá trị cấu hình bí mật bằng giá trị mẫu. Những chỗ lược bỏ được ghi rõ trong phần chú thích của đoạn mã.'),
    ('table', 'modules', 'Bảng tổng hợp mười một module và mức độ hoàn thiện',
     ['Mục', 'Module', 'Chức năng chính', 'Kiểm thử tự động', 'Mức độ'],
     [
        ['4.1', 'Trợ lý AI Hóa học', 'Hỏi đáp, đọc ảnh, sáu chế độ, kiểm chứng số liệu', '58 ca', 'Hoàn thiện'],
        ['4.2', 'Bảng tuần hoàn và trợ lý nguyên tử', '118 nguyên tố, lọc, so sánh, hỏi AI', 'Không có', 'Hoàn thiện'],
        ['4.3', 'Bộ công cụ tính toán Hóa học', 'Cân bằng, khối lượng mol, nồng độ, pH', '14 ca', 'Hoàn thiện'],
        ['4.4', 'Quiz, lịch ôn và sổ câu sai', 'Luyện tập, ôn theo lịch, thống kê', 'Không có', 'Hoàn thiện'],
        ['4.5', 'Phòng thí nghiệm ảo', 'Mô phỏng phản ứng 2D và 3D', 'Không có', 'Hoàn thiện một phần'],
        ['4.6', 'Trò chơi giáo dục', '14 trò chơi và 9 trò chơi camera', 'Không có', 'Hoàn thiện'],
        ['4.7', 'Tạo đề và ma trận', 'Đọc tệp, tách câu, ma trận bốn mức, soát đáp án', '20 ca', 'Hoàn thiện'],
        ['4.8', 'Lớp học, phòng thi, giám sát', 'Giao đề, làm bài, camera AI, biên bản', 'Không có', 'Hoàn thiện một phần'],
        ['4.9', 'Chấm phiếu trắc nghiệm A4', 'Nhận dạng phiếu bằng ảnh chụp', 'Không có', 'Thử nghiệm'],
        ['4.10', 'Tài khoản, gói và điểm', 'Phân quyền, gói VIP, điểm, thanh toán', 'Không có', 'Hoàn thiện một phần'],
        ['4.11', 'Module phụ trợ', 'Thống kê, ghi chú, lịch, đồng hồ, thú cưng', 'Không có', 'Hoàn thiện'],
     ], [1.4, 4.4, 6.4, 2.4, 3.0]),

    # ---------------------------------------------------------------- 4.1
    ('h3', '4.1. Module trợ lý AI Hóa học'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cho học sinh một trợ lý trả lời đúng theo khối lớp, đọc được đề bài từ ảnh, trình bày lời giải theo từng bước và không mắc lỗi số học. Module này cũng là nơi đặt toàn bộ cơ chế chống lỗi của hệ thống, nên được xây dựng trước các module khác và được kiểm thử kĩ nhất.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'React 18 cho giao diện; JavaScript thuần cho lõi; ba nhà cung cấp mô hình ngôn ngữ truy cập qua API; Tesseract.js cho nhận dạng kí tự dự phòng; Firebase và Supabase cho lịch sử hội thoại; Vitest cho kiểm thử.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Tách lõi khỏi giao diện: tạo các tệp riêng cho bộ định tuyến tác vụ, bộ ghép câu lệnh, lớp công cụ, chỉ mục tri thức, bộ nhớ và nhận dạng kí tự. Mỗi tệp chỉ làm một việc và không nhập React.'),
    ('numbered', 'Viết bộ định tuyến tác vụ: chấm điểm độ khó dựa trên số lượng số liệu, số câu hỏi con, độ dài câu hỏi và các từ khóa đặc trưng của bài toán nhiều bước; từ điểm đó quyết định dùng tầng mô hình nhanh hay mạnh.'),
    ('numbered', 'Viết lớp công cụ tính toán: phân tích công thức, trích số liệu kèm đơn vị, chạy các công cụ và trả về kết quả dạng văn bản để chèn vào câu lệnh.'),
    ('numbered', 'Viết chỉ mục tri thức: duyệt dữ liệu Hóa học, tách từ, bỏ dấu tiếng Việt, chấm điểm theo tần suất và độ hiếm của từ, trả về đoạn phù hợp kèm tên nguồn.'),
    ('numbered', 'Viết bộ ghép câu lệnh theo lớp: danh tính, phạm vi, khối lớp, chế độ học, ngữ cảnh, kết quả công cụ, an toàn, định dạng.'),
    ('numbered', 'Viết vòng gọi có dự phòng: danh sách nhà cung cấp theo tác vụ, xoay khóa khi bị giới hạn, tạm nghỉ mô hình lỗi, đọc phản hồi theo kiểu truyền dần và tách phần suy luận khỏi phần trả lời.'),
    ('numbered', 'Viết bước tự kiểm tra: so các con số trong câu trả lời với kết quả công cụ; nếu không khớp thì gắn cảnh báo; với tài khoản trả phí thì gọi thêm một mô hình khác thẩm định.'),
    ('numbered', 'Viết chín tệp kiểm thử cho toàn bộ phần lõi, trong đó có tệp giả lập phản hồi của nhà cung cấp để kiểm tra nhánh hết hạn mức và nhánh nhận dạng kí tự dự phòng.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('p', 'Đoạn mã dưới đây là phần chấm điểm độ khó và quyết định loại tác vụ trong tệp src/lib/aiRouter.js. Đây là chỗ quyết định toàn bộ cách hệ thống sẽ trả lời một câu hỏi.'),
    ('code', 'src/lib/aiRouter.js — chấm điểm độ khó và phân loại tác vụ (lược một số dòng khai báo)',
     """  let hardScore = 0;
  if (HARD_CUES.test(v)) hardScore += 1;
  if (nums >= 3) hardScore += 1;
  if (nums >= 6) hardScore += 1;
  if (multiQuestion) hardScore += 1;
  if (long) hardScore += 1;
  if (/lớp 12|đại học|chuyên đề|vận dụng cao|học sinh giỏi/i.test(v)) hardScore += 1;

  let kind = 'chat';
  if (isCompare) kind = 'compare';
  else if (isQuizGen) kind = 'generate';
  else if (isProblem) kind = 'problem';
  else if (isTheory) kind = 'theory';

  const hard = kind === 'problem' && hardScore >= 2;

  const temperature = kind === 'problem' ? 0.1 : kind === 'compare' ? 0.5 : kind === 'generate' ? 0.4 : kind === 'theory' ? 0.2 : 0.3;"""),
    ('p', 'Cách viết này có ba điểm đáng chú ý. Thứ nhất, việc phân loại dựa trên đặc điểm đo được của câu hỏi (số lượng số liệu, số dấu hỏi, độ dài) chứ không chỉ dựa vào từ khóa, nên câu hỏi không có từ “Hóa” vẫn được nhận đúng là bài toán nếu có nhiều số liệu. Thứ hai, nhiệt độ được đặt thấp (0,1) cho bài toán để mô hình ít sáng tạo trong phép tính, và cao hơn cho câu hỏi so sánh. Thứ ba, mức độ khó chỉ được bật khi câu hỏi đã là bài toán, nhờ vậy một câu hỏi lý thuyết dài không bị đẩy sang chế độ suy luận sâu và làm chậm phản hồi.'),
    ('p', 'Đoạn mã thứ hai là phần quản lý nhiều khóa API trong cùng tệp. Mỗi nhà cung cấp có thể được cấu hình nhiều khóa; khi một khóa bị giới hạn, hệ thống đưa khóa đó vào thời gian tạm nghỉ và dùng khóa kế tiếp.'),
    ('code', 'src/lib/aiRouter.js — vòng khóa dự phòng cho một nhà cung cấp',
     """export function createKeyRing(raw, { cooldownMs = 10 * 60 * 1000 } = {}) {
  const keys = parseKeys(raw);
  const bad = new Map();          // key → { until, fails }
  let cursor = 0;

  const usable = () => keys.filter((k) => {
    const b = bad.get(k);
    return !b || Date.now() > b.until;
  });

  return {
    size: keys.length,
    get() {
      const list = usable();
      if (!list.length) return null;              // tất cả đang cooldown
      const key = list[cursor % list.length];
      cursor = (cursor + 1) % Math.max(1, list.length);
      return key;
    },
    reportBad(key, ms = cooldownMs) { /* đưa khóa vào cooldown */ },
    reportGood(key) { if (key) bad.delete(key); },
    hasUsable() { return usable().length > 0; },
  };
}"""),
    ('p', 'Cơ chế này giải quyết một vấn đề rất thực tế: hạn mức miễn phí của các nhà cung cấp mô hình thường tính theo khóa và theo phút. Nếu chỉ dùng một khóa, một lớp học đang ôn thi có thể làm hệ thống dừng giữa giờ. Với vòng khóa, khi khóa thứ nhất bị giới hạn, câu hỏi tiếp theo tự động đi qua khóa thứ hai mà người học không thấy gián đoạn. Trong 26 ngày làm dự án, cơ chế này đã hai lần cứu buổi thử nghiệm.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'aichat', 'Màn hình trợ lý AI: vùng hội thoại, chọn khối lớp và chế độ trả lời',
     'Chụp toàn màn hình trợ lý AI ở chế độ máy tính: danh sách cuộc trò chuyện bên trái, vùng hội thoại bên phải, hai ô chọn khối lớp và chế độ ở phía trên.'),
    ('figure', 'aisteps', 'Lời giải từng bước kèm nhãn kết quả do công cụ tính',
     'Chụp một câu hỏi cân bằng phương trình: phần suy luận, phần lời giải có bảng kiểm tra số nguyên tử hai vế, và nhãn cho biết kết quả đã được công cụ nội bộ tính.'),
    ('figure', 'aiimage', 'Trợ lý AI đọc đề bài từ ảnh chụp',
     'Chụp màn hình có ảnh đề bài được đính kèm và câu trả lời tương ứng, thấy rõ phần trích lại nội dung đề mà hệ thống đọc được.'),
    ('figure', 'modes', 'Sáu chế độ trả lời của trợ lý AI',
     'Chụp danh sách chọn chế độ đang mở, gồm sáu mục: tự động, giải chi tiết, gợi ý từng bước, kiểm tra đáp án, ôn lý thuyết, tạo bài tương tự.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Phần lõi của module có năm tệp kiểm thử, tổng cộng 58 ca: phân loại tác vụ và vòng khóa (22 ca), ghép câu lệnh (14 ca), công cụ tính toán (15 ca), bộ nhớ (9 ca), nhận dạng kí tự dự phòng (3 ca), cộng thêm tệp kiểm thử luồng gọi đầy đủ (9 ca). Các ca kiểm thử không gọi mạng thật mà giả lập phản hồi, nên chạy được trong môi trường không có Internet.'),
    ('p', 'Khi chạy lại toàn bộ bộ kiểm thử ngày 24 tháng 10 năm 2026, 117/118 ca đạt. Ca không đạt nằm ở tệp kiểm thử ghép câu lệnh: tệp này còn kì vọng 7 chế độ học trong khi mã hiện có 6 chế độ. Đây là lỗi của ca kiểm thử (viết từ phiên bản trước), không phải lỗi của chương trình; nhóm ghi nhận và sẽ sửa lại con số kì vọng.'),
    ('p', 'Kiểm thử thủ công gồm mười hai câu hỏi đại diện ba khối lớp, ba ảnh đề bài ở ba điều kiện ánh sáng, và bốn tình huống lỗi: mất mạng giữa lúc trả lời, hết điểm, nhà cung cấp trả lỗi hạn mức, và ảnh quá mờ. [CẦN BỔ SUNG: bảng ghi kết quả từng lần thử, thời gian phản hồi và tỉ lệ câu có đáp án cuối đúng.]'),

    # ---------------------------------------------------------------- 4.2
    ('h3', '4.2. Module bảng tuần hoàn và trợ lý khám phá nguyên tử'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Thay bảng tuần hoàn giấy bằng một bảng tra cứu dùng được ngay trong lúc làm bài: tìm theo kí hiệu, tên, số hiệu hoặc nhóm; xem cấu hình electron, số oxi hóa, bán kính, độ âm điện, năng lượng ion hóa; so sánh hai nguyên tố cạnh nhau; và hỏi trực tiếp AI về nguyên tố đang xem.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Dữ liệu 118 nguyên tố đóng gói trong một tệp văn bản có cấu trúc, được phân tích thành mảng đối tượng khi nạp; React cho giao diện; CSS lưới cho bố cục 18 cột; lớp AI dùng chung cho phần hỏi đáp.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Nhập dữ liệu gốc: kí hiệu, tên tiếng Anh, khối lượng nguyên tử, số hiệu, nhóm, chu kì, cấu hình electron, số oxi hóa thường gặp, ứng dụng và mẹo nhớ.'),
    ('numbered', 'Viết hàm chuẩn hóa tiếng Việt (bỏ dấu, đổi “đ” thành “d”) để tìm kiếm không phân biệt dấu: gõ “sat” vẫn ra “Sắt”.'),
    ('numbered', 'Dựng lưới 18 cột, đặt các nguyên tố vào đúng ô theo nhóm và chu kì, tách hai dãy lanthanide và actinide ra hàng riêng.'),
    ('numbered', 'Thêm tìm kiếm, lọc theo nhóm, tô màu theo nhóm, hiển thị xu hướng tuần hoàn bằng chú giải.'),
    ('numbered', 'Thêm chế độ so sánh: chọn hai nguyên tố, hiện bảng đối chiếu các đại lượng.'),
    ('numbered', 'Thêm cửa sổ chi tiết nguyên tố, trong đó có nút hỏi AI về riêng nguyên tố đó, dùng lại module 4.1 nhưng truyền thêm ngữ cảnh nguyên tố.'),
    ('numbered', 'Thêm phần mô phỏng cấu hình electron theo lớp và phân lớp, để học sinh thấy được sự phân bố electron thay vì chỉ đọc dãy kí hiệu.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('p', 'Đoạn mã dưới đây trích từ tệp dữ liệu, cho thấy cách dữ liệu được nhập để vừa đọc được bằng mắt vừa phân tích được bằng máy. Cách nhập này giúp nhóm rà soát nhanh khối lượng nguyên tử mà không phải sửa cú pháp đối tượng.'),
    ('code', 'src/data/elements.js — dữ liệu gốc 118 nguyên tố (trích ba dòng đầu)',
     """const RAW = `H,Hydrogen,1.008;He,Helium,4.0026;Li,Lithium,6.94;Be,Beryllium,9.0122;B,Boron,10.81;
C,Carbon,12.011;N,Nitrogen,14.007;O,Oxygen,15.999;F,Fluorine,18.998;Ne,Neon,20.180;
Na,Sodium,22.990;Mg,Magnesium,24.305;Al,Aluminium,26.982;...`;"""),
    ('p', 'Việc để dữ liệu trong một chuỗi có dấu chấm phẩy thay vì một mảng đối tượng là quyết định có chủ ý: khi rà soát, nhóm có thể so từng dòng với bảng IUPAC mà không bị lẫn dấu ngoặc hay dấu phẩy. Việc phân tích chuỗi chỉ chạy một lần khi nạp trang, chi phí không đáng kể.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'periodic', 'Bảng tuần hoàn ở chế độ lọc theo nhóm nguyên tố',
     'Chụp toàn bộ bảng tuần hoàn ở chế độ máy tính, đang bật bộ lọc theo nhóm kim loại kiềm, thấy chú giải màu và ô tìm kiếm.'),
    ('figure', 'periodicfilter', 'Tìm kiếm không dấu và chế độ so sánh hai nguyên tố',
     'Chụp hai ảnh nhỏ: ô tìm kiếm đang gõ “sat” với kết quả là Sắt; bảng so sánh Na và Mg.'),
    ('figure', 'elementmodal', 'Cửa sổ chi tiết nguyên tố và phần hỏi AI cho riêng nguyên tố đó',
     'Chụp cửa sổ chi tiết của Fe: cấu hình electron, số oxi hóa, ứng dụng, và ô hỏi AI ở cuối cửa sổ.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử thủ công trên ba trình duyệt (Chrome trên máy tính, Safari trên iPhone, Chrome trên Android). Các điểm được kiểm: tìm kiếm không dấu, tìm theo số hiệu, lọc nhóm, so sánh hai nguyên tố, mở và đóng cửa sổ chi tiết, hỏi AI trong cửa sổ chi tiết, và kiểm tra dữ liệu của mười nguyên tố đối chiếu với bảng IUPAC.'),
    ('p', 'Kết quả ghi ở bảng kiểm thử chức năng, dòng tương ứng. [CẦN BỔ SUNG: ảnh chụp và ghi chú kết quả từng lần thử.]'),

    # ---------------------------------------------------------------- 4.3
    ('h3', '4.3. Module bộ công cụ tính toán Hóa học'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cung cấp một lõi tính toán duy nhất cho cả giao diện và trợ lý AI, để cùng một công thức không bao giờ cho hai kết quả khác nhau ở hai nơi. Trước khi tách lõi, mỗi trang có một bản sao thuật toán riêng và đã từng cho kết quả lệch nhau ở công thức có ngoặc vuông.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'JavaScript thuần; thuật toán khử Gauss – Jordan trên số hữu tỉ để cân bằng phương trình mà không bị sai số làm tròn; bảng khối lượng nguyên tử 118 nguyên tố làm nguồn dự phòng.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Viết hàm phân tích công thức, hỗ trợ ngoặc tròn, ngoặc vuông và tinh thể ngậm nước (ví dụ CuSO₄·5H₂O).'),
    ('numbered', 'Viết hàm tính khối lượng mol từ kết quả phân tích, kèm bảng phân rã từng nguyên tố để học sinh đối chiếu.'),
    ('numbered', 'Viết hàm cân bằng phương trình: lập hệ phương trình theo số nguyên tử của từng nguyên tố, giải bằng số hữu tỉ, quy về hệ số nguyên nhỏ nhất.'),
    ('numbered', 'Viết hàm kiểm tra bảo toàn nguyên tố sau khi cân bằng, dùng làm chốt chặn cuối.'),
    ('numbered', 'Viết các công cụ mức cao: số mol theo khối lượng hoặc thể tích khí, nồng độ mol, pH của axit và bazơ mạnh, pha loãng, bài toán theo phương trình có xác định chất dư.'),
    ('numbered', 'Nối các công cụ vào giao diện (trang cân bằng, trang khối lượng mol, trang công thức) và vào lớp AI (module 4.1).'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('code', 'src/lib/chemBalance.js — phân tích công thức có ngoặc và tinh thể ngậm nước',
     """export function parseFormula(input) {
  const f = String(input || '').trim().replace(/\\s+/g, '');
  if (!f) throw new Error('Công thức rỗng');

  let i = 0;
  const stack = [{}];

  const readNumber = () => {
    let s = '';
    while (i < f.length && /\\d/.test(f[i])) s += f[i++];
    return s ? parseInt(s, 10) : 1;
  };
  const add = (group, sym, n) => { group[sym] = (group[sym] || 0) + n; };
  const mergeIntoParent = (child, mult) => {
    const parent = stack[stack.length - 1];
    for (const k in child) add(parent, k, child[k] * mult);
  };"""),
    ('p', 'Hàm dùng một ngăn xếp các đối tượng đếm: khi gặp dấu mở ngoặc thì đẩy một đối tượng mới vào ngăn xếp, khi gặp dấu đóng ngoặc thì gộp đối tượng trên cùng vào đối tượng dưới với hệ số nhân. Cách này xử lí được cả công thức lồng nhau như Ca₃(PO₄)₂ và công thức có hệ số đầu như 5H₂O, đồng thời không cần viết biểu thức chính quy phức tạp cho từng trường hợp.'),
    ('p', 'Phần cân bằng phương trình dùng cách khác: lập hệ phương trình tuyến tính với ẩn là hệ số của từng chất, mỗi nguyên tố cho một phương trình. Hệ được giải bằng phép khử trên số hữu tỉ, sau đó nhân lên để các hệ số thành số nguyên và chia cho ước chung lớn nhất. Dùng số hữu tỉ thay vì số thực là điểm quan trọng: nếu dùng số thực, các hệ số như 1/3 sẽ thành 0,333… và việc quy về số nguyên sẽ sai ở những phương trình phức tạp.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'balance', 'Trang cân bằng phương trình với bảng kiểm tra số nguyên tử hai vế',
     'Chụp màn hình nhập “Fe + O2 -> Fe2O3” và kết quả 4Fe + 3O₂ → 2Fe₂O₃, kèm bảng đối chiếu số nguyên tử từng nguyên tố ở hai vế.'),
    ('figure', 'molar', 'Trang tính khối lượng mol kèm bảng phân rã',
     'Chụp màn hình nhập CuSO₄·5H₂O, thấy kết quả khối lượng mol và bảng phân rã Cu, S, O, H với số nguyên tử và khối lượng từng phần.'),
    ('figure', 'ph', 'Trang tính nồng độ và pH',
     'Chụp màn hình nhập nồng độ dung dịch HCl, thấy kết quả pH và phần giải thích công thức đã dùng.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Tệp kiểm thử của lõi Hóa học có 14 ca, bao gồm: công thức đơn giản, công thức có ngoặc, tinh thể ngậm nước, công thức sai, cân bằng phương trình đơn giản, cân bằng có hệ số lớn, kiểm tra bảo toàn nguyên tố, và các trường hợp biên (hệ số 1, chất chỉ có một nguyên tố). Toàn bộ 14 ca đạt khi chạy ngày 24 tháng 10 năm 2026.'),
    ('p', 'Kiểm thử thủ công bổ sung 20 phương trình lấy từ sách giáo khoa và đề thi, trong đó có 5 phương trình có hệ số lớn hơn 10 và 3 phương trình có chất rắn. [CẦN BỔ SUNG: kết quả đối chiếu 20 phương trình này với đáp án của sách.]'),
]
