# 🔄 GUIA: Como Recuperar Dados no Supabase Cloud

## 📍 Passo 1: Acessar o Dashboard do Supabase

1. **Acesse**: https://supabase.com/dashboard
2. **Faça login** com sua conta
3. **Selecione seu projeto** (provavelmente algo relacionado a "São Luiz" ou similar)

## 🔍 Passo 2: Verificar Backups Disponíveis

### Opção A: Backups Automáticos (Point-in-Time Recovery)

1. No menu lateral esquerdo, clique em **"Database"**
2. Clique na aba **"Backups"** (ou "Point-in-Time Recovery")
3. Você verá uma lista de backups automáticos disponíveis
4. **Procure um backup de ANTES de você executar a query que deletou os perfis**

### Opção B: Verificar se há Backups Manuais

1. Vá em **"Database"** > **"Backups"**
2. Verifique se há backups manuais salvos
3. Se houver, você pode restaurar qualquer um deles

## 🔄 Passo 3: Restaurar um Backup

### Se você encontrou um backup:

1. **Clique no backup** que você quer restaurar (deve ser ANTES da execução da query)
2. Clique em **"Restore"** ou **"Restaurar"**
3. **Confirme a restauração**
4. ⚠️ **ATENÇÃO**: Isso vai restaurar TODO o banco para aquele ponto no tempo
5. Aguarde alguns minutos enquanto o Supabase restaura

### ⚠️ IMPORTANTE:
- A restauração vai **sobrescrever** o estado atual do banco
- Todos os dados criados DEPOIS do backup serão perdidos
- Certifique-se de escolher o backup correto!

## 🔍 Passo 4: Verificar Dados Após Restauração

Após a restauração, execute esta query no SQL Editor do Supabase:

```sql
-- Verificar se os perfis foram restaurados
SELECT COUNT(*) as total_profiles FROM profiles;

-- Ver alguns perfis
SELECT id, email, full_name, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 20;
```

## 🆘 Se NÃO HOUVER BACKUP DISPONÍVEL

Se não houver backups automáticos ou manuais, você terá que:

### Opção 1: Recuperar de `auth.users`

1. Vá em **"Authentication"** > **"Users"**
2. Lá você verá TODOS os usuários registrados com seus emails
3. Use esses dados para recriar os perfis manualmente

### Opção 2: Recuperar de Referências

Execute a query `sql/recover_profiles_from_references.sql` que criamos anteriormente.

## 📋 Passo 5: Acessar o SQL Editor (Para Executar Queries)

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**
3. Cole a query que você quer executar
4. Clique em **"Run"** ou pressione `Ctrl+Enter`

## 🔐 Informações do Seu Projeto

Baseado no código, seu projeto Supabase está em:
- **URL**: `https://wgaqgsblpersthvytcif.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/wgaqgsblpersthvytcif

## 📝 Checklist de Recuperação

- [ ] Acessei o Supabase Dashboard
- [ ] Encontrei a seção "Database" > "Backups"
- [ ] Identifiquei um backup de ANTES da execução da query
- [ ] Restaurei o backup
- [ ] Verifiquei que os perfis foram restaurados
- [ ] Testei o sistema para garantir que está funcionando

## 🆘 Se Precisar de Ajuda

1. **Documentação do Supabase**: https://supabase.com/docs/guides/database/backups
2. **Suporte do Supabase**: No dashboard, há um botão de suporte/chat
3. **Verificar logs**: Vá em "Logs" > "Database" para ver o que aconteceu

## 💡 Dica: Prevenir no Futuro

1. **Sempre faça backup manual** antes de executar queries DELETE
2. **Use transações** para testar queries primeiro:
   ```sql
   BEGIN;
   -- sua query aqui
   -- verifique o resultado
   ROLLBACK; -- ou COMMIT; se estiver tudo certo
   ```
3. **Configure backups automáticos** no Supabase (já vem habilitado por padrão)

