const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'services', 'redemptionService.js');
let code = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

const target = `      const transactionResult = await runTransaction(db, async (transaction) => {`;

const replacement = `      const transactionPromise = runTransaction(db, async (transaction) => {`;

const targetEnd = `      });

      firestoreSuccess = true;`;

const replacementEnd = `      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('firestore_timeout')), 3500)
      );

      const transactionResult = await Promise.race([transactionPromise, timeoutPromise]);

      firestoreSuccess = true;`;

if (code.includes(target) && code.includes(targetEnd)) {
  code = code.replace(target, replacement);
  code = code.replace(targetEnd, replacementEnd);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log('✅ Added 3.5s timeout to Firestore transaction in redemptionService.js');
} else {
  console.log('❌ Target not found in redemptionService.js');
}
