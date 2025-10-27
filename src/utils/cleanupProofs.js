// Utils para limpeza automática de comprovantes
import { supabase } from '../lib/supabaseClient';

// Função para executar limpeza de comprovantes antigos
export const cleanupOldProofs = async () => {
  try {
    console.log('🧹 Executando limpeza de comprovantes antigos...');

    // Query SQL direta para deletar comprovantes antigos
    const { data, error } = await supabase
      .from('payment_proofs')
      .delete()
      .eq('status', 'approved')
      .not('reviewed_at', 'is', null)
      .lt('reviewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('❌ Erro na limpeza:', error);
      return { success: false, error: error.message };
    }

    // Contar quantos foram deletados
    const deletedCount = Array.isArray(data) ? data.length : 0;

    console.log('✅ Limpeza executada:', deletedCount, 'comprovantes removidos');
    return {
      success: true,
      deletedCount,
      message: `${deletedCount} comprovantes removidos com sucesso`
    };
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    return { success: false, error: error.message };
  }
};

// Função para agendar limpeza automática
export const scheduleCleanupProofs = (supabaseClient, intervalHours = 24) => {
  console.log(`⏰ Agendando limpeza automática a cada ${intervalHours} horas...`);

  // Executar limpeza imediatamente
  cleanupOldProofs();

  // Agendar próximas execuções
  const intervalMs = intervalHours * 60 * 60 * 1000;

  const intervalId = setInterval(async () => {
    console.log('🔄 Executando limpeza automática agendada...');
    await cleanupOldProofs();
  }, intervalMs);

  // Retornar função para cancelar o agendamento
  return () => {
    console.log('🛑 Cancelando agendamento de limpeza...');
    clearInterval(intervalId);
  };
};

// Função para executar limpeza manual (via botão ou API)
export const executeManualCleanup = async () => {
  return await cleanupOldProofs();
};

