-- Table parrainage
create table if not exists public.referrals (
  id            uuid primary key default uuid_generate_v4(),
  referrer_id   uuid not null references public.profiles(id) on delete cascade,
  referred_id   uuid references public.profiles(id) on delete set null,
  ref_code      text unique not null,
  status        text not null default 'pending', -- pending | validated | rewarded
  reward_months int not null default 0,
  created_at    timestamptz not null default now(),
  validated_at  timestamptz
);

alter table public.referrals enable row level security;

create policy "Lecture referrals propres" on public.referrals
  for select using (auth.uid() = referrer_id);

create index idx_referrals_referrer on public.referrals(referrer_id);
create index idx_referrals_ref_code on public.referrals(ref_code);

-- Ajouter colonne ref_code aux profiles
alter table public.profiles add column if not exists ref_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);

-- Générer ref_code auto au signup
create or replace function public.generate_ref_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.ref_code = lower(substring(md5(new.id::text) from 1 for 8));
  return new;
end;
$$;

create trigger set_ref_code
  before insert on public.profiles
  for each row execute procedure public.generate_ref_code();
