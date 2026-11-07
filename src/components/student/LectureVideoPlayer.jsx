import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Maximize, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

function formatTime(secs) {
  if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

const LectureVideoPlayer = memo(function LectureVideoPlayer({
  lecture,
  resolvedVideoUrl,
  embedInfo,
  studentWatermarkText,
  currentUser,
  isTeacherOrAdmin,
  onNavigate,
  isCinemaMode,
  onToggleCinemaMode,
  onProgressUpdate,
  onLectureComplete
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [bufferAheadSeconds, setBufferAheadSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoHasError, setVideoHasError] = useState(false);

  const watchedSecondsSetRef = useRef(new Set());
  const lastPlaybackTimeRef = useRef(0);
  const lastSyncedSecondRef = useRef(0);
  const hasSyncedFiftyRef = useRef(false);
  const lastRenderedTimeRef = useRef(0);
  const lastBufferCheckRef = useRef(0);
  const bufferingTimeoutRef = useRef(null);

  // Sync progress safely without thrashing React
  const syncProgressNow = useCallback(() => {
    if (!lecture?.id || !onProgressUpdate) return;
    const dur = videoRef.current?.duration || duration || 1;
    const watchedCount = watchedSecondsSetRef.current.size;
    if (watchedCount > lastSyncedSecondRef.current) {
      lastSyncedSecondRef.current = watchedCount;
      onProgressUpdate(lecture.id, watchedCount, dur);
    }
  }, [lecture?.id, duration, onProgressUpdate]);

  // Reset trackers and parse duration on lecture switch
  useEffect(() => {
    watchedSecondsSetRef.current = new Set();
    lastPlaybackTimeRef.current = 0;
    lastSyncedSecondRef.current = 0;
    hasSyncedFiftyRef.current = false;
    lastRenderedTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    setIsBuffering(false);
    setVideoHasError(false);
    setBufferedPercent(0);
    setBufferAheadSeconds(0);

    if (lecture?.duration) {
      const parts = String(lecture.duration).split(':').map(Number);
      let secs = 0;
      if (parts.length === 3 && !isNaN(parts[0])) secs = (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
      else if (parts.length === 2 && !isNaN(parts[0])) secs = (parts[0] * 60) + (parts[1] || 0);
      else secs = Number(lecture.duration) || 0;
      if (secs > 0) setDuration(secs);
    }

    return () => {
      syncProgressNow();
    };
  }, [lecture?.id, lecture?.duration, syncProgressNow]);

  // Buffer progress calculation with 1.5s throttling
  const updateBufferedProgress = () => {
    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) return;

    const now = Date.now();
    if (now - lastBufferCheckRef.current < 1500) return;
    lastBufferCheckRef.current = now;

    const ct = video.currentTime;
    const b = video.buffered;
    if (!b || b.length === 0) return;

    let forwardBuffer = 0;
    let maxBufferedEnd = 0;
    for (let i = 0; i < b.length; i++) {
      const start = b.start(i);
      const end = b.end(i);
      if (end > maxBufferedEnd) maxBufferedEnd = end;
      if (start <= ct && ct <= end) {
        forwardBuffer = end - ct;
      }
    }
    const pct = Math.min(100, Math.round((maxBufferedEnd / video.duration) * 100));
    const ahead = Math.round(forwardBuffer);
    setBufferedPercent(prev => Math.abs(prev - pct) >= 2 ? pct : prev);
    setBufferAheadSeconds(prev => Math.abs(prev - ahead) >= 2 ? ahead : prev);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const curr = video.currentTime;
    const dur = video.duration || duration || 1;

    // Throttle React seeker re-render to 1Hz
    if (Math.abs(curr - lastRenderedTimeRef.current) >= 0.8) {
      lastRenderedTimeRef.current = curr;
      setCurrentTime(curr);
      updateBufferedProgress();
    }

    // Genuine playback detection (anti-skipping)
    const prev = lastPlaybackTimeRef.current;
    const delta = curr - prev;
    if (delta > 0 && delta < 1.8) {
      const secondBucket = Math.floor(curr);
      watchedSecondsSetRef.current.add(secondBucket);
      const watchedCount = watchedSecondsSetRef.current.size;

      // Sync every 15 unique seconds
      if (watchedCount - lastSyncedSecondRef.current >= 15) {
        lastSyncedSecondRef.current = watchedCount;
        if (onProgressUpdate) {
          onProgressUpdate(lecture.id, watchedCount, dur);
        }
      }

      // If passing 50%, unlock next lecture immediately
      if ((watchedCount / dur) >= 0.5 && !hasSyncedFiftyRef.current) {
        hasSyncedFiftyRef.current = true;
        if (onProgressUpdate) {
          onProgressUpdate(lecture.id, watchedCount, dur);
        }
        if (onLectureComplete) {
          onLectureComplete(lecture.id);
        }
      }
    }
    lastPlaybackTimeRef.current = curr;
  };

  const handleWaiting = () => {
    if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current);
    bufferingTimeoutRef.current = setTimeout(() => {
      setIsBuffering(true);
    }, 400);
  };

  const handlePlaying = () => {
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
    setIsBuffering(false);
    setIsPlaying(true);
    setVideoHasError(false);
    updateBufferedProgress();
  };

  const handlePause = () => {
    setIsPlaying(false);
    syncProgressNow();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    syncProgressNow();
    if (onLectureComplete) {
      onLectureComplete(lecture?.id);
    }
  };

  const handleCanPlay = () => {
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
    setIsBuffering(false);
    updateBufferedProgress();
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
      updateBufferedProgress();
    }
  };

  const handleVideoError = (e) => {
    console.warn('[LectureVideoPlayer] Video playback error caught:', e);
    setVideoHasError(true);
    setIsBuffering(false);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsBuffering(false);
            })
            .catch(err => {
              console.warn('[LectureVideoPlayer] Play interrupted:', err);
              setIsPlaying(false);
            });
        }
      } else {
        video.pause();
        setIsPlaying(false);
        syncProgressNow();
      }
    }
  };

  return (
    <div style={{
      position: 'relative',
      background: '#000000',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xl)',
      marginBottom: '1.5rem',
      aspectRatio: '16/9',
      maxHeight: '560px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {embedInfo ? (
        <iframe
          src={embedInfo.embedUrl}
          title={lecture?.title || 'فيديو المحاضرة'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            position: 'relative',
            zIndex: 1
          }}
        />
      ) : resolvedVideoUrl ? (
        videoHasError ? (
          <div style={{ textAlign: 'center', color: '#EF4444', padding: '2rem', zIndex: 2 }}>
            <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.9 }} />
            <h4 style={{ margin: '0 0 6px', color: '#F87171', fontWeight: 800 }}>تعذر تشغيل الفيديو</h4>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#CBD5E1' }}>
              يرجى التأكد من اتصال الإنترنت أو صحة صيغة الملف المرفوع.
            </p>
            <button
              onClick={() => {
                setVideoHasError(false);
                if (videoRef.current) videoRef.current.load();
              }}
              className="btn btn-sm btn-secondary"
            >
              إعادة المحاولة 🔄
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={resolvedVideoUrl}
            playsInline
            webkit-playsinline="true"
            preload="auto"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onCanPlayThrough={handleCanPlay}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onPause={handlePause}
            onEnded={handleEnded}
            onProgress={updateBufferedProgress}
            onClick={togglePlay}
            onError={handleVideoError}
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            onContextMenu={e => e.preventDefault()}
          />
        )
      ) : (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818CF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <Play size={26} />
          </div>
          <h4 style={{ margin: '0 0 6px', color: lecture?.videoStatus === 'failed' ? '#F87171' : '#F1F5F9', fontWeight: 800 }}>
            {lecture?.videoStatus === 'uploading' 
              ? '⏳ المحاضرة قيد التجهيز والرفع السحابي حالياً'
              : lecture?.videoStatus === 'failed'
                ? '⚠️ تعذر تجهيز ملف فيديو هذه المحاضرة'
                : 'المحاضرة قيد التجهيز'}
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8' }}>
            {lecture?.videoStatus === 'uploading'
              ? 'المحاضر يقوم برفع ومعالجة ملف الفيديو على السحابة الآن. يرجى الانتظار وتحديث الصفحة بعد قليل.'
              : lecture?.videoStatus === 'failed'
                ? 'حدث خطأ في ملف الفيديو أثناء الرفع السحابي. يرجى التواصل مع الدعم الفني أو المحاضر لإعادة النشر.'
                : 'سيتم تفعيل فيديو الشرح قريباً، يمكنك مراجعة المذكرات والكلمات أدناه'}
          </p>
          {isTeacherOrAdmin && (
            <div style={{ marginTop: '1rem' }}>
              <button 
                onClick={() => onNavigate && onNavigate('teacher-admin')}
                className="btn btn-sm btn-secondary"
                style={{ gap: '6px', fontSize: '0.82rem', borderColor: '#F59E0B', color: '#F59E0B' }}
              >
                ✏️ أنت مسجل كمدرس: انقر لتعديل المحاضرة ورفع الفيديو سحابياً ليعمل لدى كافة الطلاب
              </button>
            </div>
          )}
          <div style={{ marginTop: '0.75rem' }}>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-sm btn-ghost" 
              style={{ fontSize: '0.78rem', color: '#94A3B8' }}
            >
              إعادة المحاولة / تحديث الصفحة 🔄
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Floating Watermark (Anti-Screen Recording - 100% GPU Hardware Accelerated) */}
      <div className="ms-gpu-watermark">
        🔒 {studentWatermarkText}
      </div>

      {/* Centered Buffering Stream Stabilization Indicator */}
      {isBuffering && !videoHasError && (
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.92)',
          padding: '16px 24px',
          borderRadius: '16px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: 'white',
          zIndex: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          pointerEvents: 'none'
        }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#F59E0B' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#FEF3C7' }}>
              جاري تثبيت واستقرار سرعة البث ⚡
            </p>
            {bufferAheadSeconds > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                تم تخزين {bufferAheadSeconds} ثانية مسبقاً
              </span>
            )}
          </div>
        </div>
      )}

      {/* Forensic Micro-Watermark (Deters Phone Camera Filming - 100% GPU Hardware Accelerated) */}
      <div className="ms-gpu-micro-watermark">
        {currentUser?.email || currentUser?.uid?.slice(0, 10) || 'THE-MASTER-PROTECTED'}
      </div>

      {/* Big Play Button Overlay (only for native video when paused) */}
      {!embedInfo && resolvedVideoUrl && !isPlaying && !videoHasError && (
        <button
          onClick={togglePlay}
          style={{
            position: 'absolute',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #B45309 100%)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 30px rgba(245, 158, 11, 0.6)',
            transition: 'transform 0.2s',
            zIndex: 15
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Play size={34} fill="white" style={{ marginLeft: '-3px' }} />
        </button>
      )}

      {/* Video Controls Bar (only for native video) */}
      {!embedInfo && resolvedVideoUrl && !videoHasError && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%)',
          padding: '1.25rem 1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          color: 'white',
          direction: 'ltr',
          zIndex: 20
        }}>
          {/* Smooth Buffer & Seek Timeline Slider */}
          <div style={{ position: 'relative', width: '100%', height: '8px', display: 'flex', alignItems: 'center' }}>
            <div style={{
              position: 'absolute',
              top: '2px',
              left: 0,
              right: 0,
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.2)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: '2px',
              left: 0,
              width: `${bufferedPercent}%`,
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.45)',
              transition: 'width 0.25s ease',
              pointerEvents: 'none'
            }} />
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={e => {
                const t = Number(e.target.value);
                setCurrentTime(t);
                if (videoRef.current) videoRef.current.currentTime = t;
              }}
              style={{
                position: 'relative',
                width: '100%',
                accentColor: '#F59E0B',
                cursor: 'pointer',
                height: '4px',
                background: 'transparent',
                zIndex: 2
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="white" />}
              </button>
              <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="رجوع 10 ثوان">
                <RotateCcw size={16} />
              </button>
              <button onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="تقديم 10 ثوان">
                <FastForward size={16} />
              </button>
              <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              {bufferedPercent > 0 && (
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                  تخزين: {bufferedPercent}%
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackSpeed(speed);
                    if (videoRef.current) videoRef.current.playbackRate = speed;
                  }}
                  style={{
                    background: playbackSpeed === speed ? '#D97706' : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {speed}x
                </button>
              ))}
              <button 
                onClick={onToggleCinemaMode} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: isCinemaMode ? '#F59E0B' : 'white', 
                  cursor: 'pointer' 
                }}
                title={isCinemaMode ? 'الوضع الافتراضي' : 'وضع السينما'}
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default LectureVideoPlayer;
