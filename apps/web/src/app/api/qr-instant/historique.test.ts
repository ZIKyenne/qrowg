import { describe, it, expect, vi, beforeEach } from "vitest"

// QR-010 : le PATCH d'un lien dynamique, joué contre un faux client Supabase,
// dans les deux états de la base — migration appliquée ou pas encore.

type Appel = { table: string; cols?: string; patch?: Record<string, any> }
const etat = { colonne: true, historique: [] as any[], appels: [] as Appel[] }

const ABSENTE = { code: "42703", message: "column instant_qrs.dest_history does not exist" }

function requete(table: string) {
  const a: Appel = { table }
  etat.appels.push(a)
  const resultat = () => {
    const veutHistorique = (a.cols || "").includes("dest_history") || (a.patch && "dest_history" in a.patch)
    if (veutHistorique && !etat.colonne) return { data: null, error: ABSENTE }
    if (a.cols === "dest_history") return { data: { dest_history: etat.historique }, error: null }
    if (a.patch) return { data: { id: "q1", dest_url: a.patch.dest_url, ...(etat.colonne ? { dest_history: a.patch.dest_history ?? etat.historique } : {}) }, error: null }
    return { data: { id: "q1", dynamic: true, expires_at: null, status: "active", dest_url: "https://ancien.fr/" }, error: null }
  }
  const q: any = {
    select(c: string) { a.cols = c; return q },
    update(p: Record<string, any>) { a.patch = p; return q },
    eq() { return q },
    maybeSingle: async () => resultat(),
    single: async () => resultat(),
  }
  return q
}

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: (t: string) => requete(t),
  }),
}))

const patch = async (body: Record<string, unknown>) => {
  const { PATCH } = await import("./route")
  const req = new Request("http://x/api/qr-instant", { method: "PATCH", body: JSON.stringify({ id: "q1", ...body }) })
  return PATCH(req as any)
}

beforeEach(() => { etat.colonne = true; etat.historique = []; etat.appels = [] })

describe("changer la destination d'un QR de lien garde l'ancienne (QR-010)", () => {
  it("migration appliquée : l'ancienne adresse entre dans l'historique", async () => {
    etat.historique = [{ url: "https://plus-ancien.fr/", remplaceeLe: "2026-10-01T00:00:00.000Z" }]
    const res = await patch({ dest: "https://nouveau.fr" })
    expect(res.status).toBe(200)
    const ecrit = etat.appels.find(a => a.patch)!.patch!
    expect(ecrit.dest_url).toBe("https://nouveau.fr/")
    expect(ecrit.dest_history.map((e: any) => e.url)).toEqual(["https://ancien.fr/", "https://plus-ancien.fr/"])
    const corps = await res.json()
    expect(corps.item.dest_history[0].url).toBe("https://ancien.fr/")
  })

  it("migration PAS appliquée : la destination change quand même, sans historique", async () => {
    etat.colonne = false
    const res = await patch({ dest: "https://nouveau.fr" })
    expect(res.status).toBe(200)
    const ecritures = etat.appels.filter(a => a.patch)
    expect(ecritures.every(a => !("dest_history" in a.patch!))).toBe(true)
    expect((await res.json()).item.dest_url).toBe("https://nouveau.fr/")
  })

  it("renommer seulement n'écrit pas d'historique", async () => {
    await patch({ label: "Carte du soir" })
    const ecrit = etat.appels.find(a => a.patch)!.patch!
    expect(ecrit).not.toHaveProperty("dest_history")
  })

  it("remettre la même adresse n'écrit pas d'historique", async () => {
    await patch({ dest: "https://ancien.fr/" })
    expect(etat.appels.find(a => a.patch)!.patch).not.toHaveProperty("dest_history")
  })
})
