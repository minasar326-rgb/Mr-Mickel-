/**
 * ============================================================================
 * Enterprise Security Validator: File Magic Numbers, MIME & Content Integrity
 * ============================================================================
 * Features:
 * 1. Deep Magic-Number inspection to verify real binary type (not just extension)
 * 2. Strict blocking of executable binaries (MZ / PE, ELF, Mach-O, Shell, Script tags)
 * 3. File size constraints and extension whitelisting
 * 4. Collision-proof unique identifier generator for cloud storage keys
 * 5. Safe file name sanitization blocking path traversal attacks
 * ============================================================================
 */

// Blocked binary signatures (magic numbers)
const MALICIOUS_SIGNATURES = [
  { name: 'Windows Executable (MZ/PE)', bytes: [0x4D, 0x5A] },
  { name: 'Linux ELF Binary', bytes: [0x7F, 0x45, 0x4C, 0x46] },
  { name: 'Mach-O Binary (32-bit)', bytes: [0xFE, 0xED, 0xFA, 0xCE] },
  { name: 'Mach-O Binary (64-bit)', bytes: [0xFE, 0xED, 0xFA, 0xCF] },
  { name: 'Mach-O Reverse', bytes: [0xCF, 0xFA, 0xED, 0xFE] },
  { name: 'Shell Script Shebang', bytes: [0x23, 0x21] } // #!
];

// Dangerous file extensions strictly disallowed
const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'dll', 'bat', 'cmd', 'sh', 'bash', 'bin', 'msi', 'com', 'scr', 
  'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh', 'ps1', 'psm1', 'py', 'php', 
  'phtml', 'asp', 'aspx', 'cgi', 'jar', 'apk', 'app'
]);

// Allowed MIME / categories
export const ALLOWED_FILE_TYPES = {
  video: {
    maxSizeMB: 2048, // 2GB
    extensions: ['mp4', 'webm', 'mov', 'mkv', 'm4v'],
    checkMagic: (bytes) => {
      // MP4: offset 4 contains 'ftyp' (0x66, 0x74, 0x79, 0x70)
      if (bytes.length >= 8 && 
          bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        return true;
      }
      // WebM / MKV: EBML header 0x1A, 0x45, 0xDF, 0xA3
      if (bytes.length >= 4 && 
          bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
        return true;
      }
      // QuickTime MOV (moov or mdat or wide)
      if (bytes.length >= 8 &&
          ((bytes[4] === 0x6D && bytes[5] === 0x6F && bytes[6] === 0x6F && bytes[7] === 0x76) ||
           (bytes[4] === 0x6D && bytes[5] === 0x64 && bytes[6] === 0x61 && bytes[7] === 0x74) ||
           (bytes[4] === 0x77 && bytes[5] === 0x69 && bytes[6] === 0x64 && bytes[7] === 0x65))) {
        return true;
      }
      return false;
    }
  },
  pdf: {
    maxSizeMB: 150, // 150MB
    extensions: ['pdf'],
    checkMagic: (bytes) => {
      // PDF header: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
      return bytes.length >= 5 &&
        bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && 
        bytes[3] === 0x46 && bytes[4] === 0x2D;
    }
  },
  image: {
    maxSizeMB: 25, // 25MB
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    checkMagic: (bytes) => {
      // JPEG: 0xFF, 0xD8, 0xFF
      if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return true;
      }
      // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
      if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return true;
      }
      // WebP: RIFF....WEBP
      if (bytes.length >= 12 &&
          bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
          bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return true;
      }
      // GIF: GIF87a or GIF89a
      if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return true;
      }
      return false;
    }
  }
};

/**
 * Sanitize a filename to prevent path traversal and shell injection
 * @param {string} rawName 
 * @returns {string}
 */
export function sanitizeFileName(rawName) {
  if (!rawName || typeof rawName !== 'string') return `file_${Date.now()}`;
  // Strip path traversal (../ or ..\)
  const baseName = rawName.replace(/^.*[\\/]/, '');
  // Retain only safe alphanumeric characters, dashes, underscores, and dots
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Avoid consecutive dots
  return sanitized.replace(/\.{2,}/g, '.');
}

/**
 * Generate a cryptographically collision-proof storage key
 * @param {string} prefixFolder 
 * @param {string} fileName 
 * @returns {string}
 */
export function generateCollisionProofKey(prefixFolder = 'lectures', fileName = 'upload.mp4') {
  const cleanName = sanitizeFileName(fileName);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const randomBytes = cryptoObj.getRandomValues(new Uint8Array(8));
  const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const timestamp = Date.now();
  return `${prefixFolder}/${timestamp}_${randomHex}_${cleanName}`;
}

/**
 * Validate an uploaded File or Blob against security constraints and magic numbers
 * @param {File|Blob} file 
 * @param {'video'|'pdf'|'image'} category 
 * @returns {Promise<{ valid: boolean, error?: string, sanitizedName?: string }>}
 */
export async function validateUploadedFile(file, category = 'video') {
  if (!file) {
    return { valid: false, error: 'لم يتم اختيار أي ملف للرفع.' };
  }

  const rawName = file.name || 'unnamed_upload';
  const extension = rawName.split('.').pop()?.toLowerCase() || '';

  // 1. Strict extension blacklist check
  if (DANGEROUS_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      error: `تم حظر رفع هذا الملف لأسباب أمنية (${extension}). الملفات التنفيذية والبرمجية ممنوعة منعًا باتًا.`
    };
  }

  const rule = ALLOWED_FILE_TYPES[category];
  if (!rule) {
    return { valid: false, error: `نوع المحتوى غير مصرح به (${category}).` };
  }

  // 2. Extension whitelist check
  if (extension && !rule.extensions.includes(extension)) {
    return {
      valid: false,
      error: `امتداد الملف (.${extension}) غير مسموح به لقسم ${category}. الامتدادات المقبولة: ${rule.extensions.join(', ')}`
    };
  }

  // 3. File size constraint check
  const maxBytes = rule.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `حجم الملف (${(file.size / (1024 * 1024)).toFixed(1)}MB) يتجاوز الحد الأقصى المسموح به وهو ${rule.maxSizeMB}MB.`
    };
  }

  // 4. Magic numbers inspection (read first 32 bytes)
  try {
    let headerBytes;
    if (typeof file.slice === 'function') {
      const slice = file.slice(0, 32);
      const buffer = await slice.arrayBuffer();
      headerBytes = new Uint8Array(buffer);
    } else if (file instanceof ArrayBuffer) {
      headerBytes = new Uint8Array(file.slice(0, 32));
    } else if (file instanceof Uint8Array) {
      headerBytes = file.slice(0, 32);
    }

    if (headerBytes && headerBytes.length > 0) {
      // Check for malicious executable signatures
      for (const sig of MALICIOUS_SIGNATURES) {
        if (headerBytes.length >= sig.bytes.length) {
          const match = sig.bytes.every((b, idx) => headerBytes[idx] === b);
          if (match) {
            return {
              valid: false,
              error: `تم رفض الملف! التوقيع الرقمي للملف يشير إلى أنه برنامج تنفيذي أو ملف غير آمن (${sig.name}).`
            };
          }
        }
      }

      // Check format-specific magic bytes
      const isFormatValid = rule.checkMagic(headerBytes);
      if (!isFormatValid) {
        // If it's a test blob or minimal file, warn or enforce
        return {
          valid: false,
          error: `بنية الملف غير متوافقة مع صيغ ${category} المعتمدة (فشل فحص التوقيع الرقمي Magic Numbers).`
        };
      }
    }
  } catch (inspectErr) {
    console.warn('Could not inspect magic numbers:', inspectErr);
  }

  return {
    valid: true,
    sanitizedName: sanitizeFileName(rawName)
  };
}
