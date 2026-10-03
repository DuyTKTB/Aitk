import { useState, useEffect, useRef } from 'react';
import { askAI, COMPARE_SYSTEM_PROMPT } from '../lib/ai.js';
import { MarkdownLike } from './ChatMarkdown.jsx';
import { HOT_AI } from './hotData.js';
import AIMark from './AIMark.jsx';
import { IcoClose, IcoRefresh, IcoCopy, IcoCheck } from './Icons.jsx';

/* ============================================================
   CompareModal — So sánh các công cụ AI bằng chính AI
   ============================================================ */
export default function CompareModal({ tools, onClose }) {
  const ref = useRef(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  /* Tạo prompt so sánh từ danh sách công cụ */
  const buildPrompt = () => {
    const list = tools.map((t, i) => {
      const meta = HOT_AI[t.id] || {};
      return `
### ${i + 1}. ${t.name}
- Website: ${t.domain}
- Mô tả: ${t.desc}
- Giá: ${meta.price || 'không rõ'}
- Ưu điểm: ${(meta.pros || []).join('; ') || 'không có dữ liệu'}
- Nhược điểm: ${(meta.cons || []).join('; ') || 'không có dữ liệu'}
- Phù hợp với: ${(meta.bestFor || []).join('; ') || 'không có dữ liệu'}
- Lý do nên dùng: ${meta.why || 'không có dữ liệu'}`;
    }).join('\n');

    return `Hãy so sánh ${tools.length} công cụ AI sau đây một cách khách quan, chi tiết và hữu ích cho người dùng Việt Nam:

${list}

YÊU CẦU:
1. Mở đầu bằng 1-2 câu tóm tắt chung về nhóm công cụ này.
2. Lập BẢNG SO SÁNH với các tiêu chí:
   - Mục đích chính
   - Điểm mạnh nổi bật
   - Điểm yếu
   - Mức giá
   - Hỗ trợ tiếng Việt
   - Phù hợp với ai
3. Sau bảng, viết phần "Nên chọn cái nào?" — chia theo 3-4 tình huống cụ thể (ví dụ: "Nếu bạn là học sinh...", "Nếu bạn cần miễn phí...", "Nếu bạn cần chuyên nghiệp...").
4. Kết luận ngắn 2-3 câu với khuyến nghị rõ ràng.

ĐỊNH DẠNG:
- Trả lời bằng tiếng Việt.
- Dùng bảng markdown (| ... | ... |) để dễ đọc.
- Khách quan, không thiên vị.
- Ngắn gọn, súc tích, tránh lan man.`;
  };

  /* Gọi AI với system prompt riêng cho so sánh */
  const runCompare = async () => {
    setLoading(true);
    setErr('');
    setResult('');
    try {
      const history = [{ role: 'user', parts: [{ text: buildPrompt() }] }];
      await askAI(
        history,
        (partial) => setResult(partial),
        null,
        COMPARE_SYSTEM_PROMPT
      );
    } catch (e) {
      setErr(e?.message || 'Không gọi được AI. Kiểm tra mạng hoặc API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  return (
    <dialog
      ref={ref}
      className="compare-modal"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="compare-modal-inner">
        <header className="compare-modal-head">
          <div className="compare-modal-title">
            <AIMark size={38} mode={loading ? 'think' : 'idle'} animate />
            <div>
              <h2>AI so sánh {tools.length} công cụ</h2>
              <p>{tools.map((t) => t.name).join(' · ')}</p>
            </div>
          </div>
          <div className="compare-modal-actions">
            {result && !loading && (
              <button type="button" className="compare-modal-btn" onClick={copyResult}>
                {copied ? <IcoCheck size={15} /> : <IcoCopy size={15} />}
                {copied ? 'Đã chép' : 'Sao chép'}
              </button>
            )}
            <button type="button" className="compare-modal-btn" onClick={runCompare} disabled={loading}>
              <IcoRefresh size={15} /> So sánh lại
            </button>
            <button type="button" className="compare-modal-x" onClick={() => ref.current.close()} aria-label="Đóng">
              <IcoClose size={18} />
            </button>
          </div>
        </header>

        <div className="compare-modal-body">
          {loading && !result && (
            <div className="compare-loading">
              <AIMark size={100} mode="think" animate />
              <p>AI đang phân tích và so sánh…</p>
              <span className="ds-typing"><i /><i /><i /></span>
            </div>
          )}

          {result && (
            <div className="compare-result">
              <MarkdownLike text={result} />
              {loading && <span className="ds-typing"><i /><i /><i /></span>}
            </div>
          )}

          {err && <div className="compare-error">{err}</div>}
        </div>
      </div>
    </dialog>
  );
}