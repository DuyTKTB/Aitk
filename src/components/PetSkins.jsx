/* ============================================================
   PetSkins.jsx — ELEC AI là linh vật DUY NHẤT của web
   4 mood từ file SVG gốc: default / think / happy / wink.
   Dùng <SkinPet mood="happy" /> — tự chạy animation (chớp mắt → wink).
   ============================================================ */
import { usePetAnim } from '../hooks/usePetAnim.js';
const ELEC_SRC = {
  default: '/img/elec/elec-default.svg',
  think: '/img/elec/elec-think.svg',
  happy: '/img/elec/elec-happy.svg',
  wink: '/img/elec/elec-wink.svg',
};

/* ============================================================
   ELEC AI — linh vật chính
   ============================================================ */
export function ElecPet({ mood = 'normal', blink = false, scale = 1, justLeveledUp = false, imgKey }) {
  /* imgKey (từ hành động) đè lên biểu cảm theo mood */
  let key = imgKey || 'default';
  if (!imgKey) {
    if (mood === 'happy') key = 'happy';
    else if (mood === 'sad' || mood === 'sleepy' || mood === 'hibernating') key = 'think';
    else if (mood === 'normal' && blink) key = 'wink';
  }
  return (
    <img
      src={ELEC_SRC[key]}
      alt="ELEC AI"
      draggable={false}
      className={justLeveledUp ? 'elec-levelup' : undefined}
      style={{
        width: '100%', height: '100%', objectFit: 'contain', display: 'block',
        transform: `scale(${scale})`, transformOrigin: 'center bottom',
        userSelect: 'none', pointerEvents: 'none',
      }}
    />
  );
}

/* ============================================================
   SkinPet — tự chạy animation, chỉ cần truyền mood
   ============================================================ */
export function SkinPet({ mood = 'normal', justLeveledUp = false, imgKey }) {
  const { blink } = usePetAnim({ mood });
  const k = mood === 'hibernating' ? 0.82 : mood === 'sleepy' ? 0.92 : mood === 'sad' ? 0.96 : 1;
  return <ElecPet mood={mood} blink={blink} scale={k} justLeveledUp={justLeveledUp} imgKey={imgKey} />;
}

/* ============================================================
   CONFIG — metadata linh vật
   stages: tên 6 cấp (cùng ngưỡng với STAGES trong Pet.jsx)
   ============================================================ */
export const PET_SKINS = {
  elec: {
    key: 'elec', name: 'ELEC AI', icon: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z', color: '#2563eb', bg: '#eff6ff',
    desc: 'Linh vật chính của ELEC AI — năng lượng, thân thiện, mê hóa học', defaultName: 'Elec',
    stages: ['Tia lệnh', 'Tia sáng', 'Tia điện', 'Sét nhỏ', 'Sét mạnh', 'Siêu dẫn điện'],
    lines: ['Cùng học hóa nào, mình nạp điện đầy rồi!', 'Bạn xếp hạng mấy rồi? Hỏi mình thử đi!', 'Chơi 1 ván game là mình sạc thêm pin đó!'],
  },
};

/* Tên mặc định CŨ của skin đã bị loại — coi như chưa đặt tên */
export const LEGACY_DEFAULT_NAMES = ['Ember', 'Frosty', 'Sprout', 'Aqua'];
