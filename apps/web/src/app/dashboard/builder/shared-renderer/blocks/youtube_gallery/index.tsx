"use client"
// youtube_gallery — Des vidéos YouTube en vignettes, et le lien vers la chaîne.
// Une vidéo sans adresse utilisable n'existe pas ; le bouton de la chaîne non
// plus sans adresse — l'aperçu le dessinait dès qu'il avait un libellé.
import SmartImage from "@/components/SmartImage"
import { videosYoutube } from "../../models/medias"
import { SmartCta } from "../../primitives/LayoutSurface"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

type M = NonNullable<ReturnType<typeof videosYoutube>>

function Video({ u, v }: { u: UnifiedCtx; v: M["videos"][number] }) {
  const h = sz(u, 150)
  return (
    <SmartCta u={u} href={v.href} nomAccessible={v.titre ? `Vidéo : ${v.titre}` : "Voir la vidéo sur YouTube"} label={
      <>
        {v.vignette
          ? <SmartImage width={640} height={360} sizes="(max-width: 520px) 100vw, 520px" onError={e => { e.currentTarget.style.display = "none" }} src={v.vignette} alt="" style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} />
          : <div aria-hidden style={{ height: h, background: "rgba(255,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 28) }}>▶️</div>}
        <span aria-hidden style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ width: sz(u, 44), height: sz(u, 44), background: "rgba(255,0,0,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: sz(u, 16) }}>▶</span>
        </span>
        {v.titre && <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.85))", padding: `${sz(u, 24)}px ${sz(u, 12)}px ${sz(u, 10)}px`, color: "#fff", fontSize: sz(u, 12), fontFamily: u.FONT_B }}>{v.titre}</span>}
      </>
    } style={{ display: "block", borderRadius: sz(u, 11), overflow: "hidden", background: "#000", position: "relative", textDecoration: "none" }} />
  )
}

function Vue({ u, m }: { u: UnifiedCtx; m: M }) {
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={m.titre} marge={12} />
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: sz(u, 11) }}>
        {m.videos.map((v, i) => <li key={i}><Video u={u} v={v} /></li>)}
      </ul>
      {m.cta && <SmartCta u={u} href={m.cta.href} label={m.cta.label}
        style={{ display: "block", marginTop: sz(u, 11), background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: sz(u, 10), padding: sz(u, 12), textAlign: "center", fontSize: sz(u, 13), fontWeight: 700, color: u.lisible("#FF0000"), textDecoration: "none" }} />}
    </div>
  )
}

export function EditorYoutubeGallery({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = videosYoutube(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="▶️" label="Ajoutez le lien d’une vidéo" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicYoutubeGallery({ content, ctx }: PublicAdapterProps) {
  const m = videosYoutube(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
