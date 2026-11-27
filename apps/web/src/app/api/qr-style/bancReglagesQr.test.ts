import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Les réglages d'un QR de page — style (`qr-style`), nom du support (`qr-label`),
// design d'impression (`print-design`) : les VRAIES routes, contre une fausse base
// qui applique la RLS des QR (lecture et écriture : ses QR et ceux des équipes
// dont on est membre) et des profils (le sien seulement) (v409).
//
// En le jouant (v409) :
//  - les trois routes n'écrivaient que sur les QR DU COMPTE, alors que le QR
//    Studio et l'atelier montrent au membre d'équipe ceux du propriétaire : un
//    éditeur ne pouvait ni restyler, ni nommer un support, ni enregistrer un
//    design — « QR introuvable » sur le QR qu'il avait sous les yeux ;
//  - `qr-style` écrivait en base ce qu'on lui envoyait, sans type ni taille.

const banc = vi.hoisted(() => ({
  session: null as null | { id: string },
  base: {} as Record<string, Record<string, any>[]>,
  muet: false,       // une écriture qui ne touche aucune ligne, sans erreur (QR retiré entre-temps, droits changés)
}))

function requete(table: string, moi: string | null) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "update" = "select", patch: Record<string, any> = {}, retour = false, colonnes = "*"
  const t = () => (banc.base[table] ??= [])
  const proprios = () => new Set([moi, ...(banc.base.team_members ?? []).filter(m => m.user_id === moi)
    .map(m => (banc.base.teams ?? []).find(x => x.id === m.team_id)?.owner_id).filter(Boolean)])
  const visible = (l: Record<string, any>) => moi === null ? true
    : table === "profiles" ? l.id === moi
    : table === "team_members" ? l.user_id === moi
    : proprios().has(l.user_id)
  const garde = (l: Record<string, any>) => visible(l) && filtres.every(f => f(l))
  const executer = () => {
    if (op === "update") {
      if (banc.muet) return { data: retour ? [] : null, error: null }
      const ls = t().filter(garde)
      // supabase-js omet les clés `undefined` du JSON envoyé : elles ne touchent rien.
      const propre = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
      ls.forEach(l => Object.assign(l, propre))
      return { data: retour ? ls.map(l => ({ ...l })) : null, error: null }
    }
    const ls = t().filter(garde).map(l => colonnes.includes("teams(") ? { ...l, teams: (banc.base.teams ?? []).find(x => x.id === l.team_id) ?? null } : { ...l })
    return { data: ls, error: null }
  }
  const q: any = {
    select(c?: string) { if (op === "select") colonnes = c ?? "*"; else retour = true; return q },
    update(p: Record<string, any>) { op = "update"; patch = p; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    in(c: string, vs: unknown[]) { filtres.push(l => vs.includes(l[c])); return q },
    maybeSingle: async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } },
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: banc.session } }) },
    from: (t: string) => requete(t, banc.session?.id ?? "anon"),
  }),
  createAdminClient: () => ({ from: (t: string) => requete(t, null) }),
}))

import { POST as styler } from "./route"
import { POST as nommer } from "../qr-label/route"
import { POST as enregistrerDesign, GET as lireDesign } from "../print-design/route"

const appel = (route: (r: any) => Promise<Response>, corps: unknown) => route(new NextRequest("https://qrowg.com/api/x", {
  method: "POST", headers: { "content-type": "application/json" },
  body: typeof corps === "string" ? corps : JSON.stringify(corps),
}))
const lire = (q: string) => lireDesign(new NextRequest(`https://qrowg.com/api/print-design?${q}`))
const MOI = "u_moi", AUTRE = "u_autre", MEMBRE = "u_membre"
const qr = (id: string) => banc.base.qr_codes.find(l => l.id === id)!
const membreDe = (proprio: string) => {
  banc.session = { id: MEMBRE }
  banc.base.teams = [{ id: "t1", owner_id: proprio }]
  banc.base.team_members = [{ team_id: "t1", user_id: MEMBRE, role: "editor" }]
}
const ligne = (id: string, user_id: string, extra: Record<string, any> = {}) => ({
  id, user_id, short_code: `S${id}`, label: null, foreground_color: "#080808", background_color: "#FFFFFF",
  corner_style: "square", error_correction: "M", style_config: { dotStyle: "square" }, print_design: null, print_format: "a4", ...extra,
})

beforeEach(() => {
  banc.session = { id: MOI }
  banc.muet = false
  banc.base = {
    profiles: [{ id: MOI, plan: "free" }, { id: AUTRE, plan: "free" }, { id: MEMBRE, plan: "free" }],
    teams: [], team_members: [],
    qr_codes: [ligne("q1", MOI), ligne("q2", MOI), ligne("a1", AUTRE)],
  }
})

describe("le style d'un QR", () => {
  it("enregistre ce que le Studio envoie ; un champ absent ne touche rien", async () => {
    const r = await appel(styler, { qr_id: "q1", foreground_color: "#C9A227", style_config: { dotStyle: "rounded" } })
    expect(r.status).toBe(200)
    expect(qr("q1")).toMatchObject({ foreground_color: "#C9A227", background_color: "#FFFFFF", corner_style: "square", style_config: { dotStyle: "rounded" } })
  })

  it("une valeur qui n'est pas un style est refusée, rien n'est écrit (défaut v409)", async () => {
    const avant = JSON.stringify(banc.base.qr_codes)
    for (const c of [
      { qr_id: "q1", foreground_color: "red;background:url(x)" },
      { qr_id: "q1", foreground_color: "x".repeat(10_000) },
      { qr_id: "q1", background_color: 42 },
      { qr_id: "q1", corner_style: "étoile" },
      { qr_id: "q1", error_correction: "Z" },
      { qr_id: 12, foreground_color: "#000000" },
      "{pas du json",
    ]) expect((await appel(styler, c)).status, JSON.stringify(c)).toBe(400)
    expect((await appel(styler, { qr_id: "q1", style_config: { logoUrl: "data:image/png;base64," + "A".repeat(3_100_000) } })).status).toBe(413)
    expect((await appel(styler, { qr_id: "q1", style_config: "pas un objet" })).status).toBe(413)
    expect(JSON.stringify(banc.base.qr_codes)).toBe(avant)
  })

  it("un logo de 2 Mo (la limite de l'écran) passe", async () => {
    const logo = "data:image/png;base64," + "A".repeat(Math.ceil(2 * 1024 * 1024 * 4 / 3))
    expect((await appel(styler, { qr_id: "q1", style_config: { logoUrl: logo } })).status).toBe(200)
  })

  it("le QR d'un autre compte : introuvable, intact ; sans session : 401", async () => {
    expect((await appel(styler, { qr_id: "a1", foreground_color: "#FF0000" })).status).toBe(404)
    expect(qr("a1").foreground_color).toBe("#080808")
    banc.session = null
    expect((await appel(styler, { qr_id: "q1", foreground_color: "#FF0000" })).status).toBe(401)
  })

  it("un style réservé : refusé au gratuit, permis en Établissement ; déjà porté, il se garde", async () => {
    const r = await appel(styler, { qr_id: "q1", style_config: { dotStyle: "neon" } })
    expect(r.status).toBe(403)
    expect((await r.json()).error).toContain("inclus dès la formule")
    expect((await appel(styler, { qr_id: "q1", error_correction: "H" })).status).toBe(403)
    expect(qr("q1").style_config).toEqual({ dotStyle: "square" })
    // Formule baissée : un QR qui portait déjà « neon » se réenregistre sans le perdre.
    qr("q2").style_config = { dotStyle: "neon" }
    expect((await appel(styler, { qr_id: "q2", foreground_color: "#111111", style_config: { dotStyle: "neon" } })).status).toBe(200)
    banc.base.profiles[0].plan = "pro"
    expect((await appel(styler, { qr_id: "q1", style_config: { dotStyle: "neon" } })).status).toBe(200)
  })

  it("une écriture qui ne touche aucune ligne n'est jamais un succès", async () => {
    banc.muet = true
    expect((await appel(styler, { qr_id: "q1", foreground_color: "#C9A227" })).status).toBe(404)
    expect((await appel(nommer, { qr_id: "q1", label: "Vitrine" })).status).toBe(404)
    expect((await appel(enregistrerDesign, { qr_id: "q1", design: { x: 1 } })).status).toBe(404)
  })

  it("« appliquer à tous mes QR » : les siens seulement", async () => {
    const j = await (await appel(styler, { all: true, foreground_color: "#123456" })).json()
    expect(j).toEqual({ ok: true, count: 2 })
    expect(qr("q1").foreground_color).toBe("#123456")
    expect(qr("a1").foreground_color).toBe("#080808")
  })
})

describe("en équipe : le membre règle le QR qu'il voit (défaut v409)", () => {
  it("il restyle le QR du propriétaire", async () => {
    membreDe(AUTRE)
    expect((await appel(styler, { qr_id: "a1", foreground_color: "#C9A227" })).status).toBe(200)
    expect(qr("a1").foreground_color).toBe("#C9A227")
  })

  it("la formule qui ouvre un style est celle du PROPRIÉTAIRE, pas la sienne", async () => {
    membreDe(AUTRE)
    banc.base.profiles[2].plan = "business"                        // le membre a la grande formule
    expect((await appel(styler, { qr_id: "a1", style_config: { dotStyle: "neon" } })).status).toBe(403)
    banc.base.profiles[2].plan = "free"; banc.base.profiles[1].plan = "pro"
    expect((await appel(styler, { qr_id: "a1", style_config: { dotStyle: "neon" } })).status).toBe(200)
  })

  it("il nomme les supports du propriétaire et enregistre leur design", async () => {
    membreDe(AUTRE)
    expect((await appel(nommer, { qr_id: "a1", label: "Vitrine" })).status).toBe(200)
    expect(qr("a1").label).toBe("Vitrine")
    expect((await appel(enregistrerDesign, { short_code: "Sa1", design: { fond: "noir" }, format: "flyer" })).status).toBe(200)
    expect(await (await lire("short_code=Sa1")).json()).toEqual({ design: { fond: "noir" }, format: "flyer" })
  })

  it("« appliquer à tous mes QR » ne touche pas ceux du propriétaire", async () => {
    membreDe(AUTRE)
    expect(await (await appel(styler, { all: true, foreground_color: "#123456" })).json()).toEqual({ ok: true, count: 0 })
    expect(qr("a1").foreground_color).toBe("#080808")
  })

  it("hors de l'équipe : rien, nulle part", async () => {
    banc.session = { id: MEMBRE }
    expect((await appel(styler, { qr_id: "a1", foreground_color: "#C9A227" })).status).toBe(404)
    expect((await appel(nommer, { qr_id: "a1", label: "Pirate" })).status).toBe(404)
    expect((await appel(enregistrerDesign, { qr_id: "a1", design: { x: 1 } })).status).toBe(404)
    expect(await (await lire("qr_id=a1")).json()).toEqual({ design: null, format: "a4" })
    expect(qr("a1")).toMatchObject({ foreground_color: "#080808", label: null, print_design: null })
  })
})

describe("le nom d'un support", () => {
  it("écrit et borné à 60 caractères ; vide = sans nom", async () => {
    expect(await (await appel(nommer, { qr_id: "q1", label: "  Table 4  " })).json()).toEqual({ ok: true, label: "Table 4" })
    await appel(nommer, { qr_id: "q2", label: "x".repeat(200) })
    expect(qr("q2").label.length).toBeLessThanOrEqual(60)
    await appel(nommer, { qr_id: "q1", label: "" })
    expect(qr("q1").label).toBeNull()
  })

  it("sans session : 401 ; sans QR : 400 ; QR d'un autre : 404", async () => {
    expect((await appel(nommer, { label: "x" })).status).toBe(400)
    expect((await appel(nommer, { qr_id: 12, label: "x" })).status).toBe(400)
    expect((await appel(nommer, { qr_id: "a1", label: "x" })).status).toBe(404)
    banc.session = null
    expect((await appel(nommer, { qr_id: "q1", label: "x" })).status).toBe(401)
  })
})

describe("le design d'impression", () => {
  it("enregistré, relu, par identifiant ou code court ; un format inconnu redevient A4 ; null efface", async () => {
    expect((await appel(enregistrerDesign, { qr_id: "q1", design: { titre: "Carte" }, format: "story" })).status).toBe(200)
    expect(await (await lire("qr_id=q1")).json()).toEqual({ design: { titre: "Carte" }, format: "story" })
    await appel(enregistrerDesign, { short_code: "Sq1", design: { titre: "Carte" }, format: "affiche-géante" })
    expect(qr("q1").print_format).toBe("a4")
    await appel(enregistrerDesign, { qr_id: "q1", design: null })
    expect(qr("q1").print_design).toBeNull()
  })

  it("trop lourd ou pas un objet : 413 ; sans cible : 400 ; corps illisible : 400 — rien n'est écrit", async () => {
    expect((await appel(enregistrerDesign, { qr_id: "q1", design: { t: "x".repeat(65_000) } })).status).toBe(413)
    expect((await appel(enregistrerDesign, { qr_id: "q1", design: "texte" })).status).toBe(413)
    expect((await appel(enregistrerDesign, { design: {} })).status).toBe(400)
    expect((await appel(enregistrerDesign, "{pas du json")).status).toBe(400)
    expect((await lire("")).status).toBe(400)
    expect(qr("q1").print_design).toBeNull()
  })

  it("sans session : 401, à l'écriture comme à la lecture", async () => {
    banc.session = null
    expect((await appel(enregistrerDesign, { qr_id: "q1", design: {} })).status).toBe(401)
    expect((await lire("qr_id=q1")).status).toBe(401)
  })
})
