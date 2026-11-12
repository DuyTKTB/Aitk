import fs from 'fs';

const buf = fs.readFileSync('public/ve.wasm');
const { instance } = await WebAssembly.instantiate(buf, {});
const eng = instance.exports;
const dec = new TextDecoder();
const enc = new TextEncoder();

function passString(fn, str) {
  const bytes = enc.encode(str);
  const ptr = eng.mv_cap(bytes.length);
  new Uint8Array(eng.memory.buffer, ptr, bytes.length).set(bytes);
  const resPtr = fn(ptr, bytes.length);
  eng.mv_tra(ptr, bytes.length);
  const len = eng.mv_do_dai();
  return JSON.parse(dec.decode(new Uint8Array(eng.memory.buffer, resPtr, len)));
}

const id = eng.mv_moi(1, 0);

const code = `
A = (-3.2, 0, 0)
B = (-0.6, -2.6, 0)
C = (3.5, 0, 0)
S = (0.2, 0.4, 5.0)
G = (1.0, -0.7, 1.6)
Point(G)
Point(H, 0.4, -1.9, 0)
H = (0.4, -1.9, 0)
Text("G", 1.0, -0.7, 1.6)
`;

passString((ptr, len) => eng.mv_dat(id, ptr, len), code);
const resPtr = eng.mv_ve(id, 600, 400, -1.22, 0.36, 1.0, 1e6);
const len = eng.mv_do_dai();
const res = JSON.parse(dec.decode(new Uint8Array(eng.memory.buffer, resPtr, len)));

console.log('Labels count:', res.m.filter(x => x.t === 'c').length);
console.log('Labels:', res.m.filter(x => x.t === 'c').map(x => x.s));
