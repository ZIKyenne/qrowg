// ─────────────────────────────────────────────────────────────────────────────
// LIRE TOUTES LES LIGNES, PAS LES 1 000 PREMIÈRES (lot v413)
//
// PostgREST coupe chaque réponse au plafond du projet (« Max rows », 1 000 par
// défaut chez Supabase), quoi que demande `.limit()`, et sans rien signaler :
// `data` revient simplement plus court. Les tâches planifiées lisaient « tous
// les profils », « toutes les pages » d'un seul appel — au-delà du plafond, des
// commerçants sortaient du rapport du lundi sans que rien ne le dise.
//
// On lit par tranches jusqu'à une tranche VIDE, en avançant du nombre de lignes
// réellement reçues : juste quel que soit le plafond réglé côté serveur. Une
// erreur lève — une lecture partielle ne doit pas passer pour la liste entière.
// ─────────────────────────────────────────────────────────────────────────────

type Reponse<T> = PromiseLike<{ data: T[] | null; error: { message?: string } | null }>

export const TRANCHE = 1000
/** Garde-fou : 200 tranches = 200 000 lignes, bien au-delà de toute tâche du produit. */
export const TRANCHES_MAX = 200

/**
 * `tranche(de, a)` construit la requête d'UNE tranche (bornes incluses, comme
 * `.range(de, a)`). La requête doit porter un ordre stable (`.order("id")`).
 */
export async function toutesLesLignes<T>(tranche: (de: number, a: number) => Reponse<T>, taille = TRANCHE): Promise<T[]> {
  const lignes: T[] = []
  for (let i = 0; i < TRANCHES_MAX; i++) {
    const { data, error } = await tranche(lignes.length, lignes.length + taille - 1)
    if (error) throw new Error(error.message ?? "lecture impossible")
    if (!data?.length) return lignes
    lignes.push(...data)
  }
  throw new Error(`lecture interrompue au-delà de ${TRANCHES_MAX * taille} lignes`)
}

/**
 * Parmi `ids`, ceux qui ont AU MOINS une ligne dans la requête — sans rapatrier
 * toutes les lignes. On redemande seulement les identifiants pas encore vus :
 * chaque tour en retire au moins un, ou s'arrête sur une réponse vide.
 */
export async function idsPresents(
  ids: string[],
  lire: (restants: string[]) => Reponse<Record<string, unknown>>,
  cle: string,
): Promise<Set<string>> {
  const vus = new Set<string>()
  let restants = [...new Set(ids)]
  while (restants.length) {
    const { data, error } = await lire(restants)
    if (error) throw new Error(error.message ?? "lecture impossible")
    const trouves = new Set((data ?? []).map(l => l[cle]).filter((v): v is string => typeof v === "string"))
    if (!trouves.size) break
    trouves.forEach(id => vus.add(id))
    restants = restants.filter(id => !trouves.has(id))
  }
  return vus
}
