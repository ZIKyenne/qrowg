import { describe, it, expect } from "vitest"
import { buildLibraryItems, astuceAffichee, searchLibrary } from "./builderLibrary"

// Relevé du 21 nov. : 18 des 27 astuces de la bibliothèque répétaient la
// description de leur bloc — une ligne par carte, au téléphone, pour rien.
const items = buildLibraryItems()
const de = (type: string) => items.find(i => i.type === type)!

describe("l'astuce n'est affichée que si elle dit autre chose", () => {
  it("la répétition mot pour mot disparaît", () => {
    expect(de("product").useCases[0]).toBe(de("product").description)
    expect(astuceAffichee(de("product"))).toBeNull()
  })

  it("la quasi-répétition aussi", () => {
    // « Grande bannière d'ouverture premium » / « Grande bannière d'ouverture »
    expect(astuceAffichee(de("hero_banner"))).toBeNull()
    expect(astuceAffichee(de("spotify_embed"))).toBeNull()
  })

  it("une vraie astuce reste", () => {
    expect(astuceAffichee(de("profile"))).toBe("Idéal en premier bloc")
    expect(astuceAffichee(de("bio"))).not.toBeNull()
  })

  it("aucune astuce affichée ne répète sa description, dans tout le catalogue", () => {
    const affichees = items.map(i => [i, astuceAffichee(i)] as const).filter(([, a]) => a)
    expect(affichees.length).toBeGreaterThan(0)
    for (const [i, a] of affichees) expect(a!.toLowerCase(), i.type).not.toBe(i.description.toLowerCase())
    const masquees = items.filter(i => i.useCases[0] && !astuceAffichee(i)).length
    expect(masquees, "les répétitions relevées le 21 nov.").toBeGreaterThanOrEqual(15)
  })

  it("une astuce masquée sert toujours à la recherche", () => {
    // « onglets » n'est que dans l'astuce de tabs_block (description : « tabs »).
    expect(astuceAffichee(de("tabs_block"))).toBeNull()
    expect(searchLibrary(items, "onglets").map(i => i.type)).toContain("tabs_block")
  })
})
