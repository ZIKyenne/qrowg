-- QRfolio — Migration consolidée : préférences + parrainage (affiliation) + avatar
-- Idempotente : peut être ré-exécutée sans risque (if not exists / create or replace).
-- À coller dans Supabase → SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Préférences utilisateur (accent, notifications, rapports…)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists preferences jsonb not null default '{
    "locale":"fr","timezone":"Europe/Paris","date_format":"DD/MM/YYYY","time_format":"24h",
    "currency":"EUR","notif_email":true,"notif_scan":true,"notif_security":true,
    "report_weekly":false,"report_monthly":false,"accent_color":"#C9A84C"
  }'::jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Studio d'avatar (ré-édition)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists avatar_svg text,
  add column if not exists avatar_config jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Parrainage / affiliation
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references public.profiles(id) on delete cascade,
  referred_id   uuid references public.profiles(id) on delete set null,
  ref_code      text not null,
  status        text not null default 'pending', -- pending | validated | rewarded
  reward_months int not null default 0,
  created_at    timestamptz not null default now(),
  validated_at  timestamptz
);

alter table public.referrals enable row level security;

drop policy if exists "Lecture referrals propres" on public.referrals;
create policy "Lecture referrals propres" on public.referrals
  for select using (auth.uid() = referrer_id);

create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
create index if not exists idx_referrals_ref_code on public.referrals(ref_code);

alter table public.profiles add column if not exists ref_code   text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id);

-- Génère un ref_code unique à la création du profil (si absent)
create or replace function public.generate_ref_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ref_code is null then
    new.ref_code = lower(substring(md5(new.id::text) from 1 for 8));
  end if;
  return new;
end;
$$;

drop trigger if exists set_ref_code on public.profiles;
create trigger set_ref_code
  before insert on public.profiles
  for each row execute procedure public.generate_ref_code();

-- Rétro-remplit le ref_code des profils existants qui n'en ont pas
update public.profiles
  set ref_code = lower(substring(md5(id::text) from 1 for 8))
  where ref_code is null;

-- Index unique sur ref_code (après remplissage)
create unique index if not exists idx_profiles_ref_code on public.profiles(ref_code);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) handle_new_user : crée le profil ET enregistre le parrainage si ?ref=CODE
--    (le code est transmis via les métadonnées d'inscription : referred_by_code)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ref_code text;
  v_referrer uuid;
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Affiliation : l'utilisateur arrive via un lien ?ref=CODE
  v_ref_code := nullif(trim(lower(new.raw_user_meta_data->>'referred_by_code')), '');
  if v_ref_code is not null then
    select id into v_referrer
      from public.profiles
      where ref_code = v_ref_code and id <> new.id
      limit 1;

    if v_referrer is not null then
      update public.profiles set referred_by = v_referrer where id = new.id;
      insert into public.referrals (referrer_id, referred_id, ref_code, status, reward_months)
      values (v_referrer, new.id, v_ref_code, 'pending', 1);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
