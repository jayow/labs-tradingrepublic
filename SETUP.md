# Trading Republic Labs — setup

A blog for `labs.tradingrepublic.io`. Public reads; invited authors write.
Next.js 16 (App Router) · Supabase (Auth + Postgres + Storage) · Tiptap.

## 1. Create the Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Project Settings → **API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret)
3. Copy `.env.example` to `.env.local` and fill those three, plus
   `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local dev.

## 2. Apply the database schema

Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql):

- **SQL editor:** paste the file's contents into Supabase → SQL Editor → Run.
- **or CLI:** `supabase link --project-ref <ref>` then `supabase db push`.

This creates the tables, RLS policies, triggers, and the `post-media`
storage bucket.

## 3. Configure Auth (invite-only)

In Supabase → Authentication:

- **Sign In / Providers → Email**: turn **OFF** "Allow new users to sign up"
  (authoring is invite-only; the only way in is an admin invite).
- **URL Configuration**:
  - Site URL: `http://localhost:3000` (dev) — later `https://labs.tradingrepublic.io`.
  - Redirect URLs: add `http://localhost:3000/auth/callback` (and the prod
    equivalent once deployed).

## 4. Bootstrap the first admin (one-time)

There's no admin yet to invite the first admin, so promote yourself once:

1. Invite/create your own user (Authentication → Users → Add user, or send
   yourself an invite), set a password, sign in once so the profile row exists.
2. In the SQL editor:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@tradingrepublic.io');
   ```

After this you can invite other authors from `/admin/authors`.

## 5. Run it

```bash
npm run dev
```

Open http://localhost:3000. Sign in at `/login`; author tools live at
`/dashboard`, admin at `/admin`.
