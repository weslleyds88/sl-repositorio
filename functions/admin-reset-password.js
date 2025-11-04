/**
 * Cloudflare Pages Function para resetar senha de atleta
 * 
 * Requer:
 * - SUPABASE_URL (env var)
 * - SUPABASE_SERVICE_ROLE_KEY (env var)
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // Usar variáveis REACT_APP_ como fallback (para compatibilidade)
    const supabaseUrl = env.SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;
    
    // Verificar se as variáveis de ambiente estão configuradas
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Variáveis de ambiente não configuradas',
          detail: 'Configure SUPABASE_URL (ou REACT_APP_SUPABASE_URL), SUPABASE_ANON_KEY (ou REACT_APP_SUPABASE_ANON_KEY) e SUPABASE_SERVICE_ROLE_KEY (ou REACT_APP_SUPABASE_SERVICE_ROLE_KEY) no Cloudflare Pages',
          debug: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
            hasServiceKey: !!serviceRoleKey,
            availableKeys: Object.keys(env).filter(k => k.includes('SUPABASE'))
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar autenticação do admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Token necessário' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar se o token é válido e se o usuário é admin
    const verifyUrl = `${supabaseUrl}/auth/v1/user`;
    const verifyResp = await fetch(verifyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey
      }
    });

    if (!verifyResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let userData;
    try {
      userData = await verifyResp.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar resposta da API',
          detail: 'Resposta não é um JSON válido'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // A API /auth/v1/user pode retornar { id, ... } ou { user: { id, ... } }
    const userId = userData?.id || userData?.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao obter ID do usuário',
          detail: 'Resposta da API não contém ID do usuário',
          debug: { 
            hasId: !!userData?.id,
            hasUser: !!userData?.user,
            hasUserId: !!userData?.user?.id,
            keys: Object.keys(userData || {})
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se é admin
    const profileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`;
    const profileResp = await fetch(profileUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar perfil' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const profileData = await profileResp.json();
    if (!profileData || profileData.length === 0 || profileData[0].role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem resetar senhas' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obter dados da requisição
    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Gerar senha aleatória se não fornecida
    let passwordToSet = newPassword;
    if (!passwordToSet) {
      // Gerar senha aleatória de 12 caracteres
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      passwordToSet = Array.from({ length: 12 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    }

    // Buscar email do usuário no profiles
    const userProfileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=email`;
    const userProfileResp = await fetch(userProfileUrl, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (!userProfileResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar perfil do usuário' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userProfileData = await userProfileResp.json();
    if (!userProfileData || userProfileData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userProfileData[0].email;

    // Buscar usuário no auth.users pelo email
    const authUsersUrl = `${supabaseUrl}/auth/v1/admin/users?email=eq.${encodeURIComponent(userEmail)}`;
    const authUsersResp = await fetch(authUsersUrl, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (!authUsersResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuário no auth' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authUsersData = await authUsersResp.json();
    if (!authUsersData || authUsersData.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Usuário não encontrado em Authentication',
          detail: 'Crie o usuário manualmente no Supabase Dashboard (Authentication → Users → Add user)'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authUserId = authUsersData[0].id;

    // Atualizar senha usando Admin API
    const updateUrl = `${supabaseUrl}/auth/v1/admin/users/${authUserId}`;
    const updateResp = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: passwordToSet,
        email_confirm: true
      })
    });

    if (!updateResp.ok) {
      const errorText = await updateResp.text().catch(() => 'Erro desconhecido');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao atualizar senha',
          detail: errorData,
          status: updateResp.status
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Retornar sucesso com a senha gerada
    return new Response(
      JSON.stringify({ 
        success: true,
        password: passwordToSet,
        message: 'Senha resetada com sucesso'
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no reset de senha:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        detail: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

