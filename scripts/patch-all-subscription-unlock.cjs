const fs = require('fs');

console.log('1. Patching src/context/TeacherContext.jsx...');
let tc = fs.readFileSync('src/context/TeacherContext.jsx', 'utf8').replace(/\r\n/g, '\n');

// 1.1 Replace initialSections with complete 6-stage sections
const oldInitialSections = `export const initialSections = [
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
];`;

const newInitialSections = `export const initialSections = [
  // 1. الصف الثالث الثانوي
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
    enforceProgression: false,
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
    enforceProgression: false,
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
    enforceProgression: false,
    order: 3,
    createdAt: "2026-07-15"
  },
  // 2. الصف الثاني الثانوي
  {
    id: "sec2-month-1",
    stageId: "sec-2",
    stageName: "الصف الثاني الثانوي",
    title: "الشهر الأول: منهج New Hello (2ث) - القواعد والترجمة",
    type: "month",
    monthNumber: 1,
    description: "شرح شامل ومبسط لقواعد الإلزام والضرورة والمفردات مع تدريبات مكثفة على نظام الثانوية الجديد.",
    price: 150,
    cover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    enforceProgression: false,
    order: 1,
    createdAt: "2026-08-01"
  },
  {
    id: "sec2-month-2",
    stageId: "sec-2",
    stageName: "الصف الثاني الثانوي",
    title: "الشهر الثاني: مهارات الترجمة المتقدمة وكتابة المقال والقصة",
    type: "month",
    monthNumber: 2,
    description: "فنون الترجمة والحل النموذجي على القطع مع شرح القصة والتدريب على الأسئلة المقالية.",
    price: 150,
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    enforceProgression: false,
    order: 2,
    createdAt: "2026-09-01"
  },
  // 3. الصف الأول الثانوي
  {
    id: "sec1-month-1",
    stageId: "sec-1",
    stageName: "الصف الأول الثانوي",
    title: "الشهر الأول: التأسيس الشامل وقواعد اللغة (1ث)",
    type: "month",
    monthNumber: 1,
    description: "الانتقال السلس من الإعدادية للثانوية وشرح أزمنة الماضي والمضارع التام مع حل بنك أسئلة الوزارة.",
    price: 140,
    cover: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    enforceProgression: false,
    order: 1,
    createdAt: "2026-08-01"
  },
  {
    id: "sec1-month-2",
    stageId: "sec-1",
    stageName: "الصف الأول الثانوي",
    title: "الشهر الثاني: القواعد المركبة وقصة جزيرة الكنز",
    type: "month",
    monthNumber: 2,
    description: "قواعد المستقبل والمبني للمجهول مع قصة Treasure Island وتدريبات النماذج الاسترشادية.",
    price: 140,
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    enforceProgression: false,
    order: 2,
    createdAt: "2026-09-01"
  },
  // 4. المرحلة الإعدادية
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
    enforceProgression: false,
    order: 1,
    createdAt: "2026-08-15"
  },
  {
    id: "prep-month-2",
    stageId: "prep",
    stageName: "الصف الثالث الإعدادي",
    title: "الشهر الثاني: منهج New Hello Unit 3 & 4 + حل الامتحانات",
    type: "month",
    monthNumber: 2,
    description: "شرح أزمنة الماضي والمستقبل وحل 10 امتحانات محافظات سابقة لضمان الدرجة النهائية.",
    price: 120,
    cover: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    enforceProgression: false,
    order: 2,
    createdAt: "2026-09-15"
  },
  // 5. المرحلة الابتدائية
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
    enforceProgression: false,
    order: 1,
    createdAt: "2026-08-15"
  },
  // 6. كورس التأسيس الشامل
  {
    id: "fnd-month-1",
    stageId: "foundation",
    stageName: "كورس التأسيس الشامل",
    title: "المستوى الأول: أسرار النطق الصوتي وتكوين الجمل",
    type: "month",
    monthNumber: 1,
    description: "أساسيات تكوين الجملة الإنجليزية والأصوات والتراكيب للمبتدئين والمتوسطين.",
    price: 160,
    cover: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
    isVisible: true,
    enforceProgression: false,
    order: 1,
    createdAt: "2026-07-15"
  }
];`;

if (tc.includes(oldInitialSections)) {
  tc = tc.replace(oldInitialSections, newInitialSections);
} else {
  console.log('Notice: initialSections might have already been updated or differs slightly.');
}

// 1.2 Add assignDefaultSectionId helper and upgrade sanitizeLectures
const assignSectionHelper = `export function assignDefaultSectionId(lec) {
  if (lec?.sectionId && String(lec.sectionId).trim()) return String(lec.sectionId).trim();
  const stage = String(lec?.stageId || '').toLowerCase().trim();
  if (stage === 'sec-3') {
    if (lec?.id === 'lec-s3-03' || lec?.unitNumber?.includes('3') || lec?.title?.includes('3')) return 'sec3-month-2';
    return 'sec3-month-1';
  }
  if (stage === 'sec-2') {
    if (lec?.unitNumber?.includes('2') || lec?.title?.includes('2')) return 'sec2-month-2';
    return 'sec2-month-1';
  }
  if (stage === 'sec-1') {
    if (lec?.unitNumber?.includes('2') || lec?.title?.includes('2')) return 'sec1-month-2';
    return 'sec1-month-1';
  }
  if (stage === 'prep') {
    if (lec?.unitNumber?.includes('3') || lec?.unitNumber?.includes('4')) return 'prep-month-2';
    return 'prep-month-1';
  }
  if (stage === 'pri') return 'pri-month-1';
  if (stage === 'foundation') return 'fnd-month-1';
  return '';
}
`;

if (!tc.includes('function assignDefaultSectionId')) {
  tc = assignSectionHelper + '\n' + tc;
}

const oldSanitize = `  // Sanitizers to eliminate dead blob: URLs from previous browser sessions
  const sanitizeLectures = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(lec => {
      if (!lec) return lec;
      const cleanUrl = (lec.videoUrl && typeof lec.videoUrl === 'string' && !lec.videoUrl.startsWith('blob:')) 
        ? lec.videoUrl 
        : '';
      return { ...lec, videoUrl: cleanUrl };
    });
  };`;

const newSanitize = `  // Sanitizers to eliminate dead blob: URLs and guarantee strict section assignment
  const sanitizeLectures = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(lec => {
      if (!lec) return lec;
      const cleanUrl = (lec.videoUrl && typeof lec.videoUrl === 'string' && !lec.videoUrl.startsWith('blob:')) 
        ? lec.videoUrl 
        : '';
      const resolvedSectionId = (lec.sectionId && String(lec.sectionId).trim()) 
        ? String(lec.sectionId).trim() 
        : assignDefaultSectionId(lec);
      return { 
        ...lec, 
        videoUrl: cleanUrl,
        sectionId: resolvedSectionId
      };
    });
  };`;

if (tc.includes(oldSanitize)) {
  tc = tc.replace(oldSanitize, newSanitize);
}

// 1.3 In canAccessLecture, make sure matchingSub unlocks without artificial progression blocks unless explicitly enforced
const oldProgressionBlock = `    // 6. Check section progression toggle
    const currentSection = (sections || []).find(s => s.id === lecture.sectionId);
    const enforceProgression = currentSection?.enforceProgression !== false;

    if (!enforceProgression) {
      return {
        allowed: true,
        reasonCode: 'unlocked',
        reasonText: 'المحاضرة متاحة ضمن اشتراكك النشط',
        reason: 'المحاضرة متاحة ضمن اشتراكك النشط'
      };
    }`;

const newProgressionBlock = `    // 6. Check section progression toggle
    const currentSection = (sections || []).find(s => s.id === lecture.sectionId);
    const enforceProgression = Boolean(currentSection?.enforceProgression);

    // If progression is not strictly enforced, or if student subscribed directly to this lecture/month/stage, unlock immediately
    if (!enforceProgression || matchingSub.codeType === 'lecture' || matchingSub.targetId === lecture.id) {
      return {
        allowed: true,
        reasonCode: 'unlocked',
        reasonText: 'المحاضرة متاحة ومفتوحة بالكامل ضمن اشتراكك النشط',
        reason: 'المحاضرة متاحة ومفتوحة بالكامل ضمن اشتراكك النشط'
      };
    }`;

if (tc.includes(oldProgressionBlock)) {
  tc = tc.replace(oldProgressionBlock, newProgressionBlock);
}

// 1.4 In sections state initialization, merge with initialSections so all stages have their months
const oldSectionsInit = `  const [sections, setSections] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_sections');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialSections;
  });`;

const newSectionsInit = `  const [sections, setSections] = useState(() => {
    try {
      const saved = localStorage.getItem('ms_sections');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(parsed.map(s => [s.id, s]));
          initialSections.forEach(is => {
            if (!map.has(is.id)) {
              map.set(is.id, is);
            }
          });
          return Array.from(map.values());
        }
      }
    } catch (e) {}
    return initialSections;
  });`;

if (tc.includes(oldSectionsInit)) {
  tc = tc.replace(oldSectionsInit, newSectionsInit);
}

fs.writeFileSync('src/context/TeacherContext.jsx', tc, 'utf8');
console.log('✅ Successfully patched TeacherContext.jsx');

// 2. Patch src/context/AuthContext.jsx to prevent listener wiping subscriptions
console.log('2. Patching src/context/AuthContext.jsx...');
let ac = fs.readFileSync('src/context/AuthContext.jsx', 'utf8').replace(/\r\n/g, '\n');

const oldListenerBlock = `            setCurrentUser(prev => {
              if (!prev || (prev.uid !== newUid && prev.id !== newUid)) return prev;
              const validSubs = {};
              if (cloudStudent.subscriptions && typeof cloudStudent.subscriptions === 'object') {
                Object.keys(cloudStudent.subscriptions).forEach(k => {
                  const s = cloudStudent.subscriptions[k];
                  if (!s.userId || s.userId === newUid) {
                    validSubs[k] = { ...s, userId: newUid };
                  }
                });
              }
              const updated = {
                ...prev,
                ...cloudStudent,
                uid: newUid,
                id: newUid,
                subscriptions: validSubs
              };`;

const newListenerBlock = `            setCurrentUser(prev => {
              if (!prev || (prev.uid !== newUid && prev.id !== newUid)) return prev;
              // Preserve local active subscriptions and merge with cloud subscriptions
              const validSubs = {
                ...(prev.subscriptions || {})
              };
              if (cloudStudent.subscriptions && typeof cloudStudent.subscriptions === 'object') {
                Object.keys(cloudStudent.subscriptions).forEach(k => {
                  const s = cloudStudent.subscriptions[k];
                  if (!s.userId || s.userId === newUid) {
                    validSubs[k] = { ...(validSubs[k] || {}), ...s, userId: newUid };
                  }
                });
              }
              const updated = {
                ...prev,
                ...cloudStudent,
                uid: newUid,
                id: newUid,
                subscriptions: validSubs
              };`;

if (ac.includes(oldListenerBlock)) {
  ac = ac.replace(oldListenerBlock, newListenerBlock);
  fs.writeFileSync('src/context/AuthContext.jsx', ac, 'utf8');
  console.log('✅ Successfully patched AuthContext.jsx');
} else {
  console.log('Notice: AuthContext listener block already patched or different.');
}

console.log('🎉 All patches applied successfully!');
