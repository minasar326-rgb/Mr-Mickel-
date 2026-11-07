const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

function createDistServer(port = 4199) {
  const distDir = path.join(__dirname, '..', 'dist');
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || !path.extname(reqPath)) {
      reqPath = '/index.html';
    }
    const filePath = path.join(distDir, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webmanifest': 'application/manifest+json'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const fallback = path.join(distDir, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fallback).pipe(res);
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

(async () => {
  const port = 4199;
  const server = await createDistServer(port);

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  // Completely empty context - Guest user, clean browser
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'ar-EG' });
  await context.addInitScript(() => {
    sessionStorage.setItem('ms_dev_bypass', 'true');
  });

  const page = await context.newPage();

  // Test 1: Go to stages page
  console.log('1️⃣ Visiting Stages page as fresh guest...');
  await page.goto(`http://localhost:${port}/#/stages`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const stageItems = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card'));
    return cards.map(c => c.innerText.replace(/\n+/g, ' | ').slice(0, 150));
  });
  console.log('Stages Cards:', stageItems);

  // Test 2: Go to سنة خامسة lectures page
  console.log('\n2️⃣ Visiting سنة خامسة page (stage-1793823838440) as fresh guest...');
  await page.goto(`http://localhost:${port}/#/stage-lectures?stageId=stage-1793823838440`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const lectureCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card'));
    return cards.map(c => ({
      text: c.innerText.replace(/\n+/g, ' | '),
      border: c.style.border,
      buttons: Array.from(c.querySelectorAll('button, a')).map(b => b.innerText.trim())
    }));
  });
  console.log('Lecture Cards in سنة خامسة:\n', JSON.stringify(lectureCards, null, 2));

  // Test 3: Click first lecture
  console.log('\n3️⃣ Attempting to open Lecture 1 room as guest...');
  await page.goto(`http://localhost:${port}/#/lecture-room?lectureId=lec-1794001152669`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const roomStatus = await page.evaluate(() => {
    const video = document.querySelector('video');
    const body = document.body.innerText;
    return {
      hasVideo: Boolean(video),
      videoSrc: video ? video.getAttribute('src') : null,
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.innerText),
      snippet: body.slice(0, 400).replace(/\n+/g, ' ')
    };
  });
  console.log('Lecture 1 Room as Guest:\n', JSON.stringify(roomStatus, null, 2));

  await browser.close();
  server.close();
})();
