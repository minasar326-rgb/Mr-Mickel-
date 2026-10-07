export const communityDiscussions = [
  {
    id: "post-1",
    author: {
      name: "فيصل الشريف",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      role: "طالب"
    },
    title: "ما هو أفضل نمط لإدارة الحالة في تطبيقات React الكبيرة في 2026؟",
    content: "أعمل على مشروع ضخم يحتوي على عربة تسوق ولوحة تحكم ومحادثة فورية. هل تنصحون بـ Zustand أم Redux Toolkit أم الاعتماد فقط على Server State مع TanStack Query؟",
    category: "تطوير الويب",
    upvotes: 42,
    answersCount: 7,
    createdAt: "منذ 3 ساعات",
    isSolved: true,
    tags: ["React", "Zustand", "State Management"],
    topAnswer: {
      author: {
        name: "م. طارق العتيبي",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        badge: "مدرب معتمد"
      },
      content: "أهلاً فيصل، القاعدة الذهبية في 2026: 90% من بياناتك هي Server State استخدم لها TanStack Query أو Next.js Server Components. أما الـ Client State المتبقي (مثل المودال، الثيم، الفلاتر) فـ Zustand خفيف جداً وأسهل بكثير من Redux.",
      upvotes: 35,
      isAccepted: true
    }
  },
  {
    id: "post-2",
    author: {
      name: "ريم الحربي",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      role: "طالبة"
    },
    title: "كيف أبدأ في بناء نظام RAG للبحث في مستندات الـ PDF الخاصة بشركتي؟",
    content: "أريد بناء تطبيق يتيح للموظفين رفع ملفات PDF وطرح أسئلة عليها والحصول على إجابات دقيقة مع ذكر الصفحة المرجعية.",
    category: "الذكاء الاصطناعي",
    upvotes: 29,
    answersCount: 4,
    createdAt: "منذ 6 ساعات",
    isSolved: false,
    tags: ["RAG", "Python", "Vector DB", "Embeddings"]
  },
  {
    id: "post-3",
    author: {
      name: "عمر الدوسري",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      role: "طالب"
    },
    title: "نصائح لاجتياز المقابلة التقنية في تصميم الـ System Design؟",
    content: "لدي مقابلة الأسبوع القادم في شركة تقنية كبرى لمنصب Senior Frontend. ما هي أهم المخططات التي يجب أن أركز عليها؟",
    category: "التوظيف والمهنة",
    upvotes: 56,
    answersCount: 12,
    createdAt: "منذ يومين",
    isSolved: true,
    tags: ["System Design", "Frontend", "Career"]
  }
];
