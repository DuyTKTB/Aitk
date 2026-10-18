#!/usr/bin/env node
/**
 * CSS Consolidation Script for ELEC AI (ESM version)
 * Gộp 119 file CSS thành 12 file theo tính năng
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = 'src';
const stylesDir = 'src/styles';

// CSS grouping rules
const cssGroups = {
  'core.css': {
    source: [
      'styles/tokens.css',
      'index.css',
      'theme-sandra.css',
      'fx.css',
      'fx-fallback.css',
      'app-extra.css'
    ],
    description: 'Core: reset, typography, base tokens'
  },
  'home.css': {
    source: [
      'home-extras.css',
      'home-fx.css',
      'home-glass.css',
      'home-plus.css',
      'home-polish.css',
      'home-stack.css',
      'home-wow.css',
      'nav-home-v2.css',
      'components/home-dashboard.css',
      'components/home-features.css',
      'components/home-lindy.css',
      'components/home-pro.css'
    ],
    lazy: true
  },
  'tools.css': {
    source: [
      'tools-all.css',
      'tools-calm.css',
      'tools-cards-v2.css',
      'tools-hub.css',
      'tools-neo.css',
      'tools-page.css',
      'tools-plus.css',
      'tools-upgrade.css',
      'tools-upgrade-2.css',
      'tools-upgrade-3.css',
      'components/tools-neo.css',
      'styles/tools-apple.css'
    ],
    lazy: true
  },
  'games.css': {
    source: [
      'games-upgrade.css',
      'styles/classroom-games.css',
      'components/games/lab.css',
      'features/lab3d/lab3d.css'
    ],
    lazy: true
  },
  'aichat.css': {
    source: [
      'styles/aichat.css',
      'styles/ai-intelligence.css',
      'components/chat-widget.css',
      'components/ai-features.css',
      'components/ai-quiz-generator.css'
    ],
    lazy: true
  },
  'exam.css': {
    source: [
      'exam-formula.css',
      'styles/exam-manage.css',
      'styles/exam-pro.css',
      'styles/exam-preview-simulator.css',
      'styles/exam-result-v2.css',
      'styles/exam-result-plus.css',
      'styles/exam-importer.css',
      'styles/autoexam-studio.css',
      'styles/autoexam-studio-v5.css'
    ],
    lazy: true
  },
  'teacher.css': {
    source: [
      'styles/teacher-ds.css',
      'styles/teacher-pro.css',
      'styles/teacher-apple.css',
      'styles/teacher-mobile-fix.css',
      'styles/teacher-simulator-hub.css',
      'styles/teacher-studio.css',
      'styles/teacher-tokens.css',
      'styles/teacher-dashboard-v2.css',
      'styles/teacher-fullscreen-blue.css'
    ],
    lazy: true
  },
  'admin.css': {
    source: [
      'admin.css',
      'admin-dashboard.css',
      'admin-upgrade.css',
      'stats.css',
      'study-sheet.css',
      'styles/admin-apple.css',
      'styles/admin-enhance.css',
      'styles/admin-polish.css',
      'styles/admin-teacher.css'
    ],
    lazy: true
  },
  'classroom.css': {
    source: [
      'styles/classroom.css',
      'styles/class-apple.css',
      'styles/class-detail.css',
      'styles/my-classes.css',
      'styles/live-session-banner.css',
      'styles/live-proctor.css'
    ],
    lazy: true
  },
  'landing.css': {
    source: [
      'components/landing.css',
      'components/landing-v3.css',
      'components/landing-ocean.css',
      'components/landing-class.css',
      'components/landing-3d.css',
      'components/landing-more.css',
      'components/landing-pro.css',
      'components/HeroLindy.css'
    ],
    lazy: true
  },
  'profiles.css': {
    source: [
      'components/AuthProfile.css',
      'components/ProfileFB.css',
      'components/LoginPage.css',
      'components/LoginPage-v2.css',
      'components/LabProfile.css'
    ],
    lazy: true
  },
  'utils.css': {
    source: [
      'styles/violation-overlay.css',
      'styles/round-polish.css',
      'styles/dash-vitality.css',
      'components/element-modal.css',
      'components/formula-library.css',
      'components/periodic-table.css',
      'components/notebook-v2.css',
      'components/notebook-guide.css',
      'components/question-bank.css',
      'components/paper-grading.css'
    ],
    lazy: true
  }
};

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

function backup() {
  const backupDir = `backup-css-${Date.now()}`;
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  let count = 0;
  walkDir(srcDir, (file) => {
    if (file.endsWith('.css')) {
      const dest = path.join(backupDir, path.relative(srcDir, file));
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(file, dest);
      count++;
    }
  });

  console.log(`✅ Backup tạo ở: ${backupDir}/ (${count} files)`);
  return backupDir;
}

function consolidate() {
  console.log('\n📦 Đang gộp CSS...\n');

  const results = [];

  for (const [outputFile, config] of Object.entries(cssGroups)) {
    const outputPath = path.join(stylesDir, outputFile);
    let content = '';

    content += `/* =====================================================\n`;
    content += ` * ${outputFile}\n`;
    content += ` * ${config.description || 'Consolidated CSS'}\n`;
    content += ` * Generated: ${new Date().toISOString()}\n`;
    content += ` * ===================================================== */\n\n`;

    let successCount = 0;
    let failCount = 0;

    for (const srcFile of config.source) {
      const fullPath = path.join(srcDir, srcFile);

      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const lines = fileContent.split('\n').length;

        content += `/* ----- ${srcFile} (${lines} lines) ----- */\n`;
        content += fileContent;
        content += '\n\n';

        successCount++;
      } else {
        console.warn(`⚠️  File không tìm: ${srcFile}`);
        failCount++;
      }
    }

    fs.writeFileSync(outputPath, content, 'utf8');

    const sizeKb = (Buffer.byteLength(content) / 1024).toFixed(1);
    results.push({
      file: outputFile,
      merged: successCount,
      missing: failCount,
      size: `${sizeKb}KB`
    });

    console.log(`✅ ${outputFile.padEnd(20)} → ${sizeKb.padStart(8)}KB (${successCount}/${config.source.length} files)`);
  }

  return results;
}

async function main() {
  console.log('\n🎨 CSS CONSOLIDATION SCRIPT\n');

  backup();
  const results = consolidate();

  console.log('\n✅ Hoàn thành!');
  console.log('📌 Tiếp theo: npm run build\n');
}

main().catch(console.error);
