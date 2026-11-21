/**
 * Module bảo mật dữ liệu và phòng chống tấn công XSS (Cross-Site Scripting)
 * Đảm bảo các biểu thức và kết quả do người dùng nhập hoặc khôi phục từ lưu trữ
 * không bao giờ có thể thực thi mã độc trong DOM
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;'
};

/**
 * Chuyển đổi các ký tự nguy hiểm sang HTML entities an toàn
 */
export function escapeHtml(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[&<>"'`/]/g, (match) => HTML_ENTITY_MAP[match] || match);
}

/**
 * Lọc sạch các ký tự điều khiển (Control Characters), Null bytes, thẻ HTML
 * Giữ lại các ký tự toán học, chữ số, dấu câu và khoảng trắng hợp lệ
 */
export function sanitizeUserExpression(raw: string): string {
  if (typeof raw !== 'string') return '';

  // 1. Loại bỏ ký tự null byte và control characters không in được (ngoại trừ xuống dòng/tab)
  let clean = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Chặn các thẻ script và javascript pseudo-protocol
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/on\w+\s*=/gi, '');

  return clean;
}

/**
 * Kiểm tra xem chuỗi có chứa payload nguy hiểm tiềm ẩn hay không
 */
export function isSafeString(text: string): boolean {
  if (typeof text !== 'string') return true;
  // Chặn thẻ <script>, các thuộc tính sự kiện onload=, onerror=, v.v.
  const dangerousPattern = /<[^>]*script|javascript:|on\w+\s*=/i;
  return !dangerousPattern.test(text);
}
