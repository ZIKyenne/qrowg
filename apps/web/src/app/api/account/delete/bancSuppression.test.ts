import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"

// Supprimer son compte (RGPD) — la VRAIE route, jouée contre une fausse base,
// un faux Stripe et un faux stockage (v397). Avant, suppressionDeCompte.test et
// purgeDuStockage.test lisaient son texte : « typed !== (user.email…) » présent,
// « deleteUser » avant « purgerLesFichiersDuCompte » dans le fichier. Ici, on
// regarde ce qui est RÉSILIÉ, EFFACÉ et RÉPONDU, et dans quel ordre :
//   1. on ne touche à rien sans session ni sans l'e-mail recopié ;
//   2. la facturation s'arrête AVANT toute suppression, et un refus de Stripe
//      laisse le compte entier ;
//   3. les équipes possédées tombent, celles des autres restent ; les filleuls
//      sont détachés, pas supprimés ;
//   4. les fichiers sont purgés APRÈS la suppression réussie, jamais avant ;
//      un échec de purge est journalisé avec l'identifiant à rejouer.

const UID = "11111111-2222-3333-4444-555555555555"
const AUTRE = "99999999-8888-7777-6666-555555555555"

const banc = vi.hoisted(() => {
  for (const [k, v] of Object.entries({ STRIPE_SECRET_KEY: "sk_test_banc", NEXT_PUBLIC_SUPABASE_URL: "http://banc.invalid", SUPABASE_SERVICE_ROLE_KEY: "cle_de_banc" })) vi.stubEnv(k, v)
  return {
    session: null as null | { id: string; email: string },
    base: {} as Record<string, Record<string, any>[]>,
    fichiers: new Set<string>(),
    abonnements: [] as { id: string; status: string; customer: string }[],
    pannes: new Set<string>(),     // « stripe », « deleteUser », « stockage »
    journal: [] as string[],       // ce qui a été FAIT, dans l'ordre
    deconnecte: false,
  }
})
afterAll(() => { vi.unstubAllEnvs() })

// ── Fausse base : ce que la route demande à PostgREST, rien de plus ──────────
function requete(table: string) {
  const filtres: [string, unknown][] = []
  let op: "select" | "update" | "delete" = "select", patch: Record<string, any> = {}
  const t = () => (banc.base[table] ??= [])
  const garde = (l: Record<string, any>) => filtres.every(([c, v]) => l[c] === v)
  const executer = () => {
    if (op === "update") { t().filter(garde).forEach(l => Object.assign(l, patch)); banc.journal.push(`${table}.update`) }
    if (op === "delete") { banc.base[table] = t().filter(l => !garde(l)); banc.journal.push(`${table}.delete`) }
    return { data: op === "select" ? t().filter(garde).map(l => ({ ...l })) : null, error: null }
  }
  const q: any = {
    select() { return q },
    update(p: Record<string, any>) { op = "update"; patch = p; return q },
    delete() { op = "delete"; return q },
    eq(c: string, v: unknown) { filtres.push([c, v]); return q },
    maybeSingle: async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } },
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
const stockage = {
  async list(prefixe: string) {
    if (banc.pannes.has("stockage")) return { data: null, error: { message: "stockage indisponible" } }
    const dedans = [...banc.fichiers].filter(f => f.startsWith(prefixe + "/")).map(f => f.slice(prefixe.length + 1))
    const noms = new Set(dedans.map(f => f.split("/")[0]))
    return { data: [...noms].map(n => ({ name: n, id: dedans.includes(n) ? "f" : null })), error: null }
  },
  async remove(chemins: string[]) { chemins.forEach(c => banc.fichiers.delete(c)); banc.journal.push("stockage.remove"); return { error: null } },
}
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (t: string) => requete(t),
    storage: { from: () => stockage },
    auth: { admin: { async deleteUser(id: string) {
      if (banc.pannes.has("deleteUser")) return { error: { message: "refus" } }
      banc.journal.push(`deleteUser:${id}`)
      // La cascade de la vraie base : profiles, puis tout ce qui y est rattaché.
      banc.base.profiles = (banc.base.profiles ?? []).filter(l => l.id !== id)
      banc.base.pages = (banc.base.pages ?? []).filter(l => l.user_id !== id)
      return { error: null }
    } } },
  }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: banc.session } }),
      signOut: async () => { banc.deconnecte = true; return { error: null } },
    },
  }),
}))
vi.mock("@/lib/stripe", () => ({
  stripe: { subscriptions: {
    async list({ customer }: { customer: string }) {
      if (banc.pannes.has("stripe")) throw new Error("Stripe indisponible")
      return { data: banc.abonnements.filter(s => s.customer === customer).map(s => ({ ...s })) }
    },
    async cancel(id: string) { banc.abonnements.find(s => s.id === id)!.status = "canceled"; banc.journal.push(`stripe.cancel:${id}`); return {} },
  } },
}))

async function supprimer(corps: unknown) {
  const { POST } = await import("./route")
  const { NextRequest } = await import("next/server")
  const res = await POST(new NextRequest("http://banc.invalid/api/account/delete", { method: "POST", body: typeof corps === "string" ? corps : JSON.stringify(corps) }))
  return { statut: res.status, corps: await res.json() }
}
const intact = () => {
  expect(banc.journal, "rien n'a été fait").toEqual([])
  expect(banc.base.profiles.map(p => p.id)).toContain(UID)
  expect(banc.fichiers.size).toBe(3)
  expect(banc.abonnements.find(s => s.id === "sub_actif")!.status).toBe("active")
}

beforeEach(() => {
  banc.session = { id: UID, email: "Gerant@Comptoir.fr" }
  banc.base = {
    profiles: [
      { id: UID, stripe_customer_id: "cus_1", referred_by: null },
      { id: AUTRE, stripe_customer_id: null, referred_by: UID },   // un filleul
    ],
    teams: [{ id: "t1", owner_id: UID }, { id: "t2", owner_id: AUTRE }],
    pages: [{ id: "p1", user_id: UID }, { id: "p2", user_id: AUTRE }],
  }
  banc.fichiers = new Set([`${UID}/logo.webp`, `${UID}/menus/carte.pdf`, `${AUTRE}/photo.webp`])
  banc.abonnements = [
    { id: "sub_actif", status: "active", customer: "cus_1" },
    { id: "sub_impaye", status: "past_due", customer: "cus_1" },
    { id: "sub_fini", status: "canceled", customer: "cus_1" },
    { id: "sub_autre", status: "active", customer: "cus_2" },
  ]
  banc.pannes.clear(); banc.journal = []; banc.deconnecte = false
})

describe("on ne touche à rien sans preuve", () => {
  it("sans session : 401, rien n'est fait", async () => {
    banc.session = null
    expect((await supprimer({ email: "gerant@comptoir.fr" })).statut).toBe(401)
    intact()
  })
  it("e-mail absent, faux, ou corps illisible : 400, rien n'est fait", async () => {
    for (const corps of [{}, { email: "" }, { email: "autre@comptoir.fr" }, { email: "gerant@comptoir" }, "pas du json"]) {
      const r = await supprimer(corps)
      expect(r.statut, JSON.stringify(corps)).toBe(400)
      expect(r.corps.error).toBe("Confirmation incorrecte.")
    }
    intact()
  })
  it("l'identifiant vient de la session, jamais du corps", async () => {
    expect((await supprimer({ email: "gerant@comptoir.fr", id: AUTRE, userId: AUTRE })).statut).toBe(200)
    expect(banc.base.profiles.map(p => p.id), "l'autre compte est intact").toEqual([AUTRE])
    expect(banc.fichiers).toEqual(new Set([`${AUTRE}/photo.webp`]))
  })
})

describe("la suppression, dans l'ordre", () => {
  it("l'e-mail recopié, casse et espaces mis à part : tout est fait, et dans cet ordre", async () => {
    const r = await supprimer({ email: "  gerant@COMPTOIR.fr " })
    expect(r).toEqual({ statut: 200, corps: { ok: true } })
    expect(banc.journal).toEqual([
      "stripe.cancel:sub_actif", "stripe.cancel:sub_impaye",   // 1. la facturation s'arrête
      "profiles.update", "teams.delete",                        // 2. les contraintes sont levées
      `deleteUser:${UID}`,                                      // 3. le compte part, en cascade
      "stockage.remove",                                        // 4. puis ses fichiers
    ])
    expect(banc.deconnecte, "la session est fermée").toBe(true)
  })
  it("Stripe : ce qui facture est résilié, le reste n'est pas touché", async () => {
    await supprimer({ email: "gerant@comptoir.fr" })
    expect(Object.fromEntries(banc.abonnements.map(s => [s.id, s.status]))).toEqual({
      sub_actif: "canceled", sub_impaye: "canceled", sub_fini: "canceled", sub_autre: "active",
    })
  })
  it("équipes et filleuls : les siennes tombent, celles des autres restent, le filleul est détaché", async () => {
    await supprimer({ email: "gerant@comptoir.fr" })
    expect(banc.base.teams).toEqual([{ id: "t2", owner_id: AUTRE }])
    expect(banc.base.profiles).toEqual([{ id: AUTRE, stripe_customer_id: null, referred_by: null }])
    expect(banc.base.pages).toEqual([{ id: "p2", user_id: AUTRE }])
  })
  it("fichiers : les siens, sous-dossiers compris, et seulement les siens", async () => {
    await supprimer({ email: "gerant@comptoir.fr" })
    expect(banc.fichiers).toEqual(new Set([`${AUTRE}/photo.webp`]))
  })
  it("un compte jamais passé en caisse : rien à résilier, la suppression se fait", async () => {
    banc.base.profiles[0].stripe_customer_id = null
    expect((await supprimer({ email: "gerant@comptoir.fr" })).statut).toBe(200)
    expect(banc.journal.some(e => e.startsWith("stripe."))).toBe(false)
    expect(banc.journal).toContain(`deleteUser:${UID}`)
  })
})

describe("quand quelque chose échoue", () => {
  it("Stripe refuse : 502, le compte reste ENTIER (mieux qu'un compte fantôme qui paie)", async () => {
    banc.pannes.add("stripe")
    const r = await supprimer({ email: "gerant@comptoir.fr" })
    expect(r.statut).toBe(502)
    expect(r.corps.error).toMatch(/n'a pas été supprimé/)
    intact()
    expect(banc.base.teams).toHaveLength(2)
    expect(banc.base.profiles.find(p => p.id === AUTRE)!.referred_by, "le filleul n'est pas détaché").toBe(UID)
    expect(banc.deconnecte).toBe(false)
  })
  it("la suppression du compte échoue : 500, et ses fichiers NE sont PAS purgés", async () => {
    banc.pannes.add("deleteUser")
    const r = await supprimer({ email: "gerant@comptoir.fr" })
    expect(r.statut).toBe(500)
    expect(banc.journal).not.toContain("stockage.remove")
    expect(banc.fichiers.size, "un compte vivant aux images cassées, jamais").toBe(3)
    expect(banc.deconnecte).toBe(false)
  })
  it("la purge échoue après une suppression réussie : 200, et l'identifiant à rejouer est journalisé", async () => {
    banc.pannes.add("stockage")
    const erreurs: string[] = []
    // Le PREMIER argument seulement : l'erreur du stockage (« lecture de <uid> … »)
    // répète l'identifiant par hasard — vu par mutation (v397).
    const espion = vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => { erreurs.push(String(a[0])) })
    try {
      expect((await supprimer({ email: "gerant@comptoir.fr" })).statut).toBe(200)
    } finally { espion.mockRestore() }
    expect(banc.journal).toContain(`deleteUser:${UID}`)
    expect(erreurs.some(e => e.includes("PURGE DU STOCKAGE À REJOUER") && e.includes(UID)), erreurs.join("\n")).toBe(true)
  })
})
