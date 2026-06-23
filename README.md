# Trading Republic Labs

The blog for `labs.tradingrepublic.io`. Public reads; invited authors write with
a rich editor (formatting, image uploads, YouTube embeds).

- **Framework:** Next.js 16 (App Router, TypeScript) on Vercel
- **Backend:** Supabase — Auth, Postgres, Storage
- **Editor:** Tiptap (rich text) with server-side sanitized rendering
- **UI:** Tailwind CSS v4 + shadcn/ui, Trading Republic dark/gold theme

## Getting started

See [SETUP.md](SETUP.md) for full setup (Supabase project, env keys, running the
migration, bootstrapping the first admin, and deploying).

```bash
npm install
cp .env.example .env.local   # fill in your Supabase keys
npm run dev
```

## How it works

- **Auth** (`utils/supabase/`, `proxy.ts`, `lib/auth.ts`): `@supabase/ssr` with a
  per-request server client; the root `proxy.ts` (Next 16's renamed middleware)
  refreshes the session and gates `/dashboard` and `/admin`. RLS in Postgres is
  the real security boundary.
- **Roles:** `admin` and `author`. Public signup is off; admins invite authors
  from `/admin/authors`.
- **Editor** (`components/editor/`, `lib/tiptap/extensions.ts`): one shared,
  React-free extension list powers both the client editor and the server
  renderer. Posts are stored as Tiptap JSON; on publish they're rendered to
  sanitized HTML (`lib/sanitize.ts`) and cached in `posts.content_html`.
- **Public pages** (`app/(public)/`): a cookie-less Supabase client keeps them
  statically cacheable (ISR), refreshed on publish via `revalidatePath`.

## Structure

```
app/(public)/        home, /posts/[slug], /authors/[id], /tags/[slug]
app/dashboard/       author tools (list, editor) — auth-gated
app/admin/           invite, roles, moderation — admin-gated
app/auth/            callback + signout route handlers
utils/supabase/      client / server / public / admin / proxy helpers
lib/                 auth DAL, tiptap extensions, sanitize, slug, types
supabase/migrations/ schema, RLS, triggers, storage bucket
```
