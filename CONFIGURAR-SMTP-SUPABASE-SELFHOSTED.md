# 🔧 Configurar SMTP no Supabase Self-Hosted

## 📋 Problema

Quando você migra para Supabase self-hosted, o reset de senha para de funcionar porque o Supabase precisa estar configurado para enviar emails via SMTP.

## ✅ Solução: Configurar SMTP

### 1️⃣ Acessar Configurações do Supabase

Se você está usando Supabase self-hosted, você precisa configurar as variáveis de ambiente do Supabase para enviar emails.

### 2️⃣ Configurar Variáveis de Ambiente

No seu arquivo de configuração do Supabase (geralmente `.env` ou `docker-compose.yml`), adicione:

```env
# Configuração SMTP
GOTRUE_SMTP_ADMIN_EMAIL=noreply@seudominio.com
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=seu-email@gmail.com
GOTRUE_SMTP_PASS=sua-senha-de-app
GOTRUE_SMTP_SENDER_NAME=São Luiz Financeiro
GOTRUE_SMTP_SENDER_ADDRESS=noreply@seudominio.com
```

### 3️⃣ Exemplo com Gmail

Se você usar Gmail:

```env
GOTRUE_SMTP_ADMIN_EMAIL=noreply@saoluiz.com
GOTRUE_SMTP_HOST=smtp.gmail.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=seu-email@gmail.com
GOTRUE_SMTP_PASS=xxxx xxxx xxxx xxxx  # Senha de app do Gmail
GOTRUE_SMTP_SENDER_NAME=São Luiz Financeiro
GOTRUE_SMTP_SENDER_ADDRESS=noreply@saoluiz.com
```

**⚠️ IMPORTANTE**: Para Gmail, você precisa usar uma **Senha de App**, não sua senha normal:
1. Acesse: https://myaccount.google.com/apppasswords
2. Gere uma senha de app
3. Use essa senha no `GOTRUE_SMTP_PASS`

### 4️⃣ Exemplo com Docker Compose

Se você usa Docker Compose, adicione no arquivo `docker-compose.yml`:

```yaml
services:
  auth:
    environment:
      GOTRUE_SMTP_ADMIN_EMAIL: noreply@seudominio.com
      GOTRUE_SMTP_HOST: smtp.gmail.com
      GOTRUE_SMTP_PORT: 587
      GOTRUE_SMTP_USER: seu-email@gmail.com
      GOTRUE_SMTP_PASS: sua-senha-de-app
      GOTRUE_SMTP_SENDER_NAME: São Luiz Financeiro
      GOTRUE_SMTP_SENDER_ADDRESS: noreply@seudominio.com
```

### 5️⃣ Configurar Site URL

Também é importante configurar a URL do seu site para que os links de reset funcionem:

```env
GOTRUE_SITE_URL=http://192.168.15.60:3000
# ou
GOTRUE_SITE_URL=https://seudominio.com
```

### 6️⃣ Reiniciar o Supabase

Após configurar, reinicie o Supabase:

```bash
# Se usar Docker Compose
docker-compose restart auth

# Ou se usar outro método
# Reinicie o serviço de autenticação
```

### 7️⃣ Testar

1. Acesse a tela de login
2. Clique em "Esqueci minha senha"
3. Digite um email cadastrado
4. Verifique se o email foi enviado

---

## 🔍 Troubleshooting

### Problema: Email não está sendo enviado

**Soluções:**
1. Verifique os logs do Supabase:
   ```bash
   docker-compose logs auth
   ```
2. Verifique se as credenciais SMTP estão corretas
3. Para Gmail, certifique-se de usar uma Senha de App
4. Verifique se a porta 587 está aberta (ou use 465 com SSL)

### Problema: Link de reset não funciona

**Soluções:**
1. Verifique se `GOTRUE_SITE_URL` está configurado corretamente
2. O link deve apontar para: `http://seu-ip:porta/#type=recovery&access_token=...`
3. Verifique se o frontend está configurado para processar o hash `#type=recovery`

### Problema: Erro de autenticação SMTP

**Soluções:**
1. Para Gmail, ative "Acesso a apps menos seguros" (não recomendado) OU use Senha de App
2. Verifique se o firewall não está bloqueando a porta SMTP
3. Teste as credenciais em um cliente de email separado

---

## 📝 Outros Provedores SMTP

### SendGrid

```env
GOTRUE_SMTP_HOST=smtp.sendgrid.net
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=apikey
GOTRUE_SMTP_PASS=sua-api-key-do-sendgrid
```

### Mailgun

```env
GOTRUE_SMTP_HOST=smtp.mailgun.org
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=seu-usuario
GOTRUE_SMTP_PASS=sua-senha
```

### Amazon SES

```env
GOTRUE_SMTP_HOST=email-smtp.us-east-1.amazonaws.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=sua-access-key
GOTRUE_SMTP_PASS=sua-secret-key
```

---

## ✅ Checklist

- [ ] Variáveis SMTP configuradas no `.env` ou `docker-compose.yml`
- [ ] `GOTRUE_SITE_URL` configurado com a URL correta do seu site
- [ ] Supabase reiniciado após as mudanças
- [ ] Testado envio de email de reset de senha
- [ ] Link de reset funcionando corretamente
- [ ] Frontend processando o hash `#type=recovery`

---

## 🔗 Referências

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configuração SMTP do GoTrue](https://github.com/supabase/gotrue#smtp-configuration)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
