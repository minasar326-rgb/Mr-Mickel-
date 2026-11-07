import React, { useState, useMemo, useEffect } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  Key, Copy, Check, Trash2, CheckCircle2, AlertCircle, 
  Sparkles, Filter, Calendar, Video, GraduationCap, ShieldCheck,
  ExternalLink, UserCheck, Clock, RefreshCw
} from 'lucide-react';
import { validateCodeTarget, getCoveredLectures } from '../../../utils/entitlements';
import { normalizeStageId } from '../../../utils/stages';

export default function CodesSection() {
  const { 
    accessCodes = [], 
    stages = [], 
    sections = [], 
    lectures = [], 
    generateNewCode, 
    deleteCode, 
    addToast 
  } = useTeacher();

  const { activeStageId, searchQuery } = useAdminUI();

  // Generator State: 3 Types only
  // 'stage' = كود المرحلة بالكامل
  // 'month' = كود شهر محدد
  // 'lecture' = كود محاضرة واحدة
  const [selectedType, setSelectedType] = useState('month');
  const [selectedStageId, setSelectedStageId] = useState(
    activeStageId !== 'all' ? activeStageId : (stages[0]?.id || 'sec-3')
  );
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  
  // Newly generated code banner state
  const [recentCode, setRecentCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter State for Codes Directory
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  // Sections for chosen stage
  const stageSections = useMemo(() => {
    return sections.filter(s => s.stageId === selectedStageId);
  }, [sections, selectedStageId]);

  // Set default section when stage changes or when switching to month
  useEffect(() => {
    if (stageSections.length > 0 && (!selectedSectionId || !stageSections.some(s => s.id === selectedSectionId))) {
      setSelectedSectionId(stageSections[0].id);
    }
  }, [selectedStageId, stageSections, selectedSectionId]);

  // Lectures for chosen section/stage
  const availableLectures = useMemo(() => {
    return lectures.filter(l => {
      if (l.isDeleted) return false;
      if (selectedSectionId) {
        return l.sectionId === selectedSectionId || l.stageId === selectedStageId;
      }
      return l.stageId === selectedStageId;
    });
  }, [lectures, selectedStageId, selectedSectionId]);

  useEffect(() => {
    if (availableLectures.length > 0 && (!selectedLectureId || !availableLectures.some(l => l.id === selectedLectureId))) {
      setSelectedLectureId(availableLectures[0].id);
    }
  }, [availableLectures, selectedLectureId]);

  // Selected Stage Object
  const currentStage = useMemo(() => {
    return stages.find(s => s.id === selectedStageId) || stages[0];
  }, [stages, selectedStageId]);

  // Selected Section Object
  const currentSection = useMemo(() => {
    return sections.find(s => s.id === selectedSectionId);
  }, [sections, selectedSectionId]);

  // Selected Lecture Object
  const currentLecture = useMemo(() => {
    return lectures.find(l => l.id === selectedLectureId);
  }, [lectures, selectedLectureId]);

  // -------------------------------------------------------------
  // Automatic Price Calculation from target settings
  // -------------------------------------------------------------
  const autoPrice = useMemo(() => {
    if (selectedType === 'stage') {
      return currentStage?.price || '500 ج.م';
    }
    if (selectedType === 'month') {
      if (!currentSection) return '180 ج.م';
      const p = currentSection.price;
      return typeof p === 'number' ? `${p} ج.م` : (p || '180 ج.م');
    }
    if (selectedType === 'lecture') {
      if (!currentLecture) return '70 ج.م';
      const p = currentLecture.price;
      return typeof p === 'number' ? `${p} ج.م` : (p || '70 ج.م');
    }
    return '180 ج.م';
  }, [selectedType, currentStage, currentSection, currentLecture]);

  // -------------------------------------------------------------
  // Generate Code (Strict 10-Digit, Single-Use, Permanent)
  // -------------------------------------------------------------
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (isGenerating) return;

    if (!currentStage) {
      addToast('يرجى اختيار المرحلة الدراسية', 'error');
      return;
    }

    let targetId = '';
    let targetTitle = '';

    if (selectedType === 'stage') {
      targetId = currentStage.id;
      targetTitle = `مرحلة كاملة: ${currentStage.name}`;
    } else if (selectedType === 'month') {
      if (!currentSection) {
        addToast('يرجى اختيار الشهر المستهدف لإصدار الكود له', 'error');
        return;
      }
      targetId = currentSection.id;
      targetTitle = `شهر: ${currentSection.title}`;
    } else if (selectedType === 'lecture') {
      if (!currentLecture) {
        addToast('يرجى اختيار المحاضرة المستهدفة لإصدار الكود لها', 'error');
        return;
      }
      targetId = currentLecture.id;
      targetTitle = `محاضرة: ${currentLecture.title}`;
    }

    setIsGenerating(true);
    try {
      const newCodeObj = await generateNewCode({
        stageName: currentStage.name,
        stageId: currentStage.id,
        sectionId: selectedType === 'month' ? targetId : (currentLecture?.sectionId || ''),
        lectureId: selectedType === 'lecture' ? targetId : '',
        targetTitle,
        targetId,
        codeType: selectedType, // 'stage' | 'month' | 'lecture'
        price: autoPrice,
        durationDays: 36500, // Permanent
        maxUses: 1 // Single-use only
      });

      setRecentCode(newCodeObj);
      // Auto-copy newly generated 10-digit code to clipboard for convenience
      if (newCodeObj?.code && navigator?.clipboard) {
        navigator.clipboard.writeText(newCodeObj.code).catch(() => {});
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = (code) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    addToast(`تم نسخ الكود: ${code} 📋`, 'info', 2000);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // -------------------------------------------------------------
  // Filtered Codes Directory
  // -------------------------------------------------------------
  const filteredCodes = useMemo(() => {
    return accessCodes.filter(c => {
      // Type filter
      if (filterType !== 'all') {
        const cType = c.codeType || c.type;
        if (cType !== filterType) return false;
      }

      // Status filter: 'used' vs 'unused'
      const isUsed = Boolean(c.isUsed || (c.usedCount && c.usedCount >= (c.maxUses || 1)));
      if (filterStatus === 'unused' && isUsed) return false;
      if (filterStatus === 'used' && !isUsed) return false;

      // Search term
      const term = (localSearch || searchQuery || '').toLowerCase().trim();
      if (!term) return true;
      const matchCode = (c.code || '').toLowerCase().includes(term);
      const matchTarget = (c.targetTitle || c.targetId || '').toLowerCase().includes(term);
      const matchUser = (c.usedBy || c.usedByEmail || c.usedByUid || '').toLowerCase().includes(term);
      return matchCode || matchTarget || matchUser;
    });
  }, [accessCodes, filterType, filterStatus, localSearch, searchQuery]);

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ========================================================= */}
      {/* 1. THREE-TYPE CODE GENERATOR (واجهة إصدار الأكواد للمدرس) */}
      {/* ========================================================= */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius-lg)', border: '1px solid var(--admin-border)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}>
            <Key size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
              إصدار أكواد اشتراكات الطلاب 🔑
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
              أكواد فريدة مكونة من 10 أرقام فقط • صالحة لمرة واحدة • مرتبطة بحساب الطالب مدى الحياة
            </p>
          </div>
        </div>

        {/* 3 Code Type Cards (اختيار نوع الكود من 3 أنواع فقط) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, marginBottom: '10px', color: 'var(--admin-text)' }}>
            اختر نوع كود التفعيل (3 أنواع فقط):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            
            {/* Type 1: كود المرحلة بالكامل */}
            <div 
              onClick={() => setSelectedType('stage')}
              style={{
                cursor: 'pointer',
                padding: '1.25rem',
                borderRadius: '12px',
                border: selectedType === 'stage' ? '2px solid #4F46E5' : '1px solid var(--admin-border)',
                background: selectedType === 'stage' ? 'rgba(79, 70, 229, 0.08)' : 'var(--admin-bg-subtle)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  background: selectedType === 'stage' ? '#4F46E5' : 'var(--admin-border)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <GraduationCap size={20} />
                </div>
                <strong style={{ fontSize: '1rem', color: 'var(--admin-text)' }}>1. كود المرحلة بالكامل</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)', lineHeight: '1.5' }}>
                يفتح للطالب <strong>جميع شهور المرحلة الحالية والمستقبلية</strong> بشكل دائم ومستمر.
              </p>
              {selectedType === 'stage' && (
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <CheckCircle2 size={18} color="#4F46E5" />
                </div>
              )}
            </div>

            {/* Type 2: كود شهر محدد */}
            <div 
              onClick={() => setSelectedType('month')}
              style={{
                cursor: 'pointer',
                padding: '1.25rem',
                borderRadius: '12px',
                border: selectedType === 'month' ? '2px solid #059669' : '1px solid var(--admin-border)',
                background: selectedType === 'month' ? 'rgba(5, 150, 105, 0.08)' : 'var(--admin-bg-subtle)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  background: selectedType === 'month' ? '#059669' : 'var(--admin-border)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Calendar size={20} />
                </div>
                <strong style={{ fontSize: '1rem', color: 'var(--admin-text)' }}>2. كود شهر محدد</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)', lineHeight: '1.5' }}>
                يفتح <strong>شهرًا واحدًا محددًا</strong> بما في ذلك أي محاضرات جديدة تُضاف إليه مستقبلاً.
              </p>
              {selectedType === 'month' && (
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <CheckCircle2 size={18} color="#059669" />
                </div>
              )}
            </div>

            {/* Type 3: كود محاضرة واحدة */}
            <div 
              onClick={() => setSelectedType('lecture')}
              style={{
                cursor: 'pointer',
                padding: '1.25rem',
                borderRadius: '12px',
                border: selectedType === 'lecture' ? '2px solid #D97706' : '1px solid var(--admin-border)',
                background: selectedType === 'lecture' ? 'rgba(217, 119, 6, 0.08)' : 'var(--admin-bg-subtle)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  background: selectedType === 'lecture' ? '#D97706' : 'var(--admin-border)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Video size={20} />
                </div>
                <strong style={{ fontSize: '1rem', color: 'var(--admin-text)' }}>3. كود محاضرة واحدة</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)', lineHeight: '1.5' }}>
                يفتح <strong>محاضرة واحدة محددة فقط</strong> ولا يفتح أي محتوى آخر.
              </p>
              {selectedType === 'lecture' && (
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <CheckCircle2 size={18} color="#D97706" />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Dynamic Target Selection Form */}
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: 'var(--admin-bg-subtle)', padding: '1.25rem', borderRadius: '10px' }}>
            
            {/* Step 1: Select Stage */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '6px', color: 'var(--admin-text)' }}>
                1. المرحلة الدراسية:
              </label>
              <select
                value={selectedStageId}
                onChange={e => {
                  setSelectedStageId(e.target.value);
                  setSelectedSectionId('');
                  setSelectedLectureId('');
                }}
                className="admin-input"
                style={{ width: '100%', fontWeight: 700 }}
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Month (if type is month or lecture) */}
            {(selectedType === 'month' || selectedType === 'lecture') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  2. الشهر الدراسي:
                </label>
                <select
                  value={selectedSectionId}
                  onChange={e => {
                    setSelectedSectionId(e.target.value);
                    setSelectedLectureId('');
                  }}
                  className="admin-input"
                  style={{ width: '100%', fontWeight: 700 }}
                  required
                >
                  <option value="">-- اضغط لاختيار الشهر --</option>
                  {stageSections.map(sec => (
                    <option key={sec.id} value={sec.id}>
                      {sec.title} ({typeof sec.price === 'number' ? `${sec.price} ج.م` : (sec.price || '180 ج.م')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 3: Select Lecture (if type is lecture) */}
            {selectedType === 'lecture' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  3. المحاضرة المحددة:
                </label>
                <select
                  value={selectedLectureId}
                  onChange={e => setSelectedLectureId(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', fontWeight: 700 }}
                  required
                >
                  <option value="">-- اضغط لاختيار المحاضرة --</option>
                  {availableLectures.map(lec => (
                    <option key={lec.id} value={lec.id}>
                      {lec.title} ({lec.price || '70 ج.م'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Auto Price Badge */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '6px', color: 'var(--admin-text)' }}>
                السعر المسجل (يُسحب تلقائياً):
              </label>
              <div style={{
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                background: 'var(--admin-bg-surface)',
                border: '1px solid var(--admin-border)',
                borderRadius: '6px',
                fontWeight: 800,
                color: '#059669',
                fontSize: '1rem'
              }}>
                <span>{autoPrice}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                  تلقائي من الإعدادات 🏷️
                </span>
              </div>
            </div>

          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>الاشتراك دائم لحساب الطالب ♾️ • الكود مكون من 10 أرقام للاستخدام لمرة واحدة فقط</span>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="admin-btn admin-btn-primary admin-btn-lg"
              style={{
                fontWeight: 900,
                padding: '12px 28px',
                fontSize: '1.05rem',
                gap: '10px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                cursor: isGenerating ? 'wait' : 'pointer'
              }}
            >
              <Sparkles size={20} />
              <span>{isGenerating ? 'جاري إصدار الكود...' : '⚡ إصدار كود التفعيل (10 أرقام)'}</span>
            </button>
          </div>
        </form>

        {/* Recently Generated Code Alert Banner */}
        {recentCode && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
            border: '2px solid #10B981',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#065F46' }}>
                  🎉 تم إصدار الكود الجديد بنجاح!
                </h4>
              </div>
              <span style={{ fontSize: '0.82rem', background: '#D1FAE5', color: '#065F46', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>
                جاهز للإرسال للطالب 📲
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'white',
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid #A7F3D0',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>كود التفعيل (10 أرقام فقط):</span>
                <code style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', letterSpacing: '4px', fontFamily: 'monospace' }}>
                  {recentCode.code}
                </code>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(recentCode.code)}
                className="admin-btn admin-btn-primary"
                style={{
                  background: '#059669',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  padding: '10px 20px',
                  gap: '8px'
                }}
              >
                {copiedCode === recentCode.code ? <Check size={18} /> : <Copy size={18} />}
                <span>{copiedCode === recentCode.code ? 'تم نسخ الكود!' : 'نسخ الكود 📋'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#065F46', flexWrap: 'wrap' }}>
              <span>🎯 <strong>المحتوى المفتوح:</strong> {recentCode.targetTitle}</span>
              <span>💰 <strong>السعر:</strong> {recentCode.price}</span>
              <span>⏳ <strong>الصلاحية:</strong> دائم مدى الحياة ♾️</span>
              <span>🔒 <strong>الاستخدام:</strong> مرة واحدة فقط لحساب طالب واحد</span>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 2. CODES DIRECTORY (سجل الأكواد وحالة استخدامها) */}
      {/* ========================================================= */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius-lg)', border: '1px solid var(--admin-border)' }}>
        
        {/* Directory Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
              سجل أكواد التفعيل ({filteredCodes.length} كود) 📋
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
              متابعة حالة كل كود (لم يستخدم / تم تفعيله) ومعلومات الطالب المفعل له
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            
            {/* Search Input */}
            <input
              type="text"
              placeholder="ابحث بالكود (10 أرقام) أو اسم الطالب..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="admin-input"
              style={{ fontSize: '0.85rem', minWidth: '220px' }}
            />

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="admin-input"
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">جميع الأنواع</option>
              <option value="stage">كود مرحلة كاملة</option>
              <option value="month">كود شهر محدد</option>
              <option value="lecture">كود محاضرة واحدة</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="admin-input"
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">جميع الحالات</option>
              <option value="unused">لم يستخدم (متاح)</option>
              <option value="used">تم تفعيله</option>
            </select>

          </div>
        </div>

        {/* Empty State */}
        {filteredCodes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--admin-text-muted)' }}>
            <Key size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>لا توجد أكواد مطابقة للفلاتر المحددة</p>
            <p style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>يمكنك إصدار كود جديد من الاستوديو بالأعلى</p>
          </div>
        ) : (
          /* Grid of Code Cards */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredCodes.map(c => {
              const isUsed = Boolean(c.isUsed || (c.usedCount && c.usedCount >= (c.maxUses || 1)));
              const cType = c.codeType || c.type;

              return (
                <div
                  key={c.code}
                  style={{
                    padding: '1.25rem',
                    background: isUsed ? 'var(--admin-bg-subtle)' : 'var(--admin-bg-surface)',
                    border: isUsed ? '1px solid var(--admin-border)' : '1.5px solid #10B981',
                    borderRadius: 'var(--admin-radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: isUsed ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.08)'
                  }}
                >
                  <div>
                    {/* Header Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className="admin-badge" style={{ 
                        background: cType === 'stage' ? 'rgba(79, 70, 229, 0.12)' : cType === 'month' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                        color: cType === 'stage' ? '#4F46E5' : cType === 'month' ? '#059669' : '#D97706',
                        fontWeight: 800,
                        fontSize: '0.78rem'
                      }}>
                        {cType === 'stage' ? '🎓 كود مرحلة' : cType === 'month' ? '📅 كود شهر' : '🎬 كود محاضرة'}
                      </span>

                      {/* Usage Status Badge */}
                      {isUsed ? (
                        <span className="admin-badge" style={{ background: '#EDE9FE', color: '#6D28D9', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} />
                          <span>تم تفعيله</span>
                        </span>
                      ) : (
                        <span className="admin-badge" style={{ background: '#D1FAE5', color: '#065F46', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Sparkles size={12} />
                          <span>لم يستخدم (متاح)</span>
                        </span>
                      )}
                    </div>

                    {/* 10-Digit Code Display with Copy Button */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      background: 'var(--admin-bg-subtle)', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--admin-border)', 
                      marginBottom: '10px' 
                    }}>
                      <code style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--admin-primary)', letterSpacing: '2px', fontFamily: 'monospace' }}>
                        {c.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.code)}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        title="نسخ الكود"
                        style={{ padding: '4px 8px' }}
                      >
                        {copiedCode === c.code ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                      </button>
                    </div>

                    {/* Target Information */}
                    <strong style={{ fontSize: '0.92rem', color: 'var(--admin-text)', display: 'block', marginBottom: '4px' }}>
                      {c.targetTitle || 'اشتراك محتوى'}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>المرحلة: {stages.find(s => s.id === c.stageId)?.name || c.stage || c.stageId}</span>
                      <span>السعر: {c.price || '180 ج.م'} • مدة الصلاحية: دائم مدى الحياة ♾️</span>
                    </div>

                    {/* If Used: Display student details */}
                    {isUsed && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 10px',
                        background: 'rgba(109, 40, 217, 0.06)',
                        borderRadius: '6px',
                        border: '1px solid rgba(109, 40, 217, 0.2)',
                        fontSize: '0.78rem',
                        color: '#4C1D95'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '2px' }}>
                          <UserCheck size={14} />
                          <span>الطالب: {c.usedBy || 'طالب مسجل'}</span>
                        </div>
                        {c.usedByEmail && (
                          <div style={{ opacity: 0.85, wordBreak: 'break-all' }}>
                            الحساب: {c.usedByEmail}
                          </div>
                        )}
                        {c.usedAt && (
                          <div style={{ opacity: 0.75, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={12} />
                            <span>تاريخ التفعيل: {new Date(c.usedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid var(--admin-border)', paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(c.code)}
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      title="نسخ الكود"
                    >
                      <Copy size={14} /> <span>نسخ</span>
                    </button>
                    {!isUsed && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من حذف كود التفعيل "${c.code}"؟`)) {
                            deleteCode(c.code);
                          }
                        }}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        style={{ color: '#EF4444' }}
                        title="حذف الكود"
                      >
                        <Trash2 size={14} /> <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
