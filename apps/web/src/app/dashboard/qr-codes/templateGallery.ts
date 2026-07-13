// =============================================================================
// templateGallery.ts — Logique PURE de la galerie de modeles (critique #13) :
// favoris, modeles recents, validation d'ids. Aucune dependance DOM.
// =============================================================================

// Le modele est-il en favori ?
export function isFav(favs: string[], id: string): boolean {
  return favs.includes(id)
}

// Bascule un favori (ajoute en tete / retire).
export function toggleFav(favs: string[], id: string): string[] {
  if (!id) return favs
  return favs.includes(id) ? favs.filter(f => f !== id) : [id, ...favs]
}

// Ajoute un modele en tete des recents (dedupe, plafonne).
export function pushRecentTpl(list: string[], id: string, max = 8): string[] {
  if (!id) return list
  return [id, ...list.filter(x => x !== id)].slice(0, max)
}

// Conserve uniquement les ids encore valides, sans doublon, dans l'ordre fourni.
// (Un modele supprime du catalogue disparait ainsi des favoris/recents affiches.)
export function keepValid(ids: string[], validIds: Set<string>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (validIds.has(id) && !seen.has(id)) { seen.add(id); out.push(id) }
  }
  return out
}
