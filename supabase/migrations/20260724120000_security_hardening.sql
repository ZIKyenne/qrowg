-- =============================================================================
-- Durcissement sécurité (audit DD, phase 1)
-- =============================================================================
-- 1. Retire l'exposition PUBLIQUE des PII : la policy "Profils publics visibles"
--    (select using(true)) exposait email + stripe_customer_id + plan de TOUS les
--    utilisateurs à quiconque muni de la clé anon (publique). Idem qr_codes.
--    Les lectures publiques (page [slug], résolution QR) passent désormais par le
--    service role côté serveur (createAdminClient) — voir app/[slug]/page.tsx et
--    app/q/[code]/route.ts. Les utilisateurs authentifiés lisent toujours leur
--    propre profil via la policy "Lecture profil propre" (auth.uid() = id).
--
-- ⚠️ ORDRE DE DÉPLOIEMENT : déployer d'abord le CODE (qui bascule [slug] sur le
--    service role), PUIS appliquer cette migration. Sinon les pages publiques
--    perdent le nom/avatar du propriétaire pendant la fenêtre de bascule.
-- -----------------------------------------------------------------------------
drop policy if exists "Profils publics visibles" on public.profiles;
drop policy if exists "Lecture QR codes publics" on public.qr_codes;

-- 2. RPC manquante appelée par app/api/domains/resolve/route.ts (incrément atomique
--    du compteur de redirection). Elle n'existait dans aucune migration.
create or replace function public.domain_redirects_increment(rid uuid)
returns void language sql security definer as $$
  update public.domain_redirects set hit_count = hit_count + 1 where id = rid;
$$;
revoke all on function public.domain_redirects_increment(uuid) from public;
grant execute on function public.domain_redirects_increment(uuid) to anon, authenticated, service_role;
