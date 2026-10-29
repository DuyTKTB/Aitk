import fs from 'fs';

let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes("font-family: 'Be Vietnam Pro', var(--sans)")) {
  const rule = `/* Chuẩn hóa font chữ Việt hóa toàn bộ hệ thống */
*, *::before, *::after {
  font-family: 'Be Vietnam Pro', var(--sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
input, button, select, textarea {
  font-family: inherit;
}
`;
  css = rule + css;
  fs.writeFileSync('src/index.css', css, 'utf8');
  console.log('✓ Added universal Be Vietnam Pro rule to index.css');
}
