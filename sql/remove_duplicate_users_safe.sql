-- ============================================
-- SCRIPT SEGURO PARA REMOVER USUÁRIOS DUPLICADOS
-- (Com atualização de referências)
-- ============================================
-- 
-- Este script:
-- 1. Identifica duplicatas
-- 2. Escolhe qual registro manter
-- 3. Atualiza todas as referências para o registro mantido
-- 4. Remove os duplicados
--
-- ⚠️ IMPORTANTE: Faça BACKUP antes de executar!
-- ============================================

-- ============================================
-- PASSO 1: Criar tabela temporária com IDs a manter e remover
-- ============================================
CREATE TEMP TABLE duplicate_resolution AS
SELECT 
    email,
    -- ID do registro que será MANTIDO (mais recente ou aprovado)
    (SELECT id 
     FROM profiles p2 
     WHERE p2.email = p1.email 
     ORDER BY 
         CASE WHEN p2.status = 'approved' THEN 0 ELSE 1 END,
         p2.created_at DESC
     LIMIT 1
    ) as keep_id,
    -- IDs dos registros que serão REMOVIDOS
    ARRAY_AGG(id) FILTER (WHERE id != (
        SELECT id 
        FROM profiles p2 
        WHERE p2.email = p1.email 
        ORDER BY 
            CASE WHEN p2.status = 'approved' THEN 0 ELSE 1 END,
            p2.created_at DESC
        LIMIT 1
    )) as remove_ids
FROM profiles p1
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Ver os resultados antes de continuar
SELECT * FROM duplicate_resolution;

-- ============================================
-- PASSO 2: Atualizar referências em PAYMENTS
-- ============================================
UPDATE payments p
SET member_id = dr.keep_id
FROM duplicate_resolution dr
WHERE p.member_id = ANY(dr.remove_ids);

-- Ver quantos registros foram atualizados
SELECT COUNT(*) as payments_updated FROM payments p
INNER JOIN duplicate_resolution dr ON p.member_id = ANY(dr.remove_ids);

-- ============================================
-- PASSO 3: Atualizar referências em PAYMENT_PROOFS
-- ============================================
UPDATE payment_proofs pp
SET user_id = dr.keep_id
FROM duplicate_resolution dr
WHERE pp.user_id = ANY(dr.remove_ids);

-- Ver quantos registros foram atualizados
SELECT COUNT(*) as proofs_updated FROM payment_proofs pp
INNER JOIN duplicate_resolution dr ON pp.user_id = ANY(dr.remove_ids);

-- ============================================
-- PASSO 4: Atualizar referências em NOTIFICATIONS
-- ============================================
UPDATE notifications n
SET user_id = dr.keep_id
FROM duplicate_resolution dr
WHERE n.user_id = ANY(dr.remove_ids);

-- Ver quantos registros foram atualizados
SELECT COUNT(*) as notifications_updated FROM notifications n
INNER JOIN duplicate_resolution dr ON n.user_id = ANY(dr.remove_ids);

-- ============================================
-- PASSO 5: Atualizar referências em USER_GROUP_MEMBERS
-- ============================================
UPDATE user_group_members ugm
SET user_id = dr.keep_id
FROM duplicate_resolution dr
WHERE ugm.user_id = ANY(dr.remove_ids);

-- Ver quantos registros foram atualizados
SELECT COUNT(*) as group_members_updated FROM user_group_members ugm
INNER JOIN duplicate_resolution dr ON ugm.user_id = ANY(dr.remove_ids);

-- ============================================
-- PASSO 6: Atualizar referências em PAYMENT_TICKETS
-- ============================================
UPDATE payment_tickets pt
SET user_id = dr.keep_id
FROM duplicate_resolution dr
WHERE pt.user_id = ANY(dr.remove_ids);

-- Ver quantos registros foram atualizados
SELECT COUNT(*) as tickets_updated FROM payment_tickets pt
INNER JOIN duplicate_resolution dr ON pt.user_id = ANY(dr.remove_ids);

-- ============================================
-- PASSO 7: Remover os perfis duplicados
-- ============================================
DELETE FROM profiles
WHERE id IN (
    SELECT UNNEST(remove_ids) FROM duplicate_resolution
);

-- Ver quantos perfis foram removidos
SELECT COUNT(*) as profiles_removed FROM profiles
WHERE id IN (
    SELECT UNNEST(remove_ids) FROM duplicate_resolution
);

-- ============================================
-- PASSO 8: Verificação final
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
-- RESUMO DO PROCESSO:
-- ============================================
-- 1. ✅ Identificou duplicatas
-- 2. ✅ Atualizou referências em payments
-- 3. ✅ Atualizou referências em payment_proofs
-- 4. ✅ Atualizou referências em notifications
-- 5. ✅ Atualizou referências em user_group_members
-- 6. ✅ Atualizou referências em payment_tickets
-- 7. ✅ Removeu perfis duplicados
-- 8. ✅ Verificou resultado final
-- ============================================

