import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/* Tự động gộp các biến môi trường VITE_* bị lặp dòng trong file .env (ví dụ nhiều dòng VITE_GEMINI_KEY=...)
   thành chuỗi phân cách bởi dấu phẩy để Vite và Client nhận đầy đủ tất cả API keys. */
(function mergeEnvFiles() {
  const envFiles = ['.env', '.env.local'];
  const collected = {};
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq <= 0) continue;
        const k = line.slice(0, eq).trim();
        let v = line.slice(eq + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!v) continue;
        if (!collected[k]) collected[k] = [];
        v.split(/[\s,;|]+/).forEach((item) => {
          const s = item.trim();
          if (s && !collected[k].includes(s)) collected[k].push(s);
        });
      }
    } catch { /* ignore */ }
  }
  for (const [k, arr] of Object.entries(collected)) {
    if (k.startsWith('VITE_') && arr.length > 0) {
      process.env[k] = arr.join(',');
    }
  }
})();

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
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: [
      '@casualoffice/docs',
      'yjs',
      'y-prosemirror',
      '@hocuspocus/provider',
      'y-websocket',
    ],
  },
  test: {
    css: true,
    server: {
      deps: {
        inline: [/@casualoffice/, /prosemirror/],
      },
    },
  },
  server: {
    watch: {
      ignored: ['**/báo cáo/**', '**/*.docx', '**/*.pdf'],
    },
  },
  build: {
    chunkSizeWarningLimit: 1800,
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
