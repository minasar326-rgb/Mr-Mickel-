const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('Homepage Loaded. Title:', await page.title());

  // Check what stages are on the homepage
  const stageButtons = await page.$$eval('button', btns => btns.map(b => b.innerText.trim()));
  console.log('All buttons on homepage:', stageButtons.filter(b => b.includes('محاضرات') || b.includes('خامس') || b.includes('ابتدائ')));

  // Click on the button for "خامسه ابتدائى" or find stage card
  // Let's find button with text containing 'خامسه'
  const khamesBtn = page.locator('button:has-text("خامسه")').first();
  if (await khamesBtn.count() > 0) {
    console.log('Clicking button with "خامسه"...');
    await khamesBtn.click();
  } else {
    // try to find any element with text 'خامسه ابتدائى'
    console.log('Looking for text "خامسه ابتدائى"...');
    const elem = page.locator('text=خامسه ابتدائى').first();
    await elem.click();
  }

  await page.waitForTimeout(2000);
  console.log('Navigated to:', page.url());

  // Check what cards are visible on stage-lectures page
  const textContent = await page.evaluate(() => document.body.innerText);
  console.log('Contains "مجاني":', textContent.includes('مجاني'));
  console.log('Contains "مجانية":', textContent.includes('مجانية'));
  console.log('Contains "تجريبية":', textContent.includes('تجريبية'));
  console.log('Contains "مفتوح":', textContent.includes('مفتوح'));
  console.log('Contains "مشاهدة المحاضرة والواجبات الآن":', textContent.includes('مشاهدة المحاضرة والواجبات الآن'));
  console.log('Contains "المحاضرة مقفلة":', textContent.includes('المحاضرة مقفلة'));
  console.log('Contains "معي كود تفعيل المحاضرة":', textContent.includes('معي كود تفعيل المحاضرة'));

  // Get all badges on screen
  const badges = await page.$$eval('.badge, span[style*="border-radius"]', els => els.map(e => e.innerText.trim()).filter(Boolean));
  console.log('Badges found:', badges);

  // Take screenshot
  await page.screenshot({ path: 'artifacts/khames-stage-guest-view.png', fullPage: true });
  console.log('Screenshot saved to artifacts/khames-stage-guest-view.png');

  await browser.close();
  process.exit(0);
})();
