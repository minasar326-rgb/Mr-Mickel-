/**
 * Universal Auto-Grading & Answer Evaluation Engine
 * Handles MCQ, True/False, Multi-select, Short Answer (Grammar / Vocab / Fill-in-Blank), and Essay.
 */

/**
 * Normalizes text for tolerant, robust comparison:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips leading/trailing quotes and brackets
 * - Normalizes Arabic characters & removes diacritics
 * - Strips trailing punctuation (. , ? ! : ;)
 * - Collapses multiple spaces
 */
export function normalizeAnswerText(str) {
  if (str === null || str === undefined) return '';
  let s = String(str).trim().toLowerCase();

  // Strip leading & trailing quotes, backticks, brackets, parentheses
  s = s.replace(/^["'`(\[{<]+|["'`)}\]>]+$/g, '');

  // Strip Arabic diacritics (harakat / tashkeel)
  s = s.replace(/[\u064B-\u065F\u0670]/g, '');

  // Normalize Arabic letters
  s = s.replace(/[أإآء]/g, 'ا')
       .replace(/ة/g, 'ه')
       .replace(/ى/g, 'ي')
       .replace(/ؤ/g, 'و')
       .replace(/ئ/g, 'ي');

  // Strip trailing punctuation
  s = s.replace(/[.,?!:;]+$/g, '');

  // Collapse multiple whitespaces
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Extracts all candidate valid answer strings for text/short-answer questions.
 * Supports delimiters: '/', ',', '|', 'or'.
 */
export function getCandidateAnswers(q) {
  if (!q) return [];
  const rawList = [];

  // Check correctAnswer
  if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
    if (typeof q.correctAnswer === 'string' && q.correctAnswer.trim()) {
      rawList.push(q.correctAnswer.trim());
    } else if (typeof q.correctAnswer === 'number' && q.type !== 'short_answer') {
      // Numbers are valid indices for MCQ, but for short_answer 0 was a builder default
      rawList.push(String(q.correctAnswer));
    }
  }

  // Check modelAnswer
  if (q.modelAnswer && typeof q.modelAnswer === 'string' && q.modelAnswer.trim()) {
    rawList.push(q.modelAnswer.trim());
  }

  // Check answer
  if (q.answer && typeof q.answer === 'string' && q.answer.trim()) {
    rawList.push(q.answer.trim());
  }

  // If question has explanation and it's a short 1-3 word phrase, also consider it
  if (rawList.length === 0 && q.explanation && typeof q.explanation === 'string') {
    const expClean = q.explanation.trim();
    if (expClean.length > 0 && expClean.length <= 40 && !expClean.includes('\n')) {
      rawList.push(expClean);
    }
  }

  // Expand variants separated by /, |, comma, or "or"
  const candidates = [];
  rawList.forEach(item => {
    // Split by slash, pipe, comma, or word 'or'
    const parts = item.split(/\s*(?:\/|\||,|\bor\b)\s*/i);
    parts.forEach(p => {
      const clean = p.trim();
      if (clean && !candidates.includes(clean)) {
        candidates.push(clean);
      }
    });
  });

  return candidates;
}

/**
 * Normalizes True/False value into a boolean:
 * Returns true for True, false for False, or null if unparseable.
 */
export function parseBooleanTF(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val;

  const s = String(val).trim().toLowerCase();
  if (s === '0' || s === 'true' || s === 't' || s === 'yes' || s.includes('صحيح') || s.includes('صح')) {
    return true;
  }
  if (s === '1' || s === 'false' || s === 'f' || s === 'no' || s.includes('خطأ') || s.includes('خطا')) {
    return false;
  }
  return null;
}

/**
 * Checks if student's answer is correct for any question type.
 */
export function isQuestionAnswerCorrect(q, userAns) {
  if (!q) return false;
  if (userAns === undefined || userAns === null || userAns === '') return false;

  const qType = q.type || 'mcq';

  // 1. True / False
  if (qType === 'tf') {
    const userBool = parseBooleanTF(userAns);
    // Determine target boolean from q.correctAnswer or q.options
    let targetBool = parseBooleanTF(q.correctAnswer);
    if (targetBool === null && q.modelAnswer) {
      targetBool = parseBooleanTF(q.modelAnswer);
    }
    if (userBool !== null && targetBool !== null) {
      return userBool === targetBool;
    }
    // Fallback: direct index or option equality
    if (Number(userAns) === Number(q.correctAnswer)) return true;
    if (q.options && q.options[userAns] && q.correctAnswer !== undefined) {
      return normalizeAnswerText(q.options[userAns]) === normalizeAnswerText(q.correctAnswer);
    }
    return false;
  }

  // 2. Multi-Select Checkboxes
  if (qType === 'multi') {
    const rawTarget = q.correctAnswers !== undefined ? q.correctAnswers : q.correctAnswer;
    const targetArr = Array.isArray(rawTarget) ? rawTarget : (rawTarget !== undefined && rawTarget !== null ? [rawTarget] : []);
    const userArr = Array.isArray(userAns) ? userAns : [userAns];

    if (targetArr.length === 0 || userArr.length === 0) return false;

    // Normalize both sets to numbers or strings
    const normTarget = targetArr.map(x => String(x).trim().toLowerCase()).sort();
    const normUser = userArr.map(x => String(x).trim().toLowerCase()).sort();

    if (normTarget.length !== normUser.length) return false;
    return normTarget.every((val, idx) => val === normUser[idx]);
  }

  // 3. Short Answer / Fill in the Blanks
  if (qType === 'short_answer') {
    const normUser = normalizeAnswerText(userAns);
    if (!normUser) return false;

    const candidates = getCandidateAnswers(q);
    if (candidates.length === 0) {
      // If no candidate was defined at all, check if user wrote something non-empty
      return false;
    }

    // Direct match against any candidate
    for (const cand of candidates) {
      const normCand = normalizeAnswerText(cand);
      if (normUser === normCand) return true;

      // Allow matching if user typed "is <word>" and candidate is "<word>" or vice versa
      if (normUser.endsWith(` ${normCand}`) || normCand.endsWith(` ${normUser}`)) {
        return true;
      }
    }

    return false;
  }

  // 4. Essay Question (only manual unless user wrote matching model text)
  if (qType === 'essay') {
    if (typeof userAns !== 'string' || !userAns.trim()) return false;
    const normUser = normalizeAnswerText(userAns);
    const candidates = getCandidateAnswers(q);
    for (const cand of candidates) {
      if (normUser === normalizeAnswerText(cand)) return true;
    }
    return false;
  }

  // 5. MCQ Single Choice & Translation (default)
  // Match by index:
  if (Number(userAns) === Number(q.correctAnswer)) {
    return true;
  }

  // Match by option text if correctAnswer was stored as option string:
  if (q.options && Array.isArray(q.options)) {
    const selectedOptionText = q.options[userAns];
    if (selectedOptionText !== undefined) {
      // If correctAnswer is string matching option text
      if (normalizeAnswerText(selectedOptionText) === normalizeAnswerText(q.correctAnswer)) {
        return true;
      }
      // If correctAnswer is an option index and matches
      if (q.options[q.correctAnswer] !== undefined && normalizeAnswerText(selectedOptionText) === normalizeAnswerText(q.options[q.correctAnswer])) {
        return true;
      }
    }
  }

  // Direct string equality fallback
  if (normalizeAnswerText(userAns) === normalizeAnswerText(q.correctAnswer)) {
    return true;
  }

  return false;
}

/**
 * Returns formatted correct answer string for display in the review UI.
 */
export function getCorrectAnswerDisplay(q) {
  if (!q) return '';
  const qType = q.type || 'mcq';

  if (qType === 'tf') {
    const bool = parseBooleanTF(q.correctAnswer !== undefined ? q.correctAnswer : q.modelAnswer);
    return bool === true ? 'صحيح (True) ✓' : 'خطأ (False) ✗';
  }

  if (qType === 'multi') {
    const rawTarget = q.correctAnswers !== undefined ? q.correctAnswers : q.correctAnswer;
    const targetArr = Array.isArray(rawTarget) ? rawTarget : [rawTarget];
    if (q.options && Array.isArray(q.options)) {
      return targetArr.map(idx => q.options[idx] || idx).join(' • ');
    }
    return targetArr.join(' • ');
  }

  if (qType === 'short_answer') {
    const candidates = getCandidateAnswers(q);
    if (candidates.length > 0) {
      return candidates.join(' / ');
    }
    return q.correctAnswer || q.modelAnswer || 'إجابة محددة';
  }

  if (qType === 'essay') {
    return q.modelAnswer || 'نموذج إجابة وتصحيح يدوي من المستر';
  }

  // MCQ / Translation
  if (q.options && Array.isArray(q.options)) {
    if (q.options[q.correctAnswer] !== undefined) {
      return q.options[q.correctAnswer];
    }
    if (typeof q.correctAnswer === 'string' && q.correctAnswer.trim()) {
      return q.correctAnswer;
    }
  }

  return String(q.correctAnswer ?? q.modelAnswer ?? '');
}

/**
 * Returns formatted student answer string for display in the review UI.
 */
export function getStudentAnswerDisplay(q, userAns) {
  if (userAns === undefined || userAns === null || userAns === '') {
    return '(لم تجب على هذا السؤال)';
  }

  const qType = q?.type || 'mcq';

  if (qType === 'tf') {
    const bool = parseBooleanTF(userAns);
    return bool === true ? 'صحيح (True) ✓' : 'خطأ (False) ✗';
  }

  if (qType === 'multi') {
    const userArr = Array.isArray(userAns) ? userAns : [userAns];
    if (q?.options && Array.isArray(q.options)) {
      return userArr.map(idx => q.options[idx] || idx).join(' • ');
    }
    return userArr.join(' • ');
  }

  if (qType === 'short_answer' || qType === 'essay') {
    return String(userAns);
  }

  // MCQ / Translation
  if (q?.options && Array.isArray(q.options) && q.options[userAns] !== undefined) {
    return q.options[userAns];
  }

  return String(userAns);
}

/**
 * Evaluates the entire exam and returns comprehensive results.
 */
export function gradeExamSubmission(questions = [], selectedAnswers = {}, examPassingMarks = null, examTotalMarks = null) {
  let autoScore = 0;
  let hasManual = false;
  let totalCalculatedMarks = 0;

  const questionBreakdown = [];

  questions.forEach((q, idx) => {
    const qType = q.type || 'mcq';
    const userAns = selectedAnswers[q.id];
    const qPoints = Number(q.points) || 1;
    totalCalculatedMarks += qPoints;

    const isEssay = qType === 'essay';
    const isCorrect = isQuestionAnswerCorrect(q, userAns);

    if (isEssay) {
      // True essay questions require teacher manual grading unless an exact match occurred
      if (!isCorrect) {
        hasManual = true;
      } else {
        autoScore += qPoints;
      }
    } else {
      if (isCorrect) {
        autoScore += qPoints;
      }
    }

    questionBreakdown.push({
      index: idx,
      id: q.id,
      type: qType,
      question: q.question || q.questionText || '',
      isEssay,
      isCorrect,
      userAns,
      userAnsDisplay: getStudentAnswerDisplay(q, userAns),
      correctAnswerDisplay: getCorrectAnswerDisplay(q),
      points: qPoints,
      pointsEarned: isCorrect ? qPoints : 0,
      explanation: q.explanation || ''
    });
  });

  const finalTotalMarks = Number(examTotalMarks) || totalCalculatedMarks || 20;
  const finalPassingMarks = Number(examPassingMarks) || Math.ceil(finalTotalMarks * 0.5);
  const passed = !hasManual && autoScore >= finalPassingMarks;

  return {
    autoScore,
    totalMarks: finalTotalMarks,
    passingMarks: finalPassingMarks,
    hasManualQuestions: hasManual,
    passed,
    status: hasManual ? 'pending_grading' : 'graded',
    questionBreakdown,
    submittedAt: new Date().toISOString()
  };
}
