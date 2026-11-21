/**
 * Định nghĩa thông tin phím bấm của Casio fx-580VN X
 * Trích xuất trực tiếp từ bảng 50 phím trong CLASSWIZ_P20.dll tại VA 0x10004010
 */

export interface KeyDefinition {
  /** Chỉ số phím từ 0 đến 49 */
  index: number;
  /** Tên định danh phím (Unicode) */
  id: string;
  /** Nhãn hiển thị chính trên mặt phím (Normal label) */
  label: string;
  /** Nhãn hiển thị chức năng phụ màu vàng (Shift label) */
  shiftLabel?: string;
  /** Nhãn hiển thị chức năng phụ màu đỏ (Alpha label) */
  alphaLabel?: string;
  /** Ký tự phím tắt bàn phím PC từ CLASSWIZ_P20.dll */
  pcShortcut: string;
  /** Mã quét ma trận phần cứng: Hàng (Row bitmask) */
  matrixRow: number;
  /** Mã quét ma trận phần cứng: Cột (Col bitmask) */
  matrixCol: number;
  /** Tọa độ pixel vẽ X trên thân máy gốc */
  x: number;
  /** Tọa độ pixel vẽ Y trên thân máy gốc */
  y: number;
  /** Kích thước phím rộng (Width) */
  w: number;
  /** Kích thước phím cao (Height) */
  h: number;
  /** Nhóm phân loại phím (dùng cho CSS styling & bố cục) */
  group: 'func-top' | 'dpad' | 'func-scientific' | 'func-mid' | 'keypad-num' | 'keypad-action';
}
