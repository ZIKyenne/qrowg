import { describe, it, expect, vi } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({}) }))
// `cache` n'existe que dans le React embarqué par Next (serveur), pas dans React 18 des tests.
vi.mock("react", async (orig) => ({ ...(await orig<object>()), cache: <F>(f: F) => f }))
import { blocsAffiches } from "./lecturePublique"

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

// Un scan = une lecture en base (voir lecturePublique.ts). Les blocs arrivent
// avec la page ; le filtre et l'ordre que faisait la base se font ici.
describe("les blocs qu'un scan affiche", () => {
  it("seulement les visibles, dans l'ordre des positions", () => {
    const lus = [
      { id: "c", position: 2, is_visible: true },
      { id: "cache", position: 0, is_visible: false },
      { id: "a", position: 0, is_visible: true },
      { id: "b", position: 1, is_visible: true },
    ]
    expect(blocsAffiches(lus).map((b) => b.id)).toEqual(["a", "b", "c"])
  })

  it("deux positions égales gardent l'ordre lu", () => {
    const lus = [
      { id: "x", position: 1, is_visible: true },
      { id: "y", position: 1, is_visible: true },
    ]
    expect(blocsAffiches(lus).map((b) => b.id)).toEqual(["x", "y"])
  })

  it("une page sans blocs n'en affiche aucun", () => {
    expect(blocsAffiches(undefined)).toEqual([])
    expect(blocsAffiches(null)).toEqual([])
  })
})

describe("la page publique ne relit pas la base", () => {
  const page = lire("page.tsx")

  it("plus aucune requête directe : tout passe par lirePagePubliee", () => {
    expect(page).not.toMatch(/\.from\(\s*["']/)
    expect(page).not.toContain("createAdminClient")
    expect(page.match(/lirePagePubliee\(slug\)/g)?.length).toBe(2)
  })

  it("la lecture est mémoïsée pour la requête (métadonnées + page = une lecture)", () => {
    expect(lire("lecturePublique.ts")).toMatch(/export const lirePagePubliee = cache\(/)
  })

  it("les blocs bruts (masqués compris) ne partent pas au client", () => {
    expect(page).toMatch(/blocks: _tousLesBlocs, \.\.\.publicPage/)
  })
})
