#!/usr/bin/env node
/**
 * Browser test for Smart Dashboard demo
 * Run: npx playwright test test-dashboard.js (or node test-dashboard.js with playwright installed)
 */
const { chromium } = require('playwright');

async function runTest() {
  const results = { passed: [], failed: [], consoleErrors: [] };
  let browser, page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // Capture console errors
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') results.consoleErrors.push(text);
    });

    // 1. Navigate
    console.log('1. Navigating to http://localhost:64503...');
    await page.goto('http://localhost:64503', { waitUntil: 'networkidle', timeout: 10000 });

    // 2. Check page structure
    const checks = [
      { name: 'Header with Smart Dashboard title', sel: 'h1:has-text("Smart Dashboard")', expect: true },
      { name: 'BrainWeb badge', sel: '.badge:has-text("BrainWeb")', expect: true },
      { name: 'Tasks widget', sel: '#widget-tasks', expect: true },
      { name: 'Task input', sel: '#task-input', expect: true },
      { name: '3 pre-filled tasks', sel: '.task-item', expect: 3 },
      { name: 'Notes widget with textarea', sel: '#notes-area', expect: true },
      { name: 'Metrics widget', sel: '#widget-stats', expect: true },
      { name: 'Stat cards', sel: '.stat-card', expect: 4 },
      { name: 'Brain Activity feed', sel: '#widget-feed', expect: true },
      { name: 'Record Session button', sel: '#btn-record', expect: true },
      { name: 'Replay button', sel: '#btn-replay', expect: true },
      { name: 'Reset Widgets button', sel: '#btn-reset', expect: true },
      { name: 'Debug overlay', sel: '#bw-debug-overlay', expect: true },
      { name: 'Action badge', sel: '#action-badge', expect: true },
    ];

    for (const c of checks) {
      const count = c.expect === true ? 1 : c.expect;
      const els = await page.locator(c.sel).count();
      const ok = typeof count === 'number' ? els >= count : els > 0;
      if (ok) results.passed.push(c.name);
      else results.failed.push(`${c.name}: expected ${count}, got ${els}`);
    }

    // 3. Interact: click task item
    console.log('3a. Clicking first task item...');
    await page.locator('.task-item').first().click();
    await page.waitForTimeout(200);

    // 3b. Type in task input
    console.log('3b. Typing in task input...');
    await page.locator('#task-input').fill('Test task from automation');
    await page.waitForTimeout(200);

    // 3c. Click stat card
    console.log('3c. Clicking stat card...');
    await page.locator('#stat-events').click();
    await page.waitForTimeout(200);

    // 3d. Wait 2 seconds for brain tick
    console.log('3d. Waiting 2 seconds for brain tick...');
    await page.waitForTimeout(2000);

    // 4. Post-interaction checks
    const taskDone = await page.locator('.task-item.done').count();
    if (taskDone >= 1) results.passed.push('Task toggle works (at least 1 done)');
    else results.failed.push('Task toggle: no task marked done');

    const debugVisible = await page.locator('#bw-debug-overlay').isVisible();
    if (debugVisible) results.passed.push('Debug overlay visible');
    else results.failed.push('Debug overlay not visible');

    const actionBadgeText = await page.locator('#action-badge').textContent();
    results.passed.push(`Action badge shows: "${actionBadgeText.trim()}"`);

    const feedItems = await page.locator('.feed-item').count();
    results.passed.push(`Activity feed has ${feedItems} entries`);

    // Debug overlay content
    const debugContent = await page.locator('#bw-debug-overlay').textContent();
    const hasBrainState = debugContent && (debugContent.includes('Context') || debugContent.includes('Action') || debugContent.includes('Tick'));
    if (hasBrainState) results.passed.push('Debug overlay shows BrainWeb state');
    else results.failed.push('Debug overlay may not show full BrainWeb state');

  } catch (err) {
    results.failed.push(`Test error: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  return results;
}

runTest().then((r) => {
  console.log('\n=== Smart Dashboard Test Results ===\n');
  console.log('PASSED:');
  r.passed.forEach((p) => console.log('  ✓', p));
  console.log('\nFAILED:');
  r.failed.forEach((f) => console.log('  ✗', f));
  if (r.consoleErrors.length > 0) {
    console.log('\nCONSOLE ERRORS:');
    r.consoleErrors.forEach((e) => console.log('  ', e));
  }
  console.log('\n---');
  process.exit(r.failed.length > 0 ? 1 : 0);
}).catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
