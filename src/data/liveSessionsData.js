export const liveSessionsData = [
  {
    id: "live-1",
    title: "ورشة عمل حية: بناء وكيل ذكاء اصطناعي (Autonomous AI Agent) خطوة بخطوة",
    instructor: {
      name: "د. سارة المنصور",
      title: "أستاذة الذكاء الاصطناعي",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
    },
    date: "الليلة، الساعة 8:30 مساءً (توقيت مكة)",
    duration: "90 دقيقة",
    attendeesCount: 380,
    status: "live", // "live" | "upcoming" | "ended"
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    description: "بث تطبيقي مباشر نقوم فيه ببناء وكيل ذكي يستطيع تصفح الويب واستخراج البيانات وكتابة تقرير تحليلي تلقائياً.",
    streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    chatMessages: [
      { id: "cm-1", user: "أحمد الغامدي", text: "متحمس جداً للورشة! هل سيتم استخدام LangGraph؟", time: "20:31" },
      { id: "cm-2", user: "سارة الزهراني", text: "الصوت والصورة ممتازين جداً 👍", time: "20:32" },
      { id: "cm-3", user: "م. طارق العتيبي", text: "أهلاً بالجميع، متابع معكم ونرحب بكل الأسئلة.", time: "20:33" }
    ]
  },
  {
    id: "live-2",
    title: "جلسة مراجعة ونقد ملفات أعمال المصممين (Portfolio Review)",
    instructor: {
      name: "أ. ريم الشمري",
      title: "Lead Product Designer",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
    },
    date: "الخميس القادم، 7:00 مساءً",
    duration: "120 دقيقة",
    attendeesCount: 520,
    status: "upcoming",
    coverImage: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80",
    description: "جلسة حية لمراجعة تصاميم الطلاب وتقديم ملاحظات مباشرة لتحسين فرص الحصول على عروض عمل عالمية."
  }
];
