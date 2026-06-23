-- Trading Republic Labs — initial schema, RLS, storage.
-- Run in the Supabase SQL editor, or via `supabase db push` once linked.

-- ============================================================
-- Enums
-- ============================================================
create type public.user_role as enum ('admin', 'author');
create type public.post_status as enum ('draft', 'published');

-- ============================================================
-- Tables
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'author',
  display_name text,
  bio text,
  avatar_url text,
  twitter text,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  slug text not null unique,
  excerpt text,
  cover_image_url text,
  content_json jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  content_html text,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_status_published_at_idx
  on public.posts (status, published_at desc);
create index posts_author_id_idx on public.posts (author_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index post_tags_tag_id_idx on public.post_tags (tag_id);

-- ============================================================
-- Helper: is_admin()  (SECURITY DEFINER avoids RLS recursion on profiles)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Trigger: auto-create a profile row when an auth user is created
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Trigger: only admins (or the service role) may change a profile's role
-- ============================================================
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Only admins can change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ============================================================
-- Trigger: keep posts.updated_at fresh
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;

-- profiles: world-readable (needed for bylines / author pages)
create policy "profiles are public"
  on public.profiles for select
  using (true);

-- profiles: a user may update their own row (role change blocked by trigger)
create policy "users update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- posts: public sees published; authors see their own; admins see all
create policy "read published or own or admin"
  on public.posts for select
  using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_admin()
  );

create policy "authors insert own posts"
  on public.posts for insert to authenticated
  with check (author_id = auth.uid());

create policy "authors update own or admin"
  on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "authors delete own or admin"
  on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- tags: public read; any authenticated author may create
create policy "tags are public"
  on public.tags for select
  using (true);

create policy "authenticated create tags"
  on public.tags for insert to authenticated
  with check (true);

-- post_tags: public read; write only when the caller owns the parent post
create policy "post_tags are public"
  on public.post_tags for select
  using (true);

create policy "manage tags of own posts (insert)"
  on public.post_tags for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and (p.author_id = auth.uid() or public.is_admin())
    )
  );

create policy "manage tags of own posts (delete)"
  on public.post_tags for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and (p.author_id = auth.uid() or public.is_admin())
    )
  );

-- ============================================================
-- Storage: post-media bucket (public read, per-author write)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "post-media public read"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "post-media author insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "post-media author update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'post-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "post-media author delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
