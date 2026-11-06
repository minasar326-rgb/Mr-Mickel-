  // -------------------------------------------------------------
  // رفع الفيديو: لا نشر بفيديو غير مرفوع فعلاً على السحابة
  // -------------------------------------------------------------
  const startVideoUpload = async (file) => {
    lastVideoFileRef.current = file;
    setIsUploading(true);
    setVideoStatus('uploading');
    setVideoUrl('');            // مفيش رابط إلا بعد نجاح الرفع والتحقق
    setLocalMediaKey(null);     // مفيش اعتماد على IndexedDB في التشغيل
    setUploadProgress(2);
    setUploadDetails((prev) => ({
      ...prev,
      percent: 2,
      transferredMB: '0',
      isCloudReady: false,
      cloudNotice: false,
      errorMessage: ''
    }));

    const r2Folder = stageId ? `stages/${stageId}/lectures/videos` : 'lectures/videos';
    try {
      const res = await uploadFileToR2(file, r2Folder, (prog) => {
        setUploadDetails((prev) => ({
          ...prev,
          percent: prog.percent,
          transferredMB: prog.transferredMB,
          totalMB: prog.totalMB
        }));
        setUploadProgress(prog.percent);
      }, 'video');

      // تأكد إن الرابط شغال فعلاً قبل ما نعتبر الفيديو جاهز
      const check = await verifyVideoUrl(res.downloadUrl);
      if (!check.valid) {
        throw new Error(check.error || 'الفيديو اترفع لكن الرابط مش شغال.');
      }

      setVideoUrl(res.downloadUrl);
      setVideoStatus('ready');
      setIsUploading(false);
      setUploadProgress(100);
      setUploadDetails((prev) => ({ ...prev, percent: 100, isCloudReady: true, cloudNotice: false, errorMessage: '' }));
      addToast('✅ الفيديو اترفع على السحابة واتأكدنا إنه شغال. تقدر تنشر المحاضرة.', 'success', 5000);
    } catch (err) {
      console.error('Video upload failed:', err);
      const message = (err && err.message) ? err.message : 'حصل خطأ غير معروف أثناء الرفع.';
      setIsUploading(false);
      setVideoUrl('');
      setVideoStatus('failed');
      setUploadDetails((prev) => ({ ...prev, isCloudReady: false, cloudNotice: true, errorMessage: message }));
      addToast(`❌ فشل رفع الفيديو: ${message}`, 'error', 10000);
    }
  };

  const retryVideoUpload = () => {
    if (lastVideoFileRef.current) {
      startVideoUpload(lastVideoFileRef.current);
    } else {
      addToast('اختار ملف الفيديو من جديد.', 'error', 4000);
    }
  };

  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // فحص أمني (الامتداد + الـ magic number + الحجم)
    const validation = await validateUploadedFile(file, 'video');
    if (!validation.valid) {
      setIsUploading(false);
      addToast(validation.error || 'تم رفض ملف الفيديو لأسباب أمنية', 'error', 6000);
      return;
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setVideoFileName(file.name);
    setVideoFileSize(`${sizeMB} MB`);
    setUploadDetails({ percent: 0, transferredMB: '0', totalMB: sizeMB, isCloudReady: false, localSaved: false, cloudNotice: false, errorMessage: '' });

    // معاينة محلية فقط (مش بتتحفظ ولا بتتنشر)
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);

    // مدة الفيديو
    const tempVideo = document.createElement('video');
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      const totalSecs = Math.floor(tempVideo.duration);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      const durStr = hours > 0
        ? `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
        : `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      setDuration(durStr);
    };

    await startVideoUpload(file);
  };
