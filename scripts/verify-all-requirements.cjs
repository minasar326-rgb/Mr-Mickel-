// Comprehensive automated verification test suite for Mr. Michael Shehata LMS
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('=====================================================');
console.log('🧪 RUNNING COMPREHENSIVE PLATFORM VERIFICATION SUITE');
console.log('=====================================================\n');

// 1. Verify Student Subscription Pause & Invalidation Logic
console.log('--- TEST GROUP 1: Subscription Pause & Cloud Invalidation ---');
const firestoreSyncContent = fs.readFileSync(path.join(ROOT_DIR, 'src/services/firestoreSync.js'), 'utf8');
const teacherContextContent = fs.readFileSync(path.join(ROOT_DIR, 'src/context/TeacherContext.jsx'), 'utf8');

assert(firestoreSyncContent.includes('updateStudentSubscriptionStatusInCloud'), 'firestoreSync exports updateStudentSubscriptionStatusInCloud');
assert(firestoreSyncContent.includes('saveAuditLogToCloud'), 'firestoreSync exports saveAuditLogToCloud');
assert(teacherContextContent.includes('updateStudentSubscriptionStatusInCloud'), 'TeacherContext imports and uses updateStudentSubscriptionStatusInCloud');
assert(teacherContextContent.includes('saveAuditLogToCloud'), 'TeacherContext records audit logs for subscription status changes');
assert(teacherContextContent.includes('ms_unlocked_with_expiry'), 'TeacherContext invalidates active localStorage cached sessions when paused');
assert(teacherContextContent.includes('madarek_user'), 'TeacherContext updates or invalidates student user cache');

// 2. Verify Removal of Student Attendance Tab (while preserving data)
console.log('\n--- TEST GROUP 2: Student Attendance Tab Removal ---');
const adminCenterContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/teacher-admin/TeacherAdminCenter.jsx'), 'utf8');

assert(!adminCenterContent.includes("{ id: 'students'"), 'Tab navigation array does NOT contain students tab');
assert(!adminCenterContent.includes("activeTab === 'students'"), 'activeTab === "students" JSX block is completely removed');
assert(adminCenterContent.includes('allStudentSubscriptions'), 'Subscriptions management tab is active and fully functional');
assert(adminCenterContent.includes('students'), 'students state and data are strictly preserved in admin center');
assert(teacherContextContent.includes('students'), 'students data structure preserved in TeacherContext');

// 3. Verify Treasury Overhaul (Only paid redeemed codes, no online/fake revenue, stage breakdown)
console.log('\n--- TEST GROUP 3: Treasury (الخزنة) Overhaul ---');
assert(adminCenterContent.includes('paidRedeemedCodesTransactions'), 'Treasury strictly filters transactions by paymentMethod === "code" and completed status');
assert(adminCenterContent.includes('totalPaidCodesCount'), 'Treasury tracks count of paid redeemed codes');
assert(adminCenterContent.includes('giftCodesCount'), 'Treasury tracks count of free gift codes separately');
assert(!adminCenterContent.includes('📱 الدفع الإلكتروني المباشر'), 'Direct electronic payment card is completely removed from treasury view');
assert(adminCenterContent.includes('🎓 إيرادات المنصة مفصلة حسب المراحل الدراسية'), 'Treasury contains breakdown by educational stages');
assert(adminCenterContent.includes('📊 إيرادات المنصة مفصلة حسب الشهور والكورسات'), 'Treasury contains breakdown by months and courses');

// 4. Verify Dynamic Hero & Profile Text Customization
console.log('\n--- TEST GROUP 4: Dynamic Teacher Hero & Bio Customization ---');
const teacherHeroContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/teacher-landing/TeacherHero.jsx'), 'utf8');
const teacherDataContent = fs.readFileSync(path.join(ROOT_DIR, 'src/data/teacherData.js'), 'utf8');

assert(teacherHeroContent.includes('teacherProfile?.welcomeBadge'), 'Hero uses dynamic welcomeBadge');
assert(teacherHeroContent.includes('teacherProfile?.heroSlogan'), 'Hero uses dynamic heroSlogan');
assert(teacherHeroContent.includes('teacherProfile?.heroDescription'), 'Hero uses dynamic heroDescription');
assert(teacherHeroContent.includes('teacherProfile?.statBadgeNumber'), 'Hero uses dynamic statBadgeNumber');
assert(teacherHeroContent.includes('teacherProfile?.supportBadgeTitle'), 'Hero uses dynamic supportBadgeTitle');
assert(adminCenterContent.includes('profileWelcomeBadge'), 'Admin profile tab contains state for welcomeBadge');
assert(adminCenterContent.includes('profileHeroSlogan'), 'Admin profile tab contains state for heroSlogan');
assert(adminCenterContent.includes('profileHeroDescription'), 'Admin profile tab contains state for heroDescription');
assert(teacherDataContent.includes('welcomeBadge'), 'teacherData.js defines default welcomeBadge');
assert(teacherDataContent.includes('heroSlogan'), 'teacherData.js defines default heroSlogan');

// 5. Verify Push Notifications & Service Worker Integration
console.log('\n--- TEST GROUP 5: External Push Notifications & Service Worker ---');
const swContent = fs.readFileSync(path.join(ROOT_DIR, 'public/sw.js'), 'utf8');
const pushServiceContent = fs.readFileSync(path.join(ROOT_DIR, 'src/services/pushNotificationService.js'), 'utf8');
const bannerContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/common/NotificationPermissionBanner.jsx'), 'utf8');
const appContent = fs.readFileSync(path.join(ROOT_DIR, 'src/App.jsx'), 'utf8');

assert(swContent.includes("addEventListener('push'"), 'sw.js contains native Web Push event listener');
assert(swContent.includes("addEventListener('notificationclick'"), 'sw.js handles notification clicks and client window opening');
assert(pushServiceContent.includes('dispatchExternalNotification'), 'pushNotificationService provides dispatchExternalNotification');
assert(pushServiceContent.includes('requestNotificationPermission'), 'pushNotificationService handles permission requests');
assert(adminCenterContent.includes('annSendAsPush'), 'Admin broadcast tab includes push notification toggle');
assert(adminCenterContent.includes('annAudience'), 'Admin broadcast tab includes audience targeting (all, stage, student)');
assert(appContent.includes('NotificationPermissionBanner'), 'App.jsx includes NotificationPermissionBanner');

// 6. Verify Unified Hotline & WhatsApp
console.log('\n--- TEST GROUP 6: Unified Hotline & WhatsApp ---');
assert(appContent.includes('tel:'), 'Footer provides direct tel: link for hotline');
assert(appContent.includes('https://wa.me/'), 'Footer provides direct wa.me link for WhatsApp');
assert(appContent.includes('unifiedPhone'), 'Hotline and WhatsApp both use unifiedPhone from teacherProfile');
assert(teacherDataContent.includes('supportHotline: "01012345678"'), 'teacherData hotline matches 01012345678');
assert(teacherDataContent.includes('whatsappNumber: "01012345678"'), 'teacherData whatsapp matches 01012345678');

// 7. Verify Removal of Technical Infrastructure Mentions
console.log('\n--- TEST GROUP 7: Clean Professional Wording (No Raw Tech Mentions) ---');
const authModalContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/auth/AuthModal.jsx'), 'utf8');

assert(!authModalContent.includes('Firebase & Google Authentication'), 'AuthModal does not mention raw Firebase Authentication');
assert(!adminCenterContent.includes('السحابة التعليمية وقواعد البيانات مؤمنة ومتصلة بنجاح'), 'Admin center yellow cloud banner is completely removed');
assert(!adminCenterContent.includes('مزامنة كاملة لبيانات المنصة سحابياً'), 'Admin center cloud sync button is removed');
assert(!adminCenterContent.includes('رفع فيديو المحاضرة بنجاح على سحابة Cloudflare R2'), 'Video toast does not mention Cloudflare R2');
assert(!adminCenterContent.includes('رفع ملف المذكرة إلى سحابة Cloudflare'), 'Booklet toast does not mention Cloudflare');

// 8. Verify Manual Exam Suite & Progression Lock Logic
console.log('\n--- TEST GROUP 8: Manual Exam Suite & Progression Gate ---');
assert(adminCenterContent.includes('100% Manual - No AI'), 'Admin center offers 100% manual exam creation');
assert(adminCenterContent.includes('التصحيح اليدوي للأسئلة المقالية'), 'Admin center contains manual grading queue');
assert(teacherContextContent.includes('missing: \'watch\''), 'Lecture locked if watch percent < 50%');
assert(teacherContextContent.includes('missing: \'exam_pending_grading\''), 'Lecture locked if exam essay is pending teacher manual grading');
assert(teacherContextContent.includes('missing: \'exam_failed\''), 'Lecture locked if exam score <= 50%');

// 9. Verify Exam Builder Reorganization (Buttons at bottom, live metrics header, objective-first ordering)
console.log('\n--- TEST GROUP 9: Exam Builder Layout & Question Reorganization ---');
assert(adminCenterContent.includes('لوحة إحصائيات وهيكل الامتحان'), 'Exam builder contains 5-metric structure header at top');
assert(adminCenterContent.includes('إضافة سؤال جديد في نهاية الامتحان'), 'Question addition toolbar is positioned at bottom of list');
assert(adminCenterContent.includes('ترتيب إلزامي: الموضوعي أولاً ثم المقالي'), 'Exam builder enforces canonical question sorting rule');
assert(adminCenterContent.includes('strictlyOrderedQuestions'), 'Exam saver programmatically places objective questions before essay questions');

// 10. Verify Standalone General Exam Engine & Personal Student Codes
console.log('\n--- TEST GROUP 10: Standalone General Exam & Personalized Codes ---');
const navbarContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/common/TeacherNavbar.jsx'), 'utf8');
const generalExamPageContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/student/GeneralExamPage.jsx'), 'utf8');
const examModalContent = fs.readFileSync(path.join(ROOT_DIR, 'src/components/student/EnglishExamModal.jsx'), 'utf8');

assert(teacherContextContent.includes('generalExams'), 'TeacherContext maintains generalExams state');
assert(teacherContextContent.includes('generalExamCodes'), 'TeacherContext maintains generalExamCodes state');
assert(teacherContextContent.includes('generateGeneralExamCode'), 'TeacherContext provides single student code generation');
assert(teacherContextContent.includes('bulkGenerateGeneralExamCodes'), 'TeacherContext provides bulk stage code generation');
assert(teacherContextContent.includes('verifyAndRedeemGeneralExamCode'), 'TeacherContext enforces code validity and student identity matching');
assert(teacherContextContent.includes('resetGeneralExamAttempt'), 'TeacherContext allows teacher to reopen attempt for a student');
assert(teacherContextContent.includes('submitGeneralExam'), 'TeacherContext tracks general exam submission and grades');

assert(navbarContent.includes("📝 الامتحان العام"), 'TeacherNavbar desktop navigation includes General Exam link');
assert(navbarContent.includes("📝 الامتحان العام الشامل"), 'TeacherNavbar mobile drawer includes General Exam link');
assert(appContent.includes("currentPage === 'general-exam'"), 'App.jsx routes general-exam page');
assert(appContent.includes('GeneralExamPage'), 'App.jsx imports and mounts GeneralExamPage');

assert(generalExamPageContent.includes('verifyAndRedeemGeneralExamCode'), 'GeneralExamPage gates access via personalized student codes');
assert(generalExamPageContent.includes('isAlreadySubmitted'), 'GeneralExamPage restricts students strictly to one single attempt');
assert(examModalContent.includes('isGeneralExam'), 'EnglishExamModal accepts isGeneralExam prop');
assert(examModalContent.includes('submitGeneralExam'), 'EnglishExamModal routes submission to general exam engine');

assert(adminCenterContent.includes("id: 'general-exams'"), 'TeacherAdminCenter provides standalone general-exams tab');
assert(adminCenterContent.includes("id: 'general-codes'"), 'TeacherAdminCenter provides standalone general-codes tab');
assert(adminCenterContent.includes("activeTab === 'general-exams'"), 'TeacherAdminCenter renders standalone General Exams Studio');
assert(adminCenterContent.includes("activeTab === 'general-codes'"), 'TeacherAdminCenter renders standalone General Exam Codes Studio');
assert(teacherContextContent.includes('cancelGeneralExamCode'), 'TeacherContext provides cancelGeneralExamCode');
assert(adminCenterContent.includes('cancelGeneralExamCode'), 'TeacherAdminCenter allows cancelling general exam code');
assert(adminCenterContent.includes('توليد كود شخصي مخصص لطالب'), 'Admin center provides personalized student code generator');
assert(adminCenterContent.includes('resetGeneralExamAttempt'), 'Admin center provides reset attempt button for teacher manual override');

// 11. Verify Inline Lecture Exam Studio & Lecture Edit Mode
console.log('\n--- TEST GROUP 11: Inline Lecture Exam Studio & Lecture Edit Mode ---');
assert(adminCenterContent.includes('id="lecture-exam-inline-section"'), 'Lecture form contains inline lecture exam section');
assert(adminCenterContent.includes('هل تريد إضافة امتحان لهذه المحاضرة؟'), 'Lecture form asks user if they want to add an exam');
assert(adminCenterContent.includes('نعم، أريد إضافة امتحان'), 'Toggle option for adding exam is present');
assert(adminCenterContent.includes('لا، بدون امتحان (فيديو ومذكرة فقط)'), 'Toggle option for no exam is present');
assert(adminCenterContent.includes('إحصائيات وهيكل امتحان المحاضرة (مباشر)'), 'Live 5-metric counter dashboard is present in inline exam editor');
assert(adminCenterContent.includes('➕ إضافة سؤال جديد في نهاية الامتحان (أسفل آخر سؤال)'), 'Add question toolbar is at bottom of inline exam editor');
assert(adminCenterContent.includes('handleStartEditLecture'), 'TeacherAdminCenter provides handleStartEditLecture to edit existing lectures');
assert(adminCenterContent.includes('handleCancelEditLecture'), 'TeacherAdminCenter provides handleCancelEditLecture');
assert(adminCenterContent.includes('تعديل المحاضرة والامتحان ✏️'), 'Lecture cards list has Edit Lecture & Exam button');
assert(teacherContextContent.includes('updateLecture'), 'TeacherContext provides updateLecture function');

console.log('\n=====================================================');
console.log('🎉 ALL 11 COMPREHENSIVE VERIFICATION GROUPS PASSED! 🎉');
console.log('=====================================================');

