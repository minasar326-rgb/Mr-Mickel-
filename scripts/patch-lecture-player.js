import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, '../src/components/student/LecturePlayerRoom.jsx');

let code = fs.readFileSync(targetFile, 'utf8');

const oldMetadata = `  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };`;

const newMetadata = `  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    }
  };`;

code = code.replace(oldMetadata, newMetadata);

const oldFormatTime = `  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return \`\${m < 10 ? '0' : ''}\${m}:\${s < 10 ? '0' : ''}\${s}\`;
  };`;

const newFormatTime = `  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return \`\${h}:\${m < 10 ? '0' : ''}\${m}:\${s < 10 ? '0' : ''}\${s}\`;
    }
    return \`\${m < 10 ? '0' : ''}\${m}:\${s < 10 ? '0' : ''}\${s}\`;
  };`;

code = code.replace(oldFormatTime, newFormatTime);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('✅ LecturePlayerRoom.jsx patched successfully!');
