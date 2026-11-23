import { describe, it, expect, vi, beforeEach } from "vitest"

// Vague 3, point 1 (revue du 23 nov.) : la VRAIE route /q/<code>, jouée contre un
// faux client Supabase. Une panne n'est pas un « code inconnu » ; la dernière
// destination connue sert de secours ; le scan ne compte que s'il aboutit ; le
// compteur des QR de lien s'incrémente dans la base.

const etat = {
  qr: null as any, qrErr: null as any, inst: null as any, instErr: null as any,
  scans: [] as any[], rpc: [] as any[], rpcErreur: null as any, majs: [] as any[],
}
const enAttente: Promise<unknown>[] = []
const alertes: any[] = []

function requete(table: string) {
  const q: any = {
    select() { return q }, eq() { return q }, order() { return q }, limit() { return q },
    maybeSingle: async () => table === "qr_codes" ? { data: etat.qr, error: etat.qrErr }
      : table === "instant_qrs" ? { data: etat.inst, error: etat.instErr }
      : table === "pages" ? { data: { slug: "chez-nenette" }, error: null } : { data: null, error: null },
    insert(row: any) { if (table === "scans") etat.scans.push(row); return Promise.resolve({ error: null }) },
    update(p: any) { etat.majs.push({ table, p }); return { eq: () => Promise.resolve({ error: null }) } },
    then(res: any) { return Promise.resolve({ data: [], error: null }).then(res) },
  }
  return q
}
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({
    from: (t: string) => requete(t),
    rpc: (nom: string, args: any) => { etat.rpc.push({ nom, args }); return Promise.resolve({ error: etat.rpcErreur }) },
  }),
}))
vi.mock("next/server", async (orig) => ({ ...(await orig() as object), after: (fn: () => unknown) => { enAttente.push(Promise.resolve().then(fn)) } }))
vi.mock("@/lib/alerteRedirection", () => ({ signalerPanneDuQr: async (p: any) => { alertes.push(p) } }))
vi.mock("@/lib/visiteurDeLaMaison", () => ({ utilisateurDesCookies: async () => null, estDeLaMaison: async () => false }))

const scanner = async (code: string, query = "") => {
  const { NextRequest } = await import("next/server")
  const { GET } = await import("./route")
  const res = await GET(new NextRequest(`http://x/q/${code}${query}`, { headers: { "user-agent": "Mozilla/5.0 (iPhone)", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` } }) as any, { params: Promise.resolve({ code }) })
  await Promise.all(enAttente.splice(0))
  return res
}
const QR_PAGE = (o: any = {}) => ({ id: "q1", short_code: "abc", user_id: "u1", page_id: "p1", status: "active", pages: { slug: "chez-nenette", status: "published", title: "Chez Nénette", team_id: null }, ...o })
const PANNE = { message: "fetch failed", code: "ECONNREFUSED" }

beforeEach(async () => {
  Object.assign(etat, { qr: null, qrErr: null, inst: null, instErr: null, scans: [], rpc: [], rpcErreur: null, majs: [] })
  alertes.length = 0
  ;(await import("@/lib/derniereDestination"))._viderLaMemoire()
})

describe("une panne n'est pas un code inconnu", () => {
  it("base injoignable, aucun secours : « Indisponible » en 503 temporaire, et l'alerte part", async () => {
    etat.qrErr = PANNE
    const res = await scanner("abc")
    expect(res.status).toBe(503)
    expect(res.headers.get("retry-after")).toBe("30")
    const html = await res.text()
    expect(html).toContain("Indisponible")
    expect(html).not.toContain("Code inconnu")
    expect(alertes).toEqual([{ code: "abc", cause: "qr_codes : fetch failed", secours: false }])
  })
  it("panne sur la table des QR de lien : pareil", async () => {
    etat.instErr = PANNE
    expect((await scanner("abc")).status).toBe(503)
  })
  it("un vrai code inconnu reste « Code inconnu » (404), sans alerte", async () => {
    const res = await scanner("zzz")
    expect(res.status).toBe(404)
    expect(await res.text()).toContain("Code inconnu")
    expect(alertes).toEqual([])
  })
})

describe("la dernière destination connue sert de secours", () => {
  it("un scan réussi la retient ; pendant la panne, le client y arrive quand même", async () => {
    etat.qr = QR_PAGE()
    const ok = await scanner("abc")
    expect(ok.status).toBe(302)
    expect(ok.headers.get("location")).toBe("https://qrowg.com/chez-nenette?s=abc")
    etat.qr = null; etat.qrErr = PANNE
    const secours = await scanner("abc")
    expect(secours.status).toBe(302)
    expect(secours.headers.get("location")).toBe("https://qrowg.com/chez-nenette?s=abc")
    expect(alertes[0]).toMatchObject({ code: "abc", secours: true })
  })
  it("un QR mis en pause est oublié : une panne ne le rouvre pas", async () => {
    etat.qr = QR_PAGE(); await scanner("abc")
    etat.qr = QR_PAGE({ status: "paused" }); expect((await scanner("abc")).status).toBe(503)
    etat.qr = null; etat.qrErr = PANNE
    expect((await scanner("abc")).status).toBe(503)
  })
  it("un lien protégé par mot de passe n'est jamais retenu", async () => {
    etat.inst = { id: "i1", user_id: "u1", kind: "link", dynamic: true, dest_url: "https://secret.fr/", status: "active", password_hash: "x" }
    expect((await scanner("lnk")).status).toBe(401)
    etat.inst = null; etat.instErr = PANNE
    expect((await scanner("lnk")).status).toBe(503)
  })
})

describe("le scan ne compte que s'il aboutit", () => {
  it("redirection réussie : un scan", async () => {
    etat.qr = QR_PAGE()
    await scanner("abc")
    expect(etat.scans).toHaveLength(1)
  })
  it("page en brouillon, aperçu, QR en pause : aucun scan", async () => {
    etat.qr = QR_PAGE({ pages: { slug: "x", status: "draft", title: "X" } })
    expect((await scanner("abc")).status).toBe(404)
    etat.qr = QR_PAGE()
    await scanner("abc", "?preview=1")
    etat.qr = QR_PAGE({ status: "paused" })
    await scanner("abc")
    expect(etat.scans).toHaveLength(0)
  })
})

describe("QR de lien : incrément atomique dans la base", () => {
  const LIEN = { id: "i1", user_id: "u1", kind: "link", dynamic: true, dest_url: "https://exemple.fr/", status: "active", total_scans: 4, password_hash: null }
  it("l'incrément passe par increment_scan_lien", async () => {
    etat.inst = LIEN
    const res = await scanner("lnk")
    expect(res.headers.get("location")).toBe("https://exemple.fr/")
    expect(etat.rpc).toEqual([{ nom: "increment_scan_lien", args: { p_id: "i1" } }])
    expect(etat.majs.filter(m => m.table === "instant_qrs")).toEqual([])
  })
  it("migration pas encore appliquée : l'ancienne écriture, en repli", async () => {
    etat.inst = LIEN; etat.rpcErreur = { code: "PGRST202", message: "function not found" }
    await scanner("lnk")
    await new Promise(r => setTimeout(r, 0))
    expect(etat.majs.find(m => m.table === "instant_qrs")?.p.total_scans).toBe(5)
  })
})
