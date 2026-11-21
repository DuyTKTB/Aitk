import { useMemo, useState } from 'react';

/* ============================================================
   TeacherPedagogyWorkbench.jsx — BÀN LÀM VIỆC AI GIÁO VIÊN CHUẨN BỘ GD&ĐT
   ------------------------------------------------------------
   Vượt trội AppSoanDe (soande.vn), MagicSchool AI, Brisk & Eduaide:
     1. Soạn Kế hoạch bài dạy (Giáo án 5 hoạt động chuẩn Công văn 5512)
     2. Tạo Ma trận & Bản đặc tả Đề kiểm tra chuẩn Công văn 7991 (3 phần 2025)
     3. Sinh Nhận xét Học bạ & Sổ điểm chuẩn Thông tư 22
     4. Xuất trực tiếp tệp Word (.doc) chuẩn phông chữ hoặc sao chép 1-click.
   ============================================================ */

const SUBJECT_TOPICS = {
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
  'Vật lí 12': [
    'Chương 1: Vật lí Nhiệt (Nội năng, Định luật I Nhiệt động lực học, Nhiệt dung riêng)',
    'Chương 2: Khí lí tưởng (Định luật Boyle, Charles, Phương trình trạng thái pV = nRT)',
    'Chương 3: Từ trường (Lực từ, Cảm ứng từ, Từ thông, Cảm ứng điện từ, Dòng điện xoay chiều)',
    'Chương 4: Vật lí Hạt nhân (Độ hụt khối, Năng lượng liên kết, Phóng xạ, Phản ứng hạt nhân)',
  ],
  'Sinh học 12': [
    'Chương 1: Di truyền phân tử (Tái bản DNA, Phiên mã, Dịch mã, Điều hòa Operon Lac, Đột biến gene)',
    'Chương 2: Di truyền nhiễm sắc thể (Quy luật Mendel, Liên kết gene & Hoán vị gene, Di truyền giới tính)',
    'Chương 3: Mở rộng học thuyết di truyền (Tương tác gene, Di truyền ngoài nhân)',
    'Chương 4: Di truyền quần thể (Định luật Hardy – Weinberg) & Di truyền học người',
    'Chương 5: Bằng chứng và Cơ chế Tiến hóa (Học thuyết Darwin & Tiến hóa tổng hợp hiện đại)',
    'Chương 6: Sinh thái học & Môi trường (Quần thể, Quần xã, Hệ sinh thái)',
  ],
};

function buildCv5512LessonPlan({ subject, topic, duration, method }) {
  return `KẾ HOẠCH BÀI DẠY (CHUẨN CÔNG VĂN 5512/BGDĐT-GDTrH)
Môn học: ${subject} · Thời lượng: ${duration}
Chuyên đề / Bài học: ${topic}
Phương pháp chủ đạo: ${method} + Tích hợp Phòng thí nghiệm ảo ELEC Science AI
======================================================================

I. MỤC TIÊU BÀI HỌC
1. Về năng lực Khoa học Tự nhiên:
   - Nhận thức khoa học: Phát biểu đúng khái niệm, định luật, công thức cốt lõi và danh pháp IUPAC / chuẩn đkc (25°C, 1 bar → V = n × 24,79 L/mol) trong chuyên đề "${topic}".
   - Tìm hiểu tự nhiên: Thực hiện mô phỏng thí nghiệm tương tác 60fps trên ELEC Science AI, ghi nhận bảng số liệu kiểm soát biến và lập báo cáo theo khung CER (Luận điểm - Số liệu - Giải thích).
   - Vận dụng kiến thức, kĩ năng đã học: Giải quyết các câu hỏi thực tiễn và bài tập cấu trúc mới 2025 (Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn).
2. Về phẩm chất:
   - Trung thực trong ghi nhận số liệu thực nghiệm, trách nhiệm trong hoạt động nhóm.

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- Giáo viên: Hệ thống ELEC Science AI (Phòng mô phỏng ảo, Bảng phấn 3D, Phiếu học tập OMR A4).
- Học sinh: Sách giáo khoa GDPT 2018, máy tính cầm tay Casio fx-580VN X.

III. TIẾN TRÌNH DẠY HỌC (5 HOẠT ĐỘNG CHUẨN CV 5512)

HOẠT ĐỘNG 1: MỞ ĐẦU / XÁC ĐỊNH VẤN ĐỀ (7 phút)
- a) Mục tiêu: Tạo mâu thuẫn nhận thức và kết nối kiến thức nền với "${topic}".
- b) Nội dung: Giáo viên chiếu mô phỏng tương tác trên ELEC AI, yêu cầu học sinh dự đoán hiện tượng trước khi bấm chạy.
- c) Sản phẩm: Phiếu dự đoán nhanh của các nhóm học sinh.
- d) Tổ chức thực hiện: Chuyển giao nhiệm vụ → Học sinh thảo luận cặp đôi 2 phút → Báo cáo nhanh → Giáo viên dẫn dắt vào bài mới.

HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI (18 phút)
- a) Mục tiêu: Xây dựng công thức, quy luật và bản chất khoa học của "${topic}".
- b) Nội dung: Học sinh khảo sát sự phụ thuộc giữa biến độc lập và biến phụ thuộc trên Phòng thí nghiệm ảo ELEC AI (giữ cố định biến kiểm soát).
- c) Sản phẩm: Bảng số liệu 3 lần đo và kết luận CER trong vở ghi.
- d) Tổ chức thực hiện: Giáo viên chốt kiến thức chuẩn SGK GDPT 2018 và lưu ý các bẫy đơn vị thường gặp.

HOẠT ĐỘNG 3: LUYỆN TẬP & PHẢN XẠ ĐỀ MỚI 2025 (12 phút)
- a) Mục tiêu: Củng cố kiến thức qua 3 dạng thức câu hỏi mới.
- b) Nội dung:
     + Phần I (3 câu): Trắc nghiệm nhiều phương án lựa chọn (NB – TH).
     + Phần II (1 câu · 4 lệnh a, b, c, d): Trắc nghiệm Đúng/Sai kiểm tra tư duy bản chất và số liệu thực nghiệm.
     + Phần III (1 câu): Trả lời ngắn tính toán định lượng.
- c) Sản phẩm: Bài làm trên phiếu trả lời nhanh hoặc phòng thi trực tuyến ELEC.

HOẠT ĐỘNG 4: VẬN DỤNG & MỞ RỘNG STEM (8 phút)
- a) Mục tiêu: Liên hệ ứng dụng của "${topic}" trong công nghiệp, y sinh và đời sống.
- b) Sản phẩm: Câu trả lời ngắn gọn về giải pháp thực tiễn của học sinh.`;
}

function buildCv7991Matrix({ subject, topic }) {
  return `MA TRẬN & BẢNG ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ (CHUẨN CÔNG VĂN 7991 / CẤU TRÚC 2025)
Môn: ${subject} · Trọng tâm: ${topic}
Thời gian làm bài: 50 phút · Thang điểm: 10,0 điểm
======================================================================

1. CẤU TRÚC ĐỀ THI CHUẨN 3 PHẦN (28 CÂU — 40 LỆNH HỎI)
----------------------------------------------------------------------
- PHẦN I · Trắc nghiệm 4 phương án lựa chọn: 18 câu × 0,25đ = 4,50 điểm
  + Nhận biết (NB): 10 câu (2,50 điểm)
  + Thông hiểu (TH): 6 câu (1,50 điểm)
  + Vận dụng (VD): 2 câu (0,50 điểm)

- PHẦN II · Trắc nghiệm Đúng/Sai (4 câu × 4 ý a, b, c, d = 16 lệnh hỏi): 4,00 điểm
  + Quy tắc tính điểm chuẩn Bộ GD&ĐT: Đúng 1 ý = 0,10đ | Đúng 2 ý = 0,25đ | Đúng 3 ý = 0,50đ | Đúng 4 ý = 1,00đ.
  + Trong mỗi câu: Ý (a) Nhận biết · Ý (b) Thông hiểu · Ý (c) Vận dụng · Ý (d) Vận dụng thực nghiệm/đồ thị.

- PHẦN III · Trả lời ngắn (Tự điền kết quả số): 6 câu × 0,25đ = 1,50 điểm
  + Thông hiểu: 1 câu (0,25 điểm)
  + Vận dụng & Thực tiễn: 5 câu (1,25 điểm)

2. TỈ LỆ MA TRẬN MỨC ĐỘ NHẬN THỨC TOÀN ĐỀ
----------------------------------------------------------------------
- Nhận biết (NB): 40% (4,0 điểm) — Nắm vững khái niệm, danh pháp IUPAC, công thức cơ bản.
- Thông hiểu (TH): 30% (3,0 điểm) — Giải thích hiện tượng, đọc bảng số liệu thí nghiệm.
- Vận dụng (VD): 30% (3,0 điểm) — Bài toán thực tiễn, hiệu suất, đồ thị, liên môn KHTN.

3. YÊU CẦU CHUẨN HÓA SỐ LIỆU GDPT 2018
----------------------------------------------------------------------
- Điều kiện chuẩn của chất khí (đkc): 25°C, 1 bar → V = n × 24,79 L/mol (Không sử dụng 22,4 L/mol).
- Danh pháp hóa học, ký hiệu đại lượng Vật lí và thuật ngữ Sinh học viết chuẩn tiếng Anh quốc tế theo SGK mới.`;
}

function buildTt22Comments({ subject, topic }) {
  return `BỘ NHẬN XÉT HỌC BẠ & SỔ ĐIỂM CÁ NHÂN HÓA (CHUẨN THÔNG TƯ 22/2021/TT-BGDĐT)
Môn: ${subject} · Chuyên đề đánh giá: ${topic}
======================================================================

1. MỨC TỐT (Điểm từ 8,5 – 10,0):
- "Nắm rất vững kiến thức trọng tâm chuyên đề ${topic}; vận dụng linh hoạt công thức và tư duy thực nghiệm để giải quyết chính xác các câu hỏi Đúng/Sai và bài toán thực tiễn."
- "Có tư duy Khoa học Tự nhiên sắc bén, trình bày lời giải chặt chẽ, sử dụng thànhạo danh pháp quốc tế và đơn vị chuẩn GDPT 2018."

2. MỨC KHÁ (Điểm từ 7,0 – 8,4):
- "Hiểu rõ bản chất lý thuyết và làm tốt nhóm câu hỏi Nhận biết - Thông hiểu của ${topic}; cần rèn luyện thêm kỹ năng xử lý số liệu ở các câu Vận dụng trả lời ngắn để đạt điểm tối đa."
- "Chủ động trong giờ thực hành và thảo luận; cần chú ý kiểm tra kỹ các mệnh đề bẫy ở Phần II (Đúng/Sai)."

3. MỨC ĐẠT (Điểm từ 5,0 – 6,9):
- "Đạt yêu cầu cơ bản về kiến thức nền tảng của ${topic}; cần ôn tập kỹ hơn các công thức cốt lõi và lưu ý đổi đúng đơn vị chuẩn trước khi thay số."

4. MỨC CẦN CỐ GẮNG (Dưới 5,0):
- "Cần hệ thống lại kiến thức gốc trong SGK GDPT 2018 về ${topic}, luyện tập thêm các bài tập mức độ Nhận biết và chủ động hỏi giáo viên hoặc trợ lý ELEC AI khi gặp vướng mắc."`;
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
            Trợ Lý Hồ Sơ Chuyên Môn Giáo Viên KHTN (Xuất Word 1-Click)
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
