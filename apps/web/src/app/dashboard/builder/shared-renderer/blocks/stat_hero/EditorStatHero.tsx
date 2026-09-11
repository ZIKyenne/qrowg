"use client"
// Adapter ÉDITEUR de stat_hero, à part : l'état vide est du code d'édition et ne doit
// pas entrer dans le bundle de la page publiée (voir bundleBoundary.test.ts).
import { View } from "."
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { editorCtx, type EditorAdapterProps } from "../../renderTypes"

export function EditorStatHero({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const c = content || {}
  // Livré vide depuis le 10 septembre : le produit n'écrit plus la preuve à la place
  // de l'utilisateur. Le bloc ne publie rien tant qu'il n'a pas la sienne.
  if (!String(c.value || "").trim()) {
    return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📈" label="Votre chiffre qui compte" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  }
  return <View content={c} u={u} />
}
