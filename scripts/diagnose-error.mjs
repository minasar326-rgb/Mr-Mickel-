import { chromium } from '@playwright/test';

async function diagnose() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER UNCAUGHT ERROR]:`, err.message, err.stack);
  });

  console.log('Navigating to live GitHub Pages URL...');
  try {
    await page.goto('https://minasar326-rgb.github.io/Mr-Mickel-/', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log('Navigation ended with:', e.message);
  }

  // Check if ErrorBoundary is visible
  const errorText = await page.evaluate(() => {
    const el = document.querySelector('h2');
    return el ? el.innerText : 'No h2';
  });
  console.log('Page header text:', errorText);

  await browser.close();
}

diagnose().catch(console.error);
