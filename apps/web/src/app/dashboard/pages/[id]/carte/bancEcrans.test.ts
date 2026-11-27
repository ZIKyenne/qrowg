import { describe, it, expect, vi, beforeEach } from "vitest"

// Les écrans « Ma carte » et « Coller ma carte », et `tientLaPage` (lib/team),
// joués contre une fausse base qui applique la RLS des pages (v405) : toute page
// publiée est lisible par tout compte connecté, ses blocs non. Avant, ouvrir
// l'adresse « Ma carte » de la page en ligne d'un autre montrait une carte vide
// au lieu de « introuvable ».

const banc = vi.hoisted(() => ({
  session: null as null | { id: string },
  base: {} as Record<string, Record<string, any>[]>,
}))

function requete(table: string, moi: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let colonnes = "*"
  const proprios = () => new Set([moi, ...(banc.base.team_members ?? []).filter(m => m.user_id === moi)
    .map(m => (banc.base.teams ?? []).find(x => x.id === m.team_id)?.owner_id).filter(Boolean)])
  const lisible = (l: Record<string, any>) =>
    table === "team_members" ? l.user_id === moi
    : table === "pages" ? proprios().has(l.user_id) || l.status === "published"
    : table === "blocks" ? proprios().has((banc.base.pages ?? []).find(p => p.id === l.page_id)?.user_id)
    : false
  const executer = () => {
    const ls = (banc.base[table] ?? []).filter(l => lisible(l) && filtres.every(f => f(l)))
    return { data: ls.map(l => colonnes.includes("teams(") ? { ...l, teams: (banc.base.teams ?? []).find(x => x.id === l.team_id) ?? null } : { ...l }), error: null }
  }
  const q: any = {
    select(c?: string) { colonnes = c ?? "*"; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    in(c: string, vs: unknown[]) { filtres.push(l => vs.includes(l[c])); return q },
    order() { return q },
    maybeSingle: async () => { const r = executer(); return { ...r, data: r.data[0] ?? null } },
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
const client = () => ({
  auth: { getUser: async () => ({ data: { user: banc.session } }) },
  from: (t: string) => requete(t, banc.session?.id ?? "anon"),
})

vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: async () => client() }))
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NOT_FOUND") },
  redirect: (u: string) => { throw new Error("REDIRECT " + u) },
}))
vi.mock("./CarteClient", () => ({ default: () => null }))
vi.mock("./coller/ColleClient", () => ({ default: () => null }))

import MaCartePage from "./page"
import CollerMaCartePage from "./coller/page"
import { tientLaPage } from "@/lib/team"

const UU = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`
const MOI = "u_moi", AUTRE = "u_autre", MEMBRE = "u_membre"
const params = (id: string) => ({ params: Promise.resolve({ id }) })
const ECRANS = [["Ma carte", MaCartePage], ["Coller ma carte", CollerMaCartePage]] as const

beforeEach(() => {
  banc.session = { id: MOI }
  banc.base = {
    teams: [{ id: "t1", owner_id: AUTRE }], team_members: [],
    pages: [
      { id: UU(1), user_id: MOI, title: "Red Fish", slug: "red-fish", status: "published" },
      { id: UU(2), user_id: AUTRE, title: "Chez Autre", slug: "chez-autre", status: "published" },
    ],
    blocks: [{ id: "b2", page_id: UU(2), type: "menu_section", position: 0, is_visible: true, content: { item1_name: "Burger" } }],
  }
})

describe.each(ECRANS)("l'écran « %s »", (_nom, Ecran) => {
  it("ouvre sa page", async () => {
    const el: any = await Ecran(params(UU(1)))
    expect(el.props.page).toMatchObject({ id: UU(1), slug: "red-fish" })
  })

  it("la page en ligne d'un autre compte : introuvable, pas une carte vide", async () => {
    await expect(Ecran(params(UU(2)))).rejects.toThrow("NOT_FOUND")
  })

  it("membre de l'équipe du propriétaire : il l'ouvre", async () => {
    banc.session = { id: MEMBRE }
    banc.base.team_members = [{ team_id: "t1", user_id: MEMBRE, role: "editor" }]
    const el: any = await Ecran(params(UU(2)))
    expect(el.props.page).toMatchObject({ id: UU(2) })
  })

  it("sans session : vers la connexion", async () => {
    banc.session = null
    await expect(Ecran(params(UU(1)))).rejects.toThrow("REDIRECT /auth/login")
  })
})

describe("tientLaPage", () => {
  it("sa page, oui ; celle d'un autre, non — même lisible ; rien, non", async () => {
    const c = client() as any
    expect(await tientLaPage(c, MOI)).toBe(true)
    expect(await tientLaPage(c, AUTRE)).toBe(false)
    expect(await tientLaPage(c, null)).toBe(false)
    expect(await tientLaPage(c, undefined)).toBe(false)
  })
  it("en équipe : celle du propriétaire, oui", async () => {
    banc.session = { id: MEMBRE }
    banc.base.team_members = [{ team_id: "t1", user_id: MEMBRE, role: "editor" }]
    expect(await tientLaPage(client() as any, AUTRE)).toBe(true)
  })
  it("sans session : non", async () => {
    banc.session = null
    expect(await tientLaPage(client() as any, MOI)).toBe(false)
  })
})
