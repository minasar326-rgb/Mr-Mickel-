export const examsData = {
  "lec-s3-01": {
    id: "exam-s3-01",
    lectureId: "lec-s3-01",
    title: "الامتحان الإلكتروني الشامل - الوحدة الأولى (Unit 1 Comprehensive Exam)",
    timeMinutes: 25,
    totalMarks: 20,
    passingMarks: 14,
    questions: [
      {
        id: "eq-1",
        type: "mcq",
        question: "While my mother ________ dinner, the telephone suddenly rang.",
        options: ["is cooking", "was cooking", "had cooked", "cooked"],
        correctAnswer: 1,
        explanation: "نستخدم Past Continuous (was cooking) مع أداة الربط While للحدث الذي كان مستمراً عندما قطعه حدث آخر بسيط (rang)."
      },
      {
        id: "eq-2",
        type: "mcq",
        question: "By the time the police arrived, the criminal ________ already.",
        options: ["escaped", "had escaped", "was escaping", "has escaped"],
        correctAnswer: 1,
        explanation: "قاعدة By the time + Past Simple يأتي بعدها Past Perfect (had escaped) لأنه الحدث الذي وقع أولاً."
      },
      {
        id: "eq-3",
        type: "mcq",
        question: "Publishers face huge financial losses because of online ________ of copyrighted books.",
        options: ["accuracy", "piracy", "charity", "urgency"],
        correctAnswer: 1,
        explanation: "كلمة Piracy تعني القرصنة وسرقة الملكية الفكرية وتوزيع الكتب بدون إذن قانوني."
      },
      {
        id: "eq-4",
        type: "mcq",
        question: "A ________ newspaper is characterized by large photos, celebrity gossip, and small pages.",
        options: ["broadsheet", "tabloid", "manuscript", "documentary"],
        correctAnswer: 1,
        explanation: "الصحف الشعبية (Tabloid) تتميز بالصور الكبيرة والصفحات الصغيرة وأخبار المشاهير عكس الصحف الرسمية (Broadsheet)."
      },
      {
        id: "eq-5",
        type: "translation",
        question: "اختر الترجمة الإنجليزية الصحيحة للجملة التالية:\n«يجب على الشباب استغلال أوقات فراغهم في تعلم مهارات رقمية جديدة تواكب متطلبات سوق العمل العالمي.»",
        options: [
          "Youth must exploit their spare time in learning new digital skills that keep pace with global labor market requirements.",
          "Youth should waste their free time learning digital games to match local markets.",
          "Young people had to spend their money on digital tools without market needs.",
          "Youth must ignore global market skills during their free time."
        ],
        correctAnswer: 0,
        explanation: "«استغلال أوقات الفراغ» = exploit/utilize their spare time، «تواكب» = keep pace with."
      }
    ],
    readingPassage: {
      title: "Reading Comprehension: Artificial Intelligence in Modern Education",
      text: "Artificial Intelligence is transforming how students learn languages across the globe. Rather than relying solely on traditional memorization, modern learners interact with smart applications that analyze their pronunciation and grammar mistakes in real time. However, educational experts affirm that AI will never replace dedicated teachers who inspire, motivate, and mentor students toward moral and intellectual greatness.",
      questions: [
        {
          id: "rq-1",
          question: "According to the passage, what is the irreplaceable role of human teachers?",
          options: [
            "Giving grades only",
            "Inspiring, motivating, and mentoring students",
            "Replacing all digital tools",
            "Teaching without books"
          ],
          correctAnswer: 1,
          explanation: "المعلم يلهم ويحفز ويوجه الطالب معنوياً وعلمياً، وهو ما لا يستطيع الذكاء الاصطناعي تعويضه."
        }
      ]
    }
  },
  "lec-s3-02": {
    id: "exam-s3-02",
    lectureId: "lec-s3-02",
    title: "امتحان تقييمي: المضارع التام والمفردات - الوحدة الثانية",
    timeMinutes: 20,
    totalMarks: 15,
    passingMarks: 10,
    questions: [
      {
        id: "eq-201",
        type: "mcq",
        question: "He ________ to London. He is still there and will return next month.",
        options: ["has been", "has gone", "had been", "was"],
        correctAnswer: 1,
        explanation: "Have/Has gone to تعني ذهب إلى مكان وما زال هناك ولم يعد بعد. أما Has been to فتعني ذهب وعاد."
      },
      {
        id: "eq-202",
        type: "mcq",
        question: "She is a role model whose hard work and success ________ millions of young girls.",
        options: ["inspired", "has inspired", "inspires", "is inspiring"],
        correctAnswer: 1,
        explanation: "نستخدم المضارع التام للتعبير عن إنجاز تم في الماضي وما زال أثره الإيجابي مستمراً في الحاضر."
      }
    ]
  }
};
