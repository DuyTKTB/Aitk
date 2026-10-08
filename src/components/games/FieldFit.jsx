import { useEffect, useRef, useState } from 'react';

/* ============================================================
   FieldFit — thu nhỏ sân chơi có kích thước cố định (px) cho vừa màn hình.
   Sân vẫn giữ nguyên hệ tọa độ gốc nên logic game không phải đổi;
   chỉ có phần hiển thị được co lại (không bao giờ phóng to quá 100%).
   Trả scale cho con qua render-prop nếu cần quy đổi tọa độ chuột/chạm:
     <FieldFit width={900} height={520}>{(scale) => <div .../>}</FieldFit>
   ============================================================ */
export default function FieldFit({ width, height, children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const calc = () => setScale(Math.min(1, el.clientWidth / width) || 1);
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <div style={{ width: width * scale, height: height * scale, margin: '0 auto' }}>
        <div style={{ width, height, transform: scale === 1 ? undefined : `scale(${scale})`, transformOrigin: 'top left' }}>
          {typeof children === 'function' ? children(scale) : children}
        </div>
      </div>
    </div>
  );
}
