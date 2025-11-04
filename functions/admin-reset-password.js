import { createClient } from '@supabase/supabase-js';

// Cloudflare Pages Function: POST /admin-reset-password
// Body: { userId?: string, newPassword?: string }
// Auth: Authorization: Bearer <access_token> (from supabase auth)
export async function onRequestPost({ request, env }) {
  try {
    const SUPABASE_URL = env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Supabase env vars not configured' }), { status: 500 });
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing bearer token' }), { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId, newPassword } = body || {};
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 });
    }

    // Clients
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Validate requester is admin
    const { data: requesterData, error: requesterErr } = await anon.auth.getUser(token);
    if (requesterErr || !requesterData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    const requesterId = requesterData.user.id;
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();
    if (profileErr || !profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Generate strong random password if not provided
    const generated = newPassword || [...crypto.getRandomValues(new Uint32Array(4))]
      .map(n => n.toString(36))
      .join('')
      .slice(0, 16) + 'A1!';

    // Attempt 1: update by provided auth user ID
    let updateErr = null;
    let updated = false;
    try {
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        password: generated,
        email_confirm: true
      });
      updateErr = updErr || null;
      updated = !updErr;
    } catch (e) {
      updateErr = e;
    }

    // If not found, try to resolve the auth user by email and retry
    if (!updated && updateErr && `${updateErr.message || ''}`.toLowerCase().includes('user not found')) {
      // fetch email from profiles
      const { data: profileById } = await admin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      const email = profileById?.email;
      if (email) {
        const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        if (resp.ok) {
          const arr = await resp.json();
          const authUser = Array.isArray(arr) ? arr[0] : null;
          if (authUser?.id) {
            const { error: updErr2 } = await admin.auth.admin.updateUserById(authUser.id, {
              password: generated,
              email_confirm: true
            });
            if (!updErr2) {
              updated = true;
            } else {
              updateErr = updErr2;
            }
          }
        }
      }
    }

    if (!updated) {
      const msg = updateErr?.message || 'Failed to set password (user not found)';
      return new Response(JSON.stringify({ error: msg }), { status: 404 });
    }

    // Flag must_change_password on profile (if column exists)
    await admin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId);

    return new Response(JSON.stringify({ ok: true, password: generated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), { status: 500 });
  }
}


