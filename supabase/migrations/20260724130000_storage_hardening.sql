-- =============================================================================
-- Durcissement uploads (audit DD, phase 1)
-- =============================================================================
-- L'ancienne policy d'upload n'exigeait que "authenticated" -> un utilisateur
-- pouvait écrire dans le dossier d'un autre (upsert:true -> écrasement).
-- On restreint désormais aux emplacements de l'utilisateur :
--   - son dossier   :  {user.id}/...            (uploadImage, uploadFile)
--   - son avatar    :  avatars/{user.id}.jpg    (photo de profil)
-- profiles.id = auth.users.id, donc l'avatar est bien nommé par l'uid.
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated users can upload" on storage.objects;

create policy "Upload dans son espace" on storage.objects
  for insert with check (
    bucket_id = 'page-assets'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or name = 'avatars/' || auth.uid()::text || '.jpg'
    )
  );

-- upsert:true déclenche aussi un UPDATE -> même restriction.
create policy "Update de ses propres fichiers" on storage.objects
  for update using (
    bucket_id = 'page-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or name = 'avatars/' || auth.uid()::text || '.jpg'
    )
  );
