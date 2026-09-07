"use client"
// youtube_channel — La page publiait un bouton « S'abonner » que l'apercu ne
// montrait pas tant que le libelle n'etait pas saisi a la main. Meme libelle par
// defaut des deux cotes desormais.
import { chaine, type Reglage } from "../../models/chaines"
import { CarteChaine } from "../../views/CarteChaine"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const REGLAGE: Reglage = { cleNom: "channel_name", labelParDefaut: "S’abonner", lignes: [{ champ: "subscribers" }] }

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const ch = chaine(c, REGLAGE)!
  return <CarteChaine u={u} ch={ch} icone={"▶️"} fond={"transparent"} bordure={"transparent"} rayonIcone={"50%"} fondIcone={"rgba(255,0,0,0.15)"} bouton={{ display: "block", background: "#FF0000", color: "#fff", textAlign: "center" as const, padding: `${sz(u, 12)}px`, borderRadius: 9, fontSize: sz(u, 13), fontWeight: 700, textDecoration: "none", fontFamily: u.FONT_B }} />
}

export function EditorYoutubeChannel({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!chaine(content, REGLAGE)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon={"▶️"} label={"Ajoutez le lien de votre chaîne"} sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicYoutubeChannel({ content, ctx }: PublicAdapterProps) {
  if (!chaine(content, REGLAGE)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
