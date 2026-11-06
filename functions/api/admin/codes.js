/**
 * Cloudflare Pages Function: /api/admin/codes
 * Teacher protected management endpoints for codes and audit logs.
 */

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

async function verifyTeacher(request, projectId) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const token = authHeader.split('Bearer ')[1];
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid Token');
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

  const adminEmails = [
    'teacher@gmail.com',
    'mrmichaelshehata@gmail.com',
    'admin@themaster.com',
    'saryanymina@gmail.com'
  ];

  const isTeacher = payload.role === 'teacher' || 
    payload.admin === true || 
    adminEmails.includes((payload.email || '').toLowerCase()) ||
    payload.sub === 'teacher-admin';

  if (!isTeacher) {
    throw new Error('Forbidden: Teacher access required');
  }

  return payload;
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = corsHeaders(request);
  headers['Content-Type'] = 'application/json';

  try {
    await verifyTeacher(request, env?.FIREBASE_PROJECT_ID || 'mr-mi-586d2');

    if (!env?.DB) {
      return new Response(JSON.stringify({ success: true, codes: [], message: 'D1 not bound' }), { status: 200, headers });
    }

    const { results } = await env.DB.prepare(`SELECT * FROM codes ORDER BY rowid DESC LIMIT 100`).all();
    return new Response(JSON.stringify({ success: true, codes: results || [] }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 403, headers });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = corsHeaders(request);
  headers['Content-Type'] = 'application/json';

  try {
    const admin = await verifyTeacher(request, env?.FIREBASE_PROJECT_ID || 'mr-mi-586d2');
    const body = await request.json();
    const action = body.action || 'create';

    if (!env?.DB) {
      return new Response(JSON.stringify({ success: false, error: 'D1 database not configured' }), { status: 500, headers });
    }

    if (action === 'create') {
      const { code, targetId, codeType, targetTitle, stageId, durationDays, maxUses } = body;
      if (!code || !targetId) {
        return new Response(JSON.stringify({ success: false, error: 'Missing code or targetId' }), { status: 400, headers });
      }

      await env.DB.prepare(`
        INSERT INTO codes (code, target_id, code_type, target_title, stage_id, duration_days, max_uses, used_count, is_active, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, NULL)
      `).bind(
        code.trim().toUpperCase(),
        targetId.trim(),
        codeType || 'month',
        targetTitle || '',
        stageId || '',
        Number(durationDays) || 30,
        Number(maxUses) || 1
      ).run();

      return new Response(JSON.stringify({ success: true, message: 'تم إنشاء الكود بنجاح' }), { status: 201, headers });
    }

    if (action === 'toggle_active') {
      const { code, isActive } = body;
      await env.DB.prepare(`UPDATE codes SET is_active = ? WHERE code = ?`).bind(isActive ? 1 : 0, code).run();
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), { status: 400, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 403, headers });
  }
}
