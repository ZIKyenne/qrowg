-- =============================================================================
-- Durcissement sécurité (audit DD, phase 1)
-- =============================================================================
-- Retire l'exposition PUBLIQUE des PII : la policy "Profils publics visibles"
-- (select using(true)) exposait email + stripe_customer_id + plan de TOUS les
-- utilisateurs à quiconque muni de la clé anon (publique). Idem qr_codes.
-- Les lectures publiques (page [slug], résolution QR) passent désormais par le
-- service role côté serveur (createAdminClient) — voir app/[slug]/page.tsx et
-- app/q/[code]/route.ts. Les utilisateurs authentifiés lisent toujours leur
-- propre profil via la policy "Lecture profil propre" (auth.uid() = id).
--
-- ⚠️ ORDRE : déployer d'abord le CODE (bascule [slug] sur le service role), PUIS
-- appliquer cette migration.
-- -----------------------------------------------------------------------------
drop policy if exists "Profils publics visibles" on public.profiles;
drop policy if exists "Lecture QR codes publics" on public.qr_codes;

-- NB : la RPC domain_redirects_increment (route api/domains/resolve) et sa table
-- domain_redirects ne sont PAS présentes dans cette base (migrations
-- 20260611_006..009 jamais appliquées en prod). Fonctionnalité de redirection de
-- domaine non déployée -> hors scope de ce durcissement. À traiter séparément.
