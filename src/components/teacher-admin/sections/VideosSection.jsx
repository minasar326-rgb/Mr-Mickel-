import React, { useState } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  Film, Cloud, RefreshCw, CheckCircle2, AlertCircle, 
  ExternalLink, Play, Server, HardDrive, ShieldCheck
} from 'lucide-react';
import { r2Config, uploadFileToR2 } from '../../../services/r2Storage';
import { getPermanentMediaUrl, updateMediaCloudUrl } from '../../../services/persistentStorage';

export default function VideosSection() {
  const { lectures = [], stages = [], addToast, updateLecture } = useTeacher();
  const { activeStageId } = useAdminUI();
  const [retryingIds, setRetryingIds] = useState({});
  const [testVideoUrl, setTestVideoUrl] = useState('');

  const filteredLectures = lectures.filter(l => {
    if (l.isDeleted) return false;
    if (activeStageId !== 'all' && l.stageId !== activeStageId) return false;
    return true;
  });

  const cloudLectures = filteredLectures.filter(l => l.videoUrl && (l.videoUrl.startsWith('https://') || l.videoUrl.startsWith('http://')));
  const localOnlyLectures = filteredLectures.filter(l => !l.videoUrl && l.localMediaKey);
  const pendingLectures = filteredLectures.filter(l => !l.videoUrl && !l.localMediaKey);

  const handleRetryUpload = async (lec) => {
    if (!lec.localMediaKey) {
      addToast('لا يوجد ملف فيديو محلي محفوظ لهذه المحاضرة لإعادة رفعه. يرجى تعديل المحاضرة واختيار الفيديو مجدداً.', 'warning');
      return;
    }

    setRetryingIds(prev => ({ ...prev, [lec.id]: true }));
    addToast(`جاري استخراج الفيديو وإعادة رفعه إلى Cloudflare R2... ⏳`, 'info');

    try {
      const fileRecord = await getPermanentMediaUrl(lec.localMediaKey);
      if (!fileRecord || !fileRecord.blob) {
        throw new Error('الملف المحلي غير متوفر في متصفحك.');
      }

      const stageFolder = lec.stageId ? `stages/${lec.stageId}/lectures/videos` : 'lectures/videos';
      const file = new File([fileRecord.blob], lec.videoFileName || `${lec.id}.mp4`, { type: 'video/mp4' });
      
      const res = await uploadFileToR2(file, stageFolder, (prog) => {
        // progress callback
      });

      if (res && res.downloadUrl) {
        await updateMediaCloudUrl(lec.localMediaKey, res.downloadUrl);
        await updateLecture(lec.id, {
          videoUrl: res.downloadUrl,
          videoStatus: 'ready'
        });
        addToast(`✅ تم رفع الفيديو سحابياً وتثبيت الرابط بنجاح!`, 'success');
      }
    } catch (err) {
      console.error('Retry upload failed:', err);
      addToast(`❌ تعذر استكمال الرفع: ${err.message}`, 'error');
    } finally {
      setRetryingIds(prev => ({ ...prev, [lec.id]: false }));
    }
  };

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Cloudflare R2 Storage Status Card */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
                مستودع فيديوهات Cloudflare R2 ☁️🎬
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                تخزين سحابي فائق السرعة مع تدفق فيديو غير محدود وباندويث مجاني 100%
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="admin-badge admin-badge-success" style={{ padding: '6px 14px' }}>
              🟢 الحوض: {r2Config.bucketName}
            </span>
          </div>
        </div>

        {/* Video Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>فيديوهات سحابية نشطة (جاهزة):</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
              {cloudLectures.length}
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>محفوظة محلياً (تحتاج مزامنة سحابية):</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
              {localOnlyLectures.length}
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>بدون فيديو:</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
              {pendingLectures.length}
            </div>
          </div>
        </div>
      </div>

      {/* Videos Repository Table */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '1.25rem', color: 'var(--admin-text)' }}>
          قائمة فيديوهات المحاضرات وحالتها السحابية
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLectures.map(lec => {
            const isCloud = lec.videoUrl && (lec.videoUrl.startsWith('https://') || lec.videoUrl.startsWith('http://'));
            const isLocal = !isCloud && lec.localMediaKey;
            const isRetrying = retryingIds[lec.id];
            const stage = stages.find(s => s.id === lec.stageId);

            return (
              <div
                key={lec.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--admin-bg-subtle)',
                  borderRadius: 'var(--admin-radius-md)',
                  border: '1px solid var(--admin-border)',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: isCloud ? '#ECFDF5' : isLocal ? '#FEF3C7' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Film size={20} color={isCloud ? '#10B981' : isLocal ? '#F59E0B' : '#EF4444'} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)' }}>{lec.title}</strong>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                      <span>المرحلة: {stage?.name || lec.stageId}</span>
                      <span>•</span>
                      <span>⏱️ {lec.duration}</span>
                      {lec.videoFileName && <span>• 📁 {lec.videoFileName}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isCloud ? (
                    <>
                      <span className="admin-badge admin-badge-success">🟢 سحابي نشط</span>
                      <a 
                        href={lec.videoUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                        style={{ gap: '4px' }}
                      >
                        <ExternalLink size={14} /> <span>فحص الرابط</span>
                      </a>
                    </>
                  ) : isLocal ? (
                    <>
                      <span className="admin-badge admin-badge-warning">⚡ محلي بالجهاز</span>
                      <button
                        type="button"
                        disabled={isRetrying}
                        onClick={() => handleRetryUpload(lec)}
                        className="admin-btn admin-btn-sm admin-btn-primary"
                        style={{ gap: '6px' }}
                      >
                        <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                        <span>{isRetrying ? 'جاري الرفع...' : 'مزامنة إلى R2 ☁️'}</span>
                      </button>
                    </>
                  ) : (
                    <span className="admin-badge" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                      ❌ بدون فيديو
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
