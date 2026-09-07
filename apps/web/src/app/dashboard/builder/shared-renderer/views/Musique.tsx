"use client"
// Briques partagées de la famille musique : la pochette et les boutons de
// plateforme. Le bouton Spotify était vert plein dans l'aperçu et translucide
// en ligne — deux dessins pour le même bouton, et seulement pour Spotify.
import { sharedImageModel } from "../models/sharedImage"
import { PublicSharedImage } from "../primitives/PublicImage"
import { EditorSharedImage } from "../primitives/EditorImage"
import { avecCibleTactile } from "../primitives/BlockCtaLink"
import { sz, type UnifiedCtx } from "../renderTypes"
import type { Plateforme } from "../models/musique"
import type { CSSProperties } from "react"

export function Pochette({ u, src, cote, rayon, ombre, repli, marge }: {
  u: UnifiedCtx; src: string; cote: number; rayon: number; ombre?: string; repli: string; marge?: string
}) {
  const c = sz(u, cote)
  const commun: CSSProperties = { width: c, height: c, borderRadius: rayon, flexShrink: 0, margin: marge }
  const m = sharedImageModel(src, { decorative: true })
  if (!m.src) {
    return <div aria-hidden style={{ ...commun, background: "rgba(29,185,84,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz(u, Math.round(cote * 0.4)) }}>{repli}</div>
  }
  const style: CSSProperties = { ...commun, objectFit: "cover", display: "block", boxShadow: ombre }
  return u.mode === "public"
    ? <PublicSharedImage model={m} width={cote * 2} height={cote * 2} sizes={`${cote}px`} style={style} />
    : <EditorSharedImage model={m} width={cote * 2} height={cote * 2} sizes={`${cote}px`} style={style} />
}

/** Un bouton de plateforme : même habillage des deux côtés, lien réel en ligne
 *  seulement. `plein` = fond opaque (le style des boutons de pré-sauvegarde). */
export function BoutonPlateforme({ u, p, plein, style }: { u: UnifiedCtx; p: Plateforme; plein: boolean; style: CSSProperties }) {
  const habillage = avecCibleTactile({
    ...style,
    background: plein ? p.couleur : `${p.couleur}22`,
    border: plein ? "none" : `1px solid ${p.couleur}44`,
    color: plein ? p.texteSur : p.couleur,
    textDecoration: "none", fontFamily: u.FONT_B,
  })
  return u.mode === "public"
    ? <a href={p.href} target="_blank" rel="noopener noreferrer" onClick={() => u.trackClick(p.href)} style={habillage}>{p.label}</a>
    : <div aria-disabled="true" style={habillage}>{p.label}</div>
}
