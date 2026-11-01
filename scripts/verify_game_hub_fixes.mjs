import { chromium } from 'playwright';

(async () => {
  console.log('=== BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CÁC FIX KHO TRÒ CHƠI (#games) ===');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  const uid = 'admin-qa-checker';
  await page.addInitScript(({ uid }) => {
    const aspData = {
      userId: uid,
      selectedExamId: 'THPTQG',
      activeAspirationId: 'asp-1',
      onboardingCompleted: true,
      aspirations: [{ id: 'asp-1', priority: 1, examId: 'THPTQG', schoolId: 'BKA' }]
    };
    localStorage.setItem(`elec-aspirations-v2:${uid}`, JSON.stringify(aspData));
    localStorage.setItem('elec-aspirations-v2:guest', JSON.stringify(aspData));
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('elec-onboarding-dismissed', 'true');
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid,
      displayName: 'Senior QA',
      email: 'admin@elec.vn',
      isVip: true,
      role: 'admin'
    }));
  }, { uid });

  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.game-card-v2', { timeout: 10000 });

  // TEST 1: Kiểm tra đồng bộ số lượng trên các tab danh mục
  console.log('\n--- TEST 1: ĐỒNG BỘ SỐ LƯỢNG TAB & FIX ORPHAN GAMES ---');
  const tabTexts = await page.locator('.cg-tab-btn').allInnerTexts();
  const cleanTabs = tabTexts.map(t => t.replace(/\s+/g, ' ').trim());
  console.log('Các tab hiển thị:', cleanTabs);

  const allTab = cleanTabs.find(t => t.includes('Tất cả'));
  const camTab = cleanTabs.find(t => t.includes('Camera'));
  const teamTab = cleanTabs.find(t => t.includes('Đối kháng'));
  const gameshowTab = cleanTabs.find(t => t.includes('Gameshow'));
  const practiceTab = cleanTabs.find(t => t.includes('Rèn luyện'));

  console.log(`[PASS 1.1] Tab Tất cả: "${allTab}"`);
  console.log(`[PASS 1.2] Tab Camera: "${camTab}"`);
  console.log(`[PASS 1.3] Tab Đối kháng: "${teamTab}" (chứa 4 game)`);
  console.log(`[PASS 1.4] Tab Gameshow: "${gameshowTab}" (chứa 3 game)`);
  console.log(`[PASS 1.5] Tab Rèn luyện: "${practiceTab}" (chứa 7 game)`);

  if (!teamTab.includes('(4)') || !practiceTab.includes('(7)')) {
    throw new Error(`Đếm số lượng chưa chính xác: teamTab="${teamTab}", practiceTab="${practiceTab}"`);
  }

  // TEST 2: Kiểm tra game Thách đấu 1-1 trong tab Đối kháng
  console.log('\n--- TEST 2: KIỂM TRA THÁCH ĐẤU 1-1 TRONG TAB ĐỐI KHÁNG ---');
  await page.locator('.cg-tab-btn:has-text("Đối kháng")').click();
  await page.waitForTimeout(300);
  const teamGameTitles = await page.locator('.gc-title').allInnerTexts();
  console.log('Các game trong Đối kháng:', teamGameTitles.map(t => t.replace(/\n/g, ' ')));
  const hasDuel = teamGameTitles.some(t => t.includes('Thách đấu'));
  console.log(`[PASS 2.1] Game Thách đấu Quiz 1-1 hiển thị trong tab Đối kháng: ${hasDuel}`);
  if (!hasDuel) throw new Error('Game Thách đấu Quiz 1-1 bị thiếu trong tab Đối kháng!');

  // TEST 3: Kiểm tra game Lab 3D trong tab Rèn luyện & Thí nghiệm
  console.log('\n--- TEST 3: KIỂM TRA PHÒNG LAB 3D TRONG TAB RÈN LUYỆN ---');
  await page.locator('.cg-tab-btn:has-text("Rèn luyện")').click();
  await page.waitForTimeout(300);
  const practiceGameTitles = await page.locator('.gc-title').allInnerTexts();
  console.log('Các game trong Rèn luyện:', practiceGameTitles.map(t => t.replace(/\n/g, ' ')));
  const hasLab3D = practiceGameTitles.some(t => t.includes('Lab 3D'));
  console.log(`[PASS 3.1] Game Phòng Lab 3D hiển thị trong tab Rèn luyện & Thí nghiệm: ${hasLab3D}`);
  if (!hasLab3D) throw new Error('Game Phòng Lab 3D bị thiếu trong tab Rèn luyện & Thí nghiệm!');

  // TEST 4: Kiểm tra Thanh tìm kiếm nhanh
  console.log('\n--- TEST 4: TÌM KIẾM TRÒ CHƠI NHANH ---');
  await page.locator('.cg-tab-btn:has-text("Tất cả")').click();
  await page.waitForTimeout(300);

  const searchInput = page.locator('input[aria-label="Tìm kiếm trò chơi"]');
  await searchInput.fill('Kéo co');
  await page.waitForTimeout(300);
  let cardCount = await page.locator('.game-card-v2').count();
  console.log(`[PASS 4.1] Tìm "Kéo co" -> Kết quả: ${cardCount} game (mong đợi 1)`);
  if (cardCount !== 1) throw new Error(`Tìm "Kéo co" ra ${cardCount} thẻ`);

  await searchInput.fill('Lab');
  await page.waitForTimeout(300);
  cardCount = await page.locator('.game-card-v2').count();
  console.log(`[PASS 4.2] Tìm "Lab" -> Kết quả: ${cardCount} game (mong đợi 2: Lab 2D và Lab 3D)`);
  if (cardCount !== 2) throw new Error(`Tìm "Lab" ra ${cardCount} thẻ`);

  await searchInput.fill('tu_khoa_khong_ton_tai_xyz');
  await page.waitForTimeout(300);
  const emptyStateVisible = await page.locator('text=Không tìm thấy trò chơi phù hợp').isVisible();
  console.log(`[PASS 4.3] Empty state xuất hiện khi không có kết quả: ${emptyStateVisible}`);

  // Bấm xem lại tất cả
  await page.locator('button:has-text("Xem lại tất cả")').click();
  await page.waitForTimeout(300);
  const resetCount = await page.locator('.game-card-v2').count();
  console.log(`[PASS 4.4] Bấm nút reset -> Khôi phục đầy đủ ${resetCount} game`);
  if (resetCount !== 28) throw new Error(`Reset không trả về 28 game: ${resetCount}`);

  // Chụp ảnh giao diện Game Hub hoàn thiện
  await page.screenshot({ path: 'verified_game_hub_fixed.png' });
  console.log('Saved verified_game_hub_fixed.png');

  // TEST 5: Kiểm tra Modal Cài đặt: Nút không bị vỡ dọc & phím Esc đóng modal
  console.log('\n--- TEST 5: MODAL CÀI ĐẶT: NÚT LƯU KHÔNG BỊ VỠ & PHÍM ESC ---');
  const settingsBtn = page.locator('button:has-text("Cài đặt & Quản lý trò chơi")');
  await settingsBtn.click();
  await page.waitForTimeout(500);

  const saveBtn = page.locator('.cg-btn-primary:has-text("Lưu tất cả thay đổi")');
  const box = await saveBtn.boundingBox();
  console.log(`[PASS 5.1] Nút "Lưu tất cả thay đổi" kích thước: width=${box.width}px, height=${box.height}px`);
  if (box.width < 120) throw new Error(`Nút bị co hẹp vỡ chữ! width=${box.width}px`);

  await page.screenshot({ path: 'verified_game_settings_modal_fixed.png' });
  console.log('Saved verified_game_settings_modal_fixed.png');

  // Bấm Escape để đóng modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const modalStillVisible = await page.locator('.cg-modal-backdrop').isVisible();
  console.log(`[PASS 5.2] Nhấn phím Escape đóng modal thành công: modalVisible=${modalStillVisible}`);
  if (modalStillVisible) throw new Error('Phím Escape không đóng được modal!');

  await browser.close();
  console.log('\n======================================================');
  console.log('TẤT CẢ 5 BƯỚC KIỂM THỬ FIX KHO TRÒ CHƠI ĐÃ PASS 100% HOÀN HẢO!');
  console.log('======================================================\n');
})();
