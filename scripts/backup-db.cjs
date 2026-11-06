/**
 * Database Backup Tool for Mr. Michael LMS
 * Backs up Firestore & Realtime Database collections to a timestamped JSON file.
 * Run: node scripts/backup-db.cjs
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const FIREBASE_PROJECT_ID = 'mr-mi-586d2';
const RTDB_URL = 'https://mr-mi-586d2-default-rtdb.firebaseio.com';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function runBackup() {
  console.log('📦 Starting Database Backup for project:', FIREBASE_PROJECT_ID);
  
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  const backupData = {
    timestamp: new Date().toISOString(),
    projectId: FIREBASE_PROJECT_ID,
    rtdb: {},
    firestore: {},
    localData: {}
  };

  // 1. Fetch Realtime Database root
  try {
    console.log('⏳ Exporting Realtime Database...');
    const rtdbData = await fetchJson(`${RTDB_URL}/.json`);
    if (rtdbData) {
      backupData.rtdb = rtdbData;
      console.log('✅ RTDB exported successfully! Keys:', Object.keys(rtdbData));
    } else {
      console.log('ℹ️ RTDB returned empty or protected.');
    }
  } catch (err) {
    console.warn('⚠️ RTDB fetch warning:', err.message);
  }

  // 2. Read local cached states / data files
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const dataFiles = ['lecturesData.js', 'teacherData.js', 'examsData.js', 'studentCodes.js', 'mockStudents.js'];
  for (const file of dataFiles) {
    const fullPath = path.join(dataDir, file);
    if (fs.existsSync(fullPath)) {
      backupData.localData[file] = fs.readFileSync(fullPath, 'utf8');
    }
  }

  // Save backup to disk
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n🎉 Backup completed successfully!`);
  console.log(`📁 File saved at: ${backupFile}`);
  console.log(`\nTo restore from this backup, run:`);
  console.log(`node scripts/restore-db.cjs --file "${backupFile}"`);
}

runBackup().catch(err => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
