import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Dupliquer un QR (nouvelle page + nouveau QR) et ajouter un support (nouveau QR
// sur la MÊME page) — les deux VRAIES routes, jouées contre une fausse base qui
// applique la RLS (v402). Avant, supportImprime.test et robustesseServeur.test
// lisaient leur texte. Ici on regarde ce qui existe en base après l'appel.
//
// En le jouant (v402) :
//  - la duplication ne recopiait PAS les blocs : « Copie créée, avec sa propre
//    page » ouvrait une page vide ;
//  - la copie héritait de la pause, de l'archivage et du choix « garder au
//    passage à l'offre inférieure » de l'original ;
//  - un QR impossible à poser laissait la page copiée orpheline ;
//  - un corps illisible répondait 500 ; un code court introuvable faisait
//    tomber `qr-support` hors de tout catch.

const banc = vi.hoisted(() => ({
  session: null as null | { id: string },
  base: {} as Record<string, Record<string, any>[]>,
  echecs: [] as ((table: string, ligne: any) => any)[],
  codeLibre: true as boolean | "panne",
  equipes: {} as Record<string, string[]>, // membre -> propriétaires dont il LIT le contenu
}))

const UU = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`
const MOI = "u_moi", AUTRE = "u_autre"
let seq = 0

function requete(table: string, moi: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "insert" | "delete" = "select"
  let lignes: Record<string, any>[] = [], tete = false, colonnes = "*", tri: string | null = null
  const t = () => (banc.base[table] ??= [])
  // RLS : son profil ; ses pages, QR et blocs — et en LECTURE ceux des
  // propriétaires dont on est membre (can_read_owner), comme en vrai.
  const lisible = (u: string) => u === moi || (banc.equipes[moi] ?? []).includes(u)
  const proprioDeLaPage = (id: string) => (banc.base.pages ?? []).find(p => p.id === id)?.user_id
  const visible = (l: Record<string, any>) =>
    table === "profiles" ? l.id === moi : table === "blocks" ? lisible(proprioDeLaPage(l.page_id)) : lisible(l.user_id)
  const ecrivable = (l: Record<string, any>) =>
    table === "blocks" ? proprioDeLaPage(l.page_id) === moi : l.user_id === moi
  const garde = (l: Record<string, any>) => visible(l) && filtres.every(f => f(l))
  const embarquer = (l: Record<string, any>) => colonnes.includes("pages(")
    ? { ...l, pages: (banc.base.pages ?? []).find(p => p.id === l.page_id) ?? null } : { ...l }
  const executer = (): { data: any; error: any; count?: number } => {
    if (op === "insert") {
      for (const l of lignes) {
        for (const e of banc.echecs) { const err = e(table, l); if (err) return { data: null, error: err } }
        if (!ecrivable(l)) return { data: null, error: { code: "42501", message: "new row violates row-level security" } }
        const unique = table === "pages" ? "slug" : table === "qr_codes" ? "short_code" : null
        if (unique && t().some(x => x[unique] === l[unique])) return { data: null, error: { code: "23505", message: `duplicate ${unique}` } }
      }
      const faites = lignes.map(l => ({ id: UU(++seq + 1000), created_at: new Date(Date.now() + seq).toISOString(), ...l }))
      t().push(...faites)
      return { data: faites.map(embarquer), error: null }
    }
    if (op === "delete") {
      const partent = t().filter(garde)
      banc.base[table] = t().filter(l => !partent.includes(l))
      if (table === "pages") for (const enfant of ["blocks", "qr_codes"])
        banc.base[enfant] = (banc.base[enfant] ?? []).filter(l => !partent.some(p => p.id === l.page_id))
      return { data: null, error: null }
    }
    let ls = t().filter(garde)
    if (tri) ls = [...ls].sort((a, b) => a[tri!] - b[tri!])
    return tete ? { data: null, count: ls.length, error: null } : { data: ls.map(embarquer), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(c?: string, o?: { head?: boolean }) { if (op === "select") { colonnes = c ?? "*"; if (o?.head) tete = true } else colonnes = c ?? "*"; return q },
    insert(p: any) { op = "insert"; lignes = Array.isArray(p) ? p : [p]; return q },
    delete() { op = "delete"; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    order(c: string) { tri = c; return q },
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

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: banc.session } }) },
    from: (t: string) => requete(t, banc.session?.id ?? "anon"),
    rpc: async (_nom: string, { p_code }: { p_code: string }) => banc.codeLibre === "panne"
      ? { data: null, error: { message: "panne" } }
      : { data: !(banc.base.qr_codes ?? []).some(l => l.short_code === p_code), error: null },
  }),
}))

import { POST as dupliquer } from "./route"
import { POST as ajouterSupport } from "../qr-support/route"

const appel = (route: (r: NextRequest) => Promise<Response>, corps: unknown) => route(new NextRequest("https://qrowg.com/api/x", {
  method: "POST", headers: { "content-type": "application/json" },
  body: typeof corps === "string" ? corps : JSON.stringify(corps),
}))
const silence = () => vi.spyOn(console, "error").mockImplementation(() => {})
const PAGE = UU(1), QR = UU(2)
const STYLE = { foreground_color: "#C9A227", background_color: "#0A0A0A", corner_style: "dot", error_correction: "H", style_config: { dotStyle: "rounded" }, logo_url: null }

beforeEach(() => {
  banc.session = { id: MOI }
  banc.echecs = []
  banc.codeLibre = true
  banc.equipes = {}
  banc.base = {
    profiles: [{ id: MOI, plan: "starter" }, { id: AUTRE, plan: "free" }],
    pages: [{ id: PAGE, user_id: MOI, title: "Le Comptoir", slug: "le-comptoir", status: "published", total_views: 812, custom_domain: "menu.lecomptoir.fr", published_at: "2026-10-01", theme: { bg: "#000" } }],
    blocks: [
      { id: "b1", page_id: PAGE, type: "profile", position: 0, content: { name: "Le Comptoir" }, is_visible: true, styles: { pad: 4 } },
      { id: "b2", page_id: PAGE, type: "menu_section", position: 1, content: { items: [{ n: "Café", p: "2" }] }, is_visible: false, styles: {} },
    ],
    qr_codes: [{
      id: QR, page_id: PAGE, user_id: MOI, short_code: "AAAAAAA", status: "paused", label: "Vitrine", ...STYLE,
      total_scans: 340, last_scan_at: "2026-11-20", dest_override: { type: "url", url: "https://x.fr" }, dest_history: [{ type: "url" }],
      paused_reason: "manual", paused_at: "2026-11-01", archived_at: null, keep_on_downgrade: true, pause_message: "Fermé", expires_at: null,
      print_design: null, print_format: null, created_at: "2026-01-01",
    }],
  }
})

describe("dupliquer un QR : une autre page, avec son contenu", () => {
  it("sans session : 401 ; corps invalide : 400 ; QR d'un autre : 404 — rien n'est créé", async () => {
    banc.base.qr_codes.push({ ...banc.base.qr_codes[0], id: UU(9), user_id: AUTRE, short_code: "ZZZZZZZ" })
    const avant = JSON.stringify(banc.base)
    banc.session = null
    expect((await appel(dupliquer, { qr_id: QR })).status).toBe(401)
    banc.session = { id: MOI }
    for (const c of ["{pas du json", {}, { qr_id: 12 }, { qr_id: "abc" }]) expect((await appel(dupliquer, c)).status).toBe(400)
    expect((await appel(dupliquer, { qr_id: UU(9) })).status).toBe(404)
    expect(JSON.stringify(banc.base)).toBe(avant)
  })

  it("membre de l'équipe d'un autre : il lit son QR, mais ne le copie pas dans son compte", async () => {
    banc.equipes = { [MOI]: [AUTRE] }
    banc.base.pages.push({ id: UU(8), user_id: AUTRE, title: "Chez Autre", slug: "chez-autre", status: "published" })
    banc.base.blocks.push({ id: "b9", page_id: UU(8), type: "bio", position: 0, content: { t: "secret" }, is_visible: true, styles: {} })
    banc.base.qr_codes.push({ id: UU(9), page_id: UU(8), user_id: AUTRE, short_code: "ZZZZZZZ", status: "active" })
    expect((await appel(dupliquer, { qr_id: UU(9) })).status).toBe(404)
    expect(banc.base.pages).toHaveLength(2)
    expect(banc.base.blocks.filter(b => b.content?.t === "secret")).toHaveLength(1)
  })

  it("la page copiée a tout le contenu de l'original, et l'original n'a pas bougé", async () => {
    const r = await appel(dupliquer, { qr_id: QR })
    expect(r.status).toBe(200)
    const { qr } = await r.json()
    const copie = banc.base.pages.find(p => p.id === qr.page_id)!
    expect(copie.id).not.toBe(PAGE)
    const blocs = banc.base.blocks.filter(b => b.page_id === copie.id)
    expect(blocs.map(({ type, position, content, is_visible, styles }) => ({ type, position, content, is_visible, styles })))
      .toEqual(banc.base.blocks.filter(b => b.page_id === PAGE).map(({ type, position, content, is_visible, styles }) => ({ type, position, content, is_visible, styles })))
    expect(blocs.every(b => b.id !== "b1" && b.id !== "b2")).toBe(true)
    expect(banc.base.blocks.filter(b => b.page_id === PAGE)).toHaveLength(2)
    expect(banc.base.pages.find(p => p.id === PAGE)).toMatchObject({ title: "Le Comptoir", status: "published", total_views: 812 })
  })

  it("la page copiée repart en brouillon, sans vues, sans domaine, sous une autre adresse", async () => {
    const { qr } = await (await appel(dupliquer, { qr_id: QR })).json()
    const copie = banc.base.pages.find(p => p.id === qr.page_id)!
    expect(copie).toMatchObject({ user_id: MOI, title: "Le Comptoir (copie)", status: "draft", total_views: 0, custom_domain: null, published_at: null, theme: { bg: "#000" } })
    expect(copie.slug).toMatch(/^le-comptoir-[a-z0-9]{5}$/)
    expect(qr.pages).toMatchObject({ id: copie.id, title: "Le Comptoir (copie)" })
  })

  it("le QR copié garde l'apparence et le nom, pas l'histoire : scans, destination, pause, garde", async () => {
    const { qr } = await (await appel(dupliquer, { qr_id: QR })).json()
    const l = banc.base.qr_codes.find(x => x.id === qr.id)!
    expect(l).toMatchObject({ ...STYLE, label: "Vitrine", user_id: MOI })
    expect(l.short_code).not.toBe("AAAAAAA")
    expect(l).toMatchObject({ total_scans: 0, last_scan_at: null, dest_override: null, dest_history: [], status: "active" })
    expect(l).toMatchObject({ paused_reason: null, paused_at: null, archived_at: null, keep_on_downgrade: false })
  })

  it("au plafond de QR actifs, la copie arrive en brouillon ; en Multi-sites, active", async () => {
    banc.base.profiles[0].plan = "free"
    banc.base.qr_codes[0].status = "active"
    const { qr } = await (await appel(dupliquer, { qr_id: QR })).json()
    expect(banc.base.qr_codes.find(x => x.id === qr.id)!.status).toBe("draft")
    banc.base.profiles[0].plan = "business"
    const r2 = await (await appel(dupliquer, { qr_id: QR })).json()
    expect(banc.base.qr_codes.find(x => x.id === r2.qr.id)!.status).toBe("active")
  })

  it("le plafond de 300 pages : rien n'est créé", async () => {
    banc.base.pages.push(...Array.from({ length: 299 }, (_, i) => ({ id: `m${i}`, user_id: MOI, slug: `moi-${i}` })))
    const r = await appel(dupliquer, { qr_id: QR })
    expect(r.status).toBe(403)
    expect(banc.base.pages).toHaveLength(300)
    expect(banc.base.qr_codes).toHaveLength(1)
  })

  for (const [quoi, regler] of [
    ["les blocs ne peuvent pas être copiés", () => { banc.echecs = [(t) => t === "blocks" ? { code: "XX000", message: "panne" } : null] }],
    ["le QR ne peut pas être posé", () => { banc.echecs = [(t) => t === "qr_codes" ? { code: "XX000", message: "panne" } : null] }],
    ["aucun code court libre (base en panne)", () => { banc.codeLibre = "panne" }],
  ] as const) {
    it(`${quoi} : 500, et la page copiée ne reste pas orpheline`, async () => {
      regler()
      const e = silence()
      const r = await appel(dupliquer, { qr_id: QR })
      e.mockRestore()
      expect(r.status).toBe(500)
      expect(banc.base.pages.map(p => p.id)).toEqual([PAGE])
      expect(banc.base.blocks.map(b => b.id)).toEqual(["b1", "b2"])
      expect(banc.base.qr_codes.map(q => q.id)).toEqual([QR])
    })
  }
})

describe("ajouter un support : un autre QR sur la MÊME page", () => {
  it("sans session : 401 ; sans page : 400 ; page d'un autre : 404 — rien n'est créé", async () => {
    banc.base.pages.push({ id: UU(8), user_id: AUTRE, slug: "chez-autre" })
    banc.session = null
    expect((await appel(ajouterSupport, { page_id: PAGE })).status).toBe(401)
    banc.session = { id: MOI }
    for (const c of ["{pas du json", {}, { page_id: 12 }]) expect((await appel(ajouterSupport, c)).status).toBe(400)
    expect((await appel(ajouterSupport, { page_id: UU(8) })).status).toBe(404)
    expect(banc.base.qr_codes).toHaveLength(1)
  })

  it("membre de l'équipe d'un autre : pas de support à son compte sur la page du propriétaire", async () => {
    banc.equipes = { [MOI]: [AUTRE] }
    banc.base.pages.push({ id: UU(8), user_id: AUTRE, slug: "chez-autre" })
    expect((await appel(ajouterSupport, { page_id: UU(8) })).status).toBe(404)
    expect(banc.base.qr_codes).toHaveLength(1)
  })

  it("le support mène à la même page, sans en créer, et prend le premier nom libre", async () => {
    const r = await appel(ajouterSupport, { page_id: PAGE })
    expect(r.status).toBe(200)
    const j = await r.json()
    expect(banc.base.pages).toHaveLength(1)
    expect(j.qr).toMatchObject({ page_id: PAGE, user_id: MOI, label: "Support 2" })
    expect(j.qr.pages).toMatchObject({ id: PAGE })
    expect(j.qr.short_code).not.toBe("AAAAAAA")
    await appel(ajouterSupport, { page_id: PAGE })
    expect(banc.base.qr_codes.map(q => q.label)).toEqual(["Vitrine", "Support 2", "Support 3"])
  })

  it("un nom donné est gardé, borné à 60 caractères", async () => {
    await appel(ajouterSupport, { page_id: PAGE, label: "Table 4" })
    await appel(ajouterSupport, { page_id: PAGE, label: "x".repeat(200) })
    expect(banc.base.qr_codes[1].label).toBe("Table 4")
    expect(banc.base.qr_codes[2].label.length).toBeLessThanOrEqual(60)
  })

  it("il reprend l'apparence du QR d'où l'on part — jamais celle d'un QR étranger", async () => {
    banc.base.qr_codes.push({ id: UU(3), page_id: PAGE, user_id: MOI, short_code: "BBBBBBB", status: "active", label: "Table", foreground_color: "#111111", background_color: "#FFFFFF", corner_style: "square", error_correction: "M", style_config: {}, logo_url: null, created_at: "2026-02-01" })
    banc.base.pages.push({ id: UU(8), user_id: AUTRE, slug: "chez-autre" })
    banc.base.qr_codes.push({ id: UU(9), page_id: UU(8), user_id: AUTRE, short_code: "ZZZZZZZ", status: "active", foreground_color: "#FF0000", created_at: "2025-01-01" })
    const depuisTable = (await (await appel(ajouterSupport, { page_id: PAGE, depuis: UU(3) })).json()).qr
    expect(depuisTable).toMatchObject({ foreground_color: "#111111", corner_style: "square" })
    const etranger = (await (await appel(ajouterSupport, { page_id: PAGE, depuis: UU(9) })).json()).qr
    expect(etranger).toMatchObject({ foreground_color: "#C9A227", corner_style: "dot" }) // le plus ancien de la page
    // Ni celle d'un de SES QR posé sur une AUTRE de ses pages.
    banc.base.pages.push({ id: UU(7), user_id: MOI, slug: "autre-page" })
    banc.base.qr_codes.push({ id: UU(6), page_id: UU(7), user_id: MOI, short_code: "CCCCCCC", status: "paused", foreground_color: "#00FF00", corner_style: "rounded", created_at: "2024-01-01" })
    const ailleurs = (await (await appel(ajouterSupport, { page_id: PAGE, depuis: UU(6) })).json()).qr
    expect(ailleurs).toMatchObject({ foreground_color: "#C9A227", corner_style: "dot" })
  })

  it("au plafond de QR actifs, il arrive en brouillon et la réponse le dit", async () => {
    banc.base.profiles[0].plan = "free"
    banc.base.qr_codes[0].status = "active"
    const j = await (await appel(ajouterSupport, { page_id: PAGE })).json()
    expect(j).toMatchObject({ brouillon: true })
    expect(j.qr.status).toBe("draft")
    banc.base.qr_codes[0].status = "paused"
    const k = await (await appel(ajouterSupport, { page_id: PAGE })).json()
    expect(k).toMatchObject({ brouillon: false })
    expect(k.qr.status).toBe("active")
  })

  it("aucun code court libre : 500 propre, rien n'est créé", async () => {
    banc.codeLibre = "panne"
    const e = silence()
    const r = await appel(ajouterSupport, { page_id: PAGE })
    e.mockRestore()
    expect(r.status).toBe(500)
    expect((await r.json()).error).toContain("Réessayez")
    expect(banc.base.qr_codes).toHaveLength(1)
  })
})
