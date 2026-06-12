-- QRfolio -- Migration : preferences utilisateur
-- Stockage JSONB dans profiles pour eviter une table supplementaire

alter table public.profiles
  add column if not exists preferences jsonb not null default '{
    "locale":         "fr",
    "timezone":       "Europe/Paris",
    "date_format":    "DD/MM/YYYY",
    "time_format":    "24h",
    "currency":       "EUR",
    "notif_email":    true,
    "notif_scan":     true,
    "notif_security": true,
    "report_weekly":  false,
    "report_monthly": false,
    "accent_color":   "#C9A84C"
  }';

comment on column public.profiles.preferences is
  'Preferences utilisateur: locale, timezone, notifications, rapports, accent';
