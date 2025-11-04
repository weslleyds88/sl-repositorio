-- Script para adicionar campo de observação na tabela profiles
-- 
-- FUNCIONALIDADE: Permitir que administradores e atletas adicionem observações gerais no perfil
-- As observações podem ser editadas pelo próprio atleta ou pelo administrador
--
-- Data: 2025-01-27

-- Adicionar campo observation na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS observation TEXT;

COMMENT ON COLUMN profiles.observation IS 'Observação geral sobre o perfil do atleta, editável pelo atleta ou administrador';

-- Verificar se foi criado
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'observation';

