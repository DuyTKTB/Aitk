/* ============================================================
   uniCutoffs.js — Dữ liệu điểm chuẩn THAM KHẢO 2025
   ⚠️ Số liệu làm tròn, tổng hợp từ công bố công khai — chỉ dùng
   để định hướng. Luôn đối chiếu thông báo chính thức của trường.
   Cấu trúc: { id, uni, code, majorCode, group, city, major, combo, methods, chemWeight, s2024, s2025 }
   ============================================================ */

export const CUTOFF_DATA = [
  // — Y — Dược —
  { id: 'yha-ykhoa', uni: 'ĐH Y Hà Nội', code: 'YHA', majorCode: '7720101', group: 'Y - Dược', city: 'Hà Nội', major: 'Y khoa', combo: 'B00', methods: ['THPTQG'], chemWeight: 1, s2024: 26.15, s2025: 26.85 },
  { id: 'yha-rhm', uni: 'ĐH Y Hà Nội', code: 'YHA', majorCode: '7720501', group: 'Y - Dược', city: 'Hà Nội', major: 'Răng - Hàm - Mặt', combo: 'B00', methods: ['THPTQG'], chemWeight: 1, s2024: 26.5, s2025: 27.05 },
  { id: 'yha-duoc', uni: 'ĐH Y Hà Nội', code: 'YHA', majorCode: '7720201', group: 'Y - Dược', city: 'Hà Nội', major: 'Dược học', combo: 'B00', methods: ['THPTQG'], chemWeight: 1, s2024: 24.2, s2025: 24.9 },
  { id: 'dkh-duoc', uni: 'ĐH Dược Hà Nội', code: 'DKH', majorCode: '7720201', group: 'Y - Dược', city: 'Hà Nội', major: 'Dược học', combo: 'A00/B00', methods: ['THPTQG', 'TSA'], chemWeight: 1.5, s2024: 25.51, s2025: 25.85 },
  { id: 'dkh-hoamydc', uni: 'ĐH Dược Hà Nội', code: 'DKH', majorCode: '7720203', group: 'Y - Dược', city: 'Hà Nội', major: 'Hóa dược', combo: 'A00/B00', methods: ['THPTQG', 'TSA'], chemWeight: 1.5, s2024: 25.35, s2025: 25.6 },
  { id: 'yds-ykhoa', uni: 'ĐH Y Dược TP.HCM', code: 'YDS', majorCode: '7720101', group: 'Y - Dược', city: 'TP.HCM', major: 'Y khoa', combo: 'B00', methods: ['THPTQG'], chemWeight: 1, s2024: 26.05, s2025: 26.6 },
  { id: 'yds-duoc', uni: 'ĐH Y Dược TP.HCM', code: 'YDS', majorCode: '7720201', group: 'Y - Dược', city: 'TP.HCM', major: 'Dược học', combo: 'B00', methods: ['THPTQG'], chemWeight: 1, s2024: 24.05, s2025: 24.75 },
  { id: 'ytp-ykhoa', uni: 'ĐH Y khoa Phạm Ngọc Thạch', code: 'YTP', majorCode: '7720101', group: 'Y - Dược', city: 'TP.HCM', major: 'Y khoa', combo: 'B00', methods: ['THPTQG'], chemWeight: 1, s2024: 25.4, s2025: 26.1 },

  // — Kỹ thuật — Công nghệ — Hóa sinh —
  { id: 'bka-khmt', uni: 'ĐH Bách Khoa Hà Nội', code: 'BKA', majorCode: 'IT1', group: 'Kỹ thuật - Công nghệ', city: 'Hà Nội', major: 'Khoa học máy tính', combo: 'A00/A01', methods: ['THPTQG', 'TSA'], chemWeight: 1, s2024: 26.7, s2025: 27.4 },
  { id: 'bka-ktmt', uni: 'ĐH Bách Khoa Hà Nội', code: 'BKA', majorCode: 'IT2', group: 'Kỹ thuật - Công nghệ', city: 'Hà Nội', major: 'Kỹ thuật máy tính (CNTT)', combo: 'A00/A01', methods: ['THPTQG', 'TSA'], chemWeight: 1, s2024: 25.5, s2025: 26.3 },
  { id: 'bka-tdh', uni: 'ĐH Bách Khoa Hà Nội', code: 'BKA', majorCode: 'EE2', group: 'Kỹ thuật - Công nghệ', city: 'Hà Nội', major: 'Kỹ thuật điều khiển - Tự động hóa', combo: 'A00', methods: ['THPTQG', 'TSA'], chemWeight: 1, s2024: 24.75, s2025: 25.6 },
  { id: 'bka-kthoa', uni: 'ĐH Bách Khoa Hà Nội', code: 'BKA', majorCode: 'CH1', group: 'Kỹ thuật - Công nghệ', city: 'Hà Nội', major: 'Kỹ thuật Hóa học', combo: 'A00/B00/D07', methods: ['THPTQG', 'TSA'], chemWeight: 1.5, s2024: 23.8, s2025: 24.4 },
  { id: 'bka-kttp', uni: 'ĐH Bách Khoa Hà Nội', code: 'BKA', majorCode: 'BF1', group: 'Kỹ thuật - Công nghệ', city: 'Hà Nội', major: 'Kỹ thuật Sinh học & Thực phẩm', combo: 'A00/B00', methods: ['THPTQG', 'TSA'], chemWeight: 1, s2024: 23.6, s2025: 24.2 },
  { id: 'qsb-khmt', uni: 'ĐH Bách Khoa TP.HCM', code: 'QSB', majorCode: '106', group: 'Kỹ thuật - Công nghệ', city: 'TP.HCM', major: 'Khoa học máy tính', combo: 'A00/A01', methods: ['THPTQG', 'V-ACT'], chemWeight: 1, s2024: 26.0, s2025: 26.8 },
  { id: 'qsb-dtvt', uni: 'ĐH Bách Khoa TP.HCM', code: 'QSB', majorCode: '107', group: 'Kỹ thuật - Công nghệ', city: 'TP.HCM', major: 'Kỹ thuật điện tử - Viễn thông', combo: 'A00', methods: ['THPTQG', 'V-ACT'], chemWeight: 1, s2024: 24.5, s2025: 25.3 },
  { id: 'qsb-kthoa', uni: 'ĐH Bách Khoa TP.HCM', code: 'QSB', majorCode: '112', group: 'Kỹ thuật - Công nghệ', city: 'TP.HCM', major: 'Kỹ thuật Hóa học', combo: 'A00/B00/D07', methods: ['THPTQG', 'V-ACT'], chemWeight: 1.5, s2024: 23.5, s2025: 24.1 },
  { id: 'qht-khmt', uni: 'ĐH Công nghệ - ĐHQGHN', code: 'QHT', majorCode: 'CN1', group: 'Kỹ thuật - Công nghệ', city: 'Hà Nội', major: 'Khoa học máy tính', combo: 'A00/A01', methods: ['THPTQG', 'HSA'], chemWeight: 1, s2024: 25.9, s2025: 26.6 },
  { id: 'ptt-cntt', uni: 'Học viện Công nghệ Bưu chính Viễn thông', code: 'PTT', majorCode: '7480201', group: 'Kỹ thuật - Công nghệ', city: 'Hà Nội', major: 'CNTT (Đông Đô)', combo: 'A00/A01', methods: ['THPTQG', 'HSA', 'TSA'], chemWeight: 1, s2024: 24.0, s2025: 24.8 },

  // — Kinh tế —
  { id: 'neu-ktdt', uni: 'ĐH Kinh tế Quốc dân', code: 'NEU', majorCode: '7310104', group: 'Kinh tế - Quản trị', city: 'Hà Nội', major: 'Kinh tế đầu tư', combo: 'A00/D01', methods: ['THPTQG', 'HSA', 'TSA'], chemWeight: 1, s2024: 26.25, s2025: 27.0 },
  { id: 'neu-ketoan', uni: 'ĐH Kinh tế Quốc dân', code: 'NEU', majorCode: '7340301', group: 'Kinh tế - Quản trị', city: 'Hà Nội', major: 'Kế toán', combo: 'A00/D01', methods: ['THPTQG', 'HSA', 'TSA'], chemWeight: 1, s2024: 25.1, s2025: 25.9 },
  { id: 'ftu-ktdn', uni: 'ĐH Ngoại thương', code: 'FTU', majorCode: 'NTH01', group: 'Kinh tế - Quản trị', city: 'Hà Nội', major: 'Kinh tế đối ngoại', combo: 'A00/D01/D07', methods: ['THPTQG', 'HSA'], chemWeight: 1, s2024: 26.55, s2025: 27.15 },
  { id: 'ftu-tmqt', uni: 'ĐH Ngoại thương', code: 'FTU', majorCode: 'NTH02', group: 'Kinh tế - Quản trị', city: 'Hà Nội', major: 'Thương mại quốc tế', combo: 'A00/D01', methods: ['THPTQG', 'HSA'], chemWeight: 1, s2024: 25.8, s2025: 26.5 },
  { id: 'ueh-kinhte', uni: 'ĐH Kinh tế TP.HCM (UEH)', code: 'UEH', majorCode: '7310101', group: 'Kinh tế - Quản trị', city: 'TP.HCM', major: 'Kinh tế', combo: 'A00/D01', methods: ['THPTQG', 'V-ACT'], chemWeight: 1, s2024: 25.2, s2025: 25.95 },
  { id: 'bhn-tcnh', uni: 'Học viện Ngân hàng', code: 'BHN', majorCode: '7340201', group: 'Kinh tế - Quản trị', city: 'Hà Nội', major: 'Tài chính - Ngân hàng', combo: 'A00/D01', methods: ['THPTQG', 'HSA'], chemWeight: 1, s2024: 24.3, s2025: 25.0 },

  // — Luật — Ngoại giao — Ngôn ngữ —
  { id: 'lha-luat', uni: 'ĐH Luật Hà Nội', code: 'LHA', majorCode: '7380101', group: 'Luật - Ngoại giao', city: 'Hà Nội', major: 'Luật', combo: 'C00/D01', methods: ['THPTQG'], chemWeight: 0, s2024: 24.6, s2025: 25.3 },
  { id: 'dav-qhqt', uni: 'Học viện Ngoại giao', code: 'DAV', majorCode: '7310206', group: 'Luật - Ngoại giao', city: 'Hà Nội', major: 'Quan hệ quốc tế', combo: 'D01/D14', methods: ['THPTQG'], chemWeight: 0, s2024: 26.0, s2025: 26.7 },
  { id: 'qhf-nna', uni: 'ĐH Ngoại ngữ - ĐHQGHN', code: 'QHF', majorCode: '7220201', group: 'Luật - Ngoại giao', city: 'Hà Nội', major: 'Ngôn ngữ Anh', combo: 'D01', methods: ['THPTQG', 'HSA'], chemWeight: 0, s2024: 25.75, s2025: 26.4 },

  // — Sư phạm — Khoa học cơ bản —
  { id: 'hnu-sphoa', uni: 'ĐH Sư phạm Hà Nội', code: 'HNU', majorCode: '7140212', group: 'Sư phạm - KHTN', city: 'Hà Nội', major: 'Sư phạm Hóa học', combo: 'A00/B00/D07', methods: ['THPTQG', 'HSA'], chemWeight: 2, s2024: 25.4, s2025: 26.0 },
  { id: 'hnu-gdth', uni: 'ĐH Sư phạm Hà Nội', code: 'HNU', majorCode: '7140202', group: 'Sư phạm - KHTN', city: 'Hà Nội', major: 'GD Tiểu học', combo: 'C19/C20', methods: ['THPTQG'], chemWeight: 0, s2024: 24.5, s2025: 25.1 },
  { id: 'qhs-hoahoc', uni: 'ĐH Khoa học Tự nhiên - ĐHQGHN', code: 'QHS', majorCode: 'QHT03', group: 'Sư phạm - KHTN', city: 'Hà Nội', major: 'Hóa học (CLC)', combo: 'B00/A00', methods: ['THPTQG', 'HSA'], chemWeight: 1.5, s2024: 22.5, s2025: 23.4 },
  { id: 'qst-khmt', uni: 'ĐH Khoa học Tự nhiên TP.HCM', code: 'QST', majorCode: '7480101', group: 'Sư phạm - KHTN', city: 'TP.HCM', major: 'Khoa học máy tính', combo: 'A00/A01', methods: ['THPTQG', 'V-ACT'], chemWeight: 1, s2024: 24.8, s2025: 25.5 },

  // — Tư thục —
  { id: 'fpt-cntt', uni: 'ĐH FPT', code: 'FPT', majorCode: '7480201', group: 'Kỹ thuật - Công nghệ', city: 'Hà Nội / HCM / ĐN', major: 'CNTT (Kỹ thuật phần mềm)', combo: 'Thi ĐGTD của trường', methods: ['THPTQG', 'HSA'], chemWeight: 1, s2024: 20.0, s2025: 20.5 },
  { id: 'rmi-khmt', uni: 'ĐH RMIT Việt Nam', code: 'RMI', majorCode: 'BP094', group: 'Kỹ thuật - Công nghệ', city: 'TP.HCM', major: 'Khoa học máy tính', combo: 'Xét học bạ/IELTS', methods: ['THPTQG'], chemWeight: 0, s2024: null, s2025: null },
];

export const CITIES = ['Tất cả', 'Hà Nội', 'TP.HCM', 'Hà Nội / HCM / ĐN'];
