# 🏆 Financeiro São Luiz

**Sistema de gestão financeira completo para o São Luiz**

## 🚀 Deploy no Netlify

### ✅ **Configuração Automática**

O projeto já está configurado para deploy automático no Netlify:

- **Arquivo:** `netlify.toml` ✅
- **Build Command:** `npm run build` ✅
- **Publish Directory:** `build` ✅
- **Variáveis de Ambiente:** Configuradas ✅

### 🔧 **Variáveis de Ambiente (Netlify)**

```
REACT_APP_DB_MODE=supabase
REACT_APP_SUPABASE_URL=https://wgaqgsblpersthvytcif.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnYXFnc2JscGVyc3Rodnl0Y2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyMDQsImV4cCI6MjA3Njc0MTIwNH0.KSgtRaZHayjs1TGFQv1tRd5_TgYFqtXect66bjgdgVc
```

### 📋 **Como fazer o Deploy:**

1. **Conectar ao GitHub:**
   - Faça push deste projeto para um repositório GitHub
   - Conecte o repositório ao Netlify

2. **Deploy Automático:**
   - O Netlify detectará o `netlify.toml`
   - Build será executado automaticamente
   - Site ficará disponível em `https://seu-site.netlify.app`

3. **Configurações Manuais (se necessário):**
   - **Build Command:** `npm run build`
   - **Publish Directory:** `build`
   - **Node Version:** `18`

### 🎯 **Funcionalidades do Sistema:**

- ✅ **Sistema de Usuários** com login individual
- ✅ **Grupos** (Mensalistas, Campeonatos, Equipes)
- ✅ **Cobranças por grupo** com PIX
- ✅ **Upload de comprovantes**
- ✅ **Sistema de aprovações** com mensagens
- ✅ **Notificações** em tempo real
- ✅ **Dashboard** completo
- ✅ **Relatórios** e exportação

### 🔐 **Login Admin:**

- **Email:** admin@saoluiz.com
- **Senha:** admin123
- **⚠️ ALTERE A SENHA após primeiro login!**

### 📱 **Acesso:**

- **Desenvolvimento:** `npm start` → http://localhost:3000
- **Produção:** Deploy automático no Netlify

---

**🎉 Sistema pronto para produção!**
