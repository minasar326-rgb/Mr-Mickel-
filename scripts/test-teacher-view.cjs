const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set active admin session in localStorage
  await page.addInitScript(() => {
    const session = {
      token: 'valid_mock_admin_token',
      role: 'super_admin',
      authMethod: 'master_pin',
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      lastActivityAt: Date.now()
    };
    localStorage.setItem('ms_admin_session', JSON.stringify(session));
    sessionStorage.setItem('ms_admin_session', JSON.stringify(session));
  });

  await page.goto('http://localhost:4173/#/stage-lectures?stageId=stage-1793823838440', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const cards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.card')).map(e => ({
      text: e.innerText.split('\n').filter(Boolean).slice(0, 8),
      buttons: Array.from(e.querySelectorAll('button, a')).map(b => b.innerText.trim())
    }));
  });

  console.log(JSON.stringify(cards, null, 2));
  await browser.close();
  process.exit(0);
})();
