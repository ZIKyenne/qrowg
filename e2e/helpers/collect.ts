import type { Page } from "@playwright/test"

// Collecteur d'erreurs navigateur (B11) : pageerror, console.error, réponses réseau 4xx/5xx.
// Allowlist STRICTE (warnings préexistants/tiers justifiés uniquement). Les hôtes tiers
// (Spotify/YouTube/Google Maps) sont exclus des erreurs réseau : leur blocage (consentement/
// adblock/réseau) est attendu et ne doit pas rendre la suite instable.

export type Collected = { consoleErrors: string[]; pageErrors: string[]; badResponses: string[] }

const CONSOLE_ALLOW: RegExp[] = [
  /Download the React DevTools/i,
  // "Failed to load resource" = échec de sous-ressource ; couvert précisément par les handlers
  // response/requestfailed (filtrés par hôte). Les iframes tierces (Spotify/YouTube/Maps) échouent
  // légitimement en environnement réseau restreint (§20) — on ne les traite pas comme un bug produit.
  /Failed to load resource/i,
  // Émis par le CONTENU des iframes tierces (Spotify/YouTube) qui demandent une permission non
  // accordée par notre attribut `allow` (compute-pressure, etc.) — comportement voulu, pas un bug.
  /Permissions policy violation/i,
  // ── Bruit du SERVEUR DE DÉVELOPPEMENT, ajouté le 5 octobre 2026 ──────────
  //
  // Dix specs du builder mobile étaient rouges. Huit à cause d'un vrai défaut
  // (un plantage à l'ouverture des panneaux, corrigé). Les deux dernières à
  // cause de ces deux messages, que notre propre CSP produit en rencontrant
  // `next dev` — jamais en production.
  //
  // Les deux motifs sont VOLONTAIREMENT ÉTROITS. « toute violation de CSP »
  // aurait masqué le jour où la production en produit une vraie, et c'est
  // précisément le genre de confort qui transforme une garde en décoration.
  //
  // 1. React a besoin d'`eval` en mode développement pour reconstruire les
  //    piles d'appel ; le message le dit lui-même : « React will never use
  //    eval() in production mode ».
  /React requires eval\(\) in development mode/i,
  // 2. Vercel Analytics charge `script.debug.js` UNIQUEMENT en développement ;
  //    la production sert `script.js`, que notre CSP autorise. On nomme donc le
  //    fichier de débogage, pas la directive.
  /script\.debug\.js' violates the following Content Security Policy/i,
]
const SAME_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i
const THIRD_PARTY = [
  "open.spotify.com", "youtube.com", "youtube-nocookie.com", "youtu.be",
  "google.com/maps", "maps.google.com", "apple.com", "gstatic.com", "googleapis.com",
]

export function collect(page: Page): Collected {
  const c: Collected = { consoleErrors: [], pageErrors: [], badResponses: [] }
  page.on("console", m => {
    if (m.type() !== "error") return
    const t = m.text()
    if (!CONSOLE_ALLOW.some(r => r.test(t))) c.consoleErrors.push(t)
  })
  page.on("pageerror", e => c.pageErrors.push(e.message))
  page.on("response", r => {
    const s = r.status()
    if (s < 400) return
    const url = r.url()
    if (THIRD_PARTY.some(h => url.includes(h))) return
    if (!SAME_ORIGIN.test(url)) return // ne flag que les ressources de l'application (même origine)
    c.badResponses.push(`${s} ${url}`)
  })
  // Échecs réseau (DNS/protocole/refus) — uniquement même origine (les tiers sont attendus KO).
  page.on("requestfailed", r => {
    const url = r.url()
    if (!SAME_ORIGIN.test(url)) return
    c.badResponses.push(`requestfailed ${url} (${r.failure()?.errorText || "?"})`)
  })
  return c
}

// Liste des problèmes CRITIQUES (même origine). Vide = propre.
export function problems(c: Collected): string[] {
  return [
    ...c.pageErrors.map(e => "pageerror: " + e),
    ...c.consoleErrors.map(e => "console.error: " + e),
    ...c.badResponses.map(e => "net: " + e),
  ]
}
