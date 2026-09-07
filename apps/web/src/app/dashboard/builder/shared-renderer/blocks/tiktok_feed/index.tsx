"use client"
// tiktok_feed — Le plus gros mensonge de la famille : l'apercu dessinait SIX
// FAUSSES VIGNETTES VIDEO en 9/16, avec une note de musique dedans. Il n'y a
// aucune integration TikTok — la page ne publie qu'une carte avec le pseudo et
// un bouton. Le commercant croyait donc composer un mur de videos qui
// n'existerait jamais sur sa page.
//
// Et l'inverse aussi : la page publiait « Voir sur TikTok » par defaut, que
// l'apercu ne montrait pas tant que le libelle n'etait pas saisi a la main.
import { chaine, type Reglage } from "../../models/chaines"
import { BoutonChaine } from "../../views/CarteChaine"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const REGLAGE: Reglage = { cleNom: "username", labelParDefaut: "Voir sur TikTok" }

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const ch = chaine(c, REGLAGE)!
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>
      <div style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${u.LINE}`, borderRadius: 13, padding: sz(u, 15), textAlign: "center" }}>
        <span aria-hidden style={{ fontSize: sz(u, 30), display: "block", marginBottom: sz(u, 8) }}>🎵</span>
        {ch.nom && <p style={{ color: u.TEXT, fontSize: sz(u, 14), fontWeight: 700, margin: `0 0 ${sz(u, 10)}px`, fontFamily: u.FONT_B }}>{ch.nom}</p>}
        <BoutonChaine u={u} ch={ch} style={{ display: "block", background: "linear-gradient(90deg,#ff0050,#00f2ea)", color: "#fff", padding: `${sz(u, 11)}px`, borderRadius: 9, fontSize: sz(u, 13), fontWeight: 700, textDecoration: "none", fontFamily: u.FONT_B }} />
      </div>
    </div>
  )
}

export function EditorTiktokFeed({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!chaine(content, REGLAGE)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎵" label="Ajoutez le lien de votre profil TikTok" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicTiktokFeed({ content, ctx }: PublicAdapterProps) {
  if (!chaine(content, REGLAGE)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
