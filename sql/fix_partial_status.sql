-- ======================================================
-- CORREÇÃO: Status "Parcial" → "Pendente"
-- ======================================================
-- Este script atualiza o status dos pagamentos:
-- - "partial" vira "pendente"
-- - Mantém "paid" como está (pago integralmente)
-- ======================================================

-- 1️⃣ Verificar quantos pagamentos serão afetados
SELECT 
  COUNT(*) as total_pagamentos_parciais,
  SUM(CASE WHEN paid_amount > 0 THEN 1 ELSE 0 END) as com_pagamento_parcial
FROM payments
WHERE status = 'partial';

-- 2️⃣ Ver detalhes dos pagamentos que serão atualizados
SELECT 
  id,
  category,
  amount,
  paid_amount,
  status,
  created_at
FROM payments
WHERE status = 'partial'
ORDER BY created_at DESC
LIMIT 20;

-- 3️⃣ ATUALIZAR status de "partial" para "pending"
UPDATE payments
SET status = 'pending'
WHERE status = 'partial';

-- 4️⃣ Verificar resultado da atualização
SELECT 
  status,
  COUNT(*) as total,
  SUM(amount) as valor_total,
  SUM(paid_amount) as valor_pago
FROM payments
GROUP BY status
ORDER BY status;

-- ======================================================
-- ✅ RESULTADO ESPERADO:
-- ======================================================
-- Status final dos pagamentos:
-- - "paid" = Pago integralmente (paid_amount >= amount)
-- - "pending" = Não pago OU pago parcial (paid_amount < amount)
-- ======================================================

