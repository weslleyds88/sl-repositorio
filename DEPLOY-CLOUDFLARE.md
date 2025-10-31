# 🚀 Deploy no Cloudflare Pages

## ✅ **Variáveis de Ambiente OBRIGATÓRIAS**

Você **DEVE** configurar essas variáveis no Cloudflare Pages:

### 📍 **Onde Configurar:**

1. Acesse: https://dash.cloudflare.com/
2. Vá em **Pages** → Seu projeto **sao-luiz-volei**
3. Clique em **Settings** (⚙️)
4. Role até **Environment Variables**
5. Adicione estas 3 variáveis:

```
REACT_APP_DB_MODE = supabase
REACT_APP_SUPABASE_URL = https://wgaqgsblpersthvytcif.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnYXFnc2JscGVyc3Rodnl0Y2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyMDQsImV4cCI6MjA3Njc0MTIwNH0.KSgtRaZHayjs1TGFQv1tRd5_TgYFqtXect66bjgdgVc
```

### ⚠️ **IMPORTANTE:**

- Configure **Production**, **Preview** e **Browser** (todos os ambientes)
- Após adicionar, faça um **novo deploy** (ou clique em **Retry deployment**)

---

## 🔧 **Configurar CORS no Supabase**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Authentication** → **URL Configuration**
4. Configure:

**Site URL:**
```
https://sao-luiz-volei.pages.dev
```

**Redirect URLs:** (adicione uma por linha)
```
https://sao-luiz-volei.pages.dev
https://sao-luiz-volei.pages.dev/**
https://sao-luiz-volei.pages.dev/*
```

5. **Salve** e aguarde alguns segundos

---

## 🔄 **Fazer Novo Deploy**

Após configurar as variáveis:

1. No Cloudflare Pages, vá em **Deployments**
2. Clique nos **3 pontos** (⋯) do último deploy
3. Selecione **Retry deployment**
4. Aguarde o build terminar
5. Teste o login

---

## ✅ **Verificar se Funcionou**

Abra o console do navegador (F12) e verifique:

❌ **Se aparecer:**
```
Configurações do Supabase não encontradas!
```
→ Variáveis de ambiente não foram configuradas corretamente

✅ **Se aparecer:**
```
✅ Conexão estabelecida
```
→ Tudo certo! O app está conectado ao Supabase

---

## 🐛 **Problemas Comuns**

### Erro de CORS:
```
Access to fetch at 'https://...supabase.co' has been blocked by CORS policy
```
**Solução:** Configure as URLs no Supabase (veja seção acima)

### Dashboards em branco:
**Solução:** Verifique se `REACT_APP_DB_MODE=supabase` está configurado

### Build falha:
**Solução:** Verifique se todas as variáveis foram adicionadas corretamente

---

**🎉 Pronto! Sistema configurado no Cloudflare Pages!**

