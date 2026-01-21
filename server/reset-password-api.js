/**
 * API Server para Reset de Senha
 * 
 * Este servidor deve ser executado no mesmo servidor do Supabase Self-Hosted
 * ou em um servidor com acesso à SERVICE_ROLE_KEY
 * 
 * Como executar:
 * 1. npm install express cors dotenv
 * 2. node server/reset-password-api.js
 * 
 * Ou com PM2:
 * pm2 start server/reset-password-api.js --name reset-password-api
 */

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.RESET_PASSWORD_PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.REACT_APP_URL || '*', // Configure com a URL do seu frontend
  credentials: true
}));
app.use(express.json());

// Configuração do Supabase
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SERVICE_ROLE_KEY devem estar configurados!');
  process.exit(1);
}

// Criar cliente Supabase Admin
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Função auxiliar para verificar se o usuário é admin
 */
async function verifyAdmin(userId) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return false;
    }

    return profile.role === 'admin';
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
}

/**
 * Função para gerar senha aleatória
 */
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Endpoint: POST /api/reset-password
 * 
 * Body:
 * {
 *   "userId": "uuid-do-usuario",
 *   "adminUserId": "uuid-do-admin-que-esta-fazendo-a-acao",
 *   "newPassword": "senha-opcional" // Se não fornecido, gera automaticamente
 * }
 */
app.post('/api/reset-password', async (req, res) => {
  try {
    const { userId, adminUserId, newPassword } = req.body;

    // Validação
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId é obrigatório' 
      });
    }

    if (!adminUserId) {
      return res.status(400).json({ 
        error: 'adminUserId é obrigatório para verificação de segurança' 
      });
    }

    // Verificar se o usuário que está fazendo a requisição é admin
    const isAdmin = await verifyAdmin(adminUserId);
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas administradores podem resetar senhas.' 
      });
    }

    // Gerar senha se não fornecida
    const password = newPassword || generateRandomPassword(12);

    // Atualizar senha usando Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: password,
        email_confirm: true // Confirmar email automaticamente
      }
    );

    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return res.status(500).json({ 
        error: 'Falha ao resetar senha',
        details: error.message 
      });
    }

    // Marcar usuário para trocar senha no próximo login
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId);

    if (profileError) {
      console.warn('⚠️ Não foi possível marcar must_change_password:', profileError);
      // Não falhar a requisição por isso
    }

    // Retornar sucesso
    res.json({
      success: true,
      password: password, // Retornar a senha gerada
      message: 'Senha resetada com sucesso'
    });

  } catch (error) {
    console.error('Erro no endpoint reset-password:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

/**
 * Endpoint de health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'reset-password-api',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Reset de Senha rodando na porta ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔐 Supabase URL: ${SUPABASE_URL}`);
  console.log(`✅ Pronto para receber requisições!`);
});
