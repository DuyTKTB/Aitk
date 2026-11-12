import fs from 'fs';

const buf = fs.readFileSync('public/ve.wasm');
const { instance } = await WebAssembly.instantiate(buf, {});
const eng = instance.exports;
const dec = new TextDecoder();

function getJson(ptr) {
  const len = eng.mv_do_dai();
  return JSON.parse(dec.decode(new Uint8Array(eng.memory.buffer, ptr, len)));
}

for (const [b, h] of [[1, 0], [1, 1], [0, 0], [0, 1]]) {
  const id = eng.mv_moi(b, h);
  const res = getJson(eng.mv_ve(id, 600, 400, -1.22, 0.36, 1.0, 1e6));
  console.log(`mv_moi(${b}, ${h}): elements count = ${res.m?.length || 0}`);
  if (res.m && res.m.length > 0) {
    const labels = res.m.filter(x => x.t === 'c').map(x => x.s);
    console.log(`   labels:`, labels);
  }
}
