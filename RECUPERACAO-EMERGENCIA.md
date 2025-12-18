# 🚨 RECUPERAÇÃO DE EMERGÊNCIA - PERFIS REMOVIDOS

## ⚠️ SITUAÇÃO
Os perfis foram removidos acidentalmente pela query de remoção de duplicatas.

## 🔄 OPÇÕES DE RECUPERAÇÃO

### 1. **BACKUP DO SUPABASE (RECOMENDADO)**
   - Acesse: Supabase Dashboard > Database > Backups
   - Verifique se há backups automáticos disponíveis
   - Se houver, restaure para um ponto ANTES da execução da query
   - **Esta é a melhor opção!**

### 2. **VERIFICAR AUTH.USERS**
   - Acesse: Supabase Dashboard > Authentication > Users
   - Lá você verá todos os usuários registrados com seus emails
   - Você pode usar esses dados para recriar os perfis

### 3. **RECUPERAR DE OUTRAS TABELAS**
   - Execute a query: `sql/recover_profiles_from_references.sql`
   - Ela tentará criar perfis básicos a partir de referências em:
     - `payments.member_id`
     - `payment_proofs.user_id`
     - `notifications.user_id`
   - ⚠️ Os perfis criados serão básicos (sem nome completo, telefone, etc.)

### 4. **RESTAURAR DE BACKUP MANUAL**
   - Se você fez backup manual antes (via Settings > Backup JSON)
   - Use a função de importar backup no sistema
   - Isso restaurará os perfis completos

## 📋 PASSOS IMEDIATOS

1. **NÃO EXECUTE MAIS QUERIES DELETE!**
2. Execute `sql/check_profiles_status.sql` para ver o estado atual
3. Verifique backups no Supabase Dashboard
4. Se não houver backup, execute `sql/recover_profiles_from_references.sql`
5. Depois, atualize manualmente os dados dos perfis recuperados

## 🔍 VERIFICAÇÃO

Execute estas queries para ver o estado:

```sql
-- Ver quantos perfis restam
SELECT COUNT(*) FROM profiles;

-- Ver perfis restantes
SELECT * FROM profiles LIMIT 10;

-- Ver referências órfãs
SELECT COUNT(*) FROM payments WHERE member_id NOT IN (SELECT id FROM profiles);
```

## 💡 PREVENÇÃO FUTURA

1. **SEMPRE faça backup antes de executar queries DELETE**
2. **Teste queries em ambiente de desenvolvimento primeiro**
3. **Use transações (BEGIN/ROLLBACK) para testar**
4. **Configure backups automáticos no Supabase**



