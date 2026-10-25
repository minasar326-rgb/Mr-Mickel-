import React, { createContext, useContext, useState, useEffect } from 'react';
import { teacherProfile as initialTeacherProfile } from '../data/teacherData';
import { lecturesData as initialLectures } from '../data/lecturesData';
import { examsData as initialExams } from '../data/examsData';
import { initialAccessCodes } from '../data/studentCodes';
import { mockStudentsList } from '../data/mockStudents';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';
import { 
  saveStudentToFirestore, 
  deleteStudentFromFirestore,
  saveLectureToFirestore, 
  deleteLectureFromFirestore,
  syncTeacherProfile, 
  batchSyncStudents, 
  listenToLectures,
  listenToStudents,
  listenToRtdbNode,
  saveToRtdb,
  removeFromRtdb,
  syncStagesToCloud,
  syncBookletToCloud,
  deleteBookletFromCloud,
  syncAchieverToCloud,
  deleteAchieverFromCloud,
  syncCodeToCloud,
  deleteCodeFromCloud,
  fetchCodeFromCloud,
  markCodeAsUsedInCloud,
  syncAnnouncementToCloud,
  deleteAnnouncementFromCloud,
  updateStudentSubscriptionStatusInCloud,
  saveAuditLogToCloud,
  saveAdminUserToCloud,
  deleteAdminUserFromCloud,
  listenToAdminUsers,
  logPlatformAuditAction,
  listenToAuditLogs
} from '../services/firestoreSync';
import { saveMasterPassword, verifyAdminSession } from '../services/authSecurity';
import {
  saveMediaFilePermanently,
  getPermanentMediaUrl,
  deleteMediaPermanently,
  persistCollectionLocally,
  loadCollectionFromLocal,
  STORES
} from '../services/persistentStorage';

const TeacherContext = createContext();

export function normalizeStageId(targetId, stageName = '') {
  if (!targetId && !stageName) return 'sec-3';
  const combined = `${targetId || ''} ${stageName || ''}`.toLowerCase().trim();
  
  if (combined.includes('all-access') || combined.includes('vip') || combined.includes('bundle') || combined.includes('شامل') || combined.includes('كافة') || combined.includes('جميع')) {
    return 'all-access';
  }
  if (combined.includes('sec-3') || combined.includes('sec3') || combined.includes('ثالث') || combined.includes('thanaweya')) {
    return 'sec-3';
  }
  if (combined.includes('sec-2') || combined.includes('sec2') || combined.includes('ثان') || combined.includes('senior 2')) {
    return 'sec-2';
  }
  if (combined.includes('sec-1') || combined.includes('sec1') || combined.includes('أول') || combined.includes('اول') || combined.includes('senior 1')) {
    return 'sec-1';
  }
  if (combined.includes('prep') || combined.includes('إعداد') || combined.includes('اعداد') || combined.includes('middle')) {
    return 'prep';
  }
  if (combined.includes('pri') || combined.includes('ابتد') || combined.includes('primary') || combined.includes('أولاد')) {
    return 'pri';
  }
  if (combined.includes('foundation') || combined.includes('fnd') || combined.includes('تأسيس') || combined.includes('محادثة')) {
    return 'foundation';
  }
  return targetId || 'sec-3';
}

const initialBookletsList = [
  {
    id: "bk-1",
    title: "مذكرة The Master الشاملة - الصف الثالث الثانوي (شرح وتمارين)",
    pages: "180 صفحة",
    size: "24 MB",
    format: "PDF عالي الجودة للطباعة",
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    badge: "النسخة المحدثة 2026 🔥",
    downloadUrl: "#"
  },
  {
    id: "bk-2",
    title: "كتيب كبسولة القواعد (Grammar Formula Summary) - كل أزمنة الإنجليزي",
    pages: "45 صفحة",
    size: "8 MB",
    format: "PDF ألوان ومخططات ذهنية",
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80",
    badge: "ملخص القواعد الذهبي 💡",
    downloadUrl: "#"
  },
  {
    id: "bk-3",
    title: "معجم كلمات الثانوية العامة والـ Idioms & Phrasal Verbs",
    pages: "90 صفحة",
    size: "14 MB",
    format: "PDF متضمن النطق الصوتي",
    cover: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
    badge: "أهم 3000 كلمة 📚",
    downloadUrl: "#"
  }
];

const initialTopAchievers = [
  { id: "ach-1", rank: 1, name: "سعد القحطاني", stageId: "sec-3", stageName: "الصف الثالث الثانوي", score: "50 / 50 (الدرجة النهائية)", school: "ثانوية المتفوقين", badge: "🥇 المركز الأول على مستوى الجمهورية", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" },
  { id: "ach-2", rank: 2, name: "سارة الزهراني", stageId: "prep", stageName: "الصف الثالث الإعدادي", score: "50 / 50 (الدرجة النهائية)", school: "مدرسة اللغات الرسمية", badge: "🥈 المركز الأول إعدادي", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
  { id: "ach-3", rank: 3, name: "عبدالله الشمري", stageId: "sec-2", stageName: "الصف الثاني الثانوي", score: "49.5 / 50", school: "مدرسة الأوائل الثانوية", badge: "🥉 المركز الثالث", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { id: "ach-4", rank: 4, name: "نورهان إبراهيم", stageId: "pri", stageName: "الصف السادس الابتدائي", score: "50 / 50 (الدرجة النهائية)", school: "مدرسة النيل الدولية", badge: "🌟 المركز الأول ابتدائي", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" }
];

const richInitialStudents = [
  {
    id: "std-101",
    code: "MS-SEC3-101",
    name: "سعد القحطاني",
    phone: "01099887766",
    parentPhone: "01011223344",
    parentName: "أبو سعد القحطاني",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    groupType: "center",
    centerName: "سنتر النخبة (الدقي)",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    joinedDate: "2026-08-01",
    isActive: true,
    finance: {
      monthlyFee: 250,
      paidAmount: 250,
      dueAmount: 0,
      paymentStatus: "paid",
      lastPaymentDate: "2026-08-10",
      paymentMethod: "فودافون كاش (Vodafone Cash)",
      transactionId: "VF-994821",
      receiptNumber: "REC-2026-001"
    },
    attendanceRate: "100%",
    unlockedLectureIds: ["lec-s3-01", "lec-s3-02", "lec-s3-03"],
    completedLectures: ["lec-s3-01", "lec-s3-02"],
    homeworkStatus: {
      "lec-s3-01": { status: "submitted", grade: "10/10 (ممتاز)", remarks: "حل نموذجي وكتابة مقال ممتازة" }
    },
    examScores: {
      "lec-s3-01": { score: 20, total: 20, grade: "امتياز 100%", date: "15 أغسطس 2026" }
    },
    totalXp: 4200,
    rank: 1,
    pronunciationScore: "96%",
    teacherNotes: "طالب متميز جداً وحريص على الدرجة النهائية",
    subscriptions: {
      "sec3-month-1": {
        id: "sub-101-1",
        targetId: "sec3-month-1",
        targetTitle: "الشهر الأول: Grammar Units 1 & 2 + Advanced Translation",
        stageId: "sec-3",
        stageName: "الصف الثالث الثانوي",
        type: "month",
        activationCode: "MS-SEC3-2026",
        startDate: "2026-08-01",
        expirationDate: "2026-11-01",
        expiresAt: "2026-11-01",
        durationDays: 90,
        paidAmount: 250,
        status: "active"
      }
    }
  },
  {
    id: "std-102",
    code: "MS-SEC3-102",
    name: "سارة الزهراني",
    phone: "01122334455",
    parentPhone: "01199887766",
    parentName: "أم سارة",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    groupType: "online",
    centerName: "أونلاين VIP",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    joinedDate: "2026-08-05",
    isActive: true,
    finance: {
      monthlyFee: 250,
      paidAmount: 250,
      dueAmount: 0,
      paymentStatus: "paid",
      lastPaymentDate: "2026-08-12",
      paymentMethod: "إنستاباي (InstaPay)",
      transactionId: "IP-882190",
      receiptNumber: "REC-2026-002"
    },
    attendanceRate: "95%",
    unlockedLectureIds: ["lec-s3-01", "lec-s3-02"],
    completedLectures: ["lec-s3-01"],
    homeworkStatus: {
      "lec-s3-01": { status: "submitted", grade: "9.5/10 (رائع)", remarks: "خطأ بسيط في حرف الجر" }
    },
    examScores: {
      "lec-s3-01": { score: 19, total: 20, grade: "ممتاز 95%", date: "14 أغسطس 2026" }
    },
    totalXp: 3950,
    rank: 2,
    pronunciationScore: "92%",
    teacherNotes: "مستواها رائع في حفظ الكلمات",
    subscriptions: {
      "sec3-course-fnd": {
        id: "sub-102-1",
        targetId: "sec3-course-fnd",
        targetTitle: "كورس التأسيس الشامل (The Master Foundation Bootcamp)",
        stageId: "sec-3",
        stageName: "الصف الثالث الثانوي",
        type: "course",
        activationCode: "MS-FND-8899",
        startDate: "2026-08-05",
        expirationDate: "2026-11-05",
        expiresAt: "2026-11-05",
        durationDays: 90,
        paidAmount: 250,
        status: "active"
      }
    }
  },
  {
    id: "std-103",
    code: "MS-SEC3-103",
    name: "عبدالله الشمري",
    phone: "01233445566",
    parentPhone: "01299881122",
    parentName: "أبو عبدالله",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    groupType: "center",
    centerName: "سنتر الأوائل (مدينة نصر)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    joinedDate: "2026-08-08",
    isActive: true,
    finance: {
      monthlyFee: 250,
      paidAmount: 100,
      dueAmount: 150,
      paymentStatus: "partial",
      lastPaymentDate: "2026-08-08",
      paymentMethod: "كاش بالسنتر",
      transactionId: "CTR-4412",
      receiptNumber: "REC-2026-003"
    },
    attendanceRate: "90%",
    unlockedLectureIds: ["lec-s3-01"],
    completedLectures: ["lec-s3-01"],
    homeworkStatus: {
      "lec-s3-01": { status: "submitted", grade: "9/10", remarks: "يحتاج تدريب أكثر على الترجمة" }
    },
    examScores: {
      "lec-s3-01": { score: 18, total: 20, grade: "جيد جداً مرتفع 90%", date: "15 أغسطس 2026" }
    },
    totalXp: 3400,
    rank: 3,
    pronunciationScore: "88%",
    teacherNotes: "متبقي عليه 150 ج.م من مصاريف الشهر",
    subscriptions: {
      "sec3-month-1": {
        id: "sub-103-1",
        targetId: "sec3-month-1",
        targetTitle: "الشهر الأول: Grammar Units 1 & 2 + Advanced Translation",
        stageId: "sec-3",
        stageName: "الصف الثالث الثانوي",
        type: "month",
        activationCode: "MS-SEC3-8812",
        startDate: "2026-08-08",
        expirationDate: "2026-10-08",
        expiresAt: "2026-10-08",
        durationDays: 60,
        paidAmount: 100,
        status: "paused",
        isPaused: true,
        pauseReason: "تأخر في سداد القسط الثاني بالسنتر"
      }
    }
  }
];

export const initialSections = [
  {
    id: "sec3-month-1",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    title: "الشهر الأول: Grammar Units 1 & 2 + Advanced Translation",
    type: "month",
    monthNumber: 1,
    description: "شرح شامل ومبسط لأزمنة الماضي والمضارع التام مع مهارات الترجمة المتقدمة وحل 200 سؤال وزاري.",
    price: 180,
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    order: 1,
    createdAt: "2026-08-01"
  },
  {
    id: "sec3-month-2",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    title: "الشهر الثاني: Grammar Units 3 & 4 + Story Chapters 1-3",
    type: "month",
    monthNumber: 2,
    description: "أزمنة المستقبل وصيغ المجهول مع دراسة تفصيلية وتحليل لأهم شخصيات قصة Great Expectations.",
    price: 180,
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    order: 2,
    createdAt: "2026-09-01"
  },
  {
    id: "sec3-course-fnd",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    title: "كورس التأسيس الشامل (The Master Foundation Bootcamp)",
    type: "course",
    description: "تأسيس شامل من الصفر في القواعد وأساسيات تكوين الجملة الإنجليزية ومهارات المقال والترجمة.",
    price: 250,
    cover: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    order: 3,
    createdAt: "2026-07-15"
  },
  {
    id: "prep-month-1",
    stageId: "prep",
    stageName: "الصف الثالث الإعدادي",
    title: "الشهر الأول: منهج New Hello Unit 1 & 2",
    type: "month",
    monthNumber: 1,
    description: "شرح كامل للوحدتين الأولى والثانية مع تدريبات مكثفة على المحادثات وحل امتحانات المحافظات.",
    price: 120,
    cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    order: 1,
    createdAt: "2026-08-15"
  },
  {
    id: "pri-month-1",
    stageId: "pri",
    stageName: "المرحلة الابتدائية",
    title: "الشهر الأول: Connect & Connect Plus Units 1 & 2",
    type: "month",
    monthNumber: 1,
    description: "شرح النطق الصحيح وتأسيس الجرامر والقراءة التفاعلية للأطفال.",
    price: 100,
    cover: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    order: 1,
    createdAt: "2026-08-15"
  }
];

export const initialTransactions = [
  {
    id: "tx-101",
    userId: "std-101",
    studentName: "سعد القحطاني",
    studentPhone: "01099887766",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    targetType: "month",
    targetId: "sec3-month-1",
    targetTitle: "الشهر الأول: Grammar Units 1 & 2",
    amount: 180,
    paymentMethod: "vodafone",
    paymentMethodLabel: "فودافون كاش",
    status: "completed",
    isGift: false,
    codeUsed: null,
    createdAt: "2026-08-10T14:20:00Z"
  },
  {
    id: "tx-102",
    userId: "std-102",
    studentName: "سارة الزهراني",
    studentPhone: "01011223344",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    targetType: "course",
    targetId: "sec3-course-fnd",
    targetTitle: "كورس التأسيس الشامل",
    amount: 250,
    paymentMethod: "code",
    paymentMethodLabel: "كود شحن مدفوع",
    status: "completed",
    isGift: false,
    codeUsed: "MS-FND-8899",
    createdAt: "2026-08-15T11:00:00Z"
  }
];

const sanitizeAvatar = (url) => {
  if (!url || typeof url !== 'string' || url.includes('unsplash.com/photo-1560250097-0b93528c311a')) {
    return './teacher-avatar.jpg';
  }
  return url;
};

export function TeacherProvider({ children }) {
  const { currentUser, role, addXP, addSubscriptionToUser, openAuthModal } = useAuth();
  const { addToast } = useToast();

  // 1. Teacher Profile
  const [teacherProfile, setTeacherProfile] = useState(() => {
    const savedPin = localStorage.getItem('ms_teacher_pin') || '12345';
    try {
      const saved = localStorage.getItem('ms_teacher_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const cleanAvatar = sanitizeAvatar(parsed.avatar);
          return { ...initialTeacherProfile, ...parsed, avatar: cleanAvatar, password: parsed.password || savedPin };
        }
      }
    } catch (e) {}
    return { ...initialTeacherProfile, avatar: './teacher-avatar.jpg', password: savedPin };
  });

  // 2. Stages
  const [stages, setStages] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_stages');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return Array.isArray(initialTeacherProfile.stages) ? initialTeacherProfile.stages : [];
  });

  // Sanitizers to eliminate dead blob: URLs from previous browser sessions
  const sanitizeLectures = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(lec => {
      if (!lec) return lec;
      const cleanUrl = (lec.videoUrl && typeof lec.videoUrl === 'string' && !lec.videoUrl.startsWith('blob:')) 
        ? lec.videoUrl 
        : '';
      return { ...lec, videoUrl: cleanUrl };
    });
  };

  const sanitizeBooklets = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(b => {
      if (!b) return b;
      const cleanUrl = (b.downloadUrl && typeof b.downloadUrl === 'string' && !b.downloadUrl.startsWith('blob:')) 
        ? b.downloadUrl 
        : '#';
      return { ...b, downloadUrl: cleanUrl };
    });
  };

  // 3. Lectures
  const [lectures, setLectures] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_lectures');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = sanitizeLectures(parsed);
          try {
            localStorage.setItem('ms_lectures', JSON.stringify(cleaned));
          } catch (e) {}
          return cleaned;
        }
      }
    } catch (e) {}
    return [];
  });

  // 4. Booklets
  const [booklets, setBooklets] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_booklets');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = sanitizeBooklets(parsed);
          try {
            localStorage.setItem('ms_booklets', JSON.stringify(cleaned));
          } catch (e) {}
          return cleaned;
        }
      }
    } catch (e) {}
    return [];
  });

  // 5. Top Achievers
  const [topAchievers, setTopAchievers] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_achievers');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 6. Access Codes
  const [accessCodes, setAccessCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_codes');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 7. Students Database
  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_students_rich');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => {
            const initialMatch = richInitialStudents.find(m => m.id === s.id);
            const subs = s.subscriptions || initialMatch?.subscriptions || {};
            return { ...s, subscriptions: subs };
          });
        }
      }
    } catch (e) {}
    return richInitialStudents;
  });

  // 8. Dynamic Sections (Months & Courses per stage)
  const [sections, setSections] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_sections');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialSections;
  });

  // 9. Treasury & Financial Transactions Ledger (الخزنة وسجل المعاملات)
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_transactions');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialTransactions;
  });

  // Sync sections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ms_sections', JSON.stringify(sections));
    } catch (e) {}
  }, [sections]);

  // Sync transactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ms_transactions', JSON.stringify(transactions));
    } catch (e) {}
  }, [transactions]);

  // 8. Unlocked Lectures (With automatic duration expiration check strictly for active user)
  const [unlockedLectureIds, setUnlockedLectureIds] = useState(() => {
    let ids = [];
    try {
      const activeUid = localStorage.getItem('ms_active_uid');
      const unlockedUid = localStorage.getItem('ms_unlocked_uid');
      // Strictly verify that the cached unlocks belong to the currently active user UID
      if (activeUid && unlockedUid && activeUid === unlockedUid) {
        const saved = localStorage.getItem('ms_unlocked_lectures');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) ids = parsed;
        }
      }
    } catch (e) {}
    return ids;
  });

  // Keep ms_unlocked_lectures in sync with state safely
  useEffect(() => {
    try {
      const currentUid = currentUser?.uid || currentUser?.id;
      if (currentUid && currentUid !== 'guest' && unlockedLectureIds && unlockedLectureIds.length > 0) {
        localStorage.setItem('ms_unlocked_uid', currentUid);
        localStorage.setItem('ms_unlocked_lectures', JSON.stringify(unlockedLectureIds));
      }
    } catch (e) {}
  }, [unlockedLectureIds, currentUser]);

  // Clean expired subscriptions automatically on mount and periodically
  useEffect(() => {
    const cleanExpired = () => {
      try {
        const expiryDict = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
        const now = Date.now();
        let changed = false;
        Object.keys(expiryDict).forEach(key => {
          const exp = expiryDict[key]?.expirationDate || expiryDict[key]?.expiresAt;
          if (exp && new Date(exp).getTime() <= now) {
            delete expiryDict[key];
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(expiryDict));
        }
      } catch (e) {}
    };

    cleanExpired();
    const interval = setInterval(cleanExpired, 60000);
    return () => clearInterval(interval);
  }, []);

  // Rehydrate subscriptions strictly from current student Google account (Firestore / Cloud)
  useEffect(() => {
    const currentUid = currentUser?.uid || currentUser?.id;
    const now = Date.now();

    // 1. If not authenticated or in guest mode, lock everything and wipe any cached unlocks
    if (!currentUser || !currentUid || currentUid === 'guest') {
      setUnlockedLectureIds([]);
      try {
        localStorage.removeItem('ms_unlocked_with_expiry');
        localStorage.removeItem('ms_unlocked_lectures');
        localStorage.removeItem('ms_unlocked_uid');
      } catch (e) {}
      return;
    }

    // 2. Active student authenticated: Load subscriptions strictly for THIS currentUid
    const activeIds = [];
    const activeUnlocks = {};
    const userSubs = currentUser.subscriptions;

    if (userSubs && typeof userSubs === 'object') {
      const hasAllAccess = Object.keys(userSubs).some(k => {
        const s = userSubs[k];
        const exp = s?.expirationDate || s?.expiresAt;
        return (k === 'all-access' || s?.stageId === 'all-access') && exp && new Date(exp).getTime() > now && (!s.userId || s.userId === currentUid);
      });

      if (hasAllAccess) {
        activeIds.push('all-access');
        (stages || []).forEach(stg => activeIds.push(stg.id));
        (lectures || []).forEach(lec => activeIds.push(lec.id));
      }

      Object.keys(userSubs).forEach(sId => {
        const sub = userSubs[sId];
        if (!sub) return;
        // Strictly ignore subscriptions belonging to other UIDs
        if (sub.userId && sub.userId !== currentUid) return;

        const expiryStr = sub.expirationDate || sub.expiresAt;
        if (expiryStr && new Date(expiryStr).getTime() > now) {
          const canonStage = normalizeStageId(sId, sub.stageId || sub.targetTitle || '');
          activeIds.push(sId);
          activeIds.push(canonStage);

          const safeSub = {
            ...sub,
            userId: currentUid,
            targetId: sId,
            targetTitle: sub.targetTitle || `اشتراك مرحلة: ${sId}`,
            startDate: sub.startDate || sub.activatedAt || new Date().toISOString(),
            expirationDate: expiryStr,
            expiresAt: expiryStr,
            durationDays: sub.durationDays || 30
          };

          activeUnlocks[sId] = safeSub;
          activeUnlocks[canonStage] = safeSub;

          // Unlock all lectures belonging to this subscribed stage
          (lectures || []).filter(l => l.stageId === sId || normalizeStageId(l.stageId) === canonStage).forEach(l => {
            activeIds.push(l.id);
            activeUnlocks[l.id] = {
              ...safeSub,
              targetId: l.id,
              fromStage: canonStage
            };
          });
        }
      });
    }

    const uniqueActiveIds = Array.from(new Set(activeIds));
    setUnlockedLectureIds(uniqueActiveIds);

    // Save cache tagged with currentUid ONLY
    try {
      localStorage.setItem('ms_unlocked_uid', currentUid);
      localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(activeUnlocks));
      localStorage.setItem('ms_unlocked_lectures', JSON.stringify(uniqueActiveIds));
    } catch (e) {}
  }, [currentUser, lectures, stages, role]);

  // 9. Completed Lectures
  const [completedLectureIds, setCompletedLectureIds] = useState(() => {
    const saved = localStorage.getItem('ms_completed_lectures');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ["lec-s3-01"];
  });

  // 10. Homework Submissions
  const [homeworkSubmissions, setHomeworkSubmissions] = useState(() => {
    const saved = localStorage.getItem('ms_homeworks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      "lec-s3-01": { status: "submitted", grade: "10/10 (ممتاز)", submittedAt: "2026-08-15" }
    };
  });

  // 11. Exam Results
  const [examResults, setExamResults] = useState(() => {
    const saved = localStorage.getItem('ms_exam_results');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      "lec-s3-01": { score: 20, total: 20, grade: "امتياز 100%", date: "15 أغسطس 2026", passed: true }
    };
  });

  // 11b. Genuine Video Watch Progress (Tracking actual watched time & percentage)
  const [videoWatchProgress, setVideoWatchProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_video_watch_progress');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      "lec-s3-01": { watchedSeconds: 3150, duration: 6300, percent: 100, completed: true }
    };
  });

  // 11c. Teacher Manual Student Overrides ({ [lectureId]: { [studentUid]: { unlocked: true, reason, date } } })
  const [manualOverrides, setManualOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_manual_overrides');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // 11d. Full Exams Database (State of all manual exams per lecture)
  const [examsData, setExamsData] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_exams_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialExams;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_exams_data', JSON.stringify(examsData));
    } catch (e) {}
  }, [examsData]);

  // 11e. Student Exam Submissions & Teacher Manual Grading Queue
  const [examSubmissions, setExamSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_exam_submissions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      "lec-s3-01": {
        "std-103": {
          studentUid: "std-103",
          studentName: "عبدالله الشمري",
          studentPhone: "01233445566",
          lectureId: "lec-s3-01",
          lectureTitle: "المحاضرة 1: الأزمنة والماضي البسيط والمستمر",
          submittedAt: "2026-08-15T14:30:00Z",
          status: "pending_grading",
          autoScore: 12,
          manualScore: 0,
          totalScore: 12,
          maxMarks: 20,
          passingMarks: 14,
          hasManualQuestions: true,
          answers: {
            "eq-1": 1,
            "eq-2": 1,
            "eq-essay-1": "We use past continuous for background actions in progress when interrupted by another sudden action in past simple. Example: While I was studying, my father arrived.",
            "eq-short-1": "piracy"
          },
          gradedQuestions: {},
          teacherNotes: ""
        }
      }
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_exam_submissions', JSON.stringify(examSubmissions));
    } catch (e) {}
  }, [examSubmissions]);

  // 11f. Subscription Audit Logs (سجل عمليات الاشتراكات والتدقيق)
  const [subscriptionAuditLogs, setSubscriptionAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_subscription_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "log-1",
        action: "pause",
        actionLabel: "إيقاف مؤقت ⏸️",
        studentId: "std-103",
        studentName: "عبدالله الشمري",
        studentPhone: "01233445566",
        targetId: "sec3-month-1",
        targetTitle: "الشهر الأول: Grammar Units 1 & 2",
        reason: "تأخر في سداد القسط الثاني بالسنتر",
        adminName: "مستر مايكل شحاته",
        date: "2026-08-14T10:15:00Z"
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_subscription_logs', JSON.stringify(subscriptionAuditLogs));
    } catch (e) {}
  }, [subscriptionAuditLogs]);

  // 11g. Standalone General Exams (الامتحانات العامة المستقلة)
  const [generalExams, setGeneralExams] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_general_exams');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'gen-exam-01',
        title: 'الامتحان العام الشامل — The Master Grand Assessment 2026',
        description: 'امتحان شامل لقياس مستوى الطلاب في القواعد والكلمات والمقالي. الدخول مرة واحدة فقط بكود شخصي.',
        stageId: 'sec-3',
        stageName: 'الصف الثالث الثانوي',
        timeMinutes: 45,
        totalMarks: 30,
        passingMarks: 18,
        status: 'published', // published | draft
        allowReviewAfter: true,
        showScoreImmediately: true,
        maxAttempts: 1, // Strictly single attempt
        updatedAt: '2026-08-20T10:00:00Z',
        questions: [
          {
            id: 'gq-1',
            type: 'mcq',
            question: 'By the time the teacher arrived, all the students ______ their homework.',
            points: 2,
            options: ['had finished', 'have finished', 'will finish', 'are finishing'],
            correctAnswer: 0,
            explanation: 'نستخدم الماضي التام (had finished) للحدث الذي وقع واكتمل قبل حدث آخر في الماضي.'
          },
          {
            id: 'gq-2',
            type: 'mcq',
            question: 'The criminal was arrested while he ______ to cross the border with forged papers.',
            points: 2,
            options: ['attempted', 'was attempting', 'has attempted', 'had attempted'],
            correctAnswer: 1,
            explanation: 'بعد while نستخدم الماضي المستمر للتعبير عن حدث كان مستمراً عندما قطعه حدث آخر.'
          },
          {
            id: 'gq-3',
            type: 'tf',
            question: 'Adjectives usually come after nouns in standard English grammar.',
            points: 2,
            options: ['صح (True)', 'خطأ (False)'],
            correctAnswer: 1,
            explanation: 'الصفات تأتي قبل الأسماء في اللغة الإنجليزية (Attributive Position).'
          },
          {
            id: 'gq-4',
            type: 'multi',
            question: 'Which of the following are relative pronouns used for persons? (Select all that apply)',
            points: 4,
            options: ['Who', 'Whom', 'Which', 'Whose'],
            correctAnswers: [0, 1, 3],
            explanation: 'الضمائر Who و Whom و Whose تستخدم للإشارة للعاقل، بينما Which لغير العاقل.'
          },
          {
            id: 'gq-essay-1',
            type: 'essay',
            question: 'Discuss in 3-5 sentences the impact of modern artificial intelligence on learning English as a foreign language.',
            points: 10,
            modelAnswer: 'The answer should evaluate both pros (interactive feedback, 24/7 practice) and cons (reliance without critical thinking), using clear grammar and transitions.',
            explanation: 'يقيم المستر الإجابة بناءً على دقة التراكيب اللغوية وترابط الأفكار وتنوع المفردات.'
          },
          {
            id: 'gq-short-1',
            type: 'short_answer',
            question: 'What is the term for a word that sounds the same as another word but has a different spelling and meaning? (One word)',
            points: 10,
            modelAnswer: 'homophone',
            explanation: 'A homophone is a word pronounced the same as another word but differing in meaning and spelling.'
          }
        ]
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_general_exams', JSON.stringify(generalExams));
    } catch (e) {}
  }, [generalExams]);

  // 11h. Personalized Student General Exam Codes (أكواد الامتحان العام المخصصة لكل طالب)
  const [generalExamCodes, setGeneralExamCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_general_exam_codes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        code: 'GEN-SEC3-STD101-7891',
        examId: 'gen-exam-01',
        examTitle: 'الامتحان العام الشامل — The Master Grand Assessment 2026',
        studentId: 'std-101',
        studentName: 'أحمد محمود كمال',
        studentPhone: '01012345678',
        stageId: 'sec-3',
        stageName: 'الصف الثالث الثانوي',
        isUsed: false,
        usedAt: null,
        score: null,
        createdAt: '2026-08-20T12:00:00Z',
        allowRetake: false
      },
      {
        code: 'GEN-SEC3-STD102-4523',
        examId: 'gen-exam-01',
        examTitle: 'الامتحان العام الشامل — The Master Grand Assessment 2026',
        studentId: 'std-102',
        studentName: 'سارة إبراهيم خليل',
        studentPhone: '01122334455',
        stageId: 'sec-3',
        stageName: 'الصف الثالث الثانوي',
        isUsed: true,
        usedAt: '2026-08-21T18:40:00Z',
        score: '28 / 30',
        createdAt: '2026-08-20T12:00:00Z',
        allowRetake: false
      },
      {
        code: 'GEN-SEC3-STD103-9182',
        examId: 'gen-exam-01',
        examTitle: 'الامتحان العام الشامل — The Master Grand Assessment 2026',
        studentId: 'std-103',
        studentName: 'عبدالله الشمري',
        studentPhone: '01233445566',
        stageId: 'sec-3',
        stageName: 'الصف الثالث الثانوي',
        isUsed: false,
        usedAt: null,
        score: null,
        createdAt: '2026-08-20T12:00:00Z',
        allowRetake: false
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_general_exam_codes', JSON.stringify(generalExamCodes));
    } catch (e) {}
  }, [generalExamCodes]);

  // 12. Announcements
  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem('ms_announcements');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: "ann-1",
        title: "تنبيه لطلاب الصف الثالث الثانوي: كويز مراجعة الوحدة الأولى متاح الآن ⚠️",
        content: "أبنائي وبناتي طلاب الثانوية العامة، تم رفع امتحان شامل على كلمات وقواعد Unit 1. لن يتم فتح المحاضرة الثالثة إلا بعد اجتياز الامتحان وحل واجب الكشكول. بالتوفيق يا أبطال!",
        date: "اليوم، 4:00 مساءً",
        author: "مستر مايكل شحاته",
        priority: "high"
      },
      {
        id: "ann-2",
        title: "جدول مذكرات The Master المطبوعة في السناتر والمكتبات 📚",
        content: "مذكرة The Master الشاملة متوفرة حالياً في جميع السناتر والمحافظات ومتاحة للتحميل بصيغة PDF عالية الدقة على المنصة.",
        date: "منذ يومين",
        author: "مستر مايكل شحاته",
        priority: "normal"
      }
    ];
  });

  // 13. Platform Staff & Authorized Administrators (نظام الإدارة الموحد وصلاحيات المدرسين)
  const defaultSuperAdmin = {
    id: 'admin-super-01',
    uid: 'teacher-admin',
    name: 'مستر مايكل شحاته (المالك الرئيسي)',
    email: 'mrmichaelshehata@gmail.com',
    phone: '01012345678',
    role: 'super_admin', // super_admin | admin | assistant
    roleLabel: 'المالك والمشرف العام 👑',
    permissions: {
      canManageLectures: true,
      canManageExams: true,
      canManageSubscriptions: true,
      canViewFinance: true,
      canManageCodes: true,
      canManageStaff: true,
      canExportBackup: true,
      canRestoreBackup: true
    },
    isActive: true,
    createdAt: '2026-08-01T00:00:00Z',
    lastActive: new Date().toISOString()
  };

  const [staffAdmins, setStaffAdmins] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_staff_admins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [defaultSuperAdmin];
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_staff_admins', JSON.stringify(staffAdmins));
    } catch (e) {}
  }, [staffAdmins]);

  // 14. Centralized Platform Audit Logs (سجلات الرقابة والتدقيق المستمر)
  const [platformAuditLogs, setPlatformAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_platform_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'audit-init-01',
        action: 'system_initialized',
        actionLabel: 'تهيئة نظام الإدارة الموحد 🛡️',
        entityType: 'platform',
        entityId: 'global',
        details: 'تم تفعيل بنية النظام الموحد المركزي وفصل ملكية المحتوى عن حسابات الأفراد.',
        performedByUid: 'teacher-admin',
        performedByName: 'النظام المركزي',
        timestamp: '2026-08-01T00:00:00Z'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('ms_platform_audit_logs', JSON.stringify(platformAuditLogs));
    } catch (e) {}
  }, [platformAuditLogs]);

  // Real-time Multi-Device Cloud Synchronization & Local Cache
  useEffect(() => {
    let isCancelled = false;

    // 1. RTDB Realtime Listeners (Instant sync across devices without delay)
    const unsubRtdbLectures = listenToRtdbNode('lectures', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data) {
        const cloudList = typeof data === 'object' ? Object.values(data) : [];
        setLectures(sanitizeLectures(cloudList));
      }
    });

    const unsubRtdbStudents = listenToRtdbNode('students', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data) {
        const cloudList = typeof data === 'object' ? Object.values(data) : [];
        setStudents(cloudList);
      }
    });

    const unsubRtdbProfile = listenToRtdbNode('teacherProfile', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data && typeof data === 'object') {
        const cleanAvatar = sanitizeAvatar(data.avatar);
        setTeacherProfile(prev => ({ ...prev, ...data, avatar: cleanAvatar }));
      }
    });

    const unsubRtdbStages = listenToRtdbNode('stages', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data) {
        const stageList = Array.isArray(data) ? data : Object.values(data);
        if (stageList.length > 0) setStages(stageList);
      }
    });

    const unsubRtdbBooklets = listenToRtdbNode('booklets', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data) {
        const cloudList = typeof data === 'object' ? Object.values(data) : [];
        setBooklets(sanitizeBooklets(cloudList));
      }
    });

    const unsubRtdbAchievers = listenToRtdbNode('achievers', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data) {
        const cloudList = typeof data === 'object' ? Object.values(data) : [];
        setTopAchievers(cloudList);
      }
    });

    const unsubRtdbCodes = listenToRtdbNode('codes', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data) {
        const cloudList = typeof data === 'object' ? Object.values(data) : [];
        setAccessCodes(cloudList);
      }
    });

    const unsubRtdbAnnouncements = listenToRtdbNode('announcements', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data) {
        const cloudList = typeof data === 'object' ? Object.values(data) : [];
        setAnnouncements(cloudList);
      }
    });

    const unsubRtdbGeneralExams = listenToRtdbNode('generalExams', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data) {
        const cloudList = typeof data === 'object' ? Object.values(data) : [];
        if (cloudList.length > 0) setGeneralExams(cloudList);
      }
    });

    const unsubRtdbGeneralCodes = listenToRtdbNode('generalExamCodes', ({ exists, data }) => {
      if (isCancelled) return;
      if (exists && data) {
        const cloudList = typeof data === 'object' ? Object.values(data) : [];
        if (cloudList.length > 0) setGeneralExamCodes(cloudList);
      }
    });

    // 2. Listen to Firestore collections as secondary backup
    const unsubLectures = listenToLectures((cloudLectures) => {
      if (isCancelled || !Array.isArray(cloudLectures) || cloudLectures.length === 0) return;
      setLectures(sanitizeLectures(cloudLectures));
    });

    const unsubStudents = listenToStudents((cloudStudents) => {
      if (isCancelled || !Array.isArray(cloudStudents) || cloudStudents.length === 0) return;
      setStudents(cloudStudents);
    });

    const unsubAdminUsers = listenToAdminUsers((cloudAdmins) => {
      if (isCancelled || !Array.isArray(cloudAdmins) || cloudAdmins.length === 0) return;
      setStaffAdmins(cloudAdmins);
    });

    const unsubAuditLogs = listenToAuditLogs((cloudLogs) => {
      if (isCancelled || !Array.isArray(cloudLogs) || cloudLogs.length === 0) return;
      setPlatformAuditLogs(cloudLogs);
    });

    // 3. Rehydrate from local IndexedDB if available and state is empty
    loadCollectionFromLocal(STORES.LECTURES).then(localLectures => {
      if (!isCancelled && Array.isArray(localLectures) && localLectures.length > 0) {
        setLectures(prev => (prev.length === 0 ? sanitizeLectures(localLectures) : prev));
      }
    }).catch(() => {});

    return () => {
      isCancelled = true;
      if (typeof unsubRtdbLectures === 'function') unsubRtdbLectures();
      if (typeof unsubRtdbStudents === 'function') unsubRtdbStudents();
      if (typeof unsubRtdbProfile === 'function') unsubRtdbProfile();
      if (typeof unsubRtdbStages === 'function') unsubRtdbStages();
      if (typeof unsubRtdbBooklets === 'function') unsubRtdbBooklets();
      if (typeof unsubRtdbAchievers === 'function') unsubRtdbAchievers();
      if (typeof unsubRtdbCodes === 'function') unsubRtdbCodes();
      if (typeof unsubRtdbAnnouncements === 'function') unsubRtdbAnnouncements();
      if (typeof unsubLectures === 'function') unsubLectures();
      if (typeof unsubStudents === 'function') unsubStudents();
      if (typeof unsubAdminUsers === 'function') unsubAdminUsers();
      if (typeof unsubAuditLogs === 'function') unsubAuditLogs();
    };
  }, []);

  // Sync state safely to localStorage & IndexedDB on every change
  useEffect(() => {
    try {
      localStorage.setItem('ms_teacher_profile', JSON.stringify(teacherProfile));
      localStorage.setItem('ms_stages', JSON.stringify(stages));
      localStorage.setItem('ms_lectures', JSON.stringify(lectures));
      localStorage.setItem('ms_booklets', JSON.stringify(booklets));
      localStorage.setItem('ms_achievers', JSON.stringify(topAchievers));
      localStorage.setItem('ms_codes', JSON.stringify(accessCodes));
      localStorage.setItem('ms_students_rich', JSON.stringify(students));
      localStorage.setItem('ms_unlocked_lectures', JSON.stringify(unlockedLectureIds));
      localStorage.setItem('ms_completed_lectures', JSON.stringify(completedLectureIds));
      localStorage.setItem('ms_homeworks', JSON.stringify(homeworkSubmissions));
      localStorage.setItem('ms_exam_results', JSON.stringify(examResults));
      localStorage.setItem('ms_video_watch_progress', JSON.stringify(videoWatchProgress));
      localStorage.setItem('ms_manual_overrides', JSON.stringify(manualOverrides));
      localStorage.setItem('ms_announcements', JSON.stringify(announcements));
    } catch (e) {
      console.warn('localStorage sync notice:', e.message);
    }

    // Persist to IndexedDB safely in background
    try {
      if (Array.isArray(lectures) && lectures.length > 0) {
        persistCollectionLocally(STORES.LECTURES, lectures).catch(() => {});
      }
      if (Array.isArray(students) && students.length > 0) {
        persistCollectionLocally(STORES.STUDENTS, students).catch(() => {});
      }
    } catch (idbErr) {
      console.warn('IndexedDB background sync notice:', idbErr);
    }
  }, [teacherProfile, stages, lectures, booklets, topAchievers, accessCodes, students, unlockedLectureIds, completedLectureIds, homeworkSubmissions, examResults, videoWatchProgress, manualOverrides, announcements]);

  // Add New Student
  const addStudent = (studentData) => {
    const studentCount = students.length + 1;
    const stagePrefix = studentData.stageId?.includes('3') ? 'SEC3' : studentData.stageId?.includes('2') ? 'SEC2' : 'SEC1';
    const generatedCode = `MS-${stagePrefix}-${100 + studentCount}`;
    const monthlyFee = Number(studentData.monthlyFee || 250);
    const paidAmount = Number(studentData.paidAmount || 0);
    const dueAmount = Math.max(0, monthlyFee - paidAmount);
    const paymentStatus = paidAmount >= monthlyFee ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    const newStudent = {
      id: `std-${Date.now()}`,
      code: generatedCode,
      name: studentData.name,
      phone: studentData.phone,
      parentPhone: studentData.parentPhone,
      parentName: studentData.parentName || `ولي أمر ${studentData.name}`,
      stageId: studentData.stageId || 'sec-3',
      stageName: stages.find(s => s.id === studentData.stageId)?.name || 'الصف الثالث الثانوي',
      groupType: studentData.groupType || 'center',
      centerName: studentData.centerName || 'سنتر النخبة',
      avatar: studentData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      joinedDate: new Date().toISOString().split('T')[0],
      isActive: true,
      finance: {
        monthlyFee,
        paidAmount,
        dueAmount,
        paymentStatus,
        lastPaymentDate: paidAmount > 0 ? new Date().toISOString().split('T')[0] : null,
        paymentMethod: studentData.paymentMethod || 'كاش بالسنتر',
        transactionId: studentData.transactionId || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        receiptNumber: `REC-2026-${String(studentCount).padStart(3, '0')}`
      },
      attendanceRate: '100%',
      unlockedLectureIds: ['lec-s3-01', 'lec-s3-02'],
      completedLectures: [],
      homeworkStatus: {},
      examScores: {},
      totalXp: 500,
      rank: studentCount,
      pronunciationScore: '90%',
      teacherNotes: studentData.teacherNotes || 'طالب جديد مسجل بالمنصة'
    };

    setStudents(prev => [newStudent, ...prev]);
    // Sync to Firestore Cloud
    saveStudentToFirestore(newStudent);
    addToast(`تمت إضافة الطالب (${newStudent.name}) وتوليد كود: ${newStudent.code} بنجاح! 👨‍🎓`, 'success');
    return newStudent;
  };

  const updateStudent = (studentId, updatedFields) => {
    setStudents(prev => prev.map(std => {
      if (std.id === studentId) {
        const updated = { ...std, ...updatedFields };
        saveStudentToFirestore(updated);
        return updated;
      }
      return std;
    }));
    addToast('تم تحديث بيانات الطالب ومستواه ومزامنته بنجاح ✓', 'success');
  };

  const deleteStudent = async (studentId) => {
    const updated = students.filter(std => std.id !== studentId);
    setStudents(updated);
    await deleteStudentFromFirestore(studentId);
    await persistCollectionLocally(STORES.STUDENTS, updated);
    addToast('تم حذف الطالب من سجلات المنصة 🗑️', 'info');
  };

  const toggleStudentStatus = (studentId) => {
    setStudents(prev => prev.map(std => {
      if (std.id === studentId) {
        const nextState = !std.isActive;
        const updated = { ...std, isActive: nextState };
        saveStudentToFirestore(updated);
        addToast(nextState ? `تم تفعيل حساب الطالب (${std.name}) ✓` : `تم تجميد حساب الطالب (${std.name}) 🔒`, nextState ? 'success' : 'error');
        return updated;
      }
      return std;
    }));
  };

  const recordPayment = (studentId, amount, paymentMethod, notes = '') => {
    setStudents(prev => prev.map(std => {
      if (std.id === studentId) {
        const numAmount = Number(amount);
        const newPaid = (std.finance.paidAmount || 0) + numAmount;
        const newDue = Math.max(0, (std.finance.monthlyFee || 250) - newPaid);
        const newStatus = newPaid >= (std.finance.monthlyFee || 250) ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

        const updatedFinance = {
          ...std.finance,
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus: newStatus,
          lastPaymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: paymentMethod || 'فودافون كاش',
          transactionId: `TX-${Math.floor(100000 + Math.random() * 900000)}`
        };

        const updatedStudent = { ...std, finance: updatedFinance, teacherNotes: notes || std.teacherNotes };
        saveStudentToFirestore(updatedStudent);

        addToast(`تم تسجيل سداد (${numAmount} ج.م) وحفظ السجل المالي بنجاح! 💵`, 'success');
        return updatedStudent;
      }
      return std;
    }));
  };

  const generatePaymentReminderWhatsApp = (student) => {
    return `السلام عليكم ورحمة الله وبركاته،\nتحية طيبة من إدارة منصة *${teacherProfile.name} (The Master)* 🇬🇧\n\nنود تذكير ولي أمر الطالب: *${student.name}*\nبأن هناك مصاريف دراسية مستحقة لشهر الحصص الحالي:\n━━━━━━━━━━━━━\n📌 المرحلة: ${student.stageName}\n📌 المبلغ المطلوب سداده: *${student.finance?.dueAmount || 0} ج.م*\n📌 طرق الدفع المتاحة: فودافون كاش أو إنستاباي أو كاش بالسنتر\n━━━━━━━━━━━━━\nشاكرين ومقدرين حسن تعاونكم وحرصكم الدائم على استمرار تفوق الطالب ✨`;
  };

  const generateStudentReceiptWhatsApp = (student) => {
    return `السلام عليكم ورحمة الله وبركاته،\nإيصال استلام مصاريف دراسية رسمي من منصة *${teacherProfile.name}* 🧾\n━━━━━━━━━━━━━\n📌 اسم الطالب: *${student.name}*\n📌 كود الطالب: ${student.code}\n📌 رقم الإيصال: ${student.finance?.receiptNumber || 'REC-2026'}\n📌 المبلغ المسدد: *${student.finance?.paidAmount || 0} ج.م*\n📌 طريقة الدفع: ${student.finance?.paymentMethod}\n📌 التاريخ: ${student.finance?.lastPaymentDate || 'اليوم'}\n📌 المتبقي: ${student.finance?.dueAmount || 0} ج.م\n━━━━━━━━━━━━━\nنتمنى لابننا الغالي دوام التفوق والنجاح! 🌟`;
  };

  const updateTeacherProfile = (updatedFields) => {
    const updated = { ...teacherProfile, ...updatedFields };
    setTeacherProfile(updated);
    syncTeacherProfile(updated);
    addToast(`تم حفظ وتحديث بيانات ${teacherProfile.name} بنجاح ✓`, 'success');
  };

  const changeTeacherPassword = async (newPassword) => {
    if (!newPassword || newPassword.trim().length === 0) {
      addToast('يرجى إدخال كلمة مرور صالحة', 'error');
      return { success: false, error: 'كلمة المرور فارغة' };
    }
    const cleanPass = newPassword.trim();
    // 1. Hash and save master password securely (PBKDF2-SHA256 with salt)
    await saveMasterPassword(cleanPass);

    // 2. Update local state and profile without leaking plaintext
    const { password: _, ...safeProfile } = teacherProfile;
    const updated = { ...safeProfile, hasCustomPin: true, pinUpdatedAt: new Date().toISOString() };
    setTeacherProfile(updated);
    try {
      localStorage.setItem('ms_teacher_profile', JSON.stringify(updated));
    } catch (e) {}
    await syncTeacherProfile(updated);
    addToast(`تم تشفير وحفظ كلمة مرور المستر بنجاح بتقنية PBKDF2 سحابياً! 🔐`, 'success');
    return { success: true };
  };

  const uploadNewLecture = async (lectureData) => {
    const isFree = Boolean(lectureData.isFree);
    const cleanVideoUrl = (lectureData.videoUrl && typeof lectureData.videoUrl === 'string' && !lectureData.videoUrl.startsWith('blob:'))
      ? lectureData.videoUrl
      : '';
    const creatorUid = currentUser?.uid || currentUser?.id || 'teacher-admin';
    const creatorName = currentUser?.name || teacherProfile.name || 'مستر مايكل شحاته';

    const newLec = {
      ...lectureData,
      stageId: lectureData.stageId || 'sec-3',
      sectionId: lectureData.sectionId || '',
      videoUrl: cleanVideoUrl,
      id: lectureData.id || `lec-${Date.now()}`,
      viewsCount: 1,
      order: lectures.length + 1,
      isFree,
      price: lectureData.price || (isFree ? 'مجاناً' : '70 ج.م'),
      isLocked: !isFree,
      isPermanent: true,
      isDeleted: false,
      createdByUid: creatorUid,
      createdByName: creatorName,
      createdAt: new Date().toISOString()
    };

    // 1. Instantly update UI state
    setLectures(prev => [newLec, ...prev]);

    // Automatically unlock if free OR if this stage has an active subscription
    const canonStage = normalizeStageId(newLec.stageId);
    const stageSub = getSubscriptionStatus(canonStage);
    const shouldUnlock = isFree || (stageSub.isSubscribed && !stageSub.isExpired);

    if (shouldUnlock) {
      setUnlockedLectureIds(prev => Array.from(new Set([...prev, newLec.id])));
      try {
        const activeUnlocks = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
        activeUnlocks[newLec.id] = {
          ...(stageSub || {}),
          targetId: newLec.id,
          targetTitle: newLec.title,
          fromStage: canonStage
        };
        localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(activeUnlocks));
        const savedIds = JSON.parse(localStorage.getItem('ms_unlocked_lectures') || '[]');
        localStorage.setItem('ms_unlocked_lectures', JSON.stringify(Array.from(new Set([...savedIds, newLec.id]))));
      } catch (e) {}
    }

    // 2. Persist permanently into local IndexedDB
    await persistCollectionLocally(STORES.LECTURES, [newLec]);

    // 3. Persist permanently into Cloud Firestore & RTDB
    await saveLectureToFirestore(newLec);

    // 4. Record Centralized Audit Trail
    logPlatformAuditAction({
      action: 'lecture_created',
      actionLabel: 'إضافة محاضرة جديدة 🎥',
      entityType: 'lecture',
      entityId: newLec.id,
      details: `تم رفع ونشر محاضرة: ${newLec.title} (بواسطة: ${creatorName})`,
      performedByUid: creatorUid,
      performedByName: creatorName
    }).catch(() => {});

    addToast(`تم رفع ونشر المحاضرة (${newLec.title}) بنجاح! 🚀 (${isFree ? 'متاحة مجاناً' : 'باشتراك'})`, 'success');
    return newLec;
  };

  const updateLecture = async (lectureId, updatedData) => {
    if (!lectureId) return;
    let updatedLec = null;
    const modifierUid = currentUser?.uid || currentUser?.id || 'teacher-admin';
    const modifierName = currentUser?.name || teacherProfile.name || 'مستر مايكل شحاته';

    setLectures(prev => {
      const updated = prev.map(lec => {
        if (lec.id === lectureId) {
          updatedLec = {
            ...lec,
            ...updatedData,
            updatedByUid: modifierUid,
            updatedByName: modifierName,
            updatedAt: new Date().toISOString()
          };
          return updatedLec;
        }
        return lec;
      });
      try {
        localStorage.setItem('ms_lectures', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (updatedLec) {
      await persistCollectionLocally(STORES.LECTURES, [updatedLec]);
      await saveLectureToFirestore(updatedLec);

      logPlatformAuditAction({
        action: 'lecture_updated',
        actionLabel: 'تعديل محاضرة ✏️',
        entityType: 'lecture',
        entityId: updatedLec.id,
        details: `تم تعديل المحاضرة أو امتحانها: ${updatedLec.title}`,
        performedByUid: modifierUid,
        performedByName: modifierName
      }).catch(() => {});
    }

    if (updatedData.exam) {
      setExamsData(prev => {
        const updatedExams = { ...prev, [lectureId]: updatedData.exam };
        try {
          localStorage.setItem('ms_exams_data', JSON.stringify(updatedExams));
        } catch (e) {}
        return updatedExams;
      });
    }

    addToast(`تم حفظ وتحديث المحاضرة (${updatedLec?.title || ''}) وامتحانها بنجاح! 💾`, 'success');
    return updatedLec;
  };

  // Safe Deletion: Soft delete flags the lecture so students cannot see it, but data is 100% recoverable
  const deleteLecture = async (lectureId, hardDelete = false) => {
    const targetLecture = lectures.find(l => l.id === lectureId);
    if (!targetLecture) return;
    const modifierUid = currentUser?.uid || currentUser?.id || 'teacher-admin';
    const modifierName = currentUser?.name || teacherProfile.name || 'مستر مايكل شحاته';

    // Strict Owner-Only Hard Deletion Guard
    const isSuperOwner = (
      role === 'instructor' ||
      currentUser?.role === 'super_admin' || 
      currentAdminUser?.role === 'super_admin' || 
      currentUser?.email === 'mrmichaelshehata@gmail.com' ||
      currentUser?.uid === 'teacher-admin' ||
      Boolean(verifyAdminSession()?.isValid)
    );
    let effectiveHardDelete = Boolean(hardDelete);
    if (effectiveHardDelete && !isSuperOwner) {
      addToast('عذراً! الحذف النهائي محصور للمالك الرئيسي فقط 🛡️ تم نقل المحاضرة لسلة المهملات بأمان.', 'warning', 6000);
      effectiveHardDelete = false;
    }

    if (effectiveHardDelete) {
      const updated = lectures.filter(l => l.id !== lectureId);
      setLectures(updated);
      try {
        localStorage.setItem('ms_lectures', JSON.stringify(updated));
      } catch (e) {}
      await deleteLectureFromFirestore(lectureId, targetLecture?.stageId);
      if (targetLecture?.localMediaKey) {
        await deleteMediaPermanently(targetLecture.localMediaKey);
      }
      await persistCollectionLocally(STORES.LECTURES, updated);
      logPlatformAuditAction({
        action: 'lecture_hard_deleted',
        actionLabel: 'حذف نهائي لمحاضرة 🗑️',
        entityType: 'lecture',
        entityId: lectureId,
        details: `تم الحذف النهائي للمحاضرة (${targetLecture.title})`,
        performedByUid: modifierUid,
        performedByName: modifierName
      }).catch(() => {});
      addToast('تم حذف المحاضرة من المنصة نهائياً 🗑️', 'info');
    } else {
      // Soft Delete: Preserves content and metadata on platform level
      const updated = lectures.map(l => {
        if (l.id === lectureId) {
          return {
            ...l,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedByUid: modifierUid,
            deletedByName: modifierName
          };
        }
        return l;
      });
      setLectures(updated);
      try {
        localStorage.setItem('ms_lectures', JSON.stringify(updated));
      } catch (e) {}
      const softLec = updated.find(l => l.id === lectureId);
      if (softLec) {
        await saveLectureToFirestore(softLec);
      }
      logPlatformAuditAction({
        action: 'lecture_soft_deleted',
        actionLabel: 'نقل محاضرة لسلة المهملات 📦',
        entityType: 'lecture',
        entityId: lectureId,
        details: `تم نقل المحاضرة (${targetLecture.title}) إلى المحذوفات مع إمكانية استعادتها فوراً`,
        performedByUid: modifierUid,
        performedByName: modifierName
      }).catch(() => {});
      addToast(`تم نقل المحاضرة (${targetLecture.title}) إلى سلة المهملات مع الحفاظ الكامل على بياناتها 📦`, 'info');
    }
  };

  // Restore Soft-Deleted Lecture
  const restoreLecture = async (lectureId) => {
    const targetLecture = lectures.find(l => l.id === lectureId);
    if (!targetLecture) return;
    const modifierUid = currentUser?.uid || currentUser?.id || 'teacher-admin';
    const modifierName = currentUser?.name || teacherProfile.name || 'مستر مايكل شحاته';

    const updated = lectures.map(l => {
      if (l.id === lectureId) {
        const { isDeleted, deletedAt, deletedByUid, deletedByName, ...rest } = l;
        return {
          ...rest,
          isDeleted: false,
          restoredAt: new Date().toISOString(),
          restoredByName: modifierName
        };
      }
      return l;
    });
    setLectures(updated);
    const restoredLec = updated.find(l => l.id === lectureId);
    if (restoredLec) {
      await saveLectureToFirestore(restoredLec);
    }
    logPlatformAuditAction({
      action: 'lecture_restored',
      actionLabel: 'استعادة محاضرة محذوفة ♻️',
      entityType: 'lecture',
      entityId: lectureId,
      details: `تمت استعادة المحاضرة (${targetLecture.title}) بنجاح`,
      performedByUid: modifierUid,
      performedByName: modifierName
    }).catch(() => {});
    addToast(`تمت استعادة المحاضرة (${targetLecture.title}) بنجاح ونشرها مجدداً! ✨`, 'success');
  };

  const addStage = async (stageData) => {
    const newStage = { ...stageData, id: `stage-${Date.now()}`, lecturesCount: 0, studentsCount: 0 };
    const updated = [...stages, newStage];
    setStages(updated);
    await syncStagesToCloud(updated);
    addToast(`تمت إضافة المرحلة (${newStage.name}) بنجاح 🎓`, 'success');
  };

  const deleteStage = async (stageId) => {
    const updated = stages.filter(s => s.id !== stageId);
    setStages(updated);
    await syncStagesToCloud(updated);
    addToast('تم حذف المرحلة الدراسية بنجاح 🗑️', 'info');
  };

  const addBooklet = async (bookletData) => {
    const newBk = { 
      ...bookletData, 
      id: `bk-${Date.now()}`,
      format: bookletData.format || 'PDF عالي الجودة للطباعة',
      size: bookletData.size || '12 MB',
      downloadUrl: bookletData.downloadUrl || '#'
    };
    setBooklets(prev => [newBk, ...prev]);
    await syncBookletToCloud(newBk);
    addToast(`تمت إضافة المذكرة (${newBk.title}) وتأمينها بنجاح 📚`, 'success');
  };

  const deleteBooklet = async (bookletId) => {
    setBooklets(prev => prev.filter(b => b.id !== bookletId));
    await deleteBookletFromCloud(bookletId);
    addToast('تم حذف المذكرة بنجاح 🗑️', 'info');
  };

  const addAchiever = async (achieverData) => {
    const newAch = { 
      ...achieverData, 
      id: `ach-${Date.now()}`, 
      rank: topAchievers.length + 1,
      stageId: achieverData.stageId || 'sec-3',
      stageName: achieverData.stageName || 'الصف الثالث الثانوي'
    };
    setTopAchievers(prev => [...prev, newAch]);
    await syncAchieverToCloud(newAch);
    addToast(`تمت إضافة الطالب (${newAch.name}) إلى لوحة الشرف 🏆`, 'success');
  };

  const deleteAchiever = async (achieverId) => {
    setTopAchievers(prev => prev.filter(a => a.id !== achieverId));
    await deleteAchieverFromCloud(achieverId);
    addToast('تم حذف الطالب من لوحة الشرف 🗑️', 'info');
  };

  const addSection = (sectionData) => {
    const newSec = {
      ...sectionData,
      id: sectionData.id || `sec-${Date.now()}`,
      order: sections.length + 1,
      isVisible: sectionData.isVisible !== undefined ? sectionData.isVisible : true,
      price: Number(sectionData.price) || 0,
      createdAt: new Date().toISOString()
    };
    const updated = [...sections, newSec];
    setSections(updated);
    try { localStorage.setItem('ms_sections', JSON.stringify(updated)); } catch (e) {}
    addToast(`تمت إضافة ${newSec.type === 'course' ? 'الكورس' : 'الشهر'} (${newSec.title}) بنجاح 📁`, 'success');
    return newSec;
  };

  const updateSection = (sectionId, updatedFields) => {
    const updated = sections.map(s => s.id === sectionId ? { ...s, ...updatedFields } : s);
    setSections(updated);
    try { localStorage.setItem('ms_sections', JSON.stringify(updated)); } catch (e) {}
    addToast('تم تحديث بيانات القسم بنجاح ✓', 'success');
  };

  const deleteSection = (sectionId) => {
    const updated = sections.filter(s => s.id !== sectionId);
    setSections(updated);
    try { localStorage.setItem('ms_sections', JSON.stringify(updated)); } catch (e) {}
    // Reassign any lectures in this section so they are never lost
    setLectures(prev => prev.map(l => l.sectionId === sectionId ? { ...l, sectionId: '' } : l));
    addToast('تم حذف القسم بنجاح (مع الحفاظ على المحاضرات) 🗑️', 'info');
  };

  const moveLectureToSection = (lectureId, targetSectionId) => {
    const updated = lectures.map(l => l.id === lectureId ? { ...l, sectionId: targetSectionId } : l);
    setLectures(updated);
    try { localStorage.setItem('ms_lectures', JSON.stringify(updated)); } catch (e) {}
    addToast('تم نقل المحاضرة إلى القسم الجديد بنجاح 🔄', 'success');
  };

  const recordTransaction = (txData) => {
    if (!txData) return null;
    const txId = txData.id || `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    if (transactions.some(t => t.id === txId || (txData.codeUsed && t.codeUsed === txData.codeUsed && t.userId === txData.userId))) {
      return null;
    }
    const newTx = {
      ...txData,
      id: txId,
      amount: Number(txData.amount) || 0,
      isGift: Boolean(txData.isGift),
      createdAt: txData.createdAt || new Date().toISOString(),
      status: txData.status || 'completed'
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    try { localStorage.setItem('ms_transactions', JSON.stringify(updated)); } catch (e) {}
    return newTx;
  };

  const toggleCodeStatus = async (codeStr) => {
    const clean = codeStr.toUpperCase().trim();
    let newStatus = true;
    const updated = accessCodes.map(c => {
      if (c.code.toUpperCase() === clean) {
        newStatus = c.isActive === false ? true : false;
        return { ...c, isActive: newStatus };
      }
      return c;
    });
    setAccessCodes(updated);
    try { localStorage.setItem('ms_codes', JSON.stringify(updated)); } catch (e) {}
    addToast(`تم ${newStatus ? 'تفعيل' : 'إيقاف'} الكود بنجاح 🔒`, 'info');
  };

  const generateNewCode = async (param1, param2, param3, param4, param5, param6) => {
    let opts = {};
    if (typeof param1 === 'object' && param1 !== null) {
      opts = param1;
    } else {
      opts = {
        stageName: param1 || 'الصف الثالث الثانوي',
        targetTitle: param2 || 'اشتراك المحاضرة',
        targetId: param3 || 'lec-s3-01',
        price: param4 || '70 ج.م',
        codeType: param5 || 'lecture',
        durationDays: param6 || 30
      };
    }

    const {
      stageName = 'الصف الثالث الثانوي',
      stageId = 'sec-3',
      targetTitle = 'اشتراك المحتوى',
      targetId = '',
      codeType = 'month',
      price = 180,
      durationDays = 30,
      expiryDate = '',
      maxUses = 1,
      isGift = false,
      customCode = '',
      bundleItems = []
    } = opts;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const typePrefix = codeType === 'month' ? 'MTH' : codeType === 'course' ? 'CRS' : codeType === 'bundle' ? 'BDL' : 'LEC';
    const stagePrefix = stageName.includes('ثالث') ? 'SEC3' : stageName.includes('ثان') ? 'SEC2' : stageName.includes('أول') ? 'SEC1' : 'GEN';
    const newCodeStr = (customCode && customCode.trim()) ? customCode.trim().toUpperCase() : `MS-${stagePrefix}-${typePrefix}-${randomSuffix}`;
    const days = Number(durationDays) || 30;

    const newCodeObj = {
      code: newCodeStr,
      type: codeType,
      codeType,
      targetId: targetId || (codeType === 'month' ? 'sec3-month-1' : 'lec-s3-01'),
      targetTitle: targetTitle || 'اشتراك المحتوى',
      stage: stageName,
      stageId: stageId || 'sec-3',
      price: isGift ? 'مجاني / هدية' : (typeof price === 'number' ? `${price} ج.م` : price),
      rawPrice: isGift ? 0 : (Number(String(price).replace(/[^0-9.]/g, '')) || 0),
      durationDays: days,
      durationLabel: days === 7 ? '7 أيام (أسبوع)' : days === 15 ? '15 يوم' : days === 30 ? 'شهر (30 يوم)' : days === 60 ? 'شهرين (60 يوم)' : days === 120 ? 'تيرم كامل (4 شهور)' : days === 365 ? 'سنة كاملة (365 يوم)' : `${days} يوم`,
      isSingleUse: Number(maxUses) === 1,
      maxUses: Number(maxUses) || 1,
      usedCount: 0,
      isUsed: false,
      isActive: true,
      isGift: Boolean(isGift),
      expiryDate: expiryDate || null,
      bundleItems: Array.isArray(bundleItems) ? bundleItems : [],
      usedBy: null,
      usedByList: [],
      usedAt: null,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAccessCodes(prev => [newCodeObj, ...prev]);
    await syncCodeToCloud(newCodeObj);
    addToast(`تم إنشاء كود الشحن الجديد: ${newCodeStr} (${newCodeObj.targetTitle}) بنجاح 📋`, 'success');
    return newCodeObj;
  };

  const deleteCode = async (codeStr) => {
    setAccessCodes(prev => prev.filter(c => c.code !== codeStr));
    await deleteCodeFromCloud(codeStr);
    addToast(`تم حذف كود الشحن (${codeStr}) 🗑️`, 'info');
  };

  const postAnnouncement = async (title, content, priority = 'normal') => {
    const newAnn = {
      id: `ann-${Date.now()}`,
      title,
      content,
      date: 'الآن',
      author: teacherProfile.name,
      priority
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    await syncAnnouncementToCloud(newAnn);
    addToast('تم إرسال التنبيه العام لجميع الطلاب فوراً 📢', 'success');
  };

  const deleteAnnouncement = async (annId) => {
    setAnnouncements(prev => prev.filter(a => a.id !== annId));
    await deleteAnnouncementFromCloud(annId);
    addToast('تم حذف التنبيه 🗑️', 'info');
  };

  const resetToFactoryDefaults = () => {
    localStorage.clear();
    setTeacherProfile(initialTeacherProfile);
    setStages(initialTeacherProfile.stages);
    setLectures(initialLectures);
    setBooklets(initialBookletsList);
    setTopAchievers(initialTopAchievers);
    setAccessCodes(initialAccessCodes);
    setStudents(richInitialStudents);
    addToast('تمت إعادة ضبط البيانات الافتراضية بنجاح 🔄', 'info');
  };

  const getSubscriptionStatus = (targetId) => {
    try {
      if (!targetId) return { isSubscribed: false, isExpired: false, status: 'none' };

      // RULE 1: Subscription belongs ONLY to current Firebase Auth UID
      const currentUid = currentUser?.uid || currentUser?.id;
      if (!currentUser || !currentUid || currentUid === 'guest') {
        return { isSubscribed: false, isExpired: false, status: 'none' };
      }

      const now = Date.now();
      let sub = null;
      const canonId = normalizeStageId(targetId);

      // Primary & Only Source of Truth: currentUser.subscriptions strictly for currentUid
      if (currentUser?.subscriptions && typeof currentUser.subscriptions === 'object') {
        const userSubs = currentUser.subscriptions;
        
        // Exact match
        if (userSubs[targetId] && (!userSubs[targetId].userId || userSubs[targetId].userId === currentUid)) {
          sub = userSubs[targetId];
        } 
        // Canonical stage match (e.g. sec-3)
        else if (userSubs[canonId] && (!userSubs[canonId].userId || userSubs[canonId].userId === currentUid)) {
          sub = userSubs[canonId];
        } 
        // All-access VIP subscription covers everything
        else if (userSubs['all-access'] && (!userSubs['all-access'].userId || userSubs['all-access'].userId === currentUid)) {
          sub = userSubs['all-access'];
        } 
        // Search through all active subscriptions to see if any covers this stage
        else {
          for (const key of Object.keys(userSubs)) {
            const currentSub = userSubs[key];
            if (!currentSub) continue;
            if (currentSub.userId && currentSub.userId !== currentUid) continue;
            
            const normalizedKey = normalizeStageId(key);
            const normalizedSubStage = normalizeStageId(currentSub.stageId || currentSub.courseId || currentSub.targetId);
            
            if (normalizedKey === canonId || normalizedSubStage === canonId || normalizedKey === 'all-access' || normalizedSubStage === 'all-access') {
              sub = currentSub;
              break;
            }
          }
        }

        // If targetId is a lecture ID, check if its parent section or stage is subscribed
        if (!sub && (targetId.startsWith('lec-') || (lectures || []).some(l => l.id === targetId))) {
          const foundLec = (lectures || []).find(l => l.id === targetId);
          if (foundLec) {
            if (foundLec.sectionId && userSubs[foundLec.sectionId] && (!userSubs[foundLec.sectionId].userId || userSubs[foundLec.sectionId].userId === currentUid)) {
              sub = userSubs[foundLec.sectionId];
            } else if (foundLec.stageId) {
              const parentStageCanon = normalizeStageId(foundLec.stageId);
              if (userSubs[foundLec.stageId] && (!userSubs[foundLec.stageId].userId || userSubs[foundLec.stageId].userId === currentUid)) {
                sub = userSubs[foundLec.stageId];
              } else if (userSubs[parentStageCanon] && (!userSubs[parentStageCanon].userId || userSubs[parentStageCanon].userId === currentUid)) {
                sub = userSubs[parentStageCanon];
              }
            }
          }
        }
      }

      // Check UID-validated local cache ONLY if ms_unlocked_uid matches currentUid
      if (!sub) {
        try {
          const cachedUid = localStorage.getItem('ms_unlocked_uid');
          if (cachedUid && cachedUid === currentUid) {
            const expiryDict = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
            const candidate = expiryDict[targetId] || expiryDict[canonId] || expiryDict['all-access'];
            if (candidate && (!candidate.userId || candidate.userId === currentUid)) {
              sub = candidate;
            }
          }
        } catch (e) {}
      }

      const expiryStr = sub?.expirationDate || sub?.expiresAt;
      if (!sub || !expiryStr) {
        return { isSubscribed: false, isExpired: false, status: 'none' };
      }

      const expiresTime = new Date(expiryStr).getTime();
      const diffMs = expiresTime - now;
      const expiresDate = new Date(expiryStr);
      const expiresAtFormatted = expiresDate.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const startDateStr = sub.startDate || sub.activatedAt || '';
      const startDateFormatted = startDateStr ? new Date(startDateStr).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '';

      // Account Freeze Check:
      if (currentUser?.isFrozen === true || sub.isFrozen === true) {
        return {
          isSubscribed: false,
          isFrozen: true,
          status: 'frozen',
          reason: currentUser?.freezeReason || sub.freezeReason || 'تم إيقاف هذا الحساب بالكامل من قبل إدارة المنصة 🔒',
          startDate: startDateStr,
          startDateFormatted,
          expirationDate: expiryStr,
          expiresAt: expiryStr,
          expiresAtFormatted,
          targetTitle: sub.targetTitle || '',
          targetId: sub.targetId || targetId
        };
      }

      // Paused Subscription Check:
      if (sub.status === 'paused' || sub.isPaused === true) {
        return {
          isSubscribed: false,
          isPaused: true,
          status: 'paused',
          reason: sub.pauseReason || 'تم إيقاف الاشتراك مؤقتاً من قِبل إدارة المنصة 🔒',
          startDate: startDateStr,
          startDateFormatted,
          expirationDate: expiryStr,
          expiresAt: expiryStr,
          expiresAtFormatted,
          targetTitle: sub.targetTitle || '',
          targetId: sub.targetId || targetId
        };
      }

      // Cancelled Subscription Check:
      if (sub.status === 'cancelled' || sub.isCancelled === true) {
        return {
          isSubscribed: false,
          isCancelled: true,
          status: 'cancelled',
          reason: sub.cancelReason || 'تم إلغاء هذا الاشتراك نهائياً من قِبل الإدارة',
          startDate: startDateStr,
          startDateFormatted,
          expirationDate: expiryStr,
          expiresAt: expiryStr,
          expiresAtFormatted,
          targetTitle: sub.targetTitle || '',
          targetId: sub.targetId || targetId
        };
      }

      // Expired: currentDate >= expiresAt
      if (diffMs <= 0) {
        return {
          isSubscribed: false,
          isExpired: true,
          status: 'expired',
          daysRemaining: 0,
          hoursRemaining: 0,
          startDate: startDateStr,
          startDateFormatted,
          expirationDate: expiryStr,
          expiresAt: expiryStr,
          expiresAtFormatted,
          targetTitle: sub.targetTitle || '',
          targetId: sub.targetId || targetId
        };
      }

      const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const hoursRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

      return {
        isSubscribed: true,
        isExpired: false,
        status: 'active',
        daysRemaining,
        hoursRemaining,
        startDate: startDateStr,
        startDateFormatted,
        expirationDate: expiryStr,
        expiresAt: expiryStr,
        expiresAtFormatted,
        durationDays: sub.durationDays || 30,
        targetTitle: sub.targetTitle || '',
        targetId: sub.targetId || targetId,
        activationCode: sub.activationCode || sub.codeUsed || ''
      };
    } catch (e) {
      return { isSubscribed: false, isExpired: false, status: 'none' };
    }
  };

  /**
   * Evaluates sequential lecture progression:
   * Rule 1: Requires subscription or free status.
   * Rule 2: Instructor has full access.
   * Rule 3: Manual override by teacher grants instant access.
   * Rule 4: First lecture in a section/stage is always open if subscribed.
   * Rule 5: Subsequent lectures require >= 50% genuine watch time of previous lecture.
   * Rule 6: If previous lecture has an exam, student must have passed with > 50%.
   */
  const canAccessLecture = (lecture, stageId) => {
    if (!lecture) return { allowed: false, reason: 'المحاضرة غير موجودة' };

    // 1. Instructor role or valid admin session bypasses all locks
    if (role === 'instructor' || Boolean(verifyAdminSession()?.isValid)) {
      return { allowed: true, isTeacherOverride: true, reason: 'حساب المعلم (وصول كامل)' };
    }

    const currentUid = currentUser?.uid || currentUser?.id;

    // 2. Teacher manual override for this student
    if (currentUid && manualOverrides[lecture.id]?.[currentUid]?.unlocked) {
      return {
        allowed: true,
        isTeacherOverride: true,
        reason: manualOverrides[lecture.id][currentUid].reason || 'تم فتح المحاضرة استثنائياً بواسطة المستر'
      };
    }

    // 3. Subscription check
    const isFree = Boolean(lecture.isFree);
    let hasSubscription = isFree;

    if (!isFree) {
      if (!currentUser || !currentUid || currentUid === 'guest') {
        return {
          allowed: false,
          requiresAuth: true,
          reason: 'يجب تسجيل الدخول بحساب Google أولاً لتفعيل المحاضرة'
        };
      }

      // Check section subscription (month or course)
      let matchedSub = null;
      if (lecture.sectionId) {
        const secSub = getSubscriptionStatus(lecture.sectionId);
        if (secSub.isFrozen) return { allowed: false, isFrozen: true, reason: secSub.reason };
        if (secSub.isPaused) return { allowed: false, isPaused: true, reason: secSub.reason };
        if (secSub.isSubscribed && !secSub.isExpired) {
          hasSubscription = true;
          matchedSub = secSub;
        }
      }

      // Direct lecture subscription
      if (!hasSubscription) {
        const lecSub = getSubscriptionStatus(lecture.id);
        if (lecSub.isFrozen) return { allowed: false, isFrozen: true, reason: lecSub.reason };
        if (lecSub.isPaused) return { allowed: false, isPaused: true, reason: lecSub.reason };
        if (lecSub.isSubscribed && !lecSub.isExpired) {
          hasSubscription = true;
          matchedSub = lecSub;
        }
      }

      // Stage-level subscription
      if (!hasSubscription) {
        const rawStageId = stageId || lecture.stageId;
        const targetStageId = normalizeStageId(rawStageId);
        const stageSub = getSubscriptionStatus(targetStageId) || getSubscriptionStatus(rawStageId);
        if (stageSub.isFrozen) return { allowed: false, isFrozen: true, reason: stageSub.reason };
        if (stageSub.isPaused) return { allowed: false, isPaused: true, reason: stageSub.reason };
        if (stageSub.isSubscribed && !stageSub.isExpired) {
          hasSubscription = true;
          matchedSub = stageSub;
        }
      }

      // All-access VIP
      if (!hasSubscription) {
        const allSub = getSubscriptionStatus('all-access');
        if (allSub.isFrozen) return { allowed: false, isFrozen: true, reason: allSub.reason };
        if (allSub.isPaused) return { allowed: false, isPaused: true, reason: allSub.reason };
        if (allSub.isSubscribed && !allSub.isExpired) {
          hasSubscription = true;
          matchedSub = allSub;
        }
      }

      if (!hasSubscription) {
        return {
          allowed: false,
          requiresSubscription: true,
          reason: 'المحاضرة تتطلب الاشتراك في الشهر أو شحن كود تفعيل المحاضرة'
        };
      }
    }

    // If it's a free lecture, it is always directly open to preview without progression gating
    if (isFree) {
      return { allowed: true, reason: 'محاضرة مجانية متاحة للمشاهدة فوراً' };
    }

    // 4. Sequential progression check within the same month/course/stage
    // Find cohort of lectures sharing the same section (or stage if no section)
    const cohort = (lectures || [])
      .filter(l => !l.isDeleted)
      .filter(l => {
        if (lecture.sectionId) {
          return l.sectionId === lecture.sectionId;
        }
        return (l.stageId === lecture.stageId || normalizeStageId(l.stageId) === normalizeStageId(lecture.stageId)) && !l.sectionId;
      })
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    const currIdx = cohort.findIndex(l => l.id === lecture.id);

    // If it's the first lecture in the section or not found in cohort, it is unlocked immediately!
    if (currIdx <= 0) {
      return { allowed: true, reason: 'المحاضرة الأولى مفتوحة ضمن اشتراكك' };
    }

    // Inspect previous lecture in sequence
    const prevLec = cohort[currIdx - 1];
    const prevProg = videoWatchProgress[prevLec.id] || { percent: 0, watchedSeconds: 0 };
    const prevWatchPercent = prevProg.percent || 0;

    // Condition 1: Must watch at least 50% of the previous lecture
    if (prevWatchPercent < 50) {
      return {
        allowed: false,
        isProgressionLocked: true,
        reason: `يجب مشاهدة 50% على الأقل من المحاضرة السابقة (${prevLec.title}) أولاً. نسبة مشاهدتك الحالية: ${prevWatchPercent}%.`,
        prevLecture: prevLec,
        prevWatchPercent,
        missing: 'watch'
      };
    }

    // Condition 2: If previous lecture had an exam, student must have passed with > 50%
    const prevExam = prevLec.exam || (examsData && examsData[prevLec.id]);
    const prevExamRequired = prevLec.examRequired !== false && 
      Boolean(prevExam) && 
      prevExam.status !== 'draft' && 
      Array.isArray(prevExam.questions) && 
      prevExam.questions.length > 0;

    if (prevExamRequired) {
      // 2a. Check if student submitted exam and is pending manual teacher grading
      const submission = examSubmissions[prevLec.id]?.[currentUid];
      if (submission && submission.status === 'pending_grading') {
        return {
          allowed: false,
          isProgressionLocked: true,
          isPendingGrading: true,
          reason: `امتحان المحاضرة السابقة (${prevLec.title}) قيد التصحيح والمراجعة اليدوية من المستر 📝. سيتم فتح المحاضرة التالية فور اعتماد درجتك.`,
          prevLecture: prevLec,
          prevWatchPercent,
          missing: 'exam_pending_grading'
        };
      }

      const prevResult = examResults[prevLec.id];
      if (!prevResult) {
        return {
          allowed: false,
          isProgressionLocked: true,
          reason: `يجب اجتياز امتحان المحاضرة السابقة (${prevLec.title}) بنسبة تتجاوز 50% لفتح هذه المحاضرة.`,
          prevLecture: prevLec,
          prevWatchPercent,
          missing: 'exam_not_taken'
        };
      }

      if (prevResult.pendingGrading || prevResult.status === 'pending_grading') {
        return {
          allowed: false,
          isProgressionLocked: true,
          isPendingGrading: true,
          reason: `امتحان المحاضرة السابقة (${prevLec.title}) قيد التصحيح والمراجعة اليدوية من المستر 📝`,
          prevLecture: prevLec,
          prevWatchPercent,
          missing: 'exam_pending_grading'
        };
      }

      const scoreNum = Number(prevResult.score) || 0;
      const totalNum = Number(prevResult.total) || 20;
      const examPercent = totalNum > 0 ? Math.round((scoreNum / totalNum) * 100) : 0;

      if (examPercent <= 50) {
        return {
          allowed: false,
          isProgressionLocked: true,
          reason: `لم تجتز امتحان المحاضرة السابقة (${prevLec.title}) بنجاح (درجتك: ${examPercent}%). يجب الحصول على أكثر من 50% لفتح المحاضرة التالية.`,
          prevLecture: prevLec,
          prevWatchPercent,
          prevExamPercent: examPercent,
          missing: 'exam_failed'
        };
      }
    }

    return { allowed: true, reason: 'مكتملة المتطلبات والمشاهدة' };
  };

  const isLectureUnlocked = (lecture, stageId) => {
    return canAccessLecture(lecture, stageId).allowed;
  };

  const redeemCode = async (codeStr) => {
    // 1. Must be logged in with Google (support both uid and id)
    const studentUid = currentUser?.uid || currentUser?.id;
    if (!currentUser || !studentUid || studentUid === 'guest') {
      addToast('يجب تسجيل الدخول بحساب Google أولاً لربط وتفعيل الاشتراك بحسابك الدائم 🔐', 'info');
      if (openAuthModal) openAuthModal('login');
      return { success: false, error: 'not_logged_in' };
    }

    if (!codeStr || typeof codeStr !== 'string' || !codeStr.trim()) {
      addToast('يرجى كتابة رمز الكود', 'error');
      return { success: false, error: 'empty_code' };
    }

    const cleanCode = codeStr.trim().toUpperCase();

    // 2. Fetch code directly from Cloud (Firestore & RTDB) first to ensure live integrity
    let found = await fetchCodeFromCloud(cleanCode);
    if (!found) {
      found = accessCodes.find(c => c.code.toUpperCase() === cleanCode);
    }

    if (!found) {
      addToast('عذراً، كود الشحن غير صحيح. تأكد من إدخال الحروف والأرقام بدقة.', 'error');
      return { success: false, error: 'invalid_code' };
    }

    // 3. Status checks: Is active?
    if (found.isActive === false) {
      addToast('عذراً، تم إيقاف هذا الكود مؤقتاً من قِبل إدارة المنصة 🔒', 'error');
      return { success: false, error: 'code_disabled' };
    }

    // 4. Expiration date check on the code itself (if code has a validity end date)
    if (found.expiryDate) {
      const codeExpiryTime = new Date(found.expiryDate).getTime();
      if (!isNaN(codeExpiryTime) && codeExpiryTime < Date.now()) {
        addToast('عذراً، انتهت صلاحية هذا الكود ولم يعد صالحاً للاستخدام ⏳', 'error');
        return { success: false, error: 'code_expired' };
      }
    }

    // 5. Code type and target identification
    const codeType = found.codeType || found.type || 'month';
    const targetId = found.targetId || 'sec3-month-1';
    const isAllAccess = targetId === 'all-access' || cleanCode.includes('VIP') || String(found.stage || '').includes('جميع');
    const canonStageId = isAllAccess ? 'all-access' : normalizeStageId(found.stageId || targetId, found.stage || '');

    // 6. Prevent duplicate subscription if student is already actively subscribed to this exact target
    const currentSub = getSubscriptionStatus(targetId);
    if (currentSub && currentSub.isSubscribed && !currentSub.isExpired) {
      const expiryFormatted = currentSub.expiresAtFormatted || (currentSub.expiresAt ? new Date(currentSub.expiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'سارٍ');
      addToast(`أنت مشترك بالفعل في (${currentSub.targetTitle || found.targetTitle || 'هذا المحتوى'}) واشتراكك سارٍ حتى ${expiryFormatted} ℹ️`, 'info', 7000);
      return {
        success: true,
        alreadyActive: true,
        subscription: currentSub,
        expiresAtFormatted: expiryFormatted,
        expirationDate: expiryFormatted
      };
    }

    // 7. Max uses and student re-activation checks
    const isDefaultDemoCode = ['MS-SEC3-2026', 'MS-SEC2-2026', 'MS-SEC1-2026', 'MS-VIP-2026', 'MS-SEC3-8812'].includes(cleanCode);
    const studentEmail = (currentUser?.email || '').toLowerCase().trim();
    const studentName = (currentUser?.name || '').trim();

    const matchesUid = Boolean(studentUid && (found.usedByUid === studentUid || found.userId === studentUid || (Array.isArray(found.usedByList) && found.usedByList.includes(studentUid))));
    const matchesEmail = Boolean(studentEmail && found.usedByEmail && found.usedByEmail.toLowerCase().trim() === studentEmail);
    const matchesName = Boolean(studentName && found.usedBy && found.usedBy.trim() === studentName);

    let activeUnlocks = {};
    try {
      activeUnlocks = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
    } catch (e) {}
    const savedUser = JSON.parse(localStorage.getItem('madarek_user') || 'null');
    const userSubs = { ...(savedUser?.subscriptions || {}), ...(currentUser?.subscriptions || {}) };

    const matchesSubCode = Object.values(userSubs).some(s => 
      (s?.activationCode && s.activationCode.toUpperCase() === cleanCode) ||
      (s?.codeUsed && s.codeUsed.toUpperCase() === cleanCode)
    ) || Object.values(activeUnlocks).some(s => 
      (s?.activationCode && s.activationCode.toUpperCase() === cleanCode) ||
      (s?.codeUsed && s.codeUsed.toUpperCase() === cleanCode)
    );

    const isAlreadyRedeemedBySameStudent = matchesUid || matchesEmail || matchesName || matchesSubCode || isDefaultDemoCode;

    const maxUses = Number(found.maxUses) || 1;
    const currentUsedCount = Number(found.usedCount) || (found.isUsed ? 1 : 0);

    if (currentUsedCount >= maxUses && !isAlreadyRedeemedBySameStudent) {
      addToast('عذراً، وصل هذا الكود إلى الحد الأقصى لعدد مرات الاستخدام المسموح بها.', 'error');
      return { success: false, error: 'max_uses_reached' };
    }

    // 8. Calculate subscription duration
    const startDate = (isAlreadyRedeemedBySameStudent && found.startDate) ? found.startDate : new Date().toISOString();
    const durationDays = Number(found.durationDays) || (found.durationMonths ? Number(found.durationMonths) * 30 : 30);

    const existingExpiry = (found.expirationDate || found.expiresAt);
    let expiresAt;
    if (isAlreadyRedeemedBySameStudent && existingExpiry && new Date(existingExpiry).getTime() > Date.now()) {
      expiresAt = existingExpiry;
    } else {
      expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    // 9. Update code usage counters
    const newUsedCount = isAlreadyRedeemedBySameStudent ? currentUsedCount : currentUsedCount + 1;
    const updatedUsedByList = Array.isArray(found.usedByList) ? Array.from(new Set([...found.usedByList, studentUid])) : [studentUid];
    const isNowFullyUsed = newUsedCount >= maxUses;

    const updatedCode = {
      ...found,
      code: cleanCode,
      isUsed: isNowFullyUsed,
      status: isNowFullyUsed ? 'used' : 'active',
      usedCount: newUsedCount,
      usedByList: updatedUsedByList,
      usedBy: currentUser?.name || 'طالب مسجل بالمنصة',
      usedByUid: studentUid,
      usedByEmail: currentUser?.email || '',
      usedAt: found.usedAt || startDate,
      startDate: found.startDate || startDate,
      expirationDate: expiresAt,
      expiresAt: expiresAt
    };

    setAccessCodes(prev => prev.map(c => c.code.toUpperCase() === cleanCode ? updatedCode : c));
    await markCodeAsUsedInCloud(cleanCode, updatedCode);

    // 10. Record Treasury Transaction (Only if this is the first redemption by this student)
    if (!isAlreadyRedeemedBySameStudent) {
      recordTransaction({
        userId: studentUid,
        studentName: currentUser?.name || 'طالب مسجل بالمنصة',
        studentPhone: currentUser?.phone || '01000000000',
        stageId: found.stageId || canonStageId,
        stageName: found.stage || 'الصف الثالث الثانوي',
        targetType: codeType,
        targetId: targetId,
        targetTitle: found.targetTitle || 'تفعيل محتوى',
        amount: found.isGift ? 0 : (found.rawPrice !== undefined ? found.rawPrice : (Number(String(found.price || 0).replace(/[^0-9.]/g, '')) || 0)),
        paymentMethod: 'code',
        paymentMethodLabel: found.isGift ? 'كود مجاني / هدية 🎁' : 'كود شحن مسبق الدفع 🎟️',
        isGift: Boolean(found.isGift),
        codeUsed: cleanCode,
        status: 'completed',
        createdAt: new Date().toISOString()
      });
    }

    // 11. Selective content unlocking according to Code Type
    let newlyUnlockedIds = [];
    let targetDisplayTitle = found.targetTitle || 'المحتوى التعليمي';
    let primarySubscription = {
      userId: studentUid,
      courseId: targetId,
      stageId: found.stageId || canonStageId,
      targetId: targetId,
      targetType: codeType,
      targetTitle: targetDisplayTitle,
      status: 'active',
      subscribed: true,
      startDate: startDate,
      activatedAt: startDate,
      expirationDate: expiresAt,
      expiresAt: expiresAt,
      durationDays: durationDays,
      activationCode: cleanCode,
      codeUsed: cleanCode
    };

    if (isAllAccess) {
      // All-access VIP
      const allStageIds = stages.map(s => s.id);
      const allLecIds = lectures.map(l => l.id);
      const allSecIds = sections.map(s => s.id);
      newlyUnlockedIds = ['all-access', ...allStageIds, ...allLecIds, ...allSecIds];
      targetDisplayTitle = 'الاشتراك الشامل لكافة المراحل والشهور';
      primarySubscription.targetTitle = targetDisplayTitle;
      activeUnlocks['all-access'] = primarySubscription;

      for (const sId of allStageIds) {
        activeUnlocks[sId] = { ...primarySubscription, courseId: sId, stageId: sId, targetId: sId };
        if (addSubscriptionToUser) await addSubscriptionToUser(sId, activeUnlocks[sId]);
      }
      if (addSubscriptionToUser) await addSubscriptionToUser('all-access', primarySubscription);
    } else if (codeType === 'month' || codeType === 'course') {
      // Month or Course: Unlocks this specific section and all lectures inside it
      const secLectures = lectures.filter(l => l.sectionId === targetId);
      const secLecIds = secLectures.map(l => l.id);
      newlyUnlockedIds = [targetId, ...secLecIds];

      activeUnlocks[targetId] = primarySubscription;
      secLecIds.forEach(lId => {
        activeUnlocks[lId] = {
          ...primarySubscription,
          targetId: lId,
          fromSection: targetId
        };
      });

      if (addSubscriptionToUser) {
        await addSubscriptionToUser(targetId, primarySubscription);
      }
    } else if (codeType === 'lecture') {
      // Single Lecture: Unlocks only this specific lecture
      newlyUnlockedIds = [targetId];
      activeUnlocks[targetId] = primarySubscription;
      if (addSubscriptionToUser) {
        await addSubscriptionToUser(targetId, primarySubscription);
      }
    } else if (codeType === 'bundle') {
      // Custom Bundle: Unlocks all items specified in bundleItems
      const bItems = Array.isArray(found.bundleItems) && found.bundleItems.length > 0 ? found.bundleItems : [targetId];
      newlyUnlockedIds = [...bItems];
      activeUnlocks[targetId] = primarySubscription;

      for (const itemId of bItems) {
        activeUnlocks[itemId] = { ...primarySubscription, targetId: itemId };
        const subSecLecs = lectures.filter(l => l.sectionId === itemId);
        subSecLecs.forEach(sl => {
          newlyUnlockedIds.push(sl.id);
          activeUnlocks[sl.id] = { ...primarySubscription, targetId: sl.id, fromSection: itemId };
        });
        if (addSubscriptionToUser) await addSubscriptionToUser(itemId, activeUnlocks[itemId]);
      }
      if (addSubscriptionToUser) await addSubscriptionToUser(targetId, primarySubscription);
    } else {
      // Legacy Stage subscription
      const stageObj = stages.find(s => s.id === canonStageId || s.id === targetId || normalizeStageId(s.id) === canonStageId) || { id: canonStageId, name: found.stage || 'المرحلة الدراسية' };
      const resolvedStageId = stageObj.id || canonStageId;
      targetDisplayTitle = stageObj.name || found.targetTitle || 'المرحلة الدراسية';
      const stageLectures = lectures.filter(l => l.stageId === resolvedStageId || normalizeStageId(l.stageId) === canonStageId);
      const stageLecIds = stageLectures.map(l => l.id);

      newlyUnlockedIds = [resolvedStageId, canonStageId, targetId, ...stageLecIds];
      activeUnlocks[resolvedStageId] = primarySubscription;
      activeUnlocks[canonStageId] = primarySubscription;

      stageLecIds.forEach(lId => {
        activeUnlocks[lId] = { ...primarySubscription, targetId: lId, fromStage: resolvedStageId };
      });

      if (addSubscriptionToUser) {
        await addSubscriptionToUser(resolvedStageId, primarySubscription);
        if (canonStageId !== resolvedStageId) {
          await addSubscriptionToUser(canonStageId, primarySubscription);
        }
      }
    }

    try {
      localStorage.setItem('ms_unlocked_uid', studentUid);
      localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(activeUnlocks));
    } catch (e) {}

    // Update students list in teacher admin
    setStudents(prev => {
      const existingIdx = prev.findIndex(s => s.id === studentUid || s.email === currentUser?.email);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const updated = {
          ...existing,
          stageId: primarySubscription.stageId || existing.stageId || 'sec-3',
          stageName: found.stage || existing.stageName || 'الصف الثالث الثانوي',
          startDate: startDate,
          expiresAt: expiresAt,
          expirationDate: expiresAt,
          subscriptionStatus: 'active',
          isActive: true,
          subscriptions: {
            ...(existing.subscriptions || {}),
            [targetId]: primarySubscription
          },
          subscription: primarySubscription
        };
        const copy = [...prev];
        copy[existingIdx] = updated;
        try { localStorage.setItem('ms_students_rich', JSON.stringify(copy)); } catch (e) {}
        return copy;
      } else {
        const newStudent = {
          id: studentUid,
          name: currentUser.name || 'طالب مسجل بالمنصة',
          email: currentUser.email || '',
          phone: currentUser.phone || '01000000000',
          avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          code: `STD-${cleanCode.slice(-4)}`,
          stageId: primarySubscription.stageId || 'sec-3',
          stageName: found.stage || 'الصف الثالث الثانوي',
          groupType: 'online',
          centerName: 'أونلاين VIP',
          startDate: startDate,
          expiresAt: expiresAt,
          expirationDate: expiresAt,
          subscriptionStatus: 'active',
          isActive: true,
          subscriptions: {
            [targetId]: primarySubscription
          },
          subscription: primarySubscription,
          progress: '100%',
          finance: { paidAmount: found.rawPrice || 0, dueAmount: 0, paymentStatus: 'paid' },
          createdAt: startDate
        };
        const copy = [newStudent, ...prev];
        try { localStorage.setItem('ms_students_rich', JSON.stringify(copy)); } catch (e) {}
        return copy;
      }
    });

    const updatedUnlockedList = Array.from(new Set([...unlockedLectureIds, ...newlyUnlockedIds]));
    setUnlockedLectureIds(updatedUnlockedList);
    try {
      localStorage.setItem('ms_unlocked_uid', studentUid);
      localStorage.setItem('ms_unlocked_lectures', JSON.stringify(updatedUnlockedList));
    } catch (e) {}

    try {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    } catch (e) {}

    const expiryFormatted = new Date(expiresAt).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const startFormatted = new Date(startDate).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (isAlreadyRedeemedBySameStudent) {
      addToast(`🎉 مرحباً بك مجدداً! تم التحقق من ملكيتك للكود وتنشيط اشتراكك في (${targetDisplayTitle}) بنجاح حتى ${expiryFormatted} 🚀`, 'success', 7000);
    } else {
      addToast(`🎉 تم الاشتراك بنجاح في (${targetDisplayTitle})! اشتراكك نشط بحسابك حتى ${expiryFormatted} 🚀`, 'success', 7000);
    }

    return {
      success: true,
      subscription: primarySubscription,
      stageName: targetDisplayTitle,
      startDate: startFormatted,
      expirationDate: expiryFormatted,
      expiresAtFormatted: expiryFormatted,
      durationDays
    };
  };

  const markLectureComplete = (lectureId) => {
    if (!completedLectureIds.includes(lectureId)) {
      setCompletedLectureIds(prev => [...prev, lectureId]);
      addXP(50);
      addToast('أحسنت! أتممت مشاهدة المحاضرة (+50 نقطة XP) 🌟', 'xp');
    }
  };

  const submitHomework = (lectureId, photoUrl, studentNotes) => {
    const newSubmission = {
      status: 'submitted',
      grade: 'قيد مراجعة المساعدين (10/10 متوقع)',
      submittedAt: new Date().toISOString().split('T')[0],
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
      notes: studentNotes || 'تم حل جميع تدريبات صفحة 14-22 بالكامل.'
    };
    setHomeworkSubmissions(prev => ({ ...prev, [lectureId]: newSubmission }));
    addXP(30);
    addToast('تم رفع صورة حل واجب الكشكول بنجاح! سيتم إخطار ولي الأمر بتمام التسليم 📝', 'success');
  };

  const submitExam = (lectureId, score, total, passed) => {
    const gradeText = `${score} من ${total} (${Math.round((score / total) * 100)}%)`;
    const newResult = {
      score,
      total,
      grade: gradeText,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      passed
    };
    setExamResults(prev => ({ ...prev, [lectureId]: newResult }));
    if (passed) {
      markLectureComplete(lectureId);
      addXP(100);
      addToast(`مبارك! اجتزت امتحان ${teacherProfile.name} بدرجة ${gradeText} 🏆`, 'success');
    } else {
      addToast(`حصلت على ${gradeText}. راجع المذكرة جيداً وأعد المحاولة لاجتياز المحاضرة القادمة.`, 'error');
    }
  };

  const generateParentWhatsAppReport = (student) => {
    const studentExam = student.examScores?.['lec-s3-01'] || { grade: '20/20 (ممتاز)' };
    const hwStatus = student.homeworkStatus?.['lec-s3-01']?.status === 'submitted' ? 'تم تسليم واجب الكشكول بنجاح ✓' : 'لم يسلم الواجب بعد ⚠️';
    const payStatus = student.finance?.paymentStatus === 'paid' ? 'تم سداد المصاريف بالكامل ✓' : `متبقي عليه (${student.finance?.dueAmount || 0} ج.م) ⚠️`;

    return `السلام عليكم ورحمة الله وبركاته،\nتقرير متابعة أداء الطالب: *${student.name}*\nفي مادة اللغة الإنجليزية مع *${teacherProfile.name} (The Master)*:\n━━━━━━━━━━━━━\n📌 كود الطالب: ${student.code}\n📌 المرحلة: ${student.stageName}\n📌 السنتر / المجموعة: ${student.centerName || 'أونلاين'}\n📌 نسبة مشاهدة وإتمام المحاضرات: ${student.progress || '100%'}\n📌 درجة الامتحان الأخير: ${studentExam.grade || '20/20'}\n📌 حالة الواجب المنزلي: ${hwStatus}\n📌 حالة المصاريف: ${payStatus}\n📌 التقييم العام: متفوق ومتميز جداً ✨\n━━━━━━━━━━━━━\nنرجو الاستمرار في تشجيعه لتحقيق الدرجة النهائية في الثانوية العامة بإذن الله!`;
  };

  const resolveVideoSource = async (lecture) => {
    if (!lecture) return '';
    // 1. If it's a valid remote URL (Cloudflare R2, Firebase Storage or HTTPS)
    if (lecture.videoUrl && (lecture.videoUrl.startsWith('https://') || lecture.videoUrl.startsWith('http://'))) {
      return lecture.videoUrl;
    }
    // 2. If it has a local media key in IndexedDB, obtain a fresh blob url
    if (lecture.localMediaKey) {
      try {
        const idbRes = await getPermanentMediaUrl(lecture.localMediaKey);
        if (idbRes.found && idbRes.url) {
          return idbRes.url;
        }
        if (idbRes.cloudUrl) {
          return idbRes.cloudUrl;
        }
      } catch (err) {
        console.warn('Could not resolve local media:', err);
      }
    }
    // 3. Never return a stale blob: URL from a previous browser session
    if (lecture.videoUrl && typeof lecture.videoUrl === 'string' && !lecture.videoUrl.startsWith('blob:')) {
      return lecture.videoUrl;
    }
    return '';
  };

  const syncAllToFirebase = async () => {
    try {
      if (teacherProfile) {
        await syncTeacherProfile(teacherProfile);
      }
      if (Array.isArray(stages) && stages.length > 0) {
        await syncStagesToCloud(stages);
      }
      if (Array.isArray(students) && students.length > 0) {
        await batchSyncStudents(students);
      }
      if (Array.isArray(lectures) && lectures.length > 0) {
        for (const lec of lectures) {
          await saveLectureToFirestore(lec);
        }
      }
      if (Array.isArray(booklets) && booklets.length > 0) {
        for (const bk of booklets) {
          await syncBookletToCloud(bk);
        }
      }
      if (Array.isArray(topAchievers) && topAchievers.length > 0) {
        for (const ach of topAchievers) {
          await syncAchieverToCloud(ach);
        }
      }
      if (Array.isArray(accessCodes) && accessCodes.length > 0) {
        for (const code of accessCodes) {
          await syncCodeToCloud(code);
        }
      }
      if (Array.isArray(announcements) && announcements.length > 0) {
        for (const ann of announcements) {
          await syncAnnouncementToCloud(ann);
        }
      }
      addToast('تم حفظ ومزامنة جميع البيانات بنجاح ✓', 'success');
      return { success: true };
    } catch (err) {
      console.warn('Sync all error:', err);
      addToast('حدث خطأ أثناء حفظ ومزامنة البيانات', 'error');
      return { success: false, error: err.message };
    }
  };

  /**
   * Genuine playback progress tracker:
   * Saves elapsed watched seconds without skipping cheats.
   * Auto-marks lecture completed when reaching 50%.
   */
  const updateLectureWatchProgress = (lectureId, watchedSeconds, totalDuration) => {
    if (!lectureId || !totalDuration || totalDuration <= 0) return;
    const cleanSeconds = Math.max(0, Math.floor(watchedSeconds));
    const cleanTotal = Math.max(1, Math.floor(totalDuration));
    const percent = Math.min(100, Math.round((cleanSeconds / cleanTotal) * 100));

    setVideoWatchProgress(prev => {
      const prevEntry = prev[lectureId] || { percent: 0, watchedSeconds: 0 };
      // Only advance progress, never downgrade
      if (percent <= prevEntry.percent && cleanSeconds <= prevEntry.watchedSeconds) {
        return prev;
      }
      const updated = {
        ...prev,
        [lectureId]: {
          watchedSeconds: Math.max(cleanSeconds, prevEntry.watchedSeconds || 0),
          duration: cleanTotal,
          percent: Math.max(percent, prevEntry.percent || 0),
          completed: percent >= 50 || prevEntry.completed || false,
          lastUpdated: new Date().toISOString()
        }
      };
      try {
        localStorage.setItem('ms_video_watch_progress', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (percent >= 50 && !completedLectureIds.includes(lectureId)) {
      markLectureComplete(lectureId);
    }
  };

  /**
   * Teacher manual override: instantly unlocks a lecture for a specific student with a logged reason.
   */
  const overrideUnlockLecture = (lectureId, studentUid, reason = 'موافقة المستر يدوياً') => {
    if (!lectureId || !studentUid) return;
    setManualOverrides(prev => {
      const lectureEntry = prev[lectureId] || {};
      const updated = {
        ...prev,
        [lectureId]: {
          ...lectureEntry,
          [studentUid]: {
            unlocked: true,
            reason,
            unlockedAt: new Date().toISOString(),
            byTeacher: teacherProfile.name
          }
        }
      };
      try {
        localStorage.setItem('ms_manual_overrides', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addToast(`تم فتح المحاضرة استثنائياً للطالب بنجاح 🔓 (${reason})`, 'success');
  };

  const revokeOverrideLecture = (lectureId, studentUid) => {
    if (!lectureId || !studentUid) return;
    setManualOverrides(prev => {
      const lectureEntry = { ...(prev[lectureId] || {}) };
      delete lectureEntry[studentUid];
      const updated = { ...prev, [lectureId]: lectureEntry };
      try {
        localStorage.setItem('ms_manual_overrides', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addToast('تم إلغاء الفتح الاستثنائي للمحاضرة 🔒', 'info');
  };

  // -------------------------------------------------------------
  // Student Subscriptions Management (إدارة والتحكم في اشتراكات الطلاب)
  // -------------------------------------------------------------

  const pauseStudentSubscription = (studentId, targetId, reason = 'تم إيقاف الاشتراك مؤقتاً بواسطة الإدارة') => {
    let studentTargetName = '';
    let studentTargetPhone = '';
    let targetDisplayTitle = '';
    let updatedSubObj = null;

    setStudents(prev => prev.map(std => {
      if (std.id === studentId || std.code === studentId) {
        studentTargetName = std.name;
        studentTargetPhone = std.phone;
        const currentSubs = { ...(std.subscriptions || {}) };
        if (currentSubs[targetId]) {
          targetDisplayTitle = currentSubs[targetId].targetTitle || targetId;
          updatedSubObj = {
            ...currentSubs[targetId],
            status: 'paused',
            isPaused: true,
            pauseReason: reason,
            pausedAt: new Date().toISOString()
          };
          currentSubs[targetId] = updatedSubObj;
        } else {
          updatedSubObj = {
            targetId,
            targetTitle: `اشتراك ${targetId}`,
            status: 'paused',
            isPaused: true,
            pauseReason: reason,
            pausedAt: new Date().toISOString()
          };
          currentSubs[targetId] = updatedSubObj;
        }
        const updated = { ...std, subscriptions: currentSubs };
        saveStudentToFirestore(updated).catch(() => {});
        return updated;
      }
      return std;
    }));

    // Cloud update for the subscription
    if (updatedSubObj) {
      updateStudentSubscriptionStatusInCloud(studentId, targetId, updatedSubObj).catch(() => {});
    }

    // Invalidate local active student cache immediately if target student is currently active
    const currentUid = currentUser?.uid || currentUser?.id;
    if (currentUid === studentId) {
      try {
        const saved = JSON.parse(localStorage.getItem('madarek_user') || '{}');
        if (saved && saved.subscriptions && saved.subscriptions[targetId]) {
          saved.subscriptions[targetId].status = 'paused';
          saved.subscriptions[targetId].isPaused = true;
          saved.subscriptions[targetId].pauseReason = reason;
          localStorage.setItem('madarek_user', JSON.stringify(saved));
        }

        // Also update ms_unlocked_with_expiry
        const expDict = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
        if (expDict[targetId]) {
          expDict[targetId].status = 'paused';
          expDict[targetId].isPaused = true;
          expDict[targetId].pauseReason = reason;
          localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(expDict));
        }
      } catch (e) {}

      // Trigger re-render of current user state
      if (currentUser && currentUser.subscriptions && currentUser.subscriptions[targetId]) {
        currentUser.subscriptions[targetId].status = 'paused';
        currentUser.subscriptions[targetId].isPaused = true;
        currentUser.subscriptions[targetId].pauseReason = reason;
      }
    }

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action: 'pause',
      actionLabel: 'إيقاف مؤقت ⏸️',
      studentId,
      studentName: studentTargetName || studentId,
      studentPhone: studentTargetPhone || '',
      targetId,
      targetTitle: targetDisplayTitle || targetId,
      reason,
      adminName: teacherProfile.name,
      date: new Date().toISOString()
    };
    setSubscriptionAuditLogs(prev => [logEntry, ...prev]);
    saveAuditLogToCloud(logEntry).catch(() => {});
    addToast(`تم إيقاف اشتراك الطالب (${studentTargetName || studentId}) مؤقتاً بنجاح ⏸️`, 'info');
  };

  const resumeStudentSubscription = (studentId, targetId) => {
    let studentTargetName = '';
    let studentTargetPhone = '';
    let targetDisplayTitle = '';
    let updatedSubObj = null;

    setStudents(prev => prev.map(std => {
      if (std.id === studentId || std.code === studentId) {
        studentTargetName = std.name;
        studentTargetPhone = std.phone;
        const currentSubs = { ...(std.subscriptions || {}) };
        if (currentSubs[targetId]) {
          targetDisplayTitle = currentSubs[targetId].targetTitle || targetId;
          const { isPaused, pauseReason, ...rest } = currentSubs[targetId];
          updatedSubObj = {
            ...rest,
            status: 'active',
            isPaused: false,
            resumedAt: new Date().toISOString()
          };
          currentSubs[targetId] = updatedSubObj;
        }
        const updated = { ...std, subscriptions: currentSubs };
        saveStudentToFirestore(updated).catch(() => {});
        return updated;
      }
      return std;
    }));

    if (updatedSubObj) {
      updateStudentSubscriptionStatusInCloud(studentId, targetId, updatedSubObj).catch(() => {});
    }

    const currentUid = currentUser?.uid || currentUser?.id;
    if (currentUid === studentId) {
      try {
        const saved = JSON.parse(localStorage.getItem('madarek_user') || '{}');
        if (saved && saved.subscriptions && saved.subscriptions[targetId]) {
          saved.subscriptions[targetId].status = 'active';
          saved.subscriptions[targetId].isPaused = false;
          delete saved.subscriptions[targetId].pauseReason;
          localStorage.setItem('madarek_user', JSON.stringify(saved));
        }

        const expDict = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
        if (expDict[targetId]) {
          expDict[targetId].status = 'active';
          expDict[targetId].isPaused = false;
          delete expDict[targetId].pauseReason;
          localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(expDict));
        }
      } catch (e) {}

      if (currentUser && currentUser.subscriptions && currentUser.subscriptions[targetId]) {
        currentUser.subscriptions[targetId].status = 'active';
        currentUser.subscriptions[targetId].isPaused = false;
        delete currentUser.subscriptions[targetId].pauseReason;
      }
    }

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action: 'resume',
      actionLabel: 'إعادة تفعيل ▶️',
      studentId,
      studentName: studentTargetName || studentId,
      studentPhone: studentTargetPhone || '',
      targetId,
      targetTitle: targetDisplayTitle || targetId,
      reason: 'إعادة تفعيل الاشتراك من قِبل المستر',
      adminName: teacherProfile.name,
      date: new Date().toISOString()
    };
    setSubscriptionAuditLogs(prev => [logEntry, ...prev]);
    saveAuditLogToCloud(logEntry).catch(() => {});
    addToast(`تمت إعادة تفعيل اشتراك الطالب (${studentTargetName || studentId}) بنجاح ▶️`, 'success');
  };

  const extendStudentSubscription = (studentId, targetId, additionalDays = 30) => {
    let studentTargetName = '';
    let targetDisplayTitle = '';
    let newExpiryDateStr = '';
    let updatedSubObj = null;

    setStudents(prev => prev.map(std => {
      if (std.id === studentId || std.code === studentId) {
        studentTargetName = std.name;
        const currentSubs = { ...(std.subscriptions || {}) };
        if (currentSubs[targetId]) {
          targetDisplayTitle = currentSubs[targetId].targetTitle || targetId;
          const currentExp = currentSubs[targetId].expirationDate || currentSubs[targetId].expiresAt;
          const baseTime = (currentExp && new Date(currentExp).getTime() > Date.now()) 
            ? new Date(currentExp).getTime() 
            : Date.now();
          const newExpTime = baseTime + Number(additionalDays) * 24 * 60 * 60 * 1000;
          newExpiryDateStr = new Date(newExpTime).toISOString();

          updatedSubObj = {
            ...currentSubs[targetId],
            status: 'active',
            isPaused: false,
            expirationDate: newExpiryDateStr,
            expiresAt: newExpiryDateStr,
            durationDays: (Number(currentSubs[targetId].durationDays) || 30) + Number(additionalDays),
            extendedAt: new Date().toISOString()
          };
          currentSubs[targetId] = updatedSubObj;
        }
        const updated = { ...std, subscriptions: currentSubs };
        saveStudentToFirestore(updated).catch(() => {});
        return updated;
      }
      return std;
    }));

    if (updatedSubObj) {
      updateStudentSubscriptionStatusInCloud(studentId, targetId, updatedSubObj).catch(() => {});
    }

    const currentUid = currentUser?.uid || currentUser?.id;
    if (currentUid === studentId && newExpiryDateStr) {
      try {
        const saved = JSON.parse(localStorage.getItem('madarek_user') || '{}');
        if (saved && saved.subscriptions && saved.subscriptions[targetId]) {
          saved.subscriptions[targetId].expirationDate = newExpiryDateStr;
          saved.subscriptions[targetId].expiresAt = newExpiryDateStr;
          saved.subscriptions[targetId].status = 'active';
          saved.subscriptions[targetId].isPaused = false;
          localStorage.setItem('madarek_user', JSON.stringify(saved));
        }

        const expDict = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
        if (expDict[targetId]) {
          expDict[targetId].expirationDate = newExpiryDateStr;
          expDict[targetId].expiresAt = newExpiryDateStr;
          expDict[targetId].status = 'active';
          expDict[targetId].isPaused = false;
          localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(expDict));
        }
      } catch (e) {}

      if (currentUser && currentUser.subscriptions && currentUser.subscriptions[targetId]) {
        currentUser.subscriptions[targetId].expirationDate = newExpiryDateStr;
        currentUser.subscriptions[targetId].expiresAt = newExpiryDateStr;
        currentUser.subscriptions[targetId].status = 'active';
        currentUser.subscriptions[targetId].isPaused = false;
      }
    }

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action: 'extend',
      actionLabel: `تمديد (+${additionalDays} يوم) ⏳`,
      studentId,
      studentName: studentTargetName || studentId,
      targetId,
      targetTitle: targetDisplayTitle || targetId,
      reason: `تمديد الصلاحية لمدة ${additionalDays} يوم حتى ${newExpiryDateStr ? new Date(newExpiryDateStr).toLocaleDateString('ar-EG') : ''}`,
      adminName: teacherProfile.name,
      date: new Date().toISOString()
    };
    setSubscriptionAuditLogs(prev => [logEntry, ...prev]);
    saveAuditLogToCloud(logEntry).catch(() => {});
    addToast(`تم تمديد اشتراك الطالب (${studentTargetName || studentId}) بنجاح لمدة ${additionalDays} يوم ⏳`, 'success');
  };

  const cancelStudentSubscription = (studentId, targetId, reason = 'إلغاء نهائي من قِبل الإدارة') => {
    let studentTargetName = '';
    let targetDisplayTitle = '';
    let updatedSubObj = null;

    setStudents(prev => prev.map(std => {
      if (std.id === studentId || std.code === studentId) {
        studentTargetName = std.name;
        const currentSubs = { ...(std.subscriptions || {}) };
        if (currentSubs[targetId]) {
          targetDisplayTitle = currentSubs[targetId].targetTitle || targetId;
          updatedSubObj = {
            ...currentSubs[targetId],
            status: 'cancelled',
            isCancelled: true,
            cancelReason: reason,
            cancelledAt: new Date().toISOString()
          };
          currentSubs[targetId] = updatedSubObj;
        }
        const updated = { ...std, subscriptions: currentSubs };
        saveStudentToFirestore(updated).catch(() => {});
        return updated;
      }
      return std;
    }));

    if (updatedSubObj) {
      updateStudentSubscriptionStatusInCloud(studentId, targetId, updatedSubObj).catch(() => {});
    }

    const currentUid = currentUser?.uid || currentUser?.id;
    if (currentUid === studentId) {
      try {
        const saved = JSON.parse(localStorage.getItem('madarek_user') || '{}');
        if (saved && saved.subscriptions && saved.subscriptions[targetId]) {
          saved.subscriptions[targetId].status = 'cancelled';
          saved.subscriptions[targetId].isCancelled = true;
          saved.subscriptions[targetId].cancelReason = reason;
          localStorage.setItem('madarek_user', JSON.stringify(saved));
        }

        const expDict = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
        if (expDict[targetId]) {
          expDict[targetId].status = 'cancelled';
          expDict[targetId].isCancelled = true;
          expDict[targetId].cancelReason = reason;
          localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(expDict));
        }
      } catch (e) {}

      if (currentUser && currentUser.subscriptions && currentUser.subscriptions[targetId]) {
        currentUser.subscriptions[targetId].status = 'cancelled';
        currentUser.subscriptions[targetId].isCancelled = true;
        currentUser.subscriptions[targetId].cancelReason = reason;
      }
    }

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action: 'cancel',
      actionLabel: 'إلغاء نهائي ❌',
      studentId,
      studentName: studentTargetName || studentId,
      targetId,
      targetTitle: targetDisplayTitle || targetId,
      reason,
      adminName: teacherProfile.name,
      date: new Date().toISOString()
    };
    setSubscriptionAuditLogs(prev => [logEntry, ...prev]);
    saveAuditLogToCloud(logEntry).catch(() => {});
    addToast(`تم إلغاء اشتراك الطالب (${studentTargetName || studentId}) نهائياً`, 'info');
  };

  const toggleStudentFreeze = (studentId, reason = 'تجميد الحساب من قبل الإدارة') => {
    let studentTargetName = '';
    let isNowFrozen = false;

    setStudents(prev => prev.map(std => {
      if (std.id === studentId || std.code === studentId) {
        studentTargetName = std.name;
        isNowFrozen = !std.isFrozen;
        const updated = {
          ...std,
          isFrozen: isNowFrozen,
          freezeReason: isNowFrozen ? reason : null,
          frozenAt: isNowFrozen ? new Date().toISOString() : null
        };
        saveStudentToFirestore(updated).catch(() => {});
        return updated;
      }
      return std;
    }));

    const currentUid = currentUser?.uid || currentUser?.id;
    if (currentUid === studentId) {
      if (currentUser) {
        currentUser.isFrozen = isNowFrozen;
        currentUser.freezeReason = isNowFrozen ? reason : null;
      }
    }

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action: isNowFrozen ? 'freeze' : 'unfreeze',
      actionLabel: isNowFrozen ? 'تجميد الحساب ❄️' : 'إلغاء تجميد الحساب 🔓',
      studentId,
      studentName: studentTargetName || studentId,
      targetId: 'all-account',
      targetTitle: 'حساب المنصة بالكامل',
      reason: isNowFrozen ? reason : 'فك تجميد الحساب',
      adminName: teacherProfile.name,
      date: new Date().toISOString()
    };
    setSubscriptionAuditLogs(prev => [logEntry, ...prev]);
    saveAuditLogToCloud(logEntry).catch(() => {});
    addToast(isNowFrozen ? `تم تجميد حساب الطالب (${studentTargetName}) بالكامل ❄️` : `تم فك تجميد حساب الطالب (${studentTargetName}) 🔓`, 'info');
  };

  const bulkUpdateSubscriptions = (studentIds, action, payload = {}) => {
    if (!Array.isArray(studentIds) || studentIds.length === 0) return;

    studentIds.forEach(stdId => {
      const std = students.find(s => s.id === stdId || s.code === stdId);
      if (!std) return;
      const subKeys = Object.keys(std.subscriptions || {});
      if (subKeys.length === 0) {
        const defaultTarget = 'sec3-month-1';
        if (action === 'pause') pauseStudentSubscription(stdId, defaultTarget, payload.reason || 'إيقاف جماعي');
        else if (action === 'resume') resumeStudentSubscription(stdId, defaultTarget);
        else if (action === 'extend') extendStudentSubscription(stdId, defaultTarget, payload.days || 30);
      } else {
        subKeys.forEach(tId => {
          if (action === 'pause') pauseStudentSubscription(stdId, tId, payload.reason || 'إيقاف جماعي');
          else if (action === 'resume') resumeStudentSubscription(stdId, tId);
          else if (action === 'extend') extendStudentSubscription(stdId, tId, payload.days || 30);
        });
      }
    });

    addToast(`تم تنفيذ الإجراء الجماعي على ${studentIds.length} طالب بنجاح! ⚡`, 'success');
  };

  // -------------------------------------------------------------
  // Manual Exam Builder & Grading Suite (إنشاء الامتحانات والتصحيح)
  // -------------------------------------------------------------

  const saveExamToLecture = (lectureId, examObj) => {
    if (!lectureId || !examObj) return;

    const totalMarks = examObj.totalMarks || (examObj.questions || []).reduce((sum, q) => sum + (Number(q.points) || 1), 0);
    const passingMarks = examObj.passingMarks || Math.ceil(totalMarks * 0.5);

    const fullExam = {
      ...examObj,
      lectureId,
      totalMarks,
      passingMarks,
      updatedAt: new Date().toISOString()
    };

    setExamsData(prev => {
      const updated = { ...prev, [lectureId]: fullExam };
      try {
        localStorage.setItem('ms_exams_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setLectures(prev => prev.map(lec => {
      if (lec.id === lectureId) {
        const updatedLec = { ...lec, exam: fullExam, examRequired: true };
        saveLectureToFirestore(updatedLec).catch(() => {});
        return updatedLec;
      }
      return lec;
    }));

    saveToRtdb(`exams/${lectureId}`, fullExam).catch(() => {});
    addToast('تم حفظ ونشر امتحان المحاضرة بنجاح ✍️', 'success');
  };

  const deleteExamFromLecture = (lectureId) => {
    if (!lectureId) return;

    setExamsData(prev => {
      const updated = { ...prev };
      delete updated[lectureId];
      try {
        localStorage.setItem('ms_exams_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setLectures(prev => prev.map(lec => {
      if (lec.id === lectureId) {
        const { exam, ...rest } = lec;
        const updatedLec = { ...rest, examRequired: false };
        saveLectureToFirestore(updatedLec).catch(() => {});
        return updatedLec;
      }
      return lec;
    }));

    removeFromRtdb(`exams/${lectureId}`).catch(() => {});
    addToast('تم حذف الامتحان من المحاضرة', 'info');
  };

  const submitStudentExamDetailed = (lectureId, submissionPayload) => {
    const studentUid = currentUser?.uid || currentUser?.id || 'guest-student';
    const studentName = currentUser?.name || 'طالب مسجل بالمنصة';
    const studentPhone = currentUser?.phone || '';
    const currentLecture = lectures.find(l => l.id === lectureId);
    const lectureTitle = currentLecture?.title || 'امتحان المحاضرة';

    const {
      answers = {},
      autoScore = 0,
      maxMarks = 20,
      hasManualQuestions = false
    } = submissionPayload;

    const status = hasManualQuestions ? 'pending_grading' : 'graded';
    const passed = !hasManualQuestions && (autoScore / maxMarks) >= 0.5;

    const submissionEntry = {
      studentUid,
      studentName,
      studentPhone,
      lectureId,
      lectureTitle,
      submittedAt: new Date().toISOString(),
      answers,
      autoScore,
      manualScore: 0,
      totalScore: autoScore,
      maxMarks,
      passingMarks: Math.ceil(maxMarks * 0.5),
      hasManualQuestions,
      status,
      gradedAt: hasManualQuestions ? null : new Date().toISOString(),
      teacherNotes: '',
      gradedQuestions: {}
    };

    setExamSubmissions(prev => {
      const lectureSubs = prev[lectureId] || {};
      const updated = {
        ...prev,
        [lectureId]: {
          ...lectureSubs,
          [studentUid]: submissionEntry
        }
      };
      try {
        localStorage.setItem('ms_exam_submissions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    saveToRtdb(`examSubmissions/${lectureId}/${studentUid}`, submissionEntry).catch(() => {});

    const resultObj = {
      score: autoScore,
      total: maxMarks,
      status,
      pendingGrading: hasManualQuestions,
      passed,
      grade: `${autoScore} من ${maxMarks} (${Math.round((autoScore / maxMarks) * 100)}%)`,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    setExamResults(prev => {
      const updated = { ...prev, [lectureId]: resultObj };
      try {
        localStorage.setItem('ms_exam_results', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (hasManualQuestions) {
      addToast('تم استلام إجاباتك بنجاح! 📝 تم رصد الأسئلة المقالية وإرسالها للمستر للتصحيح اليدوي.', 'info', 6000);
    } else {
      if (passed) {
        markLectureComplete(lectureId);
        addXP(100);
        addToast(`مبارك! اجتزت الامتحان بنجاح بدرجة ${resultObj.grade} 🏆`, 'success');
      } else {
        addToast(`حصلت على ${resultObj.grade}. راجع المذكرة جيداً وأعد المحاولة.`, 'warning');
      }
    }
  };

  const gradeManualExamSubmission = (lectureId, studentUid, gradingData) => {
    const { gradedQuestions = {}, teacherNotes = '', additionalScore = 0 } = gradingData;

    let targetStudentName = '';
    let finalTotalScore = 0;
    let maxMarks = 20;
    let passed = false;

    setExamSubmissions(prev => {
      const lectureSubs = prev[lectureId] || {};
      const sub = lectureSubs[studentUid];
      if (!sub) return prev;

      targetStudentName = sub.studentName;
      maxMarks = sub.maxMarks || 20;
      finalTotalScore = (Number(sub.autoScore) || 0) + Number(additionalScore);
      passed = (finalTotalScore / maxMarks) >= 0.5;

      const updatedSub = {
        ...sub,
        status: 'graded',
        manualScore: Number(additionalScore),
        totalScore: finalTotalScore,
        gradedAt: new Date().toISOString(),
        gradedQuestions,
        teacherNotes,
        passed
      };

      const updated = {
        ...prev,
        [lectureId]: {
          ...lectureSubs,
          [studentUid]: updatedSub
        }
      };

      try {
        localStorage.setItem('ms_exam_submissions', JSON.stringify(updated));
      } catch (e) {}
      saveToRtdb(`examSubmissions/${lectureId}/${studentUid}`, updatedSub).catch(() => {});
      return updated;
    });

    const gradeText = `${finalTotalScore} من ${maxMarks} (${Math.round((finalTotalScore / maxMarks) * 100)}%)`;
    setExamResults(prev => {
      const updated = {
        ...prev,
        [lectureId]: {
          score: finalTotalScore,
          total: maxMarks,
          grade: gradeText,
          status: 'graded',
          pendingGrading: false,
          passed,
          date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
        }
      };
      try {
        localStorage.setItem('ms_exam_results', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (passed) {
      markLectureComplete(lectureId);
      addToast(`تم اعتماد الدرجة النهائية (${gradeText}) للطالب (${targetStudentName}) وفك حظر المحاضرة التالية بنجاح! 🏆`, 'success');
    } else {
      addToast(`تم رصد درجة الطالب (${targetStudentName}): ${gradeText}. لم يجتز نسبة النجاح المطلوبة.`, 'warning');
    }
  };

  // -------------------------------------------------------------
  // General Exam Engine (الامتحان العام المستقل وأكواد الطلاب)
  // -------------------------------------------------------------

  const saveGeneralExam = (examObj) => {
    if (!examObj || !examObj.id) return;
    const totalMarks = examObj.totalMarks || (examObj.questions || []).reduce((sum, q) => sum + (Number(q.points) || 1), 0);
    const passingMarks = examObj.passingMarks || Math.ceil(totalMarks * 0.5);

    const creatorUid = currentUser?.uid || currentUser?.id || 'teacher-admin';
    const creatorName = currentUser?.name || teacherProfile.name || 'مستر مايكل شحاته';

    const fullExam = {
      ...examObj,
      totalMarks,
      passingMarks,
      isDeleted: false,
      createdByUid: examObj.createdByUid || creatorUid,
      createdByName: examObj.createdByName || creatorName,
      updatedByUid: creatorUid,
      updatedByName: creatorName,
      updatedAt: new Date().toISOString()
    };

    setGeneralExams(prev => {
      const exists = prev.some(e => e.id === fullExam.id);
      const updated = exists ? prev.map(e => e.id === fullExam.id ? fullExam : e) : [fullExam, ...prev];
      try {
        localStorage.setItem('ms_general_exams', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    saveToRtdb(`generalExams/${fullExam.id}`, fullExam).catch(() => {});

    logPlatformAuditAction({
      action: 'general_exam_saved',
      actionLabel: 'حفظ امتحان شامل 🌟',
      entityType: 'generalExam',
      entityId: fullExam.id,
      details: `تم حفظ أو تحديث الامتحان الشامل: ${fullExam.title}`,
      performedByUid: creatorUid,
      performedByName: creatorName
    }).catch(() => {});

    addToast('تم حفظ الامتحان العام المستقل بنجاح 🌟', 'success');
    return fullExam;
  };

  const deleteGeneralExam = (examId, hardDelete = false) => {
    if (!examId) return;
    const targetExam = generalExams.find(e => e.id === examId);
    const modifierUid = currentUser?.uid || currentUser?.id || 'teacher-admin';
    const modifierName = currentUser?.name || teacherProfile.name || 'مستر مايكل شحاته';

    // Strict Owner-Only Hard Deletion Guard
    const isSuperOwner = (
      role === 'instructor' ||
      currentUser?.role === 'super_admin' || 
      currentAdminUser?.role === 'super_admin' || 
      currentUser?.email === 'mrmichaelshehata@gmail.com' ||
      currentUser?.uid === 'teacher-admin' ||
      Boolean(verifyAdminSession()?.isValid)
    );
    let effectiveHardDelete = Boolean(hardDelete);
    if (effectiveHardDelete && !isSuperOwner) {
      addToast('عذراً! الحذف النهائي محصور للمالك الرئيسي فقط 🛡️ تم نقل الامتحان لسلة المهملات بأمان.', 'warning', 6000);
      effectiveHardDelete = false;
    }

    if (effectiveHardDelete) {
      setGeneralExams(prev => {
        const updated = prev.filter(e => e.id !== examId);
        try {
          localStorage.setItem('ms_general_exams', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      removeFromRtdb(`generalExams/${examId}`).catch(() => {});
      logPlatformAuditAction({
        action: 'general_exam_hard_deleted',
        actionLabel: 'حذف نهائي لامتحان شامل 🗑️',
        entityType: 'generalExam',
        entityId: examId,
        details: `تم الحذف النهائي للامتحان الشامل (${targetExam?.title || examId})`,
        performedByUid: modifierUid,
        performedByName: modifierName
      }).catch(() => {});
      addToast('تم حذف الامتحان العام نهائياً', 'info');
    } else {
      // Soft Delete: Preserves exam content on platform
      setGeneralExams(prev => {
        const updated = prev.map(e => {
          if (e.id === examId) {
            return {
              ...e,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
              deletedByUid: modifierUid,
              deletedByName: modifierName
            };
          }
          return e;
        });
        try {
          localStorage.setItem('ms_general_exams', JSON.stringify(updated));
        } catch (e) {}
        const softExam = updated.find(e => e.id === examId);
        if (softExam) {
          saveToRtdb(`generalExams/${examId}`, softExam).catch(() => {});
        }
        return updated;
      });

      logPlatformAuditAction({
        action: 'general_exam_soft_deleted',
        actionLabel: 'نقل امتحان شامل للمحذوفات 📦',
        entityType: 'generalExam',
        entityId: examId,
        details: `تم نقل الامتحان الشامل (${targetExam?.title || examId}) للمحذوفات مع إمكانية استعادته`,
        performedByUid: modifierUid,
        performedByName: modifierName
      }).catch(() => {});
      addToast(`تم نقل الامتحان الشامل (${targetExam?.title || ''}) إلى سلة المهملات مع الحفاظ على بياناته 📦`, 'info');
    }
  };

  const restoreGeneralExam = (examId) => {
    if (!examId) return;
    const targetExam = generalExams.find(e => e.id === examId);
    const modifierUid = currentUser?.uid || currentUser?.id || 'teacher-admin';
    const modifierName = currentUser?.name || teacherProfile.name || 'مستر مايكل شحاته';

    setGeneralExams(prev => {
      const updated = prev.map(e => {
        if (e.id === examId) {
          const { isDeleted, deletedAt, deletedByUid, deletedByName, ...rest } = e;
          return {
            ...rest,
            isDeleted: false,
            restoredAt: new Date().toISOString(),
            restoredByName: modifierName
          };
        }
        return e;
      });
      try {
        localStorage.setItem('ms_general_exams', JSON.stringify(updated));
      } catch (e) {}
      const restored = updated.find(e => e.id === examId);
      if (restored) {
        saveToRtdb(`generalExams/${examId}`, restored).catch(() => {});
      }
      return updated;
    });

    logPlatformAuditAction({
      action: 'general_exam_restored',
      actionLabel: 'استعادة امتحان شامل ♻️',
      entityType: 'generalExam',
      entityId: examId,
      details: `تمت استعادة الامتحان الشامل (${targetExam?.title || examId}) بنجاح`,
      performedByUid: modifierUid,
      performedByName: modifierName
    }).catch(() => {});
    addToast(`تمت استعادة الامتحان الشامل (${targetExam?.title || ''}) بنجاح! ✨`, 'success');
  };

  const generateGeneralExamCode = ({ studentId, studentName, studentPhone, stageId, stageName, examId, examTitle }) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanStdCode = (studentId || 'STD').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const stageCode = (stageId || 'SEC').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const code = `GEN-${stageCode}-${cleanStdCode}-${randomSuffix}`;

    const newCodeObj = {
      code,
      examId: examId || 'gen-exam-01',
      examTitle: examTitle || 'الامتحان العام الشامل',
      studentId,
      studentName,
      studentPhone: studentPhone || '',
      stageId: stageId || 'sec-3',
      stageName: stageName || 'الصف الثالث الثانوي',
      isUsed: false,
      usedAt: null,
      score: null,
      createdAt: new Date().toISOString(),
      allowRetake: false
    };

    setGeneralExamCodes(prev => {
      const updated = [newCodeObj, ...prev.filter(c => !(c.studentId === studentId && c.examId === examId))];
      try {
        localStorage.setItem('ms_general_exam_codes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    saveToRtdb(`generalExamCodes/${code}`, newCodeObj).catch(() => {});
    addToast(`تم توليد كود الامتحان العام للطالب (${studentName}): ${code}`, 'success');
    return newCodeObj;
  };

  const bulkGenerateGeneralExamCodes = (stageId, examId = 'gen-exam-01') => {
    const targetStudents = students.filter(s => !stageId || s.stageId === stageId);
    if (targetStudents.length === 0) {
      addToast('لا يوجد طلاب مسجلين في هذه المرحلة', 'warning');
      return [];
    }

    const currentExam = generalExams.find(e => e.id === examId) || generalExams[0];
    const generated = [];

    setGeneralExamCodes(prev => {
      const existingMap = new Map(prev.map(c => [`${c.studentId}-${c.examId}`, c]));

      targetStudents.forEach(std => {
        const key = `${std.id}-${examId}`;
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const cleanStdCode = (std.code || std.id || 'STD').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const stageCode = (std.stageId || 'SEC').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const code = `GEN-${stageCode}-${cleanStdCode}-${randomSuffix}`;

        const codeObj = {
          code,
          examId,
          examTitle: currentExam?.title || 'الامتحان العام الشامل',
          studentId: std.id,
          studentName: std.name,
          studentPhone: std.phone || '',
          stageId: std.stageId,
          stageName: std.stageName,
          isUsed: false,
          usedAt: null,
          score: null,
          createdAt: new Date().toISOString(),
          allowRetake: false
        };

        existingMap.set(key, codeObj);
        generated.push(codeObj);
        saveToRtdb(`generalExamCodes/${code}`, codeObj).catch(() => {});
      });

      const updated = Array.from(existingMap.values());
      try {
        localStorage.setItem('ms_general_exam_codes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addToast(`تم توليد ${generated.length} كود امتحان مخصص لطلاب المرحلة بنجاح! 🎟️`, 'success');
    return generated;
  };

  const resetGeneralExamAttempt = (studentId, examId = 'gen-exam-01') => {
    setGeneralExamCodes(prev => {
      const updated = prev.map(c => {
        if (c.studentId === studentId && (!examId || c.examId === examId)) {
          return {
            ...c,
            isUsed: false,
            allowRetake: true,
            usedAt: null
          };
        }
        return c;
      });
      try {
        localStorage.setItem('ms_general_exam_codes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setExamSubmissions(prev => {
      const examKey = `general-${examId}`;
      const examSubs = { ...(prev[examKey] || {}) };
      if (examSubs[studentId]) {
        delete examSubs[studentId];
      }
      const updated = { ...prev, [examKey]: examSubs };
      try {
        localStorage.setItem('ms_exam_submissions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addToast('تمت إعادة فتح محاولة الامتحان العام للطالب بنجاح! 🔓', 'success');
  };

  const cancelGeneralExamCode = (code) => {
    if (!code) return;
    setGeneralExamCodes(prev => {
      const updated = prev.map(c => {
        if (c.code === code) {
          return { ...c, isCancelled: true, status: 'cancelled' };
        }
        return c;
      });
      try {
        localStorage.setItem('ms_general_exam_codes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    saveToRtdb(`generalExamCodes/${code}/isCancelled`, true).catch(() => {});
    addToast(`تم إلغاء كود الامتحان (${code}) بنجاح`, 'info');
  };

  const verifyAndRedeemGeneralExamCode = (inputCode, studentUid, studentName) => {
    if (!inputCode) return { success: false, error: 'يرجى إدخال الكود المخصص' };

    const cleanInput = inputCode.trim().toUpperCase();
    const codeObj = generalExamCodes.find(c => c.code.toUpperCase() === cleanInput);

    if (!codeObj) {
      return { success: false, error: 'كود الامتحان غير صحيح أو غير موجود' };
    }

    if (codeObj.isCancelled || codeObj.status === 'cancelled') {
      return { 
        success: false, 
        error: 'عذراً، تم إلغاء هذا الكود بواسطة المستر ولا يمكن استخدامه لدخول الامتحان!' 
      };
    }

    // Strict personalization check: ensure student matches
    if (studentUid && codeObj.studentId && codeObj.studentId !== studentUid) {
      // Also check if current user name matches student name
      const nameMatch = studentName && codeObj.studentName && 
        (studentName.includes(codeObj.studentName.split(' ')[0]) || codeObj.studentName.includes(studentName.split(' ')[0]));
      if (!nameMatch) {
        return { 
          success: false, 
          error: `هذا الكود مخصص حصرياً للطالب (${codeObj.studentName}) ولا يمكن استخدامه من حساب آخر!` 
        };
      }
    }

    // Strict single attempt check
    if (codeObj.isUsed && !codeObj.allowRetake) {
      return { 
        success: false, 
        error: 'عذراً، هذا الكود تم استخدامه بالفعل مسبقاً! مسموح بمحاولة واحدة فقط. تواصل مع المستر لإعادة فتح المحاولة.' 
      };
    }

    const exam = generalExams.find(e => e.id === codeObj.examId) || generalExams[0];
    return { success: true, codeObj, exam };
  };

  const submitGeneralExam = ({ examId, code, answers, autoScore, maxMarks, hasManualQuestions }) => {
    const studentUid = currentUser?.uid || currentUser?.id || 'guest-student';
    const studentName = currentUser?.name || 'طالب مسجل بالمنصة';
    const cleanCode = (code || '').trim().toUpperCase();

    // 1. Mark code as used
    setGeneralExamCodes(prev => {
      const updated = prev.map(c => {
        if (c.code.toUpperCase() === cleanCode || (c.studentId === studentUid && c.examId === examId)) {
          return {
            ...c,
            isUsed: true,
            usedAt: new Date().toISOString(),
            score: `${autoScore} / ${maxMarks}`,
            allowRetake: false
          };
        }
        return c;
      });
      try {
        localStorage.setItem('ms_general_exam_codes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Submit to exam submissions queue for manual grading and score tracking
    const examKey = `general-${examId}`;
    const submissionEntry = {
      studentUid,
      studentName,
      studentPhone: currentUser?.phone || '',
      lectureId: examKey,
      lectureTitle: generalExams.find(e => e.id === examId)?.title || 'الامتحان العام الشامل',
      isGeneralExam: true,
      examId,
      code: cleanCode,
      submittedAt: new Date().toISOString(),
      answers,
      autoScore,
      manualScore: 0,
      totalScore: autoScore,
      maxMarks,
      passingMarks: Math.ceil(maxMarks * 0.5),
      hasManualQuestions,
      status: hasManualQuestions ? 'pending_grading' : 'graded',
      gradedAt: hasManualQuestions ? null : new Date().toISOString(),
      teacherNotes: '',
      gradedQuestions: {}
    };

    setExamSubmissions(prev => {
      const curSubs = prev[examKey] || {};
      const updated = {
        ...prev,
        [examKey]: {
          ...curSubs,
          [studentUid]: submissionEntry
        }
      };
      try {
        localStorage.setItem('ms_exam_submissions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    saveToRtdb(`examSubmissions/${examKey}/${studentUid}`, submissionEntry).catch(() => {});

    if (hasManualQuestions) {
      addToast('تم تسليم إجابات الامتحان العام بنجاح! تم رصد الأسئلة المقالية وإرسالها للمستر للتصحيح اليدوي.', 'info', 7000);
    } else {
      addToast(`مبارك! أتممت الامتحان العام الشامل بنجاح بدرجة ${autoScore} من ${maxMarks} 🏆`, 'success');
      addXP(150);
    }

    return submissionEntry;
  };

  // -------------------------------------------------------------
  // Centralized Platform Multi-Admin & RBAC Management
  // -------------------------------------------------------------

  const currentAdminUser = staffAdmins.find(
    a => a.email === currentUser?.email || a.uid === (currentUser?.uid || currentUser?.id)
  ) || defaultSuperAdmin;

  const hasPermission = (permissionKey) => {
    // Super admin has all permissions unconditionally
    if (currentAdminUser?.role === 'super_admin' || currentAdminUser?.uid === 'teacher-admin') {
      return true;
    }
    return Boolean(currentAdminUser?.permissions?.[permissionKey]);
  };

  const addStaffAdmin = async (adminData) => {
    const newAdmin = {
      id: `admin-${Date.now()}`,
      uid: adminData.uid || `staff-${Date.now()}`,
      name: adminData.name || 'مدرس مساعد',
      email: adminData.email,
      phone: adminData.phone || '',
      role: adminData.role || 'admin',
      roleLabel: adminData.role === 'admin' ? 'مدرس مصرح له بالإدارة 👨‍🏫' : 'مساعد إداري 📋',
      permissions: {
        canManageLectures: adminData.permissions?.canManageLectures !== false,
        canManageExams: adminData.permissions?.canManageExams !== false,
        canManageSubscriptions: Boolean(adminData.permissions?.canManageSubscriptions),
        canViewFinance: Boolean(adminData.permissions?.canViewFinance),
        canManageCodes: adminData.permissions?.canManageCodes !== false,
        canManageStaff: false, // Only super admin can manage staff
        canExportBackup: Boolean(adminData.permissions?.canExportBackup),
        canRestoreBackup: false
      },
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setStaffAdmins(prev => [...prev, newAdmin]);
    await saveAdminUserToCloud(newAdmin);

    logPlatformAuditAction({
      action: 'staff_admin_created',
      actionLabel: 'إضافة حساب إدارة جديد 👥',
      entityType: 'adminUser',
      entityId: newAdmin.id,
      details: `تم إنشاء حساب إدارة جديد للمعلم (${newAdmin.name}) بصلاحيات مخصصة`,
      performedByUid: currentAdminUser.uid,
      performedByName: currentAdminUser.name
    }).catch(() => {});

    addToast(`تم إضافة حساب الإدارة (${newAdmin.name}) بنجاح! 🎉`, 'success');
    return newAdmin;
  };

  const updateStaffAdmin = async (adminId, updatedData) => {
    let updatedObj = null;
    setStaffAdmins(prev => {
      const updated = prev.map(a => {
        if (a.id === adminId) {
          updatedObj = { ...a, ...updatedData, updatedAt: new Date().toISOString() };
          return updatedObj;
        }
        return a;
      });
      return updated;
    });

    if (updatedObj) {
      await saveAdminUserToCloud(updatedObj);
      logPlatformAuditAction({
        action: 'staff_admin_updated',
        actionLabel: 'تعديل صلاحيات حساب إدارة ⚙️',
        entityType: 'adminUser',
        entityId: adminId,
        details: `تم تحديث صلاحيات أو بيانات المشرف (${updatedObj.name})`,
        performedByUid: currentAdminUser.uid,
        performedByName: currentAdminUser.name
      }).catch(() => {});
      addToast(`تم تحديث صلاحيات (${updatedObj.name}) بنجاح! 💾`, 'success');
    }
  };

  const deleteStaffAdmin = async (adminId) => {
    const target = staffAdmins.find(a => a.id === adminId);
    if (!target) return;
    if (target.role === 'super_admin' || target.id === 'admin-super-01') {
      addToast('لا يمكن حذف حساب المالك الرئيسي للمنصة!', 'error');
      return;
    }

    setStaffAdmins(prev => prev.filter(a => a.id !== adminId));
    await deleteAdminUserFromCloud(adminId);

    logPlatformAuditAction({
      action: 'staff_admin_deleted',
      actionLabel: 'حذف حساب إدارة 🗑️',
      entityType: 'adminUser',
      entityId: adminId,
      details: `تم حذف حساب الإدارة (${target.name}) دون المساس بأي من محاضراته أو محتوياته المنشورة`,
      performedByUid: currentAdminUser.uid,
      performedByName: currentAdminUser.name
    }).catch(() => {});

    addToast(`تم حذف حساب المشرف (${target.name}) بنجاح. مع بقاء كافة المحاضرات والامتحانات محفوظة بالمنصة بنسبة 100%! 🛡️`, 'info');
  };

  // -------------------------------------------------------------
  // Full Platform Backup & Restore Engine (نظام النسخ الاحتياطي والاستعادة)
  // -------------------------------------------------------------

  const exportPlatformBackup = () => {
    const backupSnapshot = {
      meta: {
        platformName: 'منصة مستر مايكل شحاتة التعليمية',
        version: '3.0.0-unified',
        exportedAt: new Date().toISOString(),
        exportedBy: currentAdminUser.name,
        exportedByUid: currentAdminUser.uid,
        totalLectures: lectures.length,
        totalSections: sections.length,
        totalGeneralExams: generalExams.length,
        totalStudents: students.length,
        totalCodes: accessCodes.length + generalExamCodes.length
      },
      data: {
        teacherProfile,
        stages,
        sections,
        lectures,
        booklets,
        topAchievers,
        accessCodes,
        students,
        transactions,
        announcements,
        examsData,
        generalExams,
        generalExamCodes,
        staffAdmins,
        examSubmissions
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupSnapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateFormatted = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadAnchor.setAttribute('download', `platform-backup-mr-michael-${dateFormatted}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logPlatformAuditAction({
      action: 'backup_exported',
      actionLabel: 'تصدير نسخة احتياطية كاملة 💾',
      entityType: 'platform',
      entityId: 'backup',
      details: `تم تصدير نسخة احتياطية شاملة لكامل المنصة بواسطة ${currentAdminUser.name}`,
      performedByUid: currentAdminUser.uid,
      performedByName: currentAdminUser.name
    }).catch(() => {});

    addToast('تم تجهيز وتنزيل النسخة الاحتياطية الشاملة للمنصة بنجاح! 💾🛡️', 'success', 5000);
    return backupSnapshot;
  };

  const restorePlatformBackup = async (backupJsonString, isDryRun = false) => {
    try {
      const parsed = typeof backupJsonString === 'string' ? JSON.parse(backupJsonString) : backupJsonString;
      if (!parsed || !parsed.data) {
        throw new Error('ملف النسخة الاحتياطية غير صالح أو لا يحتوي على بنية البيانات السليمة.');
      }

      const { data } = parsed;

      if (isDryRun) {
        return {
          valid: true,
          meta: parsed.meta,
          summary: {
            lecturesCount: (data.lectures || []).length,
            sectionsCount: (data.sections || []).length,
            generalExamsCount: (data.generalExams || []).length,
            studentsCount: (data.students || []).length,
            codesCount: (data.accessCodes || []).length + (data.generalExamCodes || []).length,
            exportedAt: parsed.meta?.exportedAt
          }
        };
      }

      // Execute actual restore
      if (Array.isArray(data.stages)) setStages(data.stages);
      if (Array.isArray(data.sections)) setSections(data.sections);
      if (Array.isArray(data.lectures)) setLectures(data.lectures);
      if (Array.isArray(data.booklets)) setBooklets(data.booklets);
      if (Array.isArray(data.topAchievers)) setTopAchievers(data.topAchievers);
      if (Array.isArray(data.accessCodes)) setAccessCodes(data.accessCodes);
      if (Array.isArray(data.students)) setStudents(data.students);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.announcements)) setAnnouncements(data.announcements);
      if (data.examsData && typeof data.examsData === 'object') setExamsData(data.examsData);
      if (Array.isArray(data.generalExams)) setGeneralExams(data.generalExams);
      if (Array.isArray(data.generalExamCodes)) setGeneralExamCodes(data.generalExamCodes);
      if (data.teacherProfile && typeof data.teacherProfile === 'object') setTeacherProfile(data.teacherProfile);

      logPlatformAuditAction({
        action: 'backup_restored',
        actionLabel: 'استعادة كاملة للمنصة من نسخة احتياطية ♻️',
        entityType: 'platform',
        entityId: 'backup',
        details: `تم استعادة بيانات المنصة بالكامل من ملف النسخة الاحتياطية المؤرخ في ${parsed.meta?.exportedAt || 'تاريخ غير محدد'}`,
        performedByUid: currentAdminUser.uid,
        performedByName: currentAdminUser.name
      }).catch(() => {});

      addToast('تمت استعادة كافة بيانات ومحتويات المنصة بنجاح تام! 🚀', 'success', 6000);
      return { success: true };
    } catch (err) {
      console.error('Backup restore error:', err);
      addToast(`فشلت استعادة النسخة الاحتياطية: ${err.message}`, 'error', 6000);
      return { success: false, error: err.message };
    }
  };

  return (
    <TeacherContext.Provider
      value={{
        teacherProfile,
        stages,
        lectures,
        booklets,
        topAchievers,
        resolveVideoSource,
        accessCodes,
        students,
        unlockedLectureIds,
        completedLectureIds,
        homeworkSubmissions,
        examResults,
        videoWatchProgress,
        manualOverrides,
        examsData,
        examSubmissions,
        generalExams,
        generalExamCodes,
        saveGeneralExam,
        deleteGeneralExam,
        generateGeneralExamCode,
        bulkGenerateGeneralExamCodes,
        resetGeneralExamAttempt,
        cancelGeneralExamCode,
        verifyAndRedeemGeneralExamCode,
        submitGeneralExam,
        subscriptionAuditLogs,
        updateLectureWatchProgress,
        overrideUnlockLecture,
        revokeOverrideLecture,
        canAccessLecture,
        announcements,
        addStudent,
        updateStudent,
        deleteStudent,
        toggleStudentStatus,
        recordPayment,
        generatePaymentReminderWhatsApp,
        generateStudentReceiptWhatsApp,
        updateTeacherProfile,
        uploadNewLecture,
        updateLecture,
        deleteLecture,
        restoreLecture,
        restoreGeneralExam,
        staffAdmins,
        currentAdminUser,
        hasPermission,
        addStaffAdmin,
        updateStaffAdmin,
        deleteStaffAdmin,
        platformAuditLogs,
        exportPlatformBackup,
        restorePlatformBackup,
        addStage,
        deleteStage,
        addBooklet,
        deleteBooklet,
        addAchiever,
        deleteAchiever,
        generateNewCode,
        deleteCode,
        toggleCodeStatus,
        sections,
        addSection,
        updateSection,
        deleteSection,
        moveLectureToSection,
        transactions,
        recordTransaction,
        postAnnouncement,
        deleteAnnouncement,
        resetToFactoryDefaults,
        redeemCode,
        getSubscriptionStatus,
        isLectureUnlocked,
        markLectureComplete,
        submitHomework,
        submitExam,
        saveExamToLecture,
        deleteExamFromLecture,
        submitStudentExamDetailed,
        gradeManualExamSubmission,
        pauseStudentSubscription,
        resumeStudentSubscription,
        extendStudentSubscription,
        cancelStudentSubscription,
        toggleStudentFreeze,
        bulkUpdateSubscriptions,
        generateParentWhatsAppReport,
        syncAllToFirebase,
        changeTeacherPassword
      }}
    >
      {children}
    </TeacherContext.Provider>
  );
}

export const useTeacher = () => useContext(TeacherContext);
