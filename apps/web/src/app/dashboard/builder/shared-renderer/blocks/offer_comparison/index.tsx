"use client"
// offer_comparison — Le tableau de formules. L'apercu posait le bouton DANS
// chaque formule (trois boutons), la page en posait UN SEUL sous le tableau.
// Le commercant reglait un libelle et composait une mise en page qu'il
// n'obtenait pas. Une seule vue, donc un seul dessin.
import { comparaison } from "../../models/produitsEtTarifs"
import { TableauFormules } from "../../views/TableauFormules"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { editorCtx, publicCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

export function EditorOfferComparison({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const t = comparaison(content)
  if (!t) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="⚖️" label="Nommez au moins une formule" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <TableauFormules u={u} t={t} compact={false} />
}
export function PublicOfferComparison({ content, ctx }: PublicAdapterProps) {
  const t = comparaison(content)
  if (!t) return null
  return <TableauFormules u={publicCtx(ctx)} t={t} compact={false} />
}
