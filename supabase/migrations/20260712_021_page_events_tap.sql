-- Migration 021 : carte de chaleur des clics (heatmap).
-- Ajoute la position normalisée (x/y en fraction 0..1) + le type d'événement 'tap'.
-- Additive & idempotente. RGPD : x/y sont des fractions d'écran, aucune donnée personnelle.
-- Pour le kind 'tap' : ref = block_id touché (ou '-' si hors bloc), x = clientX/largeur, y = position/hauteur totale.

alter table public.page_events
  add column if not exists x real,
  add column if not exists y real;

-- Autorise le type 'tap' en plus de scroll/impression/dwell.
do $$
begin
  begin
    alter table public.page_events drop constraint if exists page_events_kind_check;
  exception when others then null;
  end;
  alter table public.page_events
    add constraint page_events_kind_check check (kind in ('scroll', 'impression', 'dwell', 'tap'));
exception when duplicate_object then null;
end $$;
