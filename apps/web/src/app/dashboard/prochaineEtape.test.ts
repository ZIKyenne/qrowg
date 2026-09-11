import { describe, it, expect } from "vitest"
import { prochaineEtape, SEUIL_PAGE_LANCEE } from "./prochaineEtape"

// Le cas qui a déclenché ce module : une page publiée il y a trois jours, 3 scans.
describe("on ne fait pas créer une 2ᵉ page à qui n'a pas lancé la 1ʳᵉ", () => {
  it("une page publiée, presque aucun scan : diffuser, pas élargir", () => {
    expect(prochaineEtape({ pagesPubliees: 1, pages: 1, scans: 3 })).toBe("diffuser")
    expect(prochaineEtape({ pagesPubliees: 1, pages: 1, scans: 0 })).toBe("diffuser")
  })
  it("le seuil est explicite, et il se franchit", () => {
    expect(prochaineEtape({ pagesPubliees: 1, pages: 1, scans: SEUIL_PAGE_LANCEE - 1 })).toBe("diffuser")
    expect(prochaineEtape({ pagesPubliees: 1, pages: 1, scans: SEUIL_PAGE_LANCEE })).toBe("elargir")
  })
  it("plusieurs pages qui tournent : le levier suivant est le support imprimé", () => {
    expect(prochaineEtape({ pagesPubliees: 2, pages: 2, scans: 169 })).toBe("imprimer")
  })
  it("rien de publié : la checklist des premiers pas garde la main, jamais « diffuser »", () => {
    expect(prochaineEtape({ pagesPubliees: 0, pages: 1, scans: 0 })).toBe("elargir")
    expect(prochaineEtape({ pagesPubliees: 0, pages: 2, scans: 0 })).toBe("imprimer")
  })
})
