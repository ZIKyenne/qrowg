-- Domaines personnalisés : l'unicité que la migration 006 promettait, enfin en base.
--
-- Relevé du 28/11/2026 (lot v410), sur la base de production :
--   · domain_verifications porte encore UNIQUE (domain) — la contrainte d'origine ;
--   · idx_domain_verif_domain existe, mais NON unique.
-- La revue du 27/07 avait corrigé la migration 20260611000006 APRÈS son
-- application : `unique(user_id, domain)` et `create unique index if not exists
-- idx_domain_verif_domain` n'ont jamais atteint la base (une migration passée ne
-- se rejoue pas, et `if not exists` a vu l'index non unique déjà là).
--
-- Deux conséquences, toutes deux réelles en production :
--   1. AJOUTER un domaine échoue toujours : la route fait un upsert
--      `on conflict (user_id, domain)`, qu'aucun index unique ne couvre
--      → 42P10 → 500 pour le commerçant.
--   2. SQUATTING : un compte qui ajoute (sans le vérifier) le domaine d'un
--      autre le bloque — UNIQUE (domain) refuse au vrai propriétaire jusqu'à
--      la ligne en attente.
--
-- La règle voulue : plusieurs comptes peuvent avoir un domaine EN ATTENTE ;
-- un seul peut l'avoir VÉRIFIÉ (c'est la preuve DNS qui tranche).
--
-- Sans risque aujourd'hui : 0 domaine enregistré en production (relevé du jour).
-- Idempotente : peut être rejouée.

begin;

alter table public.domain_verifications
  drop constraint if exists domain_verifications_domain_key;

-- Un compte ne revendique un domaine qu'une fois (cible de l'upsert de la route).
create unique index if not exists domain_verifications_user_domain_key
  on public.domain_verifications (user_id, domain);

-- Un domaine n'est VÉRIFIÉ que par un seul compte. L'index du même nom existe
-- en production mais sans unicité : on le recrée.
drop index if exists public.idx_domain_verif_domain;
create unique index idx_domain_verif_domain
  on public.domain_verifications (domain)
  where verified = true;

commit;
