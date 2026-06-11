-- ============================================================
-- QRfolio — Migration 008 : Multi-brand (plan Business)
-- ============================================================

-- Ajouter is_primary sur domain_verifications
alter table public.domain_verifications
  add column if not exists is_primary boolean not null default false;

-- Une seule entrée primaire par user
create unique index if not exists idx_domain_verif_primary_unique
  on public.domain_verifications(user_id)
  where is_primary = true;

-- Limites de domaines par plan (table de config extensible)
create table if not exists public.plan_domain_limits (
  plan        text primary key,
  max_domains int not null  -- -1 = illimité
);

insert into public.plan_domain_limits (plan, max_domains) values
  ('free',     0),
  ('starter',  0),
  ('pro',      1),
  ('business', -1)
on conflict (plan) do nothing;

-- Fonction: compter les domaines d'un user
create or replace function public.count_user_domains(uid uuid)
returns int language sql stable as $$
  select count(*)::int from public.domain_verifications
  where user_id = uid;
$$;
