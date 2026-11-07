const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'services', 'firestoreSync.js');
let content = fs.readFileSync(filePath, 'utf8');

// Add import of normalize10DigitCode at top
if (!content.includes('normalize10DigitCode')) {
  content = `import { normalize10DigitCode } from '../utils/codeNormalizer.js';\n` + content;
}

// 1. Replace syncCodeToCloud
const oldSyncCode = `export async function syncCodeToCloud(code) {
  try {
    const cleanCode = code.code.trim().toUpperCase();
    const data = { ...code, code: cleanCode, updatedAt: serverTimestamp() };
    await setDoc(doc(db, 'codes', cleanCode), data, { merge: true });
    await setDoc(doc(db, 'subscriptionCodes', cleanCode), data, { merge: true });
    if (rtdb) {
      await saveToRtdb('codes/' + cleanCode, data);
      await saveToRtdb('subscriptionCodes/' + cleanCode, data);
    }
  } catch (e) {}
  return true;
}`;

const newSyncCode = `export async function syncCodeToCloud(code) {
  try {
    const cleanCode = normalize10DigitCode(code.code);
    const firestoreData = { ...code, code: cleanCode, updatedAt: serverTimestamp() };
    const rtdbData = { ...code, code: cleanCode, updatedAt: new Date().toISOString() };
    
    if (db) {
      await setDoc(doc(db, 'codes', cleanCode), firestoreData, { merge: true }).catch(err => console.warn('Firestore code sync notice:', err.message));
      await setDoc(doc(db, 'subscriptionCodes', cleanCode), firestoreData, { merge: true }).catch(() => {});
    }
    if (rtdb) {
      await saveToRtdb('codes/' + cleanCode, rtdbData);
      await saveToRtdb('subscriptionCodes/' + cleanCode, rtdbData);
    }
  } catch (e) {
    console.warn('syncCodeToCloud notice:', e);
  }
  return true;
}`;

// 2. Replace fetchCodeFromCloud
const oldFetchCode = `export async function fetchCodeFromCloud(cleanCode) {
  if (!cleanCode) return null;

  // 1. Try Firestore first
  try {
    const docRef = doc(db, 'codes', cleanCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn('Firestore code fetch notice:', e.message);
  }

  // 2. Try RTDB
  if (rtdb) {
    try {
      const snap = await rtdbGet(rtdbRef(rtdb, 'codes/' + cleanCode));
      if (snap.exists()) {
        return snap.val();
      }
    } catch (e) {
      console.warn('RTDB code fetch notice:', e.message);
    }
  }

  return null;
}`;

const newFetchCode = `export async function fetchCodeFromCloud(cleanCode) {
  if (!cleanCode) return null;
  const normalized = normalize10DigitCode(cleanCode);

  // 1. Try RTDB first (fastest across mobile networks in Egypt and unrestricted)
  if (rtdb) {
    try {
      const snap = await rtdbGet(rtdbRef(rtdb, 'codes/' + normalized));
      if (snap.exists()) {
        return snap.val();
      }
      const subSnap = await rtdbGet(rtdbRef(rtdb, 'subscriptionCodes/' + normalized));
      if (subSnap.exists()) {
        return subSnap.val();
      }
    } catch (e) {
      console.warn('RTDB code fetch notice:', e.message);
    }
  }

  // 2. Try Firestore
  if (db) {
    try {
      const docRef = doc(db, 'codes', normalized);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      const subDocRef = doc(db, 'subscriptionCodes', normalized);
      const subSnap = await getDoc(subDocRef);
      if (subSnap.exists()) {
        return subSnap.data();
      }
    } catch (e) {
      console.warn('Firestore code fetch notice:', e.message);
    }
  }

  // 3. Try Global Cloud Manifest (Cloudflare R2 CDN, 100% reachable from any phone)
  try {
    if (typeof window !== 'undefined') {
      const manifestCodes = window.__MS_PLATFORM_MANIFEST__?.codes || [];
      const found = manifestCodes.find(c => normalize10DigitCode(c.code) === normalized);
      if (found) return found;
    }
  } catch (e) {}

  // 4. Try Local Storage
  try {
    if (typeof localStorage !== 'undefined') {
      const local = JSON.parse(localStorage.getItem('ms_codes') || '[]');
      const found = local.find(c => normalize10DigitCode(c.code) === normalized);
      if (found) return found;
    }
  } catch (e) {}

  return null;
}`;

// 3. Replace markCodeAsUsedInCloud
const oldMarkUsed = `export async function markCodeAsUsedInCloud(cleanCode, updatedCodeData) {
  if (!cleanCode || !updatedCodeData) return false;
  try {
    const maxUses = Number(updatedCodeData.maxUses) || 1;
    const usedCount = Number(updatedCodeData.usedCount) || (updatedCodeData.isUsed ? 1 : 0);
    const isFullyUsed = usedCount >= maxUses;
    const effectiveStatus = isFullyUsed ? 'used' : 'active';

    await setDoc(doc(db, 'codes', cleanCode), {
      ...updatedCodeData,
      usedCount: usedCount,
      maxUses: maxUses,
      isUsed: isFullyUsed,
      status: effectiveStatus,
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'codes/' + cleanCode), {
          ...updatedCodeData,
          usedCount: usedCount,
          maxUses: maxUses,
          isUsed: isFullyUsed,
          status: effectiveStatus
        });
      } catch (e) {
        console.warn('RTDB code update notice:', e);
      }
    }
    return true;
  } catch (e) {
    console.error('Error marking code as used in cloud:', e);
    return false;
  }
}`;

const newMarkUsed = `export async function markCodeAsUsedInCloud(cleanCode, updatedCodeData) {
  if (!cleanCode || !updatedCodeData) return false;
  const normalized = normalize10DigitCode(cleanCode);
  try {
    const maxUses = Number(updatedCodeData.maxUses) || 1;
    const usedCount = Number(updatedCodeData.usedCount) || (updatedCodeData.isUsed ? 1 : 0);
    const isFullyUsed = usedCount >= maxUses;
    const effectiveStatus = isFullyUsed ? 'used' : 'active';

    const firestoreData = {
      ...updatedCodeData,
      code: normalized,
      usedCount: usedCount,
      maxUses: maxUses,
      isUsed: isFullyUsed,
      status: effectiveStatus,
      updatedAt: serverTimestamp()
    };

    const rtdbData = {
      ...updatedCodeData,
      code: normalized,
      usedCount: usedCount,
      maxUses: maxUses,
      isUsed: isFullyUsed,
      status: effectiveStatus,
      updatedAt: new Date().toISOString()
    };

    if (db) {
      await setDoc(doc(db, 'codes', normalized), firestoreData, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'subscriptionCodes', normalized), firestoreData, { merge: true }).catch(() => {});
    }

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'codes/' + normalized), rtdbData);
        await rtdbSet(rtdbRef(rtdb, 'subscriptionCodes/' + normalized), rtdbData);
      } catch (e) {
        console.warn('RTDB code update notice:', e);
      }
    }
    return true;
  } catch (e) {
    console.error('Error marking code as used in cloud:', e);
    return false;
  }
}`;

const normContent = content.replace(/\r\n/g, '\n');
let updated = normContent;

if (normContent.includes(oldSyncCode.replace(/\r\n/g, '\n'))) {
  updated = updated.replace(oldSyncCode.replace(/\r\n/g, '\n'), newSyncCode.replace(/\r\n/g, '\n'));
  console.log('SUCCESS: replaced syncCodeToCloud');
} else {
  console.warn('WARNING: oldSyncCode not matched');
}

if (updated.includes(oldFetchCode.replace(/\r\n/g, '\n'))) {
  updated = updated.replace(oldFetchCode.replace(/\r\n/g, '\n'), newFetchCode.replace(/\r\n/g, '\n'));
  console.log('SUCCESS: replaced fetchCodeFromCloud');
} else {
  console.warn('WARNING: oldFetchCode not matched');
}

if (updated.includes(oldMarkUsed.replace(/\r\n/g, '\n'))) {
  updated = updated.replace(oldMarkUsed.replace(/\r\n/g, '\n'), newMarkUsed.replace(/\r\n/g, '\n'));
  console.log('SUCCESS: replaced markCodeAsUsedInCloud');
} else {
  console.warn('WARNING: oldMarkUsed not matched');
}

fs.writeFileSync(filePath, updated, 'utf8');
console.log('firestoreSync.js patch complete');
