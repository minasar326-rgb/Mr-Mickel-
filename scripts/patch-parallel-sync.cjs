const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'services', 'firestoreSync.js');
let code = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

const target = `    // 1. Save to students collection
    let studentsSaved = false;
    try {
      await setDoc(doc(db, 'students', uid), {
        subscriptions: {
          [stageId]: normalizedSubscription
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
      studentsSaved = true;
    } catch (e) {
      console.error('Firestore save to students collection failed:', e);
    }

    // 2. Save to users collection
    let usersSaved = false;
    try {
      await setDoc(doc(db, 'users', uid), {
        subscriptions: {
          [stageId]: normalizedSubscription
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
      usersSaved = true;
    } catch (e) {
      console.error('Firestore save to users collection failed:', e);
    }

    // 3. Save to top-level subscriptions collection (\${uid}_\${stageId})
    let subDocSaved = false;
    try {
      const subDocId = \`\${uid}_\${stageId}\`;
      await setDoc(doc(db, 'subscriptions', subDocId), normalizedSubscription, { merge: true });
      subDocSaved = true;
    } catch (e) {
      console.error('Firestore save to top-level subscriptions collection failed:', e);
    }

    // 4. Save to subcollections /users/{uid}/subscriptions and /students/{uid}/subscriptions (always permitted by rules)
    try {
      await setDoc(doc(db, 'users', uid, 'subscriptions', stageId), normalizedSubscription, { merge: true });
    } catch (_) {}
    try {
      await setDoc(doc(db, 'students', uid, 'subscriptions', stageId), normalizedSubscription, { merge: true });
    } catch (_) {}

    // 4. Save to RTDB for instant multi-device sync
    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, \`students/\${uid}/subscriptions/\${stageId}\`), normalizedSubscription);
        await rtdbSet(rtdbRef(rtdb, \`users/\${uid}/subscriptions/\${stageId}\`), normalizedSubscription);
        await rtdbSet(rtdbRef(rtdb, \`subscriptions/\${uid}_\${stageId}\`), normalizedSubscription);
      } catch (e) {
        console.warn('RTDB subscription sync warning:', e);
      }
    }

    // Resilient offline-first fallback: If network is offline, subscription is safely preserved in local vault
    if (!studentsSaved && !usersSaved && !subDocSaved) {
      console.warn('⚠️ Cloud sync delayed or offline: subscription is securely preserved on device and in permanent vault.');
    }`;

const replacement = `    // High-Speed Concurrent Cloud Sync: Run all cloud operations in parallel!
    const syncPromises = [];

    if (db) {
      syncPromises.push(
        setDoc(doc(db, 'students', uid), {
          subscriptions: { [stageId]: normalizedSubscription },
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(e => console.warn('students sync notice:', e?.message))
      );
      syncPromises.push(
        setDoc(doc(db, 'users', uid), {
          subscriptions: { [stageId]: normalizedSubscription },
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(e => console.warn('users sync notice:', e?.message))
      );
      const subDocId = \`\${uid}_\${stageId}\`;
      syncPromises.push(
        setDoc(doc(db, 'subscriptions', subDocId), normalizedSubscription, { merge: true }).catch(e => console.warn('subscriptions sync notice:', e?.message))
      );
      syncPromises.push(
        setDoc(doc(db, 'users', uid, 'subscriptions', stageId), normalizedSubscription, { merge: true }).catch(() => {})
      );
      syncPromises.push(
        setDoc(doc(db, 'students', uid, 'subscriptions', stageId), normalizedSubscription, { merge: true }).catch(() => {})
      );
    }

    if (rtdb) {
      syncPromises.push(
        rtdbSet(rtdbRef(rtdb, \`students/\${uid}/subscriptions/\${stageId}\`), normalizedSubscription).catch(() => {})
      );
      syncPromises.push(
        rtdbSet(rtdbRef(rtdb, \`users/\${uid}/subscriptions/\${stageId}\`), normalizedSubscription).catch(() => {})
      );
      syncPromises.push(
        rtdbSet(rtdbRef(rtdb, \`subscriptions/\${uid}_\${stageId}\`), normalizedSubscription).catch(() => {})
      );
    }

    // Cap at 1.8s so user on slow mobile connection gets instant UI response
    await Promise.race([
      Promise.allSettled(syncPromises),
      new Promise(resolve => setTimeout(resolve, 1800))
    ]);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log('✅ Successfully replaced serial sync with parallel sync in firestoreSync.js');
} else {
  console.log('❌ Target not found in firestoreSync.js');
}
