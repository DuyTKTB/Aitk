/* ============================================================
   elementOfDay.js — re-export từ elements.js (nguồn dữ liệu duy nhất)
   ------------------------------------------------------------
   Bản cũ tìm nguyên tố bằng e.symbol nhưng elements.js dùng khóa `s`,
   nên ELEMENTS_THPT luôn rỗng. Nay elements.js có cả hai kiểu khóa.
   ============================================================ */
export {
  ELEMENTS,
  ELEMENTS_THPT,
  elementOfDay,
  dayOfYear,
  findElement,
} from './elements.js';
