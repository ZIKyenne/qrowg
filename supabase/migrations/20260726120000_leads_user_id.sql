-- Dénormalise user_id sur leads : requêtes directes + RLS indexée (au lieu d'un
-- exists() corrélé par ligne). Le visiteur anonyme n'insère que page_id → un
-- trigger SECURITY DEFINER remplit user_id depuis pages à l'insertion.
-- 100 % additif : les anciennes policies corrélées restent (OR), rien ne casse.

-- 1) Colonne (nullable : les inserts anonymes la laissent vide, le trigger la remplit)
alter table public.leads
  add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- 2) Backfill des leads existants
update public.leads l
   set user_id = p.user_id
  from public.pages p
 where l.page_id = p.id
   and l.user_id is null;

-- 3) Remplissage automatique à l'insert (bypass RLS via SECURITY DEFINER)
create or replace function public.leads_set_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    select user_id into new.user_id from public.pages where id = new.page_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_set_user_id on public.leads;
create trigger trg_leads_set_user_id
  before insert on public.leads
  for each row execute function public.leads_set_user_id();

-- 4) Index pour la liste + le compteur "non lus" (dashboard, à chaque chargement)
create index if not exists idx_leads_user_created on public.leads(user_id, created_at desc);
create index if not exists idx_leads_user_unread  on public.leads(user_id) where is_read = false;

-- 5) Policies directes indexées (s'ajoutent aux corrélées existantes → OR)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='Lecture leads par user') then
    execute $p$ create policy "Lecture leads par user" on public.leads for select using (auth.uid() = user_id); $p$;
  end if;
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='Maj leads par user') then
    execute $p$ create policy "Maj leads par user" on public.leads for update using (auth.uid() = user_id); $p$;
  end if;
  if not exists (select 1 from pg_policies where tablename='leads' and policyname='Suppr leads par user') then
    execute $p$ create policy "Suppr leads par user" on public.leads for delete using (auth.uid() = user_id); $p$;
  end if;
end $$;
