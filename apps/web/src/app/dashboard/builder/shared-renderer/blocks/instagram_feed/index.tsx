"use client"
// instagram_feed — Il n'y a PAS d'integration du fil Instagram : la page ne
// publie que le bouton « Me suivre ». C'est le seul bloc de la famille qui
// avait deja la bonne regle — rien sans adresse — et elle vaut maintenant pour
// les six autres.
import { chaine, type Reglage } from "../../models/chaines"
import { BoutonChaine } from "../../views/CarteChaine"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const REGLAGE: Reglage = { cleNom: "username", labelParDefaut: "Me suivre sur Instagram" }

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const ch = chaine(c, REGLAGE)!
  return (
    <div style={{ padding: `${sz(u, 6)}px ${sz(u, 24)}px ${sz(u, 16)}px`, fontFamily: u.FONT_B }}>
      {ch.nom && <p style={{ color: u.MUTED, fontSize: sz(u, 12), textAlign: "center", margin: `0 0 ${sz(u, 8)}px`, fontFamily: u.FONT_B }}>{ch.nom}</p>}
      <BoutonChaine u={u} ch={ch} style={{ display: "block", background: "rgba(225,48,108,0.1)", border: "1px solid rgba(225,48,108,0.25)", color: "#E1306C", textAlign: "center", padding: `${sz(u, 12)}px`, borderRadius: 9, textDecoration: "none", fontSize: sz(u, 13), fontWeight: 700, fontFamily: u.FONT_B }} />
    </div>
  )
}

export function EditorInstagramFeed({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!chaine(content, REGLAGE)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="📸" label="Ajoutez le lien de votre profil Instagram" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicInstagramFeed({ content, ctx }: PublicAdapterProps) {
  if (!chaine(content, REGLAGE)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
