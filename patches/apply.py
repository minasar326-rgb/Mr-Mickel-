import re, sys
path = sys.argv[1]
raw = open(path, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
s = raw.replace('\r\n', '\n')

def sub_once(pattern, repl, text, flags=0):
    new, n = re.subn(pattern, lambda m: repl, text, count=1, flags=flags)
    assert n == 1, f'pattern not found exactly once: {pattern[:60]}'
    return new

# 1) ref for last file
s = sub_once(r"(  const videoFileInputRef = useRef\(null\);\n)", "  const videoFileInputRef = useRef(null);\n  const lastVideoFileRef = useRef(null);\n", s)

# 2) replace handleVideoFileChange entirely
new_handlers = open(sys.argv[2], encoding='utf-8').read()
start = s.index('  const handleVideoFileChange = async (e) => {')
end = s.index('  const handleImageFileChange = (e, setter')
s = s[:start] + new_handlers + s[end:]

# 3) publish validation
old_pub = re.compile(r"      const cleanVideoUrl = \(videoUrl && !videoUrl\.startsWith\('blob:'\)\) \n        \? videoUrl \n        : \(localMediaKey \|\| ''\);\n\n      if \(videoSourceType === 'file' && videoFileName && !cleanVideoUrl && !localMediaKey\) \{\n.*?\n        setIsSubmitting\(false\);\n        return;\n      \}\n", re.S)
new_pub = """      // الفيديو لازم يكون رابط https دائم على السحابة (مش مفتاح محلي ولا blob:)
      const cleanVideoUrl = (videoUrl && /^https?:\\/\\//i.test(videoUrl)) ? videoUrl : '';

      if (videoSourceType === 'file' && videoFileName && !cleanVideoUrl) {
        addToast(
          isUploading
            ? '⏳ الفيديو لسه بيترفع، استنى لحد ما يخلص وبعدين انشر.'
            : '⚠️ الفيديو مش مرفوع على السحابة، فمش هيشتغل عند الطلاب. اضغط "إعادة المحاولة" أو اختار الملف تاني.',
          'error',
          8000
        );
        setIsSubmitting(false);
        return;
      }

      if (videoSourceType === 'file' && cleanVideoUrl) {
        const verify = await verifyVideoUrl(cleanVideoUrl);
        if (!verify.valid) {
          addToast(`⚠️ رابط الفيديو مش شغال (${verify.error || 'غير معروف'}). ارفعه تاني قبل النشر.`, 'error', 8000);
          setIsSubmitting(false);
          return;
        }
      }
"""
s, n = old_pub.subn(lambda m: new_pub, s, count=1)
assert n == 1, 'publish block not found'

# 4) payload: no local media key for new uploads
s = sub_once(r"      localMediaKey: localMediaKey,\n", "      localMediaKey: '',\n", s)

# 5) honest status badge + retry button
old_badge = re.compile(r"\{videoUrl \? \(<><CheckCircle2 size=\{16\} color=\"#059669\" /> ✅ تم رفع وتأمين الفيديو سحابياً بنجاح! متاح لجميع الطلاب فور النشر</>\) : \(<><AlertCircle size=\{16\} color=\"#DC2626\" /> ⚠️ لم يتم استكمال الرفع السحابي بعد - يرجى الانتظار أو إعادة المحاولة</>\)\}")
new_badge = """{videoStatus === 'ready' && videoUrl ? (<><CheckCircle2 size={16} color="#059669" /> ✅ الفيديو على السحابة وشغال، متاح لجميع الطلاب فور النشر</>) : (<><AlertCircle size={16} color="#DC2626" /> ❌ الفيديو لم يُرفع على السحابة، لن يعمل عند الطلاب{uploadDetails.errorMessage ? `: ${uploadDetails.errorMessage}` : ''}</>)}"""
s, n = old_badge.subn(lambda m: new_badge, s, count=1)
assert n == 1, 'badge not found'

old_note = re.compile(r"💡 الفيديو شغال ومحفوظ بجهازك \(لتفعيله سحابياً انشر قواعد Storage في فايربيز\)")
s, n = old_note.subn(lambda m: "⚠️ الرفع فشل — الفيديو لن يُنشر قبل نجاح الرفع", s, count=1)
assert n == 1, 'note not found'

# retry button after the status chips container: insert before the closing of the chips flex div
anchor = "                                    ⏳ جاري مزامنة السحابة بالخلفية...\n                                  </span>\n                                )}\n                              </div>\n"
assert s.count(anchor) == 1, 'retry anchor not found'
retry = anchor + """                              {videoStatus === 'failed' && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={(ev) => { ev.stopPropagation(); retryVideoUpload(); }}
                                >
                                  🔄 إعادة محاولة الرفع
                                </button>
                              )}
"""
s = s.replace(anchor, retry)

# the label text was claiming unlimited formats incl. AVI; align with validator
s = s.replace("يدعم كافة الصيغ: MP4, MKV, MOV, AVI, WebM بدون قيود حجم!", "الصيغ المدعومة: MP4, MOV, MKV, WebM, M4V (حتى 2GB)")

out = s.replace('\n', '\r\n') if crlf else s
open(path, 'wb').write(out.encode('utf-8'))
print('patched OK; crlf =', crlf)
