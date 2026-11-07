const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'context', 'TeacherContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import of normalize10DigitCode
if (!content.includes('normalize10DigitCode')) {
  content = `import { normalize10DigitCode } from '../utils/codeNormalizer.js';\n` + content;
}

// 1. Fix canAccessLecture: Require verified admin session, do NOT trust unverified role === 'instructor'
const oldTeacherCheck = `    // 1. Instructor role or valid admin session bypasses all locks
    if (role === 'instructor' || Boolean(verifyAdminSession()?.isValid)) {`;

const newTeacherCheck = `    // 1. Instructor role requires verified cryptographic admin session (Master PIN)
    const isAdminVerified = Boolean(verifyAdminSession()?.isValid);
    if (isAdminVerified) {`;

content = content.replace(oldTeacherCheck, newTeacherCheck);

// 2. Fix getSubscriptionStatus: Never match stage canonId unless subType is explicitly stage or all-access
const oldStageSearch = `        // Search through all active subscriptions to see if any covers this stage
        else {
          for (const key of Object.keys(userSubs)) {
            const currentSub = userSubs[key];
            if (!currentSub) continue;
            if (currentSub.userId && currentSub.userId !== currentUid) continue;
            
            const normalizedKey = normalizeStageId(key);
            const normalizedSubStage = normalizeStageId(currentSub.stageId || currentSub.courseId || currentSub.targetId);
            
            if (normalizedKey === canonId || normalizedSubStage === canonId || normalizedKey === 'all-access' || normalizedSubStage === 'all-access') {
              sub = currentSub;
              break;
            }
          }
        }`;

const newStageSearch = `        // Search through all active subscriptions to see if any covers this stage
        else {
          for (const key of Object.keys(userSubs)) {
            const currentSub = userSubs[key];
            if (!currentSub) continue;
            if (currentSub.userId && currentSub.userId !== currentUid) continue;
            
            const subType = (currentSub.codeType || currentSub.type || '').toLowerCase();
            const isStageSub = subType === 'stage' || key === 'all-access' || currentSub.targetId === 'all-access';
            
            if (isStageSub) {
              const normalizedKey = normalizeStageId(key);
              const normalizedSubStage = normalizeStageId(currentSub.stageId || currentSub.courseId || currentSub.targetId);
              if (normalizedKey === canonId || normalizedSubStage === canonId || normalizedKey === 'all-access') {
                sub = currentSub;
                break;
              }
            }
          }
        }`;

content = content.replace(oldStageSearch, newStageSearch);

// 3. Fix rehydration effect: Do NOT unlock all stage lectures for month/lecture subscriptions
const oldRehydrate = `          const canonStage = normalizeStageId(sId, sub.stageId || sub.targetTitle || '');
          activeIds.push(sId);
          activeIds.push(canonStage);

          const safeSub = {
            ...sub,
            userId: currentUid,
            targetId: sId,
            targetTitle: sub.targetTitle || \`اشتراك مرحلة: \${sId}\`,
            startDate: sub.startDate || sub.activatedAt || new Date().toISOString(),
            expirationDate: expiryStr,
            expiresAt: expiryStr,
            durationDays: sub.durationDays || 30
          };

          activeUnlocks[sId] = safeSub;
          activeUnlocks[canonStage] = safeSub;

          // Unlock all lectures belonging to this subscribed stage
          (lectures || []).filter(l => l.stageId === sId || normalizeStageId(l.stageId) === canonStage).forEach(l => {
            activeIds.push(l.id);
            activeUnlocks[l.id] = {
              ...safeSub,
              targetId: l.id,
              fromStage: canonStage
            };
          });`;

const newRehydrate = `          const subType = (sub.codeType || sub.type || '').toLowerCase();
          const canonStage = normalizeStageId(sub.stageId || sId || '');
          activeIds.push(sId);

          const safeSub = {
            ...sub,
            userId: currentUid,
            targetId: sId,
            targetTitle: sub.targetTitle || \`اشتراك محتوى: \${sId}\`,
            startDate: sub.startDate || sub.activatedAt || new Date().toISOString(),
            expirationDate: expiryStr,
            expiresAt: expiryStr,
            durationDays: sub.durationDays || 36500
          };
          activeUnlocks[sId] = safeSub;

          if (subType === 'lecture') {
            // Unlocks ONLY this specific lecture
            activeIds.push(sId);
            activeUnlocks[sId] = safeSub;
          } else if (subType === 'month' || subType === 'course') {
            // Unlocks ONLY lectures in this specific month
            (lectures || []).filter(l => l.sectionId === sId).forEach(l => {
              activeIds.push(l.id);
              activeUnlocks[l.id] = { ...safeSub, targetId: l.id, fromSection: sId };
            });
          } else if (subType === 'stage' || sId === 'all-access') {
            // Unlocks all lectures in this specific stage
            activeIds.push(canonStage);
            activeUnlocks[canonStage] = safeSub;
            (lectures || []).filter(l => l.stageId === sId || normalizeStageId(l.stageId) === canonStage).forEach(l => {
              activeIds.push(l.id);
              activeUnlocks[l.id] = { ...safeSub, targetId: l.id, fromStage: canonStage };
            });
          }`;

content = content.replace(oldRehydrate, newRehydrate);

// 4. Pass accessCodes to executeRedeemCode
content = content.replace(
  `    const result = await executeRedeemCode({
      cleanCode,
      codeStr: cleanCode,
      currentUser,
      lectures,
      stages,
      sections,`,
  `    const result = await executeRedeemCode({
      cleanCode,
      codeStr: cleanCode,
      currentUser,
      lectures,
      stages,
      sections,
      accessCodes,`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('TeacherContext.jsx patch v2 complete');
