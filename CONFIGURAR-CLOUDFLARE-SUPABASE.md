# 🔧 Como Configurar Supabase no Cloudflare Pages

## 📋 Passo a Passo Completo

### 1️⃣ Acessar o Cloudflare Dashboard

1. Acesse: https://dash.cloudflare.com/
2. Faça login com sua conta
3. No menu lateral, clique em **"Workers & Pages"** ou **"Pages"**

### 2️⃣ Encontrar Seu Projeto

1. Na lista de projetos, encontre **"São Luiz Financeiro"** (ou o nome do seu projeto)
2. Clique no projeto para abrir

### 3️⃣ Acessar Configurações de Variáveis de Ambiente

1. No menu do projeto, clique em **"Settings"** (Configurações)
2. Role para baixo até encontrar a seção **"Environment Variables"**
3. Você verá três ambientes: **Production**, **Preview**, e **Development**

### 4️⃣ Adicionar Variáveis do Supabase

Você precisa adicionar **3 variáveis**:

#### Variável 1: `REACT_APP_DB_MODE`
- **Variable name**: `REACT_APP_DB_MODE`
- **Value**: `supabase`
- **Environment**: Selecione **Production** (e **Preview** se quiser testar)

#### Variável 2: `REACT_APP_SUPABASE_URL`
- **Variable name**: `REACT_APP_SUPABASE_URL`
- **Value**: `https://wgaqgsblpersthvytcif.supabase.co` (ou sua URL do Supabase)
- **Environment**: Selecione **Production** (e **Preview** se quiser testar)

#### Variável 3: `REACT_APP_SUPABASE_ANON_KEY`
- **Variable name**: `REACT_APP_SUPABASE_ANON_KEY`
- **Value**: Cole a chave anon do seu Supabase (do arquivo `.env.local`)
- **Environment**: Selecione **Production** (e **Preview** se quiser testar)

### 5️⃣ Como Adicionar Cada Variável

Para cada variável:

1. Clique em **"Add variable"** ou **"Add environment variable"**
2. Preencha:
   - **Variable name**: (nome da variável)
   - **Value**: (valor da variável)
   - **Environment**: Selecione **Production** (marque também **Preview** se quiser)
3. Clique em **"Save"**

### 6️⃣ Verificar Variáveis Configuradas

Após adicionar todas, você deve ver algo assim:

```
Environment Variables:
┌─────────────────────────────────────┬──────────────────────────────────────┐
│ Variable name                       │ Value                                │
├─────────────────────────────────────┼──────────────────────────────────────┤
│ REACT_APP_DB_MODE                   │ supabase                             │
│ REACT_APP_SUPABASE_URL              │ https://wgaqgsblpersthvytcif.sup...  │
│ REACT_APP_SUPABASE_ANON_KEY         │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

### 7️⃣ Fazer Deploy

Após configurar as variáveis:

1. Vá em **"Deployments"** (no menu do projeto)
2. Clique nos **3 pontos** (⋯) do último deploy
3. Selecione **"Retry deployment"**

**OU** faça um novo commit:

```bash
git commit --allow-empty -m "Configurar variáveis Supabase no Cloudflare"
git push origin main
```

### 8️⃣ Aguardar e Verificar

1. Aguarde o deploy completar (2-5 minutos)
2. Acesse seu site
3. Abra o Console do navegador (F12)
4. Procure por mensagens como:
   - ✅ `🔧 Configuração Supabase:`
   - ✅ `- URL: ✅ Configurada`
   - ✅ `- Anon Key: ✅ Configurada`

Se aparecer ❌, verifique se as variáveis estão corretas.

---

## 🔍 Onde Encontrar as Credenciais do Supabase

### Se você já tem no `.env.local`:

1. Abra o arquivo `.env.local` na raiz do projeto
2. Procure por:
   ```
   REACT_APP_SUPABASE_URL=...
   REACT_APP_SUPABASE_ANON_KEY=...
   ```
3. Copie os valores (sem as aspas, se houver)

### Se você não tem:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Você verá:
   - **Project URL**: Copie para `REACT_APP_SUPABASE_URL`
   - **anon public key**: Copie para `REACT_APP_SUPABASE_ANON_KEY`

---

## 📝 Variáveis Opcionais (Se Necessário)

### `REACT_APP_MAINTENANCE_MODE`
- **Quando usar**: Para ativar modo de manutenção
- **Valores**: `true` ou `false`
- **Padrão**: `false` (se não definida)

---

## ✅ Checklist de Configuração

- [ ] Acessei o Cloudflare Dashboard
- [ ] Encontrei meu projeto Pages
- [ ] Acessei Settings > Environment Variables
- [ ] Adicionei `REACT_APP_DB_MODE = supabase`
- [ ] Adicionei `REACT_APP_SUPABASE_URL` com a URL correta
- [ ] Adicionei `REACT_APP_SUPABASE_ANON_KEY` com a chave correta
- [ ] Configurei para ambiente **Production** (e Preview se necessário)
- [ ] Fiz deploy (retry ou novo commit)
- [ ] Verifiquei que o site está funcionando
- [ ] Verifiquei o console do navegador para confirmar configuração

---

## 🐛 Troubleshooting

### Problema: Variáveis não estão sendo aplicadas

**Soluções:**
1. Verifique se você salvou as variáveis (clique em "Save")
2. Verifique se configurou para o ambiente correto (Production)
3. Faça um novo deploy após adicionar as variáveis
4. Limpe o cache do navegador

### Problema: Erro "Configurações do Supabase não encontradas"

**Soluções:**
1. Verifique se os nomes das variáveis estão **exatamente** como:
   - `REACT_APP_DB_MODE`
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
2. Verifique se não há espaços extras no início/fim dos valores
3. Verifique se a URL começa com `https://`
4. Verifique se a chave anon está completa

### Problema: Site não conecta ao Supabase

**Soluções:**
1. Verifique se a URL do Supabase está correta
2. Verifique se a chave anon está correta
3. Verifique se o projeto Supabase está ativo
4. Verifique os logs do deploy no Cloudflare para erros

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- A chave **anon** é pública e pode ser vista no código do cliente
- Ela é segura porque tem permissões limitadas (definidas no Supabase)
- **NUNCA** exponha a **service_role key** no frontend
- As variáveis no Cloudflare são seguras e não aparecem no código fonte

---

## 📸 Visualização no Cloudflare

```
Cloudflare Dashboard
└── Workers & Pages
    └── São Luiz Financeiro (seu projeto)
        ├── Deployments
        ├── Settings ← AQUI!
        │   ├── Builds & deployments
        │   ├── Environment Variables ← ADICIONAR AQUI!
        │   │   └── [Add variable]
        │   └── Custom domains
        └── Functions
```

---

## 🚀 Próximos Passos

Após configurar:

1. ✅ Teste o login no site
2. ✅ Verifique se os dados estão carregando
3. ✅ Teste criar/editar um atleta
4. ✅ Verifique se os pagamentos estão funcionando

Se tudo estiver funcionando, você está pronto! 🎉

