# -*- coding: utf-8 -*-
"""Nội dung: PHẦN II, mục 4 (module 4.6 – 4.11)."""

BLOCKS = []

BLOCKS += [
    ('h3', '4.6. Module trò chơi giáo dục'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Duy trì nhịp học đều bằng cách biến câu hỏi ôn tập thành trò chơi có điểm, có thứ hạng và có phản hồi tức thì. Điểm quan trọng là câu hỏi trong trò chơi vẫn lấy từ ngân hàng câu hỏi thật, và câu trả lời sai vẫn đi vào sổ câu sai như khi làm quiz.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Canvas và CSS cho phần hiển thị; một engine nhận dạng chuyển động dùng chung cho các trò chơi camera; ngân hàng câu hỏi lấy từ các đề đã xuất bản, mỗi câu chỉ có một đáp án đúng.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Chuẩn hóa đầu vào: mỗi trò chơi khai báo một kiểu dữ liệu chung gồm mã, tên, cách chơi, thời gian, số mạng, màu và biểu tượng.'),
    ('numbered', 'Viết engine câu hỏi dùng chung: lấy câu hỏi theo chuyên đề, xáo đáp án, chấm điểm, ghi nhận câu sai.'),
    ('numbered', 'Viết từng trò chơi trên engine đó: bắt gà, ná cao su, đấu nguyên tố, sudoku Hóa học, phòng lab ảo, kéo co, vòng quay, lật thẻ, ai là triệu phú, đua xe, gỡ mìn, đấu tay đôi.'),
    ('numbered', 'Viết nhóm trò chơi dùng camera: đếm ngón tay để chọn đáp án, nhìn về phía đáp án, chỉ tay, nghiêng người, cười để ghi điểm, đứng yên, trốn tìm.'),
    ('numbered', 'Thêm bảng điểm, thành tích, chuỗi ngày học và phần thưởng hiển thị trong hồ sơ.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('code', 'src/lib/cameraGames.js — khai báo một trò chơi dùng camera',
     """  {
    id: 'cam-fingers',
    name: 'Đếm ngón tay',
    mode: 'fingers',
    desc: 'Đáp án A–F hiện trên màn hình. Giơ đúng SỐ NGÓN TAY tương ứng phương án
           và giữ 2 giây — hệ thống AI đếm ngón tay để chốt đáp án!',
    color: '#f59e0b',
    holdMs: 2200,
  },"""),
    ('p', 'Cách khai báo này cho phép thêm một trò chơi mới mà không phải sửa engine: chỉ cần thêm một đối tượng vào danh mục, route của trò chơi được sinh tự động và giao diện đọc các trường chung để hiển thị thẻ giới thiệu. Trường thời gian giữ (holdMs) là tham số chống nhận nhầm: nếu không yêu cầu giữ động tác trong một khoảng thời gian, một cái vẫy tay ngẫu nhiên sẽ bị tính là câu trả lời.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('p', 'Hình minh họa của module này được đặt trong phần phụ lục ảnh của nhóm. [CẦN CHÈN: ảnh chụp ba trò chơi tiêu biểu, gồm một trò chơi dùng bàn phím, một trò chơi dùng camera và bảng điểm sau khi chơi.]'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử thủ công trên điện thoại và máy tính: vào từng trò chơi bằng đường dẫn, chơi đến khi kết thúc, kiểm tra điểm được lưu, kiểm tra câu sai xuất hiện trong sổ câu sai. Với nhóm dùng camera, kiểm tra thêm ba trường hợp: từ chối quyền camera (phải hiện hướng dẫn thay vì treo), ánh sáng yếu, và hai người cùng trong khung hình. [CẦN BỔ SUNG: kết quả và tỉ lệ nhận đúng của từng trò chơi camera.]'),

    # ------------------------------------------------------------------
    ('h3', '4.7. Module tạo đề bằng AI và ma trận bốn mức độ'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Rút ngắn thời gian soạn một đề kiểm tra từ vài giờ xuống vài phút, nhưng vẫn bảo đảm đề đúng ma trận, đúng số câu, đúng thang điểm và đáp án đã được soát. Đây là module phức tạp nhất về mặt nghiệp vụ vì nó phải vừa đọc được nhiều định dạng tệp, vừa tôn trọng cấu trúc đề của giáo viên, vừa không được để AI tự quyết định cấu trúc.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Thư viện đọc PDF và Word; Tesseract.js cho ảnh chụp; biểu thức chính quy để tách câu hỏi; mô hình ngôn ngữ cho phần đọc hiểu nội dung khó; hàm xuất đề ra Word và PDF.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Đọc tệp: chuyển PDF, Word hoặc ảnh thành văn bản, giữ lại số trang để đối chiếu.'),
    ('numbered', 'Tách câu hỏi bằng biểu thức chính quy với nhiều kiểu đánh số ("Câu 1.", "1/", "1)", "Bài 2:"), gộp những dòng bị ngắt giữa các phương án.'),
    ('numbered', 'Đo tỉ lệ tách thành công; nếu dưới ngưỡng cho phép thì gọi AI để tách phần còn lại, chạy song song để không kéo dài thời gian chờ.'),
    ('numbered', 'Dựng khung ma trận bằng mã nguồn: chia số câu theo mức độ và theo phần, tính điểm từng câu sao cho tổng bằng mười.'),
    ('numbered', 'Để AI đặt tên dạng bài cho từng ô của ma trận, sau đó sinh câu hỏi theo từng ô.'),
    ('numbered', 'Soát đáp án: yêu cầu mô hình giải lại từng câu mà không nhìn đáp án đã sinh, so sánh hai kết quả và đánh dấu câu lệch.'),
    ('numbered', 'Cho giáo viên duyệt, sửa, xóa hoặc thay câu; xuất đề và đáp án ra Word hoặc PDF; giao cho lớp.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('code', 'src/lib/matrixAiService.js — bốn mức độ của ma trận',
     """export const BLOOM_MAPPING = {
  nb: { vn: 'Nhận biết', en: 'Remembering', desc: 'Nhớ khái niệm, định nghĩa, công thức' },
  th: { vn: 'Thông hiểu', en: 'Understanding', desc: 'Giải thích, phân biệt, suy luận' },
  vd: { vn: 'Vận dụng', en: 'Applying', desc: 'Áp dụng công thức, tính toán một bước' },
  vdc: { vn: 'Vận dụng cao', en: 'Analyzing', desc: 'Tổng hợp, biện luận, nhiều bước' },
};"""),
    ('p', 'Chú thích ngay đầu tệp này ghi rõ nguyên tắc thiết kế: ma trận do mã nguồn dựng (số câu, phần, mức độ, điểm luôn khớp tổng mười), AI chỉ đặt tên dạng bài. Nhờ vậy phản hồi mà mô hình phải trả về rất nhỏ, nhanh, và không có khả năng làm lệch số câu. Đây chính là nội dung của giả thuyết H3 ở Phần I.'),
    ('p', 'Đoạn mã thứ hai cho thấy cách bộ đọc đề quyết định khi nào cần đến AI. Các ngưỡng này được chọn sau khi thử trên nhiều đề khác nhau: nếu biểu thức chính quy tách được từ 80% số câu trở lên thì không gọi AI để tiết kiệm thời gian và hạn mức; nếu dưới 50% thì gọi AI cho toàn bộ văn bản; ở giữa hai ngưỡng thì chỉ gửi phần chưa tách được.'),
    ('code', 'src/lib/examParser.js — các ngưỡng quyết định có gọi AI hay không',
     """const MAX_PAGES = 500;
const OCR_PAGE_CAP = 40;
const REGEX_OK_RATE = 0.8;        // >= 80% coi là OK, không gọi AI
const REGEX_FALLBACK_RATE = 0.5;  // < 50% gọi AI toàn bộ
const AI_TIMEOUT_MS = 45000;      // 45s cho mỗi call AI"""),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'Hình 14', 'Màn hình tạo đề: ma trận bốn mức độ và danh sách câu hỏi do AI sinh',
     'Chụp màn hình bước dựng ma trận (bảng có số câu theo bốn mức, tổng điểm bằng 10) và bước duyệt câu hỏi đã sinh, có đánh dấu câu cần soát lại đáp án.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Bộ kiểm thử của phần này gồm 20 ca trong tệp kiểm thử riêng, tập trung vào các hàm xử lý văn bản: tách câu theo nhiều kiểu đánh số, gộp phương án bị ngắt dòng, loại phương án rỗng, chuẩn hóa câu hỏi, xáo đáp án mà vẫn giữ đáp án đúng, và đọc ý định của giáo viên từ câu lệnh ngắn (số câu, thời gian, khối lớp). Toàn bộ 20 ca đạt ngày 24/10/2026. Phần gọi mô hình thật được kiểm thử thủ công bằng đề mẫu ở ba định dạng. [CẦN BỔ SUNG: số đề đã thử, tỉ lệ tách câu đúng, thời gian trung bình để tạo một đề.]'),

    # ------------------------------------------------------------------
    ('h3', '4.8. Module lớp học, phòng thi trực tuyến và giám sát bằng camera'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cho giáo viên một quy trình khép kín từ tạo lớp đến chấm điểm, và cho học sinh một môi trường làm bài có đếm giờ, có lưu bài tự động và có mức giám sát do giáo viên chọn. Yêu cầu bắt buộc là video của học sinh không được gửi lên máy chủ.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Firestore cho đồng bộ thời gian thực; mô hình nhận dạng khuôn mặt và bàn tay của MediaPipe chạy trên thiết bị; API camera của trình duyệt; API toàn màn hình; cảm biến chuyển động của điện thoại; lưu trữ tệp cho ảnh bằng chứng.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Thiết kế cấu trúc phiên thi: một tài liệu phiên chứa thông tin đề, thời gian, trạng thái; mỗi thí sinh là một tài liệu con chứa trạng thái, ảnh nhỏ, sự kiện và vi phạm.'),
    ('numbered', 'Viết lớp truy cập dữ liệu: tạo lớp, sinh mã lớp ngẫu nhiên an toàn, duyệt thành viên, giao đề, tạo lượt làm bài, lưu bài từng câu.'),
    ('numbered', 'Viết cơ chế chống rời trang: yêu cầu toàn màn hình, phát hiện chuyển tab hoặc thoát toàn màn hình, yêu cầu quay lại trong thời gian cho phép.'),
    ('numbered', 'Viết phần camera giám sát: nạp mô hình một lần dùng chung, chạy vòng nhận dạng theo chu kì, đếm số khuôn mặt, xác định hướng mặt, phát hiện bàn tay đưa lên gần mặt và vật giống điện thoại.'),
    ('numbered', 'Viết phần ghi nhận: mỗi sự kiện có loại, mức độ, thời điểm; ảnh nhỏ được tải lên lưu trữ và gắn vào sự kiện; có giới hạn thời gian tải và cơ chế ngắt khi lỗi liên tiếp.'),
    ('numbered', 'Viết màn hình giám sát cho giáo viên: lưới camera, nhật ký, danh sách theo mức rủi ro, nhắc cả phòng, tạm dừng từng học sinh.'),
    ('numbered', 'Viết phần chấm điểm ba dạng câu và tổng hợp phổ điểm.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('p', 'Đoạn mã dưới đây là các ngưỡng thời gian của phần giám sát camera. Đây là phần nhóm phải chỉnh nhiều lần nhất, vì ngưỡng quá nhạy sẽ báo sai liên tục và làm giáo viên mất tin, còn ngưỡng quá lỏng thì không phát hiện được gì.'),
    ('code', 'src/hooks/useProctorCamera.js — ngưỡng phát hiện bất thường',
     """const NO_FACE_MS = 5000;      // không thấy khuôn mặt quá 5 giây
const MULTI_FACE_MS = 3000;    // có người thứ hai trong khung hình
const LOOK_AWAY_MS = 5000;     // quay mặt khỏi màn hình
const HAND_RAISE_MS = 1500;    // tay đưa lên gần mặt
const PHONE_LIKE_MS = 2000;    // vật giống điện thoại
const DETECT_INTERVAL_MS = 600;  // chu kì nhận dạng
const COOLDOWN_MS = 15000;     // khoảng nghỉ giữa hai cảnh báo cùng loại
const CAMERA_GRACE_MS = 12000; // thời gian chờ cấp quyền camera
const UPLOAD_TIMEOUT_MS = 6000;
const UPLOAD_MAX_FAILS = 2;"""),
    ('p', 'Ba tham số quan trọng nhất là chu kì nhận dạng, thời gian giữ và khoảng nghỉ. Chu kì 600 mili giây đủ nhanh để phát hiện hành vi nhưng không làm nóng máy; thời gian giữ giúp phân biệt hành vi thật với một khung hình nhiễu; khoảng nghỉ 15 giây tránh việc một hành vi duy nhất sinh ra hàng chục cảnh báo. Ngoài ra còn một ngưỡng ân hạn 12 giây cho lần đầu bật camera, vì hộp thoại xin quyền của trình duyệt làm mất tiêu điểm cửa sổ và từng bị tính nhầm là vi phạm.'),
    ('code', 'src/lib/classroom.js — sinh mã lớp ngẫu nhiên an toàn',
     """const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 ký tự

function secureRandom(len, alphabet = KEY_ALPHABET) {
  const out = [];
  const buf = new Uint32Array(len);
  (globalThis.crypto || window.crypto).getRandomValues(buf);
  for (let i = 0; i < len; i++) out.push(alphabet[buf[i] % alphabet.length]);
  return out.join('');
}

export function generateClassKey(className = 'LOP') {
  /* ... rút gọn tên lớp thành tiền tố, không dấu ... */
  return `${clean}-${secureRandom(4)}${secureRandom(4)}`;
}"""),
    ('p', 'Mã lớp dùng nguồn ngẫu nhiên của hệ điều hành chứ không dùng hàm ngẫu nhiên thông thường, và bảng chữ cái đã loại các ký tự dễ nhầm khi đọc hoặc gõ (0 với O, 1 với I). Với tám ký tự lấy từ bảng 32 ký tự, số khả năng là 32⁸, tức khoảng 1,1 nghìn tỉ, đủ để không thể dò mã lớp của người khác.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'Hình 15', 'Màn hình giám sát trực tiếp của giáo viên trong một phiên thi',
     'Chụp màn hình giám sát có lưới ô camera của nhiều học sinh, cột nhật ký sự kiện và danh sách học sinh cần chú ý.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử theo bốn kịch bản: học sinh vào phòng bằng mã lớp; học sinh rời tab rồi quay lại (phải bị ghi nhận); giáo viên tạm dừng một học sinh (bài làm phải bị khóa); học sinh nộp bài (điểm hiện ngay và bài nộp không bị tính hai lần). Kiểm thử camera gồm: từ chối quyền, che camera, có hai người, ánh sáng yếu. [CẦN BỔ SUNG: bảng kết quả từng kịch bản, số lần báo sai và tỉ lệ phát hiện đúng trên các lần thử có chủ đích.]'),

    # ------------------------------------------------------------------
    ('h3', '4.9. Module chấm phiếu trắc nghiệm A4'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cho giáo viên chấm cả lớp bằng cách chụp ảnh phiếu trả lời, không cần máy quét chuyên dụng và không cần gửi ảnh lên máy chủ. Module này giải quyết tình huống rất phổ biến: bài kiểm tra trên giấy nhưng kết quả cần nhập vào hệ thống để phân tích.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'JavaScript thuần đọc dữ liệu điểm ảnh; phép biến đổi phối cảnh để đưa ảnh chụp nghiêng về hệ tọa độ chuẩn của mẫu phiếu; kênh màu đỏ để loại nhiễu từ mực in màu.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Thiết kế mẫu phiếu trên khổ A4 theo cấu trúc đề thi: 40 câu trắc nghiệm, 8 câu đúng–sai, 6 câu trả lời ngắn, ô số báo danh và mã đề.'),
    ('numbered', 'Quét mẫu in ở 300 điểm/ảnh, đo tọa độ tâm từng ô và các vạch định vị, ghi lại thành bảng tọa độ trong mã nguồn.'),
    ('numbered', 'Viết hàm tìm bốn vạch định vị ở bốn góc, tính phép biến đổi phối cảnh và ánh xạ ảnh chụp về hệ tọa độ mẫu.'),
    ('numbered', 'Với mỗi ô, đo độ đen tương đối so với vòng nền quanh ô, dùng kênh đỏ để mực in hồng gần như biến mất.'),
    ('numbered', 'Xác định ô được tô, phát hiện ô tô mờ hoặc tô hai ô, trả về danh sách cảnh báo để giáo viên xem lại.'),
    ('numbered', 'Nối kết quả vào hệ thống chấm điểm và xuất báo cáo.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('code', 'src/lib/omr.js — nguyên lí nhận dạng và bảng tọa độ mẫu',
     """   1. Tìm 4 vạch đen ở 4 góc phiếu (và các vạch dọc mép phải) → homography
      đưa ảnh về hệ tọa độ mẫu, chịu được nghiêng/xoay/chụp lệch.
   2. Dùng KÊNH ĐỎ (R): mực in đỏ/hồng của phiếu gần như "biến mất" ở kênh R,
      còn chì/bút đen/xanh thì tối → đo độ đen của ô tô không bị nhiễu bởi
      nền hồng, viền ô, số in trong ô.
   3. Mỗi ô: độ đen = 1 - (R trung bình trong ô) / (R vòng nền quanh ô).

export const TEMPLATE = {
  width: 2480,
  height: 3508,
  bubbleR: 17,
  corners: { TL: [69, 104], TR: [2405, 107], BR: [2408, 3398], BL: [67, 3396] },"""),
    ('p', 'Cách dùng kênh đỏ là điểm kĩ thuật đáng chú ý nhất của module. Nếu đo độ đen trên ảnh xám, phần nền hồng của phiếu và các số in sẵn trong ô sẽ tạo ra sai lệch lớn, đặc biệt khi ảnh chụp thiếu sáng. Trên kênh đỏ, mực in màu gần như trắng còn bút chì và bút bi thì vẫn tối, nên tỉ số giữa ô và vòng nền phản ánh đúng việc học sinh có tô hay không.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'Hình 16', 'Phiếu trả lời mẫu và kết quả nhận dạng trên màn hình',
     'Chụp ảnh phiếu đã tô (che thông tin cá nhân) đặt cạnh màn hình kết quả nhận dạng: số báo danh, mã đề, danh sách đáp án và các cảnh báo ô tô mờ.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử bằng ba nhóm ảnh: ảnh quét phẳng đúng chuẩn, ảnh chụp nghiêng bằng điện thoại, ảnh chụp thiếu sáng. Với mỗi ảnh, so kết quả nhận dạng với đáp án đã tô bằng tay. [CẦN BỔ SUNG: số ảnh thử, số câu nhận đúng trên tổng số câu, các trường hợp phải chấm lại bằng tay.]'),

    # ------------------------------------------------------------------
    ('h3', '4.10. Module tài khoản, phân quyền, gói sử dụng và điểm'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Bảo đảm mỗi người chỉ thấy dữ liệu của mình, phân biệt được ba vai trò (học sinh, giáo viên, quản trị), và kiểm soát chi phí gọi mô hình bằng cơ chế điểm trả trước thay vì để chi phí tăng tự do.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Firebase Authentication cho đăng nhập; quy tắc bảo mật Firestore cho phân quyền; Supabase với chính sách bảo mật mức hàng và một hàm RPC cộng điểm nguyên tử; hàm đám mây và hàm biên để xử lý thanh toán.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Thiết kế ba vai trò và bảng quyền tương ứng cho từng nhóm dữ liệu.'),
    ('numbered', 'Viết quy tắc bảo mật cho Firestore: dữ liệu công khai trong lớp cho phép đọc, dữ liệu cá nhân chỉ chủ sở hữu, cấu hình hệ thống chỉ quản trị.'),
    ('numbered', 'Viết chính sách bảo mật mức hàng cho Supabase, tách bảng nội dung học (đọc công khai) và bảng dữ liệu cá nhân (chỉ chủ sở hữu).'),
    ('numbered', 'Viết cơ chế điểm: mỗi lượt hỏi trừ một điểm, mỗi lần tạo đề trừ nhiều điểm hơn; hoàn điểm khi lỗi; chặn khi số dư bằng không.'),
    ('numbered', 'Viết luồng nạp điểm: tạo mã đơn, hiển thị mã chuyển khoản, nhận thông báo từ cổng thanh toán, đối chiếu số tiền, cộng điểm, chống xử lý trùng.'),
    ('numbered', 'Viết giao diện quản trị: danh sách người dùng, đổi gói, xem giao dịch.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('code', 'firestore.rules — phân quyền theo vai trò và chủ sở hữu (trích)',
     """    function isAdmin() {
      return signedIn() && (
        request.auth.token.admin == true ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }

    match /users/{uid} {
      allow read: if signedIn();
      allow create: if isOwner(uid);
      allow update: if (isOwner(uid) && (
        !('role' in request.resource.data) ||
        request.resource.data.role == resource.data.role ||
        isAdmin()
      )) || isAdmin();
      allow delete: if isAdmin();
    }"""),
    ('p', 'Đoạn mã này thể hiện một nguyên tắc quan trọng: người dùng được sửa hồ sơ của mình nhưng không được tự đổi vai trò. Điều kiện thứ hai so sánh vai trò mới với vai trò đang lưu; nếu khác thì chỉ quản trị mới được phép. Nếu thiếu điều kiện này, bất kì học sinh nào cũng có thể tự đặt mình thành giáo viên và mở được toàn bộ dữ liệu lớp.'),
    ('p', 'Về cơ chế điểm, nhóm chọn cách trừ theo lượt dùng thay vì trừ theo số token vì hai lí do: học sinh hiểu được "một câu hỏi tốn một điểm", và nhóm kiểm soát được chi phí tối đa. Cách trừ theo token chính xác hơn về mặt kế toán nhưng khó giải thích và khó dự báo. Hàm cộng điểm được viết ở phía cơ sở dữ liệu để bảo đảm tính nguyên tử: hai yêu cầu đồng thời không thể cùng đọc một số dư rồi cùng ghi đè.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('p', '[CẦN CHÈN: ảnh chụp màn hình trang quản lý gói sử dụng và lịch sử giao dịch, đã che toàn bộ thông tin tài khoản ngân hàng và thông tin cá nhân.]'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử phân quyền bằng bốn trường hợp: học sinh đọc hồ sơ người khác (phải bị chặn), học sinh tự đổi vai trò (phải bị chặn), giáo viên đọc bài nộp của lớp mình, quản trị đổi gói người dùng. Kiểm thử điểm: trừ khi đủ điểm, chặn khi hết điểm, hoàn điểm khi lỗi, chống cộng trùng một giao dịch. [CẦN BỔ SUNG: kết quả từng trường hợp và ảnh chụp thông báo lỗi.]'),

    # ------------------------------------------------------------------
    ('h3', '4.11. Các module phụ trợ'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Giữ chân người học bằng những công cụ nhỏ dùng hằng ngày, đồng thời gom các công cụ rời rạc mà học sinh thường phải mở nhiều ứng dụng khác nhau vào cùng một tài khoản.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'React và lưu trữ cục bộ cho dữ liệu cá nhân; Supabase cho dữ liệu cần đồng bộ; biểu đồ vẽ trực tiếp bằng SVG để không phải thêm thư viện.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Module thống kê: đọc các lượt làm bài đã hoàn thành, tính điểm trung bình, xu hướng theo ngày, cơ cấu đúng – sai – bỏ trống, hiệu suất theo môn và bản đồ nhiệt theo tuần.'),
    ('numbered', 'Module ghi chú: soạn, gắn thẻ, ghim, tìm kiếm, xuất và nhập tệp.'),
    ('numbered', 'Module thời khóa biểu: thêm lịch lặp hằng tuần hoặc một lần, đánh dấu hoàn thành theo ngày, nhắc khi đến giờ.'),
    ('numbered', 'Module đồng hồ: Pomodoro, hẹn giờ, bấm giây, đồng hồ thế giới.'),
    ('numbered', 'Module đếm ngược kỳ thi, tính điểm trung bình môn và gợi ý ngành học.'),
    ('numbered', 'Module thú cưng học tập: phản hồi theo chuỗi ngày học, tạo động lực quay lại mỗi ngày.'),
    ('label', 'd) Đoạn mã chính và giải thích'),
    ('p', 'Các module này không có thuật toán phức tạp, nên nhóm không trích mã. Điểm kĩ thuật đáng nói là cách lưu dữ liệu: mọi dữ liệu cá nhân của các module phụ trợ được lưu trên thiết bị trước, chỉ đồng bộ lên máy chủ khi người dùng đã đăng nhập. Cách này giữ cho các công cụ nhỏ vẫn dùng được khi mất mạng, và không tạo thêm chi phí đọc ghi cơ sở dữ liệu cho những thao tác tần suất cao như bấm giây hay đánh dấu hoàn thành.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('p', '[CẦN CHÈN: ảnh chụp trang thống kê học tập và trang thời khóa biểu.]'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử thủ công trên điện thoại: thêm ghi chú rồi tải lại trang (dữ liệu phải còn), thêm lịch lặp tuần và kiểm tra hiển thị ở tuần sau, chạy Pomodoro qua một chu kì, xem thống kê với tài khoản chưa có lượt làm bài (phải hiện trạng thái trống thay vì lỗi).'),
]
