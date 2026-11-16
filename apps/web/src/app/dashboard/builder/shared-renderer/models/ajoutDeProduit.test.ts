import { describe, it, expect } from "vitest"
import { avecProduit, ligneAuFormat, champPropre } from "./ajoutDeProduit"
import { parseMenuPaste } from "../../menuImport"
import { menuSectionViewModel } from "./menuSection"
import { menuTabsViewModel } from "./menuTabs"

// Critère : après l'ajout, RELIRE la carte redonne les produits d'avant, intacts
// et dans le même ordre, plus le nouveau à la fin.
function relu(texte: string, nouveau: { nom: string; prix: string; desc: string }) {
  const avant = parseMenuPaste(texte)
  const r = avecProduit("menu_tabs", { sec1_items: texte }, 1, nouveau)
  expect(r.ok).toBe(true)
  const apres = parseMenuPaste((r as any).content.sec1_items)
  expect(apres.slice(0, avant.length)).toEqual(avant)
  return apres[apres.length - 1]
}

describe("ajouter à une grande carte, dans le format du texte", () => {
  it("point-virgule (Red Fish) ; un « ; » tapé dans la description ne crée pas de colonne", () => {
    const t = "MOJITO;10€;Havana club 3 ans, menthe\nPINA COLADA;10€;Saint James Bio"
    expect(relu(t, { nom: "VIRGIN MOJITO", prix: "7€", desc: "Menthe; citron vert, sucre" }))
      .toMatchObject({ name: "VIRGIN MOJITO", price: "7€", desc: "Menthe, citron vert, sucre" })
  })
  it("onglet vide (section Mocktail à remplir)", () => {
    const r = avecProduit("menu_tabs", { sec2_title: "Mocktail", sec2_items: "" }, 2, { nom: "Virgin Colada", prix: "7€", desc: "" })
    expect((r as any).content.sec2_items).toBe("Virgin Colada;7€")
    expect(menuTabsViewModel((r as any).content).sections[0].items[0]).toMatchObject({ name: "Virgin Colada", price: "7€" })
  })
  it("tabulation, virgule (« 12,50 » → « 12.50 »), tableau markdown, une colonne", () => {
    expect(relu("Mojito\t10€\tMenthe", { nom: "Spritz", prix: "8€", desc: "Apérol" })).toMatchObject({ name: "Spritz", price: "8€", desc: "Apérol" })
    expect(relu("Mojito,10,Menthe", { nom: "Spritz", prix: "12,50", desc: "Apérol, prosecco" })).toMatchObject({ name: "Spritz", price: "12.50", desc: "Apérol - prosecco" })
    expect(relu("| Nom | Prix |\n| --- | --- |\n| Mojito | 10€ |", { nom: "Spritz", prix: "8€", desc: "" })).toMatchObject({ name: "Spritz", price: "8€" })
    expect(relu("Mojito 10€\nSpritz 8€", { nom: "Negroni", prix: "11€", desc: "Gin, Campari" })).toMatchObject({ name: "Negroni", price: "11€" })
  })
  it("fins de ligne Windows gardées, pas de ligne vide parasite", () => {
    const r = avecProduit("menu_tabs", { sec1_items: "Mojito;10€\r\nSpritz;8€\r\n" }, 1, { nom: "Negroni", prix: "11€", desc: "" })
    expect((r as any).content.sec1_items).toBe("Mojito;10€\r\nSpritz;8€\r\nNegroni;11€")
  })
})

describe("ajouter à un menu simple", () => {
  it("la ligne suivante, même si une ligne du milieu a été vidée", () => {
    const c = { item1_name: "Mojito", item1_price: "10€", item2_name: "", item2_price: "", item3_name: "Spritz", item3_price: "8€" }
    const r = avecProduit("menu_section", c, null, { nom: "Negroni", prix: "11€", desc: "Gin" })
    expect((r as any).content.item4_name).toBe("Negroni")
    expect(menuSectionViewModel((r as any).content).items.map(i => i.name)).toEqual(["Mojito", "Spritz", "Negroni"])
  })
})

describe("refus", () => {
  it("doublon exact (même nom, même description) — mais un homonyme décrit autrement passe", () => {
    const t = { sec1_items: "CHAMPAGNE JOSEPH PERRIER;50€;Brut 75CL" }
    expect(avecProduit("menu_tabs", t, 1, { nom: "champagne joseph perrier", prix: "55€", desc: "Brut 75CL" })).toMatchObject({ ok: false, raison: "doublon" })
    expect(avecProduit("menu_tabs", t, 1, { nom: "CHAMPAGNE JOSEPH PERRIER", prix: "110€", desc: "Magnum Brut 150CL" }).ok).toBe(true)
  })
  it("nom vide, prix sans chiffre, rubrique inconnue, onglet plein", () => {
    expect(avecProduit("menu_tabs", {}, 1, { nom: "  ", prix: "", desc: "" })).toMatchObject({ raison: "nom_vide" })
    expect(avecProduit("menu_tabs", {}, 1, { nom: "X", prix: "gratuit", desc: "" })).toMatchObject({ raison: "prix" })
    expect(avecProduit("menu_tabs", {}, null, { nom: "X", prix: "1€", desc: "" })).toMatchObject({ raison: "rubrique" })
    const plein = Array.from({ length: 50 }, (_, i) => `P${i};1€`).join("\n")
    expect(avecProduit("menu_tabs", { sec1_items: plein }, 1, { nom: "Un de trop", prix: "1€", desc: "" })).toMatchObject({ raison: "plein" })
  })
  it("les champs sont nettoyés (retours à la ligne, espaces)", () => {
    expect(champPropre("  Virgin \n  Mojito\t")).toBe("Virgin Mojito")
    expect(ligneAuFormat("", { nom: "A", prix: "", desc: "" })).toBe("A")
  })
})
