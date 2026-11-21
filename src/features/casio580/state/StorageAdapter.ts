import { PersistentStatePayload } from './types';
import { isSafeString } from './security';

export const CURRENT_STATE_VERSION = 1;
export const DEFAULT_STORAGE_KEY = 'casio_fx580vnx_state_v1';

export interface IStorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Backend lưu trữ trong bộ nhớ RAM (cho Node/Unit tests hoặc fallback khi localStorage bị chặn)
 */
export class MemoryStorageBackend implements IStorageBackend {
  private store: Map<string, string> = new Map();

  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  public removeItem(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

/**
 * Backend sử dụng localStorage của trình duyệt với cơ chế bắt lỗi an toàn:
 * - Xử lý QuotaExceededError (tràn bộ nhớ trình duyệt)
 * - Xử lý SecurityError (trình duyệt ẩn danh chặn truy cập cookies/storage)
 * - Tự động fallback sang MemoryStorageBackend nếu xảy ra lỗi
 */
export class LocalStorageBackend implements IStorageBackend {
  private fallback: MemoryStorageBackend = new MemoryStorageBackend();
  private isLocalStorageAvailable: boolean;

  constructor() {
    this.isLocalStorageAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      const testKey = '__casio_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public getItem(key: string): string | null {
    if (!this.isLocalStorageAvailable) {
      return this.fallback.getItem(key);
    }
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn('[LocalStorageBackend] Failed to getItem, falling back to memory:', e);
      return this.fallback.getItem(key);
    }
  }

  public setItem(key: string, value: string): void {
    if (!this.isLocalStorageAvailable) {
      this.fallback.setItem(key, value);
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[LocalStorageBackend] Failed to setItem (Quota or Security), falling back to memory:', e);
      this.fallback.setItem(key, value);
    }
  }

  public removeItem(key: string): void {
    if (!this.isLocalStorageAvailable) {
      this.fallback.removeItem(key);
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      this.fallback.removeItem(key);
    }
  }

  public clear(): void {
    if (!this.isLocalStorageAvailable) {
      this.fallback.clear();
      return;
    }
    try {
      window.localStorage.clear();
    } catch {
      this.fallback.clear();
    }
  }
}

/**
 * Quản lý lưu trữ trạng thái có cấu trúc, xác thực schema và chống tấn công XSS
 */
export class StorageManager {
  private backend: IStorageBackend;
  private storageKey: string;

  constructor(backend?: IStorageBackend, storageKey: string = DEFAULT_STORAGE_KEY) {
    this.backend = backend || (typeof window !== 'undefined' ? new LocalStorageBackend() : new MemoryStorageBackend());
    this.storageKey = storageKey;
  }

  /**
   * Lưu trữ payload trạng thái vào storage
   */
  public saveState(payload: PersistentStatePayload): boolean {
    try {
      const json = JSON.stringify(payload);
      this.backend.setItem(this.storageKey, json);
      return true;
    } catch (e) {
      console.warn('[StorageManager] saveState error:', e);
      return false;
    }
  }

  /**
   * Đọc và xác thực schema trạng thái từ storage
   * Tự động bỏ qua và xóa dữ liệu nếu phát hiện cấu trúc không hợp lệ hoặc bị can thiệp
   */
  public loadState(): PersistentStatePayload | null {
    try {
      const raw = this.backend.getItem(this.storageKey);
      if (!raw) return null;

      // Chống XSS sơ bộ trước khi parse
      if (!isSafeString(raw)) {
        console.warn('[StorageManager] Dangerous payload detected in storage, discarding');
        this.clearState();
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!this.validatePayloadSchema(parsed)) {
        console.warn('[StorageManager] Invalid schema in stored state, discarding');
        this.clearState();
        return null;
      }

      return parsed as PersistentStatePayload;
    } catch (e) {
      console.warn('[StorageManager] loadState parse error:', e);
      this.clearState();
      return null;
    }
  }

  public clearState(): void {
    try {
      this.backend.removeItem(this.storageKey);
    } catch {
      // Ignored
    }
  }

  /**
   * Xác thực cấu trúc dữ liệu nghiêm ngặt
   */
  public validatePayloadSchema(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    // 1. Kiểm tra version
    if (typeof data.version !== 'number' || data.version !== CURRENT_STATE_VERSION) {
      return false;
    }

    // 2. Kiểm tra variables
    if (!data.variables || typeof data.variables !== 'object' || Array.isArray(data.variables)) {
      return false;
    }
    for (const [key, val] of Object.entries(data.variables)) {
      if (typeof key !== 'string' || typeof val !== 'string') return false;
      if (!isSafeString(val)) return false;
    }

    // 3. Kiểm tra setup
    if (!data.setup || typeof data.setup !== 'object') return false;
    const validAngles = ['DEG', 'RAD', 'GRA'];
    const validDisplay = ['NORM1', 'NORM2', 'FIX', 'SCI'];
    if (!validAngles.includes(data.setup.angleUnit)) return false;
    if (!validDisplay.includes(data.setup.displayMode)) return false;
    if (typeof data.setup.naturalDisplay !== 'boolean') return false;

    // 4. Kiểm tra history
    if (!Array.isArray(data.history)) return false;
    for (const h of data.history) {
      if (!h || typeof h !== 'object') return false;
      if (typeof h.expression !== 'string' || typeof h.result !== 'string') return false;
      if (!isSafeString(h.expression) || !isSafeString(h.result)) return false;
    }

    // 5. Kiểm tra currentMode
    if (typeof data.currentMode !== 'string') return false;

    return true;
  }
}
