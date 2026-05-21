-- ============================================================
-- QRfolio — Migration 001 : Schéma complet
-- Agent : DevOps | Date : 2025-01
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- recherche fulltext

-- ============================================================
-- TYPES ENUM
-- ============================================================

create type subscription_plan as enum ('free', 'pro', 'business');
create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'paused');
create type page_status as enum ('draft', 'published', 'archived');
create type block_type as enum (
  'profile', 'bio', 'social_links', 'gallery', 'contact_form',
  'cta_button', 'google_maps', 'testimonials', 'visit_counter',
  'video', 'stripe_product', 'calendly', 'whatsapp', 'instagram_feed',
  'spacer', 'divider', 'heading', 'rich_text'
);
create type scan_device as enum ('mobile', 'tablet', 'desktop', 'unknown');
create type team_role as enum ('owner', 'editor', 'viewer');

-- ============================================================
-- PROFILES (extension de auth.users)
-- ============================================================

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  username      text unique,
  bio           text,
  website       text,
  -- Plan & facturation
  plan          subscription_plan not null default 'free',
  stripe_customer_id  text unique,
  -- Stats globales
  total_pages   int not null default 0,
  total_scans   int not null default 0,
  -- Timestamps
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Contraintes
  constraint username_format check (username ~ '^[a-z0-9_-]{3,30}$')
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

create table public.subscriptions (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id       text,
  plan                  subscription_plan not null default 'free',
  status                subscription_status not null default 'active',
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  trial_end             timestamptz,
  cancel_at_period_end  boolean not null default false,
  canceled_at           timestamptz,
  metadata              jsonb default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- TEAMS (plan Business)
-- ============================================================

create table public.teams (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  owner_id    uuid not null references public.profiles(id) on delete restrict,
  logo_url    text,
  brand_color text default '#C9A84C',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.team_members (
  id         uuid primary key default uuid_generate_v4(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       team_role not null default 'viewer',
  invited_by uuid references public.profiles(id),
  joined_at  timestamptz not null default now(),
  unique(team_id, user_id)
);

-- ============================================================
-- PAGES
-- ============================================================

create table public.pages (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  team_id       uuid references public.teams(id) on delete set null,
  -- Identité
  title         text not null default 'Ma Page',
  slug          text not null,                        -- ex: "jean-dupont"
  custom_domain text,                                 -- ex: "jean.com"
  status        page_status not null default 'draft',
  -- Template de base
  template_id   text,                                 -- ex: "freelance", "restaurant"
  -- Thème visuel (theme-factory compatible)
  theme         jsonb not null default '{
    "name": "midnight_gold",
    "background": "#080808",
    "primary": "#C9A84C",
    "secondary": "#39FF8F",
    "text": "#F5F0E8",
    "font_display": "Cormorant Garamond",
    "font_body": "DM Sans"
  }',
  -- Métadonnées SEO
  seo_title     text,
  seo_description text,
  og_image_url  text,
  -- Analytics résumé (dénormalisé pour perf)
  total_views   int not null default 0,
  unique_views  int not null default 0,
  -- Timestamps
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Contraintes
  constraint slug_format check (slug ~ '^[a-z0-9_-]{2,60}$'),
  unique(user_id, slug)
);

-- ============================================================
-- BLOCKS (blocs de contenu d'une page)
-- ============================================================

create table public.blocks (
  id          uuid primary key default uuid_generate_v4(),
  page_id     uuid not null references public.pages(id) on delete cascade,
  type        block_type not null,
  position    int not null default 0,              -- ordre d'affichage
  is_visible  boolean not null default true,
  -- Contenu (flexible JSON par type de bloc)
  content     jsonb not null default '{}',
  -- Styles custom du bloc
  styles      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- QR CODES
-- ============================================================

create table public.qr_codes (
  id              uuid primary key default uuid_generate_v4(),
  page_id         uuid not null references public.pages(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  -- Le shortcode permanent (nanoid 8 chars)
  short_code      text unique not null,
  -- Personnalisation visuelle
  foreground_color text not null default '#080808',
  background_color text not null default '#FFFFFF',
  logo_url        text,
  corner_style    text not null default 'square',   -- square | rounded | dot
  error_correction text not null default 'M',       -- L | M | Q | H
  -- Stats rapides
  total_scans     int not null default 0,
  last_scan_at    timestamptz,
  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- SCANS (analytics QR)
-- ============================================================

create table public.scans (
  id          uuid primary key default uuid_generate_v4(),
  qr_code_id  uuid not null references public.qr_codes(id) on delete cascade,
  page_id     uuid not null references public.pages(id) on delete cascade,
  -- Données de tracking (anonymisées RGPD)
  country     text,
  city        text,
  device      scan_device not null default 'unknown',
  os          text,
  browser     text,
  referrer    text,
  -- IP hashée (non stockée en clair)
  ip_hash     text,
  -- Timestamp
  scanned_at  timestamptz not null default now()
);

-- ============================================================
-- PAGE VIEWS (analytics page)
-- ============================================================

create table public.page_views (
  id          uuid primary key default uuid_generate_v4(),
  page_id     uuid not null references public.pages(id) on delete cascade,
  -- Source
  source      text,                                 -- qr | direct | social | search
  referrer    text,
  -- Device
  device      scan_device not null default 'unknown',
  country     text,
  -- Session (pseudo-anonyme)
  session_id  text,
  -- Engagement
  time_on_page int,                                 -- secondes
  -- Timestamp
  viewed_at   timestamptz not null default now()
);

-- ============================================================
-- BLOCK CLICKS (analytics granulaire)
-- ============================================================

create table public.block_clicks (
  id          uuid primary key default uuid_generate_v4(),
  page_id     uuid not null references public.pages(id) on delete cascade,
  block_id    uuid not null references public.blocks(id) on delete cascade,
  click_target text,                                -- URL ou label du bouton
  clicked_at  timestamptz not null default now()
);

-- ============================================================
-- API KEYS (plan Business)
-- ============================================================

create table public.api_keys (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  key_hash    text unique not null,                 -- sha256 de la clé
  key_preview text not null,                       -- ex: "qrf_sk_...abc123"
  last_used_at timestamptz,
  expires_at  timestamptz,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEX (performance)
-- ============================================================

-- Pages
create index idx_pages_user_id on public.pages(user_id);
create index idx_pages_slug on public.pages(slug);
create index idx_pages_custom_domain on public.pages(custom_domain) where custom_domain is not null;
create index idx_pages_status on public.pages(status);

-- Blocks
create index idx_blocks_page_id on public.blocks(page_id);
create index idx_blocks_position on public.blocks(page_id, position);

-- QR codes
create index idx_qr_codes_page_id on public.qr_codes(page_id);
create index idx_qr_codes_short_code on public.qr_codes(short_code);

-- Scans
create index idx_scans_qr_code_id on public.scans(qr_code_id);
create index idx_scans_page_id on public.scans(page_id);
create index idx_scans_scanned_at on public.scans(scanned_at desc);

-- Page views
create index idx_page_views_page_id on public.page_views(page_id);
create index idx_page_views_viewed_at on public.page_views(viewed_at desc);

-- Subscriptions
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_id on public.subscriptions(stripe_subscription_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.pages         enable row level security;
alter table public.blocks        enable row level security;
alter table public.qr_codes      enable row level security;
alter table public.scans         enable row level security;
alter table public.page_views    enable row level security;
alter table public.block_clicks  enable row level security;
alter table public.api_keys      enable row level security;

-- PROFILES
create policy "Lecture profil propre" on public.profiles
  for select using (auth.uid() = id);
create policy "Mise à jour profil propre" on public.profiles
  for update using (auth.uid() = id);
create policy "Profils publics visibles" on public.profiles
  for select using (true); -- pour les pages publiques

-- SUBSCRIPTIONS
create policy "Lecture abonnement propre" on public.subscriptions
  for select using (auth.uid() = user_id);

-- PAGES
create policy "Lecture pages propres" on public.pages
  for select using (auth.uid() = user_id);
create policy "Lecture pages publiées" on public.pages
  for select using (status = 'published');
create policy "Création page" on public.pages
  for insert with check (auth.uid() = user_id);
create policy "Modification page propre" on public.pages
  for update using (auth.uid() = user_id);
create policy "Suppression page propre" on public.pages
  for delete using (auth.uid() = user_id);

-- BLOCKS
create policy "CRUD blocs via page" on public.blocks
  for all using (
    exists (
      select 1 from public.pages
      where id = blocks.page_id and user_id = auth.uid()
    )
  );

-- QR CODES
create policy "CRUD QR codes propres" on public.qr_codes
  for all using (auth.uid() = user_id);
create policy "Lecture QR codes publics" on public.qr_codes
  for select using (true);

-- SCANS (insert public, lecture protégée)
create policy "Insert scan public" on public.scans
  for insert with check (true);
create policy "Lecture scans propres" on public.scans
  for select using (
    exists (
      select 1 from public.pages
      where id = scans.page_id and user_id = auth.uid()
    )
  );

-- PAGE VIEWS (insert public, lecture protégée)
create policy "Insert view public" on public.page_views
  for insert with check (true);
create policy "Lecture views propres" on public.page_views
  for select using (
    exists (
      select 1 from public.pages
      where id = page_views.page_id and user_id = auth.uid()
    )
  );

-- API KEYS
create policy "CRUD API keys propres" on public.api_keys
  for all using (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at    before update on public.profiles    for each row execute procedure public.set_updated_at();
create trigger set_pages_updated_at       before update on public.pages       for each row execute procedure public.set_updated_at();
create trigger set_blocks_updated_at      before update on public.blocks      for each row execute procedure public.set_updated_at();
create trigger set_subscriptions_updated  before update on public.subscriptions for each row execute procedure public.set_updated_at();
create trigger set_qr_codes_updated_at    before update on public.qr_codes    for each row execute procedure public.set_updated_at();

-- Sync plan sur subscriptions
create or replace function public.sync_user_plan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set plan = new.plan
  where id = new.user_id;
  return new;
end;
$$;

create trigger on_subscription_change
  after insert or update on public.subscriptions
  for each row execute procedure public.sync_user_plan();

-- Incrémenter total_scans
create or replace function public.increment_scan_counters()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.qr_codes set total_scans = total_scans + 1, last_scan_at = now() where id = new.qr_code_id;
  update public.pages     set total_views = total_views + 1                      where id = new.page_id;
  update public.profiles  set total_scans = total_scans + 1
    where id = (select user_id from public.pages where id = new.page_id);
  return new;
end;
$$;

create trigger on_scan_created
  after insert on public.scans
  for each row execute procedure public.increment_scan_counters();
