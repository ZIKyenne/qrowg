// trackLinkClick.ts — tracker un clic sur un lien, fire-and-forget
// RGPD : on stocke uniquement l'URL cible et le label, pas d'IP

let _supabase: any = null

async function getClient() {
  if (!_supabase) {
    const { createClient } = await import("@/lib/supabase/client")
    _supabase = createClient()
  }
  return _supabase
}

export function trackLinkClick(
  pageId: string,
  blockId: string,
  clickTarget: string  // URL ou label — max 500 chars
) {
  if (typeof window === "undefined") return
  // Fire-and-forget : ne bloque jamais la navigation
  getClient().then((sb: any) => {
    sb.from("block_clicks").insert({
      page_id:      pageId,
      block_id:     blockId,
      click_target: clickTarget.slice(0, 500),
    })
  }).catch(() => {}) // silencieux
}
