# -*- coding: utf-8 -*-
"""PHẦN II - Bước 5: triển khai và thực nghiệm sư phạm."""

BLOCKS = []
BLOCKS += [
    ('h2', '5. BƯỚC 5. TRIỂN KHAI VÀ THỰC NGHIỆM SƯ PHẠM'),
    ('h3', '5.1. Đóng gói và phát hành sản phẩm'),
    ('p', 'Sản phẩm được đóng gói thành tệp tĩnh rồi phát hành lên dịch vụ lưu trữ web. Quy trình gồm bốn bước: chạy kiểm thử, đóng gói, phát hành, kiểm tra lại trên bản đã phát hành. Bước cuối quan trọng vì có những lỗi chỉ xuất hiện sau khi đóng gói, đặc biệt là lỗi liên quan đến biến môi trường và đường dẫn tệp tĩnh.'),
    ('p', 'Bản chạy thật đặt tại địa chỉ https://aitk-ten.vercel.app/. Nhóm tạo mã QR trỏ tới địa chỉ này để dán ở bảng tin lớp học và dùng khi trình bày, vì học sinh mở bằng điện thoại nhanh hơn gõ địa chỉ. Ngoài bản web, ứng dụng có thể cài lên màn hình chính của điện thoại nhờ tệp cấu hình và tệp phục vụ ngoại tuyến, nên mở lại nhanh hơn và không có thanh địa chỉ.'),
    ('figure', 'Hình 12', 'Mã QR truy cập bản chạy thật và ảnh giao diện đã cài lên điện thoại',
     'Đặt mã QR bên trái, ảnh biểu tượng ứng dụng trên màn hình chính bên phải; kiểm tra mã QR quét được trước khi in.'),
    ('p', 'Ba điểm cần lưu ý khi phát hành cho người dùng thật. Thứ nhất, khóa truy cập dịch vụ AI phải nằm ở máy chủ; nếu để trong mã nguồn phía trình duyệt thì bất kì ai mở công cụ phát triển cũng đọc được. Thứ hai, quy tắc bảo mật của cơ sở dữ liệu phải được rà lại trước khi mở cho nhiều lớp, vì mặc định của một số dịch vụ là cho phép mọi tài khoản đã đăng nhập đọc ghi. Thứ ba, cần một tài khoản thử riêng để kiểm tra luồng thanh toán và luồng hết điểm, tránh thử trên tài khoản của học sinh thật.'),
    ('p', 'Trong lần phát hành gần nhất, nhóm phát hiện hai lỗi thuộc loại này. Một lỗi hiển thị sai trên trình duyệt của điện thoại đời cũ do dùng cú pháp JavaScript mới, đã sửa bằng cách thay bằng cú pháp tương thích. Một lỗi khác là quy tắc cơ sở dữ liệu còn mở, đã ghi vào danh sách phải siết lại và được nêu ở phần hạn chế của Phần III thay vì che đi.'),

    ('h3', '5.2. Thiết kế thực nghiệm sư phạm đối chứng'),
    ('p', 'Thực nghiệm được thiết kế theo kiểu hai nhóm có kiểm tra trước và sau tác động. Hai nhóm được chọn từ cùng một khối, có điểm trung bình môn Hóa của học kì trước tương đương, cùng giáo viên dạy và cùng nội dung ôn tập. Nhóm thực nghiệm dùng Elec AI để tự ôn ở nhà trong bốn tuần; nhóm đối chứng ôn theo cách thường lệ là làm bài trong sách bài tập và ghi chép.'),
    ('p', 'Cách chọn này có một điểm yếu cần nêu trước: nhóm không bốc thăm ngẫu nhiên mà lấy hai lớp có sẵn, nên kết quả chỉ nói lên rằng hai nhóm này tiến bộ khác nhau, không chứng minh được quan hệ nhân quả tuyệt đối. Muốn chặt hơn phải bốc thăm chia nhóm trong cùng một lớp, nhưng như vậy sẽ ảnh hưởng đến kế hoạch dạy của giáo viên. Nhóm chọn cách ít xáo trộn hơn và ghi rõ giới hạn này khi báo cáo kết quả.'),
    ('table', 'Bảng 14. Thiết kế thực nghiệm sư phạm',
     ['Nội dung', 'Nhóm thực nghiệm', 'Nhóm đối chứng'],
     [
        ['Số học sinh dự kiến', '35 đến 40', '35 đến 40'],
        ['Cách chọn', 'Nguyên lớp, cùng khối', 'Nguyên lớp, cùng khối'],
        ['Điều kiện tương đương', 'Điểm Hóa học kì trước tương đương', 'Điểm Hóa học kì trước tương đương'],
        ['Cách học trong 4 tuần', 'Tự ôn trên Elec AI ít nhất 3 buổi mỗi tuần, mỗi buổi 30 phút', 'Làm bài trong sách bài tập và ghi chép theo hướng dẫn của giáo viên'],
        ['Bài kiểm tra trước tác động', 'Đề 30 câu, 45 phút, phủ ba chuyên đề', 'Cùng đề, cùng thời điểm'],
        ['Bài kiểm tra sau tác động', 'Đề tương đương độ khó, 30 câu, 45 phút', 'Cùng đề, cùng thời điểm'],
        ['Dữ liệu thu thêm', 'Nhật ký sử dụng, số câu đã làm, sổ câu sai', 'Ghi chép của học sinh, nhận xét của giáo viên'],
        ['Cách xử lí số liệu', 'Tính trung bình, độ lệch chuẩn, kiểm định t', 'Tính trung bình, độ lệch chuẩn, kiểm định t'],
     ],
     [5.0, 6.0, 6.0]),
    ('p', 'Để giảm ảnh hưởng của yếu tố ngoài, nhóm thống nhất ba quy định: không thông báo trước cho học sinh biết đây là thực nghiệm so sánh; cả hai nhóm làm bài kiểm tra cùng thời điểm và cùng đề; giáo viên không dạy thêm nội dung riêng cho một nhóm trong thời gian thực nghiệm. Ba quy định này được ghi thành văn bản và giáo viên xác nhận trước khi bắt đầu.'),

    ('h3', '5.3. Công cụ đo và phương pháp xử lí số liệu'),
    ('p', 'Bốn đại lượng được tính cho mỗi nhóm. Điểm trung bình cho biết mức chung. Độ lệch chuẩn cho biết mức phân tán, tức là lớp có đồng đều hay chênh lệch lớn. Mức chênh lệch chuẩn hóa giữa hai nhóm cho biết khác biệt lớn hay nhỏ theo thang của giáo dục, không phụ thuộc thang điểm của đề. Kiểm định t cho biết khác biệt đó có khả năng do ngẫu nhiên hay không.'),
    ('p', 'Điểm trung bình tính bằng tổng điểm chia số học sinh. Độ lệch chuẩn tính theo công thức mẫu, chia cho n trừ một. Mức chênh lệch chuẩn hóa tính bằng hiệu hai điểm trung bình chia cho độ lệch chuẩn gộp. Kiểm định t dùng kiểm định hai mẫu độc lập, giả thuyết không là hai nhóm có điểm trung bình bằng nhau, mức ý nghĩa 0,05.'),
    ('p', 'Ba điều kiện phải kiểm tra trước khi kết luận. Thứ nhất, phân phối điểm không được lệch quá mạnh; nếu lệch nhiều thì phải dùng kiểm định phi tham số thay cho kiểm định t. Thứ hai, phương sai hai nhóm phải tương đương; nếu không thì dùng biến thể hiệu chỉnh. Thứ ba, cỡ mẫu mỗi nhóm nên từ ba mươi trở lên để kiểm định có ý nghĩa; với mẫu nhỏ hơn, kết quả chỉ nên đọc như xu hướng.'),
    ('table', 'Bảng 15. Mẫu bảng tổng hợp kết quả thực nghiệm',
     ['Nhóm', 'Số học sinh', 'Trung bình trước', 'Độ lệch chuẩn trước', 'Trung bình sau', 'Độ lệch chuẩn sau', 'Chênh lệch'],
     [
        ['Thực nghiệm', '', '', '', '', '', ''],
        ['Đối chứng', '', '', '', '', '', ''],
        ['Kiểm định', 'Giá trị t', 'Bậc tự do', 'Giá trị p', 'Mức chênh lệch chuẩn hóa', 'Kết luận', ''],
     ],
     [2.6, 2.4, 2.6, 2.8, 2.4, 2.6, 1.6]),
    ('p', 'Bảng trên để trống hoàn toàn vì chưa có số liệu. Khi điền, cần ghi cả giá trị p và mức chênh lệch chuẩn hóa, không chỉ ghi p. Một khác biệt có p nhỏ nhưng mức chênh lệch chuẩn hóa rất nhỏ thì có ý nghĩa thống kê nhưng không có ý nghĩa thực tiễn, và ngược lại. Với quy mô một lớp học, mức chênh lệch chuẩn hóa khoảng 0,4 đến 0,6 đã đáng kể; dưới 0,2 thì gần như không đáng kể dù p nhỏ.'),

    ('h3', '5.4. Kết quả thực nghiệm'),
    ('p', 'Phần này gồm ba nội dung: bảng điểm trung bình trước và sau của hai nhóm, biểu đồ phân phối điểm sau tác động, và nhận xét định tính từ quan sát của giáo viên. Cả ba đều chưa có số liệu. Nhóm ghi rõ trình tự sẽ làm để người đọc biết phần nào còn thiếu và thiếu đến đâu.'),
    ('figure', 'Hình 13', 'Biểu đồ phân phối điểm sau tác động của hai nhóm',
     'Vẽ hai biểu đồ cột chồng cạnh nhau theo các khoảng điểm 1 đến 10; ghi số học sinh mỗi cột và điểm trung bình của từng nhóm.'),
    ('p', 'Nhận xét định tính sẽ dựa trên ba nguồn: ghi chép của giáo viên trong bốn tuần, phỏng vấn ngắn năm học sinh mỗi nhóm, và nhật ký sử dụng của nhóm thực nghiệm. Cách chọn học sinh phỏng vấn là chọn theo mức điểm, mỗi mức hai em, để không chỉ nghe ý kiến của nhóm khá. Câu hỏi phỏng vấn xoay quanh ba điểm: em dùng công cụ vào lúc nào, chỗ nào còn khó chịu, và em có tiếp tục dùng sau thực nghiệm không.'),
    ('p', 'Một kết quả phụ cần ghi riêng là mức độ sử dụng thực tế. Trong thiết kế này, nhóm thực nghiệm được yêu cầu ôn ít nhất ba buổi mỗi tuần, nhưng số buổi thực tế có thể thấp hơn nhiều. Nếu không ghi lại số buổi thực tế thì rất dễ kết luận sai rằng công cụ không hiệu quả, trong khi nguyên nhân thật là học sinh không dùng đủ. Vì vậy nhật ký sử dụng là dữ liệu bắt buộc, không phải dữ liệu phụ.'),

    ('h3', '5.5. Đánh giá tính khả thi khi triển khai trong nhà trường'),
    ('p', 'Ngoài hiệu quả học tập, một trường chỉ quyết định dùng khi biết chi phí và điều kiện vận hành. Với quy mô một lớp, hệ thống chạy được trên các gói miễn phí của dịch vụ lưu trữ và cơ sở dữ liệu, chi phí chủ yếu là lượt gọi mô hình. Với quy mô một trường có nhiều lớp thi cùng lúc, cần nâng gói dịch vụ và đặt giới hạn lượt dùng theo lớp để tránh một lớp dùng hết hạn mức của trường.'),
    ('p', 'Ba điều kiện phi kĩ thuật quyết định việc dùng được hay không. Thứ nhất, phải có người chịu trách nhiệm về nội dung: đề và lời giải vẫn cần giáo viên duyệt, công cụ chỉ giảm công sức chứ không thay quyết định chuyên môn. Thứ hai, phải có quy định về dữ liệu học sinh, đặc biệt là ảnh chụp trong lúc giám sát thi, bao gồm thời hạn lưu và người được xem. Thứ ba, phải có phương án khi mất mạng hoặc khi hết hạn mức mô hình, vì bài kiểm tra đang chạy không thể dừng vì lí do kĩ thuật.'),
]

BLOCKS += [
    ('table', 'Bảng 16. Các hạng mục chi phí khi triển khai và cách xác định',
     ['Hạng mục', 'Dịch vụ đang dùng', 'Cách tính', 'Chi phí thực tế', 'Ghi chú'],
     [
        ['Lưu trữ và phát hành web', 'Nền tảng triển khai tệp tĩnh', 'Theo gói và băng thông', '', 'Gói miễn phí đủ cho quy mô một lớp'],
        ['Tên miền', 'Nhà đăng ký tên miền', 'Theo năm', '', 'Có thể dùng tên miền con miễn phí'],
        ['Cơ sở dữ liệu quan hệ', 'Supabase', 'Theo dung lượng và số dự án', '', 'Ghi rõ gói đang dùng'],
        ['Xác thực và dữ liệu thời gian thực', 'Firebase', 'Theo số lượt đọc ghi và dung lượng', '', 'Phòng thi tạo nhiều lượt ghi, cần theo dõi'],
        ['Lượt gọi mô hình', 'Ba nhà cung cấp', 'Theo số token vào ra', '', 'Hạng mục biến động mạnh nhất'],
        ['Lưu trữ ảnh bằng chứng thi', 'Kho lưu trữ tệp', 'Theo dung lượng', '', 'Cần chính sách xóa sau một học kì'],
        ['Công cụ hỗ trợ', 'Trình soạn mã, hệ quản trị mã nguồn', 'Theo tài khoản', '', 'Bản miễn phí là đủ'],
     ],
     [4.0, 4.2, 4.0, 2.4, 4.6]),
    ('p', 'Bảng này để trống cột chi phí vì nhóm chưa tổng hợp hóa đơn. Khi điền cần ghi rõ gói đang dùng và thời điểm lấy giá, vì giá dịch vụ đám mây thay đổi và cùng một mức dùng có thể rẻ hơn nhiều nếu trả theo năm. Cách tính chi phí cho một lớp 40 học sinh trong một tháng nên dựa trên số lượt hỏi thực tế lấy từ nhật kí, không dựa trên số học sinh nhân với một con số ước lượng.'),
]

BLOCKS += [
    ('h3', '5.6. Kế hoạch thu thập minh chứng'),
    ('p', 'Một báo cáo có nhiều ô trống chỉ thuyết phục khi người đọc biết các ô đó sẽ được điền bằng cách nào và trong bao lâu. Bảng dưới đây là kế hoạch thu thập minh chứng, xếp theo thứ tự ưu tiên: việc nào ảnh hưởng đến kết luận của báo cáo thì làm trước.'),
    ('table', 'Bảng 22. Kế hoạch thu thập minh chứng còn thiếu',
     ['Thứ tự', 'Minh chứng', 'Cách làm', 'Thời gian', 'Người phụ trách'],
     [
        ['1', 'Bảng chấm 100 bài và tỉ lệ đúng theo bốn mức', 'Chấm độc lập hai người, đối chiếu chỗ lệch, tính ba chỉ số', '2 tuần', 'Cả nhóm'],
        ['2', 'Kết quả trước và sau của hai nhóm', 'Chạy đề 30 câu cho hai nhóm, tổng hợp điểm, kiểm định t', '4 tuần', 'Nhóm trưởng'],
        ['3', 'Số đo hiệu năng tám dòng', 'Đo ba lần mỗi dòng trên hai điều kiện mạng, lấy trung vị', '1 tuần', 'Thành viên phụ trách kĩ thuật'],
        ['4', 'Kết quả khảo sát thực trạng', 'Phát phiếu, thu, tổng hợp tần số, vẽ biểu đồ', '3 tuần', 'Thành viên phụ trách nội dung'],
        ['5', 'Kết quả 22 kịch bản kiểm thử', 'Chạy tuần tự, ghi ngay kết quả và trạng thái', '1 tuần', 'Cả nhóm'],
        ['6', 'Ảnh giao diện và mã QR', 'Chụp đủ 13 hình theo danh mục, che thông tin cá nhân', '3 ngày', 'Cả nhóm'],
        ['7', 'Sơ đồ kiến trúc, dữ liệu, ca sử dụng, hoạt động', 'Vẽ lại bản sạch từ bản nháp, xuất ảnh', '1 tuần', 'Nhóm trưởng'],
        ['8', 'Chi phí thực tế', 'Đối chiếu bảng giá, ghi rõ gói và thời điểm', '2 ngày', 'Nhóm trưởng'],
        ['9', 'Nhận xét định tính và số buổi sử dụng thực tế', 'Phỏng vấn năm học sinh mỗi nhóm, lấy nhật kí sử dụng', '1 tuần', 'Cả nhóm'],
        ['10', 'Rà soát bảo mật trước khi nộp', 'Đăng nhập bằng tài khoản thứ hai, thử sửa dữ liệu chéo', '1 ngày', 'Nhóm trưởng'],
     ],
     [1.6, 5.4, 6.4, 2.4, 3.2]),
    ('p', 'Hai việc đầu quyết định kết luận của báo cáo nên phải làm trước, kể cả khi thời gian còn ít. Nếu không kịp làm cả hai, nhóm ưu tiên việc thứ nhất, vì phép đo độ chính xác chuyên môn là bằng chứng trực tiếp cho mục tiêu kĩ thuật số một, trong khi thực nghiệm sư phạm cần nhiều tuần và phụ thuộc lịch của trường.'),
    ('p', 'Một điều cần nói rõ với người đọc: nếu đến hạn nộp mà một ô vẫn chưa có số liệu, cách xử lí đúng là ghi rõ chưa đo và giải thích vì sao, không phải điền một con số hợp lí. Trong nghiên cứu, một chỗ trống trung thực có giá trị hơn một con số không kiểm chứng được, vì người phản biện sẽ tìm cách kiểm tra đúng chỗ đó.'),
]
