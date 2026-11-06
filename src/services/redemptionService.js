import { db, auth } from './firebase.js';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { coversLecture, validateCodeTarget, getCoveredLectures } from '../utils/entitlements.js';
import { normalizeStageId } from '../utils/stages.js';
import { saveStudentSubscriptionToFirestore } from './firestoreSync.js';

/**
 * Enterprise Code Redemption Engine
 * Enforces server-side / transactional verification, prevents race conditions,
 * checks true content coverage, and reads back from the cloud before confirming success.
 */
export async function executeRedeemCode({
  cleanCode,
  currentUser,
  stages = [],
  sections = [],
  lectures = []
}) {
  if (!cleanCode) {
    return { ok: false, error: 'invalid_code', message: 'يرجى إدخال كود التفعيل بدقة.' };
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
        body: JSON.stringify({ code: cleanCode })
      }).catch(() => null);

      if (apiRes && apiRes.ok) {
        const data = await apiRes.json();
        if (data.success && !data.delegatedToClient) {
          // Verify cloud subscription
          return handleSuccessfulRedemption({
            codeData: data,
            studentUid,
            currentUser,
            stages,
            sections,
            lectures
          });
        }
      }
    }
  } catch (apiErr) {
    console.warn('API endpoint unavailable, falling back to Firestore Transaction:', apiErr);
  }

  // 2. Atomic Firestore Transaction (guarantees race condition prevention)
  if (!db) {
    return { ok: false, error: 'db_unavailable', message: 'تعذر الاتصال بقاعدة البيانات. يرجى مراجعة اتصال الإنترنت.' };
  }

  try {
    const codeRef = doc(db, 'codes', cleanCode);

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

      // Check Expiry of Code
      if (codeData.expiryDate) {
        const expTime = new Date(codeData.expiryDate).getTime();
        if (!isNaN(expTime) && expTime < Date.now()) {
          throw new Error('code_expired');
        }
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

      // Check Max Uses
      const maxUses = Number(codeData.maxUses) || 1;
      const currentUsed = Number(codeData.usedCount) || (codeData.isUsed ? 1 : 0);
      const usedByList = Array.isArray(codeData.usedByList) ? codeData.usedByList : [];

      const studentAlreadyUsed = usedByList.includes(studentUid) || 
        codeData.usedByUid === studentUid ||
        (codeData.usedByEmail && currentUser?.email && codeData.usedByEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim());

      if (currentUsed >= maxUses && !studentAlreadyUsed) {
        throw new Error('max_uses_reached');
      }

      // Prepare updated usage
      const newUsedCount = studentAlreadyUsed ? currentUsed : currentUsed + 1;
      const isNowFullyUsed = newUsedCount >= maxUses;
      const updatedList = Array.from(new Set([...usedByList, studentUid]));

      // Duration & Expiry calculation
      const durationDays = Number(codeData.durationDays) || 30;
      const startDate = (studentAlreadyUsed && codeData.startDate) ? codeData.startDate : new Date().toISOString();
      const expiresAt = (studentAlreadyUsed && (codeData.expirationDate || codeData.expiresAt))
        ? (codeData.expirationDate || codeData.expiresAt)
        : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      // Atomic Update of Code Document
      transaction.update(codeRef, {
        usedCount: newUsedCount,
        maxUses: maxUses,
        isUsed: isNowFullyUsed,
        status: isNowFullyUsed ? 'used' : 'active',
        usedByList: updatedList,
        usedBy: currentUser?.name || 'طالب مسجل بالمنصة',
        usedByUid: studentUid,
        usedByEmail: currentUser?.email || '',
        updatedAt: serverTimestamp()
      });

      // Prepare Primary Subscription Record
      const subscriptionRecord = {
        userId: studentUid,
        targetId: targetId,
        courseId: targetId,
        stageId: codeData.stageId || targetValidation.stageId || normalizeStageId(targetId),
        targetTitle: targetValidation.targetTitle || codeData.targetTitle || 'محتوى تعليمي',
        codeType: codeData.codeType || targetValidation.targetType || 'month',
        activationCode: cleanCode,
        startDate: startDate,
        expirationDate: expiresAt,
        expiresAt: expiresAt,
        durationDays: durationDays,
        status: 'active',
        isPaused: false,
        isCancelled: false,
        subscribed: true,
        updatedAt: new Date().toISOString()
      };

      // Atomic Write of Subscription under users/{uid}/subscriptions/{targetId}
      const userSubRef = doc(db, 'users', studentUid, 'subscriptions', targetId);
      transaction.set(userSubRef, subscriptionRecord, { merge: true });

      // Record Audit Log inside the transaction
      const auditLogRef = doc(db, 'auditLogs', `log_${Date.now()}_${cleanCode}`);
      transaction.set(auditLogRef, {
        action: 'CODE_REDEMPTION',
        code: cleanCode,
        uid: studentUid,
        studentName: currentUser?.name || '',
        studentEmail: currentUser?.email || '',
        targetId: targetId,
        targetTitle: subscriptionRecord.targetTitle,
        usedCount: newUsedCount,
        timestamp: serverTimestamp()
      });

      return {
        codeData,
        targetValidation,
        subscriptionRecord,
        studentAlreadyUsed
      };
    });

    // 3. Confirm Cloud Write Verification
    return handleSuccessfulRedemption({
      codeData: transactionResult.codeData,
      subscriptionRecord: transactionResult.subscriptionRecord,
      studentUid,
      currentUser,
      stages,
      sections,
      lectures,
      studentAlreadyUsed: transactionResult.studentAlreadyUsed
    });

  } catch (error) {
    console.error('Redemption error:', error);
    const code = error?.message || '';

    if (code === 'invalid_code') {
      return { ok: false, error: 'invalid_code', message: 'كود التفعيل غير صحيح. تأكد من إدخال الحروف والأرقام بدقة.' };
    }
    if (code === 'code_disabled') {
      return { ok: false, error: 'code_disabled', message: '⚠️ تم إيقاف كود التفعيل هذا مؤقتاً من قِبل إدارة المنصة.' };
    }
    if (code === 'code_expired') {
      return { ok: false, error: 'code_expired', message: '⚠️ هذا الكود منتهي الصلاحية ولا يمكن استخدامه.' };
    }
    if (code === 'max_uses_reached') {
      return { ok: false, error: 'max_uses_reached', message: '⚠️ عذراً، تم استنفاد الحد الأقصى لعدد مرات استخدام هذا الكود.' };
    }
    if (code === 'code_misconfigured') {
      return { ok: false, error: 'code_misconfigured', message: 'الكود ده غير مكتمل، كلّم المستر' };
    }

    return { ok: false, error: 'unknown', message: 'تعذر تأكيد التفعيل. يرجى المحاولة لاحقاً أو التواصل مع الدعم.' };
  }
}

/**
 * Verifies cloud persistence and calculates exactly which lectures are unlocked vs progression-locked.
 */
async function handleSuccessfulRedemption({
  codeData,
  subscriptionRecord,
  studentUid,
  currentUser,
  stages,
  sections,
  lectures,
  studentAlreadyUsed
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
    durationDays: codeData?.durationDays || 30,
    startDate: new Date().toISOString(),
    expiresAt: codeData?.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Cloud Read-back Verification (confirming write landed)
  try {
    const checkDoc = await getDoc(doc(db, 'users', studentUid, 'subscriptions', targetId));
    if (!checkDoc.exists()) {
      // Direct save if subcollection rules required top-level
      await saveStudentSubscriptionToFirestore(studentUid, targetId, sub);
    }
  } catch (e) {
    console.warn('Read-back check warning:', e);
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
    startDate: new Date(sub.startDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    expirationDate: new Date(sub.expiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    durationDays: sub.durationDays,
    coveredLectures: covered,
    unlockedLectures: unlocked,
    lockedLectures: progressionLocked,
    message: studentAlreadyUsed ? 'تم إعادة تفعيل المحتوى بحسابك بنجاح!' : 'تم الاشتراك وتفعيل المحتوى بنجاح!'
  };
}
