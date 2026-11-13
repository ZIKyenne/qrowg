-- QRfolio — Migration : destination dynamique des QR codes
-- Permet de changer la destination d'un QR sans toucher au QR physique

create type dest_type as enum (
  'page',       -- Page QRfolio (défaut)
  'url',        -- URL externe
  'file',       -- Fichier hébergé
  'email',      -- mailto:
  'phone',      -- tel:
  'whatsapp'    -- wa.me/
);

alter table public.qr_codes
  add column if not exists dest_override     jsonb,       -- null = destination page normale
  add column if not exists dest_history      jsonb not null default '[]';  -- dernières 10 destinations

-- Format dest_override:
-- { type: dest_type, value: string, label?: string, set_at: timestamptz, set_by: uuid }
-- Format dest_history: tableau de dest_override

comment on column public.qr_codes.dest_override is
  'Override actif de la destination. null = page QRfolio par défaut (page_id).';
comment on column public.qr_codes.dest_history is
  'Historique des 10 dernières destinations.';
