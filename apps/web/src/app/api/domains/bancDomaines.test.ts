import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Les domaines personnalisés — la VRAIE route (ajouter, vérifier par DNS, définir
// le principal, supprimer), contre une fausse base qui applique la RLS (ses
// domaines, ses pages, son profil), un faux DNS et un faux hébergeur (v410).
//
// La base simule les deux états : SANS la migration 20261128120000 (celui de la
// production au 28/11 : UNIQUE (domain), aucun index sur (user_id, domain)) et
// AVEC elle (une revendication par compte, un seul compte VÉRIFIÉ par domaine).
//
// En le jouant (v410) :
//  - en production, AJOUTER un domaine échouait toujours (42P10 → 500) et un
//    compte pouvait bloquer le domaine d'un autre en l'ajoutant sans le vérifier :
//    la correction de juillet avait été écrite dans une migration déjà passée ;
//  - supprimer détachait le domaine chez l'hébergeur AVANT la base : une
//    suppression refusée le laissait « vérifié » sans qu'il soit servi ;
//  - un corps illisible faisait répondre 500 à la suppression.

const banc = vi.hoisted(() => {
  process.env.VERCEL_TOKEN = "jeton_banc"
  process.env.VERCEL_PROJECT_ID = "prj_banc"
  return {
    session: null as null | { id: string },
    base: {} as Record<string, Record<string, any>[]>,
    migree: true,
    txt: {} as Record<string, string[][]>,
    hebergeur: [] as { methode: string; url: string; corps?: any }[],
    hebergeurEnPanne: false,
    suppressionRefusee: false,
  }
})

vi.mock("dns/promises", () => ({ default: { resolveTxt: async (d: string) => { if (!banc.txt[d]) throw new Error("ENOTFOUND"); return banc.txt[d] } } }))
vi.mock("@/lib/appelQuiNAttendPas", () => ({
  fetchBorne: async (url: string, init: any) => {
    banc.hebergeur.push({ methode: init?.method ?? "GET", url, corps: init?.body ? JSON.parse(init.body) : undefined })
    if (banc.hebergeurEnPanne) return new Response(JSON.stringify({ error: { message: "quota hébergeur (détail interne)" } }), { status: 500 })
    return new Response("{}", { status: 200 })
  },
}))

let seq = 0
function requete(table: string, moi: string | null) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "update" | "upsert" | "delete" = "select", charge: any = null, conflit = "id", retour = false, tete = false
  const t = () => (banc.base[table] ??= [])
  const visible = (l: Record<string, any>) => moi === null ? true : table === "profiles" ? l.id === moi : table === "plan_domain_limits" ? true
    // « Lecture pages publiées » : toute page en ligne est LISIBLE par tout compte (leçon v403).
    : table === "pages" ? l.user_id === moi || l.status === "published"
    : l.user_id === moi
  const garde = (l: Record<string, any>) => visible(l) && filtres.every(f => f(l))
  const unicite = (l: Record<string, any>, sauf?: Record<string, any>) => {
    if (table !== "domain_verifications") return null
    const autres = t().filter(x => x !== sauf)
    if (!banc.migree) return autres.some(x => x.domain === l.domain) ? { code: "23505", message: "domain_verifications_domain_key" } : null
    if (autres.some(x => x.user_id === l.user_id && x.domain === l.domain)) return { code: "23505", message: "user_domain_key" }
    if (l.verified && autres.some(x => x.verified && x.domain === l.domain)) return { code: "23505", message: "idx_domain_verif_domain" }
    return null
  }
  const executer = () => {
    if (op === "upsert") {
      if (table === "domain_verifications" && conflit === "user_id,domain" && !banc.migree)
        return { data: null, error: { code: "42P10", message: "there is no unique or exclusion constraint matching the ON CONFLICT specification" } }
      const cles = conflit.split(",")
      const ex = t().find(l => cles.every(c => l[c] === charge[c]))
      if (ex) { Object.assign(ex, charge); return { data: [{ ...ex }], error: null } }
      const err = unicite(charge); if (err) return { data: null, error: err }
      const l = { id: `${table}_${++seq}`, created_at: new Date(Date.now() + seq).toISOString(), ...charge }; t().push(l)
      return { data: [{ ...l }], error: null }
    }
    if (op === "update") {
      const ls = t().filter(garde)
      for (const l of ls) { const err = unicite({ ...l, ...charge }, l); if (err) return { data: null, error: err } }
      ls.forEach(l => Object.assign(l, charge)); return { data: retour ? ls.map(l => ({ ...l })) : null, error: null }
    }
    if (op === "delete") {
      if (banc.suppressionRefusee && table === "domain_verifications") return { data: retour ? [] : null, error: null }
      const ls = t().filter(garde); banc.base[table] = t().filter(l => !ls.includes(l))
      return { data: retour ? ls.map(l => ({ id: l.id })) : null, error: null }
    }
    const ls = t().filter(garde)
    return tete ? { data: null, count: ls.length, error: null } : { data: ls.map(l => ({ ...l })), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(_c?: string, o?: { head?: boolean }) { if (op === "select") { if (o?.head) tete = true } else retour = true; return q },
    update(p: any) { op = "update"; charge = p; return q },
    upsert(p: any, o?: { onConflict?: string }) { op = "upsert"; charge = p; conflit = o?.onConflict ?? "id"; return q },
    delete() { op = "delete"; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    order() { return q },
    maybeSingle: une, single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
const rpc = async (nom: string, a: { p_user: string; p_domain: string }) => {
  if (nom !== "definir_domaine_principal") return { data: null, error: { message: "rpc" } }
  const les = banc.base.domain_verifications.filter(d => d.user_id === a.p_user)
  const cible = les.find(d => d.domain === a.p_domain && d.verified)
  if (!cible) return { data: false, error: null }
  les.forEach(d => { d.is_primary = d === cible })
  return { data: true, error: null }
}
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: banc.session } }) },
    from: (t: string) => requete(t, banc.session?.id ?? "anon"),
  }),
  createAdminClient: () => ({ from: (t: string) => requete(t, null), rpc }),
}))

import { GET, POST, DELETE } from "./route"

const appel = (m: "POST" | "DELETE", corps: unknown) => (m === "POST" ? POST : DELETE)(new NextRequest("https://qrowg.com/api/domains", {
  method: m, headers: { "content-type": "application/json" }, body: typeof corps === "string" ? corps : JSON.stringify(corps),
}))
const MOI = "u_moi", AUTRE = "u_autre"
const PAGE = "p_moi", PAGE_AUTRE = "p_autre"
const domaines = () => banc.base.domain_verifications
const ajouter = (domain: string, page_id = PAGE) => appel("POST", { domain, page_id })
const verifier = (domain: string) => appel("POST", { action: "verify", domain })
const poserTxt = (domain: string) => { const d = domaines().find(x => x.domain === domain && x.user_id === banc.session!.id)!; banc.txt[domain] = [[`qrowg-verify=${d.txt_record}`]] }

beforeEach(() => {
  banc.session = { id: MOI }
  banc.migree = true
  banc.txt = {}
  banc.hebergeur = []
  banc.hebergeurEnPanne = false
  banc.suppressionRefusee = false
  banc.base = {
    profiles: [{ id: MOI, plan: "pro" }, { id: AUTRE, plan: "business" }],
    plan_domain_limits: [],
    pages: [{ id: PAGE, user_id: MOI, custom_domain: null }, { id: PAGE_AUTRE, user_id: AUTRE, custom_domain: null, status: "published" }],
    domain_verifications: [], domain_redirects: [],
  }
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("la base de production d'aujourd'hui (sans la migration 20261128120000)", () => {
  beforeEach(() => { banc.migree = false })

  it("ajouter un domaine : une phrase vraie (503), pas un 500 muet", async () => {
    const r = await ajouter("lecomptoir.fr")
    expect(r.status).toBe(503)
    expect((await r.json()).error).toContain("pas encore disponibles")
    expect(domaines()).toEqual([])
  })
})

describe("ajouter un domaine", () => {
  it("à sa page : en attente, avec un jeton de vérification à poser en TXT", async () => {
    const r = await ajouter("  HTTPS://www.LeComptoir.fr/menu ")
    expect(r.status).toBe(200)
    const { domain } = await r.json()
    expect(domain).toMatchObject({ user_id: MOI, page_id: PAGE, domain: "lecomptoir.fr", verified: false, vercel_status: "pending" })
    expect(domain.txt_record).toMatch(/^qrv_[0-9a-f]{32}$/)
    expect(banc.hebergeur, "rien n'est rattaché avant la preuve DNS").toEqual([])
  })

  it("format invalide, adresse IP, page d'un autre : refusé, rien n'est enregistré", async () => {
    for (const d of ["pas un domaine", "127.0.0.1", "169.254.169.254", "localhost", "a..fr"]) expect((await ajouter(d)).status, d).toBe(400)
    expect((await ajouter("lecomptoir.fr", PAGE_AUTRE)).status).toBe(404)
    expect((await appel("POST", { domain: "lecomptoir.fr" })).status).toBe(400)
    expect(domaines()).toEqual([])
  })

  it("selon la formule : refusé au gratuit et en Starter ; 1 en Établissement ; illimité en Multi-sites", async () => {
    for (const p of ["free", "starter"]) {
      banc.base.profiles[0].plan = p
      const r = await ajouter("lecomptoir.fr")
      expect(r.status, p).toBe(403)
      expect((await r.json()).upgrade_required).toBe(true)
    }
    banc.base.profiles[0].plan = "pro"
    expect((await ajouter("lecomptoir.fr")).status).toBe(200)
    expect((await ajouter("lecomptoir.com")).status).toBe(403)
    banc.base.profiles[0].plan = "business"
    for (const d of ["a.fr", "b.fr", "c.fr"]) expect((await ajouter(d)).status).toBe(200)
  })

  it("plus de squatting : un autre compte qui l'a ajouté sans le vérifier ne bloque pas le vrai propriétaire", async () => {
    banc.session = { id: AUTRE }
    expect((await ajouter("lecomptoir.fr", PAGE_AUTRE)).status).toBe(200)       // en attente, sans preuve
    banc.session = { id: MOI }
    expect((await ajouter("lecomptoir.fr")).status).toBe(200)
    poserTxt("lecomptoir.fr")
    expect(await (await verifier("lecomptoir.fr")).json()).toMatchObject({ verified: true })
  })
})

describe("vérifier par DNS", () => {
  it("sans l'enregistrement TXT : non vérifié, et le message dit quoi poser", async () => {
    await ajouter("lecomptoir.fr")
    const j = await (await verifier("lecomptoir.fr")).json()
    expect(j.verified).toBe(false)
    expect(j.message).toContain(`qrowg-verify=${domaines()[0].txt_record}`)
    expect(domaines()[0].verified).toBe(false)
  })

  it("avec le bon TXT : vérifié, rattaché chez l'hébergeur, posé sur la page", async () => {
    await ajouter("lecomptoir.fr")
    poserTxt("lecomptoir.fr")
    expect(await (await verifier("lecomptoir.fr")).json()).toMatchObject({ verified: true, vercel_ok: true })
    expect(domaines()[0]).toMatchObject({ verified: true, vercel_status: "active" })
    expect(banc.hebergeur).toEqual([expect.objectContaining({ methode: "POST", corps: { name: "lecomptoir.fr" } })])
    expect(banc.base.pages[0].custom_domain).toBe("lecomptoir.fr")
  })

  it("un TXT faux, ou celui d'un autre compte, ne prouve rien", async () => {
    await ajouter("lecomptoir.fr")
    banc.txt["lecomptoir.fr"] = [["qrowg-verify=qrv_pas_le_bon"]]
    expect((await (await verifier("lecomptoir.fr")).json()).verified).toBe(false)
    expect(banc.hebergeur).toEqual([])
  })

  it("déjà vérifié par un autre compte : 409, rien n'est rattaché", async () => {
    banc.session = { id: AUTRE }
    await ajouter("lecomptoir.fr", PAGE_AUTRE); poserTxt("lecomptoir.fr"); await verifier("lecomptoir.fr")
    banc.hebergeur = []
    banc.session = { id: MOI }
    await ajouter("lecomptoir.fr"); poserTxt("lecomptoir.fr")
    const r = await verifier("lecomptoir.fr")
    expect(r.status).toBe(409)
    expect(domaines().find(d => d.user_id === MOI)!.verified).toBe(false)
    expect(banc.hebergeur).toEqual([])
    expect(banc.base.pages[0].custom_domain).toBeNull()
  })

  it("hébergeur en panne : vérifié, mais la page n'est pas branchée, et la panne n'est pas montrée telle quelle", async () => {
    await ajouter("lecomptoir.fr"); poserTxt("lecomptoir.fr")
    banc.hebergeurEnPanne = true
    const j = await (await verifier("lecomptoir.fr")).json()
    expect(j).toMatchObject({ verified: true, vercel_ok: false })
    expect(j.vercel_error).not.toContain("détail interne")
    expect(domaines()[0].vercel_status).toBe("error")
    expect(banc.base.pages[0].custom_domain).toBeNull()
  })

  it("le domaine d'un autre compte : introuvable", async () => {
    banc.session = { id: AUTRE }
    await ajouter("chezautre.fr", PAGE_AUTRE)
    banc.session = { id: MOI }
    expect((await verifier("chezautre.fr")).status).toBe(404)
  })
})

describe("le domaine principal", () => {
  it("le principal reçoit les autres en redirection 301 ; un domaine non vérifié ne peut pas l'être", async () => {
    banc.base.profiles[0].plan = "business"
    for (const d of ["lecomptoir.fr", "lecomptoir.com"]) { await ajouter(d); poserTxt(d); await verifier(d) }
    await ajouter("pas-verifie.fr")
    expect((await appel("POST", { action: "set_primary", domain: "pas-verifie.fr" })).status).toBe(404)
    const j = await (await appel("POST", { action: "set_primary", domain: "lecomptoir.fr" })).json()
    expect(j).toMatchObject({ ok: true, primary: "lecomptoir.fr", redirected: ["lecomptoir.com"] })
    expect(domaines().filter(d => d.is_primary).map(d => d.domain)).toEqual(["lecomptoir.fr"])
    expect(banc.base.domain_redirects).toEqual([expect.objectContaining({ user_id: MOI, from_domain: "lecomptoir.com", to_url: "https://lecomptoir.fr", redirect_type: 301 })])
  })
})

describe("supprimer un domaine", () => {
  const unDomaineBranche = async () => { await ajouter("lecomptoir.fr"); poserTxt("lecomptoir.fr"); await verifier("lecomptoir.fr"); banc.hebergeur = [] }

  it("la ligne part, la page est débranchée, puis l'hébergeur le détache", async () => {
    await unDomaineBranche()
    expect((await appel("DELETE", { id: domaines()[0].id })).status).toBe(200)
    expect(domaines()).toEqual([])
    expect(banc.base.pages[0].custom_domain).toBeNull()
    expect(banc.hebergeur).toEqual([expect.objectContaining({ methode: "DELETE" })])
  })

  it("une suppression que la base refuse : 500, et le domaine reste servi chez l'hébergeur (défaut v410)", async () => {
    await unDomaineBranche()
    banc.suppressionRefusee = true
    expect((await appel("DELETE", { id: domaines()[0].id })).status).toBe(500)
    expect(banc.hebergeur, "rien n'est détaché tant que la base n'a pas supprimé").toEqual([])
    expect(banc.base.pages[0].custom_domain).toBe("lecomptoir.fr")
  })

  it("corps illisible ou sans id : 400 ; le domaine d'un autre : 404", async () => {
    expect((await appel("DELETE", "{pas du json")).status).toBe(400)
    expect((await appel("DELETE", {})).status).toBe(400)
    banc.session = { id: AUTRE }
    await ajouter("chezautre.fr", PAGE_AUTRE)
    banc.session = { id: MOI }
    expect((await appel("DELETE", { id: domaines()[0].id })).status).toBe(404)
    expect(domaines()).toHaveLength(1)
  })
})

describe("la liste", () => {
  it("ses domaines seulement ; sans session : 401", async () => {
    await ajouter("lecomptoir.fr")
    banc.session = { id: AUTRE }; await ajouter("chezautre.fr", PAGE_AUTRE)
    banc.session = { id: MOI }
    expect((await (await GET()).json()).domains.map((d: any) => d.domain)).toEqual(["lecomptoir.fr"])
    banc.session = null
    expect((await GET()).status).toBe(401)
  })
})
