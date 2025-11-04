# 📦 Como Instalar Supabase CLI no Windows

## ✅ **Opção 1: Usar Scoop (Recomendado)**

1. **Instalar Scoop** (se não tiver):
```powershell
# Execute no PowerShell como Administrador:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

2. **Instalar Supabase CLI:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

---

## ✅ **Opção 2: Download Direto (Mais Simples)**

1. **Baixar o binário:**
   - Acesse: https://github.com/supabase/cli/releases
   - Baixe a versão mais recente para Windows (arquivo `.exe`)

2. **Adicionar ao PATH:**
   - Coloque o arquivo em uma pasta (ex: `C:\tools\supabase\`)
   - Adicione essa pasta nas variáveis de ambiente PATH

---

## ✅ **Opção 3: Usar npx (Sem Instalar)**

Você pode usar sem instalar globalmente:

```powershell
npx supabase@latest login
npx supabase@latest link --project-ref seu-project-ref
npx supabase@latest functions deploy admin-reset-password
```

---

## 🎯 **Recomendação**

Para **rapidez**, use a **Opção 3** (npx) - não precisa instalar nada!

Para **uso frequente**, use a **Opção 1** (Scoop) - instalação mais limpa.

