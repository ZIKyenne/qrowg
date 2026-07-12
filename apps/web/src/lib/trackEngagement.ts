// trackEngagement.ts — profondeur de scroll + impressions de blocs (blocs réellement vus).
// RGPD : aucune IP ni donnée personnelle — seulement page_id, un type d'événement et une référence.
// Envoi GROUPÉ (une seule requête) : on met en file, on déduplique, on flush au départ / après un délai.

let _supabase: any = null
async function getClient() {
  if (!_supabase) {
    const { createClient } = await import("@/lib/supabase/client")
    _supabase = createClient()
  }
  return _supabase
}

type Kind = "scroll" | "impression"
type Ev = { page_id: string; kind: Kind; ref: string }

let buffer: Ev[] = []
const seen = new Set<string>()   // dédup : une impression par bloc / un jalon de scroll par session
let bound = false
let flushTimer: ReturnType<typeof setTimeout> | null = null

async function flush() {
  if (buffer.length === 0) return
  const batch = buffer.splice(0, buffer.length)
  try {
    const sb = await getClient()
    await sb.from("page_events").insert(batch)
  } catch { /* silencieux : ne jamais perturber la page publique */ }
}

function bindFlushOnce() {
  if (bound || typeof window === "undefined") return
  bound = true
  const onHidden = () => { if (document.visibilityState === "hidden") flush() }
  document.addEventListener("visibilitychange", onHidden)
  window.addEventListener("pagehide", () => { flush() })
}

// Temps d'attention par bloc : envoi direct (fire-and-forget) des totaux à la fermeture/masquage.
// entries = [{ ref: block_id, value: secondes }]. RGPD : aucune donnée personnelle.
export function trackDwell(pageId: string, entries: { ref: string; value: number }[]) {
  if (typeof window === "undefined" || !pageId || entries.length === 0) return
  const rows = entries.map(e => ({ page_id: pageId, kind: "dwell" as const, ref: e.ref, value: e.value }))
  getClient().then((sb: any) => sb.from("page_events").insert(rows)).catch(() => {})
}

// Met un événement en file (fire-and-forget). Dédup automatique.
export function queueEngagement(pageId: string, kind: Kind, ref: string) {
  if (typeof window === "undefined" || !pageId || !ref) return
  const key = `${kind}:${ref}`
  if (seen.has(key)) return
  seen.add(key)
  buffer.push({ page_id: pageId, kind, ref })
  bindFlushOnce()
  // Flush différé : regroupe les impressions initiales en une requête + garde-fou si l'onglet reste ouvert.
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => { flush() }, 4000)
}
