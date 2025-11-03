-- Script para adicionar campo de observação na tabela payment_proofs
-- 
-- FUNCIONALIDADE: Permitir que atletas adicionem uma observação opcional ao enviar comprovante
-- A observação será visível para o administrador na tela de aprovação
--
-- Data: 03/11/2025

-- Adicionar campo observation na tabela payment_proofs
ALTER TABLE payment_proofs
ADD COLUMN IF NOT EXISTS observation TEXT;

COMMENT ON COLUMN payment_proofs.observation IS 'Observação opcional do atleta sobre o pagamento, visível para o administrador na aprovação';

-- Verificar se foi criado
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'payment_proofs' 
  AND column_name = 'observation';

