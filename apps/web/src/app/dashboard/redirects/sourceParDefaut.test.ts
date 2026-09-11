import { describe, it, expect } from "vitest"
import { sourceParDefaut, SOUS_DOMAINE_QROWG } from "./sourceParDefaut"

describe("le champ Source ne propose jamais une valeur absente du menu", () => {
  it("aucun domaine connecté : le repli est le sous-domaine QRowg, pas la chaîne vide", () => {
    expect(sourceParDefaut([])).toBe(SOUS_DOMAINE_QROWG)
    expect(sourceParDefaut([])).not.toBe("")
  })
  it("un domaine connecté : c'est lui qui est proposé", () => {
    expect(sourceParDefaut(["carte.bistrot-horizon.fr", "avis.bistrot-horizon.fr"])).toBe("carte.bistrot-horizon.fr")
  })
  it("une entrée vide ou blanche ne compte pas pour un domaine", () => {
    expect(sourceParDefaut([""])).toBe(SOUS_DOMAINE_QROWG)
    expect(sourceParDefaut(["   ", "vrai.fr"])).toBe("vrai.fr")
  })
})
