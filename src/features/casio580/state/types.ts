import { DisplayState } from '../types/state';
import { AngleUnit } from '../engine/trig';
import { DisplayMode } from '../engine/result';

/**
 * Một mục ghi trong lịch sử tính toán (Replay History Entry)
 */
export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

/**
 * Cấu hình thiết lập hệ thống (Setup Configuration)
 */
export interface SetupConfig {
  angleUnit: AngleUnit;
  displayMode: DisplayMode;
  fixSciDigits?: number;
  naturalDisplay: boolean;
}

/**
 * Định dạng dữ liệu lưu trữ cố định vào LocalStorage (Persistent State Payload)
 */
export interface PersistentStatePayload {
  version: number;
  timestamp: number;
  variables: Record<string, string>;
  setup: SetupConfig;
  history: Array<{
    expression: string;
    result: string;
    timestamp: number;
  }>;
  currentMode: string;
}

/**
 * Trạng thái toàn cục thống nhất của ứng dụng (Unified App State)
 */
export interface AppState {
  display: DisplayState;
  variables: Record<string, string>;
  setup: SetupConfig;
  historyCount: number;
  historyIndex: number; // -1 nếu đang ở biểu thức hiện tại, >= 0 nếu đang duyệt lịch sử
}
