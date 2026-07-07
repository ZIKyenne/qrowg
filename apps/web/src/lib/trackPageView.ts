// trackPageView.ts — tracker une vue avec source de trafic détectée
// Appelé côté client sur les pages publiques
import { detectTrafficSource } from "./detectTrafficSource"

// Déduplication par pageId (et non par contexte JS) : une vue comptée une seule fois par
// page, tout en supportant la navigation client-side entre plusieurs pages publiques et
// en absorbant le double-appel de React StrictMode.
const trackedPages = new Set<string>()

export async function trackPageView(pageId: string) {
  if (typeof window === "undefined" || !pageId || trackedPages.has(pageId)) return
  trackedPages.add(pageId)

  try {
    const { source, referrer } = detectTrafficSource()

    // Session pseudo-anonyme (localStorage, jamais de cookie tiers)
    let sessionId = sessionStorage.getItem("qrf_sid")
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem("qrf_sid", sessionId)
    }

    // Device
    const ua = navigator.userAgent
    const device = /Mobi|Android/i.test(ua) ? "mobile" : /Tablet|iPad/i.test(ua) ? "tablet" : "desktop"

    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    await supabase.from("page_views").insert({
      page_id:    pageId,
      source,
      referrer,   // domaine uniquement, pas l'URL complète
      device,
      session_id: sessionId,
    })
  } catch {
    // Silencieux — le tracking ne doit jamais casser la page
  }
}
