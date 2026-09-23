-- 20260923100300_regard_sur_les_policies.sql
-- Audit de sécurité du 23 septembre 2026 — l'instrument, pas un correctif.
--
-- ── Ce que l'audit a appris de lui-même ────────────────────────────────────
--
-- La policy « Lecture QR publics » n'a JAMAIS existé dans ce dépôt. Sa sœur
-- « Lecture QR codes publics », elle, y est : créée par `initial_schema`, puis
-- retirée par `20260724120000_security_hardening`. Le dépôt, relu de bout en
-- bout, est donc PROPRE — et la production, non.
--
-- C'est le point important : une garde qui relit les migrations ne peut pas
-- voir une policy créée ailleurs (console Supabase, `execute_sql`, un correctif
-- appliqué à chaud un soir). La garde
-- `apps/web/src/lib/cloisonnementQuiTientSansNom.test.ts` couvre la moitié
-- qu'elle peut couvrir : la réintroduction PAR UNE MIGRATION. L'autre moitié
-- ne peut être vue que depuis la base elle-même.
--
-- D'où cette vue. Elle ne corrige rien ; elle rend l'écart LISIBLE en une
-- requête, pour que l'audit suivant ne reparte pas d'une enquête complète.

begin;

create or replace view public.policies_trop_larges as
  select
    schemaname as schema_,
    tablename  as table_,
    policyname as policy_,
    cmd        as commande,
    roles::text as roles_,
    qual       as condition_lecture,
    with_check as condition_ecriture
  from pg_policies
  where schemaname in ('public', 'storage')
    and (
      -- lecture de toute la table
      coalesce(btrim(qual), '') = 'true'
      -- ou écriture qui ne regarde que le bucket / la table, jamais le propriétaire
      or (cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
          and coalesce(qual, '') !~* '(auth\.uid|can_write_owner|can_read_owner|service_role)'
          and coalesce(with_check, '') !~* '(auth\.uid|can_write_owner|can_read_owner|service_role)')
    );

-- Une vue de surveillance n'a rien à faire dans l'API publique : seul le rôle
-- de service la lit. `anon` et `authenticated` n'y ont aucun droit.
revoke all on public.policies_trop_larges from public, anon, authenticated;
grant select on public.policies_trop_larges to service_role;

comment on view public.policies_trop_larges is
  'Audit 23/09/2026 — policies qui ne regardent ni le propriétaire ni le rôle de service. Doit rester vide, sauf tables de référence (plan_domain_limits) et lecture publique assumée du bucket page-assets.';

commit;
