const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'services', 'redemptionService.js');
let code = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

const target = `  // Sync to Firestore & RTDB
  try {
    await saveStudentSubscriptionToFirestore(studentUid, targetId, sub);
  } catch (e) {
    console.warn('Subscription cloud sync notice:', e);
  }

  // Trigger callback if provided
  if (typeof onSubscriptionAdded === 'function') {
    try {
      await onSubscriptionAdded(targetId, sub);
    } catch (e) {
      console.warn('onSubscriptionAdded error:', e);
    }
  }`;

const replacement = `  // Trigger callback if provided, otherwise sync directly
  if (typeof onSubscriptionAdded === 'function') {
    try {
      await onSubscriptionAdded(targetId, sub);
    } catch (e) {
      console.warn('onSubscriptionAdded error:', e);
    }
  } else {
    try {
      await saveStudentSubscriptionToFirestore(studentUid, targetId, sub);
    } catch (e) {
      console.warn('Subscription cloud sync notice:', e);
    }
  }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log('✅ Successfully removed duplicate sync in redemptionService.js');
} else {
  console.log('❌ Target not found in redemptionService.js');
}
