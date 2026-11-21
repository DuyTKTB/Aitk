import { ModifierMode } from '../types/state';

export type ModifierChangeListener = (mode: ModifierMode) => void;

/**
 * Máy trạng thái hữu hạn (FSM) quản lý các phím bổ trợ SHIFT và ALPHA
 * Tuân thủ đúng hành vi phần cứng Casio:
 * - Bấm SHIFT: Bật cờ S, bấm tiếp SHIFT hủy cờ
 * - Bấm ALPHA: Bật cờ A, bấm tiếp ALPHA hủy cờ
 * - Bấm phím chức năng bất kỳ khi đang bật SHIFT/ALPHA: Sau khi thực thi, tự động hoàn trả về NORMAL
 */
export class ShiftAlphaFSM {
  private currentMode: ModifierMode = 'NORMAL';
  private listeners: ModifierChangeListener[] = [];

  constructor(initialMode: ModifierMode = 'NORMAL') {
    this.currentMode = initialMode;
  }

  public getMode(): ModifierMode {
    return this.currentMode;
  }

  public isShift(): boolean {
    return this.currentMode === 'SHIFT';
  }

  public isAlpha(): boolean {
    return this.currentMode === 'ALPHA';
  }

  public subscribe(listener: ModifierChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentMode);
    }
  }

  /**
   * Xử lý khi nhấn phím SHIFT
   */
  public handleShiftPress(): ModifierMode {
    if (this.currentMode === 'SHIFT') {
      this.currentMode = 'NORMAL';
    } else {
      this.currentMode = 'SHIFT';
    }
    this.notify();
    return this.currentMode;
  }

  /**
   * Xử lý khi nhấn phím ALPHA
   */
  public handleAlphaPress(): ModifierMode {
    if (this.currentMode === 'ALPHA') {
      this.currentMode = 'NORMAL';
    } else {
      this.currentMode = 'ALPHA';
    }
    this.notify();
    return this.currentMode;
  }

  /**
   * Tiêu thụ modifier sau khi người dùng bấm một phím thông thường
   * Tự động trả về NORMAL nếu đang ở SHIFT hoặc ALPHA
   */
  public consumeAfterAction(): void {
    if (this.currentMode !== 'NORMAL') {
      this.currentMode = 'NORMAL';
      this.notify();
    }
  }

  /**
   * Xóa toàn bộ trạng thái modifier về mặc định (dùng khi bấm AC hoặc ON)
   */
  public reset(): void {
    if (this.currentMode !== 'NORMAL') {
      this.currentMode = 'NORMAL';
      this.notify();
    }
  }
}
