# 🎯 Como Acessar e Usar o Supabase Cloud - Passo a Passo

## 🔑 Passo 1: Acessar o Dashboard

1. **Abra seu navegador** e vá para: https://supabase.com/dashboard
2. **Faça login** com sua conta (email e senha)
3. Se não tiver conta, clique em **"Sign Up"** e crie uma

## 📂 Passo 2: Encontrar Seu Projeto

Após fazer login, você verá uma lista de projetos. Procure por:
- Um projeto com nome relacionado a "São Luiz" ou "Financeiro"
- Ou um projeto com a URL: `wgaqgsblpersthvytcif.supabase.co`

**Clique no projeto** para abrir o dashboard.

## 🗄️ Passo 3: Acessar a Seção de Backups

### Método 1: Pelo Menu Lateral

1. No menu lateral esquerdo, procure por **"Database"**
2. Clique em **"Database"**
3. No submenu, procure por **"Backups"** ou **"Point-in-Time Recovery"**
4. Clique nele

### Método 2: Pela URL Direta

Se você souber o ID do projeto, pode acessar diretamente:
```
https://supabase.com/dashboard/project/wgaqgsblpersthvytcif/database/backups
```

## 📊 Passo 4: Ver Backups Disponíveis

Na tela de Backups, você verá:

### Se você tem plano Pro ou superior:
- **Point-in-Time Recovery (PITR)**: Backups automáticos a cada X minutos/horas
- Uma linha do tempo mostrando os pontos de restauração disponíveis
- Você pode escolher qualquer ponto no tempo para restaurar

### Se você tem plano Free:
- Backups diários automáticos
- Lista de backups disponíveis com data/hora
- Pode restaurar qualquer backup da lista

## 🔄 Passo 5: Restaurar um Backup

1. **Identifique o backup correto**:
   - Deve ser de ANTES de você executar a query que deletou os perfis
   - Veja a data/hora do backup
   - Exemplo: Se você executou a query hoje às 15h, escolha um backup de antes das 15h

2. **Clique no backup** ou no ponto no tempo que você quer restaurar

3. **Clique no botão "Restore"** ou **"Restaurar"**

4. **Confirme a ação**:
   - O Supabase vai avisar que isso vai sobrescrever o banco atual
   - Confirme que você quer continuar

5. **Aguarde**:
   - A restauração pode levar alguns minutos
   - Você verá uma barra de progresso
   - Não feche a página durante a restauração

## ✅ Passo 6: Verificar se Funcionou

Após a restauração:

1. Vá em **"SQL Editor"** (no menu lateral)
2. Clique em **"New query"**
3. Cole e execute esta query:

```sql
-- Ver quantos perfis foram restaurados
SELECT COUNT(*) as total_profiles FROM profiles;

-- Ver alguns perfis
SELECT id, email, full_name, phone, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 20;
```

4. Se você ver os perfis, **sucesso!** ✅
5. Se ainda estiver vazio, tente outro backup mais antigo

## 🆘 Se NÃO HOUVER BACKUPS

### Opção A: Recuperar de Authentication

1. Vá em **"Authentication"** > **"Users"**
2. Lá você verá TODOS os usuários com seus emails
3. Anote os emails e IDs
4. Use esses dados para recriar os perfis manualmente

### Opção B: Recuperar de Referências

1. Vá em **"SQL Editor"**
2. Abra o arquivo `sql/recover_profiles_from_references.sql`
3. Copie e cole no editor
4. Execute passo a passo (não execute tudo de uma vez!)

## 📸 Onde Fica Cada Coisa no Dashboard

```
┌─────────────────────────────────────┐
│  SUPABASE DASHBOARD                │
├─────────────────────────────────────┤
│  [Menu Lateral]                     │
│  ┌───────────────────────────────┐  │
│  │ 📊 Overview                   │  │
│  │ 🗄️  Database                  │  │
│  │    ├─ Tables                  │  │
│  │    ├─ Backups  ← AQUI!        │  │
│  │    └─ SQL Editor               │  │
│  │ 🔐 Authentication              │  │
│  │    └─ Users  ← Ou aqui!       │  │
│  │ 📁 Storage                     │  │
│  │ ⚙️  Settings                   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 🔍 Verificar Estado Atual (Antes de Restaurar)

Antes de restaurar, é bom verificar o estado atual:

1. Vá em **"SQL Editor"**
2. Execute:

```sql
-- Ver quantos perfis existem agora
SELECT COUNT(*) FROM profiles;

-- Ver se há referências órfãs
SELECT 
    (SELECT COUNT(*) FROM payments WHERE member_id NOT IN (SELECT id FROM profiles)) as orphaned_payments,
    (SELECT COUNT(*) FROM payment_proofs WHERE user_id NOT IN (SELECT id FROM profiles)) as orphaned_proofs;
```

## ⚠️ IMPORTANTE: Antes de Restaurar

- ✅ **Faça anotações** do que você quer recuperar
- ✅ **Verifique a data/hora** do backup que você vai restaurar
- ✅ **Entenda** que dados criados DEPOIS do backup serão perdidos
- ✅ **Tenha certeza** de que é o backup correto

## 💡 Dica: Testar em Desenvolvimento

Se você tiver um projeto de desenvolvimento/teste:
1. Teste a restauração lá primeiro
2. Veja como funciona
3. Depois faça no projeto de produção

## 📞 Precisa de Ajuda?

- **Documentação**: https://supabase.com/docs/guides/database/backups
- **Suporte**: No dashboard, procure por "Support" ou "Help"
- **Comunidade**: https://github.com/supabase/supabase/discussions

