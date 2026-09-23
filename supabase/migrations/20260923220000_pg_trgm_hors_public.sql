-- 20260923220000_pg_trgm_hors_public.sql
-- Audit de sécurité du 23 septembre 2026 — constat mineur, refermé.
--
-- ── Le relevé ──────────────────────────────────────────────────────────────
--
-- `pg_trgm` est installée dans `public` depuis `initial_schema`, avec le
-- commentaire « recherche fulltext ». Une extension dans `public` mélange ses
-- fonctions à celles que PostgREST expose : c'est l'avertissement de l'advisor
-- Supabase, et la migration `20260820120000_security_hardening` l'avait déjà
-- noté — en reportant le déplacement, faute de savoir ce qui en dépendait.
--
-- ── Ce que la mesure a répondu ─────────────────────────────────────────────
--
-- La question posée à la base, plutôt qu'au dépôt :
--
--   index utilisant un opclass trgm .................. 0
--   objets dépendant de l'extension .................. 0
--   occurrences de similarity()/trgm dans le code .... 0 (hors ce commentaire)
--
-- L'extension a été installée « au cas où » et n'a jamais servi. Le
-- déplacement ne casse donc rien : il n'y a rien à casser. Le schéma
-- `extensions` existe déjà (Supabase le crée).
--
-- On DÉPLACE plutôt qu'on ne supprime : la capacité reste disponible le jour
-- où une vraie recherche floue sera écrite, et elle sera alors appelée
-- `extensions.similarity(...)`.

begin;

alter extension pg_trgm set schema extensions;

commit;
