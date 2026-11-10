const path = require('path');

async function runTests() {
  const m = await import('../src/utils/examGrading.js');
  console.log('Testing examGrading.js...');

  let failed = 0;
  function assert(name, condition) {
    if (condition) {
      console.log(`  ✓ ${name}`);
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. MCQ Test
  const mcqQ = { id: 'q1', type: 'mcq', options: ['A', 'B', 'C'], correctAnswer: 1, points: 5 };
  assert('MCQ index match', m.isQuestionAnswerCorrect(mcqQ, 1) === true);
  assert('MCQ string index match', m.isQuestionAnswerCorrect(mcqQ, '1') === true);
  assert('MCQ wrong answer', m.isQuestionAnswerCorrect(mcqQ, 0) === false);

  // 1b. MCQ with option text stored in correctAnswer
  const mcqTextQ = { id: 'q1b', type: 'mcq', options: ['Cairo', 'Alex', 'Giza'], correctAnswer: 'Alex', points: 5 };
  assert('MCQ option text match', m.isQuestionAnswerCorrect(mcqTextQ, 1) === true);

  // 2. TF Test
  const tfQ = { id: 'q2', type: 'tf', options: ['صحيح (True)', 'خطأ (False)'], correctAnswer: 'صحيح (True)', points: 5 };
  assert('TF option 0 for True', m.isQuestionAnswerCorrect(tfQ, 0) === true);
  assert('TF option 1 for False (wrong)', m.isQuestionAnswerCorrect(tfQ, 1) === false);

  const tfQ2 = { id: 'q2b', type: 'tf', options: ['صح', 'خطأ'], correctAnswer: 1, points: 5 };
  assert('TF index 1 match with False button', m.isQuestionAnswerCorrect(tfQ2, 1) === true);

  // 3. Multi-Select Test
  const multiQ = { id: 'q3', type: 'multi', options: ['Who', 'Whom', 'Which', 'Whose'], correctAnswers: [0, 1, 3], points: 5 };
  assert('Multi exact match [0, 1, 3]', m.isQuestionAnswerCorrect(multiQ, [0, 1, 3]) === true);
  assert('Multi unordered match [3, 0, 1]', m.isQuestionAnswerCorrect(multiQ, [3, 0, 1]) === true);
  assert('Multi partial (wrong)', m.isQuestionAnswerCorrect(multiQ, [0, 1]) === false);

  // 4. Short Answer Test (Real Platform Questions!)
  const shortQ1 = { id: 's1', type: 'short_answer', question: 'Ali is (tall) than Omar', correctAnswer: 0, modelAnswer: 'taller', points: 5 };
  assert('Short answer "taller"', m.isQuestionAnswerCorrect(shortQ1, 'taller') === true);
  assert('Short answer with spaces and uppercase "  Taller  "', m.isQuestionAnswerCorrect(shortQ1, '  Taller  ') === true);
  assert('Short answer with dot "taller."', m.isQuestionAnswerCorrect(shortQ1, 'taller.') === true);
  assert('Short answer wrong "tallest"', m.isQuestionAnswerCorrect(shortQ1, 'tallest') === false);

  // 4b. Short answer with multiple alternatives (e.g. was / were)
  const shortQ2 = { id: 's2', type: 'short_answer', question: 'She (be) happy', correctAnswer: 'was / were', points: 5 };
  assert('Short answer alternative 1 "was"', m.isQuestionAnswerCorrect(shortQ2, 'was') === true);
  assert('Short answer alternative 2 "were"', m.isQuestionAnswerCorrect(shortQ2, 'were') === true);

  // 5. Full Exam Grading Test for Grade 5 / Grade 6 4-question exam
  const examQuestions = [
    { id: '1', type: 'short_answer', question: 'Ali is (tall) than Omar', modelAnswer: 'taller', points: 5 },
    { id: '2', type: 'short_answer', question: 'A car is (fast) than a bike', modelAnswer: 'faster', points: 5 },
    { id: '3', type: 'short_answer', question: 'My bag is (big) than yours', modelAnswer: 'bigger', points: 5 },
    { id: '4', type: 'short_answer', question: 'A lion is (strong) than a cat', modelAnswer: 'stronger', points: 5 }
  ];
  const userAnswers = {
    '1': 'taller',
    '2': 'faster',
    '3': 'bigger',
    '4': 'stronger'
  };
  const result = m.gradeExamSubmission(examQuestions, userAnswers, 10, 20);
  assert('Full exam score 20 / 20', result.autoScore === 20 && result.totalMarks === 20);
  assert('Full exam passed', result.passed === true);
  assert('Full exam no manual questions', result.hasManualQuestions === false);

  // 6. Test Display Formatters
  assert('getCorrectAnswerDisplay for short_answer', m.getCorrectAnswerDisplay(shortQ1) === 'taller');
  assert('getStudentAnswerDisplay for short_answer', m.getStudentAnswerDisplay(shortQ1, 'taller') === 'taller');
  assert('getCorrectAnswerDisplay for tf', m.getCorrectAnswerDisplay(tfQ) === 'صحيح (True) ✓');

  if (failed === 0) {
    console.log('\n✅ ALL 16 EXAM GRADING UNIT TESTS PASSED WITH 100% ACCURACY!');
  } else {
    console.error(`\n❌ ${failed} TESTS FAILED!`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
