"use client"

// Vignette — l'image d'un aperçu, qui ne retélécharge pas l'original.
//
// Relevé du 15 septembre. Le rendu partagé (`shared-renderer`) a déjà réglé ce
// défaut bloc par bloc, et ses commentaires le disent : « l'aperçu rendait un
// <img> brut, donc l'original en pleine taille sur le téléphone de l'auteur, à
// chaque ouverture du canvas ». Deux écrans étaient restés en arrière, et ils
// portent à eux seuls **soixante-huit** des images brutes du produit :
//
//   builderPreview.tsx        36   l'aperçu du builder
//   TemplatePreviewModal.tsx  32   l'aperçu d'un modèle
//
// Ce sont les médias téléversés par le commerçant — `c.avatar`, `c.cover`,
// `c.photo`, `c.before_img`, `c.logo_url` — affichés en 40, 52, 72, 120 px.
// Une photo de smartphone compressée à 1 600 px pèse encore 200 à 400 Ko : douze
// vignettes de galerie, c'est plusieurs mégaoctets retéléchargés à chaque
// ouverture du canvas, sur le téléphone de celui qui construit sa page.
//
// La règle posée : **une image d'aperçu demande la taille qu'elle affiche.**
//
// Ce composant ne rivalise pas avec `SmartImage` : il lui donne ce qui manquait
// aux appels en forme de `<img>` — les dimensions et la largeur réellement
// affichée — et lui délègue tout le reste (next/image pour les médias
// optimisables, repli `<img>` natif strictement identique sinon).

import SmartImage from "./SmartImage"
import type { CSSProperties } from "react"

/**
 * La largeur du cadre téléphone des aperçus. Une image en « 100 % » n'occupe
 * jamais plus que ça : c'est la variante à demander, pas l'original.
 */
export const CADRE_APERCU = 430

function px(v: CSSProperties["width"] | CSSProperties["height"]): number | null {
  if (typeof v === "number") return v > 0 ? Math.round(v) : null
  if (typeof v === "string") {
    const m = /^(\d+(?:\.\d+)?)\s*px$/.exec(v.trim())
    if (m) { const n = Math.round(Number(m[1])); return n > 0 ? n : null }
  }
  return null
}

/**
 * Ce qu'il faut demander au serveur pour cette vignette : les dimensions
 * intrinsèques (next/image en a besoin) et `sizes`, la largeur d'affichage
 * réelle — sans elle le navigateur suppose la pleine largeur et retélécharge
 * la plus grosse variante, ce qui annule tout le bénéfice.
 */
export function tailleDeVignette(style?: CSSProperties): { width: number; height: number; sizes: string } {
  const l = px(style?.width)
  const h = px(style?.height)
  if (l) return { width: l, height: h ?? l, sizes: `${l}px` }
  // Largeur fluide : le cadre de l'aperçu est le plafond. La hauteur connue
  // sert de rapport ; sans elle, un 4:3 raisonnable — next/image ne s'en sert
  // que pour réserver la place, le style garde le dernier mot.
  return { width: CADRE_APERCU, height: h ?? Math.round(CADRE_APERCU * 0.75), sizes: `${CADRE_APERCU}px` }
}

type Props = {
  src?: string
  alt?: string
  className?: string
  style?: CSSProperties
  draggable?: boolean
  /** Une vignette visible d'emblée (au-dessus de la ligne de flottaison). */
  eager?: boolean
  /**
   * La largeur d'affichage réelle, quand le style ne la dit pas — une image en
   * « 100 % » dans un cadre de 40 px, par exemple. Sans elle on suppose la
   * largeur du cadre d'aperçu, ce qui reste bien mieux que la pleine largeur.
   */
  sizes?: string
  onError?: (e: any) => void
  onClick?: (e: any) => void
  onMouseEnter?: (e: any) => void
  onMouseLeave?: (e: any) => void
}

export default function Vignette({ src, alt = "", className, style, draggable, eager, sizes, onError, onClick, onMouseEnter, onMouseLeave }: Props) {
  const t = tailleDeVignette(style)
  return (
    <SmartImage
      src={src} alt={alt} width={t.width} height={t.height} sizes={sizes ?? t.sizes}
      className={className} style={style} draggable={draggable} eager={eager}
      onError={onError} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
    />
  )
}
