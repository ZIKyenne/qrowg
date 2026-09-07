"use client"
// hero_banner — La grande banniere d'accueil. Deux ecarts corriges :
//
//  · l'apercu n'avait AUCUNE garde de vide : il dessinait une banniere de
//    180 px avec son degrade sur un bloc que la page ne publie pas ;
//  · il rendait un <img> brut pour l'image de fond — une photo de banniere en
//    pleine taille, sur le telephone de l'auteur, a chaque ouverture du canvas.
import { hero } from "../../models/structurePage"
import { sharedImageModel } from "../../models/sharedImage"
import { PublicSharedImage } from "../../primitives/PublicImage"
import { EditorSharedImage } from "../../primitives/EditorImage"
import { destinationUtile } from "../../../types"
import { avecCibleTactile } from "../../primitives/BlockCtaLink"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c, accent }: { u: UnifiedCtx; c: Record<string, any>; accent: string }) {
  const h = hero(c)!
  const hauteur = sz(u, h.hauteur)
  const photo = sharedImageModel(h.image, { decorative: true })
  const styleImg = { width: "100%", height: hauteur, objectFit: "cover" as const, display: "block" }
  const alignement = h.aGauche ? "flex-start" : "center"
  const texteAligne = h.aGauche ? ("left" as const) : ("center" as const)
  const styles = [
    { background: `linear-gradient(90deg,${u.G},${u.G}cc)`, color: "#080808", fontWeight: 700 },
    { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 600 },
  ]
  return (
    <div style={{ padding: `${sz(u, 10)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 14 }}>
        {photo.src
          ? (u.mode === "public"
            ? <PublicSharedImage model={photo} width={1600} height={900} sizes="(max-width: 520px) 100vw, 520px" style={styleImg} />
            : <EditorSharedImage model={photo} width={1600} height={900} sizes="(max-width: 520px) 100vw, 520px" style={styleImg} />)
          : <div aria-hidden style={{ width: "100%", height: hauteur, background: h.couleurFond || `linear-gradient(135deg,${u.G}30,${accent}15,#080808)` }} />}
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 20%,rgba(0,0,0,0.7) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: alignement, justifyContent: "flex-end", padding: sz(u, 22) }}>
          {h.titre && <h2 style={{ color: "#fff", fontSize: sz(u, h.hauteur >= 280 ? 28 : 22), fontWeight: 700, margin: `0 0 ${sz(u, 6)}px`, fontFamily: u.FONT_D, textAlign: texteAligne, textShadow: "0 2px 10px rgba(0,0,0,0.5)", lineHeight: 1.2 }}>{h.titre}</h2>}
          {h.sousTitre && <p style={{ color: "rgba(255,255,255,0.85)", fontSize: sz(u, 14), margin: `0 0 ${sz(u, 15)}px`, textAlign: texteAligne, fontFamily: u.FONT_B }}>{h.sousTitre}</p>}
          <div style={{ display: "flex", gap: sz(u, 9), flexWrap: "wrap", justifyContent: h.aGauche ? "flex-start" : "center" }}>
            {h.boutons.map((b, i) => {
              const href = destinationUtile(c[b.cle])
              const style = avecCibleTactile({ ...styles[i], borderRadius: 10, padding: `${sz(u, 11)}px ${sz(u, 20)}px`, fontSize: sz(u, 13), textDecoration: "none", fontFamily: u.FONT_B })
              if (!href) return null
              return u.mode === "public"
                ? <a key={i} href={href} target={/^https?:/i.test(href) ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => u.trackClick(href)} style={style}>{b.label}</a>
                : <div key={i} aria-disabled="true" style={style}>{b.label}</div>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EditorHeroBanner({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!hero(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🖼️" label="Ajoutez un titre ou une image de fond" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} accent={ctx.accent} />
}
export function PublicHeroBanner({ content, ctx }: PublicAdapterProps) {
  if (!hero(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} accent={(ctx.theme as any)?.accent || "var(--success)"} />
}
