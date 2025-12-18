-- ============================================
-- TENTATIVA DE RECUPERAÇÃO DE PERFIS
-- A partir de referências em outras tabelas
-- ============================================
-- 
-- ⚠️ Execute com cuidado! Verifique cada passo antes de continuar.
-- ============================================

-- ============================================
-- PASSO 1: Verificar estado atual
-- ============================================
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_payments FROM payments;
SELECT COUNT(*) as total_proofs FROM payment_proofs;

-- ============================================
-- PASSO 2: Encontrar IDs de usuários que existem em outras tabelas
-- mas não estão mais em profiles
-- ============================================

-- IDs de payments que não têm perfil
SELECT DISTINCT p.member_id, COUNT(*) as payment_count
FROM payments p
WHERE p.member_id NOT IN (SELECT id FROM profiles)
  AND p.member_id IS NOT NULL
GROUP BY p.member_id
ORDER BY payment_count DESC;

-- IDs de payment_proofs que não têm perfil
SELECT DISTINCT pp.user_id, COUNT(*) as proof_count
FROM payment_proofs pp
WHERE pp.user_id NOT IN (SELECT id FROM profiles)
  AND pp.user_id IS NOT NULL
GROUP BY pp.user_id
ORDER BY proof_count DESC;

-- IDs de notifications que não têm perfil
SELECT DISTINCT n.user_id, COUNT(*) as notification_count
FROM notifications n
WHERE n.user_id NOT IN (SELECT id FROM profiles)
  AND n.user_id IS NOT NULL
GROUP BY n.user_id
ORDER BY notification_count DESC;

-- ============================================
-- PASSO 3: Tentar recuperar emails dos usuários do Supabase Auth
-- ============================================
-- Se você tem acesso ao Supabase Dashboard, pode verificar:
-- Authentication > Users
-- Lá você verá todos os usuários registrados com seus emails

-- ============================================
-- PASSO 4: Verificar se há backup do Supabase
-- ============================================
-- No Supabase Dashboard:
-- 1. Vá em "Database" > "Backups"
-- 2. Verifique se há backups automáticos disponíveis
-- 3. Se houver, você pode restaurar para um ponto anterior

-- ============================================
-- PASSO 5: Criar perfis básicos a partir de referências
-- (APENAS SE NÃO HOUVER BACKUP)
-- ============================================
-- ⚠️ ATENÇÃO: Isso criará perfis básicos sem todos os dados originais
-- Use apenas como último recurso!

-- Criar perfis a partir de payments
INSERT INTO profiles (id, email, full_name, role, status)
SELECT DISTINCT 
    p.member_id as id,
    COALESCE(
        (SELECT email FROM auth.users WHERE id = p.member_id),
        'recovered_' || p.member_id::text || '@recovered.local'
    ) as email,
    'Usuário Recuperado' as full_name,
    'athlete' as role,
    'approved' as status
FROM payments p
WHERE p.member_id NOT IN (SELECT id FROM profiles)
  AND p.member_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Criar perfis a partir de payment_proofs
INSERT INTO profiles (id, email, full_name, role, status)
SELECT DISTINCT 
    pp.user_id as id,
    COALESCE(
        (SELECT email FROM auth.users WHERE id = pp.user_id),
        'recovered_' || pp.user_id::text || '@recovered.local'
    ) as email,
    'Usuário Recuperado' as full_name,
    'athlete' as role,
    'approved' as status
FROM payment_proofs pp
WHERE pp.user_id NOT IN (SELECT id FROM profiles)
  AND pp.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RECOMENDAÇÃO PRINCIPAL:
-- ============================================
-- 1. VERIFIQUE O SUPABASE DASHBOARD > DATABASE > BACKUPS
-- 2. Se houver backup, restaure para antes da execução da query
-- 3. Se não houver backup, use o PASSO 5 acima para criar perfis básicos
-- 4. Depois, você precisará atualizar manualmente os dados dos perfis
--    (nome, telefone, etc.) a partir de outras fontes



