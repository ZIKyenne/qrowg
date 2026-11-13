-- ============================================================
-- QRfolio — Migration 009 : Redirections
-- ============================================================

create table if not exists public.domain_redirects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  -- Source: domaine + chemin optionnel
  from_domain text not null,           -- ex: "ancien-site.fr" ou "qrfolio.app"
  from_path   text not null default '/', -- ex: "/" ou "/page-a"
  -- Destination
  to_url      text not null,           -- ex: "https://nouveau-site.fr" ou "/page-b"
  -- Type HTTP
  redirect_type int not null default 301 check (redirect_type in (301, 302)),
  -- Actif
  enabled     boolean not null default true,
  -- SEO: description interne pour retrouver
  label       text,
  -- Stats
  hit_count   int not null default 0,
  last_hit_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Une source = une destination
  unique(from_domain, from_path)
);

alter table public.domain_redirects enable row level security;

create policy "Lecture propre" on public.domain_redirects
  for select using (auth.uid() = user_id);

create policy "Insert propre" on public.domain_redirects
  for insert with check (auth.uid() = user_id);

create policy "Update propre" on public.domain_redirects
  for update using (auth.uid() = user_id);

create policy "Delete propre" on public.domain_redirects
  for delete using (auth.uid() = user_id);

create index if not exists idx_redirects_lookup
  on public.domain_redirects(from_domain, from_path, enabled)
  where enabled = true;

create index if not exists idx_redirects_user
  on public.domain_redirects(user_id);
