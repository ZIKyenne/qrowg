import { describe, it, expect } from "vitest"
import { avecLeNomSurLaPage } from "./nomSurLaPage"

const modele = [
  { type: "profile", content: { name: "The Alchemist", tagline: "Cocktails d'auteur · Paris" } },
  { type: "announcement", content: { title: "Happy hour" } },
  { type: "profile", content: { name: "Second profil" } },
]

describe("le nom saisi à la création s'affiche sur la page", () => {
  it("remplace le nom du PREMIER bloc d'identité, et rien d'autre", () => {
    const b = avecLeNomSurLaPage(modele, "  Le Comptoir ")
    expect(b[0].content).toEqual({ name: "Le Comptoir", tagline: "Cocktails d'auteur · Paris" })
    expect(b[1]).toBe(modele[1])
    expect(b[2]).toBe(modele[2])
    expect(modele[0].content.name).toBe("The Alchemist")   // l'original n'est pas touché
  })
  it("nom vide ou modèle sans bloc d'identité : la page reste telle quelle", () => {
    expect(avecLeNomSurLaPage(modele, "   ")).toEqual(modele)
    const sans = [{ type: "bio", content: { text: "x" } }]
    expect(avecLeNomSurLaPage(sans, "Le Comptoir")).toEqual(sans)
  })
})
