/* ============================================================
   uniCutoffs.js — Dữ liệu điểm chuẩn THAM KHẢO 2025
   ⚠️ Số liệu làm tròn, tổng hợp từ công bố công khai — chỉ dùng
   để định hướng. Luôn đối chiếu thông báo chính thức của trường.
   Cấu trúc: { uni, code, city, major, combo, s2024, s2025 }
   ============================================================ */

export const CUTOFF_DATA = [
  // — Y — Dược —
  { uni: 'ĐH Y Hà Nội', code: 'YHA', city: 'Hà Nội', major: 'Y khoa', combo: 'B00', s2024: 26.15, s2025: 26.85 },
  { uni: 'ĐH Y Hà Nội', code: 'YHA', city: 'Hà Nội', major: 'Răng - Hàm - Mặt', combo: 'B00', s2024: 26.5, s2025: 27.05 },
  { uni: 'ĐH Y Hà Nội', code: 'YHA', city: 'Hà Nội', major: 'Dược học', combo: 'B00', s2024: 24.2, s2025: 24.9 },
  { uni: 'ĐH Y Dược TP.HCM', code: 'YDS', city: 'TP.HCM', major: 'Y khoa', combo: 'B00', s2024: 26.05, s2025: 26.6 },
  { uni: 'ĐH Y Dược TP.HCM', code: 'YDS', city: 'TP.HCM', major: 'Dược học', combo: 'B00', s2024: 24.05, s2025: 24.75 },
  { uni: 'ĐH Y khoa Phạm Ngọc Thạch', code: 'YTP', city: 'TP.HCM', major: 'Y khoa', combo: 'B00', s2024: 25.4, s2025: 26.1 },

  // — Kỹ thuật — Công nghệ —
  { uni: 'ĐH Bách Khoa Hà Nội', code: 'BKA', city: 'Hà Nội', major: 'Khoa học máy tính', combo: 'A00/A01', s2024: 26.7, s2025: 27.4 },
  { uni: 'ĐH Bách Khoa Hà Nội', code: 'BKA', city: 'Hà Nội', major: 'Kỹ thuật máy tính (CNTT)', combo: 'A00/A01', s2024: 25.5, s2025: 26.3 },
  { uni: 'ĐH Bách Khoa Hà Nội', code: 'BKA', city: 'Hà Nội', major: 'Kỹ thuật điều khiển - Tự động hóa', combo: 'A00', s2024: 24.75, s2025: 25.6 },
  { uni: 'ĐH Bách Khoa TP.HCM', code: 'QSB', city: 'TP.HCM', major: 'Khoa học máy tính', combo: 'A00/A01', s2024: 26.0, s2025: 26.8 },
  { uni: 'ĐH Bách Khoa TP.HCM', code: 'QSB', city: 'TP.HCM', major: 'Kỹ thuật điện tử - Viễn thông', combo: 'A00', s2024: 24.5, s2025: 25.3 },
  { uni: 'ĐH Công nghệ - ĐHQGHN', code: 'QHT', city: 'Hà Nội', major: 'Khoa học máy tính', combo: 'A00/A01', s2024: 25.9, s2025: 26.6 },
  { uni: 'Học viện Công nghệ Bưu chính Viễn thông', code: 'PTT', city: 'Hà Nội', major: 'CNTT (Đông Đô)', combo: 'A00/A01', s2024: 24.0, s2025: 24.8 },

  // — Kinh tế —
  { uni: 'ĐH Kinh tế Quốc dân', code: 'NEU', city: 'Hà Nội', major: 'Kinh tế đầu tư', combo: 'A00/D01', s2024: 26.25, s2025: 27.0 },
  { uni: 'ĐH Kinh tế Quốc dân', code: 'NEU', city: 'Hà Nội', major: 'Kế toán', combo: 'A00/D01', s2024: 25.1, s2025: 25.9 },
  { uni: 'ĐH Ngoại thương', code: 'FTU', city: 'Hà Nội', major: 'Kinh tế đối ngoại', combo: 'A00/D01/D07', s2024: 26.55, s2025: 27.15 },
  { uni: 'ĐH Ngoại thương', code: 'FTU', city: 'Hà Nội', major: 'Thương mại quốc tế', combo: 'A00/D01', s2024: 25.8, s2025: 26.5 },
  { uni: 'ĐH Kinh tế TP.HCM (UEH)', code: 'UEH', city: 'TP.HCM', major: 'Kinh tế', combo: 'A00/D01', s2024: 25.2, s2025: 25.95 },
  { uni: 'Học viện Ngân hàng', code: 'BHN', city: 'Hà Nội', major: 'Tài chính - Ngân hàng', combo: 'A00/D01', s2024: 24.3, s2025: 25.0 },

  // — Luật — Ngoại giao — Ngôn ngữ —
  { uni: 'ĐH Luật Hà Nội', code: 'LHA', city: 'Hà Nội', major: 'Luật', combo: 'C00/D01', s2024: 24.6, s2025: 25.3 },
  { uni: 'Học viện Ngoại giao', code: 'DAV', city: 'Hà Nội', major: 'Quan hệ quốc tế', combo: 'D01/D14', s2024: 26.0, s2025: 26.7 },
  { uni: 'ĐH Ngoại ngữ - ĐHQGHN', code: 'QHF', city: 'Hà Nội', major: 'Ngôn ngữ Anh', combo: 'D01', s2024: 25.75, s2025: 26.4 },

  // — Sư phạm — Khoa học cơ bản —
  { uni: 'ĐH Sư phạm Hà Nội', code: 'HNU', city: 'Hà Nội', major: 'GD Tiểu học', combo: 'C19/C20', s2024: 24.5, s2025: 25.1 },
  { uni: 'ĐH Khoa học Tự nhiên - ĐHQGHN', code: 'QHS', city: 'Hà Nội', major: 'Hóa học (CLC)', combo: 'B00/A00', s2024: 22.5, s2025: 23.4 },
  { uni: 'ĐH Khoa học Tự nhiên TP.HCM', code: 'QST', city: 'TP.HCM', major: 'Khoa học máy tính', combo: 'A00/A01', s2024: 24.8, s2025: 25.5 },

  // — Tư thục —
  { uni: 'ĐH FPT', code: 'FPT', city: 'Hà Nội / HCM / ĐN', major: 'CNTT (Kỹ thuật phần mềm)', combo: 'Thi ĐGTD của trường', s2024: 20.0, s2025: 20.5 },
  { uni: 'ĐH RMIT Việt Nam', code: 'RMI', city: 'TP.HCM', major: 'Khoa học máy tính', combo: 'Xét học bạ/IELTS', s2024: null, s2025: null },
];

export const CITIES = ['Tất cả', 'Hà Nội', 'TP.HCM', 'Hà Nội / HCM / ĐN'];
