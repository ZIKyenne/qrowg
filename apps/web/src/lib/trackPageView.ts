// trackPageView.ts — tracker une vue avec source de trafic détectée
// Appelé côté client sur les pages publiques
import { detectTrafficSource } from "./detectTrafficSource"

let tracked = false  // une seule vue par chargement de page

export async function trackPageView(pageId: string) {
  if (tracked || typeof window === "undefined") return
  tracked = true

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
