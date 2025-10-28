# 📧 COMO CONFIGURAR GMAIL SMTP NO SUPABASE

---

## 🎯 **O QUE VOCÊ VAI CONSEGUIR:**

```
✅ Enviar até 500 emails/dia pelo Gmail
✅ ~20 emails/hora (suficiente!)
✅ Não usar o limite do Supabase
✅ Cadastro e reset funcionando normalmente
```

---

## 📋 **PASSO 1: CRIAR SENHA DE APP NO GMAIL**

### **1.1. Acesse sua conta Google:**
```
🔗 https://myaccount.google.com/
```

### **1.2. Vá para Segurança:**
```
Menu lateral → Segurança
```

### **1.3. Ative verificação em 2 etapas (se ainda não tiver):**
```
1. Procure "Verificação em duas etapas"
2. Clique em "Ativar"
3. Siga os passos (SMS ou app)
```

### **1.4. Criar Senha de App:**
```
1. Procure "Senhas de app" (App Passwords)
2. Clique em "Senhas de app"
3. Selecione:
   - App: "Outro (nome personalizado)"
   - Digite: "Supabase São Luiz"
4. Clique em "Gerar"
5. **COPIE A SENHA DE 16 DÍGITOS** (algo como: abcd efgh ijkl mnop)
   ⚠️ Salve essa senha! Não vai aparecer de novo!
```

---

## 📋 **PASSO 2: CONFIGURAR NO SUPABASE**

### **2.1. Acesse:**
```
🔗 https://supabase.com/dashboard/project/wgaqgsblpersthvytcif/auth/providers

Ou navegue:
Authentication → Emails → SMTP Settings
```

### **2.2. Ativar Custom SMTP:**
```
Toggle "Enable Custom SMTP" → ON (verde)
```

### **2.3. Preencher os campos:**

```
Sender email:
└─ seu-email@gmail.com
   (O email que você criou a senha de app)

Sender name:
└─ São Luiz Vôlei
   (Nome que aparece no email)

Host:
└─ smtp.gmail.com

Port:
└─ 587

Username:
└─ seu-email@gmail.com
   (O mesmo email)

Password:
└─ abcd efgh ijkl mnop
   (A senha de 16 dígitos que você copiou)

Connection security:
└─ STARTTLS (ou TLS)
```

### **2.4. Salvar:**
```
Clique em "Save" no final da página
```

---

## 📋 **PASSO 3: CONFIGURAR LIMITE DE EMAILS**

Agora que você tem SMTP customizado:

### **3.1. Volte para Rate Limits:**
```
🔗 https://supabase.com/dashboard/project/wgaqgsblpersthvytcif/auth/rate-limits

Ou navegue:
Authentication → Rate Limits
```

### **3.2. Mudar o limite:**
```
Rate limit for sending emails: [2]
└─ Clique no campo
└─ Mude para: 20 (ou 50)
└─ Clique em "Save"
```

**Agora vai deixar você mudar! ✅**

---

## 🧪 **PASSO 4: TESTAR**

### **4.1. Enviar email de teste:**

No Supabase:
```
Authentication → Emails → Templates
└─ Escolha qualquer template
└─ Clique em "Send test email"
└─ Digite seu email
└─ Clique em "Send"
```

### **4.2. Verificar:**
```
✅ Email chegou? → Funcionou!
❌ Não chegou? → Verifique:
   - Senha de app está correta?
   - Email é do Gmail mesmo?
   - Verificação em 2 etapas está ativa?
```

### **4.3. Testar cadastro:**
```
1. Limpar cache (Ctrl + Shift + Delete)
2. Recarregar site (Ctrl + F5)
3. Tentar cadastrar
4. ✅ Deve funcionar!
```

---

## 📊 **LIMITES DO GMAIL:**

```
📧 Limite diário: 500 emails/dia
📧 Limite por hora: ~20 emails/hora (recomendado)
📧 Limite por minuto: ~2 emails/minuto

Para o seu caso (poucos atletas):
✅ 20 emails/hora é MAIS que suficiente!
```

---

## ⚠️ **CUIDADOS:**

```
1. NÃO compartilhe a senha de app
   └─ Ela dá acesso total ao seu email!

2. Use um email dedicado (recomendado)
   └─ Crie: saoluiz.noreply@gmail.com
   └─ Use apenas para o sistema
   └─ Não use seu email pessoal

3. Se bloquear, Gmail pode desabilitar
   └─ Gmail detecta spam automaticamente
   └─ Não envie emails em massa
```

---

## 🆘 **PROBLEMAS COMUNS:**

### **"Invalid credentials"**
```
❌ Senha de app incorreta
✅ Gere uma nova e cole novamente
```

### **"Authentication failed"**
```
❌ Verificação em 2 etapas não está ativa
✅ Ative nas configurações do Gmail
```

### **"Connection refused"**
```
❌ Host ou Port incorretos
✅ Use: smtp.gmail.com porta 587
```

### **Email não chega**
```
❌ Pode estar na caixa de spam
✅ Verifique a pasta spam/lixo eletrônico
```

---

## 🎯 **RESUMO:**

```
1. Criar senha de app no Gmail
2. Configurar SMTP no Supabase
3. Aumentar rate limit para 20-50
4. Testar cadastro
5. Funciona! ✅
```

---

## 🚀 **TEMPO ESTIMADO:**

```
⏱️ Criar senha de app: 5 minutos
⏱️ Configurar SMTP: 3 minutos
⏱️ Testar: 2 minutos

TOTAL: ~10 minutos
```

---

**Qualquer dúvida, me chama! 📧**

