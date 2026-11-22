// Historique des destinations d'un lien dynamique (QR-010, audit UX v2, 22 nov.).
//
// Un QR modifiable est imprimé une fois et collé longtemps. Changer sa
// destination est son intérêt — et son risque : une faute de frappe, un
// collègue qui se trompe, et le QR de la vitrine mène ailleurs sans que
// personne sache vers où il menait hier. Les QR de PAGE gardent déjà leurs dix
// dernières destinations (`qr_codes.dest_history`, avec restauration). Les QR
// de LIEN (`instant_qrs`) n'en gardaient aucune.
//
// Ce qu'on garde : l'adresse remplacée et le jour où elle l'a été. Rien
// d'autre — pas de mot de passe, pas d'identité, pas de contenu de la page.

export type EntreeHistorique = { url: string; remplaceeLe: string }

export const HISTORIQUE_MAX = 10

/** Lit un historique venu de la base : ne garde que les entrées bien formées. */
export function historiqueLu(brut: unknown): EntreeHistorique[] {
  if (!Array.isArray(brut)) return []
  return brut
    .filter((e): e is EntreeHistorique => !!e && typeof e === "object"
      && typeof (e as any).url === "string" && (e as any).url !== ""
      && typeof (e as any).remplaceeLe === "string")
    .slice(0, HISTORIQUE_MAX)
}

/**
 * L'historique après un changement de destination, ou null si rien ne change
 * (même adresse, ou pas d'adresse précédente) : on n'écrit alors rien.
 */
export function historiqueApres(ancienne: string | null | undefined, nouvelle: string, brut: unknown, maintenant: Date): EntreeHistorique[] | null {
  if (!ancienne || ancienne === nouvelle) return null
  return [{ url: ancienne, remplaceeLe: maintenant.toISOString() }, ...historiqueLu(brut)].slice(0, HISTORIQUE_MAX)
}

/**
 * La colonne n'existe pas encore (migration pas appliquée) : PostgREST répond
 * 42703 à la lecture, PGRST204 à l'écriture. Le produit continue sans historique.
 */
export function colonneAbsente(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false
  return err.code === "42703" || err.code === "PGRST204" || /dest_history/.test(err.message || "")
}
