/**
 * scripts/generate-pseo-pages.mjs
 * -------------------------------------------------------------------
 * Programmatic SEO (pSEO) Static HTML & Sitemap Generator cho ELEC Science AI.
 * Biến toàn bộ dữ liệu học thuật thực tế trong `src/data/` thành hàng trăm
 * trang HTML tĩnh siêu nhanh (Edge CDN < 50ms TTFB, không phụ thuộc JS nặng),
 * chuẩn Schema.org JSON-LD, có Internal Link Silo trỏ ngược về các Pillar Pages:
 *
 *   1. /nguyen-to & /nguyen-to/:symbol           (119 trang — 118 nguyên tố IUPAC)
 *   2. /de-thi & /de-thi/:id                     (67 trang — 66 đề thi thử THPTQG & ĐGNL kèm câu hỏi mẫu + đáp án)
 *   3. /phuong-trinh & /phuong-trinh/:slug       (65+ trang — phương trình hóa học THPT trọng tâm)
 *   4. /kien-thuc & /kien-thuc/:mon/:chuyen-de   (126 trang — 125 chuyên đề 12 môn THPT chuẩn GDPT 2018)
 *   5. dist/sitemap-pseo.xml                     (Sitemap tự động cho toàn bộ URL pSEO)
 */
import fs from 'node:fs';
import path from 'node:path';
import { ELEMENTS, CATS } from '../src/data/elements.js';
import { REACTIONS } from '../src/data/reactions.js';
import { VIRTUAL_EXAMS, buildExamQuestionsForPaper } from '../src/data/virtualExamsBank.js';
import { TOPICS_BY_SUBJECT } from '../src/data/topicsBySubject.js';
import { GDPT2026_CARDS } from '../src/data/formulasGdpt2026.js';
import { SITE_ORIGIN } from '../src/data/seoPillarRoutes.js';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const TODAY = new Date().toISOString().split('T')[0];

const CAT_LABEL = Object.fromEntries(CATS);

const ELEMENT_VI_NAMES = {
  H: 'Hiđro', He: 'Heli', Li: 'Liti', Be: 'Beri', B: 'Bo', C: 'Cacbon', N: 'Nitơ', O: 'Oxi', F: 'Flo', Ne: 'Neon',
  Na: 'Natri', Mg: 'Magie', Al: 'Nhôm', Si: 'Silic', P: 'Photpho', S: 'Lưu huỳnh', Cl: 'Clo', Ar: 'Argon', K: 'Kali', Ca: 'Canxi',
  Cr: 'Crom', Mn: 'Mangan', Fe: 'Sắt', Co: 'Coban', Ni: 'Niken', Cu: 'Đồng', Zn: 'Kẽm', Br: 'Brom', Ag: 'Bạc', Sn: 'Thiếc',
  I: 'Iot', Ba: 'Bari', Pt: 'Bạch kim', Au: 'Vàng', Hg: 'Thủy ngân', Pb: 'Chì', U: 'Urani',
};

const SUBJECT_META = {
  'Hóa học': { slug: 'hoa-hoc', pillar: '/hoc-hoa-hoc-online', code: 'hoa', desc: 'Hóa học THPT GDPT 2018 chuẩn danh pháp IUPAC & đkc 24,79 L/mol' },
  'Vật lí': { slug: 'vat-li', pillar: '/hoc-vat-ly-online', code: 'ly', desc: 'Vật lí THPT GDPT 2018 kèm mô phỏng thí nghiệm ảo & công thức nhanh' },
  'Sinh học': { slug: 'sinh-hoc', pillar: '/hoc-sinh-hoc-online', code: 'sinh', desc: 'Sinh học THPT GDPT 2018 kèm Lab 3D tế bào, DNA & di truyền' },
  'Toán': { slug: 'toan', pillar: '/giai-bai-tap-bang-ai', code: 'toan', desc: 'Toán học THPT lớp 10–12 ôn thi tốt nghiệp THPT & ĐGNL' },
  'Ngữ văn': { slug: 'ngu-van', pillar: '/hoc-online-mien-phi', code: 'van', desc: 'Ngữ văn THPT lớp 10–12 đọc hiểu và nghị luận' },
  'Tiếng Anh': { slug: 'tieng-anh', pillar: '/hoc-online-mien-phi', code: 'anh', desc: 'Tiếng Anh THPT ngữ pháp, từ vựng và luyện đề thi' },
  'Lịch sử': { slug: 'lich-su', pillar: '/hoc-online-mien-phi', code: 'su', desc: 'Lịch sử THPT kiến thức trọng tâm & ôn thi tốt nghiệp' },
  'Địa lí': { slug: 'dia-li', pillar: '/hoc-online-mien-phi', code: 'dia', desc: 'Địa lí THPT kiến thức trọng tâm & ôn thi tốt nghiệp' },
  'GDCD': { slug: 'gdcd', pillar: '/hoc-online-mien-phi', code: 'gdcd', desc: 'Giáo dục Kinh tế & Pháp luật THPT' },
  'Tin học': { slug: 'tin-hoc', pillar: '/ai-giao-duc', code: 'tin', desc: 'Tin học THPT lập trình, thuật toán và chuyển đổi số' },
  'Công nghệ': { slug: 'cong-nghe', pillar: '/hoc-online-mien-phi', code: 'cn', desc: 'Công nghệ THPT thực hành kỹ thuật & công nghiệp' },
  'KHTN': { slug: 'khtn', pillar: '/tai-lieu-hoa-hoc', code: 'khtn', desc: 'Khoa học Tự nhiên THCS tích hợp Vật lí – Hóa học – Sinh học' },
};

const EXTRA_CLASSIC_EQUATIONS = [
  { slug: 'fe-hno3-loang', equation: 'Fe + 4HNO₃ (loãng) → Fe(NO₃)₃ + NO↑ + 2H₂O', type: 'Phản ứng oxi hóa – khử', cond: 'Nhiệt độ thường, HNO₃ loãng dư', note: 'Sắt bị oxi hóa lên Fe³⁺, thoát khí không màu NO hóa nâu ngoài không khí (tạo NO₂).' },
  { slug: 'fe-hno3-dac-nong', equation: 'Fe + 6HNO₃ (đặc, nóng) → Fe(NO₃)₃ + 3NO₂↑ + 3H₂O', type: 'Phản ứng oxi hóa – khử', cond: 'Đun nóng (t°), HNO₃ đặc (lưu ý Fe thụ động trong HNO₃ đặc nguội)', note: 'Thoát khí màu nâu đỏ NO₂ mùi hắc, dung dịch thu được có màu vàng nâu của Fe(NO₃)₃.' },
  { slug: 'cu-hno3-loang', equation: '3Cu + 8HNO₃ (loãng) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O', type: 'Phản ứng oxi hóa – khử', cond: 'Nhiệt độ thường', note: 'Đồng tan dần, dung dịch chuyển sang màu xanh lam (Cu²⁺), thoát khí không màu hóa nâu ngoài không khí.' },
  { slug: 'cu-hno3-dac', equation: 'Cu + 4HNO₃ (đặc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O', type: 'Phản ứng oxi hóa – khử', cond: 'Nhiệt độ thường', note: 'Phản ứng mãnh liệt, dung dịch có màu xanh lam, khí màu nâu đỏ NO₂ thoát ra.' },
  { slug: 'cu-h2so4-dac-nong', equation: 'Cu + 2H₂SO₄ (đặc, nóng) → CuSO₄ + SO₂↑ + 2H₂O', type: 'Phản ứng oxi hóa – khử', cond: 'Đun nóng (t°), H₂SO₄ đặc', note: 'Đồng không tác dụng với H₂SO₄ loãng nhưng tan trong H₂SO₄ đặc nóng tạo dung dịch xanh lam và khí mùi hắc SO₂.' },
  { slug: 'fe-h2so4-dac-nong', equation: '2Fe + 6H₂SO₄ (đặc, nóng) → Fe₂(SO₄)₃ + 3SO₂↑ + 6H₂O', type: 'Phản ứng oxi hóa – khử', cond: 'Đun nóng (t°), H₂SO₄ đặc dư', note: 'Sắt bị oxi hóa lên số oxi hóa cao nhất +3; lưu ý Fe, Al, Cr thụ động với H₂SO₄ đặc nguội.' },
  { slug: 'al-naoh-h2o', equation: '2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂↑', type: 'Phản ứng oxi hóa – khử trong môi trường kiềm', cond: 'Nhiệt độ thường', note: 'Nhôm tan dần trong dung dịch kiềm, sủi bọt khí không màu H₂ (không gọi Al là kim loại lưỡng tính, chỉ có Al₂O₃ và Al(OH)₃ lưỡng tính).' },
  { slug: 'al2o3-naoh', equation: 'Al₂O₃ + 2NaOH → 2NaAlO₂ + H₂O', type: 'Phản ứng của oxide lưỡng tính với kiềm', cond: 'Dung dịch NaOH', note: 'Chứng minh tính lưỡng tính của aluminium oxide (Al₂O₃).' },
  { slug: 'al-oh-3-naoh', equation: 'Al(OH)₃ + NaOH → NaAlO₂ + 2H₂O', type: 'Phản ứng của hydroxide lưỡng tính với kiềm', cond: 'Nhiệt độ thường', note: 'Kết tủa keo trắng Al(OH)₃ tan hoàn toàn trong dung dịch NaOH dư.' },
  { slug: 'fe2o3-co', equation: 'Fe₂O₃ + 3CO → 2Fe + 3CO₂', type: 'Phản ứng nhiệt luyện (oxi hóa – khử)', cond: 'Nhiệt độ cao (t°)', note: 'Phản ứng cốt lõi trong công nghiệp luyện gang thép dùng khí CO khử oxide sắt.' },
  { slug: 'fe3o4-h2', equation: 'Fe₃O₄ + 4H₂ → 3Fe + 4H₂O', type: 'Phản ứng oxi hóa – khử', cond: 'Nhiệt độ cao (t°)', note: 'Khí H₂ khử oxide sắt từ ở nhiệt độ cao tạo kim loại sắt và hơi nước.' },
  { slug: 'fe-cl2', equation: '2Fe + 3Cl₂ → 2FeCl₃', type: 'Phản ứng hóa hợp / Oxi hóa – khử', cond: 'Đun nóng (t°)', note: 'Cl₂ là chất oxi hóa mạnh đưa Fe lên thẳng mức +3 tạo khói màu nâu đỏ FeCl₃.' },
  { slug: 'fe-cucl2', equation: 'Fe + CuCl₂ → FeCl₂ + Cu↓', type: 'Phản ứng thế kim loại', cond: 'Dung dịch ở nhiệt độ thường', note: 'Kim loại màu đỏ Cu bám lên đinh sắt, màu xanh dung dịch nhạt dần.' },
  { slug: 'fe-fecl3', equation: 'Fe + 2FeCl₃ → 3FeCl₂', type: 'Phản ứng oxi hóa – khử', cond: 'Dung dịch', note: 'Dung dịch màu vàng nâu FeCl₃ chuyển sang lục nhạt FeCl₂ theo quy tắc alpha.' },
  { slug: 'cu-fecl3', equation: 'Cu + 2FeCl₃ → CuCl₂ + 2FeCl₂', type: 'Phản ứng oxi hóa – khử', cond: 'Dung dịch', note: 'Ứng dụng trong ăn mòn bản mạch in điện tử; Cu khử Fe³⁺ về Fe²⁺.' },
  { slug: 'fecl2-agno3', equation: 'FeCl₂ + 3AgNO₃ (dư) → Fe(NO₃)₃ + 2AgCl↓ + Ag↓', type: 'Phản ứng trao đổi + oxi hóa khử', cond: 'AgNO₃ dư trong dung dịch', note: 'Bẫy kinh điển đề thi THPT: ngoài kết tủa trắng AgCl còn tạo thêm kết tủa kim loại Ag do Fe²⁺ + Ag⁺ → Fe³⁺ + Ag↓.' },
  { slug: 'kmno4-hcl', equation: '2KMnO₄ + 16HCl (đặc) → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O', type: 'Phản ứng điều chế khí Cl₂ trong phòng thí nghiệm', cond: 'HCl đặc', note: 'Sinh khí màu vàng lục mùi xốc Cl₂; KMnO₄ là chất oxi hóa, HCl vừa là chất khử vừa là môi trường.' },
  { slug: 'mno2-hcl', equation: 'MnO₂ + 4HCl (đặc) → MnCl₂ + Cl₂↑ + 2H₂O', type: 'Phản ứng oxi hóa – khử điều chế Cl₂', cond: 'Đun nóng nhẹ (t°)', note: 'Phương pháp chuẩn điều chế khí chlorine (Cl₂) trong phòng thí nghiệm.' },
  { slug: 'cl2-naoh', equation: 'Cl₂ + 2NaOH → NaCl + NaClO + H₂O', type: 'Phản ứng tự oxi hóa – khử', cond: 'Nhiệt độ thường', note: 'Sản xuất nước Javen (hỗn hợp NaCl và NaClO) có tính tẩy màu và sát trùng mạnh.' },
  { slug: 'na-h2o', equation: '2Na + 2H₂O → 2NaOH + H₂↑', type: 'Phản ứng kim loại kiềm với nước', cond: 'Nhiệt độ thường', note: 'Natri nóng chảy thành giọt tròn chạy trên mặt nước, sủi bọt khí H₂ mạnh, dung dịch làm phenolphtalein hóa hồng.' },
  { slug: 'ca-h2o', equation: 'Ca + 2H₂O → Ca(OH)₂ + H₂↑', type: 'Phản ứng kim loại kiềm thổ với nước', cond: 'Nhiệt độ thường', note: 'Canxi tan tạo dung dịch vẩn đục nhẹ Ca(OH)₂ và sủi bọt khí H₂.' },
  { slug: 'na2co3-hcl', equation: 'Na₂CO₃ + 2HCl → 2NaCl + CO₂↑ + H₂O', type: 'Phản ứng trao đổi ion', cond: 'Nhiệt độ thường', note: 'Sủi bọt khí không màu không mùi CO₂ làm đục nước vôi trong.' },
  { slug: 'nahco3-naoh', equation: 'NaHCO₃ + NaOH → Na₂CO₃ + H₂O', type: 'Phản ứng của muối axit với bazơ', cond: 'Dung dịch', note: 'Ion HCO₃⁻ có tính lưỡng tính nên tác dụng được với cả axit mạnh (H⁺) lẫn bazơ mạnh (OH⁻).' },
  { slug: 'caco3-nhiet-phan', equation: 'CaCO₃ → CaO + CO₂↑', type: 'Phản ứng phân hủy nhiệt', cond: 'Nung nóng ~900–1000°C', note: 'Phản ứng nung đá vôi sản xuất vôi sống (CaO) trong công nghiệp xây dựng.' },
  { slug: 'co2-ca-oh-2', equation: 'CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O', type: 'Phản ứng nhận biết khí CO₂', cond: 'Dung dịch nước vôi trong dư', note: 'Xuất hiện kết tủa trắng CaCO₃ làm đục nước vôi trong; nếu CO₂ dư kết tủa sẽ tan tạo Ca(HCO₃)₂.' },
  { slug: 'so2-br2-h2o', equation: 'SO₂ + Br₂ + 2H₂O → H₂SO₄ + 2HBr', type: 'Phản ứng oxi hóa – khử', cond: 'Dung dịch nước brom', note: 'Khí SO₂ làm mất màu dung dịch nước brom màu nâu đỏ (dùng để phân biệt SO₂ và CO₂).' },
  { slug: 'n2-h2-nh3', equation: 'N₂ + 3H₂ ⇌ 2NH₃', type: 'Phản ứng thuận nghịch tổng hợp amoniac (Haber-Bosch)', cond: '450–500°C, 200 atm, xúc tác Fe', note: 'Phản ứng tỏa nhiệt (ΔrH° = -91,8 kJ); tăng áp suất làm cân bằng chuyển dịch theo chiều thuận.' },
  { slug: 'nh4cl-naoh', equation: 'NH₄Cl + NaOH → NaCl + NH₃↑ + H₂O', type: 'Phản ứng nhận biết ion amoni NH₄⁺', cond: 'Đun nóng nhẹ', note: 'Thoát khí NH₃ mùi khai đặc trưng làm xanh giấy quỳ tím ẩm.' },
  { slug: 'fe-oh-2-o2-h2o', equation: '4Fe(OH)₂ + O₂ + 2H₂O → 4Fe(OH)₃↓', type: 'Phản ứng oxi hóa – khử ngoài không khí', cond: 'Không khí ẩm', note: 'Kết tủa trắng xanh Fe(OH)₂ nhanh chóng chuyển sang màu nâu đỏ Fe(OH)₃ ngoài không khí.' },
  { slug: 'cu-oh-2-nhiet-phan', equation: 'Cu(OH)₂ → CuO + H₂O', type: 'Phản ứng nhiệt phân bazơ không tan', cond: 'Đun nóng (t°)', note: 'Chất rắn màu xanh lam Cu(OH)₂ chuyển thành chất rắn màu đen CuO.' },
  { slug: 'nacl-dien-phan-dung-dich', equation: '2NaCl + 2H₂O → 2NaOH + H₂↑ + Cl₂↑', type: 'Phản ứng điện phân dung dịch có màng ngăn', cond: 'Điện phân dung dịch có màng ngăn xốp', note: 'Sản xuất công nghiệp xút (NaOH), khí chlorine (Cl₂) và hydrogen (H₂); nếu không có màng ngăn thu nước Javen.' },
  { slug: 'al2o3-dien-phan-nong-chay', equation: '2Al₂O₃ → 4Al + 3O₂↑', type: 'Phản ứng điện phân nóng chảy sản xuất nhôm', cond: 'Điện phân nóng chảy có criolit Na₃AlF₆ (~900°C)', note: 'Criolit giúp hạ nhiệt độ nóng chảy của Al₂O₃ từ 2050°C xuống ~900°C và tăng độ dẫn điện.' },
  { slug: 'ch4-cl2', equation: 'CH₄ + Cl₂ → CH₃Cl + HCl', type: 'Phản ứng thế halogen của alkane', cond: 'Ánh sáng khuếch tán (askt)', note: 'Phản ứng đặc trưng của alkane (methane) theo cơ chế gốc tự do.' },
  { slug: 'c2h4-br2', equation: 'CH₂=CH₂ + Br₂ → CH₂Br–CH₂Br', type: 'Phản ứng cộng của alkene', cond: 'Dung dịch nước brom', note: 'Ethylene làm mất màu dung dịch nước brom màu nâu đỏ ở nhiệt độ thường.' },
  { slug: 'c2h2-agno3-nh3', equation: 'HC≡CH + 2AgNO₃ + 2NH₃ → AgC≡CAg↓ + 2NH₄NO₃', type: 'Phản ứng thế ion kim loại của alk-1-yne', cond: 'Dung dịch AgNO₃/NH₃', note: 'Tạo kết tủa vàng nhạt bạc acetylide (Ag₂C₂); dùng nhận biết alk-1-yne có liên kết ba đầu mạch.' },
  { slug: 'c6h6-br2', equation: 'C₆H₆ + Br₂ → C₆H₅Br + HBr', type: 'Phản ứng thế halogen của benzene', cond: 'Bột sắt (FeBr₃), đun nóng', note: 'Benzene không làm mất màu nước brom nhưng tham gia phản ứng thế với brom khan khi có xúc tác FeBr₃.' },
  { slug: 'c2h5oh-na', equation: '2C₂H₅OH + 2Na → 2C₂H₅ONa + H₂↑', type: 'Phản ứng thế nguyên tử H nhóm -OH alcohol', cond: 'Nhiệt độ thường', note: 'Sodium tan dần trong ethanol, sủi bọt khí H₂; tỉ lệ n(H₂) = ½ n(-OH).' },
  { slug: 'c2h5oh-cuo', equation: 'C₂H₅OH + CuO → CH₃CHO + Cu↓ + H₂O', type: 'Phản ứng oxi hóa không hoàn toàn alcohol bậc I', cond: 'Đun nóng (t°)', note: 'Bột CuO màu đen chuyển sang đồng kim loại màu đỏ và tạo aldehyde (acetaldehyde).' },
  { slug: 'ch3cho-agno3-nh3', equation: 'CH₃CHO + 2[Ag(NH₃)₂]OH → CH₃COONH₄ + 2Ag↓ + 3NH₃ + H₂O', type: 'Phản ứng tráng bạc (thuốc thử Tollens)', cond: 'Đun nóng nhẹ (60–70°C)', note: 'Lớp bạc sáng bóng bám trên thành ống nghiệm; lưu ý HCHO tráng gương tạo tỉ lệ 1:4 Ag.' },
  { slug: 'ch3cooh-c2h5oh', equation: 'CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O', type: 'Phản ứng ester hóa (thuận nghịch)', cond: 'H₂SO₄ đặc xúc tác, đun nóng', note: 'Tạo ethyl acetate có mùi thơm dễ chịu, không tan và nổi trên mặt nước; H₂SO₄ đặc vừa xúc tác vừa hút nước tăng hiệu suất.' },
  { slug: 'ch3cooc2h5-naoh', equation: 'CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH', type: 'Phản ứng xà phòng hóa ester (một chiều)', cond: 'Đun nóng (t°)', note: 'Phản ứng thủy phân ester trong môi trường kiềm diễn ra một chiều tạo muối carboxylate và alcohol.' },
  { slug: 'c6h12o6-agno3-nh3', equation: 'C₅H₁₁O₅–CHO + 2[Ag(NH₃)₂]OH → C₅H₁₁O₅–COONH₄ + 2Ag↓ + 3NH₃ + H₂O', type: 'Phản ứng tráng gương của glucose', cond: 'Đun nóng nhẹ', note: 'Chứng minh phân tử glucose có nhóm chức aldehyde (-CHO), tạo 2 mol Ag trên 1 mol glucose.' },
  { slug: 'c6h12o6-len-men', equation: 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂↑', type: 'Phản ứng lên men rượu từ glucose', cond: 'Enzyme (men rượu), 30–35°C', note: 'Phản ứng kinh điển trong bài tập hiệu suất Hóa học 12 (Carbohydrate).' },
  { slug: 'c12h22o11-h2o', equation: 'C₁₂H₂₂O₁₁ (Saccharose) + H₂O → C₆H₁₂O₆ (Glucose) + C₆H₁₂O₆ (Fructose)', type: 'Phản ứng thủy phân disaccharide', cond: 'Xúc tác H⁺ hoặc enzyme, đun nóng', note: 'Saccharose không có phản ứng tráng bạc nhưng sản phẩm thủy phân gồm glucose và fructose đều tráng bạc.' },
  { slug: 'c6h5nh2-br2', equation: 'C₆H₅NH₂ + 3Br₂ → C₆H₂Br₃NH₂↓ + 3HBr', type: 'Phản ứng thế nhân thơm của aniline', cond: 'Dung dịch nước brom ở nhiệt độ thường', note: 'Aniline làm mất màu nước brom và xuất hiện ngay kết tủa trắng 2,4,6-tribromoaniline.' },
];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function renderPseoShell({ title, description, keywords, canonicalUrl, jsonLdList = [], bodyHtml }) {
  const scripts = jsonLdList
    .map((s) => `<script type="application/ld+json">${safeJsonLd(s)}</script>`)
    .join('\n  ');

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ''}
  <meta name="author" content="Nguyễn Thế Duy — ELEC Science AI" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="alternate" hreflang="vi" href="${escapeHtml(canonicalUrl)}" />
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonicalUrl)}" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="192x192" href="/img/icon-192.png" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="ELEC Science AI" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${SITE_ORIGIN}/img/og-image.png" />
  <meta property="og:locale" content="vi_VN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE_ORIGIN}/img/og-image.png" />
  ${scripts}
  <style>
    :root { --bg:#f8fafc; --card:#ffffff; --ink:#0f172a; --ink2:#475569; --ink3:#64748b; --pri:#1d4ed8; --pri-soft:rgba(29,78,216,.09); --border:rgba(15,23,42,.1); }
    @media (prefers-color-scheme: dark) {
      :root { --bg:#0b1120; --card:#111827; --ink:#f1f5f9; --ink2:#94a3b8; --ink3:#64748b; --pri:#60a5fa; --pri-soft:rgba(96,165,250,.14); --border:rgba(255,255,255,.11); }
    }
    * { box-sizing:border-box; }
    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Be Vietnam Pro','Inter',system-ui,sans-serif; background:var(--bg); color:var(--ink); line-height:1.65; }
    a { color:var(--pri); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .topbar { position:sticky; top:0; z-index:20; background:rgba(255,255,255,.88); backdrop-filter:blur(14px); border-bottom:1px solid var(--border); }
    @media (prefers-color-scheme: dark) { .topbar { background:rgba(17,24,39,.88); } }
    .topbar-in { max-width:1080px; margin:0 auto; padding:12px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
    .brand { display:inline-flex; align-items:center; gap:9px; color:var(--ink); font-weight:800; font-size:15.5px; }
    .brand img { width:28px; height:28px; border-radius:8px; }
    .navlinks { display:flex; gap:14px; flex-wrap:wrap; font-size:13.5px; font-weight:600; align-items:center; }
    .btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:999px; background:#1d4ed8; color:#fff !important; font-weight:700; font-size:13.5px; }
    .btn:hover { text-decoration:none; opacity:.92; }
    .btn-ghost { background:var(--card); color:var(--pri) !important; border:1px solid var(--border); }
    .wrap { max-width:1080px; margin:0 auto; padding:24px 20px 60px; }
    .crumb { font-size:13px; color:var(--ink3); margin-bottom:14px; display:flex; gap:6px; flex-wrap:wrap; }
    .hero { background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 55%,#0ea5e9 100%); color:#fff; border-radius:22px; padding:26px 26px; margin-bottom:22px; }
    .hero h1 { margin:0 0 8px; font-size:clamp(22px,3vw,30px); line-height:1.28; }
    .hero p { margin:0 0 16px; opacity:.94; font-size:15.5px; max-width:780px; }
    .card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:20px 22px; margin-bottom:16px; }
    .card h2 { margin:0 0 12px; font-size:19px; line-height:1.35; }
    .card h3 { margin:0 0 6px; font-size:16px; }
    .grid-2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }
    .grid-3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:12px; }
    .kv { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:10px 16px; margin:0; }
    .kv dt { font-size:12.5px; color:var(--ink3); font-weight:700; }
    .kv dd { margin:2px 0 0; font-size:15px; font-weight:700; }
    .badge { display:inline-block; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:700; background:var(--pri-soft); color:var(--pri); }
    .eq-box { font-size:clamp(18px,2.4vw,24px); font-weight:800; padding:16px 20px; border-radius:14px; background:var(--pri-soft); color:var(--ink); text-align:center; letter-spacing:.01em; margin:8px 0 14px; }
    .q-item { border:1px solid var(--border); border-radius:14px; padding:14px 16px; margin-bottom:12px; }
    .q-opts { list-style:none; padding:0; margin:8px 0; display:grid; gap:6px; font-size:14.5px; }
    .q-opts li { padding:6px 10px; border-radius:10px; background:var(--bg); }
    details { border:1px solid var(--border); border-radius:12px; padding:10px 14px; margin-top:8px; }
    summary { cursor:pointer; font-weight:700; font-size:14px; }
    .pill-links { display:flex; flex-wrap:wrap; gap:8px; }
    .pill { padding:6px 12px; border-radius:999px; border:1px solid var(--border); background:var(--card); font-size:13px; font-weight:600; color:var(--ink); }
    .pill:hover { border-color:var(--pri); color:var(--pri); text-decoration:none; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid var(--border); font-size:13px; color:var(--ink3); text-align:center; }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-in">
      <a class="brand" href="/">
        <img src="/img/icon-192.png" alt="ELEC Science AI" />
        <span>ELEC Science AI</span>
      </a>
      <nav class="navlinks" aria-label="Điều hướng chính">
        <a href="/hoc-online-mien-phi">Học online</a>
        <a href="/giai-bai-tap-bang-ai">Giải bài tập AI</a>
        <a href="/de-thi">Kho đề thi</a>
        <a href="/nguyen-to">118 Nguyên tố</a>
        <a href="/phuong-trinh">Phương trình</a>
        <a href="/kien-thuc">Chuyên đề THPT</a>
        <a href="/cho-giao-vien">Cho Giáo viên</a>
        <a class="btn" href="/#/register">Học miễn phí →</a>
      </nav>
    </div>
  </header>
  <main class="wrap">
    ${bodyHtml}
    <footer class="footer">
      © 2026 <strong>ELEC Science AI (ELEC AI)</strong> · Sáng lập bởi <a href="/nha-sang-lap">Nguyễn Thế Duy (Duy TK)</a> ·
      <a href="/hoc-online-mien-phi">Học online miễn phí</a> · <a href="/ai-giao-duc">AI giáo dục</a> · <a href="/luyen-thi-thpt-quoc-gia">Luyện thi THPT</a> · <a href="/phan-mem-tao-de-thi">Phần mềm tạo đề thi</a>
    </footer>
  </main>
</body>
</html>`;
}

/* =====================================================================
   1. 118 NGUYÊN TỐ HÓA HỌC (/nguyen-to & /nguyen-to/:symbol)
   ===================================================================== */
function generateElementPages(sitemapUrls) {
  const dir = path.join(DIST_DIR, 'nguyen-to');
  ensureDir(dir);

  // Hub page /nguyen-to
  const hubUrl = `${SITE_ORIGIN}/nguyen-to`;
  const hubHtml = renderPseoShell({
    title: 'Thư Viện 118 Nguyên Tố Hóa Học Chuẩn IUPAC — Cấu Hình Electron & Hóa Trị · ELEC AI',
    description:
      'Tra cứu chi tiết toàn bộ 118 nguyên tố hóa học chuẩn IUPAC (GDPT 2018): nguyên tử khối, cấu hình electron đầy đủ & thu gọn, độ âm điện, số oxi hóa, tính chất và phản ứng đặc trưng.',
    keywords:
      '118 nguyên tố hóa học, bảng tuần hoàn IUPAC, nguyên tử khối, cấu hình electron, tài liệu Hóa học THPT, học Hóa học online, ELEC AI',
    canonicalUrl: hubUrl,
    jsonLdList: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Thư viện 118 Nguyên tố Hóa học chuẩn IUPAC — ELEC Science AI',
        url: hubUrl,
        numberOfItems: ELEMENTS.length,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ELEC Science AI', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: '118 Nguyên tố Hóa học', item: hubUrl },
        ],
      },
    ],
    bodyHtml: `
      <nav class="crumb"><a href="/">Trang chủ</a><span>/</span><span>118 Nguyên tố Hóa học</span></nav>
      <section class="hero">
        <h1>Thư Viện 118 Nguyên Tố Hóa Học Chuẩn IUPAC (GDPT 2018)</h1>
        <p>Tra cứu nhanh số hiệu nguyên tử Z, nguyên tử khối, cấu hình electron, độ âm điện, nhiệt độ nóng chảy – sôi, ứng dụng thực tế và phản ứng hóa học đặc trưng của từng nguyên tố.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn" style="background:#fff;color:#1d4ed8!important" href="/bang-tuan-hoan">Mở Bảng tuần hoàn tương tác →</a>
          <a class="btn" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45)" href="/hoc-hoa-hoc-online">Học Hóa học online</a>
        </div>
      </section>
      <section class="card">
        <h2>Danh mục toàn bộ 118 nguyên tố (Z = 1 đến Z = 118)</h2>
        <div class="grid-3">
          ${ELEMENTS.map((el) => {
            const symSlug = el.symbol.toLowerCase();
            const vi = ELEMENT_VI_NAMES[el.symbol] ? ` (${ELEMENT_VI_NAMES[el.symbol]})` : '';
            return `<a class="card" style="margin:0;padding:12px 14px;display:block;color:inherit" href="/nguyen-to/${symSlug}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <strong style="font-size:18px;color:var(--pri)">${escapeHtml(el.symbol)}</strong>
                <span class="badge">Z = ${el.atomicNumber}</span>
              </div>
              <div style="font-weight:700;font-size:14.5px">${escapeHtml(el.name)}${escapeHtml(vi)}</div>
              <div style="font-size:12.5px;color:var(--ink3)">M = ${escapeHtml(el.atomicMass)} · ${escapeHtml(CAT_LABEL[el.category] || el.category)}</div>
            </a>`;
          }).join('\n')}
        </div>
      </section>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), hubHtml, 'utf8');
  sitemapUrls.push({ loc: hubUrl, changefreq: 'weekly', priority: '0.85' });

  // 118 individual element pages
  for (let i = 0; i < ELEMENTS.length; i++) {
    const el = ELEMENTS[i];
    const symSlug = el.symbol.toLowerCase();
    const prev = i > 0 ? ELEMENTS[i - 1] : null;
    const next = i < ELEMENTS.length - 1 ? ELEMENTS[i + 1] : null;
    const vi = ELEMENT_VI_NAMES[el.symbol] || '';
    const catVi = CAT_LABEL[el.category] || el.category;
    const fullName = vi ? `${el.name} (${vi})` : el.name;
    const url = `${SITE_ORIGIN}/nguyen-to/${symSlug}`;

    const matchedReactions = REACTIONS.filter(
      (r) =>
        (r.inputs || []).some((x) => x.toLowerCase() === symSlug) ||
        (r.equation || '').includes(el.symbol)
    ).slice(0, 6);

    const faqs = [
      {
        q: `Nguyên tử khối và số hiệu nguyên tử của ${fullName} (${el.symbol}) là bao nhiêu?`,
        a: `Nguyên tố ${fullName} (kí hiệu hóa học ${el.symbol}) có số hiệu nguyên tử Z = ${el.atomicNumber}, nguyên tử khối chuẩn IUPAC là ${el.atomicMass} u, thuộc chu kì ${el.period}${el.group ? `, nhóm ${el.group}` : ' (họ Lanthanide/Actinide)'}.`,
      },
      {
        q: `Cấu hình electron của nguyên tử ${el.name} (${el.symbol}) viết như thế nào?`,
        a: `Cấu hình electron đầy đủ của ${el.symbol} (Z = ${el.atomicNumber}) là ${el.config}; viết gọn là ${el.shortConfig}. Nguyên tử thuộc phân lớp khối ${el.block} và có ${el.valenceElectrons} electron hóa trị.`,
      },
      {
        q: `${el.name} (${el.symbol}) thuộc loại nguyên tố nào và có ứng dụng gì?`,
        a: `${fullName} thuộc nhóm ${catVi}.${el.uses ? ` Ứng dụng phổ biến: ${el.uses}.` : ' Được nghiên cứu trong chương trình Hóa học phổ thông và khoa học vật liệu.'}`,
      },
    ];

    const html = renderPseoShell({
      title: `${fullName} (${el.symbol}, Z=${el.atomicNumber}): Nguyên Tử Khối, Cấu Hình Electron & Tính Chất · ELEC AI`,
      description: `Tra cứu chi tiết nguyên tố ${fullName} (${el.symbol}, Z=${el.atomicNumber}): nguyên tử khối ${el.atomicMass}, cấu hình electron ${el.shortConfig}, độ âm điện, tính chất vật lí, ứng dụng và phản ứng hóa học chuẩn IUPAC.`,
      keywords: `${el.name}, ${el.symbol}, nguyên tố ${el.symbol}, ${vi ? `nguyên tố ${vi}, ` : ''}cấu hình electron ${el.symbol}, nguyên tử khối ${el.symbol}, bảng tuần hoàn IUPAC, ELEC AI`,
      canonicalUrl: url,
      jsonLdList: [
        {
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: `Nguyên tố hóa học ${fullName} (${el.symbol})`,
          description: `Dữ liệu chuẩn IUPAC cho nguyên tố ${fullName} (${el.symbol}, Z=${el.atomicNumber}): nguyên tử khối ${el.atomicMass}, cấu hình electron ${el.config}.`,
          url,
          inLanguage: 'vi-VN',
          educationalLevel: ['THCS', 'THPT Lớp 10', 'THPT Lớp 11', 'THPT Lớp 12'],
          isAccessibleForFree: true,
          provider: { '@type': 'EducationalOrganization', name: 'ELEC Science AI', url: `${SITE_ORIGIN}/` },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ELEC Science AI', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: '118 Nguyên tố Hóa học', item: hubUrl },
            { '@type': 'ListItem', position: 3, name: `${fullName} (${el.symbol})`, item: url },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
      bodyHtml: `
        <nav class="crumb">
          <a href="/">Trang chủ</a><span>/</span>
          <a href="/nguyen-to">118 Nguyên tố</a><span>/</span>
          <span>${escapeHtml(fullName)} (${escapeHtml(el.symbol)})</span>
        </nav>
        <section class="hero">
          <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:8px">
            <span style="display:inline-grid;place-items:center;width:62px;height:62px;border-radius:16px;background:rgba(255,255,255,.18);font-size:28px;font-weight:900">${escapeHtml(el.symbol)}</span>
            <div>
              <div style="font-size:13px;opacity:.9;font-weight:700">Z = ${el.atomicNumber} · ${escapeHtml(catVi)} · Chu kì ${el.period}${el.group ? ` · Nhóm ${el.group}` : ''}</div>
              <h1 style="margin:2px 0 0">Nguyên tố ${escapeHtml(fullName)} (${escapeHtml(el.symbol)})</h1>
            </div>
          </div>
          <p>${escapeHtml(fullName)} có kí hiệu hóa học <strong>${escapeHtml(el.symbol)}</strong>, số hiệu nguyên tử <strong>Z = ${el.atomicNumber}</strong>, nguyên tử khối chuẩn IUPAC <strong>${escapeHtml(el.atomicMass)} u</strong> và cấu hình electron <strong>${escapeHtml(el.shortConfig)}</strong>.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn" style="background:#fff;color:#1d4ed8!important" href="/bang-tuan-hoan">Xem trên Bảng tuần hoàn 3D →</a>
            <a class="btn" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45)" href="/giai-bai-tap-bang-ai">Hỏi Gia sư AI về ${escapeHtml(el.symbol)}</a>
          </div>
        </section>

        <section class="card">
          <h2>Thông số nguyên tử chuẩn IUPAC của ${escapeHtml(el.name)} (${escapeHtml(el.symbol)})</h2>
          <dl class="kv">
            <div><dt>Số hiệu nguyên tử (Z)</dt><dd>${el.atomicNumber}</dd></div>
            <div><dt>Nguyên tử khối</dt><dd>${escapeHtml(el.atomicMass)} u</dd></div>
            <div><dt>Phân loại</dt><dd>${escapeHtml(catVi)}</dd></div>
            <div><dt>Vị trí bảng tuần hoàn</dt><dd>Chu kì ${el.period}, ${el.group ? `Nhóm ${el.group}` : 'Họ f'}, Khối ${escapeHtml(el.block)}</dd></div>
            <div><dt>Cấu hình electron đầy đủ</dt><dd>${escapeHtml(el.config)}</dd></div>
            <div><dt>Cấu hình electron thu gọn</dt><dd>${escapeHtml(el.shortConfig)}</dd></div>
            <div><dt>Electron hóa trị</dt><dd>${el.valenceElectrons}</dd></div>
            <div><dt>Độ âm điện (Pauling)</dt><dd>${el.electronegativity ?? '—'}</dd></div>
            <div><dt>Bán kính nguyên tử</dt><dd>${el.atomicRadius ? `${el.atomicRadius} pm` : '—'}</dd></div>
            <div><dt>Năng lượng ion hóa I₁</dt><dd>${el.ionizationEnergy ? `${el.ionizationEnergy} kJ/mol` : '—'}</dd></div>
            <div><dt>Nhiệt độ nóng chảy / sôi</dt><dd>${el.meltingPoint ? `${el.meltingPoint} K` : '—'} / ${el.boilingPoint ? `${el.boilingPoint} K` : '—'}</dd></div>
            <div><dt>Khối lượng riêng</dt><dd>${el.density ? `${el.density} g/cm³` : '—'}</dd></div>
          </dl>
        </section>

        <div class="grid-2">
          <section class="card">
            <h2>Ứng dụng &amp; Thực tế của ${escapeHtml(fullName)}</h2>
            <p style="margin:0 0 10px">${escapeHtml(el.uses || `${fullName} là nguyên tố quan trọng trong nghiên cứu hóa học, vật lí và kỹ thuật vật liệu.`)}</p>
            ${el.discovered ? `<p style="margin:0;font-size:14px;color:var(--ink2)"><strong>Lịch sử phát hiện:</strong> ${escapeHtml(el.discovered)}</p>` : ''}
            ${Array.isArray(el.examples) && el.examples.length ? `<p style="margin:10px 0 0;font-size:14px"><strong>Hợp chất tiêu biểu:</strong> ${escapeHtml(el.examples.join(', '))}</p>` : ''}
          </section>
          <section class="card">
            <h2>Phản ứng hóa học liên quan đến ${escapeHtml(el.symbol)}</h2>
            ${
              matchedReactions.length > 0
                ? `<ul style="margin:0;padding-left:18px">${matchedReactions
                    .map((r) => `<li style="margin-bottom:6px"><strong>${escapeHtml(r.equation)}</strong> — ${escapeHtml(r.note || '')}</li>`)
                    .join('')}</ul>`
                : `<p style="margin:0;color:var(--ink2)">Nhập bất kỳ phương trình nào có chứa <strong>${escapeHtml(el.symbol)}</strong> vào <a href="/can-bang-phuong-trinh-hoa-hoc">Máy cân bằng PTHH đại số tuyến tính</a> để cân bằng tức thì.</p>`
            }
          </section>
        </div>

        <section class="card">
          <h2>Câu hỏi thường gặp về ${escapeHtml(fullName)} (${escapeHtml(el.symbol)})</h2>
          ${faqs.map((f, idx) => `<div style="margin-bottom:10px"><h3>${idx + 1}. ${escapeHtml(f.q)}</h3><p style="margin:0;color:var(--ink2)">${escapeHtml(f.a)}</p></div>`).join('')}
        </section>

        <section class="card" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px">
          ${prev ? `<a class="pill" href="/nguyen-to/${prev.symbol.toLowerCase()}">← Z=${prev.atomicNumber}: ${escapeHtml(prev.name)} (${escapeHtml(prev.symbol)})</a>` : '<span></span>'}
          <a class="pill" href="/hoc-hoa-hoc-online">Học Hóa học online THPT</a>
          ${next ? `<a class="pill" href="/nguyen-to/${next.symbol.toLowerCase()}">Z=${next.atomicNumber}: ${escapeHtml(next.name)} (${escapeHtml(next.symbol)}) →</a>` : '<span></span>'}
        </section>`,
    });

    fs.writeFileSync(path.join(dir, `${symSlug}.html`), html, 'utf8');
    sitemapUrls.push({ loc: url, changefreq: 'monthly', priority: '0.72' });
  }

  return ELEMENTS.length + 1;
}

/* =====================================================================
   2. 66+ ĐỀ THI THỬ THPTQG & ĐGNL (/de-thi & /de-thi/:id)
   ===================================================================== */
function generateExamPages(sitemapUrls) {
  const dir = path.join(DIST_DIR, 'de-thi');
  ensureDir(dir);

  const subLabel = { hoa: 'Hóa học', ly: 'Vật lí', sinh: 'Sinh học', all: 'Tích hợp KHTN' };
  const hubUrl = `${SITE_ORIGIN}/de-thi`;

  const hubHtml = renderPseoShell({
    title: 'Kho 66+ Đề Thi Thử THPT Quốc Gia & ĐGNL 2026–2027 Có Đáp Án · ELEC AI',
    description:
      'Tổng hợp 66+ đề thi thử tốt nghiệp THPT Quốc gia và Đánh giá năng lực (HSA, TSA, V-ACT) môn Hóa học, Vật lí, Sinh học chuẩn cấu trúc 3 phần Bộ GD&ĐT kèm đáp án, lời giải chi tiết và thi online bấm giờ.',
    keywords:
      'đề thi thử THPT Quốc gia, đề thi online, đề thi trắc nghiệm online, thi thử THPT online, ngân hàng đề thi THPT, đề thi ĐGNL HSA TSA V-ACT, luyện thi THPT Quốc gia, ELEC AI',
    canonicalUrl: hubUrl,
    jsonLdList: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Kho 66+ Đề thi thử THPT Quốc gia & ĐGNL — ELEC Science AI',
        url: hubUrl,
        numberOfItems: VIRTUAL_EXAMS.length,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ELEC Science AI', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Kho đề thi thử THPTQG & ĐGNL', item: hubUrl },
        ],
      },
    ],
    bodyHtml: `
      <nav class="crumb"><a href="/">Trang chủ</a><span>/</span><span>Kho đề thi thử THPTQG &amp; ĐGNL</span></nav>
      <section class="hero">
        <h1>Kho ${VIRTUAL_EXAMS.length} Đề Thi Thử THPT Quốc Gia &amp; ĐGNL Có Đáp Án Chi Tiết</h1>
        <p>Đề thi trắc nghiệm online chuẩn cấu trúc 3 phần mới của Bộ GD&amp;ĐT (50 phút — 28 câu) và đề Đánh giá năng lực HSA, TSA, V-ACT. Xem trước câu hỏi mẫu, đáp án giải thích và vào Phòng thi ảo bấm giờ thật miễn phí.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn" style="background:#fff;color:#1d4ed8!important" href="/phong-thi-ao">Mở Phòng thi ảo bấm giờ →</a>
          <a class="btn" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45)" href="/luyen-thi-thpt-quoc-gia">Lộ trình Luyện thi THPT</a>
          <a class="btn" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45)" href="/phan-mem-tao-de-thi">Giáo viên tạo đề online</a>
        </div>
      </section>
      <section class="card">
        <h2>Danh sách đề thi thử mới nhất</h2>
        <div class="grid-2">
          ${VIRTUAL_EXAMS.map((ex) => {
            const sName = subLabel[ex.subject] || 'Hóa học';
            return `<article class="q-item" style="margin:0">
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
                <span class="badge">${escapeHtml(sName)}</span>
                <span class="badge">${escapeHtml(ex.examType || 'THPTQG')} ${ex.year || 2026}</span>
                <span class="badge">${ex.durationMinutes || 50} phút · ${ex.questionCount || 28} câu</span>
              </div>
              <h3 style="margin:4px 0 6px"><a href="/de-thi/${encodeURIComponent(ex.id)}">${escapeHtml(ex.title)}</a></h3>
              <div style="font-size:13px;color:var(--ink3)">${escapeHtml(ex.institution || ex.author || 'Hội đồng chuyên môn ELEC AI')} · ${(ex.attemptsCount || 0).toLocaleString('vi-VN')} lượt thi</div>
            </article>`;
          }).join('\n')}
        </div>
      </section>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), hubHtml, 'utf8');
  sitemapUrls.push({ loc: hubUrl, changefreq: 'daily', priority: '0.9' });

  for (const ex of VIRTUAL_EXAMS) {
    const sName = subLabel[ex.subject] || 'Hóa học';
    const url = `${SITE_ORIGIN}/de-thi/${encodeURIComponent(ex.id)}`;
    let questions = [];
    try {
      questions = Array.isArray(ex.questions) && ex.questions.length > 0
        ? ex.questions
        : buildExamQuestionsForPaper(ex) || [];
    } catch {
      questions = [];
    }
    const previewQs = questions.slice(0, 8);
    const related = VIRTUAL_EXAMS.filter((x) => x.id !== ex.id && (x.subject || 'hoa') === (ex.subject || 'hoa')).slice(0, 6);

    const faqs = [
      {
        q: `${ex.title} gồm bao nhiêu câu và thời gian làm bài bao lâu?`,
        a: `Đề thi gồm ${ex.questionCount || questions.length || 28} câu hỏi trắc nghiệm chuẩn cấu trúc mới (${ex.examType || 'THPTQG'} ${ex.year || 2026}), thời gian làm bài ${ex.durationMinutes || 50} phút trên Phòng thi ảo ELEC Science AI.`,
      },
      {
        q: `Đề thi này có đáp án và lời giải chi tiết không?`,
        a: `Có. Ngay sau khi nộp bài trên Phòng thi ảo ELEC AI, hệ thống tự động chấm điểm lũy tiến, hiển thị lời giải chi tiết từng câu và lưu các câu làm sai vào Sổ tay SRS để bạn ôn lại.`,
      },
    ];

    const html = renderPseoShell({
      title: `${ex.title} (Có Đáp Án & Thi Thử Online) · ELEC AI`,
      description: `Làm ${ex.title} online miễn phí (${ex.questionCount || 28} câu — ${ex.durationMinutes || 50} phút) chuẩn cấu trúc 3 phần Bộ GD&ĐT, có đáp án và lời giải chi tiết trên ELEC Science AI.`,
      keywords: `${ex.title}, đề thi thử ${sName} ${ex.year || 2026}, đề thi trắc nghiệm online, thi thử THPT online, luyện thi THPT Quốc gia, ELEC AI`,
      canonicalUrl: url,
      jsonLdList: [
        {
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          learningResourceType: 'Practice Exam',
          name: ex.title,
          description: `Đề thi thử ${sName} (${ex.examType || 'THPTQG'} ${ex.year || 2026}) gồm ${ex.questionCount || 28} câu, thời gian ${ex.durationMinutes || 50} phút kèm đáp án chi tiết.`,
          url,
          inLanguage: 'vi-VN',
          isAccessibleForFree: true,
          educationalLevel: 'Lớp 12 / Ôn thi THPT Quốc gia',
          provider: { '@type': 'EducationalOrganization', name: 'ELEC Science AI', url: `${SITE_ORIGIN}/` },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ELEC Science AI', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Kho đề thi thử', item: hubUrl },
            { '@type': 'ListItem', position: 3, name: ex.title, item: url },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
      bodyHtml: `
        <nav class="crumb">
          <a href="/">Trang chủ</a><span>/</span>
          <a href="/de-thi">Kho đề thi thử</a><span>/</span>
          <span>${escapeHtml(sName)}</span>
        </nav>
        <section class="hero">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <span class="badge" style="background:rgba(255,255,255,.18);color:#fff">${escapeHtml(sName)}</span>
            <span class="badge" style="background:rgba(255,255,255,.18);color:#fff">${escapeHtml(ex.examType || 'THPTQG')} ${ex.year || 2026}</span>
            <span class="badge" style="background:rgba(255,255,255,.18);color:#fff">${ex.durationMinutes || 50} phút · ${ex.questionCount || 28} câu</span>
          </div>
          <h1>${escapeHtml(ex.title)}</h1>
          <p>Biên soạn / Nguồn: <strong>${escapeHtml(ex.institution || ex.author || 'Hội đồng chuyên môn ELEC AI')}</strong>. Bấm giờ thực 50 phút, tự động chấm điểm lũy tiến và giải thích từng câu chi tiết.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn" style="background:#fff;color:#1d4ed8!important" href="/phong-thi-ao">Bắt đầu làm đề bấm giờ →</a>
            <a class="btn" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45)" href="/giai-bai-tap-bang-ai">Hỏi Gia sư AI bài khó</a>
          </div>
        </section>

        <section class="card">
          <h2>Xem trước câu hỏi mẫu &amp; Đáp án giải thích (${previewQs.length}/${questions.length || ex.questionCount || 28} câu)</h2>
          ${previewQs
            .map((q, idx) => {
              const qText = q.question || q.q || q.prompt || '';
              const opts = Array.isArray(q.options) ? q.options : [];
              const letters = ['A', 'B', 'C', 'D'];
              const correctLabel = typeof q.correct === 'number' && opts[q.correct] !== undefined
                ? `${letters[q.correct] || ''}. ${opts[q.correct]}`
                : q.answer || '';
              return `<article class="q-item">
                <h3>Câu ${idx + 1}: ${escapeHtml(qText)}</h3>
                ${opts.length > 0 ? `<ul class="q-opts">${opts.map((o, oi) => `<li><strong>${letters[oi] || oi + 1}.</strong> ${escapeHtml(o)}</li>`).join('')}</ul>` : ''}
                ${
                  correctLabel || q.explanation
                    ? `<details><summary>Xem đáp án &amp; lời giải chi tiết</summary>
                        ${correctLabel ? `<p style="margin:8px 0 4px"><strong>Đáp án đúng:</strong> ${escapeHtml(correctLabel)}</p>` : ''}
                        ${q.explanation ? `<p style="margin:0;color:var(--ink2)">${escapeHtml(q.explanation)}</p>` : ''}
                      </details>`
                    : ''
                }
              </article>`;
            })
            .join('\n')}
          <div style="margin-top:16px;text-align:center">
            <a class="btn" href="/phong-thi-ao">Làm trọn bộ ${ex.questionCount || 28} câu trong Phòng thi ảo →</a>
          </div>
        </section>

        <section class="card">
          <h2>Câu hỏi thường gặp</h2>
          ${faqs.map((f, idx) => `<div style="margin-bottom:10px"><h3>${idx + 1}. ${escapeHtml(f.q)}</h3><p style="margin:0;color:var(--ink2)">${escapeHtml(f.a)}</p></div>`).join('')}
        </section>

        <section class="card">
          <h2>Đề thi thử ${escapeHtml(sName)} liên quan</h2>
          <div class="pill-links">
            ${related.map((r) => `<a class="pill" href="/de-thi/${encodeURIComponent(r.id)}">${escapeHtml(r.title)}</a>`).join('')}
            <a class="pill" href="/luyen-thi-thpt-quoc-gia">Luyện thi THPT Quốc gia</a>
            <a class="pill" href="/phan-mem-tao-de-thi">Phần mềm tạo đề thi cho Giáo viên</a>
          </div>
        </section>`,
    });

    fs.writeFileSync(path.join(dir, `${ex.id}.html`), html, 'utf8');
    sitemapUrls.push({ loc: url, changefreq: 'weekly', priority: '0.8' });
  }

  return VIRTUAL_EXAMS.length + 1;
}

/* =====================================================================
   3. 65+ PHƯƠNG TRÌNH HÓA HỌC (/phuong-trinh & /phuong-trinh/:slug)
   ===================================================================== */
function generateEquationPages(sitemapUrls) {
  const dir = path.join(DIST_DIR, 'phuong-trinh');
  ensureDir(dir);

  const seen = new Set();
  const allEquations = [];

  for (const r of REACTIONS) {
    const slug = slugify((r.inputs || []).join('-')) || slugify(r.equation);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    allEquations.push({
      slug,
      equation: r.equation,
      type: 'Phản ứng vô cơ phổ thông',
      cond: 'Điều kiện phòng thí nghiệm',
      note: r.note || 'Phản ứng hóa học đặc trưng trong chương trình Hóa học phổ thông.',
    });
  }
  for (const r of EXTRA_CLASSIC_EQUATIONS) {
    if (seen.has(r.slug)) continue;
    seen.add(r.slug);
    allEquations.push(r);
  }

  const hubUrl = `${SITE_ORIGIN}/phuong-trinh`;
  const hubHtml = renderPseoShell({
    title: 'Thư Viện 65+ Phương Trình Hóa Học THPT Đã Cân Bằng & Hiện Tượng · ELEC AI',
    description:
      'Tra cứu hơn 65 phương trình hóa học lớp 10, 11, 12 trọng tâm thi THPT: phản ứng oxi hóa – khử, kim loại với HNO3/H2SO4, hợp chất hữu cơ, điều kiện, hiện tượng và cân bằng tự động.',
    keywords:
      'phương trình hóa học, cân bằng phương trình hóa học online, bài tập Hóa học có lời giải, tài liệu Hóa học THPT, phản ứng oxi hóa khử, ELEC AI',
    canonicalUrl: hubUrl,
    jsonLdList: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Thư viện Phương trình Hóa học THPT — ELEC Science AI',
        url: hubUrl,
        numberOfItems: allEquations.length,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ELEC Science AI', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Phương trình Hóa học', item: hubUrl },
        ],
      },
    ],
    bodyHtml: `
      <nav class="crumb"><a href="/">Trang chủ</a><span>/</span><span>Phương trình Hóa học</span></nav>
      <section class="hero">
        <h1>Thư Viện ${allEquations.length} Phương Trình Hóa Học Trọng Tâm THPT (Có Hiện Tượng &amp; Điều Kiện)</h1>
        <p>Tổng hợp các phương trình phản ứng vô cơ, hữu cơ và oxi hóa – khử xuất hiện nhiều nhất trong đề kiểm tra &amp; đề thi tốt nghiệp THPT Quốc gia.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn" style="background:#fff;color:#1d4ed8!important" href="/can-bang-phuong-trinh-hoa-hoc">Mở Máy cân bằng PTHH tự động →</a>
          <a class="btn" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45)" href="/hoc-hoa-hoc-online">Học Hóa học online</a>
        </div>
      </section>
      <section class="card">
        <h2>Danh sách phương trình hóa học phổ biến</h2>
        <div class="grid-2">
          ${allEquations
            .map(
              (eq) => `<a class="q-item" style="margin:0;display:block;color:inherit" href="/phuong-trinh/${eq.slug}">
                <div style="font-weight:800;font-size:15.5px;color:var(--pri);margin-bottom:4px">${escapeHtml(eq.equation)}</div>
                <div style="font-size:12.5px;color:var(--ink3);margin-bottom:4px">${escapeHtml(eq.type)} · ${escapeHtml(eq.cond)}</div>
                <div style="font-size:13.5px;color:var(--ink2)">${escapeHtml(eq.note)}</div>
              </a>`
            )
            .join('\n')}
        </div>
      </section>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), hubHtml, 'utf8');
  sitemapUrls.push({ loc: hubUrl, changefreq: 'weekly', priority: '0.85' });

  for (let i = 0; i < allEquations.length; i++) {
    const eq = allEquations[i];
    const url = `${SITE_ORIGIN}/phuong-trinh/${eq.slug}`;
    const neighbors = allEquations.filter((x) => x.slug !== eq.slug).slice(Math.max(0, i - 3), Math.max(6, i + 4));
    const faqs = [
      {
        q: `Phương trình hóa học ${eq.equation} thuộc loại phản ứng nào và cần điều kiện gì?`,
        a: `Đây là ${eq.type.toLowerCase()}, xảy ra với điều kiện: ${eq.cond}. Hiện tượng / lưu ý quan trọng: ${eq.note}`,
      },
      {
        q: `Làm sao cân bằng nhanh các phương trình phức tạp tương tự trên ELEC AI?`,
        a: `Bạn có thể nhập trực tiếp các chất tham gia và sản phẩm vào Máy cân bằng PTHH tại https://www.elecai.id.vn/can-bang-phuong-trinh-hoa-hoc sử dụng thuật toán ma trận đại số tuyến tính để nhận hệ số tối giản tức thì.`,
      },
    ];

    const html = renderPseoShell({
      title: `Cân Bằng Phương Trình: ${eq.equation} — Điều Kiện & Hiện Tượng · ELEC AI`,
      description: `Phương trình hóa học đã cân bằng: ${eq.equation}. Phân loại: ${eq.type}. Điều kiện: ${eq.cond}. Hiện tượng và giải thích chi tiết chuẩn GDPT 2018.`,
      keywords: `${eq.equation}, cân bằng phương trình hóa học, ${eq.type}, bài tập Hóa học có lời giải, ELEC AI`,
      canonicalUrl: url,
      jsonLdList: [
        {
          '@context': 'https://schema.org',
          '@type': 'LearningResource',
          name: `Phương trình hóa học ${eq.equation}`,
          description: eq.note,
          url,
          inLanguage: 'vi-VN',
          isAccessibleForFree: true,
          provider: { '@type': 'EducationalOrganization', name: 'ELEC Science AI', url: `${SITE_ORIGIN}/` },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ELEC Science AI', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Phương trình Hóa học', item: hubUrl },
            { '@type': 'ListItem', position: 3, name: eq.equation, item: url },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
      bodyHtml: `
        <nav class="crumb">
          <a href="/">Trang chủ</a><span>/</span>
          <a href="/phuong-trinh">Phương trình Hóa học</a><span>/</span>
          <span>${escapeHtml(eq.slug)}</span>
        </nav>
        <section class="card">
          <span class="badge">${escapeHtml(eq.type)}</span>
          <h1 style="margin:10px 0 8px;font-size:clamp(20px,2.8vw,28px)">Cân bằng phương trình hóa học: ${escapeHtml(eq.equation)}</h1>
          <div class="eq-box">${escapeHtml(eq.equation)}</div>
          <dl class="kv">
            <div><dt>Phân loại phản ứng</dt><dd>${escapeHtml(eq.type)}</dd></div>
            <div><dt>Điều kiện phản ứng</dt><dd>${escapeHtml(eq.cond)}</dd></div>
            <div><dt>Hiện tượng &amp; Ghi chú thi THPT</dt><dd>${escapeHtml(eq.note)}</dd></div>
          </dl>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
            <a class="btn" href="/can-bang-phuong-trinh-hoa-hoc">Mở Máy cân bằng PTHH tự động →</a>
            <a class="btn btn-ghost" href="/giai-bai-tap-bang-ai">Giải bài tập tính toán từ PTHH này bằng AI</a>
          </div>
        </section>
        <section class="card">
          <h2>Câu hỏi thường gặp</h2>
          ${faqs.map((f, idx) => `<div style="margin-bottom:10px"><h3>${idx + 1}. ${escapeHtml(f.q)}</h3><p style="margin:0;color:var(--ink2)">${escapeHtml(f.a)}</p></div>`).join('')}
        </section>
        <section class="card">
          <h2>Phương trình hóa học liên quan</h2>
          <div class="pill-links">
            ${neighbors.map((n) => `<a class="pill" href="/phuong-trinh/${n.slug}">${escapeHtml(n.equation)}</a>`).join('')}
          </div>
        </section>`,
    });

    fs.writeFileSync(path.join(dir, `${eq.slug}.html`), html, 'utf8');
    sitemapUrls.push({ loc: url, changefreq: 'monthly', priority: '0.72' });
  }

  return allEquations.length + 1;
}

/* =====================================================================
   4. 125 CHUYÊN ĐỀ KIẾN THỨC 12 MÔN THPT (/kien-thuc & /kien-thuc/:mon/:topic)
   ===================================================================== */
function generateKnowledgePages(sitemapUrls) {
  const rootDir = path.join(DIST_DIR, 'kien-thuc');
  ensureDir(rootDir);

  const hubUrl = `${SITE_ORIGIN}/kien-thuc`;
  let totalTopics = 0;

  const subjectBlocks = [];
  for (const [subjectName, topics] of Object.entries(TOPICS_BY_SUBJECT)) {
    const meta = SUBJECT_META[subjectName] || {
      slug: slugify(subjectName),
      pillar: '/hoc-online-mien-phi',
      code: '',
      desc: `Kiến thức trọng tâm môn ${subjectName} THPT`,
    };
    const subDir = path.join(rootDir, meta.slug);
    ensureDir(subDir);

    subjectBlocks.push(`
      <section class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <h2 style="margin:0">Môn ${escapeHtml(subjectName)} (${topics.length} chuyên đề)</h2>
          <a class="badge" href="${meta.pillar}">Trang chính ${escapeHtml(subjectName)} →</a>
        </div>
        <div class="pill-links">
          ${topics.map((t) => `<a class="pill" href="/kien-thuc/${meta.slug}/${t.id}">${escapeHtml(t.name)}</a>`).join('')}
        </div>
      </section>`);

    const subjectFormulas = GDPT2026_CARDS.filter((c) => meta.code && c.subject === meta.code).slice(0, 6);

    for (const topic of topics) {
      totalTopics += 1;
      const url = `${SITE_ORIGIN}/kien-thuc/${meta.slug}/${topic.id}`;
      const siblingTopics = topics.filter((t) => t.id !== topic.id).slice(0, 8);
      const faqs = [
        {
          q: `Chuyên đề ${topic.name} (${subjectName}) cần ôn những trọng tâm nào cho kỳ thi THPT?`,
          a: `Học sinh cần nắm vững khái niệm cốt lõi theo chương trình GDPT 2018, thành thạo các công thức/phương pháp giải nhanh, luyện tập các câu hỏi Đúng/Sai thực nghiệm và rèn phản xạ bằng bộ câu hỏi trắc nghiệm SRS trên ELEC Science AI.`,
        },
        {
          q: `Có thể giải bài tập chuyên đề ${topic.name} bằng AI trên ELEC AI không?`,
          a: `Có. Bạn chỉ cần nhập đề bài hoặc chụp ảnh câu hỏi thuộc chuyên đề ${topic.name} gửi cho Trợ lý AI tại https://www.elecai.id.vn/giai-bai-tap-bang-ai để nhận lời giải từng bước kèm giải thích bản chất.`,
        },
      ];

      const html = renderPseoShell({
        title: `${topic.name} — Kiến Thức, Tài Liệu & Bài Tập ${subjectName} THPT · ELEC AI`,
        description: `Tổng hợp kiến thức trọng tâm, công thức, tài liệu ôn thi và bài tập trắc nghiệm có lời giải chuyên đề ${topic.name} môn ${subjectName} THPT chuẩn GDPT 2018 trên ELEC Science AI.`,
        keywords: `${topic.name}, tài liệu ${subjectName} THPT, bài tập trắc nghiệm ${topic.name}, kiến thức THPT, ôn thi tốt nghiệp THPT, ELEC AI`,
        canonicalUrl: url,
        jsonLdList: [
          {
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            name: `Chuyên đề ${topic.name} — ${subjectName} THPT`,
            description: `Tài liệu học tập, công thức và bài tập trắc nghiệm chuyên đề ${topic.name} môn ${subjectName} chuẩn GDPT 2018.`,
            url,
            inLanguage: 'vi-VN',
            educationalLevel: ['THPT Lớp 10', 'THPT Lớp 11', 'THPT Lớp 12'],
            isAccessibleForFree: true,
            provider: { '@type': 'EducationalOrganization', name: 'ELEC Science AI', url: `${SITE_ORIGIN}/` },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'ELEC Science AI', item: `${SITE_ORIGIN}/` },
              { '@type': 'ListItem', position: 2, name: 'Kiến thức THPT', item: hubUrl },
              { '@type': 'ListItem', position: 3, name: `${topic.name} (${subjectName})`, item: url },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ],
        bodyHtml: `
          <nav class="crumb">
            <a href="/">Trang chủ</a><span>/</span>
            <a href="/kien-thuc">Kiến thức THPT</a><span>/</span>
            <a href="${meta.pillar}">${escapeHtml(subjectName)}</a><span>/</span>
            <span>${escapeHtml(topic.name)}</span>
          </nav>
          <section class="hero">
            <span class="badge" style="background:rgba(255,255,255,.18);color:#fff;margin-bottom:8px">Môn ${escapeHtml(subjectName)} · Chuẩn GDPT 2018</span>
            <h1>Chuyên đề: ${escapeHtml(topic.name)} (${escapeHtml(subjectName)} THPT)</h1>
            <p>Hệ thống tài liệu ôn tập, phương pháp giải bài tập trắc nghiệm có lời giải và luyện đề thực chiến cho chuyên đề <strong>${escapeHtml(topic.name)}</strong> trên ELEC Science AI.</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <a class="btn" style="background:#fff;color:#1d4ed8!important" href="/quiz">Luyện Quiz trắc nghiệm chuyên đề →</a>
              <a class="btn" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45)" href="/giai-bai-tap-bang-ai">Giải bài tập ${escapeHtml(topic.name)} bằng AI</a>
            </div>
          </section>

          <section class="card">
            <h2>Lộ trình 3 bước làm chủ chuyên đề ${escapeHtml(topic.name)}</h2>
            <ol style="margin:0;padding-left:20px;line-height:1.8">
              <li><strong>Nắm chắc lý thuyết nền tảng:</strong> Đọc hệ thống kiến thức chuẩn GDPT 2018 và dùng <a href="/ai-doc-studio">AI Doc Studio</a> tóm tắt file đề cương PDF thành thẻ Flashcard.</li>
              <li><strong>Rèn bài tập có lời giải:</strong> Giải câu hỏi từ cơ bản đến vận dụng cao; bất kỳ bài khó nào chụp ảnh gửi <a href="/gia-su-ai">Gia sư AI 24/7</a> để hiểu bản chất từng bước.</li>
              <li><strong>Thực chiến đề thi &amp; SRS:</strong> Kiểm tra mức độ thành thạo qua <a href="/de-thi">Kho đề thi thử THPT</a> và để hệ thống SRS nhắc ôn lại tự động các câu hay sai.</li>
            </ol>
          </section>

          ${
            subjectFormulas.length > 0
              ? `<section class="card">
                  <h2>Công thức ${escapeHtml(subjectName)} chuẩn 2026 liên quan</h2>
                  <div class="grid-2">
                    ${subjectFormulas
                      .map(
                        (f) => `<div class="q-item" style="margin:0">
                          <div style="font-weight:750;margin-bottom:4px">${escapeHtml(f.title)}</div>
                          <div style="font-family:ui-monospace,monospace;font-size:13.5px;color:var(--pri);margin-bottom:4px">${escapeHtml(f.f)}</div>
                          <div style="font-size:13px;color:var(--ink2)">${escapeHtml(f.hint || '')}</div>
                        </div>`
                      )
                      .join('')}
                  </div>
                  <div style="margin-top:12px"><a href="/cong-thuc-hoa-hoc">Mở trọn bộ Máy tính công thức KHTN →</a></div>
                </section>`
              : ''
          }

          <section class="card">
            <h2>Câu hỏi thường gặp</h2>
            ${faqs.map((f, idx) => `<div style="margin-bottom:10px"><h3>${idx + 1}. ${escapeHtml(f.q)}</h3><p style="margin:0;color:var(--ink2)">${escapeHtml(f.a)}</p></div>`).join('')}
          </section>

          <section class="card">
            <h2>Các chuyên đề ${escapeHtml(subjectName)} khác</h2>
            <div class="pill-links">
              ${siblingTopics.map((t) => `<a class="pill" href="/kien-thuc/${meta.slug}/${t.id}">${escapeHtml(t.name)}</a>`).join('')}
              <a class="pill" href="${meta.pillar}">Trang chủ học ${escapeHtml(subjectName)} online</a>
              <a class="pill" href="/lo-trinh-on-thi-thpt-quoc-gia">Lộ trình ôn thi THPT</a>
            </div>
          </section>`,
      });

      fs.writeFileSync(path.join(subDir, `${topic.id}.html`), html, 'utf8');
      sitemapUrls.push({ loc: url, changefreq: 'monthly', priority: '0.7' });
    }
  }

  const hubHtml = renderPseoShell({
    title: `Kho ${totalTopics} Chuyên Đề Kiến Thức 12 Môn THPT Chuẩn GDPT 2018 · ELEC AI`,
    description: `Hệ thống hóa ${totalTopics} chuyên đề kiến thức THPT lớp 10, 11, 12 cho 12 môn (Hóa học, Vật lí, Sinh học, Toán, Văn, Anh...) kèm tài liệu ôn thi, công thức và trắc nghiệm có lời giải.`,
    keywords:
      'kiến thức THPT, tài liệu học tập THPT, tài liệu ôn thi THPT, học tập lớp 10, học tập lớp 11, học tập lớp 12, bài tập trắc nghiệm THPT, ELEC AI',
    canonicalUrl: hubUrl,
    jsonLdList: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Kho ${totalTopics} Chuyên đề Kiến thức THPT — ELEC Science AI`,
        url: hubUrl,
        numberOfItems: totalTopics,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ELEC Science AI', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Kho kiến thức THPT', item: hubUrl },
        ],
      },
    ],
    bodyHtml: `
      <nav class="crumb"><a href="/">Trang chủ</a><span>/</span><span>Kho kiến thức THPT</span></nav>
      <section class="hero">
        <h1>Kho ${totalTopics} Chuyên Đề Kiến Thức THPT Lớp 10, 11, 12 (GDPT 2018)</h1>
        <p>Tra cứu tài liệu học tập, công thức giải nhanh và luyện bài tập trắc nghiệm theo từng chuyên đề của 12 môn phổ thông trên nền tảng học trực tuyến ELEC Science AI.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn" style="background:#fff;color:#1d4ed8!important" href="/hoc-tap-lop-12">Ôn thi Lớp 12</a>
          <a class="btn" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45)" href="/hoc-tap-lop-11">Học tập Lớp 11</a>
          <a class="btn" style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45)" href="/hoc-tap-lop-10">Học tập Lớp 10</a>
        </div>
      </section>
      ${subjectBlocks.join('\n')}`,
  });

  fs.writeFileSync(path.join(rootDir, 'index.html'), hubHtml, 'utf8');
  sitemapUrls.push({ loc: hubUrl, changefreq: 'weekly', priority: '0.85' });

  return totalTopics + 1;
}

/* =====================================================================
   5. GHI SITEMAP-PSEO.XML VÀO DIST/
   ===================================================================== */
function writePseoSitemap(sitemapUrls) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-pseo.xml'), xml, 'utf8');
}

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error(`Missing dist/ directory at ${DIST_DIR}. Run vite build first.`);
  }
  const sitemapUrls = [];
  const elCount = generateElementPages(sitemapUrls);
  const examCount = generateExamPages(sitemapUrls);
  const eqCount = generateEquationPages(sitemapUrls);
  const topicCount = generateKnowledgePages(sitemapUrls);
  writePseoSitemap(sitemapUrls);

  console.log(
    `[generate-pseo-pages] Generated ${sitemapUrls.length} static pSEO pages in dist/ ` +
      `(elements=${elCount}, exams=${examCount}, equations=${eqCount}, topics=${topicCount}) + dist/sitemap-pseo.xml`
  );
}

main();
