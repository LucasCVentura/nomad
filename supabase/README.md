# Configurando o Supabase

1. Crie o projeto em https://supabase.com/dashboard.
2. Vá em **SQL Editor** → cole todo o conteúdo de `schema.sql` → **Run**.
3. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**
4. Copie `.env.local.example` pra `.env.local` na raiz do projeto e preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Reinicie o `npm run dev`.
6. Crie a conta da Dra. Nathalia normalmente pelo `/registro` do site.
7. Torne essa conta admin: no **SQL Editor**, rode (trocando pelo e-mail real):
   ```sql
   update public.profiles set is_admin = true where id = (
     select id from auth.users where email = 'nathalia@exemplo.com'
   );
   ```
8. Pronto — essa conta já enxerga `/admin`.

**Confirmação de e-mail**: por padrão o Supabase exige confirmar o e-mail
antes do primeiro login. Pra testar mais rápido em desenvolvimento, em
**Authentication → Providers → Email**, desative "Confirm email"
temporariamente (reative antes de ir pra produção).
