"use client"
// event_guests — Les invites d'un evenement. Deux ecarts : l'apercu rendait un
// <img> brut pour chaque photo (l'original en pleine taille, autant de fois
// qu'il y a d'invites), et il ecrasait le role a 9 px et la description a
// 10 px, contre 13 et 13,5 en ligne — bien au-dela de son echelle.
import { invites, initialeInvite } from "../../models/evenement"
import { sharedImageModel } from "../../models/sharedImage"
import { PublicSharedImage } from "../../primitives/PublicImage"
import { EditorSharedImage } from "../../primitives/EditorImage"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const ROSE = "#EC4899"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const liste = invites(c)
  const titre = (c.title || "").trim()
  const cote = sz(u, 58)
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      {titre && <p style={{ color: u.MUTED, fontSize: sz(u, 11), textTransform: "uppercase", letterSpacing: 2, margin: `0 0 ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>{titre}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: sz(u, 11) }}>
        {liste.map((g, i) => {
          const photo = sharedImageModel(g.photo, { alt: g.nom })
          const styleImg = { width: cote, height: cote, borderRadius: "50%", objectFit: "cover" as const, margin: `0 auto ${sz(u, 9)}px`, display: "block", border: `2px solid ${ROSE}66` }
          return (
            <div key={i} style={{ background: `${ROSE}0f`, border: `1px solid ${ROSE}26`, borderRadius: 13, padding: `${sz(u, 14)}px ${sz(u, 11)}px`, textAlign: "center" }}>
              {photo.src
                ? (u.mode === "public"
                  ? <PublicSharedImage model={photo} width={116} height={116} sizes="58px" style={styleImg} />
                  : <EditorSharedImage model={photo} width={116} height={116} sizes="58px" style={styleImg} />)
                : <div aria-hidden style={{ width: cote, height: cote, borderRadius: "50%", background: `linear-gradient(135deg,${ROSE},#F472B6)`, margin: `0 auto ${sz(u, 9)}px`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 22), fontWeight: 700, color: "#fff", fontFamily: u.FONT_D }}>{initialeInvite(g.nom)}</div>}
              <p style={{ color: u.TEXT, fontSize: sz(u, 13), fontWeight: 700, margin: `0 0 ${sz(u, 3)}px`, fontFamily: u.FONT_B }}>{g.nom}</p>
              {g.role && <span style={{ background: `${ROSE}1f`, border: `1px solid ${ROSE}40`, borderRadius: 20, padding: `${sz(u, 2)}px ${sz(u, 9)}px`, color: ROSE, fontSize: sz(u, 13), fontWeight: 700, fontFamily: u.FONT_B }}>{g.role}</span>}
              {g.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13.5), margin: `${sz(u, 5)}px 0 0`, fontFamily: u.FONT_B }}>{g.description}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EditorEventGuests({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (invites(content).length === 0) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎤" label="Ajoutez un invité" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicEventGuests({ content, ctx }: PublicAdapterProps) {
  if (invites(content).length === 0) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
