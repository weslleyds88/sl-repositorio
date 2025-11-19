# 🔧 Modo de Manutenção - Guia de Uso

Este guia explica como ativar e desativar o modo de manutenção do sistema para realizar atualizações no banco de dados sem que usuários acessem o site.

---

## 📋 O que é o Modo de Manutenção?

O modo de manutenção é uma funcionalidade que:
- ✅ Bloqueia **TODOS** os acessos ao site
- ✅ Impede login de qualquer usuário (incluindo admins)
- ✅ Exibe uma tela amigável informando sobre a manutenção
- ✅ Pode ser ativado/desativado facilmente via variável de ambiente

---

## 🚀 Como Ativar o Modo de Manutenção

### Passo 1: Acessar Cloudflare Pages

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vá em **Pages** → Seu projeto **São Luiz Financeiro**
3. Clique em **Settings** (Configurações)

### Passo 2: Adicionar Variável de Ambiente

1. Na seção **Environment Variables**, clique em **Add variable**
2. Configure:
   - **Variable name**: `REACT_APP_MAINTENANCE_MODE`
   - **Value**: `true`
   - **Environment**: Selecione **Production** (e **Preview** se quiser testar antes)

3. Clique em **Save**

### Passo 3: Fazer Deploy

1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Selecione **Retry deployment** OU faça um novo commit/push

**OU** simplesmente faça um commit vazio:

```bash
git commit --allow-empty -m "Ativar modo de manutenção"
git push origin main
```

### Passo 4: Aguardar Deploy

- Aguarde o deploy completar (geralmente 2-5 minutos)
- O site agora mostrará a tela de manutenção para **TODOS** os usuários

---

## ✅ Como Desativar o Modo de Manutenção

### Opção 1: Via Cloudflare Dashboard (Recomendado)

1. Acesse **Cloudflare Pages** → Seu projeto → **Settings**
2. Encontre a variável `REACT_APP_MAINTENANCE_MODE`
3. Altere o valor de `true` para `false`
4. Clique em **Save**
5. Faça um novo deploy (ou retry do último)

### Opção 2: Via Git (Commit Vazio)

```bash
# Editar .env.example (opcional, apenas para documentação)
# Fazer commit vazio
git commit --allow-empty -m "Desativar modo de manutenção"
git push origin main
```

**⚠️ IMPORTANTE**: Certifique-se de que a variável `REACT_APP_MAINTENANCE_MODE` está como `false` no Cloudflare Pages antes de fazer o commit!

---

## 🧪 Como Testar Localmente

### Ativar Modo de Manutenção Localmente

1. Crie/edite o arquivo `.env.local` na raiz do projeto:

```env
REACT_APP_MAINTENANCE_MODE=true
```

2. Reinicie o servidor de desenvolvimento:

```bash
npm start
```

3. Acesse `http://localhost:3000` - você verá a tela de manutenção

### Desativar Modo de Manutenção Localmente

1. Remova a variável do `.env.local` ou altere para `false`:

```env
REACT_APP_MAINTENANCE_MODE=false
```

2. Reinicie o servidor:

```bash
npm start
```

---

## 📱 Como Fica a Tela de Manutenção

A tela exibe:
- ⚠️ Ícone de alerta
- 📝 Título: "Site em Manutenção"
- 💬 Mensagem explicativa
- ⏰ Informação sobre tempo estimado
- 🔄 Animação de loading

**Design**: Tela moderna, responsiva e amigável, seguindo o padrão visual do sistema.

---

## 🔒 Segurança

### O que é bloqueado em modo de manutenção:

- ❌ **TODAS** as rotas do sistema
- ❌ Página de login
- ❌ Página de registro
- ❌ API calls (não há tentativas de conexão)
- ❌ Autenticação (impossível fazer login)

### O que NÃO é bloqueado:

- ✅ A própria tela de manutenção (obviamente)
- ✅ Assets estáticos (CSS, JS, imagens)

---

## ⚡ Workflow Recomendado para Manutenção

### Antes da Manutenção:

1. ✅ **Avisar usuários** (se possível via WhatsApp/Email)
2. ✅ **Ativar modo de manutenção** no Cloudflare Pages
3. ✅ **Aguardar deploy** completar
4. ✅ **Verificar** que a tela de manutenção está aparecendo

### Durante a Manutenção:

1. ✅ **Realizar** as atualizações no banco de dados
2. ✅ **Testar** as mudanças (se possível em ambiente de desenvolvimento)
3. ✅ **Verificar** se tudo está funcionando

### Após a Manutenção:

1. ✅ **Desativar modo de manutenção** no Cloudflare Pages
2. ✅ **Fazer deploy** (ou retry)
3. ✅ **Aguardar deploy** completar
4. ✅ **Testar** login e funcionalidades principais
5. ✅ **Avisar usuários** que o sistema está de volta

---

## 🐛 Troubleshooting

### Problema: Tela de manutenção não aparece

**Soluções:**
1. Verifique se a variável `REACT_APP_MAINTENANCE_MODE` está como `true` no Cloudflare Pages
2. Verifique se o deploy foi completado com sucesso
3. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
4. Verifique os logs do deploy no Cloudflare Pages

### Problema: Usuários ainda conseguem acessar

**Soluções:**
1. Verifique se a variável está configurada para **Production** (não apenas Preview)
2. Aguarde alguns minutos para o cache do Cloudflare atualizar
3. Verifique se não há variáveis conflitantes

### Problema: Não consigo desativar

**Soluções:**
1. Certifique-se de alterar a variável para `false` (não apenas removê-la)
2. Faça um novo deploy após alterar a variável
3. Aguarde o deploy completar

---

## 📝 Variáveis de Ambiente

### Variável: `REACT_APP_MAINTENANCE_MODE`

- **Tipo**: String (boolean)
- **Valores aceitos**: `"true"` ou `"false"`
- **Padrão**: `false` (se não definida)
- **Escopo**: Production, Preview, Development

### Exemplo de Configuração no Cloudflare Pages:

```
Variable name: REACT_APP_MAINTENANCE_MODE
Value: true
Environment: Production
```

---

## 🔄 Rollback Rápido

Se algo der errado e você precisar reverter rapidamente:

1. **Cloudflare Dashboard** → **Pages** → **Deployments**
2. Encontre o deploy **anterior** ao modo de manutenção
3. Clique nos **3 pontos** → **Retry deployment**
4. Aguarde o deploy completar

**OU**

1. Altere `REACT_APP_MAINTENANCE_MODE` para `false`
2. Faça um commit vazio e push:

```bash
git commit --allow-empty -m "Rollback: desativar manutenção"
git push origin main
```

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do Cloudflare Pages
2. Verifique o console do navegador (F12)
3. Teste localmente primeiro com `.env.local`

---

**Última atualização**: 2025-01-XX
**Versão**: 1.0.0

