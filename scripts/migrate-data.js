const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Script para migrar dados do schema antigo para o novo
const migrateData = async () => {
  console.log('🚀 Iniciando migração de dados...\n');

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variáveis de ambiente não configuradas!');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Criar admin padrão se não existir
    console.log('👤 Criando usuário admin...');
    const { data: adminData, error: adminError } = await supabase.auth.signUp({
      email: 'admin@saoluiz.com',
      password: 'admin123',
      options: {
        data: {
          full_name: 'Administrador São Luiz',
          role: 'admin'
        }
      }
    });

    if (adminError && adminError.message !== 'User already registered') {
      console.error('Erro ao criar admin:', adminError.message);
    } else {
      console.log('✅ Admin criado/verificado');
    }

    // 2. Migrar members para profiles (versão simplificada)
    console.log('📋 Migrando members para profiles...');
    const { data: existingMembers, error: existingError } = await supabase
      .from('members')
      .select('*');

    if (existingError) {
      console.error('Erro ao buscar members:', existingError.message);
    } else {
      for (const member of existingMembers) {
        // Verificar se já existe profile para este member
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', `${member.full_name.toLowerCase().replace(/\s+/g, '.')}@saoluiz.com`)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: member.id, // Manter o mesmo ID
              email: `${member.full_name.toLowerCase().replace(/\s+/g, '.')}@saoluiz.com`,
              full_name: member.full_name,
              phone: member.phone,
              role: 'athlete',
              status: 'approved',
              created_at: member.created_at,
              updated_at: member.updated_at
            });

          if (profileError) {
            console.error(`Erro ao migrar member ${member.id}:`, profileError.message);
          }
        }
      }
      console.log(`✅ ${existingMembers.length} members verificados/migrados para profiles`);
    }

    // 3. Criar grupos padrão (versão simplificada)
    console.log('🏗️ Criando grupos padrão...');
    const { data: existingGroups } = await supabase
      .from('user_groups')
      .select('name');

    const defaultGroups = [
      { name: 'Mensalistas', description: 'Grupo para pagamentos mensais regulares', type: 'monthly' },
      { name: 'Grupo Geral', description: 'Grupo padrão para pagamentos existentes', type: 'team' },
      { name: 'Campeonato Escola Indiano Sub 19', description: 'Grupo do campeonato específico', type: 'tournament' },
      { name: 'Equipe Principal', description: 'Grupo da equipe principal do clube', type: 'team' }
    ];

    if (existingGroups) {
      for (const group of defaultGroups) {
        const exists = existingGroups.find(g => g.name === group.name);
        if (!exists) {
          await supabase
            .from('user_groups')
            .insert(group);
        }
      }
      console.log('✅ Grupos padrão criados');
    }

    // 4. Atribuir pagamentos ao grupo geral (versão simplificada)
    console.log('💳 Atribuindo pagamentos ao grupo geral...');
    const { data: defaultGroup } = await supabase
      .from('user_groups')
      .select('id')
      .eq('name', 'Grupo Geral')
      .single();

    if (defaultGroup) {
      // Atualizar pagamentos que não têm grupo
      const { error: updateError } = await supabase
        .from('payments')
        .update({ group_id: defaultGroup.id })
        .is('group_id', null);

      if (updateError) {
        console.error('Erro ao atualizar pagamentos:', updateError.message);
      } else {
        console.log('✅ Pagamentos atribuídos ao grupo geral');
      }
    }

    // 5. Atribuir todos os usuários ao grupo geral (versão simplificada)
    console.log('👥 Atribuindo usuários ao grupo geral...');
    const { data: athletes } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'athlete');

    if (athletes && defaultGroup) {
      for (const athlete of athletes) {
        const { error: memberError } = await supabase
          .from('user_group_members')
          .upsert({
            user_id: athlete.id,
            group_id: defaultGroup.id
          });

        if (memberError) {
          console.error(`Erro ao adicionar atleta ${athlete.id} ao grupo:`, memberError.message);
        }
      }
      console.log(`✅ ${athletes.length} atletas adicionados ao grupo geral`);
    }

    console.log('\n🎉 Migração simplificada concluída!');
    console.log('✅ Você pode agora executar: npm start');
    console.log('✅ Login admin: admin@saoluiz.com / admin123');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
  }
};

const insertSampleData = async (supabase, adminProfile) => {
  if (!adminProfile) return;

  try {
    // Criar alguns grupos de exemplo
    const sampleGroups = [
      {
        name: 'Campeonato Escola Indiano Sub 19',
        description: 'Grupo do campeonato específico',
        type: 'tournament'
      },
      {
        name: 'Equipe Principal',
        description: 'Grupo da equipe principal do clube',
        type: 'team'
      }
    ];

    for (const group of sampleGroups) {
      await supabase
        .from('user_groups')
        .upsert({
          ...group,
          created_by: adminProfile.id
        });
    }

    // Criar algumas notificações de exemplo
    const notifications = [
      {
        user_id: adminProfile.id,
        title: 'Bem-vindo ao novo sistema!',
        message: 'O sistema São Luiz foi atualizado com novas funcionalidades.',
        type: 'info'
      }
    ];

    for (const notification of notifications) {
      await supabase
        .from('notifications')
        .insert(notification);
    }

    console.log('✅ Dados de exemplo inseridos');

  } catch (error) {
    console.error('Erro ao inserir dados de exemplo:', error.message);
  }
};

// Executar migração
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
