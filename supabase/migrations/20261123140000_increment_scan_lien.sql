-- Vague 3 (revue du 23 nov.) : compteur des QR de lien sans perte sous trafic.
--
-- `/q/<code>` comptait un scan de QR de lien (table instant_qrs) en lisant
-- `total_scans` puis en écrivant « lu + 1 » : deux scans simultanés en
-- comptaient un. Même défaut que increment_redirect_hit (20260728150000), même
-- remède : l'incrément se fait dans la base, en une instruction.
--
-- SECURITY DEFINER, appelée par la seule route serveur (service role). Exécution
-- retirée à public / anon / authenticated dès la création (audit du 16 nov.,
-- 20261116120000) : personne d'autre ne peut gonfler un compteur.
--
-- Facultative pour le code : tant qu'elle n'est pas appliquée, la route garde
-- l'ancienne écriture (best-effort). Retour arrière : drop function.

create or replace function public.increment_scan_lien(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update instant_qrs
  set total_scans  = coalesce(total_scans, 0) + 1,
      last_scan_at = now()
  where id = p_id;
$$;

revoke all on function public.increment_scan_lien(uuid) from public, anon, authenticated;
grant execute on function public.increment_scan_lien(uuid) to service_role;
