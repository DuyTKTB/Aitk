/* ============================================================
   universityCovers.js — BỘ ẢNH BÌA KHUÔN VIÊN CÁC TRƯỜNG ĐẠI HỌC
   ------------------------------------------------------------
   Phục vụ hiển thị Banner Nguyện vọng 1 & Thẻ Nguyện vọng ELEC AI:
   Mỗi trường ĐH có ảnh khuôn viên thực tế chất lượng cao, lưu cục bộ
   trong public/img/universities/ đảm bảo tốc độ tải tức thì & offline.
   ============================================================ */

export const UNIVERSITY_COVERS = {
  // Học viện An ninh Nhân dân (Mặc định chuẩn ANND)
  ANND: {
    code: 'ANND',
    name: 'Học Viện An Ninh Nhân Dân',
    cover: '/img/universities/annd.webp',
    fallbackCover: '/img/universities/annd.jpg',
    accentColor: '#1d4ed8',
    location: 'Hà Đông, Hà Nội',
  },
  // Đại học Bách Khoa Hà Nội
  BKA: {
    code: 'BKA',
    name: 'Đại Học Bách Khoa Hà Nội',
    cover: '/img/universities/bka.webp',
    fallbackCover: '/img/universities/bka.jpg',
    accentColor: '#b91c1c',
    location: 'Hai Bà Trưng, Hà Nội',
  },
  HUST: {
    code: 'HUST',
    name: 'Đại Học Bách Khoa Hà Nội',
    cover: '/img/universities/bka.webp',
    fallbackCover: '/img/universities/bka.jpg',
    accentColor: '#b91c1c',
    location: 'Hai Bà Trưng, Hà Nội',
  },
  // Đại học Kinh Tế Quốc Dân
  NEU: {
    code: 'NEU',
    name: 'Đại Học Kinh Tế Quốc Dân',
    cover: '/img/universities/neu.webp',
    fallbackCover: '/img/universities/neu.jpg',
    accentColor: '#0284c7',
    location: 'Hai Bà Trưng, Hà Nội',
  },
  // Đại học Ngoại Thương
  FTU: {
    code: 'FTU',
    name: 'Đại Học Ngoại Thương',
    cover: '/img/universities/ftu.webp',
    fallbackCover: '/img/universities/ftu.jpg',
    accentColor: '#b91c1c',
    location: 'Đống Đa, Hà Nội',
  },
  // Đại học Y Hà Nội
  YHA: {
    code: 'YHA',
    name: 'Đại Học Y Hà Nội',
    cover: '/img/universities/yha.webp',
    fallbackCover: '/img/universities/yha.jpg',
    accentColor: '#059669',
    location: 'Đống Đa, Hà Nội',
  },
  HMU: {
    code: 'HMU',
    name: 'Đại Học Y Hà Nội',
    cover: '/img/universities/yha.webp',
    fallbackCover: '/img/universities/yha.jpg',
    accentColor: '#059669',
    location: 'Đống Đa, Hà Nội',
  },
  // Đại học Sư Phạm Hà Nội
  HNUE: {
    code: 'HNUE',
    name: 'Đại Học Sư Phạm Hà Nội',
    cover: '/img/universities/hnue.webp',
    fallbackCover: '/img/universities/hnue.jpg',
    accentColor: '#2563eb',
    location: 'Cầu Giấy, Hà Nội',
  },
  // Đại học Bách Khoa TP.HCM
  QSB: {
    code: 'QSB',
    name: 'Đại Học Bách Khoa TP.HCM',
    cover: '/img/universities/qsb.webp',
    fallbackCover: '/img/universities/qsb.jpg',
    accentColor: '#0284c7',
    location: 'Quận 10, TP.HCM',
  },
  HCMUT: {
    code: 'HCMUT',
    name: 'Đại Học Bách Khoa TP.HCM',
    cover: '/img/universities/qsb.webp',
    fallbackCover: '/img/universities/qsb.jpg',
    accentColor: '#0284c7',
    location: 'Quận 10, TP.HCM',
  },
};

/**
 * Lấy URL ảnh bìa trường ĐH theo mã trường (code).
 * Nếu không có mã hoặc chưa có ảnh riêng thì fallback về ANND (chuẩn 9Study).
 */
export function getUniversityCover(schoolCode) {
  if (!schoolCode) return UNIVERSITY_COVERS.ANND.cover;
  const key = String(schoolCode).trim().toUpperCase();
  if (UNIVERSITY_COVERS[key]) {
    return UNIVERSITY_COVERS[key].cover;
  }
  return UNIVERSITY_COVERS.ANND.cover;
}

/**
 * Lấy toàn bộ thông tin trường ĐH bao gồm ảnh và màu sắc chủ đạo
 */
export function getUniversityInfo(schoolCode) {
  if (!schoolCode) return UNIVERSITY_COVERS.ANND;
  const key = String(schoolCode).trim().toUpperCase();
  return UNIVERSITY_COVERS[key] || UNIVERSITY_COVERS.ANND;
}
