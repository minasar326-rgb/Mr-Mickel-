const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set logged-in student in localStorage (no subscriptions)
  await page.addInitScript(() => {
    localStorage.setItem('madarek_user', JSON.stringify({
      uid: 'student-no-sub-123',
      id: 'student-no-sub-123',
      name: 'طالب بدون اشتراك',
      email: 'student@example.com',
      role: 'student',
      subscriptions: {}
    }));
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
