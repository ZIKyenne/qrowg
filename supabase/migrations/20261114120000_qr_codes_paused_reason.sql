-- Audit du 14 novembre 2026 (A1) : au retour à un plan inférieur, les QR de
-- page au-delà du quota passent en pause (comme le promettent les conditions).
-- Il faut distinguer une pause imposée par le plan (« quota », rallumée quand
-- le plan remonte) d'une pause choisie par le client (« manual », intouchable).
-- Colonne nullable sans défaut : ajout instantané, aucune ligne réécrite.
alter table public.qr_codes add column if not exists paused_reason text;
