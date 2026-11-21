import { DisplayState, StatusFlags } from '../types/state';

export type LcdTheme = 'carbon' | 'cobalt' | 'pearl';

const LCD_PALETTE: Record<LcdTheme, { bg: string; ink: string; inkSoft: string; line: string }> = {
  carbon: { bg: '#c7d6c5', ink: '#172319', inkSoft: 'rgba(23, 35, 25, 0.22)', line: 'rgba(23, 35, 25, 0.20)' },
  cobalt: { bg: '#d8e9fa', ink: '#0b1c3d', inkSoft: 'rgba(11, 28, 61, 0.20)', line: 'rgba(11, 28, 61, 0.18)' },
  pearl: { bg: '#d4dfd2', ink: '#1a251c', inkSoft: 'rgba(26, 37, 28, 0.20)', line: 'rgba(26, 37, 28, 0.18)' },
};

/**
 * Component màn hình LCD mô phỏng ma trận điểm 192 × 63 dots của Casio ClassWiz fx-580VN X
 */
export class LcdScreen {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cursorBlink: boolean = true;
  private blinkInterval: number | null = null;
  private currentState: DisplayState | null = null;
  private theme: LcdTheme = 'carbon';

  // Kích thước chuẩn từ VRAM và phần cứng ClassWiz
  private readonly DOTS_W = 192;
  private readonly DOTS_H = 63;
  private readonly SCALE = 3; // Tỷ lệ phóng to hiển thị sắc nét

  constructor(containerOrId: string | HTMLElement) {
    const parent = typeof containerOrId === 'string'
      ? document.getElementById(containerOrId)
      : containerOrId;
    if (!parent) {
      throw new Error(`[LcdScreen] Container ${String(containerOrId)} not found`);
    }
    this.container = parent;

    // Tạo Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.DOTS_W * this.SCALE;
    this.canvas.height = this.DOTS_H * this.SCALE;
    this.canvas.className = 'casio-lcd-canvas';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Màn hình hiển thị LCD Casio fx-580VN X');

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('[LcdScreen] Failed to get 2D canvas context');
    }
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;

    this.container.appendChild(this.canvas);

    // Kích hoạt nhấp nháy con trỏ
    this.startCursorBlink();
  }

  public setTheme(theme: LcdTheme): void {
    this.theme = theme;
    if (this.currentState) {
      this.render(this.currentState);
    }
  }

  public destroy(): void {
    if (this.blinkInterval !== null) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
  }

  private startCursorBlink(): void {
    if (typeof window !== 'undefined') {
      this.blinkInterval = window.setInterval(() => {
        this.cursorBlink = !this.cursorBlink;
        if (this.currentState) {
          this.render(this.currentState);
        }
      }, 500);
    }
  }

  /**
   * Kết xuất toàn bộ màn hình theo trạng thái DisplayState
   */
  public render(state: DisplayState): void {
    this.currentState = state;
    const ctx = this.ctx;
    const pal = LCD_PALETTE[this.theme] || LCD_PALETTE.carbon;

    // 1. Vẽ nền màn hình LCD ClassWiz theo theme phần cứng
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Lưới vi điểm mờ nhẹ tạo cảm giác ma trận LCD ClassWiz chân thực
    ctx.fillStyle = 'rgba(0, 0, 0, 0.028)';
    for (let y = 0; y < this.canvas.height; y += this.SCALE * 2) {
      ctx.fillRect(0, y, this.canvas.width, 1);
    }

    // 2. Vẽ dải biểu tượng trạng thái phía trên (Status Bar chuẩn ClassWiz)
    this.renderStatusBar(state.statusFlags, state.currentMode);

    // Nếu đang mở menu chọn mode, vẽ menu
    if (state.isMenuOpen) {
      this.renderMenu();
      return;
    }

    // 3. Vẽ dòng nhập biểu thức (Expression Line) có tự động cuộn ngang theo con trỏ
    this.renderExpression(state.expression, state.cursorPosition);

    // 4. Vẽ thông báo phụ hoặc kết quả góc dưới bên phải
    if (state.notification) {
      this.renderNotification(state.notification);
    } else if (state.result !== null) {
      this.renderResult(state.result);
    }
  }

  /**
   * Vẽ menu chọn chế độ tính toán khi bấm phím MENU
   */
  private renderMenu(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1e2920';
    ctx.font = `bold ${8.5 * this.SCALE}px monospace`;
    ctx.textBaseline = 'top';

    const col1X = 6 * this.SCALE;
    const startY = 16 * this.SCALE;
    const lineSpacing = 11 * this.SCALE;

    ctx.fillText('1: Calculate   2: Complex', col1X, startY);
    ctx.fillText('3: Base-N      4: Matrix', col1X, startY + lineSpacing);
    ctx.fillText('5: Vector      6: Statistics', col1X, startY + lineSpacing * 2);
    ctx.fillText('9: Table       A: Equation', col1X, startY + lineSpacing * 3);
  }

  /**
   * Vẽ thông báo tạm thời (ví dụ: 'Not Supported', 'Ans → A')
   */
  private renderNotification(msg: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1e2920';
    ctx.font = `bold ${12 * this.SCALE}px monospace`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'right';

    const x = this.canvas.width - (8 * this.SCALE);
    const y = this.canvas.height - (4 * this.SCALE);

    ctx.fillText(msg, x, y);
    ctx.textAlign = 'left';
  }

  /**
   * Vẽ các biểu tượng trạng thái trên cùng: S, A, D/R/G, FIX, SCI, Math, M
   */
  private renderStatusBar(flags: StatusFlags, currentMode?: string): void {
    const ctx = this.ctx;
    const pal = LCD_PALETTE[this.theme] || LCD_PALETTE.carbon;
    const s = this.SCALE;
    const drawBadge = (label: string, x: number, active = true) => {
      ctx.font = `bold ${7.5 * s}px monospace`;
      const w = Math.max(9 * s, ctx.measureText(label).width + 4 * s);
      const h = 9 * s;
      const y = 1.5 * s;
      if (active) {
        ctx.fillStyle = pal.ink;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = pal.bg;
      } else {
        ctx.fillStyle = pal.ink;
      }
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + 2 * s, y + h / 2 + 0.5);
      ctx.textBaseline = 'top';
      return x + w + 3 * s;
    };

    let cursorX = 5 * s;
    if (flags.shift) cursorX = drawBadge('S', cursorX, true);
    if (flags.alpha) cursorX = drawBadge('A', cursorX, true);
    cursorX = drawBadge(flags.angleUnit || 'D', cursorX, true);
    if (flags.fix) cursorX = drawBadge('FIX', cursorX, false);
    if (flags.sci) cursorX = drawBadge('SCI', cursorX, false);

    if (currentMode && currentMode !== 'COMP') {
      cursorX = drawBadge(currentMode.slice(0, 7), cursorX, false);
    }

    ctx.fillStyle = pal.ink;
    ctx.font = `bold ${7.5 * s}px monospace`;
    ctx.textBaseline = 'top';
    if (flags.math) {
      ctx.fillText('Math', 132 * s, 2.5 * s);
    }
    if (flags.hasMemory) {
      drawBadge('M', 160 * s, true);
    }
    if (flags.scrollUp) ctx.fillText('▲', 177 * s, 1.5 * s);
    if (flags.scrollDown) ctx.fillText('▼', 184 * s, 1.5 * s);

    // Đường kẻ phân cách mờ dưới status bar
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 12.5 * s);
    ctx.lineTo(this.canvas.width, 12.5 * s);
    ctx.stroke();
  }

  /**
   * Vẽ biểu thức và con trỏ nhấp nháy (có tự động cuộn ngang khi biểu thức dài)
   */
  private renderExpression(expression: string, cursorPosition: number): void {
    const ctx = this.ctx;
    const pal = LCD_PALETTE[this.theme] || LCD_PALETTE.carbon;
    const s = this.SCALE;
    ctx.fillStyle = pal.ink;
    ctx.font = `bold ${11.5 * s}px monospace`;
    ctx.textBaseline = 'top';

    const padX = 6 * s;
    const startY = 16.5 * s;
    const maxW = this.canvas.width - padX * 2;

    const textBefore = expression.slice(0, cursorPosition);
    const textAfter = expression.slice(cursorPosition);
    const widthBefore = ctx.measureText(textBefore).width;

    // Tính độ dịch cuộn ngang để con trỏ luôn nằm trong khung nhìn LCD
    const scrollX = widthBefore > maxW - 10 * s ? widthBefore - (maxW - 10 * s) : 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(padX, startY - 2, maxW, 18 * s);
    ctx.clip();

    const drawX = padX - scrollX;
    ctx.fillText(textBefore, drawX, startY);

    if (this.cursorBlink) {
      ctx.fillRect(drawX + widthBefore + 1, startY, 2 * s, 13 * s);
    }
    ctx.fillText(textAfter, drawX + widthBefore + 3 * s, startY);
    ctx.restore();

    // Chỉ báo có văn bản bị cuộn sang trái
    if (scrollX > 0) {
      ctx.fillStyle = pal.inkSoft;
      ctx.font = `bold ${7 * s}px monospace`;
      ctx.fillText('◀', 1 * s, startY + 3 * s);
    }
  }

  /**
   * Vẽ kết quả căn phải ở góc dưới màn hình (tự co chữ khi kết quả dài)
   */
  private renderResult(result: string): void {
    const ctx = this.ctx;
    const pal = LCD_PALETTE[this.theme] || LCD_PALETTE.carbon;
    const s = this.SCALE;
    const maxW = this.canvas.width - 14 * s;
    let fontSize = 14.5;
    ctx.font = `bold ${fontSize * s}px monospace`;
    while (ctx.measureText(result).width > maxW && fontSize > 9) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize * s}px monospace`;
    }

    ctx.fillStyle = pal.ink;
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'right';

    const x = this.canvas.width - (7 * s);
    const y = this.canvas.height - (4 * s);

    ctx.fillText(result, x, y);
    ctx.textAlign = 'left';
  }
}
