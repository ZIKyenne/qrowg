-- ============================================================
-- QRfolio — Migration 004 : Rapports automatiques
-- ============================================================

create table if not exists public.report_subscriptions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  email        text not null,
  frequency    text not null check (frequency in ('weekly', 'monthly')),
  enabled      boolean not null default true,
  last_sent_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(user_id, frequency)
);

alter table public.report_subscriptions enable row level security;

create policy "Lecture propre" on public.report_subscriptions
  for select using (auth.uid() = user_id);

create policy "Insert propre" on public.report_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "Update propre" on public.report_subscriptions
  for update using (auth.uid() = user_id);

create policy "Delete propre" on public.report_subscriptions
  for delete using (auth.uid() = user_id);

create index if not exists idx_report_subs_user
  on public.report_subscriptions(user_id);

create index if not exists idx_report_subs_enabled
  on public.report_subscriptions(enabled, frequency)
  where enabled = true;

-- Fonction pour mettre à jour updated_at automatiquement
create or replace function public.handle_report_sub_updated()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger report_sub_updated
  before update on public.report_subscriptions
  for each row execute function public.handle_report_sub_updated();
