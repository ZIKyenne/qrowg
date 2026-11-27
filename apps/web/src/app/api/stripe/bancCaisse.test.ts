import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { NextRequest } from "next/server"

// La caisse (`stripe/checkout`) et le portail (`stripe/portal`) — les VRAIES
// routes, avec un faux Stripe qui note chaque appel, et une fausse base qui
// applique la RLS (son profil, son abonnement) (v407). Avant, paiement.test et
// checkoutDoublon.test lisaient le texte des routes. Ici on regarde ce qui part
// chez Stripe : quel prix, pour quel compte, et ce qui n'y part pas.
//
// En le jouant (v407) : un corps illisible faisait répondre 500, et `annual`
// acceptait n'importe quelle valeur « vraie » — la chaîne "false" facturait l'annuel.

const banc = vi.hoisted(() => {
  const env = {
    NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID: "price_starter", NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: "price_pro",
    NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID: "", NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID: "price_starter_an",
    NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID: "", NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID: "",
    NEXT_PUBLIC_APP_URL: "https://qrowg.com",
  }
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  return {
    session: null as null | { id: string; email: string },
    base: {} as Record<string, Record<string, any>[]>,
    appels: [] as { quoi: string; args: any }[],
    abonnementsStripe: {} as Record<string, any[]>,   // customer -> abonnements
    portailRefuseLeChangement: false,
    stripeEnPanne: false,
  }
})
afterAll(() => { vi.unstubAllEnvs() })

vi.mock("@/lib/stripe", () => ({
  stripe: {
    subscriptions: { list: async (a: any) => { banc.appels.push({ quoi: "subscriptions.list", args: a }); return { data: banc.abonnementsStripe[a.customer] ?? [] } } },
    checkout: { sessions: { create: async (a: any) => {
      if (banc.stripeEnPanne) throw new Error("No such price: 'price_pro' (secret Stripe)")
      banc.appels.push({ quoi: "checkout", args: a }); return { url: "https://checkout.stripe.test/s1" }
    } } },
    billingPortal: { sessions: { create: async (a: any) => {
      if (banc.stripeEnPanne) throw new Error("No such customer: 'cus_moi' (secret Stripe)")
      if (a.flow_data?.type === "subscription_update_confirm" && banc.portailRefuseLeChangement) throw new Error("portail non configuré")
      banc.appels.push({ quoi: "portail", args: a }); return { url: "https://billing.stripe.test/p1" }
    } } },
  },
}))

function requete(table: string, moi: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  const lisible = (l: Record<string, any>) => table === "profiles" ? l.id === moi : l.user_id === moi
  const executer = () => ({ data: (banc.base[table] ?? []).filter(l => lisible(l) && filtres.every(f => f(l))).map(l => ({ ...l })), error: null })
  const q: any = {
    select() { return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    maybeSingle: async () => ({ data: executer().data[0] ?? null, error: null }),
    single: async () => { const d = executer().data[0]; return d ? { data: d, error: null } : { data: null, error: { code: "PGRST116" } } },
  }
  return q
}
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: banc.session } }) },
    from: (t: string) => requete(t, banc.session?.id ?? "anon"),
  }),
}))

import { POST as caisse } from "./checkout/route"
import { POST as portail } from "./portal/route"

const appel = (route: (r: NextRequest) => Promise<Response>, corps: unknown) => route(new NextRequest("https://qrowg.com/api/stripe/x", {
  method: "POST", headers: { "content-type": "application/json" },
  body: typeof corps === "string" ? corps : JSON.stringify(corps),
}))
const chez = (quoi: string) => banc.appels.filter(a => a.quoi === quoi).map(a => a.args)
const MOI = "u_moi", AUTRE = "u_autre"
const vivant = (id: string, price: string, status = "active") => ({ id, status, items: { data: [{ id: `si_${id}`, price: { id: price } }] } })

beforeEach(() => {
  banc.session = { id: MOI, email: "moi@commerce.test" }
  banc.appels = []
  banc.abonnementsStripe = {}
  banc.portailRefuseLeChangement = false
  banc.stripeEnPanne = false
  banc.base = {
    profiles: [{ id: MOI, stripe_customer_id: null }, { id: AUTRE, stripe_customer_id: "cus_autre" }],
    subscriptions: [{ user_id: AUTRE, stripe_subscription_id: "sub_autre", status: "active" }],
  }
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("la caisse : le bon prix, pour le bon compte", () => {
  it("sans session : 401, rien ne part chez Stripe", async () => {
    banc.session = null
    expect((await appel(caisse, { plan: "pro" })).status).toBe(401)
    expect(banc.appels).toEqual([])
  })

  it("Pro mensuel : le prix de Pro, le compte de la SESSION (jamais celui du corps), aucun essai", async () => {
    const r = await appel(caisse, { plan: "pro", annual: false, userId: AUTRE })
    expect(await r.json()).toEqual({ url: "https://checkout.stripe.test/s1" })
    const [s] = chez("checkout")
    expect(s.line_items).toEqual([{ price: "price_pro", quantity: 1 }])
    expect(s.metadata).toEqual({ userId: MOI, plan: "pro", priceId: "price_pro", billing: "monthly" })
    expect(s.subscription_data.metadata).toEqual(s.metadata)          // le webhook relit l'abonnement
    expect(s.subscription_data.trial_period_days).toBeUndefined()
    expect(s.customer_email).toBe("moi@commerce.test")
    expect(s.customer).toBeUndefined()
    expect(s.success_url).toMatch(/^https:\/\/qrowg\.com\/dashboard\?upgraded=true/)
    expect(s.billing_address_collection).toBe("required")
    expect(s.tax_id_collection).toEqual({ enabled: true })
  })

  it("annuel : le prix annuel ; sans prix annuel configuré, on le dit (503) au lieu de facturer le mois", async () => {
    await appel(caisse, { plan: "starter", annual: true })
    expect(chez("checkout")[0]).toMatchObject({ line_items: [{ price: "price_starter_an", quantity: 1 }], metadata: { billing: "annual" } })
    const r = await appel(caisse, { plan: "pro", annual: true })
    expect(r.status).toBe(503)
    expect(chez("checkout")).toHaveLength(1)
  })

  it("`annual` doit être un vrai booléen : la chaîne \"false\" reste mensuelle (défaut v407)", async () => {
    await appel(caisse, { plan: "starter", annual: "false" })
    expect(chez("checkout")[0]).toMatchObject({ line_items: [{ price: "price_starter", quantity: 1 }], metadata: { billing: "monthly" } })
  })

  it("plan inconnu, piégé ou corps illisible : 400 ; plan au prix non configuré : 503 — rien ne part", async () => {
    for (const c of [{ plan: "gold" }, { plan: "constructor" }, { plan: "__proto__" }, { plan: 42 }, {}, "{pas du json", "null"])
      expect((await appel(caisse, c)).status, JSON.stringify(c)).toBe(400)
    expect((await appel(caisse, { plan: "business" })).status).toBe(503)
    expect(chez("checkout")).toEqual([])
  })

  it("Stripe en panne : 500, sans le message de Stripe", async () => {
    banc.stripeEnPanne = true
    const r = await appel(caisse, { plan: "pro" })
    expect(r.status).toBe(500)
    expect(JSON.stringify(await r.json())).not.toMatch(/secret|price_pro|No such/)
  })
})

describe("la caisse d'un client déjà abonné : jamais un second abonnement", () => {
  beforeEach(() => { banc.base.profiles[0].stripe_customer_id = "cus_moi" })

  it("autre formule : le portail s'ouvre sur « confirmer le changement », avec le nouveau prix — pas de caisse", async () => {
    banc.abonnementsStripe.cus_moi = [vivant("sub_moi", "price_starter")]
    const r = await appel(caisse, { plan: "pro" })
    expect(await r.json()).toEqual({ url: "https://billing.stripe.test/p1", changement: true })
    expect(chez("portail")[0]).toMatchObject({
      customer: "cus_moi",
      flow_data: { type: "subscription_update_confirm", subscription_update_confirm: { subscription: "sub_moi", items: [{ id: "si_sub_moi", price: "price_pro", quantity: 1 }] } },
    })
    expect(chez("checkout")).toEqual([])
  })

  it("même formule, ou portail non configuré pour les changements : 409, et toujours pas de caisse", async () => {
    banc.abonnementsStripe.cus_moi = [vivant("sub_moi", "price_pro")]
    const r = await appel(caisse, { plan: "pro" })
    expect(r.status).toBe(409)
    expect(await r.json()).toMatchObject({ portal: true })
    banc.portailRefuseLeChangement = true
    expect((await appel(caisse, { plan: "starter" })).status).toBe(409)
    expect(chez("checkout")).toEqual([])
  })

  it("impayé, en pause, incomplet : c'est encore un abonnement — pas de seconde caisse", async () => {
    for (const st of ["past_due", "unpaid", "incomplete", "paused", "trialing"]) {
      banc.abonnementsStripe.cus_moi = [vivant("sub_moi", "price_pro", st)]
      expect((await appel(caisse, { plan: "pro" })).status, st).toBe(409)
    }
    expect(chez("checkout")).toEqual([])
  })

  it("ancien abonnement mort : une caisse, au même client Stripe, qui peut mettre à jour nom et adresse", async () => {
    banc.abonnementsStripe.cus_moi = [vivant("sub_vieux", "price_pro", "canceled"), vivant("sub_vieux2", "price_pro", "incomplete_expired")]
    expect((await appel(caisse, { plan: "pro" })).status).toBe(200)
    const [s] = chez("checkout")
    expect(s.customer).toBe("cus_moi")
    expect(s.customer_email).toBeUndefined()
    expect(s.customer_update).toEqual({ name: "auto", address: "auto" })
  })
})

describe("le portail : le sien, et seulement le sien", () => {
  beforeEach(() => { banc.base.profiles[0].stripe_customer_id = "cus_moi" })

  it("sans session : 401 ; sans client Stripe : 400 — rien ne part", async () => {
    banc.session = null
    expect((await appel(portail, {})).status).toBe(401)
    banc.session = { id: MOI, email: "x" }
    banc.base.profiles[0].stripe_customer_id = null
    expect((await appel(portail, {})).status).toBe(400)
    expect(banc.appels).toEqual([])
  })

  it("le client Stripe vient du profil du compte : un client ou un abonnement glissé dans le corps est ignoré", async () => {
    await appel(portail, { customer: "cus_autre", intention: "resilier", subscription: "sub_autre" })
    const [p] = chez("portail")
    expect(p.customer).toBe("cus_moi")
    expect(p.flow_data).toBeUndefined()                       // il n'a pas d'abonnement vivant à résilier
  })

  it("résilier : le parcours de résiliation de SON abonnement ; changer de carte : le parcours de la carte", async () => {
    banc.base.subscriptions.push({ user_id: MOI, stripe_subscription_id: "sub_moi", status: "active" })
    await appel(portail, { intention: "resilier" })
    await appel(portail, { intention: "paiement" })
    await appel(portail, { intention: "n_importe_quoi" })
    const [r, c, n] = chez("portail")
    expect(r.flow_data).toMatchObject({ type: "subscription_cancel", subscription_cancel: { subscription: "sub_moi" } })
    expect(c.flow_data).toMatchObject({ type: "payment_method_update" })
    expect(n.flow_data).toBeUndefined()
  })

  it("un abonnement déjà annulé ne se résilie pas une seconde fois : l'accueil du portail", async () => {
    banc.base.subscriptions.push({ user_id: MOI, stripe_subscription_id: "sub_moi", status: "canceled" })
    await appel(portail, { intention: "resilier" })
    expect(chez("portail")[0].flow_data).toBeUndefined()
  })

  it("le retour reste chez QRowg, sur une adresse de la liste — jamais celle qu'on lui donne", async () => {
    for (const retour of ["https://evil.example/vol", "//evil.example", "/dashboard/settings/../../auth"]) await appel(portail, { retour })
    for (const p of chez("portail")) expect(p.return_url).toBe("https://qrowg.com/dashboard/settings")
  })

  it("Stripe en panne : 500, sans le message de Stripe ; corps illisible : l'accueil du portail", async () => {
    expect((await appel(portail, "{pas du json")).status).toBe(200)
    banc.stripeEnPanne = true
    const r = await appel(portail, {})
    expect(r.status).toBe(500)
    expect(JSON.stringify(await r.json())).not.toMatch(/secret|cus_moi|No such/)
  })
})
