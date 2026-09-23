-- 20260923100200_qr_codes_sans_lecture_publique.sql
-- Audit de sécurité du 23 septembre 2026 — constat n°2 (CRITIQUE).
--
-- ── Le relevé ──────────────────────────────────────────────────────────────
--
-- `qr_codes` portait en production une policy
--
--     "Lecture QR publics"   for select   using (true)
--
-- La clé anon est publique par construction (elle est dans le bundle servi au
-- navigateur). Une policy `using (true)` sur PostgREST veut donc dire : toute
-- la table, pour n'importe qui — `user_id`, `label`, `short_code`,
-- `total_scans`, `last_scan_at`, `dest_override`, `dest_history`. Soit la
-- liste des supports de chaque commerçant, leur fréquentation, et vers quoi
-- ils redirigent.
--
-- Ce n'était pas seulement théorique : `PrintStudioClient.tsx` interroge
-- `qr_codes` SANS filtre, en s'appuyant — le commentaire le dit — sur « RLS
-- scope automatiquement ». Avec cette policy, RLS ne scopait pas : au
-- deuxième commerçant inscrit, le Print Studio de l'un aurait listé les
-- supports de l'autre.
--
-- ── Ce que le produit en avait besoin : rien ────────────────────────────────
--
-- Les trois chemins publics ont été relus : `/q/[code]`, `/api/track` et
-- `/api/v1/qr/[code]/destination` passent tous par `createAdminClient()`
-- (service role), qui ignore RLS. Le scan d'un QR ne dépendait à aucun moment
-- de cette policy. La seule dépendance réelle — la vérification d'unicité du
-- short_code — passe désormais par `short_code_libre()`.
--
-- ── Pourquoi on ne la retire pas par son nom ───────────────────────────────
--
-- Parce que ça a déjà été fait, et que ça n'a pas tenu. La migration
-- `20260724120000_security_hardening.sql` contient, depuis juillet :
--
--     drop policy if exists "Lecture QR codes publics" on public.qr_codes;
--
-- Ses deux sœurs — "Profils publics visibles", et la lecture publique des
-- pages publiées — sont bien mortes ce jour-là. Celle-ci est revenue sous un
-- nom d'une syllabe plus court, « Lecture QR publics », et le `if exists` par
-- nom exact ne l'a plus jamais vue. C'est la même leçon que les lots v159,
-- v170 et v175, écrite en SQL cette fois : **une règle accrochée à un nom
-- écrit à la main finit par ne plus désigner ce qu'elle visait.**
--
-- Alors on ne vise plus un nom. On retire toute policy de LECTURE sur
-- `qr_codes` dont la condition est `true`, quel que soit son nom — et le
-- bloc reste valable si elle revient un jour sous un troisième nom.
--
-- La ligne qui suit est lue par la garde `cloisonnementQuiTientSansNom.test.ts` :
-- elle lui dit qu'ici la lecture totale est retirée SANS passer par un nom. La
-- garde ne la croit pas sur parole — elle vérifie que le bloc ci-dessous filtre
-- bien sur cette table et sur `qual = true`.
--
-- @retire-lecture-totale: qr_codes

begin;

do $$
declare p record; n int := 0;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'qr_codes'
      and cmd in ('SELECT', 'ALL')
      and coalesce(btrim(qual), '') = 'true'
  loop
    execute format('drop policy %I on public.qr_codes', p.policyname);
    raise notice 'policy de lecture totale retiree sur qr_codes : %', p.policyname;
    n := n + 1;
  end loop;
  raise notice 'qr_codes : % policy(ies) retiree(s)', n;
end $$;

-- Il reste "CRUD QR propres" (auth.uid() = user_id) et "Lecture qr equipe"
-- (can_read_owner(user_id)) : un commerçant voit ses QR et ceux des équipes
-- dont il est membre. Rien d'autre.

commit;
