import { KEY_BY_ID } from '../input/KeyMatrixMap';
import { InputDispatcher } from '../input/InputDispatcher';

/**
 * Component bàn phím Casio 50 phím
 * Tái hiện chính xác hình ảnh, vị trí, màu sắc phím bấm và nhãn chức năng Shift/Alpha
 */
export class KeypadView {
  private container: HTMLElement;
  private dispatcher: InputDispatcher;

  constructor(containerOrId: string | HTMLElement, dispatcher: InputDispatcher) {
    const parent = typeof containerOrId === 'string'
      ? document.getElementById(containerOrId)
      : containerOrId;
    if (!parent) {
      throw new Error(`[KeypadView] Container ${String(containerOrId)} not found`);
    }
    this.container = parent;
    this.dispatcher = dispatcher;

    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'casio-keypad-container';

    // Tạo các khối nhóm phím
    const topRow = document.createElement('div');
    topRow.className = 'keypad-row keypad-row-top';
    topRow.appendChild(this.createButton('KEY_SHIFT', 'btn-shift'));
    topRow.appendChild(this.createButton('KEY_ALPHA', 'btn-alpha'));
    
    // Cụm D-Pad điều hướng hình tròn
    const dpadCluster = document.createElement('div');
    dpadCluster.className = 'dpad-cluster';
    dpadCluster.appendChild(this.createButton('KEY_UP', 'dpad-btn dpad-up'));
    dpadCluster.appendChild(this.createButton('KEY_LEFT', 'dpad-btn dpad-left'));
    dpadCluster.appendChild(this.createButton('KEY_RIGHT', 'dpad-btn dpad-right'));
    dpadCluster.appendChild(this.createButton('KEY_DOWN', 'dpad-btn dpad-down'));
    topRow.appendChild(dpadCluster);

    topRow.appendChild(this.createButton('KEY_MENU', 'btn-menu'));
    topRow.appendChild(this.createButton('KEY_ON', 'btn-on'));
    this.container.appendChild(topRow);

    // Hàng phím khoa học 2 (OPTN, CALC, ∫dx, x)
    const rowSci1 = document.createElement('div');
    rowSci1.className = 'keypad-row keypad-row-sci-4';
    ['KEY_OPTN', 'KEY_CALC', 'KEY_INTEGRAL', 'KEY_X'].forEach((id) => {
      rowSci1.appendChild(this.createButton(id, 'btn-sci'));
    });
    this.container.appendChild(rowSci1);

    // Hàng phím khoa học 3 (Phân số, căn, x², x^■, log, ln)
    const rowSci2 = document.createElement('div');
    rowSci2.className = 'keypad-row keypad-row-sci-6';
    ['KEY_FRAC', 'KEY_SQRT', 'KEY_SQUARE', 'KEY_POWER', 'KEY_LOG_AB', 'KEY_LN'].forEach((id) => {
      rowSci2.appendChild(this.createButton(id, 'btn-sci'));
    });
    this.container.appendChild(rowSci2);

    // Hàng phím khoa học 4 ((-), ° ' ", x⁻¹, sin, cos, tan)
    const rowSci3 = document.createElement('div');
    rowSci3.className = 'keypad-row keypad-row-sci-6';
    ['KEY_NEG', 'KEY_DEGREE', 'KEY_RECIPROCAL', 'KEY_SIN', 'KEY_COS', 'KEY_TAN'].forEach((id) => {
      rowSci3.appendChild(this.createButton(id, 'btn-sci'));
    });
    this.container.appendChild(rowSci3);

    // Hàng phím trung tâm (STO, ENG, (, ), S⇔D, M+)
    const rowMid = document.createElement('div');
    rowMid.className = 'keypad-row keypad-row-sci-6';
    ['KEY_STO', 'KEY_ENG', 'KEY_LPAREN', 'KEY_RPAREN', 'KEY_SD', 'KEY_M_PLUS'].forEach((id) => {
      rowMid.appendChild(this.createButton(id, 'btn-sci'));
    });
    this.container.appendChild(rowMid);

    // Phân cách vùng số
    const numPad = document.createElement('div');
    numPad.className = 'keypad-numpad';

    // Hàng 7, 8, 9, DEL, AC
    const rowNum1 = document.createElement('div');
    rowNum1.className = 'keypad-row keypad-row-5';
    rowNum1.appendChild(this.createButton('KEY_7', 'btn-num'));
    rowNum1.appendChild(this.createButton('KEY_8', 'btn-num'));
    rowNum1.appendChild(this.createButton('KEY_9', 'btn-num'));
    rowNum1.appendChild(this.createButton('KEY_DEL', 'btn-action btn-del'));
    rowNum1.appendChild(this.createButton('KEY_AC', 'btn-action btn-ac'));
    numPad.appendChild(rowNum1);

    // Hàng 4, 5, 6, ×, ÷
    const rowNum2 = document.createElement('div');
    rowNum2.className = 'keypad-row keypad-row-5';
    rowNum2.appendChild(this.createButton('KEY_4', 'btn-num'));
    rowNum2.appendChild(this.createButton('KEY_5', 'btn-num'));
    rowNum2.appendChild(this.createButton('KEY_6', 'btn-num'));
    rowNum2.appendChild(this.createButton('KEY_MUL', 'btn-op'));
    rowNum2.appendChild(this.createButton('KEY_DIV', 'btn-op'));
    numPad.appendChild(rowNum2);

    // Hàng 1, 2, 3, +, −
    const rowNum3 = document.createElement('div');
    rowNum3.className = 'keypad-row keypad-row-5';
    rowNum3.appendChild(this.createButton('KEY_1', 'btn-num'));
    rowNum3.appendChild(this.createButton('KEY_2', 'btn-num'));
    rowNum3.appendChild(this.createButton('KEY_3', 'btn-num'));
    rowNum3.appendChild(this.createButton('KEY_ADD', 'btn-op'));
    rowNum3.appendChild(this.createButton('KEY_SUB', 'btn-op'));
    numPad.appendChild(rowNum3);

    // Hàng 0, ., ×10ⁿ, Ans, =
    const rowNum4 = document.createElement('div');
    rowNum4.className = 'keypad-row keypad-row-5';
    rowNum4.appendChild(this.createButton('KEY_0', 'btn-num'));
    rowNum4.appendChild(this.createButton('KEY_DOT', 'btn-num'));
    rowNum4.appendChild(this.createButton('KEY_EXP', 'btn-num'));
    rowNum4.appendChild(this.createButton('KEY_ANS', 'btn-num'));
    rowNum4.appendChild(this.createButton('KEY_EQUALS', 'btn-op btn-equals'));
    numPad.appendChild(rowNum4);

    this.container.appendChild(numPad);
  }

  private createButton(keyId: string, extraClass: string = ''): HTMLElement {
    const keyDef = KEY_BY_ID.get(keyId);
    if (!keyDef) {
      const placeholder = document.createElement('div');
      placeholder.className = 'casio-btn-wrapper';
      return placeholder;
    }

    const wrapper = document.createElement('div');
    wrapper.className = `casio-btn-wrapper ${extraClass}`;

    // Nhãn SHIFT màu vàng ở trên
    if (keyDef.shiftLabel) {
      const shiftLbl = document.createElement('span');
      shiftLbl.className = 'key-shift-label';
      shiftLbl.textContent = keyDef.shiftLabel;
      wrapper.appendChild(shiftLbl);
    }

    // Nhãn ALPHA màu đỏ ở trên
    if (keyDef.alphaLabel) {
      const alphaLbl = document.createElement('span');
      alphaLbl.className = 'key-alpha-label';
      alphaLbl.textContent = keyDef.alphaLabel;
      wrapper.appendChild(alphaLbl);
    }

    // Nút bấm chính
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `casio-btn ${extraClass}`;
    btn.setAttribute('data-key-id', keyDef.id);
    btn.setAttribute('data-key-index', keyDef.index.toString());
    btn.setAttribute('aria-label', keyDef.label || keyDef.id);
    btn.setAttribute('title', `${keyDef.id} (Phím PC: '${keyDef.pcShortcut}')`);
    btn.textContent = keyDef.label;

    // Gắn sự kiện click / touch (dùng pointerdown để phản hồi tức thì không bị trễ 300ms)
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      // Rung phản hồi cảm ứng nếu có
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      this.dispatcher.dispatchKeyId(keyDef.id, e.pointerType === 'touch' ? 'TOUCH' : 'MOUSE');
    });

    wrapper.appendChild(btn);
    return wrapper;
  }
}
