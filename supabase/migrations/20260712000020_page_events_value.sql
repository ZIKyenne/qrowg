-- Migration 020 : ajoute une valeur numérique à page_events (pour le temps d'attention par bloc).
-- Additive & idempotente. Pour le kind 'dwell' : ref = block_id, value = secondes de visibilité.

alter table public.page_events
  add column if not exists value integer;

-- Autorise le nouveau type d'événement 'dwell' (temps d'attention) en plus de scroll/impression.
do $$
begin
  -- Remplace la contrainte de check pour inclure 'dwell' (si la contrainte existe déjà).
  if exists (
    select 1 from information_schema.constraint_column_usage
    where table_name = 'page_events' and column_name = 'kind'
  ) then
    begin
      alter table public.page_events drop constraint if exists page_events_kind_check;
    exception when others then null;
    end;
  end if;
  alter table public.page_events
    add constraint page_events_kind_check check (kind in ('scroll', 'impression', 'dwell'));
exception when duplicate_object then null;
end $$;
