import { KEY_BY_ID, KEY_BY_SHORTCUT, resolveKeyAction } from './KeyMatrixMap';
import { ShiftAlphaFSM } from './ShiftAlphaFSM';
import { NormalizedInputEvent, KeyAction } from '../types/events';
import { DisplayState, ModifierMode } from '../types/state';
import { CoreMathEngine } from '../engine/evaluator';
import { CalculationResult } from '../engine/result';
import { MathError } from '../engine/errors';
import { CasioSyntaxError } from '../parser/errors';
import { EquationMode } from '../modes/equation/EquationMode';
import { MatrixMode } from '../modes/matrix/MatrixMode';
import { VectorMode } from '../modes/vector/VectorMode';
import { TableMode } from '../modes/table/TableMode';
import { BaseNMode } from '../modes/baseN/BaseNMode';
import { StatisticsMode } from '../modes/statistics/StatisticsMode';
import { StateManager } from '../state/StateManager';

export type InputEventListener = (event: NormalizedInputEvent, state: DisplayState) => void;

export interface MinimalKeyboardEvent {
  key: string;
}

/**
 * Bộ điều phối sự kiện nhập liệu trung tâm
 * Chuẩn hóa mọi tương tác (Mouse Click, Mobile Touch, PC Keyboard)
 * thành cùng một sự kiện NormalizedInputEvent và cập nhật DisplayState
 */
export class InputDispatcher {
  private fsm: ShiftAlphaFSM;
  private state: DisplayState;
  private listeners: InputEventListener[] = [];
  private engine: CoreMathEngine;
  private lastResult: CalculationResult | null = null;
  private isStoring: boolean = false;

  // State Management
  private stateManager: StateManager;

  // Dedicated modes
  private equationMode: EquationMode;
  private matrixMode: MatrixMode;
  private vectorMode: VectorMode;
  private tableMode: TableMode;
  private baseNMode: BaseNMode;
  private statisticsMode: StatisticsMode;

  constructor(
    fsm?: ShiftAlphaFSM,
    engine?: CoreMathEngine,
    stateManager?: StateManager,
    equationMode?: EquationMode,
    matrixMode?: MatrixMode,
    vectorMode?: VectorMode,
    tableMode?: TableMode,
    baseNMode?: BaseNMode,
    statisticsMode?: StatisticsMode
  ) {
    this.fsm = fsm || new ShiftAlphaFSM();
    this.engine = engine || new CoreMathEngine();
    this.stateManager = stateManager || new StateManager();
    this.equationMode = equationMode || new EquationMode();
    this.matrixMode = matrixMode || new MatrixMode();
    this.vectorMode = vectorMode || new VectorMode();
    this.tableMode = tableMode || new TableMode(this.engine);
    this.baseNMode = baseNMode || new BaseNMode();
    this.statisticsMode = statisticsMode || new StatisticsMode();

    this.state = this.stateManager.getDisplayState();

    // Đồng bộ cờ statusFlags khi FSM thay đổi
    this.fsm.subscribe((mode: ModifierMode) => {
      this.state.statusFlags.shift = mode === 'SHIFT';
      this.state.statusFlags.alpha = mode === 'ALPHA';
    });
  }

  public getStateManager(): StateManager {
    return this.stateManager;
  }

  public getEquationMode(): EquationMode {
    return this.equationMode;
  }

  public getMatrixMode(): MatrixMode {
    return this.matrixMode;
  }

  public getVectorMode(): VectorMode {
    return this.vectorMode;
  }

  public getTableMode(): TableMode {
    return this.tableMode;
  }

  public getBaseNMode(): BaseNMode {
    return this.baseNMode;
  }

  public getStatisticsMode(): StatisticsMode {
    return this.statisticsMode;
  }

  public setMode(mode: string): void {
    this.stateManager.setMode(mode);
    this.state = this.stateManager.getDisplayState();
    this.lastResult = null;
    this.fsm.reset();
  }

  public setAngleUnit(unit: 'DEG' | 'RAD' | 'GRA'): void {
    this.stateManager.setSetup({ angleUnit: unit });
    const flagMap = { DEG: 'D', RAD: 'R', GRA: 'G' } as const;
    this.state.statusFlags.angleUnit = flagMap[unit];
  }

  public insertText(text: string): void {
    if (!text) return;
    this.state.isMenuOpen = false;
    this.state.notification = null;
    if (this.state.result !== null) {
      this.state.expression = text;
      this.state.cursorPosition = text.length;
      this.state.result = null;
      this.lastResult = null;
      return;
    }
    const pos = this.state.cursorPosition;
    this.state.expression = this.state.expression.slice(0, pos) + text + this.state.expression.slice(pos);
    this.state.cursorPosition = pos + text.length;
  }

  public loadExpression(expr: string, result: string | null = null): void {
    this.state.isMenuOpen = false;
    this.state.notification = null;
    this.state.expression = expr || '';
    this.state.cursorPosition = this.state.expression.length;
    this.state.result = result;
  }

  public getHistoryEntries() {
    return this.stateManager.getHistoryManager().getAll();
  }

  public getState(): DisplayState {
    return { ...this.state, statusFlags: { ...this.state.statusFlags } };
  }

  public getFSM(): ShiftAlphaFSM {
    return this.fsm;
  }

  public subscribe(listener: InputEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: NormalizedInputEvent): void {
    for (const listener of this.listeners) {
      listener(event, this.getState());
    }
  }

  /**
   * Kích hoạt từ sự kiện Click chuột, Touch hoặc PC Keyboard
   */
  public dispatchKeyId(keyId: string, source: 'MOUSE' | 'TOUCH' | 'KEYBOARD' = 'MOUSE'): NormalizedInputEvent | null {
    const keyDef = KEY_BY_ID.get(keyId);
    if (!keyDef) {
      console.warn(`[InputDispatcher] Unknown keyId: ${keyId}`);
      return null;
    }

    const currentModifier = this.fsm.getMode();
    const action = resolveKeyAction(keyDef, currentModifier);

    // Cập nhật trạng thái máy
    this.processAction(keyDef.id, action);

    // Tạo sự kiện chuẩn hóa
    const event: NormalizedInputEvent = {
      keyId: keyDef.id,
      keyIndex: keyDef.index,
      modifier: currentModifier,
      action,
      source,
      timestamp: Date.now()
    };

    // Nếu phím bấm là phím thông thường (không phải SHIFT/ALPHA), tiêu thụ modifier
    if (action.type !== 'MODIFIER') {
      this.fsm.consumeAfterAction();
    }

    this.emit(event);
    return event;
  }

  /**
   * Kích hoạt từ sự kiện phím gõ bàn phím vật lý máy tính (PC Keyboard)
   */
  public dispatchKeyboardEvent(e: MinimalKeyboardEvent): NormalizedInputEvent | null {
    // 1. Kiểm tra phím tắt ClassWiz từ CLASSWIZ_P20.dll
    let targetKey = KEY_BY_SHORTCUT.get(e.key);

    // 2. Nếu không tìm thấy bằng phím tắt chuẩn, ánh xạ từ bàn phím thông dụng
    if (!targetKey) {
      switch (e.key) {
        case 'Enter': targetKey = KEY_BY_ID.get('KEY_EQUALS'); break;
        case 'Backspace': targetKey = KEY_BY_ID.get('KEY_DEL'); break;
        case 'Escape': targetKey = KEY_BY_ID.get('KEY_AC'); break;
        case 'ArrowLeft': targetKey = KEY_BY_ID.get('KEY_LEFT'); break;
        case 'ArrowRight': targetKey = KEY_BY_ID.get('KEY_RIGHT'); break;
        case 'ArrowUp': targetKey = KEY_BY_ID.get('KEY_UP'); break;
        case 'ArrowDown': targetKey = KEY_BY_ID.get('KEY_DOWN'); break;
        case '+': targetKey = KEY_BY_ID.get('KEY_ADD'); break;
        case '-': targetKey = KEY_BY_ID.get('KEY_SUB'); break;
        case '*': targetKey = KEY_BY_ID.get('KEY_MUL'); break;
        case '/': targetKey = KEY_BY_ID.get('KEY_DIV'); break;
        case '(': targetKey = KEY_BY_ID.get('KEY_LPAREN'); break;
        case ')': targetKey = KEY_BY_ID.get('KEY_RPAREN'); break;
        case '.': targetKey = KEY_BY_ID.get('KEY_DOT'); break;
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          targetKey = KEY_BY_ID.get(`KEY_${e.key}`);
          break;
      }
    }

    if (!targetKey) {
      return null;
    }

    return this.dispatchKeyId(targetKey.id, 'KEYBOARD');
  }

  /**
   * Xử lý cập nhật chuỗi biểu thức và con trỏ tương ứng với hành động
   */
  private processAction(keyId: string, action: KeyAction): void {
    // 1. Xử lý khi đang mở Menu chọn chế độ
    if (this.state.isMenuOpen) {
      if (keyId === 'KEY_AC' || (action.type === 'SYSTEM' && action.value === 'AC')) {
        this.state.isMenuOpen = false;
        this.state.notification = null;
        return;
      }
      if (keyId === 'KEY_1' || action.value === '1') {
        this.setMode('COMP');
        this.state.isMenuOpen = false;
        return;
      }
      if (keyId === 'KEY_2' || action.value === '2') {
        this.setMode('COMPLEX');
        this.state.isMenuOpen = false;
        return;
      }
      if (keyId === 'KEY_3' || action.value === '3') {
        this.setMode('BASE-N');
        this.state.isMenuOpen = false;
        return;
      }
      if (keyId === 'KEY_4' || action.value === '4') {
        this.setMode('MATRIX');
        this.state.isMenuOpen = false;
        return;
      }
      if (keyId === 'KEY_5' || action.value === '5') {
        this.setMode('VECTOR');
        this.state.isMenuOpen = false;
        return;
      }
      if (keyId === 'KEY_6' || action.value === '6') {
        this.setMode('STATISTICS');
        this.state.isMenuOpen = false;
        return;
      }
      if (keyId === 'KEY_9' || action.value === '9') {
        this.setMode('TABLE');
        this.state.isMenuOpen = false;
        return;
      }
      if (keyId === 'KEY_NEG' || action.value === 'A') {
        this.setMode('EQUATION');
        this.state.isMenuOpen = false;
        return;
      }
      // Các chế độ chưa được triển khai (Mode 7, 8, B, C)
      this.state.notification = 'Not Supported';
      return;
    }

    // 2. Phím MENU (Bật/tắt menu chọn chế độ)
    if (keyId === 'KEY_MENU' || (action.type === 'SYSTEM' && action.value === 'MENU')) {
      this.state.isMenuOpen = !this.state.isMenuOpen;
      this.state.notification = null;
      return;
    }

    // 3. Xử lý phím SHIFT / ALPHA
    if (action.type === 'MODIFIER') {
      if (action.value === 'SHIFT') {
        this.fsm.handleShiftPress();
      } else if (action.value === 'ALPHA') {
        this.fsm.handleAlphaPress();
      }
      return;
    }

    // 4. Xử lý lưu biến nhớ STO
    if (this.isStoring) {
      if (keyId === 'KEY_AC' || (action.type === 'SYSTEM' && action.value === 'AC')) {
        this.isStoring = false;
        this.state.notification = null;
        return;
      }
      const varMap: Record<string, string> = {
        KEY_NEG: 'A',
        KEY_DEGREE: 'B',
        KEY_RECIPROCAL: 'C',
        KEY_SIN: 'D',
        KEY_COS: 'E',
        KEY_TAN: 'F',
        KEY_X: 'x',
        KEY_ENG: 'y',
        KEY_M_PLUS: 'M'
      };
      const varName = varMap[keyId] || (['A', 'B', 'C', 'D', 'E', 'F', 'x', 'y', 'M'].includes(action.value) ? action.value : null);
      if (varName) {
        let targetRes = this.lastResult;
        if (!targetRes && this.state.expression.length > 0) {
          try {
            const vars = this.stateManager.getMemoryStore().toMap();
            targetRes = this.engine.evaluateExpression(this.state.expression, {
              variables: vars,
              angleUnit: this.stateManager.getSetupConfig().angleUnit
            });
          } catch {
            targetRes = null;
          }
        }
        if (targetRes) {
          this.stateManager.getMemoryStore().setVariable(varName, targetRes);
          this.state.statusFlags.hasMemory = this.stateManager.getMemoryStore().hasMemory();
          this.state.result = `${targetRes.getDisplayText()} → ${varName}`;
          this.stateManager.saveToStorage();
        }
        this.isStoring = false;
        this.state.notification = null;
        return;
      }
    }

    if (keyId === 'KEY_STO' || (action.type === 'SYSTEM' && action.value === 'STO')) {
      this.isStoring = true;
      this.state.notification = 'STO';
      return;
    }

    // 5. Xử lý các phím chưa triển khai
    if (action.value === 'CALC' || action.value === 'OPTN') {
      this.state.notification = 'Not Supported';
      return;
    }

    // 6. Xử lý phím điều hướng con trỏ và lịch sử
    if (action.type === 'NAV') {
      this.state.notification = null;
      if (this.state.result !== null) {
        this.state.result = null; // Chỉnh sửa tiếp biểu thức hiện tại
      }
      if (action.value === 'LEFT') {
        this.state.cursorPosition = Math.max(0, this.state.cursorPosition - 1);
      } else if (action.value === 'RIGHT') {
        this.state.cursorPosition = Math.min(this.state.expression.length, this.state.cursorPosition + 1);
      } else if (action.value === 'UP') {
        if (this.stateManager.navigateHistoryUp()) {
          const s = this.stateManager.getDisplayState();
          this.state.expression = s.expression;
          this.state.cursorPosition = s.cursorPosition;
          this.state.result = s.result;
          this.state.statusFlags.scrollUp = s.statusFlags.scrollUp;
          this.state.statusFlags.scrollDown = s.statusFlags.scrollDown;
        }
      } else if (action.value === 'DOWN') {
        this.stateManager.navigateHistoryDown();
        const s = this.stateManager.getDisplayState();
        this.state.expression = s.expression;
        this.state.cursorPosition = s.cursorPosition;
        this.state.result = s.result;
        this.state.statusFlags.scrollUp = s.statusFlags.scrollUp;
        this.state.statusFlags.scrollDown = s.statusFlags.scrollDown;
      }
      return;
    }

    // 7. Xử lý phím xóa toàn bộ (AC)
    if (keyId === 'KEY_AC' || (action.type === 'SYSTEM' && action.value === 'AC')) {
      this.state.expression = '';
      this.state.cursorPosition = 0;
      this.state.result = null;
      this.state.notification = null;
      this.lastResult = null;
      this.isStoring = false;
      this.state.isMenuOpen = false;
      this.fsm.reset();
      this.stateManager.getHistoryManager().resetNavigation();
      this.state.statusFlags.scrollUp = this.stateManager.getHistoryManager().canScrollUp();
      this.state.statusFlags.scrollDown = this.stateManager.getHistoryManager().canScrollDown();
      return;
    }

    // 8. Xử lý phím RESET hệ thống
    if (action.type === 'SYSTEM' && action.value === 'RESET') {
      this.stateManager.resetAll();
      this.state = this.stateManager.getDisplayState();
      this.lastResult = null;
      this.isStoring = false;
      this.fsm.reset();
      return;
    }

    // 9. Xử lý phím nhớ M+ và M-
    if (action.type === 'SYSTEM' && (action.value === 'M+' || action.value === 'M-')) {
      let targetRes = this.lastResult;
      if (!targetRes && this.state.expression.length > 0) {
        try {
          const vars = this.stateManager.getMemoryStore().toMap();
          targetRes = this.engine.evaluateExpression(this.state.expression, {
            variables: vars,
            angleUnit: this.stateManager.getSetupConfig().angleUnit
          });
          this.lastResult = targetRes;
        } catch {
          targetRes = null;
        }
      }
      if (targetRes) {
        if (action.value === 'M+') {
          this.stateManager.getMemoryStore().addToM(targetRes);
        } else {
          this.stateManager.getMemoryStore().subtractFromM(targetRes);
        }
        this.state.statusFlags.hasMemory = this.stateManager.getMemoryStore().hasMemory();
        this.state.result = targetRes.getDisplayText();
        this.stateManager.saveToStorage();
      }
      return;
    }

    // 10. Xử lý phím chuyển đổi S<=>D
    if (keyId === 'KEY_SD' || action.value === 'SD_TOGGLE') {
      if (this.lastResult) {
        this.lastResult.toggleView();
        this.state.result = this.lastResult.getDisplayText();
      }
      return;
    }

    // 11. Xử lý phím xóa lùi (DEL)
    if (keyId === 'KEY_DEL' || (action.type === 'SYSTEM' && action.value === 'DEL')) {
      this.state.notification = null;
      if (this.state.cursorPosition > 0) {
        const expr = this.state.expression;
        const pos = this.state.cursorPosition;
        this.state.expression = expr.slice(0, pos - 1) + expr.slice(pos);
        this.state.cursorPosition = pos - 1;
      }
      return;
    }

    // 12. Xử lý chèn ký tự hoặc hàm toán học
    if (action.type === 'CHAR' || action.type === 'FUNCTION' || action.type === 'BLOCK') {
      this.state.notification = null;
      const insertText = action.value;

      // Chuẩn hóa Casio ClassWiz: Nếu vừa bấm '=' xong và có kết quả
      if (this.state.result !== null) {
        const isChainedOp = ['+', '-', '−', '×', '÷', '^', '²', '³', '!', '%', '⁻¹'].some(op => insertText.startsWith(op));
        if (isChainedOp) {
          // Tự động nối 'Ans' vào trước toán tử hai ngôi
          this.state.expression = 'Ans' + insertText;
          this.state.cursorPosition = 3 + insertText.length;
          this.state.result = null;
          return;
        } else {
          // Bắt đầu phép tính mới từ số hoặc hàm vừa gõ
          this.state.expression = insertText;
          this.state.cursorPosition = insertText.length;
          this.state.result = null;
          this.lastResult = null;
          return;
        }
      }

      const expr = this.state.expression;
      const pos = this.state.cursorPosition;

      this.state.expression = expr.slice(0, pos) + insertText + expr.slice(pos);
      this.state.cursorPosition = pos + insertText.length;
      return;
    }

    // 13. Xử lý phím thực thi (=)
    if (action.type === 'EXECUTE') {
      this.state.notification = null;
      if (this.state.expression.length > 0) {
        try {
          const vars = this.stateManager.getMemoryStore().toMap();
          const res = this.engine.evaluateExpression(this.state.expression, {
            variables: vars,
            angleUnit: this.stateManager.getSetupConfig().angleUnit
          });
          this.lastResult = res;
          this.state.result = res.getDisplayText();
          this.stateManager.recordCalculation(this.state.expression, res.getDisplayText(), res);
          this.state.statusFlags.scrollUp = this.stateManager.getHistoryManager().canScrollUp();
          this.state.statusFlags.scrollDown = this.stateManager.getHistoryManager().canScrollDown();
          this.state.statusFlags.hasMemory = this.stateManager.getMemoryStore().hasMemory();
        } catch (e) {
          if (e instanceof MathError) {
            this.state.result = e.code === 'DIMENSION_ERROR' ? 'Dimension ERROR' : 'Math ERROR';
          } else if (e instanceof CasioSyntaxError) {
            this.state.result = 'Syntax ERROR';
          } else {
            this.state.result = 'ERROR';
          }
        }
      }
      return;
    }
  }
}
