import React, { createContext, useContext, useState, useEffect } from 'react';
import { coursesData as initialCourses } from '../data/coursesData';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';

const CourseContext = createContext();

export function CourseProvider({ children }) {
  const { currentUser, role, addXP } = useAuth();
  const { addToast } = useToast();

  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('madarek_courses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialCourses;
  });

  const [enrolledCourses, setEnrolledCourses] = useState(() => {
    const saved = localStorage.getItem('madarek_enrolled');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return currentUser?.enrolledCourses || [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('madarek_wishlist');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return currentUser?.wishlist || [];
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('madarek_cart');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [savedNotes, setSavedNotes] = useState(() => {
    const saved = localStorage.getItem('madarek_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return currentUser?.savedNotes || [];
  });

  const [certificates, setCertificates] = useState(() => {
    const saved = localStorage.getItem('madarek_certificates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return currentUser?.certificates || [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('madarek_courses', JSON.stringify(courses));
    localStorage.setItem('madarek_enrolled', JSON.stringify(enrolledCourses));
    localStorage.setItem('madarek_wishlist', JSON.stringify(wishlist));
    localStorage.setItem('madarek_cart', JSON.stringify(cart));
    localStorage.setItem('madarek_notes', JSON.stringify(savedNotes));
    localStorage.setItem('madarek_certificates', JSON.stringify(certificates));
  }, [courses, enrolledCourses, wishlist, cart, savedNotes, certificates]);

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(item => item.courseId === courseId);
  };

  const getCourseProgress = (courseId) => {
    const enrolled = enrolledCourses.find(item => item.courseId === courseId);
    if (!enrolled) return { percentage: 0, completedLessons: [], certificateEarned: false };
    
    // Count total lessons in course
    const course = courses.find(c => c.id === courseId);
    if (!course) return { percentage: enrolled.progressPercentage || 0, completedLessons: enrolled.completedLessonIds || [] };
    
    const totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    const completedCount = enrolled.completedLessonIds?.length || 0;
    const percentage = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;
    
    return {
      percentage,
      completedLessons: enrolled.completedLessonIds || [],
      certificateEarned: enrolled.certificateEarned || percentage === 100,
      certificateId: enrolled.certificateId
    };
  };

  const enrollInCourse = (courseId) => {
    if (isEnrolled(courseId)) return;
    const newEnrollment = {
      courseId,
      enrolledDate: new Date().toISOString().split('T')[0],
      lastAccessed: new Date().toISOString().split('T')[0],
      completedLessonIds: [],
      progressPercentage: 0,
      quizScores: {},
      certificateEarned: false
    };
    setEnrolledCourses(prev => [...prev, newEnrollment]);
    addToast('تهانينا! تم تسجيلك في الدورة بنجاح. نتمنى لك رحلة تعلم ملهمة 🚀', 'success');
  };

  const markLessonComplete = (courseId, lessonId) => {
    setEnrolledCourses(prev => {
      return prev.map(item => {
        if (item.courseId !== courseId) return item;
        const currentCompleted = item.completedLessonIds || [];
        if (currentCompleted.includes(lessonId)) return item;

        const updatedCompleted = [...currentCompleted, lessonId];
        const course = courses.find(c => c.id === courseId);
        const totalLessons = course ? course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) : 1;
        const newPercentage = Math.min(100, Math.round((updatedCompleted.length / totalLessons) * 100));

        // Trigger XP & Toast
        addXP(25);
        addToast('أحسنت! أكملت درساً جديداً (+25 نقطة XP) 🎉', 'xp');

        if (newPercentage === 100 && !item.certificateEarned) {
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 }
            });
          } catch (e) {}
          addToast('مبارك! لقد أتممت الدورة بنجاح وأصبحت مؤهلاً لاستلام شهادة التخرج 🎓', 'success', 6000);
        }

        return {
          ...item,
          completedLessonIds: updatedCompleted,
          progressPercentage: newPercentage,
          lastAccessed: new Date().toISOString().split('T')[0]
        };
      });
    });
  };

  const submitQuizScore = (courseId, lessonId, score, passed) => {
    setEnrolledCourses(prev => {
      return prev.map(item => {
        if (item.courseId !== courseId) return item;
        return {
          ...item,
          quizScores: {
            ...(item.quizScores || {}),
            [lessonId]: { score, passed, date: new Date().toISOString().split('T')[0] }
          }
        };
      });
    });

    if (passed) {
      markLessonComplete(courseId, lessonId);
      addXP(50);
      addToast(`رائع! اجتزت الاختبار بدرجة ${score}% بنجاح (+50 XP) 🏆`, 'success');
    } else {
      addToast(`حصلت على ${score}%. يمكنك مراجعة الدرس وإعادة الاختبار لتحقيق درجة النجاح.`, 'error');
    }
  };

  const claimCertificate = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return null;

    const certId = `MDRK-${course.category.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-SA`;
    const newCert = {
      id: certId,
      courseId,
      courseTitle: course.title,
      issueDate: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
      studentName: currentUser?.name || 'سعد القحطاني',
      instructorName: course.instructor?.name || 'مدرب معتمد',
      grade: 'امتياز مع مرتبة الشرف (100%)',
      hours: course.duration || '30 ساعة',
      qrCodeValue: `https://madarek.edu.sa/verify/${certId}`
    };

    setCertificates(prev => {
      if (prev.some(c => c.courseId === courseId)) return prev;
      return [...prev, newCert];
    });

    setEnrolledCourses(prev => {
      return prev.map(item => {
        if (item.courseId === courseId) {
          return { ...item, certificateEarned: true, certificateId: certId };
        }
        return item;
      });
    });

    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 }
      });
    } catch (e) {}

    addToast('مبارك! تم إصدار وتوثيق شهادتك الرسمية بنجاح 📜', 'success');
    return newCert;
  };

  const verifyCertificate = (certId) => {
    const found = certificates.find(c => c.id.toLowerCase() === certId.trim().toLowerCase());
    return found || null;
  };

  const addNote = (courseId, lessonId, lessonTitle, timestamp, text) => {
    const newNote = {
      id: `note-${Date.now()}`,
      courseId,
      lessonId,
      lessonTitle,
      timestamp,
      text,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setSavedNotes(prev => [newNote, ...prev]);
    addToast('تم حفظ الملاحظة بنجاح ✍️', 'success');
  };

  const deleteNote = (noteId) => {
    setSavedNotes(prev => prev.filter(n => n.id !== noteId));
    addToast('تم حذف الملاحظة', 'info');
  };

  const toggleWishlist = (courseId) => {
    setWishlist(prev => {
      const exists = prev.includes(courseId);
      if (exists) {
        addToast('تمت الإزالة من قائمة الرغبات', 'info');
        return prev.filter(id => id !== courseId);
      } else {
        addToast('تمت الإضافة إلى قائمة الرغبات ❤️', 'success');
        return [...prev, courseId];
      }
    });
  };

  const addToCart = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    if (cart.some(item => item.courseId === courseId)) {
      addToast('الدورة موجودة بالفعل في السلة', 'info');
      return;
    }
    setCart(prev => [
      ...prev,
      {
        courseId,
        title: course.title,
        price: course.price,
        originalPrice: course.originalPrice,
        thumbnail: course.thumbnail,
        instructor: course.instructor?.name
      }
    ]);
    addToast('تمت إضافة الدورة إلى سلة المشتريات 🛒', 'success');
  };

  const removeFromCart = (courseId) => {
    setCart(prev => prev.filter(item => item.courseId !== courseId));
    addToast('تمت الإزالة من السلة', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const applyCoupon = (code) => {
    const cleaned = code.trim().toUpperCase();
    if (cleaned === 'MADAREK50') {
      setAppliedCoupon({ code: cleaned, discountRate: 0.5, name: 'خصم خاص 50%' });
      addToast('تم تطبيق كود الخصم 50% بنجاح! 🎉', 'success');
      return true;
    } else if (cleaned === 'WELCOME30' || cleaned === 'RAMADAN') {
      setAppliedCoupon({ code: cleaned, discountRate: 0.3, name: 'خصم ترحيبي 30%' });
      addToast('تم تطبيق كود الخصم 30% بنجاح! 🎁', 'success');
      return true;
    } else {
      addToast('عذراً، كود الخصم غير صالح أو منتهي الصلاحية', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast('تم إلغاء كود الخصم', 'info');
  };

  const addCourse = (newCourseData) => {
    const newCourse = {
      ...newCourseData,
      id: `course-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 0,
      studentsCount: 0,
      badge: 'جديد 🚀',
      lastUpdated: 'الآن',
      instructor: {
        id: currentUser?.id || 'inst-1',
        name: currentUser?.name || 'مدرب معتمد',
        title: currentUser?.title || 'أستاذ خبير',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        rating: 5.0,
        studentsCount: 1,
        coursesCount: 1
      }
    };
    setCourses(prev => [newCourse, ...prev]);
    addToast('تم إنشاء ونشر الدورة التعليمية بنجاح! 🌟', 'success');
    return newCourse;
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        enrolledCourses,
        wishlist,
        cart,
        appliedCoupon,
        savedNotes,
        certificates,
        isEnrolled,
        getCourseProgress,
        enrollInCourse,
        markLessonComplete,
        submitQuizScore,
        claimCertificate,
        verifyCertificate,
        addNote,
        deleteNote,
        toggleWishlist,
        addToCart,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        addCourse
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export const useCourses = () => useContext(CourseContext);
