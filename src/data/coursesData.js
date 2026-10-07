export const coursesData = [
  {
    id: "fullstack-react-nextjs",
    slug: "fullstack-react-nextjs",
    title: "المسار الشامل لاحتراف تطوير الويب الحديث (Full-Stack React & Next.js 15)",
    subtitle: "تعلم بناء تطبيقات ويب واقعية، قابلة للتوسع ومجهزة بالذكاء الاصطناعي من البداية حتى النشر السحابي.",
    category: "web-development",
    level: "جميع المستويات",
    rating: 4.9,
    reviewsCount: 1240,
    studentsCount: 8450,
    duration: "42 ساعة",
    lessonsCount: 68,
    price: 349,
    originalPrice: 799,
    badge: "الأكثر مبيعاً 🔥",
    language: "العربية",
    certificateAvailable: true,
    lastUpdated: "أغسطس 2026",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    promoVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    instructor: {
      id: "inst-1",
      name: "م. طارق العتيبي",
      title: "كبير مهندسي البرمجيات ومستشار التقنية",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      rating: 4.95,
      studentsCount: 32000,
      coursesCount: 6,
      bio: "خبرة أكثر من 12 عاماً في بناء منصات التجارة الإلكترونية والأنظمة السحابية المعقدة لشركات Fortune 500."
    },
    learningObjectives: [
      "إتقان أحدث ميزات React 19 و Next.js 15 مع Server Components و Server Actions",
      "بناء واجهات مستخدم مذهلة وسريعة الاستجابة بأعلى معايير الأداء والـ SEO",
      "تصميم وبرمجة قواعد بيانات PostgreSQL مع Prisma ORM وتوثيق المستخدمين بأمان",
      "دمج أدوات ونماذج الذكاء الاصطناعي (OpenAI & Gemini API) داخل تطبيقات الويب",
      "نشر التطبيقات على Vercel و AWS مع إعداد خطوط الإنتاج والـ CI/CD"
    ],
    requirements: [
      "معرفة أساسية بأساسيات HTML و CSS و JavaScript (ES6+)",
      "جهاز حاسوب متصل بالإنترنت (Windows أو Mac أو Linux)",
      "الشغف والرغبة في بناء مشاريع حقيقية لسوق العمل"
    ],
    targetAudience: [
      "المطورون المبتدئون الراغبون في التحول إلى مطوري Full Stack محترفين",
      "مطورو الواجهات الأمامية (Frontend) الراغبون في تعلم خفايا الـ Backend و Next.js",
      "أصحاب المشاريع التقنية الراغبون في بناء نماذج أعمالهم الأولية (MVP) بأنفسهم"
    ],
    modules: [
      {
        id: "mod-1",
        title: "الوحدة 1: الأساسيات الصلبة وبيئة العمل الحديثة",
        duration: "3 ساعات",
        lessons: [
          {
            id: "les-101",
            title: "مقدمة المسار وخريطة الطريق للمستقبل",
            duration: "12:30",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            summary: "نظرة عامة على محاور المسار وكيفية الاستفادة القصوى من المشاريع العملية ونظام التقييم والشهادات.",
            resources: [
              { name: "خارطة طريق المطور 2026 (PDF)", size: "2.4 MB", url: "#" },
              { name: "روابط المستودعات البرمجية (GitHub)", size: "رابط خارجي", url: "#" }
            ],
            notes: "أهم نصيحة: التطبيق العملي وكتابة الأكواد بيدك هو سر الاحتراف الحقيقي."
          },
          {
            id: "les-102",
            title: "تهيئة بيئة العمل المتكاملة (VS Code & Node.js)",
            duration: "18:45",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            summary: "شرح أفضل الإضافات لـ VS Code، تهيئة الـ ESLint والـ Prettier لإتقان كتابة الكود النظيف.",
            resources: [
              { name: "ملف إعدادات VS Code الموصى به", size: "15 KB", url: "#" }
            ]
          },
          {
            id: "les-103",
            title: "اختبار سريع: أساسيات JavaScript الحديثة",
            duration: "10 دقائق",
            type: "quiz",
            quizData: {
              title: "اختبار مراجعة ES6+ و مفاهيم الـ Asynchronous",
              passingScore: 70,
              questions: [
                {
                  id: "q1",
                  question: "ما هي الفائدة الأساسية من استخدام Server Components في Next.js؟",
                  options: [
                    "تقليل حجم حزمة الجافاسكريبت المرسلة للعميل وتحسين الأداء وسرعة التحميل",
                    "السماح بتشغيل الـ useState والـ useEffect في الخادم",
                    "إلغاء الحاجة لقواعد البيانات كلياً",
                    "تسريع عمليات التصميم فقط"
                  ],
                  correctAnswer: 0,
                  explanation: "تعمل Server Components على الخادم بالكامل ولا ترسل كود الجافاسكريبت الخاص بها للمتصفح، مما يخفف الحمل ويسرع وقت التحميل الأولي (LCP)."
                },
                {
                  id: "q2",
                  question: "أي مما يلي يُعد الطريقة الصحيحة لتعريف دالة غير متزامنة في JavaScript؟",
                  options: [
                    "function async myFunc() {}",
                    "async function myFunc() {}",
                    "sync function myFunc() {}",
                    "function myFunc() await {}"
                  ],
                  correctAnswer: 1,
                  explanation: "الكلمة المفتاحية `async` توضع قبل الكلمة `function` أو قبل معلمات الدالة السهمية `async () => {}`."
                },
                {
                  id: "q3",
                  question: "ماذا يُقصد بمفهوم الـ Immutability في إدارة حالة React؟",
                  options: [
                    "تعديل المصفوفات والكائنات مباشرة",
                    "عدم تعديل الحالة الأصلية مباشرة وإنما إنشاء نسخة جديدة منها",
                    "حذف المتغيرات غير المستخدمة تلقائياً",
                    "تخزين المتغيرات في الذاكرة الدائمة فقط"
                  ],
                  correctAnswer: 1,
                  explanation: "في React يجب دائماً عدم تعديل الـ state مباشرة بل تمرير نسخة جديدة (كاستخدام Spread Operator `[...prev, newItem]`) حتى يتعرف React على التغيير ويعيد التصيير."
                }
              ]
            }
          },
          {
            id: "les-104",
            title: "تحدي برمجي: بناء محول عملات تفاعلي",
            duration: "25 دقيقة",
            type: "code",
            codeChallenge: {
              title: "بناء مكون React بسيط لحساب قيمة العملة بالريال",
              instructions: "قم بكتابة دالة تقوم بضرب المبلغ المدخل بسعر الصرف الحالي وعرض النتيجة بشكل منسق.",
              initialCode: `function CurrencyConverter() {
  const [amount, setAmount] = React.useState(100);
  const rate = 3.75; // 1 USD = 3.75 SAR

  return (
    <div style={{ padding: '20px', fontFamily: 'Cairo, sans-serif' }}>
      <h3>محول العملات (USD إلى SAR)</h3>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(Number(e.target.value))}
        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
      />
      <p style={{ marginTop: '12px', fontSize: '18px', fontWeight: 'bold', color: '#4F46E5' }}>
        المبلغ بالريال السعودي: {amount * rate} ر.س
      </p>
    </div>
  );
}`,
              solutionCode: `function CurrencyConverter() {
  const [amount, setAmount] = React.useState(100);
  const rate = 3.75;

  return (
    <div style={{ padding: '20px', fontFamily: 'Cairo, sans-serif', background: '#F8FAFC', borderRadius: '12px' }}>
      <h3 style={{ color: '#0F172A', marginBottom: '10px' }}>محول العملات الذكي (USD إلى SAR)</h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>المبلغ بالدولار ($):</label>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
        />
      </div>
      <div style={{ marginTop: '16px', padding: '12px', background: '#EEF2FF', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#4F46E5' }}>
          الإجمالي بالريال السعودي: {(amount * rate).toLocaleString()} ر.س
        </p>
      </div>
    </div>
  );
}`
            }
          }
        ]
      },
      {
        id: "mod-2",
        title: "الوحدة 2: إتقان React 19 والهوك المتقدمة (Custom Hooks & State)",
        duration: "8 ساعات",
        lessons: [
          {
            id: "les-201",
            title: "فهم دورة حياة المكونات ومحرك الـ Reconciliation",
            duration: "24:10",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
            summary: "كيف يقرر React متى يعيد تصيير المكونات وكيفية تجنب الـ Re-renders غير الضرورية."
          },
          {
            id: "les-202",
            title: "بناء Custom Hooks احترافية لإدارة الـ APIs والـ Storage",
            duration: "31:40",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
            summary: "بناء useFetch و useLocalStorage و useDebounce مع توفير Type-Safety كاملة."
          },
          {
            id: "les-203",
            title: "إدارة الحالة العالمية باستخدام Zustand و Context API",
            duration: "28:15",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
            summary: "المقارنة العملية بين Redux Toolkit و Zustand و متى تختار كل منهما."
          }
        ]
      },
      {
        id: "mod-3",
        title: "الوحدة 3: بناء منصة كاملة بـ Next.js 15 مع الذكاء الاصطناعي",
        duration: "15 ساعة",
        lessons: [
          {
            id: "les-301",
            title: "معمارية App Router و Server Components بالتفصيل",
            duration: "35:00",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
            summary: "شرح الـ Layouts, Templates, Error Boundaries, و Loading Skeletons."
          },
          {
            id: "les-302",
            title: "دمج Gemini API لبناء شات بوت تعليمي ذكي وتوليد ملخصات",
            duration: "42:20",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
            summary: "استخدام الـ Streaming Responses والـ Function Calling لبناء تجربة مستخدم فورية."
          },
          {
            id: "les-303",
            title: "مشروع التخرج: إطلاق المنصة وحساب الأداء والشهادة",
            duration: "48:00",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            summary: "ربط بوابة الدفع، تهيئة النطاق، والتحقق من درجات Core Web Vitals 100/100."
          }
        ]
      }
    ]
  },
  {
    id: "genai-prompt-engineering",
    slug: "genai-prompt-engineering",
    title: "هندسة الأوامر وتطبيقات الذكاء الاصطناعي التوليدي (GenAI & LLMs)",
    subtitle: "أتقن توجيه النماذج اللغوية الكبيرة وبناء وكلاء أذكياء (AI Agents) ينجزون المهام المعقدة تلقائياً.",
    category: "ai-machine-learning",
    level: "متوسط",
    rating: 4.95,
    reviewsCount: 930,
    studentsCount: 6120,
    duration: "28 ساعة",
    lessonsCount: 45,
    price: 299,
    originalPrice: 650,
    badge: "الأعلى تقييماً ⭐",
    language: "العربية",
    certificateAvailable: true,
    lastUpdated: "يوليو 2026",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
    promoVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    instructor: {
      id: "inst-2",
      name: "د. سارة المنصور",
      title: "باحثة ذكاء اصطناعي وأستاذة تعلم الآلة",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      rating: 4.98,
      studentsCount: 19500,
      coursesCount: 4,
      bio: "دكتوراه في الذكاء الاصطناعي ومعالجة اللغات الطبيعية (NLP)، استشارية للعديد من الهيئات التقنية."
    },
    learningObjectives: [
      "فهم المعمارية الداخلية لنماذج Transformer و Attention Mechanism",
      "احتراف تقنيات Prompting المتقدمة: Chain-of-Thought، Tree-of-Thoughts، و ReAct Framework",
      "بناء أنظمة استرجاع المعلومات وتوليد الإجابات (RAG) باستخدام Vector Databases",
      "بناء وكلاء أذكياء ذاتيي التشغيل (Autonomous AI Agents) باستخدام LangChain و LlamaIndex"
    ],
    requirements: [
      "معرفة أساسية بلغة البرمجة Python",
      "فهم المفاهيم المنطقية وأساسيات البيانات"
    ],
    targetAudience: [
      "المهندسون والمطورون الراغبون في إضافة ميزات الذكاء الاصطناعي لمنتجاتهم",
      "رواد الأعمال ومديرو المنتجات الباحثون عن أتمتة العمليات بالـ GenAI"
    ],
    modules: [
      {
        id: "gen-1",
        title: "الوحدة 1: الأساس العلمي لنماذج التوليد اللغوي",
        duration: "4 ساعات",
        lessons: [
          {
            id: "gen-101",
            title: "كيف تفكر النماذج اللغوية (Tokenization & Embeddings)",
            duration: "20:00",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            summary: "شرح تحويل النصوص إلى متجهات عددية وكيفية حساب التقارب الدلالي (Cosine Similarity)."
          },
          {
            id: "gen-102",
            title: "اختبار سريع: مبادئ الـ Prompt Engineering",
            duration: "10 دقائق",
            type: "quiz",
            quizData: {
              title: "اختبار مهارات صياغة الأوامر الاحترافية",
              passingScore: 70,
              questions: [
                {
                  id: "gq1",
                  question: "ما هو أسلوب Few-Shot Prompting؟",
                  options: [
                    "إعطاء النموذج أمثلة توضيحية للمدخلات والمخرجات المطلوبة قبل إعطائه المهمة الرئيسية",
                    "تقليل عدد الكلمات لأقل حد ممكن",
                    "طلب الإجابة بكلمة واحدة فقط",
                    "تشغيل النموذج بدون أي توجيه"
                  ],
                  correctAnswer: 0,
                  explanation: "يعتمد Few-Shot على تزويد النموذج بنماذج إجابات مسبقة ليوائم أسلوبه عليها بدقة فائقة."
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "figma-ui-ux-masterclass",
    slug: "figma-ui-ux-masterclass",
    title: "ماستركلاس تصميم تجربة وواجهة المستخدم والـ Design Systems بـ Figma",
    subtitle: "من رسم المخططات السلكية Wireframes وحتى بناء النماذج التفاعلية المتقدمة وأنظمة التصميم لشركات المليار دولار.",
    category: "ui-ux-design",
    level: "مبتدئ إلى متقدم",
    rating: 4.88,
    reviewsCount: 810,
    studentsCount: 5300,
    duration: "32 ساعة",
    lessonsCount: 52,
    price: 249,
    originalPrice: 550,
    badge: "شائع ومميز 🎨",
    language: "العربية",
    certificateAvailable: true,
    lastUpdated: "أغسطس 2026",
    thumbnail: "https://images.unsplash.com/photo-1581291518655-9523c932edcf?auto=format&fit=crop&w=800&q=80",
    promoVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    instructor: {
      id: "inst-3",
      name: "أ. ريم الشمري",
      title: "Lead Product Designer & Design Mentor",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      rating: 4.92,
      studentsCount: 14000,
      coursesCount: 3,
      bio: "صممت واجهات لأكثر من 30 تطبيقاً تخطت ملايين التحميلات في الخليج والشرق الأوسط."
    },
    learningObjectives: [
      "إتقان أسرار Figma المتقدمة: Auto-layout, Variants, Component Properties, و Variables",
      "بناء Design System شامل وقابل للتطوير وتصدير التوكنز للمطورين بسهولة",
      "إجراء أبحاث المستخدم واختبارات قابلية الاستخدام (Usability Testing) وتحليل النتائج",
      "تصميم ملف أعمال (Portfolio) مبهر يجذب مسؤولي التوظيف والعملاء العالميين"
    ],
    requirements: [
      "لا يشترط أي خبرة سابقة في التصميم",
      "تثبيت برنامج Figma (مجاني)"
    ],
    targetAudience: [
      "الراغبون في دخول مجال تصميم تجربة المستخدم والعمل عن بعد",
      "المطورون الراغبون في تحسين مهاراتهم البصرية وتصميم واجهاتهم بأنفسهم"
    ],
    modules: [
      {
        id: "des-1",
        title: "الوحدة 1: أسرار التكوين البصري وتصميم الواجهات",
        duration: "5 ساعات",
        lessons: [
          {
            id: "des-101",
            title: "قواعد التباين البصري والتسلسل الهرمي (Visual Hierarchy)",
            duration: "22:15",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            summary: "كيف توجه عين المستخدم للعناصر المهمة وزر اتخاذ الإجراء (CTA) بسلاسة."
          }
        ]
      }
    ]
  },
  {
    id: "flutter-cross-platform",
    slug: "flutter-cross-platform",
    title: "بناء تطبيقات الجوال الاحترافية بـ Flutter 3 & Dart (iOS & Android)",
    subtitle: "برمجة تطبيقات سريعة، جذابة وبكود برمجي واحد مع الربط بالـ Firebase وREST APIs وقواعد البيانات المحلية.",
    category: "mobile-development",
    level: "متوسط",
    rating: 4.85,
    reviewsCount: 650,
    studentsCount: 4200,
    duration: "36 ساعة",
    lessonsCount: 58,
    price: 279,
    originalPrice: 600,
    badge: "محدث لـ 2026 📱",
    language: "العربية",
    certificateAvailable: true,
    lastUpdated: "يونيو 2026",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    promoVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    instructor: {
      id: "inst-4",
      name: "م. خالد الحربي",
      title: "Google Developer Expert (GDE) - Flutter",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      rating: 4.96,
      studentsCount: 22000,
      coursesCount: 5,
      bio: "مطور تطبيقات معتمد من جوجل، نشر أكثر من 40 تطبيقاً على متجري App Store و Google Play."
    },
    learningObjectives: [
      "إتقان لغة Dart 3 وميزات Pattern Matching و Records",
      "بناء هياكل برمجية معمارية نظيفة (Clean Architecture & BLoC Pattern)",
      "تطبيق الرسوم المتحركة المعقدة والـ Hero Animations",
      "نشر التطبيقات على متاجر التطبيقات والتعامل مع الاشتراكات والـ In-App Purchases"
    ],
    requirements: [
      "معرفة بأساسيات البرمجة كائنية التوجه (OOP)"
    ],
    targetAudience: [
      "مطورو الويب الراغبون في التوسع إلى سوق تطبيقات الجوال",
      "أصحاب التطبيقات الراغبون في إطلاق تطبيقاتهم بكفاءة وتكلفة منخفضة"
    ],
    modules: [
      {
        id: "flt-1",
        title: "الوحدة 1: بيئة Flutter وتركيب الـ Widgets",
        duration: "6 ساعات",
        lessons: [
          {
            id: "flt-101",
            title: "بنية شجرة الـ Widgets وكيف يرسم Flutter الشاشة 60fps",
            duration: "25:00",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
            summary: "الفرق بين StatelessWidget و StatefulWidget وطريقة تحسين الـ Rebuilds."
          }
        ]
      }
    ]
  },
  {
    id: "ethical-hacking-cybersecurity",
    slug: "ethical-hacking-cybersecurity",
    title: "دبلوم الأمن السيبراني واختبار الاختراق الأخلاقي (CEH & Web Penetration)",
    subtitle: "تعلم اكتشاف الثغرات الأمنية، حماية الخوادم والتطبيقات من الهجمات المعقدة، والعمل كمختبر اختراق معتمد.",
    category: "cybersecurity",
    level: "جميع المستويات",
    rating: 4.91,
    reviewsCount: 720,
    studentsCount: 3800,
    duration: "40 ساعة",
    lessonsCount: 62,
    price: 320,
    originalPrice: 750,
    badge: "شهادة معتمدة 🛡️",
    language: "العربية",
    certificateAvailable: true,
    lastUpdated: "أغسطس 2026",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    promoVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    instructor: {
      id: "inst-5",
      name: "م. فهد القحطاني",
      title: "مستشار أمن المعلومات والقرصنة الأخلاقية (CISSP, CEH)",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      rating: 4.94,
      studentsCount: 16000,
      coursesCount: 4,
      bio: "قائد فرق الاستجابة للحوادث الأمنية ومكتشف ثغرات معتمد في برامج مكافآت الثغرات العالمية."
    },
    learningObjectives: [
      "فهم ثغرات OWASP Top 10 للويب وتطبيق الهجمات الحية في معامل وهمية آمنة",
      "إتقان أدوات الاختراق الاحترافية: Burp Suite, Wireshark, Metasploit, Nmap",
      "كتابة تقارير احترافية لإدارة الثغرات وتقديم حلول الترقيع الأمني (Remediation)",
      "تأمين خوادم Linux والشبكات الداخلية من هجمات الفدية والتنصت"
    ],
    requirements: [
      "معرفة أساسية بمفاهيم شبكات الحاسب (TCP/IP, DNS, HTTP)",
      "جهاز قادر على تشغيل آلة افتراضية (VirtualBox أو VMware)"
    ],
    targetAudience: [
      "الراغبون في بدء مسار مهني عالي الطلب ومجزي في مجال أمن المعلومات",
      "مسؤولو النظم والشبكات والمطورون الراغبون في تعزيز أمان أنظمتهم"
    ],
    modules: [
      {
        id: "cyb-1",
        title: "الوحدة 1: مفاهيم أمن المعلومات واستطلاع الأهداف",
        duration: "5 ساعات",
        lessons: [
          {
            id: "cyb-101",
            title: "مقدمة لعالم الـ Red Teaming والـ Blue Teaming",
            duration: "19:40",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
            summary: "الأطر القانونية والمهنية لمختبري الاختراق وكيفية جمع المعلومات السلبية."
          }
        ]
      }
    ]
  },
  {
    id: "product-management-agile",
    slug: "product-management-agile",
    title: "دليل مدير المنتج الرقمي: من الفكرة إلى الإطلاق والنمو (Product Management)",
    subtitle: "تعلم كيفية قيادة الفرق التقنية، تحديد متطلبات السوق (PRDs)، وبناء منتجات يحبها المستخدمون وتدر ملايين.",
    category: "product-business",
    level: "مبتدئ إلى متوسط",
    rating: 4.89,
    reviewsCount: 540,
    studentsCount: 3100,
    duration: "26 ساعة",
    lessonsCount: 40,
    price: 229,
    originalPrice: 500,
    badge: "تطبيقي 100% 💼",
    language: "العربية",
    certificateAvailable: true,
    lastUpdated: "يوليو 2026",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    promoVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    instructor: {
      id: "inst-6",
      name: "أ. نورة السديري",
      title: "VP of Product في إحدى الشركات التقنية المليارية",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
      rating: 4.97,
      studentsCount: 11000,
      coursesCount: 2,
      bio: "قادت إطلاق وتوسيع 5 منتجات رقمية وصلت لأسواق عالمية، متحدثة ومستشارة نمو أعمال."
    },
    learningObjectives: [
      "كتابة وثائق متطلبات المنتج (PRD) وتحديد قصص المستخدم (User Stories)",
      "تحديد مؤشرات الأداء الرئيسية (KPIs, OKRs, North Star Metric) وتتبعها",
      "إدارة أولويات الميزات (Feature Prioritization: RICE & MoSCoW Frameworks)",
      "إتقان منهجيات الـ Agile و Scrum والتعاون الفعال مع المطورين والمصممين"
    ],
    requirements: [
      "لا توجد متطلبات برمجية مسبقة، فقط التفكير التحليلي وشغف المنتجات"
    ],
    targetAudience: [
      "مديرو المنتجات الجدد ومحللو الأعمال",
      "المطورون والمصممون الراغبون في الانتقال إلى أدوار قيادة المنتجات"
    ],
    modules: [
      {
        id: "prod-1",
        title: "الوحدة 1: عقلية مدير المنتج وتحديد المشكلة الحقيقية",
        duration: "4 ساعات",
        lessons: [
          {
            id: "prod-101",
            title: "ما هو الفارق الحقيقي بين Project Manager و Product Manager؟",
            duration: "18:00",
            type: "video",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
            summary: "التركيز على مخرجات القيمة (Outcomes) بدلاً من مجرد تسليم المهام (Outputs)."
          }
        ]
      }
    ]
  }
];
