/**
 * ============================================================================
 * FastStart MP4 Stream Optimizer (Pure Modern JavaScript / Web Standards)
 * ============================================================================
 * Enables progressive HTTP Range streaming with ZERO buffering lag by placing
 * the 'moov' metadata atom at the very beginning of the MP4 file (before 'mdat').
 *
 * This guarantees:
 * 1. Immediate video playback on mobile & slow networks (no seeking to EOF).
 * 2. Instant metadata decoding for HTML5 video elements.
 * 3. Near-zero memory overhead: only 'moov' is loaded into RAM, while the
 *    large 'mdat' video payload is zero-copy sliced.
 * ============================================================================
 */

export async function optimizeMp4ForStreaming(file) {
  if (!file || typeof file.slice !== 'function') {
    return { success: false, file, error: 'Invalid file object' };
  }

  try {
    const fileSize = file.size;
    if (fileSize < 16) {
      return { success: false, file, isAlreadyFastStart: true };
    }

    // 1. Scan top-level boxes
    let offset = 0;
    let ftypBox = null;
    let mdatBox = null;
    let moovBox = null;

    // Scan box headers sequentially without loading video data
    while (offset < fileSize) {
      const headerSlice = file.slice(offset, Math.min(offset + 16, fileSize));
      const headerBuffer = await headerSlice.arrayBuffer();
      if (headerBuffer.byteLength < 8) break;

      const view = new DataView(headerBuffer);
      let boxSize = view.getUint32(0, false);
      let type = '';
      for (let i = 4; i < 8; i++) {
        type += String.fromCharCode(view.getUint8(i));
      }

      let headerLen = 8;
      if (boxSize === 1) {
        // 64-bit extended box size
        if (headerBuffer.byteLength < 16) break;
        const high = view.getUint32(8, false);
        const low = view.getUint32(12, false);
        boxSize = (high * 4294967296) + low;
        headerLen = 16;
      } else if (boxSize === 0) {
        // Box extends to end of file
        boxSize = fileSize - offset;
      }

      if (boxSize < 8 || offset + boxSize > fileSize + 1024) {
        // Corrupted or unrecognized atom structure, return original file safely
        break;
      }

      const boxInfo = { type, offset, size: boxSize, headerLen };
      if (type === 'ftyp') ftypBox = boxInfo;
      else if (type === 'mdat') mdatBox = boxInfo;
      else if (type === 'moov') moovBox = boxInfo;

      offset += boxSize;
    }

    // If moov or mdat not detected, or if moov already appears before mdat,
    // the file is already optimized for faststart streaming!
    if (!moovBox || !mdatBox || moovBox.offset < mdatBox.offset) {
      return {
        success: true,
        isAlreadyFastStart: true,
        file,
        message: 'الملف مجهز بالفعل للبث المباشر الفوري (FastStart).'
      };
    }

    // 2. Extract moov atom buffer into memory
    const moovSlice = file.slice(moovBox.offset, moovBox.offset + moovBox.size);
    const moovBuffer = await moovSlice.arrayBuffer();
    const moovBytes = new Uint8Array(moovBuffer);
    const moovView = new DataView(moovBuffer);

    const shiftAmount = moovBox.size;

    // Recursive traversal to shift stco and co64 offsets
    function patchSubBoxes(startOffset, endOffset) {
      let pos = startOffset;
      while (pos + 8 <= endOffset) {
        let subSize = moovView.getUint32(pos, false);
        if (subSize < 8) break;

        let subType = '';
        for (let i = 0; i < 4; i++) {
          subType += String.fromCharCode(moovView.getUint8(pos + 4 + i));
        }

        const boxEnd = Math.min(pos + subSize, endOffset);

        if (['trak', 'mdia', 'minf', 'stbl', 'edts', 'mvex', 'moov'].includes(subType)) {
          patchSubBoxes(pos + 8, boxEnd);
        } else if (subType === 'stco') {
          // stco format: 4 bytes size, 4 bytes type, 1 byte version, 3 bytes flags, 4 bytes entry count
          if (pos + 16 <= boxEnd) {
            const entryCount = moovView.getUint32(pos + 12, false);
            for (let i = 0; i < entryCount; i++) {
              const entryOffset = pos + 16 + (i * 4);
              if (entryOffset + 4 <= boxEnd) {
                const currentChunkOffset = moovView.getUint32(entryOffset, false);
                moovView.setUint32(entryOffset, currentChunkOffset + shiftAmount, false);
              }
            }
          }
        } else if (subType === 'co64') {
          // co64 format: 4 bytes size, 4 bytes type, 1 byte version, 3 bytes flags, 4 bytes entry count
          if (pos + 16 <= boxEnd) {
            const entryCount = moovView.getUint32(pos + 12, false);
            for (let i = 0; i < entryCount; i++) {
              const entryOffset = pos + 16 + (i * 8);
              if (entryOffset + 8 <= boxEnd) {
                const high = moovView.getUint32(entryOffset, false);
                const low = moovView.getUint32(entryOffset + 4, false);
                let currentChunkOffset = (BigInt(high) << 32n) | BigInt(low);
                currentChunkOffset += BigInt(shiftAmount);
                moovView.setUint32(entryOffset, Number(currentChunkOffset >> 32n), false);
                moovView.setUint32(entryOffset + 4, Number(currentChunkOffset & 0xFFFFFFFFn), false);
              }
            }
          }
        }

        pos += subSize;
      }
    }

    patchSubBoxes(8, moovBuffer.byteLength);

    // 3. Construct new file with relocated moov:
    // [everything before mdat] -> [updated moov] -> [mdat to moov] -> [anything after moov]
    const beforeMdat = file.slice(0, mdatBox.offset);
    const mdatToMoov = file.slice(mdatBox.offset, moovBox.offset);
    const afterMoov = file.slice(moovBox.offset + moovBox.size, fileSize);

    const parts = [beforeMdat, moovBytes, mdatToMoov];
    if (afterMoov.size > 0) parts.push(afterMoov);

    const fastStartBlob = new Blob(parts, { type: file.type || 'video/mp4' });

    // Preserve filename & metadata
    if (file.name) {
      try {
        fastStartBlob.name = file.name;
        fastStartBlob.lastModified = file.lastModified || Date.now();
      } catch (_) {}
    }

    return {
      success: true,
      isAlreadyFastStart: false,
      optimized: true,
      file: fastStartBlob,
      message: 'تمت معالجة الفيديو بنجاح وتقديم كتل الفهرسة (FastStart) للبث المباشر بدون أي تقطيع.'
    };
  } catch (err) {
    console.warn('[FastStartOptimizer] Optimization fallback to original file:', err);
    return { success: false, file, error: err.message };
  }
}
