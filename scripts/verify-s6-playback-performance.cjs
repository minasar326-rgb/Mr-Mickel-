const { chromium } = require('playwright');

(async () => {
  console.log('Testing video playback for optimized 6th grade lecture (1107_faststart.mp4)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ locale: 'ar-EG' });
  const page = await context.newPage();

  const videoUrl = 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev/stages/stage-1793823853201/lectures/videos/1794035264323_1107_faststart.mp4';

  await page.setContent(`
    <!DOCTYPE html>
    <html lang="ar">
      <head><title>Test S6 Playback</title></head>
      <body style="background:#0f172a; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
        <video id="v" src="${videoUrl}" controls playsinline muted autoplay style="width:800px; max-width:90vw; border-radius:12px;"></video>
      </body>
    </html>
  `);

  await page.evaluate(() => {
    window.__stats = {
      waits: 0,
      stalls: 0,
      errors: [],
      samples: [],
      timeToFirstFrame: null
    };
    const t0 = performance.now();
    const v = document.getElementById('v');
    v.addEventListener('playing', () => {
      if (window.__stats.timeToFirstFrame === null) {
        window.__stats.timeToFirstFrame = Math.round(performance.now() - t0);
      }
    });
    v.addEventListener('waiting', () => window.__stats.waits++);
    v.addEventListener('stalled', () => window.__stats.stalls++);
    v.addEventListener('error', () => window.__stats.errors.push(v.error ? v.error.message : 'error'));
    v.play().catch(e => console.warn('play error', e));
  });

  console.log('Monitoring playback for 15 seconds...');
  for (let i = 1; i <= 15; i++) {
    await page.waitForTimeout(1000);
    const sample = await page.evaluate(() => {
      const v = document.getElementById('v');
      let ahead = 0;
      if (v.buffered && v.buffered.length > 0) {
        for (let j = 0; j < v.buffered.length; j++) {
          if (v.buffered.start(j) <= v.currentTime && v.currentTime <= v.buffered.end(j)) {
            ahead = v.buffered.end(j) - v.currentTime;
          }
        }
      }
      const data = {
        sec: (v.currentTime).toFixed(2),
        ahead: ahead.toFixed(1),
        paused: v.paused,
        readyState: v.readyState
      };
      window.__stats.samples.push(data);
      return data;
    });
    console.log(`Sec ${i}: currentTime = ${sample.sec}s | Buffer ahead = ${sample.ahead}s | readyState = ${sample.readyState}`);
  }

  const finalStats = await page.evaluate(() => window.__stats);
  console.log('\n======================================================');
  console.log('FINAL PLAYBACK AUDIT REPORT:');
  console.log(`Time to First Frame: ${finalStats.timeToFirstFrame} ms`);
  console.log(`Buffer Waits: ${finalStats.waits}`);
  console.log(`Stalls: ${finalStats.stalls}`);
  console.log(`Playback Errors: ${finalStats.errors.length}`);
  console.log('======================================================\n');

  if (finalStats.errors.length === 0 && finalStats.stalls === 0 && finalStats.waits === 0) {
    console.log('🎉 100% PERFECT SMOOTH PLAYBACK VERIFIED: ZERO HANGS, ZERO STUTTERING, ZERO STALLS!');
  } else {
    console.warn('⚠️ Warning: issues detected during playback.');
  }

  await browser.close();
})();
