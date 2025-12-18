-- ============================================
-- SCRIPT SIMPLES PARA REMOVER DUPLICATAS
-- Mantém o registro MAIS ANTIGO, remove os mais recentes
-- Versão usando CTE (mais eficiente)
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
    STRING_AGG(id::text, ', ' ORDER BY created_at ASC) as ids
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- ============================================
-- PASSO 2: Criar CTE com IDs a manter (mais antigo) e remover (mais recentes)
-- ============================================
WITH ranked_profiles AS (
    SELECT 
        id,
        email,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY created_at ASC  -- Manter o mais antigo (rn = 1)
        ) as rn
    FROM profiles
    WHERE email IS NOT NULL
),
profiles_to_keep AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn = 1  -- Manter apenas o mais antigo
),
profiles_to_remove AS (
    SELECT id, email
    FROM ranked_profiles
    WHERE rn > 1  -- Remover os mais recentes
)
-- Ver o que será mantido e removido
SELECT 
    'MANTIDOS (mais antigos)' as acao,
    COUNT(*) as total
FROM profiles_to_keep
UNION ALL
SELECT 
    'REMOVIDOS (mais recentes)' as acao,
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
            ORDER BY created_at ASC
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
            ORDER BY created_at ASC
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
            ORDER BY created_at ASC
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
            ORDER BY created_at ASC
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
            ORDER BY created_at ASC
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
-- PASSO 4: REMOVER DUPLICATAS (remove os mais recentes)
-- ============================================
WITH ranked_profiles AS (
    SELECT 
        id,
        email,
        ROW_NUMBER() OVER (
            PARTITION BY email 
            ORDER BY created_at ASC
        ) as rn
    FROM profiles
    WHERE email IS NOT NULL
)
DELETE FROM profiles
WHERE id IN (
    SELECT id
    FROM ranked_profiles
    WHERE rn > 1  -- Remover todos exceto o mais antigo
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

