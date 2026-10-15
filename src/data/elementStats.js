/* Mỗi nguyên tố có `icon` = tên icon SVG trong components/games/GameIcons.jsx
   (trước đây là trường `emoji`). Hiển thị bằng <GIcon name={stats.icon} />. */
export const ELEMENT_STATS = {
  Li: { name: 'Lithium',    hp: 60,  atk: 75, def: 30, spd: 90, type: 'alkali',   icon: 'fire' },
  Na: { name: 'Sodium',   hp: 70,  atk: 85, def: 35, spd: 88, type: 'alkali',   icon: 'fire' },
  K:  { name: 'Potassium',    hp: 80,  atk: 95, def: 40, spd: 92, type: 'alkali',   icon: 'fire' },
  Mg: { name: 'Magnesium',   hp: 90,  atk: 70, def: 65, spd: 70, type: 'alkaline', icon: 'bolt' },
  Ca: { name: 'Calcium',   hp: 100, atk: 75, def: 70, spd: 65, type: 'alkaline', icon: 'bolt' },
  Ba: { name: 'Barium',    hp: 110, atk: 80, def: 75, spd: 60, type: 'alkaline', icon: 'bolt' },
  Fe: { name: 'Iron',     hp: 120, atk: 90, def: 85, spd: 55, type: 'transition', icon: 'sword' },
  Cu: { name: 'Copper',    hp: 110, atk: 85, def: 90, spd: 60, type: 'transition', icon: 'sword' },
  Zn: { name: 'Zinc',     hp: 105, atk: 80, def: 88, spd: 58, type: 'transition', icon: 'sword' },
  Ag: { name: 'Silver',     hp: 100, atk: 95, def: 80, spd: 75, type: 'transition', icon: 'sword' },
  Au: { name: 'Gold',    hp: 130, atk: 100, def: 95, spd: 50, type: 'transition', icon: 'crown' },
  H:  { name: 'Hydrogen',   hp: 50,  atk: 60, def: 25, spd: 100, type: 'nonmetal', icon: 'wind' },
  C:  { name: 'Carbon',  hp: 85,  atk: 80, def: 70, spd: 65, type: 'nonmetal', icon: 'gem' },
  N:  { name: 'Nitrogen',    hp: 75,  atk: 70, def: 60, spd: 85, type: 'nonmetal', icon: 'wind' },
  O:  { name: 'Oxygen',     hp: 80,  atk: 85, def: 55, spd: 80, type: 'nonmetal', icon: 'wind' },
  S:  { name: 'Sulfur', hp: 90, atk: 75, def: 70, spd: 60, type: 'nonmetal', icon: 'gem' },
  Cl: { name: 'Chlorine',     hp: 85,  atk: 90, def: 60, spd: 75, type: 'halogen',  icon: 'skull' },
  He: { name: 'Helium',    hp: 60,  atk: 40, def: 120, spd: 95, type: 'noble', icon: 'sparkle' },
  Ne: { name: 'Neon',    hp: 65,  atk: 45, def: 125, spd: 90, type: 'noble', icon: 'sparkle' },
  Ar: { name: 'Argon',   hp: 70,  atk: 50, def: 130, spd: 85, type: 'noble', icon: 'sparkle' },
};
export const TYPE_CHART = {
  alkali:     { alkaline: 1.5, transition: 0.75, nonmetal: 1.25, halogen: 0.5,  noble: 0.25, alkali: 1 },
  alkaline:   { alkali: 0.75, transition: 1.25, nonmetal: 1.5,  halogen: 1.25, noble: 0.5,  alkaline: 1 },
  transition: { alkali: 1.25, alkaline: 0.75, nonmetal: 1,    halogen: 1.5,  noble: 0.75, transition: 1 },
  nonmetal:   { alkali: 1.25, alkaline: 0.75, transition: 1.25, halogen: 1,    noble: 0.5,  nonmetal: 1 },
  halogen:    { alkali: 1.5,  alkaline: 0.75, transition: 1.25, nonmetal: 1,   noble: 0.25, halogen: 1 },
  noble:      { alkali: 0.5,  alkaline: 0.5,  transition: 0.5,  nonmetal: 0.5, halogen: 0.5, noble: 1 },
};

export const MOVE_POOL = [
  { id: 'proton',  name: 'Va chạm proton', atkMult: 1.0, accuracy: 0.95, desc: 'Đòn đánh cơ bản' },
  { id: 'electron',name: 'Phóng electron', atkMult: 1.3, accuracy: 0.8,  desc: 'Mạnh nhưng dễ trượt' },
  { id: 'neutron', name: 'Bắn neutron',    atkMult: 0.8, accuracy: 1.0,  desc: 'Chính xác 100%' },
  { id: 'ion',     name: 'Ion hóa',        atkMult: 1.5, accuracy: 0.7,  desc: 'Sát thương cao, rủi ro cao' },
  { id: 'shield',  name: 'Tạo vỏ electron',atkMult: 0,   accuracy: 1.0,  heal: 25, desc: 'Hồi máu' },
];

export const BATTLE_QUESTIONS = [
  { q: 'Kim loại nào phản ứng mãnh liệt nhất với nước?', a: 'K', wrong: ['Fe', 'Cu', 'Ag'] },
  { q: 'Nguyên tố nào có độ âm điện cao nhất?', a: 'F', wrong: ['O', 'Cl', 'N'] },
  { q: 'Khí hiếm nào phổ biến nhất trong không khí?', a: 'Ar', wrong: ['He', 'Ne', 'Kr'] },
  { q: 'Kim loại nào dẫn điện tốt nhất?', a: 'Ag', wrong: ['Cu', 'Au', 'Al'] },
  { q: 'Phi kim nào là chất lỏng ở nhiệt độ thường?', a: 'Br', wrong: ['Cl', 'I', 'F'] },
  { q: 'Kim loại kiềm nào nặng nhất?', a: 'Cs', wrong: ['K', 'Na', 'Li'] },
  { q: 'Nguyên tố nào có nhiều nhất trong vỏ Trái Đất?', a: 'O', wrong: ['Si', 'Al', 'Fe'] },
  { q: 'Khí nào nhẹ nhất?', a: 'H₂', wrong: ['He', 'N₂', 'O₂'] },
];