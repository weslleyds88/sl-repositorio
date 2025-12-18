-- ============================================
-- DIAGNÓSTICO: Verificar estado atual dos perfis
-- ============================================

-- Ver quantos perfis restam
SELECT COUNT(*) as total_profiles FROM profiles;

-- Ver perfis restantes
SELECT id, email, full_name, created_at, status 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 50;

-- Verificar se há duplicatas ainda
SELECT 
    email,
    COUNT(*) as total
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Verificar se há referências órfãs em payments
SELECT COUNT(*) as orphaned_payments
FROM payments p
WHERE p.member_id NOT IN (SELECT id FROM profiles);

-- Verificar se há referências órfãs em payment_proofs
SELECT COUNT(*) as orphaned_proofs
FROM payment_proofs pp
WHERE pp.user_id NOT IN (SELECT id FROM profiles);



