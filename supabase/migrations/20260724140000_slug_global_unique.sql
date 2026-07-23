-- =============================================================================
-- Unicité GLOBALE du slug (audit DD, phase 1 — bug de correctness)
-- =============================================================================
-- Le code résout les pages publiques par `slug` seul (.eq("slug", slug).single())
-- et suppose donc un slug unique globalement (slugifyUnique ajoute un suffixe
-- aléatoire, /api/slug/check vérifie globalement). MAIS la contrainte DB était
-- `unique(user_id, slug)` (par utilisateur) -> deux utilisateurs pouvaient prendre
-- le même slug (« menu », « contact »…) et leurs deux pages tombaient en 404.
--
-- Cette migration : (1) renomme les éventuelles collisions existantes (garde la
-- plus ancienne), (2) ajoute une contrainte d'unicité globale sur slug.
-- Idempotente et sans risque : ne renomme QUE les vrais doublons.
-- -----------------------------------------------------------------------------

-- 1. Dédoublonnage : pour chaque slug en double, garder la page la plus ancienne
--    et suffixer les autres (reste conforme à slug_format ^[a-z0-9_-]{2,60}$).
with dups as (
  select id,
         row_number() over (partition by slug order by created_at asc, id asc) as rn
  from public.pages
  where slug is not null
)
update public.pages p
set slug = left(p.slug, 50) || '-' || substr(md5(random()::text), 1, 6)
from dups
where p.id = dups.id and dups.rn > 1;

-- 2. Bascule de la contrainte : globale au lieu de par-utilisateur.
--    (drop if exists = no-op si le nom auto-généré diffère ; l'index global
--     ci-dessous reste le vrai garde-fou dans tous les cas.)
alter table public.pages drop constraint if exists pages_user_id_slug_key;
create unique index if not exists pages_slug_global_unique on public.pages(slug);
