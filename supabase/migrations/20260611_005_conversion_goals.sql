-- ============================================================
-- QRfolio — Migration 005 : Objectifs de conversion
-- ============================================================

create table if not exists public.conversion_goals (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  page_id      uuid references public.pages(id) on delete cascade,
  name         text not null,
  description  text,
  -- Type de conversion détecté automatiquement depuis block_clicks
  goal_type    text not null,   -- whatsapp | calendly | cta_button | contact_form | stripe_product | phone | email | custom
  -- Cible optionnelle pour filtrer sur click_target (ex: "wa.me/", "mailto:", url exacte)
  target_match text,
  -- Objectif cible (ex: 100 conversions sur la période)
  target_count int,
  -- Période de référence en jours (7, 30, 90)
  period_days  int not null default 30,
  -- Couleur UI choisie par l'user
  color        text not null default '#C9A84C',
  enabled      boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.conversion_goals enable row level security;

create policy "Lecture propre" on public.conversion_goals
  for select using (auth.uid() = user_id);

create policy "Insert propre" on public.conversion_goals
  for insert with check (auth.uid() = user_id);

create policy "Update propre" on public.conversion_goals
  for update using (auth.uid() = user_id);

create policy "Delete propre" on public.conversion_goals
  for delete using (auth.uid() = user_id);

create index if not exists idx_goals_user
  on public.conversion_goals(user_id, enabled);

create index if not exists idx_goals_page
  on public.conversion_goals(page_id)
  where page_id is not null;

-- Trigger updated_at
create or replace function public.handle_goal_updated()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger goal_updated
  before update on public.conversion_goals
  for each row execute function public.handle_goal_updated();
