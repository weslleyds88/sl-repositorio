-- Script para corrigir tickets sem comprovante
-- 
-- PROBLEMA: Alguns tickets foram criados sem proof_image_base64 devido a um bug
-- na otimização de performance que não carregava a imagem antes de criar o ticket.
--
-- SOLUÇÃO: Copiar a imagem do payment_proofs correspondente para o ticket.
--
-- SEGURANÇA: Este script apenas ADICIONA imagens onde estão faltando, não sobrescreve.

-- Passo 1: Ver quantos tickets estão sem comprovante
SELECT 
  COUNT(*) as tickets_sem_comprovante,
  COUNT(DISTINCT pt.payment_id) as pagamentos_afetados,
  COUNT(DISTINCT pt.user_id) as usuarios_afetados
FROM payment_tickets pt
WHERE pt.proof_image_base64 IS NULL
  AND EXISTS (
    SELECT 1 FROM payment_proofs pp 
    WHERE pp.payment_id = pt.payment_id 
      AND pp.proof_image_base64 IS NOT NULL
      AND pp.status = 'approved'
  );

-- Passo 2: Ver detalhes dos tickets que serão corrigidos
SELECT 
  pt.id as ticket_id,
  pt.payment_id,
  pt.user_name,
  pt.amount,
  pt.approved_at,
  pt.category,
  'SEM comprovante' as status_atual,
  'SERÁ CORRIGIDO' as acao,
  LENGTH(pp.proof_image_base64) as tamanho_imagem_que_sera_copiada
FROM payment_tickets pt
JOIN payment_proofs pp ON pp.payment_id = pt.payment_id
WHERE pt.proof_image_base64 IS NULL
  AND pp.proof_image_base64 IS NOT NULL
  AND pp.status = 'approved'
ORDER BY pt.approved_at DESC;

-- Passo 3: EXECUTAR CORREÇÃO
-- Este UPDATE vai copiar a imagem do comprovante aprovado para o ticket
UPDATE payment_tickets pt
SET proof_image_base64 = pp.proof_image_base64
FROM payment_proofs pp
WHERE pt.payment_id = pp.payment_id
  AND pt.proof_image_base64 IS NULL  -- Apenas tickets SEM imagem
  AND pp.proof_image_base64 IS NOT NULL  -- Apenas se o comprovante TEM imagem
  AND pp.status = 'approved';  -- Apenas comprovantes aprovados

-- Passo 4: Verificar resultado
SELECT 
  COUNT(*) as tickets_corrigidos,
  SUM(LENGTH(proof_image_base64)) as tamanho_total_imagens
FROM payment_tickets
WHERE proof_image_base64 IS NOT NULL
  AND approved_at >= NOW() - INTERVAL '30 days';

-- NOTA: Se houver múltiplos comprovantes para o mesmo payment_id,
-- o sistema copiará o primeiro encontrado (geralmente o mais recente aprovado).

