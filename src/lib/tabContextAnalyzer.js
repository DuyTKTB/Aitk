/* ============================================================
   tabContextAnalyzer.js — Bộ Cảm Biến & Phân Tích Ngữ Cảnh Tab Thời Gian Thực
   Giúp AI Agent nhận diện chính xác màn hình Thầy/Cô đang mở
   và tự động phân tích chức năng, số liệu thực tế cùng quy trình thao tác chuẩn.
   ============================================================ */

export const TAB_DEFINITIONS = {
  overview: {
    key: 'overview',
    name: 'Bảng Điều Khiển Tổng Quan (Overview)',
    shortName: 'Tổng Quan',
    purpose: 'Trung tâm giám sát toàn diện hoạt động dạy học, phổ điểm chung và cảnh báo học sinh cần bồi dưỡng.',
    workflow: [
      'Quan sát tỷ lệ đạt yêu cầu và điểm trung bình toàn bộ các lớp.',
      'Kiểm tra danh sách học sinh có cảnh báo đỏ (điểm dưới 5.0) để kê đơn học tập phục hồi.',
      'Truy cập nhanh vào Lớp học hoặc Kho đề thi để điều phối bài giảng tiếp theo.',
    ],
    quickChips: [
      { label: 'Học sinh điểm dưới 5.0?', query: 'Lớp nào đang có học sinh điểm dưới 5.0?' },
      { label: 'Báo cáo phổ điểm toàn trường', query: 'Báo cáo phổ điểm và phân tích điểm số các lớp' },
      { label: 'Kê đơn phục hồi học sinh yếu', query: 'Kê đơn học tập cho học sinh yếu' },
      { label: 'Hướng dẫn sử dụng hệ thống', query: 'Hướng dẫn quy trình tạo lớp học và cho học sinh kiểm tra' },
    ],
  },

  classes: {
    key: 'classes',
    name: 'Quản Lý Lớp Học & Học Sinh (Classes)',
    shortName: 'Quản Lý Lớp',
    purpose: 'Tổ chức danh sách lớp học, cấp mã PIN/QR cho học sinh vào lớp, quản lý sĩ số và bảng điểm từng em.',
    workflow: [
      'Bấm "+ Tạo lớp mới" (hoặc ra lệnh cho AI) để tạo lớp với tên chuẩn (VD: 11A5, 12A1...).',
      'Sao chép Mã Vào Lớp gửi cho học sinh để các em tham gia trên điện thoại.',
      'Bấm vào từng lớp để xem danh sách học sinh, lịch sử làm bài và tiến độ bồi dưỡng.',
    ],
    quickChips: [
      { label: '+ Tạo lớp mới bằng AI', query: 'Tạo lớp mới cho tôi' },
      { label: 'Xem mã vào các lớp', query: 'Danh sách các lớp và mã vào lớp' },
      { label: 'Học sinh cần bồi dưỡng', query: 'Học sinh nào trong các lớp đang có điểm dưới trung bình?' },
      { label: 'Giao đề cho lớp này', query: 'Soạn đề kiểm tra giao cho lớp' },
    ],
  },

  exams: {
    key: 'exams',
    name: 'Kho Đề Thi & Quản Lý Kiểm Tra (Exams Bank)',
    shortName: 'Kho Đề Thi',
    purpose: 'Lưu trữ, biên tập, nhóm đề theo lớp, xuất file Word và theo dõi trạng thái đề thi đã giao.',
    workflow: [
      'Xem trước đề thi dạng thí sinh (Preview) để kiểm tra câu hỏi và hình ảnh.',
      'Mở "Bác sĩ sửa file Word (.docx)" để căn chỉnh lề in A4, thước đo centimet và công thức.',
      'Bấm "Giao đề cho lớp" hoặc "Đảo 4 mã đề" để học sinh làm bài trên hệ thống.',
    ],
    quickChips: [
      { label: 'Soạn đề mới chuẩn GDPT 2025', action: 'start_wizard' },
      { label: 'Mở Bác sĩ sửa file Word (A4)', action: 'word_editor' },
      { label: 'Đảo 4 mã đề (101 - 104)', query: 'Hướng dẫn đảo 4 mã đề tự động' },
      { label: 'Nạp đề từ file Word/PDF', action: 'pick_file' },
    ],
  },

  sessions: {
    key: 'sessions',
    name: 'Phòng Thi Trực Tiếp & Giám Sát Camera Live (Live Proctor)',
    shortName: 'Phòng Thi & Giám Sát',
    purpose: 'Phòng thi trực tuyến thời gian thực, giám sát thí sinh qua camera AI và phát hiện gian lận/chuyển tab.',
    workflow: [
      'Mở ca thi để cấp mã PIN cho học sinh đồng loạt vào làm bài trực tuyến.',
      'Giám sát lưới camera và danh sách cảnh báo vi phạm (rời màn hình, chuyển tab, nhiều người).',
      'Bấm "Nhắc nhở" hoặc "Tạm dừng bài thi" đối với học sinh vi phạm nghiêm trọng.',
    ],
    quickChips: [
      { label: 'Kiểm tra vi phạm LIVE', query: 'Phòng thi trực tiếp hiện có ai vi phạm không?' },
      { label: 'Danh sách thí sinh đang làm bài', query: 'Hiện có bao nhiêu học sinh đang trong phòng thi?' },
      { label: 'Cảnh báo học sinh chuyển tab', query: 'Cách cảnh báo học sinh gian lận khi thi online' },
    ],
  },

  create: {
    key: 'create',
    name: 'Soạn & Tạo Đề Thi Mới (AI Exam Generator)',
    shortName: 'AI Tạo Đề',
    purpose: 'Biên soạn đề thi tự động bằng trí tuệ nhân tạo theo chuẩn 3 phần GDPT 2025 của Bộ GD&ĐT.',
    workflow: [
      'Chọn môn học, khối lớp và gõ chuyên đề kiến thức (VD: Este - Lipit, Dao động cơ...).',
      'Thiết lập tỷ lệ nhận thức Bloom (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).',
      'AI tự động tạo đề thi hoàn chỉnh kèm đáp án, lời giải chi tiết và bảng ma trận đặc tả.',
    ],
    quickChips: [
      { label: 'Soạn đề 15p Este (12)', query: 'Soạn 1 đề kiểm tra 15 phút phần Este rồi giao ngay cho lớp' },
      { label: 'Soạn đề chuẩn 3 phần (28 câu)', action: 'start_wizard' },
      { label: 'Thẩm định ma trận đề thi', query: 'Thẩm định & phán xét câu hỏi GDPT 2025' },
    ],
  },

  word_editor: {
    key: 'word_editor',
    name: 'Trình Soạn Thảo Word Office 365 (Casual Docs Engine)',
    shortName: 'Word Office 365',
    purpose: 'Trình soạn thảo văn bản Word khổ A4 phân trang vật lý chuyên sâu, tích hợp công cụ khảo thí GDPT 2025.',
    workflow: [
      'Chỉnh sửa nội dung văn bản, bảng biểu, hình ảnh, công thức trực tiếp trên trang in Word.',
      'Bấm "Đồng bộ Word sang Bài thi" để AI bóc tách câu hỏi vào hệ thống làm bài trực tuyến.',
      'Bấm "Giao đề cho lớp" hoặc "Đảo 4 mã đề" để phát hành bài kiểm tra cho học sinh.',
    ],
    quickChips: [
      { label: '⚡ Đồng bộ Word vào Bài thi', query: 'Đồng bộ câu hỏi từ Word vào hệ thống làm bài online' },
      { label: '🎯 Giao bài cho lớp học', query: 'Hướng dẫn giao đề cho lớp từ Word' },
      { label: '🔀 Đảo 4 mã đề (101 - 104)', query: 'Hướng dẫn đảo 4 mã đề tự động' },
      { label: '🩺 AI Thẩm định ma trận', query: 'Khám bệnh và thẩm định đề thi này' },
    ],
  },

  simulator: {
    key: 'simulator',
    name: 'Trung Tâm Mô Phỏng 100 Học Sinh Ảo (Exam Simulator)',
    shortName: 'Mô Phỏng 100 HS Ảo',
    purpose: 'Thử nghiệm đề thi bằng 100 thí sinh ảo (Giỏi, Khá, Yếu) để dự báo phổ điểm và độ khó trước khi thi thật.',
    workflow: [
      'Nạp đề thi cần thử nghiệm vào trung tâm mô phỏng.',
      'Khởi chạy giải đề tự động trong 3 giây với 100 thí sinh ảo.',
      'Quan sát phổ điểm hình chuông, chỉ số phân hóa (DI) và điều chỉnh lại câu hỏi bẫy.',
    ],
    quickChips: [
      { label: 'Chạy thử nghiệm 100 thí sinh ảo', query: 'Chạy mô phỏng 100 học sinh ảo giải đề thi' },
      { label: 'Xem chỉ số phân hóa câu hỏi', query: 'Chỉ số phân hóa câu hỏi là gì?' },
    ],
  },

  analytics: {
    key: 'analytics',
    name: 'Báo Cáo Phổ Điểm & Chẩn Đoán Năng Lực (Analytics)',
    shortName: 'Báo Cáo Phổ Điểm',
    purpose: 'Phân tích ma trận kết quả, phổ điểm hình chuông và chẩn đoán lỗ hổng kiến thức của từng lớp.',
    workflow: [
      'Chọn lớp và khoảng thời gian (7 ngày, 30 ngày, học kỳ).',
      'Quan sát biểu đồ phổ điểm, điểm trung bình và tỷ lệ học sinh đạt yêu cầu.',
      'Bóc tách các dạng bài tập có tỷ lệ làm sai cao để lên kế hoạch phụ đạo.',
    ],
    quickChips: [
      { label: 'Phân tích điểm số các lớp', query: 'Báo cáo phổ điểm và phân tích điểm số các lớp' },
      { label: 'Lớp nào điểm thấp nhất?', query: 'Lớp nào đang có học sinh điểm dưới 5.0?' },
      { label: 'Kê đơn bồi dưỡng cấp tốc', query: 'Kê đơn học tập cho học sinh yếu' },
    ],
  },

  paper: {
    key: 'paper',
    name: 'Chấm Thi Giấy Tự Động Bằng Camera (OMR Grading)',
    shortName: 'Chấm Thi Giấy OMR',
    purpose: 'Chấm bài thi trắc nghiệm trên giấy bằng camera máy tính hoặc điện thoại qua phiếu trả lời trắc nghiệm chuẩn.',
    workflow: [
      'In phiếu trả lời trắc nghiệm chuẩn Bộ GD&ĐT cho học sinh làm bài.',
      'Đưa phiếu bài làm trước camera để AI tự động nhận diện bong bóng tô và chấm điểm trong 1 giây.',
      'Điểm số tự động đồng bộ vào Bảng điểm lớp của học sinh.',
    ],
    quickChips: [
      { label: 'Hướng dẫn chấm thi giấy', query: 'Hướng dẫn chấm bài thi giấy bằng camera' },
      { label: 'Tải mẫu phiếu trả lời trắc nghiệm', query: 'Mẫu phiếu trả lời trắc nghiệm chuẩn Bộ GD' },
    ],
  },
};

/**
 * Lấy thông tin ngữ cảnh tổng hợp của tab đang kích hoạt
 */
export function getCurrentTabInfo({
  activeSection = 'overview',
  activeSubTab = 'all',
  selectedClass = null,
  selectedExam = null,
  classes = [],
  exams = [],
  submissionsMap = {},
  liveSessions = [],
  wordEditorOpen = false,
  wordEditorExam = null,
}) {
  const effectiveKey = wordEditorOpen ? 'word_editor' : (activeSection || 'overview');
  const baseDef = TAB_DEFINITIONS[effectiveKey] || TAB_DEFINITIONS.overview;

  // Thu thập số liệu thực tế theo ngữ cảnh
  const classCount = classes?.length || 0;
  const examCount = exams?.length || 0;
  let totalSubs = 0;
  Object.values(submissionsMap || {}).forEach((subList) => {
    totalSubs += Array.isArray(subList) ? subList.length : 0;
  });
  const liveCount = liveSessions?.length || 0;

  let contextBadge = '';
  if (effectiveKey === 'classes') {
    contextBadge = `${classCount} lớp đang quản lý`;
  } else if (effectiveKey === 'exams') {
    contextBadge = `${examCount} đề thi trong kho`;
  } else if (effectiveKey === 'sessions') {
    contextBadge = liveCount > 0 ? `${liveCount} ca thi đang mở` : 'Chưa có ca thi trực tiếp';
  } else if (effectiveKey === 'word_editor') {
    const qCount = wordEditorExam?.questions?.length || exams?.[0]?.questions?.length || 0;
    contextBadge = `${qCount} câu • Môn ${wordEditorExam?.subject || 'Vật lí / Hóa / Sinh'}`;
  } else {
    contextBadge = `${classCount} lớp • ${totalSubs} bài nộp`;
  }

  return {
    ...baseDef,
    effectiveKey,
    contextBadge,
    classCount,
    examCount,
    totalSubs,
    liveCount,
    selectedClass,
    selectedExam,
    wordEditorExam,
  };
}

/**
 * Xây dựng báo cáo phân tích chi tiết chuẩn sư phạm của tab hiện tại
 */
export function buildTabDetailedAnalysis(context) {
  const tabInfo = getCurrentTabInfo(context);
  const { effectiveKey, name, purpose, workflow, classCount, examCount, totalSubs, liveCount, classes } = tabInfo;

  const validClasses = (classes || []).filter((c) => c.name && c.name.trim().length >= 2).map((c) => c.name);

  let realDataReport = '';
  if (effectiveKey === 'overview') {
    realDataReport = `* **Quy mô giảng dạy:** Thầy/Cô đang quản lý **${classCount} lớp** (${validClasses.join(', ') || 'Chưa tạo lớp'}).
* **Bài làm học sinh:** Tổng cộng **${totalSubs} bài nộp** đã được ghi nhận trên toàn hệ thống.
* **Kho đề kiểm tra:** Đang có **${examCount} đề thi** sẵn sàng để điều phối.`;
  } else if (effectiveKey === 'classes') {
    realDataReport = `* **Hiện trạng lớp học:** Thầy/Cô đang có **${classCount} lớp học** (${validClasses.join(', ') || 'Chưa có lớp'}).
* **Nghiệp vụ cốt lõi:** Quản lý danh sách học sinh từng lớp, đổi mã vào lớp (Class Code) và theo dõi kết quả làm bài của từng em.`;
  } else if (effectiveKey === 'exams') {
    realDataReport = `* **Tài nguyên hiện có:** Kho đề của Thầy/Cô hiện lưu trữ **${examCount} đề thi**.
* **Định dạng tương thích:** Đầy đủ đề thi 3 phần chuẩn GDPT 2025, đề nạp từ Word/PDF và đề tạo tự động bằng AI.`;
  } else if (effectiveKey === 'sessions') {
    realDataReport = `* **Tình trạng phòng thi:** Hiện có **${liveCount} ca thi** đang được mở trên hệ thống.
* **Công nghệ tích hợp:** Giám sát camera chống gian lận, phát hiện chuyển tab và cảnh báo âm thanh thời gian thực.`;
  } else if (effectiveKey === 'word_editor') {
    realDataReport = `* **Không gian soạn thảo:** Trình soạn thảo Word chuẩn Office 365 (Casual Docs) phân trang A4 vật lý.
* **Tiện ích tích hợp:** Đồng bộ 2 chiều vào bài thi online, đảo 4 mã đề (101-104), thẩm định ma trận nhận thức Bloom và rà soát danh pháp IUPAC.`;
  } else {
    realDataReport = `* **Số liệu thực tế:** ${classCount} lớp học, ${examCount} đề thi trong kho và ${totalSubs} bài nộp đã chấm.`;
  }

  const workflowText = (workflow || []).map((step, idx) => `**Bước ${idx + 1}:** ${step}`).join('\n');

  return `Chào Thầy/Cô! Dưới đây là bài phân tích chi tiết về phân hệ **${name}**:

### I. Mục đích cốt lõi
${purpose}

### II. Phân tích số liệu thực tế hiện tại
${realDataReport}

### III. Quy trình thao tác chuẩn sư phạm
${workflowText}

### IV. Các thao tác AI đề xuất thực hiện ngay:`;
}
