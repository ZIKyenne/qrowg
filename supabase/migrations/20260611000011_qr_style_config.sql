-- QRfolio — Migration : style_config sur qr_codes
-- Stocke la config visuelle avancée en JSONB (non-breaking)

alter table public.qr_codes
  add column if not exists style_config jsonb not null default '{}';

comment on column public.qr_codes.style_config is
  'Config visuelle avancée: fg2, cornerColor, eyeColor, transparent, gradient, dotStyle, cornerStyle, margin, density';
