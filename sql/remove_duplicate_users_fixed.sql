-- ============================================
-- SCRIPT CORRIGIDO PARA REMOVER USUÁRIOS DUPLICADOS
-- ============================================
-- 
-- Versão corrigida que garante a remoção de todas as duplicatas
-- ⚠️ IMPORTANTE: Faça BACKUP antes de executar!
-- ============================================

-- ============================================
-- PASSO 1: Verificar duplicatas atuais
-- ============================================
SELECT 
    email,
    COUNT(*) as total_duplicatas,
    STRING_AGG(id::text, ', ' ORDER BY created_at DESC) as ids,
    STRING_AGG(status, ', ' ORDER BY created_at DESC) as status_list
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY total_duplicatas DESC, email;

-- ============================================
-- PASSO 2: Criar tabela temporária com resolução
-- ============================================
-- Esta versão usa uma abordagem diferente, mais direta
DROP TABLE IF EXISTS duplicate_resolution;

CREATE TEMP TABLE duplicate_resolution AS
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
)
SELECT 
    email,
    MAX(CASE WHEN rn = 1 THEN id END) as keep_id,
    ARRAY_AGG(id) FILTER (WHERE rn > 1) as remove_ids
FROM ranked_profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Ver os resultados
SELECT 
    email,
    keep_id,
    array_length(remove_ids, 1) as total_to_remove,
    remove_ids
FROM duplicate_resolution
ORDER BY email;

-- ============================================
-- PASSO 3: Atualizar referências em PAYMENTS
-- ============================================
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE payments p
    SET member_id = dr.keep_id
    FROM duplicate_resolution dr
    WHERE p.member_id = ANY(dr.remove_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Payments atualizados: %', updated_count;
END $$;

-- ============================================
-- PASSO 4: Atualizar referências em PAYMENT_PROOFS
-- ============================================
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE payment_proofs pp
    SET user_id = dr.keep_id
    FROM duplicate_resolution dr
    WHERE pp.user_id = ANY(dr.remove_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Payment proofs atualizados: %', updated_count;
END $$;

-- ============================================
-- PASSO 5: Atualizar referências em NOTIFICATIONS
-- ============================================
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications n
    SET user_id = dr.keep_id
    FROM duplicate_resolution dr
    WHERE n.user_id = ANY(dr.remove_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Notifications atualizadas: %', updated_count;
END $$;

-- ============================================
-- PASSO 6: Atualizar referências em USER_GROUP_MEMBERS
-- ============================================
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Primeiro, remover duplicatas de user_group_members (mesmo usuário no mesmo grupo)
    DELETE FROM user_group_members ugm1
    WHERE EXISTS (
        SELECT 1 
        FROM user_group_members ugm2
        WHERE ugm2.group_id = ugm1.group_id
          AND ugm2.user_id = ugm1.user_id
          AND ugm2.ctid > ugm1.ctid
    );
    
    -- Depois atualizar referências
    UPDATE user_group_members ugm
    SET user_id = dr.keep_id
    FROM duplicate_resolution dr
    WHERE ugm.user_id = ANY(dr.remove_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'User group members atualizados: %', updated_count;
END $$;

-- ============================================
-- PASSO 7: Atualizar referências em PAYMENT_TICKETS
-- ============================================
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE payment_tickets pt
    SET user_id = dr.keep_id
    FROM duplicate_resolution dr
    WHERE pt.user_id = ANY(dr.remove_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Payment tickets atualizados: %', updated_count;
END $$;

-- ============================================
-- PASSO 8: Remover os perfis duplicados
-- ============================================
DO $$
DECLARE
    removed_count INTEGER;
BEGIN
    DELETE FROM profiles
    WHERE id IN (
        SELECT UNNEST(remove_ids) 
        FROM duplicate_resolution
    );
    
    GET DIAGNOSTICS removed_count = ROW_COUNT;
    RAISE NOTICE 'Perfis removidos: %', removed_count;
END $$;

-- ============================================
-- PASSO 9: Verificação final
-- ============================================
-- Verificar se ainda há duplicatas
SELECT 
    email,
    COUNT(*) as total
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Se retornar 0 linhas, todas as duplicatas foram removidas! ✅

-- ============================================
-- LIMPEZA: Remover tabela temporária
-- ============================================
DROP TABLE IF EXISTS duplicate_resolution;

-- ============================================
-- VERSÃO ALTERNATIVA (se a anterior não funcionar)
-- ============================================
-- Execute esta se a versão acima ainda deixar duplicatas
/*
WITH duplicates_to_remove AS (
    SELECT 
        p.id,
        p.email,
        ROW_NUMBER() OVER (
            PARTITION BY p.email 
            ORDER BY 
                CASE WHEN p.status = 'approved' THEN 0 
                     WHEN p.status = 'pending' THEN 1 
                     ELSE 2 END,
                p.created_at DESC
        ) as rn
    FROM profiles p
    WHERE p.email IS NOT NULL
)
-- Primeiro atualizar todas as referências
UPDATE payments
SET member_id = (
    SELECT keep_id 
    FROM (
        SELECT 
            email,
            MAX(CASE WHEN rn = 1 THEN id END) as keep_id
        FROM duplicates_to_remove
        GROUP BY email
    ) dr
    WHERE dr.email = (SELECT email FROM profiles WHERE id = payments.member_id)
)
WHERE member_id IN (SELECT id FROM duplicates_to_remove WHERE rn > 1);

-- Repetir para outras tabelas...
-- (payment_proofs, notifications, user_group_members, payment_tickets)

-- Depois remover duplicatas
DELETE FROM profiles
WHERE id IN (
    SELECT id FROM duplicates_to_remove WHERE rn > 1
);
*/

