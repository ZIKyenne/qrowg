-- QR vers un lien : illimités pour tous les plans (décision du 18 nov. 2026).
--
-- Un QR STATIQUE ne coûte rien au serveur : le lien est écrit DANS le QR, aucun
-- scan ne passe par nous. Le borner (3 en Gratuit, 10 en Starter, 30 en
-- Établissement) ne protégeait rien et freinait l'outil qui fait venir du monde.
-- Ce qui reste compté, c'est ce qui coûte et ce qui se vend : les QR
-- MODIFIABLES après impression (`dyn`) et les QR de page actifs (`pages`).
--
-- Même chiffres que apps/web/src/lib/plans.ts (`limits.qr: null` partout) ;
-- `quotasEnBase.test.ts` compare les deux et refuse le lot s'ils divergent.
--
-- Le déclencheur de `20260831140000_quotas_plan.sql` lit déjà `null` comme
-- « illimité » (`if v_max is not null then …`) : seule la fonction change.
-- Les migrations précédentes ne sont pas modifiées : elles ont tourné en
-- production. On redéfinit, ce qui est l'effet voulu de `create or replace`.

create or replace function public.limite_plan(p_plan text, p_quoi text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_quoi
    -- QR vers un lien enregistrés (instant_qrs) : illimités pour tous.
    when 'qr' then null::integer
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
