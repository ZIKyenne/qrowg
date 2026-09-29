// classementDesModeles.ts — LA source unique du classement de la galerie de modèles.
//
// Ce qu'un visiteur a mesuré, le 29 septembre, sur /creer :
//
//   filtre « Restaurant »   n'affichait PAS « Bistrot français »
//   filtre « Bar »          n'affichait PAS « Bar à cocktails », ni « Bar de nuit »
//   filtre « Café »         n'affichait PAS « Coffee shop »
//   recherche « cafe »      ne trouvait PAS « Coffee shop »
//
// Les quatre modèles étaient bien au catalogue, visibles sans filtre. La cause
// tenait à une ligne du filtrage :
//
//     matchMetier = ids.includes(t.id) || t.category === activeMetier
//
// La carte secteur → clés mélangeait des IDENTIFIANTS de modèles
// (« restaurant ») et des NOMS DE GROUPE (« Restauration »), mais le test ne
// comparait les clés qu'aux identifiants : un modèle classé par son GROUPE ne
// remontait jamais. Sur les 34 modèles partagés, aucun ne répondait aux filtres
// Restaurant, Bar ou Café — seul le vieux modèle local « Restaurant & Bar », qui
// porte l'identifiant `restaurant`, s'affichait. Le tri d'arrivée (`dansSecteur`)
// avait déjà reçu la correction ; le filtre, la recherche et les compteurs non.
//
// D'où ce module. Un modèle appartient à un ou plusieurs SECTEURS, et cette
// appartenance se lit à UN seul endroit — filtres, recherche, compteurs et tri
// d'arrivée y passent tous. Aucun identifiant n'est renommé : les favoris
// (stockés par identifiant), les restrictions de forfait et les liens
// `?metier=…` continuent de fonctionner à l'identique.
//
// Module PUR : aucune dépendance React, testable seul.

import { SECTEURS, SECTEUR_PAR_MODELE } from "../../creer/entry"
import { correspondAuxChamps } from "@/lib/rechercheSouple"

/** Ce que la galerie sait d'un modèle, quelle que soit la liste d'où il vient. */
export interface ModeleClassable {
  id: string
  /** Nom affiché. */
  name?: string
  /** Sous-variante (« braise », « Bistrot français »…). */
  variante?: string
  description?: string
  tags?: string[]
  /**
   * Famille du modèle. Les 34 modèles partagés y mettent le NOM DE LEUR GROUPE
   * (« Restauration »), les 14 modèles historiques une clé de catégorie
   * (« Food »). Les deux sont acceptées ici : c'est tout l'objet du module.
   */
  category?: string
}

// ── Les secteurs de la galerie ───────────────────────────────────────────────
//
// L'ordre est celui de `SECTEURS` (creer/entry.ts), qui reste la liste de
// référence — c'est elle que valide `?metier=…`. Une garde le vérifie.

export interface DefinitionSecteur {
  id: string
  label: string
  /** Pictogramme de repli (les chips affichent l'icône du design system). */
  emoji: string
  color: string
}

export const SECTEURS_GALERIE: DefinitionSecteur[] = [
  { id: "Tous",        label: "Tous",        emoji: "✦",  color: "var(--accent)" },
  { id: "Restaurant",  label: "Restaurant",  emoji: "🍽️", color: "var(--danger)" },
  { id: "Bar",         label: "Bar",         emoji: "🍸", color: "#F97316" },
  { id: "Cafe",        label: "Café",        emoji: "☕", color: "#92400E" },
  { id: "Freelance",   label: "Freelance",   emoji: "💼", color: "var(--accent)" },
  { id: "Consultant",  label: "Consultant",  emoji: "🎯", color: "var(--action)" },
  { id: "Coach",       label: "Coach",       emoji: "🧘", color: "#4ADE80" },
  { id: "Agence",      label: "Agence",      emoji: "🏢", color: "#A78BFA" },
  { id: "Influenceur", label: "Influenceur", emoji: "📱", color: "var(--danger)" },
  { id: "Musicien",    label: "Musicien",    emoji: "🎵", color: "#C084FC" },
  { id: "Photographe", label: "Photographe", emoji: "📷", color: "#67E8F9" },
  { id: "Immobilier",  label: "Immobilier",  emoji: "🏠", color: "#34D399" },
  { id: "Beaute",      label: "Beauté",      emoji: "💅", color: "#F472B6" },
  { id: "Sante",       label: "Santé",       emoji: "❤️", color: "#F87171" },
  { id: "Evenement",   label: "Événement",   emoji: "🎉", color: "#EC4899" },
  { id: "SaaS",        label: "SaaS",        emoji: "🚀", color: "#818CF8" },
  { id: "Ecommerce",   label: "E-commerce",  emoji: "🛍️", color: "#FB923C" },
  // Trois familles du catalogue n'avaient AUCUN filtre : « Artisan & Services »,
  // « Association » et « Sport & Coaching ». Quatre modèles n'étaient donc
  // atteignables que par la recherche ou en déroulant les 48.
  { id: "Artisan",     label: "Artisan",     emoji: "🔧", color: "#D9A066" },
  { id: "Association", label: "Association", emoji: "🤝", color: "#4ADE80" },
  { id: "Sport",       label: "Sport",       emoji: "🏋️", color: "#38BDF8" },
]

/** Les secteurs filtrables (sans « Tous »). */
export const SECTEURS_FILTRABLES = SECTEURS_GALERIE.filter(s => s.id !== "Tous").map(s => s.id)

const LABEL_PAR_SECTEUR: Record<string, string> =
  Object.fromEntries(SECTEURS_GALERIE.map(s => [s.id, s.label]))

// ── Appartenance : un modèle, un ou plusieurs rayons ─────────────────────────

/**
 * Secteur principal des 14 modèles HISTORIQUES (liste locale de la galerie).
 *
 * Les 34 modèles partagés tiennent le leur de `SECTEUR_PAR_MODELE`
 * (creer/entry.ts), qui sert déjà aux liens « Utiliser » des exemples publics :
 * un seul classement pour les deux usages, sinon ils dérivent.
 */
const SECTEUR_DES_HISTORIQUES: Record<string, string> = {
  freelance: "Freelance",
  restaurant: "Restaurant",
  artiste: "Musicien",
  coach: "Coach",
  createur: "Influenceur",
  event: "Evenement",
  ecommerce: "Ecommerce",
  coiffeur: "Beaute",
  agence: "Agence",
  medecin: "Sante",
  vente_produits: "Ecommerce",
  immobilier: "Immobilier",
  startup: "SaaS",
  influenceur: "Influenceur",
}

/**
 * Rayons SUPPLÉMENTAIRES. Un « Bar à cocktails » est un bar et un restaurant ;
 * un « Coffee shop » est un café où l'on mange. Ranger chaque modèle dans une
 * seule case donnait des filtres à un seul résultat pendant que des modèles
 * pertinents restaient cachés à côté.
 */
const SECTEURS_EN_PLUS: Record<string, string[]> = {
  // Restauration
  resto_bar: ["Restaurant"],
  studio_bar_nuit: ["Evenement"],
  studio_coffee: ["Restaurant"],
  studio_boulangerie: ["Cafe"],
  // Beauté
  beaute_spa: ["Sante"],
  studio_institut: ["Sante"],
  // Coaching, sport
  coach_formateur: ["Consultant"],
  studio_salle_sport: ["Sport"],
  // Artisans : leur secteur principal reste « Consultant » (c'est là que mènent
  // /qr-code/artisan et /qr-code/garage), le rayon dédié s'ajoute.
  artisan_batiment: ["Artisan"],
  studio_artisan: ["Artisan"],
  // Entreprise
  biz_freelance: ["Consultant"],
  biz_agence: ["Freelance"],
  creatif_photo: ["Freelance"],
  creatif_artiste: ["Influenceur"],
  // Modèles historiques
  restaurant: ["Bar"],           // « Restaurant & Bar »
  freelance: ["Consultant"],
  agence: ["Freelance"],
  artiste: ["Influenceur"],
  coach: ["Sante"],
  vente_produits: ["Coach"],
}

/**
 * Repli par FAMILLE : un modèle ajouté demain au catalogue, sans être nommé
 * ici, tombe quand même dans un rayon plutôt que de devenir invisible aux
 * filtres. C'est exactement la panne qu'on répare ; elle ne doit pas pouvoir
 * revenir par omission.
 *
 * Les clés couvrent les deux vocabulaires : les groupes des modèles partagés
 * et les catégories des modèles historiques.
 */
const SECTEURS_PAR_FAMILLE: Record<string, string[]> = {
  // Groupes (page-templates.ts / templatesStudio.ts)
  "Restauration": ["Restaurant"],
  "Beauté & bien-être": ["Beaute"],
  "Coaching & Formation": ["Coach"],
  "Sport & Coaching": ["Sport"],
  "Santé & bien-être": ["Sante"],
  "Immobilier": ["Immobilier"],
  "Artisan & Services": ["Artisan"],
  "Freelance & Entreprise": ["Freelance"],
  "Créatif & Média": ["Influenceur"],
  "Événementiel": ["Evenement"],
  "Commerce": ["Ecommerce"],
  "Association": ["Association"],
  // Catégories historiques (champ `category` des 14 modèles locaux)
  Business: ["Freelance"],
  Food: ["Restaurant"],
  Creatif: ["Influenceur"],
  "Bien-etre": ["Coach"],
  Beaute: ["Beaute"],
  Sante: ["Sante"],
  Event: ["Evenement"],
  Tech: ["SaaS"],
}

const secteurConnu = (s: string) => s !== "" && s !== "Tous" && LABEL_PAR_SECTEUR[s] !== undefined

/**
 * Tous les rayons d'un modèle, le principal d'abord.
 *
 * Ordre de lecture : secteur principal (table partagée, puis table historique),
 * rayons supplémentaires, et à défaut le repli par famille.
 */
export function secteursDuModele(t: ModeleClassable): string[] {
  const out: string[] = []
  const pousse = (s: string | undefined) => {
    if (s && secteurConnu(s) && !out.includes(s)) out.push(s)
  }
  pousse(SECTEUR_PAR_MODELE[t.id])
  pousse(SECTEUR_DES_HISTORIQUES[t.id])
  for (const s of SECTEURS_EN_PLUS[t.id] || []) pousse(s)
  if (out.length === 0) for (const s of SECTEURS_PAR_FAMILLE[t.category || ""] || []) pousse(s)
  // Dernier recours : la famille EST un secteur (« Immobilier », « Beaute »).
  pousse(t.category)
  return out
}

/** Ce modèle appartient-il à ce secteur ? « Tous » (ou vide) accepte tout. */
export function appartientAuSecteur(t: ModeleClassable, secteur: string): boolean {
  if (!secteur || secteur === "Tous") return true
  return secteursDuModele(t).includes(secteur)
}

/**
 * Le compteur de chaque chip — calculé avec LE MÊME prédicat que le filtre.
 * Deux formules différentes, et une chip annonce « 3 » pour n'afficher qu'un
 * modèle : c'est ce qui s'était produit.
 */
export function compteParSecteur(modeles: ModeleClassable[]): Record<string, number> {
  const counts: Record<string, number> = { Tous: modeles.length }
  for (const s of SECTEURS_FILTRABLES) {
    counts[s] = modeles.filter(t => appartientAuSecteur(t, s)).length
  }
  return counts
}

// ── Recherche ────────────────────────────────────────────────────────────────
//
// `rechercheSouple` règle déjà les accents, la casse, l'ordre des mots et les
// apostrophes : « cafe » trouve « Café du Coin ». Il ne peut rien contre un
// modèle qui ne PORTE pas le mot cherché — « Coffee shop » ne contient ni
// « café » ni « bar ». Les synonymes de son rayon complètent donc le gisement.

// Les synonymes s'écrivent AVEC leurs accents, une seule fois : `pliage`
// (rechercheSouple) retire les accents du gisement ET de la requête, « cafe »
// trouve donc « café » sans qu'on ait à écrire les deux.
const SYNONYMES_SECTEUR: Record<string, string[]> = {
  Restaurant: ["resto", "restauration", "bistrot", "brasserie", "pizzeria", "trattoria", "gastronomique", "burger", "fast-food", "menu", "carte", "table", "traiteur", "food truck"],
  Bar: ["bar", "cocktail", "pub", "brasserie", "apéritif", "bière", "vin", "cave", "nuit", "club"],
  Cafe: ["café", "coffee", "coffee shop", "torréfaction", "salon de thé", "thé", "brunch", "boulangerie", "pâtisserie"],
  Freelance: ["freelance", "indépendant", "consultant", "portfolio", "prestataire", "auto-entrepreneur"],
  Consultant: ["consultant", "conseil", "expertise", "devis", "prestation", "mission"],
  Coach: ["coach", "coaching", "thérapeute", "formateur", "formation", "accompagnement", "bien-être"],
  Agence: ["agence", "studio", "création", "communication", "web"],
  Influenceur: ["influenceur", "influenceuse", "créateur de contenu", "réseaux sociaux", "kit média", "marque personnelle"],
  Musicien: ["musicien", "artiste", "groupe", "concert", "album", "streaming", "DJ"],
  Photographe: ["photographe", "photo", "shooting", "portfolio", "séance"],
  Immobilier: ["immobilier", "agence immobilière", "agent", "location", "gîte", "chambre d'hôtes", "saisonnière"],
  Beaute: ["beauté", "coiffure", "coiffeur", "barbier", "esthétique", "institut", "spa", "ongles", "soin"],
  Sante: ["santé", "médecin", "praticien", "cabinet", "kiné", "ostéopathe", "consultation"],
  Evenement: ["événement", "soirée", "mariage", "billetterie", "festival", "gala"],
  SaaS: ["SaaS", "startup", "logiciel", "application", "plateforme", "tech", "abonnement"],
  Ecommerce: ["e-commerce", "boutique", "commerce", "produits", "vente", "concept store", "fleuriste", "catalogue"],
  Artisan: ["artisan", "artisanat", "bâtiment", "dépannage", "travaux", "plombier", "électricien", "garage", "chantier", "devis"],
  Association: ["association", "asso", "ONG", "bénévole", "don", "adhésion", "solidarité"],
  Sport: ["sport", "salle de sport", "fitness", "musculation", "coach sportif", "abonnement", "cours collectifs"],
}

/** Étiquettes lisibles des familles : la recherche doit aussi les trouver. */
const FAMILLE_LUE: Record<string, string> = {
  Business: "Entreprise", Food: "Restauration", Creatif: "Créatif", Event: "Événement",
  "Bien-etre": "Bien-être", Beaute: "Beauté", Sante: "Santé",
}

/**
 * Tout ce en quoi une recherche peut trouver ce modèle : son nom, sa variante,
 * sa phrase, ses étiquettes, sa famille, ses rayons et leurs synonymes.
 */
export function gisementDeRecherche(t: ModeleClassable): string[] {
  const secteurs = secteursDuModele(t)
  return [
    t.name || "",
    t.variante || "",
    t.description || "",
    ...(t.tags || []),
    t.category || "",
    FAMILLE_LUE[t.category || ""] || "",
    ...secteurs.map(s => LABEL_PAR_SECTEUR[s] || s),
    ...secteurs.flatMap(s => SYNONYMES_SECTEUR[s] || []),
  ]
}

/** Ce modèle répond-il à cette recherche ? Une recherche vide ne filtre rien. */
export function correspondALaRecherche(t: ModeleClassable, requete: string): boolean {
  return correspondAuxChamps(gisementDeRecherche(t), requete)
}

// ── Homonymes ────────────────────────────────────────────────────────────────

/**
 * Les noms portés par PLUSIEURS modèles — deux « Salon de coiffure », deux
 * « Artiste / Musicien ». La galerie doit alors afficher de quoi les
 * distinguer ; leurs identifiants, eux, ne changent pas.
 */
export function nomsEnDouble(modeles: ModeleClassable[]): Set<string> {
  const vus = new Map<string, number>()
  for (const t of modeles) {
    const n = (t.name || "").trim().toLowerCase()
    if (n) vus.set(n, (vus.get(n) || 0) + 1)
  }
  return new Set([...vus.entries()].filter(([, n]) => n > 1).map(([nom]) => nom))
}

/** Ce modèle partage-t-il son nom avec un autre ? */
export function estHomonyme(t: ModeleClassable, doubles: Set<string>): boolean {
  return doubles.has((t.name || "").trim().toLowerCase())
}

// ── Garde d'intégrité (utilisée par les tests) ───────────────────────────────

/** Les secteurs déclarés ici, dans l'ordre — doit égaler `SECTEURS`. */
export const IDS_SECTEURS = SECTEURS_GALERIE.map(s => s.id)

/** Pour mémoire dans les messages de test. */
export const SECTEURS_DE_REFERENCE: readonly string[] = SECTEURS
