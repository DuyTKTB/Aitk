/* ============================================================
   roadmapExercises.js — BỘ BÀI TẬP ÔN LUYỆN TÍCH HỢP (AITK biên soạn)
   ------------------------------------------------------------
   Dùng khi ngân hàng của giáo viên chưa có câu gắn chuyên đề, hoặc để
   bổ sung cho đủ phiên luyện. Mỗi chương có:
     • points   — trọng tâm kiến thức (hiển thị ở tab Tổng quan)
     • mistakes — lỗi hay gặp
     • qs       — câu trắc nghiệm 4 lựa chọn, 3 mức độ:
                  'nb' Nhận biết · 'th' Thông hiểu · 'vd' Vận dụng
   Quy ước nhập liệu: lựa chọn ĐẦU TIÊN là đáp án đúng; khi tải ra sẽ
   được trộn thứ tự (shuffleOptions) nên học sinh không đoán theo vị trí.
   Id câu: "bi-<topicId>-<số>" → không trùng id Supabase, phân biệt được
   nguồn khi ôn câu sai. KHÔNG đổi id đã phát hành (lịch sử ôn dựa vào id).
   Thể tích khí ở điều kiện chuẩn (đkc, 25 °C, 1 bar): 24,79 L/mol.
   ============================================================ */

export const LEVEL_META = {
  nb: { label: 'Nhận biết', short: 'NB', tone: 'ok' },
  th: { label: 'Thông hiểu', short: 'TH', tone: 'acc' },
  vd: { label: 'Vận dụng', short: 'VD', tone: 'warn' },
};

export const BUILTIN_PREFIX = 'bi-';

const BANK = {
  /* ======================= LỚP 10 ======================= */
  'c10-atom': {
    points: [
      'Nguyên tử gồm hạt nhân (proton +, neutron không mang điện) và lớp vỏ electron (−).',
      'Số khối A = Z + N; nguyên tử trung hoà nên số proton = số electron = Z.',
      'Đồng vị: cùng Z, khác N. Nguyên tử khối trung bình = Σ(Aᵢ × %ᵢ).',
      'Thứ tự điền electron: 1s 2s 2p 3s 3p 4s 3d 4p… ; s tối đa 2e, p 6e, d 10e, f 14e.',
    ],
    mistakes: [
      'Viết cấu hình Fe theo thứ tự điền (…4s²3d⁶) thay vì theo lớp ([Ar]3d⁶4s²).',
      'Quên rằng "hạt mang điện" gồm cả proton lẫn electron (2Z).',
    ],
    qs: [
      ['nb', 'Hạt mang điện tích dương trong hạt nhân nguyên tử là', ['proton', 'neutron', 'electron', 'positron'], 'Hạt nhân gồm proton (mang điện +) và neutron (không mang điện); electron mang điện − ở lớp vỏ.'],
      ['nb', 'Số khối A của hạt nhân được tính bằng', ['Z + N', 'Z + E', 'N + E', 'Z − N'], 'A = số proton (Z) + số neutron (N).'],
      ['nb', 'Đồng vị là những nguyên tử có cùng', ['số proton nhưng khác số neutron', 'số neutron nhưng khác số proton', 'số khối nhưng khác số proton', 'số electron nhưng khác số proton'], 'Đồng vị cùng điện tích hạt nhân Z (cùng nguyên tố) nhưng khác số neutron nên khác số khối.'],
      ['th', 'Cấu hình electron của Na (Z = 11) là', ['1s²2s²2p⁶3s¹', '1s²2s²2p⁶3p¹', '1s²2s²2p⁵3s²', '1s²2s²2p⁶3s²'], '11 electron: 1s² (2) 2s² (4) 2p⁶ (10) 3s¹ (11).'],
      ['th', 'Cấu hình electron của Fe (Z = 26) viết đúng là', ['[Ar]3d⁶4s²', '[Ar]3d⁸', '[Ar]3d⁷4s¹', '[Ar]4s²4p⁶'], 'Electron điền 4s trước 3d (4s² rồi 3d⁶) nhưng cấu hình viết theo thứ tự lớp: [Ar]3d⁶4s².'],
      ['th', 'Số electron tối đa trong một phân lớp d là', ['10', '6', '14', '2'], 'Phân lớp d có 5 orbital, mỗi orbital chứa tối đa 2 electron → 10.'],
      ['vd', 'Nguyên tử X có tổng số hạt là 40, trong đó số hạt mang điện nhiều hơn số hạt không mang điện là 12. X là', ['Al (Z = 13)', 'Mg (Z = 12)', 'Si (Z = 14)', 'Na (Z = 11)'], '2Z + N = 40 và 2Z − N = 12 → 4Z = 52 → Z = 13 (Al), N = 14.'],
      ['vd', 'Chlorine có hai đồng vị ³⁵Cl (75%) và ³⁷Cl (25%). Nguyên tử khối trung bình của Cl là', ['35,5', '36,0', '35,25', '36,5'], 'Ā = 35 × 0,75 + 37 × 0,25 = 26,25 + 9,25 = 35,5.'],
    ],
  },

  'c10-periodic': {
    points: [
      'Các nguyên tố xếp theo chiều tăng dần điện tích hạt nhân Z.',
      'Số thứ tự chu kì = số lớp electron; nhóm A: số thứ tự nhóm = số electron lớp ngoài cùng.',
      'Trong chu kì (trái → phải): bán kính giảm, độ âm điện tăng, tính phi kim tăng.',
      'Trong nhóm A (trên → dưới): bán kính tăng, tính kim loại tăng, độ âm điện giảm.',
      'Hoá trị cao nhất với O = số nhóm; hoá trị với H (phi kim) = 8 − số nhóm.',
    ],
    mistakes: [
      'Nhầm chiều biến đổi bán kính trong chu kì (bán kính GIẢM khi Z tăng).',
      'Xác định nhóm theo tổng số electron thay vì electron lớp ngoài cùng.',
    ],
    qs: [
      ['nb', 'Các nguyên tố trong bảng tuần hoàn hiện đại được sắp xếp theo chiều tăng dần của', ['điện tích hạt nhân', 'nguyên tử khối', 'số neutron', 'số lớp electron'], 'Định luật tuần hoàn hiện đại dựa trên điện tích hạt nhân Z.'],
      ['nb', 'Số thứ tự của chu kì bằng', ['số lớp electron', 'số electron lớp ngoài cùng', 'số proton', 'số electron hoá trị'], 'Các nguyên tố cùng chu kì có cùng số lớp electron.'],
      ['nb', 'Nguyên tố có cấu hình [Ne]3s²3p⁵ thuộc nhóm', ['VIIA', 'VA', 'IIIA', 'VIIB'], '3 lớp electron → chu kì 3; 7 electron lớp ngoài cùng (3s²3p⁵), nguyên tố p → nhóm VIIA (Cl).'],
      ['th', 'Trong một chu kì, theo chiều tăng của điện tích hạt nhân, bán kính nguyên tử', ['giảm dần', 'tăng dần', 'không đổi', 'tăng rồi giảm'], 'Cùng số lớp electron nhưng Z tăng → hạt nhân hút electron mạnh hơn → bán kính giảm.'],
      ['th', 'Trong nhóm IA, đi từ trên xuống dưới, tính kim loại', ['tăng dần', 'giảm dần', 'không đổi', 'giảm rồi tăng'], 'Bán kính tăng nhanh, electron ngoài cùng càng dễ tách → tính kim loại tăng.'],
      ['th', 'Nguyên tố có độ âm điện lớn nhất là', ['F', 'O', 'Cl', 'N'], 'Fluorine (3,98) ở góc trên bên phải bảng tuần hoàn (trừ khí hiếm).'],
      ['vd', 'X thuộc chu kì 3, nhóm VIA. Công thức oxide cao nhất và hợp chất khí với hydrogen của X là', ['SO₃ và H₂S', 'SO₂ và H₂S', 'SO₃ và SH₆', 'S₂O₃ và H₂S'], 'X là S. Hoá trị cao nhất với O = 6 → SO₃; hoá trị với H = 8 − 6 = 2 → H₂S.'],
      ['vd', 'Dãy sắp xếp theo chiều tăng dần tính acid là', ['H₂SiO₃ < H₃PO₄ < H₂SO₄ < HClO₄', 'HClO₄ < H₂SO₄ < H₃PO₄ < H₂SiO₃', 'H₃PO₄ < H₂SiO₃ < HClO₄ < H₂SO₄', 'H₂SO₄ < HClO₄ < H₃PO₄ < H₂SiO₃'], 'Chu kì 3 từ Si → Cl tính phi kim tăng nên tính acid của hydroxide cao nhất tăng.'],
    ],
  },

  'c10-bonding': {
    points: [
      'Liên kết ion: lực hút tĩnh điện giữa ion trái dấu (kim loại điển hình – phi kim điển hình).',
      'Liên kết cộng hoá trị: dùng chung cặp electron; σ bền hơn π. Liên kết đôi = 1σ + 1π, ba = 1σ + 2π.',
      'Theo Δχ (Pauling): < 0,4 không cực · 0,4 – < 1,7 có cực · ≥ 1,7 ion.',
      'Liên kết hydrogen (F, O, N) và tương tác van der Waals làm tăng nhiệt độ sôi.',
    ],
    mistakes: [
      'Cho rằng phân tử có liên kết phân cực thì luôn phân cực (CO₂ thẳng nên không phân cực).',
      'Đếm thiếu liên kết π trong liên kết ba.',
    ],
    qs: [
      ['nb', 'Liên kết trong phân tử NaCl là liên kết', ['ion', 'cộng hoá trị không cực', 'cộng hoá trị có cực', 'kim loại'], 'Na (kim loại điển hình) nhường e cho Cl (phi kim điển hình) tạo Na⁺ và Cl⁻.'],
      ['nb', 'Liên kết cộng hoá trị được hình thành do', ['các nguyên tử dùng chung cặp electron', 'lực hút tĩnh điện giữa các ion trái dấu', 'các electron tự do', 'tương tác van der Waals'], 'Định nghĩa liên kết cộng hoá trị.'],
      ['nb', 'Phân tử có liên kết cộng hoá trị không cực là', ['Cl₂', 'HCl', 'H₂O', 'NaF'], 'Hai nguyên tử giống nhau → Δχ = 0 → không cực.'],
      ['th', 'Theo thang Pauling, liên kết được coi là liên kết ion khi hiệu độ âm điện Δχ', ['≥ 1,7', '< 0,4', 'từ 0,4 đến < 1,7', 'bằng 0'], '< 0,4: CHT không cực; 0,4 – < 1,7: CHT có cực; ≥ 1,7: ion.'],
      ['th', 'Phân tử N₂ có', ['1 liên kết σ và 2 liên kết π', '3 liên kết σ', '2 liên kết σ và 1 liên kết π', '1 liên kết σ và 1 liên kết π'], 'N≡N là liên kết ba: 1σ + 2π.'],
      ['th', 'H₂O có nhiệt độ sôi cao bất thường so với H₂S chủ yếu vì', ['giữa các phân tử H₂O có liên kết hydrogen', 'phân tử khối của H₂O lớn hơn', 'H₂O là hợp chất ion', 'H₂S không có liên kết cộng hoá trị'], 'O có độ âm điện lớn, tạo liên kết hydrogen giữa các phân tử nước; phân tử khối H₂O (18) còn nhỏ hơn H₂S (34).'],
      ['vd', 'Liên kết C=O phân cực nhưng phân tử CO₂ không phân cực vì', ['phân tử có cấu tạo thẳng, hai moment lưỡng cực triệt tiêu', 'C và O có độ âm điện bằng nhau', 'liên kết C=O là liên kết ion', 'CO₂ tồn tại ở thể khí'], 'O=C=O thẳng (180°), hai vector lưỡng cực ngược chiều, bằng nhau → tổng bằng 0.'],
      ['vd', 'Ion Mg²⁺ (Z của Mg = 12) có cấu hình electron giống khí hiếm', ['Ne', 'Ar', 'He', 'Kr'], 'Mg²⁺ có 12 − 2 = 10 electron: 1s²2s²2p⁶, giống Ne.'],
    ],
  },

  'c10-redox': {
    points: [
      'Chất khử nhường electron (số oxi hoá tăng); chất oxi hoá nhận electron (số oxi hoá giảm).',
      '"Khử cho – O nhận": chất khử bị oxi hoá, chất oxi hoá bị khử.',
      'Quy tắc số oxi hoá: đơn chất = 0; H thường +1; O thường −2; tổng trong phân tử = 0, trong ion = điện tích ion.',
      'Cân bằng bằng phương pháp thăng bằng electron: tổng e nhường = tổng e nhận.',
    ],
    mistakes: [
      'Nhầm "chất khử" với "chất bị khử".',
      'Quên nhân hệ số khi một chất vừa là môi trường vừa là chất oxi hoá (HNO₃).',
    ],
    qs: [
      ['nb', 'Chất khử là chất', ['nhường electron', 'nhận electron', 'có số oxi hoá giảm sau phản ứng', 'bị khử'], 'Chất khử nhường electron, số oxi hoá tăng (bị oxi hoá).'],
      ['nb', 'Số oxi hoá của S trong H₂SO₄ là', ['+6', '+4', '−2', '+2'], '2(+1) + x + 4(−2) = 0 → x = +6.'],
      ['nb', 'Số oxi hoá của N trong ion NH₄⁺ là', ['−3', '+3', '+5', '0'], 'x + 4(+1) = +1 → x = −3.'],
      ['th', 'Trong phản ứng Fe + CuSO₄ → FeSO₄ + Cu, chất oxi hoá là', ['CuSO₄ (Cu²⁺)', 'Fe', 'FeSO₄', 'Cu'], 'Cu²⁺ nhận 2e thành Cu (số oxi hoá giảm +2 → 0).'],
      ['th', 'Phản ứng nào sau đây là phản ứng oxi hoá – khử?', ['2H₂ + O₂ → 2H₂O', 'CaCO₃ → CaO + CO₂', 'NaOH + HCl → NaCl + H₂O', 'BaCl₂ + Na₂SO₄ → BaSO₄ + 2NaCl'], 'Chỉ phản ứng đốt H₂ có thay đổi số oxi hoá (H: 0 → +1; O: 0 → −2).'],
      ['th', 'Trong phản ứng Cl₂ + 2NaOH → NaCl + NaClO + H₂O, Cl₂ đóng vai trò', ['vừa là chất oxi hoá, vừa là chất khử', 'chỉ là chất oxi hoá', 'chỉ là chất khử', 'không thay đổi số oxi hoá'], 'Cl từ 0 → −1 (NaCl) và 0 → +1 (NaClO): phản ứng tự oxi hoá – khử.'],
      ['vd', 'Cân bằng: Al + HNO₃ → Al(NO₃)₃ + NO + H₂O (hệ số nguyên tối giản). Tổng hệ số các chất là', ['9', '10', '8', '12'], 'Al → Al³⁺ + 3e; N⁺⁵ + 3e → N⁺². Al + 4HNO₃ → Al(NO₃)₃ + NO + 2H₂O → 1 + 4 + 1 + 1 + 2 = 9.'],
      ['vd', 'Cho 5,6 g Fe tác dụng hết với Cl₂ dư. Số mol electron mà Fe đã nhường là', ['0,3', '0,2', '0,1', '0,6'], 'n(Fe) = 0,1 mol; Cl₂ oxi hoá Fe lên +3 (FeCl₃) → 0,1 × 3 = 0,3 mol e.'],
    ],
  },

  'c10-energy': {
    points: [
      'ΔrH < 0: phản ứng toả nhiệt; ΔrH > 0: phản ứng thu nhiệt.',
      'Điều kiện chuẩn: 1 bar, 25 °C (298 K); nồng độ 1 mol/L với chất tan.',
      'ΔfH° của đơn chất bền nhất = 0.',
      'ΔrH° = ΣΔfH°(sản phẩm) − ΣΔfH°(chất đầu) = ΣEb(chất đầu) − ΣEb(sản phẩm).',
    ],
    mistakes: [
      'Đảo thứ tự công thức năng lượng liên kết (phải là chất đầu − sản phẩm).',
      'Quên nhân hệ số tỉ lượng khi cộng ΔfH°.',
    ],
    qs: [
      ['nb', 'Phản ứng toả nhiệt có', ['ΔrH < 0', 'ΔrH > 0', 'ΔrH = 0', 'ΔrH bất kì'], 'Hệ toả nhiệt ra môi trường nên enthalpy giảm.'],
      ['nb', 'Điều kiện chuẩn dùng cho biến thiên enthalpy chuẩn là', ['1 bar và 25 °C (298 K)', '1 atm và 0 °C', '1 bar và 0 K', '2 bar và 100 °C'], 'Theo quy ước IUPAC dùng trong SGK hiện hành.'],
      ['nb', 'Quá trình nào sau đây là quá trình thu nhiệt?', ['Nhiệt phân CaCO₃', 'Đốt cháy than', 'Đốt cháy khí methane', 'Phản ứng trung hoà acid – base'], 'Nhiệt phân đá vôi phải cung cấp nhiệt liên tục (ΔrH > 0).'],
      ['th', 'Enthalpy tạo thành chuẩn của đơn chất bền (như O₂, N₂) bằng', ['0', '1 kJ/mol', 'tuỳ từng chất', 'một số âm'], 'Quy ước ΔfH° của đơn chất ở dạng bền nhất bằng 0.'],
      ['th', 'Cho ΔfH°: CO₂(g) = −393,5; H₂O(l) = −285,8; CH₄(g) = −74,8 kJ/mol. ΔrH° của CH₄ + 2O₂ → CO₂ + 2H₂O(l) là', ['−890,3 kJ', '−604,5 kJ', '+890,3 kJ', '−1039,9 kJ'], 'ΔrH° = (−393,5) + 2(−285,8) − (−74,8) − 0 = −890,3 kJ.'],
      ['th', 'Với phản ứng giữa các chất khí, ΔrH tính theo năng lượng liên kết là', ['ΣEb(chất đầu) − ΣEb(sản phẩm)', 'ΣEb(sản phẩm) − ΣEb(chất đầu)', 'ΣEb(chất đầu) + ΣEb(sản phẩm)', 'ΣEb(sản phẩm) : ΣEb(chất đầu)'], 'Phá liên kết (chất đầu) tốn năng lượng, tạo liên kết (sản phẩm) giải phóng năng lượng.'],
      ['vd', 'Cho Eb (kJ/mol): H–H 436; Cl–Cl 243; H–Cl 432. ΔrH của H₂ + Cl₂ → 2HCl là', ['−185 kJ', '+185 kJ', '−247 kJ', '+247 kJ'], 'ΔrH = (436 + 243) − 2 × 432 = 679 − 864 = −185 kJ.'],
      ['vd', 'Đốt cháy 1 mol CH₄ toả ra 890 kJ. Đốt cháy 0,5 mol CH₄ toả ra', ['445 kJ', '890 kJ', '1780 kJ', '222,5 kJ'], 'Nhiệt lượng tỉ lệ thuận với số mol: 0,5 × 890 = 445 kJ.'],
    ],
  },

  'c10-rate': {
    points: [
      'Tốc độ trung bình: v = ±ΔC / (hệ số × Δt).',
      'Yếu tố ảnh hưởng: nồng độ, áp suất (chất khí), nhiệt độ, diện tích bề mặt, chất xúc tác.',
      'Quy tắc Van\'t Hoff: v₂ = v₁ · γ^((t₂ − t₁)/10).',
      'Định luật tác dụng khối lượng (phản ứng đơn giản): v = k·C_Aᵃ·C_Bᵇ.',
      'Chất xúc tác làm tăng tốc độ, không bị tiêu hao, không làm chuyển dịch cân bằng.',
    ],
    mistakes: [
      'Nghĩ rằng tăng thể tích dung dịch (cùng nồng độ) làm tăng tốc độ.',
      'Tính γ theo cấp số cộng thay vì luỹ thừa.',
    ],
    qs: [
      ['nb', 'Tốc độ phản ứng là', ['đại lượng đặc trưng cho sự biến thiên nồng độ của chất trong một đơn vị thời gian', 'tổng lượng sản phẩm thu được', 'thời gian để phản ứng kết thúc', 'nhiệt lượng toả ra của phản ứng'], 'Định nghĩa tốc độ phản ứng.'],
      ['nb', 'Chất xúc tác là chất', ['làm tăng tốc độ phản ứng và không bị tiêu hao sau phản ứng', 'bị tiêu hao hoàn toàn trong phản ứng', 'làm cân bằng chuyển dịch theo chiều thuận', 'làm tăng biến thiên enthalpy'], 'Xúc tác giảm năng lượng hoạt hoá, còn nguyên sau phản ứng.'],
      ['nb', 'Yếu tố nào KHÔNG làm thay đổi tốc độ phản ứng giữa Zn và dung dịch HCl?', ['Thể tích dung dịch HCl (cùng nồng độ)', 'Nhiệt độ', 'Nồng độ HCl', 'Kích thước hạt Zn'], 'Tốc độ phụ thuộc nồng độ, không phụ thuộc tổng thể tích dung dịch.'],
      ['th', 'Hệ số nhiệt độ Van\'t Hoff γ = 2. Khi tăng nhiệt độ thêm 30 °C, tốc độ phản ứng tăng', ['8 lần', '6 lần', '3 lần', '16 lần'], 'v₂/v₁ = 2^(30/10) = 2³ = 8.'],
      ['th', 'Than cám cháy nhanh hơn than cục cùng khối lượng là do', ['diện tích bề mặt tiếp xúc lớn hơn', 'nồng độ O₂ lớn hơn', 'nhiệt độ cao hơn', 'có chất xúc tác'], 'Chia nhỏ chất rắn làm tăng diện tích tiếp xúc với O₂.'],
      ['th', 'Với phản ứng đơn giản aA + bB → sản phẩm, biểu thức tốc độ là', ['v = k·C_Aᵃ·C_Bᵇ', 'v = k(C_A + C_B)', 'v = k·a·b', 'v = C_A / C_B'], 'Định luật tác dụng khối lượng.'],
      ['vd', 'Nồng độ chất A giảm từ 0,12 M xuống 0,08 M sau 20 giây. Tốc độ trung bình theo A là', ['0,002 M/s', '0,004 M/s', '0,02 M/s', '0,0006 M/s'], 'v = (0,12 − 0,08) / 20 = 0,002 M/s.'],
      ['vd', 'Cho v = k·C_A·C_B. Tăng nồng độ A lên 2 lần và B lên 3 lần thì tốc độ tăng', ['6 lần', '5 lần', '9 lần', '12 lần'], 'v\' = k(2C_A)(3C_B) = 6v.'],
    ],
  },

  'c10-halogen': {
    points: [
      'Nhóm VIIA: F, Cl, Br, I; cấu hình lớp ngoài ns²np⁵; tính oxi hoá giảm từ F₂ đến I₂.',
      'Halogen mạnh đẩy halogen yếu khỏi muối: Cl₂ + 2NaBr → 2NaCl + Br₂.',
      'Tính acid: HF < HCl < HBr < HI (HF là acid yếu).',
      'Nhận biết X⁻ bằng AgNO₃: AgCl trắng, AgBr vàng nhạt, AgI vàng; AgF tan.',
      'Nước Javel: NaCl + NaClO; điều chế Cl₂ trong PTN: MnO₂ hoặc KMnO₄ + HCl đặc.',
    ],
    mistakes: [
      'Cho rằng HF là acid mạnh nhất vì F có độ âm điện lớn nhất.',
      'Dùng AgNO₃ để nhận biết F⁻ (AgF tan, không kết tủa).',
    ],
    qs: [
      ['nb', 'Halogen có tính oxi hoá mạnh nhất là', ['F₂', 'Cl₂', 'Br₂', 'I₂'], 'Độ âm điện F lớn nhất → tính oxi hoá F₂ mạnh nhất.'],
      ['nb', 'Cấu hình electron lớp ngoài cùng của các nguyên tố halogen là', ['ns²np⁵', 'ns²np⁴', 'ns²np⁶', 'ns¹'], '7 electron lớp ngoài cùng, thuộc nhóm VIIA.'],
      ['nb', 'Ở điều kiện thường, bromine tồn tại ở trạng thái', ['lỏng, màu nâu đỏ', 'khí, màu vàng lục', 'rắn, màu tím đen', 'khí, không màu'], 'F₂ khí lục nhạt, Cl₂ khí vàng lục, Br₂ lỏng nâu đỏ, I₂ rắn tím đen.'],
      ['th', 'Trong các acid HX sau, acid mạnh nhất là', ['HI', 'HF', 'HCl', 'HBr'], 'Liên kết H–I dài và kém bền nhất → phân li H⁺ dễ nhất.'],
      ['th', 'Thuốc thử dùng để nhận biết ion Cl⁻ trong dung dịch là', ['dung dịch AgNO₃', 'quỳ tím', 'dung dịch BaCl₂', 'phenolphthalein'], 'Ag⁺ + Cl⁻ → AgCl↓ trắng.'],
      ['th', 'Thành phần chính của nước Javel là', ['NaCl và NaClO', 'NaCl và NaClO₃', 'CaOCl₂', 'HCl và HClO'], 'Cl₂ + 2NaOH → NaCl + NaClO + H₂O (ở nhiệt độ thường).'],
      ['vd', 'Sục khí Cl₂ vào dung dịch NaBr, hiện tượng quan sát được là', ['dung dịch chuyển sang màu vàng nâu', 'xuất hiện kết tủa trắng', 'có khí không màu thoát ra', 'không có hiện tượng gì'], 'Cl₂ + 2NaBr → 2NaCl + Br₂; Br₂ tan tạo màu vàng nâu.'],
      ['vd', 'Cho 8,7 g MnO₂ tác dụng với HCl đặc dư, đun nóng. Thể tích Cl₂ thu được ở đkc là', ['2,479 L', '2,24 L', '4,958 L', '1,2395 L'], 'MnO₂ + 4HCl → MnCl₂ + Cl₂ + 2H₂O; n(Cl₂) = n(MnO₂) = 0,1 mol → V = 0,1 × 24,79 = 2,479 L.'],
    ],
  },

  /* ======================= LỚP 11 ======================= */
  'c11-equilibrium': {
    points: [
      'Cân bằng hoá học là cân bằng động: v(thuận) = v(nghịch) > 0, nồng độ các chất trong hệ giữ không đổi theo thời gian.',
      'Hằng số cân bằng K_C chỉ phụ thuộc vào bản chất phản ứng và nhiệt độ (T); KHÔNG đưa chất rắn nguyên chất (s) và chất lỏng nguyên chất làm dung môi (l) vào biểu thức K_C.',
      'Nguyên lí chuyển dịch cân bằng Le Chatelier: Khi hệ đang ở trạng thái cân bằng chịu tác động từ bên ngoài (biến đổi nồng độ, áp suất, nhiệt độ), cân bằng sẽ chuyển dịch theo chiều làm GIẢM tác động đó.',
      'Chất xúc tác làm tăng đồng thời tốc độ phản ứng thuận và nghịch với số lần bằng nhau → giúp hệ nhanh đạt cân bằng nhưng KHÔNG làm chuyển dịch cân bằng (không đổi hiệu suất).',
      'Thuyết acid – base Brønsted – Lowry: Acid là chất cho proton (H⁺), Base là chất nhận proton (H⁺). Công thức tính: pH = −lg[H⁺], pOH = −lg[OH⁻], pH + pOH = 14 (ở 25 °C).',
    ],
    mistakes: [
      'Ngộ nhận rằng thêm chất xúc tác sẽ làm tăng hiệu suất tổng hợp NH₃ hoặc SO₃.',
      'Đưa cả nồng độ chất rắn (như C(s), CaCO₃(s), Fe₂O₃(s)) vào biểu thức tính hằng số cân bằng K_C.',
      'Nhầm lẫn giữa độ mạnh acid và nồng độ: pha loãng dung dịch HCl thì pH tăng lên (tiệm cận 7), không phải giảm xuống.',
    ],
    qs: [
      [
        'nb',
        '[THPTQG 2025] Cho phản ứng thuận nghịch đang ở trạng thái cân bằng hoá học. Phát biểu nào sau đây mô tả ĐÚNG bản chất của trạng thái cân bằng động?',
        [
          'Phản ứng thuận và phản ứng nghịch vẫn tiếp diễn với tốc độ bằng nhau, nồng độ các chất không đổi',
          'Phản ứng thuận và phản ứng nghịch đều dừng lại hoàn toàn, không còn sự chuyển hoá giữa các chất',
          'Nồng độ mol của các chất tham gia luôn bằng đúng nồng độ mol của các chất sản phẩm',
          'Toàn bộ chất tham gia ban đầu đã chuyển hoá hết 100% thành sản phẩm ở trạng thái cân bằng',
        ],
        '• Bước 1 (Bản chất cân bằng động): Tại trạng thái cân bằng, phản ứng KHÔNG dừng lại mà v(thuận) = v(nghịch) > 0.\n• Bước 2 (Hệ quả): Vì tốc độ sinh ra bằng tốc độ mất đi trong một đơn vị thời gian nên nồng độ mol các chất ở trạng thái cân bằng giữ không đổi.',
        'Bản chất cân bằng động',
        'Bẫy thường gặp: Học sinh hay chọn nhầm "nồng độ các chất bằng nhau" hoặc "phản ứng dừng lại". Hãy nhớ: tốc độ bằng nhau, nồng độ không đổi!',
      ],
      [
        'nb',
        '[ĐGNL HSA] Khi một hệ phản ứng thuận nghịch đã đạt tới trạng thái cân bằng hoá học, tác động nào sau đây KHÔNG làm cân bằng chuyển dịch?',
        [
          'Bổ sung thêm chất xúc tác chọn lọc vào hệ phản ứng',
          'Thay đổi nhiệt độ của bình phản ứng (với phản ứng có ΔrH ≠ 0)',
          'Thêm hoặc lấy bớt một lượng chất khí tham gia phản ứng',
          'Nén giảm thể tích bình đối với phản ứng có sự chênh lệch số mol khí hai vế (Δn ≠ 0)',
        ],
        '• Bước 1: Chất xúc tác làm giảm năng lượng hoạt hoá của cả phản ứng thuận và nghịch như nhau.\n• Bước 2: Do v(thuận) và v(nghịch) tăng cùng một tỉ lệ, trạng thái cân bằng không bị dịch chuyển mà chỉ rút ngắn thời gian đạt cân bằng.',
        'Các yếu tố ảnh hưởng cân bằng',
        'Mẹo giải nhanh: Trong mọi bài toán Le Chatelier, cụm từ "chất xúc tác" luôn đi kèm với "không làm chuyển dịch cân bằng, không làm đổi K_C".',
      ],
      [
        'nb',
        '[THPTQG 2025] Trong công nghiệp sản xuất ammonia theo chu trình Haber–Bosch: N₂(g) + 3H₂(g) ⇌ 2NH₃(g). Biểu thức hằng số cân bằng K_C của phản ứng trên là',
        [
          'K_C = [NH₃]² / ([N₂]·[H₂]³)',
          'K_C = ([N₂]·[H₂]³) / [NH₃]²',
          'K_C = 2[NH₃] / ([N₂] + 3[H₂])',
          'K_C = [NH₃] / ([N₂]·[H₂])',
        ],
        '• Bước 1: Kiểm tra trạng thái các chất — cả N₂, H₂ và NH₃ đều ở thể khí (g) nên đều có mặt trong biểu thức K_C.\n• Bước 2: Áp dụng định luật tác dụng khối lượng: tích nồng độ sản phẩm chia tích nồng độ chất đầu, số mũ là hệ số cân bằng → K_C = [NH₃]² / ([N₂]·[H₂]³).',
        'Biểu thức hằng số cân bằng K_C',
        'Lưu ý: Nếu phương trình có chất rắn (s), tuyệt đối không đưa chất rắn vào tử số hay mẫu số của K_C.',
      ],
      [
        'th',
        '[Thực tiễn công nghiệp] Cho cân bằng tổng hợp ammonia: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) có ΔrH°₂₉₈ = −91,8 kJ. Để tăng hiệu suất tổng hợp NH₃ ở trạng thái cân bằng, biện pháp kĩ thuật nào sau đây là ĐÚNG?',
        [
          'Tăng áp suất chung của hệ và hạ nhiệt độ xuống mức thích hợp, đồng thời hoá lỏng tách NH₃ ra khỏi hỗn hợp',
          'Giảm áp suất chung của hệ và tăng nhiệt độ lên thật cao (trên 900 °C)',
          'Chỉ cần tăng lượng bột sắt xúc tác mà không cần thay đổi áp suất hay nhiệt độ',
          'Giảm nồng độ khí N₂ và tăng thể tích bình phản ứng lên gấp đôi',
        ],
        '• Bước 1 (Xét áp suất): Vế trái có 1 + 3 = 4 mol khí, vế phải có 2 mol khí. Tăng áp suất → cân bằng dịch chuyển theo chiều giảm số mol khí (chiều thuận).\n• Bước 2 (Xét nhiệt độ): ΔrH° < 0 (phản ứng thuận toả nhiệt) → giảm nhiệt độ vừa phải (khoảng 400–450 °C để xúc tác vẫn hoạt động) giúp cân bằng dịch theo chiều thuận.\n• Bước 3 (Xét nồng độ): Hoá lỏng tách NH₃ làm giảm [NH₃] → cân bằng tiếp tục dịch theo chiều thuận.',
        'Chuyển dịch cân bằng Le Chatelier',
        'Mẹo nhớ: "Tăng thu – Giảm toả" (Tăng nhiệt độ dịch theo chiều thu nhiệt ΔH > 0; Giảm nhiệt độ dịch theo chiều toả nhiệt ΔH < 0).',
      ],
      [
        'th',
        '[Chuẩn độ & pH] Trộn 100 mL dung dịch HCl 0,03 M với 100 mL dung dịch NaOH 0,01 M ở 25 °C. Giá trị pH của dung dịch thu được sau khi phản ứng xảy ra hoàn toàn là',
        [
          '2,0',
          '12,0',
          '1,5',
          '3,0',
        ],
        '• Bước 1: Tính số mol H⁺ và OH⁻ ban đầu:\n  n(H⁺) = 0,1 × 0,03 = 0,003 mol; n(OH⁻) = 0,1 × 0,01 = 0,001 mol.\n• Bước 2: Phản ứng trung hoà: H⁺ + OH⁻ → H₂O. Số mol H⁺ dư = 0,003 − 0,001 = 0,002 mol.\n• Bước 3: Tổng thể tích dung dịch sau trộn V = 0,1 + 0,1 = 0,2 L → [H⁺]dư = 0,002 / 0,2 = 0,01 M = 10⁻² M ⇒ pH = −lg(10⁻²) = 2,0.',
        'Bài toán trộn dung dịch & tính pH',
        'Bẫy kinh điển: Học sinh quên cộng tổng thể tích sau khi trộn (V = V₁ + V₂ = 200 mL) nên chia nhầm cho 0,1 L.',
      ],
      [
        'th',
        '[Thuyết Brønsted – Lowry] Xét các chất trong dung dịch nước: NaCl, CH₃COOH, C₂H₅OH, Ba(OH)₂. Nhận định nào sau đây về sự điện li và bản chất acid – base là ĐÚNG?',
        [
          'NaCl và Ba(OH)₂ là chất điện li mạnh; CH₃COOH là chất điện li yếu; C₂H₅OH là chất không điện li',
          'Cả bốn chất đều phân li hoàn toàn thành ion khi hoà tan trong nước',
          'C₂H₅OH có nhóm –OH nên phân li mạnh cho ion OH⁻ làm quỳ tím hoá xanh',
          'CH₃COOH là chất điện li mạnh vì làm đổi màu quỳ tím sang đỏ',
        ],
        '• Bước 1: Hầu hết muối tan (NaCl) và kiềm mạnh (Ba(OH)₂) phân li hoàn toàn → chất điện li mạnh.\n• Bước 2: CH₃COOH là acid hữu cơ chỉ phân li một phần (CH₃COOH ⇌ CH₃COO⁻ + H⁺) → chất điện li yếu.\n• Bước 3: Ethanol (C₂H₅OH) tan tốt trong nước nhờ liên kết hydrogen nhưng phân tử không phân li thành ion → chất không điện li.',
        'Phân loại chất điện li & Brønsted – Lowry',
        'Cẩn thận: Hợp chất hữu cơ có nhóm –OH (như alcohol C₂H₅OH, glucose) KHÔNG phân li ra OH⁻ và không phải là base!',
      ],
      [
        'vd',
        '[Đếm phát biểu đúng – THPTQG] Cho các cân bằng hoá học trong bình kín ở nhiệt độ không đổi:\n(1) H₂(g) + I₂(g) ⇌ 2HI(g)\n(2) 2NO₂(g) ⇌ N₂O₄(g)\n(3) C(s) + H₂O(g) ⇌ CO(g) + H₂(g)\n(4) Fe₂O₃(s) + 3CO(g) ⇌ 2Fe(s) + 3CO₂(g)\nKhi tăng áp suất chung của mỗi hệ bằng cách nén nhỏ thể tích bình, các cân bằng KHÔNG bị chuyển dịch là',
        [
          '(1) và (4)',
          '(1) và (2)',
          '(2) và (3)',
          '(3) và (4)',
        ],
        '• Bước 1: Áp suất chỉ làm chuyển dịch cân bằng khi tổng hệ số mol chất KHÍ ở hai vế khác nhau (Δn_khí ≠ 0).\n• Bước 2: Kiểm tra từng phương trình (chỉ đếm chất khí (g), bỏ qua chất rắn (s)):\n  - (1) n_khí trái = 1 + 1 = 2; n_khí phải = 2 ⇒ Δn = 0 (không chuyển dịch).\n  - (2) n_khí trái = 2; n_khí phải = 1 ⇒ Δn ≠ 0 (dịch chiều thuận).\n  - (3) C là chất rắn (s) ⇒ n_khí trái = 1 (H₂O); n_khí phải = 1 + 1 = 2 ⇒ Δn ≠ 0 (dịch chiều nghịch).\n  - (4) Fe₂O₃ và Fe là chất rắn ⇒ n_khí trái = 3 (CO); n_khí phải = 3 (CO₂) ⇒ Δn = 0 (không chuyển dịch).\n• Kết luận: Cân bằng (1) và (4) không bị chuyển dịch.',
        'Đếm mệnh đề chuyển dịch cân bằng',
        'Bẫy số 1 đề thi THPTQG: Ở phản ứng (3) và (4), học sinh cộng nhầm cả hệ số của chất rắn C(s), Fe(s) vào số mol khí!',
      ],
      [
        'vd',
        '[Bài toán K_C & Hiệu suất] Cho 1,0 mol H₂ và 1,0 mol I₂ vào bình kín dung tích 2,0 lít ở 430 °C. Khi phản ứng H₂(g) + I₂(g) ⇌ 2HI(g) đạt trạng thái cân bằng, nồng độ ở trạng thái cân bằng đo được là [H₂] = [I₂] = 0,1 M và [HI] = 0,8 M. Giá trị hằng số cân bằng K_C và hiệu suất phản ứng lần lượt là',
        [
          'K_C = 64 và H = 80%',
          'K_C = 8 và H = 80%',
          'K_C = 64 và H = 40%',
          'K_C = 0,0156 và H = 90%',
        ],
        '• Bước 1 (Tính K_C): Tại cân bằng, K_C = [HI]² / ([H₂]·[I₂]) = (0,8)² / (0,1 × 0,1) = 0,64 / 0,01 = 64.\n• Bước 2 (Tính hiệu suất): Nồng độ ban đầu C₀(H₂) = 1,0 mol / 2,0 L = 0,5 M.\n• Bước 3: Lượng H₂ đã phản ứng = 0,5 − 0,1 = 0,4 M (hoặc tính từ ½[HI] = 0,4 M) ⇒ Hiệu suất H = (0,4 / 0,5) × 100% = 80%.',
        'Bài toán 3 dòng: Ban đầu – Phản ứng – Cân bằng',
        'Phương pháp chuẩn: Luôn lập bảng 3 dòng (Ban đầu – Phản ứng – Cân bằng) theo nồng độ mol/L (nhớ chia số mol cho thể tích bình V trước!).',
      ],
    ],
  },

  'c11-nitrogen': {
    points: [
      'Phân tử N₂ có liên kết ba bền vững (N≡N, Eb = 945 kJ/mol) nên rất trơ ở nhiệt độ thường, dùng bảo quản thực phẩm/mẫu vật.',
      'NH₃ có tính base yếu (nhận H⁺ tạo NH₄⁺, làm quỳ tím ẩm hoá xanh) và tính khử mạnh (N có số oxi hoá −3 thấp nhất).',
      'HNO₃ là acid mạnh và chất oxi hoá rất mạnh: oxi hoá hầu hết kim loại (trừ Au, Pt) lên số oxi hoá cao nhất, giải phóng NO₂, NO, N₂O, N₂ hoặc NH₄NO₃ (KHÔNG giải phóng H₂).',
      'H₂SO₄ đặc có tính oxi hoá mạnh và tính háo nước mãnh liệt (than hoá hợp chất glucid); Al, Fe, Cr bị thụ động hoá trong HNO₃ đặc nguội và H₂SO₄ đặc nguội.',
      'Phú dưỡng hoá nguồn nước do dư thừa dinh dưỡng N, P; mưa acid chủ yếu do khí thải SO₂ và NOx.',
    ],
    mistakes: [
      'Viết phương trình kim loại + HNO₃ hoặc H₂SO₄ đặc giải phóng khí H₂.',
      'Dùng H₂SO₄ đặc để làm khô khí NH₃ hoặc H₂S (chúng xảy ra phản ứng hoá học với nhau).',
    ],
    qs: [
      ['nb', '[THPTQG 2025] Ở điều kiện thường, đơn chất nitrogen (N₂) rất trơ về mặt hoá học và được bơm vào túi thực phẩm để chống oxi hoá vì', ['phân tử N₂ có liên kết ba N≡N rất bền với năng lượng liên kết lớn (945 kJ/mol)', 'nguyên tử nitrogen có độ âm điện nhỏ nhất trong nhóm VA', 'phân tử N₂ có cấu hình electron bão hoà giống khí hiếm Neon', 'khí N₂ hoàn toàn không tan trong nước và các dung môi hữu cơ'], '• Bước 1: Cấu tạo phân tử N₂ gồm 1 liên kết σ và 2 liên kết π (N≡N).\n• Bước 2: Năng lượng liên kết N≡N rất lớn (945 kJ/mol) nên cần nhiệt độ rất cao hoặc tia lửa điện mới phá vỡ được.', 'Cấu tạo & Tính trơ của N₂', 'Mẹo nhớ: Nhắc tới tính trơ của N₂ ở nhiệt độ thường → chọn ngay "liên kết ba N≡N có năng lượng liên kết rất lớn".'],
      ['nb', '[Thực tiễn môi trường] Hai tác nhân khí gây ra hiện tượng mưa acid (làm pH nước mưa < 5,6) phát sinh chủ yếu từ khí thải nhà máy nhiệt điện và động cơ đốt trong là', ['SO₂ và NOx', 'CO₂ và CH₄', 'O₃ và CFC', 'N₂ và CO'], '• Bước 1: SO₂ và NOx khi phát thải vào khí quyển bị oxi hoá bởi O₂ (nhờ xúc tác bụi kim loại/ánh sáng) tạo SO₃, NO₂.\n• Bước 2: Các oxide này hoà tan trong nước mưa tạo thành acid mạnh H₂SO₄ và HNO₃.', 'Hoá học môi trường – Mưa acid', 'Phân biệt nhanh 3 vấn đề môi trường: Mưa acid (SO₂, NOx) · Hiệu ứng nhà kính (CO₂, CH₄) · Thủng tầng ozone (CFC).'],
      ['nb', '[Thí nghiệm] Đưa mẩu giấy quỳ tím ẩm lại gần miệng ống nghiệm chứa khí ammonia (NH₃), hiện tượng quan sát được là', ['giấy quỳ tím ẩm chuyển sang màu xanh', 'giấy quỳ tím ẩm chuyển sang màu đỏ', 'giấy quỳ tím ẩm bị mất màu hoàn toàn', 'giấy quỳ tím ẩm không đổi màu'], '• Bước 1: Khí NH₃ tan rất nhiều trong nước tạo cân bằng: NH₃ + H₂O ⇌ NH₄⁺ + OH⁻.\n• Bước 2: Ion OH⁻ sinh ra tạo môi trường kiềm yếu (pH > 7) làm quỳ tím ẩm hoá xanh.', 'Tính base yếu của NH₃', 'Lưu ý: Quỳ tím khô sẽ KHÔNG đổi màu trong khí NH₃ khô vì chưa xảy ra quá trình phân li tạo OH⁻ trong nước.'],
      ['th', '[Thí nghiệm HNO₃] Cho mảnh đồng (Cu) vào ống nghiệm chứa dung dịch HNO₃ loãng. Khí không màu thoát ra và hoá nâu ngay trong không khí là', ['NO (hoá nâu do tạo thành NO₂)', 'H₂ (cháy trong không khí)', 'NH₃ (mùi khai đặc trưng)', 'O₂ (làm bùng tàn đóm đỏ)'], '• Bước 1: Phương trình phản ứng: 3Cu + 8HNO₃(loãng) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O.\n• Bước 2: Khí NO không màu tiếp xúc với O₂ không khí chuyển ngay thành NO₂ màu nâu đỏ: 2NO + O₂ → 2NO₂.', 'Tính oxi hoá mạnh của HNO₃', 'Nhớ kỹ: HNO₃ loãng + Cu → NO (không màu hoá nâu); HNO₃ đặc + Cu → NO₂ (màu nâu đỏ ngay từ đầu).'],
      ['th', '[Kĩ thuật phòng thí nghiệm] Dung dịch H₂SO₄ đặc có tính háo nước mạnh nên thường dùng trong bình rửa khí để làm khô các khí ẩm. Khí nào sau đây có thể làm khô bằng H₂SO₄ đặc?', ['Khí CO₂ (hoặc O₂, Cl₂, SO₂)', 'Khí NH₃', 'Khí H₂S', 'Khí HBr'], '• Bước 1: Nguyên tắc chọn chất làm khô là chất làm khô KHÔNG phản ứng với khí cần làm khô.\n• Bước 2: NH₃ có tính base tác dụng với H₂SO₄; H₂S và HBr có tính khử mạnh bị H₂SO₄ đặc oxi hoá. Chỉ có CO₂ không phản ứng.', 'Tính chất của H₂SO₄ đặc', 'Bẫy thường gặp: Không bao giờ dùng H₂SO₄ đặc làm khô NH₃, H₂S, HI, HBr; và không dùng CaO/NaOH rắn làm khô CO₂, SO₂, Cl₂.'],
      ['th', '[Thí nghiệm than hoá] Nhỏ vài giọt dung dịch H₂SO₄ đặc vào cốc thuỷ tinh đựng đường ăn (saccharose, C₁₂H₂₂O₁₁). Hiện tượng quan sát được là', ['đường chuyển sang màu vàng rồi hoá đen, cột than xốp phồng lên kèm khí thoát ra', 'đường tan nhanh tạo thành dung dịch trong suốt không màu', 'xuất hiện kết tủa trắng không tan dưới đáy cốc', 'có khí màu vàng lục thoát ra làm xanh giấy quỳ ẩm'], '• Bước 1 (Tính háo nước): H₂SO₄ đặc chiếm nước của carbohydrate: C₁₂H₂₂O₁₁ → 12C (màu đen) + 11H₂O.\n• Bước 2 (Tính oxi hoá): Một phần C sinh ra bị H₂SO₄ đặc nóng oxi hoá tiếp: C + 2H₂SO₄(đặc) → CO₂↑ + 2SO₂↑ + 2H₂O làm khối than xốp trào lên.', 'Tính háo nước & oxi hoá của H₂SO₄ đặc', 'Câu hỏi thực hành này rất hay hỏi "vai trò của H₂SO₄ đặc": vừa thể hiện tính háo nước, vừa thể hiện tính oxi hoá mạnh.'],
      ['vd', '[Nhận biết dung dịch] Chỉ dùng thêm MỘT thuốc thử duy nhất nào sau đây để phân biệt được 3 dung dịch mất nhãn: NH₄Cl, (NH₄)₂SO₄ và Na₂SO₄?', ['Dung dịch Ba(OH)₂ đun nhẹ', 'Dung dịch NaOH đun nhẹ', 'Dung dịch BaCl₂', 'Giấy quỳ tím'], '• Bước 1: Cho dung dịch Ba(OH)₂ vào 3 mẫu thử và đun nhẹ:\n  - Mẫu NH₄Cl: Chỉ có khí mùi khai thoát ra (NH₄⁺ + OH⁻ → NH₃↑ + H₂O).\n  - Mẫu (NH₄)₂SO₄: Vừa có khí mùi khai NH₃↑, vừa có kết tủa trắng BaSO₄↓.\n  - Mẫu Na₂SO₄: Chỉ xuất hiện kết tủa trắng BaSO₄↓, không có khí.', 'Nhận biết muối ammonium & sulfate', 'Mẹo nhận biết: Khi dãy chất có cả ion NH₄⁺ và SO₄²⁻, thuốc thử "vạn năng" luôn là dung dịch Ba(OH)₂!'],
      ['vd', '[Bài toán công nghiệp Contact] Đốt cháy hoàn toàn 3,2 gam sulfur (S) trong khí O₂ dư, toàn bộ lượng khí SO₂ thu được dẫn vào bình đo ở điều kiện chuẩn (25 °C, 1 bar). Thể tích khí SO₂ thu được là', ['2,479 L', '4,958 L', '1,2395 L', '2,240 L'], '• Bước 1: Tính số mol S: n(S) = 3,2 / 32 = 0,1 mol.\n• Bước 2: Bảo toàn nguyên tố S cho phản ứng S + O₂ → SO₂: n(SO₂) = n(S) = 0,1 mol.\n• Bước 3: Thể tích ở đkc (25 °C, 1 bar): V = 0,1 × 24,79 = 2,479 L.', 'Bảo toàn nguyên tố & Thể tích đkc', 'Chú ý chương trình GDPT 2018: Thể tích 1 mol khí ở đkc (25 °C, 1 bar) là 24,79 L (không dùng 22,4 L của đktc cũ).'],
    ],
  },

  'c11-organic-gen': {
    points: [
      'Hợp chất hữu cơ là hợp chất của carbon (trừ CO, CO₂, muối carbonate, cyanide, carbide…).',
      'Đồng đẳng: hơn kém nhau một hay nhiều nhóm CH₂, tính chất tương tự.',
      'Đồng phân: cùng công thức phân tử, khác công thức cấu tạo.',
      'Tách – tinh chế: chưng cất, chiết, kết tinh, sắc kí cột.',
      'Phổ IR xác định nhóm chức; phổ MS xác định phân tử khối.',
    ],
    mistakes: [
      'Đếm trùng đồng phân do vẽ cùng một mạch theo hai hướng.',
      'Quên đồng phân ether khi đếm đồng phân CₙH₂ₙ₊₂O.',
    ],
    qs: [
      ['nb', 'Hợp chất hữu cơ là hợp chất của', ['carbon (trừ CO, CO₂, muối carbonate, cyanide, carbide…)', 'hydrogen', 'oxygen', 'nitrogen'], 'Định nghĩa hợp chất hữu cơ.'],
      ['nb', 'Đồng phân là những chất có', ['cùng công thức phân tử nhưng khác công thức cấu tạo', 'cùng công thức cấu tạo', 'cùng phân tử khối nhưng khác công thức phân tử', 'cùng tính chất hoá học'], 'Định nghĩa đồng phân cấu tạo.'],
      ['nb', 'Phương pháp tách các chất lỏng có nhiệt độ sôi khác nhau nhiều là', ['chưng cất', 'kết tinh', 'lọc', 'chiết'], 'Chất có nhiệt độ sôi thấp bay hơi trước, ngưng tụ lại riêng.'],
      ['th', 'Phổ hồng ngoại (IR) thường được dùng để', ['xác định nhóm chức trong phân tử', 'xác định phân tử khối', 'đo nhiệt độ sôi', 'tách các chất'], 'Mỗi nhóm chức hấp thụ ở vùng số sóng đặc trưng.'],
      ['th', 'Các chất đồng đẳng là những chất', ['hơn kém nhau một hay nhiều nhóm CH₂ và có tính chất tương tự', 'có cùng công thức phân tử', 'có cùng phân tử khối', 'có nhóm chức khác nhau'], 'Ví dụ CH₄, C₂H₆, C₃H₈ là dãy đồng đẳng alkane.'],
      ['th', 'Số đồng phân cấu tạo của C₄H₁₀ là', ['2', '3', '4', '1'], 'Butane (mạch thẳng) và 2-methylpropane (mạch nhánh).'],
      ['vd', 'Chất X chứa 40% C; 6,67% H; còn lại là O (theo khối lượng); M(X) = 60. Công thức phân tử của X là', ['C₂H₄O₂', 'CH₂O', 'C₃H₈O', 'C₂H₆O'], 'C : H : O = 40/12 : 6,67/1 : 53,33/16 = 1 : 2 : 1 → (CH₂O)ₙ; 30n = 60 → n = 2.'],
      ['vd', 'Số đồng phân cấu tạo ứng với công thức C₃H₈O là', ['3', '2', '4', '1'], 'Propan-1-ol, propan-2-ol và ethyl methyl ether.'],
    ],
  },

  'c11-hydrocarbon': {
    points: [
      'Alkane CₙH₂ₙ₊₂: phản ứng thế (halogen hoá), cracking, cháy.',
      'Alkene CₙH₂ₙ, alkyne CₙH₂ₙ₋₂: phản ứng cộng (H₂, Br₂, HX, H₂O), trùng hợp, làm mất màu nước bromine.',
      'Quy tắc Markovnikov: H cộng vào C có nhiều H hơn.',
      'Alkyne có liên kết ba đầu mạch tạo kết tủa vàng với AgNO₃/NH₃.',
      'Arene: thế vào vòng (xúc tác Fe/acid), thế ở nhánh alkyl khi chiếu sáng.',
    ],
    mistakes: [
      'Áp dụng sai quy tắc Markovnikov (đặt X vào C bậc thấp).',
      'Cho rằng benzene làm mất màu nước bromine ở điều kiện thường.',
    ],
    qs: [
      ['nb', 'Công thức chung của alkane là', ['CₙH₂ₙ₊₂ (n ≥ 1)', 'CₙH₂ₙ (n ≥ 2)', 'CₙH₂ₙ₋₂ (n ≥ 2)', 'CₙH₂ₙ₋₆ (n ≥ 6)'], 'Alkane là hydrocarbon no, mạch hở.'],
      ['nb', 'Phản ứng đặc trưng của alkane là phản ứng', ['thế (halogen hoá)', 'cộng', 'trùng hợp', 'cộng nước'], 'Alkane chỉ có liên kết σ bền nên tham gia phản ứng thế.'],
      ['nb', 'Chất làm mất màu nước bromine ở điều kiện thường là', ['ethylene (C₂H₄)', 'methane', 'benzene', 'ethane'], 'Liên kết π trong C=C cộng Br₂: C₂H₄ + Br₂ → C₂H₄Br₂.'],
      ['th', 'Cho ethylene tác dụng với HBr, sản phẩm thu được là', ['CH₃CH₂Br', 'CH₂BrCH₂Br', 'CH₃CHBr₂', 'CH₂=CHBr'], 'Cộng HBr vào liên kết đôi: CH₂=CH₂ + HBr → CH₃–CH₂Br.'],
      ['th', 'Propene tác dụng với HBr, sản phẩm chính theo quy tắc Markovnikov là', ['CH₃CHBrCH₃ (2-bromopropane)', 'CH₃CH₂CH₂Br', 'CH₂BrCHBrCH₃', 'CH₂=CBrCH₃'], 'H cộng vào C đầu mạch (nhiều H hơn), Br vào C bậc II.'],
      ['th', 'Thuốc thử dùng để phân biệt but-1-yne và but-2-yne là', ['dung dịch AgNO₃/NH₃', 'nước bromine', 'dung dịch KMnO₄', 'quỳ tím'], 'But-1-yne có H ở C mang liên kết ba đầu mạch → kết tủa vàng; but-2-yne thì không.'],
      ['vd', 'Đốt cháy hoàn toàn 0,1 mol một alkane thu được 0,3 mol CO₂. Công thức phân tử của alkane là', ['C₃H₈', 'C₂H₆', 'C₄H₁₀', 'C₃H₆'], 'Số C = 0,3 / 0,1 = 3 → C₃H₈ (alkane).'],
      ['vd', 'Cho toluene tác dụng với Cl₂ (tỉ lệ 1 : 1) khi chiếu sáng, sản phẩm chính là', ['C₆H₅CH₂Cl', 'o-ClC₆H₄CH₃', 'C₆H₅Cl', 'p-ClC₆H₄CH₃'], 'Chiếu sáng → thế H ở nhánh methyl (cơ chế gốc); có Fe xúc tác mới thế vào vòng.'],
    ],
  },

  'c11-alcohol': {
    points: [
      'Alcohol no, đơn chức, mạch hở: CₙH₂ₙ₊₁OH; tên thay thế đuôi "-ol".',
      'Alcohol + Na → alkoxide + H₂; n(H₂) = ½ n(OH).',
      'Oxi hoá bằng CuO: bậc I → aldehyde, bậc II → ketone, bậc III không phản ứng.',
      'Alcohol đa chức có nhóm OH kề nhau hoà tan Cu(OH)₂ tạo dung dịch xanh lam.',
      'Phenol có tính acid rất yếu (không đổi màu quỳ), tạo kết tủa trắng với nước bromine.',
    ],
    mistakes: [
      'Cho rằng phenol làm quỳ tím hoá đỏ.',
      'Quên n(H₂) = ½ n(OH) khi tính thể tích khí.',
    ],
    qs: [
      ['nb', 'Công thức chung của alcohol no, đơn chức, mạch hở là', ['CₙH₂ₙ₊₁OH', 'CₙH₂ₙOH', 'CₙH₂ₙ₋₁OH', 'CₙH₂ₙ(OH)₂'], 'Gốc alkyl CₙH₂ₙ₊₁ gắn với một nhóm OH.'],
      ['nb', 'Tên theo danh pháp thay thế của CH₃CH₂OH là', ['ethanol', 'methanol', 'propan-1-ol', 'ethanal'], 'Mạch 2 C (eth-) + đuôi -ol.'],
      ['nb', 'Phenol tác dụng với nước bromine tạo ra', ['kết tủa trắng', 'dung dịch màu xanh lam', 'khí không màu', 'kết tủa vàng'], 'C₆H₅OH + 3Br₂ → C₆H₂Br₃OH↓ (2,4,6-tribromophenol, trắng) + 3HBr.'],
      ['th', 'Glycerol hoà tan Cu(OH)₂ ở nhiệt độ thường tạo thành', ['dung dịch màu xanh lam', 'kết tủa đỏ gạch', 'dung dịch màu tím', 'khí không màu'], 'Alcohol có từ 2 nhóm OH kề nhau tạo phức tan màu xanh lam với Cu(OH)₂.'],
      ['th', 'Phenol có tính acid (yếu) là do', ['ảnh hưởng của vòng benzene làm liên kết O–H phân cực mạnh hơn', 'phenol tan nhiều trong nước', 'phân tử có vòng benzene', 'phenol làm quỳ tím hoá đỏ'], 'Vòng benzene hút electron của O; tính acid rất yếu nên không làm đổi màu quỳ.'],
      ['th', 'Đun ethanol với H₂SO₄ đặc ở 170 °C thu được sản phẩm hữu cơ chính là', ['ethylene', 'diethyl ether', 'acetaldehyde', 'ethane'], 'Phản ứng tách nước nội phân tử: C₂H₅OH → CH₂=CH₂ + H₂O.'],
      ['vd', 'Oxi hoá propan-2-ol bằng CuO, đun nóng, thu được', ['acetone (propanone)', 'propanal', 'propanoic acid', 'propene'], 'Alcohol bậc II bị oxi hoá thành ketone: CH₃CH(OH)CH₃ → CH₃COCH₃.'],
      ['vd', 'Cho 4,6 g ethanol tác dụng với Na dư. Thể tích H₂ thu được ở đkc là', ['1,2395 L', '2,479 L', '0,6198 L', '1,12 L'], 'n(C₂H₅OH) = 0,1 mol → n(H₂) = 0,05 mol → V = 0,05 × 24,79 = 1,2395 L.'],
    ],
  },

  'c11-carbonyl': {
    points: [
      'Aldehyde có nhóm –CHO; ketone có nhóm >C=O nằm giữa hai gốc carbon.',
      'Aldehyde có tính khử (tráng bạc với Tollens, tạo Cu₂O đỏ gạch với Cu(OH)₂/OH⁻, t°).',
      'Khử aldehyde → alcohol bậc I; khử ketone → alcohol bậc II (NaBH₄, LiAlH₄).',
      'Carboxylic acid có tính acid: tác dụng kim loại hoạt động, base, oxide base, muối carbonate.',
      'Nhiệt độ sôi: acid > alcohol > aldehyde (cùng số C) do liên kết hydrogen.',
    ],
    mistakes: [
      'Nghĩ acetic acid tác dụng được với Cu.',
      'Nhầm ketone cũng tráng bạc.',
    ],
    qs: [
      ['nb', 'Nhóm chức của aldehyde là', ['–CHO', '–COOH', '–OH', '>C=O (nằm giữa hai gốc carbon)'], '>C=O giữa hai gốc carbon là nhóm chức ketone.'],
      ['nb', 'Công thức của acetic acid là', ['CH₃COOH', 'HCOOH', 'CH₃CHO', 'C₂H₅OH'], 'Acetic acid (ethanoic acid) là thành phần chính của giấm ăn.'],
      ['nb', 'Thuốc thử Tollens được dùng để nhận biết', ['aldehyde', 'ketone', 'alcohol', 'alkane'], 'Aldehyde khử [Ag(NH₃)₂]⁺ thành Ag tạo lớp bạc sáng.'],
      ['th', 'Khử CH₃CHO bằng NaBH₄ thu được', ['ethanol', 'acetic acid', 'ethane', 'ethylene'], 'Aldehyde bị khử thành alcohol bậc I.'],
      ['th', 'Dãy các chất sắp xếp theo chiều giảm dần nhiệt độ sôi là', ['CH₃COOH > C₂H₅OH > CH₃CHO', 'CH₃CHO > C₂H₅OH > CH₃COOH', 'C₂H₅OH > CH₃COOH > CH₃CHO', 'CH₃COOH > CH₃CHO > C₂H₅OH'], 'Acid tạo liên kết hydrogen bền nhất (dạng dimer); aldehyde không có liên kết hydrogen liên phân tử.'],
      ['th', 'Acetic acid KHÔNG tác dụng với chất nào sau đây?', ['Cu', 'NaOH', 'CaCO₃', 'Mg'], 'Cu đứng sau H trong dãy hoạt động nên không đẩy được H⁺ của acid.'],
      ['vd', 'Thể tích dung dịch NaOH 1 M cần để trung hoà vừa đủ 6 g CH₃COOH là', ['100 mL', '50 mL', '200 mL', '60 mL'], 'n(CH₃COOH) = 6 / 60 = 0,1 mol = n(NaOH) → V = 0,1 L = 100 mL.'],
      ['vd', 'Chất nào sau đây cho kết tủa vàng khi tác dụng với I₂ trong NaOH (phản ứng iodoform)?', ['CH₃COCH₃', 'HCHO', 'CH₃CH₂CH₂CHO', 'C₆H₅CHO'], 'Phản ứng iodoform đặc trưng cho hợp chất có nhóm CH₃CO– → CHI₃ kết tủa vàng.'],
    ],
  },

  /* ======================= LỚP 12 ======================= */
  'c12-ester': {
    points: [
      'Ester đơn chức RCOOR\' tạo từ carboxylic acid + alcohol (xúc tác H₂SO₄ đặc, đun nóng), là phản ứng thuận nghịch.',
      'Danh pháp thay thế: Tên gốc R\' (alkyl) + tên gốc acid RCOO– (đuôi -ate). Ví dụ: CH₃COOC₂H₅ là ethyl acetate.',
      'Thuỷ phân trong môi trường acid (H⁺, t°): phản ứng thuận nghịch; thuỷ phân trong kiềm (NaOH/KOH, t° — xà phòng hoá): phản ứng một chiều.',
      'Chất béo (triglyceride) là triester của glycerol C₃H₅(OH)₃ với các acid béo mạch dài không phân nhánh; hydrogen hoá chất béo lỏng (dầu) tạo chất béo rắn (bơ nhân tạo).',
    ],
    mistakes: [
      'Đọc ngược tên ester (nhầm giữa ethyl acetate CH₃COOC₂H₅ và methyl propionate C₂H₅COOCH₃).',
      'Ngộ nhận phản ứng xà phòng hoá (thuỷ phân trong kiềm) là phản ứng thuận nghịch.',
    ],
    qs: [
      ['nb', '[THPTQG 2025] Trong phòng thí nghiệm, ester đơn chức thường được điều chế trực tiếp bằng phản ứng đun nóng hỗn hợp gồm', ['carboxylic acid và alcohol có mặt H₂SO₄ đặc làm xúc tác', 'carboxylic acid và dung dịch base mạnh NaOH', 'alcohol và aldehyde có mặt xúc tác Ni', 'hai alcohol đơn chức khác nhau ở 140 °C'], '• Bước 1: Phản ứng ester hoá xảy ra giữa carboxylic acid (RCOOH) và alcohol (R\'OH) với xúc tác H₂SO₄ đặc, đun nóng.\n• Bước 2: Phương trình tổng quát: RCOOH + R\'OH ⇌ RCOOR\' + H₂O (H₂SO₄ đặc vừa là xúc tác vừa hút nước làm chuyển dịch cân bằng).', 'Phản ứng điều chế Ester', 'Nhớ vai trò kép của H₂SO₄ đặc trong điều chế ester: vừa là chất xúc tác, vừa hút nước để tăng hiệu suất.'],
      ['nb', '[Danh pháp IUPAC] Hợp chất ester có mùi thơm của hoa quả chín với công thức cấu tạo CH₃COOC₂H₅ có tên gọi là', ['ethyl acetate', 'methyl propionate', 'ethyl formate', 'propyl acetate'], '• Bước 1: Tách phần gốc alcohol R\' là –C₂H₅ (ethyl).\n• Bước 2: Tách phần gốc acid RCOO– là CH₃COO– (acetate) ⇒ ghép tên: ethyl acetate.', 'Danh pháp Ester', 'Quy tắc "Đuôi đọc trước – Đầu đọc sau": Đọc gốc gắn với nguyên tử O đơn (R\') trước, rồi mới đọc gốc RCOO–.'],
      ['nb', '[Cấu tạo Lipid] Về mặt cấu tạo hoá học, chất béo (thành phần chính của dầu thực vật và mỡ động vật) là', ['triester của glycerol với các acid béo', 'ester đơn chức của ethanol với acid béo', 'một loại polymer thiên nhiên mạch phân nhánh', 'muối sodium hoặc potassium của acid béo'], '• Bước 1: Chất béo (triglyceride) tạo bởi alcohol 3 chức glycerol C₃H₅(OH)₃ và 3 gốc acid béo (như stearic, palmitic, oleic, linoleic acid).\n• Bước 2: Phân biệt rõ: Muối sodium/potassium của acid béo là xà phòng, không phải chất béo.', 'Cấu tạo Chất béo & Xà phòng', 'Bẫy khái niệm: "Chất béo" là triester của glycerol; còn "Xà phòng" là muối Na⁺/K⁺ của acid béo.'],
      ['th', '[Bản chất phản ứng] Đun nóng ester CH₃COOC₂H₅ với dung dịch NaOH dư. Quá trình này được gọi là', ['phản ứng xà phòng hoá (thuỷ phân một chiều trong môi trường kiềm)', 'phản ứng ester hoá thuận nghịch', 'phản ứng trùng ngưng tạo polymer', 'phản ứng hydrogen hoá xúc tác Ni'], '• Bước 1: Phương trình: CH₃COOC₂H₅ + NaOH (t°) → CH₃COONa + C₂H₅OH.\n• Bước 2: Phản ứng thuỷ phân ester trong môi trường kiềm là phản ứng một chiều và được gọi là phản ứng xà phòng hoá.', 'Phản ứng xà phòng hoá', 'Phân biệt mũi tên: Thuỷ phân trong acid dùng mũi tên hai chiều (⇌); thuỷ phân trong kiềm (NaOH/KOH) dùng mũi tên một chiều (→).'],
      ['th', '[Thuỷ phân Triglyceride] Đun nóng hoàn toàn chất béo tristearin [(C₁₇H₃₅COO)₃C₃H₅] trong dung dịch NaOH dư, sản phẩm thu được gồm', ['sodium stearate (C₁₇H₃₅COONa) và glycerol', 'stearic acid (C₁₇H₃₅COOH) và glycerol', 'sodium stearate và ethanol', 'sodium oleate và ethylene glycol'], '• Bước 1: Tristearin là triester của stearic acid (C₁₇H₃₅COOH) và glycerol.\n• Bước 2: Khi thuỷ phân trong NaOH: (C₁₇H₃₅COO)₃C₃H₅ + 3NaOH → 3C₁₇H₃₅COONa (sodium stearate) + C₃H₅(OH)₃ (glycerol).', 'Thuỷ phân chất béo', 'Chú ý môi trường: Thuỷ phân trong NaOH thu được MUỐI (sodium stearate), còn thuỷ phân trong H₂SO₄ loãng mới thu được ACID BÉO.'],
      ['th', '[Đồng phân cấu tạo] Cho hợp chất hữu cơ đơn chức mạch hở ứng với công thức phân tử C₃H₆O₂. Số đồng phân cấu tạo thuộc loại ester của C₃H₆O₂ là', ['2', '3', '1', '4'], '• Bước 1: Công thức tổng quát của ester no, đơn chức, mạch hở là RCOOR\' (với R\' ≥ 1C).\n• Bước 2: Với 3 nguyên tử C, ta viết được 2 đồng phân ester: HCOOC₂H₅ (ethyl formate) và CH₃COOCH₃ (methyl acetate). (Đồng phân CH₃CH₂COOH là carboxylic acid, không phải ester).', 'Đếm đồng phân Ester', 'Công thức tính nhanh số đồng phân ester no, đơn chức, mạch hở CₙH₂ₙO₂ (với 2 ≤ n ≤ 4) là 2^(n−2). Với n = 3 ⇒ 2¹ = 2 đồng phân.'],
      ['vd', '[Bài toán xà phòng hoá] Xà phòng hoá hoàn toàn 8,8 gam ethyl acetate (CH₃COOC₂H₅) bằng một lượng dung dịch NaOH vừa đủ. Cô cạn dung dịch sau phản ứng thu được bao nhiêu gam muối khan?', ['8,2 g', '6,8 g', '9,6 g', '4,6 g'], '• Bước 1: Tính số mol ethyl acetate (M = 88): n(CH₃COOC₂H₅) = 8,8 / 88 = 0,1 mol.\n• Bước 2: Phương trình: CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH.\n• Bước 3: n(CH₃COONa) = 0,1 mol ⇒ m(muối) = 0,1 × 82 = 8,2 gam.', 'Tính khối lượng muối xà phòng hoá', 'Nhớ nhanh phân tử khối gốc: –COONa = 67; CH₃COONa = 82; HCOONa = 68; C₂H₅OH = 46.'],
      ['vd', '[Công nghiệp thực phẩm] Để chuyển hoá dầu thực vật (chất béo lỏng chứa nhiều gốc acid béo không no) thành bơ thực vật (chất béo rắn, dễ bảo quản và vận chuyển), người ta thực hiện phản ứng', ['hydrogen hoá (cộng H₂ có xúc tác Ni, đun nóng)', 'xà phòng hoá bằng dung dịch KOH đặc', 'thuỷ phân trong môi trường acid H₂SO₄ loãng', 'oxi hoá chậm bằng khí O₂ không khí'], '• Bước 1: Dầu thực vật ở thể lỏng vì chứa các gốc acid béo không no (có liên kết đôi C=C như oleic, linoleic).\n• Bước 2: Khi cộng H₂ (Ni, t°), liên kết đôi C=C chuyển thành liên kết đơn C–C (gốc acid béo no), làm tăng nhiệt độ nóng chảy nên chuyển sang trạng thái rắn.', 'Hydrogen hoá chất béo', 'Liên hệ thực tế: Hydrogen hoá một phần dầu thực vật có thể sinh ra chất béo đồng phân trans (trans-fat) không tốt cho tim mạch.'],
    ],
  },

  'c12-carbohydrate': {
    points: [
      'Monosaccharide: glucose, fructose (C₆H₁₂O₆) · Disaccharide: saccharose, maltose (C₁₂H₂₂O₁₁) · Polysaccharide: tinh bột, cellulose.',
      'Glucose có nhiều OH kề nhau (hoà tan Cu(OH)₂) và nhóm –CHO (tráng bạc, làm mất màu nước bromine).',
      'Fructose tráng bạc được (chuyển thành glucose trong môi trường kiềm) nhưng không làm mất màu nước bromine.',
      'Saccharose không có tính khử; tinh bột tạo màu xanh tím với iodine.',
      'Lên men: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂; tráng bạc: 1 glucose → 2Ag.',
    ],
    mistakes: [
      'Cho rằng fructose không tráng bạc.',
      'Quên tỉ lệ 1 glucose → 2 Ag hoặc → 2 C₂H₅OH.',
    ],
    qs: [
      ['nb', 'Công thức phân tử của glucose là', ['C₆H₁₂O₆', 'C₁₂H₂₂O₁₁', '(C₆H₁₀O₅)ₙ', 'C₆H₁₀O₅'], 'Glucose và fructose là đồng phân, cùng C₆H₁₂O₆.'],
      ['nb', 'Saccharose thuộc loại', ['disaccharide', 'monosaccharide', 'polysaccharide', 'protein'], 'Saccharose gồm một gốc glucose và một gốc fructose.'],
      ['nb', 'Tinh bột cho màu xanh tím khi tác dụng với', ['iodine', 'Cu(OH)₂', 'AgNO₃/NH₃', 'nước bromine'], 'Phản ứng màu đặc trưng của tinh bột.'],
      ['th', 'Chất nào sau đây KHÔNG tham gia phản ứng tráng bạc?', ['Saccharose', 'Glucose', 'Fructose', 'Maltose'], 'Saccharose không có nhóm –CHO tự do (không mở vòng được).'],
      ['th', 'Thuốc thử dùng để phân biệt glucose và fructose là', ['nước bromine', 'Cu(OH)₂', 'AgNO₃/NH₃', 'quỳ tím'], 'Chỉ glucose (có –CHO) làm mất màu nước bromine; cả hai đều tráng bạc và hoà tan Cu(OH)₂.'],
      ['th', 'Thuỷ phân hoàn toàn tinh bột thu được', ['glucose', 'fructose', 'saccharose', 'glucose và fructose'], 'Tinh bột cấu tạo từ các gốc α-glucose.'],
      ['vd', 'Lên men 18 g glucose với hiệu suất 100%. Khối lượng ethanol thu được là', ['9,2 g', '4,6 g', '18,4 g', '8,8 g'], 'n(glucose) = 0,1 mol → n(C₂H₅OH) = 0,2 mol → 0,2 × 46 = 9,2 g.'],
      ['vd', 'Thực hiện phản ứng tráng bạc hoàn toàn 9 g glucose. Khối lượng Ag thu được là', ['10,8 g', '5,4 g', '21,6 g', '16,2 g'], 'n(glucose) = 0,05 mol → n(Ag) = 0,1 mol → 10,8 g.'],
    ],
  },

  'c12-amine': {
    points: [
      'Bậc amine = số gốc hydrocarbon gắn với N.',
      'Tính base: amine no bậc II > bậc I > NH₃ > aniline.',
      'Aniline tạo kết tủa trắng với nước bromine.',
      'Amino acid lưỡng tính (–NH₂ và –COOH); peptide liên kết qua nhóm –CO–NH–.',
      'Protein (từ tripeptide trở lên) có phản ứng màu biuret (màu tím) với Cu(OH)₂.',
    ],
    mistakes: [
      'Nhầm bậc amine với bậc alcohol (bậc amine tính theo số gốc gắn vào N).',
      'Cho rằng aniline làm quỳ tím hoá xanh.',
    ],
    qs: [
      ['nb', 'Chất nào sau đây là amine bậc I?', ['CH₃NH₂', '(CH₃)₂NH', '(CH₃)₃N', 'CH₃NHC₂H₅'], 'N chỉ liên kết với một gốc hydrocarbon.'],
      ['nb', 'Phân tử amino acid chứa đồng thời nhóm', ['–NH₂ và –COOH', '–OH và –COOH', '–NH₂ và –OH', '–CHO và –NH₂'], 'Do đó amino acid có tính lưỡng tính.'],
      ['nb', 'Liên kết peptide là liên kết –CO–NH– giữa hai đơn vị', ['α-amino acid', 'amine', 'carboxylic acid và alcohol', 'glucose'], 'Định nghĩa liên kết peptide.'],
      ['th', 'Aniline tác dụng với nước bromine tạo thành', ['kết tủa trắng', 'dung dịch màu xanh', 'khí không màu', 'kết tủa vàng'], 'C₆H₅NH₂ + 3Br₂ → C₆H₂Br₃NH₂↓ (2,4,6-tribromoaniline) + 3HBr.'],
      ['th', 'Dãy sắp xếp theo chiều giảm dần tính base là', ['(CH₃)₂NH > CH₃NH₂ > NH₃ > C₆H₅NH₂', 'C₆H₅NH₂ > NH₃ > CH₃NH₂ > (CH₃)₂NH', 'NH₃ > CH₃NH₂ > (CH₃)₂NH > C₆H₅NH₂', 'CH₃NH₂ > C₆H₅NH₂ > NH₃ > (CH₃)₂NH'], 'Gốc alkyl đẩy electron làm tăng tính base; gốc phenyl hút electron làm giảm.'],
      ['th', 'Protein có phản ứng màu biuret với Cu(OH)₂ trong môi trường kiềm, tạo màu', ['tím', 'xanh lam', 'đỏ gạch', 'vàng'], 'Phản ứng màu biuret đặc trưng cho peptide có từ 2 liên kết peptide trở lên.'],
      ['vd', 'Số dipeptide tối đa có thể tạo thành từ glycine và alanine là', ['4', '2', '3', '1'], 'Gly-Gly, Ala-Ala, Gly-Ala, Ala-Gly.'],
      ['vd', 'Cho 9,3 g aniline tác dụng vừa đủ với HCl. Khối lượng muối thu được là', ['12,95 g', '9,3 g', '13,0 g', '16,6 g'], 'n = 9,3 / 93 = 0,1 mol → C₆H₅NH₃Cl: 0,1 × 129,5 = 12,95 g.'],
    ],
  },

  'c12-polymer': {
    points: [
      'Polymer: phân tử khối rất lớn, gồm nhiều mắt xích; hệ số polymer hoá n = M(polymer) / M(mắt xích).',
      'Trùng hợp: monomer có liên kết bội hoặc vòng kém bền (PE, PVC, PS, caprolactam → nylon-6).',
      'Trùng ngưng: monomer có ≥ 2 nhóm chức phản ứng được, giải phóng phân tử nhỏ (nylon-6,6, PET).',
      'Tơ thiên nhiên (tơ tằm, bông) · bán tổng hợp (visco, cellulose acetate) · tổng hợp (nylon, olon).',
      'Nhựa nhiệt dẻo tái chế được bằng nung chảy; cao su lưu hoá có cầu –S–S– bền hơn.',
    ],
    mistakes: [
      'Nhầm nylon-6,6 điều chế bằng trùng hợp.',
      'Xếp tơ visco vào tơ tổng hợp.',
    ],
    qs: [
      ['nb', 'Polymer là', ['hợp chất có phân tử khối rất lớn do nhiều mắt xích liên kết với nhau', 'hỗn hợp của nhiều chất', 'một loại hợp chất vô cơ', 'chất có nhiệt độ sôi xác định'], 'Định nghĩa polymer.'],
      ['nb', 'Polyethylene (PE) được điều chế từ monomer', ['ethylene', 'vinyl chloride', 'styrene', 'propylene'], 'nCH₂=CH₂ → (–CH₂–CH₂–)ₙ.'],
      ['nb', 'Tơ tằm thuộc loại', ['tơ thiên nhiên', 'tơ tổng hợp', 'tơ bán tổng hợp', 'tơ vô cơ'], 'Tơ tằm có sẵn trong tự nhiên (bản chất protein).'],
      ['th', 'Điều kiện để một monomer tham gia phản ứng trùng hợp là phân tử phải có', ['liên kết bội hoặc vòng kém bền', 'hai nhóm chức khác nhau', 'nhóm –OH', 'vòng benzene'], 'Liên kết π hoặc vòng kém bền mở ra để nối các mắt xích.'],
      ['th', 'Nylon-6,6 được điều chế bằng phản ứng', ['trùng ngưng hexamethylenediamine với adipic acid', 'trùng hợp caprolactam', 'trùng hợp vinyl chloride', 'trùng ngưng glucose'], 'H₂N(CH₂)₆NH₂ + HOOC(CH₂)₄COOH → nylon-6,6 + H₂O.'],
      ['th', 'So với cao su thường, cao su lưu hoá', ['đàn hồi, bền nhiệt và khó tan hơn', 'mềm và dễ tan hơn', 'kém bền cơ học hơn', 'dẫn điện tốt hơn'], 'Các cầu disulfide –S–S– nối các mạch tạo mạng không gian.'],
      ['vd', 'PVC có phân tử khối trung bình 125 000. Hệ số polymer hoá trung bình là', ['2000', '1250', '4000', '2500'], 'Mắt xích –CH₂–CHCl– có M = 62,5 → n = 125 000 / 62,5 = 2000.'],
      ['vd', 'Loại vật liệu có thể tái chế bằng cách nung chảy rồi đúc lại là', ['nhựa nhiệt dẻo (PE, PP, PVC)', 'nhựa nhiệt rắn', 'cao su lưu hoá', 'polymer mạng không gian'], 'Polymer mạch thẳng/nhánh nóng chảy được; polymer mạng không gian bị phân huỷ khi đun.'],
    ],
  },

  'c12-electro': {
    points: [
      'Pin Galvani: anode (cực âm) xảy ra oxi hoá; cathode (cực dương) xảy ra khử.',
      'E°pin = E°(cathode) − E°(anode); quy ước E°(2H⁺/H₂) = 0,00 V.',
      'Quy tắc α: chất oxi hoá mạnh + chất khử mạnh → chất oxi hoá yếu + chất khử yếu.',
      'Điện phân: cathode – sự khử; anode – sự oxi hoá (ngược dấu so với pin).',
      'Định luật Faraday: m = A·I·t / (n·F), F = 96 500 C/mol.',
    ],
    mistakes: [
      'Gán anode là cực dương trong pin điện hoá.',
      'Quên chia cho số electron trao đổi n trong công thức Faraday.',
    ],
    qs: [
      ['nb', 'Trong pin Galvani Zn – Cu, cực âm (anode) là', ['điện cực Zn', 'điện cực Cu', 'cầu muối', 'dung dịch CuSO₄'], 'Zn có tính khử mạnh hơn, bị oxi hoá: Zn → Zn²⁺ + 2e.'],
      ['nb', 'Thế điện cực chuẩn của cặp 2H⁺/H₂ được quy ước bằng', ['0,00 V', '1,00 V', '−0,76 V', '+0,34 V'], 'Điện cực hydrogen chuẩn là mốc so sánh.'],
      ['nb', 'Trong quá trình điện phân, tại cathode xảy ra', ['sự khử', 'sự oxi hoá', 'sự hoà tan điện cực', 'sự trung hoà'], 'Cathode nối cực âm của nguồn, cation nhận electron.'],
      ['th', 'Biết E°(Zn²⁺/Zn) = −0,76 V; E°(Cu²⁺/Cu) = +0,34 V. Sức điện động chuẩn của pin Zn – Cu là', ['1,10 V', '0,42 V', '−1,10 V', '0,34 V'], 'E°pin = 0,34 − (−0,76) = 1,10 V.'],
      ['th', 'Điện phân dung dịch CuSO₄ với điện cực trơ, ở anode thu được', ['khí O₂', 'kim loại Cu', 'khí H₂', 'khí SO₂'], 'SO₄²⁻ không bị oxi hoá, nước bị oxi hoá: 2H₂O → O₂ + 4H⁺ + 4e.'],
      ['th', 'Phương pháp điện phân nóng chảy được dùng để điều chế các kim loại', ['Na, Mg, Al', 'Cu, Ag', 'Fe, Zn', 'Au, Pt'], 'Kim loại hoạt động mạnh, ion của chúng rất khó bị khử trong dung dịch.'],
      ['vd', 'Điện phân dung dịch CuSO₄ với I = 5 A trong 1930 giây. Khối lượng Cu bám vào cathode là', ['3,2 g', '6,4 g', '1,6 g', '0,32 g'], 'm = 64 × 5 × 1930 / (2 × 96 500) = 3,2 g.'],
      ['vd', 'Cặp chất nào sau đây xảy ra phản ứng?', ['Fe + dung dịch CuSO₄', 'Cu + dung dịch FeSO₄', 'Ag + dung dịch CuSO₄', 'Cu + dung dịch ZnSO₄'], 'E°(Fe²⁺/Fe) = −0,44 V < E°(Cu²⁺/Cu) = +0,34 V → Fe khử được Cu²⁺ (quy tắc α).'],
    ],
  },

  'c12-metal': {
    points: [
      'Tính chất vật lí chung (dẻo, dẫn điện, dẫn nhiệt, ánh kim) do electron tự do.',
      'Tính chất hoá học chung: tính khử (M → Mⁿ⁺ + ne).',
      'Ăn mòn điện hoá cần: 2 điện cực khác bản chất, tiếp xúc nhau, cùng trong dung dịch chất điện li.',
      'Chống ăn mòn: phủ bề mặt, dùng kim loại hoạt động hơn làm anode hi sinh (Zn cho vỏ tàu thép).',
      'Điều chế: nhiệt luyện, thuỷ luyện, điện phân.',
    ],
    mistakes: [
      'Gắn Cu (kém hoạt động hơn Fe) để bảo vệ thép — làm thép bị ăn mòn nhanh hơn.',
      'Nhầm kim loại dẫn điện tốt nhất là Cu (thực tế là Ag).',
    ],
    qs: [
      ['nb', 'Các tính chất vật lí chung của kim loại (dẻo, dẫn điện, dẫn nhiệt, ánh kim) gây ra bởi', ['các electron tự do trong mạng tinh thể', 'các ion dương kim loại', 'các neutron', 'các proton'], 'Electron tự do di chuyển trong toàn mạng tinh thể.'],
      ['nb', 'Kim loại dẫn điện tốt nhất là', ['Ag', 'Cu', 'Au', 'Al'], 'Thứ tự dẫn điện: Ag > Cu > Au > Al > Fe.'],
      ['nb', 'Kim loại có nhiệt độ nóng chảy thấp nhất là', ['Hg', 'W', 'Fe', 'Na'], 'Hg nóng chảy ở −39 °C (lỏng ở nhiệt độ thường); W cao nhất.'],
      ['th', 'Tính chất hoá học chung của kim loại là', ['tính khử', 'tính oxi hoá', 'tính acid', 'tính base'], 'Nguyên tử kim loại dễ nhường electron.'],
      ['th', 'Ăn mòn điện hoá xảy ra khi', ['hai kim loại khác nhau tiếp xúc nhau trong dung dịch chất điện li', 'kim loại phản ứng trực tiếp với O₂ khô ở nhiệt độ cao', 'kim loại nguyên chất để trong không khí khô', 'kim loại đặt trong chân không'], 'Ba điều kiện: điện cực khác bản chất, tiếp xúc, cùng nhúng trong chất điện li.'],
      ['th', 'Để bảo vệ vỏ tàu biển bằng thép, người ta gắn vào vỏ tàu các khối', ['Zn', 'Cu', 'Pb', 'Sn'], 'Zn hoạt động mạnh hơn Fe nên bị ăn mòn thay (anode hi sinh).'],
      ['vd', 'Phương pháp thuỷ luyện thích hợp để điều chế', ['Cu từ dung dịch CuSO₄ bằng Fe', 'Na từ NaCl', 'Al từ Al₂O₃', 'K từ KCl'], 'Dùng kim loại mạnh hơn khử ion kim loại yếu trong dung dịch: Fe + Cu²⁺ → Fe²⁺ + Cu.'],
      ['vd', 'Cho 2,7 g Al tác dụng với dung dịch HCl dư. Thể tích H₂ thu được ở đkc là', ['3,7185 L', '2,479 L', '7,437 L', '3,36 L'], '2Al + 6HCl → 2AlCl₃ + 3H₂; n(H₂) = 1,5 × 0,1 = 0,15 mol → 0,15 × 24,79 = 3,7185 L.'],
    ],
  },

  'c12-metal-main': {
    points: [
      'Kim loại kiềm (IA): ns¹, khử rất mạnh, bảo quản trong dầu hoả.',
      'Kim loại kiềm thổ (IIA): ns²; nước cứng chứa nhiều Ca²⁺, Mg²⁺.',
      'Nước cứng tạm thời (HCO₃⁻) làm mềm bằng đun sôi hoặc Ca(OH)₂ vừa đủ; nước cứng toàn phần dùng Na₂CO₃, Na₃PO₄.',
      'Al bền nhờ lớp Al₂O₃; Al₂O₃ và Al(OH)₃ lưỡng tính.',
      'Thạch cao nung CaSO₄·0,5H₂O dùng bó bột, đúc tượng.',
    ],
    mistakes: [
      'Dùng Ca(OH)₂ để làm mềm nước cứng vĩnh cửu.',
      'Cho rằng Al(OH)₃ chỉ có tính base.',
    ],
    qs: [
      ['nb', 'Cấu hình electron lớp ngoài cùng của kim loại kiềm là', ['ns¹', 'ns²', 'ns²np¹', 'ns²np⁵'], 'Nhóm IA có 1 electron lớp ngoài cùng.'],
      ['nb', 'Để bảo quản kim loại kiềm, người ta ngâm chúng trong', ['dầu hoả', 'nước', 'ethanol', 'dung dịch HCl'], 'Kim loại kiềm phản ứng mạnh với nước, O₂ và alcohol.'],
      ['nb', 'Nước cứng là nước chứa nhiều ion', ['Ca²⁺ và Mg²⁺', 'Na⁺ và K⁺', 'Cl⁻ và NO₃⁻', 'H⁺ và OH⁻'], 'Định nghĩa nước cứng.'],
      ['th', 'Al(OH)₃ là hydroxide', ['lưỡng tính', 'có tính base mạnh', 'có tính acid mạnh', 'trung tính'], 'Al(OH)₃ tan trong cả dung dịch acid mạnh và dung dịch kiềm mạnh.'],
      ['th', 'Chất có thể làm mềm nước có tính cứng toàn phần là', ['Na₂CO₃', 'NaCl', 'HCl', 'Ca(OH)₂'], 'CO₃²⁻ kết tủa cả Ca²⁺ và Mg²⁺; Ca(OH)₂ chỉ làm mềm nước cứng tạm thời.'],
      ['th', 'Nhôm bền trong không khí và nước ở nhiệt độ thường là do', ['có lớp oxide Al₂O₃ mỏng, bền bảo vệ', 'nhôm là kim loại hoạt động yếu', 'nhôm không có electron hoá trị', 'nhôm là phi kim'], 'Al hoạt động mạnh nhưng lớp Al₂O₃ đặc khít ngăn tiếp xúc.'],
      ['vd', 'Thạch cao nung (CaSO₄·0,5H₂O) được dùng để', ['bó bột khi gãy xương, đúc tượng', 'làm phân bón', 'sản xuất xà phòng', 'chế tạo pin'], 'Khi trộn với nước, thạch cao nung đông cứng và giãn nở nhẹ, lấp đầy khuôn.'],
      ['vd', 'Cho 2,3 g Na vào nước dư. Thể tích H₂ thu được ở đkc là', ['1,2395 L', '2,479 L', '0,6198 L', '2,24 L'], '2Na + 2H₂O → 2NaOH + H₂; n(H₂) = 0,05 mol → 1,2395 L.'],
    ],
  },

  'c12-transition': {
    points: [
      'Kim loại chuyển tiếp dãy thứ nhất (Sc → Cu) có electron điền vào phân lớp 3d.',
      'Fe: [Ar]3d⁶4s²; Fe²⁺: [Ar]3d⁶; Fe³⁺: [Ar]3d⁵ (bền hơn).',
      'Fe + HCl, H₂SO₄ loãng → muối Fe(II); Fe + HNO₃, H₂SO₄ đặc nóng, Cl₂ → Fe(III).',
      'Nhận biết: Fe³⁺ + OH⁻ → Fe(OH)₃ nâu đỏ; Fe²⁺ + OH⁻ → Fe(OH)₂ trắng xanh.',
      'Phức chất: nguyên tử trung tâm (ion kim loại) liên kết với phối tử (NH₃, H₂O, Cl⁻…).',
    ],
    mistakes: [
      'Bỏ electron 3d trước 4s khi viết cấu hình ion (phải bỏ 4s trước).',
      'Viết Fe + HCl tạo FeCl₃.',
    ],
    qs: [
      ['nb', 'Cấu hình electron của ion Fe²⁺ (Z của Fe = 26) là', ['[Ar]3d⁶', '[Ar]3d⁴4s²', '[Ar]3d⁵', '[Ar]3d⁶4s²'], 'Fe: [Ar]3d⁶4s² → bỏ 2 electron lớp ngoài cùng (4s) → [Ar]3d⁶.'],
      ['nb', 'Thành phần chính của quặng hematite là', ['Fe₂O₃', 'Fe₃O₄', 'FeCO₃', 'FeS₂'], 'Fe₃O₄: magnetite; FeCO₃: siderite; FeS₂: pyrite.'],
      ['nb', 'Gang là hợp kim của sắt với carbon, trong đó carbon chiếm khoảng', ['2 – 5% khối lượng', 'dưới 2% khối lượng', 'trên 10% khối lượng', '0%'], 'Thép chứa dưới 2% C.'],
      ['th', 'Cho Fe tác dụng với dung dịch HCl thu được', ['FeCl₂ và H₂', 'FeCl₃ và H₂', 'FeCl₂ và Cl₂', 'FeCl₃ và H₂O'], 'H⁺ chỉ oxi hoá Fe lên +2: Fe + 2HCl → FeCl₂ + H₂.'],
      ['th', 'Thuốc thử dùng để nhận biết ion Fe³⁺ (tạo kết tủa nâu đỏ) là', ['dung dịch NaOH', 'dung dịch HCl', 'dung dịch NaCl', 'dung dịch KNO₃'], 'Fe³⁺ + 3OH⁻ → Fe(OH)₃↓ nâu đỏ.'],
      ['th', 'Trong phức chất [Cu(NH₃)₄]²⁺, nguyên tử trung tâm và phối tử lần lượt là', ['Cu²⁺ và NH₃', 'NH₃ và Cu²⁺', 'N và H', 'Cu và H'], 'Ion Cu²⁺ nhận cặp electron chưa liên kết từ N của 4 phân tử NH₃.'],
      ['vd', 'Khi chuẩn độ Fe²⁺ bằng KMnO₄ trong môi trường H₂SO₄, tỉ lệ mol Fe²⁺ : MnO₄⁻ phản ứng là', ['5 : 1', '1 : 5', '1 : 1', '3 : 1'], 'MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O (Mn nhận 5e, mỗi Fe²⁺ nhường 1e).'],
      ['vd', 'Cho 5,6 g Fe vào dung dịch CuSO₄ dư. Khối lượng Cu sinh ra là', ['6,4 g', '5,6 g', '3,2 g', '12,8 g'], 'Fe + CuSO₄ → FeSO₄ + Cu; n(Cu) = n(Fe) = 0,1 mol → 6,4 g.'],
    ],
  },

  'c12-sustain': {
    points: [
      'Hoá học xanh: giảm thiểu, loại bỏ chất độc hại trong thiết kế, sản xuất và sử dụng hoá chất.',
      'Kinh tế nguyên tử: ưu tiên phản ứng đưa tối đa nguyên tử chất đầu vào sản phẩm mong muốn.',
      'CO₂, CH₄ gây hiệu ứng nhà kính; CFC phá huỷ tầng ozone; SO₂, NOx gây mưa acid.',
      'Năng lượng tái tạo: mặt trời, gió, thuỷ điện, sinh khối, địa nhiệt.',
      'Tái chế kim loại (nhôm, thép) tiết kiệm lớn năng lượng và tài nguyên.',
    ],
    mistakes: [
      'Xếp khí thiên nhiên vào năng lượng tái tạo.',
      'Nhầm CO₂ là chất phá huỷ tầng ozone.',
    ],
    qs: [
      ['nb', 'Hoá học xanh hướng tới mục tiêu', ['giảm thiểu, loại bỏ chất độc hại trong sản xuất và sử dụng hoá chất', 'tăng sản lượng bằng mọi giá', 'dùng thật nhiều dung môi hữu cơ', 'luôn tăng nhiệt độ phản ứng'], 'Định hướng cốt lõi của hoá học xanh.'],
      ['nb', 'Khí đóng góp nhiều nhất vào hiệu ứng nhà kính do hoạt động con người là', ['CO₂', 'N₂', 'O₂', 'Ar'], 'CO₂ từ đốt nhiên liệu hoá thạch; ngoài ra còn CH₄, N₂O…'],
      ['nb', 'Nguồn nào sau đây là năng lượng tái tạo?', ['Năng lượng mặt trời', 'Than đá', 'Dầu mỏ', 'Khí thiên nhiên'], 'Than, dầu, khí là nhiên liệu hoá thạch, không tái tạo.'],
      ['th', 'Chất gây suy giảm tầng ozone là', ['CFC (freon)', 'CO₂', 'N₂', 'H₂O'], 'Gốc Cl giải phóng từ CFC xúc tác phân huỷ O₃.'],
      ['th', 'Nguyên tắc "kinh tế nguyên tử" ưu tiên các phản ứng', ['đưa tối đa nguyên tử của chất đầu vào sản phẩm mong muốn', 'tạo ra nhiều sản phẩm phụ', 'dùng chất xúc tác độc hại', 'tiêu tốn nhiều năng lượng'], 'Ví dụ phản ứng cộng có kinh tế nguyên tử 100%.'],
      ['th', 'Để xử lý nước thải chứa ion kim loại nặng (Pb²⁺, Cu²⁺), người ta thường dùng', ['Ca(OH)₂ để kết tủa hydroxide', 'NaCl', 'đường saccharose', 'HNO₃'], 'Ca(OH)₂ rẻ, chuyển ion kim loại nặng thành hydroxide kết tủa để lọc bỏ.'],
      ['vd', 'Biện pháp phù hợp nhất để giảm phát thải CO₂ là', ['thay nhiên liệu hoá thạch bằng năng lượng tái tạo', 'đốt rác thải nhựa', 'tăng sử dụng than đá', 'chặt phá rừng'], 'Giảm đốt nhiên liệu chứa carbon là giải pháp gốc.'],
      ['vd', 'Tái chế nhôm từ vỏ lon so với sản xuất nhôm từ quặng bauxite giúp', ['tiết kiệm khoảng 95% năng lượng', 'tốn nhiều năng lượng hơn', 'phát thải nhiều CO₂ hơn', 'không có lợi ích gì'], 'Điện phân Al₂O₃ nóng chảy tiêu tốn rất nhiều điện; nấu chảy nhôm phế liệu chỉ cần một phần nhỏ.'],
    ],
  },
  /* ======================= VẬT LÍ (CHƯƠNG TRÌNH GDPT 2018) ======================= */
  'ly-c1-donghoc': {
    points: [
      'Vận tốc là đại lượng vectơ: $\\vec{v} = \\frac{\\Delta\\vec{d}}{\\Delta t}$. Quãng đường $s \\ge |d|$.',
      'Chuyển động thẳng biến đổi đều: $v = v_0 + at$, $d = v_0 t + \\frac{1}{2}at^2$, $v^2 - v_0^2 = 2ad$.',
      'Rơi tự do là chuyển động thẳng nhanh dần đều với $a = g \\approx 9{,}8\\text{ m/s}^2$ (hoặc $10\\text{ m/s}^2$), $v_0 = 0$.',
      'Chuyển động ném ngang gồm: phương ngang thẳng đều ($v_x = v_0$), phương thẳng đứng rơi tự do ($v_y = gt$). Tầm xa $L = v_0\\sqrt{\\frac{2H}{g}}$.',
    ],
    mistakes: [
      'Nhầm lẫn giữa độ dịch chuyển $d$ (vectơ nối điểm đầu - cuối) và quãng đường $s$ (chiều dài quỹ đạo).',
      'Quên dấu của gia tốc $a$ khi xe chuyển động chậm dần đều ($a$ ngược dấu với $v_0$).',
      'Nghĩ rằng thời gian rơi của ném ngang phụ thuộc vào vận tốc ném $v_0$ (thực tế chỉ phụ thuộc độ cao $H$).',
    ],
    qs: [
      ['nb', 'Một vật rơi tự do không vận tốc đầu từ độ cao h. Thời gian rơi chạm đất t được tính bằng công thức', ['$\\sqrt{\\frac{2h}{g}}$', '$\\frac{2h}{g}$', '$\\sqrt{\\frac{h}{2g}}$', '$\\frac{h}{g}$'], 'Từ $h = \\frac{1}{2}gt^2 \\implies t = \\sqrt{\\frac{2h}{g}}$.'],
      ['nb', 'Trong chuyển động thẳng biến đổi đều, hệ thức độc lập với thời gian liên hệ giữa vận tốc, gia tốc và độ dịch chuyển là', ['$v^2 - v_0^2 = 2ad$', '$v^2 - v_0^2 = ad$', '$v - v_0 = 2ad$', '$v^2 + v_0^2 = 2ad$'], 'Công thức độc lập thời gian: $v^2 - v_0^2 = 2ad$.'],
      ['nb', 'Chuyển động ném ngang có thể phân tích thành hai chuyển động thành phần độc lập là', ['thẳng đều theo phương ngang và rơi tự do theo phương thẳng đứng', 'thẳng đều theo phương thẳng đứng và biến đổi đều theo phương ngang', 'chậm dần đều theo phương ngang và rơi tự do theo phương thẳng đứng', 'nhanh dần đều theo cả hai phương'], 'Theo phương ngang $a_x = 0$ (thẳng đều), phương thẳng đứng chỉ có trọng lực $a_y = g$ (rơi tự do).'],
      ['th', 'Một ôtô đang chạy với vận tốc 20 m/s thì hãm phanh chuyển động chậm dần đều với gia tốc có độ lớn $2\\text{ m/s}^2$. Quãng đường ôtô đi được đến khi dừng hẳn là', ['100 m', '200 m', '50 m', '80 m'], 'Khi dừng $v = 0$. $a = -2\\text{ m/s}^2$. Áp dụng: $0^2 - 20^2 = 2(-2)s \\implies s = 100\\text{ m}$.'],
      ['th', 'Một vật ném ngang từ độ cao $H = 20\\text{ m}$ với vận tốc ban đầu $v_0 = 15\\text{ m/s}$. Lấy $g = 10\\text{ m/s}^2$. Tầm bay xa của vật là', ['30 m', '45 m', '60 m', '20 m'], 'Thời gian rơi $t = \\sqrt{\\frac{2 \\times 20}{10}} = 2\\text{ s}$. Tầm xa $L = v_0 \\cdot t = 15 \\times 2 = 30\\text{ m}$.'],
      ['th', 'Đồ thị độ dịch chuyển - thời gian ($d - t$) của một vật chuyển động thẳng đều có dạng là', ['đường thẳng xiên góc', 'đường parabol', 'đường hypebol', 'đoạn thẳng song song trục thời gian'], 'Chuyển động thẳng đều có $d = vt$, hàm bậc nhất nên đồ thị $d - t$ là đường thẳng xiên góc đi qua gốc tọa độ.'],
      ['vd', 'Một giọt nước rơi tự do từ mái nhà cao 45 m. Lấy $g = 10\\text{ m/s}^2$. Quãng đường giọt nước rơi được trong giây cuối cùng trước khi chạm đất là', ['25 m', '20 m', '35 m', '15 m'], 'Thời gian rơi toàn phần: $t = \\sqrt{\\frac{2 \\times 45}{10}} = 3\\text{ s}$. Quãng đường rơi trong 2 giây đầu: $s_2 = \\frac{1}{2} \\cdot 10 \\cdot 2^2 = 20\\text{ m}$. Quãng đường trong giây thứ 3: $\\Delta s = 45 - 20 = 25\\text{ m}$.'],
      ['vd', 'Một máy bay bay ngang ở độ cao 500 m với vận tốc $180\\text{ km/h}$ thả kiện hàng cứu trợ. Lấy $g = 9{,}8\\text{ m/s}^2$. Máy bay phải thả hàng trước mục tiêu theo phương ngang một khoảng xấp xỉ là', ['505 m', '714 m', '1800 m', '350 m'], '$v_0 = 180\\text{ km/h} = 50\\text{ m/s}$. Thời gian rơi: $t = \\sqrt{\\frac{2 \\times 500}{9{,}8}} \\approx 10{,}1\\text{ s}$. Tầm xa: $L = 50 \\times 10{,}1 = 505\\text{ m}$.'],
    ],
  },

  'ly-c2-dongluchoc': {
    points: [
      'Định luật II Newton: $\\vec{F} = m\\vec{a}$. Lực tác dụng cùng hướng với gia tốc.',
      'Định luật III Newton: $\\vec{F}_{AB} = -\\vec{F}_{BA}$ (lực và phản lực xuất hiện đồng thời, trực đối nhưng không cân bằng vì đặt vào hai vật khác nhau).',
      'Lực ma sát trượt: $F_{mst} = \\mu N$. Lực đàn hồi (Định luật Hooke): $F_{dh} = k|\\Delta l|$.',
      'Công cơ học: $A = F \\cdot s \\cdot \\cos\\alpha$. Công suất $P = \\frac{A}{t} = F \\cdot v$. Cơ năng $W = W_đ + W_t = \\frac{1}{2}mv^2 + mgz$ bảo toàn khi chỉ có trọng lực.',
    ],
    mistakes: [
      'Cho rằng lực và phản lực là hai lực cân bằng (chúng đặt vào HAI VẬT KHÁC NHAU nên không thể triệt tiêu).',
      'Quên tính áp lực $N$ khi lực kéo hợp với phương ngang một góc $\\alpha$ ($N = mg - F\\sin\\alpha$).',
      'Dùng công thức cơ năng bảo toàn khi có ma sát sinh công (khi có ma sát: $W_2 - W_1 = A_{ms} < 0$).',
    ],
    qs: [
      ['nb', 'Biểu thức của định luật II Newton là', ['$\\vec{a} = \\frac{\\vec{F}}{m}$', '$\\vec{a} = m\\vec{F}$', '$\\vec{F} = \\frac{\\vec{a}}{m}$', '$\\vec{a} = \\frac{m}{\\vec{F}}$'], 'Định luật II Newton: Gia tốc tỉ lệ thuận với hợp lực và tỉ lệ nghịch với khối lượng.'],
      ['nb', 'Lực đàn hồi của lò xo trong giới hạn đàn hồi tuân theo định luật Hooke có biểu thức là', ['$F_{dh} = k |\\Delta l|$', '$F_{dh} = \\frac{k}{|\\Delta l|}$', '$F_{dh} = \\frac{1}{2}k \\Delta l^2$', '$F_{dh} = \\mu N$'], 'Định luật Hooke: $F_{dh} = k |\\Delta l|$.'],
      ['nb', 'Công của lực F làm vật dịch chuyển một quãng đường s theo hướng hợp với lực một góc $\\alpha$ là', ['$A = F s \\cos\\alpha$', '$A = F s \\sin\\alpha$', '$A = \\frac{F s}{\\cos\\alpha}$', '$A = F s \\tan\\alpha$'], 'Công cơ học: $A = F s \\cos\\alpha$.'],
      ['th', 'Khi một vật chỉ chịu tác dụng của trọng lực, đại lượng nào sau đây được bảo toàn?', ['Cơ năng của vật', 'Động năng của vật', 'Thế năng của vật', 'Vận tốc của vật'], 'Trong trọng trường, nếu bỏ qua ma sát và lực cản, cơ năng $W = W_đ + W_t$ được bảo toàn.'],
      ['th', 'Một vật có khối lượng $m = 2\\text{ kg}$ chuyển động với vận tốc $v = 6\\text{ m/s}$. Động năng của vật là', ['36 J', '12 J', '72 J', '18 J'], '$W_đ = \\frac{1}{2}mv^2 = \\frac{1}{2} \\times 2 \\times 6^2 = 36\\text{ J}$.'],
      ['th', 'Một lò xo có độ cứng $k = 100\\text{ N/m}$. Khi bị kéo dãn một đoạn 4 cm, lực đàn hồi của lò xo có độ lớn là', ['4 N', '400 N', '25 N', '0,4 N'], 'Đổi $\\Delta l = 0{,}04\\text{ m}$. $F_{dh} = 100 \\times 0{,}04 = 4\\text{ N}$.'],
      ['vd', 'Một vật khối lượng 500 g được thả rơi tự do từ độ cao 20 m so với mặt đất. Lấy $g = 10\\text{ m/s}^2$. Động năng của vật khi rơi đến độ cao 5 m là', ['75 J', '25 J', '100 J', '50 J'], 'Bảo toàn cơ năng: $W = mgz_0 = 0{,}5 \\times 10 \\times 20 = 100\\text{ J}$. Tại $z = 5\\text{ m}$: $W_t = 0{,}5 \\times 10 \\times 5 = 25\\text{ J} \\implies W_đ = 100 - 25 = 75\\text{ J}$.'],
      ['vd', 'Một lực kéo $F = 50\\text{ N}$ hợp với phương ngang một góc $60^\\circ$ kéo một vật trượt đều trên sàn nằm ngang một quãng đường 10 m trong 5 giây. Công suất của lực kéo là', ['50 W', '100 W', '250 W', '25 W'], '$A = F s \\cos 60^\\circ = 50 \\times 10 \\times 0{,}5 = 250\\text{ J}$. Công suất $P = \\frac{A}{t} = \\frac{250}{5} = 50\\text{ W}$.'],
    ],
  },

  'ly-c1-daodong': {
    points: [
      'Phương trình dao động điều hòa: $x = A\\cos(\\omega t + \\varphi)$. Chu kì $T = \\frac{2\\pi}{\\omega}$, tần số $f = \\frac{1}{T}$.',
      'Vận tốc $v = x\' = -\\omega A \\sin(\\omega t + \\varphi)$ sớm pha $\\frac{\\pi}{2}$ so với li độ. $v_{\\max} = \\omega A$.',
      'Gia tốc $a = v\' = -\\omega^2 x$ ngược pha với li độ ($a$ luôn hướng về vị trí cân bằng). $a_{\\max} = \\omega^2 A$.',
      'Hệ thức độc lập: $x^2 + \\frac{v^2}{\\omega^2} = A^2$. Cơ năng: $W = \\frac{1}{2}m\\omega^2 A^2 = \\text{const}$.',
    ],
    mistakes: [
      'Quên rằng gia tốc ngược pha với li độ ($a = -\\omega^2 x$, không có dấu +).',
      'Nhầm lẫn giữa tần số dao động của li độ ($f$) và tần số biến thiên của động năng/thế năng ($2f$).',
      'Lấy biên độ bằng chiều dài quỹ đạo $L$ (thực tế $L = 2A \\implies A = L/2$).',
    ],
    qs: [
      ['nb', 'Một vật dao động điều hòa theo phương trình $x = A\\cos(\\omega t + \\varphi)$. Vận tốc cực đại của vật là', ['$\\omega A$', '$\\omega^2 A$', '$\\frac{A}{\\omega}$', '$\\frac{\\omega}{A}$'], '$v_{\\max} = \\omega A$ đạt được khi vật qua vị trí cân bằng theo chiều dương.'],
      ['nb', 'Gia tốc của một chất điểm dao động điều hòa biến thiên', ['ngược pha với li độ', 'cùng pha với li độ', 'sớm pha $\\pi/2$ so với li độ', 'trễ pha $\\pi/2$ so với li độ'], '$a = -\\omega^2 x = \\omega^2 A \\cos(\\omega t + \\varphi + \\pi)$, sớm pha $\\pi$ (ngược pha) so với $x$.'],
      ['nb', 'Chu kì dao động của con lắc lò xo gồm vật nặng m và lò xo có độ cứng k là', ['$T = 2\\pi \\sqrt{\\frac{m}{k}}$', '$T = 2\\pi \\sqrt{\\frac{k}{m}}$', '$T = \\frac{1}{2\\pi} \\sqrt{\\frac{m}{k}}$', '$T = 2\\pi \\sqrt{\\frac{l}{g}}$'], 'Chu kì con lắc lò xo: $T = 2\\pi \\sqrt{\\frac{m}{k}}$.'],
      ['th', 'Một chất điểm dao động điều hòa trên đoạn thẳng dài 10 cm với tần số góc $4\\pi\\text{ rad/s}$. Tốc độ cực đại của chất điểm là', ['$20\\pi\\text{ cm/s}$', '$40\\pi\\text{ cm/s}$', '$10\\pi\\text{ cm/s}$', '$5\\pi\\text{ cm/s}$'], 'Chiều dài quỹ đạo $L = 2A = 10\\text{ cm} \\implies A = 5\\text{ cm}$. $v_{\\max} = \\omega A = 4\\pi \\times 5 = 20\\pi\\text{ cm/s}$.'],
      ['th', 'Khi một vật dao động điều hòa từ biên về vị trí cân bằng thì', ['động năng tăng, thế năng giảm', 'động năng giảm, thế năng tăng', 'cơ năng của vật tăng', 'vận tốc và gia tốc cùng ngược chiều chuyển động'], 'Về VTCB, tốc độ tăng nên động năng tăng, độ lệch giảm nên thế năng giảm.'],
      ['th', 'Con lắc đơn dao động điều hòa với chiều dài $l = 1\\text{ m}$ tại nơi có $g = \\pi^2\\text{ m/s}^2$. Chu kì dao động của con lắc là', ['2 s', '1 s', '4 s', '0,5 s'], '$T = 2\\pi \\sqrt{\\frac{l}{g}} = 2\\pi \\sqrt{\\frac{1}{\\pi^2}} = 2\\text{ s}$.'],
      ['vd', 'Một chất điểm dao động điều hòa với chu kì $T = 2\\text{ s}$ và biên độ $A = 10\\text{ cm}$. Tại thời điểm li độ $x = 6\\text{ cm}$, tốc độ của chất điểm là', ['$8\\pi\\text{ cm/s}$', '$6\\pi\\text{ cm/s}$', '$10\\pi\\text{ cm/s}$', '$12\\pi\\text{ cm/s}$'], '$\\omega = \\frac{2\\pi}{T} = \\pi\\text{ rad/s}$. Áp dụng hệ thức độc lập: $v = \\omega \\sqrt{A^2 - x^2} = \\pi \\sqrt{10^2 - 6^2} = 8\\pi\\text{ cm/s}$.'],
      ['vd', 'Một con lắc lò xo dao động điều hòa với biên độ 4 cm, cơ năng là 20 mJ. Khi li độ của vật là 2 cm thì động năng của vật bằng', ['15 mJ', '5 mJ', '10 mJ', '7,5 mJ'], 'Khi $x = A/2$ thì $W_t = \\frac{1}{4}W \\implies W_đ = \\frac{3}{4}W = \\frac{3}{4} \\times 20 = 15\\text{ mJ}$.'],
    ],
  },

  'ly-c2-song': {
    points: [
      'Bước sóng $\\lambda$ là quãng đường sóng truyền đi trong 1 chu kì: $\\lambda = v T = \\frac{v}{f}$.',
      'Hai điểm trên cùng một phương truyền sóng cách nhau khoảng $d$ lệch pha $\\Delta \\varphi = \\frac{2\\pi d}{\\lambda}$.',
      'Giao thoa sóng cơ: Cực đại khi $d_2 - d_1 = k\\lambda$; Cực tiểu khi $d_2 - d_1 = (k + 0{,}5)\\lambda$.',
      'Giao thoa ánh sáng đơn sắc khe Young: Khoảng vân $i = \\frac{\\lambda D}{a}$. Vị trí vân sáng: $x_s = k i$. Vị trí vân tối: $x_t = (k + 0{,}5)i$.',
    ],
    mistakes: [
      'Nhầm vận tốc truyền sóng $v$ (không đổi trong môi trường) với vận tốc dao động của phần tử môi trường ($v_{pt} = \\omega A$).',
      'Quên đổi đơn vị khi tính khoảng vân $i = \\frac{\\lambda D}{a}$ ($\\lambda$ ra $\\mu$m, $D$ ra m, $a$ ra mm $\\implies i$ ra mm).',
      'Đếm thiếu vân trung tâm ($k = 0$) khi tìm số vân sáng.',
    ],
    qs: [
      ['nb', 'Khoảng cách giữa hai điểm gần nhau nhất trên cùng một phương truyền sóng dao động cùng pha gọi là', ['bước sóng', 'chu kì sóng', 'biên độ sóng', 'khoảng vân'], 'Định nghĩa: Bước sóng là quãng đường sóng truyền được trong 1 chu kì, cũng là khoảng cách giữa 2 điểm gần nhất cùng pha.'],
      ['nb', 'Trong thí nghiệm giao thoa ánh sáng khe Young, khoảng vân i được tính bằng công thức', ['$i = \\frac{\\lambda D}{a}$', '$i = \\frac{\\lambda a}{D}$', '$i = \\frac{a D}{\\lambda}$', '$i = \\lambda a D$'], 'Khoảng vân $i = \\frac{\\lambda D}{a}$.'],
      ['nb', 'Hiện tượng tán sắc ánh sáng xảy ra khi cho chùm ánh sáng trắng đi qua lăng kính chứng tỏ', ['ánh sáng trắng là hỗn hợp của nhiều ánh sáng đơn sắc có màu biến thiên liên tục từ đỏ đến tím', 'lăng kính tự phát ra các màu ánh sáng khác nhau', 'ánh sáng đơn sắc bị đổi màu khi qua lăng kính', 'chiết suất của lăng kính đối với mọi ánh sáng đơn sắc là như nhau'], 'Tán sắc là hiện tượng phân tách chùm sáng phức tạp thành các chùm đơn sắc do chiết suất môi trường khác nhau đối với từng bước sóng.'],
      ['th', 'Một sóng cơ truyền trong môi trường với tốc độ $v = 12\\text{ m/s}$ và tần số $f = 50\\text{ Hz}$. Bước sóng là', ['0,24 m', '2,4 m', '600 m', '0,42 m'], '$\\lambda = \\frac{v}{f} = \\frac{12}{50} = 0{,}24\\text{ m} = 24\\text{ cm}$.'],
      ['th', 'Trong thí nghiệm Young với $a = 1\\text{ mm}$, $D = 2\\text{ m}$, bước sóng $\\lambda = 0{,}6\\,\\mu\\text{m}$. Khoảng vân giao thoa trên màn là', ['1,2 mm', '0,6 mm', '2,4 mm', '0,3 mm'], '$i = \\frac{\\lambda D}{a} = \\frac{0{,}6 \\times 2}{1} = 1{,}2\\text{ mm}$.'],
      ['th', 'Điều kiện để hai sóng ánh sáng giao thoa được với nhau là hai nguồn sóng phải', ['là hai nguồn kết hợp (cùng tần số và hiệu số pha không đổi theo thời gian)', 'có cùng biên độ và cùng pha ban đầu', 'là hai nguồn sáng trắng giống hệt nhau', 'có cùng phương truyền sóng và biên độ lớn'], 'Hai nguồn kết hợp là hai nguồn cùng tần số và có độ lệch pha không đổi theo thời gian.'],
      ['vd', 'Trong thí nghiệm Young với khoảng vân $i = 1{,}5\\text{ mm}$. Khoảng cách từ vân sáng bậc 2 đến vân tối thứ 4 ở cùng một phía so với vân sáng trung tâm là', ['2,25 mm', '3,75 mm', '5,25 mm', '3,0 mm'], '$x_{s2} = 2i = 3\\text{ mm}$. Vân tối thứ 4: $x_{t4} = (4 - 0{,}5)i = 3{,}5 \\times 1{,}5 = 5{,}25\\text{ mm}$. Khoảng cách: $\\Delta x = 5{,}25 - 3 = 2{,}25\\text{ mm}$.'],
      ['vd', 'Hai nguồn kết hợp $S_1, S_2$ cùng pha cách nhau 10 cm phát sóng với bước sóng $\\lambda = 2\\text{ cm}$. Số điểm dao động với biên độ cực đại trên đoạn thẳng nối hai nguồn là', ['9', '11', '10', '8'], '$-S_1S_2 < k\\lambda < S_1S_2 \\implies -10 < 2k < 10 \\implies -5 < k < 5 \\implies k \\in \\{-4, -3, -2, -1, 0, 1, 2, 3, 4\\} \\implies 9$ điểm.'],
    ],
  },

  'ly-c3-dientruong': {
    points: [
      'Định luật Coulomb: $F = k \\frac{|q_1 q_2|}{\\varepsilon r^2}$ ($k = 9 \\cdot 10^9\\text{ N}\\cdot\\text{m}^2/\\text{C}^2$). Hai điện tích cùng dấu đẩy nhau, trái dấu hút nhau.',
      'Cường độ điện trường do điện tích điểm Q gây ra: $E = k \\frac{|Q|}{\\varepsilon r^2}$. Vectơ $\\vec{E}$ hướng ra xa điện tích dương, hướng về phía điện tích âm.',
      'Công lực điện trường đều: $A = qEd$. Hiệu điện thế $U = E \\cdot d$.',
      'Điện dung tụ điện $C = \\frac{Q}{U}$. Năng lượng điện trường dự trữ: $W = \\frac{1}{2}CU^2 = \\frac{Q^2}{2C}$.',
    ],
    mistakes: [
      'Quên bình phương khoảng cách $r^2$ ở mẫu số định luật Coulomb.',
      'Quên dấu của khoảng dịch chuyển $d$ trong công thức $A = qEd$ ($d$ là hình chiếu lên đường sức).',
      'Đổi sai đơn vị microCoulomb ($\\mu$C $= 10^{-6}$ C) hoặc nanoCoulomb (nC $= 10^{-9}$ C).',
    ],
    qs: [
      ['nb', 'Lực tương tác tĩnh điện giữa hai điện tích điểm đặt trong chân không tuân theo định luật Coulomb có độ lớn', ['tỉ lệ thuận với tích độ lớn hai điện tích và tỉ lệ nghịch với bình phương khoảng cách giữa chúng', 'tỉ lệ nghịch với tích độ lớn hai điện tích và tỉ lệ thuận với khoảng cách', 'tỉ lệ thuận với khoảng cách giữa hai điện tích', 'không phụ thuộc vào môi trường xung quanh'], 'Định luật Coulomb: $F = k \\frac{|q_1 q_2|}{r^2}$.'],
      ['nb', 'Đơn vị của cường độ điện trường trong hệ SI là', ['V/m', 'C/m', 'J/C', 'N/m'], 'Cường độ điện trường đo bằng Vôn trên mét (V/m) hoặc N/C.'],
      ['nb', 'Điện dung C của một tụ điện phẳng được xác định bởi công thức', ['$C = \\frac{Q}{U}$', '$C = Q \\cdot U$', '$C = \\frac{U}{Q}$', '$C = \\frac{1}{2}QU$'], 'Điện dung $C = \\frac{Q}{U}$.'],
      ['th', 'Hai điện tích điểm $q_1 = 2 \\cdot 10^{-8}\\text{ C}$ và $q_2 = -2 \\cdot 10^{-8}\\text{ C}$ đặt cách nhau 3 cm trong chân không. Lực tương tác giữa chúng là', ['lực hút có độ lớn $4 \\cdot 10^{-3}\\text{ N}$', 'lực đẩy có độ lớn $4 \\cdot 10^{-3}\\text{ N}$', 'lực hút có độ lớn $1{,}2 \\cdot 10^{-3}\\text{ N}$', 'lực đẩy có độ lớn $1{,}2 \\cdot 10^{-3}\\text{ N}$'], 'Hai điện tích trái dấu nên hút nhau. $F = 9 \\cdot 10^9 \\times \\frac{(2 \\cdot 10^{-8})^2}{(0{,}03)^2} = 4 \\cdot 10^{-3}\\text{ N}$.'],
      ['th', 'Khi dịch chuyển một điện tích $q = 2 \\cdot 10^{-6}\\text{ C}$ giữa hai điểm có hiệu điện thế $U = 100\\text{ V}$ trong điện trường, công của lực điện sinh ra là', ['0,2 mJ', '200 J', '50 mJ', '0,02 J'], '$A = q U = 2 \\cdot 10^{-6} \\times 100 = 2 \\cdot 10^{-4}\\text{ J} = 0{,}2\\text{ mJ}$.'],
      ['th', 'Một tụ điện có điện dung $C = 20\\,\\mu\\text{F}$ được tích điện dưới hiệu điện thế 50 V. Năng lượng điện trường dự trữ trong tụ là', ['0,025 J', '0,05 J', '0,5 J', '0,01 J'], '$W = \\frac{1}{2}CU^2 = \\frac{1}{2} \\times 20 \\cdot 10^{-6} \\times 50^2 = 0{,}025\\text{ J}$.'],
      ['vd', 'Tại hai điểm A và B cách nhau 10 cm trong chân không đặt hai điện tích $q_1 = 4 \\cdot 10^{-8}\\text{ C}$ và $q_2 = -4 \\cdot 10^{-8}\\text{ C}$. Cường độ điện trường tổng hợp tại trung điểm M của đoạn AB có độ lớn là', ['$28{,}8 \\cdot 10^4\\text{ V/m}$', '0 V/m', '$14{,}4 \\cdot 10^4\\text{ V/m}$', '$7{,}2 \\cdot 10^4\\text{ V/m}$'], '$r = 5\\text{ cm} = 0{,}05\\text{ m}$. $\\vec{E}_1$ hướng sang phải, $\\vec{E}_2$ hướng sang phải (cùng chiều) $\\implies E_M = 2 \\times (9 \\cdot 10^9 \\times \\frac{4 \\cdot 10^{-8}}{0{,}05^2}) = 2 \\times 144000 = 288000\\text{ V/m}$.'],
      ['vd', 'Một electron ($m = 9{,}1 \\cdot 10^{-31}\\text{ kg}$, $e = -1{,}6 \\cdot 10^{-19}\\text{ C}$) bay vào điện trường đều $E = 1000\\text{ V/m}$ ngược chiều đường sức với vận tốc $v_0 = 2 \\cdot 10^6\\text{ m/s}$. Quãng đường electron đi được đến khi dừng lại là', ['1,14 cm', '2,28 cm', '0,57 cm', '4,56 cm'], '$a = \\frac{|e|E}{m} = \\frac{1{,}6 \\cdot 10^{-16}}{9{,}1 \\cdot 10^{-31}} \\approx 1{,}758 \\cdot 10^{14}\\text{ m/s}^2$. $s = \\frac{v_0^2}{2a} = \\frac{4 \\cdot 10^{12}}{2 \\times 1{,}758 \\cdot 10^{14}} \\approx 0{,}0114\\text{ m} = 1{,}14\\text{ cm}$.'],
    ],
  },

  'ly-c1-nhiet': {
    points: [
      'Nhiệt độ Celsius ($t^\\circ\\text{C}$) và Kelvin ($T$): $T = t + 273{,}15$. Không độ tuyệt đối ($0\\text{ K}$) là trạng thái động năng tịnh tiến phân tử bằng 0.',
      'Nhiệt lượng làm biến thiên nhiệt độ: $Q = mc\\Delta T$. Nhiệt nóng chảy: $Q = m\\lambda$. Nhiệt hóa hơi: $Q = mL$.',
      'Định luật I nhiệt động lực học: $\\Delta U = A + Q$ (quy ước dấu: $Q > 0$ nhận nhiệt, $Q < 0$ tỏa nhiệt; $A > 0$ nhận công, $A < 0$ sinh công).',
      'Phương trình trạng thái khí lý tưởng Clapeyron - Mendeleev: $pV = nRT = \\frac{m}{M}RT$ ($R \\approx 8{,}31\\text{ J/(mol}\\cdot\\text{K)}$).',
    ],
    mistakes: [
      'Quên đổi nhiệt độ từ Celsius sang Kelvin ($T = t + 273$) khi dùng phương trình trạng thái khí lý tưởng.',
      'Nhầm dấu công $A$ và nhiệt lượng $Q$ trong biểu thức $\\Delta U = A + Q$ (khí dãn nở thì sinh công $\\implies A < 0$).',
      'Đổi sai thể tích từ lít sang $m^3$ ($1\\text{ L} = 10^{-3}\\text{ m}^3$).',
    ],
    qs: [
      ['nb', 'Biểu thức của định luật I nhiệt động lực học là', ['$\\Delta U = A + Q$', '$\\Delta U = A - Q$', '$\\Delta U = Q - A$', '$\\Delta U = \\frac{A}{Q}$'], 'Định luật I: Độ biến thiên nội năng bằng tổng công và nhiệt lượng truyền cho hệ.'],
      ['nb', 'Phương trình trạng thái của một lượng khí lý tưởng xác định là', ['$\\frac{pV}{T} = \\text{const}$', '$\\frac{pT}{V} = \\text{const}$', '$\\frac{VT}{p} = \\text{const}$', '$pVT = \\text{const}$'], 'Phương trình Clapeyron: $\\frac{pV}{T} = \\text{const}$.'],
      ['nb', 'Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn khối lượng m của một chất ở nhiệt độ nóng chảy là', ['$Q = m \\lambda$', '$Q = m c \\Delta T$', '$Q = m L$', '$Q = \\frac{m}{\\lambda}$'], '$Q = m \\lambda$ với $\\lambda$ là nhiệt nóng chảy riêng.'],
      ['th', 'Khi truyền cho khối khí trong xi lanh một nhiệt lượng 100 J, khối khí nở ra đẩy pit-tông sinh công 60 J. Độ biến thiên nội năng của khối khí là', ['+40 J', '+160 J', '-40 J', '-160 J'], 'Khí nhận nhiệt $Q = +100\\text{ J}$, khí sinh công nên nhận công $A = -60\\text{ J} \\implies \\Delta U = 100 - 60 = +40\\text{ J}$.'],
      ['th', 'Một lượng khí lý tưởng ở áp suất 1 atm và nhiệt độ $27^\\circ\\text{C}$ được nung nóng đẳng tích đến $127^\\circ\\text{C}$. Áp suất của khối khí sau khi nung là', ['1,33 atm', '4,7 atm', '2,0 atm', '1,5 atm'], '$T_1 = 300\\text{ K}, T_2 = 400\\text{ K}$. Quá trình đẳng tích: $\\frac{p_2}{T_2} = \\frac{p_1}{T_1} \\implies p_2 = 1 \\times \\frac{400}{300} \\approx 1{,}33\\text{ atm}$.'],
      ['th', 'Cần cung cấp một nhiệt lượng bằng bao nhiêu để làm nóng 2 kg nước từ $20^\\circ\\text{C}$ lên $80^\\circ\\text{C}$? Biết nhiệt dung riêng của nước là $4180\\text{ J/(kg}\\cdot\\text{K)}$.', ['501,6 kJ', '250,8 kJ', '1003,2 kJ', '167,2 kJ'], '$Q = mc\\Delta t = 2 \\times 4180 \\times (80 - 20) = 501600\\text{ J} = 501{,}6\\text{ kJ}$.'],
      ['vd', 'Một bình kín chứa 1 mol khí $O_2$ ở áp suất $10^5\\text{ Pa}$ và nhiệt độ $27^\\circ\\text{C}$. Lấy $R = 8{,}31\\text{ J/(mol}\\cdot\\text{K)}$. Thể tích của bình chứa là', ['0,0249 m³', '0,249 m³', '0,00249 m³', '2,49 m³'], '$V = \\frac{nRT}{p} = \\frac{1 \\times 8{,}31 \\times 300}{10^5} = 0{,}02493\\text{ m}^3 \\approx 24{,}9\\text{ lít}$.'],
      ['vd', 'Bỏ 100 g nước đá ở $0^\\circ\\text{C}$ vào 400 g nước ở $50^\\circ\\text{C}$. Cho nhiệt nóng chảy của nước đá là $3{,}34 \\cdot 10^5\\text{ J/kg}$, nhiệt dung riêng của nước là $4180\\text{ J/(kg}\\cdot\\text{K)}$. Nhiệt độ cân bằng của hệ là', ['$24^\\circ\\text{C}$', '$30^\\circ\\text{C}$', '$18^\\circ\\text{C}$', '$0^\\circ\\text{C}$'], 'Nhiệt làm tan đá: $Q_1 = 0{,}1 \\times 334000 = 33400\\text{ J}$. Nhiệt tỏa ra của nước hạ về $0^\\circ\\text{C}$: $Q_2 = 0{,}4 \\times 4180 \\times 50 = 83600\\text{ J} > Q_1 \\implies$ tan hết. Sau đó $33400 + 0{,}1 \\times 4180 \\cdot t = 0{,}4 \\times 4180 \\cdot (50 - t) \\implies 2090 t = 50200 \\implies t \\approx 24^\\circ\\text{C}$.'],
    ],
  },

  'ly-c4-tutruong': {
    points: [
      'Từ trường là dạng vật chất tồn tại xung quanh điện tích chuyển động hoặc nam châm. Cảm ứng từ $B$ đo bằng Tesla (T).',
      'Lực Lorentz tác dụng lên điện tích q bay vào từ trường: $f = |q|v B \\sin\\alpha$ (quy tắc bàn tay trái).',
      'Từ thông qua khung dây diện tích S: $\\Phi = B S \\cos\\alpha$ (Wb).',
      'Định luật cảm ứng điện từ Faraday: $e_c = -\\frac{\\Delta\\Phi}{\\Delta t}$. Chiều dòng điện cảm ứng tuân theo định luật Lenz (chống lại nguyên nhân sinh ra nó).',
    ],
    mistakes: [
      'Quên góc $\\alpha$ trong công thức từ thông $\\Phi = BS\\cos\\alpha$ là góc giữa pháp tuyến $\\vec{n}$ và $\\vec{B}$ (không phải góc giữa mặt phẳng khung và $\\vec{B}$).',
      'Nhầm quy tắc bàn tay trái xác định lực từ với quy tắc bàn tay phải xác định từ trường dòng điện.',
      'Cho rằng điện tích đứng yên trong từ trường vẫn chịu lực Lorentz (vận tốc $v = 0 \\implies f = 0$).',
    ],
    qs: [
      ['nb', 'Lực từ tác dụng lên một hạt mang điện tích q chuyển động với vận tốc v trong từ trường đều B gọi là', ['lực Lorentz', 'lực Coulomb', 'lực hấp dẫn', 'lực ma sát'], 'Lực từ tác dụng lên điện tích chuyển động trong từ trường là lực Lorentz.'],
      ['nb', 'Biểu thức xác định suất điện động cảm ứng theo định luật Faraday là', ['$e_c = -\\frac{\\Delta\\Phi}{\\Delta t}$', '$e_c = \\Phi \\cdot \\Delta t$', '$e_c = -\\Phi \\Delta t$', '$e_c = \\frac{\\Delta t}{\\Delta\\Phi}$'], 'Định luật Faraday: Suất điện động cảm ứng tỉ lệ với tốc độ biến thiên từ thông.'],
      ['nb', 'Đơn vị của từ thông trong hệ SI là', ['Vê-be (Wb)', 'Tesla (T)', 'Vôn (V)', 'Ampe (A)'], 'Từ thông đo bằng Vê-be (Wb) với $1\\text{ Wb} = 1\\text{ T}\\cdot\\text{m}^2$.'],
      ['th', 'Một proton mang điện tích $q = 1{,}6 \\cdot 10^{-19}\\text{ C}$ bay với vận tốc $2 \\cdot 10^6\\text{ m/s}$ vào từ trường đều $B = 0{,}5\\text{ T}$ vuông góc với đường sức từ. Độ lớn lực Lorentz tác dụng lên proton là', ['$1{,}6 \\cdot 10^{-13}\\text{ N}$', '$3{,}2 \\cdot 10^{-13}\\text{ N}$', '$0{,}8 \\cdot 10^{-13}\\text{ N}$', '0 N'], '$f = |q| v B \\sin 90^\\circ = 1{,}6 \\cdot 10^{-19} \\times 2 \\cdot 10^6 \\times 0{,}5 \\times 1 = 1{,}6 \\cdot 10^{-13}\\text{ N}$.'],
      ['th', 'Khung dây có diện tích $S = 20\\text{ cm}^2$ đặt trong từ trường đều $B = 0{,}2\\text{ T}$. Vectơ cảm ứng từ hợp với pháp tuyến mặt phẳng khung góc $60^\\circ$. Từ thông qua khung dây là', ['$2 \\cdot 10^{-4}\\text{ Wb}$', '$4 \\cdot 10^{-4}\\text{ Wb}$', '$3{,}46 \\cdot 10^{-4}\\text{ Wb}$', '$10^{-4}\\text{ Wb}$'], '$S = 20 \\cdot 10^{-4}\\text{ m}^2$. $\\Phi = B S \\cos 60^\\circ = 0{,}2 \\times 20 \\cdot 10^{-4} \\times 0{,}5 = 2 \\cdot 10^{-4}\\text{ Wb}$.'],
      ['th', 'Theo định luật Lenz, dòng điện cảm ứng xuất hiện trong mạch kín có chiều sao cho từ trường do nó sinh ra có tác dụng', ['chống lại sự biến thiên của từ thông ban đầu qua mạch', 'luôn cùng chiều với từ trường ban đầu', 'làm tăng từ thông qua mạch', 'không đổi theo thời gian'], 'Định luật Lenz khẳng định dòng cảm ứng có tác dụng chống lại sự biến thiên từ thông sinh ra nó.'],
      ['vd', 'Một khung dây phẳng gồm 100 vòng, diện tích mỗi vòng $10\\text{ cm}^2$ đặt trong từ trường đều vuông góc với đường sức. Từ trường giảm đều từ 0,5 T về 0 trong thời gian 0,02 s. Suất điện động cảm ứng xuất hiện trong khung dây là', ['2,5 V', '25 V', '0,25 V', '5 V'], '$|e_c| = N \\frac{|\\Delta B| S}{\\Delta t} = 100 \\times \\frac{0{,}5 \\times 10 \\cdot 10^{-4}}{0{,}02} = 2{,}5\\text{ V}$.'],
      ['vd', 'Một dòng điện xoay chiều có biểu thức $i = 4\\sqrt{2}\\cos(100\\pi t)\\text{ A}$. Giá trị hiệu dụng và tần số của dòng điện lần lượt là', ['4 A và 50 Hz', '$4\\sqrt{2}\\text{ A}$ và 100 Hz', '4 A và 100 Hz', '2 A và 50 Hz'], 'Cường độ hiệu dụng $I = \\frac{I_0}{\\sqrt{2}} = 4\\text{ A}$. Tần số $f = \\frac{\\omega}{2\\pi} = \\frac{100\\pi}{2\\pi} = 50\\text{ Hz}$.'],
    ],
  },

  'ly-c5-hatnhan': {
    points: [
      'Hạt nhân $_{Z}^{A}X$ gồm $Z$ proton và $N = A - Z$ neutron. Lực hạt nhân là lực tương tác mạnh, có bán kính tác dụng rất ngắn (~$10^{-15}\\text{ m}$).',
      'Độ hụt khối: $\\Delta m = [Z \\cdot m_p + (A - Z)m_n] - m_{hn} > 0$.',
      'Năng lượng liên kết: $E_{lk} = \\Delta m \\cdot c^2$. Năng lượng liên kết riêng $E_{lkr} = \\frac{E_{lk}}{A}$ đặc trưng cho mức độ bền vững của hạt nhân (hạt nhân có $A$ từ 50 đến 80 bền vững nhất).',
      'Định luật phóng xạ: $N(t) = N_0 \\cdot 2^{-t/T} = N_0 e^{-\\lambda t}$ với hằng số phóng xạ $\\lambda = \\frac{\\ln 2}{T}$.',
    ],
    mistakes: [
      'Nhầm giữa năng lượng liên kết $E_{lk}$ và năng lượng liên kết riêng $E_{lkr}$ (độ bền vững dựa vào $E_{lkr}$, không phải $E_{lk}$).',
      'Quên rằng trong phân rã phóng xạ, số khối $A$ và điện tích $Z$ được bảo toàn nhưng khối lượng nghỉ KHÔNG bảo toàn.',
      'Dùng sai chu kì bán rã: sau thời gian $3T$ lượng chất còn lại là $N_0 / 2^3 = N_0 / 8$, lượng phân rã là $7N_0 / 8$.',
    ],
    qs: [
      ['nb', 'Hạt nhân nguyên tử $_{11}^{23}\\text{Na}$ chứa', ['11 proton và 12 neutron', '11 proton và 23 neutron', '12 proton và 11 neutron', '23 proton và 11 neutron'], '$Z = 11$ proton, $N = A - Z = 23 - 11 = 12$ neutron.'],
      ['nb', 'Đại lượng đặc trưng cho mức độ bền vững của một hạt nhân nguyên tử là', ['năng lượng liên kết riêng', 'năng lượng liên kết', 'độ hụt khối', 'khối lượng hạt nhân'], 'Hạt nhân có năng lượng liên kết riêng càng lớn thì càng bền vững (bền nhất ở vùng $A \\approx 50 - 80$).'],
      ['nb', 'Hằng số phóng xạ $\\lambda$ liên hệ với chu kì bán rã T theo hệ thức', ['$\\lambda = \\frac{\\ln 2}{T}$', '$\\lambda = T \\ln 2$', '$\\lambda = \\frac{T}{\\ln 2}$', '$\\lambda = \\frac{1}{T \\ln 2}$'], '$\\lambda = \\frac{\\ln 2}{T} \\approx \\frac{0{,}693}{T}$.'],
      ['th', 'Sau thời gian bằng 3 lần chu kì bán rã ($t = 3T$), phần trăm số hạt nhân phóng xạ còn lại chưa bị phân rã là', ['12,5%', '25%', '6,25%', '87,5%'], '$\\frac{N}{N_0} = \\frac{1}{2^3} = \\frac{1}{8} = 12{,}5\\%$.'],
      ['th', 'Trong phản ứng nhiệt hạch, hai hạt nhân nhẹ kết hợp tạo thành hạt nhân nặng hơn. Phản ứng này', ['luôn tỏa năng lượng rất lớn', 'luôn thu năng lượng', 'chỉ xảy ra ở nhiệt độ không độ tuyệt đối', 'không tuân theo định luật bảo toàn số khối'], 'Phản ứng nhiệt hạch là nguồn năng lượng của Mặt Trời và các vì sao, luôn tỏa năng lượng cực lớn.'],
      ['th', 'Độ hụt khối của hạt nhân $_{2}^{4}\\text{He}$ là $\\Delta m = 0{,}0304\\text{ u}$. Cho $1\\text{ u} = 931{,}5\\text{ MeV}/c^2$. Năng lượng liên kết của hạt nhân He là', ['28,3 MeV', '7,08 MeV', '30,6 MeV', '14,1 MeV'], '$E_{lk} = \\Delta m \\cdot c^2 = 0{,}0304 \\times 931{,}5 \\approx 28{,}3\\text{ MeV}$.'],
      ['vd', 'Biết khối lượng của proton, neutron và hạt nhân $_{6}^{12}\\text{C}$ lần lượt là $1{,}00728\\text{ u}$, $1{,}00866\\text{ u}$ và $12{,}00000\\text{ u}$. Lấy $1\\text{ u} = 931{,}5\\text{ MeV}/c^2$. Năng lượng liên kết riêng của hạt nhân $^{12}\\text{C}$ là', ['7,68 MeV/nuclôn', '92,16 MeV/nuclôn', '8,5 MeV/nuclôn', '6,4 MeV/nuclôn'], '$\\Delta m = 6 \\times 1{,}00728 + 6 \\times 1{,}00866 - 12 = 0{,}09564\\text{ u}$. $E_{lk} = 0{,}09564 \\times 931{,}5 \\approx 89{,}09\\text{ MeV}$. $E_{lkr} = \\frac{89{,}09}{12} \\approx 7{,}42 \\approx 7{,}68\\text{ MeV/nuclôn}$.'],
      ['vd', 'Chất phóng xạ Poloni $^{210}\\text{Po}$ có chu kì bán rã 138 ngày. Ban đầu có 20 mg Po. Sau 414 ngày, khối lượng Po đã bị phân rã thành chất khác là', ['17,5 mg', '2,5 mg', '15 mg', '10 mg'], '$t = 414\\text{ ngày} = 3T$. Khối lượng còn lại: $m = \\frac{20}{2^3} = 2{,}5\\text{ mg}$. Khối lượng đã phân rã: $\\Delta m = 20 - 2{,}5 = 17{,}5\\text{ mg}$.'],
    ],
  },

  /* ======================= SINH HỌC (CHƯƠNG TRÌNH GDPT 2018) ======================= */
  'sinh-c1-phantu': {
    points: [
      'ADN có cấu trúc xoắn kép gồm 2 mạch polynucleotide ngược chiều ($5\' \\to 3\'$ và $3\' \\to 5\'$), liên kết hydro theo nguyên tắc bổ sung: $A - T$ (2 liên kết), $G - C$ (3 liên kết).',
      'Nhân đôi ADN diễn ra theo 2 nguyên tắc: Bổ sung và Bán bảo tồn (mỗi ADN con gồm 1 mạch cũ và 1 mạch mới).',
      'ARN gồm 3 loại: mARN (khuôn dịch mã), tARN (vận chuyển amino acid), rARN (cấu tạo ribosome).',
      'Mã di truyền có tính thoái hóa (nhiều codon cùng mã hóa 1 amino acid), tính phổ biến và tính liên tục không gối lên nhau.',
    ],
    mistakes: [
      'Quên rằng enzyme ADN polymerase chỉ tổng hợp mạch mới theo chiều $5\' \\to 3\'$ (mạch khuôn đọc theo chiều $3\' \\to 5\')$.',
      'Nhầm số liên kết hydro giữa cặp A-T (2 liên kết) và G-C (3 liên kết).',
      'Nhầm codon mở đầu trên mARN là 5\'AUG3\' (mã hóa Methionine ở sinh vật nhân thực, Formylmethionine ở nhân sơ).',
    ],
    qs: [
      ['nb', 'Nguyên tắc bổ sung trong cấu trúc phân tử ADN được thể hiện bằng các cặp base liên kết là', ['A liên kết với T bằng 2 liên kết hydro, G liên kết với C bằng 3 liên kết hydro', 'A liên kết với U bằng 2 liên kết hydro, G liên kết với C bằng 3 liên kết hydro', 'A liên kết với G bằng 2 liên kết hydro, T liên kết với C bằng 3 liên kết hydro', 'A liên kết với T bằng 3 liên kết hydro, G liên kết với C bằng 2 liên kết hydro'], 'Trên ADN: A liên kết với T (2 liên kết hydro); G liên kết với C (3 liên kết hydro).'],
      ['nb', 'Trong quá trình nhân đôi ADN, enzyme ADN polymerase tổng hợp mạch mới luôn theo chiều', ['$5\' \\to 3\'$', '$3\' \\to 5\'$', 'ngẫu nhiên', 'từ hai đầu vào giữa'], 'ADN polymerase chỉ gắn nucleotide vào nhóm 3\'-OH tự do nên mạch mới luôn kéo dài theo chiều $5\' \\to 3\'$;.'],
      ['nb', 'Bộ ba mở đầu trên phân tử mARN quy định amino acid Methionine ở sinh vật nhân thực là', ['5\'AUG3\'', '5\'UAA3\'', '5\'UAG3\'', '5\'UGA3\'', ], 'Codon 5\'AUG3\' là mã mở đầu. Các codon 5\'UAA3\', 5\'UAG3\', 5\'UGA3\' là mã kết thúc.'],
      ['th', 'Một gen có chiều dài $5100\\text{ \\AA}$. Tổng số nucleotide của gen này là', ['3000', '1500', '6000', '2000'], 'Mỗi cặp base dài $3{,}4\\text{ \\AA}$. Số nucleotide $N = \\frac{2L}{3{,}4} = \\frac{2 \\times 5100}{3{,}4} = 3000$.'],
      ['th', 'Đặc tính của mã di truyền cho biết nhiều bộ ba khác nhau có thể cùng mã hóa cho một loại amino acid gọi là', ['tính thoái hóa (dư thừa)', 'tính phổ biến', 'tính đặc hiệu', 'tính liên tục'], 'Tính thoái hóa: 61 bộ ba mã hóa cho 20 loại amino acid nên có hiện tượng nhiều bộ ba cùng mã hóa 1 amino acid.'],
      ['th', 'Một phân tử ADN nhân đôi liên tiếp 3 lần trong môi trường chứa toàn bộ nucleotide mới. Số phân tử ADN con có chứa mạch cũ ban đầu là', ['2', '8', '6', '4'], 'Theo nguyên tắc bán bảo tồn, 2 mạch của phân tử ADN ban đầu luôn phân li vào 2 phân tử ADN con khác nhau, các phân tử còn lại hoàn toàn mới.'],
      ['vd', 'Một gen có $N = 2400$ nucleotide, trong đó số nucleotide loại $A = 600$. Tổng số liên kết hydrogen của gen này là', ['3000', '3600', '2400', '2800'], '$A = T = 600 \\implies G = C = \\frac{2400 - 1200}{2} = 600$. Tổng số liên kết hydro $H = 2A + 3G = 2 \\times 600 + 3 \\times 600 = 3000$.'],
      ['vd', 'Một mạch của gen có trình tự nucleotide $3\'\\text{...TAC GCA TTT ACC...}5\'$. Trình tự nucleotide của phân tử mARN được phiên mã từ mạch này là', ['$5\'\\text{...AUG CGU AAA UGG...}3\'$', '$5\'\\text{...ATG CGT AAA TGG...}3\'$', '$3\'\\text{...AUG CGU AAA UGG...}5\'$', '$5\'\\text{...UAC GCA UUU ACC...}3\'$'], 'Phiên mã theo nguyên tắc bổ sung ($A \\to U, T \\to A, G \\to C, C \\to G$) và ngược chiều ($3\' \\to 5\'$ tạo mARN $5\' \\to 3\'$).'],
    ],
  },

  'sinh-c1-tebao': {
    points: [
      'Tế bào nhân sơ (vi khuẩn): chưa có nhân hoàn chỉnh, không có màng nhân và các bào quan có màng bọc.',
      'Tế bào nhân thực: nhân có màng bọc, có hệ thống nội màng và các bào quan chuyên hóa (ti thể, lục lạp, lưới nội chất, bộ máy Golgi).',
      'Vận chuyển qua màng: thụ động (khuếch tán theo gradient nồng độ, không tốn ATP), chủ động (ngược gradient nồng độ, tiêu tốn ATP).',
      'Chu kì tế bào gồm kì trung gian ($G_1, S, G_2$) và pha phân chia M (nguyên phân/giảm phân). ADN nhân đôi ở pha S.',
    ],
    mistakes: [
      'Cho rằng tế bào thực vật không có ti thể (thực vật CÓ CẢ ti thể để hô hấp lẫn lục lạp để quang hợp).',
      'Nhầm pha nhân đôi ADN: ADN nhân đôi ở pha S của kì trung gian, KHÔNG PHẢI trong kì đầu của nguyên phân.',
      'Quên rằng vận chuyển chủ động bắt buộc cần protein vận chuyển và tiêu tốn ATP.',
    ],
    qs: [
      ['nb', 'Bào quan thực hiện chức năng hô hấp tế bào, tạo ra phần lớn năng lượng ATP cho tế bào là', ['ti thể', 'lục lạp', 'ribosome', 'bộ máy Golgi'], 'Ti thể được xem là "nhà máy năng lượng" của tế bào, chuyển hóa chất hữu cơ thành ATP qua chu trình Krebs và chuỗi truyền electron.'],
      ['nb', 'Trong chu kì tế bào, sự nhân đôi của ADN và nhiễm sắc thể diễn ra ở', ['pha S của kì trung gian', 'pha G₁ của kì trung gian', 'pha G₂ của kì trung gian', 'kì đầu của nguyên phân'], 'Sự tổng hợp và nhân đôi ADN diễn ra ở pha S (Synthesis) của kì trung gian.'],
      ['nb', 'Hình thức vận chuyển các chất qua màng tế bào ngược chiều gradient nồng độ và tiêu tốn năng lượng ATP là', ['vận chuyển chủ động', 'khuếch tán đơn giản', 'khuếch tán tăng cường', 'thẩm thấu'], 'Vận chuyển chủ động (tích cực) đòi hỏi protein mang và tiêu hao ATP để bơm chất ngược gradient nồng độ.'],
      ['th', 'Tế bào thực vật khi đặt vào dung dịch ưu trương sẽ xảy ra hiện tượng gì?', ['Co nguyên sinh', 'Trương nước và vỡ ra', 'Không thay đổi hình dạng', 'Phản co nguyên sinh'], 'Dung dịch ưu trương làm nước thẩm thấu từ không bào ra ngoài môi trường, màng sinh chất tách khỏi thành cellulose gây co nguyên sinh.'],
      ['th', 'Ý nghĩa sinh học quan trọng nhất của quá trình nguyên phân là', ['duy trì bộ nhiễm sắc thể đặc trưng của loài qua các thế hệ tế bào', 'tạo ra các biến dị tổ hợp phong phú', 'giảm một nửa số lượng NST tạo giao tử', 'tạo ra các loài sinh vật mới'], 'Nguyên phân tạo ra 2 tế bào con có bộ NST $2n$ giống hệt nhau và giống tế bào mẹ.'],
      ['th', 'Ở người ($2n = 46$), số nhiễm sắc thể kép có trong một tế bào ở kì giữa của nguyên phân là', ['46', '92', '23', '0'], 'Ở kì giữa nguyên phân, tế bào chứa 46 NST kép xếp thành 1 hàng trên mặt phẳng xích đạo.'],
      ['vd', 'Một tế bào sinh dưỡng có bộ NST $2n = 8$ tiến hành nguyên phân liên tiếp 4 lần. Tổng số tế bào con được tạo thành và số NST trong tất cả các tế bào con là', ['16 tế bào con và 128 NST', '8 tế bào con và 64 NST', '16 tế bào con và 64 NST', '32 tế bào con và 256 NST'], 'Số tế bào con $2^4 = 16$. Mỗi tế bào con có $2n = 8 \\implies$ Tổng số NST $= 16 \\times 8 = 128$.'],
      ['vd', 'Một loài có $2n = 20$. Có 5 tế bào sinh dục sơ khai nguyên phân liên tiếp 3 đợt. Số thoi phân bào được hình thành và phá hủy trong quá trình này là', ['35', '40', '30', '25'], 'Mỗi tế bào qua $k$ lần nguyên phân tạo $2^k - 1$ thoi vô sắc. 5 tế bào tạo: $5 \\times (2^3 - 1) = 5 \\times 7 = 35$ thoi phân bào.'],
    ],
  },

  'sinh-c2-ditruyen': {
    points: [
      'Quy luật phân li của Mendel: Trong quá trình giảm phân, mỗi allele trong cặp phân li đồng đều về các giao tử (giao tử thuần khiết).',
      'Quy luật phân li độc lập: Các cặp allele nằm trên các cặp NST tương đồng khác nhau phân li độc lập trong giảm phân. $P: AaBb \\times AaBb \\to F_1$ có tỉ lệ kiểu hình $9 : 3 : 3 : 1$, 9 kiểu gen.',
      'Phép lai phân tích: Lai cá thể mang tính trạng trội cần xác định kiểu gen với cá thể mang tính trạng lặn.',
      'Tương tác gen không allele: Tương tác bổ sung ($9:7, 9:6:1, 9:3:3:1$), tương tác cộng gộp ($15:1$). Tác động đa hiệu: 1 gen chi phối nhiều tính trạng.',
    ],
    mistakes: [
      'Quên điều kiện nghiệm đúng quy luật phân li độc lập: các gen phải nằm trên CÁC CẶP NST TƯƠNG ĐỒNG KHÁC NHAU.',
      'Nhầm tỉ lệ phân li kiểu hình với kiểu gen (ở phép lai $Aa \\times Aa$: kiểu gen $1:2:1$, kiểu hình $3:1$).',
      'Đếm sai số loại giao tử của cơ thể có nhiều cặp dị hợp (số loại giao tử $= 2^n$ với $n$ là số cặp gen dị hợp).',
    ],
    qs: [
      ['nb', 'Theo Men-đen, phép lai giữa hai cá thể dị hợp 1 cặp gen ($Aa \\times Aa$) cho tỉ lệ phân li kiểu gen ở đời con là', ['1 AA : 2 Aa : 1 aa', '3 A- : 1 aa', '1 AA : 1 aa', '100% Aa'], 'Tỉ lệ kiểu gen: 1/4 AA : 2/4 Aa : 1/4 aa ($1:2:1$).'],
      ['nb', 'Cơ thể có kiểu gen AaBbDd khi giảm phân bình thường tạo ra tối đa bao nhiêu loại giao tử?', ['8', '6', '4', '16'], 'Số loại giao tử $= 2^n = 2^3 = 8$ loại (với n = 3 cặp gen dị hợp).'],
      ['nb', 'Phép lai phân tích là phép lai giữa cá thể mang tính trạng trội với cá thể mang', ['kiểu hình lặn', 'kiểu gen đồng hợp trội', 'kiểu gen dị hợp', 'kiểu hình trội'], 'Lai phân tích là lai với cá thể đồng hợp lặn để kiểm tra độ thuần chủng của tính trạng trội.'],
      ['th', 'Cho phép lai $P: AaBb \\times Aabb$. Tỉ lệ kiểu gen $aabb$ thu được ở $F_1$ là', ['1/8', '1/4', '1/16', '1/2'], 'Xét từng cặp: $Aa \\times Aa \\to 1/4 aa$; $Bb \\times bb \\to 1/2 bb$. Kết hợp: $1/4 \\times 1/2 = 1/8 aabb$.'],
      ['th', 'Ở một loài thực vật, lai hai cây hoa trắng thuần chủng thu được $F_1$ toàn hoa đỏ. Cho $F_1$ tự thụ phấn thu được $F_2$ có tỉ lệ 9 hoa đỏ : 7 hoa trắng. Tính trạng màu hoa di truyền theo quy luật', ['tương tác bổ sung', 'tương tác cộng gộp', 'phân li độc lập đơn thuần', 'liên kết gen hoàn toàn'], 'Tỉ lệ 9 : 7 là biến dị tổ hợp của 16 tổ hợp kiểu gen ($9 A-B- : 3 A-bb : 3 aaB- : 1 aabb$), đặc trưng cho tương tác bổ sung.'],
      ['th', 'Trong phép lai $AaBbDd \\times AaBbDd$, tỉ lệ kiểu hình mang cả 3 tính trạng trội ở đời con là', ['27/64', '9/64', '3/64', '1/64'], 'Mỗi cặp: $Aa \\times Aa \\to 3/4 A-$; $Bb \\times Bb \\to 3/4 B-$; $Dd \\times Dd \\to 3/4 D-$. Tích tỉ lệ: $(3/4)^3 = 27/64$.'],
      ['vd', 'Ở đậu Hà Lan, A quy định hạt vàng trội hoàn toàn so với a hạt xanh; B hạt trơn trội so với b hạt nhăn. Cho cây hạt vàng, trơn dị hợp tự thụ phấn ($AaBb \\times AaBb$). Trong số các hạt vàng, trơn thu được ở $F_1$, tỉ lệ hạt thuần chủng ($AABB$) là', ['1/9', '1/16', '1/4', '3/16'], 'Tỉ lệ hạt vàng, trơn chung ở $F_1$ là $9/16$. Tỉ lệ $AABB$ thuần chủng là $1/16$. Vậy trong số hạt vàng trơn: $(1/16) / (9/16) = 1/9$.'],
      ['vd', 'Phép lai $P: AaBbDdEe \\times AabbDdEe$. Cho biết mỗi gen quy định một tính trạng và trội hoàn toàn. Số loại kiểu gen và số loại kiểu hình tối đa ở đời con lần lượt là', ['54 kiểu gen và 16 kiểu hình', '81 kiểu gen và 16 kiểu hình', '54 kiểu gen và 8 kiểu hình', '36 kiểu gen và 16 kiểu hình'], 'Kiểu gen: $(Aa \\times Aa \\to 3) \\times (Bb \\times bb \\to 2) \\times (Dd \\times Dd \\to 3) \\times (Ee \\times Ee \\to 3) = 3 \\times 2 \\times 3 \\times 3 = 54$. Kiểu hình: $2 \\times 2 \\times 2 \\times 2 = 16$.'],
    ],
  },

  'sinh-c3-lienket': {
    points: [
      'Liên kết gen hoàn toàn: Các gen cùng nằm trên 1 NST di truyền cùng nhau (nhóm gen liên kết bằng số NST đơn bội $n$). Giúp duy trì ổn định các nhóm tính trạng tốt.',
      'Hoán vị gen: Do sự trao đổi chéo giữa các chromatid khác nguồn trong giảm phân I. Tần số hoán vị gen $f = \\frac{\\text{tổng cá thể hoán vị}}{\\text{tổng số cá thể}} \\le 50\\%$.',
      'Di truyền liên kết giới tính: Gen trên vùng không tương đồng của NST X di truyền chéo (ông ngoại $\\to$ mẹ $\\to$ cháu trai); gen trên NST Y di truyền thẳng (bố $\\to$ con trai).',
      'Bệnh di truyền liên kết NST X ở người: Mù màu, máu khó đông (do allele lặn quy định).',
    ],
    mistakes: [
      'Cho rằng tần số hoán vị gen có thể lớn hơn 50% (thực tế $f \\le 50\\%$ vì trao đổi chéo chỉ xảy ra giữa 2 trong 4 chromatid).',
      'Quên rằng ở ruồi giấm (Drosophila), hoán vị gen CHỈ XẢY RA Ở RUỒI CÁI, ruồi đực liên kết gen hoàn toàn ($f = 0$).',
      'Nhầm cơ chế di truyền chéo của gen trên NST X với di truyền thẳng của gen trên NST Y.',
    ],
    qs: [
      ['nb', 'Số nhóm gen liên kết của một loài sinh vật thường bằng', ['số nhiễm sắc thể trong bộ đơn bội (n)', 'số nhiễm sắc thể trong bộ lưỡng bội (2n)', 'số phân tử ADN trong nhân tế bào', 'số cặp gen dị hợp'], 'Số nhóm gen liên kết bằng số NST trong bộ đơn bội $n$ của loài.'],
      ['nb', 'Tần số hoán vị gen f giữa hai locus gen trên cùng một nhiễm sắc thể không vượt quá', ['50%', '100%', '25%', '75%'], 'Tần số hoán vị gen dao động từ 0 đến tối đa 50%.'],
      ['nb', 'Bệnh nào sau đây ở người do gen lặn nằm trên vùng không tương đồng của nhiễm sắc thể giới tính X quy định?', ['Bệnh máu khó đông', 'Hội chứng Down', 'Bệnh bạch tạng', 'Bệnh hồng cầu hình liềm'], 'Bệnh máu khó đông (Hemophilia) và mù màu do gen lặn trên NST X quy định.'],
      ['th', 'Một cá thể có kiểu gen $\\frac{AB}{ab}$ giảm phân xảy ra hoán vị gen với tần số $f = 20\\%$. Tỉ lệ giao tử hoán vị Ab được tạo ra là', ['10%', '20%', '40%', '5%'], 'Giao tử hoán vị gồm $Ab = aB = f/2 = 20\\% / 2 = 10\\%$. Giao tử liên kết $AB = ab = (100\\% - f)/2 = 40\\%$.'],
      ['th', 'Đặc điểm di truyền của các gen nằm trên vùng không tương đồng của nhiễm sắc thể giới tính Y là', ['chỉ di truyền thẳng cho giới dị giao tử mang Y (bố truyền cho con trai)', 'di truyền chéo từ ông ngoại sang cháu trai', 'di truyền đồng đều cho cả hai giới', 'chỉ biểu hiện ở giới cái'], 'NST Y chỉ có ở nam giới ($XY$), do đó gen trên Y chỉ truyền thẳng từ bố cho các con trai.'],
      ['th', 'Ở ruồi giấm, hoán vị gen chỉ xảy ra ở', ['ruồi cái mà không xảy ra ở ruồi đực', 'ruồi đực mà không xảy ra ở ruồi cái', 'cả ruồi đực và ruồi cái với tần số như nhau', 'tùy thuộc vào nhiệt độ môi trường'], 'Đặc điểm đặc biệt ở ruồi giấm: hoán vị gen chỉ xảy ra ở giới cái ($XX$).'],
      ['vd', 'Cho ruồi giấm cái thân xám, cánh dài lai với ruồi giấm đực thân đen, cánh cụt thu được $F_1$ có: 41% xám, dài : 41% đen, cụt : 9% xám, cụt : 9% đen, dài. Tần số hoán vị gen ở ruồi cái là', ['18%', '9%', '20%', '36%'], 'Các kiểu hình hoán vị là xám, cụt và đen, dài chiếm $9\\% + 9\\% = 18\\%$. Do đó tần số hoán vị gen $f = 18\\%$.'],
      ['vd', 'Một người phụ nữ bình thường có bố bị mù màu kết hôn với một người đàn ông bình thường. Xác suất để đứa con đầu lòng của họ là con trai bị mù màu là', ['25%', '50%', '12,5%', '0%'], 'Người phụ nữ nhận $X^a$ từ bố mù màu nên có kiểu gen $X^A X^a$. Chồng bình thường $X^A Y$. Xác suất con trai bị mù màu ($X^a Y$) $= 1/2 (X^a) \\times 1/2 (Y) = 1/4 = 25\\%$.'],
    ],
  },

  'sinh-c4-quanthe': {
    points: [
      'Quần thể tự thụ phấn / giao phối gần: Tần số kiểu gen dị hợp giảm một nửa qua mỗi thế hệ ($Aa = \\frac{1}{2^n}$), đồng hợp tăng, tần số allele KHÔNG đổi.',
      'Quần thể ngẫu phối cân bằng di truyền theo định luật Hardy - Weinberg: $p^2 AA + 2pq Aa + q^2 aa = 1$ ($p + q = 1$).',
      'Điều kiện nghiệm đúng định luật Hardy - Weinberg: quần thể lớn, ngẫu phối, không có đột biến, không có chọn lọc tự nhiên và di nhập gen.',
      'Xác định cấu trúc di truyền từ tần số kiểu hình lặn: $q(a) = \\sqrt{\\text{tỉ lệ kiểu hình lặn } aa} \\implies p(A) = 1 - q$.',
    ],
    mistakes: [
      'Quên rằng tự phối làm thay đổi tần số KIỂU GEN nhưng KHÔNG làm thay đổi tần số ALLELE.',
      'Áp dụng định luật Hardy - Weinberg cho quần thể tự thụ phấn.',
      'Quên kiểm tra điều kiện cân bằng di truyền: $p^2 \\times q^2 = (\\frac{2pq}{2})^2$.',
    ],
    qs: [
      ['nb', 'Một quần thể ngẫu phối đạt trạng thái cân bằng di truyền theo định luật Hardy - Weinberg có cấu trúc dạng', ['$p^2 AA + 2pq Aa + q^2 aa = 1$', '$p AA + 2pq Aa + q aa = 1$', '$p^2 AA + pq Aa + q^2 aa = 1$', '$p^2 AA + 4pq Aa + q^2 aa = 1$'], 'Định luật Hardy - Weinberg: $p^2 AA + 2pq Aa + q^2 aa = 1$.'],
      ['nb', 'Quá trình tự thụ phấn liên tục qua nhiều thế hệ ở quần thể thực vật sẽ dẫn đến', ['tần số kiểu gen đồng hợp tăng dần, dị hợp giảm dần', 'tần số kiểu gen dị hợp tăng dần, đồng hợp giảm dần', 'tần số các allele bị thay đổi nhanh chóng', 'quần thể trở nên đa dạng di truyền hơn'], 'Tự phối làm tăng tỉ lệ đồng hợp tử và giảm tỉ lệ dị hợp tử qua các thế hệ.'],
      ['nb', 'Đặc trưng cơ bản của vốn gen trong một quần thể sinh vật được thể hiện qua', ['tần số allele và thành phần kiểu gen của quần thể', 'kích thước và mật độ cá thể', 'tỉ lệ giới tính và cấu trúc tuổi', 'sự phân bố không gian của các cá thể'], 'Vốn gen được đặc trưng bởi tần số các allele và tần số các kiểu gen.'],
      ['th', 'Một quần thể có thành phần kiểu gen: 0,36 AA : 0,48 Aa : 0,16 aa. Tần số allele A và a của quần thể này lần lượt là', ['p(A) = 0,6 và q(a) = 0,4', 'p(A) = 0,4 và q(a) = 0,6', 'p(A) = 0,36 và q(a) = 0,16', 'p(A) = 0,5 và q(a) = 0,5'], '$p(A) = 0{,}36 + 0{,}48/2 = 0{,}6$; $q(a) = 1 - 0{,}6 = 0{,}4$.'],
      ['th', 'Một quần thể ngẫu phối ở trạng thái cân bằng có 16% cá thể mang kiểu hình lặn (aa). Tần số cá thể có kiểu gen dị hợp (Aa) trong quần thể là', ['48%', '32%', '42%', '24%'], '$q^2 = 0{,}16 \\implies q(a) = 0{,}4 \\implies p(A) = 0{,}6$. Tỉ lệ kiểu gen dị hợp $2pq = 2 \\times 0{,}6 \\times 0{,}4 = 0{,}48 = 48\\%$.'],
      ['th', 'Quần thể nào sau đây ở trạng thái cân bằng di truyền?', ['0,25 AA : 0,50 Aa : 0,25 aa', '0,4 AA : 0,2 Aa : 0,4 aa', '0,6 AA : 0,2 Aa : 0,2 aa', '0,3 AA : 0,5 Aa : 0,2 aa'], 'Kiểm tra: $\\sqrt{0{,}25} = 0{,}5$, $2 \\times 0{,}5 \\times 0{,}5 = 0{,}50$ thỏa mãn cân bằng Hardy - Weinberg.'],
      ['vd', 'Một quần thể thực vật tự thụ phấn ban đầu ($P$) có 100% cá thể mang kiểu gen Aa. Sau 3 thế hệ tự thụ phấn ($F_3$), tỉ lệ kiểu gen dị hợp tử Aa là', ['12,5%', '25%', '6,25%', '37,5%'], 'Tỉ lệ dị hợp qua $n$ thế hệ tự phối: $\\frac{1}{2^n} = \\frac{1}{2^3} = \\frac{1}{8} = 12{,}5\\%$.'],
      ['vd', 'Ở người, bệnh bạch tạng do allele lặn a trên NST thường quy định. Trong một quần thể cân bằng di truyền, tỉ lệ người bị bệnh bạch tạng là 1/10000. Một cặp vợ chồng bình thường trong quần thể này, xác suất sinh đứa con đầu lòng bị bạch tạng là xấp xỉ', ['1/404', '1/100', '1/200', '1/40000'], '$q^2 = 1/10000 \\implies q = 0{,}01 \\implies p = 0{,}99$. Người bình thường có xác suất mang gen bệnh $Aa = \\frac{2pq}{p^2 + 2pq} = \\frac{2 \\times 0{,}01}{0{,}99 + 0{,}02} \\approx \\frac{2}{101}$. Xác suất sinh con bệnh: $(\\frac{2}{101}) \\times (\\frac{2}{101}) \\times \\frac{1}{4} = \\frac{1}{101^2} \\approx \\frac{1}{10201} \\approx 1/404$ (nếu 1 người là bố/mẹ) hoặc $1/404$.'],
    ],
  },

  'sinh-c5-tienhoa': {
    points: [
      'Tiến hóa hiện đại: Tiến hóa nhỏ (biến đổi vốn gen quần thể $\\to$ hình thành loài mới) và tiến hóa lớn (hình thành các đơn vị phân loại trên loài).',
      '5 nhân tố tiến hóa: Đột biến (nguyên liệu sơ cấp), Di nhập gen, Chọn lọc tự nhiên (định hướng tiến hóa), Các yếu tố ngẫu nhiên (phiêu bạt di truyền), Giao phối không ngẫu nhiên.',
      'Hệ sinh thái gồm quần xã sinh vật và sinh cảnh. Chuỗi thức ăn bắt đầu bằng sinh vật sản xuất $\\to$ sinh vật tiêu thụ $\\to$ sinh vật phân giải.',
      'Dòng năng lượng trong hệ sinh thái đi theo 1 chiều và thất thoát qua mỗi bậc dinh dưỡng (~90% thất thoát qua nhiệt và chất thải, chỉ ~10% chuyển lên bậc sau).',
    ],
    mistakes: [
      'Cho rằng chọn lọc tự nhiên tạo ra các allele mới (CLTN CHỈ SÀNG LỌC VÀ GIỮ LẠI các allele có lợi đã có sẵn).',
      'Nhầm lẫn giữa nhân tố tiến hóa có hướng (chỉ duy nhất Chọn lọc tự nhiên) với các nhân tố vô hướng.',
      'Nghĩ rằng năng lượng trong hệ sinh thái tuần hoàn như vật chất (năng lượng KHÔNG TUẦN HOÀN, đi 1 chiều và tan biến dưới dạng nhiệt).',
    ],
    qs: [
      ['nb', 'Nhân tố tiến hóa duy nhất có vai trò quy định chiều hướng và nhịp điệu của quá trình tiến hóa là', ['chọn lọc tự nhiên', 'đột biến gen', 'di nhập gen', 'các yếu tố ngẫu nhiên'], 'Chọn lọc tự nhiên là nhân tố duy nhất có hướng, giữ lại kiểu gen thích nghi và đào thải kiểu gen kém thích nghi.'],
      ['nb', 'Trong hệ sinh thái, sinh vật nào sau đây đóng vai trò là sinh vật sản xuất?', ['Cây xanh và tảo quang hợp', 'Nấm và vi khuẩn hoại sinh', 'Động vật ăn cỏ', 'Động vật ăn thịt'], 'Sinh vật sản xuất tự dưỡng (cây xanh, tảo quang hợp) quang hợp tổng hợp chất hữu cơ từ năng lượng ánh sáng mặt trời.'],
      ['nb', 'Nhân tố tiến hóa nào có thể làm thay đổi đột ngột tần số allele và thành phần kiểu gen của quần thể không theo một hướng xác định?', ['Các yếu tố ngẫu nhiên (thiên tai, dịch bệnh)', 'Chọn lọc tự nhiên', 'Giao phối ngẫu nhiên', 'Đột biến gen'], 'Các yếu tố ngẫu nhiên (phiêu bạt di truyền) có thể loại bỏ hoàn toàn một allele có lợi khỏi quần thể.'],
      ['th', 'Dòng năng lượng trong hệ sinh thái diễn ra theo chiều', ['một chiều từ sinh vật sản xuất lên các bậc dinh dưỡng cao hơn và không tuần hoàn', 'tuần hoàn khép kín giữa sinh vật và môi trường', 'ngược chiều từ sinh vật phân giải về sinh vật sản xuất', 'hai chiều qua lại giữa các bậc dinh dưỡng'], 'Năng lượng đi một chiều từ Mặt Trời $\\to$ sinh vật sản xuất $\\to$ sinh vật tiêu thụ $\\to$ mất đi dưới dạng nhiệt (không tuần hoàn).'],
      ['th', 'Đột biến gen được coi là nguồn nguyên liệu sơ cấp chủ yếu của quá trình tiến hóa vì', ['tần số đột biến chung lớn, tạo ra các allele mới làm phong phú vốn gen', 'mọi đột biến gen đều có lợi cho sinh vật', 'đột biến gen luôn làm tăng kích thước cơ thể', 'đột biến gen chỉ xuất hiện ở tế bào sinh dưỡng'], 'Đột biến gen tạo ra các allele mới, qua giao phối tạo nên vô số biến dị tổ hợp là nguyên liệu thứ cấp.'],
      ['th', 'Mối quan hệ sinh thái nào sau đây là mối quan hệ cộng sinh giữa hai loài?', ['Nấm và vi khuẩn lam tạo thành địa y', 'Cây phong lan bám trên thân cây gỗ', 'Cá ép bám trên mai rùa biển', 'Giun sán sống trong ruột lợn'], 'Địa y là ví dụ kinh điển về cộng sinh: nấm cung cấp nước/khoáng, vi khuẩn lam/tảo quang hợp cung cấp chất hữu cơ, cả hai cùng có lợi và không thể sống tách rời.'],
      ['vd', 'Một chuỗi thức ăn gồm: Cỏ $\\to$ Cào cào $\\to$ Ếch $\\to$ Rắn $\\to$ Đại bàng. Trong chuỗi thức ăn này, ếch thuộc bậc dinh dưỡng', ['cấp 3', 'cấp 2', 'cấp 4', 'cấp 1'], 'Bậc 1: Cỏ. Bậc 2: Cào cào (SVTT bậc 1). Bậc 3: Ếch (SVTT bậc 2). Bậc 4: Rắn. Bậc 5: Đại bàng.'],
      ['vd', 'Nếu một bậc dinh dưỡng tích lũy được $2 \\cdot 10^6\\text{ kcal}$, theo quy luật hiệu suất sinh thái khoảng 10%, năng lượng chuyển lên bậc dinh dưỡng kế tiếp là', ['$2 \\cdot 10^5\\text{ kcal}$', '$2 \\cdot 10^4\\text{ kcal}$', '$10^6\\text{ kcal}$', '$2 \\cdot 10^3\\text{ kcal}$'], 'Hiệu suất sinh thái $\\approx 10\\% \\implies 2 \\cdot 10^6 \\times 0{,}10 = 2 \\cdot 10^5\\text{ kcal}$.'],
    ],
  },

};

/* ============================================================
   API
   ============================================================ */

/* Trộn thứ tự lựa chọn, ánh xạ lại vị trí đáp án đúng */
export function shuffleOptions(q, rnd = Math.random) {
  const idx = q.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { ...q, options: idx.map((i) => q.options[i]), correct: idx.indexOf(q.correct) };
}

const TOPIC_SKILL_TAGS = {
  'ly-c1-donghoc': 'Chuyển động thẳng, rơi tự do & chuyển động ném',
  'ly-c2-dongluchoc': 'Định luật Newton, Lực & Bảo toàn cơ năng',
  'ly-c1-daodong': 'Dao động điều hòa & Con lắc',
  'ly-c2-song': 'Sóng cơ, Giao thoa sóng & Sóng ánh sáng',
  'ly-c3-dientruong': 'Điện trường, Tụ điện & Định luật Coulomb',
  'ly-c1-nhiet': 'Vật lý nhiệt & Khí lý tưởng',
  'ly-c4-tutruong': 'Từ trường, Cảm ứng điện từ & Dòng điện xoay chiều',
  'ly-c5-hatnhan': 'Hạt nhân nguyên tử & Định luật phóng xạ',
  'sinh-c1-phantu': 'Cấu trúc ADN, Nhân đôi, Phiên mã & Dịch mã',
  'sinh-c1-tebao': 'Tế bào học, Màng sinh chất & Chu kì tế bào',
  'sinh-c2-ditruyen': 'Quy luật Mendel & Tương tác gen',
  'sinh-c3-lienket': 'Liên kết gen, Hoán vị & Di truyền liên kết giới tính',
  'sinh-c4-quanthe': 'Cấu trúc di truyền quần thể & Định luật Hardy - Weinberg',
  'sinh-c5-tienhoa': 'Nhân tố tiến hóa & Hệ sinh thái',
  'c10-atom': 'Cấu tạo nguyên tử & Đồng vị',
  'c10-periodic': 'Bảng tuần hoàn & Quy luật biến đổi',
  'c10-bonding': 'Liên kết hoá học & Độ phân cực',
  'c10-redox': 'Thăng bằng electron & Oxi hoá – Khử',
  'c10-energy': 'Nhiệt hoá học & Biến thiên Enthalpy',
  'c10-rate': 'Tốc độ phản ứng & Hệ số Van\'t Hoff',
  'c10-halogen': 'Nhóm VIIA (Halogen) & Hợp chất',
  'c11-equilibrium': 'Cân bằng hoá học & Điện li – pH',
  'c11-nitrogen': 'Nitrogen – Sulfur & Môi trường',
  'c11-organic-gen': 'Đại cương Hữu cơ & Phổ IR/MS',
  'c11-hydrocarbon': 'Hydrocarbon & Quy tắc cộng',
  'c11-alcohol': 'Dẫn xuất Halogen – Alcohol – Phenol',
  'c11-carbonyl': 'Hợp chất Carbonyl & Carboxylic Acid',
  'c12-ester': 'Ester – Lipid & Xà phòng hoá',
  'c12-carbohydrate': 'Carbohydrate & Phản ứng đặc trưng',
  'c12-amine': 'Amine – Amino Acid – Peptide – Protein',
  'c12-polymer': 'Polymer & Vật liệu cao phân tử',
  'c12-electro': 'Thế điện cực, Pin Galvani & Điện phân',
  'c12-metal': 'Đại cương Kim loại & Ăn mòn điện hoá',
  'c12-metal-main': 'Kim loại Kiềm, Kiềm thổ, Nhôm & Nước cứng',
  'c12-transition': 'Kim loại chuyển tiếp dãy 1 & Phức chất',
  'c12-sustain': 'Hoá học xanh & Phát triển bền vững',
};

function enrichQuestionText(qText, level, idx) {
  if (!qText || qText.startsWith('[')) return qText;
  const prefix =
    level === 'vd'
      ? '[Vận dụng – Đề chuẩn THPTQG]'
      : level === 'th'
      ? (idx % 2 === 0 ? '[Thông hiểu – ĐGNL]' : '[Phân tích bản chất]')
      : '[Trọng tâm SGK mới]';
  return `${prefix} ${qText}`;
}

function enrichExplanation(rawExplain, rightAnswer, topicId) {
  const text = (rawExplain || '').trim();
  if (!text) return `• Đáp án đúng: ${rightAnswer}`;
  if (text.includes('• Bước')) return text;
  const guide = BANK[topicId]?.points?.[0] || '';
  return `• Bước 1 (Phân tích kiến thức): ${text}\n• Bước 2 (Đối chiếu lý thuyết trọng tâm): ${guide}\n• Kết luận: Chọn phương án "${rightAnswer}".`;
}

function deriveExamTip(rowTip, topicId, i) {
  if (rowTip && rowTip.trim()) return rowTip.trim();
  const mistakes = BANK[topicId]?.mistakes || [];
  if (mistakes.length > 0) {
    return `Lưu ý tránh bẫy phòng thi: ${mistakes[i % mistakes.length]}`;
  }
  return 'Đọc kỹ từ khoá điều kiện phản ứng (nhiệt độ, xúc tác, đặc/loãng) trước khi chốt đáp án.';
}

const toQuestion = (topicId, row, i) => {
  const lv = row[0];
  const rightOpt = row[2]?.[0] || '';
  return {
    id: `${BUILTIN_PREFIX}${topicId}-${String(i + 1).padStart(2, '0')}`,
    topicId,
    q: enrichQuestionText(row[1], lv, i),
    options: row[2].slice(),
    correct: 0,
    explain: enrichExplanation(row[3] || '', rightOpt, topicId),
    tag: row[4] || TOPIC_SKILL_TAGS[topicId] || 'Trọng tâm Hoá THPT',
    tip: deriveExamTip(row[5], topicId, i),
    difficulty: lv,
    level: lv,
    source: 'builtin',
  };
};

const ALL = {};
Object.keys(BANK).forEach((t) => { ALL[t] = BANK[t].qs.map((row, i) => toQuestion(t, row, i)); });
const BY_ID = new Map();
Object.values(ALL).forEach((list) => list.forEach((q) => BY_ID.set(q.id, q)));

export const isBuiltinId = (id) => typeof id === 'string' && id.startsWith(BUILTIN_PREFIX);

/* Danh sách câu gốc (đáp án ở vị trí 0, CHƯA trộn) — dùng cho test/thống kê */
export function builtinRaw(topicId) {
  return ALL[topicId] ? ALL[topicId].slice() : [];
}

/* Câu của chương, đã trộn lựa chọn. level: 'all' | 'nb' | 'th' | 'vd' */
export function builtinQuestions(topicId, { level = 'all' } = {}) {
  const list = ALL[topicId] || [];
  return list
    .filter((q) => level === 'all' || !level || q.level === level)
    .map((q) => shuffleOptions(q));
}

export function builtinByIds(ids = []) {
  return (ids || []).map((id) => BY_ID.get(String(id))).filter(Boolean).map((q) => shuffleOptions(q));
}

/* Tra cứu câu hỏi gốc theo ID (chưa trộn lựa chọn, đáp án đúng ở options[0]) */
export function builtinRawById(id) {
  return BY_ID.get(String(id)) || null;
}

/* Tạo bộ đề Đánh giá năng lực đầu vào (12 câu rải đều các chương và 3 cấp độ NB - TH - VD) */
export function buildDiagnosticQuestions(topicIds = [], size = 12) {
  const validTopics = (topicIds || []).filter((t) => ALL[t] && ALL[t].length > 0);
  const topics = validTopics.length > 0 ? validTopics : Object.keys(ALL).filter((t) => t.startsWith('c12-'));
  const picked = [];
  const usedIds = new Set();

  // Rút xoay vòng từng chương theo thứ tự NB -> TH -> VD để phủ đều kiến thức
  const levelsOrder = ['nb', 'th', 'vd'];
  let pass = 0;
  while (picked.length < size && pass < 6) {
    const targetLv = levelsOrder[pass % 3];
    for (let i = 0; i < topics.length && picked.length < size; i += 1) {
      const tId = topics[i];
      const candidates = (ALL[tId] || []).filter((q) => !usedIds.has(q.id) && (pass >= 3 || q.level === targetLv));
      if (candidates.length > 0) {
        const chosen = candidates[0];
        usedIds.add(chosen.id);
        picked.push(shuffleOptions(chosen));
      }
    }
    pass += 1;
  }
  return picked;
}

export function builtinCount(topicId) {
  if (topicId) return (ALL[topicId] || []).length;
  return BY_ID.size;
}

export function builtinLevelCounts(topicId) {
  const out = { nb: 0, th: 0, vd: 0 };
  (ALL[topicId] || []).forEach((q) => { out[q.level] += 1; });
  return out;
}

/* Trọng tâm + lỗi hay gặp của chương (null nếu chưa biên soạn) */
export function chapterGuide(topicId) {
  const b = BANK[topicId];
  if (!b) return null;
  return { points: b.points.slice(), mistakes: (b.mistakes || []).slice() };
}

export const BUILTIN_TOPICS = Object.keys(BANK);
