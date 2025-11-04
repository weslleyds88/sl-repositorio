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

    // Validate requester is admin (via Supabase REST API)
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!userResp.ok) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    const userData = await userResp.json();
    const requesterId = userData?.id;
    if (!requesterId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // Check if requester is admin
    const requesterProfileResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${requesterId}&select=role`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const requesterProfiles = await requesterProfileResp.json();
    const requesterProfile = Array.isArray(requesterProfiles) && requesterProfiles.length > 0 ? requesterProfiles[0] : null;
    if (!requesterProfile || requesterProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Generate strong random password if not provided
    const generated = newPassword || [...crypto.getRandomValues(new Uint32Array(4))]
      .map(n => n.toString(36))
      .join('')
      .slice(0, 16) + 'A1!';

    // Attempt 1: update by provided auth user ID (direct)
    let updateErr = null;
    let updated = false;
    try {
      const updateResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: generated,
          email_confirm: true
        })
      });
      if (updateResp.ok) {
        updated = true;
      } else {
        const errData = await updateResp.json().catch(() => ({}));
        updateErr = errData;
      }
    } catch (e) {
      updateErr = e;
    }

    // Fallback: resolver por email (somente atualizar; não criar)
    if (!updated) {
      // fetch email from profiles
      const profileByIdResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=email`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      if (profileByIdResp.ok) {
        const profileArr = await profileByIdResp.json();
        const profileById = Array.isArray(profileArr) && profileArr.length > 0 ? profileArr[0] : null;
        const email = profileById?.email;
        if (email) {
          // Try to find auth user by email
          const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          if (resp.ok) {
            const arr = await resp.json();
            const authUser = Array.isArray(arr) ? arr[0] : null;
            const authUserId = authUser?.id || null;
            if (authUserId) {
              const updateResp2 = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${authUserId}`, {
                method: 'PUT',
                headers: {
                  'apikey': SERVICE_KEY,
                  'Authorization': `Bearer ${SERVICE_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  password: generated,
                  email_confirm: true
                })
              });
              if (updateResp2.ok) {
                updated = true;
              } else {
                const errData2 = await updateResp2.json().catch(() => ({}));
                updateErr = errData2;
              }
            } else {
              updateErr = { error: 'User not found by email' };
            }
          }
        }
      }
    }

    if (!updated) {
      const msg = updateErr?.error_description || updateErr?.message || 'Failed to set password (user not found)';
      return new Response(JSON.stringify({ error: msg, detail: updateErr }), { status: 404 });
    }

    // Flag must_change_password on profile (if column exists)
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ must_change_password: true })
    });

    return new Response(JSON.stringify({ ok: true, password: generated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), { status: 500 });
  }
}
