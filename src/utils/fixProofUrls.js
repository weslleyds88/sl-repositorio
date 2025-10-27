// Utilitário para correção de URLs de comprovantes
// Este arquivo contém funções para corrigir URLs malformadas de comprovantes

/**
 * Verifica se uma URL de comprovante está malformada
 */
export const isMalformedProofUrl = (url) => {
  if (!url) return false;

  return (
    url.includes('------WebKitFormBoundary') ||
    url.includes('Content-Disposition') ||
    url.includes('form-data') ||
    url.includes('multipart/form-data') ||
    (url.includes('PNG') && url.includes('IHDR')) ||
    url.includes('�PNG') ||
    url.length > 1000 ||
    !url.startsWith('https://')
  );
};

/**
 * Gera URL correta para um comprovante
 */
export const generateCorrectProofUrl = (proof) => {
  return `https://wgaqgsblpersthvytcif.supabase.co/storage/v1/object/public/payment-proofs/proofs/${proof.payment_id}/proof_${proof.id}.jpg`;
};

/**
 * Função para ser executada no console do navegador para correção rápida
 */
export const quickFixProofUrls = async (supabase) => {
  try {
    console.log('🔧 Corrigindo URLs malformadas de comprovantes...');

    // Buscar todos os comprovantes com URLs potencialmente problemáticas
    const { data: proofs, error } = await supabase
      .from('payment_proofs')
      .select('*');

    if (error) {
      console.error('❌ Erro ao buscar comprovantes:', error);
      return { success: false, error: error.message };
    }

    let correctedCount = 0;
    let errorCount = 0;

    for (const proof of proofs) {
      const originalUrl = proof.proof_file_url;

      if (isMalformedProofUrl(originalUrl)) {
        console.log(`⚠️ URL malformada encontrada para proof ${proof.id}:`, originalUrl.substring(0, 100));

        // Gerar URL corrigida
        const correctedUrl = generateCorrectProofUrl(proof);

        console.log(`🔧 Corrigindo para: ${correctedUrl}`);

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('payment_proofs')
          .update({ proof_file_url: correctedUrl })
          .eq('id', proof.id);

        if (updateError) {
          console.error(`❌ Erro ao corrigir proof ${proof.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Proof ${proof.id} corrigido com sucesso`);
          correctedCount++;
        }
      }
    }

    console.log(`🎯 Correção concluída: ${correctedCount} corrigidos, ${errorCount} erros`);

    return {
      success: true,
      correctedCount,
      errorCount,
      message: `${correctedCount} URLs corrigidas, ${errorCount} erros`
    };

  } catch (error) {
    console.error('❌ Erro na correção de URLs:', error);
    return { success: false, error: error.message };
  }
};
