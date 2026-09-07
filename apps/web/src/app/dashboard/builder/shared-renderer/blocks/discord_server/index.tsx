"use client"
// discord_server — L'apercu dessinait TOUJOURS le bouton, avec « Rejoindre le
// Discord » par defaut, meme sans adresse. La page ne publie rien sans lien.
import { chaine, type Reglage } from "../../models/chaines"
import { CarteChaine } from "../../views/CarteChaine"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const REGLAGE: Reglage = { cleNom: "server_name", labelParDefaut: "Rejoindre le Discord", lignes: [{ champ: "members", icone: "👥" }, { champ: "description" }] }

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const ch = chaine(c, REGLAGE)!
  return <CarteChaine u={u} ch={ch} icone={"🎮"} fond={"rgba(88,101,242,0.08)"} bordure={"rgba(88,101,242,0.25)"} rayonIcone={12} fondIcone={"rgba(88,101,242,0.2)"} bouton={{ display: "block", background: "#5865F2", color: "#fff", textAlign: "center" as const, padding: `${sz(u, 12)}px`, borderRadius: 9, fontSize: sz(u, 13), fontWeight: 700, textDecoration: "none", fontFamily: u.FONT_B }} />
}

export function EditorDiscordServer({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!chaine(content, REGLAGE)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon={"🎮"} label={"Ajoutez le lien d’invitation du serveur"} sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicDiscordServer({ content, ctx }: PublicAdapterProps) {
  if (!chaine(content, REGLAGE)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
