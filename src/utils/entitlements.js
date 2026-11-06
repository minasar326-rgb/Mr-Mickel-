import { normalizeStageId, CANONICAL_STAGES } from './stages.js';

/**
 * Unified Coverage & Entitlement Engine for Mr. Michael LMS
 * Dictates whether a given subscription or entitlement grants access to a specific lecture.
 *
 * Rules:
 * 1. All-Access: codeType === 'all-access' or targetId === 'all-access' covers EVERY lecture.
 * 2. Direct Lecture: subscription.targetId === lecture.id covers this specific lecture.
 * 3. Section/Month: lecture.sectionId === subscription.targetId covers all lectures in that month/course.
 * 4. Stage-Level: normalizeStageId(lecture.stageId) === normalizeStageId(subscription.targetId || subscription.stageId)
 *    covers all lectures within the academic stage (including orphaned lectures without sectionId).
 * 5. Bundle Items: If subscription.includedItemIds contains lecture.id or lecture.sectionId.
 */
export function coversLecture(subscription, lecture, allLectures = []) {
  if (!subscription || !lecture) return false;

  // Subscription must be active and not expired
  if (subscription.status === 'paused' || subscription.isPaused) return false;
  if (subscription.status === 'cancelled' || subscription.isCancelled) return false;
  if (subscription.status === 'frozen' || subscription.isFrozen) return false;

  const expiry = subscription.expirationDate || subscription.expiresAt;
  if (expiry) {
    const expiryTime = new Date(expiry).getTime();
    if (!isNaN(expiryTime) && expiryTime < Date.now()) {
      return false; // Expired
    }
  }

  const targetId = (subscription.targetId || subscription.courseId || '').trim();
  const subType = subscription.codeType || subscription.type || '';
  const subStage = normalizeStageId(subscription.stageId || targetId);
  const lectureStage = normalizeStageId(lecture.stageId);

  // 1. All-Access Check (STRICT: only if explicitly all-access, never by accidental text match)
  if (subType === 'all-access' || targetId === CANONICAL_STAGES.ALL_ACCESS || subStage === CANONICAL_STAGES.ALL_ACCESS) {
    return true;
  }

  // 2. Direct Lecture ID match
  if (targetId && targetId === lecture.id) {
    return true;
  }

  // 3. Section / Month ID match
  if (targetId && lecture.sectionId && targetId === lecture.sectionId) {
    return true;
  }

  // 4. Bundle / Included item IDs check
  if (Array.isArray(subscription.includedItemIds)) {
    if (subscription.includedItemIds.includes(lecture.id)) return true;
    if (lecture.sectionId && subscription.includedItemIds.includes(lecture.sectionId)) return true;
    if (subscription.includedItemIds.includes(lectureStage)) return true;
  }

  // 5. Stage-Level match (STRICT: only within the exact same stage)
  const isStageSub = subType === 'stage' || 
    targetId.startsWith('sec-') || 
    targetId.startsWith('prep-') || 
    targetId.startsWith('pri-') || 
    targetId === 'foundation' ||
    targetId === subStage;

  if (isStageSub && subStage && lectureStage) {
    if (subStage === lectureStage) {
      return true;
    }
    // Cross-stage bleed strictly blocked
    return false;
  }

  return false;
}

/**
 * Returns all lectures in the curriculum covered by this subscription.
 */
export function getCoveredLectures(subscription, allLectures = []) {
  if (!subscription || !Array.isArray(allLectures)) return [];
  return allLectures.filter(lec => !lec.isDeleted && coversLecture(subscription, lec, allLectures));
}

/**
 * Evaluates whether a code's targetId exists and is valid in the platform.
 * Returns { isValid, targetType, targetTitle, coveredCount }
 */
export function validateCodeTarget(targetOrCode, { stages = [], sections = [], lectures = [] } = {}) {
  const targetId = typeof targetOrCode === 'object' && targetOrCode !== null
    ? (targetOrCode.targetId || targetOrCode.target || '')
    : targetOrCode;

  if (!targetId || typeof targetId !== 'string' || !targetId.trim()) {
    return { valid: false, isValid: false, reason: 'missing_target' };
  }

  const clean = targetId.trim();
  if (clean === CANONICAL_STAGES.ALL_ACCESS) {
    return {
      valid: true,
      isValid: true,
      targetType: 'all-access',
      targetTitle: 'جميع المراحل (VIP All-Access)',
      coveredCount: lectures.filter(l => !l.isDeleted).length
    };
  }

  // 1. Check Section/Month
  const foundSection = sections.find(s => s.id === clean);
  if (foundSection) {
    const count = lectures.filter(l => !l.isDeleted && l.sectionId === clean).length;
    return {
      valid: true,
      isValid: true,
      targetType: 'month',
      targetTitle: foundSection.title || foundSection.name || `شهر: ${clean}`,
      section: foundSection,
      coveredCount: count
    };
  }

  // 2. Check Stage
  const canon = normalizeStageId(clean);
  const foundStage = stages.find(s => s.id === clean || s.id === canon);
  if (foundStage || clean.startsWith('sec-') || clean === 'pri' || clean === 'prep' || clean === 'foundation') {
    const stageId = foundStage ? foundStage.id : canon;
    const count = lectures.filter(l => !l.isDeleted && normalizeStageId(l.stageId) === canon).length;
    return {
      valid: true,
      isValid: true,
      targetType: 'stage',
      targetTitle: foundStage?.title || foundStage?.name || `مرحلة: ${stageId}`,
      stageId,
      coveredCount: count
    };
  }

  // 3. Check Lecture
  const foundLecture = lectures.find(l => l.id === clean);
  if (foundLecture) {
    return {
      valid: true,
      isValid: true,
      targetType: 'lecture',
      targetTitle: foundLecture.title || `محاضرة: ${clean}`,
      lecture: foundLecture,
      coveredCount: 1
    };
  }

  return { valid: false, isValid: false, reason: 'target_not_found' };
}
