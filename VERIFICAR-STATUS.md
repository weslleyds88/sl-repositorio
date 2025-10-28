# 🔍 VERIFICAR STATUS DOS PAGAMENTOS

## 1️⃣ Verificar no Supabase

Acesse: https://supabase.com/dashboard/project/wgaqgsblpersthvytcif/sql

Execute esta query para ver os pagamentos que aparecem na tela:

```sql
-- Ver os pagamentos do grupo COPA INDIANO M
SELECT 
  id,
  category,
  amount,
  paid_amount,
  status,
  member_id,
  created_at
FROM payments
WHERE category LIKE '%COPA INDIANO%'
ORDER BY created_at DESC
LIMIT 20;
```

## 2️⃣ Se o status ainda for 'paid' ou 'partial', executar:

```sql
-- Corrigir TODOS os pagamentos que não estão 100% pagos
UPDATE payments
SET status = 'pending'
WHERE status IN ('paid', 'partial') 
  AND paid_amount < amount;

-- Garantir que os 100% pagos estão corretos
UPDATE payments
SET status = 'paid'
WHERE paid_amount >= amount;
```

## 3️⃣ Verificar novamente:

```sql
SELECT 
  status,
  COUNT(*) as total,
  SUM(amount) as valor_total,
  SUM(paid_amount) as valor_pago
FROM payments
GROUP BY status
ORDER BY status;
```

## 4️⃣ No localhost, depois de executar o SQL:

1. Abrir DevTools (F12)
2. Ir em "Application" > "Storage" > "Clear site data"
3. Ou simplesmente **CTRL + SHIFT + R** (hard refresh)
4. Ou fechar e abrir o navegador de novo

---

Se ainda não resolver, me avisa que vou verificar se tem cache no código!

