// pilotage.ts — l'entonnoir de croissance, calculé depuis la base seule.
//
// Audit du 14 novembre 2026 (F) : « Mesurer taux de passage et délai médian par
// étape. Distinguer clic, tentative et succès. » Décision du 16 novembre : pas
// d'outil d'analyse en plus — Supabase seul. On ne compte donc que des SUCCÈS
// inscrits en base (un compte créé, une page écrite, une publication datée, un
// scan humain, un abonnement Stripe) ; les clics et tentatives restent dans
// Vercel Analytics (lib/funnel), et ce qui n'est mesuré nulle part est NOMMÉ
// comme tel plutôt que deviné.
//
// Règle maison : sous le seuil, pas de pourcentage — « 2 sur 3 » n'est pas
// « 67 % ». Module PUR : la page serveur lit, ce module calcule.

export const SEUIL_TAUX = 10
const JOUR = 864e5

export type Compte = { id: string; inscritLe: string }
export type PageLue = { id: string; user_id: string; created_at: string; published_at: string | null }
export type ScanLu = { page_id: string; scanned_at: string }
export type AbonnementLu = { user_id: string; status: string | null; plan: string | null; cancel_at_period_end: boolean | null }

export type Etape = {
  cle: "inscrit" | "page" | "publiee" | "scan" | "payant"
  libelle: string
  nombre: number
  /** Passage depuis l'étape précédente, en %, ou null sous le seuil. */
  taux: number | null
  /** « 3 sur 4 » — toujours dit, même sous le seuil. */
  surPrecedente: string | null
  /** Délai médian depuis l'inscription, en jours (1 décimale), ou null. */
  delaiMedianJours: number | null
}

export type Pilotage = {
  fenetreJours: number
  etapes: Etape[]
  retention: { comptesDePlusDe30j: number; actifsSur30j: number; taux: number | null }
  revenu: { payants: number; parPlan: Record<string, number>; resiliationsProgrammees: number; impayes: number }
  nonMesure: string[]
}

const PAYANT = new Set(["active", "trialing", "past_due"])

export function mediane(xs: readonly number[]): number | null {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const taux = (n: number, sur: number) => (sur >= SEUIL_TAUX ? Math.round((n / sur) * 100) : null)
const jours = (ms: number) => Math.round((ms / JOUR) * 10) / 10

export function calculerPilotage(
  e: { comptes: Compte[]; pages: PageLue[]; scans: ScanLu[]; abonnements: AbonnementLu[] },
  maintenant: number = Date.now(),
  fenetreJours = 90,
): Pilotage {
  const debut = maintenant - fenetreJours * JOUR
  const cohorte = e.comptes.filter(c => Date.parse(c.inscritLe) >= debut)
  const inscrit = new Map(cohorte.map(c => [c.id, Date.parse(c.inscritLe)]))

  const proprietaire = new Map(e.pages.map(p => [p.id, p.user_id]))
  const premiere = (paires: [string, number][]) => {
    const m = new Map<string, number>()
    for (const [u, t] of paires) if (inscrit.has(u) && Number.isFinite(t) && (!m.has(u) || t < m.get(u)!)) m.set(u, t)
    return m
  }
  const pageCreee = premiere(e.pages.map(p => [p.user_id, Date.parse(p.created_at)]))
  const pagePubliee = premiere(e.pages.filter(p => p.published_at).map(p => [p.user_id, Date.parse(p.published_at!)]))
  const premierScan = premiere(e.scans.map(s => [proprietaire.get(s.page_id) ?? "", Date.parse(s.scanned_at)]))
  const payants = new Set(e.abonnements.filter(a => PAYANT.has(a.status ?? "") && inscrit.has(a.user_id)).map(a => a.user_id))

  const delai = (m: Map<string, number>) => {
    const d = [...m].map(([u, t]) => t - inscrit.get(u)!).filter(x => x >= 0)
    const md = mediane(d)
    return md === null ? null : jours(md)
  }
  const brut: Omit<Etape, "taux" | "surPrecedente">[] = [
    { cle: "inscrit", libelle: "Compte créé", nombre: cohorte.length, delaiMedianJours: null },
    { cle: "page", libelle: "Première page créée", nombre: pageCreee.size, delaiMedianJours: delai(pageCreee) },
    { cle: "publiee", libelle: "Première page publiée", nombre: pagePubliee.size, delaiMedianJours: delai(pagePubliee) },
    { cle: "scan", libelle: "Premier scan (hors robots)", nombre: premierScan.size, delaiMedianJours: delai(premierScan) },
    { cle: "payant", libelle: "Abonnement payant en cours", nombre: payants.size, delaiMedianJours: null },
  ]
  const etapes: Etape[] = brut.map((x, i) => {
    // Un abonné n'est pas forcément passé par le scan : le payant se rapporte
    // aux comptes créés, pas à l'étape qui le précède dans le tableau.
    const prec = i === 0 ? null : x.cle === "payant" ? brut[0].nombre : brut[i - 1].nombre
    return { ...x, taux: prec === null ? null : taux(x.nombre, prec), surPrecedente: prec === null ? null : `${x.nombre} sur ${prec}` }
  })

  // Rétention : parmi TOUS les comptes de plus de 30 jours, ceux dont une page a
  // reçu un scan humain dans les 30 derniers jours.
  const il30 = maintenant - 30 * JOUR
  const anciens = new Set(e.comptes.filter(c => Date.parse(c.inscritLe) <= il30).map(c => c.id))
  const actifs = new Set(e.scans.filter(s => Date.parse(s.scanned_at) >= il30).map(s => proprietaire.get(s.page_id)).filter((u): u is string => !!u && anciens.has(u)))

  const enCours = e.abonnements.filter(a => PAYANT.has(a.status ?? ""))
  const parPlan: Record<string, number> = {}
  for (const a of enCours) parPlan[a.plan ?? "inconnu"] = (parPlan[a.plan ?? "inconnu"] ?? 0) + 1

  return {
    fenetreJours,
    etapes,
    retention: { comptesDePlusDe30j: anciens.size, actifsSur30j: actifs.size, taux: taux(actifs.size, anciens.size) },
    revenu: {
      payants: enCours.length, parPlan,
      resiliationsProgrammees: enCours.filter(a => a.cancel_at_period_end).length,
      impayes: enCours.filter(a => a.status === "past_due").length,
    },
    nonMesure: [
      "Export réellement terminé (l'impression passe par le navigateur ; aucun retour n'arrive en base)",
      "Scans du propriétaire lui-même (comptés comme les autres)",
      "Source, appareil et métier de la visite avant inscription (mesure d'audience Vercel, hors base)",
      "Marge après paiement, infrastructure et support (hors produit)",
    ],
  }
}
