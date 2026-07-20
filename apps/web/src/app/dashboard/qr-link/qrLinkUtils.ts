// Helpers purs de la page "QR d'un lien" — isoles ici pour rester testables
// sans dependre du gros builder/types (garde le bundle de la page leger).

// Luminance relative (sRGB) d'une couleur hex 6 chiffres.
export function lum(hex: string): number {
  const m = hex.replace("#", "").match(/.{2}/g)
  if (!m || m.length < 3) return 1
  const [r, g, b] = m.map(h => {
    const v = parseInt(h, 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Ratio de contraste WCAG entre deux couleurs (1 = identique, 21 = noir/blanc).
export function contrast(a: string, b: string): number {
  const l1 = lum(a), l2 = lum(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// Ajoute https:// si aucun schema reconnu (site tape sans protocole).
export function normalizeUrl(v: string): string {
  const s = v.trim()
  if (!s) return ""
  if (/^(https?:\/\/|mailto:|tel:|sms:|geo:|wifi:)/i.test(s)) return s
  return "https://" + s
}

// Echappe les caracteres speciaux du format WIFI (\ ; , : ").
export function escapeWifi(s: string): string {
  return s.replace(/([\\;,":])/g, "\\$1")
}

// Construit la charge utile d'un QR WiFi standard (scan -> propose de rejoindre le reseau).
export function buildWifi(ssid: string, password: string, enc: "WPA" | "WEP" | "nopass"): string {
  const s = ssid.trim()
  if (!s) return ""
  const p = enc === "nopass" ? "" : password
  return `WIFI:T:${enc};S:${escapeWifi(s)};P:${escapeWifi(p)};;`
}
