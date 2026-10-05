// Les ruptures de largeur du produit. Quatre, et c'est tout.
//
// ── Ce qui a motivé ce fichier ─────────────────────────────────────────────
//
// Relevé du 5 octobre 2026 : **44 ruptures de largeur distinctes** dans le
// dépôt. Les plus fréquentes en CSS : 640 (×30), 520 (×19), 620 (×12), 900
// (×12), 1024 (×11). Et **huit** valeurs différentes passées à `useIsMobile()` :
// 620, 700, 768, 859, 860, 900, 1024, 1500.
//
// Deux d'entre elles disent la même chose à un pixel près — 859 pour le QR
// Studio, 860 pour la galerie de modèles, « aligné sur le shell » dit le
// commentaire. Personne ne peut prévoir ce que fait un écran à 700 px, parce que
// la réponse dépend du fichier qu'on regarde.
//
// La cause n'est pas la négligence : c'est que **8 761 styles inline** portent la
// mise en page du tableau de bord, et qu'un style inline ne peut pas contenir de
// media query. Chaque décision responsive a donc dû passer par du JavaScript, et
// comme aucun jeton n'imposait de seuil, chaque écran a choisi le sien.
//
// ── Pourquoi ce n'est pas un jeton CSS ─────────────────────────────────────
//
// On aimerait écrire `@media (max-width: var(--bp-md))`. **Ça ne marche pas** :
// une variable CSS n'est pas évaluable dans la condition d'une media query (elle
// l'est dans une déclaration, pas dans le prélude de la règle). Déclarer
// `--bp-md` donnerait l'illusion d'une source unique que le CSS ignorerait.
//
// La source unique est donc ce module TypeScript, et une **garde** vérifie que
// les littéraux du CSS lui correspondent : `ruptureUnique.test.ts`. C'est moins
// élégant qu'un jeton, c'est vérifiable, et c'est la seule des deux options qui
// soit vraie.
//
// ── Les quatre, et ce qu'elles veulent dire ────────────────────────────────

export const RUPTURES = {
  /** 360 — petit téléphone. En dessous, on serre : 2 colonnes deviennent 1. */
  sm: 360,
  /** 640 — la frontière du tactile. En dessous : feuilles, pas de modales, une colonne. */
  md: 640,
  /** 900 — tablette portrait. En dessous : pas de barre latérale permanente. */
  lg: 900,
  /** 1200 — desktop large. Au-dessus : on peut afficher trois colonnes. */
  xl: 1200,
} as const

export type Rupture = keyof typeof RUPTURES

/** La largeur d'une rupture nommée. */
export function largeurDe(r: Rupture): number {
  return RUPTURES[r]
}

/** La media query correspondante, pour `matchMedia` ou une feuille générée. */
export function requete(r: Rupture): string {
  return `(max-width: ${RUPTURES[r]}px)`
}

/**
 * « Compact » = l'interface tactile : feuilles montantes, une colonne, lignes de
 * 56 px. La frontière est `md`, et elle est la même partout.
 */
export function estCompact(largeur: number): boolean {
  return largeur <= RUPTURES.md
}

/**
 * La densité, telle que la portera l'attribut `data-densite` de la racine.
 *
 * C'est le pont entre les 8 761 styles inline et le CSS : plutôt que de
 * convertir 8 761 styles — un *rewrite* déguisé —, un style inline lit un jeton
 * (`var(--pad-carte)`) dont la valeur est redéfinie UNE fois par media query.
 * Zéro JavaScript dans la décision, zéro re-rendu, et c'est auditable par grep.
 */
export function densite(largeur: number): "compacte" | "confortable" {
  return estCompact(largeur) ? "compacte" : "confortable"
}

/**
 * Le palier dans lequel tombe une largeur. `null` au-delà de `xl` : il n'y a pas
 * de cinquième nom à inventer pour « très grand », et en inventer un ferait
 * revenir la cinquième rupture par la fenêtre.
 */
export function palier(largeur: number): Rupture | null {
  if (largeur <= RUPTURES.sm) return "sm"
  if (largeur <= RUPTURES.md) return "md"
  if (largeur <= RUPTURES.lg) return "lg"
  if (largeur <= RUPTURES.xl) return "xl"
  return null
}

/** Les quatre largeurs, croissantes. Sert aux gardes et aux relevés. */
export const LARGEURS_CONNUES: readonly number[] = Object.values(RUPTURES).sort((a, b) => a - b)
