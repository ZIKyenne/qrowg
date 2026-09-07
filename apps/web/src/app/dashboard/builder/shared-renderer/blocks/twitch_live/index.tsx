"use client"
// twitch_live — Le badge « ● LIVE » et le nombre de spectateurs ne s'affichent
// que si le statut est « live » : sinon la page annoncerait un direct qui n'a pas lieu.
import { chaine, type Reglage } from "../../models/chaines"
import { CarteChaine } from "../../views/CarteChaine"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const REGLAGE: Reglage = { cleNom: "username", labelParDefaut: "Rejoindre le live", lignes: [{ champ: "game", icone: "🎯" }, { champ: "viewers", icone: "👁", couleur: "#9146FF", siEnDirect: true }] }

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const ch = chaine(c, REGLAGE)!
  return <CarteChaine u={u} ch={ch} icone={"🎮"} fond={ch.enDirect ? "rgba(145,70,255,0.1)" : u.FILL} bordure={ch.enDirect ? "rgba(145,70,255,0.4)" : u.LINE} rayonIcone={10} fondIcone={"rgba(145,70,255,0.2)"} bouton={{ display: "block", background: "#9146FF", color: "#fff", textAlign: "center" as const, padding: `${sz(u, 11)}px`, borderRadius: 9, fontSize: sz(u, 13), fontWeight: 700, textDecoration: "none", fontFamily: u.FONT_B }} />
}

export function EditorTwitchLive({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!chaine(content, REGLAGE)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon={"🎮"} label={"Ajoutez le lien de votre chaîne Twitch"} sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicTwitchLive({ content, ctx }: PublicAdapterProps) {
  if (!chaine(content, REGLAGE)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
