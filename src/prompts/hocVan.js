
export const HOC_VAN = [
  {
    id: 'van-01',
    cat: 'van',
    title: 'Phân tích nhân vật văn học',
    desc: 'Phân tích nhân vật theo 5 khía cạnh, có dẫn chứng cụ thể và đánh giá nghệ thuật.',
    tags: ['phân tích', 'văn học', 'chi tiết'],
    prompt: `Bạn là giáo viên Ngữ văn hướng dẫn học sinh {{lớp}} phân tích nhân vật văn học.

NHÂN VẬT: "{{nhân vật}}"
TÁC PHẨM: "{{tác phẩm}}"

YÊU CẦU:

1. GIỚI THIỆU CHUNG
   - Tác giả, tác phẩm, hoàn cảnh sáng tác.
   - Vị trí nhân vật trong tác phẩm.

2. NGOẠI HÌNH VÀ LAI LỊCH
   - Đặc điểm ngoại hình (nếu có).
   - Xuất thân, hoàn cảnh sống.

3. TÍNH CÁCH VÀ PHẨM CHẤT
   - 3-5 nét tính cách chính.
   - Mỗi nét có dẫn chứng cụ thể từ tác phẩm.

4. SỐ PHẬN VÀ BI KỊCH
   - Cuộc đời nhân vật trải qua những gì?
   - Bi kịch hoặc niềm vui.

5. NGHỆ THUẬT XÂY DỰNG NHÂN VẬT
   - Cách miêu tả ngoại hình.
   - Cách khắc họa nội tâm.
   - Ngôn ngữ, hành động.

6. ĐÁNH GIÁ CHUNG
   - Ý nghĩa nhân vật với tác phẩm.
   - Tư tưởng tác giả muốn gửi gắm.

ĐỊNH DẠNG:
- Có dẫn chứng cụ thể (trích dẫn ngắn).
- Đánh số phần rõ ràng.`,
    sample: 'Chí Phèo là nhân vật điển hình cho bi kịch tha hóa của người nông dân Việt Nam trước Cách mạng tháng Tám. Từ một người lương thiện, Chí bị nhà tù thực dân và xã hội làng Vũ Đại biến thành con quỷ dữ…',
    long: true,
  },
  {
    id: 'van-02',
    cat: 'van',
    title: 'Viết đoạn văn nghị luận xã hội 200 chữ',
    desc: 'Nghị luận xã hội có mở – thân – kết trong 200 chữ. Có dẫn chứng và liên hệ bản thân.',
    tags: ['nghị luận', 'chi tiết'],
    prompt: `Bạn là giáo viên Ngữ văn hướng dẫn học sinh {{lớp}} viết đoạn nghị luận xã hội 200 chữ.

CHỦ ĐỀ: "{{chủ đề}}"

YÊU CẦU:

1. MỞ ĐOẠN (30-40 chữ)
   - Dẫn dắt tự nhiên từ đời sống.
   - Nêu vấn đề nghị luận rõ ràng.

2. THÂN ĐOẠN (120-140 chữ)
   - Giải thích khái niệm / vấn đề.
   - Nêu biểu hiện cụ thể (2-3 ví dụ).
   - Phân tích ý nghĩa, vai trò.
   - Dẫn chứng thực tế (1-2 tấm gương).
   - Phản biện: phê phán hiện tượng trái ngược.

3. KẾT ĐOẠN (30-40 chữ)
   - Khẳng định lại vấn đề.
   - Liên hệ bản thân.

4. YÊU CẦU CHUNG
   - Đúng 200 chữ (không dài hơn 220).
   - Không dùng từ ngữ sáo rỗng.
   - Có câu chuyển ý giữa các phần.

ĐỊNH DẠNG:
- Viết liền mạch, không xuống dòng.
- Đếm số chữ cuối bài.`,
    long: true,
  },
  {
    id: 'van-03',
    cat: 'van',
    title: 'Lập dàn ý bài văn nghị luận',
    desc: 'Dàn ý có luận điểm, dẫn chứng và phản biện. Có mở bài và kết bài nháp.',
    tags: ['dàn ý', 'chi tiết'],
    prompt: `Lập dàn ý bài nghị luận cho học sinh {{lớp}}.

ĐỀ BÀI: "{{đề bài}}"

YÊU CẦU:

1. LUẬN ĐIỂM TRUNG TÂM
   - 1 câu nêu rõ quan điểm.
   - Có thể gây tranh luận.

2. 3-4 Ý CHÍNH
   Với mỗi ý:
   - Tên ý (1 câu).
   - Giải thích ngắn (2-3 câu).
   - Dẫn chứng gợi ý (1-2 ví dụ).
   - Kết nối với luận điểm trung tâm.

3. MỞ BÀI (viết nháp 3-4 câu)

4. KẾT BÀI (viết nháp 3-4 câu)

5. PHẢN BIỆN
   - 1 quan điểm trái chiều.
   - Cách phản hồi.

6. GỢI Ý TỪ NGỮ
   - 5-7 từ/cụm từ nên dùng.
   - 3 từ/cụm từ nên tránh.

ĐỊNH DẠNG:
- Đánh số rõ ràng.
- Dàn ý dạng bullet.`,
    long: true,
  },
  {
    id: 'van-04',
    cat: 'van',
    title: 'Viết mở bài theo 5 cách',
    desc: '5 kiểu mở bài khác nhau: trực tiếp, gián tiếp, phản đề, so sánh, đặt câu hỏi.',
    tags: ['mở bài', 'chi tiết'],
    prompt: `Viết 5 mở bài cho đề bài:

"{{đề bài}}"

YÊU CẦU: 5 cách khác nhau.

1. MỞ BÀI TRỰC TIẾP
   - Đi thẳng vào vấn đề.
   - Ngắn gọn 2-3 câu.

2. MỞ BÀI GIÁN TIẾP
   - Dẫn dắt từ vấn đề liên quan.

3. MỞ BÀI PHẢN ĐỀ
   - Nêu quan điểm trái ngược trước.

4. MỞ BÀI SO SÁNH
   - So sánh 2 ý kiến / tác phẩm.

5. MỞ BÀI ĐẶT CÂU HỎI
   - Đặt 1-2 câu hỏi gợi mở.

ĐÁNH GIÁ:
- Mỗi mở bài nêu ưu, nhược điểm.
- Cách nào phù hợp đề này nhất, vì sao.

ĐỊNH DẠNG:
- Mỗi mở bài 3-5 câu.`,
    long: true,
  },
  {
    id: 'van-05',
    cat: 'van',
    title: 'Tóm tắt tác phẩm văn học',
    desc: 'Tóm tắt tác phẩm theo bố cục, có nhân vật và sự kiện chính.',
    tags: ['tóm tắt', 'chi tiết'],
    prompt: `Tóm tắt tác phẩm "{{tác phẩm}}" của {{tác giả}}.

YÊU CẦU:

1. THÔNG TIN CHUNG
   - Thể loại, hoàn cảnh sáng tác.
   - Chủ đề chính.

2. TÓM TẮT CỐT TRUYỆN (300-400 từ)
   - Bố cục: mở đầu, diễn biến, kết thúc.
   - Nhân vật chính và sự kiện quan trọng.

3. NHÂN VẬT CHÍNH
   - 2-3 nhân vật tiêu biểu.
   - Vai trò trong tác phẩm.

4. GIÁ TRỊ NỘI DUNG VÀ NGHỆ THUẬT
   - Tư tưởng chủ đạo.
   - Nét đặc sắc nghệ thuật.

5. CÂU HỎI ÔN TẬP
   - 3-5 câu hỏi gợi mở.

ĐỊNH DẠNG:
- Không quá 500 từ.`,
    long: true,
  },
  {
    id: 'van-06',
    cat: 'van',
    title: 'Phân tích bài thơ / đoạn thơ',
    desc: 'Phân tích nội dung, nghệ thuật, cảm xúc chủ đạo của bài thơ.',
    tags: ['thơ', 'chi tiết'],
    prompt: `Phân tích bài thơ / đoạn thơ:

"{{bài thơ}}"

CỦA TÁC GIẢ: {{tác giả}}

YÊU CẦU:

1. GIỚI THIỆU
   - Tác giả, hoàn cảnh sáng tác.
   - Vị trí đoạn thơ trong bài.

2. NỘI DUNG
   - Phân tích từng câu / từng khổ.
   - Hình ảnh, biểu tượng.
   - Cảm xúc chủ đạo.

3. NGHỆ THUẬT
   - Thể thơ, nhịp điệu.
   - Biện pháp tu từ (ẩn dụ, so sánh, nhân hóa…).
   - Ngôn ngữ, hình ảnh.

4. ĐÁNH GIÁ CHUNG
   - Giá trị nội dung và nghệ thuật.
   - Đóng góp của tác giả.

ĐỊNH DẠNG:
- Trích dẫn thơ cụ thể.
- Đánh số phần rõ ràng.`,
    long: true,
  },
  {
    id: 'van-07',
    cat: 'van',
    title: 'So sánh 2 tác phẩm văn học',
    desc: 'So sánh điểm giống và khác giữa 2 tác phẩm cùng chủ đề.',
    tags: ['so sánh', 'chi tiết'],
    prompt: `So sánh 2 tác phẩm văn học:

TÁC PHẨM A: "{{tác phẩm A}}" của {{tác giả A}}
TÁC PHẨM B: "{{tác phẩm B}}" của {{tác giả B}}

YÊU CẦU:

1. ĐIỂM GIỐNG
   - Chủ đề.
   - Nhân vật / hình tượng.
   - Nghệ thuật.

2. ĐIỂM KHÁC
   - Bối cảnh sáng tác.
   - Cách xây dựng nhân vật.
   - Ngôn ngữ, giọng điệu.

3. BẢNG SO SÁNH
   | Tiêu chí | Tác phẩm A | Tác phẩm B |

4. NHẬN XÉT
   - Vì sao có sự khác biệt?
   - Giá trị riêng của mỗi tác phẩm.

5. KẾT LUẬN

ĐỊNH DẠNG:
- Bảng dùng ký tự | và -.`,
    long: true,
  },
  {
    id: 'van-08',
    cat: 'van',
    title: 'Viết kết bài theo 3 cách',
    desc: '3 kiểu kết bài: tóm tắt, mở rộng, liên hệ bản thân.',
    tags: ['kết bài', 'chi tiết'],
    prompt: `Viết 3 kết bài cho đề bài:

"{{đề bài}}"

YÊU CẦU: 3 cách khác nhau.

1. KẾT BÀI TÓM TẮT
   - Khẳng định lại vấn đề.
   - Ngắn gọn 2-3 câu.

2. KẾT BÀI MỞ RỘNG
   - Mở rộng vấn đề sang khía cạnh khác.
   - Đặt vấn đề cho tương lai.

3. KẾT BÀI LIÊN HỆ BẢN THÂN
   - Bài học rút ra.
   - Hành động cụ thể.

ĐÁNH GIÁ:
- Mỗi kết bài 3-5 câu.
- Cách nào phù hợp đề này nhất.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'van-09',
    cat: 'van',
    title: 'Chuyển đoạn văn thành bullet',
    desc: 'Chuyển đoạn văn dài thành bullet ngắn gọn, giữ đủ ý.',
    tags: ['biên tập', 'chi tiết'],
    prompt: `Chuyển đoạn văn sau thành bullet:

{{đoạn văn}}

YÊU CẦU:

1. PHÂN TÍCH ĐOẠN GỐC
   - Xác định các ý chính (3-7 ý).
   - Đánh dấu từ khóa.

2. CHUYỂN THÀNH BULLET
   - Mỗi bullet 1 ý.
   - Mỗi bullet dưới 15 từ.
   - Dùng từ khóa ở đầu bullet.

3. CẤU TRÚC
   - Sắp xếp theo thứ tự logic.
   - Nhóm các ý liên quan.

4. SO SÁNH
   - Đoạn văn gốc: ưu điểm?
   - Bullet: ưu điểm?
   - Khi nào dùng cái nào?

ĐỊNH DẠNG:
- Bullet dùng dấu - hoặc •.`,
    long: true,
  },
  {
    id: 'van-10',
    cat: 'van',
    title: 'Phân tích tình huống truyện',
    desc: 'Phân tích tình huống truyện, vai trò và nghệ thuật xây dựng tình huống.',
    tags: ['truyện', 'chi tiết'],
    prompt: `Phân tích tình huống truyện trong tác phẩm:

"{{tác phẩm}}" của {{tác giả}}

YÊU CẦU:

1. KHÁI NIỆM TÌNH HUỐNG TRUYỆN
2. MÔ TẢ TÌNH HUỐNG CHÍNH
   - Diễn biến cụ thể.
   - Các nhân vật tham gia.
3. VAI TRÒ CỦA TÌNH HUỐNG
   - Bộc lộ tính cách nhân vật.
   - Thể hiện tư tưởng tác giả.
   - Tạo kịch tính.
4. NGHỆ THUẬT XÂY DỰNG
5. ĐÁNH GIÁ

ĐỊNH DẠNG:
- Trích dẫn cụ thể.`,
    long: true,
  },
  {
    id: 'van-11',
    cat: 'van',
    title: 'Viết đoạn văn cảm nhận',
    desc: 'Đoạn văn cảm nhận về nhân vật, chi tiết, hoặc câu thơ.',
    tags: ['cảm nhận', 'chi tiết'],
    prompt: `Viết đoạn văn cảm nhận về:

{{đối tượng}} trong tác phẩm "{{tác phẩm}}"

YÊU CẦU:

1. MỞ ĐOẠN (1-2 câu)
   - Giới thiệu đối tượng.
2. THÂN ĐOẠN (8-12 câu)
   - Cảm nhận chi tiết (hình ảnh, ngôn ngữ, hành động).
   - Trích dẫn cụ thể.
   - Cảm xúc cá nhân.
3. KẾT ĐOẠN (1-2 câu)
   - Khẳng định giá trị.

ĐỘ DÀI: 150-200 từ.

ĐỊNH DẠNG:
- Viết liền mạch.`,
    long: true,
  },
  {
    id: 'van-12',
    cat: 'van',
    title: 'Ôn tập Ngữ văn theo chuyên đề',
    desc: 'Tổng hợp kiến thức theo chuyên đề: thơ, truyện, kịch, nghị luận.',
    tags: ['ôn tập', 'chi tiết'],
    prompt: `Ôn tập chuyên đề Ngữ văn: "{{chuyên đề}}" cho học sinh {{lớp}}.

YÊU CẦU:

1. KIẾN THỨC TRỌNG TÂM
2. CÁC TÁC PHẨM TIÊU BIỂU
3. DẠNG ĐỀ THƯỜNG GẶP
4. PHƯƠNG PHÁP LÀM BÀI
5. BÀI TẬP MẪU (có dàn ý)
6. LỜI KHUYÊN

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'van-13',
    cat: 'van',
    title: 'Phân tích biện pháp tu từ',
    desc: 'Phân tích các biện pháp tu từ trong đoạn thơ, đoạn văn.',
    tags: ['tu từ', 'chi tiết'],
    prompt: `Phân tích biện pháp tu từ trong đoạn trích:

"{{đoạn trích}}"

YÊU CẦU:

1. LIỆT KÊ BIỆN PHÁP TU TỪ
   - So sánh, ẩn dụ, nhân hóa, hoán dụ, điệp từ…
2. PHÂN TÍCH TỪNG BIỆN PHÁP
   - Chỉ ra dấu hiệu.
   - Tác dụng.
   - Giá trị biểu đạt.
3. ĐÁNH GIÁ CHUNG
   - Hiệu quả nghệ thuật.
   - Góp phần thể hiện nội dung.

ĐỊNH DẠNG:
- Trích dẫn cụ thể.`,
    long: true,
  },
  {
    id: 'van-14',
    cat: 'van',
    title: 'Viết đoạn văn liên hệ thực tế',
    desc: 'Đoạn văn liên hệ tác phẩm với thực tế đời sống.',
    tags: ['liên hệ', 'chi tiết'],
    prompt: `Viết đoạn văn liên hệ thực tế từ tác phẩm:

"{{tác phẩm}}" của {{tác giả}}

YÊU CẦU:

1. TÓM TẮT Ý CHÍNH CỦA TÁC PHẨM (1-2 câu)
2. LIÊN HỆ THỰC TẾ
   - Bài học về đạo đức, lối sống.
   - Vấn đề xã hội hiện nay.
3. DẪN CHỨNG THỰC TẾ
   - 1-2 ví dụ cụ thể.
4. BÀI HỌC BẢN THÂN

ĐỘ DÀI: 150-200 từ.

ĐỊNH DẠNG:
- Viết liền mạch.`,
    long: true,
  },
  {
    id: 'van-15',
    cat: 'van',
    title: 'Tổng hợp kiến thức Ngữ văn 10',
    desc: 'Tổng hợp tác phẩm, tác giả trọng tâm lớp 10.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp kiến thức Ngữ văn 10.

YÊU CẦU:

1. VĂN HỌC DÂN GIAN
2. VĂN HỌC TRUNG ĐẠI
3. VĂN HỌC HIỆN ĐẠI
4. TÁC PHẨM TRỌNG TÂM
   - Tên tác phẩm, tác giả, thể loại.
   - Nội dung chính.
   - Nét đặc sắc nghệ thuật.
5. DẠNG ĐỀ THƯỜNG GẶP

ĐỊNH DẠNG:
- Bảng tóm tắt.`,
    long: true,
  },
  {
    id: 'van-16',
    cat: 'van',
    title: 'Tổng hợp kiến thức Ngữ văn 11',
    desc: 'Tổng hợp tác phẩm, tác giả trọng tâm lớp 11.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp kiến thức Ngữ văn 11.

YÊU CẦU:

1. VĂN HỌC TRUNG ĐẠI
2. VĂN HỌC HIỆN ĐẠI (1945-1975)
3. VĂN HỌC NƯỚC NGOÀI
4. TÁC PHẨM TRỌNG TÂM
5. DẠNG ĐỀ THƯỜNG GẶP

ĐỊNH DẠNG:
- Bảng tóm tắt.`,
    long: true,
  },
  {
    id: 'van-17',
    cat: 'van',
    title: 'Tổng hợp kiến thức Ngữ văn 12',
    desc: 'Tổng hợp tác phẩm, tác giả trọng tâm lớp 12.',
    tags: ['tổng hợp', 'chi tiết'],
    prompt: `Tổng hợp kiến thức Ngữ văn 12.

YÊU CẦU:

1. THƠ
2. TRUYỆN NGẮN, TRUYỆN KÝ
3. KỊCH
4. NGHỊ LUẬN VĂN HỌC
5. TÁC PHẨM TRỌNG TÂM
6. DẠNG ĐỀ THƯỜNG GẶP

ĐỊNH DẠNG:
- Bảng tóm tắt.`,
    long: true,
  },
  {
    id: 'van-18',
    cat: 'van',
    title: 'Hướng dẫn giải đề thi THPT Ngữ văn',
    desc: 'Chiến lược làm bài, phân bổ thời gian, giải mẫu.',
    tags: ['luyện thi', 'chi tiết'],
    prompt: `Hướng dẫn giải đề thi THPT Quốc gia môn Ngữ văn.

ĐỀ THI:
{{đề thi}}

YÊU CẦU:
1. Phân tích cấu trúc đề (đọc hiểu, nghị luận xã hội, nghị luận văn học).
2. Phân bổ thời gian.
3. Chiến lược làm bài từng phần.
4. Giải mẫu phần đọc hiểu.
5. Dàn ý phần nghị luận.
6. Lời khuyên phòng thi.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
  {
    id: 'van-19',
    cat: 'van',
    title: 'Sửa lỗi chính tả và ngữ pháp',
    desc: 'Chỉ ra lỗi, giải thích và sửa. Có bảng lỗi thường gặp.',
    tags: ['sửa lỗi', 'chi tiết'],
    prompt: `Sửa lỗi chính tả và ngữ pháp cho văn bản:

{{văn bản}}

YÊU CẦU:

1. LIỆT KÊ LỖI
   | STT | Lỗi | Loại | Sửa lại | Giải thích |

2. PHÂN TÍCH TỪNG LỖI
   - Vì sao sai?
   - Quy tắc nào bị vi phạm?
   - Cách tránh.

3. BẢN ĐÃ SỬA
   - Viết lại toàn bộ văn bản không lỗi.
   - Đánh dấu chỗ đã sửa (in đậm).

4. LỖI PHỔ BIẾN
   - 5 lỗi tiếng Việt phổ biến.
   - Cách nhớ để tránh.

ĐỊNH DẠNG:
- Bảng rõ ràng.`,
    long: true,
  },
  {
    id: 'van-20',
    cat: 'van',
    title: 'Sinh đề tự luyện Ngữ văn theo dạng',
    desc: 'AI sinh đề tự luyện theo dạng bài bạn chọn, có gợi ý và dàn ý.',
    tags: ['tự luyện', 'chi tiết'],
    prompt: `Sinh đề tự luyện Ngữ văn cho học sinh {{lớp}}.

DẠNG BÀI: {{dạng bài}}
SỐ ĐỀ: {{số đề}}
ĐỘ KHÓ: {{độ khó}}

YÊU CẦU:
1. Chia độ khó (40% dễ, 40% trung bình, 20% nâng cao).
2. Mỗi đề có:
   - Đề bài rõ ràng.
   - Gợi ý cách làm (không đưa bài mẫu).
   - Dàn ý sơ lược.
3. Đa dạng, không trùng.
4. Lời khuyên luyện tập.

ĐỊNH DẠNG:
- Đánh số rõ ràng.`,
    long: true,
  },
];