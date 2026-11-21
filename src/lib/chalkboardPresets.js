/* ============================================================
   chalkboardPresets.js — THƯ VIỆN 6 MÔ HÌNH VẼ KHTN 3D & 2D CHUẨN ELEC AI
   Dùng để mở trực tiếp Bảng Vẽ Studio từ nút "Bảng 3D" hoặc chuyển nhanh
   ngay trong InteractiveChalkboardCanvas mà không cần chờ API.
   ============================================================ */

export const CHALKBOARD_PRESETS = [
  {
    id: 'pyramid-section',
    badge: 'Hình 3D',
    shortTitle: 'Chóp S.ABC & Thiết diện',
    tieuDe: 'Hình chóp S.ABC & Thiết diện mặt phẳng (IQPE)',
    mon: 'toan',
    baChieu: true,
    heTruc: false,
    gocNhin: [-1.22, 0.36, 0.84],
    aiPrompt: 'Giải chi tiết bài toán tìm thiết diện của hình chóp S.ABC cắt bởi mặt phẳng đi qua trung điểm E của AC, điểm I trên SA (AI = 3IS) và trọng tâm G của tam giác SBC, kèm tính tỉ số bằng định lý Menelaus.',
    dapSo: 'Thiết diện là tứ giác $IQPE$ với $I \\in SA,\\; Q \\in SB,\\; P \\in BC,\\; E \\in AC$.',
    meoNho: 'Muốn tìm thiết diện không gian nhanh: luôn tìm giao tuyến ở mặt đáy trước bằng cách kéo dài 2 đường đồng phẳng cắt nhau.',
    params: [
      { key: 'h', label: 'Chiều cao S', min: 3.0, max: 6.6, step: 0.2, defaultVal: 5.0, unit: 'đv' },
      { key: 'ratio', label: 'Tỉ lệ SI/SA', min: 0.15, max: 0.78, step: 0.05, defaultVal: 0.25, unit: '' },
    ],
    buildDynamic(vals) {
      const h = Number(vals.h ?? 5.0);
      const t = Number(vals.ratio ?? 0.25);
      const A = [-3.2, 0, 0];
      const C = [3.5, 0, 0];
      const B = [-0.6, -2.6, 0];
      const S = [0.2, 0.4, h];
      const lerp = (p, q, k) => [
        +(p[0] + (q[0] - p[0]) * k).toFixed(2),
        +(p[1] + (q[1] - p[1]) * k).toFixed(2),
        +(p[2] + (q[2] - p[2]) * k).toFixed(2),
      ];
      const I = lerp(S, A, t);
      const Q = lerp(S, B, Math.min(0.85, t + 0.1));
      const P = lerp(B, C, Math.min(0.82, 0.22 + t * 0.45));
      const E = [0.15, 0, 0];
      return {
        readout: [
          { label: 'Chiều cao h', value: `${h.toFixed(1)} đv` },
          { label: 'Tỉ lệ SI / SA', value: `${Math.round(t * 100)}%` },
          { label: 'Dạng thiết diện', value: 'Tứ giác IQPE' },
        ],
        lenh: [
          `A = (${A.join(', ')})`,
          `C = (${C.join(', ')})`,
          `B = (${B.join(', ')})`,
          `S = (${S.join(', ')})`,
          'Segment(A, C) | style=dashed | color=white',
          'Segment(A, B) | color=yellow',
          'Segment(B, C) | color=yellow',
          'Segment(S, A)',
          'Segment(S, B)',
          'Segment(S, C)',
          `E = (${E.join(', ')})`,
          `I = (${I.join(', ')})`,
          `Q = (${Q.join(', ')})`,
          `P = (${P.join(', ')})`,
          'Segment(I, Q) | color=pink',
          'Segment(Q, P) | color=pink',
          'Segment(P, E) | style=dashed | color=pink',
          'Segment(E, I) | style=dashed | color=pink',
          'Polygon(I, Q, P, E) | color=pink',
        ],
      };
    },
    buoc: [
      {
        buocSo: 1,
        tieuDe: 'Dựng hình chóp S.ABC chuẩn phối cảnh SGK',
        giaiThich: 'Khởi tạo đáy $\\triangle ABC$ có cạnh $AC$ nằm phía sau (nét đứt) và đỉnh chóp $S$ ở trên cao.',
        lenh: [
          'A = (-3.2, 0, 0)',
          'C = (3.5, 0, 0)',
          'B = (-0.6, -2.6, 0)',
          'S = (0.2, 0.4, 5.0)',
          'Segment(A, C) | style=dashed | color=white',
          'Segment(A, B) | color=yellow',
          'Segment(B, C) | color=yellow',
          'Segment(S, A)',
          'Segment(S, B)',
          'Segment(S, C)',
        ],
      },
      {
        buocSo: 2,
        tieuDe: 'Xác định trung điểm E, điểm I và đường phụ',
        giaiThich: 'Lấy $E$ là trung điểm $AC$, điểm $I \\in SA$ với $AI = 3IS$, và dựng đường đồng phẳng xác định $Q \\in SB$, $P \\in BC$.',
        lenh: [
          'E = (0.15, 0, 0)',
          'I = (-0.65, 0.3, 3.75)',
          'Q = (-0.35, -0.65, 3.25)',
          'P = (0.75, -1.8, 0)',
          'Segment(I, E) | style=dashed | color=blue',
        ],
      },
      {
        buocSo: 3,
        tieuDe: 'Hoàn thiện mặt cắt thiết diện IQPE',
        giaiThich: 'Nối 4 đoạn giao tuyến: $IQ, QP$ nằm trên mặt trước (nét liền hồng) và $PE, EI$ khuất bên trong (nét đứt hồng).',
        lenh: [
          'Segment(I, Q) | color=pink',
          'Segment(Q, P) | color=pink',
          'Segment(P, E) | style=dashed | color=pink',
          'Segment(E, I) | style=dashed | color=pink',
          'Polygon(I, Q, P, E) | color=pink',
        ],
      },
    ],
  },
  {
    id: 'cube-3d',
    badge: 'Hình 3D',
    shortTitle: 'Hình lập phương 3D',
    tieuDe: "Hình lập phương ABCD.A'B'C'D' & Đường chéo không gian",
    mon: 'toan',
    baChieu: true,
    heTruc: false,
    gocNhin: [-1.18, 0.42, 1.0],
    aiPrompt: "Cho hình lập phương ABCD.A'B'C'D' cạnh a. Hãy tính góc giữa đường chéo AC' với mặt đáy (ABCD) và khoảng cách từ B đến mặt phẳng (ACC'A').",
    dapSo: "Đường chéo không gian $AC' = a\\sqrt{3}$, góc $\\widehat{(AC',(ABCD))} = \\arctan\\left(\\frac{1}{\\sqrt{2}}\\right) \\approx 35,26^\\circ$.",
    meoNho: "Trong hình lập phương cạnh $a$: đường chéo mặt bên là $a\\sqrt{2}$, đường chéo khối là $a\\sqrt{3}$.",
    buoc: [
      {
        buocSo: 1,
        tieuDe: 'Dựng mặt đáy ABCD chuẩn phối cảnh',
        giaiThich: 'Khởi tạo hình vuông đáy $ABCD$ với các cạnh khuất $AB, AD$ vẽ nét đứt.',
        lenh: [
          'A = (-2.2, 1.1, 0)',
          'B = (1.6, 1.1, 0)',
          'C = (2.6, -1.1, 0)',
          'D = (-1.2, -1.1, 0)',
          'Segment(A, B) | style=dashed | color=white',
          'Segment(A, D) | style=dashed | color=white',
          'Segment(B, C) | color=yellow',
          'Segment(D, C) | color=yellow',
        ],
      },
      {
        buocSo: 2,
        tieuDe: "Dựng các cạnh bên và đáy trên A'B'C'D'",
        giaiThich: "Dựng 4 cạnh bên vuông góc đáy ($AA'$ khuất nét đứt) và hoàn thiện mặt trên $A'B'C'D'$.",
        lenh: [
          "A' = (-2.2, 1.1, 3.6)",
          "B' = (1.6, 1.1, 3.6)",
          "C' = (2.6, -1.1, 3.6)",
          "D' = (-1.2, -1.1, 3.6)",
          "Segment(A, A') | style=dashed | color=white",
          "Segment(B, B')",
          "Segment(C, C')",
          "Segment(D, D')",
          "Segment(A', B') | color=blue",
          "Segment(B', C') | color=blue",
          "Segment(C', D') | color=blue",
          "Segment(D', A') | color=blue",
        ],
      },
      {
        buocSo: 3,
        tieuDe: "Dựng đường chéo AC' & mặt chéo (ACC'A')",
        giaiThich: "Kẻ đường chéo đáy $AC$ (nét đứt xanh) và đường chéo không gian $AC'$ tạo góc với đáy ngay tại đỉnh $A$.",
        lenh: [
          'Segment(A, C) | style=dashed | color=green',
          "Segment(A, C') | color=pink",
          "Polygon(A, C, C', A') | color=pink",
        ],
      },
    ],
  },
  {
    id: 'ch4-molecule',
    badge: 'Hóa 3D',
    shortTitle: 'Phân tử CH₄ Tứ diện',
    tieuDe: 'Cấu trúc không gian phân tử Mêtan CH₄ (Lai hóa sp³)',
    mon: 'hoa',
    baChieu: true,
    heTruc: false,
    gocNhin: [-1.15, 0.34, 0.86],
    aiPrompt: 'Giải thích trạng thái lai hóa sp3 của nguyên tử Carbon trong phân tử CH4, góc liên kết 109,5° và so sánh với NH3 (107°) và H2O (104,5°).',
    dapSo: 'Phân tử $\\text{CH}_4$ có dạng tứ diện đều, góc liên kết $\\widehat{H-C-H} = 109,5^\\circ$.',
    meoNho: 'Mỗi cặp electron chưa liên kết đẩy mạnh hơn cặp liên kết: CH₄ (0 cặp tự do → 109,5°) > NH₃ (1 cặp → 107°) > H₂O (2 cặp → 104,5°).',
    buoc: [
      {
        buocSo: 1,
        tieuDe: 'Nguyên tử Carbon trung tâm & 4 đỉnh Hydro',
        giaiThich: 'Đặt nguyên tử Carbon $C$ tại tâm $(0,0,0)$ và 4 nguyên tử $H_1, H_2, H_3, H_4$ tại 4 đỉnh tứ diện đều.',
        lenh: [
          'C = (0, 0, 0)',
          'H1 = (0, 0, 2.8)',
          'H2 = (2.64, 0, -0.93)',
          'H3 = (-1.32, 2.29, -0.93)',
          'H4 = (-1.32, -2.29, -0.93)',
        ],
      },
      {
        buocSo: 2,
        tieuDe: 'Dựng 4 liên kết cộng hóa trị đơn C–H',
        giaiThich: '4 obitan lai hóa $sp^3$ của Carbon xen phủ trục với 4 obitan $1s$ của Hydro tạo 4 liên kết $\\sigma$ bền vững.',
        lenh: [
          'Segment(C, H1) | color=blue',
          'Segment(C, H2) | color=blue',
          'Segment(C, H3) | color=blue',
          'Segment(C, H4) | color=blue',
        ],
      },
      {
        buocSo: 3,
        tieuDe: 'Khung hình học tứ diện đều (góc 109,5°)',
        giaiThich: 'Nối 4 nguyên tử Hydro bằng nét đứt để thấy rõ hình tứ diện đều đối xứng hoàn toàn trong không gian 3D.',
        lenh: [
          'Segment(H1, H2) | style=dashed | color=yellow',
          'Segment(H1, H3) | style=dashed | color=yellow',
          'Segment(H1, H4) | style=dashed | color=yellow',
          'Segment(H2, H3) | style=dashed | color=white',
          'Segment(H3, H4) | style=dashed | color=white',
          'Segment(H4, H2) | style=dashed | color=white',
          'Polygon(H2, H3, H4) | color=green',
        ],
      },
    ],
  },
  {
    id: 'fresnel-rlc',
    badge: 'Lý 2D',
    shortTitle: 'Giản đồ Fresnel RLC',
    tieuDe: 'Giản đồ Véctơ Fresnel mạch điện xoay chiều RLC nối tiếp',
    mon: 'ly',
    baChieu: false,
    heTruc: true,
    gocNhin: [0, 0, 1.0],
    aiPrompt: 'Giải thích cách vẽ giản đồ véctơ Fresnel cho mạch điện xoay chiều RLC nối tiếp và cách suy ra công thức tổng trở Z, độ lệch pha tanφ, điều kiện cộng hưởng điện.',
    dapSo: '$U = \\sqrt{U_R^2 + (U_L - U_C)^2},\\quad \\tan\\varphi = \\frac{U_L - U_C}{U_R} = \\frac{Z_L - Z_C}{R}$.',
    meoNho: 'Véctơ $U_R$ nằm ngang cùng pha $I$; $U_L$ hướng lên sớm pha $\\frac{\\pi}{2}$; $U_C$ hướng xuống trễ pha $\\frac{\\pi}{2}$.',
    params: [
      { key: 'R', label: 'Điện trở R', min: 20, max: 120, step: 5, defaultVal: 60, unit: 'Ω' },
      { key: 'ZL', label: 'Cảm kháng Z_L', min: 10, max: 140, step: 5, defaultVal: 95, unit: 'Ω' },
      { key: 'ZC', label: 'Dung kháng Z_C', min: 10, max: 140, step: 5, defaultVal: 45, unit: 'Ω' },
    ],
    buildDynamic(vals) {
      const R = Number(vals.R ?? 60);
      const ZL = Number(vals.ZL ?? 95);
      const ZC = Number(vals.ZC ?? 45);
      const scale = 25;
      const rx = +(R / scale).toFixed(2);
      const ly = +(ZL / scale).toFixed(2);
      const cy = +(-ZC / scale).toFixed(2);
      const uy = +((ZL - ZC) / scale).toFixed(2);
      const Z = Math.hypot(R, ZL - ZC);
      const phiDeg = (Math.atan2(ZL - ZC, R) * 180) / Math.PI;
      const cosPhi = R / (Z || 1);
      const isResonance = Math.abs(ZL - ZC) <= 2;
      return {
        readout: [
          { label: 'Tổng trở Z', value: `${Z.toFixed(1)} Ω` },
          { label: 'Độ lệch pha φ', value: `${phiDeg >= 0 ? '+' : ''}${phiDeg.toFixed(1)}°` },
          { label: 'cos φ', value: isResonance ? '1.00 · CỘNG HƯỞNG!' : cosPhi.toFixed(2), highlight: isResonance },
        ],
        lenh: [
          'O = (0, 0)',
          `R = (${rx}, 0)`,
          `L = (0, ${ly})`,
          `C = (0, ${cy})`,
          `M = (0, ${uy})`,
          `U = (${rx}, ${uy})`,
          'Vector(O, R) | color=yellow',
          'Vector(O, L) | color=blue',
          'Vector(O, C) | color=pink',
          'Vector(O, M) | color=green',
          'Vector(O, U) | color=green',
          'Segment(R, U) | style=dashed | color=white',
          'Segment(M, U) | style=dashed | color=white',
        ],
      };
    },
    buoc: [
      {
        buocSo: 1,
        tieuDe: 'Dựng trục dòng điện I và véctơ U_R',
        giaiThich: 'Chọn trục hoành là trục dòng điện $I$, dựng véctơ $\\vec{U}_R$ cùng phương, cùng chiều với $I$.',
        lenh: [
          'O = (0, 0)',
          'R = (3.6, 0)',
          'Vector(O, R) | color=yellow',
        ],
      },
      {
        buocSo: 2,
        tieuDe: 'Dựng véctơ U_L hướng lên & U_C hướng xuống',
        giaiThich: '$\\vec{U}_L$ vuông góc hướng lên trên ($+\\pi/2$), $\\vec{U}_C$ hướng xuống dưới ($-\\pi/2$).',
        lenh: [
          'L = (0, 3.8)',
          'C = (0, -1.8)',
          'M = (0, 2.0)',
          'Vector(O, L) | color=blue',
          'Vector(O, C) | color=pink',
        ],
      },
      {
        buocSo: 3,
        tieuDe: 'Tổng hợp véctơ điện áp toàn mạch U',
        giaiThich: 'Tổng hợp $\\vec{U}_{LC} = \\vec{U}_L + \\vec{U}_C$ rồi áp dụng quy tắc hình chữ nhật tìm $\\vec{U}$ hợp với trục $I$ góc lệch pha $\\varphi$.',
        lenh: [
          'U = (3.6, 2.0)',
          'Vector(O, M) | color=green',
          'Vector(O, U) | color=green',
          'Segment(R, U) | style=dashed | color=white',
          'Segment(M, U) | style=dashed | color=white',
        ],
      },
    ],
  },
  {
    id: 'inclined-plane',
    badge: 'Lý 2D',
    shortTitle: 'Phân tích lực mặt nghiêng',
    tieuDe: 'Phân tích các lực tác dụng lên vật trên mặt phẳng nghiêng',
    mon: 'ly',
    baChieu: false,
    heTruc: false,
    gocNhin: [0, 0, 1.0],
    aiPrompt: 'Phân tích các lực tác dụng lên vật khối lượng m trượt trên mặt phẳng nghiêng góc α có hệ số ma sát μ, suy ra công thức tính gia tốc a.',
    dapSo: 'Gia tốc trượt xuống: $a = g(\\sin\\alpha - \\mu\\cos\\alpha)$ khi $\\tan\\alpha > \\mu$.',
    meoNho: 'Chiếu lên trục $Ox$ dọc mặt nghiêng: $P_x = mg\\sin\\alpha$; chiếu lên $Oy$ vuông góc: $N = P_y = mg\\cos\\alpha$.',
    params: [
      { key: 'alpha', label: 'Góc nghiêng α', min: 15, max: 60, step: 1, defaultVal: 30, unit: '°' },
      { key: 'mu', label: 'Ma sát μ', min: 0, max: 0.8, step: 0.05, defaultVal: 0.2, unit: '' },
    ],
    buildDynamic(vals) {
      const deg = Number(vals.alpha ?? 30);
      const mu = Number(vals.mu ?? 0.2);
      const rad = (deg * Math.PI) / 180;
      const g = 9.8;
      const sinA = Math.sin(rad);
      const cosA = Math.cos(rad);
      const acc = g * (sinA - mu * cosA);
      const baseLen = 7.4;
      const h = Math.min(5.2, +(baseLen * Math.tan(rad)).toFixed(2));
      const Ax = -3.7;
      const Ay = -1.8;
      const Bx = 3.7;
      const By = Ay;
      const Cx = Bx;
      const Cy = +(Ay + h).toFixed(2);
      const Mx = +((Ax + Cx) * 0.5).toFixed(2);
      const My = +((Ay + Cy) * 0.5 + 0.25).toFixed(2);
      const pLen = 2.8;
      const Px = +(Mx - pLen * sinA * cosA).toFixed(2);
      const Py = +(My - pLen * sinA * sinA).toFixed(2);
      const Nx = +(Mx - pLen * cosA * sinA).toFixed(2);
      const Ny = +(My + pLen * cosA * cosA).toFixed(2);
      const fLen = Math.min(pLen * sinA, pLen * mu * cosA);
      const Fx = +(Mx + fLen * cosA).toFixed(2);
      const Fy = +(My + fLen * sinA).toFixed(2);
      return {
        readout: [
          { label: 'Góc α / tan α', value: `${deg}° (${Math.tan(rad).toFixed(2)})` },
          { label: 'Hệ số ma sát μ', value: mu.toFixed(2) },
          {
            label: 'Gia tốc trượt a',
            value: acc > 0.02 ? `${acc.toFixed(2)} m/s²` : 'Đứng yên (a = 0)',
            highlight: acc <= 0.02,
          },
        ],
        lenh: [
          `A = (${Ax}, ${Ay})`,
          `B = (${Bx}, ${By})`,
          `C = (${Cx}, ${Cy})`,
          `M = (${Mx}, ${My})`,
          `P = (${Mx}, ${(My - pLen).toFixed(2)})`,
          `N = (${Nx}, ${Ny})`,
          `Px = (${Px}, ${Py})`,
          `F = (${Fx}, ${Fy})`,
          'Segment(A, B) | color=white',
          'Segment(B, C) | color=white',
          'Segment(A, C) | color=yellow',
          'Polygon(A, B, C) | color=yellow',
          'Vector(M, P) | color=pink',
          'Vector(M, N) | color=blue',
          'Vector(M, Px) | color=green',
          'Vector(M, F) | color=yellow',
          'Segment(Px, P) | style=dashed | color=white',
        ],
      };
    },
    buoc: [
      {
        buocSo: 1,
        tieuDe: 'Dựng mặt phẳng nghiêng góc α & vị trí vật M',
        giaiThich: 'Dựng mặt phẳng nghiêng $ABC$ góc nghiêng $\\alpha \\approx 30^\\circ$ và đặt tâm khối vật tại điểm $M$.',
        lenh: [
          'A = (-4.0, -1.6)',
          'B = (3.6, -1.6)',
          'C = (3.6, 2.4)',
          'M = (0.0, 0.5)',
          'Segment(A, B) | color=white',
          'Segment(B, C) | color=white',
          'Segment(A, C) | color=yellow',
          'Polygon(A, B, C) | color=yellow',
        ],
      },
      {
        buocSo: 2,
        tieuDe: 'Dựng trọng lực P & phản lực vuông góc N',
        giaiThich: 'Trọng lực $\\vec{P}$ luôn thẳng đứng hướng xuống; phản lực $\\vec{N}$ vuông góc với mặt nghiêng hướng lên.',
        lenh: [
          'P = (0.0, -2.5)',
          'N = (-1.15, 2.68)',
          'Vector(M, P) | color=pink',
          'Vector(M, N) | color=blue',
        ],
      },
      {
        buocSo: 3,
        tieuDe: 'Phân tích Px, Py và lực ma sát Fms',
        giaiThich: 'Phân tích $\\vec{P} = \\vec{P}_x + \\vec{P}_y$ (nét đứt) và vẽ lực ma sát trượt $\\vec{F}_{ms}$ ngược chiều chuyển động.',
        lenh: [
          'Px = (-1.15, -0.11)',
          'Py = (1.15, -1.68)',
          'F = (1.45, 1.26)',
          'Vector(M, Px) | color=green',
          'Vector(M, F) | color=yellow',
          'Segment(Px, P) | style=dashed | color=white',
          'Segment(Py, P) | style=dashed | color=white',
        ],
      },
    ],
  },
  {
    id: 'parabola-oxy',
    badge: 'Toán 2D',
    shortTitle: 'Đồ thị Parabol Oxy',
    tieuDe: 'Khảo sát đồ thị Parabol y = x² − 2x − 3 & Tiếp tuyến',
    mon: 'toan',
    baChieu: false,
    heTruc: true,
    gocNhin: [0, 0, 1.0],
    aiPrompt: 'Khảo sát sự biến thiên, tìm đỉnh, giao điểm với các trục tọa độ và viết phương trình tiếp tuyến của đồ thị hàm số y = x^2 - 2x - 3 tại điểm có hoành độ x = 2.',
    dapSo: 'Đỉnh $I(1; -4)$, giao $Ox$ tại $(-1;0),(3;0)$, tiếp tuyến tại $M(2;-3)$ là $y = 2x - 7$.',
    meoNho: 'Hoành độ đỉnh parabol $y = ax^2 + bx + c$ luôn là $x_I = -\\frac{b}{2a}$, cũng chính là nghiệm của $y\' = 0$.',
    params: [
      { key: 'a', label: 'Hệ số a', min: -1.5, max: 2.0, step: 0.25, defaultVal: 1.0, unit: '' },
      { key: 'x0', label: 'Tiếp điểm x₀', min: -2.0, max: 3.5, step: 0.5, defaultVal: 2.0, unit: '' },
    ],
    buildDynamic(vals) {
      let a = Number(vals.a ?? 1.0);
      if (Math.abs(a) < 0.2) a = 0.25;
      const x0 = Number(vals.x0 ?? 2.0);
      const y0 = +(a * x0 * x0 - 2 * x0 - 3).toFixed(2);
      const k = +(2 * a * x0 - 2).toFixed(2);
      const c = +(y0 - k * x0).toFixed(2);
      const xI = +(1 / a).toFixed(2);
      const yI = +(a * xI * xI - 2 * xI - 3).toFixed(2);
      return {
        readout: [
          { label: 'Parabol', value: `y = ${a}x² − 2x − 3` },
          { label: 'Đỉnh I', value: `(${xI}; ${yI})` },
          { label: 'Tiếp tuyến tại x₀', value: `y = ${k}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)}` },
        ],
        lenh: [
          `I = (${xI}, ${yI})`,
          `M = (${x0}, ${y0})`,
          `Plot(${a}*x^2 - 2*x - 3, domain=[-2.8, 4.4]) | color=blue`,
          `Plot(${k}*x + (${c}), domain=[${(x0 - 2.4).toFixed(1)}, ${(x0 + 2.4).toFixed(1)}]) | color=pink`,
          `T1 = (${xI}, -5)`,
          `T2 = (${xI}, 5)`,
          'Segment(T1, T2) | style=dashed | color=white',
        ],
      };
    },
    buoc: [
      {
        buocSo: 1,
        tieuDe: 'Xác định đỉnh I và các giao điểm với trục tọa độ',
        giaiThich: 'Đỉnh $I(1; -4)$, giao trục tung $C(0; -3)$ và hai nghiệm $A(-1; 0)$, $B(3; 0)$.',
        lenh: [
          'I = (1, -4)',
          'A = (-1, 0)',
          'B = (3, 0)',
          'C = (0, -3)',
        ],
      },
      {
        buocSo: 2,
        tieuDe: 'Vẽ đường cong Parabol y = x² − 2x − 3',
        giaiThich: 'Parabol bề lõm hướng lên trên ($a = 1 > 0$), nhận đường thẳng $x = 1$ làm trục đối xứng.',
        lenh: [
          'Plot(x^2 - 2*x - 3, domain=[-2.2, 4.2]) | color=blue',
          'T1 = (1, -5)',
          'T2 = (1, 4)',
          'Segment(T1, T2) | style=dashed | color=white',
        ],
      },
      {
        buocSo: 3,
        tieuDe: 'Vẽ tiếp tuyến tại M(2; −3)',
        giaiThich: 'Hệ số góc $k = y\'(2) = 2(2) - 2 = 2$, phương trình tiếp tuyến $d: y = 2x - 7$.',
        lenh: [
          'M = (2, -3)',
          'Plot(2*x - 7, domain=[0, 4.5]) | color=pink',
        ],
      },
    ],
  },
];

export function getDefaultPresetForSubject(subjectLens = 'all') {
  if (subjectLens === 'ly') return CHALKBOARD_PRESETS.find((p) => p.id === 'fresnel-rlc') || CHALKBOARD_PRESETS[0];
  if (subjectLens === 'hoa') return CHALKBOARD_PRESETS.find((p) => p.id === 'ch4-molecule') || CHALKBOARD_PRESETS[0];
  return CHALKBOARD_PRESETS[0];
}
