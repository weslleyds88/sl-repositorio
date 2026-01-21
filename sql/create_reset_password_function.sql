-- ============================================
-- Função SQL para Reset de Senha
-- ============================================
-- Esta função gera uma senha aleatória e marca o usuário
-- para trocar a senha no próximo login
-- ============================================

CREATE OR REPLACE FUNCTION reset_user_password(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_password TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  i INTEGER;
  user_email TEXT;
BEGIN
  -- Buscar email do usuário
  SELECT email INTO user_email
  FROM profiles
  WHERE id = target_user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Gerar senha aleatória de 12 caracteres
  new_password := '';
  FOR i IN 1..12 LOOP
    new_password := new_password || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  -- Marcar para troca obrigatória de senha
  UPDATE profiles 
  SET must_change_password = true
  WHERE id = target_user_id;

  -- Retornar a senha gerada
  -- NOTA: A senha precisa ser atualizada manualmente no auth.users
  -- ou via API Admin do Supabase
  RETURN new_password;
END;
$$;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION reset_user_password(UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION reset_user_password IS 'Gera uma senha aleatória e marca o usuário para trocar senha no próximo login. A senha retornada precisa ser aplicada manualmente no auth.users via API Admin.';
