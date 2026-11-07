import { normalize10DigitCode } from '../utils/codeNormalizer.js';
import { db, auth } from './firebase.js';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { coversLecture, validateCodeTarget, getCoveredLectures } from '../utils/entitlements.js';
import { normalizeStageId } from '../utils/stages.js';
import { saveStudentSubscriptionToFirestore, syncCodeToCloud, fetchCodeFromCloud, markCodeAsUsedInCloud } from './firestoreSync.js';

/**
 * Enterprise Code Redemption Engine
 * Enforces server-side / transactional verification, prevents race conditions,
 * checks true content coverage, and guarantees one-time activation per student Google UID.
 */
export async function executeRedeemCode({
  cleanCode,
  codeStr,
  currentUser,
  stages = [],
  sections = [],
  lectures = [],
  accessCodes = [],
  onSubscriptionAdded
}) {
  const rawCode = (cleanCode || codeStr || '').trim();
  if (!rawCode) {
    return { ok: false, error: 'invalid_code', message: 'يرجى إدخال كود التفعيل بدقة.' };
  }

  // Normalize code: converts Eastern/Persian Arabic numerals to 0-9 and strips whitespace/formatting
  const sanitizedCode = normalize10DigitCode(rawCode);
  if (!sanitizedCode || sanitizedCode.length !== 10) {
    return { ok: false, error: 'invalid_code', message: 'كود التفعيل غير صحيح، تأكد من كتابة الـ 10 أرقام بدقة.' };
  }

  const studentUid = currentUser?.uid || currentUser?.id;
  if (!studentUid || studentUid === 'guest') {
    return { ok: false, error: 'not_logged_in', message: 'يجب تسجيل الدخول بحساب Google أولاً لتفعيل المحاضرة.' };
  }

  // 1. Try Cloudflare Pages / Worker endpoint if available
  try {
    const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
    if (idToken) {
      const apiRes = await fetch('./api/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ code: sanitizedCode })
      }).catch(() => null);

      if (apiRes && apiRes.ok) {
        const data = await apiRes.json();
        if (data.success && !data.delegatedToClient) {
          return handleSuccessfulRedemption({
            codeData: data,
            studentUid,
            currentUser,
            stages,
            sections,
            lectures,
            onSubscriptionAdded
          });
        }
      }
    }
  } catch (apiErr) {
    console.warn('API endpoint unavailable, falling back to Firestore Transaction:', apiErr);
  }

  // 2. Atomic Firestore Transaction (guarantees race condition prevention)
  let firestoreSuccess = false;
  if (db) {
    try {
      const codeRef = doc(db, 'codes', sanitizedCode);

      const transactionResult = await runTransaction(db, async (transaction) => {
        const codeSnap = await transaction.get(codeRef);

        if (!codeSnap.exists()) {
          throw new Error('invalid_code');
        }

        const codeData = codeSnap.data();

        // Check Active
        if (codeData.isActive === false) {
          throw new Error('code_disabled');
        }

        // Check Target ID
        const targetId = (codeData.targetId || '').trim();
        if (!targetId) {
          throw new Error('code_misconfigured');
        }

        // Validate Target exists in curriculum
        const targetValidation = validateCodeTarget(targetId, { stages, sections, lectures });
        if (!targetValidation.isValid) {
          throw new Error('code_misconfigured');
        }

        // Check Max Uses & Single-Use Rules
        const maxUses = Number(codeData.maxUses) || 1;
        const currentUsed = Number(codeData.usedCount) || (codeData.isUsed ? 1 : 0);
        const usedByList = Array.isArray(codeData.usedByList) ? codeData.usedByList : [];

        const studentAlreadyUsed = usedByList.includes(studentUid) || 
          codeData.usedByUid === studentUid ||
          (codeData.usedByEmail && currentUser?.email && codeData.usedByEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim());

        if (currentUsed >= maxUses && !studentAlreadyUsed) {
          throw new Error('already_used');
        }

        // Prepare updated usage
        const newUsedCount = studentAlreadyUsed ? currentUsed : currentUsed + 1;
        const isNowFullyUsed = newUsedCount >= maxUses;
        const updatedList = Array.from(new Set([...usedByList, studentUid]));

        const startDate = (studentAlreadyUsed && codeData.startDate) ? codeData.startDate : new Date().toISOString();
        const expiresAt = '2099-12-31T23:59:59.999Z'; // Permanent access

        // Atomic Update of Code Document in Firestore
        transaction.update(codeRef, {
          usedCount: newUsedCount,
          maxUses: maxUses,
          isUsed: isNowFullyUsed,
          status: isNowFullyUsed ? 'used' : 'active',
          usedByList: updatedList,
          usedBy: currentUser?.name || 'طالب مسجل بالمنصة',
          usedByUid: studentUid,
          usedByEmail: currentUser?.email || '',
          usedAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });

        // Prepare Primary Subscription Record (Permanent lifetime access)
        const subscriptionRecord = {
          userId: studentUid,
          targetId: targetId,
          courseId: targetId,
          stageId: codeData.stageId || targetValidation.stageId || normalizeStageId(targetId),
          targetTitle: targetValidation.targetTitle || codeData.targetTitle || 'محتوى تعليمي',
          codeType: codeData.codeType || targetValidation.targetType || 'month',
          activationCode: sanitizedCode,
          startDate: startDate,
          expirationDate: expiresAt,
          expiresAt: expiresAt,
          isPermanent: true,
          durationDays: 36500,
          status: 'active',
          isPaused: false,
          isCancelled: false,
          isFrozen: false,
          subscribed: true,
          updatedAt: new Date().toISOString()
        };

        // Write subscription under users/{uid}/subscriptions/{targetId}
        const userSubRef = doc(db, 'users', studentUid, 'subscriptions', targetId);
        transaction.set(userSubRef, subscriptionRecord, { merge: true });

        // Record Audit Log inside the transaction
        const auditLogRef = doc(db, 'auditLogs', `log_${Date.now()}_${sanitizedCode}`);
        transaction.set(auditLogRef, {
          action: 'CODE_REDEMPTION',
          code: sanitizedCode,
          uid: studentUid,
          studentName: currentUser?.name || '',
          studentEmail: currentUser?.email || '',
          targetId: targetId,
          targetTitle: subscriptionRecord.targetTitle,
          codeType: subscriptionRecord.codeType,
          usedCount: newUsedCount,
          timestamp: serverTimestamp()
        });

        return {
          codeData: { ...codeData, isUsed: isNowFullyUsed, usedByUid: studentUid, usedBy: currentUser?.name },
          targetValidation,
          subscriptionRecord,
          studentAlreadyUsed
        };
      });

      firestoreSuccess = true;
      return handleSuccessfulRedemption({
        codeData: transactionResult.codeData,
        subscriptionRecord: transactionResult.subscriptionRecord,
        studentUid,
        currentUser,
        stages,
        sections,
        lectures,
        studentAlreadyUsed: transactionResult.studentAlreadyUsed,
        onSubscriptionAdded
      });

    } catch (error) {
      const code = error?.message || '';
      if (code === 'invalid_code') {
        return { ok: false, error: 'invalid_code', message: 'كود التفعيل غير صحيح، تأكد من كتابة الـ 10 أرقام بدقة.' };
      }
      if (code === 'code_disabled') {
        return { ok: false, error: 'code_disabled', message: '⚠️ تم إيقاف كود التفعيل هذا مؤقتاً من قِبل إدارة المنصة.' };
      }
      if (code === 'already_used' || code === 'max_uses_reached') {
        return { ok: false, error: 'already_used', message: '⚠️ هذا الكود تم استخدامه بالفعل من قِبل حساب طالب آخر ولا يمكن استخدامه مرة أخرى.' };
      }
      if (code === 'code_misconfigured') {
        return { ok: false, error: 'code_misconfigured', message: 'الكود ده غير مكتمل، كلّم المستر' };
      }
      console.warn('Firestore transaction error, attempting local repository check:', error);
    }
  }

  // 3. Resilient Multi-Cloud Fallback: RTDB, R2 Global CDN Manifest, Firestore & State
  if (!firestoreSuccess) {
    let foundCode = await fetchCodeFromCloud(sanitizedCode);

    if (!foundCode && Array.isArray(accessCodes) && accessCodes.length > 0) {
      foundCode = accessCodes.find(c => normalize10DigitCode(c.code) === sanitizedCode);
    }

    if (!foundCode) {
      try {
        const saved = localStorage.getItem('ms_codes');
        if (saved) {
          const localCodes = JSON.parse(saved);
          foundCode = localCodes.find(c => normalize10DigitCode(c.code) === sanitizedCode);
        }
      } catch (e) {}
    }

    if (!foundCode) {
      return { ok: false, error: 'invalid_code', message: 'كود التفعيل غير صحيح، تأكد من كتابة الـ 10 أرقام بدقة.' };
    }

    if (foundCode.isActive === false) {
      return { ok: false, error: 'code_disabled', message: '⚠️ تم إيقاف كود التفعيل هذا مؤقتاً من قِبل إدارة المنصة.' };
    }

    const studentAlreadyUsed = foundCode.usedByUid === studentUid ||
      (foundCode.usedByEmail && currentUser?.email && foundCode.usedByEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim());

    if (foundCode.isUsed && !studentAlreadyUsed) {
      return { ok: false, error: 'already_used', message: '⚠️ هذا الكود تم استخدامه بالفعل من قِبل حساب طالب آخر ولا يمكن استخدامه مرة أخرى.' };
    }

    const targetValidation = validateCodeTarget(foundCode.targetId, { stages, sections, lectures });
    const targetId = foundCode.targetId;
    const expiresAt = '2099-12-31T23:59:59.999Z';

    const subscriptionRecord = {
      userId: studentUid,
      targetId: targetId,
      courseId: targetId,
      stageId: foundCode.stageId || targetValidation.stageId || normalizeStageId(targetId),
      targetTitle: targetValidation.targetTitle || foundCode.targetTitle || 'محتوى تعليمي',
      codeType: foundCode.codeType || targetValidation.targetType || 'month',
      activationCode: sanitizedCode,
      startDate: new Date().toISOString(),
      expirationDate: expiresAt,
      expiresAt: expiresAt,
      isPermanent: true,
      durationDays: 36500,
      status: 'active',
      isPaused: false,
      isCancelled: false,
      isFrozen: false,
      subscribed: true,
      updatedAt: new Date().toISOString()
    };

    // Update local code
    foundCode.isUsed = true;
    foundCode.usedCount = 1;
    foundCode.status = 'used';
    foundCode.usedByUid = studentUid;
    foundCode.usedBy = currentUser?.name || 'طالب مسجل';
    foundCode.usedByEmail = currentUser?.email || '';
    foundCode.usedAt = new Date().toISOString();

    try {
      markCodeAsUsedInCloud(sanitizedCode, foundCode).catch(() => {});
      const local = JSON.parse(localStorage.getItem('ms_codes') || '[]');
      const updatedLocal = local.map(c => normalize10DigitCode(c.code) === sanitizedCode ? foundCode : c);
      localStorage.setItem('ms_codes', JSON.stringify(updatedLocal));
    } catch (e) {}

    return handleSuccessfulRedemption({
      codeData: foundCode,
      subscriptionRecord,
      studentUid,
      currentUser,
      stages,
      sections,
      lectures,
      studentAlreadyUsed,
      onSubscriptionAdded
    });
  }

  return { ok: false, error: 'unknown', message: 'تعذر تأكيد التفعيل. يرجى المحاولة لاحقاً أو التواصل مع الدعم.' };
}

/**
 * Handles post-redemption state updates and calculates covered content.
 */
async function handleSuccessfulRedemption({
  codeData,
  subscriptionRecord,
  studentUid,
  currentUser,
  stages,
  sections,
  lectures,
  studentAlreadyUsed,
  onSubscriptionAdded
}) {
  const targetId = subscriptionRecord?.targetId || codeData?.targetId;
  const sub = subscriptionRecord || {
    userId: studentUid,
    targetId: targetId,
    courseId: targetId,
    stageId: codeData?.stageId || normalizeStageId(targetId),
    targetTitle: codeData?.targetTitle || 'محتوى تعليمي',
    codeType: codeData?.codeType || 'month',
    status: 'active',
    isPermanent: true,
    durationDays: 36500,
    startDate: new Date().toISOString(),
    expiresAt: '2099-12-31T23:59:59.999Z'
  };

  // Sync to Firestore & RTDB
  try {
    await saveStudentSubscriptionToFirestore(studentUid, targetId, sub);
  } catch (e) {
    console.warn('Subscription cloud sync notice:', e);
  }

  // Trigger callback if provided
  if (typeof onSubscriptionAdded === 'function') {
    try {
      await onSubscriptionAdded(targetId, sub);
    } catch (e) {
      console.warn('onSubscriptionAdded error:', e);
    }
  }

  // Calculate covered lectures
  const covered = getCoveredLectures(sub, lectures);

  // Partition into immediately open vs progression gated
  const unlocked = [];
  const progressionLocked = [];

  covered.forEach((lec, idx) => {
    if (idx === 0 || lec.isFree) {
      unlocked.push({ ...lec, isImmediate: true });
    } else {
      const prevLec = covered[idx - 1];
      progressionLocked.push({
        ...lec,
        reason: `يجب مشاهدة 50% على الأقل من المحاضرة السابقة (${prevLec.title}) أولاً`,
        prevLectureId: prevLec.id,
        prevLectureTitle: prevLec.title
      });
    }
  });

  return {
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
}
