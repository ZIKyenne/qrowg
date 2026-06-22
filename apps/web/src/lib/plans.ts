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
    limits: { pages: 3, views: 200, qr: 3, team: null },
    features: ["3 pages", "200 vues/mois", "3 QR codes basiques", "Branding QRfolio visible", "Analytics de base", "6 templates gratuits"],
    perks: [
      { text: "3 pages", included: true },
      { text: "200 vues / mois", included: true },
      { text: "3 QR codes basiques", included: true },
      { text: "Hebergement inclus", included: true },
      { text: "Analytics de base", included: true },
      { text: "6 templates gratuits", included: true },
      { text: "Branding QRfolio visible", included: true },
      { text: "QR Studio", included: false },
      { text: "QR Print Studio", included: false },
      { text: "Generation IA", included: false },
    ],
  },
  starter: {
    id: "starter",
    label: "Starter",
    color: "#38BDF8",
    description: "Pour independants, artisans et createurs",
    priceMonthly: 2.99,
    priceAnnual: 2.39,
    badge: "MEILLEUR RAPPORT Q/P",
    limits: { pages: 5, views: 850, qr: 7, team: null },
    features: ["5 pages", "850 vues/mois", "7 QR codes personnalises", "Sans branding", "Domaine personnalise", "10 templates premium", "QR Studio (limite)", "QR Print Studio (limite)"],
    perks: [
      { text: "5 pages", included: true },
      { text: "850 vues / mois", included: true },
      { text: "7 QR codes personnalises", included: true },
      { text: "Branding QRfolio retire", included: true },
      { text: "Domaine personnalise", included: true },
      { text: "Analytics standards", included: true },
      { text: "10 templates premium", included: true },
      { text: "QR Studio (version limitee)", included: true },
      { text: "QR Print Studio (version limitee)", included: true },
      { text: "Export PNG", included: true },
      { text: "Support standard", included: true },
      { text: "Generation IA", included: false },
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    color: "#C9A84C",
    description: "Le plan principal de QRfolio",
    priceMonthly: 9.99,
    priceAnnual: 7.99,
    badge: "POPULAIRE",
    limits: { pages: 25, views: 15000, qr: 35, team: null },
    features: ["25 pages", "15 000 vues/mois", "35 QR codes avances", "Tous les templates", "QR Studio complet", "QR Print Studio complet", "Generation IA", "Export PNG / JPG / PDF HD"],
    perks: [
      { text: "25 pages", included: true },
      { text: "15 000 vues / mois", included: true },
      { text: "35 QR codes avances", included: true },
      { text: "Domaine personnalise", included: true },
      { text: "Branding retire", included: true },
      { text: "Analytics avances + export", included: true },
      { text: "Tous les templates", included: true },
      { text: "QR Studio complet", included: true },
      { text: "QR Print Studio complet", included: true },
      { text: "Generation IA + rapports IA", included: true },
      { text: "Export PNG / JPG / PDF HD", included: true },
      { text: "Bibliotheque premium", included: true },
      { text: "Styles avances + mockups premium", included: true },
      { text: "Support prioritaire", included: true },
    ],
  },
  business: {
    id: "business",
    label: "Business",
    color: "#39FF8F",
    description: "Agences, franchises et entreprises",
    priceMonthly: 24.99,
    priceAnnual: 19.99,
    badge: null,
    limits: { pages: null, views: null, qr: null, team: 5 },
    features: ["Pages illimitees", "Vues illimitees", "QR codes illimites", "Generation IA illimitee", "5 membres d'equipe", "API + marque blanche"],
    perks: [
      { text: "Pages illimitees", included: true },
      { text: "Vues illimitees", included: true },
      { text: "QR codes avances illimites", included: true },
      { text: "Domaine personnalise", included: true },
      { text: "Branding retire", included: true },
      { text: "Analytics avances + export", included: true },
      { text: "Tous les templates", included: true },
      { text: "QR Studio complet", included: true },
      { text: "QR Print Studio complet", included: true },
      { text: "Generation IA illimitee + rapports", included: true },
      { text: "5 membres d'equipe", included: true },
      { text: "Acces API", included: true },
      { text: "Marque blanche", included: true },
      { text: "Support 24/7 prioritaire", included: true },
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
  { feature: "Pages", free: "3", starter: "5", pro: "25", business: "Illimitees" },
  { feature: "Vues / mois", free: "200", starter: "850", pro: "15 000", business: "Illimitees" },
  { feature: "QR codes", free: "3 basiques", starter: "7 personnalises", pro: "35 avances", business: "Illimites" },
  { feature: "QR Studio", free: "❌", starter: "Version limitee", pro: "Complet", business: "Complet" },
  { feature: "QR Print Studio", free: "❌", starter: "Version limitee", pro: "Complet", business: "Complet" },
  { feature: "IA", free: "❌", starter: "❌", pro: "✓", business: "✓ illimite" },
  { feature: "Export HD", free: "❌", starter: "PNG", pro: "PNG + JPG + PDF HD", business: "PNG + JPG + PDF HD" },
  { feature: "Templates", free: "6", starter: "10", pro: "Tous", business: "Tous" },
  { feature: "Branding QRfolio", free: "Oui", starter: "Non", pro: "Non", business: "Non" },
  { feature: "Domaine perso", free: "❌", starter: "✓", pro: "✓", business: "✓" },
  { feature: "Analytics", free: "De base", starter: "Standard", pro: "Avances + export", business: "Avances + export" },
  { feature: "Equipe", free: "—", starter: "—", pro: "—", business: "5 membres" },
  { feature: "API", free: "—", starter: "—", pro: "—", business: "✓" },
  { feature: "Marque blanche", free: "—", starter: "—", pro: "—", business: "✓" },
  { feature: "Support", free: "Communaute", starter: "Standard", pro: "Prioritaire", business: "24/7 VIP" },
]
