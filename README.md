# Codey — A Aventura de Aprender a Programar

Stack: React 18 + Vite + TypeScript + Tailwind + Framer Motion + Supabase.

## Rodar localmente
1. `npm install`
2. Copie `.env.example` para `.env` e preencha com a URL e a anon key do seu projeto Supabase (Settings > API).
3. `npm run dev` (abre em http://localhost:8080)

## Configurar seu Supabase
1. Crie um projeto em supabase.com.
2. Instale a CLI (`npm i -g supabase`), faça `supabase login` e `supabase link --project-ref SEU_PROJECT_ID` (atualize `supabase/config.toml`).
3. Crie o banco: `supabase db push` (aplica tudo em `supabase/migrations`).
4. Publique a função de admin: `supabase functions deploy admin-users`.
5. Em Authentication > Providers > Email, desative "Confirm email" se quiser cadastro sem confirmação.
6. Para virar admin, crie sua conta no app e rode no SQL Editor:
   `insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where email = 'SEU_EMAIL';`

## Deploy
Vercel/Netlify: build `npm run build`, pasta `dist`, e configure as mesmas variáveis `VITE_SUPABASE_*`. Adicione rewrite de SPA para `/index.html`.
