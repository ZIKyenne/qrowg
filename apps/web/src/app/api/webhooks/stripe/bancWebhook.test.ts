import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"

// Vague 4, point 2 (revue du 23 nov.) : le filet sur l'ARGENT. La VRAIE route du
// webhook Stripe, jouée contre une fausse base en mémoire. La signature est
// VRAIMENT vérifiée par le SDK Stripe (en-tête fabriqué avec un secret de banc) :
// rien n'est simulé entre l'octet reçu et l'écriture en base.
//
// Les tests voisins (abonnement.test.ts, webhookLogic.test.ts) lisent le texte de
// la route ou testent la décision pure ; celui-ci regarde ce qui est ÉCRIT, ce qui
// est ENVOYÉ et ce qui est RÉPONDU à Stripe, rejeux et désordre compris.

const banc = vi.hoisted(() => {
  const env = {
    STRIPE_SECRET_KEY: "sk_test_banc", STRIPE_WEBHOOK_SECRET: "whsec_banc", RESEND_API_KEY: "re_banc",
    NEXT_PUBLIC_SUPABASE_URL: "http://banc.invalid", SUPABASE_SERVICE_ROLE_KEY: "cle_de_banc",
    NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: "price_pro_banc", NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID: "price_starter_banc",
  }
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  return {
    base: {} as Record<string, Record<string, any>[]>,
    refus: new Set<string>(),                       // « table.operation » refusées par la base
    envoyes: [] as { to: string; subject: string }[],
  }
})
afterAll(() => { vi.unstubAllEnvs() })

// ── La fausse base : assez de PostgREST pour la route, rien de plus ───────────
function requete(table: string) {
  const filtres: [string, unknown][] = []
  let op: "select" | "update" | "upsert" = "select", patch: Record<string, any> = {}, conflit = "id", tete = false
  const lignes = () => (banc.base[table] ??= []).filter(l => filtres.every(([c, v]) => l[c] === v))
  const executer = (): { data: any; error: any; count?: number } => {
    if (banc.refus.has(`${table}.${op}`)) return { data: null, error: { message: `refusé par le banc (${table}.${op})` } }
    if (op === "update") { const ls = lignes(); ls.forEach(l => Object.assign(l, patch)); return { data: null, error: null } }
    if (op === "upsert") {
      const t = (banc.base[table] ??= [])
      const ex = t.find(l => l[conflit] === patch[conflit])
      // Défauts de la vraie table `subscriptions` à la création d'une ligne.
      if (ex) Object.assign(ex, patch); else t.push({ status: "active", cancel_at_period_end: false, ...patch })
      return { data: null, error: null }
    }
    const ls = lignes()
    return tete ? { data: null, count: ls.length, error: null } : { data: ls.map(l => ({ ...l })), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(_c?: string, o?: { head?: boolean }) { if (o?.head) tete = true; return q },
    update(p: Record<string, any>) { op = "update"; patch = p; return q },
    upsert(p: Record<string, any>, o?: { onConflict?: string }) { op = "upsert"; patch = p; conflit = o?.onConflict ?? "id"; return q },
    eq(c: string, v: unknown) { filtres.push([c, v]); return q },
    order() { return q },
    maybeSingle: une,
    single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: (t: string) => requete(t) }) }))
vi.mock("resend", () => ({
  Resend: class { emails = { send: async (m: { to: string; subject: string }) => { banc.envoyes.push({ to: m.to, subject: m.subject }); return { data: { id: "e" }, error: null } } } },
}))

// ── Les événements, à la forme de Stripe ──────────────────────────────────────
let n = 0
const evt = (type: string, object: Record<string, unknown>) => ({ id: `evt_banc_${++n}`, object: "event", type, data: { object } })
const checkout = (sub: string, price = "price_pro_banc") =>
  evt("checkout.session.completed", { metadata: { userId: "u1", priceId: price, billing: "monthly" }, customer: "cus_banc", subscription: sub })
const abonnement = (type: string, sub: string, status: string, o: { price?: string; resiliation?: boolean } = {}) =>
  evt(type, {
    id: sub, status, cancel_at_period_end: !!o.resiliation, metadata: { userId: "u1", billing: "monthly" },
    items: { data: [{ price: { id: o.price ?? "price_pro_banc" }, current_period_start: 1764000000, current_period_end: 1766600000 }] },
  })
const paiementRefuse = (sub: string) => evt("invoice.payment_failed", { parent: { subscription_details: { subscription: sub } } })

async function recevoir(event: object, signature?: string) {
  const { POST } = await import("./route")
  const { stripe } = await import("@/lib/stripe")
  const payload = JSON.stringify(event)
  const sig = signature ?? stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_banc" })
  const { NextRequest } = await import("next/server")
  return POST(new NextRequest("http://x/api/webhooks/stripe", { method: "POST", body: payload, headers: { "stripe-signature": sig } }))
}

const profil = () => banc.base.profiles[0]
const abo = () => banc.base.subscriptions ?? []
const sujets = () => banc.envoyes.map(e => e.subject)

beforeEach(() => {
  banc.base = {
    profiles: [{ id: "u1", plan: "free", email: "commerce@banc.invalid", full_name: "Nénette", free_published_since: null, stripe_customer_id: null }],
    subscriptions: [], instant_qrs: [], qr_codes: [],
  }
  banc.refus.clear()
  banc.envoyes.length = 0
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("la porte : seule une signature Stripe ouvre", () => {
  it("signature fausse : 400, rien n'est écrit, rien n'est envoyé", async () => {
    const res = await recevoir(checkout("sub_A"), "t=1,v1=fausse")
    expect(res.status).toBe(400)
    expect(profil().plan).toBe("free")
    expect(abo()).toEqual([])
    expect(banc.envoyes).toEqual([])
  })
  it("corps modifié après signature : refusé aussi", async () => {
    const { stripe } = await import("@/lib/stripe")
    const sig = stripe.webhooks.generateTestHeaderString({ payload: JSON.stringify(checkout("sub_A", "price_starter_banc")), secret: "whsec_banc" })
    expect((await recevoir(checkout("sub_A", "price_pro_banc"), sig)).status).toBe(400)
    expect(profil().plan).toBe("free")
  })
})

describe("souscrire", () => {
  it("le paiement ouvre le plan du PRIX, inscrit l'abonnement et dit bienvenue — une seule fois au rejeu", async () => {
    const e = checkout("sub_A")
    expect((await recevoir(e)).status).toBe(200)
    expect(profil()).toMatchObject({ plan: "pro", stripe_customer_id: "cus_banc" })
    expect(abo()).toEqual([expect.objectContaining({ user_id: "u1", stripe_subscription_id: "sub_A", plan: "pro", status: "active" })])
    expect(banc.envoyes).toHaveLength(1)
    expect(banc.envoyes[0].to).toBe("commerce@banc.invalid")

    expect((await recevoir(e)).status).toBe(200)          // Stripe rejoue
    expect(abo()).toHaveLength(1)
    expect(banc.envoyes).toHaveLength(1)
  })

  it("Stripe dans le désordre (`created` AVANT le paiement) : le bienvenue part quand même, une fois", async () => {
    await recevoir(abonnement("customer.subscription.created", "sub_A", "active"))
    await recevoir(checkout("sub_A"))
    await recevoir(abonnement("customer.subscription.updated", "sub_A", "active"))
    expect(profil().plan).toBe("pro")
    expect(abo()).toHaveLength(1)
    expect(banc.envoyes).toHaveLength(1)
  })

  it("paiement 3-D Secure (`incomplete`, puis `active`, puis le paiement) : un seul bienvenue", async () => {
    await recevoir(abonnement("customer.subscription.created", "sub_A", "incomplete"))
    expect(banc.envoyes).toHaveLength(0)                    // rien n'est encore payé
    await recevoir(abonnement("customer.subscription.updated", "sub_A", "active"))
    await recevoir(checkout("sub_A"))
    expect(profil().plan).toBe("pro")
    expect(banc.envoyes).toHaveLength(1)
  })

  it("fin d'essai, sortie d'impayé, renouvellement : pas de second bienvenue", async () => {
    await recevoir(checkout("sub_A"))
    for (const s of ["trialing", "active", "past_due", "active", "active"]) await recevoir(abonnement("customer.subscription.updated", "sub_A", s))
    expect(banc.envoyes).toHaveLength(1)
  })

  it("un prix inconnu de la configuration n'ouvre aucun plan et ne rétrograde personne", async () => {
    profil().plan = "pro"
    banc.base.subscriptions.push({ user_id: "u1", stripe_subscription_id: "sub_A", status: "active", plan: "pro" })
    await recevoir(abonnement("customer.subscription.updated", "sub_A", "active", { price: "price_d_une_grille_disparue" }))
    expect(profil().plan).toBe("pro")
  })
})

describe("une écriture refusée par la base : Stripe doit rejouer", () => {
  it("profil non écrit → 500 (Stripe réessaie pendant 3 jours)", async () => {
    banc.refus.add("profiles.update")
    const res = await recevoir(checkout("sub_A"))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: expect.stringContaining("profiles.plan") })
  })
  it("abonnement non écrit → 500 aussi, et le rejeu, base revenue, répare", async () => {
    banc.refus.add("subscriptions.upsert")
    const e = checkout("sub_A")
    expect((await recevoir(e)).status).toBe(500)
    banc.refus.clear()
    expect((await recevoir(e)).status).toBe(200)
    expect(abo()).toEqual([expect.objectContaining({ stripe_subscription_id: "sub_A", plan: "pro" })])
  })
})

describe("partir, et ce qui s'éteint", () => {
  const abonne = () => {
    profil().plan = "pro"
    banc.base.subscriptions.push({ user_id: "u1", stripe_subscription_id: "sub_A", status: "active", plan: "pro", cancel_at_period_end: false })
    banc.base.instant_qrs = ["l1", "l2", "l3"].map((id, i) => ({ id, user_id: "u1", dynamic: true, status: "active", expires_at: null, paused_reason: null, label: id, keep_on_downgrade: i === 2 }))
    banc.base.qr_codes = ["q1", "q2"].map(id => ({ id, user_id: "u1", status: "active", paused_reason: null, keep_on_downgrade: id === "q2" }))
  }

  it("annulation : retour au gratuit, l'excédent s'éteint (ce qu'il a choisi de garder reste allumé), et il est prévenu", async () => {
    abonne()
    expect((await recevoir(abonnement("customer.subscription.deleted", "sub_A", "canceled"))).status).toBe(200)
    expect(profil().plan).toBe("free")
    expect(abo()[0]).toMatchObject({ plan: "free", status: "canceled" })
    const etat = (t: string) => Object.fromEntries(banc.base[t].map(l => [l.id, l.status]))
    expect(etat("instant_qrs")).toEqual({ l1: "paused", l2: "paused", l3: "active" })   // gratuit : 1 lien modifiable, celui gardé
    expect(etat("qr_codes")).toEqual({ q1: "paused", q2: "active" })                    // gratuit : 1 page, celle gardée
    expect(banc.base.instant_qrs.filter(l => l.status === "paused").every(l => l.paused_reason === "quota")).toBe(true)
    expect(sujets()).toEqual(["2 de vos QR imprimés ne fonctionnent plus", "Une de vos pages est en pause"])
  })

  it("reprendre un plan rallume ce que le plan avait éteint — pas ce qu'il avait mis en pause lui-même", async () => {
    abonne()
    await recevoir(abonnement("customer.subscription.deleted", "sub_A", "canceled"))
    banc.base.instant_qrs[0].paused_reason = "manual"        // l1 : pause choisie à la main entre-temps
    await recevoir(checkout("sub_B"))
    const etat = Object.fromEntries(banc.base.instant_qrs.map(l => [l.id, l.status]))
    expect(etat).toEqual({ l1: "paused", l2: "active", l3: "active" })
    expect(banc.base.qr_codes.every(q => q.status === "active")).toBe(true)
  })

  it("l'annulation d'un ANCIEN abonnement ne rétrograde pas celui qui en a pris un nouveau", async () => {
    profil().plan = "pro"
    banc.base.subscriptions.push({ user_id: "u1", stripe_subscription_id: "sub_B", status: "active", plan: "pro" })
    await recevoir(abonnement("customer.subscription.deleted", "sub_A", "canceled"))
    expect(profil().plan).toBe("pro")
    expect(abo()[0]).toMatchObject({ stripe_subscription_id: "sub_B", status: "active" })
  })

  it("un « active » en retard ne ressuscite pas un abonnement annulé", async () => {
    abonne()
    await recevoir(abonnement("customer.subscription.deleted", "sub_A", "canceled"))
    await recevoir(abonnement("customer.subscription.updated", "sub_A", "active"))
    expect(profil().plan).toBe("free")
    expect(abo()[0].status).toBe("canceled")
  })

  it("résiliation programmée : il est prévenu une fois, avant la coupure, et garde son plan d'ici là", async () => {
    abonne()
    const e = abonnement("customer.subscription.updated", "sub_A", "active", { resiliation: true })
    await recevoir(e); await recevoir(e)
    expect(profil().plan).toBe("pro")
    expect(abo()[0].cancel_at_period_end).toBe(true)
    expect(banc.envoyes).toHaveLength(1)
  })
})

describe("un paiement refusé", () => {
  it("l'abonnement passe en impayé ; il est prévenu au PREMIER refus, pas à chaque relance de Stripe", async () => {
    profil().plan = "pro"
    banc.base.subscriptions.push({ user_id: "u1", stripe_subscription_id: "sub_A", status: "active", plan: "pro" })
    await recevoir(paiementRefuse("sub_A"))
    await recevoir(paiementRefuse("sub_A"))
    expect(abo()[0].status).toBe("past_due")
    expect(profil().plan).toBe("pro")                       // période de grâce : rien n'est coupé
    expect(banc.envoyes).toHaveLength(1)
  })
})

// ── v406 : les QR modifiables, l'argent qu'on vient de payer, et ce qu'on annonce ──
// En le jouant : les écritures sur `instant_qrs` n'étaient pas vérifiées. Une
// écriture refusée laissait Stripe sur « reçu » (aucun rejeu) — un abonné qui
// venait de payer gardait ses QR imprimés éteints — et l'e-mail annonçait
// « ne fonctionnent plus » des QR que la base n'avait pas touchés.
describe("les QR modifiables : vérifiés comme le reste", () => {
  const abonneAvecLiens = () => {
    profil().plan = "pro"
    banc.base.subscriptions.push({ user_id: "u1", stripe_subscription_id: "sub_A", status: "active", plan: "pro", cancel_at_period_end: false })
    banc.base.instant_qrs = ["l1", "l2"].map(id => ({ id, user_id: "u1", dynamic: true, status: "active", expires_at: null, paused_reason: null, label: id, keep_on_downgrade: false }))
    banc.base.qr_codes = ["q1", "q2"].map(id => ({ id, user_id: "u1", status: "active", paused_reason: null, keep_on_downgrade: false }))
  }
  const etat = (t: string) => Object.fromEntries(banc.base[t].map(l => [l.id, l.status]))

  it("annulation, QR modifiables refusés par la base : 500, rien d'annoncé à tort ; le rejeu éteint et annonce, une fois chacun", async () => {
    abonneAvecLiens()
    banc.refus.add("instant_qrs.update")
    const e = abonnement("customer.subscription.deleted", "sub_A", "canceled")
    const r = await recevoir(e)
    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({ error: expect.stringContaining("instant_qrs.quota") })
    expect(etat("instant_qrs")).toEqual({ l1: "active", l2: "active" })
    expect(sujets(), "aucun QR annoncé « ne fonctionne plus » alors qu'il marche").toEqual(["Une de vos pages est en pause"])
    banc.refus.clear()
    expect((await recevoir(e)).status).toBe(200)                    // Stripe rejoue
    expect(etat("instant_qrs")).toEqual({ l1: "active", l2: "paused" })
    expect(sujets()).toEqual(["Une de vos pages est en pause", "Un de vos QR imprimés ne fonctionne plus"])
    await recevoir(e)                                                // un rejeu de plus : plus rien à dire
    expect(sujets()).toHaveLength(2)
  })

  it("reprendre un plan, QR modifiables refusés : 500 pour que Stripe rejoue, et le rejeu les rallume", async () => {
    abonneAvecLiens()
    await recevoir(abonnement("customer.subscription.deleted", "sub_A", "canceled"))
    expect(etat("instant_qrs")).toEqual({ l1: "active", l2: "paused" })
    banc.refus.add("instant_qrs.update")
    const e = checkout("sub_B")
    expect((await recevoir(e)).status, "avant v406 : 200, et l2 restait éteint pour de bon").toBe(500)
    banc.refus.clear()
    expect((await recevoir(e)).status).toBe(200)
    expect(etat("instant_qrs")).toEqual({ l1: "active", l2: "active" })
  })

  it("pages refusées par la base : aucune page annoncée « en pause » à tort ; le rejeu l'annonce", async () => {
    abonneAvecLiens()
    banc.refus.add("qr_codes.update")
    const e = abonnement("customer.subscription.deleted", "sub_A", "canceled")
    expect((await recevoir(e)).status).toBe(500)
    expect(etat("qr_codes")).toEqual({ q1: "active", q2: "active" })
    expect(sujets()).toEqual(["Un de vos QR imprimés ne fonctionne plus"])
    banc.refus.clear()
    await recevoir(e)
    expect(sujets()).toEqual(["Un de vos QR imprimés ne fonctionne plus", "Une de vos pages est en pause"])
  })

  it("une lecture des QR modifiables refusée n'est pas « aucun QR » : 500", async () => {
    abonneAvecLiens()
    banc.refus.add("instant_qrs.select")
    const r = await recevoir(abonnement("customer.subscription.deleted", "sub_A", "canceled"))
    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({ error: expect.stringContaining("instant_qrs.lecture") })
  })
})

describe("changer de formule depuis le portail Stripe", () => {
  const enPro = () => {
    profil().plan = "pro"
    banc.base.subscriptions.push({ user_id: "u1", stripe_subscription_id: "sub_A", status: "active", plan: "pro", cancel_at_period_end: false })
    banc.base.qr_codes = ["q1", "q2", "q3", "q4"].map(id => ({ id, user_id: "u1", status: "active", paused_reason: null, keep_on_downgrade: false }))
  }

  it("descendre en Starter : le plan suit, l'excédent de pages s'éteint, il est prévenu — une fois au rejeu", async () => {
    enPro()
    const e = abonnement("customer.subscription.updated", "sub_A", "active", { price: "price_starter_banc" })
    expect((await recevoir(e)).status).toBe(200)
    expect(profil().plan).toBe("starter")
    expect(abo()[0]).toMatchObject({ plan: "starter", stripe_price_id: "price_starter_banc" })
    expect(banc.base.qr_codes.map(q => q.status)).toEqual(["active", "active", "active", "paused"])  // Starter : 3 pages
    expect(banc.base.qr_codes[3].paused_reason).toBe("quota")
    expect(sujets()).toEqual(["Une de vos pages est en pause", expect.stringMatching(/est maintenant Starter/)])
    await recevoir(e)
    expect(sujets()).toHaveLength(2)
  })

  it("remonter en Pro rallume la page que le plan avait éteinte", async () => {
    enPro()
    await recevoir(abonnement("customer.subscription.updated", "sub_A", "active", { price: "price_starter_banc" }))
    await recevoir(abonnement("customer.subscription.updated", "sub_A", "active", { price: "price_pro_banc" }))
    expect(profil().plan).toBe("pro")
    expect(banc.base.qr_codes.every(q => q.status === "active")).toBe(true)
  })

  it("Stripe sans dates de période : 200, et aucune date inventée", async () => {
    enPro()
    const e = abonnement("customer.subscription.updated", "sub_A", "active")
    ;(e.data.object as any).items.data[0] = { price: { id: "price_pro_banc" } }
    expect((await recevoir(e)).status).toBe(200)
    expect(abo()[0].current_period_start).toBeUndefined()
    expect(abo()[0].current_period_end).toBeUndefined()
  })
})
