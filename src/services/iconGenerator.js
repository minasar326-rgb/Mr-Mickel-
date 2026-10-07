/**
 * Master App Icon Generator & PWA Updater
 * Dynamically generates high-end, professional educational app icons
 * adhering to Android Adaptive Icon Safe Zone rules & Apple Touch Icon standards.
 */

/**
 * Loads an image from a URL, DataURL, File, or Blob
 * @param {string|File|Blob} source 
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    if (source instanceof Blob || source instanceof File) {
      const url = URL.createObjectURL(source);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    } else if (typeof source === 'string') {
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = source;
    } else {
      reject(new Error('Invalid image source'));
    }
  });
}

/**
 * Generates an ultra-crisp, branded Master App Icon on an HTML5 Canvas
 * @param {HTMLImageElement} sourceImg 
 * @param {number} size - Output width & height in px (e.g. 512, 192, 180, 48)
 * @param {boolean} isMaskable - If true, restricts key elements to the Android 66% safe circle
 * @returns {HTMLCanvasElement}
 */
export function generateMasterIconCanvas(sourceImg, size = 512, isMaskable = false) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Deep Royal Navy Luxury Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#0B0F1D');
  bgGrad.addColorStop(0.5, '#11162B');
  bgGrad.addColorStop(1, '#1A213D');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // 2. Subtle Radial Light Spotlight
  const spotGrad = ctx.createRadialGradient(
    size * 0.5, size * 0.38, size * 0.05,
    size * 0.5, size * 0.38, size * 0.48
  );
  spotGrad.addColorStop(0, 'rgba(99, 102, 241, 0.28)');
  spotGrad.addColorStop(0.6, 'rgba(79, 70, 229, 0.12)');
  spotGrad.addColorStop(1, 'rgba(11, 15, 29, 0)');
  ctx.fillStyle = spotGrad;
  ctx.fillRect(0, 0, size, size);

  // 3. Safe Zone Layout Calculation
  // Android Adaptive Icons crop outside the central 66% circle.
  // Standard icons can use 86% of the canvas.
  const scale = isMaskable ? 0.70 : 0.88;
  const avatarDiameter = size * scale * 0.84;
  const avatarCenterX = size / 2;
  const avatarCenterY = isMaskable ? size * 0.46 : size * 0.45;
  const avatarRadius = avatarDiameter / 2;

  // 4. Subtle Outer Glow Ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + (size * 0.02), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.fill();
  ctx.restore();

  // 5. Draw Avatar with Circular Mask (Intelligent Face-Centric Crop)
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Fill dark background inside circle before image
  ctx.fillStyle = '#0F172A';
  ctx.fill();

  if (sourceImg && sourceImg.width && sourceImg.height) {
    const sw = sourceImg.width;
    const sh = sourceImg.height;

    // Smart crop: Focus on the upper 70% (head & shoulders)
    const cropSquare = Math.min(sw, sh * 0.88);
    const srcX = Math.max(0, (sw - cropSquare) / 2);
    const srcY = Math.max(0, sh * 0.02); // Focus higher up for portrait face

    ctx.drawImage(
      sourceImg,
      srcX, srcY, cropSquare, cropSquare,
      avatarCenterX - avatarRadius,
      avatarCenterY - avatarRadius,
      avatarDiameter,
      avatarDiameter
    );
  }
  ctx.restore();

  // 6. Luxury Metallic Gold & Indigo Outer Border Ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  const ringGrad = ctx.createLinearGradient(
    avatarCenterX - avatarRadius, avatarCenterY - avatarRadius,
    avatarCenterX + avatarRadius, avatarCenterY + avatarRadius
  );
  ringGrad.addColorStop(0, '#F59E0B');   // Amber Gold
  ringGrad.addColorStop(0.35, '#FDE68A'); // Light Shimmer Gold
  ringGrad.addColorStop(0.7, '#6366F1');  // Indigo Violet
  ringGrad.addColorStop(1, '#F59E0B');    // Amber Gold
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = Math.max(2, size * 0.024);
  ctx.stroke();
  ctx.restore();

  // 7. Bottom Luxury Emblem Pill ("THE MASTER")
  if (size >= 96) {
    ctx.save();
    const badgeW = size * (isMaskable ? 0.48 : 0.56);
    const badgeH = size * 0.088;
    const badgeX = (size - badgeW) / 2;
    const badgeY = avatarCenterY + avatarRadius - (badgeH * 0.42);
    const badgeR = badgeH / 2;

    // Badge Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = size * 0.025;
    ctx.shadowOffsetY = size * 0.01;

    // Badge Background
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
    const badgeBg = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
    badgeBg.addColorStop(0, '#1E1B4B');
    badgeBg.addColorStop(1, '#0B0F1D');
    ctx.fillStyle = badgeBg;
    ctx.fill();

    // Badge Gold Border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, size * 0.008);
    const badgeBorderGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    badgeBorderGrad.addColorStop(0, '#F59E0B');
    badgeBorderGrad.addColorStop(0.5, '#FEF08A');
    badgeBorderGrad.addColorStop(1, '#F59E0B');
    ctx.strokeStyle = badgeBorderGrad;
    ctx.stroke();

    // Badge Text
    const fontSize = Math.round(badgeH * 0.52);
    ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FCD34D';
    ctx.fillText('THE MASTER', size / 2, badgeY + (badgeH / 2) + (size * 0.002));
    ctx.restore();
  }

  return canvas;
}

/**
 * Converts canvas to a PNG Blob
 * @param {HTMLCanvasElement} canvas 
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Updates browser link tags dynamically (Favicon and Apple Touch Icon) in the active document
 * @param {HTMLCanvasElement} standardCanvas 
 */
export function updateActiveDocumentIcons(standardCanvas) {
  try {
    const dataUrl = standardCanvas.toDataURL('image/png');

    // 1. Update/Add Favicon
    let favLink = document.querySelector('link[rel="icon"]');
    if (!favLink) {
      favLink = document.createElement('link');
      favLink.rel = 'icon';
      document.head.appendChild(favLink);
    }
    favLink.type = 'image/png';
    favLink.href = dataUrl;

    // 2. Update/Add Apple Touch Icon
    let appleLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = dataUrl;

    console.log('✓ Dynamic platform icons updated in active DOM session.');
  } catch (err) {
    console.warn('Could not update document icons dynamically:', err);
  }
}

/**
 * Generates the full suite of icon sizes from an image
 * @param {string|File|Blob} source 
 * @returns {Promise<{ standardBlob: Blob, maskableBlob: Blob, dataUrl: string }>}
 */
export async function generatePlatformIconsSuite(source) {
  const img = await loadImage(source);
  const stdCanvas = generateMasterIconCanvas(img, 512, false);
  const maskCanvas = generateMasterIconCanvas(img, 512, true);

  const [standardBlob, maskableBlob] = await Promise.all([
    canvasToBlob(stdCanvas),
    canvasToBlob(maskCanvas)
  ]);

  updateActiveDocumentIcons(stdCanvas);

  return {
    standardBlob,
    maskableBlob,
    dataUrl: stdCanvas.toDataURL('image/png')
  };
}
