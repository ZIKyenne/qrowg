// nombreDuContenu — un nombre venu du contenu est borné avant d'être rendu.
//
// Relevé du 14 septembre. Le contenu d'un bloc est stocké en TEXTE : la colonne
// `content` est un objet de chaînes, et chaque rendu reconvertit ce qu'il lui
// faut. Dix-sept endroits le font à la main dans les rendus publics, avec la
// même formule :
//
//   renduLegacy.tsx:292    {"★".repeat(parseInt(s || "5"))}
//   renduLegacy.tsx:1708   Array.from({ length: parseInt(c.stars || "5") })
//   renduLegacy.tsx:2305   const cols = parseInt(c.columns || "3")
//   renduLegacy.tsx:2336   height={parseInt(c.height || "400")}
//   renduLegacy.tsx:618    Math.round((parseInt(String(level) || "3") / 5) * 100)
//
// Le `|| "5"` ne protège que du vide. Il ne protège de rien d'autre — et deux
// de ces lignes ne se contentent pas d'afficher un chiffre faux :
//
//   `"★".repeat(-1)` **lève une RangeError**. Une note d'avis à -1 en base — un
//   import, une génération, un modèle, une saisie — et le rendu du bloc lève
//   PENDANT le rendu de la page publique. Le client qui vient de scanner le QR
//   ne voit pas le menu : il voit une page d'erreur. C'est le pire défaut que
//   ce produit puisse avoir, et il tient dans un signe moins.
//
//   `Array.from({ length: 999999999 })` essaie d'allouer un milliard d'entrées.
//   Un zéro de trop dans un champ, et l'onglet du client se fige.
//
// Et le geste existe déjà — **neuf fois**. `bornes.entier(v, min, max, defaut)`
// borne ce qui ENTRE par une route ; les modèles du rendu partagé en portent
// huit autres, écrites sur place : deux `entier` locaux (l'un prend un défaut,
// l'autre non ; l'un retire les caractères non numériques), `clampInt`, `pct01`,
// `pourcentageNiveau`, et trois lectures inline dans `structurePage`,
// `googleReview` et `beforeAfterShared`. Neuf règles pour une question.
//
// Le premier relevé n'en comptait que trois : les six autres se cachaient
// derrière des noms qui ne disaient pas « nombre » — exactement comme les
// quatre noms du verrou d'attente au lot v111.
//
// Rien ne borne ce qui SORT de la base à l'affichage, et la base contient du
// contenu écrit bien avant que `bornes` n'existe.
//
// La classe : **un nombre venu du contenu est borné avant d'être rendu.**
//
// Une lecture, trois usages — et ce sont bien trois questions, pas une :
//
//   entierDuContenu  une TAILLE, une POSITION : ce qui dépasse revient au bord
//   choixDuContenu   un RÉGLAGE : hors plage = pas de choix, on prend le défaut
//   combien          des CHOSES À DESSINER : 0..max, jamais négatif, jamais énorme
//
// La lecture elle-même est SOUPLE côté rendu (« 12px » vaut 12 — c'est ce que
// `parseInt` faisait, et le contenu existant en dépend) et STRICTE côté route
// (« douze pommes » n'est pas un nombre). Aucune ne rend jamais NaN.

/**
 * La lecture STRICTE : ce qui n'est pas un nombre n'en est pas un.
 *
 * C'est l'implémentation unique de `bornes.entier`, qui la réexporte — elle
 * borne ce qu'une route accepte d'un corps JSON.
 */
export function entier(v: unknown, min: number, max: number, defaut: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN
  if (!Number.isFinite(n)) return defaut
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

/**
 * La lecture SOUPLE : le premier nombre écrit dans la valeur, ou `null`.
 *
 * « 12px » vaut 12, « 3 colonnes » vaut 3, « deux » ne vaut rien. C'est ce que
 * `parseInt` donnait aux rendus, sans son défaut : `parseInt` rend NaN, qui
 * traverse ensuite toutes les opérations sans que personne ne s'en aperçoive.
 */
export function nombreLu(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (typeof v !== "string") return null
  const m = /-?\d+(?:[.,]\d+)?/.exec(v)
  if (!m) return null
  const n = Number(m[0].replace(",", "."))
  return Number.isFinite(n) ? n : null
}

/** Ce qu'un rendu doit faire d'un nombre du contenu : le lire, puis le borner. Jamais NaN. */
export function nombreDuContenu(v: unknown, defaut: number, min = -Infinity, max = Infinity): number {
  const n = nombreLu(v)
  if (n === null) return Math.min(max, Math.max(min, defaut))
  return Math.min(max, Math.max(min, n))
}

/**
 * La même chose, arrondie à l'entier. **Borne** : ce qui dépasse est ramené au
 * bord. C'est ce qu'on veut d'une TAILLE ou d'une POSITION — une hauteur de
 * 5 000 px vaut le maximum tenable, pas la valeur par défaut.
 */
export function entierDuContenu(v: unknown, defaut: number, min = -Infinity, max = Infinity): number {
  return Math.trunc(nombreDuContenu(v, defaut, min, max))
}

/**
 * Un RÉGLAGE choisi dans une plage sensée. **Retombe** : une valeur hors plage
 * n'est pas une valeur, c'est l'absence de choix — on prend le défaut.
 *
 * La différence avec `entierDuContenu` n'est pas une coquetterie, ce sont deux
 * questions. « Zéro colonne » ramené au bord donne UNE colonne : une mise en
 * page que le commerçant n'a pas demandée, et qu'il ne comprendra pas. Le même
 * zéro retombant sur trois lui rend la grille qu'il avait avant de se tromper.
 * Deux gardes du produit — `wave16`, `wave21` — l'exigeaient déjà ; elles ont
 * rattrapé ce module la première fois qu'il a voulu tout borner pareil.
 */
export function choixDuContenu(v: unknown, defaut: number, min: number, max: number): number {
  const n = nombreLu(v)
  if (n === null) return Math.trunc(defaut)
  const e = Math.trunc(n)
  return e < min || e > max ? Math.trunc(defaut) : e
}

/**
 * Un nombre de CHOSES À DESSINER : toujours un entier de 0 à `max`.
 *
 * C'est la seule forme admise devant `String.repeat` et `Array.from({ length })`
 * — les deux qui ne se contentent pas d'afficher un chiffre faux : la première
 * lève sur un négatif, la seconde alloue sur un grand nombre. `max` est le
 * plafond de ce qu'il est sensé de dessiner, pas un plafond technique : cinq
 * étoiles, douze colonnes.
 */
export function combien(v: unknown, defaut: number, max: number): number {
  const n = nombreLu(v)
  const brut = n === null ? defaut : n
  if (!Number.isFinite(brut)) return Math.min(Math.max(Math.trunc(defaut), 0), max)
  return Math.min(Math.max(Math.trunc(brut), 0), max)
}
