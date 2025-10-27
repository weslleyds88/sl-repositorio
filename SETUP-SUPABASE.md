# 🔧 Configuração do Supabase - SÃO LUIZ - NOVO SISTEMA

## 🚀 **ATUALIZAÇÃO: Novo Sistema Completo Implementado!**

O sistema foi **completamente atualizado** com as funcionalidades solicitadas:

### ✅ **Novas Funcionalidades:**
- **👤 Sistema de Usuários** com login individual
- **🏗️ Grupos** para organização (Mensalistas, Campeonatos, etc.)
- **💳 Cobranças por Grupo** com PIX
- **📎 Upload de Comprovantes** pelos atletas
- **✅ Aprovação de Pagamentos** pelos admins
- **📱 Notificações** em tempo real

## 📋 **Para Usar o NOVO Sistema:**

### **1️⃣ Executar Migração CORRIGIDA**
```bash
# Script automático (recomendado):
./fixed-migration.sh

# OU manualmente:
# 1. Execute sql/fixed-migration-sao-luiz.sql no Supabase Dashboard
# 2. Execute: npm run migrate
```

### **2️⃣ Login Admin**
- **Email:** admin@saoluiz.com
- **Senha:** admin123
- **⚠️ ALTERE A SENHA APÓS PRIMEIRO LOGIN!**

## 🔧 **CORREÇÕES IMPLEMENTADAS:**

### **❌ Problema Anterior:**
- Script tentava criar tabela `payments` nova
- Erro: `column "group_id" does not exist`
- Perdia dados existentes

### **✅ Solução Atual:**
- **ADICIONA** colunas nas tabelas existentes
- **CRIA** novas tabelas separadamente
- **PRESERVA** todos os dados atuais
- **MIGRA** dados de forma segura

## 📊 **O que Acontece na Migração:**

### **Antes:**
```
members (id, name, phone, observation)
payments (id, member_id, amount, category, due_date, status)
```

### **Depois:**
```
members (id, name, phone, observation, email, position, role, status)
payments (id, member_id, amount, category, due_date, status, title, group_id, pix_key)
profiles (id, email, full_name, phone, position, role, status)
user_groups (id, name, description, type, created_by)
user_group_members (user_id, group_id)
payment_proofs (id, payment_id, user_id, proof_file_url, status)
notifications (id, user_id, title, message, type)
```

## 🎯 **Funcionalidades Implementadas:**

### **Para Admins:**
- ✅ Criar e gerenciar grupos
- ✅ Lançar cobranças por grupo
- ✅ Ver todos os pagamentos
- ✅ Aprovar/reprovar comprovantes
- ✅ Enviar mensagens de reprovação
- ✅ Ver logs do sistema

### **Para Atletas:**
- ✅ Login individual
- ✅ Ver apenas cobranças dos seus grupos
- ✅ Upload de comprovantes
- ✅ Acompanhar status dos pagamentos
- ✅ Receber notificações

## 🚨 **IMPORTANTE:**
1. **FAÇA BACKUP** antes da migração
2. **Execute os scripts na ordem** indicada
3. **Altere a senha do admin** após primeiro login
4. **Teste tudo** antes de usar em produção

**🎉 Sistema corrigido e pronto para as funcionalidades avançadas do São Luiz!**
