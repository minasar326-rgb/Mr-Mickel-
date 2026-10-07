export const mockUsers = {
  student: {
    id: "usr-student-1",
    name: "سعد القحطاني",
    email: "saad@example.com",
    role: "student",
    title: "مطور برمجيات طموح",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    joinDate: "يناير 2025",
    xpPoints: 3450,
    currentStreak: 12,
    completedHours: 38,
    level: "متعلم نشط (مستوى 5)",
    enrolledCourses: [
      {
        courseId: "fullstack-react-nextjs",
        enrolledDate: "2026-06-10",
        lastAccessed: "2026-08-15",
        completedLessonIds: ["les-101", "les-102", "les-103", "les-104", "les-201"],
        progressPercentage: 45,
        quizScores: {
          "les-103": { score: 100, passed: true, date: "2026-08-10" }
        },
        certificateEarned: false
      },
      {
        courseId: "genai-prompt-engineering",
        enrolledDate: "2026-07-01",
        lastAccessed: "2026-08-12",
        completedLessonIds: ["gen-101", "gen-102"],
        progressPercentage: 100,
        quizScores: {
          "gen-102": { score: 100, passed: true, date: "2026-08-12" }
        },
        certificateEarned: true,
        certificateId: "MDRK-AI-9942-SA"
      }
    ],
    certificates: [
      {
        id: "MDRK-AI-9942-SA",
        courseId: "genai-prompt-engineering",
        courseTitle: "هندسة الأوامر وتطبيقات الذكاء الاصطناعي التوليدي (GenAI & LLMs)",
        issueDate: "12 أغسطس 2026",
        studentName: "سعد القحطاني",
        instructorName: "د. سارة المنصور",
        grade: "امتياز مع مرتبة الشرف (98%)",
        hours: 28,
        qrCodeValue: "https://madarek.edu.sa/verify/MDRK-AI-9942-SA"
      }
    ],
    achievements: [
      { id: "ach-1", title: "شعلة الالتزام 🔥", description: "تعلم لمدة 10 أيام متتالية", icon: "Flame", unlocked: true, date: "قبل 2 يوم" },
      { id: "ach-2", title: "عبقري الكود 💻", description: "أتممت أول تحدٍ برمجي بنجاح", icon: "Code", unlocked: true, date: "قبل أسبوع" },
      { id: "ach-3", title: "متقن الذكاء الاصطناعي 🧠", description: "حصلت على أول شهادة معتمدة في الـ AI", icon: "Award", unlocked: true, date: "قبل 4 أيام" },
      { id: "ach-4", title: "عاشق التعلم 🚀", description: "شاهدت أكثر من 30 ساعة تدريبية", icon: "Rocket", unlocked: true, date: "قبل أسبوعين" },
      { id: "ach-5", title: "درع التميز 🛡️", description: "أنهِ مسار الأمن السيبراني", icon: "Shield", unlocked: false, progress: 0 }
    ],
    savedNotes: [
      {
        id: "note-1",
        courseId: "fullstack-react-nextjs",
        lessonId: "les-101",
        lessonTitle: "مقدمة المسار وخريطة الطريق للمستقبل",
        timestamp: "04:15",
        text: "تذكر مراجعة مفهوم Server Actions وتطبيقها بدلاً من بناء API Routes التقليدية لتوفير الوقت وتقليل الأخطاء.",
        createdAt: "2026-08-10"
      },
      {
        id: "note-2",
        courseId: "fullstack-react-nextjs",
        lessonId: "les-102",
        lessonTitle: "تهيئة بيئة العمل المتكاملة",
        timestamp: "08:30",
        text: "إضافة Tailwind CSS IntelliSense و ES7+ React Snippets ضرورية جداً لزيادة الإنتاجية.",
        createdAt: "2026-08-11"
      }
    ],
    wishlist: ["figma-ui-ux-masterclass", "ethical-hacking-cybersecurity"],
    cart: []
  },
  instructor: {
    id: "usr-inst-1",
    name: "م. طارق العتيبي",
    email: "tariq@madarek.edu",
    role: "instructor",
    title: "كبير مهندسي البرمجيات ومدرب معتمد",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    joinDate: "مارس 2024",
    totalEarnings: 84350,
    totalStudents: 32000,
    averageRating: 4.95,
    activeCoursesCount: 6,
    monthlyEarnings: [
      { month: "يناير", amount: 9800 },
      { month: "فبراير", amount: 11200 },
      { month: "مارس", amount: 12500 },
      { month: "أبريل", amount: 10400 },
      { month: "مايو", amount: 14200 },
      { month: "يونيو", amount: 15600 },
      { month: "يوليو", amount: 17800 },
      { month: "أغسطس", amount: 18850 }
    ],
    recentReviews: [
      { id: "rev-1", studentName: "عبدالله الشمري", courseTitle: "Full-Stack React & Next.js", rating: 5, comment: "شرح ولا أروع! طبقت المشروع وحصلت على وظيفة بعد انتهاء الدورة مباشرة.", date: "اليوم" },
      { id: "rev-2", studentName: "منى التميمي", courseTitle: "Full-Stack React & Next.js", rating: 5, comment: "طريقة تبسيط مفاهيم Next.js 15 و Server Actions كانت الأفضل على الإطلاق.", date: "أمس" }
    ]
  },
  admin: {
    id: "usr-admin-1",
    name: "فريق إدارة مدارك",
    email: "admin@madarek.edu",
    role: "admin",
    title: "مدير النظام العام",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80",
    totalPlatformStudents: 64200,
    totalPlatformCourses: 120,
    totalRevenue: 540200,
    pendingApprovals: 4
  }
};
