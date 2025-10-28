# 📧 Limites de Email do Supabase

## 🚨 **PROBLEMA:**

O erro `email rate limit exceeded` acontece quando o Supabase bloqueia o envio de emails por atingir o limite do plano gratuito.

---

## ⚠️ **LIMITES DO PLANO GRATUITO:**

```
- 4 emails por HORA por usuário
- 3.000 emails por MÊS no total
- Proteção anti-spam automática
```

**Fonte:** [Supabase Pricing](https://supabase.com/pricing)

---

## 🔍 **QUANDO ACONTECE:**

1. ✉️ Enviar múltiplos resets de senha em sequência
2. 🔄 Testar a função de reset várias vezes
3. 👥 Vários usuários resetando senha ao mesmo tempo
4. 🧪 Testes de desenvolvimento sem moderação

---

## ✅ **SOLUÇÕES RÁPIDAS (Temporárias):**

### 1. **AGUARDAR:**
```
⏰ Espere 10-15 minutos
⏰ Se não resolver, espere 1 hora
⏰ Se ainda não resolver, espere até o próximo dia (reset às 00:00 UTC)
```

### 2. **VERIFICAR STATUS NO SUPABASE:**
1. Acesse: https://supabase.com/dashboard/project/wgaqgsblpersthvytcif
2. Vá em **Settings → Auth → Email**
3. Verifique o limite atual de emails

---

## 🛠️ **SOLUÇÕES PERMANENTES (Para produção):**

### **OPÇÃO 1: Upgrade para Plano Pro** (Recomendado)
```
💰 Custo: $25/mês
📧 Limite: 50 emails por HORA por usuário
📧 Total: 100.000 emails por MÊS
```

**Como fazer:**
1. Acesse: https://supabase.com/dashboard/project/wgaqgsblpersthvytcif/settings/billing
2. Clique em "Upgrade to Pro"
3. Configure o pagamento

---

### **OPÇÃO 2: Configurar Provedor de Email Customizado** (Avançado)
Usar serviços como **SendGrid**, **AWS SES**, ou **Mailgun**.

**Vantagens:**
- ✅ Limites muito maiores
- ✅ Emails personalizados (com logo, etc.)
- ✅ Melhor entregabilidade
- ✅ Estatísticas de envio

**Como configurar:**
1. Criar conta em um provedor (ex: SendGrid)
2. Configurar SMTP no Supabase:
   - Ir em **Settings → Auth → SMTP Settings**
   - Ativar "Enable Custom SMTP"
   - Configurar servidor SMTP

---

## 🎯 **RECOMENDAÇÃO PARA O PROJETO:**

### **FASE ATUAL (Testes):**
```
✅ Usar plano gratuito
⏰ Aguardar 10-15 minutos entre múltiplos resets
📊 Monitorar uso de emails
```

### **FASE PRODUÇÃO (Quando houver muitos usuários):**
```
💰 Upgrade para Plano Pro ($25/mês)
📧 Limites suficientes para 100+ atletas
🚀 Melhor performance e confiabilidade
```

---

## 📊 **MONITORAMENTO:**

### **Ver quantos emails foram enviados:**
1. Acesse: https://supabase.com/dashboard/project/wgaqgsblpersthvytcif/logs/explorer
2. Execute a query:
```sql
SELECT 
  DATE_TRUNC('day', created_at) as data,
  COUNT(*) as total_emails
FROM auth.audit_log_entries
WHERE event_name = 'user_recovery_requested'
GROUP BY data
ORDER BY data DESC
LIMIT 30;
```

---

## 🔧 **WORKAROUNDS (Enquanto no plano gratuito):**

### 1. **Resetar senha manualmente no Supabase Dashboard:**
```
1. Ir em: Authentication → Users
2. Clicar no usuário
3. Clicar em "Reset Password"
4. Copiar link e enviar manualmente
```

### 2. **Admin pode alterar senha diretamente (próxima feature?):**
```javascript
// Função para admin alterar senha sem email
const { error } = await supabase.auth.admin.updateUserById(
  userId, 
  { password: 'nova-senha-temporaria' }
)
```

---

## 📝 **O QUE FOI FEITO:**

✅ **Mensagem de erro melhorada** no AdminPanel.js
- Agora explica claramente o problema
- Indica tempo de espera
- Dá dicas de como evitar

---

## 🚀 **PRÓXIMOS PASSOS:**

1. ⏰ **IMEDIATO:** Aguardar 10-15 minutos e testar novamente
2. 📊 **CURTO PRAZO:** Monitorar uso de emails nos próximos dias
3. 💰 **MÉDIO PRAZO:** Considerar upgrade para Pro quando tiver 20+ usuários ativos
4. 🛠️ **LONGO PRAZO:** Implementar provedor de email customizado (para branding profissional)

---

## 📞 **SUPORTE SUPABASE:**

Se o problema persistir mesmo após 24 horas:
- Discord: https://discord.supabase.com
- Email: support@supabase.io
- Docs: https://supabase.com/docs/guides/auth/auth-smtp

---

**Data:** 28/01/2025  
**Status:** ✅ Tratamento de erro implementado  
**Próxima revisão:** Após 20 usuários ativos

