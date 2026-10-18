#!/usr/bin/env node
/**
 * CSS Consolidation Script for ELEC AI
 * Gộp 119 file CSS thành 12 file theo tính năng
 * 
 * Usage: node consolidate-css.js --backup --verify
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const srcDir = 'src';
const stylesDir = 'src/styles';
const componentsDir = 'src/components';

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
    description: 'Home page styles (12 file gộp)',
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
    description: 'Tools page (12 file gộp)',
    lazy: true
  },
  'games.css': {
    source: [
      'games-upgrade.css',
      'styles/classroom-games.css',
      'components/games/lab.css',
      'features/lab3d/lab3d.css'
    ],
    description: 'Games & lab (4 file)',
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
    description: 'AI Chat styles (5 file)',
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
    description: 'Exam & quiz styles (9 file)',
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
    description: 'Teacher dashboard (9 file)',
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
    description: 'Admin panel (9 file)',
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
    description: 'Classroom & class (6 file)',
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
    description: 'Landing page (8 file)',
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
    description: 'Profile & auth styles (5 file)',
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
      'components/notebook-guide.css'
    ],
    description: 'Utility & component styles (8 file)',
    lazy: true
  }
};

// Files to keep as-is (component-specific)
const keepAsIs = [
  'src/components/FormulaCalculator.css',
  'src/components/CommandPalette.css',
  'src/components/CreditTopUp.css',
  'src/components/SubjectPicker.css',
  'src/components/Pomodoro.css',
  'src/components/Notes.jsx',
  'src/ui/ui.css',
  'src/pages/pages.css',
  'src/components/social/social.css'
];

// ============================================================
// 1. BACKUP
// ============================================================
function backup() {
  const backupDir = `backup-css-${Date.now()}`;
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const cssFiles = [];
  walkDir(srcDir, (file) => {
    if (file.endsWith('.css')) {
      const dest = path.join(backupDir, path.relative(srcDir, file));
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(file, dest);
      cssFiles.push(file);
    }
  });

  console.log(`✅ Backup tạo ở: ${backupDir}/`);
  console.log(`   Files: ${cssFiles.length} file CSS`);
  return backupDir;
}

// ============================================================
// 2. CONSOLIDATE
// ============================================================
function consolidate() {
  console.log('\n📦 Đang gộp CSS...\n');

  const results = [];

  for (const [outputFile, config] of Object.entries(cssGroups)) {
    const outputPath = path.join(stylesDir, outputFile);
    let content = '';

    // Header
    content += `/* =====================================================\n`;
    content += ` * ${outputFile}\n`;
    content += ` * ${config.description}\n`;
    content += ` * Generated: ${new Date().toISOString()}\n`;
    content += ` * ===================================================== */\n\n`;

    // Concatenate all source files
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

    // Write output
    fs.writeFileSync(outputPath, content, 'utf8');

    const sizeKb = (Buffer.byteLength(content) / 1024).toFixed(1);
    results.push({
      file: outputFile,
      merged: successCount,
      missing: failCount,
      size: `${sizeKb}KB`
    });

    console.log(`✅ ${outputFile.padEnd(20)} → ${sizeKb.padStart(8)}KB (${successCount}/${config.source.length} file)`);
  }

  return results;
}

// ============================================================
// 3. UPDATE IMPORTS
// ============================================================
function updateImports() {
  console.log('\n📝 Đang cập nhật import...\n');

  // main.jsx
  updateFileImports('src/main.jsx', (content) => {
    // Xóa tất cả CSS import cũ
    content = content.replace(/import ['"]\.\/[^'"]*\.css['"];?\n/g, '');

    // Thêm CSS mới (core)
    const coreImports = `import './styles/core.css';\n`;
    
    // Tìm vị trí sau các import React
    const insertPoint = content.indexOf("import './main.css'") || content.lastIndexOf('import ');
    if (insertPoint > -1) {
      const afterPoint = content.indexOf('\n', insertPoint) + 1;
      content = content.slice(0, afterPoint) + coreImports + content.slice(afterPoint);
    }

    return content;
  });

  // App.jsx
  updateFileImports('src/App.jsx', (content) => {
    content = content.replace(/import ['"]\.\/[^'"]*\.css['"];?\n/g, '');
    content = content.replace(/import ['"]\.\/styles\/[^'"]*\.css['"];?\n/g, '');
    return content;
  });

  console.log('✅ main.jsx - cập nhật');
  console.log('✅ App.jsx - loại bỏ CSS import');
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
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

function updateFileImports(filePath, transform) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File không tìm: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = transform(content);
  fs.writeFileSync(filePath, updated, 'utf8');
}

function generateReport(results) {
  console.log('\n📊 BÁO CÁO:\n');
  console.log('File'.padEnd(20) + ' | ' + 'Size'.padStart(10) + ' | Merged');
  console.log('-'.repeat(50));

  let totalSize = 0;
  let totalMerged = 0;

  for (const r of results) {
    console.log(
      r.file.padEnd(20) + ' | ' +
      r.size.padStart(10) + ' | ' +
      r.merged
    );
    totalMerged += r.merged;
    totalSize += parseFloat(r.size);
  }

  console.log('-'.repeat(50));
  console.log(`TOTAL: ${totalSize.toFixed(1)}KB từ ${totalMerged} file CSS`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('\n🎨 CSS CONSOLIDATION SCRIPT\n');
  console.log('Mục tiêu: Gộp 119 CSS file → 12 file core\n');

  // Backup
  backup();

  // Consolidate
  const results = consolidate();

  // Update imports
  updateImports();

  // Report
  generateReport(results);

  console.log('\n✨ Hoàn thành!\n');
  console.log('📌 Tiếp theo:');
  console.log('   1. Kiểm tra npm run build');
  console.log('   2. Test visual trên browser');
  console.log('   3. Xóa file CSS cũ (nếu an toàn)\n');
}

main().catch(console.error);
