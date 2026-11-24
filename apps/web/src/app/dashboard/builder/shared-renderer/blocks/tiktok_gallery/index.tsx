"use client"
// tiktok_gallery — Jusqu'à trois vidéos TikTok, et le lien vers le compte.
// Le bloc publiait un cadre VIDE quand seule l'adresse du compte était
// remplie : le bouton exigeait aussi un libellé. Il a maintenant un libellé
// par défaut, puisque c'est lui qui fait exister le bloc.
import { galerieTiktok } from "../../models/medias"
import { SmartCta } from "../../primitives/LayoutSurface"
import { TitreSection, pagePad } from "../../views/TitreSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

type M = NonNullable<ReturnType<typeof galerieTiktok>>

function Vue({ u, m }: { u: UnifiedCtx; m: M }) {
  return (
    <div style={{ padding: pagePad(u), fontFamily: u.FONT_B }}>
      <TitreSection u={u} titre={m.titre} />
      {m.pseudo && <p style={{ color: u.MUTED, fontSize: sz(u, 12), margin: `0 0 ${sz(u, 10)}px`, textAlign: "center" }}>{m.pseudo}</p>}
      {m.videos.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: sz(u, 6) }}>
          {/* Les tuiles se ressemblent : le nom accessible dit laquelle on ouvre. */}
          {m.videos.map((href, i) => (
            <li key={i} style={{ display: "flex" }}>
              <SmartCta u={u} href={href} nomAccessible={`${m.pseudo ? `${m.pseudo} — ` : ""}TikTok ${i + 1} sur ${m.videos.length}`} label={<span aria-hidden>🎵</span>}
                style={{ flex: 1, aspectRatio: "9/16", background: "linear-gradient(135deg,rgba(255,0,80,0.15),rgba(0,242,234,0.15))", border: `1px solid ${u.LINE}`, borderRadius: sz(u, 9), display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 22), textDecoration: "none" }} />
            </li>
          ))}
        </ul>
      )}
      {m.cta && <SmartCta u={u} href={m.cta.href} label={m.cta.label}
        style={{ display: "block", marginTop: sz(u, 11), background: "linear-gradient(90deg,#ff0050,#00f2ea)", borderRadius: sz(u, 10), padding: sz(u, 12), textAlign: "center", fontSize: sz(u, 13), fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: u.FONT_B }} />}
    </div>
  )
}

export function EditorTiktokGallery({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  const m = galerieTiktok(content)
  if (!m) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="🎵" label="Ajoutez le lien d’une vidéo" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} m={m} />
}
export function PublicTiktokGallery({ content, ctx }: PublicAdapterProps) {
  const m = galerieTiktok(content)
  if (!m) return null
  return <Vue u={publicCtx(ctx)} m={m} />
}
