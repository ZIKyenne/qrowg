"use client"
// Adapter ÉDITEUR de avatar_row, à part : l'état vide est du code d'édition et ne doit
// pas entrer dans le bundle de la page publiée (voir bundleBoundary.test.ts).
import { View, rowAvatars } from "."
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { editorCtx, type EditorAdapterProps } from "../../renderTypes"

export function EditorAvatarRow({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const c = content || {}
  // Livré vide depuis le 10 septembre : le produit n'écrit plus la preuve à la place
  // de l'utilisateur. Le bloc ne publie rien tant qu'il n'a pas la sienne.
  if (rowAvatars(c).length === 0 && !c.count && !c.label) {
    return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="👥" label="Vos clients, en chiffre réel" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  }
  return <View content={c} u={u} />
}
