import { describe, it, expect, vi } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Client simulé : la lecture « dure » ce que dit `dureeSimulee` (horloge avancée).
let dureeSimulee = 0
vi.mock("@/lib/supabase/server", () => {
  const chaine: any = {
    from: () => chaine, select: () => chaine, eq: () => chaine,
    single: async () => { vi.setSystemTime(Date.now() + dureeSimulee); return { data: { id: "p" } } },
  }
  return { createAdminClient: () => chaine }
})
// `cache` n'existe que dans le React embarqué par Next (serveur), pas dans React 18 des tests.
vi.mock("react", async (orig) => ({ ...(await orig<object>()), cache: <F>(f: F) => f }))
import { blocsAffiches, ADRESSE_DE_REVEIL, lirePagePubliee, SEUIL_LECTURE_LENTE_MS } from "./lecturePublique"
import { estUnePagePubliee } from "@/middleware"

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

// La sonde de réveil (mesuré le 21 nov. : une route /api ne réveille pas la
// fonction des pages ; une adresse de page, si).
describe("l'adresse de réveil", () => {
  const page = lire("page.tsx")

  it("aucun commerçant ne peut la prendre (contrainte slug_format)", () => {
    expect(/^[a-z0-9_-]{2,60}$/.test(ADRESSE_DE_REVEIL)).toBe(false)
  })

  it("le middleware la traite comme une page publiée : même fonction, même nonce", () => {
    expect(estUnePagePubliee(`/${ADRESSE_DE_REVEIL}`)).toBe(true)
  })

  it("répond avant toute lecture en base, et jamais aux moteurs", () => {
    const meta = page.slice(page.indexOf("export async function generateMetadata"), page.indexOf("export default"))
    const rendu = page.slice(page.indexOf("export default"))
    for (const bloc of [meta, rendu]) {
      expect(bloc.indexOf("estLAdresseDeReveil(slug)")).toBeGreaterThan(-1)
      expect(bloc.indexOf("estLAdresseDeReveil(slug)")).toBeLessThan(bloc.indexOf("lirePagePubliee(slug)"))
    }
    expect(meta).toMatch(/estLAdresseDeReveil\(slug\)\) return \{ title: "OK", robots: \{ index: false/)
  })
})

describe("une lecture lente se signale, une lecture normale se tait", () => {
  it.each([
    [SEUIL_LECTURE_LENTE_MS + 900, 1],
    [SEUIL_LECTURE_LENTE_MS - 100, 0],
  ])("lecture de %i ms → %i avertissement", async (duree, attendus) => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    dureeSimulee = duree
    await lirePagePubliee("une-page")
    expect(warn).toHaveBeenCalledTimes(attendus)
    if (attendus) expect(String(warn.mock.calls[0][0])).toContain(`${duree} ms`)
    warn.mockRestore()
    vi.useRealTimers()
  })
})
