import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Les QR autonomes (`instant_qrs`) — les VRAIES routes : créer (statique ou
// modifiable), modifier, mettre en pause, supprimer, créer en masse. Jouées
// contre une fausse base qui applique la RLS (ses QR, son profil) (v408).
//
// En le jouant (v408) :
//  - la modification passait TOUT type par la règle du lien : un QR modifiable
//    « appel » ou « e-mail » ne se modifiait pas (« Lien invalide »), et le texte
//    d'un QR « texte » devenait « https://bonjour/ », affiché tel quel au scan ;
//  - modifier la destination d'un QR STATIQUE répondait « ok » sans rien changer
//    au QR imprimé ;
//  - un lien expiré revenait actif, par sa date d'expiration, sans compter dans
//    le quota des QR modifiables ;
//  - reprendre un lien DÉJÀ actif était refusé au plafond.

const banc = vi.hoisted(() => ({
  session: null as null | { id: string },
  base: {} as Record<string, Record<string, any>[]>,
}))

let seq = 0
function requete(table: string, moi: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "insert" | "update" | "delete" = "select", charge: any = null, tete = false, retour = false
  const t = () => (banc.base[table] ??= [])
  const lisible = (l: Record<string, any>) => table === "profiles" ? l.id === moi : l.user_id === moi
  const garde = (l: Record<string, any>) => lisible(l) && filtres.every(f => f(l))
  const executer = () => {
    if (op === "insert") {
      const lignes = (Array.isArray(charge) ? charge : [charge]).map((l: any) => ({ id: `iq_${++seq}`, created_at: new Date().toISOString(), total_scans: 0, password_hash: null, status: "active", dynamic: false, ...l }))
      if (lignes.some(l => l.user_id !== moi)) return { data: null, error: { code: "42501", message: "rls" } }
      t().push(...lignes); return { data: lignes.map(l => ({ ...l })), error: null }
    }
    if (op === "update") { const ls = t().filter(garde); ls.forEach(l => Object.assign(l, charge)); return { data: retour ? ls.map(l => ({ ...l })) : null, error: null } }
    if (op === "delete") { const ls = t().filter(garde); banc.base[table] = t().filter(l => !ls.includes(l)); return { data: retour ? ls.map(l => ({ id: l.id })) : null, error: null } }
    const ls = t().filter(garde)
    return tete ? { data: null, count: ls.length, error: null } : { data: ls.map(l => ({ ...l })), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(_c?: string, o?: { head?: boolean }) { if (op === "select") { if (o?.head) tete = true } else retour = true; return q },
    insert(p: any) { op = "insert"; charge = p; return q },
    update(p: any) { op = "update"; charge = p; return q },
    delete() { op = "delete"; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    order() { return q }, limit() { return q },
    maybeSingle: une, single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: banc.session } }) },
    from: (t: string) => requete(t, banc.session?.id ?? "anon"),
    rpc: async (_n: string, { p_code }: { p_code: string }) => ({ data: !(banc.base.instant_qrs ?? []).some(l => l.short_code === p_code), error: null }),
  }),
}))

import { GET, POST, PATCH, DELETE } from "./route"
import { POST as enMasse } from "./bulk/route"

const appel = (route: (r: NextRequest) => Promise<Response>, methode: string, corps: unknown) => route(new NextRequest("https://qrowg.com/api/qr-instant", {
  method: methode, headers: { "content-type": "application/json" },
  body: typeof corps === "string" ? corps : JSON.stringify(corps),
}))
const creer = async (c: Record<string, unknown>) => { const r = await appel(POST, "POST", c); return { r, j: await r.json() } }
const modifier = (c: Record<string, unknown>) => appel(PATCH, "PATCH", c)
const MOI = "u_moi", AUTRE = "u_autre"
const ligne = (id: string) => banc.base.instant_qrs.find(l => l.id === id)!
const dyn = (id: string, extra: Record<string, any> = {}) =>
  ({ id, user_id: MOI, kind: "link", dynamic: true, short_code: `C${id}`, payload: `https://qrowg.com/q/C${id}`, dest_url: "https://ancien.fr/", status: "active", expires_at: null, paused_reason: null, password_hash: null, ...extra })
const plan = (p: string) => { banc.base.profiles[0].plan = p }
const futur = () => new Date(Date.now() + 86_400_000).toISOString()

beforeEach(() => {
  banc.session = { id: MOI }
  banc.base = { profiles: [{ id: MOI, plan: "free" }, { id: AUTRE, plan: "pro" }], instant_qrs: [] }
})

describe("créer un QR autonome", () => {
  it("sans session : 401 ; type inconnu ou statique vide : 400 — rien n'est créé", async () => {
    banc.session = null
    expect((await creer({ kind: "link", payload: "https://a.fr" })).r.status).toBe(401)
    banc.session = { id: MOI }
    expect((await creer({ kind: "virus", payload: "x" })).r.status).toBe(400)
    expect((await creer({ kind: "link", payload: "  " })).r.status).toBe(400)
    expect((await creer({ kind: "text", payload: "x".repeat(4001) })).r.status).toBe(400)
    expect(banc.base.instant_qrs).toEqual([])
  })

  it("statique : le contenu est DANS le code, illimité même au gratuit", async () => {
    for (let i = 0; i < 5; i++) expect((await creer({ kind: "text", payload: `Menu ${i}` })).r.status).toBe(200)
    expect(banc.base.instant_qrs.every(l => l.dynamic === false && l.user_id === MOI)).toBe(true)
  })

  it("modifiable : le code mène à /q/<code>, la destination est rangée à part", async () => {
    const { j } = await creer({ kind: "link", dynamic: true, dest: "lecomptoir.fr/carte" })
    expect(j.item.payload).toBe(`https://qrowg.com/q/${j.item.short_code}`)
    expect(j.item.dest_url).toBe("https://lecomptoir.fr/carte")
    expect(j.item.has_password).toBe(false)
    expect(j.item.password_hash).toBeUndefined()
    // Plus d'essai de 30 jours : un QR collé sur une table ne meurt pas tout seul.
    expect(j.item.expires_at).toBeNull()
    expect(j.item.status).toBe("active")
  })

  it("nom borné à 80 caractères ; contenu ou style de plus de 16 Ko : 413, rien n'est créé", async () => {
    const { j } = await creer({ kind: "text", payload: "Menu", label: "x".repeat(300) })
    expect(j.item.label.length).toBeLessThanOrEqual(80)
    const lourd = { t: "x".repeat(17_000) }
    expect((await creer({ kind: "text", payload: "Menu", inputs: lourd })).r.status).toBe(413)
    expect((await creer({ kind: "text", payload: "Menu", style: lourd })).r.status).toBe(413)
    expect(banc.base.instant_qrs).toHaveLength(1)
    plan("business")
    await appel(enMasse, "POST", { items: [{ label: "y".repeat(300), dest: "https://a.fr" }] })
    expect(banc.base.instant_qrs[1].label.length).toBeLessThanOrEqual(80)
  })

  it("chaque type modifiable reçoit la destination que le scan suivra", async () => {
    plan("business")
    const cas: [string, string, RegExp][] = [
      ["link", "https://lecomptoir.fr", /^https:\/\//],
      ["phone", "06 12 34 56 78", /^tel:0612345678$/],
      ["call", "tel:+33612345678", /^tel:\+33612345678$/],
      ["email", "contact@lecomptoir.fr", /^mailto:contact@lecomptoir\.fr$/],
      ["email", "mailto:contact@lecomptoir.fr?subject=R%C3%A9servation", /^mailto:contact@lecomptoir\.fr\?subject=/],
      ["text", "Fermé le lundi", /^Fermé le lundi$/],
    ]
    for (const [kind, dest, attendu] of cas) {
      const { r, j } = await creer({ kind, dynamic: true, dest })
      expect(r.status, `${kind} ${dest}`).toBe(200)
      expect(j.item.dest_url, `${kind} ${dest}`).toMatch(attendu)
    }
  })

  it("une destination que le scan ne suivrait pas est refusée à la création", async () => {
    plan("business")
    for (const [kind, dest] of [["link", "javascript:alert(1)"], ["link", "data:text/html,x"], ["phone", "appelez-moi"], ["email", "pas-une-adresse"], ["email", "mailto:%E0%A4%A"]])
      expect((await creer({ kind, dynamic: true, dest })).r.status, `${kind} ${dest}`).toBe(400)
    expect(banc.base.instant_qrs).toEqual([])
  })

  it("Wi-Fi et contact restent statiques, même demandés modifiables (ils doivent marcher hors ligne)", async () => {
    const { j } = await creer({ kind: "wifi", dynamic: true, payload: "WIFI:T:WPA;S:Bar;P:x;;" })
    expect(j.item.dynamic).toBe(false)
    expect(j.item.payload).toBe("WIFI:T:WPA;S:Bar;P:x;;")
  })

  it("le quota des QR modifiables : 1 au gratuit, avec la phrase qui le dit ; les statiques restent permis", async () => {
    expect((await creer({ kind: "link", dynamic: true, dest: "https://a.fr" })).r.status).toBe(200)
    const { r, j } = await creer({ kind: "link", dynamic: true, dest: "https://b.fr" })
    expect(r.status).toBe(403)
    expect(j).toMatchObject({ upgrade: true, error: expect.stringContaining("Limite de 1 QR modifiable") })
    expect((await creer({ kind: "link", payload: "https://b.fr" })).r.status).toBe(200)
    // Un QR modifiable en pause ne compte plus.
    banc.base.instant_qrs[0].status = "paused"
    expect((await creer({ kind: "link", dynamic: true, dest: "https://c.fr" })).r.status).toBe(200)
  })
})

describe("modifier un QR modifiable", () => {
  it("changer la destination d'un QR « appel », « e-mail » ou « texte » : sa règle, pas celle du lien (défaut v408)", async () => {
    banc.base.instant_qrs = [
      dyn("t", { kind: "call", dest_url: "tel:0612345678" }),
      dyn("e", { kind: "email", dest_url: "mailto:a@lecomptoir.fr" }),
      dyn("x", { kind: "text", dest_url: "Ouvert" }),
    ]
    expect((await modifier({ id: "t", dest: "+33 7 11 22 33 44" })).status).toBe(200)
    expect((await modifier({ id: "e", dest: "mailto:reservation@lecomptoir.fr" })).status).toBe(200)
    expect((await modifier({ id: "x", dest: "Fermé pour travaux" })).status).toBe(200)
    expect(ligne("t").dest_url).toBe("tel:+33711223344")
    expect(ligne("e").dest_url).toBe("mailto:reservation@lecomptoir.fr")
    expect(ligne("x").dest_url).toBe("Fermé pour travaux")
  })

  it("une destination invalide pour son type est refusée, l'ancienne reste", async () => {
    banc.base.instant_qrs = [dyn("l"), dyn("t", { kind: "phone", dest_url: "tel:0612345678" })]
    expect((await modifier({ id: "l", dest: "javascript:alert(1)" })).status).toBe(400)
    expect((await modifier({ id: "l", dest: 42 })).status).toBe(400)
    expect((await modifier({ id: "t", dest: "pas un numéro" })).status).toBe(400)
    expect(ligne("l").dest_url).toBe("https://ancien.fr/")
    expect(ligne("t").dest_url).toBe("tel:0612345678")
  })

  it("un QR STATIQUE n'a pas de destination à changer : refus, au lieu d'un « ok » qui ne change rien (défaut v408)", async () => {
    banc.base.instant_qrs = [{ id: "s", user_id: MOI, kind: "link", dynamic: false, payload: "https://imprime.fr", dest_url: null, status: "active" }]
    const r = await modifier({ id: "s", dest: "https://autre.fr" })
    expect(r.status).toBe(400)
    expect((await r.json()).error).toContain("imprimé dans le code")
    expect(ligne("s").dest_url).toBeNull()
  })

  it("le QR d'un autre compte : introuvable, intact ; le sien se renomme", async () => {
    banc.base.instant_qrs = [dyn("a", { user_id: AUTRE }), dyn("m")]
    expect((await modifier({ id: "a", dest: "https://pirate.fr" })).status).toBe(404)
    expect((await appel(DELETE, "DELETE", { id: "a" })).status).toBe(404)
    expect(ligne("a").dest_url).toBe("https://ancien.fr/")
    expect((await modifier({ id: "m", label: "Vitrine" })).status).toBe(200)
    expect(ligne("m").label).toBe("Vitrine")
    expect((await modifier({ id: "m" })).status).toBe(400)                     // rien à modifier
  })

  it("la liste ne montre que ses QR, sans jamais le hash du mot de passe", async () => {
    banc.base.instant_qrs = [dyn("m", { password_hash: "scrypt$sel$hash" }), dyn("a", { user_id: AUTRE })]
    const j = await (await GET()).json()
    expect(j.items.map((i: any) => i.id)).toEqual(["m"])
    expect(j.items[0]).toMatchObject({ has_password: true })
    expect(JSON.stringify(j)).not.toContain("scrypt")
  })
})

describe("sécurité du lien : pause, reprise, expiration, mot de passe", () => {
  it("au gratuit : refusé, avec le plan qui l'inclut", async () => {
    banc.base.instant_qrs = [dyn("m")]
    for (const c of [{ action: "pause" }, { password: "secret" }, { expires_at: futur() }]) {
      const r = await modifier({ id: "m", ...c })
      expect(r.status).toBe(403)
      expect((await r.json()).upgrade).toBe(true)
    }
    expect(ligne("m")).toMatchObject({ status: "active", password_hash: null, expires_at: null })
  })

  it("pause choisie, puis reprise dans le quota ; au plafond, la reprise attend une place", async () => {
    plan("pro")                                                                  // 20 QR modifiables
    banc.base.instant_qrs = Array.from({ length: 20 }, (_, i) => dyn(`a${i}`))
    expect((await modifier({ id: "a0", action: "pause" })).status).toBe(200)
    expect(ligne("a0")).toMatchObject({ status: "paused", paused_reason: "manual" })
    banc.base.instant_qrs.push(dyn("neuf"))                                      // la place est reprise
    expect((await modifier({ id: "a0", action: "resume" })).status).toBe(403)
    expect(ligne("a0").status).toBe("paused")
    banc.base.instant_qrs.find(l => l.id === "neuf")!.status = "paused"
    expect((await modifier({ id: "a0", action: "resume" })).status).toBe(200)
    expect(ligne("a0")).toMatchObject({ status: "active", paused_reason: null })
  })

  it("reprendre un lien DÉJÀ actif au plafond n'est pas un dépassement (défaut v408)", async () => {
    plan("pro")
    banc.base.instant_qrs = Array.from({ length: 20 }, (_, i) => dyn(`a${i}`))
    expect((await modifier({ id: "a0", action: "resume" })).status).toBe(200)
  })

  it("prolonger un lien expiré le rallume — dans le quota, jamais au-delà (défaut v408)", async () => {
    plan("pro")
    banc.base.instant_qrs = [...Array.from({ length: 20 }, (_, i) => dyn(`a${i}`)), dyn("vieux", { status: "expired", expires_at: "2026-01-01T00:00:00.000Z" })]
    const r = await modifier({ id: "vieux", expires_at: futur() })
    expect(r.status).toBe(403)
    expect(ligne("vieux")).toMatchObject({ status: "expired", expires_at: "2026-01-01T00:00:00.000Z" })
    banc.base.instant_qrs[0].status = "paused"
    expect((await modifier({ id: "vieux", expires_at: futur() })).status).toBe(200)
    expect(ligne("vieux").status).toBe("active")
  })

  it("une expiration passée ou illisible est refusée ; vide = permanent", async () => {
    plan("pro")
    banc.base.instant_qrs = [dyn("m", { expires_at: futur() })]
    expect((await modifier({ id: "m", expires_at: "2020-01-01" })).status).toBe(400)
    expect((await modifier({ id: "m", expires_at: "demain" })).status).toBe(400)
    expect((await modifier({ id: "m", expires_at: "" })).status).toBe(200)
    expect(ligne("m").expires_at).toBeNull()
  })

  it("le mot de passe est rangé haché, jamais en clair ; trop long, refusé ; vide, retiré", async () => {
    plan("pro")
    banc.base.instant_qrs = [dyn("m")]
    const r = await modifier({ id: "m", password: "terrasse2026" })
    expect((await r.json()).item).toMatchObject({ has_password: true })
    expect(ligne("m").password_hash).toBeTruthy()
    expect(ligne("m").password_hash).not.toContain("terrasse2026")
    expect((await modifier({ id: "m", password: "x".repeat(500) })).status).toBe(400)
    expect((await modifier({ id: "m", password: "" })).status).toBe(200)
    expect(ligne("m").password_hash).toBeNull()
  })
})

describe("créer en masse", () => {
  const lignes = (n: number) => Array.from({ length: n }, (_, i) => ({ label: `Table ${i}`, dest: `https://lecomptoir.fr/t${i}` }))

  it("hors Multi-sites : refusé, rien n'est créé", async () => {
    plan("pro")
    const r = await appel(enMasse, "POST", { items: lignes(3) })
    expect(r.status).toBe(403)
    expect(banc.base.instant_qrs).toEqual([])
  })

  it("Multi-sites : des QR modifiables à son compte, codes distincts ; les lignes invalides sont écartées", async () => {
    plan("business")
    const r = await appel(enMasse, "POST", { items: [...lignes(3), { dest: "javascript:alert(1)" }, { dest: "" }, { dest: "localhost" }] })
    const j = await r.json()
    expect(j).toMatchObject({ created: 3, skipped: 3, truncated: 0 })
    expect(banc.base.instant_qrs.every(l => l.user_id === MOI && l.dynamic && l.kind === "link" && /^https:\/\//.test(l.dest_url))).toBe(true)
    expect(new Set(banc.base.instant_qrs.map(l => l.short_code)).size).toBe(3)
  })

  it("plus de 100 lignes : les 100 premières, et le reste est dit", async () => {
    plan("business")
    const j = await (await appel(enMasse, "POST", { items: lignes(130) })).json()
    expect(j).toMatchObject({ created: 100, truncated: 30 })
  })

  it("sans session : 401 ; rien à importer : 400", async () => {
    plan("business")
    expect((await appel(enMasse, "POST", { items: [] })).status).toBe(400)
    expect((await appel(enMasse, "POST", "{pas du json")).status).toBe(400)
    banc.session = null
    expect((await appel(enMasse, "POST", { items: lignes(1) })).status).toBe(401)
  })
})
