-- Script para remover trigger de criação automática de tickets
-- 
-- PROBLEMA: O trigger "trigger_auto_create_ticket" estava criando tickets duplicados
-- automaticamente quando um pagamento era marcado como 'paid', usando o valor TOTAL
-- da cobrança ao invés do valor individual do pagamento parcial.
--
-- SOLUÇÃO: Remover o trigger e a função associada, pois agora os tickets são criados
-- manualmente pelo código JavaScript em PaymentProofReview.js, com a lógica correta
-- de criar 1 ticket por pagamento (parcial ou completo).

-- Remover o trigger
DROP TRIGGER IF EXISTS trigger_auto_create_ticket ON payments;

-- Remover a função associada
DROP FUNCTION IF EXISTS auto_create_ticket_on_approval();

-- NOTA: Após executar este script, os tickets serão criados APENAS pelo código
-- JavaScript, garantindo que cada pagamento (parcial ou completo) gere seu próprio
-- ticket com o valor correto.

