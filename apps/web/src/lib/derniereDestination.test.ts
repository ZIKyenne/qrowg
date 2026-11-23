import { describe, it, expect, beforeEach } from "vitest"
import { retenirDestination, oublierDestination, destinationDeSecours, _viderLaMemoire, type Magasin } from "./derniereDestination"
import { sujetDeLAlerte, corpsDeLAlerte } from "./alerteRedirection"

// Vague 3 (revue du 23 nov.) : le secours d'un QR imprimé, et l'alerte de panne.

function faux(enPanne = false) {
  const m = new Map<string, string>(), ecritures: string[] = []
  const g = <T,>(f: () => T) => async () => { if (enPanne) throw new Error("upstash down"); return f() }
  const magasin: Magasin = {
    lire: async k => g(() => m.get(k) ?? null)(),
    ecrire: async (k, v) => g(() => { ecritures.push(k); m.set(k, v) })(),
    effacer: async k => g(() => { m.delete(k) })(),
  }
  return { magasin, m, ecritures }
}
beforeEach(() => _viderLaMemoire())

describe("retenir, retrouver, oublier", () => {
  it("une autre instance (mémoire vide) retrouve la destination par le magasin partagé", async () => {
    const f = faux()
    await retenirDestination("abc", "https://qrowg.com/chez-nenette?s=abc", f.magasin)
    _viderLaMemoire()
    expect(await destinationDeSecours("abc", f.magasin)).toBe("https://qrowg.com/chez-nenette?s=abc")
  })
  it("n'écrit qu'au changement : mille scans, une écriture", async () => {
    const f = faux()
    for (let i = 0; i < 1000; i++) await retenirDestination("abc", "https://x.fr/", f.magasin)
    expect(f.ecritures).toHaveLength(1)
  })
  it("refuse ce qui n'est pas une destination de QR", async () => {
    const f = faux()
    for (const d of ["javascript:alert(1)", "data:text/html,x", "ftp://x", ""]) await retenirDestination("abc", d, f.magasin)
    await retenirDestination("a b/../c", "https://x.fr/", f.magasin)
    expect(f.ecritures).toEqual([])
    expect(await destinationDeSecours("abc", f.magasin)).toBeNull()
  })
  it("tel: et mailto: sont des destinations", async () => {
    await retenirDestination("t1", "tel:+33326000000", null)
    expect(await destinationDeSecours("t1", null)).toBe("tel:+33326000000")
  })
  it("oublier efface partout", async () => {
    const f = faux()
    await retenirDestination("abc", "https://x.fr/", f.magasin)
    await oublierDestination("abc", f.magasin)
    expect(await destinationDeSecours("abc", f.magasin)).toBeNull()
  })
  it("magasin partagé en panne : la mémoire suffit, et rien ne jette", async () => {
    const f = faux(true)
    await expect(retenirDestination("abc", "https://x.fr/", f.magasin)).resolves.toBeUndefined()
    expect(await destinationDeSecours("abc", f.magasin)).toBe("https://x.fr/")
    _viderLaMemoire()
    expect(await destinationDeSecours("abc", f.magasin)).toBeNull()
  })
})

describe("l'alerte dit ce qui s'est passé", () => {
  it("avec ou sans secours, et elle échappe ce qu'elle cite", () => {
    expect(sujetDeLAlerte({ code: "abc", cause: "x", secours: true })).toContain("destination de secours")
    expect(sujetDeLAlerte({ code: "abc", cause: "x", secours: false })).toContain("Indisponible")
    const html = corpsDeLAlerte({ code: "<b>abc</b>", cause: "fetch failed <script>", secours: false }, new Date("2026-11-24T10:00:00Z"))
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;b&gt;abc&lt;/b&gt;")
  })
})
