-- Migration 003 : block_clicks policies + indexes
-- Compatible avec le schéma existant (table déjà créée)

-- RLS policies (insert public depuis pages visitées, lecture protégée)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'block_clicks' and policyname = 'Insert click public'
  ) then
    execute $p$
      create policy "Insert click public" on public.block_clicks
        for insert with check (true);
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'block_clicks' and policyname = 'Lecture clicks propres'
  ) then
    execute $p$
      create policy "Lecture clicks propres" on public.block_clicks
        for select using (
          exists (
            select 1 from public.pages
            where id = block_clicks.page_id and user_id = auth.uid()
          )
        );
    $p$;
  end if;
end $$;

-- Index de performance
create index if not exists idx_block_clicks_page_id
  on public.block_clicks(page_id, clicked_at desc);

create index if not exists idx_block_clicks_block_id
  on public.block_clicks(block_id, clicked_at desc);

create index if not exists idx_block_clicks_target
  on public.block_clicks(click_target, clicked_at desc)
  where click_target is not null;
