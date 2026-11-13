-- QRfolio -- Migration : activity_logs
-- Table generique d'evenements utilisateur

create type activity_event_type as enum (
  'page_created', 'page_published', 'page_updated', 'page_deleted',
  'qr_created', 'qr_customized', 'qr_downloaded', 'qr_scanned',
  'template_used', 'domain_added',
  'plan_changed', 'referral_validated',
  'profile_updated', 'avatar_updated',
  'api_key_created', 'export_done'
);

create table public.activity_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  event_type   activity_event_type not null,
  title        text not null,
  description  text,
  entity_id    uuid,              -- id de la page, qr, etc.
  entity_type  text,              -- 'page' | 'qr_code' | 'profile' | ...
  entity_label text,              -- nom lisible (titre page, short_code QR)
  metadata     jsonb default '{}',-- infos supplementaires non sensibles
  created_at   timestamptz not null default now()
);

create index idx_activity_logs_user_id   on public.activity_logs(user_id);
create index idx_activity_logs_created   on public.activity_logs(created_at desc);
create index idx_activity_logs_user_date on public.activity_logs(user_id, created_at desc);

-- RLS
alter table public.activity_logs enable row level security;

create policy "Users see own activity"
  on public.activity_logs for select
  using (auth.uid() = user_id);

create policy "Users insert own activity"
  on public.activity_logs for insert
  with check (auth.uid() = user_id);

-- Fonction utilitaire pour logger depuis les triggers
create or replace function public.log_activity(
  p_user_id      uuid,
  p_event_type   activity_event_type,
  p_title        text,
  p_description  text  default null,
  p_entity_id    uuid  default null,
  p_entity_type  text  default null,
  p_entity_label text  default null,
  p_metadata     jsonb default '{}'
) returns void language plpgsql security definer as $$
begin
  insert into public.activity_logs
    (user_id, event_type, title, description, entity_id, entity_type, entity_label, metadata)
  values
    (p_user_id, p_event_type, p_title, p_description, p_entity_id, p_entity_type, p_entity_label, p_metadata);
end;
$$;
