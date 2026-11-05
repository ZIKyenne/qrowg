// Lire un tableau COLLÉ : tableur, CSV, ou tableau markdown.
//
// ── D'où vient ce module ───────────────────────────────────────────────────
//
// Ces règles existaient déjà, et elles marchaient : `menuImport.ts` les avait
// écrites pour le collage d'une carte de restaurant (lot v148). Au moment
// d'importer une liste d'établissements, la tentation était de les recopier.
//
// Elles sont donc EXTRAITES, pas réécrites : `menuImport` les appelle désormais
// ici, et ses onze tests sont restés verts sans être modifiés — c'est ce qui
// prouve que l'extraction n'a rien changé pour la fonctionnalité existante.
//
// ── Ce que le module sait, et pourquoi chaque règle existe ────────────────
//
// Un collage arrive de partout : un tableur (séparateur = tabulation), un
// export Excel français (point-virgule), un CSV anglo-saxon (virgule), ou un
// tableau markdown recraché par un assistant (barres verticales). Deviner mal
// le séparateur, c'est mettre toute la ligne dans la première colonne — sans
// erreur visible, juste un résultat faux.
//
// Module PUR : aucune lecture de fichier, aucun réseau, rien de muté.

/**
 * Mots qui trahissent une ligne d'en-têtes, toutes colonnes confondues.
 *
 * Écrits une seule fois, en bon français : la comparaison passe par
 * `cleDeColonne`, qui retire les accents des deux côtés. La liste héritée de
 * `menuImport` doublait chaque mot accentué par sa variante nue ; les deux
 * formes continuent d'être reconnues, sans être écrites deux fois.
 */
const MOTS_DENTETE = [
  "nom", "name", "plat", "produit", "item", "prix", "price", "tarif",
  "description", "desc", "détail", "catégorie",
  "category", "section", "adresse", "address", "ville", "city", "commune",
  "code postal", "cp", "siren", "siret", "activité", "naf", "ape",
  "état", "statut", "téléphone", "site", "url",
]

/**
 * Le séparateur de colonnes le plus probable.
 *
 * L'ordre n'est pas arbitraire : la tabulation d'abord parce qu'elle ne peut
 * venir que d'un vrai tableau, le point-virgule avant la virgule parce qu'un
 * montant français s'écrit « 12,50 » et ferait voir des colonnes partout.
 */
export function separateurProbable(lignes: string[]): string {
  const tout = lignes.join("\n")
  if (tout.includes("\t")) return "\t"
  if (tout.includes("|")) return "|"
  if (tout.includes(";")) return ";"
  if (tout.includes(",")) return ","
  return "\t"   // une seule colonne : le séparateur n'a plus d'importance
}

/** Ligne de séparation d'un tableau markdown (`| --- | :---: |`). */
export function estSeparateurMarkdown(cellules: string[]): boolean {
  return cellules.length > 0 && cellules.every(c => /^:?-{2,}:?$/.test(c.trim()))
}

/**
 * Cette ligne ressemble-t-elle à des en-têtes ?
 *
 * Un mot d'en-tête connu ET aucun chiffre. Les deux conditions comptent :
 * « Prix » est un en-tête, « Prix 12 » est une ligne de données mal collée, et
 * sauter celle-ci ferait perdre un plat sans rien dire.
 */
export function ressembleAUnEntete(cellules: string[]): boolean {
  // `cleDeColonne` des deux côtés : « Catégorie », « categorie » et
  // « code-postal » désignent le même intitulé, et un tableur ne garantit ni
  // les accents ni la ponctuation.
  const connus = MOTS_DENTETE.map(cleDeColonne)
  const bas = cellules.map(cleDeColonne)
  return bas.some(c => connus.includes(c)) && !cellules.some(c => /\d/.test(c))
}

/**
 * Découpe un collage en lignes de cellules.
 *
 * On ne rogne PAS la ligne entière avant de découper : une tabulation en tête
 * décalerait alors toutes les colonnes d'un cran. On ne retire que les lignes
 * entièrement vides, et on rogne cellule par cellule.
 */
export function cellulesDuCollage(texte: string): string[][] {
  if (!texte || typeof texte !== "string") return []
  const lignes = texte.split(/\r?\n/).filter(l => l.trim() !== "")
  if (lignes.length === 0) return []

  const sep = separateurProbable(lignes)
  let rangees = lignes.map(l => l.split(sep).map(c => c.trim()))

  if (sep === "|") {
    // Tableau markdown : les barres de bord produisent une cellule vide de
    // chaque côté, et la ligne de tirets n'est pas une donnée.
    rangees = rangees
      .map(cs => { const c = [...cs]; if (c[0] === "") c.shift(); if (c[c.length - 1] === "") c.pop(); return c })
      .filter(cs => cs.length > 0 && !estSeparateurMarkdown(cs))
  }
  return rangees
}

/**
 * Les mêmes lignes, en-tête mis à part.
 *
 * L'en-tête n'est sauté que s'il reste quelque chose derrière : un collage
 * d'une seule ligne est une donnée, même s'il ressemble à un en-tête.
 */
export function corpsEtEntete(texte: string): { entete: string[] | null; corps: string[][] } {
  const rangees = cellulesDuCollage(texte)
  if (rangees.length === 0) return { entete: null, corps: [] }
  if (rangees.length > 1 && ressembleAUnEntete(rangees[0]))
    return { entete: rangees[0], corps: rangees.slice(1) }
  return { entete: null, corps: rangees }
}

/** Compare deux intitulés sans se soucier d'accents, de casse ni de ponctuation. */
export function cleDeColonne(texte: string): string {
  return texte
    .normalize("NFD").replace(/[̀-ͯ]/g, "")  // « Activité » → « Activite »
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/**
 * Associe des noms de colonnes attendus aux positions réelles de l'en-tête.
 *
 * Rend `{}` quand il n'y a pas d'en-tête : l'appelant retombera alors sur un
 * placement positionnel, ou refusera — mais il le saura, au lieu de lire la
 * première colonne en croyant lire la bonne.
 *
 * `synonymes` : pour chaque champ, les intitulés acceptés. La première colonne
 * qui correspond gagne ; une colonne déjà prise n'est pas réattribuée, sinon
 * un tableau avec deux colonnes « Nom » en perdrait une silencieusement.
 */
export function colonnesParNom(
  entete: string[] | null,
  synonymes: Record<string, string[]>,
): Record<string, number> {
  if (!entete) return {}
  const cles = entete.map(cleDeColonne)
  const pris = new Set<number>()
  const out: Record<string, number> = {}

  for (const [champ, mots] of Object.entries(synonymes)) {
    const acceptes = mots.map(cleDeColonne)
    const i = cles.findIndex((c, k) => !pris.has(k) && acceptes.includes(c))
    if (i >= 0) { out[champ] = i; pris.add(i) }
  }
  return out
}
