// motion.ts — MOTION SYSTEM QRowg. Source UNIQUE des durées et easings du mouvement.
// (Master System, Règle 5 : chaque animation appartient au Motion System.)
//
// Deux surfaces, une intention :
//  • CSS/global : variables `--mo-*` + keyframes `mo-*` + classes `.mo-*` définies
//    dans app/globals.css (utiliser en priorité les classes utilitaires).
//  • Style inline JSX : ces constantes + helpers `anim()` / `transition()`.
//  • Mobile : voir aussi `components/mobile/designTokens.ts` (T.motion / T.ease),
//    aligné sur ces valeurs (fast/base/sheet identiques).
//
// Règle : ne jamais écrire une durée ou une courbe « à la main ». On passe par ici.
// Pur -> testable (motion.test.ts).
//
// ── Ce que « par construction » voulait dire (lot v133) ──────────────────────
//
// `globals.css` portait cette phrase, sous la règle d'accessibilité :
//
//     « Accessibilité : le Motion System respecte reduced-motion par construction. »
//
// Et c'était vrai — pour les CLASSES. Une feuille de style ne peut viser que ce
// qu'elle connaît : `.mo-spin { animation: none !important }` n'atteint que les
// éléments qui portent `mo-spin`. Or le produit pose **117 animations en style
// inline**, et **69 d'entre elles jouent les images-clés du système** —
// `mo-spin` 52 fois, `mo-pulse` 11, `mo-fade-up` 6 — écrites dans l'attribut
// `style`, donc sans la classe. Elles échappaient toutes à la protection écrite
// pour elles.
//
// Une personne qui a réglé son téléphone sur « réduire les animations » le fait
// souvent parce que le mouvement lui donne la nausée. Elle scanne le QR d'un
// restaurant, la page s'ouvre, et ça tourne quand même.
//
// La règle est réparée dans `globals.css`, par un sélecteur d'ATTRIBUT qui voit
// ce qu'un sélecteur de classe ne peut pas voir. Ce module, lui, reste la source
// des durées et des courbes ; `mouvementQuiSeCoupe.test.ts` est le balayage qui
// lui manquait — il vérifie que les valeurs d'ici et celles de la feuille de
// style disent bien la même chose, ce que seul un commentaire affirmait.

// Durées en millisecondes, du plus rapide au plus lent.
export const DURATION = {
  instant: 80,  // micro-retour tactile (:active)
  fast: 120,    // hover, petits changements d'état (= T.motion.fast)
  base: 250,    // transitions d'état standard (= T.motion.base)
  sheet: 300,   // feuilles montantes / overlays (= T.motion.sheet)
  slow: 400,    // entrées marquées, séquences chorégraphiées
} as const

// Easings nommés par RÔLE (consolident ~20 variantes disséminées dans le code).
export const EASE = {
  standard:   "cubic-bezier(.2,.8,.2,1)",     // défaut : accél/décél doux (le + fréquent, 31 usages)
  entrance:   "cubic-bezier(.16,1,.3,1)",     // arrivées : démarre vite, finit très doux
  spring:     "cubic-bezier(.34,1.56,.64,1)", // rebond/overshoot : pastilles, pop, badges
  emphasized: "cubic-bezier(.4,0,.2,1)",      // Material : sorties / mouvements appuyés
} as const

export type DurationKey = keyof typeof DURATION
export type EaseKey = keyof typeof EASE

// Construit une valeur `animation` (style inline). `extra` = "infinite", "backwards"…
export function anim(
  name: string,
  duration: DurationKey = "base",
  ease: EaseKey = "standard",
  extra = "",
): string {
  return `${name} ${DURATION[duration]}ms ${EASE[ease]}${extra ? " " + extra : ""}`.trim()
}

// Construit une valeur `transition` (style inline) pour une ou plusieurs propriétés.
export function transition(
  props: string | readonly string[] = "all",
  duration: DurationKey = "fast",
  ease: EaseKey = "standard",
): string {
  const list = Array.isArray(props) ? props : [props as string]
  return list.map((p) => `${p} ${DURATION[duration]}ms ${EASE[ease]}`).join(", ")
}
