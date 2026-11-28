import React, { useMemo, useState } from 'react';
import { calcBiuretAbsorbance, calcCatalaseActivity } from '../bioEngine.js';
import BioLiveChart from '../components/BioLiveChart.jsx';
import { exportStyledWorkbook } from '../../../lib/excelExport.js';

const OSMOSIS_SOLUTIONS = {
  hypotonic: {
    label: 'Nhược trương (Nước cất 0%)',
    naclPct: 0,
    cellRadius: 64,
    vacuoleScale: 1.08,
    status: 'Trương nước (Turgid)',
    desc: 'Nước thẩm thấu từ ngoài vào tế bào → Không bào phồng lớn, ép sát màng sinh chất vào thành cellulose; tế bào không vỡ nhờ thành cellulose vững chắc.',
  },
  isotonic: {
    label: 'Đẳng trương (NaCl 0.9%)',
    naclPct: 0.9,
    cellRadius: 56,
    vacuoleScale: 0.85,
    status: 'Cân bằng (Flaccid)',
    desc: 'Tốc độ nước đi vào bằng tốc độ nước đi ra → Thể tích không bào và áp suất thẩm thấu duy trì cân bằng.',
  },
  hypertonic: {
    label: 'Ưu trương (NaCl 10%)',
    naclPct: 10,
    cellRadius: 36,
    vacuoleScale: 0.42,
    status: 'Co nguyên sinh (Plasmolysis)',
    desc: 'Nước thoát mạnh ra môi trường ưu trương → Không bào co nhỏ, khối nguyên sinh tách rời khỏi thành tế bào. Nhỏ lại nước cất sẽ xảy ra phản co nguyên sinh.',
  },
};

export default function BioLabWorkbenchSim({ onAskAI }) {
  const [expTab, setExpTab] = useState('biuret'); // 'biuret' | 'catalase' | 'osmosis'

  // Thí nghiệm 1: Biuret định lượng Protein
  const [proteinConc, setProteinConc] = useState(3.0);

  // Thí nghiệm 2: Enzyme Catalase
  const [catTemp, setCatTemp] = useState(37);
  const [catPh, setCatPh] = useState(7.0);
  const [catSub, setCatSub] = useState(3.0);

  // Thí nghiệm 3: Co nguyên sinh tế bào thực vật
  const [osmoType, setOsmoType] = useState('isotonic');

  // Sổ ghi nhật ký thí nghiệm dùng chung
  const [logs, setLogs] = useState([
    { id: 1, exp: 'Biuret (Protein)', param: 'C = 0.0 mg/mL (Ống trắng)', x: 0, y: 0.015, unit: 'A₅₄₀', note: 'Xanh lam (CuSO₄)' },
    { id: 2, exp: 'Biuret (Protein)', param: 'C = 2.0 mg/mL', x: 2, y: 0.185, unit: 'A₅₄₀', note: 'Tím nhạt' },
    { id: 3, exp: 'Biuret (Protein)', param: 'C = 5.0 mg/mL', x: 5, y: 0.440, unit: 'A₅₄₀', note: 'Tím đặc trưng phức Cu²⁺–Peptide' },
  ]);
  const [exportMsg, setExportMsg] = useState('');

  const biuret = useMemo(() => calcBiuretAbsorbance(proteinConc), [proteinConc]);
  const catalase = useMemo(
    () => calcCatalaseActivity({ temp: catTemp, ph: catPh, substratePct: catSub }),
    [catTemp, catPh, catSub]
  );
  const osmo = OSMOSIS_SOLUTIONS[osmoType] || OSMOSIS_SOLUTIONS.isotonic;

  // Màu ống nghiệm Biuret: xanh lam (#3b82f6) -> tím đậm (#7c3aed) theo nồng độ protein
  const tubeColor = useMemo(() => {
    const t = Math.min(1, proteinConc / 10);
    const r = Math.round(59 + (124 - 59) * t);
    const g = Math.round(130 + (58 - 130) * t);
    const b = Math.round(246 + (237 - 246) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }, [proteinConc]);

  const recordPoint = () => {
    setExportMsg('');
    if (expTab === 'biuret') {
      const note = proteinConc === 0 ? 'Xanh lam (Không có protein)' : proteinConc < 3 ? 'Tím nhạt' : 'Tím đậm phức Biuret';
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          exp: 'Biuret (Protein)',
          param: `C = ${proteinConc.toFixed(1)} mg/mL`,
          x: proteinConc,
          y: biuret.absorbance,
          unit: 'A₅₄₀',
          note,
        },
      ]);
    } else if (expTab === 'catalase') {
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          exp: 'Enzyme Catalase',
          param: `T=${catTemp}°C, pH=${catPh.toFixed(1)}, H₂O₂=${catSub}%`,
          x: catTemp,
          y: catalase.rate,
          unit: 'mL O₂/ph',
          note: catTemp >= 68 ? 'Enzyme biến tính hoàn toàn' : catalase.rate > 50 ? 'Hoạt tính mạnh' : 'Hoạt tính yếu',
        },
      ]);
    } else {
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          exp: 'Thẩm thấu tế bào',
          param: osmo.label,
          x: osmo.naclPct,
          y: Math.round(osmo.vacuoleScale * 100),
          unit: '% Thể tích',
          note: osmo.status,
        },
      ]);
    }
  };

  const chartData = useMemo(() => {
    if (expTab === 'biuret') {
      return [0, 1, 2, 3, 4, 5, 6, 8, 10].map((c) => ({
        x: c,
        val: calcBiuretAbsorbance(c).absorbance,
      }));
    }
    if (expTab === 'catalase') {
      return [10, 18, 25, 32, 37, 42, 48, 55, 62, 70].map((t) => ({
        x: t,
        val: calcCatalaseActivity({ temp: t, ph: catPh, substratePct: catSub }).rate,
      }));
    }
    return [
      { x: 0, val: 108 },
      { x: 0.9, val: 85 },
      { x: 3, val: 64 },
      { x: 6, val: 50 },
      { x: 10, val: 42 },
    ];
  }, [expTab, catPh, catSub]);

  const handleExportExcel = async () => {
    try {
      await exportStyledWorkbook({
        filename: 'bao-cao-thuc-hanh-sinh-hoc-elec.xlsx',
        mascot: 'celebrate',
        sheets: [
          {
            name: 'So Lieu Thi Nghiem',
            title: 'BÁO CÁO THỰC HÀNH PHÒNG LAB SINH HỌC ẢO — ELEC AI',
            subtitle: 'Số liệu đo đạc trực tiếp từ Bàn thí nghiệm Sinh học Tổng hợp (Biuret · Catalase · Thẩm thấu)',
            columns: [
              { header: 'STT', key: 'stt', align: 'center', width: 8 },
              { header: 'Bài thí nghiệm', key: 'exp', width: 22 },
              { header: 'Thông số cài đặt', key: 'param', width: 32 },
              { header: 'Giá trị đo', key: 'y', align: 'center', width: 14 },
              { header: 'Đơn vị', key: 'unit', align: 'center', width: 14 },
              { header: 'Nhận xét khoa học', key: 'note', width: 34 },
            ],
            rows: logs.map((row, idx) => ({ stt: idx + 1, ...row })),
          },
        ],
      });
      setExportMsg('Đã xuất file Excel (.xlsx) thành công!');
    } catch {
      setExportMsg('Không thể xuất Excel trong môi trường này.');
    }
  };

  const handleExportPdf = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFontSize(15);
      doc.text('ELEC AI - BAO CAO THUC HANH SINH HOC AO', 40, 48);
      doc.setFontSize(10);
      doc.text(`Thoi gian xuat: ${new Date().toLocaleString('vi-VN')}  |  So diem do: ${logs.length}`, 40, 68);
      let y = 98;
      doc.setFontSize(10.5);
      doc.text('STT | Thi nghiem | Thong so | Ket qua | Nhan xet', 40, y);
      y += 14;
      doc.line(40, y - 6, 555, y - 6);
      logs.forEach((row, idx) => {
        if (y > 760) {
          doc.addPage();
          y = 50;
        }
        const safeLine = `${idx + 1}. ${row.exp} | ${row.param} | ${row.y} ${row.unit} | ${row.note}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D');
        doc.text(safeLine.slice(0, 95), 40, y);
        y += 18;
      });
      doc.save('bao-cao-thuc-hanh-sinh-hoc-elec.pdf');
      setExportMsg('Đã xuất file PDF (.pdf) thành công!');
    } catch {
      setExportMsg('Không thể xuất PDF trong môi trường này.');
    }
  };

  return (
    <div className="bl-grid-2">
      <div className="bl-stage">
        {/* Khu vực minh họa thí nghiệm */}
        {expTab === 'biuret' && (
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 14, alignItems: 'center', marginBottom: 12 }}>
            <svg viewBox="0 0 130 185" style={{ width: '100%', height: 'auto' }}>
              {/* Ống nghiệm Biuret */}
              <rect x="42" y="14" width="46" height="148" rx="22" fill="#f1f5f9" stroke="#475569" strokeWidth="2.5" />
              <path
                d="M 44 68 L 86 68 L 86 140 A 20 20 0 0 1 44 140 Z"
                fill={tubeColor}
                fillOpacity="0.88"
              />
              <rect x="38" y="10" width="54" height="7" rx="3" fill="#64748b" />
              <text x="65" y="178" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
                A₅₄₀ = {biuret.absorbance}
              </text>
            </svg>
            <div className="bl-info-card">
              <h4>Phản ứng màu Biuret (Định lượng Protein)</h4>
              <p>
                Trong môi trường kiềm (NaOH), ion <strong>Cu²⁺</strong> tạo phức màu tím với các liên kết peptide (–CO–NH–). Độ hấp thụ quang ở bước sóng 540 nm tuân theo định luật Beer–Lambert: <strong>A₅₄₀ = 0.085·C + 0.015</strong>.
              </p>
            </div>
          </div>
        )}

        {expTab === 'catalase' && (
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 14, alignItems: 'center', marginBottom: 12 }}>
            <svg viewBox="0 0 140 175" style={{ width: '100%', height: 'auto' }}>
              <rect x="38" y="20" width="64" height="135" rx="14" fill="#eff6ff" stroke="#334155" strokeWidth="2.2" />
              <rect x="40" y="75" width="60" height="78" rx="10" fill="#bae6fd" />
              {/* Miếng khoai tây chứa Catalase */}
              <rect x="52" y="128" width="36" height="18" rx="5" fill="#d97706" />
              {/* Bọt khí O2 tỷ lệ tốc độ enzyme */}
              {Array.from({ length: Math.min(18, Math.round(catalase.rate / 4)) }).map((_, i) => (
                <circle
                  key={i}
                  cx={48 + ((i * 17) % 44)}
                  cy={120 - ((i * 11) % 58)}
                  r={2.5 + (i % 3)}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth="1"
                />
              ))}
              <text x="70" y="170" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
                {catalase.rate} mL O₂/phút
              </text>
            </svg>
            <div className="bl-info-card">
              <h4>Phản ứng phân giải H₂O₂ bởi Catalase</h4>
              <p>
                <strong>2H₂O₂ → 2H₂O + O₂↑</strong>. Khi nhiệt độ đạt ≥ 68°C (đun sôi mẫu khoai tây/gan), cấu trúc không gian của enzyme Catalase bị <strong>biến tính không thuận nghịch</strong> nên không còn sủi bọt khí.
              </p>
            </div>
          </div>
        )}

        {expTab === 'osmosis' && (
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14, alignItems: 'center', marginBottom: 12 }}>
            <svg viewBox="0 0 160 160" style={{ width: '100%', height: 'auto' }}>
              {/* Thành tế bào thực vật cố định */}
              <rect x="16" y="16" width="128" height="128" rx="18" fill="#dcfce7" stroke="#15803d" strokeWidth="5" />
              {/* Khối nguyên sinh co giãn */}
              <circle
                cx="80"
                cy="80"
                r={osmo.cellRadius}
                fill="#86efac"
                stroke="#047857"
                strokeWidth="2.5"
                style={{ transition: 'all 0.35s ease' }}
              />
              {/* Không bào trung tâm */}
              <ellipse
                cx="80"
                cy="82"
                rx={osmo.cellRadius * 0.62}
                ry={osmo.cellRadius * 0.48}
                fill="#38bdf8"
                fillOpacity="0.65"
                style={{ transition: 'all 0.35s ease' }}
              />
              <circle cx={80 + osmo.cellRadius * 0.45} cy={80 - osmo.cellRadius * 0.35} r="7" fill="#7c3aed" />
            </svg>
            <div className="bl-info-card">
              <h4>Trạng thái: {osmo.status}</h4>
              <p>{osmo.desc}</p>
            </div>
          </div>
        )}

        <BioLiveChart
          data={chartData}
          xKey="x"
          xLabel={expTab === 'biuret' ? 'Nồng độ Protein (mg/mL)' : expTab === 'catalase' ? 'Nhiệt độ (°C)' : 'Nồng độ NaCl (%)'}
          yLabel={expTab === 'biuret' ? 'Độ hấp thụ A₅₄₀' : expTab === 'catalase' ? 'mL O₂ / phút' : 'Thể tích không bào (%)'}
          height={195}
          series={[
            {
              key: 'val',
              label:
                expTab === 'biuret'
                  ? 'Đường chuẩn Beer–Lambert'
                  : expTab === 'catalase'
                    ? `Hoạt tính Catalase (pH ${catPh.toFixed(1)})`
                    : 'Đường cong co nguyên sinh',
              color: expTab === 'biuret' ? '#7c3aed' : expTab === 'catalase' ? '#0284c7' : '#10b981',
            },
          ]}
        />
      </div>

      <div className="bl-panel">
        <div className="bl-ctrl">
          <label>Chọn bài thí nghiệm thực hành</label>
          <div className="bl-seg">
            {[
              { id: 'biuret', label: '1. Biuret Protein' },
              { id: 'catalase', label: '2. Enzyme Catalase' },
              { id: 'osmosis', label: '3. Co nguyên sinh' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={expTab === t.id ? 'active' : ''}
                onClick={() => setExpTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {expTab === 'biuret' && (
          <div className="bl-ctrl">
            <div className="bl-ctrl-row">
              <label>Nồng độ dung dịch Albumin / Protein</label>
              <strong>{proteinConc.toFixed(1)} mg/mL → A₅₄₀ = {biuret.absorbance}</strong>
            </div>
            <input type="range" className="bl-range" min="0" max="10" step="0.5" value={proteinConc} onChange={(e) => setProteinConc(Number(e.target.value))} />
          </div>
        )}

        {expTab === 'catalase' && (
          <>
            <div className="bl-ctrl">
              <div className="bl-ctrl-row">
                <label>Nhiệt độ bể ủ</label>
                <strong>{catTemp}°C (Hiệu suất nhiệt: {catalase.fTemp}%)</strong>
              </div>
              <input type="range" className="bl-range" min="5" max="80" step="1" value={catTemp} onChange={(e) => setCatTemp(Number(e.target.value))} />
            </div>
            <div className="bl-ctrl">
              <div className="bl-ctrl-row">
                <label>Độ pH dung dịch đệm</label>
                <strong>pH {catPh.toFixed(1)} (Hiệu suất pH: {catalase.fPh}%)</strong>
              </div>
              <input type="range" className="bl-range" min="2" max="12" step="0.5" value={catPh} onChange={(e) => setCatPh(Number(e.target.value))} />
            </div>
            <div className="bl-ctrl">
              <div className="bl-ctrl-row">
                <label>Nồng độ cơ chất H₂O₂</label>
                <strong>{catSub.toFixed(1)}%</strong>
              </div>
              <input type="range" className="bl-range" min="0.5" max="8" step="0.5" value={catSub} onChange={(e) => setCatSub(Number(e.target.value))} />
            </div>
          </>
        )}

        {expTab === 'osmosis' && (
          <div className="bl-ctrl">
            <label>Nhỏ dung dịch môi trường ngoài</label>
            <div className="bl-seg">
              {Object.entries(OSMOSIS_SOLUTIONS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  className={osmoType === k ? 'active' : ''}
                  onClick={() => setOsmoType(k)}
                >
                  {v.label.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Data Logger */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="bl-btn cobalt" onClick={recordPoint}>
            + Ghi điểm đo vào bảng số liệu
          </button>
          <button type="button" className="bl-btn" onClick={handleExportExcel} disabled={!logs.length}>
            Xuất Excel (.xlsx)
          </button>
          <button type="button" className="bl-btn" onClick={handleExportPdf} disabled={!logs.length}>
            Xuất PDF (.pdf)
          </button>
          {logs.length > 0 && (
            <button type="button" className="bl-btn" onClick={() => setLogs([])}>
              Xóa bảng
            </button>
          )}
        </div>

        {exportMsg && (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{exportMsg}</div>
        )}

        <div style={{ maxHeight: 175, overflowY: 'auto', borderRadius: 10, border: '1px solid rgba(148,163,184,0.22)' }}>
          <table className="bl-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Thí nghiệm</th>
                <th>Thông số</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', opacity: 0.65 }}>
                    Chưa có điểm đo nào. Hãy điều chỉnh thông số và nhấn "Ghi điểm đo".
                  </td>
                </tr>
              ) : (
                logs.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>{row.exp}</td>
                    <td>{row.param}</td>
                    <td>
                      <strong>{row.y}</strong> {row.unit}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="bl-btn"
          onClick={() =>
            onAskAI?.(
              `Tôi vừa đo được ${logs.length} điểm thí nghiệm trong Bàn thí nghiệm Sinh học ảo (${expTab === 'biuret' ? 'Biuret Protein' : expTab === 'catalase' ? 'Enzyme Catalase' : 'Co nguyên sinh'}). Hãy giúp tôi viết phần phân tích sai số và kết luận cho báo cáo thực hành chuẩn SGK!`
            )
          }
        >
          Nhờ Bé ELEC viết nhận xét báo cáo thực hành
        </button>
      </div>
    </div>
  );
}
