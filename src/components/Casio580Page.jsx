/* ============================================================
   Casio580Page.jsx — ELEC Casio fx-580VN X ClassWiz Studio Pro
   ============================================================ */
import { useCallback, useRef, useState } from 'react';
import Casio580Widget from './Casio580Widget.jsx';
import Casio580ProPanel from './Casio580ProPanel.jsx';
import { ElecFlaskBrandSvg } from './teacher/ElecBrandMark.jsx';

const MODE_TO_PRO_TAB = {
  EQUATION: 'eq',
  TABLE: 'table',
  COMPLEX: 'complex',
  MATRIX: 'matvec',
  VECTOR: 'matvec',
  STATISTICS: 'statbase',
  'BASE-N': 'statbase',
};

export default function Casio580Page() {
  const casioRef = useRef(null);
  const [proTab, setProTab] = useState('eq');
  const [angleUnit, setAngleUnit] = useState('DEG');
  const [history, setHistory] = useState([]);

  const handleModeChange = useCallback((mode) => {
    const mapped = MODE_TO_PRO_TAB[mode];
    if (mapped) setProTab(mapped);
  }, []);

  const handleInsertToLcd = useCallback((text) => {
    casioRef.current?.insertText(text);
  }, []);

  const handleLoadHistory = useCallback((expr, result) => {
    casioRef.current?.loadExpression(expr, result);
  }, []);

  return (
    <div className="elec-casio-page">
      <header className="elec-casio-hero">
        <div>
          <span className="elec-casio-badge">
            <ElecFlaskBrandSvg size={20} />
            ELEC AI · ClassWiz Studio Pro
          </span>
          <h1>Máy tính Casio fx-580VN X ClassWiz</h1>
          <p>
            Mô phỏng 50 phím chuẩn phần cứng, 3 vỏ máy tùy chọn, tích hợp trọn bộ giải Hệ 2–4 ẩn, Đa thức bậc 2–4, Tích phân ∫dx, Đạo hàm d/dx, SOLVE, Bảng f(x), Số phức, Ma trận, Véc-tơ &amp; Hằng số KHTN THPT.
          </p>
        </div>
      </header>

      <div className="elec-casio-grid">
        <div className="elec-casio-sticky-col">
          <Casio580Widget
            ref={casioRef}
            compact={false}
            captureKeyboard={true}
            showModeBar={false}
            showHardwareBar={true}
            onModeChange={handleModeChange}
            onAngleChange={setAngleUnit}
            onHistoryChange={setHistory}
          />
        </div>

        <div className="elec-casio-guide-col">
          <Casio580ProPanel
            activeTab={proTab}
            onTabChange={setProTab}
            angleUnit={angleUnit}
            history={history}
            onInsertToLcd={handleInsertToLcd}
            onLoadHistory={handleLoadHistory}
          />
        </div>
      </div>
    </div>
  );
}
