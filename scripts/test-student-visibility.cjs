const { chromium } = require('@playwright/test');

async function check() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test 1: Go to stage-lectures with custom stage ID
  console.log('Navigating to stage-lectures?stageId=stage-1793823759992 ...');
  await page.goto('http://localhost:3000/#/stage-lectures?stageId=stage-1793823759992', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const found1 = await page.$('text=محاضرة فحص الاستقرار الحقيقي 1793985556382');
  console.log('Found with stageId=stage-1793823759992:', !!found1);

  // Test 2: Go to stage-lectures with canonical pri-3
  console.log('Navigating to stage-lectures?stageId=pri-3 ...');
  await page.goto('http://localhost:3000/#/stage-lectures?stageId=pri-3', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const found2 = await page.$('text=محاضرة فحص الاستقرار الحقيقي 1793985556382');
  console.log('Found with stageId=pri-3:', !!found2);

  // Test 3: Check Teacher Admin Center
  console.log('Navigating to teacher-admin ...');
  const teacherBtn = await page.$('button:has-text("دخول المستر"), a:has-text("دخول المستر")');
  if (teacherBtn) {
    await teacherBtn.click();
    await page.waitForTimeout(1000);
    const pin = await page.$('input[type="password"]');
    if (pin) {
      await pin.fill('1234512345');
      await pin.press('Enter');
      await page.waitForTimeout(2000);
    }
  }

  const foundAdmin = await page.$('text=محاضرة فحص الاستقرار الحقيقي 1793985556382');
  console.log('Found in Teacher Admin list:', !!foundAdmin);

  await browser.close();
}

check().catch(console.error);
