# 🚀 Deploy Simples - Supabase Edge Function

## 📋 **Método Rápido (usando npx - sem instalar)**

Se você não quer instalar o Supabase CLI, pode usar `npx`:

### 1. Fazer Login

```powershell
cd "C:\São Luiz Financeiro"

npx supabase@latest login
```

Isso vai abrir o navegador para você fazer login.

### 2. Linkar Projeto

```powershell
# Obter o Reference ID:
# 1. Acesse: https://supabase.com/dashboard
# 2. Selecione seu projeto
# 3. Vá em Settings → General
# 4. Copie o "Reference ID" (ex: wgaqgsblpersthvytcif)

npx supabase@latest link --project-ref wgaqgsblpersthvytcif
```

### 3. Fazer Deploy

```powershell
npx supabase@latest functions deploy admin-reset-password
```

**Pronto!** A função estará disponível em:
```
https://wgaqgsblpersthvytcif.supabase.co/functions/v1/admin-reset-password
```

---

## ✅ **Verificar se Funcionou**

1. Acesse: https://supabase.com/dashboard
2. Vá em **Edge Functions**
3. Você deve ver `admin-reset-password` listada
4. Teste o botão de reset no sistema

---

## 🔧 **Se Der Erro**

### Erro: "Project not found"
- Verifique se o Reference ID está correto
- Certifique-se de estar logado na conta correta

### Erro: "Function not found"
- Certifique-se de estar na pasta do projeto
- Verifique se o arquivo existe em: `supabase/functions/admin-reset-password/index.ts`

### Erro de permissão
- Execute o PowerShell como Administrador

