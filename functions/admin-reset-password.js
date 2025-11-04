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
    console.log('Fazendo requisição para:', verifyUrl);
    
    const verifyResp = await fetch(verifyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey
      }
    });

    console.log('Status da verificação:', verifyResp.status);
    console.log('Headers da verificação:', Object.fromEntries(verifyResp.headers));

    if (!verifyResp.ok) {
      const errorText = await verifyResp.text();
      console.error('Erro na verificação:', errorText);
      return new Response(
        JSON.stringify({ error: 'Token inválido', detail: errorText }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let userData;
    try {
      userData = await verifyResp.json();
      console.log('Resposta completa da verificação:', JSON.stringify(userData, null, 2));
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar resposta da API',
          detail: 'Resposta não é um JSON válido'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // CORREÇÃO: Verificação mais robusta da estrutura da resposta
    let userId = null;

    // Verificar diferentes estruturas possíveis da resposta
    if (userData && typeof userData === 'object') {
      // Estrutura 1: { user: { id: ... } }
      if (userData.user && userData.user.id) {
        userId = userData.user.id;
        console.log('ID encontrado em userData.user.id:', userId);
      } 
      // Estrutura 2: { id: ... } (diretamente)
      else if (userData.id) {
        userId = userData.id;
        console.log('ID encontrado em userData.id:', userId);
      }
      // Estrutura 3: Verificar se há alguma propriedade que contenha o ID
      else {
        // Procurar por qualquer propriedade que possa conter o ID
        for (const key in userData) {
          if (userData[key] && typeof userData[key] === 'object' && userData[key].id) {
            userId = userData[key].id;
            console.log(`ID encontrado em userData.${key}.id:`, userId);
            break;
          }
        }
      }
    }

    // Se ainda não encontrou o ID, retornar erro detalhado
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao obter ID do usuário',
          detail: 'Resposta da API não contém ID do usuário na estrutura esperada',
          debug: { 
            userData: userData,
            userDataType: typeof userData,
            keys: userData ? Object.keys(userData) : 'userData é undefined/null',
            fullResponse: userData
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se é admin
    const profileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`;
    console.log('Verificando perfil admin:', profileUrl);
    
    const profileResp = await fetch(profileUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResp.ok) {
      const errorText = await profileResp.text();
      console.error('Erro ao verificar perfil:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar perfil', detail: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const profileData = await profileResp.json();
    console.log('Dados do perfil:', profileData);

    if (!profileData || profileData.length === 0 || profileData[0].role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem resetar senhas' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obter dados da requisição
    const body = await request.json();
    console.log('Corpo da requisição:', body);
    
    const { userId: targetUserId, newPassword } = body;

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Gerar senha aleatória se não fornecida
    let passwordToSet = newPassword;
    if (!passwordToSet) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      passwordToSet = Array.from({ length: 12 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    }

    console.log('Resetando senha para userId:', targetUserId);

    // Buscar email do usuário no profiles
    const userProfileUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${targetUserId}&select=email`;
    console.log('Buscando perfil do usuário:', userProfileUrl);
    
    const userProfileResp = await fetch(userProfileUrl, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (!userProfileResp.ok) {
      const errorText = await userProfileResp.text();
      console.error('Erro ao buscar perfil do usuário:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar perfil do usuário', detail: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userProfileData = await userProfileResp.json();
    console.log('Perfil do usuário alvo:', userProfileData);

    if (!userProfileData || userProfileData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userProfileData[0].email;
    console.log('Email do usuário alvo:', userEmail);

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'Email do usuário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar usuário no auth.users pelo email
    const authUsersUrl = `${supabaseUrl}/auth/v1/admin/users?email=eq.${encodeURIComponent(userEmail)}`;
    console.log('Buscando usuário no auth:', authUsersUrl);
    
    const authUsersResp = await fetch(authUsersUrl, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (!authUsersResp.ok) {
      const errorText = await authUsersResp.text();
      console.error('Erro ao buscar usuário no auth:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuário no auth', detail: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authUsersData = await authUsersResp.json();
    console.log('Dados do auth users:', authUsersData);

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
    console.log('Auth User ID:', authUserId);

    // Atualizar senha usando Admin API
    const updateUrl = `${supabaseUrl}/auth/v1/admin/users/${authUserId}`;
    console.log('Atualizando senha em:', updateUrl);
    
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
      console.error('Erro ao atualizar senha:', errorText);
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

    console.log('Senha atualizada com sucesso');

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
