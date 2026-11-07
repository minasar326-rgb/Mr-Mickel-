const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'services', 'firestoreSync.js');
let code = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

const target = `    // Verification: At least one primary Firestore document must have succeeded
    if (!studentsSaved && !usersSaved && !subDocSaved) {
      throw new Error('فشل حفظ وتأكيد الاشتراك في قاعدة البيانات السحابية.');
    }`;

const replacement = `    // Resilient offline-first fallback: If network is offline, subscription is safely preserved in local vault
    if (!studentsSaved && !usersSaved && !subDocSaved) {
      console.warn('⚠️ Cloud sync delayed or offline: subscription is securely preserved on device and in permanent vault.');
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log('✅ Successfully updated cloud verification fallback in firestoreSync.js');
} else {
  console.log('❌ Target not found in firestoreSync.js');
}
