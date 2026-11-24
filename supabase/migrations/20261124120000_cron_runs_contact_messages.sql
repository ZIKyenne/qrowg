-- Vague 4 (revue du 23 nov.) : deux tables existaient en production SANS migration
-- dans le dépôt — `cron_runs` (journal des tâches planifiées, lib/journalCron.ts)
-- et `contact_messages` (formulaire /contact). Une base recréée depuis les
-- migrations n'avait ni l'une ni l'autre.
--
-- Cette migration les décrit TELLES QU'ELLES SONT en production (relevé du schéma
-- du 24 nov. : colonnes, contrainte, index, RLS, politique). Elle est IDEMPOTENTE :
-- appliquée sur la production, elle ne change rien ; sur une base neuve, elle crée
-- les deux tables à l'identique. Aucune donnée n'est touchée.

-- ── cron_runs : une ligne par passage d'une tâche planifiée ─────────────────
create table if not exists public.cron_runs (
  id       bigint generated always as identity primary key,
  tache    text not null,
  lance_le timestamptz not null default now(),
  statut   text not null check (statut in ('ok', 'rien', 'erreur', 'refuse')),
  detail   text,
  duree_ms integer
);
create index if not exists cron_runs_tache_lance_le_idx on public.cron_runs (tache, lance_le desc);
alter table public.cron_runs enable row level security;
alter table public.cron_runs force row level security;
-- Aucune politique : seule la clé de service y accède (le journal cite des adresses
-- e-mail en cas d'erreur ; /api/cron/etat le lit côté serveur et masque `detail`).

-- ── contact_messages : le formulaire de contact public ──────────────────────
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  ip_hash    text,
  read       boolean default false,
  created_at timestamptz default now()
);
alter table public.contact_messages enable row level security;
drop policy if exists "Contact service role" on public.contact_messages;
create policy "Contact service role" on public.contact_messages
  for all using (auth.role() = 'service_role');
