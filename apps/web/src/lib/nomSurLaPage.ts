// nomSurLaPage.ts — le nom saisi à la création devient le nom affiché sur la page.
//
// Parcours d'un gérant de bar (17 novembre) : il tape « Le Comptoir » dans la
// fenêtre de création, et sa page s'ouvre sur « The Alchemist » — le nom
// d'exemple du modèle. Le nom saisi ne nommait que le projet. Ici, il remplace
// le nom du premier bloc d'identité (`profile`), le seul qui affiche un nom en
// tête de page dans tous les modèles. Module PUR.

type Bloc = { type: string; content?: Record<string, unknown> | null }

export function avecLeNomSurLaPage<B extends Bloc>(blocs: readonly B[], nom: string): B[] {
  const propre = nom.trim()
  if (!propre) return [...blocs]
  const i = blocs.findIndex(b => b.type === "profile")
  if (i < 0) return [...blocs]
  return blocs.map((b, j) => (j === i ? { ...b, content: { ...(b.content ?? {}), name: propre } } : b))
}
