-- Studio d'avatar QRfolio : stockage de l'avatar dans le profil
-- À exécuter dans Supabase → SQL Editor (ou via la CLI de migration).

alter table public.profiles
  add column if not exists avatar_svg text,
  add column if not exists avatar_config jsonb;

-- La RLS existante de `profiles` (update de sa propre ligne où id = auth.uid())
-- couvre déjà l'écriture de ces colonnes. Aucune policy supplémentaire requise.
