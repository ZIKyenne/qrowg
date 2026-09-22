"use client"
// Primitives PARTAGÉES des blocs « mise en page libre ».
// - LayoutSurface : conteneur avec fond (couleur / dégradé / image + overlay), arrondi,
//   marges intérieures et extérieures. Le calque d'assombrissement est un div séparé pour
//   que le contenu reste pleinement opaque au-dessus.
// - SmartCta : bouton/lien qui se neutralise dans l'éditeur (aucun href, aria-disabled)
//   et devient un vrai <a> tracké en public. Un seul composant → aucune divergence possible.
import type { CSSProperties, ReactNode } from "react"
import { avecCibleTactile } from "./BlockCtaLink"
import { destinationUtile } from "../../types"
import { surfaceStyle, padCss, radiusOf, edgeCss } from "../models/layoutStyle"
import type { UnifiedCtx } from "../renderTypes"

export function LayoutSurface({ content, u, children, defaultPad, defaultRadius, style }: {
  content: Record<string, any>
  u: UnifiedCtx
  children: ReactNode
  defaultPad?: "none" | "compact" | "normal" | "airy"
  defaultRadius?: number
  style?: CSSProperties
}) {
  const radius = radiusOf(content.radius, defaultRadius ?? 14)
  const { container, overlay } = surfaceStyle(content, { accent: u.G, surface: u.SURFACE, radius })
  return (
    <div style={{ padding: edgeCss(content.edge, u.scale) }}>
      <div style={{ ...(container as CSSProperties), ...style }}>
        {overlay && <div aria-hidden style={overlay as CSSProperties} />}
        <div style={{ position: "relative", padding: padCss(content.pad, u.scale, defaultPad ?? "normal") }}>{children}</div>
      </div>
    </div>
  )
}

export function SmartCta({ u, href, label, style, external = true, trackTarget, nomAccessible }: {
  u: UnifiedCtx
  /** L'absence de destination est une valeur, pas un cas à masquer : six appelants
   *  passaient « # » à ce composant qui savait déjà quoi en faire (lot v127).
   *
   *  Lot v168 : ce qu'on reçoit ici est JUGÉ, pas seulement reçu. Les deux autres
   *  primitives de lien du produit le font depuis toujours — `LienPublic`
   *  (rendu legacy) et `PublicCtaLink` (blocs d'action) appellent
   *  `destinationUtile`. Celle-ci, non : elle dessinait un `<a>` dès que la
   *  chaîne était non vide. Or ses huit appelants lui passent `extHref(…)`, qui
   *  CONSTRUIT une adresse et n'en refuse aucune : `ftp://exemple.fr` en
   *  ressortait « https://ftp://exemple.fr », et la page publiait un lien mort
   *  — pendant que la liste d'avant publication annonçait, elle, que ce bouton
   *  ne serait pas publié. Le produit se contredisait, et c'était l'alerte qui
   *  disait vrai. Le juge est ici, une fois, pour que personne n'ait à y penser. */
  href: string | null
  label: ReactNode
  style: CSSProperties
  external?: boolean
  /** Ce qu'un lecteur d'écran annonce quand le bouton n'a qu'une icône.
   *  Se pose sur le <a> — et NULLE PART ailleurs : `aria-label` sur un <span>
   *  sans rôle est ignoré par les lecteurs d'écran, et c'est exactement ce que
   *  faisaient `team` et `multi_contact` depuis leur migration. (Vague 26.) */
  nomAccessible?: string
  /** Cle de suivi si elle differe de l'adresse (ex. « tickets » quand aucune URL
      n'est saisie) : on conserve les cles historiques pour ne pas casser les
      statistiques deja collectees. */
  trackTarget?: string
}) {
  // Cible tactile plancher (voir avecCibleTactile) : ces boutons sont ceux qui
  // font réserver, commander, acheter — et on n'y touche qu'au téléphone.
  const st = avecCibleTactile(style)
  const cible = destinationUtile(href)
  if (u.mode === "editor" || !cible) return <div aria-disabled="true" aria-label={nomAccessible} style={st}>{label}</div>
  return (
    <a
      href={cible}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={nomAccessible}
      onClick={() => { try { u.trackClick(trackTarget ?? cible) } catch {} }}
      style={st}
    >{label}</a>
  )
}

// Titre + sous-titre standardisés (réutilisés par une dizaine de blocs).
export function SurfaceHeading({ u, title, subtitle, align, color, mutedColor, titleSize }: {
  u: UnifiedCtx
  title?: string
  subtitle?: string
  align: "left" | "center" | "right"
  color: string
  mutedColor: string
  titleSize?: number
}) {
  if (!title && !subtitle) return null
  return (
    <>
      {/* Lot v155 : un titre de section EST un titre. Dix-sept blocs passent par
          cette primitive : ils gagnent tous leur niveau d'un coup. Le dessin ne
          bouge pas — taille, graisse et marge sont déjà posées ici. */}
      {title && <h2 style={{ color, fontSize: Math.round((titleSize ?? 21) * u.scale), fontWeight: 700, margin: 0, fontFamily: u.FONT_D, textAlign: align, lineHeight: 1.25 }}>{title}</h2>}
      {subtitle && <p style={{ color: mutedColor, fontSize: Math.round(14 * u.scale), margin: title ? `${Math.round(6 * u.scale)}px 0 0` : 0, fontFamily: u.FONT_B, textAlign: align, lineHeight: 1.5 }}>{subtitle}</p>}
    </>
  )
}
