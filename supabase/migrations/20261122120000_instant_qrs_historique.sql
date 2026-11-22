-- QR-010 (audit UX v2, 22 nov. 2026) : historique des destinations des QR de LIEN.
--
-- Les QR de page gardent déjà leurs dix dernières destinations
-- (qr_codes.dest_history, migration 20260611000012). Les QR de lien
-- (instant_qrs) n'en gardaient aucune : changer la destination d'un QR imprimé
-- effaçait toute trace de l'adresse précédente.
--
-- Une seule colonne, additive. Format : [{ "url": "https://…", "remplaceeLe": "ISO 8601" }],
-- la plus récente en tête, 10 au plus (borné par l'application,
-- lib/historiqueDeDestination.ts). Aucune donnée sensible : l'adresse et la date.
-- Les politiques RLS existantes de instant_qrs (propriétaire) s'appliquent.
--
-- Tant que cette migration n'est pas appliquée, l'application fonctionne sans
-- historique (repli sur colonne absente dans app/api/qr-instant/route.ts).

alter table public.instant_qrs
  add column if not exists dest_history jsonb not null default '[]';

comment on column public.instant_qrs.dest_history is
  'Destinations précédentes d''un QR de lien dynamique : [{url, remplaceeLe}], la plus récente en tête, 10 au plus.';
