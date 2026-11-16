import { describe, it, expect } from "vitest"
import { lireUneCarte, prixDansLaLigne, allureDeTitre, contenuDeGrandeCarte, SECTIONS_MAX, PRODUITS_PAR_SECTION } from "./lectureDeCarte"
import { menuTabsViewModel } from "./menuTabs"

const resume = (t: string) => lireUneCarte(t).sections.map(s => [s.titre, s.produits.map(p => [p.nom, p.prix, p.desc])])

describe("une carte copiée d'un PDF (façon Red Fish)", () => {
  it("titres en majuscules, produit + prix, description à la ligne", () => {
    const t = [
      "LONG DRINK",
      "MOJITO 10€",
      "Havana club 3 ans, menthe, citron vert, sucre, Perrier",
      "PINA COLADA 10€",
      "Saint James Bio, jus d'ananas, purée de noix de coco",
      "",
      "SPRITZ",
      "APEROL SPRITZ 7,90€",
      "Apérol, prosecco, perrier",
      "B 52 6€",
      "CÔTE DE GASCOGNE UBY n°3 23.00€",
    ].join("\n")
    expect(resume(t)).toEqual([
      ["LONG DRINK", [
        ["MOJITO", "10€", "Havana club 3 ans, menthe, citron vert, sucre, Perrier"],
        ["PINA COLADA", "10€", "Saint James Bio, jus d'ananas, purée de noix de coco"],
      ]],
      ["SPRITZ", [
        ["APEROL SPRITZ", "7,90€", "Apérol, prosecco, perrier"],
        ["B 52", "6€", ""],
        ["CÔTE DE GASCOGNE UBY n°3", "23.00€", ""],
      ]],
    ])
    expect(lireUneCarte(t).aVerifier).toEqual([])
  })
})

describe("les autres façons d'écrire une carte", () => {
  it("points de conduite, « : » final, prix décimal sans devise, tiret", () => {
    const t = "Nos plats :\nEntrecôte 300g ........ 32,00 €\nSole meunière - 28,50\nRisotto aux truffes  24"
    expect(resume(t)).toEqual([["Nos plats", [["Entrecôte 300g", "32,00 €", ""], ["Sole meunière", "28,50", ""], ["Risotto aux truffes", "24", ""]]]])
  })
  it("prix seul sur sa ligne : il revient au produit d'avant", () => {
    expect(resume("DESSERTS\nCafé gourmand\n8€\nTiramisu\n7 €")).toEqual([["DESSERTS", [["Café gourmand", "8€", ""], ["Tiramisu", "7 €", ""]]]])
  })
  it("prix au milieu : la suite est la description", () => {
    expect(resume("Mojito 10€ menthe, citron vert")).toEqual([["Carte", [["Mojito", "10€", "menthe, citron vert"]]]])
  })
  it("carte sans devise (« Margherita 9 »)", () => {
    expect(resume("PIZZAS\nMargherita 9\nTomate, mozzarella\n4 fromages 12")).toEqual([["PIZZAS", [["Margherita", "9", "Tomate, mozzarella"], ["4 fromages", "12", ""]]]])
  })
  it("tableur (tabulations) et export point-virgule, titres d'une cellule", () => {
    expect(resume("Cocktails\nMojito\t10€\tMenthe\nSpritz\t8€")).toEqual([["Cocktails", [["Mojito", "10€", "Menthe"], ["Spritz", "8€", ""]]]])
    expect(resume("Softs\nCOCA-COLA;4.10€;\nVITTEL;3.30€;\nChaud\nEXPRESSO;2.00€;")).toEqual([
      ["Softs", [["COCA-COLA", "4.10€", ""], ["VITTEL", "3.30€", ""]]],
      ["Chaud", [["EXPRESSO", "2.00€", ""]]],
    ])
  })
})

describe("ce qui ne se lit pas est dit, pas jeté", () => {
  it("un prix seul en tête, un produit sans prix", () => {
    const c = lireUneCarte("12€\nBOISSONS\nCoca 4€\nCarafe d'eau offerte avec chaque repas, servie fraîche, à volonté")
    expect(c.aVerifier.map(a => a.raison)).toContain("Un prix seul, sans produit avant lui.")
    // Une longue ligne sans prix après un produit : sa description.
    expect(c.sections[0].produits[0].desc).toMatch(/^Carafe d'eau offerte/)
  })
  it("deux titres de suite : pas de section vide", () => {
    expect(resume("CARTE\nCOCKTAILS\nMojito 10€").map(s => s[0])).toEqual(["COCKTAILS"])
  })
  it("plafonds du rendu : 50 produits par onglet (« suite »), 20 onglets", () => {
    const long = ["VINS", ...Array.from({ length: 60 }, (_, i) => `Vin ${i + 1} ${i + 10}€`)].join("\n")
    const c = lireUneCarte(long)
    expect(c.sections.map(s => [s.titre, s.produits.length])).toEqual([["VINS", PRODUITS_PAR_SECTION], ["VINS (suite)", 10]])
    const beaucoup = Array.from({ length: 22 }, (_, i) => `SECTION ${String.fromCharCode(65 + i)}\nProduit ${i} 5€`).join("\n")
    const d = lireUneCarte(beaucoup)
    expect(d.sections).toHaveLength(SECTIONS_MAX)
    expect(d.aVerifier).toHaveLength(2)
  })
})

describe("petites règles", () => {
  it("prixDansLaLigne", () => {
    expect(prixDansLaLigne("Brut 75CL")).toBeNull()
    expect(prixDansLaLigne("Coca-Cola 33cl 4€")).toMatchObject({ avant: "Coca-Cola 33cl", prix: "4€" })
    expect(prixDansLaLigne("Menu 2")).toBeNull()              // entier nu hors mode « sans devise »
  })
  it("allureDeTitre", () => {
    expect(allureDeTitre("LONG DRINK")).toBe(true)
    expect(allureDeTitre("Nos desserts :")).toBe(true)
    expect(allureDeTitre("Havana club 3 ans, menthe")).toBe(false)
  })
})

describe("le bloc créé se relit à l'identique", () => {
  it("contenuDeGrandeCarte → menuTabsViewModel redonne sections et produits", () => {
    const lue = lireUneCarte("LONG DRINK\nMOJITO 10€\nHavana; menthe\nSOFTS\nCoca 4€")
    const vm = menuTabsViewModel(contenuDeGrandeCarte("Notre carte", lue.sections))
    expect(vm.title).toBe("Notre carte")
    expect(vm.sections.map(s => [s.title, s.items.map(i => [i.name, i.price, i.desc])])).toEqual([
      ["LONG DRINK", [["MOJITO", "10€", "Havana, menthe"]]],
      ["SOFTS", [["Coca", "4€", ""]]],
    ])
  })
})
