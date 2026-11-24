"use client"
// video_testimonials — Des clients qui témoignent, en vidéo YouTube ou en
// citation. Livré vide : le produit ne met pas de témoignage dans la bouche
// d'un client. Une carte avec vidéo s'ouvre sur YouTube ; sans, elle se lit.
import SmartImage from "@/components/SmartImage"
import { temoignagesVideo } from "../../models/medias"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

type M = NonNullable<ReturnType<typeof temoignagesVideo>>

function Carte({ u, t }: { u: UnifiedCtx; t: M["items"][number] }) {
  const corps = (
    <>
      {t.vignette && (
        <div style={{ position: "relative" }}>
          <SmartImage width={640} height={360} sizes="(max-width: 520px) 100vw, 520px" onError={e => { e.currentTarget.style.display = "none" }} src={t.vignette} alt="" style={{ width: "100%", height: sz(u, 130), objectFit: "cover", display: "block" }} />
          <div aria-hidden style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: sz(u, 40), height: sz(u, 40), background: "rgba(0,0,0,0.7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: sz(u, 15) }}>▶</div>
          </div>
        </div>
      )}
      <div style={{ padding: `${sz(u, 12)}px ${sz(u, 14)}px` }}>
        {t.citation && <p style={{ color: u.TEXT, fontSize: sz(u, 13), fontStyle: "italic", margin: `0 0 ${sz(u, 7)}px`, lineHeight: 1.5, fontFamily: u.FONT_B }}>&quot;{t.citation}&quot;</p>}
        <p style={{ color: u.G, fontSize: sz(u, 13), fontWeight: 700, margin: 0, fontFamily: u.FONT_B }}>{t.nom}{t.entreprise ? <span style={{ color: u.MUTED, fontWeight: 400 }}> — {t.entreprise}</span> : null}</p>
      </div>
    </>
  )
  const st = { display: "block", background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: sz(u, 13), overflow: "hidden", textDecoration: "none" } as const
  if (u.mode === "public" && t.href) {
    const href = t.href
    return <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Témoignage vidéo de ${t.nom}`} onClick={() => { try { u.trackClick(href) } catch {} }} style={st}>{corps}</a>
  }
  return <div style={st}>{corps}</div>
}

function Vue({ u, m }: { u: UnifiedCtx; m: M }) {
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={m.titre} marge={12} />
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: sz(u, 11) }}>
        {m.items.map((t, i) => <li key={i}><Carte u={u} t={t} /></li>)}
      </ul>
    </div>
  )
}

export function EditorVideoTestimonials({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = temoignagesVideo(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎥" label="Ajoutez une vidéo de client" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicVideoTestimonials({ content, ctx }: PublicAdapterProps) {
  const m = temoignagesVideo(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
