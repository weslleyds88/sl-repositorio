-- Adicionar campos para tickets individuais por pagamento
-- Este script adiciona suporte para criar 1 ticket por pagamento (não por cobrança completa)

-- Adicionar coluna group_name para identificar o grupo da cobrança
ALTER TABLE payment_tickets
ADD COLUMN IF NOT EXISTS group_name TEXT;

-- Adicionar coluna payment_status para indicar se é "Parcial" ou "Completo"
ALTER TABLE payment_tickets
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Completo';

-- Adicionar comentários nas colunas
COMMENT ON COLUMN payment_tickets.group_name IS 'Nome do grupo associado à cobrança (se houver)';
COMMENT ON COLUMN payment_tickets.payment_status IS 'Status do pagamento: "Parcial" ou "Completo"';

-- Criar índice para facilitar buscas por status
CREATE INDEX IF NOT EXISTS idx_payment_tickets_status ON payment_tickets(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_tickets_group_name ON payment_tickets(group_name);

