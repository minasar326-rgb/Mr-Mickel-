const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'context', 'TeacherContext.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace generateNewCode
const generateNewCodeTarget = `  const generateNewCode = async (param1, param2, param3, param4, param5, param6) => {
    let opts = {};
    if (typeof param1 === 'object' && param1 !== null) {
      opts = param1;
    } else {
      opts = {
        stageName: param1 || 'الصف الثالث الثانوي',
        targetTitle: param2 || 'اشتراك المحاضرة',
        targetId: param3 || 'lec-s3-01',
        price: param4 || '70 ج.م',
        codeType: param5 || 'lecture',
        durationDays: param6 || 30
      };
    }

    const {
      stageName = '',
      stageId = '',
      targetTitle = 'اشتراك المحتوى',
      targetId = '',
      codeType = 'month',
      price = 180,
      durationDays = 30,
      expiryDate = '',
      maxUses = 1,
      isGift = false,
      customCode = '',
      bundleItems = []
    } = opts;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const typePrefix = codeType === 'month' ? 'MTH' : codeType === 'course' ? 'CRS' : codeType === 'bundle' ? 'BDL' : codeType === 'stage' ? 'STG' : 'LEC';
    const stagePrefix = (stageId || 'GEN').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const newCodeStr = (customCode && customCode.trim()) ? customCode.trim().toUpperCase() : \`MS-\${stagePrefix}-\${typePrefix}-\${randomSuffix}\`;
    const days = Number(durationDays) || 30;

    const cleanTargetId = targetId || (codeType === 'stage' ? stageId : targetId);

    const newCodeObj = {
      code: newCodeStr,
      type: codeType,
      codeType,
      targetId: cleanTargetId,
      targetTitle: targetTitle || 'اشتراك المحتوى',
      stage: stageName || (stages.find(s => s.id === stageId)?.name || ''),
      stageId: stageId || '',
      price: isGift ? 'مجاني / هدية' : (typeof price === 'number' ? \`\${price} ج.م\` : price),
      rawPrice: isGift ? 0 : (Number(String(price).replace(/[^0-9.]/g, '')) || 0),
      durationDays: days,
      durationLabel: days === 7 ? '7 أيام (أسبوع)' : days === 15 ? '15 يوم' : days === 30 ? 'شهر (30 يوم)' : days === 60 ? 'شهرين (60 يوم)' : days === 120 ? 'تيرم كامل (4 شهور)' : days === 365 ? 'سنة كاملة (365 يوم)' : \`\${days} يوم\`,
      isSingleUse: Number(maxUses) === 1,
      maxUses: Number(maxUses) || 1,
      usedCount: 0,
      isUsed: false,
      isActive: true,
      isGift: Boolean(isGift),
      expiryDate: expiryDate || null,
      bundleItems: Array.isArray(bundleItems) ? bundleItems : [],
      usedBy: null,
      usedByList: [],
      usedAt: null,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAccessCodes(prev => [newCodeObj, ...prev]);
    await syncCodeToCloud(newCodeObj);
    addToast(\`تم إنشاء كود الشحن الجديد: \${newCodeStr} (\${newCodeObj.targetTitle}) بنجاح 📋\`, 'success');
    return newCodeObj;
  };`;

const generateNewCodeReplacement = `  // Cryptographically unique 10-digit code generator (Strict 10 digits only: 1000000000 to 9999999999)
  const generate10DigitCode = (existingList = []) => {
    const existing = new Set((existingList || []).map(c => (typeof c === 'string' ? c : c?.code)));
    let codeStr = '';
    let attempts = 0;
    do {
      const first = Math.floor(1 + Math.random() * 9); // 1-9
      let rest = '';
      for (let i = 0; i < 9; i++) {
        rest += Math.floor(Math.random() * 10); // 0-9
      }
      codeStr = \`\${first}\${rest}\`;
      attempts++;
    } while (existing.has(codeStr) && attempts < 100);
    return codeStr;
  };

  const generateNewCode = async (param1, param2, param3, param4, param5, param6) => {
    let opts = {};
    if (typeof param1 === 'object' && param1 !== null) {
      opts = param1;
    } else {
      opts = {
        stageName: param1 || 'الصف الثالث الثانوي',
        targetTitle: param2 || 'اشتراك المحاضرة',
        targetId: param3 || 'lec-s3-01',
        price: param4 || '70 ج.م',
        codeType: param5 || 'lecture',
        durationDays: param6 || 36500
      };
    }

    const {
      stageName = '',
      stageId = '',
      targetTitle = 'اشتراك المحتوى',
      targetId = '',
      codeType = 'month', // 'stage' | 'month' | 'lecture'
      price = 180,
      customCode = ''
    } = opts;

    // Generate strict 10-digit numeric code
    let finalCodeStr = '';
    if (customCode && /^[0-9]{10}$/.test(customCode.trim())) {
      finalCodeStr = customCode.trim();
    } else {
      finalCodeStr = generate10DigitCode(accessCodes);
    }

    const cleanTargetId = targetId || (codeType === 'stage' ? stageId : targetId);

    const newCodeObj = {
      code: finalCodeStr,
      type: codeType,
      codeType: codeType, // 'stage' | 'month' | 'lecture'
      targetId: cleanTargetId,
      targetTitle: targetTitle || 'اشتراك المحتوى',
      stage: stageName || (stages.find(s => s.id === stageId)?.name || ''),
      stageId: stageId || '',
      sectionId: opts.sectionId || (codeType === 'month' ? cleanTargetId : ''),
      lectureId: opts.lectureId || (codeType === 'lecture' ? cleanTargetId : ''),
      price: typeof price === 'number' ? \`\${price} ج.م\` : (price || '180 ج.م'),
      rawPrice: Number(String(price).replace(/[^0-9.]/g, '')) || 0,
      isPermanent: true, // Permanent subscription, never expires
      durationDays: 36500,
      durationLabel: 'اشتراك دائم ومستمر لحساب الطالب ♾️',
      isSingleUse: true,
      maxUses: 1, // Single-use only
      usedCount: 0,
      isUsed: false,
      isActive: true,
      usedBy: null,
      usedByUid: null,
      usedByEmail: null,
      usedAt: null,
      createdAt: new Date().toISOString()
    };

    setAccessCodes(prev => [newCodeObj, ...prev]);
    await syncCodeToCloud(newCodeObj);
    addToast(\`🎉 تم إصدار كود التفعيل: \${finalCodeStr} (\${newCodeObj.targetTitle}) بنجاح 📋\`, 'success');
    return newCodeObj;
  };`;

if (code.includes(generateNewCodeTarget)) {
  code = code.replace(generateNewCodeTarget, generateNewCodeReplacement);
  console.log('SUCCESS: Patched generateNewCode in TeacherContext.jsx');
} else {
  console.log('WARNING: generateNewCodeTarget not found directly, checking normalized whitespace...');
  const normalizedCode = code.replace(/\r\n/g, '\n');
  const normalizedTarget = generateNewCodeTarget.replace(/\r\n/g, '\n');
  if (normalizedCode.includes(normalizedTarget)) {
    code = normalizedCode.replace(normalizedTarget, generateNewCodeReplacement.replace(/\r\n/g, '\n'));
    console.log('SUCCESS: Patched generateNewCode with normalized CRLF');
  } else {
    console.error('ERROR: Could not find generateNewCodeTarget in TeacherContext.jsx');
  }
}

// 2. Patch getSubscriptionStatus permanence
const oldSubCheck = `      const expiryStr = sub?.expirationDate || sub?.expiresAt;
      if (!sub || !expiryStr) {
        return { isSubscribed: false, isExpired: false, status: 'none' };
      }`;

const newSubCheck = `      const isPermanent = Boolean(sub?.isPermanent || (sub?.durationDays && sub.durationDays > 3650));
      const expiryStr = sub?.expirationDate || sub?.expiresAt || (isPermanent ? '2099-12-31T23:59:59.999Z' : null);
      if (!sub || (!expiryStr && !isPermanent)) {
        return { isSubscribed: false, isExpired: false, status: 'none' };
      }`;

if (code.includes(oldSubCheck)) {
  code = code.replace(oldSubCheck, newSubCheck);
  console.log('SUCCESS: Patched expiry check in getSubscriptionStatus');
} else {
  const normOld = oldSubCheck.replace(/\r\n/g, '\n');
  if (code.includes(normOld)) {
    code = code.replace(normOld, newSubCheck.replace(/\r\n/g, '\n'));
    console.log('SUCCESS: Patched expiry check with normalized CRLF');
  }
}

// Also check right after startDateStr in getSubscriptionStatus:
const oldFreezeCheck = `      // Account Freeze Check:
      if (currentUser?.isFrozen === true || sub.isFrozen === true) {`;

const newFreezeCheck = `      // Permanence check: Permanent subscriptions never expire!
      if (isPermanent && currentUser?.isFrozen !== true && sub.isFrozen !== true) {
        return {
          isSubscribed: true,
          isExpired: false,
          isPermanent: true,
          status: 'active',
          daysLeft: 99999,
          hoursLeft: 999999,
          subscription: sub,
          stageName: sub.stage || sub.stageName || '',
          targetTitle: sub.targetTitle || 'اشتراك دائم',
          targetId: sub.targetId || targetId,
          startDate: startDateStr,
          startDateFormatted,
          expirationDate: '2099-12-31T23:59:59.999Z',
          expiresAt: '2099-12-31T23:59:59.999Z',
          expiresAtFormatted: 'دائم مدى الحياة ♾️'
        };
      }

      // Account Freeze Check:
      if (currentUser?.isFrozen === true || sub.isFrozen === true) {`;

if (code.includes(oldFreezeCheck)) {
  code = code.replace(oldFreezeCheck, newFreezeCheck);
  console.log('SUCCESS: Injected permanence handler in getSubscriptionStatus');
} else {
  const normFreeze = oldFreezeCheck.replace(/\r\n/g, '\n');
  if (code.includes(normFreeze)) {
    code = code.replace(normFreeze, newFreezeCheck.replace(/\r\n/g, '\n'));
    console.log('SUCCESS: Injected permanence handler with normalized CRLF');
  }
}

// 3. Patch redeemCode to update local accessCodes immediately
const oldRedeemTarget = `        if (addSubscriptionToUser) {
          await addSubscriptionToUser(targetId, sub);
        }
      }
    });`;

const newRedeemTarget = `        if (addSubscriptionToUser) {
          await addSubscriptionToUser(targetId, sub);
        }
        // Immediately mark the code as used in accessCodes state so the teacher sees it in real-time
        const cleanUsedCode = (codeStr || '').trim();
        setAccessCodes(prev => prev.map(c => ((c.code || '').trim() === cleanUsedCode ? {
          ...c,
          isUsed: true,
          status: 'used',
          usedCount: (c.usedCount || 0) + 1,
          usedByUid: studentUid,
          usedBy: currentUser?.name || 'طالب مسجل',
          usedByEmail: currentUser?.email || '',
          usedAt: new Date().toISOString()
        } : c)));
      }
    });`;

if (code.includes(oldRedeemTarget)) {
  code = code.replace(oldRedeemTarget, newRedeemTarget);
  console.log('SUCCESS: Patched redeemCode local accessCodes sync');
} else {
  const normRedeem = oldRedeemTarget.replace(/\r\n/g, '\n');
  if (code.includes(normRedeem)) {
    code = code.replace(normRedeem, newRedeemTarget.replace(/\r\n/g, '\n'));
    console.log('SUCCESS: Patched redeemCode with normalized CRLF');
  }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Done updating TeacherContext.jsx');
