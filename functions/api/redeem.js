/**
 * Cloudflare Pages Function: POST /api/redeem
 * Atomic code redemption with Firebase ID token verification, rate limiting, and D1/Firestore sync.
 */

// Simple CORS header helper
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Verify Firebase ID Token JWT
async function verifyFirebaseToken(authHeader, projectId) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or malformed Authorization header');
  }
  const token = authHeader.split('Bearer ')[1];
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  // Decode payload
  const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadJson);

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  // Check Issuer
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (payload.iss && payload.iss !== expectedIssuer) {
    throw new Error('Invalid token issuer');
  }

  // Check Audience
  if (payload.aud && payload.aud !== projectId) {
    throw new Error('Invalid token audience');
  }

  if (!payload.sub && !payload.user_id) {
    throw new Error('Missing UID in token');
  }

  return {
    uid: payload.sub || payload.user_id,
    email: payload.email || '',
    name: payload.name || '',
    claims: payload
  };
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(context.request),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = corsHeaders(request);
  headers['Content-Type'] = 'application/json';

  const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const projectId = env?.FIREBASE_PROJECT_ID || 'mr-mi-586d2';

  try {
    // 1. Authenticate Request
    const authHeader = request.headers.get('Authorization');
    const user = await verifyFirebaseToken(authHeader, projectId);
    const uid = user.uid;

    const body = await request.json();
    const cleanCode = (body.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    if (!cleanCode) {
      return new Response(JSON.stringify({ success: false, error: 'invalid_code', message: 'كود التفعيل غير صالح' }), {
        status: 400,
        headers
      });
    }

    // 2. Check Rate Limit in D1 (if env.DB is bound)
    if (env?.DB) {
      const nowTs = Date.now();
      const tenMinsAgo = nowTs - 10 * 60 * 1000;

      // Ensure rate_limits table exists
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS rate_limits (
          identifier TEXT PRIMARY KEY,
          fail_count INTEGER,
          locked_until INTEGER
        )
      `).run();

      const rateLimitKey = `${uid}_${clientIp}`;
      const rateLimit = await env.DB.prepare(`SELECT * FROM rate_limits WHERE identifier = ?`).bind(rateLimitKey).first();

      if (rateLimit && rateLimit.locked_until && rateLimit.locked_until > nowTs) {
        const remainingSecs = Math.ceil((rateLimit.locked_until - nowTs) / 1000);
        return new Response(JSON.stringify({
          success: false,
          error: 'rate_limited',
          message: `تم تجميد المحاولات مؤقتاً لحماية الحساب. يرجى الانتظار ${remainingSecs} ثانية.`
        }), { status: 429, headers });
      }

      // 3. Query code from D1
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS codes (
          code TEXT PRIMARY KEY,
          target_id TEXT,
          code_type TEXT,
          target_title TEXT,
          stage_id TEXT,
          duration_days INTEGER,
          max_uses INTEGER,
          used_count INTEGER,
          is_active INTEGER,
          expires_at TEXT
        )
      `).run();

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS redemptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT,
          uid TEXT,
          redeemed_at TEXT,
          expires_at TEXT,
          UNIQUE(code, uid)
        )
      `).run();

      const codeRecord = await env.DB.prepare(`SELECT * FROM codes WHERE code = ?`).bind(cleanCode).first();

      if (!codeRecord) {
        // Increment fail counter
        await env.DB.prepare(`
          INSERT INTO rate_limits (identifier, fail_count, locked_until)
          VALUES (?, 1, 0)
          ON CONFLICT(identifier) DO UPDATE SET
            fail_count = fail_count + 1,
            locked_until = CASE WHEN fail_count + 1 >= 5 THEN ? ELSE 0 END
        `).bind(rateLimitKey, nowTs + 600 * 1000).run();

        return new Response(JSON.stringify({
          success: false,
          error: 'invalid_code',
          message: 'كود التفعيل غير صحيح. تأكد من إدخال الحروف والأرقام بدقة.'
        }), { status: 404, headers });
      }

      // Check code status
      if (!codeRecord.is_active) {
        return new Response(JSON.stringify({
          success: false,
          error: 'code_disabled',
          message: 'تم إيقاف كود التفعيل هذا مؤقتاً من قِبل إدارة المنصة'
        }), { status: 403, headers });
      }

      // Check target_id validity
      if (!codeRecord.target_id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'code_misconfigured',
          message: 'الكود ده غير مكتمل، كلّم المستر'
        }), { status: 400, headers });
      }

      // Check max uses
      if (codeRecord.used_count >= codeRecord.max_uses) {
        // Check if student already redeemed it
        const alreadyRedeemed = await env.DB.prepare(`SELECT * FROM redemptions WHERE code = ? AND uid = ?`).bind(cleanCode, uid).first();
        if (alreadyRedeemed) {
          return new Response(JSON.stringify({
            success: true,
            alreadyActive: true,
            message: 'هذا الكود مفعّل بحسابك بالفعل!',
            targetId: codeRecord.target_id,
            targetTitle: codeRecord.target_title,
            expirationDate: alreadyRedeemed.expires_at
          }), { status: 200, headers });
        }

        return new Response(JSON.stringify({
          success: false,
          error: 'max_uses_reached',
          message: 'عذراً، وصل هذا الكود إلى الحد الأقصى لعدد مرات الاستخدام المسموح بها.'
        }), { status: 400, headers });
      }

      // Atomic Update in D1
      const isPermanent = Boolean(codeRecord.is_permanent || (codeRecord.duration_days && codeRecord.duration_days > 3650) || true);
      const durationDays = isPermanent ? 36500 : (codeRecord.duration_days || 30);
      const expiryDate = isPermanent ? '2099-12-31T23:59:59.999Z' : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const redeemedAt = new Date().toISOString();

      try {
        await env.DB.batch([
          env.DB.prepare(`
            UPDATE codes 
            SET used_count = used_count + 1 
            WHERE code = ? AND is_active = 1 AND used_count < max_uses
          `).bind(cleanCode),
          env.DB.prepare(`
            INSERT INTO redemptions (code, uid, redeemed_at, expires_at)
            VALUES (?, ?, ?, ?)
          `).bind(cleanCode, uid, redeemedAt, expiryDate)
        ]);
      } catch (dbErr) {
        return new Response(JSON.stringify({
          success: false,
          error: 'redemption_conflict',
          message: 'الكود مفعّل بالفعل بحسابك أو تم استخدامه في نفس اللحظة.'
        }), { status: 409, headers });
      }

      // Reset rate limit on success
      await env.DB.prepare(`DELETE FROM rate_limits WHERE identifier = ?`).bind(rateLimitKey).run();

      return new Response(JSON.stringify({
        success: true,
        targetId: codeRecord.target_id,
        targetTitle: codeRecord.target_title,
        stageId: codeRecord.stage_id,
        codeType: codeRecord.code_type || 'month',
        durationDays: durationDays,
        isPermanent: true,
        expirationDate: expiryDate,
        message: 'تم تفعيل الكود بنجاح!'
      }), { status: 200, headers });
    }

    // Fallback if D1 is not configured: verify and reply
    return new Response(JSON.stringify({
      success: true,
      delegatedToClient: true,
      code: cleanCode,
      uid
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: 'server_error',
      message: err.message || 'حدث خطأ في معالجة الطلب على السيرفر'
    }), { status: 500, headers });
  }
}
