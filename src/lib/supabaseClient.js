// CORRIJA PARA USAR VARIÁVEIS DE AMBIENTE
import { createClient } from '@supabase/supabase-js'

// VERIFICAÇÃO FORÇADA
console.log('🔧 Configuração Supabase:')
console.log('  - URL:', process.env.REACT_APP_SUPABASE_URL)
console.log('  - Key:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '*** Configurada' : '❌ NÃO CONFIGURADA')
console.log('  - Ambiente:', process.env.NODE_ENV)

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Função de teste de conexão
export async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro de conexão:', error)
    return { success: false, error: error.message }
  }
}