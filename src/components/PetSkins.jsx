/* ============================================================
   PetSkins.jsx — ELEC AI là linh vật DUY NHẤT của web
   - Bộ 22 biểu cảm gốc tách nền chuẩn Studio (/img/elec/elec-*.png)
   - Bộ 105 Trang phục Đồng phục Trường Đại học & Học viện (/img/elec/outfits/<id>.webp)
   - Hỗ trợ chế độ Tự động mặc đồng phục theo Nguyện vọng 1 (Auto NV1)
     hoặc tự chọn bất kỳ trường ĐH / biểu cảm nào trong Tủ đồ Linh vật
   ============================================================ */
import { usePetAnim } from '../hooks/usePetAnim.js';
import referenceData from '../data/admissionsReference.json';
import { getUniversityInfo } from '../data/universityCovers.js';

export const ELEC_SRC = {
  default: '/img/elec/elec-default.png',
  hello: '/img/elec/elec-hello.png',
  think: '/img/elec/elec-think.png',
  happy: '/img/elec/elec-happy.png',
  wink: '/img/elec/elec-wink.png',
  sad: '/img/elec/elec-sad.png',
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

export const CLASSIC_ELEC_OUTFITS = [
  { id: 'classic:hello', key: 'hello', name: 'ELEC Chào hỏi (Mặc định)', tag: 'Gốc', src: ELEC_SRC.hello },
  { id: 'classic:super-saiyan', key: 'super-saiyan', name: 'ELEC Siêu Saiyan (Bứt phá)', tag: 'Huyền thoại', src: ELEC_SRC['super-saiyan'] },
  { id: 'classic:fighting', key: 'fighting', name: 'ELEC Chiến thần Ôn thi', tag: 'Năng lượng', src: ELEC_SRC.fighting },
  { id: 'classic:cool', key: 'cool', name: 'ELEC Kính đen Cực ngầu', tag: 'Phong cách', src: ELEC_SRC.cool },
  { id: 'classic:celebrate', key: 'celebrate', name: 'ELEC Ăn mừng Đỗ Đại học', tag: 'Chiến thắng', src: ELEC_SRC.celebrate },
  { id: 'classic:wink', key: 'wink', name: 'ELEC Nháy mắt Tự tin', tag: 'Thân thiện', src: ELEC_SRC.wink },
  { id: 'classic:happy', key: 'happy', name: 'ELEC Cười tươi Rạng rỡ', tag: 'Tích cực', src: ELEC_SRC.happy },
  { id: 'classic:love', key: 'love', name: 'ELEC Thả tim Yêu thương', tag: 'Dễ thương', src: ELEC_SRC.love },
  { id: 'classic:heart-eyes', key: 'heart-eyes', name: 'ELEC Mắt trái tim Mê KHTN', tag: 'Đam mê', src: ELEC_SRC['heart-eyes'] },
  { id: 'classic:think', key: 'think', name: 'ELEC Đăm chiêu Giải đề', tag: 'Học thuật', src: ELEC_SRC.think },
  { id: 'classic:shy', key: 'shy', name: 'ELEC Ngại ngùng Khiêm tốn', tag: 'Dễ thương', src: ELEC_SRC.shy },
  { id: 'classic:plead', key: 'plead', name: 'ELEC Năn nỉ Học bài', tag: 'Đáng yêu', src: ELEC_SRC.plead },
  { id: 'classic:shocked', key: 'shocked', name: 'ELEC Bất ngờ Điểm cao', tag: 'Cảm xúc', src: ELEC_SRC.shocked },
  { id: 'classic:suspicious', key: 'suspicious', name: 'ELEC Soi bẫy Đề thi', tag: 'Tỉnh táo', src: ELEC_SRC.suspicious },
  { id: 'classic:grumpy', key: 'grumpy', name: 'ELEC Dỗi vì Quên chuỗi', tag: 'Nhắc nhở', src: ELEC_SRC.grumpy },
  { id: 'classic:angry', key: 'angry', name: 'ELEC Quyết tâm Phục thù', tag: 'Máu lửa', src: ELEC_SRC.angry },
  { id: 'classic:sleepy', key: 'sleepy', name: 'ELEC Ngáp ngủ Đêm khuya', tag: 'Thư giãn', src: ELEC_SRC.sleepy },
  { id: 'classic:sleeping-pillow', key: 'sleeping-pillow', name: 'ELEC Ôm gối Ngủ ngon', tag: 'Nghỉ ngơi', src: ELEC_SRC['sleeping-pillow'] },
  { id: 'classic:exhausted', key: 'exhausted', name: 'ELEC Xả hơi Sau kỳ thi', tag: 'Hài hước', src: ELEC_SRC.exhausted },
  { id: 'classic:sad', key: 'sad', name: 'ELEC Buồn nhẹ Cần khích lệ', tag: 'Đồng cảm', src: ELEC_SRC.sad },
  { id: 'classic:crying', key: 'crying', name: 'ELEC Khóc nhè Sửa câu sai', tag: 'Cảm xúc', src: ELEC_SRC.crying },
];

/* ── Danh sách 105 bộ đồng phục trường Đại học & Học viện ── */
export function getUniversityMascotOutfits() {
  const schools = referenceData.schools || [];
  return schools.map((s) => {
    const id = String(s.id || s.code).toUpperCase();
    const fileKey = id.toLowerCase();
    return {
      id: `uni:${id}`,
      schoolId: id,
      code: s.code || id,
      admissionCode: s.admissionCode || s.code || id,
      name: s.name,
      shortName: s.shortName || s.name,
      city: s.city || 'Hà Nội',
      region: s.region || 'Miền Bắc',
      group: s.group || 'Đa ngành',
      color: s.coverColor || '#2563eb',
      src: `/img/elec/outfits/${fileKey}.webp`,
    };
  });
}

/**
 * Lấy đường dẫn ảnh trang phục theo mã trường ĐH (hỗ trợ cả alias như HUST->BKA, QSB->HCMUT, PTIT->BVH...)
 */
export function getUniversityMascotOutfitSrc(schoolCode) {
  if (!schoolCode) return null;
  const info = getUniversityInfo(schoolCode);
  const canonicalId = String(info?.id || schoolCode).trim().toLowerCase();
  return `/img/elec/outfits/${canonicalId}.webp`;
}

export const MASCOT_OUTFIT_CHANGE_EVENT = 'elec-mascot-outfit-changed';

export function getMascotOutfitStorageKey(uid = 'guest') {
  return `cs-elec-mascot-outfit:${uid || 'guest'}`;
}

/**
 * Đọc cấu hình trang phục linh vật hiện tại của học sinh:
 * - mode: 'auto_nv1' (Tự động mặc đồng phục trường Nguyện vọng 1) | 'uni' (Trường ĐH cụ thể) | 'classic' (Biểu cảm gốc)
 * - value: mã trường ĐH (VD: 'NEU', 'BKA', 'ANND') hoặc key biểu cảm (VD: 'hello', 'super-saiyan')
 */
export function getSavedMascotOutfit(uid = 'guest') {
  try {
    const raw = localStorage.getItem(getMascotOutfitStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.mode) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return { mode: 'auto_nv1', value: 'hello' };
}

export function saveMascotOutfit(uid = 'guest', outfitConfig) {
  const next = outfitConfig && typeof outfitConfig === 'object'
    ? outfitConfig
    : { mode: 'auto_nv1', value: 'hello' };
  try {
    localStorage.setItem(getMascotOutfitStorageKey(uid), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(MASCOT_OUTFIT_CHANGE_EVENT, { detail: { uid, outfit: next } }));
  } catch { /* ignore */ }
  return next;
}

/**
 * Phân giải ảnh linh vật góc màn hình dựa trên cấu hình tủ đồ & Nguyện vọng 1 hiện tại
 */
export function resolveCornerMascotOutfit({ outfitConfig, nv1SchoolCode, isOpen = false } = {}) {
  const cfg = outfitConfig || { mode: 'auto_nv1', value: 'hello' };

  if (cfg.mode === 'uni' && cfg.value) {
    const info = getUniversityInfo(cfg.value);
    const id = String(info?.id || cfg.value).toUpperCase();
    return {
      mode: 'uni',
      schoolId: id,
      badge: info?.code || id,
      label: info?.shortName || info?.name || id,
      fullName: info?.name || id,
      src: `/img/elec/outfits/${id.toLowerCase()}.webp`,
      color: info?.accentColor || '#2563eb',
    };
  }

  if (cfg.mode === 'auto_nv1' && nv1SchoolCode) {
    const info = getUniversityInfo(nv1SchoolCode);
    const id = String(info?.id || nv1SchoolCode).toUpperCase();
    return {
      mode: 'auto_nv1',
      schoolId: id,
      badge: `NV1 · ${info?.code || id}`,
      label: info?.shortName || info?.name || id,
      fullName: info?.name || id,
      src: `/img/elec/outfits/${id.toLowerCase()}.webp`,
      color: info?.accentColor || '#2563eb',
    };
  }

  const classicKey = cfg.mode === 'classic' && ELEC_SRC[cfg.value]
    ? cfg.value
    : (isOpen ? 'wink' : 'hello');
  const classicMeta = CLASSIC_ELEC_OUTFITS.find((c) => c.key === classicKey);

  return {
    mode: 'classic',
    schoolId: null,
    badge: classicMeta && cfg.mode === 'classic' && cfg.value !== 'hello' ? classicMeta.tag : null,
    label: classicMeta?.name || 'ELEC AI',
    fullName: classicMeta?.name || 'Linh vật ELEC AI',
    src: ELEC_SRC[classicKey] || ELEC_SRC.hello,
    color: '#2563eb',
  };
}

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
