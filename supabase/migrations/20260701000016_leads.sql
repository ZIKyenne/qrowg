-- Migration 016 : Leads (collecte des formulaires + RSVP depuis les pages publiques)
-- Insert public (visiteur anonyme), lecture/maj/suppression réservées au propriétaire de la page.

create table if not exists public.leads (
  id         uuid primary key default uuid_generate_v4(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  block_id   text,                                  -- id du bloc source (form/rsvp)
  type       text not null default 'form',          -- quote | reservation | booking | register | rsvp | form
  name       text,
  email      text,
  phone      text,
  message    text,
  data       jsonb not null default '{}'::jsonb,     -- tous les champs saisis
  is_read    boolean not null default false,
  status     text not null default 'new',            -- new | in_progress | done (pipeline)
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='Insert lead public') then
    execute $p$ create policy "Insert lead public" on public.leads for insert with check (true); $p$;
  end if;
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='Read own leads') then
    execute $p$
      create policy "Read own leads" on public.leads for select using (
        exists (select 1 from public.pages where id = leads.page_id and user_id = auth.uid())
      );
    $p$;
  end if;
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='Update own leads') then
    execute $p$
      create policy "Update own leads" on public.leads for update using (
        exists (select 1 from public.pages where id = leads.page_id and user_id = auth.uid())
      );
    $p$;
  end if;
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='Delete own leads') then
    execute $p$
      create policy "Delete own leads" on public.leads for delete using (
        exists (select 1 from public.pages where id = leads.page_id and user_id = auth.uid())
      );
    $p$;
  end if;
end $$;

create index if not exists idx_leads_page_id on public.leads(page_id, created_at desc);
create index if not exists idx_leads_unread on public.leads(page_id) where is_read = false;
