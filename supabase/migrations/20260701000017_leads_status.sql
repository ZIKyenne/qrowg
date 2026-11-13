-- Migration 017 : statut pipeline sur les leads (mini-CRM)
-- new = nouveau · in_progress = en cours · done = traité

alter table public.leads
  add column if not exists status text not null default 'new';

create index if not exists idx_leads_status on public.leads(page_id, status);
