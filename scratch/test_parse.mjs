import { parseChalkboardFromText, detectDimensionAndAxes } from '../src/lib/aiChalkboardParser.js';

const sampleText = `
I. Phân tích giả thiết & Xác định giao tuyến
- Hình chóp S.ABC với E, F là trung điểm AC, BC...

Bước 1: Tìm giao tuyến của (SAB) và (SEF)
Vì EF // AB (đường trung bình), nên EF song song với mặt phẳng (SAB)...
Giao tuyến phải là đường thẳng qua S và song song với AB (và EF). Gọi giao tuyến là d. d // AB và d // EF.

\`\`\`chalkboard-mv
A = (-2, -2)
B = (2, -2)
C = (1, 2)
\`\`\`
`;

console.log('Result:', parseChalkboardFromText(sampleText));
