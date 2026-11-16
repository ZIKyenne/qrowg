-- Audit du 14 novembre 2026 (E, autorisations) — relevé du conseiller de
-- sécurité Supabase du 16 novembre, en production.
--
-- 1. increment_redirect_hit(p_id) restait exécutable par `anon` et
--    `authenticated` : n'importe qui pouvait gonfler le compteur d'une
--    redirection de domaine. La migration 20260905120000 le retirait déjà ; elle
--    n'a pas été appliquée sur ce point. Seule la route serveur (service role)
--    l'appelle (app/api/domains/resolve).
-- 2. Les fonctions de DÉCLENCHEUR (guard_*, quota_*) étaient exposées en RPC.
--    Un déclencheur ne vérifie pas EXECUTE à l'exécution : le retrait ne change
--    rien aux écritures, il ferme seulement /rest/v1/rpc/<nom>.
--
-- Laissées en place, volontairement : can_read_owner / can_write_owner (lues
-- par les politiques RLS — les retirer casserait la lecture des pages),
-- short_code_libre et domaine_verifie_par (appelées par des utilisateurs
-- connectés, ne renvoient qu'un booléen).
--
-- Rien n'est supprimé, aucune donnée n'est touchée. Retour arrière : les
-- `grant execute ... to anon, authenticated` symétriques.

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('increment_redirect_hit', 'guard_domain_source', 'guard_domain_verification', 'quota_instant_qrs', 'quota_qr_codes')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.signature);
    execute format('grant execute on function %s to service_role', r.signature);
  end loop;
end $$;
