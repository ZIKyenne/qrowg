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
import { PAGE_TEMPLATES, AMBIANCE_THEMES, type PageTemplate } from "../builder/page-templates"
import { avecMoyenDeJoindre } from "../builder/blocJoindre"
import { EXTRA_STRUCTURES } from "../builder/templateStructures.extra"
import type { PageTheme } from "../builder/types"
import { MODELES_HISTORIQUES, META_HISTORIQUES, THEMES_HISTORIQUES, type MetaDeModele } from "./modelesHistoriques"
import { AMBIANCE_DU_METIER } from "./themesDesMetiers"

export type BlocDeModele = { type: string; content: Record<string, any> }

export type ModeleDeGalerie = MetaDeModele & {
  theme: PageTheme
  blocs: BlocDeModele[]
  /** Couleurs de la carte — DÉRIVÉES du thème, jamais écrites à côté. */
  color: string
  accent: string
  bg: string
  surface: string
  /** D'où vient le modèle : écrit pour la galerie, partagé avec l'éditeur, ou
   *  métier du moteur (templateStructures.extra.ts, exposé au lot 3). */
  origine: "historique" | "partage" | "metier"
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
  // Lot 2 : la règle de TOUS les modèles partagés — une page créée permet de
  // joindre le commerce. Douze historiques sur quatorze n'avaient ni appel, ni
  // WhatsApp, ni formulaire : le client d'un « Coach » ne pouvait pas appeler.
  const brut = MODELES_HISTORIQUES[m.id]
  const blocs = (brut ? avecMoyenDeJoindre(brut) : []) as BlocDeModele[]
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

// Lot 3 (décision du propriétaire, 24 nov. : vérifier puis exposer). Les 62
// métiers du moteur n'atteignaient aucun utilisateur. Vérifiés d'abord : 85 avis
// inventés, 28 adresses, un faux numéro, 3 qualifications affirmées, une
// cinquantaine de liens vers « # » ou vers l'accueil nu d'un service — retirés
// (preuveNonInventee.test.ts les surveille désormais). Chacun reçoit son
// ambiance (themesDesMetiers.ts) et la règle commune : on peut joindre le commerce.
const METIERS: ModeleDeGalerie[] = EXTRA_STRUCTURES.map(s => {
  const theme = AMBIANCE_THEMES[AMBIANCE_DU_METIER[s.key]]
  return {
    id: s.key, name: s.label, category: s.group, plan: "free",
    description: s.desc, variante: theme?.name, emoji: s.emoji, tags: [],
    theme, blocs: avecMoyenDeJoindre(s.blocks) as BlocDeModele[],
    ...couleursDe(theme ?? ({} as PageTheme)),
    origine: "metier" as const,
  }
})

/** Tous les modèles de la galerie, dans l'ordre d'affichage historique. */
export const MODELES_DE_GALERIE: ModeleDeGalerie[] = [...HISTORIQUES, ...PARTAGES, ...METIERS]

const PAR_ID: Record<string, ModeleDeGalerie> = Object.fromEntries(MODELES_DE_GALERIE.map(m => [m.id, m]))

// ── Le même catalogue pour l'éditeur et les pages /examples (point 5, lot 2) ──
//
// La galerie proposait 65 modèles, la fenêtre « Modèles » de l'éditeur et les
// pages /examples 51 : les 14 historiques n'existaient que dans la galerie
// (décision du propriétaire, 24 nov. : un seul catalogue, partout). Ils
// rejoignent les groupes en français des modèles partagés — l'éditeur et
// /examples rangent par groupe, la galerie par secteur (classementDesModeles).
export const GROUPE_DE_CATEGORIE: Record<string, string> = {
  Business: "Freelance & Entreprise", Tech: "Freelance & Entreprise",
  Food: "Restauration", Creatif: "Créatif & Média", Event: "Événementiel",
  "Bien-etre": "Coaching & Formation", Beaute: "Beauté & bien-être",
  Sante: "Santé", Commerce: "Commerce", Immobilier: "Immobilier",
}

/** Tous les modèles, au format de l'éditeur : les partagés d'abord, à l'identique
 *  (leur ordre et leurs groupes ne bougent pas), puis les historiques. */
export const CATALOGUE_DES_MODELES: PageTemplate[] = [
  ...PAGE_TEMPLATES,
  ...HISTORIQUES.map(m => ({
    key: m.id, group: GROUPE_DE_CATEGORIE[m.category] ?? m.category, label: m.name, emoji: m.emoji,
    // L'ambiance suit le tiret, comme pour les modèles « studio » : deux
    // « Salon » se distinguent sans toucher au nom.
    desc: m.variante ? `${m.description} — ${m.variante}` : m.description,
    theme: m.theme, blocks: m.blocs,
  })),
  // Puis les métiers, déjà rangés dans les groupes en français.
  ...METIERS.map(m => ({
    key: m.id, group: m.category, label: m.name, emoji: m.emoji,
    desc: m.variante ? `${m.description} — ${m.variante}` : m.description,
    theme: m.theme, blocks: m.blocs,
  })),
]

/** Les groupes, dans l'ordre d'apparition. */
export const GROUPES_DU_CATALOGUE: string[] = CATALOGUE_DES_MODELES.reduce<string[]>((acc, t) => {
  if (!acc.includes(t.group)) acc.push(t.group)
  return acc
}, [])

/** Le modèle, ou `undefined` — jamais un autre modèle « par défaut ». */
export function modeleDeGalerie(id: string | null | undefined): ModeleDeGalerie | undefined {
  return id ? PAR_ID[id] : undefined
}
