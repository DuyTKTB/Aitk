# -*- coding: utf-8 -*-
"""Trang bìa, tóm tắt, PHẦN I mục 1."""

COVER = {
    'org1': 'CUỘC THI KHOA HỌC KĨ THUẬT TỈNH HƯNG YÊN',
    'org2': 'DÀNH CHO HỌC SINH TRUNG HỌC NĂM HỌC 2025 – 2026',
    'org3': 'BÁO CÁO DỰ ÁN DỰ THI',
    'kind': 'XÂY DỰNG NỀN TẢNG WEB ELEC AI HỖ TRỢ TỰ HỌC VÀ QUẢN LÝ LỚP HỌC MÔN HÓA HỌC Ở TRƯỜNG TRUNG HỌC PHỔ THÔNG',
    'label': 'Lĩnh vực dự thi:',
    'title': 'TIN HỌC',
    'field': '',
    'authors': [
        ('Nguyễn Thế Duy – Lớp 11A7', 'Trưởng nhóm, phụ trách kĩ thuật'),
        ('Nguyễn Bùi Nguyệt Minh – Lớp 10A1', 'Thành viên, phụ trách nội dung và truyền thông'),
    ],
    'place': 'Hưng Yên, tháng 10 năm 2026',
}

BLOCKS = []
BLOCKS += [
    ('pagebreak',),
    ('h1c', 'TÓM TẮT DỰ ÁN'),
    ('p', 'ELEC AI là một nền tảng web phục vụ việc dạy và học môn Hóa học ở cấp trung học phổ thông, được xây dựng cho hai nhóm người dùng trong cùng một hệ thống: học sinh và giáo viên. Với học sinh, nền tảng cung cấp một trợ lý trí tuệ nhân tạo giải bài theo từng bước, bảng tuần hoàn 118 nguyên tố có tra cứu tức thời, bộ công cụ tính toán Hóa học, hệ thống quiz có lịch ôn tập cá nhân, sổ ghi câu làm sai, phòng thí nghiệm ảo 2D và 3D, cùng một bộ trò chơi ôn tập. Với giáo viên, nền tảng cung cấp công cụ tạo đề từ ảnh chụp, tệp PDF và tệp Word, công cụ dựng ma trận đề theo bốn mức độ nhận thức, công cụ quản lý lớp, phòng thi trực tuyến có giám sát bằng camera và công cụ chấm phiếu trắc nghiệm bằng ảnh chụp.'),
    ('p', 'Điểm kĩ thuật trung tâm của dự án là cách tổ chức lớp trí tuệ nhân tạo. Các trợ lý AI phổ thông thường để mô hình ngôn ngữ vừa lập luận vừa tự thực hiện phép tính; cách làm đó nhanh nhưng sinh ra lỗi số học khó phát hiện, đặc biệt với bài toán Hóa học nhiều bước. Nhóm chúng em tách hai việc ra: mô hình ngôn ngữ chịu trách nhiệm giải thích và trình bày, còn mọi phép tính (khối lượng mol, cân bằng phương trình, số mol, nồng độ, pH, bài toán theo phương trình) do các công cụ viết bằng JavaScript thực hiện trước và đưa vào câu lệnh như dữ liệu bắt buộc. Sau khi mô hình trả lời, một bước kiểm tra độc lập đối chiếu các con số trong câu trả lời với kết quả của công cụ và gắn cảnh báo nếu phát hiện khác biệt.'),
    ('p', 'Cách tổ chức thứ hai đáng chú ý là quy trình tạo đề. Phần mềm tự dựng khung ma trận theo số câu, phần thi, mức độ và thang điểm; mô hình chỉ đặt tên dạng bài cho từng ô và sinh nội dung câu hỏi. Nhờ vậy đề tạo ra luôn khớp ma trận, kể cả khi giáo viên đổi yêu cầu, và phản hồi mà mô hình phải trả về nhỏ nên nhanh và ít sai. Đáp án sau khi sinh được soát lại bằng một lượt giải độc lập không nhìn đáp án.'),
    ('p', 'Phần giám sát thi được thiết kế theo hướng không truyền video của học sinh lên máy chủ. Mô hình nhận dạng khuôn mặt và bàn tay chạy ngay trên trình duyệt của thí sinh; hệ thống chỉ gửi lên sự kiện kèm ảnh nhỏ làm bằng chứng. Cách làm này giảm chi phí băng thông và lưu trữ, đồng thời tránh việc phải lưu trữ hình ảnh cá nhân của học sinh trên đám mây.'),
    ('p', 'Sản phẩm đã được triển khai và chạy thật tại địa chỉ https://aitk-ten.vercel.app/. Mã nguồn gồm khoảng 104.400 dòng JavaScript và JSX, 191 tệp giao diện và 262 tệp định kiểu. Phần lõi trí tuệ nhân tạo có 9 tệp kiểm thử tự động với 118 ca kiểm thử. Ngày 24 tháng 10 năm 2026, nhóm chạy lại toàn bộ bộ kiểm thử: 117 ca đạt và 1 ca không đạt; ca không đạt là ca kiểm thử còn kì vọng 7 chế độ học trong khi mã hiện có 6 chế độ, tức lỗi nằm ở ca kiểm thử chứ không ở chương trình.'),
    ('p', 'Báo cáo được tổ chức thành ba phần. Phần I trình bày lí do chọn dự án, giả thuyết khoa học, câu hỏi nghiên cứu, mục tiêu kĩ thuật, phương pháp nghiên cứu và kế hoạch thực hiện. Phần II trình bày quy trình thiết kế, xây dựng và thử nghiệm, đi từ phân tích yêu cầu, kiến trúc tổng thể, thiết kế giao diện, xây dựng mười một module, tích hợp và triển khai, bảng công nghệ và chi phí, đến thử nghiệm và đánh giá. Phần III kết luận, đối chiếu từng mục tiêu với kết quả, nêu tính mới, tính sáng tạo, hạn chế và hướng phát triển.'),
    ('p', 'Một nguyên tắc được giữ trong suốt báo cáo: không đưa ra con số nào mà nhóm chưa đo được. Vì vậy các nội dung cần số liệu thực nghiệm như kết quả khảo sát người dùng, thời gian tải đo trên thiết bị, độ chính xác của trợ lý AI trên bộ đề chuẩn đều được để trống có ghi chú rõ ràng, kèm khung bảng để điền. Danh mục đầy đủ các chỗ cần bổ sung được tập hợp ở phụ lục cuối báo cáo.'),
    ('p', 'Báo cáo cũng ghi lại những hạn chế đã biết của sản phẩm, kể cả hạn chế về bảo mật, vì nhóm cho rằng một báo cáo kĩ thuật trung thực về điểm yếu sẽ có ích hơn một báo cáo chỉ nêu ưu điểm. Ba hạn chế được xếp mức cao gồm: một phần lời gọi mô hình còn thực hiện trực tiếp từ trình duyệt, quy tắc bảo mật cơ sở dữ liệu Firestore còn mở với người dùng đã đăng nhập, và hai nguồn dữ liệu hạn mức sử dụng chưa được hợp nhất.'),
]

BLOCKS += [
    ('pagebreak',),
    ('toc', 'MỤC LỤC'),
]

BLOCKS += [
    ('pagebreak',),
    ('h1c', 'DANH MỤC TỪ VIẾT TẮT VÀ KÍ HIỆU'),
    ('table', 'abbr', 'Danh mục từ viết tắt dùng trong báo cáo',
     ['Từ viết tắt', 'Nội dung đầy đủ', 'Ghi chú'],
     [
        ['AI', 'Trí tuệ nhân tạo (Artificial Intelligence)', ''],
        ['API', 'Giao diện lập trình ứng dụng (Application Programming Interface)', ''],
        ['CDN', 'Mạng phân phối nội dung (Content Delivery Network)', ''],
        ['CI', 'Tích hợp liên tục (Continuous Integration)', ''],
        ['CSS', 'Ngôn ngữ định kiểu trình bày (Cascading Style Sheets)', ''],
        ['CT GDPT', 'Chương trình Giáo dục phổ thông', ''],
        ['ĐGTD', 'Đánh giá tư duy', 'Kì thi của một số trường đại học'],
        ['ĐGNL', 'Đánh giá năng lực', 'Kì thi của một số trường đại học'],
        ['ER', 'Mô hình thực thể – quan hệ (Entity–Relationship)', ''],
        ['FR', 'Yêu cầu chức năng (Functional Requirement)', ''],
        ['GDPT', 'Giáo dục phổ thông', ''],
        ['HS', 'Học sinh', ''],
        ['GV', 'Giáo viên', ''],
        ['JSON', 'Định dạng dữ liệu dạng văn bản có cấu trúc', ''],
        ['LLM', 'Mô hình ngôn ngữ lớn (Large Language Model)', ''],
        ['LocalStorage', 'Bộ nhớ lưu trữ cục bộ của trình duyệt', ''],
        ['MT', 'Mục tiêu kĩ thuật', 'Đánh số MT1–MT6'],
        ['NFR', 'Yêu cầu phi chức năng (Non-functional Requirement)', ''],
        ['OCR', 'Nhận dạng kí tự quang học (Optical Character Recognition)', ''],
        ['OMR', 'Nhận dạng dấu tô trên phiếu trả lời (Optical Mark Recognition)', ''],
        ['ORM', 'Ánh xạ quan hệ – đối tượng (Object–Relational Mapping)', ''],
        ['PWA', 'Ứng dụng web tiến bộ (Progressive Web App)', ''],
        ['RBAC', 'Phân quyền theo vai trò (Role-Based Access Control)', ''],
        ['RLS', 'Chính sách bảo mật ở mức hàng (Row Level Security)', ''],
        ['RPC', 'Lời gọi thủ tục từ xa (Remote Procedure Call)', ''],
        ['SGK', 'Sách giáo khoa', ''],
        ['SPA', 'Ứng dụng một trang (Single Page Application)', ''],
        ['SRS', 'Lặp lại ngắt quãng (Spaced Repetition System)', ''],
        ['THPT', 'Trung học phổ thông', ''],
        ['TT', 'Thời gian thực hiện', ''],
        ['UI/UX', 'Giao diện và trải nghiệm người dùng', ''],
        ['WASM', 'WebAssembly – mã nhị phân chạy trong trình duyệt', ''],
     ], [3.0, 8.6, 4.2]),
    ('p', 'Ngoài các từ viết tắt trên, báo cáo dùng một số kí hiệu sau: dấu «…» để đánh dấu vị trí cần chèn hình; cụm từ in nghiêng trong ngoặc vuông dạng [CẦN BỔ SUNG: …] để đánh dấu nội dung chưa có số liệu thật; các mã trong bảng được giữ nguyên như trong mã nguồn, ví dụ tên tệp, tên hàm, tên nhóm dữ liệu.'),
]

# ============================================================ PHẦN I
BLOCKS += [
    ('pagebreak',),
    ('h1c', 'LỜI CẢM ƠN'),
    ('p', 'Nhóm chúng em xin cảm ơn Ban Giám hiệu nhà trường đã tạo điều kiện về thời gian và không gian để nhóm hoàn thành dự án này, cảm ơn các thầy cô trong tổ bộ môn Hóa học đã dành thời gian đọc bản thảo, chỉ ra những chỗ trình bày chưa đúng cách của chương trình và góp ý về cách chia mức độ trong ma trận đề. Những góp ý đó đã thay đổi khá nhiều nội dung của sản phẩm, đặc biệt là phần lời giải và phần phân loại câu hỏi.'),
    ('p', 'Nhóm cũng xin cảm ơn các bạn trong câu lạc bộ tin học của trường đã thử sản phẩm ở giai đoạn đầu, chấp nhận dùng một trang web còn nhiều lỗi và ghi lại những chỗ khó hiểu. Nhiều lỗi trong báo cáo này được phát hiện từ những buổi thử đó, không phải từ việc nhóm tự kiểm tra.'),
    ('p', 'Cuối cùng, nhóm cảm ơn gia đình đã chấp nhận việc nhóm dành phần lớn buổi tối trong gần một tháng cho dự án.'),
    ('p', 'Dù đã cố gắng, báo cáo và sản phẩm vẫn còn những hạn chế đã được ghi rõ ở Phần III. Nhóm mong nhận được góp ý của hội đồng để tiếp tục hoàn thiện.'),
    ('spacer',),
    ('right', 'Nhóm tác giả', True),
    ('right', 'Nguyễn Thế Duy – Nguyễn Bùi Nguyệt Minh', False),
]

BLOCKS += [
    ('pagebreak',),
    ('h1c', 'CAM KẾT CỦA NHÓM TÁC GIẢ'),
    ('p', 'Nhóm chúng em cam kết những điều sau về báo cáo và sản phẩm đi kèm:'),
    ('numbered', 'Sản phẩm mô tả trong báo cáo là sản phẩm thật, chạy được tại địa chỉ đã nêu, không phải bản mô phỏng giao diện hay bản trình diễn dựng riêng cho báo cáo.'),
    ('numbered', 'Toàn bộ mã nguồn do hai thành viên trong nhóm viết, có lịch sử phiên bản làm bằng chứng. Những đoạn mã tham khảo từ tài liệu chính thức của thư viện đều được ghi nguồn trong phần chú thích của tệp.'),
    ('numbered', 'Các số liệu về khối lượng mã nguồn, số lần ghi nhận thay đổi và kết quả kiểm thử tự động được lấy trực tiếp từ kho mã nguồn và từ lần chạy ngày 24 tháng 10 năm 2026, không phải số ước lượng.'),
    ('numbered', 'Những nội dung chưa có số liệu thật được đánh dấu rõ bằng cụm từ in nghiêng trong ngoặc vuông, không được viết thành số liệu đã đo.'),
    ('numbered', 'Hình ảnh minh họa trong báo cáo là ảnh chụp từ chính sản phẩm, không dùng ảnh minh họa mua sẵn hoặc ảnh của sản phẩm khác.'),
    ('numbered', 'Báo cáo không chứa khóa truy cập, mật khẩu, mã bí mật hay thông tin tài khoản của bất kì cá nhân và tổ chức nào. Các đoạn mã trích dẫn đã được thay bằng giá trị mẫu.'),
    ('numbered', 'Nội dung Hóa học trong sản phẩm được đối chiếu với sách giáo khoa hiện hành và bảng tuần hoàn của IUPAC; phần nào chưa đối chiếu hết được ghi trong danh mục cần bổ sung.'),
    ('spacer',),
    ('right', 'Hưng Yên, ngày ...... tháng ...... năm 2026', False),
    ('right', 'Đại diện nhóm tác giả', True),
    ('right', '(Kí và ghi rõ họ tên)', False),
    ('spacer',),
    ('spacer',),
    ('right', 'Nguyễn Thế Duy', False),
]

BLOCKS += [
    ('pagebreak',),
    ('figlist', 'DANH MỤC HÌNH VẼ'),
    ('pagebreak',),
    ('tablist', 'DANH MỤC BẢNG BIỂU'),
]

BLOCKS += [
    ('pagebreak',),
    ('h1', 'PHẦN I. MỞ ĐẦU'),

    ('h2', '1. LÍ DO CHỌN DỰ ÁN'),
    ('h3', '1.1. Bối cảnh dạy và học Hóa học ở trường trung học phổ thông'),
    ('p', 'Hóa học ở bậc trung học phổ thông có một đặc điểm khác với nhiều môn học khác: phần lớn nội dung cốt lõi nói về những thứ không nhìn thấy được. Học sinh học về cấu tạo vỏ nguyên tử, về sự phân bố electron theo lớp và phân lớp, về hình dạng các orbital, về cách các orbital xen phủ nhau để tạo liên kết, về xu hướng nhường hoặc nhận electron của từng nguyên tố. Những khái niệm này chỉ tồn tại ở dạng mô hình và công thức; trong một tiết học bốn mươi lăm phút, giáo viên không đủ thời gian để giúp từng học sinh hình dung lại chúng.'),
    ('p', 'Cách học phổ biến hiện nay là ghi nhớ kết luận. Học sinh nhớ rằng kim loại kiềm hoạt động mạnh, nhớ rằng bán kính nguyên tử giảm dần trong một chu kì, nhớ công thức tính nồng độ, nhưng không giải thích được vì sao. Cách học này đủ để làm những bài quen thuộc nhưng rất dễ sụp đổ khi gặp bài biến đổi, vì học sinh không có điểm tựa để suy luận. Hệ quả là các em phải học lại nhiều lần, mỗi lần lại từ đầu, và dần hình thành thói quen học đối phó.'),
    ('p', 'Về phía giáo viên, công việc soạn đề kiểm tra là công việc lặp lại nhiều lần trong năm và chiếm nhiều thời gian. Một đề kiểm tra đúng yêu cầu phải bảo đảm bốn mức độ nhận thức, đúng số câu cho từng phần, đúng thang điểm, không trùng câu đã dùng, và phải có đáp án chi tiết. Khi soạn xong, giáo viên còn phải định dạng lại công thức, chỉnh lỗi font khi dán từ nhiều nguồn, rồi in và chấm. Trong chu trình đó, khâu phân tích lỗi sai của học sinh — khâu có giá trị sư phạm cao nhất — thường bị làm qua loa vì không còn thời gian.'),
    ('p', 'Bối cảnh chung cũng đang thay đổi. Chương trình Giáo dục phổ thông 2018 đặt trọng tâm vào phát triển năng lực, yêu cầu kiểm tra đánh giá theo bốn mức độ và khuyến khích học sinh tự học có hướng dẫn. Ngành giáo dục đẩy mạnh chuyển đổi số, và có định hướng tổ chức thi tốt nghiệp trung học phổ thông trên máy tính trong những năm tới. [CẦN BỔ SUNG: trích dẫn văn bản hoặc bài viết chính thức về lộ trình thi tốt nghiệp trên máy tính để làm căn cứ cho nhận định này.] Những thay đổi đó làm cho kĩ năng đọc đề, làm bài và nộp bài trên màn hình trở thành kĩ năng cần thiết, không còn là kĩ năng phụ.'),
    ('h3', '1.2. Những khoảng trống của các công cụ hiện có'),
    ('p', 'Trước khi bắt tay làm, nhóm chúng em dành thời gian dùng thử các công cụ mà học sinh và giáo viên đang dùng phổ biến, để xác định chỗ nào còn trống. Kết quả được tóm tắt trong bảng {tab:compare}. Cách đánh giá trong bảng dựa trên trải nghiệm trực tiếp của nhóm với các công cụ ở mức sử dụng miễn phí, không dựa trên tài liệu quảng cáo của nhà cung cấp.'),
    ('table', 'compare', 'Đối chiếu nhanh các nhóm công cụ mà học sinh và giáo viên đang dùng',
     ['Tiêu chí', 'Nền tảng giao bài và khảo thí phổ thông', 'Trợ lý AI phổ thông', 'ELEC AI'],
     [
        ['Hiển thị công thức Hóa học (chỉ số dưới, mũi tên phản ứng)', 'Hạn chế, thường phải nhập ảnh', 'Hiển thị được nhưng không thống nhất giữa các lần', 'Có, dùng kí tự Unicode thống nhất'],
        ['Tra cứu bảng tuần hoàn ngay khi làm bài', 'Không có', 'Không có', 'Có, kèm so sánh và hỏi AI'],
        ['Tính toán Hóa học có kiểm chứng', 'Không có', 'Mô hình tự tính, dễ sai số', 'Công cụ tính trước, có bước đối chiếu'],
        ['Đọc đề từ ảnh, PDF, Word', 'Một phần (nhập câu thủ công)', 'Đọc ảnh được nhưng không tạo đề', 'Có, tạo được đề trực tuyến'],
        ['Ma trận đề theo bốn mức độ', 'Không có, phải tự chia', 'Không có', 'Có, phần mềm dựng ma trận'],
        ['Sổ câu sai và lịch ôn cá nhân', 'Chỉ có thống kê điểm', 'Không có', 'Có, ôn theo từng câu'],
        ['Giám sát thi trực tuyến', 'Chỉ chặn chuyển tab ở mức cơ bản', 'Không có', 'Camera AI chạy trên thiết bị'],
        ['Dùng chung dữ liệu giữa phần học và phần dạy', 'Không có', 'Không có', 'Có, câu sai của học sinh về thẳng báo cáo của giáo viên'],
        ['Chi phí với học sinh', 'Miễn phí hoặc theo trường', 'Miễn phí có giới hạn', 'Miễn phí 100 lượt, sau đó theo gói'],
     ], [5.6, 4.4, 4.0, 4.0]),
    ('p', 'Bảng trên cho thấy ba khoảng trống lớn. Khoảng trống thứ nhất là đặc thù bộ môn: các nền tảng khảo thí phổ thông phục vụ mọi môn nên không xử lí tốt công thức, phương trình và bảng tuần hoàn. Khoảng trống thứ hai là độ tin cậy của trợ lý AI khi gặp bài toán: câu trả lời trôi nổi, không bám sát cách trình bày và đơn vị của sách giáo khoa Việt Nam, và hay sai ở bước tính cuối. Khoảng trống thứ ba là sự rời rạc: học sinh dùng một ứng dụng để hỏi bài, một ứng dụng để làm trắc nghiệm, một trang web để tra bảng tuần hoàn và một cuốn sổ để ghi câu sai; giáo viên dùng một nền tảng để giao bài và một phần mềm khác để soạn đề. Không có nơi nào nối các hoạt động đó lại với nhau.'),
    ('h3', '1.3. Định hướng của nhóm'),
    ('p', 'Từ ba khoảng trống trên, nhóm xác định ba định hướng. Thứ nhất, xây dựng một nền tảng chuyên biệt cho Hóa học, trong đó công thức, phương trình và bảng tuần hoàn là thành phần gốc chứ không phải phần thêm vào. Thứ hai, xử lí bài toán niềm tin với trợ lý AI bằng kiến trúc: để máy tính làm phần số, mô hình làm phần chữ, và luôn có bước đối chiếu. Thứ ba, nối phần tự học của học sinh với phần quản trị của giáo viên trong cùng một hệ dữ liệu, để dữ liệu học tập sinh ra trong lúc học có thể dùng lại cho việc giảng dạy.'),
    ('p', 'Nhóm cũng xác định rõ giới hạn của mình. Nhóm chỉ có hai thành viên, đang học lớp 10 và lớp 11, làm việc vào buổi tối và ngày cuối tuần. Vì vậy dự án không đặt mục tiêu thay thế các nền tảng lớn, mà đặt mục tiêu chứng minh một cách làm đúng ở phạm vi môn học, với một sản phẩm chạy thật, có thể kiểm tra được từng chức năng. Đây cũng là lí do nhóm chọn kiến trúc web hiện đại, không cần máy chủ riêng, để chi phí vận hành nằm trong khả năng của một nhóm học sinh.'),
    ('figure', 'overview', 'Sáu nhóm chức năng của nền tảng ELEC AI',
     'Vẽ sơ đồ tư duy sáu nhánh: (1) Trợ lý AI, (2) Bảng tuần hoàn và công cụ Hóa, (3) Ôn tập cá nhân, (4) Phòng thí nghiệm ảo và trò chơi, (5) Công cụ giáo viên, (6) Tài khoản và gói dịch vụ. Mỗi nhánh ghi 3–4 chức năng con.'),
    ('p', 'Sơ đồ ở hình {fig:overview} là bản đồ toàn bộ sản phẩm. Sáu nhánh này cũng là sáu nhóm được phân tích trong phần II, và mỗi nhánh tương ứng với một hoặc hai mục tiêu kĩ thuật ở mục 2.3.'),
]

BLOCKS += [
    ('h3', '1.4. Đối tượng, phạm vi và cách tiếp cận'),
    ('p', 'Đối tượng nghiên cứu của dự án là quá trình tự học Hóa học của học sinh trung học phổ thông và quá trình soạn, giao, chấm bài của giáo viên bộ môn. Phạm vi nghiên cứu được giới hạn ở ba khối lớp 10, 11, 12 theo chương trình hiện hành, với các chuyên đề nằm trong sách giáo khoa. Những nội dung nâng cao dành cho đội tuyển học sinh giỏi và nội dung luyện thi đại học chuyên sâu không thuộc phạm vi của phiên bản này.'),
    ('p', 'Cách tiếp cận của nhóm là tiếp cận theo sản phẩm: thay vì nghiên cứu một khía cạnh lí thuyết rồi mô tả, nhóm xây dựng một sản phẩm chạy được, dùng nó như đối tượng để kiểm chứng các giả thuyết, và ghi lại những gì học được trong quá trình làm. Cách tiếp cận này có ưu điểm là kết quả kiểm chứng được, nhưng có hạn chế là nhóm vừa là người làm vừa là người đánh giá, nên dễ thiên vị. Nhóm giảm thiên vị bằng ba cách: viết tiêu chí đánh giá trước khi làm, nhờ giáo viên rà soát nội dung, và giữ lại cả những kết quả không đạt trong báo cáo.'),
    ('p', 'Một giới hạn nữa cần nêu rõ: dự án không đặt mục tiêu chứng minh sản phẩm làm học sinh giỏi hơn. Để chứng minh điều đó cần một thử nghiệm có nhóm đối chứng, thời gian ít nhất một học kì và số mẫu đủ lớn; nhóm không có điều kiện làm việc đó trong 27 ngày. Vì vậy báo cáo chỉ kết luận về những gì đo được: chức năng có hoạt động, câu trả lời có đúng về mặt Hóa học, và hệ thống có đủ nhanh để dùng.'),
    ('h3', '1.5. Cấu trúc của báo cáo'),
    ('p', 'Báo cáo gồm ba phần chính, một danh mục tài liệu tham khảo và năm phụ lục. Cách tổ chức này bám theo mạch của một báo cáo nghiên cứu kĩ thuật: đặt vấn đề, trình bày cách làm, rồi kết luận.'),
    ('bullet', 'Phần I trả lời câu hỏi vì sao làm: bối cảnh, khoảng trống của các công cụ hiện có, giả thuyết, câu hỏi nghiên cứu, mục tiêu, phương pháp và kế hoạch.'),
    ('bullet', 'Phần II trả lời câu hỏi làm như thế nào: phân tích yêu cầu, kiến trúc, thiết kế giao diện, xây dựng mười một module, tích hợp và triển khai, công nghệ và chi phí, thử nghiệm và đánh giá.'),
    ('bullet', 'Phần III trả lời câu hỏi kết quả ra sao: đối chiếu từng mục tiêu, tính mới, tính sáng tạo, hạn chế và hướng phát triển.'),
    ('bullet', 'Phụ lục A đến E gồm danh mục hình ảnh cần chụp, ba kịch bản kiểm thử mẫu, hướng dẫn đọc mã nguồn, danh mục nội dung cần bổ sung và danh mục kiểm tra trước khi nộp.'),
    ('bullet', 'Phụ lục F đến K là tài liệu hỗ trợ: hướng dẫn sử dụng, bộ câu hỏi đánh giá, danh mục thông báo và cách xử lí, kịch bản kiểm thử mở rộng, sổ tay triển khai và bảng thuật ngữ.'),
    ('p', 'Người đọc chỉ muốn nắm nhanh kết quả có thể đọc phần tóm tắt ở đầu, sau đó đọc mục 1 của Phần III và bảng hạn chế. Người muốn kiểm tra phần kĩ thuật nên đọc mục 2 và mục 4 của Phần II, rồi mở mã nguồn theo hướng dẫn ở phụ lục C.'),
]
