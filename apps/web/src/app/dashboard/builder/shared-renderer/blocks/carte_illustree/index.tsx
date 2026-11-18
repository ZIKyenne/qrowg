"use client"
// carte_illustree — les deux adaptateurs (éditeur, page publiée). La vue vit dans
// PublicCarteIllustree.tsx : elle dessine un champ de recherche et des boutons aux
// couleurs du COMMERÇANT, donc dans la zone « page publiée » des gardes de
// vocabulaire (unSeulBouton, champQuiNeZoomePas), comme les autres blocs publics.
import { produitsDeLaCarte } from "../../models/carteIllustree"
import { editorCtx, publicCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { CarteIllustreeVue } from "./PublicCarteIllustree"

export function EditorCarteIllustree({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (produitsDeLaCarte(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🍔" label="Ajoutez votre premier produit" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <CarteIllustreeVue content={content} u={u} blockId={String((ctx as any)?.blockId ?? "edit")} />
}
export function PublicCarteIllustree({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (produitsDeLaCarte(c).length === 0) return null
  return <CarteIllustreeVue content={c} u={publicCtx(ctx)} blockId={String((ctx as any)?.blockId ?? "carte")} />
}
