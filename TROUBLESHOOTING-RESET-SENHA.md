# 🔧 Troubleshooting: Erro ao Resetar Senha

## ❌ Erro: "invalid JWT: unable to parse or verify signature"

Este erro significa que a **Service Role Key** não está sendo lida corretamente ou está no formato incorreto.

## ✅ Soluções

### 1️⃣ Verificar se a variável está no `.env.local`

Certifique-se de que o arquivo `.env.local` existe na raiz do projeto e contém:

```env
REACT_APP_SUPABASE_URL=https://api.meu-servidor.org
REACT_APP_SUPABASE_ANON_KEY=sua-anon-key
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 2️⃣ Verificar formato da Service Role Key

A Service Role Key deve ser um JWT válido com **3 partes** separadas por ponto (`.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnYXFnc2JscGVyc3Rodnl0Y2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTIwNCwiZXhwIjoyMDc2NzQxMjA0fQ.xxxxx
```

**Formato correto**: `parte1.parte2.parte3`

### 3️⃣ Verificar se não há espaços extras

A Service Role Key **NÃO deve ter**:
- Espaços no início ou fim
- Quebras de linha
- Aspas (a menos que estejam no arquivo .env)

**Exemplo ERRADO**:
```env
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=" eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... "
```

**Exemplo CORRETO**:
```env
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4️⃣ Reiniciar o servidor após mudanças

Após alterar o `.env.local`, você **DEVE** reiniciar o servidor:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente
npm start
```

### 5️⃣ Verificar no console do navegador

Abra o console do navegador (F12) e procure por:

```
🔍 Debug - Service Role Key presente: true/false
🔍 Debug - Service Role Key length: XXX
🔍 Debug - Service Role Key preview: eyJhbGciOiJIUzI1NiIs...
```

Se aparecer `false` ou `length: 0`, a variável não está sendo lida.

### 6️⃣ Como obter a Service Role Key correta

1. Acesse o Supabase Dashboard (seu self-hosted)
2. Vá em **Settings** > **API**
3. Procure por **"service_role"** (não "anon")
4. Copie a chave **COMPLETA** (deve começar com `eyJ...`)
5. Cole no `.env.local` **SEM aspas** e **SEM espaços**

### 7️⃣ Verificar se o arquivo `.env.local` está no lugar certo

O arquivo deve estar na **raiz do projeto**, no mesmo nível que `package.json`:

```
São Luiz Financeiro/
├── .env.local          ← AQUI!
├── package.json
├── src/
└── ...
```

### 8️⃣ Se ainda não funcionar

Tente usar a variável diretamente no código (apenas para teste):

```javascript
// TEMPORÁRIO - apenas para testar
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Cole sua key aqui
```

Se funcionar assim, o problema é na leitura do `.env.local`.

## 🔍 Checklist de Verificação

- [ ] Arquivo `.env.local` existe na raiz do projeto
- [ ] `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` está definida
- [ ] Service Role Key não tem espaços extras
- [ ] Service Role Key não tem aspas (ou tem aspas corretas)
- [ ] Service Role Key tem 3 partes separadas por ponto
- [ ] Servidor foi reiniciado após alterar `.env.local`
- [ ] Console mostra "Service Role Key presente: true"
- [ ] Service Role Key começa com `eyJ`

## 📝 Exemplo de `.env.local` correto

```env
REACT_APP_DB_MODE=supabase
REACT_APP_SUPABASE_URL=https://api.meu-servidor.org
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnYXFnc2JscGVyc3Rodnl0Y2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyMDQsImV4cCI6MjA3Njc0MTIwNH0.KSgtRaZHayjs1TGFQv1tRd5_TgYFqtXect66bjgdgVc
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnYXFnc2JscGVyc3Rodnl0Y2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE2NTIwNCwiZXhwIjoyMDc2NzQxMjA0fQ.xxxxx
```

## 🆘 Se nada funcionar

1. Verifique os logs do console do navegador
2. Verifique se a Service Role Key está correta no Supabase Dashboard
3. Tente gerar uma nova Service Role Key no Supabase
4. Verifique se o Supabase self-hosted está configurado corretamente
