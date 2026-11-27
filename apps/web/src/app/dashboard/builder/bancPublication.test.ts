import { describe, it, expect, vi, beforeEach } from "vitest"

// Publier une page — la VRAIE action serveur `publishPage`, jouée contre une
// fausse base qui applique la RLS des pages (v403) :
//  - lecture : ses pages, celles des propriétaires dont on est membre, et TOUTE
//    page publiée (policy « Lecture pages publiées ») ;
//  - écriture : ses pages et celles de son équipe ;
//  - le déclencheur garde_essai_publication : un compte gratuit dont l'essai est
//    fini ne remet pas une page en ligne (« ESSAI_TERMINE », code 23514).
// Avant, publish.test jouait la fonction pure contre un client qui ne savait pas
// dire « zéro ligne écrite ».
//
// En le jouant (v403) :
//  - publier une page publiée d'un AUTRE compte (lisible par tous) répondait
//    « Publié » et revalidait son cache, sans rien écrire ;
//  - la fin de l'essai gratuit s'affichait « format invalide ».

const banc = vi.hoisted(() => ({
  session: null as null | { id: string },
  base: {} as Record<string, Record<string, any>[]>,
  equipes: {} as Record<string, string[]>,
  revalidees: [] as string[],
  revalidationEnPanne: false,
  panne: null as null | { code: string; message: string },
  lectures: 0,
}))

vi.mock("next/cache", () => ({
  revalidatePath: (p: string) => { if (banc.revalidationEnPanne) throw new Error("cache"); banc.revalidees.push(p) },
}))

const JOUR = 86_400_000
function requete(table: string, moi: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "update" = "select", patch: Record<string, any> = {}, retour = false
  const t = () => (banc.base[table] ??= [])
  const membre = (u: string) => u === moi || (banc.equipes[moi] ?? []).includes(u)
  const lisible = (l: Record<string, any>) => membre(l.user_id) || l.status === "published"
  const executer = () => {
    if (op === "update") {
      if (banc.panne) return { data: null, error: banc.panne }
      const ls = t().filter(l => membre(l.user_id) && filtres.every(f => f(l)))
      for (const l of ls) {
        // garde_essai_publication : seulement le PASSAGE à l'état publié.
        if (patch.status === "published" && l.status !== "published") {
          const prof = banc.base.profiles.find(p => p.id === l.user_id)!
          const depuis = prof.free_published_since ? Date.parse(prof.free_published_since) : null
          if ((prof.plan ?? "free") === "free" && depuis !== null && Date.now() >= depuis + 30 * JOUR)
            return { data: null, error: { code: "23514", message: "ESSAI_TERMINE: les 30 jours du plan gratuit sont écoulés ; un plan est nécessaire pour publier" } }
        }
      }
      ls.forEach(l => Object.assign(l, patch))
      return { data: retour ? ls.map(l => ({ id: l.id })) : null, error: null }
    }
    banc.lectures++
    const ls = t().filter(l => lisible(l) && filtres.every(f => f(l)))
    return { data: ls.map(l => ({ ...l })), error: null }
  }
  const q: any = {
    select() { if (op === "update") retour = true; return q },
    update(p: Record<string, any>) { op = "update"; patch = p; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    single: async () => {
      const r = executer()
      return r.data?.length ? { data: r.data[0], error: null } : { data: null, error: r.error ?? { code: "PGRST116", message: "0 rows" } }
    },
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: banc.session } }) },
    from: (t: string) => requete(t, banc.session?.id ?? "anon"),
  }),
}))

import { publishPage } from "./publishActions"
import { ESSAI_TERMINE_MSG } from "./publish"

const UU = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`
const MOI = "u_moi", AUTRE = "u_autre"
const page = (n: number) => banc.base.pages.find(p => p.id === UU(n))!

beforeEach(() => {
  banc.session = { id: MOI }
  banc.equipes = {}
  banc.revalidees = []
  banc.revalidationEnPanne = false
  banc.panne = null
  banc.lectures = 0
  banc.base = {
    profiles: [{ id: MOI, plan: "starter", free_published_since: null }, { id: AUTRE, plan: "starter", free_published_since: null }],
    pages: [
      { id: UU(1), user_id: MOI, slug: "le-comptoir", status: "draft", published_at: null },
      { id: UU(2), user_id: MOI, slug: "la-terrasse", status: "published", published_at: "2026-01-01T00:00:00.000Z" },
      { id: UU(3), user_id: AUTRE, slug: "chez-autre", status: "draft", published_at: null },
      { id: UU(4), user_id: AUTRE, slug: "chez-autre-en-ligne", status: "published", published_at: "2026-02-02T00:00:00.000Z" },
    ],
  }
})

describe("publier sa page", () => {
  it("un brouillon passe en ligne, daté de maintenant, et son cache est revalidé", async () => {
    const avant = Date.now()
    const r = await publishPage(UU(1))
    expect(r).toMatchObject({ ok: true, alreadyPublished: false })
    expect(page(1).status).toBe("published")
    expect(Date.parse(page(1).published_at)).toBeGreaterThanOrEqual(avant)
    expect(r.publishedAt).toBe(page(1).published_at)
    expect(banc.revalidees).toEqual(["/le-comptoir"])
  })

  it("republier garde la date de première mise en ligne", async () => {
    const r = await publishPage(UU(2))
    expect(r).toEqual({ ok: true, publishedAt: "2026-01-01T00:00:00.000Z", alreadyPublished: true })
    expect(page(2).published_at).toBe("2026-01-01T00:00:00.000Z")
    expect(banc.revalidees).toEqual(["/la-terrasse"])
  })

  it("un cache qui refuse la revalidation n'annule pas une publication faite", async () => {
    banc.revalidationEnPanne = true
    expect((await publishPage(UU(1))).ok).toBe(true)
    expect(page(1).status).toBe("published")
  })

  it("membre de l'équipe : il publie la page du propriétaire", async () => {
    banc.equipes = { [MOI]: [AUTRE] }
    expect((await publishPage(UU(3))).ok).toBe(true)
    expect(page(3).status).toBe("published")
    expect(banc.revalidees).toEqual(["/chez-autre"])
  })
})

describe("ce qui ne doit jamais dire « Publié »", () => {
  it("identifiant invalide ou session absente : refus, sans même lire la base", async () => {
    for (const id of ["", "abc", "../admin", `${UU(1)}x`]) expect((await publishPage(id)).ok).toBe(false)
    banc.session = null
    const r = await publishPage(UU(1))
    expect(r).toEqual({ ok: false, message: "Vous devez être connecté pour publier." })
    expect(banc.lectures).toBe(0)
    expect(page(1).status).toBe("draft")
  })

  it("le brouillon d'un autre compte : introuvable, intact", async () => {
    const r = await publishPage(UU(3))
    expect(r.ok).toBe(false)
    expect(page(3).status).toBe("draft")
    expect(banc.revalidees).toEqual([])
  })

  it("la page EN LIGNE d'un autre compte, lisible par tous : refus, rien d'écrit, rien de revalidé", async () => {
    const r = await publishPage(UU(4))
    expect(r).toEqual({ ok: false, message: "Vous n'avez plus accès à cette page." })
    expect(page(4).published_at).toBe("2026-02-02T00:00:00.000Z")
    expect(banc.revalidees).toEqual([])
  })

  it("essai gratuit terminé : la phrase le dit, et la page reste hors ligne", async () => {
    banc.base.profiles[0] = { id: MOI, plan: "free", free_published_since: new Date(Date.now() - 31 * JOUR).toISOString() }
    const r = await publishPage(UU(1))
    expect(r).toEqual({ ok: false, message: ESSAI_TERMINE_MSG })
    expect(r.message).toContain("30 jours")
    expect(r.message).not.toMatch(/format|ESSAI_TERMINE/)
    expect(page(1).status).toBe("draft")
    expect(banc.revalidees).toEqual([])
  })

  it("essai gratuit terminé : une page déjà en ligne se met encore à jour", async () => {
    banc.base.profiles[0] = { id: MOI, plan: "free", free_published_since: new Date(Date.now() - 31 * JOUR).toISOString() }
    expect((await publishPage(UU(2))).ok).toBe(true)
  })

  it("une panne de base : refus, sans le texte de Postgres, rien de revalidé", async () => {
    banc.panne = { code: "XX000", message: 'relation "pages" détail interne' }
    const r = await publishPage(UU(1))
    expect(r.ok).toBe(false)
    expect(r.message).not.toMatch(/relation|pages|interne/)
    expect(page(1).status).toBe("draft")
    expect(banc.revalidees).toEqual([])
  })
})
