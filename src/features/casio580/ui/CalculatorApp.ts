import { InputDispatcher } from '../input/InputDispatcher';
import { LcdScreen, LcdTheme } from './LcdScreen';
import { KeypadView } from './KeypadView';
import { DisplayState } from '../types/state';

export interface CalculatorAppOptions {
  captureKeyboard?: boolean;
  lcdTheme?: LcdTheme;
  soundEnabled?: boolean;
  onStateChange?: (state: DisplayState) => void;
}

let clickAudioCtx: AudioContext | null = null;
function playSoftKeyClick(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!clickAudioCtx) clickAudioCtx = new Ctx();
    if (clickAudioCtx.state === 'suspended') {
      clickAudioCtx.resume().catch(() => {});
    }
    const now = clickAudioCtx.currentTime;
    const osc = clickAudioCtx.createOscillator();
    const gain = clickAudioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1150, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.022);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(gain);
    gain.connect(clickAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.026);
  } catch { /* ignore */ }
}

/**
 * Ứng dụng Casio fx-580VN X tích hợp (an toàn cho React SPA: hỗ trợ HTMLElement trực tiếp & destroy())
 * Điều phối giữa màn hình LCD, bàn phím và hệ thống nhập liệu
 */
export class CalculatorApp {
  private rootElement: HTMLElement;
  private dispatcher: InputDispatcher;
  private lcdScreen: LcdScreen | null = null;
  private keypadView: KeypadView | null = null;
  private unsubscribeDispatcher: (() => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private options: CalculatorAppOptions;
  private soundEnabled: boolean;

  constructor(rootOrId: string | HTMLElement, options: CalculatorAppOptions = {}) {
    const root = typeof rootOrId === 'string'
      ? document.getElementById(rootOrId)
      : rootOrId;
    if (!root) {
      throw new Error(`[CalculatorApp] Root element ${String(rootOrId)} not found`);
    }
    this.rootElement = root;
    this.options = options;
    this.soundEnabled = Boolean(options.soundEnabled);
    this.dispatcher = new InputDispatcher();

    this.initLayout();
    this.initListeners();
  }

  public getDispatcher(): InputDispatcher {
    return this.dispatcher;
  }

  public getKeypad(): KeypadView | null {
    return this.keypadView;
  }

  public getScreen(): LcdScreen | null {
    return this.lcdScreen;
  }

  public selectMode(mode: string): void {
    this.dispatcher.setMode(mode);
    const nextState = this.dispatcher.getState();
    this.lcdScreen?.render(nextState);
    this.options.onStateChange?.(nextState);
  }

  public setAngleUnit(unit: 'DEG' | 'RAD' | 'GRA'): void {
    this.dispatcher.setAngleUnit(unit);
    const nextState = this.dispatcher.getState();
    this.lcdScreen?.render(nextState);
    this.options.onStateChange?.(nextState);
  }

  public insertText(text: string): void {
    this.dispatcher.insertText(text);
    const nextState = this.dispatcher.getState();
    this.lcdScreen?.render(nextState);
    this.options.onStateChange?.(nextState);
  }

  public loadExpression(expr: string, result: string | null = null): void {
    this.dispatcher.loadExpression(expr, result);
    const nextState = this.dispatcher.getState();
    this.lcdScreen?.render(nextState);
    this.options.onStateChange?.(nextState);
  }

  public setLcdTheme(theme: LcdTheme): void {
    this.lcdScreen?.setTheme(theme);
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public getHistory() {
    return this.dispatcher.getHistoryEntries();
  }

  public destroy(): void {
    if (this.unsubscribeDispatcher) {
      this.unsubscribeDispatcher();
      this.unsubscribeDispatcher = null;
    }
    if (this.keydownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.lcdScreen) {
      this.lcdScreen.destroy();
      this.lcdScreen = null;
    }
    this.keypadView = null;
    this.rootElement.innerHTML = '';
  }

  private initLayout(): void {
    this.rootElement.innerHTML = `
      <div class="casio-case">
        <!-- Khối đầu máy: Logo & Solar cell giả lập -->
        <div class="casio-header">
          <div class="casio-branding">
            <span class="casio-logo">CASIO</span>
            <span class="casio-model">fx-580VN X</span>
            <span class="casio-subtext">CLASSWIZ</span>
          </div>
          <div class="solar-panel" title="Tế bào quang điện kép giả lập">
            <div class="solar-grid"></div>
          </div>
        </div>

        <!-- Khung viền màn hình LCD -->
        <div class="casio-screen-frame">
          <div class="casio-lcd-container" data-casio-lcd></div>
        </div>

        <!-- Bàn phím 50 phím -->
        <div data-casio-keypad></div>

        <!-- Khối chân máy -->
        <div class="casio-footer">
          <span class="casio-edition">VIETNAM STANDARD EDITION · ELEC AI</span>
        </div>
      </div>
    `;

    const lcdHost = this.rootElement.querySelector('[data-casio-lcd]') as HTMLElement;
    const keypadHost = this.rootElement.querySelector('[data-casio-keypad]') as HTMLElement;

    // Khởi tạo các component con bằng HTMLElement cục bộ (không trùng ID toàn cục)
    this.lcdScreen = new LcdScreen(lcdHost);
    if (this.options.lcdTheme) {
      this.lcdScreen.setTheme(this.options.lcdTheme);
    }
    this.keypadView = new KeypadView(keypadHost, this.dispatcher);

    // Render trạng thái ban đầu
    const initial = this.dispatcher.getState();
    this.lcdScreen.render(initial);
    this.options.onStateChange?.(initial);
  }

  private initListeners(): void {
    // 1. Lắng nghe cập nhật từ InputDispatcher để vẽ lại LCD
    this.unsubscribeDispatcher = this.dispatcher.subscribe((_event, state: DisplayState) => {
      if (this.soundEnabled) {
        playSoftKeyClick();
      }
      if (this.lcdScreen) {
        this.lcdScreen.render(state);
      }
      this.options.onStateChange?.(state);
    });

    // 2. Lắng nghe phím gõ từ bàn phím vật lý máy tính (PC Keyboard)
    if (this.options.captureKeyboard !== false && typeof window !== 'undefined') {
      this.keydownHandler = (e: KeyboardEvent) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement | null)?.isContentEditable
        ) {
          return;
        }
        if (e.metaKey || e.ctrlKey || e.altKey) {
          return;
        }

        const handled = this.dispatcher.dispatchKeyboardEvent(e);
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      window.addEventListener('keydown', this.keydownHandler);
    }
  }
}
