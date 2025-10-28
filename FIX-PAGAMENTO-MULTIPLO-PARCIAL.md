# 🐛 CORREÇÃO: Pagamento Múltiplo com Valor Parcial

## 🎯 **PROBLEMA IDENTIFICADO**

Quando um atleta selecionava múltiplas cobranças e pagava um valor MENOR que o total, o sistema registrava como se tivesse pago o valor COMPLETO.

### **Exemplo do Bug:**
```
Cobranças selecionadas:
├─ Taxa de Arbitragem: R$ 20,00
└─ Mensalidade: R$ 10,00
└─ TOTAL: R$ 30,00

Atleta paga: R$ 27,00 (parcial)

❌ BUG - O que acontecia:
├─ Comprovante 1: R$ 20,00 (valor completo da taxa)
├─ Comprovante 2: R$ 10,00 (valor completo da mensalidade)
└─ Total registrado: R$ 30,00 ← ERRADO!
```

---

## ✅ **SOLUÇÃO IMPLEMENTADA**

Agora o sistema distribui o valor pago **proporcionalmente** entre as cobranças selecionadas.

### **Exemplo Corrigido:**
```
Cobranças selecionadas:
├─ Taxa de Arbitragem: R$ 20,00 (66.67%)
└─ Mensalidade: R$ 10,00 (33.33%)
└─ TOTAL: R$ 30,00

Atleta paga: R$ 27,00 (90% do total)

✅ CORREÇÃO - O que acontece agora:
├─ Comprovante 1: R$ 18,00 (20/30 * 27 = 66.67% de R$27)
├─ Comprovante 2: R$ 9,00 (10/30 * 27 = 33.33% de R$27)
└─ Total registrado: R$ 27,00 ← CORRETO!
```

---

## 🔧 **CÓDIGO ALTERADO**

### **Arquivo:** `src/components/PaymentProofModal.js`

#### **ANTES (Bug):**
```javascript
const proofsToInsert = payment.payments.map(p => {
  const amountDue = parseFloat(p.amount) - parseFloat(p.paid_amount || 0);
  
  return {
    // ...
    proof_amount: amountDue, // ❌ Sempre o valor completo!
    // ...
  };
});
```

#### **DEPOIS (Corrigido):**
```javascript
// 1. Calcular valor total pendente
const totalPendingAmount = payment.payments.reduce((sum, p) => {
  return sum + (parseFloat(p.amount) - parseFloat(p.paid_amount || 0));
}, 0);

// 2. Valor que o usuário REALMENTE está pagando
const actualPaymentAmount = parseFloat(proofAmount); // Valor digitado!

// 3. Distribuir proporcionalmente
let distributedAmounts = [];
let totalDistributed = 0;

payment.payments.forEach((p, index) => {
  const amountDue = parseFloat(p.amount) - parseFloat(p.paid_amount || 0);
  let proportionalAmount;
  
  if (index === payment.payments.length - 1) {
    // Último: calcular resto (evita erros de arredondamento)
    proportionalAmount = actualPaymentAmount - totalDistributed;
  } else {
    // Calcular proporcional: (amountDue / totalPendingAmount) * actualPaymentAmount
    proportionalAmount = (amountDue / totalPendingAmount) * actualPaymentAmount;
    proportionalAmount = Math.round(proportionalAmount * 100) / 100;
    totalDistributed += proportionalAmount;
  }
  
  distributedAmounts.push(proportionalAmount);
});

// 4. Criar comprovantes com valores proporcionais
const proofsToInsert = payment.payments.map((p, index) => {
  return {
    // ...
    proof_amount: distributedAmounts[index], // ✅ Valor proporcional!
    // ...
  };
});
```

---

## 📊 **FÓRMULA DA DISTRIBUIÇÃO PROPORCIONAL**

```
Para cada cobrança:

proportionalAmount = (valorDevido / totalPendente) * valorPago

Exemplo:
├─ Cobrança 1: (20 / 30) * 27 = 0.6667 * 27 = 18.00
├─ Cobrança 2: (10 / 30) * 27 = 0.3333 * 27 = 9.00
└─ Total: 18.00 + 9.00 = 27.00 ✅
```

---

## 🧪 **COMO TESTAR**

### **Teste 1: Pagamento parcial de múltiplas cobranças iguais**
```
Cobranças:
├─ R$ 50,00 (Taxa A)
└─ R$ 50,00 (Taxa B)
└─ Total: R$ 100,00

Pagar: R$ 80,00

Resultado esperado:
├─ Taxa A: R$ 40,00 (50% de 80)
└─ Taxa B: R$ 40,00 (50% de 80)
└─ Total: R$ 80,00 ✅
```

### **Teste 2: Pagamento parcial de múltiplas cobranças diferentes**
```
Cobranças:
├─ R$ 60,00 (Taxa A) - 60% do total
└─ R$ 40,00 (Taxa B) - 40% do total
└─ Total: R$ 100,00

Pagar: R$ 50,00

Resultado esperado:
├─ Taxa A: R$ 30,00 (60% de 50)
└─ Taxa B: R$ 20,00 (40% de 50)
└─ Total: R$ 50,00 ✅
```

### **Teste 3: Pagamento completo (não deve mudar)**
```
Cobranças:
├─ R$ 20,00 (Taxa A)
└─ R$ 10,00 (Taxa B)
└─ Total: R$ 30,00

Pagar: R$ 30,00 (completo)

Resultado esperado:
├─ Taxa A: R$ 20,00 (100%)
└─ Taxa B: R$ 10,00 (100%)
└─ Total: R$ 30,00 ✅
```

---

## 📝 **LOGS DE DEBUG**

Quando um pagamento múltiplo for enviado, o console vai mostrar:

```
💰 Pagamento MÚLTIPLO detectado!
📋 Pagamentos incluídos: 2
💵 Valor DIGITADO pelo usuário: 27
💵 Valor TOTAL das cobranças: 30
🔢 Total pendente: 30.00
🔢 Valor sendo pago: 27.00
📝 Taxa de Arbitragem: { amountDue: '20.00', proportionalAmount: '18.00', percentage: '66.7%' }
📝 Mensalidade: { amountDue: '10.00', proportionalAmount: '9.00', percentage: '33.3%' }
✅ 2 comprovantes criados para pagamento múltiplo
💰 Valor total distribuído: R$ 27.00
```

---

## ⚠️ **CASOS ESPECIAIS TRATADOS**

### 1. **Arredondamento**
- Valores são arredondados para 2 casas decimais
- O último pagamento recebe o "resto" para garantir que a soma seja exata

### 2. **Valores negativos**
- Se por algum erro de arredondamento resultar em negativo, força para 0

### 3. **Pagamento com cobranças já parcialmente pagas**
- Calcula o `amountDue` (valor devido) para cada cobrança
- Distribui apenas sobre o valor que ainda falta pagar

---

## 🚀 **PARA SUBIR**

```bash
git add src/components/PaymentProofModal.js
git commit -m "fix: distribuir valor proporcionalmente em pagamento múltiplo parcial"
git push
```

---

## ✅ **STATUS**

- [x] Bug identificado
- [x] Solução implementada
- [x] Logs de debug adicionados
- [x] Casos especiais tratados
- [ ] Teste manual
- [ ] Deploy

---

**Data:** 28/10/2025  
**Arquivo:** `src/components/PaymentProofModal.js`  
**Linhas alteradas:** 93-169


