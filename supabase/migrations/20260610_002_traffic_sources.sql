-- ============================================================
-- QRfolio — Migration 002 : Sources de trafic
-- ============================================================

-- Enrichir page_views.source avec les nouvelles valeurs
-- La colonne source (text) est déjà présente → pas d'ALTER TABLE nécessaire

-- Index pour les requêtes analytiques par source
create index if not exists idx_page_views_source
  on public.page_views(source)
  where source is not null;

create index if not exists idx_page_views_page_source
  on public.page_views(page_id, source, viewed_at desc);

-- Vue matérialisée sources par page (rafraîchie depuis le client)
create or replace view public.traffic_sources_summary as
  select
    page_id,
    coalesce(source, 'direct') as source,
    count(*)::int                as visits,
    date_trunc('day', viewed_at) as day
  from public.page_views
  group by page_id, source, day
  order by day desc, visits desc;

-- Politique RLS pour la vue
-- (hérite de page_views via SECURITY INVOKER implicite)
