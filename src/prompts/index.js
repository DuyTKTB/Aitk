import { HOC_HOA } from './hocHoa.js';       // 50 prompt
import { HOC_TOAN } from './hocToan.js';     // 30 prompt
import { HOC_LY } from './hocLy.js';         // 25 prompt
import { HOC_SINH } from './hocSinh.js';     // 20 prompt
import { HOC_VAN } from './hocVan.js';       // 20 prompt
import { ANH } from './anh.js';              // 30 prompt (Tiếng Anh)
import { VIET } from './viet.js';            // 30 prompt
import { DICH } from './dich.js';            // 20 prompt
import { VIDEO } from './video.js';          // 20 prompt
import { SANG_TAO } from './sangTao.js';     // 20 prompt
import { CODE } from './code.js';            // 30 prompt
import { MKT } from './mkt.js';              // 25 prompt
import { DOI_SONG } from './doiSong.js';     // 20 prompt
const TAO_ANH = [
  {
    id: 'anh-san-pham',
    cat: 'anh-ao',
    title: 'Ảnh sản phẩm đồ uống',
    desc: 'Ảnh quảng cáo kiểu studio cho ly trà sữa, cà phê, nước ép. Prompt tiếng Anh chi tiết.',
    tags: ['sản phẩm', 'F&B', 'chi tiết'],
    prompt: `Professional commercial product photograph of {{product}} placed on a {{surface}}.

LIGHTING: soft diffused window light from the left, subtle rim light on the right edge, warm color temperature around 4500K.

COMPOSITION: shallow depth of field (f/2.8), focus on the product's front label, slight top-down angle (15 degrees), rule of thirds.

DETAILS: condensation droplets on the glass, fresh ice cubes, a few drops of liquid on the surface, subtle steam rising if hot drink.

BACKGROUND: clean {{color}} seamless backdrop, soft gradient from top to bottom, no distracting elements.

CAMERA: 85mm prime lens, full-frame sensor, eye-level perspective, high detail, sharp focus on product.

STYLE: commercial food photography, editorial magazine quality, minimalist, premium feel.

TECHNICAL: 4:5 aspect ratio, high resolution, no text overlay, no watermark, no people visible.

NEGATIVE: no blurry product, no oversaturated colors, no cluttered background, no plastic-looking textures.`,
    long: true,
  },
  {
    id: 'anh-poster-hoa',
    cat: 'anh-ao',
    title: 'Poster khoa học isometric',
    desc: 'Phòng lab 3D với đồ thủy tinh phát sáng và phân tử bay lơ lửng. Có palette màu và chi tiết.',
    tags: ['poster', 'hóa học', 'chi tiết'],
    prompt: `Isometric 3D illustration of a {{science topic}} laboratory scene.

MAIN ELEMENTS: glowing glassware (beakers, flasks, test tubes), floating molecules connected by thin lines, a microscope in the corner, a periodic table poster on the wall, small plants in glass containers.

COLOR PALETTE: deep navy background (#0a1230), electric blue glow (#2f6bff), cyan accents (#7db3ff), warm orange highlights (#ff8c42) for contrast.

LIGHTING: soft studio lighting from top-left, glowing elements emit their own light, subtle shadows on the floor.

STYLE: clean vector-like illustration, isometric perspective (30-degree angle), minimal background, no people, no text.

COMPOSITION: centered laboratory bench, elements balanced across the frame, negative space at the top for potential title.

TECHNICAL: 16:9 aspect ratio, high resolution, suitable for poster or presentation cover.

NEGATIVE: no realistic photo textures, no cluttered background, no dark unreadable areas.`,
    long: true,
  },
  {
    id: 'anh-logo',
    cat: 'anh-ao',
    title: 'Logo tối giản',
    desc: 'Biểu tượng hình học phẳng, dễ thu phóng, nền trơn. Có hướng dẫn về negative space.',
    tags: ['logo', 'thương hiệu', 'chi tiết'],
    prompt: `Minimal flat vector logo design for "{{brand name}}", a {{business type}}.

DESIGN PRINCIPLES:
- Simple geometric icon, maximum 3 shapes.
- Balanced negative space.
- Recognizable at 16x16 px (favicon) and scalable to billboard size.

COLOR: {{color}} and white, maximum 2 colors, no gradients, no shadows.

COMPOSITION: icon centered on plain background, generous padding around the icon (at least 20% of canvas).

STYLE: modern, timeless, professional, no trendy effects that age quickly.

TECHNICAL: vector format, clean edges, no anti-aliasing artifacts, suitable for print and digital.

NEGATIVE: no text in the logo (unless it's a single letter), no 3D effects, no photorealism, no clip-art style, no busy details.`,
    long: true,
  },
  {
    id: 'anh-bia',
    cat: 'anh-ao',
    title: 'Ảnh bìa Facebook',
    desc: 'Banner ngang chừa chỗ bên trái để chèn chữ. Có hướng dẫn bố cục.',
    tags: ['banner', 'social', 'chi tiết'],
    prompt: `Wide cover banner for a {{business type}}.

ATMOSPHERE: warm inviting atmosphere, {{theme}} color palette, natural light, welcoming feel.

COMPOSITION:
- Empty space on the LEFT third for text overlay (logo, tagline).
- Main subject on the RIGHT two-thirds.
- Rule of thirds applied horizontally.

LIGHTING: soft cinematic lighting, golden hour if outdoor, warm interior if indoor, subtle lens flare acceptable.

STYLE: cinematic, editorial, aspirational but achievable, no excessive filters.

TECHNICAL: 16:9 aspect ratio (1920x1080 or larger), high resolution, sharp focus on main subject.

NEGATIVE: no text baked into image, no cluttered foreground, no watermark, no low-resolution artifacts.`,
    long: true,
  },
  {
    id: 'anh-nhan-vat',
    cat: 'anh-ao',
    title: 'Nhân vật nhà khoa học hoạt hình',
    desc: 'Linh vật 3D dễ thương dùng cho bài giảng, sticker, avatar. Có hướng dẫn biểu cảm.',
    tags: ['nhân vật', '3D', 'chi tiết'],
    prompt: `Cute 3D cartoon scientist character holding a {{object}}.

CHARACTER DESIGN:
- Pixar-style proportions (large head, expressive eyes, small body).
- Friendly, approachable expression with a warm smile.
- Simple clothing: white lab coat, safety goggles pushed up on forehead.
- Holding {{object}} in one hand, other hand giving a thumbs up.

STYLE: Pixar/Disney animation style, soft rounded shapes, subtle subsurface scattering on skin, soft rim light.

LIGHTING: soft key light from front-left, fill light from right, subtle rim light from behind, warm color temperature.

BACKGROUND: pastel {{color}} seamless backdrop, soft gradient, no distracting elements.

COMPOSITION: character centered, full body or 3/4 body visible, eye contact with viewer.

TECHNICAL: high quality render, 1:1 aspect ratio (avatar-friendly), transparent background option.

NEGATIVE: no realistic human proportions, no scary expressions, no cluttered background, no visible text.`,
    long: true,
  },
  {
    id: 'anh-phong-canh',
    cat: 'anh-ao',
    title: 'Phong cảnh điện ảnh',
    desc: 'Cảnh rộng có ánh sáng khối, sương mỏng và màu phim. Có hướng dẫn color grading.',
    tags: ['phong cảnh', 'chi tiết'],
    prompt: `Cinematic wide shot of {{place}} at {{time of day}}.

ATMOSPHERE: volumetric light rays, atmospheric haze in the distance, subtle fog near the ground, dust particles floating in the air.

COLOR GRADING: rich cinematic color palette, teal and orange if applicable, deep shadows with lifted blacks, warm highlights.

COMPOSITION: wide establishing shot, rule of thirds, foreground element for depth, midground subject, background receding into haze.

LIGHTING: natural light (golden hour / blue hour / dramatic overcast), strong directional light, long shadows.

STYLE: 35mm film look, subtle grain, cinematic aspect ratio (2.39:1 or 16:9), Ansel Adams meets Roger Deakins.

TECHNICAL: ultra detailed, high dynamic range, sharp focus on foreground and midground, soft focus in background.

NEGATIVE: no HDR over-processing, no oversaturated colors, no people in frame (unless specified), no text, no watermark.`,
    long: true,
  },
];
export const PROMPTS = [
  ...HOC_HOA,
  ...HOC_TOAN,
  ...HOC_LY,
  ...HOC_SINH,
  ...HOC_VAN,
  ...ANH,
  ...VIET,
  ...DICH,
  ...TAO_ANH,
  ...VIDEO,
  ...SANG_TAO,
  ...CODE,
  ...MKT,
  ...DOI_SONG,
];
export { PROMPT_CATS, GUIDE_STEPS } from './cats.js';