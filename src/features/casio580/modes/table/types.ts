import { CalculationResult } from '../../engine/result';

/**
 * Kiểu cài đặt hàm trong bảng giá trị (Table Type)
 * F_ONLY: Chỉ tính f(x) (tối đa 45 dòng)
 * F_AND_G: Tính đồng thời f(x) và g(x) (tối đa 30 dòng)
 */
export type TableType = 'F_ONLY' | 'F_AND_G';

/**
 * Cấu hình dải giá trị tạo bảng (Table Range)
 */
export interface TableRange {
  start: number; // Giá trị bắt đầu
  end: number;   // Giá trị kết thúc
  step: number;  // Bước nhảy (> 0)
}

/**
 * Ô giá trị trong bảng
 */
export interface TableCell {
  value: CalculationResult | null;
  displayText: string;
  isError: boolean;
}

/**
 * Một dòng dữ liệu trong bảng giá trị
 */
export interface TableRow {
  rowNumber: number; // 1, 2, 3...
  x: TableCell;
  f?: TableCell;
  g?: TableCell;
}

/**
 * Kết quả sinh bảng giá trị
 */
export interface TableResult {
  rows: TableRow[];
  totalRows: number;
  tableType: TableType;
  functionF: string;
  functionG?: string;
  range: TableRange;
}
