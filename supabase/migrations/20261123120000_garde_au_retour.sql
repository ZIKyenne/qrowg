-- D3 (audit UX v2, 23 nov. 2026) : l'abonné choisit, AVANT l'échéance, ce qui
-- reste actif s'il repasse au plan gratuit.
--
-- Les CGU le promettaient (« l'utilisateur choisissant celles à conserver
-- actives ») ; le webhook Stripe éteignait les plus récents sans demander.
-- Désormais, au moment de la bascule, les QR marqués « à garder » passent en
-- premier ; les autres suivent l'ordre habituel (du plus ancien au plus récent).
--
-- Deux colonnes, additives, fausses par défaut : sans choix, rien ne change.
-- Les politiques RLS existantes (propriétaire) s'appliquent.
--
-- Tant que cette migration n'est pas appliquée, l'application fonctionne comme
-- avant (repli sur colonne absente : webhook, route /api/abonnement/garde).

alter table public.instant_qrs
  add column if not exists keep_on_downgrade boolean not null default false;

alter table public.qr_codes
  add column if not exists keep_on_downgrade boolean not null default false;

comment on column public.instant_qrs.keep_on_downgrade is
  'Choisi par l''abonné : ce QR modifiable reste actif en priorité si le plan descend.';
comment on column public.qr_codes.keep_on_downgrade is
  'Choisi par l''abonné : ce QR de page reste actif en priorité si le plan descend.';
