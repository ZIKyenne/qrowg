-- ============================================================
-- QRfolio — Migration 007 : Routes domaines multi-pages
-- ============================================================
-- Permet d'associer plusieurs sous-domaines d'un même domaine
-- à des pages différentes:
--   restaurant.fr          → page principale
--   booking.restaurant.fr  → page réservation
--   menu.restaurant.fr     → page menu

create table if not exists public.domain_routes (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  -- Domaine racine vérifié (doit exister dans domain_verifications)
  root_domain     text not null,
  -- Sous-domaine ou domaine complet à router
  -- NULL = domaine racine (restaurant.fr)
  -- "booking" = booking.restaurant.fr
  -- "*" = wildcard (toutes sous-domaines non mappés)
  subdomain       text,
  -- Page cible
  page_id         uuid not null references public.pages(id) on delete cascade,
  -- Priorité: plus haute = testé en premier (exact > wildcard)
  priority        int not null default 10,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Un sous-domaine donné ne peut pointer que vers une seule page par domaine racine
  unique(root_domain, subdomain)
);

alter table public.domain_routes enable row level security;

create policy "Lecture propre routes" on public.domain_routes
  for select using (auth.uid() = user_id);

create policy "Insert propre routes" on public.domain_routes
  for insert with check (auth.uid() = user_id);

create policy "Update propre routes" on public.domain_routes
  for update using (auth.uid() = user_id);

create policy "Delete propre routes" on public.domain_routes
  for delete using (auth.uid() = user_id);

create index if not exists idx_domain_routes_root
  on public.domain_routes(root_domain, enabled)
  where enabled = true;

create index if not exists idx_domain_routes_page
  on public.domain_routes(page_id);

-- Trigger updated_at
create or replace function public.handle_route_updated()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger domain_route_updated
  before update on public.domain_routes
  for each row execute function public.handle_route_updated();
