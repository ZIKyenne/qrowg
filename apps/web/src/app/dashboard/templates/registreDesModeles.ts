// Le registre des modèles de la galerie — UNE source (vague 4, point 5, lot 1).
//
// Avant ce lot, la galerie assemblait un modèle à partir de trois endroits qui
// ne se connaissaient pas : ses métadonnées (un tableau de page.tsx), son thème
// (un objet recréé à chaque rendu DANS le composant, avec un repli silencieux
// sur « freelance ») et ses blocs (modelesHistoriques.ts, ou PAGE_TEMPLATES).
// Les couleurs de la carte étaient écrites à la main, à côté du thème. Résultat,
// mesuré :
//   · l'aperçu en grand reconstruisait un thème à partir des couleurs de la
//     CARTE — texte clair, Fraunces, fond uni, pour tous. « Coach » se voyait
//     sur fond sombre et créait une page claire ; « Restaurant & Bar » se voyait
//     en rouge (#FF6B6B) et créait une page orange (#FF6B00) ;
//   · « freelance » et « immobilier » portaient `var(--accent)` comme couleur de
//     page : une variable du site, qui suit le profil de celui qui regarde, et
//     que les blocs composent en `var(--accent)18` — une couleur invalide.
//
// Ici, un modèle porte ensemble ce qu'il annonce, son thème et ses blocs. La
// carte, l'aperçu, l'assistant et la création lisent le même objet.
import { PAGE_TEMPLATES } from "../builder/page-templates"
import type { PageTheme } from "../builder/types"
import { MODELES_HISTORIQUES, META_HISTORIQUES, THEMES_HISTORIQUES, type MetaDeModele } from "./modelesHistoriques"

export type BlocDeModele = { type: string; content: Record<string, any> }

export type ModeleDeGalerie = MetaDeModele & {
  theme: PageTheme
  blocs: BlocDeModele[]
  /** Couleurs de la carte — DÉRIVÉES du thème, jamais écrites à côté. */
  color: string
  accent: string
  bg: string
  surface: string
  /** D'où vient le modèle : écrit pour la galerie, ou partagé avec l'éditeur. */
  origine: "historique" | "partage"
}

// Les modèles « studio » signent leur ambiance à la fin de la description
// (« … — rose nuit ») : elle devient la variante. Les vingt modèles ÉCRITS n'ont
// pas ce suffixe : le nom du THÈME fait alors la variante, comme pour les
// historiques (« Rose Poudré » contre « rose nuit »). Aucun identifiant ne bouge.
const ambianceDeLaDescription = (desc: string): string | undefined =>
  desc.includes(" — ") ? desc.split(" — ").slice(1).join(" — ") : undefined

const couleursDe = (t: PageTheme) => ({ color: t.primary, accent: t.accent, bg: t.bg, surface: t.surface })

const HISTORIQUES: ModeleDeGalerie[] = META_HISTORIQUES.map(m => {
  const theme = THEMES_HISTORIQUES[m.id]
  const blocs = MODELES_HISTORIQUES[m.id]
  // Pas de repli : un modèle sans thème ou sans blocs est une faute de données,
  // pas une page « freelance » vide (registreDesModeles.test.ts la refuse).
  return { ...m, theme, blocs, ...couleursDe(theme ?? ({} as PageTheme)), origine: "historique" as const }
})

const PARTAGES: ModeleDeGalerie[] = PAGE_TEMPLATES.map(t => ({
  id: t.key, name: t.label, category: t.group, plan: "free",
  description: t.desc.split(" — ")[0], variante: ambianceDeLaDescription(t.desc) ?? t.theme.name, emoji: t.emoji,
  tags: [],
  theme: t.theme, blocs: t.blocks as BlocDeModele[],
  ...couleursDe(t.theme),
  origine: "partage" as const,
}))

/** Tous les modèles de la galerie, dans l'ordre d'affichage historique. */
export const MODELES_DE_GALERIE: ModeleDeGalerie[] = [...HISTORIQUES, ...PARTAGES]

const PAR_ID: Record<string, ModeleDeGalerie> = Object.fromEntries(MODELES_DE_GALERIE.map(m => [m.id, m]))

/** Le modèle, ou `undefined` — jamais un autre modèle « par défaut ». */
export function modeleDeGalerie(id: string | null | undefined): ModeleDeGalerie | undefined {
  return id ? PAR_ID[id] : undefined
}
