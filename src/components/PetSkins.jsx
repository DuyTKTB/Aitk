/* ============================================================
   PetSkins.jsx — ELEC AI là linh vật DUY NHẤT của web
   Bộ nhận diện mới: ảnh PNG tách nền trong suốt chất lượng cao
   Đầy đủ 20+ biểu cảm tương tác sinh động
   ============================================================ */
import { usePetAnim } from '../hooks/usePetAnim.js';

export const ELEC_SRC = {
  default: '/img/elec/elec-default.png',
  hello: '/img/elec/elec-hello.png',
  think: '/img/elec/elec-think.png',
  happy: '/img/elec/elec-happy.png',
  wink: '/img/elec/elec-wink.png',
  sad: '/img/elec/elec-crying.png',
  crying: '/img/elec/elec-crying.png',
  angry: '/img/elec/elec-angry.png',
  shocked: '/img/elec/elec-shocked.png',
  sleepy: '/img/elec/elec-sleepy.png',
  love: '/img/elec/elec-love.png',
  cool: '/img/elec/elec-cool.png',
  'heart-eyes': '/img/elec/elec-heart-eyes.png',
  heartEyes: '/img/elec/elec-heart-eyes.png',
  fighting: '/img/elec/elec-fighting.png',
  shy: '/img/elec/elec-shy.png',
  exhausted: '/img/elec/elec-exhausted.png',
  celebrate: '/img/elec/elec-celebrate.png',
  grumpy: '/img/elec/elec-grumpy.png',
  plead: '/img/elec/elec-plead.png',
  'sleeping-pillow': '/img/elec/elec-sleeping-pillow.png',
  sleepingPillow: '/img/elec/elec-sleeping-pillow.png',
  'super-saiyan': '/img/elec/elec-super-saiyan.png',
  superSaiyan: '/img/elec/elec-super-saiyan.png',
  suspicious: '/img/elec/elec-suspicious.png',
};

/* ============================================================
   ELEC AI — linh vật chính
   ============================================================ */
export function ElecPet({ mood = 'normal', blink = false, scale = 1, justLeveledUp = false, imgKey }) {
  /* imgKey (từ hành động) đè lên biểu cảm theo mood */
  let key = 'default';
  if (imgKey && ELEC_SRC[imgKey]) {
    key = imgKey;
  } else if (ELEC_SRC[mood]) {
    key = mood;
  } else if (mood === 'normal') {
    key = blink ? 'wink' : 'default';
  } else if (mood === 'hibernating') {
    key = 'sleeping-pillow';
  } else if (mood === 'sleepy') {
    key = 'sleepy';
  } else if (mood === 'sad') {
    key = 'crying';
  } else if (mood === 'happy') {
    key = 'happy';
  }

  const src = ELEC_SRC[key] || ELEC_SRC.default;

  return (
    <img
      src={src}
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
    desc: 'Linh vật chính của ELEC AI — năng lượng, thân thiện, mê hóa học và khoa học tự nhiên', defaultName: 'Elec',
    stages: ['Tia lệnh', 'Tia sáng', 'Tia điện', 'Sét nhỏ', 'Sét mạnh', 'Siêu dẫn điện'],
    lines: ['Cùng học khoa học nào, mình nạp điện đầy rồi!', 'Bạn xếp hạng mấy rồi? Hỏi mình thử đi!', 'Luyện một đề thi ảo là mình sạc thêm pin đó!'],
  },
};

/* Tên mặc định CŨ của skin đã bị loại — coi như chưa đặt tên */
export const LEGACY_DEFAULT_NAMES = ['Ember', 'Frosty', 'Sprout', 'Aqua'];
