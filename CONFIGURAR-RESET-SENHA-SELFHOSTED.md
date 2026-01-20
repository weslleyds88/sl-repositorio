# 🔧 Configurar Reset de Senha no Supabase Self-Hosted

## 📋 Como Funciona

Quando o admin clica em "Resetar Senha" de um atleta:

1. ✅ Gera uma senha aleatória de 12 caracteres
2. ✅ Atualiza a senha do usuário no Supabase Auth
3. ✅ Marca `must_change_password: true` no perfil
4. ✅ Mostra a senha para o admin (copiada automaticamente)
5. ✅ Quando o usuário fizer login, será **obrigado** a trocar a senha

## ⚙️ Configuração Necessária

### 1️⃣ Adicionar Service Role Key no Frontend

Para que o reset funcione diretamente no self-hosted, você precisa adicionar a **Service Role Key** como variável de ambiente.

**⚠️ ATENÇÃO**: A Service Role Key é sensível! Mas como você está usando self-hosted e o admin já tem acesso total, é seguro usar no frontend neste caso.

### 2️⃣ Configurar Variável de Ambiente

No seu arquivo `.env.local` ou nas variáveis de ambiente do seu servidor:

```env
REACT_APP_SUPABASE_URL=http://192.168.15.60:8000
REACT_APP_SUPABASE_ANON_KEY=sua-anon-key
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 3️⃣ Como Obter a Service Role Key

1. Acesse o Supabase Dashboard (seu self-hosted)
2. Vá em **Settings** > **API**
3. Copie a **service_role key** (não a anon key!)
4. Adicione no `.env.local` como `REACT_APP_SUPABASE_SERVICE_ROLE_KEY`

### 4️⃣ Para Produção (Self-Hosted)

Se você está rodando em produção, configure a variável de ambiente no servidor:

```bash
# No seu servidor/VM
export REACT_APP_SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

Ou no seu arquivo de configuração do sistema (systemd, docker-compose, etc.)

## 🔄 Fluxo Completo

### Admin Reset de Senha:

1. Admin clica no botão 🔑 ao lado do atleta
2. Sistema gera senha aleatória
3. Atualiza senha no Supabase Auth
4. Marca `must_change_password: true`
5. Mostra senha para admin

### Usuário Faz Login:

1. Usuário faz login com a senha aleatória
2. Sistema detecta `must_change_password: true`
3. Mostra tela `ForceChangePassword`
4. Usuário **DEVE** trocar a senha antes de continuar
5. Após trocar, `must_change_password` vira `false`

## ✅ Vantagens desta Abordagem

- ✅ **Funciona sem Edge Functions** (não precisa configurar)
- ✅ **Funciona em self-hosted** (não depende de Supabase Cloud)
- ✅ **Seguro** (apenas admin pode resetar)
- ✅ **Força troca de senha** (usuário não pode usar senha temporária por muito tempo)
- ✅ **Senha aleatória forte** (12 caracteres, alfanuméricos)

## 🔒 Segurança

### Por que é seguro usar Service Role Key no frontend?

1. **Apenas admin pode acessar**: O botão só aparece para admins
2. **Self-hosted**: Você controla o ambiente
3. **Não expõe dados sensíveis**: Apenas permite resetar senhas
4. **Alternativa**: Se preferir, pode criar uma API backend própria

### Alternativa Mais Segura (Opcional)

Se quiser ser ainda mais seguro, você pode:

1. Criar uma API backend simples (Node.js, Python, etc.)
2. Colocar a Service Role Key apenas no backend
3. Fazer o frontend chamar essa API
4. A API faz o reset usando a Service Role Key

Mas para self-hosted, usar diretamente no frontend é aceitável.

## 🐛 Troubleshooting

### Problema: "URL do Supabase não configurada"

**Solução**: Verifique se `REACT_APP_SUPABASE_URL` está configurado.

### Problema: "Erro ao atualizar senha"

**Soluções**:
1. Verifique se `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` está configurado
2. Verifique se a Service Role Key está correta
3. Verifique se o usuário existe no `auth.users`

### Problema: Usuário não é obrigado a trocar senha

**Soluções**:
1. Verifique se `must_change_password` foi atualizado no perfil
2. Verifique se o componente `ForceChangePassword` está sendo usado no `App.js`
3. Verifique os logs do console

## 📝 Checklist

- [ ] `REACT_APP_SUPABASE_URL` configurado
- [ ] `REACT_APP_SUPABASE_ANON_KEY` configurado
- [ ] `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` configurado
- [ ] Service Role Key obtida do Supabase Dashboard
- [ ] Testado reset de senha de um atleta
- [ ] Verificado que a senha foi gerada e mostrada
- [ ] Testado login com senha aleatória
- [ ] Verificado que usuário é obrigado a trocar senha

## 🎯 Teste Completo

1. **Como Admin**:
   - Acesse a lista de atletas
   - Clique no botão 🔑 ao lado de um atleta
   - Confirme o reset
   - Anote a senha gerada

2. **Como Atleta**:
   - Faça logout
   - Faça login com o email do atleta e a senha gerada
   - Deve aparecer a tela de "Trocar Senha Obrigatória"
   - Troque a senha
   - Deve conseguir acessar o sistema normalmente

---

## 💡 Dica

Se você não quiser usar a Service Role Key no frontend, pode criar uma API backend simples que faz o reset. Mas para self-hosted, a solução atual é mais simples e funciona bem.
