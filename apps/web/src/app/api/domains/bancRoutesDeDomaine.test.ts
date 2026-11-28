import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Une page par sous-domaine — les VRAIES routes : la résolution publique d'un
// domaine (ce que voit le visiteur), la gestion des routes, et la suppression
// d'un domaine. Contre une fausse base qui applique la RLS (ses lignes), les
// contraintes de la production relevées le 28/11 — UNIQUE (root_domain,
// subdomain) et UNIQUE (from_domain, from_path) pour toute la base, NULL n'étant
// égal à rien — et la jointure pages(slug) (v412).
//
// En le jouant (v412) :
//  - changer la page de la RACINE ajoutait une route à chaque fois (l'upsert ne
//    voit jamais un NULL) : le visiteur tombait sur l'une ou l'autre ;
//  - la route « www » proposée à l'écran ne servait jamais (www retiré avant) ;
//  - un domaine en .co.uk, ou un sous-domaine vérifié pris comme racine, ne
//    servait aucune route (racine = deux dernières étiquettes) ;
//  - supprimer un domaine laissait ses routes et ses redirections, qui
//    bloquaient le prochain propriétaire vérifié ;
//  - corps illisible, page_id quelconque, priorité non numérique : 500 ;
//    supprimer une route inexistante répondait « ok ».

const banc = vi.hoisted(() => ({
  session: null as null | { id: string },
  base: {} as Record<string, Record<string, any>[]>,
  hebergeur: [] as string[],
}))

vi.mock("@/lib/appelQuiNAttendPas", () => ({
  fetchBorne: async (url: string, init: any) => { banc.hebergeur.push(`${init?.method ?? "GET"} ${url}`); return new Response("{}", { status: 200 }) },
}))

const UNIQUES: Record<string, string[]> = { domain_routes: ["root_domain", "subdomain"], domain_redirects: ["from_domain", "from_path"] }
let seq = 0
function requete(table: string, moi: string | null) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "insert" | "update" | "delete" = "select", charge: any = null, retour = false, colonnes = "", limite = Infinity
  const t = () => (banc.base[table] ??= [])
  // « Lecture pages publiées » : toute page en ligne est lisible par tout compte (leçon v403).
  const visible = (l: Record<string, any>) => moi === null ? true : table === "profiles" ? l.id === moi
    : table === "pages" ? l.user_id === moi || l.status === "published" : l.user_id === moi
  const garde = (l: Record<string, any>) => visible(l) && filtres.every(f => f(l))
  // Postgres : une contrainte UNIQUE ne compare pas les NULL.
  const doublon = (l: Record<string, any>, sauf?: Record<string, any>) => {
    const cles = UNIQUES[table]; if (!cles) return null
    return t().some(x => x !== sauf && cles.every(c => x[c] !== null && x[c] !== undefined && x[c] === l[c]))
      ? { code: "23505", message: `${table}_unique` } : null
  }
  const joindre = (l: Record<string, any>) => {
    const o = { ...l }
    if (colonnes.includes("pages(")) o.pages = (banc.base.pages ?? []).find(p => p.id === l.page_id) ?? null
    return o
  }
  const executer = () => {
    if (op === "insert") {
      if (moi !== null && charge.user_id !== moi) return { data: null, error: { code: "42501", message: "rls" } }
      const err = doublon(charge); if (err) return { data: null, error: err }
      const l = { id: `22222222-2222-4222-8222-${String(++seq).padStart(12, "0")}`, enabled: true, ...charge }; t().push(l)
      return { data: [joindre(l)], error: null }
    }
    if (op === "update") {
      const ls = t().filter(garde)
      for (const l of ls) { const err = doublon({ ...l, ...charge }, l); if (err) return { data: null, error: err } }
      ls.forEach(l => Object.assign(l, charge)); return { data: retour ? ls.map(joindre) : null, error: null }
    }
    if (op === "delete") {
      const ls = t().filter(garde); banc.base[table] = t().filter(l => !ls.includes(l))
      return { data: retour ? ls.map(l => ({ id: l.id })) : null, error: null }
    }
    return { data: t().filter(garde).slice(0, limite).map(joindre), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(c = "") { colonnes = c; if (op !== "select") retour = true; return q },
    insert(p: any) { op = "insert"; charge = p; return q },
    update(p: any) { op = "update"; charge = p; return q },
    delete() { op = "delete"; return q },
    // PostgREST : `eq.null` compare au texte « null », jamais à un NULL — seul `is` le voit.
    eq(c: string, v: unknown) { filtres.push(l => v !== null && l[c] === v); return q },
    in(c: string, v: unknown[]) { filtres.push(l => v.includes(l[c])); return q },
    is(c: string, v: unknown) { filtres.push(l => (l[c] ?? null) === v); return q },
    order() { return q },
    limit(n: number) { limite = n; return q },
    maybeSingle: une, single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: banc.session } }) },
    from: (t: string) => requete(t, banc.session?.id ?? "anon"),
  }),
  createAdminClient: () => ({ from: (t: string) => requete(t, null), rpc: async () => ({ data: null, error: null }) }),
}))

import { GET as resoudre } from "./resolve/route"
import { POST as poserRoute, DELETE as retirerRoute } from "./routes/route"
import { DELETE as supprimerDomaine } from "./route"

const MOI = "u_moi", AUTRE = "u_autre"
const visiter = async (hote: string, chemin = "/") => {
  const r = await resoudre(new NextRequest(`https://qrowg.com/api/domains/resolve?domain=${encodeURIComponent(hote)}&path=${encodeURIComponent(chemin)}`))
  return { statut: r.status, vers: r.headers.get("location") }
}
const json = (f: (r: NextRequest) => Promise<Response>, m: string, corps: unknown) =>
  f(new NextRequest("https://qrowg.com/api/domains/routes", { method: m, headers: { "content-type": "application/json" }, body: typeof corps === "string" ? corps : JSON.stringify(corps) }))
const route = (corps: unknown) => json(poserRoute, "POST", corps)
const P = (n: string) => `11111111-1111-4111-8111-11111111111${n}`
const verifie = (user_id: string, domain: string, extra: Record<string, any> = {}) =>
  banc.base.domain_verifications.push({ id: `v_${++seq}`, user_id, domain, verified: true, is_primary: false, page_id: null, ...extra })
const routesDe = (racine: string) => banc.base.domain_routes.filter(r => r.root_domain === racine)

beforeEach(() => {
  banc.session = { id: MOI }
  banc.hebergeur = []
  banc.base = {
    profiles: [{ id: MOI, plan: "pro" }, { id: AUTRE, plan: "business" }],
    pages: [
      { id: P("1"), user_id: MOI, slug: "accueil" }, { id: P("2"), user_id: MOI, slug: "la-carte" },
      { id: P("3"), user_id: MOI, slug: "reserver" }, { id: P("9"), user_id: AUTRE, slug: "chez-autre", status: "published" },
    ],
    domain_verifications: [], domain_routes: [], domain_redirects: [],
  }
  verifie(MOI, "exemple.fr")
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("ce que voit le visiteur d'un domaine", () => {
  it("un domaine que personne n'a vérifié n'est ni servi ni redirigé", async () => {
    expect((await visiter("inconnu.fr")).statut).toBe(404)
  })

  it("chaque sous-domaine routé ouvre sa page, la racine la sienne", async () => {
    await route({ root_domain: "exemple.fr", subdomain: null, page_id: P("1") })
    await route({ root_domain: "exemple.fr", subdomain: "menu", page_id: P("2") })
    expect((await visiter("exemple.fr")).vers).toBe("https://qrowg.com/accueil")
    expect((await visiter("menu.exemple.fr")).vers).toBe("https://qrowg.com/la-carte")
  })

  it("changer la page de la RACINE la change — une seule route, pas une de plus à chaque fois", async () => {
    await route({ root_domain: "exemple.fr", subdomain: null, page_id: P("1") })
    const r = await route({ root_domain: "exemple.fr", subdomain: "", page_id: P("2") })
    expect(r.status).toBe(200)
    expect(routesDe("exemple.fr")).toHaveLength(1)
    expect((await visiter("exemple.fr")).vers).toBe("https://qrowg.com/la-carte")
  })

  it("la route « www » sert www ; sans elle, www sert la racine", async () => {
    await route({ root_domain: "exemple.fr", subdomain: null, page_id: P("1") })
    expect((await visiter("www.exemple.fr")).vers).toBe("https://qrowg.com/accueil")
    await route({ root_domain: "exemple.fr", subdomain: "www", page_id: P("3") })
    expect((await visiter("www.exemple.fr")).vers).toBe("https://qrowg.com/reserver")
    expect((await visiter("exemple.fr")).vers).toBe("https://qrowg.com/accueil")
  })

  it("un domaine en .co.uk sert ses routes", async () => {
    verifie(MOI, "resto.co.uk")
    await route({ root_domain: "resto.co.uk", subdomain: null, page_id: P("1") })
    await route({ root_domain: "resto.co.uk", subdomain: "menu", page_id: P("2") })
    expect((await visiter("resto.co.uk")).vers).toBe("https://qrowg.com/accueil")
    expect((await visiter("menu.resto.co.uk")).vers).toBe("https://qrowg.com/la-carte")
  })

  it("le joker sert tout sous-domaine sans route à lui ; une route exacte passe devant", async () => {
    await route({ root_domain: "exemple.fr", subdomain: "*", page_id: P("3") })
    await route({ root_domain: "exemple.fr", subdomain: "menu", page_id: P("2") })
    expect((await visiter("promo.exemple.fr")).vers).toBe("https://qrowg.com/reserver")
    expect((await visiter("menu.exemple.fr")).vers).toBe("https://qrowg.com/la-carte")
    // Le joker vaut pour les sous-domaines, pas pour la racine elle-même.
    expect((await visiter("exemple.fr")).statut).toBe(404)
  })

  it("une route d'un autre compte sur la même racine n'est jamais servie", async () => {
    banc.base.domain_routes.push({ id: "r_x", user_id: AUTRE, root_domain: "exemple.fr", subdomain: "menu", page_id: P("9"), enabled: true, priority: 10 })
    expect((await visiter("menu.exemple.fr")).statut).toBe(404)
  })

  it("une route désactivée ne sert plus", async () => {
    await route({ root_domain: "exemple.fr", subdomain: "menu", page_id: P("2") })
    banc.base.domain_routes[0].enabled = false
    expect((await visiter("menu.exemple.fr")).statut).toBe(404)
  })

  it("sans route, la page rattachée au domaine ; un domaine secondaire renvoie au principal", async () => {
    banc.base.domain_verifications[0].page_id = P("1")
    expect((await visiter("exemple.fr")).vers).toBe("https://qrowg.com/accueil")
    verifie(MOI, "principal.fr", { is_primary: true })
    const r = await visiter("exemple.fr", "/menu")
    expect(r.statut).toBe(301)
    expect(r.vers).toBe("https://principal.fr/menu")
  })
})

describe("poser une route", () => {
  it("refuse sans session, sur un domaine non vérifié, vers la page d'un autre", async () => {
    banc.session = null
    expect((await route({ root_domain: "exemple.fr", page_id: P("1") })).status).toBe(401)
    banc.session = { id: MOI }
    expect((await route({ root_domain: "pas-a-moi.fr", page_id: P("1") })).status).toBe(403)
    verifie(MOI, "en-attente.fr", { verified: false })
    expect((await route({ root_domain: "en-attente.fr", page_id: P("1") })).status).toBe(403)
    expect((await route({ root_domain: "exemple.fr", page_id: P("9") })).status).toBe(404)
    expect(banc.base.domain_routes).toHaveLength(0)
  })

  it("un corps illisible, un page_id quelconque, un sous-domaine invalide : 400, rien d'écrit", async () => {
    expect((await route("{pas du json")).status).toBe(400)
    expect((await route({ root_domain: "exemple.fr", page_id: 42 })).status).toBe(400)
    for (const sub of ["mé nu", "a..b", "-menu", "x".repeat(64), 7]) {
      expect((await route({ root_domain: "exemple.fr", subdomain: sub, page_id: P("1") })).status).toBe(400)
    }
    expect(banc.base.domain_routes).toHaveLength(0)
  })

  it("normalise la saisie et borne la priorité", async () => {
    const r = await route({ root_domain: " Exemple.FR ", subdomain: " Menu ", page_id: P("2"), priority: "beaucoup" })
    expect(r.status).toBe(200)
    expect(banc.base.domain_routes[0]).toMatchObject({ root_domain: "exemple.fr", subdomain: "menu", priority: 10 })
    expect((await visiter("menu.exemple.fr")).vers).toBe("https://qrowg.com/la-carte")
  })

  it("une adresse déjà routée par un autre compte : 409 lisible, pas 500", async () => {
    banc.base.domain_routes.push({ id: "r_x", user_id: AUTRE, root_domain: "exemple.fr", subdomain: "menu", page_id: P("9"), enabled: true })
    const r = await route({ root_domain: "exemple.fr", subdomain: "menu", page_id: P("2") })
    expect(r.status).toBe(409)
  })
})

describe("retirer une route", () => {
  it("la sienne : partie ; celle d'un autre ou une inconnue : 404, rien ne bouge", async () => {
    await route({ root_domain: "exemple.fr", subdomain: "menu", page_id: P("2") })
    const autre = "33333333-3333-4333-8333-333333333333"
    banc.base.domain_routes.push({ id: autre, user_id: AUTRE, root_domain: "autre.fr", subdomain: null, page_id: P("9"), enabled: true })
    const mienne = banc.base.domain_routes[0].id
    expect((await json(retirerRoute, "DELETE", "{")).status).toBe(400)
    expect((await json(retirerRoute, "DELETE", { id: "1 or 1=1" })).status).toBe(400)
    expect((await json(retirerRoute, "DELETE", { id: autre })).status).toBe(404)
    expect((await json(retirerRoute, "DELETE", { id: P("6") })).status).toBe(404)
    expect(banc.base.domain_routes).toHaveLength(2)
    expect((await json(retirerRoute, "DELETE", { id: mienne })).status).toBe(200)
    expect(banc.base.domain_routes.map(r => r.id)).toEqual([autre])
    expect((await visiter("menu.exemple.fr")).statut).toBe(404)
  })
})

describe("supprimer un domaine", () => {
  it("emporte ses routes et ses redirections : le prochain propriétaire vérifié peut router", async () => {
    await route({ root_domain: "exemple.fr", subdomain: "menu", page_id: P("2") })
    banc.base.domain_redirects.push({ id: "d_1", user_id: MOI, from_domain: "exemple.fr", from_path: "/", to_url: "https://principal.fr" })
    banc.base.domain_redirects.push({ id: "d_2", user_id: MOI, from_domain: "garde.fr", from_path: "/", to_url: "https://principal.fr" })
    const id = banc.base.domain_verifications[0].id
    const r = await supprimerDomaine(new NextRequest("https://qrowg.com/api/domains", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }))
    expect(r.status).toBe(200)
    expect(banc.base.domain_routes).toHaveLength(0)
    expect(banc.base.domain_redirects.map(d => d.id)).toEqual(["d_2"])

    banc.session = { id: AUTRE }
    verifie(AUTRE, "exemple.fr")
    expect((await route({ root_domain: "exemple.fr", subdomain: "menu", page_id: P("9") })).status).toBe(200)
    expect((await visiter("menu.exemple.fr")).vers).toBe("https://qrowg.com/chez-autre")
  })
})
