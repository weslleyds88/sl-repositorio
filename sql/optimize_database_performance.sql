-- ============================================
-- SCRIPT DE OTIMIZAÇÃO DE PERFORMANCE
-- ============================================
-- 
-- Este script otimiza o banco de dados para melhor performance com base
-- nas recomendações do Supabase Database Linter.
--
-- AÇÕES:
-- 1. Adicionar índices em foreign keys críticas (queries frequentes)
-- 2. Remover índices não utilizados (reduzir overhead)
--
-- IMPACTO ESPERADO:
-- - Queries de pagamentos 50-80% mais rápidas
-- - Dashboard carrega mais rápido
-- - INSERT/UPDATE ligeiramente mais rápidos (menos índices desnecessários)
--
-- ============================================

-- ============================================
-- PARTE 1: ADICIONAR ÍNDICES CRÍTICOS
-- ============================================

-- Índice para payment_proofs.payment_id
-- USO: Buscar todos os comprovantes de um pagamento específico
-- IMPACTO: Alto - usado em PaymentProofReview, verificações de status
CREATE INDEX IF NOT EXISTS idx_payment_proofs_payment_id 
ON payment_proofs(payment_id);

-- Índice para payment_proofs.user_id
-- USO: Buscar todos os comprovantes de um usuário
-- IMPACTO: Alto - usado ao listar comprovantes do atleta
CREATE INDEX IF NOT EXISTS idx_payment_proofs_user_id 
ON payment_proofs(user_id);

-- Índice para payment_tickets.approved_by
-- USO: Buscar tickets aprovados por um admin específico
-- IMPACTO: Médio - usado em relatórios e auditorias
CREATE INDEX IF NOT EXISTS idx_payment_tickets_approved_by 
ON payment_tickets(approved_by);

-- Índice para payment_tickets.group_id
-- USO: Buscar tickets de um grupo específico
-- IMPACTO: Médio - usado ao filtrar tickets por grupo
CREATE INDEX IF NOT EXISTS idx_payment_tickets_group_id 
ON payment_tickets(group_id);

-- ============================================
-- PARTE 2: REMOVER ÍNDICES NÃO UTILIZADOS
-- ============================================

-- IMPORTANTE: Estes índices foram criados mas nunca utilizados pelo PostgreSQL
-- Removê-los melhora performance de INSERT/UPDATE sem afetar SELECT

-- Remover índices de payment_proofs
DROP INDEX IF EXISTS idx_payment_proofs_submitted_at;
DROP INDEX IF EXISTS idx_payment_proofs_storage_method;
DROP INDEX IF EXISTS idx_payment_proofs_image_type;

-- Remover índices de profiles
DROP INDEX IF EXISTS idx_profiles_email; -- Auth já tem índice próprio
DROP INDEX IF EXISTS idx_profiles_role; -- Poucas queries por role
DROP INDEX IF EXISTS idx_profiles_status;
DROP INDEX IF EXISTS idx_profiles_account_status;

-- Remover índices de payment_tickets
DROP INDEX IF EXISTS idx_payment_tickets_approved_at; -- Queries usam ORDER BY, não WHERE
DROP INDEX IF EXISTS idx_payment_tickets_group_name; -- Criamos idx_payment_tickets_group_id (melhor)

-- Remover índices de outras tabelas
DROP INDEX IF EXISTS idx_members_name;
DROP INDEX IF EXISTS idx_user_groups_type;
DROP INDEX IF EXISTS idx_notifications_cleanup_read_created;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_cleanup_user_read;

-- ============================================
-- PARTE 3: MANTER ÍNDICES IMPORTANTES
-- ============================================

-- NOTA: Os seguintes índices SÃO úteis e devem ser mantidos:
-- - idx_payment_proofs_status_approved_at (usado em ORDER BY + WHERE)
-- - idx_payment_tickets_status (usado ao filtrar tickets)
-- - Índices únicos e primary keys (automáticos)

-- ============================================
-- VERIFICAÇÃO PÓS-OTIMIZAÇÃO
-- ============================================

-- Para verificar os índices ativos após este script:
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- PRÓXIMOS PASSOS:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se não há erros
-- 3. Monitore a performance do sistema
-- 4. Em 1-2 meses, analise novamente com o Database Linter

