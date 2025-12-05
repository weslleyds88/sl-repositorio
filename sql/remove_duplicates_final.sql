-- ============================================
-- SCRIPT FINAL PARA REMOVER DUPLICATAS
-- Versão usando CTEs (mais clara e robusta)
-- ============================================
-- 
-- ⚠️ IMPORTANTE: Faça BACKUP antes de executar!
-- ============================================

-- ============================================
-- PASSO 1: Ver duplicatas antes
-- ============================================
SELECT 
    email,
    COUNT(*) as total,
    STRING_AGG(id::text, ', ') as ids
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- ============================================
-- PASSO 2: Criar CTE com IDs a manter e remover
-- ============================================
WITH ranked_profiles AS (
    SELECT 
        id,
        email,
        status,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY 
                CASE WHEN status = 'approved' THEN 0 
                     WHEN status = 'pending' THEN 1 
                     ELSE 2 END,
                created_at DESC
        ) as rn
    FROM profiles
    WHERE email IS NOT NULL
),
profiles_to_keep AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn = 1
),
profiles_to_remove AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn > 1
)
-- Ver o que será mantido e removido
SELECT 
    'MANTIDOS' as acao,
    COUNT(*) as total
FROM profiles_to_keep
UNION ALL
SELECT 
    'REMOVIDOS' as acao,
    COUNT(*) as total
FROM profiles_to_remove;

-- ============================================
-- PASSO 3: Atualizar todas as referências
-- ============================================
WITH ranked_profiles AS (
    SELECT 
        id,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY 
                CASE WHEN status = 'approved' THEN 0 
                     WHEN status = 'pending' THEN 1 
                     ELSE 2 END,
                created_at DESC
        ) as rn
    FROM profiles
    WHERE email IS NOT NULL
),
profiles_to_keep AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn = 1
),
profiles_to_remove AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn > 1
)
-- Atualizar PAYMENTS
UPDATE payments p
SET member_id = ptk.id
FROM profiles_to_remove ptr
JOIN profiles_to_keep ptk ON ptk.email = ptr.email
WHERE p.member_id = ptr.id;

-- Atualizar PAYMENT_PROOFS
WITH ranked_profiles AS (
    SELECT 
        id,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY 
                CASE WHEN status = 'approved' THEN 0 
                     WHEN status = 'pending' THEN 1 
                     ELSE 2 END,
                created_at DESC
        ) as rn
    FROM profiles
    WHERE email IS NOT NULL
),
profiles_to_keep AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn = 1
),
profiles_to_remove AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn > 1
)
UPDATE payment_proofs pp
SET user_id = ptk.id
FROM profiles_to_remove ptr
JOIN profiles_to_keep ptk ON ptk.email = ptr.email
WHERE pp.user_id = ptr.id;

-- Atualizar NOTIFICATIONS
WITH ranked_profiles AS (
    SELECT 
        id,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY 
                CASE WHEN status = 'approved' THEN 0 
                     WHEN status = 'pending' THEN 1 
                     ELSE 2 END,
                created_at DESC
        ) as rn
    FROM profiles
    WHERE email IS NOT NULL
),
profiles_to_keep AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn = 1
),
profiles_to_remove AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn > 1
)
UPDATE notifications n
SET user_id = ptk.id
FROM profiles_to_remove ptr
JOIN profiles_to_keep ptk ON ptk.email = ptr.email
WHERE n.user_id = ptr.id;

-- Atualizar USER_GROUP_MEMBERS
WITH ranked_profiles AS (
    SELECT 
        id,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY 
                CASE WHEN status = 'approved' THEN 0 
                     WHEN status = 'pending' THEN 1 
                     ELSE 2 END,
                created_at DESC
        ) as rn
    FROM profiles
    WHERE email IS NOT NULL
),
profiles_to_keep AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn = 1
),
profiles_to_remove AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn > 1
)
UPDATE user_group_members ugm
SET user_id = ptk.id
FROM profiles_to_remove ptr
JOIN profiles_to_keep ptk ON ptk.email = ptr.email
WHERE ugm.user_id = ptr.id;

-- Atualizar PAYMENT_TICKETS
WITH ranked_profiles AS (
    SELECT 
        id,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY 
                CASE WHEN status = 'approved' THEN 0 
                     WHEN status = 'pending' THEN 1 
                     ELSE 2 END,
                created_at DESC
        ) as rn
    FROM profiles
    WHERE email IS NOT NULL
),
profiles_to_keep AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn = 1
),
profiles_to_remove AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn > 1
)
UPDATE payment_tickets pt
SET user_id = ptk.id
FROM profiles_to_remove ptr
JOIN profiles_to_keep ptk ON ptk.email = ptr.email
WHERE pt.user_id = ptr.id;

-- ============================================
-- PASSO 4: REMOVER DUPLICATAS
-- ============================================
WITH ranked_profiles AS (
    SELECT 
        id,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY 
                CASE WHEN status = 'approved' THEN 0 
                     WHEN status = 'pending' THEN 1 
                     ELSE 2 END,
                created_at DESC
        ) as rn
    FROM profiles
    WHERE email IS NOT NULL
)
DELETE FROM profiles
WHERE id IN (
    SELECT id
    FROM ranked_profiles
    WHERE rn > 1
);

-- ============================================
-- PASSO 5: Verificar resultado final
-- ============================================
SELECT 
    email,
    COUNT(*) as total
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Se retornar 0 linhas, todas as duplicatas foram removidas! ✅

