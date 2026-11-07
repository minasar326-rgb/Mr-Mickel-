const fs = require('fs');
let content = fs.readFileSync('src/context/TeacherContext.jsx', 'utf8').replace(/\r\n/g, '\n');

// 1. In applyCloudManifest, add codes synchronization
const sectionsManifestTarget = `      if (Array.isArray(manifestData.sections) && manifestData.sections.length > 0) {
        setSections(prev => {
          const merged = mergeSections(prev, manifestData.sections);
          if (areSectionsEqual(prev, merged)) {
            return prev;
          }
          try { localStorage.setItem('ms_sections', JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
        anyApplied = true;
      }`;

const sectionsManifestReplace = `      if (Array.isArray(manifestData.sections) && manifestData.sections.length > 0) {
        setSections(prev => {
          const merged = mergeSections(prev, manifestData.sections);
          if (areSectionsEqual(prev, merged)) {
            return prev;
          }
          try { localStorage.setItem('ms_sections', JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
        anyApplied = true;
      }
      if (Array.isArray(manifestData.codes) && manifestData.codes.length > 0) {
        setAccessCodes(prev => {
          const map = new Map((prev || []).map(c => [c.code, c]));
          manifestData.codes.forEach(c => {
            if (c && c.code) {
              const existing = map.get(c.code);
              if (existing) {
                map.set(c.code, {
                  ...existing,
                  ...c,
                  status: (existing.status === 'used' || c.status === 'used') ? 'used' : (c.status || existing.status),
                  isUsed: existing.isUsed || c.isUsed || (existing.status === 'used' || c.status === 'used')
                });
              } else {
                map.set(c.code, c);
              }
            }
          });
          const mergedCodes = Array.from(map.values());
          try { localStorage.setItem('ms_codes', JSON.stringify(mergedCodes)); } catch (e) {}
          return mergedCodes;
        });
        anyApplied = true;
      }`;

if (!content.includes(sectionsManifestTarget)) {
  console.error('sectionsManifestTarget not found');
  process.exit(1);
}
content = content.replace(sectionsManifestTarget, sectionsManifestReplace);

// 2. In canAccessLecture, harden teacher check
const canAccessTarget = `    // 1. Instructor role or valid admin session bypasses all locks
    if (role === 'instructor' || Boolean(verifyAdminSession()?.isValid)) {`;

const canAccessReplace = `    // 1. Valid verified admin session bypasses all locks (ONLY verified cryptographic session, never raw unverified role string!)
    const isAdminVerified = Boolean(verifyAdminSession()?.isValid || verifyAdminSession()?.valid);
    if (isAdminVerified) {`;

if (!content.includes(canAccessTarget)) {
  console.error('canAccessTarget not found');
  process.exit(1);
}
content = content.replace(canAccessTarget, canAccessReplace);

// 3. In generateNewCode, update R2 manifest with new code
const generateCodeTarget = `    setAccessCodes(prev => [newCodeObj, ...prev]);
    await syncCodeToCloud(newCodeObj);`;

const generateCodeReplace = `    setAccessCodes(prev => {
      const next = [newCodeObj, ...prev];
      try { localStorage.setItem('ms_codes', JSON.stringify(next)); } catch (e) {}
      syncLecturesManifestToR2(lectures, { stages, sections, codes: next }).catch(() => {});
      return next;
    });
    await syncCodeToCloud(newCodeObj);`;

if (!content.includes(generateCodeTarget)) {
  console.error('generateCodeTarget not found');
  process.exit(1);
}
content = content.replace(generateCodeTarget, generateCodeReplace);

// 4. In deleteCode, update R2 manifest
const deleteCodeTarget = `  const deleteCode = async (codeStr) => {
    setAccessCodes(prev => prev.filter(c => c.code !== codeStr));
    await deleteCodeFromCloud(codeStr);
    addToast(\`تم حذف كود الشحن (\${codeStr}) 🗑️\`, 'info');
  };`;

const deleteCodeReplace = `  const deleteCode = async (codeStr) => {
    setAccessCodes(prev => {
      const next = prev.filter(c => c.code !== codeStr);
      try { localStorage.setItem('ms_codes', JSON.stringify(next)); } catch (e) {}
      syncLecturesManifestToR2(lectures, { stages, sections, codes: next }).catch(() => {});
      return next;
    });
    await deleteCodeFromCloud(codeStr);
    addToast(\`تم حذف كود الشحن (\${codeStr}) 🗑️\`, 'info');
  };`;

if (!content.includes(deleteCodeTarget)) {
  console.error('deleteCodeTarget not found');
  process.exit(1);
}
content = content.replace(deleteCodeTarget, deleteCodeReplace);

// 5. In redeemCode, pass accessCodes and update manifest on redemption
const redeemTarget = `    const result = await executeRedeemCode({
      codeStr,
      currentUser,
      lectures,
      stages,
      sections,
      onSubscriptionAdded: async (targetId, sub) => {
        if (addSubscriptionToUser) {
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
    });

    if (!result.ok) {
      addToast(result.error || 'فشل تفعيل الكود', 'error', 6000);
      return {
        success: false,
        ok: false,
        error: result.reasonCode || 'redemption_failed',
        reasonText: result.error,
        message: result.error
      };
    }`;

const redeemReplace = `    const result = await executeRedeemCode({
      codeStr,
      currentUser,
      lectures,
      stages,
      sections,
      accessCodes,
      onSubscriptionAdded: async (targetId, sub) => {
        if (addSubscriptionToUser) {
          await addSubscriptionToUser(targetId, sub);
        }
        // Immediately mark the code as used in accessCodes state so the teacher sees it in real-time
        const cleanUsedCode = normalize10DigitCode(codeStr);
        setAccessCodes(prev => {
          const next = prev.map(c => (normalize10DigitCode(c.code) === cleanUsedCode ? {
            ...c,
            isUsed: true,
            status: 'used',
            usedCount: (c.usedCount || 0) + 1,
            usedByUid: studentUid,
            usedBy: currentUser?.name || 'طالب مسجل',
            usedByEmail: currentUser?.email || '',
            usedAt: new Date().toISOString()
          } : c));
          try { localStorage.setItem('ms_codes', JSON.stringify(next)); } catch (e) {}
          syncLecturesManifestToR2(lectures, { stages, sections, codes: next }).catch(() => {});
          return next;
        });
      }
    });

    if (!result.ok) {
      const errMsg = result.message || result.error || 'فشل تفعيل الكود';
      addToast(errMsg, 'error', 6000);
      return {
        success: false,
        ok: false,
        error: result.error || result.reasonCode || 'redemption_failed',
        reasonText: errMsg,
        message: errMsg
      };
    }`;

if (!content.includes(redeemTarget)) {
  console.error('redeemTarget not found');
  process.exit(1);
}
content = content.replace(redeemTarget, redeemReplace);

fs.writeFileSync('src/context/TeacherContext.jsx', content, 'utf8');
console.log('Successfully updated TeacherContext.jsx');
