
export const COMPOUNDS = {
  'HCl':   { name: 'Axit clohiđric',      type: 'acid', strength: 'strong',
             ions: ['H+', 'Cl-'], common: 'Dung dịch axit, dạ dày' },
  'HBr':   { name: 'Axit bromhiđric',     type: 'acid', strength: 'strong',
             ions: ['H+', 'Br-'] },
  'HI':    { name: 'Axit iothiđric',      type: 'acid', strength: 'strong',
             ions: ['H+', 'I-'] },
  'HF':    { name: 'Axit flohiđric',      type: 'acid', strength: 'weak',
             ions: ['H+', 'F-'], note: 'Ăn mòn thủy tinh' },
  'H2S':   { name: 'Axit sunfuahiđric',   type: 'acid', strength: 'weak',
             ions: ['2H+', 'S2-'], note: 'Mùi trứng thối, độc' },
  'H2SO4': { name: 'Axit sunfuric',       type: 'acid', strength: 'strong',
             ions: ['2H+', 'SO4(2-)'], note: 'Háo nước mạnh, tỏa nhiệt khi pha loãng' },
  'H2SO3': { name: 'Axit sunfurơ',        type: 'acid', strength: 'weak',
             ions: ['2H+', 'SO3(2-)'] },
  'HNO3':  { name: 'Axit nitric',         type: 'acid', strength: 'strong',
             ions: ['H+', 'NO3-'], note: 'Oxi hóa mạnh' },
  'HNO2':  { name: 'Axit nitrơ',          type: 'acid', strength: 'weak',
             ions: ['H+', 'NO2-'] },
  'H2CO3': { name: 'Axit cacbonic',       type: 'acid', strength: 'weak',
             ions: ['2H+', 'CO3(2-)'], note: 'Không bền, phân hủy thành CO2 + H2O' },
  'H3PO4': { name: 'Axit photphoric',     type: 'acid', strength: 'medium',
             ions: ['3H+', 'PO4(3-)'] },
  'HClO':  { name: 'Axit hipoclorơ',      type: 'acid', strength: 'weak',
             ions: ['H+', 'ClO-'] },
  'HClO4': { name: 'Axit pecloric',       type: 'acid', strength: 'strong',
             ions: ['H+', 'ClO4-'] },
  'CH3COOH': { name: 'Axit axetic',       type: 'acid', strength: 'weak',
             ions: ['H+', 'CH3COO-'], note: 'Giấm ăn' },
  'NaOH':  { name: 'Natri hiđroxit',      type: 'base', strength: 'strong',
             ions: ['Na+', 'OH-'], common: 'Xút, xà phòng' },
  'KOH':   { name: 'Kali hiđroxit',       type: 'base', strength: 'strong',
             ions: ['K+', 'OH-'], common: 'Xút, xà phòng' },
  'LiOH':  { name: 'Liti hiđroxit',       type: 'base', strength: 'strong',
             ions: ['Li+', 'OH-'] },
  'Ca(OH)2': { name: 'Canxi hiđroxit',    type: 'base', strength: 'strong',
             ions: ['Ca(2+)', '2OH-'], common: 'Vôi tôi' },
  'Ba(OH)2': { name: 'Bari hiđroxit',     type: 'base', strength: 'strong',
             ions: ['Ba(2+)', '2OH-'] },
  'Mg(OH)2': { name: 'Magie hiđroxit',    type: 'base', strength: 'weak',
             ions: ['Mg(2+)', '2OH-'], note: 'Kết tủa trắng' },
  'Cu(OH)2': { name: 'Đồng(II) hiđroxit', type: 'base', strength: 'weak',
             ions: ['Cu(2+)', '2OH-'], note: 'Kết tủa xanh lam' },
  'Fe(OH)2': { name: 'Sắt(II) hiđroxit',  type: 'base', strength: 'weak',
             ions: ['Fe(2+)', '2OH-'], note: 'Kết tủa trắng xanh' },
  'Fe(OH)3': { name: 'Sắt(III) hiđroxit', type: 'base', strength: 'weak',
             ions: ['Fe(3+)', '3OH-'], note: 'Kết tủa nâu đỏ' },
  'Al(OH)3': { name: 'Nhôm hiđroxit',     type: 'base', strength: 'weak',
             ions: ['Al(3+)', '3OH-'], note: 'Lưỡng tính' },
  'Zn(OH)2': { name: 'Kẽm hiđroxit',      type: 'base', strength: 'weak',
             ions: ['Zn(2+)', '2OH-'], note: 'Lưỡng tính' },
  'NH3':   { name: 'Amoniac',             type: 'base', strength: 'weak',
             ions: [], note: 'Khí, tan tốt trong nước, mùi khai' },
  'H2O':   { name: 'Nước',                type: 'oxide', sub: 'neutral' },
  'CO2':   { name: 'Cacbon đioxit',       type: 'oxide', sub: 'acidic',
             note: 'Khí nhà kính' },
  'CO':    { name: 'Cacbon monoxit',      type: 'oxide', sub: 'neutral',
             note: 'Khí độc, gây ngạt' },
  'SO2':   { name: 'Lưu huỳnh đioxit',    type: 'oxide', sub: 'acidic',
             note: 'Mùi hắc, gây mưa axit' },
  'SO3':   { name: 'Lưu huỳnh trioxit',   type: 'oxide', sub: 'acidic' },
  'NO':    { name: 'Nitơ monoxit',        type: 'oxide', sub: 'neutral' },
  'NO2':   { name: 'Nitơ đioxit',         type: 'oxide', sub: 'acidic',
             note: 'Khí nâu đỏ, độc' },
  'N2O':   { name: 'Đinitơ monoxit',      type: 'oxide', sub: 'neutral',
             note: 'Khí cười' },
  'N2O5':  { name: 'Đinitơ pentaoxit',    type: 'oxide', sub: 'acidic' },
  'P2O5':  { name: 'Điphotpho pentaoxit', type: 'oxide', sub: 'acidic' },
  'Na2O':  { name: 'Natri oxit',          type: 'oxide', sub: 'basic' },
  'K2O':   { name: 'Kali oxit',           type: 'oxide', sub: 'basic' },
  'Li2O':  { name: 'Liti oxit',           type: 'oxide', sub: 'basic' },
  'CaO':   { name: 'Canxi oxit',          type: 'oxide', sub: 'basic',
             common: 'Vôi sống' },
  'BaO':   { name: 'Bari oxit',           type: 'oxide', sub: 'basic' },
  'MgO':   { name: 'Magie oxit',          type: 'oxide', sub: 'basic' },
  'CuO':   { name: 'Đồng(II) oxit',       type: 'oxide', sub: 'basic',
             note: 'Chất rắn đen' },
  'Cu2O':  { name: 'Đồng(I) oxit',        type: 'oxide', sub: 'basic',
             note: 'Chất rắn đỏ' },
  'FeO':   { name: 'Sắt(II) oxit',        type: 'oxide', sub: 'basic' },
  'Fe2O3': { name: 'Sắt(III) oxit',       type: 'oxide', sub: 'basic',
             note: 'Chất rắn đỏ nâu, gỉ sắt' },
  'Fe3O4': { name: 'Sắt(II,III) oxit',    type: 'oxide', sub: 'basic',
             note: 'Manhetit, từ tính' },
  'Al2O3': { name: 'Nhôm oxit',           type: 'oxide', sub: 'amphoteric',
             note: 'Lưỡng tính, thành phần boxit' },
  'ZnO':   { name: 'Kẽm oxit',            type: 'oxide', sub: 'amphoteric' },
  'PbO':   { name: 'Chì(II) oxit',        type: 'oxide', sub: 'amphoteric' },
  'Cr2O3': { name: 'Crom(III) oxit',      type: 'oxide', sub: 'amphoteric' },
  'MnO2':  { name: 'Mangan(IV) oxit',     type: 'oxide', sub: 'amphoteric',
             note: 'Chất xúc tác phân hủy H2O2' },
  'NaCl':  { name: 'Natri clorua',        type: 'salt', sub: 'neutral',
             ions: ['Na+', 'Cl-'], common: 'Muối ăn' },
  'KCl':   { name: 'Kali clorua',         type: 'salt', sub: 'neutral',
             ions: ['K+', 'Cl-'] },
  'NaBr':  { name: 'Natri bromua',        type: 'salt', sub: 'neutral',
             ions: ['Na+', 'Br-'] },
  'NaI':   { name: 'Natri iotua',         type: 'salt', sub: 'neutral',
             ions: ['Na+', 'I-'] },
  'NaF':   { name: 'Natri florua',        type: 'salt', sub: 'basic',
             ions: ['Na+', 'F-'] },
  'Na2CO3': { name: 'Natri cacbonat',     type: 'salt', sub: 'basic',
             ions: ['2Na+', 'CO3(2-)'], common: 'Soda' },
  'NaHCO3': { name: 'Natri hiđrocacbonat', type: 'salt', sub: 'amphoteric',
             ions: ['Na+', 'HCO3-'], common: 'Baking soda' },
  'K2CO3': { name: 'Kali cacbonat',       type: 'salt', sub: 'basic',
             ions: ['2K+', 'CO3(2-)'] },
  'CaCO3': { name: 'Canxi cacbonat',      type: 'salt', sub: 'basic',
             ions: ['Ca(2+)', 'CO3(2-)'], common: 'Đá vôi, phấn viết' },
  'BaCO3': { name: 'Bari cacbonat',       type: 'salt', sub: 'basic',
             ions: ['Ba(2+)', 'CO3(2-)'] },
  'MgCO3': { name: 'Magie cacbonat',      type: 'salt', sub: 'basic',
             ions: ['Mg(2+)', 'CO3(2-)'] },
  'Na2SO4': { name: 'Natri sunfat',       type: 'salt', sub: 'neutral',
             ions: ['2Na+', 'SO4(2-)'] },
  'K2SO4': { name: 'Kali sunfat',         type: 'salt', sub: 'neutral',
             ions: ['2K+', 'SO4(2-)'] },
  'CaSO4': { name: 'Canxi sunfat',        type: 'salt', sub: 'neutral',
             ions: ['Ca(2+)', 'SO4(2-)'], note: 'Thạch cao' },
  'BaSO4': { name: 'Bari sunfat',         type: 'salt', sub: 'neutral',
             ions: ['Ba(2+)', 'SO4(2-)'], note: 'Kết tủa trắng, không tan' },
  'CuSO4': { name: 'Đồng(II) sunfat',     type: 'salt', sub: 'acidic',
             ions: ['Cu(2+)', 'SO4(2-)'], note: 'Màu xanh lam' },
  'FeSO4': { name: 'Sắt(II) sunfat',      type: 'salt', sub: 'acidic',
             ions: ['Fe(2+)', 'SO4(2-)'] },
  'Fe2(SO4)3': { name: 'Sắt(III) sunfat', type: 'salt', sub: 'acidic',
             ions: ['2Fe(3+)', '3SO4(2-)'] },
  'ZnSO4': { name: 'Kẽm sunfat',          type: 'salt', sub: 'acidic',
             ions: ['Zn(2+)', 'SO4(2-)'] },
  'MgSO4': { name: 'Magie sunfat',        type: 'salt', sub: 'neutral',
             ions: ['Mg(2+)', 'SO4(2-)'] },
  'Al2(SO4)3': { name: 'Nhôm sunfat',     type: 'salt', sub: 'acidic',
             ions: ['2Al(3+)', '3SO4(2-)'] },
  'NaNO3': { name: 'Natri nitrat',        type: 'salt', sub: 'neutral',
             ions: ['Na+', 'NO3-'] },
  'KNO3':  { name: 'Kali nitrat',         type: 'salt', sub: 'neutral',
             ions: ['K+', 'NO3-'], common: 'Diêm tiêu' },
  'AgNO3': { name: 'Bạc nitrat',          type: 'salt', sub: 'acidic',
             ions: ['Ag+', 'NO3-'], note: 'Dung dịch trong suốt' },
  'Cu(NO3)2': { name: 'Đồng(II) nitrat',  type: 'salt', sub: 'acidic',
             ions: ['Cu(2+)', '2NO3-'] },
  'Fe(NO3)3': { name: 'Sắt(III) nitrat',  type: 'salt', sub: 'acidic',
             ions: ['Fe(3+)', '3NO3-'] },
  'Na3PO4': { name: 'Natri photphat',     type: 'salt', sub: 'basic',
             ions: ['3Na+', 'PO4(3-)'] },
  'Ca3(PO4)2': { name: 'Canxi photphat',  type: 'salt', sub: 'basic',
             ions: ['3Ca(2+)', '2PO4(3-)'], note: 'Thành phần xương' },
  'NaClO': { name: 'Natri hipoclorơ',     type: 'salt', sub: 'basic',
             ions: ['Na+', 'ClO-'], common: 'Nước Javen' },
  'KMnO4': { name: 'Kali pemanganat',     type: 'salt', sub: 'neutral',
             ions: ['K+', 'MnO4-'], note: 'Tím, chất oxi hóa mạnh' },
  'K2Cr2O7': { name: 'Kali đicromat',     type: 'salt', sub: 'neutral',
             ions: ['2K+', 'Cr2O7(2-)'], note: 'Da cam, chất oxi hóa mạnh' },
  'FeCl2': { name: 'Sắt(II) clorua',      type: 'salt', sub: 'acidic',
             ions: ['Fe(2+)', '2Cl-'] },
  'FeCl3': { name: 'Sắt(III) clorua',     type: 'salt', sub: 'acidic',
             ions: ['Fe(3+)', '3Cl-'], note: 'Màu vàng nâu' },
  'CuCl2': { name: 'Đồng(II) clorua',     type: 'salt', sub: 'acidic',
             ions: ['Cu(2+)', '2Cl-'] },
  'AlCl3': { name: 'Nhôm clorua',         type: 'salt', sub: 'acidic',
             ions: ['Al(3+)', '3Cl-'] },
  'ZnCl2': { name: 'Kẽm clorua',          type: 'salt', sub: 'acidic',
             ions: ['Zn(2+)', '2Cl-'] },
  'AgCl':  { name: 'Bạc clorua',          type: 'salt', sub: 'neutral',
             ions: ['Ag+', 'Cl-'], note: 'Kết tủa trắng' },
  'BaCl2': { name: 'Bari clorua',         type: 'salt', sub: 'neutral',
             ions: ['Ba(2+)', '2Cl-'] },
  'CaCl2': { name: 'Canxi clorua',        type: 'salt', sub: 'neutral',
             ions: ['Ca(2+)', '2Cl-'] },
  'MgCl2': { name: 'Magie clorua',        type: 'salt', sub: 'neutral',
             ions: ['Mg(2+)', '2Cl-'] },
  'CH4':   { name: 'Metan',               type: 'organic', sub: 'alkane',
             note: 'Khí tự nhiên, khí biogas' },
  'C2H6':  { name: 'Etan',                type: 'organic', sub: 'alkane' },
  'C2H4':  { name: 'Etilen',              type: 'organic', sub: 'alkene',
             note: 'Kích thích quả chín' },
  'C2H2':  { name: 'Axetilen',            type: 'organic', sub: 'alkyne',
             note: 'Đèn xì hàn cắt kim loại' },
  'C6H6':  { name: 'Benzen',              type: 'organic', sub: 'aromatic',
             note: 'Độc, gây ung thư' },
  'CH3OH': { name: 'Metanol',             type: 'organic', sub: 'alcohol',
             note: 'Cồn công nghiệp, độc' },
  'C2H5OH': { name: 'Etanol',             type: 'organic', sub: 'alcohol',
             common: 'Cồn y tế, rượu' },
  'C6H12O6': { name: 'Glucozơ',           type: 'organic', sub: 'sugar',
             note: 'Đường, năng lượng cho tế bào' },
  'C12H22O11': { name: 'Saccarozơ',       type: 'organic', sub: 'sugar',
             common: 'Đường mía' },
};
export function classify(formula) {
  if (COMPOUNDS[formula]) return COMPOUNDS[formula].type;
  if (/^H\d*[A-Z]/.test(formula)) return 'acid';
  if (/OH\)?\d*$/.test(formula)) return 'base';
  if (/O\d*$/.test(formula)) return 'oxide';
  return 'unknown';
}
const TYPE_NAMES = {
  acid: 'Axit',
  base: 'Bazơ',
  oxide: 'Oxit',
  salt: 'Muối',
  organic: 'Hợp chất hữu cơ',
  unknown: 'Chưa xác định',
};

export function analyze(formula) {
  const comp = COMPOUNDS[formula];
  if (comp) {
    return {
      formula,
      found: true,
      ...comp,
      typeName: TYPE_NAMES[comp.type] || 'Khác',
      ...buildReactions(comp),
    };
  }
  const type = classify(formula);
  return {
    formula,
    found: false,
    type,
    typeName: TYPE_NAMES[type] || 'Chưa xác định',
    note: 'Hợp chất chưa có trong database. Đang hiển thị phân loại theo mẫu.',
    ...buildReactions({ type }),
  };
}
function buildReactions(comp) {
  const reactions = [];
  const t = comp.type;

  if (t === 'acid') {
    reactions.push(
      { with: 'Kim loại hoạt động (Na, K, Mg, Al, Zn, Fe)',
        result: 'Muối + H2',
        condition: 'Kim loại đứng trước H trong dãy hoạt động' },
      { with: 'Bazơ', result: 'Muối + H2O', condition: 'Phản ứng trung hòa' },
      { with: 'Oxit bazơ', result: 'Muối + H2O' },
      { with: 'Muối', result: 'Muối mới + Axit mới',
        condition: 'Có kết tủa / khí / chất yếu hơn' },
      { with: 'Quỳ tím', result: 'Quỳ hóa đỏ (pH < 7)' }
    );
  }

  if (t === 'base') {
    reactions.push(
      { with: 'Axit', result: 'Muối + H2O', condition: 'Phản ứng trung hòa' },
      { with: 'Oxit axit', result: 'Muối + H2O', condition: 'Với bazơ tan' },
      { with: 'Muối', result: 'Muối mới + Bazơ mới', condition: 'Có kết tủa' },
      { with: 'Quỳ tím', result: 'Quỳ hóa xanh (pH > 7)' },
      { with: 'Nhiệt phân', result: 'Oxit bazơ + H2O', condition: 'Với bazơ không tan' }
    );
  }

  if (t === 'oxide') {
    if (comp.sub === 'acidic') {
      reactions.push(
        { with: 'Nước', result: 'Axit tương ứng' },
        { with: 'Bazơ tan', result: 'Muối + H2O' },
        { with: 'Oxit bazơ', result: 'Muối' }
      );
    } else if (comp.sub === 'basic') {
      reactions.push(
        { with: 'Nước', result: 'Bazơ tương ứng (nếu tan)' },
        { with: 'Axit', result: 'Muối + H2O' },
        { with: 'Oxit axit', result: 'Muối' }
      );
    } else if (comp.sub === 'amphoteric') {
      reactions.push(
        { with: 'Axit', result: 'Muối + H2O' },
        { with: 'Bazơ tan', result: 'Muối + H2O' }
      );
    } else {
      reactions.push(
        { with: 'Khí H2', result: 'Kim loại + H2O',
          condition: 'Với oxit kim loại đứng sau Al' },
        { with: 'CO', result: 'Kim loại + CO2', condition: 'Luyện kim' }
      );
    }
  }

  if (t === 'salt') {
    reactions.push(
      { with: 'Kim loại hoạt động hơn', result: 'Muối mới + Kim loại mới',
        condition: 'Kim loại trước đẩy kim loại sau ra khỏi muối' },
      { with: 'Axit', result: 'Muối mới + Axit mới',
        condition: 'Có kết tủa / khí / chất yếu' },
      { with: 'Bazơ', result: 'Muối mới + Bazơ mới', condition: 'Có kết tủa' },
      { with: 'Muối', result: '2 muối mới', condition: 'Có kết tủa' },
      { with: 'Nhiệt phân', result: 'Oxit + khí',
        condition: 'Với muối cacbonat, nitrat, ...' }
    );
  }

  if (t === 'organic') {
    if (comp.sub === 'alkane') {
      reactions.push(
        { with: 'O2', result: 'CO2 + H2O', condition: 'Cháy tỏa nhiệt' },
        { with: 'Cl2 (ánh sáng)', result: 'Dẫn xuất clo', condition: 'Thế' },
        { with: 'Nhiệt phân', result: 'Anken + H2', condition: 'Cracking' }
      );
    } else if (comp.sub === 'alkene') {
      reactions.push(
        { with: 'O2', result: 'CO2 + H2O' },
        { with: 'Br2 (dd)', result: 'Mất màu da cam', condition: 'Cộng' },
        { with: 'H2 (Ni, t°)', result: 'Ankan' },
        { with: 'H2O (axit)', result: 'Ancol' }
      );
    } else if (comp.sub === 'alcohol') {
      reactions.push(
        { with: 'Na', result: 'Natri ancolat + H2' },
        { with: 'O2 (t°, Cu)', result: 'Anđehit / Xeton' },
        { with: 'Axit', result: 'Este + H2O', condition: 'Có H2SO4 đặc' }
      );
    } else if (comp.sub === 'acid') {
      reactions.push(
        { with: 'Kim loại', result: 'Muối + H2' },
        { with: 'Bazơ', result: 'Muối + H2O' },
        { with: 'Ancol', result: 'Este + H2O' }
      );
    }
  }

  return { reactions };
}