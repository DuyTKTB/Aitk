import { DisplayState, StatusFlags } from '../types/state';
import { AppState, SetupConfig, PersistentStatePayload } from './types';
import { MemoryStore } from './MemoryStore';
import { HistoryManager } from './HistoryManager';
import { StorageManager, CURRENT_STATE_VERSION } from './StorageAdapter';
import { CalculationResult } from '../engine/result';

export type StateListener = (state: AppState) => void;

/**
 * Nguồn trạng thái thống nhất (Single Source of Truth) của ứng dụng Casio fx-580VN X
 * Điều phối:
 * - Trạng thái hiển thị giao diện (DisplayState)
 * - Bộ nhớ tính toán độc lập (MemoryStore: A-F, x, y, M, Ans)
 * - Lịch sử tính toán (HistoryManager)
 * - Cài đặt hệ thống (SetupConfig)
 * - Lưu trữ cố định (StorageManager)
 */
export class StateManager {
  private displayState: DisplayState;
  private memoryStore: MemoryStore;
  private historyManager: HistoryManager;
  private setupConfig: SetupConfig;
  private storageManager: StorageManager;
  private listeners: StateListener[] = [];

  constructor(
    memoryStore?: MemoryStore,
    historyManager?: HistoryManager,
    storageManager?: StorageManager
  ) {
    this.memoryStore = memoryStore || new MemoryStore();
    this.historyManager = historyManager || new HistoryManager();
    this.storageManager = storageManager || new StorageManager();

    this.setupConfig = {
      angleUnit: 'DEG',
      displayMode: 'NORM1',
      naturalDisplay: true
    };

    this.displayState = {
      expression: '',
      cursorPosition: 0,
      result: null,
      statusFlags: {
        shift: false,
        alpha: false,
        angleUnit: 'D',
        fix: false,
        sci: false,
        math: true,
        hasMemory: false,
        scrollUp: false,
        scrollDown: false
      },
      currentMode: 'COMP'
    };

    // Tự động khôi phục dữ liệu từ lưu trữ
    this.loadFromStorage();
  }

  public getDisplayState(): DisplayState {
    return {
      ...this.displayState,
      statusFlags: { ...this.displayState.statusFlags }
    };
  }

  public getMemoryStore(): MemoryStore {
    return this.memoryStore;
  }

  public getHistoryManager(): HistoryManager {
    return this.historyManager;
  }

  public getSetupConfig(): SetupConfig {
    return { ...this.setupConfig };
  }

  public getAppState(): AppState {
    return {
      display: this.getDisplayState(),
      variables: this.memoryStore.exportRecord(),
      setup: this.getSetupConfig(),
      historyCount: this.historyManager.getCount(),
      historyIndex: this.historyManager.getCurrentIndex()
    };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const snap = this.getAppState();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  // --- Cập nhật DisplayState ---
  public setExpression(expression: string, cursorPosition?: number): void {
    this.displayState.expression = expression;
    this.displayState.cursorPosition =
      cursorPosition !== undefined ? cursorPosition : expression.length;
    this.notify();
  }

  public setCursorPosition(pos: number): void {
    this.displayState.cursorPosition = Math.max(0, Math.min(this.displayState.expression.length, pos));
    this.notify();
  }

  public setResult(result: string | null): void {
    this.displayState.result = result;
    this.notify();
  }

  public setMode(mode: string): void {
    this.displayState.currentMode = mode;
    this.displayState.expression = '';
    this.displayState.cursorPosition = 0;
    this.displayState.result = null;
    this.historyManager.resetNavigation();
    this.updateScrollFlags();
    this.notify();
    this.saveToStorage();
  }

  public setStatusFlags(flags: Partial<StatusFlags>): void {
    this.displayState.statusFlags = {
      ...this.displayState.statusFlags,
      ...flags
    };
    this.notify();
  }

  // --- Cập nhật Cài đặt Setup ---
  public setSetup(config: Partial<SetupConfig>): void {
    this.setupConfig = {
      ...this.setupConfig,
      ...config
    };

    // Đồng bộ sang cờ statusFlags của màn hình
    if (config.angleUnit) {
      const mapUnit = { DEG: 'D', RAD: 'R', GRA: 'G' } as const;
      this.displayState.statusFlags.angleUnit = mapUnit[config.angleUnit];
    }
    if (config.displayMode) {
      this.displayState.statusFlags.fix = config.displayMode === 'FIX';
      this.displayState.statusFlags.sci = config.displayMode === 'SCI';
    }
    if (config.naturalDisplay !== undefined) {
      this.displayState.statusFlags.math = config.naturalDisplay;
    }

    this.notify();
    this.saveToStorage();
  }

  // --- Ghi nhận kết quả tính toán & Lịch sử ---
  public recordCalculation(expression: string, result: string, calcResult?: CalculationResult): void {
    if (expression.trim() === '') return;

    // 1. Cập nhật biến Ans trong MemoryStore
    if (calcResult) {
      this.memoryStore.setVariable('ANS', calcResult);
    }

    // 2. Thêm vào Lịch sử
    this.historyManager.addEntry(expression, result);

    // 3. Cập nhật trạng thái hiển thị
    this.displayState.result = result;
    this.updateScrollFlags();
    this.syncMemoryFlag();

    this.notify();
    this.saveToStorage();
  }

  // --- Điều hướng lịch sử (Phím ▲ và ▼) ---
  public navigateHistoryUp(): boolean {
    const entry = this.historyManager.navigateUp();
    if (entry) {
      this.displayState.expression = entry.expression;
      this.displayState.cursorPosition = entry.expression.length;
      this.displayState.result = entry.result;
      this.updateScrollFlags();
      this.notify();
      return true;
    }
    return false;
  }

  public navigateHistoryDown(): boolean {
    const entry = this.historyManager.navigateDown();
    if (entry) {
      this.displayState.expression = entry.expression;
      this.displayState.cursorPosition = entry.expression.length;
      this.displayState.result = entry.result;
    } else {
      // Đã thoát khỏi lịch sử, trở về biểu thức nhập mới
      this.displayState.expression = '';
      this.displayState.cursorPosition = 0;
      this.displayState.result = null;
    }
    this.updateScrollFlags();
    this.notify();
    return true;
  }

  public clearHistory(): void {
    this.historyManager.clear();
    this.updateScrollFlags();
    this.notify();
    this.saveToStorage();
  }

  public resetAll(): void {
    this.memoryStore.resetAll();
    this.historyManager.clear();
    this.setupConfig = {
      angleUnit: 'DEG',
      displayMode: 'NORM1',
      naturalDisplay: true
    };
    this.displayState = {
      expression: '',
      cursorPosition: 0,
      result: null,
      statusFlags: {
        shift: false,
        alpha: false,
        angleUnit: 'D',
        fix: false,
        sci: false,
        math: true,
        hasMemory: false,
        scrollUp: false,
        scrollDown: false
      },
      currentMode: 'COMP'
    };
    this.storageManager.clearState();
    this.notify();
  }

  // --- Đồng bộ cờ và lưu trữ ---
  public syncMemoryFlag(): void {
    this.displayState.statusFlags.hasMemory = this.memoryStore.hasMemory();
  }

  private updateScrollFlags(): void {
    this.displayState.statusFlags.scrollUp = this.historyManager.canScrollUp();
    this.displayState.statusFlags.scrollDown = this.historyManager.canScrollDown();
  }

  public saveToStorage(): boolean {
    const payload: PersistentStatePayload = {
      version: CURRENT_STATE_VERSION,
      timestamp: Date.now(),
      variables: this.memoryStore.exportRecord(),
      setup: this.getSetupConfig(),
      history: this.historyManager.getAll().map((h) => ({
        expression: h.expression,
        result: h.result,
        timestamp: h.timestamp
      })),
      currentMode: this.displayState.currentMode
    };

    return this.storageManager.saveState(payload);
  }

  public loadFromStorage(): boolean {
    const payload = this.storageManager.loadState();
    if (!payload) return false;

    // 1. Khôi phục biến
    this.memoryStore.importRecord(payload.variables);
    this.syncMemoryFlag();

    // 2. Khôi phục Setup
    this.setSetup(payload.setup);

    // 3. Khôi phục Lịch sử
    this.historyManager.loadEntries(payload.history);
    this.updateScrollFlags();

    // 4. Khôi phục Chế độ
    if (payload.currentMode) {
      this.displayState.currentMode = payload.currentMode;
    }

    this.notify();
    return true;
  }
}
