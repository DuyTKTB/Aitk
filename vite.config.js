import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* Tách các thư viện lớn ra chunk riêng:
   trước đây toàn bộ firebase + three + pdf nằm trong 1 file index ~1,4 MB,
   khiến lần tải đầu chậm và mỗi lần sửa code là trình duyệt phải tải lại tất cả.
   Cách tách dưới đây chỉ chia theo gói, không đổi cách import của ứng dụng. */
const BIG_VENDORS = [
  /* React phải đứng đầu: nếu để mặc định, React bị "hút" vào chunk three
     (vì @react-three/fiber import React) khiến mọi trang phải tải three. */
  [/node_modules[\\/](react|react-dom|scheduler)[\\/]/, 'vendor-react'],
  [/node_modules[\\/](@firebase|firebase)[\\/]/, 'vendor-firebase'],
  [/node_modules[\\/]@supabase[\\/]/, 'vendor-supabase'],
  /* Không tách riêng `three`: khi tách, entry bị Rollup gắn import vào chunk three
     nên mọi trang phải tải ~950 kB. Để nguyên, three chỉ nằm trong chunk Lab3D (lazy). */
  /* Không tách riêng pdf: khi tách, trang chủ vẫn preload ~460 kB pdf
     dù chưa dùng tới. Để nguyên, pdf chỉ tải khi mở công cụ cần nó. */
  [/node_modules[\\/](katex|mathjax)[\\/]/, 'vendor-math'],
  [/node_modules[\\/](framer-motion|gsap)[\\/]/, 'vendor-motion'],
];

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          for (const [re, name] of BIG_VENDORS) {
            if (re.test(id)) return name;
          }
          return undefined;
        },
      },
    },
  },
});
