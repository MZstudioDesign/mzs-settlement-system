// Quick test to verify new project modal DOM rendering
const { chromium } = require('playwright');

async function testModalDOM() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to homepage
    await page.goto('http://localhost:9000');
    console.log('✅ Page loaded');

    // Check that modal is not visible initially
    const modalBefore = page.locator('[data-testid="dlg-new-project"]');
    const isVisibleBefore = await modalBefore.isVisible().catch(() => false);
    console.log(`📋 Modal visible before click: ${isVisibleBefore}`);

    // Click the new project button
    const button = page.locator('[data-testid="btn-new-project"]');
    await button.waitFor({ state: 'visible' });
    await button.click();
    console.log('🖱️ Clicked new project button');

    // Wait for modal to appear and check visibility
    await page.waitForTimeout(1000); // Give time for modal animation
    const modalAfter = page.locator('[data-testid="dlg-new-project"]');
    const isVisibleAfter = await modalAfter.isVisible();
    console.log(`📋 Modal visible after click: ${isVisibleAfter}`);

    // Check for role="dialog" as well
    const dialogRole = page.locator('[role="dialog"]');
    const roleVisible = await dialogRole.isVisible();
    console.log(`🎭 Dialog role visible: ${roleVisible}`);

    // Check dialog title
    const title = await page.locator('h2', { hasText: '새 프로젝트 생성' }).isVisible();
    console.log(`📝 Dialog title visible: ${title}`);

    // Summary
    console.log('\n=== MODAL DOM TEST RESULTS ===');
    console.log(`✅ Button found and clickable: true`);
    console.log(`✅ Modal appears after click: ${isVisibleAfter}`);
    console.log(`✅ Dialog role present: ${roleVisible}`);
    console.log(`✅ Dialog title present: ${title}`);

    if (isVisibleAfter && roleVisible && title) {
      console.log('🎉 NEW PROJECT MODAL DOM RENDERING: PASSED');
    } else {
      console.log('❌ NEW PROJECT MODAL DOM RENDERING: FAILED');
    }

    // Take screenshot for verification
    await page.screenshot({ path: 'modal-test-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as modal-test-screenshot.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testModalDOM();