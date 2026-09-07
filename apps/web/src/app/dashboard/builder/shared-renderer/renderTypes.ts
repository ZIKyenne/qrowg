// Contextes MINIMAUX passés aux adapters (capacités explicites, pas 50 callbacks).
// Éditeur et public ont des contextes distincts → aucune capacité éditeur ne peut fuiter
// dans le rendu public.

import type { CSSProperties, ReactNode } from "react"
import type { PageTheme } from "../types"
import { isLightTheme, surfaceTokens } from "./models/layoutStyle"

// Adapter ÉDITEUR : couleurs + style de surface + édition inline (capacité fournie).
export type EditorRenderCtx = {
  theme: PageTheme
  primary: string
  text: string
  muted: string
  accent: string
  surfaceStyle: CSSProperties        // l'objet `s` (background + fontFamily) du builder
  canEdit: boolean
  edit: (key: string) => (value: string) => void
}

// Adapter PUBLIC : couleurs résolues + ids + tracking (jamais d'édition inline).
export type PublicRenderCtx = {
  theme: PageTheme
  G: string
  TEXT: string
  MUTED: string
  FONT_D: string
  FONT_B: string
  pageId: string
  blockId: string
  trackClick: (target: string) => void
  /** Ce bloc porte-t-il le <h1> de la page ? Une page n'en a qu'un, et c'est le
   *  premier `profile` qui a un nom. L'aperçu de l'éditeur, lui, n'en rend
   *  jamais : un <h1> dans un canvas de tableau de bord serait un titre de plus
   *  dans la page du tableau de bord. */
  titrePrincipal?: boolean
}

export type EditorAdapterProps = { content: Record<string, any>; ctx: EditorRenderCtx }
export type PublicAdapterProps = { content: Record<string, any>; ctx: PublicRenderCtx }

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTE UNIFIÉ — blocs « mise en page libre »
// -----------------------------------------------------------------------------
// Les blocs de la vague Layout n'ont PAS d'édition inline (tout se règle dans le
// panneau de réglages). Leur vue est donc STRICTEMENT identique des deux côtés :
// une seule vue partagée, deux adapters d'une ligne. La parité éditeur/public est
// garantie par construction, pas par un test de comparaison.
// `scale` réduit les tailles dans le canvas de l'éditeur (aperçu plus étroit).
// `mode` sert uniquement à neutraliser les liens dans l'éditeur.
export type UnifiedCtx = {
  mode: "editor" | "public"
  theme: PageTheme
  G: string          // couleur primaire résolue
  TEXT: string
  MUTED: string
  SURFACE: string
  FONT_D: string
  FONT_B: string
  scale: number      // 1 en public, < 1 dans le canvas éditeur
  trackClick: (target: string) => void
  // Surfaces adaptatives : s'inversent sur un thème clair (voir models/layoutStyle).
  light: boolean
  FILL: string        // fond de carte discret
  LINE: string        // bordure / filet
  LINE_STRONG: string // pointillés, séparateurs marqués
  /** Vrai seulement en public, sur le bloc qui porte le <h1> de la page. */
  titrePrincipal: boolean
}

export function editorCtx(ctx: EditorRenderCtx): UnifiedCtx {
  return {
    mode: "editor",
    theme: ctx.theme,
    G: ctx.primary,
    TEXT: ctx.text,
    MUTED: ctx.muted,
    SURFACE: ctx.theme.surface || "#111009",
    FONT_D: ctx.theme.fontDisplay || "inherit",
    FONT_B: ctx.theme.fontBody || "inherit",
    scale: 0.86,
    trackClick: () => {},
    titrePrincipal: false,
    ...themeSurfaces(ctx.theme),
  }
}

// Facteur commun aux deux contextes : décide clair/sombre une seule fois.
function themeSurfaces(theme: PageTheme | undefined) {
  const light = isLightTheme(theme as any)
  return { light, ...surfaceTokens(light) }
}

export function publicCtx(ctx: PublicRenderCtx): UnifiedCtx {
  return {
    mode: "public",
    theme: ctx.theme,
    G: ctx.G,
    TEXT: ctx.TEXT,
    MUTED: ctx.MUTED,
    SURFACE: (ctx.theme as any)?.surface || "#111009",
    FONT_D: ctx.FONT_D,
    FONT_B: ctx.FONT_B,
    scale: 1,
    trackClick: ctx.trackClick,
    titrePrincipal: ctx.titrePrincipal === true,
    ...themeSurfaces(ctx.theme),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXTE ÉDITABLE — sans faire entrer l'éditeur dans le bundle public.
//
// Quatre blocs laissent le commerçant corriger un texte directement dans
// l'aperçu (profile, rich_text, team, announcement). Jusqu'ici, la seule façon
// de garder cette capacité en migrant un bloc était d'écrire DEUX adapters qui
// recopient la même géométrie — c'est-à-dire de réintroduire exactement la
// divergence que le renderer partagé existe pour supprimer.
//
// La vue partagée reçoit donc un rendu de texte en paramètre : l'adapter éditeur
// en fournit un qui s'appuie sur InlineEditable, l'adapter public un qui rend un
// élément ordinaire. Une seule géométrie, aucun import croisé — un bloc partagé
// ne tire jamais InlineEditable, qui vit du côté éditeur.
export type RenduTexte = (p: {
  valeur: string
  /** Clé du champ à écrire quand le commerçant corrige le texte. */
  cle: string
  style: CSSProperties
  multiligne?: boolean
  balise?: "p" | "span"
  placeholder?: string
}) => ReactNode

// L'implémentation figée (celle du public) vit dans primitives/TexteInline.tsx :
// ce fichier ne contient que des types, il ne doit pas devenir un module JSX.

// Échelle : arrondit une taille de référence (pensée pour le public) au contexte.
export function sz(u: UnifiedCtx, n: number): number {
  return Math.max(1, Math.round(n * u.scale))
}
