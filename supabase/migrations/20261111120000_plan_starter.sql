-- Le palier « starter » dans l'énumération des plans.
--
-- ── Pourquoi cette migration existe alors que la production l'a déjà ────────
--
-- `20260521200846_initial_schema.sql` crée l'énumération avec trois valeurs :
--   create type subscription_plan as enum ('free', 'pro', 'business');
--
-- Or la base de PRODUCTION en accepte quatre. Relevé le 11 novembre 2026 :
--   free | starter | pro | business
--
-- La valeur a donc été ajoutée à la main, hors migration, et l'historique du
-- dépôt ne décrit plus la base qu'il est censé décrire. Une base reconstruite
-- depuis ces migrations — un environnement de développement, une préproduction,
-- une restauration — n'aurait pas accepté le plan que le produit vend.
--
-- `if not exists` rend l'opération sans effet sur la production : elle ne
-- change rien là où la valeur est déjà présente, et répare partout ailleurs.
--
-- `after 'free'` reproduit l'ORDRE observé en production. Sans cette précision,
-- la valeur serait ajoutée en fin d'énumération et un `order by plan` classerait
-- les plans différemment selon l'environnement — le genre d'écart qui ne se voit
-- qu'une fois en production, sur un écran de tri.

alter type subscription_plan add value if not exists 'starter' after 'free';

-- Les limites par plan existent déjà pour « starter » (table plan_domain_limits,
-- 4 lignes dont starter). Rien à y ajouter : seule l'énumération manquait.
