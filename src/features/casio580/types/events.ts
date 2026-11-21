import { ModifierMode } from './state';

/**
 * Định nghĩa hành vi ngữ nghĩa của phím bấm
 */
export type KeyActionType =
  | 'CHAR'            // Ký tự thông thường (chữ số, dấu phép tính, ký hiệu)
  | 'FUNCTION'        // Hàm toán học mở ngoặc (sin(, cos(, sqrt(, ln()
  | 'BLOCK'           // Khối cấu trúc 2D (phân số, lũy thừa, tích phân)
  | 'MODIFIER'        // Phím đổi trạng thái (SHIFT, ALPHA)
  | 'NAV'             // Phím điều hướng con trỏ (UP, DOWN, LEFT, RIGHT)
  | 'SYSTEM'          // Phím hệ thống máy tính (ON, AC, DEL, MENU, OPTN)
  | 'EXECUTE';        // Phím tính kết quả (=)

export interface KeyAction {
  type: KeyActionType;
  /** Giá trị chèn vào biểu thức hoặc lệnh điều khiển */
  value: string;
  /** Tên hành động hoặc nhãn mô tả */
  label: string;
}

/**
 * Sự kiện đầu vào chuẩn hóa (Normalized Input Event)
 * Đảm bảo Mouse Click, Touch và PC Keyboard tạo ra cấu trúc dữ liệu đồng nhất
 */
export interface NormalizedInputEvent {
  /** Mã phím chuẩn Casio (ví dụ: 'KEY_7', 'KEY_SHIFT', 'KEY_AC', 'KEY_PLUS') */
  keyId: string;
  /** Chỉ số phím từ 0 đến 49 */
  keyIndex: number;
  /** Trạng thái modifier khi kích hoạt: NORMAL / SHIFT / ALPHA */
  modifier: ModifierMode;
  /** Hành động ngữ nghĩa tương ứng */
  action: KeyAction;
  /** Nguồn kích hoạt sự kiện */
  source: 'MOUSE' | 'TOUCH' | 'KEYBOARD';
  /** Thời điểm xảy ra sự kiện */
  timestamp: number;
}
