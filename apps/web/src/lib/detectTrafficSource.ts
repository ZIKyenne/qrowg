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

// Coeur PUR (testable) : classe la source à partir de la query string et du
// référent, sans dépendre de `window`. detectTrafficSource() n'est qu'un
// adaptateur qui lui passe les valeurs du navigateur.
export function classifyTraffic(search: string, referrer: string): TrafficInfo {
  // 1. QR scan — paramètre UTM ou flag dans l'URL
  const params = new URLSearchParams(search)
  if (
    params.get("utm_medium") === "qr" ||
    params.get("qr") === "1" ||
    params.get("src") === "qr"
  ) {
    return { source: "qr_scan", referrer: null }
  }

  // 1.5 utm_source explicite (campagne / partage) — prioritaire sur le référent.
  // Indispensable pour WhatsApp/Telegram qui effacent le referrer -> sinon "direct".
  const utm = (params.get("utm_source") || "").toLowerCase().trim()
  if (utm) {
    if (utm === "x") return { source: "twitter", referrer: null }
    const KNOWN: TrafficSource[] = ["instagram", "tiktok", "facebook", "linkedin", "twitter", "whatsapp", "telegram", "email", "google"]
    if ((KNOWN as string[]).includes(utm)) return { source: utm as TrafficSource, referrer: null }
  }

  // 2. Référent HTTP
  if (!referrer) return { source: "direct", referrer: null }

  // Extraire uniquement le domaine (jamais le chemin complet — RGPD)
  let domain: string | null = null
  try {
    domain = new URL(referrer).hostname.replace(/^www\./, "")
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

export function detectTrafficSource(): TrafficInfo {
  if (typeof window === "undefined") return { source: "direct", referrer: null }
  return classifyTraffic(window.location.search, document.referrer)
}
