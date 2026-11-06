/**
 * Database Restore Tool for Mr. Michael LMS
 * Restores local files and gives instructions for cloud restore from a backup JSON file.
 * Run: node scripts/restore-db.cjs --file "backups/backup-<timestamp>.json"
 */
const fs = require('fs');
const path = require('path');

async function runRestore() {
  const args = process.argv.slice(2);
  let fileArg = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      fileArg = args[i + 1];
    }
  }

  if (!fileArg) {
    // Pick the most recent backup
    const backupDir = path.join(__dirname, '..', 'backups');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).sort().reverse();
      if (files.length > 0) {
        fileArg = path.join(backupDir, files[0]);
      }
    }
  }

  if (!fileArg || !fs.existsSync(fileArg)) {
    console.error('❌ No backup file found to restore.');
    process.exit(1);
  }

  console.log(`🔄 Reading backup file: ${fileArg}`);
  const backup = JSON.parse(fs.readFileSync(fileArg, 'utf8'));

  // Restore local data files if present
  if (backup.localData) {
    const dataDir = path.join(__dirname, '..', 'src', 'data');
    for (const [filename, content] of Object.entries(backup.localData)) {
      const target = path.join(dataDir, filename);
      fs.writeFileSync(target, content, 'utf8');
      console.log(`✅ Restored ${filename}`);
    }
  }

  console.log('\n=======================================');
  console.log('🎉 Local data restoration complete!');
  console.log('For cloud databases (Firestore / RTDB):');
  console.log('1. Realtime Database can be imported directly in Firebase Console via "Import JSON" using this file.');
  console.log('2. The backup file contains all RTDB nodes under the "rtdb" property.');
  console.log('=======================================');
}

runRestore().catch(err => {
  console.error('❌ Restore failed:', err);
  process.exit(1);
});
