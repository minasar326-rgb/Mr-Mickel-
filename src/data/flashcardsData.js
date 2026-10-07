export const flashcardsData = {
  "fullstack-react-nextjs": [
    {
      id: "fc-1",
      question: "ما هو الفارق الأساسي بين useMemo و useCallback؟",
      answer: "useMemo تحفظ القيمة المحسوبة (Computed Value) بينما useCallback تحفظ مرجع الدالة نفسها (Function Reference) لتجنب إعادة إنشائها مع كل Render.",
      category: "React"
    },
    {
      id: "fc-2",
      question: "كيف تحمي خادمك من ثغرات Server Actions في Next.js؟",
      answer: "بالتحقق الدائم من صلاحيات المستخدم وجلسة تسجيل الدخول (Session Authentication) والتحقق من صحة المدخلات باستخدام مكتبة مثل Zod قبل إجراء أي عملية في قاعدة البيانات.",
      category: "Security"
    },
    {
      id: "fc-3",
      question: "ما هو الـ Hydration Error في SSR؟",
      answer: "يحدث عندما تختلف شجرة الـ HTML المولدة على الخادم عن الشجرة الأولية التي يحاول المتصفح بناءها أثناء عملية الـ Hydration (مثل استخدام Date.now() أو window.innerWidth مباشرة في التصيير الأولي).",
      category: "Next.js"
    }
  ],
  "genai-prompt-engineering": [
    {
      id: "fc-ai-1",
      question: "ما هو مفهوم الـ Temperature في النماذج التوليدية؟",
      answer: "معامل يتحكم في درجة العشوائية والإبداع. قيمة منخفضة (0.0 - 0.2) تعطي إجابات دقيقة ومحددة، بينما القيمة المرتفعة (0.7 - 1.0) تعطي إجابات إبداعية ومتنوعة.",
      category: "GenAI"
    },
    {
      id: "fc-ai-2",
      question: "ما هو الفرق بين Fine-Tuning و RAG؟",
      answer: "الـ Fine-Tuning يدرب أوزان النموذج على أسلوب أو لغة معينة، بينما RAG يزود النموذج بسياق ومعلومات حديثة ومحددة من قاعدة بيانات المتجهات وقت السؤال دون إعادة تدريب الأوزان.",
      category: "Architecture"
    }
  ]
};
