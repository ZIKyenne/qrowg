"use client"
// telegram_channel — Meme defaut que discord_server : un bouton dessine dans
// l'apercu quoi qu'il arrive, une page qui n'en publie pas sans adresse.
import { chaine, type Reglage } from "../../models/chaines"
import { CarteChaine } from "../../views/CarteChaine"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const REGLAGE: Reglage = { cleNom: "channel_name", labelParDefaut: "Rejoindre le canal", lignes: [{ champ: "members", icone: "👥" }, { champ: "description" }] }

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const ch = chaine(c, REGLAGE)!
  return <CarteChaine u={u} ch={ch} icone={"✈️"} fond={"rgba(38,165,228,0.08)"} bordure={"rgba(38,165,228,0.25)"} rayonIcone={"50%"} fondIcone={"rgba(38,165,228,0.2)"} bouton={{ display: "block", background: "#26A5E4", color: "#fff", textAlign: "center" as const, padding: `${sz(u, 12)}px`, borderRadius: 9, fontSize: sz(u, 13), fontWeight: 700, textDecoration: "none", fontFamily: u.FONT_B }} />
}

export function EditorTelegramChannel({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!chaine(content, REGLAGE)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon={"✈️"} label={"Ajoutez le lien de votre canal"} sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicTelegramChannel({ content, ctx }: PublicAdapterProps) {
  if (!chaine(content, REGLAGE)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
