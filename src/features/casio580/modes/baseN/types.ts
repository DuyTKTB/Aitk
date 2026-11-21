/**
 * Các hệ cơ số được hỗ trợ trong Mode 3 (Base-N) của Casio fx-580VN X
 */
export type NumberBase = 'DEC' | 'HEX' | 'BIN' | 'OCT';

/**
 * Các toán tử logic / bitwise trong Base-N
 */
export type BaseNLogicOp = 'and' | 'or' | 'xor' | 'xnor' | 'not' | 'neg';

/**
 * Kết quả tính toán Base-N ở cả 4 hệ cơ số
 */
export interface BaseNResult {
  value: bigint;              // Giá trị số nguyên có dấu 32-bit (-2^31 đến 2^31 - 1)
  currentBase: NumberBase;    // Cơ số đang chọn
  displayText: string;        // Chuỗi hiển thị theo cơ số hiện tại
  representations: {
    dec: string;
    hex: string;
    bin: string;
    oct: string;
  };
}
