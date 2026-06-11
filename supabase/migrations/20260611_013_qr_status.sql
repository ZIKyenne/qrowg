-- QRfolio — Migration 013 : Statuts QR Code
-- Non-breaking: default 'active' → tous les QR existants restent actifs

create type qr_status as enum (
  'active',   -- Redirection normale
  'draft',    -- Visible uniquement dans le dashboard
  'paused',   -- Page "QR temporairement indisponible"
  'archived', -- Masqué par défaut, redirection bloquée
  'expired'   -- Redirection bloquée, message "QR expiré"
);

alter table public.qr_codes
  add column if not exists status        qr_status not null default 'active',
  add column if not exists pause_message text,                -- Message public si en pause
  add column if not exists expires_at    timestamptz,         -- Date d'expiration auto
  add column if not exists archived_at   timestamptz,
  add column if not exists paused_at     timestamptz;

create index if not exists idx_qr_codes_status
  on public.qr_codes(status);

comment on column public.qr_codes.status is
  'Statut du QR: active (défaut), draft, paused, archived, expired';
comment on column public.qr_codes.pause_message is
  'Message affiché quand le QR est en pause. Vide = message par défaut.';
