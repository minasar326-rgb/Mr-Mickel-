const assert = require('assert');

// Exact data from the live platform
const studentUid = 'kWL0N03jBAdq09lJL0LFrYQhrNd2';
const studentUser = {
  uid: studentUid,
  id: studentUid,
  name: 'Mina Sar',
  email: 'minasar326@gmail.com',
  subscriptions: {
    'sec-1794003102422': {
      userId: studentUid,
      targetId: 'sec-1794003102422',
      courseId: 'sec-1794003102422',
      stageId: 'stage-1793823838440',
      targetTitle: 'اشتراك: شرح الوحده الخامسه',
      codeType: 'month',
      activationCode: '1969623616',
      startDate: '2026-11-07T15:47:45.127Z',
      expirationDate: '2099-12-31T23:59:59.999Z',
      expiresAt: '2099-12-31T23:59:59.999Z',
      isPermanent: true,
      durationDays: 36500,
      status: 'active',
      isPaused: false,
      isCancelled: false,
      isFrozen: false,
      subscribed: true
    }
  }
};

const liveLectures = [
  {
    id: 'lec-1794001152669',
    title: 'شرح قاعده المقارنه الجزء الاول ',
    stageId: 'stage-1793823838440',
    sectionId: 'sec-1794003102422',
    order: 1,
    isFree: false
  },
  {
    id: 'lec-1794002706071',
    title: 'شرح قاعده المقارنه الجزء 2',
    stageId: 'stage-1793823838440',
    sectionId: 'sec-1794003102422',
    order: 2,
    isFree: false
  }
];

// Let's import coversLecture and test it directly
(async () => {
  const { coversLecture } = await import('../src/utils/entitlements.js');

  console.log('Testing coversLecture for Lecture 1:');
  const covers1 = coversLecture(studentUser.subscriptions['sec-1794003102422'], liveLectures[0], liveLectures);
  console.log('coversLecture(lec 1):', covers1);

  console.log('Testing coversLecture for Lecture 2:');
  const covers2 = coversLecture(studentUser.subscriptions['sec-1794003102422'], liveLectures[1], liveLectures);
  console.log('coversLecture(lec 2):', covers2);
})();
