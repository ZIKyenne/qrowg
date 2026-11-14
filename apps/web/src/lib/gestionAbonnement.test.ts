// Audit du 14 novembre 2026 — lot A (facturation et continuité des QR).
// Ce que ce fichier démontre :
//   A1 · Paramètres → Facturation ouvre le portail (factures, carte, résiliation)
//        et n'envoie plus « Gérer mon abonnement » vers /upgrade ;
//   A1 · la résiliation, le changement de formule et la suppression du compte
//        sont trois chemins distincts ;
//   A1 · la date de fin / de renouvellement se dit selon l'état réel ;
//   A1 · les rejeux et le désordre des notifications Stripe sont sans effet ;
//   A2 · le plan et la périodicité choisis sur l'accueil survivent à l'inscription ;
//   A2 · conditions, FAQ et fonctionnalités nomment le bon palier.
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { etatFacturation, retourDuPortail, LIBELLES_FACTURATION } from "./gestionAbonnement"
import { lienVersOffre, lireIntention, urlDOffre } from "./intentionDOffre"
import { destinationInterne } from "./apresInscription"
import { premiereFoisPourCetAbonnement, evenementEncoreValable } from "./webhookLogic"
import { PLAN_LIST, PLANS, minPlanFor } from "./plans"

const lire = (rel: string) => readFileSync(join(__dirname, "..", rel), "utf8")
const now = Date.parse("2026-11-14T10:00:00Z")

describe("A1 · état de facturation", () => {
  it("gratuit sans client Stripe : rien à ouvrir, on peut monter", () => {
    const e = etatFacturation({ plan: "free", clientStripe: false }, now)
    expect(e.statut).toBe("gratuit"); expect(e.portail).toBe(false); expect(e.monter).toBe(true)
  })
  it("ancien abonné revenu au gratuit : ses factures restent accessibles", () => {
    expect(etatFacturation({ plan: "free", clientStripe: true }, now).portail).toBe(true)
  })
  it("Starter actif : portail ouvert, renouvellement daté", () => {
    const e = etatFacturation({ plan: "starter", clientStripe: true, abonnement: { status: "active", current_period_end: "2026-12-01T00:00:00Z" } }, now)
    expect(e.statut).toBe("actif"); expect(e.portail).toBe(true)
    expect(e.echeance).toBe("Prochain renouvellement le 1 décembre 2026.")
  })
  it("résiliation programmée : date de fin et plan d'arrivée, jamais « renouvellement »", () => {
    const e = etatFacturation({ plan: "pro", clientStripe: true, abonnement: { status: "active", cancel_at_period_end: true, current_period_end: "2026-12-01T00:00:00Z" } }, now)
    expect(e.statut).toBe("fin_programmee")
    expect(e.echeance).toContain("jusqu'au 1 décembre 2026")
    expect(e.echeance).toContain(`plan ${PLANS.free.label}`)
    expect(e.echeance).not.toMatch(/renouvellement/i)
  })
  it("paiement refusé : le dit, et mène à la carte", () => {
    const e = etatFacturation({ plan: "pro", clientStripe: true, abonnement: { status: "past_due" } }, now)
    expect(e.statut).toBe("impaye"); expect(e.echeance).toMatch(/refusé/)
  })
  it("plan payant attribué hors Stripe : pas de bouton mort, une phrase", () => {
    const e = etatFacturation({ plan: "starter", clientStripe: false }, now)
    expect(e.statut).toBe("hors_stripe"); expect(e.portail).toBe(false)
  })
  it("Multi-sites : plus rien au-dessus", () => {
    expect(etatFacturation({ plan: "business", clientStripe: true }, now).monter).toBe(false)
  })
  it("le portail ne renvoie que vers une liste fermée (pas de redirection ouverte)", () => {
    expect(retourDuPortail("/upgrade")).toBe("/upgrade")
    expect(retourDuPortail("https://evil.example")).toBe("/dashboard/settings")
    expect(retourDuPortail("//evil.example")).toBe("/dashboard/settings")
    expect(retourDuPortail(undefined)).toBe("/dashboard/settings")
  })
})

describe("A1 · les écrans", () => {
  const settings = lire("app/dashboard/settings/page.tsx")
  const bloc = lire("components/GestionAbonnement.tsx")
  const portail = lire("app/api/stripe/portal/route.ts")
  const upgrade = lire("app/upgrade/page.tsx")

  it("Paramètres → Facturation passe par le bloc partagé, plus par un lien /upgrade", () => {
    expect(settings).toContain('<GestionAbonnement retour="/dashboard/settings" />')
    expect(settings).not.toContain("Gérer mon abonnement")
  })
  it("le bloc nomme séparément formule, factures/paiement et résiliation", () => {
    expect(bloc).toContain("LIBELLES_FACTURATION.monter")
    expect(bloc).toContain("LIBELLES_FACTURATION.portail")
    expect(bloc).toContain("LIBELLES_FACTURATION.resilier")
    expect(new Set(Object.values(LIBELLES_FACTURATION)).size).toBe(Object.values(LIBELLES_FACTURATION).length)
  })
  it("la zone de danger rappelle que résilier n'est pas supprimer", () => {
    expect(settings).toContain("Résilier en fin de période")
  })
  it("le portail sait ouvrir directement la résiliation et la mise à jour de carte", () => {
    expect(portail).toContain('type: "subscription_cancel"')
    expect(portail).toContain('type: "payment_method_update"')
    expect(portail).toContain("retourDuPortail(")
  })
  it("/upgrade montre la gestion à l'abonné et n'affiche plus « Gratuit » par défaut", () => {
    expect(upgrade).toContain('<GestionAbonnement retour="/upgrade" compact />')
    expect(upgrade).not.toContain('useState("free")')
  })
})

describe("A1 · notifications Stripe rejouées ou en désordre", () => {
  it("le bienvenue ne part qu'une fois par abonnement", () => {
    expect(premiereFoisPourCetAbonnement(null, "sub_A")).toBe(true)
    expect(premiereFoisPourCetAbonnement({ stripe_subscription_id: "sub_A" }, "sub_A")).toBe(false)
    expect(premiereFoisPourCetAbonnement({ stripe_subscription_id: "sub_A", status: "canceled" }, "sub_B")).toBe(true)
  })
  it("l'annulation rejouée d'un ANCIEN abonnement ne rétrograde pas le nouveau", () => {
    expect(evenementEncoreValable({ stripe_subscription_id: "sub_B", status: "active" }, "sub_A", "deleted")).toBe(false)
    expect(evenementEncoreValable({ stripe_subscription_id: "sub_A", status: "active" }, "sub_A", "deleted")).toBe(true)
  })
  it("un « active » en retard ne ressuscite pas un abonnement annulé", () => {
    expect(evenementEncoreValable({ stripe_subscription_id: "sub_A", status: "canceled" }, "sub_A", "active")).toBe(false)
    expect(evenementEncoreValable({ stripe_subscription_id: "sub_A", status: "canceled" }, "sub_A", "canceled")).toBe(true)
  })
  it("un nouvel abonnement après un ancien mort passe, même avant son checkout", () => {
    expect(evenementEncoreValable({ stripe_subscription_id: "sub_A", status: "canceled" }, "sub_B", "active")).toBe(true)
    expect(evenementEncoreValable(null, "sub_A", "trialing")).toBe(true)
  })
  it("la route applique ces gardes et remet le statut d'un abonnement neuf", () => {
    const route = lire("app/api/webhooks/stripe/route.ts")
    expect(route).toContain("premiereFoisPourCetAbonnement(avant, outcome.subscriptionId)")
    expect(route.match(/evenementEncoreValable\(/g)?.length).toBe(2)
    expect(route).toContain('status: "active", cancel_at_period_end: false')
  })
})

describe("A2 · plan et périodicité gardés jusqu'au paiement", () => {
  it("le lien de l'accueil passe par une destination que l'inscription accepte", () => {
    const lien = lienVersOffre("pro", true)
    const redirect = new URL(lien, "https://qrowg.com").searchParams.get("redirect")
    expect(destinationInterne(redirect)).toBe(urlDOffre("pro", true))
    expect(lireIntention(new URL(redirect!, "https://qrowg.com").searchParams)).toEqual({ plan: "pro", annuel: true })
  })
  it("chaque palier payant, chaque périodicité", () => {
    for (const p of PLAN_LIST.filter(p => p.priceMonthly > 0)) for (const annuel of [false, true]) {
      expect(lireIntention(new URL(urlDOffre(p.id, annuel), "https://x").searchParams)).toEqual({ plan: p.id, annuel })
    }
  })
  it("valeurs inconnues ignorées", () => {
    expect(lireIntention(new URLSearchParams("plan=free&cycle=x"))).toEqual({ plan: null, annuel: false })
    expect(lireIntention(new URLSearchParams("plan=__proto__"))).toEqual({ plan: null, annuel: false })
  })
  it("l'accueil n'envoie plus vers /auth/signup?plan=…", () => {
    const pricing = lire("app/homeSections/Pricing.tsx")
    expect(pricing).not.toContain("signup?plan=")
    expect(pricing).toContain("lienVersOffre(plan.id, annual)")
  })
})

describe("A2 · le bon palier, partout", () => {
  it("les conditions listent TOUS les paliers depuis PLAN_LIST (Starter compris)", () => {
    const terms = lire("app/terms/page.tsx")
    expect(terms).toContain("PLAN_LIST.map(")
  })
  it("le retrait de la mention QRowg est attribué au premier palier qui l'a", () => {
    expect(minPlanFor("removeBranding")).toBe("starter")
    for (const f of ["app/homeSections/faqData.ts", "app/homeSections/Pricing.tsx", "app/features/page.tsx"]) {
      const src = lire(f)
      expect(src).toContain('minPlanFor("removeBranding")')
      expect(src).not.toMatch(/retir\w+ dès le plan Établissement|dès le plan Établissement : votre page affiche/)
    }
  })
})
