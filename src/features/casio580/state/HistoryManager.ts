import { HistoryEntry } from './types';
import { sanitizeUserExpression } from './security';

export const DEFAULT_MAX_HISTORY = 50;

/**
 * Quản lý lịch sử tính toán dạng Replay Buffer (Casio ClassWiz Replay Function)
 * Tái hiện chính xác cơ chế duyệt lịch sử bằng các phím điều hướng Lên (▲) và Xuống (▼)
 */
export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private currentIndex: number = -1; // -1: đang ở vùng đệm mới nhất
  private maxCapacity: number;

  constructor(maxCapacity: number = DEFAULT_MAX_HISTORY) {
    this.maxCapacity = Math.max(1, maxCapacity);
  }

  /**
   * Thêm một phép tính mới vào lịch sử
   */
  public addEntry(expression: string, result: string): HistoryEntry {
    const cleanExpr = sanitizeUserExpression(expression.trim());
    const cleanRes = sanitizeUserExpression(result.trim());

    if (cleanExpr === '') {
      return this.entries[this.entries.length - 1] || null;
    }

    const entry: HistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      expression: cleanExpr,
      result: cleanRes,
      timestamp: Date.now()
    };

    this.entries.push(entry);

    // Duy trì giới hạn dung lượng vòng (Ring buffer)
    if (this.entries.length > this.maxCapacity) {
      this.entries.shift();
    }

    // Reset con trỏ điều hướng về trạng thái hiện tại
    this.currentIndex = -1;
    return entry;
  }

  /**
   * Điều hướng lên (Phím ▲): Duyệt về các phép tính cũ hơn
   */
  public navigateUp(): HistoryEntry | null {
    if (this.entries.length === 0) {
      return null;
    }

    if (this.currentIndex === -1) {
      // Bắt đầu duyệt từ phép tính mới nhất
      this.currentIndex = this.entries.length - 1;
    } else if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      // Đã chạm đáy mục cũ nhất
      return this.entries[0];
    }

    return this.entries[this.currentIndex];
  }

  /**
   * Điều hướng xuống (Phím ▼): Duyệt về các phép tính mới hơn
   */
  public navigateDown(): HistoryEntry | null {
    if (this.entries.length === 0 || this.currentIndex === -1) {
      return null;
    }

    if (this.currentIndex < this.entries.length - 1) {
      this.currentIndex++;
      return this.entries[this.currentIndex];
    } else {
      // Đã vượt qua mục mới nhất, trở về màn hình nhập liệu trống hiện tại
      this.currentIndex = -1;
      return null;
    }
  }

  /**
   * Lấy mục lịch sử tại vị trí con trỏ hiện tại
   */
  public getCurrentEntry(): HistoryEntry | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.entries.length) {
      return this.entries[this.currentIndex];
    }
    return null;
  }

  /**
   * Trả con trỏ duyệt về trạng thái nhập mới
   */
  public resetNavigation(): void {
    this.currentIndex = -1;
  }

  /**
   * Kiểm tra có thể cuộn lên (icon ▲ trên LCD)
   */
  public canScrollUp(): boolean {
    if (this.entries.length === 0) return false;
    if (this.currentIndex === -1) return true;
    return this.currentIndex > 0;
  }

  /**
   * Kiểm tra có thể cuộn xuống (icon ▼ trên LCD)
   */
  public canScrollDown(): boolean {
    if (this.entries.length === 0) return false;
    return this.currentIndex !== -1;
  }

  public getCount(): number {
    return this.entries.length;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getAll(): HistoryEntry[] {
    return [...this.entries];
  }

  public clear(): void {
    this.entries = [];
    this.currentIndex = -1;
  }

  /**
   * Nạp danh sách lịch sử từ lưu trữ ngoài (có kiểm tra dữ liệu hợp lệ)
   */
  public loadEntries(rawList: unknown): void {
    this.clear();
    if (!Array.isArray(rawList)) return;

    for (const item of rawList) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as any).expression === 'string' &&
        typeof (item as any).result === 'string'
      ) {
        const expr = sanitizeUserExpression((item as any).expression);
        const res = sanitizeUserExpression((item as any).result);
        const time = typeof (item as any).timestamp === 'number' ? (item as any).timestamp : Date.now();

        if (expr.length > 0) {
          this.entries.push({
            id: `hist_${time}_${Math.random().toString(36).substring(2, 7)}`,
            expression: expr,
            result: res,
            timestamp: time
          });
        }
      }
    }

    // Giữ trong giới hạn dung lượng
    if (this.entries.length > this.maxCapacity) {
      this.entries = this.entries.slice(this.entries.length - this.maxCapacity);
    }
  }
}
