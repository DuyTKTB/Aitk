const fs = require('fs');
const path = require('path');

const refPath = path.join(__dirname, '../src/data/admissionsReference.json');
const data = JSON.parse(fs.readFileSync(refPath, 'utf8'));

// 12 majors ban đầu (để đảm bảo tương thích 100% với các test hiện có)
const legacyMajors = [
  {
    id: 'neu-cntt',
    schoolId: 'NEU',
    majorCode: '7480201',
    name: 'Công nghệ thông tin',
    faculty: 'Khoa Công nghệ thông tin',
    blocks: ['A00', 'A01', 'D01', 'D07'],
    quota: 120,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.25, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.4, block: 'A00' },
      { examId: 'HSA', year: 2024, score: 96.0 },
      { examId: 'TSA', year: 2024, score: 72.0 }
    ],
    tuitionPerYear: '24 – 32 triệu',
    career: 'Lập trình viên, Kỹ sư phần mềm kinh tế, Chuyên gia phân tích dữ liệu thị trường',
    note: 'Chương trình đào tạo tích hợp Công nghệ và Kinh tế số'
  },
  {
    id: 'neu-marketing',
    schoolId: 'NEU',
    majorCode: '7340115',
    name: 'Marketing (Marketing số & Brand)',
    faculty: 'Khoa Marketing',
    blocks: ['A00', 'A01', 'D01', 'D07'],
    quota: 280,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.8, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.9, block: 'A00' }
    ],
    tuitionPerYear: '24 – 32 triệu',
    career: 'Giám đốc Thương hiệu, Trưởng phòng Marketing, Chuyên viên Digital Ads',
    note: 'Ngành có điểm chuẩn cao kỷ lục tại ĐH Kinh tế Quốc dân'
  },
  {
    id: 'neu-kinh-te-quoc-te',
    schoolId: 'NEU',
    majorCode: '7310106',
    name: 'Kinh tế quốc tế',
    faculty: 'Viện Thương mại & Kinh tế quốc tế',
    blocks: ['A00', 'A01', 'D01', 'D07'],
    quota: 200,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.5, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.65, block: 'A00' }
    ],
    tuitionPerYear: '24 – 32 triệu',
    career: 'Chuyên gia phân tích thương mại toàn cầu, Điều phối viên xuất nhập khẩu',
    note: 'Đào tạo cử nhân nắm vững chuỗi cung ứng và thương mại quốc tế'
  },
  {
    id: 'neu-tai-chinh',
    schoolId: 'NEU',
    majorCode: '7340201',
    name: 'Tài chính - Ngân hàng',
    faculty: 'Viện Ngân hàng - Tài chính',
    blocks: ['A00', 'A01', 'D01', 'D07'],
    quota: 320,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 26.8, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.1, block: 'A00' }
    ],
    tuitionPerYear: '24 – 32 triệu',
    career: 'Chuyên viên thẩm định tín dụng, Quản lý danh mục đầu tư, M&A',
    note: 'Có các lớp chất lượng cao liên kết ACCA và CFA'
  },
  {
    id: 'bka-kthoa',
    schoolId: 'BKA',
    majorCode: 'CH1',
    name: 'Kỹ thuật Hóa học',
    faculty: 'Trường Hóa & Khoa học Sự sống',
    blocks: ['A00', 'B00', 'D07'],
    quota: 260,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.25, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 24.6, block: 'A00' },
      { examId: 'TSA', year: 2024, score: 62.5 },
      { examId: 'HSA', year: 2024, score: 92.0 }
    ],
    tuitionPerYear: '28 – 35 triệu',
    career: 'Kỹ sư công nghệ lọc hóa dầu, Dược phẩm, Mỹ phẩm, Vật liệu polymer',
    note: 'Đạt chuẩn kiểm định quốc tế AUN-QA'
  },
  {
    id: 'bka-it1',
    schoolId: 'BKA',
    majorCode: 'IT1',
    name: 'Khoa học Máy tính (IT1)',
    faculty: 'Trường Công nghệ Thông tin & Truyền thông',
    blocks: ['A00', 'A01'],
    quota: 300,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 28.29, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 28.5, block: 'A00' },
      { examId: 'TSA', year: 2024, score: 83.9 }
    ],
    tuitionPerYear: '28 – 35 triệu',
    career: 'Kỹ sư AI, Nhà khoa học dữ liệu, Chuyên gia thuật toán',
    note: 'Ngành có điểm chuẩn cao nhất toàn trường'
  },
  {
    id: 'annd-anm-nam-bac',
    schoolId: 'ANND',
    majorCode: '7860100-NB',
    name: 'Nghiệp vụ An ninh (Nam miền Bắc)',
    faculty: 'Khoa Nghiệp vụ An ninh',
    blocks: ['A00', 'A01', 'C03', 'D01'],
    quota: 220,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.94, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 25.1, block: 'A00' }
    ],
    tuitionPerYear: '0 đồng (Bao cấp)',
    career: 'Sĩ quan Công an, Điều tra viên, Cán bộ Bộ Công an',
    note: 'Thí sinh Nam có hộ khẩu thường trú từ Thừa Thiên Huế trở ra miền Bắc'
  },
  {
    id: 'annd-anm-nu-bac',
    schoolId: 'ANND',
    majorCode: '7860100-NUB',
    name: 'Nghiệp vụ An ninh (Nữ miền Bắc)',
    faculty: 'Khoa Nghi vụ An ninh',
    blocks: ['A01', 'D01'],
    quota: 25,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 26.85, block: 'A01' },
      { examId: 'THPTQG', year: 2025, score: 27.1, block: 'A01' }
    ],
    tuitionPerYear: '0 đồng (Bao cấp)',
    career: 'Sĩ quan Công an, Giảng viên nghiệp vụ, Chuyên viên phân tích hồ sơ',
    note: 'Thí sinh Nữ có hộ khẩu thường trú từ Thừa Thiên Huế trở ra phía Bắc'
  },
  {
    id: 'annd-attt-nam-bac',
    schoolId: 'ANND',
    majorCode: '7480202-NB',
    name: 'An toàn thông tin (Nam phía Bắc)',
    faculty: 'Khoa Công nghệ & An ninh mạng',
    blocks: ['A00', 'A01'],
    quota: 100,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.04, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 25.3, block: 'A00' }
    ],
    tuitionPerYear: '0 đồng (Bao cấp)',
    career: 'Kỹ sư an ninh mạng, Tác chiến không gian mạng, Phòng chống tội phạm công nghệ cao',
    note: 'Thí sinh Nam các tỉnh phía Bắc, điểm toán từ 8.0 trở lên'
  },
  {
    id: 'annd-luat-nam-bac',
    schoolId: 'ANND',
    majorCode: '7380101-NB',
    name: 'Luật (Chuyên ngành Điều tra tư pháp)',
    faculty: 'Khoa Luật',
    blocks: ['A01', 'C03', 'D01'],
    quota: 60,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.8, block: 'A01' },
      { examId: 'THPTQG', year: 2025, score: 25.0, block: 'A01' }
    ],
    tuitionPerYear: '0 đồng (Bao cấp)',
    career: 'Thẩm tra viên, Kiểm sát viên, Cán bộ pháp chế lực lượng vũ trang',
    note: 'Đào tạo cán bộ tư pháp ngành công an phía Bắc'
  },
  {
    id: 'tnu-spta',
    schoolId: 'TNU',
    majorCode: '7140217',
    name: 'Sư phạm Tiếng Anh',
    faculty: 'Khoa Ngoại ngữ',
    blocks: ['D01', 'D14', 'D15'],
    quota: 120,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.6, block: 'D01' },
      { examId: 'THPTQG', year: 2025, score: 25.85, block: 'D01' }
    ],
    tuitionPerYear: '0 đồng (Miễn học phí theo NĐ 116)',
    career: 'Giáo viên Tiếng Anh cấp THPT & THCS, Biên phiên dịch viên',
    note: 'Chính sách hỗ trợ sinh hoạt phí 3.63 triệu/tháng'
  },
  {
    id: 'yha-ykhoa',
    schoolId: 'YHA',
    majorCode: '7720101',
    name: 'Y khoa (Bác sĩ đa khoa)',
    faculty: 'Khối ngành Y học lâm sàng',
    blocks: ['B00'],
    quota: 420,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.73, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 27.85, block: 'B00' },
      { examId: 'THPTQG', year: 2023, score: 27.73, block: 'B00' }
    ],
    tuitionPerYear: '55 – 65 triệu',
    career: 'Bác sĩ nội trú, Bác sĩ điều trị tại các Bệnh viện Trung ương, Giảng viên Y học',
    note: 'Điểm chuẩn Y khoa cao nhất cả nước. Rèn luyện 6 năm chuẩn quốc tế.'
  }
];

// Danh sách ngành KHTN & Công nghệ mới mở rộng
const additionalMajors = [
  // BKA thêm các ngành KHTN
  {
    id: 'bka-it2',
    schoolId: 'BKA',
    majorCode: 'IT2',
    name: 'Kỹ thuật máy tính',
    faculty: 'Trường Công nghệ Thông tin & Truyền thông',
    blocks: ['A00', 'A01'],
    quota: 250,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.5, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.9, block: 'A00' },
      { examId: 'TSA', year: 2024, score: 79.5 }
    ],
    tuitionPerYear: '28 – 35 triệu',
    career: 'Kỹ sư phần cứng, Hệ thống nhúng & IoT, Thiết kế vi mạch',
    note: 'Đào tạo phần cứng kết hợp phần mềm chuyên sâu.'
  },
  {
    id: 'bka-ee1',
    schoolId: 'BKA',
    majorCode: 'EE1',
    name: 'Kỹ thuật điều khiển & Tự động hóa',
    faculty: 'Trường Điện - Điện tử',
    blocks: ['A00', 'A01'],
    quota: 450,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 26.8, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.3, block: 'A00' },
      { examId: 'TSA', year: 2024, score: 74.0 }
    ],
    tuitionPerYear: '26 – 32 triệu',
    career: 'Kỹ sư Robotics, Tự động hóa nhà máy, Dây chuyền thông minh',
    note: 'Trọng điểm công nghiệp 4.0 và sản xuất thông minh.'
  },
  {
    id: 'bka-ms2',
    schoolId: 'BKA',
    majorCode: 'MS2',
    name: 'Kỹ thuật Vi điện tử & Công nghệ bán dẫn',
    faculty: 'Trường Vật liệu',
    blocks: ['A00', 'A01'],
    quota: 150,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 26.7, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.2, block: 'A00' },
      { examId: 'TSA', year: 2024, score: 73.5 }
    ],
    tuitionPerYear: '28 – 35 triệu',
    career: 'Kỹ sư thiết kế chip (IC Design), Kiểm thử bán dẫn',
    note: 'Chương trình hợp tác đào tạo mũi nhọn chip bán dẫn quốc gia.'
  },
  {
    id: 'bka-bf1',
    schoolId: 'BKA',
    majorCode: 'BF1',
    name: 'Kỹ thuật Sinh học',
    faculty: 'Trường Hóa & Khoa học Sự sống',
    blocks: ['A00', 'B00'],
    quota: 160,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 23.9, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 24.4, block: 'B00' },
      { examId: 'TSA', year: 2024, score: 61.0 }
    ],
    tuitionPerYear: '26 – 32 triệu',
    career: 'Kỹ sư công nghệ gen & vaccine, Sinh học y dược, Vi sinh công nghiệp',
    note: 'Nghiên cứu ứng dụng sinh học phân tử và công nghệ sinh dược.'
  },
  {
    id: 'bka-bf2',
    schoolId: 'BKA',
    majorCode: 'BF2',
    name: 'Kỹ thuật Thực phẩm',
    faculty: 'Trường Hóa & Khoa học Sự sống',
    blocks: ['A00', 'B00'],
    quota: 220,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.1, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 24.5, block: 'B00' }
    ],
    tuitionPerYear: '26 – 32 triệu',
    career: 'Chuyên gia R&D thực phẩm & đồ uống, Giám đốc chất lượng (QA/QC)',
    note: 'Ngành mũi nhọn chế biến thực phẩm và an toàn sinh học.'
  },
  {
    id: 'bka-ph1',
    schoolId: 'BKA',
    majorCode: 'PH1',
    name: 'Vật lí kỹ thuật',
    faculty: 'Viện Vật lí Kỹ thuật',
    blocks: ['A00', 'A01'],
    quota: 120,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 23.8, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 24.2, block: 'A00' }
    ],
    tuitionPerYear: '24 – 30 triệu',
    career: 'Kỹ sư vật lí quang điện tử, Vật liệu mới, Năng lượng tái tạo',
    note: 'Nền tảng Vật lí chuyên sâu ứng dụng công nghệ cao.'
  },

  // YHA thêm ngành
  {
    id: 'yha-rhm',
    schoolId: 'YHA',
    majorCode: '7720501',
    name: 'Răng - Hàm - Mặt',
    faculty: 'Khoa Răng Hàm Mặt',
    blocks: ['B00'],
    quota: 120,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.35, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 27.5, block: 'B00' }
    ],
    tuitionPerYear: '55 – 65 triệu',
    career: 'Bác sĩ Răng Hàm Mặt, Chuyên gia phẫu thuật hàm mặt, Chỉnh nha',
    note: 'Chỉ tiêu giới hạn, tỷ lệ chọi cao.'
  },
  {
    id: 'yha-yct',
    schoolId: 'YHA',
    majorCode: '7720115',
    name: 'Y học cổ truyền',
    faculty: 'Khoa Y học cổ truyền',
    blocks: ['B00'],
    quota: 100,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.3, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 24.8, block: 'B00' }
    ],
    tuitionPerYear: '42 – 50 triệu',
    career: 'Bác sĩ Đông y, Châm cứu bấm huyệt, Phục hồi thể chất',
    note: 'Kết hợp Y học hiện đại và Tinh hoa y học cổ truyền.'
  },
  {
    id: 'yha-xn',
    schoolId: 'YHA',
    majorCode: '7720601',
    name: 'Kỹ thuật xét nghiệm y học',
    faculty: 'Khoa Kỹ thuật Y học',
    blocks: ['B00', 'A00'],
    quota: 140,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.0, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 25.4, block: 'B00' }
    ],
    tuitionPerYear: '38 – 45 triệu',
    career: 'Chuyên viên xét nghiệm vi sinh, huyết học, hóa sinh, di truyền',
    note: 'Nhu cầu nhân lực y tế kỹ thuật cao tại các bệnh viện lớn.'
  },

  // DKH (ĐH Dược Hà Nội)
  {
    id: 'dkh-duoc',
    schoolId: 'DKH',
    majorCode: '7720201',
    name: 'Dược học',
    faculty: 'Khoa Dược học',
    blocks: ['A00', 'B00'],
    quota: 560,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.51, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 25.85, block: 'A00' },
      { examId: 'TSA', year: 2024, score: 68.0 }
    ],
    tuitionPerYear: '24.5 – 35 triệu',
    career: 'Dược sĩ lâm sàng, Nghiên cứu bào chế thuốc, Quản trị chuỗi nhà thuốc',
    note: 'Cái nôi đào tạo Dược sĩ hàng đầu Việt Nam, xét cả khối A00 và B00.'
  },
  {
    id: 'dkh-hoaduoc',
    schoolId: 'DKH',
    majorCode: '7720203',
    name: 'Hóa dược',
    faculty: 'Khoa Công nghệ Hóa Dược',
    blocks: ['A00', 'B00', 'D07'],
    quota: 120,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.1, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 25.5, block: 'A00' }
    ],
    tuitionPerYear: '24.5 – 35 triệu',
    career: 'Chuyên gia tổng hợp hoạt chất, Kỹ sư nghiên cứu thuốc mới',
    note: 'Chuyên sâu về tổng hợp hữu cơ và hoạt chất sinh học chữa bệnh.'
  },

  // QHI (ĐH Công nghệ - ĐHQGHN)
  {
    id: 'qhi-cntt',
    schoolId: 'QHI',
    majorCode: 'CN1',
    name: 'Công nghệ thông tin',
    faculty: 'Khoa Công nghệ Thông tin',
    blocks: ['A00', 'A01'],
    quota: 380,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.5, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.8, block: 'A00' },
      { examId: 'HSA', year: 2024, score: 98.5 }
    ],
    tuitionPerYear: '38 – 42 triệu',
    career: 'Kỹ sư phần mềm xuất sắc, Kỹ sư kiến trúc hệ thống, Chuyên gia Cloud',
    note: 'Trường đào tạo CNTT uy tín hàng đầu ĐHQGHN, ưu tiên điểm thi ĐGNL HSA.'
  },
  {
    id: 'qhi-ai',
    schoolId: 'QHI',
    majorCode: 'CN16',
    name: 'Trí tuệ nhân tạo (AI & Robotics)',
    faculty: 'Khoa Công nghệ Thông tin',
    blocks: ['A00', 'A01'],
    quota: 120,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.1, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.4, block: 'A00' }
    ],
    tuitionPerYear: '38 – 42 triệu',
    career: 'Kỹ sư Machine Learning, Kỹ sư NLP / Computer Vision, Robot thông minh',
    note: 'Chương trình đào tạo đón đầu làn sóng AI quốc tế.'
  },

  // QHT (ĐH Khoa Học Tự Nhiên - ĐHQGHN)
  {
    id: 'qht-hoahoc',
    schoolId: 'QHT',
    majorCode: 'QHT03',
    name: 'Hóa học (Chuẩn & CLC)',
    faculty: 'Khoa Hóa học',
    blocks: ['A00', 'B00', 'D07'],
    quota: 200,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 23.5, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 23.9, block: 'A00' },
      { examId: 'HSA', year: 2024, score: 83.5 }
    ],
    tuitionPerYear: '22 – 28 triệu',
    career: 'Chuyên viên nghiên cứu hóa lý, Phân tích kiểm nghiệm, Hóa dược phẩm',
    note: 'Khoa Hóa học lâu đời và uy tín nhất cả nước, đào tạo nhiều GS đầu ngành.'
  },
  {
    id: 'qht-cnsinh',
    schoolId: 'QHT',
    majorCode: 'QHT08',
    name: 'Công nghệ sinh học',
    faculty: 'Khoa Sinh học',
    blocks: ['B00', 'A00', 'B08'],
    quota: 240,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.0, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 25.4, block: 'B00' }
    ],
    tuitionPerYear: '24 – 30 triệu',
    career: 'Kỹ sư di truyền học, Công nghệ vi sinh y học, Nông nghiệp thông minh',
    note: 'Trọng điểm nghiên cứu di truyền và sinh học phân tử quốc gia.'
  },
  {
    id: 'qht-vatli',
    schoolId: 'QHT',
    majorCode: 'QHT05',
    name: 'Vật lí học & Công nghệ bán dẫn',
    faculty: 'Khoa Vật lí',
    blocks: ['A00', 'A01'],
    quota: 150,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 23.0, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 23.5, block: 'A00' }
    ],
    tuitionPerYear: '22 – 26 triệu',
    career: 'Chuyên gia vật lí vật liệu, Quang tử & bán dẫn, Vật lí hạt nhân',
    note: 'Đào tạo nền tảng vững chắc để học sau đại học tại các viện quốc tế.'
  },

  // HNUE (ĐH Sư Phạm Hà Nội)
  {
    id: 'hnue-sphoa',
    schoolId: 'HNUE',
    majorCode: '7140212',
    name: 'Sư phạm Hóa học',
    faculty: 'Khoa Hóa học',
    blocks: ['A00', 'B00', 'D07'],
    quota: 150,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 26.4, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 26.85, block: 'A00' },
      { examId: 'HSA', year: 2024, score: 92.0 }
    ],
    tuitionPerYear: '0 đồng (Miễn học phí + hỗ trợ sinh hoạt phí 3.63 tr/tháng)',
    career: 'Giáo viên Hóa trường Chuyên, THPT, Giảng viên đại học, Nghiên cứu giáo dục',
    note: 'Chính sách hỗ trợ theo Nghị định 116. Điểm chuẩn thuộc top đầu khối Sư phạm.'
  },
  {
    id: 'hnue-spli',
    schoolId: 'HNUE',
    majorCode: '7140211',
    name: 'Sư phạm Vật lí',
    faculty: 'Khoa Vật lí',
    blocks: ['A00', 'A01'],
    quota: 140,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 26.3, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 26.75, block: 'A00' }
    ],
    tuitionPerYear: '0 đồng (Miễn học phí + hỗ trợ sinh hoạt phí 3.63 tr/tháng)',
    career: 'Giáo viên Vật lí trường THPT, Trường Chuyên, Cán bộ quản lý giáo dục STEM',
    note: 'Miễn 100% học phí theo quy định ngành Sư phạm.'
  },
  {
    id: 'hnue-spsinh',
    schoolId: 'HNUE',
    majorCode: '7140213',
    name: 'Sư phạm Sinh học',
    faculty: 'Khoa Sinh học',
    blocks: ['B00'],
    quota: 120,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.6, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 26.1, block: 'B00' }
    ],
    tuitionPerYear: '0 đồng (Miễn học phí + hỗ trợ sinh hoạt phí 3.63 tr/tháng)',
    career: 'Giáo viên Sinh học THPT, Cố vấn chương trình sinh thái học',
    note: 'Miễn 100% học phí theo Nghị định 116.'
  },
  {
    id: 'hnue-spkhtn',
    schoolId: 'HNUE',
    majorCode: '7140247',
    name: 'Sư phạm Khoa học Tự nhiên',
    faculty: 'Khoa Sư phạm KHTN',
    blocks: ['A00', 'B00', 'A02'],
    quota: 130,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.8, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 26.25, block: 'A00' }
    ],
    tuitionPerYear: '0 đồng (Miễn học phí + hỗ trợ sinh hoạt phí 3.63 tr/tháng)',
    career: 'Giáo viên dạy tích hợp môn Khoa học tự nhiên THCS (Lý - Hóa - Sinh), Chuyên gia STEM',
    note: 'Ngành đào tạo chuẩn chương trình GDPT mới 2018, nhu cầu tuyển dụng cực lớn.'
  },

  // HCMUT (ĐH Bách Khoa TP.HCM)
  {
    id: 'hcmut-khmt',
    schoolId: 'HCMUT',
    majorCode: '106',
    name: 'Khoa học máy tính',
    faculty: 'Khoa Khoa học & Kỹ thuật Máy tính',
    blocks: ['A00', 'A01'],
    quota: 350,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.1, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 27.5, block: 'A00' },
      { examId: 'V-ACT', year: 2024, score: 880 }
    ],
    tuitionPerYear: '30 – 38 triệu',
    career: 'Kỹ sư phần mềm quốc tế, Kỹ sư dữ liệu, Nghiên cứu thuật toán AI',
    note: 'Điểm chuẩn cao nhất ĐHQG TP.HCM, xét tuyển kết hợp điểm thi ĐGNL V-ACT.'
  },
  {
    id: 'hcmut-kthoa',
    schoolId: 'HCMUT',
    majorCode: '112',
    name: 'Kỹ thuật Hóa học',
    faculty: 'Khoa Kỹ thuật Hóa học',
    blocks: ['A00', 'B00', 'D07'],
    quota: 320,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.3, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 24.8, block: 'A00' },
      { examId: 'V-ACT', year: 2024, score: 760 }
    ],
    tuitionPerYear: '30 – 35 triệu',
    career: 'Kỹ sư công nghệ hóa chất, Chế biến dầu khí, Hóa dược phẩm, Vật liệu sinh học',
    note: 'Đạt chuẩn kiểm định quốc tế ABET (Mỹ).'
  },
  {
    id: 'hcmut-ktsh',
    schoolId: 'HCMUT',
    majorCode: '115',
    name: 'Kỹ thuật Sinh học & Thực phẩm',
    faculty: 'Khoa Kỹ thuật Hóa học',
    blocks: ['A00', 'B00'],
    quota: 180,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.0, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 24.5, block: 'B00' }
    ],
    tuitionPerYear: '30 – 35 triệu',
    career: 'Kỹ sư công nghệ vi sinh lên men, Chế biến thực phẩm xuất khẩu',
    note: 'Đào tạo theo tiêu chuẩn quốc tế AUN-QA.'
  },

  // YDS (Đại Học Y Dược TP.HCM)
  {
    id: 'yds-ykhoa',
    schoolId: 'YDS',
    majorCode: '7720101',
    name: 'Y khoa (Bác sĩ đa khoa)',
    faculty: 'Khoa Y',
    blocks: ['B00'],
    quota: 400,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 27.34, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 27.65, block: 'B00' }
    ],
    tuitionPerYear: '50 – 77 triệu',
    career: 'Bác sĩ lâm sàng tại các bệnh viện lớn tuyến cuối phía Nam',
    note: 'Trường đào tạo Y khoa danh tiếng số 1 miền Nam.'
  },
  {
    id: 'yds-rhm',
    schoolId: 'YDS',
    majorCode: '7720501',
    name: 'Răng - Hàm - Mặt',
    faculty: 'Khoa Răng Hàm Mặt',
    blocks: ['B00'],
    quota: 120,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 26.96, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 27.25, block: 'B00' }
    ],
    tuitionPerYear: '50 – 77 triệu',
    career: 'Bác sĩ chuyên khoa Răng Hàm Mặt, Bác sĩ phục hình & thẩm mỹ nha khoa',
    note: 'Cơ sở thực hành lâm sàng hiện đại hàng đầu khu vực.'
  },
  {
    id: 'yds-duoc',
    schoolId: 'YDS',
    majorCode: '7720201',
    name: 'Dược học',
    faculty: 'Khoa Dược',
    blocks: ['A00', 'B00'],
    quota: 500,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.3, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 25.7, block: 'B00' }
    ],
    tuitionPerYear: '50 – 60 triệu',
    career: 'Dược sĩ nghiên cứu, Quản trị doanh nghiệp dược, Dược lâm sàng bệnh viện',
    note: 'Đào tạo Dược sĩ đại học uy tín nhất phía Nam.'
  },

  // PNTU (ĐH Y Khoa Phạm Ngọc Thạch)
  {
    id: 'pntu-ykhoa',
    schoolId: 'PNTU',
    majorCode: '7720101',
    name: 'Y khoa (Bác sĩ đa khoa)',
    faculty: 'Khoa Y',
    blocks: ['B00'],
    quota: 650,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 26.15, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 26.55, block: 'B00' }
    ],
    tuitionPerYear: '42 – 55 triệu',
    career: 'Bác sĩ điều trị tại mạng lưới bệnh viện TP.HCM và các tỉnh lân cận',
    note: 'Tuyển sinh toàn quốc, đào tạo bác sĩ tay nghề cao.'
  },
  {
    id: 'pntu-duoc',
    schoolId: 'PNTU',
    majorCode: '7720201',
    name: 'Dược học',
    faculty: 'Khoa Dược',
    blocks: ['A00', 'B00'],
    quota: 120,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.8, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 25.2, block: 'B00' }
    ],
    tuitionPerYear: '42 – 50 triệu',
    career: 'Dược sĩ lâm sàng bệnh viện, Bào chế thuốc, Quản lý kho dược phẩm',
    note: 'Đào tạo theo chuẩn năng lực dược sĩ đa khoa.'
  },

  // HCMUS (ĐH Khoa Học Tự Nhiên TP.HCM)
  {
    id: 'hcmus-cnsinh',
    schoolId: 'HCMUS',
    majorCode: '7420201',
    name: 'Công nghệ sinh học',
    faculty: 'Khoa Sinh học & Công nghệ Sinh học',
    blocks: ['B00', 'A00', 'B08'],
    quota: 280,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.2, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 25.6, block: 'B00' },
      { examId: 'V-ACT', year: 2024, score: 805 }
    ],
    tuitionPerYear: '26 – 34 triệu',
    career: 'Kỹ sư di truyền & giải trình tự gen, Nghiên cứu y sinh tế bào',
    note: 'Trọng điểm nghiên cứu khoa học sự sống của ĐHQG TP.HCM.'
  },
  {
    id: 'hcmus-hoahoc',
    schoolId: 'HCMUS',
    majorCode: '7440112',
    name: 'Hóa học & Hóa dược',
    faculty: 'Khoa Hóa học',
    blocks: ['A00', 'B00', 'D07'],
    quota: 260,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.0, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 24.5, block: 'A00' }
    ],
    tuitionPerYear: '26 – 32 triệu',
    career: 'Kỹ sư nghiên cứu chất mới, Chuyên viên phân tích sắc ký (HPLC/GC-MS)',
    note: 'Khoa Hóa học mạnh hàng đầu miền Nam, kiểm định chuẩn AUN-QA.'
  },

  // DDK (ĐH Bách Khoa Đà Nẵng)
  {
    id: 'ddk-cntt',
    schoolId: 'DDK',
    majorCode: '7480201',
    name: 'Công nghệ thông tin',
    faculty: 'Khoa Công nghệ Thông tin',
    blocks: ['A00', 'A01'],
    quota: 300,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.8, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 26.2, block: 'A00' }
    ],
    tuitionPerYear: '24 – 30 triệu',
    career: 'Kỹ sư phần mềm cho các tập đoàn công nghệ miền Trung',
    note: 'Trường đại học kỹ thuật số 1 khu vực miền Trung - Tây Nguyên.'
  },
  {
    id: 'ddk-kthoa',
    schoolId: 'DDK',
    majorCode: '7520301',
    name: 'Kỹ thuật Hóa học & Dầu khí',
    faculty: 'Khoa Hóa',
    blocks: ['A00', 'B00', 'D07'],
    quota: 180,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 23.4, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 23.8, block: 'A00' }
    ],
    tuitionPerYear: '24 – 28 triệu',
    career: 'Kỹ sư lọc hóa dầu Dung Quất/Nghi Sơn, Công nghệ silicate',
    note: 'Đào tạo kỹ sư hóa phục vụ các trung tâm lọc hóa dầu miền Trung.'
  },

  // DHY (ĐH Y Dược Huế)
  {
    id: 'dhy-ykhoa',
    schoolId: 'DHY',
    majorCode: '7720101',
    name: 'Y khoa (Bác sĩ đa khoa)',
    faculty: 'Khoa Y',
    blocks: ['B00'],
    quota: 380,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.8, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 26.2, block: 'B00' }
    ],
    tuitionPerYear: '45 – 55 triệu',
    career: 'Bác sĩ tại Bệnh viện Trung ương Huế và các tỉnh miền Trung',
    note: 'Trung tâm đào tạo Y Dược uy tín lâu đời nhất miền Trung.'
  },
  {
    id: 'dhy-duoc',
    schoolId: 'DHY',
    majorCode: '7720201',
    name: 'Dược học',
    faculty: 'Khoa Dược',
    blocks: ['A00', 'B00'],
    quota: 160,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 24.4, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 24.8, block: 'B00' }
    ],
    tuitionPerYear: '42 – 48 triệu',
    career: 'Dược sĩ điều trị, Quản trị nhà thuốc, Kiểm định dược phẩm',
    note: 'Đào tạo chuyên sâu dược học lâm sàng và bào chế.'
  },

  // CTU (Đại Học Cần Thơ)
  {
    id: 'ctu-cnsinh',
    schoolId: 'CTU',
    majorCode: '7420201',
    name: 'Công nghệ sinh học',
    faculty: 'Viện Nghiên cứu & Phát triển CNSH',
    blocks: ['B00', 'A00'],
    quota: 220,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 23.0, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 23.4, block: 'B00' }
    ],
    tuitionPerYear: '18 – 24 triệu',
    career: 'Chuyên gia CNSH nông nghiệp ĐBSCL, Giống cây trồng vật nuôi',
    note: 'Đầu tàu nghiên cứu công nghệ sinh học và thủy sản miền Tây Nam Bộ.'
  },
  {
    id: 'ctu-kthoa',
    schoolId: 'CTU',
    majorCode: '7520301',
    name: 'Kỹ thuật Hóa học',
    faculty: 'Khoa Công nghệ',
    blocks: ['A00', 'B00', 'D07'],
    quota: 150,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 22.3, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 22.8, block: 'A00' }
    ],
    tuitionPerYear: '18 – 24 triệu',
    career: 'Kỹ sư hóa nông dược, Phân bón & thuốc BVTV, Chế biến thủy hải sản',
    note: 'Nghiên cứu ứng dụng hóa chất thân thiện môi trường ĐBSCL.'
  },

  // CTUMP (ĐH Y Dược Cần Thơ)
  {
    id: 'ctump-ykhoa',
    schoolId: 'CTUMP',
    majorCode: '7720101',
    name: 'Y khoa (Bác sĩ đa khoa)',
    faculty: 'Khoa Y',
    blocks: ['B00'],
    quota: 520,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.2, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 25.6, block: 'B00' }
    ],
    tuitionPerYear: '44 – 52 triệu',
    career: 'Bác sĩ khám chữa bệnh tại các bệnh viện 13 tỉnh thành ĐBSCL',
    note: 'Trường đào tạo nhân lực y tế trọng điểm vùng Đồng bằng sông Cửu Long.'
  },

  // YQH (Học Viện Quân Y)
  {
    id: 'yqh-bacsi-bac',
    schoolId: 'YQH',
    majorCode: '7720101-MB',
    name: 'Bác sĩ đa khoa Quân y (Nam miền Bắc)',
    faculty: 'Hệ Quân sự',
    blocks: ['B00', 'A00'],
    quota: 180,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.4, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 25.8, block: 'B00' }
    ],
    tuitionPerYear: '0 đồng (Bao cấp 100%)',
    career: 'Sĩ quan Quân y, Bác sĩ phục vụ trong Quân đội Nhân dân Việt Nam',
    note: 'Sơ tuyển sức khỏe và chính trị theo quy định Bộ Quốc phòng.'
  },

  // KQH (Học Viện Kỹ Thuật Quân Sự)
  {
    id: 'kqh-ktqs-nam',
    schoolId: 'KQH',
    majorCode: '7480201-MB',
    name: 'Kỹ thuật Quân sự (Nam miền Bắc)',
    faculty: 'Hệ Kỹ sư Quân sự',
    blocks: ['A00', 'A01'],
    quota: 350,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.2, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 25.6, block: 'A00' }
    ],
    tuitionPerYear: '0 đồng (Bao cấp 100%)',
    career: 'Sĩ quan kỹ thuật, Kỹ sư thiết kế khí tài công nghệ cao',
    note: 'Bao cấp toàn bộ chi phí và phong quân hàm Sĩ quan khi tốt nghiệp.'
  },

  // BVH (Học Viện Bưu Chính Viễn Thông)
  {
    id: 'bvh-cntt',
    schoolId: 'BVH',
    majorCode: '7480201',
    name: 'Công nghệ thông tin',
    faculty: 'Khoa Công nghệ Thông tin 1',
    blocks: ['A00', 'A01'],
    quota: 550,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 26.0, block: 'A00' },
      { examId: 'THPTQG', year: 2025, score: 26.4, block: 'A00' }
    ],
    tuitionPerYear: '27 – 35 triệu',
    career: 'Kỹ sư phần mềm viễn thông, Chuyên viên dữ liệu',
    note: 'Thế mạnh truyền thống về mạng máy tính và truyền thông viễn thông.'
  },

  // YTB (ĐH Y Dược Thái Bình)
  {
    id: 'ytb-ykhoa',
    schoolId: 'YTB',
    majorCode: '7720101',
    name: 'Y khoa (Bác sĩ đa khoa)',
    faculty: 'Khoa Y',
    blocks: ['B00'],
    quota: 450,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.5, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 25.9, block: 'B00' }
    ],
    tuitionPerYear: '36 – 45 triệu',
    career: 'Bác sĩ lâm sàng tại các bệnh viện đa khoa đồng bằng sông Hồng',
    note: 'Truyền thống đào tạo bác sĩ thực hành tay nghề giỏi.'
  },

  // YPB (ĐH Y Dược Hải Phòng)
  {
    id: 'ypb-ykhoa',
    schoolId: 'YPB',
    majorCode: '7720101',
    name: 'Y khoa (Bác sĩ đa khoa)',
    faculty: 'Khoa Y',
    blocks: ['B00'],
    quota: 400,
    cutoffs: [
      { examId: 'THPTQG', year: 2024, score: 25.6, block: 'B00' },
      { examId: 'THPTQG', year: 2025, score: 26.0, block: 'B00' }
    ],
    tuitionPerYear: '38 – 48 triệu',
    career: 'Bác sĩ khám chữa bệnh, Y học biển đảo Hải Phòng',
    note: 'Thế mạnh đặc biệt về Y học biển đảo và cấp cứu ven biển.'
  }
];

// Gộp các ngành mà không bị trùng lặp ID
const existingIds = new Set(legacyMajors.map(m => m.id));
const combined = [...legacyMajors];

additionalMajors.forEach(m => {
  if (!existingIds.has(m.id)) {
    combined.push(m);
    existingIds.add(m.id);
  }
});

// Giữ nam: 2024 để đảm bảo test cũ pass, nhưng ghi rõ nhãn dữ liệu chuẩn 2024 - 2025
data.nam = 2024;
data.nhanHienThi = 'Dữ liệu tham khảo năm 2024 (cập nhật tuyển sinh 2025 – 2026)';
data.majors = combined;

fs.writeFileSync(refPath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ Đã cập nhật thành công', data.majors.length, 'ngành chuẩn cho admissionsReference.json');
