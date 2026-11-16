import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { exemplesRestants, phraseExemples } from "./valeursDExemple"
import { alertesPublication } from "./AlertesPublication"
import { PAGE_TEMPLATES } from "./page-templates"

// Audit du 14 novembre 2026 (D5/D6) : « Bistrot français » publiait ses plats et
// prix fictifs sans un mot ; le Coach de vie partait « en ligne » avec un bouton
// de rendez-vous sans lien.

const bistrot = PAGE_TEMPLATES.find(t => t.key === "resto_bistrot")!
const blocs = (t: typeof bistrot) => t.blocks.map((b, i) => ({ id: `b${i}`, visible: true, ...b })) as any[]

describe("valeurs d'exemple", () => {
  it("repère les plats et prix du modèle, champ par champ", () => {
    const entrees = bistrot.blocks.find(b => b.type === "menu_section")!
    const ex = exemplesRestants(entrees.content as any)
    expect(ex).toContainEqual({ champ: "item1_name", valeur: "Foie gras poêlé" })
    expect(ex).toContainEqual({ champ: "item1_price", valeur: "18€" })
  })
  it("une valeur remplacée n'est plus signalée ; un titre de section n'est jamais un fait", () => {
    expect(exemplesRestants({ item1_name: "Croque du chef", item1_price: "11 €", category: "🥗 Entrées" })).toEqual([])
    expect(exemplesRestants({ title: "Horaires", label: "Réserver une table" })).toEqual([])
  })
  it("la phrase cite deux valeurs et compte le reste", () => {
    expect(phraseExemples([{ champ: "a", valeur: "X" }, { champ: "b", valeur: "Y" }, { champ: "c", valeur: "Z" }]))
      .toBe("Valeurs d'exemple du modèle : « X », « Y » et 1 autre — remplacez-les par les vôtres")
    expect(phraseExemples([])).toBeNull()
  })
})

describe("avant de publier le modèle tel quel", () => {
  const a = alertesPublication(blocs(bistrot))
  it("les blocs de menu remontent leurs valeurs d'exemple, masquables", () => {
    const menu = a.filter(x => x.texte.startsWith("Valeurs d'exemple") && x.bloc !== "Profil")
    expect(menu.length).toBeGreaterThanOrEqual(2)
    expect(menu.every(x => x.masquable)).toBe(true)
  })
  it("le nom fictif du profil est signalé, mais le profil ne se masque pas", () => {
    const profil = a.find(x => x.texte.includes("Le Bistrot Parisien"))
    expect(profil).toBeTruthy()
    expect(profil!.masquable).toBe(false)
  })
  it("l'action principale sans lien vient en tête", () => {
    expect(a[0].principale).toBe(true)
    // Le premier bloc d'action du modèle (ici « Appeler », ajouté par avecMoyenDeJoindre).
    expect(a[0].texte).toMatch(/^Action principale « [^»]+ » sans lien/)
  })
})

describe("l'éditeur donne le geste « Masquer »", () => {
  it("met le bloc en visible: false, explicitement (pas une bascule)", () => {
    const v4 = readFileSync(join(__dirname, "BuilderV4.tsx"), "utf8")
    expect(v4).toContain("onMasquer={id => setBlocks(p => p.map(b => b.id === id ? { ...b, visible: false } : b))}")
  })
})
