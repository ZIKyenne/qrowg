// =============================================================================
// lib/plans.ts — SOURCE DE VÉRITÉ UNIQUE des plans QRowg
// -----------------------------------------------------------------------------
// Tout ce qui concerne les plans (prix, limites, features) vit ICI.
// Les pages (dashboard/profil, /upgrade, landing) et l'enforcement (création de
// pages, API) doivent importer depuis ce fichier — ne PAS redéfinir ailleurs.
//
// Fichier 100% données (aucun JSX / icône) -> importable côté serveur, edge et
// client sans risque. Les icônes restent dans les composants d'UI.
//
// ⚠️ Les PRIX réels sont définis dans Stripe. Ici c'est l'affichage : si tu
// changes un prix, change-le AUSSI dans Stripe (env NEXT_PUBLIC_STRIPE_*_PRICE_ID).
// =============================================================================

// Quatre paliers : gratuit, et trois payants.
//
// ── Historique de cette ligne, parce qu'elle a changé deux fois ─────────────
//
// Elle a d'abord porté quatre paliers, puis trois, avec cette raison écrite :
// « trois paliers payants pour zéro client, c'est trois fois plus de support,
// une décision de plus à prendre pour l'acheteur — et un prix qui disait "ce
// n'est pas sérieux" à un commerçant qui paie sa caisse 60 € par mois. »
//
// Le 11 novembre 2026, décision d'Emilien de revenir à trois paliers payants,
// en connaissance de cet argument et du fait que la grille passe de 19/49 à
// 12,90/29,90. L'argument ci-dessus n'est pas réfuté : il est arbitré contre.
// Il reste écrit pour que la prochaine personne qui touche à cette ligne sache
// qu'elle tranche un débat, et ne croie pas corriger un oubli.
//
// Toujours zéro client payant au moment du changement (vérifié en base :
// 3 profils, tous `free`, aucun abonnement actif), donc personne à migrer.
export type PlanId = "free" | "starter" | "pro" | "business"

import { mensuelEquivalent } from "./tarifs"

export type PlanLimits = {
  pages: number | null // null = illimité
  /**
   * Vues mensuelles. TOUJOURS `null` désormais.
   *
   * Un QR est IMPRIMÉ : il est collé sur une table, une vitrine, un flyer. Écrire
   * « 200 vues / mois » sur la grille tarifaire, c'est promettre au commerçant que
   * son sticker cessera de fonctionner s'il marche trop bien — le contraire de ce
   * qu'on lui vend. Le champ reste pour ne pas casser les écrans qui le lisent.
   */
  views: number | null
  qr: number | null    // QR autonomes enregistrés (hors QR de page) : statiques ET modifiables
  dyn: number | null   // ...dont MODIFIABLES après impression (sous-ensemble de `qr`)
  team: number | null
}

// Les formats que l'atelier d'export propose VRAIMENT (`QRStudio.FORMAT_CFG`).
// La liste disait « jpg » — vendu sur la grille, offert nulle part — et ignorait
// le PNG transparent et le WEBP, qui existent et sont payants (lot v130).
export type ExportFormat = "png" | "png-t" | "webp" | "svg" | "pdf"

// Capacités (fonctionnalités débloquées) par plan — utilisées pour le gating
export type PlanCaps = {
  printStudio: boolean      // accès à Atelier d'impression (éditeur imprimables)
  qrStudioAdvanced: boolean // personnalisation QR avancée (couleurs / modules / coins)
  ai: boolean               // génération + rapports IA
  removeBranding: boolean   // retire le "Créé avec QRowg" des pages publiques
  pageIntro: boolean        // animation d'entrée personnalisée sur la page publique
  exportFormats: ExportFormat[]
  // ── QR modifiables après impression ────────────────────────────────────────
  // Ces quatre capacités venaient d'un SECOND abonnement (lib/dynamicPlans.ts),
  // avec ses propres paliers « Pro » et « Business » à d'autres prix. Deux grilles
  // homonymes sur le même écran : personne ne pouvait dire de quel « Pro » on
  // parlait. Fondues ici, il n'y a plus qu'un abonnement et qu'un seul « Pro ».
  dynStatsDetaillees: boolean // stats par jour / appareil / pays (sinon total + dernier scan)
  dynDomaineMarque: boolean   // lien court à la marque du commerçant
  dynSecuriteLien: boolean    // mot de passe, expiration programmée, pause manuelle
  dynEnMasse: boolean         // création en masse par import CSV
  apiAppelsMois: number | null // appels API publics par mois calendaire (null = pas d'accès)
}

export type GroupePerk = "Pages" | "QR codes" | "Statistiques" | "Image de marque" | "Outils" | "Équipe & support"
/** Ordre d'affichage des groupes sur la grille tarifaire. */
export const GROUPES_PERKS: readonly GroupePerk[] = ["Pages", "QR codes", "Statistiques", "Image de marque", "Outils", "Équipe & support"]

/**
 * Ce qui ADOSSE une promesse tarifaire à quelque chose de réel :
 *  • `limits.<clé>` / `caps.<clé>` : un champ de CE plan, vérifiable ici même ;
 *  • `produit:<fichier>` : une surface du produit, vérifiée par la garde
 *    `app/promessesTenues.test.ts` (le fichier doit exister).
 *
 * Une promesse `included: true` DOIT porter une preuve. Relevé du 11 septembre :
 * « Support prioritaire » figurait sur les deux plans payants sans une seule
 * occurrence ailleurs dans le produit, et « Génération IA » était vendue sans
 * consulter le drapeau que l'éditeur, lui, respecte déjà.
 */
export type Preuve = `limits.${string}` | `caps.${string}` | `produit:${string}`

export type Perk = {
  text: string
  included: boolean
  /** Requise dès que `included` vaut true. */
  preuve?: Preuve
  /** Promise mais pas encore construite : affichée « bientôt », jamais comme acquise. */
  soon?: boolean
  groupe: GroupePerk
}

export interface Plan {
  id: PlanId
  label: string
  color: string
  description: string
  priceMonthly: number // € / mois (facturation mensuelle)
  /**
   * Le montant réellement facturé pour douze mois, en une fois. C'est LUI qui
   * est stocké : c'est lui qui part chez Stripe, et lui que le client verra sur
   * son relevé. Tout le reste s'en déduit.
   */
  priceAnnualTotal: number
  /**
   * Équivalent mensuel de l'annuel — DÉRIVÉ de `priceAnnualTotal`, jamais saisi.
   *
   * Le multiplier par douze ne redonne pas la facture (12,42 × 12 = 149,04, et
   * la facture vaut 149) : c'est exactement l'écart que l'accueil et la page
   * d'abonnement affichaient chacun à leur façon. Pour un total annuel, lire
   * `priceAnnualTotal`. Voir lib/tarifs.ts.
   */
  priceAnnual: number
  badge: string | null
  limits: PlanLimits
  caps: PlanCaps
  features: string[] // liste courte (carte plan du dashboard)
  /** Liste détaillée (page /upgrade) ; soon = feature promise mais pas encore construite ; groupe = thème d'affichage (revue du 9 septembre : listes regroupées). */
  perks: Perk[]
}

const PLANS_ECRITS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Gratuit",
    color: "#8A8478",
    description: "Une page et son QR, pour commencer",
    priceMonthly: 0,
    priceAnnualTotal: 0,
    priceAnnual: 0,   // dérivé — voir PLANS, plus bas
    badge: null,
    limits: { pages: 1, views: null, qr: 3, dyn: 1, team: null },
    caps: { printStudio: true, qrStudioAdvanced: false, ai: false, removeBranding: false, pageIntro: false, exportFormats: ["png"],
            dynStatsDetaillees: false, dynDomaineMarque: false, dynSecuriteLien: false, dynEnMasse: false, apiAppelsMois: null },
    features: ["1 page", "Vues illimitées", "3 QR autonomes, dont 1 modifiable", "Branding QRowg visible", "Statistiques de base"],
    perks: [
      { text: "1 page publiée", included: true, preuve: "limits.pages", groupe: "Pages" },
      // « un QR imprimé ne s'arrête jamais » : faux sur ce plan. Un retour au
      // gratuit met en pause les QR modifiables au-delà de `limits.dyn` — cinq
      // supports imprimés sur six, pour qui en avait six (lot v82). La promesse
      // porte sur ce qu'elle peut tenir : le nombre de vues.
      { text: "Vues illimitées, sans compteur qui s'arrête", included: true, preuve: "limits.views", groupe: "Pages" },
      { text: "3 QR autonomes", included: true, preuve: "limits.qr", groupe: "QR codes" },
      { text: "1 QR modifiable après impression", included: true, preuve: "limits.dyn", groupe: "QR codes" },
      { text: "Hébergement inclus", included: true, preuve: "produit:app/[slug]/page.tsx", groupe: "Pages" },
      { text: "Statistiques de base", included: true, preuve: "produit:app/dashboard/analytics/AnalyticsClient.tsx", groupe: "Statistiques" },
      { text: "Branding QRowg visible", included: true, preuve: "produit:app/[slug]/PublicPageClient.tsx", groupe: "Image de marque" },
      // L'atelier est GRATUIT pour tous les plans depuis qu'il ne crée plus de QR
      // (`app/dashboard/print-studio/page.tsx` le dit et le fait). La grille le
      // refusait encore au gratuit : elle vendait ce que le produit donnait déjà.
      { text: "Atelier d'impression", included: true, preuve: "caps.printStudio", groupe: "Outils" },
      { text: "Domaine personnalisé", included: false, preuve: "caps.dynDomaineMarque", groupe: "Image de marque" },
      { text: "Génération IA", included: false, preuve: "caps.ai", groupe: "Outils" },
    ],
  },
  // ── Starter — rétabli le 11 novembre 2026 ─────────────────────────────────
  //
  // Ce qui déclenche le premier euro, c'est le RETRAIT de la mention QRowg :
  // un commerçant accepte mal que la page de son commerce porte le nom d'un
  // autre. C'est donc la seule capacité majeure que ce palier ouvre.
  //
  // Ce qu'il n'ouvre PAS est tout aussi délibéré : statistiques détaillées,
  // domaine personnalisé et génération IA restent le saut vers Pro. Sans cela,
  // Pro n'aurait plus d'argument et ce palier le cannibaliserait.
  starter: {
    id: "starter",
    label: "Starter",
    color: "#B0A07A",
    description: "Une vitrine sans la marque d'un autre",
    priceMonthly: 4.9,
    // 46,80 € l'année = 3,90 € par mois, deux mois offerts.
    priceAnnualTotal: 46.8,
    priceAnnual: 0,   // dérivé — voir PLANS, plus bas
    badge: null,
    limits: { pages: 3, views: null, qr: 10, dyn: 5, team: null },
    caps: { printStudio: true, qrStudioAdvanced: true, ai: false, removeBranding: true, pageIntro: false, exportFormats: ["png", "png-t", "webp"],
            dynStatsDetaillees: false, dynDomaineMarque: false, dynSecuriteLien: false, dynEnMasse: false, apiAppelsMois: null },
    features: ["3 pages", "Vues illimitées", "10 QR autonomes, dont 5 modifiables", "Sans mention QRowg", "QR Studio complet"],
    perks: [
      { text: "3 pages publiées", included: true, preuve: "limits.pages", groupe: "Pages" },
      { text: "Vues illimitées, sans compteur qui s'arrête", included: true, preuve: "limits.views", groupe: "Pages" },
      { text: "Hébergement inclus", included: true, preuve: "produit:app/[slug]/page.tsx", groupe: "Pages" },
      { text: "10 QR autonomes", included: true, preuve: "limits.qr", groupe: "QR codes" },
      { text: "5 QR modifiables après impression", included: true, preuve: "limits.dyn", groupe: "QR codes" },
      { text: "Changer la destination sans réimprimer", included: true, preuve: "produit:app/dashboard/qr-link/page.tsx", groupe: "QR codes" },
      { text: "Mention QRowg retirée", included: true, preuve: "caps.removeBranding", groupe: "Image de marque" },
      { text: "QR Studio complet", included: true, preuve: "caps.qrStudioAdvanced", groupe: "Outils" },
      { text: "Atelier d'impression", included: true, preuve: "caps.printStudio", groupe: "Outils" },
      { text: "Statistiques de base", included: true, preuve: "produit:app/dashboard/analytics/AnalyticsClient.tsx", groupe: "Statistiques" },
      { text: "Statistiques détaillées : jour, appareil, pays", included: false, preuve: "caps.dynStatsDetaillees", groupe: "Statistiques" },
      { text: "Domaine personnalisé", included: false, preuve: "caps.dynDomaineMarque", groupe: "Image de marque" },
      { text: "Génération IA", included: false, preuve: "caps.ai", groupe: "Outils" },
    ],
  },
  pro: {
    id: "pro",
    label: "Établissement",
    color: "#C9A84C",
    description: "Un commerce, tout ce qu'il lui faut",
    priceMonthly: 12.9,
    // 118,80 € l'année = 9,90 € par mois, trois mois offerts.
    priceAnnualTotal: 118.8,
    priceAnnual: 0,   // dérivé — voir PLANS, plus bas
    badge: "LE PLUS CHOISI",
    limits: { pages: 10, views: null, qr: 30, dyn: 20, team: null },
    caps: { printStudio: true, qrStudioAdvanced: true, ai: true, removeBranding: true, pageIntro: true, exportFormats: ["png", "png-t", "webp", "svg", "pdf"],
            dynStatsDetaillees: true, dynDomaineMarque: true, dynSecuriteLien: true, dynEnMasse: false, apiAppelsMois: 1000 },
    features: ["10 pages", "Vues illimitées", "30 QR, dont 20 modifiables après impression", "Sans branding", "Atelier d'impression complet", "Domaine personnalisé", "Statistiques détaillées"],
    perks: [
      { text: "10 pages — de quoi couvrir un commerce entier", included: true, preuve: "limits.pages", groupe: "Pages" },
      { text: "Vues illimitées", included: true, preuve: "limits.views", groupe: "Pages" },
      { text: "30 QR autonomes, dont 20 modifiables après impression", included: true, preuve: "limits.qr", groupe: "QR codes" },
      { text: "Changer la destination sans réimprimer", included: true, preuve: "produit:app/dashboard/qr-link/page.tsx", groupe: "QR codes" },
      { text: "Statistiques détaillées : jour, appareil, pays", included: true, preuve: "caps.dynStatsDetaillees", groupe: "Statistiques" },
      { text: "Mot de passe et expiration sur un lien", included: true, preuve: "caps.dynSecuriteLien", groupe: "QR codes" },
      { text: "Branding QRowg retiré", included: true, preuve: "caps.removeBranding", groupe: "Image de marque" },
      { text: "Domaine personnalisé", included: true, preuve: "caps.dynDomaineMarque", groupe: "Image de marque" },
      { text: "QR Studio complet", included: true, preuve: "caps.qrStudioAdvanced", groupe: "Outils" },
      { text: "Atelier d'impression complet", included: true, preuve: "caps.printStudio", groupe: "Outils" },
      { text: "Tous les modèles", included: true, preuve: "produit:app/dashboard/templates/page.tsx", groupe: "Pages" },
      { text: "Génération IA + rapports", included: true, preuve: "caps.ai", groupe: "Outils" },
      { text: "Export PNG transparent, WEBP, SVG et PDF HD", included: true, preuve: "caps.exportFormats", groupe: "Outils" },
      { text: "Accès API · 1 000 appels / mois", included: true, preuve: "caps.apiAppelsMois", groupe: "Outils" }, // = caps.apiAppelsMois (testé)
      ],
  },
  business: {
    id: "business",
    label: "Multi-sites",
    color: "#39FF8F",
    description: "Plusieurs établissements, une agence, une franchise",
    priceMonthly: 29.9,
    // 298,80 € l'année = 24,90 € par mois, deux mois offerts.
    priceAnnualTotal: 298.8,
    priceAnnual: 0,   // dérivé — voir PLANS, plus bas
    badge: null,
    limits: { pages: null, views: null, qr: null, dyn: null, team: 5 },
    caps: { printStudio: true, qrStudioAdvanced: true, ai: true, removeBranding: true, pageIntro: true, exportFormats: ["png", "png-t", "webp", "svg", "pdf"],
            dynStatsDetaillees: true, dynDomaineMarque: true, dynSecuriteLien: true, dynEnMasse: true, apiAppelsMois: 10000 },
    features: ["Jusqu'à 5 établissements", "Pages et QR illimités", "Import CSV en masse", "Équipe · 5 membres", "Marque blanche", "API"],
    perks: [
      { text: "Pages illimitées", included: true, preuve: "limits.pages", groupe: "Pages" },
      { text: "QR autonomes et modifiables illimités", included: true, preuve: "limits.qr", groupe: "QR codes" },
      { text: "Création en masse par import CSV", included: true, preuve: "caps.dynEnMasse", groupe: "QR codes" },
      { text: "5 membres d'équipe", included: true, preuve: "limits.team", groupe: "Équipe & support" },
      { text: "Marque blanche", included: true, preuve: "caps.removeBranding", groupe: "Image de marque" },
      { text: "Domaine personnalisé", included: true, preuve: "caps.dynDomaineMarque", groupe: "Image de marque" },
      { text: "Statistiques détaillées + export", included: true, preuve: "caps.dynStatsDetaillees", groupe: "Statistiques" },
      { text: "QR Studio et atelier d'impression complets", included: true, preuve: "caps.printStudio", groupe: "Outils" },
      { text: "Génération IA illimitée + rapports", included: true, preuve: "caps.ai", groupe: "Outils" },
      { text: "Accès API · 10 000 appels / mois", included: true, preuve: "caps.apiAppelsMois", groupe: "Outils" }, // = caps.apiAppelsMois (testé)
      ],
  },
}

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"]
/**
 * L'équivalent mensuel n'est plus saisi à côté du total annuel : il en est
 * calculé. Deux chiffres écrits à la main finissent toujours par diverger — ici,
 * ils divergeaient de quatre centimes multipliés par douze.
 */
export const PLANS: Record<PlanId, Plan> = Object.fromEntries(
  Object.entries(PLANS_ECRITS).map(([id, p]) => [id, { ...p, priceAnnual: mensuelEquivalent(p.priceAnnualTotal) }]),
) as Record<PlanId, Plan>

export const PLAN_LIST: Plan[] = PLAN_ORDER.map(id => PLANS[id])
// `starter` est redevenu un palier à part entière (11 novembre 2026). Il avait
// survécu ici comme alias d'Établissement, le temps que l'ancienne grille soit
// retirée ; il reprend son rang propre, entre le gratuit et Établissement.
export const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, business: 3 }

/**
 * Renvoie le plan d'un identifiant — `free` si l'identifiant est inconnu.
 *
 * ⚠️ Cette ligne repliait `starter` sur `pro` : tant que Starter n'était plus
 * vendu, c'était la bonne protection — un compte hérité de l'ancienne grille ne
 * devait pas se réveiller au plan gratuit. Depuis que Starter est redevenu un
 * palier à part entière (11 novembre 2026), le même repli donnerait à un client
 * à 4,90 € toutes les limites et capacités d'un client à 12,90 € : dix pages au
 * lieu de trois, le domaine personnalisé, l'IA et l'API. Le repli est donc
 * retiré, et `starter` se résout à lui-même.
 *
 * Aucun compte hérité n'existe : vérifié en base avant le changement, les trois
 * profils sont `free` et aucun n'a jamais porté `starter`.
 */
export const getPlan = (id?: string | null): Plan => PLANS[(id as PlanId)] ?? PLANS.free

// Limite de pages d'un plan (null = illimité) — utilisée par l'enforcement
export const pageLimit = (id?: string | null): number | null => getPlan(id).limits.pages

// Limite de QR autonomes enregistrés, statiques ET modifiables (null = illimité).
export const qrLimit = (id?: string | null): number | null => getPlan(id).limits.qr

// Combien de ces QR peuvent être MODIFIABLES après impression (null = illimité).
// Sous-ensemble de `qrLimit` : un QR modifiable consomme aussi un slot de `qr`.
export const dynLimit = (id?: string | null): number | null => getPlan(id).limits.dyn

// Équipe : nombre de membres invitables (null = fonctionnalité indisponible sur ce plan).
export const teamLimit = (id?: string | null): number | null => getPlan(id).limits.team
export const canTeam = (id?: string | null): boolean => (getPlan(id).limits.team ?? 0) > 0

// Capacités d'un plan (gating fonctionnalités)
export const caps = (id?: string | null): PlanCaps => getPlan(id).caps
export const canPrintStudio = (id?: string | null): boolean => getPlan(id).caps.printStudio
export const canQrAdvanced = (id?: string | null): boolean => getPlan(id).caps.qrStudioAdvanced
export const canAI = (id?: string | null): boolean => getPlan(id).caps.ai
// true = le plan retire le branding "Créé avec QRowg" des pages publiques
export const canRemoveBranding = (id?: string | null): boolean => getPlan(id).caps.removeBranding
export const canPageIntro = (id?: string | null): boolean => getPlan(id).caps.pageIntro
// QR modifiables après impression : les quatre capacités de l'ancien second abonnement.
export const canDynStats = (id?: string | null): boolean => getPlan(id).caps.dynStatsDetaillees
export const canDynDomaine = (id?: string | null): boolean => getPlan(id).caps.dynDomaineMarque
export const canDynSecurite = (id?: string | null): boolean => getPlan(id).caps.dynSecuriteLien
export const canDynMasse = (id?: string | null): boolean => getPlan(id).caps.dynEnMasse
// Accès à l'API publique (clés qrk_ + endpoints /v1) : réservé Pro et Business.
export const canApi = (id?: string | null): boolean => PLAN_RANK[getPlan(id).id] >= PLAN_RANK.pro
// Plafond mensuel d'appels API du plan (null = pas d'accès API).
export const apiQuotaMensuel = (id?: string | null): number | null => getPlan(id).caps.apiAppelsMois
export const canExport = (id: string | null | undefined, fmt: ExportFormat): boolean => getPlan(id).caps.exportFormats.includes(fmt)
// Plan minimum requis pour une capacité (pour les messages d'upsell)
export const minPlanFor = (cap: "printStudio" | "qrStudioAdvanced" | "ai" | "dynStatsDetaillees" | "dynDomaineMarque" | "dynSecuriteLien" | "dynEnMasse"): PlanId => {
  const found = PLAN_LIST.find(p => p.caps[cap])
  return (found?.id ?? "pro")
}
export const minPlanForFormat = (fmt: ExportFormat): PlanId => {
  const found = PLAN_LIST.find(p => p.caps.exportFormats.includes(fmt))
  return (found?.id ?? "pro")
}

// Formatte un prix TTC pour l'affichage FR : 0 -> "0", 4.9 -> "4,90", 12.9 -> "12,90".
// Les prix affiches sont TTC (cible B2C : indispensable legalement en France).
export const fmtPrice = (n: number): string =>
  n === 0 ? "0" : n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Tableau comparatif — DÉRIVÉ, et non plus recopié ────────────────────────
//
// Il était écrit à la main, ligne par ligne, à côté des capacités qu'il est censé
// décrire. Relevé du 29 septembre, cinq écarts :
//
//  • « Atelier d'impression » y était barré pour le plan gratuit — alors que
//    `caps.printStudio` vaut `true` pour lui, que la carte tarifaire l'annonce et
//    que le produit l'ouvre. Le tableau était le seul à dire non.
//  • « Export HD » vendait du JPG. Aucun plan ne l'exporte : `exportFormats` ne
//    l'a jamais contenu. Il taisait en revanche le PNG transparent et le WEBP.
//  • « 27 modèles gratuits » : il y en a quarante sur quarante-huit.
//  • « Marque blanche », réservée au plan Multi-sites, a pour preuve déclarée
//    `caps.removeBranding` — que le plan Établissement possède aussi.
//  • « IA ✓ illimité » pour Multi-sites : aucun champ ne compte les générations,
//    et rien ne distingue les deux plans sur ce point.
//
// Chaque ligne LIT désormais le plan. Une capacité ne peut plus vouloir dire une
// chose sur la carte et une autre dans le tableau.
const OUI = "✓", NON = "—"

/** Nom commercial d'un format d'export, depuis la liste que l'atelier propose vraiment. */
const FORMAT_LABEL: Record<ExportFormat, string> = {
  png: "PNG", "png-t": "PNG transparent", webp: "WEBP", svg: "SVG", pdf: "PDF HD",
}

/**
 * Modèles ouverts sans payer, sur les 48 du catalogue.
 *
 * Le compte ne peut pas se faire ici : les 34 modèles partagés vivent dans
 * `page-templates.ts` et les 14 modèles signature dans le JSX de la galerie —
 * `plans.ts`, lui, doit rester importable côté serveur. Il est donc écrit, et
 * VÉRIFIÉ par une garde qui recompte les deux sources (droitsCoherents.test.ts).
 */
export const MODELES_GRATUITS = 40
export const MODELES_TOTAL = 48

type LigneComparatif = { feature: string; lire: (p: Plan) => string }

const LIGNES_COMPARATIF: LigneComparatif[] = [
  { feature: "Pages", lire: p => p.limits.pages === null ? "Illimitées" : String(p.limits.pages) },
  { feature: "Vues / mois", lire: p => p.limits.views === null ? "Illimitées" : String(p.limits.views) },
  { feature: "QR autonomes", lire: p => p.limits.qr === null ? "Illimités" : String(p.limits.qr) },
  { feature: "…dont modifiables après impression", lire: p => p.limits.dyn === null ? "Illimités" : String(p.limits.dyn) },
  { feature: "Changer la destination sans réimprimer", lire: p => p.limits.dyn === null ? "Illimité" : `${p.limits.dyn} QR` },
  { feature: "QR Studio", lire: p => p.caps.qrStudioAdvanced ? "Complet" : "De base" },
  { feature: "Atelier d'impression", lire: p => !p.caps.printStudio ? NON : p.caps.qrStudioAdvanced ? "Complet" : "Inclus" },
  { feature: "Statistiques", lire: p => p.caps.dynStatsDetaillees ? "Détaillées + export" : "De base" },
  { feature: "Mot de passe · expiration d'un lien", lire: p => p.caps.dynSecuriteLien ? OUI : NON },
  { feature: "Import CSV en masse", lire: p => p.caps.dynEnMasse ? OUI : NON },
  { feature: "IA", lire: p => p.caps.ai ? OUI : NON },
  { feature: "Formats d'export", lire: p => p.caps.exportFormats.map(f => FORMAT_LABEL[f]).join(" + ") },
  { feature: "Modèles", lire: p => p.id === "free" ? `${MODELES_GRATUITS} sur ${MODELES_TOTAL}` : "Tous" },
  { feature: "Mention QRowg sur la page", lire: p => p.caps.removeBranding ? "Retirée" : "Affichée" },
  { feature: "Domaine perso", lire: p => p.caps.dynDomaineMarque ? OUI : NON },
  // `team: null` ne veut PAS dire « illimité » ici, contrairement à `pages` : il
  // veut dire « pas d'équipe ». Le champ porte donc deux sens selon la clé — écrit
  // noir sur blanc plutôt que corrigé à l'aveugle, une donnée en dépend.
  { feature: "Équipe", lire: p => p.limits.team === null ? NON : `${p.limits.team} membres` },
  { feature: "Marque blanche", lire: p => p.caps.removeBranding ? OUI : NON },
  { feature: "API", lire: p => p.caps.apiAppelsMois === null ? NON : `${p.caps.apiAppelsMois.toLocaleString("fr-FR")} / mois` },
  // « Support prioritaire » figurait ici pour les deux plans payants. Rien, dans
  // le produit, ne distingue leur support : il n'y a qu'un formulaire de contact,
  // le même pour tout le monde. Une promesse sans contrepartie s'enlève — la
  // remettre demande d'abord de la tenir.
  { feature: "Support", lire: () => "Par e-mail" },
]

// Le tableau avait ses quatre colonnes écrites à la main — `free`, `pro`,
// `business` — ce qui obligeait à le rouvrir à chaque palier ajouté, et laissait
// une colonne manquante passer pour une case vide. Il se construit maintenant
// depuis PLAN_ORDER : ajouter un plan le remplit, en retirer un le vide.
export type LigneDuComparatif = { feature: string } & Record<PlanId, string>

export const PLAN_COMPARISON: LigneDuComparatif[] =
  LIGNES_COMPARATIF.map(l => ({
    feature: l.feature,
    ...Object.fromEntries(PLAN_ORDER.map(id => [id, l.lire(PLANS[id])])),
  }) as LigneDuComparatif)
