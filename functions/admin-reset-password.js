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
    // Verificar se as variáveis de ambiente estão configuradas
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Variáveis de ambiente não configuradas',
          detail: 'Configure SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no Cloudflare Pages'
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
    const verifyUrl = `${env.SUPABASE_URL}/auth/v1/user`;
    const verifyResp = await fetch(verifyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': env.SUPABASE_ANON_KEY
      }
    });

    if (!verifyResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userData = await verifyResp.json();
    
    // Verificar se é admin
    const profileUrl = `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=role`;
    const profileResp = await fetch(profileUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': env.SUPABASE_ANON_KEY,
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
    const userProfileUrl = `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=email`;
    const userProfileResp = await fetch(userProfileUrl, {
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
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
    const authUsersUrl = `${env.SUPABASE_URL}/auth/v1/admin/users?email=eq.${encodeURIComponent(userEmail)}`;
    const authUsersResp = await fetch(authUsersUrl, {
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
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
    const updateUrl = `${env.SUPABASE_URL}/auth/v1/admin/users/${authUserId}`;
    const updateResp = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
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

