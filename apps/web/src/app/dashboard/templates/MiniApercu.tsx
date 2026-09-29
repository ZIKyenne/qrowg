"use client"
// MiniApercu — la vignette d'une carte de modèle, dessinée avec le VRAI rendu.
//
// Ce que la galerie montrait avant : une silhouette. Un rond pour l'avatar, deux
// barres grises pour le texte, deux rectangles pour les boutons — la MÊME pour
// les quarante-huit modèles, seules les couleurs du thème changeaient. Un
// commerçant ne pouvait donc pas choisir : « Bistrot français » et « Startup /
// SaaS » présentaient exactement le même croquis, et il fallait ouvrir l'aperçu
// de chacun pour voir ce qu'on achetait.
//
// Ici, la vignette rend les PREMIERS BLOCS RÉELS du modèle, avec son thème, sa
// typographie et ses visuels — le même composant que l'aperçu en grand
// (`BlockPreview`, qui délègue au rendu public partagé). Une page de 390 px
// dessinée puis réduite par `scale()` : ce qu'on voit est ce qui sera publié.
//
// Trois précautions, parce qu'il y a quarante-huit cartes sur l'écran :
//
//   1. Rien ne se dessine avant que la carte approche de la fenêtre
//      (IntersectionObserver). Une dizaine de miniatures vivent à la fois, pas
//      quarante-huit.
//   2. Cinq blocs au maximum — au-delà, rien n'entre dans la vignette.
//   3. Les blocs qui appellent l'extérieur (lecteur Spotify, carte Google,
//      agenda) sont sautés : quarante-huit iframes tierces au chargement d'une
//      galerie, ce serait la page la plus lourde du produit.
//
// La vignette est DÉCORATIVE : `aria-hidden`, `inert`, sans événement de souris.
// Le contrôle, c'est le bouton « Aperçu » qui la recouvre — un lien ou un bouton
// de bloc ne doit jamais être atteignable ici (et un bouton dans un bouton est
// interdit : c'est la leçon du 9 septembre sur cette même carte).

import { useEffect, useRef, useState } from "react"
import type { Block, PageTheme } from "../builder/types"
import { BlockPreview, computeBgStyle } from "./TemplatePreviewModal"
import { inerte } from "@/lib/inerte"

/** Largeur de la page simulée. Celle d'un téléphone : le zoom s'en déduit. */
const LARGEUR_PAGE = 390

/** Nombre de blocs dessinés au plus. */
const BLOCS_DESSINES = 5

/**
 * Blocs sautés dans la miniature : ils monteraient une iframe tierce ou un
 * lecteur média. Ils restent bien sûr dans l'aperçu en grand et sur la page.
 */
const BLOCS_HORS_MINIATURE = new Set([
  "spotify_embed", "spotify_player", "google_maps", "google_maps_embed", "maps",
  "youtube", "youtube_embed", "video", "video_embed", "vimeo", "soundcloud",
  "calendly", "iframe", "embed", "tiktok_embed", "instagram_embed", "twitter_embed",
  "apple_music", "deezer", "podcast",
  // …et ceux qui lisent l'HEURE ou un compteur : leur texte change entre le
  // rendu du serveur et celui du navigateur. Dans une vignette de 130 px, un
  // compte à rebours ne se lit de toute façon pas.
  "countdown", "visit_counter",
])

/**
 * Les blocs que la miniature dessine : les premiers du modèle, dans l'ordre,
 * sans ceux qui appelleraient l'extérieur. Fonction PURE, testée à part.
 */
export function blocsDeLaMiniature<T extends { type: string }>(blocs: T[]): T[] {
  return (blocs || []).filter(b => !BLOCS_HORS_MINIATURE.has(b.type)).slice(0, BLOCS_DESSINES)
}

export interface MiniApercuProps {
  /** Identifiant du modèle — sert à repartir de zéro quand la carte change. */
  cle: string
  theme: PageTheme
  blocs: { type: string; content: Record<string, any> }[]
  /** Hauteur de la vignette, en pixels (elle diffère sur mobile). */
  hauteur: number
  /**
   * Dessiner sans attendre l'observateur — pour les premières cartes, celles
   * qu'on voit avant tout défilement.
   *
   * « Sans attendre », mais toujours APRÈS le montage. Le serveur ne peut pas
   * dessiner ces miniatures : elles rendent de vrais blocs, et certains écrivent
   * un texte qui dépend de l'instant. Mesuré sur le build de production, /creer
   * — une page PUBLIQUE — levait une erreur React #418 (le texte du serveur ne
   * correspond pas à celui du navigateur) : la carte « Soirée / Événement »
   * dessinait un COMPTE À REBOURS, calculé une première fois sur le serveur, une
   * seconde fois à l'hydratation. Les deux côtés partent donc du même cadre vide,
   * et le contenu arrive au montage — c'est-à-dire tout de suite.
   */
  immediat?: boolean
}

export function MiniApercu({ cle, theme, blocs, hauteur, immediat }: MiniApercuProps) {
  const [dessine, setDessine] = useState(false)
  const cadre = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dessine) return
    // Les premières cartes : dessinées dès le montage, sans passer par l'observateur.
    if (immediat) { setDessine(true); return }
    const el = cadre.current
    // Sans observateur (navigateur ancien, rendu hors navigateur) : on dessine.
    if (!el || typeof IntersectionObserver !== "function") { setDessine(true); return }
    const obs = new IntersectionObserver(entrees => {
      if (entrees.some(e => e.isIntersecting)) { setDessine(true); obs.disconnect() }
    }, { rootMargin: "400px 0px" })
    obs.observe(el)
    return () => obs.disconnect()
  }, [dessine, immediat])

  // Proportion de téléphone : la vignette lit comme un écran, pas comme une carte.
  const largeur = Math.max(84, Math.round(hauteur * 0.72))
  const zoom = largeur / LARGEUR_PAGE
  // La page dépasse en bas du cadre : c'est ce qui dit « ça continue ».
  const debordement = 18
  const fond = computeBgStyle(theme, false)

  const aDessiner: Block[] = blocsDeLaMiniature(blocs)
    .map((b, i) => ({ id: `mini_${cle}_${i}`, type: b.type, content: b.content, visible: true }))

  return (
    <div aria-hidden="true" {...inerte} data-mini-apercu={cle} data-mini-dessine={dessine ? "1" : "0"} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", userSelect: "none" }}>
      <div
        ref={cadre}
        style={{
          position: "absolute", left: "50%", top: 14, width: largeur, bottom: -debordement,
          transform: "translateX(-50%)",
          borderRadius: "11px 11px 0 0", overflow: "hidden",
          border: `1px solid color-mix(in srgb, ${theme.primary || "#fff"} 22%, transparent)`,
          boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
          ...fond,
        }}>
        {dessine && (
          <div style={{ width: LARGEUR_PAGE, transform: `scale(${zoom})`, transformOrigin: "top left", fontFamily: theme.fontBody || "DM Sans, sans-serif" }}>
            {aDessiner.map(b => <BlockPreview key={b.id} block={b} theme={theme} dayMode={false} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default MiniApercu
