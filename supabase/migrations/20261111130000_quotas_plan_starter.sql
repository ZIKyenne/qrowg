-- Les quotas de la base pour le palier « starter » rétabli.
--
-- ── Ce que la garde a trouvé ───────────────────────────────────────────────
--
-- `20260831140000_quotas_plan.sql` pose les limites EN BASE, parce que la base
-- est joignable directement avec la clé publique : sans elles, trois lignes
-- dans la console du navigateur suffisaient à s'octroyer cinquante QR
-- modifiables sur un plan qui en donne un. C'est la ceinture, pas le siège.
--
-- Ces limites repliaient `starter` sur `pro`, exactement comme `getPlan()` le
-- faisait côté code — c'était juste tant que le palier n'était plus vendu :
--
--     when 'starter'  then 30   -- palier retiré ; une ligne héritée vaut Établissement
--
-- Starter étant redevenu un palier vendu le 11 novembre 2026, la base aurait
-- accordé à un client à 4,90 € les quotas d'un client à 12,90 € : 30 QR au lieu
-- de 10, 20 modifiables au lieu de 5, 10 pages au lieu de 3, et le mot de passe
-- et l'expiration de lien par-dessus. La ceinture se serait détachée toute
-- seule, en silence, du côté le plus permissif.
--
-- `quotasEnBase.test.ts` compare ces chiffres à `lib/plans.ts` et a refusé le
-- lot tant que les deux ne disaient pas la même chose.
--
-- La migration d'origine n'est pas modifiée : elle a déjà tourné en production.
-- On redéfinit les fonctions, ce qui est l'effet voulu de `create or replace`.

-- ── Les limites ────────────────────────────────────────────────────────────
-- Mêmes chiffres que apps/web/src/lib/plans.ts. `null` = illimité.

create or replace function public.limite_plan(p_plan text, p_quoi text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_quoi
    -- QR autonomes enregistrés (instant_qrs)
    when 'qr' then case coalesce(p_plan, 'free')
      when 'starter'  then 10
      when 'pro'      then 30
      when 'business' then null
      else 3 end
    -- …dont modifiables après impression, et actifs
    when 'dyn' then case coalesce(p_plan, 'free')
      when 'starter'  then 5
      when 'pro'      then 20
      when 'business' then null
      else 1 end
    -- QR de page ACTIFS (= pages visitables au scan)
    when 'pages' then case coalesce(p_plan, 'free')
      when 'starter'  then 3
      when 'pro'      then 10
      when 'business' then null
      else 1 end
  end
$$;

-- Le mot de passe et l'expiration programmée d'un lien restent vendus à partir
-- du plan Établissement (`caps.dynSecuriteLien`). Starter en sort : il les
-- recevait par le repli, pas par une décision.
create or replace function public.plan_a_securite_lien(p_plan text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_plan, 'free') in ('pro', 'business')
$$;
