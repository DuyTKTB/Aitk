import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  CODON_TABLE,
  DNA_LADDER_BP,
  LIGHT_SPECTRUM_EFF,
  analyzeDnaSequence,
  calcBiuretAbsorbance,
  calcCatalaseActivity,
  calcCellularRespiration,
  calcEnergyPyramid,
  calcGelMigrationFraction,
  calcPhotosynthesisRate,
  computeMendelCross,
  sanitizeDnaSeq,
  simulateMendelOffspring,
  simulatePopulationCurve,
  simulateSirModel,
} from '../src/features/biology/bioEngine.js';
import { BIO_GROUPS, BIOLOGY_MODULES, VALID_BIO_SIM_IDS } from '../src/features/biology/biologyCatalog.js';

const ROOT = path.resolve(process.cwd());

describe('Biology Lab Engine — Cell & Metabolism', () => {
  it('models photosynthesis limiting factors, spectrum, and C3 vs C4', () => {
    const zeroLight = calcPhotosynthesisRate({ light: 0, co2: 420, temp: 25 });
    expect(zeroLight.rateO2).toBe(0);

    const redLight = calcPhotosynthesisRate({ light: 900, co2: 450, temp: 25, spectrum: 'red', plantType: 'C3' });
    const greenLight = calcPhotosynthesisRate({ light: 900, co2: 450, temp: 25, spectrum: 'green', plantType: 'C3' });
    expect(redLight.rateO2).toBeGreaterThan(greenLight.rateO2 * 2);
    expect(Object.keys(LIGHT_SPECTRUM_EFF)).toEqual(['white', 'red', 'blue', 'green']);

    const c4Hot = calcPhotosynthesisRate({ light: 1400, co2: 400, temp: 34, plantType: 'C4' });
    const c3Hot = calcPhotosynthesisRate({ light: 1400, co2: 400, temp: 34, plantType: 'C3' });
    expect(c4Hot.rateO2).toBeGreaterThan(c3Hot.rateO2);

    const denatured = calcPhotosynthesisRate({ light: 1000, co2: 420, temp: 52, plantType: 'C3' });
    expect(denatured.rateO2).toBe(0);
  });

  it('calculates aerobic (32 ATP) vs anaerobic fermentation respiration accurately', () => {
    const aero = calcCellularRespiration({ glucose: 2, oxygenPresent: true });
    expect(aero.totals.atp).toBe(64);
    expect(aero.totals.nadhProduced).toBe(20);
    expect(aero.totals.fadh2Produced).toBe(4);
    expect(aero.totals.co2).toBe(12);
    expect(aero.stages).toHaveLength(4);

    const lactic = calcCellularRespiration({ glucose: 3, oxygenPresent: false, fermentationType: 'lactic' });
    expect(lactic.totals.atp).toBe(6);
    expect(lactic.totals.co2).toBe(0);

    const ethanol = calcCellularRespiration({ glucose: 3, oxygenPresent: false, fermentationType: 'ethanol' });
    expect(ethanol.totals.atp).toBe(6);
    expect(ethanol.totals.co2).toBe(6);
  });
});

describe('Biology Lab Engine — Genetics & Molecular Biology', () => {
  it('provides a complete 64-codon genetic code table and analyzes DNA/mRNA/polypeptide', () => {
    expect(Object.keys(CODON_TABLE)).toHaveLength(64);
    expect(CODON_TABLE.AUG).toBe('Met');
    expect(CODON_TABLE.UAA).toBe('STOP');
    expect(sanitizeDnaSeq('tac-ggx-att 123')).toBe('TACGGCATT');

    // 3'-TAC CGG AAA ATT-5' -> mRNA 5'-AUG GCC UUU UAA-3' -> Met, Ala, Phe, STOP
    const res = analyzeDnaSequence('TACCGGAAAATT', 3);
    expect(res.nPairs).toBe(12);
    expect(res.N).toBe(24);
    expect(res.counts.A).toBe(res.counts.T);
    expect(res.counts.G).toBe(res.counts.C);
    expect(res.hydrogenBonds).toBe(2 * res.counts.A + 3 * res.counts.G);
    expect(res.lengthAngstrom).toBe(40.8);
    expect(res.mRNA).toBe('AUGGCCUUUUAA');
    expect(res.aminoAcids).toEqual(['Met', 'Ala', 'Phe', 'STOP']);
    expect(res.replication.totalDaughters).toBe(8);
    expect(res.replication.newOnlyDaughters).toBe(6);
    expect(res.replication.nuEnvNeeded).toBe(24 * 7);
  });

  it('computes Mendelian 1-pair (3:1), incomplete dominance (1:2:1), and 2-pair (9:3:3:1) crosses', () => {
    const mono = computeMendelCross('Aa', 'Aa');
    expect(mono.total).toBe(4);
    const monoGenos = Object.fromEntries(mono.genotypeSummary.map((g) => [g.genotype, g.count]));
    expect(monoGenos).toEqual({ AA: 1, Aa: 2, aa: 1 });

    const incomplete = computeMendelCross('Aa', 'Aa', { incompleteDominance: true });
    expect(incomplete.phenotypeSummary).toHaveLength(3);

    const dihybrid = computeMendelCross('AaBb', 'AaBb');
    expect(dihybrid.total).toBe(16);
    expect(dihybrid.phenotypeSummary.map((p) => p.count)).toEqual([9, 3, 3, 1]);

    const sim = simulateMendelOffspring(dihybrid, 320);
    expect(sim.n).toBe(320);
    expect(sim.rows.reduce((acc, r) => acc + r.observed, 0)).toBe(320);
    expect(sim.chiSquare).toBeGreaterThanOrEqual(0);
  });

  it('models inverse log-size migration in agarose gel electrophoresis', () => {
    expect(DNA_LADDER_BP.length).toBeGreaterThanOrEqual(10);
    const small = calcGelMigrationFraction(250, { voltage: 100, minutes: 40, gelPct: 1.0 });
    const large = calcGelMigrationFraction(6000, { voltage: 100, minutes: 40, gelPct: 1.0 });
    expect(small).toBeGreaterThan(large);

    const lowGel = calcGelMigrationFraction(1000, { voltage: 100, minutes: 40, gelPct: 0.8 });
    const highGel = calcGelMigrationFraction(1000, { voltage: 100, minutes: 40, gelPct: 2.0 });
    expect(lowGel).toBeGreaterThan(highGel);
    expect(calcGelMigrationFraction(1000, { voltage: 100, minutes: 0, gelPct: 1.0 })).toBe(0);
  });
});

describe('Biology Lab Engine — Ecology, SIR & Practical Biochemistry', () => {
  it('solves Exponential, Logistic, and Lotka-Volterra population curves via RK4', () => {
    const expCurve = simulatePopulationCurve({ mode: 'exponential', n0: 20, r: 0.25, K: 500, steps: 20, dt: 0.5 });
    expect(expCurve[expCurve.length - 1].N).toBeGreaterThan(expCurve[0].N);

    const logCurve = simulatePopulationCurve({ mode: 'logistic', n0: 20, r: 0.35, K: 400, steps: 80, dt: 0.5 });
    const lastN = logCurve[logCurve.length - 1].N;
    expect(lastN).toBeGreaterThan(380);
    expect(lastN).toBeLessThanOrEqual(400.5);

    const lv = simulatePopulationCurve({ mode: 'lotka', n0: 45, pred0: 12, steps: 50, dt: 0.5 });
    expect(lv.every((p) => p.prey > 0 && p.predator > 0)).toBe(true);
  });

  it('solves SIR epidemic model, preserves total population, and reflects herd immunity', () => {
    const unvax = simulateSirModel({ population: 1000, initialInfected: 10, vaccinatedPct: 0, beta: 0.4, gamma: 0.1, days: 80 });
    expect(unvax.r0).toBe(4);
    expect(unvax.herdImmunityPct).toBe(75);
    expect(unvax.peakInfected).toBeGreaterThan(250);
    const mid = unvax.series[Math.floor(unvax.series.length / 2)];
    expect(Math.abs(mid.S + mid.I + mid.R - 1000)).toBeLessThanOrEqual(3);

    const vax = simulateSirModel({ population: 1000, initialInfected: 10, vaccinatedPct: 80, beta: 0.4, gamma: 0.1, days: 80 });
    expect(vax.rEff).toBeLessThan(1);
    expect(vax.peakInfected).toBeLessThanOrEqual(15);
  });

  it('computes 10% energy pyramid, Biuret absorbance, and Catalase enzyme kinetics', () => {
    const pyr = calcEnergyPyramid(100000, 10);
    expect(pyr.map((l) => l.energy)).toEqual([100000, 10000, 1000, 100]);

    const b0 = calcBiuretAbsorbance(0);
    const b4 = calcBiuretAbsorbance(4);
    expect(b4.absorbance).toBeGreaterThan(b0.absorbance);
    expect(b4.absorbance).toBeCloseTo(0.355, 3);

    const optCat = calcCatalaseActivity({ temp: 37, ph: 7.0, substratePct: 3 });
    const coldCat = calcCatalaseActivity({ temp: 10, ph: 7.0, substratePct: 3 });
    const boiledCat = calcCatalaseActivity({ temp: 72, ph: 7.0, substratePct: 3 });
    expect(optCat.rate).toBeGreaterThan(coldCat.rate);
    expect(boiledCat.rate).toBe(0);
  });
});

describe('Biology Lab 20 Modules Catalog & App Integration Integrity', () => {
  it('registers all 20 unique biology simulations across 4 groups', () => {
    expect(BIO_GROUPS).toHaveLength(4);
    expect(BIOLOGY_MODULES).toHaveLength(20);
    expect(VALID_BIO_SIM_IDS.size).toBe(20);
    expect(BIOLOGY_MODULES.map((m) => m.num)).toEqual(
      Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, '0'))
    );
  });

  it('has all 20 lazy-loaded simulation component files present on disk', () => {
    const pageSrc = fs.readFileSync(path.join(ROOT, 'src/features/biology/BiologyLabPage.jsx'), 'utf8');
    const matches = [...pageSrc.matchAll(/import\('\.\/sims\/([^']+)'\)/g)].map((m) => m[1]);
    expect(matches).toHaveLength(20);
    matches.forEach((file) => {
      const fullPath = path.join(ROOT, 'src/features/biology/sims', file);
      expect(fs.existsSync(fullPath), `Missing sim file: ${file}`).toBe(true);
    });
  });

  it('wires #biology-lab across App, DesktopNav, ToolsPage, CommandPalette, AIChat, and SEO', () => {
    const checks = [
      ['src/App.jsx', /BiologyLabPage/],
      ['src/App.jsx', /'phong-thi-nghiem-sinh-hoc': 'biology-lab'/],
      ['src/components/DesktopNav.jsx', /#biology-lab/],
      ['src/components/ToolsPage.jsx', /id: 'biology-lab'/],
      ['src/components/CommandPalette.jsx', /biology-lab\?sim=bio-workbench/],
      ['src/components/AIChat.jsx', /#biology-lab\?sim=cell-3d/],
      ['src/hooks/useSeoHead.js', /'biology-lab':/],
    ];
    checks.forEach(([rel, pattern]) => {
      const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      expect(pattern.test(content), `Expected ${pattern} in ${rel}`).toBe(true);
    });
  });
});
