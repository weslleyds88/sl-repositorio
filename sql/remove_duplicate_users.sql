-- ============================================
-- SCRIPT PARA REMOVER USUÁRIOS DUPLICADOS
-- ============================================
-- 
-- Este script identifica e remove perfis duplicados na tabela profiles
-- Mantém o registro mais recente ou aprovado quando há duplicatas
--
-- ⚠️ IMPORTANTE: Execute primeiro a query de VERIFICAÇÃO antes de DELETAR!
-- ============================================

-- ============================================
-- 1. VERIFICAÇÃO: Ver duplicatas por EMAIL
-- ============================================
-- Execute esta query primeiro para ver quais registros serão afetados
SELECT 
    email,
    COUNT(*) as total_duplicatas,
    STRING_AGG(id::text, ', ') as ids,
    STRING_AGG(status, ', ') as status_list,
    STRING_AGG(created_at::text, ', ') as created_dates
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY total_duplicatas DESC, email;

-- ============================================
-- 2. VERIFICAÇÃO: Ver duplicatas por ID (menos comum)
-- ============================================
SELECT 
    id,
    COUNT(*) as total_duplicatas,
    STRING_AGG(email, ', ') as emails,
    STRING_AGG(status, ', ') as status_list
FROM profiles
GROUP BY id
HAVING COUNT(*) > 1
ORDER BY total_duplicatas DESC;

-- ============================================
-- 3. REMOÇÃO: Remover duplicatas por EMAIL
-- ============================================
-- Mantém o registro mais recente ou aprovado
-- Remove os outros duplicados
--
-- ⚠️ ATENÇÃO: Esta query DELETA dados! Faça backup antes!
-- ============================================

-- Opção A: Manter o registro APROVADO mais recente, remover os outros
DELETE FROM profiles
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            email,
            status,
            created_at,
            ROW_NUMBER() OVER (
                PARTITION BY email 
                ORDER BY 
                    CASE WHEN status = 'approved' THEN 0 ELSE 1 END,
                    created_at DESC
            ) as rn
        FROM profiles
        WHERE email IS NOT NULL
    ) ranked
    WHERE rn > 1
);

-- Opção B: Manter APENAS o registro mais recente (independente do status)
-- Descomente se preferir esta opção:
/*
DELETE FROM profiles
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            email,
            ROW_NUMBER() OVER (
                PARTITION BY email 
                ORDER BY created_at DESC
            ) as rn
        FROM profiles
        WHERE email IS NOT NULL
    ) ranked
    WHERE rn > 1
);
*/

-- ============================================
-- 4. VERIFICAÇÃO FINAL: Confirmar remoção
-- ============================================
-- Execute esta query após a remoção para confirmar
SELECT 
    email,
    COUNT(*) as total
FROM profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Se retornar 0 linhas, todas as duplicatas foram removidas! ✅

-- ============================================
-- 5. LIMPEZA ADICIONAL: Remover perfis órfãos
-- ============================================
-- Remove perfis que não têm email e não estão vinculados a auth.users
-- (Ajuste conforme necessário)
/*
DELETE FROM profiles
WHERE email IS NULL 
  AND id NOT IN (SELECT id FROM auth.users);
*/

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Sempre faça BACKUP antes de executar DELETE
-- 2. Execute primeiro as queries de VERIFICAÇÃO (1 e 2)
-- 3. Revise os resultados antes de executar a REMOÇÃO (3)
-- 4. Verifique se há foreign keys que podem ser afetadas:
--    - payments.member_id
--    - payment_proofs.user_id
--    - notifications.user_id
--    - user_group_members.user_id
--    - payment_tickets.user_id
--
-- Se houver dados relacionados, você pode precisar:
-- - Atualizar as referências antes de deletar
-- - Ou usar CASCADE (se configurado no banco)
-- ============================================

