#!/usr/bin/env node
/**
 * Copyright (c) 2026 Nguyễn Thế Duy (Duy TK / Tk Media) — ELEC Science AI.
 * All Rights Reserved.
 *
 * Generates and verifies a deterministic SHA-256 manifest of repository source
 * files for third-party cryptographic timestamping (OpenTimestamps / RFC 3161 TSA).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'copyright-proofs');
const MANIFEST_PATH = path.join(OUT_DIR, 'MANIFEST-SHA256.txt');
const SUMMARY_JSON_PATH = path.join(OUT_DIR, 'COPYRIGHT-PROOF-SUMMARY.json');
const SUMMARY_TXT_PATH = path.join(OUT_DIR, 'COPYRIGHT-PROOF-SUMMARY.txt');

const EXTRA_INCLUDE = [
  'LICENSE',
  'COPYRIGHT.md',
  'package.json',
  'README.md',
  'scripts/generate-copyright-manifest.mjs',
];

const INCLUDE_DIRS = [
  'src/',
  'api/',
  'functions/',
  'public/',
  'tests/',
  'scripts/',
  'docs/',
  'supabase/',
  'report/',
  'báo cáo/',
  'ELEC AI/',
];

const INCLUDE_ROOT_PATTERNS = [
  /^LICENSE$/,
  /^COPYRIGHT\.md$/,
  /^README\.md$/,
  /^index\.html$/,
  /^package\.json$/,
  /^vite\.config\.js$/,
  /^vitest\.config\.js$/,
  /^vercel\.json$/,
  /^firebase\.json$/,
  /^\.firebaserc$/,
  /^firestore\.(rules|indexes\.json)$/,
  /^(Bao[_ ]cao|BAO_CAO|NHAT_KY|PHIEU_KHAI_BAO|KE_HOACH|DINH_HUONG|ELEC_AI_ANALYSIS|AI_TEACHER_FEATURES|API_SECURITY_GUIDE).*\.(md|docx|pdf)$/i,
];

const EXCLUDE_PATTERNS = [
  /^copyright-proofs\//i,
  /^\.env(\.|$)/i,
  /serviceAccountKey\.json$/i,
  /credentials\.json$/i,
  /\.(pem|key|p12|pfx|jks|ots|tsr|tsq|log|db)$/i,
  /^node_modules\//i,
  /^dist\//i,
  /^\.(agents|claude|kombai|buyer-execution-hooks)\//i,
];

function isInFirstPartyScope(relPath) {
  if (INCLUDE_DIRS.some((prefix) => relPath.startsWith(prefix))) {
    return true;
  }
  if (!relPath.includes('/')) {
    return INCLUDE_ROOT_PATTERNS.some((re) => re.test(relPath));
  }
  return false;
}

function isExcluded(relPath) {
  return EXCLUDE_PATTERNS.some((re) => re.test(relPath)) || !isInFirstPartyScope(relPath);
}

function sha256File(absPath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absPath));
  return hash.digest('hex');
}

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function runGit(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).trim();
  } catch {
    return '';
  }
}

function collectFiles() {
  const set = new Set();
  const gitOutput = runGit('git ls-files -z');
  if (gitOutput) {
    for (const raw of gitOutput.split('\0')) {
      const rel = raw.replace(/\\/g, '/').trim();
      if (!rel || isExcluded(rel)) continue;
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
        set.add(rel);
      }
    }
  }
  for (const rel of EXTRA_INCLUDE) {
    if (isExcluded(rel)) continue;
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      set.add(rel);
    }
  }
  return Array.from(set).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function verifyManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`[ERROR] Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }
  const lines = fs
    .readFileSync(MANIFEST_PATH, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  let ok = 0;
  let failed = 0;
  let missing = 0;

  for (const line of lines) {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/i);
    if (!match) {
      console.error(`[INVALID LINE] ${line}`);
      failed++;
      continue;
    }
    const [, expectedHash, relPath] = match;
    const absPath = path.join(ROOT, relPath);
    if (!fs.existsSync(absPath)) {
      console.error(`[MISSING] ${relPath}`);
      missing++;
      continue;
    }
    const actualHash = sha256File(absPath);
    if (actualHash !== expectedHash.toLowerCase()) {
      console.error(`[MISMATCH] ${relPath}`);
      failed++;
    } else {
      ok++;
    }
  }

  const manifestHash = sha256File(MANIFEST_PATH);
  console.log(`Manifest SHA-256 : ${manifestHash}`);
  console.log(`Verified OK      : ${ok} files`);
  console.log(`Mismatched       : ${failed} files`);
  console.log(`Missing          : ${missing} files`);

  if (failed > 0 || missing > 0) {
    process.exit(1);
  }
  console.log('STATUS: ALL FILES MATCH MANIFEST 100%.');
}

function generateManifest() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const files = collectFiles();

  let totalBytes = 0;
  const lines = [];

  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    const stat = fs.statSync(abs);
    totalBytes += stat.size;
    const digest = sha256File(abs);
    lines.push(`${digest}  ${rel}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifestContent = lines.join('\n') + '\n';
  fs.writeFileSync(MANIFEST_PATH, manifestContent, 'utf8');

  const manifestSha256 = sha256Buffer(Buffer.from(manifestContent, 'utf8'));
  const gitCommit = runGit('git rev-parse HEAD') || 'unknown';
  const gitBranch = runGit('git rev-parse --abbrev-ref HEAD') || 'unknown';
  const gitCommitDate = runGit('git log -1 --format=%cI') || 'unknown';
  const gitRemote = runGit('git remote get-url origin') || 'unknown';
  const generatedAtUtc = new Date().toISOString();

  const summary = {
    project: 'ELEC Science AI (ELEC AI)',
    packageName: pkg.name,
    version: pkg.version,
    license: 'All Rights Reserved (UNLICENSED)',
    copyrightOwner: typeof pkg.author === 'object' ? pkg.author.name : pkg.author || 'Nguyễn Thế Duy',
    contactEmail: typeof pkg.author === 'object' ? pkg.author.email : 'duyfamabo@gmail.com',
    officialWebsite: pkg.homepage || 'https://www.elecai.id.vn/',
    repository: gitRemote,
    gitBranch,
    gitCommit,
    gitCommitDate,
    generatedAtUtc,
    totalFilesHashed: files.length,
    totalBytesHashed: totalBytes,
    manifestFile: 'copyright-proofs/MANIFEST-SHA256.txt',
    manifestSha256,
    howToTimestamp: [
      '1. Upload ONLY copyright-proofs/MANIFEST-SHA256.txt (not your source code) to https://opentimestamps.org/',
      '2. Download the resulting MANIFEST-SHA256.txt.ots file and store it in copyright-proofs/',
      '3. Keep an immutable backup/archive or Git commit of this exact snapshot alongside the .ots proof.',
    ],
  };

  fs.writeFileSync(SUMMARY_JSON_PATH, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const summaryTxt = [
    '========================================================================',
    '  ELEC SCIENCE AI — CRYPTOGRAPHIC COPYRIGHT MANIFEST SUMMARY (SHA-256)  ',
    '========================================================================',
    `Project          : ${summary.project} (${summary.packageName} v${summary.version})`,
    `Copyright Owner  : ${summary.copyrightOwner} <${summary.contactEmail}>`,
    `License          : ${summary.license}`,
    `Official Website : ${summary.officialWebsite}`,
    `Repository       : ${summary.repository}`,
    `Git Branch       : ${summary.gitBranch}`,
    `Git HEAD Commit  : ${summary.gitCommit}`,
    `Git Commit Date  : ${summary.gitCommitDate}`,
    `Generated (UTC)  : ${summary.generatedAtUtc}`,
    `Files Hashed     : ${summary.totalFilesHashed}`,
    `Total Size       : ${summary.totalBytesHashed.toLocaleString('en-US')} bytes`,
    '------------------------------------------------------------------------',
    `MASTER SHA-256 (MANIFEST-SHA256.txt):`,
    `  ${summary.manifestSha256}`,
    '========================================================================',
    'Verification command:',
    '  npm run copyright:verify',
    '',
    'OpenTimestamps (Bitcoin Blockchain Proof — Free & Private):',
    '  Drop copyright-proofs/MANIFEST-SHA256.txt onto https://opentimestamps.org/',
    '  Save the downloaded MANIFEST-SHA256.txt.ots into copyright-proofs/',
    '========================================================================',
    '',
  ].join('\n');

  fs.writeFileSync(SUMMARY_TXT_PATH, summaryTxt, 'utf8');

  console.log(summaryTxt);
}

if (process.argv.includes('--verify')) {
  verifyManifest();
} else {
  generateManifest();
}
