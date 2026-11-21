/**
 * Định nghĩa trạng thái hiển thị và cờ điều khiển của máy tính Casio fx-580VN X
 */

export type ModifierMode = 'NORMAL' | 'SHIFT' | 'ALPHA';

export interface StatusFlags {
  shift: boolean;             // Icon 'S'
  alpha: boolean;             // Icon 'A'
  angleUnit: 'D' | 'R' | 'G'; // Đơn vị đo góc: Degree, Radian, Gradian
  fix: boolean;               // Cố định số chữ số thập phân
  sci: boolean;               // Ký pháp khoa học
  math: boolean;              // Chế độ hiển thị tự nhiên (Natural Textbook Display)
  hasMemory: boolean;         // Biểu tượng 'M' khi biến M khác 0
  scrollUp: boolean;          // Icon mũi tên lên (có lịch sử phía trước)
  scrollDown: boolean;        // Icon mũi tên xuống (có lịch sử phía sau)
}

export interface DisplayState {
  /** Biểu thức người dùng đang nhập */
  expression: string;
  /** Vị trí con trỏ nhấp nháy trong chuỗi biểu thức (0 <= cursor <= expression.length) */
  cursorPosition: number;
  /** Chuỗi kết quả tính toán hiển thị ở góc dưới bên phải (hoặc null nếu chưa ấn =) */
  result: string | null;
  /** Các cờ trạng thái biểu tượng phía trên màn hình */
  statusFlags: StatusFlags;
  /** Tên chế độ tính toán hiện tại (mặc định 'COMP') */
  currentMode: string;
  /** Cờ trạng thái đang mở menu chọn chế độ tính toán */
  isMenuOpen?: boolean;
  /** Thông báo tạm thời (ví dụ: 'Not Supported', 'Ans → A') */
  notification?: string | null;
}
