import { createClient } from '@supabase/supabase-js';

// IMPORTANTE: Para usar com Supabase, você precisa:
// 1. Ir ao dashboard do Supabase (https://supabase.com/dashboard)
// 2. Selecionar seu projeto
// 3. Ir em Settings > API
// 4. Copiar a URL e a anon key
// 5. Configurar as variáveis de ambiente

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Log de debug para verificar configuração
console.log('🔧 Configuração Supabase:');
console.log('  - URL:', supabaseUrl ? '✅ Configurada' : '❌ AUSENTE');
console.log('  - Key:', supabaseAnonKey ? '✅ Configurada' : '❌ AUSENTE');
console.log('  - Ambiente:', process.env.NODE_ENV || 'desenvolvimento');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configurações do Supabase não encontradas!');
  console.error('📋 Certifique-se de configurar no Cloudflare Pages:');
  console.error('   - REACT_APP_SUPABASE_URL');
  console.error('   - REACT_APP_SUPABASE_ANON_KEY');
  console.error('📖 Veja: DEPLOY-CLOUDFLARE.md');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sao-luiz-auth', // Chave única para evitar conflitos
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
});

export default supabase;
