-- =============================================================================
-- Fermeture des inserts analytics anonymes (audit DD, phase 1)
-- =============================================================================
-- Les policies "insert with check(true)" permettaient à quiconque (clé anon) de
-- créer des scans/vues/clics/événements bidons en masse -> stats faussées ET
-- quotas de facturation manipulables (triggers de compteurs).
-- Le tracking passe désormais par des routes serveur (service role, bypass RLS) :
--   - scans        -> app/q/[code]/route.ts (résolution QR)
--   - vues/clics/events -> app/api/track/route.ts (rate-limité, page vérifiée)
-- On retire donc les policies d'insert public : plus aucun insert anonyme direct.
--
-- ⚠️ ORDRE : déployer d'abord le CODE (tracking via /api/track), PUIS appliquer.
-- NB : la table `leads` conserve son insert public (soumission de lead par des
-- visiteurs anonymes) — à consolider dans une route serveur ultérieurement.
-- -----------------------------------------------------------------------------
drop policy if exists "Insert scan public"  on public.scans;
drop policy if exists "Insert view public"  on public.page_views;
drop policy if exists "Insert click public" on public.block_clicks;
drop policy if exists "Insert event public" on public.page_events;
