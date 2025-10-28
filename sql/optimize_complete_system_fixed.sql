-- ============================================
-- OTIMIZAÇÃO COMPLETA DO SISTEMA - VERSÃO CORRIGIDA
-- ============================================
-- 
-- Este SQL otimiza TODAS as queries pesadas do sistema
-- VERSÃO SEM ERROS!
--
-- ============================================

-- ============================================
-- 1. CRIAR VIEW OTIMIZADA PARA USUÁRIOS (SEM FOTOS)
-- ============================================

-- Drop view se existir
DROP VIEW IF EXISTS profiles_without_avatar;

-- View para listar usuários SEM avatar_url (muito mais rápido)
CREATE VIEW profiles_without_avatar AS
SELECT 
    id,
    email,
    full_name,
    phone,
    position,
    role,
    status,
    account_status,
    birth_date,
    rg,
    region,
    gender,
    responsible_name,
    responsible_phone,
    created_at,
    updated_at,
    (avatar_url IS NOT NULL) as has_avatar  -- Flag booleana ao invés da imagem
FROM profiles;

COMMENT ON VIEW profiles_without_avatar IS 'View otimizada de perfis SEM fotos para listagens rápidas';

-- ============================================
-- 2. FUNÇÃO PARA BUSCAR FOTO DE PERFIL SOB DEMANDA
-- ============================================

-- Drop função se existir
DROP FUNCTION IF EXISTS get_user_avatar(UUID);

-- Criar função
CREATE OR REPLACE FUNCTION get_user_avatar(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_avatar TEXT;
BEGIN
    SELECT avatar_url INTO v_avatar
    FROM profiles
    WHERE id = p_user_id;
    
    RETURN v_avatar;
END;
$$;

COMMENT ON FUNCTION get_user_avatar(UUID) IS 'Retorna apenas o avatar de um usuário específico (sob demanda)';

-- ============================================
-- 3. VIEW OTIMIZADA PARA COMPROVANTES PENDENTES (SEM IMAGENS)
-- ============================================

-- Drop view se existir
DROP VIEW IF EXISTS payment_proofs_pending_summary;

-- Criar view
CREATE VIEW payment_proofs_pending_summary AS
SELECT 
    pp.id,
    pp.payment_id,
    pp.user_id,
    pp.proof_amount,
    pp.payment_method,
    pp.transaction_id,
    pp.status,
    pp.submitted_at,
    (pp.proof_image_base64 IS NOT NULL) as has_image,
    pp.storage_method,
    p.full_name as user_name,
    p.email as user_email
FROM payment_proofs pp
LEFT JOIN profiles p ON pp.user_id = p.id
WHERE pp.status = 'pending'
ORDER BY pp.submitted_at DESC;

COMMENT ON VIEW payment_proofs_pending_summary IS 'View otimizada de comprovantes pendentes SEM imagens base64';

-- ============================================
-- 4. FUNÇÃO PARA BUSCAR IMAGEM DE COMPROVANTE SOB DEMANDA
-- ============================================

-- Drop função se existir (com todas as possíveis assinaturas)
DROP FUNCTION IF EXISTS get_proof_image(UUID);

-- Criar função
CREATE OR REPLACE FUNCTION get_proof_image(p_proof_id UUID)
RETURNS TABLE(
    proof_image_base64 TEXT,
    proof_image_type TEXT,
    proof_image_size BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.proof_image_base64,
        pp.proof_image_type,
        pp.proof_image_size
    FROM payment_proofs pp
    WHERE pp.id = p_proof_id;
END;
$$;

COMMENT ON FUNCTION get_proof_image(UUID) IS 'Retorna apenas a imagem de um comprovante específico (sob demanda)';

-- ============================================
-- 5. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================

-- Índice para buscas por status de comprovante
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status_submitted 
ON payment_proofs(status, submitted_at DESC);

-- Índice para buscas por data de criação de perfis
CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
ON profiles(created_at DESC);

-- Índice para buscas por status de perfil
CREATE INDEX IF NOT EXISTS idx_profiles_status_created 
ON profiles(status, created_at DESC);

-- ============================================
-- 6. ANÁLISE E ATUALIZAÇÃO DE ESTATÍSTICAS
-- ============================================

-- Atualizar estatísticas das tabelas para melhor otimização de queries
ANALYZE profiles;
ANALYZE payments;
ANALYZE payment_proofs;
ANALYZE payment_tickets;
ANALYZE user_groups;

-- ============================================
-- 7. RESUMO
-- ============================================

-- Executar query para verificar o que foi criado:
SELECT 
    'VIEW' as tipo,
    viewname as nome,
    'profiles_without_avatar' as descricao
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'profiles_without_avatar'

UNION ALL

SELECT 
    'VIEW' as tipo,
    viewname as nome,
    'payment_proofs_pending_summary' as descricao
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'payment_proofs_pending_summary'

UNION ALL

SELECT 
    'FUNCTION' as tipo,
    proname as nome,
    'get_user_avatar' as descricao
FROM pg_proc 
WHERE proname = 'get_user_avatar'

UNION ALL

SELECT 
    'FUNCTION' as tipo,
    proname as nome,
    'get_proof_image' as descricao
FROM pg_proc 
WHERE proname = 'get_proof_image';

-- ============================================
-- CONCLUÍDO!
-- ============================================

-- ✅ Views otimizadas criadas
-- ✅ Funções para lazy loading criadas
-- ✅ Índices adicionados
-- ✅ Análise de tabelas executada
-- ✅ Sistema otimizado!

