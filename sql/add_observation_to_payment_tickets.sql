-- Script para adicionar campo de observação na tabela payment_tickets
-- 
-- FUNCIONALIDADE: Salvar a observação do atleta no ticket aprovado
-- A observação será herdada do comprovante quando o ticket for criado
--
-- Data: 03/11/2025

-- Adicionar campo observation na tabela payment_tickets
ALTER TABLE payment_tickets
ADD COLUMN IF NOT EXISTS observation TEXT;

COMMENT ON COLUMN payment_tickets.observation IS 'Observação do atleta sobre o pagamento, herdada do comprovante aprovado';

-- Verificar se foi criado
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'payment_tickets' 
  AND column_name = 'observation';

