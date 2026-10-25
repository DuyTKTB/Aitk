# -*- coding: utf-8 -*-
"""PHẦN II mục 4: module 4.4 – 4.6."""

BLOCKS = []
BLOCKS += [
    ('h3', '4.4. Module quiz, lịch ôn và sổ câu sai'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Biến việc ôn tập từ chép lại đề thành một vòng học có phản hồi: mỗi câu trả lời sai được ghi lại, được lên lịch quay lại đúng lúc học sinh sắp quên, và được phân loại theo chuyên đề để biết phần nào còn yếu. Mục tiêu thứ hai là làm cho dữ liệu này dùng lại được ở phía giáo viên, để câu hỏi nhiều học sinh sai trở thành tín hiệu cho việc điều chỉnh bài giảng.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Thuật toán lặp lại ngắt quãng dựa trên hệ số dễ và khoảng cách ôn tăng dần; lưu trạng thái từng câu trong máy của người học để dùng được khi mất mạng; Supabase cho sổ câu sai đồng bộ theo tài khoản; biểu đồ vẽ bằng SVG.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Thiết kế bản ghi cho mỗi câu: hệ số dễ, số lần ôn, khoảng cách hiện tại, số lần quên, chuỗi đúng liên tiếp, thời điểm đến hạn, thời điểm ôn gần nhất.'),
    ('numbered', 'Viết hàm cập nhật sau mỗi lần trả lời, chia hai nhánh: trả lời đúng thì tăng khoảng cách, trả lời sai thì đặt lại khoảng cách về một ngày và giảm hệ số dễ.'),
    ('numbered', 'Viết hàm chọn câu tiếp theo theo thứ tự ưu tiên: câu đến hạn, câu chưa học, câu chưa thành thạo, cuối cùng mới là toàn bộ ngân hàng.'),
    ('numbered', 'Viết hàm tính độ thành thạo theo số lần ôn và chuỗi đúng, dùng để vẽ tiến độ và để quyết định khi nào đánh dấu một câu là đã nắm.'),
    ('numbered', 'Nối vào giao diện quiz: chọn chuyên đề, chọn số câu, hiện kết quả từng câu, ghi câu sai vào sổ.'),
    ('numbered', 'Viết trang sổ câu sai: lọc theo chuyên đề, đánh dấu đã thành thạo, làm lại riêng các câu đã chọn.'),
    ('numbered', 'Viết trang thống kê: tỉ lệ đúng theo chuyên đề, số câu đã làm theo tuần, biểu đồ nhiệt theo ngày trong tuần.'),
    ('numbered', 'Đồng bộ sổ câu sai lên Supabase theo tài khoản, có cơ chế gộp khi người dùng làm trên hai thiết bị.'),
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
    ('p', 'Hai chi tiết trong đoạn mã đáng chú ý. Thứ nhất, hệ số dễ không bao giờ xuống dưới 1,3: nếu không chặn, một câu hỏi bị sai nhiều lần sẽ có khoảng cách ôn ngắn hơn một ngày và học sinh sẽ gặp lại nó quá dày, gây chán. Thứ hai, lần ôn đầu tiên luôn là một ngày và lần thứ hai là sáu ngày, chỉ từ lần thứ ba mới nhân với hệ số dễ; đây là mốc khởi đầu hợp lí cho kiến thức mới, tránh việc một câu vừa học đã bị đẩy xa ba tuần.'),
    ('p', 'Công thức cập nhật hệ số dễ lấy từ nghiên cứu về tối ưu khoảng cách lặp lại của Wozniak và Gorzelanczyk (1994). Nhóm dùng lại công thức nhưng thay đổi một điểm: thang chất lượng câu trả lời được rút gọn còn ba mức (sai, đúng nhưng chậm, đúng nhanh) thay vì sáu mức, vì học sinh không đánh giá được chính xác mức độ nhớ của mình.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'quiz', 'Trang làm quiz với thanh tiến độ và phản hồi từng câu',
     'Chụp màn hình một câu hỏi trắc nghiệm đang làm, có thanh tiến độ, số câu đã làm và phần phản hồi sau khi chọn.'),
    ('figure', 'quizresult', 'Trang kết quả quiz và phân tích theo chuyên đề',
     'Chụp màn hình kết quả sau khi làm 10 câu: điểm, số câu đúng sai, và danh sách chuyên đề cần ôn thêm.'),
    ('figure', 'wrongbook', 'Sổ câu sai với bộ lọc theo chuyên đề',
     'Chụp trang sổ câu sai: danh sách câu, nhãn chuyên đề, số lần sai, và nút làm lại riêng các câu đã chọn.'),
    ('figure', 'stats', 'Trang thống kê học tập',
     'Chụp trang thống kê có biểu đồ tỉ lệ đúng theo chuyên đề và biểu đồ số câu đã làm theo tuần.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử thủ công theo bốn kịch bản: trả lời đúng liên tiếp để kiểm tra khoảng cách ôn tăng dần; trả lời sai để kiểm tra câu quay lại vào ngày hôm sau; làm lại riêng các câu trong sổ để kiểm tra việc đánh dấu thành thạo; và làm bài trên hai thiết bị để kiểm tra việc gộp dữ liệu. Ngoài ra có một kiểm thử tự động nhỏ cho hàm cập nhật lịch, kiểm tra ba trường hợp: lần đầu, lần thứ hai và lần sai.'),
    ('p', '[CẦN BỔ SUNG: ngày và kết quả từng lần thử, số câu trung bình mỗi phiên, và tỉ lệ học sinh quay lại ôn trong vòng hai ngày.]'),

    # ---------------------------------------------------------------- 4.5
    ('h3', '4.5. Module phòng thí nghiệm ảo 2D và 3D'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Cho học sinh nhìn thấy điều không nhìn thấy được trong lớp học: cấu trúc nguyên tử, sự sắp xếp electron theo lớp, và diễn biến của một phản ứng khi rót hai dung dịch vào nhau. Mục tiêu không phải là mô phỏng chính xác đến mức nghiên cứu, mà là làm cho hiện tượng trở nên có thể hình dung và có thể dự đoán.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Three.js và React Three Fiber cho cảnh 3D; một engine phản ứng viết riêng bằng JavaScript thuần, tách khỏi phần hiển thị, để có thể kiểm thử mà không cần dựng hình; CSS cho phần mô phỏng 2D nhẹ hơn.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Xây danh mục chất: mỗi chất có công thức, khối lượng mol, trạng thái, màu, nhóm chất, nồng độ mặc định và cảnh báo an toàn.'),
    ('numbered', 'Xây danh sách luật phản ứng: mỗi luật gồm phương trình đã cân bằng, chất tham gia kèm hệ số, hiện tượng quan sát được (kết tủa, sủi bọt, đổi màu, tỏa nhiệt) và điều kiện.'),
    ('numbered', 'Viết engine: nhận hai chất và thể tích, tính số mol, xác định chất dư, chọn luật phản ứng phù hợp, tính nhiệt độ và pH sau phản ứng, trả về danh sách hiện tượng.'),
    ('numbered', 'Dựng cảnh 3D: bàn thí nghiệm, ống nghiệm, cốc có mức dung dịch, hiệu ứng kết tủa và bọt khí.'),
    ('numbered', 'Nối engine với cảnh: khi người dùng rót chất, engine trả kết quả và cảnh cập nhật màu, mức dung dịch, hiện tượng.'),
    ('numbered', 'Thêm phần giải thích bằng chữ và liên kết sang trợ lý AI để hỏi sâu hơn về phản ứng vừa xem.'),
    ('numbered', 'Thêm chế độ 2D cho thiết bị không hỗ trợ đồ họa 3D, dùng cùng engine nhưng hiển thị bằng hình vẽ phẳng.'),
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
    ('figure', 'lab3d', 'Phòng thí nghiệm ảo 3D trước khi rót dung dịch',
     'Chụp cảnh 3D có bàn thí nghiệm, hai cốc dung dịch và bảng chọn chất bên cạnh.'),
    ('figure', 'lab3drx', 'Phòng thí nghiệm ảo sau khi rót hai dung dịch',
     'Chụp cảnh 3D có cốc dung dịch xanh và kết tủa, kèm bảng kết quả hiển thị phương trình và hiện tượng.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử engine bằng cách gọi trực tiếp các cặp chất đã biết kết quả: axit với bazơ (trung hòa, tỏa nhiệt), muối đồng với kiềm (kết tủa xanh), muối bạc với clorua (kết tủa trắng), kim loại với axit (sủi bọt khí). Kiểm thử giao diện gồm: tải cảnh 3D trên máy tính, trên điện thoại, và trên thiết bị không hỗ trợ WebGL (phải hiện thông báo và chuyển sang chế độ 2D thay vì màn hình trắng).'),
    ('p', '[CẦN BỔ SUNG: kết quả từng lần thử và thời gian tải cảnh 3D trên ba nhóm thiết bị.]'),

    # ---------------------------------------------------------------- 4.6
    ('h3', '4.6. Module trò chơi giáo dục'),
    ('label', 'a) Mục tiêu'),
    ('p', 'Duy trì nhịp học đều bằng cách biến câu hỏi ôn tập thành trò chơi có điểm, có thứ hạng và có phản hồi tức thì. Điểm quan trọng là câu hỏi trong trò chơi vẫn lấy từ ngân hàng câu hỏi thật, và câu trả lời sai vẫn đi vào sổ câu sai như khi làm quiz — nếu không, trò chơi chỉ là giải trí và không đóng góp cho việc học.'),
    ('label', 'b) Công nghệ sử dụng'),
    ('p', 'Canvas và CSS cho phần hiển thị; một engine nhận dạng chuyển động dùng chung cho các trò chơi camera; ngân hàng câu hỏi lấy từ các đề đã xuất bản, mỗi câu chỉ có một đáp án đúng.'),
    ('label', 'c) Các bước thực hiện'),
    ('numbered', 'Chuẩn hóa đầu vào: mỗi trò chơi khai báo một kiểu dữ liệu chung gồm mã, tên, cách chơi, thời gian, số mạng, màu và biểu tượng.'),
    ('numbered', 'Viết engine câu hỏi dùng chung: lấy câu hỏi theo chuyên đề, xáo đáp án, chấm điểm, ghi nhận câu sai.'),
    ('numbered', 'Viết từng trò chơi trên engine đó: bắt gà, ná cao su, đấu nguyên tố, sudoku Hóa học, phòng lab ảo, kéo co, vòng quay, lật thẻ, ai là triệu phú, đua xe, gỡ mìn, đấu tay đôi.'),
    ('numbered', 'Viết nhóm trò chơi dùng camera: đếm ngón tay để chọn đáp án, nhìn về phía đáp án, chỉ tay, nghiêng người, cười để ghi điểm, đứng yên, trốn tìm.'),
    ('numbered', 'Thêm bảng điểm, thành tích, chuỗi ngày học và phần thưởng hiển thị trong hồ sơ.'),
    ('numbered', 'Thêm giới hạn thời gian và số mạng để trò chơi không kéo dài vô hạn, đồng thời giữ nhịp học ngắn.'),
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
    ('p', 'Cách khai báo này cho phép thêm một trò chơi mới mà không phải sửa engine: chỉ cần thêm một đối tượng vào danh mục, đường dẫn của trò chơi được sinh tự động và giao diện đọc các trường chung để hiển thị thẻ giới thiệu. Trường thời gian giữ (holdMs) là tham số chống nhận nhầm: nếu không yêu cầu giữ động tác trong một khoảng thời gian, một cái vẫy tay ngẫu nhiên sẽ bị tính là câu trả lời.'),
    ('p', 'Nhóm chọn cách để camera chỉ đọc chuyển động, không nhận dạng danh tính. Cụ thể, mô hình chỉ trả về vị trí các điểm mốc trên bàn tay và khuôn mặt, không so khớp với ai. Đây là quyết định về quyền riêng tư: trò chơi không cần biết người chơi là ai, chỉ cần biết tay đang giơ mấy ngón.'),
    ('label', 'đ) Hình ảnh minh họa'),
    ('figure', 'cameragame', 'Một trò chơi dùng camera và bảng điểm sau khi chơi',
     'Chụp hai ảnh: màn hình trò chơi đếm ngón tay đang hiện câu hỏi và khung camera; bảng điểm cuối lượt có số câu đúng và phần thưởng.'),
    ('label', 'e) Kiểm thử riêng'),
    ('p', 'Kiểm thử thủ công trên điện thoại và máy tính: vào từng trò chơi bằng đường dẫn, chơi đến khi kết thúc, kiểm tra điểm được lưu, kiểm tra câu sai xuất hiện trong sổ câu sai. Với nhóm dùng camera, kiểm tra thêm bốn trường hợp: từ chối quyền camera (phải hiện hướng dẫn thay vì treo), ánh sáng yếu, hai người cùng trong khung hình, và thiết bị không có camera.'),
    ('p', '[CẦN BỔ SUNG: kết quả từng trò chơi và tỉ lệ nhận đúng động tác của nhóm trò chơi camera.]'),
]
