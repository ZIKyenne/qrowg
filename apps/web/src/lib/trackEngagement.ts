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
type Tap = { page_id: string; kind: "tap"; ref: string; x: number; y: number }

let buffer: Ev[] = []
let tapBuffer: Tap[] = []   // taps : jamais dédupliqués (chaque clic compte), colonnes x/y propres
const seen = new Set<string>()   // dédup : une impression par bloc / un jalon de scroll par session
let bound = false
let flushTimer: ReturnType<typeof setTimeout> | null = null

async function flush() {
  if (buffer.length === 0 && tapBuffer.length === 0) return
  try {
    const sb = await getClient()
    if (buffer.length) { const batch = buffer.splice(0, buffer.length); await sb.from("page_events").insert(batch) }
    if (tapBuffer.length) { const taps = tapBuffer.splice(0, tapBuffer.length); await sb.from("page_events").insert(taps) }
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

// Enregistre un clic/tap avec sa position (fractions 0..1). RGPD : aucune donnée personnelle,
// seulement la position relative à l'écran. Pas de dédup (chaque tap compte). Garde-fou anti-spam.
export function queueTap(pageId: string, ref: string, x: number, y: number) {
  if (typeof window === "undefined" || !pageId) return
  if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return
  if (tapBuffer.length >= 300) return   // garde-fou : jamais plus de 300 taps en file
  tapBuffer.push({ page_id: pageId, kind: "tap", ref: ref || "-", x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 })
  bindFlushOnce()
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => { flush() }, 4000)
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
