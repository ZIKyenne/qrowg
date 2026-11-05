-- 20261105120000_growth_apercus.sql
-- QRowg AI Growth Engine — phase 1 : stocker un prospect et son aperçu.
--
-- ── Ce que ces deux tables permettent, et rien de plus ─────────────────────
--
-- Garder le profil vérifié d'un établissement, et la page générée à partir de
-- lui, derrière une URL privée qui expire. C'est le strict nécessaire pour que
-- l'aperçu existe ailleurs que dans la mémoire d'un processus — donc pour qu'un
-- prospect puisse le rouvrir, et un jour le récupérer.
--
-- Ce que ces tables ne font PAS, volontairement : aucun contact, aucune
-- adresse e-mail, aucune campagne. La prospection relève des phases 2 et 3, et
-- ses obligations (base légale, information, opposition, durée de conservation)
-- se décident avant d'écrire la moindre colonne qui stockerait une personne.
-- Une table vide est plus facile à créer qu'une donnée personnelle à effacer.
--
-- ── Sécurité ───────────────────────────────────────────────────────────────
--
-- RLS activée, et AUCUNE politique n'est créée : ni `anon` ni `authenticated`
-- ne lisent ces tables directement. Tout passe par une route serveur qui
-- vérifie le jeton. C'est la doctrine que le dépôt applique déjà — voir
-- `20260923100200_qr_codes_sans_lecture_publique.sql`.
--
-- Le jeton d'accès n'est pas stocké : seul son **condensé** l'est. Une fuite de
-- la base ne donne donc pas les URL d'aperçu. C'est le même choix que pour les
-- clés d'API du produit (`qrk_`, SHA-256).
--
-- ── Réversibilité ──────────────────────────────────────────────────────────
--
-- Purement additive : deux tables neuves, aucune colonne ni politique
-- existante touchée. Pour revenir en arrière, dans cet ordre :
--
--   drop table if exists public.growth_previews;
--   drop table if exists public.growth_prospects;
--
-- Rien d'autre à défaire.

begin;

-- ── Le prospect et son profil vérifié ──────────────────────────────────────
create table if not exists public.growth_prospects (
  id          uuid primary key default gen_random_uuid(),
  -- Clé lisible, pour les jeux d'essai (`fictif-bistrot`). Unique : on ne
  -- recrée pas deux fois le même établissement.
  cle         text not null unique,
  nom         text,
  -- Le profil entier, AVEC la provenance de chaque champ. Le format est celui
  -- de `lib/growth/profilEtablissement.ts` : chaque valeur porte sa source, sa
  -- date d'observation et son degré de certitude. Un champ sans provenance n'a
  -- pas sa place ici.
  profil      jsonb not null,
  cree_le     timestamptz not null default now(),
  maj_le      timestamptz not null default now()
);

comment on table public.growth_prospects is
  'Profils d''établissements pour le moteur de croissance. Chaque champ du JSON porte sa source et sa certitude ; une information sans provenance reste nulle.';

-- ── L'aperçu généré ────────────────────────────────────────────────────────
create table if not exists public.growth_previews (
  id              uuid primary key default gen_random_uuid(),
  prospect_id     uuid not null references public.growth_prospects(id) on delete cascade,

  -- Traçabilité : de quel modèle de la bibliothèque vient la structure.
  modele_source   text not null,
  -- Le thème et les blocs, au format que le renderer public consomme déjà.
  rendu           jsonb not null,
  -- Ce qui vient du profil, et ce que l'établissement devra compléter. Affiché
  -- dans le bandeau : les trous se disent, ils ne se comblent pas.
  faits_utilises  text[] not null default '{}',
  a_completer     text[] not null default '{}',

  -- SHA-256 du jeton d'URL. Le jeton lui-même n'est jamais écrit.
  jeton_hache     text not null unique,
  expire_le       timestamptz not null,

  -- Le contrôle qualité bloque la suite tant qu'il n'est pas passé.
  qa_statut       text not null default 'en_attente'
                  check (qa_statut in ('en_attente', 'passe', 'rejete')),
  qa_detail       jsonb,

  -- La revendication : qui a récupéré ce modèle, et quand. Nul tant que
  -- personne ne l'a fait. Posséder le lien ne suffira jamais : la route
  -- serveur exigera un compte authentifié.
  revendique_par  uuid references auth.users(id) on delete set null,
  revendique_le   timestamptz,

  cree_le         timestamptz not null default now()
);

comment on table public.growth_previews is
  'Aperçus générés, derrière une URL privée expirante. Le jeton n''est stocké que haché ; aucune lecture directe par anon ou authenticated.';

-- Retrouver un aperçu par son jeton, et purger les expirés.
create index if not exists growth_previews_jeton_idx   on public.growth_previews (jeton_hache);
create index if not exists growth_previews_expire_idx  on public.growth_previews (expire_le);
create index if not exists growth_previews_prospect_idx on public.growth_previews (prospect_id);

-- ── RLS : fermée, sans exception ───────────────────────────────────────────
-- Activée SANS politique : PostgREST ne rendra donc rien à `anon` ni à
-- `authenticated`. Seul le rôle de service, qui contourne la RLS, y accède —
-- depuis une route serveur qui vérifie le jeton et l'expiration.
alter table public.growth_prospects enable row level security;
alter table public.growth_previews  enable row level security;

commit;
