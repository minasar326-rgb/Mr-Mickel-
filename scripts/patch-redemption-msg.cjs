const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'services', 'redemptionService.js');
let code = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

const target = `  return {
    ok: true,
    success: true,
    alreadyActive: Boolean(studentAlreadyUsed),
    subscription: sub,
    stageName: sub.targetTitle || 'المحتوى التعليمي',
    targetTitle: sub.targetTitle || 'المحتوى التعليمي',
    startDate: new Date(sub.startDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    expirationDate: 'دائم مدى الحياة ♾️',
    isPermanent: true,
    durationDays: sub.durationDays,
    coveredLectures: covered,
    unlockedLectures: unlocked,
    lockedLectures: progressionLocked,
    firstUnlockedLecture: unlocked[0] || null,
    message: studentAlreadyUsed ? 'تم تأكيد اشتراكك السابق، المحتوى مفعّل بحسابك بالفعل!' : 'تم الاشتراك وتفعيل المحتوى بنجاح! اشتراك دائم بحسابك.'
  };
}`;

const replacement = `  const startDateRaw = sub.startDate || codeData?.usedAt || codeData?.startDate || new Date().toISOString();
  let formattedStartDate = '';
  try {
    formattedStartDate = new Date(startDateRaw).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    formattedStartDate = new Date().toLocaleDateString('ar-EG');
  }

  const resolvedTitle = sub.targetTitle || codeData?.targetTitle || 'الشهر التعليمي';
  const alreadyUsedMsg = \`هذا الكود مخصص لـ (\${resolvedTitle}) ومسجل بحسابك بالفعل منذ \${formattedStartDate} واشتراكك فيه دائم! ولا يمكن استخدامه لتفعيل شهر آخر.\`;

  return {
    ok: true,
    success: true,
    alreadyActive: Boolean(studentAlreadyUsed),
    subscription: sub,
    stageName: resolvedTitle,
    targetTitle: resolvedTitle,
    startDate: formattedStartDate,
    expirationDate: 'دائم مدى الحياة ♾️',
    isPermanent: true,
    durationDays: sub.durationDays || 36500,
    coveredLectures: covered,
    unlockedLectures: unlocked,
    lockedLectures: progressionLocked,
    firstUnlockedLecture: unlocked[0] || null,
    message: studentAlreadyUsed ? alreadyUsedMsg : \`تم الاشتراك وتفعيل (\${resolvedTitle}) بنجاح! اشتراك دائم بحسابك.\`
  };
}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log('✅ Successfully updated redemptionService.js');
} else {
  console.log('❌ Target not found in redemptionService.js');
}
