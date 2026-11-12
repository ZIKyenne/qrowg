-- Les trente jours du plan gratuit, tenus par la BASE.
--
-- ── Pourquoi ici, et pas seulement dans l'application ─────────────────────
--
-- Le compteur de l'essai vit dans `profiles.free_published_since`. Si seule
-- l'application le posait et le lisait, il suffirait de trois lignes dans la
-- console du navigateur pour le remettre à null et rouvrir trente jours : la
-- base est joignable directement avec la clé publique, et la règle RLS
-- autorise un propriétaire à écrire chez lui.
--
-- C'est exactement le raisonnement de `20260831140000_quotas_plan.sql` pour
-- les quotas. Même conclusion : la règle qui doit tenir, tient en base.
-- L'application garde la sienne pour un message clair ; la base refuse ce qui
-- ne devrait jamais arriver.
--
-- ── Ce que ces règles font, et ce qu'elles ne font pas ────────────────────
--
-- Elles ferment la boucle qui demandait trois clics : supprimer sa page, en
-- republier une, repartir pour trente jours. Le compteur appartient au COMPTE
-- et ne se remet jamais à zéro tant que le compte existe.
--
-- Elles n'empêchent PAS qu'une même personne ouvre un second compte avec une
-- autre adresse. Aucun produit en libre inscription ne l'empêche, et le
-- prétendre serait mentir. Ce qui est fermé, c'est la boucle à trois clics.
--
-- Rien n'est effacé, aucune page existante n'est mise en pause par cette
-- migration : la pause se CALCULE à l'affichage (voir lib/essaiGratuit.ts).
-- La base, elle, empêche d'en sortir.


-- ── 1. L'essai d'un compte est-il terminé ? ───────────────────────────────
-- Miroir exact de `essaiExpire` dans lib/essaiGratuit.ts. Les deux doivent
-- dire la même chose ; une garde les compare (essaiEnBase.test.ts).
--
-- Un plan inconnu est traité comme GRATUIT : se tromper vers le plus strict
-- est réparable d'un clic par le commerçant ; se tromper vers le plus
-- permissif offre le produit sans que personne ne s'en aperçoive.

create or replace function public.duree_essai_jours()
returns integer
language sql
immutable
set search_path = ''
as $$ select 30 $$;

create or replace function public.essai_expire(p_user uuid)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  v_plan   text;
  v_depuis timestamptz;
begin
  select plan::text, free_published_since into v_plan, v_depuis
  from public.profiles where id = p_user;

  -- Profil illisible : on n'invente pas une expiration.
  if not found then return false; end if;

  -- Tout ce qui paie n'a pas d'échéance.
  if coalesce(v_plan, 'free') in ('starter', 'pro', 'business') then return false; end if;

  -- Jamais publié : l'essai n'a pas commencé.
  if v_depuis is null then return false; end if;

  return now() >= v_depuis + (public.duree_essai_jours() || ' days')::interval;
end;
$$;


-- ── 2. Publier démarre l'essai, et l'essai fini interdit de publier ───────
--
-- Le même déclencheur fait les deux, parce que c'est le même instant : celui
-- où une page devient visible. Le démarrage est posé avec l'horloge du
-- SERVEUR, jamais avec une date envoyée par le client.

create or replace function public.garde_essai_publication()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_depuis timestamptz;
begin
  -- Ne concerne que le passage à l'état publié. Modifier le titre d'une page
  -- déjà publiée, ou la dépublier, n'est jamais bloqué : on ne punit pas un
  -- commerçant qui range ses affaires.
  if new.status is distinct from 'published' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'published' then return new; end if;

  if public.essai_expire(new.user_id) then
    raise exception 'ESSAI_TERMINE: les 30 jours du plan gratuit sont écoulés ; un plan est nécessaire pour publier'
      using errcode = 'check_violation';
  end if;

  -- Première publication du compte : on démarre le compteur. `where ... is null`
  -- rend l'écriture idempotente et interdit de le repousser.
  select free_published_since into v_depuis from public.profiles where id = new.user_id;
  if v_depuis is null then
    update public.profiles set free_published_since = now()
    where id = new.user_id and free_published_since is null;
  end if;

  return new;
end;
$$;

drop trigger if exists garde_essai_publication on public.pages;
create trigger garde_essai_publication
  before insert or update on public.pages
  for each row execute function public.garde_essai_publication();


-- ── 3. Le compteur ne se remet pas à zéro ─────────────────────────────────
--
-- Sans cela, tout le reste est décoratif : le propriétaire peut écrire dans
-- son propre profil. La date ne peut qu'être posée une fois, et jamais
-- effacée ni repoussée.
--
-- On RESTAURE silencieusement l'ancienne valeur au lieu de lever une erreur :
-- une mise à jour de profil parfaitement légitime (changer son nom) renvoie
-- souvent la ligne entière, et la faire échouer casserait un écran innocent.

create or replace function public.garde_compteur_essai()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.free_published_since is not null
     and (new.free_published_since is null
          or new.free_published_since > old.free_published_since) then
    new.free_published_since := old.free_published_since;
  end if;
  return new;
end;
$$;

drop trigger if exists garde_compteur_essai on public.profiles;
create trigger garde_compteur_essai
  before update on public.profiles
  for each row execute function public.garde_compteur_essai();


-- ── 4. Rattrapage des comptes déjà publiés ────────────────────────────────
-- Posé une seule fois, sur la plus ancienne publication de chaque compte.
-- `where free_published_since is null` : ne touche à rien de déjà compté.

update public.profiles p
set free_published_since = s.premiere
from (
  select user_id, min(published_at) as premiere
  from public.pages
  where published_at is not null
  group by user_id
) s
where p.id = s.user_id and p.free_published_since is null;
