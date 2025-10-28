-- Atualizar funções RPC para incluir group_name e payment_status nos tickets

-- ============================================
-- PASSO 1: REMOVER AS FUNÇÕES ANTIGAS
-- ============================================
DROP FUNCTION IF EXISTS get_user_tickets(UUID);
DROP FUNCTION IF EXISTS get_all_tickets();

-- ============================================
-- PASSO 2: CRIAR get_user_tickets (Atleta)
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
    proof_image_base64 TEXT,
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
        pt.proof_image_base64,
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
    proof_image_base64 TEXT,
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
        pt.proof_image_base64,
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
