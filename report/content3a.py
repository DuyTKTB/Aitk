# -*- coding: utf-8 -*-
"""Nội dung: PHẦN II, mục 4 (module 4.1 – 4.5)."""

BLOCKS = []

BLOCKS += [
    ('h2', '4. XÂY DỰNG CÁC MODULE CHỨC NĂNG'),
    ('p', 'Mỗi module dưới đây được trình bày theo cùng một cấu trúc: mục tiêu, công nghệ sử dụng, các bước thực hiện, một đoạn mã chính kèm giải thích, hình ảnh minh họa và kết quả kiểm thử riêng. Các đoạn mã được trích nguyên văn từ mã nguồn, chỉ lược bỏ những dòng không liên quan và thay mọi giá trị cấu hình bí mật bằng giá trị mẫu.'),

    # ------------------------------------------------------------------
    ('h3', '4.1. Module trợ lý AI Hóa học'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cho học sinh một trợ lý trả lời đúng theo khối lớp, đọc được đề bài từ ảnh, trình bày lời giải theo từng bước và không mắc lỗi số học. Module này cũng là nơi đặt toàn bộ cơ chế chống lỗi của hệ thống, nên được xây dựng trước các module khác.'),
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
    ('numbered', 'Viết 9 tệp kiểm thử cho toàn bộ phần lõi, trong đó có tệp giả lập phản hồi của nhà cung cấp để kiểm tra nhánh hết hạn mức và nhánh nhận dạng kí tự dự phòng.'),
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
    ('p', 'Cách viết này có ba điểm đáng chú ý. Thứ nhất, việc phân loại dựa trên đặc điểm đo được của câu hỏi (số lượng số liệu, số dấu hỏi, độ dài) chứ không chỉ dựa vào từ khóa, nên câu hỏi không có từ "Hóa" vẫn được nhận đúng là bài toán nếu có nhiều số liệu. Thứ hai, nhiệt độ được đặt thấp (0,1) cho bài toán để mô hình ít "sáng tạo" trong phép tính, và cao hơn cho câu hỏi so sánh. Thứ ba, mức độ khó chỉ được bật khi câu hỏi đã là bài toán, nhờ vậy một câu hỏi lý thuyết dài không bị đẩy sang chế độ suy luận sâu và làm chậm phản hồi.'),
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
    ('p', 'Cơ chế này giải quyết một vấn đề rất thực tế: hạn mức miễn phí của các nhà cung cấp mô hình thường tính theo khóa và theo phút. Nếu chỉ dùng một khóa, một lớp học đang ôn thi có thể làm hệ thống dừng giữa giờ. Với vòng khóa, khi khóa thứ nhất bị giới hạn, câu hỏi tiếp theo tự động đi qua khóa thứ hai mà người học không thấy gián đoạn.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'Hình 9', 'Lời giải từng bước của trợ lý AI kèm nhãn kết quả do công cụ tính',
     'Chụp màn hình một câu hỏi cân bằng phương trình: phần suy luận, phần lời giải có bảng kiểm tra số nguyên tử hai vế, và nhãn cho biết kết quả đã được công cụ nội bộ tính.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Phần lõi của module có 5 tệp kiểm thử, tổng cộng 58 ca: phân loại tác vụ và vòng khóa (22 ca), ghép câu lệnh (14 ca), công cụ tính toán (15 ca), bộ nhớ (9 ca), nhận dạng kí tự dự phòng (3 ca), cộng thêm tệp kiểm thử luồng gọi đầy đủ (9 ca). Các ca kiểm thử không gọi mạng thật mà giả lập phản hồi, nên chạy được trong môi trường không có Internet.'),
    ('p', 'Khi chạy lại toàn bộ bộ kiểm thử ngày 24/10/2026, 117/118 ca đạt. Ca không đạt nằm ở tệp kiểm thử ghép câu lệnh: tệp này còn kì vọng 7 chế độ học trong khi mã hiện có 6 chế độ. Đây là lỗi của ca kiểm thử (viết từ phiên bản trước), không phải lỗi của chương trình; nhóm ghi nhận và sẽ sửa lại con số kì vọng.'),

    # ------------------------------------------------------------------
    ('h3', '4.2. Module bảng tuần hoàn và trợ lý khám phá nguyên tử'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Thay bảng tuần hoàn giấy bằng một bảng tra cứu dùng được ngay trong lúc làm bài: tìm theo kí hiệu, tên, số hiệu hoặc nhóm; xem cấu hình electron, số oxi hóa, bán kính, độ âm điện, năng lượng ion hóa; so sánh hai nguyên tố cạnh nhau; và hỏi trực tiếp AI về nguyên tố đang xem.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Dữ liệu 118 nguyên tố đóng gói trong một tệp văn bản có cấu trúc, được phân tích thành mảng đối tượng khi nạp; React cho giao diện; CSS lưới cho bố cục 18 cột; lớp AI dùng chung cho phần hỏi đáp.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Nhập dữ liệu gốc: kí hiệu, tên tiếng Anh, khối lượng nguyên tử, số hiệu, nhóm, chu kì, cấu hình electron, số oxi hóa thường gặp, ứng dụng và mẹo nhớ.'),
    ('numbered', 'Viết hàm chuẩn hóa tiếng Việt (bỏ dấu, đổi "đ" thành "d") để tìm kiếm không phân biệt dấu: gõ "sat" vẫn ra "Sắt".'),
    ('numbered', 'Dựng lưới 18 cột, đặt các nguyên tố vào đúng ô theo nhóm và chu kì, tách hai dãy lanthanide và actinide ra hàng riêng.'),
    ('numbered', 'Thêm tìm kiếm, lọc theo nhóm, tô màu theo nhóm, hiển thị xu hướng tuần hoàn bằng chú giải.'),
    ('numbered', 'Thêm chế độ so sánh: chọn hai nguyên tố, hiện bảng đối chiếu các đại lượng.'),
    ('numbered', 'Thêm cửa sổ chi tiết nguyên tố, trong đó có nút hỏi AI về riêng nguyên tố đó, dùng lại module 4.1 nhưng truyền thêm ngữ cảnh nguyên tố.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('p', 'Đoạn mã dưới đây trích từ tệp dữ liệu, cho thấy cách dữ liệu được nhập để vừa đọc được bằng mắt vừa phân tích được bằng máy. Cách nhập này giúp nhóm rà soát nhanh khối lượng nguyên tử mà không phải sửa cú pháp đối tượng.'),
    ('code', 'src/data/elements.js — dữ liệu gốc 118 nguyên tố (trích ba dòng đầu)',
     """const RAW = `H,Hydrogen,1.008;He,Helium,4.0026;Li,Lithium,6.94;Be,Beryllium,9.0122;B,Boron,10.81;
C,Carbon,12.011;N,Nitrogen,14.007;O,Oxygen,15.999;F,Fluorine,18.998;Ne,Neon,20.180;
Na,Sodium,22.990;Mg,Magnesium,24.305;Al,Aluminium,26.982;...`;"""),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'Hình 10', 'Cửa sổ chi tiết nguyên tố và phần hỏi AI cho riêng nguyên tố đó',
     'Chụp cửa sổ chi tiết của Fe: cấu hình electron, số oxi hóa, ứng dụng, và ô hỏi AI ở cuối cửa sổ.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử thủ công trên ba trình duyệt (Chrome trên máy tính, Safari trên iPhone, Chrome trên Android). Các điểm được kiểm: tìm kiếm không dấu, tìm theo số hiệu, lọc nhóm, so sánh hai nguyên tố, mở và đóng cửa sổ chi tiết, hỏi AI trong cửa sổ chi tiết. Kết quả ghi ở bảng 8, dòng tương ứng. [CẦN BỔ SUNG: ảnh chụp và ghi chú kết quả từng lần thử.]'),

    # ------------------------------------------------------------------
    ('h3', '4.3. Module bộ công cụ tính toán Hóa học'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cung cấp một lõi tính toán duy nhất cho cả giao diện và trợ lý AI, để cùng một công thức không bao giờ cho hai kết quả khác nhau ở hai nơi. Trước khi tách lõi, mỗi trang có một bản sao thuật toán riêng và đã từng cho kết quả lệch nhau.'),
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
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'Hình 11', 'Trang cân bằng phương trình với bảng kiểm tra số nguyên tử hai vế',
     'Chụp màn hình nhập "Fe + O2 -> Fe2O3" và kết quả 4Fe + 3O₂ → 2Fe₂O₃, kèm bảng đối chiếu số nguyên tử từng nguyên tố ở hai vế.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Tệp kiểm thử của lõi Hóa học có 14 ca, bao gồm: công thức đơn giản, công thức có ngoặc, tinh thể ngậm nước, công thức sai, cân bằng phương trình đơn giản, cân bằng có hệ số lớn, kiểm tra bảo toàn nguyên tố, và các trường hợp biên (hệ số 1, chất chỉ có một nguyên tố). Toàn bộ 14 ca đạt khi chạy ngày 24/10/2026.'),

    # ------------------------------------------------------------------
    ('h3', '4.4. Module quiz thông minh, lặp lại ngắt quãng và sổ câu sai'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Biến việc ôn tập từ chép lại đề thành một vòng học có phản hồi: mỗi câu trả lời sai được ghi lại, được lên lịch quay lại đúng lúc học sinh sắp quên, và được phân loại theo chuyên đề để biết phần nào còn yếu.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Thuật toán lặp lại ngắt quãng dựa trên hệ số dễ (easiness factor) và khoảng cách ôn tăng dần; lưu trạng thái từng câu trong máy của người học; Supabase cho sổ câu sai đồng bộ theo tài khoản.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Thiết kế bản ghi cho mỗi câu: hệ số dễ, số lần ôn, khoảng cách hiện tại, số lần quên, chuỗi đúng liên tiếp, thời điểm đến hạn.'),
    ('numbered', 'Viết hàm cập nhật sau mỗi lần trả lời, chia hai nhánh: trả lời đúng thì tăng khoảng cách, trả lời sai thì đặt lại khoảng cách về một ngày và giảm hệ số dễ.'),
    ('numbered', 'Viết hàm chọn câu tiếp theo theo thứ tự ưu tiên: câu đến hạn, câu chưa học, câu chưa thành thạo, cuối cùng mới là toàn bộ ngân hàng.'),
    ('numbered', 'Viết hàm tính độ thành thạo theo số lần ôn và chuỗi đúng, dùng để vẽ tiến độ.'),
    ('numbered', 'Nối vào giao diện quiz: chọn chuyên đề, chọn số câu, hiện kết quả từng câu, ghi câu sai vào sổ.'),
    ('numbered', 'Viết trang sổ câu sai: lọc theo chuyên đề, đánh dấu đã thành thạo, làm lại riêng các câu đã chọn.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('code', 'src/lib/srs.js — cập nhật lịch ôn sau mỗi lần trả lời',
     """export function srsReview(rec, quality) {
  const r = { ...(rec || freshRecord()) };
  if (quality < 3) {
    r.lapses += 1;
    r.reps = 0;
    r.streak = 0;
    r.interval = 1;
    r.ef = Math.max(1.3, r.ef - 0.2);
    r.due = Date.now() + DAY;
  } else {
    r.reps += 1;
    r.streak += 1;
    if (r.reps === 1) r.interval = 1;
    else if (r.reps === 2) r.interval = 6;
    else r.interval = Math.round(r.interval * r.ef);
    r.ef = Math.max(
      1.3,
      r.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    r.due = Date.now() + r.interval * DAY;
  }
  r.lastReview = Date.now();
  return r;
}"""),
    ('p', 'Hai chi tiết trong đoạn mã đáng chú ý. Thứ nhất, hệ số dễ không bao giờ xuống dưới 1,3: nếu không chặn, một câu hỏi bị sai nhiều lần sẽ có khoảng cách ôn ngắn hơn một ngày và học sinh sẽ gặp lại nó quá dày, gây chán. Thứ hai, lần ôn đầu tiên luôn là một ngày và lần thứ hai là sáu ngày, chỉ từ lần thứ ba mới nhân với hệ số dễ; đây là mốc khởi đầu hợp lí cho kiến thức mới.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'Hình 12', 'Trang quiz và trang sổ câu sai',
     'Chụp hai ảnh: màn hình làm quiz có thanh tiến độ và phản hồi đúng/sai; trang sổ câu sai có bộ lọc theo chuyên đề và danh sách câu cần ôn.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử thủ công theo ba kịch bản: trả lời đúng liên tiếp để kiểm tra khoảng cách ôn tăng dần; trả lời sai để kiểm tra câu quay lại vào ngày hôm sau; làm lại riêng các câu trong sổ để kiểm tra việc đánh dấu thành thạo. [CẦN BỔ SUNG: ghi lại ngày và kết quả từng lần thử.]'),

    # ------------------------------------------------------------------
    ('h3', '4.5. Module phòng thí nghiệm ảo 2D/3D'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cho học sinh nhìn thấy điều không nhìn thấy được trong lớp học: cấu trúc nguyên tử, sự sắp xếp electron theo lớp, và diễn biến của một phản ứng khi rót hai dung dịch vào nhau. Mục tiêu không phải là mô phỏng chính xác đến mức nghiên cứu, mà là làm cho hiện tượng trở nên có thể hình dung và có thể dự đoán.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Three.js và React Three Fiber cho cảnh 3D; một engine phản ứng viết riêng bằng JavaScript thuần, tách khỏi phần hiển thị, để có thể kiểm thử mà không cần dựng hình.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Xây danh mục chất: mỗi chất có công thức, khối lượng mol, trạng thái, màu, nhóm chất, nồng độ mặc định và cảnh báo an toàn.'),
    ('numbered', 'Xây danh sách luật phản ứng: mỗi luật gồm phương trình đã cân bằng, chất tham gia kèm hệ số, hiện tượng quan sát được (kết tủa, sủi bọt, đổi màu, tỏa nhiệt) và điều kiện.'),
    ('numbered', 'Viết engine: nhận hai chất và thể tích, tính số mol, xác định chất dư, chọn luật phản ứng phù hợp, tính nhiệt độ và pH sau phản ứng, trả về danh sách hiện tượng.'),
    ('numbered', 'Dựng cảnh 3D: bàn thí nghiệm, ống nghiệm, cốc có mức dung dịch, hiệu ứng kết tủa và bọt khí.'),
    ('numbered', 'Nối engine với cảnh: khi người dùng rót chất, engine trả kết quả và cảnh cập nhật màu, mức dung dịch, hiện tượng.'),
    ('numbered', 'Thêm phần giải thích bằng chữ và liên kết sang trợ lý AI để hỏi sâu hơn về phản ứng vừa xem.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('code', 'src/features/lab3d/engine.js — một luật phản ứng và cách khai báo chất',
     """  CuSO4: { id: 'CuSO4', vi: 'Đồng sunfat', en: 'Copper(II) sulfate', formula: 'CuSO4',
           M: 159.6, state: 'solution', conc: 0.5, color: '#3b8fe0', cat: 'muối', hazard: ['độc'] },

  {
    id: 'cuso4-naoh',
    eqStr: 'CuSO4 + 2NaOH → Cu(OH)2↓ + Na2SO4',
    reactants: [{ id: 'CuSO4', n: 1 }, { id: 'NaOH', n: 2 }],
    products: [],
    obs: { type: 'kettua', precip: '#4aa3e8', text: 'Xuất hiện kết tủa xanh Cu(OH)2.' },
  },"""),
    ('p', 'Việc tách engine khỏi phần hiển thị là quyết định quan trọng. Nhờ vậy nhóm có thể kiểm tra một phản ứng có cho kết tủa đúng màu hay không bằng cách gọi hàm thuần, không cần mở trình duyệt và không cần chờ cảnh 3D tải xong. Phần khai báo cũng ghi rõ giới hạn ngay trong chú thích đầu tệp: mô hình chỉ phù hợp với dung dịch loãng và axit, bazơ mạnh ở mức trung học phổ thông, không mô phỏng động học.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'Hình 13', 'Phòng thí nghiệm ảo 3D sau khi rót hai dung dịch',
     'Chụp cảnh 3D có cốc dung dịch xanh và kết tủa, kèm bảng kết quả bên cạnh hiển thị phương trình và hiện tượng.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử engine bằng cách gọi trực tiếp các cặp chất đã biết kết quả: axit với bazơ (trung hòa, tỏa nhiệt), muối đồng với kiềm (kết tủa xanh), muối bạc với clorua (kết tủa trắng), kim loại với axit (sủi bọt khí). Kiểm thử giao diện gồm: tải cảnh 3D trên máy tính, trên điện thoại và trên thiết bị không hỗ trợ WebGL (phải hiện thông báo thay vì màn hình trắng). [CẦN BỔ SUNG: kết quả từng lần thử và thời gian tải cảnh 3D.]'),
]
