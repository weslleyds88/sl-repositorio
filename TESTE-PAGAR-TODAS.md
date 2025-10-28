# 🧪 COMO TESTAR: "PAGAR MÚLTIPLAS COBRANÇAS"

---

## 📋 **PRÉ-REQUISITOS:**

```
✅ Código atualizado localmente
✅ Script SQL executado (sql/add_multiple_payments_field.sql)
✅ Banco de dados acessível
✅ npm start rodando
```

---

## 🎯 **CENÁRIO DE TESTE:**

### **1. PREPARAR DADOS DE TESTE:**

```sql
-- No SQL Editor do Supabase, execute:

-- 1.1. Criar múltiplas cobranças para um atleta teste
-- (Substitua USER_ID pelo ID do seu usuário teste)

INSERT INTO payments (member_id, amount, category, due_date, status, observation)
VALUES
  ('SEU_USER_ID', 100.00, 'Taxa de Arbitragem', '2025-11-30', 'pending', '1º Parcela'),
  ('SEU_USER_ID', 150.00, 'Taxa de Arbitragem', '2025-12-31', 'pending', '2º Parcela'),
  ('SEU_USER_ID', 80.00, 'Mensalidade', '2025-11-15', 'pending', 'Novembro');

-- Deve criar 3 cobranças pendentes para o atleta
```

---

## 🧪 **TESTES A REALIZAR:**

### **TESTE 1: Verificar Interface de Seleção** ✅

```
PASSOS:
1. Fazer login como ATLETA (não admin)
2. Ir em "Pagamentos" ou "Minhas Cobranças"
3. Clicar em "💳 Cadastrar Pagamento"

RESULTADO ESPERADO:
✅ Deve aparecer modal "Selecione o Pagamento"
✅ Cada cobrança deve ter um CHECKBOX ao lado
✅ Botão "✅ Selecionar Todas" / "❌ Desmarcar Todas" no topo
✅ Instruções: "✔️ Marque as cobranças que deseja pagar..."
✅ Cada cobrança também tem botão "Pagar Só Esta" (azul)
```

---

### **TESTE 2: Selecionar Cobranças com Checkboxes** ✅

```
PASSOS:
1. Marcar checkbox da 1ª cobrança (R$ 100)
2. Marcar checkbox da 2ª cobrança (R$ 150)
3. NÃO marcar a 3ª (R$ 80)

RESULTADO ESPERADO:
✅ As 2 cobranças marcadas ficam com fundo VERDE
✅ Aparece card verde no topo:
   "✅ 2 Cobrança(s) Selecionada(s)"
   "Total a pagar: R$ 250,00"
✅ Botão "Pagar Selecionadas →" aparece (verde, destaque)
✅ A 3ª cobrança continua com fundo branco (não selecionada)
```

---

### **TESTE 3: Botão "Selecionar Todas"** ✅

```
PASSOS:
1. Clicar em "✅ Selecionar Todas"

RESULTADO ESPERADO:
✅ TODAS as cobranças ficam marcadas (fundo verde)
✅ Card mostra: "3 Cobrança(s) Selecionada(s) • Total: R$ 330,00"
✅ Botão muda para "❌ Desmarcar Todas"

PASSOS 2:
1. Clicar em "❌ Desmarcar Todas"

RESULTADO ESPERADO:
✅ Todas as cobranças desmarcam
✅ Card verde desaparece
✅ Botão volta para "✅ Selecionar Todas"
```

---

### **TESTE 4: Enviar Comprovante de Múltiplas Selecionadas** ✅

```
PASSOS:
1. Marcar 2 ou 3 cobranças
2. Clicar em "Pagar Selecionadas →"

RESULTADO ESPERADO:
✅ Modal muda para "💰 Pagar Múltiplas Cobranças"
✅ Deve mostrar lista APENAS das selecionadas:
   - 1. Taxa de Arbitragem - R$ 100,00 (Falta: R$ 100,00)
   - 2. Taxa de Arbitragem - R$ 150,00 (Falta: R$ 150,00)
✅ Card verde com "💵 Valor Total Pendente: R$ 250,00"
✅ Campo "Valor do Comprovante" preenchido com R$ 250,00

PASSOS 2:
1. Selecionar arquivo de comprovante (JPG/PNG/PDF)
2. Confirmar valor: R$ 250,00
3. Método de pagamento: PIX
4. Clicar em "Enviar Comprovante"

RESULTADO ESPERADO:
✅ Mensagem: "Comprovante de R$ 250,00 enviado para 2 cobranças"
✅ Notificação: "Pagamento Múltiplo Enviado"
✅ Modal fecha
✅ Console (F12): "💰 Pagamento MÚLTIPLO! 📋 2 pagamentos"
```

---

### **TESTE 5: Verificar no Banco de Dados** ✅

```sql
-- No SQL Editor, execute:

SELECT 
  pp.id,
  pp.payment_id,
  pp.proof_amount,
  pp.multiple_payment_ids,
  pp.status,
  p.category,
  p.observation
FROM payment_proofs pp
JOIN payments p ON pp.payment_id = p.id
WHERE pp.user_id = 'SEU_USER_ID'
  AND pp.status = 'pending'
ORDER BY pp.submitted_at DESC
LIMIT 5;

RESULTADO ESPERADO:
✅ Deve retornar 3 linhas (3 comprovantes)
✅ Todas com proof_amount = 330.00
✅ Todas com multiple_payment_ids preenchido (lista de IDs)
✅ Status = 'pending'
✅ Cada uma vinculada a um payment_id diferente
```

---

### **TESTE 6: Admin Aprovar Comprovante** ✅

```
PASSOS:
1. Fazer login como ADMIN
2. Ir em "Pagamentos"
3. Clicar em "Revisar Comprovantes"
4. Deve aparecer 3 comprovantes do mesmo atleta
5. Aprovar QUALQUER UM dos 3

RESULTADO ESPERADO:
❗ IMPORTANTE: Ao aprovar UM, os outros 2 devem ser aprovados automaticamente!

✅ Sistema deve:
   - Detectar que é pagamento múltiplo (pelo campo multiple_payment_ids)
   - Distribuir o valor R$ 330,00 entre as 3 cobranças
   - Cobrança 1: R$ 100 → Status: PAID
   - Cobrança 2: R$ 150 → Status: PAID
   - Cobrança 3: R$ 80 → Status: PAID
   - Criar 3 tickets (um para cada cobrança)
   - Marcar os 3 comprovantes como 'approved'

✅ Notificação para o atleta:
   "Seu pagamento de R$ 330,00 foi aprovado!"

✅ Console deve mostrar:
   "✅ Pagamento 1 atualizado: PAGO TOTAL"
   "✅ Pagamento 2 atualizado: PAGO TOTAL"
   "✅ Pagamento 3 atualizado: PAGO TOTAL"
```

---

### **TESTE 7: Verificar Resultado Final** ✅

```
COMO ATLETA:
1. Voltar para "Minhas Cobranças"

RESULTADO ESPERADO:
✅ As 3 cobranças devem estar com status "PAGO"
✅ Não deve mais aparecer botão "Pagar Tudo"
✅ Dashboard deve mostrar:
   - Total Pago: aumentou em R$ 330,00
   - Total Pendente: diminuiu em R$ 330,00
```

---

### **TESTE 8: Verificar Tickets Criados** ✅

```
COMO ATLETA:
1. Ir em "Tickets"

RESULTADO ESPERADO:
✅ Deve ter 3 novos tickets:
   - Ticket 1: R$ 100,00 (Taxa de Arbitragem)
   - Ticket 2: R$ 150,00 (Taxa de Arbitragem)
   - Ticket 3: R$ 80,00 (Mensalidade)
✅ Todos com comprovante anexado
✅ Todos com status "Completo"
```

---

## ❌ **TESTES DE ERRO:**

### **TESTE 9: Valor Incorreto** ❌

```
PASSOS:
1. Clicar em "Pagar Tudo"
2. Alterar valor para R$ 200,00 (menor que o total)
3. Tentar enviar

RESULTADO ESPERADO:
✅ Deve mostrar erro:
   "O valor não pode ser diferente do valor total pendente (R$ 330,00)"
```

---

### **TESTE 10: Sem Arquivo** ❌

```
PASSOS:
1. Clicar em "Pagar Tudo"
2. NÃO selecionar arquivo
3. Tentar enviar

RESULTADO ESPERADO:
✅ Deve mostrar erro: "Selecione um comprovante"
```

---

### **TESTE 11: Pagamento Individual Ainda Funciona** ✅

```
PASSOS:
1. Criar 1 cobrança pendente
2. Ir em "Cadastrar Pagamento"
3. Escolher a cobrança INDIVIDUAL (não clicar em "Pagar Tudo")
4. Enviar comprovante

RESULTADO ESPERADO:
✅ Deve funcionar normalmente (modo antigo)
✅ Modal deve mostrar "Enviar Comprovante de Pagamento" (não "Pagar Múltiplas")
✅ Comprovante não deve ter multiple_payment_ids preenchido
✅ Admin aprova normalmente
```

---

## 📊 **CHECKLIST FINAL:**

```
☐ 1. Botão "Pagar Tudo" aparece quando há múltiplas cobranças
☐ 2. Modal mostra lista de cobranças e total correto
☐ 3. Comprovante é enviado com sucesso
☐ 4. 3 registros são criados no payment_proofs
☐ 5. Campo multiple_payment_ids está preenchido
☐ 6. Admin vê 3 comprovantes para aprovar
☐ 7. Ao aprovar 1, os outros 2 são aprovados automaticamente
☐ 8. Todas as 3 cobranças ficam com status 'paid'
☐ 9. 3 tickets são criados com comprovante
☐ 10. Pagamento individual ainda funciona normalmente
```

---

## 🐛 **SE ALGO DER ERRADO:**

### **Console do Navegador (F12):**
```
Procure por:
❌ Erros em vermelho
⚠️ Avisos em amarelo
📋 Logs com "💰 Pagamento MÚLTIPLO"
```

### **Banco de Dados:**
```sql
-- Ver comprovantes pendentes
SELECT * FROM payment_proofs 
WHERE status = 'pending' 
ORDER BY submitted_at DESC 
LIMIT 10;

-- Ver se campo multiple_payment_ids existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'payment_proofs' 
AND column_name = 'multiple_payment_ids';
```

---

## 📞 **PROBLEMAS COMUNS:**

### **Problema 1: Botão "Pagar Tudo" não aparece**
```
CAUSA: Só 1 cobrança pendente (precisa ter 2+)
SOLUÇÃO: Criar mais cobranças para o atleta
```

### **Problema 2: Erro ao enviar comprovante**
```
CAUSA: Campo multiple_payment_ids não existe no banco
SOLUÇÃO: Executar sql/add_multiple_payments_field.sql
```

### **Problema 3: Admin não vê os comprovantes**
```
CAUSA: Comprovantes não foram criados
SOLUÇÃO: Verificar console do navegador (F12) por erros
```

---

## ✅ **TESTE BEM-SUCEDIDO QUANDO:**

```
✅ Atleta consegue selecionar múltiplas cobranças
✅ Comprovante único é enviado para todas
✅ Admin aprova UMA VEZ
✅ TODAS as cobranças são quitadas automaticamente
✅ TODOS os tickets são criados corretamente
✅ Dashboard atualiza valores corretamente
✅ Pagamento individual continua funcionando
```

---

**🚀 Bons testes! Qualquer problema, me chama!**

