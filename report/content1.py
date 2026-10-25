# -*- coding: utf-8 -*-
"""Nội dung: trang bìa, tóm tắt, PHẦN I."""

COVER = {
    'org1': 'CUỘC THI KHOA HỌC KĨ THUẬT TỈNH HƯNG YÊN',
    'org2': 'DÀNH CHO HỌC SINH TRUNG HỌC NĂM HỌC 2025 – 2026',
    'kind': 'BÁO CÁO DỰ ÁN NGHIÊN CỨU KHOA HỌC KĨ THUẬT',
    'label': 'TÊN DỰ ÁN:',
    'title': 'XÂY DỰNG NỀN TẢNG WEB ELEC AI HỖ TRỢ TỰ HỌC VÀ QUẢN LÝ LỚP HỌC MÔN HÓA HỌC Ở TRƯỜNG TRUNG HỌC PHỔ THÔNG',
    'field': 'Lĩnh vực dự thi: Tin học',
    'authors': [
        ('Nguyễn Thế Duy – Lớp 11A7', 'Trưởng nhóm'),
        ('Nguyễn Bùi Nguyệt Minh – Lớp 10A1', 'Thành viên'),
    ],
    'place': 'Hưng Yên, tháng 10 năm 2026',
}

BLOCKS = []

BLOCKS += [
    ('pagebreak',),
    ('h1c', 'TÓM TẮT DỰ ÁN'),
    ('p', 'ELEC AI là một nền tảng web phục vụ việc dạy và học môn Hóa học ở cấp trung học phổ thông. Nền tảng gồm hai nửa gắn với nhau trong cùng một tài khoản: phần dành cho học sinh (trợ lý AI giải bài theo từng bước, bảng tuần hoàn 118 nguyên tố, bộ công cụ tính toán Hóa học, quiz có lặp lại ngắt quãng, sổ câu sai, phòng thí nghiệm ảo và các trò chơi ôn tập) và phần dành cho giáo viên (tạo đề từ ảnh, PDF, Word; dựng ma trận đề theo bốn mức độ; quản lý lớp; tổ chức phòng thi trực tuyến có giám sát bằng camera).'),
    ('p', 'Điểm kĩ thuật trung tâm của dự án là cách tổ chức lớp trí tuệ nhân tạo. Thay vì để mô hình ngôn ngữ tự làm cả phần lập luận lẫn phần số học, nhóm tách hai việc ra: mô hình lo giải thích và trình bày, còn mọi phép tính (khối lượng mol, cân bằng phương trình, số mol, nồng độ, pH) do các công cụ viết bằng JavaScript tính trước rồi mới đưa vào câu lệnh gửi cho mô hình. Sau khi mô hình trả lời, hệ thống đối chiếu lại các con số với kết quả của công cụ. Cách làm này nhằm xử lí đúng điểm yếu phổ biến của các trợ lý AI khi gặp bài toán Hóa học nhiều bước.'),
    ('p', 'Bên cạnh đó, dự án xây dựng quy trình tạo đề có kiểm soát: phần mềm tự dựng khung ma trận theo số câu, mức độ và thang điểm, sau đó mới để AI đặt tên dạng bài và sinh câu hỏi cho từng ô của ma trận; đáp án được soát lại bằng một lượt giải độc lập. Phòng thi trực tuyến dùng thị giác máy tính chạy ngay trên thiết bị của thí sinh để phát hiện các dấu hiệu bất thường (không thấy khuôn mặt, có người thứ hai trong khung hình, quay mặt khỏi màn hình, có vật giống điện thoại), kèm theo việc ghi nhận sự kiện và ảnh bằng chứng.'),
    ('p', 'Sản phẩm đã được triển khai và chạy thật tại địa chỉ https://aitk-ten.vercel.app/. Mã nguồn gồm khoảng 104.400 dòng JavaScript/JSX và 262 tệp CSS; phần lõi trí tuệ nhân tạo có 9 tệp kiểm thử tự động với 118 ca kiểm thử. Ngày 24/10/2026, nhóm chạy lại toàn bộ bộ kiểm thử: 117 ca đạt, 1 ca không đạt (ca kiểm thử còn kì vọng 7 chế độ học trong khi mã hiện có 6 chế độ).'),
    ('p', 'Báo cáo trình bày lí do chọn đề tài, giả thuyết và mục tiêu kĩ thuật, quy trình thiết kế – xây dựng – thử nghiệm theo từng module, kết quả đạt được đối chiếu với từng mục tiêu, các hạn chế còn lại và hướng phát triển. Những nội dung chưa có số liệu thực nghiệm (kết quả khảo sát người dùng, thời gian tải đo trên thiết bị, độ chính xác của AI trên bộ đề chuẩn) được để trống có ghi chú rõ ràng để nhóm bổ sung trước khi nộp.'),
]

BLOCKS += [
    ('pagebreak',),
    ('toc', 'MỤC LỤC'),
    ('pagebreak',),
    ('h1c', 'DANH MỤC TỪ VIẾT TẮT'),
    ('table', 'Bảng 1. Danh mục từ viết tắt dùng trong báo cáo',
     ['Từ viết tắt', 'Nội dung đầy đủ'],
     [
        ['AI', 'Trí tuệ nhân tạo (Artificial Intelligence)'],
        ['API', 'Giao diện lập trình ứng dụng (Application Programming Interface)'],
        ['CT GDPT', 'Chương trình Giáo dục phổ thông'],
        ['CSS', 'Ngôn ngữ định kiểu trình bày (Cascading Style Sheets)'],
        ['HS', 'Học sinh'],
        ['GV', 'Giáo viên'],
        ['LLM', 'Mô hình ngôn ngữ lớn (Large Language Model)'],
        ['OMR', 'Nhận dạng dấu tô trên phiếu trả lời (Optical Mark Recognition)'],
        ['OCR', 'Nhận dạng kí tự quang học (Optical Character Recognition)'],
        ['PWA', 'Ứng dụng web tiến bộ (Progressive Web App)'],
        ['RLS', 'Chính sách bảo mật ở mức hàng (Row Level Security)'],
        ['SPA', 'Ứng dụng một trang (Single Page Application)'],
        ['SRS', 'Lặp lại ngắt quãng (Spaced Repetition System)'],
        ['THPT', 'Trung học phổ thông'],
        ['TT', 'Thời gian thực hiện'],
     ], [4.2, 11.0]),
]

# ============================ PHẦN I ============================
BLOCKS += [
    ('pagebreak',),
    ('h1', 'PHẦN I. MỞ ĐẦU'),

    ('h2', '1. LÍ DO CHỌN DỰ ÁN'),
    ('p', 'Hóa học ở bậc trung học phổ thông có một khó khăn riêng. Phần lớn nội dung của chương trình nói về những thứ không nhìn thấy được: cấu tạo vỏ nguyên tử, sự phân bố electron theo lớp và phân lớp, hình dạng orbital, cách các orbital xen phủ để tạo liên kết, xu hướng nhường hoặc nhận electron. Học sinh thường học các kết luận này bằng cách ghi nhớ, bởi trong một tiết học trên lớp không đủ thời gian để hình dung lại từng hiện tượng. Hệ quả là các em làm được bài quen nhưng không giải thích được vì sao, và rất dễ mất kiến thức gốc khi gặp bài biến đổi.'),
    ('p', 'Chương trình Giáo dục phổ thông 2018 đặt trọng tâm vào phát triển năng lực và yêu cầu kiểm tra, đánh giá theo bốn mức độ nhận thức (nhận biết, thông hiểu, vận dụng, vận dụng cao). Với giáo viên, việc dựng một đề kiểm tra đúng ma trận, đủ bốn mức độ và cân đối thang điểm là công việc lặp lại nhiều lần trong năm. Phần lớn thời gian bị dùng cho khâu soạn đề, định dạng lại công thức và chấm bài, trong khi thời gian dành cho việc phân tích lỗi sai của học sinh lại ít hơn.'),
    ('p', 'Trên thị trường đã có nhiều công cụ hỗ trợ, nhưng chưa công cụ nào giải quyết trọn vẹn hai phía của vấn đề. Các nền tảng giao bài và khảo thí phổ biến như Google Forms hay Azota phục vụ chung cho mọi môn nên không xử lí tốt đặc thù của Hóa học: chỉ số dưới trong công thức, mũi tên phản ứng, điều kiện phản ứng, cân bằng electron, bảng tuần hoàn tra cứu nhanh. Ở chiều ngược lại, các trợ lý AI phổ thông trả lời được nhiều câu hỏi nhưng câu trả lời trôi nổi, không bám sát cách trình bày và đơn vị của sách giáo khoa Việt Nam, lại hay sai ở khâu số học khi bài toán có nhiều bước. Những trợ lý đó cũng không có ngân hàng đề, không có lớp học, không có nơi lưu lại câu học sinh làm sai.'),
    ('p', 'Từ thực tế đó, nhóm chúng em chọn xây dựng một nền tảng riêng cho môn Hóa học, trong đó phần tự học của học sinh và phần quản trị của giáo viên dùng chung một hệ dữ liệu. Trong quá trình làm, nhóm nhận thấy một hướng kĩ thuật có thể giải quyết đúng điểm yếu của các trợ lý AI: để máy tính đảm nhận phần con số, còn mô hình ngôn ngữ đảm nhận phần giải thích. Đây cũng là nội dung được phân tích kĩ nhất trong báo cáo này.'),
    ('p', 'Dự án được thực hiện trong bối cảnh ngành giáo dục đang đẩy mạnh chuyển đổi số và định hướng tổ chức thi tốt nghiệp trung học phổ thông trên máy tính. Việc học sinh làm quen với việc đọc đề, làm bài và nộp bài trên màn hình vì thế không còn là kĩ năng phụ. [CẦN BỔ SUNG: trích dẫn văn bản hoặc bài viết chính thức về lộ trình thi tốt nghiệp trên máy tính để làm căn cứ cho nhận định này.]'),

    ('h2', '2. GIẢ THUYẾT KHOA HỌC, CÂU HỎI NGHIÊN CỨU, MỤC TIÊU KĨ THUẬT VÀ KẾT QUẢ MONG ĐỢI'),

    ('h3', '2.1. Giả thuyết khoa học'),
    ('p', 'Nhóm đặt ra ba giả thuyết có thể kiểm chứng được bằng thực nghiệm, không chỉ bằng lập luận:'),
    ('bullet', 'Giả thuyết H1: Nếu mọi phép tính Hóa học được tính trước bằng công cụ tất định và kết quả được đưa vào câu lệnh như dữ liệu bắt buộc, thì tỉ lệ sai số học trong câu trả lời của trợ lý AI sẽ giảm rõ rệt so với việc để mô hình tự tính.'),
    ('bullet', 'Giả thuyết H2: Nếu nội dung ôn tập được chia theo dạng bài, ghi lại câu làm sai và lên lịch ôn lại theo khoảng thời gian tăng dần, thì học sinh sẽ quay lại ôn đúng phần còn yếu thay vì làm lại toàn bộ đề.'),
    ('bullet', 'Giả thuyết H3: Nếu khung ma trận đề do phần mềm dựng trước (số câu, mức độ, thang điểm) và AI chỉ điền nội dung cho từng ô, thì đề tạo ra luôn khớp ma trận và không bị lệch số câu, kể cả khi yêu cầu thay đổi.'),
    ('p', 'Ba giả thuyết trên tương ứng với ba nhóm chức năng lớn nhất của sản phẩm, và mỗi giả thuyết đều có cách kiểm chứng riêng được trình bày ở mục 7 của Phần II.'),

    ('h3', '2.2. Câu hỏi nghiên cứu'),
    ('numbered', 'Làm thế nào để xây dựng một trợ lý AI bám sát chương trình Hóa học trung học phổ thông Việt Nam, trả lời đúng theo khối lớp và không mắc lỗi số học ở các bài toán nhiều bước?'),
    ('numbered', 'Cần tổ chức dữ liệu Hóa học (nguyên tố, hợp chất, phản ứng, công thức, chuyên đề) như thế nào để vừa dùng được cho giao diện tra cứu, vừa dùng được làm nguồn tri thức cho AI và làm nền cho các công cụ tính toán?'),
    ('numbered', 'Có thể tự động hóa khâu soạn đề theo ma trận bốn mức độ đến mức nào mà vẫn giữ được độ tin cậy của đáp án?'),
    ('numbered', 'Có thể dùng thị giác máy tính chạy trên trình duyệt để hỗ trợ giám sát phòng thi mà không phải truyền video của học sinh lên máy chủ hay không?'),
    ('numbered', 'Một nền tảng web một trang có đủ khả năng thay thế các công cụ rời rạc mà học sinh và giáo viên đang dùng, và những hạn chế nào là chấp nhận được ở phiên bản đầu?'),

    ('h3', '2.3. Mục tiêu kĩ thuật'),
    ('p', 'Sáu mục tiêu dưới đây được đánh số cố định. Mục 1 của Phần III sẽ đối chiếu lại đúng sáu mục tiêu này, không thêm và không bớt.'),
    ('mt', 'MT1', 'Xây dựng trợ lý AI Hóa học trả lời theo đúng khối lớp (10, 11, 12), đọc được đề bài từ ảnh chụp và hạn chế tối đa lỗi số học bằng cách tính trước mọi phép tính cần thiết.'),
    ('mt', 'MT2', 'Xây dựng bảng tuần hoàn tương tác đủ 118 nguyên tố, tra cứu được theo kí hiệu, tên, số hiệu và nhóm, kèm dữ liệu cấu hình electron và xu hướng tuần hoàn để dùng ngay trong lúc làm bài.'),
    ('mt', 'MT3', 'Xây dựng bộ công cụ tính toán Hóa học dùng chung một lõi thuật toán: cân bằng phương trình, khối lượng mol, số mol – nồng độ – pH, bài toán theo phương trình, tra cứu công thức.'),
    ('mt', 'MT4', 'Xây dựng hệ thống ôn tập cá nhân hóa: quiz nhiều chế độ, lặp lại ngắt quãng theo từng câu, sổ câu sai tự động và thống kê phần kiến thức còn yếu.'),
    ('mt', 'MT5', 'Xây dựng công cụ cho giáo viên: tạo đề từ ảnh, PDF, Word; dựng ma trận bốn mức độ; quản lý lớp; tổ chức phòng thi trực tuyến có giám sát bằng camera và chấm điểm tự động.'),
    ('mt', 'MT6', 'Trực quan hóa và trò chơi hóa nội dung Hóa học (phòng thí nghiệm ảo 2D/3D, các trò chơi ôn tập), đồng thời đưa hệ thống vận hành thật trên Internet dưới dạng ứng dụng web cài được lên màn hình chính.'),

    ('h3', '2.4. Kết quả mong đợi'),
    ('bullet', 'Một trợ lý AI trả lời được câu hỏi Hóa học lớp 10–12, giải được đề bài gửi dưới dạng ảnh, có hiển thị riêng phần suy luận và phần trả lời.'),
    ('bullet', 'Một bảng tuần hoàn đầy đủ 118 nguyên tố, có tìm kiếm, lọc theo nhóm, so sánh nguyên tố và tra cứu chi tiết từng nguyên tố.'),
    ('bullet', 'Các công cụ tính toán cho kết quả đúng ở các dạng bài thường gặp, có hiển thị cách tính để học sinh đối chiếu.'),
    ('bullet', 'Một vòng học khép kín: làm quiz, câu sai tự vào sổ, hệ thống nhắc ôn lại, thống kê chỉ ra chuyên đề còn yếu.'),
    ('bullet', 'Một quy trình giáo viên hoàn chỉnh: tạo đề, duyệt câu, giao cho lớp, học sinh làm bài, hệ thống chấm và trả kết quả, giáo viên xem phổ điểm.'),
    ('bullet', 'Sản phẩm chạy được trên trình duyệt máy tính và điện thoại, có địa chỉ truy cập công khai, có phân quyền học sinh – giáo viên – quản trị.'),

    ('h2', '3. PHƯƠNG PHÁP NGHIÊN CỨU'),
    ('h3', '3.1. Phương pháp nghiên cứu tài liệu'),
    ('p', 'Nhóm đọc sách giáo khoa Hóa học 10, 11, 12 và tài liệu hướng dẫn của Bộ Giáo dục và Đào tạo về cấu trúc đề kiểm tra theo bốn mức độ để xác định nội dung kiến thức, cách trình bày công thức và đơn vị. Song song, nhóm đọc tài liệu chính thức của các công nghệ sử dụng: React, Vite, Firebase, Supabase, MediaPipe, Tesseract.js, Three.js và đặc tả API của các nhà cung cấp mô hình ngôn ngữ. Nguyên tắc của nhóm là không dùng bài viết không rõ nguồn làm căn cứ kĩ thuật, và không dẫn công cụ AI như một tài liệu tham khảo.'),
    ('h3', '3.2. Phương pháp khảo sát nhu cầu'),
    ('p', 'Nhóm xây dựng một phiếu khảo sát ngắn cho hai nhóm đối tượng: học sinh (mức độ khó khi tự học Hóa, thói quen dùng điện thoại để học, mong muốn về công cụ) và giáo viên (thời gian soạn một đề kiểm tra, khó khăn khi dựng ma trận, cách chấm và tổng hợp kết quả hiện nay). Phiếu được trình bày đầy đủ ở mục 7.5. [CẦN BỔ SUNG: số phiếu phát ra, số phiếu thu về hợp lệ, đối tượng và thời gian khảo sát, kết quả tổng hợp.]'),
    ('h3', '3.3. Phương pháp phân tích và thiết kế hệ thống'),
    ('p', 'Từ kết quả khảo sát và yêu cầu của chương trình, nhóm lập danh sách yêu cầu chức năng và phi chức năng, sau đó thiết kế hệ thống theo hướng phân lớp: tầng giao diện, tầng nghiệp vụ chạy trên trình duyệt, tầng dịch vụ bên ngoài (xác thực, cơ sở dữ liệu, hàm đám mây, nhà cung cấp AI) và tầng dữ liệu. Việc phân lớp được chọn để phần lớn logic Hóa học và logic AI có thể kiểm thử độc lập, không phụ thuộc giao diện.'),
    ('h3', '3.4. Phương pháp phát triển phần mềm tăng dần'),
    ('p', 'Nhóm không làm theo kiểu viết xong toàn bộ rồi mới chạy thử. Mỗi vòng từ hai đến bốn ngày, nhóm chọn một nhóm chức năng, viết phần lõi trước, viết kiểm thử cho phần lõi, rồi mới ghép vào giao diện và thử trên trình duyệt thật. Cách làm này phù hợp với điều kiện của nhóm: hai thành viên, thời gian làm bài buổi tối, và sản phẩm phải luôn ở trạng thái chạy được để chụp ảnh, thử nghiệm và trình bày.'),
    ('h3', '3.5. Phương pháp kiểm thử và đánh giá'),
    ('p', 'Nhóm dùng ba lớp kiểm thử. Lớp thứ nhất là kiểm thử đơn vị tự động bằng Vitest cho các phần lõi (cân bằng phương trình, công cụ tính, truy xuất tri thức, phân loại tác vụ, bộ nhớ, luồng gọi AI có giả lập phản hồi). Lớp thứ hai là kiểm thử chức năng thủ công theo kịch bản, ghi lại kết quả mong đợi và kết quả thực tế. Lớp thứ ba là đo hiệu năng và khảo sát người dùng. Ba lớp này tương ứng với các mục 7.2, 7.3, 7.4 và 7.5 của báo cáo.'),

    ('h2', '4. KẾ HOẠCH NGHIÊN CỨU'),
    ('h3', '4.1. Thời gian thực hiện'),
    ('p', 'Dự án được thực hiện từ ngày 28/09/2026 đến ngày 24/10/2026. Các mốc trong bảng 2 được lấy từ lịch sử phiên bản của kho mã nguồn (73 lần ghi nhận thay đổi giữa ngày 28/09/2026 và 23/10/2026), không phải thời gian ước lượng.'),
    ('h3', '4.2. Các giai đoạn thực hiện'),
    ('table', 'Bảng 2. Các giai đoạn thực hiện dự án',
     ['Giai đoạn', 'Thời gian', 'Nội dung công việc chính', 'Kết quả dự kiến'],
     [
        ['1. Khảo sát và chốt phạm vi', '28/09 – 30/09/2026', 'Đọc sách giáo khoa và tài liệu; xác định sáu nhóm chức năng; dựng khung dự án React + Vite; cấu hình Firebase và Supabase', 'Khung dự án chạy được; danh sách yêu cầu sơ bộ'],
        ['2. Xây dựng lớp AI', '01/10 – 04/10/2026', 'Viết bộ định tuyến tác vụ, bộ ghép câu lệnh, lớp công cụ tính toán, chỉ mục tri thức, bộ nhớ, OCR dự phòng; viết kiểm thử cho phần lõi', 'Trợ lý AI chạy được từ đầu đến cuối; 9 tệp kiểm thử'],
        ['3. Học liệu và ôn tập', '08/10 – 12/10/2026', 'Nhập dữ liệu 118 nguyên tố, hợp chất, phản ứng, chuyên đề; bảng tuần hoàn; các công cụ tính; quiz, lặp lại ngắt quãng, sổ câu sai', 'Các module học tập hoạt động độc lập'],
        ['4. Công cụ giáo viên', '13/10 – 19/10/2026', 'Tạo đề từ ảnh, PDF, Word; ma trận bốn mức; quản lý lớp; phòng thi trực tuyến; giám sát camera; chấm phiếu A4', 'Luồng giao đề → làm bài → chấm → báo cáo chạy được'],
        ['5. Trực quan hóa và hoàn thiện', '18/10 – 22/10/2026', 'Phòng thí nghiệm 3D; các trò chơi; module phụ trợ (thống kê, ghi chú, thời khóa biểu, Clock Hub); PWA; tối ưu CSS', 'Bản chạy đầy đủ, triển khai trên Vercel'],
        ['6. Kiểm thử, sửa lỗi, viết báo cáo', '21/10 – 24/10/2026', 'Chạy lại bộ kiểm thử tự động; sửa lỗi hiển thị trên iOS; siết quy tắc bảo mật Firestore; viết và hoàn thiện báo cáo', 'Sản phẩm và báo cáo hoàn chỉnh để nộp'],
     ], [3.4, 3.0, 6.6, 4.2]),

    ('h3', '4.3. Phân công nhiệm vụ'),
    ('p', 'Nhóm gồm hai thành viên, phân công theo thế mạnh và theo tính chất công việc:'),
    ('bullet', 'Nguyễn Thế Duy (nhóm trưởng, lớp 11A7): thiết kế kiến trúc hệ thống và mô hình dữ liệu; xây dựng lớp AI (định tuyến tác vụ, ghép câu lệnh, công cụ tính toán, chỉ mục tri thức, bộ nhớ, OCR dự phòng); viết các module giáo viên (tạo đề, ma trận, lớp học, phòng thi, giám sát); cấu hình bảo mật, triển khai và vận hành; viết phần kĩ thuật của báo cáo.'),
    ('bullet', 'Nguyễn Bùi Nguyệt Minh (lớp 10A1): tổng hợp và rà soát nội dung kiến thức Hóa học (dữ liệu nguyên tố, hợp chất, phản ứng, chuyên đề, ngân hàng câu hỏi); kiểm tra tính đúng đắn của lời giải mẫu và đáp án; xây dựng nội dung truyền thông, trang giới thiệu và tài liệu hướng dẫn sử dụng; tham gia kiểm thử chức năng và ghi nhận lỗi.'),
    ('p', 'Ngoài hai thành viên, nhóm nhận được góp ý chuyên môn từ giáo viên tổ Hóa học của trường trong khâu rà soát nội dung và cách trình bày lời giải.'),
]
