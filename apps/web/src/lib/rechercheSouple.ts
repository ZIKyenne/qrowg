// rechercheSouple.ts — le produit exige les accents, puis ne les trouve plus.
//
// Relevé du 14 septembre. Les dix-huit recherches du produit — pages, QR,
// médias, modèles, blocs, palette de commandes, et la FAQ de la page publique —
// filtrent toutes de la même façon :
//
//     hay.toLowerCase().includes(q.toLowerCase())
//
// Ce qu'un commerçant tape, ce qu'il trouve :
//
//   page « Café du Coin »     recherche « cafe »          INTROUVABLE
//   page « Menu Été 2026 »    recherche « ete »           INTROUVABLE
//   page « Réservations »     recherche « reservation »   INTROUVABLE
//   page « Crème brûlée »     recherche « creme »         INTROUVABLE
//   page « L'Épicerie »       recherche « epicerie »      INTROUVABLE
//   page « Le Comptoir »      recherche « comptoir »      trouvée
//
// Sept sur neuf. Et l'ironie est complète : `lib/accents.ts` **impose** les
// accents au produit — « Réserver », « Télécharger », « Modèle » — au motif que
// « c'est la vitrine du commerçant qui a l'air bâclée ». 638 des 2 931 libellés
// de blocs en portent un. Le produit force les accents dans le contenu, puis ne
// sait plus les retrouver.
//
// Deux autres formes du même défaut, mesurées ensuite :
//
//   « Café du Coin »   recherche « cafe coin »    INTROUVABLE (ordre des mots)
//   « L'Épicerie »     recherche « l'epicerie »   INTROUVABLE (apostrophe droite
//                                                  contre apostrophe courbe)
//
// Personne ne tape le titre exact, dans l'ordre exact, avec la bonne apostrophe.
//
// Module PUR.
//
// Les deux espaces insécables viennent de `lib/typographieFr` : le lot v103 a
// posé qu'elles ne s'écrivent qu'à un endroit, et le balayage l'exige.

import { FINE, INSECABLE } from "./typographieFr"

/**
 * Le texte réduit à ce qui se compare : sans accent, en minuscules, avec une
 * seule sorte d'apostrophe et une seule sorte d'espace.
 *
 * `NFD` sépare la lettre de son accent ; on retire ensuite les accents. Les
 * ligatures, elles, ne se décomposent pas : « œ » doit être épelé à la main.
 */
export function pliage(valeur: unknown): string {
  if (typeof valeur !== "string" || !valeur) return ""
  return valeur
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/gi, m => (m === "œ" ? "oe" : "OE"))
    .replace(/æ/gi, m => (m === "æ" ? "ae" : "AE"))
    .replace(/[’‘ʼ`´]/g, "'")
    .replace(new RegExp(`[${INSECABLE}${FINE}\\s]+`, "g"), " ")
    .toLowerCase()
    .trim()
}

/**
 * Les mots d'une recherche. On coupe aussi sur l'apostrophe : quelqu'un qui tape
 * « l'epicerie » cherche « epicerie », et quelqu'un qui tape « epicerie » doit
 * trouver « L'Épicerie ».
 */
export function motsDeLaRecherche(requete: unknown): string[] {
  const p = pliage(requete)
  if (!p) return []
  const bruts = p.split(/[^a-z0-9@.+#]+/).filter(Boolean)
  // Une lettre seule ne porte pas d'intention : c'est l'article élidé de
  // « l'épicerie », « d'hiver ». L'exiger ferait manquer « Atelier » à qui tape
  // « l'atelier ». Une recherche d'UN seul caractère, elle, reste une recherche.
  const utiles = bruts.filter(m => m.length > 1)
  return utiles.length ? utiles : bruts
}

/**
 * Ce texte répond-il à cette recherche ?
 *
 * Chaque mot tapé doit se retrouver quelque part — pas forcément dans l'ordre, ni
 * collés. « cafe coin » trouve « Café du Coin » ; « vins carte » trouve « Carte
 * des vins ». Une recherche vide ne filtre rien.
 */
export function correspond(gisement: unknown, requete: unknown): boolean {
  const mots = motsDeLaRecherche(requete)
  if (!mots.length) return true
  const texte = pliage(gisement)
  if (!texte) return false
  return mots.every(m => texte.includes(m))
}

/**
 * La même chose sur plusieurs champs — un titre, une description, des
 * étiquettes. Les champs sont recollés : « comptoir menu » trouve une page
 * intitulée « Le Comptoir » dont la description parle du menu.
 */
export function correspondAuxChamps(champs: unknown[], requete: unknown): boolean {
  return correspond((champs ?? []).map(c => (typeof c === "string" ? c : "")).join(" "), requete)
}

/** Un prédicat prêt à poser dans un `.filter()`. */
export function filtreDe<T>(requete: unknown, champsDe: (x: T) => unknown[]): (x: T) => boolean {
  const mots = motsDeLaRecherche(requete)
  if (!mots.length) return () => true
  return (x: T) => correspondAuxChamps(champsDe(x), requete)
}

/**
 * Ce qu'on dit quand la recherche ne rend rien. Nommer ce qui a été cherché évite
 * le doute « est-ce que ma recherche a été prise en compte ? ».
 */
export function phraseAucunResultat(requete: unknown, rien = "Aucun résultat"): string {
  const q = typeof requete === "string" ? requete.trim() : ""
  // L'appelant passe la tournure complète — « Aucune page », « Aucun média » :
  // le genre du mot n'est pas quelque chose qu'on devine avec une règle.
  return q ? `${rien} pour « ${q} ».` : `${rien}.`
}
