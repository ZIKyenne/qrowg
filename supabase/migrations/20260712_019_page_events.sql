-- Migration 019 : page_events (engagement) — scroll depth + impressions par bloc.
-- Même modèle RGPD/RLS que block_clicks : insert public (visiteurs anonymes), lecture réservée au propriétaire.
-- Aucune donnée personnelle (ni IP) : uniquement page_id, un type d'événement et une référence.

create table if not exists public.page_events (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  kind       text not null check (kind in ('scroll', 'impression')),
  ref        text not null,   -- scroll: '25'|'50'|'75'|'100' ; impression: block_id
  created_at timestamptz not null default now()
);

alter table public.page_events enable row level security;

-- Insert public (depuis les pages publiées, visiteurs anonymes)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'page_events' and policyname = 'Insert event public'
  ) then
    execute $p$
      create policy "Insert event public" on public.page_events
        for insert with check (true);
    $p$;
  end if;
end $$;

-- Lecture réservée au propriétaire de la page
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'page_events' and policyname = 'Lecture events propres'
  ) then
    execute $p$
      create policy "Lecture events propres" on public.page_events
        for select using (
          exists (
            select 1 from public.pages
            where id = page_events.page_id and user_id = auth.uid()
          )
        );
    $p$;
  end if;
end $$;

-- Index de performance (agrégations par page / type)
create index if not exists idx_page_events_page_kind
  on public.page_events(page_id, kind, created_at desc);

create index if not exists idx_page_events_ref
  on public.page_events(page_id, kind, ref);
