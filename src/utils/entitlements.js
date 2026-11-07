import { normalizeStageId, CANONICAL_STAGES } from './stages.js';

/**
 * Unified Coverage & Entitlement Engine for Al-Mister Platform
 * Dictates whether a given subscription or entitlement grants access to a specific lecture.
 *
 * 3 Core Subscription Types:
 * 1. Stage-Level (كود المرحلة بالكامل):
 *    Unlocks all current and future months and lectures within the academic stage permanently.
 * 2. Month-Level (كود شهر محدد):
 *    Unlocks all lectures belonging to that specific month/section (lecture.sectionId === subscription.targetId) permanently.
 *    Any new lectures added to this month in the future are covered automatically. Other months remain locked.
 * 3. Lecture-Level (كود محاضرة واحدة):
 *    Unlocks ONLY that specific lecture (lecture.id === subscription.targetId).
 */
export function coversLecture(subscription, lecture, allLectures = []) {
  if (!subscription || !lecture) return false;

  // Subscription must be active and not blocked
  if (subscription.status === 'paused' || subscription.isPaused) return false;
  if (subscription.status === 'cancelled' || subscription.isCancelled) return false;
  if (subscription.status === 'frozen' || subscription.isFrozen) return false;

  // Check Expiration: Month, Stage, and Lecture subscriptions are PERMANENT for the student's account
  const isPermanent = subscription.isPermanent !== false;
  if (!isPermanent) {
    const expiry = subscription.expirationDate || subscription.expiresAt;
    if (expiry && expiry !== 'never') {
      const expiryTime = new Date(expiry).getTime();
      if (!isNaN(expiryTime) && expiryTime < Date.now()) {
        return false; // Expired
      }
    }
  }

  const targetId = (subscription.targetId || subscription.courseId || '').trim();
  const subType = (subscription.codeType || subscription.type || '').trim().toLowerCase();
  const subStage = normalizeStageId(subscription.stageId || targetId, subscription.stageName || subscription.targetTitle || '');
  const lectureStage = normalizeStageId(lecture.stageId, lecture.stageName || lecture.stage || '');

  // 1. All-Access Check (STRICT: only if explicitly all-access VIP)
  if (subType === 'all-access' || targetId === CANONICAL_STAGES.ALL_ACCESS || subStage === CANONICAL_STAGES.ALL_ACCESS) {
    return true;
  }

  // 2. Single Lecture Subscription (STRICT ISOLATION: Unlocks ONLY this single lecture)
  if (subType === 'lecture') {
    return Boolean(targetId && targetId === lecture.id);
  }
  if (targetId && targetId === lecture.id && subType !== 'month' && subType !== 'course' && subType !== 'stage') {
    return true;
  }

  // 3. Month / Section Subscription (Unlocks all lectures in this specific month, including future lectures added to this month)
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
  }

  // 4. Bundle / Included item IDs check
  if (Array.isArray(subscription.includedItemIds)) {
    if (subscription.includedItemIds.includes(lecture.id)) return true;
    if (lecture.sectionId && subscription.includedItemIds.includes(lecture.sectionId)) return true;
    if (subscription.includedItemIds.includes(lectureStage)) return true;
    if (subscription.includedItemIds.includes(lecture.stageId)) return true;
  }

  // 5. Stage-Level Subscription (Unlocks all current and future months and lectures in this stage)
  const isExplicitStageSub = subType === 'stage' ||
    targetId === CANONICAL_STAGES.SEC_3 ||
    targetId === CANONICAL_STAGES.SEC_2 ||
    targetId === CANONICAL_STAGES.SEC_1 ||
    targetId === CANONICAL_STAGES.PREP ||
    targetId === CANONICAL_STAGES.PRI ||
    targetId === CANONICAL_STAGES.FOUNDATION ||
    (targetId && targetId === subStage && targetId !== lecture.sectionId && targetId !== lecture.id);

  if (isExplicitStageSub) {
    if (subStage && lectureStage && subStage === lectureStage) {
      return true;
    }
    if (lecture.stageId && (lecture.stageId === subscription.stageId || lecture.stageId === targetId)) {
      return true;
    }
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
      stageId: foundSection.stageId,
      coveredCount: count
    };
  }

  // 2. Check Stage
  const canon = normalizeStageId(clean);
  const foundStage = stages.find(s => s.id === clean || s.id === canon);
  if (foundStage || clean.startsWith('sec-') || clean.startsWith('stage-') || clean === 'pri' || clean === 'prep' || clean === 'foundation') {
    const stageId = foundStage ? foundStage.id : (clean.startsWith('stage-') ? clean : canon);
    const count = lectures.filter(l => !l.isDeleted && (l.stageId === stageId || normalizeStageId(l.stageId) === canon)).length;
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
      stageId: foundLecture.stageId,
      sectionId: foundLecture.sectionId,
      coveredCount: 1
    };
  }

  return { valid: false, isValid: false, reason: 'target_not_found' };
}
