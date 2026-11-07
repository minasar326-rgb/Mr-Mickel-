const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'services', 'firestoreSync.js');
let code = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

const target = `  // 1. Try RTDB first (fastest across mobile networks in Egypt and unrestricted)
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
  }`;

const replacement = `  // Fast race helper to prevent hanging on weak mobile connections
  const withTimeout = (prom, ms = 2200) => Promise.race([
    prom,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);

  // 1. Try RTDB first (fastest across mobile networks in Egypt and unrestricted)
  if (rtdb) {
    try {
      const snap = await withTimeout(rtdbGet(rtdbRef(rtdb, 'codes/' + normalized)), 2000);
      if (snap && snap.exists()) {
        return snap.val();
      }
      const subSnap = await withTimeout(rtdbGet(rtdbRef(rtdb, 'subscriptionCodes/' + normalized)), 2000);
      if (subSnap && subSnap.exists()) {
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
      const snap = await withTimeout(getDoc(docRef), 2200);
      if (snap && snap.exists()) {
        return snap.data();
      }
      const subDocRef = doc(db, 'subscriptionCodes', normalized);
      const subSnap = await withTimeout(getDoc(subDocRef), 2200);
      if (subSnap && subSnap.exists()) {
        return subSnap.data();
      }
    } catch (e) {
      console.warn('Firestore code fetch notice:', e.message);
    }
  }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log('✅ Successfully added network timeouts to fetchCodeFromCloud in firestoreSync.js');
} else {
  console.log('❌ Target not found in firestoreSync.js');
}
