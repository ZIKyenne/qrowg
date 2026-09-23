-- 20260923100000_cloisonnement_stockage.sql
-- Audit de sécurité du 23 septembre 2026 — constat n°1 (CRITIQUE).
--
-- ── Le relevé ──────────────────────────────────────────────────────────────
--
-- Le bucket `page-assets` portait DEUX générations de policies superposées.
--
-- La bonne, scopée :
--   "Upload dans son espace"           insert  → dossier = auth.uid()  (ou avatars/<uid>.jpg)
--   "Update de ses propres fichiers"   update  → idem
--
-- Et trois autres, écrites plus tard, qui ne regardent QUE le bucket :
--   "page-assets auth insert"          insert  → bucket_id = 'page-assets'
--   "page-assets auth update"          update  → bucket_id = 'page-assets'
--   "page-assets auth delete"          delete  → bucket_id = 'page-assets'
--
-- Les policies permissives de Postgres se cumulent par OU. La paire scopée ne
-- restreint donc RIEN : elle est absorbée par la paire ouverte. Résultat, tout
-- compte authentifié — l'inscription est libre et gratuite — pouvait
--
--   • SUPPRIMER n'importe quel fichier du bucket (au relevé : 421 objets,
--     133 Mo, les médias de toutes les pages publiées) ;
--   • ÉCRASER le fichier d'un autre commerçant à son chemin exact
--     (`<uid-d-un-autre>/logo-….webp`) : la page publiée affiche alors ce
--     qu'on y a mis.
--
-- Et comme le bucket est public en lecture, les chemins s'énumèrent SANS
-- compte : l'attaquant sait exactement quoi viser avant même de s'inscrire.
--
-- ── Pourquoi retirer les trois ne retire aucune fonction ───────────────────
--
-- Les trois seuls chemins d'écriture du produit ont été relus un par un :
--
--   useImageUpload.ts    `${user.id}/…`          → couvert par la policy scopée
--   profile/page.tsx     `avatars/${uid}.jpg`    → couvert par la policy scopée
--   api/social/upload    `social/…`              → service role, hors RLS
--
-- Il manquait en revanche un DELETE scopé : `deleteAsset()` supprime
-- `${user.id}/${name}` et ne s'appuyait que sur la policy ouverte. On le crée
-- ici — sans lui, retirer la policy ouverte casserait la bibliothèque de médias.

begin;

drop policy if exists "page-assets auth insert" on storage.objects;
drop policy if exists "page-assets auth update" on storage.objects;
drop policy if exists "page-assets auth delete" on storage.objects;

-- Doublon exact de "page-assets public read" (même bucket, même expression).
-- Deux policies identiques ne protègent pas deux fois : elles cachent juste
-- laquelle fait foi.
drop policy if exists "page-assets: public read" on storage.objects;

-- Ce qui manquait : supprimer SES fichiers, et seulement les siens.
drop policy if exists "Suppression de ses propres fichiers" on storage.objects;
create policy "Suppression de ses propres fichiers" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'page-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or name = 'avatars/' || auth.uid()::text || '.jpg'
    )
  );

-- Le plafond de taille du bucket n'existait pas : les 20 Mo sont vérifiés dans
-- le navigateur (validationEnvoi.ts), donc contournables par un appel direct.
-- 25 Mo laisse la marge des 20 Mo annoncés + l'entête multipart.
update storage.buckets set file_size_limit = 26214400 where id = 'page-assets';

commit;
