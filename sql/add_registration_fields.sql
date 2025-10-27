-- ============================================
-- Adicionar novos campos à tabela profiles
-- Data: 2025-01-27
-- ============================================

-- Adicionar coluna de data de nascimento
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Adicionar coluna de RG
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rg TEXT;

-- Adicionar coluna de região de SP
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Adicionar coluna de gênero
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Adicionar coluna de nome do responsável
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS responsible_name TEXT;

-- Adicionar coluna de telefone do responsável
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS responsible_phone TEXT;

-- ============================================
-- COMENTÁRIOS:
-- - birth_date: Data de nascimento (obrigatória no cadastro)
-- - rg: Número do RG (obrigatória no cadastro)
-- - region: Região de SP onde reside (obrigatória no cadastro)
-- - gender: Gênero (opcional no cadastro)
-- - responsible_name: Nome do responsável (opcional, para menores)
-- - responsible_phone: Telefone do responsável (opcional, para menores)
-- ============================================

-- Verificar as colunas criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('birth_date', 'rg', 'region', 'gender', 'responsible_name', 'responsible_phone')
ORDER BY ordinal_position;

