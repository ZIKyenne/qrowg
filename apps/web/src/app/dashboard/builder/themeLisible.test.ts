import { describe, it, expect } from "vitest"
import { problemesDeTheme, phraseProbleme } from "./themeLisible"
import { STUDIO_THEMES } from "./templatesStudio"

describe("le thème du client est vérifié, pas corrigé en douce", () => {
  it("un thème qui tient ne déclenche rien", () => {
    expect(problemesDeTheme(STUDIO_THEMES.menthe)).toEqual([])
    expect(problemesDeTheme({ bg: "#FFFFFF", text: "#111111", muted: "#555555", primary: "#0B5FFF" })).toEqual([])
  })
  it("un texte trop pâle sur fond clair est signalé, avec son rapport", () => {
    const p = problemesDeTheme({ bg: "#FFFFFF", text: "#CFCFCF", muted: "#333333", primary: "#0B5FFF" })
    expect(p).toHaveLength(1)
    expect(p[0].champ).toBe("text")
    expect(p[0].rapport).toBeLessThan(4.5)
    expect(phraseProbleme(p[0])).toContain("se lit mal sur le fond")
    expect(phraseProbleme(p[0])).toContain("il en faut 4,5")
  })
  it("un accent qui ne porte aucune encre est signalé à part", () => {
    // Un rose vif : le noir y donne 4,45 et le blanc 4,45 — aucune encre ne passe.
    // Seule la couleur peut changer, et c'est au client de décider.
    const p = problemesDeTheme({ bg: "#FFFFFF", text: "#111111", muted: "#444444", primary: "#EE0044" })
    expect(p.some(x => x.texte.includes("le texte des boutons"))).toBe(true)
  })
  it("chaque couleur fautive est nommée par son rôle, pas par sa clé technique", () => {
    const p = problemesDeTheme({ bg: "#0A0A0A", text: "#0F0F0F", muted: "#111111", primary: "#121212" })
    expect(p.map(x => x.texte)).toContain("la couleur du texte se lit mal sur le fond")
    expect(p.map(x => x.texte)).toContain("la couleur des textes secondaires se lit mal sur le fond")
  })
  it("un thème absent ou sans fond ne fait rien planter", () => {
    expect(problemesDeTheme(null)).toEqual([])
    expect(problemesDeTheme({ text: "#fff" })).toEqual([])
    expect(problemesDeTheme({ bg: "pas-une-couleur", text: "#fff" })).toEqual([])
  })
})
