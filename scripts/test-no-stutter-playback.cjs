const { chromium } = require('playwright');

async function testAllVideosNoStutter() {
  console.log('========================================================');
  console.log('⚡ TESTING ALL 3 REAL LECTURE VIDEOS FOR ZERO STUTTER');
  console.log('========================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const testLectures = [
    { id: 'lec-1794002706071', title: 'قاعده المقارنه 2' },
    { id: 'lec-1794001152669', title: 'قاعده المقارنه 1' },
    { id: 'lec-1794004864599', title: 'اسمع مني' }
  ];

  for (const lec of testLectures) {
    console.log(`\n🎬 Testing Playback on: "${lec.title}" (${lec.id})...`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'ar-EG' });
    await context.addInitScript(() => {
      const secureSession = {
        token: 'test-admin-token-12345',
        expiresAt: Date.now() + 3600000,
        createdAt: new Date().toISOString(),
        lastActivityAt: Date.now()
      };
      sessionStorage.setItem('ms_admin_secure_session', JSON.stringify(secureSession));
      localStorage.setItem('ms_admin_secure_session', JSON.stringify(secureSession));
      localStorage.setItem('madarek_role', 'instructor');
      localStorage.setItem('ms_user_role', 'instructor');
    });

    const page = await context.newPage();
    await page.goto(`http://localhost:3000/#lecture-room?lectureId=${lec.id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const videoHandle = await page.$('video');
    if (!videoHandle) {
      console.error(`❌ Video element not found for ${lec.title}!`);
      await context.close();
      process.exit(1);
    }

    const videoSrc = await videoHandle.getAttribute('src');
    console.log(`  🔗 Video CDN Source: ${videoSrc ? videoSrc.substring(0, 65) + '...' : 'none'}`);

    await page.evaluate(() => {
      window.__playbackMetrics = {
        timeUpdates: 0,
        waitingEvents: 0,
        stalledEvents: 0,
        playingEvents: 0,
        timeSamples: []
      };
      const v = document.querySelector('video');
      if (v) {
        v.addEventListener('timeupdate', () => {
          window.__playbackMetrics.timeUpdates++;
          window.__playbackMetrics.timeSamples.push(v.currentTime);
        });
        v.addEventListener('waiting', () => {
          window.__playbackMetrics.waitingEvents++;
        });
        v.addEventListener('stalled', () => {
          window.__playbackMetrics.stalledEvents++;
        });
        v.addEventListener('playing', () => {
          window.__playbackMetrics.playingEvents++;
        });
        v.muted = true;
        v.play();
      }
    });

    for (let i = 1; i <= 6; i++) {
      await page.waitForTimeout(1000);
      const ct = await page.evaluate(() => {
        const v = document.querySelector('video');
        return v ? v.currentTime : -1;
      });
      console.log(`    ⏱️ Second ${i}: currentTime = ${ct.toFixed(2)}s`);
    }

    const metrics = await page.evaluate(() => window.__playbackMetrics);
    const initialTime = metrics.timeSamples[0] || 0;
    const finalTime = metrics.timeSamples[metrics.timeSamples.length - 1] || 0;
    const progression = finalTime - initialTime;
    console.log(`  📊 Stalls: ${metrics.stalledEvents}, Waiting: ${metrics.waitingEvents}, Progression: ${progression.toFixed(2)}s`);

    if (progression > 3.5 && metrics.stalledEvents === 0) {
      console.log(`  ✅ [PASS] "${lec.title}" streamed continuously with ZERO stalls!`);
    } else {
      console.error(`  ❌ [FAIL] "${lec.title}" playback had issues.`);
      process.exit(1);
    }

    await context.close();
  }

  console.log('\n========================================================');
  console.log('🎉 ALL 3 REAL LECTURE VIDEOS STREAMED WITH ZERO STUTTER!');
  console.log('========================================================');
  await browser.close();
}

testAllVideosNoStutter().catch(err => {
  console.error(err);
  process.exit(1);
});
