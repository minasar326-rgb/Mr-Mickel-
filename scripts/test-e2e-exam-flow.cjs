const fs = require('fs');

async function main() {
  const { gradeExamSubmission, isQuestionAnswerCorrect, getCorrectAnswerDisplay, getStudentAnswerDisplay } = await import('../src/utils/examGrading.js');
  const manifest = JSON.parse(fs.readFileSync('public/lectures-manifest.json', 'utf8'));

  console.log('=== Running End-to-End Real Exam Auto-Grading Tests ===\n');

  let passedAll = true;

  // TEST 1: Grade 5 - شرح قاعده المقارنه الجزء الاول
  const lec1 = manifest.lectures.find(l => l.id === 'lec-1794001152669');
  console.log(`Test 1: Lecture ${lec1.id} (${lec1.title})`);
  console.log(`Questions count: ${lec1.exam.questions.length}, totalMarks: ${lec1.exam.totalMarks}`);

  const studentAnswers1 = {
    'q-1794000714476-0zvp': 'taller',
    'q-1794000915094-rg65': 'Faster', // Capitalized to test case tolerance
    'q-1794000986368-aqtm': '  bigger  ', // Extra spaces
    'q-1794001046444-p4t1': 'stronger.' // Trailing period
  };

  const res1 = gradeExamSubmission(lec1.exam.questions, studentAnswers1, lec1.exam.passingMarks, lec1.exam.totalMarks);
  console.log(`  -> AutoScore: ${res1.autoScore}/${res1.totalMarks} (${(res1.autoScore/res1.totalMarks)*100}%)`);
  console.log(`  -> Status: ${res1.status}, Passed: ${res1.passed}, HasManual: ${res1.hasManualQuestions}`);

  if (res1.autoScore === 20 && res1.passed === true && res1.hasManualQuestions === false && res1.status === 'graded') {
    console.log('  ✓ Test 1 PASSED: 100% (20/20) auto-graded successfully!\n');
  } else {
    console.error('  ✗ Test 1 FAILED!\n');
    passedAll = false;
  }

  // TEST 2: Grade 6 - شرح زمن ماضى بسيط
  const lec2 = manifest.lectures.find(l => l.id === 'lec-1794035946145');
  console.log(`Test 2: Lecture ${lec2.id} (${lec2.title})`);
  console.log(`Questions count: ${lec2.exam.questions.length}, totalMarks: ${lec2.exam.totalMarks}`);

  const studentAnswers2 = {
    'q-1794035308901-2wig': 'caught',
    'q-1794035389147-bwdw': 'shared',
    'q-1794035453648-66ka': 'was',
    'q-1794035579230-rcpp': 'was'
  };

  const res2 = gradeExamSubmission(lec2.exam.questions, studentAnswers2, lec2.exam.passingMarks, lec2.exam.totalMarks);
  console.log(`  -> AutoScore: ${res2.autoScore}/${res2.totalMarks} (${(res2.autoScore/res2.totalMarks)*100}%)`);
  console.log(`  -> Status: ${res2.status}, Passed: ${res2.passed}, HasManual: ${res2.hasManualQuestions}`);

  if (res2.autoScore === 20 && res2.passed === true && res2.hasManualQuestions === false && res2.status === 'graded') {
    console.log('  ✓ Test 2 PASSED: 100% (20/20) auto-graded successfully!\n');
  } else {
    console.error('  ✗ Test 2 FAILED!\n');
    passedAll = false;
  }

  // TEST 3: Lecture lec-1794002706071
  const lec3 = manifest.lectures.find(l => l.id === 'lec-1794002706071');
  console.log(`Test 3: Lecture ${lec3.id} (${lec3.title})`);
  console.log(`Questions count: ${lec3.exam.questions.length}, totalMarks: ${lec3.exam.totalMarks}`);

  const studentAnswers3 = {
    'q-1794002478609-504w': 'happier',
    'q-1794002537606-nwo0': 'better'
  };

  const res3 = gradeExamSubmission(lec3.exam.questions, studentAnswers3, lec3.exam.passingMarks, lec3.exam.totalMarks);
  console.log(`  -> AutoScore: ${res3.autoScore}/${res3.totalMarks} (${(res3.autoScore/res3.totalMarks)*100}%)`);
  console.log(`  -> Status: ${res3.status}, Passed: ${res3.passed}, HasManual: ${res3.hasManualQuestions}`);

  if (res3.autoScore === 20 && res3.passed === true && res3.hasManualQuestions === false && res3.status === 'graded') {
    console.log('  ✓ Test 3 PASSED: 100% (20/20) auto-graded successfully!\n');
  } else {
    console.error('  ✗ Test 3 FAILED!\n');
    passedAll = false;
  }

  // TEST 4: Partial scoring test (3 correct, 1 wrong)
  const studentAnswersPartial = {
    'q-1794000714476-0zvp': 'taller',
    'q-1794000915094-rg65': 'faster',
    'q-1794000986368-aqtm': 'wrong_answer',
    'q-1794001046444-p4t1': 'stronger'
  };
  const resPartial = gradeExamSubmission(lec1.exam.questions, studentAnswersPartial, lec1.exam.passingMarks, lec1.exam.totalMarks);
  console.log(`Test 4: Partial Scoring (3 of 4 correct)`);
  console.log(`  -> AutoScore: ${resPartial.autoScore}/${resPartial.totalMarks} (expected 15/20)`);
  if (resPartial.autoScore === 15 && resPartial.passed === true) {
    console.log('  ✓ Test 4 PASSED: partial score 15/20 calculated accurately!\n');
  } else {
    console.error('  ✗ Test 4 FAILED!\n');
    passedAll = false;
  }

  if (passedAll) {
    console.log('🎉 ALL END-TO-END EXAM GRADING VERIFICATIONS SUCCEEDED WITH 100% ACCURACY!');
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
