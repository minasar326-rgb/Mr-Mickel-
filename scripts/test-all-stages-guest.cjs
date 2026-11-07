const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test every stage: sec-3, sec-2, sec-1, foundation, prep, pri, and the 8 custom stages
  const stagesToTest = [
    'sec-3', 'sec-2', 'sec-1', 'foundation', 'prep', 'pri',
    'stage-1793823759992', 'stage-1793823821923', 'stage-1793823838440',
    'stage-1793823853201', 'stage-1793823877800', 'stage-1793823892057',
    'stage-1793823916248', 'stage-1793823931996'
  ];

  for (const st of stagesToTest) {
    await page.goto(`http://localhost:4173/#/stage-lectures?stageId=${st}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasFree = bodyText.includes('مجانية') || bodyText.includes('تجريبية مجانية') || bodyText.includes('مجاناً');
    const hasWatchNow = bodyText.includes('مشاهدة المحاضرة والواجبات الآن');
    const badges = await page.$$eval('.badge', els => els.map(e => e.innerText.trim()).filter(Boolean));
    console.log(`Stage ${st}: free=${hasFree}, watchNow=${hasWatchNow}, badges=${badges.filter(b => b.includes('مجاني') || b.includes('سارٍ') || b.includes('معاينة')).join(', ')}`);
  }

  await browser.close();
  process.exit(0);
})();
