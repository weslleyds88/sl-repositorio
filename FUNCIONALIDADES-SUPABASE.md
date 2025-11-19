# Funcionalidades do Supabase Utilizadas no Projeto

## 📋 Resumo Executivo

Este documento lista **TODAS** as funcionalidades do Supabase que estão sendo utilizadas no projeto **São Luiz Financeiro**.

---

## 🔐 1. AUTENTICAÇÃO (Auth)

### 1.1. Login e Sessão
- **`supabase.auth.signInWithPassword()`** - Login com email/senha
  - Localização: `src/components/Login.js`
  - Uso: Autenticação de usuários

- **`supabase.auth.setSession()`** - Definir sessão manualmente
  - Localização: `src/components/Login.js`
  - Uso: Restaurar sessão após verificação OTP

- **`supabase.auth.getSession()`** - Obter sessão atual
  - Localização: 
    - `src/components/Members.js`
    - `src/components/AthleteProfile.js`
    - `src/components/ResetPassword.js`
    - `src/contexts/AuthContext.js`
  - Uso: Verificar se usuário está autenticado

- **`supabase.auth.refreshSession()`** - Atualizar token de sessão
  - Localização: `src/components/Members.js`
  - Uso: Renovar token expirado

- **`supabase.auth.getUser()`** - Obter dados do usuário autenticado
  - Localização:
    - `src/contexts/AuthContext.js`
    - `src/components/GroupMembers.js`
    - `supabase/functions/admin-reset-password/index.ts`
  - Uso: Obter informações do usuário logado

- **`supabase.auth.onAuthStateChange()`** - Listener de mudanças de autenticação
  - Localização: `src/components/ResetPassword.js`
  - Uso: Detectar mudanças no estado de autenticação

### 1.2. Registro
- **`supabase.auth.signUp()`** - Criar nova conta
  - Localização: 
    - `src/components/Register.js`
    - `scripts/migrate-data.js`
  - Uso: Cadastro de novos atletas

### 1.3. Verificação e Recuperação
- **`supabase.auth.verifyOtp()`** - Verificar código OTP
  - Localização: `src/components/Login.js`
  - Uso: Verificação de email/telefone

- **`supabase.auth.resend()`** - Reenviar código de verificação
  - Localização: `src/components/Login.js`
  - Uso: Reenviar OTP

### 1.4. Atualização de Perfil
- **`supabase.auth.updateUser()`** - Atualizar dados do usuário
  - Localização:
    - `src/components/ForceChangePassword.js`
    - `src/components/AthleteProfile.js`
    - `src/components/ResetPassword.js`
  - Uso: Alterar senha do usuário

### 1.5. Logout
- **`supabase.auth.signOut()`** - Encerrar sessão
  - Localização:
    - `src/components/Login.js`
    - `src/components/ResetPassword.js`
    - `src/contexts/AuthContext.js`
  - Uso: Deslogar usuário

### 1.6. Admin API (Service Role)
- **`supabaseAdmin.auth.admin.getUserById()`** - Buscar usuário por ID (admin)
  - Localização: `supabase/functions/admin-reset-password/index.ts`
  - Uso: Buscar usuário para reset de senha

- **`supabaseAdmin.auth.admin.listUsers()`** - Listar todos os usuários (admin)
  - Localização: 
    - `supabase/functions/admin-reset-password/index.ts`
    - `scripts/fix-missing-profiles.js`
  - Uso: Buscar usuários quando ID não funciona

- **`supabaseAdmin.auth.admin.updateUserById()`** - Atualizar usuário (admin)
  - Localização: `supabase/functions/admin-reset-password/index.ts`
  - Uso: Resetar senha de atleta

---

## 🗄️ 2. BANCO DE DADOS (Database / Postgres)

### 2.1. Operações CRUD Básicas

#### SELECT (Consultas)
- **`supabase.from('profiles').select()`** - Consultar perfis
  - Localização: Múltiplos arquivos
  - Uso: Listar atletas, buscar perfis, verificar roles

- **`supabase.from('payments').select()`** - Consultar pagamentos
  - Localização: `src/adapters/supabaseAdapter.js`
  - Uso: Listar pagamentos com filtros

- **`supabase.from('payment_proofs').select()`** - Consultar comprovantes
  - Localização: `src/components/PaymentProofReview.js`
  - Uso: Buscar comprovantes pendentes

- **`supabase.from('notifications').select()`** - Consultar notificações
  - Localização: `src/components/Notifications.js`
  - Uso: Listar notificações do usuário

- **`supabase.from('user_groups').select()`** - Consultar grupos
  - Localização: `src/adapters/supabaseAdapter.js`
  - Uso: Buscar grupos de usuários

#### INSERT (Inserções)
- **`supabase.from('profiles').insert()`** - Criar perfil
  - Localização:
    - `src/components/Register.js`
    - `src/adapters/supabaseAdapter.js`
  - Uso: Cadastrar novo atleta

- **`supabase.from('payments').insert()`** - Criar pagamento
  - Localização: `src/adapters/supabaseAdapter.js`
  - Uso: Adicionar nova cobrança

- **`supabase.from('payment_proofs').insert()`** - Criar comprovante
  - Localização: `src/components/PaymentProofModal.js`
  - Uso: Enviar comprovante de pagamento

- **`supabase.from('notifications').insert()`** - Criar notificação
  - Localização:
    - `src/components/PaymentProofModal.js`
    - `src/components/PaymentProofReview.js`
  - Uso: Notificar usuários sobre eventos

#### UPDATE (Atualizações)
- **`supabase.from('profiles').update()`** - Atualizar perfil
  - Localização:
    - `src/components/Register.js`
    - `src/adapters/supabaseAdapter.js`
    - `supabase/functions/admin-reset-password/index.ts`
  - Uso: Editar dados do atleta, marcar `must_change_password`

- **`supabase.from('payments').update()`** - Atualizar pagamento
  - Localização:
    - `src/adapters/supabaseAdapter.js`
    - `src/components/PaymentProofReview.js`
  - Uso: Marcar como pago, atualizar valores parciais

- **`supabase.from('payment_proofs').update()`** - Atualizar comprovante
  - Localização: `src/components/PaymentProofReview.js`
  - Uso: Aprovar/rejeitar comprovante

- **`supabase.from('notifications').update()`** - Atualizar notificação
  - Localização: `src/components/Notifications.js`
  - Uso: Marcar como lida

#### DELETE (Exclusões)
- **`supabase.from('payment_proofs').delete()`** - Excluir comprovante
  - Localização: `src/adapters/supabaseAdapter.js`
  - Uso: Limpar comprovantes antes de excluir pagamento

- **`supabase.from('payments').delete()`** - Excluir pagamento
  - Localização: `src/adapters/supabaseAdapter.js`
  - Uso: Remover cobrança

### 2.2. Filtros e Consultas Avançadas

#### Filtros
- **`.eq()`** - Igualdade
  - Uso: Filtrar por ID, status, role, etc.

- **`.in()`** - Lista de valores
  - Localização: `src/adapters/supabaseAdapter.js`
  - Uso: Atualizar múltiplos pagamentos

- **`.gte()` / `.lte()`** - Maior/menor ou igual
  - Localização: `src/adapters/supabaseAdapter.js`
  - Uso: Filtrar por intervalo de datas

- **`.order()`** - Ordenação
  - Uso: Ordenar por data, nome, etc.

- **`.limit()`** - Limitar resultados
  - Localização: `src/components/Notifications.js`
  - Uso: Paginação

- **`.single()`** - Retornar único resultado
  - Uso: Buscar registro específico

#### Joins e Relacionamentos
- **`.select('*, user_groups(name)')`** - Join com tabela relacionada
  - Localização: `src/adapters/supabaseAdapter.js`
  - Uso: Buscar pagamentos com nome do grupo

- **`.select('*, user_group_members!left(user_groups(*))')`** - Join complexo
  - Localização: `src/adapters/supabaseAdapter.js`
  - Uso: Buscar membros com seus grupos

### 2.3. Funções Armazenadas (RPC)
- **`supabase.rpc('get_all_tickets')`** - Buscar todos os tickets
  - Localização: `src/components/PaymentTickets.js`
  - Uso: Listar tickets para admin

- **`supabase.rpc('get_user_tickets')`** - Buscar tickets do usuário
  - Localização: `src/components/PaymentTickets.js`
  - Uso: Listar tickets do atleta

- **`supabase.rpc('create_notifications_table_if_not_exists')`** - Criar tabela de notificações
  - Localização: `src/components/Notifications.js`
  - Uso: Inicializar tabela se não existir

- **`supabase.rpc('cleanup_old_notifications')`** - Limpar notificações antigas
  - Localização: `src/components/NotificationCleanup.js`
  - Uso: Manutenção do banco

- **`supabase.rpc('cleanup_very_old_notifications')`** - Limpar notificações muito antigas
  - Localização: `src/components/NotificationCleanup.js`
  - Uso: Limpeza agressiva

- **`supabase.rpc('exec_sql')`** - Executar SQL customizado
  - Localização: `scripts/setup-supabase.js`
  - Uso: Setup inicial do banco

---

## ⚡ 3. EDGE FUNCTIONS

### 3.1. Funções Deployadas
- **`admin-reset-password`** - Resetar senha de atleta
  - Localização: `supabase/functions/admin-reset-password/index.ts`
  - Endpoint: `https://wgaqgsblpersthvytcif.supabase.co/functions/v1/admin-reset-password`
  - Uso: Admin pode resetar senha de qualquer atleta
  - Funcionalidades:
    - Verifica se usuário é admin
    - Busca usuário no auth.users
    - Gera senha aleatória
    - Atualiza senha via Admin API
    - Marca `must_change_password = true`

---

## 📦 4. STORAGE (Armazenamento de Arquivos)

### 4.1. Status Atual
- **NÃO está sendo usado ativamente** no código atual
- Comprovantes são salvos como **base64 no banco de dados** (coluna `proof_image_base64`)
- Há referências a URLs de storage em `src/utils/fixProofUrls.js`, mas são para correção de dados antigos

### 4.2. Referências Encontradas
- **URL de Storage**: `https://wgaqgsblpersthvytcif.supabase.co/storage/v1/object/public/payment-proofs/...`
  - Localização: `src/utils/fixProofUrls.js`
  - Uso: Correção de URLs malformadas (legado)

---

## 🔄 5. CONFIGURAÇÕES DO CLIENTE

### 5.1. Configurações de Autenticação
```javascript
{
  auth: {
    persistSession: true,        // Persistir sessão no localStorage
    autoRefreshToken: true,       // Renovar token automaticamente
    storageKey: 'sao-luiz-auth', // Chave única para storage
    detectSessionInUrl: true      // Detectar sessão na URL (OTP)
  }
}
```
- Localização: `src/lib/supabaseClient.js`

### 5.2. Headers Globais
```javascript
{
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
}
```
- Localização: `src/lib/supabaseClient.js`

---

## 📊 6. TABELAS UTILIZADAS

### 6.1. Tabelas Principais
1. **`profiles`** - Perfis de usuários (atletas e admins)
   - Campos principais: `id`, `email`, `full_name`, `phone`, `role`, `status`, `account_status`, `must_change_password`, `birth_date`, `rg`, `region`, `gender`, `position`, `responsible_name`, `responsible_phone`, `avatar_url`, `observation`

2. **`payments`** - Pagamentos/Cobranças
   - Campos principais: `id`, `member_id`, `group_id`, `amount`, `paid_amount`, `category`, `status`, `due_date`, `paid_at`, `observation`, `pix_key`, `pix_name`

3. **`payment_proofs`** - Comprovantes de pagamento
   - Campos principais: `id`, `payment_id`, `user_id`, `proof_image_base64`, `proof_file_url`, `storage_method`, `proof_amount`, `payment_method`, `status`, `observation`, `rejection_reason`

4. **`notifications`** - Notificações do sistema
   - Campos principais: `id`, `user_id`, `title`, `message`, `type`, `read`/`is_read`, `created_at`

5. **`user_groups`** - Grupos de usuários
   - Campos principais: `id`, `name`, `type`, `description`

6. **`user_group_members`** - Membros dos grupos
   - Campos principais: `group_id`, `user_id`, `joined_at`

7. **`payment_tickets`** - Tickets de pagamento (gerados automaticamente)
   - Campos principais: `id`, `payment_id`, `proof_id`, `user_id`, `amount`, `expires_at`, `status`

---

## 🚫 7. FUNCIONALIDADES NÃO UTILIZADAS

### 7.1. Realtime (Subscriptions)
- **Status**: ❌ Não utilizado
- **Motivo**: Sistema não requer atualizações em tempo real
- **Alternativa**: Refresh manual via `onRefresh()`

### 7.2. Storage Ativo
- **Status**: ❌ Não utilizado ativamente
- **Motivo**: Comprovantes são salvos como base64 no banco
- **Observação**: Há infraestrutura preparada, mas não está em uso

### 7.3. Row Level Security (RLS)
- **Status**: ⚠️ Não verificado explicitamente no código
- **Observação**: Pode estar configurado no banco, mas não há referências no código

---

## 📈 8. ESTATÍSTICAS DE USO

### 8.1. Métodos Mais Utilizados
1. **`.from().select()`** - ~50+ ocorrências
2. **`.from().insert()`** - ~20+ ocorrências
3. **`.from().update()`** - ~30+ ocorrências
4. **`.auth.signInWithPassword()`** - ~5 ocorrências
5. **`.auth.getUser()`** - ~10 ocorrências

### 8.2. Tabelas Mais Acessadas
1. **`profiles`** - Perfis de usuários
2. **`payments`** - Pagamentos
3. **`payment_proofs`** - Comprovantes
4. **`notifications`** - Notificações

---

## 🔧 9. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
REACT_APP_SUPABASE_URL=https://wgaqgsblpersthvytcif.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (apenas para Edge Functions)
```

---

## 📝 10. RESUMO POR ARQUIVO

### Arquivos que usam Supabase Auth:
- `src/components/Login.js`
- `src/components/Register.js`
- `src/components/ResetPassword.js`
- `src/components/ForceChangePassword.js`
- `src/components/AthleteProfile.js`
- `src/contexts/AuthContext.js`
- `src/components/Members.js`
- `src/components/GroupMembers.js`

### Arquivos que usam Supabase Database:
- `src/adapters/supabaseAdapter.js` (principal)
- `src/components/Members.js`
- `src/components/Payments.js`
- `src/components/PaymentForm.js`
- `src/components/PaymentProofModal.js`
- `src/components/PaymentProofReview.js`
- `src/components/PaymentTickets.js`
- `src/components/Notifications.js`
- `src/components/NotificationCleanup.js`
- `src/components/Register.js`
- `src/components/AdminPanel.js`
- `src/components/AdminPanelClean.js`

### Arquivos que usam Supabase Edge Functions:
- `src/components/Members.js` (chama `admin-reset-password`)

### Scripts que usam Supabase:
- `scripts/setup-supabase.js`
- `scripts/fix-missing-profiles.js`
- `scripts/migrate-data.js`

---

## ✅ 11. CHECKLIST DE FUNCIONALIDADES

- [x] Autenticação (Login, Registro, Logout)
- [x] Gerenciamento de Sessão
- [x] Admin API (Reset de Senha)
- [x] CRUD Completo (Create, Read, Update, Delete)
- [x] Consultas com Filtros Avançados
- [x] Joins e Relacionamentos
- [x] Funções Armazenadas (RPC)
- [x] Edge Functions
- [ ] Storage (preparado, mas não usado)
- [ ] Realtime Subscriptions
- [ ] Row Level Security (não verificado no código)

---

## 📚 12. DOCUMENTAÇÃO DE REFERÊNCIA

- **Supabase Auth**: https://supabase.com/docs/reference/javascript/auth-api
- **Supabase Database**: https://supabase.com/docs/reference/javascript/select
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Supabase Storage**: https://supabase.com/docs/reference/javascript/storage-api

---

**Última atualização**: 2025-01-XX
**Versão do Supabase JS**: `@supabase/supabase-js@2.38.0`

