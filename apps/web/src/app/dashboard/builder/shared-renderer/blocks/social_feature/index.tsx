"use client"
// social_feature — Une grande carte pour UN reseau. L'apercu rendait un <img>
// brut pour la banniere (l'original en pleine taille sur le telephone de
// l'auteur) ; la page passait deja par SmartImage. Et le bloc se publiait avec
// un simple titre, sans adresse : depuis que le rendu ne publie plus de lien
// mort, la carte entiere disparaissait — le lien EST la carte.
import { reseauVedette } from "../../models/chaines"
import { sharedImageModel } from "../../models/sharedImage"
import { PublicSharedImage } from "../../primitives/PublicImage"
import { EditorSharedImage } from "../../primitives/EditorImage"
import { avecCibleTactile } from "../../primitives/BlockCtaLink"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c }: { u: UnifiedCtx; c: Record<string, any> }) {
  const r = reseauVedette(c)!
  const photo = sharedImageModel(r.image, { decorative: true })
  const styleImg = { width: "100%", height: sz(u, 130), objectFit: "cover" as const, display: "block" }
  const dedans = (
    <>
      {photo.src && (u.mode === "public"
        ? <PublicSharedImage model={photo} width={1200} height={900} sizes="(max-width: 520px) 100vw, 520px" style={styleImg} />
        : <EditorSharedImage model={photo} width={1200} height={900} sizes="(max-width: 520px) 100vw, 520px" style={styleImg} />)}
      <div style={{ padding: `${sz(u, 16)}px ${sz(u, 18)}px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: sz(u, 10), marginBottom: sz(u, 8) }}>
          <span aria-hidden style={{ fontSize: sz(u, 28) }}>{r.icone}</span>
          <span style={{ color: r.couleur, fontSize: sz(u, 12), fontWeight: 700, fontFamily: u.FONT_B }}>{r.libelleReseau}</span>
          <span style={{ marginLeft: "auto", background: r.couleur, color: "#080808", borderRadius: 20, padding: `${sz(u, 2)}px ${sz(u, 10)}px`, fontSize: sz(u, 11), fontWeight: 700, fontFamily: u.FONT_B }}>PRINCIPAL</span>
        </div>
        <p style={{ color: u.TEXT, fontSize: sz(u, 18), fontWeight: 700, margin: `0 0 ${sz(u, 4)}px`, fontFamily: u.FONT_D }}>{r.titre}</p>
        {r.description && <p style={{ color: u.MUTED, fontSize: sz(u, 13), margin: `0 0 ${sz(u, 6)}px`, lineHeight: 1.5, fontFamily: u.FONT_B }}>{r.description}</p>}
        {r.compte && <p style={{ color: r.couleur, fontSize: sz(u, 13), fontWeight: 700, margin: `0 0 ${sz(u, 12)}px`, fontFamily: u.FONT_B }}>{r.compte}</p>}
        <div style={avecCibleTactile({ background: r.couleur, color: "#080808", borderRadius: 11, padding: `${sz(u, 12)}px`, textAlign: "center", fontSize: sz(u, 14), fontWeight: 800, marginTop: r.compte ? 0 : sz(u, 12), fontFamily: u.FONT_B })}>{r.cta.label}</div>
      </div>
    </>
  )
  const cadre = { display: "block", background: `linear-gradient(135deg,${r.couleur}22,${r.couleur}0a)`, border: `1.5px solid ${r.couleur}45`, borderRadius: 18, overflow: "hidden", textDecoration: "none" }
  return (
    <div style={{ padding: `${sz(u, 8)}px ${sz(u, 24)}px ${sz(u, 14)}px`, fontFamily: u.FONT_B }}>
      {u.mode === "public"
        ? <a href={r.cta.href} target="_blank" rel="noopener noreferrer" onClick={() => u.trackClick(r.cta.href)} style={cadre}>{dedans}</a>
        : <div aria-disabled="true" style={cadre}>{dedans}</div>}
    </div>
  )
}

export function EditorSocialFeature({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!reseauVedette(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="⭐" label="Ajoutez le lien du profil à mettre en avant" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} />
}
export function PublicSocialFeature({ content, ctx }: PublicAdapterProps) {
  if (!reseauVedette(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} />
}
