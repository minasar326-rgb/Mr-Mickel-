export const mockStudentsList = [
  {
    id: "std-101",
    name: "سعد القحطاني",
    phone: "01099887766",
    parentPhone: "01011223344",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    attendanceRate: "100%",
    unlockedLectureIds: ["lec-s3-01", "lec-s3-02"],
    completedLectures: ["lec-s3-01"],
    homeworkStatus: {
      "lec-s3-01": { status: "submitted", grade: "10/10 (ممتاز)", images: ["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=80"] }
    },
    examScores: {
      "lec-s3-01": { score: 20, total: 20, grade: "امتياز 100%", date: "15 أغسطس 2026" }
    },
    totalXp: 4200,
    rank: 1,
    pronunciationScore: "95% (Excellent Fluency)"
  },
  {
    id: "std-102",
    name: "سارة الزهراني",
    phone: "01122334455",
    parentPhone: "01199887766",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    attendanceRate: "95%",
    unlockedLectureIds: ["lec-s3-01", "lec-s3-02"],
    completedLectures: ["lec-s3-01"],
    homeworkStatus: {
      "lec-s3-01": { status: "submitted", grade: "9.5/10 (رائع)", images: [] }
    },
    examScores: {
      "lec-s3-01": { score: 19, total: 20, grade: "ممتاز 95%", date: "14 أغسطس 2026" }
    },
    totalXp: 3950,
    rank: 2,
    pronunciationScore: "92%"
  },
  {
    id: "std-103",
    name: "عبدالله الشمري",
    phone: "01233445566",
    parentPhone: "01299881122",
    stageId: "sec-3",
    stageName: "الصف الثالث الثانوي",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    attendanceRate: "90%",
    unlockedLectureIds: ["lec-s3-01"],
    completedLectures: ["lec-s3-01"],
    homeworkStatus: {
      "lec-s3-01": { status: "submitted", grade: "9/10", images: [] }
    },
    examScores: {
      "lec-s3-01": { score: 18, total: 20, grade: "جيد جداً مرتفع 90%", date: "15 أغسطس 2026" }
    },
    totalXp: 3400,
    rank: 3,
    pronunciationScore: "88%"
  },
  {
    id: "std-104",
    name: "منى التميمي",
    phone: "01544332211",
    parentPhone: "01588776655",
    stageId: "sec-2",
    stageName: "الصف الثاني الثانوي",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    attendanceRate: "85%",
    unlockedLectureIds: ["lec-s2-01"],
    completedLectures: [],
    homeworkStatus: {
      "lec-s2-01": { status: "pending", grade: null, images: [] }
    },
    examScores: {},
    totalXp: 1800,
    rank: 4,
    pronunciationScore: "85%"
  }
];
