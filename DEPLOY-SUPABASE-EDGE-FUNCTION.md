# 🚀 Deploy da Supabase Edge Function - Admin Reset Password

## 📋 Pré-requisitos

1. **Supabase CLI instalado:**
```bash
npm install -g supabase
```

2. **Fazer login:**
```bash
supabase login
```

## 🔧 Passo a Passo

### 1. Linkar seu projeto Supabase

```bash
# Obter o project ref do seu projeto
# Acesse: https://supabase.com/dashboard → Seu projeto → Settings → General
# Copie o "Reference ID"

supabase link --project-ref seu-project-ref-aqui
```

### 2. Configurar Secrets (Variáveis de Ambiente)

As variáveis já estão disponíveis automaticamente no Supabase, mas você pode verificar:

```bash
# Ver secrets configuradas
supabase secrets list
```

**Nota:** O Supabase Edge Functions já tem acesso automático a:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Não precisa configurar manualmente!

### 3. Fazer Deploy da Function

```bash
supabase functions deploy admin-reset-password
```

### 4. Testar a Function

Após o deploy, você pode testar:

```bash
# Substitua {token} pelo token do admin
# Substitua {userId} pelo ID do usuário
curl -X POST \
  'https://seu-project-ref.supabase.co/functions/v1/admin-reset-password' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "{userId}"}'
```

## ✅ Verificar se Funcionou

1. No Supabase Dashboard, vá em **Edge Functions**
2. Você deve ver `admin-reset-password` listada
3. Clique para ver logs e métricas

## 🔗 URL da Function

A URL será:
```
https://seu-project-ref.supabase.co/functions/v1/admin-reset-password
```

Essa URL será usada automaticamente pelo código frontend através da variável `REACT_APP_SUPABASE_URL`.

## 🐛 Troubleshooting

### Erro: "Function not found"
- Verifique se o deploy foi concluído com sucesso
- Confirme que o nome da função está correto: `admin-reset-password`

### Erro: "Unauthorized"
- Verifique se está passando o token do admin no header `Authorization`
- Confirme que o usuário tem role `admin` na tabela `profiles`

### Erro: "User not found in Authentication"
- O usuário precisa existir na tabela `auth.users`
- Crie manualmente no Supabase Dashboard: **Authentication → Users → Add user**

## 📝 Próximos Passos

Após o deploy:
1. Teste o botão de reset de senha no sistema
2. Verifique os logs no Supabase Dashboard
3. Se funcionar, você pode remover a função Cloudflare Pages Function antiga

