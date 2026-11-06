const { execSync } = require('child_process');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function runCompleteAudit() {
  console.log('================================================================');
  console.log('🌟 EXECUTING MASTER COMPREHENSIVE PLATFORM TEST & HEALTH SUITE 🌟');
  console.log('================================================================\n');

  const results = [];

  // Suite 1: All Requirements Verification (18 Groups)
  console.log('\n▶ SUITE 1: Running All 18 Platform Requirements Test...');
  try {
    const out = execSync('node --use-system-ca scripts/verify-all-requirements.cjs', { encoding: 'utf8' });
    console.log(out.split('\n').filter(l => l.includes('PASSED') || l.includes('GROUP')).join('\n'));
    results.push({ name: 'All 18 Requirements Groups', status: 'PASSED ✅' });
  } catch (err) {
    console.error('❌ Suite 1 Failed:', err.message);
    results.push({ name: 'All 18 Requirements Groups', status: 'FAILED ❌' });
  }

  // Suite 2: 4-Stage Isolation & Empty Months Matrix (38 scenarios)
  console.log('\n▶ SUITE 2: Running 4-Stage Matrix & Empty Months Test...');
  try {
    const out = execSync('node --use-system-ca scripts/test-four-stages-matrix.cjs', { encoding: 'utf8' });
    console.log(out.split('\n').filter(l => l.includes('PASS') || l.includes('TEST GROUP') || l.includes('Results')).join('\n'));
    results.push({ name: '4-Stage Isolation & Empty Months Matrix (38 Scenarios)', status: 'PASSED ✅' });
  } catch (err) {
    console.error('❌ Suite 2 Failed:', err.message);
    results.push({ name: '4-Stage Isolation & Empty Months Matrix (38 Scenarios)', status: 'FAILED ❌' });
  }

  // Suite 3: Cross-Teacher & Multi-Device Real-Time Sync
  console.log('\n▶ SUITE 3: Running Cross-Teacher & Multi-Device Real-Time Sync...');
  try {
    const out = execSync('node --use-system-ca scripts/verify-cross-teacher-sync.cjs', { encoding: 'utf8' });
    console.log(out.split('\n').filter(l => l.includes('PASS') || l.includes('Setting') || l.includes('Teacher')).join('\n'));
    results.push({ name: 'Cross-Teacher & Multi-Device Real-Time Sync', status: 'PASSED ✅' });
  } catch (err) {
    console.error('❌ Suite 3 Failed:', err.message);
    results.push({ name: 'Cross-Teacher & Multi-Device Real-Time Sync', status: 'FAILED ❌' });
  }

  // Suite 4: Full End-to-End User Flow (R2 Video Streaming, Watch, Delete, F5 Persistence)
  console.log('\n▶ SUITE 4: Running Full End-to-End User Flow & Video Streaming...');
  try {
    const out = execSync('node --use-system-ca scripts/verify-full-platform-flow.cjs', { encoding: 'utf8' });
    console.log(out.split('\n').filter(l => l.includes('PASS') || l.includes('STEP')).join('\n'));
    results.push({ name: 'Full E2E Flow (Upload, R2 Stream, Watch, Delete, Persistence)', status: 'PASSED ✅' });
  } catch (err) {
    console.error('❌ Suite 4 Failed:', err.message);
    results.push({ name: 'Full E2E Flow (Upload, R2 Stream, Watch, Delete, Persistence)', status: 'FAILED ❌' });
  }

  // Suite 5: Visual Verification & Screenshots
  console.log('\n▶ SUITE 5: Taking Live Platform Screenshots...');
  try {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 1. Landing Page
    await page.goto('http://localhost:3000/#/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const screenshotDir = path.resolve('scripts/screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir, 'live-landing-page.png'), fullPage: false });

    // 2. Stage Lectures Page
    await page.goto('http://localhost:3000/#/stage-lectures?stageId=sec-3', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, 'live-stage-lectures.png'), fullPage: false });

    // 3. Teacher Admin Center
    await page.goto('http://localhost:3000/#/teacher-admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const pin = await page.$('input[type="password"]');
    if (pin) {
      await pin.fill('1234512345');
      await pin.press('Enter');
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: path.join(screenshotDir, 'live-teacher-admin.png'), fullPage: false });

    await browser.close();
    console.log('✅ Captured live screenshots in scripts/screenshots/');
    results.push({ name: 'Live UI Verification & Visual Capture', status: 'PASSED ✅' });
  } catch (err) {
    console.error('❌ Suite 5 Failed:', err.message);
    results.push({ name: 'Live UI Verification & Visual Capture', status: 'FAILED ❌' });
  }

  console.log('\n================================================================');
  console.log('📊 MASTER PLATFORM AUDIT REPORT SUMMARY');
  console.log('================================================================');
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.name.padEnd(60, ' ')} : ${r.status}`);
  });
  console.log('================================================================\n');

  const allPassed = results.every(r => r.status.includes('PASSED'));
  if (allPassed) {
    console.log('🎉🎉 ALL 5 COMPREHENSIVE SUITES PASSED FLAWLESSLY WITH 100% HEALTH! 🎉🎉');
    process.exit(0);
  } else {
    console.error('💥 Some suites failed!');
    process.exit(1);
  }
}

runCompleteAudit().catch(err => {
  console.error('Master Audit Error:', err);
  process.exit(1);
});
