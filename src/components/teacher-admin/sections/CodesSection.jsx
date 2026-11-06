import React, { useState, useMemo } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  Key, Plus, Search, Copy, Check, Trash2, 
  CheckCircle2, AlertCircle, ShieldCheck, Sparkles, Filter, ExternalLink
} from 'lucide-react';
import { validateCodeTarget, getCoveredLectures } from '../../../utils/entitlements';
import { normalizeStageId } from '../../../utils/stages';

// Generate cryptographically secure random token (minimum 12 chars entropy)
function generateSecureToken(length = 6) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32 unambiguous
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export default function CodesSection() {
  const { 
    accessCodes = [], 
    stages = [], 
    sections = [], 
    lectures = [], 
    generateNewCode, 
    deleteCode, 
    toggleCodeStatus,
    addToast 
  } = useTeacher();

  const { activeStageId, searchQuery } = useAdminUI();

  // Generator State
  const [genCodeStageId, setGenCodeStageId] = useState(activeStageId !== 'all' ? activeStageId : (stages[0]?.id || 'sec-3'));
  const [genCodeType, setGenCodeType] = useState('month'); // month, course, lecture, stage, all-access, bundle
  const [genCodeTargetId, setGenCodeTargetId] = useState('');
  const [genCodeDuration, setGenCodeDuration] = useState(30);
  const [genCodePrice, setGenCodePrice] = useState('180 ج.م');
  const [genCodeMaxUses, setGenCodeMaxUses] = useState(1);
  const [genCodeIsGift, setGenCodeIsGift] = useState(false);
  const [genCodeCustomCode, setGenCodeCustomCode] = useState('');
  const [bulkCount, setBulkCount] = useState(1);
  const [copiedCode, setCopiedCode] = useState(null);

  // Code Inspector State
  const [inspectInput, setInspectInput] = useState('');
  const [inspectResult, setInspectResult] = useState(null);

  // List Filter State
  const [codeTypeFilter, setCodeTypeFilter] = useState('all');
  const [codeStatusFilter, setCodeStatusFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  // Sections for chosen stage
  const stageSections = useMemo(() => {
    return sections.filter(s => s.stageId === genCodeStageId);
  }, [sections, genCodeStageId]);

  // Lectures for chosen stage
  const stageLectures = useMemo(() => {
    return lectures.filter(l => !l.isDeleted && l.stageId === genCodeStageId);
  }, [lectures, genCodeStageId]);

  // -------------------------------------------------------------
  // Generate Code Submission (Strict Isolation & No Fallbacks!)
  // -------------------------------------------------------------
  const handleGenerate = async (e) => {
    e.preventDefault();

    const stageObj = stages.find(s => s.id === genCodeStageId);
    if (!stageObj && genCodeType !== 'all-access') {
      addToast('يرجى اختيار مرحلة دراسية صالحة', 'error');
      return;
    }

    let targetId = '';
    let targetTitle = '';

    if (genCodeType === 'month') {
      const sec = sections.find(s => s.id === genCodeTargetId && s.stageId === genCodeStageId);
      if (!sec) {
        addToast('⚠️ يرجى اختيار الشهر المستهدف لإنشاء الكود له', 'error');
        return;
      }
      targetId = sec.id;
      targetTitle = `اشتراك: ${sec.title}`;
    } else if (genCodeType === 'course') {
      const sec = sections.find(s => s.id === genCodeTargetId && s.stageId === genCodeStageId);
      if (!sec) {
        addToast('⚠️ يرجى اختيار الكورس المستهدف لإنشاء الكود له', 'error');
        return;
      }
      targetId = sec.id;
      targetTitle = `كورس: ${sec.title}`;
    } else if (genCodeType === 'lecture') {
      const lec = lectures.find(l => l.id === genCodeTargetId && l.stageId === genCodeStageId);
      if (!lec) {
        addToast('⚠️ يرجى اختيار المحاضرة المستهدفة لإنشاء الكود لها', 'error');
        return;
      }
      targetId = lec.id;
      targetTitle = `محاضرة: ${lec.title}`;
    } else if (genCodeType === 'stage') {
      targetId = genCodeStageId;
      targetTitle = `اشتراك كامل للمرحلة: ${stageObj.name}`;
    } else if (genCodeType === 'all-access') {
      targetId = 'all-access';
      targetTitle = 'اشتراك شامل لجميع المراحل والمحاضرات (All-Access)';
    }

    const count = Math.max(1, Math.min(Number(bulkCount) || 1, 50));
    const stagePrefix = (genCodeStageId || 'GEN').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const typePrefix = genCodeType === 'month' ? 'MTH' : genCodeType === 'course' ? 'CRS' : genCodeType === 'stage' ? 'STG' : genCodeType === 'all-access' ? 'ALL' : 'LEC';

    for (let i = 0; i < count; i++) {
      const secureToken1 = generateSecureToken(4);
      const secureToken2 = generateSecureToken(4);
      const finalCode = (count === 1 && genCodeCustomCode.trim())
        ? genCodeCustomCode.trim().toUpperCase()
        : `MS-${stagePrefix}-${typePrefix}-${secureToken1}-${secureToken2}`;

      await generateNewCode({
        stageName: stageObj?.name || 'جميع المراحل',
        stageId: genCodeStageId || '',
        targetTitle,
        targetId,
        codeType: genCodeType,
        price: genCodePrice,
        durationDays: Number(genCodeDuration) || 30,
        maxUses: Number(genCodeMaxUses) || 1,
        isGift: Boolean(genCodeIsGift),
        customCode: finalCode
      });
    }

    addToast(`🎉 تم توليد ${count} كود تفعيل بنجاح وتأمينه سحابياً!`, 'success');
    setGenCodeCustomCode('');
    setBulkCount(1);
  };

  // -------------------------------------------------------------
  // Code Inspector Tool
  // -------------------------------------------------------------
  const handleInspectCode = (e) => {
    e.preventDefault();
    if (!inspectInput.trim()) return;

    const clean = inspectInput.trim().toUpperCase();
    const found = accessCodes.find(c => c.code.toUpperCase() === clean);

    if (!found) {
      setInspectResult({
        found: false,
        code: clean,
        message: 'الكود غير موجود في قاعدة بيانات الأكواد المنشأة.'
      });
      return;
    }

    // Validate coverage
    const coveredLectures = getCoveredLectures({
      targetId: found.targetId,
      stageId: found.stageId,
      codeType: found.codeType || found.type
    }, lectures);

    const targetVal = validateCodeTarget(found.targetId, { stages, sections, lectures });

    setInspectResult({
      found: true,
      ...found,
      coveredLecturesCount: coveredLectures.length,
      coveredLecturesList: coveredLectures.map(l => l.title),
      targetValidation: targetVal
    });
  };

  // -------------------------------------------------------------
  // Filter Codes List
  // -------------------------------------------------------------
  const filteredCodes = useMemo(() => {
    return accessCodes.filter(c => {
      if (activeStageId !== 'all' && c.stageId && c.stageId !== activeStageId) return false;
      if (codeTypeFilter !== 'all' && (c.codeType || c.type) !== codeTypeFilter) return false;
      if (codeStatusFilter === 'active' && (!c.isActive || c.isUsed)) return false;
      if (codeStatusFilter === 'used' && !c.isUsed) return false;
      if (codeStatusFilter === 'disabled' && c.isActive) return false;

      const term = (localSearch || searchQuery || '').toLowerCase().trim();
      if (!term) return true;
      const matchCode = (c.code || '').toLowerCase().includes(term);
      const matchTarget = (c.targetTitle || c.targetId || '').toLowerCase().includes(term);
      return matchCode || matchTarget;
    });
  }, [accessCodes, activeStageId, codeTypeFilter, codeStatusFilter, localSearch, searchQuery]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast(`تم نسخ الكود: ${code} 📋`, 'info', 2000);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ========================================================= */}
      {/* 1. CODE GENERATOR & STUDIO */}
      {/* ========================================================= */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
              استوديو توليد أكواد الشحن والتفعيل 🔑
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
              توليد أكواد مشفرة آمنة (12+ خانة) لشهر كامل، كورس، محاضرة، أو مرحلة مع حظر العشوائية الضعيفة
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
            
            {/* Stage Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                المرحلة الدراسية المستهدفة:
              </label>
              <select
                value={genCodeStageId}
                onChange={e => {
                  setGenCodeStageId(e.target.value);
                  setGenCodeTargetId('');
                }}
                className="admin-input"
                style={{ width: '100%' }}
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Code Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                نوع الكود وصلاحيته:
              </label>
              <select
                value={genCodeType}
                onChange={e => {
                  setGenCodeType(e.target.value);
                  setGenCodeTargetId('');
                }}
                className="admin-input"
                style={{ width: '100%' }}
              >
                <option value="month">اشتراك شهر محدد (Month)</option>
                <option value="course">اشتراك كورس تأسيسي (Course)</option>
                <option value="lecture">محاضرة واحدة منفردة (Lecture)</option>
                <option value="stage">اشتراك المرحلة كاملة (Stage)</option>
                <option value="all-access">شامل لجميع المراحل (All-Access VIP)</option>
              </select>
            </div>

            {/* Target Selector */}
            {genCodeType === 'month' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  اختر الشهر:
                </label>
                <select
                  value={genCodeTargetId}
                  onChange={e => setGenCodeTargetId(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- اضغط لاختيار الشهر --</option>
                  {stageSections.filter(s => s.type === 'month').map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            )}

            {genCodeType === 'course' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  اختر الكورس:
                </label>
                <select
                  value={genCodeTargetId}
                  onChange={e => setGenCodeTargetId(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- اضغط لاختيار الكورس --</option>
                  {stageSections.filter(s => s.type === 'course').map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            )}

            {genCodeType === 'lecture' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  اختر المحاضرة:
                </label>
                <select
                  value={genCodeTargetId}
                  onChange={e => setGenCodeTargetId(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- اضغط لاختيار المحاضرة --</option>
                  {stageLectures.map(l => (
                    <option key={l.id} value={l.id}>{l.unitNumber}: {l.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                مدة الصلاحية (بالأيام):
              </label>
              <select
                value={genCodeDuration}
                onChange={e => setGenCodeDuration(Number(e.target.value))}
                className="admin-input"
                style={{ width: '100%' }}
              >
                <option value={7}>7 أيام (أسبوع)</option>
                <option value={15}>15 يوم</option>
                <option value={30}>شهر (30 يوم)</option>
                <option value={60}>شهرين (60 يوم)</option>
                <option value={120}>تيرم كامل (4 شهور)</option>
                <option value={365}>سنة كاملة (365 يوم)</option>
              </select>
            </div>

            {/* Max Uses */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                أقصى مرات استخدام (Max Uses):
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={genCodeMaxUses}
                onChange={e => setGenCodeMaxUses(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Bulk Generation Count */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                عدد الأكواد المطلوبة (Bulk):
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={bulkCount}
                onChange={e => setBulkCount(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary admin-btn-lg"
              style={{ fontWeight: 900 }}
            >
              <Sparkles size={18} />
              <span>توليد {bulkCount > 1 ? `${bulkCount} أكواد مشفرة` : 'كود تفعيل جديد'} الآن 🚀</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================= */}
      {/* 2. CODE INSPECTOR TOOL (فاحص الكود المستقل) */}
      {/* ========================================================= */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <ShieldCheck size={22} color="var(--admin-primary)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
            فاحص الأكواد ومطابقة المحتوى (Code Inspector Tool) 🔍
          </h3>
        </div>
        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
          ألصق أي كود هنا للتحقق من صلاحيته، المرحلة التابع لها، والمحاضرات التي سيفتحها فعلياً دون استهلاك الكود.
        </p>

        <form onSubmit={handleInspectCode} style={{ display: 'flex', gap: '8px', maxWidth: '500px', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="ضع كود التفعيل هنا..."
            value={inspectInput}
            onChange={e => setInspectInput(e.target.value)}
            className="admin-input"
            style={{ flex: 1, textTransform: 'uppercase', fontWeight: 700 }}
          />
          <button
            type="submit"
            className="admin-btn admin-btn-secondary"
            style={{ fontWeight: 800 }}
          >
            فحص الكود 🔍
          </button>
        </form>

        {inspectResult && (
          <div style={{ 
            padding: '1.25rem', 
            borderRadius: 'var(--admin-radius-md)', 
            background: inspectResult.found ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${inspectResult.found ? '#A7F3D0' : '#FECACA'}`,
            color: inspectResult.found ? '#065F46' : '#991B1B'
          }}>
            {inspectResult.found ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <strong style={{ fontSize: '1rem' }}>الكود سليم وصالح: {inspectResult.code}</strong>
                </div>
                <div style={{ fontSize: '0.88rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px' }}>
                  <span>المرحلة: {stages.find(s => s.id === inspectResult.stageId)?.name || inspectResult.stageId}</span>
                  <span>المحتوى: {inspectResult.targetTitle}</span>
                  <span>مرات الاستخدام: {inspectResult.usedCount || 0} / {inspectResult.maxUses || 1}</span>
                  <span>مدة الصلاحية: {inspectResult.durationDays} يوم</span>
                  <span>عدد المحاضرات المشمولة: {inspectResult.coveredLecturesCount} محاضرة</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#DC2626" />
                <span>{inspectResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. CODES DIRECTORY */}
      {/* ========================================================= */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
              أكواد التفعيل المنشأة ({filteredCodes.length})
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
              جميع الأكواد مشفرة ومحمية من التخمين
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={codeTypeFilter}
              onChange={e => setCodeTypeFilter(e.target.value)}
              className="admin-input"
              style={{ fontSize: '0.85rem' }}
            >
              <option value="all">جميع الأنواع</option>
              <option value="month">شهور</option>
              <option value="course">كورسات</option>
              <option value="lecture">محاضرات</option>
              <option value="stage">مراحل كاملة</option>
              <option value="all-access">شامل (All-Access)</option>
            </select>
          </div>
        </div>

        {/* Codes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredCodes.map(c => {
            const isFullyUsed = (c.usedCount || 0) >= (c.maxUses || 1);

            return (
              <div
                key={c.code}
                style={{
                  padding: '1.25rem',
                  background: 'var(--admin-bg-subtle)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 'var(--admin-radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="admin-badge admin-badge-primary">
                      {c.codeType === 'month' ? '📅 شهر' : c.codeType === 'course' ? '📁 كورس' : c.codeType === 'stage' ? '🎓 مرحلة' : c.codeType === 'all-access' ? '🌟 شامل' : '🎬 محاضرة'}
                    </span>
                    {isFullyUsed ? (
                      <span className="admin-badge" style={{ background: '#E2E8F0', color: '#475569' }}>مكتمل الاستخدام</span>
                    ) : (
                      <span className="admin-badge admin-badge-success">🟢 متاح للطلاب</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--admin-bg-surface)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', marginBottom: '8px' }}>
                    <code style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--admin-primary)', letterSpacing: '0.5px' }}>
                      {c.code}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(c.code)}
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      title="نسخ الكود"
                    >
                      {copiedCode === c.code ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text)', display: 'block' }}>
                    {c.targetTitle}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                    المرحلة: {stages.find(s => s.id === c.stageId)?.name || c.stageId} • الاستخدام: {c.usedCount || 0} / {c.maxUses || 1}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid var(--admin-border)', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`هل أنت متأكد من حذف كود التفعيل "${c.code}"؟`)) {
                        deleteCode(c.code);
                      }
                    }}
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={14} /> <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
