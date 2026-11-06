const fs = require('fs');
const path = require('path');

const contextPath = path.resolve(__dirname, '../src/context/TeacherContext.jsx');
let code = fs.readFileSync(contextPath, 'utf8');

const target = 'const cloudDeletedSet = new Set(incomingDeletedIds);';
const replacement = `console.log('[DEBUG applyCloudManifest] incomingLectures count:', incomingLectures.length, 'cloudDeleted count:', cloudDeletedSet.size);
    const cloudDeletedSet = new Set(incomingDeletedIds);`;

if (!code.includes('[DEBUG applyCloudManifest]')) {
  code = code.replace(target, replacement);
  fs.writeFileSync(contextPath, code, 'utf8');
  console.log('Added debug log to applyCloudManifest');
}
