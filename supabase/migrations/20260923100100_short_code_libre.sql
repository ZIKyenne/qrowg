-- 20260923100100_short_code_libre.sql
-- Audit de sécurité du 23 septembre 2026 — préalable au constat n°2.
--
-- ── Pourquoi cette fonction existe ─────────────────────────────────────────
--
-- `uniqueShortCode()` (lib/shortCode.ts) tire un code au hasard puis vérifie
-- qu'il n'est pris ni dans `qr_codes` ni dans `instant_qrs`. Quatre routes
-- l'appellent avec le client de l'UTILISATEUR (qr-duplicate, qr-support,
-- qr-instant, qr-instant/bulk) : la vérification passe donc par RLS.
--
-- Et RLS, vue depuis un commerçant, ne montre que SES lignes. La moitié
-- `instant_qrs` de la vérification était donc DÉJÀ aveugle aux codes des
-- autres comptes. La moitié `qr_codes`, elle, voyait tout — mais seulement
-- parce qu'une policy publique traînait (cf. migration suivante).
--
-- Retirer cette policy sans rien faire d'autre rendrait la seconde moitié
-- aveugle elle aussi. On fait l'inverse : la vérification passe ici, dans une
-- fonction qui regarde les DEUX tables en entier — ce que ni l'une ni l'autre
-- moitié ne faisait correctement. La fonction ne renvoie qu'un booléen : elle
-- ne divulgue ni à qui appartient le code, ni rien d'autre de la ligne.
--
-- Le filet reste l'index UNIQUE (`qr_codes_short_code_key`,
-- `instant_qrs_short_code_key`) : une collision non détectée ne produit jamais
-- un QR qui pointe chez quelqu'un d'autre, elle produit une erreur d'insertion.

begin;

create or replace function public.short_code_libre(p_code text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select p_code is not null
     and not exists (select 1 from public.qr_codes    where short_code = p_code)
     and not exists (select 1 from public.instant_qrs where short_code = p_code)
$$;

revoke all on function public.short_code_libre(text) from public;
grant execute on function public.short_code_libre(text) to authenticated, service_role;

comment on function public.short_code_libre(text) is
  'Vrai si ce short_code n''est pris dans aucune des deux tables. Ne renvoie que ce booléen : aucune ligne, aucun propriétaire.';

commit;
