const fs = require('fs');
const path = require('path');

const roomPath = path.join(__dirname, '..', 'src', 'components', 'student', 'LecturePlayerRoom.jsx');
let code = fs.readFileSync(roomPath, 'utf8');

// 1. Add import for LectureVideoPlayer if not present
if (!code.includes("import LectureVideoPlayer from './LectureVideoPlayer'")) {
  code = code.replace(
    "import React, { useState, useRef, useEffect } from 'react';",
    "import React, { useState, useRef, useEffect, useCallback } from 'react';\nimport LectureVideoPlayer from './LectureVideoPlayer';"
  );
}

// 2. Remove videoWatchProgress from useTeacher destructuring
code = code.replace(/videoWatchProgress,\s*/g, '');

// 3. Remove old video player states and watermarks
const oldStatesRegex = /\/\/ Video State & Streaming Stabilization[\s\S]*?\/\/ Resolve persistent video URL from IndexedDB or Cloud/m;
const newStates = `const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState(() => {
    if (isAllowedToWatch && lecture?.videoUrl && /^https?:\\/\\//i.test(lecture.videoUrl)) {
      return lecture.videoUrl;
    }
    return '';
  });

  // PDF Download State
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Resolve persistent video URL from IndexedDB or Cloud`;

code = code.replace(oldStatesRegex, newStates);

// 4. Update the resolvedVideoUrl useEffect
const oldResolveEffectRegex = /\/\/ Resolve persistent video URL from IndexedDB or Cloud \(Zero Leakage: strictly gated by isAllowedToWatch\)[\s\S]*?return \(\) => { isMounted = false; };\s*}, \[lecture, resolveVideoSource, isAllowedToWatch\]\);/m;
const newResolveEffect = `// Resolve persistent video URL from IndexedDB or Cloud (strictly gated by isAllowedToWatch)
  useEffect(() => {
    let isMounted = true;
    if (!isAllowedToWatch || !lecture) {
      setResolvedVideoUrl('');
      return;
    }

    if (lecture.videoUrl && /^https?:\\/\\//i.test(lecture.videoUrl)) {
      setResolvedVideoUrl(lecture.videoUrl);
      return;
    }

    if (resolveVideoSource) {
      resolveVideoSource(lecture).then(url => {
        if (isMounted && isAllowedToWatch) {
          setResolvedVideoUrl(prev => prev !== (url || '') ? (url || '') : prev);
        }
      });
    } else {
      setResolvedVideoUrl('');
    }
    return () => { isMounted = false; };
  }, [lecture?.id, lecture?.videoUrl, isAllowedToWatch, resolveVideoSource]);`;

code = code.replace(oldResolveEffectRegex, newResolveEffect);

// 5. Remove watermark state/interval and handleTimeUpdate
const oldWatermarkAndTimeUpdateRegex = /\/\/ Anti-Piracy Watermark Coordinates Animation[\s\S]*?lastPlaybackTimeRef\.current = curr;\s*};/m;
code = code.replace(oldWatermarkAndTimeUpdateRegex, '');

// 6. Remove video handlers: updateBufferedProgress up to formatTime
const oldVideoHandlersRegex = /\/\/ Advanced Buffer Monitoring and Stall Auto-Recovery for Seamless Playback[\s\S]*?return `\${m < 10 \? '0' : ''}\${m}:\${s < 10 \? '0' : ''}\${s}`;\s*};/m;
code = code.replace(oldVideoHandlersRegex, '');

// 7. Replace the video player JSX container with <LectureVideoPlayer ... />
const oldPlayerContainerRegex = /\/\* Secure Video Player Container with Dynamic Anti-Piracy Watermark \*\/[\s\S]*?{\/\* Completion Action Bar & Workspace/m;
const newPlayerContainer = `<LectureVideoPlayer
            lecture={lecture}
            resolvedVideoUrl={resolvedVideoUrl}
            embedInfo={embedInfo}
            studentWatermarkText={studentWatermarkText}
            currentUser={currentUser}
            isTeacherOrAdmin={isTeacherOrAdmin}
            onNavigate={onNavigate}
            isCinemaMode={isCinemaMode}
            onToggleCinemaMode={() => setIsCinemaMode(prev => !prev)}
            onProgressUpdate={updateLectureWatchProgress}
            onLectureComplete={markLectureComplete}
          />
        )}

        {/* Completion Action Bar & Workspace`;

code = code.replace(oldPlayerContainerRegex, newPlayerContainer);

fs.writeFileSync(roomPath, code, 'utf8');
console.log('Successfully optimized LecturePlayerRoom.jsx!');
