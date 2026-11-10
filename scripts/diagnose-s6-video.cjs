const { chromium } = require('playwright');

(async () => {
  console.log('Testing video playback for 6th grade lecture (lec-1794004864599)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ locale: 'ar-EG' });
  const page = await context.newPage();

  // Load the direct video URL in an HTML5 video tag
  const videoUrl = 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev/stages/stage-1793823759992/lectures/videos/1794004799500_____________________________________-________-_YouTube_and_3_more_pages_-_Personal_-_Microsoft__Edge_2026-08-09_14-10-02_faststart.mp4';

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head><title>Test Video</title></head>
      <body>
        <video id="v" src="${videoUrl}" controls playsinline muted autoplay></video>
      </body>
    </html>
  `);

  await page.evaluate(() => {
    window.__stats = {
      waits: 0,
      stalls: 0,
      errors: [],
      currentTimes: []
    };
    const v = document.getElementById('v');
    v.addEventListener('waiting', () => window.__stats.waits++);
    v.addEventListener('stalled', () => window.__stats.stalls++);
    v.addEventListener('error', (e) => window.__stats.errors.push(v.error ? v.error.message : 'error'));
    v.play().catch(e => console.warn('autoplay error', e));
  });

  for (let i = 1; i <= 8; i++) {
    await page.waitForTimeout(1000);
    const ct = await page.evaluate(() => {
      const v = document.getElementById('v');
      window.__stats.currentTimes.push(v.currentTime);
      return v.currentTime;
    });
    console.log(`Sec ${i}: currentTime = ${ct.toFixed(2)}s`);
  }

  const stats = await page.evaluate(() => window.__stats);
  console.log('Stats:', stats);

  await browser.close();
})();
