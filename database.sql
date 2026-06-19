-- ============================================================================
-- DESILEAKS - Complete database schema for Supabase
-- One-shot SQL: tables, types, functions, triggers, RLS policies,
-- storage buckets, and storage policies.
--
-- Run this entire file once on a fresh Supabase project (SQL editor).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------------

-- profiles
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- user_roles
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  image_url text,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

-- videos
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'General',
  video_url text not null,
  thumbnail_url text,
  thumbnail_34_url text,
  duration text,
  views bigint default 0,
  is_primary boolean not null default false,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.videos to anon, authenticated;
grant insert, update, delete on public.videos to authenticated;
grant all on public.videos to service_role;
alter table public.videos enable row level security;

-- ---------------------------------------------------------------------------
-- 3. FUNCTIONS
-- ---------------------------------------------------------------------------

-- role checker (SECURITY DEFINER to avoid recursive RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

-- increment view count
create or replace function public.increment_video_views(_video_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.videos set views = coalesce(views, 0) + 1 where id = _video_id;
end; $$;

-- updated_at trigger
create or replace function public.update_videos_updated_at()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- profile + default role on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user')
    on conflict do nothing;
  return new;
end; $$;

-- slug generator
create or replace function public.generate_video_slug()
returns trigger
language plpgsql set search_path = public as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  if new.slug is not null and new.slug <> '' then
    if tg_op = 'UPDATE' and old.title = new.title then return new; end if;
  end if;
  base_slug := lower(regexp_replace(regexp_replace(new.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug || '-' || substring(new.id::text, 1, 8);
  while exists(select 1 from public.videos where slug = final_slug and id != new.id) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || substring(new.id::text, 1, 8) || '-' || counter;
  end loop;
  new.slug := final_slug;
  return new;
end; $$;

-- ---------------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists trg_videos_updated_at on public.videos;
create trigger trg_videos_updated_at
  before update on public.videos
  for each row execute function public.update_videos_updated_at();

drop trigger if exists trg_videos_slug on public.videos;
create trigger trg_videos_slug
  before insert or update on public.videos
  for each row execute function public.generate_video_slug();

-- ---------------------------------------------------------------------------
-- 5. RLS POLICIES
-- ---------------------------------------------------------------------------

-- profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- user_roles
drop policy if exists "Users can view their own roles" on public.user_roles;
create policy "Users can view their own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Only admins can insert roles" on public.user_roles;
create policy "Only admins can insert roles" on public.user_roles
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Only admins can update roles" on public.user_roles;
create policy "Only admins can update roles" on public.user_roles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Only admins can delete roles" on public.user_roles;
create policy "Only admins can delete roles" on public.user_roles
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- categories (public read, admin write)
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone" on public.categories
  for select using (true);
drop policy if exists "Only admins can insert categories" on public.categories;
create policy "Only admins can insert categories" on public.categories
  for insert with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Only admins can update categories" on public.categories;
create policy "Only admins can update categories" on public.categories
  for update using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Only admins can delete categories" on public.categories;
create policy "Only admins can delete categories" on public.categories
  for delete using (public.has_role(auth.uid(), 'admin'));

-- videos (public read, admin write)
drop policy if exists "Videos are viewable by everyone" on public.videos;
create policy "Videos are viewable by everyone" on public.videos
  for select using (true);
drop policy if exists "Only admins can upload videos" on public.videos;
create policy "Only admins can upload videos" on public.videos
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Only admins can update videos" on public.videos;
create policy "Only admins can update videos" on public.videos
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Only admins can delete videos" on public.videos;
create policy "Only admins can delete videos" on public.videos
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 6. STORAGE BUCKETS
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('videos', 'videos', true),
  ('thumbnails', 'thumbnails', true),
  ('category-images', 'category-images', true)
on conflict (id) do nothing;

-- Storage policies: public read for all three buckets, admin-only write.
drop policy if exists "Public can read media" on storage.objects;
create policy "Public can read media" on storage.objects
  for select using (bucket_id in ('videos', 'thumbnails', 'category-images'));

drop policy if exists "Admins can upload media" on storage.objects;
create policy "Admins can upload media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('videos', 'thumbnails', 'category-images')
    and public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "Admins can update media" on storage.objects;
create policy "Admins can update media" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('videos', 'thumbnails', 'category-images')
    and public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('videos', 'thumbnails', 'category-images')
    and public.has_role(auth.uid(), 'admin')
  );

-- ---------------------------------------------------------------------------
-- 7. HOW TO PROMOTE A USER TO ADMIN
-- ---------------------------------------------------------------------------
-- After signing up, run (replace email):
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com'
--   on conflict do nothing;
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 8. DYNAMIC SITEMAP (auto-updates as videos are uploaded)
-- ---------------------------------------------------------------------------
-- Returns a full sitemap.xml string. Call it from anywhere:
--   GET  https://<project>.supabase.co/rest/v1/rpc/generate_sitemap
--        ?apikey=<anon-key>
-- Or POST to the same URL. Hook your host (Netlify/Vercel/Cloudflare) to
-- proxy /sitemap.xml -> this RPC endpoint. The function regenerates on
-- every call, so every new video appears the next time Google crawls.

create or replace function public.generate_sitemap(site_url text default 'https://desileaks.live')
returns text
language plpgsql stable security invoker set search_path = public as $$
declare
  xml text;
  today text := to_char(now(), 'YYYY-MM-DD');
begin
  xml := '<?xml version="1.0" encoding="UTF-8"?>' || E'\n'
      || '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
      || 'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">' || E'\n';

  xml := xml
    || '<url><loc>' || site_url || '/</loc><lastmod>' || today
       || '</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>' || E'\n'
    || '<url><loc>' || site_url || '/all-videos.html</loc><lastmod>' || today
       || '</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>' || E'\n'
    || '<url><loc>' || site_url || '/search.html</loc><lastmod>' || today
       || '</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>' || E'\n';

  -- Categories
  select xml || string_agg(
    '<url><loc>' || site_url || '/category.html?name='
      || replace(replace(replace(name, '&','%26'), ' ','%20'), '#','%23')
      || '</loc><lastmod>' || to_char(coalesce(updated_at, now()), 'YYYY-MM-DD')
      || '</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>',
    E'\n')
  into xml from public.categories;

  -- Videos (with video:video block for Google video search)
  select xml || E'\n' || string_agg(
    '<url><loc>' || site_url || '/watch.html?slug=' || slug
      || '</loc><lastmod>' || to_char(coalesce(updated_at, created_at), 'YYYY-MM-DD')
      || '</lastmod><changefreq>monthly</changefreq><priority>0.9</priority>'
      || '<video:video>'
      || '<video:thumbnail_loc>' || coalesce(thumbnail_url, '') || '</video:thumbnail_loc>'
      || '<video:title>' || replace(replace(replace(title, '&','&amp;'), '<','&lt;'), '>','&gt;') || '</video:title>'
      || '<video:description>' || replace(replace(replace(coalesce(description, title), '&','&amp;'), '<','&lt;'), '>','&gt;') || '</video:description>'
      || '<video:content_loc>' || coalesce(video_url, '') || '</video:content_loc>'
      || '<video:publication_date>' || to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"+00:00"') || '</video:publication_date>'
      || '</video:video>'
      || '</url>',
    E'\n')
  into xml from public.videos where slug is not null;

  return xml || E'\n</urlset>';
end; $$;

grant execute on function public.generate_sitemap(text) to anon, authenticated, service_role;
-- ============================================================================