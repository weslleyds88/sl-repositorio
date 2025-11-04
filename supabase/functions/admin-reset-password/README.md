# Admin Reset Password - Supabase Edge Function

## Como usar

1. Instale o Supabase CLI:
```bash
npm install -g supabase
```

2. Faça login:
```bash
supabase login
```

3. Link seu projeto:
```bash
supabase link --project-ref seu-project-ref
```

4. Configure as secrets:
```bash
supabase secrets set SUPABASE_URL=https://seu-projeto.supabase.co
supabase secrets set SUPABASE_ANON_KEY=sua-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

5. Faça deploy:
```bash
supabase functions deploy admin-reset-password
```

## Endpoint

`POST https://seu-projeto.supabase.co/functions/v1/admin-reset-password`

Headers:
- `Authorization: Bearer {token-do-admin}`

Body:
```json
{
  "userId": "uuid-do-usuario"
}
```

