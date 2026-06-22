// =============================================================================
// lib/plans.ts — SOURCE DE VÉRITÉ UNIQUE des plans QRfolio
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

export type PlanId = "free" | "starter" | "pro" | "business"

export type PlanLimits = {
  pages: number | null // null = illimité
  views: number | null
  qr: number | null
  team: number | null
}

export interface Plan {
  id: PlanId
  label: string
  color: string
  description: string
  priceMonthly: number // € / mois (facturation mensuelle)
  priceAnnual: number  // € / mois (si facturé annuellement)
  badge: string | null
  limits: PlanLimits
  features: string[] // liste courte (carte plan du dashboard)
  perks: { text: string; included: boolean }[] // liste détaillée (page /upgrade)
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Gratuit",
    color: "#8A8478",
    description: "Pour decouvrir QRfolio",
    priceMonthly: 0,
    priceAnnual: 0,
    badge: null,
    limits: { pages: 1, views: 500, qr: 1, team: null },
    features: ["1 page active", "500 vues/mois", "1 QR code basique", "Analytics de base", "Branding QRfolio visible"],
    perks: [
      { text: "1 page", included: true },
      { text: "500 vues / mois", included: true },
      { text: "1 QR code basique", included: true },
      { text: "Analytics de base", included: true },
      { text: "Branding QRfolio visible", included: true },
      { text: "Domaine personnalise", included: false },
      { text: "QR codes personnalises", included: false },
      { text: "Analytics avances", included: false },
      { text: "Templates premium", included: false },
    ],
  },
  starter: {
    id: "starter",
    label: "Starter",
    color: "#38BDF8",
    description: "Pour les createurs individuels",
    priceMonthly: 2.99,
    priceAnnual: 2.39,
    badge: "POPULAIRE",
    limits: { pages: 3, views: 5000, qr: null, team: null },
    features: ["3 pages", "5 000 vues/mois", "QR codes personnalises", "Sans branding", "Analytics standard", "Domaine personnalise"],
    perks: [
      { text: "3 pages", included: true },
      { text: "5 000 vues / mois", included: true },
      { text: "QR codes personnalises", included: true },
      { text: "Sans branding QRfolio", included: true },
      { text: "Analytics standard", included: true },
      { text: "Domaine personnalise", included: true },
      { text: "Templates Starter", included: true },
      { text: "Support par email", included: true },
      { text: "Analytics avances", included: false },
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    color: "#C9A84C",
    description: "Pour les professionnels et commerces",
    priceMonthly: 9.99,
    priceAnnual: 7.99,
    badge: null,
    limits: { pages: null, views: 50000, qr: null, team: null },
    features: ["Pages illimitees", "50 000 vues/mois", "QR codes avances", "Analytics avances + export", "Tous les templates", "Support prioritaire"],
    perks: [
      { text: "Pages illimitees", included: true },
      { text: "50 000 vues / mois", included: true },
      { text: "QR codes personnalises avances", included: true },
      { text: "Sans branding QRfolio", included: true },
      { text: "Analytics avances + export", included: true },
      { text: "Domaine personnalise", included: true },
      { text: "Tous les templates", included: true },
      { text: "Support prioritaire", included: true },
      { text: "Rapport hebdo par IA", included: true },
    ],
  },
  business: {
    id: "business",
    label: "Business",
    color: "#39FF8F",
    description: "Pour les agences et equipes",
    priceMonthly: 24.99,
    priceAnnual: 19.99,
    badge: null,
    limits: { pages: null, views: null, qr: null, team: 5 },
    features: ["Vues illimitees", "Tout Plan Pro inclus", "Equipe 5 membres", "Acces API complet", "Marque blanche", "Support 24/7 dedie"],
    perks: [
      { text: "Vues illimitees", included: true },
      { text: "Tout Plan Pro inclus", included: true },
      { text: "Gestion equipe (5 membres)", included: true },
      { text: "Acces API complet", included: true },
      { text: "Pages en marque blanche", included: true },
      { text: "Support dedie 24/7", included: true },
      { text: "Onboarding personnalise", included: true },
      { text: "SLA garanti 99.9%", included: true },
      { text: "Facturation entreprise", included: true },
    ],
  },
}

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"]
export const PLAN_LIST: Plan[] = PLAN_ORDER.map(id => PLANS[id])
export const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, business: 3 }

// Renvoie le plan (free par défaut si inconnu)
export const getPlan = (id?: string | null): Plan => PLANS[(id as PlanId)] ?? PLANS.free

// Limite de pages d'un plan (null = illimité) — utilisée par l'enforcement
export const pageLimit = (id?: string | null): number | null => getPlan(id).limits.pages

// Formatte un prix pour l'affichage : 0 -> "0", 2.99 -> "2.99", 8 -> "8"
export const fmtPrice = (n: number): string => (n === 0 ? "0" : String(n))

// Tableau comparatif (page /upgrade + comparaisons)
export const PLAN_COMPARISON: { feature: string; free: string; starter: string; pro: string; business: string }[] = [
  { feature: "Pages", free: "1", starter: "3", pro: "Illimitees", business: "Illimitees" },
  { feature: "Vues / mois", free: "500", starter: "5 000", pro: "50 000", business: "Illimitees" },
  { feature: "QR codes", free: "Basique", starter: "Personnalise", pro: "Avance", business: "Avance" },
  { feature: "Branding QRfolio", free: "Oui", starter: "Non", pro: "Non", business: "Non" },
  { feature: "Domaine perso", free: "—", starter: "✓", pro: "✓", business: "✓" },
  { feature: "Analytics", free: "De base", starter: "Standard", pro: "Avances + export", business: "Avances + export" },
  { feature: "Templates", free: "6 gratuits", starter: "+4 Starter", pro: "Tous", business: "Tous" },
  { feature: "Rapport IA", free: "—", starter: "—", pro: "✓", business: "✓" },
  { feature: "Equipe", free: "—", starter: "—", pro: "—", business: "5 membres" },
  { feature: "API", free: "—", starter: "—", pro: "—", business: "✓" },
  { feature: "Support", free: "FAQ", starter: "Email", pro: "Prioritaire", business: "Dedie 24/7" },
]
