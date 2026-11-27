import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Créer une page — les DEUX vraies routes (page vierge `pages/create`, page depuis
// un modèle `templates/use`), jouées contre une fausse base (v401). Avant, une
// demi-douzaine de tests lisaient leur texte. Ici on regarde ce qui existe en
// base après l'appel : une page ET son QR, ou rien du tout.
//
// En le jouant (v401) :
//  - `templates/use` ignorait l'échec de l'insertion du QR : réponse « succès »,
//    page en base sans QR, donc impossible à scanner ;
//  - dans les deux routes, un code court introuvable levait APRÈS la création de
//    la page : 500, et la page restait orpheline ;
//  - `templates/use` refusait `blocks: null` en 413 « trop de blocs ».

const banc = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://banc.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "cle-anon"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "cle-service"
  return {
    session: null as null | { id: string },
    base: {} as Record<string, Record<string, any>[]>,
    echecs: [] as ((table: string, op: string, ligne: any) => any)[],
    codeLibre: true as boolean | "panne",
    tentatives: 0,
  }
})

const MOI = "u_moi", AUTRE = "u_autre"
let seq = 0

function requete(table: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "insert" | "delete" = "select"
  let lignes: Record<string, any>[] = [], tete = false
  const t = () => (banc.base[table] ??= [])
  const garde = (l: Record<string, any>) => filtres.every(f => f(l))
  const executer = (): { data: any; error: any; count?: number } => {
    if (op === "insert") {
      if (table === "pages") banc.tentatives++
      for (const l of lignes) for (const e of banc.echecs) { const err = e(table, op, l); if (err) return { data: null, error: err } }
      if (table === "pages" && lignes.some(l => t().some(x => x.slug === l.slug))) return { data: null, error: { code: "23505", message: "duplicate key pages_slug_key" } }
      const faites = lignes.map(l => ({ id: `${table}_${++seq}`, ...l }))
      t().push(...faites)
      return { data: faites, error: null }
    }
    if (op === "delete") {
      const partent = t().filter(garde)
      banc.base[table] = t().filter(l => !partent.includes(l))
      // on delete cascade, comme en vrai : blocs et QR partent avec la page.
      if (table === "pages") for (const enfant of ["blocks", "qr_codes"])
        banc.base[enfant] = (banc.base[enfant] ?? []).filter(l => !partent.some(p => p.id === l.page_id))
      return { data: null, error: null }
    }
    const ls = t().filter(garde)
    return tete ? { data: null, count: ls.length, error: null } : { data: ls, error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(_c?: string, o?: { head?: boolean }) { if (o?.head) tete = true; return q },
    insert(p: any) { op = "insert"; lignes = Array.isArray(p) ? p : [p]; return q },
    delete() { op = "delete"; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    or(expr: string) {
      const termes = expr.split(",").map(s => s.split("."))
      filtres.push(l => termes.some(([c, o, v]) => o === "eq" ? l[c] === v : o === "is" && v === "null" ? (l[c] ?? null) === null : false))
      return q
    },
    maybeSingle: une, single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}

vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: () => {} }) }))
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, cle: string) => cle === "cle-service"
    ? {
        from: requete,
        rpc: async (nom: string, { p_code }: { p_code: string }) => {
          if (nom !== "short_code_libre") return { data: null, error: { message: "rpc inconnue" } }
          if (banc.codeLibre === "panne") return { data: null, error: { message: "panne" } }
          return { data: banc.codeLibre && !(banc.base.qr_codes ?? []).some(l => l.short_code === p_code), error: null }
        },
      }
    : {
        auth: { getUser: async () => ({ data: { user: banc.session }, error: banc.session ? null : { message: "pas de session" } }) },
        from: () => { throw new Error("le client utilisateur ne doit rien lire ici") },
      },
}))

import { POST as creer } from "./create/route"
import { POST as depuisModele } from "../templates/use/route"
import { DEFAULT_PAGE_THEME, normalizePageTheme } from "@/app/dashboard/builder/types"

const appel = (route: (r: NextRequest) => Promise<Response>, corps: unknown) => route(new NextRequest("https://qrowg.com/api/x", {
  method: "POST", headers: { "content-type": "application/json" },
  body: typeof corps === "string" ? corps : JSON.stringify(corps),
}))
const pages = (u = MOI) => (banc.base.pages ?? []).filter(l => l.user_id === u)
const qrs = () => banc.base.qr_codes ?? []
const silence = () => vi.spyOn(console, "error").mockImplementation(() => {})

beforeEach(() => {
  banc.session = { id: MOI }
  banc.echecs = []
  banc.codeLibre = true
  banc.tentatives = 0
  banc.base = { profiles: [{ id: MOI, plan: "free" }, { id: AUTRE, plan: "free" }], pages: [], qr_codes: [], blocks: [] }
})

// Les deux routes partagent les mêmes promesses : on les joue toutes deux.
const ROUTES = [["pages/create", creer, {}], ["templates/use", depuisModele, { templateName: "Chez Marcel" }]] as const

describe.each(ROUTES)("%s — ce que les deux routes promettent", (_nom, route, corps) => {
  it("sans session : 401, rien n'est créé", async () => {
    banc.session = null
    expect((await appel(route, corps)).status).toBe(401)
    expect(banc.base.pages).toEqual([])
    expect(qrs()).toEqual([])
  })

  it("une page en brouillon, et son QR, au bon compte", async () => {
    const r = await appel(route, corps)
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(pages()).toHaveLength(1)
    const p = pages()[0]
    expect(j.pageId).toBe(p.id)
    expect(p).toMatchObject({ status: "draft", user_id: MOI })
    expect(p.slug).toMatch(/^[a-z0-9_-]{2,60}$/)
    expect(qrs()).toHaveLength(1)
    expect(qrs()[0]).toMatchObject({ page_id: p.id, user_id: MOI, status: "active" })
    expect(qrs()[0].short_code).toMatch(/^[A-Za-z0-9]{7}$/)
    expect(j).toMatchObject({ qrStatus: "active", atActiveLimit: false })
  })

  it("au plafond de QR actifs : la page est créée, son QR en brouillon, et la réponse le dit", async () => {
    banc.base.qr_codes = [{ id: "q0", page_id: "p0", user_id: MOI, status: "active", short_code: "AAAAAAA" }]
    const j = await (await appel(route, corps)).json()
    expect(j).toMatchObject({ qrStatus: "draft", atActiveLimit: true })
    expect(qrs().find(q => q.page_id === j.pageId)!.status).toBe("draft")
  })

  it("en pause ou au compte d'un autre, un QR ne prend pas de place ; en Multi-sites rien n'en prend", async () => {
    banc.base.qr_codes = [
      { id: "q0", page_id: "p0", user_id: MOI, status: "paused", short_code: "AAAAAAA" },
      { id: "q1", page_id: "p1", user_id: AUTRE, status: "active", short_code: "BBBBBBB" },
    ]
    expect((await (await appel(route, corps)).json()).qrStatus).toBe("active")
    banc.base.profiles[0].plan = "business"
    expect((await (await appel(route, corps)).json()).qrStatus).toBe("active")
  })

  it("le plafond de 300 pages : refusé à 300, accepté à 299, les pages des autres ne comptent pas", async () => {
    banc.base.pages = Array.from({ length: 300 }, (_, i) => ({ id: `p${i}`, user_id: AUTRE, slug: `autre-${i}` }))
    banc.base.pages.push(...Array.from({ length: 299 }, (_, i) => ({ id: `m${i}`, user_id: MOI, slug: `moi-${i}` })))
    expect((await appel(route, corps)).status).toBe(200)
    const r = await appel(route, corps)
    expect(r.status).toBe(403)
    expect((await r.json()).message).toContain("300 pages")
    expect(pages()).toHaveLength(300)
    expect(qrs()).toHaveLength(1)
  })

  it("le QR ne peut pas être posé : la page part avec, rien d'orphelin", async () => {
    banc.echecs = [(t) => t === "qr_codes" ? { code: "XX000", message: "panne" } : null]
    const e = silence()
    const r = await appel(route, corps)
    e.mockRestore()
    expect(r.status).toBe(500)
    expect(banc.base.pages).toEqual([])
    expect(banc.base.blocks).toEqual([])
  })

  it("aucun code court libre (base en panne) : 500, et la page ne reste pas sans QR", async () => {
    banc.codeLibre = "panne"
    const e = silence()
    const r = await appel(route, corps)
    e.mockRestore()
    expect(r.status).toBe(500)
    expect(banc.base.pages).toEqual([])
    expect(qrs()).toEqual([])
  })
})

describe("pages/create — la page vierge", () => {
  it("un titre absent, illisible ou vide donne « Ma page » ; un titre long est borné", async () => {
    for (const c of [{}, "{pas du json", { title: 42 }, { title: "   " }]) await appel(creer, c)
    expect(pages().map(p => p.title)).toEqual(["Ma page", "Ma page", "Ma page", "Ma page"])
    await appel(creer, { title: "x".repeat(500) })
    expect(pages()[4].title.length).toBeLessThanOrEqual(80)
  })

  it("le thème est le thème canonique, et le code court rendu est celui posé en base", async () => {
    const j = await (await appel(creer, { title: "Le Comptoir" })).json()
    expect(pages()[0].theme).toEqual(DEFAULT_PAGE_THEME)
    expect(j.shortCode).toBe(qrs()[0].short_code)
    expect(j.slug).toBe(pages()[0].slug)
  })

  it("une adresse déjà prise : on retente, avec une autre", async () => {
    let refus = 2
    banc.echecs = [(t) => t === "pages" && refus-- > 0 ? { code: "23505", message: "duplicate" } : null]
    expect((await appel(creer, { title: "Le Comptoir" })).status).toBe(200)
    expect(banc.tentatives).toBe(3)
    expect(pages()).toHaveLength(1)
  })

  it("une autre erreur de base : on s'arrête, sans QR, et sans dire le détail de Postgres", async () => {
    banc.echecs = [(t) => t === "pages" ? { code: "XX000", message: "relation pages contrainte secrète" } : null]
    const e = silence()
    const r = await appel(creer, { title: "Le Comptoir" })
    e.mockRestore()
    expect(r.status).toBeGreaterThanOrEqual(400)
    expect(banc.tentatives).toBe(1)
    expect(JSON.stringify(await r.json())).not.toContain("secrète")
    expect(qrs()).toEqual([])
  })
})

describe("templates/use — la page depuis un modèle", () => {
  it("le corps doit être un objet", async () => {
    for (const c of ["{pas du json", "42", "null"]) expect((await appel(depuisModele, c)).status).toBe(400)
    expect(banc.base.pages).toEqual([])
  })

  it("seuls les blocs d'un type connu sont posés, dans l'ordre, masqués si demandé", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const r = await appel(depuisModele, {
      templateId: "resto-1", templateName: "Chez Marcel",
      blocks: [
        { type: "profile", content: { name: "" } },
        { type: "type_qui_n_existe_pas", content: {} },
        null,
        { type: "bio", visible: false },
        { type: "constructor" },
      ],
    })
    warn.mockRestore()
    expect(r.status).toBe(200)
    const p = pages()[0]
    expect(p).toMatchObject({ title: "Chez Marcel", template_id: "resto-1" })
    const b = banc.base.blocks.filter(x => x.page_id === p.id)
    expect(b.map(x => [x.type, x.position, x.is_visible])).toEqual([["profile", 0, true], ["bio", 1, false]])
    expect(b[1].content).toEqual({})
  })

  it("le thème est écrit au format canonique ; pas de thème ni de blocs, c'est permis", async () => {
    await appel(depuisModele, { templateName: "A", theme: { bg: "#000000" } })
    expect(pages()[0].theme).toEqual(normalizePageTheme({ bg: "#000000" }))
    const r = await appel(depuisModele, { templateName: "B", theme: null, blocks: null })
    expect(r.status).toBe(200)
    expect(pages()[1].theme).toEqual(normalizePageTheme(null))
  })

  it("trop gros : 413, et rien n'est créé", async () => {
    const trop = [
      { blocks: Array.from({ length: 201 }, () => ({ type: "bio" })) },
      { blocks: [{ type: "bio", content: { t: "x".repeat(610_000) } }] },
      { blocks: "pas un tableau" },
      { theme: { t: "x".repeat(41_000) } },
    ]
    for (const c of trop) expect((await appel(depuisModele, c)).status).toBe(413)
    expect(banc.base.pages).toEqual([])
    expect(qrs()).toEqual([])
  })

  it("une adresse choisie : normalisée, refusée si invalide, réservée ou prise", async () => {
    banc.base.pages = [{ id: "px", user_id: AUTRE, slug: "le-comptoir" }]
    expect((await appel(depuisModele, { slug: "a" })).status).toBe(400)
    expect((await appel(depuisModele, { slug: "pas d'espace" })).status).toBe(400)
    expect((await appel(depuisModele, { slug: "guides" })).status).toBe(400)
    expect((await appel(depuisModele, { slug: "Le-Comptoir" })).status).toBe(409)
    expect(pages()).toEqual([])
    const r = await appel(depuisModele, { slug: "  Chez-Marcel  " })
    expect(r.status).toBe(200)
    expect(pages()[0].slug).toBe("chez-marcel")
  })

  it("les blocs ne peuvent pas être posés : la page part, sans QR", async () => {
    banc.echecs = [(t) => t === "blocks" ? { code: "XX000", message: "panne" } : null]
    const e = silence()
    const r = await appel(depuisModele, { blocks: [{ type: "bio" }] })
    e.mockRestore()
    expect(r.status).toBe(500)
    expect(banc.base.pages).toEqual([])
    expect(qrs()).toEqual([])
  })
})
