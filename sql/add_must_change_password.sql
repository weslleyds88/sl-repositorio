ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.must_change_password IS 'Quando TRUE, o usuário deve trocar a senha no próximo login.';


