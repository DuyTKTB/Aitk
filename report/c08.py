# -*- coding: utf-8 -*-
"""PHẦN II mục 4: module 4.7 – 4.9."""

BLOCKS = []
BLOCKS += [
    ('h3', '4.7. Module tạo đề bằng AI và ma trận bốn mức độ'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Rút ngắn thời gian soạn một đề kiểm tra từ vài giờ xuống vài phút, nhưng vẫn bảo đảm đề đúng ma trận, đúng số câu, đúng thang điểm và đáp án đã được soát. Đây là module phức tạp nhất về mặt nghiệp vụ vì nó phải vừa đọc được nhiều định dạng tệp, vừa tôn trọng cấu trúc đề của giáo viên, vừa không được để AI tự quyết định cấu trúc.'),
    ('p', 'Mục tiêu thứ hai là giữ quyền quyết định ở giáo viên. Hệ thống không tự giao đề, không tự chọn câu thay giáo viên và không giấu câu nào. Mọi câu do AI sinh đều được đưa ra để duyệt, có đánh dấu những câu cần xem lại.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Thư viện đọc PDF và Word; Tesseract.js cho ảnh chụp; biểu thức chính quy để tách câu hỏi; mô hình ngôn ngữ cho phần đọc hiểu nội dung khó; hàm xuất đề ra Word và PDF.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Đọc tệp: chuyển PDF, Word hoặc ảnh thành văn bản, giữ lại số trang để đối chiếu khi cần kiểm tra lại.'),
    ('numbered', 'Tách câu hỏi bằng biểu thức chính quy với nhiều kiểu đánh số (“Câu 1.”, “1/”, “1)”, “Bài 2:”), gộp những dòng bị ngắt giữa các phương án.'),
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
    ('p', 'Việc đặt giới hạn 500 trang và 40 trang cho nhận dạng kí tự là để bảo vệ hệ thống: một tệp quá lớn có thể làm trình duyệt hết bộ nhớ, và nhận dạng kí tự là bước chậm nhất trong toàn bộ quy trình. Khi vượt giới hạn, hệ thống báo rõ cho giáo viên biết phần nào chưa được xử lí thay vì im lặng bỏ qua.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'createupload', 'Bước tải tệp đề và kết quả tách câu',
     'Chụp màn hình sau khi tải một tệp PDF: danh sách câu đã tách, số câu tìm được, và thông báo tỉ lệ tách thành công.'),
    ('figure', 'matrix', 'Màn hình dựng ma trận bốn mức độ',
     'Chụp bảng ma trận có bốn dòng mức độ, số câu mỗi mức, tổng điểm bằng 10, và phần chọn thời gian làm bài.'),
    ('figure', 'review', 'Màn hình duyệt câu hỏi do AI sinh',
     'Chụp danh sách câu hỏi sau khi sinh, có đánh dấu các câu cần soát lại đáp án và nút sửa, xóa, thay câu.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Bộ kiểm thử của phần này gồm 20 ca trong tệp kiểm thử riêng, tập trung vào các hàm xử lý văn bản: tách câu theo nhiều kiểu đánh số, gộp phương án bị ngắt dòng, loại phương án rỗng, chuẩn hóa câu hỏi, xáo đáp án mà vẫn giữ đáp án đúng, và đọc ý định của giáo viên từ câu lệnh ngắn (số câu, thời gian, khối lớp). Toàn bộ 20 ca đạt ngày 24 tháng 10 năm 2026.'),
    ('p', 'Phần gọi mô hình thật được kiểm thử thủ công bằng đề mẫu ở ba định dạng: một tệp Word có công thức, một tệp PDF scan, và một ảnh chụp trang sách. [CẦN BỔ SUNG: số đề đã thử, tỉ lệ tách câu đúng, thời gian trung bình để tạo một đề, và số câu phải sửa tay.]'),

    # ---------------------------------------------------------------- 4.8
    ('h3', '4.8. Module lớp học, phòng thi trực tuyến và giám sát bằng camera'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cho giáo viên một quy trình khép kín từ tạo lớp đến chấm điểm, và cho học sinh một môi trường làm bài có đếm giờ, có lưu bài tự động và có mức giám sát do giáo viên chọn. Yêu cầu bắt buộc là video của học sinh không được gửi lên máy chủ.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Firestore cho đồng bộ thời gian thực; mô hình nhận dạng khuôn mặt và bàn tay của MediaPipe chạy trên thiết bị; API camera và API toàn màn hình của trình duyệt; cảm biến chuyển động của điện thoại; lưu trữ tệp cho ảnh bằng chứng.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Thiết kế cấu trúc phiên thi: một tài liệu phiên chứa thông tin đề, thời gian, trạng thái; mỗi thí sinh là một tài liệu con chứa trạng thái, ảnh nhỏ, sự kiện và vi phạm.'),
    ('numbered', 'Viết lớp truy cập dữ liệu: tạo lớp, sinh mã lớp ngẫu nhiên an toàn, duyệt thành viên, giao đề, tạo lượt làm bài, lưu bài từng câu.'),
    ('numbered', 'Viết cơ chế chống rời trang: yêu cầu toàn màn hình, phát hiện chuyển tab hoặc thoát toàn màn hình, yêu cầu quay lại trong thời gian cho phép.'),
    ('numbered', 'Viết phần camera giám sát: nạp mô hình một lần dùng chung, chạy vòng nhận dạng theo chu kì, đếm số khuôn mặt, xác định hướng mặt, phát hiện bàn tay đưa lên gần mặt và vật giống điện thoại.'),
    ('numbered', 'Viết phần ghi nhận: mỗi sự kiện có loại, mức độ, thời điểm; ảnh nhỏ được tải lên lưu trữ và gắn vào sự kiện; có giới hạn thời gian tải và cơ chế ngắt khi lỗi liên tiếp.'),
    ('numbered', 'Viết màn hình giám sát cho giáo viên: lưới camera, nhật ký, danh sách theo mức rủi ro, nhắc cả phòng, tạm dừng từng học sinh.'),
    ('numbered', 'Viết phần chấm điểm ba dạng câu và tổng hợp phổ điểm, kèm danh sách câu nhiều học sinh sai.'),
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
    ('table', 'threshold', 'Bảng ngưỡng và ý nghĩa của từng ngưỡng trong phần giám sát',
     ['Ngưỡng', 'Giá trị', 'Ý nghĩa', 'Hệ quả nếu đặt sai'],
     [
        ['Không thấy khuôn mặt', '5 giây', 'Thí sinh ra khỏi khung hình hoặc che camera', 'Đặt thấp: báo sai khi học sinh cúi ghi bài'],
        ['Có người thứ hai', '3 giây', 'Có người khác trong khung hình', 'Đặt thấp: báo sai khi người nhà đi qua'],
        ['Quay mặt đi', '5 giây', 'Hướng mặt lệch khỏi màn hình', 'Đặt thấp: báo sai khi học sinh nhìn bàn phím'],
        ['Tay gần mặt', '1,5 giây', 'Tay đưa lên vùng mặt', 'Đặt thấp: báo sai khi học sinh chống cằm'],
        ['Vật giống điện thoại', '2 giây', 'Có vật hình chữ nhật trong tay', 'Đặt thấp: báo sai với bút và thước'],
        ['Chu kì nhận dạng', '600 mili giây', 'Khoảng cách giữa hai lần phân tích', 'Đặt thấp: máy nóng, tốn pin'],
        ['Khoảng nghỉ cảnh báo', '15 giây', 'Thời gian tối thiểu giữa hai cảnh báo cùng loại', 'Đặt thấp: một hành vi sinh nhiều cảnh báo'],
     ], [4.4, 2.6, 5.4, 6.6]),
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
    ('figure', 'classes', 'Trang quản lý lớp của giáo viên',
     'Chụp danh sách lớp có mã lớp, số học sinh, tiến độ giao bài và trạng thái duyệt thành viên.'),
    ('figure', 'assign', 'Màn hình giao đề cho lớp',
     'Chụp hộp thoại giao đề: chọn lớp, chọn đề, thời gian làm bài, hình thức giám sát.'),
    ('figure', 'examtaking', 'Màn hình làm bài thi của học sinh',
     'Chụp màn hình làm bài có đồng hồ đếm ngược, lưới số câu và vùng trả lời của một câu đúng–sai bốn ý.'),
    ('figure', 'proctor', 'Màn hình giám sát trực tiếp của giáo viên',
     'Chụp màn hình giám sát có lưới ô camera của nhiều học sinh, cột nhật ký sự kiện và danh sách học sinh cần chú ý.'),
    ('figure', 'violation', 'Biên bản vi phạm kèm ảnh bằng chứng và mốc thời gian',
     'Chụp biên bản của một phiên thi: danh sách sự kiện theo thời gian, ảnh nhỏ bên cạnh mỗi sự kiện, và phần ghi chú của giáo viên.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử theo sáu kịch bản: học sinh vào phòng bằng mã lớp; học sinh rời tab rồi quay lại (phải bị ghi nhận); giáo viên tạm dừng một học sinh (bài làm phải bị khóa); học sinh nộp bài (điểm hiện ngay và bài nộp không bị tính hai lần); mất mạng giữa lúc làm (bài phải còn khi có mạng lại); và hai học sinh cùng đăng nhập một tài khoản (phải bị phát hiện).'),
    ('p', 'Kiểm thử camera gồm năm tình huống: từ chối quyền, che camera, có hai người trong khung hình, ánh sáng yếu, và thiết bị không có camera. [CẦN BỔ SUNG: bảng kết quả từng kịch bản, số lần báo sai và tỉ lệ phát hiện đúng trên các lần thử có chủ đích.]'),

    # ---------------------------------------------------------------- 4.9
    ('h3', '4.9. Module chấm phiếu trắc nghiệm A4'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cho giáo viên chấm cả lớp bằng cách chụp ảnh phiếu trả lời, không cần máy quét chuyên dụng và không cần gửi ảnh lên máy chủ. Module này giải quyết tình huống rất phổ biến: bài kiểm tra trên giấy nhưng kết quả cần nhập vào hệ thống để phân tích.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'JavaScript thuần đọc dữ liệu điểm ảnh; phép biến đổi phối cảnh để đưa ảnh chụp nghiêng về hệ tọa độ chuẩn của mẫu phiếu; kênh màu đỏ để loại nhiễu từ mực in màu.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Thiết kế mẫu phiếu trên khổ A4 theo cấu trúc đề thi: 40 câu trắc nghiệm, 8 câu đúng–sai, 6 câu trả lời ngắn, ô số báo danh và mã đề.'),
    ('numbered', 'Quét mẫu in ở 300 điểm trên inch, đo tọa độ tâm từng ô và các vạch định vị, ghi lại thành bảng tọa độ trong mã nguồn.'),
    ('numbered', 'Viết hàm tìm bốn vạch định vị ở bốn góc, tính phép biến đổi phối cảnh và ánh xạ ảnh chụp về hệ tọa độ mẫu.'),
    ('numbered', 'Với mỗi ô, đo độ đen tương đối so với vòng nền quanh ô, dùng kênh đỏ để mực in màu gần như biến mất.'),
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
    ('p', 'Việc so độ đen với vòng nền quanh ô, thay vì so với một ngưỡng cố định, giúp hệ thống chịu được ảnh sáng tối khác nhau: nếu cả ảnh tối, cả ô và vòng nền đều tối, tỉ số vẫn phản ánh đúng tương quan. Đây là kĩ thuật đơn giản nhưng hiệu quả hơn nhiều so với việc dùng ngưỡng tuyệt đối.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'omrsheet', 'Phiếu trả lời mẫu khổ A4',
     'Chụp ảnh phiếu mẫu đã in, che phần thông tin cá nhân, thấy rõ bốn vạch định vị ở bốn góc và các ô tô.'),
    ('figure', 'omrresult', 'Kết quả nhận dạng phiếu trên màn hình',
     'Chụp màn hình kết quả: số báo danh, mã đề, danh sách đáp án nhận được và các cảnh báo ô tô mờ.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử bằng ba nhóm ảnh: ảnh quét phẳng đúng chuẩn, ảnh chụp nghiêng bằng điện thoại, ảnh chụp thiếu sáng. Với mỗi ảnh, so kết quả nhận dạng với đáp án đã tô bằng tay. Ngoài ra có một kiểm thử về trường hợp phiếu bị nhàu hoặc bị che một góc, để xem hệ thống báo lỗi rõ ràng thay vì trả kết quả sai.'),
    ('p', '[CẦN BỔ SUNG: số ảnh thử, số câu nhận đúng trên tổng số câu, các trường hợp phải chấm lại bằng tay.]'),
]
