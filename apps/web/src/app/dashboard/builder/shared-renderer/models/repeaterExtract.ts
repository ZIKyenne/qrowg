// Extracteur d'items indexés PUR (répétiteurs). `build(content, i)` renvoie l'item ou null
// (filtre métier explicite par bloc — jamais de moteur générique à clés arbitraires).
// Préserve l'ordre, borne à `max`, ne mute pas `content`.
export function extractIndexed<T>(content: Record<string, any>, max: number, build: (c: Record<string, any>, i: number) => T | null): T[] {
  const out: T[] = []
  for (let i = 1; i <= max; i++) {
    const item = build(content, i)
    if (item != null) out.push(item)
  }
  return out
}

/**
 * Le texte d'un emplacement, espaces retirés — vide s'il n'en reste rien.
 *
 * Lot v153. La règle est écrite depuis longtemps, dans `blockEmptyState.ts` :
 * « une ligne blanche, un item "fantôme" (espaces seuls) ne sont PAS du contenu
 * publiable ». Quinze filtres la suivaient (`String(src[k] || "").trim()`),
 * quinze autres se contentaient de la vérité JavaScript — et une ligne d'espaces
 * y passait pour une ligne. Sur la page publiée, cela donne une puce vide, une
 * carte sans titre, un badge sans texte.
 */
export function texteUtile(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim()
}
