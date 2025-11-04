# 🔧 Solução para o Erro do .env.local

## ❌ **Problema:**
```
failed to parse environment file: .env.local (unexpected character '»' in variable name)
```

## ✅ **Solução Rápida:**

### **Opção 1: Deletar o arquivo (Recomendado)**

Se você não precisa do `.env.local`, simplesmente delete:

```powershell
cd "C:\São Luiz Financeiro"
Remove-Item .env.local -Force
```

Depois execute:
```powershell
npx supabase@latest link --project-ref wgaqgsblpersthvytcif
```

### **Opção 2: Renomear temporariamente**

```powershell
cd "C:\São Luiz Financeiro"
Rename-Item .env.local .env.local.backup
```

Depois execute:
```powershell
npx supabase@latest link --project-ref wgaqgsblpersthvytcif
```

### **Opção 3: Usar o script automático**

Execute o arquivo `fix-env-local.ps1` que foi criado:

```powershell
cd "C:\São Luiz Financeiro"
.\fix-env-local.ps1
```

---

## 📝 **Nota:**

O arquivo `.env.local` geralmente não é necessário para o deploy da Edge Function. As variáveis de ambiente são configuradas automaticamente pelo Supabase.

Se você precisar do `.env.local` depois, pode recriá-lo com o conteúdo correto (sem caracteres especiais inválidos).

