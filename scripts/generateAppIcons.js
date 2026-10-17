import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourcePath = path.resolve(rootDir, 'public/teacher-avatar.jpg');

async function buildIcons() {
  console.log('🚀 Starting Professional App Icon Generation for Mr. Michael LMS...');

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source image not found at ${sourcePath}`);
  }

  // 1. Prepare output directories
  const publicIconsDir = path.resolve(rootDir, 'public/icons');
  const rootIconsDir = path.resolve(rootDir, 'icons');
  fs.mkdirSync(publicIconsDir, { recursive: true });
  fs.mkdirSync(rootIconsDir, { recursive: true });

  // 2. Crop teacher's portrait from the source 1024x1024
  // Center is approximately x: 440, y: 350
  // Crop 620x620 centered on his face & suit
  const cropSize = 620;
  const cropLeft = Math.max(0, Math.min(1024 - cropSize, 440 - Math.floor(cropSize / 2))); // 130
  const cropTop = Math.max(0, Math.min(1024 - cropSize, 350 - Math.floor(cropSize / 2)));  // 40

  const portraitBuffer = await sharp(sourcePath)
    .extract({ left: cropLeft, top: cropTop, width: cropSize, height: cropSize })
    .resize(680, 680, { fit: 'cover' })
    .modulate({ brightness: 1.05, saturation: 1.1, lightness: 0 })
    .sharpen({ sigma: 1.1, m1: 0.9, m2: 0.4 })
    .toBuffer();

  // 3. Create a circular mask for the portrait (diameter 660px)
  const maskSvg = Buffer.from(`
    <svg width="680" height="680">
      <defs>
        <radialGradient id="edgeFade" cx="50%" cy="50%" r="50%">
          <stop offset="90%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="99%" stop-color="#ffffff" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="340" cy="340" r="330" fill="url(#edgeFade)"/>
    </svg>
  `);

  const maskedPortrait = await sharp(portraitBuffer)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 4. Create Master 1024x1024 Canvas with Luxury Background & Golden Rings
  // Safe area for Android adaptive icons is the central 66%-70% (circle radius ~340px at 1024px)
  const masterSvgOverlay = Buffer.from(`
    <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Luxury Royal Background Gradient -->
        <radialGradient id="bgGradient" cx="50%" cy="46%" r="65%">
          <stop offset="0%" stop-color="#1B223C"/>
          <stop offset="45%" stop-color="#101526"/>
          <stop offset="85%" stop-color="#080B14"/>
          <stop offset="100%" stop-color="#05070D"/>
        </radialGradient>

        <!-- Ambient Core Glow -->
        <radialGradient id="centerGlow" cx="50%" cy="44%" r="48%">
          <stop offset="0%" stop-color="#6366F1" stop-opacity="0.32"/>
          <stop offset="50%" stop-color="#F59E0B" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#101526" stop-opacity="0"/>
        </radialGradient>

        <!-- Gold Luxury Rings Gradient -->
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FDE68A"/>
          <stop offset="30%" stop-color="#F59E0B"/>
          <stop offset="70%" stop-color="#D97706"/>
          <stop offset="100%" stop-color="#B45309"/>
        </linearGradient>

        <!-- Subtle Top Glass Shine -->
        <linearGradient id="glassShine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22"/>
          <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
        </linearGradient>

        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#000000" flood-opacity="0.65"/>
        </filter>
        <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background Fill -->
      <rect width="1024" height="1024" fill="url(#bgGradient)"/>
      <circle cx="512" cy="480" r="460" fill="url(#centerGlow)"/>

      <!-- Outer Decorative Tech Ring (Inside Adaptive Safe Zone) -->
      <circle cx="512" cy="460" r="366" fill="none" stroke="url(#goldGradient)" stroke-width="3" stroke-dasharray="14 10" opacity="0.45"/>
      <circle cx="512" cy="460" r="356" fill="none" stroke="#6366F1" stroke-width="2" opacity="0.3"/>

      <!-- Inner Gold Frame Ring -->
      <circle cx="512" cy="460" r="348" fill="#111827" stroke="url(#goldGradient)" stroke-width="12" filter="url(#shadow)"/>
      <circle cx="512" cy="460" r="338" fill="none" stroke="#FDE68A" stroke-width="2" opacity="0.8"/>

      <!-- Bottom Badge Backdrop in Safe Area (y ~ 730 to 810) -->
      <g filter="url(#shadow)">
        <rect x="302" y="738" width="420" height="74" rx="37" fill="#0B0F1D" stroke="url(#goldGradient)" stroke-width="3.5"/>
        
        <!-- Left & Right Gold Star/Diamonds -->
        <polygon points="340,775 348,767 356,775 348,783" fill="#F59E0B"/>
        <polygon points="684,775 676,767 668,775 676,783" fill="#F59E0B"/>

        <!-- Text: THE MASTER -->
        <text x="512" y="785" 
              font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif" 
              font-size="30" 
              font-weight="900" 
              letter-spacing="4" 
              fill="url(#goldGradient)" 
              text-anchor="middle"
              filter="url(#glowFilter)">THE MASTER</text>
      </g>
    </svg>
  `);

  // Build the base 1024 composite
  const masterBase = await sharp(masterSvgOverlay)
    .composite([
      {
        input: maskedPortrait,
        top: 460 - 340,  // y = 120
        left: 512 - 340  // x = 172
      },
      // Re-apply the badge overlay so it floats gracefully across the bottom of the portrait
      {
        input: Buffer.from(`
          <svg width="1024" height="1024" viewBox="0 0 1024 1024">
            <defs>
              <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FDE68A"/>
                <stop offset="30%" stop-color="#F59E0B"/>
                <stop offset="70%" stop-color="#D97706"/>
                <stop offset="100%" stop-color="#B45309"/>
              </linearGradient>
              <filter id="badgeShadow">
                <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.85"/>
              </filter>
            </defs>
            <g filter="url(#badgeShadow)">
              <rect x="302" y="738" width="420" height="74" rx="37" fill="#0B0F1D" stroke="url(#goldGrad2)" stroke-width="4"/>
              
              <!-- Left and Right Accents -->
              <polygon points="342,775 350,766 358,775 350,784" fill="#FDE68A"/>
              <polygon points="682,775 674,766 666,775 674,784" fill="#FDE68A"/>

              <text x="512" y="786" 
                    font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif" 
                    font-size="31" 
                    font-weight="900" 
                    letter-spacing="5" 
                    fill="url(#goldGrad2)" 
                    text-anchor="middle">THE MASTER</text>
            </g>
          </svg>
        `),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toBuffer();

  // Save 1024 master
  const masterPath = path.resolve(publicIconsDir, 'icon-1024x1024.png');
  await sharp(masterBase).toFile(masterPath);
  console.log('✅ Generated Master 1024x1024 App Icon');

  // Standard sizes to generate
  const sizes = [48, 72, 96, 128, 144, 192, 256, 384, 512];

  for (const size of sizes) {
    const resized = await sharp(masterBase)
      .resize(size, size, { kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9 })
      .toBuffer();

    // 1. Save in public/icons/icon-{size}x{size}.png
    fs.writeFileSync(path.resolve(publicIconsDir, `icon-${size}x${size}.png`), resized);
    fs.writeFileSync(path.resolve(rootIconsDir, `icon-${size}x${size}.png`), resized);

    // 2. Also save top-level shortcuts for prominent sizes
    if (size === 192) {
      fs.writeFileSync(path.resolve(rootDir, 'public/icon-192x192.png'), resized);
      fs.writeFileSync(path.resolve(rootDir, 'icon-192x192.png'), resized);
    }
    if (size === 512) {
      fs.writeFileSync(path.resolve(rootDir, 'public/icon-512x512.png'), resized);
      fs.writeFileSync(path.resolve(rootDir, 'icon-512x512.png'), resized);
    }

    console.log(`✓ Generated icon-${size}x${size}.png`);
  }

  // 5. Generate Maskable Icons (Android Adaptive Icon Standard)
  // Maskable icons benefit from the same composition because our content is strictly within the inner 70% safe zone!
  const maskableSizes = [48, 72, 96, 128, 144, 192, 256, 384, 512];
  for (const mSize of maskableSizes) {
    const mResized = await sharp(masterBase)
      .resize(mSize, mSize, { kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9 })
      .toBuffer();

    fs.writeFileSync(path.resolve(publicIconsDir, `icon-maskable-${mSize}x${mSize}.png`), mResized);
    fs.writeFileSync(path.resolve(rootIconsDir, `icon-maskable-${mSize}x${mSize}.png`), mResized);
    fs.writeFileSync(path.resolve(rootDir, `public/icon-maskable-${mSize}x${mSize}.png`), mResized);
    fs.writeFileSync(path.resolve(rootDir, `icon-maskable-${mSize}x${mSize}.png`), mResized);
    console.log(`✓ Generated icon-maskable-${mSize}x${mSize}.png`);
  }

  // 6. Favicon (48x48 PNG)
  const favicon = await sharp(masterBase)
    .resize(48, 48, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  fs.writeFileSync(path.resolve(rootDir, 'public/favicon.png'), favicon);
  fs.writeFileSync(path.resolve(rootDir, 'favicon.png'), favicon);
  console.log('✓ Generated favicon.png');

  // 7. Apple Touch Icon (180x180 PNG with solid dark background & no transparency)
  const appleTouchIcon = await sharp(masterBase)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .flatten({ background: '#0B0F1D' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.resolve(rootDir, 'public/apple-touch-icon.png'), appleTouchIcon);
  fs.writeFileSync(path.resolve(rootDir, 'apple-touch-icon.png'), appleTouchIcon);
  console.log('✓ Generated apple-touch-icon.png (180x180 iOS standard)');

  // 8. Native Android Mipmap & Splash Resources (Capacitor Android Project)
  const androidResDir = path.resolve(rootDir, 'android/app/src/main/res');
  if (fs.existsSync(androidResDir)) {
    console.log('🤖 Generating Native Android Mipmaps & Splash Resources...');

    const androidDensities = [
      { name: 'mdpi', iconSize: 48, fgSize: 108 },
      { name: 'hdpi', iconSize: 72, fgSize: 162 },
      { name: 'xhdpi', iconSize: 96, fgSize: 216 },
      { name: 'xxhdpi', iconSize: 144, fgSize: 324 },
      { name: 'xxxhdpi', iconSize: 192, fgSize: 432 }
    ];

    for (const d of androidDensities) {
      const mipmapDir = path.resolve(androidResDir, `mipmap-${d.name}`);
      fs.mkdirSync(mipmapDir, { recursive: true });

      // ic_launcher.png (Legacy)
      const icLauncher = await sharp(masterBase)
        .resize(d.iconSize, d.iconSize, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
      fs.writeFileSync(path.resolve(mipmapDir, 'ic_launcher.png'), icLauncher);

      // ic_launcher_round.png
      const roundMask = Buffer.from(`
        <svg width="${d.iconSize}" height="${d.iconSize}">
          <circle cx="${d.iconSize / 2}" cy="${d.iconSize / 2}" r="${d.iconSize / 2}" fill="#fff"/>
        </svg>
      `);
      const icRound = await sharp(icLauncher)
        .composite([{ input: roundMask, blend: 'dest-in' }])
        .png()
        .toBuffer();
      fs.writeFileSync(path.resolve(mipmapDir, 'ic_launcher_round.png'), icRound);

      // ic_launcher_foreground.png (Adaptive icon foreground, 108dp canvas)
      const icForeground = await sharp(masterBase)
        .resize(d.fgSize, d.fgSize, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
      fs.writeFileSync(path.resolve(mipmapDir, 'ic_launcher_foreground.png'), icForeground);

      console.log(`✓ Generated Android mipmap-${d.name} (${d.iconSize}x${d.iconSize} & ${d.fgSize}x${d.fgSize})`);
    }

    // Android Splash Screens
    const splashDefs = [
      { dir: 'drawable', width: 480, height: 320 },
      { dir: 'drawable-port-mdpi', width: 320, height: 480 },
      { dir: 'drawable-port-hdpi', width: 480, height: 800 },
      { dir: 'drawable-port-xhdpi', width: 720, height: 1280 },
      { dir: 'drawable-port-xxhdpi', width: 960, height: 1600 },
      { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
      { dir: 'drawable-land-mdpi', width: 480, height: 320 },
      { dir: 'drawable-land-hdpi', width: 800, height: 480 },
      { dir: 'drawable-land-xhdpi', width: 1280, height: 720 },
      { dir: 'drawable-land-xxhdpi', width: 1600, height: 960 },
      { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280 }
    ];

    for (const s of splashDefs) {
      const targetDir = path.resolve(androidResDir, s.dir);
      fs.mkdirSync(targetDir, { recursive: true });

      const emblemSize = Math.floor(Math.min(s.width, s.height) * 0.45);
      const emblem = await sharp(masterBase)
        .resize(emblemSize, emblemSize, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();

      const splashBuffer = await sharp({
        create: {
          width: s.width,
          height: s.height,
          channels: 4,
          background: { r: 11, g: 15, b: 29, alpha: 1 } // #0B0F1D
        }
      })
        .composite([{
          input: emblem,
          top: Math.floor((s.height - emblemSize) / 2),
          left: Math.floor((s.width - emblemSize) / 2)
        }])
        .png()
        .toBuffer();

      fs.writeFileSync(path.resolve(targetDir, 'splash.png'), splashBuffer);
      console.log(`✓ Generated Android splash ${s.dir} (${s.width}x${s.height})`);
    }
  }

  console.log('🎉 All App Icons & Native Android Resources Generated Successfully!');
}

buildIcons().catch(err => {
  console.error('❌ Icon generation failed:', err);
  process.exit(1);
});
