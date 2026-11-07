const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'styles', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

const watermarkCss = `

/* Zero-Jank Anti-Piracy Floating Watermark (100% GPU Composited, Zero JS timers, Zero React re-renders) */
@keyframes msFloatingWatermark {
  0% {
    transform: translate3d(6%, 10%, 0);
  }
  20% {
    transform: translate3d(58%, 20%, 0);
  }
  40% {
    transform: translate3d(22%, 62%, 0);
  }
  60% {
    transform: translate3d(52%, 68%, 0);
  }
  80% {
    transform: translate3d(12%, 36%, 0);
  }
  100% {
    transform: translate3d(6%, 10%, 0);
  }
}

@keyframes msFloatingMicroWatermark {
  0% {
    transform: translate3d(12%, 18%, 0) rotate(-10deg);
    opacity: 0.15;
  }
  25% {
    transform: translate3d(68%, 32%, 0) rotate(-8deg);
    opacity: 0.22;
  }
  50% {
    transform: translate3d(32%, 62%, 0) rotate(-12deg);
    opacity: 0.16;
  }
  75% {
    transform: translate3d(62%, 76%, 0) rotate(-9deg);
    opacity: 0.22;
  }
  100% {
    transform: translate3d(12%, 18%, 0) rotate(-10deg);
    opacity: 0.15;
  }
}

.ms-gpu-watermark {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  animation: msFloatingWatermark 36s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
  will-change: transform;
  user-select: none;
  z-index: 10;
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.85rem;
  font-weight: 800;
  text-shadow: 0 0 4px rgba(0,0,0,0.8);
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.ms-gpu-micro-watermark {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  animation: msFloatingMicroWatermark 48s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
  will-change: transform;
  user-select: none;
  z-index: 11;
  color: rgba(255, 255, 255, 0.16);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 1px;
  font-family: monospace;
}
`;

if (!css.includes('msFloatingWatermark')) {
  css += watermarkCss;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('SUCCESS: Watermark CSS added');
} else {
  console.log('Watermark CSS already present');
}
