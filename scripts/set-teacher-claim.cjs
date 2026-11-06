/**
 * Set custom claim role='teacher' for Mr. Michael Shehata
 * Usage: node scripts/set-teacher-claim.cjs <teacher-email-or-uid>
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Attempt to load service account credentials if available
let serviceAccount = null;
const keyPaths = [
  path.join(__dirname, '..', 'service-account.json'),
  path.join(__dirname, '..', 'firebase-service-account.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS
].filter(Boolean);

for (const p of keyPaths) {
  if (fs.existsSync(p)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
      break;
    } catch (e) {}
  }
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'mnasa-lms'
    });
  }
}

async function setTeacherClaim(targetEmailOrUid) {
  const target = targetEmailOrUid || 'mrmichaelshehata@gmail.com';
  console.log(`Setting custom claim { role: 'teacher', admin: true } for: ${target}`);
  
  try {
    let userRecord;
    if (target.includes('@')) {
      userRecord = await admin.auth().getUserByEmail(target);
    } else {
      userRecord = await admin.auth().getUser(target);
    }

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'teacher',
      admin: true,
      teacher: true
    });

    console.log(`✅ Success! Custom claim { role: 'teacher' } granted to UID: ${userRecord.uid} (${userRecord.email})`);
  } catch (err) {
    console.error(`❌ Error setting custom claims:`, err.message);
  }
}

const target = process.argv[2] || 'mrmichaelshehata@gmail.com';
setTeacherClaim(target);
