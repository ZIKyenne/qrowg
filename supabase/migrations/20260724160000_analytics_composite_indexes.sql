-- =============================================================================
-- Index composites analytics (audit DD, phase 2 — perf à l'échelle)
-- =============================================================================
-- Les requêtes analytics filtrent toujours "colonne + plage de dates", mais seuls
-- des index mono-colonne existaient -> heap fetch coûteux quand les tables
-- grossissent. Ces index composites couvrent les filtres réels (voir
-- qr-stats/[id]/route.ts, analytics/page.tsx, DashboardClient.tsx).
-- NB : sur de grosses tables, préférer CREATE INDEX CONCURRENTLY (hors transaction)
-- pour éviter un lock d'écriture. Ici IF NOT EXISTS = ré-exécutable.
-- -----------------------------------------------------------------------------
create index if not exists idx_scans_qr_time         on public.scans(qr_code_id, scanned_at desc);
create index if not exists idx_scans_page_time        on public.scans(page_id, scanned_at desc);
create index if not exists idx_page_views_page_time   on public.page_views(page_id, viewed_at desc);
create index if not exists idx_block_clicks_page_time on public.block_clicks(page_id, clicked_at desc);
-- page_events a déjà un index (page_id, kind, created_at) qui couvre (page_id, date).
