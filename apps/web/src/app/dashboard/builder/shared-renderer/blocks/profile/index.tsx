"use client"
// profile — Le bloc le plus pose de toutes les pages : photo, nom, accroche,
// badges. Il porte aussi le <h1> de la page publiee quand il a un nom.
//
// Deux ecarts corriges en migrant :
//  • la page masque le bloc entier quand rien n'est rempli ; l'apercu dessinait
//    quand meme le cadre et ses deux champs vides ;
//  • l'avatar de l'apercu etait un <img> brut — l'auteur telechargeait sa photo
//    en pleine taille pour une vignette, a chaque ouverture.
import { profil, initialeProfil } from "../../models/profilEtTexte"
import { sharedImageModel } from "../../models/sharedImage"
import { avatarShapeStyle, avatarDecoStyle, avatarBgStyle, profileBadgeStyle } from "../../../types"
import { PublicSharedImage } from "../../primitives/PublicImage"
import { EditorSharedImage } from "../../primitives/EditorImage"
import { texteFige, texteEditable } from "../../primitives/TexteInline"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { sz, editorCtx, publicCtx, type RenduTexte, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../../renderTypes"

function Vue({ u, c, accent, Texte }: { u: UnifiedCtx; c: Record<string, any>; accent: string; Texte: RenduTexte }) {
  const p = profil(c)!
  const cote = sz(u, 96)
  const forme = avatarShapeStyle(c.avatar_shape)
  const deco = avatarDecoStyle(c.avatar_shape, c.avatar_border, c.avatar_shadow, u.G)
  const fond = avatarBgStyle(c.avatar_bg, u.G, accent)
  const photo = sharedImageModel(p.avatar, { alt: p.nom })
  const styleImg = { width: cote, height: cote, ...forme, ...deco, objectFit: "cover" as const, margin: `0 auto ${sz(u, 14)}px`, display: "block" }
  const Titre = u.titrePrincipal ? "h1" : "p"
  return (
    <div style={{ textAlign: "center", padding: `${sz(u, 32)}px ${sz(u, 20)}px ${sz(u, 20)}px`, fontFamily: u.FONT_B }}>
      {p.montrerAvatar && (photo.src
        ? (u.mode === "public"
          ? <PublicSharedImage model={photo} width={192} height={192} sizes="96px" style={styleImg} />
          : <EditorSharedImage model={photo} width={192} height={192} sizes="96px" style={styleImg} />)
        : <div aria-hidden style={{ width: cote, height: cote, ...forme, ...deco, ...fond, margin: `0 auto ${sz(u, 14)}px`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, 38), fontWeight: 700, color: "#080808", fontFamily: u.FONT_D }}>{initialeProfil(p.nom)}</div>)}
      {p.nom && (u.titrePrincipal
        ? <h1 style={{ color: u.TEXT, fontSize: sz(u, 26), fontWeight: 700, margin: `0 0 ${sz(u, 5)}px`, fontFamily: u.FONT_D }}>{p.nom}</h1>
        : <Texte valeur={p.nom} cle="name" balise="p" placeholder="Votre nom (masqué si vide)"
            style={{ color: u.TEXT, fontSize: sz(u, 26), fontWeight: 700, margin: `0 0 ${sz(u, 5)}px`, fontFamily: u.FONT_D }} />)}
      {p.accroche && <Texte valeur={p.accroche} cle="tagline" balise="p" placeholder="Votre accroche"
        style={{ color: u.MUTED, fontSize: sz(u, 14), margin: p.badges.length ? `0 0 ${sz(u, 10)}px` : 0, fontFamily: u.FONT_B }} />}
      {p.badges.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: sz(u, 6), justifyContent: "center" }}>
          {p.badges.map((b, i) => {
            const bs = profileBadgeStyle(b, u.G)
            return <span key={i} style={{ background: bs.bg, border: `1px solid ${u.lisible(bs.border, 3)}`, borderRadius: 20, padding: `${sz(u, 4)}px ${sz(u, 14)}px`, fontSize: sz(u, 12), color: u.lisible(bs.color), fontWeight: 600, fontFamily: u.FONT_B }}>{bs.icon ? bs.icon + " " : ""}{b}</span>
          })}
        </div>
      )}
    </div>
  )
}

export function EditorProfile({ content, ctx }: EditorAdapterProps) {
  const u = editorCtx(ctx)
  if (!profil(content)) return <div style={{ padding: "10px 16px" }}><BlockEmptyState icon="👤" label="Ajoutez votre nom ou votre photo" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={u.MUTED} /></div>
  return <Vue u={u} c={content} accent={ctx.accent} Texte={texteEditable(ctx.canEdit, ctx.edit)} />
}
export function PublicProfile({ content, ctx }: PublicAdapterProps) {
  if (!profil(content)) return null
  return <Vue u={publicCtx(ctx)} c={content} accent={(ctx.theme as any)?.accent || "var(--success)"} Texte={texteFige} />
}
