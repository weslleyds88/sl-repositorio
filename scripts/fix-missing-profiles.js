const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Script para criar perfis automaticamente para usuários sem perfil
const fixMissingProfiles = async () => {
  console.log('🔧 Corrigindo perfis ausentes...\n');

  // Carregar variáveis do ambiente
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variáveis de ambiente não configuradas!');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Buscar usuários do auth
    console.log('🔍 Buscando usuários no auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao buscar usuários do auth:', authError.message);
      console.log('💡 Tente executar as consultas SQL manuais no Supabase Dashboard');
      return;
    }

    // Buscar perfis existentes
    console.log('📋 Buscando perfis existentes...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError.message);
      return;
    }

    const existingProfileIds = new Set(profiles.map(p => p.id));

    // Encontrar usuários sem perfil
    const usersWithoutProfile = authUsers.users.filter(user => !existingProfileIds.has(user.id));

    console.log(`👤 Usuários sem perfil encontrados: ${usersWithoutProfile.length}`);

    if (usersWithoutProfile.length === 0) {
      console.log('✅ Todos os usuários já têm perfil!');
      return;
    }

    // Criar perfis para usuários sem perfil
    console.log('🔨 Criando perfis...');
    for (const user of usersWithoutProfile) {
      try {
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            role: 'athlete',
            status: 'pending'
          });

        if (createError) {
          console.error(`❌ Erro ao criar perfil para ${user.email}:`, createError.message);
        } else {
          console.log(`✅ Perfil criado para: ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${user.email}:`, error.message);
      }
    }

    console.log('\n🎉 Processo concluído!');
    console.log('💡 Recarregue o painel administrativo para ver os novos cadastros pendentes');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('💡 Como alternativa, execute as consultas SQL manuais no Supabase Dashboard');
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  fixMissingProfiles();
}

module.exports = { fixMissingProfiles };
