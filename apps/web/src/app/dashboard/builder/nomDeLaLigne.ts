// nomDeLaLigne — une ligne qui se répète porte le nom de ce qu'elle contient.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F11, F12). La page
// affiche « Wi-Fi », « Prises », « Terrasse », « Chiens acceptés ». Le panneau,
// en face, affiche « Icône 1 », « Icône 2 », « Icône 3 », « Icône 4 » — et
// deux emplacements vides de plus. Pour changer « Wi-Fi », il faut ouvrir les
// lignes une par une jusqu'à tomber dessus.
//
// **Le produit a déjà le bon geste.** `RepeaterEditor`, dans `builderPanels`,
// fait tout ce qu'il faut : il ne montre que les lignes remplies plus une,
// donne « Ajouter un plat », et pose sur chaque ligne monter / descendre /
// supprimer. **Trente-neuf types de blocs l'utilisent.** Mais son en-tête dit
// « Plat 1 », « Produit 2 » : la même numérotation, dans le bon composant.
//
// Et **vingt-huit types de blocs ne l'utilisent pas du tout** — dont la rangée
// d'icônes du relevé. Ils tombent dans la liste générique de champs, qui
// déroule les emplacements à plat, vides compris : c'est de là que viennent
// « Icône 5 » et « Icône 6 », visibles alors que la page n'en montre que
// quatre.
//
// La classe : **une ligne qui se répète porte le nom de ce qu'elle contient.**
//
// Module PUR : il ne choisit pas un champ « titre » déclaré quelque part — il
// prend le premier texte que la personne a écrit, dans l'ordre où le panneau le
// lui demande. C'est exactement ce qu'elle reconnaîtra.

/** Ce qu'un champ de ligne déclare : son suffixe de clé, et sa nature. */
export type ChampDeLigne = { suffix: string; kind?: string }

/** Au-delà, un nom d'en-tête déborde de la largeur du panneau. */
export const NOM_MAX = 28

/**
 * Une adresse, une image, un fichier ne nomment pas une ligne : personne ne
 * reconnaît sa ligne à « https://… ». Seul ce qui se lit compte.
 */
function seLit(c: ChampDeLigne): boolean {
  return !c.kind || c.kind === "text" || c.kind === "textarea"
}

/**
 * Le nom à montrer en tête d'une ligne répétée, ou `repli` — « Plat 1 » —
 * tant qu'il n'y a rien à lire.
 *
 * @param champs   les champs de la ligne, dans l'ordre du panneau.
 * @param valeurs  ce qui est saisi, par suffixe.
 * @param repli    ce qu'on dit quand la ligne est encore vide.
 */
export function nomDeLaLigne(
  champs: readonly ChampDeLigne[],
  valeurs: Record<string, string | undefined> | null | undefined,
  repli: string,
): string {
  const v = valeurs || {}
  for (const c of champs) {
    if (!seLit(c)) continue
    const brut = typeof v[c.suffix] === "string" ? (v[c.suffix] as string) : ""
    // Un retour à la ligne dans un en-tête casse la ligne du panneau.
    const t = brut.replace(/\s+/g, " ").trim()
    if (!t) continue
    return t.length > NOM_MAX ? `${t.slice(0, NOM_MAX - 1).trimEnd()}…` : t
  }
  return repli
}
