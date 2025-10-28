-- Script para adicionar suporte a pagamentos múltiplos
-- 
-- FUNCIONALIDADE: Permitir que atletas paguem múltiplas cobranças de uma vez
-- com um único comprovante, e o admin aprova uma vez para quitar todas.
--
-- NOTA: Este campo é opcional e usado apenas para pagamentos múltiplos.
-- Pagamentos normais (únicos) não terão esse campo preenchido.

-- Adicionar campo para armazenar IDs de múltiplos pagamentos
ALTER TABLE payment_proofs
ADD COLUMN IF NOT EXISTS multiple_payment_ids TEXT;

COMMENT ON COLUMN payment_proofs.multiple_payment_ids IS 'Lista de IDs de pagamentos separados por vírgula, usado quando um comprovante paga múltiplas cobranças de uma vez';

-- Criar índice para melhor performance em buscas
CREATE INDEX IF NOT EXISTS idx_payment_proofs_multiple ON payment_proofs(multiple_payment_ids) WHERE multiple_payment_ids IS NOT NULL;

-- Verificar se foi criado
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'payment_proofs' 
  AND column_name = 'multiple_payment_ids';

