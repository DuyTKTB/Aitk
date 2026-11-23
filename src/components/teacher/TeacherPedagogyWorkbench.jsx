import { useMemo, useState } from 'react';
import { getSubjectExamProfile } from '../../lib/subjects.js';

/* ============================================================
   TeacherPedagogyWorkbench.jsx — BÀN LÀM VIỆC AI GIÁO VIÊN CHUẨN BỘ GD&ĐT
   ------------------------------------------------------------
   Bám sát hệ thống văn bản Bộ GD&ĐT hiện hành:
     1. Kế hoạch bài dạy (Giáo án 5 hoạt động chuẩn Công văn 5512)
     2. Ma trận & Bản đặc tả Đề kiểm tra chuẩn Công văn 7991 + QĐ 764/QĐ-BGDĐT 2025
     3. Nhận xét Học bạ & Sổ điểm chuẩn Thông tư 22/2021/TT-BGDĐT
     4. Hỗ trợ đầy đủ các môn học GDPT 2018 & Xuất trực tiếp tệp Word (.doc).
   ============================================================ */

const SUBJECT_TOPICS = {
  'Toán học 12': [
    'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
    'Chương 2: Vectơ và hệ trục tọa độ trong không gian Oxyz',
    'Chương 3: Các số đặc trưng đo mức độ phân tán cho mẫu số liệu ghép nhóm',
    'Chương 4: Nguyên hàm – Tích phân và Ứng dụng hình học',
    'Chương 5: Phương pháp tọa độ trong không gian (Mặt phẳng, Đường thẳng, Mặt cầu)',
    'Chương 6: Xác suất có điều kiện & Công thức Bayes',
  ],
  'Ngữ văn 12': [
    'Chủ đề 1: Thơ trữ tình hiện đại & Phong cách tác giả',
    'Chủ đề 2: Truyện ngắn & Tiểu thuyết hiện đại (Ngôi kể, điểm nhìn)',
    'Chủ đề 3: Kí – Phóng sự & Hồi kí',
    'Chủ đề 4: Nghị luận xã hội (~200 chữ & ~600 chữ)',
    'Chủ đề 5: Nghị luận văn học & So sánh, đánh giá tác phẩm',
  ],
  'Tiếng Anh 12': [
    'Unit 1–2: Life stories & A multicultural world',
    'Unit 3–4: Green living & Urbanisation',
    'Unit 5–6: The world of work & Artificial Intelligence',
    'Unit 7–8: The world of mass media & Wildlife conservation',
    'Reading Comprehension, Cloze & Arrangement (QĐ 764/QĐ-BGDĐT)',
  ],
  'Vật lí 12': [
    'Chương 1: Vật lí Nhiệt (Nội năng, Định luật I Nhiệt động lực học, Nhiệt dung riêng)',
    'Chương 2: Khí lí tưởng (Định luật Boyle, Charles, Phương trình trạng thái pV = nRT)',
    'Chương 3: Từ trường (Lực từ, Cảm ứng từ, Từ thông, Cảm ứng điện từ, Dòng điện xoay chiều)',
    'Chương 4: Vật lí Hạt nhân (Độ hụt khối, Năng lượng liên kết, Phóng xạ, Phản ứng hạt nhân)',
  ],
  'Hóa học 12': [
    'Chương 1: Ester – Lipid & Xà phòng, Chất giặt rửa',
    'Chương 2: Carbohydrate (Glucose, Fructose, Saccharose, Tinh bột, Cellulose)',
    'Chương 3: Hợp chất chứa Nitrogen (Amine, Amino acid, Peptide, Protein)',
    'Chương 4: Polymer & Vật liệu Polymer',
    'Chương 5: Pin điện và Điện phân (Thế điện cực chuẩn, Pin Galvani)',
    'Chương 6: Đại cương về Kim loại & Tách kim loại, Hợp kim',
    'Chương 7: Nguyên tố nhóm IA và nhóm IIA (Nước cứng)',
    'Chương 8: Sơ lược về Dãy kim loại chuyển tiếp thứ nhất và Phức chất',
  ],
  'Sinh học 12': [
    'Chương 1: Di truyền phân tử (Tái bản DNA, Phiên mã, Dịch mã, Điều hòa Operon Lac, Đột biến gene)',
    'Chương 2: Di truyền nhiễm sắc thể (Quy luật Mendel, Liên kết gene & Hoán vị gene, Di truyền giới tính)',
    'Chương 3: Mở rộng học thuyết di truyền (Tương tác gene, Di truyền ngoài nhân)',
    'Chương 4: Di truyền quần thể (Định luật Hardy – Weinberg) & Di truyền học người',
    'Chương 5: Bằng chứng và Cơ chế Tiến hóa (Học thuyết Darwin & Tiến hóa tổng hợp hiện đại)',
    'Chương 6: Sinh thái học & Môi trường (Quần thể, Quần xã, Hệ sinh thái)',
  ],
  'Lịch sử 12': [
    'Chủ đề 1: Thế giới trong và sau Chiến tranh lạnh',
    'Chủ đề 2: ASEAN – Những chặng đường lịch sử',
    'Chủ đề 3: Cách mạng tháng Tám 1945 & Chiến tranh bảo vệ Tổ quốc (1945–1975)',
    'Chủ đề 4: Công cuộc Đổi mới ở Việt Nam từ năm 1986 đến nay',
    'Chủ đề 5: Lịch sử đối ngoại Việt Nam & Chủ tịch Hồ Chí Minh',
  ],
  'Địa lí 12': [
    'Phần 1: Địa lí tự nhiên (Vị trí địa lí, Khí hậu, Địa hình, Tài nguyên & Thiên tai)',
    'Phần 2: Địa lí dân cư & Chuyển dịch cơ cấu kinh tế',
    'Phần 3: Địa lí các ngành kinh tế (Nông nghiệp, Công nghiệp, Dịch vụ)',
    'Phần 4: Địa lí các vùng kinh tế – xã hội & Xử lí bảng số liệu',
  ],
  'GDKT&PL 12': [
    'Phần Giáo dục Kinh tế: Tăng trưởng, Phát triển kinh tế & Hội nhập quốc tế',
    'Quản lí thu chi, Bảo hiểm, An sinh xã hội & Doanh nghiệp',
    'Phần Giáo dục Pháp luật: Quyền bình đẳng, Quyền dân chủ & Quyền sở hữu tài sản',
    'Pháp luật quốc tế & Nghĩa vụ bảo vệ Tổ quốc',
  ],
  'Tin học 12': [
    'Chủ đề A–B: Trí tuệ nhân tạo (AI) & Mạng máy tính, Kết nối thiết bị',
    'Chủ đề D: Đạo đức, pháp luật & văn hóa trong môi trường số',
    'Chủ đề F: Thiết kế trang web với HTML5 & CSS',
    'Chủ đề GCS: Hướng nghiệp với Tin học & Cơ sở dữ liệu quan hệ / SQL',
  ],
  'Công nghệ 12': [
    'Công nghệ Điện – Điện tử: Mạch điện xoay chiều ba pha & An toàn điện',
    'Kĩ thuật điện tử: Linh kiện bán dẫn, Cổng logic & Vi điều khiển',
    'Công nghệ Lâm – Ngư nghiệp: Quản lí rừng, Nuôi trồng thủy sản bền vững',
  ],
  'Khoa học tự nhiên 9': [
    'Năng lượng cơ học, Ánh sáng & Điện từ (Phân môn Vật lí)',
    'Kim loại, Phi kim, Hydrocarbon & Polymer (Phân môn Hóa học)',
    'Di truyền học Mendel, Nhiễm sắc thể & Tiến hóa (Phân môn Sinh học)',
  ],
};

function stripGradeSuffix(subjectLabel) {
  return String(subjectLabel || '').replace(/\s+\d+.*$/, '').trim();
}

function buildCv5512LessonPlan({ subject, topic, duration, method }) {
  const prof = getSubjectExamProfile(stripGradeSuffix(subject));
  const isChemOrKhtn = prof.id === 'hoa' || prof.id === 'khtn';
  const isScience = ['ly', 'hoa', 'sinh', 'khtn'].includes(prof.id);
  const competencyTitle = isScience
    ? '1. Về năng lực Khoa học Tự nhiên:'
    : prof.id === 'toan'
      ? '1. Về năng lực Toán học:'
      : prof.id === 'anh'
        ? '1. Về năng lực Giao tiếp Ngoại ngữ:'
        : prof.id === 'van'
          ? '1. Về năng lực Ngôn ngữ & Văn học:'
          : `1. Về năng lực đặc thù môn ${prof.label}:`;
  const knowledgeLine = isChemOrKhtn
    ? `Phát biểu đúng khái niệm, định luật, phương trình hóa học và danh pháp IUPAC / điều kiện chuẩn đkc (25°C, 1 bar → V = n × 24,79 L/mol) trong chuyên đề "${topic}".`
    : `Nắm vững khái niệm cốt lõi, quy luật và kiến thức trọng tâm SGK GDPT 2018 trong chuyên đề "${topic}".`;
  const practiceLine = prof.examFamily === 'literature_essay'
    ? `     + Câu 1 (Đọc hiểu): 2–3 câu hỏi nhận biết biện pháp tu từ, thông điệp từ ngữ liệu ngắn.\n     + Câu 2 (Viết): Viết đoạn văn nghị luận ngắn (~150–200 chữ) gắn với vấn đề bài học.`
    : prof.examFamily === 'mcq_only'
      ? `     + Nhóm câu 1 (Ngữ âm / Ngữ pháp / Từ vựng): 4 câu trắc nghiệm 4 lựa chọn.\n     + Nhóm câu 2 (Đọc hiểu ngắn / Giao tiếp): 2–3 câu vận dụng bối cảnh thực tế.`
      : `     + Phần I (3 câu): Trắc nghiệm 4 lựa chọn (NB – TH).\n     ${prof.hasTrueFalse ? '+ Phần II (1 câu · 4 lệnh a, b, c, d): Trắc nghiệm Đúng/Sai kiểm tra bản chất.\n     ' : ''}${prof.hasShortAnswer ? '+ Phần III (1 câu): Trả lời ngắn tính toán/số liệu (đáp án tối đa 4 ký tự).' : ''}`.trimEnd();

  return `KẾ HOẠCH BÀI DẠY (CHUẨN CÔNG VĂN 5512/BGDĐT-GDTrH)
Môn học: ${subject} · Thời lượng: ${duration}
Chuyên đề / Bài học: ${topic}
Phương pháp chủ đạo: ${method}
======================================================================

I. MỤC TIÊU BÀI HỌC
${competencyTitle}
   - Nhận thức kiến thức: ${knowledgeLine}
   - Tìm hiểu & khám phá: Thực hiện hoạt động trải nghiệm/khai thác học liệu trên ELEC AI, ghi nhận dữ liệu và trình bày lập luận khoa học, logic.
   - Vận dụng kiến thức, kĩ năng đã học: Giải quyết tình huống thực tiễn và hệ thống câu hỏi kiểm tra đánh giá chuẩn cấu trúc mới 2025.
2. Về phẩm chất:
   - Trung thực, chăm chỉ, có trách nhiệm trong hợp tác nhóm và đánh giá kết quả học tập.

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- Giáo viên: Hệ thống ELEC AI (Kho học liệu, Mô phỏng tương tác, Phiếu trả lời OMR A4).
- Học sinh: Sách giáo khoa GDPT 2018${prof.math ? ', máy tính cầm tay được phép mang vào phòng thi' : ', tài liệu/phiếu học tập nhóm'}.

III. TIẾN TRÌNH DẠY HỌC (4–5 HOẠT ĐỘNG CHUẨN CV 5512)

HOẠT ĐỘNG 1: MỞ ĐẦU / XÁC ĐỊNH VẤN ĐỀ (7 phút)
- a) Mục tiêu: Tạo tình huống có vấn đề và kết nối kiến thức nền với "${topic}".
- b) Nội dung: Giáo viên nêu tình huống thực tiễn hoặc học liệu minh họa, yêu cầu học sinh dự đoán câu trả lời nhanh.
- c) Sản phẩm: Ý kiến phản hồi / phiếu dự đoán của học sinh.
- d) Tổ chức thực hiện: Chuyển giao nhiệm vụ → Thảo luận cặp đôi 2 phút → Báo cáo nhanh → Dẫn dắt vào bài mới.

HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI (18 phút)
- a) Mục tiêu: Xây dựng khái niệm, quy luật và phương pháp cốt lõi của "${topic}".
- b) Nội dung: Học sinh phân tích dữ liệu, văn bản hoặc mô hình tương tác theo nhóm theo hướng dẫn câu hỏi gợi mở.
- c) Sản phẩm: Nội dung ghi bài chuẩn hóa và sơ đồ hóa kiến thức trong vở ghi.
- d) Tổ chức thực hiện: Giáo viên chốt kiến thức chuẩn SGK GDPT 2018 và lưu ý các lỗi sai học sinh thường gặp.

HOẠT ĐỘNG 3: LUYỆN TẬP & PHẢN XẠ ĐỀ MỚI 2025 (12 phút)
- a) Mục tiêu: Củng cố kiến thức qua dạng thức câu hỏi chuẩn Bộ GD&ĐT.
- b) Nội dung:
${practiceLine}
- c) Sản phẩm: Bài làm trên phiếu học tập hoặc phòng thi trực tuyến ELEC.

HOẠT ĐỘNG 4: VẬN DỤNG & MỞ RỘNG (8 phút)
- a) Mục tiêu: Liên hệ ứng dụng của "${topic}" vào thực tiễn đời sống, nghề nghiệp và xã hội.
- b) Sản phẩm: Câu trả lời hoặc sản phẩm trình bày ngắn gọn của học sinh.`;
}

function buildCv7991Matrix({ subject, topic }) {
  const prof = getSubjectExamProfile(stripGradeSuffix(subject));
  const counts = prof.standardCounts || { p1: 18, p2: 4, p3: 6, essay: 0, total: 28, duration: 50 };
  const pts = prof.pointPerQuestion || { single_choice: 0.25, true_false: 1.0, short_answer: 0.25, essay: 1.5 };
  const isChemOrKhtn = prof.id === 'hoa' || prof.id === 'khtn';

  let structureBlock = '';
  if (prof.examFamily === 'literature_essay') {
    structureBlock = `1. CẤU TRÚC ĐỀ THI TỐT NGHIỆP / ĐỊNH KÌ CHUẨN QĐ 764/QĐ-BGDĐT (100% TỰ LUẬN)
----------------------------------------------------------------------
- PHẦN I · Đọc hiểu văn bản (Ngữ liệu ngoài SGK): 4,00 điểm (4–5 câu: Nhận biết 2 câu × 0,5đ + Thông hiểu 2 câu × 1,0đ + Vận dụng 1 câu × 1,0đ)
- PHẦN II · Viết (Nghị luận xã hội & Nghị luận văn học): 6,00 điểm
  + Câu 1 (Viết đoạn văn ~200 chữ): 2,00 điểm
  + Câu 2 (Viết bài văn ~600 chữ): 4,00 điểm`;
  } else if (prof.examFamily === 'mcq_only') {
    structureBlock = `1. CẤU TRÚC ĐỀ THI CHUẨN QĐ 764/QĐ-BGDĐT (${counts.total} CÂU — 100% TRẮC NGHIỆM)
----------------------------------------------------------------------
- PHẦN I · Trắc nghiệm 4 lựa chọn: ${counts.p1} câu × ${pts.single_choice.toFixed(2).replace('.', ',')}đ = ${(counts.p1 * pts.single_choice).toFixed(2).replace('.', ',')} điểm
  + Phân bổ: Hoàn thành thông báo/tờ rơi, sắp xếp hội thoại/đoạn văn, đọc điền khuyết thông tin, đọc hiểu đoạn văn 8–10 câu.
  + Lưu ý kiểm tra định kì CV 7991: Có thể lồng ghép Kĩ năng Nghe / Đọc / Viết câu (70% TN – 30% TL theo phân phối chương trình).`;
  } else {
    const tfRule = `  + Quy tắc chấm chuẩn Bộ GD&ĐT: Đúng 1 ý = 0,10đ | Đúng 2 ý = 0,25đ | Đúng 3 ý = 0,50đ | Đúng 4 ý = 1,00đ.\n  + Trong mỗi câu 4 ý: Ý (a) Nhận biết · Ý (b) Thông hiểu · Ý (c) Vận dụng · Ý (d) Vận dụng tổng hợp/thực tiễn.`;
    structureBlock = `1. CẤU TRÚC ĐỀ THI CHUẨN QĐ 764/QĐ-BGDĐT (${counts.total} CÂU${counts.p2 ? ` — ${counts.p1 + counts.p2 * 4 + (counts.p3 || 0)} LỆNH HỎI` : ''})
----------------------------------------------------------------------
- PHẦN I · Trắc nghiệm 4 lựa chọn: ${counts.p1} câu × ${pts.single_choice.toFixed(2).replace('.', ',')}đ = ${(counts.p1 * pts.single_choice).toFixed(2).replace('.', ',')} điểm
${counts.p2 > 0 ? `\n- PHẦN II · Trắc nghiệm Đúng/Sai (${counts.p2} câu × 4 ý = ${counts.p2 * 4} lệnh hỏi): ${(counts.p2 * 1.0).toFixed(2).replace('.', ',')} điểm\n${tfRule}\n` : ''}${counts.p3 > 0 ? `\n- PHẦN III · Trả lời ngắn (Tự điền kết quả số, TỐI ĐA 4 KÝ TỰ trên phiếu OMR): ${counts.p3} câu × ${pts.short_answer.toFixed(2).replace('.', ',')}đ = ${(counts.p3 * pts.short_answer).toFixed(2).replace('.', ',')} điểm` : ''}`;
  }

  const standardizationNotes = [
    '- Ma trận kiểm tra định kì theo Công văn 7991/BGDĐT-GDTrH: Tỉ lệ nhận thức chuẩn 40% Nhận biết – 30% Thông hiểu – 30% Vận dụng (đề định kì các môn trắc nghiệm thường gồm 70% Trắc nghiệm 7,0đ + 30% Tự luận 3,0đ; riêng Ngữ văn 100% Tự luận).',
    ...(counts.p3 > 0 ? ['- Phiếu trả lời trắc nghiệm Bộ GD&ĐT Phần III chỉ có 4 ô tô: đáp án tối đa 4 ký tự (chữ số 0–9, dấu \'-\' đầu, dấu \',\'), KHÔNG kèm đơn vị hay phân số.'] : []),
    ...(isChemOrKhtn ? ['- Điều kiện chuẩn của chất khí (đkc): 25°C, 1 bar → V = n × 24,79 L/mol (Không sử dụng 22,4 L/mol); danh pháp hóa học viết chuẩn tiếng Anh quốc tế (IUPAC) theo GDPT 2018.'] : []),
    ...(!isChemOrKhtn && prof.examFamily !== 'literature_essay' ? ['- Thuật ngữ, số liệu và trích dẫn chuẩn SGK GDPT 2018 hiện hành (Kết nối tri thức / Chân trời sáng tạo / Cánh diều).'] : []),
  ].join('\n');

  return `MA TRẬN & BẢN ĐẶC TẢ ĐỀ KIỂM TRA (CHUẨN CV 7991 & QĐ 764/QĐ-BGDĐT)
Môn: ${subject} · Trọng tâm: ${topic}
Thời gian chuẩn thi THPTQG: ${counts.duration || 50} phút (Định kì: 45–90 phút) · Thang điểm: 10,0 điểm
======================================================================

${structureBlock}

2. TỈ LỆ MA TRẬN MỨC ĐỘ NHẬN THỨC CHUẨN CV 7991/BGDĐT-GDTrH
----------------------------------------------------------------------
- Nhận biết (Biết): 40% (4,0 điểm) — Nêu, nhận dạng khái niệm, sự kiện, quy tắc cơ bản.
- Thông hiểu (Hiểu): 30% (3,0 điểm) — Giải thích, phân tích mối quan hệ, đọc hiểu dữ liệu.
- Vận dụng (VD): 30% (3,0 điểm) — Giải quyết vấn đề thực tiễn, tính toán/viết tổng hợp.

3. YÊU CẦU CHUẨN HÓA THEO QUY ĐỊNH BỘ GD&ĐT
----------------------------------------------------------------------
${standardizationNotes}`;
}

function buildTt22Comments({ subject, topic }) {
  const prof = getSubjectExamProfile(stripGradeSuffix(subject));
  const toolNote = prof.examFamily === 'literature_essay'
    ? 'vận dụng linh hoạt kiến thức đọc hiểu ngữ liệu và diễn đạt mạch lạc trong các bài viết nghị luận.'
    : prof.examFamily === 'mcq_only'
      ? 'vận dụng linh hoạt vốn từ vựng, cấu trúc ngữ pháp và kĩ năng đọc hiểu văn bản tiếng Anh.'
      : prof.examFamily === 'social_2part'
        ? 'vận dụng linh hoạt kiến thức nền để phân tích tư liệu/tình huống và giải quyết chính xác các câu hỏi Đúng/Sai.'
        : 'vận dụng linh hoạt công thức và tư duy giải quyết vấn đề để xử lí chính xác các câu hỏi Đúng/Sai và Trả lời ngắn.';
  return `BỘ NHẬN XÉT HỌC BẠ & SỔ ĐIỂM CÁ NHÂN HÓA (CHUẨN THÔNG TƯ 22/2021/TT-BGDĐT)
Môn: ${subject} · Chuyên đề đánh giá: ${topic}
======================================================================

1. MỨC TỐT (Điểm từ 8,5 – 10,0):
- "Nắm rất vững kiến thức trọng tâm chuyên đề ${topic}; ${toolNote}"
- "Có tư duy môn ${prof.label} sắc bén, trình bày lập luận chặt chẽ, sử dụng thành thạo thuật ngữ và quy chuẩn GDPT 2018."

2. MỨC KHÁ (Điểm từ 7,0 – 8,4):
- "Hiểu rõ bản chất kiến thức và làm tốt nhóm câu hỏi Nhận biết - Thông hiểu của ${topic}; cần rèn luyện thêm kỹ năng xử lý câu hỏi Vận dụng để đạt điểm tối đa."
- "Chủ động trong giờ học và thảo luận; cần chú ý kiểm tra kỹ các mệnh đề bẫy ở Phần II (Đúng/Sai) hoặc dữ kiện đề bài."

3. MỨC ĐẠT (Điểm từ 5,0 – 6,9):
- "Đạt yêu cầu cơ bản về kiến thức nền tảng của ${topic}; cần ôn tập kỹ hơn các khái niệm cốt lõi và đọc kỹ yêu cầu câu hỏi."

4. MỨC CẦN CỐ GẮNG (Dưới 5,0):
- "Cần hệ thống lại kiến thức gốc trong SGK GDPT 2018 về ${topic}, luyện tập thêm các bài tập mức độ Nhận biết và chủ động trao đổi với giáo viên khi gặp vướng mắc."`;
}

export default function TeacherPedagogyWorkbench({ onClose }) {
  const [docType, setDocType] = useState('cv5512'); // cv5512 | cv7991 | tt22
  const [subject, setSubject] = useState('Hóa học 12');
  const [topic, setTopic] = useState(SUBJECT_TOPICS['Hóa học 12'][0]);
  const [duration, setDuration] = useState('2 tiết (90 phút)');
  const [method, setMethod] = useState('Dạy học khám phá theo mô hình 5E');
  const [copied, setCopied] = useState(false);

  const handleSubjectChange = (nextSub) => {
    setSubject(nextSub);
    const list = SUBJECT_TOPICS[nextSub] || [];
    if (list.length > 0) setTopic(list[0]);
  };

  const generatedDoc = useMemo(() => {
    if (docType === 'cv5512') {
      return buildCv5512LessonPlan({ subject, topic, duration, method });
    }
    if (docType === 'cv7991') {
      return buildCv7991Matrix({ subject, topic });
    }
    return buildTt22Comments({ subject, topic });
  }, [docType, subject, topic, duration, method]);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generatedDoc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadWord = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docType.toUpperCase()} - ${subject}</title><style>body{font-family:'Times New Roman',serif;font-size:13pt;line-height:1.5;white-space:pre-wrap;padding:24px;}</style></head><body>${generatedDoc.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ELEC_${docType.toUpperCase()}_${subject.replace(/\s+/g, '_')}.doc`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <section
      className="tp-pedagogy-workbench"
      style={{
        marginTop: '1rem',
        padding: '1.25rem',
        borderRadius: 18,
        border: '1.5px solid rgba(47, 107, 255, 0.28)',
        background: 'var(--t-surface, #ffffff)',
        boxShadow: '0 10px 30px -12px rgba(47, 107, 255, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.07em',
              color: '#2f6bff',
              background: 'rgba(47, 107, 255, 0.1)',
              padding: '3px 10px',
              borderRadius: 999,
              marginBottom: 4,
            }}
          >
            ELEC TEACHER AI HUB · CHUẨN CÔNG VĂN 5512 · CÔNG VĂN 7991 · THÔNG TƯ 22
          </span>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 850 }}>
            Trợ Lý Hồ Sơ Chuyên Môn Giáo Viên Đa Môn (Xuất Word 1-Click)
          </h3>
        </div>
        {onClose && (
          <button type="button" className="vt-btn sm" onClick={onClose}>
            Thu gọn
          </button>
        )}
      </div>

      {/* 3 Tab Công cụ Sư phạm */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          { id: 'cv5512', label: '1. Kế hoạch bài dạy (Giáo án CV 5512)' },
          { id: 'cv7991', label: '2. Ma trận & Đặc tả Đề thi (CV 7991 / 2025)' },
          { id: 'tt22', label: '3. Nhận xét Học bạ & Sổ điểm (Thông tư 22)' },
        ].map((tab) => {
          const active = docType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDocType(tab.id)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 12,
                border: active ? '1.5px solid #2f6bff' : '1.5px solid rgba(47, 107, 255, 0.22)',
                background: active ? 'linear-gradient(135deg, #2f6bff, #1d4ed8)' : 'transparent',
                color: active ? '#fff' : 'inherit',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bộ chọn Môn & Chuyên đề */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', fontWeight: 700 }}>
          <span>Phân môn &amp; Khối lớp:</span>
          <select
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 10,
              border: '1.5px solid rgba(47, 107, 255, 0.25)',
              background: 'var(--t-surface, #fff)',
              color: 'inherit',
              fontWeight: 700,
            }}
          >
            {Object.keys(SUBJECT_TOPICS).map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', fontWeight: 700 }}>
          <span>Chuyên đề / Chương SGK GDPT 2018:</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 10,
              border: '1.5px solid rgba(47, 107, 255, 0.25)',
              background: 'var(--t-surface, #fff)',
              color: 'inherit',
              fontWeight: 700,
            }}
          >
            {(SUBJECT_TOPICS[subject] || []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        {docType === 'cv5512' && (
          <>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', fontWeight: 700 }}>
              <span>Thời lượng tiết dạy:</span>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 10,
                  border: '1.5px solid rgba(47, 107, 255, 0.25)',
                  background: 'var(--t-surface, #fff)',
                  color: 'inherit',
                  fontWeight: 700,
                }}
              >
                <option value="1 tiết (45 phút)">1 tiết (45 phút)</option>
                <option value="2 tiết (90 phút)">2 tiết (90 phút)</option>
                <option value="3 tiết (Chuyên đề STEM)">3 tiết (Chuyên đề STEM)</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', fontWeight: 700 }}>
              <span>Kĩ thuật dạy học tích cực:</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 10,
                  border: '1.5px solid rgba(47, 107, 255, 0.25)',
                  background: 'var(--t-surface, #fff)',
                  color: 'inherit',
                  fontWeight: 700,
                }}
              >
                <option value="Dạy học khám phá theo mô hình 5E">Mô hình 5E + Thực nghiệm ảo</option>
                <option value="Dạy học theo trạm & Mảnh ghép">Dạy học theo Trạm &amp; Mảnh ghép</option>
                <option value="Dạy học giải quyết vấn đề thực tiễn">Giải quyết vấn đề STEM</option>
              </select>
            </label>
          </>
        )}
      </div>

      {/* Khung Xem trước & Chỉnh sửa văn bản */}
      <textarea
        rows={12}
        readOnly
        value={generatedDoc}
        style={{
          width: '100%',
          padding: '0.9rem 1rem',
          borderRadius: 14,
          border: '1.5px solid rgba(47, 107, 255, 0.22)',
          background: 'rgba(47, 107, 255, 0.03)',
          color: 'inherit',
          fontFamily: 'var(--mono, monospace)',
          fontSize: '0.82rem',
          lineHeight: 1.58,
          resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: 11,
            border: '1.5px solid #2f6bff',
            background: 'rgba(47, 107, 255, 0.08)',
            color: '#1d4ed8',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          {copied ? '✓ Đã sao chép văn bản' : 'Sao chép toàn bộ'}
        </button>
        <button
          type="button"
          onClick={handleDownloadWord}
          style={{
            padding: '0.55rem 1.2rem',
            borderRadius: 11,
            border: 'none',
            background: 'linear-gradient(135deg, #2f6bff, #1d4ed8)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          Tải file Word (.doc) chuẩn Bộ GD&amp;ĐT
        </button>
      </div>
    </section>
  );
}
