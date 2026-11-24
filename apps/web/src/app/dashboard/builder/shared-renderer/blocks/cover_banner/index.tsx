"use client"
// cover_banner — La bannière de couverture : image ou fond, voile, cadre,
// animation, texte incrusté, lien facultatif. Toute la géométrie vient des
// fonctions `banner*` de types.ts, partagées depuis longtemps ; seul le dessin
// était recopié — et l'aperçu peignait le fond dans la couleur d'ACCENT du
// thème quand la page le peignait dans la couleur PRIMAIRE.
import SmartImage from "@/components/SmartImage"
import { altDe } from "@/lib/texteAlternatif"
import { entierDuContenu } from "@/lib/nombreDuContenu"
import { bannerBackgroundStyle, bannerHeight, bannerImageStyle, bannerTitleStyle, bannerOverlayLayers, bannerFrame, BANNER_ANIM_CSS, destinationUtile } from "../../../types"
import { banniereVisible } from "../../models/affichagesSimples"
import { safeImageUrl } from "../../models/layoutStyle"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

const SIZES_PLEINE = "(max-width: 520px) 100vw, 520px"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const h = bannerHeight(c, u.mode)
  const src = safeImageUrl(c.src)
  const btype = c.banner_type || (src ? "image" : "gradient")
  const pos = c.text_position || "bottom-left"
  const anim = c.animation && c.animation !== "none" ? c.animation : null
  const rad = entierDuContenu(c.block_radius, 0, 0, 200)
  const txtColor = c.text_color || "#fff"
  const frame = bannerFrame(c, u.G, rad || 0)
  const centre = pos === "bottom-center" || pos === "center"
  const titre = String(c.cover_title || "").trim()
  const sousTitre = String(c.cover_subtitle || "").trim()
  const badge = String(c.badge || "").trim()
  const inner = (
    <div className={anim ? `qfb qfb-${anim}` : undefined} style={{ position: "relative", overflow: "hidden", borderRadius: rad || undefined, boxShadow: frame.boxShadow }}>
      {anim && <style>{BANNER_ANIM_CSS}</style>}
      {btype === "image"
        ? (src
          ? <SmartImage width={1600} height={600} sizes={SIZES_PLEINE} onError={e => { e.currentTarget.style.display = "none" }} className="qfb-media" src={src} alt={titre ? "" : altDe(c.title, "Bannière")} style={{ width: "100%", height: h, display: "block", ...bannerImageStyle(c) }} />
          : <div className="qfb-media" style={{ width: "100%", height: h, background: `linear-gradient(135deg,${u.G}33,${(u.theme as any)?.accent || "var(--success)"}22)` }} />)
        : <div className="qfb-media" style={{ width: "100%", height: h, ...bannerBackgroundStyle(c, u.G) }} />}
      {anim === "shimmer" && <div className="qfb-shine" />}
      {bannerOverlayLayers(c, u.G).map((l, i) => <div key={i} className={l.className} style={l.style} />)}
      {frame.borderLayer && <div style={frame.borderLayer.style} />}
      {(titre || sousTitre || badge) && (
        // Colonne : `justifyContent` place en HAUTEUR, `alignItems` en LARGEUR.
        // Les deux anciens rendus avaient inversé les axes — « en bas à gauche »
        // posait le texte en haut à droite (relevé au banc, rendu unique lot 2).
        <div className="qfb-content" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: pos === "center" ? "center" : "flex-end", alignItems: centre ? "center" : "flex-start", padding: `${sz(u, 16)}px ${sz(u, 22)}px`, textAlign: centre ? "center" : "left", gap: sz(u, 6) }}>
          {badge && <span style={{ alignSelf: pos === "bottom-left" ? "flex-start" : "center", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 20, padding: `${sz(u, 3)}px ${sz(u, 12)}px`, fontSize: sz(u, 11), fontWeight: 700 }}>{badge}</span>}
          {titre && <p style={bannerTitleStyle(c, u.mode, txtColor, u.FONT_D)}>{titre}</p>}
          {sousTitre && <p style={{ color: txtColor, opacity: 0.9, fontSize: sz(u, entierDuContenu(c.subtitle_size, 14, 8, 96)), margin: 0, textShadow: "0 1px 8px rgba(0,0,0,0.55)", fontFamily: u.FONT_B }}>{sousTitre}</p>}
        </div>
      )}
    </div>
  )
  // Le canvas ne suit aucun lien ; la page publiée, si — et compte le clic.
  const href = u.mode === "public" ? destinationUtile(c.link_url) : null
  if (!href) return inner
  return (
    <a href={href} target={c.link_blank !== "no" && /^https?:/i.test(href) ? "_blank" : undefined} rel="noopener noreferrer"
      onClick={() => { try { u.trackClick(c.link_url) } catch {} }} style={{ display: "block", textDecoration: "none", cursor: "pointer" }}>{inner}</a>
  )
}

export function EditorCoverBanner({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!banniereVisible(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🖼️" label="Ajoutez une image ou un titre" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicCoverBanner({ content, ctx }: PublicAdapterProps) {
  if (!banniereVisible(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
