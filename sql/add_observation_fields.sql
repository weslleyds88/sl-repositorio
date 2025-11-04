-- ============================================
-- Script para adicionar campo de observação
-- nas tabelas payment_proofs e payment_tickets
-- 
-- IMPORTANTE: Execute este script no Supabase Dashboard
-- ============================================

-- 1. Adicionar campo observation na tabela payment_proofs
ALTER TABLE payment_proofs
ADD COLUMN IF NOT EXISTS observation TEXT;

COMMENT ON COLUMN payment_proofs.observation IS 'Observação opcional do atleta sobre o pagamento, visível para o administrador na aprovação';

-- 2. Adicionar campo observation na tabela payment_tickets
ALTER TABLE payment_tickets
ADD COLUMN IF NOT EXISTS observation TEXT;

COMMENT ON COLUMN payment_tickets.observation IS 'Observação do atleta sobre o pagamento, herdada do comprovante aprovado';

-- 3. Verificar se foram criados
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('payment_proofs', 'payment_tickets')
  AND column_name = 'observation'
ORDER BY table_name, column_name;

