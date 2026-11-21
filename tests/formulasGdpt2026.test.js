import { describe, it, expect } from 'vitest';
import { GDPT2026_CARDS } from '../src/data/formulasGdpt2026.js';

const byId = (id) => GDPT2026_CARDS.find((c) => c.id === id);

describe('Sổ tay Công thức KHTN chuẩn GDPT 2018 / THPT 2026', () => {
  it('phủ đầy đủ 3 môn Hóa – Lý – Sinh với 25 công thức chuẩn 2026 không trùng ID', () => {
    const ids = GDPT2026_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(GDPT2026_CARDS.filter((c) => c.subject === 'hoa').length).toBe(7);
    expect(GDPT2026_CARDS.filter((c) => c.subject === 'ly').length).toBe(10);
    expect(GDPT2026_CARDS.filter((c) => c.subject === 'sinh').length).toBe(8);
  });

  it('Hóa học 2026: tính chính xác đkc 24,79, Enthalpy, Van\'t Hoff, Pin Galvani, Faraday, Chuẩn độ & Ester hóa', () => {
    const dkc = byId('hoa_dkc_2026').calc({ n: NaN, V: 2.479 });
    expect(dkc[0].v).toBeCloseTo(0.1, 4);
    const dkcVol = byId('hoa_dkc_2026').calc({ n: 0.5, V: NaN });
    expect(dkcVol[0].v).toBeCloseTo(12.395, 4);
    expect(dkcVol.map((r) => r.l).join(' ')).not.toMatch(/22[.,]4|đktc/i);

    const enthDfh = byId('hoa_enthalpy_2026').calc({ cd: -110.5, sp: -393.5 }, { mode: 'dfh' });
    expect(enthDfh[0].v).toBeCloseTo(-283.0, 2);
    expect(enthDfh[1].v).toMatch(/TỎA NHIỆT/i);

    const enthEb = byId('hoa_enthalpy_2026').calc({ cd: 678, sp: 862 }, { mode: 'eb' });
    expect(enthEb[0].v).toBeCloseTo(-184, 2);

    const vh = byId('hoa_vanthoff_2026').calc({ g: 2, T1: 20, T2: 50, v1: 1 });
    expect(vh[0].v).toBeCloseTo(8, 3);

    const pin = byId('hoa_pin_2026').calc({ e1: -0.763, e2: 0.34, n: 2 });
    expect(pin[0].v).toBeCloseTo(1.103, 3);

    const faraday = byId('hoa_faraday_2026').calc({ A: 64, n: 2, I: 5, t: 1930 });
    expect(faraday[0].v).toBeCloseTo(3.2, 3); // n_e = 0.1 -> m_Cu = 3.2 g

    const cd = byId('hoa_chuando_2026').calc({ CA: NaN, VA: 10, CB: 0.1, VB: 12.5, a: 1, b: 1 });
    expect(cd[0].v).toBeCloseTo(0.125, 4);

    const est = byId('hoa_ester_2026').calc({ na: 0.2, nb: 0.25, M: 88, H: 75 });
    expect(est[0].v).toBeCloseTo(13.2, 3);
  });

  it('Vật lí 2026: tính chính xác Nhiệt lượng, Chuyển thể, Khí lí tưởng, Lực từ, Faraday, Hạt nhân & Phóng xạ', () => {
    const q = byId('ly_nhiet_q').calc({ m: 2, c: 4180, t1: 25, t2: 100, A: 0 });
    expect(q[0].v).toBeCloseTo(627, 2); // 627 kJ

    const ct = byId('ly_chuyenthe').calc({ m: 0.5, k: 0 }, { mode: 'nc' });
    expect(ct[0].v).toBeCloseTo(167, 2); // 167 kJ

    const f = byId('ly_luc_tu').calc({ F: NaN, B: 0.2, I: 5, L: 0.5, deg: 90 });
    expect(f[0].v).toBeCloseTo(0.5, 4);

    const ec = byId('ly_cam_ung_tu').calc({ N: 100, B1: 0.5, B2: 0.1, S: 20, dt: 0.04, deg: 0 });
    expect(ec[0].v).toBeCloseTo(2, 3);

    const mba = byId('ly_may_bien_ap').calc({ U1: 220, U2: NaN, N1: 1100, N2: 110 });
    expect(mba[0].v).toBeCloseTo(22, 2);

    const elk = byId('ly_hat_nhan_elk').calc({ Z: 2, A: 4, mX: 4.0015 });
    expect(elk[0].v).toBeGreaterThan(28); // He-4 ~ 28.4 MeV

    const px = byId('ly_phong_xa').calc({ m0: 100, T: 8, t: 24 });
    expect(px[0].v).toBeCloseTo(12.5, 3);
  });

  it('Sinh học 2026: tính chính xác Phiên mã–Dịch mã, Mendel, Hoán vị gene, Tự thụ phấn, Kiểu gene & VSV', () => {
    const pm = byId('sinh_phienma_dichma').calc({ N: 3000, k: 1, ribo: 1 });
    expect(pm[0].v).toBe(498); // rN = 1500 -> 500 codon -> 498 aa hoàn chỉnh

    const md = byId('sinh_mendel').calc({ n: 3 });
    expect(md[0].v).toBe(8);
    expect(md[1].v).toBe(27);

    const hv = byId('sinh_hoanvi').calc({ f1: 20, f2: 20 }, { cis: 'cis' });
    expect(hv[0].v).toBeCloseTo(66, 2); // ab = 0.4 -> aabb = 0.16 -> A-B- = 66%

    const ttp = byId('sinh_tuthuphan').calc({ d: 0.2, h: 0.6, r: 0.2, n: 2 });
    expect(ttp[0].v).toContain('0.425 AA');
    expect(ttp[0].v).toContain('0.15 Aa');

    const kg = byId('sinh_kieu_gene_max').calc({ r: 3 });
    expect(kg[0].v).toBe(6);
    expect(kg[1].v).toBe(9);

    const vsv = byId('sinh_vsv').calc({ N0: 100, t: 120, g: 20 });
    expect(vsv[0].v).toBe(6400);

    const st = byId('sinh_sinhthai').calc({ En: 10000, En1: 1000 });
    expect(st[0].v).toBeCloseTo(10, 2);
  });
});
