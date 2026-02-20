// Utils para limpeza automática de comprovantes
import { supabase } from '../lib/supabaseClient';

// Função para executar limpeza de comprovantes antigos
export const cleanupOldProofs = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_proofs')
      .delete()
      .eq('status', 'approved')
      .not('reviewed_at', 'is', null)
      .lt('reviewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      return { success: false, error: error.message };
    }

    const deletedCount = Array.isArray(data) ? data.length : 0;
    return {
      success: true,
      deletedCount,
      message: `${deletedCount} comprovantes removidos com sucesso`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const scheduleCleanupProofs = (supabaseClient, intervalHours = 24) => {
  cleanupOldProofs();

  const intervalMs = intervalHours * 60 * 60 * 1000;
  const intervalId = setInterval(async () => {
    await cleanupOldProofs();
  }, intervalMs);

  return () => {
    clearInterval(intervalId);
  };
};

// Função para executar limpeza manual (via botão ou API)
export const executeManualCleanup = async () => {
  return await cleanupOldProofs();
};

