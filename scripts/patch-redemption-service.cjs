const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'services', 'redemptionService.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for normalize10DigitCode and fetchCodeFromCloud, markCodeAsUsedInCloud
if (!content.includes('normalize10DigitCode')) {
  content = `import { normalize10DigitCode } from '../utils/codeNormalizer.js';\n` + content;
}
if (!content.includes('fetchCodeFromCloud')) {
  content = content.replace(
    `import { saveStudentSubscriptionToFirestore, syncCodeToCloud } from './firestoreSync.js';`,
    `import { saveStudentSubscriptionToFirestore, syncCodeToCloud, fetchCodeFromCloud, markCodeAsUsedInCloud } from './firestoreSync.js';`
  );
}

// 2. Normalize code input at start of executeRedeemCode
content = content.replace(
  `  const rawCode = (cleanCode || codeStr || '').trim();
  if (!rawCode) {
    return { ok: false, error: 'invalid_code', message: 'يرجى إدخال كود التفعيل بدقة.' };
  }

  // Remove whitespace and clean format
  const sanitizedCode = rawCode.replace(/\\s+/g, '');`,
  `  const rawCode = (cleanCode || codeStr || '').trim();
  const sanitizedCode = normalize10DigitCode(rawCode);
  if (!sanitizedCode) {
    return { ok: false, error: 'invalid_code', message: 'يرجى إدخال كود التفعيل بدقة (10 أرقام).' };
  }`
);

// 3. Add accessCodes to options in executeRedeemCode
content = content.replace(
  `export async function executeRedeemCode({
  cleanCode,
  codeStr,
  currentUser,
  stages = [],
  sections = [],
  lectures = [],
  onSubscriptionAdded
}) {`,
  `export async function executeRedeemCode({
  cleanCode,
  codeStr,
  currentUser,
  stages = [],
  sections = [],
  lectures = [],
  accessCodes = [],
  onSubscriptionAdded
}) {`
);

// 4. Update Step 3 Fallback to check fetchCodeFromCloud & accessCodes
const oldFallback = `  // 3. Fallback: Local Repository / State Check (for offline / testing / fallback consistency)
  if (!firestoreSuccess) {
    let localCodes = [];
    try {
      const saved = localStorage.getItem('ms_codes');
      if (saved) localCodes = JSON.parse(saved);
    } catch (e) {}

    const foundCode = localCodes.find(c => (c.code || '').trim() === sanitizedCode);
    if (!foundCode) {
      return { ok: false, error: 'invalid_code', message: 'كود التفعيل غير صحيح، تأكد من كتابة الـ 10 أرقام بدقة.' };
    }`;

const newFallback = `  // 3. Resilient Multi-Cloud Fallback: RTDB, R2 Global CDN Manifest, Firestore & State
  if (!firestoreSuccess) {
    let foundCode = await fetchCodeFromCloud(sanitizedCode);

    if (!foundCode && Array.isArray(accessCodes) && accessCodes.length > 0) {
      foundCode = accessCodes.find(c => normalize10DigitCode(c.code) === sanitizedCode);
    }

    if (!foundCode) {
      try {
        const saved = localStorage.getItem('ms_codes');
        if (saved) {
          const localCodes = JSON.parse(saved);
          foundCode = localCodes.find(c => normalize10DigitCode(c.code) === sanitizedCode);
        }
      } catch (e) {}
    }

    if (!foundCode) {
      return { ok: false, error: 'invalid_code', message: 'كود التفعيل غير صحيح، تأكد من كتابة الـ 10 أرقام بدقة.' };
    }`;

const normContent = content.replace(/\r\n/g, '\n');
let updated = normContent;
const normOldFallback = oldFallback.replace(/\r\n/g, '\n');
const normNewFallback = newFallback.replace(/\r\n/g, '\n');

if (normContent.includes(normOldFallback)) {
  updated = updated.replace(normOldFallback, normNewFallback);
  console.log('SUCCESS: Updated fallback in redemptionService.js');
} else {
  console.warn('WARNING: oldFallback not matched');
}

// Also in the fallback, after marking used:
updated = updated.replace(
  `    try {
      localStorage.setItem('ms_codes', JSON.stringify(localCodes));
      // Background sync to cloud
      syncCodeToCloud(foundCode).catch(() => {});
    } catch (e) {}`,
  `    try {
      markCodeAsUsedInCloud(sanitizedCode, foundCode).catch(() => {});
      const local = JSON.parse(localStorage.getItem('ms_codes') || '[]');
      const updatedLocal = local.map(c => normalize10DigitCode(c.code) === sanitizedCode ? foundCode : c);
      localStorage.setItem('ms_codes', JSON.stringify(updatedLocal));
    } catch (e) {}`
);

fs.writeFileSync(filePath, updated, 'utf8');
console.log('redemptionService.js patch complete');
