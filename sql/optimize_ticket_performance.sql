 -- ============================================
-- OTIMIZAÇÃO DE PERFORMANCE - TICKETS
-- ============================================
-- 
-- PROBLEMA: As funções RPC retornam proof_image_base64 (MUITO PESADO!)
-- SOLUÇÃO: Retornar apenas metadados, carregar imagem sob demanda
--
-- ============================================

-- ============================================
-- PASSO 1: REMOVER FUNÇÕES ANTIGAS
-- ============================================
DROP FUNCTION IF EXISTS get_user_tickets(UUID);
DROP FUNCTION IF EXISTS get_all_tickets();

-- ============================================
-- PASSO 2: CRIAR get_user_tickets (Atleta)
-- SEM proof_image_base64 para melhor performance
-- ============================================
CREATE OR REPLACE FUNCTION get_user_tickets(p_user_id UUID)
RETURNS TABLE(
    ticket_id UUID,
    payment_id INTEGER,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    amount NUMERIC,
    category TEXT,
    group_name TEXT,
    payment_status TEXT,
    payment_method TEXT,
    has_proof BOOLEAN,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.id AS ticket_id,
        pt.payment_id,
        pt.user_id,
        pt.user_name,
        pt.user_email,
        pt.amount,
        pt.category,
        pt.group_name,
        pt.payment_status,
        pt.payment_method,
        (pt.proof_image_base64 IS NOT NULL) AS has_proof,
        pt.approved_by,
        pt.approved_at,
        pt.expires_at,
        EXTRACT(DAY FROM (pt.expires_at - NOW()))::INTEGER AS days_remaining
    FROM
        public.payment_tickets pt
    WHERE
        pt.user_id = p_user_id
    ORDER BY
        pt.approved_at DESC;
END;
$$;

-- ============================================
-- PASSO 3: CRIAR get_all_tickets (Admin)
-- SEM proof_image_base64 para melhor performance
-- ============================================
CREATE OR REPLACE FUNCTION get_all_tickets()
RETURNS TABLE(
    ticket_id UUID,
    payment_id INTEGER,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    amount NUMERIC,
    category TEXT,
    group_name TEXT,
    payment_status TEXT,
    payment_method TEXT,
    has_proof BOOLEAN,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.id AS ticket_id,
        pt.payment_id,
        pt.user_id,
        pt.user_name,
        pt.user_email,
        pt.amount,
        pt.category,
        pt.group_name,
        pt.payment_status,
        pt.payment_method,
        (pt.proof_image_base64 IS NOT NULL) AS has_proof,
        pt.approved_by,
        pt.approved_at,
        pt.expires_at,
        EXTRACT(DAY FROM (pt.expires_at - NOW()))::INTEGER AS days_remaining
    FROM
        public.payment_tickets pt
    ORDER BY
        pt.approved_at DESC;
END;
$$;

-- ============================================
-- PASSO 4: CRIAR FUNÇÃO PARA BUSCAR COMPROVANTE SOB DEMANDA
-- ============================================
CREATE OR REPLACE FUNCTION get_ticket_proof(p_ticket_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_proof TEXT;
BEGIN
    SELECT proof_image_base64 INTO v_proof
    FROM public.payment_tickets
    WHERE id = p_ticket_id;
    
    RETURN v_proof;
END;
$$;

-- Comentários
COMMENT ON FUNCTION get_user_tickets(UUID) IS 'Retorna tickets do usuário SEM imagens para melhor performance';
COMMENT ON FUNCTION get_all_tickets() IS 'Retorna todos os tickets SEM imagens para melhor performance';
COMMENT ON FUNCTION get_ticket_proof(UUID) IS 'Busca apenas o comprovante de um ticket específico (sob demanda)';

