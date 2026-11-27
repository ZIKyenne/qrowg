import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHash } from "node:crypto"

// L'API publique — les VRAIES routes (créer / régénérer une clé, /v1/pages,
// /v1/qr-codes, /v1/qr/[code]/destination), jouées contre une fausse base
// (v399). On regarde ce qu'une clé OUVRE, à qui, et ce qui la rend inerte :
//   · la clé n'existe en clair qu'une fois, dans la réponse ; la base n'en
//     garde que l'empreinte ;
//   · une clé révoquée, expirée, régénérée, ou dont le compte est repassé en
//     gratuit n'ouvre plus rien ;
//   · une clé ne voit et ne modifie que les données de SON compte ;
//   · le quota mensuel atteint, rien n'est modifié.

const banc = vi.hoisted(() => ({
  session: null as null | { id: string; email: string },
  base: {} as Record<string, Record<string, any>[]>,
  appels: {} as Record<string, number>,   // compteur mensuel de la fonction api_consommer
}))

let seq = 0
function requete(table: string) {
  const filtres: [string, unknown][] = []
  let op: "select" | "update" | "insert" = "select", patch: Record<string, any> = {}, tete = false
  const t = () => (banc.base[table] ??= [])
  const garde = (l: Record<string, any>) => filtres.every(([c, v]) => l[c] === v)
  const executer = (): { data: any; error: any; count?: number } => {
    if (op === "update") { const ls = t().filter(garde); ls.forEach(l => Object.assign(l, patch)); return { data: ls.map(l => ({ ...l })), error: null } }
    if (op === "insert") { const l = { id: `${table}_${++seq}`, ...patch }; t().push(l); return { data: [{ ...l }], error: null } }
    const ls = t().filter(garde)
    return tete ? { data: null, count: ls.length, error: null } : { data: ls.map(l => ({ ...l })), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(_c?: string, o?: { head?: boolean }) { if (op === "select" && o?.head) tete = true; return q },
    update(p: Record<string, any>) { op = "update"; patch = p; return q },
    insert(p: Record<string, any>) { op = "insert"; patch = p; return q },
    eq(c: string, v: unknown) { filtres.push([c, v]); return q },
    order() { return q },
    maybeSingle: une, single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
const client = () => ({
  from: (t: string) => requete(t),
  // La vraie fonction compte et refuse au-delà du plafond, atomiquement.
  rpc: async (fn: string, a: { p_user: string; p_plafond: number }) => {
    if (fn !== "api_consommer") return { data: null, error: { message: "fonction inconnue" } }
    const n = banc.appels[a.p_user] ?? 0
    if (n >= a.p_plafond) return { data: [{ autorise: false, appels: n }], error: null }
    banc.appels[a.p_user] = n + 1
    return { data: [{ autorise: true, appels: n + 1 }], error: null }
  },
})
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ ...client(), auth: { getUser: async () => ({ data: { user: banc.session } }) } }),
  createAdminClient: () => client(),
}))
vi.mock("@/lib/rateLimit", () => ({ rateLimit: async () => true }))

const MOI = { id: "u_moi", email: "moi@comptoir.fr" }
const AUTRE = { id: "u_autre", email: "autre@bistrot.fr" }
const PAGE_A_MOI = "aaaaaaaa-0000-4000-8000-000000000001"
const PAGE_AUTRE = "bbbbbbbb-0000-4000-8000-000000000002"
const empreinte = (k: string) => createHash("sha256").update(k).digest("hex")

beforeEach(() => {
  banc.session = MOI
  banc.appels = {}
  banc.base = {
    profiles: [{ id: MOI.id, plan: "pro" }, { id: AUTRE.id, plan: "business" }],
    api_keys: [
      { id: "k_moi", user_id: MOI.id, key_hash: empreinte("qrk_sk_live_moi"), is_active: true, expires_at: null, last_used_at: null },
      { id: "k_autre", user_id: AUTRE.id, key_hash: empreinte("qrk_sk_live_autre"), is_active: true, expires_at: null, last_used_at: null },
    ],
    pages: [
      { id: PAGE_A_MOI, user_id: MOI.id, title: "Ma carte", slug: "ma-carte", status: "published", total_views: 3, created_at: "1" },
      { id: PAGE_AUTRE, user_id: AUTRE.id, title: "Sa carte", slug: "sa-carte", status: "published", total_views: 9, created_at: "2" },
    ],
    qr_codes: [
      { id: "q_moi", user_id: MOI.id, short_code: "MOI123", page_id: PAGE_A_MOI, status: "active", total_scans: 1, dest_override: null, dest_history: [], created_at: "1" },
      { id: "q_autre", user_id: AUTRE.id, short_code: "AUT456", page_id: PAGE_AUTRE, status: "active", total_scans: 2, dest_override: null, dest_history: [], created_at: "2" },
    ],
  }
})

type Rep = { statut: number; corps: any; entetes: Headers }
async function rep(res: Response): Promise<Rep> { return { statut: res.status, corps: await res.json(), entetes: res.headers } }
async function requeteApi(chemin: string, en: Record<string, string>, corps?: unknown) {
  const { NextRequest } = await import("next/server")
  return new NextRequest(`http://banc.invalid${chemin}`, { method: corps === undefined ? "GET" : "POST", headers: en, body: corps === undefined ? undefined : JSON.stringify(corps) })
}
const avecCle = (k: string) => ({ authorization: `Bearer ${k}` })
async function pages(en: Record<string, string>) { const { GET } = await import("./pages/route"); return rep(await GET(await requeteApi("/api/v1/pages", en))) }
async function qrs(en: Record<string, string>) { const { GET } = await import("./qr-codes/route"); return rep(await GET(await requeteApi("/api/v1/qr-codes", en))) }
async function destination(code: string, en: Record<string, string>, corps: unknown) {
  const { POST } = await import("./qr/[code]/destination/route")
  return rep(await POST(await requeteApi(`/api/v1/qr/${code}/destination`, en, corps), { params: Promise.resolve({ code }) }))
}
async function cles(methode: "POST" | "PATCH", corps: unknown) {
  const mod: any = await import("../keys/route")
  const { NextRequest } = await import("next/server")
  return rep(await mod[methode](new NextRequest("http://banc.invalid/api/keys", { method: methode, body: JSON.stringify(corps) })))
}
const qrDe = (code: string) => banc.base.qr_codes.find(q => q.short_code === code)!

describe("une clé ouvre l'API, et seulement elle", () => {
  it("sans clé, une fausse clé, ou une chaîne qui n'est pas une clé : 401 partout", async () => {
    for (const en of [{}, avecCle("qrk_sk_live_inventee"), avecCle("pas-une-cle"), { authorization: "Basic qrk_sk_live_moi" }]) {
      expect((await pages(en)).statut, JSON.stringify(en)).toBe(401)
      expect((await qrs(en)).statut).toBe(401)
      expect((await destination("MOI123", en, { type: "url", value: "https://exemple.fr" })).statut).toBe(401)
    }
    expect(qrDe("MOI123").dest_override).toBeNull()
  })

  it("Bearer ou x-api-key : la même clé ouvre, et laisse sa trace d'usage", async () => {
    expect((await pages(avecCle("qrk_sk_live_moi"))).statut).toBe(200)
    expect((await pages({ "x-api-key": "qrk_sk_live_moi" })).statut).toBe(200)
    await new Promise(r => setTimeout(r, 0))
    expect(banc.base.api_keys.find(k => k.id === "k_moi")!.last_used_at).not.toBeNull()
  })

  it("révoquée, expirée, ou compte repassé en gratuit : la clé n'ouvre plus rien", async () => {
    const k = banc.base.api_keys.find(k => k.id === "k_moi")!
    k.is_active = false
    expect((await pages(avecCle("qrk_sk_live_moi"))).statut, "révoquée").toBe(401)
    Object.assign(k, { is_active: true, expires_at: new Date(Date.now() - 1000).toISOString() })
    expect((await pages(avecCle("qrk_sk_live_moi"))).statut, "expirée").toBe(401)
    Object.assign(k, { expires_at: new Date(Date.now() + 86400_000).toISOString() })
    expect((await pages(avecCle("qrk_sk_live_moi"))).statut, "pas encore expirée").toBe(200)
    banc.base.profiles[0].plan = "starter"
    expect((await pages(avecCle("qrk_sk_live_moi"))).statut, "plan sans API").toBe(401)
  })
})

describe("créer et régénérer une clé", () => {
  it("la clé n'existe en clair qu'UNE fois : dans la réponse ; la base garde l'empreinte", async () => {
    const r = await cles("POST", { name: "  Caisse  " })
    expect(r.statut).toBe(200)
    const cle: string = r.corps.key
    expect(cle).toMatch(/^qrk_sk_live_[0-9a-f]{64}$/)
    const ligne = banc.base.api_keys.at(-1)!
    expect(ligne).toMatchObject({ user_id: MOI.id, name: "Caisse", key_hash: empreinte(cle), is_active: true })
    expect(JSON.stringify(ligne), "la clé en clair n'est stockée nulle part").not.toContain(cle.slice(12))
    expect(JSON.stringify(r.corps.record), "ni renvoyée dans la fiche").not.toContain(cle.slice(12))
    expect((await pages(avecCle(cle))).statut, "et elle ouvre l'API").toBe(200)
    const autre = (await cles("POST", { name: "Deux" })).corps.key
    expect(autre, "chaque clé est neuve").not.toBe(cle)
  })

  it("un compte sans l'API ne crée pas de clé ; un nom est requis ; 10 clés actives au plus", async () => {
    banc.base.profiles[0].plan = "starter"
    expect((await cles("POST", { name: "x" })).statut).toBe(403)
    banc.base.profiles[0].plan = "pro"
    expect((await cles("POST", { name: "   " })).statut).toBe(400)
    expect((await cles("POST", {})).statut).toBe(400)
    for (let i = 0; i < 9; i++) expect((await cles("POST", { name: `c${i}` })).statut).toBe(200)
    const onzieme = await cles("POST", { name: "de trop" })
    expect(onzieme.statut).toBe(403)
    expect(banc.base.api_keys.filter(k => k.user_id === MOI.id && k.is_active)).toHaveLength(10)
    expect((await cles("POST", {})).statut).toBe(400)
  })

  it("sans session : rien", async () => {
    banc.session = null
    expect((await cles("POST", { name: "x" })).statut).toBe(401)
    expect((await cles("PATCH", { id: "k_moi" })).statut).toBe(401)
    expect(banc.base.api_keys).toHaveLength(2)
  })

  it("régénérer : l'ancienne clé meurt, la nouvelle ouvre", async () => {
    const r = await cles("PATCH", { id: "k_moi" })
    expect(r.statut).toBe(200)
    expect((await pages(avecCle("qrk_sk_live_moi"))).statut, "l'ancienne").toBe(401)
    expect((await pages(avecCle(r.corps.key))).statut, "la nouvelle").toBe(200)
  })

  it("on ne régénère pas la clé d'un autre (sinon on la lui volerait)", async () => {
    const r = await cles("PATCH", { id: "k_autre" })
    expect(r.statut).not.toBe(200)
    expect(r.corps.key).toBeUndefined()
    expect((await pages(avecCle("qrk_sk_live_autre"))).statut, "sa clé marche toujours").toBe(200)
  })
})

describe("une clé ne touche que son compte", () => {
  it("/v1/pages et /v1/qr-codes : seulement les siens", async () => {
    const p = await pages(avecCle("qrk_sk_live_moi"))
    expect(p.corps.data.map((x: any) => x.id)).toEqual([PAGE_A_MOI])
    expect(p.corps.data[0].url).toMatch(/\/ma-carte$/)
    const q = await qrs(avecCle("qrk_sk_live_moi"))
    expect(q.corps.data.map((x: any) => x.short_code)).toEqual(["MOI123"])
    expect(q.corps.data[0].scan_url).toMatch(/\/q\/MOI123$/)
  })

  it("changer la destination d'un QR : le sien, avec l'historique", async () => {
    const r = await destination("MOI123", avecCle("qrk_sk_live_moi"), { type: "url", value: "https://exemple.fr/menu", label: "Menu" })
    expect(r.statut).toBe(200)
    const qr = qrDe("MOI123")
    expect(qr.dest_override).toMatchObject({ type: "url", value: "https://exemple.fr/menu", url: "https://exemple.fr/menu", label: "Menu", set_by: MOI.id })
    expect(qr.dest_history[0], "l'ancienne destination est gardée").toMatchObject({ type: "page", value: PAGE_A_MOI })
  })

  it("le QR d'un autre : introuvable, intact", async () => {
    const r = await destination("AUT456", avecCle("qrk_sk_live_moi"), { type: "url", value: "https://piege.example" })
    expect(r.statut).toBe(404)
    expect(qrDe("AUT456").dest_override).toBeNull()
    expect(qrDe("AUT456").dest_history).toEqual([])
  })

  it("pointer son QR vers la page d'un autre : refusé ; vers la sienne : retour à la page", async () => {
    expect((await destination("MOI123", avecCle("qrk_sk_live_moi"), { type: "page", value: PAGE_AUTRE })).statut).toBe(404)
    expect(qrDe("MOI123").dest_override).toBeNull()
    await destination("MOI123", avecCle("qrk_sk_live_moi"), { type: "url", value: "https://exemple.fr" })
    expect((await destination("MOI123", avecCle("qrk_sk_live_moi"), { type: "page", value: PAGE_A_MOI })).statut).toBe(200)
    expect(qrDe("MOI123").dest_override, "sa propre page = plus de redirection forcée").toBeNull()
  })

  it("une destination invalide ou dangereuse n'est pas posée", async () => {
    // « httpjavascript: » était accepté (200) puis refusé au scan : QR imprimé mort (v399).
    // Et ce qui n'est pas du texte (nombre, objet, tableau) : 400, jamais une exception.
    for (const corps of [{}, { type: "url" }, { type: "url", value: 42 }, { type: "url", value: { toString: "x" } }, { type: ["url"], value: "x.fr" }, { type: "url", value: ["x.fr"] },
      { type: "url", value: "javascript:alert(1)" }, { type: "url", value: "httpjavascript:alert(1)" }, { type: "script", value: "x" }, { type: "page", value: "pas-un-id" }, { type: "email", value: "pas un e-mail" }]) {
      expect((await destination("MOI123", avecCle("qrk_sk_live_moi"), corps)).statut, JSON.stringify(corps)).toBe(400)
    }
    expect(qrDe("MOI123").dest_override).toBeNull()
    // …et un vrai domaine en « http… » n'est plus refusé (il l'était avant v399).
    expect((await destination("MOI123", avecCle("qrk_sk_live_moi"), { type: "url", value: "httpbin.org" })).statut).toBe(200)
  })
})

describe("le quota mensuel du plan", () => {
  it("compté à chaque appel, annoncé dans les en-têtes", async () => {
    const r = await pages(avecCle("qrk_sk_live_moi"))
    expect(r.entetes.get("X-Quota-Limit")).toBe("1000")
    expect(r.entetes.get("X-Quota-Used")).toBe("1")
    expect(r.entetes.get("X-Quota-Remaining")).toBe("999")
    await qrs(avecCle("qrk_sk_live_moi"))
    expect(banc.appels[MOI.id]).toBe(2)
    expect(banc.appels[AUTRE.id], "chaque compte a le sien").toBeUndefined()
  })

  it("chaque route le compte et l'annonce ; un appel sans clé valide ne le consomme pas", async () => {
    for (const en of [{}, avecCle("qrk_sk_live_inventee")]) { await pages(en); await qrs(en); await destination("MOI123", en, { type: "url", value: "x.fr" }) }
    expect(banc.appels, "refusé à l'authentification = rien de décompté").toEqual({})
    const d = await destination("MOI123", avecCle("qrk_sk_live_moi"), { type: "url", value: "x.fr" })
    expect(d.entetes.get("X-Quota-Used")).toBe("1")
    expect((await qrs(avecCle("qrk_sk_live_moi"))).entetes.get("X-Quota-Used")).toBe("2")
    expect((await pages(avecCle("qrk_sk_live_moi"))).entetes.get("X-Quota-Used")).toBe("3")
  })

  it("atteint : 429 partout, et la destination n'est PAS changée", async () => {
    banc.appels[MOI.id] = 1000
    expect((await pages(avecCle("qrk_sk_live_moi"))).statut).toBe(429)
    expect((await qrs(avecCle("qrk_sk_live_moi"))).statut).toBe(429)
    const r = await destination("MOI123", avecCle("qrk_sk_live_moi"), { type: "url", value: "https://exemple.fr" })
    expect(r.statut).toBe(429)
    expect(r.corps.quota).toEqual({ limit: 1000, used: 1000 })
    expect(qrDe("MOI123").dest_override).toBeNull()
    expect((await pages(avecCle("qrk_sk_live_autre"))).statut, "l'autre compte n'est pas puni").toBe(200)
  })

  it("Business : 10 000 par mois", async () => {
    expect((await pages(avecCle("qrk_sk_live_autre"))).entetes.get("X-Quota-Limit")).toBe("10000")
  })
})
