// detectTrafficSource.ts
// Détection automatique de la source de trafic — RGPD friendly (pas d'IP stockée)

export type TrafficSource =
  | "qr_scan"
  | "direct"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "whatsapp"
  | "telegram"
  | "email"
  | "google"
  | "referral"

export interface TrafficInfo {
  source: TrafficSource
  referrer: string | null  // domaine uniquement, jamais l'URL complète
}

// Mapping domaine → source
const SOURCE_MAP: [RegExp, TrafficSource][] = [
  [/instagram\.com|ig\.me|instagr\.am/i,         "instagram"],
  [/tiktok\.com|vm\.tiktok\.com/i,               "tiktok"],
  [/facebook\.com|fb\.me|fb\.com|l\.facebook/i, "facebook"],
  [/linkedin\.com|lnkd\.in/i,                     "linkedin"],
  [/x\.com|twitter\.com|t\.co/i,                 "twitter"],
  [/whatsapp\.com|wa\.me/i,                        "whatsapp"],
  [/t\.me|telegram\.me|telegram\.org/i,           "telegram"],
  [/mail\.|gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|substack\.com|mailchimp\.com/i, "email"],
  [/google\.|bing\.com|duckduckgo\.com|yahoo\.com|qwant\.com/i, "google"],
]

export function detectTrafficSource(): TrafficInfo {
  if (typeof window === "undefined") return { source: "direct", referrer: null }

  // 1. QR scan — paramètre UTM ou flag dans l'URL
  const params = new URLSearchParams(window.location.search)
  if (
    params.get("utm_medium") === "qr" ||
    params.get("qr") === "1" ||
    params.get("src") === "qr"
  ) {
    return { source: "qr_scan", referrer: null }
  }

  // 2. Référent HTTP
  const rawRef = document.referrer
  if (!rawRef) return { source: "direct", referrer: null }

  // Extraire uniquement le domaine (jamais le chemin complet — RGPD)
  let domain: string | null = null
  try {
    domain = new URL(rawRef).hostname.replace(/^www\./, "")
  } catch {
    domain = null
  }

  if (!domain) return { source: "direct", referrer: null }

  // 3. Matcher le domaine
  for (const [pattern, source] of SOURCE_MAP) {
    if (pattern.test(domain)) {
      return { source, referrer: domain }
    }
  }

  // 4. Référent inconnu = référral externe
  return { source: "referral", referrer: domain }
}
