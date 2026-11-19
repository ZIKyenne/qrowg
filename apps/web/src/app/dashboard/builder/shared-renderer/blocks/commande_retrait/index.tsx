"use client"
// commande_retrait — les deux adaptateurs (proximité, 19 nov.).
import { editorCtx, publicCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { lireArticles } from "../../models/commerceDeProximite"
import { CommandeVue, lienDeCommande } from "./PublicCommandeRetrait"

export function EditorCommandeRetrait({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!lireArticles(content?.articles).length) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🛍️" label="Indiquez les articles à commander" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <CommandeVue content={content} u={u} />
}

/** En ligne : rien sans article ni numéro où envoyer la commande. */
export function PublicCommandeRetrait({ content, ctx }: PublicAdapterProps) {
  const c = content || {}
  if (!lireArticles(c.articles).length || !lienDeCommande(c, "x")) return null
  return <CommandeVue content={c} u={publicCtx(ctx)} />
}
