const fs = require('fs');
let content = fs.readFileSync('src/utils/entitlements.js', 'utf8').replace(/\r\n/g, '\n');

const targetMonthBlock = `  // 3. Month / Section Subscription (Unlocks all lectures in this specific month, including future lectures added to this month)
  if (subType === 'month' || subType === 'course') {
    // Only unlocks if the lecture belongs to this exact section/month
    return Boolean(targetId && lecture.sectionId && targetId === lecture.sectionId);
  }
  if (targetId && lecture.sectionId && targetId === lecture.sectionId && subType !== 'stage' && subType !== 'lecture') {
    return true;
  }`;

const replacementMonthBlock = `  // 3. Month / Section Subscription (Unlocks all lectures in this specific month, including future lectures added to this month)
  if (subType === 'month' || subType === 'course') {
    if (targetId && lecture.sectionId && targetId === lecture.sectionId) return true;
    const normTarget = String(targetId).toLowerCase().replace(/[^a-z0-9]/g, '');
    const normLectureSec = String(lecture.sectionId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normTarget && normLectureSec && normTarget === normLectureSec) return true;
    return false;
  }
  if (targetId && lecture.sectionId && subType !== 'stage' && subType !== 'lecture') {
    if (targetId === lecture.sectionId) return true;
    const normTarget = String(targetId).toLowerCase().replace(/[^a-z0-9]/g, '');
    const normLectureSec = String(lecture.sectionId).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normTarget && normLectureSec && normTarget === normLectureSec) return true;
  }`;

if (!content.includes(targetMonthBlock)) {
  console.error('targetMonthBlock not found in entitlements.js');
  process.exit(1);
}

content = content.replace(targetMonthBlock, replacementMonthBlock);
fs.writeFileSync('src/utils/entitlements.js', content, 'utf8');
console.log('Successfully updated entitlements.js');
