-- ============================================
-- SCRIPT SIMPLES E DIRETO PARA REMOVER DUPLICATAS
-- ============================================
-- 
-- Esta versão é mais direta e deve funcionar melhor
-- ⚠️ IMPORTANTE: Faça BACKUP antes de executar!
-- ============================================

-- ============================================
-- PASSO 1: Ver duplicatas antes
-- ============================================
SELECT 
    email,
    COUNT(*) as total
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY email;

-- ============================================
-- PASSO 2: Atualizar PAYMENTS
-- ============================================
UPDATE payments p
SET member_id = (
    SELECT p2.id
    FROM profiles p2
    WHERE p2.email = (
        SELECT email FROM profiles WHERE id = p.member_id
    )
    ORDER BY 
        CASE WHEN p2.status = 'approved' THEN 0 
             WHEN p2.status = 'pending' THEN 1 
             ELSE 2 END,
        p2.created_at DESC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM profiles p1
    WHERE p1.id = p.member_id
      AND (
          SELECT COUNT(*) 
          FROM profiles p3 
          WHERE p3.email = p1.email
      ) > 1
);

-- ============================================
-- PASSO 3: Atualizar PAYMENT_PROOFS
-- ============================================
UPDATE payment_proofs pp
SET user_id = (
    SELECT p2.id
    FROM profiles p2
    WHERE p2.email = (
        SELECT email FROM profiles WHERE id = pp.user_id
    )
    ORDER BY 
        CASE WHEN p2.status = 'approved' THEN 0 
             WHEN p2.status = 'pending' THEN 1 
             ELSE 2 END,
        p2.created_at DESC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM profiles p1
    WHERE p1.id = pp.user_id
      AND (
          SELECT COUNT(*) 
          FROM profiles p3 
          WHERE p3.email = p1.email
      ) > 1
);

-- ============================================
-- PASSO 4: Atualizar NOTIFICATIONS
-- ============================================
UPDATE notifications n
SET user_id = (
    SELECT p2.id
    FROM profiles p2
    WHERE p2.email = (
        SELECT email FROM profiles WHERE id = n.user_id
    )
    ORDER BY 
        CASE WHEN p2.status = 'approved' THEN 0 
             WHEN p2.status = 'pending' THEN 1 
             ELSE 2 END,
        p2.created_at DESC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM profiles p1
    WHERE p1.id = n.user_id
      AND (
          SELECT COUNT(*) 
          FROM profiles p3 
          WHERE p3.email = p1.email
      ) > 1
);

-- ============================================
-- PASSO 5: Atualizar USER_GROUP_MEMBERS
-- ============================================
UPDATE user_group_members ugm
SET user_id = (
    SELECT p2.id
    FROM profiles p2
    WHERE p2.email = (
        SELECT email FROM profiles WHERE id = ugm.user_id
    )
    ORDER BY 
        CASE WHEN p2.status = 'approved' THEN 0 
             WHEN p2.status = 'pending' THEN 1 
             ELSE 2 END,
        p2.created_at DESC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM profiles p1
    WHERE p1.id = ugm.user_id
      AND (
          SELECT COUNT(*) 
          FROM profiles p3 
          WHERE p3.email = p1.email
      ) > 1
);

-- ============================================
-- PASSO 6: Atualizar PAYMENT_TICKETS
-- ============================================
UPDATE payment_tickets pt
SET user_id = (
    SELECT p2.id
    FROM profiles p2
    WHERE p2.email = (
        SELECT email FROM profiles WHERE id = pt.user_id
    )
    ORDER BY 
        CASE WHEN p2.status = 'approved' THEN 0 
             WHEN p2.status = 'pending' THEN 1 
             ELSE 2 END,
        p2.created_at DESC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM profiles p1
    WHERE p1.id = pt.user_id
      AND (
          SELECT COUNT(*) 
          FROM profiles p3 
          WHERE p3.email = p1.email
      ) > 1
);

-- ============================================
-- PASSO 7: REMOVER DUPLICATAS
-- ============================================
DELETE FROM profiles
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id
    FROM profiles
    WHERE email IS NOT NULL
    ORDER BY 
        email,
        CASE WHEN status = 'approved' THEN 0 
             WHEN status = 'pending' THEN 1 
             ELSE 2 END,
        created_at DESC
);

-- ============================================
-- PASSO 8: Verificar resultado
-- ============================================
SELECT 
    email,
    COUNT(*) as total
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Se retornar 0 linhas, todas as duplicatas foram removidas! ✅

